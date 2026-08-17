"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  Plus,
  FileText,
  Clock,
  Users,
  ArrowRight,
  Upload,
  X,
  Video,
  Layers,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles,
  Download,
  AlertCircle,
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

// ─── Komponen Upload Berkas Materi Pembelajaran ──────────────────────────────
function MaterialFileUpload({
  fileUrl,
  fileName,
  fileSize,
  onChange,
}: {
  fileUrl: string;
  fileName: string;
  fileSize: string;
  onChange: (url: string, name: string, size: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=materi", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload gagal");
      onChange(data.url, data.originalName || file.name, data.fileSizeFormatted || "Berkas");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah berkas");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (fileUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-900 truncate">
            {fileName || "Berkas Modul Materi"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-emerald-700 font-medium">{fileSize}</span>
            <span className="text-slate-300">•</span>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> Cek berkas
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange("", "", "")}
          className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Hapus berkas"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed transition cursor-pointer select-none ${
          dragOver
            ? "border-emerald-400 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            <p className="text-xs text-slate-600 font-medium">Sedang mengunggah berkas...</p>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-emerald-600" />
            <p className="text-xs font-bold text-slate-800 text-center">
              Klik atau seret modul (PDF, Word, PPT) ke sini
            </p>
            <p className="text-[11px] text-slate-400">Maksimal 50 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

export default function GuruLmsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "materials" | "assignments">("all");
  const [materials, setMaterials] = useState<LMSMaterialItem[]>([]);
  const [assignments, setAssignments] = useState<LMSAssignmentItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Material Form State
  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    content: "",
    classId: "",
    subjectId: "",
    fileUrl: "",
    fileName: "",
    fileSize: "",
    videoUrl: "",
  });

  // Assignment Form State
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    instructions: "",
    classId: "",
    subjectId: "",
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
    maxScore: "100",
  });

  // Fetch Master Data (Classes & Subjects)
  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || d.classes || [];
        setClasses(list);
        if (list.length > 0) {
          setMaterialForm((p) => ({ ...p, classId: list[0].id }));
          setAssignmentForm((p) => ({ ...p, classId: list[0].id }));
        }
      })
      .catch(() => {});

    fetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || d.subjects || [];
        setSubjects(list);
        if (list.length > 0) {
          setMaterialForm((p) => ({ ...p, subjectId: list[0].id }));
          setAssignmentForm((p) => ({ ...p, subjectId: list[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Materials & Assignments
  const fetchLmsData = useCallback(async () => {
    setLoading(true);
    try {
      const [matRes, assRes] = await Promise.all([
        fetch("/api/lms/materials"),
        fetch("/api/lms/assignments"),
      ]);
      const matData = await matRes.json();
      const assData = await assRes.json();

      setMaterials(matData.materials || []);
      setAssignments(assData.assignments || []);
    } catch {
      setMaterials([]);
      setAssignments([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLmsData();
  }, [fetchLmsData]);

  // Open Modals Handlers
  const handleOpenMaterialModal = () => {
    setMaterialForm({
      title: "",
      description: "",
      content: "",
      classId: classes.length > 0 ? classes[0].id : "",
      subjectId: subjects.length > 0 ? subjects[0].id : "",
      fileUrl: "",
      fileName: "",
      fileSize: "",
      videoUrl: "",
    });
    setShowMaterialModal(true);
  };

  const handleOpenAssignmentModal = () => {
    setAssignmentForm({
      title: "",
      instructions: "",
      classId: classes.length > 0 ? classes[0].id : "",
      subjectId: subjects.length > 0 ? subjects[0].id : "",
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
      maxScore: "100",
    });
    setShowAssignmentModal(true);
  };

  // Submit Handlers
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/lms/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialForm),
      });
      const data = await res.json();
      if (res.ok && data.material) {
        setShowMaterialModal(false);
        fetchLmsData();
        alert("Materi pembelajaran berhasil diunggah!");
      } else {
        alert(data.error || "Gagal mengunggah materi");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/lms/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentForm),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        setShowAssignmentModal(false);
        fetchLmsData();
        alert("Tugas mandiri baru berhasil diterbitkan!");
      } else {
        alert(data.error || "Gagal membuat tugas");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id: string, title: string) => {
    if (!confirm(`Hapus materi "${title}"?`)) return;
    try {
      const res = await fetch(`/api/lms/materials?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchLmsData();
    } catch {}
  };

  const handleDeleteAssignment = async (id: string, title: string) => {
    if (!confirm(`Hapus tugas "${title}"?`)) return;
    try {
      const res = await fetch(`/api/lms/assignments?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchLmsData();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Learning Management System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              LMS Modul Belajar & Penugasan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Kelola materi pembelajaran daring, modul ajar mandiri kesetaraan, serta penerbitan tugas dan penilaian progres siswa.
            </p>
          </div>

          {/* Action Buttons (Unggah Materi & Buat Tugas) */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={handleOpenMaterialModal}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Materi</span>
            </button>
            <button
              onClick={handleOpenAssignmentModal}
              className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
        </div>

        {/* Tab & Stats Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 self-start">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua Konten ({materials.length + assignments.length})
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === "materials" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Materi Aktif</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                {materials.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === "assignments" ? "bg-white text-indigo-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Penugasan</span>
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 text-[10px] rounded-full font-bold">
                {assignments.length}
              </span>
            </button>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Tersinkronisasi langsung dengan portal pembelajaran siswa & orang tua
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================================ */}
        {/* KOLOM 1: MATERI PEMBELAJARAN                                */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "materials") && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">Materi Pembelajaran Aktif</h2>
                  <p className="text-[11px] text-slate-400">Modul dan referensi yang dapat diakses siswa</p>
                </div>
              </div>
              <button
                onClick={handleOpenMaterialModal}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                + Tambah Materi
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold text-slate-600">Belum ada materi yang diunggah</p>
                <button
                  onClick={handleOpenMaterialModal}
                  className="mt-3 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition"
                >
                  Unggah Materi Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {m.subject?.name || "Mata Pelajaran"}
                        </span>
                        <span className="font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {m.class?.name || "Rombel"}
                        </span>
                      </div>
                      <span className="text-slate-400">
                        {new Date(m.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition">
                      {m.title}
                    </h4>

                    {m.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {m.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        {m.fileUrl && (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md font-bold hover:bg-emerald-100 transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Buka Modul</span>
                          </a>
                        )}
                        {m.videoUrl && (
                          <a
                            href={m.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md font-bold hover:bg-rose-100 transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Video</span>
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteMaterial(m.id, m.title)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Hapus materi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* KOLOM 2: PENUGASAN & PENILAIAN                              */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "assignments") && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">Penugasan & Penilaian</h2>
                  <p className="text-[11px] text-slate-400">Daftar tugas mandiri dan batas waktu pengerjaan</p>
                </div>
              </div>
              <button
                onClick={handleOpenAssignmentModal}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
              >
                + Buat Tugas
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold text-slate-600">Belum ada tugas mandiri</p>
                <button
                  onClick={handleOpenAssignmentModal}
                  className="mt-3 px-3 py-1.5 bg-indigo-700 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition"
                >
                  Buat Tugas Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {a.subject?.name || "Mata Pelajaran"}
                        </span>
                        <span className="font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {a.class?.name || "Rombel"}
                        </span>
                      </div>
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Tenggat:{" "}
                        {new Date(a.dueDate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-800 transition">
                      {a.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-100">
                      {a.instructions}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">
                        Bobot Nilai: <strong className="text-slate-800">{a.maxScore} Poin</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteAssignment(a.id, a.title)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Hapus tugas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL UNGGAH MATERI PEMBELAJARAN                             */}
      {/* ============================================================ */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Unggah Materi Pembelajaran Baru
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Publikasikan modul ajar dan bahan pembelajaran untuk kelas Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMaterial} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Judul Materi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Materi Pembelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Modul Matriks & Penerapan SPLDV dalam Masalah Nyata"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Rombel / Kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rombel / Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={materialForm.classId}
                    onChange={(e) => setMaterialForm({ ...materialForm, classId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                    required
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.level})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={materialForm.subjectId}
                    onChange={(e) => setMaterialForm({ ...materialForm, subjectId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                    required
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi / Ringkasan Materi
                </label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan kompetensi dasar dan tujuan belajar..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition resize-none"
                />
              </div>

              {/* Isi Teks Materi (Opsional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Materi / Rangkuman Bacaan Langsung
                </label>
                <textarea
                  rows={3}
                  placeholder="Isi rangkuman poin-poin materi yang langsung dapat dibaca oleh siswa di portal..."
                  value={materialForm.content}
                  onChange={(e) => setMaterialForm({ ...materialForm, content: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition resize-none"
                />
              </div>

              {/* Upload Berkas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  Upload Berkas Modul / Slide (PDF / Word / PPT)
                </label>
                <MaterialFileUpload
                  fileUrl={materialForm.fileUrl}
                  fileName={materialForm.fileName}
                  fileSize={materialForm.fileSize}
                  onChange={(url, name, size) =>
                    setMaterialForm({
                      ...materialForm,
                      fileUrl: url,
                      fileName: name,
                      fileSize: size,
                    })
                  }
                />
              </div>

              {/* Link Video (Opsional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  Link Video Pembelajaran (YouTube / Google Drive)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={materialForm.videoUrl}
                  onChange={(e) => setMaterialForm({ ...materialForm, videoUrl: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Publikasikan Materi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL BUAT TUGAS MANDIRI BARU                                */}
      {/* ============================================================ */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Buat Tugas Mandiri Baru
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Terbitkan lembar tugas, instruksi pengerjaan, dan tenggat waktu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignmentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAssignment} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Judul Tugas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Penugasan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tugas 1: Studi Kasus Perhitungan Laba Usaha Vokasi"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Rombel / Kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rombel / Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignmentForm.classId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.level})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignmentForm.subjectId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Petunjuk Tugas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Petunjuk & Instruksi Pengerjaan Tugas <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan instruksi langkah-langkah tugas, format berkas pengumpulan (PDF/Foto), dan kriteria penilaian..."
                  value={assignmentForm.instructions}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Tenggat Waktu */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Batas Waktu Pengumpulan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Bobot Nilai Maksimal */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    Skor / Bobot Maksimal
                  </label>
                  <input
                    type="number"
                    value={assignmentForm.maxScore}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, maxScore: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menerbitkan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Terbitkan Tugas</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
