import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  LetterCategoryCode,
  LetterItem,
  LETTER_CATEGORIES,
  ROMAN_MONTHS,
} from "@/lib/surat-constants";

let letterStore: LetterItem[] = [
  // 1. SK Penunjukan Operator PKBM (Sesuai Referensi PDF User)
  {
    id: "srt-sk-operator-001",
    letterNumber: "048/SK/PKBM-AK/VII/2026",
    categoryCode: "SK",
    category: "SK_LEMBAGA",
    title: "Surat Keputusan Kepala PKBM Askara Tentang Penunjukan Operator PKBM Askara Tahun Ajaran 2026/2027",
    recipient: "Ihsan Fadilah, S.TP",
    recipientDetails: "Operator PKBM Askara",
    date: "2026-07-13",
    contentData: {
      templateType: "SK",
      tentang: "PENUNJUKAN OPERATOR PKBM ASKARA",
      tahunAjaran: "TAHUN AJARAN 2026/2027",
      menimbang: [
        "bahwa dalam rangka menunjang kelancaran pengelolaan administrasi, data pokok pendidikan (Dapodik/PDSP), dan sistem informasi pembelajaran di PKBM Askara, dipandang perlu menunjuk seorang Operator PKBM;",
        "bahwa untuk kepentingan sebagaimana dimaksud pada huruf a, dipandang perlu menetapkan Surat Keputusan Kepala PKBM Askara tentang Penunjukan Operator PKBM Askara.",
      ],
      mengingat: [
        "Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
        "Peraturan Menteri Pendidikan Dasar dan Menengah Nomor 13 Tahun 2025 tentang Kurikulum Merdeka;",
        "Keputusan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 262/M/2022;",
        "Ketentuan Data Pokok Pendidikan (Dapodik) dan Pangkalan Data Sekolah dan Pendidikan (PDSP) Kementerian Pendidikan;",
        "Struktur organisasi dan kebutuhan operasional PKBM Askara.",
      ],
      kesatuNama: "Ihsan Fadilah, S.TP",
      kesatuJabatan: "Operator PKBM Askara",
      kesatuUnitKerja: "PKBM Askara",
      keduaPeriode: "Sebagai Operator PKBM Askara terhitung mulai tanggal 13 Juli 2026 sampai dengan 12 Juli 2027.",
      ketigaTugas: "Operator sebagaimana dimaksud pada diktum KESATU bertugas melaksanakan pengelolaan data pokok pendidikan (input dan pemutakhiran Dapodik/PDSP), pengelolaan basis data siswa dan staf pada sistem informasi, serta administrasi sistem informasi PKBM Askara lainnya, sebagaimana diuraikan lebih lanjut dalam Surat Tugas yang menyertai Surat Keputusan ini.",
      keempatBiaya: "Segala biaya yang timbul akibat pelaksanaan tugas ini dibebankan pada anggaran operasional PKBM Askara.",
      kelimaPenutup: "Surat Keputusan ini mulai berlaku sejak tanggal ditetapkan, dengan ketentuan apabila di kemudian hari terdapat kekeliruan dalam penetapan ini akan diadakan perbaikan sebagaimana mestinya.",
      ditetapkanDi: "Bandung",
      tanggalPenetapan: "13 Juli 2026",
    },
    status: "PUBLISHED",
    signerName: "Arif Syarifudin, S.Pd",
    signerRole: "Kepala PKBM Askara",
    signerNip: "",
    qrVerificationCode: "VRF-SK-2026-048",
    createdAt: new Date("2026-07-13T08:00:00Z").toISOString(),
  },

  // 2. Surat Keterangan Pengalaman Kerja Tutor (SKet)
  {
    id: "srt-sket-kerja-002",
    letterNumber: "049/SKet/PKBM-AK/VIII/2026",
    categoryCode: "SKet",
    category: "SURAT_KELUAR",
    title: "Surat Keterangan Pengalaman Kerja Tutor / Tenaga Pendidik",
    recipient: "Susanti Kartikasari, S.Pd.",
    recipientDetails: "Tutor Bahasa Inggris Pendidikan Kesetaraan",
    date: "2026-08-10",
    contentData: {
      templateType: "SKET_PENGALAMAN_KERJA",
      teacherName: "Susanti Kartikasari, S.Pd.",
      nik: "3273105508890003",
      address: "Jl. Soekarno Hatta No. 420, Bandung",
      position: "Tutor / Pendidik Mata Pelajaran Bahasa Inggris",
      periodStart: "01 Juli 2021",
      periodEnd: "30 Juni 2026",
      recommendation: "Selama bekerja pada PKBM Askara, yang bersangkutan telah menunjukkan dedikasi, integritas, dan kinerja yang sangat baik dalam mengajar dan membimbing warga belajar.",
      purpose: "Kelengkapan berkas administrasi portofolio sertifikasi pendidik / instansi terkait.",
      ditetapkanDi: "Bandung",
      tanggalPenetapan: "10 Agustus 2026",
    },
    status: "PUBLISHED",
    signerName: "Arif Syarifudin, S.Pd",
    signerRole: "Kepala PKBM Askara",
    signerNip: "19750914 200003 2 001",
    qrVerificationCode: "VRF-SKET-2026-049",
    createdAt: new Date("2026-08-10T09:00:00Z").toISOString(),
  },

  // 3. Surat Undangan Rapat Orang Tua / Wali Murid (SU)
  {
    id: "srt-su-undangan-003",
    letterNumber: "029/SU/PKBM-AK/VIII/2026",
    categoryCode: "SU",
    category: "SURAT_KELUAR",
    title: "Surat Undangan Rapat Evaluasi Belajar & Sosialisasi e-Rapor Digital",
    recipient: "Bapak/Ibu Orang Tua / Wali Murid Warga Belajar",
    recipientDetails: "Peserta Didik Paket A, Paket B, dan Paket C",
    date: "2026-08-15",
    contentData: {
      templateType: "UNDANGAN_JADWAL",
      openingSalam: "Bismillahirrohmanirrohim, Segala puji bagi Allah SWT yang senantiasa melimpahkan rahmat-Nya kepada kita semua.",
      bodyParagraph: "Dalam rangka meningkatkan mutu pembelajaran dan menyelaraskan evaluasi capaian hasil belajar siswa Semester Ganjil 2026/2027, kami mengundang Bapak/Ibu hadir pada pertemuan koordinasi yang akan dilaksanakan pada:",
      schedules: [
        { dayDate: "Sabtu, 29 Agustus 2026", time: "09.00 - 11.30 WIB", room: "Aula Utama PKBM Askara Gedebage", agenda: "Sosialisasi e-Rapor & CBT Warga Belajar Paket C" },
        { dayDate: "Minggu, 30 Agustus 2026", time: "09.00 - 11.30 WIB", room: "Aula Utama PKBM Askara Gedebage", agenda: "Evaluasi Pembelajaran & Program Vokasi Paket A & B" },
      ],
      closingNotes: "Mengingat pentingnya agenda ini untuk masa depan putra/putri kita, dimohon kehadiran Bapak/Ibu tepat pada waktunya.",
      ditetapkanDi: "Bandung",
      tanggalPenetapan: "15 Agustus 2026",
    },
    status: "PUBLISHED",
    signerName: "Arif Syarifudin, S.Pd",
    signerRole: "Kepala PKBM Askara",
    signerNip: "19750914 200003 2 001",
    qrVerificationCode: "VRF-SU-2026-029",
    createdAt: new Date("2026-08-15T10:00:00Z").toISOString(),
  },

  // 4. Surat Pemberitahuan Pelaksanaan ASAT / CBT (SPb)
  {
    id: "srt-spb-asat-004",
    letterNumber: "007/SPb/PKBM-AK/IX/2026",
    categoryCode: "SPb",
    category: "SURAT_KELUAR",
    title: "Surat Pemberitahuan Pelaksanaan Asesmen Sumatif Akhir Tahun (ASAT) & Ujian CBT Online",
    recipient: "Seluruh Peserta Didik Paket A, B, & C PKBM Askara",
    recipientDetails: "Warga Belajar PKBM Askara",
    date: "2026-09-01",
    contentData: {
      templateType: "PEMBERITAHUAN",
      bodyParagraph: "Diberitahukan kepada seluruh peserta didik bahwa Asesmen Sumatif Akhir Tahun (ASAT) Berbasis Komputer (CBT) Semester Ganjil 2026/2027 akan dilaksanakan mulai tanggal 15 September s.d. 22 September 2026.",
      requirements: [
        "Warga belajar wajib memiliki akun LMS & CBT yang aktif.",
        "Membawa kartu peserta ujian atau kartu tanda warga belajar.",
        "Pelaksanaan ujian bertempat di Lab Komputer PKBM Askara Gedebage atau daring terpantau.",
      ],
      ditetapkanDi: "Bandung",
      tanggalPenetapan: "01 September 2026",
    },
    status: "PUBLISHED",
    signerName: "Arif Syarifudin, S.Pd",
    signerRole: "Kepala PKBM Askara",
    signerNip: "19750914 200003 2 001",
    qrVerificationCode: "VRF-SPB-2026-007",
    createdAt: new Date("2026-09-01T08:00:00Z").toISOString(),
  },

  // 5. Surat Pernyataan Lembaga / Yayasan (SPn) - TTD Ganda
  {
    id: "srt-spn-izin-005",
    letterNumber: "003/SPn/PKBM-AK/VIII/2026",
    categoryCode: "SPn",
    category: "SURAT_KELUAR",
    title: "Surat Pernyataan Keabsahan Dokumen & Kesiapan Operasional Lembaga",
    recipient: "Dinas Pendidikan Kota Bandung & DPMPTSP",
    recipientDetails: "DPMPTSP Kota Bandung",
    date: "2026-08-05",
    contentData: {
      templateType: "PERNYATAAN_YAYASAN",
      foundationName: "Yayasan Cakrawala Askara Nusantara",
      foundationLeader: "Dr. H. Mulyadi Pratama, M.Pd.",
      headmasterName: "Arif Syarifudin, S.Pd",
      npsn: "P9998766",
      permitNumber: "0019/IPSPNFI/IX/2022/DPMTSP",
      statementText: "Menyatakan dengan sesungguhnya bahwa seluruh data sarana prasarana, tenaga pendidik, dan warga belajar yang diajukan untuk perpanjangan izin operasional adalah benar, sah, dan dapat dipertanggungjawabkan sesuai ketentuan peraturan perundang-undangan.",
      isDualSignature: true,
      ditetapkanDi: "Bandung",
      tanggalPenetapan: "05 Agustus 2026",
    },
    status: "PUBLISHED",
    signerName: "Arif Syarifudin, S.Pd",
    signerRole: "Kepala PKBM Askara",
    signerNip: "19750914 200003 2 001",
    qrVerificationCode: "VRF-SPN-2026-003",
    createdAt: new Date("2026-08-05T09:00:00Z").toISOString(),
  },

  // 6. Surat Masuk dari Instansi Eksternal
  {
    id: "srt-masuk-001",
    letterNumber: "421.2/1209-Disdik/VIII/2026",
    sourceNumber: "421.2/1209-Disdik/VIII/2026",
    categoryCode: "SB",
    category: "SURAT_MASUK",
    title: "Undangan Sosialisasi Akreditasi Lembaga Pendidikan Kesetaraan (PKBM) Kota Bandung 2026",
    sender: "Dinas Pendidikan Kota Bandung - Bidang PAUD & Dikmas",
    recipient: "Kepala PKBM Askara Kota Bandung",
    recipientDetails: "Arif Syarifudin, S.Pd",
    date: "2026-08-12",
    receivedDate: "2026-08-13",
    disposition: "Tindak lanjuti bersama Operator PKBM (Ihsan Fadilah) dan siapkan dokumen instrumen akreditasi.",
    contentData: {
      templateType: "SURAT_MASUK",
      summary: "Undangan rapat sosialisasi pemenuhan 8 Standar Nasional Pendidikan (SNP) untuk akreditasi BAN-PDM di Aula Disdik Kota Bandung pada 28 Agustus 2026.",
      attachmentName: "Surat_Disdik_Sosialisasi_Akreditasi_2026.pdf",
    },
    status: "PUBLISHED",
    signerName: "Drs. H. Hendrawan, M.M.",
    signerRole: "Kepala Bidang PAUD & Dikmas Disdik Kota Bandung",
    qrVerificationCode: "VRF-IN-2026-001",
    createdAt: new Date("2026-08-13T10:00:00Z").toISOString(),
  },
];

