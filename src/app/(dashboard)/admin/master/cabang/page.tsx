"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Plus,
  Search,
  Users,
  GraduationCap,
  Landmark,
  Layers,
  Radio,
  Compass,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Phone,
  UserCheck,
  RefreshCw,
  Sparkles,
  Sliders,
  Eye,
  Check,
  X,
} from "lucide-react";
import { BranchData, calculateHaversineDistanceMeters } from "@/lib/branch";

export default function MasterCabangPage() {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    city: "Kota Bandung",
    province: "Jawa Barat",
    phone: "",
    managerName: "",
    latitude: "-6.953412",
    longitude: "107.689451",
    radiusMeters: 100,
    isActive: true,
    notes: "",
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cabang");
      const data = await res.json();
      if (data.success && Array.isArray(data.branches)) {
        setBranches(data.branches);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openAddModal = () => {
    setEditingBranch(null);
    setFormData({
      code: "",
      name: "",
      address: "",
      city: "Kota Bandung",
      province: "Jawa Barat",
      phone: "",
      managerName: "",
      latitude: "-6.953412",
      longitude: "107.689451",
      radiusMeters: 100,
      isActive: true,
      notes: "",
    });
    setShowModal(true);
  };

  const openEditModal = (branch: BranchData) => {
    setEditingBranch(branch);
    setFormData({
      code: branch.code,
      name: branch.name,
      address: branch.address,
      city: branch.city || "Kota Bandung",
      province: branch.province || "Jawa Barat",
      phone: branch.phone || "",
      managerName: branch.managerName || "",
      latitude: branch.latitude !== null ? String(branch.latitude) : "",
      longitude: branch.longitude !== null ? String(branch.longitude) : "",
      radiusMeters: branch.radiusMeters || 100,
      isActive: branch.isActive,
      notes: branch.notes || "",
    });
    setShowModal(true);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolokasi tidak didukung oleh peramban ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
      },
      (err) => {
        alert("Gagal membaca titik GPS: " + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        id: editingBranch?.id,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        radiusMeters: Number(formData.radiusMeters),
      };

      const res = await fetch("/api/cabang", {
        method: editingBranch ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setNotification({ type: "success", message: result.message });
        setShowModal(false);
        fetchBranches();
      } else {
        setNotification({ type: "error", message: result.error || "Gagal menyimpan data cabang." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: "Terjadi kesalahan koneksi server." });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleToggleStatus = async (branch: BranchData) => {
    try {
      const res = await fetch("/api/cabang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: branch.id, isActive: !branch.isActive }),
      });
      const result = await res.json();
      if (res.ok) {
        fetchBranches();
      } else {
        alert(result.error || "Gagal mengubah status cabang.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase()) ||
      (b.managerName && b.managerName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && b.isActive) ||
      (statusFilter === "INACTIVE" && !b.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalBranchesCount = branches.length;
  const activeBranchesCount = branches.filter((b) => b.isActive).length;
  const totalStudentsCount = branches.reduce((acc, b) => acc + (b._count?.students || 0), 0);
  const totalAssetsCount = branches.reduce((acc, b) => acc + (b._count?.assets || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
              <span>Multi-Tenancy & Geofencing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Master Cabang & Rumah Belajar
            </h1>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Kelola seluruh titik Rumah Belajar PKBM Askara, alokasi admin cabang, koordinat GPS untuk validasi presensi geofencing otomatis, serta inventaris aset dan pengajuan operasional per cabang.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Cabang Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Cards inside Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Rumah Belajar</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-white">{totalBranchesCount}</span>
              <span className="text-xs text-indigo-300 font-semibold">Titik Lokasi</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Cabang Aktif</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">{activeBranchesCount}</span>
              <span className="text-xs text-emerald-300/80 font-semibold">Beroperasi Normal</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Siswa Terdaftar</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-amber-400">{totalStudentsCount}</span>
              <span className="text-xs text-amber-300/80 font-semibold">Peserta Didik</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Aset Terdistribusi</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-purple-400">{totalAssetsCount}</span>
              <span className="text-xs text-purple-300/80 font-semibold">Unit Inventaris</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode, nama cabang, atau alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/70 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
              }`}
            >
              Semua ({branches.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === "ACTIVE" ? "bg-white text-emerald-700 shadow-xs font-bold" : "hover:text-emerald-700"
              }`}
            >
              Aktif ({branches.filter((b) => b.isActive).length})
            </button>
            <button
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === "INACTIVE" ? "bg-white text-rose-700 shadow-xs font-bold" : "hover:text-rose-700"
              }`}
            >
              Non-Aktif ({branches.filter((b) => !b.isActive).length})
            </button>
          </div>

          <button
            onClick={fetchBranches}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Branch Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200/80 animate-pulse space-y-4">
              <div className="h-6 bg-slate-100 rounded-lg w-1/3" />
              <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
              <div className="h-24 bg-slate-50 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada cabang ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Belum ada Rumah Belajar yang sesuai dengan filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBranches.map((branch) => {
            const isPusat = branch.code === "ASKARA-PUSAT";

            return (
              <div
                key={branch.id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-200 hover:shadow-lg relative overflow-hidden flex flex-col justify-between ${
                  isPusat
                    ? "border-indigo-200/90 shadow-indigo-100/30"
                    : branch.isActive
                    ? "border-slate-200/80 hover:border-slate-300"
                    : "border-rose-200/60 bg-rose-50/10 opacity-75"
                }`}
              >
                {/* Top Badge & Status */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                          isPusat
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200/80"
                            : "bg-teal-50 text-teal-700 border-teal-200/80"
                        }`}
                      >
                        {isPusat ? "🌟 Kampus Induk / Pusat" : "🏠 Rumah Belajar"}
                      </span>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                        {branch.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          branch.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${branch.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {branch.isActive ? "Aktif" : "Non-Aktif"}
                      </span>
                    </div>
                  </div>

                  {/* Branch Title & Address */}
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{branch.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {branch.address}, {branch.city}, {branch.province}
                    </span>
                  </p>

                  {/* Manager & Phone Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Koordinator / Kepala</span>
                      <p className="font-bold text-slate-800 truncate mt-0.5">
                        {branch.managerName || "Belum Ditetapkan"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kontak Telepon</span>
                      <p className="font-medium text-slate-700 truncate mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {branch.phone || "-"}
                      </p>
                    </div>
                  </div>

                  {/* GPS Coordinates & Geofencing Badge */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Koordinat Presensi GPS:</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {branch.latitude && branch.longitude
                          ? `${branch.latitude}, ${branch.longitude}`
                          : "Belum diset"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Radio className="w-3.5 h-3.5 text-teal-600" />
                        <span>Radius Geofencing:</span>
                      </div>
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        ± {branch.radiusMeters} Meter
                      </span>
                    </div>

                    {branch.latitude && branch.longitude && (
                      <div className="pt-1 flex justify-end">
                        <a
                          href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          <span>Buka Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Metrics Summary */}
                  <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Siswa</span>
                      <span className="text-sm font-black text-slate-800">{branch._count?.students || 0}</span>
                    </div>
                    <div className="bg-slate-50 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Tutor</span>
                      <span className="text-sm font-black text-slate-800">{branch._count?.users || 0}</span>
                    </div>
                    <div className="bg-slate-50 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Rombel</span>
                      <span className="text-sm font-black text-slate-800">{branch._count?.classes || 0}</span>
                    </div>
                    <div className="bg-slate-50 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Aset</span>
                      <span className="text-sm font-black text-slate-800">{branch._count?.assets || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(branch)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      branch.isActive
                        ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                        : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {branch.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(branch)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit & Geofence</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Cabang */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingBranch ? "Edit Rumah Belajar & Geofencing" : "Daftarkan Rumah Belajar Baru"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Konfigurasi multi-tenancy dan koordinat radius GPS presensi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kode Cabang / Tenant Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingBranch && editingBranch.code === "ASKARA-PUSAT"}
                    placeholder="Contoh: RB-CIPARAY"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase disabled:opacity-60"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Digunakan sebagai kunci multi-tenant data siswa & aset
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Rumah Belajar / Cabang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rumah Belajar Ciparay"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alamat Lengkap Lokasi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Jl. Raya Laswi No. 142, Ciparay"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Koordinator / Kepala Cabang</label>
                  <input
                    type="text"
                    placeholder="Nama penanggung jawab"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Geofencing Coordinates Section */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <span>Titik GPS & Radius Geofencing Presensi</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition"
                  >
                    📍 Ambil GPS Saya Saat Ini
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Latitude</label>
                    <input
                      type="text"
                      placeholder="-6.953412"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Longitude</label>
                    <input
                      type="text"
                      placeholder="107.689451"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Batas Radius Geofencing Presensi
                    </label>
                    <span className="text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      {formData.radiusMeters} Meter
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="500"
                    step="10"
                    value={formData.radiusMeters}
                    onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-medium">
                    <span>30m (Ketat)</span>
                    <span>100m (Standar)</span>
                    <span>250m (Luas)</span>
                    <span>500m (Maksimal)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan / Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Sentra vokasi agrobisnis, jam operasional, dsb."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Rumah Belajar Aktif & Beroperasi untuk Kegiatan Pembelajaran
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingBranch ? "Simpan Perubahan" : "Daftarkan Cabang"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
