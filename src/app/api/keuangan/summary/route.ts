import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/keuangan/summary?month=8&year=2025
// Returns: totalIncome, totalSppIncome, totalOtherIncome, totalExpense, balance, tunggakan, monthly breakdown
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;

  // 1. Total pemasukan SPP (payments LUNAS)
  const paymentsWhere = {
    status: "LUNAS",
    periodYear: year,
    ...(month && { periodMonth: month }),
  };

  const payments = await db.payment.findMany({
    where: paymentsWhere,
    select: { finalAmount: true, periodMonth: true },
  });

  const totalSppIncome = payments.reduce((sum, p) => sum + p.finalAmount, 0);

  // 2. Total pemasukan Non-SPP (OtherIncome: Yayasan, Sumbangan, Hibah, CSR, dll)
  const otherIncomeWhere = {
    periodYear: year,
    ...(month && { periodMonth: month }),
  };

  const otherIncomes = await db.otherIncome.findMany({
    where: otherIncomeWhere,
    select: { amount: true, periodMonth: true, category: true },
  });

  const totalOtherIncome = otherIncomes.reduce((sum, o) => sum + o.amount, 0);

  // Total keseluruhan pemasukan
  const totalIncome = totalSppIncome + totalOtherIncome;

  // 3. Total pengeluaran
  const expensesWhere = {
    periodYear: year,
    ...(month && { periodMonth: month }),
  };

  const expenses = await db.expense.findMany({
    where: expensesWhere,
    select: { amount: true, periodMonth: true, category: true },
  });

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 4. Tunggakan: pembayaran PENDING atau TERLAMBAT
  const tunggakan = await db.payment.aggregate({
    where: { status: { in: ["PENDING", "TERLAMBAT", "SEBAGIAN"] } },
    _sum: { finalAmount: true },
    _count: { id: true },
  });

  // 5. Breakdown per bulan (untuk chart)
  const monthlyIncome: Record<number, number> = {};
  const monthlyExpense: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    monthlyIncome[m] = 0;
    monthlyExpense[m] = 0;
  }
  payments.forEach((p) => {
    monthlyIncome[p.periodMonth] = (monthlyIncome[p.periodMonth] || 0) + p.finalAmount;
  });
  otherIncomes.forEach((o) => {
    monthlyIncome[o.periodMonth] = (monthlyIncome[o.periodMonth] || 0) + o.amount;
  });
  expenses.forEach((e) => {
    monthlyExpense[e.periodMonth] = (monthlyExpense[e.periodMonth] || 0) + e.amount;
  });

  // 6. Breakdown pengeluaran per kategori
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });

  // 7. Breakdown pemasukan non-SPP per kategori
  const otherIncomeByCategory: Record<string, number> = {};
  otherIncomes.forEach((o) => {
    otherIncomeByCategory[o.category] = (otherIncomeByCategory[o.category] || 0) + o.amount;
  });

  // 8. SPP stats
  const sppStats = await db.payment.groupBy({
    by: ["status"],
    where: { feeType: { category: "SPP" }, periodYear: year, ...(month && { periodMonth: month }) },
    _count: { id: true },
    _sum: { finalAmount: true },
  });

  return NextResponse.json({
    year,
    month: month || null,
    totalIncome,
    totalSppIncome,
    totalOtherIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    tunggakan: {
      total: tunggakan._sum.finalAmount || 0,
      count: tunggakan._count.id,
    },
    monthlyIncome,
    monthlyExpense,
    expenseByCategory,
    otherIncomeByCategory,
    sppStats,
  });
}
