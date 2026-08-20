import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// GET: Ambil Jadwal Pelajaran milik Tutor & Siswa Terdaftar di Rombel
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "students"; // "schedules" | "students"
    const classId = searchParams.get("classId") || "";
    const className = searchParams.get("className") || "";
    const packetType = searchParams.get("packetType") || "";
    const dayParam = searchParams.get("day"); // undefined | "ALL" | "1".."7"

    // ------------------------------------------------------------
    // MODE 1: Ambil Jadwal Pelajaran Resmi yang Dibuat oleh Admin
    // ------------------------------------------------------------
    if (mode === "schedules") {
      const uName = (user.name || "").toLowerCase().trim();
      const cleanName = uName.replace(/,?\s*(s\.pd|m\.pd|s\.kom|s\.st|s\.si|s\.hum|s\.sos|a\.md|dr|prof).*$/gi, "").trim();
      const firstName = cleanName.split(" ")[0] || cleanName;

      let whereSchedule: any = {};
      if (dayParam && dayParam !== "ALL" && !isNaN(Number(dayParam))) {
        whereSchedule.dayOfWeek = Number(dayParam);
      }

      // Tarik jadwal dari database menggunakan ClassSchedule
      const schedules = await db.classSchedule.findMany({
        where: whereSchedule,
        include: {
          subject: true,
          class: {
            include: {
              enrollments: {
                include: {
                  student: {
                    include: { user: true },
                  },
                },
              },
            },
          },
          teacher: true,
        },
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      });

      // Filter jadwal yang diampu HANYA oleh Tutor yang login
      const mySchedules = schedules.filter((sch) => {
        if (user.role === "super_admin" || user.role === "admin") return true;

        const tId = sch.teacherId;
        const tName = (sch.teacher?.name || "").toLowerCase().trim();
        const subTeacherId = sch.subject?.teacherId;
        const subTeacherName = (sch.subject?.teacherName || "").toLowerCase().trim();

        const idMatch = (tId && tId === user.id) || (subTeacherId && subTeacherId === user.id);
        const nameMatch =
          tName.includes(cleanName) ||
          cleanName.includes(tName) ||
          tName.includes(firstName) ||
          subTeacherName.includes(cleanName) ||
          cleanName.includes(subTeacherName);

        return idMatch || nameMatch;
      });

      const formattedSchedules = mySchedules.map((sch) => {
        const subjectName = sch.subject?.name || "Mata Pelajaran";
        const targetClass = sch.class?.name || "Semua Kelas";
        const timeSlot = sch.startTime && sch.endTime
          ? `${sch.startTime} - ${sch.endTime} WIB`
          : "Jadwal Reguler";

        return {
          id: sch.id,
          scheduleId: sch.id,
          classId: sch.classId,
          className: targetClass,
          packetType: sch.class?.level || sch.subject?.packetType || "Paket C",
          subjectId: sch.subjectId,
          subjectCode: sch.subject?.code || "MAPEL",
          subjectName,
          teacherId: sch.teacherId,
          teacherName: sch.teacher?.name || sch.subject?.teacherName || user.name,
          dayOfWeek: sch.dayOfWeek,
          dayName: DAY_NAMES[sch.dayOfWeek] || "Senin",
          startTime: sch.startTime,
          endTime: sch.endTime,
          timeSlot,
          room: sch.room || "Ruang Belajar Askara",
          enrolledStudentsCount: sch.class?.enrollments?.length || 0,
        };
      });

      return NextResponse.json({
        success: true,
        schedules: formattedSchedules,
      });
    }

    // ------------------------------------------------------------
    // MODE 2: Ambil Siswa yang BENAR-BENAR Terdaftar di Rombel/Kelas Pilihan
    // ------------------------------------------------------------
    let studentsFound: any[] = [];

    // 1. Prioritas Utama: Cari berdasarkan Class ID melalui ClassEnrollment
    if (classId && classId !== "ALL") {
      const classEnrollments = await db.classEnrollment.findMany({
        where: { classId },
        include: {
          class: true,
          student: {
            include: { user: true },
          },
        },
        orderBy: {
          student: { user: { name: "asc" } },
        },
      });

      if (classEnrollments.length > 0) {
        studentsFound = classEnrollments.map((e) => ({
          ...e.student,
          enrolledClassName: e.class.name,
        }));
      }
    }

    // 2. Prioritas Kedua: Jika tidak ada Class ID atau belum ada enrollment, cari berdasarkan nama kelas / jenjang
    if (studentsFound.length === 0 && (className || packetType)) {
      const cleanClassName = className.toLowerCase().trim();
      const targetPacket = packetType || (cleanClassName.includes("paket a") ? "Paket A" : cleanClassName.includes("paket b") ? "Paket B" : cleanClassName.includes("paket c") ? "Paket C" : "");

      const orConditions: any[] = [];
      if (className) {
        orConditions.push({
          enrollments: {
            some: {
              class: {
                name: { contains: className, mode: "insensitive" },
              },
            },
          },
        });
      }
      if (targetPacket) {
        orConditions.push({
          packetType: { contains: targetPacket, mode: "insensitive" },
        });
      }

      studentsFound = await db.student.findMany({
        where: {
          status: { in: ["ACTIVE", "AKTIF"] },
          ...(orConditions.length > 0 ? { OR: orConditions } : {}),
        },
        include: {
          user: true,
          enrollments: { include: { class: true } },
        },
        orderBy: { user: { name: "asc" } },
        take: 100,
      });
    }

    // 3. Fallback: Seluruh siswa aktif jika kelas gabungan / umum
    if (studentsFound.length === 0) {
      studentsFound = await db.student.findMany({
        where: { status: { in: ["ACTIVE", "AKTIF"] } },
        include: {
          user: true,
          enrollments: { include: { class: true } },
        },
        orderBy: { user: { name: "asc" } },
        take: 50,
      });
    }

    // Ambil status presensi hari ini untuk setiap siswa
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const userIds = studentsFound.map((s) => s.userId).filter(Boolean);
    const todayAttendances = await db.attendance.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    const attendanceMap = new Map<string, any>();
    todayAttendances.forEach((att) => {
      attendanceMap.set(att.userId, att);
    });

    const formattedStudents = studentsFound.map((s) => {
      const existingAtt = attendanceMap.get(s.userId);
      const studentClass = s.enrolledClassName || s.enrollments?.[0]?.class?.name || s.packetType || className || "Paket C";

      return {
        studentId: s.userId,
        studentProfileId: s.id,
        studentName: s.user?.name || "Nama Siswa",
        nisn: s.nisn || s.user?.nik || "-",
        gender: s.gender || "L",
        className: studentClass,
        status: existingAtt?.status || "HADIR",
        alreadyRecorded: !!existingAtt,
        checkInTime: existingAtt?.checkInTime
          ? new Date(existingAtt.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      total: formattedStudents.length,
      students: formattedStudents,
    });
  } catch (error: any) {
    console.error("GET /api/presensi/manual Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat data" }, { status: 500 });
  }
}

