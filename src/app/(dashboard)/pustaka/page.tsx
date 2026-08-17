"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Library,
  BookOpen,
  Download,
  Search,
  Plus,
  FileText,
  Upload,
  X,
  User,
  Clock,
  Trash2,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  BookMarked,
  Layers,
  FileSpreadsheet,
  FileCheck,
  Tag,
  ShieldCheck,
} from "lucide-react";

interface DigitalLibraryItem {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string | null;
  fileUrl: string;
  coverUrl: string | null;
  fileSize: string | null;
  downloadCount: number;
  uploaderId: string | null;
  uploader?: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  "SEMUA",
  "Modul Paket A",
  "Modul Paket B",
  "Modul Paket C",
  "Keterampilan & Vokasi",
  "Literasi & Referensi",
  "Kurikulum & Panduan",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Modul Paket A": "bg-amber-50 text-amber-700 border-amber-200",
  "Modul Paket B": "bg-blue-50 text-blue-700 border-blue-200",
  "Modul Paket C": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Keterampilan & Vokasi": "bg-purple-50 text-purple-700 border-purple-200",
  "Literasi & Referensi": "bg-rose-50 text-rose-700 border-rose-200",
  "Kurikulum & Panduan": "bg-indigo-50 text-indigo-700 border-indigo-200",
};

