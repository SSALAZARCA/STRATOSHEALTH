import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function BillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const billingOrders = await prisma.billingOrder.findMany({
    where: { tenantId },
    include: {
      patient: {
        include: {
          consumptions: { include: { product: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalBilled = billingOrders.reduce((s, b) => s + b.totalAmount, 0);
  const totalPending = billingOrders.filter(b => b.status === "PENDING").reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid = billingOrders.filter(b => b.status === "PAID").reduce((s, b) => s + b.totalAmount, 0);

  function statusBadge(s: string) {
    const map: Record<string, string> = { PENDING: "badge-warning", SENT: "badge-info", PAID: "badge-success" };
    const labels: Record<string, string> = { PENDING: "Pendiente envío", SENT: "Enviada", PAID: "Pagada" };
    return <span className={`badge ${map[s] || "badge-muted"}`}>{labels[s] || s}</span>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Facturación y Órdenes de Cobro</h1>
        <p>Control de consumo farmacéutico por paciente — generación automática al egreso</p>
      </div>

      {/* Resumen financiero */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dbeafe" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <div className="stat-value">${totalBilled.toLocaleString("es-CO")}</div>
            <div className="stat-label">Total Facturado</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef9c3" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div className="stat-value">${totalPending.toLocaleString("es-CO")}</div>
            <div className="stat-label">Por Cobrar</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dcfce7" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className="stat-value">${totalPaid.toLocaleString("es-CO")}</div>
            <div className="stat-label">Cobrado</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#ede9fe" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          </div>
          <div>
            <div className="stat-value">{billingOrders.length}</div>
            <div className="stat-label">Órdenes Generadas</div>
          </div>
        </div>
      </div>

      {/* Órdenes de cobro */}
      {billingOrders.map(b => (
        <div key={b.id} className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                OC-{b.id.slice(-8).toUpperCase()} — {b.patient.name}
                <span style={{ marginLeft: 8 }}>{statusBadge(b.status)}</span>
              </div>
              <div className="card-subtitle">
                Doc: {b.patient.documentType} {b.patient.documentNumber}
                {b.patient.ward && <> | Servicio: {b.patient.ward}</>}
                {" | "}Egreso: {b.patient.dischargeDate ? new Date(b.patient.dischargeDate).toLocaleDateString("es-CO") : "—"}
                {" | "}Generada: {new Date(b.createdAt).toLocaleDateString("es-CO")}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>
                ${b.totalAmount.toLocaleString("es-CO")}
              </div>
              <div className="text-xs text-muted">Total medicamentos</div>
            </div>
          </div>

          {/* Detalle de consumos */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Genérico</th>
                  <th>Fecha Admin.</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {b.patient.consumptions.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem" }}>Sin consumos registrados</td></tr>
                )}
                {b.patient.consumptions.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.product.name}</td>
                    <td className="text-sm text-muted">{c.product.genericName}</td>
                    <td className="text-xs text-muted">{new Date(c.administeredAt).toLocaleDateString("es-CO")}</td>
                    <td>{c.quantity} {c.product.unit}</td>
                    <td>${c.unitPrice.toLocaleString("es-CO")}</td>
                    <td style={{ fontWeight: 700 }}>${c.totalPrice.toLocaleString("es-CO")}</td>
                  </tr>
                ))}
                {b.patient.consumptions.length > 0 && (
                  <tr style={{ background: "#f8fafc" }}>
                    <td colSpan={5} style={{ textAlign: "right", fontWeight: 700 }}>TOTAL:</td>
                    <td style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1rem" }}>
                      ${b.totalAmount.toLocaleString("es-CO")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {billingOrders.length === 0 && (
        <div className="card">
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            💳 No hay órdenes de cobro generadas aún.<br />
            <span style={{ fontSize: "0.875rem" }}>Las órdenes se generan automáticamente al egresar un paciente.</span>
          </div>
        </div>
      )}
    </div>
  );
}
