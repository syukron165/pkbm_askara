const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding and normalizing branch data...");

  // 1. Create table Branch if it does not exist
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Branch" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "address" TEXT NOT NULL,
      "city" TEXT NOT NULL DEFAULT 'Bandung',
      "province" TEXT NOT NULL DEFAULT 'Jawa Barat',
      "phone" TEXT,
      "managerName" TEXT,
      "latitude" DOUBLE PRECISION,
      "longitude" DOUBLE PRECISION,
      "radiusMeters" INTEGER NOT NULL DEFAULT 100,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Branch_code_key" ON "Branch"("code");
  `);

  // 2. Insert default branches
  const branches = [
    {
      id: "branch-pusat",
      code: "ASKARA-PUSAT",
      name: "PKBM Askara Pusat (Gedebage)",
      address: "Jl. Adiflora Raya No. 8, Rancabolang, Gedebage",
      city: "Kota Bandung",
      province: "Jawa Barat",
      phone: "0812-3456-7890",
      managerName: "Prof. Arif Syarifudin, S.Pd.",
      latitude: -6.953412,
      longitude: 107.689451,
      radiusMeters: 150,
      isActive: true,
      notes: "Kampus Induk, Pusat Administrasi & Workshop Utama CBT/Vokasi",
    },
    {
      id: "branch-ciparay",
      code: "RB-CIPARAY",
      name: "Rumah Belajar Ciparay",
      address: "Jl. Raya Laswi No. 142, Ciparay",
      city: "Kabupaten Bandung",
      province: "Jawa Barat",
      phone: "0821-9876-5432",
      managerName: "Drs. Hendra Gunawan",
      latitude: -7.034512,
      longitude: 107.712345,
      radiusMeters: 100,
      isActive: true,
      notes: "Sentra Pembelajaran Kesetaraan & Vokasi Agrobisnis/Kuliner",
    },
    {
      id: "branch-cimahi",
      code: "RB-CIMAHI",
      name: "Rumah Belajar Cimahi",
      address: "Jl. Kolonel Masturi No. 67, Cimahi Tengah",
      city: "Kota Cimahi",
      province: "Jawa Barat",
      phone: "0857-1122-3344",
      managerName: "Siti Rahmawati, S.Pd.",
      latitude: -6.872341,
      longitude: 107.541298,
      radiusMeters: 120,
      isActive: true,
      notes: "Sentra Pelatihan Komputer Digital & Desain Grafis",
    },
    {
      id: "branch-lembang",
      code: "RB-LEMBANG",
      name: "Rumah Belajar Lembang",
      address: "Jl. Raya Lembang No. 210, Lembang",
      city: "Kabupaten Bandung Barat",
      province: "Jawa Barat",
      phone: "0813-5566-7788",
      managerName: "Dewi Anggraini, S.Kom.",
      latitude: -6.818921,
      longitude: 107.618732,
      radiusMeters: 150,
      isActive: true,
      notes: "Sentra Vokasi Ekowisata & Keterampilan Bahasa Asing",
    },
  ];

  for (const b of branches) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Branch" ("id", "code", "name", "address", "city", "province", "phone", "managerName", "latitude", "longitude", "radiusMeters", "isActive", "notes", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "address" = EXCLUDED."address",
        "city" = EXCLUDED."city",
        "province" = EXCLUDED."province",
        "phone" = EXCLUDED."phone",
        "managerName" = EXCLUDED."managerName",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "radiusMeters" = EXCLUDED."radiusMeters",
        "isActive" = EXCLUDED."isActive",
        "notes" = EXCLUDED."notes",
        "updatedAt" = CURRENT_TIMESTAMP;
    `, b.id, b.code, b.name, b.address, b.city, b.province, b.phone, b.managerName, b.latitude, b.longitude, b.radiusMeters, b.isActive, b.notes);
  }

  // Normalize all existing branchCode references
  const tables = ["User", "Student", "Class", "ClassSchedule", "Asset", "ExpenseRequest", "GuestVisit", "PublicRegistration"];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "${table}"
        SET "branchCode" = 'ASKARA-PUSAT'
        WHERE "branchCode" IS NULL OR "branchCode" NOT IN ('ASKARA-PUSAT', 'RB-CIPARAY', 'RB-CIMAHI', 'RB-LEMBANG');
      `);
      console.log(`Normalized branchCode on ${table}`);
    } catch (err) {
      console.log(`Notice on ${table}:`, err.message);
    }
  }

  console.log("All branch references normalized successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
