"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Star,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  ChevronDown,
  ArrowRight,
  AlertCircle,
  X,
  Send,
  BadgeCheck,
  BarChart3,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  RECEIVED: { label: "Diterima", color: "bg-blue-100 text-blue-800", step: 1 },
  UNDER_REVIEW: { label: "Dalam Evaluasi", color: "bg-amber-100 text-amber-800", step: 2 },
  IN_ACTION: { label: "Tindak Lanjut", color: "bg-violet-100 text-violet-800", step: 3 },
  RESOLVED: { label: "Selesai", color: "bg-emerald-100 text-emerald-800", step: 4 },
};

const CATEGORY_LABELS: Record<string, string> = {
  AKADEMIK: "Akademik",
  FASILITAS_SARPRAS: "Fasilitas & Sarpras",
  KEUANGAN_ADMINISTRASI: "Keuangan & Admin",
  PELAYANAN_STAF: "Pelayanan Staf/Tutor",
  EKSTRAKURIKULER: "Ekstrakurikuler/Klub",
  UMUM: "Umum",
};

type Ticket = {
  id: string;
  senderType: string;
  senderName?: string;
  senderClass?: string;
  isAnonymous: boolean;
  category: string;
  subject: string;
  message: string;
  privacyLevel: string;
  status: string;
  responseText?: string;
  respondedAt?: string;
  satisfactionRating?: number;
  createdAt: string;
};

type Stats = {
  received: number;
  underReview: number;
  inAction: number;
  resolved: number;
  avgRating: number;
};

export default function AspirasiAdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseText, setResponseText] = useState("");
  const [newStatus, setNewStatus] = useState("RESOLVED");
  const [respondLoading, setRespondLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/aspirasi?${params}`);
      const data = await res.json();
      setTickets(data.tickets || []);
      setStats(data.stats || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterCategory, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRespond = async () => {
    if (!selectedTicket) return;
    setRespondLoading(true);
    try {
      await fetch("/api/aspirasi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTicket.id,
          action: "RESPOND",
          responseText,
          newStatus,
        }),
      });
      setSelectedTicket(null);
      setResponseText("");
      fetchData();
    } catch (e) { console.error(e); }
    finally { setRespondLoading(false); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await fetch("/api/aspirasi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "UPDATE_STATUS", newStatus: status }),
    });
    fetchData();
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? "text-amber-500 fill-amber-500" : "text-slate-200"}`} />
    ));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-200 border border-rose-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Modul Aspirasi
          </span>
          <h1 className="text-2xl font-bold">Saran & Masukan Komunitas</h1>
          <p className="mt-1 text-rose-200 text-sm">Kelola aspirasi, aduan, dan masukan dari siswa dan orang tua murid</p>
        </div>
        <div className="absolute right-6 top-6 opacity-10">
          <MessageSquare className="w-24 h-24" />
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600">Diterima</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.received}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-600">Dievaluasi</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{stats.underReview}</p>
          </div>
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-violet-600">Tindak Lanjut</p>
            <p className="text-2xl font-bold text-violet-900 mt-1">{stats.inAction}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-600">Selesai</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700">Avg Kepuasan</p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-2xl font-bold text-amber-900">{stats.avgRating.toFixed(1)}</p>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-slate-800 text-sm flex-1">Kotak Masuk Aspirasi</h2>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs border border-slate-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Semua Kategori</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs border border-slate-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Semua Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={fetchData} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Memuat aspirasi...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">Belum ada aspirasi masuk</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((t) => {
              const cfg = STATUS_CONFIG[t.status];
              return (
                <div key={t.id} className="p-5 hover:bg-slate-50/60 transition">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-sm">{t.subject}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.color}`}>{cfg?.label}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{CATEGORY_LABELS[t.category] || t.category}</span>
                        {t.privacyLevel === "PRIVAT" && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs font-semibold">🔒 Privat</span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-3">
                        <span>Dari: <span className="font-semibold text-slate-700">{t.isAnonymous ? "Anonim" : (t.senderName || "Pengirim")}</span></span>
                        {t.senderClass && <span>Kelas: {t.senderClass}</span>}
                        <span>Tipe: {t.senderType === "SISWA" ? "Siswa" : "Orang Tua"}</span>
                        <span>{new Date(t.createdAt).toLocaleDateString("id-ID")}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{t.message}</p>
                      {t.responseText && (
                        <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs text-emerald-800">
                          <span className="font-semibold">Tanggapan Sekolah:</span> {t.responseText}
                        </div>
                      )}
                      {t.satisfactionRating && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">Rating kepuasan:</span>
                          <div className="flex">{renderStars(t.satisfactionRating)}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-1.5">
                        {/* Quick status update */}
                        {t.status === "RECEIVED" && (
                          <button onClick={() => handleUpdateStatus(t.id, "UNDER_REVIEW")} className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg hover:bg-amber-200 transition">
                            → Evaluasi
                          </button>
                        )}
                        {t.status === "UNDER_REVIEW" && (
                          <button onClick={() => handleUpdateStatus(t.id, "IN_ACTION")} className="px-2.5 py-1 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-lg hover:bg-violet-200 transition">
                            → Tindak Lanjut
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedTicket(t); setResponseText(t.responseText || ""); }}
                          className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Balas
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Balas Aspirasi</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedTicket.subject}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">Pesan Aspirasi:</p>
                {selectedTicket.message}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggapan / Respons Sekolah</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="Tulis tanggapan konstruktif dari pihak sekolah..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Update Status</label>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedTicket(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                  Batal
                </button>
                <button
                  onClick={handleRespond}
                  disabled={respondLoading}
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {respondLoading ? "Mengirim..." : "Kirim Tanggapan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
