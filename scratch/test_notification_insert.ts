import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.findFirst({
    where: { role: "pendidik" },
  });

  if (!teacher) return;

  const subject = await prisma.subject.findFirst();
  const classItem = await prisma.class.findFirst();

  if (!subject || !classItem) return;

  // Insert a test notification for this teacher
  const notif = await prisma.notification.create({
    data: {
      userId: teacher.id,
      title: `Jadwal Mengajar Baru: ${subject.name} 📅`,
      message: `Halo Bapak/Ibu ${teacher.name}, Anda telah ditugaskan mengajar mata pelajaran "${subject.name}" untuk kelas ${classItem.name} setiap hari Rabu pukul 08:00 - 09:30 WIB di Ruang Belajar Askara.`,
      type: "EVENT",
      actionUrl: "/jadwal",
    },
  });

  console.log("Created notification:", notif);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
