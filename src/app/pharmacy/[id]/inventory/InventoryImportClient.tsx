"use client";

import { useState, useRef, useTransition } from "react";
import { importInventoryFromCsv } from "@/lib/actions/importInventory";

interface PreviewRow {
  name: string;
  genericName: string;
  concentration: string;
  pharmaceuticalForm: string;
  stock: string;
  lot: string;
  expiryDate: string;
  unitCost: string;
  category: string;
  [key: string]: string;
}

// Plantilla con ; como separador (estándar Excel Colombia/España)
// Las columnas obligatorias son: Nombre, Stock, Vencimiento
const TEMPLATE_CSV = [
  "Nombre;Nombre Generico;Concentracion;Forma Farmaceutica;Registro INVIMA;Stock Inicial;Stock Minimo;Stock Maximo;Costo Unitario;Precio Venta;Unidad;Lote;Vencimiento (DD/MM/AAAA);Categoria;Ubicacion en Farmacia;Control Especial (Si/No);Formula Medica (Si/No)",
  "Acetaminofen 500mg;Paracetamol;500mg;Tableta;INVIMA 2020M-0001234;200;20;1000;850;1200;UND;LOTE-2024-001;31/12/2026;Analgesico;Estante A-1;No;No",
  "Amoxicilina 500mg;Amoxicilina;500mg;Capsula;INVIMA 2019M-0005678;100;10;500;2500;3800;CAP;LOTE-2024-002;30/06/2026;Antibiotico;Estante B-2;No;Si",
  "Morfina 10mg/ml;Morfina;10mg/ml;Ampolla;INVIMA 2021M-0009012;30;5;100;45000;65000;AMP;LOTE-2024-003;31/03/2027;Analgesico;Caja Fuerte;Si;Si",
].join("\r\n");

