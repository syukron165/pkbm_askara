"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  CalendarCheck,
  GraduationCap,
  Layers,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  PlusCircle,
  LogOut,
  Eye,
  Search,
} from "lucide-react";

export default function SiswaClubBelajarPage() {
  const [activeTab, setActiveTab] = useState<"MY_CLUBS" | "EXPLORE">("MY_CLUBS");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchExplore, setSearchExplore] = useState("");
  const [selectedMeetingDoc, setSelectedMeetingDoc] = useState<any | null>(null);

  const fetchMyClubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/club-belajar/my-clubs");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMyClubs();
  }, [fetchMyClubs]);

  // Join Club
  const handleJoinClub = async (clubId: string, clubName: string) => {
    if (!confirm(`Gabung dan daftarkan diri ke ${clubName}?`)) return;
    setActionLoading(clubId);
    try {
      const res = await fetch("/api/club-belajar/my-clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });
      const json = await res.json();
      if (res.ok) {
        alert("🎉 Selamat! Anda telah resmi terdaftar di " + clubName);
        fetchMyClubs();
        setActiveTab("MY_CLUBS");
      } else {
        alert(json.error || "Gagal bergabung ke club");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Leave Club
  const handleLeaveClub = async (membershipId: string, clubName: string) => {
    if (!confirm(`Yakin ingin membatalkan keikutsertaan dari ${clubName}?`)) return;
    setActionLoading(membershipId);
    try {
      const res = await fetch(`/api/club-belajar/my-clubs?membershipId=${membershipId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Anda telah keluar dari " + clubName);
        fetchMyClubs();
      }
    } catch {}
    setActionLoading(null);
  };

  const myClubs = data?.myClubs || [];
  const availableClubs = (data?.availableClubs || []).filter((c: any) => {
    if (!searchExplore) return true;
    const q = searchExplore.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.mentorName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 border border-white/15">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pemberdayaan Bakat & Keterampilan Vokasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Club Belajar Siswa
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/90 mt-2 leading-relaxed">
            Ikuti kelompok peminatan robotika, barista, desain grafis, bahasa, dan seni untuk mengasah keahlian praktis serta sertifikasi kompetensi.
          </p>

          {/* Navigation Tabs */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab("MY_CLUBS")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "MY_CLUBS"
                  ? "bg-white text-indigo-950 shadow-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Trophy className="w-4 h-4 text-indigo-600" />
              <span>Club yang Saya Ikuti ({myClubs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("EXPLORE")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "EXPLORE"
                  ? "bg-white text-indigo-950 shadow-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <PlusCircle className="w-4 h-4 text-amber-500" />
              <span>Jelajahi & Daftar Club Baru ({availableClubs.length})</span>
            </button>
          </div>
        </div>

        {/* Background icon */}
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <Trophy className="w-72 h-72" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: CLUB YANG SAYA IKUTI & REKAP KEHADIRAN                */}
      {/* ============================================================ */}
      {activeTab === "MY_CLUBS" && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
              ))}
            </div>
          ) : myClubs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft space-y-3">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Anda belum bergabung di Club Belajar</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pilih dan daftarkan diri Anda pada program vokasi atau minat bakat yang Anda sukai di tab &quot;Jelajahi & Daftar Club Baru&quot;.
              </p>
              <button
                onClick={() => setActiveTab("EXPLORE")}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>Lihat Pilihan Club Belajar</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {myClubs.map((item: any) => {
                const c = item.club;
                const s = item.stats;
                const meetings = item.meetings || [];

                return (
                  <div
                    key={item.membershipId}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden transition space-y-0"
                  >
                    {/* Top Club Header */}
                    <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 border border-indigo-400/40 text-white flex items-center justify-center font-bold text-lg shrink-0">
                          <Trophy className="w-6 h-6 text-amber-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-indigo-200">
                              {c.category}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                              Peran: {item.role}
                            </span>
                          </div>
                          <h2 className="text-lg sm:text-xl font-bold mt-1 text-white">{c.name}</h2>
                          <p className="text-xs text-indigo-200 mt-0.5">
                            Pembina: <strong>{c.mentorName}</strong> • Jadwal: <strong>{c.scheduleDay}, {c.scheduleTime}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Leave Club Button */}
                      <button
                        onClick={() => handleLeaveClub(item.membershipId, c.name)}
                        disabled={actionLoading === item.membershipId}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1.5 self-start sm:self-center border border-rose-400/30"
                      >
                        {actionLoading === item.membershipId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                        <span>Keluar Club</span>
                      </button>
                    </div>

                    {/* Middle Section: Attendance KPI & Overview */}
                    <div className="p-6 space-y-6">
                      {/* Visi & Deskripsi */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Fokus & Keterampilan Club
                          </span>
                          <p className="text-slate-700 leading-relaxed">
                            {c.description || "Program pembinaan keterampilan dan karya kreatif warga belajar."}
                          </p>
                        </div>

                        {c.visionGoals && (
                          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-1 text-indigo-950">
                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                              Target Capaian & Portofolio
                            </span>
                            <p className="leading-relaxed">{c.visionGoals}</p>
                          </div>
                        )}
                      </div>

                      {/* Statistik Kehadiran Saya */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <CalendarCheck className="w-4 h-4 text-indigo-600" />
                            <span>Rekap Kehadiran Saya ({s.totalMeetings} Sesi Terlaksana)</span>
                          </h3>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Persentase Kehadiran:</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                              {s.attendancePercent}%
                            </span>
                          </div>
                        </div>

                        {/* 4 Attendance Badge counters */}
                        <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                            <span className="text-[10px] font-bold text-emerald-800 block">Hadir</span>
                            <strong className="text-emerald-900 text-base">{s.hadir} Sesi</strong>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <span className="text-[10px] font-bold text-blue-800 block">Izin</span>
                            <strong className="text-blue-900 text-base">{s.izin} Sesi</strong>
                          </div>
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                            <span className="text-[10px] font-bold text-amber-800 block">Sakit</span>
                            <strong className="text-amber-900 text-base">{s.sakit} Sesi</strong>
                          </div>
                          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                            <span className="text-[10px] font-bold text-rose-800 block">Alfa</span>
                            <strong className="text-rose-900 text-base">{s.alfa} Sesi</strong>
                          </div>
                        </div>
                      </div>

                      {/* Riwayat Sesi & Dokumentasi Kegiatan */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-800">
                          Riwayat Pertemuan & Dokumentasi Kegiatan:
                        </h4>

                        {meetings.length === 0 ? (
                          <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                            Belum ada riwayat pertemuan tercatat untuk club ini.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {meetings.map((m: any) => (
                              <div
                                key={m.attendanceId}
                                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {new Date(m.meetingDate).toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        m.myStatus === "HADIR"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : m.myStatus === "IZIN"
                                          ? "bg-blue-100 text-blue-800"
                                          : m.myStatus === "SAKIT"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-rose-100 text-rose-800"
                                      }`}
                                    >
                                      Status: {m.myStatus}
                                    </span>
                                  </div>

                                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {m.activityTitle}
                                  </p>

                                  {m.notes && (
                                    <p className="text-slate-600 line-clamp-1">{m.notes}</p>
                                  )}
                                </div>

                                {m.documentationUrl && (
                                  <button
                                    onClick={() => setSelectedMeetingDoc(m)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition text-xs shrink-0"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>Foto Sesi</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: JELAJAHI & DAFTAR CLUB BELAJAR BARU                   */}
      {/* ============================================================ */}
      {activeTab === "EXPLORE" && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari club vokasi, robotik, tata boga, barista, bahasa Inggris, atau pembina..."
                value={searchExplore}
                onChange={(e) => setSearchExplore(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          {availableClubs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {searchExplore ? "Tidak ada club yang cocok" : "Anda sudah mengikuti semua club yang tersedia!"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kunjungi tab &quot;Club yang Saya Ikuti&quot; untuk melihat jadwal dan perkembangan sesi Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {availableClubs.map((club: any) => {
                const memberCount = club._count?.members || 0;
                const isFull = memberCount >= club.maxMembers;

                return (
                  <div
                    key={club.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-soft hover-lift flex flex-col justify-between overflow-hidden transition group"
                  >
                    <div>
                      {/* Card Header Banner */}
                      <div className="h-28 bg-gradient-to-r from-indigo-800 to-purple-900 p-4 flex flex-col justify-between text-white relative">
                        {club.coverImage && (
                          <img
                            src={club.coverImage}
                            alt={club.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition"
                          />
                        )}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/90 text-slate-900">
                            {club.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white">
                            {memberCount} / {club.maxMembers} Anggota
                          </span>
                        </div>

                        <h3 className="relative z-10 text-sm sm:text-base font-bold text-white leading-snug">
                          {club.name}
                        </h3>
                      </div>

                      {/* Body Info */}
                      <div className="p-5 space-y-3 text-xs">
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {club.description || "Program pembinaan keterampilan terarah dan pengembangan potensi karya siswa."}
                        </p>

                        <div className="space-y-1.5 text-slate-600 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Pembina: <strong>{club.mentorName}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Jadwal: <strong>{club.scheduleDay}, {club.scheduleTime}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Lokasi: {club.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Join Button */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={() => handleJoinClub(club.id, club.name)}
                        disabled={isFull || actionLoading === club.id}
                        className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        {actionLoading === club.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PlusCircle className="w-4 h-4 text-amber-300" />
                        )}
                        <span>{isFull ? "Kuota Penuh" : "Gabung & Ikuti Club Ini"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL PRATINJAU DOKUMENTASI SESI                            */}
      {/* ============================================================ */}
      {selectedMeetingDoc && (
        <div
          onClick={() => setSelectedMeetingDoc(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl bg-white p-4 rounded-2xl shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-xs text-slate-900">{selectedMeetingDoc.activityTitle}</h4>
              <button
                onClick={() => setSelectedMeetingDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={selectedMeetingDoc.documentationUrl}
              alt="Dokumentasi Pertemuan"
              className="max-h-[70vh] rounded-xl object-contain mx-auto"
            />
            {selectedMeetingDoc.notes && (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                &quot;{selectedMeetingDoc.notes}&quot;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
