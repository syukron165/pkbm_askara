"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  User,
  Phone,
  BookOpen,
  GraduationCap,
  Users,
  Eye,
  ChevronRight,
  MapPin,
  Mail,
  CalendarDays,
  School,
  IdCard,
  BadgeInfo,
  Contact,
  Briefcase,
  Coins,
  FileCheck,
} from "lucide-react";
import CsvImportExport from "@/components/CsvImportExport";
import { calculateDetailedAge } from "@/lib/public-registration-db";

/* ──────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ──────────────────────────────────────────────────────────── */

interface StudentData {
  id: string;
  nisn: string;
  nik?: string;
  name: string;
  gender: "L" | "P";
  packet: "Paket A" | "Paket B" | "Paket C";
  class: string;
  parent: string;
  phone: string;
  status: "AKTIF" | "LULUS" | "MUTASI";
  photoUrl?: string;
  address?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  birthPlace?: string;
  birthDate?: string;
  email?: string;
  religion?: string;
  numberOfSiblings?: number;
  heightCm?: number;
  weightKg?: number;
  medicalHistory?: string;
  registrationTrack?: string;
  previousSchool?: string;
  previousSchoolAddress?: string;
  mutationFrom?: string;
  parentName?: string;
  motherName?: string;
  guardianName?: string;
  parentPhone?: string;
  parentJob?: string;
  motherJob?: string;
  guardianJob?: string;
  fatherIncome?: string;
  motherIncome?: string;
}

/* ──────────────────────────────────────────────────────────── */
/*  Initial Data                                                */
/* ──────────────────────────────────────────────────────────── */

const INITIAL_STUDENTS: StudentData[] = [];

/* ──────────────────────────────────────────────────────────── */
/*  Avatar Helper                                               */
/* ──────────────────────────────────────────────────────────── */

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function getAvatarColor(gender: "L" | "P") {
  return gender === "P"
    ? "bg-pink-100 text-pink-700"
    : "bg-sky-100 text-sky-700";
}

interface AvatarProps {
  student: StudentData;
  size?: "sm" | "md" | "xl";
}

