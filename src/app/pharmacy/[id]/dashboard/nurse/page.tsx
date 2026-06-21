import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function NurseDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return <div>No autorizado</div>;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) return <div>IPS no encontrada</div>;

  const nurse = await prisma.user.findUnique({
    where: { email },
  });

  // Mostrar todos los pacientes admitidos (activos) para control de enfermería
  const patients = await prisma.patient.findMany({
    where: { 
      tenantId: tenant.id,
      status: "ADMITTED"
    },
    include: { clinicalHistory: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Central de Enfermería - {tenant.name}</h1>
        <p>Bienvenido(a) {nurse?.name}. Control de pacientes ingresados, signos vitales y notas de enfermería.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Pacientes en Turno / Ingresados ({patients.length})</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cama/Ubicación</th>
                <th>Paciente</th>
                <th>Identificación</th>
                <th>Ingreso</th>
                <th>Acción Rápida</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No hay pacientes ingresados en este momento.
                  </td>
                </tr>
              )}
              {patients.map(p => (
                <tr key={p.id}>
                  <td><span className="badge badge-info">{p.bedNumber || "Sin Cama"}</span></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.documentType} {p.documentNumber}</td>
                  <td>{new Date(p.admissionDate || p.createdAt).toLocaleString("es-CO")}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <a href={`/pharmacy/${tenant.id}/patients/${p.id}/history`} className="btn btn-sm btn-primary">
                        + Nueva Nota / Signos
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
