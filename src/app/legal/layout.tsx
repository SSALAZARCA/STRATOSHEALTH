import Link from "next/link";
import { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg, #f8fafc)", color: "var(--text, #0f172a)" }}>
      <header style={{ backgroundColor: "var(--card-bg, #ffffff)", padding: "1rem 2rem", borderBottom: "1px solid var(--border, #e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.25rem", color: "var(--primary, #2563eb)" }}>StratosHealth</div>
        <Link href="/" style={{ color: "var(--text-muted, #475569)", textDecoration: "none", fontWeight: 500 }}>Volver al Inicio</Link>
      </header>
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem", backgroundColor: "var(--card-bg, #ffffff)", minHeight: "calc(100vh - 70px)" }}>
        {children}
      </main>
    </div>
  );
}
