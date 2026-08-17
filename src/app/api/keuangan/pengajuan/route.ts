import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

    // Role-based filtering: pendidik hanya bisa lihat pengajuan diri sendiri
    if (user.role === "pendidik") {
      where.requesterId = user.id;
    }

    if (status) where.status = status;
    if (category) where.category = category;

    const requests = await prisma.expenseRequest.findMany({
      where,
      orderBy: { requestDate: "desc" },
    });

    // Summary stats untuk admin
    const stats =
      user.role !== "pendidik"
        ? {
            pending: await prisma.expenseRequest.count({ where: { status: "PENDING" } }),
            approved: await prisma.expenseRequest.count({ where: { status: "APPROVED" } }),
            revision: await prisma.expenseRequest.count({ where: { status: "REVISION" } }),
            disbursed: await prisma.expenseRequest.count({ where: { status: "DISBURSED" } }),
            totalPending: await prisma.expenseRequest
              .aggregate({ where: { status: "PENDING" }, _sum: { amount: true } })
              .then((r: { _sum: { amount: number | null } }) => r._sum.amount || 0),
          }
        : null;

    return NextResponse.json({ requests, stats });
  } catch (error) {
    console.error("GET /api/keuangan/pengajuan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const initialAuditLog = JSON.stringify([
      {
        action: "SUBMITTED",
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        notes: "Pengajuan dibuat",
      },
    ]);

    const request = await prisma.expenseRequest.create({
      data: {
        ...body,
        requesterId: user.id,
        requesterName: user.name,
        requesterRole: user.role,
        status: "PENDING",
        auditLog: initialAuditLog,
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("POST /api/keuangan/pengajuan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, action, notes, disbursementProofUrl } = body;

    const existing = await prisma.expenseRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let newStatus = existing.status;
    const updateData: Record<string, unknown> = {};

    if (action === "APPROVE") {
      if (!["admin", "super_admin"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      newStatus = "APPROVED";
      updateData.approverId = user.id;
      updateData.approvedAt = new Date();
      updateData.approvalNotes = notes;
    } else if (action === "REJECT") {
      if (!["admin", "super_admin"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      newStatus = "REJECTED";
      updateData.approverId = user.id;
      updateData.approvedAt = new Date();
      updateData.approvalNotes = notes;
    } else if (action === "REVISION") {
      if (!["admin", "super_admin"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      newStatus = "REVISION";
      updateData.approvalNotes = notes;
    } else if (action === "DISBURSE") {
      if (!["admin", "super_admin"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      newStatus = "DISBURSED";
      updateData.disbursedAt = new Date();
      updateData.disbursedById = user.id;
      updateData.disbursementProofUrl = disbursementProofUrl;
    } else if (action === "RESUBMIT") {
      // Pengaju bisa resubmit setelah revision
      if (existing.requesterId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      newStatus = "PENDING";
    }

    // Append audit log
    const currentLog = existing.auditLog ? JSON.parse(existing.auditLog) : [];
    currentLog.push({
      action,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
      notes: notes || "",
    });

    const updated = await prisma.expenseRequest.update({
      where: { id },
      data: { ...updateData, status: newStatus, auditLog: JSON.stringify(currentLog) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/keuangan/pengajuan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
