import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function SupplierDashboard() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return <div>No autorizado</div>;

  const supplier = await prisma.globalSupplier.findUnique({
    where: { email },
    include: {
      offers: true,
      orders: { include: { tenant: true, items: true } }
    }
  });

  if (!supplier) {
    return (
      <div className="alert alert-warning">
        No se encontró el registro comercial del proveedor. Por favor, contacte a soporte.
      </div>
    );
  }

  const pendingOrders = supplier.orders.filter(o => o.status === "SENT" || o.status === "DRAFT");
  const totalRevenue = supplier.orders.filter(o => o.status !== "CANCELLED").reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dashboard Principal</h1>
        <p>Bienvenido, {supplier.name}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Ventas Totales (En Plataforma)</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>${totalRevenue.toLocaleString("es-CO")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Órdenes Pendientes</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>{pendingOrders.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Medicamentos en Catálogo</div>
          <div className="stat-value">{supplier.offers.length}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-header">
          <div className="card-title">Últimas Órdenes Recibidas</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>IPS Destino</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {supplier.orders.slice(0, 5).map(order => (
                <tr key={order.id}>
                  <td>{new Date(order.createdAt).toLocaleDateString("es-CO")}</td>
                  <td style={{ fontWeight: 600 }}>{order.tenant.name}</td>
                  <td>${order.totalAmount.toLocaleString("es-CO")}</td>
                  <td><span className="badge badge-info">{order.status}</span></td>
                </tr>
              ))}
              {supplier.orders.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Aún no has recibido órdenes de compra</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
