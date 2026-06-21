import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { PrintButton } from "./PrintButton";

const prisma = new PrismaClient();

export default async function PrintHistoryPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string, patientId: string }>, 
  searchParams: Promise<{ logId?: string }> 
}) {
  const { id, patientId } = await params;
  const { logId } = await searchParams;
  
  const session = await auth();
  if (!session?.user?.email) return <div>No autorizado</div>;

  if (!logId) {
    return <div style={{ padding: "2rem", color: "red", fontWeight: "bold" }}>Acceso denegado. Se requiere registro de auditoría legal (Log ID).</div>;
  }

  // Verificar la auditoría
  const exportLog = await prisma.documentExportLog.findUnique({
    where: { id: logId },
    include: { user: true }
  });

  if (!exportLog || exportLog.patientId !== patientId || exportLog.tenantId !== id) {
    return <div style={{ padding: "2rem", color: "red", fontWeight: "bold" }}>Auditoría inválida o expirada.</div>;
  }

  // Obtener datos clínicos
  const patient = await prisma.patient.findUnique({
    where: { id: patientId, tenantId: id },
    include: {
      clinicalHistory: {
        include: {
          records: {
            orderBy: { createdAt: "asc" },
            include: { author: true, addendums: { include: { author: true } }, diagnoses: true }
          }
        }
      }
    }
  });

  if (!patient || !patient.clinicalHistory) return <div>Historia clínica no encontrada.</div>;

  return (
    <div style={{ backgroundColor: "white", color: "black", minHeight: "100vh", padding: "0" }}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          
          /* Ocultar elementos de layout global */
          .sidebar, .topbar { display: none !important; }
          .app-shell { display: block !important; padding: 0 !important; margin: 0 !important; }
          .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          .page-content { padding: 0 !important; margin: 0 !important; }
          
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
        body { font-family: "Arial", sans-serif; }
        .print-container { max-width: 800px; margin: 0 auto; padding: 2rem; background: white; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1rem; }
        .footer { border-top: 1px solid #ccc; font-size: 0.8rem; padding-top: 0.5rem; margin-top: 2rem; text-align: center; color: #555; }
        .title { font-size: 1.5rem; font-weight: bold; text-align: center; margin: 1rem 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; font-size: 0.9rem; }
        th { background: #f4f4f4; width: 30%; }
        .record { border: 1px solid #000; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px; }
        .record-header { background: #eee; padding: 0.5rem; font-weight: bold; font-size: 0.9rem; border-bottom: 1px solid #000; margin: -1rem -1rem 1rem -1rem; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between; }
        .addendum { margin-top: 1rem; padding: 0.5rem; background: #f9f9f9; border-left: 3px solid #666; font-size: 0.85rem; }
      `}} />
      
      <div className="print-container">
        <div className="no-print" style={{ marginBottom: "1rem", textAlign: "right" }}>
          <PrintButton />
        </div>

        <div className="header">
          <div>
            <h2>Stratos Health - Sistema Clínico Legal</h2>
            <div style={{ fontSize: "0.85rem" }}>Copia Oficial de Historia Clínica</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "0.85rem" }}>
            <div><strong>Fecha de Emisión:</strong> {new Date().toLocaleString("es-CO")}</div>
            <div><strong>ID Auditoría:</strong> {exportLog.id}</div>
          </div>
        </div>

        <div className="title">HISTORIA CLÍNICA COMPLETA</div>

        <table>
          <tbody>
            <tr>
              <th>Nombre del Paciente</th>
              <td>{patient.name}</td>
            </tr>
            <tr>
              <th>Identificación</th>
              <td>{patient.documentType} {patient.documentNumber}</td>
            </tr>
            <tr>
              <th>Diagnóstico / Médico</th>
              <td>{patient.diagnosis || "No especificado"} / {patient.doctor || "No especificado"}</td>
            </tr>
            <tr>
              <th>Ubicación</th>
              <td>{patient.ward || "No especificada"} {patient.bedNumber ? `(Cama: ${patient.bedNumber})` : ""}</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ marginTop: "2rem", borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>Anotaciones Médicas (Evoluciones)</h3>
        
        {patient.clinicalHistory.records.length === 0 ? (
          <p>No hay registros médicos en esta historia.</p>
        ) : (
          patient.clinicalHistory.records.map((rec) => (
            <div key={rec.id} className="record">
              <div className="record-header">
                <div>
                  <strong>{rec.type.replace(/_/g, ' ')}</strong> - {new Date(rec.createdAt).toLocaleString("es-CO")}
                </div>
                <div>
                  {rec.status === "SIGNED" ? "✅ FIRMADO ELECTRÓNICAMENTE" : "⚠️ BORRADOR SIN FIRMAR"}
                </div>
              </div>
              
              {rec.anamnesis && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                  <strong>Anamnesis / Evolución:</strong><br/>
                  {rec.anamnesis}
                </div>
              )}
              {rec.physicalExam && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                  <strong>Examen Físico:</strong><br/>
                  {rec.physicalExam}
                </div>
              )}
              {rec.managementPlan && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                  <strong>Plan de Manejo:</strong><br/>
                  {rec.managementPlan}
                </div>
              )}

              {rec.diagnoses.length > 0 && (
                <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                  <strong>Diagnósticos (CIE-10):</strong>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                    {rec.diagnoses.map(d => (
                      <li key={d.id}>{d.cie10Code} - {d.description} ({d.type})</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#555" }}>
                <strong>Profesional:</strong> {rec.author.name} ({rec.author.role})
              </div>

              {rec.addendums.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <strong style={{ fontSize: "0.85rem" }}>Notas Aclaratorias / Addendums:</strong>
                  {rec.addendums.map(add => (
                    <div key={add.id} className="addendum">
                      <strong>{new Date(add.createdAt).toLocaleString("es-CO")} - {add.author.name}:</strong><br/>
                      {add.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        <div className="footer">
          Documento generado bajo certificación electrónica. Validado por: {exportLog.user.name} ({exportLog.user.role}).<br/>
          Justificación legal: {exportLog.justification}<br/>
          <strong>Este documento contiene datos sensibles protegidos por la ley de Habeas Data (Resolución 1995/1999).</strong>
        </div>
      </div>
      
      <script dangerouslySetInnerHTML={{__html: `
        // Auto print upon loading
        window.onload = function() { window.print(); }
      `}} />
    </div>
  );
}
