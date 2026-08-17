import React from "react";
import Link from "next/link";
import { ArrowLeft, FileCheck } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-soft border border-slate-200/80 p-8 md:p-12">
        <div className="flex items-center space-x-3 mb-8">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Syarat & Ketentuan Layanan</h1>
        </div>

        <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-6">
          <p>
            <strong>Terakhir Diperbarui: 17 Agustus 2026</strong>
          </p>

          <p>
            Dengan mengakses dan menggunakan Sistem Informasi Terpadu PKBM Askara, Anda menyatakan setuju untuk terikat oleh Syarat dan Ketentuan berikut. Jika Anda tidak setuju dengan ketentuan ini, Anda tidak diperkenankan menggunakan layanan kami.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6">1. Akses Akun dan Tanggung Jawab</h3>
          <p>
            Anda bertanggung jawab penuh untuk menjaga kerahasiaan kredensial akun Anda (email dan password). Segala aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda sepenuhnya. Kami berhak untuk menonaktifkan akun yang melanggar aturan atau menyalahgunakan sistem.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6">2. Penggunaan Layanan yang Dilarang</h3>
          <p>Saat menggunakan aplikasi ini, Anda dilarang keras untuk:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Memalsukan data identitas atau dokumen pendukung saat mendaftar SPMB.</li>
            <li>Mendistribusikan virus, malware, atau kode berbahaya lainnya ke dalam sistem (termasuk modul unggah tugas/materi).</li>
            <li>Melakukan kecurangan saat ujian CBT online (Computer Based Test).</li>
            <li>Mencoba mengeksploitasi celah keamanan aplikasi (seperti SQL Injection, XSS, CSRF). Segala upaya peretasan akan dilaporkan kepada pihak berwajib.</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 mt-6">3. Hak Kekayaan Intelektual</h3>
          <p>
            Seluruh materi pembelajaran, modul, soal ujian, dan aset digital yang ada di platform LMS PKBM Askara adalah hak cipta milik PKBM Askara atau pendidik terkait. Dilarang menggandakan, mempublikasikan ulang, atau memperjualbelikan materi tanpa izin tertulis.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6">4. Transaksi & Keuangan</h3>
          <p>
            Pembayaran SPP atau biaya pendaftaran yang diunggah melalui sistem akan diverifikasi oleh bagian administrasi. Pemalsuan bukti transfer adalah tindakan ilegal. Bukti pembayaran fisik harap disimpan sebagai arsip validasi.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6">5. Perubahan Layanan & Ketentuan</h3>
          <p>
            PKBM Askara berhak mengubah atau memperbarui layanan serta Syarat & Ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Pengguna diharapkan memeriksa halaman ini secara berkala.
          </p>
        </div>
      </div>
    </div>
  );
}
