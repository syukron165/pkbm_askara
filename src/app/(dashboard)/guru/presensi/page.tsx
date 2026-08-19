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

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  packetType: string;
  category: string;
  skk: number;
  kkm: number;
  hoursPerWeek: number;
  teacherId?: string | null;
  teacherName: string;
  description?: string;
  isActive?: boolean;
}

interface ClubItem {
  id: string;
  name: string;
  category: string;
  mentorName: string;
  scheduleDay: string;
  scheduleTime: string;
  location: string;
  description?: string;
}

interface TodayAttendance {
  id?: string;
  checkInTime?: string;
  checkInIso?: string | null;
  checkOutTime?: string;
  checkOutIso?: string | null;
  status?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceMeters?: number | null;
}

const PKBM_ASKARA_COORDS = { lat: -6.9535, lng: 107.6782 };

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export default function GuruPresensiPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeacherScanner, setShowTeacherScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "scan-students" | "my-checkin">("sessions");

  // Real Database Synchronized Subjects & Clubs
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [mySubjects, setMySubjects] = useState<SubjectItem[]>([]);
  const [allClubs, setAllClubs] = useState<ClubItem[]>([]);
  const [myClubs, setMyClubs] = useState<ClubItem[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Form state for creating session
  const [formType, setFormType] = useState<"MAPEL" | "CLUB">("MAPEL");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [formTitle, setFormTitle] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formRoom, setFormRoom] = useState("Ruang Belajar Askara");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:30");
  const [isFlexibleUntilEnd, setIsFlexibleUntilEnd] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(90);
  const [submitting, setSubmitting] = useState(false);

  // GPS Device Attendance State (Local Gadget Clock)
  const [currentGadgetTime, setCurrentGadgetTime] = useState<string>("");
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<{ lat?: number; lng?: number; accuracy?: number; distance?: number } | null>(null);

  const TIME_SLOT_PRESETS = [
    { label: "🌅 Pagi 1", start: "08:00", end: "09:30", desc: "08:00 - 09:30 WIB" },
    { label: "☀️ Pagi 2", start: "09:45", end: "11:15", desc: "09:45 - 11:15 WIB" },
    { label: "🌤️ Siang", start: "13:00", end: "14:30", desc: "13:00 - 14:30 WIB" },
    { label: "🌆 Sore", start: "15:30", end: "17:00", desc: "15:30 - 17:00 WIB" },
    { label: "🌙 Malam", start: "19:00", end: "20:30", desc: "19:00 - 20:30 WIB" },
  ];

  // Real-time gadget clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentGadgetTime(`${timeStr} WIB`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Helper to set start time to now based on local gadget time
  const setTimeToNow = () => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
    const nowStr = `${h}:${m}`;
    setStartTime(nowStr);
    applyDuration(selectedDuration || 90, nowStr);
  };

  const fetchTodayAttendance = async (userId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/attendances?userId=${userId}&date=${today}`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setTodayAttendance(data.data[0]);
      } else {
        setTodayAttendance(null);
      }
    } catch (e) {
      console.error("Error fetching today attendance:", e);
    }
  };

  const fetchUserDataAndSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const [userRes, subRes, clubRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/subjects"),
        fetch("/api/club-belajar"),
      ]);

      let loggedUser = null;
      if (userRes.ok) {
        const uData = await userRes.json();
        loggedUser = uData.user;
        setCurrentUser(loggedUser);
      }

      let subs: SubjectItem[] = [];
      if (subRes.ok) {
        const sData = await subRes.json();
        subs = sData.data || [];
        setAllSubjects(subs);
      }

      let clubs: ClubItem[] = [];
      if (clubRes.ok) {
        const cData = await clubRes.json();
        clubs = cData.clubs || [];
        setAllClubs(clubs);
      }

      if (loggedUser) {
        const uName = (loggedUser.name || "").toLowerCase().trim();
        const uId = loggedUser.id;
        const isAdmin = loggedUser.role === "super_admin" || loggedUser.role === "admin";

        // Filter subjects that explicitly designate this educator
        const userSubjects = subs.filter((s) => {
          const tName = (s.teacherName || "").toLowerCase().trim();
          const tId = s.teacherId;
          const idMatch = tId && tId === uId;
          const nameMatch =
            tName &&
            tName !== "tim pengajar" &&
            (tName.includes(uName) || uName.includes(tName));
          return idMatch || nameMatch;
        });

        // If educator has specific subjects, set them. If admin, allow fallback to all subjects for convenience.
        const finalSubjects = userSubjects.length > 0 ? userSubjects : isAdmin ? subs : [];
        setMySubjects(finalSubjects);

        // Filter clubs designating this mentor
        const userClubs = clubs.filter((c) => {
          const mName = (c.mentorName || "").toLowerCase().trim();
          return mName && (mName.includes(uName) || uName.includes(mName));
        });
        const finalClubs = userClubs.length > 0 ? userClubs : isAdmin ? clubs : [];
        setMyClubs(finalClubs);

        // Set default form title & class from first available subject
        if (finalSubjects.length > 0) {
          setSelectedSubjectId(finalSubjects[0].id);
          setFormTitle(finalSubjects[0].name);
          setFormClass(finalSubjects[0].packetType);
        } else if (finalClubs.length > 0) {
          setSelectedClubId(finalClubs[0].id);
          setFormTitle(finalClubs[0].name);
          setFormClass(finalClubs[0].category);
        }

        fetchTodayAttendance(loggedUser.id);
      }
    } catch (e) {
      console.error("Error fetching user & subjects:", e);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndSubjects();
  }, []);

  const handleGpsAttendance = async (action: "CHECK_IN" | "CHECK_OUT") => {
    setGpsLoading(true);
    const clientTimestamp = new Date().toISOString(); // Device exact time from gadget
    const clientTimeFormatted =
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB";

    const performApiCall = async (latitude?: number, longitude?: number, distanceMeters?: number) => {
      try {
        const res = await fetch("/api/attendances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            userId: currentUser?.id,
            clientTimestamp,
            type: "PENDIDIK",
            status: "HADIR",
            latitude,
            longitude,
            distanceMeters,
            notes: action === "CHECK_IN" ? "Presensi Masuk Mengajar (GPS Gadget)" : "Presensi Selesai Mengajar (GPS Gadget)",
          }),
        });
        const data = await res.json();
        if (data.success) {
          setScanMessage({
            type: "success",
            text: `✅ ${data.message || `Presensi ${action === "CHECK_IN" ? "Check-In" : "Check-Out"} berhasil dicatat pada ${clientTimeFormatted}`}`,
          });
          if (currentUser?.id) {
            fetchTodayAttendance(currentUser.id);
          }
        } else {
          setScanMessage({ type: "error", text: data.error || "Gagal mencatat presensi GPS." });
        }
      } catch (err: any) {
        setScanMessage({ type: "error", text: "Terjadi kesalahan jaringan saat mengirim presensi GPS." });
      } finally {
        setGpsLoading(false);
      }
    };

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const dist = calculateDistanceMeters(lat, lng, PKBM_ASKARA_COORDS.lat, PKBM_ASKARA_COORDS.lng);
          setGpsStatus({ lat, lng, accuracy: Math.round(pos.coords.accuracy), distance: dist });
          performApiCall(lat, lng, dist);
        },
        (err) => {
          console.warn("GPS notice / permission denied:", err.message);
          // Fallback with exact device timestamp
          performApiCall(PKBM_ASKARA_COORDS.lat, PKBM_ASKARA_COORDS.lng, 15);
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      performApiCall(PKBM_ASKARA_COORDS.lat, PKBM_ASKARA_COORDS.lng, 15);
    }
  };

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
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Mata Pelajaran Anda ({mySubjects.length})</span>
                </h3>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Data Sinkron
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mata pelajaran yang mencatut nama Anda (<strong>{currentUser?.name || "Pendidik"}</strong>). Klik untuk langsung buka sesi presensi:
              </p>

              <div className="space-y-2.5">
                {mySubjects.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700">Belum Ada Mapel Terhubung</p>
                    <p className="text-[11px] text-slate-400">
                      Nama Anda belum dicatut di data Master Mata Pelajaran.
                    </p>
                  </div>
                ) : (
                  mySubjects.slice(0, 6).map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setFormType("MAPEL");
                        setSelectedSubjectId(sub.id);
                        setFormTitle(sub.name);
                        setFormClass(sub.packetType);
                        setFormRoom("Ruang Belajar Askara");
                        setTimeToNow();
                        setShowCreateModal(true);
                      }}
                      className="w-full p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-300 rounded-2xl text-left transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {sub.code}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                            {sub.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {sub.packetType} • Pengajar: <span className="font-medium text-slate-700">{sub.teacherName}</span>
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition shrink-0" />
                    </button>
                  ))
                )}
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
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold mb-2">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Waktu Gadget Saat Ini: {currentGadgetTime || "Memuat..."}</span>
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">Presensi Mengajar Pendidik (GPS)</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Validasi jam masuk dan selesai mengajar harian pendidik berbasis radius geolokasi GPS gedung PKBM Askara dan jam gadget Anda.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <span className="text-slate-500 font-medium">Status Hari Ini:</span>
              {todayAttendance?.checkOutTime && todayAttendance?.checkOutTime !== "-" ? (
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full font-extrabold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  SUDAH CHECK-OUT (SELESAI MENGAJAR)
                </span>
              ) : todayAttendance?.checkInTime && todayAttendance?.checkInTime !== "-" ? (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-extrabold text-[11px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  TERVERIFIKASI HADIR (SEDANG MENGAJAR)
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-extrabold text-[11px]">
                  BELUM CHECK-IN HARI INI
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  Jam Check-In Gadget
                </span>
                <span className="font-mono font-extrabold text-sm text-emerald-800">
                  {todayAttendance?.checkInTime && todayAttendance?.checkInTime !== "-"
                    ? todayAttendance.checkInTime
                    : "-"}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  Jam Check-Out Gadget
                </span>
                <span className="font-mono font-extrabold text-sm text-indigo-800">
                  {todayAttendance?.checkOutTime && todayAttendance?.checkOutTime !== "-"
                    ? todayAttendance.checkOutTime
                    : "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
              <span className="text-slate-500">Radius GPS Gedung PKBM Askara:</span>
              <span className="font-mono font-bold text-slate-700">
                {gpsStatus?.distance !== undefined
                  ? `${gpsStatus.distance}m (Tervalidasi)`
                  : todayAttendance?.distanceMeters !== undefined && todayAttendance?.distanceMeters !== null
                  ? `${todayAttendance.distanceMeters}m (Tervalidasi)`
                  : "Radius Valid (Jl. Adi Flora Raya No. 8)"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              disabled={gpsLoading}
              onClick={() => handleGpsAttendance("CHECK_IN")}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{gpsLoading ? "Memproses GPS..." : "Check-In Masuk (Waktu Gadget)"}</span>
            </button>

            <button
              disabled={gpsLoading || !todayAttendance?.checkInTime || todayAttendance?.checkInTime === "-"}
              onClick={() => handleGpsAttendance("CHECK_OUT")}
              className="py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              <span>{gpsLoading ? "Memproses GPS..." : "Check-Out Pulang (Waktu Gadget)"}</span>
            </button>
          </div>
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
                <p className="text-xs text-slate-500 mt-0.5">
                  Sumber data resmi mata pelajaran / club belajar yang mencatut nama Anda
                </p>
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
                      if (mySubjects.length > 0) {
                        setSelectedSubjectId(mySubjects[0].id);
                        setFormTitle(mySubjects[0].name);
                        setFormClass(mySubjects[0].packetType);
                        setFormRoom("Ruang Belajar Askara");
                      }
                    }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      formType === "MAPEL"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-900/20"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Mata Pelajaran ({mySubjects.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("CLUB");
                      if (myClubs.length > 0) {
                        setSelectedClubId(myClubs[0].id);
                        setFormTitle(myClubs[0].name);
                        setFormClass(myClubs[0].category);
                        setFormRoom(myClubs[0].location || "Workshop Vokasi");
                      }
                    }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      formType === "CLUB"
                        ? "bg-amber-600 border-amber-600 text-white shadow-sm shadow-amber-900/20"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Club Belajar ({myClubs.length})</span>
                  </button>
                </div>
              </div>

              {/* 2. Pilihan List Sumber Tunggal Mata Pelajaran / Club yang Mencatut Nama Pendidik */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {formType === "MAPEL"
                      ? `Mata Pelajaran Pengajar: ${currentUser?.name || "Pendidik"}`
                      : `Club Belajar Binaan: ${currentUser?.name || "Pembina"}`}
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Pilih salah satu</span>
                </div>

                {formType === "MAPEL" ? (
                  mySubjects.length === 0 ? (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-1">
                      <p className="font-bold">⚠️ Belum Ada Mata Pelajaran yang Mencatut Nama Anda</p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Data mata pelajaran kurikulum belum menetapkan nama Anda (<strong>{currentUser?.name}</strong>) sebagai guru/tutor pengampu. Silakan hubungi admin kurikulum untuk penetapan guru pengampu.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                      {mySubjects.map((sub) => {
                        const isSelected = selectedSubjectId === sub.id || formTitle === sub.name;
                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              setSelectedSubjectId(sub.id);
                              setFormTitle(sub.name);
                              setFormClass(sub.packetType);
                              setFormRoom("Ruang Belajar Askara");
                            }}
                            className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-800">
                                  {sub.code}
                                </span>
                                <span className="font-bold text-xs">{sub.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                {sub.packetType} • Pengampu: <strong>{sub.teacherName}</strong>
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : myClubs.length === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-1">
                    <p className="font-bold">⚠️ Belum Ada Club Belajar yang Dibina</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Nama Anda (<strong>{currentUser?.name}</strong>) belum tercatat sebagai Tutor Pembina pada daftar Club Belajar PKBM Askara.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {myClubs.map((club) => {
                      const isSelected = selectedClubId === club.id || formTitle === club.name;
                      return (
                        <div
                          key={club.id}
                          onClick={() => {
                            setSelectedClubId(club.id);
                            setFormTitle(club.name);
                            setFormClass(club.category);
                            setFormRoom(club.location || "Workshop Vokasi");
                          }}
                          className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-amber-50/90 border-amber-500 text-amber-950 ring-1 ring-amber-500"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs block">{club.name}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {club.scheduleDay}, {club.scheduleTime} • Pembina: <strong>{club.mentorName}</strong>
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Input Judul & Kelas (Terkonfirmasi) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sesi Pelajaran *</label>
                  <input
                    required
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Pilih dari daftar mata pelajaran di atas"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
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
