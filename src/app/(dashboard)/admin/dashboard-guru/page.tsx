"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  School,
  Briefcase,
  Landmark,
  RefreshCw,
  Printer,
  Search,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
  Sparkles,
  MapPin,
} from "lucide-react";

export default function DashboardGuruManajemenPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterBranch, setFilterBranch] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterRole !== "ALL") params.set("role", filterRole);
      if (filterBranch !== "ALL") params.set("branchCode", filterBranch);

      const res = await fetch(`/api/analytics/staff?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching staff analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterRole, filterBranch]);

  const summary = data?.summary || {
    totalPersonnel: 0,
    totalTutors: 0,
    totalManagement: 0,
    branchesCount: 0,
    s1Count: 0,
    s2Count: 0,
  };

  const byAge = data?.byAge || [];
  const byBranch = data?.byBranch || [];
  const byEducation = data?.byEducation || [];
  const bySubject = data?.bySubject || [];
  const byMajor = data?.byMajor || [];
  const byUniversity = data?.byUniversity || [];
  const personnelList = data?.personnelList || [];
  const branches = data?.branches || [];

  // Filter list by search term
  const filteredList = personnelList.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specificRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart max value calculations
  const maxAgeCount = Math.max(...byAge.map((a: any) => a.count), 1);
  const maxBranchCount = Math.max(...byBranch.map((b: any) => b.total), 1);
  const maxSubjectCount = Math.max(...bySubject.map((s: any) => s.count), 1);
  const maxMajorCount = Math.max(...byMajor.map((m: any) => m.count), 1);
  const maxUnivCount = Math.max(...byUniversity.map((u: any) => u.count), 1);

  // SVG Pie chart calculation for Education
  const totalEdu = summary.totalPersonnel || 1;
  const s1Pct = Math.round(((summary.s1Count || 0) / totalEdu) * 100);
  const s2Pct = Math.round(((summary.s2Count || 0) / totalEdu) * 100);
  const otherPct = Math.max(100 - s1Pct - s2Pct, 0);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden border border-indigo-900/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Pusat Analitik & Statistik Pendidik & Staf</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Guru, Tutor & Manajemen
            </h1>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Analisis komprehensif profil kualifikasi akademik pendidik, distribusi mata pelajaran, latar belakang jurusan, almamater kampus, dan penempatan cabang.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-semibold transition backdrop-blur-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Segarkan Data</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition backdrop-blur-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-indigo-300/80 mb-1">
              Kategori Personel:
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="ALL" className="text-slate-900">Semua Personel (Tutor & Manajemen)</option>
              <option value="TUTOR" className="text-slate-900">Pendidik / Tutor Pengajar Saja</option>
              <option value="MANAJEMEN" className="text-slate-900">Manajemen, Tata Usaha & Staf Saja</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-indigo-300/80 mb-1">
              Penempatan Cabang / Rumah Belajar:
            </label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="ALL" className="text-slate-900">Semua Cabang / Rumah Belajar</option>
              {branches.map((b: any) => (
                <option key={b.code} value={b.code} className="text-slate-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── METRIC CARDS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Personel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Total Personel
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {summary.totalPersonnel} <span className="text-xs font-normal text-slate-500">Orang</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Tutor: {summary.totalTutors}</span>
            <span>Manajemen: {summary.totalManagement}</span>
          </p>
        </div>

        {/* 2. Tutor Pengajar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pendidik & Tutor
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                {summary.totalTutors} <span className="text-xs font-normal text-slate-500">Guru</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Kurikulum Merdeka</span>
            <span className="text-emerald-600 font-bold">100% Aktif</span>
          </p>
        </div>

        {/* 3. Kualifikasi Sarjana S1/S2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                4. Kualifikasi S1 & S2
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
                {s1Pct + s2Pct}% <span className="text-xs font-normal text-slate-500">Lulusan</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>S1: {summary.s1Count}</span>
            <span>S2: {summary.s2Count}</span>
          </p>
        </div>

        {/* 4. Sentra Penempatan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                3. Rumah Belajar
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                {branches.length || 7} <span className="text-xs font-normal text-slate-500">Cabang</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Landmark className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Sentra Pembelajaran</span>
            <span className="text-emerald-600 font-bold">Tersebar</span>
          </p>
        </div>
      </div>

      {/* ── SECTION 1: USIA & CABANG PENEMPATAN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fitur 2: Personel Berdasarkan Usia */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>2. Personel Berdasarkan Usia (Kelompok Usia)</span>
              </h2>
              <p className="text-xs text-slate-500">Distribusi usia pendidik dan tenaga kependidikan</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {byAge.map((ag: any) => {
              const width = Math.max((ag.count / maxAgeCount) * 100, 4);
              return (
                <div key={ag.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{ag.label}</span>
                    <span className="font-extrabold text-indigo-700">{ag.count} Orang</span>
                  </div>
                  <div className="w-full h-6 bg-slate-100 rounded-xl overflow-hidden p-0.5 flex items-center">
                    <div
                      style={{ width: `${width}%`, backgroundColor: ag.color }}
                      className="h-full rounded-lg transition-all duration-700 flex items-center justify-end px-2"
                    >
                      <span className="text-[10px] text-white font-bold">{ag.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
            <span>Usia Produktif ({`<`} 45 thn): Mayoritas Personel</span>
            <span className="font-bold text-indigo-700">Enerjik & Dinamis</span>
          </div>
        </div>

        {/* Fitur 3: Personel Berdasarkan Cabang Rumah Belajar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-amber-600" />
                <span>3. Personel per Cabang / Rumah Belajar</span>
              </h2>
              <p className="text-xs text-slate-500">Penempatan tutor dan staf di unit-unit cabang</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {byBranch.map((b: any) => {
              const barWidth = Math.max((b.total / maxBranchCount) * 100, 6);
              return (
                <div key={b.branchCode} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{b.branchName}</span>
                    <span className="font-extrabold text-slate-900">
                      {b.total} Staf <span className="text-slate-400 font-normal">({b.tutors} Tutor, {b.management} TU)</span>
                    </span>
                  </div>

                  <div className="w-full h-6 bg-slate-100 rounded-lg overflow-hidden flex">
                    {b.tutors > 0 && (
                      <div
                        style={{ width: `${(b.tutors / (b.total || 1)) * 100}%` }}
                        className="bg-emerald-500 h-full flex items-center justify-center text-[9px] text-white font-bold"
                        title={`Tutor: ${b.tutors}`}
                      >
                        Tutor: {b.tutors}
                      </div>
                    )}
                    {b.management > 0 && (
                      <div
                        style={{ width: `${(b.management / (b.total || 1)) * 100}%` }}
                        className="bg-indigo-600 h-full flex items-center justify-center text-[9px] text-white font-bold"
                        title={`Manajemen: ${b.management}`}
                      >
                        TU: {b.management}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: JENJANG PENDIDIKAN & MATA PELAJARAN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fitur 4: Personel Berdasarkan Jenjang Pendidikan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <School className="w-4 h-4 text-purple-600" />
                <span>4. Jenjang Pendidikan Terakhir (Kualifikasi)</span>
              </h2>
              <p className="text-xs text-slate-500">Kualifikasi akademik SMA/SMK, D3, S1, S2, dan S3</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {byEducation.map((edu: any) => (
              <div
                key={edu.level}
                className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center hover:border-purple-200 transition"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Jenjang
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-0.5">{edu.level}</h4>
                <p className="text-sm font-extrabold text-purple-600 mt-1">{edu.count} Orang</p>
                <p className="text-[10px] text-slate-500 font-semibold">{edu.percentage}%</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-slate-700">Bar Distribusi Kualifikasi:</p>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${s1Pct}%` }}
                className="bg-purple-600 h-full"
                title={`S1: ${s1Pct}%`}
              />
              <div
                style={{ width: `${s2Pct}%` }}
                className="bg-emerald-500 h-full"
                title={`S2: ${s2Pct}%`}
              />
              <div
                style={{ width: `${otherPct}%` }}
                className="bg-amber-400 h-full"
                title={`Lainnya: ${otherPct}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600 pt-1">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                <span>Sarjana (S1)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Magister (S2)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>Diploma / SMA</span>
              </span>
            </div>
          </div>
        </div>

        {/* Fitur 5: Personel Berdasarkan Mata Pelajaran */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>5. Personel Berdasarkan Mata Pelajaran</span>
              </h2>
              <p className="text-xs text-slate-500">Mata pelajaran dan bidang keahlian yang diampu</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {bySubject.slice(0, 6).map((sub: any) => {
              const width = Math.max((sub.count / maxSubjectCount) * 100, 6);
              return (
                <div key={sub.subjectName} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{sub.subjectName}</span>
                    <span className="font-extrabold text-emerald-700">{sub.count} Pengampu</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${width}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 italic pt-1">
            * Tutor dapat mengampu lebih dari satu mata pelajaran lintas fase dan jenjang program.
          </p>
        </div>
      </div>

      {/* ── SECTION 3: JURUSAN & KAMPUS ASAL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fitur 6: Personel Berdasarkan Jurusan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>6. Personel Berdasarkan Jurusan / Program Studi</span>
              </h2>
              <p className="text-xs text-slate-500">Latar belakang bidang ilmu sarjana pendidik & staf</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {byMajor.map((mj: any, idx: number) => {
              const width = Math.max((mj.count / maxMajorCount) * 100, 6);
              return (
                <div key={mj.major} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{mj.major}</span>
                    </span>
                    <span className="font-extrabold text-blue-700">{mj.count} Orang</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${width}%` }}
                      className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fitur 7: Personel Berdasarkan Kampus / Perguruan Tinggi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>7. Personel Berdasarkan Kampus / Perguruan Tinggi</span>
              </h2>
              <p className="text-xs text-slate-500">Almamater perguruan tinggi asal personel PKBM</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {byUniversity.map((univ: any, idx: number) => {
              const width = Math.max((univ.count / maxUnivCount) * 100, 6);
              return (
                <div key={univ.university} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5 truncate max-w-[280px]">
                      <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{univ.university}</span>
                    </span>
                    <span className="font-extrabold text-amber-700 flex-shrink-0">{univ.count} Orang</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${width}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: TABEL DATA PERSONEL RINGKAS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Daftar Tutor & Tenaga Kependidikan Aktif</span>
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredList.length} personel pendidik dan manajemen terdaftar
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, jurusan, atau kampus..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200/80">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Nama Lengkap & Gelar</th>
                <th className="py-3 px-3">Peran / Jabatan</th>
                <th className="py-3 px-3">Usia</th>
                <th className="py-3 px-3">Pendidikan</th>
                <th className="py-3 px-3">Jurusan / Program Studi</th>
                <th className="py-3 px-3">Almamater Kampus</th>
                <th className="py-3 px-3">Cabang Belajar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada data personel yang cocok.
                  </td>
                </tr>
              ) : (
                filteredList.map((p: any, idx: number) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.roleType === "TUTOR"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {p.specificRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {p.age} thn
                    </td>
                    <td className="py-2.5 px-3 font-bold text-purple-700">
                      {p.education}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{p.major}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.university}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.branchName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Menampilkan daftar personel pendidik & staf PKBM Askara</span>
          <div className="flex space-x-3">
            <Link
              href="/admin/teachers"
              className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1"
            >
              <span>Kelola Data Guru</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/management"
              className="font-bold text-indigo-700 hover:text-indigo-800 inline-flex items-center space-x-1"
            >
              <span>Kelola Data Manajemen</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
