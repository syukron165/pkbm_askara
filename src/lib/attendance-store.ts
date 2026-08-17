export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  nis?: string;
  className?: string;
  avatarUrl?: string;
  checkInTime: string;
  method: "SCAN_QR_GURU" | "SCAN_BY_GURU_HP" | "MANUAL" | "GPS_MANDIRI";
  status: "HADIR" | "TERLAMBAT" | "SAKIT" | "IZIN" | "ALPA";
  notes?: string;
  timestamp: number;
}

export interface QRAttendanceSession {
  id: string;
  sessionCode: string;
  token: string;
  type: "MAPEL" | "CLUB";
  title: string; // e.g. "Matematika Terapan" or "Club Robotik & Coding AI"
  categoryOrCode?: string; // "MAT-C10" or "TEKNOLOGI"
  className?: string; // "Paket C - Kelas X Merdeka" or "Semua Anggota Club"
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  roomOrLocation: string;
  status: "ACTIVE" | "CLOSED";
  qrData: string;
  attendees: AttendanceRecord[];
  createdAt: string;
}

const INITIAL_SESSIONS: QRAttendanceSession[] = [
  {
    id: "sess-demo-1",
    sessionCode: "SESI-MAT-C10",
    token: "tok-mat-98231",
    type: "MAPEL",
    title: "Matematika Terapan",
    categoryOrCode: "MAT-C10",
    className: "Paket C - Kelas X Merdeka",
    teacherId: "teacher-1",
    teacherName: "Drs. Hendra Gunawan",
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "09:30",
    roomOrLocation: "Ruang Belajar Askara 1",
    status: "ACTIVE",
    qrData: `ASKARA-SESI:SESI-MAT-C10:tok-mat-98231:MAPEL:${encodeURIComponent("Matematika Terapan")}:${encodeURIComponent("Paket C - Kelas X Merdeka")}`,
    attendees: [
      {
        id: "att-1",
        studentId: "std-1",
        studentName: "Budi Santoso",
        nis: "2025.10.001",
        className: "Paket C - Kelas X Merdeka",
        checkInTime: "07:55 WIB",
        method: "SCAN_QR_GURU",
        status: "HADIR",
        timestamp: Date.now() - 3600000,
      },
      {
        id: "att-2",
        studentId: "std-2",
        studentName: "Siti Rahma",
        nis: "2025.10.002",
        className: "Paket C - Kelas X Merdeka",
        checkInTime: "08:02 WIB",
        method: "SCAN_BY_GURU_HP",
        status: "HADIR",
        notes: "Scan via HP Guru (Terkendala Kuota Siswa)",
        timestamp: Date.now() - 3000000,
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "sess-demo-2",
    sessionCode: "SESI-CLUB-ROBOTIK",
    token: "tok-rob-55412",
    type: "CLUB",
    title: "Club Robotik & Coding AI",
    categoryOrCode: "TEKNOLOGI",
    className: "Semua Anggota Club",
    teacherId: "teacher-2",
    teacherName: "Dewi Anggraini, S.Kom.",
    date: new Date().toISOString().split("T")[0],
    startTime: "13:30",
    endTime: "15:30",
    roomOrLocation: "Lab Komputer & Multimedia Askara",
    status: "ACTIVE",
    qrData: `ASKARA-SESI:SESI-CLUB-ROBOTIK:tok-rob-55412:CLUB:${encodeURIComponent("Club Robotik & Coding AI")}:${encodeURIComponent("Semua Anggota Club")}`,
    attendees: [
      {
        id: "att-3",
        studentId: "std-1",
        studentName: "Budi Santoso",
        nis: "2025.10.001",
        className: "Paket C - Kelas X Merdeka",
        checkInTime: "13:28 WIB",
        method: "SCAN_QR_GURU",
        status: "HADIR",
        timestamp: Date.now() - 7200000,
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

const globalForAttendance = globalThis as unknown as {
  attendanceSessions: QRAttendanceSession[] | undefined;
};

if (!globalForAttendance.attendanceSessions) {
  globalForAttendance.attendanceSessions = INITIAL_SESSIONS;
}

export const attendanceStore = {
  getAllSessions(): QRAttendanceSession[] {
    return globalForAttendance.attendanceSessions || [];
  },

  getSessionByCode(code: string): QRAttendanceSession | undefined {
    const sessions = this.getAllSessions();
    return sessions.find(
      (s) => s.sessionCode.toUpperCase() === code.toUpperCase() || s.id === code || s.token === code
    );
  },

  createSession(newSession: QRAttendanceSession): QRAttendanceSession {
    const sessions = this.getAllSessions();
    sessions.unshift(newSession);
    globalForAttendance.attendanceSessions = sessions;
    return newSession;
  },

  closeSession(code: string): QRAttendanceSession | undefined {
    const session = this.getSessionByCode(code);
    if (session) {
      session.status = "CLOSED";
    }
    return session;
  },

  recordAttendance(
    sessionCode: string,
    record: Omit<AttendanceRecord, "id" | "timestamp">
  ): { success: boolean; session?: QRAttendanceSession; record?: AttendanceRecord; alreadyExists?: boolean; error?: string } {
    let session = this.getSessionByCode(sessionCode);

    // If session not found by exact code, try matching active session
    if (!session) {
      const active = this.getAllSessions().find((s) => s.status === "ACTIVE");
      if (active) session = active;
    }

    if (!session) {
      return { success: false, error: "Sesi presensi tidak ditemukan atau sudah ditutup." };
    }

    session.attendees = session.attendees || [];

    // Check if already checked in by studentId or studentName
    const existing = session.attendees.find(
      (a) =>
        (record.studentId && a.studentId === record.studentId) ||
        (record.studentName && a.studentName.toLowerCase() === record.studentName.toLowerCase())
    );

    if (existing) {
      return {
        success: true,
        alreadyExists: true,
        session,
        record: existing,
      };
    }

    const fullRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };

    session.attendees.unshift(fullRecord);
    return {
      success: true,
      alreadyExists: false,
      session,
      record: fullRecord,
    };
  },

  getAllAttendanceLogs() {
    const sessions = this.getAllSessions();
    const logs: Array<{
      id: string;
      studentName: string;
      nis: string;
      className: string;
      sessionTitle: string;
      type: "MAPEL" | "CLUB" | "GPS";
      teacherName: string;
      date: string;
      checkInTime: string;
      method: "SCAN_QR_GURU" | "SCAN_BY_GURU_HP" | "GPS_MANDIRI";
      status: "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT";
    }> = [];

    for (const s of sessions) {
      for (const att of s.attendees || []) {
        logs.push({
          id: att.id,
          studentName: att.studentName,
          nis: att.nis || "-",
          className: att.className || s.className || "Paket C",
          sessionTitle: s.title,
          type: s.type,
          teacherName: s.teacherName,
          date: s.date,
          checkInTime: att.checkInTime,
          method: att.method as any,
          status: att.status as any,
        });
      }
    }

    return logs;
  },
};
