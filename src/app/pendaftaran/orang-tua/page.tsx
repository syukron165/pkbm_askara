"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
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
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Briefcase,
  HeartHandshake,
  Plus,
} from "lucide-react";
import DualUploadInput from "@/components/DualUploadInput";

interface RegisteredStudentOption {
  id: string;
  name: string;
  nisn?: string;
  packet: string;
  class?: string;
}

interface ChildFormEntry {
  id: string;
  selectionMode: "DROPDOWN" | "MANUAL";
  studentId?: string;
  studentName: string;
  studentNisn: string;
  studentPacket: "Paket A" | "Paket B" | "Paket C";
  studentClass: string;
}

export default function PendaftaranOrangTuaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ field: string; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Existing registered students list from database
  const [studentsList, setStudentsList] = useState<RegisteredStudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Multi-child state
  const [children, setChildren] = useState<ChildFormEntry[]>([
    {
      id: "child-1",
      selectionMode: "DROPDOWN",
      studentId: "",
      studentName: "",
      studentNisn: "",
      studentPacket: "Paket A",
      studentClass: "",
    },
  ]);

  const [formData, setFormData] = useState({
    fullName: "",
    relationship: "Ayah Kandung",
    nik: "",
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
    job: "",
    lastEducation: "SMA / Sederajat",
    parentIncome: 3000000,
    // Berkas URLs
    avatarUrl: "",
    ktpUrl: "",
    kkUrl: "",
  });

  // Fetch registered students from DB for dropdown selection
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const res = await fetch("/api/students");
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          const mapped: RegisteredStudentOption[] = json.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            nisn: s.nisn || "",
            packet: s.packet || "Paket C",
            class: s.class || "",
          }));
          setStudentsList(mapped);
        }
      } catch (err) {
        console.error("Error fetching students for parent form:", err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  const handleAddChild = () => {
    const newId = `child-${Date.now()}`;
    setChildren((prev) => [
      ...prev,
      {
        id: newId,
        selectionMode: "DROPDOWN",
        studentId: "",
        studentName: "",
        studentNisn: "",
        studentPacket: "Paket A",
        studentClass: "",
      },
    ]);
  };

  const handleRemoveChild = (childId: string) => {
    if (children.length <= 1) return;
    setChildren((prev) => prev.filter((c) => c.id !== childId));
  };

  const handleUpdateChild = (childId: string, updates: Partial<ChildFormEntry>) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, ...updates } : c))
    );
  };

  const handleSelectExistingStudent = (childId: string, studentId: string) => {
    const selected = studentsList.find((s) => s.id === studentId);
    if (selected) {
      handleUpdateChild(childId, {
        studentId: selected.id,
        studentName: selected.name,
        studentNisn: selected.nisn || "",
        studentPacket: (selected.packet as "Paket A" | "Paket B" | "Paket C") || "Paket A",
        studentClass: selected.class || "",
      });
    } else {
      handleUpdateChild(childId, {
        studentId: "",
        studentName: "",
        studentNisn: "",
        studentClass: "",
      });
    }
  };

  const handleCheckDuplicate = async (field: "nik" | "email") => {
    const val = formData[field]?.trim();
    if (!val || val.length < 6) return;

    try {
      const res = await fetch(`/api/pendaftaran/check-duplicate?${field}=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.duplicate) {
        setDuplicateWarning({ field, message: data.message });
      } else {
        if (duplicateWarning?.field === field) setDuplicateWarning(null);
      }
    } catch {
      // Ignored non-blocking
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      alert("Nama lengkap Orang Tua/Wali wajib diisi!");
      return;
    }
    if (!formData.phone.trim()) {
      alert("Nomor WhatsApp/HP aktif wajib diisi!");
      return;
    }

    // Validate children
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.studentName.trim()) {
        alert(`Nama lengkap siswa anak ke-${i + 1} wajib diisi atau dipilih dari data siswa!`);
        return;
      }
    }

    if (password && password.length < 6) {
      alert("Kata sandi minimal 6 karakter!");
      return;
    }
    if (password && password !== confirmPassword) {
      alert("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    setSubmitting(true);

    try {
      const childrenSummaryNames = children.map((c) => c.studentName.trim()).join(", ");
      const childrenSummaryNisns = children.map((c) => c.studentNisn.trim()).filter(Boolean).join(", ");
      const childrenSummaryPackets = Array.from(new Set(children.map((c) => c.studentPacket))).join(", ");
      const childrenSummaryClasses = children.map((c) => c.studentClass.trim()).filter(Boolean).join(", ");
      const childrenSummaryProgramText = children.map((c) => `${c.studentName.trim()} (${c.studentPacket})`).join(", ");

      const payload = {
        type: "ORANG_TUA",
        fullName: formData.fullName.trim(),
        nik: formData.nik.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        gender: formData.gender,
        birthPlace: formData.birthPlace.trim() || null,
        birthDate: formData.birthDate || null,
        address: formData.address.trim() || null,
        rtRw: formData.rtRw.trim() || null,
        kelurahan: formData.kelurahan.trim() || null,
        kecamatan: formData.kecamatan.trim() || null,
        city: formData.city.trim() || "Kota Bandung",
        province: formData.province.trim() || "Jawa Barat",
        postalCode: formData.postalCode.trim() || null,
        // Khusus Orang Tua
        positionApplied: formData.relationship, // e.g. "Ayah Kandung", "Ibu Kandung", "Wali Murid"
        parentJob: formData.job.trim() || null,
        lastEducation: formData.lastEducation,
        parentIncome: Number(formData.parentIncome) || 0,
        // Data Siswa (Multi-anak terintegrasi)
        parentName: childrenSummaryNames,
        nisn: childrenSummaryNisns || null,
        packetType: childrenSummaryPackets,
        currentGrade: childrenSummaryClasses || null,
        childrenData: JSON.stringify(children),
        // Berkas
        avatarUrl: formData.avatarUrl || null,
        ktpUrl: formData.ktpUrl || null,
        kkUrl: formData.kkUrl || null,
        parentKtpUrl: formData.ktpUrl || null,
        password: password || undefined,
      };

      const res = await fetch("/api/pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal mengirim formulir pendaftaran");
      }

      router.push(
        `/pendaftaran/sukses?no=${encodeURIComponent(result.registrationNumber || "")}&name=${encodeURIComponent(
          formData.fullName
        )}&type=ORANG_TUA&program=${encodeURIComponent(childrenSummaryProgramText || childrenSummaryPackets)}`
      );
    } catch (err: any) {
      alert("Pendaftaran Gagal: " + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider mb-4">
            <HeartHandshake className="w-4 h-4 text-indigo-400" />
            <span>Portal Orang Tua & Wali Murid</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Formulir Pendaftaran Akun Orang Tua / Wali
          </h1>

          <p className="mt-3 text-indigo-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Daftarkan diri Anda sebagai Orang Tua atau Wali Siswa resmi PKBM Askara. Akses portal pemantauan kehadiran presensi GPS/QR anak, materi tugas, perkembangan nilai rapor, dan informasi administrasi/keuangan secara transparan.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-indigo-800/60 text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pemantauan Presensi Real-Time</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Transparansi Nilai & e-Rapor</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Informasi Keuangan & SPP</span>
            </div>
          </div>
        </div>
      </div>

      {duplicateWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Peringatan Duplikasi Data: </span>
            <span>{duplicateWarning.message}</span>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BAGIAN 1: IDENTITAS ORANG TUA / WALI */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                1. Data Identitas Orang Tua / Wali
              </h2>
              <p className="text-xs text-slate-500">
                Lengkapi informasi biodata resmi sesuai Kartu Tanda Penduduk (KTP)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap Orang Tua / Wali <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Hendra Gunawan, S.E."
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hubungan dengan Siswa <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Ayah Kandung">Ayah Kandung</option>
                <option value="Ibu Kandung">Ibu Kandung</option>
                <option value="Wali Murid / Kerabat">Wali Murid / Kerabat</option>
                <option value="Kakek / Nenek">Kakek / Nenek</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NIK KTP Orang Tua (16 Digit)
              </label>
              <input
                type="text"
                maxLength={16}
                placeholder="3273xxxxxxxxxxxx"
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, "") })}
                onBlur={() => handleCheckDuplicate("nik")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Digunakan untuk menerima notifikasi presensi & laporan belajar anak</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Email (Login Portal Orang Tua)
              </label>
              <input
                type="email"
                placeholder="namaorangtua@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                onBlur={() => handleCheckDuplicate("email")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tempat Lahir
              </label>
              <input
                type="text"
                placeholder="Kota Bandung"
                value={formData.birthPlace}
                onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Password Credentials */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi Portal Orang Tua
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm pr-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Konfirmasi Kata Sandi
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ulangi kata sandi di atas"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 2: DATA PUTRA / PUTRI (SISWA YANG DIASUH - MULTI-ANAK & DROPDOWN) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  2. Data Putra / Putri (Siswa PKBM Askara)
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih dari data siswa yang sudah terdaftar di sistem atau masukkan data baru.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddChild}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Anak Lainnya</span>
            </button>
          </div>

          <div className="space-y-6">
            {children.map((child, idx) => (
              <div
                key={child.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 transition hover:border-emerald-300"
              >
                {/* Child Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-2xs">
                      Anak Ke-{idx + 1}
                    </span>
                    {child.studentName && (
                      <span className="font-bold text-xs text-slate-800">
                        {child.studentName} ({child.studentPacket})
                      </span>
                    )}
                  </div>

                  {children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChild(child.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition"
                    >
                      Hapus Anak Ini
                    </button>
                  )}
                </div>

                {/* Selection Mode Switcher */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateChild(child.id, { selectionMode: "DROPDOWN" })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      child.selectionMode === "DROPDOWN"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🔍 Pilih dari Siswa Terdaftar ({studentsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateChild(child.id, { selectionMode: "MANUAL", studentId: "" })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      child.selectionMode === "MANUAL"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ✍️ Input Data Siswa Baru
                  </button>
                </div>

                {/* Dropdown Mode */}
                {child.selectionMode === "DROPDOWN" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Pilih Nama Siswa dari Database PKBM Askara <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={child.studentId || ""}
                        onChange={(e) => handleSelectExistingStudent(child.id, e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="">-- Cari / Pilih Siswa Terdaftar di PKBM Askara --</option>
                        {studentsList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {s.packet} {s.class ? `(${s.class})` : ""} {s.nisn ? `[NISN: ${s.nisn}]` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {child.studentName ? (
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Nama Siswa Terpilih:</span>
                          <span className="font-bold text-emerald-900">{child.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Jenjang Program:</span>
                          <span className="font-bold text-slate-900">{child.studentPacket}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">NISN / Nomor Induk:</span>
                          <span className="font-mono text-slate-800">{child.studentNisn || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rombel / Kelas:</span>
                          <span className="text-slate-800">{child.studentClass || "Reguler Askara"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Pilih siswa di atas untuk menghubungkan profil anak secara instan.
                      </p>
                    )}
                  </div>
                ) : (
                  /* Manual Mode */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nama Lengkap Siswa / Anak <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Muhammad Rizki Pratama"
                        value={child.studentName}
                        onChange={(e) => handleUpdateChild(child.id, { studentName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Jenjang Paket Siswa <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={child.studentPacket}
                        onChange={(e) =>
                          handleUpdateChild(child.id, {
                            studentPacket: e.target.value as "Paket A" | "Paket B" | "Paket C",
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Paket A">Paket A (Setara SD)</option>
                        <option value="Paket B">Paket B (Setara SMP)</option>
                        <option value="Paket C">Paket C (Setara SMA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        NISN / NIK Siswa (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="NISN / NIK jika sudah ada"
                        value={child.studentNisn}
                        onChange={(e) => handleUpdateChild(child.id, { studentNisn: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Kelas / Rombel Siswa (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Paket A - Kelas V / Paket C - Kelas X (Kosongkan bila belum tahu)"
                        value={child.studentClass}
                        onChange={(e) => handleUpdateChild(child.id, { studentClass: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddChild}
              className="w-full py-3 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-dashed border-slate-300 rounded-2xl text-xs font-bold text-slate-700 hover:text-emerald-800 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>+ Tambah Anak / Siswa Lainnya (Jika memiliki lebih dari 1 anak di PKBM Askara)</span>
            </button>
          </div>
        </div>

        {/* BAGIAN 3: PROFIL PEKERJAAN & DOMISILI */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                3. Pekerjaan & Domisili Tempat Tinggal
              </h2>
              <p className="text-xs text-slate-500">
                Informasi latar belakang dan alamat domisili keluarga
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pekerjaan / Profesi
              </label>
              <input
                type="text"
                placeholder="Contoh: Wiraswasta / Karyawan Swasta / PNS"
                value={formData.job}
                onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pendidikan Terakhir
              </label>
              <select
                value={formData.lastEducation}
                onChange={(e) => setFormData({ ...formData, lastEducation: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="SD / Sederajat">SD / Sederajat</option>
                <option value="SMP / Sederajat">SMP / Sederajat</option>
                <option value="SMA / Sederajat">SMA / Sederajat</option>
                <option value="Diploma (D3)">Diploma (D3)</option>
                <option value="Sarjana (S1)">Sarjana (S1)</option>
                <option value="Magister (S2)">Magister (S2)</option>
                <option value="Doktor (S3)">Doktor (S3)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Lengkap Domisili
              </label>
              <textarea
                rows={2}
                placeholder="Jl. / Gang, Nomor Rumah, RT/RW"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kota / Kabupaten</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Provinsi</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 4: UNGGAH DOKUMEN PENDUKUNG (OPSIONAL) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                4. Dokumen Pendukung (Opsional)
              </h2>
              <p className="text-xs text-slate-500">
                Unggah foto KTP Orang Tua & Kartu Keluarga untuk verifikasi administrasi resmi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DualUploadInput
              label="Foto KTP Orang Tua / Wali"
              value={formData.ktpUrl}
              onChange={(url) => setFormData({ ...formData, ktpUrl: url })}
              folder="pendaftaran"
            />
            <DualUploadInput
              label="Foto Kartu Keluarga (KK)"
              value={formData.kkUrl}
              onChange={(url) => setFormData({ ...formData, kkUrl: url })}
              folder="pendaftaran"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="flex items-start gap-3 text-left">
            <input type="checkbox" required id="agree" className="mt-1 rounded-sm text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="agree" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
              Saya menyatakan bahwa data yang saya isi adalah benar dan sah. Saya bersedia mendampingi putra/putri saya dalam proses belajar dan mematuhi seluruh tata tertib di <strong>PKBM Askara</strong>.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-indigo-900/20 transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mengirim Pendaftaran Orang Tua...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Kirim Formulir Pendaftaran Orang Tua</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
