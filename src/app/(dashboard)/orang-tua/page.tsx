import React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Award,
  BookOpen,
  UserCheck,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Clock,
  Download,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentUser } from "@/lib/auth";

export default async function OrangTuaDashboardPage() {
  const user = await getCurrentUser();

  const childProfile = {
    name: "Budi Santoso",
    nisn: "0081294812",
    packet: "Paket C (Setara SMA) - Kelas X Merdeka",
    homeroomTeacher: "Drs. Hendra Gunawan",
    academicYear: "2025/2026 (Semester Ganjil)",
  };

  const parentStats = [
    {
      title: "Persentase Kehadiran Anak",
      value: "96.4%",
      subtitle: "22 Hari Hadir | 1 Izin | 0 Alpa",
      icon: CalendarCheck,
      colorTheme: "emerald" as const,
    },
    {
      title: "Nilai Rata-Rata Tugas",
      value: "88.2",
      subtitle: "10 Tugas Terkumpul Lengkap",
      icon: BookOpen,
      colorTheme: "blue" as const,
    },
    {
      title: "Nilai Ujian (CBT)",
      value: "84.5",
      subtitle: "PTS Ganjil Selesai",
      icon: Award,
      colorTheme: "amber" as const,
    },
    {
      title: "Status e-Rapor",
      value: "Tersedia",
      subtitle: "Siap Ditinjau & Diunduh",
      icon: FileText,
      colorTheme: "indigo" as const,
    },
  ];

  const recentGrades = [
    { subject: "Matematika", type: "Tugas LMS: Persamaan Linear", score: 90, date: "12 Ags 2026" },
    { subject: "Bahasa Indonesia", type: "Tugas LMS: Analisis Teks", score: 86, date: "10 Ags 2026" },
    { subject: "Pendidikan Kewarganegaraan", type: "PTS CBT Ganjil", score: 85, date: "05 Ags 2026" },
    { subject: "Sosiologi", type: "Tugas Mandiri Portofolio", score: 92, date: "01 Ags 2026" },
  ];

  return (
    <div className="space-y-6">
      {/* Parent Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              Portal Pemantauan Belajar Wali Murid
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Selamat Datang, Bapak/Ibu {user?.name}!
            </h1>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Memantau perkembangan belajar peserta didik di PKBM Askara secara transparan, mulai dari kehadiran, nilai tugas, ujian CBT, hingga e-Rapor.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-xs space-y-1">
            <p className="text-slate-300 font-medium">Peserta Didik yang Dipantau:</p>
            <p className="text-sm font-bold text-amber-300">{childProfile.name}</p>
            <p className="text-slate-300">{childProfile.packet}</p>
            <p className="text-slate-400 text-[11px]">Wali Kelas: {childProfile.homeroomTeacher}</p>
          </div>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {parentStats.map((item, idx) => (
          <StatCard key={idx} {...item} />
        ))}
      </div>

      {/* Grid Konten: Nilai Terkini & Unduh e-Rapor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Grades Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Perkembangan Nilai Terbaru</h2>
              <p className="text-xs text-slate-500">Nilai tugas LMS dan asesmen CBT {childProfile.name}</p>
            </div>
            <Link
              href="/orang-tua/nilai"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Lihat Riwayat
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                  <th className="pb-3 font-semibold">Mata Pelajaran</th>
                  <th className="pb-3 font-semibold">Kategori Penilaian</th>
                  <th className="pb-3 font-semibold">Tanggal</th>
                  <th className="pb-3 font-semibold text-right">Nilai Diperoleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentGrades.map((grade, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-bold text-slate-800">{grade.subject}</td>
                    <td className="py-3 text-slate-600">{grade.type}</td>
                    <td className="py-3 text-slate-500">{grade.date}</td>
                    <td className="py-3 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-md font-bold text-xs bg-emerald-100 text-emerald-800">
                        {grade.score} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* e-Rapor & Catatan Wali Kelas */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
            <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>e-Rapor Semester</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                Resmi
              </span>
            </h2>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <p className="text-slate-500 font-medium">Tahun Ajaran 2025/2026 (Ganjil)</p>
              <h3 className="font-bold text-slate-800 text-sm mt-1">Laporan Hasil Belajar Digital</h3>
              <p className="text-slate-600 text-[11px] mt-2">
                Disahkan oleh Tutor & Kepala PKBM Askara.
              </p>

              <Link
                href="/rapor"
                className="mt-4 w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Lihat & Cetak PDF e-Rapor</span>
              </Link>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900">
            <div className="flex items-center space-x-2 font-bold mb-1">
              <HeartHandshake className="w-4 h-4 text-amber-700" />
              <span>Catatan Wali Kelas</span>
            </div>
            <p className="text-amber-800/90 leading-relaxed text-[11px]">
              &ldquo;Ananda Budi Santoso menunjukkan keaktifan yang sangat baik dalam diskusi modul mandiri dan konsisten menyelesaikan tugas tepat waktu. Pertahankan!&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
