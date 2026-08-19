"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Printer,
  X,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  Receipt,
  Download,
  Filter,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  History,
  BookOpen,
  GraduationCap,
  Users,
  HeartHandshake,
} from "lucide-react";

type SavingOwnerType = "GURU" | "MANAJEMEN" | "SISWA" | "ORANG_TUA";
type SavingType =
  | "QURBAN"
  | "LIBURAN"
  | "PENDIDIKAN"
  | "SUKARELA"
  | "WISUDA"
  | "HARI_RAYA"
  | "KARYA_VOKASI";

interface SavingAccount {
  id: string;
  accountNo: string;
  ownerType: SavingOwnerType;
  ownerName: string;
  ownerIdentifier?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  studentName?: string;
  nisn?: string;
  packetType?: string;
  parentName?: string;
  phone?: string;
  savingType: SavingType;
  savingName: string;
  targetAmount: number;
  currentBalance: number;
  status: "ACTIVE" | "TARGET_ACHIEVED" | "CLOSED";
  startDate: string;
  targetDate?: string;
  notes?: string;
  transactionsCount: number;
}

interface SavingTransaction {
  id: string;
  accountId: string;
  accountNo: string;
  ownerType?: SavingOwnerType;
  ownerName?: string;
  studentName?: string;
  savingName: string;
  transactionType: "SETOR" | "TARIK";
  amount: number;
  balanceAfter: number;
  date: string;
  receiptNumber: string;
  notes?: string;
  paymentMethod: "TUNAI" | "TRANSFER" | "QRIS";
  recordedByName: string;
  createdAt: string;
}

const SAVING_TYPE_CONFIGS: Record<
  string,
  { label: string; icon: string; color: string; badge: string }
