"use client";

import React, { useState, useEffect } from "react";
import {
  PiggyBank,
  Wallet,
  ArrowUpRight,
  Printer,
  Calendar,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
  Plus,
  BookOpen,
  Info,
  Clock,
  Award,
  TrendingUp,
  X,
  CreditCard,
  Receipt,
} from "lucide-react";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function OrangTuaTabunganPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPassbookModal, setShowPassbookModal] = useState(false);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // New saving plan form
  const [planForm, setPlanForm] = useState({
    savingType: "PENDIDIKAN",
    savingName: "Tabungan Dana Lanjutan Kuliah & Vokasi Anak",
    targetAmount: "10000000",
    initialDeposit: "500000",
    notes: "Persiapan dana kuliah / kursus vokasi lanjutan",
  });

  const fetchOrtuData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tabungan?ownerType=ORANG_TUA");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
      }

      // Fetch transactions
      const trxRes = await fetch("/api/tabungan/transaksi");
      const trxData = await trxRes.json();
      if (trxData.success) {
        const ortuAccountIds = (data.accounts || []).map((a: any) => a.id);
        const ortuTrxs = (trxData.transactions || []).filter(
          (t: any) => ortuAccountIds.includes(t.accountId) || t.ownerType === "ORANG_TUA"
        );
        setTransactions(ortuTrxs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrtuData();
  }, []);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.currentBalance, 0);
  const totalTarget = accounts.reduce((acc, curr) => acc + curr.targetAmount, 0);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/tabungan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerType: "ORANG_TUA",
          ownerName: "Joko Santoso (Wali Murid)",
          ownerIdentifier: "Wali dari: Budi Santoso (Paket C)",
          savingType: planForm.savingType,
          savingName: planForm.savingName,
          targetAmount: planForm.targetAmount,
          initialDeposit: planForm.initialDeposit,
          notes: planForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPlanModal(false);
        fetchOrtuData();
      } else {
        alert(data.error || "Gagal membuat tabungan keluarga");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
              Buku Tabungan Keluarga & Wali Murid
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
              🎓 Pendidikan Anak • 🐑 Qurban Keluarga
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tabungan Terencana Orang Tua Siswa
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Membantu bapak/ibu wali murid menyiapkan dana masa depan pendidikan anak (kuliah & kursus vokasi lanjutan), ibadah qurban keluarga, serta tabungan kelulusan secara transparan di PKBM Askara.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <button
            onClick={() => setShowPlanModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buka Rencana Tabungan Keluarga Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Tabungan Keluarga Anda</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{formatRupiah(totalBalance)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tersimpan aman di Kas PKBM Askara</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Target Rencana Dana</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(totalTarget)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {totalTarget > 0 ? Math.min(100, Math.round((totalBalance / totalTarget) * 100)) : 100}% Dari Target
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Program Tabungan Aktif</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{accounts.length} Program</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pendidikan Lanjutan & Qurban</p>
        </div>
      </div>

      {/* Account Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Rekening Tabungan Keluarga</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => {
            const progress =
              acc.targetAmount > 0
                ? Math.min(100, Math.round((acc.currentBalance / acc.targetAmount) * 100))
                : 100;
            const isAchieved = progress >= 100;

            return (
              <div
                key={acc.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 mr-2">
                        {acc.savingType}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">{acc.accountNo}</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{acc.savingName}</h3>
                    </div>
                    {isAchieved && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Lunas
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Saldo Saat Ini</span>
                      <span className="font-extrabold text-amber-800 text-base">
                        {formatRupiah(acc.currentBalance)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Target Rencana</span>
                      <span className="font-bold text-slate-700 text-base">
                        {acc.targetAmount > 0 ? formatRupiah(acc.targetAmount) : "Fleksibel"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Progres Dana</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isAchieved ? "bg-emerald-600" : "bg-amber-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {acc.transactionsCount}x Setoran Tercatat
                  </span>
                  <button
                    onClick={() => {
                      setActiveAccount(acc);
                      setShowPassbookModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Buku Mutasi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Riwayat Setoran Tabungan Orang Tua</h2>
          <span className="text-xs text-slate-500">{transactions.length} Transaksi Tercatat</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-100 pb-2">
                <th className="pb-2">Tanggal</th>
                <th className="pb-2">No. Kwitansi</th>
                <th className="pb-2">Program Tabungan</th>
                <th className="pb-2">Metode</th>
                <th className="pb-2 text-right">Nominal</th>
                <th className="pb-2 text-right">Saldo Sesudah</th>
                <th className="pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/80">
                  <td className="py-3 text-slate-700">{trx.date}</td>
                  <td className="py-3 font-mono font-bold text-slate-900">{trx.receiptNumber}</td>
                  <td className="py-3 font-semibold text-slate-800">{trx.savingName}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                      {trx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-extrabold text-emerald-700">
                    {formatRupiah(trx.amount)}
                  </td>
                  <td className="py-3 text-right font-black text-slate-900">
                    {formatRupiah(trx.balanceAfter)}
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                      ✓ Sah & Tervalidasi
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada riwayat transaksi tabungan orang tua
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold">Penyetoran Tabungan Orang Tua / Wali:</p>
          <p className="mt-0.5 text-amber-800">
            Setoran dapat dititipkan melalui siswa, dibayarkan langsung saat berkunjung ke lembaga, atau transfer ke rekening PKBM Askara dengan mencantumkan nama dan nomor rekening tabungan Anda.
          </p>
        </div>
      </div>

      {/* Modal Plan Form */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Buka Tabungan Keluarga Baru</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Kebutuhan Tabungan</label>
                <select
                  value={planForm.savingType}
                  onChange={(e) => {
                    const type = e.target.value;
                    let defaultName = "Tabungan Sukarela Keluarga";
                    let defTarget = "3000000";
                    if (type === "PENDIDIKAN") {
                      defaultName = "Tabungan Dana Lanjutan Kuliah & Vokasi Anak";
                      defTarget = "10000000";
                    } else if (type === "QURBAN") {
                      defaultName = "Tabungan Qurban Kambing / Sapi Keluarga";
                      defTarget = "3500000";
                    } else if (type === "WISUDA") {
                      defaultName = "Tabungan Wisuda & Pelepasan Siswa";
                      defTarget = "1000000";
                    }
                    setPlanForm({
                      ...planForm,
                      savingType: type,
                      savingName: defaultName,
                      targetAmount: defTarget,
                    });
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-600 bg-slate-50 focus:bg-white transition"
                >
                  <option value="PENDIDIKAN">🎓 Tabungan Pendidikan & Kuliah Anak</option>
                  <option value="QURBAN">🐑 Tabungan Qurban Keluarga (Idul Adha)</option>
                  <option value="WISUDA">🏅 Tabungan Wisuda & Kelulusan</option>
                  <option value="SUKARELA">🪙 Tabungan Fleksibel Mandiri</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Program Tabungan</label>
                <input
                  type="text"
                  value={planForm.savingName}
                  onChange={(e) => setPlanForm({ ...planForm, savingName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Dana (Rp)</label>
                  <input
                    type="number"
                    value={planForm.targetAmount}
                    onChange={(e) => setPlanForm({ ...planForm, targetAmount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Setoran Awal (Rp)</label>
                  <input
                    type="number"
                    value={planForm.initialDeposit}
                    onChange={(e) => setPlanForm({ ...planForm, initialDeposit: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Memproses..." : "Buka Tabungan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passbook Modal */}
      {showPassbookModal && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Buku Mutasi Tabungan Keluarga</h3>
                <p className="text-xs text-slate-500">
                  {activeAccount.accountNo} • {activeAccount.savingName}
                </p>
              </div>
              <button onClick={() => setShowPassbookModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Penabung / Wali:</span>
                <span className="font-bold text-slate-900">Joko Santoso</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Rekening:</span>
                <span className="font-mono font-bold text-slate-900">{activeAccount.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo Akhir:</span>
                <span className="font-black text-amber-800 text-sm">
                  {formatRupiah(activeAccount.currentBalance)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rekening</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
