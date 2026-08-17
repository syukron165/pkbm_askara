"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Star,
  RefreshCw,
  Lock,
  Globe,
  Plus,
  X,
  Users,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  RECEIVED: { label: "Diterima", color: "bg-blue-100 text-blue-800", step: 1 },
  UNDER_REVIEW: { label: "Dalam Evaluasi", color: "bg-amber-100 text-amber-800", step: 2 },
  IN_ACTION: { label: "Tindak Lanjut", color: "bg-violet-100 text-violet-800", step: 3 },
  RESOLVED: { label: "Selesai", color: "bg-emerald-100 text-emerald-800", step: 4 },
};

const CATEGORIES = [
  { value: "AKADEMIK", label: "Akademik", emoji: "📚" },
  { value: "FASILITAS_SARPRAS", label: "Fasilitas & Sarpras", emoji: "🏫" },
  { value: "KEUANGAN_ADMINISTRASI", label: "Keuangan & Admin", emoji: "💰" },
  { value: "PELAYANAN_STAF", label: "Pelayanan Staf", emoji: "👥" },
  { value: "EKSTRAKURIKULER", label: "Ekstrakurikuler", emoji: "⭐" },
  { value: "UMUM", label: "Umum", emoji: "💬" },
];

type Ticket = {
  id: string;
  category: string;
  subject: string;
  message: string;
  privacyLevel: string;
  status: string;
  isAnonymous: boolean;
  responseText?: string;
  respondedAt?: string;
  satisfactionRating?: number;
  createdAt: string;
};

export default function AspirasiOrangTuaPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ratingModal, setRatingModal] = useState<{ ticket: Ticket; rating: number } | null>(null);
  const [form, setForm] = useState({
    category: "AKADEMIK",
    subject: "",
    message: "",
    privacyLevel: "PRIVAT",
    isAnonymous: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/aspirasi");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/aspirasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ category: "AKADEMIK", subject: "", message: "", privacyLevel: "PRIVAT", isAnonymous: false });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleRate = async () => {
    if (!ratingModal) return;
    try {
      await fetch("/api/aspirasi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ratingModal.ticket.id, action: "RATE", satisfactionRating: ratingModal.rating }),
      });
      setRatingModal(null);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        onClick={() => interactive && onRate && onRate(i + 1)}
        className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""} w-5 h-5 ${i < rating ? "text-amber-500 fill-amber-500" : "text-slate-200"}`}
      />
    ));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-200 border border-amber-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Portal Wali Murid
          </span>
          <h1 className="text-2xl font-bold">Saran & Masukan Wali Murid</h1>
          <p className="mt-1 text-amber-200 text-sm">
            Sampaikan aspirasi dan masukan Anda demi kualitas pendidikan putra-putri
          </p>
        </div>
        <div className="absolute right-6 top-6 opacity-10">
          <Users className="w-24 h-24" />
        </div>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition shadow-sm"
      >
        <Plus className="w-5 h-5" />
        Kirim Aspirasi / Masukan Baru
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Kirim Aspirasi</h3>
                <p className="text-xs text-slate-500">Sebagai Wali Murid PKBM Askara</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Kategori</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} type="button" onClick={() => setForm({ ...form, category: c.value })}
                      className={`p-3 rounded-xl border-2 text-left text-xs font-medium transition ${form.category === c.value ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-100 hover:border-slate-300 text-slate-600"}`}>
                      <span className="text-lg">{c.emoji}</span>
                      <span className="block mt-1">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Judul *</label>
                <input required type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Ringkasan aspirasi..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Isi Pesan *</label>
                <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4} placeholder="Ceritakan aspirasi Anda..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: "PRIVAT", icon: Lock, title: "Privat", sub: "Hanya manajemen" },
                  { val: "PUBLIK", icon: Globe, title: "Publik", sub: "Komunitas sekolah" },
                ].map((opt) => (
                  <button key={opt.val} type="button" onClick={() => setForm({ ...form, privacyLevel: opt.val })}
                    className={`p-3 rounded-xl border-2 flex items-center gap-2 text-sm font-medium transition ${form.privacyLevel === opt.val ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-100 text-slate-600 hover:border-slate-300"}`}>
                    <opt.icon className="w-4 h-4" />
                    <div className="text-left">
                      <p className="font-semibold text-xs">{opt.title}</p>
                      <p className="text-[10px] text-slate-500">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <button type="button" onClick={() => setForm({ ...form, isAnonymous: !form.isAnonymous })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isAnonymous ? "bg-amber-500" : "bg-slate-200"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${form.isAnonymous ? "translate-x-5" : ""}`} />
                </button>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Kirim Secara Anonim</p>
                  <p className="text-[10px] text-slate-500">Identitas Anda tidak akan ditampilkan</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  {submitting ? "Mengirim..." : "Kirim Aspirasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">Riwayat Aspirasi Saya</h2>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">Belum ada aspirasi</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((t) => {
              const cfg = STATUS_CONFIG[t.status];
              return (
                <div key={t.id} className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">{t.subject}</h3>
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.color}`}>{cfg?.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{new Date(t.createdAt).toLocaleDateString("id-ID")}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{t.message}</p>
                  {t.responseText && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Tanggapan Sekolah:</p>
                      <p className="text-xs text-emerald-800">{t.responseText}</p>
                    </div>
                  )}
                  {t.status === "RESOLVED" && !t.satisfactionRating && (
                    <button onClick={() => setRatingModal({ ticket: t, rating: 0 })}
                      className="mt-3 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl hover:bg-amber-100 transition flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" /> Beri Rating Kepuasan
                    </button>
                  )}
                  {t.satisfactionRating && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Rating:</span>
                      <div className="flex">{renderStars(t.satisfactionRating)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Rating Kepuasan</h3>
            <p className="text-xs text-slate-500 mb-6">Seberapa puas Anda dengan tanggapan sekolah?</p>
            <div className="flex justify-center gap-2 mb-6">
              {renderStars(ratingModal.rating, true, (r) => setRatingModal({ ...ratingModal, rating: r }))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRatingModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Batal</button>
              <button onClick={handleRate} disabled={ratingModal.rating === 0}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50">
                Kirim Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
