import Link from "next/link";
import { ReactNode } from "react";
import { auth } from "@/auth";
import { SidebarNav } from "./SidebarNav"; 
import { Logo } from "@/components/Logo";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function PharmacyLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user) return null; // El middleware ya protege esto
  
  const role = session.user.role;
  const name = session.user.name;

  // 1. Obtener la clínica y su plan
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { plan: true }
  });

  if (!tenant) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white", padding: "2rem", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "500px", padding: "2rem", background: "#1e293b", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ fontSize: "1.75rem", color: "#f87171", margin: "0 0 1rem 0" }}>Clínica No Encontrada</h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>El identificador de clínica proporcionado no es válido o no está registrado en el sistema.</p>
        </div>
      </div>
    );
  }

  // 2. Verificar estado de la suscripción
  const isExpired = tenant.nextBillingDate ? new Date(tenant.nextBillingDate) < new Date() : false;
  const isSuspended = tenant.subscriptionStatus !== "ACTIVE" || isExpired;

  // 3. Leer el pathname actual desde los headers
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isSubscriptionPage = pathname.endsWith("/subscription");

  // Si está suspendido y no está en la página de suscripción, bloqueamos el acceso
  if (isSuspended && !isSubscriptionPage) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "white",
        padding: "2rem",
        fontFamily: "sans-serif"
      }}>
        <div style={{
          maxWidth: "550px",
          width: "100%",
          padding: "2.5rem",
          background: "rgba(30, 41, 59, 0.7)",
          backdropFilter: "blur(20px)",
          borderRadius: "16px",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          textAlign: "center",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#ef4444", margin: "0 0 1rem 0" }}>Servicio Suspendido</h2>
          <p style={{ color: "#e2e8f0", fontSize: "1.1rem", lineHeight: 1.6, margin: "0 0 1.5rem 0" }}>
            El acceso a la plataforma <strong>Stratos Health</strong> para <strong>{tenant.name}</strong> se encuentra temporalmente inactivo debido a que el periodo de tu plan de suscripción ha expirado.
          </p>

          <div style={{
            background: "rgba(0, 0, 0, 0.2)",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            marginBottom: "2rem",
            fontSize: "0.9rem",
            color: "#94a3b8"
          }}>
            <div><strong>Plan Contratado:</strong> {tenant.plan?.name || "Básico Legacy"}</div>
            <div style={{ marginTop: "0.5rem" }}>
              <strong>Fecha Límite de Pago:</strong> {tenant.nextBillingDate ? new Date(tenant.nextBillingDate).toLocaleDateString("es-CO", { day: 'numeric', month: 'long', year: 'numeric' }) : "No definida"}
            </div>
          </div>

          {role === "MANAGER" ? (
            <div>
              <p style={{ color: "#cbd5e1", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                Como administrador de la clínica, puedes renovar el plan contratado o cambiar a uno superior de forma inmediata.
              </p>
              <Link 
                href={`/pharmacy/${id}/subscription`}
                style={{
                  display: "inline-block",
                  padding: "0.75rem 2rem",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 700,
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)",
                  transition: "transform 0.2s"
                }}
              >
                💳 Renovar / Reactivar Suscripción
              </Link>
            </div>
          ) : (
            <div>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Comunícate con el Gerente o Administrador de la clínica para proceder con el pago y reactivar el acceso al sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Logo variant="dark" size={28} />
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Sistema Farmacéutico IPS</p>
        </div>

        <SidebarNav tenantId={id} role={role} />

        <div style={{ marginTop: "auto", padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", textAlign: "center" }}>
            Stratos Health v1.0 • INVIMA Compliant
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">Sistema de Farmacia IPS</span>
          <div className="topbar-user">
            <div className="avatar">{name?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{role}</div>
            </div>
          </div>
        </header>
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
