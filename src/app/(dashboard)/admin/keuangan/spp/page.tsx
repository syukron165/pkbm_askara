"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  RefreshCw,
  Receipt,
  Printer,
  X,
  FileText,
  Building2,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Check,
  Paperclip,
  Upload,
  ImageIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function terbilang(n: number): string {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  n = Math.floor(Math.abs(n));
  if (n < 12) return bilangan[n];
  if (n < 20) return terbilang(n - 10) + " Belas";
  if (n < 100) return (bilangan[Math.floor(n / 10)] + " Puluh " + terbilang(n % 10)).trim();
  if (n < 200) return ("Seratus " + terbilang(n - 100)).trim();
  if (n < 1000) return (bilangan[Math.floor(n / 100)] + " Ratus " + terbilang(n % 100)).trim();
  if (n < 2000) return ("Seribu " + terbilang(n - 1000)).trim();
  if (n < 1000000) return (terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000)).trim();
  if (n < 1000000000)
    return (terbilang(Math.floor(n / 1000000)) + " Juta " + terbilang(n % 1000000)).trim();
  return "";
}

interface Payment {
  id: string;
  studentId: string;
  amount: number;
  finalAmount: number;
  discount: number;
  status: string;
  paymentDate: string | null;
  dueDate: string;
  periodMonth: number;
  periodYear: number;
  paymentMethod: string | null;
  receiptNumber: string | null;
  notes: string | null;
  student: { user: { name: string }; nisn: string | null; packetType: string };
  feeType: { name: string; category: string };
}

const DEFAULT_FEE_TYPES = [
  { id: "fee-spp-c", name: "SPP Bulanan Paket C", amount: 200000, category: "SPP" },
  { id: "fee-spp-b", name: "SPP Bulanan Paket B", amount: 150000, category: "SPP" },
  { id: "fee-spp-a", name: "SPP Bulanan Paket A", amount: 100000, category: "SPP" },
  { id: "fee-reg", name: "Biaya Pendaftaran Siswa Baru", amount: 350000, category: "PENDAFTARAN" },
  { id: "fee-exam", name: "Biaya Asesmen & Ujian CBT Kesetaraan", amount: 250000, category: "UJIAN" },
  { id: "fee-book", name: "Modul & Bahan Ajar Digital Kesetaraan", amount: 150000, category: "PERLENGKAPAN" },
  { id: "fee-vokasi", name: "Keterampilan Vokasi & Sertifikasi Kompetensi", amount: 300000, category: "LAINNYA" },
];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  LUNAS: { label: "Lunas", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PENDING: { label: "Belum Bayar", icon: Clock, className: "bg-amber-100 text-amber-800 border-amber-200" },
  TERLAMBAT: { label: "Terlambat", icon: XCircle, className: "bg-rose-100 text-rose-800 border-rose-200" },
  SEBAGIAN: { label: "Sebagian", icon: AlertCircle, className: "bg-blue-100 text-blue-800 border-blue-200" },
};

