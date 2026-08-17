import React from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  // Realistic overview metrics
  const stats = [
    {
      title: "Total Peserta Didik",
      value: "148 Siswa",
      subtitle: "Paket A: 24 | Paket B: 46 | Paket C: 78",
      icon: Users,
      colorTheme: "indigo" as const,
      trend: { value: "+12%", isPositive: true },
    },
    {
      title: "Pendidik & Tutor",
      value: "16 Tutor",
      subtitle: "14 Aktif Mengajar Hari Ini",
      icon: GraduationCap,
      colorTheme: "emerald" as const,
    },
    {
      title: "Tingkat Kehadiran Hari Ini",
      value: "94.2%",
      subtitle: "139 Hadir | 5 Izin | 4 Belum Presensi",
      icon: CalendarCheck,
      colorTheme: "blue" as const,
      trend: { value: "+3.1%", isPositive: true },
    },
    {
      title: "Kesiapan e-Rapor",
      value: "72%",
      subtitle: "Semester Ganjil 2025/2026",
      icon: Award,
      colorTheme: "amber" as const,
    },
  ];

  const recentAttendances = [
    { name: "Budi Santoso", packet: "Paket C - Kelas X", time: "07:45 WIB", status: "HADIR", method: "GPS Valid (12m)" },
    { name: "Siti Rahmawati", packet: "Paket B - Kelas VIII", time: "07:52 WIB", status: "HADIR", method: "QR Code" },
    { name: "Ahmad Fauzi", packet: "Paket C - Kelas XI", time: "08:10 WIB", status: "TERLAMBAT", method: "GPS Valid (25m)" },
    { name: "Dewi Lestari", packet: "Paket A - Kelas V", time: "07:30 WIB", status: "HADIR", method: "QR Code" },
    { name: "Rian Hidayat", packet: "Paket C - Kelas XII", time: "-", status: "IZIN", method: "Surat Dokter" },
  ];

  const recentJournals = [
    {
      teacher: "Drs. Hendra Gunawan",
      subject: "Matematika Paket C",
      topic: "Persamaan Linear Dua Variabel & Aplikasi Sehari-hari",
      time: "09:30 WIB",
      studentsCount: "26 / 28 Siswa",
    },
    {
      teacher: "Nurul Aini, S.Pd.",
      subject: "Bahasa Indonesia Paket B",
      topic: "Menganalisis Teks Eksplanasi Fenomena Sosial",
      time: "10:45 WIB",
      studentsCount: "22 / 24 Siswa",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Pusat Kendali Administrasi
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Selamat Datang, {user?.name || "Administrator"}!
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Sistem Informasi PKBM Askara beroperasi normal. Semua modul Presensi, Jurnal Guru, LMS, dan Asesmen terintegrasi secara *real-time*.
          </p>
        </div>

        {/* Action Buttons in Banner */}
        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <Link
            href="/admin/attendances"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Rekap Presensi Hari Ini</span>
          </Link>
          <Link
            href="/rapor"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Award className="w-4 h-4" />
            <span>Kelola e-Rapor</span>
          </Link>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, idx) => (
          <StatCard key={idx} {...item} />
        ))}
      </div>

      {/* Grid Konten: Presensi Terkini & Jurnal Guru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Attendance Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Aktivitas Presensi Terkini</h2>
              <p className="text-xs text-slate-500">Log kehadiran peserta didik dan pendidik hari ini</p>
            </div>
            <Link
              href="/admin/attendances"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                  <th className="pb-3 font-semibold">Nama Siswa</th>
                  <th className="pb-3 font-semibold">Paket & Rombel</th>
                  <th className="pb-3 font-semibold">Waktu</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAttendances.map((att, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 font-semibold text-slate-800">{att.name}</td>
                    <td className="py-3 text-slate-500">{att.packet}</td>
                    <td className="py-3 text-slate-600 font-medium">{att.time}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          att.status === "HADIR"
                            ? "bg-emerald-100 text-emerald-800"
                            : att.status === "TERLAMBAT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{att.method}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Jurnal Mengajar Terbaru */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Jurnal Guru Hari Ini</h2>
              <p className="text-xs text-slate-500">Catatan kegiatan pembelajaran</p>
            </div>
            <Link
              href="/admin/journals"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Semua
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            {recentJournals.map((jr, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-emerald-700">{jr.subject}</span>
                  <span>{jr.time}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-1">{jr.topic}</h4>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>Oleh: {jr.teacher}</span>
                  <span className="font-semibold text-slate-700">{jr.studentsCount}</span>
                </div>
              </div>
            ))}

            <Link
              href="/admin/journals"
              className="block text-center py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 transition"
            >
              + Buka Rekapitulasi Jurnal Mengajar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
