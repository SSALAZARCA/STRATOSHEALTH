import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { SecureAuditButton } from "./SecureAuditButton";

const prisma = new PrismaClient();

export default async function RecordsDashboard({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ q?: string }> }) {
  const { id } = await params;
  const { q } = await searchParams;
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return <div>No autorizado</div>;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) return <div>IPS no encontrada</div>;

  // 1. Cargar todas las historias clínicas con los datos del paciente (Filtradas)
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

  // 2. Cargar KPIs (Estadísticas de firmas)
  const totalRecords = await prisma.clinicalRecord.count({
    where: { history: { tenantId: tenant.id } }
  });

  const signedRecords = await prisma.clinicalRecord.count({
    where: { history: { tenantId: tenant.id }, status: "SIGNED" }
  });

  const draftRecords = totalRecords - signedRecords;
  const signedPercentage = totalRecords > 0 ? Math.round((signedRecords / totalRecords) * 100) : 0;

  // 3. Alertas: Borradores con más de 24 horas
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const overdueDrafts = await prisma.clinicalRecord.count({
    where: { 
      history: { tenantId: tenant.id }, 
      status: "DRAFT",
      createdAt: { lt: twentyFourHoursAgo }
    }
  });

  // 4. Historial de movimientos de auditoría recientes (Últimos 10)
  const auditLogs = await prisma.auditLog.findMany({
    where: { 
      tenantId: tenant.id,
      action: { in: ["CREATE_CLINICAL_HISTORY", "SIGN_CLINICAL_RECORD", "ADD_CLINICAL_ADDENDUM", "CREATE_CLINICAL_RECORD"] }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Centro de Control: Gestión Documental</h1>
        <p>Monitor de cumplimiento normativo (Resolución 1995), firmas electrónicas y custodia de expedientes.</p>
      </div>

      <div className="grid-4 mb-4">
        <div className="card text-center">
          <div className="card-title">Pacientes Activos</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)" }}>{histories.length}</div>
          <div className="text-sm text-muted">Historias Clínicas Abiertas</div>
        </div>
        <div className="card text-center">
          <div className="card-title">Blindaje (Firmas)</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--success)" }}>{signedPercentage}%</div>
          <div className="text-sm text-muted">{signedRecords} de {totalRecords} registros firmados</div>
        </div>
        <div className="card text-center">
          <div className="card-title">Borradores Abiertos</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--warning)" }}>{draftRecords}</div>
          <div className="text-sm text-muted">Pendientes por firma 2FA</div>
        </div>
        <div className="card text-center">
          <div className="card-title">Alerta Legal (&gt;24h)</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: overdueDrafts > 0 ? "var(--danger)" : "var(--success)" }}>{overdueDrafts}</div>
          <div className="text-sm text-muted">Borradores expirados</div>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Historial de Movimientos Clínicos (Auditoría)</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Acción</th>
                  <th>Detalle IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "1rem" }}>No hay movimientos registrados recientes.</td>
                  </tr>
                )}
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString("es-CO")}</td>
                    <td>
                      <span className="badge badge-primary">{log.action.replace(/_/g, ' ')}</span>
                      <div className="text-sm mt-1">{log.details}</div>
                    </td>
                    <td><span className="badge badge-muted">{log.ipAddress || "Interna"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
