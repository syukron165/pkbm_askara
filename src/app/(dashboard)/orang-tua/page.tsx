"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Award,
  BookOpen,
  UserCheck,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Clock,
  Download,
  AlertCircle,
  Sparkles,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Plus,
  X,
  Send,
  Loader2,
  Check,
  Search,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface ChildData {
  id: string;
  name: string;
  email: string;
  phone: string;
  nisn: string;
  nik: string;
  packetType: string;
  studyModel: string;
  status: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  address: string;
  avatarUrl: string | null;
  className: string;
  homeroomTeacher: string;
  academicYear: string;
  semester: string;
  stats: {
    attendanceRate: string;
    totalMeetings: number;
    presentCount: number;
    izinCount: number;
    sakitCount: number;
    alpaCount: number;
    averageGrade: string;
    gradedTasksCount: number;
    cbtCompletedCount: number;
    clubCount: number;
    reportCardAvailable: boolean;
  };
  recentGrades: Array<{
    id: string;
    type: string;
    subject: string;
    title: string;
    grade: number;
    date: string;
  }>;
  attendanceLogs: Array<{
    id: string;
    date: string;
    time: string;
    status: string;
    method: string;
  }>;
  clubs: Array<{
    id: string;
    name: string;
    category: string;
    schedule?: string;
    mentor?: string;
    role?: string;
  }>;
  reportCards: Array<{
    id: string;
    academicYear: string;
    semester: string;
    status: string;
    ranking?: number;
    gpa?: number;
  }>;
}

interface RegisteredStudentOption {
  id: string;
  name: string;
  nisn?: string;
  packet: string;
  class?: string;
}

