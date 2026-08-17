import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }
    const body = await req.json();
    const { data } = body; // Array of objects

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: "Data kosong" }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    const defaultPassword = crypto.randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    for (const row of data) {
      try {
        // Map CSV fields to schema
        const fullName = row.fullName || row["Nama Lengkap"];
        const email = row.email || row["Email"];
        const phone = row.phone || row["No. Telepon"] || row["No HP"];
        const nik = row.nik || row["NIK"];
        const positionApplied = row.positionApplied || row["Jabatan"] || "Tutor";
        const majorStudy = row.majorStudy || row["Spesialisasi"] || row["Bidang Studi"];
        const address = row.address || row["Alamat"];
        const gender = row.gender || row["Jenis Kelamin"];
        const birthPlace = row.birthPlace || row["Tempat Lahir"];
        const birthDate = row.birthDate || row["Tanggal Lahir"];
        const lastEducation = row.lastEducation || row["Pendidikan Terakhir"];

        if (!fullName || !email) {
          failCount++;
          errors.push(`Nama Lengkap dan Email wajib ada. Ditemukan: ${JSON.stringify(row)}`);
          continue;
        }

        const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser) {
          failCount++;
          errors.push(`Email ${email} sudah terdaftar.`);
          continue;
        }

        // 1. Create User
        const newUser = await db.user.create({
          data: {
            name: fullName.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            role: "pendidik",
            phone: phone?.trim() || null,
            isActive: true,
            emailVerified: true,
          }
        });

        // 2. Create PublicRegistration (to store extra fields)
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const regCount = await db.publicRegistration.count({ where: { type: "TUTOR" } });
        const seq = String(regCount + 1).padStart(4, "0");
        const registrationNumber = `REG-TUTOR-${yearMonth}-${seq}`;

        await db.publicRegistration.create({
          data: {
            registrationNumber,
            type: "TUTOR",
            fullName: fullName.trim(),
            nik: nik?.trim() || null,
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || null,
            gender: gender || null,
            birthPlace: birthPlace || null,
            birthDate: birthDate ? new Date(birthDate) : null,
            address: address || null,
            positionApplied: positionApplied || "Tutor",
            majorStudy: majorStudy || null,
            lastEducation: lastEducation || null,
            status: "APPROVED",
            createdUserId: newUser.id,
            verifiedById: user.id,
            verifiedAt: new Date(),
          }
        });

        successCount++;
      } catch (err: any) {
        failCount++;
        errors.push(`Gagal memproses baris: ${JSON.stringify(row)} - ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import selesai. Berhasil: ${successCount}, Gagal: ${failCount}`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[POST /api/teachers/bulk] error:", error);
    return NextResponse.json({ success: false, error: "Gagal memproses import data" }, { status: 500 });
  }
}
