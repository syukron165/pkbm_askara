import React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  BookOpen,
  ClipboardList,
  FileCheck,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentUser } from "@/lib/auth";

export default async function SiswaDashboardPage() {
  const user = await getCurrentUser();

  const siswaStats = [
    {
      title: "Presensi Bulan Ini",
      value: "96.4%",
      subtitle: "22 Hadir | 1 Izin | 0 Alpa",
      icon: CalendarCheck,
      colorTheme: "emerald" as const,
    },
    {
      title: "Tugas Aktif",
      value: "2 Tugas",
      subtitle: "1 Mendekati Tenggat Waktu",
      icon: ClipboardList,
      colorTheme: "amber" as const,
    },
    {
      title: "Ujian CBT Tersedia",
      value: "1 Ujian",
      subtitle: "Matematika Paket C (PTS)",
      icon: FileCheck,
      colorTheme: "indigo" as const,
    },
    {
      title: "Rata-Rata Capaian",
      value: "86.5",
      subtitle: "Predikat: Sangat Baik (A)",
      icon: Award,
      colorTheme: "blue" as const,
    },
  ];

  const pendingAssignments = [
    {
      subject: "Matematika",
      title: "Latihan Soal Matriks & Sistem Persamaan",
      dueDate: "Besok, 23:59 WIB",
      teacher: "Drs. Hendra Gunawan",
      isUrgent: true,
      status: "BELUM_DIKUMPULKAN",
    },
    {
      subject: "Bahasa Indonesia",
      title: "Menyusun Teks Eksplanasi Fenomena Sosial",
      dueDate: "3 Hari Lagi (17 Ags 2026)",
      teacher: "Nurul Aini, S.Pd.",
      isUrgent: false,
      status: "BELUM_DIKUMPULKAN",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              Paket C (Setara SMA) • Kelas X Merdeka
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Halo, {user?.name}!
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

          <div className="mt-4 space-y-3">
            {pendingAssignments.map((task, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {task.subject}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center space-x-1 ${
                        task.isUrgent ? "text-rose-600" : "text-slate-500"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>Deadline: {task.dueDate}</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-1.5">{task.title}</h3>
                  <p className="text-xs text-slate-500">Guru: {task.teacher}</p>
                </div>

                <Link
                  href="/siswa/tugas"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition self-start sm:self-center"
                >
                  <span>Kerjakan Tugas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Ujian CBT & e-Rapor Banner */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
            <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Ujian CBT Aktif</span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                Online
              </span>
            </h2>

            <div className="mt-4 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <h3 className="text-xs font-bold text-indigo-950">
                PTS Ganjil: Matematika Paket C
              </h3>
              <p className="text-[11px] text-slate-600 mt-1">
                30 Soal Objektif • Waktu: 60 Menit • KKM: 75
              </p>
              <div className="mt-3 pt-3 border-t border-indigo-100/70 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-indigo-700">Tersedia s/d 16:00 WIB</span>
                <Link
                  href="/siswa/cbt"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
                >
                  Mulai Tes
                </Link>
              </div>
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
