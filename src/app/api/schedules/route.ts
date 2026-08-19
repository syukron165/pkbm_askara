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
      whereClause.class = {
        level: { in: [packet, "Semua Jenjang", "SEMUA", "Umum"] }
      };
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
      startDate: s.startDate ? s.startDate.toISOString().slice(0, 10) : null,
      endDate: s.endDate ? s.endDate.toISOString().slice(0, 10) : null,
      isRecurring: s.isRecurring ?? true,
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
      startDate,
      endDate,
      isRecurring = true,
    } = body;

    let finalClassId = classId;
    let finalSubjectId = subjectId;
    let finalTeacherId = teacherId;

    // Handle "ALL" / "SEMUA" for Class (Semua Kelas / Gabungan)
    if (finalClassId === "ALL" || finalClassId === "SEMUA" || (!finalClassId && body.className?.toLowerCase().includes("semua kelas"))) {
      let allClass = await db.class.findFirst({
        where: { name: { in: ["Semua Kelas (Kelas Bersama)", "Semua Kelas", "Kelas Gabungan (Semua Paket)"] } }
      });
      if (!allClass) {
        allClass = await db.class.create({
          data: {
            name: "Semua Kelas (Kelas Bersama)",
            level: "Semua Jenjang",
            academicYear: "2025/2026",
            semester: "GANJIL",
          }
        });
      }
      finalClassId = allClass.id;
    } else if (!finalClassId && body.className) {
      const foundClass = await db.class.findFirst({ where: { name: body.className } });
      if (foundClass) finalClassId = foundClass.id;
    }

    // Handle "ALL" / "SEMUA" for Subject (Agenda & Pembelajaran Bersama)
    if (finalSubjectId === "ALL" || finalSubjectId === "SEMUA" || (!finalSubjectId && body.subjectName?.toLowerCase().includes("agenda bersama"))) {
      let allSub = await db.subject.findFirst({
        where: { name: { in: ["Agenda & Pembelajaran Bersama", "Kelas Gabungan", "Umum"] } }
      });
      if (!allSub) {
        allSub = await db.subject.create({
          data: {
            code: "UMUM",
            name: "Agenda & Pembelajaran Bersama",
            packetType: "Semua Jenjang",
          }
        });
      }
      finalSubjectId = allSub.id;
    } else if (!finalSubjectId && body.subjectName) {
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
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isRecurring: Boolean(isRecurring),
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
      startDate: newSchedule.startDate ? newSchedule.startDate.toISOString().slice(0, 10) : null,
      endDate: newSchedule.endDate ? newSchedule.endDate.toISOString().slice(0, 10) : null,
      isRecurring: newSchedule.isRecurring ?? true,
    };

    // ============================================================
    // KIRIM NOTIFIKASI OTOMATIS KE GURU / PENDIDIK YANG DITUGASKAN
    // ============================================================
    try {
      if (newSchedule.teacherId) {
        const isTeam =
          newSchedule.teacher.name.toLowerCase().includes("tim pengajar") ||
          newSchedule.teacher.name.toLowerCase().includes("semua");

        if (isTeam) {
          // Jika Tim Pengajar / Bersama, kirim notifikasi ke seluruh guru/pendidik aktif
          const allTeachers = await db.user.findMany({
            where: {
              role: { contains: "pendidik" },
              isActive: true,
            },
            select: { id: true, name: true },
          });

          if (allTeachers.length > 0) {
            await db.notification.createMany({
              data: allTeachers.map((t) => ({
                userId: t.id,
                title: `Jadwal Mengajar Baru: ${newSchedule.subject.name} 📅`,
                message: `Halo Bapak/Ibu ${t.name}, Anda bersama Tim Pengajar telah dijadwalkan mengampu "${newSchedule.subject.name}" (${newSchedule.class.name}) setiap hari ${dayNames[newSchedule.dayOfWeek]} pukul ${newSchedule.startTime} - ${newSchedule.endTime} WIB (${newSchedule.room || "Ruang Belajar Askara"}).`,
                type: "EVENT",
                actionUrl: "/jadwal",
              })),
            });
          }
        } else {
          // Kirim notifikasi personal ke guru yang dicatat namanya pada jadwal baru
          await db.notification.create({
            data: {
              userId: newSchedule.teacherId,
              title: `Jadwal Mengajar Baru: ${newSchedule.subject.name} 📅`,
              message: `Halo Bapak/Ibu ${newSchedule.teacher.name}, Anda telah ditugaskan mengajar mata pelajaran "${newSchedule.subject.name}" untuk kelas ${newSchedule.class.name} setiap hari ${dayNames[newSchedule.dayOfWeek]} pukul ${newSchedule.startTime} - ${newSchedule.endTime} WIB di ${newSchedule.room || "Ruang Belajar Askara"}.`,
              type: "EVENT",
              actionUrl: "/jadwal",
            },
          });
        }
      }
    } catch (notifErr) {
      console.error("[SCHEDULE_NOTIF_ERROR]", notifErr);
    }

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

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin" && user.role !== "pendidik")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      classId,
      subjectId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      startDate,
      endDate,
      isRecurring,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID jadwal wajib disertakan" }, { status: 400 });
    }

    let finalClassId = classId;
    let finalSubjectId = subjectId;
    let finalTeacherId = teacherId;

    // Handle "ALL" / "SEMUA" for Class (Semua Kelas / Gabungan)
    if (finalClassId === "ALL" || finalClassId === "SEMUA" || (!finalClassId && body.className?.toLowerCase().includes("semua kelas"))) {
      let allClass = await db.class.findFirst({
        where: { name: { in: ["Semua Kelas (Kelas Bersama)", "Semua Kelas", "Kelas Gabungan (Semua Paket)"] } }
      });
      if (!allClass) {
        allClass = await db.class.create({
          data: {
            name: "Semua Kelas (Kelas Bersama)",
            level: "Semua Jenjang",
            academicYear: "2025/2026",
            semester: "GANJIL",
          }
        });
      }
      finalClassId = allClass.id;
    } else if (!finalClassId && body.className) {
      const foundClass = await db.class.findFirst({ where: { name: body.className } });
      if (foundClass) finalClassId = foundClass.id;
    }

    // Handle "ALL" / "SEMUA" for Subject (Agenda & Pembelajaran Bersama)
    if (finalSubjectId === "ALL" || finalSubjectId === "SEMUA" || (!finalSubjectId && body.subjectName?.toLowerCase().includes("agenda bersama"))) {
      let allSub = await db.subject.findFirst({
        where: { name: { in: ["Agenda & Pembelajaran Bersama", "Kelas Gabungan", "Umum"] } }
      });
      if (!allSub) {
        allSub = await db.subject.create({
          data: {
            code: "UMUM",
            name: "Agenda & Pembelajaran Bersama",
            packetType: "Semua Jenjang",
          }
        });
      }
      finalSubjectId = allSub.id;
    } else if (!finalSubjectId && body.subjectName) {
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

    const updatedSchedule = await db.classSchedule.update({
      where: { id },
      data: {
        ...(finalClassId ? { classId: finalClassId } : {}),
        ...(finalSubjectId ? { subjectId: finalSubjectId } : {}),
        ...(finalTeacherId ? { teacherId: finalTeacherId } : {}),
        ...(dayOfWeek ? { dayOfWeek: Number(dayOfWeek) } : {}),
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        ...(room !== undefined ? { room } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
        ...(isRecurring !== undefined ? { isRecurring: Boolean(isRecurring) } : {}),
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
      }
    });

    const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const formattedData = {
      id: updatedSchedule.id,
      classId: updatedSchedule.classId,
      className: updatedSchedule.class.name,
      packetType: updatedSchedule.class.level,
      subjectId: updatedSchedule.subjectId,
      subjectCode: updatedSchedule.subject.code,
      subjectName: updatedSchedule.subject.name,
      teacherId: updatedSchedule.teacherId,
      teacherName: updatedSchedule.teacher.name,
      dayOfWeek: updatedSchedule.dayOfWeek,
      dayName: dayNames[updatedSchedule.dayOfWeek] || "Senin",
      startTime: updatedSchedule.startTime,
      endTime: updatedSchedule.endTime,
      room: updatedSchedule.room || "Ruang Belajar Askara",
      type: updatedSchedule.room?.toLowerCase() === "online" ? "ONLINE" : "TATAP_MUKA",
      onlineLink: updatedSchedule.room?.toLowerCase() === "online" ? "https://meet.google.com" : null,
      notes: "",
      startDate: updatedSchedule.startDate ? updatedSchedule.startDate.toISOString().slice(0, 10) : null,
      endDate: updatedSchedule.endDate ? updatedSchedule.endDate.toISOString().slice(0, 10) : null,
      isRecurring: updatedSchedule.isRecurring ?? true,
    };

    // ============================================================
    // KIRIM NOTIFIKASI PEMBARUAN JADWAL KE GURU / PENDIDIK
    // ============================================================
    try {
      if (updatedSchedule.teacherId) {
        await db.notification.create({
          data: {
            userId: updatedSchedule.teacherId,
            title: `Pembaruan Jadwal Mengajar: ${updatedSchedule.subject.name} 📅`,
            message: `Halo Bapak/Ibu ${updatedSchedule.teacher.name}, terdapat pembaruan jadwal mengajar "${updatedSchedule.subject.name}" (${updatedSchedule.class.name}) menjadi setiap hari ${dayNames[updatedSchedule.dayOfWeek]} pukul ${updatedSchedule.startTime} - ${updatedSchedule.endTime} WIB di ${updatedSchedule.room || "Ruang Belajar Askara"}.`,
            type: "EVENT",
            actionUrl: "/jadwal",
          },
        });
      }
    } catch (notifErr) {
      console.error("[SCHEDULE_UPDATE_NOTIF_ERROR]", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Jadwal pelajaran berhasil diperbarui",
      data: formattedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui jadwal" },
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
