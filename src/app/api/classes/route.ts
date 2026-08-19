import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface ClassStudentItem {
  id: string; // Student id
  userId: string;
  nisn: string;
  name: string;
  gender: string;
  phone: string;
  packetType?: string;
  studyModel?: string;
  avatarUrl?: string | null;
}

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
  studentsList: ClassStudentItem[];
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
      room: "Ruang Kelas",
      capacity: 30,
      studentsCount: c.enrollments.length,
      studentsList: c.enrollments.map(e => ({
        id: e.student.id,
        userId: e.student.userId,
        nisn: e.student.nisn || "-",
        name: e.student.user.name,
        gender: e.student.gender || "L",
        phone: e.student.user.phone || "-",
        packetType: e.student.packetType,
        studyModel: e.student.studyModel || "Reguler",
        avatarUrl: e.student.user.avatarUrl,
      })),
      description: "",
    }));

    // Fetch all active students who currently have NO class enrollment
    const unassignedStudentsDb = await db.student.findMany({
      where: {
        status: { in: ["ACTIVE", "AKTIF"] },
        enrollments: { none: {} }
      },
      include: {
        user: true
      },
      orderBy: {
        user: { name: "asc" }
      }
    });

    const unassignedStudents: ClassStudentItem[] = unassignedStudentsDb.map(s => ({
      id: s.id,
      userId: s.userId,
      nisn: s.nisn || "-",
      name: s.user.name,
      gender: s.gender || "L",
      phone: s.user.phone || "-",
      packetType: s.packetType,
      studyModel: s.studyModel || "Reguler",
      avatarUrl: s.user.avatarUrl,
    }));

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
      unassignedStudents,
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
    const { name, level, academicYear, semester, homeroomTeacherId, studentIds } = body;

    if (!name || !level) {
      return NextResponse.json(
        { success: false, error: "Nama kelas dan jenjang paket wajib diisi" },
        { status: 400 }
      );
    }

    // 1. Create class
    const createdClass = await db.class.create({
      data: {
        name: name.trim(),
        level: level || "Paket C",
        academicYear: academicYear || "2025/2026",
        semester: semester || "Ganjil",
        homeroomTeacherId: homeroomTeacherId || null,
      }
    });

    // 2. Assign students in bulk
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const validStudentIds = Array.from(new Set(studentIds.filter(Boolean)));
      
      // Remove any prior enrollments to guarantee exactly 1 active class per student
      await db.classEnrollment.deleteMany({
        where: { studentId: { in: validStudentIds } }
      });

      await db.classEnrollment.createMany({
        data: validStudentIds.map((sId: string) => ({
          classId: createdClass.id,
          studentId: sId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Kelas & Rombel baru berhasil ditambahkan beserta daftar siswa terpilih",
      data: createdClass,
    });
  } catch (error: any) {
    console.error("POST /api/classes Error:", error);
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
    const { id, name, level, academicYear, semester, homeroomTeacherId, studentIds } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID kelas wajib diisi" }, { status: 400 });
    }

    const existingClass = await db.class.findUnique({ where: { id } });
    if (!existingClass) {
      return NextResponse.json({ success: false, error: "Data kelas tidak ditemukan" }, { status: 404 });
    }

    // 1. Update class meta info
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

    // 2. Update student enrollments fast & atomically
    if (Array.isArray(studentIds)) {
      const validStudentIds = Array.from(new Set(studentIds.filter(Boolean)));

      // Delete all existing enrollments for this class
      await db.classEnrollment.deleteMany({
        where: { classId: id }
      });

      if (validStudentIds.length > 0) {
        // Also remove selected students from any other classes to avoid duplicates
        await db.classEnrollment.deleteMany({
          where: { studentId: { in: validStudentIds } }
        });

        // Bulk insert all selected students in 1 single fast query
        await db.classEnrollment.createMany({
          data: validStudentIds.map((sId: string) => ({
            classId: id,
            studentId: sId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data kelas dan daftar siswa berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("PUT /api/classes Error:", error);
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
      message: "Data kelas berhasil dihapus. Siswa otomatis dikembalikan ke status belum ada kelas.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus data kelas" },
      { status: 500 }
    );
  }
}
