import fs from "fs";
import path from "path";

const targetPath = path.join(process.cwd(), "src/app/(dashboard)/admin/keuangan/slip-gaji/page.tsx");
if (fs.existsSync(targetPath)) {
  fs.unlinkSync(targetPath);
}

const pageContent = `"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Printer,
  Plus,
  Search,
  Users,
  FileText,
  X,
  CheckCircle2,
  Banknote,
  Building2,
  GraduationCap,
  CalendarDays,
  Save,
  Eye,
  Trash2,
  TrendingDown,
  TrendingUp,
  Minus,
  Edit3,
  CreditCard,
  Briefcase,
  Layers,
  Sparkles,
  Calculator,
  AlertCircle,
  Clock,
  Check,
  Filter,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

type EmployeeType = "GTY_TETAP" | "HONORER_GTT" | "MANAJEMEN";
type SlipStatus = "DRAFT" | "DITERBITKAN" | "DIBAYARKAN";

interface Allowance {
  label: string;
  amount: number;
}

interface Deduction {
  label: string;
  amount: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  nip: string;
  position: string;
  type: EmployeeType;
  department: string;
  phone?: string;
  bankAccount?: string;
  bankName?: string;
  education?: string;
}

interface SalarySlip {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  status: SlipStatus;
  issuedDate?: string;
  notes?: string | null;
  employee?: Employee;
  createdAt?: string;
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
}

function calcGross(s: SalarySlip) {
  const base = s.baseSalary || 0;
  const allow = (s.allowances || []).reduce((t, a) => t + (Number(a.amount) || 0), 0);
  return base + allow;
}

function calcDed(s: SalarySlip) {
  return (s.deductions || []).reduce((t, d) => t + (Number(d.amount) || 0), 0);
}

function calcNet(s: SalarySlip) {
  return calcGross(s) - calcDed(s);
}

// ─── KOMPONEN CETAK & PREVIEW SLIP GAJI DENGAN KOP RESMI PKBM ASKARA ─────────
function SlipPreviewModal({
  slip,
  employee,
  onClose,
}: {
  slip: SalarySlip;
  employee: Employee;
  onClose: () => void;
}) {
  const gross = calcGross(slip);
  const ded = calcDed(slip);
  const net = calcNet(slip);

  return (
    <>
      <style>{\`
        @media print {
          body * { visibility: hidden !important; }
          #print-slip, #print-slip * { visibility: visible !important; }
          #print-slip {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            padding: 28px !important;
            background: white !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      \`}</style>

      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200">
          {/* Modal Toolbar */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Preview Dokumen Slip Gaji
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / Simpan PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SLIP CONTENT UNTUK PRINT */}
          <div id="print-slip" className="p-8 text-xs space-y-4 bg-white text-slate-800">
            {/* KOP RESMI PKBM ASKARA */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Logo PKBM Askara"
                    width={64}
                    height={64}
                    className="object-contain"
                    style={{ printColorAdjust: "exact" }}
                  />
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                    PKBM ASKARA BANDUNG
                  </h1>
                  <p className="text-slate-600 text-[11px] leading-snug mt-0.5">
                    Pusat Kegiatan Belajar Masyarakat · Pendidikan Kesetaraan & Vokasi
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Jl. Adiflora Raya No. 8, Rancabolang, Gedebage, Kota Bandung
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Telp: (022) 875 18584 · NPSN: P999876
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-extrabold tracking-wider">
                  SLIP GAJI & HONOR
                </div>
                <p className="text-slate-700 mt-2 text-xs font-semibold">
                  Periode: {MONTHS_ID[slip.month - 1]} {slip.year}
                </p>
                {slip.issuedDate && (
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    Terbit:{" "}
                    {new Date(slip.issuedDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* DATA PEGAWAI */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 grid grid-cols-2 gap-2.5">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Nama Personel
                </p>
                <p className="font-bold text-slate-900 text-sm">{employee.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  NIP / NIK
                </p>
                <p className="font-bold font-mono text-slate-900">{employee.nip}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Jabatan & Penugasan
                </p>
                <p className="font-semibold text-slate-700">{employee.position}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Divisi / Unit
                </p>
                <p className="font-semibold text-slate-700">{employee.department}</p>
              </div>
              {employee.bankAccount && employee.bankAccount !== "-" && (
                <>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Rekening Bank
                    </p>
                    <p className="font-semibold text-slate-700">{employee.bankName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Nomor Rekening
                    </p>
                    <p className="font-mono font-bold text-slate-900">{employee.bankAccount}</p>
                  </div>
                </>
              )}
            </div>

            {/* KOMPONEN GAJI & POTONGAN */}
            <div className="grid grid-cols-2 gap-4">
              {/* Pendapatan / Honor */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  Rincian Pendapatan & Honor
                </p>
                <table className="w-full border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {slip.baseSalary > 0 && (
                      <tr className="bg-slate-50">
                        <td className="px-3 py-2 text-slate-600 font-medium">Gaji Pokok / Dasar</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                          {formatRupiah(slip.baseSalary)}
                        </td>
                      </tr>
                    )}
                    {(slip.allowances || []).map((a, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-slate-600">{a.label}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatRupiah(Number(a.amount) || 0)}
                        </td>
                      </tr>
                    ))}
                    {slip.baseSalary === 0 && (slip.allowances || []).length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-slate-400 text-center italic">
                          Tidak ada rincian pendapatan
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-emerald-50">
                    <tr>
                      <td className="px-3 py-2 font-bold text-emerald-900">Total Pendapatan</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-900">
                        {formatRupiah(gross)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Potongan */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800 mb-1.5 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-rose-600" />
                  Rincian Potongan
                </p>
                <table className="w-full border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {(slip.deductions || []).map((d, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-slate-600">{d.label}</td>
                        <td className="px-3 py-2 text-right font-medium text-rose-600">
                          - {formatRupiah(Number(d.amount) || 0)}
                        </td>
                      </tr>
                    ))}
                    {(slip.deductions || []).length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-slate-400 text-center italic">
                          Tidak ada potongan
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-rose-50">
                    <tr>
                      <td className="px-3 py-2 font-bold text-rose-900">Total Potongan</td>
                      <td className="px-3 py-2 text-right font-bold text-rose-900">
                        - {formatRupiah(ded)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* GAJI BERSIH (TAKE HOME PAY) */}
            <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">
                  Gaji Bersih / Take Home Pay
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Status: <strong>{slip.status}</strong>
                  {slip.notes ? \` · \${slip.notes}\` : ""}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-emerald-400">{formatRupiah(net)}</span>
              </div>
            </div>

            {/* TANDA TANGAN PENGESAHAN */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
              <div>
                <p className="text-slate-500">Penerima / Pegawai,</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
                </div>
                <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 mt-1">
                  {employee.name}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Bendahara PKBM Askara,</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-[10px] text-slate-400 italic">(Cap & Tanda Tangan)</span>
                </div>
                <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 mt-1">
                  Bendahara Lembaga
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── HALAMAN UTAMA PENGGAJIAN & SLIP GAJI ───────────────────────────────────
export default function SlipGajiPage() {
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Semua Bulan agar semua data langsung terlihat
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [filterType, setFilterType] = useState<"ALL" | EmployeeType>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | SlipStatus>("ALL");
  const [search, setSearch] = useState("");

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingSlip, setEditingSlip] = useState<SalarySlip | null>(null);
  const [previewingSlip, setPreviewingSlip] = useState<SalarySlip | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [schemeMode, setSchemeMode] = useState<"GTY_FIXED" | "HONOR_ACTIVITY">("GTY_FIXED");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formMonth, setFormMonth] = useState(currentMonth);
  const [formYear, setFormYear] = useState(currentYear);
  const [formBaseSalary, setFormBaseSalary] = useState("0");
  const [formStatus, setFormStatus] = useState<SlipStatus>("DITERBITKAN");
  const [formNotes, setFormNotes] = useState("");

  // GTY Fixed allowances
  const [gtyJabatan, setGtyJabatan] = useState("0");
  const [gtyFungsional, setGtyFungsional] = useState("0");
  const [gtyBonus, setGtyBonus] = useState("0");
  const [gtyThr, setGtyThr] = useState("0");
  const [gtyJaldis, setGtyJaldis] = useState("0");

  // Honorer Activity multipliers
  const [honSesiCount, setHonSesiCount] = useState("0");
  const [honSesiRate, setHonSesiRate] = useState("50000"); // Rp 50.000 / sesi

  const [honSoalCount, setHonSoalCount] = useState("0");
  const [honSoalRate, setHonSoalRate] = useState("75000"); // Rp 75.000 / paket soal

  const [honNgawasCount, setHonNgawasCount] = useState("0");
  const [honNgawasRate, setHonNgawasRate] = useState("50000"); // Rp 50.000 / sesi ngawas

  const [honClubCount, setHonClubCount] = useState("0");
  const [honClubRate, setHonClubRate] = useState("60000"); // Rp 60.000 / pertemuan club

  const [honJaldisCount, setHonJaldisCount] = useState("0");
  const [honJaldisRate, setHonJaldisRate] = useState("100000"); // Rp 100.000 / hari jaldis

  const [honBonus, setHonBonus] = useState("0");

  // Custom Allowances & Deductions
  const [customAllowances, setCustomAllowances] = useState<Allowance[]>([]);
  const [customDeductions, setCustomDeductions] = useState<Deduction[]>([
    { label: "Iuran Kas & Infaq Lembaga", amount: 20000 },
  ]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/keuangan/slip-gaji");
      const data = await res.json();
      if (data.success) {
        setSlips(data.data || []);
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  // When selecting employee in modal, auto-detect scheme
  const handleSelectEmployee = (empId: string) => {
    setFormEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      if (emp.type === "HONORER_GTT") {
        setSchemeMode("HONOR_ACTIVITY");
        setFormBaseSalary("0");
      } else {
        setSchemeMode("GTY_FIXED");
        if (emp.type === "GTY_TETAP" && formBaseSalary === "0") {
          setFormBaseSalary("2500000");
        } else if (emp.type === "MANAJEMEN" && formBaseSalary === "0") {
          setFormBaseSalary("3000000");
        }
      }
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingSlip(null);
    setFormEmployeeId(employees[0]?.id || "");
    setFormMonth(currentMonth);
    setFormYear(selectedYear || currentYear);
    setFormBaseSalary("2500000");
    setGtyJabatan("300000");
    setGtyFungsional("200000");
    setGtyBonus("0");
    setGtyThr("0");
    setGtyJaldis("0");
    setHonSesiCount("12");
    setHonSesiRate("50000");
    setHonSoalCount("2");
    setHonSoalRate("75000");
    setHonNgawasCount("2");
    setHonNgawasRate("50000");
    setHonClubCount("0");
    setHonClubRate("60000");
    setHonJaldisCount("0");
    setHonJaldisRate("100000");
    setHonBonus("0");
    setCustomAllowances([]);
    setCustomDeductions([{ label: "Iuran Kas & Infaq Lembaga", amount: 20000 }]);
    setFormStatus("DITERBITKAN");
    setFormNotes("");
    setSchemeMode("GTY_FIXED");
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (slip: SalarySlip) => {
    setEditingSlip(slip);
    setFormEmployeeId(slip.employeeId);
    setFormMonth(slip.month);
    setFormYear(slip.year);
    setFormBaseSalary(String(slip.baseSalary || 0));
    setFormStatus(slip.status);
    setFormNotes(slip.notes || "");

    // Parse allowances
    const allows = slip.allowances || [];

    const sesiItem = allows.find((a) => a.label.startsWith("Honor Mengajar"));
    const soalItem = allows.find((a) => a.label.startsWith("Honor Pembuatan Soal"));
    const ngawasItem = allows.find((a) => a.label.startsWith("Honor Pengawas Ujian"));
    const clubItem = allows.find((a) => a.label.startsWith("Honor Pembina Club"));
    const jaldisItem = allows.find((a) => a.label.startsWith("Uang Perjalanan Dinas (Jaldis)"));
    const bonusItem = allows.find((a) => a.label.includes("Bonus"));
    const thrItem = allows.find((a) => a.label.includes("THR"));
    const jabatanItem = allows.find((a) => a.label.includes("Jabatan"));
    const fungsionalItem = allows.find((a) => a.label.includes("Fungsional"));

    if (sesiItem || soalItem || ngawasItem || slip.baseSalary === 0) {
      setSchemeMode("HONOR_ACTIVITY");
    } else {
      setSchemeMode("GTY_FIXED");
    }

    setGtyJabatan(String(jabatanItem?.amount || "0"));
    setGtyFungsional(String(fungsionalItem?.amount || "0"));
    setGtyBonus(String(bonusItem?.amount || "0"));
    setGtyThr(String(thrItem?.amount || "0"));
    setGtyJaldis(String(jaldisItem?.amount || "0"));

    setHonSesiCount(sesiItem ? "1" : "0");
    setHonSesiRate(String(sesiItem?.amount || "50000"));
    setHonSoalCount(soalItem ? "1" : "0");
    setHonSoalRate(String(soalItem?.amount || "75000"));
    setHonNgawasCount(ngawasItem ? "1" : "0");
    setHonNgawasRate(String(ngawasItem?.amount || "50000"));
    setHonClubCount(clubItem ? "1" : "0");
    setHonClubRate(String(clubItem?.amount || "60000"));
    setHonJaldisCount(jaldisItem ? "1" : "0");
    setHonJaldisRate(String(jaldisItem?.amount || "100000"));
    setHonBonus(String(bonusItem?.amount || "0"));

    const standardLabels = [
      "Honor Mengajar",
      "Honor Pembuatan Soal",
      "Honor Pengawas Ujian",
      "Honor Pembina Club",
      "Uang Perjalanan Dinas (Jaldis)",
      "Bonus Kinerja",
      "Tunjangan Hari Raya (THR)",
      "Tunjangan Jabatan",
      "Tunjangan Fungsional",
    ];

    const remainingAllows = allows.filter(
      (a) => !standardLabels.some((sl) => a.label.includes(sl))
    );
    setCustomAllowances(remainingAllows);
    setCustomDeductions(slip.deductions || []);

    setShowModal(true);
  };

  // Compile final allowances array based on current active scheme
  const compiledAllowances = useMemo<Allowance[]>(() => {
    const list: Allowance[] = [];

    if (schemeMode === "GTY_FIXED") {
      if (Number(gtyJabatan) > 0) list.push({ label: "Tunjangan Jabatan / Struktural", amount: Number(gtyJabatan) });
      if (Number(gtyFungsional) > 0) list.push({ label: "Tunjangan Fungsional / Transport Harian", amount: Number(gtyFungsional) });
      if (Number(gtyBonus) > 0) list.push({ label: "Bonus Kinerja & Kehadiran", amount: Number(gtyBonus) });
      if (Number(gtyThr) > 0) list.push({ label: "Tunjangan Hari Raya (THR)", amount: Number(gtyThr) });
      if (Number(gtyJaldis) > 0) list.push({ label: "Uang Perjalanan Dinas (Jaldis)", amount: Number(gtyJaldis) });
    } else {
      const sesiSub = Number(honSesiCount) * Number(honSesiRate);
      if (sesiSub > 0) list.push({ label: \`Honor Mengajar (\${honSesiCount} Sesi @ \${formatRupiah(Number(honSesiRate))})\`, amount: sesiSub });

      const soalSub = Number(honSoalCount) * Number(honSoalRate);
      if (soalSub > 0) list.push({ label: \`Honor Pembuatan Soal (\${honSoalCount} Paket @ \${formatRupiah(Number(honSoalRate))})\`, amount: soalSub });

      const ngawasSub = Number(honNgawasCount) * Number(honNgawasRate);
      if (ngawasSub > 0) list.push({ label: \`Honor Pengawas Ujian (\${honNgawasCount} Sesi @ \${formatRupiah(Number(honNgawasRate))})\`, amount: ngawasSub });

      const clubSub = Number(honClubCount) * Number(honClubRate);
      if (clubSub > 0) list.push({ label: \`Honor Pembina Club (\${honClubCount} Pertemuan @ \${formatRupiah(Number(honClubRate))})\`, amount: clubSub });

      const jaldisSub = Number(honJaldisCount) * Number(honJaldisRate);
      if (jaldisSub > 0) list.push({ label: \`Uang Perjalanan Dinas (Jaldis) (\${honJaldisCount} Hari @ \${formatRupiah(Number(honJaldisRate))})\`, amount: jaldisSub });

      if (Number(honBonus) > 0) list.push({ label: "Bonus & Insentif Kinerja", amount: Number(honBonus) });
    }

    customAllowances.forEach((ca) => {
      if (Number(ca.amount) > 0 && ca.label.trim()) list.push(ca);
    });

    return list;
  }, [
    schemeMode,
    gtyJabatan,
    gtyFungsional,
    gtyBonus,
    gtyThr,
    gtyJaldis,
    honSesiCount,
    honSesiRate,
    honSoalCount,
    honSoalRate,
    honNgawasCount,
    honNgawasRate,
    honClubCount,
    honClubRate,
    honJaldisCount,
    honJaldisRate,
    honBonus,
    customAllowances,
  ]);

  const compiledBaseSalary = schemeMode === "GTY_FIXED" ? Number(formBaseSalary) || 0 : 0;
  const compiledGross = compiledBaseSalary + compiledAllowances.reduce((t, a) => t + a.amount, 0);
  const compiledDeductions = customDeductions.reduce((t, d) => t + (Number(d.amount) || 0), 0);
  const compiledNet = compiledGross - compiledDeductions;

  // Handle Save / Update Slip Gaji
  const handleSubmitSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId) {
      alert("Silakan pilih pegawai terlebih dahulu");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        id: editingSlip?.id,
        employeeId: formEmployeeId,
        month: Number(formMonth),
        year: Number(formYear),
        baseSalary: compiledBaseSalary,
        allowances: compiledAllowances,
        deductions: customDeductions,
        status: formStatus,
        notes: formNotes,
        issuedDate: formStatus === "DITERBITKAN" ? new Date().toISOString() : undefined,
      };

      const url = "/api/keuangan/slip-gaji";
      const method = editingSlip ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        const empName = employees.find((e) => e.id === formEmployeeId)?.name || "Pegawai";
        setSuccessToast(
          \`Slip gaji untuk \${empName} (Periode \${MONTHS_ID[Number(formMonth) - 1]} \${formYear}) berhasil \${editingSlip ? "diperbarui" : "diterbitkan"}!\`
        );
        setTimeout(() => setSuccessToast(null), 5000);

        // Auto-adjust filter to ensure the new slip is clearly visible
        setSelectedYear(Number(formYear));
        setSelectedMonth(0); // Show all months of that year or the specific month
        setFilterStatus("ALL");
        setFilterType("ALL");

        setShowModal(false);
        await fetchPayrollData();
      } else {
        alert(data.error || "Gagal menyimpan slip gaji");
      }
    } catch (e: any) {
      alert(e.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(\`Yakin ingin menghapus slip gaji untuk \${name}?\`)) return;
    try {
      const res = await fetch(\`/api/keuangan/slip-gaji?id=\${id}\`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchPayrollData();
      } else {
        alert(data.error || "Gagal menghapus");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Slips
  const filteredSlips = useMemo(() => {
    return slips.filter((s) => {
      const matchMonth = selectedMonth === 0 || s.month === selectedMonth;
      const matchYear = selectedYear === 0 || s.year === selectedYear;
      const matchStatus = filterStatus === "ALL" || s.status === filterStatus;
      const matchType = filterType === "ALL" || s.employee?.type === filterType;
      const matchSearch =
        !search ||
        s.employee?.name.toLowerCase().includes(search.toLowerCase()) ||
        s.employee?.nip.toLowerCase().includes(search.toLowerCase()) ||
        s.employee?.position.toLowerCase().includes(search.toLowerCase());

      return matchMonth && matchYear && matchStatus && matchType && matchSearch;
    });
  }, [slips, selectedMonth, selectedYear, filterStatus, filterType, search]);

  // Aggregate Metrics
  const totalPayrollMonth = useMemo(() => {
    return filteredSlips.reduce((acc, s) => acc + calcNet(s), 0);
  }, [filteredSlips]);

  const gtyCount = useMemo(() => {
    return filteredSlips.filter((s) => s.employee?.type === "GTY_TETAP" || s.employee?.type === "MANAJEMEN").length;
  }, [filteredSlips]);

  const honCount = useMemo(() => {
    return filteredSlips.filter((s) => s.employee?.type === "HONORER_GTT").length;
  }, [filteredSlips]);

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi Berhasil */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 border border-emerald-500/50 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{successToast}</p>
          <button onClick={() => setSuccessToast(null)} className="p-1 hover:bg-emerald-800 rounded-lg ml-2 text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <Link href="/admin/keuangan" className="hover:text-emerald-700 transition">
            Keuangan
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 font-bold">Penggajian & Slip Gaji</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPayrollData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            title="Muat ulang data"
          >
            <RefreshCw className={\`w-3.5 h-3.5 \${loading ? "animate-spin" : ""}\`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Slip Gaji Baru</span>
          </button>
        </div>
      </div>

      {/* Banner Utama */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-emerald-300" />
              Sistem Penggajian & Honorarium
            </span>
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold">
              Skema GTY Fixed & Tutor Honorer Aktivitas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Penggajian Pendidik & Staf Manajemen
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Kelola penggajian resmi PKBM Askara. Mendukung sistem <strong>Gaji Tetap (Fixed)</strong> bulanan bagi Guru Tetap Yayasan (GTY) dan staf manajemen, serta <strong>Skema Honor Berbasis Aktivitas</strong> (Sesi Mengajar, Pembuatan Soal, Pengawas Ujian, Jaldis, dan Bonus) untuk Tutor Honorer.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Penggajian Rekap
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900">{formatRupiah(totalPayrollMonth)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {filteredSlips.length} Slip Gaji Ditampilkan
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              GTY & Manajemen
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900">{gtyCount} Personel</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Skema Gaji Pokok & Tunjangan</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tutor Honorer (GTT)
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900">{honCount} Tutor</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Skema Honor Sesi, Soal & Ngawas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Personel Terdaftar
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900">{employees.length} Pegawai</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Terhubung ke Database Pendidik</p>
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Bulan */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-emerald-500"
          >
            <option value={0}>Semua Bulan (Tampilkan Semua)</option>
            {MONTHS_ID.map((m, i) => (
              <option key={i} value={i + 1}>
                Bulan: {m}
              </option>
            ))}
          </select>

          {/* Filter Tahun */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-emerald-500"
          >
            <option value={0}>Semua Tahun</option>
            <option value={2025}>Tahun 2025</option>
            <option value={2026}>Tahun 2026</option>
            <option value={2027}>Tahun 2027</option>
          </select>

          {/* Filter Kategori Pegawai */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-emerald-500"
          >
            <option value="ALL">Semua Kategori Pegawai</option>
            <option value="GTY_TETAP">Guru Tetap Yayasan (GTY)</option>
            <option value="HONORER_GTT">Tutor Honorer (GTT)</option>
            <option value="MANAJEMEN">Staf Manajemen & TU</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-emerald-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="DITERBITKAN">DITERBITKAN</option>
            <option value="DIBAYARKAN">DIBAYARKAN</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pegawai / NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-emerald-500"
          />
        </div>
      </div>

      {/* Tabel Data Slip Gaji */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">Pegawai & Jabatan</th>
                <th className="px-4 py-3.5">Periode</th>
                <th className="px-4 py-3.5">Skema Penggajian</th>
                <th className="px-4 py-3.5 text-right">Pendapatan Kotor</th>
                <th className="px-4 py-3.5 text-right">Potongan</th>
                <th className="px-4 py-3.5 text-right">Gaji Bersih (THP)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Memuat data slip gaji & honor...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Banknote className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Belum Ada Slip Gaji</p>
                      <p className="text-xs text-slate-500">
                        Tidak ada data slip gaji pada periode atau filter yang dipilih. Silakan klik tombol "Buat Slip Gaji Baru" untuk menerbitkan gaji.
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Buat Slip Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip, idx) => {
                  const emp = slip.employee || {
                    id: slip.employeeId,
                    name: "Pegawai",
                    email: "-",
                    nip: "-",
                    position: "Tutor / Staf",
                    type: "GTY_TETAP" as const,
                    department: "Lembaga",
                  };

                  const gross = calcGross(slip);
                  const ded = calcDed(slip);
                  const net = calcNet(slip);

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/80 transition group">
                      <td className="px-4 py-3.5 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{emp.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-500">
                                {emp.nip}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span
                                className={\`px-2 py-0.5 rounded-md text-[10px] font-bold \${
                                  emp.type === "GTY_TETAP"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : emp.type === "HONORER_GTT"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }\`}
                              >
                                {emp.type === "GTY_TETAP"
                                  ? "GTY Tetap"
                                  : emp.type === "HONORER_GTT"
                                  ? "Tutor Honorer"
                                  : "Manajemen"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {MONTHS_ID[slip.month - 1]} {slip.year}
                      </td>
                      <td className="px-4 py-3.5">
                        {slip.baseSalary > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            Gaji Pokok & Tunjangan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-lg text-[11px] font-semibold">
                            <Calculator className="w-3 h-3 text-amber-600" />
                            Honor Aktivitas / Sesi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-800">
                        {formatRupiah(gross)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-rose-600">
                        {ded > 0 ? \`- \${formatRupiah(ded)}\` : "Rp 0"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-700 text-sm">
                        {formatRupiah(net)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={\`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider \${
                            slip.status === "DIBAYARKAN"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : slip.status === "DITERBITKAN"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }\`}
                        >
                          {slip.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPreviewingSlip(slip)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Preview & Cetak Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(slip)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Data Slip Gaji"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(slip.id, emp.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Slip"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM BUAT / EDIT SLIP GAJI */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  {editingSlip ? "Edit Data Slip Gaji & Honor" : "Terbitkan Slip Gaji & Honor Baru"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi rincian penghasilan tetap atau honorarium berbasis aktivitas kerja
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitSlip} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* 1. Pilih Pegawai */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Pilih Data Pegawai (Guru & Manajemen) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                >
                  <option value="">-- Pilih Guru / Staf Manajemen --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.position} ({emp.nip})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Periode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Bulan Periode</label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                  >
                    {MONTHS_ID.map((m, i) => (
                      <option key={i} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Tahun Periode</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              {/* 3. Pilihan Skema Penggajian (Tabs) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 text-xs">Pilihan Skema Penggajian</span>
                    <p className="text-[11px] text-slate-500">Pilih model perhitungan gaji pokok atau honor aktivitas</p>
                  </div>
                  <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setSchemeMode("GTY_FIXED")}
                      className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition \${
                        schemeMode === "GTY_FIXED"
                          ? "bg-white text-emerald-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }\`}
                    >
                      🏢 GTY / Pegawai Tetap
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchemeMode("HONOR_ACTIVITY")}
                      className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition \${
                        schemeMode === "HONOR_ACTIVITY"
                          ? "bg-white text-amber-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }\`}
                    >
                      🎓 Tutor Honorer / GTT
                    </button>
                  </div>
                </div>

                {/* SKEMA A: GTY FIXED */}
                {schemeMode === "GTY_FIXED" && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Gaji Pokok Bulanan (Rp)
                        </label>
                        <input
                          type="number"
                          value={formBaseSalary}
                          onChange={(e) => setFormBaseSalary(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tunjangan Jabatan / Struktural (Rp)
                        </label>
                        <input
                          type="number"
                          value={gtyJabatan}
                          onChange={(e) => setGtyJabatan(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tunjangan Fungsional / Transport (Rp)
                        </label>
                        <input
                          type="number"
                          value={gtyFungsional}
                          onChange={(e) => setGtyFungsional(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Bonus Kinerja & Kehadiran (Rp)
                        </label>
                        <input
                          type="number"
                          value={gtyBonus}
                          onChange={(e) => setGtyBonus(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tunjangan Hari Raya (THR) (Rp)
                        </label>
                        <input
                          type="number"
                          value={gtyThr}
                          onChange={(e) => setGtyThr(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Uang Perjalanan Dinas (Jaldis) (Rp)
                        </label>
                        <input
                          type="number"
                          value={gtyJaldis}
                          onChange={(e) => setGtyJaldis(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SKEMA B: HONORER BERBASIS AKTIVITAS */}
                {schemeMode === "HONOR_ACTIVITY" && (
                  <div className="space-y-3 pt-1">
                    {/* Sesi Mengajar */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-3 gap-2 items-center">
                      <div>
                        <span className="font-bold text-slate-800 block">Sesi Mengajar</span>
                        <span className="text-[10px] text-slate-500">Tatap muka / Daring</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jumlah Sesi</label>
                        <input
                          type="number"
                          value={honSesiCount}
                          onChange={(e) => setHonSesiCount(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tarif / Sesi (Rp)</label>
                        <input
                          type="number"
                          value={honSesiRate}
                          onChange={(e) => setHonSesiRate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    {/* Pembuatan Soal */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-3 gap-2 items-center">
                      <div>
                        <span className="font-bold text-slate-800 block">Pembuatan Soal</span>
                        <span className="text-[10px] text-slate-500">PTS, PAS, Modul Ajar</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jumlah Paket</label>
                        <input
                          type="number"
                          value={honSoalCount}
                          onChange={(e) => setHonSoalCount(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tarif / Paket (Rp)</label>
                        <input
                          type="number"
                          value={honSoalRate}
                          onChange={(e) => setHonSoalRate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    {/* Pengawas Ujian */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-3 gap-2 items-center">
                      <div>
                        <span className="font-bold text-slate-800 block">Pengawas Ujian</span>
                        <span className="text-[10px] text-slate-500">Pengawasan CBT & Asesmen</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jumlah Sesi</label>
                        <input
                          type="number"
                          value={honNgawasCount}
                          onChange={(e) => setHonNgawasCount(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tarif / Sesi (Rp)</label>
                        <input
                          type="number"
                          value={honNgawasRate}
                          onChange={(e) => setHonNgawasRate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    {/* Pembina Club & Ekskul */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-3 gap-2 items-center">
                      <div>
                        <span className="font-bold text-slate-800 block">Pembina Club / Ekskul</span>
                        <span className="text-[10px] text-slate-500">Robotik, Barista, Desain dll</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jumlah Pertemuan</label>
                        <input
                          type="number"
                          value={honClubCount}
                          onChange={(e) => setHonClubCount(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tarif / Pertemuan (Rp)</label>
                        <input
                          type="number"
                          value={honClubRate}
                          onChange={(e) => setHonClubRate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    {/* Perjalanan Dinas (Jaldis) */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-3 gap-2 items-center">
                      <div>
                        <span className="font-bold text-slate-800 block">Perjalanan Dinas (Jaldis)</span>
                        <span className="text-[10px] text-slate-500">Transport & Uang Harian Tugas</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jumlah Hari</label>
                        <input
                          type="number"
                          value={honJaldisCount}
                          onChange={(e) => setHonJaldisCount(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tarif / Hari (Rp)</label>
                        <input
                          type="number"
                          value={honJaldisRate}
                          onChange={(e) => setHonJaldisRate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    {/* Bonus & Insentif Tambahan */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Bonus Kinerja / Insentif Khusus (Rp)
                        </label>
                        <input
                          type="number"
                          value={honBonus}
                          onChange={(e) => setHonBonus(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tunjangan / Honor Kustom */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-700 text-[11px]">
                      Komponen Pendapatan Tambahan (Opsional)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomAllowances([...customAllowances, { label: "", amount: 0 }])
                      }
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-600"
                    >
                      + Tambah Komponen
                    </button>
                  </div>
                  {customAllowances.map((ca, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Nama Tunjangan / Honor Tambahan"
                        value={ca.label}
                        onChange={(e) => {
                          const arr = [...customAllowances];
                          arr[i].label = e.target.value;
                          setCustomAllowances(arr);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Nominal (Rp)"
                        value={ca.amount || ""}
                        onChange={(e) => {
                          const arr = [...customAllowances];
                          arr[i].amount = Number(e.target.value);
                          setCustomAllowances(arr);
                        }}
                        className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCustomAllowances(customAllowances.filter((_, idx) => idx !== i));
                        }}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Rincian Potongan */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-xs">Rincian Potongan Gaji</span>
                    <p className="text-[11px] text-slate-500">Iuran kas, infaq, pinjaman, tabungan, dll</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomDeductions([...customDeductions, { label: "", amount: 0 }])
                    }
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-600"
                  >
                    + Tambah Potongan
                  </button>
                </div>

                {customDeductions.map((cd, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nama Potongan (e.g. Kas Lembaga, BPJS)"
                      value={cd.label}
                      onChange={(e) => {
                        const arr = [...customDeductions];
                        arr[i].label = e.target.value;
                        setCustomDeductions(arr);
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Nominal (Rp)"
                      value={cd.amount || ""}
                      onChange={(e) => {
                        const arr = [...customDeductions];
                        arr[i].amount = Number(e.target.value);
                        setCustomDeductions(arr);
                      }}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-rose-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomDeductions(customDeductions.filter((_, idx) => idx !== i));
                      }}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 5. LIVE CALCULATION WIDGET - ULTRA PREMIUM & RAPI TANPA TERPOTONG */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Total Pendapatan Kotor
                      </span>
                      <p className="text-sm font-bold text-emerald-400 font-mono">
                        {formatRupiah(compiledGross)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        Total Potongan
                      </span>
                      <p className="text-sm font-bold text-rose-400 font-mono">
                        - {formatRupiah(compiledDeductions)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Highlight Gaji Bersih */}
                <div className="bg-gradient-to-r from-emerald-950/80 via-slate-800 to-slate-900 border border-emerald-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Gaji Bersih (Take Home Pay)
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Nominal bersih yang siap ditransfer kepada pegawai
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                      {formatRupiah(compiledNet)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Status & Catatan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Status Slip Gaji</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                  >
                    <option value="DRAFT">DRAFT (Penyusunan)</option>
                    <option value="DITERBITKAN">DITERBITKAN (Siap Dibayar / Dicetak)</option>
                    <option value="DIBAYARKAN">DIBAYARKAN (Lunas Ditransfer)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Catatan / Keterangan</label>
                  <input
                    type="text"
                    placeholder="e.g. Ditransfer ke rekening BJB"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? "Menyimpan..." : editingSlip ? "Simpan Perubahan Slip" : "Terbitkan Slip Gaji"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewingSlip && (
        <SlipPreviewModal
          slip={previewingSlip}
          employee={
            previewingSlip.employee || {
              id: previewingSlip.employeeId,
              name: "Pegawai PKBM",
              email: "-",
              nip: "-",
              position: "Tutor / Staf",
              type: "GTY_TETAP",
              department: "Lembaga",
            }
          }
          onClose={() => setPreviewingSlip(null)}
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync(targetPath, pageContent, "utf8");
console.log("Successfully wrote clean slip-gaji page.tsx with single copy!");
