"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Printer,
  Download,
  RotateCw,
  Palette,
  ChevronRight,
  ShieldCheck,
  QrCode,
  Sparkles,
  MapPin,
  Phone,
  Calendar,
  School,
  BookOpen,
  Info,
  RefreshCw,
} from "lucide-react";
import {
  StudentIDCard,
  StudentCardData,
  InstitutionCardData,
  CardTheme,
} from "@/components/kartu-pelajar/student-id-card";
import { CardPrintDialog } from "@/components/kartu-pelajar/card-print-dialog";

export default function SiswaKartuPelajarPage() {
  const [student, setStudent] = useState<StudentCardData | null>(null);
  const [institution, setInstitution] = useState<InstitutionCardData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<CardTheme>("emerald");
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  // Fetch current student profile & institution profile
  const fetchStudentCardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Student profile
      const resStudent = await fetch("/api/students?self=true");
      const jsonStudent = await resStudent.json();
      if (jsonStudent.success && jsonStudent.data) {
        setStudent(jsonStudent.data);
      }

      // 2. Fetch Institution profile
      const resInst = await fetch("/api/rapor/institution");
      const jsonInst = await resInst.json();
      if (jsonInst.profile) {
        setInstitution({
          name: jsonInst.profile.name,
          operationalPermit: jsonInst.profile.operationalPermit,
          npsn: jsonInst.profile.npsn,
          address: jsonInst.profile.address,
          phone: jsonInst.profile.phone,
          email: jsonInst.profile.email,
          website: jsonInst.profile.website,
          logoUrl: jsonInst.profile.logoUrl,
          headmasterName: jsonInst.profile.headmasterName,
          headmasterNip: jsonInst.profile.headmasterNip,
          headmasterSignatureUrl: jsonInst.profile.headmasterSignatureUrl,
          institutionStampUrl: jsonInst.profile.institutionStampUrl,
          academicYear: jsonInst.profile.academicYear,
          reportPlaceDate: jsonInst.profile.reportPlaceDate,
        });
      }
    } catch (err) {
      console.error("Gagal memuat kartu pelajar siswa:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentCardData();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── BREADCRUMB ── */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/siswa" className="hover:text-slate-800 transition">
          Dashboard Siswa
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-emerald-700 font-bold">Kartu Tanda Pelajar Digital</span>
      </div>

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Kartu Resmi Peserta Didik PKBM Askara</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Kartu Tanda Pelajar Digital
            </h1>
            <p className="mt-1.5 text-indigo-200/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              Kartu identitas resmi siswa PKBM Askara standar kartu ATM (CR80) bolak-balik. Tunjukkan barcode/QR Code di belakang kartu untuk presensi kelas & akses pustaka digital.
            </p>
          </div>

          {/* Print & Download Action Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => setIsPrintDialogOpen(true)}
              disabled={!student}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition shadow-lg shadow-emerald-950 hover-lift disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak & Unduh Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CARD DISPLAY AREA ── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="font-bold text-slate-700">Memuat Kartu Pelajar Digital Anda...</span>
        </div>
      ) : student ? (
        <div className="space-y-6">
          {/* Card Container & 3D Interactive Flip */}
          <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
            {/* Ambient Background Lights */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Theme Selector Pill Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold px-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Pilih Tema:</span>
              </span>
              <button
                type="button"
                onClick={() => setTheme("emerald")}
                className={`py-1 px-3 rounded-xl font-bold transition ${
                  theme === "emerald"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Emerald Askara
              </button>
              <button
                type="button"
                onClick={() => setTheme("indigo")}
                className={`py-1 px-3 rounded-xl font-bold transition ${
                  theme === "indigo"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Royal Sapphire
              </button>
              <button
                type="button"
                onClick={() => setTheme("navy")}
                className={`py-1 px-3 rounded-xl font-bold transition ${
                  theme === "navy"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Classic Navy
              </button>
              <button
                type="button"
                onClick={() => setTheme("maroon")}
                className={`py-1 px-3 rounded-xl font-bold transition ${
                  theme === "maroon"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Royal Maroon
              </button>
            </div>

            {/* The 3D Flippable Student Card */}
            <div className="py-2">
              <StudentIDCard
                student={student}
                institution={institution}
                theme={theme}
                side="flipper"
                idPrefix="siswa-card"
                showFlipButton={true}
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              👆 <strong>Klik kartu</strong> di atas untuk membalik antara Muka Depan (Identitas Siswa) dan Muka Belakang (Barcode & QR Presensi).
            </p>
          </div>

          {/* ── CARD INFORMATION GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Details Summary */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Rincian Data Identitas Siswa</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Nama Lengkap:</span>
                  <span className="font-bold text-slate-900">{student.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">NISN:</span>
                  <span className="font-mono font-bold text-amber-700">{student.nisn || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Program Belajar:</span>
                  <span className="font-bold text-emerald-700">{student.packet || "Paket C"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Rombel / Kelas:</span>
                  <span className="font-bold text-slate-900">{student.class || "Reguler"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">No. Telepon / WhatsApp:</span>
                  <span className="font-mono text-slate-700">{student.phone || "-"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Alamat Domisili:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">
                    {student.address || "Bandung, Jawa Barat"}
                  </span>
                </div>
              </div>
            </div>

            {/* How to Use / Instructions Box */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>Petunjuk Penggunaan Kartu</span>
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p>
                    <strong>Presensi Tatap Muka:</strong> Tunjukkan QR Code pada bagian belakang kartu ini kepada Tutor atau Pembina Club Belajar untuk discan langsung dari HP guru.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p>
                    <strong>Cetak Fisik / Simpan di HP:</strong> Anda dapat mengunduh gambar kartu resolusi tinggi untuk disimpan di galeri smartphone atau dicetak menjadi kartu fisik PVC.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <p>
                    <strong>Peminjaman Pustaka:</strong> Barcode NISN dapat dipindai oleh petugas perpustakaan digital untuk registrasi peminjaman modul belajar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 text-xs">
          Profil siswa tidak ditemukan. Silakan hubungi admin sekolah.
        </div>
      )}

      {/* ── CARD PRINT DIALOG MODAL ── */}
      {student && (
        <CardPrintDialog
          student={student}
          institution={institution}
          isOpen={isPrintDialogOpen}
          onClose={() => setIsPrintDialogOpen(false)}
        />
      )}
    </div>
  );
}
