"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
  Edit,
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
  ExternalLink,
  MessageCircle,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns3,
  RotateCcw,
  Filter,
  Check,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";
import CsvImportExport from "@/components/CsvImportExport";
import DualUploadInput from "@/components/DualUploadInput";
import { calculateDetailedAge } from "@/lib/public-registration-db";

/* ──────────────────────────────────────────────────────────── */
/*  Column & Sort Configuration                                 */
/* ──────────────────────────────────────────────────────────── */

export type SortField =
  | "name"
  | "nisn"
  | "nik"
  | "packet"
  | "class"
  | "gender"
  | "parent"
  | "phone"
  | "city"
  | "status";

export type SortOrder = "asc" | "desc";

export interface ColumnDefinition {
  id: string;
  label: string;
  isDefault: boolean;
  required?: boolean;
}

export const AVAILABLE_COLUMNS: ColumnDefinition[] = [
  { id: "name", label: "Siswa & Foto", isDefault: true, required: true },
  { id: "nisn", label: "NISN", isDefault: true },
  { id: "nik", label: "NIK", isDefault: false },
  { id: "packet", label: "Program (Paket)", isDefault: true },
  { id: "class", label: "Rombel / Kelas", isDefault: true },
  { id: "gender", label: "Jenis Kelamin", isDefault: false },
  { id: "parent", label: "Orang Tua / Wali", isDefault: true },
  { id: "phone", label: "No. WhatsApp", isDefault: false },
  { id: "city", label: "Domisili (Kota/Kec)", isDefault: false },
  { id: "docs", label: "Kelengkapan Berkas", isDefault: false },
  { id: "status", label: "Status Siswa", isDefault: true },
  { id: "actions", label: "Aksi", isDefault: true, required: true },
];

const DEFAULT_VISIBLE_COLUMNS = AVAILABLE_COLUMNS.filter((c) => c.isDefault).map(
  (c) => c.id
);

/* ──────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ──────────────────────────────────────────────────────────── */

export interface CustomFieldItem {
  id: string;
  label: string;
  value: string;
  type?: "text" | "number" | "date";
}

