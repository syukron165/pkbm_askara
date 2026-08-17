// 16 Standard Letter Category Codes based on PRD v1.0
export type LetterCategoryCode =
  | "SK"
  | "SU"
  | "SPm"
  | "SPb"
  | "SPp"
  | "SPn"
  | "SM"
  | "ST"
  | "SKet"
  | "SR"
  | "SB"
  | "SPPD"
  | "SRT"
  | "PK"
  | "SPeng"
  | "SKy";

export interface LetterCategoryMeta {
  code: LetterCategoryCode;
  name: string;
  description: string;
  defaultGroup: "SURAT_KELUAR" | "SK_LEMBAGA";
}

export const LETTER_CATEGORIES: LetterCategoryMeta[] = [
  { code: "SK", name: "Surat Keputusan", description: "Penunjukan operator, pengangkatan tutor, penetapan kelulusan", defaultGroup: "SK_LEMBAGA" },
  { code: "SU", name: "Surat Undangan", description: "Undangan rapat orang tua murid, evaluasi kelulusan", defaultGroup: "SURAT_KELUAR" },
  { code: "SPm", name: "Surat Permohonan", description: "Permohonan bantuan dana, izin tempat, kerja sama", defaultGroup: "SURAT_KELUAR" },
  { code: "SPb", name: "Surat Pemberitahuan", description: "Pemberitahuan Ujian ASAT/Pasca-KBM, libur sekolah", defaultGroup: "SURAT_KELUAR" },
  { code: "SPp", name: "Surat Peminjaman", description: "Peminjaman gedung/sarpras ke pihak eksternal", defaultGroup: "SURAT_KELUAR" },
  { code: "SPn", name: "Surat Pernyataan", description: "Pernyataan aktif KBM, keabsahan data registrasi, izin operasional", defaultGroup: "SURAT_KELUAR" },
  { code: "SM", name: "Surat Mandat", description: "Pemberian wewenang perwakilan kegiatan dinas", defaultGroup: "SURAT_KELUAR" },
  { code: "ST", name: "Surat Tugas", description: "Penugasan tutor/staf untuk KBM, workshop, pelatihan", defaultGroup: "SURAT_KELUAR" },
  { code: "SKet", name: "Surat Keterangan", description: "Keterangan aktif siswa, kelakuan baik, pengalaman kerja tutor", defaultGroup: "SURAT_KELUAR" },
  { code: "SR", name: "Surat Rekomendasi", description: "Rekomendasi beasiswa atau kelanjutan studi siswa", defaultGroup: "SURAT_KELUAR" },
  { code: "SB", name: "Surat Balasan", description: "Jawaban atas surat masuk dari instansi luar", defaultGroup: "SURAT_KELUAR" },
  { code: "SPPD", name: "Surat Perintah Perjalanan Dinas", description: "Perjalanan operasional luar kota staf/guru", defaultGroup: "SURAT_KELUAR" },
  { code: "SRT", name: "Sertifikat", description: "Sertifikat pelatihan, workshop, atau apresiasi siswa", defaultGroup: "SURAT_KELUAR" },
  { code: "PK", name: "Perjanjian Kerja", description: "Kontrak kerja tutor/staf operasional", defaultGroup: "SURAT_KELUAR" },
  { code: "SPeng", name: "Surat Pengantar", description: "Pengantar berkas administrasi ke Dinas Pendidikan", defaultGroup: "SURAT_KELUAR" },
  { code: "SKy", name: "Surat Keputusan Yayasan", description: "SK tingkat Yayasan Cakrawala Askara Nusantara", defaultGroup: "SK_LEMBAGA" },
];

export interface LetterItem {
  id: string;
  letterNumber: string;
  categoryCode: LetterCategoryCode;
  category: "SURAT_KELUAR" | "SURAT_MASUK" | "SK_LEMBAGA";
  title: string;
  recipient: string;
  recipientDetails?: string;
  date: string;
  contentData: Record<string, any>;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  signerName: string;
  signerRole: string;
  signerNip?: string;
  qrVerificationCode: string;
  // Incoming letter specific fields
  sourceNumber?: string;
  sender?: string;
  receivedDate?: string;
  disposition?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
