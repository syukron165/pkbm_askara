import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const SEED_ASSETS = [
  {
    code: "AST-YYS-2021-001",
    name: "Tanah & Gedung Utama PKBM Askara",
    owner: "YAYASAN",
    category: "TANAH_BANGUNAN",
    quantity: 1,
    unit: "Bidang",
    acquisitionDate: new Date("2021-03-15"),
    purchaseCost: 1500000000,
    currentValue: 1850000000,
    fundingSource: "DANA_YAYASAN",
    condition: "BAIK",
    location: "Jl. Adiflora Raya No. 8, Rancabolan, Gedebage, Bandung",
    personInCharge: "Drs. Hendra Gunawan (Pengurus Yayasan)",
    description: "Sertifikat Hak Milik (SHM) No. 402/Gedebage Luas 450 m2, Bangunan 2 Lantai 360 m2 untuk ruang kelas, kantor tata usaha, dan aula.",
    photoUrl: "",
  },
  {
    code: "AST-YYS-2022-002",
    name: "Kendaraan Operasional Yayasan (Toyota Avanza Veloz)",
    owner: "YAYASAN",
    category: "KENDARAAN",
    quantity: 1,
    unit: "Unit",
    acquisitionDate: new Date("2022-06-20"),
    purchaseCost: 245000000,
    currentValue: 190000000,
    fundingSource: "DANA_YAYASAN",
    condition: "BAIK",
    location: "Garasi Gedung Utama PKBM Askara",
    personInCharge: "Budi Hartono (Kepala Tata Usaha)",
    description: "Mobil operasional antar-jemput tutor, kegiatan luar ruangan warga belajar, dan urusan kedinasan yayasan. Plat D 1845 ASK.",
    photoUrl: "",
  },
  {
    code: "AST-PKBM-2024-001",
    name: "Paket Perangkat Komputer Client CBT & Lab Multimedia",
    owner: "PKBM_ASKARA",
    category: "ELEKTRONIK_TI",
    quantity: 20,
    unit: "Unit",
    acquisitionDate: new Date("2024-01-10"),
    purchaseCost: 160000000,
    currentValue: 135000000,
    fundingSource: "DANA_BOS",
    condition: "BAIK",
    location: "Ruang Lab Komputer & CBT (Lantai 2)",
    personInCharge: "Dewi Anggraini, S.Kom. (Koordinator TI)",
    description: "PC All-in-One Core i5 16GB RAM 512GB SSD Monitor 24 Inch untuk pelaksanaan ujian CBT ANBK dan praktik vokasi digital.",
    photoUrl: "",
  },
  {
    code: "AST-PKBM-2024-002",
    name: "Server Utama CBT & Jaringan Lokal Gigabit",
    owner: "PKBM_ASKARA",
    category: "ELEKTRONIK_TI",
    quantity: 1,
    unit: "Paket",
    acquisitionDate: new Date("2024-01-15"),
    purchaseCost: 35000000,
    currentValue: 30000000,
    fundingSource: "SWADAYA_PKBM",
    condition: "BAIK",
    location: "Ruang Server & IT Support (Lantai 2)",
    personInCharge: "Dewi Anggraini, S.Kom. (Koordinator TI)",
    description: "Server Tower Xeon 32GB RAM + UPS 2000VA + Switch Gigabit 24 Port + Router Mikrotik RB4011.",
    photoUrl: "",
  },
  {
    code: "AST-PKBM-2024-003",
    name: "Mesin Espresso Komersial 2 Group & Grinder Kopi Vokasi",
    owner: "PKBM_ASKARA",
    category: "PERALATAN_VOKASI",
    quantity: 1,
    unit: "Set",
    acquisitionDate: new Date("2024-08-05"),
    purchaseCost: 48000000,
    currentValue: 45000000,
    fundingSource: "HIBAH_PEMERINTAH",
    condition: "BAIK",
    location: "Workshop Tata Boga & Cafe Vokasi Askara",
    personInCharge: "Rian Pratama, S.E. (Instruktur Vokasi Kuliner)",
    description: "Peralatan praktik Club Barista & Kewirausahaan Kuliner: Mesin Espresso Sanremo 2-Group + Eureka Grinder Otomatis.",
    photoUrl: "",
  },
  {
    code: "AST-PKBM-2025-004",
    name: "Paket Kit Robotik & Starter Kit IoT Arduino/ESP32",
    owner: "PKBM_ASKARA",
    category: "PERALATAN_VOKASI",
    quantity: 12,
    unit: "Set",
    acquisitionDate: new Date("2025-02-12"),
    purchaseCost: 21600000,
    currentValue: 20000000,
    fundingSource: "DANA_BOS",
    condition: "BAIK",
    location: "Lab Komputer & Robotik",
    personInCharge: "Dewi Anggraini, S.Kom.",
    description: "Kit robotik line follower, robot lengan (arm robot), modul sensor IoT pintar untuk Club Robotik & AI Kesetaraan.",
    photoUrl: "",
  },
  {
    code: "AST-PKBM-2023-005",
    name: "Meja & Kursi Belajar Ergonomis Siswa",
    owner: "PKBM_ASKARA",
    category: "FURNITUR_MEUBEL",
    quantity: 60,
    unit: "Set",
    acquisitionDate: new Date("2023-07-20"),
    purchaseCost: 45000000,
    currentValue: 35000000,
    fundingSource: "SWADAYA_PKBM",
    condition: "BAIK",
    location: "Ruang Kelas Paket A, B, dan C (Lantai 1 & 2)",
    personInCharge: "Sari Wulandari (Staf TU)",
    description: "Meja dan kursi rangka besi hollow powder coating anti-karat dengan top table kayu mahoni solid.",
    photoUrl: "",
  },
  {
    code: "AST-PKBM-2023-006",
    name: "Proyektor Laser Interaktif & Layar Motorized 100 Inch",
    owner: "PKBM_ASKARA",
    category: "ELEKTRONIK_TI",
    quantity: 3,
    unit: "Unit",
    acquisitionDate: new Date("2023-09-18"),
    purchaseCost: 36000000,
    currentValue: 28000000,
    fundingSource: "DANA_BOS",
    condition: "RUSAK_RINGAN",
    location: "Ruang Aula & Ruang Kelas Teori Lantai 1",
    personInCharge: "Sari Wulandari",
    description: "1 unit proyektor di Aula membutuhkan penggantian remote dan kalibrasi lensa. 2 unit lainnya di ruang kelas berfungsi optimal.",
    photoUrl: "",
  },
  {
    code: "AST-YYS-2022-003",
    name: "Genset Silent Diesel 15 KVA Otomatis ATS",
    owner: "YAYASAN",
    category: "ELEKTRONIK_TI",
    quantity: 1,
    unit: "Unit",
    acquisitionDate: new Date("2022-11-05"),
    purchaseCost: 65000000,
    currentValue: 55000000,
    fundingSource: "DANA_YAYASAN",
    condition: "BAIK",
    location: "Ruang Utilitas / Belakang Gedung Utama",
    personInCharge: "Budi Hartono",
    description: "Genset cadangan daya darurat saat pemadaman listrik agar kegiatan CBT, server, dan pembelajaran tidak terganggu.",
    photoUrl: "",
  },
  {
    code: "AST-PKBM-2024-007",
    name: "Koleksi Buku Pustaka & Modul Cetak Kurikulum Merdeka",
    owner: "PKBM_ASKARA",
    category: "BUKU_PUSTAKA",
    quantity: 450,
    unit: "Eksemplar",
    acquisitionDate: new Date("2024-03-22"),
    purchaseCost: 22500000,
    currentValue: 19000000,
    fundingSource: "DANA_BOS",
    condition: "BAIK",
    location: "Pustaka Digital & Ruang Baca Literasi (Lantai 1)",
    personInCharge: "Nurul Aini, S.Pd., M.Hum. (Koordinator Pustaka)",
    description: "Modul tematik Paket A, B, dan C, modul kecakapan hidup (life skills), serta buku bacaan literasi umum.",
    photoUrl: "",
  },
];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strictly check super_admin role
  if (user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Akses Ditolak: Fitur pencatatan aset hanya dapat diakses oleh Super Admin." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase();
  const owner = searchParams.get("owner");
  const category = searchParams.get("category");
  const condition = searchParams.get("condition");

  try {
    const assetModel = (db as any).asset;
    const count = await assetModel.count();

    if (count === 0) {
      // Seed initial assets
      for (const item of SEED_ASSETS) {
        await assetModel.create({ data: item });
      }
    }

    const whereClause: any = {};
    if (owner && owner !== "ALL") {
      whereClause.owner = owner;
    }
    if (category && category !== "ALL") {
      whereClause.category = category;
    }
    if (condition && condition !== "ALL") {
      whereClause.condition = condition;
    }

    let assets = await assetModel.findMany({
      where: whereClause,
      orderBy: { acquisitionDate: "desc" },
    });

    if (search) {
      assets = assets.filter(
        (a: any) =>
          a.name.toLowerCase().includes(search) ||
          a.code.toLowerCase().includes(search) ||
          a.location.toLowerCase().includes(search) ||
          a.personInCharge.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: assets,
    });
  } catch (error: any) {
    console.error("Failed to fetch assets:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Akses Ditolak: Hanya Super Admin yang dapat menambahkan aset." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const assetModel = (db as any).asset;

    // Generate code if empty
    let code = body.code;
    if (!code) {
      const year = new Date().getFullYear();
      const prefix = body.owner === "YAYASAN" ? "AST-YYS" : "AST-PKBM";
      const total = await assetModel.count({ where: { owner: body.owner } });
      code = `${prefix}-${year}-${String(total + 1).padStart(3, "0")}`;
    }

    const newAsset = await assetModel.create({
      data: {
        code,
        name: body.name,
        owner: body.owner || "PKBM_ASKARA",
        category: body.category || "PERALATAN_VOKASI",
        quantity: parseInt(body.quantity) || 1,
        unit: body.unit || "Unit",
        acquisitionDate: body.acquisitionDate ? new Date(body.acquisitionDate) : new Date(),
        purchaseCost: parseFloat(body.purchaseCost) || 0,
        currentValue: body.currentValue ? parseFloat(body.currentValue) : parseFloat(body.purchaseCost) || 0,
        fundingSource: body.fundingSource || "SWADAYA_PKBM",
        condition: body.condition || "BAIK",
        location: body.location || "Kampus PKBM Askara",
        personInCharge: body.personInCharge || user.name,
        description: body.description || null,
        photoUrl: body.photoUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: newAsset });
  } catch (error: any) {
    console.error("Failed to create asset:", error);
    return NextResponse.json({ error: error.message || "Gagal menambahkan aset" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Akses Ditolak: Hanya Super Admin yang dapat memperbarui data aset." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "ID aset diperlukan" }, { status: 400 });
    }

    const assetModel = (db as any).asset;
    const updated = await assetModel.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        owner: data.owner,
        category: data.category,
        quantity: parseInt(data.quantity) || 1,
        unit: data.unit,
        acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : undefined,
        purchaseCost: data.purchaseCost !== undefined ? parseFloat(data.purchaseCost) : undefined,
        currentValue: data.currentValue !== undefined ? parseFloat(data.currentValue) : undefined,
        fundingSource: data.fundingSource,
        condition: data.condition,
        location: data.location,
        personInCharge: data.personInCharge,
        description: data.description,
        photoUrl: data.photoUrl,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Failed to update asset:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui aset" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Akses Ditolak: Hanya Super Admin yang dapat menghapus aset." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID aset diperlukan" }, { status: 400 });
    }

    const assetModel = (db as any).asset;
    await assetModel.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Aset berhasil dihapus" });
  } catch (error: any) {
    console.error("Failed to delete asset:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus aset" }, { status: 500 });
  }
}