// POST: Simpan Presensi Massal Siswa Per Kelas
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { sessionTitle, className, classId, records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: "Data presensi siswa tidak boleh kosong" }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const now = new Date();

    await Promise.all(
      records.map(async (rec: { studentId: string; status: string; notes?: string }) => {
        if (!rec.studentId) return;

        // Cek apakah sudah ada presensi siswa pada hari ini
        const existing = await db.attendance.findFirst({
          where: {
            userId: rec.studentId,
            date: { gte: todayStart, lte: todayEnd },
          },
        });

        if (existing) {
          // Update status kehadiran
          await db.attendance.update({
            where: { id: existing.id },
            data: {
              status: rec.status || "HADIR",
              classId: classId || existing.classId || null,
              notes: rec.notes || `Presensi Tutor: ${sessionTitle || "Kelas"} (${className || "Umum"})`,
              verifiedBy: user.name,
            },
          });
        } else {
          // Buat catatan kehadiran baru
          await db.attendance.create({
            data: {
              userId: rec.studentId,
              classId: classId || null,
              date: todayStart,
              type: "SISWA",
              status: rec.status || "HADIR",
              checkInTime: now,
              notes: rec.notes || `Presensi Tutor: ${sessionTitle || "Kelas"} (${className || "Umum"})`,
              verifiedBy: user.name,
            },
          });
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: `Presensi ${records.length} siswa untuk mata pelajaran ${sessionTitle || "Kelas"} berhasil disimpan!`,
    });
  } catch (error: any) {
    console.error("POST /api/presensi/manual Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan presensi" }, { status: 500 });
  }
}