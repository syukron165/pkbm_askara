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
} from "lucide-react";

export interface ManagementPersonnel {
  id: string;
  name: string;
  nip?: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  status: "AKTIF" | "CUTI" | "NON-AKTIF";
  address?: string;
  joinDate?: string;
  skNumber?: string;
  photoUrl?: string;
  responsibilities?: string;
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

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    position: "",
    department: "Pimpinan & Struktural",
    email: "",
    phone: "",
    status: "AKTIF" as "AKTIF" | "CUTI" | "NON-AKTIF",
    address: "",
    joinDate: new Date().toISOString().split("T")[0],
    skNumber: "",
    photoUrl: "",
    responsibilities: "",
  });

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
        // Fallback to client base64 preview
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

  const handleOpenCreate = () => {
    setEditingPersonnel(null);
    setFormData({
      name: "",
      nip: "",
      position: "",
      department: "Pimpinan & Struktural",
      email: "",
      phone: "",
      status: "AKTIF",
      address: "",
      joinDate: new Date().toISOString().split("T")[0],
      skNumber: "",
      photoUrl: "",
      responsibilities: "",
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (person: ManagementPersonnel) => {
    setEditingPersonnel(person);
    setFormData({
      name: person.name,
      nip: person.nip || "",
      position: person.position,
      department: person.department,
      email: person.email,
      phone: person.phone,
      status: person.status,
      address: person.address || "",
      joinDate: person.joinDate || "",
      skNumber: person.skNumber || "",
      photoUrl: person.photoUrl || "",
      responsibilities: person.responsibilities || "",
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
    try {
      const res = await fetch(`/api/management?id=${deleteConfirm.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        setActionMessage({ type: "success", text: `Data ${deleteConfirm.name} berhasil dihapus.` });
        setTimeout(() => setActionMessage(null), 4000);
        fetchPersonnel();
      }
    } catch (e) {
      console.error(e);
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
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
            actionMessage.type === "success"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "grid" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Kartu
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "table" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
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
                  <div className="mt-4 space-y-1.5 text-xs text-slate-500">
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
                <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
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
                        <span className="font-semibold text-indigo-700 text-xs">{person.position}</span>
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

      {/* MODAL FORM TAMBAH / EDIT */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingPersonnel ? "Edit Data Personel Manajemen" : "Tambah Personel Manajemen"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi profil struktural, foto, dan wewenang tugas personel lembaga
                </p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Photo Upload Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Foto Personel Manajemen
                </label>
                <div className="flex items-center gap-4">
                  {/* Photo Preview */}
                  <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {formData.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formData.photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                        <span className="text-[9px] text-slate-400 block mt-0.5">Belum ada</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & URL Input */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingPhoto ? "Mengunggah..." : "Pilih File Foto"}</span>
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
                          className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl border border-red-200 font-bold transition"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="Atau tempel tautan URL foto (https://...)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap Beserta Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Dra. Hj. Siti Aminah, M.Pd."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jabatan Struktural <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Contoh: Kepala Tata Usaha"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Divisi / Bidang Kerja <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {DEPARTMENTS.filter((d) => d !== "SEMUA").map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">NIP / NUPTK / ID Pegawai</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="198409152010012015"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nomor SK Pengangkatan</label>
                  <input
                    type="text"
                    value={formData.skNumber}
                    onChange={(e) => setFormData({ ...formData, skNumber: e.target.value })}
                    placeholder="SK-PKBM/001/VI/2020"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Kedinasan</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@askara.sch.id"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Mulai Menjabat (TMT)</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Jabatan</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "AKTIF" | "CUTI" | "NON-AKTIF" })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="AKTIF">Aktif Menjabat</option>
                    <option value="CUTI">Cuti / Tugas Luar</option>
                    <option value="NON-AKTIF">Non-Aktif / Purna Tugas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Domisili</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Nama Jalan No. XX, Kota..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tupoksi / Tanggung Jawab Utama</label>
                <textarea
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  rows={3}
                  placeholder="Rincian wewenang, fungsi koordinasi, dan tugas pokok jabatan..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-900/20"
                >
                  {submitting ? "Menyimpan..." : editingPersonnel ? "Simpan Perubahan" : "Simpan Personel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PROFIL */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white text-center relative">
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
              <h2 className="text-lg font-bold">{showDetailModal.name}</h2>
              <p className="text-indigo-200 text-xs mt-0.5 font-semibold">{showDetailModal.position}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/30 text-indigo-100 rounded-full text-[10px] font-bold border border-indigo-400/30">
                {showDetailModal.department}
              </div>
            </div>

            {/* Modal Detail Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">NIP / NUPTK</span>
                  <span className="font-bold text-slate-800 font-mono">{showDetailModal.nip || "-"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Nomor SK</span>
                  <span className="font-bold text-slate-800 font-mono">{showDetailModal.skNumber || "-"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Email</span>
                  <span className="font-semibold text-slate-800 truncate block">{showDetailModal.email}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Telepon / WhatsApp</span>
                  <span className="font-semibold text-slate-800">{showDetailModal.phone}</span>
                </div>
              </div>

              {showDetailModal.responsibilities && (
                <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                  <span className="text-indigo-800 font-bold block mb-1">Tupoksi & Wewenang Jabatan:</span>
                  <p className="text-slate-700 leading-relaxed">{showDetailModal.responsibilities}</p>
                </div>
              )}

              {showDetailModal.address && (
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Alamat: {showDetailModal.address}</span>
                </div>
              )}

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
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm"
              >
                Hapus Data
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
            {/* Top Toolbar (Hidden in Print) */}
            <div className="print:hidden p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex flex-wrap items-center gap-2">
                {/* Mode Selector: Kolektif vs Individual */}
                <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSkMode("KOLEKTIF")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      skMode === "KOLEKTIF" ? "bg-white text-indigo-800 shadow-2xs font-bold" : "text-slate-600"
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
                    className={`px-3 py-1.5 rounded-lg transition ${
                      skMode === "INDIVIDUAL" ? "bg-white text-indigo-800 shadow-2xs font-bold" : "text-slate-600"
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
                {/* Official Letterhead (Kop Surat) */}
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
                      PEMERINTAH PROVINSI DKI JAKARTA • DINAS PENDIDIKAN
                    </h3>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-sans mt-0.5">
                      PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) ASKARA
                    </h2>
                    <p className="text-[11px] text-slate-600 font-sans">
                      Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP • NPSN: P9998766
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                      Jl. Pendidikan Aksara No. 45, Mampang Prapatan, Jakarta Selatan • Telp: (021) 7891234 • Email: info@askara.sch.id
                    </p>
                  </div>
                </div>

                {/* Letter Header & Title */}
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

                {/* Letter Body */}
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

                {/* Signature & Verification Block */}
                <div className="mt-10 pt-4 flex items-end justify-between">
                  {/* QR Code Verifikasi Keaslian */}
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

                  {/* Tanda Tangan Digital & Stempel */}
                  <div className="text-center font-sans">
                    <p className="text-xs text-slate-600">
                      Ditetapkan di: Jakarta <br />
                      Pada tanggal:{" "}
                      {new Date().toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs font-bold text-slate-800 mt-1">Kepala PKBM Askara</p>
                    <div className="h-16 flex items-center justify-center relative">
                      {/* Stempel Cap Digital */}
                      <div className="absolute opacity-20 border-2 border-indigo-700 text-indigo-800 rounded-full px-4 py-1 text-[10px] font-black uppercase rotate-[-12deg]">
                        PKBM ASKARA JAKARTA
                      </div>
                      <span className="font-serif italic font-bold text-indigo-900 text-sm">
                        Prof. Arif Syarifudin, S.Pd.
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 border-t border-slate-400 pt-0.5 min-w-44">
                      Prof. Arif Syarifudin, S.Pd.
                    </p>
                    <p className="text-[10px] text-slate-500">NIP. 19750914 200003 2 001</p>
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
            {/* Top Toolbar (Hidden in Print) */}
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
                      PEMERINTAH PROVINSI DKI JAKARTA • DINAS PENDIDIKAN
                    </h3>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                      PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) ASKARA
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP • NPSN: P9998766
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Jl. Pendidikan Aksara No. 45, Jakarta Selatan • Telp: (021) 7891234 • Email: info@askara.sch.id
                    </p>
                  </div>
                </div>

                {/* Judul Laporan Rekapitulasi */}
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
                      Jakarta,{" "}
                      {new Date().toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 mt-0.5">Kepala PKBM Askara</p>
                    <div className="h-14 flex items-center justify-center relative">
                      <span className="font-serif italic font-bold text-indigo-900 text-xs">
                        Prof. Arif Syarifudin, S.Pd.
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 border-t border-slate-400 pt-0.5">
                      Prof. Arif Syarifudin, S.Pd.
                    </p>
                    <p className="text-[10px] text-slate-500">NIP. 19750914 200003 2 001</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
