import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

let calendarEvents = [
  {
    id: "evt-1",
    title: "Awal Tahun Ajaran Baru & Masa Orientasi Warga Belajar (MOWB)",
    category: "KBM", // KBM, ASESMEN, LIBUR, VOKASI, RAPOR, RAPAT
    startDate: "2026-07-14",
    endDate: "2026-07-16",
    targetAudience: "Semua Paket (A, B, C)",
    location: "Aula Utama & Daring",
    description: "Pengenalan kurikulum kesetaraan, platform digital Askara, tata tertib, dan kontrak belajar.",
    color: "emerald",
  },
  {
    id: "evt-2",
    title: "Matrikulasi & Pemetaan Kemampuan Belajar Mandiri",
    category: "KBM",
    startDate: "2026-07-21",
    endDate: "2026-07-25",
    targetAudience: "Warga Belajar Baru",
    location: "Ruang Kelas & LMS",
    description: "Asesmen diagnostik awal literasi, numerasi, dan minat vokasi.",
    color: "emerald",
  },
  {
    id: "evt-3",
    title: "HUT Kemerdekaan Republik Indonesia Ke-81",
    category: "LIBUR",
    startDate: "2026-08-17",
    endDate: "2026-08-17",
    targetAudience: "Semua Peran",
    location: "Halaman Kampus PKBM Askara (Upacara)",
    description: "Upacara bendera bersama seluruh warga belajar, tutor, dan pengurus.",
    color: "rose",
  },
  {
    id: "evt-4",
    title: "Simulasi & Gladi Bersih Asesmen Nasional Berbasis Komputer (ANBK)",
    category: "ASESMEN",
    startDate: "2026-09-08",
    endDate: "2026-09-11",
    targetAudience: "Paket B & Paket C",
    location: "Lab Komputer CBT Askara",
    description: "Uji coba kesiapan infrastruktur jaringan, komputer klien, dan perangkat ujian.",
    color: "blue",
  },
  {
    id: "evt-5",
    title: "Penilaian Tengah Semester (PTS) Ganjil CBT",
    category: "ASESMEN",
    startDate: "2026-09-22",
    endDate: "2026-09-27",
    targetAudience: "Semua Paket (A, B, C)",
    location: "Portal CBT Online PKBM Askara",
    description: "Evaluasi capaian belajar paruh semester 1 berbasis CBT terpusat.",
    color: "blue",
  },
  {
    id: "evt-6",
    title: "Pertemuan Berkala & Diskusi Perkembangan Belajar Orang Tua / Wali",
    category: "RAPAT",
    startDate: "2026-10-10",
    endDate: "2026-10-10",
    targetAudience: "Orang Tua & Tutor",
    location: "Aula PKBM Askara & Hybrid Zoom",
    description: "Pemaparan rekapitulasi kehadiran GPS, capaian tugas LMS, dan kendala belajar mandiri.",
    color: "amber",
  },
  {
    id: "evt-7",
    title: "Workshop & Gelar Karya Vokasi Kewirausahaan",
    category: "VOKASI",
    startDate: "2026-11-05",
    endDate: "2026-11-07",
    targetAudience: "Paket C & Umum",
    location: "Sentra Kreatif Warga Belajar Askara",
    description: "Pameran produk kriya, tata busana, dan portofolio desain digital warga belajar.",
    color: "purple",
  },
  {
    id: "evt-8",
    title: "Pelaksanaan Asesmen Akhir Semester (PAS) Ganjil",
    category: "ASESMEN",
    startDate: "2026-12-01",
    endDate: "2026-12-08",
    targetAudience: "Semua Paket (A, B, C)",
    location: "CBT Portal Askara",
    description: "Ujian komprehensif semester ganjil seluruh mata pelajaran kurikulum merdeka kesetaraan.",
    color: "blue",
  },
  {
    id: "evt-9",
    title: "Sidang Pleno Nilai & Penerbitan e-Rapor Semester Ganjil",
    category: "RAPOR",
    startDate: "2026-12-18",
    endDate: "2026-12-19",
    targetAudience: "Tutor, Siswa & Orang Tua",
    location: "Sistem e-Rapor PKBM",
    description: "Finalisasi nilai rapor, verifikasi wali kelas, dan pembagian dokumen digital rapor resmi.",
    color: "indigo",
  },
  {
    id: "evt-10",
    title: "Libur Akhir Semester Ganjil & Tahun Baru 2027",
    category: "LIBUR",
    startDate: "2026-12-21",
    endDate: "2027-01-03",
    targetAudience: "Semua Warga Belajar",
    location: "-",
    description: "Masa libur pembelajaran akhir tahun.",
    color: "rose",
  },
  {
    id: "evt-11",
    title: "Awal Perkuliahan & KBM Semester Genap",
    category: "KBM",
    startDate: "2027-01-04",
    endDate: "2027-01-04",
    targetAudience: "Semua Paket (A, B, C)",
    location: "Ruang Belajar & LMS",
    description: "Hari pertama pembelajaran tatap muka dan daring semester genap.",
    color: "emerald",
  },
  {
    id: "evt-12",
    title: "Uji Kesetaraan Resmi (UK) Tingkat Nasional",
    category: "ASESMEN",
    startDate: "2027-03-15",
    endDate: "2027-03-20",
    targetAudience: "Tingkat Akhir Paket A, B, C",
    location: "Pusat Ujian Asesmen Askara",
    description: "Ujian kesetaraan untuk penentuan kelulusan dan penerbitan Surat Keterangan Lulus (SKL) / Ijazah.",
    color: "blue",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const month = searchParams.get("month"); // e.g. "2026-08"

    let result = [...calendarEvents];

    if (category && category !== "SEMUA") {
      result = result.filter((e) => e.category.toUpperCase() === category.toUpperCase());
    }

    if (month) {
      result = result.filter(
        (e) => e.startDate.startsWith(month) || e.endDate.startsWith(month)
      );
    }

    // Sort by start date
    result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat agenda kalender" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat menambahkan agenda kalender." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, category, startDate, endDate, targetAudience, location, description } = body;

    if (!title || !category || !startDate) {
      return NextResponse.json(
        { success: false, error: "Judul, kategori, dan tanggal mulai wajib diisi" },
        { status: 400 }
      );
    }

    const categoryColors: Record<string, string> = {
      KBM: "emerald",
      ASESMEN: "blue",
      LIBUR: "rose",
      VOKASI: "purple",
      RAPOR: "indigo",
      RAPAT: "amber",
    };

    const newEvent = {
      id: `evt-${Date.now()}`,
      title,
      category: category.toUpperCase(),
      startDate,
      endDate: endDate || startDate,
      targetAudience: targetAudience || "Semua Paket",
      location: location || "PKBM Askara",
      description: description || "Agenda akademik resmi",
      color: categoryColors[category.toUpperCase()] || "emerald",
    };

    calendarEvents.push(newEvent);

    return NextResponse.json({
      success: true,
      message: "Agenda kalender akademik berhasil ditambahkan",
      data: newEvent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan agenda kalender" },
      { status: 500 }
    );
  }
}
