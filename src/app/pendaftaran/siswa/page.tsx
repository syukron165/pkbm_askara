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
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import DualUploadInput from "@/components/DualUploadInput";
import LocationMapsPicker from "@/components/LocationMapsPicker";
import { calculateDetailedAge, getIncomeDecile } from "@/lib/public-registration-db";

export default function PendaftaranSiswaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ field: string; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    nik: "",
    nisn: "",
    email: "",
    phone: "",
    gender: "L",
    birthPlace: "",
    birthDate: "",
    religion: "",
    numberOfSiblings: "",
    currentGrade: "",
    heightCm: "",
    weightKg: "",
    medicalHistory: "",
    address: "",
    rtRw: "",
    kelurahan: "",
    kecamatan: "",
    city: "Kota Bandung",
    province: "Jawa Barat",
    postalCode: "",
    packetType: "Paket C", // Paket A | Paket B | Paket C
    studyModel: "Reguler", // Reguler | Home Schooling | Kursus | Privat
    registrationTrack: "REGULER", // REGULER | VOKASI | BEASISWA_PIP | INKLUSI | PINDAHAN
    mapsUrl: "",
    latitude: null as number | null,
    longitude: null as number | null,
    previousSchool: "",
    previousSchoolAddress: "",
    mutationFrom: "",
    parentName: "",
    motherName: "",
    guardianName: "",
    parentPhone: "",
    parentJob: "",
    parentJobDll: "",
    motherJob: "",
    motherJobDll: "",
    guardianJob: "",
    guardianJobDll: "",
    fatherIncome: "",
    motherIncome: "",
    // Berkas URLs
    avatarUrl: "",
    ktpUrl: "",
    kkUrl: "",
    birthCertUrl: "",
    diplomaUrl: "",
    parentKtpUrl: "",
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pendaftaranSiswaDraft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, []);

  // Save draft to localStorage on change
  useEffect(() => {
    localStorage.setItem("pendaftaranSiswaDraft", JSON.stringify(formData));
  }, [formData]);

  // Real-time calculated age
  const liveAge = calculateDetailedAge(formData.birthDate);

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
    if (!password) {
      alert("Kata sandi akun wajib diisi (minimal 6 karakter).");
      return;
    }
    if (password.length < 6) {
      alert("Kata sandi minimal harus 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Konfirmasi kata sandi tidak cocok dengan kata sandi yang dimasukkan.");
      return;
    }

    try {
      setSubmitting(true);
      
      const finalData = { ...formData };
      if (finalData.parentJob === "DLL") finalData.parentJob = finalData.parentJobDll;
      if (finalData.motherJob === "DLL") finalData.motherJob = finalData.motherJobDll;
      if (finalData.guardianJob === "DLL") finalData.guardianJob = finalData.guardianJobDll;

      const res = await fetch("/api/pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SISWA",
          password,
          ...finalData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.removeItem("pendaftaranSiswaDraft");
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Model / Pola Belajar <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.studyModel}
                onChange={(e) => setFormData({ ...formData, studyModel: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-semibold shadow-2xs"
              >
                <option value="Reguler">Reguler (Tatap Muka & Blended)</option>
                <option value="Home Schooling">Home Schooling (Mandiri/Komunitas)</option>
                <option value="Kursus">Kursus Keterampilan / Vokasi</option>
                <option value="Privat">Privat (1-on-1 / Guru Datang)</option>
              </select>
            </div>

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
                <option value="PINDAHAN">Jalur Pindahan / Mutasi</option>
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
          {formData.registrationTrack === "PINDAHAN" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Alamat Lengkap Sekolah Asal
                </label>
                <textarea
                  placeholder="Isi alamat sekolah asal secara lengkap"
                  value={formData.previousSchoolAddress}
                  onChange={(e) => setFormData({ ...formData, previousSchoolAddress: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Pindah Sekolah Dari
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kota Surabaya / Kab. Malang"
                  value={formData.mutationFrom}
                  onChange={(e) => setFormData({ ...formData, mutationFrom: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
                />
              </div>
            </div>
          )}
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

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Agama
              </label>
              <select
                value={formData.religion}
                onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-semibold"
              >
                <option value="">Pilih Agama</option>
                <option value="Islam">Islam</option>
                <option value="Katolik">Katolik</option>
                <option value="Protestan">Protestan</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
                <option value="Kepercayaan">Aliran Kepercayaan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Jumlah Saudara Kandung
              </label>
              <input
                type="number"
                placeholder="Berapa bersaudara"
                value={formData.numberOfSiblings}
                onChange={(e) => setFormData({ ...formData, numberOfSiblings: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Kelas Saat Ini / Kelas Terakhir
              </label>
              <select
                value={formData.currentGrade}
                onChange={(e) => setFormData({ ...formData, currentGrade: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-semibold"
              >
                <option value="">Pilih Kelas</option>
                <option value="I">Kelas I (SD)</option>
                <option value="II">Kelas II (SD)</option>
                <option value="III">Kelas III (SD)</option>
                <option value="IV">Kelas IV (SD)</option>
                <option value="V">Kelas V (SD)</option>
                <option value="VI">Kelas VI (SD)</option>
                <option value="VII">Kelas VII (SMP)</option>
                <option value="VIII">Kelas VIII (SMP)</option>
                <option value="IX">Kelas IX (SMP)</option>
                <option value="X">Kelas X (SMA/SMK)</option>
                <option value="XI">Kelas XI (SMA/SMK)</option>
                <option value="XII">Kelas XII (SMA/SMK)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Tinggi Badan (cm)
              </label>
              <input
                type="number"
                placeholder="Contoh: 160"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Berat Badan (kg)
              </label>
              <input
                type="number"
                placeholder="Contoh: 55"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Riwayat Penyakit (Jika Ada)
              </label>
              <textarea
                placeholder="Contoh: Asma, Alergi debu, dll"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium"
                rows={2}
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

          <div className="pt-2">
            <LocationMapsPicker
              address={[formData.address, formData.kelurahan, formData.kecamatan, formData.city].filter(Boolean).join(", ")}
              mapsUrl={formData.mapsUrl}
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={(data) => {
                setFormData(prev => ({
                  ...prev,
                  mapsUrl: data.mapsUrl,
                  latitude: data.latitude,
                  longitude: data.longitude,
                }));
              }}
            />
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
                Nama Lengkap Ayah Kandung <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Santoso Wijaya"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-bold shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pekerjaan Ayah <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.parentJob}
                onChange={(e) => setFormData({ ...formData, parentJob: e.target.value, parentJobDll: "" })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-semibold"
                required
              >
                <option value="">Pilih Pekerjaan Ayah</option>
                <option value="PNS">PNS</option>
                <option value="TNI">TNI</option>
                <option value="POLRI">POLRI</option>
                <option value="WIRASWASTA">Wiraswasta</option>
                <option value="NELAYAN">Nelayan</option>
                <option value="PETANI">Petani</option>
                <option value="PENGUSAHA">Pengusaha</option>
                <option value="KARYAWAN">Karyawan</option>
                <option value="PERAWAT">Perawat</option>
                <option value="DOKTER">Dokter</option>
                <option value="GURU">Guru</option>
                <option value="DOSEN">Dosen</option>
                <option value="BURUH">Buruh</option>
                <option value="DLL">Lainnya (Tulis Sendiri)</option>
              </select>
              {formData.parentJob === "DLL" && (
                <input
                  type="text"
                  placeholder="Sebutkan pekerjaan ayah..."
                  value={formData.parentJobDll}
                  onChange={(e) => setFormData({ ...formData, parentJobDll: e.target.value })}
                  className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Penghasilan Ayah Per Bulan
              </label>
              <select
                value={formData.fatherIncome}
                onChange={(e) => setFormData({ ...formData, fatherIncome: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-semibold"
              >
                <option value="">Pilih Rentang Penghasilan</option>
                <option value="< 1.000.000">Kurang dari Rp 1.000.000</option>
                <option value="1.000.000 - 3.000.000">Rp 1.000.000 - Rp 3.000.000</option>
                <option value="3.000.000 - 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                <option value="5.000.000 - 10.000.000">Rp 5.000.000 - Rp 10.000.000</option>
                <option value="> 10.000.000">Lebih dari Rp 10.000.000</option>
                <option value="Tidak Berpenghasilan">Tidak Berpenghasilan</option>
              </select>
            </div>

            <div className="hidden sm:block"></div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nama Lengkap Ibu Kandung <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Siti Aminah"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-bold shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pekerjaan Ibu <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.motherJob}
                onChange={(e) => setFormData({ ...formData, motherJob: e.target.value, motherJobDll: "" })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-semibold"
                required
              >
                <option value="">Pilih Pekerjaan Ibu</option>
                <option value="IRT">Ibu Rumah Tangga (IRT)</option>
                <option value="PNS">PNS</option>
                <option value="TNI">TNI</option>
                <option value="POLRI">POLRI</option>
                <option value="WIRASWASTA">Wiraswasta</option>
                <option value="NELAYAN">Nelayan</option>
                <option value="PETANI">Petani</option>
                <option value="PENGUSAHA">Pengusaha</option>
                <option value="KARYAWAN">Karyawan</option>
                <option value="PERAWAT">Perawat</option>
                <option value="DOKTER">Dokter</option>
                <option value="GURU">Guru</option>
                <option value="DOSEN">Dosen</option>
                <option value="BURUH">Buruh</option>
                <option value="DLL">Lainnya (Tulis Sendiri)</option>
              </select>
              {formData.motherJob === "DLL" && (
                <input
                  type="text"
                  placeholder="Sebutkan pekerjaan ibu..."
                  value={formData.motherJobDll}
                  onChange={(e) => setFormData({ ...formData, motherJobDll: e.target.value })}
                  className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Penghasilan Ibu Per Bulan
              </label>
              <select
                value={formData.motherIncome}
                onChange={(e) => setFormData({ ...formData, motherIncome: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-semibold"
              >
                <option value="">Pilih Rentang Penghasilan</option>
                <option value="< 1.000.000">Kurang dari Rp 1.000.000</option>
                <option value="1.000.000 - 3.000.000">Rp 1.000.000 - Rp 3.000.000</option>
                <option value="3.000.000 - 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                <option value="5.000.000 - 10.000.000">Rp 5.000.000 - Rp 10.000.000</option>
                <option value="> 10.000.000">Lebih dari Rp 10.000.000</option>
                <option value="Tidak Berpenghasilan">Tidak Berpenghasilan</option>
              </select>
            </div>

            <div className="hidden sm:block"></div>

            <div className="pt-2 border-t border-slate-100 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nama Lengkap Wali <span className="text-slate-500 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Isi jika diwakilkan oleh wali"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
              />
            </div>

            {formData.guardianName && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Pekerjaan Wali
                </label>
                <select
                  value={formData.guardianJob}
                  onChange={(e) => setFormData({ ...formData, guardianJob: e.target.value, guardianJobDll: "" })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-semibold"
                >
                  <option value="">Pilih Pekerjaan Wali</option>
                  <option value="PNS">PNS</option>
                  <option value="TNI">TNI</option>
                  <option value="POLRI">POLRI</option>
                  <option value="WIRASWASTA">Wiraswasta</option>
                  <option value="NELAYAN">Nelayan</option>
                  <option value="PETANI">Petani</option>
                  <option value="PENGUSAHA">Pengusaha</option>
                  <option value="KARYAWAN">Karyawan</option>
                  <option value="PERAWAT">Perawat</option>
                  <option value="DOKTER">Dokter</option>
                  <option value="GURU">Guru</option>
                  <option value="DOSEN">Dosen</option>
                  <option value="BURUH">Buruh</option>
                  <option value="DLL">Lainnya (Tulis Sendiri)</option>
                </select>
                {formData.guardianJob === "DLL" && (
                  <input
                    type="text"
                    placeholder="Sebutkan pekerjaan wali..."
                    value={formData.guardianJobDll}
                    onChange={(e) => setFormData({ ...formData, guardianJobDll: e.target.value })}
                    className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                  />
                )}
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nomor WhatsApp Orang Tua / Wali <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="Contoh: 081298765432"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
                required
              />
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
              label="1. KTP Orang Tua (Ayah / Ibu / Wali)"
              value={formData.parentKtpUrl}
              onChange={(url) => setFormData({ ...formData, parentKtpUrl: url })}
              description="Foto KTP asli yang jelas & tidak buram"
              required={true}
            />

            <DualUploadInput
              label="2. KTP / Kartu Identitas Anak (KIA) Pendaftar"
              value={formData.ktpUrl}
              onChange={(url) => setFormData({ ...formData, ktpUrl: url })}
              description="Opsional: KTP / KIA Siswa jika ada"
              required={false}
            />

            <DualUploadInput
              label="3. Kartu Keluarga (KK)"
              value={formData.kkUrl}
              onChange={(url) => setFormData({ ...formData, kkUrl: url })}
              description="Foto / Scan Kartu Keluarga yang mencantumkan nama siswa"
              required={true}
            />

            <DualUploadInput
              label="4. Akta Kelahiran"
              value={formData.birthCertUrl}
              onChange={(url) => setFormData({ ...formData, birthCertUrl: url })}
              description="Foto / Scan Akta Kelahiran resmi dari Disdukcapil"
              required={false}
            />

            <DualUploadInput
              label="5. Ijazah Terakhir / Surat Keterangan Lulus (SKL)"
              value={formData.diplomaUrl}
              onChange={(url) => setFormData({ ...formData, diplomaUrl: url })}
              description="Ijazah SD (untuk Paket B) atau Ijazah SMP (untuk Paket C)"
              required={false}
            />

            <DualUploadInput
              label="6. Pas Foto Formal Pendaftar"
              value={formData.avatarUrl}
              onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
              description="Foto formal setengah badan dengan latar belakang polos"
              required={false}
            />
          </div>
        </div>

        {/* SEKSI 6: PENGATURAN KATA SANDI AKUN (PASSWORD AKUN SISWA) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              6
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Pengaturan Kata Sandi Akun (Password Login)</h3>
              <p className="text-[11px] text-slate-500">
                Tentukan kata sandi akun Anda. Kata sandi ini akan Anda gunakan untuk masuk ke portal LMS, tugas, dan e-Rapor setelah pendaftaran disetujui Admin.
              </p>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Keamanan Akun & Integrasi Satu Alur (Single Flow)</span>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Akun Anda akan otomatis dibuatkan dan langsung siap digunakan begitu formulir pendaftaran diverifikasi & disetujui oleh Kepala Sekolah/Admin.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Kata Sandi Akun Siswa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi di atas"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs font-mono"
                  />
                </div>
              </div>
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
