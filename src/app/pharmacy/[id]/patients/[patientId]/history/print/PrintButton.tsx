"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} style={{ padding: "0.5rem 1rem", background: "blue", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
      🖨️ Imprimir / Guardar PDF
    </button>
  );
}
