import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export interface TeacherItem {
  id: string;
  name: string;
  nip?: string;
  role: string;
  email: string;
  phone: string;
  classes: string;
  status: "AKTIF" | "NON-AKTIF";
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

    let whereClause: any = { role: "pendidik" };

    if (status && status !== "SEMUA") {
      whereClause.isActive = status.toUpperCase() === "AKTIF";
    }

    if (search) {
      const q = search.toLowerCase();
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const teachersDb = await db.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        homeroomClasses: true, // Untuk melihat class apa saja yang dipegang sebagai homeroom
      }
    });

    const userIds = teachersDb.map(u => u.id);
    const registrations = await db.publicRegistration.findMany({
      where: { createdUserId: { in: userIds } }
    });

    const result: TeacherItem[] = teachersDb.map(u => {
      const reg = registrations.find(r => r.createdUserId === u.id);
      return {
        id: u.id,
        name: u.name,
        nip: u.nik || reg?.nik || undefined,
        role: reg?.positionApplied || "Tutor",
        email: u.email,
        phone: u.phone || "-",
        classes: u.homeroomClasses.length > 0 ? u.homeroomClasses.map(c => c.name).join(", ") : "-",
        status: u.isActive ? "AKTIF" : "NON-AKTIF",
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

    const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: `Email ${email} sudah terdaftar!` }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash("askara123", 10); // default password

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "pendidik",
        phone: phone?.trim() || null,
        nik: nip?.trim() || null,
        gender: gender || null,
        birthPlace: birthPlace?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address?.trim() || null,
        avatarUrl: photoUrl?.trim() || null,
        isActive: true,
        emailVerified: true, // as admin creates it
      }
    });

    await db.publicRegistration.create({
      data: {
        registrationNumber: `REG-TUTOR-${Date.now()}`,
        type: "TUTOR",
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        nik: nip?.trim() || null,
        gender: gender || null,
        birthPlace: birthPlace?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        positionApplied: role?.trim() || "Tutor",
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
      message: `Data pendidik ${newUser.name} berhasil ditambahkan`, 
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
    
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data guru tidak ditemukan" }, { status: 404 });
    }

    await db.user.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        email: email ? email.trim().toLowerCase() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        nik: nip !== undefined ? nip.trim() : undefined,
        gender: gender !== undefined ? gender : undefined,
        birthPlace: birthPlace !== undefined ? birthPlace.trim() : undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        address: address !== undefined ? address.trim() : undefined,
        avatarUrl: photoUrl !== undefined ? photoUrl.trim() : undefined,
        isActive: status === "AKTIF",
      }
    });

    const existingReg = await db.publicRegistration.findFirst({ where: { createdUserId: id } });
    if (existingReg) {
      await db.publicRegistration.update({
        where: { id: existingReg.id },
        data: {
          fullName: name ? name.trim() : undefined,
          email: email ? email.trim().toLowerCase() : undefined,
          phone: phone !== undefined ? phone : undefined,
          nik: nip !== undefined ? nip : undefined,
          gender: gender !== undefined ? gender : undefined,
          birthPlace: birthPlace !== undefined ? birthPlace : undefined,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          positionApplied: role !== undefined ? role : undefined,
          address: address !== undefined ? address : undefined,
          city: city !== undefined ? city : undefined,
          province: province !== undefined ? province : undefined,
          majorStudy: specialization !== undefined ? specialization : undefined,
          lastEducation: lastEducation !== undefined ? lastEducation : undefined,
          educationStatus: educationStatus !== undefined ? educationStatus : undefined,
          universityName: universityName !== undefined ? universityName : undefined,
          graduationYear: graduationYear !== undefined ? graduationYear : undefined,
          experienceYears: experienceYears !== undefined ? Number(experienceYears) : undefined,
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
    }

    return NextResponse.json({ success: true, message: "Data guru berhasil diperbarui" });
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