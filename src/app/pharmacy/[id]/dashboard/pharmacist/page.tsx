import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function PharmacistDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const [pendingOrders, lowStock, totalProducts, expiringSoon] = await Promise.all([
    prisma.nurseOrder.count({ where: { tenantId, status: "PENDING" } }),
    prisma.product.count({ where: { tenantId, stock: { lte: 10 } } }),
    prisma.product.count({ where: { tenantId } }),
    prisma.kardexEntry.count({ 
      where: { 
        product: { tenantId }, 
        type: "ENTRADA", 
        expiryDate: { lte: new Date(new Date().setMonth(new Date().getMonth() + 3)) } 
      } 
    })
  ]);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard de Regencia</h1>
        <p>Control logístico e INVIMA de la farmacia</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Pedidos Pendientes</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>{pendingOrders}</div>
          <Link href={`/pharmacy/${tenantId}/pharmacist`} className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>Ir a Despachos</Link>
        </div>
        
        <div className="stat-card" style={{ borderColor: lowStock > 0 ? "var(--warning)" : undefined }}>
          <div className="stat-title">Productos en Bajo Stock</div>
          <div className="stat-value" style={{ color: lowStock > 0 ? "var(--warning)" : "var(--text)" }}>{lowStock}</div>
          <Link href={`/pharmacy/${tenantId}/inventory`} className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }}>Revisar Inventario</Link>
        </div>

        <div className="stat-card" style={{ borderColor: expiringSoon > 0 ? "var(--danger)" : undefined }}>
          <div className="stat-title">Alertas de Vencimiento (&lt;3 meses)</div>
          <div className="stat-value" style={{ color: expiringSoon > 0 ? "var(--danger)" : "var(--text)" }}>{expiringSoon}</div>
          <Link href={`/pharmacy/${tenantId}/inventory`} className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }}>Ver Cuarentenas</Link>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Referencias (ATC)</div>
          <div className="stat-value">{totalProducts}</div>
        </div>
      </div>
    </div>
  );
}
