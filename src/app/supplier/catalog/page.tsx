import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import SupplierCatalogImportClient from "./SupplierCatalogImportClient";

const prisma = new PrismaClient();

export default async function SupplierCatalog() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return <div>No autorizado</div>;

  const supplier = await prisma.globalSupplier.findUnique({
    where: { email },
    include: { offers: true }
  });

  if (!supplier) return <div>Proveedor no encontrado.</div>;

  async function createOffer(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const genericName = formData.get("genericName") as string;
    const invimaSanitary = formData.get("invimaSanitary") as string;
    const atcCode = formData.get("atcCode") as string;
    const concentration = formData.get("concentration") as string;
    const pharmaceuticalForm = formData.get("pharmaceuticalForm") as string;
    const unit = formData.get("unit") as string || "UND";
    const controlled = formData.get("controlled") === "on";
    const requiresPrescription = formData.get("requiresPrescription") === "on";
    const lot = formData.get("lot") as string || null;
    const expiryDateStr = formData.get("expiryDate") as string;
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;
    const price = parseFloat(formData.get("price") as string);
    const availableStock = parseInt(formData.get("availableStock") as string, 10);
    const leadTimeDays = parseInt(formData.get("leadTimeDays") as string, 10);

    if (!supplier) return;

    await prisma.supplierOffer.create({
      data: {
        supplierId: supplier.id,
        name,
        genericName,
        invimaSanitary,
        atcCode,
        concentration,
        pharmaceuticalForm,
        unit,
        controlled,
        requiresPrescription,
        lot,
        expiryDate,
        price,
        availableStock,
        leadTimeDays
      }
    });

    revalidatePath("/supplier/catalog");
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Mi Catálogo de Ofertas</h1>
          <p>Publica los medicamentos que tienes disponibles para las IPS</p>
        </div>
        <a href="#importar-catalogo" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "white", fontWeight: 700, fontSize: "0.9rem",
          padding: "0.6rem 1.25rem", borderRadius: "8px", textDecoration: "none",
          boxShadow: "0 4px 12px rgba(16,185,129,0.3)"
        }}>
          📥 Importar Excel / CSV
        </a>
      </div>

      {/* Importación masiva CSV */}
      <SupplierCatalogImportClient currentOffers={supplier.offers} />

      <div className="grid-layout-sidebar">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ofertas Publicadas ({supplier.offers.length})</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>INVIMA</th>
                  <th>Lote / Vence</th>
                  <th>Precio Venta</th>
                  <th>Stock B2B</th>
                  <th>Tiempo Entrega</th>
                </tr>
              </thead>
              <tbody>
                {supplier.offers.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Tu catálogo está vacío</td></tr>
                )}
                {supplier.offers.map(offer => (
                  <tr key={offer.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{offer.name} {offer.concentration ? `(${offer.concentration})` : ""}</div>
                      <div className="text-xs text-muted">{offer.genericName} — {offer.pharmaceuticalForm || ""}</div>
                      {offer.controlled && <div className="badge badge-danger text-xs" style={{ marginTop: "0.25rem", display: "inline-block" }}>⚠️ Controlado</div>}
                    </td>
                    <td className="text-sm">
                      <div>{offer.invimaSanitary || "N/A"}</div>
                      <div className="text-xs text-muted">ATC: {offer.atcCode || "—"}</div>
                    </td>
                    <td className="text-sm">
                      <div>Lote: {offer.lot || "—"}</div>
                      <div className="text-xs text-muted">Vence: {offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString("es-CO") : "—"}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--primary)" }}>${offer.price.toLocaleString("es-CO")}</td>
                    <td>{offer.availableStock} <span className="text-xs text-muted">{offer.unit}</span></td>
                    <td><span className="badge badge-warning">{offer.leadTimeDays} días</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-header">
            <div className="card-title">➕ Nueva Oferta</div>
          </div>
          <form action={createOffer} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="grid-layout-2-equal">
              <div>
                <label className="form-label">Nombre Comercial *</label>
                <input type="text" name="name" required className="form-control" placeholder="Ej: Dolex Forte" />
              </div>
              <div>
                <label className="form-label">Nombre Genérico *</label>
                <input type="text" name="genericName" required className="form-control" placeholder="Ej: Paracetamol" />
              </div>
            </div>

            <div className="grid-layout-2-equal">
              <div>
                <label className="form-label">Concentración</label>
                <input type="text" name="concentration" className="form-control" placeholder="Ej: 500mg" />
              </div>
              <div>
                <label className="form-label">Forma Farmacéutica</label>
                <input type="text" name="pharmaceuticalForm" className="form-control" placeholder="Ej: Tableta" />
              </div>
            </div>

            <div className="grid-layout-2-equal">
              <div>
                <label className="form-label">Registro INVIMA</label>
                <input type="text" name="invimaSanitary" className="form-control" placeholder="Opcional" />
              </div>
              <div>
                <label className="form-label">Código ATC</label>
                <input type="text" name="atcCode" className="form-control" placeholder="Opcional" />
              </div>
            </div>

            <div className="grid-layout-2-equal">
              <div>
                <label className="form-label">Lote *</label>
                <input type="text" name="lot" required className="form-control" placeholder="Ej: LT-99882" />
              </div>
              <div>
                <label className="form-label">Fecha de Vencimiento *</label>
                <input type="date" name="expiryDate" required className="form-control" />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", padding: "1rem", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" name="controlled" />
                <span className="text-sm">⚠️ Medicamento de Control Especial</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" name="requiresPrescription" />
                <span className="text-sm">Requiere Fórmula Médica</span>
              </label>
            </div>

            <div className="grid-layout-3-equal">
              <div>
                <label className="form-label">Precio Venta ($) *</label>
                <input type="number" name="price" required className="form-control" min="0" />
              </div>
              <div>
                <label className="form-label">Stock B2B *</label>
                <input type="number" name="availableStock" required className="form-control" min="0" />
              </div>
              <div>
                <label className="form-label">Unidad</label>
                <select name="unit" className="form-control">
                  <option value="UND">UND</option>
                  <option value="CAJA">CAJA</option>
                  <option value="BLISTER">BLISTER</option>
                  <option value="FRASCO">FRASCO</option>
                  <option value="AMPOLLA">AMPOLLA</option>
                  <option value="ML">ML</option>
                  <option value="MG">MG</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label" style={{ color: "var(--warning)" }}>Tiempo de Entrega (Días) *</label>
              <input type="number" name="leadTimeDays" required className="form-control" defaultValue="3" min="1" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>Publicar Oferta</button>
          </form>
        </div>
      </div>
    </div>
  );
}
