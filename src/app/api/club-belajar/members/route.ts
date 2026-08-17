import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/club-belajar/members?clubId=xxx
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");
  if (!clubId) return NextResponse.json({ error: "clubId required" }, { status: 400 });

  const members = await db.studyClubMember.findMany({
    where: { clubId },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
          enrollments: {
            include: { class: { select: { id: true, name: true, level: true } } },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json({ members });
}

// POST /api/club-belajar/members
// Body: { clubId, studentId, role }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clubId, studentId, role } = body;

  if (!clubId || !studentId) {
    return NextResponse.json({ error: "clubId dan studentId diperlukan" }, { status: 400 });
  }

  const existing = await db.studyClubMember.findUnique({
    where: { clubId_studentId: { clubId, studentId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Siswa sudah terdaftar sebagai anggota club ini" }, { status: 400 });
  }

  const member = await db.studyClubMember.create({
    data: {
      clubId,
      studentId,
      role: role || "ANGGOTA",
    },
    include: {
      student: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}

// PATCH /api/club-belajar/members
// Body: { id, role, isActive }
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, role, isActive } = body;

  const member = await db.studyClubMember.update({
    where: { id },
    data: {
      role: role !== undefined ? role : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    },
  });

  return NextResponse.json({ member });
}

// DELETE /api/club-belajar/members?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID anggota diperlukan" }, { status: 400 });

  await db.studyClubMember.delete({ where: { id } });
  return NextResponse.json({ message: "Anggota berhasil dihapus dari club" });
}
