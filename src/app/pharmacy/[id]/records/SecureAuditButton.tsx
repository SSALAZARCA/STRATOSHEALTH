"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyAccess2FA } from "@/lib/actions/audit";

export function SecureAuditButton({ patientId, tenantId }: { patientId: string, tenantId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleVerify = async () => {
    if (token.length < 6) return setError("El código debe tener 6 dígitos.");
    setLoading(true);
    setError("");
    try {
      // Intentar obtener IP (simplificado, usualmente viene de headers en server, pero el server action puede extraerlo del request si NextJS lo permite,
      // para esta prueba pasamos string vacio o userAgent)
      await verifyAccess2FA(patientId, token, "Navegador Cliente");
      setShowModal(false);
      router.push(`/pharmacy/${tenantId}/patients/${patientId}/history`);
    } catch (err: any) {
      setError(err.message || "Error al verificar 2FA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn btn-sm btn-primary">
        Auditar
      </button>

      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="card" style={{ width: "400px", padding: "2rem" }}>
            <h3 style={{ marginTop: 0 }}>Seguridad 2FA Requerida</h3>
            <p className="text-muted text-sm mb-4">Ingrese su código de Google Authenticator para acceder a la historia clínica de este paciente. Este acceso quedará auditado.</p>
            
            <input 
              type="text" 
              maxLength={6} 
              placeholder="000000" 
              className="form-control" 
              style={{ fontSize: "2rem", textAlign: "center", letterSpacing: "0.5rem" }}
              value={token}
              onChange={e => setToken(e.target.value)}
            />
            
            {error && <div className="text-danger mt-2 text-sm text-center">{error}</div>}
            
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={loading} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleVerify} disabled={loading} style={{ flex: 1 }}>
                {loading ? "Verificando..." : "Acceder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
