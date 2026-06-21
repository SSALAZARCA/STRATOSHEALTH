import { PrismaClient } from "@prisma/client";
import SubscriptionSettings from "./SubscriptionSettings";
import { revalidatePath } from "next/cache";
import { 
  tokenizeStripeCard, 
  createWompiPaymentSource, 
  chargeStripeCustomer, 
  chargeWompiPaymentSource 
} from "@/lib/payments";

const prisma = new PrismaClient();

export default async function SubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true }
  });

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  const allPlans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { price: "asc" }
  });

  if (!tenant) return <div>Tenant no encontrado</div>;

  const currentUsers = await prisma.user.count({ where: { tenantId } });
  const maxUsers = tenant.plan?.maxUsers || 5;
  const planName = tenant.plan?.name || tenant.subscriptionPlan;
  const planPrice = tenant.plan?.price || 150000;

  async function toggleAutoRenew(autoRenew: boolean) {
    "use server";
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { autoRenew }
    });
    revalidatePath(`/pharmacy/${tenantId}/subscription`);
  }

  async function addPaymentMethod(formData: FormData) {
    "use server";
    if (!tenant) throw new Error("Tenant no encontrado");

    const provider = formData.get("provider") as string;
    const cardholder = formData.get("cardholder") as string;
    const cardNumber = (formData.get("cardNumber") as string).replace(/\s/g, '');
    const expMonth = parseInt(formData.get("expMonth") as string, 10);
    const expYear = parseInt(formData.get("expYear") as string, 10);
    const cvc = formData.get("cvc") as string;
    const type = "CREDIT_CARD";

    const last4 = cardNumber.slice(-4);
    let brand = "UNKNOWN";
    if (cardNumber.startsWith("4")) brand = "VISA";
    else if (/^5[1-5]/.test(cardNumber)) brand = "MASTERCARD";
    else if (/^3[47]/.test(cardNumber)) brand = "AMEX";

    let gatewayToken = `${provider.toLowerCase()}_tok_${Math.random().toString(36).substr(2, 9)}`;

    if (provider === "STRIPE") {
      const config = await prisma.paymentGatewayConfig.findFirst({
        where: { provider: "STRIPE", isActive: true }
      });
      if (!config) throw new Error("La pasarela de pago Stripe no está configurada o activa.");

      try {
        const cardToken = await tokenizeStripeCard({
          number: cardNumber,
          expMonth: expMonth.toString(),
          expYear: expYear.toString(),
          cvc
        }, config.publicKey);

        // Crear el cliente en Stripe para guardar el método de pago de forma segura
        const customerBody = new URLSearchParams();
        customerBody.append("email", tenant.email || "administracion@clinica.com");
        customerBody.append("source", cardToken);

        const customerRes = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: customerBody.toString(),
        });

        const customerData = await customerRes.json();
        if (!customerRes.ok) {
          throw new Error(customerData.error?.message || "Error al registrar cliente en Stripe");
        }

        gatewayToken = customerData.id;
      } catch (err: any) {
        throw new Error(`[Stripe Error] ${err.message}`);
      }
    } else if (provider === "WOMPI") {
      const config = await prisma.paymentGatewayConfig.findFirst({
        where: { provider: "WOMPI", isActive: true }
      });
      if (!config) throw new Error("La pasarela de pago Wompi no está configurada o activa.");

      try {
        const sourceId = await createWompiPaymentSource(
          tenant.email || "administracion@clinica.com",
          {
            number: cardNumber,
            cvc,
            expMonth: expMonth.toString(),
            expYear: expYear.toString(),
            cardHolder: cardholder
          },
          config.publicKey,
          config.secretKey
        );

        gatewayToken = sourceId.toString();
      } catch (err: any) {
        throw new Error(`[Wompi Error] ${err.message}`);
      }
    }

    const existingCount = await prisma.paymentMethod.count({ where: { tenantId } });
    const isDefault = existingCount === 0;

    await prisma.paymentMethod.create({
      data: {
        tenantId,
        provider,
        type,
        brand,
        last4,
        expMonth,
        expYear,
        cardholder,
        gatewayToken,
        isDefault
      }
    });

    revalidatePath(`/pharmacy/${tenantId}/subscription`);
  }

  async function deletePaymentMethod(paymentMethodId: string) {
    "use server";
    await prisma.paymentMethod.delete({
      where: { id: paymentMethodId, tenantId }
    });
    revalidatePath(`/pharmacy/${tenantId}/subscription`);
  }

  async function changeOrRenewPlan(planId: string, billingPeriod: "annual" | "monthly") {
    "use server";
    if (!tenant) throw new Error("Tenant no encontrado");

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error("Plan no válido");

    const paymentMethods = await prisma.paymentMethod.findMany({ where: { tenantId } });
    if (paymentMethods.length === 0) {
      throw new Error("Debe registrar al menos un método de pago antes de activar o renovar un plan.");
    }

    const defaultPayment = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0];
    
    let totalCost = 0;
    if (billingPeriod === "annual") {
      const months = Math.max(12, plan.durationMonths);
      totalCost = Math.round(plan.price * months * 0.8);
    } else {
      totalCost = plan.price;
    }

    let transactionId = "";

    if (defaultPayment.provider === "STRIPE") {
      const config = await prisma.paymentGatewayConfig.findFirst({
        where: { provider: "STRIPE", isActive: true }
      });
      if (!config) throw new Error("La pasarela de pago Stripe no está activa o configurada.");

      try {
        transactionId = await chargeStripeCustomer(
          defaultPayment.gatewayToken,
          totalCost,
          config.secretKey,
          `Renovación Plan ${plan.name} (${plan.durationMonths} meses) - IPS ${tenant.name}`
        );
      } catch (err: any) {
        throw new Error(`[Stripe Error] ${err.message}`);
      }
    } else if (defaultPayment.provider === "WOMPI") {
      const config = await prisma.paymentGatewayConfig.findFirst({
        where: { provider: "WOMPI", isActive: true }
      });
      if (!config) throw new Error("La pasarela de pago Wompi no está activa o configurada.");

      try {
        const sourceId = parseInt(defaultPayment.gatewayToken, 10);
        if (isNaN(sourceId)) {
          throw new Error("El método de pago guardado de Wompi no es válido para renovaciones automáticas.");
        }

        transactionId = await chargeWompiPaymentSource(
          tenant.email || "administracion@clinica.com",
          sourceId,
          totalCost,
          config.publicKey,
          config.secretKey,
          `Renovación Plan ${plan.name} (${plan.durationMonths} meses) - IPS ${tenant.name}`
        );
      } catch (err: any) {
        throw new Error(`[Wompi Error] ${err.message}`);
      }
    } else {
      throw new Error("La pasarela registrada no es compatible con el cobro automático.");
    }

    let startDate = new Date();
    if (tenant.nextBillingDate && new Date(tenant.nextBillingDate) > new Date()) {
      startDate = new Date(tenant.nextBillingDate);
    }

    const nextBillingDate = new Date(startDate);
    if (billingPeriod === "annual") {
      const months = Math.max(12, plan.durationMonths);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + months);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planId: plan.id,
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: billingPeriod,
        nextBillingDate
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "RENEW_SUBSCRIPTION",
        details: `Suscripción renovada/cambiada al plan ${plan.name} (${billingPeriod === "annual" ? "anual" : "mensual"}). Cargo total: $${totalCost.toLocaleString("es-CO")} COP cobrado vía ${defaultPayment.provider}. ID Transacción: ${transactionId}. Nueva fecha de pago: ${nextBillingDate.toLocaleDateString("es-CO")}`
      }
    });

    revalidatePath(`/pharmacy/${tenantId}/subscription`);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Control de Suscripción</h1>
        <p>Gestiona tu plan activo, límite de usuarios y métodos de cobro</p>
      </div>

      <SubscriptionSettings 
        tenantId={tenantId}
        planName={planName}
        planPrice={planPrice}
        autoRenew={tenant.autoRenew}
        maxUsers={maxUsers}
        currentUsers={currentUsers}
        toggleAutoRenewAction={toggleAutoRenew}
        allPlans={allPlans}
        paymentMethods={paymentMethods}
        addPaymentMethodAction={addPaymentMethod}
        deletePaymentMethodAction={deletePaymentMethod}
        nextBillingDate={tenant.nextBillingDate}
        subscriptionStatus={tenant.subscriptionStatus}
        changeOrRenewPlanAction={changeOrRenewPlan}
        initialBilling={tenant.subscriptionPlan === "monthly" ? "monthly" : "annual"}
      />
    </div>
  );
}
