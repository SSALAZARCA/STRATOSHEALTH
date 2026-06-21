import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await searchParams;

  async function authenticate(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case "CredentialsSignin":
            redirect("/login?error=Credenciales+inválidas");
          default:
            redirect("/login?error=Error+de+autenticación");
        }
      }
      throw error;
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white", padding: "1rem"
    }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "2.5rem", background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <Logo variant="dark" size={48} showText={true} />
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>SaaS Multi-tenant Farmacéutico</p>
        </div>

        {resolvedParams.error && (
          <div className="alert alert-danger" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            ❌ {resolvedParams.error}
          </div>
        )}

        <form action={authenticate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>Correo Electrónico</label>
            <input type="email" name="email" required placeholder="tu@correo.com" className="form-control" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>Contraseña</label>
            <input type="password" name="password" required placeholder="••••••••" className="form-control" style={{ width: "100%" }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.875rem", marginTop: "0.5rem", fontWeight: 600 }}>
            Iniciar Sesión
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
