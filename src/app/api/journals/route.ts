import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/journals
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId") || undefined;
  const subjectId = searchParams.get("subjectId") || undefined;
  const teacherId = searchParams.get("teacherId") || undefined;
  const search = searchParams.get("search") || undefined;

  // Filter based on role:
  // If user is pendidik and didn't specify all=true, optionally filter to own journals, or allow viewing all
  const isTeacher = user.role === "pendidik";
  const ownOnly = searchParams.get("own") === "true";

  const whereClause: any = {};
  if (classId) whereClause.classId = classId;
  if (subjectId) whereClause.subjectId = subjectId;
  if (teacherId) whereClause.teacherId = teacherId;
  if (isTeacher && ownOnly) whereClause.teacherId = user.id;

  if (search) {
    whereClause.OR = [
      { topic: { contains: search } },
      { activities: { contains: search } },
      { notes: { contains: search } },
      { teacher: { name: { contains: search } } },
    ];
  }

  const journals = await db.teacherJournal.findMany({
    where: whereClause,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          role: true,
          avatarUrl: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          level: true,
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ journals });
}

// POST /api/journals
// Body: { classId, subjectId, date, topic, activities, notes, studentAttendanceCount, documentationUrl, mediaType }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    classId,
    subjectId,
    date,
    topic,
    activities,
    notes,
    studentAttendanceCount,
    documentationUrl,
    mediaType,
  } = body;

  if (!classId || !subjectId || !topic || !activities) {
    return NextResponse.json(
      { error: "Kelas, Mata Pelajaran, Topik, dan Aktivitas Belajar wajib diisi" },
      { status: 400 }
    );
  }

  const journal = await db.teacherJournal.create({
    data: {
      teacherId: user.id,
      classId,
      subjectId,
      date: date ? new Date(date) : new Date(),
      topic,
      activities,
      notes: notes || null,
      studentAttendanceCount: studentAttendanceCount ? parseInt(studentAttendanceCount) : 0,
      documentationUrl: documentationUrl || null,
      attachmentUrl: documentationUrl || null,
      mediaType: mediaType || (documentationUrl ? "IMAGE" : null),
    },
    include: {
      teacher: { select: { id: true, name: true, role: true } },
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  });

  return NextResponse.json({ journal }, { status: 201 });
}

// DELETE /api/journals?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID jurnal diperlukan" }, { status: 400 });

  const existing = await db.teacherJournal.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Jurnal tidak ditemukan" }, { status: 404 });

  if (user.role === "pendidik" && existing.teacherId !== user.id) {
    return NextResponse.json({ error: "Anda hanya dapat menghapus jurnal yang Anda buat sendiri" }, { status: 403 });
  }

  await db.teacherJournal.delete({ where: { id } });
  return NextResponse.json({ message: "Jurnal berhasil dihapus" });
}
