import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import Link from "next/link";
import { RecordForm } from "./RecordForm";
import { PdfExportButton } from "./PdfExportButton";

const prisma = new PrismaClient();

export default async function ClinicalHistoryPage({ params }: { params: Promise<{ id: string, patientId: string }> }) {
  const { id, patientId } = await params;
  const session = await auth();
  if (!session?.user?.email) return <div>No autorizado</div>;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return <div>Usuario no encontrado</div>;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });
  if (!patient) return <div>Paciente no encontrado</div>;

  // Garantizar que la historia clínica existe
  let history = await prisma.clinicalHistory.findUnique({
    where: { patientId },
    include: {
      records: {
        include: { author: true, addendums: { include: { author: true } }, diagnoses: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!history) {
    history = await prisma.clinicalHistory.create({
      data: { patientId, tenantId: id },
      include: {
        records: {
          include: { author: true, addendums: { include: { author: true } }, diagnoses: true },
          orderBy: { createdAt: "desc" }
        }
      }
    });
  }

  const isDoctor = user.role === "DOCTOR";
  const isNurse = user.role === "NURSE";
  const isManager = user.role === "MANAGER" || user.role === "RECORDS_MANAGER";

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
        <Link href={`/pharmacy/${id}/patients`} className="btn btn-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          ← Volver
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flex: 1 }}>
          <div>
            <h1 style={{ margin: 0 }}>Historia Clínica</h1>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>{patient.name} - {patient.documentType} {patient.documentNumber}</p>
          </div>
          <PdfExportButton patientId={patient.id} tenantId={id} />
        </div>
      </div>

      <div className="grid-layout-sidebar">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {history.records.length === 0 && (
            <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              No hay registros en la historia clínica.
            </div>
          )}

          {history.records.map((record) => (
            <div key={record.id} className="card" style={{ borderLeft: record.status === "SIGNED" ? "4px solid var(--success)" : "4px solid var(--warning)" }}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className={`badge ${record.type === 'MEDICAL_EVOLUTION' ? 'badge-primary' : 'badge-info'}`}>
                      {record.type === 'MEDICAL_EVOLUTION' ? 'Evolución Médica' : record.type === 'NURSING_NOTE' ? 'Nota de Enfermería' : record.type}
                    </span>
                    {record.status === "SIGNED" ? (
                      <span className="badge badge-success">🔒 Firmado</span>
                    ) : (
                      <span className="badge badge-warning">✏️ Borrador</span>
                    )}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: "0.5rem" }}>
                    {new Date(record.createdAt).toLocaleString("es-CO")} por {record.author.name}
                  </div>
                </div>
              </div>
              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
                
                {record.anamnesis && (
                  <div style={{ marginBottom: "1rem" }}>
                    <strong style={{ display: "block", marginBottom: "0.5rem" }}>Anamnesis / Evolución:</strong>
                    <div style={{ whiteSpace: "pre-wrap", background: "var(--bg)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                      {record.anamnesis}
                    </div>
                  </div>
                )}

                {record.physicalExam && (
                  <div style={{ marginBottom: "1rem" }}>
                    <strong style={{ display: "block", marginBottom: "0.5rem" }}>Examen Físico / Signos Vitales:</strong>
                    <div style={{ whiteSpace: "pre-wrap", background: "var(--bg)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                      {record.physicalExam}
                    </div>
                  </div>
                )}

                {record.managementPlan && (
                  <div style={{ marginBottom: "1rem" }}>
                    <strong style={{ display: "block", marginBottom: "0.5rem" }}>Plan de Manejo:</strong>
                    <div style={{ whiteSpace: "pre-wrap", background: "var(--bg)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                      {record.managementPlan}
                    </div>
                  </div>
                )}

                {record.diagnoses.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <strong style={{ display: "block", marginBottom: "0.5rem" }}>Diagnósticos (CIE-10):</strong>
                    <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                      {record.diagnoses.map(d => (
                        <li key={d.id}><strong>{d.cie10Code}</strong> - {d.description} <span className="text-xs text-muted">({d.type})</span></li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {record.addendums.length > 0 && (
                <div style={{ padding: "1rem 1.5rem", background: "rgba(255, 193, 7, 0.1)" }}>
                  <strong style={{ color: "var(--warning)" }}>Notas Aclaratorias:</strong>
                  {record.addendums.map(add => (
                    <div key={add.id} style={{ marginTop: "0.5rem", padding: "0.75rem", background: "white", borderRadius: "var(--radius-sm)", border: "1px dashed var(--warning)" }}>
                      <div className="text-xs text-muted" style={{ marginBottom: "0.25rem" }}>{new Date(add.createdAt).toLocaleString("es-CO")} por {add.author.name}</div>
                      <div>{add.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botones de acción según estado */}
              {record.status === "DRAFT" && record.authorId === user.id && (
                <div className="card-footer" style={{ background: "var(--bg)", padding: "1rem", textAlign: "right" }}>
                  <RecordForm recordId={record.id} action="SIGN" />
                </div>
              )}
              {record.status === "SIGNED" && (isDoctor || isNurse) && (
                <div className="card-footer" style={{ background: "var(--bg)", padding: "1rem", textAlign: "right" }}>
                  <RecordForm recordId={record.id} action="ADDENDUM" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          {/* Panel Lateral: Crear Nuevo Registro */}
          {(isDoctor || isNurse) && (
            <div className="card" style={{ position: "sticky", top: "2rem" }}>
              <div className="card-header">
                <div className="card-title">Nuevo Registro</div>
              </div>
              <div style={{ padding: "1.5rem" }}>
                <RecordForm historyId={history.id} isDoctor={isDoctor} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
