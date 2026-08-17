"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  CalendarCheck,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  GraduationCap,
  Layers,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  CheckCircle2,
  BookOpen,
  Palette,
  Camera,
} from "lucide-react";

export default function DashboardClubBelajarPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/club-belajar/summary");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const summary = data?.summary || {
    totalClubs: 0,
    activeClubs: 0,
    totalMembers: 0,
    totalMeetings: 0,
  };

  const clubs = data?.clubs || [];
  const recentMeetings = data?.recentMeetings || [];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 border border-white/15">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pusat Pengembangan Minat & Vokasi PKBM Askara</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Dashboard Club Belajar
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/90 mt-2.5 leading-relaxed">
            Pantau perkembangan komunitas belajar, keterampilan vokasi, karya nyata siswa, serta pencatatan presensi mingguan dalam satu pintu.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/club-belajar/daftar"
              className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-indigo-700" />
              <span>Kelola Club Belajar</span>
            </Link>
            <Link
              href="/admin/club-belajar/kehadiran"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20 flex items-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Presensi Pertemuan</span>
            </Link>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
          <Trophy className="w-80 h-80" />
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift transition">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3">Club Belajar Aktif</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {summary.activeClubs} <span className="text-xs font-semibold text-slate-400">Club</span>
          </p>
          <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Semua Terverifikasi</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift transition">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3">Total Anggota Siswa</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {summary.totalMembers} <span className="text-xs font-semibold text-slate-400">Siswa</span>
          </p>
          <div className="mt-2 text-[11px] text-purple-700 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Partisipasi Aktif</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3">Sesi Pertemuan Terlaksana</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {summary.totalMeetings} <span className="text-xs font-semibold text-slate-400">Sesi</span>
          </p>
          <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Dokumentasi Lengkap</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift transition">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3">Keaktifan Komunitas</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            94.8%
          </p>
          <div className="mt-2 text-[11px] text-amber-800 font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Minat & Bakat Tinggi</span>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1 & 2: Daftar Club Belajar & Agenda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Club Belajar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Daftar Club Belajar Unggulan</h2>
                <p className="text-xs text-slate-500">Kelompok minat bakat dan pelatihan keterampilan</p>
              </div>
              <Link
                href="/admin/club-belajar/daftar"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : clubs.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">Belum ada club belajar.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {clubs.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {c.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c._count?.members || 0} Siswa
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition line-clamp-1">
                      {c.name}
                    </h4>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p className="truncate">Pembina: {c.mentorName}</p>
                      <p>Jadwal: {c.scheduleDay}, {c.scheduleTime}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate">{c.location}</span>
                      <Link
                        href="/admin/club-belajar/daftar"
                        className="text-indigo-700 font-bold hover:underline shrink-0"
                      >
                        Detail →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Ingin Menambah Komunitas Baru?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Buka wadah belajar keterampilan baru untuk membekali kecakapan hidup warga belajar.
                </p>
              </div>
            </div>

            <Link
              href="/admin/club-belajar/daftar"
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shrink-0"
            >
              + Tambah Club
            </Link>
          </div>
        </div>

        {/* Kolom 3: Riwayat Sesi & Presensi Terbaru */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pertemuan Terbaru</h2>
                <p className="text-xs text-slate-500">Aktivitas & dokumentasi sesi mingguan</p>
              </div>
              <Link
                href="/admin/club-belajar/kehadiran"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                Presensi →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentMeetings.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">Belum ada sesi pertemuan tercatat.</p>
            ) : (
              <div className="space-y-3">
                {recentMeetings.map((m: any) => {
                  const hadir = m.records?.filter((r: any) => r.status === "HADIR").length || 0;

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-indigo-800 bg-indigo-100 px-2 py-0.2 rounded truncate max-w-[150px]">
                          {m.club?.name}
                        </span>
                        <span className="text-slate-400">
                          {new Date(m.meetingDate).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs text-slate-900 leading-snug">
                        {m.activityTitle}
                      </h5>

                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                        <span>Pembina: {m.club?.mentorName?.split(",")[0]}</span>
                        <span className="text-emerald-700 font-bold">
                          {hadir} Hadir
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
