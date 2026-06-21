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

export function SidebarNav({ tenantId, role }: { tenantId: string; role: string }) {
  const isNurse = role === "NURSE" || role === "MANAGER";
  const isPharmacist = role === "PHARMACIST" || role === "MANAGER";
  const isDoctor = role === "DOCTOR";
  const isRecordsManager = role === "RECORDS_MANAGER" || role === "MANAGER";
  const isManager = role === "MANAGER";

  const dashboardUrl = role === "RECORDS_MANAGER" 
    ? `/pharmacy/${tenantId}/records`
    : `/pharmacy/${tenantId}/dashboard/${role.toLowerCase()}`;

  return (
    <>
      <div className="sidebar-section">
        <div className="sidebar-section-title">Principal</div>
        <NavItem href={dashboardUrl} label="Mi Dashboard" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        }/>
      </div>

      {isNurse && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Enfermería</div>
          <NavItem href={`/pharmacy/${tenantId}/patients`} label="Pacientes" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          }/>
          <NavItem href={`/pharmacy/${tenantId}/nurse`} label="Pedidos de Medicamentos" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h6"/></svg>
          }/>
        </div>
      )}

      {isDoctor && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Medicina</div>
          <NavItem href={`/pharmacy/${tenantId}/patients`} label="Mis Pacientes" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          }/>
        </div>
      )}

      {isRecordsManager && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Archivo Clínico</div>
          <NavItem href={`/pharmacy/${tenantId}/records/search`} label="Gestión de Historias" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          }/>
        </div>
      )}

      {isPharmacist && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Farmacia</div>
          <NavItem href={`/pharmacy/${tenantId}/pharmacist`} label="Despachos" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          }/>
          <NavItem href={`/pharmacy/${tenantId}/inventory`} label="Inventario INVIMA" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          }/>
          <NavItem href={`/pharmacy/${tenantId}/kardex`} label="Kárdex (Res. 1403)" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          }/>
        </div>
      )}

      {isPharmacist && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Compras (B2B)</div>
          <NavItem href={`/pharmacy/${tenantId}/suppliers`} label="Directorio de Proveedores" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          }/>
          <NavItem href={`/pharmacy/${tenantId}/purchase-orders`} label="Órdenes de Compra" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          }/>
        </div>
      )}

      {isManager && (
        <>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Gerencia</div>
            <NavItem href={`/pharmacy/${tenantId}/users`} label="Personal (Usuarios)" icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            }/>
            <NavItem href={`/pharmacy/${tenantId}/billing`} label="Facturación al Egreso" icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            }/>
            <NavItem href={`/pharmacy/${tenantId}/reports`} label="Reportes Financieros" icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            }/>
            <NavItem href={`/pharmacy/${tenantId}/dashboard/manager/dictionaries`} label="Diccionarios Clínicos" icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            }/>
            <NavItem href={`/pharmacy/${tenantId}/subscription`} label="Control de Suscripción" icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            }/>
          </div>
        </>
      )}

      <div className="sidebar-section">
        <div className="sidebar-section-title">Ajustes</div>
        <NavItem href={`/pharmacy/${tenantId}/profile`} label="Mi Perfil / Seguridad" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        } />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }} onClick={() => signOut()}>
          🚪 Cerrar Sesión
        </button>
      </div>
    </>
  );
}
