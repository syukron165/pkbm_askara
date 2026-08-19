import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const ownerType = searchParams.get("ownerType");
    const search = searchParams.get("search")?.toLowerCase();
    const scope = searchParams.get("scope");

    let whereClause: any = {};

    const userRole = (user.role || "") as string;

    // Auto-scope for Siswa, Orang Tua, Guru, and Manajemen
    if (scope === "my" || userRole === "siswa" || userRole === "orang_tua" || userRole === "pendidik" || userRole === "guru" || userRole === "manajemen") {
      if (userRole === "siswa") {
        const studentProfile = await db.student.findFirst({
          where: { userId: user.id },
          include: { user: true }
        });

        whereClause.OR = [
          ...(studentProfile?.id ? [{ studentId: studentProfile.id }] : []),
          { studentName: { contains: user.name, mode: "insensitive" } },
          ...(user.phone ? [{ phone: user.phone }] : []),
          ...(studentProfile?.nisn ? [{ nisn: studentProfile.nisn }] : []),
        ];
      } else if (userRole === "orang_tua") {
        const parentProfile = await db.parent.findFirst({
          where: { userId: user.id },
          include: { students: { include: { user: true } } }
        });
        const firstStudent = parentProfile?.students?.[0];

        whereClause.OR = [
          { parentName: { contains: user.name, mode: "insensitive" } },
          ...(firstStudent?.user?.name ? [{ studentName: { contains: firstStudent.user.name, mode: "insensitive" } }] : []),
          ...(firstStudent?.id ? [{ studentId: firstStudent.id }] : []),
          ...(user.phone ? [{ phone: user.phone }] : []),
        ];
      } else if (userRole === "pendidik" || userRole === "guru" || userRole === "manajemen") {
        whereClause.OR = [
          { studentName: { contains: user.name, mode: "insensitive" } },
          ...(user.phone ? [{ phone: user.phone }] : []),
        ];
      }
    }

    if (type && type !== "ALL") {
      whereClause.savingType = type;
    }

    if (search) {
      whereClause.OR = [
        { accountNo: { contains: search, mode: "insensitive" } },
        { studentName: { contains: search, mode: "insensitive" } },
        { parentName: { contains: search, mode: "insensitive" } },
        { savingName: { contains: search, mode: "insensitive" } },
        { nisn: { contains: search, mode: "insensitive" } },
      ];
    }

    const accounts = await db.studentSavingAccount.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const mappedAccounts = accounts.map(a => {
      let resolvedOwnerType: "GURU" | "MANAJEMEN" | "SISWA" | "ORANG_TUA" = "SISWA";
      const pkt = (a.packetType || "").toLowerCase();
      if (pkt.includes("guru") || pkt.includes("pendidik") || pkt.includes("tutor")) {
        resolvedOwnerType = "GURU";
      } else if (pkt.includes("manajemen") || pkt.includes("staf") || pkt.includes("tu")) {
        resolvedOwnerType = "MANAJEMEN";
      } else if (a.parentName) {
        resolvedOwnerType = "ORANG_TUA";
      } else {
        resolvedOwnerType = "SISWA";
      }

      return {
        id: a.id,
        accountNo: a.accountNo,
        ownerType: resolvedOwnerType,
        ownerName: a.studentName || a.parentName || "Penabung Askara",
        ownerIdentifier: a.nisn ? `NISN: ${a.nisn}` : (a.packetType || "Peserta Didik"),
        ownerPhone: a.phone || "",
        studentName: a.studentName,
        nisn: a.nisn,
        packetType: a.packetType,
        parentName: a.parentName,
        phone: a.phone,
        savingType: a.savingType,
        savingName: a.savingName,
        targetAmount: a.targetAmount,
        currentBalance: a.currentBalance,
        status: a.status,
        startDate: a.startDate.toISOString().slice(0, 10),
        targetDate: a.targetDate ? a.targetDate.toISOString().slice(0, 10) : undefined,
        notes: a.notes,
        transactionsCount: a._count.transactions,
        createdAt: a.createdAt.toISOString()
      };
    });

    const totalBalance = mappedAccounts.reduce((acc, curr) => acc + curr.currentBalance, 0);
    const totalTarget = mappedAccounts.reduce((acc, curr) => acc + curr.targetAmount, 0);
    const activeAccountsCount = mappedAccounts.filter((a) => a.status === "ACTIVE").length;

    const breakdownByOwner = {
      SISWA: mappedAccounts.filter(a => a.ownerType === "SISWA").reduce((acc, c) => acc + c.currentBalance, 0),
      ORANG_TUA: mappedAccounts.filter(a => a.ownerType === "ORANG_TUA").reduce((acc, c) => acc + c.currentBalance, 0),
      GURU: mappedAccounts.filter(a => a.ownerType === "GURU").reduce((acc, c) => acc + c.currentBalance, 0),
      MANAJEMEN: mappedAccounts.filter(a => a.ownerType === "MANAJEMEN").reduce((acc, c) => acc + c.currentBalance, 0),
    };

    const breakdownByType = {
      QURBAN: mappedAccounts.filter((a) => a.savingType === "QURBAN").reduce((acc, c) => acc + c.currentBalance, 0),
      LIBURAN: mappedAccounts.filter((a) => a.savingType === "LIBURAN").reduce((acc, c) => acc + c.currentBalance, 0),
      PENDIDIKAN: mappedAccounts.filter((a) => a.savingType === "PENDIDIKAN").reduce((acc, c) => acc + c.currentBalance, 0),
      SUKARELA: mappedAccounts.filter((a) => a.savingType === "SUKARELA").reduce((acc, c) => acc + c.currentBalance, 0),
      WISUDA: mappedAccounts.filter((a) => a.savingType === "WISUDA").reduce((acc, c) => acc + c.currentBalance, 0),
      HARI_RAYA: mappedAccounts.filter((a) => a.savingType === "HARI_RAYA").reduce((acc, c) => acc + c.currentBalance, 0),
      KARYA_VOKASI: mappedAccounts.filter((a) => a.savingType === "KARYA_VOKASI").reduce((acc, c) => acc + c.currentBalance, 0),
    };

    let finalAccounts = mappedAccounts;
    if (ownerType && ownerType !== "ALL") {
      finalAccounts = finalAccounts.filter(a => a.ownerType === ownerType);
    }

    return NextResponse.json({
      success: true,
      accounts: finalAccounts,
      total: finalAccounts.length,
      metrics: {
        totalBalance,
        totalTarget,
        activeAccountsCount,
        breakdownByOwner,
        breakdownByType,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memuat data tabungan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      studentName,
      ownerName,
      nisn,
      packetType,
      parentName,
      phone,
      ownerPhone,
      savingType,
      savingName,
      targetAmount = 0,
      initialDeposit = 0,
      targetDate,
      notes,
    } = body;

    const isAdminOrBendahara = ["super_admin", "admin", "bendahara", "manajemen"].includes(user.role);

    let finalStudentName = studentName || ownerName || user.name;
    let finalParentName = parentName || "";
    let finalPhone = phone || ownerPhone || user.phone || "";
    let finalNisn = nisn || "";
    let finalPacket = packetType || "Paket C";
    let finalStudentId: string | undefined = undefined;

    const userRole = (user.role || "") as string;

    // Auto-detect student / parent / guru / manajemen details from logged-in account
    if (userRole === "siswa") {
      finalStudentName = user.name;
      finalPhone = user.phone || finalPhone;
      const studentProfile = await db.student.findFirst({
        where: { userId: user.id }
      });
      if (studentProfile) {
        finalStudentId = studentProfile.id;
        finalNisn = studentProfile.nisn || finalNisn;
        finalPacket = studentProfile.packetType || finalPacket;
      }
    } else if (userRole === "orang_tua") {
      finalParentName = user.name;
      finalPhone = user.phone || finalPhone;
      const parentProfile = await db.parent.findFirst({
        where: { userId: user.id },
        include: { students: { include: { user: true } } }
      });
      if (parentProfile && parentProfile.students && parentProfile.students.length > 0) {
        const firstStudent = parentProfile.students[0];
        finalStudentId = firstStudent.id;
        finalStudentName = firstStudent.user?.name || `${user.name} (Anak)`;
        finalNisn = firstStudent.nisn || finalNisn;
        finalPacket = firstStudent.packetType || finalPacket;
      } else {
        finalStudentName = `${user.name} (Keluarga)`;
      }
    } else if (userRole === "pendidik" || userRole === "guru" || userRole.includes("pendidik") || userRole.includes("guru")) {
      finalStudentName = user.name;
      finalPhone = user.phone || finalPhone;
      finalPacket = "Pendidik / Guru Askara";
    } else if (userRole === "manajemen") {
      finalStudentName = user.name;
      finalPhone = user.phone || finalPhone;
      finalPacket = "Staf Manajemen Lembaga";
    }

    if (!finalStudentName || !savingType || !savingName) {
      return NextResponse.json({ error: "Nama penabung, jenis program, dan nama tabungan wajib diisi" }, { status: 400 });
    }

    const count = await db.studentSavingAccount.count();
    const nextSeq = String(count + 1).padStart(3, "0");
    const accountNo = `TBG-${new Date().getFullYear()}-S${nextSeq}`;
    
    // Only Admin & Bendahara can record immediate initial deposit
    const initDepositNum = isAdminOrBendahara ? (parseFloat(initialDeposit) || 0) : 0;
    const targetNum = parseFloat(targetAmount) || 0;
    const status = (targetNum > 0 && initDepositNum >= targetNum) ? "TARGET_ACHIEVED" : "ACTIVE";

    const newAccount = await db.studentSavingAccount.create({
      data: {
        accountNo,
        studentId: finalStudentId,
        studentName: finalStudentName,
        nisn: finalNisn,
        packetType: finalPacket,
        parentName: finalParentName,
        phone: finalPhone,
        savingType,
        savingName,
        targetAmount: targetNum,
        currentBalance: initDepositNum,
        status,
        targetDate: targetDate ? new Date(targetDate) : null,
        notes,
      }
    });

    if (initDepositNum > 0) {
      const trxCount = await db.savingTransaction.count();
      const receiptNumber = `STR-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(trxCount + 1).padStart(3, "0")}`;
      
      await db.savingTransaction.create({
        data: {
          accountId: newAccount.id,
          transactionType: "SETOR",
          amount: initDepositNum,
          balanceAfter: initDepositNum,
          receiptNumber,
          notes: "Setoran awal pembukaan rekening tabungan oleh Bendahara",
          paymentMethod: "TUNAI",
          recordedById: user.id
        }
      });
    }

    // Send in-app notification to Super Admin & Bendahara about new saving account opened
    try {
      const admins = await db.user.findMany({
        where: {
          role: { in: ["super_admin", "admin", "bendahara"] },
          isActive: true,
        },
        select: { id: true }
      });

      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map((adm) => ({
            userId: adm.id,
            title: `Pembukaan Rekening Tabungan Baru 🏦`,
            message: `${user.name} (${user.role.toUpperCase()}) telah membuka rekening/pos tabungan baru: "${savingName}" (${accountNo}) dengan target Rp ${(targetNum || 0).toLocaleString("id-ID")}.`,
            type: "INFO",
            actionUrl: "/admin/tabungan",
          }))
        });
      }
    } catch (e) {
      console.error("[NOTIF_ADMIN_SAVING_ERROR]", e);
    }

    return NextResponse.json({
      success: true,
      message: `Rekening Tabungan ${accountNo} (${savingName}) berhasil dibuat dan disinkronkan dengan Bendahara!`,
      account: newAccount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal membuka rekening tabungan" }, { status: 500 });
  }
}
