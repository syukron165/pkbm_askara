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
} from "lucide-react";

/* ──────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ──────────────────────────────────────────────────────────── */

interface StudentData {
  id: string;
  nisn: string;
  name: string;
  gender: "L" | "P";
  packet: "Paket A" | "Paket B" | "Paket C";
  class: string;
  parent: string;
  phone: string;
  status: "AKTIF" | "LULUS" | "MUTASI";
  photoUrl?: string; // base64 atau URL gambar
  address?: string;
  birthDate?: string;
  email?: string;
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
  const [profileTab, setProfileTab] = useState<"profil" | "akademik" | "kontak">("profil");

  // Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Add Student form
  const [formData, setFormData] = useState({
    nisn: "",
    name: "",
    gender: "L" as "L" | "P",
    packet: "Paket C" as StudentData["packet"],
    class: "Kelas X Merdeka",
    parent: "",
    phone: "",
    address: "",
    birthDate: "",
    email: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<StudentData[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Berkas harus berupa gambar (JPG, PNG, dll)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ── Add student ── */
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nisn) {
      showToast("Nama siswa dan NISN wajib diisi!", "error");
      return;
    }
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setStudents([json.data, ...students]);
        setIsAddModalOpen(false);
        setFormData({
          nisn: "", name: "", gender: "L", packet: "Paket C",
          class: "Kelas X Merdeka", parent: "", phone: "",
          address: "", birthDate: "", email: "",
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

  /* ── CSV ── */
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setImportError("Format berkas harus .csv");
      return;
    }
    setCsvFileName(file.name);
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text
          .split(/\r\n|\n/)
          .filter((l) => l.trim() !== "");
        if (lines.length < 2) {
          setImportError("Berkas CSV kosong atau tidak memiliki data.");
          return;
        }
        const rows: StudentData[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]
            .split(",")
            .map((c) => c.trim().replace(/^"|"$/g, ""));
          if (cols[0] && cols[1]) {
            rows.push({
              id: `${Date.now()}-${i}`,
              nisn: cols[0],
              name: cols[1],
              gender: cols[2]?.toUpperCase() === "P" ? "P" : "L",
              packet: (cols[3] as StudentData["packet"]) || "Paket C",
              class: cols[4] || "Kelas X Merdeka",
              parent: cols[5] || "-",
              phone: cols[6] || "-",
              status: "AKTIF",
            });
          }
        }
        rows.length === 0
          ? setImportError("Tidak ada baris valid di CSV.")
          : setParsedRows(rows);
      } catch {
        setImportError("Gagal membaca CSV. Periksa format delimiter.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedRows.length) return;
    setStudents((prev) => [...parsedRows, ...prev]);
    const count = parsedRows.length;
    setIsImportModalOpen(false);
    setParsedRows([]);
    setCsvFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast(`Berhasil mengimpor ${count} peserta didik dari CSV!`);
  };

  const downloadTemplate = () => {
    const csv =
      "nisn,nama,jenis_kelamin,program,kelas,orang_tua,telepon\n" +
      "0098765431,Ayu Safitri,P,Paket C,Kelas X Merdeka,Supriyanto,0812-9988-7711\n" +
      "0098765432,Dimas Pratama,L,Paket B,Kelas VIII,Wahyudi,0813-8877-6622";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_siswa_askara.csv";
    a.click();
  };

  const handleExportCsv = () => {
    const header =
      "NISN,Nama Lengkap,L/P,Program,Rombel,Orang Tua,Telepon,Status\n";
    const body = filteredStudents
      .map(
        (s) =>
          `"${s.nisn}","${s.name}","${s.gender}","${s.packet}","${s.class}","${s.parent}","${s.phone}","${s.status}"`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data_siswa_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast("Data siswa berhasil diexport ke CSV!");
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
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import CSV</span>
          </button>
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
              <button
                onClick={handleExportCsv}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
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

        {/* ── Detail Panel Profil Bertab ── */}
        {detailStudent && (
          <div className="w-80 shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-elevated flex flex-col">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 px-5 pt-6 pb-6 text-center rounded-t-2xl">
              <button
                onClick={() => { setDetailStudent(null); setProfileTab("profil"); }}
                className="absolute top-3 right-3 text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex justify-center">
                <Avatar student={detailStudent} size="xl" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-white leading-tight">
                {detailStudent.name}
              </h3>
              <p className="text-[11px] text-indigo-300 mt-0.5">
                {detailStudent.gender === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  detailStudent.status === "AKTIF"
                    ? "bg-emerald-400/30 text-emerald-100 border border-emerald-400/40"
                    : detailStudent.status === "LULUS"
                    ? "bg-sky-400/30 text-sky-100 border border-sky-400/40"
                    : "bg-amber-400/30 text-amber-100 border border-amber-400/40"
                }`}>
                  {detailStudent.status}
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-400/30 text-indigo-100 border border-indigo-400/40">
                  {detailStudent.packet}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-white">
              {([
                { key: "profil", label: "Profil", icon: <BadgeInfo className="w-3.5 h-3.5" /> },
                { key: "akademik", label: "Akademik", icon: <School className="w-3.5 h-3.5" /> },
                { key: "kontak", label: "Kontak", icon: <Contact className="w-3.5 h-3.5" /> },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setProfileTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold transition border-b-2 ${
                    profileTab === tab.key
                      ? "border-indigo-600 text-indigo-700 bg-indigo-50/60"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 space-y-3 text-xs overflow-y-auto">

              {/* ── TAB: PROFIL ── */}
              {profileTab === "profil" && (
                <div className="space-y-3">
                  <InfoRow
                    icon={<IdCard className="w-3.5 h-3.5 text-slate-500" />}
                    label="NISN"
                    value={<span className="font-mono tracking-wide">{detailStudent.nisn}</span>}
                  />
                  <InfoRow
                    icon={<User className="w-3.5 h-3.5 text-indigo-500" />}
                    label="Nama Lengkap"
                    value={detailStudent.name}
                  />
                  <InfoRow
                    icon={<BadgeInfo className="w-3.5 h-3.5 text-pink-500" />}
                    label="Jenis Kelamin"
                    value={detailStudent.gender === "L" ? "Laki-laki" : "Perempuan"}
                  />
                  {detailStudent.birthDate && (
                    <InfoRow
                      icon={<CalendarDays className="w-3.5 h-3.5 text-rose-500" />}
                      label="Tanggal Lahir"
                      value={new Date(detailStudent.birthDate).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    />
                  )}
                  {detailStudent.email && (
                    <InfoRow
                      icon={<Mail className="w-3.5 h-3.5 text-blue-500" />}
                      label="Email"
                      value={<span className="break-all">{detailStudent.email}</span>}
                    />
                  )}
                </div>
              )}

              {/* ── TAB: AKADEMIK ── */}
              {profileTab === "akademik" && (
                <div className="space-y-3">
                  <InfoRow
                    icon={<BookOpen className="w-3.5 h-3.5 text-emerald-600" />}
                    label="Program Kesetaraan"
                    value={
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        detailStudent.packet === "Paket A" ? "bg-amber-100 text-amber-800" :
                        detailStudent.packet === "Paket B" ? "bg-blue-100 text-blue-800" :
                        "bg-emerald-100 text-emerald-800"
                      }`}>{detailStudent.packet}</span>
                    }
                  />
                  <InfoRow
                    icon={<School className="w-3.5 h-3.5 text-indigo-600" />}
                    label="Rombongan Belajar"
                    value={detailStudent.class}
                  />
                  <InfoRow
                    icon={<GraduationCap className="w-3.5 h-3.5 text-purple-600" />}
                    label="Status Keaktifan"
                    value={
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        detailStudent.status === "AKTIF" ? "bg-emerald-100 text-emerald-800" :
                        detailStudent.status === "LULUS" ? "bg-sky-100 text-sky-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>{detailStudent.status}</span>
                    }
                  />
                  <div className="mt-1 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-2">Ringkasan</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-indigo-50 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-indigo-600 font-semibold">Program</p>
                        <p className="text-xs font-bold text-indigo-900 mt-0.5">{detailStudent.packet}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-emerald-600 font-semibold">Status</p>
                        <p className="text-xs font-bold text-emerald-900 mt-0.5">{detailStudent.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: KONTAK ── */}
              {profileTab === "kontak" && (
                <div className="space-y-3">
                  <InfoRow
                    icon={<Users className="w-3.5 h-3.5 text-amber-600" />}
                    label="Orang Tua / Wali"
                    value={detailStudent.parent || "-"}
                  />
                  <InfoRow
                    icon={<Phone className="w-3.5 h-3.5 text-sky-600" />}
                    label="No. Telepon"
                    value={<span className="font-mono">{detailStudent.phone || "-"}</span>}
                  />
                  {detailStudent.email && (
                    <InfoRow
                      icon={<Mail className="w-3.5 h-3.5 text-blue-500" />}
                      label="Email"
                      value={<span className="break-all">{detailStudent.email}</span>}
                    />
                  )}
                  {detailStudent.address && detailStudent.address !== "-" && (
                    <InfoRow
                      icon={<MapPin className="w-3.5 h-3.5 text-rose-500" />}
                      label="Alamat Domisili"
                      value={detailStudent.address}
                    />
                  )}
                  {!detailStudent.email && (!detailStudent.address || detailStudent.address === "-") && (
                    <p className="text-center text-slate-400 text-[11px] py-2">Data kontak tambahan belum diisi.</p>
                  )}
                </div>
              )}

            </div>


            {/* Action buttons */}
            <div className="p-4 pt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setFormData({
                    nisn: detailStudent.nisn,
                    name: detailStudent.name,
                    gender: detailStudent.gender,
                    packet: detailStudent.packet,
                    class: detailStudent.class,
                    parent: detailStudent.parent !== "-" ? detailStudent.parent : "",
                    phone: detailStudent.phone !== "-" ? detailStudent.phone : "",
                    address: detailStudent.address && detailStudent.address !== "-" ? detailStudent.address : "",
                    birthDate: detailStudent.birthDate ?? "",
                    email: detailStudent.email ?? "",
                  });
                  setPhotoPreview(detailStudent.photoUrl ?? null);
                  setStudents((prev) => prev.filter((s) => s.id !== detailStudent.id));
                  setDetailStudent(null);
                  setProfileTab("profil");
                  setIsAddModalOpen(true);
                }}
                className="text-[11px] py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center justify-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>
              <button
                onClick={() => handleDeleteStudent(detailStudent.id, detailStudent.name)}
                className="text-[11px] py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition flex items-center justify-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/*  MODAL: TAMBAH SISWA BARU                           */}
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
                    Tambah Peserta Didik Baru
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lengkapi identitas dan unggah foto siswa
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

