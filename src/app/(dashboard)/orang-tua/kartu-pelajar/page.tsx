"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Printer,
  ChevronRight,
  ShieldCheck,
  QrCode,
  Users,
  RefreshCw,
  Sparkles,
  Phone,
  MapPin,
  Palette,
} from "lucide-react";
import {
  StudentIDCard,
  StudentCardData,
  InstitutionCardData,
  CardTheme,
} from "@/components/kartu-pelajar/student-id-card";
import { CardPrintDialog } from "@/components/kartu-pelajar/card-print-dialog";

export default function OrangTuaKartuPelajarPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [institution, setInstitution] = useState<InstitutionCardData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<CardTheme>("emerald");
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  const fetchChildrenData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch children
      const res = await fetch("/api/parents/my-children");
      const json = await res.json();
      if (json.success && Array.isArray(json.children)) {
        setChildren(json.children);
      }

      // 2. Fetch institution profile
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
      console.error("Gagal memuat data kartu pelajar anak:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildrenData();
  }, []);

  const activeChild = children[selectedChildIndex] || null;

  const mappedStudentCardData: StudentCardData | null = activeChild
    ? {
        id: activeChild.id,
        name: activeChild.name,
        nisn: activeChild.nisn,
        nik: activeChild.nik,
        packet: activeChild.packetType,
        studyModel: activeChild.studyModel,
        class: activeChild.className,
        phone: activeChild.phone,
        address: activeChild.address,
        photoUrl: activeChild.avatarUrl,
        status: activeChild.status,
      }
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── BREADCRUMB ── */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/orang-tua" className="hover:text-slate-800 transition">
          Portal Wali Murid
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-emerald-700 font-bold">Kartu Pelajar Siswa</span>
      </div>

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Kartu Pelajar Peserta Didik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Kartu Tanda Pelajar Putra / Putri
            </h1>
            <p className="mt-1.5 text-indigo-200/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              Pantau dan unduh kartu pelajar resmi anak Anda dalam standar kartu ATM (CR80) bolak-balik dengan barcode/QR presensi.
            </p>
          </div>

          {/* Print Button */}
          {mappedStudentCardData && (
            <div className="shrink-0">
              <button
                onClick={() => setIsPrintDialogOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition shadow-lg shadow-emerald-950 hover-lift"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak & Simpan Kartu</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CHILD SELECTOR TABS ── */}
      {children.length > 1 && (
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1.5 gap-1.5 shadow-xs overflow-x-auto">
          {children.map((ch, idx) => (
            <button
              key={ch.id || idx}
              onClick={() => setSelectedChildIndex(idx)}
              className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                selectedChildIndex === idx
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{ch.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── MAIN CARD DISPLAY ── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="font-bold text-slate-700">Memuat data kartu pelajar...</span>
        </div>
      ) : mappedStudentCardData ? (
        <div className="space-y-6">
          {/* Card Container with 3D Flip */}
          <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
            {/* Theme Selector */}
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
            </div>

            {/* 3D Student ID Card */}
            <div className="py-2">
              <StudentIDCard
                student={mappedStudentCardData}
                institution={institution}
                theme={theme}
                side="flipper"
                idPrefix="ortu-card"
                showFlipButton={true}
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              👆 <strong>Klik kartu</strong> di atas untuk melihat Muka Belakang (Barcode & QR Code Presensi).
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 text-xs">
          Belum ada data siswa yang ditautkan ke akun Anda. Silakan hubungi admin sekolah.
        </div>
      )}

      {/* ── PRINT MODAL ── */}
      {mappedStudentCardData && (
        <CardPrintDialog
          student={mappedStudentCardData}
          institution={institution}
          isOpen={isPrintDialogOpen}
          onClose={() => setIsPrintDialogOpen(false)}
        />
      )}
    </div>
  );
}
