"use client";

import React, { useState } from "react";
import {
  StudentIDCard,
  StudentCardData,
  InstitutionCardData,
  CardTheme,
} from "./student-id-card";
import {
  Printer,
  X,
  Palette,
  Layers,
  Scissors,
  CheckCircle2,
  Users,
  ChevronLeft,
  Settings2,
} from "lucide-react";

interface BulkCardPrintViewProps {
  students: StudentCardData[];
  institution?: InstitutionCardData;
  onClose: () => void;
}

export function BulkCardPrintView({
  students,
  institution,
  onClose,
}: BulkCardPrintViewProps) {
  const [theme, setTheme] = useState<CardTheme>("emerald");
  const [printLayout, setPrintLayout] = useState<"side-by-side" | "front-back-pages">("side-by-side");

  const handlePrint = () => {
    window.print();
  };

  // Chunk students into pages (4 students = 8 cards per A4 page in side-by-side mode)
  const pageSize = 4;
  const pages: StudentCardData[][] = [];
  for (let i = 0; i < students.length; i += pageSize) {
    pages.push(students.slice(i, i + pageSize));
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto flex flex-col text-white">
      {/* ── TOP CONTROL BAR (HIDDEN IN PRINT) ── */}
      <div className="sticky top-0 z-50 bg-slate-900/95 border-b border-slate-800 p-4 print:hidden flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <div>
            <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Cetak Massal Kartu Pelajar ({students.length} Siswa)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Format Lembar A4 Siap Cetak (CR80 Standard ATM 85.60 mm × 53.98 mm)
            </p>
          </div>
        </div>

        {/* Theme & Layout Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Theme Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-semibold">Tema:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as CardTheme)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="emerald" className="bg-slate-900 text-white">Emerald Askara</option>
              <option value="indigo" className="bg-slate-900 text-white">Royal Sapphire</option>
              <option value="navy" className="bg-slate-900 text-white">Classic Navy</option>
              <option value="maroon" className="bg-slate-900 text-white">Royal Maroon</option>
            </select>
          </div>

          {/* Layout Mode */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-semibold">Mode:</span>
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(e.target.value as any)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="side-by-side" className="bg-slate-900 text-white">Berdampingan (Depan & Belakang)</option>
              <option value="front-back-pages" className="bg-slate-900 text-white">Duplex (Halaman Depan lalu Belakang)</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-emerald-950 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Semua ({students.length} Kartu)</span>
          </button>
        </div>
      </div>

      {/* ── PRINT STYLES ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .a4-print-sheet {
              page-break-after: always !important;
              break-after: page !important;
              width: 190mm !important;
              min-height: 270mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `
      }} />

      {/* ── A4 SHEET PREVIEW CONTAINER ── */}
      <div className="flex-1 p-4 sm:p-8 flex flex-col items-center gap-8">
        {pages.map((pageStudents, pageIdx) => (
          <div
            key={pageIdx}
            className="a4-print-sheet bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-300 w-full max-w-[820px] relative"
            style={{
              minHeight: "1050px",
              boxSizing: "border-box",
            }}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  LEMBAR CETAK KARTU PELAJAR PKBM ASKARA
                </h4>
                <p className="text-[10px] text-slate-500">
                  Standar Ukuran ATM (CR80: 85.60 mm × 53.98 mm) • Halaman {pageIdx + 1} dari {pages.length} ({students.length} Siswa)
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                <Scissors className="w-3.5 h-3.5" />
                <span>Garis putus-putus = Batas Potong</span>
              </div>
            </div>

            {/* Side by Side Grid Layout (4 Students = 8 Cards per sheet) */}
            {printLayout === "side-by-side" && (
              <div className="space-y-6">
                {pageStudents.map((st, idx) => (
                  <div
                    key={st.id || idx}
                    className="p-3 bg-slate-50/60 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-center gap-4 relative"
                  >
                    {/* Student Mini Label */}
                    <div className="w-full flex items-center justify-between text-[10px] text-slate-500 font-semibold px-1">
                      <span>#{pageIdx * pageSize + idx + 1}. {st.name} ({st.nisn || "-"})</span>
                      <span className="font-mono">{st.packet || "Paket C"} - {st.class || "Reguler"}</span>
                    </div>

                    {/* Front Card with cut border */}
                    <div className="p-0.5 border border-dashed border-slate-400 rounded-[15px] bg-white inline-block">
                      <StudentIDCard
                        student={st}
                        institution={institution}
                        theme={theme}
                        side="front"
                        idPrefix={`bulk-p${pageIdx}-s${idx}-front`}
                        showFlipButton={false}
                      />
                    </div>

                    {/* Back Card with cut border */}
                    <div className="p-0.5 border border-dashed border-slate-400 rounded-[15px] bg-white inline-block">
                      <StudentIDCard
                        student={st}
                        institution={institution}
                        theme={theme}
                        side="back"
                        idPrefix={`bulk-p${pageIdx}-s${idx}-back`}
                        showFlipButton={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Duplex Layout Mode */}
            {printLayout === "front-back-pages" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {pageStudents.map((st, idx) => (
                    <div
                      key={`front-${st.id || idx}`}
                      className="p-0.5 border border-dashed border-slate-400 rounded-[15px] bg-white inline-block mx-auto"
                    >
                      <StudentIDCard
                        student={st}
                        institution={institution}
                        theme={theme}
                        side="front"
                        idPrefix={`bulk-dup-f-p${pageIdx}-s${idx}`}
                        showFlipButton={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sheet Footer */}
            <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span>PKBM ASKARA BANDUNG • SISTEM KARTU PELAJAR DIGITAL</span>
              <span>Dokumen Resmi Dicetak: {new Date().toLocaleDateString("id-ID")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
