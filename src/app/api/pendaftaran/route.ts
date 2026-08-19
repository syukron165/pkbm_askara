import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail, sendRegistrationStatusEmail } from "@/lib/email";
import {
  createPublicRegistration,
  findPublicRegistrations,
  findPublicRegistrationById,
  updatePublicRegistration,
  countRegistrationsByType,
  calculateDetailedAge,
  getIncomeDecile,
} from "@/lib/public-registration-db";
import { broadcastNotificationToRole } from "@/lib/notifications";

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
      parentEmail,
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
      religion,
      motherName,
      educationStatus,
      maritalStatus,
      socialMedia,
      hobbies,
      lifeMotto,
      universityName,
      graduationYear,
      bankAccountNumber,
      bankName,
      numberOfSiblings,
      currentGrade,
      guardianName,
      motherJob,
      guardianJob,
      fatherIncome,
      motherIncome,
      heightCm,
      weightKg,
      medicalHistory,
      previousSchoolAddress,
      mutationFrom,
      parentKtpUrl,
      studyModel,
      mapsUrl,
      latitude,
      longitude,
      password,
    } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Nama lengkap pendaftar wajib diisi" }, { status: 400 });
    }

    if (type === "SISWA" && !packetType) {
      return NextResponse.json({ error: "Pilihan jenjang paket (Paket A / B / C) wajib dipilih" }, { status: 400 });
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password && typeof password === "string" && password.trim().length >= 6) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    } else {
      // Default fallback password hash
      const randomPass = crypto.randomBytes(8).toString("hex");
      passwordHash = await bcrypt.hash(randomPass, 10);
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

    // Target email
    const regEmail =
      email?.trim()?.toLowerCase() ||
      `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${Date.now().toString().slice(-4)}@askara.sch.id`;

    // Create inactive user with PENDING state for Single Flow authentication
    let createdPendingUserId: string | null = null;
    try {
      const userRole =
        type === "SISWA"
          ? "siswa"
          : type === "TUTOR"
          ? "pendidik"
          : type === "ORANG_TUA"
          ? "orang_tua"
          : "admin";

      let existingUser = await db.user.findUnique({
        where: { email: regEmail },
      });

      if (!existingUser) {
        const createdUser = await db.user.create({
          data: {
            email: regEmail,
            passwordHash: passwordHash,
            name: fullName.trim(),
            role: userRole,
            phone: phone?.trim() || null,
            nik: nik?.trim() || null,
            gender: gender || null,
            birthPlace: birthPlace?.trim() || null,
            birthDate: birthDate ? new Date(birthDate) : null,
            address: address?.trim() || null,
            avatarUrl: avatarUrl || null,
            isActive: false, // Inactive until approved by Admin/Kepala Sekolah
            emailVerified: false,
          },
        });
        createdPendingUserId = createdUser.id;
      } else {
        createdPendingUserId = existingUser.id;
      }
    } catch (errUser) {
      console.warn("Could not pre-create pending user:", errUser);
    }

    const newRegistration = await createPublicRegistration({
      registrationNumber,
      type: type.toUpperCase(),
      fullName: fullName.trim(),
      nik: nik?.trim() || null,
      nisn: nisn?.trim() || null,
      email: regEmail,
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
      studyModel: studyModel || "Reguler",
      registrationTrack: registrationTrack || "REGULER",
      mapsUrl: mapsUrl?.trim() || null,
      latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
      previousSchool: previousSchool?.trim() || null,
      parentName: parentName?.trim() || null,
      parentEmail: parentEmail?.trim()?.toLowerCase() || null,
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
      religion: religion?.trim() || null,
      motherName: motherName?.trim() || null,
      educationStatus: educationStatus?.trim() || null,
      maritalStatus: maritalStatus?.trim() || null,
      socialMedia: socialMedia || null,
      hobbies: hobbies?.trim() || null,
      lifeMotto: lifeMotto?.trim() || null,
      universityName: universityName?.trim() || null,
      graduationYear: graduationYear?.trim() || null,
      bankAccountNumber: bankAccountNumber?.trim() || null,
      bankName: bankName?.trim() || null,
      numberOfSiblings: numberOfSiblings !== undefined && numberOfSiblings !== "" ? parseInt(numberOfSiblings) : null,
      currentGrade: currentGrade || null,
      guardianName: guardianName?.trim() || null,
      motherJob: motherJob?.trim() || null,
      guardianJob: guardianJob?.trim() || null,
      fatherIncome: fatherIncome || null,
      motherIncome: motherIncome || null,
      heightCm: heightCm !== undefined && heightCm !== "" ? parseFloat(heightCm) : null,
      weightKg: weightKg !== undefined && weightKg !== "" ? parseFloat(weightKg) : null,
      medicalHistory: medicalHistory?.trim() || null,
      previousSchoolAddress: previousSchoolAddress?.trim() || null,
      mutationFrom: mutationFrom?.trim() || null,
      parentKtpUrl: parentKtpUrl || null,
      avatarUrl: avatarUrl || null,
      ktpUrl: ktpUrl || null,
      kkUrl: kkUrl || null,
      birthCertUrl: birthCertUrl || null,
      diplomaUrl: diplomaUrl || null,
      transcriptUrl: transcriptUrl || null,
      npwpUrl: npwpUrl || null,
      cvResumeUrl: cvResumeUrl || null,
      passwordHash: passwordHash,
      status: "PENDING",
      createdUserId: createdPendingUserId,
    });

    // Notify admins
    const notificationTitle = `Pendaftaran Baru: ${type.toUpperCase()}`;
    const notificationMessage = `${fullName} telah mendaftar sebagai ${type.toUpperCase()}.`;
    const actionUrl = "/admin/verifikasi-pendaftar";
    
    await broadcastNotificationToRole("super_admin", notificationTitle, notificationMessage, "INFO", actionUrl);
    await broadcastNotificationToRole("admin", notificationTitle, notificationMessage, "INFO", actionUrl);

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
      
      if (reg.email && updated) {
        await sendRegistrationStatusEmail(reg.email, reg.fullName, "REVISION", updated.revisionNote || note || "");
      }

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

      if (reg.email && updated) {
        await sendRegistrationStatusEmail(reg.email, reg.fullName, "REJECTED", updated.rejectionReason || note || "");
      }

      return NextResponse.json({
        success: true,
        message: "Pendaftaran telah ditolak",
        registration: updated,
      });
    }

    if (action === "APPROVE") {
      // 1. Generate or check email & default password
      const defaultPassword = crypto.randomBytes(8).toString("hex");
      const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
      const userPasswordHash = reg.passwordHash || defaultPasswordHash;

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
          : reg.type === "ORANG_TUA"
          ? "orang_tua"
          : "admin";

      if (!createdUser) {
        createdUser = await db.user.create({
          data: {
            email: generatedEmail,
            passwordHash: userPasswordHash,
            name: reg.fullName,
            role: userRole,
            phone: reg.phone || null,
            nik: reg.nik || null,
            gender: reg.gender || null,
            birthPlace: reg.birthPlace || null,
            birthDate: reg.birthDate ? new Date(reg.birthDate) : null,
            address: reg.address || null,
            avatarUrl: reg.avatarUrl || null,
            isActive: true, // Now fully active
            emailVerified: true,
          },
        });
      } else {
        // Activate existing pending user
        createdUser = await db.user.update({
          where: { id: createdUser.id },
          data: {
            isActive: true,
            emailVerified: true,
            role: userRole,
            passwordHash: reg.passwordHash || createdUser.passwordHash,
          },
        });
      }

      if (reg.email) {
        await sendRegistrationStatusEmail(
          reg.email,
          reg.fullName,
          "APPROVED",
          note || "Selamat bergabung di PKBM Askara! Akun Anda telah aktif dan siap digunakan untuk login."
        );
      }

      // 2. If student, create / link student and parent profile
      if (reg.type === "SISWA") {
        let parentId: string | null = null;
        const targetParentEmail =
          reg.parentEmail?.trim().toLowerCase() ||
          (reg.parentName
            ? `wali.${reg.fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${Date.now().toString().slice(-4)}@askara.sch.id`
            : null);

        if (targetParentEmail) {
          const existingParentUser = await db.user.findUnique({
            where: { email: targetParentEmail },
          });

          const isNewParent = !existingParentUser;

          const parentUser =
            existingParentUser ||
            (await db.user.create({
              data: {
                email: targetParentEmail,
                passwordHash: userPasswordHash,
                name: reg.parentName || "Orang Tua Siswa",
                role: "orang_tua",
                phone: reg.parentPhone || null,
                address: reg.address || null,
                isActive: true,
                emailVerified: true,
              },
            }));

          const existingParentRecord = await db.parent.findUnique({
            where: { userId: parentUser.id },
          });

          const parentRecord =
            existingParentRecord ||
            (await db.parent.create({
              data: {
                userId: parentUser.id,
                relationship: "ORANG_TUA",
                job: reg.parentJob || null,
                address: reg.address || null,
              },
            }));

          parentId = parentRecord.id;

          // Send activation email to parent if real email was provided
          if (reg.parentEmail) {
            try {
              await sendRegistrationStatusEmail(
                reg.parentEmail,
                reg.parentName || "Bapak/Ibu Orang Tua Siswa",
                "APPROVED",
                isNewParent
                  ? `Selamat! Pendaftaran putra/putri Anda (${reg.fullName}) di PKBM Askara telah disetujui. Akun Orang Tua Anda telah aktif dengan email login: ${targetParentEmail}. Silakan masuk ke portal login PKBM Askara untuk memantau nilai rapor, presensi, jadwal belajar, dan keuangan anak.`
                  : `Pendaftaran putra/putri Anda (${reg.fullName}) telah disetujui dan otomatis ditautkan ke akun Orang Tua Anda (${targetParentEmail}). Anda kini dapat memantau seluruh anak Anda dalam satu dashboard.`
              );
            } catch (errEmail) {
              console.warn("Could not send email to parent:", errEmail);
            }
          }
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
              birthDate: reg.birthDate ? new Date(reg.birthDate) : new Date("2008-05-12"),
              address: reg.address || "Kota Bandung",
              packetType: reg.packetType || "Paket C",
              studyModel: reg.studyModel || "Reguler",
              status: "ACTIVE",
              parentId: parentId,
            },
          });
        }
      } else if (reg.type === "ORANG_TUA") {
        // If parent registration approved, create/update parent profile and link child student
        let parentRecord = await db.parent.findUnique({
          where: { userId: createdUser.id },
        });

        if (!parentRecord) {
          parentRecord = await db.parent.create({
            data: {
              userId: createdUser.id,
              relationship: reg.positionApplied || "AYAH",
              job: reg.parentJob || null,
              address: reg.address || null,
            },
          });
        }

        // Try linking child student if child name or NISN is provided
        if (reg.parentName || reg.nisn) {
          const studentMatch = await db.student.findFirst({
            where: {
              OR: [
                ...(reg.nisn ? [{ nisn: reg.nisn }] : []),
                ...(reg.parentName ? [{ user: { name: { contains: reg.parentName, mode: "insensitive" as const } } }] : []),
              ],
            },
          });

          if (studentMatch) {
            await db.student.update({
              where: { id: studentMatch.id },
              data: { parentId: parentRecord.id },
            });
          }
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
