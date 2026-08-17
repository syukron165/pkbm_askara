"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Coins,
  Plus,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  Paperclip,
  Upload,
  X,
  FileText,
  ExternalLink,
  ImageIcon,
  CheckCircle2,
  Loader2,
  Building2,
  HeartHandshake,
  Landmark,
  Briefcase,
  Store,
  Printer,
  Receipt,
  Sparkles,
  ShieldCheck,
  Building,
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

const CATEGORIES = [
  {
    value: "YAYASAN",
    label: "Dana Yayasan & Pembina",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Building2,
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    value: "SUMBANGAN",
    label: "Sumbangan & Donasi Sukarela",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: HeartHandshake,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "HIBAH_PEMERINTAH",
    label: "BOS / BOP Kesetaraan & Hibah",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Landmark,
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "CSR",
    label: "CSR & Kemitraan Industri",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Briefcase,
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "UNIT_USAHA",
    label: "Unit Usaha & Vokasi PKBM",
    color: "bg-teal-100 text-teal-800 border-teal-200",
    icon: Store,
    badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    value: "KERJASAMA",
    label: "Kerjasama Lembaga / Mitra",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Sparkles,
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    value: "LAINNYA",
    label: "Pemasukan Sektor Lainnya",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Coins,
    badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
  },
];

interface OtherIncome {
  id: string;
  title: string;
  category: string;
  amount: number;
  incomeDate: string;
  periodMonth: number;
  periodYear: number;
  sourceName: string | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
  description: string | null;
  proofUrl: string | null;
}

// ─── Komponen Upload Bukti Penerimaan ───────────────────────────────────────
function FileUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
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
          <img
            src={value}
            alt="Preview bukti"
            className="w-12 h-10 object-cover rounded-lg border border-emerald-300"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bukti terunggah
          </p>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
          >
            <ExternalLink className="w-3 h-3 shrink-0" /> Lihat file dokumen
          </a>
        </div>
        <button
          type="button"
          onClick={() => onChange("")}
          className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Hapus bukti"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed transition cursor-pointer select-none ${
          dragOver
            ? "border-emerald-400 bg-emerald-50"
            : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Mengunggah berkas...</p>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <ImageIcon className="w-5 h-5 text-slate-400" />
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-700">
              Klik atau seret bukti transfer / surat hibah ke sini
            </p>
            <p className="text-[11px] text-slate-400">
              Format JPG, PNG, WEBP, atau PDF · maks 5 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

