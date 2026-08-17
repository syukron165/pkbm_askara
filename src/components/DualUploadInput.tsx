"use client";

import React, { useState, useRef, useEffect } from "react";
import { compressFile } from "@/lib/compression";
import {
  Camera,
  UploadCloud,
  FileText,
  Check,
  X,
  RefreshCw,
  Loader2,
  SwitchCamera,
  Eye,
  AlertCircle,
} from "lucide-react";

interface DualUploadInputProps {
  label: string;
  value?: string | null;
  onChange: (url: string, fileName?: string) => void;
  accept?: string;
  required?: boolean;
  folder?: string;
  description?: string;
}

export default function DualUploadInput({
  label,
  value,
  onChange,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp",
  required = false,
  folder = "pendaftaran",
  description,
}: DualUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera stream
  const startCamera = async (mode: "user" | "environment") => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Perangkat tidak mendukung akses kamera langsung.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Izin kamera ditolak. Berikan izin kamera di pengaturan browser Anda."
          : err.message || "Gagal membuka kamera."
      );
    }
  };

  useEffect(() => {
    if (showCameraModal) {
      startCamera(facingMode);
    } else {
      stopCamera();
      setCapturedPreview(null);
    }
    return () => {
      stopCamera();
    };
  }, [showCameraModal, facingMode]);

  // Handle standard file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      const compressedFile = await compressFile(file);
      setCompressing(false);

      setUploading(true);
      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await fetch(`/api/upload?folder=${folder}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url, data.originalName || file.name);
      } else {
        alert(data.error || "Gagal mengunggah berkas");
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Terjadi kesalahan jaringan saat mengunggah berkas");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Capture photo from video stream
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPreview(dataUrl);

    // Convert dataURL to Blob and upload
    try {
      setUploading(true);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new globalThis.File(
          [blob],
          `scan_${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/upload?folder=${folder}`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          onChange(data.url, data.originalName || file.name);
          setShowCameraModal(false);
        } else {
          alert(data.error || "Gagal mengunggah hasil foto");
        }
        setUploading(false);
      }, "image/jpeg", 0.9);
    } catch (e) {
      console.error(e);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {value && (
          <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Berkas Terpasang
          </span>
        )}
      </div>

      {description && <p className="text-[11px] text-slate-500">{description}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      {/* When no file uploaded */}
      {!value ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || compressing}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl font-bold text-slate-700 transition active:scale-95"
          >
            {(uploading || compressing) ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4 text-indigo-600" />
            )}
            <span>{compressing ? "Mengompresi..." : (uploading ? "Mengunggah..." : "Pilih File / PDF")}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCameraModal(true)}
            disabled={uploading}
            className="flex items-center justify-center gap-2 p-3 bg-indigo-50/70 hover:bg-indigo-100 border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-xl font-bold text-indigo-900 transition active:scale-95"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Ambil Foto Kamera</span>
          </button>
        </div>
      ) : (
        /* When file already uploaded */
        <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-900 text-xs block truncate">
                {value.split("/").pop() || "Dokumen_Terunggah"}
              </span>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-indigo-600 hover:underline font-semibold inline-flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> Lihat Berkas ↗
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition"
              title="Ganti Berkas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange("", "")}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
              title="Hapus Berkas"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL KAMERA WEBRTC */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-700 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="font-bold text-sm">Ambil Foto Dokumen</h4>
                  <p className="text-[10px] text-slate-400">{label}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewfinder */}
            <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-rose-400 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto" />
                  <p className="text-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Document Card Guide Outline */}
                  <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                    <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-white self-start">
                      Posisikan dokumen di dalam kotak
                    </span>
                    <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-slate-300 self-end">
                      Pastikan teks terbaca jelas
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 bg-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
                }}
                className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition flex items-center justify-center"
                title="Putar Kamera Depan/Belakang"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={uploading || !!cameraError}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-full shadow-lg flex items-center gap-2 transition"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full bg-white" />
                    <span>Ambil Foto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCameraModal(false);
                  fileInputRef.current?.click();
                }}
                className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 transition"
                title="Pilih dari Galeri/File Saja"
              >
                <UploadCloud className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
