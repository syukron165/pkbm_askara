import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const attendances = await prisma.attendance.findMany({
      include: {
        user: true,
        class: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to recent 100 for performance
    });

    const logs = attendances.map((att) => ({
      id: att.id,
      studentName: att.user.name,
      nis: att.user.username,
      className: att.class?.name || "Umum",
      sessionTitle: "Kelas Reguler",
      type: "MAPEL",
      teacherName: "-", // Could fetch from class schedule if needed
      date: att.date.toISOString().split("T")[0],
      checkInTime: att.checkInTime ? att.checkInTime.toISOString().split("T")[1].substring(0, 5) : "-",
      method: "GPS_MANDIRI",
      status: att.status,
    }));

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat presensi" },
      { status: 500 }
    );
  }
}
