"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CalendarCheck,
  GraduationCap,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
} from "lucide-react";

export default function OrangTuaClubBelajarPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeetingDoc, setSelectedMeetingDoc] = useState<any | null>(null);

  const fetchChildrenClubs = useCallback(async () => {
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
    fetchChildrenClubs();
  }, [fetchChildrenClubs]);

  const childrenClubs = data?.childrenClubs || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 border border-white/15">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Monitoring Minat & Bakat Warga Belajar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Club Belajar Anak
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-2 leading-relaxed">
            Pantau aktivitas pengembangan bakat, keterampilan vokasi, karya nyata, serta tingkat kehadiran putra/putri Anda di Club Belajar PKBM Askara.
          </p>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <Trophy className="w-72 h-72" />
        </div>
      </div>

      {/* List Anak dan Club Belajarnya */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
          ))}
        </div>
      ) : childrenClubs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada data anak terhubung</h3>
          <p className="text-xs text-slate-500 mt-1">
            Data putra/putri Anda belum terhubung dengan akun ini. Hubungi administrator PKBM Askara.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {childrenClubs.map((child: any) => {
            const clubs = child.clubs || [];

            return (
              <div key={child.childId} className="space-y-4">
                {/* Child Header Strip */}
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                      {child.childName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-bold text-sm sm:text-base text-slate-900">
                        {child.childName}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>NISN: {child.nisn || "-"}</span>
                        <span>•</span>
                        <span>{child.packetType || "Pendidikan Kesetaraan"}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Mengikuti {clubs.length} Club Belajar
                  </span>
                </div>

                {/* Clubs List of Child */}
                {clubs.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-500">
                    {child.childName} belum mengikuti Club Belajar apapun saat ini.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {clubs.map((cItem: any) => {
                      const c = cItem.club;
                      const s = cItem.stats;
                      const meetings = cItem.meetings || [];

                      return (
                        <div
                          key={cItem.membershipId}
                          className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden space-y-0"
                        >
                          {/* Club Header */}
                          <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-amber-200">
                                  {c.category}
                                </span>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                                  Jabatan: {cItem.role}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-white mt-1">{c.name}</h3>
                              <p className="text-xs text-amber-200 mt-0.5">
                                Tutor Pembina: <strong>{c.mentorName}</strong> • Jadwal: <strong>{c.scheduleDay}, {c.scheduleTime}</strong>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
                              <CalendarCheck className="w-4 h-4 text-emerald-400" />
                              <div className="text-xs">
                                <span className="text-[10px] text-amber-200 block">Kehadiran Anak</span>
                                <strong className="text-white text-sm">{s.attendancePercent}%</strong>
                              </div>
                            </div>
                          </div>

                          {/* Club Body & Stats */}
                          <div className="p-6 space-y-5 text-xs">
                            {/* Deskripsi & Capaian */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Fokus Kegiatan</span>
                                <p className="text-slate-700 mt-1 leading-relaxed">{c.description || "Program pembinaan keterampilan."}</p>
                              </div>
                              {c.visionGoals && (
                                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-amber-950">
                                  <span className="text-[10px] font-bold text-amber-800 uppercase">Target Capaian & Karya</span>
                                  <p className="mt-1 leading-relaxed">{c.visionGoals}</p>
                                </div>
                              )}
                            </div>

                            {/* Attendance Breakdown */}
                            <div className="pt-2">
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                                  <span className="text-[10px] font-bold text-emerald-800 block">Hadir</span>
                                  <strong className="text-emerald-900 text-sm">{s.hadir} Sesi</strong>
                                </div>
                                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                                  <span className="text-[10px] font-bold text-blue-800 block">Izin</span>
                                  <strong className="text-blue-900 text-sm">{s.izin} Sesi</strong>
                                </div>
                                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                                  <span className="text-[10px] font-bold text-amber-800 block">Sakit</span>
                                  <strong className="text-amber-900 text-sm">{s.sakit} Sesi</strong>
                                </div>
                                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                                  <span className="text-[10px] font-bold text-rose-800 block">Alfa</span>
                                  <strong className="text-rose-900 text-sm">{s.alfa} Sesi</strong>
                                </div>
                              </div>
                            </div>

                            {/* Meeting Records */}
                            <div className="pt-2 border-t border-slate-100 space-y-2.5">
                              <h4 className="font-bold text-slate-900">Riwayat Pertemuan & Dokumentasi:</h4>
                              {meetings.length === 0 ? (
                                <p className="text-slate-400">Belum ada riwayat pertemuan.</p>
                              ) : (
                                <div className="space-y-2">
                                  {meetings.map((m: any) => (
                                    <div
                                      key={m.attendanceId}
                                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-slate-400">
                                            {new Date(m.meetingDate).toLocaleDateString("id-ID", {
                                              day: "2-digit",
                                              month: "short",
                                            })}
                                          </span>
                                          <span
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                              m.status === "HADIR"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : m.status === "IZIN"
                                                ? "bg-blue-100 text-blue-800"
                                                : m.status === "SAKIT"
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-rose-100 text-rose-800"
                                            }`}
                                          >
                                            {m.status}
                                          </span>
                                        </div>
                                        <p className="font-bold text-slate-900 text-xs mt-0.5">
                                          {m.activityTitle}
                                        </p>
                                      </div>

                                      {m.documentationUrl && (
                                        <button
                                          onClick={() => setSelectedMeetingDoc(m)}
                                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-indigo-700 hover:bg-indigo-50 font-bold flex items-center gap-1 text-[11px] shrink-0"
                                        >
                                          <ImageIcon className="w-3.5 h-3.5" />
                                          <span>Foto</span>
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
            );
          })}
        </div>
      )}

      {/* Modal Dokumentasi */}
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
