"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Mail, Phone, User, X, CheckCircle2, Trash2, Edit, Users, ChevronRight, Briefcase, MapPin } from "lucide-react";

interface ParentItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  job?: string;
  address?: string;
  studentsCount: number;
  isActive: boolean;
}

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [detailParent, setDetailParent] = useState<ParentItem | null>(null);
  const [selectedParent, setSelectedParent] = useState<ParentItem | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "AYAH",
    job: "",
    address: "",
    isActive: true,
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchParents = async () => {
    try {
      setIsLoading(true);
      const url = new URL("/api/parents", window.location.origin);
      if (searchQuery) url.searchParams.set("search", searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && data.data) {
        setParents(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch parents", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [searchQuery]);

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast("Nama dan Email wajib diisi!", "error");
      return;
    }
    
    try {
      const res = await fetch("/api/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Orang tua berhasil ditambahkan!");
        setIsAddModalOpen(false);
        setFormData({ name: "", email: "", phone: "", relationship: "AYAH", job: "", address: "", isActive: true });
        fetchParents();
      } else {
        showToast(data.error || "Gagal menambahkan data", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  const handleEditParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent) return;

    try {
      const res = await fetch("/api/parents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: selectedParent.id, userId: selectedParent.userId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Orang tua berhasil diperbarui!");
        setIsEditModalOpen(false);
        setSelectedParent(null);
        fetchParents();
        if (detailParent?.id === selectedParent.id) setDetailParent(null);
      } else {
        showToast(data.error || "Gagal memperbarui data", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  const handleDeleteParent = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data ${name}? Semua data siswa yang terkait mungkin akan terdampak.`)) return;
    try {
      const res = await fetch(`/api/parents?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Data berhasil dihapus!");
        fetchParents();
        if (detailParent?.id === id) setDetailParent(null);
      } else {
        showToast(data.error || "Gagal menghapus data", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan saat menghapus data", "error");
    }
  };

  const openEditModal = (parent: ParentItem) => {
    setSelectedParent(parent);
    setFormData({
      name: parent.name,
      email: parent.email,
      phone: parent.phone || "",
      relationship: parent.relationship || "AYAH",
      job: parent.job || "",
      address: parent.address || "",
      isActive: parent.isActive,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 text-sm rounded-lg shadow-lg animate-in slide-in-from-top-2 ${
          notification.type === "success" ? "text-emerald-800 bg-emerald-50 border border-emerald-200" : "text-rose-800 bg-rose-50 border border-rose-200"
        }`}>
          {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <X className="w-5 h-5 mr-3" />}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            Data Orang Tua / Wali
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Kelola informasi orang tua dan wali siswa PKBM Askara.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", email: "", phone: "", relationship: "AYAH", job: "", address: "", isActive: true });
            setIsAddModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-md font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Orang Tua</span>
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <Search className="w-5 h-5 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 p-2 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-semibold ml-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
                <p className="font-semibold text-sm animate-pulse">Memuat data orang tua...</p>
              </div>
            ) : parents.length > 0 ? (
              parents.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setDetailParent(detailParent?.id === p.id ? null : p)}
                  className={`group relative bg-white rounded-2xl border transition-all duration-200 p-5 cursor-pointer shadow-sm hover:shadow-md ${
                    detailParent?.id === p.id ? "border-amber-400 ring-4 ring-amber-50" : "border-slate-200 hover:border-amber-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600 font-bold border border-amber-100">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                      {p.isActive ? "AKTIF" : "NON-AKTIF"}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{p.name}</h3>
                  <p className="text-xs font-semibold text-amber-700 mt-0.5">{p.relationship}</p>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.studentsCount} Anak Terdaftar</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(p); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteParent(p.id, p.name); }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200 border-dashed">
                Tidak ada data orang tua yang cocok dengan pencarian.
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {detailParent && (
          <div className="w-full lg:w-80 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden lg:sticky lg:top-24 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="bg-gradient-to-br from-amber-600 to-amber-900 p-6 text-center relative">
              <button onClick={() => setDetailParent(null)} className="absolute top-3 right-3 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/20 transition">
                <X className="w-4 h-4" />
              </button>
              <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-inner border-2 border-white/40 mb-3">
                {detailParent.name.charAt(0)}
              </div>
              <h3 className="font-bold text-white text-base px-2">{detailParent.name}</h3>
              <p className="text-amber-200 text-xs mt-1 font-semibold">{detailParent.relationship}</p>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email</p>
                <p className="font-semibold text-slate-800">{detailParent.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No. Telepon / WA</p>
                <p className="font-semibold text-slate-800 font-mono">{detailParent.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pekerjaan</p>
                <p className="font-semibold text-slate-800">{detailParent.job || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alamat Lengkap</p>
                <p className="font-semibold text-slate-800 leading-relaxed">{detailParent.address || "-"}</p>
              </div>
              
              <div className="pt-3 pb-1 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(detailParent)}
                  className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profil Orang Tua</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h3 className="font-bold text-slate-900">
                {isAddModalOpen ? "Tambah Orang Tua Baru" : "Edit Data Orang Tua"}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddParent : handleEditParent} className="p-6 space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap <span className="text-rose-500">*</span></label>
                  <input
                    required type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    placeholder="Nama Orang Tua / Wali"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email <span className="text-rose-500">*</span></label>
                  <input
                    required type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">No. Telepon / WA</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                    placeholder="08xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hubungan dengan Siswa</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="AYAH">Ayah</option>
                    <option value="IBU">Ibu</option>
                    <option value="WALI">Wali</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Pekerjaan</label>
                  <input
                    type="text"
                    value={formData.job}
                    onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    placeholder="Pekerjaan Orang Tua"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Akun</label>
                  <select
                    value={formData.isActive ? "1" : "0"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "1" })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Lengkap</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 resize-none"
                  placeholder="Alamat domisili"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
