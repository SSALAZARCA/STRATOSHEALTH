/**
 * Stratos Health - Integración Real de Pasarelas de Pago (Stripe y Wompi)
 */

interface StripeCardData {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}

interface WompiCardData {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

// ============================================================================
// STRIPE INTEGRATION (REST API)
// ============================================================================

/**
 * Tokeniza una tarjeta de crédito usando la Public Key de Stripe.
 */
export async function tokenizeStripeCard(
  card: StripeCardData,
  publicKey: string
): Promise<string> {
  const body = new URLSearchParams();
  body.append("card[number]", card.number.replace(/\s/g, ""));
  body.append("card[exp_month]", card.expMonth);
  body.append("card[exp_year]", card.expYear.length === 2 ? `20${card.expYear}` : card.expYear);
  body.append("card[cvc]", card.cvc);

  const res = await fetch("https://api.stripe.com/v1/tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${publicKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Error al tokenizar la tarjeta en Stripe");
  }

  return data.id; // tok_...
}

/**
 * Registra un cliente en Stripe (con su método de pago predeterminado) y realiza el cobro.
 * Retorna el ID del cliente (para cobros recurrentes) y el ID de la transacción.
 */
export async function createStripeCustomerAndCharge(
  email: string,
  cardToken: string,
  amountCop: number,
  secretKey: string,
  description: string
): Promise<{ customerId: string; chargeId: string }> {
  // 1. Crear el cliente con el token de tarjeta asignado como origen
  const customerBody = new URLSearchParams();
  customerBody.append("email", email);
  customerBody.append("source", cardToken);

  const customerRes = await fetch("https://api.stripe.com/v1/customers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: customerBody.toString(),
  });

  const customerData = await customerRes.json();
  if (!customerRes.ok) {
    throw new Error(customerData.error?.message || "Error al registrar cliente en Stripe");
  }

  const customerId = customerData.id;

  // 2. Realizar el cobro usando el cliente recién creado
  const chargeBody = new URLSearchParams();
  chargeBody.append("amount", Math.round(amountCop).toString()); // En Stripe, COP es una moneda de cero decimales
  chargeBody.append("currency", "cop");
  chargeBody.append("customer", customerId);
  chargeBody.append("description", description);

  const chargeRes = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: chargeBody.toString(),
  });

  const chargeData = await chargeRes.json();
  if (!chargeRes.ok) {
    throw new Error(chargeData.error?.message || "Error al realizar el cobro en Stripe");
  }

  return { customerId, chargeId: chargeData.id };
}

/**
 * Realiza un cargo a un cliente recurrentes de Stripe (usando su Customer ID guardado).
 */
export async function chargeStripeCustomer(
  customerId: string,
  amountCop: number,
  secretKey: string,
  description: string
): Promise<string> {
  const chargeBody = new URLSearchParams();
  chargeBody.append("amount", Math.round(amountCop).toString());
  chargeBody.append("currency", "cop");
  chargeBody.append("customer", customerId);
  chargeBody.append("description", description);

  const chargeRes = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: chargeBody.toString(),
  });

  const chargeData = await chargeRes.json();
  if (!chargeRes.ok) {
    throw new Error(chargeData.error?.message || "Error al realizar cobro de renovación en Stripe");
  }

  return chargeData.id;
}


// ============================================================================
// WOMPI INTEGRATION (REST API)
// ============================================================================

/**
 * Detecta si las credenciales de Wompi corresponden a pruebas (Sandbox) o producción.
 */
function getWompiBaseUrl(publicKey: string): string {
  return publicKey.startsWith("pub_test_") 
    ? "https://sandbox.wompi.co/v1" 
    : "https://production.wompi.co/v1";
}

/**
 * Obtiene el token de aceptación legal obligatorio del comercio en Wompi.
 */
