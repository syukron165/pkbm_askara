import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LetterCategoryCode } from "@/lib/surat-constants";

export interface CustomLetterTemplate {
  id: string;
  name: string;
  categoryCode: LetterCategoryCode;
  category: "SURAT_KELUAR" | "SK_LEMBAGA";
  description: string;
  defaultTitle: string;
  defaultRecipient?: string;
  defaultRecipientDetails?: string;
  contentData: Record<string, any>;
  isCustom: boolean;
  createdAt: string;
}

let customTemplateStore: CustomLetterTemplate[] = [
  {
    id: "tmpl-sk-panitia-wisuda",
    name: "SK Panitia Wisuda & Pelepasan Warga Belajar Paket C",
    categoryCode: "SK",
    category: "SK_LEMBAGA",
    description: "Penetapan susunan panitia wisuda, kelulusan, dan pelepasan siswa",
    defaultTitle: "Surat Keputusan Penetapan Panitia Wisuda & Pelepasan Peserta Didik Paket C",
    defaultRecipient: "Nurul Aini, S.Pd.",
    defaultRecipientDetails: "Ketua Panitia Wisuda & Kelulusan",
    contentData: {
      templateType: "SK",
      tentang: "PENETAPAN PANITIA WISUDA DAN PELEPASAN WARGA BELAJAR PAKET C",
      tahunAjaran: "TAHUN AJARAN 2026/2027",
      menimbang: [
        "bahwa dalam rangka kelancaran pelaksanaan agenda wisuda dan pelepasan kelulusan warga belajar PKBM Askara, dipandang perlu membentuk panitia pelaksana;",
        "bahwa nama yang tercantum dalam keputusan ini dipandang mampu melaksanakan tugas kepanitiaan.",
      ],
      mengingat: [
        "Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
        "Program Kerja Tahunan PKBM Askara Tahun Ajaran 2026/2027.",
      ],
      kesatuNama: "Nurul Aini, S.Pd.",
      kesatuJabatan: "Ketua Panitia Wisuda",
      kesatuUnitKerja: "PKBM Askara",
      keduaPeriode: "Terhitung mulai tanggal 01 Mei 2027 sampai dengan selesainya pelaporan pertanggungjawaban kegiatan wisuda.",
      ketigaTugas: "Mengoordinasikan seksi acara, dekorasi, dokumentasi, penerbitan buku kelulusan, dan tata tertib prosesi wisuda.",
      keempatBiaya: "Segala biaya dibebankan pada anggaran kegiatan wisuda PKBM Askara.",
      kelimaPenutup: "Surat Keputusan ini mulai berlaku sejak tanggal ditetapkan.",
      ditetapkanDi: "Bandung",
      tanggalPenetapan: "01 Mei 2027",
    },
    isCustom: true,
    createdAt: new Date("2026-08-01T08:00:00Z").toISOString(),
  },
  {
    id: "tmpl-spm-bantuan-csr",
    name: "Surat Permohonan Dukungan Fasilitas Vokasi / CSR",
    categoryCode: "SPm",
    category: "SURAT_KELUAR",
    description: "Permohonan kerja sama, bantuan peralatan lab vokasi ke mitra industri",
    defaultTitle: "Permohonan Dukungan Alat Praktik & Kerja Sama Pelatihan Vokasi Barista",
    defaultRecipient: "Pimpinan PT Industri Kreatif Kopi Nusantara",
    defaultRecipientDetails: "Mitra Dunia Usaha & Dunia Industri (DUDI)",
    contentData: {
      templateType: "PERMOHONAN_KERJASAMA",
      openingSalam: "Dengan hormat, Teriring salam dan doa semoga Bapak/Ibu senantiasa dalam lindungan Tuhan Yang Maha Esa.",
      bodyParagraph: "Dalam rangka penguatan kompetensi vokasi dan kewirausahaan warga belajar PKBM Askara, kami bermaksud mengajukan permohonan kerja sama program magang dan dukungan fasilitas pelatihan barista.",
      closingNotes: "Besar harapan kami kerja sama ini dapat terjalin dengan baik demi mencetak lulusan pendidikan kesetaraan yang berdaya saing tinggi.",
      ditetapkanDi: "Bandung",
      tanggalPenetapan: "17 Agustus 2026",
    },
    isCustom: true,
    createdAt: new Date("2026-08-05T09:00:00Z").toISOString(),
  },
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({
      success: true,
      templates: customTemplateStore.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      total: customTemplateStore.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memuat template kustom" }, { status: 500 });
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
      name,
      categoryCode = "SK",
      category = "SURAT_KELUAR",
      description = "Template kustom pengguna",
      defaultTitle,
      defaultRecipient,
      defaultRecipientDetails,
      contentData = {},
    } = body;

    if (!name || !defaultTitle) {
      return NextResponse.json({ error: "Nama template dan judul perihal surat wajib diisi" }, { status: 400 });
    }

    const newTemplate: CustomLetterTemplate = {
      id: `tmpl-${Date.now()}`,
      name,
      categoryCode: categoryCode as LetterCategoryCode,
      category: category as any,
      description,
      defaultTitle,
      defaultRecipient: defaultRecipient || "",
      defaultRecipientDetails: defaultRecipientDetails || "",
      contentData,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    customTemplateStore.unshift(newTemplate);

    return NextResponse.json({
      success: true,
      message: `Template "${name}" berhasil disimpan dan kini siap dipakai di katalog template!`,
      template: newTemplate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menyimpan template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Hanya Super Admin yang dapat menghapus template" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID template wajib disertakan" }, { status: 400 });

    customTemplateStore = customTemplateStore.filter((t) => t.id !== id);
    return NextResponse.json({ success: true, message: "Template berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menghapus template" }, { status: 500 });
  }
}
