import React from "react";
import { CalendarCheck, CheckCircle2 } from "lucide-react";

export default function OrangTuaPresensiPage() {
  const attendanceLogs = [
    { date: "13 Ags 2026", time: "07:45 WIB", status: "HADIR", method: "GPS Valid (12m)" },
    { date: "12 Ags 2026", time: "07:35 WIB", status: "HADIR", method: "QR Code" },
    { date: "11 Ags 2026", time: "07:50 WIB", status: "HADIR", method: "GPS Valid (18m)" },
    { date: "10 Ags 2026", time: "-", status: "IZIN", method: "Surat Izin Orang Tua" },
    { date: "09 Ags 2026", time: "07:40 WIB", status: "HADIR", method: "QR Code" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rekap Kehadiran Budi Santoso</h1>
        <p className="text-xs text-slate-500 mt-1">Pantau presensi harian putra/putri Anda secara transparan.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100">
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Waktu Masuk</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Validasi Presensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 font-semibold text-slate-800">{log.date}</td>
                  <td className="py-3 text-slate-600">{log.time}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{log.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
