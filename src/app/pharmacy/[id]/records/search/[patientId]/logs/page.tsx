import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import Link from "next/link";
import { getSignedUrlFromB2 } from "@/lib/b2";

const prisma = new PrismaClient();

export default async function PatientLogsPage({ params }: { params: Promise<{ id: string, patientId: string }> }) {
  const { id, patientId } = await params;
  const session = await auth();

  if (!session?.user?.email) return <div>No autorizado</div>;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) return <div>IPS no encontrada</div>;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!patient) return <div>Paciente no encontrado</div>;

  // Cargar registros de auditoría de acceso general
  const accessLogs = await prisma.auditLog.findMany({
    where: { resourceId: patientId, tenantId: id },
    orderBy: { createdAt: "desc" }
  });

  // Obtener usuarios únicos para mapear nombres en accessLogs
  const userIds = [...new Set(accessLogs.map(l => l.userId).filter(Boolean))] as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, role: true }
  });
  const userMap = users.reduce((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {} as Record<string, { name: string; role: string }>);

  // Cargar exportaciones legales (PDFs)
  const exportLogs = await prisma.documentExportLog.findMany({
    where: { patientId, tenantId: id },
    include: { user: true },
    orderBy: { createdAt: "desc" }
  });

  // Unir y ordenar todos los logs para la vista combinada
  type UnifiedLog = {
    id: string;
    date: Date;
    type: "ACCESS" | "EXPORT";
    user: { name: string; role: string };
    actionStr: string;
    details: string;
    ipAddress: string;
    supportDocumentPath?: string | null;
  };

  // Generar URLs firmadas seguras de Backblaze B2 para cada archivo de exportación
  const resolvedExportLogs = await Promise.all(
    exportLogs.map(async (l) => {
      let signedUrl = null;
      if (l.supportDocumentPath) {
        try {
          signedUrl = await getSignedUrlFromB2(l.supportDocumentPath);
        } catch (error) {
          console.error("Error generating B2 signed URL:", error);
          signedUrl = l.supportDocumentPath; // fallback
        }
      }
      return {
        ...l,
        signedUrl
      };
    })
  );

  const unifiedLogs: UnifiedLog[] = [
    ...accessLogs.map(l => ({
      id: l.id,
      date: l.createdAt,
      type: "ACCESS" as const,
      user: l.userId && userMap[l.userId] ? userMap[l.userId] : { name: "Sistema", role: "SYSTEM" },
      actionStr: "Acceso a Historia Clínica",
      details: l.details || "Lectura del expediente médico",
      ipAddress: l.ipAddress || "Desconocida"
    })),
    ...resolvedExportLogs.map(l => ({
      id: l.id,
      date: l.createdAt,
      type: "EXPORT" as const,
      user: l.user,
      actionStr: "Exportación / Descarga Legal",
      details: l.justification || "Sin justificación registrada",
      ipAddress: l.signatureIp || "Desconocida",
      supportDocumentPath: l.signedUrl
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
        <Link href={`/pharmacy/${id}/records/search`} className="btn btn-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          ← Volver
        </Link>
        <div>
          <h1 style={{ margin: 0 }}>Rastro de Auditoría: {patient.name}</h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>{patient.documentType} {patient.documentNumber} - Trazabilidad de Accesos y Descargas Legales</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Registro de Eventos</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario (Rol)</th>
                <th>Acción Realizada</th>
                <th>Justificación / Detalle</th>
                <th>IP / Origen</th>
                <th>Soporte Físico</th>
              </tr>
            </thead>
            <tbody>
              {unifiedLogs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "1.5rem" }}>No se registran accesos ni descargas para esta historia clínica.</td>
                </tr>
              )}
              {unifiedLogs.map(log => (
                <tr key={`${log.type}-${log.id}`}>
                  <td>{log.date.toLocaleString("es-CO")}</td>
                  <td>
                    <strong>{log.user.name}</strong>
                    <div className="text-xs text-muted">{log.user.role}</div>
                  </td>
                  <td>
                    <span className={`badge ${log.type === 'EXPORT' ? 'badge-primary' : 'badge-secondary'}`}>
                      {log.actionStr}
                    </span>
                  </td>
                  <td style={{ maxWidth: "300px", whiteSpace: "normal" }}>
                    {log.details}
                  </td>
                  <td><span className="badge badge-muted">{log.ipAddress}</span></td>
                  <td>
                    {log.supportDocumentPath ? (
                      <a href={log.supportDocumentPath} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                        📄 Ver Documento
                      </a>
                    ) : (
                      <span className="text-muted text-xs">No aplica</span>
                    )}
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
