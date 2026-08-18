import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const month = searchParams.get("month"); // e.g. "2026-08"

    const where: any = {};
    if (category && category !== "SEMUA") {
      where.type = category.toUpperCase();
    }
    
    // Note: We use "type" in Prisma model which corresponds to "category" in frontend.
    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    let result = events.map(e => ({
      id: e.id,
      title: e.title,
      category: e.type,
      startDate: e.startDate.toISOString().split("T")[0],
      endDate: e.endDate.toISOString().split("T")[0],
      targetAudience: "Semua", // Can be added to DB if needed
      location: "-", // Can be added to DB if needed
      description: e.description || "",
      color: e.color || "emerald",
    }));

    if (month) {
      result = result.filter(
        (e) => e.startDate.startsWith(month) || e.endDate.startsWith(month)
      );
    }

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat agenda kalender" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat menambahkan agenda kalender." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, category, startDate, endDate, targetAudience, location, description } = body;

    if (!title || !category || !startDate) {
      return NextResponse.json(
        { success: false, error: "Judul, kategori, dan tanggal mulai wajib diisi" },
        { status: 400 }
      );
    }

    const categoryColors: Record<string, string> = {
      KBM: "emerald",
      ASESMEN: "blue",
      LIBUR: "rose",
      VOKASI: "purple",
      RAPOR: "indigo",
      RAPAT: "amber",
    };

    const newEvent = await prisma.calendarEvent.create({
      data: {
        title,
        type: category.toUpperCase(),
        startDate: new Date(startDate),
        endDate: new Date(endDate || startDate),
        description: `${description || ""}\nAudience: ${targetAudience || ""}\nLocation: ${location || ""}`,
        color: categoryColors[category.toUpperCase()] || "emerald",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Agenda kalender akademik berhasil ditambahkan",
      data: {
        ...newEvent,
        category: newEvent.type,
        startDate: newEvent.startDate.toISOString().split("T")[0],
        endDate: newEvent.endDate.toISOString().split("T")[0],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan agenda kalender" },
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
      return NextResponse.json({ success: false, error: "ID tidak ditemukan" }, { status: 400 });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Agenda berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus agenda kalender" },
      { status: 500 }
    );
  }
}
