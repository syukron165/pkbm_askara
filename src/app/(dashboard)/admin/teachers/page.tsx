"use client";

import React, { useState, useRef } from "react";
import {
  Plus,
  Search,
  Mail,
  Phone,
  BookOpen,
  Camera,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  GraduationCap,
  ChevronRight,
  Download,
  Printer,
  MapPin,
  ExternalLink,
  Briefcase,
  FileText,
  Upload,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import CsvImportExport from "@/components/CsvImportExport";
import DualUploadInput from "@/components/DualUploadInput";
import { calculateDetailedAge } from "@/lib/public-registration-db";

/* ──────────────────────────────────────────────────── */
/*  Types                                               */
/* ──────────────────────────────────────────────────── */

interface TeacherData {
  id: string;
  name: string;
  nip?: string;
  role: string;
  email: string;
  phone: string;
  classes: string;
  status: "AKTIF" | "NON-AKTIF";
  photoUrl?: string;
  specialization?: string;
  address?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  joinDate?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  lastEducation?: string;
  majorStudy?: string;
  universityName?: string;
  graduationYear?: string;
  experienceYears?: number;
  skills?: string;
  religion?: string;
  motherName?: string;
  maritalStatus?: string;
  socialMedia?: string;
  hobbies?: string;
  lifeMotto?: string;
  bankAccountNumber?: string;
  bankName?: string;
  educationStatus?: string;
  linkedinUrl?: string;
  cvResumeUrl?: string;
  ktpUrl?: string;
  kkUrl?: string;
  diplomaUrl?: string;
  transcriptUrl?: string;
  npwpUrl?: string;
}

/* ──────────────────────────────────────────────────── */
/*  Initial Data                                        */
/* ──────────────────────────────────────────────────── */

// Data diambil dari API

/* ──────────────────────────────────────────────────── */
/*  Avatar Helper                                       */
/* ──────────────────────────────────────────────────── */

function getInitials(name: string) {
  return name
    .replace(/[^a-zA-Z\s]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
];

interface AvatarProps {
  teacher: TeacherData;
  size?: "sm" | "md" | "xl";
  colorIdx?: number;
}

function Avatar({ teacher, size = "md", colorIdx = 0 }: AvatarProps) {
  const dims =
    size === "sm"
      ? "w-10 h-10 text-sm"
      : size === "xl"
      ? "w-24 h-24 text-2xl"
      : "w-14 h-14 text-base";

  const color = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];

  if (teacher.photoUrl) {
    return (
      <div
        className={`${dims} rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-md`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={teacher.photoUrl}
          alt={teacher.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims} rounded-2xl ${color} flex items-center justify-center font-bold shrink-0 border-2 border-white shadow-md`}
    >
      {getInitials(teacher.name)}
    </div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Sub-component: InfoRow                              */
/* ──────────────────────────────────────────────────── */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start space-x-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
          {label}
        </p>
        <p className="text-slate-800 font-semibold leading-snug mt-0.5 break-words text-xs">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────── */
/*  Main Page                                           */
/* ──────────────────────────────────────────────────── */

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("SEMUA");

  // Fetch teachers effect
  React.useEffect(() => {
    fetchTeachers();
  }, [searchQuery, filterStatus]);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const url = new URL("/api/teachers", window.location.origin);
      if (searchQuery) url.searchParams.set("search", searchQuery);
      if (filterStatus) url.searchParams.set("status", filterStatus);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && data.data) {
        setTeachers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch teachers", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [detailTeacher, setDetailTeacher] = useState<TeacherData | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Photo upload
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    email: "",
    phone: "",
    role: "Tutor Mata Pelajaran Umum & Kesetaraan",
    specialization: "",
    classes: "",
    address: "",
    city: "Kota Bandung",
    province: "Jawa Barat",
    status: "AKTIF",
    joinDate: new Date().toISOString().split("T")[0],
    gender: "L",
    birthPlace: "",
    birthDate: "",
    photoUrl: "",
    lastEducation: "S1",
    educationStatus: "Sudah Lulus",
    universityName: "",
    graduationYear: "",
    experienceYears: 1,
    skills: "",
    religion: "Islam",
    motherName: "",
    maritalStatus: "Belum menikah",
    linkedinUrl: "",
    hobbies: "",
    lifeMotto: "",
    bankName: "",
    bankAccountNumber: "",
    cvResumeUrl: "",
    ktpUrl: "",
    kkUrl: "",
    diplomaUrl: "",
    transcriptUrl: "",
    npwpUrl: "",
  });

  const liveAge = calculateDetailedAge(formData.birthDate);

  /* ── helpers ── */
  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.role.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.specialization ?? "").toLowerCase().includes(q)
    );
  });

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Berkas harus berupa gambar (JPG, PNG, dll)", "error");
      return;
    }
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        setPhotoPreview(data.url);
        setFormData((prev) => ({ ...prev, photoUrl: data.url }));
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const resStr = ev.target?.result as string;
          setPhotoPreview(resStr);
          setFormData((prev) => ({ ...prev, photoUrl: resStr }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const resStr = ev.target?.result as string;
        setPhotoPreview(resStr);
        setFormData((prev) => ({ ...prev, photoUrl: resStr }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast("Nama dan Email pendidik wajib diisi!", "error");
      return;
    }
    
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setPhotoPreview(null);
        setFormData({
          name: "",
          nip: "",
          email: "",
          phone: "",
          role: "Tutor Mata Pelajaran Umum & Kesetaraan",
          specialization: "",
          classes: "",
          address: "",
          city: "Kota Bandung",
          province: "Jawa Barat",
          status: "AKTIF",
          joinDate: new Date().toISOString().split("T")[0],
          gender: "L",
          birthPlace: "",
          birthDate: "",
          photoUrl: "",
          lastEducation: "S1",
          educationStatus: "Sudah Lulus",
          universityName: "",
          graduationYear: "",
          experienceYears: 1,
          skills: "",
          religion: "Islam",
          motherName: "",
          maritalStatus: "Belum menikah",
          linkedinUrl: "",
          hobbies: "",
          lifeMotto: "",
          bankName: "",
          bankAccountNumber: "",
          cvResumeUrl: "",
          ktpUrl: "",
          kkUrl: "",
          diplomaUrl: "",
          transcriptUrl: "",
          npwpUrl: "",
        });
        showToast(`Pendidik ${formData.name} berhasil ditambahkan!`);
        fetchTeachers();
      } else {
        showToast(data.error || "Gagal menambahkan guru.", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem.", "error");
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (confirm(`Nonaktifkan data pendidik ${name}?`)) {
      try {
        const res = await fetch(`/api/teachers?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          if (detailTeacher?.id === id) setDetailTeacher(null);
          showToast(`Data pendidik ${name} berhasil dinonaktifkan.`);
          fetchTeachers();
        } else {
          showToast(data.error || "Gagal menonaktifkan guru.", "error");
        }
      } catch (e) {
        showToast("Terjadi kesalahan sistem.", "error");
      }
    }
  };

  /* ──────────────────────────────────────────────────── */
  /*  Render                                              */
  /* ──────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Toast ── */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl border shadow-elevated flex items-center space-x-3 text-xs font-bold ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Data Pendidik &amp; Tutor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar tenaga pendidik dan tutor kesetaraan PKBM Askara.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <CsvImportExport
            exportData={filteredTeachers}
            exportFilename={`data_pendidik_${new Date().toISOString().slice(0, 10)}.csv`}
            templateHeaders={[
              "fullName", "email", "phone", "nik", "positionApplied", "majorStudy", "address", "gender", "birthPlace", "birthDate", "lastEducation"
            ]}
            onImport={async (data) => {
              try {
                const res = await fetch("/api/teachers/bulk", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ data }),
                });
                const result = await res.json();
                if (result.success) {
                  showToast(result.message);
                  fetchTeachers();
                } else {
                  showToast(result.error, "error");
                }
              } catch (e) {
                showToast("Gagal melakukan import data", "error");
              }
            }}
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pendidik</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Cari nama, jabatan, atau spesialisasi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm"
        />
      </div>

      {/* ── Content: Cards + Detail Panel ── */}
      <div className="flex gap-5 items-start">
        {/* ── Teacher Cards Grid ── */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((tc, idx) => (
              <div
                key={tc.id}
                onClick={() =>
                  setDetailTeacher(
                    detailTeacher?.id === tc.id ? null : tc
                  )
                }
                className={`bg-white rounded-2xl border shadow-soft p-5 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-elevated ${
                  detailTeacher?.id === tc.id
                    ? "border-emerald-400 ring-2 ring-emerald-200"
                    : "border-slate-200/80"
                }`}
              >
                {/* Avatar + Status badge */}
                <div className="flex items-start justify-between mb-3">
                  <Avatar teacher={tc} size="md" colorIdx={idx} />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tc.status === "AKTIF"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {tc.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
                  {tc.name}
                </h3>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {tc.role}
                </p>

                {/* Quick info */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{tc.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{tc.classes}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{tc.phone}</span>
                  </div>
                </div>

                {/* Actions row */}
                <div
                  className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      setDetailTeacher(
                        detailTeacher?.id === tc.id ? null : tc
                      )
                    }
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 transition"
                  >
                    <span>Lihat Detail</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(tc.id, tc.name)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                    title="Hapus Pendidik"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-16 text-slate-400 text-sm">
              Tidak ditemukan data pendidik yang cocok.
            </div>
          )}
        </div>

        {/* ── Detail Modal (Centered) ── */}
        {detailTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Hero */}
              <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-6 text-white text-center relative shrink-0">
              <button
                onClick={() => setDetailTeacher(null)}
                className="absolute top-3 right-3 text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 mb-3 rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl bg-emerald-800 flex justify-center items-center">
                    {detailTeacher.photoUrl ? (
                      <img
                        src={detailTeacher.photoUrl}
                        alt={detailTeacher.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">{getInitials(detailTeacher.name)}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{detailTeacher.name}</h3>
                  <p className="text-emerald-200 text-sm mt-0.5 font-semibold">{detailTeacher.role}</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/30 text-emerald-100 rounded-full text-xs font-bold border border-emerald-400/30">
                    {detailTeacher.status}
                  </div>
                </div>
              </div>

              {/* Modal Detail Body (Stacked Sections - Matching Verifikasi Pendaftar standard) */}
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[72vh] text-xs bg-slate-50/50">
                
                {/* 1. SEKSI POSISI & KUALIFIKASI MENGAJAR */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span>1. Posisi & Kualifikasi Tenaga Pendidik</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Peran / Jabatan Mengajar</span>
                      <span className="font-extrabold text-emerald-700 text-xs sm:text-sm block mt-0.5">
                        {detailTeacher.role}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">NIP / NUPTK</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{detailTeacher.nip || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tanggal Bergabung (TMT)</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {detailTeacher.joinDate ? new Date(detailTeacher.joinDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Spesialisasi Bidang Studi / Mapel</span>
                      <span className="font-bold text-emerald-800 text-xs block mt-0.5">{detailTeacher.specialization || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Rombel / Kelas yang Diampu</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">{detailTeacher.classes || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Pendidikan Terakhir</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {detailTeacher.lastEducation || "-"} {detailTeacher.majorStudy ? `(${detailTeacher.majorStudy})` : ""} {detailTeacher.educationStatus ? ` - ${detailTeacher.educationStatus}` : ""}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Asal Kampus / Universitas</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5 truncate">
                        {detailTeacher.universityName || "-"} {detailTeacher.graduationYear ? `Lulus ${detailTeacher.graduationYear}` : ""}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Pengalaman Mengajar</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {detailTeacher.experienceYears !== undefined ? `${detailTeacher.experienceYears} Tahun` : "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-3">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Keahlian Tambahan & Spesialisasi</span>
                      <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed">
                        {detailTeacher.skills || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. SEKSI IDENTITAS LENGKAP & BIODATA DIRI */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>2. Identitas Lengkap & Biodata Pribadi</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Lengkap Pendidik</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">{detailTeacher.name}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Jenis Kelamin</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailTeacher.gender === "P" ? "Perempuan (P)" : "Laki-laki (L)"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Usia Terhitung</span>
                      <span className="font-bold text-emerald-700 text-xs block mt-0.5">
                        {calculateDetailedAge(detailTeacher.birthDate)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tempat, Tanggal Lahir</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailTeacher.birthPlace || "-"}, {detailTeacher.birthDate ? new Date(detailTeacher.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Agama</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailTeacher.religion || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Status Pernikahan</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailTeacher.maritalStatus || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Ibu Kandung</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailTeacher.motherName || "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between sm:col-span-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">No. WhatsApp / HP</span>
                        <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{detailTeacher.phone || "-"}</span>
                      </div>
                      {detailTeacher.phone && detailTeacher.phone !== "-" && (
                        <a
                          href={`https://wa.me/${detailTeacher.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition"
                          title="Kirim Pesan WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between sm:col-span-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Email Pendidik</span>
                        <span className="font-semibold text-slate-900 text-xs block mt-0.5 truncate max-w-[150px]">{detailTeacher.email || "-"}</span>
                      </div>
                      {detailTeacher.email && detailTeacher.email !== "-" && (
                        <a
                          href={`mailto:${detailTeacher.email}`}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition"
                          title="Kirim Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. SEKSI ALAMAT DOMISILI LENGKAP */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>3. Alamat Domisili Lengkap Sesuai KTP / KK</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-3">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Alamat Jalan / Dusun / Gang</span>
                      <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed">
                        {detailTeacher.address || "-"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">RT / RW</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailTeacher.rtRw || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Kelurahan / Desa</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailTeacher.kelurahan || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Kecamatan</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailTeacher.kecamatan || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Kota / Kabupaten</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailTeacher.city || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Provinsi & Kode Pos</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailTeacher.province || "Jawa Barat"} {detailTeacher.postalCode ? `(${detailTeacher.postalCode})` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. SEKSI MINAT, SOSIAL MEDIA & PAYROLL */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>4. Sosial Media, Rekening & Info Lainnya</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Sosial Media & Portofolio</span>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {detailTeacher.linkedinUrl && (
                          <a
                            href={detailTeacher.linkedinUrl.startsWith("http") ? detailTeacher.linkedinUrl : `https://${detailTeacher.linkedinUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 flex items-center gap-1.5 transition text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>LinkedIn / Portofolio Web</span>
                          </a>
                        )}
                        <span className="font-medium text-slate-700 text-xs">{detailTeacher.socialMedia || (!detailTeacher.linkedinUrl ? "-" : "")}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Hobi & Minat</span>
                      <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed">
                        {detailTeacher.hobbies || "-"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Motto Hidup</span>
                      <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed italic">
                        {detailTeacher.lifeMotto ? `"${detailTeacher.lifeMotto}"` : "-"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Data Rekening Bank (Payroll)</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                        {detailTeacher.bankName || "-"} - {detailTeacher.bankAccountNumber || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. SEKSI DOKUMEN & BERKAS PERSYARATAN */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>5. Dokumen & Berkas Lamaran Pendidik</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[
                      { label: "Curriculum Vitae (CV) & Lamaran", url: detailTeacher.cvResumeUrl, icon: "📄" },
                      { label: "KTP Asli Pendidik", url: detailTeacher.ktpUrl, icon: "🪪" },
                      { label: "Ijazah Pendidikan Terakhir", url: detailTeacher.diplomaUrl, icon: "🎓" },
                      { label: "Transkrip Nilai / SKHUN", url: detailTeacher.transcriptUrl, icon: "📊" },
                      { label: "Kartu Keluarga (KK)", url: detailTeacher.kkUrl, icon: "👨‍👩‍👧‍👦" },
                      { label: "NPWP", url: detailTeacher.npwpUrl, icon: "💳" },
                    ].map((doc, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{doc.icon}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">{doc.label}</span>
                            <span className={`text-[10px] font-semibold ${doc.url ? "text-emerald-600" : "text-slate-400"}`}>
                              {doc.url ? "✓ Terunggah" : "Belum diunggah"}
                            </span>
                          </div>
                        </div>
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-emerald-800 border border-slate-200 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1 shadow-2xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka</span>
                          </a>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-medium shrink-0">
                            -
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                  <Link
                    href={`/admin/teachers/sk?id=${detailTeacher.id}`}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition flex items-center justify-center space-x-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak SK Pendidik</span>
                  </Link>
                  <button
                    onClick={() => handleDeleteTeacher(detailTeacher.id, detailTeacher.name)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition flex items-center justify-center space-x-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="text-xs text-slate-500 flex items-center justify-between">
        <span>
          Menampilkan <strong>{filteredTeachers.length}</strong> dari{" "}
          <strong>{teachers.length}</strong> tenaga pendidik
        </span>
        <span className="text-[11px] text-slate-400">
          PKBM Askara • TA 2025/2026
        </span>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/*  MODAL: TAMBAH PENDIDIK BARU                        */}
      {/* ════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-6 text-white relative shrink-0 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-200">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Tambah Tenaga Pendidik / Tutor Baru
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Lengkapi seluruh identitas, bidang pengajaran, riwayat pendidikan, dan berkas tutor
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setPhotoPreview(null);
                }}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs bg-slate-50/50">
              {/* 1. SEKSI PENEMPATAN & POSISI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <span>1. Posisi & Penempatan Mengajar</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Peran / Jabatan Dilamar <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Contoh: Tutor Matematika & IPA"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Spesialisasi Bidang / Mapel</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="Contoh: Matematika & Sains"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Rombel / Kelas yang Diampu</label>
                    <input
                      type="text"
                      value={formData.classes}
                      onChange={(e) => setFormData({ ...formData, classes: e.target.value })}
                      placeholder="Contoh: Paket B & C (Kelas X, XI)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Pengalaman Mengajar (Tahun)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                      placeholder="Contoh: 2"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Tanggal Bergabung / TMT</label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Status Keaktifan</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-semibold"
                    >
                      <option value="AKTIF">Aktif Mengajar</option>
                      <option value="NON-AKTIF">Non-Aktif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. SEKSI IDENTITAS PRIBADI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>2. Identitas Lengkap & Biodata Pribadi</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Nama Lengkap Beserta Gelar <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Drs. Ahmad Fauzi, M.Pd."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">NIK / NIP (opsional)</label>
                    <input
                      type="text"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      placeholder="16 digit NIK"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.birthPlace}
                      onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                      placeholder="Kota Kelahiran"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700">Tanggal Lahir</label>
                      {formData.birthDate && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          {liveAge}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Agama</label>
                    <select
                      value={formData.religion}
                      onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen Protestan">Kristen Protestan</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Nama Ibu Kandung</label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      placeholder="Nama Ibu Kandung"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Status Pernikahan</label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="Belum menikah">Belum menikah</option>
                      <option value="Menikah">Menikah</option>
                      <option value="Duda/Janda">Duda / Janda</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. SEKSI KONTAK & DOMISILI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>3. Kontak & Alamat Domisili</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Email Utama <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nama@askara.sch.id"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">No. Telepon / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1.5">Alamat Domisili Lengkap</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Jl. Nama Jalan No. XX, RT/RW, Kelurahan..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Kota Bandung"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Provinsi</label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="Jawa Barat"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1.5">Tautan Profil LinkedIn / Medsos</label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. SEKSI PENDIDIKAN & AKADEMIK */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>4. Riwayat Pendidikan & Akademik</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Pendidikan Terakhir</label>
                    <select
                      value={formData.lastEducation}
                      onChange={(e) => setFormData({ ...formData, lastEducation: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="D3">Diploma (D3)</option>
                      <option value="S1">Sarjana (S1 / D4)</option>
                      <option value="S2">Magister (S2)</option>
                      <option value="S3">Doktor (S3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Status Kelulusan</label>
                    <select
                      value={formData.educationStatus}
                      onChange={(e) => setFormData({ ...formData, educationStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="Sudah Lulus">Sudah Lulus</option>
                      <option value="Sedang Menempuh">Sedang Menempuh Pendidikan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Asal Kampus / Universitas</label>
                    <input
                      type="text"
                      value={formData.universityName}
                      onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                      placeholder="Contoh: Universitas Pendidikan Indonesia"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Tahun Kelulusan</label>
                    <input
                      type="text"
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                      placeholder="Contoh: 2021"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1.5">Keahlian & Keterampilan Khusus</label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="Contoh: Pembelajaran Interaktif, Media Digital, Kurikulum Merdeka"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. SEKSI REKENING & PROFIL PRIBADI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>5. Data Rekening Payroll & Profil Pribadi</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Nama Bank</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Contoh: BCA / BSI / Mandiri"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Nomor Rekening Bank</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      placeholder="Nomor Rekening"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Hobi & Minat</label>
                    <input
                      type="text"
                      value={formData.hobbies}
                      onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                      placeholder="Menulis, Eksperimen sains..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Motto Hidup</label>
                    <input
                      type="text"
                      value={formData.lifeMotto}
                      onChange={(e) => setFormData({ ...formData, lifeMotto: e.target.value })}
                      placeholder="Motto hidup..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white italic"
                    />
                  </div>
                </div>
              </div>

              {/* 6. SEKSI FOTO PROFIL */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>6. Foto Tenaga Pendidik</span>
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                        <span className="text-[9px] text-slate-400 block mt-0.5">Belum ada foto</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih Berkas Foto</span>
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setFormData((prev) => ({ ...prev, photoUrl: "" }));
                          }}
                          className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 font-bold transition"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={formData.photoUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, photoUrl: e.target.value });
                        setPhotoPreview(e.target.value);
                      }}
                      placeholder="Atau masukkan tautan URL foto resmi (https://...)"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 7. SEKSI UNGGAH BERKAS DOKUMEN PERSYARATAN */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>7. Unggah Berkas & Dokumen Persyaratan Pendidik</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">Bisa Upload File atau Foto Kamera Langsung</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DualUploadInput
                    label="Curriculum Vitae (CV) & Surat Lamaran"
                    value={formData.cvResumeUrl}
                    onChange={(url) => setFormData({ ...formData, cvResumeUrl: url })}
                    description="Format PDF, DOC, DOCX, JPG, PNG (Maks 10MB)"
                  />
                  <DualUploadInput
                    label="KTP Asli Pendidik"
                    value={formData.ktpUrl}
                    onChange={(url) => setFormData({ ...formData, ktpUrl: url })}
                    description="Foto KTP Asli jelas & terbaca (Maks 10MB)"
                  />
                  <DualUploadInput
                    label="Ijazah Pendidikan Terakhir"
                    value={formData.diplomaUrl}
                    onChange={(url) => setFormData({ ...formData, diplomaUrl: url })}
                    description="Ijazah asli atau legalisir (Maks 10MB)"
                  />
                  <DualUploadInput
                    label="Transkrip Nilai / SKHUN"
                    value={formData.transcriptUrl}
                    onChange={(url) => setFormData({ ...formData, transcriptUrl: url })}
                    description="Transkrip nilai akademik lengkap (Maks 10MB)"
                  />
                  <DualUploadInput
                    label="Kartu Keluarga (KK)"
                    value={formData.kkUrl}
                    onChange={(url) => setFormData({ ...formData, kkUrl: url })}
                    description="Scan atau Foto Kartu Keluarga Asli (Maks 10MB)"
                  />
                  <DualUploadInput
                    label="NPWP (Nomor Pokok Wajib Pajak)"
                    value={formData.npwpUrl}
                    onChange={(url) => setFormData({ ...formData, npwpUrl: url })}
                    description="Kartu NPWP (Opsional)"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 sm:p-6 border-t border-slate-200 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setPhotoPreview(null);
                  }}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/20 flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Data Pendidik</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
