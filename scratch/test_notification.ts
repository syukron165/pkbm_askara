import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find a teacher
  const teacher = await prisma.user.findFirst({
    where: { role: "pendidik" },
  });

  if (!teacher) {
    console.log("No teacher found in database.");
    return;
  }

  console.log("Found teacher:", teacher.id, teacher.name);

  // Check existing notifications for this teacher
  const notifs = await prisma.notification.findMany({
    where: { userId: teacher.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log(`Teacher currently has ${notifs.length} recent notifications:`);
  notifs.forEach(n => console.log(` - [${n.type}] ${n.title}: ${n.message}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
