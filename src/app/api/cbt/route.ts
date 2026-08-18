import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/cbt
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId") || undefined;
  const subjectId = searchParams.get("subjectId") || undefined;
  const type = searchParams.get("type") || undefined;
  const search = searchParams.get("search") || undefined;

  const whereClause: any = {};
  if (classId) whereClause.classId = classId;
  if (subjectId) whereClause.subjectId = subjectId;
  if (type) whereClause.type = type;
  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { type: { contains: search } },
    ];
  }

  const assessments = await db.assessment.findMany({
    where: whereClause,
    include: {
      teacher: { select: { id: true, name: true, role: true } },
      class: { select: { id: true, name: true, level: true } },
      subject: { select: { id: true, name: true, code: true } },
      questions: true,
      sessions: {
        select: {
          id: true,
          studentId: true,
          score: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assessments });
}

// POST /api/cbt
// Body: { title, type, durationMinutes, passingScore, startTime, endTime, isPublished, classId, subjectName, questions }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    type,
    durationMinutes,
    passingScore,
    startTime,
    endTime,
    isPublished,
    classId,
    subjectName,
    questions,
  } = body;

  if (!title || !classId || !subjectName) {
    return NextResponse.json(
      { error: "Judul paket ujian, kelas, dan mata pelajaran wajib diisi" },
      { status: 400 }
    );
  }

  // Cari subject berdasarkan nama, buat baru jika belum ada
  const allSubjects = await db.subject.findMany();
  let subject = allSubjects.find(
    (s) => s.name.toLowerCase() === subjectName.trim().toLowerCase()
  );
  if (!subject) {
    const code = subjectName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
    
    // Ambil level kelas jika ada untuk packetType
    const targetClass = await db.class.findUnique({ where: { id: classId } });
    const packetType = targetClass?.level || "Paket C";

    subject = await db.subject.create({
      data: {
        name: subjectName.trim(),
        code: code || "MAPEL",
        packetType: packetType,
      },
    });
  }
  const subjectId = subject.id;

  const now = new Date();
  const start = startTime ? new Date(startTime) : now;
  const end = endTime ? new Date(endTime) : new Date(now.getTime() + 86400000 * 30);

  const assessment = await db.assessment.create({
    data: {
      title,
      type: type || "PTS",
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : 60,
      passingScore: passingScore ? parseFloat(passingScore) : 75.0,
      startTime: start,
      endTime: end,
      isPublished: isPublished ?? true,
      classId,
      subjectId,
      teacherId: user.id,
      questions: {
        create:
          questions && Array.isArray(questions) && questions.length > 0
            ? questions.map((q: any) => ({
                questionText: q.questionText,
                questionType: q.questionType || "MULTIPLE_CHOICE_4",
                optionsJson: q.optionsJson || (q.options ? JSON.stringify(q.options) : null),
                correctOption: q.correctOption || "A",
                points: q.points ? parseFloat(q.points) : 10.0,
                imageUrl: q.imageUrl || null,
                audioUrl: q.audioUrl || null,
              }))
            : [
                {
                  questionText: `Contoh Butir Soal 1 untuk ${title}`,
                  questionType: "MULTIPLE_CHOICE",
                  optionsJson: JSON.stringify(["A. Pilihan 1", "B. Pilihan 2", "C. Pilihan 3", "D. Pilihan 4"]),
                  correctOption: "A",
                  points: 50.0,
                },
                {
                  questionText: `Contoh Butir Soal 2 untuk ${title}`,
                  questionType: "MULTIPLE_CHOICE",
                  optionsJson: JSON.stringify(["A. Jawaban A", "B. Jawaban B", "C. Jawaban C", "D. Jawaban D"]),
                  correctOption: "B",
                  points: 50.0,
                },
              ],
      },
    },
    include: {
      teacher: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      questions: true,
    },
  });

  return NextResponse.json({ assessment }, { status: 201 });
}

// DELETE /api/cbt?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID paket ujian diperlukan" }, { status: 400 });

  const existing = await db.assessment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Paket ujian tidak ditemukan" }, { status: 404 });

  if (user.role === "pendidik" && existing.teacherId !== user.id) {
    return NextResponse.json({ error: "Anda hanya dapat menghapus paket ujian yang Anda buat sendiri" }, { status: 403 });
  }

  await db.assessment.delete({ where: { id } });
  return NextResponse.json({ message: "Paket ujian berhasil dihapus" });
}

// PATCH /api/cbt?id=xxx (Toggle publish)
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID paket ujian diperlukan" }, { status: 400 });

  const body = await req.json();
  const updated = await db.assessment.update({
    where: { id },
    data: {
      isPublished: body.isPublished,
    },
  });

  return NextResponse.json({ assessment: updated });
}
