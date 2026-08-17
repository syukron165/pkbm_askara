"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileCheck,
  Search,
  Calendar,
  RefreshCw,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BarChart3,
  Trophy,
  Timer,
  Target,
  Monitor,
} from "lucide-react";

interface AssessmentSession {
  id: string;
  studentId: string;
  score: number | null;
  status: string;
}

interface AssessmentItem {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  passingScore: number;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  classId: string;
  subjectId: string;
  teacherId: string;
  teacher?: { id: string; name: string; role: string };
  class?: { id: string; name: string; level: string };
  subject?: { id: string; name: string; code: string };
  questions?: { id: string }[];
  sessions?: AssessmentSession[];
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

const TYPE_LABEL: Record<string, string> = {
  PTS: "PTS",
  PAS: "PAS",
  UH: "Kuis",
  LATIHAN: "Latihan",
};

const TYPE_COLOR: Record<string, string> = {
  PTS: "bg-blue-100 text-blue-700 border-blue-200",
  PAS: "bg-purple-100 text-purple-700 border-purple-200",
  UH: "bg-green-100 text-green-700 border-green-200",
  LATIHAN: "bg-slate-100 text-slate-600 border-slate-200",
};

function AssessmentTypeBadge({ type }: { type: string }) {
  return (
    <span className={"text-xs font-semibold px-2.5 py-0.5 rounded-full border " + (TYPE_COLOR[type] || "bg-slate-100 text-slate-600 border-slate-200")}>
      {TYPE_LABEL[type] || type}
    </span>
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

export default function AdminCBTPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterClass) params.set("classId", filterClass);
      if (filterType) params.set("type", filterType);
      const res = await fetch("/api/cbt?" + params.toString());
      if (!res.ok) throw new Error("Gagal memuat data ujian CBT");
      const data = await res.json();
      let list: AssessmentItem[] = data.assessments || [];
      if (filterStatus === "active") list = list.filter((a) => a.isPublished);
      if (filterStatus === "draft") list = list.filter((a) => !a.isPublished);
      setAssessments(list);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterType, filterStatus]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const uniqueClasses = Array.from(new Map(assessments.filter((a) => a.class).map((a) => [a.classId, a.class!])).values());
  const totalActive = assessments.filter((a) => a.isPublished).length;
  const totalSessions = assessments.reduce((sum, a) => sum + (a.sessions?.length || 0), 0);
  const totalFinished = assessments.reduce((sum, a) => sum + (a.sessions?.filter((s) => s.status === "FINISHED").length || 0), 0);
  const totalQuestions = assessments.reduce((sum, a) => sum + (a.questions?.length || 0), 0);
  const formatDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const getSessionStats = (a: AssessmentItem) => {
    const total = a.sessions?.length || 0;
    const finished = a.sessions?.filter((s) => s.status === "FINISHED").length || 0;
    const inProgress = a.sessions?.filter((s) => s.status === "IN_PROGRESS").length || 0;
    const scores = (a.sessions || []).filter((s) => s.score !== null).map((s) => s.score as number);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null;
    return { total, finished, inProgress, avgScore };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 px-6 pt-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pemantauan Ujian CBT</h1>
              <p className="text-violet-200 text-sm">Pantau seluruh paket ujian CBT dan hasil pengerjaan siswa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 pb-12 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Paket Ujian" value={assessments.length} sub="Semua kelas" icon={FileCheck} color="bg-violet-500" />
          <StatCard label="Ujian Aktif" value={totalActive} sub="Dipublikasi" icon={CheckCircle2} color="bg-emerald-500" />
          <StatCard label="Total Peserta" value={totalSessions} sub={totalFinished + " selesai"} icon={Users} color="bg-blue-500" />
          <StatCard label="Total Soal" value={totalQuestions} sub="Di semua paket" icon={Target} color="bg-amber-500" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari paket ujian..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700 bg-white">
                <option value="">Semua Kelas</option>
                {uniqueClasses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700 bg-white">
                <option value="">Semua Tipe</option>
                <option value="PTS">PTS</option>
                <option value="PAS">PAS</option>
                <option value="UH">Kuis Harian</option>
                <option value="LATIHAN">Latihan</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700 bg-white">
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="draft">Draft</option>
              </select>
              <button onClick={fetchAssessments} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition">
                <RefreshCw className="w-4 h-4" />Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm text-slate-500">Memuat data ujian...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada paket ujian ditemukan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => {
              const stats = getSessionStats(a);
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Left: Title & meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <AssessmentTypeBadge type={a.type} />
                        <StatusBadge published={a.isPublished} />
                        {a.class && <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium"><Layers className="w-3 h-3" />{a.class.name}</span>}
                      </div>
                      <h3 className="font-semibold text-slate-800 text-base leading-snug">{a.title}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        {a.subject && <span className="text-indigo-600 font-medium">{a.subject.name}</span>}
                        <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{a.durationMinutes} menit</span>
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" />KKM {a.passingScore}</span>
                        <span className="flex items-center gap-1"><FileCheck className="w-3 h-3" />{a.questions?.length || 0} soal</span>
                        {a.teacher && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.teacher.name}</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Mulai: {formatDate(a.startTime)}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Selesai: {formatDate(a.endTime)}</span>
                      </div>
                    </div>

                    {/* Right: Session Stats */}
                    <div className="flex gap-3 md:shrink-0">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center min-w-[70px]">
                        <p className="text-xl font-bold text-slate-800">{stats.total}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Peserta</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center min-w-[70px]">
                        <p className="text-xl font-bold text-emerald-700">{stats.finished}</p>
                        <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wide">Selesai</p>
                      </div>
                      {stats.inProgress > 0 && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center min-w-[70px]">
                          <p className="text-xl font-bold text-blue-700">{stats.inProgress}</p>
                          <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Berlangsung</p>
                        </div>
                      )}
                      {stats.avgScore !== null && (
                        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center min-w-[70px]">
                          <p className="text-xl font-bold text-violet-700">{stats.avgScore}</p>
                          <p className="text-[10px] text-violet-400 font-medium uppercase tracking-wide">Rata-rata</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="text-center text-xs text-slate-400 pt-2">Menampilkan {assessments.length} paket ujian</div>
          </div>
        )}
      </div>
    </div>
  );
}
