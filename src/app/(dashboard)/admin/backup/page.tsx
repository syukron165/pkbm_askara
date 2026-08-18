"use client";

import React, { useState } from "react";
import { Database, Download, FileArchive, CheckCircle2, AlertCircle } from "lucide-react";

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleBackupDB = async () => {
    setDownloading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) throw new Error("Gagal mengunduh backup");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Get filename from header if possible, else use default
      const disposition = response.headers.get("Content-Disposition");
      let filename = "backup.json";
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "");
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: "success", text: "Database berhasil diunduh!" });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Terjadi kesalahan saat membackup database." });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Pusat Cadangan Data (Backup)</h1>
        <p className="mt-1 text-slate-300 text-sm">Amankan data aplikasi dan database secara rutin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Backup */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Database className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Backup Database</h2>
          <p className="text-slate-500 text-sm mt-2 mb-6 flex-1">
            Unduh seluruh data tabel dari Supabase (Prisma) ke dalam satu file JSON. Sangat disarankan dilakukan seminggu sekali.
          </p>
          <button
            onClick={handleBackupDB}
            disabled={downloading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {downloading ? "Memproses..." : "Unduh Backup JSON"}
          </button>
        </div>

        {/* App Source Code Backup */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <FileArchive className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Backup Aplikasi (Source Code)</h2>
          <p className="text-slate-500 text-sm mt-2 mb-6 flex-1">
            Untuk membackup kode sumber aplikasi, buka Terminal / Command Prompt di server atau PC Anda, lalu jalankan script backup.
          </p>
          <div className="w-full p-4 bg-slate-900 rounded-xl text-left border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Windows (PowerShell):</p>
            <code className="text-emerald-400 text-sm font-mono block mb-3">.\scripts\backup.ps1</code>
            <p className="text-xs text-slate-500">File ZIP akan disimpan di dalam folder <span className="font-mono text-slate-300">backups/</span></p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}
    </div>
  );
}
