import React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  BookMarked,
  BookOpen,
  FileCheck,
  Clock,
  MapPin,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Users,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function GuruDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Real today date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const jsDay = new Date().getDay();
  const todayDayName = dayNames[jsDay];
  const dayOfWeekInt = jsDay === 0 ? 7 : jsDay;

  // Fetch real metrics in parallel
  const [
    todayAttendance,
    todaySchedules,
    pendingAssignmentsCount,
    activeAssessmentsCount,
    totalMaterialsCount,
    todayJournals,
  ] = await Promise.all([
    db.attendance.findFirst({
      where: {
        userId: user.id,
        date: { gte: todayStart, lte: todayEnd },
      },
    }),
    db.classSchedule.findMany({
      where: {
        teacherId: user.id,
        dayOfWeek: dayOfWeekInt,
      },
      include: {
        class: true,
        subject: true,
      },
      orderBy: { startTime: "asc" },
    }),
    db.lMSAssignment.count({
      where: { teacherId: user.id },
    }),
    db.assessment.count({
      where: { teacherId: user.id, isPublished: true },
    }),
    db.lMSMaterial.count({
      where: { teacherId: user.id },
    }),
    db.teacherJournal.findMany({
      where: {
        teacherId: user.id,
        date: { gte: todayStart, lte: todayEnd },
      },
      select: { classId: true, subjectId: true },
    }),
  ]);

  const isPresentToday = !!todayAttendance;
  const checkInTimeStr = todayAttendance?.checkInTime
    ? new Date(todayAttendance.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    : todayAttendance
    ? new Date(todayAttendance.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    : "Belum Presensi";

  const guruStats = [
    {
      title: "Jadwal Mengajar Hari Ini",
      value: todaySchedules.length > 0 ? `${todaySchedules.length} Sesi` : "0 Sesi",
      subtitle:
        todaySchedules.length > 0
          ? `${todayDayName} (${todaySchedules.map((s) => s.class?.name || "Kelas").slice(0, 2).join(", ")})`
          : `Tidak ada jadwal hari ${todayDayName}`,
      icon: Clock,
      colorTheme: "emerald" as const,
    },
    {
      title: "Status Presensi Guru",
      value: isPresentToday
        ? todayAttendance.status === "HADIR"
          ? "Sudah Hadir"
          : todayAttendance.status
        : "Belum Hadir",
      subtitle: isPresentToday
        ? `Check-in: ${checkInTimeStr} (${todayAttendance.qrSessionId ? "QR Code" : "GPS / Mandiri"})`
        : "Silakan presensi GPS atau Scan QR",
      icon: CalendarCheck,
      colorTheme: (isPresentToday ? "emerald" : "blue") as any,
    },
    {
      title: "Materi & Modul Ajar",
      value: `${totalMaterialsCount} Modul`,
      subtitle: `${pendingAssignmentsCount} Tugas Pembelajaran LMS`,
      icon: BookOpen,
      colorTheme: "amber" as const,
    },
    {
      title: "Ujian CBT Aktif",
      value: `${activeAssessmentsCount} Asesmen`,
      subtitle: activeAssessmentsCount > 0 ? "Asesmen siap dikerjakan siswa" : "Belum ada asesmen aktif",
      icon: FileCheck,
      colorTheme: "indigo" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              Portal Pendidik & Tutor
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Semangat Mengajar, {user?.name}!
            </h1>
            <p className="mt-2 text-emerald-100/90 text-sm leading-relaxed">
              Kelola jurnal mengajar, materi pembelajaran daring, tugas, dan asesmen CBT untuk peserta didik PKBM Askara.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/guru/presensi"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>Presensi GPS/QR</span>
            </Link>
            <Link
              href="/guru/jurnal"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600/80 hover:bg-emerald-500 text-white border border-emerald-400/30 rounded-xl text-xs font-bold transition"
            >
              <BookMarked className="w-4 h-4" />
              <span>Tulis Jurnal Mengajar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {guruStats.map((item, idx) => (
          <StatCard key={idx} {...item} />
        ))}
      </div>

      {/* Grid Jadwal Hari Ini & Aksi Cepat Modul */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled Classes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Jadwal Mengajar Hari Ini</h2>
              <p className="text-xs text-slate-500">Kelas dan rombel yang Anda ampu hari ini ({todayDayName})</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              {todaySchedules.length} Sesi Terjadwal
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {todaySchedules.length > 0 ? (
              todaySchedules.map((item) => {
                const journalFilled = todayJournals.some(
                  (j) => j.classId === item.classId && j.subjectId === item.subjectId
                );

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                          {item.startTime} - {item.endTime} WIB
                        </span>
                        <span className="text-xs font-semibold text-slate-600">{item.room || "Ruang Belajar"}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mt-1.5">{item.subject?.name || "Mata Pelajaran"}</h3>
                      <p className="text-xs text-slate-500 font-medium">{item.class?.name || "Rombel"}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {journalFilled ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Jurnal Terisi</span>
                        </span>
                      ) : (
                        <Link
                          href="/guru/jurnal"
                          className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 rounded-lg transition"
                        >
                          <span>Isi Jurnal</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Tidak Ada Jadwal Mengajar Hari Ini ({todayDayName})
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Anda tidak memiliki jadwal mengajar tatap muka untuk hari ini. Anda dapat mengunggah modul ajar baru di LMS atau mencatat jurnal kegiatan mandiri.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Link
                    href="/guru/lms"
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
                  >
                    + Unggah Modul LMS
                  </Link>
                  <Link
                    href="/guru/jurnal"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition"
                  >
                    Tulis Jurnal Mengajar
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Akses Cepat Modul Guru */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
              Modul Pembelajaran
            </h2>
            <div className="mt-4 space-y-2.5">
              <Link
                href="/guru/lms"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/70 hover:bg-slate-50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">LMS (Materi & Tugas)</h4>
                    <p className="text-[11px] text-slate-500">Unggah modul & beri nilai</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
              </Link>

              <Link
                href="/guru/cbt"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/70 hover:bg-slate-50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Asesmen & CBT</h4>
                    <p className="text-[11px] text-slate-500">Bank soal & paket ujian</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
              </Link>

              <Link
                href="/pustaka"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/70 hover:bg-slate-50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Pustaka Digital</h4>
                    <p className="text-[11px] text-slate-500">Koleksi bahan bacaan PKBM</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
              </Link>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600">
            <div className="flex items-center space-x-2 font-semibold text-slate-800 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Koneksi e-Rapor Otomatis</span>
            </div>
            Nilai tugas dan CBT yang Anda masukkan akan langsung teragregasi ke dalam e-Rapor semester peserta didik.
          </div>
        </div>
      </div>
    </div>
  );
}
