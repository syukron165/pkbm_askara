import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/lms/materials
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId") || undefined;
  const subjectId = searchParams.get("subjectId") || undefined;
  const search = searchParams.get("search") || undefined;

  // Seed default materials if empty
  const count = await db.lMSMaterial.count();
  if (count === 0) {
    const defaultTeacher = await db.user.findFirst({
      where: { role: { in: ["pendidik", "admin", "super_admin"] } },
    });
    const defaultClass = await db.class.findFirst();
    const defaultSubject = await db.subject.findFirst();

    if (defaultTeacher && defaultClass && defaultSubject) {
      await db.lMSMaterial.createMany({
        data: [
          {
            title: "Modul Matriks & Sistem Persamaan Linear",
            description: "Memuat konsep dasar matriks, determinan, invers, dan penerapannya dalam kasus sehari-hari.",
            content: "Matriks adalah susunan bilangan dalam bentuk baris dan kolom yang diletakkan dalam tanda kurung biasa atau siku.",
            fileUrl: "/uploads/materi/sample-matriks.pdf",
            classId: defaultClass.id,
            subjectId: defaultSubject.id,
            teacherId: defaultTeacher.id,
          },
          {
            title: "Geometri Bidang Datar & Trigonometri",
            description: "Pembahasan sinus, cosinus, tangen dan penggunaannya dalam pengukuran jarak kontekstual.",
            content: "Trigonometri mempelajari hubungan antara panjang sisi dan besar sudut pada segitiga.",
            fileUrl: "/uploads/materi/sample-trigonometri.pdf",
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
      { description: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const materials = await db.lMSMaterial.findMany({
    where: whereClause,
    include: {
      teacher: { select: { id: true, name: true, role: true } },
      class: { select: { id: true, name: true, level: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ materials });
}

// POST /api/lms/materials
// Body: { title, description, content, classId, subjectId, fileUrl, videoUrl }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, content, classId, subjectId, fileUrl, videoUrl } = body;

  if (!title || !classId || !subjectId) {
    return NextResponse.json(
      { error: "Judul, Kelas, dan Mata Pelajaran wajib diisi" },
      { status: 400 }
    );
  }

  const material = await db.lMSMaterial.create({
    data: {
      title,
      description: description || null,
      content: content || null,
      classId,
      subjectId,
      teacherId: user.id,
      fileUrl: fileUrl || null,
      videoUrl: videoUrl || null,
    },
    include: {
      teacher: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  });

  return NextResponse.json({ material }, { status: 201 });
}

// DELETE /api/lms/materials?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID materi diperlukan" }, { status: 400 });

  const existing = await db.lMSMaterial.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });

  if (user.role === "pendidik" && existing.teacherId !== user.id) {
    return NextResponse.json({ error: "Anda hanya dapat menghapus materi yang Anda buat sendiri" }, { status: 403 });
  }

  await db.lMSMaterial.delete({ where: { id } });
  return NextResponse.json({ message: "Materi berhasil dihapus" });
}
