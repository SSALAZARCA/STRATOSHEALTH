import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import TotpSetup from "./TotpSetup";

const prisma = new PrismaClient();

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/login");
  
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/auth/login");

  const hasTotp = !!user.totpSecret;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Mi Perfil y Seguridad</h1>
        <p>Gestiona tu cuenta y la seguridad de tu firma electrónica.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Datos Personales</h2>
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Nombre Completo</label>
            <input type="text" className="form-control" value={user.name} disabled />
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Correo Electrónico</label>
            <input type="text" className="form-control" value={user.email} disabled />
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Rol en el Sistema</label>
            <input type="text" className="form-control" value={user.role} disabled />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Firma Electrónica (2FA)</h2>
          </div>
          <div className="mb-4">
            <p className="text-muted text-sm">
              Para cumplir con la normatividad, tus firmas electrónicas en las historias clínicas deben estar aseguradas con un token de un solo uso (Google Authenticator).
            </p>
          </div>
          
          <TotpSetup hasTotp={hasTotp} />
        </div>
      </div>
    </div>
  );
}
