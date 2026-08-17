import React from "react";
import { BarChart3, Award } from "lucide-react";

export default function OrangTuaNilaiPage() {
  const grades = [
    { subject: "Matematika", tugas: 90, cbt: 88, final: 89, pred: "A" },
    { subject: "Bahasa Indonesia", tugas: 86, cbt: 84, final: 85, pred: "A" },
    { subject: "PPKn", tugas: 85, cbt: 86, final: 85.5, pred: "A" },
    { subject: "Sosiologi", tugas: 92, cbt: 90, final: 91, pred: "A" },
    { subject: "Vokasi Digital", tugas: 94, cbt: 92, final: 93, pred: "A" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Perkembangan Nilai Budi Santoso</h1>
        <p className="text-xs text-slate-500 mt-1">Rincian capaian nilai tugas LMS dan ujian CBT per mata pelajaran.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100">
                <th className="pb-3">Mata Pelajaran</th>
                <th className="pb-3">Nilai Tugas (LMS)</th>
                <th className="pb-3">Nilai Ujian (CBT)</th>
                <th className="pb-3">Nilai Akhir Terhitung</th>
                <th className="pb-3">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grades.map((g, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 font-bold text-slate-800">{g.subject}</td>
                  <td className="py-3 text-slate-600">{g.tugas}</td>
                  <td className="py-3 text-slate-600">{g.cbt}</td>
                  <td className="py-3 font-bold text-slate-900">{g.final}</td>
                  <td className="py-3 font-bold text-emerald-700">{g.pred}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
