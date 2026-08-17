"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  QrCode,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Check,
  X,
  FileText,
  Calendar,
  GraduationCap,
  Briefcase,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Coins,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Share2,
  User,
  School,
  Globe,
  Award,
  BookOpen,
  MessageCircle,
  CreditCard,
  CheckCircle,
  Upload,
} from "lucide-react";

interface PublicRegistrationItem {
  id: string;
  registrationNumber: string;
  type: "SISWA" | "TUTOR" | "MANAJEMEN";
  fullName: string;
  nik?: string;
  nisn?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  calculatedAge?: string;
  address?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  packetType?: string;
  registrationTrack?: string;
  previousSchool?: string;
  parentName?: string;
  parentPhone?: string;
  parentJob?: string;
  parentIncome?: number;
  incomeDecile?: string;
  positionApplied?: string;
  lastEducation?: string;
  majorStudy?: string;
  experienceYears?: number;
  skills?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  ktpUrl?: string;
  kkUrl?: string;
  birthCertUrl?: string;
  diplomaUrl?: string;
  transcriptUrl?: string;
  npwpUrl?: string;
  cvResumeUrl?: string;
  status: "PENDING" | "APPROVED" | "REVISION" | "REJECTED";
  revisionNote?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

export default function VerifikasiPendaftarPage() {
  const [registrations, setRegistrations] = useState<PublicRegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTypeTab, setActiveTypeTab] = useState<"ALL" | "SISWA" | "TUTOR" | "MANAJEMEN">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    totalPending: 0,
    totalApproved: 0,
    totalRevision: 0,
    totalRejected: 0,
  });

  // Modal Review Detail
  const [selectedReg, setSelectedReg] = useState<PublicRegistrationItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [showActionPrompt, setShowActionPrompt] = useState<"APPROVE" | "REVISION" | "REJECT" | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  // QR Code & Link Copied Toast
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pendaftaran");
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    
    // Fetch current user role to determine super_admin permissions
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUserRole(data.user.role);
        }
      })
      .catch((e) => console.error("Failed to fetch user role", e));
  }, []);

  const handleCopyLink = (path: string, label: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  // Perform Approval, Revision, or Rejection
  const handlePerformAction = async (action: "APPROVE" | "REVISION" | "REJECT") => {
    if (!selectedReg) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/pendaftaran", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReg.id,
          action,
          note: actionNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setShowActionPrompt(null);
        setSelectedReg(null);
        setActionNote("");
        fetchRegistrations();
      } else {
        alert(data.error || "Gagal memproses aksi");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDocument = async (docKey: string, file: File) => {
    if (!selectedReg) return;
    try {
      setUploadingDocKey(docKey);
      
      // 1. Upload new file
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Gagal mengunggah berkas");
      }

      // 2. Patch the database record
      const patchRes = await fetch("/api/pendaftaran", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReg.id,
          [docKey]: uploadData.url,
        }),
      });

      const patchData = await patchRes.json();
      if (patchRes.ok && patchData.success) {
        // Optimistic update of local state
        setSelectedReg({ ...selectedReg, [docKey]: uploadData.url });
        fetchRegistrations(); // refresh main list
        alert("Berkas berhasil diperbaharui.");
      } else {
        throw new Error(patchData.error || "Gagal memperbaharui data");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat mengunggah berkas");
    } finally {
      setUploadingDocKey(null);
    }
  };

  // Filtered List
  const filteredList = registrations.filter((r) => {
    const matchType = activeTypeTab === "ALL" || r.type === activeTypeTab;
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchSearch =
      !search ||
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.nik && r.nik.includes(search)) ||
      (r.phone && r.phone.includes(search));

    return matchType && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              Verifikasi & SPMB Online
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
              ⚡ Auto-Integrasi ke Data Master & Surat
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Antrean Verifikasi Pendaftaran Mandiri
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Kelola pendaftaran publik siswa baru (SPMB), rekrutmen tutor, dan pelamar manajemen. Saat disetujui, data otomatis aktif di portal dan langsung tersedia di modul persuratan.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-amber-300 block uppercase">Menunggu Review</span>
            <span className="text-2xl font-black text-white">{stats.totalPending}</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">Pendaftar baru</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-emerald-300 block uppercase">Telah Disetujui</span>
            <span className="text-2xl font-black text-white">{stats.totalApproved}</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">Aktif di database</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-blue-300 block uppercase">Minta Revisi</span>
            <span className="text-2xl font-black text-white">{stats.totalRevision}</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">Perlu perbaikan</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-rose-300 block uppercase">Ditolak</span>
            <span className="text-2xl font-black text-white">{stats.totalRejected}</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">Tidak lolos</span>
          </div>
        </div>
      </div>

      {/* WIDGET: PUBLIC LINK & QR CODE GENERATOR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Pusat Tautan & QR Code Pendaftaran Publik Mandiri
              </h3>
              <p className="text-[11px] text-slate-500">
                Bagikan tautan formulir atau cetak QR code pada brosur dan spanduk penerimaan sekolah
              </p>
            </div>
          </div>
          {copiedLink && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg animate-in fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Link {copiedLink} Tersalin!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Card 1: SPMB Siswa */}
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="font-bold text-xs text-slate-900 block truncate">SPMB Siswa Baru</span>
                <span className="text-[10px] text-indigo-700 font-mono">/pendaftaran/siswa</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyLink("/pendaftaran/siswa", "Siswa")}
                className="p-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition shadow-2xs"
                title="Salin Link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href="/pendaftaran/siswa"
                target="_blank"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
                title="Buka Form"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Rekrutmen Tutor */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="font-bold text-xs text-slate-900 block truncate">Rekrutmen Tutor</span>
                <span className="text-[10px] text-blue-700 font-mono">/pendaftaran/tutor</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyLink("/pendaftaran/tutor", "Tutor")}
                className="p-1.5 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition shadow-2xs"
                title="Salin Link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href="/pendaftaran/tutor"
                target="_blank"
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                title="Buka Form"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 3: Rekrutmen Manajemen */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="font-bold text-xs text-slate-900 block truncate">Rekrutmen Staf TU</span>
                <span className="text-[10px] text-emerald-700 font-mono">/pendaftaran/manajemen</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyLink("/pendaftaran/manajemen", "Manajemen")}
                className="p-1.5 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-2xs"
                title="Salin Link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href="/pendaftaran/manajemen"
                target="_blank"
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                title="Buka Form"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ANTREAN TABEL PENDAFTAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        {/* Filters Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Sub-Tabs Type */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTypeTab("ALL")}
              className={`px-3 py-1.5 rounded-lg transition ${activeTypeTab === "ALL" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Semua ({registrations.length})
            </button>
            <button
              onClick={() => setActiveTypeTab("SISWA")}
              className={`px-3 py-1.5 rounded-lg transition ${activeTypeTab === "SISWA" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Siswa Baru ({registrations.filter((r) => r.type === "SISWA").length})
            </button>
            <button
              onClick={() => setActiveTypeTab("TUTOR")}
              className={`px-3 py-1.5 rounded-lg transition ${activeTypeTab === "TUTOR" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Tutor ({registrations.filter((r) => r.type === "TUTOR").length})
            </button>
            <button
              onClick={() => setActiveTypeTab("MANAJEMEN")}
              className={`px-3 py-1.5 rounded-lg transition ${activeTypeTab === "MANAJEMEN" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Staf TU ({registrations.filter((r) => r.type === "MANAJEMEN").length})
            </button>
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIK, registrasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition w-44 sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-slate-50 focus:bg-white transition"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Disetujui / Aktif</option>
              <option value="REVISION">Permintaan Revisi</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-200 pb-2">
                <th className="pb-3 font-semibold">No. Registrasi & Tgl</th>
                <th className="pb-3 font-semibold">Pendaftar & Identitas</th>
                <th className="pb-3 font-semibold">Program / Posisi</th>
                <th className="pb-3 font-semibold">Kalkulasi Usia & Desil</th>
                <th className="pb-3 font-semibold text-center">Status</th>
                <th className="pb-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 font-mono">
                    <span className="font-bold text-indigo-950 block">{r.registrationNumber}</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {new Date(r.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                        {r.avatarUrl ? (
                          <img src={r.avatarUrl} alt={r.fullName} className="w-full h-full object-cover" />
                        ) : (
                          r.fullName.charAt(0)
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{r.fullName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          NIK: {r.nik || "-"} {r.phone ? `• WA: ${r.phone}` : ""}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px] inline-block mb-1">
                      {r.type}
                    </span>
                    <span className="font-semibold text-slate-800 block">
                      {r.type === "SISWA" ? r.packetType : r.positionApplied}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="font-bold text-slate-800 block text-xs">{r.calculatedAge || "-"}</span>
                    {r.type === "SISWA" && r.incomeDecile && (
                      <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                        {r.incomeDecile.split(" (")[0]}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-center">
                    {r.status === "PENDING" && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                    {r.status === "APPROVED" && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Disetujui</span>
                      </span>
                    )}
                    {r.status === "REVISION" && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Revisi</span>
                      </span>
                    )}
                    {r.status === "REJECTED" && (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>Ditolak</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedReg(r);
                        setShowActionPrompt(null);
                        setActionNote("");
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Detail</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada data pendaftar pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REVIEW DETAIL PENDAFTAR LENGKAP */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 flex items-start justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-900/60 border-2 border-indigo-400/40 text-indigo-200 flex items-center justify-center font-bold shadow-lg overflow-hidden shrink-0">
                  {selectedReg.avatarUrl ? (
                    <img
                      src={selectedReg.avatarUrl}
                      alt={selectedReg.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedReg.type === "SISWA" ? (
                    <GraduationCap className="w-8 h-8 text-indigo-300" />
                  ) : selectedReg.type === "TUTOR" ? (
                    <Briefcase className="w-8 h-8 text-blue-300" />
                  ) : (
                    <Building2 className="w-8 h-8 text-emerald-300" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        selectedReg.type === "SISWA"
                          ? "bg-indigo-500/30 text-indigo-200 border border-indigo-500/40"
                          : selectedReg.type === "TUTOR"
                          ? "bg-blue-500/30 text-blue-200 border border-blue-500/40"
                          : "bg-emerald-500/30 text-emerald-200 border border-emerald-500/40"
                      }`}
                    >
                      {selectedReg.type === "SISWA"
                        ? "SPMB Siswa Baru"
                        : selectedReg.type === "TUTOR"
                        ? "Rekrutmen Tutor / Guru"
                        : "Rekrutmen Staf Manajemen"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedReg.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : selectedReg.status === "REVISION"
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          : selectedReg.status === "REJECTED"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {selectedReg.status === "APPROVED"
                        ? "Disetujui"
                        : selectedReg.status === "REVISION"
                        ? "Perlu Revisi"
                        : selectedReg.status === "REJECTED"
                        ? "Ditolak"
                        : "Pending Review"}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">{selectedReg.fullName}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1 font-mono">
                    <span>
                      No. Reg: <strong className="text-white">{selectedReg.registrationNumber}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Tgl Daftar:{" "}
                      {new Date(selectedReg.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Info - Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-xs bg-slate-50/50">
              {/* Alert Catatan Revisi / Penolakan jika ada */}
              {selectedReg.revisionNote && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-blue-900">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs">Catatan Permintaan Revisi:</span>
                    <p className="text-xs mt-0.5 leading-relaxed">{selectedReg.revisionNote}</p>
                  </div>
                </div>
              )}
              {selectedReg.rejectionReason && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs">Alasan Penolakan:</span>
                    <p className="text-xs mt-0.5 leading-relaxed">{selectedReg.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* 1. SEKSI PROGRAM & AKADEMIK / POSISI KERJA */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  {selectedReg.type === "SISWA" ? (
                    <>
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>Pilihan Program & Jalur SPMB</span>
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>Posisi & Kualifikasi Kerja / Mengajar</span>
                    </>
                  )}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                  {selectedReg.type === "SISWA" ? (
                    <>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Jenjang Program</span>
                        <span className="font-extrabold text-indigo-700 text-xs sm:text-sm block mt-0.5">
                          {selectedReg.packetType || "-"}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Jalur Pendaftaran</span>
                        <span className="font-bold text-slate-900 text-xs block mt-0.5">
                          {selectedReg.registrationTrack || "Reguler Mandiri"}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Asal Sekolah Sebelumnya</span>
                        <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate" title={selectedReg.previousSchool || "-"}>
                          {selectedReg.previousSchool || "-"}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">NISN Siswa</span>
                        <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                          {selectedReg.nisn || "-"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Posisi yang Dilamar</span>
                        <span className="font-extrabold text-indigo-700 text-xs sm:text-sm block mt-0.5">
                          {selectedReg.positionApplied || "-"}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Pendidikan Terakhir</span>
                        <span className="font-bold text-slate-900 text-xs block mt-0.5">
                          {selectedReg.lastEducation || "-"}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Program Studi / Jurusan</span>
                        <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate" title={selectedReg.majorStudy || "-"}>
                          {selectedReg.majorStudy || "-"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Additional info for Tutor / Management */}
                {selectedReg.type !== "SISWA" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Pengalaman Kerja / Mengajar</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {selectedReg.experienceYears || 0} Tahun
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Ringkasan Keahlian & Spesialisasi</span>
                      <p className="text-slate-800 text-xs mt-0.5 leading-relaxed">
                        {selectedReg.skills || "Tidak dicantumkan"}
                      </p>
                    </div>
                    {selectedReg.linkedinUrl && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-3 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Tautan Portofolio / LinkedIn / Website</span>
                          <span className="font-mono text-indigo-700 text-xs break-all block mt-0.5">
                            {selectedReg.linkedinUrl}
                          </span>
                        </div>
                        <a
                          href={selectedReg.linkedinUrl.startsWith("http") ? selectedReg.linkedinUrl : `https://${selectedReg.linkedinUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 flex items-center gap-1.5 shrink-0 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Kunjungi</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. SEKSI IDENTITAS LENGKAP & BIODATA DIRI */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Identitas Lengkap & Biodata Pribadi</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Lengkap</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">
                      {selectedReg.fullName}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">NIK (KTP / KIA)</span>
                    <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                      {selectedReg.nik || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Jenis Kelamin</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedReg.gender || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Usia Terhitung</span>
                    <span className="font-bold text-indigo-700 text-xs block mt-0.5">
                      {selectedReg.calculatedAge || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Tempat, Tanggal Lahir</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedReg.birthPlace || "-"}, {selectedReg.birthDate ? new Date(selectedReg.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">No. WhatsApp / HP</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                        {selectedReg.phone || "-"}
                      </span>
                    </div>
                    {selectedReg.phone && (
                      <a
                        href={`https://wa.me/${selectedReg.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition"
                        title="Kirim Pesan WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Email</span>
                      <span className="font-mono text-slate-800 text-xs block mt-0.5 truncate max-w-[130px]" title={selectedReg.email || "-"}>
                        {selectedReg.email || "-"}
                      </span>
                    </div>
                    {selectedReg.email && (
                      <a
                        href={`mailto:${selectedReg.email}`}
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
                  <span>Alamat Lengkap Domisili Sesuai KTP / KK</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-3">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Alamat Jalan / Dusun / Gang</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedReg.address || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">RT / RW</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedReg.rtRw || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Kelurahan / Desa</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedReg.kelurahan || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Kecamatan</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedReg.kecamatan || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Kota / Kabupaten</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedReg.city || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Provinsi & Kode Pos</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedReg.province || "Jawa Barat"} {selectedReg.postalCode ? `(${selectedReg.postalCode})` : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. SEKSI DATA ORANG TUA / WALI & EKONOMI (KHUSUS SISWA) */}
              {selectedReg.type === "SISWA" && (
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Data Orang Tua / Wali & Kondisi Ekonomi</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Orang Tua / Wali</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {selectedReg.parentName || "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Pekerjaan Orang Tua / Wali</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {selectedReg.parentJob || "-"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">WhatsApp Orang Tua</span>
                        <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                          {selectedReg.parentPhone || "-"}
                        </span>
                      </div>
                      {selectedReg.parentPhone && (
                        <a
                          href={`https://wa.me/${selectedReg.parentPhone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition"
                          title="Kirim Pesan WhatsApp Orang Tua"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Penghasilan Bulanan Ortu</span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5">
                        {selectedReg.parentIncome
                          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedReg.parentIncome)
                          : "Rp 0 / Tidak Berpenghasilan"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Klasifikasi Desil Ekonomi</span>
                      <span className="font-bold text-amber-700 text-xs block mt-0.5">
                        {selectedReg.incomeDecile || "Belum Terklasifikasi"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SEKSI PENINJAU SELURUH BERKAS DOKUMEN LAMPIRAN */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Daftar Berkas Dokumen Lampiran</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Klik tombol lihat untuk memeriksa keabsahan dokumen
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {(selectedReg.type === "SISWA"
                    ? [
                        { label: "Pas Foto Formal (3x4)", key: "avatarUrl", url: selectedReg.avatarUrl, required: true },
                        { label: "KTP / KIA Pendaftar", key: "ktpUrl", url: selectedReg.ktpUrl, required: true },
                        { label: "Kartu Keluarga (KK)", key: "kkUrl", url: selectedReg.kkUrl, required: true },
                        { label: "Akta Kelahiran", key: "birthCertUrl", url: selectedReg.birthCertUrl, required: true },
                        { label: "Ijazah Terakhir / SKL", key: "diplomaUrl", url: selectedReg.diplomaUrl, required: true },
                      ]
                    : [
                        { label: "Pas Foto Formal", key: "avatarUrl", url: selectedReg.avatarUrl, required: true },
                        { label: "KTP Pelamar", key: "ktpUrl", url: selectedReg.ktpUrl, required: true },
                        { label: "Ijazah Pendidikan Terakhir", key: "diplomaUrl", url: selectedReg.diplomaUrl, required: true },
                        { label: "Transkrip Nilai / Portofolio", key: "transcriptUrl", url: selectedReg.transcriptUrl, required: false },
                        { label: "CV & Surat Lamaran", key: "cvResumeUrl", url: selectedReg.cvResumeUrl, required: true },
                        { label: "Kartu NPWP", key: "npwpUrl", url: selectedReg.npwpUrl, required: false },
                      ]
                  ).map((doc, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        doc.url
                          ? "bg-indigo-50/40 border-indigo-200/80 hover:bg-indigo-50"
                          : "bg-slate-50 border-slate-200/60 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            doc.url
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate text-xs">
                            {doc.label}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {doc.url ? (
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Terunggah</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                {doc.required ? "Belum Diunggah (Wajib)" : "Tidak Dilampirkan"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Berkas</span>
                          </a>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-semibold shrink-0">
                            Kosong
                          </span>
                        )}

                        {/* Super Admin Update Berkas Button */}
                        {currentUserRole === "super_admin" && (
                          <div className="relative shrink-0">
                            <input
                              type="file"
                              id={`upload-${doc.key}`}
                              className="hidden"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpdateDocument(doc.key, file);
                              }}
                              disabled={uploadingDocKey === doc.key}
                            />
                            <label
                              htmlFor={`upload-${doc.key}`}
                              className={`cursor-pointer px-3 py-1.5 bg-white hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs ${
                                uploadingDocKey === doc.key ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              {uploadingDocKey === doc.key ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>Perbaharui Berkas</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-700 text-xs transition"
              >
                Tutup Review
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowActionPrompt("REJECT")}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowActionPrompt("REVISION")}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Minta Revisi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowActionPrompt("APPROVE")}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Aktifkan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
