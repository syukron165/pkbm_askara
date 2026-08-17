"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  Calendar,
  Wallet,
  Receipt,
  ArrowRight,
  XCircle,
} from "lucide-react";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

interface Payment {
  id: string;
  amount: number;
  finalAmount: number;
  discount: number;
  status: string;
  paymentDate: string | null;
  dueDate: string;
  periodMonth: number;
  periodYear: number;
  paymentMethod: string | null;
  receiptNumber: string | null;
  notes: string | null;
  feeType: { name: string; category: string };
}

interface StudentData {
  studentId: string;
  studentName: string;
  nisn: string | null;
  packetType: string;
  totalPaid: number;
  totalTagihan: number;
  totalTunggakan: number;
  recentPayments: Payment[];
  yearPayments: Payment[];
}

interface ActiveBill {
  id: string;
  finalAmount: number;
  status: string;
  dueDate: string;
  periodMonth: number;
  periodYear: number;
  feeType: { name: string };
  student: { user: { name: string } };
}

interface PaymentData {
  students: StudentData[];
  activeBills: ActiveBill[];
  currentMonth: number;
  currentYear: number;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  LUNAS: { label: "Lunas", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PENDING: { label: "Belum Bayar", icon: Clock, className: "bg-amber-100 text-amber-800 border-amber-200" },
  TERLAMBAT: { label: "Terlambat", icon: XCircle, className: "bg-rose-100 text-rose-800 border-rose-200" },
  SEBAGIAN: { label: "Sebagian", icon: AlertTriangle, className: "bg-blue-100 text-blue-800 border-blue-200" },
};

export default function OrangTuaKeuanganPage() {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ year: String(selectedYear) });
    if (selectedStudent) params.append("studentId", selectedStudent);
    fetch(`/api/keuangan/orang-tua/payments?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); if (d.students?.[0]) setExpandedStudent(d.students[0].studentId); })
      .catch(() => setLoading(false));
  }, [selectedYear, selectedStudent]);

  const hasTunggakan = (data?.activeBills?.length || 0) > 0;
  const currentStudent = data?.students?.find(s => s.studentId === expandedStudent) || data?.students?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 text-white/90 border border-white/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Portal Keuangan Wali Murid
          </span>
          <h1 className="text-2xl font-bold">Rekap SPP & Pembayaran Pendidikan</h1>
          <p className="text-amber-100 text-sm mt-1">Pantau status pembayaran dan riwayat keuangan pendidikan anak Anda</p>
        </div>
      </div>

      {/* Tunggakan Alert */}
      {!loading && hasTunggakan && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-rose-800">Ada Tagihan yang Belum Dibayar</p>
            <p className="text-xs text-rose-600 mt-0.5">
              Terdapat {data?.activeBills.length} tagihan aktif bulan {MONTHS[data!.currentMonth - 1]} {data?.currentYear}.
              Harap segera lakukan pembayaran untuk menghindari denda.
            </p>
            <div className="mt-2 space-y-1">
              {data?.activeBills.map((bill) => (
                <div key={bill.id} className="text-xs text-rose-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{bill.student.user.name} — {bill.feeType.name}: <strong>{formatRupiah(bill.finalAmount)}</strong></span>
                  <span className="text-rose-400">· Jatuh tempo: {new Date(bill.dueDate).toLocaleDateString("id-ID")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Year Filter & Student Select */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {[currentYear, currentYear - 1].map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
        </div>
        {data && data.students.length > 1 && (
          <select
            value={selectedStudent || ""}
            onChange={(e) => setSelectedStudent(e.target.value || null)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Semua Anak</option>
            {data.students.map(s => <option key={s.studentId} value={s.studentId}>{s.studentName}</option>)}
          </select>
        )}
      </div>

      {/* Student Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse"/>)}
        </div>
      ) : !data || data.students.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Belum ada data pembayaran</p>
          <p className="text-xs mt-1">Data pembayaran akan muncul setelah admin mencatat transaksi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.students.map((student) => {
            const isExpanded = expandedStudent === student.studentId;
            const paidPct = student.totalTagihan > 0 ? Math.round((student.totalPaid / student.totalTagihan) * 100) : 0;
            return (
              <div key={student.studentId} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Student Header */}
                <button
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition"
                  onClick={() => setExpandedStudent(isExpanded ? null : student.studentId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-sm font-bold text-amber-700">
                      {student.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">{student.studentName}</p>
                      <p className="text-xs text-slate-500">{student.packetType} · NISN: {student.nisn || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">Terbayar {selectedYear}</p>
                      <p className="text-sm font-bold text-emerald-700">{formatRupiah(student.totalPaid)}</p>
                    </div>
                    {student.totalTunggakan > 0 && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500">Tunggakan</p>
                        <p className="text-sm font-bold text-rose-600">{formatRupiah(student.totalTunggakan)}</p>
                      </div>
                    )}
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Progress Bar */}
                <div className="px-5 pb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progres Pembayaran {selectedYear}</span>
                    <span className="font-semibold">{paidPct}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>Terbayar: {formatRupiah(student.totalPaid)}</span>
                    <span>Total Tagihan: {formatRupiah(student.totalTagihan)}</span>
                  </div>
                </div>

                {/* Expanded: Payment History */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100">
                      {[
                        { label: "Lunas", value: student.yearPayments.filter(p => p.status === "LUNAS").length, icon: CheckCircle2, color: "text-emerald-600" },
                        { label: "Belum Bayar", value: student.yearPayments.filter(p => ["PENDING", "TERLAMBAT"].includes(p.status)).length, icon: Clock, color: "text-amber-600" },
                        { label: "Total Tagihan", value: student.yearPayments.length, icon: Receipt, color: "text-blue-600" },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="p-4 text-center">
                          <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                          <p className="text-lg font-bold text-slate-800">{value}</p>
                          <p className="text-[11px] text-slate-400">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Payment Table */}
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Riwayat Pembayaran {selectedYear}</h4>
                      {student.yearPayments.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-6">Belum ada pembayaran pada tahun {selectedYear}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100">
                                <th className="pb-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Periode</th>
                                <th className="pb-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Jenis</th>
                                <th className="pb-2 text-right text-[11px] font-semibold text-slate-400 uppercase">Nominal</th>
                                <th className="pb-2 text-center text-[11px] font-semibold text-slate-400 uppercase">Status</th>
                                <th className="pb-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Tgl Bayar</th>
                                <th className="pb-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Metode</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {student.yearPayments.map((p) => {
                                const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                                const StatusIcon = sc.icon;
                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                                    <td className="py-2.5 font-medium text-slate-700">{MONTHS[p.periodMonth - 1]}</td>
                                    <td className="py-2.5 text-slate-600 text-xs">{p.feeType.name}</td>
                                    <td className="py-2.5 text-right font-bold text-slate-800">{formatRupiah(p.finalAmount)}</td>
                                    <td className="py-2.5 text-center">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.className}`}>
                                        <StatusIcon className="w-3 h-3" />{sc.label}
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-xs text-slate-500">
                                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                                    </td>
                                    <td className="py-2.5 text-xs text-slate-400">{p.paymentMethod || "-"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Wallet className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Cara Pembayaran SPP</p>
          <p className="text-xs text-blue-600 mt-1">
            Pembayaran SPP dapat dilakukan secara tunai di kantor PKBM Askara, melalui transfer bank, atau Virtual Account.
            Harap menyertakan nama siswa saat melakukan transfer. Bukti pembayaran dapat dikonfirmasi ke admin.
          </p>
          <a href="tel:+62" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 mt-2 hover:text-blue-900">
            Hubungi Admin <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
