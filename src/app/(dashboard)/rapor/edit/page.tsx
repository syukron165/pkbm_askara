"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  BookOpen,
  CalendarCheck,
  Building2,
  ArrowLeft,
  Eye,
  RefreshCw,
  Sparkles,
  Sliders,
  UserCheck,
} from "lucide-react";

interface GradeItem {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  packetType: string;
  selected?: boolean;
  dailyScore: number;
  examScore: number;
  finalScore: number;
  letterGrade: string;
  competencyDesc: string;
}

interface StudentOption {
  studentId: string;
  studentName: string;
  nisn: string | null;
  packetType: string;
  className: string;
  classId: string;
  reportCard: { status: string } | null;
}

export default function EditRaporPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editor states
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [semester, setSemester] = useState("GANJIL");
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [attendance, setAttendance] = useState({
    present: 0,
    sick: 0,
    permit: 0,
    absent: 0,
  });
  const [spiritualScore, setSpiritualScore] = useState("Baik");
  const [socialScore, setSocialScore] = useState("Baik");
  const [homeroomNotes, setHomeroomNotes] = useState("");
  const [homeroomTeacherName, setHomeroomTeacherName] = useState("Drs. Hendra Gunawan");
  const [homeroomTeacherNip, setHomeroomTeacherNip] = useState("19800412 200501 1 003");
  const [status, setStatus] = useState("DRAFT");

  // Check auth user
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Load student list
  useEffect(() => {
    if (currentUser && ["super_admin", "admin", "pendidik"].includes(currentUser.role)) {
      fetchList();
    }
  }, [selectedClassId, currentUser]);

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const url = selectedClassId
        ? `/api/rapor/list?classId=${selectedClassId}`
        : `/api/rapor/list`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.classes) setClasses(data.classes);
      if (data.students && data.students.length > 0) {
        setStudents(data.students);
        // Default select first student if current selected is not in list
        const exists = data.students.some((s: any) => s.studentId === selectedStudentId);
        const targetId = exists ? selectedStudentId : data.students[0].studentId;
        setSelectedStudentId(targetId);
        fetchEditorData(targetId, selectedClassId);
      }
    } catch (err) {
      console.error("Error fetching list:", err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchEditorData = async (studentId: string, classId?: string) => {
    if (!studentId) return;
    setLoadingEditor(true);
    setMessage(null);
    try {
      const url = classId
        ? `/api/rapor/editor?studentId=${studentId}&classId=${classId}`
        : `/api/rapor/editor?studentId=${studentId}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.student) setStudentInfo(data.student);
      if (data.class) setClassInfo(data.class);
      if (data.reportCard) {
        const rc = data.reportCard;
        setAcademicYear(rc.academicYear || "2025/2026");
        setSemester(rc.semester || "GANJIL");
        setGrades(rc.grades || []);
        setAttendance({
          present: rc.totalAttendancePresent || 0,
          sick: rc.totalSick || 0,
          permit: rc.totalPermit || 0,
          absent: rc.totalAbsent || 0,
        });
        setSpiritualScore(rc.spiritualScore || "Baik");
        setSocialScore(rc.socialScore || "Baik");
        setHomeroomNotes(rc.homeroomNotes || "");
        setHomeroomTeacherName(
          rc.homeroomTeacherName || data.class?.homeroomTeacher || "Drs. Hendra Gunawan"
        );
        setHomeroomTeacherNip(rc.homeroomTeacherNip || "19800412 200501 1 003");
        setStatus(rc.status || "DRAFT");
      }
    } catch (err) {
      console.error("Error fetching editor data:", err);
    } finally {
      setLoadingEditor(false);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    fetchEditorData(studentId, selectedClassId);
  };

  const handleSubjectToggle = (index: number) => {
    setGrades((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selected: !updated[index].selected,
      };
      return updated;
    });
  };

  const handleSelectAllSubjects = (select: boolean) => {
    setGrades((prev) =>
      prev.map((gr) => ({
        ...gr,
        selected: select,
      }))
    );
  };

  const handleGradeChange = (
    index: number,
    field: "dailyScore" | "examScore" | "competencyDesc",
    value: any
  ) => {
    setGrades((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };

      if (field === "dailyScore" || field === "examScore") {
        const numVal = parseFloat(value) || 0;
        current[field] = numVal;

        const daily = field === "dailyScore" ? numVal : current.dailyScore;
        const exam = field === "examScore" ? numVal : current.examScore;
        const finalVal = Math.round(((daily + exam) / 2) * 10) / 10;
        current.finalScore = finalVal;

        if (finalVal >= 85) current.letterGrade = "A";
        else if (finalVal >= 75) current.letterGrade = "B";
        else if (finalVal >= 60) current.letterGrade = "C";
        else if (finalVal > 0) current.letterGrade = "D";
        else current.letterGrade = "-";
      } else {
        current[field] = value;
      }

      updated[index] = current;
      return updated;
    });
  };

  const handleSave = async (publishStatus?: string) => {
    if (!selectedStudentId) {
      setMessage({ type: "error", text: "Pilih siswa terlebih dahulu." });
      return;
    }

    setSaving(true);
    setMessage(null);

    const targetStatus = publishStatus || status;

    try {
      const payload = {
        studentId: selectedStudentId,
        classId: classInfo?.id || classes[0]?.id,
        academicYear,
        semester,
        totalAttendancePresent: attendance.present,
        totalSick: attendance.sick,
        totalPermit: attendance.permit,
        totalAbsent: attendance.absent,
        spiritualScore,
        socialScore,
        homeroomNotes,
        homeroomTeacherName,
        homeroomTeacherNip,
        status: targetStatus,
        grades,
      };

      const res = await fetch("/api/rapor/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(targetStatus);
        setMessage({
          type: "success",
          text:
            targetStatus === "PUBLISHED"
              ? "e-Rapor berhasil disimpan & diterbitkan secara resmi!"
              : "Draft e-Rapor berhasil disimpan!",
        });
        fetchList();
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan e-Rapor." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan sistem saat menyimpan e-Rapor." });
    } finally {
      setSaving(false);
    }
  };

  const isStaff = currentUser && ["super_admin", "admin", "pendidik"].includes(currentUser.role);

  if (authLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Memverifikasi hak akses...</p>
      </div>
    );
  }

  if (!isStaff) {
    const returnPath = currentUser?.role === "siswa" ? "/siswa/rapor" : currentUser?.role === "orang_tua" ? "/orang-tua/rapor" : "/";
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-soft text-center max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Akses Dibatasi</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Hak akses pengisian dan pengeditan nilai e-Rapor hanya diberikan kepada <strong>Administrator</strong> dan <strong>Pendidik / Tutor</strong>. Siswa dan Orang Tua hanya memiliki akses untuk melihat dan mencetak dokumen e-Rapor resmi.
        </p>
        <div className="mt-6">
          <Link
            href={returnPath}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke e-Rapor Saya</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Editor & Input Nilai e-Rapor</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Entri Nilai & Catatan Perkembangan Belajar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lengkapi nilai harian, ujian, deskripsi capaian kompetensi, presensi, dan catatan wali kelas.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/rapor"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <Eye className="w-4 h-4" />
            <span>Lihat Cetakan Rapor</span>
          </Link>
          <Link
            href="/rapor/pengaturan"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <Building2 className="w-4 h-4" />
            <span>Kop & Lembaga</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Selector: Rombel & Siswa */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Filter Rombongan Belajar (Kelas)
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
            >
              <option value="">Semua Rombongan Belajar</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Peserta Didik (Siswa) Aktif
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-emerald-600 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/30"
            >
              {students.map((st) => (
                <option key={st.studentId} value={st.studentId}>
                  {st.studentName} ({st.packetType} • {st.className}) — [
                  {st.reportCard?.status === "PUBLISHED" ? "✓ DITERBITKAN" : "DRAFT"}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Student Switcher Chips */}
        {students.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 mb-2">Klik Cepat Pilih Siswa:</p>
            <div className="flex flex-wrap gap-2">
              {students.map((st) => {
                const isSelected = st.studentId === selectedStudentId;
                return (
                  <button
                    key={st.studentId}
                    type="button"
                    onClick={() => handleStudentSelect(st.studentId)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? "bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <UserCheck className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-200" : "text-slate-400"}`} />
                    <span>{st.studentName}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                        st.reportCard?.status === "PUBLISHED"
                          ? isSelected
                            ? "bg-emerald-900 text-emerald-200"
                            : "bg-emerald-100 text-emerald-800"
                          : isSelected
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {st.reportCard?.status === "PUBLISHED" ? "Resmi" : "Draft"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {loadingEditor ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Memuat data e-Rapor siswa...</p>
        </div>
      ) : studentInfo ? (
        <div className="space-y-6">
          {/* Identitas Siswa Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {studentInfo.packetType}
                </span>
                <h2 className="text-xl font-bold mt-2">{studentInfo.name}</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  NISN: {studentInfo.nisn} • Rombel: {classInfo?.name || "Kelas X Merdeka"} • Wali Kelas:{" "}
                  {classInfo?.homeroomTeacher || "Drs. Hendra Gunawan"}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    status === "PUBLISHED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}
                >
                  Status: {status === "PUBLISHED" ? "PUBLISHED (Resmi)" : "DRAFT (Konsep)"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Nilai Mata Pelajaran */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                  <span>A. Nilai Capaian Kompetensi Mata Pelajaran</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {grades.filter((g) => g.selected !== false).length} dari {grades.length} Mapel Ditampilkan
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centang mata pelajaran yang ingin dicantumkan dalam e-Rapor peserta didik ini.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllSubjects(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllSubjects(false)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5 text-center w-12 border border-slate-200">Tampil</th>
                    <th className="p-2.5 text-left border border-slate-200">Mata Pelajaran</th>
                    <th className="p-2.5 text-center w-24 border border-slate-200">Tugas (LMS)</th>
                    <th className="p-2.5 text-center w-24 border border-slate-200">Ujian (CBT)</th>
                    <th className="p-2.5 text-center w-24 border border-slate-200">Nilai Akhir</th>
                    <th className="p-2.5 text-center w-16 border border-slate-200">Predikat</th>
                    <th className="p-2.5 text-left border border-slate-200">Deskripsi Capaian Pembelajaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grades.map((gr, idx) => {
                    const isSelected = gr.selected !== false;
                    return (
                      <tr
                        key={gr.subjectId || idx}
                        className={`transition ${
                          isSelected ? "hover:bg-slate-50/60" : "bg-slate-50/40 opacity-55"
                        }`}
                      >
                        <td className="p-2.5 text-center border border-slate-200">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSubjectToggle(idx)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 border border-slate-200 font-semibold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <span>{gr.subjectName}</span>
                            {!isSelected && (
                              <span className="text-[10px] font-normal text-rose-500 italic">
                                (Tidak Dicantumkan)
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Kode: {gr.subjectCode} {gr.packetType ? `• ${gr.packetType}` : ""}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-200 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            disabled={!isSelected}
                            value={gr.dailyScore}
                            onChange={(e) => handleGradeChange(idx, "dailyScore", e.target.value)}
                            className="w-16 px-2 py-1 text-center font-semibold rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>
                        <td className="p-2 border border-slate-200 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            disabled={!isSelected}
                            value={gr.examScore}
                            onChange={(e) => handleGradeChange(idx, "examScore", e.target.value)}
                            className="w-16 px-2 py-1 text-center font-semibold rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>
                        <td className="p-2.5 border border-slate-200 text-center font-bold text-slate-900 bg-slate-50/50">
                          {isSelected ? gr.finalScore : "-"}
                        </td>
                        <td className="p-2.5 border border-slate-200 text-center font-bold text-emerald-700 bg-slate-50/50">
                          {isSelected ? gr.letterGrade : "-"}
                        </td>
                        <td className="p-2 border border-slate-200">
                          <textarea
                            rows={2}
                            disabled={!isSelected}
                            value={gr.competencyDesc}
                            onChange={(e) => handleGradeChange(idx, "competencyDesc", e.target.value)}
                            placeholder="Deskripsi pencapaian kompetensi..."
                            className="w-full p-1.5 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none bg-white disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Presensi, Sikap, & Catatan Wali Kelas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Presensi & Sikap */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                B. Rekapitulasi Presensi & Nilai Sikap
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hadir (Hari)</label>
                  <input
                    type="number"
                    min={0}
                    value={attendance.present}
                    onChange={(e) =>
                      setAttendance((prev) => ({ ...prev, present: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sakit (Hari)</label>
                  <input
                    type="number"
                    min={0}
                    value={attendance.sick}
                    onChange={(e) =>
                      setAttendance((prev) => ({ ...prev, sick: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Izin (Hari)</label>
                  <input
                    type="number"
                    min={0}
                    value={attendance.permit}
                    onChange={(e) =>
                      setAttendance((prev) => ({ ...prev, permit: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanpa Keterangan (Alpa)</label>
                  <input
                    type="number"
                    min={0}
                    value={attendance.absent}
                    onChange={(e) =>
                      setAttendance((prev) => ({ ...prev, absent: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sikap Spiritual</label>
                  <select
                    value={spiritualScore}
                    onChange={(e) => setSpiritualScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Kurang">Kurang</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sikap Sosial</label>
                  <select
                    value={socialScore}
                    onChange={(e) => setSocialScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Kurang">Kurang</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Catatan Perkembangan Wali Kelas */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                  C. Catatan Perkembangan Belajar
                </h3>
                <p className="text-xs text-slate-500 mt-2 mb-2">
                  Ulasan motivasi dan capaian personal dari Tutor / Wali Kelas.
                </p>
                <textarea
                  rows={4}
                  value={homeroomNotes}
                  onChange={(e) => setHomeroomNotes(e.target.value)}
                  placeholder="Tuliskan catatan perkembangan, kedisiplinan, dan motivasi peserta didik..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed bg-white"
                />
              </div>

              {/* Edit Wali Kelas / Tutor Langsung */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Tanda Tangan Wali Kelas / Tutor:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Nama Lengkap Wali Kelas & Gelar
                    </label>
                    <input
                      type="text"
                      value={homeroomTeacherName}
                      onChange={(e) => setHomeroomTeacherName(e.target.value)}
                      placeholder="Drs. Hendra Gunawan"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      NIP / NIY / NUPTK
                    </label>
                    <input
                      type="text"
                      value={homeroomTeacherNip}
                      onChange={(e) => setHomeroomTeacherNip(e.target.value)}
                      placeholder="19800412 200501 1 003"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("DRAFT")}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-xs disabled:opacity-50"
            >
              {saving && status === "DRAFT" ? "Menyimpan..." : "Simpan Sebagai Draft"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("PUBLISHED")}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md disabled:opacity-50"
            >
              {saving && status === "PUBLISHED" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menerbitkan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan & Terbitkan e-Rapor</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">Pilih siswa untuk memulai entri nilai e-Rapor.</p>
        </div>
      )}
    </div>
  );
}
