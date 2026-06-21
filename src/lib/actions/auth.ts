"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autorizado");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}

// 1. Generar secreto y código QR para Google Authenticator
export async function generateTotpSecret() {
  const user = await requireAuth();

  // Generar un secreto base32 de 32 caracteres (fuerte)
  const secret = authenticator.generateSecret(32);
  
  // Generar URL para la app de Autenticación (otpauth://...)
  const otpauth = authenticator.keyuri(user.email, "Stratos Health", secret);
  
  // Generar imagen QR en base64
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  return { secret, qrCodeDataUrl };
}

// 2. Verificar el código por primera vez y habilitar TOTP en el usuario
export async function verifyAndEnableTotp(secret: string, token: string) {
  const user = await requireAuth();

  // Verificar el token contra el secreto temporal
  const isValid = authenticator.verify({ token, secret });

  if (!isValid) {
    throw new Error("El código es incorrecto. Inténtelo de nuevo.");
  }

  // Guardar el secreto permanentemente en la base de datos
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: secret }
  });

  revalidatePath("/pharmacy/[id]/profile", "page");
  return { success: true };
}

// 3. Deshabilitar TOTP (Opcional, si el usuario pierde el dispositivo, aunque esto debería ser admin only)
export async function disableTotp() {
  const user = await requireAuth();
  
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: null }
  });
  
  revalidatePath("/pharmacy/[id]/profile", "page");
  return { success: true };
}