export default function OrangTuaDashboardPage() {
  const [data, setData] = useState<{ parent: any; children: ChildData[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  // Add Child Modal State
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [addChildTab, setAddChildTab] = useState<"LINK" | "REGISTER">("LINK");
  const [submittingChild, setSubmittingChild] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Registered students list for linking
  const [studentsList, setStudentsList] = useState<RegisteredStudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State: Link Existing
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkStudentNisn, setLinkStudentNisn] = useState("");

  // Form State: Register New
  const [newChildForm, setNewChildForm] = useState({
    childName: "",
    packetType: "Paket A",
    nisn: "",
    nik: "",
    gender: "L",
    birthPlace: "Bandung",
    birthDate: "",
    studyModel: "Reguler",
    previousSchool: "",
    notes: "",
  });

  const fetchParentData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parents/my-children");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load parent dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParentData();
  }, [fetchParentData]);

  // Fetch registered students when modal opens
  useEffect(() => {
    if (showAddChildModal) {
      setLoadingStudents(true);
      fetch("/api/students")
        .then((r) => r.json())
        .then((json) => {
          if (json.data && Array.isArray(json.data)) {
            setStudentsList(
              json.data.map((s: any) => ({
                id: s.id,
                name: s.name,
                nisn: s.nisn || "",
                packet: s.packet || "Paket C",
                class: s.class || "",
              }))
            );
          }
        })
        .catch((err) => console.error("Failed to load students:", err))
        .finally(() => setLoadingStudents(false));
    }
  }, [showAddChildModal]);

  const parent = data?.parent;
  const children = data?.children || [];
  const activeChild = children[selectedChildIndex] || children[0];

  // Filter available students for linking (excluding those already linked)
  const linkedStudentIds = new Set(children.map((c) => c.id));
  const availableStudents = studentsList.filter(
    (s) =>
      !linkedStudentIds.has(s.id) &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nisn && s.nisn.includes(searchTerm)))
  );

  const selectedStudentToLink = studentsList.find((s) => s.id === linkStudentId);

  // Handle Link Existing Student
  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkStudentId && !linkStudentNisn.trim()) {
      setErrorMessage("Silakan pilih nama siswa atau masukkan NISN siswa yang ingin ditautkan.");
      return;
    }

    setSubmittingChild(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/parents/my-children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LINK_EXISTING",
          studentId: linkStudentId || undefined,
          nisn: linkStudentNisn.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menautkan data siswa");

      setSuccessMessage(result.message || "Data siswa berhasil ditautkan!");
      setTimeout(async () => {
        await fetchParentData();
        setShowAddChildModal(false);
        setSuccessMessage(null);
        setLinkStudentId("");
        setLinkStudentNisn("");
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menautkan data anak.");
    } finally {
      setSubmittingChild(false);
    }
  };

  // Handle Register New Child
  const handleRegisterNewChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildForm.childName.trim()) {
      setErrorMessage("Nama lengkap anak wajib diisi.");
      return;
    }

    setSubmittingChild(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/parents/my-children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGISTER_NEW",
          childName: newChildForm.childName.trim(),
          packetType: newChildForm.packetType,
          nisn: newChildForm.nisn.trim() || null,
          nik: newChildForm.nik.trim() || null,
          gender: newChildForm.gender,
          birthPlace: newChildForm.birthPlace.trim() || null,
          birthDate: newChildForm.birthDate || null,
          studyModel: newChildForm.studyModel,
          previousSchool: newChildForm.previousSchool.trim() || null,
          notes: newChildForm.notes.trim() || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mendaftarkan anak baru");

      setSuccessMessage(result.message || "Pendaftaran anak baru berhasil diajukan!");
      setTimeout(async () => {
        await fetchParentData();
        setShowAddChildModal(false);
        setSuccessMessage(null);
        setNewChildForm({
          childName: "",
          packetType: "Paket A",
          nisn: "",
          nik: "",
          gender: "L",
          birthPlace: "Bandung",
          birthDate: "",
          studyModel: "Reguler",
          previousSchool: "",
          notes: "",
        });
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat mendaftarkan anak.");
    } finally {
      setSubmittingChild(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Wali Santri / Siswa PKBM Askara</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, Bapak/Ibu {parent?.name || "Orang Tua"}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Pantau perkembangan akademik, presensi harian, nilai tugas, rapor semester, serta administrasi keuangan putra/putri Anda secara transparan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowAddChildModal(true);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition border border-emerald-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah / Tautkan Anak (Ke-2 / Ke-3)</span>
            </button>

            <button
              onClick={fetchParentData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition backdrop-blur-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* No Children Fallback */}
      {children.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-800">
              Belum Ada Data Siswa Tertaut
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Akun Orang Tua Anda belum terhubung dengan data siswa di database PKBM Askara. Anda dapat menghubungkan siswa yang sudah terdaftar atau mendaftarkan anak baru.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setShowAddChildModal(true);
                setAddChildTab("LINK");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Hubungkan Siswa yang Sudah Ada</span>
            </button>
            <button
              onClick={() => {
                setShowAddChildModal(true);
                setAddChildTab("REGISTER");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Daftarkan Anak Baru (SPMB)</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Child Selector Tabs Bar with "+ Tambah Anak" Action */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Pilih Putra / Putri ({children.length}):
              </span>
              {children.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChildIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    selectedChildIndex === idx
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-80 font-normal">({c.packetType})</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowAddChildModal(true);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Tambah Anak (Ke-2 / Ke-3)</span>
            </button>
          </div>

          {/* Child Profile Showcase Card */}
          {activeChild && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                    {activeChild.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        {activeChild.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        STATUS: {activeChild.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {activeChild.packetType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span><strong>NISN:</strong> {activeChild.nisn}</span>
                      <span><strong>NIK:</strong> {activeChild.nik}</span>
                      <span><strong>Rombel / Kelas:</strong> {activeChild.className}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/orang-tua/rapor"
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>e-Rapor Digital</span>
                  </Link>
                  <Link
                    href="/orang-tua/presensi"
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Presensi Lengkap</span>
                  </Link>
                </div>
              </div>

              {/* Detailed Child Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Wali Kelas / Tutor:</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{activeChild.homeroomTeacher}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Model Pembelajaran:</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{activeChild.studyModel}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Tahun Ajaran Aktif:</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{activeChild.academicYear} ({activeChild.semester})</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Tempat, Tanggal Lahir:</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{activeChild.birthPlace}, {activeChild.birthDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Real Dynamically Computed Stats */}
          {activeChild && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Persentase Kehadiran"
                value={activeChild.stats.attendanceRate}
                subtitle={`${activeChild.stats.presentCount} Hadir | ${activeChild.stats.izinCount} Izin | ${activeChild.stats.alpaCount} Alpa`}
                icon={CalendarCheck}
                colorTheme="emerald"
              />
              <StatCard
                title="Rata-Rata Nilai Tugas"
                value={activeChild.stats.averageGrade}
                subtitle={`${activeChild.stats.gradedTasksCount} Tugas LMS Dinilai`}
                icon={BookOpen}
                colorTheme="blue"
              />
              <StatCard
                title="Ujian CBT Terselesaikan"
                value={String(activeChild.stats.cbtCompletedCount)}
                subtitle="Asesmen Digital Mandiri"
                icon={Award}
                colorTheme="amber"
              />
              <StatCard
                title="Club Belajar Aktif"
                value={`${activeChild.stats.clubCount} Club`}
                subtitle="Minat & Keterampilan Vokasi"
                icon={Sparkles}
                colorTheme="indigo"
              />
            </div>
          )}

          {/* Academic & Attendance Tables */}
          {activeChild && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Grades Table */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      Perkembangan Nilai Tugas & Ujian
                    </h3>
                    <p className="text-xs text-slate-500">
                      Capaian riil pada LMS & CBT {activeChild.name}
                    </p>
                  </div>
                  <Link
                    href="/orang-tua/nilai"
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {activeChild.recentGrades.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">Belum ada tugas atau ujian yang dinilai untuk siswa ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 font-semibold border-b border-slate-100">
                          <th className="pb-3 font-semibold">Mata Pelajaran</th>
                          <th className="pb-3 font-semibold">Jenis Tugas / Ujian</th>
                          <th className="pb-3 font-semibold">Tanggal</th>
                          <th className="pb-3 font-semibold text-right">Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeChild.recentGrades.map((grade) => (
                          <tr key={grade.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 font-bold text-slate-800">{grade.subject}</td>
                            <td className="py-3 text-slate-600">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mr-1.5">
                                {grade.type}
                              </span>
                              {grade.title}
                            </td>
                            <td className="py-3 text-slate-500">{grade.date}</td>
                            <td className="py-3 text-right">
                              <span className="inline-block px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-100 text-emerald-800">
                                {grade.grade} / 100
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sidebar: Attendance Recents & Quick Shortcuts */}
              <div className="space-y-6">
                {/* Attendance Mini Recents */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      Presensi Terkini
                    </h3>
                    <Link
                      href="/orang-tua/presensi"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Rekap
                    </Link>
                  </div>

                  {activeChild.attendanceLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Belum ada catatan presensi terekam.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeChild.attendanceLogs.slice(0, 4).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{log.date}</p>
                            <p className="text-[10px] text-slate-400">{log.method} • {log.time}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === "PRESENT" || log.status === "HADIR"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.status === "EXCUSED" || log.status === "IZIN"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Portals Links */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 p-6 space-y-3">
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Layanan Terintegrasi
                  </h3>

                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      href="/orang-tua/keuangan"
                      className="p-3 bg-white hover:bg-amber-100/50 border border-amber-200/80 rounded-2xl flex items-center justify-between transition group text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-slate-800">Status Iuran & SPP</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition" />
                    </Link>

                    <Link
                      href="/orang-tua/tabungan"
                      className="p-3 bg-white hover:bg-amber-100/50 border border-amber-200/80 rounded-2xl flex items-center justify-between transition group text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-800">Tabungan Belajar Siswa</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition" />
                    </Link>

                    <Link
                      href="/orang-tua/club-belajar"
                      className="p-3 bg-white hover:bg-amber-100/50 border border-amber-200/80 rounded-2xl flex items-center justify-between transition group text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-800">Club Minat & Vokasi</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / TAUTKAN ANAK (KE-2 / KE-3) */}
      {/* ========================================================================= */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Data Anak</span>
                </div>
                <h3 className="text-lg font-bold">
                  Tambah / Tautkan Putra-Putri Anda
                </h3>
                <p className="text-xs text-slate-300">
                  Bagi orang tua yang mendaftarkan anak ke-2, ke-3, atau menghubungkan siswa yang sudah aktif.
                </p>
              </div>

              <button
                onClick={() => setShowAddChildModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAddChildTab("LINK");
                  setErrorMessage(null);
                }}
                className={`py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 ${
                  addChildTab === "LINK"
                    ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>1. Hubungkan Siswa Terdaftar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddChildTab("REGISTER");
                  setErrorMessage(null);
                }}
                className={`py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 ${
                  addChildTab === "REGISTER"
                    ? "bg-white text-amber-800 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>2. Daftarkan Calon Siswa Baru (SPMB)</span>
              </button>
            </div>

            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {addChildTab === "LINK" ? (
                /* TAB 1: HUBUNGKAN SISWA TERDAFTAR */
                <form onSubmit={handleLinkStudent} className="space-y-4">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Pilih dari Siswa yang Sudah Ada di PKBM Askara
                    </p>
                    Gunakan opsi ini jika putra/putri Anda sudah terdaftar di sistem sekolah tetapi belum tertaut ke akun orang tua Anda.
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Pilih Siswa dari Database PKBM Askara <span className="text-rose-500">*</span>
                    </label>

                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ketik nama atau NISN untuk memfilter daftar siswa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
                      {loadingStudents ? (
                        <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memuat daftar siswa...</span>
                        </div>
                      ) : availableStudents.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Tidak ada siswa yang cocok dengan pencarian atau semua siswa sudah tertaut.
                        </div>
                      ) : (
                        availableStudents.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setLinkStudentId(s.id);
                              setLinkStudentNisn(s.nisn || "");
                            }}
                            className={`p-3 text-xs flex items-center justify-between cursor-pointer transition ${
                              linkStudentId === s.id
                                ? "bg-emerald-50 border-l-4 border-emerald-600 font-bold"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div>
                              <p className="text-slate-800 font-bold">{s.name}</p>
                              <p className="text-[11px] text-slate-500">
                                {s.packet} {s.class ? `• ${s.class}` : ""} {s.nisn ? `• NISN: ${s.nisn}` : ""}
                              </p>
                            </div>
                            {linkStudentId === s.id && (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {selectedStudentToLink && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Siswa yang akan ditautkan:</span>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Nama Siswa:</span>
                          <span className="font-bold text-slate-900">{selectedStudentToLink.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Program / Paket:</span>
                          <span className="font-bold text-emerald-800">{selectedStudentToLink.packet}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">NISN:</span>
                          <span className="font-mono text-slate-800">{selectedStudentToLink.nisn || "-"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddChildModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingChild || (!linkStudentId && !linkStudentNisn)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
                    >
                      {submittingChild ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menautkan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Tautkan Siswa ke Akun Saya</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 2: DAFTARKAN CALON SISWA BARU (SPMB) */
                <form onSubmit={handleRegisterNewChild} className="space-y-4">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Pendaftaran Siswa Baru untuk Anak Ke-2 / Ke-3
                    </p>
                    Formulir ini akan otomatis terhubung dengan data akun orang tua Anda ({parent?.name} - {parent?.email}). Berkas akan langsung diverifikasi oleh panitia SPMB PKBM Askara.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Lengkap Siswa / Anak <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Siti Aisyah Azzahra"
                        value={newChildForm.childName}
                        onChange={(e) => setNewChildForm({ ...newChildForm, childName: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jenjang Program Paket <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newChildForm.packetType}
                        onChange={(e) => setNewChildForm({ ...newChildForm, packetType: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Paket A">Paket A (Setara SD)</option>
                        <option value="Paket B">Paket B (Setara SMP)</option>
                        <option value="Paket C">Paket C (Setara SMA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={newChildForm.gender}
                        onChange={(e) => setNewChildForm({ ...newChildForm, gender: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        NISN Siswa (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="NISN jika sudah ada"
                        value={newChildForm.nisn}
                        onChange={(e) => setNewChildForm({ ...newChildForm, nisn: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        NIK Siswa (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="NIK jika ada"
                        value={newChildForm.nik}
                        onChange={(e) => setNewChildForm({ ...newChildForm, nik: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tempat Lahir
                      </label>
                      <input
                        type="text"
                        placeholder="Kota Bandung"
                        value={newChildForm.birthPlace}
                        onChange={(e) => setNewChildForm({ ...newChildForm, birthPlace: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={newChildForm.birthDate}
                        onChange={(e) => setNewChildForm({ ...newChildForm, birthDate: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Model Pembelajaran
                      </label>
                      <select
                        value={newChildForm.studyModel}
                        onChange={(e) => setNewChildForm({ ...newChildForm, studyModel: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Reguler">Reguler Tatap Muka & Daring</option>
                        <option value="Home Schooling">Home Schooling</option>
                        <option value="Kursus & Vokasi">Kursus & Vokasi Keterampilan</option>
                        <option value="Mandiri">Belajar Mandiri</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Asal Sekolah Sebelumnya (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Nama sekolah asal jika pindahan"
                        value={newChildForm.previousSchool}
                        onChange={(e) => setNewChildForm({ ...newChildForm, previousSchool: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Catatan Khusus / Permintaan Orang Tua (Opsional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Tuliskan catatan tambahan untuk panitia SPMB..."
                        value={newChildForm.notes}
                        onChange={(e) => setNewChildForm({ ...newChildForm, notes: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddChildModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingChild || !newChildForm.childName.trim()}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
                    >
                      {submittingChild ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengirim Pendaftaran...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Pendaftaran Anak Baru</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
