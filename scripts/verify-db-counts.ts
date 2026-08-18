import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  const totalUsers = await prisma.user.count();
  const totalStudents = await prisma.student.count();
  const totalRegistrations = await prisma.publicRegistration.count();
  const totalTeachers = await prisma.user.count({ where: { role: "pendidik" } });
  const totalAdmins = await prisma.user.count({ where: { role: { in: ["admin", "super_admin"] } } });
  const totalStudentUsers = await prisma.user.count({ where: { role: "siswa" } });

  console.log("=== RINGKASAN DATA DATABASE PKBM ASKARA ===");
  console.log(`👤 Total User Akun: ${totalUsers}`);
  console.log(`👨‍🏫 Total Guru/Pendidik: ${totalTeachers}`);
  console.log(`🏢 Total Admin/Manajemen: ${totalAdmins}`);
  console.log(`🎓 Total Siswa (User): ${totalStudentUsers}`);
  console.log(`📚 Total Profil Siswa (Student Table): ${totalStudents}`);
  console.log(`📑 Total Berkas Pendaftaran Publik: ${totalRegistrations}`);

  // Sample student with documents
  const sampleStudent = await prisma.publicRegistration.findFirst({
    where: { type: "SISWA" },
    orderBy: { createdAt: "desc" },
  });
  console.log("\nContoh 1 Data Siswa Terdaftar:");
  console.log({
    NoPendaftaran: sampleStudent?.registrationNumber,
    Nama: sampleStudent?.fullName,
    NISN: sampleStudent?.nisn,
    Program: sampleStudent?.packetType,
    FotoSiswa: sampleStudent?.avatarUrl,
    FotoKK: sampleStudent?.kkUrl,
    FotoIjazah: sampleStudent?.diplomaUrl,
  });

  // Sample teacher with documents
  const sampleTeacher = await prisma.publicRegistration.findFirst({
    where: { type: "TUTOR" },
    orderBy: { createdAt: "desc" },
  });
  console.log("\nContoh 1 Data Guru/Pendidik Terdaftar:");
  console.log({
    NoPendaftaran: sampleTeacher?.registrationNumber,
    Nama: sampleTeacher?.fullName,
    Email: sampleTeacher?.email,
    Posisi: sampleTeacher?.positionApplied,
    Pendidikan: sampleTeacher?.lastEducation,
    FotoCloseUp: sampleTeacher?.avatarUrl,
    FotoIjazah: sampleTeacher?.diplomaUrl,
    Transkrip: sampleTeacher?.transcriptUrl,
  });
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
