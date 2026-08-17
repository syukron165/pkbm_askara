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

  // 2. Pendidik / Guru
  const guruUser = await prisma.user.upsert({
    where: { email: "guru@askara.sch.id" },
    update: {},
    create: {
      email: "guru@askara.sch.id",
      passwordHash: defaultPasswordHash,
      name: "Drs. Hendra Gunawan",
      role: "pendidik",
      phone: "081298765432",
      isActive: true,
    },
  });

  // 3. Orang Tua / Wali
  const parentUser = await prisma.user.upsert({
    where: { email: "orangtua@askara.sch.id" },
    update: {},
    create: {
      email: "orangtua@askara.sch.id",
      passwordHash: defaultPasswordHash,
      name: "Joko Santoso (Wali Murid)",
      role: "orang_tua",
      phone: "081345678901",
      isActive: true,
      parentProfile: {
        create: {
          relationship: "AYAH",
          job: "Wiraswasta",
          address: "Jl. Aksara No. 12, Jakarta",
        },
      },
    },
  });

  const parentProfile = await prisma.parent.findUnique({
    where: { userId: parentUser.id },
  });

  // 4. Siswa / Peserta Didik
  const siswaUser = await prisma.user.upsert({
    where: { email: "siswa@askara.sch.id" },
    update: {},
    create: {
      email: "siswa@askara.sch.id",
      passwordHash: defaultPasswordHash,
      name: "Budi Santoso",
      role: "siswa",
      phone: "085612345678",
      isActive: true,
      studentProfile: {
        create: {
          nisn: "0081294812",
          nik: "3171012345670001",
          gender: "L",
          packetType: "Paket C",
          status: "ACTIVE",
          parentId: parentProfile ? parentProfile.id : null,
        },
      },
    },
  });

  // 5. Kelas & Rombel
  const sampleClass = await prisma.class.upsert({
    where: { id: "class-paket-c-10" },
    update: {},
    create: {
      id: "class-paket-c-10",
      name: "Paket C - Kelas X Merdeka",
      level: "Paket C",
      academicYear: "2025/2026",
      semester: "GANJIL",
      homeroomTeacherId: guruUser.id,
    },
  });

  // 6. Mata Pelajaran
  const subjectMat = await prisma.subject.upsert({
    where: { code: "MAT-C10" },
    update: {},
    create: {
      code: "MAT-C10",
      name: "Matematika",
      packetType: "Paket C",
      description: "Matematika Terapan & Konseptual Kesetaraan Paket C",
    },
  });

  console.log("✅ Seed database berhasil diselesaikan!");
  console.log("Akun Demo Terdaftar:");
  console.log(" - Admin: admin@askara.sch.id (Password: password123)");
  console.log(" - Guru: guru@askara.sch.id (Password: password123)");
  console.log(" - Siswa: siswa@askara.sch.id (Password: password123)");
  console.log(" - Orang Tua: orangtua@askara.sch.id (Password: password123)");
}

main()
  .catch((e) => {
    console.error("Error saat seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
