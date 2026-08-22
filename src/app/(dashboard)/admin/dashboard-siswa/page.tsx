"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  CalendarDays,
  Landmark,
  Layers,
  MapPin,
  RefreshCw,
  Printer,
  Download,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  UserCheck,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function DashboardSiswaPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filterAcademicYear, setFilterAcademicYear] = useState("ALL");
  const [filterBranch, setFilterBranch] = useState("ALL");
  const [filterProgram, setFilterProgram] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterAcademicYear !== "ALL") params.set("academicYear", filterAcademicYear);
      if (filterBranch !== "ALL") params.set("branchCode", filterBranch);
      if (filterProgram !== "ALL") params.set("packetType", filterProgram);

      const res = await fetch(`/api/analytics/students?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching student analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterAcademicYear, filterBranch, filterProgram]);

  const summary = data?.summary || {
    totalStudents: 0,
    schoolAgeCount: 0,
    adultAgeCount: 0,
    maleCount: 0,
    femaleCount: 0,
    paketACount: 0,
    paketBCount: 0,
    paketCCount: 0,
    branchesCount: 0,
  };

  const byGender = data?.byGender || {
    male: 0,
    female: 0,
    malePercentage: 50,
    femalePercentage: 50,
  };

  const byProgram = data?.byProgram || [];
  const byBranch = data?.byBranch || [];
  const byAcademicYear = data?.byAcademicYear || [];
  const ageRangeAnalysis = data?.ageRangeAnalysis || {
    schoolAgeCount: 0,
    schoolAgePercentage: 0,
    adultAgeCount: 0,
    adultAgePercentage: 0,
    brackets: [],
  };
  const byDomicile = data?.byDomicile || [];
  const branches = data?.branches || [];
  const sampleList = data?.sampleList || [];

  // Filter sample list by search term
  const filteredList = sampleList.filter(
    (s: any) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.packetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.domicile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // SVG Pie Chart calculations
  const totalGender = (byGender.male || 0) + (byGender.female || 0) || 1;
  const maleDeg = ((byGender.male || 0) / totalGender) * 360;
  const femaleDeg = ((byGender.female || 0) / totalGender) * 360;

  // Max value for program bars
  const maxProgramCount = Math.max(...byProgram.map((p: any) => p.count), 1);
  // Max value for branch bars
  const maxBranchCount = Math.max(...byBranch.map((b: any) => b.total), 1);
  // Max value for age brackets
  const maxAgeCount = Math.max(...(ageRangeAnalysis.brackets || []).map((b: any) => b.count), 1);
  // Max value for domicile
  const maxDomicileCount = Math.max(...byDomicile.map((d: any) => d.count), 1);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden border border-emerald-800/30">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Pusat Analitik & Statistik Siswa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Statistik Peserta Didik
            </h1>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Analisis komprehensif demografi, pertumbuhan tahun ajaran, sebaran program, cabang belajar, rentang usia, dan domisili siswa PKBM Askara.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/30 rounded-xl text-xs font-semibold transition backdrop-blur-sm"
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
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-emerald-300/80 mb-1">
              Tahun Ajaran:
            </label>
            <select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="ALL" className="text-slate-900">Semua Tahun Ajaran</option>
              <option value="2025/2026" className="text-slate-900">2025/2026 (Aktif)</option>
              <option value="2026/2027" className="text-slate-900">2026/2027</option>
              <option value="2024/2025" className="text-slate-900">2024/2025</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-emerald-300/80 mb-1">
              Cabang / Rumah Belajar:
            </label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="ALL" className="text-slate-900">Semua Cabang / Rumah Belajar</option>
              {branches.map((b: any) => (
                <option key={b.code} value={b.code} className="text-slate-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-emerald-300/80 mb-1">
              Program Kesetaraan:
            </label>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="ALL" className="text-slate-900">Semua Program (Paket A, B, C)</option>
              <option value="Paket A" className="text-slate-900">Paket A (Setara SD)</option>
              <option value="Paket B" className="text-slate-900">Paket B (Setara SMP)</option>
              <option value="Paket C" className="text-slate-900">Paket C (Setara SMA)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── METRIC CARDS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Siswa */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Total Peserta Didik
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {summary.totalStudents} <span className="text-xs font-normal text-slate-500">Siswa</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Paket A: {summary.paketACount}</span>
            <span>Paket B: {summary.paketBCount}</span>
            <span>Paket C: {summary.paketCCount}</span>
          </p>
        </div>

        {/* 2. Rentang Usia Sekolah (>5 s/d <25 Tahun) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Usia 6 - 24 Tahun
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
                {summary.schoolAgeCount}{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({ageRangeAnalysis.schoolAgePercentage}%)
                </span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Prioritas Usia Sekolah</span>
            <span className="text-emerald-600 font-bold">Wajib Belajar</span>
          </p>
        </div>

        {/* 3. Rasio Gender */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Komposisi Gender
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {summary.maleCount} 👦 / {summary.femaleCount} 👧
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <PieChartIcon className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>L: {byGender.malePercentage}%</span>
            <span>P: {byGender.femalePercentage}%</span>
          </p>
        </div>

        {/* 4. Total Cabang & Rumah Belajar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sentra Belajar Aktif
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
            <span>Tersebar di Jawa Barat</span>
            <span className="text-emerald-600 font-bold">100% Aktif</span>
          </p>
        </div>
      </div>

      {/* ── SECTION 1: TAHUN AJARAN & GENDER PIE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fitur 1: Total Siswa per Tahun Ajaran */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>1. Total Peserta Didik per Tahun Ajaran</span>
              </h2>
              <p className="text-xs text-slate-500">
                Statistik pertumbuhan dan distribusi program per tahun ajaran
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              {summary.totalStudents} Terdaftar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {byAcademicYear.map((yr: any) => (
              <div
                key={yr.academicYear}
                className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 hover:border-emerald-200 transition"
              >
                <p className="text-xs font-semibold text-slate-500">T.A. {yr.academicYear}</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{yr.total} Siswa</p>
                <div className="mt-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Paket A:</span>
                    <span className="font-bold text-emerald-600">{yr.paketA}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Paket B:</span>
                    <span className="font-bold text-sky-600">{yr.paketB}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Paket C:</span>
                    <span className="font-bold text-purple-600">{yr.paketC}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Academic Year Growth Bar */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-700">Komposisi Program Berjalan:</p>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(summary.paketACount / (summary.totalStudents || 1)) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Paket A: ${summary.paketACount}`}
              />
              <div
                style={{ width: `${(summary.paketBCount / (summary.totalStudents || 1)) * 100}%` }}
                className="bg-sky-500 h-full transition-all"
                title={`Paket B: ${summary.paketBCount}`}
              />
              <div
                style={{ width: `${(summary.paketCCount / (summary.totalStudents || 1)) * 100}%` }}
                className="bg-purple-600 h-full transition-all"
                title={`Paket C: ${summary.paketCCount}`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>Paket A ({summary.paketACount} siswa)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                <span>Paket B ({summary.paketBCount} siswa)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
                <span>Paket C ({summary.paketCCount} siswa)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Fitur 2: Grafik Pie Jenis Kelamin */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              <span>2. Jenis Kelamin (Grafik Pie)</span>
            </h2>
            <p className="text-xs text-slate-500">Proporsi peserta didik laki-laki & perempuan</p>
          </div>

          {/* Interactive SVG Donut / Pie */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  className="text-slate-100"
                  strokeWidth="6"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Male slice (Blue) */}
                <path
                  className="text-blue-500 transition-all duration-700 ease-out"
                  strokeDasharray={`${byGender.malePercentage}, 100`}
                  strokeWidth="6"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Female slice (Pink/Rose) */}
                <path
                  className="text-rose-400 transition-all duration-700 ease-out"
                  strokeDasharray={`${byGender.femalePercentage}, 100`}
                  strokeDashoffset={`-${byGender.malePercentage}`}
                  strokeWidth="6"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 font-semibold">Total</span>
                <span className="text-xl font-black text-slate-900">{summary.totalStudents}</span>
                <span className="text-[10px] text-slate-500">Peserta Didik</span>
              </div>
            </div>

            {/* Legend breakdown */}
            <div className="w-full mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div className="bg-blue-50/60 rounded-xl p-2.5 border border-blue-100 text-center">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mb-1" />
                <p className="text-xs font-bold text-slate-800">Laki-laki</p>
                <p className="text-base font-black text-blue-600">{summary.maleCount}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{byGender.malePercentage}%</p>
              </div>

              <div className="bg-rose-50/60 rounded-xl p-2.5 border border-rose-100 text-center">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400 mb-1" />
                <p className="text-xs font-bold text-slate-800">Perempuan</p>
                <p className="text-base font-black text-rose-500">{summary.femaleCount}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{byGender.femalePercentage}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: PROGRAM & CABANG GROUPED BAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fitur 3: Total Siswa Berdasarkan Program (Grafik Batang) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>3. Peserta Didik Berdasarkan Program (Grafik Batang)</span>
              </h2>
              <p className="text-xs text-slate-500">Rincian Paket A (SD), Paket B (SMP), dan Paket C (SMA)</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {byProgram.map((prog: any) => {
              const barWidth = Math.max((prog.count / maxProgramCount) * 100, 4);
              return (
                <div key={prog.program} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-800">{prog.program}</span>
                    <span className="text-slate-900 font-bold">
                      {prog.count} Siswa <span className="text-slate-400 font-normal">({prog.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-7 bg-slate-100 rounded-xl overflow-hidden p-1 flex items-center">
                    <div
                      style={{ width: `${barWidth}%`, backgroundColor: prog.color }}
                      className="h-full rounded-lg transition-all duration-700 flex items-center justify-end px-2"
                    >
                      <span className="text-[10px] text-white font-bold">{prog.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
            <span>Kurikulum: Kurikulum Merdeka Pendidikan Kesetaraan</span>
            <span className="font-bold text-emerald-700">Terakreditasi</span>
          </div>
        </div>

        {/* Fitur 4: Total Siswa Berdasarkan Cabang & Programnya (Grouped Bar Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>4. Siswa per Cabang & Program (Grafik Batang)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Sebaran peserta didik di setiap Rumah Belajar PKBM Askara
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {byBranch.map((b: any) => {
              const barWidth = Math.max((b.total / maxBranchCount) * 100, 6);
              return (
                <div key={b.branchCode} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{b.branchName}</span>
                    <span className="font-extrabold text-emerald-700">{b.total} Siswa</span>
                  </div>

                  {/* Grouped / Stacked bar */}
                  <div className="w-full h-6 bg-slate-100 rounded-lg overflow-hidden flex">
                    {b.paketA > 0 && (
                      <div
                        style={{ width: `${(b.paketA / (b.total || 1)) * 100}%` }}
                        className="bg-emerald-500 h-full flex items-center justify-center text-[9px] text-white font-bold"
                        title={`Paket A: ${b.paketA}`}
                      >
                        {b.paketA > 2 ? `A: ${b.paketA}` : ""}
                      </div>
                    )}
                    {b.paketB > 0 && (
                      <div
                        style={{ width: `${(b.paketB / (b.total || 1)) * 100}%` }}
                        className="bg-sky-500 h-full flex items-center justify-center text-[9px] text-white font-bold"
                        title={`Paket B: ${b.paketB}`}
                      >
                        {b.paketB > 2 ? `B: ${b.paketB}` : ""}
                      </div>
                    )}
                    {b.paketC > 0 && (
                      <div
                        style={{ width: `${(b.paketC / (b.total || 1)) * 100}%` }}
                        className="bg-purple-600 h-full flex items-center justify-center text-[9px] text-white font-bold"
                        title={`Paket C: ${b.paketC}`}
                      >
                        {b.paketC > 2 ? `C: ${b.paketC}` : ""}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>A: {b.paketA} | B: {b.paketB} | C: {b.paketC}</span>
                    <span>Kode: {b.branchCode}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: USIA, RENTANG 5-25 TAHUN, & DOMISILI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fitur 5 & 6: Jumlah Peserta Didik Berdasarkan Usia & Rentang 5-25 Tahun */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>5 & 6. Distribusi Usia & Rentang Usia Sekolah (5-25 Thn)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Piramida usia peserta didik dan proporsi target wajib belajar kesetaraan
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full self-start">
              Target Usia Sekolah: {ageRangeAnalysis.schoolAgeCount} Siswa
            </span>
          </div>

          {/* Highlight Badge Rentang >5 s/d <25 Tahun */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                Fokus Prioritas Wajar Dikdas
              </span>
              <p className="text-sm font-bold text-slate-900">
                Peserta Didik Usia 6 s/d 24 Tahun ({">"} 5 tahun & {"<"} 25 tahun)
              </p>
              <p className="text-xs text-slate-600">
                Memenuhi syarat penerimaan Bantuan Operasional Pendidikan (BOP) & Program Indonesia Pintar (PIP).
              </p>
            </div>
            <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
              <span className="text-3xl font-black text-indigo-700">
                {ageRangeAnalysis.schoolAgePercentage}%
              </span>
              <span className="text-xs text-slate-500">
                ({ageRangeAnalysis.schoolAgeCount} dari {summary.totalStudents} siswa)
              </span>
            </div>
          </div>

          {/* Histogram Usia */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-700">Kelompok Rentang Usia Peserta Didik:</p>
            <div className="space-y-2.5">
              {(ageRangeAnalysis.brackets || []).map((br: any) => {
                const width = Math.max((br.count / maxAgeCount) * 100, 3);
                return (
                  <div key={br.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: br.color }}
                        />
                        <span>{br.label}</span>
                        {br.isSchoolAge && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 font-bold rounded">
                            Usia Sekolah
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-slate-900">{br.count} Siswa</span>
                    </div>
                    <div className="w-full h-5 bg-slate-100 rounded-lg overflow-hidden p-0.5">
                      <div
                        style={{ width: `${width}%`, backgroundColor: br.color }}
                        className="h-full rounded-md transition-all duration-700"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fitur 7: Jumlah Peserta Didik Berdasarkan Domisili */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>7. Sebaran Domisili Siswa</span>
              </h2>
              <p className="text-xs text-slate-500">Daerah asal tempat tinggal peserta didik</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {byDomicile.map((dom: any, idx: number) => {
              const width = Math.max((dom.count / maxDomicileCount) * 100, 6);
              return (
                <div key={dom.region} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{dom.region}</span>
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {dom.count} <span className="text-[11px] font-normal text-slate-400">({dom.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${width}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-800">
            <p className="font-bold">Wilayah Dominan:</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Mayoritas peserta didik berdomisili di Kota Bandung, Kabupaten Bandung, dan sekitarnya.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: TABEL DATA SISWA RINGKAS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Daftar Peserta Didik Terverifikasi</span>
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredList.length} data siswa terdaftar di sistem
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NISN, atau domisili..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200/80">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Nama Peserta Didik</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-3">Gender</th>
                <th className="py-3 px-3">Program</th>
                <th className="py-3 px-3">Usia</th>
                <th className="py-3 px-3">Cabang Belajar</th>
                <th className="py-3 px-3">Domisili</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada data peserta didik yang cocok.
                  </td>
                </tr>
              ) : (
                filteredList.map((st: any, idx: number) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{st.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{st.nisn}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.gender === "L"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {st.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.packetType === "Paket A"
                            ? "bg-emerald-100 text-emerald-800"
                            : st.packetType === "Paket B"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {st.packetType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {st.age} thn
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{st.branchName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{st.domicile}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{st.status || "Aktif"}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Menampilkan 50 data teratas untuk pratinjau statistik</span>
          <Link
            href="/admin/students"
            className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1"
          >
            <span>Buka Manajemen Data Siswa Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
