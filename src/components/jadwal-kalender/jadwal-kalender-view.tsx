"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  User,
  BookOpen,
  Filter,
  Search,
  Printer,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  GraduationCap,
  Download,
  Info,
  ExternalLink,
  X,
  FileText,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  packetType: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  room: string;
  type: "TATAP_MUKA" | "ONLINE" | "MANDIRI";
  onlineLink?: string | null;
  notes?: string;
}

interface CalendarEventItem {
  id: string;
  title: string;
  category: "KBM" | "ASESMEN" | "LIBUR" | "VOKASI" | "RAPOR" | "RAPAT";
  startDate: string;
  endDate: string;
  targetAudience: string;
  location: string;
  description: string;
  color: string;
}

export default function JadwalKalenderView({
  initialTab = "jadwal",
}: {
  initialTab?: "jadwal" | "kalender";
}) {
  const [activeTab, setActiveTab] = useState<"jadwal" | "kalender">(initialTab);

  // Jadwal States
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<string>("SEMUA");
  const [selectedDay, setSelectedDay] = useState<string>("SEMUA");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);

  // Kalender States
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("SEMUA");
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // August 2026
  const [selectedEventDate, setSelectedEventDate] = useState<string>("2026-08-17");
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // User Profile Role
  const [userRole, setUserRole] = useState<string>("admin");
  const [isLoading, setIsLoading] = useState(true);

  // Form states for new schedule
  const [newScheduleForm, setNewScheduleForm] = useState({
    className: "Paket C - Kelas X Merdeka",
    packetType: "Paket C",
    subjectName: "",
    teacherName: "",
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "09:30",
    room: "Ruang Belajar Askara 1",
    type: "TATAP_MUKA",
    onlineLink: "",
    notes: "",
  });

  // Form states for new event
  const [newEventForm, setNewEventForm] = useState({
    title: "",
    category: "KBM",
    startDate: "2026-08-20",
    endDate: "2026-08-20",
    targetAudience: "Semua Paket",
    location: "Kampus PKBM Askara",
    description: "",
  });

  useEffect(() => {
    fetchSchedules();
    fetchEvents();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.user?.role || "admin");
      }
    } catch {
      // Default to guest/siswa
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/schedules");
      const data = await res.json();
      if (data.success && data.data) {
        setSchedules(data.data);
      }
    } catch (e) {
      console.error("Gagal memuat jadwal:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/calendar-events");
      const data = await res.json();
      if (data.success && data.data) {
        setEvents(data.data);
      }
    } catch (e) {
      console.error("Gagal memuat agenda kalender:", e);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newScheduleForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddScheduleModalOpen(false);
        fetchSchedules();
        alert("Jadwal pelajaran berhasil ditambahkan!");
      } else {
        alert(data.error || "Gagal menambahkan jadwal");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat menyimpan jadwal: " + err.message);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEventForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddEventModalOpen(false);
        fetchEvents();
        alert("Agenda kalender akademik berhasil ditambahkan!");
      } else {
        alert(data.error || "Gagal menambahkan agenda");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat menyimpan agenda: " + err.message);
    }
  };

  // Filtered Schedules
  const daysList = [
    { num: "SEMUA", label: "Semua Hari" },
    { num: "1", label: "Senin" },
    { num: "2", label: "Selasa" },
    { num: "3", label: "Rabu" },
    { num: "4", label: "Kamis" },
    { num: "5", label: "Jumat" },
    { num: "6", label: "Sabtu" },
    { num: "7", label: "Minggu" },
  ];

  const packetList = ["SEMUA", "Paket A", "Paket B", "Paket C"];

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchPacket =
        selectedPacket === "SEMUA" ||
        s.packetType.toLowerCase() === selectedPacket.toLowerCase();
      const matchDay =
        selectedDay === "SEMUA" || String(s.dayOfWeek) === selectedDay;
      const matchSearch =
        s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.room.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPacket && matchDay && matchSearch;
    });
  }, [schedules, selectedPacket, selectedDay, searchQuery]);

  // Group schedules by day for Card View
  const groupedSchedulesByDay = useMemo(() => {
    const days = [1, 2, 3, 4, 5, 6, 7];
    const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const groups: { dayNum: number; dayName: string; items: ScheduleItem[] }[] = [];

    days.forEach((dayNum) => {
      const items = filteredSchedules.filter((s) => s.dayOfWeek === dayNum);
      if (selectedDay === "SEMUA") {
        if (items.length > 0) {
          groups.push({
            dayNum,
            dayName: dayNames[dayNum],
            items: items.sort((a, b) => a.startTime.localeCompare(b.startTime)),
          });
        }
      } else if (String(dayNum) === selectedDay) {
        groups.push({
          dayNum,
          dayName: dayNames[dayNum],
          items: items.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        });
      }
    });

    return groups;
  }, [filteredSchedules, selectedDay]);

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchCat =
        selectedCategory === "SEMUA" ||
        e.category.toUpperCase() === selectedCategory.toUpperCase();
      return matchCat;
    });
  }, [events, selectedCategory]);

  const getEventsForDate = (dateStr: string) => {
    // 1. Get explicit calendar events
    const explicitEvents = filteredEvents.filter((e) => {
      return dateStr >= e.startDate && dateStr <= e.endDate;
    });

    // 2. Get recurring lesson schedules for this day of the week
    // Date string is YYYY-MM-DD
    const dateObj = new Date(dateStr);
    // getDay() is 0 for Sunday, 1 for Monday. We need 1=Monday, 7=Sunday
    const dayOfWeekStr = String(dateObj.getDay() === 0 ? 7 : dateObj.getDay());
    
    // Map schedules to Event objects
    const recurringSchedules = schedules
      .filter((s) => String(s.dayOfWeek) === dayOfWeekStr)
      .map((s) => ({
        id: `sched-${s.id}-${dateStr}`,
        title: `${s.subjectName} (${s.className})`,
        category: "KBM" as any,
        startDate: dateStr,
        endDate: dateStr,
        targetAudience: s.className,
        location: s.room,
        description: `Tutor: ${s.teacherName} | Jam: ${s.startTime} - ${s.endTime}${s.notes ? `\nCatatan: ${s.notes}` : ''}`,
        color: "emerald"
      }));

    // Filter recurring schedules based on category selection
    const filteredRecurring = (selectedCategory === "SEMUA" || selectedCategory === "KBM") ? recurringSchedules : [];

    return [...explicitEvents, ...filteredRecurring];
  };

  const selectedDateEvents = useMemo(() => {
    if (!selectedEventDate) return [];
    return getEventsForDate(selectedEventDate);
  }, [selectedEventDate, filteredEvents]);

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "KBM":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ASESMEN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "LIBUR":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "VOKASI":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "RAPOR":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "RAPAT":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getCategoryColorDot = (category: string) => {
    switch (category) {
      case "KBM":
        return "bg-emerald-500";
      case "ASESMEN":
        return "bg-blue-500";
      case "LIBUR":
        return "bg-rose-500";
      case "VOKASI":
        return "bg-purple-500";
      case "RAPOR":
        return "bg-indigo-500";
      case "RAPAT":
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const canManage = userRole === "super_admin" || userRole === "admin" || userRole === "pendidik";

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <CalendarDays className="w-4 h-4" />
              <span>Pusat Informasi Akademik & KBM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Jadwal Pelajaran & Kalender Akademik
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
              Informasi terpadu jadwal kegiatan belajar mengajar (KBM) Paket A, B, dan C, ruang kelas, tautan sesi daring, serta kalender agenda semester Tahun Ajaran 2025/2026.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen</span>
            </button>

            {canManage && activeTab === "jadwal" && (
              <button
                onClick={() => setIsAddScheduleModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jadwal</span>
              </button>
            )}

            {canManage && activeTab === "kalender" && (
              <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Agenda</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="mt-8 flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("jadwal")}
            className={`pb-3.5 text-sm font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === "jadwal"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Jadwal Pelajaran Mingguan</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ml-1">
              {schedules.length} Sesi
            </span>
          </button>

          <button
            onClick={() => setActiveTab("kalender")}
            className={`pb-3.5 text-sm font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === "kalender"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Kalender Akademik 2025/2026</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 ml-1">
              {events.length} Agenda
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: JADWAL PELAJARAN */}
      {activeTab === "jadwal" && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
              {/* Packet Type Filter Tabs */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
                <span className="text-xs font-bold text-slate-400 uppercase mr-1">Jenjang:</span>
                {packetList.map((pkt) => (
                  <button
                    key={pkt}
                    onClick={() => setSelectedPacket(pkt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedPacket === pkt
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    {pkt}
                  </button>
                ))}
              </div>

              {/* Search and Day Select */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari mapel / guru / ruang..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                </div>

                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                >
                  {daysList.map((d) => (
                    <option key={d.num} value={d.num}>
                      {d.label}
                    </option>
                  ))}
                </select>

                {/* View Mode Toggle */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      viewMode === "cards"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Kartu
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      viewMode === "grid"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Tabel Matriks
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card View Mode */}
          {viewMode === "cards" && (
            <div className="space-y-6">
              {groupedSchedulesByDay.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Tidak ada jadwal ditemukan</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan ubah filter jenjang, hari, atau kata kunci pencarian Anda.
                  </p>
                </div>
              ) : (
                groupedSchedulesByDay.map((group) => (
                  <div key={group.dayNum} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Hari {group.dayName}
                      </h2>
                      <span className="text-xs text-slate-400 font-semibold">
                        ({group.items.length} Mata Pelajaran)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift flex flex-col justify-between"
                        >
                          <div>
                            {/* Packet & Type Badges */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {item.packetType}
                              </span>

                              {item.type === "ONLINE" ? (
                                <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  <Video className="w-3 h-3 text-blue-600" />
                                  <span>Daring (Online)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  <span>Tatap Muka</span>
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-bold text-slate-900">
                              {item.subjectName}
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">
                              {item.className} ({item.subjectCode})
                            </p>

                            {/* Details List */}
                            <div className="mt-4 space-y-2 text-xs text-slate-600">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-900">
                                  {item.startTime} - {item.endTime} WIB
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Tutor: {item.teacherName}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>{item.room}</span>
                              </div>
                            </div>

                            {item.notes && (
                              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                                <span className="font-bold text-slate-700">Catatan: </span>
                                {item.notes}
                              </div>
                            )}
                          </div>

                          {/* Online Join Button if available */}
                          {item.type === "ONLINE" && item.onlineLink && (
                            <div className="mt-4 pt-3 border-t border-slate-100">
                              <a
                                href={item.onlineLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center space-x-1.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Gabung Sesi Online</span>
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Weekly Timetable Grid Mode */}
          {viewMode === "grid" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Matriks Jadwal Mingguan PKBM Askara
                </span>
                <span className="text-xs text-slate-500">
                  Semester Ganjil 2025/2026
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-3.5 font-bold uppercase tracking-wider w-24">Hari</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider w-32">Waktu</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Jenjang & Rombel</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Mata Pelajaran</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Pendidik / Tutor</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Ruang / Media</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Tipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSchedules.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          Tidak ada jadwal sesuai kriteria
                        </td>
                      </tr>
                    ) : (
                      filteredSchedules
                        .sort((a, b) => {
                          if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                          return a.startTime.localeCompare(b.startTime);
                        })
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 font-bold text-slate-900">{item.dayName}</td>
                            <td className="p-3.5 font-semibold text-emerald-800">
                              {item.startTime} - {item.endTime}
                            </td>
                            <td className="p-3.5 font-medium text-slate-700">{item.className}</td>
                            <td className="p-3.5 font-bold text-slate-900">
                              {item.subjectName}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {item.subjectCode}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-700">{item.teacherName}</td>
                            <td className="p-3.5 text-slate-600">{item.room}</td>
                            <td className="p-3.5">
                              {item.type === "ONLINE" ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                  Online
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Tatap Muka
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KALENDER AKADEMIK */}
      {activeTab === "kalender" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-400 uppercase mr-1">Kategori:</span>
              {[
                { id: "SEMUA", label: "Semua Kategori" },
                { id: "KBM", label: "🎓 KBM & Orientasi" },
                { id: "ASESMEN", label: "📝 Ujian & ANBK" },
                { id: "LIBUR", label: "🌴 Libur Nasional" },
                { id: "VOKASI", label: "🏆 Karya Vokasi" },
                { id: "RAPOR", label: "📜 e-Rapor" },
                { id: "RAPAT", label: "📢 Pertemuan Ortu" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Tahun Ajaran: <span className="text-emerald-700 font-bold">2025/2026</span>
            </div>
          </div>

          {/* Main Calendar View & Sidebar Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Monthly Calendar Grid */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
              {/* Calendar Month Navigation Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    {monthNames[month]} {year}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevMonth}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    aria-label="Bulan Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(2026, 7, 1))}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    Bulan Ini
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    aria-label="Bulan Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase py-2 border-y border-slate-100">
                <span className="text-rose-500">Min</span>
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells before month starts */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl bg-slate-50/50" />
                ))}

                {/* Actual Days of the Month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                    dayNum
                  ).padStart(2, "0")}`;
                  const dayEvents = getEventsForDate(dateStr);
                  const isSelected = selectedEventDate === dateStr;
                  const isToday =
                    new Date().getFullYear() === year &&
                    new Date().getMonth() === month &&
                    new Date().getDate() === dayNum;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedEventDate(dateStr)}
                      className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between text-left overflow-hidden ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                          : dayEvents.length > 0
                          ? "border-slate-200 bg-slate-50/70 hover:border-emerald-300"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isToday
                              ? "w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]"
                              : isSelected
                              ? "text-emerald-800"
                              : "text-slate-700"
                          }`}
                        >
                          {dayNum}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Mini Indicators */}
                      <div className="space-y-1 overflow-hidden mt-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(
                              ev.category
                            )}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-slate-500 font-semibold pl-1">
                            +{dayEvents.length - 2} lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Selected Date Events & Agenda Timeline */}
            <div className="space-y-4">
              {/* Selected Date Detail Box */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      Agenda Tanggal {selectedEventDate}
                    </h3>
                  </div>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada agenda resmi pada tanggal ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                              ev.category
                            )}`}
                          >
                            {ev.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {ev.startDate === ev.endDate
                              ? ev.startDate
                              : `${ev.startDate} s/d ${ev.endDate}`}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {ev.title}
                        </h4>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {ev.description}
                        </p>

                        <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <Layers className="w-3 h-3 text-slate-400" />
                            <span>Peserta: {ev.targetAudience}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>Lokasi: {ev.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Semester Upcoming Agenda List */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Daftar Agenda Semester</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    2025/2026
                  </span>
                </h3>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedEventDate(ev.startDate);
                        const evDate = new Date(ev.startDate);
                        setCurrentDate(new Date(evDate.getFullYear(), evDate.getMonth(), 1));
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                        selectedEventDate === ev.startDate
                          ? "border-emerald-500 bg-emerald-50/40"
                          : "border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full ${getCategoryColorDot(ev.category)}`}
                        />
                        <span className="text-[10px] font-bold text-slate-500">
                          {ev.startDate}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{ev.title}</h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {ev.targetAudience} • {ev.location}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Jadwal Pelajaran (Admin / Pendidik) */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Jadwal Pelajaran Baru</h3>
              <button
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang Paket</label>
                  <select
                    value={newScheduleForm.packetType}
                    onChange={(e) =>
                      setNewScheduleForm({
                        ...newScheduleForm,
                        packetType: e.target.value,
                        className: `${e.target.value} - Rombel Baru`,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="Paket A">Paket A (Setara SD)</option>
                    <option value="Paket B">Paket B (Setara SMP)</option>
                    <option value="Paket C">Paket C (Setara SMA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kelas / Rombel</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.className}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, className: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Matematika Terapan"
                    value={newScheduleForm.subjectName}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, subjectName: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pendidik / Tutor</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Guru & Gelar"
                    value={newScheduleForm.teacherName}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, teacherName: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={newScheduleForm.dayOfWeek}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, dayOfWeek: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="1">Senin</option>
                    <option value="2">Selasa</option>
                    <option value="3">Rabu</option>
                    <option value="4">Kamis</option>
                    <option value="5">Jumat</option>
                    <option value="6">Sabtu</option>
                    <option value="7">Minggu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={newScheduleForm.startTime}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, startTime: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={newScheduleForm.endTime}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, endTime: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Pembelajaran</label>
                  <select
                    value={newScheduleForm.type}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, type: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="TATAP_MUKA">Tatap Muka di Kelas</option>
                    <option value="ONLINE">Daring (Google Meet / Zoom)</option>
                    <option value="MANDIRI">Belajar Mandiri Terstruktur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ruangan / Tempat</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Belajar 1"
                    value={newScheduleForm.room}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, room: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {newScheduleForm.type === "ONLINE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tautan Sesi Daring (Link Meet)</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={newScheduleForm.onlineLink}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, onlineLink: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Membawa modul matematika bab 3"
                  value={newScheduleForm.notes}
                  onChange={(e) =>
                    setNewScheduleForm({ ...newScheduleForm, notes: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Agenda Kalender Akademik (Admin) */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Agenda Kalender Akademik</h3>
              <button
                onClick={() => setIsAddEventModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Kegiatan / Agenda</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Asesmen Sumatif Akhir Semester"
                  value={newEventForm.title}
                  onChange={(e) =>
                    setNewEventForm({ ...newEventForm, title: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newEventForm.category}
                    onChange={(e) =>
                      setNewEventForm({ ...newEventForm, category: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="KBM">KBM & Orientasi</option>
                    <option value="ASESMEN">Ujian & ANBK / UK</option>
                    <option value="LIBUR">Libur & Cuti Bersama</option>
                    <option value="VOKASI">Gelar Karya Vokasi</option>
                    <option value="RAPOR">Penerbitan e-Rapor</option>
                    <option value="RAPAT">Pertemuan Wali Murid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sasaran Peserta</label>
                  <input
                    type="text"
                    placeholder="Semua Paket / Paket C"
                    value={newEventForm.targetAudience}
                    onChange={(e) =>
                      setNewEventForm({ ...newEventForm, targetAudience: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={newEventForm.startDate}
                    onChange={(e) =>
                      setNewEventForm({ ...newEventForm, startDate: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={newEventForm.endDate}
                    onChange={(e) =>
                      setNewEventForm({ ...newEventForm, endDate: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  placeholder="Kampus PKBM Askara / Lab CBT"
                  value={newEventForm.location}
                  onChange={(e) =>
                    setNewEventForm({ ...newEventForm, location: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Kegiatan</label>
                <textarea
                  rows={3}
                  placeholder="Rincian agenda atau instruksi penting bagi peserta..."
                  value={newEventForm.description}
                  onChange={(e) =>
                    setNewEventForm({ ...newEventForm, description: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-xs"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
