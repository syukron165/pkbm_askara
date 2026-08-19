"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Printer,
  FileText,
  Building2,
  Award,
  ArrowLeft,
  Sliders,
  Sparkles,
  UserCheck,
  RefreshCw,
} from "lucide-react";

export default function CoverRaporPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
        console.error("Auth check failed in cover:", err);
      }

      // 1. Fetch institution profile
      const profRes = await fetch("/api/rapor/institution");
      const profData = await profRes.json();
      if (profData.profile) setProfile(profData.profile);

      // 2. Fetch students list
      const listRes = await fetch("/api/rapor/list");
      const listData = await listRes.json();
      if (listData.students && listData.students.length > 0) {
        setStudents(listData.students);

        let target = listData.students[0];
        if (userRole === "siswa" || userRole === "orang_tua") {
          const matched = listData.students.find(
            (s: any) => s.studentId === userStudentId || s.studentName?.toLowerCase().includes("budi")
          );
          if (matched) target = matched;
        }

        setSelectedStudentId(target.studentId);
        setSelectedStudent(target);
      }
    } catch (err) {
      console.error("Error fetching cover data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    const found = students.find((s) => s.studentId === id);
    if (found) {
      setSelectedStudent(found);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isStaff = currentUser && ["super_admin", "admin", "pendidik"].includes(currentUser.role);
  const isAdmin = currentUser && ["super_admin", "admin"].includes(currentUser.role);
  const returnPath = currentUser?.role === "siswa" ? "/siswa/rapor" : currentUser?.role === "orang_tua" ? "/orang-tua/rapor" : "/rapor";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Action Bar (hidden on print) */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200 shadow-soft p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Dokumen Resmi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Cover Depan e-Rapor Peserta Didik
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Halaman sampul depan resmi rapor pendidikan kesetaraan standar nasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={returnPath}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Isi Rapor</span>
          </Link>
          {isAdmin && (
            <Link
              href="/rapor/pengaturan"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <Building2 className="w-4 h-4" />
              <span>Ubah Kop</span>
            </Link>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Cover</span>
          </button>
        </div>
      </div>

      {/* Student Selector Card (hidden on print) */}
      {isStaff && (
        <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-5 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3 flex-1">
              <label className="font-bold text-slate-800 shrink-0">Pilih Siswa untuk Cover:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-emerald-600 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/20"
              >
                {students.map((st) => (
                  <option key={st.studentId} value={st.studentId}>
                    {st.studentName} ({st.packetType} • {st.className})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Selection Chips */}
          {students.length > 0 && (
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
      )}

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Memuat Cover Rapor...</p>
        </div>
      ) : (
        /* Printable Cover Sheet */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-12 sm:p-16 min-h-[850px] flex flex-col justify-between items-center text-center print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 font-sans">
          {/* Top Institution Head */}
          <div className="w-full space-y-4">
            <div className="border-b-4 border-double border-slate-900 pb-4">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
                LAPORAN HASIL BELAJAR PESERTA DIDIK
              </h2>
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-700 mt-1">
                PROGRAM PENDIDIKAN KESETARAAN
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {profile?.curriculumName || "Kurikulum Merdeka Pendidikan Kesetaraan"}
              </p>
            </div>
          </div>

          {/* Center Logo & Title */}
          <div className="my-8 space-y-6 max-w-lg">
            <div className="w-28 h-28 mx-auto rounded-full border-4 border-slate-900 flex items-center justify-center p-3 bg-white">
              <img
                src={profile?.logoUrl || "/logo.png"}
                alt="Logo Lembaga"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                Nama Peserta Didik
              </p>
              <div className="border-b-2 border-slate-800 pb-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wide">
                  {selectedStudent?.studentName || "Budi Santoso"}
                </h2>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2">
                NISN: {selectedStudent?.nisn || "0081294812"}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                Program: {selectedStudent?.packetType || "Paket C"} (Rombel:{" "}
                {selectedStudent?.className || "Kelas X Merdeka"})
              </p>
            </div>
          </div>

          {/* Bottom Institution Footer */}
          <div className="w-full space-y-2 border-t-2 border-slate-800 pt-6">
            <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wider">
              {profile?.name || "Pusat Kegiatan Belajar Masyarakat (PKBM) Askara"}
            </h3>
            <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
              {profile?.address || "Jl. Adi Flora Raya No. 8 Kel Rancabolang Kec Gedebage Kota Bandung"}
            </p>
            <p className="text-[11px] text-slate-500">
              NPSN: {profile?.npsn || "P9998766"} • Izin: {profile?.operationalPermit || "-"}
            </p>
            <p className="text-xs font-bold text-slate-800 mt-2">
              TAHUN AJARAN {profile?.academicYear || "2025/2026"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
