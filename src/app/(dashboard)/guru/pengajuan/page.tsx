"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BadgeCheck,
  ChevronDown,
  RefreshCw,
  FileText,
  Upload,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Menunggu Review", color: "bg-amber-100 text-amber-800", icon: Clock },
  APPROVED: { label: "Disetujui ✓", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-800", icon: XCircle },
  REVISION: { label: "Perlu Revisi", color: "bg-orange-100 text-orange-800", icon: RotateCcw },
  DISBURSED: { label: "Dicairkan ✓", color: "bg-blue-100 text-blue-800", icon: BadgeCheck },
};

const CATEGORIES = [
  { value: "ATK", label: "ATK & Perlengkapan" },
  { value: "TRANSPORTASI", label: "Transportasi" },
  { value: "KONSUMSI", label: "Konsumsi / Makan" },
  { value: "PROGRAM_KEGIATAN", label: "Program Kegiatan" },
  { value: "PERAWATAN", label: "Perawatan & Maintenance" },
  { value: "LAINNYA", label: "Lainnya" },
];

type FormState = {
  title: string;
  category: string;
  amount: string;
  description: string;
  neededDate: string;
  department: string;
};

type Request = {
  id: string;
  title: string;
  category: string;
  amount: number;
  status: string;
  requestDate: string;
  approvalNotes?: string;
  disbursementProofUrl?: string;
};

export default function PengajuanGuruPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: "",
    category: "ATK",
    amount: "",
    description: "",
    neededDate: "",
    department: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/keuangan/pengajuan");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/keuangan/pengajuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount.replace(/\D/g, "")) }),
      });
      setShowForm(false);
      setForm({ title: "", category: "ATK", amount: "", description: "", neededDate: "", department: "" });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-teal-500/20 text-teal-200 border border-teal-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Pengajuan Dana
          </span>
          <h1 className="text-2xl font-bold">Pengajuan Biaya Operasional</h1>
          <p className="mt-1 text-teal-200 text-sm">Ajukan kebutuhan dana operasional untuk kegiatan pembelajaran</p>
        </div>
        <div className="absolute right-6 top-6 opacity-10">
          <CircleDollarSign className="w-24 h-24" />
        </div>
      </div>

      {/* New Request Button */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full sm:w-auto flex items-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition shadow-sm"
      >
        <Plus className="w-5 h-5" />
        Buat Pengajuan Baru
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">Form Pengajuan Dana Operasional</h3>
              <p className="text-xs text-slate-500 mt-0.5">Isi lengkap untuk mempercepat proses review</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keperluan / Judul Pengajuan *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Pembelian ATK untuk kegiatan kelas..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori *</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nominal (Rp) *</label>
                  <input
                    required
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="150000"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Departemen / Bidang</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Bidang Akademik"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dibutuhkan Sebelum</label>
                  <input
                    type="date"
                    value={form.neededDate}
                    onChange={(e) => setForm({ ...form, neededDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi Detail *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Jelaskan keperluan dan detail kebutuhan dana..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-teal-400 transition cursor-pointer">
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Upload Nota / Proposal (opsional)</p>
                <p className="text-xs text-slate-400">PDF, JPG, PNG — maks 5MB</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">Riwayat Pengajuan Saya</h2>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 text-teal-500 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Memuat...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">Belum ada pengajuan</p>
            <p className="text-xs mt-1">Klik tombol di atas untuk membuat pengajuan baru</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((r) => {
              const cfg = STATUS_CONFIG[r.status] || { label: r.status, color: "bg-slate-100 text-slate-600", icon: Clock };
              const StatusIcon = cfg.icon;
              return (
                <div key={r.id} className="p-4 hover:bg-slate-50/60 transition flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800 truncate">{r.title}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 mt-1">
                      <span>{r.category}</span>
                      <span>{new Date(r.requestDate).toLocaleDateString("id-ID")}</span>
                    </div>
                    {r.approvalNotes && (
                      <div className="mt-2 text-xs text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {r.approvalNotes}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 text-sm">{formatRp(r.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
