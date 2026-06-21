"use client";

import { useState, useTransition } from "react";

export default function AddPaymentMethodModal({ 
  onClose,
  addPaymentMethodAction
}: { 
  onClose: () => void,
  addPaymentMethodAction: (formData: FormData) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(8px)" }}>
      <div style={{ 
        width: "100%", 
        maxWidth: "480px", 
        background: "#ffffff", 
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", 
        border: "1px solid #e2e8f0", 
        borderRadius: "20px",
        overflow: "hidden",
        zIndex: 10000,
        color: "#1e293b",
        fontFamily: "inherit"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>Agregar Método de Pago</div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.75rem", color: "#64748b", lineHeight: 1, padding: 0 }}>&times;</button>
        </div>
        
        <form action={(formData) => {
          startTransition(async () => {
            await addPaymentMethodAction(formData);
            onClose();
          });
        }} style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>Pasarela de Pago</label>
            <select name="provider" required style={{ width: "100%", padding: "0.75rem 1rem", border: "2px solid #e2e8f0", borderRadius: "12px", background: "#ffffff", color: "#0f172a", fontSize: "0.95rem", fontWeight: 500 }}>
              <option value="STRIPE">Stripe (Tarjetas Internacionales)</option>
              <option value="WOMPI">Wompi (Bancolombia / Tarjetas Locales)</option>
              <option value="MERCADOPAGO">MercadoPago</option>
              <option value="PAYPAL">PayPal</option>
              <option value="PSE">PSE (Cuenta Bancaria)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>Nombre en la Tarjeta</label>
            <input type="text" name="cardholder" required style={{ width: "100%", padding: "0.75rem 1rem", border: "2px solid #e2e8f0", borderRadius: "12px", background: "#ffffff", color: "#0f172a", fontSize: "0.95rem", fontWeight: 500 }} placeholder="Ej: Juan Pérez" />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>Número de Tarjeta</label>
            <input type="text" name="cardNumber" required style={{ width: "100%", padding: "0.75rem 1rem", border: "2px solid #e2e8f0", borderRadius: "12px", background: "#ffffff", color: "#0f172a", fontSize: "0.95rem", fontWeight: 500 }} placeholder="4242 4242 4242 4242" maxLength={19} />
            <p style={{ marginTop: "0.5rem", marginBottom: 0, fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>PCI DSS: Cifrado en tránsito. Solo guardaremos los últimos 4 dígitos.</p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>Expiración</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input type="number" name="expMonth" required style={{ width: "100%", padding: "0.75rem 1rem", border: "2px solid #e2e8f0", borderRadius: "12px", background: "#ffffff", color: "#0f172a", fontSize: "0.95rem", fontWeight: 500 }} placeholder="MM" min="1" max="12" />
                <span style={{ display: "flex", alignItems: "center", color: "#64748b", fontWeight: "bold" }}>/</span>
                <input type="number" name="expYear" required style={{ width: "100%", padding: "0.75rem 1rem", border: "2px solid #e2e8f0", borderRadius: "12px", background: "#ffffff", color: "#0f172a", fontSize: "0.95rem", fontWeight: 500 }} placeholder="YY" min="26" max="99" />
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>CVC</label>
              <input type="text" name="cvc" required style={{ width: "100%", padding: "0.75rem 1rem", border: "2px solid #e2e8f0", borderRadius: "12px", background: "#ffffff", color: "#0f172a", fontSize: "0.95rem", fontWeight: 500 }} placeholder="123" maxLength={4} />
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "50px", background: "#ffffff", color: "#475569", fontWeight: 700, cursor: "pointer" }} disabled={isPending}>Cancelar</button>
            <button type="submit" style={{ flex: 1, padding: "0.75rem", border: "none", borderRadius: "50px", background: "#1863dc", color: "#ffffff", fontWeight: 700, cursor: "pointer" }} disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar Tarjeta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
