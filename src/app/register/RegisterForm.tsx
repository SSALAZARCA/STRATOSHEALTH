"use client";

import { useState, useTransition } from "react";
import { registerTenant } from "@/lib/actions/register";
import { useRouter } from "next/navigation";

export default function RegisterForm({ 
  plans, 
  initialPlanId,
}: { 
  plans: any[], 
  initialPlanId?: string,
  initialBilling?: string   // kept for compat, no longer used
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || "");
  const router = useRouter();

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Total a cobrar = precio mensual del plan × duración del plan
  const getTotal = (p: any) => p.price * p.durationMonths;

  async function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      try {
        await registerTenant(formData);
      } catch (err: any) {
        setError(err.message || "Error al procesar el registro.");
      }
    });
  }

  return (
    <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "0" }}>
          ❌ {error}
        </div>
      )}

      {/* 1. Datos de la IPS */}
      <div>
        <h3 style={{ fontSize: "1.1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem", color: "#60a5fa" }}>1. Información de la Clínica (IPS)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Nombre de la Clínica / Farmacia *</label>
            <input type="text" name="clinicName" required className="form-control" placeholder="Ej: Clínica San Rafael" />
          </div>
          <div>
            <label className="form-label">NIT</label>
            <input type="text" name="nit" className="form-control" placeholder="Opcional" />
          </div>
          <div>
            <label className="form-label">Teléfono / Contacto</label>
            <input type="text" name="phone" className="form-control" placeholder="Opcional" />
          </div>
        </div>
      </div>

      {/* 2. Datos del Administrador */}
      <div>
        <h3 style={{ fontSize: "1.1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem", color: "#60a5fa" }}>2. Cuenta del Administrador (Gerente)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Nombre Completo *</label>
            <input type="text" name="adminName" required className="form-control" placeholder="Tu nombre" />
          </div>
          <div>
            <label className="form-label">Correo Electrónico *</label>
            <input type="email" name="adminEmail" required className="form-control" placeholder="gerencia@clinica.com" />
          </div>
          <div>
            <label className="form-label">Contraseña *</label>
            <input type="password" name="adminPassword" required className="form-control" placeholder="••••••••" minLength={6} />
          </div>
        </div>
      </div>

      {/* 3. Selección de Plan */}
      <div>
        <h3 style={{ fontSize: "1.1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem", color: "#60a5fa" }}>3. Plan de Suscripción</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <select 
            name="planId" 
            required 
            className="form-control" 
            value={selectedPlanId} 
            onChange={(e) => setSelectedPlanId(e.target.value)}
            style={{ fontSize: "1.1rem", padding: "0.75rem" }}
          >
            <option value="" disabled>Selecciona un plan</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — ${p.price.toLocaleString("es-CO")}/mes × {p.durationMonths} {p.durationMonths === 1 ? "mes" : "meses"} = ${getTotal(p).toLocaleString("es-CO")} COP
              </option>
            ))}
          </select>

          {selectedPlan && (
            <div style={{
              background: "rgba(24,99,220,0.10)",
              border: "1px solid rgba(24,99,220,0.25)",
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              marginTop: "0.5rem"
            }}>
              <p className="text-sm" style={{ color: "#60a5fa", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
                💳 Resumen del cobro
              </p>
              <p style={{ margin: "0 0 0.25rem 0", color: "white", fontSize: "1rem" }}>
                <strong>${selectedPlan.price.toLocaleString("es-CO")}</strong>
                <span style={{ color: "var(--text-muted)" }}>/mes × {selectedPlan.durationMonths} {selectedPlan.durationMonths === 1 ? "mes" : "meses"}</span>
                {" = "}
                <strong style={{ color: "#60a5fa", fontSize: "1.1rem" }}>
                  ${getTotal(selectedPlan).toLocaleString("es-CO")} COP
                </strong>
                {" cobrados hoy"}
              </p>
              <p className="text-sm text-muted" style={{ margin: 0 }}>
                Hasta {selectedPlan.maxUsers} usuarios · Renovación automática en {selectedPlan.durationMonths} {selectedPlan.durationMonths === 1 ? "mes" : "meses"}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Pago */}
      <div>
        <h3 style={{ fontSize: "1.1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem", color: "#60a5fa" }}>4. Detalles de Pago Seguro (PCI-DSS)</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", background: "var(--bg)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <div>
            <label className="form-label">Pasarela de Pago</label>
            <select name="provider" required className="form-control">
              <option value="STRIPE">Stripe (Tarjetas Internacionales)</option>
              <option value="WOMPI">Wompi (Bancolombia / Tarjetas Locales)</option>
              <option value="MERCADOPAGO">MercadoPago</option>
              <option value="PAYPAL">PayPal</option>
              <option value="PSE">PSE (Cuenta Bancaria)</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Número de Tarjeta</label>
            <input type="text" name="cardNumber" required className="form-control" placeholder="•••• •••• •••• ••••" maxLength={19} />
          </div>
          
          <div className="grid-layout-2-equal">
            <div>
              <label className="form-label">Expiración</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input type="number" name="expMonth" required className="form-control" placeholder="MM" min="1" max="12" style={{ width: "100%" }} />
                <span style={{ display: "flex", alignItems: "center", color: "var(--text-muted)" }}>/</span>
                <input type="number" name="expYear" required className="form-control" placeholder="YY" min="26" max="99" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <label className="form-label">CVC</label>
              <input type="text" name="cvc" required className="form-control" placeholder="•••" maxLength={4} />
            </div>
          </div>
          
          <div className="text-xs text-muted" style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span>🔒</span>
            <span>Tus datos de pago están encriptados y procesados de manera segura mediante tokens. No guardamos información sensible en nuestros servidores.</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
        <button type="button" onClick={() => router.push("/")} className="btn btn-secondary" style={{ flex: 1 }} disabled={isPending}>
          Cancelar y Volver
        </button>
        <button type="submit" className="btn btn-primary" style={{ flex: 2, fontSize: "1.1rem" }} disabled={isPending || !selectedPlanId}>
          {isPending 
            ? "Procesando Registro y Pago..." 
            : selectedPlan 
              ? `Pagar $${getTotal(selectedPlan).toLocaleString("es-CO")} COP y Crear Cuenta`
              : "Selecciona un plan"
          }
        </button>
      </div>
    </form>
  );
}
