import { PrismaClient } from "@prisma/client";
import { admitPatient, dischargePatient } from "@/lib/actions/ips";
import { DischargeButton } from "@/components/ActionButtons";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function PatientsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const session = await auth();
  const userRole = session?.user?.role;

  const patients = await prisma.patient.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: { consumptions: true, billingOrders: true },
  });
  const admitted = patients.filter(p => p.status === "ADMITTED");
  const discharged = patients.filter(p => p.status === "DISCHARGED");

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Pacientes</h1>
          <p>Admisiones activas y control de consumo farmacéutico</p>
        </div>
      </div>

      {/* Formulario admisión */}
      {userRole !== "MANAGER" && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-header"><div className="card-title">➕ Admitir Nuevo Paciente</div></div>
          <form action={admitPatient}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input name="name" required className="form-control" placeholder="Ej: Juan Pérez García" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo documento</label>
                <select name="documentType" className="form-control">
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="CE">Cédula Extranjería</option>
                  <option value="PA">Pasaporte</option>
                  <option value="RC">Registro Civil</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Número documento *</label>
                <input name="documentNumber" required className="form-control" placeholder="Número de documento" />
              </div>
              <div className="form-group">
                <label className="form-label">Cama / Habitación</label>
                <input name="bedNumber" className="form-control" placeholder="Ej: 201-A" />
              </div>
              <div className="form-group">
                <label className="form-label">Servicio / Sala</label>
                <input name="ward" className="form-control" placeholder="Ej: UCI, Medicina Interna" />
              </div>
              <div className="form-group">
                <label className="form-label">Médico tratante</label>
                <input name="doctor" className="form-control" placeholder="Dr. Nombre Apellido" />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Diagnóstico principal</label>
                <input name="diagnosis" className="form-control" placeholder="CIE-10 o descripción diagnóstica" />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Admitir Paciente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pacientes admitidos */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <div>
            <div className="card-title">Pacientes Admitidos ({admitted.length})</div>
            <div className="card-subtitle">Control de medicación activa</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Documento</th>
                <th>Cama/Sala</th>
                <th>Diagnóstico</th>
                <th>Médico</th>
                <th>Consumo Total</th>
                <th>Ingreso</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {admitted.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No hay pacientes admitidos</td></tr>
              )}
              {admitted.map(p => {
                const total = p.consumptions.reduce((s, c) => s + c.totalPrice, 0);
                return (
                  <tr key={p.id}>
                    <td><div style={{ fontWeight: 600 }}>{p.name}</div></td>
                    <td className="text-sm text-muted">{p.documentType} {p.documentNumber}</td>
                    <td><span className="badge badge-info">{p.bedNumber || "—"}</span>{p.ward && <span style={{ marginLeft: 4, fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.ward}</span>}</td>
                    <td className="text-sm">{p.diagnosis || "—"}</td>
                    <td className="text-sm text-muted">{p.doctor || "—"}</td>
                    <td style={{ fontWeight: 700, color: total > 0 ? "var(--primary)" : "var(--text-muted)" }}>
                      ${total.toLocaleString("es-CO")}
                    </td>
                    <td className="text-xs text-muted">{new Date(p.admissionDate).toLocaleDateString("es-CO")}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <a href={`/pharmacy/${tenantId}/patients/${p.id}/history`} className="btn btn-sm btn-info" style={{ color: "white" }}>
                          Historia
                        </a>
                        {userRole !== "MANAGER" && (
                          <DischargeButton
                            patientId={p.id}
                            patientName={p.name}
                            total={total}
                            action={dischargePatient}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Histórico de Egresos ({discharged.length})</div>
            <div className="card-subtitle">Pacientes con orden de cobro generada</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Documento</th>
                <th>Ingreso</th>
                <th>Egreso</th>
                <th>Total Facturado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {discharged.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Sin egresos registrados</td></tr>
              )}
              {discharged.slice(0, 10).map(p => {
                const total = p.billingOrders.reduce((s, b) => s + b.totalAmount, 0);
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td className="text-sm text-muted">{p.documentType} {p.documentNumber}</td>
                    <td className="text-xs text-muted">{new Date(p.admissionDate).toLocaleDateString("es-CO")}</td>
                    <td className="text-xs text-muted">{p.dischargeDate ? new Date(p.dischargeDate).toLocaleDateString("es-CO") : "—"}</td>
                    <td style={{ fontWeight: 700 }}>${total.toLocaleString("es-CO")}</td>
                    <td><span className="badge badge-muted">Egresado</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}