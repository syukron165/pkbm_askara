import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Phone, Mail, MapPin } from "lucide-react";

export const metadata = {
  title: "Pendaftaran Mandiri & SPMB Online • PKBM Askara Kota Bandung",
  description: "Formulir Pendaftaran Siswa Baru (Paket A, B, C), Rekrutmen Tutor, dan Rekrutmen Tenaga Kependidikan PKBM Askara Gedebage Bandung.",
};

export default function PendaftaranPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="PKBM Askara"
              className="h-10 w-auto object-contain transition group-hover:scale-105"
            />
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 block tracking-tight">
                PKBM ASKARA
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                Portal Penerimaan & Rekrutmen Mandiri Resmi
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-800 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition shadow-2xs"
            >
              Masuk Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-600">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-slate-900">PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) ASKARA</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              NPSN: P9998766 • Izin Operasional: 0019/IPSPNFI/IX/2022/DPMTSP
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Jl. Adiflora Raya No. 08, Rancabolang, Gedebage, Kota Bandung - Jawa Barat
            </p>
          </div>
          <div className="text-xs space-y-1">
            <p className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-700">
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>(022) 875 18584 / 085156560630</span>
            </p>
            <p className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-700">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>pkbm.askara@gmail.com</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
