import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-soft border border-slate-200/80 p-8 md:p-12">
        <div className="flex items-center space-x-3 mb-8">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Kebijakan Privasi</h1>
        </div>

        <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-6">
          <p>
            <strong>Terakhir Diperbarui: 17 Agustus 2026</strong>
          </p>

          <p>
            Selamat datang di Sistem Informasi Terpadu PKBM Askara. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda berikan kepada kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat Anda menggunakan webapp kami.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6">1. Informasi yang Kami Kumpulkan</h3>
          <p>
            Kami mengumpulkan informasi yang Anda berikan secara langsung saat pendaftaran, seperti nama lengkap, alamat email, nomor telepon, Nomor Induk Kependudukan (NIK), Nomor Induk Siswa Nasional (NISN), alamat rumah, dan data akademik lainnya yang relevan dengan keperluan pendaftaran dan kegiatan belajar mengajar di PKBM Askara.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6">2. Penggunaan Informasi</h3>
          <p>Data pribadi yang kami kumpulkan digunakan untuk:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Memproses pendaftaran siswa baru dan memverifikasi identitas.</li>
            <li>Mengelola akun pengguna (Siswa, Orang Tua, Pendidik, Admin).</li>
            <li>Memfasilitasi kegiatan belajar mengajar (LMS), absensi (Presensi), ujian (CBT), dan rapor.</li>
            <li>Menghubungi Anda terkait pengumuman, tagihan keuangan, atau informasi penting lainnya.</li>
            <li>Memenuhi kewajiban pelaporan administratif kepada instansi pendidikan terkait (Dinas Pendidikan/Kemdikbud).</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 mt-6">3. Keamanan Data</h3>
          <p>
            Kami menerapkan standar keamanan industri untuk melindungi data Anda dari akses, perubahan, atau penghancuran yang tidak sah. Password Anda disimpan menggunakan enkripsi hashing satu arah (bcrypt). Data dikirim menggunakan protokol aman (HTTPS/SSL).
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6">4. Berbagi Informasi dengan Pihak Ketiga</h3>
          <p>
            Kami <strong>tidak menjual, menyewakan, atau menukar</strong> data pribadi Anda kepada pihak ketiga manapun untuk tujuan pemasaran. Data Anda hanya akan dibagikan jika diwajibkan oleh hukum atau instruksi resmi dari kementerian pendidikan (misalnya sinkronisasi Dapodik).
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6">5. Hubungi Kami</h3>
          <p>
            Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini atau ingin meminta penghapusan/perubahan data Anda, silakan hubungi tim administrasi kami di <strong>admin@askara.sch.id</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
