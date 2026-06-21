import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { startBackupScheduler } from "@/lib/backup-scheduler";

// Iniciar programador de backups automáticos (SQLite a Backblaze B2)
startBackupScheduler();

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "STRATOS HEALTH - Ecosistema Farmacéutico y Clínico para IPS",
  description: "Sistema integral de gestión farmacéutica para IPS - Control de inventarios, pedidos, pacientes y facturación",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
