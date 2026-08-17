"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Landmark,
  Building2,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Printer,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  XCircle,
  ChevronRight,
  ShieldCheck,
  Laptop,
  Car,
  Armchair,
  BookOpen,
  Coffee,
  Package,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Camera,
  Play,
  Film,
  Loader2,
} from "lucide-react";

type AssetOwner = "PKBM_ASKARA" | "YAYASAN";
type AssetCondition = "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT" | "DALAM_PERAWATAN";

interface Asset {
  id: string;
  code: string;
  name: string;
  owner: AssetOwner;
  category: string;
  quantity: number;
  unit: string;
  acquisitionDate: string;
  purchaseCost: number;
  currentValue?: number | null;
  fundingSource: string;
  condition: AssetCondition;
  location: string;
  personInCharge: string;
  description?: string | null;
  photoUrl?: string | null;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  TANAH_BANGUNAN: { label: "Tanah & Bangunan", icon: Building2, color: "text-amber-700 bg-amber-50 border-amber-200" },
  ELEKTRONIK_TI: { label: "Elektronik & TI", icon: Laptop, color: "text-blue-700 bg-blue-50 border-blue-200" },
  PERALATAN_VOKASI: { label: "Peralatan Vokasi", icon: Coffee, color: "text-purple-700 bg-purple-50 border-purple-200" },
  KENDARAAN: { label: "Kendaraan Operasional", icon: Car, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  FURNITUR_MEUBEL: { label: "Meubelair & Furnitur", icon: Armchair, color: "text-orange-700 bg-orange-50 border-orange-200" },
  BUKU_PUSTAKA: { label: "Buku & Pustaka", icon: BookOpen, color: "text-teal-700 bg-teal-50 border-teal-200" },
  LAINNYA: { label: "Lainnya / Inventaris", icon: Package, color: "text-slate-700 bg-slate-50 border-slate-200" },
};

const CONDITION_MAP: Record<AssetCondition, { label: string; badge: string; icon: any }> = {
  BAIK: { label: "Kondisi Baik", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  RUSAK_RINGAN: { label: "Rusak Ringan", badge: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertTriangle },
  RUSAK_BERAT: { label: "Rusak Berat", badge: "bg-rose-100 text-rose-800 border-rose-200", icon: XCircle },
  DALAM_PERAWATAN: { label: "Dalam Perawatan", badge: "bg-sky-100 text-sky-800 border-sky-200", icon: Wrench },
};

const FUNDING_SOURCES: Record<string, string> = {
  DANA_YAYASAN: "Dana Yayasan",
  DANA_BOS: "Dana BOS Kesetaraan",
  SWADAYA_PKBM: "Swadaya PKBM",
  HIBAH_PEMERINTAH: "Hibah Pemerintah",
  DONASI_SUMBANGAN: "Donasi / Sumbangan",
};

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  return ["mp4", "webm", "mov", "ogv", "3gp", "mkv"].includes(ext || "");
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AdminAsetPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<"ALL" | AssetOwner>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [conditionFilter, setConditionFilter] = useState<string>("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultFormData = {
    code: "",
    name: "",
    owner: "PKBM_ASKARA" as AssetOwner,
    category: "PERALATAN_VOKASI",
    quantity: 1,
    unit: "Unit",
    acquisitionDate: new Date().toISOString().split("T")[0],
    purchaseCost: "",
    currentValue: "",
    fundingSource: "SWADAYA_PKBM",
    condition: "BAIK" as AssetCondition,
    location: "Kampus PKBM Askara",
    personInCharge: "Kepala Tata Usaha",
    description: "",
    photoUrl: "",
  };
  const [formData, setFormData] = useState(defaultFormData);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/aset");
      const json = await res.json();
      if (json.success && json.data) {
        setAssets(json.data);
      }
    } catch (err) {
      console.error("Error fetching assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (75MB max)
    if (file.size > 75 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimum 75 MB.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress("Mengunggah media aset...");
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload?folder=aset", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setFormData((prev) => ({ ...prev, photoUrl: json.url }));
        setUploadProgress("");
      } else {
        alert(json.error || "Gagal mengunggah file media.");
      }
    } catch (err) {
      console.error("Error uploading media:", err);
      alert("Terjadi kesalahan saat mengunggah media.");
    } finally {
      setUploading(false);
    }
  };

