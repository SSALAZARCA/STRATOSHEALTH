import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function ManagerDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  // Estadísticas generales
  const [
    totalPatients,
    admittedPatients,
    pendingOrders,
    lowStockProducts,
    pendingPurchaseOrders,
    totalProducts,
  ] = await Promise.all([
    prisma.patient.count({ where: { tenantId } }),
    prisma.patient.count({ where: { tenantId, status: "ADMITTED" } }),
    prisma.nurseOrder.count({ where: { tenantId, status: "PENDING" } }),
    prisma.product.count({ where: { tenantId, stock: { lte: prisma.product.fields.minStock } } }).catch(() => 0),
    prisma.purchaseOrder.count({ where: { tenantId, status: "DRAFT" } }),
    prisma.product.count({ where: { tenantId } }),
  ]);

  // Ultimos pedidos de enfermería
  const recentOrders = await prisma.nurseOrder.findMany({
    where: { tenantId },
    include: { patient: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Productos con bajo stock
  const lowStock = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { stock: "asc" },
    take: 5,
  });

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      PENDING: "badge-warning",
      DISPATCHED: "badge-success",
      PARTIAL: "badge-info",
      REJECTED: "badge-danger",
      ADMITTED: "badge-success",
      DISCHARGED: "badge-muted",
    };
    const labels: Record<string, string> = {
      PENDING: "Pendiente", DISPATCHED: "Despachado", PARTIAL: "Parcial",
      REJECTED: "Rechazado", ADMITTED: "Admitido", DISCHARGED: "Egresado",
    };
    return <span className={`badge ${map[status] || "badge-muted"}`}>{labels[status] || status}</span>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dashboard Gerencial</h1>
        <p>Resumen administrativo y financiero de la farmacia IPS</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dbeafe" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div>
            <div className="stat-value">{admittedPatients}</div>
            <div className="stat-label">Pacientes Activos</div>
            <div className="stat-change">{totalPatients} total histórico</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef9c3" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
          </div>
          <div>
            <div className="stat-value">{pendingOrders}</div>
            <div className="stat-label">Pedidos Pendientes</div>
            <div className="stat-change up">Requieren despacho</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dcfce7" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div>
            <div className="stat-value">{totalProducts}</div>
            <div className="stat-label">Productos en Inventario</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fee2e2" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <div className="stat-value">{lowStock.filter(p => p.stock <= p.minStock).length}</div>
            <div className="stat-label">Stock Bajo / Agotado</div>
            <div className="stat-change down">Requieren reabastecimiento</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#ede9fe" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div>
            <div className="stat-value">{pendingPurchaseOrders}</div>
            <div className="stat-label">Órdenes de Compra Borrador</div>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid-2">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Últimos Pedidos de Enfermería</div>
              <div className="card-subtitle">Pedidos recientes por paciente</div>
            </div>
            <a href={`/pharmacy/${tenantId}/nurse`} className="btn btn-sm btn-secondary">Ver todos</a>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Items</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No hay pedidos</td></tr>
                )}
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td><div style={{ fontWeight: 600 }}>{o.patient.name}</div><div className="text-xs text-muted">{o.patient.bedNumber || "Sin cama"}</div></td>
                    <td>{o.items.length} medicamento{o.items.length !== 1 ? "s" : ""}</td>
                    <td>{statusBadge(o.status)}</td>
                    <td className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString("es-CO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Medicamentos con Stock Bajo</div>
              <div className="card-subtitle">Requieren reabastecimiento urgente</div>
            </div>
            <a href={`/pharmacy/${tenantId}/inventory`} className="btn btn-sm btn-secondary">Ver inventario</a>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Inventario OK</td></tr>
                )}
                {lowStock.map(p => {
                  const pct = Math.round((p.stock / Math.max(p.minStock, 1)) * 100);
                  const color = p.stock === 0 ? "#ef476f" : p.stock <= p.minStock ? "#ffd166" : "#06d6a0";
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div className="text-xs text-muted">{p.genericName}</div>
                      </td>
                      <td style={{ fontWeight: 700, color }}>{p.stock} {p.unit}</td>
                      <td className="text-muted">{p.minStock}</td>
                      <td>
                        {p.stock === 0
                          ? <span className="badge badge-danger">Agotado</span>
                          : p.stock <= p.minStock
                          ? <span className="badge badge-warning">Bajo</span>
                          : <span className="badge badge-success">OK</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
