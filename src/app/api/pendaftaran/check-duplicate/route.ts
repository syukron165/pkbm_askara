import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nik = searchParams.get("nik")?.trim();
    const nisn = searchParams.get("nisn")?.trim();
    const email = searchParams.get("email")?.trim()?.toLowerCase();

    // Check NIK
    if (nik && nik.length >= 10) {
      const existingStudentNik = await db.student.findFirst({
        where: { nik: nik },
      });
      if (existingStudentNik) {
        return NextResponse.json({
          duplicate: true,
          field: "nik",
          message: `NIK ${nik} sudah terdaftar sebagai siswa aktif di PKBM Askara.`,
        });
      }

      const existingRegNik = await db.publicRegistration.findFirst({
        where: {
          nik: nik,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });
      if (existingRegNik) {
        return NextResponse.json({
          duplicate: true,
          field: "nik",
          message: `NIK ${nik} sudah terdaftar dalam antrean pendaftaran (${existingRegNik.registrationNumber}).`,
        });
      }
    }

    // Check NISN
    if (nisn && nisn.length >= 8) {
      const existingStudentNisn = await db.student.findFirst({
        where: { nisn: nisn },
      });
      if (existingStudentNisn) {
        return NextResponse.json({
          duplicate: true,
          field: "nisn",
          message: `NISN ${nisn} sudah terdaftar di sistem PKBM Askara.`,
        });
      }

      const existingRegNisn = await db.publicRegistration.findFirst({
        where: {
          nisn: nisn,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });
      if (existingRegNisn) {
        return NextResponse.json({
          duplicate: true,
          field: "nisn",
          message: `NISN ${nisn} sudah pernah didaftarkan (${existingRegNisn.registrationNumber}).`,
        });
      }
    }

    // Check Email
    if (email && email.includes("@")) {
      const existingUserEmail = await db.user.findUnique({
        where: { email: email },
      });
      if (existingUserEmail) {
        return NextResponse.json({
          duplicate: true,
          field: "email",
          message: `Email ${email} sudah memiliki akun aktif di portal sekolah.`,
        });
      }
    }

    return NextResponse.json({
      duplicate: false,
      message: "Data valid dan belum terdaftar.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { duplicate: false, error: error.message },
      { status: 200 }
    );
  }
}
