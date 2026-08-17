"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  Search,
  Plus,
  Filter,
  BookOpen,
  MapPin,
  Briefcase,
  ChevronDown,
  RefreshCw,
  FileText,
  TrendingUp,
  ArrowUpRight,
  X,
} from "lucide-react";

const ACADEMIC_YEARS = ["2025/2026", "2024/2025", "2023/2024", "2022/2023"];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Menunggu", color: "bg-amber-100 text-amber-800" },
  DITERIMA: { label: "Diterima", color: "bg-emerald-100 text-emerald-800" },
  DITOLAK: { label: "Ditolak", color: "bg-red-100 text-red-800" },
  AKTIF: { label: "Aktif", color: "bg-blue-100 text-blue-800" },
  LULUS: { label: "Lulus", color: "bg-purple-100 text-purple-800" },
  DROPOUT: { label: "Dropout", color: "bg-slate-100 text-slate-600" },
  MUTASI_KELUAR: { label: "Mutasi", color: "bg-orange-100 text-orange-800" },
};

const TRACER_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  MELANJUTKAN_STUDI: { label: "Lanjut Studi", icon: BookOpen, color: "text-blue-600" },
  BEKERJA: { label: "Bekerja", icon: Briefcase, color: "text-emerald-600" },
  WIRAUSAHA: { label: "Wirausaha", icon: TrendingUp, color: "text-amber-600" },
  BELUM_DIKETAHUI: { label: "Belum Diketahui", icon: Clock, color: "text-slate-500" },
};

type Entry = {
  id: string;
  academicYear: string;
  studentName: string;
  nisn?: string;
  gender?: string;
  packetType: string;
  entryPath?: string;
  status: string;
  registrationDate: string;
  graduationDate?: string;
  certificateNumber?: string;
  tracerStatus?: string;
  tracerDetail?: string;
  parentName?: string;
  phone?: string;
};

type Stats = {
  total: number;
  pending: number;
  diterima: number;
  ditolak: number;
  aktif: number;
  lulus: number;
  dropout: number;
};

