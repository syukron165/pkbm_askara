import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized / Silakan login kembali" }, { status: 401 });
        }

        // 1. Ambil data profil siswa beserta enrollments kelasnya dari Prisma DB
        const student = await db.student.findUnique({
            where: { userId: user.id },
            include: {
                user: true,
                enrollments: { include: { class: true } },
            },
        });

        // 2. Tarik seluruh catatan presensi siswa dari tabel Attendance Prisma DB
        const attendances = await db.attendance.findMany({
            where: { userId: user.id },
            orderBy: { checkInTime: "desc" },
        });

        // 3. Mapping data presensi riil dari DB
        const historyData = attendances.map((att) => ({
            id: att.id,
            date: new Date(att.date).toISOString().split("T")[0],
            title: att.notes || "Presensi Sesi Pembelajaran",
            type: "MAPEL",
            teacherOrMentor: "Tutor Pengampu",
            checkInTime: att.checkInTime
                ? new Date(att.checkInTime).toLocaleTimeString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    hour: "2-digit",
                    minute: "2-digit",
                }) + " WIB"
                : "-",
            method: "SCAN_QR_GURU",
            status: att.status || "HADIR",
        }));

        return NextResponse.json({
            success: true,
            student: {
                id: student?.id || user.id,
                name: student?.user?.name || user.name,
                nisn: student?.nisn || "-",
                className:
                    student?.enrollments?.[0]?.class?.name || student?.packetType || "Paket C",
            },
            data: historyData,
        });
    } catch (error: any) {
        console.error("Error fetching student attendance history:", error);
        return NextResponse.json(
            { success: false, error: "Gagal memuat data presensi dari database" },
            { status: 500 }
        );
    }
}