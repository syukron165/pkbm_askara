"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  Building2,
  ChevronRight,
  Plus,
  Search,
  Download,
  Printer,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Award,
  BookMarked,
  Clock,
  MapPin,
} from "lucide-react";

export default function AdminDataMasterHubPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "guru" | "siswa" | "mapel" | "kelas">("overview");

  // Summary Metrics
  const [stats, setStats] = useState({
    totalManagement: 8,
    totalTeachers: 6,
    activeTeachers: 6,
    totalStudents: 104,
    activeStudents: 104,
    totalSubjects: 16,
    totalSKK: 50,
    totalClasses: 6,
    totalCapacity: 168,
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/admin" className="hover:text-slate-800 transition">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-emerald-700 font-bold">Pusat Data Master</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <FolderKanban className="w-4 h-4" />
              <span>Pusat Manajemen Entitas Dasar Lembaga</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Pusat Data Master PKBM Askara
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
              Modul terpadu untuk mengelola seluruh data fondasi institusi meliputi data personel manajemen/struktural, pendidik/tutor, peserta didik/warga belajar, mata pelajaran kurikulum merdeka kesetaraan, serta struktur rombel.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* 5 Core Master Entity Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-8">
          {/* Card 0: Data Manajemen */}
          <Link
            href="/admin/management"
            className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/80 transition-all hover-lift group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-amber-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-4">Data Manajemen</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kepala PKBM, waka, kepala TU, bendahara, dan operator.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Total Personel:</span>
              <span className="text-amber-800 text-sm font-extrabold">{stats.totalManagement} Personel</span>
            </div>
          </Link>

          {/* Card 1: Data Guru */}
          <Link
            href="/admin/teachers"
            className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all hover-lift group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-4">Data Pendidik / Guru</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tutor mata pelajaran, instruktur vokasi, dan pembina rombel.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Total Tutor:</span>
              <span className="text-emerald-800 text-sm font-extrabold">{stats.totalTeachers} Guru</span>
            </div>
          </Link>

          {/* Card 2: Data Siswa */}
          <Link
            href="/admin/students"
            className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all hover-lift group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-indigo-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-4">Data Peserta Didik</h3>
              <p className="text-xs text-slate-500 mt-1">
                Warga belajar Paket A, Paket B, Paket C, dan wali murid.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-200/60 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Total Warga Belajar:</span>
              <span className="text-indigo-800 text-sm font-extrabold">{stats.totalStudents} Siswa</span>
            </div>
          </Link>

          {/* Card 3: Data Mapel */}
          <Link
            href="/admin/subjects"
            className="p-5 rounded-2xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50/80 transition-all hover-lift group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-blue-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-4">Mata Pelajaran</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kurikulum kesetaraan, bobot SKK, KKM, dan silabus.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Total Mapel:</span>
              <span className="text-blue-800 text-sm font-extrabold">{stats.totalSubjects} Mapel</span>
            </div>
          </Link>

          {/* Card 4: Data Kelas */}
          <Link
            href="/admin/classes"
            className="p-5 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50/80 transition-all hover-lift group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-purple-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-4">Kelas & Rombel</h3>
              <p className="text-xs text-slate-500 mt-1">
                Rombel, plotting wali kelas, dan kapasitas siswa.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200/60 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Total Rombel:</span>
              <span className="text-purple-800 text-sm font-extrabold">{stats.totalClasses} Rombel</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Grid Quick Access & Master Info Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Panduan Standar Data Master */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Struktur & Alur Integrasi Data Master
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>1. Hubungan Guru & Mapel</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap tutor yang didaftarkan pada <strong>Data Guru</strong> dapat ditugaskan sebagai pengampu mata pelajaran serta plotting jadwal mengajar mingguan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>2. Penempatan Siswa ke Rombel</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Warga belajar yang terdaftar pada <strong>Data Siswa</strong> dikelompokkan ke dalam <strong>Kelas & Rombel</strong> sesuai jenjang Paket A, B, atau C.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>3. Standarisasi SKK & KKM</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Struktur kurikulum pada <strong>Data Mata Pelajaran</strong> menjadi acuan perhitungan nilai rapor digital dan penilaian CBT otomatis.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>4. Wali Kelas & Monitoring</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tutor yang ditunjuk sebagai Wali Kelas pada <strong>Kelas & Rombel</strong> memiliki wewenang memverifikasi jurnal, kehadiran, dan e-Rapor kelasnya.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Links */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Akses Menu Cepat</span>
            <FolderKanban className="w-4 h-4 text-emerald-700" />
          </h2>

          <div className="space-y-2">
            <Link
              href="/admin/teachers"
              className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Kelola Data Guru</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition" />
            </Link>

            <Link
              href="/admin/students"
              className="p-3 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-slate-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">Kelola Data Siswa</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 transition" />
            </Link>

            <Link
              href="/admin/subjects"
              className="p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-slate-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Kelola Mata Pelajaran</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition" />
            </Link>

            <Link
              href="/admin/classes"
              className="p-3 rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-slate-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <Layers className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-800">Kelola Kelas & Rombel</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
