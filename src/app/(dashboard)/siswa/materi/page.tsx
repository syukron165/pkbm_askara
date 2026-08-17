"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Download,
  FileText,
  Video,
  ArrowRight,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";

interface LMSMaterialItem {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  fileUrl: string | null;
  videoUrl: string | null;
  isPublished: boolean;
  class?: { id: string; name: string; level: string };
  subject?: { id: string; name: string; code: string };
  teacher?: { id: string; name: string; role: string };
  createdAt: string;
}

export default function SiswaMateriPage() {
  const [materials, setMaterials] = useState<LMSMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<LMSMaterialItem | null>(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await fetch(`/api/lms/materials?${params.toString()}`);
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch {
      setMaterials([]);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Portal Belajar Daring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Materi Pembelajaran LMS
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Pelajari modul ajar mandiri, ringkasan konsep, dan video pembelajaran yang telah diunggah oleh guru kesetaraan Anda.
            </p>
          </div>

          <button
            onClick={fetchMaterials}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-500 self-start sm:self-auto shrink-0 flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari judul materi, mata pelajaran, atau topik bahasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Grid Materi */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Belum ada materi pembelajaran</h3>
          <p className="text-xs text-slate-500 mt-1">
            Materi ajar yang diunggah oleh guru akan tampil di halaman ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift flex flex-col justify-between transition group hover:border-indigo-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {m.subject?.name || "Mata Pelajaran"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {m.class?.name || "Rombel"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3 line-clamp-2 leading-snug group-hover:text-indigo-800 transition">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Tutor: {m.teacher?.name || "Pendidik"}
                </p>

                {m.description && (
                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {m.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {m.fileUrl && (
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Modul PDF</span>
                    </a>
                  )}
                  {m.videoUrl && (
                    <a
                      href={m.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video</span>
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setSelectedMaterial(m)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                >
                  <span>Pelajari</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Baca Materi Lengkap */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedMaterial.subject?.name} • {selectedMaterial.class?.name}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedMaterial.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-800">
              {selectedMaterial.description && (
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-indigo-900">
                  <p className="font-semibold text-xs mb-0.5">Tujuan & Ringkasan Pembelajaran:</p>
                  <p>{selectedMaterial.description}</p>
                </div>
              )}

              {selectedMaterial.content ? (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Rangkuman Materi:</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-line text-slate-700">
                    {selectedMaterial.content}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  Silakan unduh atau buka berkas modul pembelajaran di bawah ini untuk membaca isi materi selengkapnya.
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                {selectedMaterial.fileUrl && (
                  <a
                    href={selectedMaterial.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Berkas Modul PDF</span>
                  </a>
                )}
                {selectedMaterial.videoUrl && (
                  <a
                    href={selectedMaterial.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow-xs"
                  >
                    <Video className="w-4 h-4" />
                    <span>Buka Video Pembelajaran</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