// Helper to auto-generate next letter number strictly according to PRD format:
// [No_Urut]/[Kategori_Surat]/PKBM-AK/[Bulan_Romawi]/[Tahun]
function generateLetterNumber(categoryCode: LetterCategoryCode, dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  const monthRoman = ROMAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();

  const count = letterStore.filter((l) => l.categoryCode === categoryCode).length + 1;
  const numStr = String(count).padStart(3, "0");
  return `${numStr}/${categoryCode}/PKBM-AK/${monthRoman}/${year}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const categoryGroup = searchParams.get("group");
    const categoryCode = searchParams.get("categoryCode");
    const search = searchParams.get("search")?.toLowerCase();

    let filtered = [...letterStore];

    if (categoryGroup && categoryGroup !== "ALL") {
      filtered = filtered.filter((l) => l.category === categoryGroup);
    }
    if (categoryCode && categoryCode !== "ALL") {
      filtered = filtered.filter((l) => l.categoryCode === categoryCode);
    }
    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.letterNumber.toLowerCase().includes(search) ||
          l.title.toLowerCase().includes(search) ||
          l.recipient.toLowerCase().includes(search) ||
          (l.sender && l.sender.toLowerCase().includes(search)) ||
          (l.sourceNumber && l.sourceNumber.toLowerCase().includes(search))
      );
    }

    // Previews of next auto numbers for all 16 categories
    const nextNumbers: Record<string, string> = {};
    LETTER_CATEGORIES.forEach((c) => {
      nextNumbers[c.code] = generateLetterNumber(c.code);
    });

    return NextResponse.json({
      success: true,
      letters: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      total: filtered.length,
      categories: LETTER_CATEGORIES,
      nextNumbers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memuat data persuratan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "bendahara"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      categoryCode = "SK",
      category = "SURAT_KELUAR",
      title,
      recipient,
      recipientDetails,
      date = new Date().toISOString().slice(0, 10),
      contentData = {},
      customNumber,
      signerName = "Arif Syarifudin, S.Pd",
      signerRole = "Kepala PKBM Askara",
      signerNip = "",
      sourceNumber,
      sender,
      receivedDate,
      disposition,
      attachmentUrl,
    } = body;

    if (!title || (!recipient && !sender)) {
      return NextResponse.json({ error: "Perihal/judul dan nama penerima atau pengirim wajib diisi" }, { status: 400 });
    }

    const letterNumber = customNumber?.trim() || (category === "SURAT_MASUK" ? (sourceNumber || `IN-${Date.now()}`) : generateLetterNumber(categoryCode as LetterCategoryCode, date));
    const id = `srt-${Date.now()}`;
    const qrVerificationCode = `VRF-${categoryCode}-${Date.now().toString().slice(-6)}`;

    const newLetter: LetterItem = {
      id,
      letterNumber,
      categoryCode: categoryCode as LetterCategoryCode,
      category: category as any,
      title,
      recipient: recipient || sender || "Kepala PKBM Askara",
      recipientDetails,
      date,
      contentData,
      status: "PUBLISHED",
      signerName,
      signerRole,
      signerNip,
      qrVerificationCode,
      sourceNumber,
      sender,
      receivedDate: receivedDate || date,
      disposition,
      attachmentUrl,
      createdAt: new Date().toISOString(),
    };

    letterStore.unshift(newLetter);

    return NextResponse.json({
      success: true,
      message: `Surat ${letterNumber} berhasil disimpan ke Buku Agenda!`,
      letter: newLetter,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memproses persuratan" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "bendahara"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, letterNumber, recipient, recipientDetails, date, contentData, signerName, signerRole, signerNip, disposition } = body;

    if (!id) {
      return NextResponse.json({ error: "ID surat wajib disertakan" }, { status: 400 });
    }

    const idx = letterStore.findIndex((l) => l.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
    }

    letterStore[idx] = {
      ...letterStore[idx],
      title: title ?? letterStore[idx].title,
      letterNumber: letterNumber ?? letterStore[idx].letterNumber,
      recipient: recipient ?? letterStore[idx].recipient,
      recipientDetails: recipientDetails ?? letterStore[idx].recipientDetails,
      date: date ?? letterStore[idx].date,
      contentData: contentData ?? letterStore[idx].contentData,
      signerName: signerName ?? letterStore[idx].signerName,
      signerRole: signerRole ?? letterStore[idx].signerRole,
      signerNip: signerNip ?? letterStore[idx].signerNip,
      disposition: disposition ?? letterStore[idx].disposition,
    };

    return NextResponse.json({
      success: true,
      message: `Surat ${letterStore[idx].letterNumber} berhasil diperbarui!`,
      letter: letterStore[idx],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memperbarui surat" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Hanya Super Admin yang dapat menghapus arsip surat" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID surat wajib disertakan" }, { status: 400 });

    letterStore = letterStore.filter((l) => l.id !== id);
    return NextResponse.json({ success: true, message: "Surat berhasil dihapus dari arsip" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menghapus surat" }, { status: 500 });
  }
}
