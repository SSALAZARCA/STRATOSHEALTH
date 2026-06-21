"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logDocumentExport } from "@/lib/actions/audit";

export function PdfExportButton({ patientId, tenantId }: { patientId: string, tenantId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [justification, setJustification] = useState("");
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length < 6) return setError("El código debe tener 6 dígitos.");
    if (justification.length < 10) return setError("Debe proveer una justificación legal válida (mín. 10 caracteres).");
    
    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("patientId", patientId);
      formData.append("token", token);
      formData.append("justification", justification);
      formData.append("ipAddress", "Navegador Cliente");
      if (file) {
        formData.append("file", file);
      }

      const res = await logDocumentExport(formData);
      
      if (res.success) {
        setShowModal(false);
        // Abrir la vista de impresión en una nueva pestaña usando el logId como comprobante
        window.open(`/pharmacy/${tenantId}/patients/${patientId}/history/print?logId=${res.logId}`, "_blank");
      }
    } catch (err: any) {
      setError(err.message || "Error al generar la exportación legal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Exportar PDF Legal
      </button>

      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="card" style={{ width: "500px", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0, color: "var(--primary)" }}>Exportación Oficial de Historia</h3>
            <p className="text-muted text-sm mb-4">La exportación generará un documento en formato oficial. Este acceso es estrictamente vigilado y dejará un rastro inalterable de auditoría.</p>
            
            <form onSubmit={handleExport} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>Justificación del Requerimiento *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Ej. Solicitud fiscal mediante oficio 123, o traslado de paciente..."
                  className="form-control"
                  style={{ width: "100%", resize: "vertical" }}
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                ></textarea>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>Documento Soporte (Opcional)</label>
                <input 
                  type="file" 
                  className="form-control" 
                  style={{ width: "100%", padding: "0.5rem" }}
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <div className="text-sm text-muted mt-1">Cargue un PDF o imagen con la orden judicial o requerimiento.</div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "0.5rem 0" }} />

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--warning)" }}>Firma Electrónica (Google Authenticator) *</label>
                <input 
                  type="text" 
                  maxLength={6} 
                  required
                  placeholder="000000" 
                  className="form-control" 
                  style={{ fontSize: "2rem", textAlign: "center", letterSpacing: "0.5rem", width: "100%" }}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                />
              </div>
              
              {error && <div className="text-danger mt-2 text-sm text-center">{error}</div>}
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={loading} style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? "Generando..." : "Firmar y Descargar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
