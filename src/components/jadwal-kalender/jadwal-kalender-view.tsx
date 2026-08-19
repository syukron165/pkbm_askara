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
  Trash2,
  Edit2,
  Copy,
  Share2,
  MessageCircle,
  Check,
  Move,
  GripVertical,
  Eye,
  Maximize2,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  packetType: string;
  subjectId?: string;
  subjectCode: string;
  subjectName: string;
  teacherId?: string;
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
  scheduleRef?: ScheduleItem;
}

// Collision-free layout computation algorithm for overlapping schedules
function computeScheduleLayout(items: ScheduleItem[]) {
  if (items.length === 0) return [];

  // 1. Calculate startMinutes & endMinutes for each item
  const mapped = items.map((item) => {
    const sParts = item.startTime.split(":").map(Number);
    const eParts = item.endTime.split(":").map(Number);
    const startMin = (sParts[0] || 7) * 60 + (sParts[1] || 0);
    const endMin = Math.max((eParts[0] || 8) * 60 + (eParts[1] || 0), startMin + 30);
    return {
      item,
      startMin,
      endMin,
      colIndex: 0,
      totalCols: 1,
    };
  });

  // 2. Sort by startMin asc, then endMin desc
  mapped.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return b.endMin - a.endMin;
  });

  // 3. Cluster overlapping items
  const clusters: (typeof mapped)[] = [];
  let currentCluster: typeof mapped = [];
  let clusterEnd = 0;

  for (const ev of mapped) {
    if (currentCluster.length === 0) {
      currentCluster.push(ev);
      clusterEnd = ev.endMin;
    } else if (ev.startMin < clusterEnd) {
      // Overlaps with current cluster
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.endMin);
    } else {
      // New cluster
      clusters.push(currentCluster);
      currentCluster = [ev];
      clusterEnd = ev.endMin;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // 4. Assign columns within each cluster
  const result: {
    item: ScheduleItem;
    top: number;
    height: number;
    leftPercent: number;
    widthPercent: number;
    colIndex: number;
    totalCols: number;
  }[] = [];

  for (const cluster of clusters) {
    const colEnds: number[] = []; // tracks end time of each column

    for (const ev of cluster) {
      let placedCol = -1;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= ev.startMin) {
          placedCol = c;
          colEnds[c] = ev.endMin;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = colEnds.length;
        colEnds.push(ev.endMin);
      }
      ev.colIndex = placedCol;
    }

    const totalCols = colEnds.length;

    for (const ev of cluster) {
      const startHour = ev.startMin / 60 - 7; // 7:00 is 0px
      const endHour = ev.endMin / 60 - 7;
      const top = Math.max(0, startHour * 80);
      const height = Math.max(50, (endHour - startHour) * 80);
      const widthPercent = 100 / totalCols;
      const leftPercent = ev.colIndex * widthPercent;

      result.push({
        item: ev.item,
        top,
        height,
        leftPercent,
        widthPercent,
        colIndex: ev.colIndex,
        totalCols,
      });
    }
  }

  return result;
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
  const [viewMode, setViewMode] = useState<"cards" | "grid" | "weekly">("weekly");
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<"ADD" | "EDIT" | "DUPLICATE">("ADD");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Pop-up Detail View State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<ScheduleItem | null>(null);

  // Drag & Drop States
  const [draggedSchedule, setDraggedSchedule] = useState<ScheduleItem | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<any | null>(null);
  const [dragOverDayNum, setDragOverDayNum] = useState<number | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareScheduleItem, setShareScheduleItem] = useState<ScheduleItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Kalender States
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("SEMUA");
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // August 2026
  const [selectedEventDate, setSelectedEventDate] = useState<string>("2026-08-17");
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<"month" | "year">("month");

  // User Profile Role
  const [userRole, setUserRole] = useState<string>("admin");
  const [isLoading, setIsLoading] = useState(true);

  // Master Data States
  const [classesList, setClassesList] = useState<{ id: string; name: string; level: string; homeroom: string; homeroomTeacherId?: string }[]>([]);
  const [subjectsList, setSubjectsList] = useState<{ id: string; code: string; name: string; packetType: string }[]>([]);
  const [teachersList, setTeachersList] = useState<{ id: string; name: string; role: string; specialization?: string }[]>([]);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Form states for schedule modal
  const [newScheduleForm, setNewScheduleForm] = useState({
    packetType: "Paket A",
    classId: "",
    subjectId: "",
    teacherId: "",
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "09:30",
    room: "Ruang Belajar Askara 1",
    type: "TATAP_MUKA" as "TATAP_MUKA" | "ONLINE" | "MANDIRI",
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchSchedules();
    fetchEvents();
    fetchCurrentUser();
    fetchMasterData();
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

  const fetchMasterData = async () => {
    try {
      const [resCls, resSub, resTch] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/subjects"),
        fetch("/api/teachers"),
      ]);

      const [dataCls, dataSub, dataTch] = await Promise.all([
        resCls.json(),
        resSub.json(),
        resTch.json(),
      ]);

      if (dataCls.success && dataCls.data) {
        setClassesList(
          dataCls.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            level: c.level,
            homeroom: c.homeroom,
            homeroomTeacherId: c.homeroomTeacherId,
          }))
        );
      }

      if (dataSub.success && dataSub.data) {
        setSubjectsList(
          dataSub.data.map((s: any) => ({
            id: s.id,
            code: s.code,
            name: s.name,
            packetType: s.packetType,
          }))
        );
      }

      if (dataTch.success && dataTch.data) {
        setTeachersList(
          dataTch.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            role: t.role,
            specialization: t.specialization,
          }))
        );
      }
    } catch (e) {
      console.error("Gagal memuat master data jadwal:", e);
    }
  };

  const availableClasses = useMemo(() => {
    if (!newScheduleForm.packetType || newScheduleForm.packetType === "SEMUA") return classesList;
    const match = classesList.filter(
      (c) => c.level.toLowerCase() === newScheduleForm.packetType.toLowerCase()
    );
    return match.length > 0 ? match : classesList;
  }, [classesList, newScheduleForm.packetType]);

  const availableSubjects = useMemo(() => {
    if (!newScheduleForm.packetType || newScheduleForm.packetType === "SEMUA") return subjectsList;
    const pLower = newScheduleForm.packetType.toLowerCase();
    const match = subjectsList.filter((s) => {
      if (!s.packetType || s.packetType === "SEMUA") return true;
      return (
        s.packetType.toLowerCase().includes(pLower) ||
        pLower.includes(s.packetType.toLowerCase())
      );
    });
    return match.length > 0 ? match : subjectsList;
  }, [subjectsList, newScheduleForm.packetType]);

  const handleOpenAddSchedule = () => {
    const defaultPacket = selectedPacket !== "SEMUA" ? selectedPacket : "Paket A";
    const matchingClasses = classesList.filter(
      (c) => c.level.toLowerCase() === defaultPacket.toLowerCase()
    );
    const firstClass = matchingClasses[0] || classesList[0];
    const matchingSubjects = subjectsList.filter((s) =>
      s.packetType?.toLowerCase().includes(defaultPacket.toLowerCase())
    );
    const firstSubject = matchingSubjects[0] || subjectsList[0];
    const defaultTeacherId = firstClass?.homeroomTeacherId || (teachersList[0]?.id ?? "");

    setScheduleModalMode("ADD");
    setEditingScheduleId(null);
    setNewScheduleForm({
      packetType: defaultPacket,
      classId: firstClass?.id || "",
      subjectId: firstSubject?.id || "",
      teacherId: defaultTeacherId,
      dayOfWeek: selectedDay !== "SEMUA" ? selectedDay : "1",
      startTime: "08:00",
      endTime: "09:30",
      room: "Ruang Belajar Askara 1",
      type: "TATAP_MUKA",
      onlineLink: "",
      notes: "",
    });
    setScheduleError(null);
    setIsAddScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (item: ScheduleItem) => {
    setScheduleModalMode("EDIT");
    setEditingScheduleId(item.id);

    const matchedClass = classesList.find((c) => c.id === item.classId || c.name.toLowerCase() === item.className.toLowerCase());
    const matchedSubject = subjectsList.find((s) => s.id === item.subjectId || s.code === item.subjectCode || s.name === item.subjectName);
    const matchedTeacher = teachersList.find((t) => t.id === item.teacherId || t.name.toLowerCase() === item.teacherName.toLowerCase());

    setNewScheduleForm({
      packetType: item.packetType || "Paket A",
      classId: matchedClass?.id || item.classId || "",
      subjectId: matchedSubject?.id || item.subjectId || "",
      teacherId: matchedTeacher?.id || item.teacherId || (teachersList[0]?.id ?? ""),
      dayOfWeek: String(item.dayOfWeek),
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room || "Ruang Belajar Askara 1",
      type: item.type || "TATAP_MUKA",
      onlineLink: item.onlineLink || "",
      notes: item.notes || "",
    });
    setScheduleError(null);
    setIsAddScheduleModalOpen(true);
  };

  const handleOpenDuplicateSchedule = (item: ScheduleItem) => {
    setScheduleModalMode("DUPLICATE");
    setEditingScheduleId(null);

    const matchedClass = classesList.find((c) => c.id === item.classId || c.name.toLowerCase() === item.className.toLowerCase());
    const matchedSubject = subjectsList.find((s) => s.id === item.subjectId || s.code === item.subjectCode || s.name === item.subjectName);
    const matchedTeacher = teachersList.find((t) => t.id === item.teacherId || t.name.toLowerCase() === item.teacherName.toLowerCase());

    setNewScheduleForm({
      packetType: item.packetType || "Paket A",
      classId: matchedClass?.id || item.classId || "",
      subjectId: matchedSubject?.id || item.subjectId || "",
      teacherId: matchedTeacher?.id || item.teacherId || (teachersList[0]?.id ?? ""),
      dayOfWeek: String(item.dayOfWeek),
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room || "Ruang Belajar Askara 1",
      type: item.type || "TATAP_MUKA",
      onlineLink: item.onlineLink || "",
      notes: item.notes || "",
    });
    setScheduleError(null);
    setIsAddScheduleModalOpen(true);
  };

  const handleOpenShareSchedule = (item: ScheduleItem) => {
    setShareScheduleItem(item);
    setIsShareModalOpen(true);
  };

  const handleOpenScheduleDetail = (item: ScheduleItem) => {
    setSelectedScheduleDetail(item);
    setIsDetailModalOpen(true);
  };

  const handleShareToWhatsApp = (item: ScheduleItem) => {
    const text = `*JADWAL PELAJARAN PKBM ASKARA*
📚 *Mata Pelajaran:* ${item.subjectName} (${item.subjectCode})
🏫 *Jenjang & Kelas:* ${item.packetType} - ${item.className}
👨‍🏫 *Pendidik / Tutor:* ${item.teacherName}
🗓️ *Hari & Jam:* ${item.dayName}, ${item.startTime} - ${item.endTime} WIB
📍 *Ruang / Lokasi:* ${item.room}${item.type === "ONLINE" && item.onlineLink ? `\n🔗 *Link Sesi Daring:* ${item.onlineLink}` : ""}
${item.notes ? `📝 *Catatan:* ${item.notes}\n` : ""}
_Pusat Kegiatan Belajar Masyarakat (PKBM) Askara Kota Bandung_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyScheduleText = (item: ScheduleItem) => {
    const text = `*JADWAL PELAJARAN PKBM ASKARA*
📚 Mata Pelajaran: ${item.subjectName} (${item.subjectCode})
🏫 Jenjang & Kelas: ${item.packetType} - ${item.className}
👨‍🏫 Pendidik / Tutor: ${item.teacherName}
🗓️ Hari & Jam: ${item.dayName}, ${item.startTime} - ${item.endTime} WIB
📍 Ruang / Lokasi: ${item.room}${item.type === "ONLINE" && item.onlineLink ? `\n🔗 Link Daring: ${item.onlineLink}` : ""}
${item.notes ? `📝 Catatan: ${item.notes}\n` : ""}
PKBM Askara Kota Bandung`;

    navigator.clipboard.writeText(text);
    showToast("Teks jadwal berhasil disalin ke clipboard!");
  };

  const handleModalPacketChange = (newPacket: string) => {
    const matchingClasses = classesList.filter(
      (c) => c.level.toLowerCase() === newPacket.toLowerCase()
    );
    const firstClass = matchingClasses[0] || classesList[0];
    const matchingSubjects = subjectsList.filter((s) =>
      s.packetType?.toLowerCase().includes(newPacket.toLowerCase())
    );
    const firstSubject = matchingSubjects[0] || subjectsList[0];
    const teacherId = firstClass?.homeroomTeacherId || newScheduleForm.teacherId || (teachersList[0]?.id ?? "");

    setNewScheduleForm({
      ...newScheduleForm,
      packetType: newPacket,
      classId: firstClass?.id || "",
      subjectId: firstSubject?.id || "",
      teacherId,
    });
  };

  const handleModalClassChange = (newClassId: string) => {
    const selectedCls = classesList.find((c) => c.id === newClassId);
    let autoTeacher = newScheduleForm.teacherId;
    if (selectedCls?.homeroomTeacherId) {
      autoTeacher = selectedCls.homeroomTeacherId;
    }
    setNewScheduleForm({
      ...newScheduleForm,
      classId: newClassId,
      packetType: selectedCls?.level || newScheduleForm.packetType,
      teacherId: autoTeacher,
    });
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleForm.classId || !newScheduleForm.subjectId || !newScheduleForm.teacherId) {
      setScheduleError("Harap pilih Kelas/Rombel, Mata Pelajaran, dan Pendidik/Tutor!");
      return;
    }

    setIsSubmittingSchedule(true);
    setScheduleError(null);
    try {
      if (scheduleModalMode === "EDIT" && editingScheduleId) {
        const res = await fetch("/api/schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingScheduleId, ...newScheduleForm }),
        });
        const data = await res.json();
        if (data.success) {
          setIsAddScheduleModalOpen(false);
          fetchSchedules();
          showToast("Jadwal pelajaran berhasil diperbarui!");
        } else {
          setScheduleError(data.error || "Gagal memperbarui jadwal");
        }
      } else {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newScheduleForm),
        });
        const data = await res.json();
        if (data.success) {
          setIsAddScheduleModalOpen(false);
          fetchSchedules();
          showToast(
            scheduleModalMode === "DUPLICATE"
              ? "Jadwal pelajaran berhasil diduplikasi!"
              : "Jadwal pelajaran berhasil ditambahkan!"
          );
        } else {
          setScheduleError(data.error || "Gagal menambahkan jadwal");
        }
      }
    } catch (err: any) {
      setScheduleError("Terjadi kesalahan saat menyimpan jadwal: " + err.message);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: string, subjectName: string) => {
    if (!confirm(`Hapus jadwal pelajaran "${subjectName}"?`)) return;
    try {
      const res = await fetch(`/api/schedules?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchSchedules();
        showToast("Jadwal pelajaran berhasil dihapus!");
      } else {
        alert(data.error || "Gagal menghapus jadwal");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat menghapus jadwal: " + err.message);
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
        showToast("Agenda kalender akademik berhasil ditambahkan!");
      } else {
        alert(data.error || "Gagal menambahkan agenda");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat menyimpan agenda: " + err.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus agenda ini?")) return;
    try {
      const res = await fetch(`/api/calendar-events?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
        showToast("Agenda berhasil dihapus!");
      } else {
        alert(data.error || "Gagal menghapus agenda");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat menghapus agenda: " + err.message);
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  // 1. Weekly Schedule Drag & Drop
  const handleScheduleDragStart = (e: React.DragEvent, item: ScheduleItem) => {
    if (!canManage) return;
    setDraggedSchedule(item);
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "schedule", id: item.id }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleWeeklyDayDragOver = (e: React.DragEvent, dayNum: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDayNum !== dayNum) setDragOverDayNum(dayNum);
  };

  const handleWeeklyDayDragLeave = () => {
    setDragOverDayNum(null);
  };

  const handleWeeklyDayDrop = async (e: React.DragEvent, targetDayNum: number) => {
    e.preventDefault();
    setDragOverDayNum(null);
    if (!draggedSchedule || !canManage) return;

    const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const schedId = draggedSchedule.id;

    // Calculate approximate time slot if dragged vertically
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top - 40; // 40px header height
    let newStartTime = draggedSchedule.startTime;
    let newEndTime = draggedSchedule.endTime;

    if (offsetY >= 0) {
      const startParts = draggedSchedule.startTime.split(":").map(Number);
      const endParts = draggedSchedule.endTime.split(":").map(Number);
      const origDurationMinutes = (endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1]);

      const hourSlot = Math.min(Math.max(7 + Math.floor(offsetY / 80), 7), 17);
      const startH = String(hourSlot).padStart(2, "0");
      const startM = String(startParts[1] || 0).padStart(2, "0");
      newStartTime = `${startH}:${startM}`;

      const totalEndMinutes = hourSlot * 60 + (startParts[1] || 0) + (origDurationMinutes > 0 ? origDurationMinutes : 90);
      const endH = String(Math.min(Math.floor(totalEndMinutes / 60), 21)).padStart(2, "0");
      const endM = String(totalEndMinutes % 60).padStart(2, "0");
      newEndTime = `${endH}:${endM}`;
    }

    try {
      const res = await fetch("/api/schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: schedId,
          dayOfWeek: targetDayNum,
          startTime: newStartTime,
          endTime: newEndTime,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchSchedules();
        showToast(
          `Jadwal "${draggedSchedule.subjectName}" dipindahkan ke hari ${dayNames[targetDayNum]} (${newStartTime} - ${newEndTime} WIB)!`
        );
      } else {
        alert(data.error || "Gagal memindahkan jadwal");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat memindahkan jadwal: " + err.message);
    } finally {
      setDraggedSchedule(null);
    }
  };

  // 2. Monthly Calendar Event Drag & Drop
  const handleEventDragStart = (e: React.DragEvent, ev: any) => {
    if (!canManage) return;
    setDraggedEvent(ev);
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "event", id: ev.id }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDateCellDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDateStr !== dateStr) setDragOverDateStr(dateStr);
  };

  const handleDateCellDragLeave = () => {
    setDragOverDateStr(null);
  };

  const handleDateCellDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDateStr(null);
    if (!draggedEvent || !canManage) return;

    const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const isRecurring = draggedEvent.id.startsWith("sched-");

    if (isRecurring && draggedEvent.scheduleRef) {
      const targetDateObj = new Date(targetDateStr);
      const targetDayNum = targetDateObj.getDay() === 0 ? 7 : targetDateObj.getDay();

      try {
        const res = await fetch("/api/schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: draggedEvent.scheduleRef.id,
            dayOfWeek: targetDayNum,
          }),
        });
        const data = await res.json();
        if (data.success) {
          fetchSchedules();
          showToast(`Jadwal "${draggedEvent.title}" dipindahkan ke hari ${dayNames[targetDayNum]}!`);
        } else {
          alert(data.error || "Gagal memindahkan jadwal");
        }
      } catch (err: any) {
        alert("Gagal memindahkan jadwal: " + err.message);
      }
    } else {
      try {
        const res = await fetch("/api/calendar-events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: draggedEvent.id,
            startDate: targetDateStr,
            endDate: targetDateStr,
          }),
        });
        const data = await res.json();
        if (data.success) {
          fetchEvents();
          showToast(`Agenda "${draggedEvent.title}" dipindahkan ke tanggal ${targetDateStr}!`);
        } else {
          alert(data.error || "Gagal memindahkan agenda");
        }
      } catch (err: any) {
        alert("Gagal memindahkan agenda: " + err.message);
      }
    }

    setDraggedEvent(null);
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
    const dateObj = new Date(dateStr);
    const dayOfWeekStr = String(dateObj.getDay() === 0 ? 7 : dateObj.getDay());

    // Map schedules to Event objects
    const recurringSchedules = schedules
      .filter((s) => String(s.dayOfWeek) === dayOfWeekStr)
      .map((s) => ({
        id: `sched-${s.id}-${dateStr}`,
        scheduleRef: s,
        title: `${s.subjectName} (${s.className})`,
        category: "KBM" as any,
        startDate: dateStr,
        endDate: dateStr,
        targetAudience: s.className,
        location: s.room,
        description: `Tutor: ${s.teacherName} | Jam: ${s.startTime} - ${s.endTime}${s.notes ? `\nCatatan: ${s.notes}` : ""}`,
        color: "emerald",
      }));

    const filteredRecurring =
      selectedCategory === "SEMUA" || selectedCategory === "KBM" ? recurringSchedules : [];

    return [...explicitEvents, ...filteredRecurring];
  };

  const selectedDateEvents = useMemo(() => {
    if (!selectedEventDate) return [];
    return getEventsForDate(selectedEventDate);
  }, [selectedEventDate, filteredEvents, schedules]);

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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs font-bold animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              Informasi terpadu jadwal KBM Paket A, B, dan C, ruang kelas, tautan daring, kalender agenda semester, serta dukungan <strong>Pop-up View Detail</strong>, <strong>Anti-Tabrakan Sesi Bersamaan</strong> & <strong>Drag & Drop</strong>.
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
                onClick={handleOpenAddSchedule}
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

      {/* Info Tips for Pop-up View & Drag & Drop */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 font-semibold">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Fitur Interaktif:</strong> Klik kartu jadwal atau agenda kapan saja untuk membuka <strong>Pop-up View Detail Lengkap</strong> jika tulisan terlihat kecil/terpotong. {canManage ? "Anda juga dapat melakukan Drag & Drop untuk mengubah hari/jam belajar." : ""}
        </span>
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
                  <button
                    onClick={() => setViewMode("weekly")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      viewMode === "weekly"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Mingguan (G-Cal)
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
                          onClick={() => handleOpenScheduleDetail(item)}
                          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift flex flex-col justify-between cursor-pointer group"
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

                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                                  {item.subjectName}
                                </h3>
                                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                  {item.className} ({item.subjectCode})
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenScheduleDetail(item);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                                title="Buka Pop-up Detail"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                            </div>

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
                              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 line-clamp-2">
                                <span className="font-bold text-slate-700">Catatan: </span>
                                {item.notes}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: Online Link + Share + Duplicate + Edit + Delete */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            {item.type === "ONLINE" && item.onlineLink ? (
                              <a
                                href={item.onlineLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center space-x-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition shadow-xs mr-auto"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Buka Meet</span>
                              </a>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenScheduleDetail(item);
                                }}
                                className="inline-flex items-center space-x-1 py-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[11px] font-bold transition mr-auto"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            )}

                            {/* Share Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenShareSchedule(item);
                              }}
                              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                              title="Bagikan Jadwal (WhatsApp / Teks)"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            {/* Duplicate Button */}
                            {canManage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDuplicateSchedule(item);
                                }}
                                className="p-2 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition"
                                title="Duplikat Jadwal Pelajaran"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}

                            {/* Edit Button */}
                            {canManage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditSchedule(item);
                                }}
                                className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                                title="Edit Jadwal Pelajaran"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete Button */}
                            {canManage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSchedule(item.id, item.subjectName);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                title="Hapus Jadwal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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
                      <th className="p-3.5 font-bold uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSchedules.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
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
                          <tr
                            key={item.id}
                            onClick={() => handleOpenScheduleDetail(item)}
                            className="hover:bg-slate-50 transition cursor-pointer"
                          >
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
                            <td className="p-3.5 text-right">
                              <div className="inline-flex items-center gap-1 justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenScheduleDetail(item);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                                  title="Lihat Detail Pop-up"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenShareSchedule(item);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                  title="Bagikan Jadwal"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                {canManage && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDuplicateSchedule(item);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                                      title="Duplikat Jadwal"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditSchedule(item);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                                      title="Edit Jadwal"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSchedule(item.id, item.subjectName);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Hapus Jadwal"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weekly G-Cal View Mode (Collision-Free Layout + Quick Pop-up View + Drag & Drop) */}
          {viewMode === "weekly" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-x-auto p-4">
              <div className="min-w-[850px] flex">
                {/* Time Scale */}
                <div className="w-16 flex-shrink-0 border-r border-slate-100 pr-2">
                  <div className="h-10"></div>
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className="h-20 text-[10px] text-slate-400 font-semibold text-right relative">
                      <span className="absolute -top-2 right-2">{String(i + 7).padStart(2, "0")}:00</span>
                    </div>
                  ))}
                </div>

                {/* Days Columns */}
                <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100">
                  {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                    const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
                    const daySchedules = filteredSchedules.filter((s) => s.dayOfWeek === dayNum);
                    const layoutItems = computeScheduleLayout(daySchedules);
                    const isDragOver = dragOverDayNum === dayNum;

                    return (
                      <div
                        key={dayNum}
                        onDragOver={(e) => handleWeeklyDayDragOver(e, dayNum)}
                        onDragLeave={handleWeeklyDayDragLeave}
                        onDrop={(e) => handleWeeklyDayDrop(e, dayNum)}
                        className={`relative transition-colors ${
                          isDragOver
                            ? "bg-emerald-50/80 ring-2 ring-emerald-500/40 rounded-xl"
                            : ""
                        }`}
                      >
                        <div className="h-10 flex flex-col items-center justify-center border-b border-slate-100 mb-2">
                          <span className="text-[11px] font-bold text-slate-700 uppercase">
                            {dayNames[dayNum]}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {daySchedules.length} Sesi
                          </span>
                        </div>

                        <div className="relative h-[880px] w-full">
                          {/* Grid Lines */}
                          {Array.from({ length: 11 }).map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-full h-20 border-t border-slate-50"
                              style={{ top: `${i * 80}px` }}
                            />
                          ))}

                          {/* Collision-Free Events Layout */}
                          {layoutItems.map(({ item, top, height, leftPercent, widthPercent, colIndex, totalCols }) => {
                            return (
                              <div
                                key={item.id}
                                draggable={canManage}
                                onDragStart={(e) => handleScheduleDragStart(e, item)}
                                onClick={() => handleOpenScheduleDetail(item)}
                                title={`Klik untuk membuka Pop-up Detail:\n${item.subjectName} (${item.subjectCode})\n${item.className} • ${item.teacherName}\n${item.startTime} - ${item.endTime} WIB • ${item.room}`}
                                className={`group absolute rounded-xl p-2 text-[10px] leading-tight border transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer active:cursor-grabbing flex flex-col justify-between overflow-hidden ${
                                  totalCols > 1 ? "ring-1 ring-black/5" : ""
                                }`}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  left: `calc(${leftPercent}% + 2px)`,
                                  width: `calc(${widthPercent}% - 4px)`,
                                  backgroundColor: item.type === "ONLINE" ? "#eff6ff" : "#ecfdf5",
                                  borderColor: item.type === "ONLINE" ? "#bfdbfe" : "#a7f3d0",
                                  zIndex: 10 + colIndex,
                                }}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="font-bold text-slate-900 truncate">
                                      {item.subjectName}
                                    </span>
                                    {totalCols > 1 && (
                                      <span className="text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                                        Sesi {colIndex + 1}/{totalCols}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-600 font-semibold truncate">
                                    {item.startTime} - {item.endTime}
                                  </div>
                                  <div className="text-slate-500 font-medium truncate mt-0.5">
                                    {item.className}
                                  </div>
                                  <div className="text-slate-500 truncate">{item.room}</div>
                                </div>

                                {/* Hover action shortcuts */}
                                <div className="pt-1 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenScheduleDetail(item);
                                    }}
                                    className="p-1 bg-white/90 hover:bg-slate-900 hover:text-white text-slate-700 rounded-md transition shadow-xs"
                                    title="Lihat Detail Lengkap (Pop-up)"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenShareSchedule(item);
                                    }}
                                    className="p-1 bg-white/90 hover:bg-emerald-600 hover:text-white text-slate-600 rounded-md transition shadow-xs"
                                    title="Bagikan Jadwal"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                  {canManage && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenDuplicateSchedule(item);
                                        }}
                                        className="p-1 bg-white/90 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-md transition shadow-xs"
                                        title="Duplikat"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditSchedule(item);
                                        }}
                                        className="p-1 bg-white/90 hover:bg-blue-600 hover:text-white text-slate-600 rounded-md transition shadow-xs"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
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

            <div className="flex items-center space-x-4">
              <div className="text-xs font-semibold text-slate-500">
                Tahun Ajaran: <span className="text-emerald-700 font-bold">2025/2026</span>
              </div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  onClick={() => setCalendarView("month")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    calendarView === "month"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Bulan
                </button>
                <button
                  onClick={() => setCalendarView("year")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    calendarView === "year"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  1 Tahun
                </button>
              </div>
            </div>
          </div>

          {/* Main Calendar View & Sidebar Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Calendar Grid (Month/Year) */}
            {calendarView === "month" ? (
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

                {/* Days Grid with Drag & Drop Support */}
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl bg-slate-50/50" />
                  ))}

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
                    const isDragOver = dragOverDateStr === dateStr;

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedEventDate(dateStr)}
                        onDragOver={(e) => handleDateCellDragOver(e, dateStr)}
                        onDragLeave={handleDateCellDragLeave}
                        onDrop={(e) => handleDateCellDrop(e, dateStr)}
                        className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between text-left overflow-hidden ${
                          isDragOver
                            ? "border-emerald-500 bg-emerald-100/70 ring-2 ring-emerald-500/50 scale-[1.02]"
                            : isSelected
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

                        {/* Event Mini Indicators (Draggable + Click to inspect) */}
                        <div className="space-y-1 overflow-hidden mt-1">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              draggable={canManage}
                              onDragStart={(e) => handleEventDragStart(e, ev)}
                              onClick={(e) => {
                                if (ev.scheduleRef) {
                                  e.stopPropagation();
                                  handleOpenScheduleDetail(ev.scheduleRef);
                                }
                              }}
                              className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded border cursor-grab active:cursor-grabbing ${getCategoryBadgeClass(
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
            ) : (
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-emerald-700" />
                    <h2 className="text-lg font-bold text-slate-900">Tahun {year}</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentDate(new Date(year - 1, month, 1))}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      aria-label="Tahun Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date(2026, 7, 1))}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      Tahun Ini
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date(year + 1, month, 1))}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      aria-label="Tahun Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, mIdx) => {
                    const mDaysInMonth = new Date(year, mIdx + 1, 0).getDate();
                    const mFirstDayIndex = new Date(year, mIdx, 1).getDay();

                    return (
                      <div key={mIdx} className="border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                        <h3 className="text-xs font-bold text-emerald-800 text-center mb-2">{monthNames[mIdx]}</h3>
                        <div className="grid grid-cols-7 text-[8px] text-center font-bold text-slate-400 mb-1">
                          <span className="text-rose-500">M</span>
                          <span>S</span>
                          <span>S</span>
                          <span>R</span>
                          <span>K</span>
                          <span>J</span>
                          <span>S</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                          {Array.from({ length: mFirstDayIndex }).map((_, idx) => (
                            <div key={`empty-${idx}`} />
                          ))}
                          {Array.from({ length: mDaysInMonth }).map((_, idx) => {
                            const dateStr = `${year}-${String(mIdx + 1).padStart(2, "0")}-${String(
                              idx + 1
                            ).padStart(2, "0")}`;
                            const dayEvents = getEventsForDate(dateStr);
                            const isSelected = selectedEventDate === dateStr;
                            return (
                              <div
                                key={dateStr}
                                onClick={() => {
                                  setSelectedEventDate(dateStr);
                                  setCalendarView("month");
                                  setCurrentDate(new Date(year, mIdx, 1));
                                }}
                                className={`cursor-pointer rounded-sm py-0.5 transition-all ${
                                  isSelected
                                    ? "bg-emerald-600 text-white font-bold shadow-sm"
                                    : dayEvents.length > 0
                                    ? "bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200"
                                    : "hover:bg-slate-200 text-slate-600"
                                }`}
                              >
                                {idx + 1}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                    {selectedDateEvents.map((ev: any) => {
                      const isRecurring = ev.id.startsWith("sched-");
                      const schedRef: ScheduleItem | undefined = ev.scheduleRef;

                      return (
                        <div
                          key={ev.id}
                          onClick={() => {
                            if (schedRef) handleOpenScheduleDetail(schedRef);
                          }}
                          className={`p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 ${
                            schedRef ? "cursor-pointer hover:border-emerald-300 transition" : ""
                          }`}
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

                          <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
                            {ev.description}
                          </p>

                          <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 space-y-1">
                            <div className="flex items-center space-x-1.5 justify-between">
                              <div className="flex items-center space-x-1.5">
                                <Layers className="w-3 h-3 text-slate-400" />
                                <span>Peserta: {ev.targetAudience}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>Lokasi: {ev.location}</span>
                            </div>
                          </div>

                          {/* Quick Action Toolbar in Calendar Sidebar */}
                          <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-slate-200/60">
                            {isRecurring && schedRef ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenScheduleDetail(schedRef);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition"
                                  title="Lihat Pop-up Detail"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Pop-up</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenShareSchedule(schedRef);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition"
                                  title="Bagikan Jadwal"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>Share</span>
                                </button>
                                {canManage && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDuplicateSchedule(schedRef);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold transition"
                                      title="Duplikat Jadwal"
                                    >
                                      <Copy className="w-3 h-3" />
                                      <span>Duplikat</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditSchedule(schedRef);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition"
                                      title="Edit Jadwal"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSchedule(schedRef.id, schedRef.subjectName);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Hapus Jadwal"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </>
                            ) : (
                              canManage && (
                                <button
                                  onClick={() => handleDeleteEvent(ev.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Hapus Agenda"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
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

      {/* MODAL: Pop-up View Detail Lengkap Jadwal Pelajaran */}
      {isDetailModalOpen && selectedScheduleDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-start space-x-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    selectedScheduleDetail.type === "ONLINE"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {selectedScheduleDetail.type === "ONLINE" ? (
                    <Video className="w-6 h-6" />
                  ) : (
                    <BookOpen className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {selectedScheduleDetail.packetType}
                    </span>
                    {selectedScheduleDetail.type === "ONLINE" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <Video className="w-3 h-3" />
                        <span>Daring (Online)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <MapPin className="w-3 h-3" />
                        <span>Tatap Muka di Kelas</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {selectedScheduleDetail.subjectName}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Kode: <span className="font-bold text-slate-700">{selectedScheduleDetail.subjectCode || "-"}</span> • Rombel: <span className="font-bold text-emerald-800">{selectedScheduleDetail.className}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Details */}
            <div className="mt-5 space-y-3.5 text-xs text-slate-700">
              {/* Waktu & Hari */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase">Hari & Waktu Belajar</div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      Hari {selectedScheduleDetail.dayName}, {selectedScheduleDetail.startTime} - {selectedScheduleDetail.endTime} WIB
                    </div>
                  </div>
                </div>
              </div>

              {/* Tutor & Ruangan Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center space-x-2 text-slate-500 font-bold text-[11px] uppercase">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pendidik / Tutor</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    {selectedScheduleDetail.teacherName}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center space-x-2 text-slate-500 font-bold text-[11px] uppercase">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ruang / Lokasi</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    {selectedScheduleDetail.room || "Ruang Belajar Askara"}
                  </div>
                </div>
              </div>

              {/* Online Link if any */}
              {selectedScheduleDetail.type === "ONLINE" && selectedScheduleDetail.onlineLink && (
                <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900 uppercase">Tautan Sesi Daring (Meet)</span>
                    <a
                      href={selectedScheduleDetail.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Masuk Ruang Sesi</span>
                    </a>
                  </div>
                  <p className="text-[11px] text-blue-800 font-mono break-all">
                    {selectedScheduleDetail.onlineLink}
                  </p>
                </div>
              )}

              {/* Catatan Tambahan */}
              {selectedScheduleDetail.notes ? (
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-1">
                  <div className="text-[11px] font-bold text-amber-900 uppercase">Catatan Pembelajaran:</div>
                  <p className="text-xs text-amber-950 whitespace-pre-line leading-relaxed">
                    {selectedScheduleDetail.notes}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-400 italic text-center">
                  Tidak ada instruksi khusus untuk sesi jadwal ini.
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareToWhatsApp(selectedScheduleDetail)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
                <button
                  onClick={() => handleCopyScheduleText(selectedScheduleDetail)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-200"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </button>
              </div>

              {canManage && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenDuplicateSchedule(selectedScheduleDetail);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplikat</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEditSchedule(selectedScheduleDetail);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleDeleteSchedule(selectedScheduleDetail.id, selectedScheduleDetail.subjectName);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Hapus Jadwal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit / Duplikat Jadwal Pelajaran (Admin / Pendidik) */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    scheduleModalMode === "EDIT"
                      ? "bg-blue-100 text-blue-700"
                      : scheduleModalMode === "DUPLICATE"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {scheduleModalMode === "EDIT" ? (
                    <Edit2 className="w-5 h-5" />
                  ) : scheduleModalMode === "DUPLICATE" ? (
                    <Copy className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {scheduleModalMode === "EDIT"
                      ? "Edit Jadwal Pelajaran"
                      : scheduleModalMode === "DUPLICATE"
                      ? "Duplikat Jadwal Pelajaran"
                      : "Tambah Jadwal Pelajaran Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {scheduleModalMode === "EDIT"
                      ? "Perbarui kelas, mata pelajaran, waktu, atau ruang KBM"
                      : scheduleModalMode === "DUPLICATE"
                      ? "Duplikat data jadwal ini ke hari atau jam belajar yang lain"
                      : "Pilih kelas, mata pelajaran, dan tutor pengampu"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scheduleError && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{scheduleError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jenjang Paket <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newScheduleForm.packetType}
                    onChange={(e) => handleModalPacketChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Paket A">Paket A (Setara SD)</option>
                    <option value="Paket B">Paket B (Setara SMP)</option>
                    <option value="Paket C">Paket C (Setara SMA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Kelas / Rombel <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newScheduleForm.classId}
                    onChange={(e) => handleModalClassChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">-- Pilih Kelas / Rombel --</option>
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newScheduleForm.subjectId}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, subjectId: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `[${s.code}] ` : ""}{s.name} ({s.packetType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pendidik / Tutor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newScheduleForm.teacherId}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, teacherId: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">-- Pilih Pendidik / Tutor --</option>
                    {teachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role || "Tutor"}{t.specialization ? ` • ${t.specialization}` : ""})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hari</label>
                  <select
                    value={newScheduleForm.dayOfWeek}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, dayOfWeek: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={newScheduleForm.startTime}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, startTime: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={newScheduleForm.endTime}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, endTime: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipe Pembelajaran</label>
                  <select
                    value={newScheduleForm.type}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, type: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="TATAP_MUKA">Tatap Muka di Kelas</option>
                    <option value="ONLINE">Daring (Google Meet / Zoom)</option>
                    <option value="MANDIRI">Belajar Mandiri Terstruktur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Ruangan / Tempat</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Belajar 1"
                    value={newScheduleForm.room}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, room: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {newScheduleForm.type === "ONLINE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tautan Sesi Daring (Link Meet)</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={newScheduleForm.onlineLink}
                    onChange={(e) =>
                      setNewScheduleForm({ ...newScheduleForm, onlineLink: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Membawa modul matematika bab 3"
                  value={newScheduleForm.notes}
                  onChange={(e) =>
                    setNewScheduleForm({ ...newScheduleForm, notes: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  disabled={isSubmittingSchedule}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800/60 rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {isSubmittingSchedule
                    ? "Menyimpan Jadwal..."
                    : scheduleModalMode === "EDIT"
                    ? "Simpan Perubahan"
                    : scheduleModalMode === "DUPLICATE"
                    ? "Simpan Sebagai Jadwal Baru"
                    : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Share Jadwal Pelajaran */}
      {isShareModalOpen && shareScheduleItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bagikan Jadwal Pelajaran</h3>
                  <p className="text-xs text-slate-500">Kirim jadwal ke grup WhatsApp kelas atau salin format teks</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Card */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 font-sans">
              <div className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{shareScheduleItem.subjectName} ({shareScheduleItem.subjectCode})</span>
              </div>
              <div className="space-y-1 text-slate-700">
                <p><strong>Jenjang & Kelas:</strong> {shareScheduleItem.packetType} - {shareScheduleItem.className}</p>
                <p><strong>Pendidik / Tutor:</strong> {shareScheduleItem.teacherName}</p>
                <p><strong>Waktu Belajar:</strong> Hari {shareScheduleItem.dayName}, {shareScheduleItem.startTime} - {shareScheduleItem.endTime} WIB</p>
                <p><strong>Ruangan / Media:</strong> {shareScheduleItem.room} {shareScheduleItem.type === "ONLINE" ? "(Daring / Online)" : ""}</p>
                {shareScheduleItem.onlineLink && (
                  <p className="text-blue-700 truncate"><strong>Link Sesi:</strong> {shareScheduleItem.onlineLink}</p>
                )}
                {shareScheduleItem.notes && (
                  <p className="text-slate-500 italic"><strong>Catatan:</strong> {shareScheduleItem.notes}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => handleShareToWhatsApp(shareScheduleItem)}
                className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-900/20 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim ke WhatsApp</span>
              </button>

              <button
                onClick={() => handleCopyScheduleText(shareScheduleItem)}
                className="w-full sm:flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition border border-slate-300 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Salin Teks Pesan</span>
              </button>
            </div>
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
