"use client";

import { useState, useTransition } from "react";

type Schedule = {
  id: string;
  hour: number;
  minute: number;
  active: boolean;
};

export default function BackupSettings({
  initialSchedules,
  createScheduleAction,
  deleteScheduleAction,
  triggerManualBackupAction
}: {
  initialSchedules: Schedule[];
  createScheduleAction: (hour: number, minute: number) => Promise<void>;
  deleteScheduleAction: (id: string) => Promise<void>;
  triggerManualBackupAction: () => Promise<{ success: boolean; key?: string; error?: string }>;
}) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [isPending, startTransition] = useTransition();
  const [backupStatus, setBackupStatus] = useState<{ success?: boolean; message?: string; loading?: boolean }>({});

  const handleAddSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const hour = parseInt(formData.get("hour") as string, 10);
    const minute = parseInt(formData.get("minute") as string, 10);

    if (isNaN(hour) || hour < 0 || hour > 23 || isNaN(minute) || minute < 0 || minute > 59) {
      alert("Ingrese una hora (0-23) y minuto (0-59) válidos.");
      return;
    }

    startTransition(async () => {
      try {
        await createScheduleAction(hour, minute);
        // Recargar localmente o dejar que revalidatePath actualice la UI.
        // Como revalidatePath refresca los Server Components, las props se actualizarán.
        // Limpiamos los inputs
        (e.target as HTMLFormElement).reset();
      } catch (err: any) {
        alert(err.message || "Error al agregar programación");
      }
    });
  };

  const handleDeleteSchedule = (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta hora de respaldo automático?")) return;
    startTransition(async () => {
      try {
        await deleteScheduleAction(id);
      } catch (err: any) {
        alert(err.message || "Error al eliminar");
      }
    });
  };

  const handleManualBackup = async () => {
    setBackupStatus({ loading: true });
    try {
      const res = await triggerManualBackupAction();
      if (res.success) {
        setBackupStatus({
          success: true,
          message: `Copia de seguridad exitosa. Archivo en B2: ${res.key}`
        });
      } else {
        setBackupStatus({
          success: false,
          message: `Error: ${res.error}`
        });
      }
    } catch (err: any) {
      setBackupStatus({
        success: false,
        message: `Error de red: ${err.message}`
      });
    }
  };

  return (
    <div className="card" style={{ gridColumn: "span 2", marginTop: "1rem" }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="card-title">💾 Respaldos Automatizados (Backblaze B2)</div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Programa múltiples horas al día para respaldar tu base de datos SQLite directamente en la nube.
          </p>
        </div>
        <button
          onClick={handleManualBackup}
          disabled={backupStatus.loading}
          className="btn"
          style={{
            background: backupStatus.loading ? "var(--border)" : "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            border: "none",
            fontWeight: 700
          }}
        >
          {backupStatus.loading ? "🔄 Respaldando..." : "⚡ Respaldar Ahora"}
        </button>
      </div>

      <div className="grid-layout-2-equal" style={{ padding: "1.5rem" }}>
        {/* Lado izquierdo: Lista de Horarios */}
        <div>
          <h4 style={{ margin: "0 0 1rem 0", color: "#38bdf8" }}>Horarios de Backup Configurados</h4>
          {initialSchedules.length === 0 ? (
            <div style={{ padding: "2rem", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)" }}>
              No hay horarios programados. La base de datos no se respaldará automáticamente.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {initialSchedules.map(schedule => (
                <div
                  key={schedule.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>⏰</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                      {schedule.hour.toString().padStart(2, "0")}:{schedule.minute.toString().padStart(2, "0")}
                    </span>
                    <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>Activo</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="btn btn-sm"
                    style={{ background: "#ef4444", color: "white", border: "none", padding: "0.25rem 0.5rem" }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lado derecho: Agregar Horario & Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h4 style={{ margin: "0 0 1rem 0", color: "#38bdf8" }}>Agregar Nuevo Horario</h4>
            <form onSubmit={handleAddSchedule} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Hora (0-23)</label>
                <input
                  type="number"
                  name="hour"
                  min="0"
                  max="23"
                  required
                  placeholder="02"
                  className="form-control"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Minuto (0-59)</label>
                <input
                  type="number"
                  name="minute"
                  min="0"
                  max="59"
                  required
                  placeholder="00"
                  className="form-control"
                  style={{ width: "100%" }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
                style={{ height: "42px", display: "flex", alignItems: "center" }}
              >
                + Programar
              </button>
            </form>
          </div>

          {/* Status del Backup Manual */}
          {backupStatus.message && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "12px",
                border: "1px solid",
                background: backupStatus.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                borderColor: backupStatus.success ? "#10b981" : "#ef4444",
                color: backupStatus.success ? "#10b981" : "#ef4444",
                fontSize: "0.9rem",
                wordBreak: "break-all"
              }}
            >
              <strong>{backupStatus.success ? "✓ Éxito" : "✗ Error"}</strong>
              <div style={{ marginTop: "0.25rem" }}>{backupStatus.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
