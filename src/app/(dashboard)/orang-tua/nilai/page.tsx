"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, Award, BookOpen, Users, GraduationCap, RefreshCw } from "lucide-react";

export default function OrangTuaNilaiPage() {
  const [data, setData] = useState<{ parent: any; children: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const fetchNilaiData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parents/my-children");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load grades data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNilaiData();
  }, [fetchNilaiData]);

  const children = data?.children || [];
  const activeChild = children[selectedChildIndex] || children[0];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Perkembangan Nilai {activeChild ? activeChild.name : "Siswa"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rincian capaian nilai tugas LMS, asesmen modul, dan ujian CBT berkala.
          </p>
        </div>

        <button
          onClick={fetchNilaiData}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Nilai</span>
        </button>
      </div>

      {/* Multi-Child Selector */}
      {children.length > 1 && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            Pilih Putra / Putri:
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
              <span className="text-[10px] opacity-80">({c.packetType})</span>
            </button>
          ))}
        </div>
      )}

      {/* Child Summary Stats */}
      {activeChild && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Rata-Rata Nilai Keseluruhan</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {activeChild.stats.averageGrade} <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </p>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
              {Number(activeChild.stats.averageGrade) >= 85 ? "Predikat Sangat Memuaskan (A)" : Number(activeChild.stats.averageGrade) >= 75 ? "Predikat Baik (B)" : "Aktif Belajar"}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Tugas LMS Dinilai</span>
            <p className="text-2xl font-black text-indigo-700 mt-1">
              {activeChild.stats.gradedTasksCount} <span className="text-xs font-semibold text-slate-400">Tugas</span>
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Penilaian berkelanjutan oleh tutor modul</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Ujian CBT Selesai</span>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {activeChild.stats.cbtCompletedCount} <span className="text-xs font-semibold text-slate-400">Sesi CBT</span>
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Evaluasi berkala daring terpusat</span>
          </div>
        </div>
      )}

      {/* Grades Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-800">
          Daftar Rincian Nilai Tugas & Ujian
        </h2>

        {!activeChild || activeChild.recentGrades.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-medium">Belum ada data nilai tugas/ujian terekam untuk semester ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100">
                  <th className="pb-3">Mata Pelajaran</th>
                  <th className="pb-3">Tipe Asesmen</th>
                  <th className="pb-3">Judul Tugas / Ujian</th>
                  <th className="pb-3">Tanggal</th>
                  <th className="pb-3 text-right">Nilai</th>
                  <th className="pb-3 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeChild.recentGrades.map((g: any) => {
                  const score = Number(g.grade);
                  const predikat = score >= 85 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D";
                  const predikatColor = score >= 85 ? "text-emerald-700 bg-emerald-50" : score >= 75 ? "text-blue-700 bg-blue-50" : "text-amber-700 bg-amber-50";

                  return (
                    <tr key={g.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-bold text-slate-800">{g.subject}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {g.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{g.title}</td>
                      <td className="py-3 text-slate-500">{g.date}</td>
                      <td className="py-3 font-black text-slate-900 text-right">{g.grade}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${predikatColor}`}>
                          {predikat}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
