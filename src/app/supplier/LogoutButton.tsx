"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button 
      onClick={() => signOut()} 
      className="btn btn-danger"
      style={{
        padding: "0.75rem 2rem",
        borderRadius: "50px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: "pointer",
        margin: "0 auto"
      }}
    >
      🚪 Cerrar Sesión
    </button>
  );
}
