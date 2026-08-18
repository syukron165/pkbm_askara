"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  QrCode,
  User,
  Phone,
  Building2,
  MapPin,
  ChevronDown,
  Camera,
  CheckCircle2,
  LogOut,
  Send,
  ArrowLeft,
  Clock,
} from "lucide-react";

const PURPOSES = [
  "Konsultasi PPDB",
  "Kunjungan Orang Tua Siswa",
  "Kunjungan Dinas / Instansi",
  "Pertemuan dengan Staf",
  "Vendor / Supplier",
  "Interview / Rekrutmen",
  "Lainnya",
];

const PURPOSE_CATEGORIES: Record<string, string> = {
  "Konsultasi PPDB": "PPDB",
  "Kunjungan Orang Tua Siswa": "KONSULTASI",
  "Kunjungan Dinas / Instansi": "KUNJUNGAN_DINAS",
  "Pertemuan dengan Staf": "KONSULTASI",
  "Vendor / Supplier": "VENDOR",
  "Interview / Rekrutmen": "LAINNYA",
  "Lainnya": "LAINNYA",
};

const STAFF_LIST = [
  "Kepala Sekolah",
  "Wakil Kepala Sekolah",
  "Koordinator Akademik",
  "Staff Administrasi",
  "Tim Keuangan",
  "Guru / Tutor",
  "Lainnya",
];

type EBadgeData = {
  visitId: string;
  eBadgeToken: string;
  fullName: string;
  checkInAt: string;
  branchName: string;
  visitedPerson: string;
};

export default function TamuCheckInPage() {
  const routeParams = useParams();
  const branchCode = (routeParams?.branchCode as string) || "PKBM-PUSAT";
  const branchNames: Record<string, string> = {
    "PKBM-PUSAT": "PKBM Askara — Kantor Pusat",
    "PKBM-CAB1": "PKBM Askara — Cabang 1",
    "PKBM-CAB2": "PKBM Askara — Cabang 2",
  };
  const branchName = branchNames[branchCode] || "PKBM Askara";

  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [badge, setBadge] = useState<EBadgeData | null>(null);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    institution: "",
    email: "",
    purpose: "",
    visitedPerson: "",
    visitedDept: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Nama wajib diisi";
    if (!form.phone.trim()) errs.phone = "Nomor telepon wajib diisi";
    else if (!/^(\+62|62|0)8[0-9]{8,11}$/.test(form.phone.replace(/\s/g, "")))
      errs.phone = "Format nomor HP tidak valid";
    if (!form.purpose.trim()) errs.purpose = "Keperluan wajib diisi";
    return errs;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      let uploadedPhotoUrl = "";
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/upload?folder=tamu", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedPhotoUrl = uploadData.url;
        }
      }

      const res = await fetch("/api/buku-tamu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branchCode,
          branchName,
          purposeCategory: PURPOSE_CATEGORIES[form.purpose] || "LAINNYA",
          photoUrl: uploadedPhotoUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBadge(data);
        setStep("success");
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleCheckout = async () => {
    if (!badge) return;
    try {
      await fetch("/api/buku-tamu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eBadgeToken: badge.eBadgeToken, action: "CHECK_OUT" }),
      });
      setCheckoutDone(true);
    } catch (e) { console.error(e); }
  };

  if (step === "success" && badge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {checkoutDone ? (
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-10 h-10 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Terima Kasih!</h2>
              <p className="text-slate-500 mt-2 text-sm">Kunjungan Anda telah dicatat. Semoga hari Anda menyenangkan!</p>
              <div className="mt-4 text-xs text-slate-400">Check-out berhasil pada {new Date().toLocaleTimeString("id-ID")} WIB</div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* e-Badge Header */}
              <div className="bg-gradient-to-r from-cyan-700 to-slate-900 p-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                  {badge.fullName.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">{badge.fullName}</h2>
                <p className="text-cyan-200 text-sm mt-1">Tamu Resmi</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-cyan-50 rounded-xl p-4 text-center border border-cyan-100">
                  <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">e-Pass ID</p>
                  <p className="text-lg font-bold text-cyan-900 font-mono mt-1">{badge.eBadgeToken.slice(-8).toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Check-in</p>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">
                      {new Date(badge.checkInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Lokasi</p>
                    <p className="font-bold text-slate-800 text-xs mt-0.5 truncate">{badge.branchName}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-slate-400">Menemui</p>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">{badge.visitedPerson || "Staf PKBM Askara"}</p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Notifikasi telah dikirim ke staf yang dituju. Mohon menunggu di area resepsionis.
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-semibold text-sm hover:bg-slate-900 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Check-Out (Selesai Berkunjung)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Buku Tamu Digital</h1>
          <p className="text-cyan-300 text-sm mt-1">{branchName}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-700 to-slate-800 px-6 py-4">
            <p className="text-white font-semibold text-sm">Formulir Check-in Tamu</p>
            <p className="text-cyan-200 text-xs mt-0.5">Isi data diri untuk mendapatkan e-Pass kunjungan</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Nama sesuai KTP"
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.fullName ? "border-red-400" : "border-slate-200"}`}
                />
              </div>
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>

            {/* No HP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor HP / WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.phone ? "border-red-400" : "border-slate-200"}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Instansi & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Instansi / Perusahaan</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    placeholder="Nama instansi"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@domain.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Keperluan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Maksud & Keperluan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className={`w-full pl-3 pr-8 py-2.5 border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.purpose ? "border-red-400" : "border-slate-200"}`}
                >
                  <option value="">Pilih keperluan...</option>
                  {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.purpose && <p className="text-xs text-red-500 mt-1">{errors.purpose}</p>}
            </div>

            {/* Menemui Siapa */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Menemui</label>
                <div className="relative">
                  <select
                    value={form.visitedPerson}
                    onChange={(e) => setForm({ ...form, visitedPerson: e.target.value })}
                    className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Pilih staf...</option>
                    {STAFF_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Departemen</label>
                <input
                  type="text"
                  value={form.visitedDept}
                  onChange={(e) => setForm({ ...form, visitedDept: e.target.value })}
                  placeholder="Bidang/dept"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Foto swafoto hint */}
            <div 
              onClick={() => photoInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-cyan-400 transition cursor-pointer relative overflow-hidden"
            >
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={photoInputRef}
                onChange={handlePhotoChange}
              />
              {photoPreview ? (
                <div className="relative w-full h-32">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                    <p className="text-white text-xs font-semibold">Ganti Foto</p>
                  </div>
                </div>
              ) : (
                <>
                  <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">Ambil Swafoto / Foto KTP (Opsional)</p>
                  <p className="text-xs text-slate-400">Klik untuk membuka kamera</p>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-slate-700 text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Memproses..." : "Submit & Check-In"}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Data Anda akan disimpan dengan aman sesuai kebijakan privasi PKBM Askara
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