async function getWompiAcceptanceToken(publicKey: string, baseUrl: string): Promise<string> {
  const res = await fetch(`${baseUrl}/merchants/${publicKey}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Error al consultar información del comercio en Wompi");
  }
  return data.data.presigned_acceptance.acceptance_token;
}

/**
 * Tokeniza una tarjeta de crédito en Wompi.
 */
async function tokenizeWompiCard(
  card: WompiCardData,
  publicKey: string,
  baseUrl: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/tokens/cards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${publicKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      number: card.number.replace(/\s/g, ""),
      cvc: card.cvc,
      exp_month: card.expMonth,
      exp_year: card.expYear.length === 4 ? card.expYear.slice(-2) : card.expYear, // Wompi espera YY
      card_holder: card.cardHolder,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.status === "ERROR") {
    throw new Error(data.error?.message || data.error?.reason || "Error al tokenizar la tarjeta en Wompi");
  }

  return data.data.id; // tok_card_...
}

/**
 * Realiza un cobro real con tarjeta usando Wompi.
 * Wompi requiere token de aceptación legal, token de tarjeta, y cobro directo.
 */
export async function chargeWompiCard(
  email: string,
  card: WompiCardData,
  amountCop: number,
  publicKey: string,
  privateKey: string,
  description: string
): Promise<string> {
  const baseUrl = getWompiBaseUrl(publicKey);

  // 1. Obtener acceptance token (legal)
  const acceptanceToken = await getWompiAcceptanceToken(publicKey, baseUrl);

  // 2. Tokenizar la tarjeta
  const cardToken = await tokenizeWompiCard(card, publicKey, baseUrl);

  // 3. Crear la transacción
  const reference = `ref_wompi_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const amountInCents = Math.round(amountCop) * 100; // Wompi requiere centavos en COP (multiplicar por 100)

  const res = await fetch(`${baseUrl}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${privateKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount_in_cents: amountInCents,
      currency: "COP",
      customer_email: email,
      payment_method: {
        type: "CARD",
        token: cardToken,
        installments: 1,
      },
      reference,
      customer_acceptances: {
        acceptance_token: acceptanceToken,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.error?.reason || "Error al procesar la transacción en Wompi");
  }

  // Wompi las procesa asíncronamente; verificamos el estado
  const txStatus = data.data.status; // PENDING, APPROVED, DECLINED, VOIDED, ERROR
  if (txStatus === "DECLINED") {
    throw new Error("Transacción rechazada por la pasarela de pagos Wompi.");
  }
  if (txStatus === "ERROR") {
    throw new Error("Error interno al procesar el pago en Wompi.");
  }

  return data.data.id; // Transaction ID
}

/**
 * Crea una fuente de pago (Payment Source) reutilizable en Wompi para cobros recurrentes.
 * Retorna el ID numérico de la fuente de pago.
 */
export async function createWompiPaymentSource(
  email: string,
  card: WompiCardData,
  publicKey: string,
  privateKey: string
): Promise<number> {
  const baseUrl = getWompiBaseUrl(publicKey);

  // 1. Obtener token de aceptación legal
  const acceptanceToken = await getWompiAcceptanceToken(publicKey, baseUrl);

  // 2. Tokenizar la tarjeta
  const cardToken = await tokenizeWompiCard(card, publicKey, baseUrl);

  // 3. Crear el Payment Source
  const res = await fetch(`${baseUrl}/payment_sources`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${privateKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "CARD",
      token: cardToken,
      customer_email: email,
      acceptance_token: acceptanceToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.error?.reason || "Error al crear la fuente de pago en Wompi");
  }

  return data.data.id; // ID numérico del Payment Source
}

/**
 * Cobra una renovación de suscripción en Wompi usando una fuente de pago (Payment Source ID).
 */
export async function chargeWompiPaymentSource(
  email: string,
  paymentSourceId: number,
  amountCop: number,
  publicKey: string,
  privateKey: string,
  description: string
): Promise<string> {
  const baseUrl = getWompiBaseUrl(publicKey);
  const reference = `ref_wompi_renew_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const amountInCents = Math.round(amountCop) * 100;

  const res = await fetch(`${baseUrl}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${privateKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount_in_cents: amountInCents,
      currency: "COP",
      customer_email: email,
      payment_method: {
        type: "CARD",
        installments: 1,
      },
      payment_source_id: paymentSourceId,
      reference,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.error?.reason || "Error al procesar la renovación en Wompi");
  }

  const txStatus = data.data.status;
  if (txStatus === "DECLINED") {
    throw new Error("Transacción de renovación rechazada por Wompi.");
  }
  if (txStatus === "ERROR") {
    throw new Error("Error interno al procesar la renovación en Wompi.");
  }

  return data.data.id;
}
