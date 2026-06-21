const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando datos de prueba para FarmaIPS...");

  const tenant = await prisma.tenant.upsert({
    where: { nit: "900123456-7" },
    update: {},
    create: {
      id: "ips-principal",
      name: "IPS Clínica San Rafael",
      nit: "900123456-7",
      address: "Calle 100 # 15-20, Bogotá",
      phone: "601 234 5678",
      email: "farmacia@clinicasanrafael.com",
    },
  });
  console.log("✅ Tenant:", tenant.name);

  // Usuarios (Contraseña '123456' para todos)
  const passwordHash = await bcrypt.hash("123456", 10);

  const users = [
    { email: "admin@stratoshealth.com", name: "Super Admin", role: "SUPERADMIN", tenantId: null, password: passwordHash },
    { email: "gerencia@clinicasanrafael.com", name: "Gerente San Rafael", role: "MANAGER", tenantId: "ips-principal", password: passwordHash },
    { email: "regente@clinicasanrafael.com", name: "Regente Farmacia", role: "PHARMACIST", tenantId: "ips-principal", password: passwordHash },
    { email: "enfermera@clinicasanrafael.com", name: "Enfermera Jefe", role: "NURSE", tenantId: "ips-principal", password: passwordHash },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }
  console.log("✅ Usuarios creados (4) - Clave: 123456");


  // Productos (medicamentos con datos INVIMA)
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
    const p = await prisma.product.create({ data: { tenantId: "ips-principal", ...med } });
    if (med.stock > 0) {
      await prisma.kardexEntry.create({ data: { productId: p.id, type: "ENTRADA", quantity: med.stock, balanceAfter: med.stock, reason: "COMPRA", lot: med.lot } });
    }
    createdProducts.push(p);
  }
  console.log("✅ Productos creados:", createdProducts.length);

  // Proveedor
  const proveedor = await prisma.globalSupplier.create({
    data: {
      name: "Distribuidora Farmacéutica Nacional S.A.",
      nit: "800456789-1",
      contact: "Carlos Ruiz",
      email: "pedidos@dfnacional.com",
      phone: "601 987 6543",
      address: "Zona Industrial Puente Aranda, Bogotá",
    },
  });
  console.log("✅ Proveedor:", proveedor.name);

  // Paciente de prueba
  const paciente = await prisma.patient.create({
    data: {
      tenantId: "ips-principal",
      name: "María González Rodríguez",
      documentType: "CC",
      documentNumber: "52345678",
      bedNumber: "301-B",
      ward: "Medicina Interna",
      diagnosis: "J18.9 - Neumonía no especificada",
      doctor: "Dr. Alberto Morales",
      status: "ADMITTED",
    },
  });
  console.log("✅ Paciente de prueba:", paciente.name);

  // Pedido de enfermería de prueba
  await prisma.nurseOrder.create({
    data: {
      tenantId: "ips-principal",
      patientId: paciente.id,
      nurseNote: "Fiebre 38.5°C - PRN",
      status: "PENDING",
      items: {
        create: [
          { productId: createdProducts[0].id, requestedQty: 2, status: "PENDING" },
          { productId: createdProducts[6].id, requestedQty: 1, status: "PENDING" },
        ],
      },
    },
  });
  console.log("✅ Pedido de enfermería de prueba creado");

  // Log de auditoría
  await prisma.auditLog.create({ data: { tenantId: "ips-principal", action: "SEED_DATA", details: "Base de datos inicializada con datos de prueba FarmaIPS" } });

  console.log("\n🎉 ¡Base de datos IPS lista!");
  console.log("📊 Resumen:");
  console.log("   • 1 IPS: Clínica San Rafael");
  console.log("   • 8 medicamentos (incluye controlados y fórmula médica)");
  console.log("   • 1 proveedor registrado");
  console.log("   • 1 paciente admitido con pedido pendiente");
  console.log("\n🚀 Inicia con: npm run dev → http://localhost:3000");
}

main()
  .catch(e => { console.error("❌ Error en seed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());