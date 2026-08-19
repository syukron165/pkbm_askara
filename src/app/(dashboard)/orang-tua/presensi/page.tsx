"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CalendarCheck, CheckCircle2, Users, GraduationCap, RefreshCw, Clock, AlertCircle } from "lucide-react";

export default function OrangTuaPresensiPage() {
  const [data, setData] = useState<{ parent: any; children: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const fetchPresensiData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parents/my-children");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load attendance data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresensiData();
  }, [fetchPresensiData]);

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
            Rekap Kehadiran {activeChild ? activeChild.name : "Siswa"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau presensi harian, ketepatan waktu check-in/out, dan rekapitulasi kehadiran putra/putri Anda secara transparan.
          </p>
        </div>

        <button
          onClick={fetchPresensiData}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Presensi</span>
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
                  ? "bg-emerald-600 text-white shadow-sm"
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

      {/* Attendance Stats Cards */}
      {activeChild && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Persentase Kehadiran</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {activeChild.stats.attendanceRate}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Tingkat kehadiran aktif</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Hadir Tepat Waktu</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {activeChild.stats.presentCount} <span className="text-xs font-semibold text-slate-400">Hari</span>
            </p>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 block">Presensi Valid</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Izin / Sakit</span>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {activeChild.stats.izinCount + activeChild.stats.sakitCount} <span className="text-xs font-semibold text-slate-400">Hari</span>
            </p>
            <span className="text-[11px] text-amber-600 font-bold mt-1 block">Terkonfirmasi</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Tanpa Keterangan (Alpa)</span>
            <p className="text-2xl font-black text-rose-700 mt-1">
              {activeChild.stats.alpaCount} <span className="text-xs font-semibold text-slate-400">Hari</span>
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Perlu pendampingan</span>
          </div>
        </div>
      )}

      {/* Attendance Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-800">
          Riwayat Presensi Masuk & Keluar Sesi
        </h2>

        {!activeChild || activeChild.attendanceLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CalendarCheck className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-medium">Belum ada riwayat presensi terekam untuk siswa ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100">
                  <th className="pb-3">Tanggal</th>
                  <th className="pb-3">Waktu Presensi</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Metode & Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeChild.attendanceLogs.map((log: any) => {
                  const statusColor =
                    log.status === "PRESENT" || log.status === "HADIR"
                      ? "bg-emerald-100 text-emerald-800"
                      : log.status === "EXCUSED" || log.status === "IZIN"
                      ? "bg-amber-100 text-amber-800"
                      : log.status === "SICK" || log.status === "SAKIT"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-rose-100 text-rose-800";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-semibold text-slate-800">{log.date}</td>
                      <td className="py-3 text-slate-600 font-mono">{log.time}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${statusColor}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{log.method}</td>
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
