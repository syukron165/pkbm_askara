import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role"); // "ALL" | "SISWA" | "PENDIDIK" | "MANAJEMEN"
    const dateParam = searchParams.get("date"); // "YYYY-MM-DD" or undefined/ALL
    const statusParam = searchParams.get("status"); // "ALL" | "HADIR" | ...
    const searchParam = searchParams.get("search")?.toLowerCase().trim();

    let whereClause: any = {};

    // Filter by Date
    if (dateParam && dateParam !== "ALL") {
      const selectedDate = new Date(dateParam);
      if (!isNaN(selectedDate.getTime())) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause.date = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    // Filter by Status
    if (statusParam && statusParam !== "SEMUA" && statusParam !== "ALL") {
      whereClause.status = statusParam;
    }

    // Filter by Role / Type
    if (roleParam && roleParam !== "ALL" && roleParam !== "SEMUA") {
      if (roleParam === "SISWA") {
        whereClause.OR = [
          { type: "SISWA" },
          { user: { role: { contains: "siswa", mode: "insensitive" } } },
        ];
      } else if (roleParam === "PENDIDIK" || roleParam === "TUTOR") {
        whereClause.OR = [
          { type: "PENDIDIK" },
          { user: { role: { contains: "pendidik", mode: "insensitive" } } },
        ];
      } else if (roleParam === "MANAJEMEN") {
        whereClause.OR = [
          { type: "MANAJEMEN" },
          { user: { role: { in: ["admin", "super_admin", "manajemen", "staf"] } } },
        ];
      }
    }

    // Filter by Search (User name, NIK, or Email)
    if (searchParam) {
      whereClause.user = {
        OR: [
          { name: { contains: searchParam, mode: "insensitive" } },
          { nik: { contains: searchParam, mode: "insensitive" } },
          { email: { contains: searchParam, mode: "insensitive" } },
        ],
      };
    }

    const attendances = await db.attendance.findMany({
      where: whereClause,
      include: {
        user: true,
        class: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    const logs = attendances.map((att) => {
      let roleCategory: "SISWA" | "PENDIDIK" | "MANAJEMEN" = "SISWA";
      const uRole = (att.user?.role || "").toLowerCase();

      if (uRole.includes("pendidik")) {
        roleCategory = "PENDIDIK";
      } else if (uRole.includes("admin") || uRole.includes("super_admin") || uRole.includes("manajemen") || att.type === "MANAJEMEN") {
        roleCategory = "MANAJEMEN";
      } else {
        roleCategory = "SISWA";
      }

      let formattedCheckIn = "-";
      if (att.checkInTime) {
        const time = new Date(att.checkInTime);
        const hh = String(time.getHours()).padStart(2, "0");
        const mm = String(time.getMinutes()).padStart(2, "0");
        formattedCheckIn = `${hh}:${mm} WIB`;
      }

      let defaultClassName = att.class?.name;
      if (!defaultClassName) {
        if (roleCategory === "PENDIDIK") defaultClassName = "Dewan Guru / Tutor";
        else if (roleCategory === "MANAJEMEN") defaultClassName = "Manajemen & Tata Usaha";
        else defaultClassName = "Kelas Reguler Askara";
      }

      let method: "SCAN_QR" | "GPS_MANDIRI" | "MANUAL_ADMIN" = "GPS_MANDIRI";
      if (att.qrSessionId) {
        method = "SCAN_QR";
      } else if (att.verifiedBy) {
        method = "MANUAL_ADMIN";
      }

      return {
        id: att.id,
        userId: att.userId,
        name: att.user?.name || "Pengguna",
        nik: att.user?.nik || "-",
        email: att.user?.email || "-",
        role: att.user?.role || "siswa",
        roleCategory,
        className: defaultClassName,
        sessionTitle: att.notes || (roleCategory === "SISWA" ? "KBM Kelas / Rombel" : roleCategory === "PENDIDIK" ? "Presensi Kehadiran Tutor" : "Presensi Manajemen"),
        type: att.type || roleCategory,
        date: att.date ? new Date(att.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        checkInTime: formattedCheckIn,
        method,
        status: att.status || "HADIR",
        notes: att.notes || "",
        latitude: att.latitude,
        longitude: att.longitude,
        distanceMeters: att.distanceMeters,
      };
    });

    // Real dynamic summary calculations
    const todayStr = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter((l) => l.date === todayStr);

    const siswaHadir = todayLogs.filter((l) => l.roleCategory === "SISWA" && (l.status === "HADIR" || l.status === "TERLAMBAT")).length;
    const pendidikHadir = todayLogs.filter((l) => l.roleCategory === "PENDIDIK" && (l.status === "HADIR" || l.status === "TERLAMBAT")).length;
    const manajemenHadir = todayLogs.filter((l) => l.roleCategory === "MANAJEMEN" && (l.status === "HADIR" || l.status === "TERLAMBAT")).length;
    const izinSakit = todayLogs.filter((l) => l.status === "IZIN" || l.status === "SAKIT").length;
    const totalToday = todayLogs.length;

    const summary = {
      totalToday,
      siswaHadir,
      pendidikHadir,
      manajemenHadir,
      izinSakit,
    };

    return NextResponse.json({
      success: true,
      total: logs.length,
      data: logs,
      summary,
    });
  } catch (error: any) {
    console.error("GET /api/attendances Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat presensi" },
      { status: 500 }
    );
  }
}

// POST /api/attendances - Catat Presensi Manual oleh Admin/Pendidik
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin" && user.role !== "pendidik")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await req.json();
    const {
      userId,
      date,
      status = "HADIR",
      type = "SISWA",
      classId,
      notes,
    } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID wajib dipilih" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Data pengguna tidak ditemukan" }, { status: 404 });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const now = new Date();

    const newAttendance = await db.attendance.create({
      data: {
        userId,
        classId: classId || null,
        date: attendanceDate,
        type: type || (targetUser.role.includes("pendidik") ? "PENDIDIK" : targetUser.role.includes("admin") ? "MANAJEMEN" : "SISWA"),
        status,
        checkInTime: now,
        notes: notes || "Dicatat Manual oleh Admin",
        verifiedBy: user.name,
      },
      include: {
        user: true,
        class: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Presensi untuk ${targetUser.name} berhasil disimpan!`,
      data: newAttendance,
    });
  } catch (error: any) {
    console.error("POST /api/attendances Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mencatat presensi" },
      { status: 500 }
    );
  }
}

// DELETE /api/attendances - Hapus Catatan Presensi
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID presensi diperlukan" }, { status: 400 });
    }

    await db.attendance.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Catatan presensi berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/attendances Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus presensi" },
      { status: 500 }
    );
  }
}
