import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function KardexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const entries = await prisma.kardexEntry.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const products = await prisma.product.findMany({ where: { tenantId }, orderBy: { name: "asc" } });

  function typeBadge(t: string) {
    if (t === "ENTRADA") return <span className="badge badge-success">▲ ENTRADA</span>;
    if (t === "SALIDA") return <span className="badge badge-danger">▼ SALIDA</span>;
    return <span className="badge badge-info">⬤ AJUSTE</span>;
  }

  function reasonLabel(r: string) {
    const map: Record<string, string> = {
      COMPRA: "Compra/Recepción",
      DESPACHO: "Despacho a paciente",
      VENCIMIENTO: "Vencimiento/Baja",
      AJUSTE: "Ajuste de inventario",
    };
    return map[r] || r;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Kárdex INVIMA</h1>
        <p>Registro oficial de movimientos de inventario — cumplimiento normativo Resolución 1403 de 2007</p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: "1.5rem" }}>
        📋 <strong>Resolución 1403/2007 INVIMA:</strong> Este kárdex registra automáticamente cada entrada, salida y ajuste de medicamentos con trazabilidad completa de lotes.
      </div>

      {/* Resumen por producto */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <div className="card-title">Estado Actual del Inventario</div>
          <div className="card-subtitle">Saldo por medicamento</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Genérico</th>
                <th>Registro INVIMA</th>
                <th>Lote</th>
                <th>Stock Actual</th>
                <th>Costo Unit.</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Sin productos registrados</td></tr>
              )}
              {products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td className="text-sm text-muted">{p.genericName}</td>
                  <td className="text-xs text-muted">{p.invimaSanitary || "—"}</td>
                  <td className="text-xs text-muted">{p.lot || "—"}</td>
                  <td style={{ fontWeight: 700, color: p.stock === 0 ? "var(--danger)" : p.stock <= p.minStock ? "#d97706" : "var(--success)" }}>
                    {p.stock} {p.unit}
                  </td>
                  <td>${p.unitCost.toLocaleString("es-CO")}</td>
                  <td>
                    {p.controlled
                      ? <span className="badge badge-danger">Control Especial</span>
                      : p.requiresPrescription
                      ? <span className="badge badge-warning">Fórmula Médica</span>
                      : <span className="badge badge-muted">OTC</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movimientos */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Registro de Movimientos ({entries.length})</div>
            <div className="card-subtitle">Trazabilidad completa de entradas y salidas</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Medicamento</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Saldo</th>
                <th>Motivo</th>
                <th>Lote</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Sin movimientos registrados</td></tr>
              )}
              {entries.map(e => (
                <tr key={e.id}>
                  <td className="text-xs text-muted">
                    {new Date(e.createdAt).toLocaleDateString("es-CO")}<br />
                    {new Date(e.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.product.name}</div>
                    <div className="text-xs text-muted">{e.product.genericName}</div>
                  </td>
                  <td>{typeBadge(e.type)}</td>
                  <td style={{ fontWeight: 700, color: e.type === "ENTRADA" ? "var(--success)" : "var(--danger)" }}>
                    {e.type === "ENTRADA" ? "+" : "-"}{e.quantity} {e.product.unit}
                  </td>
                  <td style={{ fontWeight: 700 }}>{e.balanceAfter} {e.product.unit}</td>
                  <td className="text-sm">{reasonLabel(e.reason)}</td>
                  <td className="text-xs text-muted">{e.lot || "—"}</td>
                  <td className="text-xs text-muted">{e.reference ? e.reference.slice(-8).toUpperCase() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
