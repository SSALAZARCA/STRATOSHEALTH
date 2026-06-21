"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { authenticator } from "otplib";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}

// 1. Validar 2FA para ver historia clínica
export async function verifyAccess2FA(patientId: string, token: string, ipAddress: string) {
  const user = await requireAuth();

  if (user.totpSecret) {
    const isValid = authenticator.verify({ token, secret: user.totpSecret });
    if (!isValid) throw new Error("Código Google Authenticator incorrecto o expirado");
  } else {
    // Fallback: si no ha configurado 2FA pero quiere ver, le obligaremos en prod. Para demo pasamos con "123456"
    if (token !== "123456") throw new Error("Por favor ingrese 123456 (y configure su Google Authenticator).");
  }

  // Guardar log de auditoría
  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId!,
      action: "ACCESS_HISTORY",
      details: "Acceso seguro verificado mediante 2FA",
      userId: user.id,
      ipAddress,
      resourceId: patientId
    }
  });

  return { success: true };
}

import { uploadFileToB2 } from "@/lib/b2";

// 2. Registrar descarga de PDF y validar 2FA (soporta archivo)
export async function logDocumentExport(formData: FormData) {
  const user = await requireAuth();
  
  const patientId = formData.get("patientId") as string;
  const token = formData.get("token") as string;
  const justification = formData.get("justification") as string;
  const ipAddress = formData.get("ipAddress") as string || "Local";
  const file = formData.get("file") as File | null;

  // Validar TOTP
  if (user.totpSecret) {
    const isValid = authenticator.verify({ token, secret: user.totpSecret });
    if (!isValid) throw new Error("Código Google Authenticator incorrecto o expirado");
  } else {
    if (token !== "123456") throw new Error("Token incorrecto. Ingrese 123456.");
  }

  let supportDocumentPath = null;

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const key = `tenants/${user.tenantId || "global"}/legal/${Date.now()}-${cleanFileName}`;
    
    // Subir a Backblaze B2
    await uploadFileToB2(bytes, key, file.type);
    supportDocumentPath = key;
  }

  // Guardar Export Log
  const exportLog = await prisma.documentExportLog.create({
    data: {
      tenantId: user.tenantId!,
      patientId: patientId,
      userId: user.id,
      action: "DOWNLOAD_PDF",
      justification: justification,
      supportDocumentPath: supportDocumentPath,
      signatureIp: ipAddress
    }
  });

  // Guardar Audit Log general
  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId!,
      action: "EXPORT_HISTORY_PDF",
      details: `PDF Exportado. Justificación: ${justification}`,
      userId: user.id,
      ipAddress: ipAddress,
      resourceId: patientId
    }
  });

  return { success: true, logId: exportLog.id };
}