function Avatar({ student, size = "md" }: AvatarProps) {
  const dims =
    size === "sm"
      ? "w-8 h-8 text-[11px]"
      : size === "xl"
      ? "w-24 h-24 text-2xl"
      : "w-10 h-10 text-sm";

  if (student.photoUrl) {
    return (
      <div
        className={`${dims} rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={student.photoUrl}
          alt={student.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims} rounded-full ${getAvatarColor(
        student.gender
      )} flex items-center justify-center font-bold shrink-0 border-2 border-white shadow-sm`}
    >
      {getInitials(student.name)}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Main Page Component                                         */
/* ──────────────────────────────────────────────────────────── */

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/students");
      const json = await res.json();
      if (json.success) setStudents(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("SEMUA");

  // Modal / Panel state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentData | null>(null);

  // Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Add Student form
  const [formData, setFormData] = useState({
    nisn: "",
    nik: "",
    name: "",
    gender: "L" as "L" | "P",
    packet: "Paket C" as StudentData["packet"],
    class: "Kelas X Merdeka",
    registrationTrack: "Reguler",
    previousSchool: "",
    previousSchoolAddress: "",
    mutationFrom: "",
    religion: "Islam",
    birthPlace: "",
    birthDate: "",
    numberOfSiblings: 0,
    heightCm: 160,
    weightKg: 50,
    medicalHistory: "",
    email: "",
    phone: "",
    address: "",
    rtRw: "",
    kelurahan: "",
    kecamatan: "",
    city: "Kota Bandung",
    province: "Jawa Barat",
    postalCode: "",
    parent: "",
    parentName: "",
    parentJob: "",
    fatherIncome: "Rp 3.000.000 - Rp 5.000.000",
    motherName: "",
    motherJob: "",
    motherIncome: "Rp 1.000.000 - Rp 3.000.000",
    guardianName: "",
    guardianJob: "",
    parentPhone: "",
    photoUrl: "",
  });

  const liveAge = calculateDetailedAge(formData.birthDate);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  /* ── helpers ── */
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredStudents = students.filter((st) => {
    const matchProgram =
      selectedProgram === "SEMUA" || st.packet === selectedProgram;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      st.name.toLowerCase().includes(q) ||
      st.nisn.includes(q) ||
      st.class.toLowerCase().includes(q) ||
      st.parent.toLowerCase().includes(q);
    return matchProgram && matchSearch;
  });

  /* ── Photo upload handler ── */
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

  /* ── Add student ── */
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nisn) {
      showToast("Nama siswa dan NISN wajib diisi!", "error");
      return;
    }
    try {
      const payload = {
        ...formData,
        parentName: formData.parent || formData.parentName,
      };
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setStudents([json.data, ...students]);
        setIsAddModalOpen(false);
        setFormData({
          nisn: "",
          nik: "",
          name: "",
          gender: "L",
          packet: "Paket C",
          class: "Kelas X Merdeka",
          registrationTrack: "Reguler",
          previousSchool: "",
          previousSchoolAddress: "",
          mutationFrom: "",
          religion: "Islam",
          birthPlace: "",
          birthDate: "",
          numberOfSiblings: 0,
          heightCm: 160,
          weightKg: 50,
          medicalHistory: "",
          email: "",
          phone: "",
          address: "",
          rtRw: "",
          kelurahan: "",
          kecamatan: "",
          city: "Kota Bandung",
          province: "Jawa Barat",
          postalCode: "",
          parent: "",
          parentName: "",
          parentJob: "",
          fatherIncome: "Rp 3.000.000 - Rp 5.000.000",
          motherName: "",
          motherJob: "",
          motherIncome: "Rp 1.000.000 - Rp 3.000.000",
          guardianName: "",
          guardianJob: "",
          parentPhone: "",
          photoUrl: "",
        });
        setPhotoPreview(null);
        showToast(json.message || `Peserta didik berhasil ditambahkan!`);
      } else {
        showToast(json.error || "Gagal menyimpan data", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  /* ── Delete ── */
  const handleDeleteStudent = async (id: string, name: string) => {
    if (confirm(`Hapus data siswa ${name}?`)) {
      try {
        const res = await fetch(`/api/students?id=${id}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
          setStudents((prev) => prev.filter((s) => s.id !== id));
          if (detailStudent?.id === id) setDetailStudent(null);
          showToast(json.message || `Data siswa ${name} berhasil dihapus.`);
        } else {
          showToast(json.error || "Gagal menghapus", "error");
        }
      } catch (e) {
        showToast("Terjadi kesalahan", "error");
      }
    }
  };

  /* ──────────────────────────────────────────────────────── */
  /*  Render                                                  */
  /* ──────────────────────────────────────────────────────── */

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
            Data Peserta Didik (Siswa)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen data induk siswa Paket A, Paket B, dan Paket C PKBM Askara.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <CsvImportExport
            exportData={filteredStudents}
            exportFilename={`data_siswa_${new Date().toISOString().slice(0, 10)}.csv`}
            templateHeaders={[
              "fullName", "nisn", "nik", "email", "phone", "gender", "birthPlace", "birthDate", "address", "packetType", "currentGrade", "parentName", "parentPhone"
            ]}
            onImport={async (data) => {
              try {
                const res = await fetch("/api/students/bulk", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ data }),
                });
                const result = await res.json();
                if (result.success) {
                  showToast(result.message);
                  fetchStudents();
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
            <span>Tambah Siswa Baru</span>
          </button>
        </div>
      </div>

      {/* ── Main Content (Table + Detail Panel) ── */}
      <div className="flex gap-5 items-start">
        {/* ── Table Card ── */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 pb-4 border-b border-slate-100">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama siswa, NISN, wali, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                {["SEMUA", "Paket A", "Paket B", "Paket C"].map((pkg) => (
                  <button
                    key={pkg}
                    onClick={() => setSelectedProgram(pkg)}
                    className={`px-3 py-1.5 rounded-md transition text-[11px] ${
                      selectedProgram === pkg
                        ? "bg-white text-emerald-800 font-bold shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {pkg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100">
                  <th className="pb-3 font-semibold">Siswa</th>
                  <th className="pb-3 font-semibold">NISN</th>
                  <th className="pb-3 font-semibold">Program</th>
                  <th className="pb-3 font-semibold">Rombel / Kelas</th>
                  <th className="pb-3 font-semibold">Orang Tua / Wali</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => (
                    <tr
                      key={st.id}
                      onClick={() =>
                        setDetailStudent(
                          detailStudent?.id === st.id ? null : st
                        )
                      }
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        detailStudent?.id === st.id
                          ? "bg-emerald-50/60"
                          : ""
                      }`}
                    >
                      {/* Avatar + Name */}
                      <td className="py-3 pr-4">
                        <div className="flex items-center space-x-3">
                          <Avatar student={st} size="sm" />
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">
                              {st.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {st.gender === "L" ? "Laki-laki" : "Perempuan"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono font-medium text-slate-500">
                        {st.nisn}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {st.packet}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {st.class}
                      </td>
                      <td className="py-3 text-slate-500">{st.parent}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.status === "AKTIF"
                              ? "bg-emerald-100 text-emerald-800"
                              : st.status === "LULUS"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td
                        className="py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDeleteStudent(st.id, st.name)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition rounded hover:bg-rose-50"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-400"
                    >
                      Tidak ditemukan data peserta didik yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan{" "}
              <strong>{filteredStudents.length}</strong> dari{" "}
              <strong>{students.length}</strong> total peserta didik
            </span>
            <span className="text-[11px] text-slate-400">
              PKBM Askara • TA 2025/2026
            </span>
          </div>
        </div>

        {/* ── Detail Modal (Centered) ── */}
        {detailStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white text-center relative shrink-0">
                <button
                  onClick={() => setDetailStudent(null)}
                  className="absolute right-4 top-4 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 mb-3 rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl bg-indigo-800 flex justify-center items-center">
                    {detailStudent.photoUrl ? (
                      <img
                        src={detailStudent.photoUrl}
                        alt={detailStudent.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">{getInitials(detailStudent.name)}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{detailStudent.name}</h3>
                  <p className="text-indigo-200 text-sm mt-0.5 font-semibold">
                    {detailStudent.gender === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      detailStudent.status === "AKTIF"
                        ? "bg-emerald-500/30 text-emerald-100 border-emerald-400/30"
                        : detailStudent.status === "LULUS"
                        ? "bg-sky-500/30 text-sky-100 border-sky-400/30"
                        : "bg-amber-500/30 text-amber-100 border-amber-400/30"
                    }`}>
                      {detailStudent.status}
                    </span>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-100 border border-indigo-400/30">
                      {detailStudent.packet}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Detail Body (Stacked Sections) */}
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[70vh] text-xs bg-slate-50/50">
                
                {/* 1. SEKSI IDENTITAS LENGKAP & BIODATA DIRI */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Identitas Lengkap & Biodata Pribadi</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Lengkap</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.name}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">NISN</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.nisn || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">NIK</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.nik || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tempat, Tanggal Lahir</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailStudent.birthPlace || "-"}, {detailStudent.birthDate ? new Date(detailStudent.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Program Kesetaraan</span>
                      <span className="font-bold text-indigo-700 text-xs block mt-0.5">{detailStudent.packet}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Rombel / Kelas</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.class || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. SEKSI KONTAK & ALAMAT */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Kontak & Wali</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Orang Tua / Wali</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5 truncate">{detailStudent.parent || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">No. Telepon Wali</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.phone || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Email Pribadi</span>
                      <span className="font-semibold text-slate-900 text-xs block mt-0.5 truncate">{detailStudent.email || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-4">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Alamat Lengkap</span>
                      <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed">
                        {detailStudent.address || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setFormData({
                        nisn: detailStudent.nisn,
                        nik: detailStudent.nik ?? "",
                        name: detailStudent.name,
                        gender: detailStudent.gender,
                        packet: detailStudent.packet,
                        class: detailStudent.class,
                        registrationTrack: detailStudent.registrationTrack ?? "Reguler",
                        previousSchool: detailStudent.previousSchool ?? "",
                        previousSchoolAddress: detailStudent.previousSchoolAddress ?? "",
                        mutationFrom: detailStudent.mutationFrom ?? "",
                        religion: detailStudent.religion ?? "Islam",
                        birthPlace: detailStudent.birthPlace ?? "",
                        birthDate: detailStudent.birthDate ?? "",
                        numberOfSiblings: detailStudent.numberOfSiblings ?? 0,
                        heightCm: detailStudent.heightCm ?? 160,
                        weightKg: detailStudent.weightKg ?? 50,
                        medicalHistory: detailStudent.medicalHistory ?? "",
                        email: detailStudent.email && detailStudent.email !== "-" ? detailStudent.email : "",
                        phone: detailStudent.phone && detailStudent.phone !== "-" ? detailStudent.phone : "",
                        address: detailStudent.address && detailStudent.address !== "-" ? detailStudent.address : "",
                        rtRw: detailStudent.rtRw ?? "",
                        kelurahan: detailStudent.kelurahan ?? "",
                        kecamatan: detailStudent.kecamatan ?? "",
                        city: detailStudent.city ?? "Kota Bandung",
                        province: detailStudent.province ?? "Jawa Barat",
                        postalCode: detailStudent.postalCode ?? "",
                        parent: detailStudent.parent !== "-" ? detailStudent.parent : "",
                        parentName: detailStudent.parentName || (detailStudent.parent !== "-" ? detailStudent.parent : ""),
                        parentJob: detailStudent.parentJob ?? "",
                        fatherIncome: detailStudent.fatherIncome ?? "Rp 3.000.000 - Rp 5.000.000",
                        motherName: detailStudent.motherName ?? "",
                        motherJob: detailStudent.motherJob ?? "",
                        motherIncome: detailStudent.motherIncome ?? "Rp 1.000.000 - Rp 3.000.000",
                        guardianName: detailStudent.guardianName ?? "",
                        guardianJob: detailStudent.guardianJob ?? "",
                        parentPhone: detailStudent.parentPhone ?? "",
                        photoUrl: detailStudent.photoUrl ?? "",
                      });
                      setPhotoPreview(detailStudent.photoUrl ?? null);
                      setStudents((prev) => prev.filter((s) => s.id !== detailStudent.id));
                      setDetailStudent(null);
                      setIsAddModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center justify-center space-x-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Edit Data</span>
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(detailStudent.id, detailStudent.name)}
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

      {/* ════════════════════════════════════════════════════ */}
      {/*  MODAL: TAMBAH SISWA BARU                           */}
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
                    Tambah Peserta Didik Baru
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Lengkapi seluruh data program, biodata, kontak domisili, data orang tua/wali, dan foto siswa
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

            <form onSubmit={handleAddStudent} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs bg-slate-50/50">
              {/* 1. SEKSI PROGRAM & JALUR BELAJAR */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <School className="w-4 h-4 text-emerald-700" />
                  <span>1. Program & Pilihan Belajar</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Pilihan Program Kesetaraan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.packet}
                      onChange={(e) => setFormData({ ...formData, packet: e.target.value as StudentData["packet"] })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-semibold"
                    >
                      <option value="Paket A">Paket A (Setara SD)</option>
                      <option value="Paket B">Paket B (Setara SMP)</option>
                      <option value="Paket C">Paket C (Setara SMA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Jalur Pendaftaran</label>
                    <select
                      value={formData.registrationTrack}
                      onChange={(e) => setFormData({ ...formData, registrationTrack: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
                    >
                      <option value="Reguler">Reguler / Umum</option>
                      <option value="Prestasi">Prestasi / Afirmasi</option>
                      <option value="Mutasi">Mutasi / Pindahan</option>
                      <option value="Santri">Santri / Pesantren</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Rombel / Kelas Masuk</label>
                    <input
                      type="text"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      placeholder="Contoh: Kelas X Merdeka"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Asal Sekolah Terakhir</label>
                    <input
                      type="text"
                      value={formData.previousSchool}
                      onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                      placeholder="Nama SMP / MTS / SMA Asal"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Alamat Sekolah Asal / Keterangan Mutasi</label>
                    <input
                      type="text"
                      value={formData.previousSchoolAddress || formData.mutationFrom}
                      onChange={(e) => setFormData({ ...formData, previousSchoolAddress: e.target.value, mutationFrom: e.target.value })}
                      placeholder="Kota asal atau alasan pindah..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. SEKSI BIODATA PRIBADI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>2. Biodata & Identitas Peserta Didik</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Nama Lengkap Siswa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Sesuai Akta Kelahiran / Ijazah"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      NISN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.nisn}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      placeholder="10 digit NISN"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">NIK Siswa (opsional)</label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      placeholder="16 digit NIK"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as "L" | "P" })}
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
                    <label className="block font-bold text-slate-700 mb-1.5">Jml. Saudara Kandung</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.numberOfSiblings}
                      onChange={(e) => setFormData({ ...formData, numberOfSiblings: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Tinggi Badan (cm)</label>
                    <input
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                      placeholder="160"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Berat Badan (kg)</label>
                    <input
                      type="number"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                      placeholder="50"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1.5">Riwayat Penyakit / Catatan Khusus</label>
                    <input
                      type="text"
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                      placeholder="Tidak ada / Asma / Alergi..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. SEKSI KONTAK & DOMISILI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>3. Kontak & Alamat Domisili Siswa</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Email Siswa (opsional)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="siswa@mail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">No. HP / WA Siswa</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1.5">Alamat Jalan & Nomor</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Jl. Nama Jalan No. XX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">RT / RW</label>
                    <input
                      type="text"
                      value={formData.rtRw}
                      onChange={(e) => setFormData({ ...formData, rtRw: e.target.value })}
                      placeholder="001/002"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Kelurahan / Desa</label>
                    <input
                      type="text"
                      value={formData.kelurahan}
                      onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                      placeholder="Kelurahan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Kecamatan</label>
                    <input
                      type="text"
                      value={formData.kecamatan}
                      onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                      placeholder="Kecamatan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Kota Bandung"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Provinsi</label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="Jawa Barat"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. SEKSI DATA ORANG TUA & WALI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>4. Data Orang Tua & Wali</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Nama Ayah Kandung</label>
                    <input
                      type="text"
                      value={formData.parent}
                      onChange={(e) => setFormData({ ...formData, parent: e.target.value, parentName: e.target.value })}
                      placeholder="Nama Lengkap Ayah"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Pekerjaan Ayah</label>
                    <input
                      type="text"
                      value={formData.parentJob}
                      onChange={(e) => setFormData({ ...formData, parentJob: e.target.value })}
                      placeholder="PNS / Swasta / Wiraswasta"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Penghasilan Ayah</label>
                    <select
                      value={formData.fatherIncome}
                      onChange={(e) => setFormData({ ...formData, fatherIncome: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="< Rp 1.000.000">&lt; Rp 1.000.000</option>
                      <option value="Rp 1.000.000 - Rp 3.000.000">Rp 1.000.000 - Rp 3.000.000</option>
                      <option value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                      <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Nama Ibu Kandung</label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      placeholder="Nama Lengkap Ibu"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Pekerjaan Ibu</label>
                    <input
                      type="text"
                      value={formData.motherJob}
                      onChange={(e) => setFormData({ ...formData, motherJob: e.target.value })}
                      placeholder="Ibu Rumah Tangga / Karyawan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">No. Telepon / WA Orang Tua</label>
                    <input
                      type="text"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Nama Wali (opsional)</label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      placeholder="Nama Wali jika ada"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Pekerjaan Wali (opsional)</label>
                    <input
                      type="text"
                      value={formData.guardianJob}
                      onChange={(e) => setFormData({ ...formData, guardianJob: e.target.value })}
                      placeholder="Pekerjaan Wali"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. SEKSI FOTO PROFIL SISWA */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>5. Foto Profil Peserta Didik</span>
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
                  <span>Simpan Data Siswa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/*  MODAL: IMPORT CSV                                  */}
      {/* ════════════════════════════════════════════════════ */}
      {/*  Old manual modal import CSV has been removed as it uses CsvImportExport  */}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Sub-component: InfoRow for detail panel                     */
/* ──────────────────────────────────────────────────────────── */

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
        <p className="text-slate-800 font-semibold leading-snug mt-0.5 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}
