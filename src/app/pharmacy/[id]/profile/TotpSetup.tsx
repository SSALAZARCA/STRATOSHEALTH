"use client";

import { useState } from "react";
import { generateTotpSecret, verifyAndEnableTotp, disableTotp } from "@/lib/actions/auth";

export default function TotpSetup({ hasTotp }: { hasTotp: boolean }) {
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStartSetup() {
    setLoading(true);
    try {
      const data = await generateTotpSecret();
      setSetupData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError("");
    try {
      await verifyAndEnableTotp(setupData!.secret, token);
      setSetupData(null);
      setToken("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!confirm("¿Está seguro de deshabilitar la seguridad 2FA? No podrá firmar historias clínicas.")) return;
    setLoading(true);
    try {
      await disableTotp();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (hasTotp && !setupData) {
    return (
      <div className="alert alert-success">
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>✅ Google Authenticator Activado</h3>
        <p className="text-sm">Su cuenta está protegida. Utilice su aplicación móvil para generar el código de 6 dígitos cada vez que necesite firmar una historia clínica.</p>
        <button onClick={handleDisable} className="btn btn-danger btn-sm mt-4" disabled={loading}>
          {loading ? "Procesando..." : "Deshabilitar 2FA (No recomendado)"}
        </button>
      </div>
    );
  }

  if (setupData) {
    return (
      <div className="totp-setup-container">
        <div className="alert alert-warning text-sm">
          <strong>Paso 1:</strong> Escanee este código QR con la aplicación Google Authenticator o Microsoft Authenticator en su celular.
        </div>
        
        <div style={{ background: "white", padding: "1rem", borderRadius: "12px", display: "inline-block", marginBottom: "1rem", border: "1px solid #e2e8f0" }}>
          <img src={setupData.qrCodeDataUrl} alt="QR Code" style={{ width: "200px", height: "200px" }} />
        </div>
        
        <div className="form-group mb-4">
          <label className="form-label">Paso 2: Ingrese el código de 6 dígitos que aparece en la app</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Ej: 123456" 
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
          />
        </div>

        {error && <div className="alert alert-danger p-2 text-sm">{error}</div>}

        <div className="flex gap-2">
          <button onClick={handleVerify} className="btn btn-primary" disabled={loading || token.length !== 6}>
            {loading ? "Verificando..." : "Activar Seguridad"}
          </button>
          <button onClick={() => setSetupData(null)} className="btn btn-secondary" disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="alert alert-warning">
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>⚠️ Google Authenticator Inactivo</h3>
        <p className="text-sm">Actualmente está usando un PIN básico y vulnerable. Para cumplir con la ley de inmutabilidad, active la autenticación en dos pasos.</p>
      </div>
      {error && <div className="alert alert-danger p-2 text-sm">{error}</div>}
      <button onClick={handleStartSetup} className="btn btn-primary" disabled={loading}>
        {loading ? "Generando QR..." : "Configurar Google Authenticator"}
      </button>
    </div>
  );
}
