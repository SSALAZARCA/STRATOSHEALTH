"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { signOut } from "next-auth/react";

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

export default function SupplierSidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1 style={{ color: "var(--primary)", margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>📦 Portal B2B</h1>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Proveedores Farmacéuticos</p>
      </div>

      <div className="sidebar-section" style={{ marginTop: "2rem" }}>
        <div className="sidebar-section-title">Logística y Ventas</div>
        <NavItem href="/supplier/dashboard" label="Dashboard" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        }/>
        <NavItem href="/supplier/catalog" label="Mi Catálogo (Ofertas)" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        }/>
        <NavItem href="/supplier/orders" label="Órdenes de IPS" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        }/>
      </div>

      <div style={{ marginTop: "auto", padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button 
          className="btn btn-danger" 
          style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: "0.5rem" }} 
          onClick={() => signOut()}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
