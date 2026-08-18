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
} from "lucide-react";
import Link from "next/link";
import CsvImportExport from "@/components/CsvImportExport";

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
  joinDate?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  lastEducation?: string;
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
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null);
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
    role: "Tutor",
    specialization: "",
    classes: "",
    address: "",
    status: "AKTIF",
    joinDate: "",
    gender: "L",
    birthPlace: "",
    birthDate: "",
  });

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Berkas harus berupa gambar (JPG, PNG, dll)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
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
        setFormData({ name: "", nip: "", role: "Tutor", email: "", phone: "", classes: "", specialization: "", address: "", joinDate: "", status: "AKTIF", gender: "L", birthPlace: "", birthDate: "" });
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

        {/* ── Detail Side Panel ── */}
        {detailTeacher && (
          <div className="w-72 shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-elevated overflow-hidden">
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-slate-800 to-emerald-900 px-5 pt-8 pb-14 text-center">
              <button
                onClick={() => setDetailTeacher(null)}
                className="absolute top-3 right-3 text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex justify-center">
                {detailTeacher.photoUrl ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/30 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detailTeacher.photoUrl}
                      alt={detailTeacher.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-emerald-700/40 border-4 border-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {getInitials(detailTeacher.name)}
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-sm font-bold text-white leading-snug px-2">
                {detailTeacher.name}
              </h3>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                {detailTeacher.role}
              </p>
              <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/30 text-emerald-100 border border-emerald-400/40">
                {detailTeacher.status}
              </span>
            </div>

            {/* Info card */}
            <div className="-mt-8 mx-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              {detailTeacher.nip && (
                <InfoRow
                  icon={<User className="w-3.5 h-3.5 text-slate-500" />}
                  label="NIP / NIK"
                  value={<span className="font-mono text-[11px]">{detailTeacher.nip}</span>}
                />
              )}
              {(detailTeacher.birthPlace || detailTeacher.birthDate) && (
                <InfoRow
                  icon={<User className="w-3.5 h-3.5 text-slate-500" />}
                  label="Tempat, Tanggal Lahir"
                  value={`${detailTeacher.birthPlace ? detailTeacher.birthPlace + ', ' : ''}${
                    detailTeacher.birthDate ? new Date(detailTeacher.birthDate).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" }
                    ) : ''
                  }`}
                />
              )}
              <InfoRow
                icon={<GraduationCap className="w-3.5 h-3.5 text-indigo-600" />}
                label="Spesialisasi"
                value={detailTeacher.specialization || "-"}
              />
              <InfoRow
                icon={<BookOpen className="w-3.5 h-3.5 text-emerald-600" />}
                label="Mengajar"
                value={detailTeacher.classes}
              />
              <InfoRow
                icon={<Mail className="w-3.5 h-3.5 text-sky-600" />}
                label="Email"
                value={
                  <a
                    href={`mailto:${detailTeacher.email}`}
                    className="text-sky-600 hover:underline"
                  >
                    {detailTeacher.email}
                  </a>
                }
              />
              <InfoRow
                icon={<Phone className="w-3.5 h-3.5 text-emerald-600" />}
                label="No. Telepon"
                value={<span className="font-mono">{detailTeacher.phone}</span>}
              />
              {detailTeacher.joinDate && (
                <InfoRow
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                  label="Bergabung Sejak"
                  value={new Date(detailTeacher.joinDate).toLocaleDateString(
                    "id-ID",
                    { day: "numeric", month: "long", year: "numeric" }
                  )}
                />
              )}
              {detailTeacher.address && (
                <InfoRow
                  icon={<ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  label="Alamat"
                  value={detailTeacher.address}
                />
              )}

              {/* Data Akademik & Lainnya */}
              <div className="pt-2 mt-2 border-t border-slate-100 space-y-3">
                {(detailTeacher.lastEducation || detailTeacher.universityName) && (
                  <InfoRow
                    icon={<GraduationCap className="w-3.5 h-3.5 text-indigo-600" />}
                    label="Pendidikan & Kampus"
                    value={
                      <>
                        {detailTeacher.lastEducation || "-"} <br/>
                        {detailTeacher.universityName || "-"}
                        {detailTeacher.graduationYear ? ` (Lulus ${detailTeacher.graduationYear})` : ""}
                      </>
                    }
                  />
                )}
                {detailTeacher.experienceYears !== undefined && (
                  <InfoRow
                    icon={<User className="w-3.5 h-3.5 text-slate-500" />}
                    label="Pengalaman Mengajar"
                    value={`${detailTeacher.experienceYears} Tahun`}
                  />
                )}
                {detailTeacher.skills && (
                  <InfoRow
                    icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    label="Keahlian Tambahan"
                    value={detailTeacher.skills}
                  />
                )}
                {detailTeacher.religion && (
                  <InfoRow
                    icon={<User className="w-3.5 h-3.5 text-slate-500" />}
                    label="Agama & Status"
                    value={`${detailTeacher.religion} - ${detailTeacher.maritalStatus || "-"}`}
                  />
                )}
                {(detailTeacher.bankName || detailTeacher.bankAccountNumber) && (
                  <InfoRow
                    icon={<BookOpen className="w-3.5 h-3.5 text-slate-500" />}
                    label="Rekening Payroll"
                    value={`${detailTeacher.bankName || "-"} - ${detailTeacher.bankAccountNumber || "-"}`}
                  />
                )}
                {detailTeacher.hobbies && (
                  <InfoRow
                    icon={<User className="w-3.5 h-3.5 text-slate-500" />}
                    label="Hobi / Minat"
                    value={<span className="italic">"{detailTeacher.hobbies}"</span>}
                  />
                )}
              </div>
            </div>

            {/* Panel actions */}
            <div className="p-4 pt-3 grid grid-cols-1 gap-2">
              <Link
                href={`/admin/teachers/sk?id=${detailTeacher.id}`}
                className="text-[11px] py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition flex items-center justify-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak SK Pendidik</span>
              </Link>
              <button
                onClick={() =>
                  handleDeleteTeacher(detailTeacher.id, detailTeacher.name)
                }
                className="text-[11px] py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition flex items-center justify-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Data Pendidik</span>
              </button>
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
      {/*  MODAL: TAMBAH PENDIDIK                             */}
      {/* ════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tambah Tenaga Pendidik Baru
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lengkapi data identitas dan foto pendidik
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setPhotoPreview(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="p-6 text-xs space-y-5">
              {/* ── FOTO PROFIL ── */}
              <div className="flex items-start space-x-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-200 flex items-center justify-center">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">Foto Profil Pendidik</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
                    Unggah foto resmi pendidik berformat JPG atau PNG. Rasio 3×4 disarankan.
                  </p>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="teacher-photo-upload"
                  />
                  <label
                    htmlFor="teacher-photo-upload"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg font-bold cursor-pointer transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{photoPreview ? "Ganti Foto" : "Pilih Foto..."}</span>
                  </label>
                </div>
              </div>

              {/* ── DATA POKOK ── */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Identitas Pendidik
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Lengkap (beserta gelar) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Drs. Ahmad Fauzi, M.Pd."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">NIK / NIP (opsional)</label>
                      <input
                        type="text"
                        placeholder="16 angka NIK atau 18 angka NIP"
                        value={formData.nip}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tanggal Bergabung</label>
                      <input
                        type="date"
                        value={formData.joinDate}
                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        placeholder="Kota Kelahiran"
                        value={formData.birthPlace}
                        onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Jabatan / Peran</label>
                      <input
                        type="text"
                        placeholder="Contoh: Tutor Matematika"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Spesialisasi Bidang</label>
                      <input
                        type="text"
                        placeholder="Contoh: Matematika & Statistika"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── KONTAK ── */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Kontak &amp; Penugasan
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="nama@askara.sch.id"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">No. Telepon</label>
                      <input
                        type="text"
                        placeholder="0812-xxxx-xxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rombel / Kelas yang Diajarkan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Paket C (Kelas X, XI, XII)"
                      value={formData.classes}
                      onChange={(e) => setFormData({ ...formData, classes: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                    <input
                      type="text"
                      placeholder="Jl. Nama Jalan No. X, Kota..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* ── Submit ── */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setPhotoPreview(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition shadow-sm flex items-center space-x-1.5"
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
