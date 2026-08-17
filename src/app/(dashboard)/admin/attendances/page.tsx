"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Smartphone,
  BookOpen,
  Award,
  Users,
  RefreshCw,
  Clock,
  Printer,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface AttendanceLog {
  id: string;
  studentName: string;
  nis: string;
  className: string;
  sessionTitle: string;
  type: "MAPEL" | "CLUB" | "GPS";
  teacherName: string;
  date: string;
  checkInTime: string;
  method: "SCAN_QR_GURU" | "SCAN_BY_GURU_HP" | "GPS_MANDIRI";
  status: "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT";
}

export default function AdminAttendancesPage() {
  const [activeTab, setActiveTab] = useState<"all" | "mapel" | "club">("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedStatus, setSelectedStatus] = useState("SEMUA");

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/presensi/qr-session");
      const data = await res.json();
      if (data.success && data.sessions) {
        const liveLogs: AttendanceLog[] = [];
        for (const s of data.sessions) {
          for (const att of s.attendees || []) {
            liveLogs.push({
              id: att.id,
              studentName: att.studentName,
              nis: att.nis || "-",
              className: att.className || s.className || "Paket C",
              sessionTitle: s.title,
              type: s.type,
              teacherName: s.teacherName,
              date: s.date,
              checkInTime: att.checkInTime,
              method: att.method as any,
              status: att.status as any,
            });
          }
        }
        setLogs(liveLogs);
      }
    } catch (e) {
      console.error("Error fetching live attendance logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchType = activeTab === "all" || log.type.toLowerCase() === activeTab.toLowerCase();
    const matchSearch =
      search === "" ||
      log.studentName.toLowerCase().includes(search.toLowerCase()) ||
      log.sessionTitle.toLowerCase().includes(search.toLowerCase()) ||
      log.teacherName.toLowerCase().includes(search.toLowerCase()) ||
      log.nis.includes(search);
    const matchStatus = selectedStatus === "SEMUA" || log.status === selectedStatus;
    return matchType && matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/admin" className="hover:text-slate-800 transition">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-emerald-700 font-bold">Presensi & Rekapitulasi Kehadiran</span>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <QrCode className="w-3.5 h-3.5" />
            <span>Sistem Presensi 2 Arah (QR & GPS)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pusat Rekapitulasi Presensi</h1>
          <p className="mt-1.5 text-indigo-200/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Pemantauan presensi terintegrasi untuk seluruh mata pelajaran kesetaraan (Paket A, B, C) dan kegiatan ekstrakurikuler Club Belajar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/15 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
          <button
            onClick={() => alert("Mengunduh Rekap Presensi format XLSX...")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/30"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Hadir</span>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1.5">96.4%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rata-rata kehadiran harian</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Scan QR Guru</span>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-800 mt-1.5">82 Siswa</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Siswa scan mandiri</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Scan via HP Guru</span>
          <p className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1.5">18 Siswa</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Discan langsung oleh guru</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Club Belajar</span>
          <p className="text-2xl sm:text-3xl font-bold text-amber-800 mt-1.5">3 Sesi</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Kegiatan aktif hari ini</p>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa, NIS, mata pelajaran, tutor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="HADIR">Hadir</option>
            <option value="TERLAMBAT">Terlambat</option>
            <option value="IZIN">Izin</option>
            <option value="SAKIT">Sakit</option>
          </select>

          {/* Tab Filter Type */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "all" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveTab("mapel")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "mapel" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"
              }`}
            >
              Mata Pelajaran
            </button>
            <button
              onClick={() => setActiveTab("club")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "club" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"
              }`}
            >
              Club Belajar
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Log */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3.5 text-left">Nama Siswa & NIS</th>
                <th className="px-5 py-3.5 text-left">Kelas / Rombel</th>
                <th className="px-5 py-3.5 text-left">Sesi Pelajaran / Club</th>
                <th className="px-5 py-3.5 text-left">Tutor / Pembina</th>
                <th className="px-5 py-3.5 text-left">Waktu Check-In</th>
                <th className="px-5 py-3.5 text-left">Metode Presensi</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{log.studentName}</div>
                    <div className="text-[11px] font-mono text-slate-400">NIS: {log.nis}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{log.className}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          log.type === "MAPEL" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className="font-semibold text-slate-800">{log.sessionTitle}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{log.teacherName}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">{log.checkInTime}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      {log.method === "SCAN_QR_GURU" ? (
                        <>
                          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Scan QR Guru</span>
                        </>
                      ) : log.method === "SCAN_BY_GURU_HP" ? (
                        <>
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Scan via HP Guru</span>
                        </>
                      ) : (
                        <span>GPS Mandiri</span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
