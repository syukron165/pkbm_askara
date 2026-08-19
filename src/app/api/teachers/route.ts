import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function parseSafeDate(d: any): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function cleanNikValue(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (str === "" || str === "-" || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") {
    return null;
  }
  return str;
}

export interface TeacherItem {
  id: string;
  name: string;
  nip?: string;
  role: string;
  email: string;
  phone: string;
  classes: string;
  status: "AKTIF" | "NON-AKTIF";
  isDualRole?: boolean;
  managementPosition?: string;
  specialization?: string;
  address?: string;
  photoUrl?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  lastEducation?: string;
  universityName?: string;
  graduationYear?: string;
  experienceYears?: number;
  skills?: string;
  religion?: string;
  motherName?: string;
  maritalStatus?: string;
  socialMedia?: string;
  hobbies?: string;
  lifeMotto?: string;
  bankAccountNumber?: string;
  bankName?: string;
  educationStatus?: string;
  linkedinUrl?: string;
  cvResumeUrl?: string;
  ktpUrl?: string;
  kkUrl?: string;
  diplomaUrl?: string;
  transcriptUrl?: string;
  npwpUrl?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    let whereClause: any = {
      role: {
        in: ["pendidik", "pendidik,admin", "admin,pendidik"],
      },
    };

    if (status && status !== "SEMUA") {
      whereClause.isActive = status.toUpperCase() === "AKTIF";
    }

