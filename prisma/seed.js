const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Menyiapkan Data Awal PKBM Askara...");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@askara.sch.id" },
    update: {},
    create: {
      email: "admin@askara.sch.id",
      passwordHash: defaultPasswordHash,
      name: "Administrator Utama",
      role: "super_admin",
      phone: "081234567890",
      isActive: true,
    },
  });



  console.log("✅ Seed database berhasil diselesaikan!");
  console.log("Akun Terdaftar:");
  console.log(" - Super Admin: admin@askara.sch.id (Password: password123)");
}

main()
  .catch((e) => {
    console.error("Error saat seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
