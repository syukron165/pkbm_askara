"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Search,
  Calendar,
  RefreshCw,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BarChart3,
  AlertCircle,
  Star,
} from "lucide-react";

interface LMSAssignmentItem {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  isPublished: boolean;
  classId: string;
  subjectId: string;
  teacherId: string;
  teacher?: { id: string; name: string; role: string };
  class?: { id: string; name: string; level: string };
  subject?: { id: string; name: string; code: string };
  submittedCount?: number;
  gradedCount?: number;
  pendingCount?: number;
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
      <CheckCircle2 className="w-3 h-3" />Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
      <XCircle className="w-3 h-3" />Draft
    </span>
  );
}

function DueBadge({ dueDate }: { dueDate: string }) {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-medium">Lewat tenggat</span>;
  if (diffDays === 0) return <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-medium">Hari ini</span>;
  if (diffDays <= 3) return <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">{diffDays}h lagi</span>;
  return <span className="text-xs text-slate-500">{due.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>;
}

export default function AdminTugasPage() {
  const [assignments, setAssignments] = useState<LMSAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterClass) params.set("classId", filterClass);
      const res = await fetch("/api/lms/assignments?" + params.toString());
      if (!res.ok) throw new Error("Gagal memuat data tugas");
      const data = await res.json();
      let list: LMSAssignmentItem[] = data.assignments || [];
      if (filterStatus === "active") list = list.filter((a) => a.isPublished);
      if (filterStatus === "draft") list = list.filter((a) => !a.isPublished);
      if (filterStatus === "overdue") list = list.filter((a) => new Date(a.dueDate) < new Date());
      setAssignments(list);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterStatus]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const uniqueClasses = Array.from(new Map(assignments.filter((a) => a.class).map((a) => [a.classId, a.class!])).values());
  const totalActive = assignments.filter((a) => a.isPublished).length;
  const totalOverdue = assignments.filter((a) => a.isPublished && new Date(a.dueDate) < new Date()).length;
  const totalSubmitted = assignments.reduce((sum, a) => sum + (a.submittedCount || 0), 0);
  const totalGraded = assignments.reduce((sum, a) => sum + (a.gradedCount || 0), 0);
  const formatDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 px-6 pt-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pemantauan Tugas Mandiri</h1>
              <p className="text-orange-100 text-sm">Pantau seluruh tugas yang diberikan guru kepada siswa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 pb-12 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Tugas" value={assignments.length} sub="Semua kelas" icon={ClipboardList} color="bg-orange-500" />
          <StatCard label="Tugas Aktif" value={totalActive} sub="Sedang berjalan" icon={CheckCircle2} color="bg-emerald-500" />
          <StatCard label="Lewat Tenggat" value={totalOverdue} sub="Perlu perhatian" icon={AlertCircle} color="bg-red-500" />
          <StatCard label="Total Pengumpulan" value={totalSubmitted} sub={totalGraded + " sudah dinilai"} icon={Star} color="bg-violet-500" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari judul tugas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700 bg-white">
                <option value="">Semua Kelas</option>
                {uniqueClasses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700 bg-white">
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="draft">Draft</option>
                <option value="overdue">Lewat Tenggat</option>
              </select>
              <button onClick={fetchAssignments} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100 transition">
                <RefreshCw className="w-4 h-4" />Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-sm text-slate-500">Memuat data tugas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada tugas ditemukan</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div className="col-span-4">Judul Tugas</div>
              <div className="col-span-2">Kelas</div>
              <div className="col-span-2">Guru</div>
              <div className="col-span-1">Nilai Maks</div>
              <div className="col-span-2">Tenggat</div>
              <div className="col-span-1">Status</div>
            </div>
            <div className="divide-y divide-slate-50">
              {assignments.map((a) => (
                <div key={a.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 py-4 hover:bg-slate-50/60 transition">
                  <div className="md:col-span-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <ClipboardList className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{a.title}</p>
                      {a.subject && <p className="text-xs text-indigo-600 mt-0.5">{a.subject.name}</p>}
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center"><span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium"><Layers className="w-3 h-3 text-slate-400" />{a.class?.name || "-"}</span></div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"><span className="text-[10px] font-bold text-orange-700">{a.teacher?.name?.substring(0, 2).toUpperCase() || "G"}</span></div>
                    <span className="text-xs text-slate-600 font-medium truncate">{a.teacher?.name || "-"}</span>
                  </div>
                  <div className="md:col-span-1 flex items-center">
                    <span className="text-xs font-bold text-slate-700">{a.maxScore}</span>
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <DueBadge dueDate={a.dueDate} />
                  </div>
                  <div className="md:col-span-1 flex items-center"><StatusBadge published={a.isPublished} /></div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">Menampilkan {assignments.length} tugas</div>
          </div>
        )}
      </div>
    </div>
  );
}
