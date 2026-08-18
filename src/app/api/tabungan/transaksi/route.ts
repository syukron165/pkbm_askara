import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    let whereClause: any = {};
    if (accountId) {
      whereClause.accountId = accountId;
    }

    const trxs = await db.savingTransaction.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            accountNo: true,
            studentName: true,
            savingName: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedTrxs = trxs.map(t => ({
      id: t.id,
      accountId: t.accountId,
      accountNo: t.account.accountNo,
      ownerType: "SISWA",
      ownerName: t.account.studentName,
      studentName: t.account.studentName,
      savingName: t.account.savingName,
      transactionType: t.transactionType,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      date: t.date.toISOString().slice(0, 10),
      receiptNumber: t.receiptNumber || "",
      notes: t.notes,
      paymentMethod: t.paymentMethod,
      recordedByName: "Bendahara",
      createdAt: t.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      transactions: formattedTrxs,
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
      transactionType,
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

    const account = await db.studentSavingAccount.findUnique({
      where: { id: accountId }
    });

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
      return NextResponse.json({ error: "Jenis transaksi tidak valid" }, { status: 400 });
    }

    let newStatus = account.status;
    if (account.targetAmount > 0 && newBalance >= account.targetAmount) {
      newStatus = "TARGET_ACHIEVED";
    } else {
      newStatus = "ACTIVE";
    }

    const count = await db.savingTransaction.count();
    const seq = String(count + 1).padStart(3, "0");
    const prefix = transactionType === "SETOR" ? "STR" : "TRK";
    const receiptNumber = `${prefix}-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}-${seq}`;

    // Execute in transaction
    const [updatedAccount, newTrx] = await db.$transaction([
      db.studentSavingAccount.update({
        where: { id: accountId },
        data: {
          currentBalance: newBalance,
          status: newStatus
        }
      }),
      db.savingTransaction.create({
        data: {
          accountId: account.id,
          transactionType: transactionType as "SETOR" | "TARIK",
          amount: numAmount,
          balanceAfter: newBalance,
          receiptNumber,
          notes: notes || (transactionType === "SETOR" ? "Setoran tabungan" : "Penarikan tabungan"),
          paymentMethod: paymentMethod as "TUNAI" | "TRANSFER" | "QRIS",
          recordedById: user.id
        },
        include: {
          account: true
        }
      })
    ]);

    const formattedTrx = {
      id: newTrx.id,
      accountId: newTrx.accountId,
      accountNo: newTrx.account.accountNo,
      ownerType: "SISWA",
      ownerName: newTrx.account.studentName,
      studentName: newTrx.account.studentName,
      savingName: newTrx.account.savingName,
      transactionType: newTrx.transactionType,
      amount: newTrx.amount,
      balanceAfter: newTrx.balanceAfter,
      date: newTrx.date.toISOString().slice(0, 10),
      receiptNumber: newTrx.receiptNumber || "",
      notes: newTrx.notes,
      paymentMethod: newTrx.paymentMethod,
      recordedByName: user.name || "Bendahara",
      createdAt: newTrx.createdAt.toISOString()
    };
    
    // Convert back to format UI expects (similar to old array item)
    const formattedAccount = {
      id: updatedAccount.id,
      accountNo: updatedAccount.accountNo,
      ownerType: "SISWA",
      ownerName: updatedAccount.studentName,
      ownerIdentifier: updatedAccount.nisn ? `NISN: ${updatedAccount.nisn}` : updatedAccount.packetType,
      ownerPhone: updatedAccount.phone,
      studentName: updatedAccount.studentName,
      nisn: updatedAccount.nisn,
      packetType: updatedAccount.packetType,
      parentName: updatedAccount.parentName,
      phone: updatedAccount.phone,
      savingType: updatedAccount.savingType,
      savingName: updatedAccount.savingName,
      targetAmount: updatedAccount.targetAmount,
      currentBalance: updatedAccount.currentBalance,
      status: updatedAccount.status,
      startDate: updatedAccount.startDate.toISOString().slice(0,10),
      targetDate: updatedAccount.targetDate ? updatedAccount.targetDate.toISOString().slice(0,10) : undefined,
      notes: updatedAccount.notes,
      createdAt: updatedAccount.createdAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      message: `Transaksi ${transactionType} sebesar Rp ${numAmount.toLocaleString("id-ID")} berhasil diproses! Saldo baru: Rp ${newBalance.toLocaleString("id-ID")}`,
      transaction: formattedTrx,
      account: formattedAccount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memproses transaksi tabungan" }, { status: 500 });
  }
}
