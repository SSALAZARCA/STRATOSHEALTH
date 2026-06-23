import { PrismaClient } from "@prisma/client";
import LandingClient from "./LandingClient";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export default async function LandingPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { price: "asc" }
  });

  // Convert database object features/types to simple objects safe for serialization
  const serializedPlans = plans.map(plan => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    durationMonths: plan.durationMonths,
    maxUsers: plan.maxUsers,
    features: plan.features
  }));

  return <LandingClient plans={serializedPlans} />;
}
