import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import UserActions from "./UserActions";

const prisma = new PrismaClient();

export default async function UsersManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  const session = await auth();

  const sessionUser = session?.user?.email 
    ? await prisma.user.findUnique({ where: { email: session.user.email } }) 
    : null;
  const sessionUserId = sessionUser?.id;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true }
  });

  const users = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { role: "asc" }
  });

  const maxUsers = tenant?.plan?.maxUsers || 5;
  const isLimitReached = users.length >= maxUsers;

  async function createUser(formData: FormData) {
    "use server";
    
    // Server-side validation
    const currentUsersCount = await prisma.user.count({ where: { tenantId } });
    const currentTenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { plan: true } });
    const currentMax = currentTenant?.plan?.maxUsers || 5;
    if (currentUsersCount >= currentMax) {
      throw new Error("Límite de usuarios alcanzado según su plan de suscripción.");
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as any;
    const password = formData.get("password") as string;

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        tenantId,
        name,
        email,
        role,
        password: passwordHash
      }
    });

    revalidatePath(`/pharmacy/${tenantId}/users`);
  }

  async function toggleUserActive(userId: string, currentActive: boolean) {
    "use server";
    if (userId === sessionUserId) {
      throw new Error("No puedes inactivar tu propio usuario.");
    }

    await prisma.user.update({
      where: { id: userId, tenantId },
      data: { active: !currentActive }
    });

    revalidatePath(`/pharmacy/${tenantId}/users`);
  }

  async function deleteUser(userId: string) {
    "use server";
    if (userId === sessionUserId) {
      throw new Error("No puedes eliminar tu propio usuario.");
    }

    await prisma.user.delete({
      where: { id: userId, tenantId }
    });

    revalidatePath(`/pharmacy/${tenantId}/users`);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Gestión de Personal</h1>
        <p>Administra los accesos de enfermería y regentes de farmacia para tu clínica</p>
      </div>

      <div className="grid-layout-sidebar">
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="card-title">Personal Activo</div>
            <div className="text-sm text-muted">
              {users.length} / {maxUsers} Usuarios permitidos
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'MANAGER' ? 'badge-info' : u.role === 'PHARMACIST' ? 'badge-primary' : u.role === 'DOCTOR' ? 'badge-success' : u.role === 'RECORDS_MANAGER' ? 'badge-muted' : 'badge-warning'}`}>
                        {u.role === 'MANAGER' ? 'Gerente' : u.role === 'PHARMACIST' ? 'Regente' : u.role === 'DOCTOR' ? 'Médico' : u.role === 'RECORDS_MANAGER' ? 'Archivo / Historias' : 'Enfermera'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      {u.id !== sessionUserId ? (
                        <UserActions 
                          userId={u.id}
                          userName={u.name}
                          active={u.active}
                          toggleActiveAction={toggleUserActive}
                          deleteAction={deleteUser}
                        />
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>(Tú)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ height: "fit-content", position: "sticky", top: "2rem" }}>
          <div className="card-header">
            <div className="card-title">Nuevo Empleado</div>
          </div>
          
          {isLimitReached ? (
            <div style={{ padding: "1.5rem" }}>
              <div className="alert alert-warning" style={{ background: "rgba(255, 193, 7, 0.1)", border: "1px solid rgba(255, 193, 7, 0.3)", padding: "1rem", borderRadius: "var(--radius-sm)", color: "#b48308" }}>
                <strong style={{ display: "block", marginBottom: "0.5rem" }}>Límite Alcanzado</strong>
                Has alcanzado el límite máximo de usuarios ({maxUsers}) permitidos por tu plan de suscripción actual. <br/><br/>
                Por favor, contacta a soporte comercial para actualizar a un plan superior.
              </div>
            </div>
          ) : (
            <form action={createUser} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Nombre Completo</label>
                <input type="text" name="name" required className="form-control" style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Correo Electrónico</label>
                <input type="email" name="email" required className="form-control" style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Rol</label>
                <select name="role" className="form-control" style={{ width: "100%" }}>
                  <option value="NURSE">Enfermería</option>
                  <option value="DOCTOR">Médico Especialista</option>
                  <option value="PHARMACIST">Regente de Farmacia</option>
                  <option value="RECORDS_MANAGER">Gestión Documental / Archivo</option>
                  <option value="MANAGER">Gerente Administrativo</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Contraseña Inicial</label>
                <input type="password" name="password" required className="form-control" style={{ width: "100%" }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem", width: "100%" }}>
                Crear Empleado
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
