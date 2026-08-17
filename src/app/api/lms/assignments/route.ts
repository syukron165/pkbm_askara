import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/lms/assignments
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId") || undefined;
  const subjectId = searchParams.get("subjectId") || undefined;
  const search = searchParams.get("search") || undefined;

  // Seed default assignments if empty
  const count = await db.lMSAssignment.count();
  if (count === 0) {
    const defaultTeacher = await db.user.findFirst({
      where: { role: { in: ["pendidik", "admin", "super_admin"] } },
    });
    const defaultClass = await db.class.findFirst();
    const defaultSubject = await db.subject.findFirst();

    if (defaultTeacher && defaultClass && defaultSubject) {
      await db.lMSAssignment.createMany({
        data: [
          {
            title: "Tugas 1: Latihan Soal Matriks Kontekstual",
            instructions: "Kerjakan 5 soal pada modul halaman 24 di buku catatan, lalu foto atau scan dalam format PDF dan unggah ke sini.",
            dueDate: new Date(Date.now() + 86400000 * 5),
            maxScore: 100,
            classId: defaultClass.id,
            subjectId: defaultSubject.id,
            teacherId: defaultTeacher.id,
          },
          {
            title: "Tugas 2: Analisis Model Matematika Kasus Pasar",
            instructions: "Susun pemodelan matematika untuk perhitungan laba rugi usaha mikro sederhana.",
            dueDate: new Date(Date.now() + 86400000 * 10),
            maxScore: 100,
            classId: defaultClass.id,
            subjectId: defaultSubject.id,
            teacherId: defaultTeacher.id,
          },
        ],
      });
    }
  }

  const whereClause: any = {};
  if (classId) whereClause.classId = classId;
  if (subjectId) whereClause.subjectId = subjectId;
  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { instructions: { contains: search } },
    ];
  }

  const assignments = await db.lMSAssignment.findMany({
    where: whereClause,
    include: {
      teacher: { select: { id: true, name: true, role: true } },
      class: { select: { id: true, name: true, level: true } },
      subject: { select: { id: true, name: true, code: true } },
      submissions: {
        select: {
          id: true,
          studentId: true,
          score: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Calculate submission stats
  const formattedAssignments = assignments.map((a) => {
    const totalSubmissions = a.submissions.length;
    const gradedSubmissions = a.submissions.filter((s) => s.score !== null).length;
    return {
      ...a,
      submittedCount: totalSubmissions,
      gradedCount: gradedSubmissions,
      pendingCount: totalSubmissions - gradedSubmissions,
    };
  });

  return NextResponse.json({ assignments: formattedAssignments });
}

// POST /api/lms/assignments
// Body: { title, instructions, classId, subjectId, dueDate, maxScore }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, instructions, classId, subjectId, dueDate, maxScore } = body;

  if (!title || !instructions || !classId || !subjectId || !dueDate) {
    return NextResponse.json(
      { error: "Judul, Petunjuk Tugas, Kelas, Mata Pelajaran, dan Tenggat Waktu wajib diisi" },
      { status: 400 }
    );
  }

  const assignment = await db.lMSAssignment.create({
    data: {
      title,
      instructions,
      classId,
      subjectId,
      teacherId: user.id,
      dueDate: new Date(dueDate),
      maxScore: maxScore ? parseInt(maxScore) : 100,
    },
    include: {
      teacher: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  });

  return NextResponse.json({ assignment }, { status: 201 });
}

// DELETE /api/lms/assignments?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID tugas diperlukan" }, { status: 400 });

  const existing = await db.lMSAssignment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

  if (user.role === "pendidik" && existing.teacherId !== user.id) {
    return NextResponse.json({ error: "Anda hanya dapat menghapus tugas yang Anda buat sendiri" }, { status: 403 });
  }

  await db.lMSAssignment.delete({ where: { id } });
  return NextResponse.json({ message: "Tugas berhasil dihapus" });
}