            <form onSubmit={handleAddStudent} className="p-6 text-xs space-y-5">
              {/* ── FOTO PROFIL ── */}
              <div className="flex items-start space-x-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {/* Preview */}
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

                {/* Upload button */}
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-1">
                    Foto Profil Siswa
                  </p>
                  <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
                    Unggah foto resmi siswa berformat JPG atau PNG.
                    Ukuran maksimal 2 MB. Rasio foto 3×4 sangat disarankan.
                  </p>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg font-bold cursor-pointer transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>
                      {photoPreview ? "Ganti Foto" : "Pilih Foto..."}
                    </span>
                  </label>
                </div>
              </div>

              {/* ── DATA POKOK ── */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Data Pokok Siswa
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      NISN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 0081294812"
                      value={formData.nisn}
                      onChange={(e) =>
                        setFormData({ ...formData, nisn: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value as "L" | "P",
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap sesuai dokumen..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email (opsional)
                    </label>
                    <input
                      type="email"
                      placeholder="siswa@mail.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* ── PROGRAM & KELAS ── */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Program &amp; Rombel
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Program Kesetaraan
                    </label>
                    <select
                      value={formData.packet}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          packet: e.target.value as StudentData["packet"],
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option value="Paket A">Paket A (Setara SD)</option>
                      <option value="Paket B">Paket B (Setara SMP)</option>
                      <option value="Paket C">Paket C (Setara SMA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Rombel / Kelas
                    </label>
                    <select
                      value={formData.class}
                      onChange={(e) =>
                        setFormData({ ...formData, class: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    >
                      <option>Kelas X Merdeka</option>
                      <option>Kelas XI</option>
                      <option>Kelas XII</option>
                      <option>Kelas VIII</option>
                      <option>Kelas IX</option>
                      <option>Kelas V</option>
                      <option>Kelas VI</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── ORANG TUA ── */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Data Orang Tua / Wali
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Orang Tua / Wali
                    </label>
                    <input
                      type="text"
                      placeholder="Nama ayah / ibu / wali..."
                      value={formData.parent}
                      onChange={(e) =>
                        setFormData({ ...formData, parent: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat Lengkap
                  </label>
                  <input
                    type="text"
                    placeholder="Jl. Nama Jalan No. X, Kota..."
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
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
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Import Data Siswa dari CSV
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tambahkan banyak siswa sekaligus via berkas CSV
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedRows([]);
                  setCsvFileName(null);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Template download */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <p className="font-bold text-indigo-950">
                      Template CSV Standar
                    </p>
                    <p className="text-[11px] text-indigo-700">
                      Format: nisn, nama, jenis_kelamin, program, kelas, orang_tua, telepon
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-3 py-1.5 bg-white text-indigo-800 border border-indigo-300 hover:bg-indigo-100 rounded-lg font-bold text-[11px] flex items-center space-x-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              {/* Upload area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 transition cursor-pointer relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800">
                  {csvFileName
                    ? `Berkas: ${csvFileName}`
                    : "Klik atau seret berkas .CSV ke sini"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pemisah kolom: koma (,)
                </p>
              </div>

              {importError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span>Pratinjau ({parsedRows.length} siswa terbaca)</span>
                    <span className="text-emerald-700 text-[11px]">
                      Siap diimpor ✓
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-2">NISN</th>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Program</th>
                          <th className="p-2">Kelas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{r.nisn}</td>
                            <td className="p-2 font-semibold">{r.name}</td>
                            <td className="p-2">{r.packet}</td>
                            <td className="p-2">{r.class}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setParsedRows([]);
                    setCsvFileName(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedRows.length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    Impor{" "}
                    {parsedRows.length > 0 ? `${parsedRows.length} Siswa` : "Sekarang"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
