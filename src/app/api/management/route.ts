import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export interface ManagementPersonnel {
  id: string;
  name: string;
  nip?: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  status: "AKTIF" | "CUTI" | "NON-AKTIF";
  address?: string;
  joinDate?: string;
  skNumber?: string;
  photoUrl?: string;
  responsibilities?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  lastEducation?: string;
  majorStudy?: string;
  universityName?: string;
  graduationYear?: string;
  experienceYears?: number;
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
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    let whereClause: any = { role: { in: ["admin", "super_admin"] } };

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

    const adminUsers = await db.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });

    const adminIds = adminUsers.map(u => u.id);
    const adminRegs = await db.publicRegistration.findMany({
       where: { createdUserId: { in: adminIds } }
    });

    let result: ManagementPersonnel[] = adminUsers.map(u => {
      const reg = adminRegs.find(r => r.createdUserId === u.id);
      return {
        id: u.id,
        name: u.name,
        nip: reg?.nik || undefined,
        position: reg?.positionApplied || (u.role === "super_admin" ? "Super Admin" : "Staf Administrasi"),
        department: u.role === "super_admin" ? "Pimpinan & Struktural" : "Tata Usaha & HRD",
        email: u.email,
        phone: u.phone || "-",
        status: u.isActive ? "AKTIF" : "NON-AKTIF",
        address: u.address || reg?.address || undefined,
        joinDate: u.createdAt.toISOString().split("T")[0],
        skNumber: undefined,
        photoUrl: u.avatarUrl || undefined,
        responsibilities: reg?.skills || undefined,
        gender: u.gender || reg?.gender || undefined,
        birthPlace: u.birthPlace || reg?.birthPlace || undefined,
        birthDate: u.birthDate ? u.birthDate.toISOString().split("T")[0] : reg?.birthDate?.toISOString().split("T")[0] || undefined,
        lastEducation: reg?.lastEducation || undefined,
        majorStudy: reg?.majorStudy || undefined,
        universityName: reg?.universityName || undefined,
        graduationYear: reg?.graduationYear || undefined,
        experienceYears: reg?.experienceYears || undefined,
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
      };
    });

    if (department && department !== "SEMUA") {
      result = result.filter((m) => m.department.toLowerCase() === department.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
      stats: {
        total: result.length,
        active: result.filter((m) => m.status === "AKTIF").length,
        pimpinan: result.filter((m) => m.department.includes("Pimpinan") || m.department.includes("Akademik")).length,
        operasional: result.filter((m) => !m.department.includes("Pimpinan")).length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/management Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data manajemen" },
      { status: 500 }
    );
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
      position,
      department,
      email,
      phone,
      address,
      city,
      province,
      photoUrl,
      responsibilities,
      gender,
      birthPlace,
      birthDate,
      lastEducation,
      educationStatus,
      majorStudy,
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
      skNumber,
    } = body;

    if (!name || !position || !department) {
      return NextResponse.json(
        { success: false, error: "Nama, Jabatan, dan Departemen wajib diisi" },
        { status: 400 }
      );
    }

    const emailToUse = email?.trim().toLowerCase() || `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@askara.sch.id`;

    const existingUser = await db.user.findUnique({ where: { email: emailToUse } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: `Email ${emailToUse} sudah terdaftar!` }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash("askara123", 10);

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: emailToUse,
        passwordHash,
        role: department.includes("Pimpinan") ? "super_admin" : "admin",
        phone: phone?.trim() || null,
        nik: nip?.trim() || null,
        gender: gender || null,
        birthPlace: birthPlace?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address?.trim() || null,
        avatarUrl: photoUrl?.trim() || null,
        isActive: true,
        emailVerified: true,
      }
    });

    await db.publicRegistration.create({
      data: {
        registrationNumber: `REG-MANAJEMEN-${Date.now()}`,
        type: "MANAJEMEN",
        fullName: name.trim(),
        email: emailToUse,
        phone: phone?.trim() || null,
        nik: nip?.trim() || null,
        gender: gender || null,
        birthPlace: birthPlace?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        positionApplied: position.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        province: province?.trim() || null,
        lastEducation: lastEducation?.trim() || null,
        educationStatus: educationStatus?.trim() || null,
        majorStudy: majorStudy?.trim() || null,
        universityName: universityName?.trim() || null,
        graduationYear: graduationYear?.trim() || null,
        experienceYears: experienceYears ? Number(experienceYears) : null,
        skills: skills?.trim() || responsibilities?.trim() || null,
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
        status: "APPROVED",
        createdUserId: newUser.id,
        verifiedById: user.id,
        verifiedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: `Personel manajemen ${newUser.name} berhasil ditambahkan`,
    });
  } catch (error: any) {
    console.error("POST /api/management Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan data manajemen" },
      { status: 500 }
    );
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
      position,
      department,
      email,
      phone,
      status,
      address,
      city,
      province,
      photoUrl,
      responsibilities,
      gender,
      birthPlace,
      birthDate,
      lastEducation,
      educationStatus,
      majorStudy,
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

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data personel tidak ditemukan" }, { status: 404 });
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
        role: department ? (department.includes("Pimpinan") ? "super_admin" : "admin") : undefined,
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
          positionApplied: position !== undefined ? position : undefined,
          address: address !== undefined ? address : undefined,
          city: city !== undefined ? city : undefined,
          province: province !== undefined ? province : undefined,
          lastEducation: lastEducation !== undefined ? lastEducation : undefined,
          educationStatus: educationStatus !== undefined ? educationStatus : undefined,
          majorStudy: majorStudy !== undefined ? majorStudy : undefined,
          universityName: universityName !== undefined ? universityName : undefined,
          graduationYear: graduationYear !== undefined ? graduationYear : undefined,
          experienceYears: experienceYears !== undefined ? Number(experienceYears) : undefined,
          skills: skills !== undefined ? skills : responsibilities !== undefined ? responsibilities : undefined,
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
        }
      });
    }

    return NextResponse.json({ success: true, message: "Data personel berhasil diperbarui" });
  } catch (error: any) {
    console.error("PUT /api/management Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Hanya Super Admin yang dapat menonaktifkan." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID tidak ditemukan" }, { status: 400 });
    }

    await db.user.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: "Personel berhasil dinonaktifkan." });
  } catch (error: any) {
    console.error("DELETE /api/management Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menonaktifkan data" }, { status: 500 });
  }
}
