import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packet = searchParams.get("packet");
    const day = searchParams.get("day");

    let whereClause: any = {};

    if (packet && packet !== "SEMUA") {
      whereClause.class = { level: packet };
    }

    if (day && day !== "SEMUA") {
      const dayNum = parseInt(day, 10);
      if (!isNaN(dayNum)) {
        whereClause.dayOfWeek = dayNum;
      }
    }

    const dbSchedules = await db.classSchedule.findMany({
      where: whereClause,
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" }
      ]
    });

    const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

    const result = dbSchedules.map((s) => ({
      id: s.id,
      classId: s.classId,
      className: s.class.name,
      packetType: s.class.level,
      subjectId: s.subjectId,
      subjectCode: s.subject.code,
      subjectName: s.subject.name,
      teacherId: s.teacherId,
      teacherName: s.teacher.name,
      dayOfWeek: s.dayOfWeek,
      dayName: dayNames[s.dayOfWeek] || "Senin",
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room || "Ruang Belajar Askara",
      type: s.room?.toLowerCase() === "online" ? "ONLINE" : "TATAP_MUKA",
      onlineLink: s.room?.toLowerCase() === "online" ? "https://meet.google.com" : null,
      notes: "",
    }));

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat jadwal" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin" && user.role !== "pendidik")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin dan Guru yang dapat menambahkan jadwal." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      classId,
      subjectId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    } = body;

    let finalClassId = classId;
    let finalSubjectId = subjectId;
    let finalTeacherId = teacherId;

    if (!finalClassId && body.className) {
      const foundClass = await db.class.findFirst({ where: { name: body.className } });
      if (foundClass) finalClassId = foundClass.id;
    }

    if (!finalSubjectId && body.subjectName) {
      const foundSub = await db.subject.findFirst({ where: { name: body.subjectName } });
      if (foundSub) finalSubjectId = foundSub.id;
    }

    if (!finalTeacherId && body.teacherName) {
      const foundTeacher = await db.user.findFirst({
        where: {
          name: body.teacherName,
          role: { contains: "pendidik" }
        }
      });
      if (foundTeacher) finalTeacherId = foundTeacher.id;
    }

    if (!finalClassId || !finalSubjectId || !finalTeacherId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "Kelas, Mata Pelajaran, Pendidik/Tutor, Hari, dan Waktu Jam Belajar wajib dipilih!" },
        { status: 400 }
      );
    }

    const newSchedule = await db.classSchedule.create({
      data: {
        classId: finalClassId,
        subjectId: finalSubjectId,
        teacherId: finalTeacherId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        room: room || "Ruang Belajar Askara",
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
      }
    });

    const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const formattedData = {
      id: newSchedule.id,
      classId: newSchedule.classId,
      className: newSchedule.class.name,
      packetType: newSchedule.class.level,
      subjectId: newSchedule.subjectId,
      subjectCode: newSchedule.subject.code,
      subjectName: newSchedule.subject.name,
      teacherId: newSchedule.teacherId,
      teacherName: newSchedule.teacher.name,
      dayOfWeek: newSchedule.dayOfWeek,
      dayName: dayNames[newSchedule.dayOfWeek] || "Senin",
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      room: newSchedule.room || "Ruang Belajar Askara",
      type: newSchedule.room?.toLowerCase() === "online" ? "ONLINE" : "TATAP_MUKA",
      onlineLink: newSchedule.room?.toLowerCase() === "online" ? "https://meet.google.com" : null,
      notes: "",
    };

    return NextResponse.json({
      success: true,
      message: "Jadwal pelajaran berhasil ditambahkan",
      data: formattedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan jadwal baru" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin" && user.role !== "pendidik")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID jadwal diperlukan" }, { status: 400 });
    }
    await db.classSchedule.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Jadwal pelajaran berhasil dihapus" });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Gagal menghapus jadwal" }, { status: 500 });
  }
}
