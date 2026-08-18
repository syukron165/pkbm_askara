"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight, Printer, Plus, Search, Users, FileText,
  X, CheckCircle2, Banknote, Building2, GraduationCap,
  CalendarDays, Save, Eye, Trash2, TrendingDown, TrendingUp, Minus,
} from "lucide-react";

type EmployeeType = "KARYAWAN" | "TUTOR";
type SlipStatus = "DRAFT" | "DITERBITKAN";
interface Allowance { label: string; amount: number; }
interface Deduction { label: string; amount: number; }
interface Employee { id: string; name: string; nip: string; position: string; type: EmployeeType; department: string; baseSalary: number; bankAccount?: string; bankName?: string; }
interface SalarySlip { id: string; employeeId: string; month: number; year: number; baseSalary: number; allowances: Allowance[]; deductions: Deduction[]; status: SlipStatus; issuedDate?: string; notes?: string; }

const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

const EMPLOYEES: Employee[] = [
  { id: "e1", name: "Dewi Anggraini, S.Kom.", nip: "19870512001", position: "Tutor Vokasi & TI", type: "TUTOR", department: "Vokasi Teknologi", baseSalary: 3500000, bankAccount: "1234567890", bankName: "BRI" },
  { id: "e2", name: "Nurul Aini, S.Pd., M.Hum.", nip: "19900223002", position: "Tutor Bahasa & Literasi", type: "TUTOR", department: "Bahasa & Literasi", baseSalary: 3800000, bankAccount: "0987654321", bankName: "BNI" },
  { id: "e3", name: "Ahmad Fauzi, S.Sn.", nip: "19850819003", position: "Tutor Desain Grafis", type: "TUTOR", department: "Vokasi Kreatif", baseSalary: 3200000, bankAccount: "1122334455", bankName: "Mandiri" },
  { id: "e4", name: "Rian Pratama, S.E.", nip: "19910305004", position: "Tutor Kewirausahaan", type: "TUTOR", department: "Vokasi Kuliner", baseSalary: 3000000, bankAccount: "5544332211", bankName: "BCA" },
  { id: "e5", name: "Sari Wulandari", nip: "19920710005", position: "Staf Administrasi", type: "KARYAWAN", department: "Tata Usaha", baseSalary: 2800000, bankAccount: "6677889900", bankName: "BRI" },
  { id: "e6", name: "Budi Hartono", nip: "19880415006", position: "Kepala Tata Usaha", type: "KARYAWAN", department: "Manajemen", baseSalary: 4500000, bankAccount: "9900112233", bankName: "Mandiri" },
];

// SEED_SLIPS removed for real DB integration
const SEED_SLIPS: SalarySlip[] = [];

function formatRupiah(n: number) { return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0}).format(n); }
function calcGross(s: SalarySlip) { return s.baseSalary + s.allowances.reduce((t,a) => t+a.amount,0); }
function calcDed(s: SalarySlip) { return s.deductions.reduce((t,d) => t+d.amount,0); }
function calcNet(s: SalarySlip) { return calcGross(s) - calcDed(s); }

