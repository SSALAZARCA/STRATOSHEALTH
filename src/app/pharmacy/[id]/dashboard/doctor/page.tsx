import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function DoctorDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return <div>No autorizado</div>;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) return <div>IPS no encontrada</div>;

  const doctor = await prisma.user.findUnique({
    where: { email },
  });

  // Mostrar pacientes recientes que tienen historia clínica
  const patients = await prisma.patient.findMany({
    where: { tenantId: tenant.id },
    include: { clinicalHistory: true },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Portal Médico - {tenant.name}</h1>
        <p>Bienvenido Dr(a). {doctor?.name}. Gestión de Historias Clínicas y Pacientes.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Pacientes Recientes</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Identificación</th>
                <th>Paciente</th>
                <th>Aseguradora</th>
                <th>Estado de Historia</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>No hay pacientes registrados.</td>
                </tr>
              )}
              {patients.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.documentNumber}</td>
                  <td>{p.name}</td>
                  <td>Particular</td>
                  <td>
                    {p.clinicalHistory ? (
                      <span className="badge badge-success">Historia Activa</span>
                    ) : (
                      <span className="badge badge-warning">Sin Historia</span>
                    )}
                  </td>
                  <td>
                    <a href={`/pharmacy/${tenant.id}/patients/${p.id}/history`} className="btn btn-sm btn-primary">
                      Abrir Historia
                    </a>
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
