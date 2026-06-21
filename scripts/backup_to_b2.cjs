const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Cargar variables de entorno desde el .env del directorio raíz
const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Configuración de B2
const endpoint = process.env.B2_ENDPOINT;
const region = process.env.B2_REGION || 'us-east-005';
const keyId = process.env.B2_BACKUPS_KEY_ID;
const appKey = process.env.B2_BACKUPS_APP_KEY;
const bucketName = process.env.B2_BACKUPS_BUCKET;

const dbPath = path.join(rootDir, 'prisma', 'dev.db');

// Validaciones
if (!endpoint || !keyId || !appKey || !bucketName) {
  console.error("❌ Error: Faltan credenciales de Backblaze B2 para backups en el archivo .env");
  process.exit(1);
}

if (!fs.existsSync(dbPath)) {
  console.error(`❌ Error: No se encontró el archivo de base de datos en ${dbPath}`);
  process.exit(1);
}

// Inicializar cliente S3 para Backups
const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: keyId,
    secretAccessKey: appKey,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
});

async function runBackup() {
  console.log("🌱 Iniciando copia de seguridad de la base de datos...");
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-stratos-${timestamp}.db.gz`;
  
  try {
    // 1. Leer el archivo dev.db
    console.log(`📖 Leyendo base de datos SQLite en: ${dbPath}`);
    const dbBuffer = fs.readFileSync(dbPath);
    
    // 2. Comprimir usando gzip nativo de Node.js
    console.log("🗜️ Comprimiendo base de datos con gzip...");
    const gzippedBuffer = zlib.gzipSync(dbBuffer);
    
    // 3. Subir a Backblaze B2
    console.log(`🚀 Subiendo a Backblaze B2 bucket [${bucketName}] como key: ${backupFileName}`);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: backupFileName,
      Body: gzippedBuffer,
      ContentType: "application/gzip",
      ContentLength: gzippedBuffer.length,
    });
    
    await s3Client.send(command);
    console.log(`✅ ¡Copia de seguridad subida con éxito!`);
  } catch (error) {
    console.error("❌ Error durante el backup:", error);
    process.exit(1);
  }
}

runBackup();
