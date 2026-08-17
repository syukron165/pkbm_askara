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
  joinDate?: string;
  photoUrl?: string;
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

    const result: TeacherItem[] = teachersDb.map(u => ({
      id: u.id,
      name: u.name,
      nip: undefined, // Prisma schema didn't have NIP for user, wait, let's just leave it empty for now
      role: "Tutor",
      email: u.email,
      phone: u.phone || "-",
      classes: u.homeroomClasses.length > 0 ? u.homeroomClasses.map(c => c.name).join(", ") : "-",
      status: u.isActive ? "AKTIF" : "NON-AKTIF",
      specialization: undefined,
      address: undefined,
      joinDate: u.createdAt.toISOString().split("T")[0],
      photoUrl: u.avatarUrl || undefined,
    }));

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
    const { name, nip, role, email, phone, classes, specialization, address, joinDate } = body;
    
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
    const { id, name, nip, role, email, phone, classes, specialization, address, joinDate, status } = body;
    
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data guru tidak ditemukan" }, { status: 404 });
    }

    await db.user.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        email: email ? email.trim().toLowerCase() : undefined,
        phone: phone !== undefined ? phone : undefined,
        isActive: status ? status === "AKTIF" : undefined,
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

    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Data guru berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus data guru" }, { status: 500 });
  }
}