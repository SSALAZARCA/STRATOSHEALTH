"use server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();
const TENANT = "ips-principal";

// ============================================================
// PACIENTES
// ============================================================
export async function admitPatient(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const documentType = formData.get("documentType") as string;
  const documentNumber = formData.get("documentNumber") as string;
  const bedNumber = formData.get("bedNumber") as string;
  const ward = formData.get("ward") as string;
  const diagnosis = formData.get("diagnosis") as string;
  const doctor = formData.get("doctor") as string;

  await prisma.patient.create({
    data: { name, documentType, documentNumber, bedNumber, ward, diagnosis, doctor, tenantId: TENANT, status: "ADMITTED" },
  });
  await prisma.auditLog.create({ data: { action: "ADMIT_PATIENT", details: `Ingreso: ${name}`, tenantId: TENANT } });
  revalidatePath(`/pharmacy/${TENANT}/patients`);
}

export async function dischargePatient(patientId: string): Promise<void> {
  const patient = await prisma.patient.findUnique({ where: { id: patientId }, include: { consumptions: true } });
  if (!patient) return;
  const total = patient.consumptions.reduce((s, c) => s + c.totalPrice, 0);
  await prisma.patient.update({ where: { id: patientId }, data: { status: "DISCHARGED", dischargeDate: new Date() } });
  await prisma.billingOrder.create({ data: { patientId, tenantId: TENANT, totalAmount: total, status: "PENDING" } });
  await prisma.auditLog.create({ data: { action: "DISCHARGE_PATIENT", details: `Egreso: ${patient.name} | Total: $${total.toFixed(0)}`, tenantId: TENANT } });
  revalidatePath(`/pharmacy/${TENANT}/patients`);
}

// ============================================================
// PEDIDOS DE ENFERMERÍA
// ============================================================
export async function createNurseOrder(formData: FormData): Promise<void> {
  const patientId = formData.get("patientId") as string;
  const nurseNote = formData.get("nurseNote") as string;
  const itemsJSON = formData.get("itemsJSON") as string;
  
  if (!itemsJSON) return;
  const parsedItems = JSON.parse(itemsJSON) as Array<{ productId: string, qty: number }>;
  if (parsedItems.length === 0) return;

  const doctorName = formData.get("doctorName") as string | null;
  const prescriptionDateStr = formData.get("prescriptionDate") as string | null;

  const order = await prisma.nurseOrder.create({
    data: {
      tenantId: TENANT,
      patientId,
      nurseNote,
      status: "PENDING",
      doctorName,
      prescriptionDate: prescriptionDateStr ? new Date(prescriptionDateStr) : null,
      items: {
        create: parsedItems.map(item => ({
          productId: item.productId,
          requestedQty: item.qty,
          status: "PENDING"
        }))
      }
    },
  });

  await prisma.auditLog.create({ data: { action: "CREATE_ORDER", details: `Pedido #${order.id} creado`, tenantId: TENANT } });
  revalidatePath(`/pharmacy/${TENANT}/nurse`);
}

