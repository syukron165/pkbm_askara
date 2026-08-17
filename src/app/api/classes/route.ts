import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface ClassItem {
  id: string;
  name: string;
  level: string;
  academicYear: string;
  semester: string;
  homeroom: string;
  homeroomTeacherId?: string;
  room: string;
  capacity: number;
  studentsCount: number;
  studentsList: {
    id: string;
    nisn: string;
    name: string;
    gender: string;
    phone: string;
  }[];
  description?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const search = searchParams.get("search");

    let whereClause: any = {};

    if (level && level !== "SEMUA") {
      whereClause.level = level;
    }

    if (search) {
      const q = search.toLowerCase();
      whereClause.name = { contains: q, mode: "insensitive" };
    }

    const classesDb = await db.class.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        homeroomTeacher: true,
        enrollments: {
          include: {
            student: {
              include: { user: true }
            }
          }
        }
      }
    });

    const result: ClassItem[] = classesDb.map(c => ({
      id: c.id,
      name: c.name,
      level: c.level,
      academicYear: c.academicYear,
      semester: c.semester,
      homeroom: c.homeroomTeacher?.name || "Belum Ditentukan",
      homeroomTeacherId: c.homeroomTeacherId || undefined,
      room: "Ruang Kelas", // Default room since it's not in schema
      capacity: 30, // Default capacity
      studentsCount: c.enrollments.length,
      studentsList: c.enrollments.map(e => ({
        id: e.student.id,
        nisn: e.student.nisn || "-",
        name: e.student.user.name,
        gender: e.student.gender || "L",
        phone: e.student.user.phone || "-",
      })),
      description: "",
    }));

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error: any) {
    console.error("GET /api/classes Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data kelas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat menambah kelas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, level, academicYear, semester, homeroomTeacherId } = body;

    if (!name || !level) {
      return NextResponse.json(
        { success: false, error: "Nama kelas dan jenjang paket wajib diisi" },
        { status: 400 }
      );
    }

    const newClass = await db.class.create({
      data: {
        name: name.trim(),
        level: level || "Paket C",
        academicYear: academicYear || "2025/2026",
        semester: semester || "Ganjil",
        homeroomTeacherId: homeroomTeacherId || null,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Kelas & Rombel baru berhasil ditambahkan",
      data: newClass,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambah kelas baru" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, level, academicYear, semester, homeroomTeacherId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID kelas wajib diisi" }, { status: 400 });
    }

    const existingClass = await db.class.findUnique({ where: { id } });
    if (!existingClass) {
      return NextResponse.json({ success: false, error: "Data kelas tidak ditemukan" }, { status: 404 });
    }

    await db.class.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        level: level || undefined,
        academicYear: academicYear || undefined,
        semester: semester || undefined,
        homeroomTeacherId: homeroomTeacherId || null,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Data kelas berhasil diperbarui",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui data kelas" },
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
      return NextResponse.json({ success: false, error: "ID kelas tidak valid" }, { status: 400 });
    }

    await db.class.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Data kelas berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus data kelas" },
      { status: 500 }
    );
  }
}
