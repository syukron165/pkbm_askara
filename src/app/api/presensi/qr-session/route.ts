import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { attendanceStore, QRAttendanceSession } from "@/lib/attendance-store";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionCode = searchParams.get("sessionCode");
    const type = searchParams.get("type"); // "MAPEL" | "CLUB" | "ALL"

    if (sessionCode) {
      const session = attendanceStore.getSessionByCode(sessionCode);
      if (!session) return NextResponse.json({ error: "Sesi presensi tidak ditemukan" }, { status: 404 });
      return NextResponse.json({ success: true, session });
    }

    let sessions = attendanceStore.getAllSessions();

    if (type && type !== "ALL") {
      sessions = sessions.filter((s) => s.type === type);
    }

    return NextResponse.json({
      success: true,
      total: sessions.length,
      sessions,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat sesi presensi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const {
      type, // "MAPEL" | "CLUB"
      title, // e.g. "Matematika Terapan"
      categoryOrCode,
      className,
      startTime,
      endTime,
      roomOrLocation,
    } = body;

    if (!type || !title) {
      return NextResponse.json({ error: "Tipe sesi dan Judul Mata Pelajaran / Club wajib diisi" }, { status: 400 });
    }

    const sessionCode = `SESI-${type}-${Date.now().toString().slice(-5)}`;
    const token = `tok-${Math.random().toString(36).slice(2, 8)}`;
    const qrData = `ASKARA-SESI:${sessionCode}:${token}:${type}:${encodeURIComponent(title)}:${encodeURIComponent(className || "Umum")}`;

    const newSession: QRAttendanceSession = {
      id: `sess-${Date.now()}`,
      sessionCode,
      token,
      type,
      title: title.trim(),
      categoryOrCode: categoryOrCode?.trim() || (type === "MAPEL" ? "MAPEL-UMUM" : "EKSTRA"),
      className: className?.trim() || (type === "MAPEL" ? "Paket C - Kelas X" : "Semua Anggota Club"),
      teacherId: user.id,
      teacherName: user.name,
      date: new Date().toISOString().split("T")[0],
      startTime: startTime || "08:00",
      endTime: endTime || "09:30",
      roomOrLocation: roomOrLocation?.trim() || "Ruang Belajar PKBM Askara",
      status: "ACTIVE",
      qrData,
      attendees: [],
      createdAt: new Date().toISOString(),
    };

    attendanceStore.createSession(newSession);

    return NextResponse.json({
      success: true,
      message: `Sesi presensi QR untuk ${title} berhasil dibuka!`,
      session: newSession,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal membuat sesi presensi" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sessionCode = searchParams.get("sessionCode");
    if (!sessionCode) {
      return NextResponse.json({ error: "Session code wajib disertakan" }, { status: 400 });
    }

    const closed = attendanceStore.closeSession(sessionCode);
    if (!closed) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Sesi presensi ${closed.title} telah ditutup`,
      session: closed,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menutup sesi" }, { status: 500 });
  }
}
