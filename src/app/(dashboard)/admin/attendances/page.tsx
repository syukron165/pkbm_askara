"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Plus,
  Trash2,
  UserCheck,
  GraduationCap,
  Briefcase,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";

interface AttendanceLog {
  id: string;
  userId: string;
  name: string;
  nik: string;
  email: string;
  role: string;
  roleCategory: "SISWA" | "PENDIDIK" | "MANAJEMEN";
  className: string;
  sessionTitle: string;
  type: string;
  date: string;
  checkInTime: string;
  method: "SCAN_QR" | "GPS_MANDIRI" | "MANUAL_ADMIN";
  status: "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT" | "ALPA";
  notes?: string;
}

interface SummaryData {
  totalToday: number;
  siswaHadir: number;
  pendidikHadir: number;
  manajemenHadir: number;
  izinSakit: number;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
  email: string;
  nik?: string;
}

export default function AdminAttendancesPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "SISWA" | "PENDIDIK" | "MANAJEMEN">("ALL");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // empty means all or pick specific date
  const [selectedStatus, setSelectedStatus] = useState("SEMUA");

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalToday: 0,
    siswaHadir: 0,
    pendidikHadir: 0,
    manajemenHadir: 0,
    izinSakit: 0,
  });
  const [loading, setLoading] = useState(true);

  // Manual Attendance Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [manualForm, setManualForm] = useState({
    userId: "",
    date: new Date().toISOString().split("T")[0],
    status: "HADIR",
    notes: "Presensi Manual oleh Admin",
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const fetchLogs = async () => {
    try {
      const url = new URL("/api/attendances", window.location.origin);
      if (activeTab !== "ALL") url.searchParams.set("role", activeTab);
      if (selectedDate) url.searchParams.set("date", selectedDate);
      if (selectedStatus !== "SEMUA") url.searchParams.set("status", selectedStatus);
      if (search) url.searchParams.set("search", search);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (e) {
      console.error("Error fetching live attendance logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && data.data) {
        setUsersList(data.data);
      }
    } catch (e) {
      console.error("Error fetching users list:", e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab, selectedDate, selectedStatus, search]);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.userId) {
      alert("Harap pilih nama pengguna!");
      return;
    }

    setIsSubmittingManual(true);
    try {
      const res = await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsManualModalOpen(false);
        setManualForm({
          userId: "",
          date: new Date().toISOString().split("T")[0],
          status: "HADIR",
          notes: "Presensi Manual oleh Admin",
        });
        fetchLogs();
        alert(data.message || "Presensi berhasil dicatat!");
      } else {
        alert(data.error || "Gagal mencatat presensi");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat menyimpan presensi: " + err.message);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleDeleteLog = async (id: string, name: string) => {
    if (!confirm(`Hapus catatan presensi "${name}"?`)) return;
    try {
      const res = await fetch(`/api/attendances?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchLogs();
      } else {
        alert(data.error || "Gagal menghapus presensi");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat menghapus presensi: " + err.message);
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      alert("Tidak ada data presensi untuk diekspor.");
      return;
    }

    const headers = ["Nama", "NIK/NIS", "Peran", "Kelas/Unit", "Sesi", "Tanggal", "Waktu Check-In", "Metode", "Status", "Catatan"];
    const rows = logs.map((l) => [
      `"${l.name}"`,
      `"${l.nik}"`,
      `"${l.roleCategory}"`,
      `"${l.className}"`,
      `"${l.sessionTitle}"`,
      `"${l.date}"`,
      `"${l.checkInTime}"`,
      `"${l.method}"`,
      `"${l.status}"`,
      `"${l.notes || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Presensi_PKBM_Askara_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <span>Rekapitulasi Presensi Terpadu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pusat Rekapitulasi Presensi</h1>
          <p className="mt-1.5 text-indigo-200/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Pemantauan presensi dan kehadiran terpadu untuk seluruh <strong>Siswa (Paket A, B, C)</strong>, <strong>Pendidik / Tutor</strong>, dan <strong>Manajemen / Staf</strong> PKBM Askara.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Presensi Manual</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/15 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Dynamic Live Metrics Row (No dummy numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <span>Siswa Hadir Hari Ini</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1.5">
            {summary.siswaHadir} <span className="text-xs font-normal text-slate-500">Siswa</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Kehadiran KBM Kesetaraan</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            <span>Pendidik / Tutor Hadir</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-1.5">
            {summary.pendidikHadir} <span className="text-xs font-normal text-slate-500">Tutor</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tutor aktif mengajar hari ini</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <span>Manajemen & Staf</span>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-1.5">
            {summary.manajemenHadir} <span className="text-xs font-normal text-slate-500">Staf</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Kehadiran operasional kantor</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700 uppercase tracking-wider">
            <span>Izin & Sakit Hari Ini</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-900 mt-1.5">
            {summary.izinSakit} <span className="text-xs font-normal text-slate-500">Orang</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tercatat izin & sakit resmi</p>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Role Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIK, NIS, peran, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500">Tgl:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="text-[10px] text-slate-400 hover:text-slate-600"
                title="Semua Tanggal"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="HADIR">Hadir</option>
            <option value="TERLAMBAT">Terlambat</option>
            <option value="IZIN">Izin</option>
            <option value="SAKIT">Sakit</option>
            <option value="ALPA">Alpa</option>
          </select>

          {/* Role Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "ALL" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua Peran
            </button>
            <button
              onClick={() => setActiveTab("SISWA")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTab === "SISWA" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Siswa</span>
            </button>
            <button
              onClick={() => setActiveTab("PENDIDIK")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTab === "PENDIDIK" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Tutor</span>
            </button>
            <button
              onClick={() => setActiveTab("MANAJEMEN")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTab === "MANAJEMEN" ? "bg-white text-purple-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Manajemen</span>
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
                <th className="px-5 py-3.5 text-left">Nama & NIK/NIS</th>
                <th className="px-5 py-3.5 text-left">Kategori Peran</th>
                <th className="px-5 py-3.5 text-left">Kelas / Unit Kerja</th>
                <th className="px-5 py-3.5 text-left">Tanggal</th>
                <th className="px-5 py-3.5 text-left">Waktu Check-In</th>
                <th className="px-5 py-3.5 text-left">Metode</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Memuat data presensi...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">Belum ada data presensi yang tercatat</p>
                    <p className="text-xs text-slate-400 mt-1">Data presensi harian siswa, tutor, dan manajemen akan tampil di sini.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSiswa = log.roleCategory === "SISWA";
                  const isPendidik = log.roleCategory === "PENDIDIK";
                  const isManajemen = log.roleCategory === "MANAJEMEN";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{log.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {log.nik && log.nik !== "-" ? `NIK: ${log.nik}` : log.email}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {isSiswa && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                            <GraduationCap className="w-3 h-3" />
                            <span>Siswa</span>
                          </span>
                        )}
                        {isPendidik && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                            <UserCheck className="w-3 h-3" />
                            <span>Pendidik / Tutor</span>
                          </span>
                        )}
                        {isManajemen && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">
                            <Briefcase className="w-3 h-3" />
                            <span>Manajemen</span>
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-700">{log.className}</div>
                        <div className="text-[11px] text-slate-400">{log.sessionTitle}</div>
                      </td>

                      <td className="px-5 py-3.5 font-medium text-slate-600">{log.date}</td>

                      <td className="px-5 py-3.5 font-mono text-slate-700 font-semibold">{log.checkInTime}</td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {log.method === "SCAN_QR" ? (
                            <>
                              <QrCode className="w-3 h-3 text-indigo-600" />
                              <span>Scan QR</span>
                            </>
                          ) : log.method === "MANUAL_ADMIN" ? (
                            <>
                              <UserCheck className="w-3 h-3 text-amber-600" />
                              <span>Manual Admin</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-3 h-3 text-emerald-600" />
                              <span>GPS Mandiri</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                            log.status === "HADIR"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : log.status === "TERLAMBAT"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : log.status === "IZIN"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : log.status === "SAKIT"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteLog(log.id, log.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Catatan Presensi"
                        >
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
      </div>

      {/* Modal: Catat Presensi Manual */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Catat Presensi Manual</h3>
                  <p className="text-xs text-slate-500">Pilih pengguna (Siswa / Tutor / Manajemen) dan status kehadiran</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualAttendance} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Pengguna <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={manualForm.userId}
                  onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">-- Pilih Siswa / Tutor / Staf --</option>
                  {usersList.map((u) => {
                    let roleBadge = "Siswa";
                    if (u.role.includes("pendidik")) roleBadge = "Pendidik / Tutor";
                    else if (u.role.includes("admin")) roleBadge = "Manajemen / Staf";
                    else if (u.role.includes("orang_tua")) roleBadge = "Orang Tua";

                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} ({roleBadge} • {u.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Presensi</label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Kehadiran</label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="HADIR">Hadir</option>
                    <option value="TERLAMBAT">Terlambat</option>
                    <option value="IZIN">Izin</option>
                    <option value="SAKIT">Sakit</option>
                    <option value="ALPA">Alpa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Hadir di kelas tatap muka sesi pagi"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  disabled={isSubmittingManual}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800/60 rounded-xl shadow-xs transition"
                >
                  {isSubmittingManual ? "Menyimpan..." : "Simpan Presensi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
