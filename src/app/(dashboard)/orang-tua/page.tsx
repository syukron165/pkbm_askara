"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Sparkles,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface ChildData {
  id: string;
  name: string;
  email: string;
  phone: string;
  nisn: string;
  nik: string;
  packetType: string;
  studyModel: string;
  status: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  address: string;
  avatarUrl: string | null;
  className: string;
  homeroomTeacher: string;
  academicYear: string;
  semester: string;
  stats: {
    attendanceRate: string;
    totalMeetings: number;
    presentCount: number;
    izinCount: number;
    sakitCount: number;
    alpaCount: number;
    averageGrade: string;
    gradedTasksCount: number;
    cbtCompletedCount: number;
    clubCount: number;
    reportCardAvailable: boolean;
  };
  recentGrades: Array<{
    id: string;
    type: string;
    subject: string;
    title: string;
    grade: number;
    date: string;
  }>;
  attendanceLogs: Array<{
    id: string;
    date: string;
    time: string;
    status: string;
    method: string;
  }>;
  clubs: Array<{
    id: string;
    name: string;
    category: string;
    schedule?: string;
    mentor?: string;
    role?: string;
  }>;
  reportCards: Array<{
    id: string;
    academicYear: string;
    semester: string;
    status: string;
    ranking?: number;
    gpa?: number;
  }>;
}

export default function OrangTuaDashboardPage() {
  const [data, setData] = useState<{ parent: any; children: ChildData[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const fetchParentData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parents/my-children");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load parent dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParentData();
  }, [fetchParentData]);

  const parent = data?.parent;
  const children = data?.children || [];
  const activeChild = children[selectedChildIndex] || children[0];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Wali Santri / Siswa PKBM Askara</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, Bapak/Ibu {parent?.name || "Orang Tua"}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Pantau perkembangan akademik, presensi harian, nilai tugas, rapor semester, serta administrasi keuangan putra/putri Anda secara transparan.
            </p>
          </div>

          <button
            onClick={fetchParentData}
            className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition backdrop-blur-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* No Children Fallback */}
      {children.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Belum Ada Data Siswa Tertaut
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Akun Orang Tua Anda belum terhubung dengan data siswa di database PKBM Askara. Silakan hubungi bagian Tata Usaha / Admin sekolah untuk menautkan NISN putra/putri Anda.
          </p>
          <div className="pt-2">
            <Link
              href="/orang-tua/aspirasi"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition"
            >
              <span>Hubungi Admin Sekolah</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Multi-Child Selector Tabs */}
          {children.length > 1 && (
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Pilih Putra / Putri ({children.length}):
              </span>
              {children.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChildIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    selectedChildIndex === idx
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-80 font-normal">({c.packetType})</span>
                </button>
              ))}
            </div>
          )}

          {/* Child Profile Showcase Card */}
          {activeChild && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                    {activeChild.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        {activeChild.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        STATUS: {activeChild.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {activeChild.packetType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span><strong>NISN:</strong> {activeChild.nisn}</span>
                      <span><strong>NIK:</strong> {activeChild.nik}</span>
                      <span><strong>Rombel / Kelas:</strong> {activeChild.className}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/orang-tua/rapor"
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>e-Rapor Digital</span>
                  </Link>
                  <Link
                    href="/orang-tua/presensi"
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Presensi Lengkap</span>
                  </Link>
                </div>
              </div>

              {/* Detailed Child Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Wali Kelas / Tutor:</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{activeChild.homeroomTeacher}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Model Pembelajaran:</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{activeChild.studyModel}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Tahun Ajaran Aktif:</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{activeChild.academicYear} ({activeChild.semester})</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Tempat, Tanggal Lahir:</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{activeChild.birthPlace}, {activeChild.birthDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Real Dynamically Computed Stats */}
          {activeChild && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Persentase Kehadiran"
                value={activeChild.stats.attendanceRate}
                subtitle={`${activeChild.stats.presentCount} Hadir | ${activeChild.stats.izinCount} Izin | ${activeChild.stats.alpaCount} Alpa`}
                icon={CalendarCheck}
                colorTheme="emerald"
              />
              <StatCard
                title="Rata-Rata Nilai Tugas"
                value={activeChild.stats.averageGrade}
                subtitle={`${activeChild.stats.gradedTasksCount} Tugas LMS Dinilai`}
                icon={BookOpen}
                colorTheme="blue"
              />
              <StatCard
                title="Ujian CBT Terselesaikan"
                value={String(activeChild.stats.cbtCompletedCount)}
                subtitle="Asesmen Digital Mandiri"
                icon={Award}
                colorTheme="amber"
              />
              <StatCard
                title="Club Belajar Aktif"
                value={`${activeChild.stats.clubCount} Club`}
                subtitle="Minat & Keterampilan Vokasi"
                icon={Sparkles}
                colorTheme="indigo"
              />
            </div>
          )}

          {/* Academic & Attendance Tables */}
          {activeChild && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Grades Table */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      Perkembangan Nilai Tugas & Ujian
                    </h3>
                    <p className="text-xs text-slate-500">
                      Capaian riil pada LMS & CBT {activeChild.name}
                    </p>
                  </div>
                  <Link
                    href="/orang-tua/nilai"
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {activeChild.recentGrades.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">Belum ada tugas atau ujian yang dinilai untuk siswa ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 font-semibold border-b border-slate-100">
                          <th className="pb-3 font-semibold">Mata Pelajaran</th>
                          <th className="pb-3 font-semibold">Jenis Tugas / Ujian</th>
                          <th className="pb-3 font-semibold">Tanggal</th>
                          <th className="pb-3 font-semibold text-right">Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeChild.recentGrades.map((grade) => (
                          <tr key={grade.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 font-bold text-slate-800">{grade.subject}</td>
                            <td className="py-3 text-slate-600">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mr-1.5">
                                {grade.type}
                              </span>
                              {grade.title}
                            </td>
                            <td className="py-3 text-slate-500">{grade.date}</td>
                            <td className="py-3 text-right">
                              <span className="inline-block px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-100 text-emerald-800">
                                {grade.grade} / 100
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sidebar: Attendance Recents & Quick Shortcuts */}
              <div className="space-y-6">
                {/* Attendance Mini Recents */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      Presensi Terkini
                    </h3>
                    <Link
                      href="/orang-tua/presensi"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Rekap
                    </Link>
                  </div>

                  {activeChild.attendanceLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Belum ada catatan presensi terekam.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeChild.attendanceLogs.slice(0, 4).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{log.date}</p>
                            <p className="text-[10px] text-slate-400">{log.method} • {log.time}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === "PRESENT" || log.status === "HADIR"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.status === "EXCUSED" || log.status === "IZIN"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Portals Links */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 p-6 space-y-3">
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Layanan Terintegrasi
                  </h3>

                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      href="/orang-tua/keuangan"
                      className="p-3 bg-white hover:bg-amber-100/50 border border-amber-200/80 rounded-2xl flex items-center justify-between transition group text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-slate-800">Status Iuran & SPP</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition" />
                    </Link>

                    <Link
                      href="/orang-tua/tabungan"
                      className="p-3 bg-white hover:bg-amber-100/50 border border-amber-200/80 rounded-2xl flex items-center justify-between transition group text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-800">Tabungan Belajar Siswa</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition" />
                    </Link>

                    <Link
                      href="/orang-tua/club-belajar"
                      className="p-3 bg-white hover:bg-amber-100/50 border border-amber-200/80 rounded-2xl flex items-center justify-between transition group text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-800">Club Minat & Vokasi</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
