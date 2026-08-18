import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const slips = await prisma.salarySlip.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const parsedSlips = slips.map((s) => ({
      ...s,
      allowances: JSON.parse(s.allowances || "[]"),
      deductions: JSON.parse(s.deductions || "[]"),
      issuedDate: s.issuedDate ? s.issuedDate.toISOString() : undefined,
    }));

    return NextResponse.json({ success: true, data: parsedSlips });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat slip gaji" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // In a real app we'd validate body
    const slip = await prisma.salarySlip.create({
      data: {
        employeeId: body.employeeId,
        month: body.month,
        year: body.year,
        baseSalary: body.baseSalary,
        allowances: JSON.stringify(body.allowances || []),
        deductions: JSON.stringify(body.deductions || []),
        status: body.status || "DRAFT",
        notes: body.notes,
        issuedDate: body.issuedDate ? new Date(body.issuedDate) : null,
      },
    });

    const parsedSlip = {
      ...slip,
      allowances: JSON.parse(slip.allowances),
      deductions: JSON.parse(slip.deductions),
      issuedDate: slip.issuedDate ? slip.issuedDate.toISOString() : undefined,
    };

    return NextResponse.json({ success: true, data: parsedSlip });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat slip gaji" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const slip = await prisma.salarySlip.update({
      where: { id },
      data: {
        status: data.status,
        issuedDate: data.issuedDate ? new Date(data.issuedDate) : null,
      },
    });

    const parsedSlip = {
      ...slip,
      allowances: JSON.parse(slip.allowances),
      deductions: JSON.parse(slip.deductions),
      issuedDate: slip.issuedDate ? slip.issuedDate.toISOString() : undefined,
    };

    return NextResponse.json({ success: true, data: parsedSlip });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal update slip gaji" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await prisma.salarySlip.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal hapus slip gaji" },
      { status: 500 }
    );
  }
}
