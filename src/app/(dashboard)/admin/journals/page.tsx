"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookMarked,
  Search,
  Calendar,
  Users,
  Image as ImageIcon,
  Video,
  Play,
  Maximize2,
  X,
  Filter,
  RefreshCw,
  Clock,
  Layers,
  GraduationCap,
  Sparkles,
} from "lucide-react";

interface TeacherJournal {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  date: string;
  topic: string;
  activities: string;
  notes: string | null;
  studentAttendanceCount: number;
  documentationUrl: string | null;
  mediaType: string | null;
  teacher?: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  };
  class?: {
    id: string;
    name: string;
    level: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
}

export default function AdminJournalsPage() {
  const [journals, setJournals] = useState<TeacherJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: string;
    title: string;
  } | null>(null);

  const fetchJournals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await fetch(`/api/journals?${params.toString()}`);
      const data = await res.json();
      setJournals(data.journals || []);
    } catch {
      setJournals([]);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const totalPhotos = journals.filter(
    (j) => j.documentationUrl && (j.mediaType === "IMAGE" || !j.mediaType?.includes("VIDEO"))
  ).length;

  const totalVideos = journals.filter(
    (j) => j.documentationUrl && (j.mediaType === "VIDEO" || j.documentationUrl.match(/\.(mp4|webm|mov)$/i))
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <BookMarked className="w-4 h-4" />
              <span>Supervisi Akademik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Rekapitulasi Jurnal Mengajar & Dokumentasi Kelas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
              Pantau materi pembelajaran harian, keaktifan warga belajar, serta dokumentasi foto dan video kegiatan belajar dari seluruh tutor PKBM Askara.
            </p>
          </div>

          <button
            onClick={fetchJournals}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-500 self-start sm:self-auto shrink-0 flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-slate-500">Total Jurnal Sesi</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{journals.length} Sesi</p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-emerald-800">Dokumentasi Foto</p>
            <p className="text-base sm:text-lg font-bold text-emerald-900 mt-0.5">{totalPhotos} Foto</p>
          </div>
          <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-blue-800">Dokumentasi Video</p>
            <p className="text-base sm:text-lg font-bold text-blue-900 mt-0.5">{totalVideos} Rekaman</p>
          </div>
          <div className="bg-purple-50/60 border border-purple-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-purple-800">Tingkat Kehadiran</p>
            <p className="text-base sm:text-lg font-bold text-purple-900 mt-0.5">Tercatat Lengkap</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama tutor, topik bahasan, mata pelajaran, atau aktivitas kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* List Rekap Jurnal */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
            ))}
          </div>
        ) : journals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-soft">
            <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Belum ada data jurnal mengajar</h3>
            <p className="text-xs text-slate-500 mt-1">
              Catatan jurnal yang diisi oleh para tutor akan otomatis tampil di halaman supervisi ini.
            </p>
          </div>
        ) : (
          journals.map((j) => {
            const isVideo = j.mediaType === "VIDEO" || j.documentationUrl?.match(/\.(mp4|webm|mov)$/i);
            const teacherName = j.teacher?.name || "Tutor PKBM Askara";

            return (
              <div
                key={j.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft hover-lift space-y-4 transition"
              >
                {/* Header: Mapel, Rombel, Tanggal */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {j.subject?.name || "Mata Pelajaran"}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      {j.class?.name || "Rombel"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(j.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                  <div className="md:col-span-2 space-y-2.5">
                    <h3 className="text-base font-bold text-slate-900">{j.topic}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      {j.activities}
                    </p>
                    {j.notes && (
                      <p className="text-[11px] text-slate-500 font-medium">
                        Catatan Sesi: {j.notes}
                      </p>
                    )}
                  </div>

                  {/* Dokumentasi Media Box */}
                  <div className="md:col-span-1">
                    {j.documentationUrl ? (
                      <div
                        onClick={() =>
                          setSelectedMedia({
                            url: j.documentationUrl!,
                            type: isVideo ? "VIDEO" : "IMAGE",
                            title: `${j.topic} — ${teacherName}`,
                          })
                        }
                        className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer shadow-xs max-h-40 flex items-center justify-center"
                      >
                        {isVideo ? (
                          <div className="relative w-full h-36 bg-slate-900 flex items-center justify-center">
                            <video
                              src={j.documentationUrl}
                              className="w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white group-hover:bg-black/20 transition">
                              <div className="w-10 h-10 rounded-full bg-emerald-600/90 flex items-center justify-center shadow-lg">
                                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                              </div>
                              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">
                                Putar Rekaman Video
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-36">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={j.documentationUrl}
                              alt="Dokumentasi Kelas"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <span className="text-xs font-bold flex items-center gap-1 bg-black/60 px-3 py-1.5 rounded-lg">
                                <Maximize2 className="w-3.5 h-3.5" /> Perbesar Foto
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                        <span>Tidak ada dokumentasi</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Teacher Name & Students Count */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                      {teacherName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-800">{teacherName}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                      Pendidik
                    </span>
                  </div>

                  <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {j.studentAttendanceCount} Warga Belajar Hadir
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* MEDIA MODAL POPUP (ZOOM PHOTO / PLAY VIDEO)                  */}
      {/* ============================================================ */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <h3 className="text-sm font-bold truncate max-w-lg">{selectedMedia.title}</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[80vh]">
              {selectedMedia.type === "VIDEO" ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-full object-contain rounded-lg"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title}
                  className="max-h-[70vh] w-full object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