// ─── Komponen Upload Bukti Pembayaran ───────────────────────────────────────
function FileUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload gagal");
      onChange(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isPdf = value?.endsWith(".pdf");

  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        {isPdf ? (
          <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Preview bukti" className="w-12 h-10 object-cover rounded border border-emerald-300" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bukti terunggah
          </p>
          <a href={value} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 mt-0.5 truncate">
            <ExternalLink className="w-3 h-3 shrink-0" /> Lihat file
          </a>
        </div>
        <button type="button" onClick={() => onChange("")} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition" title="Hapus bukti">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed transition cursor-pointer select-none ${
          dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40"
        }`}
      >
        {uploading ? (
          <><Loader2 className="w-5 h-5 text-emerald-500 animate-spin" /><p className="text-xs text-slate-500">Mengunggah...</p></>
        ) : (
          <><div className="flex gap-2"><ImageIcon className="w-4 h-4 text-slate-400" /><FileText className="w-4 h-4 text-slate-400" /></div>
          <p className="text-xs font-medium text-slate-600">Klik atau seret file ke sini</p>
          <p className="text-[11px] text-slate-400">JPG, PNG, WEBP, atau PDF · maks 5 MB</p></>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

export default function SPPRekapPage() {
  const now = new Date();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<"STANDARD" | "THERMAL">("STANDARD");

  // Form state
  const [form, setForm] = useState({
    studentId: "",
    feeTypeId: DEFAULT_FEE_TYPES[0].id,
    feeTypeName: DEFAULT_FEE_TYPES[0].name,
    amount: String(DEFAULT_FEE_TYPES[0].amount),
    discount: "0",
    status: "LUNAS",
    paymentDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().slice(0, 10),
    periodMonth: now.getMonth() + 1,
    periodYear: now.getFullYear(),
    paymentMethod: "TUNAI",
    receiptNumber: "",
    notes: "",
    proofUrl: "",
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      if (statusFilter) params.append("status", statusFilter);
      const res = await fetch(`/api/keuangan/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch {
      setPayments([]);
    }
    setLoading(false);
  }, [month, year, statusFilter]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      // API /api/students returns { success, data: [...] }
      const list: any[] = data.data || data.students || [];
      if (list.length > 0) {
        setStudents(list);
        setForm((prev) => ({
          ...prev,
          studentId: prev.studentId || list[0].id,
        }));
      }
    } catch (err) {
      console.error("Gagal mengambil data siswa:", err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    setPage(1);
  }, [fetchPayments]);

  const handleOpenAddModal = () => {
    const generatedReceipt = `KW-${year}/${String(month).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    setForm({
      studentId: students.length > 0 ? students[0].id : "",
      feeTypeId: DEFAULT_FEE_TYPES[0].id,
      feeTypeName: DEFAULT_FEE_TYPES[0].name,
      amount: String(DEFAULT_FEE_TYPES[0].amount),
      discount: "0",
      status: "LUNAS",
      paymentDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().slice(0, 10),
      periodMonth: month,
      periodYear: year,
      paymentMethod: "TUNAI",
      receiptNumber: generatedReceipt,
      notes: "Pembayaran terverifikasi lunas.",
      proofUrl: "",
    });
    setShowModal(true);
  };

  const handleFeeTypeChange = (feeId: string) => {
    const selected = DEFAULT_FEE_TYPES.find((f) => f.id === feeId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        feeTypeId: selected.id,
        feeTypeName: selected.name,
        amount: String(selected.amount),
      }));
    } else {
      setForm((prev) => ({ ...prev, feeTypeId: feeId }));
    }
  };

  const filtered = payments.filter((p) => {
    const name = p.student?.user?.name?.toLowerCase() || "";
    const nisn = p.student?.nisn?.toLowerCase() || "";
    const q = search.toLowerCase();
    return name.includes(q) || nisn.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/keuangan/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.payment) {
        setShowModal(false);
        fetchPayments();

        // Find selected student details for receipt display
        const targetStudent = students.find((s) => s.id === form.studentId);
        const receiptData = {
          ...data.payment,
          student: {
            user: { name: targetStudent?.name || data.payment.student?.user?.name || "Peserta Didik" },
            nisn: targetStudent?.nisn || data.payment.student?.nisn || "-",
            packetType: targetStudent?.packet || data.payment.student?.packetType || "Paket C",
          },
          feeType: {
            name: form.feeTypeName || data.payment.feeType?.name || "SPP Bulanan",
            category: "SPP",
          },
          amount: parseFloat(form.amount) || data.payment.amount,
          discount: parseFloat(form.discount) || data.payment.discount,
          finalAmount: (parseFloat(form.amount) || data.payment.amount) - (parseFloat(form.discount) || 0),
          receiptNumber: data.receiptNumber || data.payment.receiptNumber || form.receiptNumber,
          paymentDate: form.paymentDate,
          paymentMethod: form.paymentMethod,
          periodMonth: form.periodMonth,
          periodYear: form.periodYear,
        };

        setActiveReceipt(receiptData);
        setShowReceiptModal(true);
      } else {
        alert(data.error || "Gagal mencatat pembayaran");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/keuangan/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, paymentDate: new Date().toISOString() }),
      });
      if (res.ok) {
        const p = payments.find((item) => item.id === id);
        if (p) {
          setActiveReceipt({
            ...p,
            status: newStatus,
            paymentDate: new Date().toISOString().slice(0, 10),
            receiptNumber: p.receiptNumber || `KW-${p.periodYear}/${String(p.periodMonth).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
          });
          setShowReceiptModal(true);
        }
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewReceipt = (payment: Payment) => {
    setActiveReceipt({
      ...payment,
      receiptNumber: payment.receiptNumber || `KW-${payment.periodYear}/${String(payment.periodMonth).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Summary stats
  const lunas = payments.filter((p) => p.status === "LUNAS").length;
  const pending = payments.filter((p) => ["PENDING", "TERLAMBAT"].includes(p.status)).length;
  const totalLunas = payments.filter((p) => p.status === "LUNAS").reduce((s, p) => s + p.finalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Background Dashboard Content (Hidden in Print Mode) */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-600" />
              Rekap & Manajemen SPP
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola pembayaran SPP dan biaya pendidikan seluruh peserta didik dengan pencatatan kwitansi otomatis.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Catat Pembayaran
          </button>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Tagihan",
            value: payments.length + " transaksi",
            sub: `${MONTHS[month - 1]} ${year}`,
            color: "bg-slate-50 border-slate-200",
          },
          {
            label: "Sudah Lunas",
            value: lunas + " siswa",
            sub: formatRupiah(totalLunas),
            color: "bg-emerald-50 border-emerald-200",
          },
          {
            label: "Belum Bayar",
            value: pending + " siswa",
            sub: "Perlu ditindaklanjuti",
            color: "bg-amber-50 border-amber-200",
          },
          {
            label: "Total Terkumpul",
            value: formatRupiah(totalLunas),
            sub: `Bulan ${MONTHS[month - 1]}`,
            color: "bg-blue-50 border-blue-200",
          },
        ].map((card, i) => (
          <div key={i} className={`${card.color} border rounded-xl p-4`}>
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className="text-base sm:text-lg font-bold text-slate-800 mt-1">{card.value}</p>
            <p className="text-[11px] text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Month/Year selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <button
              onClick={() => {
                if (month === 1) {
                  setMonth(12);
                  setYear((y) => y - 1);
                } else setMonth((m) => m - 1);
              }}
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-sm font-semibold text-slate-800 w-28 text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button
              onClick={() => {
                if (month === 12) {
                  setMonth(1);
                  setYear((y) => y + 1);
                } else setMonth((m) => m + 1);
              }}
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Status</option>
              <option value="LUNAS">Lunas</option>
              <option value="PENDING">Belum Bayar</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="SEBAGIAN">Sebagian</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={fetchPayments}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-500"
            title="Muat Ulang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-sm text-slate-600 font-medium"
          >
            <Printer className="w-4 h-4" /> Cetak Rekap
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Siswa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Paket</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Jenis Biaya</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Tagihan Net</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tgl Bayar</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Metode</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Bukti</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Kwitansi & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Belum ada data pembayaran untuk periode ini</p>
                    <p className="text-xs mt-1">Tambah pembayaran baru dengan tombol "Catat Pembayaran"</p>
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{p.student?.user?.name || "Peserta Didik"}</p>
                        <p className="text-[11px] text-slate-400">NISN: {p.student?.nisn || "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-medium">{p.student?.packetType || "Paket C"}</td>
                      <td className="px-4 py-3 text-slate-700 text-xs font-medium">{p.feeType?.name || "SPP Bulanan"}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatRupiah(p.finalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sc.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {p.paymentDate
                          ? new Date(p.paymentDate).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.paymentMethod || "TUNAI"}</td>
                      <td className="px-4 py-3 text-center">
                        {(p as any).proofUrl ? (
                          <a href={(p as any).proofUrl} target="_blank" rel="noreferrer" title="Lihat bukti pembayaran"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition">
                            <Paperclip className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewReceipt(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition"
                            title="Lihat & Cetak Kwitansi"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Kwitansi</span>
                          </button>
                          {p.status !== "LUNAS" && (
                            <button
                              onClick={() => handleStatusChange(p.id, "LUNAS")}
                              className="text-[11px] px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-semibold transition"
                            >
                              Tandai Lunas
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <p className="text-slate-500 text-xs">
              {filtered.length} data — halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition text-xs font-medium"
              >
                ← Sebelumnya
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition text-xs font-medium"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* ============================================================ */}
      {/* ADD PAYMENT MODAL (Fixed Scroll & Visible Buttons)           */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Catat Pembayaran Baru
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekam transaksi pembayaran dan otomatis terbitkan bukti kwitansi resmi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Siswa Dropdown */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Peserta Didik <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    required
                  >
                    <option value="" disabled>-- Pilih Siswa Terdaftar --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} — NISN: {st.nisn || "-"} ({st.packet} • {st.class})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jenis Biaya Dropdown */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Biaya Pendidikan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.feeTypeId}
                    onChange={(e) => handleFeeTypeChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    required
                  >
                    {DEFAULT_FEE_TYPES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {formatRupiah(f.amount)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nominal & Diskon */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Tagihan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="200000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Potongan / Beasiswa (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>

                {/* Periode Bulan & Tahun */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Periode Bulan</label>
                  <select
                    value={form.periodMonth}
                    onChange={(e) => setForm({ ...form, periodMonth: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Periode Tahun</label>
                  <input
                    type="number"
                    value={form.periodYear}
                    onChange={(e) => setForm({ ...form, periodYear: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>

                {/* Status & Metode Bayar */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  >
                    <option value="LUNAS">Lunas (Verifikasi)</option>
                    <option value="PENDING">Belum Bayar</option>
                    <option value="SEBAGIAN">Sebagian / Cicil</option>
                    <option value="TERLAMBAT">Terlambat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Metode Bayar</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  >
                    <option value="TUNAI">Tunai / Kasir PKBM</option>
                    <option value="TRANSFER">Transfer Bank (BCA/BRI/Mandiri)</option>
                    <option value="VA">Virtual Account</option>
                    <option value="QRIS">QRIS / E-Wallet</option>
                  </select>
                </div>

                {/* Tanggal & Jatuh Tempo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pembayaran</label>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jatuh Tempo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Nomor Kuitansi & Catatan */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kwitansi Resmi</label>
                  <input
                    type="text"
                    placeholder="KW-2026/08-1001"
                    value={form.receiptNumber}
                    onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-800 bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                  <textarea
                    placeholder="Contoh: Diterima langsung di kasir PKBM Askara..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    Bukti Pembayaran
                    <span className="text-slate-400 font-normal">(opsional — foto transfer / struk)</span>
                  </label>
                  <FileUploadField
                    value={form.proofUrl}
                    onChange={(url) => setForm({ ...form, proofUrl: url })}
                  />
                </div>
              </div>

              {/* Total Calculation Highlight */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Net Pembayaran</span>
                  <p className="text-xs text-emerald-600">Nominal dikurangi potongan beasiswa</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-900">
                    {formatRupiah(Math.max(0, (parseFloat(form.amount) || 0) - (parseFloat(form.discount) || 0)))}
                  </span>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan & Terbitkan Kwitansi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* KWITANSI DIGITAL POPUP / PRINTABLE RECEIPT                   */}
      {/* ============================================================ */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:rounded-none print:max-w-full print:max-h-none print:overflow-visible print:m-0 print:p-0">
            {/* Top Bar for Modal Controls (Hidden in Print) */}
            <div className="print:hidden p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kwitansi Bukti Pembayaran Resmi</h3>
                  <p className="text-[11px] text-slate-500">PKBM Askara — Dokumen Keuangan Terverifikasi</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Format Toggle: Standard A4 vs Thermal 58mm */}
                <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setReceiptFormat("STANDARD")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      receiptFormat === "STANDARD" ? "bg-white text-emerald-800 shadow-2xs font-bold" : "text-slate-600"
                    }`}
                  >
                    📄 Voucher A4/A5
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptFormat("THERMAL")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      receiptFormat === "THERMAL" ? "bg-white text-emerald-800 shadow-2xs font-bold" : "text-slate-600"
                    }`}
                  >
                    🧾 Struk Thermal (58/80mm)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Kwitansi Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-0">
              {receiptFormat === "THERMAL" ? (
                /* ============================================================ */
                /* THERMAL POS RECEIPT (58mm / 80mm COMPACT PRINT)              */
                /* ============================================================ */
                <div className="printable-document max-w-[320px] mx-auto p-4 bg-white border border-dashed border-slate-400 font-mono text-[11px] leading-tight text-black print:border-none print:p-0 print:max-w-full">
                  <div className="text-center pb-3 border-b border-dashed border-black">
                    <h3 className="font-bold text-xs uppercase tracking-wide">PKBM ASKARA</h3>
                    <p className="text-[10px] mt-0.5">Pendidikan Kesetaraan Paket A, B, C</p>
                    <p className="text-[9px] text-slate-600">Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung</p>
                    <p className="text-[9px]">Telp: (022) 87518584 / 085156560630</p>
                  </div>

                  <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>No:</span>
                      <span className="font-bold">{activeReceipt.receiptNumber || "KW-2026/08-001"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tgl:</span>
                      <span>{new Date().toLocaleDateString("id-ID")} {new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Siswa:</span>
                      <span className="font-bold truncate max-w-[170px]">{activeReceipt.student?.user?.name || "Peserta Didik"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NISN/Paket:</span>
                      <span>{activeReceipt.student?.nisn || "-"} ({activeReceipt.student?.packetType || "Paket C"})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Metode:</span>
                      <span className="font-bold uppercase">{activeReceipt.paymentMethod || "TUNAI"}</span>
                    </div>
                  </div>

                  <div className="py-2.5 border-b border-dashed border-black space-y-1.5">
                    <div>
                      <p className="font-bold">{activeReceipt.feeType?.name || "SPP Bulanan"}</p>
                      <p className="text-[9px] text-slate-600">Periode: {MONTHS[(activeReceipt.periodMonth || 1) - 1]} {activeReceipt.periodYear}</p>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Nominal:</span>
                      <span>{formatRupiah(activeReceipt.amount)}</span>
                    </div>
                    {activeReceipt.discount > 0 && (
                      <div className="flex justify-between text-[10px]">
                        <span>Potongan:</span>
                        <span>- {formatRupiah(activeReceipt.discount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="py-2.5 border-b border-dashed border-black space-y-1 text-xs">
                    <div className="flex justify-between font-black">
                      <span>TOTAL:</span>
                      <span>{formatRupiah(activeReceipt.finalAmount || activeReceipt.amount)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-700">
                      <span>STATUS:</span>
                      <span className="font-bold text-emerald-800">LUNAS</span>
                    </div>
                  </div>

                  <div className="pt-3 text-center text-[9px] space-y-1">
                    <p className="font-bold">*** TERIMA KASIH ***</p>
                    <p className="italic">Simpan struk ini sebagai bukti pembayaran yang sah.</p>
                    <p className="text-[8px] text-slate-500 font-mono">pkbmaskara.sch.id</p>
                  </div>
                </div>
              ) : (
                /* ============================================================ */
                /* STANDARD VOUCHER / A4-A5 FORMAL KWITANSI                     */
                /* ============================================================ */
                <div className="printable-document border-2 border-emerald-700 rounded-2xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-b from-emerald-50/20 to-white print:border-none print:shadow-none print:rounded-none print:p-0 print:max-w-full">
                  {/* Background Watermark Stamp */}
                  <div className="absolute right-6 bottom-16 opacity-10 pointer-events-none select-none rotate-[-15deg]">
                    <div className="border-4 border-emerald-800 text-emerald-800 font-black text-6xl px-6 py-2 rounded-2xl tracking-widest uppercase">
                      LUNAS
                    </div>
                  </div>

                  {/* Kop Lembaga */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-center justify-between">
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
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                          PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) ASKARA
                        </h2>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP • NPSN: P9998766
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung • Telp: (022) 87518584 • Email: pkbm.askara@gmail.com
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Title and Receipt Number */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-slate-300 pb-4 mb-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        TANDA BUKTI PEMBAYARAN RESMI
                      </span>
                      <h1 className="text-xl font-black text-slate-900 mt-1">KWITANSI PEMBAYARAN</h1>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-slate-500 font-semibold">NO. KWITANSI</p>
                      <p className="text-sm font-mono font-black text-emerald-800 tracking-wide">
                        {activeReceipt.receiptNumber || `KW-${activeReceipt.periodYear}/${String(activeReceipt.periodMonth).padStart(2, "0")}-001`}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs mb-5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Nama Siswa</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {activeReceipt.student?.user?.name || "Peserta Didik"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">NISN / Jenjang</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {activeReceipt.student?.nisn || "-"} • {activeReceipt.student?.packetType || "Paket C"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Tanggal Bayar</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {activeReceipt.paymentDate
                          ? new Date(activeReceipt.paymentDate).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : new Date().toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Metode Pembayaran</span>
                      <p className="font-bold text-emerald-700 mt-0.5">
                        {activeReceipt.paymentMethod || "TUNAI"}
                      </p>
                    </div>
                  </div>

                  {/* Table Breakdown */}
                  <table className="w-full text-xs border border-slate-200 mb-4 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2.5 text-left font-bold">No</th>
                        <th className="p-2.5 text-left font-bold">Deskripsi Pembayaran</th>
                        <th className="p-2.5 text-center font-bold">Periode</th>
                        <th className="p-2.5 text-right font-bold">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 text-slate-500 font-semibold">1</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {activeReceipt.feeType?.name || "SPP Bulanan Pendidikan Kesetaraan"}
                          {activeReceipt.notes ? (
                            <span className="block text-[11px] text-slate-500 font-normal italic">
                              Catatan: {activeReceipt.notes}
                            </span>
                          ) : null}
                        </td>
                        <td className="p-2.5 text-center font-medium text-slate-700">
                          {MONTHS[(activeReceipt.periodMonth || 1) - 1]} {activeReceipt.periodYear}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          {formatRupiah(activeReceipt.amount)}
                        </td>
                      </tr>
                      {activeReceipt.discount > 0 && (
                        <tr className="bg-emerald-50/40 text-emerald-800 font-semibold">
                          <td className="p-2 text-center" colSpan={3}>
                            Potongan / Keringanan Beasiswa:
                          </td>
                          <td className="p-2 text-right text-rose-600">
                            - {formatRupiah(activeReceipt.discount)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-100 font-extrabold text-sm border-t-2 border-slate-300">
                        <td className="p-3 text-right" colSpan={3}>
                          TOTAL DITERIMA (NET):
                        </td>
                        <td className="p-3 text-right text-emerald-900">
                          {formatRupiah(activeReceipt.finalAmount || activeReceipt.amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Terbilang Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-6 text-xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">
                      Terbilang:
                    </span>
                    <p className="font-bold italic text-slate-800">
                      # {terbilang(activeReceipt.finalAmount || activeReceipt.amount)} Rupiah #
                    </p>
                  </div>

                  {/* Signature & Verification Seal */}
                  <div className="grid grid-cols-2 gap-6 pt-2 items-end">
                    <div className="flex items-center space-x-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <ShieldCheck className="w-8 h-8 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                          STATUS: LUNAS & TERVERIFIKASI
                        </span>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Dokumen digital ini sah tanpa tanda tangan basah berdasarkan sistem keuangan PKBM Askara.
                        </p>
                      </div>
                    </div>

                    <div className="text-center sm:text-right">
                      <p className="text-xs text-slate-500 font-medium">
                        Jakarta,{" "}
                        {new Date().toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">Bendahara / Kasir Keuangan</p>
                      <div className="h-12 flex items-center justify-center sm:justify-end">
                        <span className="font-serif italic font-bold text-emerald-800 opacity-90 text-sm">
                          PKBM Askara Keuangan
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-40 sm:min-w-48 text-center sm:text-right">
                        Administrator Keuangan
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Hidden in Print) */}
            <div className="print:hidden p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Kwitansi tersimpan otomatis di riwayat keuangan siswa.
              </span>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Tutup Kwitansi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
