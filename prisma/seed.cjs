const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando datos para StratosHealth en producción...");

  // 1. Crear Tenant base si no existe
  const tenantId = "ips-principal";
  let tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { id: tenantId },
        { nit: "900123456-7" }
      ]
    }
  });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        name: "IPS Clínica San Rafael",
        nit: "900123456-7",
        address: "Calle 100 # 15-20, Bogotá",
        phone: "601 234 5678",
        email: "farmacia@clinicasanrafael.com",
      },
    });
    console.log("✅ Tenant creado:", tenant.name);
  } else {
    console.log("ℹ️ Tenant ya existe:", tenant.name);
  }

  // 2. Hash de contraseña para el dueño
  const passwordHash = await bcrypt.hash("ssc841209", 10);

  // 3. Crear el usuario dueño/SUPERADMIN ssalazarc84@gmail.com
  const ownerEmail = "ssalazarc84@gmail.com";
  const ownerUser = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      password: passwordHash,
      role: "SUPERADMIN",
      name: "Dueño StratosHealth",
      active: true,
    },
    create: {
      email: ownerEmail,
      name: "Dueño StratosHealth",
      role: "SUPERADMIN",
      password: passwordHash,
      active: true,
    },
  });
  console.log("✅ Usuario dueño/SUPERADMIN creado/actualizado:", ownerUser.email);

  // 4. Limpiar/Eliminar usuarios de prueba anteriores por seguridad en producción
  const testEmails = [
    "admin@stratoshealth.com",
    "gerencia@clinicasanrafael.com",
    "regente@clinicasanrafael.com",
    "enfermera@clinicasanrafael.com",
  ];
  const deleteResult = await prisma.user.deleteMany({
    where: {
      email: { in: testEmails },
    },
  });
  if (deleteResult.count > 0) {
    console.log(`✅ Eliminados ${deleteResult.count} usuarios de prueba antiguos.`);
  }

  // 5. Crear proveedor si no existe
  const supplierEmail = "pedidos@dfnacional.com";
  let supplier = await prisma.globalSupplier.findFirst({
    where: {
      OR: [
        { email: supplierEmail },
        { nit: "800456789-1" }
      ]
    },
  });
  if (!supplier) {
    supplier = await prisma.globalSupplier.create({
      data: {
        name: "Distribuidora Farmacéutica Nacional S.A.",
        nit: "800456789-1",
        contact: "Carlos Ruiz",
        email: supplierEmail,
        phone: "601 987 6543",
        address: "Zona Industrial Puente Aranda, Bogotá",
      },
    });
    console.log("✅ Proveedor creado:", supplier.name);
  } else {
    console.log("ℹ️ Proveedor ya existe:", supplier.name);
  }

  // 6. Crear productos base si no hay ninguno en el tenant
  const productCount = await prisma.product.count({ where: { tenantId } });
  if (productCount === 0) {
    const medicamentos = [
      { name: "Acetaminofén 500mg", genericName: "Paracetamol", concentration: "500mg", pharmaceuticalForm: "Tableta", invimaSanitary: "INVIMA 2019M-0012345", atcCode: "N02BE01", stock: 500, minStock: 50, maxStock: 1000, unitCost: 150, salePrice: 300, unit: "UND", lot: "ACE2024A", category: "Analgésico", controlled: false, requiresPrescription: false },
      { name: "Ibuprofeno 400mg", genericName: "Ibuprofeno", concentration: "400mg", pharmaceuticalForm: "Tableta", invimaSanitary: "INVIMA 2020M-0023456", atcCode: "M01AE01", stock: 300, minStock: 30, maxStock: 600, unitCost: 200, salePrice: 450, unit: "UND", lot: "IBU2024B", category: "Antiinflamatorio", controlled: false, requiresPrescription: false },
      { name: "Amoxicilina 500mg", genericName: "Amoxicilina", concentration: "500mg", pharmaceuticalForm: "Cápsula", invimaSanitary: "INVIMA 2021M-0034567", atcCode: "J01CA04", stock: 8, minStock: 20, maxStock: 300, unitCost: 800, salePrice: 1500, unit: "CAP", lot: "AMX2024C", category: "Antibiótico", controlled: false, requiresPrescription: true },
      { name: "Morfina 10mg/mL", genericName: "Morfina", concentration: "10mg/mL", pharmaceuticalForm: "Ampolla", invimaSanitary: "INVIMA 2019M-0045678", atcCode: "N02AA01", stock: 5, minStock: 10, maxStock: 100, unitCost: 15000, salePrice: 25000, unit: "AMP", lot: "MOR2024D", category: "Analgésico", controlled: true, requiresPrescription: true },
      { name: "Metoprolol 50mg", genericName: "Metoprolol tartrato", concentration: "50mg", pharmaceuticalForm: "Tableta", invimaSanitary: "INVIMA 2020M-0056789", atcCode: "C07AB02", stock: 200, minStock: 20, maxStock: 400, unitCost: 500, salePrice: 900, unit: "UND", lot: "MET2024E", category: "Antihipertensivo", controlled: false, requiresPrescription: true },
      { name: "Omeprazol 20mg", genericName: "Omeprazol", concentration: "20mg", pharmaceuticalForm: "Cápsula", invimaSanitary: "INVIMA 2021M-0067890", atcCode: "A02BC01", stock: 0, minStock: 30, maxStock: 500, unitCost: 350, salePrice: 700, unit: "CAP", lot: "OME2024F", category: "Protector gástrico", controlled: false, requiresPrescription: false },
      { name: "Solución Salina 0.9% 500mL", genericName: "Cloruro de sodio", concentration: "0.9%", pharmaceuticalForm: "Solución IV", invimaSanitary: "INVIMA 2022M-0078901", atcCode: "B05BB01", stock: 50, minStock: 20, maxStock: 200, unitCost: 8000, salePrice: 15000, unit: "FRS", lot: "SSN2024G", category: "Solución IV", controlled: false, requiresPrescription: false },
      { name: "Lorazepam 2mg", genericName: "Lorazepam", concentration: "2mg", pharmaceuticalForm: "Tableta", invimaSanitary: "INVIMA 2019M-0089012", atcCode: "N05BA06", stock: 3, minStock: 10, maxStock: 100, unitCost: 2500, salePrice: 5000, unit: "UND", lot: "LOR2024H", category: "Psicotrópico", controlled: true, requiresPrescription: true },
    ];

    const createdProducts = [];
    for (const med of medicamentos) {
      const p = await prisma.product.create({ data: { tenantId, ...med } });
      if (med.stock > 0) {
        await prisma.kardexEntry.create({
          data: {
            productId: p.id,
            type: "ENTRADA",
            quantity: med.stock,
            balanceAfter: med.stock,
            reason: "COMPRA",
            lot: med.lot,
          },
        });
      }
      createdProducts.push(p);
    }
    console.log("✅ Productos base creados:", createdProducts.length);
  }

  // 7. Auditoría
  await prisma.auditLog.create({
    data: {
      tenantId,
      action: "SEED_DATA",
      details: "Base de datos inicializada en producción y limpieza de usuarios demo efectuada.",
    },
  });

  console.log("\n🎉 ¡Base de datos de producción lista!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());