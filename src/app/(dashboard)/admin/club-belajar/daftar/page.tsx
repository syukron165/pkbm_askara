"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Trophy,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  BookOpen,
  X,
  Loader2,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Search,
  Upload,
  UserPlus,
  ExternalLink,
  Tag,
  GraduationCap,
  Shield,
  Layers,
  Phone,
  Image as ImageIcon,
} from "lucide-react";

interface StudyClubMember {
  id: string;
  clubId: string;
  studentId: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
  student: {
    id: string;
    nisn?: string;
    packetType?: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      phone?: string;
    };
  };
}

interface StudyClubItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  visionGoals: string | null;
  mentorName: string;
  scheduleDay: string;
  scheduleTime: string;
  location: string;
  coverImage: string | null;
  maxMembers: number;
  isActive: boolean;
  members?: StudyClubMember[];
  attendances?: any[];
  createdAt: string;
}

const CATEGORIES = [
  { value: "SEMUA", label: "Semua Kategori" },
  { value: "VOKASI", label: "Vokasi & Kewirausahaan", badge: "bg-amber-100 text-amber-900 border-amber-200" },
  { value: "TEKNOLOGI", label: "Teknologi & Coding", badge: "bg-blue-100 text-blue-900 border-blue-200" },
  { value: "BAHASA", label: "Bahasa & Komunikasi", badge: "bg-purple-100 text-purple-900 border-purple-200" },
  { value: "SENI_BUDAYA", label: "Seni & Budaya", badge: "bg-rose-100 text-rose-900 border-rose-200" },
  { value: "SAINS", label: "Sains & Lingkungan", badge: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  { value: "OLAHRAGA", label: "Olahraga & Rekreasi", badge: "bg-orange-100 text-orange-900 border-orange-200" },
  { value: "LITERASI", label: "Literasi & Menulis", badge: "bg-indigo-100 text-indigo-900 border-indigo-200" },
];

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function DaftarClubBelajarPage() {
  const [clubs, setClubs] = useState<StudyClubItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("SEMUA");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<StudyClubItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Club
  const [clubForm, setClubForm] = useState({
    name: "",
    category: "VOKASI",
    description: "",
    visionGoals: "",
    mentorName: "",
    scheduleDay: "Sabtu",
    scheduleTime: "13:30 - 15:30 WIB",
    location: "Ruang Vokasi PKBM Askara",
    coverImage: "",
    maxMembers: "30",
    isActive: true,
  });

  // Form Member
  const [memberForm, setMemberForm] = useState({
    studentId: "",
    role: "ANGGOTA",
  });

  // Fetch Master Students
  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || d.students || [];
        setStudents(list);
        if (list.length > 0) setMemberForm((p) => ({ ...p, studentId: list[0].id }));
      })
      .catch(() => {});
  }, []);

  // Fetch Clubs
  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory !== "SEMUA") params.append("category", selectedCategory);

      const res = await fetch(`/api/club-belajar?${params.toString()}`);
      const data = await res.json();
      setClubs(data.clubs || []);

      // If detail modal is open, refresh selectedClub reference
      if (selectedClub) {
        const found = (data.clubs || []).find((c: StudyClubItem) => c.id === selectedClub.id);
        if (found) setSelectedClub(found);
      }
    } catch {
      setClubs([]);
    }
    setLoading(false);
  }, [search, selectedCategory, selectedClub]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setClubForm({
      name: "",
      category: "VOKASI",
      description: "",
      visionGoals: "",
      mentorName: "",
      scheduleDay: "Sabtu",
      scheduleTime: "13:30 - 15:30 WIB",
      location: "Ruang Workshop Vokasi Askara",
      coverImage: "",
      maxMembers: "30",
      isActive: true,
    });
    setShowCreateModal(true);
  };

  // Upload Cover Image
  const handleUploadCover = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=cbt", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setClubForm((p) => ({ ...p, coverImage: data.url }));
      } else {
        alert(data.error || "Gagal mengunggah foto sampul");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Save New Club
  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/club-belajar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubForm),
      });
      const data = await res.json();
      if (res.ok && data.club) {
        setShowCreateModal(false);
        fetchClubs();
        alert("Club Belajar baru berhasil ditambahkan!");
      } else {
        alert(data.error || "Gagal menyimpan club belajar");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Club
  const handleDeleteClub = async (id: string, name: string) => {
    if (!confirm(`Hapus Club Belajar "${name}"? Semua data anggota & presensi club ini akan terhapus.`)) return;
    try {
      const res = await fetch(`/api/club-belajar?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDetailModal(false);
        fetchClubs();
      }
    } catch {}
  };

  // Add Member to Club
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/club-belajar/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: selectedClub.id,
          studentId: memberForm.studentId,
          role: memberForm.role,
        }),
      });
      const data = await res.json();
      if (res.ok && data.member) {
        setShowAddMemberModal(false);
        fetchClubs();
        alert("Anggota siswa berhasil didaftarkan ke Club Belajar!");
      } else {
        alert(data.error || "Gagal menambahkan anggota");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Member from Club
  const handleDeleteMember = async (memberId: string, studentName: string) => {
    if (!confirm(`Keluarkan ${studentName} dari Club Belajar ini?`)) return;
    try {
      const res = await fetch(`/api/club-belajar/members?id=${memberId}`, { method: "DELETE" });
      if (res.ok) fetchClubs();
    } catch {}
  };

  const getCategoryBadge = (cat: string) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? found.badge : "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? found.label : cat;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4" />
              <span>Pengembangan Minat, Bakat & Vokasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Club Belajar PKBM Askara
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Kelola profil club belajar kesetaraan, pembinaan keterampilan vokasi, teknologi, bahasa, serta keanggotaan aktif siswa.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Club Belajar Baru</span>
          </button>
        </div>

        {/* Filter Kategori & Pencarian */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama club belajar, pembina, keterampilan, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedCategory(c.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === c.value
                    ? "bg-indigo-700 text-white shadow-xs font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Club Belajar */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Belum ada Club Belajar</h3>
          <p className="text-xs text-slate-500 mt-1">
            Klik tombol &quot;Tambah Club Belajar Baru&quot; untuk membuat kelompok belajar minat & vokasi siswa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((c) => {
            const memberCount = c.members?.length || 0;
            const meetingCount = c.attendances?.length || 0;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-soft hover-lift flex flex-col justify-between overflow-hidden transition group hover:border-indigo-300"
              >
                <div>
                  {/* Card Banner / Image Placeholder */}
                  <div className="h-28 bg-gradient-to-r from-indigo-800 via-indigo-700 to-purple-800 relative p-4 flex flex-col justify-between text-white overflow-hidden">
                    {c.coverImage ? (
                      <img
                        src={c.coverImage}
                        alt={c.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition duration-300"
                      />
                    ) : null}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-white/90 text-slate-800`}>
                        {getCategoryLabel(c.category)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/90 text-white">
                        {c.isActive ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </div>

                    <h3 className="relative z-10 text-sm sm:text-base font-bold text-white leading-snug drop-shadow-sm">
                      {c.name}
                    </h3>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {c.description || "Program pembinaan keterampilan terarah dan pengembangan potensi karya nyata warga belajar."}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate font-medium">Pembina: <strong>{c.mentorName}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Jadwal: <strong>{c.scheduleDay}, {c.scheduleTime}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Lokasi: {c.location}</span>
                      </div>
                    </div>

                    {/* Member Avatars Strip */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">
                          {memberCount} / {c.maxMembers} Anggota
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {meetingCount} Sesi Pertemuan
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedClub(c);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Profil & Anggota</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClub(c.id, c.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Hapus Club"
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
      {/* MODAL 1: TAMBAH CLUB BELAJAR BARU                            */}
      {/* ============================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Tambah Club Belajar PKBM Askara
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rancang kelompok belajar vokasi, teknologi, bahasa, dan minat siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveClub} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Nama Club */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Club Belajar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Club Robotik & Otomasi Cerdas / Club Barista & Tata Boga"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Kategori */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Bidang <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={clubForm.category}
                    onChange={(e) => setClubForm({ ...clubForm, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  >
                    {CATEGORIES.filter((c) => c.value !== "SEMUA").map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pembina / Tutor */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Tutor Pembina / Praktisi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Drs. Hendra Gunawan / Praktisi Barista"
                    value={clubForm.mentorName}
                    onChange={(e) => setClubForm({ ...clubForm, mentorName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              {/* Deskripsi & Profil */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi & Profil Singkat Club Belajar
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan fokus kegiatan dan keterampilan yang dipelajari..."
                  value={clubForm.description}
                  onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition resize-none"
                />
              </div>

              {/* Visi & Target Capaian Karya */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Visi, Misi & Target Capaian Karya Nyata Siswa
                </label>
                <textarea
                  rows={2}
                  placeholder="Target hasil karya atau sertifikasi kompetensi yang diharapkan..."
                  value={clubForm.visionGoals}
                  onChange={(e) => setClubForm({ ...clubForm, visionGoals: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Hari */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hari Pelaksanaan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={clubForm.scheduleDay}
                    onChange={(e) => setClubForm({ ...clubForm, scheduleDay: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jam */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jam Pertemuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="14:00 - 16:00 WIB"
                    value={clubForm.scheduleTime}
                    onChange={(e) => setClubForm({ ...clubForm, scheduleTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Kuota Maksimal */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Batas Kuota Anggota
                  </label>
                  <input
                    type="number"
                    value={clubForm.maxMembers}
                    onChange={(e) => setClubForm({ ...clubForm, maxMembers: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ruang / Lokasi Kegiatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lab Komputer / Workshop Vokasi / Aula Utama Askara"
                  value={clubForm.location}
                  onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                />
              </div>

              {/* Upload Foto Cover Banner */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Foto Sampul / Banner Club Belajar (Opsional)
                </label>
                {clubForm.coverImage ? (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 truncate">
                      <img src={clubForm.coverImage} alt="Cover" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      <span className="text-xs text-slate-700 truncate">{clubForm.coverImage.split("/").pop()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClubForm((p) => ({ ...p, coverImage: "" }))}
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
                    {uploadingImage ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        <span className="font-semibold text-slate-700">Mengunggah banner...</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-indigo-600 mx-auto" />
                        <p className="font-bold text-slate-800">Klik untuk mengunggah foto sampul club</p>
                        <p className="text-[10px] text-slate-400">JPG, PNG, WEBP (Maks 10 MB)</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadCover(f);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                      <span>Menyimpan Club...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan & Terbitkan Club</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: PROFIL DETAIL & MANAJEMEN ANGGOTA CLUB BELAJAR      */}
      {/* ============================================================ */}
      {showDetailModal && selectedClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Profil */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {getCategoryLabel(selectedClub.category)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {selectedClub.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {selectedClub.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Tutor Pembina: <strong className="text-slate-800">{selectedClub.mentorName}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Tabs / Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Jadwal Pertemuan</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedClub.scheduleDay}, {selectedClub.scheduleTime}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Lokasi / Ruang</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedClub.location}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Kapasitas Anggota</span>
                  <p className="font-bold text-indigo-700 mt-0.5">{selectedClub.members?.length || 0} / {selectedClub.maxMembers} Siswa</p>
                </div>
              </div>

              {/* Deskripsi & Visi */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 mb-1">Profil & Deskripsi</h4>
                  <p className="text-xs text-slate-600 leading-relaxed p-3.5 rounded-xl bg-white border border-slate-200">
                    {selectedClub.description || "Belum ada deskripsi profil club."}
                  </p>
                </div>

                {selectedClub.visionGoals && (
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 mb-1">Visi & Target Capaian Karya</h4>
                    <p className="text-xs text-indigo-950 leading-relaxed p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                      {selectedClub.visionGoals}
                    </p>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* DAFTAR ANGGOTA SISWA                                         */}
              {/* ============================================================ */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Daftar Anggota Siswa ({selectedClub.members?.length || 0})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs transition shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Tambah Anggota</span>
                  </button>
                </div>

                {!selectedClub.members || selectedClub.members.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-slate-600">Belum ada anggota terdaftar</p>
                    <p className="text-[11px] mt-0.5">Klik &quot;Tambah Anggota&quot; untuk mendaftarkan siswa ke club belajar ini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedClub.members.map((m, idx) => (
                      <div key={m.id} className="p-3.5 bg-white hover:bg-slate-50/80 transition flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {m.student?.user?.name ? m.student.user.name.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{m.student?.user?.name || "Nama Siswa"}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span>NISN: {m.student?.nisn || "-"}</span>
                              <span>•</span>
                              <span>{m.student?.packetType || "Kesetaraan"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              m.role === "KETUA"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : m.role === "WAKIL_KETUA"
                                ? "bg-blue-100 text-blue-900 border border-blue-300"
                                : m.role === "SEKRETARIS" || m.role === "BENDAHARA"
                                ? "bg-purple-100 text-purple-900 border border-purple-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {m.role}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m.id, m.student?.user?.name || "Siswa")}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Keluarkan dari Club"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: TAMBAH ANGGOTA SISWA KE CLUB                        */}
      {/* ============================================================ */}
      {showAddMemberModal && selectedClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-700" />
                <h3 className="font-bold text-sm text-slate-900">Tambah Anggota Club</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Siswa <span className="text-rose-500">*</span>
                </label>
                <select
                  value={memberForm.studentId}
                  onChange={(e) => setMemberForm({ ...memberForm, studentId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white"
                  required
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.name} ({s.packetType || "Siswa"} - NISN: {s.nisn || "-"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jabatan / Peran di Club Belajar
                </label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white"
                >
                  <option value="ANGGOTA">Anggota Aktif</option>
                  <option value="KETUA">Ketua Club</option>
                  <option value="WAKIL_KETUA">Wakil Ketua</option>
                  <option value="SEKRETARIS">Sekretaris</option>
                  <option value="BENDAHARA">Bendahara</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Daftarkan Siswa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
