"use client";

import React, { useState } from "react";
import { QRCodeView } from "./qr-code-view";
import { Sparkles, Download, Maximize2, ShieldCheck, User, School, CheckCircle2 } from "lucide-react";

interface StudentIDCardQRProps {
  student: {
    id: string;
    name: string;
    nis?: string;
    nisn?: string;
    className?: string;
    program?: string;
    photoUrl?: string;
    status?: string;
  };
  onClose?: () => void;
}

export function StudentIDCardQR({ student }: StudentIDCardQRProps) {
  const qrValue = `ASKARA-STUDENT:${student.id}:${student.nis || "NIS-001"}:${encodeURIComponent(student.name)}:${encodeURIComponent(student.className || "Paket C")}`;

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-2xl border border-indigo-500/20 max-w-sm w-full mx-auto relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Institution */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-white text-xs shadow-md">
            A
          </div>
          <div>
            <h4 className="font-extrabold text-xs tracking-wider uppercase leading-tight">PKBM ASKARA</h4>
            <p className="text-[10px] text-indigo-300">Kartu Presensi Digital Siswa</p>
          </div>
        </div>
        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-extrabold flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>AKTIF</span>
        </span>
      </div>

      {/* Student Profile Quick Info */}
      <div className="flex items-center gap-3.5 mb-4 bg-white/5 p-3 rounded-2xl border border-white/10">
        {student.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={student.photoUrl}
            alt={student.name}
            className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400/50 shadow-sm shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-700 flex items-center justify-center font-bold text-base border-2 border-indigo-400/40 shrink-0">
            {student.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h5 className="font-bold text-xs truncate leading-snug">{student.name}</h5>
          <p className="text-[11px] text-indigo-200 mt-0.5 truncate font-mono">NIS: {student.nis || "2025.10.048"}</p>
          <p className="text-[10px] text-emerald-300 mt-0.5 truncate font-semibold">{student.className || "Paket C - Kelas X"}</p>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="bg-white p-3.5 rounded-2xl shadow-xl flex flex-col items-center">
        <QRCodeView
          value={qrValue}
          size={180}
          showControls={false}
          darkColor="#090d16"
          lightColor="#ffffff"
          allowFullscreen={false}
        />
        <div className="mt-2 text-center">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
            ID: {student.id.substring(0, 12)}
          </span>
        </div>
      </div>

      {/* Instruction Footer */}
      <p className="text-[11px] text-indigo-200/90 text-center mt-4 leading-relaxed">
        📱 Tunjukkan QR Code ini kepada Tutor/Guru atau Pembina Club Belajar jika Anda terkendala memindai dari ponsel Anda.
      </p>
    </div>
  );
}
