import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export default async function SupplierOrders() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return <div>No autorizado</div>;

  const supplier = await prisma.globalSupplier.findUnique({
    where: { email },
    include: {
      orders: {
        include: { tenant: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!supplier) return <div>Proveedor no encontrado.</div>;

  async function updateOrderStatus(orderId: string, status: string) {
    "use server";
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status }
    });
    revalidatePath("/supplier/orders");
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Gestión de Órdenes (B2B)</h1>
        <p>Recibe y despacha pedidos de las Clínicas e IPS</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {supplier.orders.length === 0 && (
          <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Aún no has recibido órdenes de compra.
          </div>
        )}
        
        {supplier.orders.map(order => (
          <div key={order.id} className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div className="card-title">Orden de Compra: <strong>{order.tenant.name}</strong></div>
                <div className="card-subtitle">
                  {new Date(order.createdAt).toLocaleString("es-CO")} | NIT: {order.tenant.nit}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Total: ${order.totalAmount.toLocaleString("es-CO")}</span>
                <span className={`badge ${order.status === "DELIVERED" ? "badge-info" : order.status === "CANCELLED" ? "badge-danger" : "badge-warning"}`}>
                  {order.status === "DELIVERED" ? "Entregado - Esperando confirmación de IPS" : order.status}
                </span>
              </div>
            </div>
            
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Medicamento Requerido</th>
                    <th>Cant.</th>
                    <th>Costo Unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                        <div className="text-xs text-muted">{item.product.genericName}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                      <td>${item.unitCost.toLocaleString("es-CO")}</td>
                      <td>${item.totalCost.toLocaleString("es-CO")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-footer" style={{ padding: "1rem 1.5rem", background: "var(--bg)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                <>
                  <form action={async () => { "use server"; await updateOrderStatus(order.id, "ACCEPTED"); }}>
                    <button type="submit" className="btn btn-sm" style={{ background: "var(--info)", color: "white" }}>Aceptar Orden</button>
                  </form>
                  <form action={async () => { "use server"; await updateOrderStatus(order.id, "SHIPPED"); }}>
                    <button type="submit" className="btn btn-sm btn-primary">Marcar en Tránsito</button>
                  </form>
                  <form action={async () => { "use server"; await updateOrderStatus(order.id, "DELIVERED"); }}>
                    <button type="submit" className="btn btn-sm btn-success">Confirmar Entrega</button>
                  </form>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
