import React from "react";
import { BarChart3, Download, Sparkles, Award } from "lucide-react";

export default function GuruNilaiPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rekapitulasi Nilai Mata Pelajaran</h1>
          <p className="text-xs text-slate-500 mt-1">Nilai tugas LMS dan CBT yang terhubung langsung ke e-Rapor.</p>
        </div>
        <button className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm">
          <Download className="w-4 h-4" />
          <span>Export Rekap Nilai</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <strong>Agregasi Otomatis e-Rapor:</strong> Seluruh nilai tugas dan nilai ujian yang dimasukkan tutor pada modul LMS dan CBT akan otomatis masuk ke formula perhitungan e-Rapor siswa tanpa perlu input ulang.
          </div>
        </div>
      </div>
    </div>
  );
}
