"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Printer,
  Download,
  Calendar,
} from "lucide-react";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  GAJI: "Gaji Pendidik & Staff",
  OPERASIONAL: "Biaya Operasional",
  ATK: "ATK & Perlengkapan",
  INFRASTRUKTUR: "Infrastruktur & Sarana",
  PROGRAM: "Program Kegiatan",
  LAINNYA: "Biaya Lainnya",
};

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  tunggakan: { total: number; count: number };
  monthlyIncome: Record<number, number>;
  monthlyExpense: Record<number, number>;
  expenseByCategory: Record<string, number>;
  sppStats: Array<{ status: string; _count: { id: number }; _sum: { finalAmount: number | null } }>;
}

type ReportType = "laba-rugi" | "arus-kas" | "neraca";

export default function LaporanKeuanganPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | null>(null); // null = full year
  const [reportType, setReportType] = useState<ReportType>("laba-rugi");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ year: String(year) });
    if (month) params.append("month", String(month));
    fetch(`/api/keuangan/summary?${params}`)
      .then(r => r.json())
      .then(data => { setSummary(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  const periodLabel = month ? `${MONTHS[month - 1]} ${year}` : `Tahun ${year}`;

  const totalExpenseByCategory = summary
    ? Object.entries(summary.expenseByCategory).map(([cat, amount]) => ({
        cat,
        label: EXPENSE_CATEGORY_LABELS[cat] || cat,
        amount,
      })).sort((a, b) => b.amount - a.amount)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Laporan Keuangan Lengkap
          </h1>
          <p className="text-sm text-slate-500 mt-1">Neraca keuangan, laporan laba rugi, dan arus kas PKBM Askara</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Printer className="w-3.5 h-3.5" /> Cetak
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <option key={y} value={y}>Tahun {y}</option>
            ))}
          </select>
        </div>
        <select
          value={month ?? ""}
          onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : null)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Bulan (Tahunan)</option>
          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>

        {/* Report Type Tabs */}
        <div className="ml-auto flex bg-slate-100 rounded-lg p-1 gap-1">
          {(["laba-rugi", "arus-kas", "neraca"] as ReportType[]).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                reportType === type ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {type === "laba-rugi" ? "Laba / Rugi" : type === "arus-kas" ? "Arus Kas" : "Neraca"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Pemasukan", value: summary?.totalIncome || 0, icon: TrendingUp, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", iconColor: "text-emerald-600" },
          { label: "Total Pengeluaran", value: summary?.totalExpense || 0, icon: TrendingDown, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", iconColor: "text-rose-500" },
          { label: "Saldo Bersih", value: summary ? summary.balance : 0, icon: Wallet, color: (summary?.balance ?? 0) >= 0 ? "text-blue-700" : "text-amber-700", bg: (summary?.balance ?? 0) >= 0 ? "bg-blue-50" : "bg-amber-50", border: (summary?.balance ?? 0) >= 0 ? "border-blue-200" : "border-amber-200", iconColor: (summary?.balance ?? 0) >= 0 ? "text-blue-600" : "text-amber-500" },
          { label: "Tunggakan", value: summary?.tunggakan.total || 0, icon: BarChart3, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", iconColor: "text-purple-500" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`${kpi.bg} border ${kpi.border} rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600">{kpi.label}</p>
                <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
              </div>
              {loading ? (
                <div className="h-7 bg-white/60 rounded animate-pulse" />
              ) : (
                <p className={`text-xl font-bold ${kpi.color}`}>{formatRupiah(kpi.value)}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">{periodLabel}</p>
            </div>
          );
        })}
      </div>

      {/* Report Body */}
      {reportType === "laba-rugi" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-base font-bold text-slate-800">Laporan Laba / Rugi</h2>
            <p className="text-xs text-slate-500">Periode: {periodLabel}</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Pemasukan Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Pemasukan
              </h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td className="py-2"><div className="h-4 bg-slate-100 rounded animate-pulse w-48"/></td>
                        <td className="py-2 text-right"><div className="h-4 bg-slate-100 rounded animate-pulse w-32 ml-auto"/></td>
                      </tr>
                    ))
                  ) : summary && (() => {
                    const lunasStat = summary.sppStats.find(s => s.status === "LUNAS");
                    const sppIncome = lunasStat?._sum?.finalAmount || 0;
                    const otherIncome = summary.totalIncome - sppIncome;
                    return (
                      <>
                        <tr>
                          <td className="py-2.5 text-slate-700">Penerimaan SPP Bulanan</td>
                          <td className="py-2.5 text-right font-semibold text-emerald-700">{formatRupiah(sppIncome)}</td>
                        </tr>
                        {otherIncome > 0 && (
                          <tr>
                            <td className="py-2.5 text-slate-700">Penerimaan Biaya Pendidikan Lainnya</td>
                            <td className="py-2.5 text-right font-semibold text-emerald-700">{formatRupiah(otherIncome)}</td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-slate-200 font-bold">
                          <td className="py-3 text-slate-900">Total Pemasukan</td>
                          <td className="py-3 text-right text-emerald-700 text-base">{formatRupiah(summary.totalIncome)}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            <div className="border-t border-dashed border-slate-200" />

            {/* Pengeluaran Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500" /> Pengeluaran
              </h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        <td className="py-2"><div className="h-4 bg-slate-100 rounded animate-pulse w-48"/></td>
                        <td className="py-2 text-right"><div className="h-4 bg-slate-100 rounded animate-pulse w-32 ml-auto"/></td>
                      </tr>
                    ))
                  ) : (
                    <>
                      {totalExpenseByCategory.map(({ cat, label, amount }) => (
                        <tr key={cat}>
                          <td className="py-2.5 text-slate-700">{label}</td>
                          <td className="py-2.5 text-right font-semibold text-rose-600">{formatRupiah(amount)}</td>
                        </tr>
                      ))}
                      {totalExpenseByCategory.length === 0 && (
                        <tr><td colSpan={2} className="py-4 text-center text-slate-400 text-xs">Belum ada data pengeluaran</td></tr>
                      )}
                      <tr className="border-t-2 border-slate-200 font-bold">
                        <td className="py-3 text-slate-900">Total Pengeluaran</td>
                        <td className="py-3 text-right text-rose-700 text-base">{formatRupiah(summary?.totalExpense || 0)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t-2 border-slate-900" />

            {/* Net */}
            {!loading && summary && (
              <div className={`rounded-xl p-4 flex items-center justify-between ${summary.balance >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                <div>
                  <p className="text-sm font-bold text-slate-800">{summary.balance >= 0 ? "SURPLUS (Laba Bersih)" : "DEFISIT (Rugi Bersih)"}</p>
                  <p className="text-xs text-slate-500">Total Pemasukan − Total Pengeluaran</p>
                </div>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {formatRupiah(Math.abs(summary.balance))}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {reportType === "arus-kas" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-base font-bold text-slate-800">Laporan Arus Kas (Cash Flow)</h2>
            <p className="text-xs text-slate-500">Periode: {periodLabel}</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-2.5 font-bold text-slate-700">Bulan</th>
                    <th className="text-right py-2.5 font-bold text-emerald-700">Pemasukan</th>
                    <th className="text-right py-2.5 font-bold text-rose-600">Pengeluaran</th>
                    <th className="text-right py-2.5 font-bold text-blue-700">Saldo Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [...Array(12)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(4)].map((__, j) => (
                          <td key={j} className="py-2.5"><div className="h-4 bg-slate-100 rounded animate-pulse w-full"/></td>
                        ))}
                      </tr>
                    ))
                  ) : summary ? (
                    MONTHS.map((m, i) => {
                      const mNum = i + 1;
                      const inc = summary.monthlyIncome[mNum] || 0;
                      const exp = summary.monthlyExpense[mNum] || 0;
                      const net = inc - exp;
                      const hasData = inc > 0 || exp > 0;
                      return (
                        <tr key={mNum} className={`hover:bg-slate-50/70 transition ${!hasData ? "opacity-40" : ""}`}>
                          <td className="py-2.5 font-medium text-slate-700">{m} {year}</td>
                          <td className="py-2.5 text-right text-emerald-700 font-semibold">{inc > 0 ? formatRupiah(inc) : "-"}</td>
                          <td className="py-2.5 text-right text-rose-600 font-semibold">{exp > 0 ? formatRupiah(exp) : "-"}</td>
                          <td className={`py-2.5 text-right font-bold ${net >= 0 ? "text-blue-700" : "text-amber-700"}`}>
                            {hasData ? formatRupiah(net) : "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : null}
                </tbody>
                {!loading && summary && (
                  <tfoot className="border-t-2 border-slate-900">
                    <tr className="font-bold text-sm">
                      <td className="py-3 text-slate-900 uppercase tracking-wide">Total</td>
                      <td className="py-3 text-right text-emerald-700">{formatRupiah(summary.totalIncome)}</td>
                      <td className="py-3 text-right text-rose-600">{formatRupiah(summary.totalExpense)}</td>
                      <td className={`py-3 text-right text-base ${summary.balance >= 0 ? "text-blue-700" : "text-amber-700"}`}>{formatRupiah(summary.balance)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === "neraca" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-base font-bold text-slate-800">Neraca Keuangan</h2>
            <p className="text-xs text-slate-500">Posisi keuangan per akhir {periodLabel}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AKTIVA */}
              <div>
                <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-4 pb-2 border-b-2 border-blue-200">AKTIVA (Aset)</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-2.5 text-slate-600">Kas & Setara Kas</td><td className="py-2.5 text-right font-semibold">{loading ? "..." : formatRupiah(summary?.balance || 0)}</td></tr>
                    <tr><td className="py-2.5 text-slate-600">Piutang SPP (Tunggakan)</td><td className="py-2.5 text-right font-semibold text-amber-700">{loading ? "..." : formatRupiah(summary?.tunggakan.total || 0)}</td></tr>
                    <tr className="border-t-2 border-slate-300 font-bold">
                      <td className="py-3 text-slate-900">Total Aktiva</td>
                      <td className="py-3 text-right text-blue-700">{loading ? "..." : formatRupiah((summary?.balance || 0) + (summary?.tunggakan.total || 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* EKUITAS */}
              <div>
                <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-4 pb-2 border-b-2 border-emerald-200">EKUITAS & KEWAJIBAN</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-2.5 text-slate-600">Modal / Dana Lembaga</td><td className="py-2.5 text-right font-semibold">{loading ? "..." : formatRupiah(summary?.totalIncome || 0)}</td></tr>
                    <tr><td className="py-2.5 text-slate-600">Beban Operasional</td><td className="py-2.5 text-right font-semibold text-rose-600">{loading ? "..." : "(" + formatRupiah(summary?.totalExpense || 0) + ")"}</td></tr>
                    <tr className="border-t-2 border-slate-300 font-bold">
                      <td className="py-3 text-slate-900">Saldo Bersih</td>
                      <td className={`py-3 text-right ${(summary?.balance ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{loading ? "..." : formatRupiah(summary?.balance || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {!loading && summary && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                  Laporan ini dibuat secara otomatis berdasarkan data transaksi yang tercatat di sistem PKBM Askara.
                  Untuk audit eksternal, hubungi bagian keuangan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
