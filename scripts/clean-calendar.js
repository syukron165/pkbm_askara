const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.calendarEvent.deleteMany({});
  console.log(`Deleted ${result.count} dummy records from CalendarEvent.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