export default function TahunAjaranPage() {
  const [activeYear, setActiveYear] = useState("2025/2026");
  const [activeTab, setActiveTab] = useState<"ppdb" | "aktif" | "alumni">("ppdb");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [years, setYears] = useState<string[]>(ACADEMIC_YEARS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    academicYear: "2025/2026",
    studentName: "",
    nisn: "",
    nik: "",
    gender: "L",
    packetType: "Paket C",
    entryType: "PPDB",
    entryPath: "REGULER",
    status: "PENDING",
    parentName: "",
    phone: "",
    notes: "",
    certificateNumber: "",
    tracerStatus: "BELUM_DIKETAHUI",
    tracerDetail: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        academicYear: activeYear,
        tab: activeTab,
        search,
      });
      const res = await fetch(`/api/tahun-ajaran?${params}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setStats(data.stats || null);
      if (data.years?.length > 0) setYears(data.years);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeYear, activeTab, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keep modal academicYear in sync when activeYear changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      academicYear: activeYear,
      status: activeTab === "ppdb" ? "PENDING" : activeTab === "aktif" ? "AKTIF" : "LULUS",
    }));
  }, [activeYear, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tahun-ajaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          academicYear: activeYear,
          studentName: "",
          nisn: "",
          nik: "",
          gender: "L",
          packetType: "Paket C",
          entryType: "PPDB",
          entryPath: "REGULER",
          status: activeTab === "ppdb" ? "PENDING" : activeTab === "aktif" ? "AKTIF" : "LULUS",
          parentName: "",
          phone: "",
          notes: "",
          certificateNumber: "",
          tracerStatus: "BELUM_DIKETAHUI",
          tracerDetail: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error("Error submitting academic year entry:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: "ppdb", label: "Data PPDB / Pendaftar Baru", icon: Plus, color: "text-emerald-600" },
    { key: "aktif", label: "Siswa Aktif", icon: Users, color: "text-blue-600" },
    { key: "alumni", label: "Alumni & Lulusan", icon: GraduationCap, color: "text-purple-600" },
  ] as const;

  const statCards = [
    { label: "Total Pendaftar", value: stats?.total || 0, icon: Users, color: "bg-blue-50 text-blue-700" },
    { label: "Diterima", value: stats?.diterima || 0, icon: UserCheck, color: "bg-emerald-50 text-emerald-700" },
    { label: "Ditolak", value: stats?.ditolak || 0, icon: UserX, color: "bg-red-50 text-red-700" },
    { label: "Siswa Aktif", value: stats?.aktif || 0, icon: Users, color: "bg-indigo-50 text-indigo-700" },
    { label: "Lulusan", value: stats?.lulus || 0, icon: GraduationCap, color: "bg-purple-50 text-purple-700" },
    { label: "Menunggu", value: stats?.pending || 0, icon: Clock, color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Modul Master Data
          </span>
          <h1 className="text-2xl font-bold">Data Master Tahun Ajaran</h1>
          <p className="mt-1 text-indigo-200 text-sm">
            Kelola data PPDB, siswa aktif, alumni, dan tracer study per tahun ajaran
          </p>
        </div>
        <div className="absolute right-6 top-6 opacity-10">
          <BookOpen className="w-24 h-24" />
        </div>
      </div>

      {/* Year Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={activeYear}
              onChange={(e) => setActiveYear(e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
              {ACADEMIC_YEARS.filter((y) => !years.includes(y)).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Data
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className={`${s.color} rounded-xl p-4 border border-white/50 shadow-sm`}>
            <p className="text-xs font-semibold opacity-70">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition border-b-2 ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.key ? tab.color : ""}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NISN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              <span className="ml-2 text-sm text-slate-500">Memuat data...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Belum ada data untuk tahun ajaran {activeYear}</p>
              <p className="text-xs mt-1">Tambahkan data pendaftar baru untuk memulai</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">No</th>
                  <th className="px-4 py-3 text-left">Nama Peserta Didik</th>
                  <th className="px-4 py-3 text-left">NISN</th>
                  <th className="px-4 py-3 text-left">Paket</th>
                  {activeTab === "ppdb" && <th className="px-4 py-3 text-left">Jalur Masuk</th>}
                  {activeTab === "alumni" && <th className="px-4 py-3 text-left">Tracer Study</th>}
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((e, idx) => {
                  const statusCfg = STATUS_CONFIG[e.status] || { label: e.status, color: "bg-slate-100 text-slate-600" };
                  const tracer = e.tracerStatus ? TRACER_CONFIG[e.tracerStatus] : null;

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{e.studentName}</div>
                        {e.parentName && <div className="text-xs text-slate-400">Ortu: {e.parentName}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{e.nisn || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                          {e.packetType}
                        </span>
                      </td>
                      {activeTab === "ppdb" && (
                        <td className="px-4 py-3 text-slate-500 text-xs">{e.entryPath || "-"}</td>
                      )}
                      {activeTab === "alumni" && (
                        <td className="px-4 py-3">
                          {tracer ? (
                            <div className="flex items-center gap-1.5">
                              <tracer.icon className={`w-3.5 h-3.5 ${tracer.color}`} />
                              <span className={`text-xs font-medium ${tracer.color}`}>{tracer.label}</span>
                              {e.tracerDetail && (
                                <span className="text-xs text-slate-400">— {e.tracerDetail}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Belum didata</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {activeTab === "alumni" && e.graduationDate
                          ? new Date(e.graduationDate).toLocaleDateString("id-ID")
                          : new Date(e.registrationDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Tracer Study Trend (alumni tab) */}
      {activeTab === "alumni" && entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-600" />
            Rekap Tracer Study Alumni {activeYear}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(TRACER_CONFIG).map(([key, cfg]) => {
              const count = entries.filter((e) => e.tracerStatus === key).length;
              const pct = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
              const Icon = cfg.icon;
              return (
                <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${cfg.color}`} />
                  <p className="text-2xl font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{cfg.label}</p>
                  <p className="text-xs font-semibold text-slate-600 mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tambah Data Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {activeTab === "ppdb" && "Tambah Pendaftar Baru (PPDB)"}
                  {activeTab === "aktif" && "Tambah Siswa Aktif"}
                  {activeTab === "alumni" && "Tambah Data Alumni / Lulusan"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Tahun Ajaran: <span className="font-semibold text-indigo-600">{activeYear}</span></p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tahun Ajaran *</label>
                  <div className="relative">
                    <select
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Paket Pendidikan *</label>
                  <div className="relative">
                    <select
                      value={formData.packetType}
                      onChange={(e) => setFormData({ ...formData, packetType: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Paket A">Paket A (Setara SD)</option>
                      <option value="Paket B">Paket B (Setara SMP)</option>
                      <option value="Paket C">Paket C (Setara SMA)</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap Peserta Didik <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="Nama sesuai akta lahir / ijazah sebelumnya..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">NISN (Opsional)</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="0012345678"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Kelamin</label>
                  <div className="relative">
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jalur Pendaftaran</label>
                  <div className="relative">
                    <select
                      value={formData.entryPath}
                      onChange={(e) => setFormData({ ...formData, entryPath: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="REGULER">Reguler</option>
                      <option value="BEASISWA">Beasiswa</option>
                      <option value="PINDAHAN">Pindahan / Mutasi Masuk</option>
                      <option value="PROGRAM_KHUSUS">Program Khusus</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Siswa *</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Nama ayah/ibu/wali..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Conditional Alumni fields */}
              {formData.status === "LULUS" && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3">
                  <p className="text-xs font-bold text-purple-800">Informasi Kelulusan & Tracer Study</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status Tracer Study</label>
                      <select
                        value={formData.tracerStatus}
                        onChange={(e) => setFormData({ ...formData, tracerStatus: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="MELANJUTKAN_STUDI">Melanjutkan Studi</option>
                        <option value="BEKERJA">Bekerja</option>
                        <option value="WIRAUSAHA">Wirausaha</option>
                        <option value="BELUM_DIKETAHUI">Belum Diketahui</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. Seri Ijazah</label>
                      <input
                        type="text"
                        value={formData.certificateNumber}
                        onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                        placeholder="DN-01/M-PKBM/..."
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Detail Tempat Lanjutan / Usaha / Kerja</label>
                    <input
                      type="text"
                      value={formData.tracerDetail}
                      onChange={(e) => setFormData({ ...formData, tracerDetail: e.target.value })}
                      placeholder="Nama Kampus / PT / Jenis Usaha..."
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan Tambahan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Catatan administrasi, berkas pendukung, dll..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
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
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

