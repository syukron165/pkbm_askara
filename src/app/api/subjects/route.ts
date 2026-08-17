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
  teacherName: string;
  description: string;
  syllabusUrl?: string | null;
  isActive: boolean;
}

export async function GET(request: Request) {
  try {
    const subjects = await db.subject.findMany({
      orderBy: { code: 'asc' }
    });
    
    // We mock some of the fields like teacherName and hoursPerWeek as they are not entirely present on the Subject model in DB (they are probably on ClassSchedule or a relation)
    // For simplicity of matching the existing UI we map it carefully.
    const mapped: SubjectItem[] = subjects.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      packetType: s.packetType,
      category: "UMUM", // Not on model, default
      skk: 3, // Not on model, default
      kkm: 75, // Not on model, default
      hoursPerWeek: 3, // Not on model, default
      teacherName: "Tim Pengajar", // Not on model, default
      description: s.description || "",
      isActive: true, // Not on model, default
    }));

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
      description,
    } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: "Kode dan Nama mata pelajaran wajib diisi" },
        { status: 400 }
      );
    }

    const newSubject = await db.subject.create({
      data: {
        code,
        name,
        packetType: packetType || "UMUM",
        description: description || null,
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
      description,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID wajib disertakan" },
        { status: 400 }
      );
    }

    const updated = await db.subject.update({
      where: { id },
      data: {
        code,
        name,
        packetType,
        description,
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
        { success: false, error: "Parameter ID wajib disertakan" },
        { status: 400 }
      );
    }

    await db.subject.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus mata pelajaran" },
      { status: 500 }
    );
  }
}
