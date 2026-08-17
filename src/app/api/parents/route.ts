import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export interface ParentItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  job?: string;
  address?: string;
  studentsCount: number;
  isActive: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let whereClause: any = {};

    if (search) {
      const q = search.toLowerCase();
      whereClause.user = {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const parentsDb = await db.parent.findMany({
      where: whereClause,
      include: {
        user: true,
        _count: {
          select: { students: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result: ParentItem[] = parentsDb.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.user.name,
      email: p.user.email,
      phone: p.user.phone || "-",
      relationship: p.relationship,
      job: p.job || undefined,
      address: p.address || p.user.address || undefined,
      studentsCount: p._count.students,
      isActive: p.user.isActive,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET /api/parents Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data orang tua" },
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
    const { name, email, phone, relationship, job, address } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Nama dan email wajib diisi" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Email ${email} sudah terdaftar!` },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash("askara123", 10); // default password

    const newParent = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "orang_tua",
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        isActive: true,
        emailVerified: true,
        parentProfile: {
          create: {
            relationship: relationship || "ORANG_TUA",
            job: job?.trim() || null,
            address: address?.trim() || null,
          },
        },
      },
      include: {
        parentProfile: true,
      },
    });

    return NextResponse.json({ success: true, data: newParent });
  } catch (error: any) {
    console.error("POST /api/parents Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambah orang tua" },
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
    const { id, userId, name, email, phone, relationship, job, address, isActive } = body;

    if (!id || !userId) {
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: {
          name: name ? name.trim() : undefined,
          email: email ? email.trim().toLowerCase() : undefined,
          phone: phone !== undefined ? phone.trim() : undefined,
          address: address !== undefined ? address.trim() : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
        },
      }),
      db.parent.update({
        where: { id },
        data: {
          relationship: relationship || undefined,
          job: job !== undefined ? job.trim() : undefined,
          address: address !== undefined ? address.trim() : undefined,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/parents Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengubah orang tua" },
      { status: 500 }
    );
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
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    const parent = await db.parent.findUnique({ where: { id } });
    if (!parent) {
      return NextResponse.json({ success: false, error: "Orang tua tidak ditemukan" }, { status: 404 });
    }

    await db.user.delete({ where: { id: parent.userId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/parents Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus orang tua" },
      { status: 500 }
    );
  }
}
