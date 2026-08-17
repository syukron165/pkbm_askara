const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Memulai pembersihan akun demo dari database...");

  // Hapus semua user kecuali admin@askara.sch.id
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        not: "admin@askara.sch.id",
      },
    },
  });

  console.log(`✅ Berhasil menghapus ${deletedUsers.count} akun demo.`);
  console.log("🔒 Akun Admin (admin@askara.sch.id) tetap dipertahankan.");
}

main()
  .catch((e) => {
    console.error("Error saat membersihkan database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
