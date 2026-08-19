"use client";

import React, { useState, useEffect } from "react";
import {
  PiggyBank,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Calendar,
  CheckCircle2,
  Sparkles,
  Users,
  Plus,
  BookOpen,
  Info,
  Clock,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function GuruTabunganPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPassbookModal, setShowPassbookModal] = useState(false);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // New saving plan form
  const [planForm, setPlanForm] = useState({
    savingType: "QURBAN",
    savingName: "Tabungan Qurban Sapi 1/7 Pendidik (Idul Adha)",
    targetAmount: "3800000",
    initialDeposit: "200000",
    notes: "Setoran mandiri / potongan bulanan",
  });

  const fetchGuruData = async () => {
    try {
      setLoading(true);
      const [userRes, res, trxRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/tabungan?ownerType=GURU"),
        fetch("/api/tabungan/transaksi"),
      ]);

      const userData = await userRes.json();
      if (userData.success && userData.user) {
        setCurrentUser(userData.user);
      }

      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
      }

      const trxData = await trxRes.json();
      if (trxData.success) {
        const guruAccountIds = (data.accounts || []).map((a: any) => a.id);
        const guruTrxs = (trxData.transactions || []).filter(
          (t: any) => guruAccountIds.includes(t.accountId) || t.ownerType === "GURU"
        );
        setTransactions(guruTrxs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuruData();
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
          ownerType: "GURU",
          ownerName: currentUser?.name || "Pendidik PKBM",
          ownerIdentifier: currentUser?.phone || currentUser?.email || "Pendidik",
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
        fetchGuruData();
      } else {
        alert(data.error || "Gagal membuat program tabungan");
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
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-emerald-300" />
              Buku Tabungan Pendidik & Tutor
            </span>
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold">
              🐑 Qurban • 🏖️ Liburan & Gathering • 🪙 Sukarela
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tabungan Pendidik PKBM Askara
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Fasilitas tabungan terencana bagi bapak/ibu tutor dan pendidik di lembaga untuk persiapan ibadah Qurban, liburan / family gathering guru, serta tabungan sukarela dengan pembukuan transparan di bendahara.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <button
            onClick={() => setShowPlanModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buka Program Tabungan Guru Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Saldo Tabungan Anda</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatRupiah(totalBalance)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tersimpan aman di Rekening Kas Lembaga</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Target Rencana Tabungan</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(totalTarget)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {totalTarget > 0 ? Math.min(100, Math.round((totalBalance / totalTarget) * 100)) : 100}% Capaian Total
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Program Tabungan Aktif</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{accounts.length} Rekening</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Qurban & Liburan Gathering</p>
        </div>
      </div>

      {/* Active Accounts Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Rekening Tabungan Pendidik Aktif</h2>
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mr-2">
                        {acc.savingType}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">{acc.accountNo}</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{acc.savingName}</h3>
                    </div>
                    {isAchieved && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Target Tercapai
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Saldo Saat Ini</span>
                      <span className="font-extrabold text-emerald-800 text-base">
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

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Progres Tabungan</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isAchieved ? "bg-emerald-600" : "bg-teal-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Mulai: {acc.startDate} • {acc.transactionsCount}x Setoran
                  </span>
                  <button
                    onClick={() => {
                      setActiveAccount(acc);
                      setShowPassbookModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Lihat Buku Mutasi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Riwayat Setoran & Mutasi Tabungan Guru</h2>
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
                      ✓ Tercatat Kasir
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada riwayat transaksi tabungan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card: Cara Setor Tabungan */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <p className="font-bold">Informasi Penyetoran Tabungan Guru:</p>
          <p className="mt-0.5 text-emerald-800">
            Penyetoran dapat dilakukan secara tunai ke Bendahara PKBM Askara pada jam kerja atau melalui transfer bank lembaga ke <strong>Bank Mandiri: 123-00-9876543-1 (a.n PKBM Askara)</strong> dengan mencantumkan nomor rekening tabungan Anda.
          </p>
        </div>
      </div>

      {/* Modal Buka Tabungan Baru */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Buka Rekening Tabungan Guru Baru</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Kebutuhan Tabungan</label>
                <select
                  value={planForm.savingType}
                  onChange={(e) => {
                    const type = e.target.value;
                    let defaultName = "Tabungan Sukarela Pendidik";
                    let defTarget = "1500000";
                    if (type === "QURBAN") {
                      defaultName = "Tabungan Qurban Sapi 1/7 Pendidik (Idul Adha 2027)";
                      defTarget = "3800000";
                    } else if (type === "LIBURAN") {
                      defaultName = "Tabungan Family Gathering & Edu-Trip Guru 2026";
                      defTarget = "2000000";
                    } else if (type === "HARI_RAYA") {
                      defaultName = "Tabungan Hari Raya & THR Pendidik Mandiri";
                      defTarget = "3000000";
                    }
                    setPlanForm({
                      ...planForm,
                      savingType: type,
                      savingName: defaultName,
                      targetAmount: defTarget,
                    });
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                >
                  <option value="QURBAN">🐑 Tabungan Qurban Sapi 1/7</option>
                  <option value="LIBURAN">🏖️ Tabungan Family Gathering / Liburan Guru</option>
                  <option value="HARI_RAYA">🌙 Tabungan Hari Raya & THR Mandiri</option>
                  <option value="SUKARELA">🪙 Tabungan Sukarela / Masa Depan</option>
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
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800"
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Memproses..." : "Buka Rekening"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL BUKU TABUNGAN DIGITAL / REKENING KORAN PERBANKAN        */}
      {/* ============================================================ */}
      {showPassbookModal && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:rounded-none print:max-w-full print:max-h-none print:overflow-visible print:m-0 print:p-0">
            {/* Modal Navigation Header (Hidden on Print) */}
            <div className="print:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Rekening Koran / Buku Mutasi Guru & Tutor</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {activeAccount.accountNo} • {activeAccount.ownerName || currentUser?.name} ({activeAccount.savingName})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Rekening Koran</span>
                </button>
                <button
                  onClick={() => setShowPassbookModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bank Statement Document View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible">
              <div className="printable-document bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-full font-sans text-slate-900">
                
                {/* 1. Header Kop Surat Resmi Standar Bank */}
                <div className="border-b-2 border-slate-900 pb-4 mb-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src="/logo.png"
                        alt="Logo PKBM"
                        className="h-16 w-auto object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-snug uppercase">
                          PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) ASKARA
                        </h2>
                        <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                          Unit Pengelola Tabungan & Rekening Pendidikan Terencana
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP • NPSN: P9998766
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung • Telp: (022) 87518584 / 085156560630 • Email: pkbm.askara@gmail.com
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                        E-STATEMENT GURU
                      </span>
                    </div>
                  </div>
                  <div className="border-b border-slate-900 mt-2" />
                </div>

                {/* 2. Judul Dokumen & Metadata Cetak */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5 pb-2 border-b border-dashed border-slate-300">
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                      REKENING KORAN / LAPORAN MUTASI TABUNGAN
                    </h1>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Official Statement of Teacher Savings Account Ledger
                    </p>
                  </div>
                  <div className="text-left sm:text-right text-[11px] text-slate-600 font-medium">
                    <span>Dicetak pada: </span>
                    <strong className="text-slate-900">
                      {new Date().toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </strong>
                  </div>
                </div>

                {/* 3. Account & Customer Summary Box (Bank Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs">
                  {/* Left Column: Account Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Nomor Rekening:</span>
                      <span className="font-mono font-extrabold text-sm text-slate-950 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                        {activeAccount.accountNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Nama Pendidik / Tutor:</span>
                      <span className="font-bold text-slate-900">{activeAccount.ownerName || currentUser?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Status Nasabah:</span>
                      <span className="font-semibold text-slate-800">
                        Pendidik / Tenaga Kependidikan PKBM Askara
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Jenis Program:</span>
                      <span className="font-bold text-emerald-800">{activeAccount.savingName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Tanggal Registrasi:</span>
                      <span className="font-medium text-slate-700">{activeAccount.startDate || "-"}</span>
                    </div>
                  </div>

                  {/* Right Column: Financial Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Mata Uang:</span>
                      <span className="font-bold text-slate-900">IDR (Indonesian Rupiah)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Target Dana Tabungan:</span>
                      <span className="font-bold text-slate-800">
                        {activeAccount.targetAmount > 0 ? formatRupiah(activeAccount.targetAmount) : "Fleksibel"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Total Setoran (Kredit):</span>
                      <span className="font-bold text-emerald-700">
                        {formatRupiah(
                          transactions
                            .filter((t) => t.accountId === activeAccount.id && t.transactionType === "SETOR")
                            .reduce((acc, curr) => acc + curr.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Total Penarikan (Debet):</span>
                      <span className="font-bold text-rose-700">
                        {formatRupiah(
                          transactions
                            .filter((t) => t.accountId === activeAccount.id && t.transactionType === "TARIK")
                            .reduce((acc, curr) => acc + curr.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-300 bg-white p-2 rounded-xl border">
                      <span className="font-extrabold text-slate-900">SALDO AKHIR TERKUMPUL:</span>
                      <span className="font-black text-sm sm:text-base text-emerald-800">
                        {formatRupiah(activeAccount.currentBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Tabel Mutasi Rekening Standar Perbankan */}
                <div className="mb-6 overflow-hidden rounded-xl border border-slate-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-900 font-bold border-b border-slate-300 text-[11px]">
                        <th className="p-2.5 border-r border-slate-300 text-center w-10">NO</th>
                        <th className="p-2.5 border-r border-slate-300 w-28">TANGGAL</th>
                        <th className="p-2.5 border-r border-slate-300 w-36">NO. KWITANSI</th>
                        <th className="p-2.5 border-r border-slate-300">KETERANGAN TRANSAKSI</th>
                        <th className="p-2.5 border-r border-slate-300 text-center w-20">METODE</th>
                        <th className="p-2.5 border-r border-slate-300 text-right w-28 text-rose-800">DEBET (TARIK)</th>
                        <th className="p-2.5 border-r border-slate-300 text-right w-28 text-emerald-800">KREDIT (SETOR)</th>
                        <th className="p-2.5 border-r border-slate-300 text-right w-32">SALDO (IDR)</th>
                        <th className="p-2.5 text-center w-24">VALIDASI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {transactions
                        .filter((t) => t.accountId === activeAccount.id)
                        .map((t, idx) => (
                          <tr key={t.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="p-2 border-r border-slate-200 text-center font-medium text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                              {t.date}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900">
                              {t.receiptNumber}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-slate-800 font-medium">
                              {t.notes || (t.transactionType === "SETOR" ? `Setoran ${activeAccount.savingName}` : `Penarikan ${activeAccount.savingName}`)}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                                {t.paymentMethod}
                              </span>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-rose-700">
                              {t.transactionType === "TARIK" ? formatRupiah(t.amount) : "-"}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-700">
                              {t.transactionType === "SETOR" ? formatRupiah(t.amount) : "-"}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-right font-mono font-black text-slate-950 bg-emerald-50/20">
                              {formatRupiah(t.balanceAfter)}
                            </td>
                            <td className="p-2 text-center text-[10px] font-bold text-emerald-800">
                              ✓ Terverifikasi
                            </td>
                          </tr>
                        ))}
                      {transactions.filter((t) => t.accountId === activeAccount.id).length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                            Belum ada riwayat mutasi transaksi pada rekening tabungan ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 5. Catatan Ketentuan & Pengesahan Resmi Standar Bank */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mt-6">
                  {/* Ketentuan Bank */}
                  <div className="space-y-1.5 text-[10px] text-slate-600 leading-relaxed">
                    <p className="font-bold text-slate-800 text-[11px]">KETENTUAN PENCATATAN REKENING:</p>
                    <p>1. Rekening koran ini merupakan dokumen resmi mutasi tabungan guru/tutor PKBM Askara.</p>
                    <p>2. Seluruh transaksi kas disinkronkan langsung dengan Manajemen & Bendahara Lembaga.</p>
                    <p>3. Apabila ada pertanyaan atau ketidaksesuaian saldo, hubungi Tata Usaha PKBM Askara.</p>
                  </div>

                  {/* Pengesahan Tanda Tangan */}
                  <div className="flex justify-between sm:justify-end gap-10 text-center text-xs">
                    <div>
                      <p className="text-[11px] text-slate-500 mb-14">Pendidik / Penabung,</p>
                      <p className="font-bold text-slate-900 border-b border-slate-400 pb-0.5">
                        {activeAccount.ownerName || currentUser?.name}
                      </p>
                      <p className="text-[10px] text-slate-500">Guru / Tutor PKBM</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1">Kota Bandung, {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
                      <p className="text-[11px] text-slate-600 mb-12">Bendahara Lembaga PKBM Askara,</p>
                      <p className="font-bold text-slate-900 border-b border-slate-400 pb-0.5">
                        Bendahara PKBM Askara
                      </p>
                      <p className="text-[10px] text-slate-500">NIP/ID: 19850412 201001 2 004</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
