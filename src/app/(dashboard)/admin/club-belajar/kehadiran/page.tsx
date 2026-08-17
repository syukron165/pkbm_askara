"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CalendarCheck,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
  Search,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  AlertCircle,
  Trophy,
  Filter,
  Eye,
  Camera,
  Layers,
  Sparkles,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: string; // HADIR, IZIN, SAKIT, ALFA
  remarks: string | null;
  student?: {
    id: string;
    nisn?: string;
    packetType?: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  };
}

interface ClubAttendanceItem {
  id: string;
  clubId: string;
  meetingDate: string;
  activityTitle: string;
  notes: string | null;
  documentationUrl: string | null;
  mediaType: string | null;
  club?: {
    id: string;
    name: string;
    category: string;
    mentorName: string;
    scheduleDay: string;
    scheduleTime: string;
  };
  records: AttendanceRecord[];
  createdAt: string;
}

export default function KehadiranClubBelajarPage() {
  const [attendances, setAttendances] = useState<ClubAttendanceItem[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClubFilter, setSelectedClubFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<ClubAttendanceItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [form, setForm] = useState({
    clubId: "",
    meetingDate: new Date().toISOString().slice(0, 10),
    activityTitle: "",
    notes: "",
    documentationUrl: "",
    mediaType: "IMAGE",
    records: [] as Array<{
      studentId: string;
      studentName: string;
      packetType?: string;
      status: "HADIR" | "IZIN" | "SAKIT" | "ALFA";
      remarks: string;
    }>,
  });

  // Fetch Clubs
  useEffect(() => {
    fetch("/api/club-belajar")
      .then((r) => r.json())
      .then((d) => {
        const list = d.clubs || [];
        setClubs(list);
        if (list.length > 0) {
          setForm((p) => ({ ...p, clubId: list[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Attendances
  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClubFilter !== "ALL") params.append("clubId", selectedClubFilter);
      const res = await fetch(`/api/club-belajar/attendance?${params.toString()}`);
      const data = await res.json();
      setAttendances(data.attendances || []);
    } catch {
      setAttendances([]);
    }
    setLoading(false);
  }, [selectedClubFilter]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  // Load Members when Club is selected in Entry Modal
  const loadClubMembers = async (clubId: string) => {
    try {
      const res = await fetch(`/api/club-belajar/members?clubId=${clubId}`);
      const data = await res.json();
      const members = data.members || [];
      setForm((prev) => ({
        ...prev,
        clubId,
        records: members.map((m: any) => ({
          studentId: m.studentId,
          studentName: m.student?.user?.name || "Siswa",
          packetType: m.student?.packetType || "Kesetaraan",
          status: "HADIR",
          remarks: "",
        })),
      }));
    } catch {}
  };

  const handleOpenEntryModal = () => {
    const defaultClubId = clubs.length > 0 ? clubs[0].id : "";
    setForm({
      clubId: defaultClubId,
      meetingDate: new Date().toISOString().slice(0, 10),
      activityTitle: "",
      notes: "",
      documentationUrl: "",
      mediaType: "IMAGE",
      records: [],
    });
    if (defaultClubId) loadClubMembers(defaultClubId);
    setShowEntryModal(true);
  };

  // Upload Documentation
  const handleUploadDocumentation = async (file: File) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=jurnal", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((p) => ({
          ...p,
          documentationUrl: data.url,
          mediaType: data.mediaType || (file.type.startsWith("video/") ? "VIDEO" : "IMAGE"),
        }));
      } else {
        alert(data.error || "Gagal mengunggah foto kegiatan");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Save Attendance
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/club-belajar/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.attendance) {
        setShowEntryModal(false);
        fetchAttendances();
        alert("Presensi pertemuan Club Belajar berhasil disimpan!");
      } else {
        alert(data.error || "Gagal menyimpan presensi");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Attendance
  const handleDeleteAttendance = async (id: string, title: string) => {
    if (!confirm(`Hapus sesi pertemuan "${title}"?`)) return;
    try {
      const res = await fetch(`/api/club-belajar/attendance?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchAttendances();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <CalendarCheck className="w-4 h-4" />
              <span>Monitoring Pertemuan & Presensi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Kehadiran Siswa Club Belajar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Catat riwayat sesi pertemuan mingguan club belajar, presensi kehadiran anggota, serta dokumentasi foto dan video aktivitas karya.
            </p>
          </div>

          <button
            onClick={handleOpenEntryModal}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pertemuan & Presensi Baru</span>
          </button>
        </div>

        {/* Filter Club Belajar Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClubFilter}
              onChange={(e) => setSelectedClubFilter(e.target.value)}
              className="w-full sm:w-72 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="ALL">Semua Club Belajar ({clubs.length})</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-400 font-medium self-center">
            Total {attendances.length} sesi pertemuan tercatat
          </p>
        </div>
      </div>

      {/* Grid Sesi Pertemuan */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
      ) : attendances.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Belum ada catatan presensi pertemuan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Klik tombol &quot;Catat Pertemuan & Presensi Baru&quot; untuk mendokumentasikan sesi club belajar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {attendances.map((att) => {
            const total = att.records.length;
            const hadir = att.records.filter((r) => r.status === "HADIR").length;
            const izin = att.records.filter((r) => r.status === "IZIN").length;
            const sakit = att.records.filter((r) => r.status === "SAKIT").length;
            const alfa = att.records.filter((r) => r.status === "ALFA").length;

            return (
              <div
                key={att.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft hover-lift flex flex-col justify-between transition group hover:border-indigo-300 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 truncate">
                      {att.club?.name || "Club Belajar"}
                    </span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(att.meetingDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2.5 leading-snug group-hover:text-indigo-800 transition">
                    {att.activityTitle}
                  </h3>

                  {att.notes && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {att.notes}
                    </p>
                  )}

                  {/* Foto Dokumentasi Preview */}
                  {att.documentationUrl && (
                    <div className="mt-3">
                      <img
                        src={att.documentationUrl}
                        alt="Dokumentasi Sesi"
                        className="w-full h-32 object-cover rounded-xl border border-slate-200"
                      />
                    </div>
                  )}

                  {/* Statistik Kehadiran Sesi */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 block">Hadir</span>
                      <strong className="text-emerald-900 text-sm">{hadir}</strong>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[10px] font-bold text-blue-800 block">Izin</span>
                      <strong className="text-blue-900 text-sm">{izin}</strong>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-800 block">Sakit</span>
                      <strong className="text-amber-900 text-sm">{sakit}</strong>
                    </div>
                    <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-800 block">Alfa</span>
                      <strong className="text-rose-900 text-sm">{alfa}</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setSelectedAttendance(att);
                      setShowDetailModal(true);
                    }}
                    className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Rincian Presensi ({total} Siswa)</span>
                  </button>

                  <button
                    onClick={() => handleDeleteAttendance(att.id, att.activityTitle)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Sesi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: FORM PENCATATAN PRESENSI PERTEMUAN BARU            */}
      {/* ============================================================ */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Catat Pertemuan & Presensi Club Belajar
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rekam kehadiran anggota, materi kegiatan, dan dokumentasi sesi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEntryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAttendance} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Pilihan Club */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pilih Club Belajar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.clubId}
                    onChange={(e) => loadClubMembers(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tanggal Pertemuan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Pertemuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.meetingDate}
                    onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              {/* Topik Aktivitas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Topik Pembahasan / Aktivitas Pertemuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Praktik Kalibrasi Mesin Espresso & Pembuatan Latte Art Dasar"
                  value={form.activityTitle}
                  onChange={(e) => setForm({ ...form, activityTitle: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  required
                />
              </div>

              {/* Catatan Sesi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Perkembangan & Evaluasi Sesi
                </label>
                <textarea
                  rows={2}
                  placeholder="Hasil karya yang diselesaikan, kendala praktik, atau target pertemuan selanjutnya..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition resize-none"
                />
              </div>

              {/* Upload Dokumentasi Foto */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Foto Dokumentasi Aktivitas Pertemuan (Opsional)
                </label>
                {form.documentationUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 truncate">
                      <img src={form.documentationUrl} alt="Dokumentasi" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      <span className="text-xs text-slate-700 truncate">{form.documentationUrl.split("/").pop()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, documentationUrl: "" }))}
                      className="p-1 text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-slate-50 hover:bg-indigo-50/40 cursor-pointer text-center space-y-1 transition"
                  >
                    {uploadingDoc ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        <span className="font-semibold text-slate-700">Mengunggah foto...</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-indigo-600 mx-auto" />
                        <p className="font-bold text-slate-800">Klik untuk mengunggah foto kegiatan</p>
                        <p className="text-[10px] text-slate-400">JPG, PNG, WEBP (Maks 15 MB)</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadDocumentation(f);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* DAFTAR CHECKLIST KEHADIRAN ANGGOTA SISWA                    */}
              {/* ============================================================ */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Checklist Presensi Anggota ({form.records.length} Siswa)
                  </h4>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          records: prev.records.map((r) => ({ ...r, status: "HADIR" })),
                        }));
                      }}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Set Semua Hadir
                    </button>
                  </div>
                </div>

                {form.records.length === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-center">
                    Belum ada anggota siswa di club belajar ini. Tambahkan anggota terlebih dahulu pada menu Profil Club.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    {form.records.map((rec, idx) => (
                      <div key={rec.studentId} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{rec.studentName}</p>
                          <span className="text-[10px] text-slate-400">{rec.packetType || "Siswa"}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {(["HADIR", "IZIN", "SAKIT", "ALFA"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setForm((prev) => {
                                  const nr = [...prev.records];
                                  nr[idx].status = st;
                                  return { ...prev, records: nr };
                                });
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                rec.status === st
                                  ? st === "HADIR"
                                    ? "bg-emerald-600 text-white"
                                    : st === "IZIN"
                                    ? "bg-blue-600 text-white"
                                    : st === "SAKIT"
                                    ? "bg-amber-600 text-white"
                                    : "bg-rose-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Simpan Presensi Pertemuan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: RINCIAN PRESENSI PERTEMUAN LENGKAP                  */}
      {/* ============================================================ */}
      {showDetailModal && selectedAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedAttendance.club?.name}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedAttendance.activityTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800">
              {/* Info Sesi */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>Tanggal: <strong>{new Date(selectedAttendance.meetingDate).toLocaleDateString("id-ID", { dateStyle: "full" })}</strong></div>
                <div>Pembina: <strong>{selectedAttendance.club?.mentorName}</strong></div>
              </div>

              {selectedAttendance.notes && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-950">
                  <p className="font-semibold mb-0.5">Catatan Perkembangan Sesi:</p>
                  <p>{selectedAttendance.notes}</p>
                </div>
              )}

              {selectedAttendance.documentationUrl && (
                <div>
                  <p className="font-bold text-slate-700 mb-1.5">Foto Dokumentasi Kegiatan:</p>
                  <img
                    src={selectedAttendance.documentationUrl}
                    alt="Dokumentasi"
                    className="rounded-xl max-h-60 w-full object-cover border border-slate-200"
                  />
                </div>
              )}

              {/* Rincian Siswa */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-900">Rekap Kehadiran Anggota:</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {selectedAttendance.records.map((r) => (
                    <div key={r.id} className="p-3 bg-white flex items-center justify-between">
                      <span className="font-bold text-slate-900">{r.student?.user?.name || "Siswa"}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          r.status === "HADIR"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.status === "IZIN"
                            ? "bg-blue-100 text-blue-800"
                            : r.status === "SAKIT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
