"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { runManualBackupFromAction } from "@/lib/backup-runner";

const prisma = new PrismaClient();

// Validar que el usuario sea SUPERADMIN
async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "SUPERADMIN") throw new Error("Acceso denegado: Se requiere rol de Super Administrador");
  return user;
}

// 1. Obtener todas las programaciones de backup
export async function getBackupSchedules() {
  await requireSuperAdmin();
  return prisma.backupSchedule.findMany({
    orderBy: [
      { hour: "asc" },
      { minute: "asc" }
    ]
  });
}

// 2. Crear una nueva programación
export async function createBackupSchedule(hour: number, minute: number) {
  await requireSuperAdmin();
  
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error("Hora (0-23) o Minuto (0-59) inválidos");
  }

  // Evitar duplicados
  const existing = await prisma.backupSchedule.findFirst({
    where: { hour, minute }
  });

  if (existing) {
    throw new Error("Ya existe un respaldo programado para esta hora exacta");
  }

  await prisma.backupSchedule.create({
    data: { hour, minute }
  });

  revalidatePath("/superadmin/settings");
}

// 3. Eliminar una programación
export async function deleteBackupSchedule(id: string) {
  await requireSuperAdmin();
  await prisma.backupSchedule.delete({ where: { id } });
  revalidatePath("/superadmin/settings");
}

// 4. Disparar backup manual inmediato
export async function triggerManualBackup() {
  await requireSuperAdmin();
  try {
    const key = await runManualBackupFromAction();
    return { success: true, key };
  } catch (error: any) {
    console.error("Manual backup action error:", error);
    return { success: false, error: error.message || "Error al generar copia de seguridad" };
  }
}
