import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function SuppliersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { region: true }
  });

  const suppliers = tenant?.regionId ? await prisma.globalSupplier.findMany({
    where: {
      coverages: { some: { regionId: tenant.regionId } }
    },
    orderBy: { name: "asc" }
  }) : [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Directorio de Proveedores B2B</h1>
        <p>Proveedores farmacéuticos con cobertura en {tenant?.region?.name || "tu región"}</p>
      </div>

      {!tenant?.regionId && (
        <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
          🚨 Tu clínica no tiene configurada una Región. Por favor, contacta a soporte para configurar la ubicación de tu sede.
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">Proveedores Disponibles ({suppliers.length})</div></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Proveedor</th><th>NIT</th><th>Contacto</th><th>Email</th><th>Teléfono</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Sin proveedores en tu región</td></tr>
              )}
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td className="text-sm text-muted">{s.nit}</td>
                  <td className="text-sm">{s.contact || "—"}</td>
                  <td className="text-sm text-muted">{s.email || "—"}</td>
                  <td className="text-sm">{s.phone || "—"}</td>
                  <td><span className={`badge ${s.active ? "badge-success" : "badge-muted"}`}>{s.active ? "Activo" : "Inactivo"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}