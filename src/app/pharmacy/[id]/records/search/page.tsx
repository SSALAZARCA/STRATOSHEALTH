import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { SecureAuditButton } from "../SecureAuditButton";

const prisma = new PrismaClient();

export default async function SearchRecordsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ q?: string }> }) {
  const { id } = await params;
  const { q } = await searchParams;
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return <div>No autorizado</div>;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) return <div>IPS no encontrada</div>;

  // Cargar todas las historias clínicas con los datos del paciente (Filtradas)
  const histories = await prisma.clinicalHistory.findMany({
    where: { 
      tenantId: tenant.id,
      ...(q ? {
        patient: {
          OR: [
            { name: { contains: q } },
            { documentNumber: { contains: q } }
          ]
        }
      } : {})
    },
    include: { 
      patient: true,
      _count: {
        select: { records: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Gestión de Historias Clínicas</h1>
        <p>Búsqueda y acceso seguro a expedientes médicos.</p>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div className="card-title">Expedientes de Pacientes ({histories.length})</div>
          <form method="GET" style={{ display: "flex", gap: "0.5rem" }}>
            <input type="text" name="q" placeholder="Buscar por Nombre o Cédula..." className="form-control" defaultValue={q || ""} />
            <button type="submit" className="btn btn-secondary">Buscar</button>
            {q && <a href={`/pharmacy/${tenant.id}/records/search`} className="btn btn-muted">Limpiar</a>}
          </form>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Identificación</th>
                <th>Paciente</th>
                <th>Registros Totales</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {histories.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>No se encontraron pacientes.</td>
                </tr>
              )}
              {histories.map(h => (
                <tr key={h.id}>
                  <td>{h.patient.documentType} {h.patient.documentNumber}</td>
                  <td style={{ fontWeight: 600 }}>{h.patient.name}</td>
                  <td><span className="badge badge-primary">{h._count.records} Notas</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <SecureAuditButton patientId={h.patientId} tenantId={tenant.id} />
                      <a href={`/pharmacy/${tenant.id}/records/search/${h.patientId}/logs`} className="btn btn-sm btn-secondary">
                        Historial
                      </a>
                    </div>
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
