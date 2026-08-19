import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/tabungan/target-request
// Mengambil daftar pengajuan perubahan target tabungan
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const accountId = searchParams.get("accountId");

    const userRole = (user.role || "") as string;
    const isAdminOrBendahara = ["super_admin", "admin", "bendahara"].includes(userRole);

    let whereClause: any = {};

    if (!isAdminOrBendahara) {
      whereClause.requestedById = user.id;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (accountId) {
      whereClause.accountId = accountId;
    }

    const requests = await db.savingTargetRequest.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            id: true,
            accountNo: true,
            savingName: true,
            savingType: true,
            currentBalance: true,
            targetAmount: true,
            studentName: true,
            parentName: true,
            packetType: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        accountId: r.accountId,
        accountNo: r.account?.accountNo,
        savingName: r.account?.savingName,
        savingType: r.account?.savingType,
        currentBalance: r.account?.currentBalance,
        penabungName: r.account?.studentName || r.account?.parentName || r.requestedByName,
        currentAmount: r.currentAmount,
        requestedAmount: r.requestedAmount,
        requestedDate: r.requestedDate ? r.requestedDate.toISOString().slice(0, 10) : undefined,
        reason: r.reason,
        status: r.status,
        requestedById: r.requestedById,
        requestedByName: r.requestedByName,
        requestedByRole: r.requestedByRole,
        reviewedById: r.reviewedById,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
        reviewNotes: r.reviewNotes,
        createdAt: r.createdAt.toISOString(),
      })),
      pendingCount: requests.filter((r) => r.status === "PENDING").length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal memuat pengajuan target tabungan" },
      { status: 500 }
    );
  }
}

// POST /api/tabungan/target-request
// Siswa, Orang Tua, Guru/Tutor, Manajemen: Mengajukan perubahan target rencana tabungan
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { accountId, requestedAmount, requestedDate, reason } = body;

    if (!accountId || !requestedAmount || !reason) {
      return NextResponse.json(
        { error: "Akun tabungan, nominal target baru, dan alasan pengajuan wajib diisi" },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(requestedAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal target rencana tabungan baru harus berupa angka lebih dari 0" },
        { status: 400 }
      );
    }

    const account = await db.studentSavingAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Rekening tabungan tidak ditemukan" }, { status: 404 });
    }

    // Check if there is already a pending request for this account
    const existingPending = await db.savingTargetRequest.findFirst({
      where: {
        accountId,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        {
          error:
            "Sudah ada pengajuan perubahan target yang berstatus Menunggu Persetujuan Bendahara untuk rekening ini. Harap tunggu verifikasi Bendahara.",
        },
        { status: 400 }
      );
    }

    const newRequest = await db.savingTargetRequest.create({
      data: {
        accountId,
        currentAmount: account.targetAmount,
        requestedAmount: numAmount,
        requestedDate: requestedDate ? new Date(requestedDate) : null,
        reason: reason.trim(),
        status: "PENDING",
        requestedById: user.id,
        requestedByName: user.name,
        requestedByRole: user.role,
      },
    });

    // Send in-app notification to all Super Admin & Bendahara
    try {
      const admins = await db.user.findMany({
        where: {
          role: { in: ["super_admin", "admin", "bendahara"] },
          isActive: true,
        },
        select: { id: true },
      });

      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map((adm) => ({
            userId: adm.id,
            title: `Pengajuan Perubahan Target Tabungan 📝`,
            message: `${user.name} (${user.role.toUpperCase()}) mengajukan perubahan target pos tabungan "${account.savingName}" (${account.accountNo}) dari Rp ${account.targetAmount.toLocaleString("id-ID")} menjadi Rp ${numAmount.toLocaleString("id-ID")}. Alasan: "${reason}".`,
            type: "INFO",
            actionUrl: "/admin/tabungan",
          })),
        });
      }
    } catch (e) {
      console.error("[NOTIF_TARGET_REQUEST_ERROR]", e);
    }

    return NextResponse.json({
      success: true,
      message: `Pengajuan perubahan target tabungan berhasil dikirim! Menunggu persetujuan dari Bendahara Lembaga.`,
      request: newRequest,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengajukan perubahan target tabungan" },
      { status: 500 }
    );
  }
}

// PUT /api/tabungan/target-request
// Khusus Super Admin & Bendahara: Menyetujui (APPROVE) atau Menolak (REJECT) pengajuan perubahan target
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = (user.role || "") as string;
    if (!["super_admin", "admin", "bendahara"].includes(userRole)) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Admin dan Bendahara yang berwenang meninjau pengajuan perubahan target." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, action, reviewNotes } = body;

    if (!requestId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "ID pengajuan dan tindakan valid (APPROVE / REJECT) wajib disertakan" },
        { status: 400 }
      );
    }

    const request = await db.savingTargetRequest.findUnique({
      where: { id: requestId },
      include: { account: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: `Pengajuan ini sudah pernah diproses sebelumnya (Status: ${request.status})` },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      const newTarget = request.requestedAmount;
      let newStatus = request.account.status;
      if (newTarget > 0 && request.account.currentBalance >= newTarget) {
        newStatus = "TARGET_ACHIEVED";
      } else if (newStatus === "TARGET_ACHIEVED" && request.account.currentBalance < newTarget) {
        newStatus = "ACTIVE";
      }

      // 1. Update Request
      const updatedReq = await db.savingTargetRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || "Disetujui oleh Bendahara",
        },
      });

      // 2. Update Saving Account targetAmount
      await db.studentSavingAccount.update({
        where: { id: request.accountId },
        data: {
          targetAmount: newTarget,
          ...(request.requestedDate ? { targetDate: request.requestedDate } : {}),
          status: newStatus,
        },
      });

      // 3. Notify requester
      await db.notification.create({
        data: {
          userId: request.requestedById,
          title: `Target Tabungan Disetujui! ✅`,
          message: `Selamat! Pengajuan perubahan target tabungan "${request.account.savingName}" (${request.account.accountNo}) menjadi Rp ${newTarget.toLocaleString("id-ID")} telah DISETUJUI oleh Bendahara.`,
          type: "INFO",
          actionUrl: request.requestedByRole === "siswa" ? "/siswa/tabungan" : request.requestedByRole === "orang_tua" ? "/orang-tua/tabungan" : "/guru/tabungan",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Pengajuan perubahan target disetujui! Target rekening ${request.account.accountNo} resmi diperbarui menjadi Rp ${newTarget.toLocaleString("id-ID")}.`,
        request: updatedReq,
      });
    } else {
      // REJECT
      const updatedReq = await db.savingTargetRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || "Ditolak oleh Bendahara",
        },
      });

      // Notify requester
      await db.notification.create({
        data: {
          userId: request.requestedById,
          title: `Pengajuan Target Tabungan Ditolak ⚠️`,
          message: `Pengajuan perubahan target tabungan "${request.account.savingName}" (${request.account.accountNo}) DITOLAK oleh Bendahara. Catatan: "${reviewNotes || "Tidak ada catatan khusus"}".`,
          type: "WARNING",
          actionUrl: request.requestedByRole === "siswa" ? "/siswa/tabungan" : request.requestedByRole === "orang_tua" ? "/orang-tua/tabungan" : "/guru/tabungan",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Pengajuan perubahan target telah ditolak. Notifikasi telah dikirimkan ke pemohon.`,
        request: updatedReq,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal memproses peninjauan target tabungan" },
      { status: 500 }
    );
  }
}
