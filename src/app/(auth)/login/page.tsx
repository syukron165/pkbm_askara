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
  Building,
  Wallet,
  Layers,
  ArrowUpRight,
  UserPlus,
  BookOpen,
} from "lucide-react";

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
    description: "Kelola master data PKBM, rombel kelas, kurikulum, aset, kalender, dan verifikasi pendaftar.",
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

  const [selectedRole, setSelectedRole] = useState<SelectedRole>("siswa");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

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
          selectedRole: selectedRole,
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
                  Peran Pengguna
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
            <span>Autentikasi Aman & Single-Flow Verifikasi</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Terhubung Langsung dengan Rapor & Presensi GPS</span>
          </div>
        </div>
      </div>

      {/* Right Side: Sign In Form & Official Registration Portals */}
      <div className="lg:col-span-8 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-white">
        <div>
          {/* Top Header */}
          <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Masuk ke Akun Resmi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Portal masuk resmi bagi Siswa Aktif, Guru / Tutor, Orang Tua, dan Manajemen PKBM.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold shrink-0 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Akun Terverifikasi</span>
            </div>
          </div>

          {/* Role Selector Tabs */}
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
                      if (!signInEmail) {
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

          {/* Error & Success Feedback Alerts */}
          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <strong>Gagal Masuk: </strong>
                {error}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 font-semibold">{successMsg}</div>
            </div>
          )}

          {/* Official Sign In Form */}
          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Alamat Email Akun Terdaftar
                </label>
                {activeRoleMeta.defaultEmail && (
                  <button
                    type="button"
                    onClick={() => setSignInEmail(activeRoleMeta.defaultEmail)}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
                  >
                    Gunakan Email Demo ({activeRoleMeta.defaultEmail})
                  </button>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder={`Contoh: ${activeRoleMeta.defaultEmail}`}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Kata Sandi (Password)
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type={showSignInPassword ? "text" : "password"}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun Anda"
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showSignInPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <span>{isLoading ? "Memverifikasi Kredensial..." : `Masuk sebagai ${activeRoleMeta.title}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* BOTTOM SECTION: Single Flow Registration Gateways */}
        <div className="mt-8 pt-5 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>Belum Memiliki Akun Resmi PKBM Askara?</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Pintu Masuk Terpadu</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Sesuai kebijakan integrasi satu alur (<em>single flow</em>), seluruh pendaftar baru wajib melalui portal administrasi resmi. Akun akan otomatis dibuatkan dan dapat login setelah disetujui (<em>approved</em>) oleh pihak sekolah.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            <Link
              href="/pendaftaran/siswa"
              className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left transition group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  PPDB Online
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                Daftar Siswa Baru
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Paket A, B, C & Kursus</p>
            </Link>

            <Link
              href="/pendaftaran/orang-tua"
              className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-2xl text-left transition group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Wali Murid
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 transition" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-amber-900">
                Pendaftaran Orang Tua
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Monitoring & Rapor Anak</p>
            </Link>

            <Link
              href="/pendaftaran/tutor"
              className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left transition group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Rekrutmen
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-700 transition" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                Pendaftaran Tutor
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Pendidik & Guru Modul</p>
            </Link>

            <Link
              href="/pendaftaran/manajemen"
              className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-2xl text-left transition group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                  Staf / TU
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 transition" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                Pendaftaran Staf
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Administrasi & Manajemen</p>
            </Link>
          </div>
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
