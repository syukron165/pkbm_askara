"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BadgeDollarSign,
  Plus,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingDown,
  Paperclip,
  Upload,
  X,
  FileText,
  ExternalLink,
  ImageIcon,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

const CATEGORIES = [
  { value: "GAJI", label: "Gaji Pendidik & Staff", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "OPERASIONAL", label: "Operasional", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "ATK", label: "ATK & Perlengkapan", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "INFRASTRUKTUR", label: "Infrastruktur", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { value: "PROGRAM", label: "Program Kegiatan", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "LAINNYA", label: "Lainnya", color: "bg-slate-100 text-slate-600 border-slate-200" },
];

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  periodMonth: number;
  periodYear: number;
  payee: string | null;
  description: string | null;
  receiptUrl: string | null;
}

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
      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
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
        className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-dashed transition cursor-pointer select-none ${
          dragOver
            ? "border-rose-400 bg-rose-50"
            : "border-slate-200 bg-slate-50 hover:border-rose-300 hover:bg-rose-50/40"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
            <p className="text-xs text-slate-500">Mengunggah...</p>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <ImageIcon className="w-5 h-5 text-slate-400" />
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-medium text-slate-600 text-center">Klik atau seret file ke sini</p>
            <p className="text-[11px] text-slate-400 text-center">JPG, PNG, WEBP, atau PDF · maks 5 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

export default function PengeluaranPage() {
  const now = new Date();
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
  const [form, setForm] = useState({
    title: "", category: "OPERASIONAL", amount: "",
    expenseDate: now.toISOString().slice(0, 10),
    periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(),
    payee: "", description: "", receiptUrl: "",
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      if (catFilter) params.append("category", catFilter);
      const res = await fetch(`/api/keuangan/expenses?${params}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotalByCategory(data.totalByCategory || {});
      setTotal(data.total || 0);
    } catch {
      setExpenses([]);
    }
    setLoading(false);
  }, [month, year, catFilter]);

  useEffect(() => { fetchExpenses(); setPage(1); }, [fetchExpenses]);

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || (e.payee?.toLowerCase() || "").includes(q);
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetForm = () => setForm({
    title: "", category: "OPERASIONAL", amount: "",
    expenseDate: now.toISOString().slice(0, 10),
    periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(),
    payee: "", description: "", receiptUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/keuangan/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowModal(false); fetchExpenses(); resetForm(); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data pengeluaran ini?")) return;
    await fetch(`/api/keuangan/expenses?id=${id}`, { method: "DELETE" });
    fetchExpenses();
  };

  const getCatConfig = (val: string) => CATEGORIES.find(c => c.value === val) || CATEGORIES[5];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-500" />
            Pengeluaran Operasional
          </h1>
          <p className="text-sm text-slate-500 mt-1">Catat dan pantau seluruh pengeluaran operasional lembaga</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-sm transition">
          <Plus className="w-4 h-4" /> Catat Pengeluaran
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORIES.map((cat) => (
          <button key={cat.value} onClick={() => setCatFilter(catFilter === cat.value ? "" : cat.value)}
            className={`p-3 rounded-xl border text-left transition ${catFilter === cat.value ? cat.color + " ring-2 ring-offset-1 ring-current" : "bg-white border-slate-200 hover:border-slate-300"}`}>
            <p className="text-xs font-semibold text-slate-700 leading-tight">{cat.label}</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{loading ? "..." : formatRupiah(totalByCategory[cat.value] || 0)}</p>
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium opacity-80">Total Pengeluaran</p>
          <p className="text-2xl sm:text-3xl font-bold">{loading ? "..." : formatRupiah(total)}</p>
          <p className="text-xs opacity-70 mt-0.5">{MONTHS[month-1]} {year} · {expenses.length} transaksi</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50/10 border border-white/20 rounded-lg px-3 py-2">
          <button onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }}><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold w-28 text-center">{MONTHS[month-1]} {year}</span>
          <button onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }}><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Cari judul atau penerima..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400">
          <option value="">Semua Kategori</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={fetchExpenses} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-500"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Keterangan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Kategori</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Jumlah</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Penerima</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tanggal</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Bukti</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((__, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-full"/></td>)}</tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                    <BadgeDollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Belum ada data pengeluaran</p>
                    <p className="text-xs mt-1">Klik "Catat Pengeluaran" untuk menambah data</p>
                  </td>
                </tr>
              ) : (
                paginated.map((e) => {
                  const cat = getCatConfig(e.category);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{e.title}</p>
                        {e.description && <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{e.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={"px-2 py-0.5 rounded-full text-[11px] font-semibold border " + cat.color}>{cat.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-700">{formatRupiah(e.amount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{e.payee || "-"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(e.expenseDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {e.receiptUrl ? (
                          <a href={e.receiptUrl} target="_blank" rel="noreferrer" title="Lihat bukti pengeluaran"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition">
                            <Paperclip className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(e.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <p className="text-slate-500 text-xs">{filtered.length} data · hal. {page}/{totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 text-xs font-medium">← Sebelumnya</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 text-xs font-medium">Berikutnya →</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Catat Pengeluaran Baru</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Rekam transaksi pengeluaran operasional lembaga</p>
                </div>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Judul <span className="text-rose-500">*</span></label>
                <input type="text" placeholder="Gaji Pendidik Oktober 2025" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori <span className="text-rose-500">*</span></label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah (Rp) <span className="text-rose-500">*</span></label>
                  <input type="number" placeholder="500000" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bulan</label>
                  <select value={form.periodMonth} onChange={(e) => setForm({ ...form, periodMonth: parseInt(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
                    {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun</label>
                  <input type="number" value={form.periodYear}
                    onChange={(e) => setForm({ ...form, periodYear: parseInt(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input type="date" value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Penerima / Payee</label>
                  <input type="text" placeholder="PLN, Tokopedia, dll" value={form.payee}
                    onChange={(e) => setForm({ ...form, payee: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi / Keterangan Tambahan</label>
                <textarea placeholder="Detail pengeluaran..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    Bukti Pengeluaran
                    <span className="text-slate-400 font-normal">(opsional)</span>
                  </span>
                </label>
                <FileUploadField value={form.receiptUrl} onChange={(url) => setForm({ ...form, receiptUrl: url })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60">
                  {submitting ? "Menyimpan..." : "Simpan Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
