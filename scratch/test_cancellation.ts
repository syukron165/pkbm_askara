import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find an active account
  const account = await prisma.studentSavingAccount.findFirst();
  if (!account) {
    console.log("No saving account found.");
    return;
  }

  console.log("Account before test:", account.accountNo, "Balance:", account.currentBalance);

  // 1. Create a deposit of 100,000
  const initialBalance = account.currentBalance;
  const depositAmount = 100000;
  const newBalance = initialBalance + depositAmount;

  const [updatedAcc, testTrx] = await prisma.$transaction([
    prisma.studentSavingAccount.update({
      where: { id: account.id },
      data: { currentBalance: newBalance },
    }),
    prisma.savingTransaction.create({
      data: {
        accountId: account.id,
        transactionType: "SETOR",
        amount: depositAmount,
        balanceAfter: newBalance,
        receiptNumber: `TEST-${Date.now()}`,
        notes: "Test setoran tabungan",
        paymentMethod: "TUNAI",
      },
    }),
  ]);

  console.log("Created test deposit:", testTrx.id, "Amount:", testTrx.amount, "New Balance:", updatedAcc.currentBalance);

  // 2. Now cancel this deposit with notes
  const reason = "Salah input nominal oleh kasir - Uji Coba";
  const rollbackedBalance = updatedAcc.currentBalance - depositAmount;

  const [cancelledAcc, cancelledTrx] = await prisma.$transaction([
    prisma.studentSavingAccount.update({
      where: { id: account.id },
      data: { currentBalance: rollbackedBalance },
    }),
    prisma.savingTransaction.update({
      where: { id: testTrx.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason,
        notes: `${testTrx.notes} [DIBATALKAN: ${reason}]`,
      },
    }),
  ]);

  console.log("Deposit successfully cancelled!");
  console.log("Cancelled Trx status:", cancelledTrx.status, "Reason:", cancelledTrx.cancellationReason);
  console.log("Account balance after rollback:", cancelledAcc.currentBalance, "(Original was:", initialBalance, ")");

  if (cancelledAcc.currentBalance === initialBalance && cancelledTrx.status === "CANCELLED") {
    console.log("TEST PASSED 100%!");
  } else {
    console.error("TEST FAILED!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