export async function dispatchNurseOrder(orderId: string): Promise<void> {
  const order = await prisma.nurseOrder.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } }, patient: true } });
  if (!order) return;

  const results: Array<{ dispatched: number; status: string }> = [];
  for (const item of order.items) {
    const toDispatch = Math.min(item.requestedQty, item.product.stock);
    const itemStatus = toDispatch >= item.requestedQty ? "DISPATCHED" : toDispatch > 0 ? "PARTIAL" : "UNAVAILABLE";

    if (toDispatch > 0) {
      await prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: toDispatch } } });
      await prisma.patientConsumption.create({
        data: { patientId: order.patientId, productId: item.productId, quantity: toDispatch, unitPrice: item.product.unitCost, totalPrice: toDispatch * item.product.unitCost },
      });
      const updated = await prisma.product.findUnique({ where: { id: item.productId } });
      await prisma.kardexEntry.create({
        data: { productId: item.productId, type: "SALIDA", quantity: toDispatch, balanceAfter: updated!.stock, reason: "DESPACHO", reference: orderId, lot: item.product.lot || null },
      });
    }

    await prisma.nurseOrderItem.update({ where: { id: item.id }, data: { dispatchedQty: toDispatch, status: itemStatus } });
    results.push({ dispatched: toDispatch, status: itemStatus });
  }

  const hasAll = results.every(r => r.status === "DISPATCHED");
  const hasSome = results.some(r => r.dispatched > 0);
  const orderStatus = hasAll ? "DISPATCHED" : hasSome ? "PARTIAL" : "REJECTED";

  await prisma.nurseOrder.update({ where: { id: orderId }, data: { status: orderStatus, dispatchedAt: new Date() } });
  await prisma.auditLog.create({ data: { action: "DISPATCH_ORDER", details: `Despacho orden ${orderId}: ${orderStatus}`, tenantId: TENANT } });
  revalidatePath(`/pharmacy/${TENANT}/pharmacist`);
  revalidatePath(`/pharmacy/${TENANT}/nurse`);
}

// ============================================================
// INVENTARIO
// ============================================================
export async function createProduct(formData: FormData): Promise<void> {
  const lot = formData.get("lot") as string | null;
  const expiryDateStr = formData.get("expiryDate") as string | null;
  const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;
  const stock = parseInt(formData.get("stock") as string) || 0;

  const product = await prisma.product.create({
    data: {
      tenantId: TENANT,
      name: formData.get("name") as string,
      genericName: formData.get("genericName") as string,
      concentration: formData.get("concentration") as string,
      pharmaceuticalForm: formData.get("pharmaceuticalForm") as string,
      invimaSanitary: formData.get("invimaSanitary") as string,
      atcCode: formData.get("atcCode") as string,
      stock,
      minStock: parseInt(formData.get("minStock") as string) || 10,
      maxStock: parseInt(formData.get("maxStock") as string) || 500,
      unitCost: parseFloat(formData.get("unitCost") as string) || 0,
      salePrice: parseFloat(formData.get("salePrice") as string) || 0,
      unit: (formData.get("unit") as string) || "UND",
      lot: lot || null,
      expiryDate,
      category: formData.get("category") as string,
      location: formData.get("location") as string,
      controlled: formData.get("controlled") === "true",
      requiresPrescription: formData.get("requiresPrescription") === "true",
    },
  });

  if (stock > 0) {
    await prisma.kardexEntry.create({ data: { productId: product.id, type: "ENTRADA", quantity: stock, balanceAfter: stock, reason: "COMPRA", lot: lot || null, expiryDate } });
  }
  await prisma.auditLog.create({ data: { action: "CREATE_PRODUCT", details: `Producto creado: ${product.name}`, tenantId: TENANT } });
  revalidatePath(`/pharmacy/${TENANT}/inventory`);
}

// ============================================================
// PROVEEDORES (B2B Globales, no se crean localmente)
// ============================================================

