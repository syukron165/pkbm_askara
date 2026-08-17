import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/keuangan/other-income
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  const incomes = await db.otherIncome.findMany({
    where: {
      ...(month && { periodMonth: month }),
      ...(year && { periodYear: year }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { sourceName: { contains: search } },
          { receiptNumber: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { incomeDate: "desc" }],
  });

  // Total per category
  const totalByCategory = incomes.reduce(
    (acc: Record<string, number>, inc) => {
      acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
      return acc;
    },
    {}
  );

  const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  return NextResponse.json({ incomes, totalByCategory, total });
}

// POST /api/keuangan/other-income
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    category,
    amount,
    incomeDate,
    periodMonth,
    periodYear,
    sourceName,
    paymentMethod,
    receiptNumber,
    description,
    proofUrl,
  } = body;

  if (!title || !category || !amount || !incomeDate || !periodMonth || !periodYear) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const generatedReceipt =
    receiptNumber ||
    `P-NON-${periodYear}/${String(periodMonth).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const otherIncome = await db.otherIncome.create({
    data: {
      title,
      category,
      amount: parseFloat(amount),
      incomeDate: new Date(incomeDate),
      periodMonth: parseInt(periodMonth),
      periodYear: parseInt(periodYear),
      sourceName: sourceName || null,
      paymentMethod: paymentMethod || "TRANSFER",
      receiptNumber: generatedReceipt,
      description: description || null,
      proofUrl: proofUrl || null,
      recordedById: user.id,
    },
  });

  return NextResponse.json({ otherIncome }, { status: 201 });
}

// DELETE /api/keuangan/other-income?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  await db.otherIncome.delete({ where: { id } });
  return NextResponse.json({ message: "Berhasil dihapus" });
}
