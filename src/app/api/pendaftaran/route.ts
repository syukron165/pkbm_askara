import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import {
  createPublicRegistration,
  findPublicRegistrations,
  findPublicRegistrationById,
  updatePublicRegistration,
  countRegistrationsByType,
  calculateDetailedAge,
  getIncomeDecile,
} from "@/lib/public-registration-db";

// POST /api/pendaftaran - Public Registration Submission (No auth required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = "SISWA", // "SISWA" | "TUTOR" | "MANAJEMEN"
      fullName,
      nik,
      nisn,
      email,
      phone,
      gender,
      birthPlace,
      birthDate,
      address,
      rtRw,
      kelurahan,
      kecamatan,
      city = "Kota Bandung",
      province = "Jawa Barat",
      postalCode,
      // Khusus Siswa
      packetType,
      registrationTrack = "REGULER",
      previousSchool,
      parentName,
      parentPhone,
      parentJob,
      parentIncome,
      // Khusus Tutor & Manajemen
      positionApplied,
      lastEducation,
      majorStudy,
      experienceYears = 0,
      skills,
      linkedinUrl,
      // Berkas URL
      avatarUrl,
      ktpUrl,
      kkUrl,
      birthCertUrl,
      diplomaUrl,
      transcriptUrl,
      npwpUrl,
      cvResumeUrl,
    } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Nama lengkap pendaftar wajib diisi" }, { status: 400 });
    }

    if (type === "SISWA" && !packetType) {
      return NextResponse.json({ error: "Pilihan jenjang paket (Paket A / B / C) wajib dipilih" }, { status: 400 });
    }

    // Auto-calculate age and decile
    const calculatedAge = calculateDetailedAge(birthDate);
    const parsedIncome = parentIncome ? parseFloat(parentIncome) : null;
    const incomeDecile = type === "SISWA" ? getIncomeDecile(parsedIncome) : null;

    // Generate unique registration number
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const regCount = await countRegistrationsByType(type);
    const seq = String(regCount + 1).padStart(4, "0");
    const registrationNumber = `REG-${type.toUpperCase()}-${yearMonth}-${seq}`;

    const newRegistration = await createPublicRegistration({
      registrationNumber,
      type: type.toUpperCase(),
      fullName: fullName.trim(),
      nik: nik?.trim() || null,
      nisn: nisn?.trim() || null,
      email: email?.trim()?.toLowerCase() || null,
      phone: phone?.trim() || null,
      gender: gender || null,
      birthPlace: birthPlace?.trim() || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      calculatedAge,
      address: address?.trim() || null,
      rtRw: rtRw?.trim() || null,
      kelurahan: kelurahan?.trim() || null,
      kecamatan: kecamatan?.trim() || null,
      city: city?.trim() || "Kota Bandung",
      province: province?.trim() || "Jawa Barat",
      postalCode: postalCode?.trim() || null,
      packetType: packetType || null,
      registrationTrack: registrationTrack || "REGULER",
      previousSchool: previousSchool?.trim() || null,
      parentName: parentName?.trim() || null,
      parentPhone: parentPhone?.trim() || null,
      parentJob: parentJob?.trim() || null,
      parentIncome: parsedIncome,
      incomeDecile,
      positionApplied: positionApplied?.trim() || null,
      lastEducation: lastEducation || null,
      majorStudy: majorStudy?.trim() || null,
      experienceYears: typeof experienceYears === "number" ? experienceYears : parseInt(experienceYears) || 0,
      skills: skills?.trim() || null,
      linkedinUrl: linkedinUrl?.trim() || null,
      avatarUrl: avatarUrl || null,
      ktpUrl: ktpUrl || null,
      kkUrl: kkUrl || null,
      birthCertUrl: birthCertUrl || null,
      diplomaUrl: diplomaUrl || null,
      transcriptUrl: transcriptUrl || null,
      npwpUrl: npwpUrl || null,
      cvResumeUrl: cvResumeUrl || null,
      status: "PENDING",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Pendaftaran berhasil dikirim dengan nomor registrasi ${registrationNumber}`,
        registration: newRegistration,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/pendaftaran] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses pendaftaran mandiri" },
      { status: 500 }
    );
  }
}

// GET /api/pendaftaran - Admin view and filtering
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const query = searchParams.get("q")?.toLowerCase() || "";

    const { registrations, totalPending, totalApproved, totalRevision, totalRejected } =
      await findPublicRegistrations({
        type,
        status,
        query,
      });

    return NextResponse.json({
      success: true,
      registrations,
      stats: {
        total: registrations.length,
        totalPending,
        totalApproved,
        totalRevision,
        totalRejected,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/pendaftaran] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memuat data antrean pendaftaran" },
      { status: 500 }
    );
  }
}

// PUT /api/pendaftaran - Admin Actions: Approve & Migrate to Master, Request Revision, Reject
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, note } = body; // action: "APPROVE" | "REVISION" | "REJECT"

    if (!id || !action) {
      return NextResponse.json({ error: "ID pendaftaran dan aksi wajib disediakan" }, { status: 400 });
    }

    const reg = await findPublicRegistrationById(id);

    if (!reg) {
      return NextResponse.json({ error: "Data pendaftaran tidak ditemukan" }, { status: 404 });
    }

    if (action === "REVISION") {
      const updated = await updatePublicRegistration(id, {
        status: "REVISION",
        revisionNote: note || "Harap lengkapi dan perbaiki berkas pendaftaran Anda.",
        verifiedById: user.id,
        verifiedAt: new Date(),
      });
      return NextResponse.json({
        success: true,
        message: "Status pendaftaran diubah menjadi Permintaan Revisi",
        registration: updated,
      });
    }

    if (action === "REJECT") {
      const updated = await updatePublicRegistration(id, {
        status: "REJECTED",
        rejectionReason: note || "Pendaftaran belum memenuhi persyaratan kualifikasi.",
        verifiedById: user.id,
        verifiedAt: new Date(),
      });
      return NextResponse.json({
        success: true,
        message: "Pendaftaran telah ditolak",
        registration: updated,
      });
    }

    if (action === "APPROVE") {
      // 1. Generate or check email & default password
      const defaultPassword = crypto.randomBytes(8).toString("hex"); // Acak password agar tidak bisa login tanpa verifikasi
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const generatedEmail =
        reg.email ||
        `${reg.fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${Date.now().toString().slice(-4)}@askara.sch.id`;

      let createdUser = await db.user.findUnique({
        where: { email: generatedEmail },
      });

      const userRole =
        reg.type === "SISWA"
          ? "siswa"
          : reg.type === "TUTOR"
          ? "pendidik"
          : "admin";

      const verificationToken = crypto.randomBytes(32).toString("hex");

      if (!createdUser) {
        createdUser = await db.user.create({
          data: {
            email: generatedEmail,
            passwordHash,
            name: reg.fullName,
            role: userRole,
            phone: reg.phone || null,
            avatarUrl: reg.avatarUrl || null,
            isActive: true,
            emailVerified: false,
            verificationToken: verificationToken,
          },
        });
        
        // Kirim email verifikasi setup password
        if (reg.email) {
          await sendVerificationEmail(reg.email, verificationToken, reg.fullName);
        }
      }

      // 2. If student, create / link student and parent profile
      if (reg.type === "SISWA") {
        let parentId: string | null = null;
        if (reg.parentName) {
          const parentEmail = `wali.${reg.fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${Date.now().toString().slice(-4)}@askara.sch.id`;
          const parentUser = await db.user.create({
            data: {
              email: parentEmail,
              passwordHash,
              name: reg.parentName,
              role: "orang_tua",
              phone: reg.parentPhone || null,
              isActive: true,
            },
          });

          const parentRecord = await db.parent.create({
            data: {
              userId: parentUser.id,
              relationship: "ORANG_TUA",
              job: reg.parentJob || null,
              address: reg.address || null,
            },
          });
          parentId = parentRecord.id;
        }

        // Check if student profile exists
        const existingStudent = await db.student.findUnique({
          where: { userId: createdUser.id },
        });

        if (!existingStudent) {
          await db.student.create({
            data: {
              userId: createdUser.id,
              nisn: reg.nisn || `00${Date.now().toString().slice(-8)}`,
              nik: reg.nik || null,
              gender: reg.gender || "L",
              birthPlace: reg.birthPlace || "Bandung",
              birthDate: reg.birthDate || new Date("2008-05-12"),
              address: reg.address || "Kota Bandung",
              packetType: reg.packetType || "Paket C",
              status: "ACTIVE",
              parentId: parentId,
            },
          });
        }
      }

      // 3. Mark Registration as APPROVED
      const updated = await updatePublicRegistration(id, {
        status: "APPROVED",
        createdUserId: createdUser.id,
        verifiedById: user.id,
        verifiedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `Pendaftaran ${reg.fullName} berhasil disetujui & diaktifkan sebagai ${userRole.toUpperCase()}!`,
        registration: updated,
        createdUser: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
        },
      });
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  } catch (error: any) {
    console.error("[PUT /api/pendaftaran] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses verifikasi pendaftaran" },
      { status: 500 }
    );
  }
}
  
// PATCH /api/pendaftaran - Super Admin Update Document  
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized. Hanya Super Admin yang dapat memperbaharui dokumen pendaftar." }, { status: 401 });
    }
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) {
      return NextResponse.json({ error: "ID pendaftaran wajib disediakan" }, { status: 400 });
    }
    const updated = await updatePublicRegistration(id, updateData);
    return NextResponse.json({ success: true, registration: updated });
  } catch (error: any) {
    console.error("[PATCH /api/pendaftaran] error:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbaharui dokumen" }, { status: 500 });
  }
}
