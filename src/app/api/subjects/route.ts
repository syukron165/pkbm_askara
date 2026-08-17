import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  packetType: "Paket A" | "Paket B" | "Paket C" | "Vokasi & Keterampilan" | "Vokasi" | string;
  category: "UMUM" | "PEMINATAN" | "VOKASI" | "PEMBERDAYAAN";
  skk: number; // Satuan Kredit Kompetensi
  kkm: number; // Kriteria Ketuntasan Minimal (misal 75)
  hoursPerWeek: number; // Jam pelajaran per minggu
  teacherName: string;
  description: string;
  syllabusUrl?: string | null;
  isActive: boolean;
}

let subjectsData: SubjectItem[] = [
  // --- PAKET C (Setara SMA) ---
  {
    id: "subj-c-1",
    code: "MAT-C10",
    name: "Matematika Terapan",
    packetType: "Paket C",
    category: "UMUM",
    skk: 4,
    kkm: 75,
    hoursPerWeek: 4,
    teacherName: "Drs. Hendra Gunawan",
    description: "Aljabar matriks, barisan deret, trigonometri terapan, dan kalkulus dasar untuk pemecahan masalah kontekstual.",
    isActive: true,
  },
  {
    id: "subj-c-2",
    code: "IND-C10",
    name: "Bahasa Indonesia Komunikatif",
    packetType: "Paket C",
    category: "UMUM",
    skk: 3,
    kkm: 75,
    hoursPerWeek: 3,
    teacherName: "Nurul Aini, S.Pd.",
    description: "Penyusunan teks laporan hasil observasi, esai argumentatif, teks negosiasi bisnis, dan surat dinas resmi.",
    isActive: true,
  },
  {
    id: "subj-c-3",
    code: "ING-C10",
    name: "Bahasa Inggris Praktis & Bisnis",
    packetType: "Paket C",
    category: "UMUM",
    skk: 3,
    kkm: 75,
    hoursPerWeek: 3,
    teacherName: "Nurul Aini, M.Pd.",
    description: "Percakapan profesional, wawancara kerja, korespondensi email internasional, dan pemahaman teks deskriptif.",
    isActive: true,
  },
  {
    id: "subj-c-4",
    code: "PPKN-C10",
    name: "Pendidikan Pancasila & Kewarganegaraan",
    packetType: "Paket C",
    category: "UMUM",
    skk: 2,
    kkm: 78,
    hoursPerWeek: 2,
    teacherName: "Drs. Hendra Gunawan",
    description: "Nilai-nilai konstitusi, hak dan kewajiban warga negara, integrasi nasional, dan budaya demokrasi.",
    isActive: true,
  },
  {
    id: "subj-c-5",
    code: "EKO-C10",
    name: "Ekonomi & Manajemen Kewirausahaan",
    packetType: "Paket C",
    category: "PEMINATAN",
    skk: 4,
    kkm: 75,
    hoursPerWeek: 4,
    teacherName: "Dewi Lestari, S.E.",
    description: "Studi pasar, analisis biaya produksi UMKM, pencatatan akuntansi dasar, dan strategi pemasaran digital.",
    isActive: true,
  },
  {
    id: "subj-c-6",
    code: "IPA-C10",
    name: "Sains Terapan & Lingkungan Hidup",
    packetType: "Paket C",
    category: "PEMINATAN",
    skk: 3,
    kkm: 75,
    hoursPerWeek: 3,
    teacherName: "Bambang Sutrisno, M.Si.",
    description: "Pengelolaan energi terbarukan, daur ulang limbah organik-anorganik, dan bioteknologi tepat guna.",
    isActive: true,
  },
  {
    id: "subj-c-7",
    code: "VOK-C10",
    name: "Keterampilan Digital & Desain Grafis",
    packetType: "Paket C",
    category: "VOKASI",
    skk: 5,
    kkm: 80,
    hoursPerWeek: 5,
    teacherName: "Bayu Pratama, S.Kom.",
    description: "Penguasaan Canva, Adobe Illustrator, UI/UX dasar, dan pembuatan portofolio branding digital.",
    isActive: true,
  },

  // --- PAKET B (Setara SMP) ---
  {
    id: "subj-b-1",
    code: "MAT-B8",
    name: "Matematika Dasar & Logika",
    packetType: "Paket B",
    category: "UMUM",
    skk: 3,
    kkm: 72,
    hoursPerWeek: 3,
    teacherName: "Drs. Hendra Gunawan",
    description: "Operasi hitung bilangan bulat, pecahan, pola bilangan, aljabar linier satu variabel, dan statistika dasar.",
    isActive: true,
  },
  {
    id: "subj-b-2",
    code: "IPA-B8",
    name: "Ilmu Pengetahuan Alam (IPA)",
    packetType: "Paket B",
    category: "UMUM",
    skk: 4,
    kkm: 75,
    hoursPerWeek: 4,
    teacherName: "Bambang Sutrisno, M.Si.",
    description: "Sistem organisasi kehidupan, pengukuran fisika, zat aditif, dan interaksi ekosistem.",
    isActive: true,
  },
  {
    id: "subj-b-3",
    code: "IPS-B8",
    name: "Ilmu Pengetahuan Sosial (IPS)",
    packetType: "Paket B",
    category: "UMUM",
    skk: 3,
    kkm: 75,
    hoursPerWeek: 3,
    teacherName: "Siti Rahmawati, S.Pd.",
    description: "Letak geografis Nusantara, dinamika kependudukan, interaksi sosial budaya, dan kegiatan ekonomi masyarakat.",
    isActive: true,
  },
  {
    id: "subj-b-4",
    code: "ING-B8",
    name: "Bahasa Inggris Fondasi",
    packetType: "Paket B",
    category: "UMUM",
    skk: 2,
    kkm: 72,
    hoursPerWeek: 2,
    teacherName: "Nurul Aini, M.Pd.",
    description: "Greetings, simple present tense, descriptive texts, dan percakapan kontekstual sehari-hari.",
    isActive: true,
  },
  {
    id: "subj-b-5",
    code: "VOK-B8",
    name: "Tata Busana & Kriya Tekstil",
    packetType: "Paket B",
    category: "VOKASI",
    skk: 4,
    kkm: 78,
    hoursPerWeek: 4,
    teacherName: "Sri Wahyuni",
    description: "Pengenalan mesin jahit, pembuatan pola dasar pakaian, teknik menjahit rapi, dan teknik sablon/ecoprint.",
    isActive: true,
  },

  // --- PAKET A (Setara SD) ---
  {
    id: "subj-a-1",
    code: "LIT-A5",
    name: "Literasi Membaca & Menulis Kreatif",
    packetType: "Paket A",
    category: "UMUM",
    skk: 3,
    kkm: 70,
    hoursPerWeek: 3,
    teacherName: "Siti Rahmawati, S.Pd.",
    description: "Membaca teks cerita inspiratif, memperkaya kosakata, memahami ide pokok paragraf, dan menulis karangan bebas.",
    isActive: true,
  },
  {
    id: "subj-a-2",
    code: "NUM-A5",
    name: "Numerasi & Aritmetika Harian",
    packetType: "Paket A",
    category: "UMUM",
    skk: 3,
    kkm: 70,
    hoursPerWeek: 3,
    teacherName: "Drs. Hendra Gunawan",
    description: "Operasi hitung perkalian pembagian, nilai uang, pengukuran panjang/berat, dan pecahan praktis.",
    isActive: true,
  },
  {
    id: "subj-a-3",
    code: "IPAS-A5",
    name: "Ilmu Pengetahuan Alam & Sosial (IPAS)",
    packetType: "Paket A",
    category: "UMUM",
    skk: 3,
    kkm: 72,
    hoursPerWeek: 3,
    teacherName: "Bambang Sutrisno, M.Si.",
    description: "Panca indera, siklus hidup hewan dan tumbuhan, pahlawan nasional, serta lingkungan tempat tinggal.",
    isActive: true,
  },
  {
    id: "subj-a-4",
    code: "KTR-A5",
    name: "Prakarya Kreatif & Daur Ulang",
    packetType: "Paket A",
    category: "PEMBERDAYAAN",
    skk: 2,
    kkm: 75,
    hoursPerWeek: 2,
    teacherName: "Bayu Pratama, S.Kom.",
    description: "Kerajinan tangan dari kardus, botol plastik daur ulang, anyaman kertas, dan menggambar ilustrasi bebas.",
    isActive: true,
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packet = searchParams.get("packet");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let result = [...subjectsData];

    if (packet && packet !== "SEMUA") {
      result = result.filter((s) => s.packetType.toLowerCase() === packet.toLowerCase());
    }

    if (category && category !== "SEMUA") {
      result = result.filter((s) => s.category.toUpperCase() === category.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.teacherName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat mata pelajaran" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat menambah mata pelajaran." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, name, packetType, category, skk, kkm, hoursPerWeek, teacherName, description } = body;

    if (!code || !name || !packetType || !teacherName) {
      return NextResponse.json(
        { success: false, error: "Kode mapel, nama mapel, jenjang paket, dan nama tutor wajib diisi" },
        { status: 400 }
      );
    }

    const exists = subjectsData.some((s) => s.code.toUpperCase() === code.toUpperCase());
    if (exists) {
      return NextResponse.json(
        { success: false, error: `Kode mapel ${code} sudah terdaftar!` },
        { status: 400 }
      );
    }

    const newSubject: SubjectItem = {
      id: `subj-${Date.now()}`,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      packetType: packetType || "Paket C",
      category: category || "UMUM",
      skk: Number(skk) || 2,
      kkm: Number(kkm) || 75,
      hoursPerWeek: Number(hoursPerWeek) || 2,
      teacherName: teacherName.trim(),
      description: description || "Mata pelajaran kurikulum kesetaraan.",
      isActive: true,
    };

    subjectsData.unshift(newSubject);

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil ditambahkan",
      data: newSubject,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan mata pelajaran" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat mengubah mata pelajaran." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, code, name, packetType, category, skk, kkm, hoursPerWeek, teacherName, description, isActive } = body;

    const index = subjectsData.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Mata pelajaran tidak ditemukan" },
        { status: 404 }
      );
    }

    subjectsData[index] = {
      ...subjectsData[index],
      code: code ? code.toUpperCase().trim() : subjectsData[index].code,
      name: name ? name.trim() : subjectsData[index].name,
      packetType: packetType || subjectsData[index].packetType,
      category: category || subjectsData[index].category,
      skk: skk !== undefined ? Number(skk) : subjectsData[index].skk,
      kkm: kkm !== undefined ? Number(kkm) : subjectsData[index].kkm,
      hoursPerWeek: hoursPerWeek !== undefined ? Number(hoursPerWeek) : subjectsData[index].hoursPerWeek,
      teacherName: teacherName ? teacherName.trim() : subjectsData[index].teacherName,
      description: description !== undefined ? description : subjectsData[index].description,
      isActive: isActive !== undefined ? Boolean(isActive) : subjectsData[index].isActive,
    };

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil diperbarui",
      data: subjectsData[index],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui mata pelajaran" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat menghapus mata pelajaran." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Parameter ID wajib disertakan" },
        { status: 400 }
      );
    }

    const index = subjectsData.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Mata pelajaran tidak ditemukan" },
        { status: 404 }
      );
    }

    const removed = subjectsData.splice(index, 1)[0];

    return NextResponse.json({
      success: true,
      message: `Mata pelajaran ${removed.name} (${removed.code}) berhasil dihapus`,
      data: removed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus mata pelajaran" },
      { status: 500 }
    );
  }
}
