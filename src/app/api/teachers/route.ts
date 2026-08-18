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
    const { name, nip, role, email, phone, classes, specialization, address, joinDate, gender, birthPlace, birthDate } = body;
    
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
        isActive: true,
        emailVerified: true, // as admin creates it
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Data pendidik ${newUser.name} berhasil ditambahkan`, 
    });
  } catch (error: any) {
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
    const { id, name, nip, role, email, phone, classes, specialization, address, joinDate, status, gender, birthPlace, birthDate } = body;
    
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
        isActive: status === "AKTIF",
      }
    });

    return NextResponse.json({ success: true, message: "Data guru berhasil diperbarui" });
  } catch (error: any) {
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