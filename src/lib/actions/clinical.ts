"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { authenticator } from "otplib";

const prisma = new PrismaClient();

// Helper para validar sesión y permisos
async function requireAuth() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}

// 1. Crear Historia Clínica inicial para un paciente
export async function ensureClinicalHistory(patientId: string, tenantId: string) {
  const user = await requireAuth();
  
  let history = await prisma.clinicalHistory.findUnique({ where: { patientId } });
  if (!history) {
    history = await prisma.clinicalHistory.create({
      data: { patientId, tenantId }
    });
    
    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "CREATE_CLINICAL_HISTORY",
        details: `Historia creada para el paciente ${patientId}`,
        userId: user.id,
        resourceId: history.id
      }
    });
  }
  return history;
}

// 2. Añadir un Registro Clínico (Evolución o Nota de Enfermería) en estado BORRADOR
export async function createClinicalRecord(historyId: string, type: string, data: any) {
  const user = await requireAuth();
  
  const record = await prisma.clinicalRecord.create({
    data: {
      historyId,
      authorId: user.id,
      type,
      status: "DRAFT",
      anamnesis: data.anamnesis,
      physicalExam: data.physicalExam ? JSON.stringify(data.physicalExam) : null,
      managementPlan: data.managementPlan
    }
  });

  // Agregar diagnósticos si vienen en la data
  if (data.diagnoses && Array.isArray(data.diagnoses)) {
    for (const diag of data.diagnoses) {
      await prisma.diagnosis.create({
        data: {
          recordId: record.id,
          cie10Code: diag.code,
          description: diag.description,
          type: diag.type || "PRINCIPAL"
        }
      });
    }
  }

  revalidatePath(`/pharmacy/[id]/patients/[patientId]/history`, "page");
  return record;
}

// 3. Firmar Registro Clínico (INMUTABILIDAD)
export async function signClinicalRecord(recordId: string, signaturePin: string, ipAddress: string) {
  const user = await requireAuth();
  
  // Validación de firma: si el usuario tiene TOTP configurado, requerir código de 6 dígitos
  // Si no, fallback por ahora al PIN básico simulado.
  if (user.totpSecret) {
    const isValid = authenticator.verify({ token: signaturePin, secret: user.totpSecret });
    if (!isValid) throw new Error("Código Google Authenticator incorrecto o expirado");
  } else {
    if (signaturePin !== "1234") {
      throw new Error("PIN de firma incorrecto. Por favor configure Google Authenticator en su Perfil.");
    }
  }

  const record = await prisma.clinicalRecord.findUnique({ where: { id: recordId } });
  if (!record) throw new Error("Registro no encontrado");
  if (record.authorId !== user.id) throw new Error("No puede firmar un registro que no creó");
  if (record.status === "SIGNED") throw new Error("Este registro ya está firmado e inmutable");

  const signedRecord = await prisma.clinicalRecord.update({
    where: { id: recordId },
    data: {
      status: "SIGNED",
      signedAt: new Date(),
      signatureIp: ipAddress
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId!,
      action: "SIGN_CLINICAL_RECORD",
      details: `Firma aplicada al registro ${recordId}`,
      userId: user.id,
      ipAddress,
      resourceId: recordId
    }
  });

  revalidatePath(`/pharmacy/[id]/patients/[patientId]/history`, "page");
  return signedRecord;
}

// 4. Agregar Nota Aclaratoria (Addendum) a un registro firmado
export async function addAddendum(recordId: string, content: string, signaturePin: string, ipAddress: string) {
  const user = await requireAuth();
  
  if (user.totpSecret) {
    const isValid = authenticator.verify({ token: signaturePin, secret: user.totpSecret });
    if (!isValid) throw new Error("Código Google Authenticator incorrecto o expirado");
  } else {
    if (signaturePin !== "1234") throw new Error("PIN de firma incorrecto. Por favor configure Google Authenticator.");
  }

  const record = await prisma.clinicalRecord.findUnique({ where: { id: recordId } });
  if (!record) throw new Error("Registro base no encontrado");
  if (record.status !== "SIGNED") throw new Error("No se pueden añadir aclaraciones a borradores. Edite el borrador directamente.");

  const addendum = await prisma.clinicalAddendum.create({
    data: {
      recordId,
      authorId: user.id,
      content,
      signedAt: new Date(),
      signatureIp: ipAddress
    }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId!,
      action: "ADD_CLINICAL_ADDENDUM",
      details: `Nota aclaratoria agregada al registro ${recordId}`,
      userId: user.id,
      ipAddress,
      resourceId: addendum.id
    }
  });

  revalidatePath(`/pharmacy/[id]/patients/[patientId]/history`, "page");
  return addendum;
}
