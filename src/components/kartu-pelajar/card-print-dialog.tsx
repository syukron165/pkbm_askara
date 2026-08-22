"use client";

import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  StudentIDCard,
  StudentCardData,
  InstitutionCardData,
  CardTheme,
} from "./student-id-card";
import {
  Printer,
  Download,
  X,
  Palette,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Layers,
} from "lucide-react";

interface CardPrintDialogProps {
  student: StudentCardData;
  institution?: InstitutionCardData;
  isOpen: boolean;
  onClose: () => void;
}

// ── Fixed pixel dimensions at 96 DPI for html2canvas capture ──
// CR80: 85.60mm × 53.98mm  →  at 96 dpi → 323px × 204px
// We render at 2× = 646px × 408px for quality, then scale:3 in html2canvas
const CAPTURE_W = 646;
const CAPTURE_H = 408;

export function CardPrintDialog({
  student,
  institution,
  isOpen,
  onClose,
}: CardPrintDialogProps) {
  const [theme, setTheme] = useState<CardTheme>("emerald");
  const [printLayout, setPrintLayout] = useState<"both" | "front" | "back">("both");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Refs for the hidden off-screen capture containers
  const captureFrontRef = useRef<HTMLDivElement>(null);
  const captureBackRef = useRef<HTMLDivElement>(null);

  // Clear export messages after timeout
  useEffect(() => {
    if (exportSuccess) {
      const t = setTimeout(() => setExportSuccess(null), 4500);
      return () => clearTimeout(t);
    }
  }, [exportSuccess]);

  useEffect(() => {
    if (exportError) {
      const t = setTimeout(() => setExportError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [exportError]);

  if (!isOpen) return null;

  // ── Internal capture helper ──
  const captureElement = async (el: HTMLElement): Promise<HTMLCanvasElement> => {
    return html2canvas(el, {
      scale: 3,            // 3× for ~300 DPI equivalent
      useCORS: true,
      allowTaint: true,
      backgroundColor: null, // keep transparent so card bg shows
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
    });
  };

  // ── Handler: Direct Browser Print ──
  const handlePrint = () => {
    window.print();
  };

  // ── Handler: Download PNG ──
  const handleDownloadPNG = async (sideToCapture: "front" | "back" | "both") => {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      const frontEl = captureFrontRef.current;
      const backEl = captureBackRef.current;

      if (!frontEl && !backEl) throw new Error("Elemen kartu tidak ditemukan.");

      const safeName = student.name.replace(/\s+/g, "_");
      const safeNisn = student.nisn && student.nisn !== "-" ? student.nisn : student.id.substring(0, 8);

      if ((sideToCapture === "both" || sideToCapture === "front") && frontEl) {
        const canvas = await captureElement(frontEl);
        const link = document.createElement("a");
        link.download = `Kartu_Pelajar_Depan_${safeNisn}_${safeName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }

      // Small delay between downloads to avoid browser blocking
      if (sideToCapture === "both") await new Promise((r) => setTimeout(r, 400));

      if ((sideToCapture === "both" || sideToCapture === "back") && backEl) {
        const canvas = await captureElement(backEl);
        const link = document.createElement("a");
        link.download = `Kartu_Pelajar_Belakang_${safeNisn}_${safeName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }

      const label =
        sideToCapture === "both"
          ? "2 gambar kartu (Depan & Belakang) berhasil diunduh!"
          : `Gambar kartu (${sideToCapture === "front" ? "Depan" : "Belakang"}) berhasil diunduh!`;
      setExportSuccess(label);
    } catch (err: any) {
      console.error("Gagal mengunduh PNG:", err);
      setExportError("Gagal mengunduh gambar: " + (err?.message || "Error tidak diketahui."));
    } finally {
      setIsExporting(false);
    }
  };

  // ── Handler: Download PDF ──
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      const frontEl = captureFrontRef.current;
      const backEl = captureBackRef.current;

      const safeName = student.name.replace(/\s+/g, "_");
      const safeNisn = student.nisn && student.nisn !== "-" ? student.nisn : student.id.substring(0, 8);

      // CR80 mm dimensions
      const cardW = 85.6;
      const cardH = 53.98;

      // Determine which sides we need
      const needFront = printLayout === "both" || printLayout === "front";
      const needBack = printLayout === "both" || printLayout === "back";

      // Build PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [
          // page: wide enough for both cards side-by-side with margins
          printLayout === "both" ? cardW * 2 + 20 : cardW + 20,
          cardH + 30,
        ],
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // ── PDF Header ──
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(60, 60, 60);
      pdf.text("KARTU TANDA PELAJAR  •  PKBM ASKARA  •  Standar CR80 (85.60 mm × 53.98 mm)", pageW / 2, 5, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(5.5);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        `Siswa: ${student.name}   |   NISN: ${safeNisn}   |   Program: ${student.packet || "Paket C"}`,
        pageW / 2, 9,
        { align: "center" }
      );

      const startY = 12;

      // ── Place Front card ──
      if (needFront && frontEl) {
        const canvas = await captureElement(frontEl);
        const imgData = canvas.toDataURL("image/png");
        const startX = printLayout === "both" ? (pageW / 2 - cardW - 3) : (pageW / 2 - cardW / 2);
        pdf.addImage(imgData, "PNG", startX, startY, cardW, cardH);

        // Cut guide border
        pdf.setDrawColor(160, 160, 160);
        pdf.setLineDashPattern([1.5, 1.5], 0);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(startX, startY, cardW, cardH, 2, 2, "S");

        // Label
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(5);
        pdf.setTextColor(100, 100, 100);
        pdf.setLineDashPattern([], 0);
        pdf.text("▲ DEPAN", startX + cardW / 2, startY + cardH + 4, { align: "center" });
      }

      // ── Place Back card ──
      if (needBack && backEl) {
        const canvas = await captureElement(backEl);
        const imgData = canvas.toDataURL("image/png");
        const startX = printLayout === "both" ? (pageW / 2 + 3) : (pageW / 2 - cardW / 2);
        pdf.addImage(imgData, "PNG", startX, startY, cardW, cardH);

        // Cut guide border
        pdf.setDrawColor(160, 160, 160);
        pdf.setLineDashPattern([1.5, 1.5], 0);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(startX, startY, cardW, cardH, 2, 2, "S");

        // Label
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(5);
        pdf.setTextColor(100, 100, 100);
        pdf.setLineDashPattern([], 0);
        pdf.text("▲ BELAKANG", startX + cardW / 2, startY + cardH + 4, { align: "center" });
      }

      // ── Footer note ──
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(4.5);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        "✂ Gunting tepat pada garis putus-putus. Cetak skala 100% (Actual Size) untuk ukuran kartu ATM standar.",
        pageW / 2, pageH - 2,
        { align: "center" }
      );

      pdf.save(`Kartu_Pelajar_${safeNisn}_${safeName}.pdf`);
      setExportSuccess("Berkas PDF siap cetak berhasil diunduh!");
    } catch (err: any) {
      console.error("Gagal membuat PDF:", err);
      setExportError("Gagal membuat PDF: " + (err?.message || "Error tidak diketahui."));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* ── MODAL OVERLAY ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 print:hidden">
        <div className="bg-slate-900 border border-slate-700/80 text-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-8">

          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">Cetak Kartu Tanda Pelajar</h3>
                <p className="text-xs text-slate-400">Ukuran Standar Kartu ATM / CR80 (85.60 mm × 53.98 mm)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Theme & Layout Selectors ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            {/* Theme Selector */}
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Pilih Tema Kartu</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                {(
                  [
                    { id: "emerald", label: "Emerald Askara", color: "bg-emerald-500", active: "bg-emerald-950 border-emerald-500 text-emerald-200" },
                    { id: "indigo",  label: "Royal Sapphire",  color: "bg-indigo-500",  active: "bg-indigo-950 border-indigo-500 text-indigo-200" },
                    { id: "navy",    label: "Classic Navy",    color: "bg-sky-400",     active: "bg-sky-950 border-sky-500 text-sky-200" },
                    { id: "maroon",  label: "Royal Maroon",    color: "bg-rose-500",    active: "bg-rose-950 border-rose-500 text-rose-200" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as CardTheme)}
                    className={`py-1.5 px-2 rounded-xl text-left flex items-center gap-2 border transition ${
                      theme === t.id
                        ? t.active
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${t.color} shrink-0`} />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Selector */}
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Format Sisi Cetak</span>
              </label>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold">
                {(["both", "front", "back"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setPrintLayout(l)}
                    className={`py-2.5 px-1 rounded-xl text-center border transition ${
                      printLayout === l
                        ? "bg-emerald-600 border-emerald-400 text-white font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {l === "both" ? "Bolak-Balik" : l === "front" ? "Depan Saja" : "Belakang Saja"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Status Toast ── */}
          {exportSuccess && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}
          {exportError && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          {/* ── Live 3D Preview ── */}
          <div className="py-5 px-2 bg-slate-950/80 rounded-3xl border border-slate-800 flex flex-col items-center justify-center">
            <p className="text-[11px] text-slate-500 mb-3 font-semibold">
              👆 Klik kartu untuk membalik dan melihat Depan/Belakang
            </p>
            <StudentIDCard
              student={student}
              institution={institution}
              theme={theme}
              side="flipper"
              idPrefix="dialog-preview"
              showFlipButton={true}
            />
          </div>

          {/* ── Action Buttons ── */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isExporting}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-2xl text-xs font-extrabold transition shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak (Print)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPNG(printLayout)}
              disabled={isExporting}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white rounded-2xl text-xs font-bold transition border border-slate-700 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>{isExporting ? "Menyiapkan..." : "Unduh PNG"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white rounded-2xl text-xs font-bold transition border border-slate-700 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>{isExporting ? "Menyiapkan..." : "Unduh PDF"}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center mt-3 leading-relaxed">
            💡 <strong>Tips:</strong> Unduh <strong>PDF</strong> lalu cetak skala 100% (Actual Size) untuk ukuran kartu ATM standar.
          </p>
        </div>
      </div>

      {/* ── DEDICATED PRINT DOM (for window.print()) ── */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] flex items-center justify-center">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `
        }} />
        <div className="flex flex-wrap items-center justify-center gap-6 p-4">
          <div className="text-center w-full pb-2 border-b border-slate-300 mb-4">
            <p className="font-extrabold text-sm uppercase text-slate-900 tracking-wider">KARTU TANDA PELAJAR — PKBM ASKARA</p>
            <p className="text-[10px] text-slate-500">Siswa: {student.name} | NISN: {student.nisn || student.id.substring(0, 8)} | CR80 (85.60 mm × 53.98 mm)</p>
          </div>
          {(printLayout === "both" || printLayout === "front") && (
            <div className="border border-dashed border-slate-400 rounded-xl p-1">
              <StudentIDCard student={student} institution={institution} theme={theme} side="front" idPrefix="print-front" showFlipButton={false} />
            </div>
          )}
          {(printLayout === "both" || printLayout === "back") && (
            <div className="border border-dashed border-slate-400 rounded-xl p-1">
              <StudentIDCard student={student} institution={institution} theme={theme} side="back" idPrefix="print-back" showFlipButton={false} />
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* OFF-SCREEN CAPTURE CONTAINERS                                  */}
      {/* These are always rendered (outside viewport) so html2canvas    */}
      {/* can capture them reliably, without 3D flip transforms.         */}
      {/* ────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          zIndex: -1,
          pointerEvents: "none",
          display: "flex",
          gap: "12px",
        }}
      >
        {/* Front capture target */}
        <div
          ref={captureFrontRef}
          style={{
            width: `${CAPTURE_W}px`,
            height: `${CAPTURE_H}px`,
            overflow: "hidden",
            borderRadius: "14px",
            flexShrink: 0,
          }}
        >
          <StudentIDCard
            student={student}
            institution={institution}
            theme={theme}
            side="front"
            idPrefix="capture-front"
            showFlipButton={false}
          />
        </div>

        {/* Back capture target */}
        <div
          ref={captureBackRef}
          style={{
            width: `${CAPTURE_W}px`,
            height: `${CAPTURE_H}px`,
            overflow: "hidden",
            borderRadius: "14px",
            flexShrink: 0,
          }}
        >
          <StudentIDCard
            student={student}
            institution={institution}
            theme={theme}
            side="back"
            idPrefix="capture-back"
            showFlipButton={false}
          />
        </div>
      </div>
    </>
  );
}
