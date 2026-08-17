import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const DEFAULT_SEEDS = [
  {
    title: "Modul Pembelajaran Mandiri Matematika Paket C - Kelas X",
    author: "Tim Kurikulum PKBM Askara",
    category: "Modul Paket C",
    fileSize: "4.2 MB",
    fileUrl: "/uploads/pustaka/sample-matematika-paket-c.pdf",
    downloadCount: 142,
    description: "Memuat konsep matriks, fungsi kuadrat, trigonometri dasar, dan latihan soal berbasis kontekstual.",
  },
  {
    title: "Bahasa Indonesia Kontekstual & Teks Eksplanasi Paket B",
    author: "Kemendikbudristek & Tutor Askara",
    category: "Modul Paket B",
    fileSize: "3.8 MB",
    fileUrl: "/uploads/pustaka/sample-bahasa-indonesia-paket-b.pdf",
    downloadCount: 98,
    description: "Panduan menyusun teks argumentasi, eksplanasi fenomena sosial, dan resensi buku literasi.",
  },
  {
    title: "Literasi Numerasi Dasar & Sains Lingkungan Paket A",
    author: "Pusat Kurikulum & Pembelajaran",
    category: "Modul Paket A",
    fileSize: "5.1 MB",
    fileUrl: "/uploads/pustaka/sample-literasi-paket-a.pdf",
    downloadCount: 84,
    description: "Materi belajar dasar membaca, berhitung praktis, dan pengenalan ekosistem sekitar untuk peserta Paket A.",
  },
  {
    title: "Kewirausahaan & Digital Marketing untuk Warga Belajar PKBM",
    author: "Instruktur Vokasi PKBM Askara",
    category: "Keterampilan & Vokasi",
    fileSize: "6.5 MB",
    fileUrl: "/uploads/pustaka/sample-kewirausahaan-vokasi.pdf",
    downloadCount: 215,
    description: "Panduan praktis memulai usaha mikro, manajemen keuangan sederhana, dan pemasaran via media sosial.",
  },
  {
    title: "Pendidikan Pancasila & Kewarganegaraan: Hak dan Kewajiban Warga Negara",
    author: "Tim Pendidik Askara",
    category: "Modul Paket C",
    fileSize: "2.9 MB",
    fileUrl: "/uploads/pustaka/sample-pkn-paket-c.pdf",
    downloadCount: 110,
    description: "Nilai-nilai konstitusi, kerukunan bermasyarakat, dan partisipasi demokratis.",
  },
];

// GET /api/pustaka
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  // Check if we need to seed initial items if table is completely empty
  const count = await db.digitalLibrary.count();
  if (count === 0) {
    // Find an admin user to assign as default uploader for initial seed
    const admin = await db.user.findFirst({
      where: { role: { in: ["super_admin", "admin"] } },
    });
    const uploaderId = admin?.id || user.id;

    for (const seed of DEFAULT_SEEDS) {
      await db.digitalLibrary.create({
        data: {
          ...seed,
          uploaderId,
        },
      });
    }
  }

  const whereClause: any = {};
  if (category && category !== "SEMUA") {
    whereClause.category = category;
  }
  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const items = await db.digitalLibrary.findMany({
    where: whereClause,
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

// POST /api/pustaka
// Body: { title, author, category, description, fileUrl, coverUrl, fileSize }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Hanya Admin dan Pendidik yang dapat mengunggah dokumen" }, { status: 403 });
  }

  const body = await req.json();
  const { title, author, category, description, fileUrl, coverUrl, fileSize } = body;

  if (!title || !author || !category || !fileUrl) {
    return NextResponse.json({ error: "Judul, Penulis, Kategori, dan File Dokumen wajib diisi" }, { status: 400 });
  }

  const item = await db.digitalLibrary.create({
    data: {
      title,
      author,
      category,
      description: description || null,
      fileUrl,
      coverUrl: coverUrl || null,
      fileSize: fileSize || null,
      uploaderId: user.id,
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}

// DELETE /api/pustaka?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID dokumen diperlukan" }, { status: 400 });

  const existing = await db.digitalLibrary.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });

  // If user is pendidik, check if they own it or if admin/super_admin allow all
  if (user.role === "pendidik" && existing.uploaderId !== user.id) {
    return NextResponse.json({ error: "Anda hanya dapat menghapus dokumen yang Anda unggah sendiri" }, { status: 403 });
  }

  await db.digitalLibrary.delete({ where: { id } });
  return NextResponse.json({ message: "Dokumen berhasil dihapus" });
}

// PATCH /api/pustaka?id=xxx (Increment download count)
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID dokumen diperlukan" }, { status: 400 });

  await db.digitalLibrary.update({
    where: { id },
    data: {
      downloadCount: { increment: 1 },
    },
  });

  return NextResponse.json({ message: "Download count incremented" });
}
