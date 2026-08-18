const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dummyTitles = [
    'Modul Pembelajaran Mandiri Matematika Paket C - Kelas X',
    'Bahasa Indonesia Kontekstual & Teks Eksplanasi Paket B',
    'Literasi Numerasi Dasar & Sains Lingkungan Paket A',
    'Kewirausahaan & Digital Marketing untuk Warga Belajar PKBM',
    'Pendidikan Pancasila & Kewarganegaraan: Hak dan Kewajiban Warga Negara'
  ];
  
  const result = await prisma.digitalLibrary.deleteMany({
    where: {
      title: {
        in: dummyTitles
      }
    }
  });
  console.log(`Deleted ${result.count} dummy records from DigitalLibrary.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
