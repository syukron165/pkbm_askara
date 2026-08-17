import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Public check-in (no auth required for POST from QR form)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      fullName,
      phone,
      address,
      institution,
      email,
      branchCode,
      branchName,
      purpose,
      purposeCategory,
      visitedPerson,
      visitedDept,
      photoUrl,
      notes,
    } = body;

    if (!fullName || !phone || !branchCode || !purpose) {
      return NextResponse.json(
        { error: "Nama, nomor telepon, cabang, dan tujuan wajib diisi." },
        { status: 400 }
      );
    }

    const visit = await prisma.guestVisit.create({
      data: {
        fullName,
        phone,
        address,
        institution,
        email,
        branchCode,
        branchName,
        purpose,
        purposeCategory,
        visitedPerson,
        visitedDept,
        photoUrl,
        notes,
        status: "CHECKED_IN",
        checkInAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        visitId: visit.id,
        eBadgeToken: visit.eBadgeToken,
        fullName: visit.fullName,
        checkInAt: visit.checkInAt,
        branchName: visit.branchName,
        visitedPerson: visit.visitedPerson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/buku-tamu error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchCode = searchParams.get("branchCode");
    const status = searchParams.get("status");
    const date = searchParams.get("date"); // YYYY-MM-DD
    const eBadgeToken = searchParams.get("token");

    // Public badge lookup by token
    if (eBadgeToken) {
      const visit = await prisma.guestVisit.findUnique({
        where: { eBadgeToken },
      });
      if (!visit) return NextResponse.json({ error: "Token tidak valid" }, { status: 404 });
      return NextResponse.json(visit);
    }

    const where: Record<string, unknown> = {};
    if (branchCode) where.branchCode = branchCode;
    if (status) where.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.checkInAt = { gte: start, lt: end };
    }

    const visits = await prisma.guestVisit.findMany({
      where,
      orderBy: { checkInAt: "desc" },
      take: 200,
    });

    // Dashboard stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const stats = {
      todayTotal: await prisma.guestVisit.count({
        where: { checkInAt: { gte: todayStart } },
      }),
      todayCheckedIn: await prisma.guestVisit.count({
        where: { checkInAt: { gte: todayStart }, status: "CHECKED_IN" },
      }),
      todayCheckedOut: await prisma.guestVisit.count({
        where: { checkInAt: { gte: todayStart }, status: "CHECKED_OUT" },
      }),
      allTimeTotal: await prisma.guestVisit.count(),
    };

    return NextResponse.json({ visits, stats });
  } catch (error) {
    console.error("GET /api/buku-tamu error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, eBadgeToken, action, notes } = body;

    let visit;
    if (eBadgeToken) {
      visit = await prisma.guestVisit.findUnique({ where: { eBadgeToken } });
    } else if (id) {
      visit = await prisma.guestVisit.findUnique({ where: { id } });
    }

    if (!visit) return NextResponse.json({ error: "Kunjungan tidak ditemukan" }, { status: 404 });

    if (action === "CHECK_OUT") {
      const updated = await prisma.guestVisit.update({
        where: { id: visit.id },
        data: { status: "CHECKED_OUT", checkOutAt: new Date(), notes },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/buku-tamu error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
