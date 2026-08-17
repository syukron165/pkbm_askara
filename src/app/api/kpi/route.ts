import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period"); // "2025-10" or "2025-S1"
    const assignedToId = searchParams.get("assignedToId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    // Pendidik hanya lihat tugas mereka sendiri
    if (user.role === "pendidik") {
      where.assignedToId = user.id;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (period) where.kpiPeriod = period;
    if (status) where.status = status;

    // Auto-mark overdue tasks
    await prisma.kpiTask.updateMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { lt: new Date() },
      },
      data: { status: "OVERDUE" },
    });

    const tasks = await prisma.kpiTask.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    // KPI stats
    const allTasks = user.role === "pendidik"
      ? tasks
      : await prisma.kpiTask.findMany({ where: period ? { kpiPeriod: period } : {} });

    type TaskItem = { status: string; achievementScore: number | null };
    const stats = {
      todo: allTasks.filter((t: TaskItem) => t.status === "TODO").length,
      inProgress: allTasks.filter((t: TaskItem) => t.status === "IN_PROGRESS").length,
      underReview: allTasks.filter((t: TaskItem) => t.status === "UNDER_REVIEW").length,
      completed: allTasks.filter((t: TaskItem) => t.status === "COMPLETED").length,
      overdue: allTasks.filter((t: TaskItem) => t.status === "OVERDUE").length,
      avgScore:
        allTasks.filter((t: TaskItem) => t.achievementScore !== null).length > 0
          ? allTasks
              .filter((t: TaskItem) => t.achievementScore !== null)
              .reduce((acc: number, t: TaskItem) => acc + (t.achievementScore || 0), 0) /
            allTasks.filter((t: TaskItem) => t.achievementScore !== null).length
          : 0,
    };

    // Available periods
    const periods = await prisma.kpiTask.findMany({
      select: { kpiPeriod: true },
      distinct: ["kpiPeriod"],
      orderBy: { kpiPeriod: "desc" },
    });

    // Fetch management and teacher users from DB
    const dbUsers = await prisma.user.findMany({
      where: {
        role: { in: ["super_admin", "admin", "pendidik"] },
        isActive: true,
      },
      select: { id: true, name: true, role: true, email: true },
    });

    // Default structural management staff
    const defaultManajemen = [
      { id: "mgt-1", name: "Dra. Hj. Siti Aminah, M.Pd.", role: "Kepala PKBM / Penanggung Jawab", email: "kepala@askara.sch.id" },
      { id: "mgt-2", name: "Administrator Utama", role: "Super Admin Sistem", email: "admin@askara.sch.id" },
      { id: "mgt-3", name: "Drs. Hendra Gunawan", role: "Wakil Kepala PKBM & Kurikulum", email: "hendra@askara.sch.id" },
      { id: "mgt-4", name: "Rina Marlina, S.Sos.", role: "Kepala Tata Usaha & Administrasi", email: "tu@askara.sch.id" },
      { id: "mgt-5", name: "Maya Indriani, S.E.", role: "Bendahara & Tim Keuangan", email: "keuangan@askara.sch.id" },
      { id: "mgt-6", name: "Bayu Pratama, S.Kom.", role: "Operator Dapodik & IT Support", email: "it@askara.sch.id" },
      { id: "mgt-7", name: "Ahmad Fauzan, S.Pd.", role: "Koordinator Kesiswaan & Club Belajar", email: "kesiswaan@askara.sch.id" },
      { id: "mgt-8", name: "Dewi Anggraini, S.Kom.", role: "Koordinator Sarpras & Lab Vokasi", email: "sarpras@askara.sch.id" },
    ];

    // Default teachers
    const defaultGuru = [
      { id: "t-1", name: "Drs. Hendra Gunawan", role: "Tutor Matematika & IPA (Paket C)", email: "hendra@askara.sch.id" },
      { id: "t-2", name: "Nurul Aini, S.Pd.", role: "Tutor Bahasa Indonesia (Paket B & C)", email: "nurul@askara.sch.id" },
      { id: "t-3", name: "Bambang Sutrisno, M.Si.", role: "Tutor IPA & Sains (Paket A & B)", email: "bambang@askara.sch.id" },
      { id: "t-4", name: "Dewi Anggraini, S.Kom.", role: "Instruktur Vokasi & Keterampilan", email: "dewi@askara.sch.id" },
      { id: "t-5", name: "Bayu Pratama, S.Kom.", role: "Instruktur Multimedia & Desain Grafis", email: "bayu@askara.sch.id" },
      { id: "t-6", name: "Siti Rahmawati, S.Pd.", role: "Tutor IPS & Humaniora (Paket B & C)", email: "siti.rahmawati@askara.sch.id" },
      { id: "t-7", name: "Rahmat Hidayat, S.Pd.I.", role: "Tutor Pend. Agama & Budi Pekerti", email: "rahmat@askara.sch.id" },
      { id: "t-8", name: "Farida Hanum, S.Pd.", role: "Tutor Bahasa Inggris (Paket B & C)", email: "farida@askara.sch.id" },
      { id: "t-9", name: "Arif Kurniawan, S.Pd.", role: "Tutor PKn & Kebangsaan", email: "arif@askara.sch.id" },
    ];

    // Merge DB users into assignees list avoiding duplicates
    const assigneesManajemen = [...defaultManajemen];
    const assigneesGuru = [...defaultGuru];

    dbUsers.forEach((u) => {
      if (["super_admin", "admin"].includes(u.role)) {
        if (!assigneesManajemen.some((m) => m.id === u.id || m.email === u.email)) {
          assigneesManajemen.push({
            id: u.id,
            name: u.name,
            role: u.role === "super_admin" ? "Super Admin" : "Administrator",
            email: u.email,
          });
        }
      } else if (u.role === "pendidik") {
        if (!assigneesGuru.some((g) => g.id === u.id || g.email === u.email)) {
          assigneesGuru.push({
            id: u.id,
            name: u.name,
            role: "Pendidik / Tutor",
            email: u.email,
          });
        }
      }
    });

    return NextResponse.json({
      tasks,
      stats,
      periods: periods.map((p: { kpiPeriod: string }) => p.kpiPeriod),
      assignees: {
        manajemen: assigneesManajemen,
        guru: assigneesGuru,
      },
    });
  } catch (error) {
    console.error("GET /api/kpi error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const assignedToId = (!body.assignedToId || body.assignedToId === "self") ? user.id : body.assignedToId;

    const task = await prisma.kpiTask.create({
      data: {
        ...body,
        assignedToId,
        assignedById: user.id,
        isSelftask: assignedToId === user.id,
        dueDate: new Date(body.dueDate),
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/kpi error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, action, reviewNotes, achievementScore, ...rest } = body;

    const existing = await prisma.kpiTask.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: Record<string, unknown> = { ...rest };

    if (action === "START") {
      updateData.status = "IN_PROGRESS";
      updateData.startedAt = new Date();
    } else if (action === "SUBMIT_REVIEW") {
      updateData.status = "UNDER_REVIEW";
    } else if (action === "APPROVE_COMPLETE") {
      if (!["admin", "super_admin"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();
      updateData.reviewNotes = reviewNotes;
      updateData.reviewedById = user.id;
      updateData.reviewedAt = new Date();
      updateData.achievementScore = achievementScore;
    } else if (action === "REJECT_REVIEW") {
      if (!["admin", "super_admin"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      updateData.status = "IN_PROGRESS";
      updateData.reviewNotes = reviewNotes;
    }

    const updated = await prisma.kpiTask.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/kpi error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.kpiTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/kpi error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
