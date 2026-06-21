"use client";

import { useState, useRef, useTransition } from "react";
import { importSupplierCatalogFromCsv } from "@/lib/actions/importSupplierCatalog";

interface PreviewRow { [key: string]: string; }

// Plantilla con ; (estándar Excel Colombia) + BOM para tildes
const TEMPLATE_ROWS = [
  "Nombre;Nombre Generico;Concentracion;Forma Farmaceutica;Registro INVIMA;Codigo ATC;Lote;Vencimiento (DD/MM/AAAA);Precio Unitario;Stock Disponible;Dias Entrega;Unidad;Control Especial (Si/No);Formula Medica (Si/No)",
  "Dolex Forte 500mg;Paracetamol;500mg;Tableta;INVIMA 2020M-0001234;N02BE01;LOTE-2024-001;31/12/2026;1100;5000;2;UND;No;No",
  "Amoxicilina 500mg;Amoxicilina;500mg;Capsula;INVIMA 2019M-0005678;J01CA04;LOTE-2024-002;30/06/2026;3200;2000;3;CAP;No;Si",
  "Morfina Clorhidrato 10mg;Morfina;10mg/ml;Ampolla;INVIMA 2021M-0009012;N02AA01;LOTE-2024-003;31/03/2027;52000;500;1;AMPOLLA;Si;Si",
  "Omeprazol 20mg;Omeprazol;20mg;Capsula;INVIMA 2018M-0003456;A02BC01;LOTE-2024-004;28/02/2027;1800;3000;2;CAP;No;No",
].join("\r\n");

export default function SupplierCatalogImportClient({ currentOffers = [] }: { currentOffers?: any[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; imported: number; errors: string[]; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectSep = (text: string) => {
    const line = text.split(/\r?\n/)[0] || "";
    return (line.match(/;/g) || []).length >= (line.match(/,/g) || []).length ? ";" : ",";
  };

  const parseCsvPreview = (text: string) => {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return;
    const sep = detectSep(text);
    const headers = lines[0].split(sep).map(h => h.trim().replace(/^\uFEFF/, ""));
    setPreviewHeaders(headers);
    const rows: PreviewRow[] = [];
    for (let i = 1; i <= Math.min(4, lines.length - 1); i++) {
      const vals = lines[i].split(sep).map(v => v.trim().replace(/^"|"$/g, ""));
      const row: PreviewRow = {};
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
    reader.onload = (e) => parseCsvPreview(e.target?.result as string);
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (!csvText) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("csvData", csvText);
      const res = await importSupplierCatalogFromCsv(fd);
      setResult(res);
      if (res.success) { setPreviewRows([]); setCsvText(""); setFileName(""); }
    });
  };

  const downloadTemplate = () => {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + TEMPLATE_ROWS], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_catalogo_proveedor.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCurrentOffers = () => {
    const headers = [
      "Nombre", "Nombre Generico", "Concentracion", "Forma Farmaceutica", "Registro INVIMA",
      "Codigo ATC", "Lote", "Vencimiento (DD/MM/AAAA)", "Precio Unitario", "Stock Disponible",
      "Dias Entrega", "Unidad", "Control Especial (Si/No)", "Formula Medica (Si/No)"
    ];
    
    const csvRows = [headers.join(";")];
    
    currentOffers.forEach(o => {
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
        o.name || "",
        o.genericName || "",
        o.concentration || "",
        o.pharmaceuticalForm || "",
        o.invimaSanitary || "",
        o.atcCode || "",
        o.lot || "",
        formatDate(o.expiryDate),
        o.price !== undefined ? o.price : 0,
        o.availableStock !== undefined ? o.availableStock : 0,
        o.leadTimeDays !== undefined ? o.leadTimeDays : 3,
        o.unit || "UND",
        o.controlled ? "Si" : "No",
        o.requiresPrescription ? "Si" : "No"
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
    a.download = `catalogo_actual_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRows = csvText ? csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim()).length - 1 : 0;

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
        <span>📥</span> Importar Catálogo desde Excel / CSV
      </button>
    );
  }

  return (
    <div id="importar-catalogo" className="card" style={{ marginBottom: "1.5rem", border: "2px solid rgba(16,185,129,0.35)" }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="card-title">📥 Carga Masiva de Catálogo (CSV / Excel)</div>
        <button type="button"
          onClick={() => { setIsOpen(false); setPreviewRows([]); setCsvText(""); setResult(null); }}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer" }}>✕
        </button>
      </div>

      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Instrucciones */}
        <div style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 700, color: "#34d399", margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>
            📋 Formato del archivo de catálogo
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 0.75rem 0", lineHeight: 1.6 }}>
            Las columnas <strong style={{ color: "white" }}>Nombre</strong>, <strong style={{ color: "white" }}>Precio Unitario</strong> y <strong style={{ color: "white" }}>Stock Disponible</strong> son obligatorias.
            Fecha en formato <code style={{ color: "#34d399" }}>DD/MM/AAAA</code>. Si tu Excel tiene comas, guárdalo como CSV con separador de punto y coma (;).
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <button type="button" onClick={downloadTemplate}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399", padding: "0.4rem 0.9rem", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
              ⬇️ Descargar Plantilla CSV
            </button>
            <button type="button" onClick={exportCurrentOffers}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa", padding: "0.4rem 0.9rem", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
              📥 Descargar Catálogo Actual (CSV)
            </button>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
            Columnas: Nombre · Nombre Generico · Concentracion · Forma Farmaceutica · INVIMA · Lote · Vencimiento · <strong>Precio Unitario</strong> · <strong>Stock Disponible</strong> · <strong>Dias Entrega</strong> · Unidad · Control Especial · Formula Medica
          </span>
        </div>

        {/* Zona drag & drop */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "#34d399" : "rgba(255,255,255,0.15)"}`,
            borderRadius: "12px", padding: "2.5rem 1.5rem",
            textAlign: "center", cursor: "pointer",
            background: isDragging ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s"
          }}>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{fileName ? "✅" : "📂"}</div>
          {fileName ? (
            <>
              <p style={{ color: "#34d399", fontWeight: 700, margin: "0 0 0.25rem 0" }}>{fileName}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>
                {totalRows > 0 ? `${totalRows} producto(s) detectados · Mostrando primeras ${previewRows.length} filas` : "Analizando..."}
              </p>
            </>
          ) : (
            <>
              <p style={{ color: "white", fontWeight: 700, margin: "0 0 0.25rem 0" }}>
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>
                Acepta .CSV · .XLSX · .XLS
              </p>
            </>
          )}
        </div>

        {/* Vista previa */}
        {previewRows.length > 0 && (
          <div>
            <p style={{ fontWeight: 700, color: "#34d399", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              👁️ Vista previa — {previewRows.length} de {totalRows} productos:
            </p>
            <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "rgba(16,185,129,0.08)" }}>
                    {previewHeaders.map((h, i) => (
                      <th key={i} style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "#34d399", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid var(--border)" }}>
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
                          {row[h] || <span style={{ opacity: 0.35 }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.4rem" }}>
              ℹ️ Los productos se publicarán en tu catálogo y serán visibles para las IPS conectadas.
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

        {/* Botones */}
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
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: totalRows > 0 ? "linear-gradient(135deg,#10b981,#059669)" : undefined }}>
            {isPending
              ? <>⏳ Publicando en catálogo...</>
              : <>📥 Publicar {totalRows > 0 ? `${totalRows} productos` : ""} en Catálogo</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
