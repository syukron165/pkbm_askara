"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Download,
  Printer,
  FileCheck,
  CheckCircle2,
  CalendarCheck,
  Building2,
  Sparkles,
  Edit3,
  FileText,
  RefreshCw,
  Users,
  UserCheck,
} from "lucide-react";

export default function ERaporPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Institution Profile
  const [institution, setInstitution] = useState<any>({
    name: "Pusat Kegiatan Belajar Masyarakat (PKBM) Askara",
    operationalPermit: "Izin Operasional No. 0019/IPSPNFI/IX/2022/DPMTSP",
    npsn: "P9998766",
    address: "Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung",
    phone: "(022) 87518584 / 085156560630",
    email: "pkbm.askara@gmail.com",
    logoUrl: "/logo.png",
    headmasterName: "Prof. Arif Syarifudin, S.Pd.",
    headmasterNip: "19750914 200003 2 001",
    reportPlaceDate: "Bandung, 13 Agustus 2026",
    academicYear: "2025/2026",
    semester: "GANJIL",
  });

  // Active Student Report Card Data
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 0. Fetch current logged-in user
      let userRole = "";
      let userStudentId = "";
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.user) {
          setCurrentUser(meData.user);
          userRole = meData.user.role;
          userStudentId = meData.user.studentId;
        }
      } catch (err) {
        console.error("Auth check error:", err);
      }

      // 1. Fetch institution profile
      const instRes = await fetch("/api/rapor/institution");
      const instData = await instRes.json();
      if (instData.profile) setInstitution(instData.profile);

      // 2. Fetch student list
      const listRes = await fetch("/api/rapor/list");
      const listData = await listRes.json();
      if (listData.students && listData.students.length > 0) {
        setStudents(listData.students);
        
        // If student or parent, select matching student
        let targetStudentId = listData.students[0].studentId;
        if (userRole === "siswa" || userRole === "orang_tua") {
          const matched = listData.students.find(
            (s: any) => s.studentId === userStudentId || s.studentName?.toLowerCase().includes("budi")
          );
          if (matched) targetStudentId = matched.studentId;
        }
        
        setSelectedStudentId(targetStudentId);
        await loadStudentReport(targetStudentId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentReport = async (studentId: string) => {
    try {
      const res = await fetch(`/api/rapor/editor?studentId=${studentId}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStudentChange = async (studentId: string) => {
    setSelectedStudentId(studentId);
    await loadStudentReport(studentId);
  };

  const handlePrint = () => {
    window.print();
  };

  const student = reportData?.student;
  const currentClass = reportData?.class;
  const reportCard = reportData?.reportCard;

  const canEdit = currentUser && ["super_admin", "admin", "pendidik"].includes(currentUser.role);
  const isAdmin = currentUser && ["super_admin", "admin"].includes(currentUser.role);
  const isStaff = canEdit;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Action Bar (hidden on print) */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>
              {isStaff ? "Pusat e-Rapor Resmi" : "e-Rapor Hasil Belajar"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isStaff
              ? "Laporan Hasil Belajar Digital (e-Rapor)"
              : `e-Rapor Digital: ${student?.user?.name || "Peserta Didik"}`}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dokumen resmi capaian belajar peserta didik dengan Kop Lembaga & Tanda Tangan terstandarisasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <Link
              href="/rapor/edit"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Nilai & Catatan</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/rapor/pengaturan"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Building2 className="w-4 h-4" />
              <span>Pengaturan Kop Lembaga</span>
            </Link>
          )}
          <Link
            href="/rapor/cover"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>Cover Depan</span>
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Student Selector Bar (hidden on print) */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {isStaff ? (
            <div className="flex items-center space-x-3 flex-1">
              <Users className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-bold text-slate-800 shrink-0">Pilih Siswa:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border-2 border-emerald-600 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/20"
              >
                {students.map((st) => (
                  <option key={st.studentId} value={st.studentId}>
                    {st.studentName} ({st.packetType} • {st.className}) — [
                    {st.reportCard?.status === "PUBLISHED" ? "✓ PUBLISHED" : "DRAFT"}]
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {student?.user?.name ? student.user.name.charAt(0) : "S"}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{student?.user?.name || "Peserta Didik"}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  NISN: {student?.nisn || "-"} • {student?.packetType || "Paket C"} • {currentClass?.name || "Kelas"}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 text-slate-500">
            <span
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                reportCard?.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              Status: {reportCard?.status === "PUBLISHED" ? "RESMI / DITERBITKAN" : "KONSEP / DRAFT"}
            </span>
          </div>
        </div>

        {/* Quick Selection Chips for Staff Only */}
        {isStaff && students.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 mb-2">Pilih Cepat Siswa:</p>
            <div className="flex flex-wrap gap-2">
              {students.map((st) => {
                const isSelected = st.studentId === selectedStudentId;
                return (
                  <button
                    key={st.studentId}
                    type="button"
                    onClick={() => handleStudentChange(st.studentId)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? "bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <UserCheck className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-200" : "text-slate-400"}`} />
                    <span>{st.studentName.split(" ")[0]}</span>
                    <span className="text-[10px] opacity-75">({st.packetType})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Memuat e-Rapor resmi...</p>
        </div>
      ) : (
        /* Printable Official Report Card Document */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-8 sm:p-12 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900 font-sans">
          {/* Kop Surat PKBM Askara Dinamis */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-center space-x-6 text-center">
            <img
              src={institution.logoUrl || "/logo.png"}
              alt="Logo PKBM"
              className="h-20 w-auto object-contain hidden sm:block print:block shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
                {institution.name}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {institution.operationalPermit} • NPSN: {institution.npsn}
              </p>
              <p className="text-[11px] text-slate-500">
                {institution.address}, Telp: {institution.phone}, Email: {institution.email}
              </p>
            </div>
          </div>

          {/* Judul Rapor */}
          <div className="text-center my-6">
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-900">
              Laporan Capaian Hasil Belajar Peserta Didik
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Tahun Ajaran {reportCard?.academicYear || institution.academicYear} — Semester{" "}
              {reportCard?.semester || institution.semester}
            </p>
          </div>

          {/* Data Identitas Siswa */}
          <div className="grid grid-cols-2 gap-y-2 text-xs mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 print:bg-transparent print:p-0 print:border-none">
            <div>
              <span className="text-slate-500 font-medium">Nama Peserta Didik:</span>{" "}
              <strong className="text-slate-900">{student?.name || "Budi Santoso"}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Program Kesetaraan:</span>{" "}
              <strong className="text-slate-900">{student?.packetType || "Paket C"}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Nomor Induk Siswa Nasional (NISN):</span>{" "}
              <strong className="text-slate-900">{student?.nisn || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Rombongan Belajar:</span>{" "}
              <strong className="text-slate-900">{currentClass?.name || "Kelas X Merdeka"}</strong>
            </div>
          </div>

          {/* Tabel Capaian Nilai */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              A. Capaian Kompetensi Mata Pelajaran
            </h4>
            <table className="w-full border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-300">
                  <th className="border border-slate-300 p-2 w-8 text-center">No</th>
                  <th className="border border-slate-300 p-2 text-left">Mata Pelajaran</th>
                  <th className="border border-slate-300 p-2 w-16 text-center">Tugas (LMS)</th>
                  <th className="border border-slate-300 p-2 w-16 text-center">Ujian (CBT)</th>
                  <th className="border border-slate-300 p-2 w-16 text-center">Nilai Akhir</th>
                  <th className="border border-slate-300 p-2 w-12 text-center">Predikat</th>
                  <th className="border border-slate-300 p-2 text-left">Deskripsi Capaian</th>
                </tr>
              </thead>
              <tbody>
                {reportCard?.grades?.map((gr: any, idx: number) => (
                  <tr key={gr.subjectId || idx} className="border-b border-slate-300">
                    <td className="border border-slate-300 p-2 text-center font-medium">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-semibold text-slate-900">
                      {gr.subjectName}
                    </td>
                    <td className="border border-slate-300 p-2 text-center">{gr.dailyScore}</td>
                    <td className="border border-slate-300 p-2 text-center">{gr.examScore}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-slate-900">
                      {gr.finalScore}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-emerald-800">
                      {gr.letterGrade}
                    </td>
                    <td className="border border-slate-300 p-2 text-slate-600 leading-tight">
                      {gr.competencyDesc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rekapitulasi Presensi & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="border border-slate-300 rounded-lg p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                B. Rekapitulasi Kehadiran
              </h4>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Hadir:</span>
                  <strong>{reportCard?.totalAttendancePresent ?? 22} Hari</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sakit:</span>
                  <span>{reportCard?.totalSick ?? 1} Hari</span>
                </div>
                <div className="flex justify-between">
                  <span>Izin:</span>
                  <span>{reportCard?.totalPermit ?? 0} Hari</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanpa Keterangan (Alpa):</span>
                  <span>{reportCard?.totalAbsent ?? 0} Hari</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-300 rounded-lg p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                C. Catatan Perkembangan Belajar
              </h4>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                &ldquo;{reportCard?.homeroomNotes || "Pertahankan kedisiplinan dan semangat belajar."}&rdquo;
              </p>
            </div>
          </div>

          {/* Tanda Tangan Pengesahan Dinamis */}
          <div className="grid grid-cols-3 text-center text-xs mt-10 pt-4 gap-4">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-semibold text-slate-800">Orang Tua / Wali Murid</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">( ........................................ )</p>
            </div>

            <div>
              <p className="text-slate-600">{institution.reportPlaceDate}</p>
              <p className="font-semibold text-slate-800">Wali Kelas / Tutor</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">
                {reportCard?.homeroomTeacherName ||
                  currentClass?.homeroomTeacher ||
                  institution?.defaultHomeroomTeacher ||
                  "Drs. Hendra Gunawan"}
              </p>
              <p className="text-[10px] text-slate-500">
                NIP.{" "}
                {reportCard?.homeroomTeacherNip ||
                  institution?.defaultHomeroomNip ||
                  "19800412 200501 1 003"}
              </p>
            </div>

            <div className="relative">
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-semibold text-slate-800">Kepala {institution.name.split("(")[0]}</p>
              <div className="h-20 my-1 relative flex items-center">
                {/* Official Round Stamp */}
                <img
                  src="/stempel-askara.png"
                  alt="Stempel PKBM Askara"
                  className="absolute left-[-15px] top-[-5px] w-24 h-24 object-contain mix-blend-multiply pointer-events-none select-none z-0 rotate-[-6deg]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                {/* Official Signature */}
                <img
                  src="/ttd-kepala.png"
                  alt="Tanda Tangan Kepala PKBM"
                  className="relative left-4 top-0 h-20 w-auto object-contain mix-blend-multiply z-10 pointer-events-none select-none"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <p className="font-bold underline text-slate-900">{institution.headmasterName || "Arif Syarifudin, S.Pd"}</p>
              <p className="text-[10px] text-slate-500">NIP. {institution.headmasterNip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