function SlipPreview({slip,employee,onClose}:{slip:SalarySlip;employee:Employee;onClose:()=>void}) {
  return (
    <>
      {/* ── Print CSS: sembunyikan semua kecuali #print-slip ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-slip, #print-slip * { visibility: visible !important; }
          #print-slip {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: white !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Overlay Modal */}
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print-overlay">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto">

          {/* Modal Toolbar — disembunyikan saat print */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600"/>Preview Slip Gaji
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={()=>window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition"
              >
                <Printer className="w-3.5 h-3.5"/>Cetak / PDF
              </button>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                <X className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* ── SLIP CONTENT (yang dicetak) ── */}
          <div id="print-slip" className="p-8 text-xs space-y-4 bg-white">

            {/* KOP LEMBAGA */}
            <div className="flex items-center justify-between border-b-2 border-slate-700 pb-4">
              {/* Logo + Identitas */}
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Logo PKBM Askara"
                    width={64}
                    height={64}
                    className="object-contain"
                    style={{printColorAdjust:"exact"}}
                  />
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 leading-tight">PKBM ASKARA</h1>
                  <p className="text-slate-600 text-[11px] leading-snug mt-0.5">
                    Jl. Adiflora Raya No. 8, Kel. Rancabolan, Kec. Gedebage
                  </p>
                  <p className="text-slate-600 text-[11px]">Kota Bandung</p>
                  <p className="text-slate-600 text-[11px]">Telp: (022) 875 18584 · NPSN: P999876</p>
                </div>
              </div>
              {/* Label Slip + Periode */}
              <div className="text-right shrink-0">
                <div className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-extrabold tracking-widest">
                  SLIP GAJI
                </div>
                <p className="text-slate-600 mt-2 text-xs">
                  Periode: <strong>{MONTHS_ID[slip.month-1]} {slip.year}</strong>
                </p>
                {slip.issuedDate && (
                  <p className="text-slate-400 text-[11px]">
                    Diterbitkan:{" "}
                    {new Date(slip.issuedDate).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}
                  </p>
                )}
              </div>
            </div>

            {/* DATA PEGAWAI */}
            <div className="border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-2.5">
              <div><p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Nama Pegawai</p><p className="font-bold text-slate-900">{employee.name}</p></div>
              <div><p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">NIP</p><p className="font-bold font-mono text-slate-900">{employee.nip}</p></div>
              <div><p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Jabatan</p><p className="font-semibold text-slate-700">{employee.position}</p></div>
              <div><p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Bidang / Divisi</p><p className="font-semibold text-slate-700">{employee.department}</p></div>
              {employee.bankAccount && <>
                <div><p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Bank</p><p className="font-semibold text-slate-700">{employee.bankName}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">No. Rekening</p><p className="font-mono font-bold text-slate-900">{employee.bankAccount}</p></div>
              </>}
            </div>

            {/* KOMPONEN GAJI */}
            <div className="grid grid-cols-2 gap-4">
              {/* Pendapatan */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3"/>Pendapatan
                </p>
                <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50">
                      <td className="px-2.5 py-1.5 text-slate-600">Gaji Pokok</td>
                      <td className="px-2.5 py-1.5 text-right font-semibold text-slate-800">{formatRupiah(slip.baseSalary)}</td>
                    </tr>
                    {slip.allowances.map((a,i)=>(
                      <tr key={i}>
                        <td className="px-2.5 py-1.5 text-slate-600">{a.label}</td>
                        <td className="px-2.5 py-1.5 text-right font-semibold text-slate-800">{formatRupiah(a.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-emerald-300">
                      <td className="px-2.5 py-2 font-bold text-emerald-800">Total Pendapatan</td>
                      <td className="px-2.5 py-2 text-right font-extrabold text-emerald-800">{formatRupiah(calcGross(slip))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Potongan */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800 mb-1.5 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3"/>Potongan
                </p>
                <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                  <tbody className="divide-y divide-slate-100">
                    {slip.deductions.length===0
                      ? <tr><td className="px-2.5 py-1.5 text-slate-400 italic" colSpan={2}>Tidak ada potongan</td></tr>
                      : slip.deductions.map((d,i)=>(
                          <tr key={i} className="bg-slate-50">
                            <td className="px-2.5 py-1.5 text-slate-600">{d.label}</td>
                            <td className="px-2.5 py-1.5 text-right font-semibold text-rose-700">{formatRupiah(d.amount)}</td>
                          </tr>
                        ))
                    }
                    <tr className="border-t-2 border-rose-300">
                      <td className="px-2.5 py-2 font-bold text-rose-800">Total Potongan</td>
                      <td className="px-2.5 py-2 text-right font-extrabold text-rose-800">{formatRupiah(calcDed(slip))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TAKE HOME PAY — clean border, no dark background */}
            <div className="border-2 border-slate-700 rounded-lg px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Gaji Bersih Diterima (Take Home Pay)</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{formatRupiah(calcNet(slip))}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  Ditransfer ke {employee.bankName || "—"} No. {employee.bankAccount || "—"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-slate-600"/>
              </div>
            </div>

            {/* CATATAN */}
            {slip.notes && (
              <div className="border border-amber-300 rounded-lg p-3">
                <p className="font-bold text-amber-800 text-[11px]">Catatan:</p>
                <p className="text-amber-700 mt-0.5">{slip.notes}</p>
              </div>
            )}

            {/* TANDA TANGAN */}
            <div className="grid grid-cols-2 gap-8 pt-2">
              <div className="text-center">
                <p className="text-slate-500 mb-16">Penerima Gaji,</p>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-800">{employee.name}</p>
                  <p className="text-slate-500 text-[11px]">NIP: {employee.nip}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-slate-500 mb-16">Kepala PKBM Askara,</p>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-800">__________________</p>
                  <p className="text-slate-500 text-[11px]">NIP: ________________</p>
                </div>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
              Dokumen ini diterbitkan secara elektronik oleh Sistem PKBM Askara — {new Date().getFullYear()}
            </p>
          </div>
          {/* end #print-slip */}
        </div>
      </div>
    </>
  );
}

export default function SlipGajiPage() {
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  
  const fetchSlips = async () => {
    try {
      const res = await fetch("/api/keuangan/slip-gaji");
      const data = await res.json();
      if (data.success) setSlips(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchSlips();
  }, []);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"SEMUA"|EmployeeType>("SEMUA");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth()+1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState<{slip:SalarySlip;employee:Employee}|null>(null);

  const emptyForm = { employeeId: EMPLOYEES[0].id, month: new Date().getMonth()+1, year: new Date().getFullYear(), baseSalary: "", allowances: [{label:"Tunjangan Transport",amount:""}] as {label:string;amount:string|number}[], deductions: [{label:"BPJS Kesehatan",amount:""}] as {label:string;amount:string|number}[], notes: "" };
  const [form, setForm] = useState(emptyForm);
  const formEmp = EMPLOYEES.find(e=>e.id===form.employeeId);

  const filtered = slips.filter(s=>{
    const emp = EMPLOYEES.find(e=>e.id===s.employeeId); if(!emp) return false;
    return (filterType==="SEMUA"||emp.type===filterType) && s.month===filterMonth && s.year===filterYear && (!search||emp.name.toLowerCase().includes(search.toLowerCase())||emp.position.toLowerCase().includes(search.toLowerCase()));
  });

  const addRow = (f:"allowances"|"deductions") => setForm(p=>({...p,[f]:[...p[f],{label:"",amount:""}]}));
  const removeRow = (f:"allowances"|"deductions",i:number) => setForm(p=>({...p,[f]:p[f].filter((_,j)=>j!==i)}));
  const updateRow = (f:"allowances"|"deductions",i:number,k:"label"|"amount",v:string) => setForm(p=>{const r=[...p[f]];r[i]={...r[i],[k]:v};return{...p,[f]:r};});

  const handleCreate = async (e:React.FormEvent) => {
    e.preventDefault();
    const base=parseFloat(String(form.baseSalary))||formEmp?.baseSalary||0;
    
    const newSlip = {
      employeeId:form.employeeId,
      month:form.month,
      year:form.year,
      baseSalary:base,
      allowances:form.allowances.filter(a=>a.label&&Number(a.amount)>0).map(a=>({label:String(a.label),amount:Number(a.amount)})),
      deductions:form.deductions.filter(d=>d.label&&Number(d.amount)>0).map(d=>({label:String(d.label),amount:Number(d.amount)})),
      status:"DRAFT",
      notes:form.notes
    };
    
    try {
      const res = await fetch("/api/keuangan/slip-gaji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSlip)
      });
      if (res.ok) fetchSlips();
    } catch(e) { console.error(e); }
    
    setShowModal(false); setForm(emptyForm);
  };
  
  const handlePublish = async (id: string) => {
    try {
      const res = await fetch("/api/keuangan/slip-gaji", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "DITERBITKAN", issuedDate: new Date().toISOString() })
      });
      if (res.ok) fetchSlips();
    } catch(e) { console.error(e); }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus slip ini?")) return;
    try {
      const res = await fetch(`/api/keuangan/slip-gaji?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchSlips();
    } catch(e) { console.error(e); }
  };

  const pb=Number(form.baseSalary)||formEmp?.baseSalary||0;
  const pa=form.allowances.reduce((s,a)=>s+(Number(a.amount)||0),0);
  const pd=form.deductions.reduce((s,d)=>s+(Number(d.amount)||0),0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/admin/keuangan" className="hover:text-slate-800 transition">Keuangan</Link>
        <ChevronRight className="w-3.5 h-3.5"/>
        <span className="text-purple-700">Slip Gaji</span>
      </div>

      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)"}}/>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2"><Banknote className="w-4 h-4"/>Manajemen Penggajian</div>
            <h1 className="text-2xl sm:text-3xl font-bold">Slip Gaji Karyawan & Tutor</h1>
            <p className="mt-2 text-purple-300 text-sm">Buat, kelola, dan cetak slip gaji bulanan untuk seluruh staf dan tutor PKBM Askara.</p>
          </div>
          <button onClick={()=>{setForm(emptyForm);setShowModal(true);}} className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-white text-purple-900 rounded-xl text-sm font-bold hover:bg-purple-50 transition shadow-sm">
            <Plus className="w-4 h-4"/>Buat Slip Gaji
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
          <CalendarDays className="w-4 h-4 text-slate-400"/>
          <select value={filterMonth} onChange={e=>setFilterMonth(Number(e.target.value))} className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none">
            {MONTHS_ID.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={e=>setFilterYear(Number(e.target.value))} className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none">
            {[2026,2025,2024].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {(["SEMUA","KARYAWAN","TUTOR"] as const).map(t=>(
            <button key={t} onClick={()=>setFilterType(t)} className={`px-3 py-1.5 rounded-lg transition ${filterType===t?"bg-white text-purple-800 font-bold shadow-xs":"text-slate-600 hover:text-slate-900"}`}>
              {t==="SEMUA"?"Semua":t==="KARYAWAN"?"🏢 Karyawan":"🎓 Tutor"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
          <input type="text" placeholder="Cari nama atau jabatan..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"/>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-purple-700">Total Slip Periode Ini</p>
          <p className="text-2xl font-extrabold text-purple-900 mt-1">{filtered.length} Slip</p>
          <p className="text-[11px] text-purple-500 mt-0.5">{MONTHS_ID[filterMonth-1]} {filterYear}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-700">Total Pengeluaran Gaji</p>
          <p className="text-xl font-extrabold text-emerald-900 mt-1">{formatRupiah(filtered.reduce((s,sl)=>s+calcNet(sl),0))}</p>
          <p className="text-[11px] text-emerald-500 mt-0.5">Agregat take-home pay</p>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-sky-700">Slip Diterbitkan</p>
          <p className="text-2xl font-extrabold text-sky-900 mt-1">{filtered.filter(s=>s.status==="DITERBITKAN").length} <span className="text-sm font-bold text-sky-600">/ {filtered.length}</span></p>
          <p className="text-[11px] text-sky-500 mt-0.5">Sudah resmi diterbitkan</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-purple-600"/>Daftar Slip Gaji — {MONTHS_ID[filterMonth-1]} {filterYear}</h2>
          <span className="text-xs text-slate-400">{filtered.length} slip</span>
        </div>
        {filtered.length===0 ? (
          <div className="py-16 text-center">
            <Banknote className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
            <p className="text-sm font-bold text-slate-500">Belum ada slip gaji untuk periode ini</p>
            <p className="text-xs text-slate-400 mt-1">Klik "Buat Slip Gaji" untuk mulai</p>
            <button onClick={()=>setShowModal(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-600 transition"><Plus className="w-4 h-4"/>Buat Slip Gaji</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(slip=>{
              const emp=EMPLOYEES.find(e=>e.id===slip.employeeId)!;
              return (
                <div key={slip.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${emp.type==="TUTOR"?"bg-indigo-100 text-indigo-700":"bg-purple-100 text-purple-700"}`}>
                      {emp.type==="TUTOR"?<GraduationCap className="w-5 h-5"/>:<Building2 className="w-5 h-5"/>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{emp.name}</p>
                      <p className="text-xs text-slate-500 truncate">{emp.position} · NIP {emp.nip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 text-xs shrink-0">
                    <div className="text-center hidden md:block"><p className="text-slate-400 text-[11px] font-semibold">Bruto</p><p className="font-bold text-slate-700 mt-0.5">{formatRupiah(calcGross(slip))}</p></div>
                    <div className="text-center hidden md:block"><p className="text-slate-400 text-[11px] font-semibold">Potongan</p><p className="font-bold text-rose-600 mt-0.5">−{formatRupiah(calcDed(slip))}</p></div>
                    <div className="text-center"><p className="text-slate-400 text-[11px] font-semibold">Take Home</p><p className="font-extrabold text-emerald-700 text-sm mt-0.5">{formatRupiah(calcNet(slip))}</p></div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${slip.status==="DITERBITKAN"?"bg-emerald-100 text-emerald-800 border-emerald-200":"bg-amber-100 text-amber-800 border-amber-200"}`}>
                      {slip.status==="DITERBITKAN"?"✓ Terbit":"○ Draft"}
                    </span>
                    <button title="Preview & Cetak" onClick={()=>setPreview({slip,employee:emp})} className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"><Eye className="w-4 h-4"/></button>
                    {slip.status==="DRAFT"&&<button title="Terbitkan" onClick={()=>handlePublish(slip.id)} className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"><CheckCircle2 className="w-4 h-4"/></button>}
                    <button title="Hapus" onClick={()=>handleDelete(slip.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-purple-600"/>Data Pegawai ({EMPLOYEES.length} Orang)</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left">Nama</th><th className="px-3 py-3 text-left">NIP</th><th className="px-3 py-3 text-left">Jabatan</th><th className="px-3 py-3 text-left">Tipe</th><th className="px-3 py-3 text-right">Gaji Pokok</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {EMPLOYEES.map(emp=>(
                <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 font-bold text-slate-800">{emp.name}</td>
                  <td className="px-3 py-3 font-mono text-slate-500">{emp.nip}</td>
                  <td className="px-3 py-3 text-slate-600">{emp.position}</td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.type==="TUTOR"?"bg-indigo-100 text-indigo-800":"bg-purple-100 text-purple-800"}`}>{emp.type}</span></td>
                  <td className="px-3 py-3 text-right font-bold text-slate-700">{formatRupiah(emp.baseSalary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal&&(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-purple-50/50 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center"><Banknote className="w-5 h-5"/></div>
                <div><h2 className="text-sm font-bold text-slate-900">Buat Slip Gaji Baru</h2><p className="text-[11px] text-slate-500">Isi komponen gaji, tunjangan, dan potongan</p></div>
              </div>
              <button onClick={()=>setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pegawai <span className="text-rose-500">*</span></label>
                <select value={form.employeeId} onChange={e=>{const emp=EMPLOYEES.find(x=>x.id===e.target.value);setForm(p=>({...p,employeeId:e.target.value,baseSalary:String(emp?.baseSalary||"")}));}} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50" required>
                  {EMPLOYEES.map(e=><option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
                </select>
                {formEmp&&<p className="text-[11px] text-slate-400 mt-1"><span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1 ${formEmp.type==="TUTOR"?"bg-indigo-100 text-indigo-700":"bg-purple-100 text-purple-700"}`}>{formEmp.type}</span>{formEmp.department} · {formEmp.bankName} {formEmp.bankAccount}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-bold text-slate-700 mb-1">Bulan</label><select value={form.month} onChange={e=>setForm(p=>({...p,month:Number(e.target.value)}))} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50">{MONTHS_ID.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select></div>
                <div><label className="block font-bold text-slate-700 mb-1">Tahun</label><select value={form.year} onChange={e=>setForm(p=>({...p,year:Number(e.target.value)}))} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50">{[2026,2025,2024].map(y=><option key={y} value={y}>{y}</option>)}</select></div>
              </div>
              <div><label className="block font-bold text-slate-700 mb-1">Gaji Pokok (Rp) <span className="text-rose-500">*</span></label><input type="number" value={form.baseSalary} onChange={e=>setForm(p=>({...p,baseSalary:e.target.value}))} placeholder={`Standar: ${formatRupiah(formEmp?.baseSalary||0)}`} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50" required/></div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className="font-bold text-emerald-700 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/>Tunjangan & Tambahan</label><button type="button" onClick={()=>addRow("allowances")} className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 hover:text-emerald-800 transition"><Plus className="w-3.5 h-3.5"/>Tambah</button></div>
                <div className="space-y-2">{form.allowances.map((a,i)=><div key={i} className="flex items-center gap-2"><input type="text" placeholder="Nama tunjangan" value={a.label} onChange={e=>updateRow("allowances",i,"label",e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"/><input type="number" placeholder="Nominal" value={a.amount} onChange={e=>updateRow("allowances",i,"amount",e.target.value)} className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"/><button type="button" onClick={()=>removeRow("allowances",i)} className="p-1 text-slate-400 hover:text-rose-500 transition"><Minus className="w-3.5 h-3.5"/></button></div>)}</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className="font-bold text-rose-700 flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5"/>Potongan</label><button type="button" onClick={()=>addRow("deductions")} className="text-[11px] text-rose-600 font-bold flex items-center gap-1 hover:text-rose-700 transition"><Plus className="w-3.5 h-3.5"/>Tambah</button></div>
                <div className="space-y-2">{form.deductions.map((d,i)=><div key={i} className="flex items-center gap-2"><input type="text" placeholder="Nama potongan" value={d.label} onChange={e=>updateRow("deductions",i,"label",e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"/><input type="number" placeholder="Nominal" value={d.amount} onChange={e=>updateRow("deductions",i,"amount",e.target.value)} className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"/><button type="button" onClick={()=>removeRow("deductions",i)} className="p-1 text-slate-400 hover:text-rose-500 transition"><Minus className="w-3.5 h-3.5"/></button></div>)}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[10px] text-slate-400 font-semibold uppercase">Bruto</p><p className="text-sm font-extrabold text-slate-700 mt-0.5">{formatRupiah(pb+pa)}</p></div>
                <div><p className="text-[10px] text-rose-400 font-semibold uppercase">Potongan</p><p className="text-sm font-extrabold text-rose-600 mt-0.5">−{formatRupiah(pd)}</p></div>
                <div><p className="text-[10px] text-emerald-600 font-semibold uppercase">Take Home</p><p className="text-sm font-extrabold text-emerald-700 mt-0.5">{formatRupiah(pb+pa-pd)}</p></div>
              </div>
              <div><label className="block font-bold text-slate-700 mb-1">Catatan (opsional)</label><textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Catatan khusus..." rows={2} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 resize-none"/></div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">Batal</button>
                <button type="submit" className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"><Save className="w-3.5 h-3.5"/>Simpan Slip Gaji</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {preview&&<SlipPreview slip={preview.slip} employee={preview.employee} onClose={()=>setPreview(null)}/>}
    </div>
  );
}
