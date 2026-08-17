"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, AlertCircle, CheckCircle2, Upload, KeyRound, Volume2, VolumeX } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface QRCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  isContinuous?: boolean;
}

export function QRCameraScanner({
  onScanSuccess,
  onClose,
  title = "Pindai Kode QR",
  subtitle = "Arahkan kamera ke kode QR presensi hingga kotak fokus berubah hijau",
  isContinuous = false,
}: QRCameraScannerProps) {
  const [scannerId] = useState(() => `qr-reader-${Math.random().toString(36).substring(2, 9)}`);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanningMode, setScanningMode] = useState<"camera" | "upload" | "manual">("camera");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play beep sound on scan
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      // Synthesize a quick beep using Web Audio API if no audio file
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio feedback not supported", e);
    }
  };

  const handleSuccessfulScan = (decodedText: string) => {
    if (!isContinuous && decodedText === lastScanned) return;

    setLastScanned(decodedText);
    playBeep();

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    onScanSuccess(decodedText);

    if (!isContinuous) {
      stopScanner();
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode(scannerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // scanning frame callback - silent
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Camera scan start error:", err);
      setCameraError(
        err?.message || "Tidak dapat mengakses kamera. Pastikan izin kamera telah diizinkan atau gunakan opsi unggah foto/kode manual."
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (scanningMode === "camera") {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [scanningMode]);

  // Handle Image File Scanning
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode(`temp-upload-${scannerId}`);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleSuccessfulScan(decodedText);
    } catch (err) {
      setCameraError("QR Code tidak terdeteksi pada gambar yang diunggah. Coba gunakan gambar yang lebih jelas.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan(manualCode.trim());
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden max-w-lg w-full mx-auto">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-indigo-200/80 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition"
            title={soundEnabled ? "Nonaktifkan Suara" : "Aktifkan Suara"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
          {onClose && (
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1.5 text-xs font-bold">
        <button
          onClick={() => setScanningMode("camera")}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            scanningMode === "camera"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Kamera Langsung</span>
        </button>
        <button
          onClick={() => setScanningMode("upload")}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            scanningMode === "upload"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Unggah Foto QR</span>
        </button>
        <button
          onClick={() => setScanningMode("manual")}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            scanningMode === "manual"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Input Manual</span>
        </button>
      </div>

      {/* Scanner View Area */}
      <div className="p-6">
        {scanningMode === "camera" && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 aspect-square flex items-center justify-center shadow-inner">
              <div id={scannerId} className="w-full h-full" />

              {/* Visual Scanning Target Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-dashed border-emerald-400/80 rounded-2xl animate-pulse flex flex-col justify-between p-2 shadow-2xl">
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  </div>
                  <div className="text-center text-[10px] font-bold text-emerald-300 bg-slate-900/80 py-1 px-2.5 rounded-full mx-auto backdrop-blur-xs">
                    Fokuskan QR Code di sini
                  </div>
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                  </div>
                </div>
              </div>
            </div>

            {cameraError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Kendala Akses Kamera</p>
                  <p className="mt-0.5 text-rose-700/90 leading-relaxed">{cameraError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {scanningMode === "upload" && (
          <div className="space-y-4">
            <div id={`temp-upload-${scannerId}`} className="hidden" />
            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition text-center group aspect-video">
              <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 mb-2 transition" />
              <p className="text-xs font-bold text-slate-700">Pilih file tangkapan layar / foto QR Code</p>
              <p className="text-[11px] text-slate-400 mt-1">Mendukung format PNG, JPG, JPEG, WEBP</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {cameraError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{cameraError}</p>
              </div>
            )}
          </div>
        )}

        {scanningMode === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Masukkan Kode Sesi / ID Token Presensi
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Contoh: ASKARA-SESI:sch-c-1:... atau ASKARA-STUDENT:..."
                className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Kode sesi presensi dapat disalin dari layar tutor/guru pengajar.
              </p>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-900/20"
            >
              Verifikasi & Kirim Presensi
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
