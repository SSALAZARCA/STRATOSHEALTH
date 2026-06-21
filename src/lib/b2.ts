import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.B2_ENDPOINT;
const region = process.env.B2_REGION || "us-east-005";

// Cliente para el bucket de archivos
export const s3FilesClient = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: process.env.B2_FILES_KEY_ID || "",
    secretAccessKey: process.env.B2_FILES_APP_KEY || "",
  },
  forcePathStyle: true, // Requerido para Backblaze B2 y minio
  requestChecksumCalculation: "WHEN_REQUIRED" as any,
});

// Cliente para el bucket de backups
export const s3BackupsClient = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: process.env.B2_BACKUPS_KEY_ID || "",
    secretAccessKey: process.env.B2_BACKUPS_APP_KEY || "",
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED" as any,
});

/**
 * Sube un archivo al bucket de archivos de Stratos Health
 */
export async function uploadFileToB2(
  fileBuffer: Buffer | ArrayBuffer,
  key: string,
  contentType: string
): Promise<string> {
  const bucketName = process.env.B2_FILES_BUCKET;
  if (!bucketName) throw new Error("B2_FILES_BUCKET no configurado");

  const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer as ArrayBuffer);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentLength: buffer.length,
  });

  await s3FilesClient.send(command);
  return key; // Retornamos la key guardada
}

/**
 * Genera una URL firmada temporal para visualizar o descargar un archivo privado
 */
export async function getSignedUrlFromB2(
  key: string,
  expiresInSeconds = 900 // Por defecto 15 minutos (900s)
): Promise<string> {
  const bucketName = process.env.B2_FILES_BUCKET;
  if (!bucketName) throw new Error("B2_FILES_BUCKET no configurado");

  // Si no hay key, retornamos vacío
  if (!key) return "";

  // Si por alguna razón es una URL local de desarrollo vieja, la retornamos tal cual
  if (key.startsWith("/uploads/")) {
    return key;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  // Generar URL firmada temporal
  const signedUrl = await getSignedUrl(s3FilesClient, command, {
    expiresIn: expiresInSeconds,
  });

  return signedUrl;
}

/**
 * Sube un archivo de backup al bucket de backups
 */
export async function uploadBackupToB2(
  buffer: Buffer,
  key: string
): Promise<void> {
  const bucketName = process.env.B2_BACKUPS_BUCKET;
  if (!bucketName) throw new Error("B2_BACKUPS_BUCKET no configurado");

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: "application/gzip",
    ContentLength: buffer.length,
  });

  await s3BackupsClient.send(command);
}
