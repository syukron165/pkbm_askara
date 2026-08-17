"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Users,
  HeartHandshake,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Phone,
  Building,
  Wallet,
  BookOpen,
  MapPin,
  Briefcase,
  UserCheck,
  Layers,
} from "lucide-react";

type AuthMode = "signin" | "signup";
type SelectedRole = "siswa" | "orang_tua" | "pendidik" | "admin" | "bendahara";

interface RoleMeta {
  id: SelectedRole;
  title: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
  defaultEmail: string;
}

const ROLES: RoleMeta[] = [
  {
    id: "siswa",
    title: "Peserta Didik (Siswa)",
    shortLabel: "Siswa",
    icon: GraduationCap,
    color: "indigo",
    badgeBg: "bg-indigo-50",
    badgeBorder: "border-indigo-200",
    badgeText: "text-indigo-700",
    description: "Akses materi LMS, tugas mandiri, CBT ujian online, dan e-Rapor digital.",
    defaultEmail: "siswa@askara.sch.id",
  },
  {
    id: "orang_tua",
    title: "Orang Tua / Wali",
    shortLabel: "Orang Tua",
    icon: HeartHandshake,
    color: "amber",
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-200",
    badgeText: "text-amber-700",
    description: "Pantau kehadiran presensi GPS anak, tagihan SPP, nilai rapor, dan konsultasi.",
    defaultEmail: "orangtua@askara.sch.id",
  },
  {
    id: "pendidik",
    title: "Pendidik / Tutor Guru",
    shortLabel: "Pendidik",
    icon: Users,
    color: "emerald",
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-200",
    badgeText: "text-emerald-700",
    description: "Kelola jurnal mengajar, presensi kelas, materi modul, bank soal CBT, dan penilaian rapor.",
    defaultEmail: "guru@askara.sch.id",
  },
  {
    id: "admin",
    title: "Staf Manajemen & Admin",
    shortLabel: "Manajemen",
    icon: Building,
    color: "blue",
    badgeBg: "bg-blue-50",
    badgeBorder: "border-blue-200",
    badgeText: "text-blue-700",
    description: "Kelola master data PKBM, rombel kelas, kurikulum, aset, kalender, dan buku tamu.",
    defaultEmail: "admin@askara.sch.id",
  },
  {
    id: "bendahara",
    title: "Bendahara & Keuangan",
    shortLabel: "Bendahara",
    icon: Wallet,
    color: "teal",
    badgeBg: "bg-teal-50",
    badgeBorder: "border-teal-200",
    badgeText: "text-teal-700",
    description: "Monitoring SPP, kas masuk/keluar, verifikasi pengajuan anggaran, dan laporan keuangan.",
    defaultEmail: "admin@askara.sch.id",
  },
];

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  // Mode state: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [selectedRole, setSelectedRole] = useState<SelectedRole>("siswa");

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up Form States
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Siswa
    packetType: "Paket C",
    nisn: "",
    nik: "",
    gender: "L",
    birthPlace: "",
    birthDate: "",
    address: "",
    // Orang Tua
    relationship: "AYAH",
    job: "",
    childNisn: "",
    // Pendidik
    nip: "",
    specialization: "",
    // Admin / Bendahara
    department: "",
    position: "",
    agreeTerms: true,
  });

  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeRoleMeta = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signInEmail,
          password: signInPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan login");
      }

      setSuccessMsg("Berhasil masuk! Mengalihkan ke dashboard...");
      const targetUrl = redirect || data.redirectUrl || "/";
      setTimeout(() => {
        router.push(targetUrl);
        router.refresh();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat masuk");
      setIsLoading(false);
    }
  };

  // Handle Register submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validation
    if (!signUpData.name || !signUpData.email || !signUpData.password) {
      setError("Nama lengkap, email, dan kata sandi wajib diisi");
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok dengan kata sandi");
      return;
    }

    if (signUpData.password.length < 6) {
      setError("Kata sandi minimal harus terdiri dari 6 karakter");
      return;
    }

    if (!signUpData.agreeTerms) {
      setError("Anda harus menyetujui Syarat & Ketentuan untuk melanjutkan pendaftaran");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        role: selectedRole,
        name: signUpData.name,
        email: signUpData.email,
        phone: signUpData.phone,
        password: signUpData.password,
        // Siswa
        packetType: signUpData.packetType,
        nisn: signUpData.nisn,
        nik: signUpData.nik,
        gender: signUpData.gender,
        birthPlace: signUpData.birthPlace,
        birthDate: signUpData.birthDate,
        address: signUpData.address,
        // Orang Tua
        relationship: signUpData.relationship,
        job: signUpData.job,
        childNisn: signUpData.childNisn,
        // Pendidik
        nip: signUpData.nip,
        specialization: signUpData.specialization,
        // Admin / Bendahara
        department: signUpData.department,
        position: signUpData.position,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan pendaftaran akun");
      }

      setSuccessMsg(data.message || "Pendaftaran akun berhasil! Masuk ke sistem...");
      const targetUrl = data.redirectUrl || "/";
      setTimeout(() => {
        router.push(targetUrl);
        router.refresh();
      }, 900);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mendaftar");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
      {/* Left Side: Brand Story & Values */}
      <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-6">
            <img
              src="/logo-dark.png"
              alt="PKBM Askara"
              style={{ height: "46px", width: "auto", maxHeight: "46px" }}
              className="h-11 max-h-11 w-auto object-contain rounded drop-shadow"
            />
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-[11px] font-semibold text-emerald-300 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Sistem Informasi Terpadu & Terakreditasi</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
            Pusat Kegiatan Belajar Masyarakat Aksara
          </h2>
          <p className="mt-3 text-slate-300 text-xs leading-relaxed">
            Menyediakan kesetaraan akses pendidikan non-formal (Paket A, B, C), vokasi praktis, LMS interaktif, CBT mandiri, dan e-Rapor terintegrasi.
          </p>

          {/* Dynamic Role Info Card on Left */}
          <div className="mt-6 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-left">
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-xl bg-emerald-600/30 border border-emerald-400/30 text-emerald-300">
                <activeRoleMeta.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Peran Terpilih
                </p>
                <p className="text-xs font-bold text-white">{activeRoleMeta.title}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {activeRoleMeta.description}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5 relative z-10">
          <div className="flex items-center space-x-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Autentikasi Aman & RBAC Multi-Role</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sinkronisasi Data Otomatis & Presensi GPS</span>
          </div>
        </div>
      </div>

      {/* Right Side: Sign In / Sign Up Form */}
      <div className="lg:col-span-8 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-white">
        <div>
          {/* Top Header & Main Mode Tabs (Sign In vs Sign Up) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {authMode === "signin" ? "Masuk ke Akun Anda" : "Pendaftaran Akun Baru"}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                {authMode === "signin"
                  ? "Silakan masukkan kredensial Anda untuk melanjutkan"
                  : "Lengkapi data di bawah untuk mendaftar akun baru"}
              </p>
            </div>

            {/* Tab Pill Switcher */}
            <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
                  authMode === "signin"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Masuk (Sign In)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
                  authMode === "signup"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Daftar (Sign Up)</span>
              </button>
            </div>
          </div>

          {/* Role Selector Tabs (Active for both Sign In & Sign Up) */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilih Peran Pengguna (Role):</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-700">
                {activeRoleMeta.title}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.id);
                      if (authMode === "signin" && !signInEmail) {
                        setSignInEmail(r.defaultEmail);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 relative ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/80 shadow-sm ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={`p-1.5 rounded-xl ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200/80 text-slate-700"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold leading-tight ${
                          isSelected ? "text-emerald-950" : "text-slate-800"
                        }`}
                      >
                        {r.shortLabel}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight truncate">
                        {r.id === "siswa"
                          ? "Paket A/B/C"
                          : r.id === "orang_tua"
                          ? "Wali Murid"
                          : r.id === "pendidik"
                          ? "Tutor Guru"
                          : r.id === "admin"
                          ? "Manajemen"
                          : "Keuangan"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB CONTENT: SIGN IN FORM */}
          {/* ============================================================ */}
          {authMode === "signin" ? (
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="nama@askara.sch.id"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi
                  </label>
                  <span className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer">
                    Lupa sandi?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showSignInPassword ? "text" : "password"}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showSignInPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <span>{isLoading ? "Memproses Masuk..." : "Masuk ke Sistem"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ============================================================ */
            /* TAB CONTENT: SIGN UP (REGISTER) FORM */
            /* ============================================================ */
            <form onSubmit={handleRegister} className="mt-5 space-y-4">
              {/* Role Context Notification */}
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${activeRoleMeta.badgeBg} ${activeRoleMeta.badgeBorder}`}>
                <div className="flex items-center space-x-2">
                  <activeRoleMeta.icon className={`w-4 h-4 ${activeRoleMeta.badgeText}`} />
                  <span className={`font-semibold ${activeRoleMeta.badgeText}`}>
                    Mendaftar sebagai: <strong>{activeRoleMeta.title}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Formulir Khusus</span>
              </div>

              {/* General Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={signUpData.name}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, name: e.target.value })
                      }
                      placeholder={
                        selectedRole === "pendidik"
                          ? "Nurul Aini, S.Pd."
                          : selectedRole === "orang_tua"
                          ? "Budi Santoso (Orang Tua)"
                          : "Nama Lengkap Anda"
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={signUpData.phone}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, phone: e.target.value })
                      }
                      placeholder="0812-3456-7890"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Email Aktif <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={signUpData.email}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, email: e.target.value })
                      }
                      placeholder="nama@email.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* ROLE SPECIFIC FIELDS */}

              {/* 1. SISWA SPECIFIC FIELDS */}
              {selectedRole === "siswa" && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                  <p className="text-[11px] font-bold text-indigo-900 flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Data Profil Peserta Didik:</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Jenjang Program
                      </label>
                      <select
                        value={signUpData.packetType}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, packetType: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                      >
                        <option value="Paket A">Paket A (Setara SD)</option>
                        <option value="Paket B">Paket B (Setara SMP)</option>
                        <option value="Paket C">Paket C (Setara SMA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={signUpData.gender}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, gender: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        NISN (Opsional)
                      </label>
                      <input
                        type="text"
                        value={signUpData.nisn}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, nisn: e.target.value })
                        }
                        placeholder="Contoh: 0081294812"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={signUpData.birthDate}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, birthDate: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Alamat Domisili
                      </label>
                      <input
                        type="text"
                        value={signUpData.address}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, address: e.target.value })
                        }
                        placeholder="Kelurahan, Kota / Kabupaten"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ORANG TUA SPECIFIC FIELDS */}
              {selectedRole === "orang_tua" && (
                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
                  <p className="text-[11px] font-bold text-amber-900 flex items-center space-x-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                    <span>Data Profil Orang Tua / Wali:</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Hubungan Keluarga
                      </label>
                      <select
                        value={signUpData.relationship}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, relationship: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                      >
                        <option value="AYAH">Ayah Kandung</option>
                        <option value="IBU">Ibu Kandung</option>
                        <option value="WALI">Wali Murid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Pekerjaan
                      </label>
                      <input
                        type="text"
                        value={signUpData.job}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, job: e.target.value })
                        }
                        placeholder="Contoh: Wiraswasta, PNS, Karyawan"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        NISN Siswa Didampingi (Opsional)
                      </label>
                      <input
                        type="text"
                        value={signUpData.childNisn}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, childNisn: e.target.value })
                        }
                        placeholder="NISN anak untuk auto-link"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PENDIDIK / GURU SPECIFIC FIELDS */}
              {selectedRole === "pendidik" && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                  <p className="text-[11px] font-bold text-emerald-900 flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Data Profil Pendidik / Tutor:</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mata Pelajaran / Bidang Keahlian <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={signUpData.specialization}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, specialization: e.target.value })
                        }
                        placeholder="Contoh: Matematika, Bahasa Inggris, Desain Grafis"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        NIP / NUPTK (Opsional)
                      </label>
                      <input
                        type="text"
                        value={signUpData.nip}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, nip: e.target.value })
                        }
                        placeholder="Nomor Induk Pendidik"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ADMIN & BENDAHARA SPECIFIC FIELDS */}
              {(selectedRole === "admin" || selectedRole === "bendahara") && (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                  <p className="text-[11px] font-bold text-blue-900 flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Informasi Bidang Manajemen & Operasional:</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Bagian / Departemen
                      </label>
                      <input
                        type="text"
                        value={signUpData.department}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, department: e.target.value })
                        }
                        placeholder={
                          selectedRole === "bendahara"
                            ? "Keuangan & Tata Usaha"
                            : "Kurikulum & Kesiswaan"
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Jabatan Struktural
                      </label>
                      <input
                        type="text"
                        value={signUpData.position}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, position: e.target.value })
                        }
                        placeholder={
                          selectedRole === "bendahara"
                            ? "Bendahara PKBM"
                            : "Staf Administrasi"
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      value={signUpData.password}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, password: e.target.value })
                      }
                      placeholder="Min. 6 karakter"
                      className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showSignUpPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      value={signUpData.confirmPassword}
                      onChange={(e) =>
                        setSignUpData({
                          ...signUpData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <div className="flex items-start space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={signUpData.agreeTerms}
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, agreeTerms: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-[11px] text-slate-600 leading-tight cursor-pointer"
                >
                  Saya menyatakan bahwa data yang diisi adalah benar dan menyetujui{" "}
                  <span className="text-emerald-700 font-bold hover:underline">
                    Syarat & Ketentuan
                  </span>{" "}
                  PKBM Askara.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <span>{isLoading ? "Mendaftarkan Akun..." : "Daftar Akun Baru"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* BOTTOM SECTION: Signup Link */}
        <div className="mt-8 pt-5 border-t border-slate-100">
          {authMode === "signin" ? (
            <div>

              <div className="mt-4 text-center">
                <p className="text-xs text-slate-600">
                  Belum memiliki akun PKBM?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Daftar akun baru di sini
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-1">
              <p className="text-xs text-slate-600">
                Sudah memiliki akun terdaftar?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Masuk ke akun Anda sekarang
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-500 font-medium">
            Memuat formulir autentikasi...
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}
