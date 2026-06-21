import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function SuperAdminDashboard() {
  const tenants = await prisma.tenant.findMany({
    include: { users: true }
  });

  const activeTenants = tenants.filter(t => t.subscriptionStatus === "ACTIVE");
  const suspendedTenants = tenants.filter(t => t.subscriptionStatus === "SUSPENDED");
  
  // Asumimos MRR de $200.000 COP por IPS activa
  const monthlyRevenue = activeTenants.length * 200000;

  return (
    <div>
      <div className="page-header">
        <h1>SaaS Dashboard</h1>
        <p>Métricas globales de la plataforma Stratos Health</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Ingresos Mensuales Recurrentes (MRR)</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>${monthlyRevenue.toLocaleString("es-CO")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">IPS Activas</div>
          <div className="stat-value">{activeTenants.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">IPS Suspendidas</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>{suspendedTenants.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Usuarios Totales</div>
          <div className="stat-value">{tenants.reduce((sum, t) => sum + t.users.length, 0)}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-header">
          <div className="card-title">Clientes Recientes</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>IPS</th>
                <th>NIT</th>
                <th>Usuarios</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {tenants.slice(0, 5).map(tenant => (
                <tr key={tenant.id}>
                  <td style={{ fontWeight: 600 }}>{tenant.name}</td>
                  <td>{tenant.nit}</td>
                  <td>{tenant.users.length}</td>
                  <td><span className="badge badge-info">{tenant.subscriptionPlan}</span></td>
                  <td>
                    <span className={`badge ${tenant.subscriptionStatus === "ACTIVE" ? "badge-success" : "badge-danger"}`}>
                      {tenant.subscriptionStatus}
                    </span>
                  </td>
                  <td>{new Date(tenant.createdAt).toLocaleDateString("es-CO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
