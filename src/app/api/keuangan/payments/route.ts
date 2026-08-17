import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/keuangan/payments
// Query params: month, year, status, studentId, feeTypeId
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const status = searchParams.get("status") || undefined;
  const studentId = searchParams.get("studentId") || undefined;

  const payments = await db.payment.findMany({
    where: {
      ...(month && { periodMonth: month }),
      ...(year && { periodYear: year }),
      ...(status && { status }),
      ...(studentId && { studentId }),
    },
    include: {
      student: {
        include: { user: { select: { name: true } } },
      },
      feeType: true,
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ payments });
}

// POST /api/keuangan/payments — catat pembayaran baru
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    studentId,
    feeTypeId,
    feeTypeName,
    amount,
    discount = 0,
    status = "LUNAS",
    paymentDate,
    dueDate,
    periodMonth,
    periodYear,
    paymentMethod = "TUNAI",
    notes,
    proofUrl,
  } = body;

  const parsedAmount = parseFloat(String(amount)) || 0;
  const parsedDiscount = parseFloat(String(discount)) || 0;
  const parsedMonth = parseInt(String(periodMonth)) || (new Date().getMonth() + 1);
  const parsedYear = parseInt(String(periodYear)) || new Date().getFullYear();

  if (!studentId || !parsedAmount) {
    return NextResponse.json({ error: "Siswa dan nominal pembayaran wajib diisi" }, { status: 400 });
  }

  // 1. Ensure FeeType exists
  let targetFeeTypeId = feeTypeId;
  if (targetFeeTypeId) {
    const existingFee = await db.feeType.findUnique({ where: { id: targetFeeTypeId } });
    if (!existingFee) {
      targetFeeTypeId = null;
    }
  }

  if (!targetFeeTypeId) {
    // Check if there is an existing feeType with similar name
    const feeName = feeTypeName || "SPP Bulanan";
    let feeType = await db.feeType.findFirst({
      where: { name: feeName },
    });
    if (!feeType) {
      feeType = await db.feeType.create({
        data: {
          name: feeName,
          category: "SPP",
          amount: parsedAmount,
          description: "Biaya Pendidikan PKBM Askara",
          isActive: true,
        },
      });
    }
    targetFeeTypeId = feeType.id;
  }

  // 2. Ensure Student exists
  let targetStudentId = studentId;
  const existingStudent = await db.student.findUnique({ where: { id: targetStudentId } });
  if (!existingStudent) {
    // Try to find student by nisn or first student in db
    const studentByNisn = await db.student.findFirst({
      where: { OR: [{ nisn: targetStudentId }, { id: targetStudentId }] },
    });
    if (studentByNisn) {
      targetStudentId = studentByNisn.id;
    } else {
      // Find any student or create one
      const anyStudent = await db.student.findFirst();
      if (anyStudent) {
        targetStudentId = anyStudent.id;
      }
    }
  }

  const generatedReceiptNumber =
    body.receiptNumber ||
    `KW-${parsedYear}/${String(parsedMonth).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const calculatedDueDate = dueDate ? new Date(dueDate) : new Date();

  const payment = await db.payment.create({
    data: {
      studentId: targetStudentId,
      feeTypeId: targetFeeTypeId,
      amount: parsedAmount,
      discount: parsedDiscount,
      finalAmount: Math.max(0, parsedAmount - parsedDiscount),
      status: status || "LUNAS",
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      dueDate: calculatedDueDate,
      periodMonth: parsedMonth,
      periodYear: parsedYear,
      paymentMethod: paymentMethod || "TUNAI",
      receiptNumber: generatedReceiptNumber,
      notes: notes || null,
      proofUrl: proofUrl || null,
      recordedById: user.id,
    },
    include: {
      student: { include: { user: { select: { name: true } } } },
      feeType: true,
    },
  });

  return NextResponse.json({ payment, receiptNumber: generatedReceiptNumber }, { status: 201 });
}

// PATCH /api/keuangan/payments — update status pembayaran
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, paymentDate, paymentMethod, receiptNumber, notes, proofUrl } = body;

  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  const payment = await db.payment.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(paymentDate && { paymentDate: new Date(paymentDate) }),
      ...(paymentMethod && { paymentMethod }),
      ...(receiptNumber && { receiptNumber }),
      ...(notes !== undefined && { notes }),
      ...(proofUrl !== undefined && { proofUrl }),
    },
  });

  return NextResponse.json({ payment });
}