// ─── Komponen Upload File Dokumen Pustaka ────────────────────────────────────
function DocumentUploadField({
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
      const res = await fetch("/api/upload?folder=pustaka", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload gagal");
      onChange(data.url, data.originalName || file.name, data.fileSizeFormatted || "Dokumen");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload gagal");
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
      <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-900 truncate">
            {fileName || "Dokumen Pustaka"}
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
          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Ganti berkas"
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
        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition cursor-pointer select-none ${
          dragOver
            ? "border-emerald-400 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/30"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
            <p className="text-xs text-slate-600 font-medium">Sedang mengunggah berkas ke server...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-1">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800 text-center">
              Klik untuk memilih berkas atau seret berkas dokumen ke sini
            </p>
            <p className="text-[11px] text-slate-400 text-center">
              Mendukung berkas PDF, DOCX, PPTX, XLSX, EPUB (Maksimal 50 MB)
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.epub,.zip"
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

export default function DigitalLibraryPage() {
  const [items, setItems] = useState<DigitalLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("SEMUA");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "Modul Paket C",
    description: "",
    fileUrl: "",
    fileName: "",
    fileSize: "",
  });

  // Fetch Current User
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user))
      .catch(() => {});
  }, []);

  // Fetch Digital Library Items
  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "SEMUA") {
        params.append("category", selectedCategory);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await fetch(`/api/pustaka?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleOpenModal = () => {
    setForm({
      title: "",
      author: currentUser?.name ? `${currentUser.name} (Tutor Askara)` : "Tim Pendidik PKBM Askara",
      category: "Modul Paket C",
      description: "",
      fileUrl: "",
      fileName: "",
      fileSize: "",
    });
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileUrl) {
      alert("Silakan unggah berkas dokumen terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pustaka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          category: form.category,
          description: form.description,
          fileUrl: form.fileUrl,
          fileSize: form.fileSize,
        }),
      });

      const data = await res.json();
      if (res.ok && data.item) {
        setShowUploadModal(false);
        fetchLibrary();
        alert("Dokumen berhasil ditambahkan ke Pustaka Digital!");
      } else {
        alert(data.error || "Gagal mengunggah dokumen");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (item: DigitalLibraryItem) => {
    // Increment download counter
    try {
      fetch(`/api/pustaka?id=${item.id}`, { method: "PATCH" });
    } catch {}

    // Open file
    if (item.fileUrl) {
      window.open(item.fileUrl, "_blank");
    } else {
      alert(`Mengunduh file: ${item.title}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus modul "${title}" dari Pustaka Digital?`)) return;
    try {
      const res = await fetch(`/api/pustaka?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        fetchLibrary();
      } else {
        alert(data.error || "Gagal menghapus modul");
      }
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const canUpload =
    currentUser && ["super_admin", "admin", "pendidik"].includes(currentUser.role);

  // Stats calculation
  const totalDownloads = items.reduce((sum, item) => sum + (item.downloadCount || 0), 0);
  const totalPaketC = items.filter((i) => i.category === "Modul Paket C").length;
  const totalVokasi = items.filter((i) => i.category === "Keterampilan & Vokasi").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Library className="w-4 h-4" />
              <span>Pusat Sumber Belajar Digital</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Pustaka Digital PKBM Askara
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
              Akses dan unduh modul kurikulum kesetaraan Paket A, B, dan C, modul vokasi keterampilan mandiri, bahan ajar kontekstual, serta dokumen referensi pembelajaran.
            </p>
          </div>

          {/* Tombol Upload Dokumen */}
          {canUpload && (
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Dokumen / Modul</span>
            </button>
          )}
        </div>

        {/* Mini Stats Badges */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-slate-500">Total Koleksi Dokumen</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{items.length} Berkas</p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-emerald-800">Modul Kesetaraan</p>
            <p className="text-base sm:text-lg font-bold text-emerald-900 mt-0.5">{totalPaketC} Paket C</p>
          </div>
          <div className="bg-purple-50/60 border border-purple-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-purple-800">Modul Vokasi & Karya</p>
            <p className="text-base sm:text-lg font-bold text-purple-900 mt-0.5">{totalVokasi} Modul</p>
          </div>
          <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-blue-800">Aktivitas Unduhan</p>
            <p className="text-base sm:text-lg font-bold text-blue-900 mt-0.5">{totalDownloads}x Diunduh</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari judul modul, penyusun/penulis, atau topik materi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Dokumen / Modul */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft space-y-4">
              <div className="flex justify-between">
                <div className="h-5 w-24 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="h-6 w-3/4 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
              <div className="h-14 w-full bg-slate-50 rounded-xl animate-pulse" />
              <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada dokumen ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== "SEMUA"
              ? "Coba gunakan kata kunci lain atau pilih kategori yang berbeda."
              : "Belum ada dokumen yang diunggah ke Pustaka Digital."}
          </p>
          {canUpload && (
            <button
              onClick={handleOpenModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition"
            >
              <Plus className="w-4 h-4" /> Unggah Modul Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const catBadge =
              CATEGORY_COLORS[item.category] || "bg-slate-100 text-slate-700 border-slate-200";
            const uploaderName = item.uploader?.name || "Admin Askara";
            const uploaderRole =
              item.uploader?.role === "pendidik"
                ? "Pendidik"
                : item.uploader?.role === "super_admin"
                ? "Super Admin"
                : "Admin PKBM";

            const uploadDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";

            const uploadTime = item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            const canDelete =
              currentUser &&
              (["super_admin", "admin"].includes(currentUser.role) ||
                (currentUser.role === "pendidik" && item.uploaderId === currentUser.id));

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift flex flex-col justify-between transition group hover:border-emerald-300"
              >
                <div>
                  {/* Top Bar: Category & File Size */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${catBadge}`}
                    >
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {item.fileSize || "PDF"}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <h3 className="text-sm font-bold text-slate-900 mt-3 line-clamp-2 leading-snug group-hover:text-emerald-800 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Penyusun: {item.author}</span>
                  </p>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                      {item.description}
                    </p>
                  )}

                  {/* Uploader & Upload Time (Sesuai Permintaan User) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 truncate">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {uploaderName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold truncate">{uploaderName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                          {uploaderRole}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        Diupload: {uploadDate} {uploadTime ? `• ${uploadTime} WIB` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Action Buttons */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>{item.downloadCount || 0}x diunduh</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDownload(item)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Modul</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL UNGGAH DOKUMEN / MODUL PUSTAKA DIGITAL                 */}
      {/* ============================================================ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Unggah Dokumen Pustaka Digital
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tambahkan modul belajar kesetaraan atau referensi baru
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Judul Dokumen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Modul / Dokumen Pembelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Modul Pembelajaran Mandiri Sosiologi Paket C - Kelas XI"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Penulis / Penyusun */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Penulis / Penyusun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Guru / Tutor / Kemendikbud"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Sumber Belajar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition"
                  >
                    {CATEGORIES.filter((c) => c !== "SEMUA").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Cakupan Materi Modul
                </label>
                <textarea
                  placeholder="Ringkasan topik bahasan materi, tujuan pembelajaran, atau panduan penggunaan modul..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition resize-none"
                />
              </div>

              {/* Upload Berkas Dokumen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  Berkas Dokumen / Modul (PDF / Word / PPT / Excel / EPUB) <span className="text-rose-500">*</span>
                </label>
                <DocumentUploadField
                  fileUrl={form.fileUrl}
                  fileName={form.fileName}
                  fileSize={form.fileSize}
                  onChange={(url, name, size) =>
                    setForm({ ...form, fileUrl: url, fileName: name, fileSize: size })
                  }
                />
              </div>

              {/* Info Pengunggah Realtime */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    Pengunggah: {currentUser?.name || "Admin"} ({currentUser?.role === "pendidik" ? "Pendidik" : "Admin PKBM"})
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Waktu unggah akan dicatat secara otomatis saat berkas disimpan.
                  </p>
                </div>
              </div>

              {/* Sticky Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.fileUrl}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan ke Pustaka</span>
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
