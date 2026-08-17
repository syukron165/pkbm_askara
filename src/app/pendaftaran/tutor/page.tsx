"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
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
  Loader2,
  Send,
  Award,
} from "lucide-react";
import DualUploadInput from "@/components/DualUploadInput";
import { calculateDetailedAge } from "@/lib/public-registration-db";

export default function PendaftaranTutorPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ field: string; message: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    nik: "",
    email: "",
    phone: "",
    gender: "L",
    birthPlace: "",
    birthDate: "",
    address: "",
    city: "Kota Bandung",
    province: "Jawa Barat",
    positionApplied: "Tutor Mata Pelajaran Umum & Kesetaraan",
    lastEducation: "S1",
    majorStudy: "",
    experienceYears: 1,
    skills: "",
    linkedinUrl: "",
    // Berkas URLs
    avatarUrl: "",
    ktpUrl: "",
    diplomaUrl: "",
    transcriptUrl: "",
    cvResumeUrl: "",
  });

  const liveAge = calculateDetailedAge(formData.birthDate);

  const handleCheckDuplicate = async (field: "nik" | "email") => {
    const val = formData[field]?.trim();
    if (!val || val.length < 6) return;

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

    try {
      setSubmitting(true);
      const res = await fetch("/api/pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TUTOR",
          ...formData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(
          `/pendaftaran/sukses?no=${data.registration.registrationNumber}&name=${encodeURIComponent(data.registration.fullName)}&type=TUTOR&program=${encodeURIComponent(formData.positionApplied)}`
        );
      } else {
        alert(data.error || "Gagal mengirimkan berkas lamaran tutor");
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
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-3xl p-6 sm:p-8 border border-blue-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-blue-600" />
            Rekrutmen Tutor & Tenaga Pendidik
          </span>
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
            PKBM Askara Bandung
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Formulir Rekrutmen Tutor & Pendidik Kesetaraan
        </h1>
        <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Bergabunglah bersama keluarga besar pendidik PKBM Askara. Kami mencari tutor berdedikasi tinggi, kreatif dalam pengajaran kurikulum merdeka, serta memiliki semangat mengabdi untuk memajukan pendidikan non-formal.
        </p>

        {/* Jalur Pendaftaran Switcher */}
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
          <Link
            href="/pendaftaran/tutor"
            className="px-3.5 py-2 bg-blue-600 text-white rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Briefcase className="w-4 h-4" />
            <span>Rekrutmen Tutor / Guru</span>
          </Link>
        </div>
      </div>

      {duplicateWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs animate-in fade-in shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">Peringatan:</span>
            <span className="text-slate-700">{duplicateWarning.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm text-slate-800">
        {/* SEKSI 1: POSISI & LATAR BELAKANG PENDIDIKAN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">Posisi Pengajaran & Kualifikasi Akademik</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Bidang Studi / Mata Pelajaran Yang Dilamar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Tutor Bahasa Inggris / Matematika / Vokasi Desain Grafis"
                value={formData.positionApplied}
                onChange={(e) => setFormData({ ...formData, positionApplied: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pendidikan Terakhir <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.lastEducation}
                onChange={(e) => setFormData({ ...formData, lastEducation: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold shadow-2xs"
              >
                <option value="S1">Sarjana (S1)</option>
                <option value="S2">Magister (S2)</option>
                <option value="D3">Diploma 3 (D3)</option>
                <option value="SMA/SMK">SMA / SMK (Praktisi Vokasi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Program Studi / Jurusan
              </label>
              <input
                type="text"
                placeholder="Contoh: Pendidikan Bahasa Inggris"
                value={formData.majorStudy}
                onChange={(e) => setFormData({ ...formData, majorStudy: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pengalaman Mengajar (Tahun)
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Profil LinkedIn / Portofolio (Opsional)
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* SEKSI 2: DATA PRIBADI & KONTAK */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Data Pribadi & Kontak Pendidik</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nama Lengkap & Gelar Akademik <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Susanti Kartikasari, S.Pd."
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nomor Induk Kependudukan (NIK KTP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={16}
                placeholder="16 Digit NIK KTP"
                value={formData.nik}
                onBlur={() => handleCheckDuplicate("nik")}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, "") })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Email Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="email.tutor@gmail.com"
                value={formData.email}
                onBlur={() => handleCheckDuplicate("email")}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs font-medium"
                required
              />
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
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                {liveAge !== "-" && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    Usia: {liveAge}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs font-semibold"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Alamat Domisili Tempat Tinggal
              </label>
              <input
                type="text"
                placeholder="Contoh: Jl. Soekarno Hatta No. 420, Bandung"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* SEKSI 3: DUAL-OPTION UPLOAD BERKAS LAMARAN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              3
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Unggah Berkas Lamaran & Portofolio</h3>
              <p className="text-[11px] text-slate-500">Pilih berkas dari perangkat atau ambil foto langsung menggunakan kamera</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DualUploadInput
              label="1. Curriculum Vitae (CV) / Portofolio Pengajaran"
              value={formData.cvResumeUrl}
              onChange={(url) => setFormData({ ...formData, cvResumeUrl: url })}
              description="Format PDF / Word yang mencantumkan riwayat mengajar"
              required={true}
            />

            <DualUploadInput
              label="2. KTP Asli"
              value={formData.ktpUrl}
              onChange={(url) => setFormData({ ...formData, ktpUrl: url })}
              description="Foto KTP yang jelas & terbaca"
              required={true}
            />

            <DualUploadInput
              label="3. Ijazah Terakhir"
              value={formData.diplomaUrl}
              onChange={(url) => setFormData({ ...formData, diplomaUrl: url })}
              description="Scan / Foto Ijazah S1/S2"
              required={true}
            />

            <DualUploadInput
              label="4. Transkrip Nilai Akademik"
              value={formData.transcriptUrl}
              onChange={(url) => setFormData({ ...formData, transcriptUrl: url })}
              description="Transkrip nilai jenjang terakhir"
            />

            <div className="sm:col-span-2">
              <DualUploadInput
                label="5. Pas Foto Formal Pendidik"
                value={formData.avatarUrl}
                onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
                description="Foto formal setengah badan dengan pakaian rapi"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            Data lamaran Anda akan segera ditinjau oleh Tim Manajemen PKBM Askara.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirimkan Berkas...</span>
              </>
            ) : (
              <>
                <span>Kirim Berkas Lamaran Tutor</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
