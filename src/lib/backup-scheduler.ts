import { PrismaClient } from "@prisma/client";
import { runManualBackupFromAction } from "./backup-runner";

const prisma = new PrismaClient();

const globalForBackup = globalThis as unknown as {
  backupIntervalId?: NodeJS.Timeout;
  lastRunMinuteKey?: string;
};

/**
 * Inicia el temporizador de fondo en el servidor para verificar las horas de backups.
 * Se ejecuta una sola vez en el event loop global de Node.
 */
export function startBackupScheduler() {
  if (globalForBackup.backupIntervalId) {
    return;
  }

  console.log("⏰ [BackupScheduler] Inicializando programador automático de respaldos B2...");

  globalForBackup.backupIntervalId = setInterval(async () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      // Llave de control para evitar duplicar ejecuciones en el mismo minuto
      const dateStr = now.toISOString().split("T")[0];
      const currentMinuteKey = `${dateStr}-${hour}-${minute}`;

      if (globalForBackup.lastRunMinuteKey === currentMinuteKey) {
        return;
      }

      // Buscar en base de datos si hay algún respaldo programado para este minuto y hora
      const schedule = await prisma.backupSchedule.findFirst({
        where: { hour, minute, active: true }
      });

      if (schedule) {
        console.log(`⏰ [BackupScheduler] Iniciando backup programado para las ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}...`);
        globalForBackup.lastRunMinuteKey = currentMinuteKey;

        const key = await runManualBackupFromAction();
        console.log(`⏰ [BackupScheduler] ¡Backup automático subido a Backblaze B2 con éxito!: ${key}`);
      }
    } catch (error) {
      console.error("⏰ [BackupScheduler] Error durante la revisión o subida de backup:", error);
    }
  }, 30000); // Comprobación cada 30 segundos
}