export default function PemasukanLainPage() {
  const now = new Date();
  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [totalByCategory, setTotalByCategory] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [catFilter, setCatFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<OtherIncome | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [openReceiptAfterSave, setOpenReceiptAfterSave] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "YAYASAN",
    amount: "",
    incomeDate: now.toISOString().slice(0, 10),
    periodMonth: now.getMonth() + 1,
    periodYear: now.getFullYear(),
    sourceName: "",
    paymentMethod: "TRANSFER",
    receiptNumber: "",
    description: "",
    proofUrl: "",
  });

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });
      if (catFilter) params.append("category", catFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/keuangan/other-income?${params}`);
      const data = await res.json();
      setIncomes(data.incomes || []);
      setTotalByCategory(data.totalByCategory || {});
      setTotal(data.total || 0);
    } catch {
      setIncomes([]);
    }
    setLoading(false);
  }, [month, year, catFilter, search]);

  useEffect(() => {
    fetchIncomes();
    setPage(1);
  }, [fetchIncomes]);

  const handleOpenAddModal = () => {
    const generatedReceipt = `P-NON-${year}/${String(month).padStart(2, "0")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    setForm({
      title: "",
      category: "YAYASAN",
      amount: "",
      incomeDate: now.toISOString().slice(0, 10),
      periodMonth: month,
      periodYear: year,
      sourceName: "",
      paymentMethod: "TRANSFER",
      receiptNumber: generatedReceipt,
      description: "",
      proofUrl: "",
    });
    setOpenReceiptAfterSave(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/keuangan/other-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.otherIncome) {
        setShowModal(false);
        fetchIncomes();
        if (openReceiptAfterSave) {
          setActiveReceipt(data.otherIncome);
          setShowReceiptModal(true);
        }
      } else {
        alert(data.error || "Gagal mencatat pemasukan");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data pemasukan ini?")) return;
    await fetch(`/api/keuangan/other-income?id=${id}`, { method: "DELETE" });
    fetchIncomes();
  };

  const getCatConfig = (val: string) =>
    CATEGORIES.find((c) => c.value === val) || CATEGORIES[6];

  const filtered = incomes.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.sourceName?.toLowerCase() || "").includes(q) ||
      (item.receiptNumber?.toLowerCase() || "").includes(q) ||
      (item.description?.toLowerCase() || "").includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const yayasanTotal = totalByCategory["YAYASAN"] || 0;
  const sumbanganTotal = totalByCategory["SUMBANGAN"] || 0;
  const hibahTotal = totalByCategory["HIBAH_PEMERINTAH"] || 0;
  const csrUsahaTotal =
    (totalByCategory["CSR"] || 0) +
    (totalByCategory["UNIT_USAHA"] || 0) +
    (totalByCategory["KERJASAMA"] || 0) +
    (totalByCategory["LAINNYA"] || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600" />
            Pemasukan Sektor Lain (Non-SPP)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan dan rekapitulasi dana dari Yayasan, Sumbangan / Donasi, Hibah BOS, CSR, serta Unit Usaha PKBM.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Catat Pemasukan Baru
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-800">Total Pemasukan Non-SPP</p>
          <p className="text-lg sm:text-xl font-bold text-emerald-900 mt-1">
            {loading ? "..." : formatRupiah(total)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            {MONTHS[month - 1]} {year} · {incomes.length} transaksi
          </p>
        </div>

        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-purple-800">Dana Yayasan & Pembina</p>
          <p className="text-lg sm:text-xl font-bold text-purple-900 mt-1">
            {loading ? "..." : formatRupiah(yayasanTotal)}
          </p>
          <p className="text-[11px] text-purple-600 mt-0.5">Dukungan operasional lembaga</p>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-800">BOS / BOP & Hibah</p>
          <p className="text-lg sm:text-xl font-bold text-blue-900 mt-1">
            {loading ? "..." : formatRupiah(hibahTotal)}
          </p>
          <p className="text-[11px] text-blue-600 mt-0.5">Pemerintah & dinas terkait</p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-800">Sumbangan, CSR & Usaha</p>
          <p className="text-lg sm:text-xl font-bold text-amber-900 mt-1">
            {loading ? "..." : formatRupiah(sumbanganTotal + csrUsahaTotal)}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">Donasi wali murid & mitra vokasi</p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = catFilter === cat.value;
          const subtotal = totalByCategory[cat.value] || 0;
          return (
            <button
              key={cat.value}
              onClick={() => setCatFilter(isSelected ? "" : cat.value)}
              className={`p-3 rounded-xl border text-left transition ${
                isSelected
                  ? cat.color + " ring-2 ring-offset-1 ring-emerald-500 shadow-xs font-bold"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 opacity-70" />
                <p className="text-xs font-semibold text-slate-700 truncate">{cat.label}</p>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {loading ? "..." : formatRupiah(subtotal)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters & Actions Bar */}
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
              className="p-1 hover:bg-slate-200 rounded transition"
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
              className="p-1 hover:bg-slate-200 rounded transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari uraian, sumber dana/donatur, atau no. kwitansi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={fetchIncomes}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Uraian & No. Kwitansi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Kategori Sektor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Sumber / Donatur
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Nominal Masuk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Metode
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Bukti
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
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
                    <Coins className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-600" />
                    <p className="font-semibold text-slate-700">
                      Belum ada data pemasukan non-SPP untuk periode ini
                    </p>
                    <p className="text-xs mt-1 text-slate-400">
                      Gunakan tombol &quot;Catat Pemasukan Baru&quot; untuk merekam dana masuk
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const cat = getCatConfig(item.category);
                  const CatIcon = cat.icon;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{item.title}</p>
                        <p className="text-[11px] font-mono text-emerald-700">
                          {item.receiptNumber || "-"}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cat.color}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-700">
                          {item.sourceName || "Hamba Allah / Umum"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 text-sm">
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(item.incomeDate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                        {item.paymentMethod || "TRANSFER"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.proofUrl ? (
                          <a
                            href={item.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Lihat bukti penerimaan"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveReceipt(item);
                              setShowReceiptModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition"
                            title="Cetak Tanda Terima"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Kwitansi</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ============================================================ */}
      {/* MODAL CATAT PEMASUKAN BARU                                   */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  Catat Pemasukan Sektor Lain
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekam penerimaan dana yayasan, sumbangan sukarela, hibah pemerintah, CSR, atau vokasi
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

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Uraian Pemasukan */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Uraian / Keterangan Pemasukan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bantuan Operasional Yayasan Tahap II / Donasi Komputer"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Kategori Sektor */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Sumber Dana <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    required
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nominal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Pemasukan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="5000000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Sumber Dana / Donatur */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sumber Dana / Donatur / Mitra
                  </label>
                  <input
                    type="text"
                    placeholder="Yayasan Bina Insan / PT Telkom / Hamba Allah"
                    value={form.sourceName}
                    onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
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

                {/* Metode Penerimaan & Tanggal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Penerimaan
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  >
                    <option value="TRANSFER">Transfer Rekening Lembaga (BCA/BRI/Mandiri)</option>
                    <option value="TUNAI">Tunai / Kasir PKBM</option>
                    <option value="CEK">Cek / Giro Bank</option>
                    <option value="QRIS">QRIS / E-Wallet Donasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Penerimaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.incomeDate}
                    onChange={(e) => setForm({ ...form, incomeDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Nomor Kwitansi / Referensi */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Kwitansi / Referensi Transaksi
                  </label>
                  <input
                    type="text"
                    placeholder="P-NON-2026/08-1001"
                    value={form.receiptNumber}
                    onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-800 bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                </div>

                {/* Deskripsi */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi / Peruntukan Dana
                  </label>
                  <textarea
                    placeholder="Contoh: Digunakan untuk renovasi lab komputer kesetaraan dan modul ajar vokasi..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition resize-none"
                  />
                </div>

                {/* Upload Bukti */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    Bukti Penerimaan / Surat Hibah / Nota
                    <span className="text-slate-400 font-normal">(opsional)</span>
                  </label>
                  <FileUploadField
                    value={form.proofUrl}
                    onChange={(url) => setForm({ ...form, proofUrl: url })}
                  />
                </div>

                {/* Opsi Tampilkan Kwitansi */}
                <div className="col-span-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                    <input
                      type="checkbox"
                      id="openReceiptAfterSave"
                      checked={openReceiptAfterSave}
                      onChange={(e) => setOpenReceiptAfterSave(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">
                        Buka & cetak kwitansi / tanda terima resmi setelah disimpan
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Jika tidak dicentang, data langsung tersimpan. Kwitansi tetap dapat dilihat kapan saja lewat tombol &quot;Kwitansi&quot; pada tabel.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Total Preview */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Total Dana Masuk
                  </span>
                  <p className="text-xs text-emerald-600">Dicatat ke kas resmi lembaga</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-900">
                    {formatRupiah(parseFloat(form.amount) || 0)}
                  </span>
                </div>
              </div>

              {/* Sticky Footer */}
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
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Pemasukan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* KWITANSI DIGITAL POPUP / TANDA TERIMA RESMI (PRINTABLE)      */}
      {/* ============================================================ */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Bar for Modal Controls (Hidden in Print) */}
            <div className="print:hidden p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tanda Terima & Kwitansi Pemasukan Resmi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    PKBM Askara — Dokumen Penerimaan Kas Terverifikasi
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
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
              <div className="border-2 border-emerald-700 rounded-2xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-b from-emerald-50/20 to-white print:border-slate-800 print:rounded-none">
                {/* Background Watermark Stamp */}
                <div className="absolute right-6 bottom-16 opacity-10 pointer-events-none select-none rotate-[-15deg]">
                  <div className="border-4 border-emerald-800 rounded-2xl px-6 py-3 text-center">
                    <p className="text-4xl font-extrabold tracking-widest text-emerald-900">DITERIMA</p>
                    <p className="text-xs font-bold uppercase text-emerald-800">LUNAS & TERCATAT</p>
                  </div>
                </div>

                {/* Kwitansi Header / Kop */}
                <div className="flex items-start justify-between border-b-2 border-emerald-800/60 pb-5 mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                        PKBM ASKARA JAKARTA
                      </h2>
                      <p className="text-[11px] text-slate-600 font-medium leading-tight">
                        Pusat Kegiatan Belajar Masyarakat Kesetaraan Paket A, B, dan C
                      </p>
                      <p className="text-[10px] text-slate-400">
                        NPSN: P9998766 · Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-emerald-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider mb-1.5 shadow-xs">
                      TANDA TERIMA SAH
                    </span>
                    <p className="text-xs font-mono font-bold text-emerald-900">
                      {activeReceipt.receiptNumber}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Tgl:{" "}
                      {new Date(activeReceipt.incomeDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Kwitansi Body */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex py-1.5 border-b border-dashed border-slate-200">
                    <span className="w-36 text-slate-500 font-medium">Telah Diterima Dari</span>
                    <span className="w-4 text-slate-400">:</span>
                    <span className="flex-1 font-bold text-slate-900 text-sm">
                      {activeReceipt.sourceName || "Hamba Allah / Umum"}
                    </span>
                  </div>

                  <div className="flex py-1.5 border-b border-dashed border-slate-200">
                    <span className="w-36 text-slate-500 font-medium">Kategori Sektor</span>
                    <span className="w-4 text-slate-400">:</span>
                    <span className="flex-1 font-semibold text-slate-800">
                      {getCatConfig(activeReceipt.category).label}
                    </span>
                  </div>

                  <div className="flex py-1.5 border-b border-dashed border-slate-200">
                    <span className="w-36 text-slate-500 font-medium">Untuk Pembayaran / Peruntukan</span>
                    <span className="w-4 text-slate-400">:</span>
                    <span className="flex-1 font-medium text-slate-800">
                      {activeReceipt.title}{" "}
                      {activeReceipt.description ? `(${activeReceipt.description})` : ""}
                    </span>
                  </div>

                  <div className="flex py-1.5 border-b border-dashed border-slate-200">
                    <span className="w-36 text-slate-500 font-medium">Metode Penerimaan</span>
                    <span className="w-4 text-slate-400">:</span>
                    <span className="flex-1 font-medium text-slate-700">
                      {activeReceipt.paymentMethod || "TRANSFER BANK"}
                    </span>
                  </div>

                  {/* Highlight Nominal */}
                  <div className="my-4 p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">
                        Jumlah Dana Diterima
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-900">
                        {formatRupiah(activeReceipt.amount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Terverifikasi Lunas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kwitansi Footer Signature */}
                <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                  <div>
                    <p className="text-slate-500 text-[11px] mb-14">Penyumbang / Pihak Pemberi</p>
                    <p className="font-bold text-slate-800 underline">
                      {activeReceipt.sourceName || "Hamba Allah"}
                    </p>
                    <p className="text-[10px] text-slate-400">Tanda Tangan / Cap</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] mb-14">
                      Jakarta,{" "}
                      {new Date(activeReceipt.incomeDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                      <br />
                      Bendahara / Kasir Lembaga
                    </p>
                    <p className="font-bold text-slate-800 underline">
                      Admin Keuangan PKBM Askara
                    </p>
                    <p className="text-[10px] text-slate-400">Verifikasi Sistem Digital</p>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
                  Kwitansi ini adalah dokumen resmi yang diterbitkan secara elektronik oleh Sistem Informasi PKBM Askara.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
