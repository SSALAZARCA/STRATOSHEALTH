const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Regions and Global Suppliers...");

  const antioquia = await prisma.region.create({ data: { name: "Antioquia" } });
  const cundi = await prisma.region.create({ data: { name: "Cundinamarca" } });

  // Update existing tenants to have a region
  const tenants = await prisma.tenant.findMany();
  for (const t of tenants) {
    await prisma.tenant.update({ where: { id: t.id }, data: { regionId: antioquia.id } });
  }

  // Create Supplier User
  const pass = await bcrypt.hash("123456", 10);
  await prisma.user.upsert({
    where: { email: "ventas@distrifarma.com" },
    update: {},
    create: {
      email: "ventas@distrifarma.com",
      name: "Distribuidora Farma SAS",
      password: pass,
      role: "SUPPLIER_ADMIN"
    }
  });

  // Create Global Supplier
  const supplier = await prisma.globalSupplier.upsert({
    where: { email: "ventas@distrifarma.com" },
    update: {},
    create: {
      email: "ventas@distrifarma.com",
      name: "Distribuidora Farma SAS",
      nit: "900.123.456-7",
      coverages: {
        create: [
          { regionId: antioquia.id },
          { regionId: cundi.id }
        ]
      },
      offers: {
        create: [
          { name: "Dolex Forte", genericName: "Paracetamol", price: 1500, availableStock: 5000, leadTimeDays: 2 },
          { name: "Amoxidal", genericName: "Amoxicilina", price: 2200, availableStock: 1000, leadTimeDays: 4 },
          { name: "Ibuprofeno Mk", genericName: "Ibuprofeno", price: 800, availableStock: 10000, leadTimeDays: 1 }
        ]
      }
    }
  });

  console.log("Seeding complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
