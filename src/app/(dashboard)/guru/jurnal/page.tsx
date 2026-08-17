"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookMarked,
  CheckCircle2,
  Send,
  Clock,
  Users,
  Image as ImageIcon,
  Video,
  Upload,
  X,
  FileText,
  ExternalLink,
  Loader2,
  Plus,
  Calendar,
  Layers,
  BookOpen,
  Trash2,
  Play,
  Maximize2,
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

// ─── Komponen Upload Dokumentasi Kelas (Foto / Video) ──────────────────────
function ClassMediaUploadField({
  mediaUrl,
  mediaType,
  fileName,
  fileSize,
  onChange,
}: {
  mediaUrl: string;
  mediaType: string;
  fileName: string;
  fileSize: string;
  onChange: (url: string, type: "IMAGE" | "VIDEO" | "DOCUMENT", name: string, size: string) => void;
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
      const res = await fetch("/api/upload?folder=jurnal", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload gagal");

      const detectedType =
        data.mediaType || (file.type.startsWith("video/") ? "VIDEO" : "IMAGE");

      onChange(
        data.url,
        detectedType,
        data.originalName || file.name,
        data.fileSizeFormatted || "Berkas"
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah dokumentasi");
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

  if (mediaUrl) {
    const isVideo = mediaType === "VIDEO" || mediaUrl.match(/\.(mp4|webm|mov|ogg)$/i);

    return (
      <div className="p-4 bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            {isVideo ? (
              <Video className="w-4 h-4 text-emerald-700" />
            ) : (
              <ImageIcon className="w-4 h-4 text-emerald-700" />
            )}
            <span>
              Dokumentasi {isVideo ? "Video" : "Foto"} Kelas Berhasil Diunggah
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange("", "IMAGE", "", "")}
            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition text-xs font-semibold flex items-center gap-1"
            title="Hapus / Ganti dokumentasi"
          >
            <X className="w-4 h-4" />
            <span>Ganti</span>
          </button>
        </div>

        {/* Media Preview Box */}
        <div className="relative rounded-xl overflow-hidden bg-black/5 border border-emerald-300/60 max-h-64 flex items-center justify-center">
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              className="max-h-64 w-full rounded-xl object-contain bg-black"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt="Dokumentasi Kelas"
              className="max-h-64 w-full object-cover rounded-xl"
            />
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium px-1">
          <span className="truncate max-w-xs">{fileName || "Dokumentasi Kegiatan Kelas"}</span>
          <span>{fileSize}</span>
        </div>
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
        className={`flex flex-col items-center justify-center gap-2.5 p-6 rounded-2xl border-2 border-dashed transition cursor-pointer select-none ${
          dragOver
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs text-slate-700 font-semibold">Sedang mengunggah dokumentasi media...</p>
            <p className="text-[11px] text-slate-400">Mohon tunggu hingga proses selesai</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-emerald-700 bg-emerald-100/70 p-3 rounded-2xl">
              <ImageIcon className="w-6 h-6" />
              <span className="text-slate-300">/</span>
              <Video className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-800">
                Pilih atau seret Foto / Video dokumentasi kelas ke sini
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Foto (JPG, PNG, WEBP) atau Video Rekaman Sesi (MP4, WEBM, MOV) · Maks 75 MB
              </p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

export default function GuruJurnalPage() {
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [journals, setJournals] = useState<TeacherJournal[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string; title: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    classId: "",
    subjectId: "",
    date: new Date().toISOString().slice(0, 10),
    topic: "",
    activities: "",
    notes: "",
    studentAttendanceCount: "25",
    timeSession: "08:00 - 09:30 WIB",
    documentationUrl: "",
    mediaType: "IMAGE",
    mediaFileName: "",
    mediaFileSize: "",
  });

  // Fetch Master Data Classes & Subjects
  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        const clsList = d.data || d.classes || [];
        setClasses(clsList);
        if (clsList.length > 0) {
          setForm((prev) => ({ ...prev, classId: clsList[0].id }));
        }
      })
      .catch(() => {});

    fetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => {
        const subjList = d.data || d.subjects || [];
        setSubjects(subjList);
        if (subjList.length > 0) {
          setForm((prev) => ({ ...prev, subjectId: subjList[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Journals History
  const fetchJournals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journals?own=true");
      const data = await res.json();
      setJournals(data.journals || []);
    } catch {
      setJournals([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setIsSubmitted(false);

    try {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: form.classId,
          subjectId: form.subjectId,
          date: form.date,
          topic: form.topic,
          activities: form.activities,
          notes: form.notes
            ? `${form.notes} [Waktu: ${form.timeSession}]`
            : `Waktu Sesi: ${form.timeSession}`,
          studentAttendanceCount: form.studentAttendanceCount,
          documentationUrl: form.documentationUrl || null,
          mediaType: form.mediaType || "IMAGE",
        }),
      });

      const data = await res.json();
      if (res.ok && data.journal) {
        setIsSubmitted(true);
        fetchJournals();
        // Reset form content but keep class/subject selection
        setForm((prev) => ({
          ...prev,
          topic: "",
          activities: "",
          notes: "",
          documentationUrl: "",
          mediaFileName: "",
          mediaFileSize: "",
        }));
      } else {
        alert(data.error || "Gagal menyimpan jurnal mengajar");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!confirm("Hapus catatan jurnal ini?")) return;
    try {
      const res = await fetch(`/api/journals?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchJournals();
      }
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <BookMarked className="w-7 h-7 text-emerald-600" />
            Jurnal Mengajar Harian Tutor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Catat topik bahasan, keaktifan warga belajar, kehadiran, serta unggah dokumentasi foto / video kegiatan kelas.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              setActiveTab("form");
              setIsSubmitted(false);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "form"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            + Input Jurnal
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Riwayat Saya</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
              {journals.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSubmitted && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Jurnal mengajar dan dokumentasi kegiatan kelas berhasil disimpan dan tersinkronisasi ke supervisi!
            </span>
          </div>
          <button
            onClick={() => setActiveTab("history")}
            className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
          >
            Lihat Riwayat →
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: FORM INPUT JURNAL MENGAJAR                            */}
      {/* ============================================================ */}
      {activeTab === "form" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft space-y-5 text-xs text-slate-800"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rombel / Kelas */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Rombel / Kelas Belajar <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                required
              >
                {classes.length === 0 ? (
                  <option value="">-- Memuat Data Rombel --</option>
                ) : (
                  classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                required
              >
                {subjects.length === 0 ? (
                  <option value="">-- Memuat Data Mata Pelajaran --</option>
                ) : (
                  subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Pelaksanaan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal Pelaksanaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                required
              />
            </div>

            {/* Waktu Sesi */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Waktu Sesi Pembelajaran
              </label>
              <input
                type="text"
                value={form.timeSession}
                onChange={(e) => setForm({ ...form, timeSession: e.target.value })}
                placeholder="Contoh: 08:00 - 09:30 WIB"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Topik / Bahasan Materi */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Topik / Pokok Bahasan Materi Hari Ini <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Operasi Matriks dan Penggunaannya dalam Permasalahan Sehari-hari"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* Aktivitas & Catatan Proses Pembelajaran */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Uraian Aktivitas Belajar & Keaktifan Warga Belajar <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Jelaskan metode pembelajaran, keaktifan siswa saat diskusi kelompok, kendala yang dihadapi, dan tindak lanjut penugasan mandiri..."
              value={form.activities}
              onChange={(e) => setForm({ ...form, activities: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jumlah Siswa Hadir */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Jumlah Warga Belajar Hadir
              </label>
              <input
                type="number"
                placeholder="25"
                value={form.studentAttendanceCount}
                onChange={(e) => setForm({ ...form, studentAttendanceCount: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
            </div>

            {/* Catatan Khusus */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Catatan Khusus / Evaluasi Tutor (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Perlu pendalaman materi modul pertemuan berikutnya"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* FITUR UPLOAD DOKUMENTASI KEGIATAN KELAS (FOTO / VIDEO)       */}
          {/* ============================================================ */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block font-bold text-slate-800 text-xs mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Upload Dokumentasi Kegiatan Kelas (Foto / Video)
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                Opsional namun sangat disarankan untuk laporan supervisi
              </span>
            </label>

            <ClassMediaUploadField
              mediaUrl={form.documentationUrl}
              mediaType={form.mediaType}
              fileName={form.mediaFileName}
              fileSize={form.mediaFileSize}
              onChange={(url, type, name, size) =>
                setForm({
                  ...form,
                  documentationUrl: url,
                  mediaType: type,
                  mediaFileName: name,
                  mediaFileSize: size,
                })
              }
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Dokumen jurnal ini akan tersimpan permanen dan dapat dipantau oleh Kepala PKBM dan Tim Supervisi.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center space-x-2 transition shadow-sm disabled:opacity-60 shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Jurnal...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Simpan Jurnal Mengajar</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB 2: RIWAYAT JURNAL MENGAJAR SAYA                          */}
      {/* ============================================================ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : journals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
              <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Belum ada catatan jurnal</h3>
              <p className="text-xs text-slate-500 mt-1">
                Catat proses pembelajaran harian Anda dengan tombol &quot;Input Jurnal&quot;.
              </p>
              <button
                onClick={() => setActiveTab("form")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition"
              >
                <Plus className="w-4 h-4" /> Tulis Jurnal Sekarang
              </button>
            </div>
          ) : (
            journals.map((j) => {
              const isVideo = j.mediaType === "VIDEO" || j.documentationUrl?.match(/\.(mp4|webm|mov)$/i);
              return (
                <div
                  key={j.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft hover-lift space-y-4 transition"
                >
                  {/* Top Bar: Subject, Class, Date */}
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

                  {/* Main Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                    <div className="md:col-span-2 space-y-2">
                      <h3 className="text-base font-bold text-slate-900">{j.topic}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        {j.activities}
                      </p>
                      {j.notes && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Catatan: {j.notes}
                        </p>
                      )}
                    </div>

                    {/* Dokumentasi Media Preview */}
                    <div className="md:col-span-1">
                      {j.documentationUrl ? (
                        <div
                          onClick={() =>
                            setSelectedMedia({
                              url: j.documentationUrl!,
                              type: isVideo ? "VIDEO" : "IMAGE",
                              title: j.topic,
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
                                  Putar Video Kelas
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
                          <span>Tidak ada foto/video</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Bar: Attendance & Delete */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {j.studentAttendanceCount} Warga Belajar Hadir
                    </span>

                    <button
                      onClick={() => handleDeleteJournal(j.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition text-xs flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MEDIA MODAL POPUP (ZOOM PHOTO / PLAY VIDEO)                  */}
      {/* ============================================================ */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
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
