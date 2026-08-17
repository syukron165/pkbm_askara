"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  MapPin,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Camera,
  BookOpen,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Users,
  RefreshCw,
  Award,
  Layers,
} from "lucide-react";
import { QRCameraScanner } from "@/components/qr/qr-camera-scanner";
import { StudentIDCardQR } from "@/components/qr/student-id-card-qr";

interface AttendanceItem {
  id: string;
  date: string;
  title: string;
  type: "MAPEL" | "CLUB" | "GPS";
  teacherOrMentor: string;
  checkInTime: string;
  method: "SCAN_QR_GURU" | "SCAN_BY_GURU_HP" | "GPS_MANDIRI";
  status: "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT";
}

export default function SiswaPresensiPage() {
  const [activeTab, setActiveTab] = useState<"scan" | "my-card" | "history" | "gps">("scan");
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student Profile Data
  const [studentInfo, setStudentInfo] = useState({
    id: "std-1",
    name: "Budi Santoso",
    nis: "2025.10.048",
    className: "Paket C - Kelas X Merdeka",
    program: "Paket C (Setara SMA)",
    status: "AKTIF",
  });

  // Recent attendance history
  const [historyList, setHistoryList] = useState<AttendanceItem[]>([
    {
      id: "hist-1",
      date: new Date().toISOString().split("T")[0],
      title: "Matematika Terapan",
      type: "MAPEL",
      teacherOrMentor: "Drs. Hendra Gunawan",
      checkInTime: "07:55 WIB",
      method: "SCAN_QR_GURU",
      status: "HADIR",
    },
    {
      id: "hist-2",
      date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      title: "Club Robotik & Coding AI",
      type: "CLUB",
      teacherOrMentor: "Dewi Anggraini, S.Kom.",
      checkInTime: "13:28 WIB",
      method: "SCAN_QR_GURU",
      status: "HADIR",
    },
    {
      id: "hist-3",
      date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
      title: "Bahasa Indonesia",
      type: "MAPEL",
      teacherOrMentor: "Nurul Aini, S.Pd.",
      checkInTime: "09:48 WIB",
      method: "SCAN_BY_GURU_HP",
      status: "HADIR",
    },
    {
      id: "hist-4",
      date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
      title: "Presensi Gedung PKBM Askara",
      type: "GPS",
      teacherOrMentor: "Sistem Otomatis",
      checkInTime: "07:35 WIB",
      method: "GPS_MANDIRI",
      status: "HADIR",
    },
  ]);

  const handleScanSuccess = async (decodedText: string) => {
    setShowScanner(false);
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/presensi/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrData: decodedText,
          studentId: studentInfo.id,
          studentName: studentInfo.name,
          nis: studentInfo.nis,
          className: studentInfo.className,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setScanResult(data);
        // Add to history
        const newHist: AttendanceItem = {
          id: `hist-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          title: data.sessionTitle || data.session?.title || "Sesi Pelajaran / Club",
          type: data.sessionType || data.session?.type || "MAPEL",
          teacherOrMentor: data.teacherName || data.session?.teacherName || "Guru Pengajar",
          checkInTime: data.checkInTime || "Baru Saja",
          method: "SCAN_QR_GURU",
          status: "HADIR",
        };
        setHistoryList((prev) => [newHist, ...prev]);
      } else {
        setErrorMessage(data.error || "Gagal memverifikasi QR Code presensi.");
      }
    } catch (err: any) {
      setErrorMessage("Terjadi kesalahan saat memproses presensi. Coba beberapa saat lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/siswa" className="hover:text-slate-800 transition">
          Dashboard Siswa
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-emerald-700 font-bold">Presensi 2 Arah (QR & GPS)</span>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>Presensi Sesi Mata Pelajaran & Club Belajar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Presensi Mandiri Siswa</h1>
            <p className="mt-1.5 text-indigo-200/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Pindai QR Code sesi yang ditampilkan oleh Guru / Pembina Club Belajar, atau tunjukkan Kartu QR Anda jika terkendala memindai dari ponsel.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 text-center sm:text-right">
            <p className="text-[11px] text-indigo-200 uppercase font-semibold">Tingkat Kehadiran</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">96.8%</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">24 Hadir • 1 Izin • 0 Alpa</p>
          </div>
        </div>
      </div>

      {/* Error & Success Messages */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-rose-500 font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-white rounded-2xl border border-slate-200/80 p-1.5 gap-1.5 shadow-xs overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("scan");
            setScanResult(null);
          }}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "scan"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/20"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>1. Pindai QR Sesi Guru</span>
        </button>

        <button
          onClick={() => setActiveTab("my-card")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "my-card"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/20"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>2. Kartu QR Siswa (Discan Guru)</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/20"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>3. Riwayat Kehadiran</span>
        </button>

        <button
          onClick={() => setActiveTab("gps")}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "gps"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/20"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>4. Presensi GPS</span>
        </button>
      </div>

      {/* TAB 1: PINDAI QR SESI GURU (FLOW UTAMA) */}
      {activeTab === "scan" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm text-center">
          {scanResult ? (
            /* HASIL SCAN BERHASIL */
            <div className="py-6 max-w-md mx-auto space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Presensi Berhasil Terverifikasi!</h3>
                <p className="text-xs text-slate-500 mt-1">{scanResult.message}</p>
              </div>

              {/* Detail Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Mata Pelajaran / Club:</span>
                  <span className="font-bold text-slate-800">
                    {scanResult.sessionTitle || scanResult.session?.title || "Matematika Terapan"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Tutor / Pembina:</span>
                  <span className="font-bold text-indigo-700">
                    {scanResult.teacherName || scanResult.session?.teacherName || "Drs. Hendra Gunawan"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Waktu Check-In:</span>
                  <span className="font-mono font-bold text-slate-800">{scanResult.checkInTime || "08:00 WIB"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Status Kehadiran:</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">
                    HADIR DI KELAS
                  </span>
                </div>
              </div>

              <button
                onClick={() => setScanResult(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Pindai Sesi Pelajaran Lainnya
              </button>
            </div>
          ) : showScanner ? (
            /* SCANNER MODAL / INLINE */
            <div className="py-2">
              <QRCameraScanner
                title="Pindai QR Code Sesi Guru"
                subtitle="Arahkan kamera ke QR Code yang ditampilkan oleh Guru di proyektor / HP"
                onScanSuccess={handleScanSuccess}
                onClose={() => setShowScanner(false)}
              />
            </div>
          ) : (
            /* LANDING SCAN STATE */
            <div className="py-8 max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto border-2 border-indigo-100 shadow-sm">
                <Camera className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Siap Melakukan Presensi Kelas?</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Buka kamera pemindai untuk membaca QR Code sesi yang sedang ditampilkan oleh Guru mata pelajaran atau Pembina Club Belajar Anda.
                </p>
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-slate-600 text-left space-y-1.5">
                <p className="font-bold text-indigo-900">💡 Petunjuk Praktis Siswa:</p>
                <p>1. Guru / Pembina akan menampilkan QR Code Sesi di depan kelas / layar HP.</p>
                <p>2. Klik tombol di bawah untuk membuka kamera scanner HP Anda.</p>
                <p>3. Jika kamera HP Anda terkendala, buka tab <strong>"Kartu QR Siswa"</strong> agar Guru memindai dari HP Guru.</p>
              </div>

              <button
                onClick={() => setShowScanner(true)}
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition shadow-lg shadow-emerald-900/20 hover-lift flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>{submitting ? "Memproses..." : "Buka Kamera QR Scanner Sekarang"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KARTU QR SISWA (ARAH KE-2: GURU SCAN HP SISWA) */}
      {activeTab === "my-card" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="text-center max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-slate-900">Kartu Presensi Digital Siswa</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gunakan QR Code di bawah jika Anda terkendala kamera atau kuota. Tunjukkan QR ini kepada Guru / Pembina Club agar dipindai menggunakan HP Guru.
            </p>
          </div>

          <StudentIDCardQR student={studentInfo} />
        </div>
      )}

      {/* TAB 3: RIWAYAT KEHADIRAN */}
      {activeTab === "history" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Riwayat Presensi Siswa</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daftar kehadiran mata pelajaran dan kegiatan club belajar</p>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">Total: {historyList.length} Catatan</span>
          </div>

          <div className="divide-y divide-slate-100">
            {historyList.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.type === "MAPEL"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        : item.type === "CLUB"
                        ? "bg-amber-50 text-amber-700 border border-amber-100"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}
                  >
                    {item.type === "MAPEL" ? <BookOpen className="w-5 h-5" /> : item.type === "CLUB" ? <Award className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pengampu: <span className="font-semibold text-slate-700">{item.teacherOrMentor}</span> • {item.date}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-400 font-mono">Check-in: {item.checkInTime}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] font-semibold text-indigo-600">
                        {item.method === "SCAN_QR_GURU"
                          ? "Scan QR Guru"
                          : item.method === "SCAN_BY_GURU_HP"
                          ? "Scan via HP Guru"
                          : "GPS"}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold shrink-0">
                  HADIR
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PRESENSI GPS */}
      {activeTab === "gps" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Presensi Kedatangan Gedung (GPS)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Validasi lokasi GPS untuk kehadiran harian di gedung PKBM Askara (Radius maksimal: 50 meter).
            </p>
          </div>
          <button
            onClick={() => alert("Presensi GPS terverifikasi! Radius 12 meter dari Gedung PKBM Askara.")}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span>Kirim Lokasi GPS Sekarang</span>
          </button>
        </div>
      )}
    </div>
  );
}
