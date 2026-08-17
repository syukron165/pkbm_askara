import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/keuangan/orang-tua/payments
// Returns payments for children of the currently logged-in parent
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "orang_tua") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get parent profile
  const parent = await db.parent.findUnique({
    where: { userId: user.id },
    include: {
      students: {
        include: {
          user: { select: { name: true } },
          payments: {
            include: { feeType: true },
            orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
          },
        },
      },
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "Profil orang tua tidak ditemukan" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
  const studentId = searchParams.get("studentId") || undefined;

  // Build payments summary per student
  const studentsData = parent.students
    .filter((s) => !studentId || s.id === studentId)
    .map((student) => {
      const allPayments = student.payments;
      const yearPayments = allPayments.filter((p) => p.periodYear === year);

      const totalPaid = yearPayments
        .filter((p) => p.status === "LUNAS")
        .reduce((sum, p) => sum + p.finalAmount, 0);

      const totalTagihan = yearPayments.reduce((sum, p) => sum + p.finalAmount, 0);
      const totalTunggakan = yearPayments
        .filter((p) => ["PENDING", "TERLAMBAT", "SEBAGIAN"].includes(p.status))
        .reduce((sum, p) => sum + p.finalAmount, 0);

      // Group by month
      const byMonth: Record<number, typeof allPayments> = {};
      for (let m = 1; m <= 12; m++) byMonth[m] = [];
      yearPayments.forEach((p) => {
        if (!byMonth[p.periodMonth]) byMonth[p.periodMonth] = [];
        byMonth[p.periodMonth].push(p);
      });

      return {
        studentId: student.id,
        studentName: student.user.name,
        nisn: student.nisn,
        packetType: student.packetType,
        totalPaid,
        totalTagihan,
        totalTunggakan,
        recentPayments: allPayments.slice(0, 10),
        yearPayments,
        byMonth,
      };
    });

  // Current month active bills
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const activeBills = await db.payment.findMany({
    where: {
      studentId: { in: parent.students.map((s) => s.id) },
      periodMonth: currentMonth,
      periodYear: currentYear,
      status: { in: ["PENDING", "TERLAMBAT", "SEBAGIAN"] },
    },
    include: { feeType: true, student: { include: { user: { select: { name: true } } } } },
  });

  return NextResponse.json({
    parent: {
      id: parent.id,
      relationship: parent.relationship,
    },
    students: studentsData,
    activeBills,
    currentMonth,
    currentYear,
  });
}
