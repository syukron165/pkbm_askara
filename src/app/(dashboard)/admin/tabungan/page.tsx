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
  RotateCcw,
  AlertTriangle,
  Target,
  Edit3,
  Clock,
  Check,
  XCircle,
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
  pendingTargetRequest?: {
    id: string;
    currentAmount: number;
    requestedAmount: number;
    requestedDate?: string;
    reason: string;
    status: string;
    requestedById: string;
    requestedByName: string;
    requestedByRole: string;
    createdAt: string;
  } | null;
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
  status?: "SUCCESS" | "CANCELLED";
  cancelledAt?: string;
  cancellationReason?: string;
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
  const [showTrxModal, setShowTrxModal] = useState(false);
  const [showPassbookModal, setShowPassbookModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditTargetModal, setShowEditTargetModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const [activeAccount, setActiveAccount] = useState<SavingAccount | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<SavingTransaction[]>([]);
  const [activeReceiptTrx, setActiveReceiptTrx] = useState<SavingTransaction | null>(null);
  const [selectedTrxToCancel, setSelectedTrxToCancel] = useState<SavingTransaction | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Target Requests State
  const [targetRequests, setTargetRequests] = useState<any[]>([]);
  const [rejectModalData, setRejectModalData] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Form State: Edit Target Rencana (Direct Admin/Bendahara)
  const [editTargetForm, setEditTargetForm] = useState({
    accountId: "",
    accountNo: "",
    savingName: "",
    targetAmount: "",
    targetDate: "",
    notes: "",
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

  const fetchTargetRequests = async () => {
    try {
      const res = await fetch("/api/tabungan/target-request?status=PENDING");
      const data = await res.json();
      if (data.success) {
        setTargetRequests(data.requests);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchTargetRequests();
  }, []);

  const handleOpenEditTarget = (acc: SavingAccount) => {
    setEditTargetForm({
      accountId: acc.id,
      accountNo: acc.accountNo,
      savingName: acc.savingName,
      targetAmount: String(acc.targetAmount || 0),
      targetDate: acc.targetDate || "",
      notes: acc.notes || "",
    });
    setShowEditTargetModal(true);
  };

  const handleSaveEditTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/tabungan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTargetForm),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Target rencana tabungan berhasil diperbarui!");
        setShowEditTargetModal(false);
        fetchAccounts();
      } else {
        alert(data.error || "Gagal memperbarui target tabungan");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat memperbarui target.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewRequest = async (
    requestId: string,
    action: "APPROVE" | "REJECT",
    reviewNotes?: string
  ) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/tabungan/target-request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, reviewNotes }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || (action === "APPROVE" ? "Pengajuan berhasil disetujui!" : "Pengajuan berhasil ditolak."));
        setRejectModalData(null);
        setRejectReason("");
        fetchTargetRequests();
        fetchAccounts();
      } else {
        alert(data.error || "Gagal memproses pengajuan target");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleOpenCancelModal = (trx: SavingTransaction) => {
    setSelectedTrxToCancel(trx);
    setCancellationReason("");
    setShowCancelModal(true);
  };

  const handleConfirmCancelTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrxToCancel) return;
    if (!cancellationReason.trim()) {
      alert("Harap masukkan catatan atau alasan pembatalan transaksi.");
      return;
    }

    try {
      setCancelling(true);
      const res = await fetch(
        `/api/tabungan/transaksi?id=${selectedTrxToCancel.id}&reason=${encodeURIComponent(cancellationReason.trim())}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        setShowCancelModal(false);
        setSelectedTrxToCancel(null);
        setCancellationReason("");

        // Refresh all accounts and metrics
        fetchAccounts();

        // Refresh passbook modal if open
        if (activeAccount) {
          if (data.account) {
            setActiveAccount(data.account);
          }
          const trxRes = await fetch(`/api/tabungan/transaksi?accountId=${activeAccount.id}`);
          const trxData = await trxRes.json();
          if (trxData.success) {
            setAccountTransactions(trxData.transactions);
          }
        }
        alert(data.message || "Transaksi berhasil dibatalkan!");
      } else {
        alert(data.error || "Gagal membatalkan transaksi.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat membatalkan transaksi.");
    } finally {
      setCancelling(false);
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

          <div className="mt-5 flex flex-wrap items-center gap-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-200 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Otoritas Kasir: Input Setoran, Penarikan, Cetak Rekening Koran & Batal Transaksi</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs font-semibold text-slate-200">
              <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Pembukaan Rekening Baru dilakukan mandiri oleh Siswa, Orang Tua, Guru & Staf Manajemen</span>
            </div>
            {targetRequests.length > 0 && (
              <button
                onClick={() => setShowRequestsModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition animate-pulse"
              >
                <Clock className="w-4 h-4 text-slate-950" />
                <span>{targetRequests.length} Pengajuan Target Tabungan Menunggu Verifikasi</span>
              </button>
            )}
          </div>
        </div>

        {/* Banner Alert: Pengajuan Perubahan Target Menunggu Verifikasi */}
        {targetRequests.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {targetRequests.length} Permintaan Perubahan Target Tabungan Siswa/Guru/Ortu
                  </h3>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-full uppercase">
                    Perlu Persetujuan
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Siswa, Orang Tua, atau Guru telah mengajukan penyesuaian nominal target rencana tabungan. Silakan tinjau dan berikan keputusan (Setujui / Tolak).
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRequestsModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Tinjau {targetRequests.length} Pengajuan</span>
            </button>
          </div>
        )}

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
                      <td className="py-3.5 text-right">
                        <span className="font-semibold text-slate-700 block">
                          {acc.targetAmount > 0 ? formatRupiah(acc.targetAmount) : "Fleksibel"}
                        </span>
                        {acc.pendingTargetRequest && (
                          <button
                            type="button"
                            onClick={() => setShowRequestsModal(true)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-bold mt-1 hover:bg-amber-200 transition"
                            title="Pengajuan perubahan target menunggu persetujuan Bendahara"
                          >
                            <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                            <span>Req: {formatRupiah(acc.pendingTargetRequest.requestedAmount)}</span>
                          </button>
                        )}
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
                      <td className="py-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleOpenTrxModal(acc, "SETOR")}
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                          title="Setor Tabungan"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Setor</span>
                        </button>
                        <button
                          onClick={() => handleOpenTrxModal(acc, "TARIK")}
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                          title="Tarik Tabungan"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Tarik</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditTarget(acc)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition"
                          title="Edit Target Rencana (Super Admin & Bendahara)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Target</span>
                        </button>
                        <button
                          onClick={() => handleOpenPassbook(acc)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
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
                  <h3 className="text-sm font-extrabold text-slate-900">Rekening Koran / Buku Tabungan Digital</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {activeAccount.accountNo} • {activeAccount.ownerName || activeAccount.studentName} ({activeAccount.savingName})
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
                        E-STATEMENT RESMI
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
                      Official Statement of Savings Account Ledger
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
                      <span className="text-slate-500 font-medium">Nama Pemilik Rekening:</span>
                      <span className="font-bold text-slate-900">{activeAccount.ownerName || activeAccount.studentName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Kategori Nasabah:</span>
                      <span className="font-semibold text-slate-800">
                        {activeAccount.ownerType === "SISWA"
                          ? "Peserta Didik (Siswa)"
                          : activeAccount.ownerType === "ORANG_TUA"
                          ? "Orang Tua / Wali Murid"
                          : activeAccount.ownerType === "GURU"
                          ? "Pendidik / Tutor"
                          : "Manajemen Lembaga"}{" "}
                        {activeAccount.ownerIdentifier ? `• ${activeAccount.ownerIdentifier}` : ""}
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
                          accountTransactions
                            .filter((t) => t.transactionType === "SETOR")
                            .reduce((acc, curr) => acc + curr.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Total Penarikan (Debet):</span>
                      <span className="font-bold text-rose-700">
                        {formatRupiah(
                          accountTransactions
                            .filter((t) => t.transactionType === "TARIK")
                            .reduce((acc, curr) => acc + curr.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-300 bg-white p-2 rounded-xl border">
                      <span className="font-extrabold text-slate-900">SALDO AKHIR REKENING:</span>
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
                        <th className="p-2.5 border-r border-slate-300 text-center w-28">VALIDASI</th>
                        <th className="p-2.5 text-center w-28 print:hidden">AKSI KASIR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {accountTransactions.map((t, idx) => {
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
                                <div className="text-[10px] text-rose-700 font-bold mt-0.5 flex items-center gap-1">
                                  <span>⚠️ Dibatalkan:</span>
                                  <span className="italic font-medium">{t.cancellationReason || "Pembatalan oleh Bendahara"}</span>
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
                            <td className="p-2 border-r border-slate-200 text-right font-mono font-black text-slate-950 bg-emerald-50/20">
                              {formatRupiah(t.balanceAfter)}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center text-[10px] font-bold">
                              {isCancelled ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-rose-100/80 text-rose-800 border border-rose-200">
                                  ⚠️ Batal
                                </span>
                              ) : (
                                <span className="text-emerald-800">
                                  ✓ Terverifikasi
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-center print:hidden">
                              {isCancelled ? (
                                <span className="text-[10px] text-slate-400 italic">Telah Dibatalkan</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelModal(t)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold transition shadow-2xs"
                                  title={`Batalkan ${t.transactionType === "SETOR" ? "Setoran" : "Penarikan"} ini dengan catatan`}
                                >
                                  <RotateCcw className="w-3 h-3 text-rose-600" />
                                  <span>Batal {t.transactionType === "SETOR" ? "Setor" : "Tarik"}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {accountTransactions.length === 0 && (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400 italic">
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
                    <p>1. Rekening koran ini merupakan dokumen resmi mutasi tabungan terencana PKBM Askara.</p>
                    <p>2. Seluruh transaksi kas/transfer dicatat dan diverifikasi secara resmi oleh Bendahara Sekolah.</p>
                    <p>3. Apabila terdapat ketidaksesuaian catatan mutasi, harap menghubungi Bagian Keuangan PKBM Askara.</p>
                  </div>

                  {/* Pengesahan Tanda Tangan */}
                  <div className="flex justify-between sm:justify-end gap-10 text-center text-xs">
                    <div>
                      <p className="text-[11px] text-slate-500 mb-14">Pemilik Rekening / Nasabah,</p>
                      <p className="font-bold text-slate-900 border-b border-slate-400 pb-0.5">
                        {activeAccount.ownerName || activeAccount.studentName}
                      </p>
                      <p className="text-[10px] text-slate-500">Penabung Terdaftar</p>
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

      {/* ============================================================ */}
      {/* MODAL PEMBATALAN TRANSAKSI SETOR / TARIK (VOID)              */}
      {/* ============================================================ */}
      {showCancelModal && selectedTrxToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Batalkan Transaksi Tabungan ({selectedTrxToCancel.transactionType === "SETOR" ? "Batal Setor" : "Batal Tarik"})
                  </h3>
                  <p className="text-[11px] text-slate-500">Koreksi saldo & catatan pembatalan resmi</p>
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancelTransaction} className="p-5 space-y-4 text-xs">
              {/* Ringkasan Transaksi yang Akan Dibatalkan */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">No. Kwitansi:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTrxToCancel.receiptNumber}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Tanggal:</span>
                  <span className="font-medium text-slate-800">{selectedTrxToCancel.date}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Penabung / Rekening:</span>
                  <span className="font-bold text-slate-900">{selectedTrxToCancel.ownerName || selectedTrxToCancel.studentName} ({selectedTrxToCancel.accountNo})</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Jenis Transaksi:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    selectedTrxToCancel.transactionType === "SETOR" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {selectedTrxToCancel.transactionType}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs font-bold">
                  <span className="text-slate-700">Nominal Transaksi:</span>
                  <span className="font-extrabold text-sm text-slate-950">{formatRupiah(selectedTrxToCancel.amount)}</span>
                </div>
              </div>

              {/* Dampak Saldo */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed space-y-1">
                  <p className="font-bold text-amber-950">Dampak Pembatalan Saldo:</p>
                  <p>
                    {selectedTrxToCancel.transactionType === "SETOR"
                      ? `Saldo rekening tabungan akan dikurangi sebesar ${formatRupiah(selectedTrxToCancel.amount)}.`
                      : `Dana penarikan sebesar ${formatRupiah(selectedTrxToCancel.amount)} akan dikembalikan ke saldo tabungan.`}
                  </p>
                </div>
              </div>

              {/* Input Alasan Pembatalan */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Catatan / Alasan Pembatalan Transaksi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Contoh: Salah input nominal setoran / Penabung membatalkan transaksi / Koreksi administrasi kasir..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 bg-slate-50 focus:bg-white transition"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Catatan ini akan tersimpan pada riwayat mutasi rekening dan bukti pembatalan resmi.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={cancelling || !cancellationReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${cancelling ? "animate-spin" : ""}`} />
                  <span>{cancelling ? "Memproses Pembatalan..." : "Konfirmasi Batal Transaksi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* MODAL EDIT TARGET RENCANA TABUNGAN (KHUSUS ADMIN/BENDAHARA)  */}
      {/* ============================================================ */}
      {showEditTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Edit Target Rencana Tabungan (Super Admin & Bendahara)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editTargetForm.accountNo} • {editTargetForm.savingName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditTargetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTarget} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Otoritas <strong>Super Admin & Bendahara</strong>: Perubahan target rencana tabungan akan langsung diterapkan pada buku tabungan dan mengirim notifikasi resmi kepada penabung.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Pos / Program Tabungan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTargetForm.savingName}
                  onChange={(e) => setEditTargetForm({ ...editTargetForm, savingName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white transition"
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
                    value={editTargetForm.targetAmount}
                    onChange={(e) => setEditTargetForm({ ...editTargetForm, targetAmount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-emerald-800 focus:ring-2 focus:ring-blue-600 bg-emerald-50/30 focus:bg-white transition"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Masukkan 0 untuk tabungan fleksibel/tanpa target.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Target Tanggal</label>
                  <input
                    type="date"
                    value={editTargetForm.targetDate}
                    onChange={(e) => setEditTargetForm({ ...editTargetForm, targetDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Rencana Penggunaan Dana</label>
                <textarea
                  value={editTargetForm.notes}
                  onChange={(e) => setEditTargetForm({ ...editTargetForm, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white transition"
                  placeholder="Contoh: Target pelunasan sebelum bulan Mei untuk persiapan wisuda..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditTargetModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Menyimpan..." : "Simpan Perubahan Target"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL TINJAU PENGAJUAN PERUBAHAN TARGET TABUNGAN             */}
      {/* ============================================================ */}
      {showRequestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Tinjau Pengajuan Perubahan Target Tabungan ({targetRequests.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">Persetujuan & validasi perubahan target dana oleh Bendahara</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRequestsModal(false);
                  setRejectModalData(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {targetRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-700">Tidak ada pengajuan target yang menunggu persetujuan.</p>
                  <p className="text-xs text-slate-400 mt-1">Seluruh permintaan perubahan target tabungan telah ditinjau.</p>
                </div>
              ) : (
                targetRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 bg-slate-50/50 hover:bg-white transition space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{req.penabungName}</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-full text-[10px] font-extrabold uppercase">
                            {req.requestedByRole}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {req.accountNo} • {req.savingName}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Diajukan: {new Date(req.createdAt).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Saldo Terkumpul Saat Ini</span>
                        <span className="font-bold text-slate-900">{formatRupiah(req.currentBalance || 0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Target Sebelumnya</span>
                        <span className="font-bold text-slate-600 line-through">
                          {req.currentAmount > 0 ? formatRupiah(req.currentAmount) : "Fleksibel"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Target Baru yang Diajukan</span>
                        <span className="font-black text-emerald-700 text-xs">
                          {formatRupiah(req.requestedAmount)}
                        </span>
                        {req.requestedDate && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Target Tanggal: {req.requestedDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/70 text-[11px] text-slate-700">
                      <span className="font-bold text-amber-950 block mb-0.5">Alasan Pengajuan Perubahan:</span>
                      <p className="italic text-slate-800">"{req.reason}"</p>
                    </div>

                    {/* Aksi Setujui / Tolak */}
                    {rejectModalData?.id === req.id ? (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                        <label className="block font-bold text-rose-900 text-[11px]">
                          Alasan Penolakan Pengajuan Target (Wajib):
                        </label>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Contoh: Target baru melebihi batas waktu / Konfirmasi ke admin terlebih dahulu..."
                          className="w-full border border-rose-300 rounded-lg p-2 text-xs text-slate-900 bg-white"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModalData(null);
                              setRejectReason("");
                            }}
                            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            disabled={submitting || !rejectReason.trim()}
                            onClick={() => handleReviewRequest(req.id, "REJECT", rejectReason)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Konfirmasi Tolak</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectModalData(req);
                            setRejectReason("");
                          }}
                          disabled={submitting}
                          className="px-3.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleReviewRequest(req.id, "APPROVE")}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui Target Baru</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowRequestsModal(false);
                  setRejectModalData(null);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
