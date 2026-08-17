"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage({ text: "Token tidak valid atau tidak ditemukan.", type: "error" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: "Kata sandi tidak cocok.", type: "error" });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: "Kata sandi minimal 6 karakter.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Berhasil mengatur kata sandi! Mengalihkan ke halaman login...", type: "success" });
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setMessage({ text: data.error || "Gagal mengatur kata sandi.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Terjadi kesalahan sistem.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
        Token verifikasi tidak ditemukan di URL.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi Baru</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
      </button>
    </form>
  );
}

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-slate-900">
          Buat Kata Sandi Baru
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Silakan masukkan kata sandi baru untuk akun PKBM Askara Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100">
          <Suspense fallback={<div className="text-center text-sm text-slate-500">Memuat...</div>}>
            <SetupPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
