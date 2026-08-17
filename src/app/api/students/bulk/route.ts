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
    const { data } = body;

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
        const fullName = row.fullName || row["Nama Lengkap"];
        const email = row.email || row["Email"] || `${fullName?.replace(/\s+/g, '').toLowerCase() || 'siswa'}${Date.now().toString().slice(-4)}@siswa.askara.sch.id`;
        const phone = row.phone || row["No. Telepon"] || row["No HP"];
        const nik = row.nik || row["NIK"];
        const nisn = row.nisn || row["NISN"];
        const packetType = row.packetType || row["Program"] || row["Paket"] || "Paket C";
        const address = row.address || row["Alamat"];
        const gender = row.gender || row["Jenis Kelamin"];
        const birthPlace = row.birthPlace || row["Tempat Lahir"];
        const birthDate = row.birthDate || row["Tanggal Lahir"];
        const parentName = row.parentName || row["Nama Orang Tua"];
        const parentPhone = row.parentPhone || row["No. Telepon Orang Tua"];
        const currentGrade = row.currentGrade || row["Kelas"];

        if (!fullName || !nisn) {
          failCount++;
          errors.push(`Nama Lengkap dan NISN wajib ada. Ditemukan: ${JSON.stringify(row)}`);
          continue;
        }

        const existingStudentUser = await db.user.findUnique({ where: { email: email.toLowerCase() } });
        const existingStudentProfile = await db.student.findUnique({ where: { nisn } });

        if (existingStudentUser || existingStudentProfile) {
          failCount++;
          errors.push(`Email ${email} atau NISN ${nisn} sudah terdaftar.`);
          continue;
        }

        // 1. Create Student User
        const newUser = await db.user.create({
          data: {
            name: fullName.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            role: "siswa",
            phone: phone?.trim() || null,
            isActive: true,
            emailVerified: true,
          }
        });

        // 2. Create Parent if exists
        let parentId: string | null = null;
        if (parentName) {
           const parentEmail = `wali.${newUser.id}@askara.sch.id`;
           const parentUser = await db.user.create({
             data: {
               name: parentName.trim(),
               email: parentEmail,
               passwordHash,
               role: "orang_tua",
               phone: parentPhone?.trim() || null,
               isActive: true,
               emailVerified: true,
             }
           });
           const parentRecord = await db.parent.create({
             data: {
               userId: parentUser.id,
               relationship: "ORANG_TUA",
               address: address?.trim() || null,
             }
           });
           parentId = parentRecord.id;
        }

        // 3. Create Student Profile
        await db.student.create({
          data: {
            userId: newUser.id,
            nisn: nisn.trim(),
            nik: nik?.trim() || null,
            gender: gender || "L",
            birthPlace: birthPlace || "Bandung",
            birthDate: birthDate ? new Date(birthDate) : new Date("2005-01-01"),
            address: address || "Kota Bandung",
            packetType: packetType,
            status: "ACTIVE",
            parentId: parentId,
          }
        });

        // 4. Create PublicRegistration
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const regCount = await db.publicRegistration.count({ where: { type: "SISWA" } });
        const seq = String(regCount + 1).padStart(4, "0");
        const registrationNumber = `REG-SISWA-${yearMonth}-${seq}`;

        await db.publicRegistration.create({
          data: {
            registrationNumber,
            type: "SISWA",
            fullName: fullName.trim(),
            nik: nik?.trim() || null,
            nisn: nisn.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || null,
            gender: gender || null,
            birthPlace: birthPlace || null,
            birthDate: birthDate ? new Date(birthDate) : null,
            address: address || null,
            packetType: packetType,
            parentName: parentName || null,
            parentPhone: parentPhone || null,
            status: "APPROVED",
            createdUserId: newUser.id,
            verifiedById: user.id,
            verifiedAt: new Date(),
            currentGrade: currentGrade,
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
    console.error("[POST /api/students/bulk] error:", error);
    return NextResponse.json({ success: false, error: "Gagal memproses import data" }, { status: 500 });
  }
}
