"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Logo } from "@/components/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(errorParam || null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("Credenciales inválidas");
        } else {
          setError(`Error de autenticación: ${res.error}`);
        }
      } else {
        const session = await getSession();
        if (session?.user) {
          const role = session.user.role;
          const tenantId = session.user.tenantId;

          if (role === "SUPERADMIN") {
            router.push("/superadmin/dashboard");
          } else if (role === "SUPPLIER_ADMIN") {
            router.push("/supplier/dashboard");
          } else if (tenantId) {
            if (role === "NURSE") router.push(`/pharmacy/${tenantId}/dashboard/nurse`);
            else if (role === "DOCTOR") router.push(`/pharmacy/${tenantId}/dashboard/doctor`);
            else if (role === "RECORDS_MANAGER") router.push(`/pharmacy/${tenantId}/records`);
            else if (role === "PHARMACIST") router.push(`/pharmacy/${tenantId}/dashboard/pharmacist`);
            else if (role === "MANAGER") router.push(`/pharmacy/${tenantId}/dashboard/manager`);
            else router.push(`/pharmacy/${tenantId}/dashboard`);
          } else {
            router.push("/");
          }
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white", padding: "1rem"
    }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "2.5rem", background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <Logo variant="dark" size={48} showText={true} />
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>SaaS Multi-tenant Farmacéutico</p>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", opacity: 0.5, border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "2px 8px", background: "rgba(255,255,255,0.05)", marginTop: "0.25rem" }}>v1.3.0 - SSL Proxy Bypass</span>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="tu@correo.com" 
              className="form-control" 
              style={{ width: "100%" }} 
              disabled={loading}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="••••••••" 
              className="form-control" 
              style={{ width: "100%" }} 
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.875rem", marginTop: "0.5rem", fontWeight: 600 }} disabled={loading}>
            {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Cuentas de prueba (Clave: 123456)</p>
          <ul style={{ paddingLeft: "1rem", margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <li><strong>Superadmin:</strong> admin@stratoshealth.com</li>
            <li><strong>Gerente:</strong> gerencia@clinicasanrafael.com</li>
            <li><strong>Regente:</strong> regente@clinicasanrafael.com</li>
            <li><strong>Enfermera:</strong> enfermera@clinicasanrafael.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ color: "white", textAlign: "center", marginTop: "2rem" }}>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
