import { PrismaClient } from "@prisma/client";
import { receivePurchaseOrder, generateAutoPurchaseOrder, sendPurchaseOrderEmail } from "@/lib/actions/ips";
import { ReceiveOrderButton, SendOrderEmailButton } from "@/components/ActionButtons";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function PurchaseOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  
  const session = await auth();
  const userRole = session?.user?.role;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { region: true }
  });

  const [orders, lowStockProducts, regionSuppliers] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { tenantId }, orderBy: { createdAt: "desc" },
      include: { supplier: true, items: { include: { product: true } } },
    }),
    prisma.product.findMany({
      where: { tenantId }, orderBy: { stock: "asc" },
    }).then(ps => ps.filter(p => p.stock <= p.minStock)),
    tenant?.regionId ? prisma.globalSupplier.findMany({
      where: { coverages: { some: { regionId: tenant.regionId } } },
      include: { offers: true }
    }) : Promise.resolve([])
  ]);

  function statusBadge(s: string) {
    const map: Record<string, string> = { DRAFT: "badge-muted", SENT: "badge-info", ACCEPTED: "badge-primary", SHIPPED: "badge-warning", DELIVERED: "badge-info", RECEIVED: "badge-success", CANCELLED: "badge-danger" };
    const labels: Record<string, string> = { DRAFT: "Borrador", SENT: "Enviada a Proveedor", ACCEPTED: "Aceptada", SHIPPED: "En Camino", DELIVERED: "Esperando Confirmación IPS", RECEIVED: "Recibida a Satisfacción", CANCELLED: "Cancelada" };
    return <span className={`badge ${map[s] || "badge-muted"}`}>{labels[s] || s}</span>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Marketplace B2B y Compras</h1>
        <p>Órdenes de compra directas a proveedores logísticos en {tenant?.region?.name || "tu región"}</p>
      </div>

      {!tenant?.regionId && (
        <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
          🚨 Tu clínica no tiene configurada una Región. Por favor, contacta a soporte para configurar la ubicación de tu sede y acceder al catálogo de proveedores.
        </div>
      )}

      {/* Productos con bajo stock */}
      {lowStockProducts.length > 0 && tenant?.regionId && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-header">
            <div>
              <div className="card-title">🚨 Productos que Requieren Reabastecimiento ({lowStockProducts.length})</div>
              <div className="card-subtitle">Encuentra estos productos en el catálogo B2B de tu región</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Medicamento</th><th>Stock Actual</th><th>Stock Mín.</th><th>Sugerido Pedir</th><th>Mejores Ofertas (Región)</th></tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => {
                  const qtyToOrder = Math.max(p.maxStock - p.stock, p.minStock * 2);
                  // Find matching offers in region
                  const matches = regionSuppliers.flatMap(s => 
                    s.offers
                      .filter(o => o.genericName.toLowerCase().includes(p.genericName.toLowerCase()) || (p.invimaSanitary && o.invimaSanitary === p.invimaSanitary))
                      .map(o => ({ ...o, supplierName: s.name }))
                  ).sort((a, b) => a.price - b.price);

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div className="text-xs text-muted">{p.genericName}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: p.stock === 0 ? "var(--danger)" : "var(--warning)" }}>{p.stock} {p.unit}</td>
                      <td className="text-muted">{p.minStock}</td>
                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>{qtyToOrder} {p.unit}</td>
                      <td>
                        {matches.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            {matches.slice(0, 2).map((m, i) => (
                              <div key={i} style={{ fontSize: "0.8rem", background: "var(--bg)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                                <strong>${m.price.toLocaleString("es-CO")}</strong> ({m.supplierName}) - ⏳ {m.leadTimeDays}d
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted">Sin ofertas en la región</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
            {userRole === "PHARMACIST" ? (
              <form action={async () => {
                "use server";
                await generateAutoPurchaseOrder(tenantId);
              }}>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  ⚡ Generar Órdenes Automáticamente (Mejor Precio B2B)
                </button>
              </form>
            ) : (
              <div className="text-sm text-muted text-center">
                La generación de órdenes automáticas está reservada para el Regente de Farmacia.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de órdenes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginTop: "1rem" }}>Tus Órdenes de Compra (B2B)</h2>
        {orders.length === 0 && (
          <div className="card">
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              📦 No hay órdenes de compra generadas
            </div>
          </div>
        )}
        {orders.map(order => (
          <div key={order.id} className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  OC #{order.id.slice(-8).toUpperCase()} — {order.supplier.name}
                  <span style={{ marginLeft: 8 }}>{statusBadge(order.status)}</span>
                </div>
                <div className="card-subtitle">
                  Enviada al portal B2B: {new Date(order.createdAt).toLocaleDateString("es-CO")}
                  {" | "}NIT: {order.supplier.nit}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {userRole === "PHARMACIST" && order.status === "DRAFT" && (
                  <SendOrderEmailButton orderId={order.id} supplierName={order.supplier.name} supplierEmail={order.supplier.email} action={sendPurchaseOrderEmail} />
                )}
                {userRole === "PHARMACIST" && (order.status === "SHIPPED" || order.status === "SENT" || order.status === "ACCEPTED" || order.status === "DELIVERED") && (
                  <ReceiveOrderButton orderId={order.id} action={receivePurchaseOrder} />
                )}
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Producto</th><th>Cantidad</th><th>Costo Unit.</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                        <div className="text-xs text-muted">{item.product.genericName}</div>
                      </td>
                      <td>{item.quantity} {item.product.unit}</td>
                      <td>${item.unitCost.toLocaleString("es-CO")}</td>
                      <td style={{ fontWeight: 600 }}>${item.totalCost.toLocaleString("es-CO")}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#f8fafc" }}>
                    <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>TOTAL ORDEN:</td>
                    <td style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>${order.totalAmount.toLocaleString("es-CO")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
