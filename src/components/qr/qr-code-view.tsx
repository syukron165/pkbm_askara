"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Maximize2, Minimize2, RefreshCw, Copy, Check } from "lucide-react";

interface QRCodeViewProps {
  value: string;
  size?: number;
  title?: string;
  subtitle?: string;
  showControls?: boolean;
  darkColor?: string;
  lightColor?: string;
  allowFullscreen?: boolean;
}

export function QRCodeView({
  value,
  size = 240,
  title,
  subtitle,
  showControls = true,
  darkColor = "#0f172a",
  lightColor = "#ffffff",
  allowFullscreen = true,
}: QRCodeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(
      value,
      {
        width: size * 2,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: "H",
      },
      (err, url) => {
        if (err) {
          console.error("QR Code generation error:", err);
          return;
        }
        setDataUrl(url);
      }
    );
  }, [value, size, darkColor, lightColor]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `QR-Presensi-Askara-${Date.now()}.png`;
    a.click();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-in fade-in">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition flex items-center gap-2 text-sm font-bold border border-white/10"
          >
            <Minimize2 className="w-5 h-5" />
            <span>Tutup Layar Penuh</span>
          </button>

          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full">
            {title && <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}

            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt="QR Code Fullscreen"
                className="w-72 h-72 mx-auto rounded-2xl border-4 border-slate-100 shadow-inner"
              />
            ) : (
              <div className="w-72 h-72 mx-auto flex items-center justify-center bg-slate-50 rounded-2xl">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            )}

            <p className="mt-4 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
              📸 Arahkan kamera HP siswa ke QR Code ini untuk verifikasi presensi
            </p>
          </div>
        </div>
      )}

      {/* Main QR Card */}
      <div className="relative p-4 bg-white rounded-2xl border border-slate-200/80 shadow-md inline-block">
        {dataUrl ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dataUrl}
              alt="QR Code"
              style={{ width: size, height: size }}
              className="rounded-xl shadow-xs"
            />
          </div>
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center bg-slate-50 rounded-xl"
          >
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {title && <h4 className="font-bold text-slate-900 text-sm mt-3">{title}</h4>}
      {subtitle && <p className="text-xs text-slate-500 text-center max-w-xs mt-0.5">{subtitle}</p>}

      {/* Action Buttons */}
      {showControls && dataUrl && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
          {allowFullscreen && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-2xs"
              title="Perbesar / Proyektor"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Perbesar</span>
            </button>
          )}
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-emerald-200 shadow-2xs"
            title="Unduh Gambar QR"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh QR</span>
          </button>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200 shadow-2xs"
            title="Salin Kode Sesi"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Tersalin!" : "Salin Kode"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
