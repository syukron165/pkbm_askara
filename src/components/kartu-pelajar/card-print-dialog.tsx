"use client";

import React, { useState, useRef } from "react";
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
  RotateCw,
  Palette,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Layers,
  Sparkles,
} from "lucide-react";

interface CardPrintDialogProps {
  student: StudentCardData;
  institution?: InstitutionCardData;
  isOpen: boolean;
  onClose: () => void;
}

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

  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Handler: Direct Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Handler: Download as PNG Image (High-Res via html2canvas)
  const handleDownloadPNG = async (sideToCapture: "front" | "back" | "both") => {
    setIsExporting(true);
    setExportSuccess(null);
    try {
      if (sideToCapture === "both") {
        // Capture Front
        const frontEl = document.getElementById("print-modal-card-front");
        const backEl = document.getElementById("print-modal-card-back");

        if (frontEl) {
          const canvasFront = await html2canvas(frontEl, {
            scale: 3,
            useCORS: true,
            backgroundColor: null,
          });
          const link = document.createElement("a");
          link.download = `Kartu_Pelajar_Depan_${student.nisn || "Siswa"}_${student.name.replace(/\s+/g, "_")}.png`;
          link.href = canvasFront.toDataURL("image/png");
          link.click();
        }

        if (backEl) {
          const canvasBack = await html2canvas(backEl, {
            scale: 3,
            useCORS: true,
            backgroundColor: null,
          });
          const link = document.createElement("a");
          link.download = `Kartu_Pelajar_Belakang_${student.nisn || "Siswa"}_${student.name.replace(/\s+/g, "_")}.png`;
          link.href = canvasBack.toDataURL("image/png");
          link.click();
        }
      } else {
        const targetId =
          sideToCapture === "front"
            ? "print-modal-card-front"
            : "print-modal-card-back";
        const el = document.getElementById(targetId);

        if (el) {
          const canvas = await html2canvas(el, {
            scale: 3,
            useCORS: true,
            backgroundColor: null,
          });
          const link = document.createElement("a");
          link.download = `Kartu_Pelajar_${sideToCapture.toUpperCase()}_${student.nisn || "Siswa"}_${student.name.replace(/\s+/g, "_")}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
      }

      setExportSuccess("Gambar Kartu Pelajar berhasil diunduh!");
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error("Gagal mengunduh gambar kartu:", err);
      alert("Gagal mengunduh gambar kartu. Pastikan koneksi dan izin gambar aktif.");
    } finally {
      setIsExporting(false);
    }
  };

  // Handler: Download as PDF
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    try {
      const frontEl = document.getElementById("print-modal-card-front");
      const backEl = document.getElementById("print-modal-card-back");

      if (!frontEl || !backEl) {
        alert("Elemen kartu tidak ditemukan.");
        return;
      }

      const canvasFront = await html2canvas(frontEl, { scale: 3, useCORS: true });
      const canvasBack = await html2canvas(backEl, { scale: 3, useCORS: true });

      // Create PDF formatted to A4 with CR80 dimensions
      // CR80: 85.6 mm x 53.98 mm
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const cardWidth = 85.6;
      const cardHeight = 53.98;
      const marginX = 18;
      const marginY = 25;

      // Header on PDF
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("KARTU PELAJAR RESMI PKBM ASKARA", 105, 15, { align: "center" });
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Nama Siswa: ${student.name}  |  NISN: ${student.nisn || "-"}  |  Program: ${student.packet || "Paket C"}`,
        105,
        20,
        { align: "center" }
      );

      // Front Image
      const imgFront = canvasFront.toDataURL("image/png");
      pdf.addImage(imgFront, "PNG", marginX, marginY, cardWidth, cardHeight);

      // Back Image
      const imgBack = canvasBack.toDataURL("image/png");
      pdf.addImage(imgBack, "PNG", marginX + cardWidth + 8, marginY, cardWidth, cardHeight);

      // Cutting Guide Line
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.rect(marginX - 1, marginY - 1, cardWidth + 2, cardHeight + 2);
      pdf.rect(marginX + cardWidth + 7, marginY - 1, cardWidth + 2, cardHeight + 2);

      // Instruction Text
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text("Garis putus-putus merupakan panduan batas potong ukuran kartu ATM standar (85.60 mm x 53.98 mm).", 105, marginY + cardHeight + 10, { align: "center" });

      pdf.save(`Kartu_Pelajar_${student.nisn || "Siswa"}_${student.name.replace(/\s+/g, "_")}.pdf`);

      setExportSuccess("Berkas PDF Kartu Pelajar siap cetak berhasil diunduh!");
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error("Gagal membuat PDF kartu:", err);
      alert("Gagal membuat PDF kartu pelajar.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* ── ON-SCREEN MODAL PREVIEW & CONTROLS ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 print:hidden">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-8">
          {/* Header Modal */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Cetak Kartu Tanda Pelajar
                </h3>
                <p className="text-xs text-slate-400">
                  Ukuran Standar Kartu ATM / CR80 (85.60 mm × 53.98 mm)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme & Layout Switchers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            {/* Theme Selector */}
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Pilih Tema Kartu</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTheme("emerald")}
                  className={`py-1.5 px-2 rounded-xl text-left flex items-center gap-2 border transition ${
                    theme === "emerald"
                      ? "bg-emerald-950 border-emerald-500 text-emerald-200"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Emerald Askara</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("indigo")}
                  className={`py-1.5 px-2 rounded-xl text-left flex items-center gap-2 border transition ${
                    theme === "indigo"
                      ? "bg-indigo-950 border-indigo-500 text-indigo-200"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                  <span className="truncate">Royal Sapphire</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("navy")}
                  className={`py-1.5 px-2 rounded-xl text-left flex items-center gap-2 border transition ${
                    theme === "navy"
                      ? "bg-sky-950 border-sky-500 text-sky-200"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-sky-400 shrink-0" />
                  <span className="truncate">Classic Navy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("maroon")}
                  className={`py-1.5 px-2 rounded-xl text-left flex items-center gap-2 border transition ${
                    theme === "maroon"
                      ? "bg-rose-950 border-rose-500 text-rose-200"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate">Royal Maroon</span>
                </button>
              </div>
            </div>

            {/* Print Layout Selector */}
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Format Sisi Cetak</span>
              </label>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPrintLayout("both")}
                  className={`py-2 px-1 rounded-xl text-center border transition ${
                    printLayout === "both"
                      ? "bg-emerald-600 border-emerald-400 text-white font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Bolak-Balik
                </button>

                <button
                  type="button"
                  onClick={() => setPrintLayout("front")}
                  className={`py-2 px-1 rounded-xl text-center border transition ${
                    printLayout === "front"
                      ? "bg-emerald-600 border-emerald-400 text-white font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Depan Saja
                </button>

                <button
                  type="button"
                  onClick={() => setPrintLayout("back")}
                  className={`py-2 px-1 rounded-xl text-center border transition ${
                    printLayout === "back"
                      ? "bg-emerald-600 border-emerald-400 text-white font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Belakang Saja
                </button>
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {exportSuccess && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* 3D Interactive Card Preview Area */}
          <div className="py-4 px-2 bg-slate-950/80 rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
            <StudentIDCard
              student={student}
              institution={institution}
              theme={theme}
              side="flipper"
              idPrefix="print-modal-card"
              showFlipButton={true}
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Direct Print */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isExporting}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>

            {/* Download High-Res PNG */}
            <button
              type="button"
              onClick={() => handleDownloadPNG(printLayout)}
              disabled={isExporting}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition border border-slate-700 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>{isExporting ? "Menyiapkan..." : "Unduh Gambar PNG"}</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition border border-slate-700 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Unduh Format PDF</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
            💡 <strong>Tips Cetak:</strong> Gunakan kertas PVC Card / Glossy Photo Paper dengan pengaturan skala 100% (Actual Size) di menu cetak browser.
          </p>
        </div>
      </div>

      {/* ── DEDICATED PRINT DOM CONTAINER (FOR WINDOW.PRINT()) ── */}
      <div
        ref={printRef}
        className="hidden print:block fixed inset-0 bg-white p-0 m-0 z-[9999]"
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#ffffff",
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
              body {
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `
        }} />

        <div className="flex flex-col items-center justify-start gap-8 pt-4">
          <div className="text-center pb-2 border-b border-slate-300 w-full max-w-xl">
            <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wider">
              KARTU PELAJAR PKBM ASKARA
            </h2>
            <p className="text-[10px] text-slate-600">
              Standar ISO 7810 ID-1 (CR80: 85.60 mm × 53.98 mm) • Siswa: {student.name} ({cleanNISN(student)})
            </p>
          </div>

          {/* Cards side by side with dotted cut borders */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {(printLayout === "both" || printLayout === "front") && (
              <div className="p-1 border border-dashed border-slate-400 rounded-2xl inline-block bg-white">
                <StudentIDCard
                  student={student}
                  institution={institution}
                  theme={theme}
                  side="front"
                  idPrefix="print-page-front"
                  showFlipButton={false}
                />
              </div>
            )}

            {(printLayout === "both" || printLayout === "back") && (
              <div className="p-1 border border-dashed border-slate-400 rounded-2xl inline-block bg-white">
                <StudentIDCard
                  student={student}
                  institution={institution}
                  theme={theme}
                  side="back"
                  idPrefix="print-page-back"
                  showFlipButton={false}
                />
              </div>
            )}
          </div>

          <div className="text-center text-[9px] text-slate-500 max-w-md pt-4">
            <p>✂️ Gunting tepat pada garis putus-putus terluar. Untuk laminasi atau pencetakan kartu PVC, gunakan pengaturan rasio 1:1.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function cleanNISN(st: StudentCardData) {
  return st.nisn && st.nisn !== "-" ? st.nisn : `ASK-${st.id.substring(0, 8)}`;
}