> = {
  QURBAN: {
    label: "Tabungan Qurban",
    icon: "🐑",
    color: "from-amber-600 to-amber-700",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  LIBURAN: {
    label: "Tabungan Liburan / Gathering",
    icon: "🏖️",
    color: "from-emerald-600 to-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  PENDIDIKAN: {
    label: "Tabungan Pendidikan & Kursus",
    icon: "🎓",
    color: "from-blue-600 to-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
  },
  HARI_RAYA: {
    label: "Tabungan Hari Raya & THR",
    icon: "🌙",
    color: "from-teal-600 to-teal-700",
    badge: "bg-teal-100 text-teal-800 border-teal-200",
  },
  SUKARELA: {
    label: "Tabungan Sukarela / Harian",
    icon: "🪙",
    color: "from-purple-600 to-purple-700",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
  },
  WISUDA: {
    label: "Tabungan Wisuda & Kelulusan",
    icon: "🏅",
    color: "from-rose-600 to-rose-700",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
  },
  KARYA_VOKASI: {
    label: "Tabungan Modal Vokasi",
    icon: "💼",
    color: "from-indigo-600 to-indigo-700",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
};

const OWNER_TYPE_BADGES: Record<
  SavingOwnerType,
  { label: string; icon: any; bg: string; text: string; border: string }
> = {
  GURU: {
    label: "Pendidik / Guru",
    icon: Users,
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  MANAJEMEN: {
    label: "Staf Manajemen",
    icon: Building2,
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  SISWA: {
    label: "Siswa PKBM",
    icon: GraduationCap,
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
  },
  ORANG_TUA: {
    label: "Orang Tua / Wali",
    icon: HeartHandshake,
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function TabunganAdminPage() {
  const [accounts, setAccounts] = useState<SavingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOwnerType, setSelectedOwnerType] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [metrics, setMetrics] = useState<any>({
    totalBalance: 0,
    totalTarget: 0,
    activeAccountsCount: 0,
    breakdownByOwner: {},
    breakdownByType: {},
  });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTrxModal, setShowTrxModal] = useState(false);
  const [showPassbookModal, setShowPassbookModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [activeAccount, setActiveAccount] = useState<SavingAccount | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<SavingTransaction[]>([]);
  const [activeReceiptTrx, setActiveReceiptTrx] = useState<SavingTransaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State: Buka Akun
  const [createForm, setCreateForm] = useState({
    ownerType: "SISWA" as SavingOwnerType,
    ownerName: "",
    ownerIdentifier: "",
    ownerPhone: "",
    ownerEmail: "",
    savingType: "QURBAN" as SavingType,
    savingName: "Tabungan Qurban Sapi 1/7 (Idul Adha 2027)",
    targetAmount: "3500000",
    initialDeposit: "200000",
    targetDate: "2027-05-30",
    notes: "Setoran rutin bulanan",
  });

  // Form State: Transaksi Setor/Tarik
  const [trxForm, setTrxForm] = useState({
    transactionType: "SETOR",
    amount: "200000",
    paymentMethod: "TUNAI",
    notes: "Setoran tabungan rutin",
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tabungan");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenPassbook = async (acc: SavingAccount) => {
    setActiveAccount(acc);
    try {
      const res = await fetch(`/api/tabungan/transaksi?accountId=${acc.id}`);
      const data = await res.json();
      if (data.success) {
        setAccountTransactions(data.transactions);
      }
    } catch (e) {
      console.error(e);
    }
    setShowPassbookModal(true);
  };

  const handleOpenTrxModal = (acc: SavingAccount, type: "SETOR" | "TARIK") => {
    setActiveAccount(acc);
    setTrxForm({
      transactionType: type,
      amount: type === "SETOR" ? "200000" : "100000",
      paymentMethod: "TUNAI",
      notes: type === "SETOR" ? "Setoran tabungan" : "Penarikan tabungan",
    });
    setShowTrxModal(true);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/tabungan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchAccounts();
      } else {
        alert(data.error || "Gagal membuka rekening");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/tabungan/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeAccount.id,
          transactionType: trxForm.transactionType,
          amount: trxForm.amount,
          paymentMethod: trxForm.paymentMethod,
          notes: trxForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowTrxModal(false);
        fetchAccounts();
        setActiveReceiptTrx(data.transaction);
        setShowReceiptModal(true);
      } else {
        alert(data.error || "Gagal memproses transaksi");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    const matchOwner = selectedOwnerType === "ALL" || a.ownerType === selectedOwnerType;
    const matchType = selectedType === "ALL" || a.savingType === selectedType;
    const matchSearch =
      !search ||
      a.accountNo.toLowerCase().includes(search.toLowerCase()) ||
      (a.ownerName && a.ownerName.toLowerCase().includes(search.toLowerCase())) ||
      (a.studentName && a.studentName.toLowerCase().includes(search.toLowerCase())) ||
      a.savingName.toLowerCase().includes(search.toLowerCase());
    return matchOwner && matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Background Dashboard Content (Hidden in Print Mode) */}
      <div className="space-y-6 print:hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-300" />
                Buku Tabungan Lembaga PKBM Askara
              </span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold">
                🎓 Guru • 🏢 Manajemen • 🎒 Siswa • 👨‍👩‍👦 Orang Tua
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pusat Manajemen Tabungan Tematik Lintas Role
            </h1>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
              Fasilitas menabung terencana resmi PKBM Askara untuk <strong>Pendidik/Guru</strong>, <strong>Staf Manajemen</strong>, <strong>Siswa</strong>, dan <strong>Orang Tua Siswa</strong>. Mendukung Tabungan Qurban, Liburan/Gathering, Persiapan Pendidikan, Wisuda, Hari Raya, dan Tabungan Harian Fleksibel.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 relative z-10">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Buka Rekening Tabungan Baru</span>
            </button>
          </div>
        </div>

        {/* Role Breakdown Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div
            onClick={() => setSelectedOwnerType("GURU")}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedOwnerType === "GURU"
                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-extrabold uppercase">Tabungan Guru</span>
              <Users className="w-4 h-4" />
            </div>
            <p className="text-lg font-black text-slate-900">
              {formatRupiah(metrics.breakdownByOwner?.GURU || 0)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Qurban & Liburan Guru</p>
          </div>

          <div
            onClick={() => setSelectedOwnerType("MANAJEMEN")}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedOwnerType === "MANAJEMEN"
                ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-[11px] font-extrabold uppercase">Tabungan Manajemen</span>
              <Building2 className="w-4 h-4" />
            </div>
            <p className="text-lg font-black text-slate-900">
              {formatRupiah(metrics.breakdownByOwner?.MANAJEMEN || 0)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Staf & Operasional</p>
          </div>

          <div
            onClick={() => setSelectedOwnerType("SISWA")}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedOwnerType === "SISWA"
                ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-[11px] font-extrabold uppercase">Tabungan Siswa</span>
              <GraduationCap className="w-4 h-4" />
            </div>
            <p className="text-lg font-black text-slate-900">
              {formatRupiah(metrics.breakdownByOwner?.SISWA || 0)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Paket A, B, C & Study Tour</p>
          </div>

          <div
            onClick={() => setSelectedOwnerType("ORANG_TUA")}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedOwnerType === "ORANG_TUA"
                ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-extrabold uppercase">Tabungan Orang Tua</span>
              <HeartHandshake className="w-4 h-4" />
            </div>
            <p className="text-lg font-black text-slate-900">
              {formatRupiah(metrics.breakdownByOwner?.ORANG_TUA || 0)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Pendidikan Anak & Qurban</p>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Kas Tabungan</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {formatRupiah(metrics.totalBalance || 0)}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Tersimpan Aman di Kas Lembaga</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Rekening Penabung</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.activeAccountsCount || accounts.length} Rekening
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Guru, Staf, Siswa & Wali</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Tabungan Qurban</span>
            <p className="text-xl font-black text-amber-700 mt-1">
              {formatRupiah(metrics.breakdownByType?.QURBAN || 0)}
            </p>
            <p className="text-[10px] text-amber-800 font-semibold mt-0.5">Persiapan Hewan Qurban 2027</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Tabungan Liburan / Tour</span>
            <p className="text-xl font-black text-blue-700 mt-1">
              {formatRupiah(metrics.breakdownByType?.LIBURAN || 0)}
            </p>
            <p className="text-[10px] text-blue-800 font-semibold mt-0.5">Gathering Guru & Study Tour</p>
          </div>
        </div>

        {/* Main Table & Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            {/* Role Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedOwnerType("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedOwnerType === "ALL"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua Role ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedOwnerType("GURU")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  selectedOwnerType === "GURU"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Guru</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOwnerType("MANAJEMEN")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  selectedOwnerType === "MANAJEMEN"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Manajemen</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOwnerType("SISWA")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  selectedOwnerType === "SISWA"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOwnerType("ORANG_TUA")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  selectedOwnerType === "ORANG_TUA"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Orang Tua</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari no. rek, nama penabung..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition w-48 sm:w-56"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-slate-50 focus:bg-white transition"
              >
                <option value="ALL">Semua Kebutuhan</option>
                <option value="QURBAN">🐑 Tabungan Qurban</option>
                <option value="LIBURAN">🏖️ Liburan / Gathering</option>
                <option value="PENDIDIKAN">🎓 Tabungan Pendidikan</option>
                <option value="HARI_RAYA">🌙 Tabungan Hari Raya</option>
                <option value="SUKARELA">🪙 Tabungan Sukarela</option>
                <option value="WISUDA">🏅 Tabungan Wisuda</option>
              </select>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 font-bold border-b border-slate-200 pb-2">
                  <th className="pb-3 font-semibold">No. Rekening</th>
                  <th className="pb-3 font-semibold">Nama Penabung & Peran</th>
                  <th className="pb-3 font-semibold">Program Tabungan</th>
                  <th className="pb-3 font-semibold text-right">Saldo Terkumpul</th>
                  <th className="pb-3 font-semibold text-right">Target Dana</th>
                  <th className="pb-3 font-semibold text-center">Progres</th>
                  <th className="pb-3 font-semibold text-right">Aksi Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc) => {
                  const config = SAVING_TYPE_CONFIGS[acc.savingType] || SAVING_TYPE_CONFIGS.SUKARELA;
                  const ownerMeta = OWNER_TYPE_BADGES[acc.ownerType] || OWNER_TYPE_BADGES.SISWA;
                  const progressPct =
                    acc.targetAmount > 0 ? Math.min(100, Math.round((acc.currentBalance / acc.targetAmount) * 100)) : 100;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 font-mono font-bold text-slate-800">{acc.accountNo}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-slate-900 block">
                            {acc.ownerName || acc.studentName}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${ownerMeta.bg} ${ownerMeta.text} ${ownerMeta.border}`}
                          >
                            {ownerMeta.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {acc.ownerIdentifier || acc.packetType || "PKBM Askara"}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold mr-1.5 border ${config.badge}`}>
                          {config.icon} {config.label}
                        </span>
                        <span className="text-slate-700 font-medium block mt-1">{acc.savingName}</span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-emerald-800 text-sm">
                        {formatRupiah(acc.currentBalance)}
                      </td>
                      <td className="py-3.5 text-right font-semibold text-slate-600">
                        {acc.targetAmount > 0 ? formatRupiah(acc.targetAmount) : "Fleksibel"}
                      </td>
                      <td className="py-3.5 text-center min-w-28">
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
                          <div
                            className={`h-full transition-all duration-300 ${
                              progressPct >= 100 ? "bg-emerald-600" : "bg-indigo-600"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{progressPct}% Capaian</span>
                      </td>
                      <td className="py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenTrxModal(acc, "SETOR")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                          title="Setor Tabungan"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Setor</span>
                        </button>
                        <button
                          onClick={() => handleOpenTrxModal(acc, "TARIK")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                          title="Tarik Tabungan"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Tarik</span>
                        </button>
                        <button
                          onClick={() => handleOpenPassbook(acc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          title="Buku Tabungan Digital"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Buku</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL BUKA REKENING TABUNGAN BARU                             */}
      {/* ============================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Buka Rekening Tabungan Lembaga</h3>
                  <p className="text-[11px] text-slate-500">Guru • Manajemen • Siswa • Orang Tua</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Owner Role Selector */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Peran Penabung (Role)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["GURU", "MANAJEMEN", "SISWA", "ORANG_TUA"] as SavingOwnerType[]).map((r) => {
                      const isSel = createForm.ownerType === r;
                      const meta = OWNER_TYPE_BADGES[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            let defName = createForm.ownerName;
                            if (r === "GURU") defName = "Drs. Hendra Gunawan";
                            else if (r === "MANAJEMEN") defName = "Staf Tata Usaha";
                            else if (r === "SISWA") defName = "Budi Santoso";
                            else if (r === "ORANG_TUA") defName = "Joko Santoso";

                            setCreateForm({
                              ...createForm,
                              ownerType: r,
                              ownerName: defName,
                            });
                          }}
                          className={`p-2 rounded-xl border text-center font-bold text-xs transition ${
                            isSel
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Jenis Program Tabungan</label>
                  <select
                    value={createForm.savingType}
                    onChange={(e) => {
                      const type = e.target.value as SavingType;
                      let defaultName = "Tabungan Sukarela";
                      let defTarget = "1000000";
                      if (type === "QURBAN") {
                        defaultName = `Tabungan Qurban Sapi 1/7 (${createForm.ownerType})`;
                        defTarget = "3800000";
                      } else if (type === "LIBURAN") {
                        defaultName = `Tabungan Gathering & Liburan (${createForm.ownerType})`;
                        defTarget = "1500000";
                      } else if (type === "PENDIDIKAN") {
                        defaultName = "Tabungan Pendidikan & Kursus Vokasi";
                        defTarget = "5000000";
                      } else if (type === "HARI_RAYA") {
                        defaultName = "Tabungan Hari Raya & THR Mandiri";
                        defTarget = "3000000";
                      } else if (type === "WISUDA") {
                        defaultName = "Tabungan Wisuda & Kelulusan";
                        defTarget = "800000";
                      }
                      setCreateForm({
                        ...createForm,
                        savingType: type,
                        savingName: defaultName,
                        targetAmount: defTarget,
                      });
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  >
                    <option value="QURBAN">🐑 Tabungan Qurban (Idul Adha)</option>
                    <option value="LIBURAN">🏖️ Tabungan Liburan / Family Gathering / Study Tour</option>
                    <option value="PENDIDIKAN">🎓 Tabungan Masa Depan Pendidikan & Kuliah</option>
                    <option value="HARI_RAYA">🌙 Tabungan Hari Raya / THR Mandiri</option>
                    <option value="SUKARELA">🪙 Tabungan Sukarela / Harian</option>
                    <option value="WISUDA">🏅 Tabungan Wisuda & Kelulusan</option>
                    <option value="KARYA_VOKASI">💼 Tabungan Modal Usaha & Karya Vokasi</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Program Tabungan</label>
                  <input
                    type="text"
                    value={createForm.savingName}
                    onChange={(e) => setCreateForm({ ...createForm, savingName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Penabung</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap Penabung"
                    value={createForm.ownerName}
                    onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {createForm.ownerType === "GURU"
                      ? "NIP / Mapel Diampu"
                      : createForm.ownerType === "MANAJEMEN"
                      ? "Jabatan / Bagian"
                      : createForm.ownerType === "SISWA"
                      ? "NISN / Jenjang Paket"
                      : "Hubungan / Nama Siswa"}
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: NIP: 1980... / Guru Matematika"
                    value={createForm.ownerIdentifier}
                    onChange={(e) => setCreateForm({ ...createForm, ownerIdentifier: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={createForm.ownerPhone}
                    onChange={(e) => setCreateForm({ ...createForm, ownerPhone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Dana Tabungan (Rp)</label>
                  <input
                    type="number"
                    value={createForm.targetAmount}
                    onChange={(e) => setCreateForm({ ...createForm, targetAmount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 bg-emerald-50/40 focus:bg-white transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Setoran Awal (Rp)</label>
                  <input
                    type="number"
                    value={createForm.initialDeposit}
                    onChange={(e) => setCreateForm({ ...createForm, initialDeposit: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Memproses..." : "Buka Rekening Tabungan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL SETOR / TARIK TABUNGAN KASIR                           */}
      {/* ============================================================ */}
      {showTrxModal && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                    trxForm.transactionType === "SETOR" ? "bg-emerald-600" : "bg-amber-600"
                  }`}
                >
                  {trxForm.transactionType === "SETOR" ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kasir {trxForm.transactionType === "SETOR" ? "Setoran Tabungan" : "Penarikan Tabungan"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeAccount.accountNo} • {activeAccount.ownerName || activeAccount.studentName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrxModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessTransaction} className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Program:</span>
                  <span className="font-bold text-slate-800">{activeAccount.savingName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Saldo Saat Ini:</span>
                  <span className="font-extrabold text-emerald-800">{formatRupiah(activeAccount.currentBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Transaksi (Rp)</label>
                <input
                  type="number"
                  value={trxForm.amount}
                  onChange={(e) => setTrxForm({ ...trxForm, amount: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-base font-black text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-emerald-50/30 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={trxForm.paymentMethod}
                  onChange={(e) => setTrxForm({ ...trxForm, paymentMethod: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                >
                  <option value="TUNAI">💵 Tunai / Kasir PKBM</option>
                  <option value="TRANSFER">🏦 Transfer Bank</option>
                  <option value="QRIS">📱 QRIS / E-Wallet</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={trxForm.notes}
                  onChange={(e) => setTrxForm({ ...trxForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTrxModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-60 flex items-center gap-1.5 ${
                    trxForm.transactionType === "SETOR" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Memproses..." : "Konfirmasi & Cetak Struk"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL BUKU TABUNGAN DIGITAL (PASSBOOK)                        */}
      {/* ============================================================ */}
      {showPassbookModal && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:rounded-none print:max-w-full print:max-h-none print:overflow-visible print:m-0 print:p-0">
            <div className="print:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Buku Mutasi Tabungan Digital</h3>
                  <p className="text-[11px] text-slate-500">
                    {activeAccount.accountNo} • {activeAccount.ownerName || activeAccount.studentName} ({activeAccount.savingName})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Buku Tabungan</span>
                </button>
                <button
                  onClick={() => setShowPassbookModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Passbook Document View */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
              <div className="printable-document bg-white p-6 rounded-xl border border-slate-200 shadow-xs font-mono text-xs print:border-none print:shadow-none print:p-0 print:max-w-full">
                {/* Header Kop */}
                <div className="text-center pb-4 border-b-2 border-slate-900 mb-4 font-sans">
                  <h2 className="font-extrabold text-sm uppercase tracking-wide">PKBM ASKARA — BUKU TABUNGAN RESMI</h2>
                  <p className="text-[11px] text-slate-600">Pendidikan Kesetaraan Paket A, B, C & Pengembangan Vokasi</p>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 pb-3 border-b border-dashed border-slate-300">
                  <div>
                    <span className="text-slate-500">No. Rekening:</span>{" "}
                    <span className="font-bold text-slate-900">{activeAccount.accountNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Nama Penabung:</span>{" "}
                    <span className="font-bold text-slate-900">{activeAccount.ownerName || activeAccount.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Peran & Identitas:</span>{" "}
                    <span className="font-bold text-slate-900">
                      {activeAccount.ownerType} ({activeAccount.ownerIdentifier || "PKBM"})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Saldo Akhir:</span>{" "}
                    <span className="font-extrabold text-emerald-800">{formatRupiah(activeAccount.currentBalance)}</span>
                  </div>
                </div>

                {/* Mutasi Ledger Table */}
                <table className="w-full text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-sans">
                    <tr>
                      <th className="p-2 border border-slate-300 text-left">Tgl</th>
                      <th className="p-2 border border-slate-300 text-left">No. Kwitansi</th>
                      <th className="p-2 border border-slate-300 text-right">Setor (Cr)</th>
                      <th className="p-2 border border-slate-300 text-right">Tarik (Db)</th>
                      <th className="p-2 border border-slate-300 text-right">Saldo</th>
                      <th className="p-2 border border-slate-300 text-center">Paraf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountTransactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-300">{t.date}</td>
                        <td className="p-2 border border-slate-300 font-bold">{t.receiptNumber}</td>
                        <td className="p-2 border border-slate-300 text-right text-emerald-700 font-bold">
                          {t.transactionType === "SETOR" ? formatRupiah(t.amount) : "-"}
                        </td>
                        <td className="p-2 border border-slate-300 text-right text-rose-700 font-bold">
                          {t.transactionType === "TARIK" ? formatRupiah(t.amount) : "-"}
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-black text-slate-900">
                          {formatRupiah(t.balanceAfter)}
                        </td>
                        <td className="p-2 border border-slate-300 text-center text-slate-400 text-[10px]">
                          ✓ Valid
                        </td>
                      </tr>
                    ))}
                    {accountTransactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          Belum ada transaksi mutasi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STRUK TRANSAKSI THERMAL / SLIP                                */}
      {/* ============================================================ */}
      {showReceiptModal && activeReceiptTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:rounded-none print:max-w-full print:max-h-none print:overflow-visible print:m-0 print:p-0">
            <div className="print:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-900">Bukti Transaksi Tabungan</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Struk</span>
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="printable-document p-6 bg-white font-mono text-[11px] leading-tight text-black print:p-0">
              <div className="text-center pb-3 border-b border-dashed border-black">
                <h3 className="font-bold text-xs uppercase">PKBM ASKARA</h3>
                <p className="text-[10px]">STRUK TRANSAKSI TABUNGAN</p>
                <p className="text-[9px] text-slate-600">Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung</p>
              </div>

              <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>No. Kwitansi:</span>
                  <span className="font-bold">{activeReceiptTrx.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{activeReceiptTrx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>No. Rekening:</span>
                  <span className="font-bold">{activeReceiptTrx.accountNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penabung:</span>
                  <span className="font-bold">{activeReceiptTrx.ownerName || activeReceiptTrx.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Program:</span>
                  <span>{activeReceiptTrx.savingName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-bold uppercase">{activeReceiptTrx.paymentMethod}</span>
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-black space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Jenis Transaksi:</span>
                  <span className="font-bold text-emerald-800 uppercase">{activeReceiptTrx.transactionType}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Nominal:</span>
                  <span>{formatRupiah(activeReceiptTrx.amount)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-dotted border-black">
                  <span>SALDO AKHIR:</span>
                  <span className="text-emerald-900">{formatRupiah(activeReceiptTrx.balanceAfter)}</span>
                </div>
              </div>

              <div className="pt-3 text-center text-[9px] space-y-1">
                <p className="font-bold">*** TERIMA KASIH ***</p>
                <p className="italic">Simpan struk ini sebagai bukti transaksi tabungan yang sah.</p>
                <p className="text-[8px] text-slate-500">Dicatat oleh: {activeReceiptTrx.recordedByName}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
