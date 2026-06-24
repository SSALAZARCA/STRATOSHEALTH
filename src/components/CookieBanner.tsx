"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("stratos_cookies_accepted");
    if (!accepted) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#1e293b",
      color: "#f8fafc",
      padding: "1rem 2rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      zIndex: 9999,
      boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ flex: 1, fontSize: "0.9rem", lineHeight: "1.5" }}>
        <strong>Utilizamos cookies esenciales.</strong> En StratosHealth utilizamos cookies estrictamente necesarias para la autenticación y seguridad de nuestra plataforma médica. No utilizamos cookies de rastreo publicitario. Al continuar navegando, usted acepta nuestra{" "}
        <Link href="/legal/cookies" style={{ color: "#38bdf8", textDecoration: "underline" }}>Política de Cookies</Link> y nuestra{" "}
        <Link href="/legal/privacy" style={{ color: "#38bdf8", textDecoration: "underline" }}>Política de Privacidad</Link>.
      </div>
      <div>
        <button
          onClick={() => {
            localStorage.setItem("stratos_cookies_accepted", "true");
            setShow(false);
          }}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontWeight: 600,
            whiteSpace: "nowrap"
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
