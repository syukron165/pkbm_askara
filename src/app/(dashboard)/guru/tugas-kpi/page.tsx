"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Target,
  Plus,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  Star,
  Calendar,
  X,
  Send,
} from "lucide-react";

const STATUS_COLUMNS = [
  { key: "TODO", label: "Akan Dikerjakan", color: "bg-slate-50", textColor: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
  { key: "IN_PROGRESS", label: "Sedang Berjalan", color: "bg-blue-50", textColor: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  { key: "UNDER_REVIEW", label: "Menunggu Review", color: "bg-amber-50", textColor: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  { key: "COMPLETED", label: "Selesai ✓", color: "bg-emerald-50", textColor: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  { key: "OVERDUE", label: "Terlambat", color: "bg-red-50", textColor: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
];

const CATEGORIES = [
  { value: "AKADEMIK", label: "Akademik" },
  { value: "ADMINISTRASI", label: "Administrasi" },
  { value: "PENGEMBANGAN_DIRI", label: "Pengembangan Diri" },
  { value: "PROGRAM_KHUSUS", label: "Program Khusus" },
  { value: "OPERASIONAL", label: "Operasional" },
];

type KpiTask = {
  id: string;
  title: string;
  description?: string;
  category: string;
  kpiWeight: number;
  kpiPeriod: string;
  status: string;
  isSelftask: boolean;
  dueDate: string;
  achievementScore?: number;
  reviewNotes?: string;
};

type Stats = {
  todo: number;
  inProgress: number;
  underReview: number;
  completed: number;
  overdue: number;
  avgScore: number;
};

export default function TugasKpiGuruPage() {
  const [tasks, setTasks] = useState<KpiTask[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "AKADEMIK",
    kpiWeight: "3",
    kpiPeriod: new Date().toISOString().slice(0, 7),
    assignedToId: "self", // will be filled with current user id server side
    dueDate: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kpi");
      const data = await res.json();
      setTasks(data.tasks || []);
      setStats(data.stats || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (taskId: string, action: string) => {
    setActionLoading(taskId + action);
    try {
      await fetch("/api/kpi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, action }),
      });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setActionLoading(""); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, kpiWeight: parseFloat(newTask.kpiWeight) }),
      });
      setShowForm(false);
      fetchData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 via-violet-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-violet-500/20 text-violet-200 border border-violet-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Tugas & KPI Saya
          </span>
          <h1 className="text-2xl font-bold">Monitoring Tugas & KPI</h1>
          <p className="mt-1 text-violet-200 text-sm">Pantau dan kelola tugas harian serta pencapaian KPI Anda</p>
        </div>
        <div className="absolute right-6 top-6 opacity-10">
          <Target className="w-24 h-24" />
        </div>
      </div>

      {/* My KPI Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Dalam Progres</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Selesai</p>
            <p className="text-3xl font-bold text-emerald-700 mt-1">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-500">Rata-rata Skor KPI</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold text-violet-700">{stats.avgScore.toFixed(1)}</p>
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            </div>
          </div>
        </div>
      )}

      {/* New Task Button */}
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition shadow-sm"
      >
        <Plus className="w-5 h-5" /> Buat Tugas Mandiri
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Tambah Tugas Mandiri</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Tugas *</label>
                <input required type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Judul tugas yang akan dikerjakan..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori KPI</label>
                  <div className="relative">
                    <select value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500">
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bobot KPI (1-10)</label>
                  <input type="number" min="1" max="10" value={newTask.kpiWeight}
                    onChange={(e) => setNewTask({ ...newTask, kpiWeight: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Periode KPI</label>
                  <input type="month" value={newTask.kpiPeriod} onChange={(e) => setNewTask({ ...newTask, kpiPeriod: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deadline *</label>
                  <input required type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3} placeholder="Jelaskan detail tugas yang akan dikerjakan..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  {submitting ? "Membuat..." : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-5 h-5 text-violet-500 animate-spin" />
          <span className="ml-2 text-sm text-slate-500">Memuat tugas...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = getTasksByStatus(col.key);
            return (
              <div key={col.key} className={`${col.color} rounded-xl border ${col.border} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className={`text-xs font-bold ${col.textColor}`}>{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${col.textColor}`}>{colTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {colTasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-white/80">
                      <h4 className="text-xs font-semibold text-slate-800 leading-tight">{task.title}</h4>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(task.dueDate).toLocaleDateString("id-ID")}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded font-medium">{task.category}</span>
                        <span className="text-[10px] font-bold text-slate-500">W:{task.kpiWeight}</span>
                      </div>
                      {task.reviewNotes && (
                        <p className="mt-1.5 text-[10px] text-orange-700 bg-orange-50 px-2 py-1 rounded">{task.reviewNotes}</p>
                      )}
                      {task.achievementScore !== null && task.achievementScore !== undefined && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-700">{task.achievementScore}/100</span>
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {col.key === "TODO" && (
                          <button onClick={() => handleAction(task.id, "START")}
                            disabled={actionLoading === task.id + "START"}
                            className="flex-1 py-1 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition">
                            Mulai
                          </button>
                        )}
                        {col.key === "IN_PROGRESS" && (
                          <button onClick={() => handleAction(task.id, "SUBMIT_REVIEW")}
                            disabled={actionLoading === task.id + "SUBMIT_REVIEW"}
                            className="flex-1 py-1 bg-amber-500 text-white text-[10px] font-bold rounded hover:bg-amber-600 transition">
                            Selesai →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 opacity-60">Kosong</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
