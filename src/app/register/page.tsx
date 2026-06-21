import { PrismaClient } from "@prisma/client";
import RegisterForm from "./RegisterForm";
import { Logo } from "@/components/Logo";

const prisma = new PrismaClient();

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ planId?: string; billing?: string }> }) {
  const resolvedParams = await searchParams;
  const plans = await prisma.subscriptionPlan.findMany({ where: { active: true } });
  
  // If no planId is provided, default to the first one, or they can choose in the form
  const selectedPlanId = resolvedParams.planId || (plans.length > 0 ? plans[0].id : undefined);
  const initialBilling = resolvedParams.billing || "annual";

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white"
    }}>
      <header style={{ padding: "1.5rem 5%", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Logo variant="dark" size={32} />
        </div>
      </header>
      
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="card" style={{ width: "100%", maxWidth: "800px", background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "1.5rem" }}>
            <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Crear cuenta corporativa</h1>
            <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>Configura tu clínica y elige el método de pago</p>
          </div>
          
          <div style={{ padding: "1.5rem" }}>
            <RegisterForm plans={plans} initialPlanId={selectedPlanId} initialBilling={initialBilling} />
          </div>
        </div>
      </main>
    </div>
  );
}
