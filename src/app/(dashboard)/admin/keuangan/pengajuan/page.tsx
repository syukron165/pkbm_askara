"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Upload,
  RefreshCw,
  Filter,
  ChevronDown,
  Eye,
  AlertCircle,
  CircleDollarSign,
  RotateCcw,
  History,
  BadgeCheck,
  Plus,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Menunggu Review", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  APPROVED: { label: "Disetujui", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  REVISION: { label: "Perlu Revisi", color: "bg-orange-100 text-orange-800 border-orange-200", icon: RotateCcw },
  DISBURSED: { label: "Dana Dicairkan", color: "bg-blue-100 text-blue-800 border-blue-200", icon: BadgeCheck },
};

const CATEGORY_LABELS: Record<string, string> = {
  ATK: "ATK & Perlengkapan",
  TRANSPORTASI: "Transportasi",
  KONSUMSI: "Konsumsi",
  PROGRAM_KEGIATAN: "Program Kegiatan",
  PERAWATAN: "Perawatan & Maintenance",
  LAINNYA: "Lainnya",
};

type ExpenseRequest = {
  id: string;
  title: string;
  category: string;
  amount: number;
  description: string;
  status: string;
  requesterName: string;
  requesterRole: string;
  department?: string;
  requestDate: string;
  neededDate?: string;
  attachmentUrl?: string;
  approvalNotes?: string;
  auditLog?: string;
  disbursementProofUrl?: string;
};

type Stats = {
  pending: number;
  approved: number;
  revision: number;
  disbursed: number;
  totalPending: number;
};

export default function PengajuanBiayaAdminPage() {
  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null);
  const [actionModal, setActionModal] = useState<{ request: ExpenseRequest; action: string } | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterCategory) params.set("category", filterCategory);
      const res = await fetch(`/api/keuangan/pengajuan?${params}`);
      const data = await res.json();
      setRequests(data.requests || []);
      setStats(data.stats || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (action: string) => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await fetch("/api/keuangan/pengajuan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actionModal.request.id, action, notes: actionNotes }),
      });
      setActionModal(null);
      setActionNotes("");
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Modul Keuangan
          </span>
          <h1 className="text-2xl font-bold">Pengajuan Biaya Operasional</h1>
          <p className="mt-1 text-emerald-200 text-sm">
            Review dan proses pengajuan dana dari staf, tutor, dan manajemen
          </p>
        </div>
        <div className="absolute right-6 top-6 opacity-10">
          <CircleDollarSign className="w-24 h-24" />
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-600">Menunggu Review</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-600">Disetujui</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-orange-600">Perlu Revisi</p>
            <p className="text-2xl font-bold text-orange-800 mt-1">{stats.revision}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600">Dicairkan</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{stats.disbursed}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 sm:col-span-1 col-span-2">
            <p className="text-xs font-semibold text-purple-600">Total Menunggu Cairkan</p>
            <p className="text-lg font-bold text-purple-800 mt-1">{formatRp(stats.totalPending)}</p>
          </div>
        </div>
      )}

      {/* Filter & List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Kategori</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Memuat data...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Belum ada pengajuan biaya</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((r) => {
              const cfg = STATUS_CONFIG[r.status] || { label: r.status, color: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock };
              const StatusIcon = cfg.icon;
              const auditLog = r.auditLog ? JSON.parse(r.auditLog) : [];

              return (
                <div key={r.id} className="p-5 hover:bg-slate-50/60 transition">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800">{r.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Oleh: <span className="font-semibold text-slate-700">{r.requesterName}</span></span>
                        <span>Kategori: <span className="font-medium">{CATEGORY_LABELS[r.category] || r.category}</span></span>
                        {r.department && <span>Dept: {r.department}</span>}
                        <span>Tanggal: {new Date(r.requestDate).toLocaleDateString("id-ID")}</span>
                      </div>
                      {r.approvalNotes && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {r.approvalNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xl font-bold text-slate-900">{formatRp(r.amount)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedRequest(r)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {r.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => setActionModal({ request: r, action: "APPROVE" })}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => setActionModal({ request: r, action: "REVISION" })}
                              className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg hover:bg-orange-200 transition"
                            >
                              Revisi
                            </button>
                            <button
                              onClick={() => setActionModal({ request: r, action: "REJECT" })}
                              className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {r.status === "APPROVED" && (
                          <button
                            onClick={() => setActionModal({ request: r, action: "DISBURSE" })}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                          >
                            <Upload className="w-3.5 h-3.5" /> Cairkan Dana
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Audit Trail mini */}
                  {auditLog.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <History className="w-3.5 h-3.5" />
                      <span>{auditLog.length} aktivitas</span>
                      <span>·</span>
                      <span>Terakhir: {auditLog[auditLog.length - 1]?.action} oleh {auditLog[auditLog.length - 1]?.userName}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {actionModal.action === "APPROVE" && "✅ Setujui Pengajuan"}
                {actionModal.action === "REJECT" && "❌ Tolak Pengajuan"}
                {actionModal.action === "REVISION" && "🔄 Minta Revisi"}
                {actionModal.action === "DISBURSE" && "💸 Cairkan Dana"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{actionModal.request.title} — {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(actionModal.request.amount)}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan / Keterangan</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  placeholder="Tambahkan catatan untuk pengaju..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setActionModal(null); setActionNotes(""); }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleAction(actionModal.action)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {actionLoading ? "Memproses..." : "Konfirmasi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
