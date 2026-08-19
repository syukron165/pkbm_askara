"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Printer,
  Home,
  Phone,
  FileCheck,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";

function SuksesContent() {
  const searchParams = useSearchParams();
  const regNo = searchParams.get("no") || "REG-2026-0001";
  const name = searchParams.get("name") || "Calon Pendaftar";
  const type = (searchParams.get("type") || "SISWA").toUpperCase();
  const program = searchParams.get("program") || (type === "ORANG_TUA" ? "Wali Santri / Siswa PKBM" : "Paket C (Setara SMA)");

  const resolveTypeName = (t: string) => {
    switch (t) {
      case "ORANG_TUA":
        return "Orang Tua / Wali Murid";
      case "TUTOR":
        return "Tutor / Pendidik";
      case "MANAJEMEN":
        return "Karyawan / Staf Manajemen";
      case "SISWA":
      default:
        return "Siswa Baru (SPMB)";
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Success Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6 text-slate-800 relative overflow-hidden">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
            Pendaftaran Berhasil Terkirim
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Terima Kasih, {name}!
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Berkas pendaftaran Anda telah masuk ke sistem antrean verifikasi panitia PKBM Askara.
          </p>
        </div>

        {/* Registration Number Box */}
        <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Nomor Registrasi</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">
              STATUS: PENDING REVIEW
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-indigo-700">
            {regNo}
          </p>
          <div className="pt-2.5 border-t border-indigo-200/80 text-xs space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Jenis Pendaftaran:</span>
              <span className="font-bold text-slate-900">{resolveTypeName(type)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{type === "ORANG_TUA" ? "Program Anak / Jenjang:" : "Program / Posisi:"}</span>
              <span className="font-bold text-slate-900">{program}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs text-slate-800 space-y-2 leading-relaxed">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Langkah Selanjutnya:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
            <li>Simpan atau tangkap layar (screenshot) nomor registrasi di atas.</li>
            <li>Admin & Panitia akan melakukan verifikasi berkas dalam 1-2 hari kerja.</li>
            <li>Hasil kelulusan seleksi & akun login portal akan diinformasikan via WhatsApp.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Cetak Bukti Registrasi</span>
          </button>

          <a
            href="https://wa.me/6285156560630?text=Halo%20Admin%20PKBM%20Askara,%20saya%20sudah%20mendaftar%20dengan%20nomor%20"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Phone className="w-4 h-4" />
            <span>Konfirmasi ke WhatsApp Admin</span>
          </a>
        </div>
      </div>

      <div>
        <Link
          href="/"
          className="text-xs text-slate-600 hover:text-slate-900 transition font-medium inline-flex items-center gap-1.5"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Beranda PKBM Askara</span>
        </Link>
      </div>
    </div>
  );
}

export default function PendaftaranSuksesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Memuat informasi pendaftaran...</div>}>
      <SuksesContent />
    </Suspense>
  );
}
