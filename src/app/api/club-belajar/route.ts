import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/club-belajar
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  // Seed default study clubs if empty logic removed to clean dummy data

  const whereClause: any = {};
  if (category && category !== "SEMUA") whereClause.category = category;
  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { mentorName: { contains: search } },
      { location: { contains: search } },
    ];
  }

  const clubs = await db.studyClub.findMany({
    where: whereClause,
    include: {
      members: {
        include: {
          student: {
            include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } },
          },
        },
      },
      attendances: {
        orderBy: { meetingDate: "desc" },
        take: 5,
        include: {
          records: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clubs });
}

// POST /api/club-belajar
// Body: { name, category, description, visionGoals, mentorName, scheduleDay, scheduleTime, location, coverImage, maxMembers, isActive }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    category,
    description,
    visionGoals,
    mentorName,
    scheduleDay,
    scheduleTime,
    location,
    coverImage,
    maxMembers,
    isActive,
  } = body;

  if (!name || !category || !mentorName || !scheduleDay) {
    return NextResponse.json(
      { error: "Nama club, kategori, nama pembina, dan hari jadwal wajib diisi" },
      { status: 400 }
    );
  }

  const club = await db.studyClub.create({
    data: {
      name,
      category: category || "VOKASI",
      description: description || null,
      visionGoals: visionGoals || null,
      mentorName,
      scheduleDay,
      scheduleTime: scheduleTime || "14:00 - 16:00 WIB",
      location: location || "Ruang Kelas PKBM Askara",
      coverImage: coverImage || null,
      maxMembers: maxMembers ? parseInt(maxMembers) : 30,
      isActive: isActive ?? true,
    },
    include: {
      members: true,
      attendances: true,
    },
  });

  return NextResponse.json({ club }, { status: 201 });
}

// PATCH /api/club-belajar?id=xxx
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID club diperlukan" }, { status: 400 });

  const body = await req.json();
  const updated = await db.studyClub.update({
    where: { id },
    data: body,
    include: {
      members: true,
      attendances: true,
    },
  });

  return NextResponse.json({ club: updated });
}

// DELETE /api/club-belajar?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID club diperlukan" }, { status: 400 });

  await db.studyClub.delete({ where: { id } });
  return NextResponse.json({ message: "Club belajar berhasil dihapus" });
}
