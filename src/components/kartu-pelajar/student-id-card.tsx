"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BarcodeGenerator } from "./barcode-generator";
import { QRCodeView } from "@/components/qr/qr-code-view";
import {
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Award,
  Layers,
  RotateCw,
  School,
  CheckCircle2,
  Bookmark,
} from "lucide-react";

export type CardTheme = "emerald" | "indigo" | "navy" | "maroon";

export interface StudentCardData {
  id: string;
  name: string;
  nisn: string;
  nik?: string;
  gender?: "L" | "P" | string;
  packet?: string; // "Paket A", "Paket B", "Paket C"
  studyModel?: string; // "Reguler", "Home Schooling", "Kursus", "Privat"
  class?: string; // e.g. "Kelas X Merdeka"
  phone?: string;
  address?: string;
  city?: string;
  birthPlace?: string;
  birthDate?: string;
  photoUrl?: string;
  status?: string;
  registeredAt?: string;
}

export interface InstitutionCardData {
  name?: string;
  operationalPermit?: string;
  npsn?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  headmasterName?: string;
  headmasterNip?: string;
  headmasterSignatureUrl?: string;
  institutionStampUrl?: string;
  academicYear?: string;
  reportPlaceDate?: string;
}

export interface StudentIDCardProps {
  student: StudentCardData;
  institution?: InstitutionCardData;
  theme?: CardTheme;
  side?: "front" | "back" | "both" | "flipper";
  scale?: number;
  className?: string;
  showFlipButton?: boolean;
  onFlipChange?: (isFlipped: boolean) => void;
  idPrefix?: string;
}

const THEME_STYLES: Record<
  CardTheme,
  {
    name: string;
    frontBg: string;
    frontHeaderBg: string;
    frontHeaderBorder: string;
    frontAccentBadge: string;
    frontTextColor: string;
    frontSubTextColor: string;
    frontPhotoBorder: string;
    backBg: string;
    backHeaderBg: string;
    backAccent: string;
    signatureColor: string;
  }
> = {
  emerald: {
    name: "Emerald Gold (Resmi Askara)",
    frontBg: "bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950",
    frontHeaderBg: "bg-emerald-900/60 border-emerald-500/30",
    frontHeaderBorder: "border-emerald-400/40",
    frontAccentBadge: "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950",
    frontTextColor: "text-white",
    frontSubTextColor: "text-emerald-200/90",
    frontPhotoBorder: "border-amber-400/80 shadow-amber-500/20",
    backBg: "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950",
    backHeaderBg: "bg-emerald-950/80 border-emerald-500/30",
    backAccent: "text-emerald-400",
    signatureColor: "text-emerald-300",
  },
  indigo: {
    name: "Royal Sapphire (Modern)",
    frontBg: "bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950",
    frontHeaderBg: "bg-indigo-900/60 border-indigo-500/30",
    frontHeaderBorder: "border-indigo-400/40",
    frontAccentBadge: "bg-gradient-to-r from-cyan-400 to-blue-500 text-white",
    frontTextColor: "text-white",
    frontSubTextColor: "text-indigo-200/90",
    frontPhotoBorder: "border-cyan-400/80 shadow-cyan-500/20",
    backBg: "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950",
    backHeaderBg: "bg-indigo-950/80 border-indigo-500/30",
    backAccent: "text-cyan-400",
    signatureColor: "text-indigo-300",
  },
  navy: {
    name: "Classic Navy & Platinum",
    frontBg: "bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900",
    frontHeaderBg: "bg-slate-900/70 border-sky-500/30",
    frontHeaderBorder: "border-sky-400/40",
    frontAccentBadge: "bg-gradient-to-r from-slate-200 to-slate-100 text-slate-900",
    frontTextColor: "text-white",
    frontSubTextColor: "text-sky-200/90",
    frontPhotoBorder: "border-sky-300/80 shadow-sky-500/20",
    backBg: "bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950",
    backHeaderBg: "bg-slate-900/80 border-sky-500/30",
    backAccent: "text-sky-400",
    signatureColor: "text-sky-300",
  },
  maroon: {
    name: "Royal Maroon & Gold",
    frontBg: "bg-gradient-to-br from-rose-950 via-red-950 to-slate-950",
    frontHeaderBg: "bg-rose-900/60 border-amber-500/30",
    frontHeaderBorder: "border-amber-400/40",
    frontAccentBadge: "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950",
    frontTextColor: "text-white",
    frontSubTextColor: "text-rose-200/90",
    frontPhotoBorder: "border-amber-400/80 shadow-amber-500/20",
    backBg: "bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950",
    backHeaderBg: "bg-rose-950/80 border-amber-500/30",
    backAccent: "text-amber-400",
    signatureColor: "text-rose-300",
  },
};

