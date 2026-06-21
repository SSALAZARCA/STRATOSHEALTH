"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const prisma = new PrismaClient();

interface ProductRow {
  name: string;
  genericName: string;
  concentration?: string;
  pharmaceuticalForm?: string;
  invimaSanitary?: string;
  atcCode?: string;
  stock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  salePrice: number;
  unit: string;
  lot?: string;
  expiryDate?: string;
  category?: string;
  location?: string;
  controlled: boolean;
  requiresPrescription: boolean;
}

export async function importInventoryFromCsv(formData: FormData): Promise<{
  success: boolean;
  imported: number;
  errors: string[];
  message: string;
}> {
  const session = await auth();
  if (!session?.user || !["PHARMACIST", "MANAGER"].includes(session.user.role as string)) {
    return { success: false, imported: 0, errors: ["Sin permisos"], message: "Sin permisos para importar inventario." };
  }

  const tenantId = session.user.tenantId as string;
  const csvText = formData.get("csvData") as string;

  if (!csvText || !tenantId) {
    return { success: false, imported: 0, errors: [], message: "Datos incompletos." };
  }

  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    return { success: false, imported: 0, errors: [], message: "El archivo no tiene datos suficientes." };
  }

  // Auto-detectar separador (; o ,)
  const firstLine = lines[0];
  const semis = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const SEP = semis >= commas ? ";" : ",";

  // Parse CSV header - normalizar nombres de columna
  const normalizeHeader = (h: string) =>
    h.trim().toLowerCase()
      .replace(/\uFEFF/g, "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar tildes
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  const header = firstLine.split(SEP).map(normalizeHeader);
  const errors: string[] = [];
  const products: ProductRow[] = [];

  // Mapa flexible de columnas (nombres nuevos y legados)
  const colMap: Record<string, string[]> = {
    nombre:               ["nombre", "name"],
    nombre_generico:      ["nombre_generico", "generic_name", "generico"],
    concentracion:        ["concentracion", "concentration"],
    forma_farmaceutica:   ["forma_farmaceutica", "pharmaceutical_form"],
    invima:               ["registro_invima", "invima", "invima_sanitary"],
    stock:                ["stock_inicial", "stock"],
    stock_minimo:         ["stock_minimo", "min_stock"],
    stock_maximo:         ["stock_maximo", "max_stock"],
    costo_unitario:       ["costo_unitario", "unit_cost"],
    precio_venta:         ["precio_venta", "sale_price"],
    unidad:               ["unidad", "unit"],
    lote:                 ["lote", "lot"],
    vencimiento:          ["vencimiento_dd_mm_aaaa", "vencimiento", "expiry_date", "fecha_vencimiento"],
    categoria:            ["categoria", "category"],
    ubicacion:            ["ubicacion_en_farmacia", "ubicacion", "location"],
    control_especial:     ["control_especial_si_no", "control_especial", "controlled"],
    formula_medica:       ["formula_medica_si_no", "formula_medica", "requires_prescription"],
  };

  const getCol = (row: string[], key: string): string => {
    const aliases = colMap[key] || [key];
    for (const alias of aliases) {
      const idx = header.indexOf(alias);
      if (idx >= 0) return (row[idx] || "").trim();
    }
    return "";
  };

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;

    // Dividir fila usando el separador detectado
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
    const genericName = getCol(row, "nombre_generico") || name;

    if (!name) {
      errors.push(`Fila ${i + 1}: falta el nombre del producto.`);
      continue;
    }

    const expiryRaw = getCol(row, "vencimiento");
    let expiryDate: string | undefined;
    if (expiryRaw) {
      // Accept DD/MM/YYYY or YYYY-MM-DD
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(expiryRaw)) {
        const [d, m, y] = expiryRaw.split("/");
        expiryDate = `${y}-${m}-${d}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(expiryRaw)) {
        expiryDate = expiryRaw;
      }
    }

    const controlledRaw = getCol(row, "control_especial").toLowerCase();
    const prescRaw = getCol(row, "formula_medica").toLowerCase();

    products.push({
      name,
      genericName,
      concentration: getCol(row, "concentracion") || undefined,
      pharmaceuticalForm: getCol(row, "forma_farmaceutica") || undefined,
      invimaSanitary: getCol(row, "invima") || undefined,
      atcCode: undefined,
      stock: parseInt(getCol(row, "stock") || "0") || 0,
      minStock: parseInt(getCol(row, "stock_minimo") || "10") || 10,
      maxStock: parseInt(getCol(row, "stock_maximo") || "500") || 500,
      unitCost: parseFloat((getCol(row, "costo_unitario") || "0").replace(/[^0-9.]/g, "")) || 0,
      salePrice: parseFloat((getCol(row, "precio_venta") || "0").replace(/[^0-9.]/g, "")) || 0,
      unit: getCol(row, "unidad") || "UND",
      lot: getCol(row, "lote") || undefined,
      expiryDate,
      category: getCol(row, "categoria") || undefined,
      location: getCol(row, "ubicacion") || undefined,
      controlled: ["si", "sí", "yes", "true", "1", "x"].includes(controlledRaw),
      requiresPrescription: ["si", "sí", "yes", "true", "1", "x"].includes(prescRaw),
    });
  }

  if (products.length === 0) {
    return { success: false, imported: 0, errors, message: "No se encontraron productos válidos para importar." };
  }

  let imported = 0;
  for (const p of products) {
    try {
      await prisma.product.create({
        data: {
          tenantId,
          name: p.name,
          genericName: p.genericName,
          concentration: p.concentration || null,
          pharmaceuticalForm: p.pharmaceuticalForm || null,
          invimaSanitary: p.invimaSanitary || null,
          atcCode: p.atcCode || null,
          stock: p.stock,
          minStock: p.minStock,
          maxStock: p.maxStock,
          unitCost: p.unitCost,
          salePrice: p.salePrice,
          unit: p.unit,
          lot: p.lot || null,
          expiryDate: p.expiryDate ? new Date(p.expiryDate) : null,
          category: p.category || null,
          location: p.location || null,
          controlled: p.controlled,
          requiresPrescription: p.requiresPrescription,
        },
      });
      imported++;
    } catch (err: any) {
      errors.push(`Error al guardar "${p.name}": ${err.message}`);
    }
  }

  if (imported > 0) {
    await prisma.auditLog.create({
      data: {
        action: "IMPORT_INVENTORY_CSV",
        details: `Importación masiva CSV: ${imported} productos registrados por ${session.user.email}`,
        tenantId,
      },
    });
    revalidatePath(`/pharmacy/${tenantId}/inventory`);
  }

  return {
    success: imported > 0,
    imported,
    errors,
    message: imported > 0
      ? `✅ ${imported} productos importados exitosamente.${errors.length > 0 ? ` (${errors.length} filas con errores)` : ""}`
      : `❌ No se importó ningún producto. ${errors.length} errores encontrados.`,
  };
}
