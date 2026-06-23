import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import BackupSettings from "./BackupSettings";
import { createBackupSchedule, deleteBackupSchedule, triggerManualBackup } from "@/lib/actions/backups";

const prisma = new PrismaClient();

export default async function SuperAdminSettings() {
  const gateways = await prisma.paymentGatewayConfig.findMany();
  const schedules = await prisma.backupSchedule.findMany({
    orderBy: [
      { hour: "asc" },
      { minute: "asc" }
    ]
  });

  async function saveGateway(formData: FormData) {
    "use server";
    const provider = formData.get("provider") as string;
    const publicKey = formData.get("publicKey") as string;
    const secretKey = formData.get("secretKey") as string;
    const webhookSecret = formData.get("webhookSecret") as string;
    const isActive = formData.get("isActive") === "on";

    const existing = await prisma.paymentGatewayConfig.findFirst({ where: { provider } });

    if (existing) {
      await prisma.paymentGatewayConfig.update({
        where: { id: existing.id },
        data: { publicKey, secretKey, webhookSecret, isActive }
      });
    } else {
      await prisma.paymentGatewayConfig.create({
        data: { provider, publicKey, secretKey, webhookSecret, isActive }
      });
    }

    revalidatePath("/superadmin/settings");
  }

  const stripe = gateways.find(g => g.provider === "STRIPE") || { provider: "STRIPE", publicKey: "", secretKey: "", webhookSecret: "", isActive: false };
  const wompi = gateways.find(g => g.provider === "WOMPI") || { provider: "WOMPI", publicKey: "", secretKey: "", webhookSecret: "", isActive: false };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Configuración de Pagos (Billing)</h1>
        <p>Configura las pasarelas de pago para el cobro automatizado de suscripciones</p>
      </div>

      <div className="grid-layout-2-equal">
        {/* STRIPE */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Stripe</div>
          </div>
          <form action={saveGateway} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input type="hidden" name="provider" value="STRIPE" />
            
            <div>
              <label className="form-label">Public Key (pk_test_...)</label>
              <input type="text" name="publicKey" defaultValue={stripe.publicKey} className="form-control" />
            </div>
            <div>
              <label className="form-label">Secret Key (sk_test_...)</label>
              <input type="password" name="secretKey" defaultValue={stripe.secretKey} className="form-control" />
            </div>
            <div>
              <label className="form-label">Webhook Secret (whsec_...)</label>
              <input type="password" name="webhookSecret" defaultValue={stripe.webhookSecret || ""} className="form-control" />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
              <input type="checkbox" name="isActive" defaultChecked={stripe.isActive} id="stripe-active" />
              <label htmlFor="stripe-active">Habilitar esta pasarela</label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>Guardar Configuración Stripe</button>
          </form>
        </div>

        {/* WOMPI */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Wompi (Bancolombia)</div>
          </div>
          <form action={saveGateway} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input type="hidden" name="provider" value="WOMPI" />
            
            <div>
              <label className="form-label">Public Key</label>
              <input type="text" name="publicKey" defaultValue={wompi.publicKey} className="form-control" />
            </div>
            <div>
              <label className="form-label">Private Key</label>
              <input type="password" name="secretKey" defaultValue={wompi.secretKey} className="form-control" />
            </div>
            <div>
              <label className="form-label">Event Secret (Webhook)</label>
              <input type="password" name="webhookSecret" defaultValue={wompi.webhookSecret || ""} className="form-control" />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
              <input type="checkbox" name="isActive" defaultChecked={wompi.isActive} id="wompi-active" />
              <label htmlFor="wompi-active">Habilitar esta pasarela</label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>Guardar Configuración Wompi</button>
          </form>
        </div>

        <BackupSettings
          initialSchedules={schedules}
          createScheduleAction={createBackupSchedule}
          deleteScheduleAction={deleteBackupSchedule}
          triggerManualBackupAction={triggerManualBackup}
        />
      </div>
    </div>
  );
}
