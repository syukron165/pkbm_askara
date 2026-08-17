"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  User,
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Users,
  Coins,
  Send,
  Building,
} from "lucide-react";
import DualUploadInput from "@/components/DualUploadInput";
import { calculateDetailedAge, getIncomeDecile } from "@/lib/public-registration-db";

export default function PendaftaranSiswaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ field: string; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    nik: "",
    nisn: "",
    email: "",
    phone: "",
    gender: "L",
    birthPlace: "",
    birthDate: "",
    address: "",
    rtRw: "",
    kelurahan: "",
    kecamatan: "",
    city: "Kota Bandung",
    province: "Jawa Barat",
    postalCode: "",
    packetType: "Paket C", // Paket A | Paket B | Paket C
    registrationTrack: "REGULER", // REGULER | VOKASI | BEASISWA_PIP | INKLUSI
    previousSchool: "",
    parentName: "",
    parentPhone: "",
    parentJob: "",
    parentIncome: "",
    // Berkas URLs
    avatarUrl: "",
    ktpUrl: "",
    kkUrl: "",
    birthCertUrl: "",
    diplomaUrl: "",
  });

  // Real-time calculated age & decile
  const liveAge = calculateDetailedAge(formData.birthDate);
  const liveIncomeDecile = getIncomeDecile(formData.parentIncome ? parseFloat(formData.parentIncome) : null);

  // Check duplicate onBlur
  const handleCheckDuplicate = async (field: "nik" | "nisn" | "email") => {
    const val = formData[field]?.trim();
    if (!val || val.length < 8) return;

    try {
      const res = await fetch(`/api/pendaftaran/check-duplicate?${field}=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.duplicate) {
        setDuplicateWarning({ field, message: data.message });
      } else if (duplicateWarning?.field === field) {
        setDuplicateWarning(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert("Nama lengkap wajib diisi.");
      return;
    }
    if (!formData.packetType) {
      alert("Pilihan jenjang paket wajib dipilih.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SISWA",
          ...formData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(
          `/pendaftaran/sukses?no=${data.registration.registrationNumber}&name=${encodeURIComponent(data.registration.fullName)}&type=SISWA&program=${encodeURIComponent(formData.packetType)}`
        );
      } else {
        alert(data.error || "Gagal mengirimkan formulir pendaftaran");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat mengirim formulir");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 rounded-3xl p-6 sm:p-8 border border-indigo-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            SPMB Online Mandiri • TP 2026/2027
          </span>
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
            Ijazah Resmi Kemendikdasmen
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Formulir Pendaftaran Peserta Didik Baru
        </h1>
        <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Pusat Kegiatan Belajar Masyarakat (PKBM) Askara menyelenggarakan Pendidikan Kesetaraan <strong>Paket A (Setara SD)</strong>, <strong>Paket B (Setara SMP)</strong>, dan <strong>Paket C (Setara SMA)</strong> dengan kurikulum merdeka fleksibel & vokasi terapan.
        </p>

        {/* Jalur Pendaftaran Switcher */}
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
          <Link
            href="/pendaftaran/siswa"
            className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Siswa Baru (SPMB)</span>
          </Link>
        </div>
      </div>

      {/* Duplicate Warning Alert */}
      {duplicateWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs animate-in fade-in shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">Peringatan Duplikasi Data:</span>
            <span className="text-slate-700">{duplicateWarning.message}</span>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm text-slate-800">
        
        {/* SEKSI 1: PILIHAN PROGRAM & JALUR PENDAFTARAN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">Pilihan Program Pendidikan & Jalur</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { code: "Paket A", title: "Paket A (Setara SD)", desc: "Pendidikan dasar membaca, menulis, berhitung & karakter" },
              { code: "Paket B", title: "Paket B (Setara SMP)", desc: "Pendidikan menengah pertama kurikulum merdeka & sains dasar" },
              { code: "Paket C", title: "Paket C (Setara SMA)", desc: "Pendidikan menengah atas + Pelatihan Vokasi Siap Kerja / Kuliah" },
            ].map((pkt) => (
              <label
                key={pkt.code}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  formData.packetType === pkt.code
                    ? "bg-indigo-50/80 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">{pkt.title}</span>
                  <input
                    type="radio"
                    name="packetType"
                    value={pkt.code}
                    checked={formData.packetType === pkt.code}
                    onChange={(e) => setFormData({ ...formData, packetType: e.target.value })}
                    className="w-4 h-4 text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500">{pkt.desc}</p>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Jalur Pendaftaran
              </label>
              <select
                value={formData.registrationTrack}
                onChange={(e) => setFormData({ ...formData, registrationTrack: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-semibold shadow-2xs"
              >
                <option value="REGULER">Jalur Reguler (Mandiri)</option>
                <option value="VOKASI">Jalur Vokasi Terapan & Magang Industri</option>
                <option value="BEASISWA_PIP">Jalur Beasiswa Program Indonesia Pintar (PIP)</option>
                <option value="INKLUSI">Jalur Khusus / Inklusi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Asal Sekolah Sebelumnya (Jika Ada)
              </label>
              <input
                type="text"
                placeholder="Contoh: SMP Negeri 2 Bandung / Drop-Out"
                value={formData.previousSchool}
                onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* SEKSI 2: DATA PRIBADI & PERHITUNGAN USIA OTOMATIS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Data Pribadi Calon Peserta Didik</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nama Lengkap Sesuai Akte / Ijazah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso Pratama"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nomor Induk Kependudukan (NIK KTP / KIA) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={16}
                placeholder="16 Digit NIK KTP / Kartu Keluarga"
                value={formData.nik}
                onBlur={() => handleCheckDuplicate("nik")}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, "") })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                NISN (Nomor Induk Siswa Nasional)
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="10 Digit NISN (Kosongkan jika belum punya)"
                value={formData.nisn}
                onBlur={() => handleCheckDuplicate("nisn")}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value.replace(/\D/g, "") })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Tempat Lahir
              </label>
              <input
                type="text"
                placeholder="Contoh: Bandung"
                value={formData.birthPlace}
                onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>

            {/* TANGGAL LAHIR & KALKULASI USIA OTOMATIS REAL-TIME */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                {liveAge !== "-" && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    Usia: {liveAge}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Jenis Kelamin
              </label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="gender"
                    value="L"
                    checked={formData.gender === "L"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="text-indigo-600"
                  />
                  <span>Laki-Laki</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="gender"
                    value="P"
                    checked={formData.gender === "P"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="text-indigo-600"
                  />
                  <span>Perempuan</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>
          </div>
        </div>

        {/* SEKSI 3: ALAMAT TINGGAL & DOMISILI */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">Alamat Domisili Calon Peserta Didik</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Alamat Lengkap (Jalan, No Rumah, Komp)
              </label>
              <input
                type="text"
                placeholder="Contoh: Jl. Gedebage Selatan No. 45"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                RT / RW
              </label>
              <input
                type="text"
                placeholder="Contoh: RT 03 / RW 08"
                value={formData.rtRw}
                onChange={(e) => setFormData({ ...formData, rtRw: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Kelurahan
              </label>
              <input
                type="text"
                placeholder="Contoh: Rancabolang"
                value={formData.kelurahan}
                onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Kecamatan
              </label>
              <input
                type="text"
                placeholder="Contoh: Gedebage"
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Kota / Kabupaten
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-semibold shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* SEKSI 4: DATA ORANG TUA & DESIL PENGHASILAN EKONOMI */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              4
            </div>
            <h3 className="font-bold text-sm text-slate-900">Data Orang Tua / Wali & Desil Ekonomi</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nama Ayah / Ibu / Wali
              </label>
              <input
                type="text"
                placeholder="Contoh: Santoso Wijaya"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-bold shadow-2xs placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nomor WhatsApp Orang Tua / Wali
              </label>
              <input
                type="tel"
                placeholder="Contoh: 081298765432"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pekerjaan Orang Tua / Wali
              </label>
              <input
                type="text"
                placeholder="Contoh: Wiraswasta / Karyawan / Buruh"
                value={formData.parentJob}
                onChange={(e) => setFormData({ ...formData, parentJob: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>

            {/* PENGHASILAN BULANAN DENGAN DESIL OTOMATIS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Estimasi Penghasilan Bulanan (Rp)
                </label>
                {formData.parentIncome && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                    {liveIncomeDecile.split(" (")[0]}
                  </span>
                )}
              </div>
              <input
                type="number"
                placeholder="Contoh: 2500000"
                value={formData.parentIncome}
                onChange={(e) => setFormData({ ...formData, parentIncome: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
              />
              {formData.parentIncome && (
                <p className="text-[11px] text-amber-700 mt-1">
                  Kategori: <strong>{liveIncomeDecile}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SEKSI 5: DUAL-OPTION UPLOAD BERKAS DOKUMEN (FILE / KAMERA LIVE) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              5
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Unggah Berkas Persyaratan (Dual-Option: File / Foto Kamera)</h3>
              <p className="text-[11px] text-slate-500">Anda dapat memilih unggah file PDF/Foto atau langsung memotret dokumen menggunakan kamera HP/Laptop</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DualUploadInput
              label="1. KTP / Kartu Identitas Anak (KIA) Pendaftar"
              value={formData.ktpUrl}
              onChange={(url) => setFormData({ ...formData, ktpUrl: url })}
              description="Foto KTP/KIA asli yang jelas & tidak buram"
              required={true}
            />

            <DualUploadInput
              label="2. Kartu Keluarga (KK)"
              value={formData.kkUrl}
              onChange={(url) => setFormData({ ...formData, kkUrl: url })}
              description="Foto / Scan Kartu Keluarga yang mencantumkan nama siswa"
              required={true}
            />

            <DualUploadInput
              label="3. Akta Kelahiran"
              value={formData.birthCertUrl}
              onChange={(url) => setFormData({ ...formData, birthCertUrl: url })}
              description="Foto / Scan Akta Kelahiran resmi dari Disdukcapil"
            />

            <DualUploadInput
              label="4. Ijazah Terakhir / Surat Keterangan Lulus (SKL)"
              value={formData.diplomaUrl}
              onChange={(url) => setFormData({ ...formData, diplomaUrl: url })}
              description="Ijazah SD (untuk Paket B) atau Ijazah SMP (untuk Paket C)"
            />

            <div className="sm:col-span-2">
              <DualUploadInput
                label="5. Pas Foto Formal 3x4 Calon Peserta Didik"
                value={formData.avatarUrl}
                onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
                description="Foto formal setengah badan dengan latar belakang polos"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            Dengan mengklik tombol di samping, saya menyatakan seluruh data yang saya masukkan adalah benar dan dapat dipertanggungjawabkan.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Pendaftaran...</span>
              </>
            ) : (
              <>
                <span>Kirim Formulir Pendaftaran</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