  const filteredAssets = assets.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      item.personInCharge.toLowerCase().includes(search.toLowerCase());

    const matchOwner = ownerFilter === "ALL" || item.owner === ownerFilter;
    const matchCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchCondition = conditionFilter === "ALL" || item.condition === conditionFilter;

    return matchSearch && matchOwner && matchCategory && matchCondition;
  });

  const totalAssetsCount = assets.length;
  const totalUnits = assets.reduce((sum, a) => sum + (a.quantity || 1), 0);
  const totalPurchaseValue = assets.reduce((sum, a) => sum + a.purchaseCost, 0);

  const pkbmAssets = assets.filter((a) => a.owner === "PKBM_ASKARA");
  const pkbmValue = pkbmAssets.reduce((sum, a) => sum + a.purchaseCost, 0);

  const yayasanAssets = assets.filter((a) => a.owner === "YAYASAN");
  const yayasanValue = yayasanAssets.reduce((sum, a) => sum + a.purchaseCost, 0);

  const goodConditionCount = assets.filter((a) => a.condition === "BAIK").length;
  const needAttentionCount = assets.filter((a) => a.condition !== "BAIK").length;

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setFormData(defaultFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (item: Asset) => {
    setEditingAsset(item);
    setFormData({
      code: item.code,
      name: item.name,
      owner: item.owner,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      acquisitionDate: new Date(item.acquisitionDate).toISOString().split("T")[0],
      purchaseCost: String(item.purchaseCost),
      currentValue: item.currentValue ? String(item.currentValue) : String(item.purchaseCost),
      fundingSource: item.fundingSource,
      condition: item.condition,
      location: item.location,
      personInCharge: item.personInCharge,
      description: item.description || "",
      photoUrl: item.photoUrl || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        const res = await fetch("/api/aset", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingAsset.id, ...formData }),
        });
        const json = await res.json();
        if (json.success) {
          fetchAssets();
          setShowModal(false);
        } else {
          alert(json.error || "Gagal memperbarui aset");
        }
      } else {
        const res = await fetch("/api/aset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          fetchAssets();
          setShowModal(false);
        } else {
          alert(json.error || "Gagal menambahkan aset");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan aset");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus aset " + name + "?")) return;
    try {
      const res = await fetch("/api/aset?id=" + id, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchAssets();
      } else {
        alert(json.error || "Gagal menghapus aset");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus aset");
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-asset-report, #print-asset-report * { visibility: visible !important; }
          #print-asset-report {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background: white !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 no-print">
        <Link href="/admin" className="hover:text-slate-800 transition">Admin</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-purple-700 font-bold">Pencatatan Aset (Yayasan & PKBM)</span>
      </div>

      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden no-print">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Hak Akses: Super Admin
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-semibold">
                Inventaris Lembaga & Yayasan
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pencatatan Aset PKBM & Yayasan
            </h1>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
              Modul manajemen aset strategis lembaga: pantau sarana prasarana operasional PKBM Askara
              serta aset gedung & inventaris milik Yayasan lengkap dengan dokumentasi foto/video.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4 text-purple-300" /> Cetak Rekap Aset
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tambah Aset Baru
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Nilai Aset</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{formatRupiah(totalPurchaseValue)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{totalAssetsCount} Item Terdata</span>
            <span className="font-semibold text-purple-700">{totalUnits} Unit Total</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Aset PKBM Askara</p>
              <h3 className="text-xl font-extrabold text-emerald-900 mt-1">{formatRupiah(pkbmValue)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
            <span>{pkbmAssets.length} Item Operasional</span>
            <span>Lab, Vokasi & KBM</span>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Aset Yayasan</p>
              <h3 className="text-xl font-extrabold text-indigo-900 mt-1">{formatRupiah(yayasanValue)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-indigo-200/60 flex items-center justify-between text-[11px] text-indigo-700 font-medium">
            <span>{yayasanAssets.length} Item Yayasan</span>
            <span>Gedung, Tanah & Mobil</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelayakan Fisik</p>
              <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
                {goodConditionCount} <span className="text-sm font-semibold text-slate-400">/ {totalAssetsCount}</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold">✓ {goodConditionCount} Baik</span>
            {needAttentionCount > 0 ? (
              <span className="text-rose-600 font-bold">⚠ {needAttentionCount} Perlu Servis</span>
            ) : (
              <span className="text-slate-400">Semua Prima</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setOwnerFilter("ALL")}
              className={"px-3.5 py-1.5 rounded-lg transition " + (ownerFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800")}
            >
              Semua Entitas ({assets.length})
            </button>
            <button
              onClick={() => setOwnerFilter("PKBM_ASKARA")}
              className={"px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 " + (ownerFilter === "PKBM_ASKARA" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-emerald-700")}
            >
              <Building2 className="w-3.5 h-3.5" /> Aset PKBM Askara ({pkbmAssets.length})
            </button>
            <button
              onClick={() => setOwnerFilter("YAYASAN")}
              className={"px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 " + (ownerFilter === "YAYASAN" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-indigo-700")}
            >
              <Landmark className="w-3.5 h-3.5" /> Aset Yayasan ({yayasanAssets.length})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <strong className="text-slate-800">{filteredAssets.length}</strong> dari {assets.length} aset
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode, nama, lokasi, atau PIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="TANAH_BANGUNAN">🏢 Tanah & Bangunan</option>
              <option value="ELEKTRONIK_TI">💻 Elektronik & TI</option>
              <option value="PERALATAN_VOKASI">☕ Peralatan Vokasi</option>
              <option value="KENDARAAN">🚗 Kendaraan Operasional</option>
              <option value="FURNITUR_MEUBEL">🪑 Meubelair & Furnitur</option>
              <option value="BUKU_PUSTAKA">📚 Buku & Pustaka</option>
              <option value="LAINNYA">📦 Lainnya</option>
            </select>
          </div>

          <div>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="ALL">Semua Kondisi</option>
              <option value="BAIK">✓ Kondisi Baik</option>
              <option value="RUSAK_RINGAN">⚠️ Rusak Ringan</option>
              <option value="RUSAK_BERAT">❌ Rusak Berat</option>
              <option value="DALAM_PERAWATAN">🔧 Dalam Perawatan</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => {
                setSearch("");
                setOwnerFilter("ALL");
                setCategoryFilter("ALL");
                setConditionFilter("ALL");
              }}
              className="w-full py-2 px-3 border border-slate-200 hover:border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition text-center"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-purple-600" />
            Daftar Inventaris Aset Lembaga
          </h2>
          <span className="text-xs text-slate-500 font-medium">{filteredAssets.length} aset terdaftar</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data inventaris aset...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">Tidak ada data aset yang sesuai filter</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau reset filter</p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-600 transition"
            >
              <Plus className="w-4 h-4" /> Tambah Aset Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="px-4 py-3">Kode & Nama Aset</th>
                  <th className="px-3 py-3">Dokumentasi</th>
                  <th className="px-3 py-3">Entitas</th>
                  <th className="px-3 py-3">Kategori</th>
                  <th className="px-3 py-3">Kuantitas</th>
                  <th className="px-3 py-3">Lokasi & PIC</th>
                  <th className="px-3 py-3 text-right">Nilai Perolehan</th>
                  <th className="px-3 py-3 text-center">Kondisi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => {
                  const cat = CATEGORY_MAP[asset.category] || CATEGORY_MAP.LAINNYA;
                  const cond = CONDITION_MAP[asset.condition] || CONDITION_MAP.BAIK;
                  const Icon = cat.icon;
                  const CondIcon = cond.icon;
                  const isVideo = isVideoUrl(asset.photoUrl);

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className={"w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border " + cat.color}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{asset.name}</p>
                            <p className="font-mono text-[11px] text-slate-400 mt-0.5">{asset.code}</p>
                          </div>
                        </div>
                      </td>

                      {/* Dokumentasi Foto / Video */}
                      <td className="px-3 py-3.5">
                        {asset.photoUrl ? (
                          <button
                            onClick={() => setDetailAsset(asset)}
                            className="group flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-lg transition border border-slate-200"
                            title="Lihat Media"
                          >
                            {isVideo ? (
                              <>
                                <Film className="w-3.5 h-3.5 text-purple-600" />
                                <span className="text-[10px] font-bold">Video</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[10px] font-bold">Foto</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px] italic">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5">
                        {asset.owner === "PKBM_ASKARA" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Building2 className="w-3 h-3" /> PKBM Askara
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <Landmark className="w-3 h-3" /> Yayasan
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="text-slate-700 font-medium">{cat.label}</span>
                      </td>

                      <td className="px-3 py-3.5 font-bold text-slate-800">
                        {asset.quantity} {asset.unit}
                      </td>

                      <td className="px-3 py-3.5">
                        <p className="text-slate-800 font-semibold truncate max-w-[170px]">{asset.location}</p>
                        <p className="text-slate-400 text-[11px] truncate max-w-[170px]">PIC: {asset.personInCharge}</p>
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        <p className="font-bold text-slate-900">{formatRupiah(asset.purchaseCost)}</p>
                        {asset.currentValue && asset.currentValue !== asset.purchaseCost && (
                          <p className="text-[10px] text-slate-400">
                            Kini: {formatRupiah(asset.currentValue)}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border " + cond.badge}>
                          <CondIcon className="w-3 h-3" /> {cond.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDetailAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                            title="Detail Aset & Media"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(asset)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Aset"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id, asset.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Aset"
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
        )}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* MODAL TAMBAH / EDIT ASET DENGAN UPLOAD */}
      {/* ═══════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-purple-50/50 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingAsset ? "Edit Data Aset Inventaris" : "Tambah Data Aset Baru"}
                  </h2>
                  <p className="text-[11px] text-slate-500">Pencatatan aset resmi PKBM Askara & Yayasan</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Upload Foto / Video Dokumentasi Aset */}
              <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-purple-600" /> Dokumentasi Foto / Video Aset (Opsional)
                  </label>
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photoUrl: "" })}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Hapus Media
                    </button>
                  )}
                </div>

                {/* Media Preview if attached */}
                {formData.photoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
                    {isVideoUrl(formData.photoUrl) ? (
                      <video
                        src={formData.photoUrl}
                        controls
                        className="w-full max-h-48 rounded-xl object-contain bg-black"
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={formData.photoUrl}
                        alt="Preview Aset"
                        className="w-full max-h-48 rounded-xl object-contain bg-slate-100"
                      />
                    )}
                    <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/70 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                      {isVideoUrl(formData.photoUrl) ? (
                        <>
                          <Film className="w-3 h-3 text-purple-400" /> Video Terlampir
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3 text-emerald-400" /> Foto Terlampir
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Upload Dropzone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50/50 rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex items-center gap-2 text-purple-700 font-bold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{uploadProgress || "Mengunggah..."}</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">
                            Klik untuk upload foto atau video aset
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Mendukung format JPG, PNG, WEBP, MP4, WEBM (Maks. 75 MB)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Entitas Pemilik & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Entitas Pemilik Aset <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value as AssetOwner })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-bold"
                    required
                  >
                    <option value="PKBM_ASKARA">🏫 PKBM Askara (Operasional Pembelajaran)</option>
                    <option value="YAYASAN">🏛️ Yayasan (Gedung, Tanah, Kendaraan, Utilitas)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Aset <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-semibold"
                    required
                  >
                    <option value="TANAH_BANGUNAN">🏢 Tanah & Bangunan</option>
                    <option value="ELEKTRONIK_TI">💻 Elektronik & TI</option>
                    <option value="PERALATAN_VOKASI">☕ Peralatan Vokasi & Keterampilan</option>
                    <option value="KENDARAAN">🚗 Kendaraan Operasional</option>
                    <option value="FURNITUR_MEUBEL">🪑 Meubelair & Furnitur Belajar</option>
                    <option value="BUKU_PUSTAKA">📚 Buku & Modul Pustaka</option>
                    <option value="LAINNYA">📦 Inventaris Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Nama Aset & Kode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Aset / Inventaris <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Mesin Espresso 2 Group Sanremo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Aset <span className="text-slate-400 font-normal">(Otomatis/Manual)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="AST-PKBM-2026-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              {/* Kuantitas, Satuan, Tgl Pengadaan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jumlah / Kuantitas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-medium"
                  >
                    <option value="Unit">Unit</option>
                    <option value="Set">Set</option>
                    <option value="Paket">Paket</option>
                    <option value="Buah">Buah</option>
                    <option value="Bidang">Bidang</option>
                    <option value="m²">m²</option>
                    <option value="Eksemplar">Eksemplar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Perolehan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.acquisitionDate}
                    onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Nilai Perolehan & Nilai Sekarang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nilai Perolehan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 15000000"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Taksiran Nilai Sekarang (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Sama dengan perolehan jika baru"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50"
                  />
                </div>
              </div>

              {/* Sumber Dana & Kondisi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sumber Dana Pengadaan</label>
                  <select
                    value={formData.fundingSource}
                    onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-medium"
                  >
                    <option value="DANA_YAYASAN">Dana Yayasan</option>
                    <option value="DANA_BOS">Dana BOS Kesetaraan</option>
                    <option value="SWADAYA_PKBM">Swadaya PKBM Askara</option>
                    <option value="HIBAH_PEMERINTAH">Hibah Pemerintah / Kemendikbud</option>
                    <option value="DONASI_SUMBANGAN">Donasi / Sumbangan Masyarakat</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kondisi Fisik Aset</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as AssetCondition })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-bold"
                  >
                    <option value="BAIK">✓ Kondisi Baik & Berfungsi Optimal</option>
                    <option value="RUSAK_RINGAN">⚠️ Rusak Ringan (Masih bisa digunakan)</option>
                    <option value="RUSAK_BERAT">❌ Rusak Berat (Perlu ganti baru)</option>
                    <option value="DALAM_PERAWATAN">🔧 Dalam Perawatan / Servis</option>
                  </select>
                </div>
              </div>

              {/* Lokasi & PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lokasi Penempatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Lab Komputer Lt. 2 / Workshop Tata Boga"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Penanggung Jawab (PIC) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dewi Anggraini, S.Kom."
                    value={formData.personInCharge}
                    onChange={(e) => setFormData({ ...formData, personInCharge: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi / Spesifikasi Teknis / Catatan Tambahan
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan nomor seri, garansi, kondisi perlengkapan pendukung, dll..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Simpan Data Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* MODAL DETAIL ASET DENGAN MEDIA VIEWER  */}
      {/* ═══════════════════════════════════════ */}
      {detailAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Landmark className="w-4 h-4 text-purple-600" /> Detail Kartu Inventaris Aset
              </span>
              <button
                onClick={() => setDetailAsset(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-xs space-y-4">
              {/* Media Preview if exists */}
              {detailAsset.photoUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                  {isVideoUrl(detailAsset.photoUrl) ? (
                    <video
                      src={detailAsset.photoUrl}
                      controls
                      autoPlay
                      className="w-full max-h-56 object-contain bg-black"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={detailAsset.photoUrl}
                      alt={detailAsset.name}
                      className="w-full max-h-56 object-contain bg-slate-100"
                    />
                  )}
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {detailAsset.code}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{detailAsset.name}</h3>
                </div>
                {detailAsset.owner === "PKBM_ASKARA" ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    PKBM Askara
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Yayasan
                  </span>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Kategori</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {CATEGORY_MAP[detailAsset.category]?.label || detailAsset.category}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Jumlah / Unit</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {detailAsset.quantity} {detailAsset.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Nilai Perolehan</p>
                  <p className="font-bold text-emerald-700 mt-0.5">{formatRupiah(detailAsset.purchaseCost)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Taksiran Sekarang</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {formatRupiah(detailAsset.currentValue || detailAsset.purchaseCost)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Tanggal Perolehan</p>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {new Date(detailAsset.acquisitionDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Sumber Dana</p>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {FUNDING_SOURCES[detailAsset.fundingSource] || detailAsset.fundingSource}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Lokasi</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{detailAsset.location}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Penanggung Jawab</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{detailAsset.personInCharge}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-600">Status Kelayakan:</span>
                <span
                  className={"inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border " + (CONDITION_MAP[detailAsset.condition]?.badge || "")}
                >
                  {CONDITION_MAP[detailAsset.condition]?.label}
                </span>
              </div>

              {detailAsset.description && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Deskripsi / Catatan Teknis:</p>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{detailAsset.description}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setDetailAsset(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-purple-600" /> Cetak Laporan Rekapitulasi Aset
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak / Unduh PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div id="print-asset-report" className="p-8 text-xs bg-white space-y-5">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <Image
                      src="/logo.png"
                      alt="Logo PKBM Askara"
                      width={64}
                      height={64}
                      className="object-contain"
                      style={{ printColorAdjust: "exact" }}
                    />
                  </div>
                  <div>
                    <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                      PKBM ASKARA & YAYASAN AKSARA KESETARAAN
                    </h1>
                    <p className="text-slate-600 text-[11px] leading-snug mt-0.5">
                      Jl. Adiflora Raya No. 8, Kel. Rancabolan, Kec. Gedebage
                    </p>
                    <p className="text-slate-600 text-[11px]">Kota Bandung</p>
                    <p className="text-slate-600 text-[11px]">Telp: (022) 875 18584 · NPSN: P999876</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-extrabold tracking-widest">
                    BUKU INVENTARIS ASET
                  </div>
                  <p className="text-slate-600 mt-2 text-xs">
                    Per Tanggal:{" "}
                    <strong>
                      {new Date().toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                  </p>
                  <p className="text-slate-400 text-[10px]">Dokumen Rahasia & Akuntansi Lembaga</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border border-slate-200 rounded-lg p-3 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Nilai Perolehan</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{formatRupiah(totalPurchaseValue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-700 uppercase font-semibold">Total Aset PKBM</p>
                  <p className="text-sm font-extrabold text-emerald-800 mt-0.5">{formatRupiah(pkbmValue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-indigo-700 uppercase font-semibold">Total Aset Yayasan</p>
                  <p className="text-sm font-extrabold text-indigo-800 mt-0.5">{formatRupiah(yayasanValue)}</p>
                </div>
              </div>

              <table className="w-full text-left text-[11px] border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                    <th className="p-2 border-r border-slate-300 text-center w-8">No</th>
                    <th className="p-2 border-r border-slate-300">Kode & Nama Aset</th>
                    <th className="p-2 border-r border-slate-300">Entitas</th>
                    <th className="p-2 border-r border-slate-300">Kategori</th>
                    <th className="p-2 border-r border-slate-300 text-center">Qty</th>
                    <th className="p-2 border-r border-slate-300">Lokasi / PIC</th>
                    <th className="p-2 border-r border-slate-300 text-right">Nilai Perolehan</th>
                    <th className="p-2 text-center">Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assets.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                        {item.name}
                        <div className="font-mono text-[10px] text-slate-500">{item.code}</div>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-700">
                        {item.owner === "PKBM_ASKARA" ? "PKBM Askara" : "Yayasan"}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        {CATEGORY_MAP[item.category]?.label || item.category}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-semibold">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <div>{item.location}</div>
                        <div className="text-[10px] text-slate-500">PIC: {item.personInCharge}</div>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-900">
                        {formatRupiah(item.purchaseCost)}
                      </td>
                      <td className="p-2 text-center font-semibold">
                        {CONDITION_MAP[item.condition]?.label || item.condition}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-800">
                    <td colSpan={6} className="p-2 text-right border-r border-slate-300 uppercase">
                      Total Akumulasi Nilai Aset Lembaga:
                    </td>
                    <td className="p-2 text-right border-r border-slate-300 text-slate-900">
                      {formatRupiah(totalPurchaseValue)}
                    </td>
                    <td className="p-2 text-center text-emerald-800">{totalUnits} Unit Total</td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 pt-6">
                <div className="text-center">
                  <p className="text-slate-500 mb-16">Pengurus Yayasan Aksara,</p>
                  <div className="border-t border-slate-400 pt-1">
                    <p className="font-bold text-slate-900">Drs. Hendra Gunawan</p>
                    <p className="text-slate-500 text-[11px]">Ketua Yayasan Aksara Kesetaraan</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 mb-16">Kepala PKBM Askara,</p>
                  <div className="border-t border-slate-400 pt-1">
                    <p className="font-bold text-slate-900">Prof. Arif Syarifudin, S.Pd.</p>
                    <p className="text-slate-500 text-[11px]">NIP: 19750914 200003 2 001</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
                Dokumen Inventaris & Aset ini diterbitkan secara resmi melalui Sistem Informasi PKBM Askara.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
