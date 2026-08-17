import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/club-belajar/attendance?clubId=xxx
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId") || undefined;

  const whereClause: any = {};
  if (clubId) whereClause.clubId = clubId;

  const attendances = await db.studyClubAttendance.findMany({
    where: whereClause,
    include: {
      club: {
        select: {
          id: true,
          name: true,
          category: true,
          mentorName: true,
          scheduleDay: true,
          scheduleTime: true,
        },
      },
      records: {
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      },
    },
    orderBy: { meetingDate: "desc" },
  });

  return NextResponse.json({ attendances });
}

// POST /api/club-belajar/attendance
// Body: { clubId, meetingDate, activityTitle, notes, documentationUrl, mediaType, records: [{ studentId, status, remarks }] }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    clubId,
    meetingDate,
    activityTitle,
    notes,
    documentationUrl,
    mediaType,
    records,
  } = body;

  if (!clubId || !meetingDate || !activityTitle) {
    return NextResponse.json(
      { error: "Club, tanggal pertemuan, dan topik aktivitas pertemuan wajib diisi" },
      { status: 400 }
    );
  }

  const attendance = await db.studyClubAttendance.create({
    data: {
      clubId,
      meetingDate: new Date(meetingDate),
      activityTitle,
      notes: notes || null,
      documentationUrl: documentationUrl || null,
      mediaType: mediaType || "IMAGE",
      records: {
        create:
          records && Array.isArray(records)
            ? records.map((r: any) => ({
                studentId: r.studentId,
                status: r.status || "HADIR",
                remarks: r.remarks || null,
              }))
            : [],
      },
    },
    include: {
      club: true,
      records: {
        include: { student: { include: { user: true } } },
      },
    },
  });

  return NextResponse.json({ attendance }, { status: 201 });
}

// DELETE /api/club-belajar/attendance?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID presensi pertemuan diperlukan" }, { status: 400 });

  await db.studyClubAttendance.delete({ where: { id } });
  return NextResponse.json({ message: "Data presensi pertemuan berhasil dihapus" });
}
