import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { DeleteSupplierButton, DeletePlanButton } from "./SupplierButtons";

const prisma = new PrismaClient();

export default async function SuperAdminSuppliers({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; editSupplierId?: string; editPlanId?: string; newSupplier?: string; error?: string }>
}) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "suppliers";
  const editSupplierId = resolvedParams.editSupplierId;
  const editPlanId = resolvedParams.editPlanId;
  const newSupplier = resolvedParams.newSupplier === "true";
  const error = resolvedParams.error;

  // 1. Obtener Planes de Proveedores
  const plans = await prisma.supplierPlan.findMany({
    orderBy: { price: "asc" }
  });

  // 2. Obtener Proveedores
  const suppliers = await prisma.globalSupplier.findMany({
    include: { plan: true, coverages: true },
    orderBy: { name: "asc" }
  });

  // 3. Obtener Regiones
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" }
  });

  // 4. Cargar entidades para editar si corresponde
  const editingSupplier = editSupplierId 
    ? suppliers.find(s => s.id === editSupplierId) 
    : null;

  const editingPlan = editPlanId 
    ? plans.find(p => p.id === editPlanId) 
    : null;

  // ==========================================================
  // SERVER ACTIONS: PLANES DE PROVEEDORES
  // ==========================================================

  async function createPlan(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const durationMonths = parseInt(formData.get("durationMonths") as string, 10);
    const featuresText = formData.get("features") as string;
    
    // Convertir líneas de textarea a arreglo JSON
    const featuresList = featuresText
      .split("\n")
      .map(f => f.trim())
      .filter(f => f.length > 0);
    const features = JSON.stringify(featuresList);

    await prisma.supplierPlan.create({
      data: { name, price, durationMonths, features }
    });

    revalidatePath("/superadmin/suppliers");
    redirect("/superadmin/suppliers?tab=plans");
  }

  async function updatePlan(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const durationMonths = parseInt(formData.get("durationMonths") as string, 10);
    const featuresText = formData.get("features") as string;
    
    const featuresList = featuresText
      .split("\n")
      .map(f => f.trim())
      .filter(f => f.length > 0);
    const features = JSON.stringify(featuresList);

    await prisma.supplierPlan.update({
      where: { id },
      data: { name, price, durationMonths, features }
    });

    revalidatePath("/superadmin/suppliers");
    redirect("/superadmin/suppliers?tab=plans");
  }

  async function deletePlanAction(id: string) {
    "use server";
    await prisma.supplierPlan.delete({
      where: { id }
    });
    revalidatePath("/superadmin/suppliers");
    redirect("/superadmin/suppliers?tab=plans");
  }

  async function togglePlanActive(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const currentActive = formData.get("currentActive") === "true";

    await prisma.supplierPlan.update({
      where: { id },
      data: { active: !currentActive }
    });

    revalidatePath("/superadmin/suppliers");
    redirect("/superadmin/suppliers?tab=plans");
  }

  // ==========================================================
  // SERVER ACTIONS: PROVEEDORES Y SUSCRIPCIÓN
  // ==========================================================

  async function createSupplier(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const nit = formData.get("nit") as string;
    const email = (formData.get("email") as string).toLowerCase().trim();
    const password = formData.get("password") as string;
    const contact = formData.get("contact") as string || null;
    const phone = formData.get("phone") as string || null;
    const address = formData.get("address") as string || null;
    const planId = formData.get("planId") as string || null;
    const subscriptionStatus = formData.get("subscriptionStatus") as string || "ACTIVE";
    const nextBillingDateVal = formData.get("nextBillingDate") as string;
    const autoRenew = formData.get("autoRenew") === "on";
    const active = formData.get("active") === "on";
    const regionIds = formData.getAll("regions") as string[];

    const nextBillingDate = nextBillingDateVal ? new Date(nextBillingDateVal) : null;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Crear Usuario
        await tx.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            role: "SUPPLIER_ADMIN",
            active: true
          }
        });

        // 2. Crear Registro de Proveedor
        const supplier = await tx.globalSupplier.create({
          data: {
            email,
            name,
            nit,
            contact,
            phone,
            address,
            planId: planId === "none" ? null : planId,
            subscriptionStatus,
            nextBillingDate,
            autoRenew,
            active
          }
        });

        // 3. Crear Cobertura
        if (regionIds.length > 0) {
          await tx.supplierCoverage.createMany({
            data: regionIds.map(regionId => ({
              supplierId: supplier.id,
              regionId
            }))
          });
        }
      });
    } catch (e: any) {
      console.error("Error al registrar proveedor:", e);
      if (e.code === "P2002" || e.message?.includes("Unique constraint")) {
        redirect("/superadmin/suppliers?tab=suppliers&error=duplicate");
      }
      redirect("/superadmin/suppliers?tab=suppliers&error=failed");
    }

    revalidatePath("/superadmin/suppliers");
    redirect("/superadmin/suppliers?tab=suppliers");
  }

  async function updateSupplierSubscription(formData: FormData) {
    "use server";
    const supplierId = formData.get("supplierId") as string;
    const planId = formData.get("planId") as string || null;
    const subscriptionStatus = formData.get("subscriptionStatus") as string;
    const nextBillingDateVal = formData.get("nextBillingDate") as string;
    const autoRenew = formData.get("autoRenew") === "on";
    const active = formData.get("active") === "on";
    const regionIds = formData.getAll("regions") as string[];

    const nextBillingDate = nextBillingDateVal ? new Date(nextBillingDateVal) : null;

    await prisma.$transaction(async (tx) => {
      await tx.globalSupplier.update({
        where: { id: supplierId },
        data: {
          planId: planId === "none" ? null : planId,
          subscriptionStatus,
          nextBillingDate,
          autoRenew,
          active
        }
      });

      await tx.supplierCoverage.deleteMany({
        where: { supplierId }
      });

      if (regionIds.length > 0) {
        await tx.supplierCoverage.createMany({
          data: regionIds.map(regionId => ({
            supplierId,
            regionId
          }))
        });
      }
    });

    revalidatePath("/superadmin/suppliers");
    redirect("/superadmin/suppliers?tab=suppliers");
  }

  async function deleteSupplierAction(id: string) {
    "use server";
    const supplier = await prisma.globalSupplier.findUnique({
      where: { id }
    });

    if (supplier) {
      try {
        await prisma.$transaction([
          prisma.supplierCoverage.deleteMany({
            where: { supplierId: id }
          }),
          prisma.globalSupplier.delete({
            where: { id }
          }),
          prisma.user.delete({
            where: { email: supplier.email }
          })
        ]);
      } catch (err) {
        console.error("No se pudo eliminar el proveedor:", err);
        redirect("/superadmin/suppliers?tab=suppliers&error=delete_failed");
      }
    }

    revalidatePath("/superadmin/suppliers");
    redirect("/superadmin/suppliers?tab=suppliers");
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Suscripción de Proveedores</h1>
        <p>Configura planes comerciales y administra los accesos para laboratorios y distribuidoras aliadas.</p>
      </div>

      {/* Alertas de Error */}
      {error === "duplicate" && (
        <div style={{
          marginBottom: "1.5rem",
          background: "#fee2e2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          padding: "1rem",
          borderRadius: "8px",
          fontWeight: 600
        }}>
          ⚠️ El correo electrónico o NIT ya se encuentra registrado en el sistema. Por favor utiliza datos diferentes.
        </div>
      )}
      {error === "delete_failed" && (
        <div style={{
          marginBottom: "1.5rem",
          background: "#fee2e2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          padding: "1rem",
          borderRadius: "8px",
          fontWeight: 600
        }}>
          ⚠️ No se pudo eliminar el proveedor. Asegúrese de que no tenga órdenes de compra asociadas.
        </div>
      )}
      {error === "failed" && (
        <div style={{
          marginBottom: "1.5rem",
          background: "#fee2e2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          padding: "1rem",
          borderRadius: "8px",
          fontWeight: 600
        }}>
          ⚠️ Ocurrió un error inesperado al registrar el proveedor.
        </div>
      )}

      {/* Navegación por Pestañas */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
        <a 
          href="/superadmin/suppliers?tab=suppliers"
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "8px",
            background: currentTab === "suppliers" ? "var(--primary)" : "transparent",
            color: currentTab === "suppliers" ? "white" : "var(--text-muted)",
            fontWeight: 700,
            textDecoration: "none"
          }}
        >
          📦 Proveedores Registrados
        </a>
        <a 
          href="/superadmin/suppliers?tab=plans"
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "8px",
            background: currentTab === "plans" ? "var(--primary)" : "transparent",
            color: currentTab === "plans" ? "white" : "var(--text-muted)",
            fontWeight: 700,
            textDecoration: "none"
          }}
        >
          💎 Planes para Proveedores
        </a>
      </div>

      {/* CONTENIDO PESTAÑA: PROVEEDORES */}
      {currentTab === "suppliers" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 370px", gap: "2rem" }}>
          {/* Listado de Proveedores */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="card-title">Listado Comercial de Proveedores</div>
              <a 
                href="/superadmin/suppliers?tab=suppliers&newSupplier=true" 
                className="btn btn-primary btn-sm"
                style={{ textDecoration: "none" }}
              >
                + Registrar Proveedor
              </a>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>NIT / Email</th>
                    <th>Plan Actual</th>
                    <th>Fecha de Pago</th>
                    <th>Estado Suscripción</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => {
                    const isExpired = s.nextBillingDate ? new Date(s.nextBillingDate) < new Date() : false;
                    const isSuspended = s.subscriptionStatus !== "ACTIVE" || isExpired;
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div className="text-xs text-muted">Contacto: {s.contact || "Sin contacto"}</div>
                        </td>
                        <td>
                          <div className="text-sm font-semibold">{s.nit}</div>
                          <div className="text-xs text-muted">{s.email}</div>
                        </td>
                        <td>
                          {s.plan ? (
                            <span className="badge badge-primary">{s.plan.name}</span>
                          ) : (
                            <span className="badge badge-muted">Sin Plan</span>
                          )}
                        </td>
                        <td>
                          {s.nextBillingDate ? (
                            <div className="text-sm font-semibold" style={{ color: isExpired ? "var(--danger)" : undefined }}>
                              {new Date(s.nextBillingDate).toLocaleDateString("es-CO")}
                            </div>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${isSuspended ? "badge-danger" : "badge-success"}`} style={{ background: isSuspended ? "#ef4444" : undefined }}>
                            {isSuspended ? "Suspendido / Vencido" : "Activo"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${s.active ? "badge-success" : "badge-danger"}`}>
                            {s.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                            <a 
                              href={`/superadmin/suppliers?tab=suppliers&editSupplierId=${s.id}`} 
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", textDecoration: "none" }}
                            >
                              Editar
                            </a>
                            <DeleteSupplierButton 
                              id={s.id} 
                              deleteAction={deleteSupplierAction} 
                              confirmMessage="¿Está seguro de eliminar este proveedor? Se eliminará su cuenta de acceso B2B."
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", background: "#ef4444", color: "white", border: "none", cursor: "pointer", borderRadius: "6px" }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        No hay proveedores registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulario Lateral: Crear o Editar */}
          <div className="card" style={{ height: "fit-content", position: "sticky", top: "2rem" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="card-title">
                {editingSupplier ? "Modificar Suscripción" : newSupplier ? "Registrar Proveedor" : "Administración"}
              </div>
              {(editingSupplier || newSupplier) && (
                <a href="/superadmin/suppliers?tab=suppliers" className="text-muted text-sm" style={{ textDecoration: "none" }}>Cancelar</a>
              )}
            </div>

            {editingSupplier ? (
              <form action={updateSupplierSubscription} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input type="hidden" name="supplierId" value={editingSupplier.id} />
                
                <div>
                  <strong style={{ display: "block", color: "var(--primary)", fontSize: "1.1rem" }}>{editingSupplier.name}</strong>
                  <span className="text-xs text-muted">NIT: {editingSupplier.nit} | {editingSupplier.email}</span>
                </div>

                <div>
                  <label className="form-label">Plan Asignado</label>
                  <select name="planId" className="form-control" defaultValue={editingSupplier.planId || "none"} style={{ width: "100%" }}>
                    <option value="none">Ninguno (Sin Plan / Acceso Gratuito)</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price.toLocaleString("es-CO")} COP / {p.durationMonths}m)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Estado de Suscripción</label>
                  <select name="subscriptionStatus" className="form-control" defaultValue={editingSupplier.subscriptionStatus} style={{ width: "100%" }}>
                    <option value="ACTIVE">Activa (Vigente)</option>
                    <option value="SUSPENDED">Suspendida (Bloqueada)</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Próxima Fecha de Pago</label>
                  <input 
                    type="date" 
                    name="nextBillingDate" 
                    className="form-control" 
                    style={{ width: "100%" }}
                    defaultValue={editingSupplier.nextBillingDate ? new Date(editingSupplier.nextBillingDate).toISOString().split("T")[0] : ""} 
                  />
                </div>

                <div>
                  <label className="form-label">Cobertura Regional</label>
                  <div style={{
                    maxHeight: "150px",
                    overflowY: "auto",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    background: "rgba(255,255,255,0.05)"
                  }}>
                    {regions.map(r => {
                      const hasCoverage = editingSupplier.coverages.some(c => c.regionId === r.id);
                      return (
                        <label key={r.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                          <input type="checkbox" name="regions" value={r.id} defaultChecked={hasCoverage} />
                          <span>{r.name}</span>
                        </label>
                      );
                    })}
                    {regions.length === 0 && (
                      <span className="text-xs text-muted">No hay regiones configuradas</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" name="autoRenew" defaultChecked={editingSupplier.autoRenew} />
                    <span>Renovación Automática</span>
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" name="active" defaultChecked={editingSupplier.active} />
                    <span>Registro Comercial Activo</span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
                  Guardar Cambios
                </button>
              </form>
            ) : newSupplier ? (
              <form action={createSupplier} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Nombre del Proveedor *</label>
                  <input type="text" name="name" required className="form-control" style={{ width: "100%" }} placeholder="Ej: Laboratorios Roche" />
                </div>

                <div>
                  <label className="form-label">NIT *</label>
                  <input type="text" name="nit" required className="form-control" style={{ width: "100%" }} placeholder="Ej: 900.111.222-3" />
                </div>

                <div>
                  <label className="form-label">Correo Electrónico (Acceso) *</label>
                  <input type="email" name="email" required className="form-control" style={{ width: "100%" }} placeholder="Ej: contacto@roche.com" />
                </div>

                <div>
                  <label className="form-label">Contraseña de Acceso *</label>
                  <input type="password" name="password" required className="form-control" style={{ width: "100%" }} placeholder="Mínimo 6 caracteres" minLength={6} />
                </div>

                <div>
                  <label className="form-label">Persona de Contacto</label>
                  <input type="text" name="contact" className="form-control" style={{ width: "100%" }} placeholder="Ej: Juan Pérez" />
                </div>

                <div>
                  <label className="form-label">Teléfono</label>
                  <input type="text" name="phone" className="form-control" style={{ width: "100%" }} placeholder="Ej: 3001234567" />
                </div>

                <div>
                  <label className="form-label">Dirección</label>
                  <input type="text" name="address" className="form-control" style={{ width: "100%" }} placeholder="Ej: Calle 10 # 50-20" />
                </div>

                <div>
                  <label className="form-label">Plan Comercial</label>
                  <select name="planId" className="form-control" style={{ width: "100%" }}>
                    <option value="none">Ninguno (Sin Plan)</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price.toLocaleString("es-CO")} COP / {p.durationMonths}m)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Vencimiento Suscripción</label>
                  <input type="date" name="nextBillingDate" className="form-control" style={{ width: "100%" }} />
                </div>

                <div>
                  <label className="form-label">Cobertura de Regiones</label>
                  <div style={{
                    maxHeight: "120px",
                    overflowY: "auto",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    background: "rgba(255,255,255,0.05)"
                  }}>
                    {regions.map(r => (
                      <label key={r.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                        <input type="checkbox" name="regions" value={r.id} />
                        <span>{r.name}</span>
                      </label>
                    ))}
                    {regions.length === 0 && (
                      <span className="text-xs text-muted">No hay regiones configuradas</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" name="autoRenew" defaultChecked />
                    <span>Renovación Automática</span>
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" name="active" defaultChecked />
                    <span>Registro Comercial Activo</span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
                  Registrar Proveedor
                </button>
              </form>
            ) : (
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center", textAlign: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  Selecciona un proveedor de la lista de la izquierda haciendo clic en <strong>Editar</strong> para gestionar su suscripción, plan y cobertura.
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>O si lo deseas:</span>
                <a 
                  href="/superadmin/suppliers?tab=suppliers&newSupplier=true" 
                  className="btn btn-primary" 
                  style={{ width: "100%", textDecoration: "none", textAlign: "center" }}
                >
                  + Registrar Nuevo Proveedor
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA: PLANES */}
      {currentTab === "plans" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem" }}>
          {/* Listado de Planes de Proveedores */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Planes de Suscripción de Proveedores</div>
            </div>
            <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.5rem" }}>
              {plans.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No hay planes comerciales configurados para proveedores
                </div>
              )}
              {plans.map(p => (
                <div key={p.id} style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  opacity: p.active ? 1 : 0.7
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{p.name}</h3>
                    <span className={`badge ${p.active ? "badge-success" : "badge-danger"}`}>
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)" }}>
                      ${p.price.toLocaleString("es-CO")}
                    </span>
                    <span className="text-xs text-muted" style={{ display: "block" }}>
                      COP total por {p.durationMonths} {p.durationMonths === 1 ? "mes" : "meses"} (${(p.price/p.durationMonths).toLocaleString("es-CO")}/mes)
                    </span>
                  </div>

                  <div style={{ flex: 1, fontSize: "0.85rem" }}>
                    <strong>Características:</strong>
                    <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", color: "var(--text-muted)" }}>
                      {(() => {
                        let feats = [];
                        try {
                          feats = JSON.parse(p.features);
                        } catch {
                          feats = p.features.split(",");
                        }
                        return feats.map((f: string, i: number) => (
                          <li key={i} style={{ marginBottom: "0.25rem" }}>{f}</li>
                        ));
                      })()}
                    </ul>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <form action={togglePlanActive} style={{ flex: 1 }}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="currentActive" value={p.active ? "true" : "false"} />
                      <button type="submit" className={`btn btn-sm ${p.active ? "btn-danger" : "btn-success"}`} style={{ width: "100%" }}>
                        {p.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                    <a href={`/superadmin/suppliers?tab=plans&editPlanId=${p.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textDecoration: "none", textAlign: "center" }}>
                      Editar
                    </a>
                    <DeletePlanButton 
                      id={p.id} 
                      deleteAction={deletePlanAction} 
                      confirmMessage="¿Está seguro de eliminar este plan? Esto podría afectar a los proveedores asociados."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario de Crear/Editar Plan */}
          <div className="card" style={{ height: "fit-content", position: "sticky", top: "2rem" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="card-title">{editingPlan ? "Editar Plan" : "Crear Plan Proveedor"}</div>
              {editingPlan && (
                <a href="/superadmin/suppliers?tab=plans" className="text-muted text-sm" style={{ textDecoration: "none" }}>Cancelar</a>
              )}
            </div>

            <form key={editingPlan?.id || "new"} action={editingPlan ? updatePlan : createPlan} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {editingPlan && <input type="hidden" name="id" value={editingPlan.id} />}
              
              <div>
                <label className="form-label">Nombre del Plan</label>
                <input type="text" name="name" required className="form-control" defaultValue={editingPlan?.name || ""} placeholder="Ej: Catálogo Premium" style={{ width: "100%" }} />
              </div>

              <div>
                <label className="form-label">Precio ($ COP Total)</label>
                <input type="number" name="price" required className="form-control" defaultValue={editingPlan?.price || ""} placeholder="Ej: 300000" style={{ width: "100%" }} />
              </div>

              <div>
                <label className="form-label">Frecuencia de Cobro</label>
                <select name="durationMonths" className="form-control" defaultValue={editingPlan?.durationMonths || "1"} style={{ width: "100%" }}>
                  <option value="1">Mensual</option>
                  <option value="12">Anual (12 meses)</option>
                  <option value="24">2 Años (24 meses)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Características (Una por línea)</label>
                <textarea 
                  name="features" 
                  required 
                  className="form-control" 
                  rows={6}
                  style={{ width: "100%" }}
                  placeholder="Ej:&#10;Catálogo de hasta 100 ofertas&#10;Actualización en tiempo real&#10;Estadísticas de ventas avanzadas"
                  defaultValue={editingPlan ? JSON.parse(editingPlan.features).join("\n") : ""}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
                {editingPlan ? "Actualizar Plan" : "+ Crear Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
