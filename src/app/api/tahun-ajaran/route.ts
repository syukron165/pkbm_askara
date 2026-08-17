import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear");
    const tab = searchParams.get("tab"); // "ppdb" | "aktif" | "alumni"
    const search = searchParams.get("search") || "";

    let statusFilter: string[] = [];
    if (tab === "ppdb") statusFilter = ["PENDING", "DITERIMA", "DITOLAK"];
    else if (tab === "aktif") statusFilter = ["AKTIF"];
    else if (tab === "alumni") statusFilter = ["LULUS", "DROPOUT", "MUTASI_KELUAR"];

    const where: Record<string, unknown> = {};
    if (academicYear) where.academicYear = academicYear;
    if (statusFilter.length > 0) where.status = { in: statusFilter };
    if (search) {
      where.OR = [
        { studentName: { contains: search } },
        { nisn: { contains: search } },
        { nik: { contains: search } },
      ];
    }

    const entries = await prisma.academicYearEntry.findMany({
      where,
      orderBy: { registrationDate: "desc" },
    });

    // Stats per year
    const allForYear = academicYear
      ? await prisma.academicYearEntry.findMany({ where: { academicYear } })
      : [];

    const stats = {
      total: allForYear.length,
      pending: allForYear.filter((e: { status: string }) => e.status === "PENDING").length,
      diterima: allForYear.filter((e: { status: string }) => e.status === "DITERIMA").length,
      ditolak: allForYear.filter((e: { status: string }) => e.status === "DITOLAK").length,
      aktif: allForYear.filter((e: { status: string }) => e.status === "AKTIF").length,
      lulus: allForYear.filter((e: { status: string }) => e.status === "LULUS").length,
      dropout: allForYear.filter((e: { status: string }) => e.status === "DROPOUT").length,
    };

    // Available academic years
    const years = await prisma.academicYearEntry.findMany({
      select: { academicYear: true },
      distinct: ["academicYear"],
      orderBy: { academicYear: "desc" },
    });

    return NextResponse.json({ entries, stats, years: years.map((y: { academicYear: string }) => y.academicYear) });
  } catch (error) {
    console.error("GET /api/tahun-ajaran error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const entry = await prisma.academicYearEntry.create({
      data: { ...body, recordedById: user.id },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/tahun-ajaran error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    const entry = await prisma.academicYearEntry.update({
      where: { id },
      data,
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PATCH /api/tahun-ajaran error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.academicYearEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tahun-ajaran error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
