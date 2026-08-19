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
  ShieldCheck,
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

export default function OrangTuaTabunganPage() {
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
    savingType: "PENDIDIKAN",
    savingName: "Tabungan Persiapan Lanjutan Kuliah / Kursus Vokasi",
    targetAmount: "5000000",
    targetDate: "2027-06-30",
    notes: "Persiapan dana kuliah dan sertifikasi keahlian anak",
  });

  // Request Target Change Modal State
  const [showRequestTargetModal, setShowRequestTargetModal] = useState(false);
  const [targetRequestForm, setTargetRequestForm] = useState({
    accountId: "",
    accountNo: "",
    savingName: "",
    currentAmount: 0,
    requestedAmount: "",
    requestedDate: "",
    reason: "",
  });

  const handleOpenRequestTarget = (acc: any) => {
    setTargetRequestForm({
      accountId: acc.id,
      accountNo: acc.accountNo,
      savingName: acc.savingName,
      currentAmount: acc.targetAmount || 0,
      requestedAmount: String(acc.targetAmount || 5000000),
      requestedDate: acc.targetDate || "",
      reason: "",
    });
    setShowRequestTargetModal(true);
  };

  const handleSubmitTargetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/tabungan/target-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetRequestForm),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Pengajuan berhasil dikirim ke Bendahara!");
        setShowRequestTargetModal(false);
        fetchOrtuData();
      } else {
        alert(data.error || "Gagal mengajukan perubahan target");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat mengajukan perubahan target.");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchOrtuData = async () => {
    try {
      setLoading(true);

      // 1. Fetch logged in user
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.user);
      }

      // 2. Fetch my tabungan accounts
      const res = await fetch("/api/tabungan?scope=my");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
      }

      // 3. Fetch transactions
      const trxRes = await fetch("/api/tabungan/transaksi");
      const trxData = await trxRes.json();
      if (trxData.success) {
        const ortuAccountIds = (data.accounts || []).map((a: any) => a.id);
        const ortuTrxs = (trxData.transactions || []).filter(
          (t: any) => ortuAccountIds.includes(t.accountId)
        );
        setTransactions(ortuTrxs);
      }
    } catch (e) {
      console.error("Gagal memuat data tabungan orang tua:", e);
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
          savingType: planForm.savingType,
          savingName: planForm.savingName,
          targetAmount: planForm.targetAmount,
          targetDate: planForm.targetDate,
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

  const parentDisplayName = currentUser?.name || "Orang Tua / Wali Murid Askara";
  const parentPhone = currentUser?.phone || "-";

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
              Tersinkronisasi dengan Bendahara PKBM Askara
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tabungan Terencana Orang Tua Siswa
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Bantu putra-putri tercinta menyiapkan dana kelulusan/wisuda, pendidikan kuliah & kursus vokasi lanjutan, serta qurban keluarga. Seluruh setoran fisik maupun transfer diverifikasi secara transparan oleh Bendahara.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <button
            onClick={() => setShowPlanModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buka Rencana Pos Tabungan Baru</span>
          </button>
        </div>
      </div>

      {/* Info Sinkronisasi Kasir / Bendahara */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs text-amber-900 font-medium">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">
            Sistem Keamanan & Validasi Transaksi Tabungan:
          </p>
          <p className="text-amber-800 leading-relaxed">
            Bapak/Ibu Wali dapat menambahkan pos dan target tabungan sesuai kebutuhan keluarga. Penginputan saldo setoran dan penarikan dikelola secara resmi oleh <strong>Super Admin & Bendahara</strong> di kantor sekretariat PKBM Askara agar mutasi dana transparan dan tercatat dengan nomor kwitansi resmi.
          </p>
        </div>
      </div>

      {/* Digital Passbook Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Passbook Card */}
        <div className="bg-gradient-to-br from-amber-800 via-stone-900 to-slate-950 text-white p-6 rounded-3xl shadow-lg border border-amber-700/50 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <PiggyBank className="w-32 h-32" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                  E-PASSBOOK KELUARGA ASKARA
                </p>
                <p className="text-xs text-slate-300 font-semibold">Rekening Tabungan Wali Murid</p>
              </div>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <QrCode className="w-5 h-5 text-amber-200" />
              </div>
            </div>

            <p className="text-xs text-amber-200 mt-2">Total Saldo Terkumpul:</p>
            <p className="text-3xl font-black tracking-tight text-white mt-0.5">
              {formatRupiah(totalBalance)}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-700/60 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-amber-300 uppercase tracking-wider">Nama Orang Tua / Wali</p>
              <p className="text-sm font-bold text-white">{parentDisplayName}</p>
              <p className="text-[11px] text-amber-200 font-mono">No. Telp: {parentPhone}</p>
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
                <Target className="w-4 h-4 text-amber-600" />
                <span>Ringkasan Capaian Tabungan Terencana</span>
              </h2>
              <span className="text-xs font-bold text-amber-800">{accounts.length} Pos Tabungan Berjalan</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl">
              <div>
                <span className="text-slate-500 text-[11px] block">Target Total Rencana</span>
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
                <span className="text-amber-800">
                  {totalTarget > 0 ? Math.min(100, Math.round((totalBalance / totalTarget) * 100)) : 100}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                  style={{
                    width: `${totalTarget > 0 ? Math.min(100, Math.round((totalBalance / totalTarget) * 100)) : 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Setoran rutin di bendahara PKBM membantu mencapai target masa depan anak tepat waktu!</span>
          </div>
        </div>
      </div>

      {/* Target Accounts Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Rincian Pos Tabungan Terdaftar</h2>
        {accounts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
            <PiggyBank className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Belum Ada Pos Tabungan Keluarga</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan klik tombol <strong>"Buka Rencana Pos Tabungan Baru"</strong> di atas untuk membuat rencana tabungan pendidikan, wisuda, atau qurban.
            </p>
          </div>
        ) : (
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 mr-2">
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

                    <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Saldo Terkumpul</span>
                        <span className="font-extrabold text-amber-900 text-base">
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
                        <span>Progres Capaian</span>
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

                    {/* Pending Request Status Badge */}
                    {acc.pendingTargetRequest && (
                      <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                        <div className="leading-snug">
                          <span className="font-bold block">
                            Pengajuan Perubahan Target Menunggu Persetujuan Bendahara:
                          </span>
                          <span className="font-extrabold text-emerald-800 text-xs mt-0.5 block">
                            Target Baru: {formatRupiah(acc.pendingTargetRequest.requestedAmount)}
                          </span>
                          <p className="text-[10px] text-slate-600 italic mt-0.5">
                            "{acc.pendingTargetRequest.reason}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      {acc.transactionsCount}x Setoran Diverifikasi Bendahara
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenRequestTarget(acc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition"
                        title="Ajukan Perubahan Target Rencana Tabungan"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Ubah Target</span>
                      </button>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Riwayat Setoran Resmi dari Bendahara</h2>
          <span className="text-xs text-slate-500">{transactions.length} Transaksi Tercatat</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              Belum ada riwayat transaksi setoran yang dicatat oleh Bendahara.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 font-bold border-b border-slate-100 pb-2">
                  <th className="pb-2">Tanggal</th>
                  <th className="pb-2">No. Kwitansi</th>
                  <th className="pb-2">Pos Tabungan</th>
                  <th className="pb-2">Metode</th>
                  <th className="pb-2 text-right">Nominal</th>
                  <th className="pb-2 text-right">Saldo Akhir</th>
                  <th className="pb-2 text-center">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((trx) => {
                  const isCancelled = trx.status === "CANCELLED";
                  return (
                    <tr
                      key={trx.id}
                      className={
                        isCancelled
                          ? "bg-rose-50/40 text-slate-500"
                          : "hover:bg-slate-50/80"
                      }
                    >
                      <td className="py-3 text-slate-700">{trx.date}</td>
                      <td className="py-3 font-mono font-bold text-slate-900">{trx.receiptNumber}</td>
                      <td className="py-3 font-semibold text-slate-800">
                        <div className={isCancelled ? "line-through text-slate-400" : ""}>
                          {trx.savingName}
                        </div>
                        {isCancelled && (
                          <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                            ⚠️ Dibatalkan: {trx.cancellationReason || "Pembatalan oleh Bendahara"}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                          {trx.paymentMethod}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-bold ${
                        isCancelled
                          ? "line-through text-slate-400"
                          : trx.transactionType === "TARIK"
                          ? "text-rose-700"
                          : "text-emerald-700"
                      }`}>
                        {trx.transactionType === "TARIK" ? "-" : "+"}{formatRupiah(trx.amount)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(trx.balanceAfter)}
                      </td>
                      <td className="py-3 text-center">
                        {isCancelled ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-bold">
                            ⚠️ Dibatalkan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                            Bendahara
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Buka Target Tabungan Baru */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Buka Pos / Target Tabungan Keluarga</h3>
                  <p className="text-xs text-slate-500">Tentukan jenis tabungan dan target dana masa depan</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">ℹ️ Informasi Setoran:</p>
              <p className="text-[11px] text-amber-800">
                Pembuatan pos tabungan ini akan langsung tersinkronisasi ke dashboard <strong>Super Admin & Bendahara</strong>. Setoran saldo selanjutnya dapat disetorkan langsung ke Bendahara sekolah.
              </p>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jenis Program Tabungan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={planForm.savingType}
                  onChange={(e) => {
                    const type = e.target.value;
                    let defaultName = "Tabungan Pendidikan Lanjutan Anak";
                    let defTarget = "5000000";
                    if (type === "WISUDA") {
                      defaultName = "Tabungan Kelulusan & Wisuda Anak";
                      defTarget = "1000000";
                    } else if (type === "QURBAN") {
                      defaultName = "Tabungan Qurban Keluarga";
                      defTarget = "3500000";
                    } else if (type === "LIBURAN") {
                      defaultName = "Tabungan Study Tour & Vokasi Anak";
                      defTarget = "1500000";
                    } else if (type === "SUKARELA") {
                      defaultName = "Tabungan Fleksibel / Harian Keluarga";
                      defTarget = "1000000";
                    }
                    setPlanForm({
                      ...planForm,
                      savingType: type,
                      savingName: defaultName,
                      targetAmount: defTarget,
                    });
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-amber-600 bg-slate-50 focus:bg-white transition"
                >
                  <option value="PENDIDIKAN">🎓 Tabungan Kuliah / Pendidikan Lanjutan</option>
                  <option value="WISUDA">🏅 Tabungan Wisuda & Kelulusan</option>
                  <option value="QURBAN">🐑 Tabungan Qurban Keluarga</option>
                  <option value="LIBURAN">🏖️ Tabungan Study Tour & Liburan</option>
                  <option value="SUKARELA">🪙 Tabungan Fleksibel Sukarela</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama / Tujuan Tabungan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={planForm.savingName}
                  onChange={(e) => setPlanForm({ ...planForm, savingName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Capaian Dana (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={planForm.targetAmount}
                    onChange={(e) => setPlanForm({ ...planForm, targetAmount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Tanggal Tercapai
                  </label>
                  <input
                    type="date"
                    value={planForm.targetDate}
                    onChange={(e) => setPlanForm({ ...planForm, targetDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Rencana Menabung</label>
                <textarea
                  rows={2}
                  value={planForm.notes}
                  onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                  placeholder="Contoh: Menabung bulanan untuk persiapan kuliah anak"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Memproses..." : "Buat Rencana Tabungan"}</span>
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
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Rekening Koran / Buku Mutasi Wali Murid</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {activeAccount.accountNo} • {parentDisplayName} ({activeAccount.savingName})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
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
                        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
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
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-300">
                        E-STATEMENT ORANG TUA
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
                      Official Statement of Parent Savings Account Ledger
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
                      <span className="text-slate-500 font-medium">Nama Orang Tua / Wali:</span>
                      <span className="font-bold text-slate-900">{parentDisplayName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Status Nasabah:</span>
                      <span className="font-semibold text-slate-800">
                        Orang Tua / Wali Murid PKBM Askara
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Jenis Program:</span>
                      <span className="font-bold text-amber-800">{activeAccount.savingName}</span>
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
                      <span className="font-black text-sm sm:text-base text-amber-900">
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
                        .map((t, idx) => {
                          const isCancelled = t.status === "CANCELLED";
                          return (
                            <tr
                              key={t.id || idx}
                              className={
                                isCancelled
                                  ? "bg-rose-50/40 text-slate-500"
                                  : idx % 2 === 0
                                  ? "bg-white"
                                  : "bg-slate-50/50"
                              }
                            >
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
                                <div className={isCancelled ? "line-through text-slate-400" : ""}>
                                  {t.notes ||
                                    (t.transactionType === "SETOR"
                                      ? `Setoran ${activeAccount.savingName}`
                                      : `Penarikan ${activeAccount.savingName}`)}
                                </div>
                                {isCancelled && (
                                  <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                                    ⚠️ Dibatalkan: {t.cancellationReason || "Pembatalan oleh Bendahara"}
                                  </div>
                                )}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-center">
                                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                                  {t.paymentMethod}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-rose-700">
                                {t.transactionType === "TARIK" ? (
                                  <span className={isCancelled ? "line-through opacity-50" : ""}>
                                    {formatRupiah(t.amount)}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-700">
                                {t.transactionType === "SETOR" ? (
                                  <span className={isCancelled ? "line-through opacity-50" : ""}>
                                    {formatRupiah(t.amount)}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-black text-slate-950 bg-amber-50/30">
                                {formatRupiah(t.balanceAfter)}
                              </td>
                              <td className="p-2 text-center text-[10px] font-bold">
                                {isCancelled ? (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                    ⚠️ Batal
                                  </span>
                                ) : (
                                  <span className="text-emerald-800">
                                    ✓ Terverifikasi
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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
                    <p>1. Rekening koran ini merupakan dokumen resmi mutasi tabungan wali murid PKBM Askara.</p>
                    <p>2. Seluruh transaksi kas disinkronkan langsung dengan Bendahara Lembaga.</p>
                    <p>3. Apabila ada pertanyaan atau ketidaksesuaian saldo, hubungi Tata Usaha PKBM Askara.</p>
                  </div>

                  {/* Pengesahan Tanda Tangan */}
                  <div className="flex justify-between sm:justify-end gap-10 text-center text-xs">
                    <div>
                      <p className="text-[11px] text-slate-500 mb-14">Wali Murid / Penabung,</p>
                      <p className="font-bold text-slate-900 border-b border-slate-400 pb-0.5">
                        {parentDisplayName}
                      </p>
                      <p className="text-[10px] text-slate-500">Orang Tua Siswa</p>
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

      {/* ============================================================ */}
      {/* MODAL AJUKAN PERUBAHAN TARGET TABUNGAN (ORANG TUA)          */}
      {/* ============================================================ */}
      {showRequestTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ajukan Perubahan Target Tabungan</h3>
                  <p className="text-[11px] text-slate-500">
                    {targetRequestForm.accountNo} • {targetRequestForm.savingName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRequestTargetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTargetRequest} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-[11px] text-amber-950 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Pengajuan perubahan target dana akan ditinjau dan divalidasi oleh <strong>Bendahara Lembaga</strong>. Setelah disetujui, target tabungan akan otomatis diperbarui.
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Saat Ini:</span>
                  <span className="font-bold text-slate-700">
                    {targetRequestForm.currentAmount > 0
                      ? formatRupiah(targetRequestForm.currentAmount)
                      : "Fleksibel"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal Target Baru yang Diinginkan (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={targetRequestForm.requestedAmount}
                  onChange={(e) =>
                    setTargetRequestForm({ ...targetRequestForm, requestedAmount: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-emerald-800 focus:ring-2 focus:ring-amber-500 bg-emerald-50/20 focus:bg-white transition"
                  placeholder="Contoh: 7500000"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Estimasi Target Tanggal Baru (Opsional)
                </label>
                <input
                  type="date"
                  value={targetRequestForm.requestedDate}
                  onChange={(e) =>
                    setTargetRequestForm({ ...targetRequestForm, requestedDate: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan / Catatan Pengajuan Perubahan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={targetRequestForm.reason}
                  onChange={(e) =>
                    setTargetRequestForm({ ...targetRequestForm, reason: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition"
                  placeholder="Contoh: Menyesuaikan target tabungan untuk biaya pendaftaran perguruan tinggi / persiapan kursus kejuruan..."
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestTargetModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !targetRequestForm.reason.trim()}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Mengirim..." : "Kirim Pengajuan ke Bendahara"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
