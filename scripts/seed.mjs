import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = "syukron.aqiqah@gmail.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.log("Admin already exists:", existing.email);
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Syukron (Super Admin)",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      emailVerified: true,
    }
  });
  
  console.log("Admin created successfully:", user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
