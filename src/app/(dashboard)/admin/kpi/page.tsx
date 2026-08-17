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
  Eye,
  Star,
  BarChart3,
  Calendar,
  Users,
  Award,
  ArrowRight,
  X,
} from "lucide-react";

const STATUS_COLUMNS = [
  { key: "TODO", label: "Akan Dikerjakan", color: "bg-slate-100", textColor: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
  { key: "IN_PROGRESS", label: "Sedang Berjalan", color: "bg-blue-50", textColor: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  { key: "UNDER_REVIEW", label: "Menunggu Review", color: "bg-amber-50", textColor: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  { key: "COMPLETED", label: "Selesai", color: "bg-emerald-50", textColor: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  { key: "OVERDUE", label: "Terlambat", color: "bg-red-50", textColor: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
];

const CATEGORIES = ["AKADEMIK", "ADMINISTRASI", "PENGEMBANGAN_DIRI", "PROGRAM_KHUSUS", "OPERASIONAL"];

type KpiTask = {
  id: string;
  title: string;
  description?: string;
  category: string;
  kpiWeight: number;
  kpiPeriod: string;
  status: string;
  assignedToId: string;
  assignedById?: string;
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

type Assignee = {
  id: string;
  name: string;
  role: string;
  email?: string;
};

export default function KpiAdminPage() {
  const [tasks, setTasks] = useState<KpiTask[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [periods, setPeriods] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<{ manajemen: Assignee[]; guru: Assignee[] }>({
    manajemen: [
      { id: "mgt-1", name: "Dra. Hj. Siti Aminah, M.Pd.", role: "Kepala PKBM / Penanggung Jawab" },
      { id: "mgt-2", name: "Administrator Utama", role: "Super Admin Sistem" },
      { id: "mgt-3", name: "Drs. Hendra Gunawan", role: "Wakil Kepala PKBM & Kurikulum" },
      { id: "mgt-4", name: "Rina Marlina, S.Sos.", role: "Kepala Tata Usaha & Administrasi" },
      { id: "mgt-5", name: "Maya Indriani, S.E.", role: "Bendahara & Tim Keuangan" },
      { id: "mgt-6", name: "Bayu Pratama, S.Kom.", role: "Operator Dapodik & IT Support" },
      { id: "mgt-7", name: "Ahmad Fauzan, S.Pd.", role: "Koordinator Kesiswaan & Club Belajar" },
      { id: "mgt-8", name: "Dewi Anggraini, S.Kom.", role: "Koordinator Sarpras & Lab Vokasi" },
    ],
    guru: [
      { id: "t-1", name: "Drs. Hendra Gunawan", role: "Tutor Matematika & IPA (Paket C)" },
      { id: "t-2", name: "Nurul Aini, S.Pd.", role: "Tutor Bahasa Indonesia (Paket B & C)" },
      { id: "t-3", name: "Bambang Sutrisno, M.Si.", role: "Tutor IPA & Sains (Paket A & B)" },
      { id: "t-4", name: "Dewi Anggraini, S.Kom.", role: "Instruktur Vokasi & Keterampilan" },
      { id: "t-5", name: "Bayu Pratama, S.Kom.", role: "Instruktur Multimedia & Desain Grafis" },
      { id: "t-6", name: "Siti Rahmawati, S.Pd.", role: "Tutor IPS & Humaniora (Paket B & C)" },
      { id: "t-7", name: "Rahmat Hidayat, S.Pd.I.", role: "Tutor Pend. Agama & Budi Pekerti" },
      { id: "t-8", name: "Farida Hanum, S.Pd.", role: "Tutor Bahasa Inggris (Paket B & C)" },
      { id: "t-9", name: "Arif Kurniawan, S.Pd.", role: "Tutor PKn & Kebangsaan" },
    ],
  });

  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ task: KpiTask; action: "APPROVE_COMPLETE" | "REJECT_REVIEW" } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewScore, setReviewScore] = useState("80");
  const [actionLoading, setActionLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "AKADEMIK",
    kpiWeight: "3",
    kpiPeriod: new Date().toISOString().slice(0, 7),
    assignedToId: "mgt-1",
    dueDate: "",
  });

  const getAssigneeName = (assignedToId: string) => {
    const all = [...assignees.manajemen, ...assignees.guru];
    const found = all.find((a) => a.id === assignedToId);
    return found ? `${found.name} (${found.role})` : assignedToId || "Belum Ditugaskan";
  };

  const getAssigneeShortName = (assignedToId: string) => {
    const all = [...assignees.manajemen, ...assignees.guru];
    const found = all.find((a) => a.id === assignedToId);
    return found ? found.name : assignedToId || "Staf PKBM";
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPeriod) params.set("period", selectedPeriod);
      const res = await fetch(`/api/kpi?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      setStats(data.stats || null);
      setPeriods(data.periods || []);
      if (data.assignees) {
        setAssignees(data.assignees);
        if (data.assignees.manajemen?.length > 0 && !newTask.assignedToId) {
          setNewTask((prev) => ({ ...prev, assignedToId: data.assignees.manajemen[0].id }));
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedPeriod, newTask.assignedToId]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setActionLoading(true);
    try {
      await fetch("/api/kpi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewModal.task.id,
          action: reviewModal.action,
          reviewNotes,
          achievementScore: reviewModal.action === "APPROVE_COMPLETE" ? parseFloat(reviewScore) : undefined,
        }),
      });
      setReviewModal(null);
      setReviewNotes("");
      fetchData();
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          kpiWeight: parseFloat(newTask.kpiWeight) || 1,
          assignedToId: newTask.assignedToId || assignees.manajemen[0]?.id || "mgt-1",
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setNewTask({
          title: "",
          description: "",
          category: "AKADEMIK",
          kpiWeight: "3",
          kpiPeriod: new Date().toISOString().slice(0, 7),
          assignedToId: assignees.manajemen[0]?.id || "mgt-1",
          dueDate: "",
        });
        fetchData();
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

  const completionRate = stats
    ? Math.round(((stats.completed) / Math.max(stats.todo + stats.inProgress + stats.underReview + stats.completed + stats.overdue, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 via-violet-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-violet-500/20 text-violet-200 border border-violet-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Modul KPI
          </span>
          <h1 className="text-2xl font-bold">Manajemen Tugas & Monitoring KPI</h1>
          <p className="mt-1 text-violet-200 text-sm">Pantau pencapaian kinerja tim dan penugasan berbasis KPI</p>
        </div>
        <div className="absolute right-6 top-6 opacity-10">
          <Target className="w-24 h-24" />
        </div>
      </div>

      {/* KPI Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Penyelesaian</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{completionRate}%</p>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg KPI Score</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.avgScore.toFixed(1)}</p>
            <p className="text-xs text-slate-500 mt-1">dari 100 poin</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Terlambat</span>
            </div>
            <p className="text-3xl font-bold text-red-700">{stats.overdue}</p>
            <p className="text-xs text-slate-500 mt-1">tugas melewati deadline</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Review Pending</span>
            </div>
            <p className="text-3xl font-bold text-amber-700">{stats.underReview}</p>
            <p className="text-xs text-slate-500 mt-1">menunggu persetujuan</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Semua Periode</option>
              {periods.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-2 text-xs font-medium transition ${view === "kanban" ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-2 text-xs font-medium transition ${view === "list" ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              List
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition"
          >
            <Plus className="w-4 h-4" /> Buat Tugas
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = getTasksByStatus(col.key);
            return (
              <div key={col.key} className={`${col.color} rounded-xl border ${col.border} p-4 min-w-[200px]`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${col.textColor}`}>{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${col.textColor}`}>{colTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {colTasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-white/80 hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-slate-800 leading-tight">{task.title}</h4>
                        {task.kpiWeight && (
                          <span className="shrink-0 text-[10px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">
                            W:{task.kpiWeight}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(task.dueDate).toLocaleDateString("id-ID")}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="text-[10px] font-medium text-slate-500">{task.category}</span>
                        <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[110px]" title={getAssigneeName(task.assignedToId)}>
                          👤 {getAssigneeShortName(task.assignedToId)}
                        </span>
                      </div>
                      {task.achievementScore !== undefined && task.achievementScore !== null && (
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-700">{task.achievementScore} / 100</span>
                        </div>
                      )}
                      {col.key === "UNDER_REVIEW" && (
                        <div className="mt-2 flex gap-1">
                          <button
                            onClick={() => setReviewModal({ task, action: "APPROVE_COMPLETE" })}
                            className="flex-1 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700 transition"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => setReviewModal({ task, action: "REJECT_REVIEW" })}
                            className="flex-1 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded hover:bg-red-200 transition"
                          >
                            Kembalikan
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 opacity-60">Tidak ada tugas</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Tugas</th>
                <th className="px-4 py-3 text-left">Penanggung Jawab</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-left">Periode</th>
                <th className="px-4 py-3 text-left">Bobot</th>
                <th className="px-4 py-3 text-left">Deadline</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Skor</th>
                <th className="px-4 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const col = STATUS_COLUMNS.find((c) => c.key === task.status);
                return (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 text-xs">{task.title}</div>
                      {task.description && <div className="text-xs text-slate-400 truncate max-w-[180px]">{task.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-slate-700">{getAssigneeShortName(task.assignedToId)}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{getAssigneeName(task.assignedToId).split("(")[1]?.replace(")", "") || "Staf"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{task.category}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{task.kpiPeriod}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">{task.kpiWeight}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(task.dueDate).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${col?.color} ${col?.textColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${col?.dot}`} />
                        {col?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">
                      {task.achievementScore !== null && task.achievementScore !== undefined ? `${task.achievementScore}/100` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {task.status === "UNDER_REVIEW" && (
                        <button
                          onClick={() => setReviewModal({ task, action: "APPROVE_COMPLETE" })}
                          className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {reviewModal.action === "APPROVE_COMPLETE" ? "✅ Verifikasi & Setujui Tugas" : "🔄 Kembalikan untuk Revisi"}
              </h3>
              <button onClick={() => setReviewModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-4">{reviewModal.task.title}</p>
            {reviewModal.action === "APPROVE_COMPLETE" && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Skor Pencapaian (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reviewScore}
                  onChange={(e) => setReviewScore(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan Review</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder="Tambahkan catatan evaluasi..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Batal
              </button>
              <button
                onClick={handleReview}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
              >
                {actionLoading ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Buat & Tugaskan Tugas KPI</h3>
                <p className="text-xs text-slate-500 mt-0.5">Berikan penugasan berbasis target KPI kepada Guru / Tim Manajemen</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Judul Tugas / Program <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Contoh: Penyusunan Modul Ajar Paket C Semester Ganjil..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori KPI *</label>
                  <div className="relative">
                    <select
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bobot KPI (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTask.kpiWeight}
                    onChange={(e) => setNewTask({ ...newTask, kpiWeight: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ditugaskan Kepada *</label>
                <div className="relative">
                  <select
                    value={newTask.assignedToId}
                    onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                    className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                  >
                    <optgroup label="🏢 Tim Manajemen & Struktural">
                      {assignees.manajemen.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.role}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="👨‍🏫 Tim Guru & Tutor Pendidik">
                      {assignees.guru.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} — {g.role}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Periode KPI (Bulan/Tahun)</label>
                  <input
                    type="month"
                    value={newTask.kpiPeriod}
                    onChange={(e) => setNewTask({ ...newTask, kpiPeriod: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tenggat Waktu (Deadline) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi / Petunjuk Pelaksanaan</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  placeholder="Detail instruksi, target capaian, atau kriteria kelulusan tugas..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? "Menyimpan..." : "Simpan & Tugaskan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


