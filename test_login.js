import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Running test_login.js verification...");
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database.`);
  for (const u of users) {
    const checkPassword = u.email === "ssalazarc84@gmail.com" ? "ssc841209" : "123456";
    const isMatch = await bcrypt.compare(checkPassword, u.password);
    console.log(`User: ${u.email}, password matches '${checkPassword}': ${isMatch}`);
  }
  console.log("✅ test_login.js verification completed successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());

