import React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  BookMarked,
  BookOpen,
  FileCheck,
  Award,
  Library,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const modules = [
    {
      title: "Presensi GPS & QR Code",
      desc: "Pencatatan kehadiran harian peserta didik & pendidik dengan validasi radius lokasi GPS dan QR Code real-time.",
      icon: CalendarCheck,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      title: "Jurnal Mengajar Harian",
      desc: "Dokumentasi materi ajar, catatan kelas, dan rekap partisipasi siswa yang dapat langsung dipantau manajemen.",
      icon: BookMarked,
      color: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      title: "LMS (Materi & Tugas)",
      desc: "Unggah modul digital, penugasan mandiri terstruktur dengan tenggat waktu, serta penilaian dan umpan balik guru.",
      icon: BookOpen,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "Asesmen & CBT Online",
      desc: "Ujian berbasis komputer dengan bank soal objektif/esai, timer otomatis, dan sistem penilaian instan yang aman.",
      icon: FileCheck,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      title: "Penerbitan e-Rapor Otomatis",
      desc: "Agregasi otomatis dari data presensi, nilai tugas LMS, dan ujian CBT menjadi format rapor digital resmi siap cetak PDF.",
      icon: Award,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      title: "Pustaka Digital Terbuka",
      desc: "Akses modul kurikulum Paket A, B, C, modul keterampilan vokasi, dan materi pengayaan secara terpusat.",
      icon: Library,
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="PKBM Askara"
              style={{ height: "44px", width: "auto", maxHeight: "44px" }}
              className="h-11 max-h-11 w-auto object-contain"
            />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <span>Masuk ke Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-12 lg:py-20 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sistem Informasi Terpadu Versi 1.0</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Transformasi Digital Pembelajaran & Manajemen <span className="text-emerald-700">PKBM Askara</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Platform digital terpadu untuk mendigitalkan presensi GPS/QR, jurnal mengajar tutor, kelas daring (LMS), asesmen CBT, hingga penerbitan e-Rapor otomatis.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition shadow-soft flex items-center space-x-2"
          >
            <span>Buka Sistem & Masuk Akun</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Feature Modules Grid */}
      <section className="px-6 py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-slate-900">
              Modul Terintegrasi PKBM Askara
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Dirancang khusus untuk mendukung operasional pendidikan non-formal (Paket A, Paket B, dan Paket C)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-200 shadow-soft hover-lift transition"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${mod.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Sistem Informasi PKBM Askara. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex items-center space-x-6 text-slate-400">
            <span>Paket A (Setara SD)</span>
            <span>Paket B (Setara SMP)</span>
            <span>Paket C (Setara SMA)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
