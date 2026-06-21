import fs from "fs";
import path from "path";
import zlib from "zlib";
import { uploadBackupToB2 } from "@/lib/b2";

/**
 * Ejecuta una copia de seguridad y la sube a Backblaze B2
 * Retorna el nombre (key) del archivo de backup subido.
 */
export async function runManualBackupFromAction(): Promise<string> {
  const rootDir = process.cwd();
  const dbPath = path.join(rootDir, 'prisma', 'dev.db');

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Base de datos SQLite no encontrada en ${dbPath}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-stratos-${timestamp}.db.gz`;

  // 1. Leer el archivo dev.db
  const dbBuffer = fs.readFileSync(dbPath);

  // 2. Comprimir usando gzip
  const gzippedBuffer = zlib.gzipSync(dbBuffer);

  // 3. Subir al bucket de backups en B2
  await uploadBackupToB2(gzippedBuffer, backupFileName);

  return backupFileName;
}
