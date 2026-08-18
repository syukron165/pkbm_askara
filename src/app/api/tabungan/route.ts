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

    if (scope === "my") {
      if (user.role === "siswa" || user.role === "orang_tua") {
        whereClause.OR = [
          { studentName: { contains: user.name } },
          { phone: user.phone },
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
      orderBy: { createdAt: 'desc' }
    });

    const mappedAccounts = accounts.map(a => ({
      id: a.id,
      accountNo: a.accountNo,
      ownerType: "SISWA",
      ownerName: a.studentName,
      ownerIdentifier: a.nisn ? `NISN: ${a.nisn}` : a.packetType,
      ownerPhone: a.phone,
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
      startDate: a.startDate.toISOString().slice(0,10),
      targetDate: a.targetDate ? a.targetDate.toISOString().slice(0,10) : undefined,
      notes: a.notes,
      transactionsCount: a._count.transactions,
      createdAt: a.createdAt.toISOString()
    }));

    const totalBalance = mappedAccounts.reduce((acc, curr) => acc + curr.currentBalance, 0);
    const totalTarget = mappedAccounts.reduce((acc, curr) => acc + curr.targetAmount, 0);
    const activeAccountsCount = mappedAccounts.filter((a) => a.status === "ACTIVE").length;

    const breakdownByOwner = {
      SISWA: totalBalance,
      GURU: 0,
      MANAJEMEN: 0,
      ORANG_TUA: 0
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

    return NextResponse.json({
      success: true,
      accounts: mappedAccounts,
      total: mappedAccounts.length,
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
      packetType = "Paket C",
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

    const finalStudentName = studentName || ownerName || user.name;
    const finalPhone = phone || ownerPhone || user.phone || "";

    if (!finalStudentName || !savingType || !savingName) {
      return NextResponse.json({ error: "Nama penabung, jenis program, dan nama tabungan wajib diisi" }, { status: 400 });
    }

    const count = await db.studentSavingAccount.count();
    const nextSeq = String(count + 1).padStart(3, "0");
    const accountNo = `TBG-${new Date().getFullYear()}-S${nextSeq}`;
    
    const initDepositNum = parseFloat(initialDeposit) || 0;
    const targetNum = parseFloat(targetAmount) || 0;
    const status = (targetNum > 0 && initDepositNum >= targetNum) ? "TARGET_ACHIEVED" : "ACTIVE";

    const newAccount = await db.studentSavingAccount.create({
      data: {
        accountNo,
        studentName: finalStudentName,
        nisn,
        packetType,
        parentName,
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
          notes: "Setoran awal pembukaan rekening tabungan",
          paymentMethod: "TUNAI",
          recordedById: user.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Rekening Tabungan ${accountNo} berhasil dibuka!`,
      account: newAccount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal membuka rekening tabungan" }, { status: 500 });
  }
}
