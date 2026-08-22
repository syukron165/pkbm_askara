"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Calendar,
  Award,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  ChevronRight,
  Filter,
  Briefcase,
  ShieldCheck,
  RefreshCw,
  FileText,
  MapPin,
  Camera,
  Upload,
  Image as ImageIcon,
  QrCode,
  FileSpreadsheet,
  BookOpen,
  Sparkles,
  UserCheck,
  User,
  ExternalLink,
  GraduationCap,
  MessageCircle,
  ArrowLeftRight,
  Shuffle,
  UserCog,
} from "lucide-react";
import CsvImportExport from "@/components/CsvImportExport";
import DualUploadInput from "@/components/DualUploadInput";
import { calculateDetailedAge } from "@/lib/public-registration-db";

export interface ManagementPersonnel {
  id: string;
  name: string;
  nip?: string;
  role?: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  status: "AKTIF" | "CUTI" | "NON-AKTIF";
  isDualRole?: boolean;
  teachingSubject?: string;
  isParentRole?: boolean;
  parentRelationship?: string;
  parentJob?: string;
  childrenCount?: number;
  children?: Array<{ id: string; name: string; nisn: string; packetType: string; className: string }>;
  address?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  joinDate?: string;
  skNumber?: string;
  photoUrl?: string;
  responsibilities?: string;
  lastEducation?: string;
  majorStudy?: string;
  universityName?: string;
  graduationYear?: string;
  experienceYears?: number;
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
  skills?: string;
  cvResumeUrl?: string;
  ktpUrl?: string;
  kkUrl?: string;
  diplomaUrl?: string;
  transcriptUrl?: string;
  npwpUrl?: string;
}

export interface ManagementFormData {
  name: string;
  nip: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  status: "AKTIF" | "CUTI" | "NON-AKTIF";
  isDualRole: boolean;
  teachingSubject: string;
  isParentRole: boolean;
  parentRelationship: string;
  parentJob: string;
  childrenStudentIds: string[];
  address: string;
  city: string;
  province: string;
  joinDate: string;
  skNumber: string;
  photoUrl: string;
  responsibilities: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  lastEducation: string;
  educationStatus: string;
  majorStudy: string;
  universityName: string;
  graduationYear: string;
  experienceYears: number;
  skills: string;
  religion: string;
  motherName: string;
  maritalStatus: string;
  linkedinUrl: string;
  hobbies: string;
  lifeMotto: string;
  bankName: string;
  bankAccountNumber: string;
  cvResumeUrl: string;
  ktpUrl: string;
  kkUrl: string;
  diplomaUrl: string;
  transcriptUrl: string;
  npwpUrl: string;
}

