import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { savingAccountsStore, savingTransactionsStore } from "@/lib/tabungan-store";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    let trxs = [...savingTransactionsStore];
    if (accountId) {
      trxs = trxs.filter((t) => t.accountId === accountId);
    }

    return NextResponse.json({
      success: true,
      transactions: trxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memuat transaksi tabungan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "bendahara"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      accountId,
      transactionType, // "SETOR" | "TARIK"
      amount,
      paymentMethod = "TUNAI",
      notes,
    } = body;

    if (!accountId || !transactionType || !amount) {
      return NextResponse.json({ error: "Akun tabungan, jenis transaksi, dan nominal wajib diisi" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Nominal transaksi harus lebih besar dari 0" }, { status: 400 });
    }

    const account = savingAccountsStore.find((a) => a.id === accountId);
    if (!account) {
      return NextResponse.json({ error: "Rekening tabungan tidak ditemukan" }, { status: 404 });
    }

    let newBalance = account.currentBalance;
    if (transactionType === "SETOR") {
      newBalance += numAmount;
    } else if (transactionType === "TARIK") {
      if (numAmount > account.currentBalance) {
        return NextResponse.json(
          { error: `Saldo tidak mencukupi untuk penarikan. Saldo saat ini: Rp ${account.currentBalance.toLocaleString("id-ID")}` },
          { status: 400 }
        );
      }
      newBalance -= numAmount;
    } else {
      return NextResponse.json({ error: "Jenis transaksi tidak valid (gunakan SETOR atau TARIK)" }, { status: 400 });
    }

    // Update account balance
    account.currentBalance = newBalance;
    account.transactionsCount += 1;
    if (account.targetAmount > 0 && account.currentBalance >= account.targetAmount) {
      account.status = "TARGET_ACHIEVED";
    } else {
      account.status = "ACTIVE";
    }

    const seq = String(savingTransactionsStore.length + 1).padStart(3, "0");
    const prefix = transactionType === "SETOR" ? "STR" : "TRK";
    const receiptNumber = `${prefix}-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}-${seq}`;

    const trxItem = {
      id: `trx-${Date.now()}`,
      accountId: account.id,
      accountNo: account.accountNo,
      studentName: account.studentName,
      savingName: account.savingName,
      transactionType: transactionType as "SETOR" | "TARIK",
      amount: numAmount,
      balanceAfter: newBalance,
      date: new Date().toISOString().slice(0, 10),
      receiptNumber,
      notes: notes || (transactionType === "SETOR" ? "Setoran tabungan" : "Penarikan tabungan"),
      paymentMethod: paymentMethod as "TUNAI" | "TRANSFER" | "QRIS",
      recordedByName: user.name || "Bendahara",
      createdAt: new Date().toISOString(),
    };

    savingTransactionsStore.unshift(trxItem);

    return NextResponse.json({
      success: true,
      message: `Transaksi ${transactionType} sebesar Rp ${numAmount.toLocaleString("id-ID")} berhasil diproses! Saldo baru: Rp ${newBalance.toLocaleString("id-ID")}`,
      transaction: trxItem,
      account,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memproses transaksi tabungan" }, { status: 500 });
  }
}
