import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  packetType: "Paket A" | "Paket B" | "Paket C" | "Vokasi & Keterampilan" | "Vokasi" | string;
  category: "UMUM" | "PEMINATAN" | "VOKASI" | "PEMBERDAYAAN" | string;
  skk: number;
  kkm: number;
  hoursPerWeek: number;
  teacherId?: string | null;
  teacherName: string;
  description: string;
  syllabusUrl?: string | null;
  isActive: boolean;
}

export async function GET(request: Request) {
  try {
    const subjects = await db.subject.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      },
      orderBy: { code: 'asc' }
    });
    
    const mapped: SubjectItem[] = subjects.map(s => {
      const resolvedTeacherName = s.teacherName && s.teacherName !== "Tim Pengajar"
        ? s.teacherName
        : s.teacher?.name || s.teacherName || "Tim Pengajar";

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        packetType: s.packetType,
        category: s.category || "UMUM",
        skk: s.skk ?? 3,
        kkm: s.kkm ?? 75,
        hoursPerWeek: s.hoursPerWeek ?? 3,
        teacherId: s.teacherId || s.teacher?.id || null,
        teacherName: resolvedTeacherName,
        description: s.description || "",
        isActive: s.isActive ?? true,
      };
    });

    return NextResponse.json({
      success: true,
      total: mapped.length,
      data: mapped,
    });
  } catch (error: any) {
    console.error("GET /api/subjects Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat mata pelajaran" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      name,
      packetType,
      category,
      skk,
      kkm,
      hoursPerWeek,
      teacherId,
      teacherName,
      description,
      isActive,
    } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: "Kode dan Nama mata pelajaran wajib diisi" },
        { status: 400 }
      );
    }

    // Resolve teacher ID if teacherName is provided
    let finalTeacherId = teacherId || null;
    let finalTeacherName = teacherName || "Tim Pengajar";

    if (finalTeacherName && (!finalTeacherId || finalTeacherId === "")) {
      const matchedTeacher = await db.user.findFirst({
        where: {
          name: { equals: finalTeacherName, mode: "insensitive" },
          role: "pendidik",
        }
      });
      if (matchedTeacher) {
        finalTeacherId = matchedTeacher.id;
        finalTeacherName = matchedTeacher.name;
      }
    } else if (finalTeacherId) {
      const matchedTeacher = await db.user.findUnique({
        where: { id: finalTeacherId }
      });
      if (matchedTeacher) {
        finalTeacherName = matchedTeacher.name;
      }
    }

    const newSubject = await db.subject.create({
      data: {
        code,
        name,
        packetType: packetType || "Paket A",
        category: category || "UMUM",
        skk: parseInt(String(skk || 3), 10),
        kkm: parseInt(String(kkm || 75), 10),
        hoursPerWeek: parseInt(String(hoursPerWeek || 3), 10),
        teacherId: finalTeacherId,
        teacherName: finalTeacherName,
        description: description || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        teacher: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil ditambahkan",
      data: newSubject,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambahkan mata pelajaran" },
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
    const {
      id,
      code,
      name,
      packetType,
      category,
      skk,
      kkm,
      hoursPerWeek,
      teacherId,
      teacherName,
      description,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID wajib disertakan" },
        { status: 400 }
      );
    }

    // Resolve teacher ID if teacherName is provided
    let finalTeacherId = teacherId !== undefined ? teacherId : null;
    let finalTeacherName = teacherName || "Tim Pengajar";

    if (finalTeacherName && (!finalTeacherId || finalTeacherId === "")) {
      const matchedTeacher = await db.user.findFirst({
        where: {
          name: { equals: finalTeacherName, mode: "insensitive" },
          role: "pendidik",
        }
      });
      if (matchedTeacher) {
        finalTeacherId = matchedTeacher.id;
        finalTeacherName = matchedTeacher.name;
      }
    } else if (finalTeacherId) {
      const matchedTeacher = await db.user.findUnique({
        where: { id: finalTeacherId }
      });
      if (matchedTeacher) {
        finalTeacherName = matchedTeacher.name;
      }
    }

    const updated = await db.subject.update({
      where: { id },
      data: {
        code,
        name,
        packetType,
        category: category || "UMUM",
        skk: parseInt(String(skk || 3), 10),
        kkm: parseInt(String(kkm || 75), 10),
        hoursPerWeek: parseInt(String(hoursPerWeek || 3), 10),
        teacherId: finalTeacherId,
        teacherName: finalTeacherName,
        description,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        teacher: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil diperbarui",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui mata pelajaran" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID Mata Pelajaran wajib disertakan." },
        { status: 400 }
      );
    }

    await db.subject.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/subjects Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus mata pelajaran" },
      { status: 500 }
    );
  }
}
