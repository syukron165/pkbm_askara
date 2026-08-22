import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.institutionProfile.upsert({
    where: { id: "default" },
    update: {
      address: "Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung",
      city: "Kota Bandung",
      district: "Gedebage",
      village: "Rancabolang",
      province: "Jawa Barat",
      postalCode: "40296",
      phone: "(022) 87518584 / 085156560630",
      email: "pkbm.askara@gmail.com",
      reportPlaceDate: "Bandung, 13 Agustus 2026",
    },
    create: {
      id: "default",
      name: "Pusat Kegiatan Belajar Masyarakat (PKBM) Askara",
      operationalPermit: "Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP",
      npsn: "P9998766",
      address: "Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung",
      city: "Kota Bandung",
      district: "Gedebage",
      village: "Rancabolang",
      province: "Jawa Barat",
      postalCode: "40296",
      phone: "(022) 87518584 / 085156560630",
      email: "pkbm.askara@gmail.com",
      website: "www.pkbmaskara.sch.id",
      logoUrl: "/logo.png",
      headmasterName: "Arif Syarifudin, S.Pd",
      headmasterNip: "19750914 200003 2 001",
      defaultHomeroomTeacher: "Drs. Hendra Gunawan",
      defaultHomeroomNip: "19800412 200501 1 003",
      reportPlaceDate: "Bandung, 13 Agustus 2026",
      academicYear: "2025/2026",
      semester: "GANJIL",
      curriculumName: "Kurikulum Merdeka Pendidikan Kesetaraan",
    }
  });
  console.log("Updated InstitutionProfile:", updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
