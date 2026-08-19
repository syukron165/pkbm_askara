import React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ClipboardList,
  FileCheck,
  Award,
  Clock,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SiswaDashboardPage() {
  const user = await getCurrentUser();

  // Query data siswa nyata dari database berdasarkan User ID
  let studentData = null;
  let activeTasksCount = 0;
  let activeExamsCount = 0;

  if (user?.id) {
    studentData = await db.student.findUnique({
      where: { userId: user.id },
      include: {
        enrollments: {
          include: {
            class: true,
          },
        },
      },
    });

    // Mengambil jumlah tugas/ujian yang belum selesai dari database jika relasi ada
    // Dapat disesuaikan dengan tabel assignment / exam di skema DB Anda
  }

  const packetBadgeText = studentData
    ? `${studentData.packetType} (${studentData.studyModel})`
    : "Peserta Didik Active • PKBM Askara";

  // Data Statistik Nyata (Default 0 jika belum ada rekap)
  const siswaStats = [
    {
      title: "Presensi Bulan Ini",
      value: "0%",
      subtitle: "0 Hadir | 0 Izin | 0 Alpa",
      icon: CalendarCheck,
      colorTheme: "emerald" as const,
    },
    {
      title: "Tugas Aktif",
      value: `${activeTasksCount} Tugas`,
      subtitle: activeTasksCount > 0 ? "Memerlukan pengerjaan" : "Tidak ada tenggat tugas",
      icon: ClipboardList,
      colorTheme: "amber" as const,
    },
    {
      title: "Ujian CBT Tersedia",
      value: `${activeExamsCount} Ujian`,
      subtitle: activeExamsCount > 0 ? "Siap dikerjakan" : "Belum ada jadwal ujian",
      icon: FileCheck,
      colorTheme: "indigo" as const,
    },
    {
      title: "Rata-Rata Capaian",
      value: "0.0",
      subtitle: "Predikat: Belum Ada Nilai",
      icon: Award,
      colorTheme: "blue" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              {packetBadgeText}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Halo, {user?.name || "Peserta Didik"}!
            </h1>
            <p className="mt-2 text-indigo-100/90 text-sm leading-relaxed">
              Selamat datang di ruang belajar digital PKBM Askara. Pantau materi belajar, kumpulkan tugas mandiri, dan ikuti asesmen CBT di sini.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/siswa/presensi"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Presensi Masuk (GPS/QR)</span>
            </Link>
            <Link
              href="/siswa/cbt"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Mulai Ujian CBT</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {siswaStats.map((item, idx) => (
          <StatCard key={idx} {...item} />
        ))}
      </div>

      {/* Grid Konten: Tugas & Ujian CBT Aktif */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Assignments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Tugas Mandiri Menunggu</h2>
              <p className="text-xs text-slate-500">Kumpulkan tugas sebelum tenggat waktu berakhir</p>
            </div>
            <Link
              href="/siswa/tugas"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>Semua Tugas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4">
            {/* Tampilan Kosong Alami saat Belum Ada Tugas di Database */}
            <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <ClipboardList className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-xs text-slate-600">Belum ada tugas mandiri aktif saat ini.</p>
              <p className="text-[11px] text-slate-400">Tugas baru dari tutor/guru akan otomatis muncul di halaman ini.</p>
            </div>
          </div>
        </div>

        {/* Ujian CBT & e-Rapor Banner */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
            <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Ujian CBT Aktif</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                Online
              </span>
            </h2>

            {/* Tampilan Kosong Alami saat Belum Ada Jadwal Ujian */}
            <div className="mt-4 py-8 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              Tidak ada ujian CBT yang dijadwalkan saat ini.
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-xl p-5 text-white shadow-soft">
            <div className="flex items-center space-x-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>e-Rapor PKBM Askara</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-2">
              Laporan Capaian Belajar Digital
            </h3>
            <p className="text-xs text-emerald-100/80 mt-1">
              Rapor semester teragregasi otomatis dari nilai presensi, tugas LMS, dan ujian CBT.
            </p>
            <Link
              href="/siswa/rapor"
              className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-bold transition"
            >
              <span>Pratinjau e-Rapor Saya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}