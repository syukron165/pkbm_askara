"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList,
  Upload,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  X,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";

interface LMSAssignmentItem {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  class?: { id: string; name: string; level: string };
  subject?: { id: string; name: string; code: string };
  teacher?: { id: string; name: string; role: string };
}

export default function SiswaTugasPage() {
  const [tasks, setTasks] = useState<LMSAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<LMSAssignmentItem | null>(null);
  const [submittedTasks, setSubmittedTasks] = useState<Record<string, boolean>>({});
  const [submissionText, setSubmissionText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lms/assignments");
      const data = await res.json();
      setTasks(data.assignments || []);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=materi", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setUploadedFileUrl(data.url);
        setUploadedFileName(data.originalName || file.name);
      } else {
        alert(data.error || "Gagal mengunggah berkas tugas");
      }
    } catch (err: any) {
      alert("Gagal mengunggah: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenSubmitModal = (task: LMSAssignmentItem) => {
    setSelectedTask(task);
    setSubmissionText("");
    setUploadedFileUrl("");
    setUploadedFileName("");
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    // Mark as submitted
    setSubmittedTasks((prev) => ({ ...prev, [selectedTask.id]: true }));
    alert(`Tugas "${selectedTask.title}" berhasil dikumpulkan! Tutor akan memeriksa hasil pengerjaan Anda.`);
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <ClipboardList className="w-4 h-4" />
              <span>Penugasan Mandiri LMS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Tugas & Evaluasi Belajar Siswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Kumpulkan hasil pengerjaan lembar kerja mandiri, tugas proyek, dan latihan soal untuk dinilai oleh tutor kesetaraan Anda.
            </p>
          </div>

          <button
            onClick={fetchTasks}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-500 self-start sm:self-auto shrink-0 flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada tugas aktif</h3>
          <p className="text-xs text-slate-500 mt-1">
            Saat ini belum ada tugas mandiri yang diberikan oleh tutor.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isDone = submittedTasks[task.id];
            const isOverdue = new Date(task.dueDate) < new Date();

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft hover-lift space-y-3 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {task.subject?.name || "Mata Pelajaran"}
                    </span>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      {task.class?.name || "Rombel"}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold flex items-center space-x-1 ${
                      isOverdue ? "text-rose-600" : "text-amber-600"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Tenggat:{" "}
                      {new Date(task.dueDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{task.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Tutor: {task.teacher?.name || "Pendidik"}
                  </p>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                    {task.instructions}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Bobot Nilai: <strong className="text-slate-800">{task.maxScore} Poin</strong>
                  </span>

                  {isDone ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sudah Dikumpulkan</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenSubmitModal(task)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Kumpulkan Tugas</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Pengumpulan Tugas */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Pengumpulan Tugas Siswa
                </h2>
                <p className="text-xs text-slate-500 truncate max-w-sm">
                  {selectedTask.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan / Jawaban Teks Tugas
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan keterangan pengerjaan atau jawaban tugas Anda..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Berkas Tugas (Foto / PDF / Dokumen)
                </label>

                {uploadedFileUrl ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">{uploadedFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileUrl("");
                        setUploadedFileName("");
                      }}
                      className="p-1 text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="p-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-400 cursor-pointer text-center space-y-1 transition"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-1.5 py-2">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        <p className="font-semibold text-slate-700">Mengunggah berkas tugas...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-indigo-600 mx-auto" />
                        <p className="font-bold text-slate-800">Klik untuk memilih berkas tugas</p>
                        <p className="text-[11px] text-slate-400">PDF, Foto JPG/PNG, DOCX (Maks 50 MB)</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-60 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kirim Tugas Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
