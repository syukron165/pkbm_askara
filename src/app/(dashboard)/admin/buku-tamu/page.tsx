"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  QrCode,
  Users,
  Clock,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Filter,
  ChevronDown,
  Calendar,
  Phone,
  Building2,
  LogOut,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Eye,
  X,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";

type GuestVisit = {
  id: string;
  fullName: string;
  phone: string;
  institution?: string;
  branchCode: string;
  branchName?: string;
  purpose: string;
  purposeCategory?: string;
  visitedPerson?: string;
  visitedDept?: string;
  status: string;
  checkInAt: string;
  checkOutAt?: string;
  eBadgeToken: string;
  email?: string;
  address?: string;
  photoUrl?: string;
};

type Stats = {
  todayTotal: number;
  todayCheckedIn: number;
  todayCheckedOut: number;
  allTimeTotal: number;
};

export default function BukuTamuPage() {
  const [visits, setVisits] = useState<GuestVisit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedVisit, setSelectedVisit] = useState<GuestVisit | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [qrSrc, setQrSrc] = useState<string>("");

  const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/tamu/PKBM-PUSAT` : "/tamu/PKBM-PUSAT";

  useEffect(() => {
    QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }).then(setQrSrc).catch(console.error);
  }, [qrUrl]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterDate) params.set("date", filterDate);
      const res = await fetch(`/api/buku-tamu?${params}`);
      const data = await res.json();
      setVisits(data.visits || []);
      setStats(data.stats || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterStatus, filterDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckout = async (visitId: string) => {
    setCheckoutLoading(visitId);
    try {
      await fetch("/api/buku-tamu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: visitId, action: "CHECK_OUT" }),
      });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setCheckoutLoading(""); }
  };

  const handleDelete = async (visitId: string, name: string) => {
    if (!confirm(`Hapus log kunjungan tamu atas nama ${name}?`)) return;
    try {
      const res = await fetch(`/api/buku-tamu?id=${visitId}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Gagal menghapus log tamu");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus");
    }
  };

  const purposeColors: Record<string, string> = {
    PPDB: "bg-blue-100 text-blue-800",
    KONSULTASI: "bg-emerald-100 text-emerald-800",
    KUNJUNGAN_DINAS: "bg-purple-100 text-purple-800",
    VENDOR: "bg-orange-100 text-orange-800",
    LAINNYA: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 via-cyan-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Modul Buku Tamu
          </span>
          <h1 className="text-2xl font-bold">Buku Tamu Digital & QR Check-in</h1>
          <p className="mt-1 text-cyan-200 text-sm">Pantau kunjungan tamu real-time di semua cabang PKBM Askara</p>
        </div>
        <div className="absolute right-6 top-6 opacity-10">
          <QrCode className="w-24 h-24" />
        </div>
      </div>

      {/* QR Code Widget + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* QR Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center mb-4 border border-slate-100 overflow-hidden">
            {qrSrc ? (
              <img src={qrSrc} alt="QR Code Buku Tamu" className="w-full h-full object-contain" />
            ) : (
              <div className="animate-pulse w-full h-full bg-slate-200" />
            )}
          </div>
          <h3 className="font-bold text-slate-800 text-sm">QR Code Kantor Pusat</h3>
          <p className="text-xs text-slate-500 mt-1">Tamu scan untuk self check-in</p>
          <a
            href="/tamu/PKBM-PUSAT"
            target="_blank"
            className="mt-3 px-4 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700 transition"
          >
            Preview Form Tamu →
          </a>
        </div>

        {/* Stats */}
        {stats && (
          <>
            <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-5 flex flex-col justify-between">
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-cyan-900">{stats.todayTotal}</p>
                <p className="text-xs font-semibold text-cyan-700 mt-1">Tamu Hari Ini</p>
                <p className="text-xs text-cyan-600">Total kunjungan masuk</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-between">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-900">{stats.todayCheckedIn}</p>
                <p className="text-xs font-semibold text-emerald-700 mt-1">Masih Berada di PKBM</p>
                <p className="text-xs text-emerald-600">Belum check-out</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800">{stats.allTimeTotal}</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">Total Semua Waktu</p>
                <p className="text-xs text-slate-500">Sejak sistem aktif</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Visit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-slate-800 text-sm flex-1">Log Kunjungan Tamu</h2>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Semua Status</option>
              <option value="CHECKED_IN">Masih di Tempat</option>
              <option value="CHECKED_OUT">Sudah Keluar</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={fetchData} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 text-cyan-500 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Memuat data tamu...</span>
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">Belum ada kunjungan hari ini</p>
            <p className="text-xs mt-1">Tamu dapat scan QR Code untuk check-in</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Nama Tamu</th>
                  <th className="px-4 py-3 text-left">Instansi</th>
                  <th className="px-4 py-3 text-left">Keperluan</th>
                  <th className="px-4 py-3 text-left">Dituju</th>
                  <th className="px-4 py-3 text-left">Check-in</th>
                  <th className="px-4 py-3 text-left">Check-out</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 text-xs">{v.fullName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {v.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{v.institution || "-"}</td>
                    <td className="px-4 py-3">
                      {v.purposeCategory && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${purposeColors[v.purposeCategory] || "bg-slate-100 text-slate-600"}`}>
                          {v.purposeCategory}
                        </span>
                      )}
                      <div className="text-xs text-slate-500 mt-1 truncate max-w-[150px]">{v.purpose}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{v.visitedPerson || "-"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                      {new Date(v.checkInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {v.checkOutAt
                        ? new Date(v.checkOutAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${v.status === "CHECKED_IN" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                        {v.status === "CHECKED_IN" ? "Di Tempat" : "Sudah Keluar"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedVisit(v)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id, v.fullName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Kunjungan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {v.status === "CHECKED_IN" && (
                          <button
                            onClick={() => handleCheckout(v.id)}
                            disabled={checkoutLoading === v.id}
                            className="px-2.5 py-1 bg-slate-700 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <LogOut className="w-3 h-3" />
                            {checkoutLoading === v.id ? "..." : "Check-Out"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Detail Tamu</h3>
              <button onClick={() => setSelectedVisit(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center text-xl font-bold text-cyan-700">
                  {selectedVisit.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{selectedVisit.fullName}</h4>
                  <p className="text-sm text-slate-500">{selectedVisit.phone}</p>
                  {selectedVisit.email && <p className="text-xs text-slate-400">{selectedVisit.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-slate-400 block">Instansi</span><span className="font-medium text-slate-700">{selectedVisit.institution || "-"}</span></div>
                <div><span className="text-xs text-slate-400 block">Cabang</span><span className="font-medium text-slate-700">{selectedVisit.branchName || selectedVisit.branchCode}</span></div>
                <div><span className="text-xs text-slate-400 block">Dituju</span><span className="font-medium text-slate-700">{selectedVisit.visitedPerson || "-"}</span></div>
                <div><span className="text-xs text-slate-400 block">Departemen</span><span className="font-medium text-slate-700">{selectedVisit.visitedDept || "-"}</span></div>
                <div className="col-span-2"><span className="text-xs text-slate-400 block">Keperluan</span><span className="font-medium text-slate-700">{selectedVisit.purpose}</span></div>
                <div><span className="text-xs text-slate-400 block">Check-in</span><span className="font-medium text-slate-700">{new Date(selectedVisit.checkInAt).toLocaleString("id-ID")}</span></div>
                <div><span className="text-xs text-slate-400 block">Check-out</span><span className="font-medium text-slate-700">{selectedVisit.checkOutAt ? new Date(selectedVisit.checkOutAt).toLocaleString("id-ID") : "-"}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
