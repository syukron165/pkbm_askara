import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch data from major tables
    const [
      users,
      students,
      parents,
      classes,
      subjects,
      schedules,
      attendances,
      digitalLibrary,
      studyClubs,
      payments,
      expenses
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.student.findMany(),
      prisma.parent.findMany(),
      prisma.class.findMany(),
      prisma.subject.findMany(),
      prisma.classSchedule.findMany(),
      prisma.attendance.findMany(),
      prisma.digitalLibrary.findMany(),
      prisma.studyClub.findMany(),
      prisma.payment.findMany(),
      prisma.expense.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      data: {
        users,
        students,
        parents,
        classes,
        subjects,
        schedules,
        attendances,
        digitalLibrary,
        studyClubs,
        payments,
        expenses,
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `pkbm-askara-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ error: "Gagal membuat backup database" }, { status: 500 });
  }
}
