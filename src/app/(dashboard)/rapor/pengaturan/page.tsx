"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
  Award,
  RefreshCw,
} from "lucide-react";

interface ProfileState {
  name: string;
  operationalPermit: string;
  npsn: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  postalCode: string;
  village: string;
  district: string;
  city: string;
  province: string;
  logoUrl: string;
  headmasterName: string;
  headmasterNip: string;
  defaultHomeroomTeacher: string;
  defaultHomeroomNip: string;
  reportPlaceDate: string;
  academicYear: string;
  semester: string;
  curriculumName: string;
}

export default function PengaturanKopRaporPage() {
  const [profile, setProfile] = useState<ProfileState>({
    name: "Pusat Kegiatan Belajar Masyarakat (PKBM) Askara",
    operationalPermit: "Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP",
    npsn: "P9998766",
    address: "Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung",
    phone: "(022) 87518584 / 085156560630",
    email: "pkbm.askara@gmail.com",
    website: "www.pkbmaskara.sch.id",
    postalCode: "40296",
    village: "Rancabolang",
    district: "Gedebage",
    city: "Kota Bandung",
    province: "Jawa Barat",
    logoUrl: "/logo.png",
    headmasterName: "Arif Syarifudin, S.Pd",
    headmasterNip: "",
    defaultHomeroomTeacher: "Drs. Hendra Gunawan",
    defaultHomeroomNip: "19800412 200501 1 003",
    reportPlaceDate: "Bandung, 13 Agustus 2026",
    academicYear: "2025/2026",
    semester: "GANJIL",
    curriculumName: "Kurikulum Merdeka Pendidikan Kesetaraan",
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.user) {
          setCurrentUser(meData.user);
        }
      } catch (err) {
        console.error("Auth check failed in pengaturan:", err);
      } finally {
        setAuthLoading(false);
      }
      fetchProfile();
    };
    checkAuthAndFetch();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rapor/institution");
      const data = await res.json();
      if (data.profile) {
        setProfile((prev) => ({
          ...prev,
          ...data.profile,
        }));
      }
    } catch (err) {
      console.error("Gagal mengambil data profil:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileState, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/rapor/institution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Pengaturan berhasil disimpan!" });
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan pengaturan." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan saat menyimpan data." });
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = currentUser && ["super_admin", "admin"].includes(currentUser.role);

  if (authLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Memverifikasi hak akses...</p>
      </div>
    );
  }

  if (!isAdmin) {
    const returnPath = currentUser?.role === "siswa" ? "/siswa/rapor" : currentUser?.role === "orang_tua" ? "/orang-tua/rapor" : "/rapor";
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-soft text-center max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Akses Dibatasi</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Pengaturan identitas dan Kop Lembaga hanya dapat diubah oleh <strong>Administrator Utama</strong>.
        </p>
        <div className="mt-6">
          <Link
            href={returnPath}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke e-Rapor</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Konfigurasi Lembaga
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Kop Surat, Head & Cover Rapor
            </h1>
            <p className="text-xs text-slate-500">
              Kelola kop surat resmi, identitas lembaga, tanda tangan kepala PKBM, dan format cover depan e-Rapor.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/rapor"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ke e-Rapor</span>
          </Link>
          <Link
            href="/rapor/cover"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Lihat Cover Rapor</span>
          </Link>
        </div>
      </div>

      {/* Alert Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas Lembaga & Kop Surat */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">1. Identitas Lembaga & Kop Surat</h2>
              <p className="text-xs text-slate-500">
                Informasi ini ditampilkan pada bagian Kop Surat atas dokumen e-Rapor resmi.
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Resmi Lembaga / PKBM <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Pusat Kegiatan Belajar Masyarakat (PKBM) Askara"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Izin Operasional Lembaga <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.operationalPermit}
                onChange={(e) => handleChange("operationalPermit", e.target.value)}
                placeholder="Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NPSN (Nomor Pokok Sekolah Nasional) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.npsn}
                onChange={(e) => handleChange("npsn", e.target.value)}
                placeholder="P9998766"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Lengkap Lembaga <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kelurahan / Desa</label>
              <input
                type="text"
                value={profile.village}
                onChange={(e) => handleChange("village", e.target.value)}
                placeholder="Rancabolang"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
              <input
                type="text"
                value={profile.district}
                onChange={(e) => handleChange("district", e.target.value)}
                placeholder="Mampang Prapatan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Jakarta Selatan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
              <input
                type="text"
                value={profile.province}
                onChange={(e) => handleChange("province", e.target.value)}
                placeholder="DKI Jakarta"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(021) 7891234"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="info@askara.sch.id"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website</label>
              <input
                type="text"
                value={profile.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="www.pkbmaskara.sch.id"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Path / URL Logo Lembaga</label>
              <input
                type="text"
                value={profile.logoUrl}
                onChange={(e) => handleChange("logoUrl", e.target.value)}
                placeholder="/logo.png"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Kepala Sekolah & Titimangsa Rapor */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800">
              2. Pejabat Pengesahan & Titimangsa Rapor
            </h2>
            <p className="text-xs text-slate-500">
              Pengaturan nama kepala PKBM, NIP, serta tanggal dan tempat penerbitan rapor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Kepala PKBM & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.headmasterName}
                onChange={(e) => handleChange("headmasterName", e.target.value)}
                placeholder="Arif Syarifudin, S.Pd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NIP / NIY Kepala PKBM (Opsional)
              </label>
              <input
                type="text"
                value={profile.headmasterNip}
                onChange={(e) => handleChange("headmasterNip", e.target.value)}
                placeholder="Dikosongkan jika tidak ada"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Default Wali Kelas / Tutor
              </label>
              <input
                type="text"
                value={profile.defaultHomeroomTeacher}
                onChange={(e) => handleChange("defaultHomeroomTeacher", e.target.value)}
                placeholder="Drs. Hendra Gunawan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NIP / NIY Default Wali Kelas
              </label>
              <input
                type="text"
                value={profile.defaultHomeroomNip}
                onChange={(e) => handleChange("defaultHomeroomNip", e.target.value)}
                placeholder="19800412 200501 1 003"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Titimangsa Rapor (Tempat, Tanggal Penerbitan) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.reportPlaceDate}
                onChange={(e) => handleChange("reportPlaceDate", e.target.value)}
                placeholder="Jakarta, 13 Agustus 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Kurikulum yang Digunakan
              </label>
              <input
                type="text"
                value={profile.curriculumName}
                onChange={(e) => handleChange("curriculumName", e.target.value)}
                placeholder="Kurikulum Merdeka Pendidikan Kesetaraan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tahun Ajaran Aktif
              </label>
              <input
                type="text"
                value={profile.academicYear}
                onChange={(e) => handleChange("academicYear", e.target.value)}
                placeholder="2025/2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Semester Aktif
              </label>
              <select
                value={profile.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="GANJIL">Ganjil</option>
                <option value="GENAP">Genap</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Preview Kop Surat */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <span>Pratinjau Kop Surat Resmi Rapor</span>
          </h3>

          <div className="p-5 border-2 border-slate-800 rounded-xl bg-white text-slate-900 text-center">
            <div className="flex items-center justify-center space-x-4">
              <img
                src={profile.logoUrl || "/logo.png"}
                alt="Logo Preview"
                className="h-16 w-auto object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                  {profile.name}
                </h2>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  {profile.operationalPermit} • NPSN: {profile.npsn}
                </p>
                <p className="text-[10px] text-slate-500">
                  {profile.address}, Telp: {profile.phone}, Email: {profile.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end space-x-4 pt-2">
          <button
            type="button"
            onClick={fetchProfile}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Kop & Cover</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
