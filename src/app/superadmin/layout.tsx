"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";

function NavItem({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} className={`nav-item ${active ? "active" : ""}`}>
      <span className="icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell" style={{ '--primary': '#8b5cf6', '--primary-hover': '#7c3aed', '--primary-light': 'rgba(139, 92, 246, 0.15)' } as React.CSSProperties}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Logo variant="dark" size={28} />
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Panel Maestro de Control</p>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Global</div>
          <NavItem href="/superadmin/dashboard" label="Dashboard SaaS" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          }/>
          <NavItem href="/superadmin/tenants" label="Suscripciones (IPS)" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          }/>
          <NavItem href="/superadmin/suppliers" label="Suscripciones (Prov)" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          }/>
          <NavItem href="/superadmin/plans" label="Planes de Cobro" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          }/>
          <NavItem href="/superadmin/settings" label="Pasarelas de Pago" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          }/>
        </div>

        <div style={{ marginTop: "auto", padding: "1rem" }}>
          <button className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }} onClick={() => signOut()}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">Control SaaS</span>
          <div className="topbar-user">
            <div className="avatar" style={{ background: "var(--primary)" }}>👑</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Superadmin</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Dueño del Software</div>
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
