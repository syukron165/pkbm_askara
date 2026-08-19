import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/rapor/institution
// Mengambil profil institusi untuk kop surat, head, & cover rapor
export async function GET() {
  try {
    let profile = await db.institutionProfile.findUnique({
      where: { id: "default" },
    });

    if (!profile) {
      profile = await db.institutionProfile.create({
        data: {
          id: "default",
          name: "Pusat Kegiatan Belajar Masyarakat (PKBM) Askara",
          operationalPermit: "Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP",
          npsn: "P9998766",
          address: "Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung",
          phone: "(022) 87518584 / 085156560630",
          email: "pkbm.askara@gmail.com",
          website: "www.pkbmaskara.sch.id",
          postalCode: "40296",
          village: "Rancabolang",
          district: "Gedebage",
          city: "Kota Bandung",
          province: "Jawa Barat",
          logoUrl: "/logo.png",
          headmasterName: "Prof. Arif Syarifudin, S.Pd.",
          headmasterNip: "19750914 200003 2 001",
          defaultHomeroomTeacher: "Drs. Hendra Gunawan",
          defaultHomeroomNip: "19800412 200501 1 003",
          reportPlaceDate: "Bandung, 13 Agustus 2026",
          academicYear: "2025/2026",
          semester: "GANJIL",
          curriculumName: "Kurikulum Merdeka Pendidikan Kesetaraan",
        },
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching institution profile:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data profil lembaga" },
      { status: 500 }
    );
  }
}

// POST /api/rapor/institution
// Mengupdate profil kop surat, kepala sekolah, dan cover lembaga
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin"].includes(user.role)) {
      return NextResponse.json(
        { error: "Hanya Admin / Super Admin yang berhak mengubah identitas lembaga" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const profile = await db.institutionProfile.upsert({
      where: { id: "default" },
      update: {
        name: body.name,
        operationalPermit: body.operationalPermit,
        npsn: body.npsn,
        address: body.address,
        phone: body.phone,
        email: body.email,
        website: body.website,
        postalCode: body.postalCode,
        village: body.village,
        district: body.district,
        city: body.city,
        province: body.province,
        logoUrl: body.logoUrl || "/logo.png",
        headmasterName: body.headmasterName,
        headmasterNip: body.headmasterNip,
        defaultHomeroomTeacher: body.defaultHomeroomTeacher || "Drs. Hendra Gunawan",
        defaultHomeroomNip: body.defaultHomeroomNip || "19800412 200501 1 003",
        headmasterSignatureUrl: body.headmasterSignatureUrl,
        institutionStampUrl: body.institutionStampUrl,
        reportPlaceDate: body.reportPlaceDate,
        academicYear: body.academicYear,
        semester: body.semester,
        curriculumName: body.curriculumName,
      },
      create: {
        id: "default",
        name: body.name || "Pusat Kegiatan Belajar Masyarakat (PKBM) Askara",
        operationalPermit: body.operationalPermit || "Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP",
        npsn: body.npsn || "P9998766",
        address: body.address || "Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung",
        phone: body.phone || "(022) 87518584 / 085156560630",
        email: body.email || "pkbm.askara@gmail.com",
        website: body.website || "www.pkbmaskara.sch.id",
        postalCode: body.postalCode || "40296",
        village: body.village || "Rancabolang",
        district: body.district || "Gedebage",
        city: body.city || "Kota Bandung",
        province: body.province || "Jawa Barat",
        logoUrl: body.logoUrl || "/logo.png",
        headmasterName: body.headmasterName || "Prof. Arif Syarifudin, S.Pd.",
        headmasterNip: body.headmasterNip || "19750914 200003 2 001",
        defaultHomeroomTeacher: body.defaultHomeroomTeacher || "Drs. Hendra Gunawan",
        defaultHomeroomNip: body.defaultHomeroomNip || "19800412 200501 1 003",
        headmasterSignatureUrl: body.headmasterSignatureUrl,
        institutionStampUrl: body.institutionStampUrl,
        reportPlaceDate: body.reportPlaceDate || "Jakarta, 13 Agustus 2026",
        academicYear: body.academicYear || "2025/2026",
        semester: body.semester || "GANJIL",
        curriculumName: body.curriculumName || "Kurikulum Merdeka Pendidikan Kesetaraan",
      },
    });

    return NextResponse.json({ profile, message: "Kop surat & profil lembaga berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating institution profile:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data profil lembaga" },
      { status: 500 }
    );
  }
}