export interface CustomDocItem {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface StudentData {
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
  address?: string;
  birthDate?: string;
  birthPlace?: string;
  email?: string;
  photoUrl?: string;
  religion?: string;
  numberOfSiblings?: number;
  currentGrade?: string;
  heightCm?: number;
  weightKg?: number;
  medicalHistory?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
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
  parentKtpUrl?: string;
  ktpUrl?: string;
  kkUrl?: string;
  birthCertUrl?: string;
  diplomaUrl?: string;
  customFields?: CustomFieldItem[];
  customDocs?: CustomDocItem[];
}

/* ──────────────────────────────────────────────────────────── */
/*  Avatar Component                                            */
/* ──────────────────────────────────────────────────────────── */

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

function Avatar({
  student,
  size = "md",
}: {
  student: StudentData;
  size?: "sm" | "md" | "xl";
}) {
  const colorIdx =
    (student.name.charCodeAt(0) + (student.name.charCodeAt(1) || 0)) %
    AVATAR_COLORS.length;
  const color = AVATAR_COLORS[colorIdx];

  const dims =
    size === "sm"
      ? "w-9 h-9 text-xs"
      : size === "xl"
      ? "w-24 h-24 text-2xl"
      : "w-12 h-12 text-sm";

  if (student.photoUrl) {
    return (
      <div
        className={`${dims} rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-md bg-white`}
      >
        <Image
          src={student.photoUrl}
          alt={student.name}
          width={96}
          height={96}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims} rounded-2xl ${color} flex items-center justify-center font-bold shrink-0 border-2 border-white shadow-md`}
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("SEMUA");
  const [selectedStatus, setSelectedStatus] = useState("SEMUA");
  const [selectedGender, setSelectedGender] = useState("SEMUA");
  const [selectedDocStatus, setSelectedDocStatus] = useState("SEMUA");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Load saved column preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pkbm_student_visible_cols_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleColumns(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // Modal / Panel state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentData | null>(null);

  // Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Add/Edit Student form
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
    parentKtpUrl: "",
    ktpUrl: "",
    kkUrl: "",
    birthCertUrl: "",
    diplomaUrl: "",
    customFields: [] as CustomFieldItem[],
    customDocs: [] as CustomDocItem[],
  });

  const liveAge = calculateDetailedAge(formData.birthDate);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Custom Fields Handlers
  const handleAddCustomField = () => {
    setFormData((prev) => ({
      ...prev,
      customFields: [
        ...(prev.customFields || []),
        { id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, label: "", value: "" },
      ],
    }));
  };

  const handleUpdateCustomField = (id: string, key: "label" | "value", val: string) => {
    setFormData((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).map((f) =>
        f.id === id ? { ...f, [key]: val } : f
      ),
    }));
  };

  const handleRemoveCustomField = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((f) => f.id !== id),
    }));
  };

  // Custom Docs Handlers
  const handleAddCustomDoc = () => {
    setFormData((prev) => ({
      ...prev,
      customDocs: [
        ...(prev.customDocs || []),
        { id: `cd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, title: "", url: "", description: "" },
      ],
    }));
  };

  const handleUpdateCustomDoc = (id: string, key: "title" | "url" | "description", val: string) => {
    setFormData((prev) => ({
      ...prev,
      customDocs: (prev.customDocs || []).map((d) =>
        d.id === id ? { ...d, [key]: val } : d
      ),
    }));
  };

  const handleRemoveCustomDoc = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      customDocs: (prev.customDocs || []).filter((d) => d.id !== id),
    }));
  };

  /* ── helpers ── */
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getDocCompleteness = (st: StudentData) => {
    const docs = [
      st.photoUrl,
      st.kkUrl,
      st.birthCertUrl,
      st.diplomaUrl,
      st.parentKtpUrl || st.ktpUrl,
    ].filter(Boolean);
    return {
      count: docs.length,
      total: 5,
      isComplete: docs.length >= 4,
    };
  };

  const isColVisible = (colId: string) => visibleColumns.includes(colId);

  const toggleColumn = (colId: string) => {
    if (colId === "name" || colId === "actions") return;
    setVisibleColumns((prev) => {
      const next = prev.includes(colId)
        ? prev.filter((id) => id !== colId)
        : [...prev, colId];
      try {
        localStorage.setItem("pkbm_student_visible_cols_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleSelectAllColumns = () => {
    const allIds = AVAILABLE_COLUMNS.map((c) => c.id);
    setVisibleColumns(allIds);
    try {
      localStorage.setItem("pkbm_student_visible_cols_v1", JSON.stringify(allIds));
    } catch (e) {}
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    try {
      localStorage.setItem(
        "pkbm_student_visible_cols_v1",
        JSON.stringify(DEFAULT_VISIBLE_COLUMNS)
      );
    } catch (e) {}
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const activeFilterCount =
    (selectedProgram !== "SEMUA" ? 1 : 0) +
    (selectedStatus !== "SEMUA" ? 1 : 0) +
    (selectedGender !== "SEMUA" ? 1 : 0) +
    (selectedDocStatus !== "SEMUA" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedProgram("SEMUA");
    setSelectedStatus("SEMUA");
    setSelectedGender("SEMUA");
    setSelectedDocStatus("SEMUA");
    setSearchQuery("");
    setSortField("name");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter((st) => {
        // 1. Program filter
        if (selectedProgram !== "SEMUA" && st.packet !== selectedProgram) {
          return false;
        }

        // 2. Status filter
        if (selectedStatus !== "SEMUA" && st.status !== selectedStatus) {
          return false;
        }

        // 3. Gender filter
        if (selectedGender !== "SEMUA" && st.gender !== selectedGender) {
          return false;
        }

        // 4. Document completeness filter
        if (selectedDocStatus !== "SEMUA") {
          const { isComplete } = getDocCompleteness(st);
          if (selectedDocStatus === "LENGKAP" && !isComplete) return false;
          if (selectedDocStatus === "BELUM_LENGKAP" && isComplete) return false;
        }

        // 5. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const match =
            (st.name || "").toLowerCase().includes(q) ||
            (st.nisn || "").toLowerCase().includes(q) ||
            (st.nik || "").toLowerCase().includes(q) ||
            (st.phone || "").toLowerCase().includes(q) ||
            (st.parent || "").toLowerCase().includes(q) ||
            (st.parentName || "").toLowerCase().includes(q) ||
            (st.motherName || "").toLowerCase().includes(q) ||
            (st.class || "").toLowerCase().includes(q) ||
            (st.city || "").toLowerCase().includes(q) ||
            (st.kecamatan || "").toLowerCase().includes(q) ||
            (st.previousSchool || "").toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        switch (sortField) {
          case "name":
            valA = (a.name || "").toLowerCase();
            valB = (b.name || "").toLowerCase();
            break;
          case "nisn":
            valA = a.nisn || "";
            valB = b.nisn || "";
            break;
          case "nik":
            valA = a.nik || "";
            valB = b.nik || "";
            break;
          case "packet":
            valA = a.packet || "";
            valB = b.packet || "";
            break;
          case "class":
            valA = a.class || "";
            valB = b.class || "";
            break;
          case "gender":
            valA = a.gender || "";
            valB = b.gender || "";
            break;
          case "parent":
            valA = (a.parent || a.parentName || "").toLowerCase();
            valB = (b.parent || b.parentName || "").toLowerCase();
            break;
          case "phone":
            valA = a.phone || "";
            valB = b.phone || "";
            break;
          case "city":
            valA = (a.city || "").toLowerCase();
            valB = (b.city || "").toLowerCase();
            break;
          case "status":
            valA = a.status || "";
            valB = b.status || "";
            break;
          default:
            valA = (a.name || "").toLowerCase();
            valB = (b.name || "").toLowerCase();
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [
    students,
    selectedProgram,
    selectedStatus,
    selectedGender,
    selectedDocStatus,
    searchQuery,
    sortField,
    sortOrder,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    if (pageSize === -1) return filteredStudents;
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

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

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setPhotoPreview(null);
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
      parentKtpUrl: "",
      ktpUrl: "",
      kkUrl: "",
      birthCertUrl: "",
      diplomaUrl: "",
      customFields: [],
      customDocs: [],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (st: StudentData) => {
    setEditingStudent(st);
    setPhotoPreview(st.photoUrl || null);
    setFormData({
      nisn: st.nisn || "",
      nik: st.nik || "",
      name: st.name,
      gender: st.gender || "L",
      packet: st.packet || "Paket C",
      class: st.class || "Kelas X Merdeka",
      registrationTrack: st.registrationTrack || "Reguler",
      previousSchool: st.previousSchool || "",
      previousSchoolAddress: st.previousSchoolAddress || "",
      mutationFrom: st.mutationFrom || "",
      religion: st.religion || "Islam",
      birthPlace: st.birthPlace || "",
      birthDate: st.birthDate || "",
      numberOfSiblings: st.numberOfSiblings || 0,
      heightCm: st.heightCm || 160,
      weightKg: st.weightKg || 50,
      medicalHistory: st.medicalHistory || "",
      email: st.email && st.email !== "-" ? st.email : "",
      phone: st.phone && st.phone !== "-" ? st.phone : "",
      address: st.address && st.address !== "-" ? st.address : "",
      rtRw: st.rtRw || "",
      kelurahan: st.kelurahan || "",
      kecamatan: st.kecamatan || "",
      city: st.city || "Kota Bandung",
      province: st.province || "Jawa Barat",
      postalCode: st.postalCode || "",
      parent: st.parent && st.parent !== "-" ? st.parent : "",
      parentName: st.parentName || (st.parent && st.parent !== "-" ? st.parent : ""),
      parentJob: st.parentJob || "",
      fatherIncome: st.fatherIncome || "Rp 3.000.000 - Rp 5.000.000",
      motherName: st.motherName || "",
      motherJob: st.motherJob || "",
      motherIncome: st.motherIncome || "Rp 1.000.000 - Rp 3.000.000",
      guardianName: st.guardianName || "",
      guardianJob: st.guardianJob || "",
      parentPhone: st.parentPhone || "",
      photoUrl: st.photoUrl || "",
      parentKtpUrl: st.parentKtpUrl || "",
      ktpUrl: st.ktpUrl || "",
      kkUrl: st.kkUrl || "",
      birthCertUrl: st.birthCertUrl || "",
      diplomaUrl: st.diplomaUrl || "",
      customFields: Array.isArray(st.customFields) ? JSON.parse(JSON.stringify(st.customFields)) : [],
      customDocs: Array.isArray(st.customDocs) ? JSON.parse(JSON.stringify(st.customDocs)) : [],
    });
    setIsAddModalOpen(true);
  };

  /* ── Add / Edit student submit ── */
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nisn) {
      showToast("Nama siswa dan NISN wajib diisi!", "error");
      return;
    }
    try {
      const url = "/api/students";
      const method = editingStudent ? "PUT" : "POST";
      const cleanedCustomFields = (formData.customFields || []).filter(
        (f) => f.label.trim() || f.value.trim()
      );
      const cleanedCustomDocs = (formData.customDocs || []).filter(
        (d) => d.title.trim() || d.url.trim()
      );

      const payload = {
        ...(editingStudent ? { id: editingStudent.id } : {}),
        ...formData,
        parentName: formData.parentName || formData.parent,
        customFields: cleanedCustomFields,
        customDocs: cleanedCustomDocs,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        const wasEditing = Boolean(editingStudent);
        setEditingStudent(null);
        setPhotoPreview(null);
        if (detailStudent && editingStudent && detailStudent.id === editingStudent.id) {
          setDetailStudent({
            ...detailStudent,
            ...formData,
            parent: formData.parentName || formData.parent || detailStudent.parent,
            customFields: cleanedCustomFields,
            customDocs: cleanedCustomDocs,
          });
        }
        showToast(wasEditing ? `Data siswa ${formData.name} berhasil diperbarui!` : (json.message || `Peserta didik berhasil ditambahkan!`));
        fetchStudents();
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
            onClick={handleOpenCreate}
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
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
          
          {/* ── Toolbar: Search, Filters, Sort, Column Picker ── */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Left: Search Bar */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama siswa, NISN, NIK, wali, kota, atau kelas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Actions (Quick Program, Filter, Sort, Column Picker) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Program Filter Chips */}
              <div className="hidden sm:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {["SEMUA", "Paket A", "Paket B", "Paket C"].map((pkg) => (
                  <button
                    key={pkg}
                    onClick={() => {
                      setSelectedProgram(pkg);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                      selectedProgram === pkg
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {pkg}
                  </button>
                ))}
              </div>

              {/* Advanced Filter Toggle Button */}
              <button
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition ${
                  showFilterDrawer || activeFilterCount > (selectedProgram !== "SEMUA" ? 1 : 0)
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                title="Buka Filter Lanjutan"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Selector Dropdown */}
              <div className="relative">
                <select
                  value={`${sortField}_${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("_") as [SortField, SortOrder];
                    setSortField(field);
                    setSortOrder(order);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="name_asc">Nama (A - Z)</option>
                  <option value="name_desc">Nama (Z - A)</option>
                  <option value="nisn_asc">NISN (Terkecil)</option>
                  <option value="nisn_desc">NISN (Terbesar)</option>
                  <option value="packet_asc">Program (Paket A - C)</option>
                  <option value="status_asc">Status (Aktif Dulu)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* Column Visibility Picker Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowColumnPicker(!showColumnPicker)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition ${
                    showColumnPicker
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  title="Atur Kolom Tabel yang Ditampilkan"
                >
                  <Columns3 className="w-3.5 h-3.5" />
                  <span>Kolom</span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    ({visibleColumns.length}/{AVAILABLE_COLUMNS.length})
                  </span>
                </button>

                {/* Column Picker Popover */}
                {showColumnPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowColumnPicker(false)}
                    />
                    <div className="absolute right-0 mt-2 z-50 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-900">
                          Opsi Kolom Data
                        </span>
                        <div className="flex items-center space-x-2 text-[11px]">
                          <button
                            onClick={handleSelectAllColumns}
                            className="text-emerald-700 hover:underline font-bold"
                          >
                            Semua
                          </button>
                          <span>•</span>
                          <button
                            onClick={handleResetColumns}
                            className="text-slate-500 hover:underline font-medium"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1.5 py-1 pr-1 text-xs">
                        {AVAILABLE_COLUMNS.map((col) => {
                          const checked = isColVisible(col.id);
                          return (
                            <label
                              key={col.id}
                              className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition ${
                                col.required
                                  ? "opacity-60 cursor-not-allowed bg-slate-50"
                                  : checked
                                  ? "bg-emerald-50/70 text-emerald-950 font-semibold"
                                  : "hover:bg-slate-100 text-slate-600"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={col.required}
                                  onChange={() => toggleColumn(col.id)}
                                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                />
                                <span>{col.label}</span>
                              </div>
                              {col.required && (
                                <span className="text-[10px] text-slate-400">
                                  Wajib
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Advanced Filter Drawer Panel ── */}
          {showFilterDrawer && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Filter Lanjutan Peserta Didik</span>
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Program Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Program / Paket:
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => {
                      setSelectedProgram(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="SEMUA">Semua Program</option>
                    <option value="Paket A">Paket A (Setara SD)</option>
                    <option value="Paket B">Paket B (Setara SMP)</option>
                    <option value="Paket C">Paket C (Setara SMA)</option>
                  </select>
                </div>

                {/* Status Siswa Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Status Siswa:
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="SEMUA">Semua Status</option>
                    <option value="AKTIF">Aktif</option>
                    <option value="LULUS">Lulus</option>
                    <option value="MUTASI">Mutasi</option>
                  </select>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={selectedGender}
                    onChange={(e) => {
                      setSelectedGender(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="SEMUA">Semua Gender</option>
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                {/* Kelengkapan Berkas Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Kelengkapan Dokumen:
                  </label>
                  <select
                    value={selectedDocStatus}
                    onChange={(e) => {
                      setSelectedDocStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="SEMUA">Semua Berkas</option>
                    <option value="LENGKAP">Berkas Lengkap (Min. 4 Dokumen)</option>
                    <option value="BELUM_LENGKAP">Belum Lengkap</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Badges */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-semibold">
                Filter Aktif:
              </span>
              {selectedProgram !== "SEMUA" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Program: {selectedProgram}
                  <button onClick={() => setSelectedProgram("SEMUA")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== "SEMUA" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold">
                  Status: {selectedStatus}
                  <button onClick={() => setSelectedStatus("SEMUA")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedGender !== "SEMUA" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                  Gender: {selectedGender === "L" ? "Laki-laki" : "Perempuan"}
                  <button onClick={() => setSelectedGender("SEMUA")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedDocStatus !== "SEMUA" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  Dokumen: {selectedDocStatus === "LENGKAP" ? "Lengkap" : "Belum Lengkap"}
                  <button onClick={() => setSelectedDocStatus("SEMUA")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold">
                  Cari: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery("")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 underline ml-1"
              >
                Hapus Semua
              </button>
            </div>
          )}

          {/* ── Table with Dynamic Columns & Sorting ── */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
                  {isColVisible("name") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Siswa</span>
                        {sortField === "name" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("nisn") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("nisn")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>NISN</span>
                        {sortField === "nisn" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("nik") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("nik")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>NIK</span>
                        {sortField === "nik" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("gender") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("gender")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Gender</span>
                        {sortField === "gender" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("packet") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("packet")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Program</span>
                        {sortField === "packet" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("class") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("class")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Rombel / Kelas</span>
                        {sortField === "class" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("parent") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("parent")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Orang Tua / Wali</span>
                        {sortField === "parent" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("phone") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("phone")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>No. WhatsApp</span>
                        {sortField === "phone" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("city") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("city")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Domisili</span>
                        {sortField === "city" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("docs") && (
                    <th className="py-3 px-3">
                      <span>Dokumen</span>
                    </th>
                  )}

                  {isColVisible("status") && (
                    <th
                      className="py-3 px-3 cursor-pointer select-none hover:bg-slate-100 transition"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Status</span>
                        {sortField === "status" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  )}

                  {isColVisible("actions") && (
                    <th className="py-3 px-3 text-right">
                      <span>Aksi</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((st) => {
                    const docInfo = getDocCompleteness(st);
                    return (
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
                        {/* 1. Name & Avatar */}
                        {isColVisible("name") && (
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-3">
                              <Avatar student={st} size="sm" />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 leading-tight truncate">
                                  {st.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                                  <span>{st.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                                  {st.birthDate && (
                                    <>
                                      <span>•</span>
                                      <span>{st.birthDate}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* 2. NISN */}
                        {isColVisible("nisn") && (
                          <td className="py-3 px-3 font-mono font-medium text-slate-600">
                            {st.nisn || "-"}
                          </td>
                        )}

                        {/* 3. NIK */}
                        {isColVisible("nik") && (
                          <td className="py-3 px-3 font-mono text-slate-500">
                            {st.nik || "-"}
                          </td>
                        )}

                        {/* 4. Gender */}
                        {isColVisible("gender") && (
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                st.gender === "P"
                                  ? "bg-pink-50 text-pink-700 border border-pink-200"
                                  : "bg-sky-50 text-sky-700 border border-sky-200"
                              }`}
                            >
                              {st.gender === "P" ? "Perempuan" : "Laki-laki"}
                            </span>
                          </td>
                        )}

                        {/* 5. Program */}
                        {isColVisible("packet") && (
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              {st.packet}
                            </span>
                          </td>
                        )}

                        {/* 6. Class */}
                        {isColVisible("class") && (
                          <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                            {st.class}
                          </td>
                        )}

                        {/* 7. Parent */}
                        {isColVisible("parent") && (
                          <td className="py-3 px-3 text-slate-600">
                            {st.parent || st.parentName || "-"}
                          </td>
                        )}

                        {/* 8. Phone */}
                        {isColVisible("phone") && (
                          <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {st.phone && st.phone !== "-" ? (
                              <a
                                href={`https://wa.me/${st.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{st.phone}</span>
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        )}

                        {/* 9. City / Domisili */}
                        {isColVisible("city") && (
                          <td className="py-3 px-3 text-slate-600">
                            <span className="block truncate max-w-[140px]" title={`${st.city || ""} ${st.kecamatan || ""}`}>
                              {st.city || st.kecamatan || "-"}
                            </span>
                          </td>
                        )}

                        {/* 10. Documents completeness */}
                        {isColVisible("docs") && (
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
                                docInfo.isComplete
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>{docInfo.count}/{docInfo.total} Berkas</span>
                            </span>
                          </td>
                        )}

                        {/* 11. Status */}
                        {isColVisible("status") && (
                          <td className="py-3 px-3 whitespace-nowrap">
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
                        )}

                        {/* 12. Actions */}
                        {isColVisible("actions") && (
                          <td
                            className="py-3 px-3 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleOpenEdit(st)}
                                className="text-slate-400 hover:text-emerald-700 p-1.5 transition rounded-lg hover:bg-emerald-50"
                                title="Edit Data Siswa"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(st.id, st.name)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 transition rounded-lg hover:bg-rose-50"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="py-12 text-center text-slate-400 space-y-2"
                    >
                      <User className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-500">
                        Tidak ditemukan data peserta didik yang cocok.
                      </p>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={handleResetFilters}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-xs hover:bg-emerald-100 transition"
                        >
                          Reset Semua Filter
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer: Rows per page & Pagination ── */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            {/* Left: Summary & Per-page selector */}
            <div className="flex items-center space-x-3">
              <span>
                Menampilkan{" "}
                <strong>
                  {filteredStudents.length > 0
                    ? pageSize === -1
                      ? `1 - ${filteredStudents.length}`
                      : `${(currentPage - 1) * pageSize + 1} - ${Math.min(
                          currentPage * pageSize,
                          filteredStudents.length
                        )}`
                    : "0"}
                </strong>{" "}
                dari <strong>{filteredStudents.length}</strong> siswa
                {filteredStudents.length !== students.length && (
                  <span className="text-slate-400">
                    {" "}(difilter dari {students.length} total)
                  </span>
                )}
              </span>

              <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
                <span className="text-[11px] text-slate-400">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>Semua</option>
                </select>
              </div>
            </div>

            {/* Right: Pagination Controls */}
            {pageSize !== -1 && totalPages > 1 && (
              <div className="flex items-center space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page numbers (up to 5 pages around current) */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1.5 text-slate-300 font-bold">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                            currentPage === p
                              ? "bg-emerald-700 text-white shadow-sm"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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

              {/* Modal Detail Body (Stacked Sections - Matching Verifikasi Pendaftar standard) */}
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[72vh] text-xs bg-slate-50/50">
                
                {/* 1. SEKSI PROGRAM & JALUR SPMB */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>1. Pilihan Program & Jalur Belajar</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Jenjang Program</span>
                      <span className="font-extrabold text-indigo-700 text-xs sm:text-sm block mt-0.5">
                        {detailStudent.packet}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Jalur Pendaftaran</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {detailStudent.registrationTrack || "Reguler / Umum"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Rombel / Kelas Masuk</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {detailStudent.class || "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">NISN Siswa</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                        {detailStudent.nisn || "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Asal Sekolah Sebelumnya</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate" title={detailStudent.previousSchool || "-"}>
                        {detailStudent.previousSchool || "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Alamat Sekolah Asal / Keterangan Mutasi</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate" title={detailStudent.previousSchoolAddress || detailStudent.mutationFrom || "-"}>
                        {detailStudent.previousSchoolAddress || detailStudent.mutationFrom || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. SEKSI IDENTITAS LENGKAP & BIODATA DIRI */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>2. Identitas Lengkap & Biodata Pribadi</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Lengkap Siswa</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.name}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">NIK Siswa (KTP/KIA)</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.nik || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Jenis Kelamin</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailStudent.gender === "L" ? "Laki-laki (L)" : "Perempuan (P)"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tempat, Tanggal Lahir</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailStudent.birthPlace || "-"}, {detailStudent.birthDate ? new Date(detailStudent.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Usia Terhitung</span>
                      <span className="font-bold text-emerald-700 text-xs block mt-0.5">
                        {calculateDetailedAge(detailStudent.birthDate)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Agama</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailStudent.religion || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Jml Saudara Kandung</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailStudent.numberOfSiblings !== undefined ? `${detailStudent.numberOfSiblings} Orang` : "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tinggi / Berat Badan</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailStudent.heightCm ? `${detailStudent.heightCm} cm` : "-"} / {detailStudent.weightKg ? `${detailStudent.weightKg} kg` : "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Riwayat Penyakit</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate" title={detailStudent.medicalHistory || "-"}>
                        {detailStudent.medicalHistory || "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between sm:col-span-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">No. WhatsApp Siswa</span>
                        <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.phone || "-"}</span>
                      </div>
                      {detailStudent.phone && detailStudent.phone !== "-" && (
                        <a
                          href={`https://wa.me/${detailStudent.phone.replace(/[^0-9]/g, "")}`}
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
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Email Siswa</span>
                        <span className="font-semibold text-slate-900 text-xs block mt-0.5 truncate max-w-[150px]">{detailStudent.email || "-"}</span>
                      </div>
                      {detailStudent.email && detailStudent.email !== "-" && (
                        <a
                          href={`mailto:${detailStudent.email}`}
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
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>3. Alamat Domisili Lengkap Sesuai KK / KTP</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-3">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Alamat Jalan / Dusun / Gang</span>
                      <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed">
                        {detailStudent.address || "-"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">RT / RW</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailStudent.rtRw || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Kelurahan / Desa</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailStudent.kelurahan || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Kecamatan</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailStudent.kecamatan || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Kota / Kabupaten</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailStudent.city || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Provinsi & Kode Pos</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {detailStudent.province || "Jawa Barat"} {detailStudent.postalCode ? `(${detailStudent.postalCode})` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. SEKSI DATA ORANG TUA / WALI & KONDISI EKONOMI */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>4. Data Orang Tua / Wali & Kondisi Ekonomi</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Ayah</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.parentName || detailStudent.parent || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Pekerjaan Ayah</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailStudent.parentJob || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Penghasilan Ayah</span>
                      <span className="font-bold text-emerald-700 text-xs block mt-0.5">{detailStudent.fatherIncome || "-"}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Ibu</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.motherName || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Pekerjaan Ibu</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailStudent.motherJob || "-"}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Penghasilan Ibu</span>
                      <span className="font-bold text-emerald-700 text-xs block mt-0.5">{detailStudent.motherIncome || "-"}</span>
                    </div>

                    {detailStudent.guardianName && (
                      <>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Wali</span>
                          <span className="font-bold text-slate-900 text-xs block mt-0.5">{detailStudent.guardianName}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Pekerjaan Wali</span>
                          <span className="font-bold text-slate-800 text-xs block mt-0.5">{detailStudent.guardianJob || "-"}</span>
                        </div>
                        <div className="hidden sm:block"></div>
                      </>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between sm:col-span-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">WhatsApp Orang Tua / Wali</span>
                        <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                          {detailStudent.parentPhone || detailStudent.phone || "-"}
                        </span>
                      </div>
                      {(detailStudent.parentPhone || detailStudent.phone) && (detailStudent.parentPhone !== "-" || detailStudent.phone !== "-") && (
                        <a
                          href={`https://wa.me/${(detailStudent.parentPhone || detailStudent.phone || "").replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition flex items-center gap-1.5 text-xs font-bold"
                          title="Hubungi Orang Tua / Wali"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Hubungi
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. SEKSI DOKUMEN & BERKAS PERSYARATAN SISWA */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>5. Dokumen & Berkas Persyaratan Siswa</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[
                      { label: "KTP Orang Tua (Ayah / Ibu / Wali)", url: detailStudent.parentKtpUrl, icon: "🪪" },
                      { label: "KTP / KIA Siswa Pendaftar", url: detailStudent.ktpUrl, icon: "🆔" },
                      { label: "Kartu Keluarga (KK)", url: detailStudent.kkUrl, icon: "👨‍👩‍👧‍👦" },
                      { label: "Akta Kelahiran", url: detailStudent.birthCertUrl, icon: "📜" },
                      { label: "Ijazah Terakhir / SKL", url: detailStudent.diplomaUrl, icon: "🎓" },
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

                {/* 6. SEKSI DATA & KOLOM ISIAN TAMBAHAN (CUSTOM FIELDS) */}
                {detailStudent.customFields && detailStudent.customFields.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <span>6. Data & Kolom Isian Tambahan</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                      {detailStudent.customFields.map((field) => (
                        <div key={field.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase truncate" title={field.label}>
                            {field.label || "Kolom Tambahan"}
                          </span>
                          <span className="font-bold text-slate-800 text-xs block mt-0.5 break-words">
                            {field.value || "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. SEKSI BERKAS & DOKUMEN TAMBAHAN (CUSTOM DOCUMENTS) */}
                {detailStudent.customDocs && detailStudent.customDocs.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <span>7. Berkas & Dokumen Tambahan</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {detailStudent.customDocs.map((cdoc) => (
                        <div key={cdoc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg shrink-0">📁</span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate" title={cdoc.title}>
                                {cdoc.title || "Dokumen Tambahan"}
                              </span>
                              <span className={`text-[10px] font-semibold ${cdoc.url ? "text-emerald-600" : "text-slate-400"}`}>
                                {cdoc.url ? "✓ Terunggah" : "Belum ada berkas"}
                              </span>
                            </div>
                          </div>
                          {cdoc.url ? (
                            <a
                              href={cdoc.url}
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
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      const st = detailStudent;
                      setDetailStudent(null);
                      handleOpenEdit(st);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center justify-center space-x-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Data Siswa</span>
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
      {/*  MODAL: TAMBAH / EDIT SISWA                         */}
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
                    {editingStudent ? "Edit Data Peserta Didik" : "Tambah Peserta Didik Baru"}
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {editingStudent
                      ? "Perbarui seluruh data program, biodata, kontak domisili, data orang tua/wali, dan foto siswa"
                      : "Lengkapi seluruh data program, biodata, kontak domisili, data orang tua/wali, dan foto siswa"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                  setPhotoPreview(null);
                }}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStudent} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs bg-slate-50/50">
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

              {/* 6. SEKSI UNGGAH BERKAS PERSYARATAN SISWA */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>6. Unggah Berkas Persyaratan Siswa</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">Bisa Upload File (PDF/Foto) atau Foto Kamera Langsung</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DualUploadInput
                    label="KTP Orang Tua / Wali Asli"
                    value={formData.parentKtpUrl}
                    onChange={(url) => setFormData({ ...formData, parentKtpUrl: url })}
                    description="KTP Asli Ayah / Ibu / Wali Siswa (Maks 10MB)"
                  />
                  <DualUploadInput
                    label="KTP / KIA Siswa Pendaftar"
                    value={formData.ktpUrl}
                    onChange={(url) => setFormData({ ...formData, ktpUrl: url })}
                    description="KTP atau Kartu Identitas Anak Siswa (Maks 10MB)"
                  />
                  <DualUploadInput
                    label="Kartu Keluarga (KK)"
                    value={formData.kkUrl}
                    onChange={(url) => setFormData({ ...formData, kkUrl: url })}
                    description="Scan atau Foto Kartu Keluarga Asli (Maks 10MB)"
                  />
                  <DualUploadInput
                    label="Akta Kelahiran Siswa"
                    value={formData.birthCertUrl}
                    onChange={(url) => setFormData({ ...formData, birthCertUrl: url })}
                    description="Akta Kelahiran Asli Siswa (Maks 10MB)"
                  />
                  <div className="md:col-span-2">
                    <DualUploadInput
                      label="Ijazah Terakhir / SKL / Rapor Pindahan"
                      value={formData.diplomaUrl}
                      onChange={(url) => setFormData({ ...formData, diplomaUrl: url })}
                      description="Ijazah jenjang sebelumnya atau Surat Keterangan Lulus (Maks 10MB)"
                    />
                  </div>
                </div>
              </div>

              {/* 7. SEKSI KOLOM ISIAN TAMBAHAN (CUSTOM FIELDS) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <span>7. Kolom Isian Tambahan (Custom Fields)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tambahkan kolom data atau catatan khusus sesuai kebutuhan operasional (misal: Nomor KIP, Hobi, Catatan Guru, dll).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shrink-0 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kolom Isian</span>
                  </button>
                </div>

                {formData.customFields && formData.customFields.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {formData.customFields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition hover:border-emerald-200"
                      >
                        <div className="sm:w-1/3 min-w-[140px]">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Nama Kolom / Label #{idx + 1}
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) =>
                              handleUpdateCustomField(field.id, "label", e.target.value)
                            }
                            placeholder="Contoh: Nomor KIP / Hobi"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Nilai Isian Data
                          </label>
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) =>
                              handleUpdateCustomField(field.id, "value", e.target.value)
                            }
                            placeholder="Isi data siswa di sini..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                          />
                        </div>
                        <div className="sm:pt-5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(field.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition"
                            title="Hapus Kolom Isian Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <FileText className="w-7 h-7 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-600">Belum ada kolom isian tambahan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol <strong>Tambah Kolom Isian</strong> di atas untuk menambah data baru.
                    </p>
                  </div>
                )}
              </div>

              {/* 8. SEKSI KOLOM BERKAS / DOKUMEN TAMBAHAN (CUSTOM DOCUMENTS) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <span>8. Kolom Berkas / Dokumen Tambahan (Custom Documents)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tambahkan slot berkas persyaratan tambahan secara fleksibel (misal: Surat Pindah, SKTM, Sertifikat Prestasi, dll).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomDoc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition shrink-0 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kolom Berkas</span>
                  </button>
                </div>

                {formData.customDocs && formData.customDocs.length > 0 ? (
                  <div className="space-y-4 pt-1">
                    {formData.customDocs.map((doc, idx) => (
                      <div
                        key={doc.id}
                        className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 transition hover:border-indigo-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Nama / Judul Dokumen #{idx + 1} <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={doc.title}
                              onChange={(e) =>
                                handleUpdateCustomDoc(doc.id, "title", e.target.value)
                              }
                              placeholder="Contoh: Surat Keterangan Pindah / SKTM / Sertifikat Lomba"
                              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                          </div>
                          <div className="pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomDoc(doc.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition"
                              title="Hapus Kolom Berkas Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <DualUploadInput
                            label={doc.title ? `Unggah Berkas: ${doc.title}` : `Unggah Berkas Dokumen #${idx + 1}`}
                            value={doc.url}
                            onChange={(url) => handleUpdateCustomDoc(doc.id, "url", url)}
                            description="Bisa unggah berkas PDF/JPG/PNG atau ambil foto kamera langsung (Maks 10MB)"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <FileSpreadsheet className="w-7 h-7 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-600">Belum ada kolom berkas tambahan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol <strong>Tambah Kolom Berkas</strong> di atas untuk menambah slot upload dokumen baru.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 sm:p-6 border-t border-slate-200 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
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
                  {editingStudent ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingStudent ? "Simpan Perubahan Data Siswa" : "Simpan Data Siswa"}</span>
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
