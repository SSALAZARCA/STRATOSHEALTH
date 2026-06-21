import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { ToggleTenantButton } from "./ToggleTenantButton";

const prisma = new PrismaClient();

export default async function SuperAdminTenants() {
  const tenants = await prisma.tenant.findMany({
    include: { users: true, plan: true },
    orderBy: { createdAt: "desc" }
  });

  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true }
  });

  async function createTenant(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const nit = formData.get("nit") as string;
    const email = formData.get("email") as string;
    const adminEmail = formData.get("adminEmail") as string;
    const adminPassword = formData.get("adminPassword") as string;
    const planId = formData.get("planId") as string;

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    await prisma.tenant.create({
      data: {
        name,
        nit,
        email,
        planId,
        subscriptionPlan: plan ? plan.name : "BASIC",
        users: {
          create: {
            name: `Gerente de ${name}`,
            email: adminEmail,
            password: passwordHash,
            role: "MANAGER"
          }
        }
      }
    });

    revalidatePath("/superadmin/tenants");
  }

  async function toggleTenantStatus(tenantId: string, newStatus: string) {
    "use server";
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { subscriptionStatus: newStatus }
    });
    revalidatePath("/superadmin/tenants");
    revalidatePath("/superadmin/dashboard");
  }

  return (
    <div>
      <div className="page-header">
        <h1>Suscripciones (IPS)</h1>
        <p>Gestiona las clínicas que utilizan el software</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Listado de IPS</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>IPS</th>
                  <th>NIT</th>
                  <th>Estado</th>
                  <th>Plan</th>
                  <th>Admin Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => {
                  const manager = tenant.users.find(u => u.role === "MANAGER");
                  return (
                    <tr key={tenant.id}>
                      <td style={{ fontWeight: 600 }}>{tenant.name}</td>
                      <td>{tenant.nit}</td>
                      <td>
                        <span className={`badge ${tenant.subscriptionStatus === "ACTIVE" ? "badge-success" : "badge-danger"}`}>
                          {tenant.subscriptionStatus}
                        </span>
                      </td>
                      <td><span className="badge badge-info">{tenant.plan?.name || tenant.subscriptionPlan}</span></td>
                      <td className="text-sm">{manager?.email || "Sin asignar"}</td>
                      <td>
                        {tenant.id !== "ips-principal" && (
                          <ToggleTenantButton tenantId={tenant.id} currentStatus={tenant.subscriptionStatus} action={toggleTenantStatus} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-header">
            <div className="card-title">Nueva IPS</div>
          </div>
          <form action={createTenant} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Nombre Clínica/IPS</label>
              <input type="text" name="name" required className="form-control" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>NIT</label>
              <input type="text" name="nit" required className="form-control" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Correo Contacto</label>
              <input type="email" name="email" required className="form-control" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Plan</label>
              <select name="planId" className="form-control" style={{ width: "100%" }} required defaultValue="">
                <option value="" disabled>Selecciona un plan</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${p.price.toLocaleString("es-CO")} / {p.durationMonths === 1 ? "mes" : p.durationMonths === 12 ? "año" : p.durationMonths + " meses"}
                  </option>
                ))}
              </select>
            </div>
            
            <hr style={{ borderColor: "var(--border)", margin: "0.5rem 0" }} />
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>Credenciales del Gerente</div>

            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Correo del Gerente</label>
              <input type="email" name="adminEmail" required className="form-control" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Contraseña Inicial</label>
              <input type="password" name="adminPassword" required className="form-control" style={{ width: "100%" }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>+ Crear Suscripción e IPS</button>
          </form>
        </div>
      </div>
    </div>
  );
}