export default function InventoryImportClient({ currentProducts = [] }: { currentProducts?: any[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; imported: number; errors: string[]; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detecta si el separador es ; o ,
  const detectSep = (text: string): string => {
    const firstLine = text.split(/\r?\n/)[0] || "";
    const semis = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    return semis >= commas ? ";" : ",";
  };

  const parseCsvPreview = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return;
    const sep = detectSep(text);
    const headers = lines[0].split(sep).map(h => h.trim().replace(/^\uFEFF/, ""));
    setPreviewHeaders(headers);
    const rows: PreviewRow[] = [];
    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
      const vals = lines[i].split(sep).map(v => v.trim().replace(/^"|"$/g, ""));
      const row: PreviewRow = { name: "", genericName: "", concentration: "", pharmaceuticalForm: "", stock: "", lot: "", expiryDate: "", unitCost: "", category: "" };
      headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });
      rows.push(row);
    }
    setPreviewRows(rows);
    setCsvText(text);
  };

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCsvPreview(text);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      handleFile(file);
    }
  };

  const handleImport = () => {
    if (!csvText) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("csvData", csvText);
      const res = await importInventoryFromCsv(fd);
      setResult(res);
      if (res.success) {
        setPreviewRows([]);
        setCsvText("");
        setFileName("");
      }
    });
  };

  const downloadTemplate = () => {
    // BOM UTF-8 (\uFEFF) para que Excel muestre tildes correctamente
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_inventario_stratos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCurrentInventory = () => {
    const headers = [
      "Nombre", "Nombre Generico", "Concentracion", "Forma Farmaceutica", "Registro INVIMA",
      "Stock Inicial", "Stock Minimo", "Stock Maximo", "Costo Unitario", "Precio Venta",
      "Unidad", "Lote", "Vencimiento (DD/MM/AAAA)", "Categoria", "Ubicacion en Farmacia",
      "Control Especial (Si/No)", "Formula Medica (Si/No)"
    ];
    
    const csvRows = [headers.join(";")];
    
    currentProducts.forEach(p => {
      const formatDate = (d: any) => {
        if (!d) return "";
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return "";
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const year = dateObj.getUTCFullYear();
        return `${day}/${month}/${year}`;
      };

      const row = [
        p.name || "",
        p.genericName || "",
        p.concentration || "",
        p.pharmaceuticalForm || "",
        p.invimaSanitary || "",
        p.stock !== undefined ? p.stock : 0,
        p.minStock !== undefined ? p.minStock : 10,
        p.maxStock !== undefined ? p.maxStock : 500,
        p.unitCost !== undefined ? p.unitCost : 0,
        p.salePrice !== undefined ? p.salePrice : 0,
        p.unit || "UND",
        p.lot || "",
        formatDate(p.expiryDate),
        p.category || "",
        p.location || "",
        p.controlled ? "Si" : "No",
        p.requiresPrescription ? "Si" : "No"
      ];
      const cleanRow = row.map(val => {
        const s = String(val).replace(/"/g, '""');
        return s.includes(";") ? `"${s}"` : s;
      });
      csvRows.push(cleanRow.join(";"));
    });

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario_actual_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
      >
        <span style={{ fontSize: "1.1rem" }}>📥</span>
        Importar desde Excel / CSV
      </button>
    );
  }

  return (
    <div id="importar" className="card" style={{ marginBottom: "1.5rem", border: "2px solid rgba(96,165,250,0.3)" }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="card-title">📥 Importación Masiva de Inventario (CSV / Excel)</div>
        <button type="button" onClick={() => { setIsOpen(false); setPreviewRows([]); setCsvText(""); setResult(null); }}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Instrucciones + Plantilla */}
        <div style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 700, color: "#60a5fa", margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>
            📋 Formato requerido del archivo
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 0.75rem 0", lineHeight: 1.6 }}>
            El archivo CSV debe tener las columnas en la primera fila. Las columnas <strong style={{ color: "white" }}>nombre</strong>, <strong style={{ color: "white" }}>stock</strong> y <strong style={{ color: "white" }}>fecha_vencimiento</strong> son obligatorias.
            Formatos de fecha aceptados: <code style={{ color: "#60a5fa" }}>DD/MM/YYYY</code> o <code style={{ color: "#60a5fa" }}>YYYY-MM-DD</code>.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            <button type="button" onClick={downloadTemplate}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399", padding: "0.4rem 0.9rem", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
              ⬇️ Descargar Plantilla CSV
            </button>
            <button type="button" onClick={exportCurrentInventory}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa", padding: "0.4rem 0.9rem", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
              📥 Descargar Inventario Actual (CSV)
            </button>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
            Columnas: nombre, nombre_generico, concentracion, forma_farmaceutica, invima, stock, stock_minimo, stock_maximo, costo_unitario, precio_venta, unidad, lote, vencimiento, categoria, ubicacion, control_especial, formula_medica
          </span>
        </div>

        {/* Zona de carga */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "#60a5fa" : "rgba(255,255,255,0.15)"}`,
            borderRadius: "12px",
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s"
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
            {fileName ? "✅" : "📂"}
          </div>
          {fileName ? (
            <>
              <p style={{ color: "#60a5fa", fontWeight: 700, margin: "0 0 0.25rem 0" }}>{fileName}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>
                {previewRows.length > 0 ? `Vista previa: ${previewRows.length} de las primeras filas` : "Analizando..."}
              </p>
            </>
          ) : (
            <>
              <p style={{ color: "white", fontWeight: 700, margin: "0 0 0.25rem 0" }}>
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>
                Formatos aceptados: .CSV · .XLSX · .XLS (Excel exportado como CSV)
              </p>
            </>
          )}
        </div>

        {/* Preview tabla */}
        {previewRows.length > 0 && (
          <div>
            <p style={{ fontWeight: 700, color: "#60a5fa", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              👁️ Vista previa (primeras {previewRows.length} filas de {csvText.split(/\r?\n/).filter(l => l.trim()).length - 1} total):
            </p>
            <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                    {previewHeaders.map((h, i) => (
                      <th key={i} style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "#60a5fa", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid var(--border)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {previewHeaders.map((h, ci) => (
                        <td key={ci} style={{ padding: "0.45rem 0.75rem", color: row[h] ? "var(--text)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {row[h] || <span style={{ opacity: 0.4 }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.4rem" }}>
              ⚠️ Revisa que los datos sean correctos antes de importar. La importación no se puede deshacer automáticamente.
            </p>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className={`alert ${result.success ? "alert-success" : "alert-danger"}`} style={{ marginBottom: 0 }}>
            <strong>{result.message}</strong>
            {result.errors.length > 0 && (
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem", fontSize: "0.82rem" }}>
                {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                {result.errors.length > 5 && <li>...y {result.errors.length - 5} errores más.</li>}
              </ul>
            )}
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
          <button type="button"
            onClick={() => { setPreviewRows([]); setCsvText(""); setFileName(""); setResult(null); }}
            className="btn btn-secondary" disabled={isPending}>
            Limpiar
          </button>
          <button type="button"
            onClick={handleImport}
            className="btn btn-primary"
            disabled={isPending || !csvText || previewRows.length === 0}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            {isPending ? (
              <>⏳ Importando...</>
            ) : (
              <>📥 Importar {csvText ? `${csvText.split(/\r?\n/).filter(l => l.trim()).length - 1} productos` : ""}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
