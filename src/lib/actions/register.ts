"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { tokenizeStripeCard, createStripeCustomerAndCharge, createWompiPaymentSource, chargeWompiPaymentSource } from "@/lib/payments";

const prisma = new PrismaClient();

export async function registerTenant(formData: FormData) {
  const clinicName = formData.get("clinicName") as string;
  const nit = formData.get("nit") as string;
  const planId = formData.get("planId") as string;
  
  const adminName = formData.get("adminName") as string;
  const adminEmail = formData.get("adminEmail") as string;
  const adminPassword = formData.get("adminPassword") as string;

  const provider = formData.get("provider") as string;
  const cardNumber = formData.get("cardNumber") as string;
  const expMonth = formData.get("expMonth") as string;
  const expYear = formData.get("expYear") as string;
  const cvc = formData.get("cvc") as string;
  const billingPeriod = formData.get("billingPeriod") as string || "annual";

  if (!clinicName || !adminEmail || !adminPassword || !planId) {
    throw new Error("Faltan datos obligatorios");
  }

  // Verificar que el correo no exista
  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingUser) {
    throw new Error("El correo electrónico ya está en uso");
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan no válido");

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Mapear marca de tarjeta
  let brand = "Visa";
  if (cardNumber.startsWith("5")) brand = "MasterCard";
  if (cardNumber.startsWith("3")) brand = "Amex";
  if (provider === "PSE") brand = "PSE";

  // Total a cobrar = precio mensual del plan × duración del plan
  // El plan ya tiene incorporado el precio por su duración (MENSUAL=1mes, ANUAL=12meses, 24MESES=24meses)
  const totalCost = plan.price * plan.durationMonths;

  // 1. Procesar Pago Real según la pasarela elegida
  let gatewayToken = `tok_${provider.toLowerCase()}_${Math.random().toString(36).substring(7)}`;

  if (provider === "STRIPE") {
    const config = await prisma.paymentGatewayConfig.findFirst({
      where: { provider: "STRIPE", isActive: true }
    });
    if (!config) {
      throw new Error("La pasarela de pago Stripe no está configurada o activa en el sistema.");
    }
    try {
      const cardToken = await tokenizeStripeCard({
        number: cardNumber,
        expMonth,
        expYear,
        cvc
      }, config.publicKey);

      const paymentResult = await createStripeCustomerAndCharge(
        adminEmail,
        cardToken,
        totalCost,
        config.secretKey,
        `Suscripción de registro IPS ${clinicName} - Plan ${plan.name} (${plan.durationMonths} meses)`
      );

      gatewayToken = paymentResult.customerId; // Guardamos el ID del cliente para cobros recurrentes
    } catch (err: any) {
      throw new Error(`[Stripe Error] ${err.message}`);
    }
  } else if (provider === "WOMPI") {
    const config = await prisma.paymentGatewayConfig.findFirst({
      where: { provider: "WOMPI", isActive: true }
    });
    if (!config) {
      throw new Error("La pasarela de pago Wompi no está configurada o activa en el sistema.");
    }
    try {
      // 1. Crear Payment Source
      const sourceId = await createWompiPaymentSource(
        adminEmail,
        {
          number: cardNumber,
          cvc,
          expMonth,
          expYear,
          cardHolder: adminName
        },
        config.publicKey,
        config.secretKey
      );

      // 2. Cobrar primer ciclo a la fuente de pago
      await chargeWompiPaymentSource(
        adminEmail,
        sourceId,
        totalCost,
        config.publicKey,
        config.secretKey,
        `Suscripción de registro IPS ${clinicName} - Plan ${plan.name} (${plan.durationMonths} meses)`
      );

      gatewayToken = sourceId.toString(); // Guardamos el ID de la fuente de pago para cobros recurrentes
    } catch (err: any) {
      throw new Error(`[Wompi Error] ${err.message}`);
    }
  }

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + plan.durationMonths);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Crear Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: clinicName,
          nit: nit || "Pendiente",
          planId: plan.id,
          subscriptionStatus: "ACTIVE",
          subscriptionPlan: billingPeriod, // Guardamos la periodicidad de cobro ("annual" o "monthly")
          autoRenew: true,
          nextBillingDate: nextBillingDate,
        }
      });

      // 2. Crear Usuario Manager
      await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: "MANAGER",
          tenantId: tenant.id,
          active: true,
        }
      });

      // 3. Guardar Método de Pago
      await tx.paymentMethod.create({
        data: {
          tenantId: tenant.id,
          provider: provider,
          type: provider === "PSE" ? "BANK_ACCOUNT" : "CREDIT_CARD",
          gatewayToken: gatewayToken,
          last4: provider === "PSE" ? "0000" : cardNumber.slice(-4) || "0000",
          brand: brand,
          expMonth: parseInt(expMonth) || 12,
          expYear: parseInt(expYear) || 29,
          isDefault: true
        }
      });
    });
  } catch (error) {
    console.error(error);
    throw new Error("Error procesando el registro");
  }

  // Redirigir al login después de crearlo con un mensaje de éxito (podemos pasarlo por query string)
  redirect("/login?success=Registro+completado.+Inicia+sesión+con+tu+correo+y+contraseña");
}
