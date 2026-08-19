import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { attendanceStore } from "@/lib/attendance-store";
import { db } from "@/lib/db";

// Helper function to format WIB time string accurately (Asia/Jakarta)
function getWibTimeString(date: Date = new Date()): string {
  return date.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " WIB";
}

// Helper function to persist attendance into Prisma DB asynchronously
async function persistAttendanceToDb(data: {
  userId: string;
  qrSessionId?: string;
  notes?: string;
  status?: string;
  className?: string;
  sessionTitle?: string;
  checkInTime?: Date;
}) {
  try {
    const checkInDate = data.checkInTime || new Date();
    const today = new Date(checkInDate);
    today.setHours(0, 0, 0, 0);

    // Find if user exists in DB
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ id: data.userId }, { email: data.userId }],
      },
    });

    if (existingUser) {
      await db.attendance.create({
        data: {
          userId: existingUser.id,
          date: today,
          type: "SISWA",
          status: data.status || "HADIR",
          checkInTime: checkInDate,
          qrSessionId: data.qrSessionId,
          notes: data.notes || "Scan Presensi QR",
        },
      });

      // Find parent to send email notification
      const studentProfile = await db.student.findUnique({
        where: { userId: existingUser.id },
        include: {
          parent: {
            include: { user: true }
          }
        }
      });

      if (studentProfile?.parent?.user?.email) {
        const { sendAttendanceEmail } = await import("@/lib/email");
        await sendAttendanceEmail(
          studentProfile.parent.user.email,
          studentProfile.parent.user.name,
          existingUser.name,
          data.className || "Siswa PKBM Askara",
          data.status || "HADIR",
          getWibTimeString(checkInDate),
          data.sessionTitle
        );
      }
    }
  } catch (err) {
    console.warn("Auto-persist attendance to DB notice:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized / Silakan login terlebih dahulu" }, { status: 401 });

    const body = await req.json();
    const {
      qrData, // Raw QR string from camera / input
      sessionCode, // Optional explicit session code
      studentId, // Optional explicit student ID
      studentName,
      nis,
      className,
      method, // "SCAN_QR_GURU" | "SCAN_BY_GURU_HP"
    } = body;

    if (!qrData && !sessionCode) {
      return NextResponse.json({ error: "Data QR Code atau Kode Sesi tidak ditemukan" }, { status: 400 });
    }

    const rawQR = (qrData || "").trim();
    const now = new Date();
    const timeFormatted = getWibTimeString(now);

    // ------------------------------------------------------------
    // SCENARIO 2: GURU / PEMBINA SCAN QR KARTU SISWA (HP GURU)
    // ------------------------------------------------------------
    if (rawQR.startsWith("ASKARA-STUDENT:") || user.role === "pendidik" || user.role === "admin") {
      let targetStudentId = studentId || user.id;
      let targetStudentName = studentName || user.name;
      let targetNIS = nis || "-";
      let targetClass = className || "Paket C";

      if (rawQR.startsWith("ASKARA-STUDENT:")) {
        const parts = rawQR.split(":");
        // Format: ASKARA-STUDENT:{studentId}:{nis}:{studentName}:{className}
        if (parts.length >= 2 && parts[1]) targetStudentId = parts[1];
        if (parts.length >= 3 && parts[2]) targetNIS = parts[2];
        if (parts.length >= 4 && parts[3]) targetStudentName = decodeURIComponent(parts[3]);
        if (parts.length >= 5 && parts[4]) targetClass = decodeURIComponent(parts[4]);
      }

      // Ambil data siswa asli dari DB untuk akurasi nama
      const realStudent = await db.student.findFirst({
        where: {
          OR: [{ id: targetStudentId }, { userId: targetStudentId }, { nisn: targetNIS }]
        },
        include: { user: true, enrollments: { include: { class: true } } }
      });

      if (realStudent) {
        targetStudentId = realStudent.userId;
        targetStudentName = realStudent.user.name;
        targetNIS = realStudent.nisn || targetNIS;
        if (realStudent.enrollments && realStudent.enrollments.length > 0) {
          targetClass = realStudent.enrollments[0].class.name;
        } else if (realStudent.packetType) {
          targetClass = realStudent.packetType;
        }
      }

      // Record in attendanceStore
      const targetSessionCode = sessionCode || attendanceStore.getAllSessions().find((s) => s.status === "ACTIVE")?.sessionCode;
      if (!targetSessionCode) {
        return NextResponse.json(
          { error: "Tidak ada sesi presensi aktif yang dibuka oleh Guru/Pembina." },
          { status: 404 }
        );
      }

      const result = attendanceStore.recordAttendance(targetSessionCode, {
        studentId: targetStudentId,
        studentName: targetStudentName,
        nis: targetNIS,
        className: targetClass,
        checkInTime: timeFormatted,
        method: "SCAN_BY_GURU_HP",
        status: "HADIR",
        notes: `Presensi dipindai oleh HP Tutor (${user.name})`,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Gagal mencatat presensi" }, { status: 400 });
      }

      if (result.alreadyExists) {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          message: `Siswa ${targetStudentName} sudah tercatat hadir sebelumnya (Check-in: ${result.record?.checkInTime}).`,
          record: result.record,
          session: result.session,
        });
      }

      // Async write to DB
      persistAttendanceToDb({
        userId: targetStudentId,
        qrSessionId: targetSessionCode,
        notes: `Presensi dipindai oleh HP Tutor (${user.name})`,
        status: "HADIR",
        className: targetClass,
        sessionTitle: targetSessionCode,
        checkInTime: now,
      });

      return NextResponse.json({
        success: true,
        message: `Presensi ${targetStudentName} (${targetClass}) berhasil dicatat melalui scan HP Guru!`,
        method: "SCAN_BY_GURU_HP",
        studentName: targetStudentName,
        checkInTime: timeFormatted,
        session: result.session,
        record: result.record,
      });
    }

    // ------------------------------------------------------------
    // SCENARIO 1: SISWA SCAN QR SESI GURU (HP SISWA)
    // ------------------------------------------------------------
    let targetSessionCode = sessionCode;

    if (rawQR.startsWith("ASKARA-SESI:")) {
      const parts = rawQR.split(":");
      // Format: ASKARA-SESI:{sessionCode}:{token}:{type}:{title}:{className}
      if (parts.length >= 2 && parts[1]) {
        targetSessionCode = parts[1];
      }
    } else if (rawQR.includes("SESI-")) {
      targetSessionCode = rawQR;
    }

    if (!targetSessionCode) {
      targetSessionCode = attendanceStore.getAllSessions().find((s) => s.status === "ACTIVE")?.sessionCode;
    }

    if (!targetSessionCode) {
      return NextResponse.json(
        { error: "Kode QR Sesi tidak valid atau sesi presensi sudah ditutup oleh Guru/Pembina." },
        { status: 400 }
      );
    }

    // SELALU Ambil identitas ASLI siswa yang sedang login dari Database
    const dbStudent = await db.student.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        enrollments: { include: { class: true } }
      }
    });

    const realStudentName = dbStudent?.user?.name || user.name || "Siswa Askara";
    const realNis = dbStudent?.nisn || nis || "-";
    const realClassName = dbStudent?.enrollments && dbStudent.enrollments.length > 0
      ? dbStudent.enrollments[0].class.name
      : dbStudent?.packetType || className || "Paket C";

    const result = attendanceStore.recordAttendance(targetSessionCode, {
      studentId: user.id,
      studentName: realStudentName,
      nis: realNis,
      className: realClassName,
      checkInTime: timeFormatted,
      method: "SCAN_QR_GURU",
      status: "HADIR",
      notes: "Scan mandiri QR Code Sesi",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Gagal memproses presensi" }, { status: 400 });
    }

    const session = result.session!;
    if (result.alreadyExists) {
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        message: `Halo ${realStudentName}, Anda sudah tercatat hadir pada sesi ${session.title} (Check-in: ${result.record?.checkInTime}).`,
        sessionTitle: session.title,
        sessionType: session.type,
        teacherName: session.teacherName,
        className: session.className,
        checkInTime: result.record?.checkInTime,
        session,
        record: result.record,
      });
    }

    // Async write to DB
    persistAttendanceToDb({
      userId: user.id,
      qrSessionId: targetSessionCode,
      notes: `Scan mandiri QR Code Sesi: ${session.title}`,
      status: "HADIR",
      className: session.className,
      sessionTitle: session.title,
      checkInTime: now,
    });

    return NextResponse.json({
      success: true,
      message: `Presensi Berhasil! Selamat belajar ${realStudentName}, Anda terverifikasi hadir di ${session.title}`,
      method: "SCAN_QR_GURU",
      studentName: realStudentName,
      sessionTitle: session.title,
      sessionType: session.type,
      teacherName: session.teacherName,
      className: session.className,
      checkInTime: timeFormatted,
      record: result.record,
      session,
    });
  } catch (error: any) {
    console.error("Scan Presensi Route Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses presensi QR" }, { status: 500 });
  }
}