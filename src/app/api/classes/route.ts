import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export interface ClassItem {
  id: string;
  name: string;
  level: "Paket A" | "Paket B" | "Paket C";
  academicYear: string;
  semester: "Ganjil" | "Genap";
  homeroom: string;
  homeroomNip?: string;
  room: string;
  capacity: number;
  studentsCount: number;
  studentsList: {
    id: string;
    nisn: string;
    name: string;
    gender: "L" | "P";
    phone: string;
  }[];
  description?: string;
}

let classesData: ClassItem[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const search = searchParams.get("search");

    let result = [...classesData];

    if (level && level !== "SEMUA") {
      result = result.filter((c) => c.level.toLowerCase() === level.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.homeroom.toLowerCase().includes(q) ||
          c.room.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error: any) {
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
    const { name, level, academicYear, semester, homeroom, room, capacity, description } = body;

    if (!name || !level || !homeroom) {
      return NextResponse.json(
        { success: false, error: "Nama kelas, jenjang paket, dan wali kelas wajib diisi" },
        { status: 400 }
      );
    }

    const newClass: ClassItem = {
      id: `cls-${Date.now()}`,
      name: name.trim(),
      level: level || "Paket C",
      academicYear: academicYear || "2025/2026",
      semester: semester || "Ganjil",
      homeroom: homeroom.trim(),
      room: room || "Ruang Belajar Askara",
      capacity: Number(capacity) || 30,
      studentsCount: 0,
      studentsList: [],
      description: description || "Rombongan belajar resmi PKBM Askara",
    };

    classesData.unshift(newClass);

    return NextResponse.json({
      success: true,
      message: "Kelas & Rombel baru berhasil ditambahkan",
      data: newClass,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan data kelas" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat mengubah kelas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, level, academicYear, semester, homeroom, room, capacity, description } = body;

    const index = classesData.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    classesData[index] = {
      ...classesData[index],
      name: name ? name.trim() : classesData[index].name,
      level: level || classesData[index].level,
      academicYear: academicYear || classesData[index].academicYear,
      semester: semester || classesData[index].semester,
      homeroom: homeroom ? homeroom.trim() : classesData[index].homeroom,
      room: room !== undefined ? room : classesData[index].room,
      capacity: capacity !== undefined ? Number(capacity) : classesData[index].capacity,
      description: description !== undefined ? description : classesData[index].description,
    };

    return NextResponse.json({
      success: true,
      message: "Data kelas & rombel berhasil diperbarui",
      data: classesData[index],
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
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat menghapus kelas." },
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

    const index = classesData.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    const removed = classesData.splice(index, 1)[0];

    return NextResponse.json({
      success: true,
      message: `Kelas ${removed.name} berhasil dihapus`,
      data: removed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus data kelas" },
      { status: 500 }
    );
  }
}
