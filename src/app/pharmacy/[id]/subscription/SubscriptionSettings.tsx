"use client";

import { useState, useTransition } from "react";
import AddPaymentMethodModal from "./AddPaymentMethodModal";

export default function SubscriptionSettings({ 
  tenantId, 
  planName,
  planPrice,
  autoRenew,
  maxUsers,
  currentUsers,
  toggleAutoRenewAction,
  allPlans,
  paymentMethods,
  addPaymentMethodAction,
  deletePaymentMethodAction,
  nextBillingDate,
  subscriptionStatus,
  changeOrRenewPlanAction,
  initialBilling = "annual"
}: {
  tenantId: string;
  planName: string;
  planPrice: number;
  autoRenew: boolean;
  maxUsers: number;
  currentUsers: number;
  toggleAutoRenewAction: (autoRenew: boolean) => Promise<void>;
  allPlans: any[];
  paymentMethods: any[];
  addPaymentMethodAction: (formData: FormData) => Promise<void>;
  deletePaymentMethodAction: (id: string) => Promise<void>;
  nextBillingDate: Date | null;
  subscriptionStatus: string;
  changeOrRenewPlanAction: (planId: string, billingPeriod: "annual" | "monthly") => Promise<void>;
  initialBilling?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isChangingPlan, startChangePlanTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    initialBilling === "monthly" ? "monthly" : "annual"
  );

  const isExpired = nextBillingDate ? new Date(nextBillingDate) < new Date() : false;
  const isSuspended = subscriptionStatus !== "ACTIVE" || isExpired;

  const handlePlanAction = (planId: string, targetPlanName: string) => {
    if (paymentMethods.length === 0) {
      alert("Por favor, agrega un método de pago primero antes de cambiar o renovar tu plan.");
      return;
    }

    const isCurrent = targetPlanName === planName;
    const msg = isCurrent
      ? `¿Deseas realizar el pago de renovación para tu plan actual (${targetPlanName})? Se procesará el cobro de la tarjeta.`
      : `¿Deseas cambiar tu suscripción al plan ${targetPlanName}? Se procesará el cobro correspondiente de tu tarjeta principal.`;

    if (!confirm(msg)) return;

    startChangePlanTransition(async () => {
      try {
        await changeOrRenewPlanAction(planId, billingPeriod);
        alert("Suscripción procesada y activada con éxito.");
      } catch (err: any) {
        alert(err.message || "Error al procesar el pago");
      }
    });
  };

  return (
    <div className="grid-layout-2-equal">
      {/* Resumen del Plan */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Resumen de tu Suscripción</div>
        </div>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <span 
              className={`badge ${isSuspended ? 'badge-danger' : 'badge-success'}`} 
              style={{ 
                marginBottom: "0.5rem", 
                display: "inline-block",
                background: isSuspended ? "#ef4444" : undefined
              }}
            >
              {isSuspended ? "Vencida / Suspendida" : "Activa"}
            </span>
            <h2 style={{ fontSize: "2rem", margin: "0" }}>{planName}</h2>
            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", margin: "0.5rem 0" }}>
              ${(initialBilling === "annual" ? Math.round(planPrice * 0.8) : planPrice).toLocaleString("es-CO")}{" "}
              <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>
                / mes {initialBilling === "annual" && "(Facturación Anual -20%)"}
              </span>
            </div>
            {nextBillingDate && (
              <div 
                style={{ 
                  marginTop: "0.5rem", 
                  fontSize: "0.875rem", 
                  color: isSuspended ? "#ef4444" : "var(--text-muted)",
                  fontWeight: isSuspended ? "bold" : "normal"
                }}
              >
                📅 Próximo Cobro / Vencimiento: {new Date(nextBillingDate).toLocaleDateString("es-CO", { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
          
          <div style={{ padding: "1rem", background: "var(--bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <strong className="text-sm">Uso de Usuarios</strong>
              <span className="text-sm font-semibold">{currentUsers} / {maxUsers}</span>
            </div>
            <div style={{ width: "100%", background: "var(--border)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (currentUsers/maxUsers)*100)}%`, background: currentUsers >= maxUsers ? "var(--danger)" : "var(--primary)", height: "100%" }}></div>
            </div>
            {currentUsers >= maxUsers && (
              <p className="text-xs text-danger" style={{ marginTop: "0.5rem", marginBottom: 0 }}>Has alcanzado el límite de usuarios.</p>
            )}
          </div>
        </div>
      </div>

      {/* Métodos de Pago y Renovación */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ajustes de Pago</div>
          </div>
          <div style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
              <div>
                <strong style={{ display: "block", marginBottom: "0.25rem" }}>Renovación Automática</strong>
                <p className="text-sm text-muted" style={{ margin: 0 }}>Cobraremos automáticamente tu tarjeta registrada al finalizar cada ciclo.</p>
              </div>
              <label style={{ display: "flex", alignItems: "center", cursor: isPending ? "wait" : "pointer" }}>
                <input 
                  type="checkbox" 
                  disabled={isPending}
                  checked={autoRenew}
                  onChange={(e) => {
                    const val = e.target.checked;
                    startTransition(async () => {
                      try {
                        await toggleAutoRenewAction(val);
                      } catch (err: any) {
                        alert(err.message || "Error al actualizar la renovación automática");
                      }
                    });
                  }}
                  style={{ width: "40px", height: "20px", accentColor: "var(--primary)" }} 
                />
              </label>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <strong style={{ display: "block" }}>Métodos de Pago Registrados</strong>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>+ Agregar Tarjeta / Medio</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {paymentMethods.length === 0 ? (
                  <div className="text-sm text-muted text-center" style={{ padding: "2rem", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
                    No tienes ningún método de pago configurado. Agrega uno para la renovación automática.
                  </div>
                ) : (
                  paymentMethods.map(pm => (
                    <div key={pm.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ width: "40px", height: "25px", background: pm.provider === "STRIPE" ? "linear-gradient(135deg, #6366f1, #4f46e5)" : pm.provider === "WOMPI" ? "linear-gradient(135deg, #1e3a8a, #0f172a)" : pm.provider === "MERCADOPAGO" ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "linear-gradient(135deg, #334155, #0f172a)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px" }}>
                        {pm.provider === "PSE" ? "PSE" : pm.brand || pm.provider}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>•••• •••• •••• {pm.last4}</div>
                        <div className="text-xs text-muted">
                          {pm.expMonth && pm.expYear ? `Expira ${String(pm.expMonth).padStart(2, '0')}/${pm.expYear}` : `Cuenta ${pm.provider}`}
                        </div>
                      </div>
                      {pm.isDefault && <span className="badge badge-success text-xs">Principal</span>}
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: "0.25rem 0.5rem", color: "var(--danger)" }}
                        disabled={isPending}
                        onClick={() => {
                          if (confirm("¿Estás seguro de eliminar este método de pago?")) {
                            startTransition(async () => {
                              try {
                                  await deletePaymentMethodAction(pm.id);
                                } catch (err: any) {
                                  alert(err.message || "Error al eliminar el método de pago");
                                }
                              });
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {showModal && (
          <AddPaymentMethodModal 
            onClose={() => setShowModal(false)} 
            addPaymentMethodAction={addPaymentMethodAction} 
          />
        )}
  
        {/* Planes Disponibles */}
        <div style={{ gridColumn: "1 / -1", marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ margin: 0 }}>Planes Disponibles</h3>
            
            {/* Toggle de facturación en el dashboard */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              background: "var(--bg)",
              padding: "0.5rem 1rem",
              borderRadius: "50px",
              border: "1px solid var(--border)"
            }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: billingPeriod === "monthly" ? "var(--text)" : "var(--text-muted)" }}>Facturación Mensual</span>
              <button
                type="button"
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
                style={{
                  width: "44px",
                  height: "22px",
                  borderRadius: "50px",
                  background: "var(--primary)",
                  border: "none",
                  position: "relative",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                <div style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: "4px",
                  left: billingPeriod === "annual" ? "26px" : "4px",
                  transition: "left 0.3s ease"
                }} />
              </button>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: billingPeriod === "annual" ? "var(--text)" : "var(--text-muted)" }}>
                Facturación Anual <span style={{ color: "#10b981", fontSize: "0.85rem" }}>(Ahorra 20%)</span>
              </span>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {allPlans.map(plan => {
              const isCurrent = plan.name === planName;
              let feats = [];
              try {
                feats = JSON.parse(plan.features);
                if (!Array.isArray(feats)) feats = plan.features.split(',');
              } catch {
                feats = plan.features.split(',');
              }
  
              // Calcular precios a mostrar
              const displayedPrice = billingPeriod === "annual" 
                ? Math.round(plan.price * 0.8) 
                : Math.round(plan.price);
              
              const totalPrepay = billingPeriod === "annual"
                ? Math.round(plan.price * Math.max(12, plan.durationMonths) * 0.8)
                : Math.round(plan.price);
  
              return (
                <div key={plan.id} className="card" style={{ 
                  padding: "1.5rem", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "1.5rem",
                  border: isCurrent ? (isSuspended ? "2px solid #ef4444" : "2px solid var(--primary)") : "1px solid var(--border)",
                  position: "relative"
                }}>
                  {isCurrent && (
                    <div style={{ 
                      position: "absolute", 
                      top: "-10px", 
                      right: "20px", 
                      background: isSuspended ? "#ef4444" : "var(--primary)", 
                      color: "white", 
                      padding: "0.25rem 0.75rem", 
                      borderRadius: "100px", 
                      fontSize: "0.75rem", 
                      fontWeight: "bold" 
                    }}>
                      {isSuspended ? "VENCIDO" : "PLAN ACTUAL"}
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{plan.name}</h4>
                    <div style={{ marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}>
                        ${displayedPrice.toLocaleString("es-CO")}
                      </span>
                      <span className="text-muted text-sm" style={{ display: "block", marginTop: "0.25rem" }}>
                        / mes
                      </span>
                      <span className="text-muted text-xs" style={{ display: "block", marginTop: "0.25rem" }}>
                        {billingPeriod === "annual" 
                          ? `Total prepagado: $${totalPrepay.toLocaleString("es-CO")} por ${Math.max(12, plan.durationMonths)} meses`
                          : `Cobro mensual: $${totalPrepay.toLocaleString("es-CO")} / mes`
                        }
                      </span>
                    </div>
                  </div>
  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      <span style={{ fontWeight: 600 }}>Hasta {plan.maxUsers} Usuarios</span>
                    </div>
                    <ul style={{ paddingLeft: "1.25rem", margin: 0, fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {feats.map((f: string, i: number) => (
                        <li key={i}>{f.trim()}</li>
                      ))}
                    </ul>
                  </div>
  
                  <button 
                    onClick={() => handlePlanAction(plan.id, plan.name)}
                    className={`btn ${isCurrent ? (isSuspended ? 'btn-success' : 'btn-secondary') : 'btn-primary'}`} 
                    style={{ 
                      width: "100%", 
                      cursor: (isCurrent && !isSuspended) ? 'default' : 'pointer',
                      background: (isCurrent && isSuspended) ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
                      color: (isCurrent && isSuspended) ? 'white' : undefined,
                      border: (isCurrent && isSuspended) ? 'none' : undefined,
                      opacity: (isCurrent && !isSuspended) ? 0.5 : 1
                    }}
                    disabled={(isCurrent && !isSuspended) || isPending || isChangingPlan}
                  >
                    {isCurrent 
                      ? (isSuspended ? "⚡ Renovar Suscripción Vencida" : "✓ Plan Activo") 
                      : `Adquirir Plan ${plan.name}`
                    }
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