// ============================================================
// ÓRDENES DE COMPRA
// ============================================================
export async function generateAutoPurchaseOrder(tenantId: string): Promise<void> {
  // 1. Obtener la clínica y su región
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant?.regionId) return;

  // 2. Obtener productos con stock bajo
  const lowStockProducts = await prisma.product.findMany({
    where: { tenantId, stock: { lte: prisma.product.fields.minStock } }
  });
  if (lowStockProducts.length === 0) return;

  // 3. Obtener proveedores de la región con sus ofertas
  const regionSuppliers = await prisma.globalSupplier.findMany({
    where: { coverages: { some: { regionId: tenant.regionId } } },
    include: { offers: true }
  });

  // Estructura para agrupar por proveedor: supplierId -> items
  const supplierOrders = new Map<string, Array<{ productId: string, quantity: number, unitCost: number, totalCost: number }>>();

  for (const product of lowStockProducts) {
    const qtyToOrder = Math.max(product.maxStock - product.stock, product.minStock * 2);

    // Buscar ofertas coincidentes (mismo INVIMA o coincidencia en nombre genérico)
    const matches = regionSuppliers.flatMap(s =>
      s.offers
        .filter(o => o.genericName.toLowerCase().includes(product.genericName.toLowerCase()) || (product.invimaSanitary && o.invimaSanitary === product.invimaSanitary))
        .map(o => ({ ...o, supplierId: s.id }))
    ).sort((a, b) => a.price - b.price); // El de menor costo primero

    if (matches.length > 0) {
      const bestOffer = matches[0];
      if (!supplierOrders.has(bestOffer.supplierId)) {
        supplierOrders.set(bestOffer.supplierId, []);
      }
      supplierOrders.get(bestOffer.supplierId)!.push({
        productId: product.id,
        quantity: qtyToOrder,
        unitCost: bestOffer.price,
        totalCost: bestOffer.price * qtyToOrder
      });
    }
  }

  // 4. Crear las Órdenes de Compra por Proveedor
  for (const [supplierId, items] of Array.from(supplierOrders.entries())) {
    const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

    await prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId,
        status: "DRAFT", // Queda en borrador para autorización del Regente
        totalAmount,
        items: {
          create: items
        }
      }
    });
  }

  revalidatePath(`/pharmacy/${tenantId}/purchase-orders`);
}
export async function sendPurchaseOrderEmail(orderId: string): Promise<void> {
  const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId }, include: { supplier: true } });
  if (!order) return;
  await prisma.purchaseOrder.update({ where: { id: orderId }, data: { status: "SENT", emailSent: true, emailSentAt: new Date() } });
  await prisma.auditLog.create({ data: { action: "SEND_PO_EMAIL", details: `OC enviada a ${order.supplier.email} | Total: $${order.totalAmount.toFixed(0)}`, tenantId: TENANT } });
  revalidatePath(`/pharmacy/${TENANT}/purchase-orders`);
}

export async function receivePurchaseOrder(orderId: string): Promise<void> {
  const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } });
  if (!order) return;

  for (const item of order.items) {
    // Buscar la oferta del proveedor para enriquecer los datos INVIMA de la IPS
    const offer = await prisma.supplierOffer.findFirst({
      where: {
        supplierId: order.supplierId,
        genericName: item.product.genericName
      }
    });

    const updated = await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: { increment: item.quantity },
        unitCost: item.unitCost,
        // Sincronizar datos INVIMA con la oferta recibida
        ...(offer && {
          invimaSanitary: offer.invimaSanitary || item.product.invimaSanitary,
          atcCode: offer.atcCode || item.product.atcCode,
          concentration: offer.concentration || item.product.concentration,
          pharmaceuticalForm: offer.pharmaceuticalForm || item.product.pharmaceuticalForm,
          unit: offer.unit || item.product.unit,
          controlled: offer.controlled,
          requiresPrescription: offer.requiresPrescription,
          lot: offer.lot || item.product.lot,
          expiryDate: offer.expiryDate || item.product.expiryDate
        })
      }
    });

    await prisma.kardexEntry.create({
      data: { 
        productId: item.productId, 
        type: "ENTRADA", 
        quantity: item.quantity, 
        balanceAfter: updated.stock, 
        reason: "COMPRA", 
        reference: orderId,
        lot: offer?.lot || item.product.lot,
        expiryDate: offer?.expiryDate || item.product.expiryDate
      },
    });
  }
  await prisma.purchaseOrder.update({ where: { id: orderId }, data: { status: "RECEIVED" } });
  revalidatePath(`/pharmacy/${TENANT}/purchase-orders`);
  revalidatePath(`/pharmacy/${TENANT}/inventory`);
}