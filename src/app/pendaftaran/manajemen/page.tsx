"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  GraduationCap,
  Briefcase,
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
  ShieldCheck,
} from "lucide-react";
import DualUploadInput from "@/components/DualUploadInput";
import { calculateDetailedAge } from "@/lib/public-registration-db";

export default function PendaftaranManajemenPage() {
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
    positionApplied: "Staf Administrasi & Tata Usaha",
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
          type: "MANAJEMEN",
          ...formData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(
          `/pendaftaran/sukses?no=${data.registration.registrationNumber}&name=${encodeURIComponent(data.registration.fullName)}&type=MANAJEMEN&program=${encodeURIComponent(formData.positionApplied)}`
        );
      } else {
        alert(data.error || "Gagal mengirimkan berkas lamaran staf");
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
      <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Rekrutmen Karyawan & Tenaga Kependidikan
          </span>
          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full text-[11px] font-bold">
            PKBM Askara Bandung
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Formulir Rekrutmen Staf Manajemen & Operasional
        </h1>
        <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Jadilah bagian dari tim operasional profesional PKBM Askara. Kami membuka kesempatan berkarier di bidang <strong>Tata Usaha</strong>, <strong>Operator Dapodik & IT</strong>, <strong>Keuangan & Akuntansi</strong>, serta <strong>Pengelola Program Vokasi</strong>.
        </p>

        {/* Jalur Pendaftaran Switcher */}
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
          <Link
            href="/pendaftaran/manajemen"
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            <span>Rekrutmen Karyawan / Staf</span>
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
        {/* SEKSI 1: POSISI & KUALIFIKASI */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">Posisi Lamaran & Kualifikasi Kerja</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Posisi / Divisi Yang Dilamar <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.positionApplied}
                onChange={(e) => setFormData({ ...formData, positionApplied: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs"
              >
                <option value="Staf Administrasi & Tata Usaha">Staf Administrasi & Tata Usaha (TU)</option>
                <option value="Operator Dapodik & IT Sekolah">Operator Dapodik & IT Sekolah (Sistem Informasi)</option>
                <option value="Staf Keuangan & Bendahara Lembaga">Staf Keuangan & Bendahara Lembaga</option>
                <option value="Koordinator Kurikulum & Asesmen">Koordinator Kurikulum & Asesmen (CBT)</option>
                <option value="Staf Humas & Kemitraan Industri">Staf Humas & Kemitraan Industri Vokasi</option>
                <option value="Staf Sarana & Prasarana">Staf Sarana & Prasarana Operasional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pendidikan Terakhir <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.lastEducation}
                onChange={(e) => setFormData({ ...formData, lastEducation: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 font-semibold shadow-2xs"
              >
                <option value="S1">Sarjana (S1)</option>
                <option value="D3">Diploma 3 (D3)</option>
                <option value="SMA/SMK">SMA / SMK Sederajat</option>
                <option value="S2">Magister (S2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Jurusan / Program Studi
              </label>
              <input
                type="text"
                placeholder="Contoh: Administrasi Perkantoran / Informatika"
                value={formData.majorStudy}
                onChange={(e) => setFormData({ ...formData, majorStudy: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pengalaman Kerja (Tahun)
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Keahlian Utama (Skills)
              </label>
              <input
                type="text"
                placeholder="Contoh: Dapodik, Ms Excel, Canva, Pembukuan"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* SEKSI 2: DATA DIRI & KONTAK */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Data Pribadi & Kontak Pelamar</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nama Lengkap & Gelar (Jika Ada) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Ihsan Fadilah, S.TP"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs placeholder:text-slate-400"
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
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Email Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="email.pelamar@gmail.com"
                value={formData.email}
                onBlur={() => handleCheckDuplicate("email")}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="Contoh: 085156560630"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                {liveAge !== "-" && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    Usia: {liveAge}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs font-semibold"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Alamat Domisili Lengkap
              </label>
              <input
                type="text"
                placeholder="Contoh: Jl. Adiflora Raya No. 08, Gedebage, Bandung"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* SEKSI 3: DUAL-OPTION UPLOAD BERKAS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              3
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Unggah Berkas Lamaran & Identitas</h3>
              <p className="text-[11px] text-slate-500">Pilih berkas dari perangkat atau ambil foto langsung menggunakan kamera</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DualUploadInput
              label="1. Curriculum Vitae (CV) & Surat Lamaran"
              value={formData.cvResumeUrl}
              onChange={(url) => setFormData({ ...formData, cvResumeUrl: url })}
              description="Format PDF / Word yang mencantumkan riwayat kerja"
              required={true}
            />

            <DualUploadInput
              label="2. KTP Asli"
              value={formData.ktpUrl}
              onChange={(url) => setFormData({ ...formData, ktpUrl: url })}
              description="Foto KTP yang jelas & tidak buram"
              required={true}
            />

            <DualUploadInput
              label="3. Ijazah Terakhir"
              value={formData.diplomaUrl}
              onChange={(url) => setFormData({ ...formData, diplomaUrl: url })}
              description="Scan / Foto Ijazah SMA/D3/S1"
              required={true}
            />

            <DualUploadInput
              label="4. Transkrip Nilai / SKHUN"
              value={formData.transcriptUrl}
              onChange={(url) => setFormData({ ...formData, transcriptUrl: url })}
              description="Transkrip nilai / sertifikat keahlian pendukung"
            />

            <div className="sm:col-span-2">
              <DualUploadInput
                label="5. Pas Foto Formal"
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
            Tim HRD & Manajemen PKBM Askara akan meninjau berkas lamaran Anda dalam 1-3 hari kerja.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirimkan Berkas...</span>
              </>
            ) : (
              <>
                <span>Kirim Berkas Lamaran Staf</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