const DEPARTMENTS = [
  "SEMUA",
  "Pimpinan & Struktural",
  "Akademik & Kurikulum",
  "Tata Usaha & HRD",
  "Keuangan & Perbendaharaan",
  "IT & Operator Data",
  "Kesiswaan & Ekstrakurikuler",
  "Sarana & Prasarana",
  "Penjaminan Mutu",
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  AKTIF: { label: "Aktif", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  CUTI: { label: "Cuti", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  "NON-AKTIF": { label: "Non-Aktif", bg: "bg-slate-100 border-slate-200", text: "text-slate-600" },
};

const DEPARTMENT_ICONS: Record<string, string> = {
  "Pimpinan & Struktural": "🏛️",
  "Akademik & Kurikulum": "📚",
  "Tata Usaha & HRD": "🗂️",
  "Keuangan & Perbendaharaan": "💰",
  "IT & Operator Data": "💻",
  "Kesiswaan & Ekstrakurikuler": "🎯",
  "Sarana & Prasarana": "🏢",
  "Penjaminan Mutu": "⭐",
};

export default function AdminManagementPage() {
  const [personnelList, setPersonnelList] = useState<ManagementPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("SEMUA");
  const [selectedStatus, setSelectedStatus] = useState("SEMUA");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<ManagementPersonnel | null>(null);
  const [editingPersonnel, setEditingPersonnel] = useState<ManagementPersonnel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ManagementPersonnel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // SK & Rekapitulasi Document Modals
  const [showSkModal, setShowSkModal] = useState(false);
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [skMode, setSkMode] = useState<"KOLEKTIF" | "INDIVIDUAL">("KOLEKTIF");
  const [selectedSkPersonId, setSelectedSkPersonId] = useState<string>("");

  // Switch Role Modal State
  const [switchRolePerson, setSwitchRolePerson] = useState<ManagementPersonnel | null>(null);
  const [selectedTargetRole, setSelectedTargetRole] = useState<string>("MANAJEMEN_ONLY");
  const [switchSubmitting, setSwitchSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state yang terstruktur lengkap
  const [formData, setFormData] = useState<ManagementFormData>({
    name: "",
    nip: "",
    position: "Staf Administrasi & Tata Usaha",
    department: "Pimpinan & Struktural",
    email: "",
    phone: "",
    status: "AKTIF",
    isDualRole: false,
    teachingSubject: "",
    isParentRole: false,
    parentRelationship: "AYAH",
    parentJob: "",
    childrenStudentIds: [],
    address: "",
    city: "Kota Bandung",
    province: "Jawa Barat",
    joinDate: new Date().toISOString().split("T")[0],
    skNumber: "",
    photoUrl: "",
    responsibilities: "",
    gender: "L",
    birthPlace: "",
    birthDate: "",
    lastEducation: "S1",
    educationStatus: "Sudah Lulus",
    majorStudy: "",
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

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedDept !== "SEMUA") params.set("department", selectedDept);
      if (selectedStatus !== "SEMUA") params.set("status", selectedStatus);

      const res = await fetch(`/api/management?${params}`);
      const data = await res.json();
      if (data.success) {
        setPersonnelList(data.data || []);
      }
    } catch (e) {
      console.error("Error loading management personnel:", e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept, selectedStatus]);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, photoUrl: data.url }));
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Upload error, using local data URL fallback:", err);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [allStudentsList, setAllStudentsList] = useState<Array<{ id: string; name: string; nisn: string; packet: string; class: string }>>([]);
  const [studentSearchKeyword, setStudentSearchKeyword] = useState("");

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAllStudentsList(
          data.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            nisn: s.nisn || "-",
            packet: s.packet,
            class: s.class || "-",
          }))
        );
      }
    } catch (e) {
      console.error("Failed to fetch students list", e);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenCreate = () => {
    setEditingPersonnel(null);
    setStudentSearchKeyword("");
    setFormData({
      name: "",
      nip: "",
      position: "Staf Administrasi & Tata Usaha",
      department: "Pimpinan & Struktural",
      email: "",
      phone: "",
      status: "AKTIF",
      isDualRole: false,
      teachingSubject: "",
      isParentRole: false,
      parentRelationship: "AYAH",
      parentJob: "",
      childrenStudentIds: [],
      address: "",
      city: "Kota Bandung",
      province: "Jawa Barat",
      joinDate: new Date().toISOString().split("T")[0],
      skNumber: "",
      photoUrl: "",
      responsibilities: "",
      gender: "L",
      birthPlace: "",
      birthDate: "",
      lastEducation: "S1",
      educationStatus: "Sudah Lulus",
      majorStudy: "",
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
    setShowFormModal(true);
  };

  const handleOpenEdit = (person: ManagementPersonnel) => {
    setEditingPersonnel(person);
    setStudentSearchKeyword("");
    const linkedStudentIds = (person.children || []).map((c) => c.id);

    setFormData({
      name: person.name,
      nip: person.nip || "",
      position: person.position,
      department: person.department,
      email: person.email,
      phone: person.phone,
      status: person.status,
      isDualRole: Boolean(person.isDualRole),
      teachingSubject: person.teachingSubject || person.majorStudy || "",
      isParentRole: Boolean(person.isParentRole),
      parentRelationship: person.parentRelationship || "AYAH",
      parentJob: person.parentJob || "",
      childrenStudentIds: linkedStudentIds,
      address: person.address || "",
      city: "Kota Bandung",
      province: "Jawa Barat",
      joinDate: person.joinDate || "",
      skNumber: person.skNumber || "",
      photoUrl: person.photoUrl || "",
      responsibilities: person.responsibilities || "",
      gender: person.gender || "L",
      birthPlace: person.birthPlace || "",
      birthDate: person.birthDate || "",
      lastEducation: person.lastEducation || "S1",
      educationStatus: person.educationStatus || "Sudah Lulus",
      majorStudy: person.majorStudy || "",
      universityName: person.universityName || "",
      graduationYear: person.graduationYear || "",
      experienceYears: person.experienceYears || 1,
      skills: person.skills || person.responsibilities || "",
      religion: person.religion || "Islam",
      motherName: person.motherName || "",
      maritalStatus: person.maritalStatus || "Belum menikah",
      linkedinUrl: person.linkedinUrl || "",
      hobbies: person.hobbies || "",
      lifeMotto: person.lifeMotto || "",
      bankName: person.bankName || "",
      bankAccountNumber: person.bankAccountNumber || "",
      cvResumeUrl: person.cvResumeUrl || "",
      ktpUrl: person.ktpUrl || "",
      kkUrl: person.kkUrl || "",
      diplomaUrl: person.diplomaUrl || "",
      transcriptUrl: person.transcriptUrl || "",
      npwpUrl: person.npwpUrl || "",
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = "/api/management";
      const method = editingPersonnel ? "PUT" : "POST";
      const payload = editingPersonnel ? { id: editingPersonnel.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setShowFormModal(false);
        setActionMessage({
          type: "success",
          text: editingPersonnel
            ? "Data personel berhasil diperbarui!"
            : "Personel baru berhasil ditambahkan!",
        });
        setTimeout(() => setActionMessage(null), 4000);
        fetchPersonnel();
      } else {
        setActionMessage({ type: "error", text: data.error || "Gagal menyimpan data." });
      }
    } catch (e) {
      setActionMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/management?id=${deleteConfirm.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        setActionMessage({ type: "success", text: data.message || `Data ${deleteConfirm.name} berhasil dihapus.` });
        setTimeout(() => setActionMessage(null), 4000);
        fetchPersonnel();
      } else {
        setActionMessage({ type: "error", text: data.error || "Gagal menghapus data personel." });
      }
    } catch (e) {
      console.error("Error in handleDelete:", e);
      setActionMessage({ type: "error", text: "Terjadi kesalahan jaringan saat menghapus data." });
    } finally {
      setDeleting(false);
    }
  };

  const handleSwitchRoleSubmit = async () => {
    if (!switchRolePerson) return;
    setSwitchSubmitting(true);
    try {
      const res = await fetch("/api/management/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: switchRolePerson.id,
          targetRole: selectedTargetRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSwitchRolePerson(null);
        setActionMessage({ type: "success", text: data.message });
        setTimeout(() => setActionMessage(null), 5000);
        fetchPersonnel();
      } else {
        setActionMessage({ type: "error", text: data.error || "Gagal mengalihkan peran personel." });
      }
    } catch (e) {
      console.error("Error in handleSwitchRoleSubmit:", e);
      setActionMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setSwitchSubmitting(false);
    }
  };

  // Stats
  const totalCount = personnelList.length;
  const activeCount = personnelList.filter((p) => p.status === "AKTIF").length;
  const pimpinanCount = personnelList.filter(
    (p) => p.department.includes("Pimpinan") || p.department.includes("Akademik")
  ).length;
  const operasionalCount = totalCount - pimpinanCount;

  return (
    <div className="space-y-6">
      {/* Background Dashboard Content (Hidden in Print Mode) */}
      <div className="space-y-6 print:hidden">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link href="/admin" className="hover:text-slate-800 transition">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/admin/master" className="hover:text-slate-800 transition">
            Data Master
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-emerald-700 font-bold">Data Manajemen</span>
        </div>

        {/* Action Notification */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
              }`}
          >
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>Struktur Organisasi & Tata Kelola</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Data Personel Manajemen</h1>
              <p className="mt-1.5 text-indigo-200/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Daftar pejabat struktural, pengelola kelembagaan, staf tata usaha, bendahara, dan operator sistem PKBM Askara.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <CsvImportExport
                exportData={personnelList}
                exportFilename={`data_manajemen_${new Date().toISOString().slice(0, 10)}.csv`}
                templateHeaders={[
                  "fullName", "email", "phone", "nik", "positionApplied", "department", "address", "gender", "birthPlace", "birthDate", "lastEducation"
                ]}
                onImport={async (data) => {
                  try {
                    const res = await fetch("/api/management/bulk", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ data }),
                    });
                    const result = await res.json();
                    if (result.success) {
                      setActionMessage({ type: "success", text: result.message });
                      fetchPersonnel();
                    } else {
                      setActionMessage({ type: "error", text: result.error });
                    }
                  } catch (e) {
                    setActionMessage({ type: "error", text: "Gagal melakukan import data" });
                  }
                }}
              />
              <button
                onClick={() => {
                  setSkMode("KOLEKTIF");
                  if (personnelList.length > 0 && !selectedSkPersonId) {
                    setSelectedSkPersonId(personnelList[0].id);
                  }
                  setShowSkModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition backdrop-blur-sm border border-indigo-400/40 shadow-sm hover-lift"
              >
                <FileText className="w-4 h-4 text-indigo-200" />
                <span>Surat Keputusan (SK)</span>
              </button>
              <button
                onClick={() => setShowRekapModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition backdrop-blur-sm border border-white/15 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Buku Rekapitulasi</span>
              </button>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/30 hover-lift"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Personel</span>
              </button>
            </div>
          </div>

          {/* Decorative Background Pattern */}
          <div className="absolute right-4 bottom-2 opacity-5 pointer-events-none">
            <Building2 className="w-56 h-56" />
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Personel</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{totalCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Seluruh divisi struktural</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Status Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">{activeCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sedang menjabat aktif</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Pimpinan & Waka</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-800 mt-2">{pimpinanCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Unsur pimpinan & penanggung jawab</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Staff & Operasional</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-800 mt-2">{operasionalCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">TU, Keuangan, IT & Sarpras</p>
          </div>
        </div>

        {/* Toolbar: Search, Filters & View Toggle */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIP, jabatan, nomor SK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Departemen Dropdown */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === "SEMUA" ? "Semua Divisi" : dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SEMUA">Semua Status</option>
                <option value="AKTIF">Aktif</option>
                <option value="CUTI">Cuti</option>
                <option value="NON-AKTIF">Non-Aktif</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "grid" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                Kartu
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "table" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                Tabel
              </button>
            </div>

            <button
              onClick={fetchPersonnel}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content: Grid or Table View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Memuat data personel manajemen...</p>
          </div>
        ) : personnelList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">Tidak ada data personel manajemen</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedDept !== "SEMUA"
                ? "Tidak ada data yang cocok dengan kriteria filter pencarian."
                : "Belum ada data personel yang ditambahkan."}
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
            >
              + Tambah Personel Sekarang
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID CARDS VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {personnelList.map((person) => {
              const st = STATUS_CONFIG[person.status] || STATUS_CONFIG.AKTIF;
              const deptIcon = DEPARTMENT_ICONS[person.department] || "🏢";

              return (
                <div
                  key={person.id}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6">
                    {/* Top Bar: Dept Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[11px] font-bold truncate max-w-[200px]">
                        <span>{deptIcon}</span>
                        <span className="truncate">{person.department}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {person.isDualRole && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-emerald-600" />
                            <span>Rangkap Guru</span>
                          </span>
                        )}
                        {person.isParentRole && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                            <Users className="w-3 h-3 text-amber-600" />
                            <span>Wali Murid {person.childrenCount ? `(${person.childrenCount} Anak)` : ''}</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex items-start gap-3.5">
                      {person.photoUrl ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm shrink-0 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={person.photoUrl}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-800 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition truncate leading-snug">
                          {person.name}
                        </h3>
                        <p className="text-xs font-semibold text-indigo-700 mt-0.5 leading-snug">{person.position}</p>
                        {person.nip && (
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">NIP: {person.nip}</p>
                        )}
                      </div>
                    </div>

                    {/* Responsibilities snippet */}
                    {person.responsibilities && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 line-clamp-2 border border-slate-100 leading-relaxed">
                        {person.responsibilities}
                      </div>
                    )}

                    {/* Contact & SK info */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-600 font-medium">{person.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`https://wa.me/${person.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-emerald-700 font-medium hover:underline"
                        >
                          {person.phone}
                        </a>
                      </div>
                      {person.skNumber && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[11px] text-slate-400 truncate">SK: {person.skNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {person.joinDate ? `TMT: ${new Date(person.joinDate).toLocaleDateString("id-ID")}` : "Staf PKBM"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedSkPersonId(person.id);
                          setSkMode("INDIVIDUAL");
                          setShowSkModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Lihat / Cetak SK Pegawai"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSwitchRolePerson(person);
                          setSelectedTargetRole(
                            person.isDualRole
                              ? "DUAL_ROLE"
                              : person.role === "pendidik"
                              ? "TUTOR_ONLY"
                              : "MANAJEMEN_ONLY"
                          );
                        }}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Atur Keterlibatan & Switch Peran"
                      >
                        <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                      </button>
                      <button
                        onClick={() => setShowDetailModal(person)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Lihat Profil Lengkap"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(person)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Edit Data Personel"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(person)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Hapus Personel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-5 py-3.5 text-left">Nama & NIP</th>
                    <th className="px-5 py-3.5 text-left">Jabatan</th>
                    <th className="px-5 py-3.5 text-left">Divisi / Departemen</th>
                    <th className="px-5 py-3.5 text-left">Kontak</th>
                    <th className="px-5 py-3.5 text-left">Nomor SK</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personnelList.map((person) => {
                    const st = STATUS_CONFIG[person.status] || STATUS_CONFIG.AKTIF;
                    return (
                      <tr key={person.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {person.photoUrl ? (
                              <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-2xs shrink-0 bg-slate-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={person.photoUrl}
                                  alt={person.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {person.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">{person.name}</div>
                              {person.nip && <div className="text-[11px] font-mono text-slate-400">NIP: {person.nip}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-1">
                            <span className="font-semibold text-indigo-700 text-xs block">{person.position}</span>
                            <div className="flex flex-wrap gap-1">
                              {person.isDualRole && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <GraduationCap className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Rangkap Guru</span>
                                </span>
                              )}
                              {person.isParentRole && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Users className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Wali Murid {person.childrenCount ? `(${person.childrenCount} Anak)` : ''}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                            {person.department}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 space-y-0.5">
                          <div>{person.email}</div>
                          <div className="text-slate-400">{person.phone}</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                          {person.skNumber || "-"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${st.bg} ${st.text}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedSkPersonId(person.id);
                                setSkMode("INDIVIDUAL");
                                setShowSkModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Lihat / Cetak SK Pegawai"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSwitchRolePerson(person);
                                setSelectedTargetRole(
                                  person.isDualRole
                                    ? "DUAL_ROLE"
                                    : person.role === "pendidik"
                                    ? "TUTOR_ONLY"
                                    : "MANAJEMEN_ONLY"
                                );
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Atur Keterlibatan & Switch Peran"
                            >
                              <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                            </button>
                            <button
                              onClick={() => setShowDetailModal(person)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Lihat Profil Lengkap"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(person)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Edit Data Personel"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(person)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Hapus Personel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT MANAJEMEN */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 text-white relative shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-200">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingPersonnel ? "Edit Data Personel Manajemen" : "Tambah Personel Manajemen Baru"}
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Lengkapi seluruh identitas, jabatan struktural, pendidikan, dan berkas personel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs bg-slate-50/50">
              {/* 1. SEKSI JABATAN & PENUGASAN */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>1. Posisi & Penempatan Manajemen</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Jabatan Struktural <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Contoh: Kepala Tata Usaha"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Divisi / Bidang Kerja <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                    >
                      {DEPARTMENTS.filter((d) => d !== "SEMUA").map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Pengalaman Kerja (Tahun)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                      placeholder="Contoh: 3"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Nomor SK Pengangkatan</label>
                    <input
                      type="text"
                      value={formData.skNumber}
                      onChange={(e) => setFormData({ ...formData, skNumber: e.target.value })}
                      placeholder="SK-PKBM/001/VI/2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Tanggal Mulai Menjabat (TMT)</label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Status Jabatan</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as "AKTIF" | "CUTI" | "NON-AKTIF" })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-semibold"
                    >
                      <option value="AKTIF">Aktif Menjabat</option>
                      <option value="CUTI">Cuti / Tugas Luar</option>
                      <option value="NON-AKTIF">Non-Aktif / Purna Tugas</option>
                    </select>
                  </div>

                  {/* DUAL-ROLE RANGKAP GURU / PENDIDIK */}
                  <div className="sm:col-span-2 lg:col-span-3 p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-emerald-950 block">
                            Merangkap Role Guru / Pendidik (Dual Role Manajemen & Guru)
                          </span>
                          <span className="text-[11px] text-emerald-700">
                            Aktifkan jika staf manajemen ini juga mengemban tugas mengajar mata pelajaran / tutor.
                          </span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.isDualRole}
                          onChange={(e) => setFormData({ ...formData, isDualRole: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {formData.isDualRole && (
                      <div className="pt-3 border-t border-emerald-200/70 space-y-2 animate-in fade-in">
                        <label className="block text-xs font-bold text-emerald-950">
                          Mata Pelajaran / Bidang Ajar Rangkap
                        </label>
                        <input
                          type="text"
                          value={formData.teachingSubject}
                          onChange={(e) => setFormData({ ...formData, teachingSubject: e.target.value })}
                          placeholder="Contoh: Matematika / Bahasa Indonesia / Keterampilan"
                          className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-2xs"
                        />
                        <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100 flex items-center gap-2 text-[11px] text-emerald-800">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Personel ini akan otomatis memperoleh hak akses ganda dan tombol <strong>Switch Role</strong> (Manajemen &harr; Guru) di sistem.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DUAL-ROLE RANGKAP ORANG TUA / WALI SISWA */}
                  <div className="sm:col-span-2 lg:col-span-3 p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-700 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-amber-950 block">
                            Merangkap Role Orang Tua / Wali Siswa (Dual Role Manajemen & Orang Tua)
                          </span>
                          <span className="text-[11px] text-amber-700">
                            Aktifkan jika staf manajemen ini juga memiliki anak yang bersekolah di PKBM Askara.
                          </span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.isParentRole}
                          onChange={(e) => setFormData({ ...formData, isParentRole: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {formData.isParentRole && (
                      <div className="pt-3 border-t border-amber-200/70 space-y-3 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-amber-950 mb-1">
                              Status Hubungan dengan Siswa
                            </label>
                            <select
                              value={formData.parentRelationship}
                              onChange={(e) => setFormData({ ...formData, parentRelationship: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl text-xs text-amber-950 font-medium focus:ring-2 focus:ring-amber-600 focus:outline-none shadow-2xs"
                            >
                              <option value="AYAH">Ayah Kandung</option>
                              <option value="IBU">Ibu Kandung</option>
                              <option value="WALI">Wali Murid</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-amber-950 mb-1">
                              Pekerjaan / Keterangan Orang Tua
                            </label>
                            <input
                              type="text"
                              value={formData.parentJob}
                              onChange={(e) => setFormData({ ...formData, parentJob: e.target.value })}
                              placeholder="Contoh: Staf Manajemen PKBM"
                              className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl text-xs text-amber-950 font-medium focus:ring-2 focus:ring-amber-600 focus:outline-none shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Student selection box */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-amber-950">
                              Pilih Anak / Siswa Terdaftar ({formData.childrenStudentIds.length} Dipilih)
                            </label>
                            {formData.childrenStudentIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, childrenStudentIds: [] })}
                                className="text-[11px] font-semibold text-rose-600 hover:underline"
                              >
                                Hapus Semua Pilihan
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Cari nama siswa atau NISN..."
                            value={studentSearchKeyword}
                            onChange={(e) => setStudentSearchKeyword(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <div className="max-h-36 overflow-y-auto bg-white border border-amber-200/80 rounded-xl p-2 space-y-1 text-xs divide-y divide-slate-100">
                            {allStudentsList.length === 0 ? (
                              <div className="py-2 text-center text-slate-400 text-xs">Memuat daftar siswa...</div>
                            ) : (
                              allStudentsList
                                .filter((s) => {
                                  if (!studentSearchKeyword) return true;
                                  const kw = studentSearchKeyword.toLowerCase();
                                  return s.name.toLowerCase().includes(kw) || s.nisn.toLowerCase().includes(kw);
                                })
                                .map((s) => {
                                  const isSelected = formData.childrenStudentIds.includes(s.id);
                                  return (
                                    <label
                                      key={s.id}
                                      className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer hover:bg-amber-50/60 transition ${isSelected ? "bg-amber-100/70 font-semibold" : ""
                                        }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setFormData({
                                                ...formData,
                                                childrenStudentIds: [...formData.childrenStudentIds, s.id],
                                              });
                                            } else {
                                              setFormData({
                                                ...formData,
                                                childrenStudentIds: formData.childrenStudentIds.filter((id) => id !== s.id),
                                              });
                                            }
                                          }}
                                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                        />
                                        <span className="text-slate-800 text-xs">{s.name}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {s.packet} • {s.class} (NISN: {s.nisn})
                                      </span>
                                    </label>
                                  );
                                })
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 bg-white/80 rounded-xl border border-amber-100 flex items-center gap-2 text-[11px] text-amber-800">
                          <Users className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Akun ini dapat masuk menggunakan tab <strong>Orang Tua</strong> maupun <strong>Manajemen</strong> di halaman login.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. SEKSI IDENTITAS PRIBADI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <User className="w-4 h-4 text-indigo-600" />
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
                      placeholder="Contoh: Dra. Hj. Siti Aminah, M.Pd."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">NIK / NUPTK / ID Pegawai</label>
                    <input
                      type="text"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      placeholder="16 digit NIK"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700">Tanggal Lahir</label>
                      {formData.birthDate && (
                        <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {liveAge}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Agama</label>
                    <select
                      value={formData.religion}
                      onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Status Pernikahan</label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>3. Kontak & Alamat Domisili</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Email Kedinasan / Utama</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nama@askara.sch.id"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">No. Telepon / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1.5">Alamat Lengkap Domisili</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Jl. Nama Jalan No. XX, RT/RW, Kelurahan..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Kota Bandung"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Provinsi</label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="Jawa Barat"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1.5">Tautan Profil LinkedIn / Medsos</label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. SEKSI PENDIDIKAN & AKADEMIK */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>4. Riwayat Pendidikan & Akademik</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Pendidikan Terakhir</label>
                    <select
                      value={formData.lastEducation}
                      onChange={(e) => setFormData({ ...formData, lastEducation: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="SMA/SMK">SMA / SMK / Sederajat</option>
                      <option value="D3">Diploma (D3)</option>
                      <option value="D4/S1">Sarjana (S1 / D4)</option>
                      <option value="S2">Magister (S2)</option>
                      <option value="S3">Doktor (S3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Status Kelulusan</label>
                    <select
                      value={formData.educationStatus}
                      onChange={(e) => setFormData({ ...formData, educationStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="Sudah Lulus">Sudah Lulus</option>
                      <option value="Sedang Menempuh">Sedang Menempuh Pendidikan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Program Studi / Jurusan</label>
                    <input
                      type="text"
                      value={formData.majorStudy}
                      onChange={(e) => setFormData({ ...formData, majorStudy: e.target.value })}
                      placeholder="Contoh: Manajemen Pendidikan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Tahun Kelulusan</label>
                    <input
                      type="text"
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                      placeholder="Contoh: 2020"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Asal Kampus / Universitas</label>
                    <input
                      type="text"
                      value={formData.universityName}
                      onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                      placeholder="Contoh: Universitas Pendidikan Indonesia"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Keahlian & Keterampilan Khusus</label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="Contoh: Microsoft Excel, Administrasi Dapodik, Akuntansi"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. SEKSI REKENING & PROFIL PRIBADI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>5. Data Rekening Payroll & Profil Pribadi</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Nama Bank</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Contoh: BCA / Mandiri / BSI"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Nomor Rekening Bank</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      placeholder="Nomor Rekening"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Hobi & Minat</label>
                    <input
                      type="text"
                      value={formData.hobbies}
                      onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                      placeholder="Membaca, Desain, dll."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Motto Hidup</label>
                    <input
                      type="text"
                      value={formData.lifeMotto}
                      onChange={(e) => setFormData({ ...formData, lifeMotto: e.target.value })}
                      placeholder="Motto inspiratif..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white italic"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1.5">Tupoksi / Tanggung Jawab Utama Jabatan</label>
                    <textarea
                      value={formData.responsibilities}
                      onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                      rows={3}
                      placeholder="Rincian wewenang, fungsi koordinasi, dan tugas pokok jabatan..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 6. SEKSI FOTO PROFIL */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>6. Foto Personel Manajemen</span>
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {formData.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                        <span className="text-[9px] text-slate-400 block mt-0.5">Belum ada foto</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingPhoto ? "Mengunggah..." : "Pilih Berkas Foto"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploadingPhoto}
                        />
                      </label>
                      {formData.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoUrl: "" })}
                          className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 font-bold transition"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="Atau masukkan tautan URL foto resmi (https://...)"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 7. SEKSI UNGGAH BERKAS DOKUMEN PERSYARATAN */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>7. Unggah Berkas & Dokumen Persyaratan</span>
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
                    label="KTP Asli Pendaftar"
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
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-900/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Menyimpan Data..." : editingPersonnel ? "Simpan Perubahan Data" : "Simpan Personel Manajemen"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PROFIL */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white text-center relative shrink-0">
              <button
                onClick={() => setShowDetailModal(null)}
                className="absolute right-4 top-4 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex justify-center mb-3">
                {showDetailModal.photoUrl ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/40 shadow-xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={showDetailModal.photoUrl}
                      alt={showDetailModal.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-white/15 rounded-2xl flex items-center justify-center text-3xl font-bold border-4 border-white/20 shadow-inner">
                    {showDetailModal.name.charAt(0)}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{showDetailModal.name}</h2>
              <p className="text-indigo-200 text-sm mt-0.5 font-semibold">{showDetailModal.position}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-0.5 bg-indigo-500/30 text-indigo-100 rounded-full text-xs font-bold border border-indigo-400/30">
                {showDetailModal.department}
              </div>
            </div>

            {/* Modal Detail Body */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[72vh] text-xs bg-slate-50/50">

              {/* 1. SEKSI JABATAN & KUALIFIKASI STRUKTURAL */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>1. Posisi & Kualifikasi Struktural Manajemen</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Jabatan Struktural</span>
                    <span className="font-extrabold text-indigo-700 text-xs sm:text-sm block mt-0.5">{showDetailModal.position}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Divisi / Departemen</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">{showDetailModal.department}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">NIP / NIK</span>
                    <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{showDetailModal.nip || "-"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Nomor SK Pegawai</span>
                    <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{showDetailModal.skNumber || "-"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Tanggal Bergabung (TMT)</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">
                      {showDetailModal.joinDate ? new Date(showDetailModal.joinDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pendidikan Terakhir</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">
                      {showDetailModal.lastEducation || "-"} {showDetailModal.majorStudy ? `(${showDetailModal.majorStudy})` : ""} {showDetailModal.educationStatus ? ` - ${showDetailModal.educationStatus}` : ""}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Asal Kampus / Sekolah</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5 truncate">
                      {showDetailModal.universityName || "-"} {showDetailModal.graduationYear ? `Lulus ${showDetailModal.graduationYear}` : ""}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pengalaman Kerja</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">
                      {showDetailModal.experienceYears !== undefined ? `${showDetailModal.experienceYears} Tahun` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-3">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Tupoksi & Wewenang Jabatan</span>
                    <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed">
                      {showDetailModal.responsibilities || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* DUAL ROLE ORANG TUA INFO IN DETAIL MODAL */}
              {showDetailModal.isParentRole && (
                <div className="bg-amber-50/60 rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs space-y-3">
                  <h4 className="font-bold text-amber-950 uppercase text-[11px] tracking-wider flex items-center justify-between pb-2 border-b border-amber-200/70">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-700" />
                      <span>Peran Ganda: Orang Tua / Wali Murid</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded-full text-[10px] font-bold">
                      {showDetailModal.parentRelationship || "ORANG TUA"}
                    </span>
                  </h4>
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-amber-950 block">
                      Daftar Anak / Siswa yang Terhubung ({showDetailModal.children?.length || 0} Anak):
                    </span>
                    {showDetailModal.children && showDetailModal.children.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {showDetailModal.children.map((child) => (
                          <div
                            key={child.id}
                            className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{child.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">NISN: {child.nisn}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold">
                              {child.packetType} • {child.className}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-800 italic">Belum ada siswa yang ditautkan ke profil orang tua ini.</p>
                    )}
                  </div>
                </div>
              )}

              {/* 2. SEKSI IDENTITAS LENGKAP & BIODATA DIRI */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>2. Identitas Lengkap & Biodata Pribadi</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Lengkap Personel</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">{showDetailModal.name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Jenis Kelamin</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {showDetailModal.gender === "P" ? "Perempuan (P)" : "Laki-laki (L)"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Usia Terhitung</span>
                    <span className="font-bold text-emerald-700 text-xs block mt-0.5">
                      {calculateDetailedAge(showDetailModal.birthDate)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Tempat, Tanggal Lahir</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {showDetailModal.birthPlace || "-"}, {showDetailModal.birthDate ? new Date(showDetailModal.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Agama</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">{showDetailModal.religion || "-"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Status Pernikahan</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">{showDetailModal.maritalStatus || "-"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Ibu Kandung</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {showDetailModal.motherName || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between sm:col-span-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">No. WhatsApp / HP</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">{showDetailModal.phone || "-"}</span>
                    </div>
                    {showDetailModal.phone && showDetailModal.phone !== "-" && (
                      <a
                        href={`https://wa.me/${showDetailModal.phone.replace(/[^0-9]/g, "")}`}
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
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Email Personel</span>
                      <span className="font-semibold text-slate-900 text-xs block mt-0.5 truncate max-w-[150px]">{showDetailModal.email || "-"}</span>
                    </div>
                    {showDetailModal.email && showDetailModal.email !== "-" && (
                      <a
                        href={`mailto:${showDetailModal.email}`}
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
                      {showDetailModal.address || "-"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Kota / Kabupaten</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">{showDetailModal.city || "Kota Bandung"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-4">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Provinsi</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {showDetailModal.province || "Jawa Barat"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. SEKSI MINAT, SOSIAL MEDIA & PAYROLL */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>4. Sosial Media, Rekening & Info Lainnya</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Sosial Media & Portofolio</span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {showDetailModal.linkedinUrl && (
                        <a
                          href={showDetailModal.linkedinUrl.startsWith("http") ? showDetailModal.linkedinUrl : `https://${showDetailModal.linkedinUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 flex items-center gap-1.5 transition text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>LinkedIn / Portofolio Web</span>
                        </a>
                      )}
                      {showDetailModal.socialMedia ? (
                        <span className="font-medium text-slate-700 text-xs">{showDetailModal.socialMedia}</span>
                      ) : !showDetailModal.linkedinUrl ? (
                        <span className="text-slate-400 text-xs italic">-</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Hobi & Minat</span>
                    <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed">
                      {showDetailModal.hobbies || "-"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Motto Hidup</span>
                    <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed italic">
                      {showDetailModal.lifeMotto ? `"${showDetailModal.lifeMotto}"` : "-"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Data Rekening Bank (Payroll)</span>
                    <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                      {showDetailModal.bankName || "-"} - {showDetailModal.bankAccountNumber || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. SEKSI DOKUMEN & BERKAS PERSYARATAN */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>5. Dokumen & Berkas Lamaran Manajemen</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    { label: "Curriculum Vitae (CV) & Lamaran", url: showDetailModal.cvResumeUrl, icon: "📄" },
                    { label: "KTP Asli Pendaftar", url: showDetailModal.ktpUrl, icon: "🪪" },
                    { label: "Ijazah Pendidikan Terakhir", url: showDetailModal.diplomaUrl, icon: "🎓" },
                    { label: "Transkrip Nilai / SKHUN", url: showDetailModal.transcriptUrl, icon: "📊" },
                    { label: "Kartu Keluarga (KK)", url: showDetailModal.kkUrl, icon: "👨‍👩‍👧‍👦" },
                    { label: "NPWP", url: showDetailModal.npwpUrl, icon: "💳" },
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
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1 shadow-2xs"
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

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    const person = showDetailModal;
                    setShowDetailModal(null);
                    handleOpenEdit(person);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                  Edit Profil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS KONFIRMASI */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hapus Personel Manajemen?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Apakah Anda yakin ingin menghapus data <strong className="text-slate-800">{deleteConfirm.name}</strong> ({deleteConfirm.position})?
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? "Menghapus..." : "Hapus Data"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL SURAT KEPUTUSAN (SK) PENGANGKATAN MANAJEMEN RESMI       */}
      {/* ============================================================ */}
      {showSkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[96vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:rounded-none print:max-w-full print:max-h-none print:overflow-visible print:m-0 print:p-0">
            {/* Top Toolbar */}
            <div className="print:hidden p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSkMode("KOLEKTIF")}
                    className={`px-3 py-1.5 rounded-lg transition ${skMode === "KOLEKTIF" ? "bg-white text-indigo-800 shadow-2xs font-bold" : "text-slate-600"
                      }`}
                  >
                    📜 SK Kolektif Struktur
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSkMode("INDIVIDUAL");
                      if (personnelList.length > 0 && !selectedSkPersonId) {
                        setSelectedSkPersonId(personnelList[0].id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${skMode === "INDIVIDUAL" ? "bg-white text-indigo-800 shadow-2xs font-bold" : "text-slate-600"
                      }`}
                  >
                    👤 SK Individual Staf
                  </button>
                </div>

                {skMode === "INDIVIDUAL" && (
                  <select
                    value={selectedSkPersonId}
                    onChange={(e) => setSelectedSkPersonId(e.target.value)}
                    className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-600 max-w-xs"
                  >
                    {personnelList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.position}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak SK / PDF</span>
                </button>
                <button
                  onClick={() => setShowSkModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Document Printable View */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
              <div className="printable-document max-w-[750px] mx-auto bg-white p-8 sm:p-12 shadow-md rounded-xl border border-slate-200 text-slate-900 font-serif leading-relaxed text-sm print:max-w-full print:p-0 print:border-none print:shadow-none print:rounded-none">
                {/* Kop Surat */}
                <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 flex items-center gap-4">
                  <img
                    src="/logo.png"
                    alt="Logo PKBM"
                    className="h-20 w-auto object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="text-center flex-1">
                    <h3 className="text-xs font-bold tracking-widest text-slate-700 uppercase font-sans">
                      PEMERINTAH KOTA BANDUNG • DINAS PENDIDIKAN
                    </h3>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-sans mt-0.5">
                      PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) ASKARA
                    </h2>
                    <p className="text-[11px] text-slate-600 font-sans">
                      Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP • NPSN: P9998766
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                      Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung • Telp: (022) 87518584 / 085156560630 • Email: pkbm.askara@gmail.com
                    </p>
                  </div>
                </div>

                {/* Judul Surat */}
                <div className="text-center mb-6">
                  <h1 className="text-base font-bold underline uppercase tracking-wide">
                    SURAT KEPUTUSAN KEPALA PKBM ASKARA
                  </h1>
                  <p className="text-xs font-sans font-bold text-slate-700 mt-1">
                    Nomor:{" "}
                    {skMode === "INDIVIDUAL"
                      ? personnelList.find((p) => p.id === selectedSkPersonId)?.skNumber || "021/SK-MGT/PKBM-ASKARA/VIII/2026"
                      : "005/SK-STRUKTUR/PKBM-ASKARA/VIII/2026"}
                  </p>
                  <p className="text-xs font-sans font-bold text-slate-900 uppercase mt-1 tracking-tight">
                    TENTANG <br />
                    {skMode === "INDIVIDUAL"
                      ? `PENGANGKATAN DAN PENETAPAN JABATAN ${personnelList.find((p) => p.id === selectedSkPersonId)?.position.toUpperCase() || "PEJABAT MANAJEMEN"} PKBM ASKARA TAHUN AJARAN 2026/2027`
                      : "PENETAPAN SUSUNAN PENGELOLA DAN STRUKTUR ORGANISASI MANAJEMEN PKBM ASKARA TAHUN AJARAN 2026/2027"}
                  </p>
                </div>

                {/* Isuk Surat */}
                <div className="space-y-3.5 text-justify text-xs sm:text-sm">
                  <p>
                    <strong>MENIMBANG:</strong>
                  </p>
                  <ol className="list-alpha pl-6 space-y-1 text-xs">
                    <li>
                      Bahwa dalam rangka tertib administrasi, optimalisasi operasional kelembagaan, serta peningkatan mutu layanan pendidikan kesetaraan pada PKBM Askara.
                    </li>
                    <li>
                      Bahwa personel yang namanya tercantum dalam keputusan ini dipandang cakap, loyal, dan memenuhi syarat kualifikasi untuk mengemban tugas dan tanggung jawab jabatan.
                    </li>
                  </ol>

                  <p>
                    <strong>MENGINGAT:</strong>
                  </p>
                  <ol className="list-decimal pl-6 space-y-1 text-xs">
                    <li>Undang-Undang No. 20 Tahun 2003 tentang Sistem Pendidikan Nasional.</li>
                    <li>Peraturan Pemerintah No. 57 Tahun 2021 tentang Standar Nasional Pendidikan.</li>
                    <li>Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) PKBM Askara.</li>
                  </ol>

                  <p className="text-center font-bold font-sans my-3">MEMUTUSKAN</p>

                  {skMode === "INDIVIDUAL" ? (
                    (() => {
                      const person = personnelList.find((p) => p.id === selectedSkPersonId) || personnelList[0];
                      if (!person) return null;
                      return (
                        <>
                          <p>
                            <strong>MENETAPKAN:</strong> Mengangkat dan menetapkan personel di bawah ini:
                          </p>
                          <div className="pl-6 space-y-1 font-sans text-xs my-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="grid grid-cols-3">
                              <span className="font-semibold text-slate-600">Nama Lengkap</span>
                              <span className="col-span-2 font-bold text-slate-900">: {person.name}</span>
                            </div>
                            <div className="grid grid-cols-3">
                              <span className="font-semibold text-slate-600">NIP / NUPTK</span>
                              <span className="col-span-2 font-mono">: {person.nip || "-"}</span>
                            </div>
                            <div className="grid grid-cols-3">
                              <span className="font-semibold text-slate-600">Jabatan Ditetapkan</span>
                              <span className="col-span-2 font-bold text-indigo-900">: {person.position}</span>
                            </div>
                            <div className="grid grid-cols-3">
                              <span className="font-semibold text-slate-600">Divisi / Unit Kerja</span>
                              <span className="col-span-2">: {person.department}</span>
                            </div>
                            <div className="grid grid-cols-3">
                              <span className="font-semibold text-slate-600">Terhitung Mulai Tgl (TMT)</span>
                              <span className="col-span-2">
                                : {person.joinDate ? new Date(person.joinDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "16 Agustus 2026"}
                              </span>
                            </div>
                          </div>
                          <p>
                            <strong>PERTAMA:</strong> Menugaskan yang bersangkutan untuk menjalankan tugas pokok dan fungsi jabatan: <em>{person.responsibilities || "Melaksanakan tugas kepengurusan manajemen sesuai standar SOP kelembagaan PKBM Askara."}</em>
                          </p>
                          <p>
                            <strong>KEDUA:</strong> Keputusan ini berlaku sejak tanggal ditetapkan, dan apabila di kemudian hari terdapat kekeliruan akan diperbaiki sebagaimana mestinya.
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <p>
                        <strong>PERTAMA:</strong> Menetapkan susunan struktur pengelola dan pejabat manajemen PKBM Askara Tahun Ajaran 2026/2027 sebagaimana daftar terlampir:
                      </p>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-[11px] font-sans border border-slate-300">
                          <thead className="bg-slate-100 text-slate-800">
                            <tr>
                              <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                              <th className="p-1.5 border border-slate-300 text-left">Nama & NIP</th>
                              <th className="p-1.5 border border-slate-300 text-left">Jabatan Struktural</th>
                              <th className="p-1.5 border border-slate-300 text-left">Divisi</th>
                              <th className="p-1.5 border border-slate-300 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {personnelList.map((p, idx) => (
                              <tr key={p.id}>
                                <td className="p-1.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                                <td className="p-1.5 border border-slate-300">
                                  <span className="font-bold block text-slate-900">{p.name}</span>
                                  {p.nip && <span className="text-[10px] text-slate-500 font-mono">NIP: {p.nip}</span>}
                                </td>
                                <td className="p-1.5 border border-slate-300 font-semibold text-indigo-900">{p.position}</td>
                                <td className="p-1.5 border border-slate-300">{p.department}</td>
                                <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-800">
                                  {p.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2">
                        <strong>KEDUA:</strong> Segala biaya yang timbul akibat diterbitkannya keputusan ini dibebankan pada anggaran operasional lembaga PKBM Askara.
                      </p>
                    </>
                  )}
                </div>

                {/* Signature Block */}
                <div className="mt-10 pt-4 flex items-end justify-between">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-300 bg-slate-50/60 text-[10px] font-sans">
                    <div className="w-14 h-14 bg-white border border-slate-200 rounded flex items-center justify-center p-1">
                      <QrCode className="w-full h-full text-slate-800" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">DOKUMEN RESMI TERVERIFIKASI</span>
                      <span className="font-mono text-slate-600 block">VRF-SK-MGT-202688</span>
                      <span className="text-slate-500">Pindai QR untuk validasi keaslian SK</span>
                    </div>
                  </div>

                  <div className="text-center font-sans">
                    <p className="text-xs text-slate-600">
                      Ditetapkan di: Bandung <br />
                      Pada tanggal:{" "}
                      {new Date().toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs font-bold text-slate-800 mt-1">Kepala PKBM Askara</p>
                    <div className="h-16 flex items-center justify-center relative">
                      <div className="absolute opacity-20 border-2 border-indigo-700 text-indigo-800 rounded-full px-4 py-1 text-[10px] font-black uppercase rotate-[-12deg]">
                        PKBM ASKARA BANDUNG
                      </div>
                      <span className="font-serif italic font-bold text-indigo-900 text-sm">
                        Arif Syarifudin, S.Pd.
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 border-t border-slate-400 pt-0.5 min-w-44">
                      Arif Syarifudin, S.Pd.
                    </p>
                    <p className="text-[10px] text-slate-500">NIP. 19870213 201201 1 001</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL BUKU REKAPITULASI DATA PERSONEL MANAJEMEN MASTER        */}
      {/* ============================================================ */}
      {showRekapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:rounded-none print:max-w-full print:max-h-none print:overflow-visible print:m-0 print:p-0">
            {/* Top Toolbar */}
            <div className="print:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Buku Rekapitulasi Personel Manajemen</h3>
                  <p className="text-[11px] text-slate-500">
                    Master Roster Pengelola Kelembagaan • {personnelList.length} Personel Terdaftar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Rekapitulasi / PDF</span>
                </button>
                <button
                  onClick={() => setShowRekapModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Master Roster Document */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
              <div className="printable-document max-w-[850px] mx-auto bg-white p-8 sm:p-10 shadow-md rounded-xl border border-slate-200 text-slate-900 font-sans leading-relaxed text-xs print:max-w-full print:p-0 print:border-none print:shadow-none print:rounded-none">
                {/* Kop Lembaga */}
                <div className="border-b-4 border-double border-slate-900 pb-3 mb-5 flex items-center gap-4">
                  <img
                    src="/logo.png"
                    alt="Logo PKBM"
                    className="h-16 w-auto object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="text-center flex-1">
                    <h3 className="text-xs font-bold tracking-widest text-slate-700 uppercase">
                      PEMERINTAH KOTA BANDUNG • DINAS PENDIDIKAN
                    </h3>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                      PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) ASKARA
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP • NPSN: P9998766
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung • Telp: (022) 87518584 / 085156560630 • Email: pkbm.askara@gmail.com
                    </p>
                  </div>
                </div>

                {/* Judul Laporan */}
                <div className="text-center mb-5">
                  <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-wide border-b-2 border-slate-900 pb-1 inline-block">
                    BUKU REKAPITULASI DATA PERSONEL & PENGELOLA MANAJEMEN
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-600 mt-1">
                    Tahun Ajaran 2026/2027 • Dicetak pada:{" "}
                    {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>

                {/* Ringkasan Ringkas */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Total Personel</span>
                    <span className="text-sm font-bold text-slate-900">{totalCount} Orang</span>
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] text-emerald-700 block">Status Aktif</span>
                    <span className="text-sm font-bold text-emerald-800">{activeCount} Orang</span>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-[10px] text-blue-700 block">Unsur Pimpinan</span>
                    <span className="text-sm font-bold text-blue-800">{pimpinanCount} Orang</span>
                  </div>
                  <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="text-[10px] text-purple-700 block">Staf Operasional</span>
                    <span className="text-sm font-bold text-purple-800">{operasionalCount} Orang</span>
                  </div>
                </div>

                {/* Master Roster Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border border-slate-300">
                    <thead className="bg-slate-100 text-slate-800 font-bold">
                      <tr>
                        <th className="p-1.5 border border-slate-300 text-center w-7">No</th>
                        <th className="p-1.5 border border-slate-300 text-left">Nama Lengkap & NIP</th>
                        <th className="p-1.5 border border-slate-300 text-left">Jabatan Struktural</th>
                        <th className="p-1.5 border border-slate-300 text-left">Divisi / Unit Kerja</th>
                        <th className="p-1.5 border border-slate-300 text-left">No. WhatsApp / Email</th>
                        <th className="p-1.5 border border-slate-300 text-left">Nomor SK</th>
                        <th className="p-1.5 border border-slate-300 text-center">TMT</th>
                        <th className="p-1.5 border border-slate-300 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {personnelList.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-1.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300">
                            <span className="font-bold block text-slate-900">{p.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono">NIP: {p.nip || "-"}</span>
                          </td>
                          <td className="p-1.5 border border-slate-300 font-semibold text-indigo-900">{p.position}</td>
                          <td className="p-1.5 border border-slate-300">{p.department}</td>
                          <td className="p-1.5 border border-slate-300 text-[9px]">
                            <span className="block font-medium">{p.phone}</span>
                            <span className="text-slate-500 truncate block">{p.email}</span>
                          </td>
                          <td className="p-1.5 border border-slate-300 font-mono text-[9px]">{p.skNumber || "-"}</td>
                          <td className="p-1.5 border border-slate-300 text-center text-[9px]">
                            {p.joinDate ? new Date(p.joinDate).toLocaleDateString("id-ID") : "-"}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center">
                            <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-emerald-100 text-emerald-800">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pengesahan Footer */}
                <div className="mt-8 pt-4 flex items-end justify-between text-xs">
                  <div>
                    <p className="text-[11px] text-slate-600">
                      Dicatat dan direkap oleh: <br />
                      <strong>Bagian Tata Usaha & Kepegawaian PKBM Askara</strong>
                    </p>
                  </div>
                  <div className="text-center min-w-44">
                    <p className="text-[11px] text-slate-600">
                      Bandung,{" "}
                      {new Date().toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 mt-0.5">Kepala PKBM Askara</p>
                    <div className="h-14 flex items-center justify-center relative">
                      <span className="font-serif italic font-bold text-indigo-900 text-xs">
                        Arif Syarifudin, S.Pd
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 border-t border-slate-400 pt-0.5">
                      Arif Syarifudin, S.Pd
                    </p>
                    <p className="text-[10px] text-slate-500">Kepala PKBM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SWITCH ROLE / ATUR KETERLIBATAN PERSONEL ── */}
      {switchRolePerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-900 p-6 text-white relative">
              <button
                onClick={() => setSwitchRolePerson(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white shadow-inner">
                  <ArrowLeftRight className="w-6 h-6 text-amber-200" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    Atur Keterlibatan & Peran Personel
                  </h3>
                  <p className="text-xs text-amber-100/80 mt-0.5">
                    Switch penugasan kepegawaian untuk <strong>{switchRolePerson.name}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Current Person Info */}
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Personel Terpilih
                  </span>
                  <h4 className="text-sm font-black text-slate-900">{switchRolePerson.name}</h4>
                  <p className="text-xs text-slate-500">{switchRolePerson.position} • {switchRolePerson.department}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    switchRolePerson.isDualRole
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                  }`}>
                    {switchRolePerson.isDualRole ? "✨ Rangkap Guru" : "🏢 Manajemen"}
                  </span>
                </div>
              </div>

              {/* Selection Options */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Penugasan / Status Peran Baru:
                </label>

                {/* Option 1: Manajemen Only */}
                <label
                  onClick={() => setSelectedTargetRole("MANAJEMEN_ONLY")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                    selectedTargetRole === "MANAJEMEN_ONLY"
                      ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetRole"
                    checked={selectedTargetRole === "MANAJEMEN_ONLY"}
                    onChange={() => setSelectedTargetRole("MANAJEMEN_ONLY")}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🏢</span>
                      <span>Hanya Manajemen & Staf TU</span>
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Fokus pada tugas administrasi dan operasional kantor. Dilepas dari daftar guru pengampu kelas.
                    </p>
                  </div>
                </label>

                {/* Option 2: Dual Role */}
                <label
                  onClick={() => setSelectedTargetRole("DUAL_ROLE")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                    selectedTargetRole === "DUAL_ROLE"
                      ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetRole"
                    checked={selectedTargetRole === "DUAL_ROLE"}
                    onChange={() => setSelectedTargetRole("DUAL_ROLE")}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>✨</span>
                      <span>Terlibat Keduanya (Dual Role: Guru & Manajemen)</span>
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Aktif mengajar siswa sekaligus memegang jabatan di manajemen / TU. Tercatat di kedua struktur.
                    </p>
                  </div>
                </label>

                {/* Option 3: Tutor Only */}
                <label
                  onClick={() => setSelectedTargetRole("TUTOR_ONLY")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                    selectedTargetRole === "TUTOR_ONLY"
                      ? "border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetRole"
                    checked={selectedTargetRole === "TUTOR_ONLY"}
                    onChange={() => setSelectedTargetRole("TUTOR_ONLY")}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>👨‍🏫</span>
                      <span>Pindahkan ke Pendidik / Tutor Saja</span>
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Dialihkan sepenuhnya menjadi tenaga pendidik / guru pengampu dan tidak lagi masuk di manajemen.
                    </p>
                  </div>
                </label>

                {/* Option 4: Bendahara */}
                <label
                  onClick={() => setSelectedTargetRole("BENDAHARA")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                    selectedTargetRole === "BENDAHARA"
                      ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetRole"
                    checked={selectedTargetRole === "BENDAHARA"}
                    onChange={() => setSelectedTargetRole("BENDAHARA")}
                    className="mt-1 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>💼</span>
                      <span>Bendahara & Tim Keuangan</span>
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Memiliki akses penuh pengelolaan kas, pembayaran SPP, dan pembukuan keuangan lembaga.
                    </p>
                  </div>
                </label>

                {/* Option 5: Nonaktif */}
                <label
                  onClick={() => setSelectedTargetRole("NONAKTIF")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                    selectedTargetRole === "NONAKTIF"
                      ? "border-rose-600 bg-rose-50/60 ring-2 ring-rose-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetRole"
                    checked={selectedTargetRole === "NONAKTIF"}
                    onChange={() => setSelectedTargetRole("NONAKTIF")}
                    className="mt-1 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <span>🚫</span>
                      <span>Non-aktifkan Status Personel</span>
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Menonaktifkan hak akses sistem dan mencatat status tidak aktif di kelembagaan.
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSwitchRolePerson(null)}
                  disabled={switchSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSwitchRoleSubmit}
                  disabled={switchSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-950/20 hover:opacity-95 transition flex items-center gap-2"
                >
                  {switchSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Perubahan Peran</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}