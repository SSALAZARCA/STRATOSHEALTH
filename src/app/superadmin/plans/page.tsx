import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DeletePlanButton } from "./DeletePlanButton";
import { FeaturesChecklist } from "./FeaturesChecklist";

const prisma = new PrismaClient();

export default async function SuperAdminPlans({ searchParams }: { searchParams: Promise<{ editId?: string }> }) {
  const { editId } = await searchParams;
  
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { price: "asc" }
  });

  const editingPlan = editId ? plans.find(p => p.id === editId) : null;

  async function createPlan(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const durationMonths = parseInt(formData.get("durationMonths") as string, 10);
    const maxUsers = parseInt(formData.get("maxUsers") as string, 10);
    const checkedFeatures = formData.getAll("features") as string[];
    const features = JSON.stringify(checkedFeatures);

    await prisma.subscriptionPlan.create({
      data: {
        name,
        price,
        durationMonths,
        maxUsers,
        features
      }
    });

    revalidatePath("/superadmin/plans");
  }

  async function editPlan(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const durationMonths = parseInt(formData.get("durationMonths") as string, 10);
    const maxUsers = parseInt(formData.get("maxUsers") as string, 10);
    const checkedFeatures = formData.getAll("features") as string[];
    const features = JSON.stringify(checkedFeatures);

    await prisma.subscriptionPlan.update({
      where: { id },
      data: { name, price, durationMonths, maxUsers, features }
    });

    revalidatePath("/superadmin/plans");
    redirect("/superadmin/plans");
  }

  async function togglePlan(planId: string, currentStatus: boolean) {
    "use server";
    await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { active: !currentStatus }
    });
    revalidatePath("/superadmin/plans");
  }

  async function deletePlan(planId: string) {
    "use server";
    // Si queremos eliminar de verdad:
    await prisma.subscriptionPlan.delete({
      where: { id: planId }
    });
    revalidatePath("/superadmin/plans");
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Planes de Suscripción</h1>
        <p>Gestiona los planes comerciales que ofrecerás a las clínicas</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Planes Configurados</div>
          </div>
          <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {plans.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                No hay planes creados
              </div>
            )}
            {plans.map(plan => (
              <div key={plan.id} style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                background: plan.active ? "var(--bg)" : "rgba(0,0,0,0.02)",
                opacity: plan.active ? 1 : 0.7,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{plan.name}</h3>
                  <span className={`badge ${plan.active ? "badge-success" : "badge-danger"}`}>
                    {plan.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                
                <div style={{ marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>
                    ${plan.price.toLocaleString("es-CO")}
                  </span>
                  <span className="text-muted text-sm">
                    {plan.durationMonths === 1 ? "/mes" : plan.durationMonths === 12 ? "/mes (Anual)" : `/mes (${plan.durationMonths} meses)`}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span style={{ fontWeight: 600 }}>{plan.maxUsers} Usuarios Máximo</span>
                  </div>
                  
                  {plan.features && (
                    <div style={{ marginTop: "1rem" }}>
                      <strong className="text-sm">Características:</strong>
                      <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                        {(() => {
                          let feats = [];
                          try {
                            feats = JSON.parse(plan.features);
                            if (!Array.isArray(feats)) feats = plan.features.split(',');
                          } catch {
                            feats = plan.features.split(',');
                          }
                          return feats.map((f: string, i: number) => (
                            <li key={i} style={{ marginBottom: "0.25rem" }}>{f.trim()}</li>
                          ));
                        })()}
                      </ul>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <form action={async () => { "use server"; await togglePlan(plan.id, plan.active); }} style={{ flex: 1 }}>
                      <button type="submit" className={`btn ${plan.active ? "btn-danger" : "btn-success"}`} style={{ width: "100%" }}>
                        {plan.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                    <a href={`/superadmin/plans?editId=${plan.id}`} className="btn btn-secondary" style={{ flex: 1, textAlign: "center" }}>
                      Editar
                    </a>
                    <DeletePlanButton planId={plan.id} deleteAction={deletePlan} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ height: "fit-content", position: "sticky", top: "2rem" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="card-title">{editingPlan ? "Editar Plan" : "Crear Nuevo Plan"}</div>
            {editingPlan && (
              <a href="/superadmin/plans" className="text-muted text-sm">Cancelar</a>
            )}
          </div>
          <form key={editingPlan?.id || "new"} action={editingPlan ? editPlan : createPlan} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {editingPlan && <input type="hidden" name="id" value={editingPlan.id} />}
            <div>
              <label className="form-label">Nombre del Plan</label>
              <input type="text" name="name" required className="form-control" placeholder="Ej: Básico" defaultValue={editingPlan?.name || ""} />
            </div>
            <div>
              <label className="form-label">Precio ($ COP) / Mes</label>
              <input type="number" name="price" required className="form-control" placeholder="Ej: 150000" defaultValue={editingPlan?.price || ""} />
            </div>
            <div>
              <label className="form-label">Frecuencia de Cobro</label>
              <select name="durationMonths" required className="form-control" defaultValue={editingPlan?.durationMonths || "1"}>
                <option value="1">Mensual</option>
                <option value="12">Anual (12 meses)</option>
                <option value="24">2 Años (24 meses)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Límite de Usuarios</label>
              <input type="number" name="maxUsers" required className="form-control" placeholder="5" defaultValue={editingPlan?.maxUsers || ""} />
            </div>
            <FeaturesChecklist defaultCheckedFeatures={(() => {
              if (!editingPlan) return [];
              try {
                const parsed = JSON.parse(editingPlan.features);
                return Array.isArray(parsed) ? parsed : editingPlan.features.split(',').map(f => f.trim());
              } catch {
                return editingPlan.features.split(',').map(f => f.trim());
              }
            })()} />
            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              {editingPlan ? "Guardar Cambios" : "+ Crear Plan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