    if (search) {
      const q = search.toLowerCase();
      whereClause.AND = [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const teachersDb = await db.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        homeroomClasses: true,
      },
    });

    const userIds = teachersDb.map((u) => u.id);
    const registrations = await db.publicRegistration.findMany({
      where: { createdUserId: { in: userIds } },
    });

    const result: TeacherItem[] = teachersDb.map((u) => {
      const reg = registrations.find((r) => r.createdUserId === u.id);
      const isDualRole = u.role.includes("admin") && u.role.includes("pendidik");

      let teacherRole = reg?.positionApplied || (isDualRole ? "Tutor & Manajemen" : "Tutor");
      let managementPos = "";

      if (teacherRole && teacherRole.includes(" / ")) {
        const parts = teacherRole.split(" / ").map((s) => s.trim()).filter(Boolean);
        teacherRole = parts[0] || "Tutor";
        if (parts.length > 1) {
          managementPos = parts.slice(1).join(" / ");
        }
      }

      return {
        id: u.id,
        name: u.name,
        nip: u.nik || reg?.nik || undefined,
        role: teacherRole,
        managementPosition: managementPos || undefined,
        email: u.email,
        phone: u.phone || "-",
        classes: u.homeroomClasses.length > 0 ? u.homeroomClasses.map((c) => c.name).join(", ") : "-",
        status: u.isActive ? "AKTIF" : "NON-AKTIF",
        isDualRole,
        specialization: reg?.majorStudy || undefined,
        address: u.address || reg?.address || undefined,
        gender: u.gender || reg?.gender || undefined,
        birthPlace: u.birthPlace || reg?.birthPlace || undefined,
        birthDate: u.birthDate ? u.birthDate.toISOString().split("T")[0] : reg?.birthDate?.toISOString().split("T")[0] || undefined,
        joinDate: u.createdAt.toISOString().split("T")[0],
        photoUrl: u.avatarUrl || undefined,
        lastEducation: reg?.lastEducation || undefined,
        universityName: reg?.universityName || undefined,
        graduationYear: reg?.graduationYear || undefined,
        experienceYears: reg?.experienceYears || undefined,
        skills: reg?.skills || undefined,
        religion: reg?.religion || undefined,
        motherName: reg?.motherName || undefined,
        maritalStatus: reg?.maritalStatus || undefined,
        socialMedia: reg?.socialMedia || undefined,
        hobbies: reg?.hobbies || undefined,
        lifeMotto: reg?.lifeMotto || undefined,
        bankAccountNumber: reg?.bankAccountNumber || undefined,
        bankName: reg?.bankName || undefined,
        educationStatus: reg?.educationStatus || undefined,
        linkedinUrl: reg?.linkedinUrl || undefined,
        cvResumeUrl: reg?.cvResumeUrl || undefined,
        ktpUrl: reg?.ktpUrl || undefined,
        kkUrl: reg?.kkUrl || undefined,
        diplomaUrl: reg?.diplomaUrl || undefined,
        transcriptUrl: reg?.transcriptUrl || undefined,
        npwpUrl: reg?.npwpUrl || undefined,
      };
    });

    return NextResponse.json({ success: true, total: result.length, data: result });
  } catch (error: any) {
    console.error("GET /api/teachers Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat data guru" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }
    const body = await request.json();
    const {
      isDualRole,
      managementPosition,
      name,
      nip,
      role,
      email,
      phone,
      classes,
      specialization,
      address,
      city,
      province,
      joinDate,
      gender,
      birthPlace,
      birthDate,
      photoUrl,
      lastEducation,
      educationStatus,
      universityName,
      graduationYear,
      experienceYears,
      skills,
      religion,
      motherName,
      maritalStatus,
      linkedinUrl,
      socialMedia,
      hobbies,
      lifeMotto,
      bankName,
      bankAccountNumber,
    } = body;
    
    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Nama dan email wajib diisi" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: `Email ${cleanEmail} sudah terdaftar!` }, { status: 400 });
    }

    const cleanNik = cleanNikValue(nip);
    if (cleanNik) {
      const existingNik = await db.user.findUnique({ where: { nik: cleanNik } });
      if (existingNik) {
        return NextResponse.json({
          success: false,
          error: `NIK / NIP "${cleanNik}" sudah terdaftar pada pengguna lain (${existingNik.name}).`
        }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash("askara123", 10); // default password
    const assignedRole = isDualRole ? "pendidik,admin" : "pendidik";
    const safeBirthDate = parseSafeDate(birthDate);

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: assignedRole,
        phone: phone?.trim() || null,
        nik: cleanNik,
        gender: gender || null,
        birthPlace: birthPlace?.trim() || null,
        birthDate: safeBirthDate,
        address: address?.trim() || null,
        avatarUrl: photoUrl?.trim() || null,
        isActive: true,
        emailVerified: true,
      }
    });

    const cleanRole = role ? role.trim() : "Tutor";
    const cleanManagementPos = managementPosition ? managementPosition.trim() : "";
    let displayRole = cleanRole;
    if (isDualRole && cleanManagementPos && cleanManagementPos !== cleanRole) {
      displayRole = `${cleanRole} / ${cleanManagementPos}`;
    }

    await db.publicRegistration.create({
      data: {
        registrationNumber: `REG-TUTOR-${Date.now()}`,
        type: "TUTOR",
        fullName: name.trim(),
        email: cleanEmail,
        phone: phone?.trim() || null,
        nik: cleanNik,
        gender: gender || null,
        birthPlace: birthPlace?.trim() || null,
        birthDate: safeBirthDate,
        positionApplied: displayRole,
        address: address?.trim() || null,
        city: city?.trim() || null,
        province: province?.trim() || null,
        majorStudy: specialization?.trim() || null,
        lastEducation: lastEducation?.trim() || null,
        educationStatus: educationStatus?.trim() || null,
        universityName: universityName?.trim() || null,
        graduationYear: graduationYear?.trim() || null,
        experienceYears: experienceYears ? Number(experienceYears) : null,
        skills: skills?.trim() || null,
        religion: religion?.trim() || null,
        motherName: motherName?.trim() || null,
        maritalStatus: maritalStatus?.trim() || null,
        linkedinUrl: linkedinUrl?.trim() || null,
        socialMedia: socialMedia ? (typeof socialMedia === "string" ? socialMedia : JSON.stringify(socialMedia)) : null,
        hobbies: hobbies?.trim() || null,
        lifeMotto: lifeMotto?.trim() || null,
        bankName: bankName?.trim() || null,
        bankAccountNumber: bankAccountNumber?.trim() || null,
        avatarUrl: photoUrl?.trim() || null,
        cvResumeUrl: body.cvResumeUrl?.trim() || null,
        ktpUrl: body.ktpUrl?.trim() || null,
        kkUrl: body.kkUrl?.trim() || null,
        diplomaUrl: body.diplomaUrl?.trim() || null,
        transcriptUrl: body.transcriptUrl?.trim() || null,
        npwpUrl: body.npwpUrl?.trim() || null,
        status: "APPROVED",
        createdUserId: newUser.id,
        verifiedById: user.id,
        verifiedAt: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Data pendidik ${newUser.name} berhasil ditambahkan ${isDualRole ? "(Merangkap Manajemen)" : ""}`, 
    });
  } catch (error: any) {
    console.error("POST /api/teachers Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan data guru" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }
    const body = await request.json();
    const {
      id,
      isDualRole,
      managementPosition,
      name,
      nip,
      role,
      email,
      phone,
      classes,
      specialization,
      address,
      city,
      province,
      joinDate,
      status,
      gender,
      birthPlace,
      birthDate,
      photoUrl,
      lastEducation,
      educationStatus,
      universityName,
      graduationYear,
      experienceYears,
      skills,
      religion,
      motherName,
      maritalStatus,
      linkedinUrl,
      socialMedia,
      hobbies,
      lifeMotto,
      bankName,
      bankAccountNumber,
      cvResumeUrl,
      ktpUrl,
      kkUrl,
      diplomaUrl,
      transcriptUrl,
      npwpUrl,
    } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "ID pendidik wajib diisi" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data pendidik tidak ditemukan" }, { status: 404 });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    if (cleanEmail && cleanEmail !== existing.email.toLowerCase()) {
      const emailTaken = await db.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: id },
        },
      });
      if (emailTaken) {
        return NextResponse.json({ success: false, error: `Email ${cleanEmail} sudah dipakai oleh pengguna lain.` }, { status: 400 });
      }
    }

    const cleanNik = cleanNikValue(nip);
    if (cleanNik) {
      const existingNik = await db.user.findFirst({
        where: {
          nik: cleanNik,
          id: { not: id },
        },
      });
      if (existingNik) {
        return NextResponse.json({
          success: false,
          error: `NIK / NIP "${cleanNik}" sudah terdaftar pada pengguna lain (${existingNik.name}).`
        }, { status: 400 });
      }
    }

    const updatedRole =
      isDualRole !== undefined
        ? isDualRole
          ? "pendidik,admin"
          : "pendidik"
        : undefined;

    const safeBirthDate = birthDate !== undefined ? parseSafeDate(birthDate) : undefined;
    const isTeacherActive = status ? status.toUpperCase() === "AKTIF" : existing.isActive;

    await db.user.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        email: cleanEmail,
        role: updatedRole,
        phone: phone !== undefined ? (phone.trim() === "" ? null : phone.trim()) : undefined,
        nik: cleanNik, // null if empty, ensuring unique constraint never collides on empty string
        gender: gender !== undefined ? gender : undefined,
        birthPlace: birthPlace !== undefined ? birthPlace.trim() : undefined,
        birthDate: safeBirthDate,
        address: address !== undefined ? address.trim() : undefined,
        avatarUrl: photoUrl !== undefined ? photoUrl.trim() : undefined,
        isActive: isTeacherActive,
      }
    });

    const cleanRole = role ? role.trim() : "Tutor";
    const cleanManagementPos = managementPosition ? managementPosition.trim() : "";
    let targetRoleText = cleanRole;
    if (isDualRole && cleanManagementPos && cleanManagementPos !== cleanRole) {
      targetRoleText = `${cleanRole} / ${cleanManagementPos}`;
    }

    const existingReg = await db.publicRegistration.findFirst({ where: { createdUserId: id } });

    if (existingReg) {
      await db.publicRegistration.update({
        where: { id: existingReg.id },
        data: {
          fullName: name ? name.trim() : undefined,
          email: cleanEmail,
          phone: phone !== undefined ? (phone.trim() === "" ? null : phone.trim()) : undefined,
          nik: cleanNik,
          gender: gender !== undefined ? gender : undefined,
          birthPlace: birthPlace !== undefined ? birthPlace : undefined,
          birthDate: safeBirthDate,
          positionApplied: targetRoleText,
          address: address !== undefined ? address : undefined,
          city: city !== undefined ? city : undefined,
          province: province !== undefined ? province : undefined,
          majorStudy: specialization !== undefined ? specialization : undefined,
          lastEducation: lastEducation !== undefined ? lastEducation : undefined,
          educationStatus: educationStatus !== undefined ? educationStatus : undefined,
          universityName: universityName !== undefined ? universityName : undefined,
          graduationYear: graduationYear !== undefined ? graduationYear : undefined,
          experienceYears: experienceYears !== undefined && experienceYears !== "" ? Number(experienceYears) : undefined,
          skills: skills !== undefined ? skills : undefined,
          religion: religion !== undefined ? religion : undefined,
          motherName: motherName !== undefined ? motherName : undefined,
          maritalStatus: maritalStatus !== undefined ? maritalStatus : undefined,
          linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
          socialMedia: socialMedia !== undefined ? (typeof socialMedia === "string" ? socialMedia : JSON.stringify(socialMedia)) : undefined,
          hobbies: hobbies !== undefined ? hobbies : undefined,
          lifeMotto: lifeMotto !== undefined ? lifeMotto : undefined,
          bankName: bankName !== undefined ? bankName : undefined,
          bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : undefined,
          avatarUrl: photoUrl !== undefined ? photoUrl : undefined,
          cvResumeUrl: cvResumeUrl !== undefined ? cvResumeUrl : undefined,
          ktpUrl: ktpUrl !== undefined ? ktpUrl : undefined,
          kkUrl: kkUrl !== undefined ? kkUrl : undefined,
          diplomaUrl: diplomaUrl !== undefined ? diplomaUrl : undefined,
          transcriptUrl: transcriptUrl !== undefined ? transcriptUrl : undefined,
          npwpUrl: npwpUrl !== undefined ? npwpUrl : undefined,
        }
      });
    } else {
      await db.publicRegistration.create({
        data: {
          registrationNumber: `REG-TUTOR-${Date.now()}`,
          type: "TUTOR",
          fullName: name ? name.trim() : existing.name,
          email: cleanEmail || existing.email,
          phone: phone !== undefined ? (phone.trim() === "" ? null : phone.trim()) : existing.phone,
          nik: cleanNik,
          gender: gender !== undefined ? gender : existing.gender,
          birthPlace: birthPlace !== undefined ? birthPlace : existing.birthPlace,
          birthDate: safeBirthDate || existing.birthDate,
          positionApplied: targetRoleText || "Tutor",
          address: address !== undefined ? address : existing.address,
          city: city || null,
          province: province || null,
          majorStudy: specialization || null,
          lastEducation: lastEducation || null,
          educationStatus: educationStatus || null,
          universityName: universityName || null,
          graduationYear: graduationYear || null,
          experienceYears: experienceYears ? Number(experienceYears) : null,
          skills: skills || null,
          religion: religion || null,
          motherName: motherName || null,
          maritalStatus: maritalStatus || null,
          linkedinUrl: linkedinUrl || null,
          socialMedia: socialMedia ? (typeof socialMedia === "string" ? socialMedia : JSON.stringify(socialMedia)) : null,
          hobbies: hobbies || null,
          lifeMotto: lifeMotto || null,
          bankName: bankName || null,
          bankAccountNumber: bankAccountNumber || null,
          avatarUrl: photoUrl || existing.avatarUrl,
          cvResumeUrl: cvResumeUrl || null,
          ktpUrl: ktpUrl || null,
          kkUrl: kkUrl || null,
          diplomaUrl: diplomaUrl || null,
          transcriptUrl: transcriptUrl || null,
          npwpUrl: npwpUrl || null,
          status: "APPROVED",
          createdUserId: id,
          verifiedById: user.id,
          verifiedAt: new Date(),
        }
      });
    }

    return NextResponse.json({ success: true, message: `Data pendidik ${name || existing.name} berhasil diperbarui` });
  } catch (error: any) {
    console.error("PUT /api/teachers Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui data guru" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID guru tidak valid" }, { status: 400 });
    }

    await db.user.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: "Data guru berhasil dinonaktifkan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menonaktifkan data guru" }, { status: 500 });
  }
}