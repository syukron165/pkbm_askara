"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Upload,
  KeyRound,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Smartphone,
  Sparkles,
} from "lucide-react";
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
  const [isStarting, setIsStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanningMode, setScanningMode] = useState<"camera" | "upload" | "manual">("camera");

  // Multi-camera support
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isFrontFacing, setIsFrontFacing] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Play beep sound on scan
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
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

  const handleSuccessfulScan = useCallback((decodedText: string) => {
    if (!isContinuous && decodedText === lastScanned) return;

    setLastScanned(decodedText);
    playBeep();

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {}
    }

    onScanSuccess(decodedText);

    if (!isContinuous) {
      stopScanner();
    }
  }, [isContinuous, lastScanned, onScanSuccess]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn("Error stopping scanner instance:", e);
      }
    }
    if (isMountedRef.current) {
      setIsScanning(false);
      setIsStarting(false);
    }
  };

  const startScannerWithCamera = async (cameraIdOrConstraint: string | MediaTrackConstraints) => {
    if (!isMountedRef.current) return;
    setIsStarting(true);
    setCameraError(null);

    try {
      // Ensure existing scanner is stopped first
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {}
      }

      // Check if scanner DOM element is ready
      const container = document.getElementById(scannerId);
      if (!container) {
        throw new Error("Elemen pemindai belum siap di layar. Silakan muat ulang.");
      }

      const html5QrCode = new Html5Qrcode(scannerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      // Dynamic qrbox to avoid crashes on small screens
      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edge = Math.floor(minEdge * 0.72);
          return {
            width: Math.max(160, Math.min(edge, 280)),
            height: Math.max(160, Math.min(edge, 280)),
          };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        cameraIdOrConstraint,
        config,
        (decodedText) => {
          if (isMountedRef.current) {
            handleSuccessfulScan(decodedText);
          }
        },
        () => {
          // silent frame callback
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
        setIsStarting(false);
      }
    } catch (err: any) {
      console.error("Camera scan start error:", err);
      if (isMountedRef.current) {
        setIsScanning(false);
        setIsStarting(false);

        let errorMsg = "Tidak dapat mengakses kamera.";
        const msg = err?.message || String(err);

        if (msg.includes("Permission denied") || msg.includes("NotAllowedError")) {
          errorMsg = "Izin akses kamera ditolak. Berikan izin kamera pada peramban/browser ponsel Anda.";
        } else if (msg.includes("OverconstrainedError") || msg.includes("NotFoundError")) {
          errorMsg = "Kamera belakang tidak ditemukan atau sedang digunakan oleh aplikasi lain.";
        } else if (typeof window !== "undefined" && !window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
          errorMsg = "Akses kamera langsung membutuhkan koneksi aman (HTTPS). Gunakan tombol 'Ambil Foto QR dengan Kamera HP' di bawah.";
        } else {
          errorMsg = msg || "Tidak dapat mengaktifkan kamera. Coba ganti kamera atau gunakan foto kartu.";
        }

        setCameraError(errorMsg);
      }
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      // Try to discover cameras on device first
      let devices: Array<{ id: string; label: string }> = [];
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (e) {
        console.warn("Could not enumerate cameras, falling back to facingMode constraint", e);
      }

      if (devices && devices.length > 0) {
        setAvailableCameras(devices);

        // Find back camera if available
        const backCam = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("belakang") ||
            d.label.toLowerCase().includes("environment") ||
            d.label.toLowerCase().includes("0")
        );

        const chosenCameraId = selectedCameraId || (backCam ? backCam.id : devices[devices.length - 1].id);
        setSelectedCameraId(chosenCameraId);
        await startScannerWithCamera(chosenCameraId);
      } else {
        // Fallback using facingMode
        await startScannerWithCamera({ facingMode: "environment" });
      }
    } catch (err: any) {
      // Last resort fallback
      try {
        await startScannerWithCamera({ facingMode: "environment" });
      } catch (e: any) {
        if (isMountedRef.current) {
          setCameraError(e?.message || "Gagal membuka kamera.");
        }
      }
    }
  };

  // Switch between front/back or different cameras
  const handleSwitchCamera = async () => {
    if (availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCam = availableCameras[nextIndex];
      setSelectedCameraId(nextCam.id);
      await startScannerWithCamera(nextCam.id);
    } else {
      const nextFacing = !isFrontFacing;
      setIsFrontFacing(nextFacing);
      await startScannerWithCamera({ facingMode: nextFacing ? "user" : "environment" });
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (scanningMode === "camera") {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanningMode]);

  // Handle Image File Scanning
  const handleImageFileScan = async (file: File) => {
    try {
      setCameraError(null);
      const html5QrCode = new Html5Qrcode(`temp-upload-${scannerId}`);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleSuccessfulScan(decodedText);
    } catch (err) {
      setCameraError("QR Code tidak terdeteksi pada gambar. Pastikan gambar jelas dan fokus pada kode QR.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan(manualCode.trim());
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden max-w-lg w-full mx-auto text-left">
      {/* Hidden container for image decoding */}
      <div id={`temp-upload-${scannerId}`} className="hidden" />

      {/* Hidden native mobile camera input (capture=environment) */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFileScan(file);
        }}
      />

      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span>{title}</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-indigo-200/80 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5">
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
          <span>Unggah Foto</span>
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
      <div className="p-4 sm:p-6">
        {scanningMode === "camera" && (
          <div className="space-y-4">
            {/* Camera Controls Bar */}
            <div className="flex items-center justify-between gap-2 text-xs">
              {availableCameras.length > 1 ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-slate-400 text-[11px] font-semibold shrink-0">Lensa:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedCameraId(id);
                      startScannerWithCamera(id);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 truncate focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {availableCameras.map((cam, idx) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Kamera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">
                  {isScanning ? "🟢 Kamera HP Aktif" : isStarting ? "🟡 Mengaktifkan kamera..." : "⚪ Kamera Siap"}
                </span>
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-slate-200/80"
                  title="Ganti Kamera Depan/Belakang"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Ganti Kamera</span>
                </button>
                <button
                  type="button"
                  onClick={startScanner}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200/80"
                  title="Muat Ulang Kamera"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isStarting ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Video Viewport Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 aspect-square flex items-center justify-center shadow-inner">
              <div id={scannerId} className="w-full h-full" />

              {/* Visual Scanning Target Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 sm:w-56 h-48 sm:h-56 border-2 border-dashed border-emerald-400/80 rounded-2xl animate-pulse flex flex-col justify-between p-2 shadow-2xl">
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

            {/* Native Mobile Camera Button Fallback */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
              >
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>Ambil Foto QR dengan Kamera HP (Alternatif Cepat)</span>
              </button>
            </div>

            {cameraError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Kendala Akses Kamera</p>
                  <p className="text-rose-700/90 leading-relaxed">{cameraError}</p>
                  <div className="pt-1.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startScanner}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700 transition"
                    >
                      Coba Lagi
                    </button>
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg font-bold text-[11px] hover:bg-rose-100 transition"
                    >
                      Buka Kamera HP Native
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {scanningMode === "upload" && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition text-center group aspect-video">
              <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 mb-2 transition" />
              <p className="text-xs font-bold text-slate-700">Pilih file tangkapan layar / foto QR Code</p>
              <p className="text-[11px] text-slate-400 mt-1">Mendukung format PNG, JPG, JPEG, WEBP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFileScan(file);
                }}
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
                placeholder="Contoh: ASKARA-STUDENT:... atau ASKARA-SESI:..."
                className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Ketik atau tempel kode string QR kartu siswa/sesi presensi di sini.
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
