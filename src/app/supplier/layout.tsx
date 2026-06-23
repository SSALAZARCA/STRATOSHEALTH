import { ReactNode } from "react";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import SupplierSidebar from "./SupplierSidebar";
import LogoutButton from "./LogoutButton";

const prisma = new PrismaClient();

export default async function SupplierLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white" }}>
        No autorizado
      </div>
    );
  }

  // Obtener datos del proveedor
  const supplier = await prisma.globalSupplier.findUnique({
    where: { email },
    include: { plan: true }
  });

  if (!supplier) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white", padding: "2rem", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "500px", padding: "2rem", background: "#1e293b", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ fontSize: "1.75rem", color: "#f59e0b", margin: "0 0 1rem 0" }}>Registro Comercial No Encontrado</h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Tu cuenta de usuario no está vinculada a un registro comercial de proveedor activo en el sistema B2B.
          </p>
          <LogoutButton />
        </div>
      </div>
    );
  }

  // Verificar estado de suscripción
  const isExpired = supplier.nextBillingDate ? new Date(supplier.nextBillingDate) < new Date() : false;
  const isSuspended = supplier.subscriptionStatus !== "ACTIVE" || isExpired || !supplier.active;

  if (isSuspended) {
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
          border: "1px solid rgba(245, 158, 11, 0.2)",
          textAlign: "center",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b", margin: "0 0 1rem 0" }}>Acceso B2B Suspendido</h2>
          <p style={{ color: "#e2e8f0", fontSize: "1.1rem", lineHeight: 1.6, margin: "0 0 1.5rem 0" }}>
            El acceso al Portal de Proveedores para <strong>{supplier.name}</strong> ha sido suspendido o se encuentra inactivo por falta de renovación de su plan comercial.
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
            <div><strong>Plan Contratado:</strong> {supplier.plan?.name || "Sin Plan / Pendiente"}</div>
            <div style={{ marginTop: "0.5rem" }}>
              <strong>Fecha de Pago Programada:</strong> {supplier.nextBillingDate ? new Date(supplier.nextBillingDate).toLocaleDateString("es-CO", { day: 'numeric', month: 'long', year: 'numeric' }) : "No definida"}
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <strong>Estado del Registro:</strong> {!supplier.active ? "Desactivado por Superadmin" : "Vencido / Pendiente de Pago"}
            </div>
          </div>

          <p style={{ color: "#cbd5e1", fontSize: "0.95rem", marginBottom: "2rem", lineHeight: 1.5 }}>
            Para reactivar tu cuenta de proveedor, renovar tu membresía B2B o negociar convenios comerciales con las clínicas asociadas, por favor ponte en contacto con la administración central de Stratos Health.
          </p>

          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ '--primary': '#f59e0b', '--primary-hover': '#d97706', '--primary-light': 'rgba(245, 158, 11, 0.15)', position: 'relative' } as React.CSSProperties}>
      {/* CSS-only mobile sidebar toggle */}
      <input type="checkbox" id="sidebar-toggle" className="sidebar-toggle-checkbox" style={{ display: "none" }} />
      <label htmlFor="sidebar-toggle" className="sidebar-overlay" />

      <SupplierSidebar />

      <div className="main-content">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <label htmlFor="sidebar-toggle" className="sidebar-toggle-label" aria-label="Abrir menú">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </label>
            <span className="topbar-title">Central de Distribución Farmacéutica</span>
          </div>
          <div className="topbar-user">
            <div className="avatar" style={{ background: "var(--primary)" }}>📦</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{supplier.contact || "Administrador"}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{supplier.name}</div>
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
