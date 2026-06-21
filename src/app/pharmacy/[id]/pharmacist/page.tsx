import { PrismaClient } from "@prisma/client";
import { dispatchNurseOrder } from "@/lib/actions/ips";
import { DispatchOrderButton } from "@/components/ActionButtons";
import Link from "next/link";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function PharmacistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  
  const session = await auth();
  const userRole = session?.user?.role;

  const pendingOrders = await prisma.nurseOrder.findMany({
    where: { tenantId, status: { in: ["PENDING", "PARTIAL"] } },
    include: { patient: true, items: { include: { product: true } } },
    orderBy: { createdAt: "asc" },
  });

  const recentDispatched = await prisma.nurseOrder.findMany({
    where: { tenantId, status: { in: ["DISPATCHED", "REJECTED"] } },
    include: { patient: true, items: { include: { product: true } } },
    orderBy: { dispatchedAt: "desc" },
    take: 10,
  });

  function itemStatusBadge(s: string) {
    const map: Record<string, string> = { PENDING: "badge-warning", DISPATCHED: "badge-success", PARTIAL: "badge-info", UNAVAILABLE: "badge-danger" };
    const labels: Record<string, string> = { PENDING: "Pendiente", DISPATCHED: "OK", PARTIAL: "Parcial", UNAVAILABLE: "Sin Stock" };
    return <span className={`badge badge-sm ${map[s] || "badge-muted"}`}>{labels[s] || s}</span>;
  }

  const hasStockoutAlert = pendingOrders.some(order => 
    order.items.some(item => item.product.stock < item.requestedQty)
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Despacho — Regente de Farmacia</h1>
        <p>Gestión y despacho de pedidos de enfermería según inventario disponible</p>
      </div>

      {pendingOrders.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: "1rem" }}>
          ⚠️ Hay <strong>{pendingOrders.length} pedido(s) pendiente(s)</strong> de despacho.
        </div>
      )}

      {hasStockoutAlert && (
        <div className="alert alert-danger" style={{ marginBottom: "1.5rem", border: "2px solid var(--danger)", background: "rgba(239, 68, 68, 0.1)" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            ALERTA CRÍTICA DE DESABASTECIMIENTO
          </h3>
          <p style={{ margin: "0 0 1rem 0" }}>Enfermería ha solicitado medicamentos que no tienen stock suficiente en farmacia. El despacho está bloqueado.</p>
          <Link href={`/pharmacy/${tenantId}/purchase-orders`} className="btn btn-danger" style={{ display: "inline-flex", background: "var(--danger)" }}>
            Ir a Marketplace B2B para Reabastecer Inmediatamente
          </Link>
        </div>
      )}

      {/* Pedidos pendientes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
        {pendingOrders.length === 0 && (
          <div className="card">
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              ✅ No hay pedidos pendientes de despacho
            </div>
          </div>
        )}

        {pendingOrders.map(order => (
          <div key={order.id} className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  Pedido — <strong>{order.patient.name}</strong>
                  <span style={{ marginLeft: 8 }} className="badge badge-info">Cama: {order.patient.bedNumber || "—"}</span>
                  {order.patient.ward && <span style={{ marginLeft: 4 }} className="badge badge-muted">{order.patient.ward}</span>}
                </div>
                <div className="card-subtitle">
                  Solicitado: {new Date(order.createdAt).toLocaleString("es-CO")}
                  {order.nurseNote && <> | Nota: <em>{order.nurseNote}</em></>}
                </div>
                {order.doctorName && (
                  <div className="card-subtitle" style={{ marginTop: 4, color: "var(--danger)", fontWeight: 600 }}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4, display: "inline-block", verticalAlign: "middle" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Fórmula Médica: Dr. {order.doctorName} ({order.prescriptionDate ? new Date(order.prescriptionDate).toLocaleDateString("es-CO") : ""})
                  </div>
                )}
              </div>
              
              {userRole === "PHARMACIST" && (
                <DispatchOrderButton orderId={order.id} action={dispatchNurseOrder} />
              )}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Forma Farm.</th>
                    <th>Concentración</th>
                    <th>Solicitado</th>
                    <th>Stock Actual</th>
                    <th>Controlado</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => {
                    const canDispatch = item.product.stock >= item.requestedQty;
                    const partial = item.product.stock > 0 && item.product.stock < item.requestedQty;
                    return (
                      <tr key={item.id} style={{ background: item.product.stock === 0 ? "#fff1f2" : partial ? "#fffbeb" : "inherit" }}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                          <div className="text-xs text-muted">{item.product.genericName}</div>
                        </td>
                        <td className="text-sm">{item.product.pharmaceuticalForm || "—"}</td>
                        <td className="text-sm">{item.product.concentration || "—"}</td>
                        <td style={{ fontWeight: 600 }}>{item.requestedQty} {item.product.unit}</td>
                        <td style={{ fontWeight: 700, color: item.product.stock === 0 ? "var(--danger)" : item.product.stock < item.requestedQty ? "var(--warning)" : "var(--success)" }}>
                          {item.product.stock} {item.product.unit}
                        </td>
                        <td>
                          {item.product.controlled
                            ? <span className="badge badge-danger">⚠️ Control Especial</span>
                            : item.product.requiresPrescription
                            ? <span className="badge badge-warning">Fórmula</span>
                            : <span className="badge badge-muted">Normal</span>}
                        </td>
                        <td>
                          {canDispatch
                            ? <span className="badge badge-success">Disponible</span>
                            : partial
                            ? <span className="badge badge-warning">Parcial</span>
                            : <span className="badge badge-danger">Sin Stock</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Historial de despachos */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Últimos Despachos Realizados</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha Despacho</th>
                <th>Paciente</th>
                <th>Medicamentos</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {recentDispatched.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Sin despachos aún</td></tr>
              )}
              {recentDispatched.map(o => (
                <tr key={o.id}>
                  <td className="text-xs text-muted">{o.dispatchedAt ? new Date(o.dispatchedAt).toLocaleString("es-CO") : "—"}</td>
                  <td style={{ fontWeight: 600 }}>{o.patient.name}</td>
                  <td>{o.items.map(i => <div key={i.id} className="text-sm">{i.product.name}: {i.dispatchedQty}/{i.requestedQty} {i.product.unit}</div>)}</td>
                  <td>
                    {o.status === "DISPATCHED" ? <span className="badge badge-success">Completo</span>
                      : o.status === "PARTIAL" ? <span className="badge badge-warning">Parcial</span>
                      : <span className="badge badge-danger">Sin Stock</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}