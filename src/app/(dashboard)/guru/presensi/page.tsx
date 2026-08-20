"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Save,
  UserCheck,
  Layers,
  GraduationCap,
  Calendar as CalendarIcon,
  Filter,
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
const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
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
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "scan-students" | "my-checkin">("my-checkin");

  // Sub-mode untuk Tab 3
  const [subMode, setSubMode] = useState<"class-students" | "gps-self">("class-students");

  // State Filter Hari (Hari Ini | Semua Hari | 1..7)
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("HARI_INI");

  // State untuk Presensi Kelas & Siswa (Tab 3A)
  const [scheduledSubjects, setScheduledSubjects] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingStudents, setSavingStudents] = useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  // Master Subjects & Clubs
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [mySubjects, setMySubjects] = useState<SubjectItem[]>([]);
  const [allClubs, setAllClubs] = useState<ClubItem[]>([]);
  const [myClubs, setMyClubs] = useState<ClubItem[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Form modal state
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

  // GPS State
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

  // Hitung hari saat ini (1 = Senin ... 7 = Minggu)
  const currentJsDay = new Date().getDay();
  const currentDayOfWeekInt = currentJsDay === 0 ? 7 : currentJsDay;
  const currentDayName = DAY_NAMES[currentDayOfWeekInt] || "Senin";

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

  // Panggil data siswa saat Kartu Jadwal Pelajaran diklik
  const handleSelectScheduleForManual = async (sch: any) => {
    setSelectedSubject(sch);
    setLoadingStudents(true);
    setManualSuccessMsg(null);

    try {
      const classIdParam = sch.classId || "";
      const classNameParam = sch.className || sch.packetType || "";
      const packetTypeParam = sch.packetType || "";
      const res = await fetch(
        `/api/presensi/manual?mode=students&classId=${encodeURIComponent(classIdParam)}&className=${encodeURIComponent(classNameParam)}&packetType=${encodeURIComponent(packetTypeParam)}`
      );
      const json = await res.json();

      if (json.success && Array.isArray(json.students)) {
        setStudentsList(json.students);
      } else {
        setStudentsList([]);
      }
    } catch (err) {
      console.error("Gagal memuat siswa:", err);
      setStudentsList([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Panggil jadwal pelajaran resmi HANYA milik guru bersangkutan dari backend API
  const fetchTeacherSchedules = useCallback(async (currentSubjectsList?: SubjectItem[]) => {
    setLoadingSchedules(true);
    try {
      const res = await fetch("/api/presensi/manual?mode=schedules");
      const data = await res.json();

      let finalSchedules: any[] = [];

      if (data.success && Array.isArray(data.schedules)) {
        finalSchedules = data.schedules;
      }

      setScheduledSubjects(finalSchedules);

      // Otomatis pilih jadwal pertama sesuai filter hari ini jika ada
      const todayMatches = finalSchedules.filter((s) => s.dayOfWeek === currentDayOfWeekInt);
      if (todayMatches.length > 0) {
        handleSelectScheduleForManual(todayMatches[0]);
      } else if (finalSchedules.length > 0) {
        handleSelectScheduleForManual(finalSchedules[0]);
      } else {
        setSelectedSubject(null);
        setStudentsList([]);
      }
    } catch (err) {
      console.error("Gagal memuat jadwal pelajaran:", err);
      setScheduledSubjects([]);
    } finally {
      setLoadingSchedules(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDayOfWeekInt]);

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
        const cleanName = uName.replace(/,?\s*(s\.pd|m\.pd|s\.kom|s\.st|s\.si|s\.hum|s\.sos|a\.md|dr|prof).*$/gi, "").trim();
        const uId = loggedUser.id;
        const isAdmin = loggedUser.role === "super_admin" || loggedUser.role === "admin";

        // Filter mata pelajaran yang hanya tertaut nama guru ini
        const userSubjects = subs.filter((s) => {
          if (isAdmin) return true;
          const tName = (s.teacherName || "").toLowerCase().trim();
          const tId = s.teacherId;
          const idMatch = tId && tId === uId;
          const nameMatch =
            tName &&
            (tName.includes(cleanName) || cleanName.includes(tName) || tName.includes(uName));
          return idMatch || nameMatch;
        });

        setMySubjects(userSubjects);

        const userClubs = clubs.filter((c) => {
          if (isAdmin) return true;
          const mName = (c.mentorName || "").toLowerCase().trim();
          return mName && (mName.includes(cleanName) || cleanName.includes(mName) || mName.includes(uName));
        });
        setMyClubs(userClubs);

        if (userSubjects.length > 0) {
          setSelectedSubjectId(userSubjects[0].id);
          setFormTitle(userSubjects[0].name);
          setFormClass(userSubjects[0].packetType);
        }

        fetchTodayAttendance(loggedUser.id);
        fetchTeacherSchedules(userSubjects);
      }
    } catch (e) {
      console.error("Error fetching user & subjects:", e);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered schedules berdasarkan pilihan filter hari
  const filteredScheduledSubjects = useMemo(() => {
    if (selectedDayFilter === "ALL") {
      return scheduledSubjects;
    }
    if (selectedDayFilter === "HARI_INI") {
      return scheduledSubjects.filter((s) => s.dayOfWeek === currentDayOfWeekInt);
    }
    const dayNum = Number(selectedDayFilter);
    return scheduledSubjects.filter((s) => s.dayOfWeek === dayNum);
  }, [scheduledSubjects, selectedDayFilter, currentDayOfWeekInt]);

  // Hitung jumlah jadwal per hari untuk badge button
  const dayScheduleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      today: scheduledSubjects.filter((s) => s.dayOfWeek === currentDayOfWeekInt).length,
      all: scheduledSubjects.length,
      "1": scheduledSubjects.filter((s) => s.dayOfWeek === 1).length,
      "2": scheduledSubjects.filter((s) => s.dayOfWeek === 2).length,
      "3": scheduledSubjects.filter((s) => s.dayOfWeek === 3).length,
      "4": scheduledSubjects.filter((s) => s.dayOfWeek === 4).length,
      "5": scheduledSubjects.filter((s) => s.dayOfWeek === 5).length,
      "6": scheduledSubjects.filter((s) => s.dayOfWeek === 6).length,
      "7": scheduledSubjects.filter((s) => s.dayOfWeek === 7).length,
    };
    return counts;
  }, [scheduledSubjects, currentDayOfWeekInt]);

  const handleStudentStatusChange = (studentId: string, newStatus: string) => {
    setStudentsList((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleSetAllStudentsStatus = (status: string) => {
    setStudentsList((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveManualAttendance = async () => {
    if (!selectedSubject || studentsList.length === 0) return;
    setSavingStudents(true);
    setManualSuccessMsg(null);

    try {
      const res = await fetch("/api/presensi/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTitle: selectedSubject.subjectName || selectedSubject.name,
          className: selectedSubject.className || selectedSubject.packetType,
          classId: selectedSubject.classId || undefined,
          scheduleId: selectedSubject.id || selectedSubject.scheduleId,
          records: studentsList.map((s) => ({ studentId: s.studentId, status: s.status })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setManualSuccessMsg(json.message || "Presensi seluruh siswa berhasil disimpan!");
        handleSelectScheduleForManual(selectedSubject);
      } else {
        alert(json.error || "Gagal menyimpan presensi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan saat menyimpan presensi.");
    } finally {
      setSavingStudents(false);
    }
  };

  const handleGpsAttendance = async (action: "CHECK_IN" | "CHECK_OUT") => {
    setGpsLoading(true);
    const clientTimestamp = new Date().toISOString();
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

  useEffect(() => {
    fetchSessions(false);
  }, [fetchSessions]);

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
        setScanMessage({ type: "success", text: `Sesi "${data.session.title}" berhasil dibuka!` });
        setTimeout(() => setScanMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeacherScanStudent = async (decodedText: string) => {
    const targetSession = activeSession || sessions[0];

    if (!targetSession) {
      setScanMessage({
        type: "error",
        text: "Buka sesi presensi aktif terlebih dahulu sebelum memindai QR kartu siswa.",
      });
      return;
    }

    try {
      const res = await fetch("/api/presensi/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrData: decodedText,
          sessionCode: targetSession.sessionCode,
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
      setScanMessage({ type: "error", text: "Terjadi kesalahan jaringan saat memindai QR siswa." });
    }
  };

  const studentStatusCounts = {
    hadir: studentsList.filter((s) => s.status === "HADIR").length,
    izin: studentsList.filter((s) => s.status === "IZIN").length,
    sakit: studentsList.filter((s) => s.status === "SAKIT").length,
    alpa: studentsList.filter((s) => s.status === "ALPA").length,
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
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${scanMessage.type === "success"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm"
            : "bg-rose-50 text-rose-800 border border-rose-200 shadow-sm"
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
          <button onClick={() => setScanMessage(null)} className="text-xs font-bold hover:underline ml-3">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Presensi Pendidik: {currentUser?.name || "Pendidik"}
            </h1>
            <p className="mt-1.5 text-emerald-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Pilih jadwal pelajaran yang Anda ampu hari ini untuk menginput presensi siswa per kelas, buka sesi QR untuk discan siswa, atau gunakan kamera HP untuk memindai kartu siswa.
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
          onClick={() => setActiveTab("my-checkin")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === "my-checkin"
            ? "bg-emerald-700 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Presensi Guru & Siswa Per Kelas</span>
        </button>

        <button
          onClick={() => setActiveTab("scan-students")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === "scan-students"
            ? "bg-emerald-700 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>2. Pindai QR Siswa (Kamera HP Guru)</span>
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === "sessions"
            ? "bg-emerald-700 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <QrCode className="w-4 h-4" />
          <span>3. Tampilkan QR Sesi (Discan Siswa)</span>
        </button>
      </div>

      {/* TAB 1: PRESENSI GURU MANDIRI & INPUT SISWA PER KELAS */}
      {activeTab === "my-checkin" && (
        <div className="space-y-6">
          <div className="flex justify-center border-b border-slate-200/80 pb-4 gap-3">
            <button
              onClick={() => setSubMode("class-students")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${subMode === "class-students"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
            >
              <Users className="w-4 h-4" />
              <span>A. Input Presensi Siswa Per Kelas</span>
            </button>

            <button
              onClick={() => setSubMode("gps-self")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${subMode === "gps-self"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>B. Presensi Mengajar Pendidik (GPS)</span>
            </button>
          </div>

          {/* SUB-MODE A: INPUT SISWA PER KELAS */}
          {subMode === "class-students" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>Jadwal Mengajar yang Diampu oleh: <span className="text-emerald-800 font-extrabold">{currentUser?.name || "Pendidik"}</span></span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hanya menampilkan mata pelajaran yang tertaut akun Anda dari jadwal resmi Admin.
                    </p>
                  </div>
                  <button
                    onClick={() => fetchTeacherSchedules(mySubjects)}
                    className="p-2 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition font-bold flex items-center gap-1.5 border border-emerald-200 shrink-0 self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSchedules ? "animate-spin" : ""}`} />
                    <span>Muat Ulang</span>
                  </button>
                </div>

                {/* FILTER HARI */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Filter className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Filter Hari Mengajar:</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayFilter("HARI_INI");
                        const todayMatches = scheduledSubjects.filter((s) => s.dayOfWeek === currentDayOfWeekInt);
                        if (todayMatches.length > 0) handleSelectScheduleForManual(todayMatches[0]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${selectedDayFilter === "HARI_INI"
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50/60"
                        }`}
                    >
                      <span>🌅 Hari Ini ({currentDayName})</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${selectedDayFilter === "HARI_INI" ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"}`}>
                        {dayScheduleCounts.today}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayFilter("ALL");
                        if (scheduledSubjects.length > 0) handleSelectScheduleForManual(scheduledSubjects[0]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${selectedDayFilter === "ALL"
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50/60"
                        }`}
                    >
                      <span>Semua Hari</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${selectedDayFilter === "ALL" ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"}`}>
                        {dayScheduleCounts.all}
                      </span>
                    </button>

                    {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                      const dayStr = String(dayNum);
                      const isSelected = selectedDayFilter === dayStr;
                      const count = dayScheduleCounts[dayStr] || 0;
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => {
                            setSelectedDayFilter(dayStr);
                            const matches = scheduledSubjects.filter((s) => s.dayOfWeek === dayNum);
                            if (matches.length > 0) handleSelectScheduleForManual(matches[0]);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1 ${isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : count > 0
                              ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              : "bg-slate-50 text-slate-400 border-slate-200/60 opacity-60"
                            }`}
                        >
                          <span>{DAY_NAMES[dayNum]}</span>
                          {count > 0 && (
                            <span className={`px-1 py-0.2 rounded text-[10px] font-mono font-bold ${isSelected ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {loadingSchedules ? (
                  <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                    <span>Memuat jadwal pelajaran guru dari database...</span>
                  </div>
                ) : filteredScheduledSubjects.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 space-y-2 border border-dashed border-slate-200">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    {selectedDayFilter === "HARI_INI" ? (
                      <>
                        <p className="font-bold text-slate-700">
                          Tidak Ada Jadwal Mengajar untuk Hari Ini ({currentDayName})
                        </p>
                        <p className="text-slate-400 max-w-md mx-auto">
                          Anda memiliki total <strong>{scheduledSubjects.length} jadwal mengajar</strong> pada hari lain.
                        </p>
                        {scheduledSubjects.length > 0 && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDayFilter("ALL");
                                handleSelectScheduleForManual(scheduledSubjects[0]);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                            >
                              Lihat Semua Hari Mengajar ({scheduledSubjects.length} Jadwal)
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-slate-700">
                          Tidak Ada Jadwal Mengajar pada Filter Hari Ini ({DAY_NAMES[Number(selectedDayFilter)] || "Pilihan"})
                        </p>
                        <p className="text-slate-400">Pilih hari lain atau tombol Semua Hari untuk melihat seluruh jadwal Anda.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredScheduledSubjects.map((sch) => {
                      const isSelected = selectedSubject?.id === sch.id;
                      return (
                        <button
                          key={sch.id}
                          onClick={() => handleSelectScheduleForManual(sch)}
                          className={`p-4 rounded-2xl border text-left transition relative ${isSelected
                            ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                            : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-700 font-mono">
                              {sch.subjectCode || "MAPEL"}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                              {sch.dayName || "Senin"}
                            </span>
                          </div>
                          <p className="text-xs font-extrabold text-slate-900 leading-tight mt-1">{sch.subjectName}</p>
                          <p className="text-[11px] text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{sch.className}</span>
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-200/60 font-medium">
                            <span>{sch.timeSlot}</span>
                            <span className="text-slate-600 font-bold">{sch.enrolledStudentsCount ? `${sch.enrolledStudentsCount} Siswa` : sch.room}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LIST SISWA TERDAFTAR DI KELAS TERPILIH */}
              {selectedSubject && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-extrabold uppercase">
                          {selectedSubject.packetType || "Kelas"}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {selectedSubject.subjectName || selectedSubject.name} — {selectedSubject.className}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Daftar siswa resmi terdaftar di rombel ini. Pilih status kehadiran lalu simpan.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        {studentsList.length} Siswa Terdaftar
                      </span>
                    </div>
                  </div>

                  {/* Batch Action Toolbar */}
                  {studentsList.length > 0 && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-600">
                        <span>Aksi Cepat:</span>
                        <button
                          type="button"
                          onClick={() => handleSetAllStudentsStatus("HADIR")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-bold text-[11px] shadow-2xs"
                        >
                          Semua Hadir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetAllStudentsStatus("IZIN")}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition font-bold text-[11px] shadow-2xs"
                        >
                          Semua Izin
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">Hadir: {studentStatusCounts.hadir}</span>
                        <span className="text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">Izin: {studentStatusCounts.izin}</span>
                        <span className="text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">Sakit: {studentStatusCounts.sakit}</span>
                        <span className="text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded-md">Alpa: {studentStatusCounts.alpa}</span>
                      </div>
                    </div>
                  )}

                  {manualSuccessMsg && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{manualSuccessMsg}</span>
                    </div>
                  )}

                  {loadingStudents ? (
                    <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Memuat daftar siswa terdaftar...</span>
                    </div>
                  ) : studentsList.length === 0 ? (
                    <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <p className="font-bold text-slate-700">Belum Ada Siswa yang Terdaftar di Kelas Ini</p>
                      <p className="text-slate-400 text-[11px]">
                        Admin belum memasukkan peserta didik ke dalam rombel <strong>{selectedSubject.className}</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {studentsList.map((st, idx) => (
                        <div
                          key={st.studentId || idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/60 rounded-2xl border border-slate-200/70 gap-3 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{st.studentName}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                <span>NISN: {st.nisn}</span>
                                <span>•</span>
                                <span>{st.className}</span>
                                {st.alreadyRecorded && st.checkInTime && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-600 font-semibold font-sans">Tercatat {st.checkInTime}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            {["HADIR", "IZIN", "SAKIT", "ALPA"].map((stt) => (
                              <button
                                key={stt}
                                type="button"
                                onClick={() => handleStudentStatusChange(st.studentId, stt)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition ${st.status === stt
                                  ? stt === "HADIR"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : stt === "IZIN"
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : stt === "SAKIT"
                                        ? "bg-blue-500 text-white shadow-xs"
                                        : "bg-rose-600 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                  }`}
                              >
                                {stt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleSaveManualAttendance}
                        disabled={savingStudents}
                        className="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingStudents ? "Menyimpan Presensi..." : `Simpan Seluruh Presensi Siswa (${studentsList.length} Siswa)`}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB-MODE B: PRESENSI GPS PENDIDIK */}
          {subMode === "gps-self" && (
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
                  type="button"
                  disabled={gpsLoading}
                  onClick={() => handleGpsAttendance("CHECK_IN")}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{gpsLoading ? "Memproses GPS..." : "Check-In Masuk (Waktu Gadget)"}</span>
                </button>

                <button
                  type="button"
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
        </div>
      )}

      {/* TAB 2: PINDAI QR SISWA DARI HP GURU */}
      {activeTab === "scan-students" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto text-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold mb-2">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Arah Presensi Ke-2: Scan Siswa dari HP Guru</span>
            </span>
            <h2 className="text-xl font-bold text-slate-900">Pemindaian QR Kartu Siswa</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Gunakan kamera HP Anda untuk memindai kartu QR siswa yang terkendala kamera atau kuota data. Siswa akan langsung tercatat hadir pada sesi yang dipilih.
            </p>
          </div>

          {/* Target Session Selector Dropdown */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-left space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>🎯 Sesi Presensi Tujuan:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buka Sesi Baru</span>
              </button>
            </div>

            {sessions.length > 0 ? (
              <select
                value={activeSession?.sessionCode || (sessions[0]?.sessionCode ?? "")}
                onChange={(e) => {
                  const found = sessions.find((s) => s.sessionCode === e.target.value);
                  if (found) setActiveSession(found);
                }}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {sessions.map((sess) => (
                  <option key={sess.id} value={sess.sessionCode}>
                    {sess.title} — {sess.className} ({sess.attendees.length} Hadir) [Kode: {sess.sessionCode}]
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span>⚠️ Belum ada sesi presensi aktif yang dibuka.</span>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700"
                >
                  Buka Sesi Sekarang
                </button>
              </div>
            )}
          </div>

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

      {/* TAB 3: TAMPILKAN QR SESI UNTUK DISCAN SISWA */}
      {activeTab === "sessions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                <div className="py-8 flex flex-col items-center justify-center bg-slate-50/70 rounded-2xl my-6 border border-slate-100">
                  <QRCodeView
                    value={activeSession.qrData}
                    size={220}
                    title="QR CODE SESI PRESENSI"
                    subtitle={`Tampilkan di proyektor / layar HP kepada siswa ${activeSession.className}`}
                    allowFullscreen={true}
                  />
                </div>

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
                <p className="text-xs text-slate-500 mt-1">Pilih mata pelajaran di panel kanan atau buat sesi presensi baru.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Buka Sesi Presensi Sekarang
                </button>
              </div>
            )}
          </div>

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

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Sesi Aktif Tersedia ({sessions.length})</h3>
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => setActiveSession(sess)}
                    className={`w-full p-3 rounded-2xl text-left transition flex items-center justify-between border ${activeSession?.sessionCode === sess.sessionCode
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

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
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
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border ${formType === "MAPEL"
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
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border ${formType === "CLUB"
                      ? "bg-amber-600 border-amber-600 text-white shadow-sm shadow-amber-900/20"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Club Belajar ({myClubs.length})</span>
                  </button>
                </div>
              </div>

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
                        Data mata pelajaran kurikulum belum menetapkan nama Anda (<strong>{currentUser?.name}</strong>) sebagai guru/tutor pengampu.
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
                            className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${isSelected
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
                          className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${isSelected
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
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Mulai Sekarang</span>
                  </button>
                </div>

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
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition border ${startTime === slot.start && endTime === slot.end && !isFlexibleUntilEnd
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
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition border ${selectedDuration === mins && !isFlexibleUntilEnd
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