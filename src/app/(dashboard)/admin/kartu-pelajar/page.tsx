"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Users,
  Eye,
  Download,
  RotateCw,
  Palette,
  ChevronRight,
  Layers,
  GraduationCap,
  Sparkles,
  School,
  CheckSquare,
  Square,
  ShieldCheck,
  RefreshCw,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import {
  StudentIDCard,
  StudentCardData,
  InstitutionCardData,
  CardTheme,
} from "@/components/kartu-pelajar/student-id-card";
import { CardPrintDialog } from "@/components/kartu-pelajar/card-print-dialog";
import { BulkCardPrintView } from "@/components/kartu-pelajar/bulk-card-print-view";

export default function AdminKartuPelajarPage() {
  const [students, setStudents] = useState<StudentCardData[]>([]);
  const [institution, setInstitution] = useState<InstitutionCardData | undefined>(undefined);
  const [classList, setClassList] = useState<{ id: string; name: string; level: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("SEMUA");
  const [selectedClass, setSelectedClass] = useState("SEMUA");
  const [selectedStatus, setSelectedStatus] = useState("AKTIF");

  // Selection for Bulk Printing
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Active student for 3D live preview
  const [activeStudent, setActiveStudent] = useState<StudentCardData | null>(null);
  const [previewTheme, setPreviewTheme] = useState<CardTheme>("emerald");

  // Print Dialog State
  const [printSingleStudent, setPrintSingleStudent] = useState<StudentCardData | null>(null);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);

  // Fetch Data from APIs
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Students
      const resStudents = await fetch("/api/students");
      const jsonStudents = await resStudents.json();
      if (jsonStudents.success && Array.isArray(jsonStudents.data)) {
        setStudents(jsonStudents.data);
        if (jsonStudents.data.length > 0 && !activeStudent) {
          setActiveStudent(jsonStudents.data[0]);
        }
      }

      // 2. Fetch Classes
      const resClasses = await fetch("/api/classes");
      const jsonClasses = await resClasses.json();
      if (jsonClasses.success && Array.isArray(jsonClasses.data)) {
        setClassList(jsonClasses.data);
      }

      // 3. Fetch Institution Profile
      const resInst = await fetch("/api/rapor/institution");
      const jsonInst = await resInst.json();
      if (jsonInst.profile) {
        setInstitution({
          name: jsonInst.profile.name,
          operationalPermit: jsonInst.profile.operationalPermit,
          npsn: jsonInst.profile.npsn,
          address: jsonInst.profile.address,
          phone: jsonInst.profile.phone,
          email: jsonInst.profile.email,
          website: jsonInst.profile.website,
          logoUrl: jsonInst.profile.logoUrl,
          headmasterName: jsonInst.profile.headmasterName,
          headmasterNip: jsonInst.profile.headmasterNip,
          headmasterSignatureUrl: jsonInst.profile.headmasterSignatureUrl,
          institutionStampUrl: jsonInst.profile.institutionStampUrl,
          academicYear: jsonInst.profile.academicYear,
          reportPlaceDate: jsonInst.profile.reportPlaceDate,
        });
      }
    } catch (err) {
      console.error("Gagal memuat data kartu pelajar:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // Program filter
      if (selectedProgram !== "SEMUA" && st.packet !== selectedProgram) {
        return false;
      }

      // Class filter
      if (selectedClass !== "SEMUA" && st.class !== selectedClass) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "SEMUA" && (st.status || "AKTIF") !== selectedStatus) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (st.name || "").toLowerCase().includes(q) ||
          (st.nisn || "").toLowerCase().includes(q) ||
          (st.nik || "").toLowerCase().includes(q) ||
          (st.phone || "").toLowerCase().includes(q) ||
          (st.address || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [students, selectedProgram, selectedClass, selectedStatus, searchQuery]);

  // Handle Select All / Toggle Single
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Selected Students for Bulk Print
  const selectedStudentsForBulk = useMemo(() => {
    return students.filter((st) => selectedStudentIds.includes(st.id));
  }, [students, selectedStudentIds]);

  return (
    <div className="space-y-6">
      {/* ── BREADCRUMB & HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-slate-800 transition">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/admin/students" className="hover:text-slate-800 transition">
              Data Siswa
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-emerald-700 font-bold">Pusat Kartu Tanda Pelajar</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-8 h-8 text-emerald-600" />
            <span>Pusat Cetak Kartu Pelajar Siswa</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Cetak kartu identitas siswa standar kartu ATM / CR80 bolak-balik lengkap dengan foto, identitas, dan barcode/QR Code scan presensi otomatis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (selectedStudentIds.length === 0) {
                // If none selected, offer to print all filtered
                setSelectedStudentIds(filteredStudents.map((s) => s.id));
              }
              setIsBulkPrintOpen(true);
            }}
            disabled={filteredStudents.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold transition shadow-lg shadow-emerald-900/20 hover-lift disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>
              {selectedStudentIds.length > 0
                ? `Cetak Massal (${selectedStudentIds.length} Siswa)`
                : `Cetak Semua (${filteredStudents.length} Siswa)`}
            </span>
          </button>
        </div>
      </div>

      {/* ── TOP STATS & QUICK INFO BANNER ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Siswa Terdaftar</p>
            <h4 className="text-xl font-black text-slate-900">{students.length} Siswa</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Standar Dimensi</p>
            <h4 className="text-sm font-black text-slate-900 font-mono">CR80 (85.6 × 54 mm)</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Fitur Keamanan</p>
            <h4 className="text-sm font-black text-slate-900">Barcode & QR Scan</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Siswa Terpilih</p>
            <h4 className="text-xl font-black text-emerald-600">
              {selectedStudentIds.length} Siswa
            </h4>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT: LEFT LIST + RIGHT 3D PREVIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SECTION (7 COLS): SEARCH, FILTERS & STUDENT TABLE */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa, NISN, no telepon..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchData}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                title="Muat Ulang Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Program */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Program Paket:
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="SEMUA">Semua Program</option>
                  <option value="Paket A">Paket A (Setara SD)</option>
                  <option value="Paket B">Paket B (Setara SMP)</option>
                  <option value="Paket C">Paket C (Setara SMA)</option>
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Rombel / Kelas:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="SEMUA">Semua Kelas</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Status Siswa:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="SEMUA">Semua Status</option>
                  <option value="AKTIF">Aktif</option>
                  <option value="LULUS">Lulus</option>
                  <option value="NONAKTIF">Non-Aktif</option>
                  <option value="MUTASI">Mutasi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition"
                >
                  {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Pilih Semua ({filteredStudents.length})</span>
                </button>
              </div>

              {selectedStudentIds.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  {selectedStudentIds.length} Terpilih
                </span>
              )}
            </div>

            {/* List Rows */}
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span>Memuat data siswa...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700 text-sm">Tidak ada data siswa</p>
                <p className="text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter program.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
                {filteredStudents.map((st) => {
                  const isSelected = selectedStudentIds.includes(st.id);
                  const isActive = activeStudent?.id === st.id;

                  return (
                    <div
                      key={st.id}
                      onClick={() => setActiveStudent(st)}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition ${
                        isActive
                          ? "bg-emerald-50/70 border-l-4 border-emerald-500"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStudent(st.id);
                          }}
                          className="text-slate-400 hover:text-emerald-600 transition shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {/* Student Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                          {st.photoUrl ? (
                            <img
                              src={st.photoUrl}
                              alt={st.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            st.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Student Details */}
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate leading-snug">
                            {st.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate font-mono">
                            NISN: {st.nisn && st.nisn !== "-" ? st.nisn : `ASK-${st.id.substring(0, 8)}`}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5 truncate">
                            {st.packet || "Paket C"} • {st.class || "Reguler"}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStudent(st);
                            setPrintSingleStudent(st);
                          }}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                          title="Cetak Kartu"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Cetak</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION (5 COLS): 3D LIVE CARD PREVIEW & THEME CONTROLS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Pratinjau Kartu Pelajar 3D</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik kartu untuk membalik (Muka Depan & Belakang)
                </p>
              </div>
            </div>

            {/* Theme Picker */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Pilihan Warna Tema Kartu:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewTheme("emerald")}
                  className={`py-1.5 px-2.5 rounded-xl text-left flex items-center gap-2 border transition ${
                    previewTheme === "emerald"
                      ? "bg-emerald-950 border-emerald-500 text-emerald-200"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Emerald Askara</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTheme("indigo")}
                  className={`py-1.5 px-2.5 rounded-xl text-left flex items-center gap-2 border transition ${
                    previewTheme === "indigo"
                      ? "bg-indigo-950 border-indigo-500 text-indigo-200"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                  <span className="truncate">Royal Sapphire</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTheme("navy")}
                  className={`py-1.5 px-2.5 rounded-xl text-left flex items-center gap-2 border transition ${
                    previewTheme === "navy"
                      ? "bg-sky-950 border-sky-500 text-sky-200"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-sky-400 shrink-0" />
                  <span className="truncate">Classic Navy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTheme("maroon")}
                  className={`py-1.5 px-2.5 rounded-xl text-left flex items-center gap-2 border transition ${
                    previewTheme === "maroon"
                      ? "bg-rose-950 border-rose-500 text-rose-200"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate">Royal Maroon</span>
                </button>
              </div>
            </div>

            {/* 3D Card Display */}
            {activeStudent ? (
              <div className="py-3 flex flex-col items-center justify-center">
                <StudentIDCard
                  student={activeStudent}
                  institution={institution}
                  theme={previewTheme}
                  side="flipper"
                  idPrefix="admin-preview"
                  showFlipButton={true}
                />

                <div className="w-full mt-4 pt-3 border-t border-slate-800 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintSingleStudent(activeStudent)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Kartu Siswa Ini</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                Pilih salah satu siswa di tabel untuk melihat pratinjau kartu.
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
            <h5 className="font-extrabold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Integrasi Presensi Otomatis</span>
            </h5>
            <p className="text-emerald-800 leading-relaxed">
              QR Code di belakang kartu pelajar sudah terintegrasi secara langsung dengan aplikasi Presensi Guru. Guru cukup memindai kartu ini saat kegiatan tatap muka atau club belajar untuk mencatat kehadiran siswa secara real-time.
            </p>
          </div>
        </div>
      </div>

      {/* ── SINGLE CARD PRINT DIALOG MODAL ── */}
      {printSingleStudent && (
        <CardPrintDialog
          student={printSingleStudent}
          institution={institution}
          isOpen={Boolean(printSingleStudent)}
          onClose={() => setPrintSingleStudent(null)}
        />
      )}

      {/* ── BULK CARD PRINT VIEW MODAL ── */}
      {isBulkPrintOpen && (
        <BulkCardPrintView
          students={selectedStudentsForBulk.length > 0 ? selectedStudentsForBulk : filteredStudents}
          institution={institution}
          onClose={() => setIsBulkPrintOpen(false)}
        />
      )}
    </div>
  );
}
