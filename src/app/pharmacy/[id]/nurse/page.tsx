import { PrismaClient } from "@prisma/client";
import { createNurseOrder } from "@/lib/actions/ips";
import { NurseOrderForm } from "./NurseOrderForm";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function NursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  
  const session = await auth();
  const userRole = session?.user?.role;

  const [patients, products, orders] = await Promise.all([
    prisma.patient.findMany({ where: { tenantId, status: "ADMITTED" }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.nurseOrder.findMany({
      where: { tenantId },
      include: { patient: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  function statusBadge(s: string) {
    const map: Record<string, string> = { PENDING: "badge-warning", DISPATCHED: "badge-success", PARTIAL: "badge-info", REJECTED: "badge-danger" };
    const labels: Record<string, string> = { PENDING: "Pendiente", DISPATCHED: "Despachado", PARTIAL: "Parcial disponible", REJECTED: "Sin stock" };
    return <span className={`badge ${map[s] || "badge-muted"}`}>{labels[s] || s}</span>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Pedidos de Enfermería</h1>
        <p>Solicite medicamentos para pacientes admitidos</p>
      </div>

      {/* Formulario nuevo pedido */}
      {userRole !== "MANAGER" && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-header"><div className="card-title">📋 Nuevo Pedido de Medicamentos</div></div>

          {patients.length === 0 ? (
            <div className="alert alert-info">No hay pacientes admitidos. Primero admita un paciente en la sección de Pacientes.</div>
          ) : (
            <NurseOrderForm patients={patients} products={products} action={createNurseOrder} />
          )}
        </div>
      )}

      {/* Listado de pedidos */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Historial de Pedidos ({orders.length})</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Medicamentos</th>
                <th>Nota</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Sin pedidos registrados</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString("es-CO")}<br />{new Date(o.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.patient.name}</div>
                    <div className="text-xs text-muted">Cama: {o.patient.bedNumber || "—"}</div>
                  </td>
                  <td>
                    {o.items.map(item => (
                      <div key={item.id} className="text-sm">
                        {item.product.name} — {item.requestedQty} {item.product.unit}
                        {item.dispatchedQty > 0 && item.dispatchedQty < item.requestedQty && (
                          <span style={{ color: "var(--warning)", fontSize: "0.7rem" }}> (Despachados: {item.dispatchedQty})</span>
                        )}
                      </div>
                    ))}
                  </td>
                  <td className="text-sm text-muted">{o.nurseNote || "—"}</td>
                  <td>{statusBadge(o.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}