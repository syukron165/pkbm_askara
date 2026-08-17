import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  savingAccountsStore,
  savingTransactionsStore,
  SavingAccountItem,
  SavingTransactionItem,
  SavingOwnerType,
  SavingType,
} from "@/lib/tabungan-store";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const ownerType = searchParams.get("ownerType") as SavingOwnerType | "ALL" | null;
    const search = searchParams.get("search")?.toLowerCase();
    const scope = searchParams.get("scope"); // e.g. "my" for personal passbook

    let filtered = [...savingAccountsStore];

    // Role-based scoping
    if (scope === "my") {
      if (user.role === "pendidik") {
        filtered = filtered.filter(
          (a) => a.ownerType === "GURU" || a.ownerEmail === user.email || a.ownerName.toLowerCase().includes("hendra")
        );
      } else if (user.role === "siswa") {
        filtered = filtered.filter(
          (a) => a.ownerType === "SISWA" || a.ownerEmail === user.email || a.ownerName.toLowerCase().includes("budi")
        );
      } else if (user.role === "orang_tua") {
        filtered = filtered.filter(
          (a) => a.ownerType === "ORANG_TUA" || a.ownerEmail === user.email || a.ownerName.toLowerCase().includes("joko")
        );
      } else if (user.role === "admin" || user.role === "bendahara" || user.role === "super_admin") {
        // Can filter or view all
      }
    } else {
      // General filtering if specified
      if (ownerType && ownerType !== "ALL") {
        filtered = filtered.filter((a) => a.ownerType === ownerType);
      }
    }

    if (type && type !== "ALL") {
      filtered = filtered.filter((a) => a.savingType === type);
    }

    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.accountNo.toLowerCase().includes(search) ||
          a.ownerName.toLowerCase().includes(search) ||
          (a.studentName && a.studentName.toLowerCase().includes(search)) ||
          a.savingName.toLowerCase().includes(search) ||
          (a.ownerIdentifier && a.ownerIdentifier.toLowerCase().includes(search)) ||
          (a.nisn && a.nisn.toLowerCase().includes(search))
      );
    }

    // Summary statistics
    const totalBalance = filtered.reduce((acc, curr) => acc + curr.currentBalance, 0);
    const totalTarget = filtered.reduce((acc, curr) => acc + curr.targetAmount, 0);
    const activeAccountsCount = filtered.filter((a) => a.status === "ACTIVE").length;

    const breakdownByOwner = {
      GURU: savingAccountsStore.filter((a) => a.ownerType === "GURU").reduce((acc, c) => acc + c.currentBalance, 0),
      MANAJEMEN: savingAccountsStore.filter((a) => a.ownerType === "MANAJEMEN").reduce((acc, c) => acc + c.currentBalance, 0),
      SISWA: savingAccountsStore.filter((a) => a.ownerType === "SISWA").reduce((acc, c) => acc + c.currentBalance, 0),
      ORANG_TUA: savingAccountsStore.filter((a) => a.ownerType === "ORANG_TUA").reduce((acc, c) => acc + c.currentBalance, 0),
    };

    const breakdownByType = {
      QURBAN: filtered.filter((a) => a.savingType === "QURBAN").reduce((acc, c) => acc + c.currentBalance, 0),
      LIBURAN: filtered.filter((a) => a.savingType === "LIBURAN").reduce((acc, c) => acc + c.currentBalance, 0),
      PENDIDIKAN: filtered.filter((a) => a.savingType === "PENDIDIKAN").reduce((acc, c) => acc + c.currentBalance, 0),
      SUKARELA: filtered.filter((a) => a.savingType === "SUKARELA").reduce((acc, c) => acc + c.currentBalance, 0),
      WISUDA: filtered.filter((a) => a.savingType === "WISUDA").reduce((acc, c) => acc + c.currentBalance, 0),
      HARI_RAYA: filtered.filter((a) => a.savingType === "HARI_RAYA").reduce((acc, c) => acc + c.currentBalance, 0),
      KARYA_VOKASI: filtered.filter((a) => a.savingType === "KARYA_VOKASI").reduce((acc, c) => acc + c.currentBalance, 0),
    };

    return NextResponse.json({
      success: true,
      accounts: filtered,
      total: filtered.length,
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      ownerType = "SISWA",
      ownerName,
      ownerIdentifier,
      ownerPhone,
      ownerEmail,
      studentName,
      nisn,
      packetType = "Paket C",
      parentName,
      phone,
      savingType,
      savingName,
      targetAmount = 0,
      initialDeposit = 0,
      targetDate,
      notes,
    } = body;

    const finalOwnerName = ownerName || studentName || user.name;
    const finalOwnerType: SavingOwnerType = ownerType || (user.role === "pendidik" ? "GURU" : user.role === "orang_tua" ? "ORANG_TUA" : user.role === "siswa" ? "SISWA" : "MANAJEMEN");

    if (!finalOwnerName || !savingType || !savingName) {
      return NextResponse.json({ error: "Nama penabung, jenis program tabungan, dan nama tabungan wajib diisi" }, { status: 400 });
    }

    const id = `tbg-${Date.now()}`;
    const nextSeq = String(savingAccountsStore.length + 1).padStart(3, "0");
    const prefix = finalOwnerType === "GURU" ? "G" : finalOwnerType === "MANAJEMEN" ? "M" : finalOwnerType === "ORANG_TUA" ? "P" : "S";
    const accountNo = `TBG-${new Date().getFullYear()}-${prefix}${nextSeq}`;
    const initDepositNum = parseFloat(initialDeposit) || 0;
    const targetNum = parseFloat(targetAmount) || 0;

    const newAccount: SavingAccountItem = {
      id,
      accountNo,
      ownerType: finalOwnerType,
      ownerName: finalOwnerName,
      ownerIdentifier: ownerIdentifier || (finalOwnerType === "SISWA" ? (nisn ? `NISN: ${nisn}` : packetType) : undefined),
      ownerPhone: ownerPhone || phone || user.phone || undefined,
      ownerEmail: ownerEmail || user.email || undefined,
      studentName: finalOwnerName,
      nisn,
      packetType,
      parentName,
      phone: ownerPhone || phone,
      savingType: savingType as SavingType,
      savingName,
      targetAmount: targetNum,
      currentBalance: initDepositNum,
      status: targetNum > 0 && initDepositNum >= targetNum ? "TARGET_ACHIEVED" : "ACTIVE",
      startDate: new Date().toISOString().slice(0, 10),
      targetDate,
      notes,
      transactionsCount: initDepositNum > 0 ? 1 : 0,
      createdAt: new Date().toISOString(),
    };

    savingAccountsStore.unshift(newAccount);

    // If initial deposit > 0, record first transaction
    if (initDepositNum > 0) {
      const trxId = `trx-${Date.now()}`;
      const receiptNumber = `STR-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(savingTransactionsStore.length + 1).padStart(3, "0")}`;
      savingTransactionsStore.unshift({
        id: trxId,
        accountId: id,
        accountNo,
        ownerType: finalOwnerType,
        ownerName: finalOwnerName,
        studentName: finalOwnerName,
        savingName,
        transactionType: "SETOR",
        amount: initDepositNum,
        balanceAfter: initDepositNum,
        date: new Date().toISOString().slice(0, 10),
        receiptNumber,
        notes: "Setoran awal pembukaan rekening tabungan",
        paymentMethod: "TUNAI",
        recordedByName: user.name || "Bendahara PKBM",
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Rekening Tabungan ${accountNo} atas nama ${finalOwnerName} (${finalOwnerType}) berhasil dibuka!`,
      account: newAccount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal membuka rekening tabungan" }, { status: 500 });
  }
}
