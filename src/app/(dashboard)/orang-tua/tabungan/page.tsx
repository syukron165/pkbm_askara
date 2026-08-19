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
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {acc.transactionsCount}x Setoran Diverifikasi Bendahara
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
                    <td className="py-3 text-right font-bold text-emerald-700">
                      +{formatRupiah(trx.amount)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(trx.balanceAfter)}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                        Bendahara
                      </span>
                    </td>
                  </tr>
                ))}
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

      {/* Passbook Modal */}
      {showPassbookModal && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Buku Mutasi Tabungan Wali Murid</h3>
                <p className="text-xs text-slate-500">
                  {activeAccount.accountNo} • {activeAccount.savingName}
                </p>
              </div>
              <button onClick={() => setShowPassbookModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Orang Tua / Wali:</span>
                <span className="font-bold text-slate-900">{parentDisplayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Rekening:</span>
                <span className="font-mono font-bold text-slate-900">{activeAccount.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Capaian:</span>
                <span className="font-bold text-slate-800">{formatRupiah(activeAccount.targetAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-bold">Saldo Akhir Terkumpul:</span>
                <span className="font-black text-amber-900 text-sm">
                  {formatRupiah(activeAccount.currentBalance)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
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
