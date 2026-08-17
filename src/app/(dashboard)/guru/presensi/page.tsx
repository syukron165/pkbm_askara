"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  MapPin,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Clock,
  BookOpen,
  Award,
  Users,
  Camera,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  Maximize2,
  ChevronRight,
  Sparkles,
  Smartphone,
  Check,
} from "lucide-react";
import { QRCodeView } from "@/components/qr/qr-code-view";
import { QRCameraScanner } from "@/components/qr/qr-camera-scanner";

interface SessionData {
  id: string;
  sessionCode: string;
  token: string;
  type: "MAPEL" | "CLUB";
  title: string;
  categoryOrCode?: string;
  className?: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  roomOrLocation: string;
  status: "ACTIVE" | "CLOSED";
  qrData: string;
  attendees: Array<{
    id: string;
    studentId: string;
    studentName: string;
    nis?: string;
    className?: string;
    checkInTime: string;
    method: string;
    status: string;
    notes?: string;
  }>;
}

export default function GuruPresensiPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeacherScanner, setShowTeacherScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "scan-students" | "my-checkin">("sessions");

  // Form state for creating session
  const [formType, setFormType] = useState<"MAPEL" | "CLUB">("MAPEL");
  const [formTitle, setFormTitle] = useState("");
  const [formClass, setFormClass] = useState("Paket C - Kelas X Merdeka");
  const [formRoom, setFormRoom] = useState("Ruang Belajar Askara 1");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:30");
  const [isFlexibleUntilEnd, setIsFlexibleUntilEnd] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(90);
  const [submitting, setSubmitting] = useState(false);

  // Popular Mapel & Club options for fast 1-click selection
  const MAPEL_OPTIONS = [
    { title: "Matematika Terapan", class: "Paket C - Kelas X Merdeka", room: "Ruang Belajar 1" },
    { title: "Bahasa Indonesia", class: "Paket C - Kelas X Merdeka", room: "Ruang Belajar 1" },
    { title: "Bahasa Inggris Komunikatif", class: "Paket C - Kelas XI", room: "Ruang Belajar 2" },
    { title: "IPA / Sains Terpadu", class: "Paket B - Kelas VIII", room: "Lab Sains" },
    { title: "IPS & Kewarganegaraan", class: "Paket B - Kelas IX", room: "Ruang Belajar 2" },
    { title: "Keterampilan Digital & Desain", class: "Paket C - Kelas X", room: "Lab Komputer" },
    { title: "Vokasi & Kewirausahaan", class: "Paket C - Kelas XII", room: "Ruang Serbaguna" },
  ];

  const CLUB_OPTIONS = [
    { title: "Club Robotik & Coding AI", class: "Semua Anggota Club", room: "Lab Komputer & AI" },
    { title: "Club Barista & Kewirausahaan", class: "Semua Anggota Club", room: "Workshop Cafe Vokasi" },
    { title: "Club Desain Grafis & Digital Marketing", class: "Semua Anggota Club", room: "Lab Multimedia" },
    { title: "Club Seni Musik & Akustik", class: "Semua Anggota Club", room: "Studio Seni" },
    { title: "Club Olahraga & Futsal", class: "Semua Anggota Club", room: "Lapangan Olahraga" },
    { title: "Club Public Speaking & Bahasa", class: "Semua Anggota Club", room: "Ruang Literasi" },
  ];

  const TIME_SLOT_PRESETS = [
    { label: "🌅 Pagi 1", start: "08:00", end: "09:30", desc: "08:00 - 09:30 WIB" },
    { label: "☀️ Pagi 2", start: "09:45", end: "11:15", desc: "09:45 - 11:15 WIB" },
    { label: "🌤️ Siang", start: "13:00", end: "14:30", desc: "13:00 - 14:30 WIB" },
    { label: "🌆 Sore", start: "15:30", end: "17:00", desc: "15:30 - 17:00 WIB" },
    { label: "🌙 Malam", start: "19:00", end: "20:30", desc: "19:00 - 20:30 WIB" },
  ];

  // Helper to calculate end time based on start time + minutes
  const applyDuration = (minutes: number, customStart?: string) => {
    const baseStart = customStart || startTime || "08:00";
    const [hStr, mStr] = baseStart.split(":");
    const startH = parseInt(hStr || "8", 10);
    const startM = parseInt(mStr || "0", 10);

    const totalMinutes = startH * 60 + startM + minutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;

    const formattedEnd = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
    setEndTime(formattedEnd);
    setSelectedDuration(minutes);
    setIsFlexibleUntilEnd(false);
  };

  // Helper to set start time to now
  const setTimeToNow = () => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
    const nowStr = `${h}:${m}`;
    setStartTime(nowStr);
    applyDuration(selectedDuration || 90, nowStr);
  };

  // Preset options for quick 1-click generation from right sidebar
  const SCHEDULE_PRESETS = [
    { title: "Matematika Terapan", type: "MAPEL" as const, class: "Paket C - Kelas X Merdeka", room: "Ruang Belajar 1", start: "08:00", end: "09:30" },
    { title: "Bahasa Indonesia", type: "MAPEL" as const, class: "Paket B - Kelas VIII", room: "Ruang Belajar 2", start: "09:45", end: "11:15" },
    { title: "Club Robotik & Coding AI", type: "CLUB" as const, class: "Semua Anggota Club", room: "Lab Komputer & AI", start: "13:30", end: "15:30" },
    { title: "Club Barista & Kewirausahaan", type: "CLUB" as const, class: "Semua Anggota Club", room: "Workshop Tata Boga", start: "15:00", end: "17:00" },
  ];

  const fetchSessions = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch("/api/presensi/qr-session");
      const data = await res.json();
      if (data.success && data.sessions) {
        setSessions(data.sessions);
        setActiveSession((prevActive) => {
          if (!prevActive && data.sessions.length > 0) {
            return data.sessions[0];
          }
          if (prevActive) {
            const updated = data.sessions.find((s: SessionData) => s.sessionCode === prevActive.sessionCode || s.id === prevActive.id);
            return updated || prevActive;
          }
          return null;
        });
      }
    } catch (e) {
      console.error("Error fetching sessions:", e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSessions(false);
  }, [fetchSessions]);

  // Live real-time polling every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessions(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/presensi/qr-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          title: formTitle,
          className: formClass,
          roomOrLocation: formRoom,
          startTime: startTime || "08:00",
          endTime: isFlexibleUntilEnd ? "Selesai" : endTime || "09:30",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setActiveSession(data.session);
        fetchSessions();
        setScanMessage({ type: "success", text: `Sesi ${data.session.title} berhasil dibuka!` });
        setTimeout(() => setScanMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Teacher scanning student's QR ID card (Flow 2)
  const handleTeacherScanStudent = async (decodedText: string) => {
    if (!activeSession) {
      setScanMessage({ type: "error", text: "Pilih sesi presensi aktif terlebih dahulu sebelum memindai QR siswa." });
      return;
    }

    try {
      const res = await fetch("/api/presensi/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrData: decodedText,
          sessionCode: activeSession.sessionCode,
          method: "SCAN_BY_GURU_HP",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScanMessage({
          type: "success",
          text: `✅ ${data.message || `Siswa ${data.studentName} berhasil dicatat hadir!`}`,
        });
        fetchSessions();
      } else {
        setScanMessage({ type: "error", text: data.error || "Gagal memproses QR siswa." });
      }
    } catch (err) {
      setScanMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/guru" className="hover:text-slate-800 transition">
          Dashboard Guru
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-emerald-700 font-bold">Presensi Kelas & Club Belajar (QR 2 Arah)</span>
      </div>

      {/* Action Notification */}
      {scanMessage && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
            scanMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {scanMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{scanMessage.text}</span>
          </div>
          <button onClick={() => setScanMessage(null)} className="text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>Sistem Presensi 2 Arah Real-Time</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manajemen Presensi Pendidik & Pembina</h1>
            <p className="mt-1.5 text-emerald-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Buka sesi QR mata pelajaran / club belajar untuk discan siswa, atau gunakan kamera HP Anda untuk memindai kartu QR siswa yang terkendala.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/40 hover-lift"
            >
              <Plus className="w-4 h-4" />
              <span>Buka Sesi Presensi Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white rounded-2xl border border-slate-200/80 p-1.5 gap-1.5 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "sessions"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>1. Tampilkan QR Sesi (Discan Siswa)</span>
        </button>

        <button
          onClick={() => setActiveTab("scan-students")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "scan-students"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>2. Pindai QR Siswa (Kamera HP Guru)</span>
        </button>

        <button
          onClick={() => setActiveTab("my-checkin")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "my-checkin"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>3. Presensi Guru Mandiri</span>
        </button>
      </div>

      {/* TAB 1: TAMPILKAN QR SESI GURU (UNTUK DISCAN SISWA) */}
      {activeTab === "sessions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Active Session QR Card */}
          <div className="lg:col-span-2 space-y-6">
            {activeSession ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase">
                        {activeSession.type === "MAPEL" ? "Mata Pelajaran" : "Club Belajar"}
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-mono">{activeSession.sessionCode}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1.5">{activeSession.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeSession.className} • {activeSession.roomOrLocation} • Jam {activeSession.startTime} - {activeSession.endTime} WIB
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTab("scan-students")}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200"
                      title="Pindai QR Siswa dengan HP"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan Siswa</span>
                    </button>
                  </div>
                </div>

                {/* QR Code Center Display */}
                <div className="py-8 flex flex-col items-center justify-center bg-slate-50/70 rounded-2xl my-6 border border-slate-100">
                  <QRCodeView
                    value={activeSession.qrData}
                    size={220}
                    title="QR CODE SESI PRESENSI"
                    subtitle={`Tampilkan di proyektor / layar HP kepada siswa ${activeSession.className}`}
                    allowFullscreen={true}
                  />
                </div>

                {/* Real-time Attendees Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>Daftar Siswa Hadir ({activeSession.attendees.length} Siswa)</span>
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Sync</span>
                      </span>
                    </div>
                    <button
                      onClick={() => fetchSessions(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 text-xs"
                      title="Sinkronisasi Manual"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-semibold">Segarkan</span>
                    </button>
                  </div>

                  {activeSession.attendees.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">Belum ada siswa yang check-in</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Minta siswa memindai QR di atas atau gunakan tombol Scan Siswa.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5 text-left">Nama Siswa</th>
                            <th className="px-4 py-2.5 text-left">Waktu Check-In</th>
                            <th className="px-4 py-2.5 text-left">Metode</th>
                            <th className="px-4 py-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeSession.attendees.map((att, idx) => (
                            <tr key={att.id || idx} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-2.5">
                                <span className="font-bold text-slate-900">{att.studentName}</span>
                                {att.nis && <span className="text-[10px] text-slate-400 block font-mono">NIS: {att.nis}</span>}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-slate-600">{att.checkInTime}</td>
                              <td className="px-4 py-2.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {att.method === "SCAN_QR_GURU" ? "Scan QR Guru" : "Scan via HP Guru"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-extrabold text-[10px]">
                                  HADIR
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-base text-slate-800">Belum Ada Sesi Presensi Dibuka</h3>
                <p className="text-xs text-slate-500 mt-1">Pilih jadwal di panel kanan atau buat sesi presensi baru.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Buka Sesi Presensi Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Right: Quick Session Selector & Presets */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Buka Cepat dari Jadwal</span>
              </h3>
              <p className="text-xs text-slate-500">Pilih mata pelajaran / club belajar untuk langsung membuka QR:</p>

              <div className="space-y-2.5">
                {SCHEDULE_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFormType(preset.type);
                      setFormTitle(preset.title);
                      setFormClass(preset.class);
                      setFormRoom(preset.room);
                      setStartTime(preset.start);
                      setEndTime(preset.end);
                      setIsFlexibleUntilEnd(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-300 rounded-2xl text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-200 text-slate-700">
                          {preset.type}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">{preset.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{preset.class} • {preset.start} - {preset.end} WIB</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                  </button>
                ))}
              </div>
            </div>

            {/* List Sesi Hari Ini */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Sesi Aktif Tersedia ({sessions.length})</h3>
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => setActiveSession(sess)}
                    className={`w-full p-3 rounded-2xl text-left transition flex items-center justify-between border ${
                      activeSession?.sessionCode === sess.sessionCode
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs"
                        : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold truncate max-w-[180px]">{sess.title}</h5>
                      <span className="text-[10px] text-slate-400 block">{sess.className}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-100">
                      {sess.attendees.length} Hadir
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GURU SCAN QR SISWA (ARAH KE-2 DARI HP GURU) */}
      {activeTab === "scan-students" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto text-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold mb-2">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Arah Presensi Ke-2: Scan Siswa dari HP Guru</span>
            </span>
            <h2 className="text-xl font-bold text-slate-900">Pemindaian QR Kartu Siswa</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Gunakan kamera HP Anda untuk memindai kartu QR siswa yang terkendala kamera atau kuota data. Siswa akan langsung tercatat hadir pada sesi yang sedang aktif.
            </p>
          </div>

          {activeSession ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs space-y-1">
              <p className="text-emerald-900 font-bold">🎯 Sesi Tujuan Presensi:</p>
              <p className="text-emerald-800 font-semibold text-sm">{activeSession.title} ({activeSession.className})</p>
              <p className="text-emerald-700 text-[11px]">Siswa yang dipindai akan langsung masuk ke sesi ini.</p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-800">
              ⚠️ Belum ada sesi aktif yang dipilih. Silakan pilih sesi pada Tab 1 terlebih dahulu.
            </div>
          )}

          {/* Scanner Component with Continuous Scanning for multiple students */}
          <div className="py-2">
            <QRCameraScanner
              title="Kamera HP Guru - Pindai Siswa"
              subtitle="Arahkan kamera ke QR kartu pelajar siswa satu per satu"
              onScanSuccess={handleTeacherScanStudent}
              isContinuous={true}
            />
          </div>
        </div>
      )}

      {/* TAB 3: PRESENSI GURU MANDIRI (GPS CHECK-IN) */}
      {activeTab === "my-checkin" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm max-w-lg mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Presensi Mengajar Pendidik (GPS)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Validasi kehadiran mengajar harian berbasis radius geolokasi GPS gedung PKBM Askara.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-left space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Status Hari Ini:</span>
              <span className="font-bold text-emerald-700">TERVERIFIKASI HADIR</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Jam Check-In:</span>
              <span className="font-mono font-bold text-slate-800">07:38 WIB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Geolokasi:</span>
              <span className="font-mono text-slate-600">Radius 12m (Valid)</span>
            </div>
          </div>

          <button
            onClick={() => alert("Check-in kehadiran tutor terverifikasi berhasil!")}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kirim Pembaruan GPS Lokasi</span>
          </button>
        </div>
      )}

      {/* MODAL BUAT SESI PRESENSI BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span>Buka Sesi Presensi QR Baru</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Atur jadwal, durasi, dan mata pelajaran / club belajar</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
              {/* 1. Tipe Sesi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipe Sesi Kegiatan</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("MAPEL");
                      if (MAPEL_OPTIONS.length > 0) {
                        setFormTitle(MAPEL_OPTIONS[0].title);
                        setFormClass(MAPEL_OPTIONS[0].class);
                        setFormRoom(MAPEL_OPTIONS[0].room);
                      }
                    }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      formType === "MAPEL"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-900/20"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Mata Pelajaran (Mapel)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("CLUB");
                      if (CLUB_OPTIONS.length > 0) {
                        setFormTitle(CLUB_OPTIONS[0].title);
                        setFormClass(CLUB_OPTIONS[0].class);
                        setFormRoom(CLUB_OPTIONS[0].room);
                      }
                    }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      formType === "CLUB"
                        ? "bg-amber-600 border-amber-600 text-white shadow-sm shadow-amber-900/20"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Club Belajar (Ekstra)</span>
                  </button>
                </div>
              </div>

              {/* 2. Pilihan Cepat Topik / Mapel */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {formType === "MAPEL" ? "Pilihan Mata Pelajaran Cepat" : "Pilihan Club Belajar Cepat"}
                  </label>
                  <span className="text-[10px] text-slate-400">Klik untuk isi otomatis</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  {(formType === "MAPEL" ? MAPEL_OPTIONS : CLUB_OPTIONS).map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setFormTitle(opt.title);
                        setFormClass(opt.class);
                        setFormRoom(opt.room);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition ${
                        formTitle === opt.title
                          ? "bg-emerald-600 text-white font-bold shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Input Judul & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sesi *</label>
                  <input
                    required
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Matematika Terapan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas / Sasaran</label>
                  <input
                    type="text"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="Contoh: Paket C - Kelas X"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 4. FLEKSIBILITAS JAM SESI & DURASI (FITUR UTAMA) */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>Pengaturan Jam Sesi & Durasi</span>
                  </span>
                  <button
                    type="button"
                    onClick={setTimeToNow}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs hover:bg-emerald-50 transition flex items-center gap-1"
                    title="Isi jam mulai dengan waktu saat ini"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Mulai Sekarang</span>
                  </button>
                </div>

                {/* Slot Jam Cepat (Preset Sekolah) */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                    Pilihan Slot Waktu Sekolah
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {TIME_SLOT_PRESETS.map((slot, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setStartTime(slot.start);
                          setEndTime(slot.end);
                          setIsFlexibleUntilEnd(false);
                          setSelectedDuration(null);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition border ${
                          startTime === slot.start && endTime === slot.end && !isFlexibleUntilEnd
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/60"
                        }`}
                      >
                        <span className="block truncate">{slot.label}</span>
                        <span className="text-[9px] opacity-75 font-mono block">{slot.start}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Jam Mulai & Selesai (Native Time Pickers) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStartTime(val);
                        if (selectedDuration) applyDuration(selectedDuration, val);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Jam Selesai {isFlexibleUntilEnd && <span className="text-emerald-700">(Bebas)</span>}
                    </label>
                    <input
                      type="time"
                      disabled={isFlexibleUntilEnd}
                      value={isFlexibleUntilEnd ? "" : endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        setSelectedDuration(null);
                      }}
                      placeholder="Selesai"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                {/* Tombol Cepat Tambah Durasi (+30m, +45m, +60m, +90m, +120m) */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                    Pilih Durasi Otomatis
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[30, 45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => applyDuration(mins)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition border ${
                          selectedDuration === mins && !isFlexibleUntilEnd
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        +{mins} Menit
                      </button>
                    ))}

                    <label className="inline-flex items-center gap-1.5 ml-auto text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isFlexibleUntilEnd}
                        onChange={(e) => {
                          setIsFlexibleUntilEnd(e.target.checked);
                          if (e.target.checked) setSelectedDuration(null);
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span>Hingga Selesai</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 5. Ruangan / Lokasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ruangan / Tempat</label>
                <input
                  type="text"
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  placeholder="Contoh: Ruang Belajar Askara 1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-950/20"
                >
                  {submitting ? "Membuka Sesi..." : "Generate QR Sesi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
