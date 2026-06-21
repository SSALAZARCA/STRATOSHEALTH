import { PrismaClient } from "@prisma/client";
import ProveedoresLandingClient from "./ProveedoresLandingClient";

const prisma = new PrismaClient();

export default async function ProveedoresLandingPage() {
  // Obtener planes comerciales para proveedores
  const plans = await prisma.supplierPlan.findMany({
    where: { active: true },
    orderBy: { price: "asc" }
  });

  const serializedPlans = plans.map(plan => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    durationMonths: plan.durationMonths,
    features: plan.features
  }));

  return <ProveedoresLandingClient plans={serializedPlans} />;
}
