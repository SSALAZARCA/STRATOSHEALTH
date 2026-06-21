"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function importSupplierCatalogFromCsv(formData: FormData): Promise<{
  success: boolean;
  imported: number;
  errors: string[];
  message: string;
}> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, imported: 0, errors: [], message: "No autenticado." };
  }

  const supplier = await prisma.globalSupplier.findUnique({
    where: { email: session.user.email },
  });

  if (!supplier) {
    return { success: false, imported: 0, errors: [], message: "Proveedor no encontrado." };
  }

  const csvText = formData.get("csvData") as string;
  if (!csvText) {
    return { success: false, imported: 0, errors: [], message: "Datos incompletos." };
  }

  // Strip BOM y dividir líneas
  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    return { success: false, imported: 0, errors: [], message: "El archivo no tiene datos suficientes." };
  }

  // Auto-detectar separador (; o ,)
  const firstLine = lines[0];
  const semis = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const SEP = semis >= commas ? ";" : ",";

  // Normalizar nombres de cabecera
  const normalizeHeader = (h: string) =>
    h.trim().toLowerCase()
      .replace(/\uFEFF/g, "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  const header = firstLine.split(SEP).map(normalizeHeader);

  // Mapa flexible de columnas
  const colMap: Record<string, string[]> = {
    nombre:             ["nombre", "name"],
    nombre_generico:    ["nombre_generico", "generic_name", "generico"],
    concentracion:      ["concentracion", "concentration"],
    forma_farmaceutica: ["forma_farmaceutica", "pharmaceutical_form"],
    invima:             ["registro_invima", "invima", "invima_sanitary"],
    codigo_atc:         ["codigo_atc", "atc_code", "atc"],
    lote:               ["lote", "lot"],
    vencimiento:        ["vencimiento_dd_mm_aaaa", "vencimiento", "expiry_date", "fecha_vencimiento"],
    precio:             ["precio_unitario", "precio", "price", "precio_venta"],
    stock_disponible:   ["stock_disponible", "available_stock", "stock", "stock_b2b"],
    dias_entrega:       ["dias_entrega", "lead_time_days", "tiempo_entrega", "plazo_dias"],
    unidad:             ["unidad", "unit"],
    control_especial:   ["control_especial_si_no", "control_especial", "controlled"],
    formula_medica:     ["formula_medica_si_no", "formula_medica", "requires_prescription"],
  };

  const getCol = (row: string[], key: string): string => {
    for (const alias of (colMap[key] || [key])) {
      const idx = header.indexOf(alias);
      if (idx >= 0) return (row[idx] || "").trim();
    }
    return "";
  };

  const errors: string[] = [];
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;

    // Dividir fila respetando comillas
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of raw) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === SEP && !inQuotes) { row.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    row.push(current.trim());

    const name = getCol(row, "nombre");
    if (!name) {
      errors.push(`Fila ${i + 1}: falta el nombre del producto.`);
      continue;
    }

    const price = parseFloat((getCol(row, "precio") || "0").replace(/[^0-9.]/g, ""));
    const availableStock = parseInt(getCol(row, "stock_disponible") || "0") || 0;
    const leadTimeDays = parseInt(getCol(row, "dias_entrega") || "3") || 3;

    if (!price || price <= 0) {
      errors.push(`Fila ${i + 1} (${name}): el precio debe ser mayor a 0.`);
      continue;
    }

    const expiryRaw = getCol(row, "vencimiento");
    let expiryDate: Date | null = null;
    if (expiryRaw) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(expiryRaw)) {
        const [d, m, y] = expiryRaw.split("/");
        expiryDate = new Date(`${y}-${m}-${d}`);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(expiryRaw)) {
        expiryDate = new Date(expiryRaw);
      }
    }

    const controlledRaw = getCol(row, "control_especial").toLowerCase();
    const prescRaw = getCol(row, "formula_medica").toLowerCase();
    const isYes = (v: string) => ["si", "sí", "yes", "true", "1", "x"].includes(v);

    try {
      await prisma.supplierOffer.create({
        data: {
          supplierId: supplier.id,
          name,
          genericName: getCol(row, "nombre_generico") || name,
          concentration: getCol(row, "concentracion") || null,
          pharmaceuticalForm: getCol(row, "forma_farmaceutica") || null,
          invimaSanitary: getCol(row, "invima") || null,
          atcCode: getCol(row, "codigo_atc") || null,
          lot: getCol(row, "lote") || null,
          expiryDate,
          price,
          availableStock,
          leadTimeDays,
          unit: getCol(row, "unidad") || "UND",
          controlled: isYes(controlledRaw),
          requiresPrescription: isYes(prescRaw),
        },
      });
      imported++;
    } catch (err: any) {
      errors.push(`Error al guardar "${name}": ${err.message}`);
    }
  }

  if (imported > 0) {
    revalidatePath("/supplier/catalog");
  }

  return {
    success: imported > 0,
    imported,
    errors,
    message: imported > 0
      ? `✅ ${imported} productos publicados en tu catálogo.${errors.length > 0 ? ` (${errors.length} filas con errores)` : ""}`
      : `❌ No se publicó ningún producto. ${errors.length} errores encontrados.`,
  };
}
