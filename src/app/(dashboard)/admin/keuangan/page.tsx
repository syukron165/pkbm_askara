"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  ArrowRight,
  Receipt,
  BadgeDollarSign,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Coins,
  Banknote,
} from "lucide-react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

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

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  GAJI: "Gaji Pendidik",
  OPERASIONAL: "Operasional",
  ATK: "ATK & Perlengkapan",
  INFRASTRUKTUR: "Infrastruktur",
  PROGRAM: "Program Kegiatan",
  LAINNYA: "Lainnya",
};

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  GAJI: "bg-purple-500",
  OPERASIONAL: "bg-blue-500",
  ATK: "bg-amber-500",
  INFRASTRUKTUR: "bg-rose-500",
  PROGRAM: "bg-emerald-500",
  LAINNYA: "bg-slate-400",
};

export default function KeuanganDashboardPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/keuangan/summary?year=${selectedYear}`)
      .then((r) => r.json())
      .then((data) => { setSummary(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedYear]);

  // Bar chart max value
  const maxBar = summary
    ? Math.max(...Object.values(summary.monthlyIncome), ...Object.values(summary.monthlyExpense), 1)
    : 1;

  const kpiCards = summary
    ? [
        {
          label: "Total Pemasukan",
          value: formatRupiah(summary.totalIncome),
          sub: `Tahun ${selectedYear}`,
          icon: TrendingUp,
          color: "emerald",
          bg: "bg-emerald-50",
          iconBg: "bg-emerald-600",
          border: "border-emerald-200",
          textValue: "text-emerald-700",
        },
        {
          label: "Total Pengeluaran",
          value: formatRupiah(summary.totalExpense),
          sub: `Tahun ${selectedYear}`,
          icon: TrendingDown,
          color: "rose",
          bg: "bg-rose-50",
          iconBg: "bg-rose-600",
          border: "border-rose-200",
          textValue: "text-rose-700",
        },
        {
          label: "Saldo Kas",
          value: formatRupiah(summary.balance),
          sub: summary.balance >= 0 ? "Surplus ✓" : "Defisit ⚠",
          icon: Wallet,
          color: summary.balance >= 0 ? "blue" : "amber",
          bg: summary.balance >= 0 ? "bg-blue-50" : "bg-amber-50",
          iconBg: summary.balance >= 0 ? "bg-blue-600" : "bg-amber-600",
          border: summary.balance >= 0 ? "border-blue-200" : "border-amber-200",
          textValue: summary.balance >= 0 ? "text-blue-700" : "text-amber-700",
        },
        {
          label: "Tunggakan SPP",
          value: formatRupiah(summary.tunggakan.total),
          sub: `${summary.tunggakan.count} transaksi belum lunas`,
          icon: AlertCircle,
          color: "amber",
          bg: "bg-amber-50",
          iconBg: "bg-amber-500",
          border: "border-amber-200",
          textValue: "text-amber-700",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Modul Keuangan
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Laporan Keuangan PKBM Askara</h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed max-w-2xl">
            Pantau pemasukan SPP, pengeluaran operasional, dan neraca keuangan lembaga secara real-time.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/admin/keuangan/spp"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-sm">
              <Receipt className="w-4 h-4" /> Rekap SPP
            </Link>
            <Link href="/admin/keuangan/slip-gaji"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition shadow-sm">
              <Banknote className="w-4 h-4" /> Penggajian & Slip Gaji
            </Link>
            <Link href="/admin/keuangan/laporan"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition">
              <FileSpreadsheet className="w-4 h-4" /> Laporan Lengkap
            </Link>
            <Link href="/admin/keuangan/pengeluaran"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition">
              <BadgeDollarSign className="w-4 h-4" /> Catat Pengeluaran
            </Link>
          </div>
        </div>
      </div>

      {/* Year Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Ringkasan Tahun Anggaran</h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className={`${card.bg} border ${card.border} rounded-xl p-5 flex flex-col gap-3`}>
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-slate-600">{card.label}</p>
                  <div className={`${card.iconBg} p-2 rounded-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <p className={`text-xl font-bold ${card.textValue} leading-tight`}>{card.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">Arus Kas Bulanan</h3>
              <p className="text-xs text-slate-500">Pemasukan vs Pengeluaran — {selectedYear}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Pemasukan</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Pengeluaran</span>
            </div>
          </div>
          {loading ? (
            <div className="h-48 animate-pulse bg-slate-100 rounded-lg" />
          ) : (
            <div className="flex items-end gap-2 h-48 mt-2">
              {MONTHS.map((label, i) => {
                const m = i + 1;
                const inc = summary?.monthlyIncome[m] || 0;
                const exp = summary?.monthlyExpense[m] || 0;
                const incH = maxBar > 0 ? Math.round((inc / maxBar) * 100) : 0;
                const expH = maxBar > 0 ? Math.round((exp / maxBar) * 100) : 0;
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-36">
                      <div
                        className="flex-1 bg-emerald-500 rounded-t-sm transition-all duration-500 hover:bg-emerald-400 cursor-pointer"
                        style={{ height: `${incH}%`, minHeight: inc > 0 ? "4px" : "0" }}
                        title={`Pemasukan: ${formatRupiah(inc)}`}
                      />
                      <div
                        className="flex-1 bg-rose-400 rounded-t-sm transition-all duration-500 hover:bg-rose-300 cursor-pointer"
                        style={{ height: `${expH}%`, minHeight: exp > 0 ? "4px" : "0" }}
                        title={`Pengeluaran: ${formatRupiah(exp)}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense by Category */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-base font-bold text-slate-800 mb-1">Pengeluaran per Kategori</h3>
          <p className="text-xs text-slate-500 mb-4">Distribusi biaya — {selectedYear}</p>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse"/>)}
            </div>
          ) : summary && Object.keys(summary.expenseByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(summary.expenseByCategory)
                .sort(([,a],[,b]) => b - a)
                .map(([cat, amount]) => {
                  const pct = summary.totalExpense > 0 ? Math.round((amount / summary.totalExpense) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{EXPENSE_CATEGORY_LABELS[cat] || cat}</span>
                        <span className="text-slate-500">{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${EXPENSE_CATEGORY_COLORS[cat] || "bg-slate-400"} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatRupiah(amount)}</p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">Belum ada data pengeluaran</p>
            </div>
          )}
        </div>
      </div>

      {/* SPP Status & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SPP Status */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Status Pembayaran SPP</h3>
              <p className="text-xs text-slate-500">Rekap status tagihan SPP tahun {selectedYear}</p>
            </div>
            <Link href="/admin/keuangan/spp"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              Lihat Detail <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse"/>)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "LUNAS", label: "Lunas", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                { key: "PENDING", label: "Belum Bayar", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                { key: "TERLAMBAT", label: "Terlambat", icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
              ].map(({ key, label, icon: Icon, color, bg, border }) => {
                const stat = summary?.sppStats.find(s => s.status === key);
                return (
                  <div key={key} className={`${bg} border ${border} rounded-lg p-4 text-center`}>
                    <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
                    <p className={`text-lg font-bold ${color}`}>{stat?._count.id || 0}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{label}</p>
                    <p className="text-[10px] text-slate-400">{formatRupiah(stat?._sum.finalAmount || 0)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-base font-bold text-slate-800 mb-4">Menu Keuangan</h3>
          <div className="space-y-2">
            {[
              { href: "/admin/keuangan/spp", label: "Rekap & Kelola SPP", sub: "Status tagihan semua siswa", icon: Receipt, color: "text-emerald-600" },
              { href: "/admin/keuangan/pemasukan-lain", label: "Pemasukan Non-SPP", sub: "Yayasan, hibah BOS, sumbangan", icon: Coins, color: "text-amber-600" },
              { href: "/admin/keuangan/pengeluaran", label: "Catat Pengeluaran", sub: "Operasional, gaji, ATK", icon: BadgeDollarSign, color: "text-rose-600" },
              { href: "/admin/keuangan/slip-gaji", label: "Slip Gaji", sub: "Karyawan & tutor PKBM Askara", icon: Banknote, color: "text-purple-600" },
              { href: "/admin/keuangan/laporan", label: "Laporan Keuangan", sub: "Neraca, laba rugi, cash flow", icon: FileSpreadsheet, color: "text-blue-600" },
            ].map(({ href, label, sub, icon: Icon, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition group">
                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-800 transition">{label}</p>
                  <p className="text-[11px] text-slate-400 truncate">{sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
