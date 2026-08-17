"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  LayoutGrid,
  List,
  Video,
  FileText,
  Calendar,
  RefreshCw,
  BookMarked,
  Layers,
  CheckCircle2,
  XCircle,
  Award,
} from "lucide-react";

interface LMSMaterialItem {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  fileUrl: string | null;
  videoUrl: string | null;
  isPublished: boolean;
  classId: string;
  subjectId: string;
  teacherId: string;
  teacher?: { id: string; name: string; role: string };
  class?: { id: string; name: string; level: string };
  subject?: { id: string; name: string; code: string };
  createdAt: string;
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string; }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      <div className={"w-12 h-12 rounded-xl flex items-center justify-center " + color}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" />
      Dipublikasi
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <XCircle className="w-3 h-3" />
      Draft
    </span>
  );
}

export default function AdminLMSPage() {
  const [materials, setMaterials] = useState<LMSMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterClass) params.set("classId", filterClass);
      if (filterSubject) params.set("subjectId", filterSubject);
      const res = await fetch("/api/lms/materials?" + params.toString());
      if (!res.ok) throw new Error("Gagal memuat data materi");
      const data = await res.json();
      let list: LMSMaterialItem[] = data.materials || [];
      if (filterStatus === "published") list = list.filter((m) => m.isPublished);
      if (filterStatus === "draft") list = list.filter((m) => !m.isPublished);
      setMaterials(list);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterSubject, filterStatus]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const uniqueClasses = Array.from(new Map(materials.filter((m) => m.class).map((m) => [m.classId, m.class!])).values());
  const uniqueSubjects = Array.from(new Map(materials.filter((m) => m.subject).map((m) => [m.subjectId, m.subject!])).values());
  const totalPublished = materials.filter((m) => m.isPublished).length;
  const totalDraft = materials.filter((m) => !m.isPublished).length;
  const totalVideo = materials.filter((m) => m.videoUrl).length;
  const totalFile = materials.filter((m) => m.fileUrl).length;
  const formatDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 pt-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pemantauan LMS Materi</h1>
              <p className="text-blue-200 text-sm">Pantau seluruh materi pembelajaran yang diterbitkan guru</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 pb-12 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Materi" value={materials.length} sub="Semua kelas" icon={BookOpen} color="bg-blue-500" />
          <StatCard label="Dipublikasi" value={totalPublished} sub="Aktif & terlihat siswa" icon={CheckCircle2} color="bg-emerald-500" />
          <StatCard label="Draft" value={totalDraft} sub="Belum dipublikasi" icon={Award} color="bg-amber-500" />
          <StatCard label="Materi Video" value={totalVideo} sub={totalFile + " berkas file"} icon={Video} color="bg-violet-500" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari judul materi..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 bg-white">
                <option value="">Semua Kelas</option>
                {uniqueClasses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 bg-white">
                <option value="">Semua Mapel</option>
                {uniqueSubjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 bg-white">
                <option value="">Semua Status</option>
                <option value="published">Dipublikasi</option>
                <option value="draft">Draft</option>
              </select>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                <button onClick={() => setViewMode("list")} className={"px-3 py-2.5 text-sm transition " + (viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50")}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("grid")} className={"px-3 py-2.5 text-sm transition " + (viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50")}><LayoutGrid className="w-4 h-4" /></button>
              </div>
              <button onClick={fetchMaterials} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition">
                <RefreshCw className="w-4 h-4" />Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-slate-500">Memuat data materi...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada materi ditemukan</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div className="col-span-4">Judul Materi</div>
              <div className="col-span-2">Kelas</div>
              <div className="col-span-2">Mata Pelajaran</div>
              <div className="col-span-2">Guru</div>
              <div className="col-span-1">Tipe</div>
              <div className="col-span-1">Status</div>
            </div>
            <div className="divide-y divide-slate-50">
              {materials.map((m) => (
                <div key={m.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 py-4 hover:bg-slate-50/60 transition">
                  <div className="md:col-span-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      {m.videoUrl ? <Video className="w-4 h-4 text-blue-600" /> : m.fileUrl ? <FileText className="w-4 h-4 text-blue-600" /> : <BookMarked className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{m.title}</p>
                      {m.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{m.description}</p>}
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(m.createdAt)}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center"><span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium"><Layers className="w-3 h-3 text-slate-400" />{m.class?.name || "-"}</span></div>
                  <div className="md:col-span-2 flex items-center"><span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg font-medium">{m.subject?.name || "-"}</span></div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><span className="text-[10px] font-bold text-emerald-700">{m.teacher?.name?.substring(0, 2).toUpperCase() || "G"}</span></div>
                    <span className="text-xs text-slate-600 font-medium truncate">{m.teacher?.name || "-"}</span>
                  </div>
                  <div className="md:col-span-1 flex items-center"><span className="text-xs text-slate-500">{m.videoUrl ? "Video" : m.fileUrl ? "Berkas" : "Teks"}</span></div>
                  <div className="md:col-span-1 flex items-center"><StatusBadge published={m.isPublished} /></div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">Menampilkan {materials.length} materi</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    {m.videoUrl ? <Video className="w-5 h-5 text-blue-600" /> : m.fileUrl ? <FileText className="w-5 h-5 text-blue-600" /> : <BookMarked className="w-5 h-5 text-blue-600" />}
                  </div>
                  <StatusBadge published={m.isPublished} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{m.title}</h3>
                  {m.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {m.class && <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{m.class.name}</span>}
                  {m.subject && <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium border border-indigo-100">{m.subject.name}</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"><span className="text-[9px] font-bold text-emerald-700">{m.teacher?.name?.substring(0, 2).toUpperCase() || "G"}</span></div>
                    <span className="text-xs text-slate-500 truncate max-w-[100px]">{m.teacher?.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatDate(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
