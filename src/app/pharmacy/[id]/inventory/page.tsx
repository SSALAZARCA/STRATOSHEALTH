import { PrismaClient } from "@prisma/client";
import { createProduct } from "@/lib/actions/ips";
import { auth } from "@/auth";
import InventoryImportClient from "./InventoryImportClient";

const prisma = new PrismaClient();

export default async function InventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  
  const session = await auth();
  const userRole = session?.user?.role;

  const products = await prisma.product.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
  const lowStock = products.filter(p => p.stock <= p.minStock);
  const outOfStock = products.filter(p => p.stock === 0);
  const controlled = products.filter(p => p.controlled);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Inventario de Medicamentos</h1>
          <p>Control INVIMA — registro sanitario, lotes, vencimientos y movimientos</p>
        </div>
        {(userRole === "PHARMACIST" || userRole === "MANAGER") && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <a href="#importar" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "linear-gradient(135deg, #1863dc, #3b82f6)",
              color: "white", fontWeight: 700, fontSize: "0.9rem",
              padding: "0.6rem 1.25rem", borderRadius: "8px", textDecoration: "none",
              boxShadow: "0 4px 12px rgba(24,99,220,0.3)"
            }}>
              📥 Importar Excel / CSV
            </a>
          </div>
        )}
      </div>

      {/* Alertas */}
      {outOfStock.length > 0 && (
        <div className="alert alert-danger">🚨 <strong>{outOfStock.length} medicamento(s) AGOTADO(S):</strong> {outOfStock.map(p => p.name).join(", ")}</div>
      )}
      {lowStock.length > 0 && (
        <div className="alert alert-warning">⚠️ <strong>{lowStock.length} medicamento(s) con STOCK BAJO</strong> — Genere órdenes de compra.</div>
      )}

      {/* Estadísticas */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dbeafe" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
          </div>
          <div><div className="stat-value">{products.length}</div><div className="stat-label">Total Productos</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fee2e2" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          </div>
          <div><div className="stat-value">{outOfStock.length}</div><div className="stat-label">Agotados</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef9c3" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2"><line x1="12" y1="9" x2="12" y2="13"/></svg>
          </div>
          <div><div className="stat-value">{lowStock.length}</div><div className="stat-label">Stock Bajo</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#ede9fe" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          </div>
          <div><div className="stat-value">{controlled.length}</div><div className="stat-label">Control Especial</div></div>
        </div>
      </div>

      {/* Importación masiva CSV */}
      {(userRole === "PHARMACIST" || userRole === "MANAGER") && (
        <InventoryImportClient currentProducts={products} />
      )}

      {/* Formulario nuevo producto */}
      {userRole === "PHARMACIST" && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-header"><div className="card-title">➕ Registrar Medicamento / Producto</div></div>
          <form action={createProduct}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre comercial *</label>
                <input name="name" required className="form-control" placeholder="Ej: Acetaminofén 500mg" />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre genérico *</label>
                <input name="genericName" required className="form-control" placeholder="Ej: Paracetamol" />
              </div>
              <div className="form-group">
                <label className="form-label">Concentración</label>
                <input name="concentration" className="form-control" placeholder="Ej: 500mg, 250mg/5ml" />
              </div>
              <div className="form-group">
                <label className="form-label">Forma farmacéutica</label>
                <select name="pharmaceuticalForm" className="form-control">
                  <option value="">Seleccionar...</option>
                  <option>Tableta</option><option>Cápsula</option><option>Ampolla</option>
                  <option>Jarabe</option><option>Suspensión</option><option>Solución IV</option>
                  <option>Crema</option><option>Parche</option><option>Supositorio</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Registro INVIMA</label>
                <input name="invimaSanitary" className="form-control" placeholder="Ej: INVIMA 2023M-0012345" />
              </div>
              <div className="form-group">
                <label className="form-label">Código ATC</label>
                <input name="atcCode" className="form-control" placeholder="Ej: N02BE01" />
              </div>
              <div className="form-group">
                <label className="form-label">Unidad</label>
                <select name="unit" className="form-control">
                  <option value="UND">UND — Unidad</option>
                  <option value="ML">ML — Mililitros</option>
                  <option value="MG">MG — Miligramos</option>
                  <option value="CAP">CAP — Cápsula</option>
                  <option value="AMP">AMP — Ampolla</option>
                  <option value="FRS">FRS — Frasco</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Stock inicial</label>
                <input name="stock" type="number" min="0" defaultValue="0" className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Stock mínimo</label>
                <input name="minStock" type="number" min="0" defaultValue="10" className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Stock máximo</label>
                <input name="maxStock" type="number" min="0" defaultValue="500" className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Costo unitario ($)</label>
                <input name="unitCost" type="number" step="0.01" min="0" defaultValue="0" className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Precio venta ($)</label>
                <input name="salePrice" type="number" step="0.01" min="0" defaultValue="0" className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Lote</label>
                <input name="lot" className="form-control" placeholder="Número de lote" />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Vencimiento *</label>
                <input type="date" name="expiryDate" required className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select name="category" className="form-control">
                  <option value="">Seleccionar...</option>
                  <option>Analgésico</option><option>Antibiótico</option><option>Antihipertensivo</option>
                  <option>Antiinflamatorio</option><option>Anticoagulante</option><option>Antidiabético</option>
                  <option>Psicotrópico</option><option>Insumo médico</option><option>Solución IV</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ubicación en farmacia</label>
                <input name="location" className="form-control" placeholder="Ej: Estante A-3" />
              </div>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" name="controlled" value="true" />
                <span className="badge badge-danger">⚠️ Control Especial</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" name="requiresPrescription" value="true" />
                <span className="badge badge-warning">Requiere Fórmula Médica</span>
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">💊 Registrar en Inventario</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla inventario */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Inventario Actual ({products.length} productos)</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Forma / Concentración</th>
                <th>Registro INVIMA</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Stock</th>
                <th>Mín</th>
                <th>Costo Unit.</th>
                <th>Categoría</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Sin productos registrados</td></tr>
              )}
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="text-xs text-muted">{p.genericName}</div>
                  </td>
                  <td className="text-sm">{p.pharmaceuticalForm || "—"}<br /><span className="text-muted">{p.concentration || "—"}</span></td>
                  <td className="text-xs text-muted">{p.invimaSanitary || "—"}</td>
                  <td className="text-xs text-muted">{p.lot || "—"}</td>
                  <td className="text-xs">
                    {p.expiryDate ? (
                      <span className={`badge ${
                        new Date(p.expiryDate) < new Date() ? 'badge-danger' : 
                        new Date(p.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? 'badge-warning' : 'badge-success'
                      }`}>
                        {new Date(p.expiryDate).toLocaleDateString("es-CO")}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ fontWeight: 700, color: p.stock === 0 ? "var(--danger)" : p.stock <= p.minStock ? "#d97706" : "var(--success)" }}>
                    {p.stock} {p.unit}
                    {p.stock === 0 && <div><span className="badge badge-danger" style={{ fontSize: "0.6rem" }}>AGOTADO</span></div>}
                    {p.stock > 0 && p.stock <= p.minStock && <div><span className="badge badge-warning" style={{ fontSize: "0.6rem" }}>BAJO</span></div>}
                  </td>
                  <td className="text-muted">{p.minStock}</td>
                  <td style={{ fontWeight: 600 }}>${p.unitCost.toLocaleString("es-CO")}</td>
                  <td className="text-sm text-muted">{p.category || "—"}</td>
                  <td>
                    {p.controlled
                      ? <span className="badge badge-danger">Control Esp.</span>
                      : p.requiresPrescription
                      ? <span className="badge badge-warning">Fórmula</span>
                      : <span className="badge badge-muted">OTC</span>}
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
