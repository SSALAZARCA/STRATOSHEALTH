import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const [
    totalPatients, admittedPatients,
    totalProducts, lowStockCount, outOfStockCount,
    totalOrders, pendingOrders, dispatchedOrders,
    totalPurchaseOrders, sentPurchaseOrders,
    totalBilling, consumptions,
    auditLogs,
  ] = await Promise.all([
    prisma.patient.count({ where: { tenantId } }),
    prisma.patient.count({ where: { tenantId, status: "ADMITTED" } }),
    prisma.product.count({ where: { tenantId } }),
    prisma.product.count({ where: { tenantId, stock: { gt: 0, lte: 10 } } }),
    prisma.product.count({ where: { tenantId, stock: 0 } }),
    prisma.nurseOrder.count({ where: { tenantId } }),
    prisma.nurseOrder.count({ where: { tenantId, status: "PENDING" } }),
    prisma.nurseOrder.count({ where: { tenantId, status: "DISPATCHED" } }),
    prisma.purchaseOrder.count({ where: { tenantId } }),
    prisma.purchaseOrder.count({ where: { tenantId, status: "SENT" } }),
    prisma.billingOrder.findMany({ where: { tenantId } }),
    prisma.patientConsumption.findMany({
      include: { product: true, patient: true },
      orderBy: { administeredAt: "desc" },
      take: 20,
    }),
    prisma.auditLog.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  const totalRevenue = totalBilling.reduce((s, b) => s + b.totalAmount, 0);

  // Top productos más consumidos
  const productConsumptionMap: Record<string, { name: string; qty: number; total: number }> = {};
  consumptions.forEach(c => {
    if (!productConsumptionMap[c.productId]) {
      productConsumptionMap[c.productId] = { name: c.product.name, qty: 0, total: 0 };
    }
    productConsumptionMap[c.productId].qty += c.quantity;
    productConsumptionMap[c.productId].total += c.totalPrice;
  });
  const topProducts = Object.values(productConsumptionMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Informes y Reportes</h1>
        <p>Estadísticas gerenciales, consumo farmacéutico y auditoría del sistema</p>
      </div>

      {/* KPIs */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dbeafe" }}><svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
          <div><div className="stat-value">{totalPatients}</div><div className="stat-label">Total Pacientes</div><div className="stat-change up">{admittedPatients} activos</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dcfce7" }}><svg viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div><div className="stat-value">${totalRevenue.toLocaleString("es-CO")}</div><div className="stat-label">Ingresos Farmacia</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef9c3" }}><svg viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/></svg></div>
          <div><div className="stat-value">{totalOrders}</div><div className="stat-label">Pedidos Enfermería</div><div className="stat-change down">{pendingOrders} pendientes</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fee2e2" }}><svg viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg></div>
          <div><div className="stat-value">{outOfStockCount}</div><div className="stat-label">Medicamentos Agotados</div><div className="stat-change down">{lowStockCount} bajo mínimo</div></div>
        </div>
      </div>

      <div className="grid-2">
        {/* Top medicamentos */}
        <div className="card">
          <div className="card-header"><div className="card-title">💊 Top Medicamentos Consumidos</div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Medicamento</th><th>Cantidad</th><th>Total $</th></tr></thead>
              <tbody>
                {topProducts.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Sin datos</td></tr>
                )}
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: "var(--text-muted)" }}>#{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontWeight: 700 }}>{p.qty}</td>
                    <td style={{ fontWeight: 700, color: "var(--primary)" }}>${p.total.toLocaleString("es-CO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auditoría */}
        <div className="card">
          <div className="card-header"><div className="card-title">🔍 Log de Auditoría</div></div>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {auditLogs.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Sin registros</div>
            )}
            {auditLogs.map(log => (
              <div key={log.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-info" style={{ fontSize: "0.65rem" }}>{log.action}</span>
                  <span className="text-xs text-muted">{new Date(log.createdAt).toLocaleString("es-CO")}</span>
                </div>
                {log.details && <div className="text-sm" style={{ marginTop: "0.25rem", color: "var(--text-muted)" }}>{log.details}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de órdenes de compra */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-header"><div className="card-title">📦 Resumen de Compras</div></div>
        <div className="stats-grid">
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{totalPurchaseOrders}</div>
            <div className="text-sm text-muted">Total Órdenes Generadas</div>
          </div>
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--secondary)" }}>{sentPurchaseOrders}</div>
            <div className="text-sm text-muted">Enviadas a Proveedor</div>
          </div>
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--success)" }}>{dispatchedOrders}</div>
            <div className="text-sm text-muted">Pedidos Despachados</div>
          </div>
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}>{totalProducts}</div>
            <div className="text-sm text-muted">Productos en Inventario</div>
          </div>
        </div>
      </div>
    </div>
  );
}
