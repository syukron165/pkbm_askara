import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/keuangan/expenses
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const category = searchParams.get("category") || undefined;

  const expenses = await db.expense.findMany({
    where: {
      ...(month && { periodMonth: month }),
      ...(year && { periodYear: year }),
      ...(category && { category }),
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { expenseDate: "desc" }],
  });

  // Total per category
  const totalByCategory = expenses.reduce(
    (acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    },
    {}
  );

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({ expenses, totalByCategory, total });
}

// POST /api/keuangan/expenses
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, category, amount, expenseDate, periodMonth, periodYear, payee, description, receiptUrl } = body;

  if (!title || !category || !amount || !expenseDate || !periodMonth || !periodYear) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const expense = await db.expense.create({
    data: {
      title,
      category,
      amount: parseFloat(amount),
      expenseDate: new Date(expenseDate),
      periodMonth: parseInt(periodMonth),
      periodYear: parseInt(periodYear),
      payee,
      description,
      receiptUrl: receiptUrl || null,
      recordedById: user.id,
    },
  });

  return NextResponse.json({ expense }, { status: 201 });
}

// DELETE /api/keuangan/expenses?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  await db.expense.delete({ where: { id } });
  return NextResponse.json({ message: "Berhasil dihapus" });
}