const DEFAULT_INSTITUTION: InstitutionCardData = {
  name: "PKBM ASKARA",
  operationalPermit: "Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP",
  npsn: "P9998766",
  address: "Jl. Adi Flora Raya No. 8 Gedebage Kota Bandung",
  phone: "085156560630 / (022) 87518584",
  email: "pkbm.askara@gmail.com",
  website: "www.pkbmaskara.sch.id",
  logoUrl: "/logo.png",
  headmasterName: "Arif Syarifudin, S.Pd",
  headmasterNip: "",
  academicYear: "2025/2026",
  reportPlaceDate: "Bandung, 13 Agustus 2026",
};

export function StudentIDCard({
  student,
  institution: customInst,
  theme = "emerald",
  side = "flipper",
  scale = 1,
  className = "",
  showFlipButton = true,
  onFlipChange,
  idPrefix = "card",
}: StudentIDCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const inst = { ...DEFAULT_INSTITUTION, ...customInst };
  const styles = THEME_STYLES[theme] || THEME_STYLES.emerald;

  const handleFlip = () => {
    const nextState = !isFlipped;
    setIsFlipped(nextState);
    if (onFlipChange) onFlipChange(nextState);
  };

  // Standard QR payload for instant scanner integration with /api/presensi/scan
  const qrValue = `ASKARA-STUDENT:${student.id}:${student.nisn || "NISN-001"}:${encodeURIComponent(
    student.name || "Siswa"
  )}:${encodeURIComponent(student.class || student.packet || "Paket C")}`;

  const cleanNISN = student.nisn && student.nisn !== "-" ? student.nisn : `ASK-${student.id.substring(0, 8)}`;
  const cleanPhone = student.phone && student.phone !== "-" ? student.phone : "-";
  const cleanAddress = student.address && student.address !== "-" ? student.address : "Bandung, Jawa Barat";
  const cleanClass = student.class || `${student.packet || "Paket C"} (Reguler)`;

  /* ──────────────────────────────────────────────────────────── */
  /*  1. MUKA DEPAN (FRONT SIDE)                                  */
  /* ──────────────────────────────────────────────────────────── */
  const renderFront = (idAttr?: string, forceSize?: { w: number; h: number }) => (
    <div
      id={idAttr}
      className={`relative ${styles.frontBg} text-white shadow-2xl border border-white/20 overflow-hidden flex flex-col justify-between select-none print:shadow-none print:border print:border-slate-400`}
      style={{
        boxSizing: "border-box",
        width: forceSize ? `${forceSize.w}px` : undefined,
        height: forceSize ? `${forceSize.h}px` : undefined,
        // When inside the flipper/preview wrapper, use natural responsive widths
        minWidth: forceSize ? undefined : "342px",
        maxWidth: forceSize ? undefined : "425px",
        aspectRatio: forceSize ? undefined : "85.60 / 53.98",
        borderRadius: "14px",
        padding: forceSize ? "20px" : undefined,
      }}
    >
      {/* Background Guilloche Security Waves & Glow Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`pattern-front-${idPrefix}`} width="30" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M 0 15 Q 7.5 0, 15 15 T 30 15"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.5"
              />
              <circle cx="15" cy="15" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#pattern-front-${idPrefix})`} />
        </svg>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* ── CARD HEADER (KOP LEMBAGA) ── */}
      <div
        className={`relative z-10 flex items-center justify-between pb-2 border-b ${styles.frontHeaderBorder} backdrop-blur-xs`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white p-0.5 shrink-0 shadow-md flex items-center justify-center border border-white/40">
            <img
              src={inst.logoUrl || "/logo.png"}
              alt="Logo Askara"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback letter if logo is not loaded
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="leading-none">
            <p className="text-[8px] sm:text-[9.5px] font-extrabold uppercase tracking-widest text-amber-300 drop-shadow-xs">
              PKBM ASKARA
            </p>
            <h4 className="font-black text-[10px] sm:text-[12.5px] tracking-tight text-white uppercase mt-0.5">
              KARTU TANDA PELAJAR
            </h4>
            <p className="text-[6.5px] sm:text-[7.5px] text-emerald-200/80 font-mono tracking-tighter mt-0.5">
              NPSN: {inst.npsn} • {inst.operationalPermit?.split("/")[0] || "DPMTSP"}
            </p>
          </div>
        </div>

        {/* Right Badge: Program & Study Model */}
        <div className="text-right flex flex-col items-end">
          <span
            className={`px-2 py-0.5 rounded-md text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider shadow-sm ${styles.frontAccentBadge}`}
          >
            {student.packet || "PAKET C"}
          </span>
          <span className="text-[7px] sm:text-[8px] font-medium text-emerald-200/80 mt-0.5">
            {student.studyModel || "Reguler"}
          </span>
        </div>
      </div>

      {/* ── CARD BODY (STUDENT PHOTO & DETAILS) ── */}
      <div className="relative z-10 flex items-center gap-2.5 sm:gap-3.5 my-auto py-1">
        {/* Student Photo */}
        <div className="relative shrink-0">
          <div
            className={`w-[66px] h-[88px] sm:w-[86px] sm:h-[112px] rounded-xl overflow-hidden bg-slate-800 border-2 ${styles.frontPhotoBorder} shadow-lg flex items-center justify-center relative`}
          >
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-2xl sm:text-3xl">
                <span>{student.name ? student.name.charAt(0).toUpperCase() : "A"}</span>
                <span className="text-[7px] sm:text-[8px] text-slate-400 font-normal mt-1">Foto Siswa</span>
              </div>
            )}

            {/* Subtle bottom glossy overlay */}
            <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>

          {/* Hologram / Security seal on photo corner */}
          <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-white shadow-md flex items-center justify-center text-[8px] sm:text-[10px] font-black text-slate-900">
            ★
          </div>
        </div>

        {/* Student Information Fields */}
        <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5 text-[8.5px] sm:text-[10.5px]">
          {/* Name */}
          <div className="border-b border-white/10 pb-0.5">
            <p className="text-[7px] sm:text-[8px] font-bold text-amber-300 uppercase tracking-wider">
              Nama Lengkap
            </p>
            <h5 className="font-extrabold text-[11px] sm:text-[14px] text-white truncate leading-tight tracking-tight uppercase">
              {student.name || "Nama Siswa"}
            </h5>
          </div>

          {/* NISN & NIK */}
          <div className="grid grid-cols-2 gap-1">
            <div>
              <p className="text-[6.5px] sm:text-[7.5px] text-emerald-200/80 uppercase font-semibold">NISN</p>
              <p className="font-mono font-black text-[9px] sm:text-[11.5px] text-amber-200 tracking-wide">
                {cleanNISN}
              </p>
            </div>
            <div>
              <p className="text-[6.5px] sm:text-[7.5px] text-emerald-200/80 uppercase font-semibold">Rombel / Kelas</p>
              <p className="font-bold text-[8.5px] sm:text-[10.5px] text-white truncate">
                {cleanClass}
              </p>
            </div>
          </div>

          {/* Alamat & Domisili */}
          <div>
            <p className="text-[6.5px] sm:text-[7.5px] text-emerald-200/80 uppercase font-semibold flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 text-amber-400 inline shrink-0" />
              <span>Alamat Domisili</span>
            </p>
            <p className="text-[8px] sm:text-[9.5px] text-slate-200 truncate leading-snug">
              {cleanAddress}
            </p>
          </div>

          {/* No Telepon / Kontak */}
          <div className="flex items-center justify-between text-[7.5px] sm:text-[9px] text-slate-300 pt-0.5">
            <span className="flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span className="font-mono">{cleanPhone}</span>
            </span>
            <span className="text-[7px] sm:text-[8px] text-amber-300 font-bold bg-white/10 px-1.5 py-0.2 rounded">
              AKTIF
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD FOOTER (VALIDITY & SECURITY CHIP) ── */}
      <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-white/15 text-[7px] sm:text-[8.5px] text-emerald-200/90 font-medium">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Berlaku s/d: <strong className="text-white">T.A. {inst.academicYear}</strong></span>
        </div>
        <div className="text-right font-mono text-[6.5px] sm:text-[8px] text-amber-300/80 uppercase">
          KARTU RESMI PENDIDIKAN KESETARAAN
        </div>
      </div>
    </div>
  );

  /* ──────────────────────────────────────────────────────────── */
  /*  2. MUKA BELAKANG (BACK SIDE)                                */
  /* ──────────────────────────────────────────────────────────── */
  const renderBack = (idAttr?: string, forceSize?: { w: number; h: number }) => (
    <div
      id={idAttr}
      className={`relative ${styles.backBg} text-white shadow-2xl border border-white/20 overflow-hidden flex flex-col justify-between select-none print:shadow-none print:border print:border-slate-400`}
      style={{
        boxSizing: "border-box",
        width: forceSize ? `${forceSize.w}px` : undefined,
        height: forceSize ? `${forceSize.h}px` : undefined,
        minWidth: forceSize ? undefined : "342px",
        maxWidth: forceSize ? undefined : "425px",
        aspectRatio: forceSize ? undefined : "85.60 / 53.98",
        borderRadius: "14px",
        padding: forceSize ? "20px" : undefined,
      }}
    >
      {/* Background Guilloche Security Waves */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`pattern-back-${idPrefix}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 0 12 Q 6 0, 12 12 T 24 12"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#pattern-back-${idPrefix})`} />
        </svg>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -top-10 -left-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* ── BACK HEADER ── */}
      <div className="relative z-10 flex items-center justify-between pb-1.5 border-b border-white/15">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-[9px] text-emerald-300">
            A
          </div>
          <div>
            <h5 className="font-extrabold text-[9px] sm:text-[11px] tracking-wider uppercase leading-none">
              PRESENSI & PUSTAKA DIGITAL
            </h5>
            <p className="text-[6.5px] sm:text-[7.5px] text-emerald-300 font-mono mt-0.5">
              SISTEM INFORMASI AKADEMIK PKBM ASKARA
            </p>
          </div>
        </div>
        <span className="text-[7px] sm:text-[8.5px] font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
          CR80 STANDARD
        </span>
      </div>

      {/* ── BACK BODY (BARCODE / QR CODE & RULES) ── */}
      <div className="relative z-10 grid grid-cols-12 gap-2.5 my-auto items-center">
        {/* Left Column: QR Code & Code128 Barcode */}
        <div className="col-span-5 flex flex-col items-center bg-white p-2 rounded-xl shadow-md border border-slate-200 text-slate-900">
          <p className="text-[6.5px] sm:text-[7.5px] font-extrabold text-slate-700 uppercase tracking-tight text-center mb-1">
            SCAN PRESENSI KELAS
          </p>
          
          {/* QR Code */}
          <div className="p-0.5 bg-white rounded flex items-center justify-center">
            <QRCodeView
              value={qrValue}
              size={scale < 1 ? 65 : 78}
              showControls={false}
              darkColor="#090d16"
              lightColor="#ffffff"
              allowFullscreen={false}
            />
          </div>

          {/* Code128 Barcode for NISN */}
          <div className="w-full mt-1.5 pt-1 border-t border-slate-200/80 flex flex-col items-center">
            <BarcodeGenerator
              value={cleanNISN}
              width={100}
              height={20}
              barColor="#0f172a"
              textColor="#334155"
              fontSize={6.5}
            />
          </div>
        </div>

        {/* Right Column: Terms & Principal Signature */}
        <div className="col-span-7 space-y-1.5 text-[7px] sm:text-[8.5px] text-slate-200">
          {/* Rules / Terms Box */}
          <div className="bg-white/5 border border-white/10 p-1.5 sm:p-2 rounded-xl space-y-1 leading-tight">
            <p className="font-bold text-amber-300 text-[7.5px] sm:text-[9px] uppercase">
              KETENTUAN KARTU PELAJAR:
            </p>
            <ol className="list-decimal pl-3 space-y-0.5 text-slate-300 text-[6.5px] sm:text-[7.5px]">
              <li>Kartu ini adalah identitas sah siswa PKBM Askara.</li>
              <li>Wajib dibawa saat KBM tatap muka, tutorial, ujian, & club.</li>
              <li>Scan barcode/QR untuk absensi otomatis & peminjaman buku.</li>
              <li>Bila menemukan kartu ini, mohon hubungi sekretariat PKBM Askara.</li>
            </ol>
          </div>

          {/* Signature & Stamp Section */}
          <div className="pt-0.5 flex items-end justify-between">
            <div className="text-[6px] sm:text-[7px] text-slate-400">
              <p className="text-amber-200/90 font-mono">Sekretariat:</p>
              <p className="truncate max-w-[110px]">{inst.phone}</p>
              <p className="truncate max-w-[110px]">{inst.website}</p>
            </div>

            {/* Principal Stamp & Signature */}
            <div className="text-center relative">
              <p className="text-[6.5px] sm:text-[7.5px] text-emerald-200">
                {inst.reportPlaceDate?.split(",")[0] || "Bandung"}, T.A. {inst.academicYear}
              </p>
              <p className="text-[6px] sm:text-[7px] text-slate-300 font-semibold leading-tight">
                Kepala PKBM Askara,
              </p>

              {/* Digital Signature / Stamp Overlay */}
              <div className="h-6 sm:h-7 flex items-center justify-center relative my-0.5">
                {inst.headmasterSignatureUrl ? (
                  <img
                    src={inst.headmasterSignatureUrl}
                    alt="TTD Kepala"
                    className="max-h-7 max-w-[70px] object-contain relative z-10"
                  />
                ) : (
                  <span className="font-serif italic text-amber-300 font-bold text-[10px] sm:text-[12px] opacity-90">
                    Arif Syarifudin
                  </span>
                )}
                {/* Official Stamp Overlay */}
                {inst.institutionStampUrl && (
                  <img
                    src={inst.institutionStampUrl}
                    alt="Stempel PKBM"
                    className="absolute -right-2 top-0 max-h-7 max-w-[36px] object-contain opacity-70 rotate-[-12deg]"
                  />
                )}
              </div>

              <p className="font-bold text-white text-[7px] sm:text-[8.5px] underline underline-offset-1 leading-none">
                {inst.headmasterName || "Arif Syarifudin, S.Pd"}
              </p>
              {inst.headmasterNip && (
                <p className="text-[5.5px] sm:text-[6.5px] font-mono text-emerald-300/80 leading-tight mt-0.5">
                  NIP: {inst.headmasterNip}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BACK FOOTER ── */}
      <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/10 text-[6.5px] sm:text-[7.5px] text-slate-400 font-mono">
        <span>PKBM ASKARA BANDUNG</span>
        <span className="text-amber-400">ID: {student.id.substring(0, 10)}</span>
      </div>
    </div>
  );

  /* ──────────────────────────────────────────────────────────── */
  /*  3. RENDER MODES (SINGLE, FLIPPER, OR BOTH)                  */
  /* ──────────────────────────────────────────────────────────── */

  if (side === "front") {
    return <div className={`inline-block ${className}`}>{renderFront(`${idPrefix}-front`)}</div>;
  }

  if (side === "back") {
    return <div className={`inline-block ${className}`}>{renderBack(`${idPrefix}-back`)}</div>;
  }

  if (side === "both") {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`}>
        <div>{renderFront(`${idPrefix}-front`)}</div>
        <div>{renderBack(`${idPrefix}-back`)}</div>
      </div>
    );
  }

  // Interactive 3D Flipper Mode
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 3D Perspective Card Container */}
      <div
        className="cursor-pointer group perspective-1000"
        onClick={handleFlip}
        title="Klik untuk membalik kartu (Muka Depan / Belakang)"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative transition-transform duration-700 ease-in-out"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front Side */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {renderFront(`${idPrefix}-front`)}
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {renderBack(`${idPrefix}-back`)}
          </div>
        </div>
      </div>

      {/* Flip Button Control */}
      {showFlipButton && (
        <button
          type="button"
          onClick={handleFlip}
          className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-full text-xs font-bold transition shadow-md border border-slate-700 hover:scale-105 active:scale-95"
        >
          <RotateCw className={`w-3.5 h-3.5 text-amber-400 transition-transform ${isFlipped ? "rotate-180" : ""}`} />
          <span>{isFlipped ? "Lihat Muka Depan (Identitas)" : "Balik ke Belakang (Barcode / QR Presensi)"}</span>
        </button>
      )}
    </div>
  );
}
