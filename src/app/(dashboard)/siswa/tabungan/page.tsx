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
  GraduationCap,
  Plus,
  BookOpen,
  Info,
  Clock,
  Award,
  TrendingUp,
  X,
  Target,
  QrCode,
} from "lucide-react";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function SiswaTabunganPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPassbookModal, setShowPassbookModal] = useState(false);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // New saving plan form
  const [planForm, setPlanForm] = useState({
    savingType: "LIBURAN",
    savingName: "Tabungan Study Tour & Vokasi Barista Jogja",
    targetAmount: "1200000",
    initialDeposit: "100000",
    notes: "Menabung tiap pekan dari uang saku",
  });

  const fetchSiswaData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tabungan?ownerType=SISWA");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
      }

      // Fetch transactions
      const trxRes = await fetch("/api/tabungan/transaksi");
      const trxData = await trxRes.json();
      if (trxData.success) {
        const siswaAccountIds = (data.accounts || []).map((a: any) => a.id);
        const siswaTrxs = (trxData.transactions || []).filter(
          (t: any) => siswaAccountIds.includes(t.accountId) || t.ownerType === "SISWA"
        );
        setTransactions(siswaTrxs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiswaData();
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
          ownerType: "SISWA",
          ownerName: "Budi Santoso",
          ownerIdentifier: "NISN: 0081294812 (Paket C)",
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
        fetchSiswaData();
      } else {
        alert(data.error || "Gagal membuat rencana tabungan");
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
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
              Buku Tabungan Peserta Didik
            </span>
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold">
              🏖️ Study Tour • 🏅 Wisuda • 🐑 Qurban Siswa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Buku Tabungan Siswa PKBM Askara
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Kelola tabungan mandiri untuk persiapan kelulusan/wisuda, kegiatan study tour & kunjungan industri vokasi, ibadah qurban, serta tabungan harian masa depan pendidikan kesetaraan.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <button
            onClick={() => setShowPlanModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Target Tabungan Baru</span>
          </button>
        </div>
      </div>

      {/* Digital Passbook Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Passbook Card */}
        <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-700/50 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <PiggyBank className="w-32 h-32" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                  E-PASSBOOK PKBM ASKARA
                </p>
                <p className="text-xs text-slate-300 font-semibold">Rekening Tabungan Siswa</p>
              </div>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <QrCode className="w-5 h-5 text-indigo-200" />
              </div>
            </div>

            <p className="text-xs text-indigo-200 mt-2">Total Saldo Terkumpul:</p>
            <p className="text-3xl font-black tracking-tight text-white mt-0.5">
              {formatRupiah(totalBalance)}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-700/60 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-indigo-300 uppercase tracking-wider">Pemilik Rekening</p>
              <p className="text-sm font-bold text-white">Budi Santoso</p>
              <p className="text-[11px] text-indigo-200 font-mono">NISN: 0081294812 • Paket C</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
              AKTIF
            </span>
          </div>
        </div>

        {/* Total Target Progress */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Ringkasan Capaian Tabungan Siswa</span>
              </h2>
              <span className="text-xs font-bold text-indigo-700">{accounts.length} Program Berjalan</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl">
              <div>
                <span className="text-slate-500 text-[11px] block">Target Total Tabungan</span>
                <span className="font-extrabold text-slate-900 text-lg">{formatRupiah(totalTarget)}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Sisa Yang Perlu Ditabung</span>
                <span className="font-extrabold text-amber-700 text-lg">
                  {formatRupiah(Math.max(0, totalTarget - totalBalance))}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600">Persentase Target Tercapai</span>
                <span className="text-indigo-700">
                  {totalTarget > 0 ? Math.min(100, Math.round((totalBalance / totalTarget) * 100)) : 100}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                  style={{
                    width: `${totalTarget > 0 ? Math.min(100, Math.round((totalBalance / totalTarget) * 100)) : 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Setoran rutin di bendahara PKBM membantu mencapai target liburan & kelulusan tepat waktu!</span>
          </div>
        </div>
      </div>

      {/* Target Accounts Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Rincian Program Tabungan Saya</h2>
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 mr-2">
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

                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Saldo Terkumpul</span>
                      <span className="font-extrabold text-indigo-800 text-base">
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
                      <span>Progres</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isAchieved ? "bg-emerald-600" : "bg-indigo-600"
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
                    <span>Lihat Mutasi</span>
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
          <h2 className="text-sm font-bold text-slate-900">Riwayat Setoran Tabungan Siswa</h2>
          <span className="text-xs text-slate-500">{transactions.length} Transaksi</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-100 pb-2">
                <th className="pb-2">Tanggal</th>
                <th className="pb-2">No. Kwitansi</th>
                <th className="pb-2">Program</th>
                <th className="pb-2">Metode</th>
                <th className="pb-2 text-right">Nominal</th>
                <th className="pb-2 text-right">Saldo</th>
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
                      ✓ Valid
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada riwayat setoran tabungan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buka Target Tabungan Baru */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Buka Target Tabungan Siswa Baru</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Program Tabungan</label>
                <select
                  value={planForm.savingType}
                  onChange={(e) => {
                    const type = e.target.value;
                    let defaultName = "Tabungan Harian Sukarela";
                    let defTarget = "1000000";
                    if (type === "LIBURAN") {
                      defaultName = "Tabungan Study Tour & Vokasi Barista Jogja";
                      defTarget = "1200000";
                    } else if (type === "WISUDA") {
                      defaultName = "Tabungan Wisuda & Kelulusan Paket C";
                      defTarget = "800000";
                    } else if (type === "QURBAN") {
                      defaultName = "Tabungan Qurban Siswa Mandiri 1/7";
                      defTarget = "3500000";
                    } else if (type === "PENDIDIKAN") {
                      defaultName = "Tabungan Persiapan Masuk Kuliah & Kursus";
                      defTarget = "5000000";
                    }
                    setPlanForm({
                      ...planForm,
                      savingType: type,
                      savingName: defaultName,
                      targetAmount: defTarget,
                    });
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                >
                  <option value="LIBURAN">🏖️ Tabungan Study Tour & Liburan Vokasi</option>
                  <option value="WISUDA">🏅 Tabungan Wisuda & Kelulusan</option>
                  <option value="QURBAN">🐑 Tabungan Qurban Siswa Mandiri</option>
                  <option value="PENDIDIKAN">🎓 Tabungan Kuliah / Pendidikan Lanjutan</option>
                  <option value="SUKARELA">🪙 Tabungan Harian Sukarela</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Target Tabungan</label>
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
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-indigo-800"
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-1.5"
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
                <h3 className="font-bold text-slate-900">Buku Mutasi Tabungan Siswa</h3>
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
                <span className="text-slate-500">Penabung:</span>
                <span className="font-bold text-slate-900">Budi Santoso</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Rekening:</span>
                <span className="font-mono font-bold text-slate-900">{activeAccount.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo Akhir:</span>
                <span className="font-black text-indigo-800 text-sm">
                  {formatRupiah(activeAccount.currentBalance)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
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
