import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export interface ManagementPersonnel {
  id: string;
  name: string;
  nip?: string;
  position: string; // Jabatan Struktural
  department: string; // Divisi / Bidang
  email: string;
  phone: string;
  status: "AKTIF" | "CUTI" | "NON-AKTIF";
  address?: string;
  joinDate?: string;
  skNumber?: string;
  photoUrl?: string;
  responsibilities?: string;
}

let managementData: ManagementPersonnel[] = [
  {
    id: "mgt-1",
    name: "Dra. Hj. Siti Aminah, M.Pd.",
    nip: "196805121994032001",
    position: "Kepala PKBM / Penanggung Jawab",
    department: "Pimpinan & Struktural",
    email: "kepala@askara.sch.id",
    phone: "0812-3456-7890",
    status: "AKTIF",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces&q=80",
    address: "Jl. Dago Asri No. 12, Bandung",
    joinDate: "2015-06-01",
    skNumber: "SK-PKBM/001/VI/2015",
    responsibilities: "Memimpin penyelenggaraan pendidikan kesetaraan, pengambilan keputusan strategis lembaga, dan kemitraan dinas/instansi.",
  },
  {
    id: "mgt-2",
    name: "Drs. Hendra Gunawan",
    nip: "197503152005011002",
    position: "Wakil Kepala PKBM & Kurikulum",
    department: "Akademik & Kurikulum",
    email: "hendra@askara.sch.id",
    phone: "0812-1111-2222",
    status: "AKTIF",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=faces&q=80",
    address: "Jl. Cihampelas No. 24, Bandung",
    joinDate: "2016-01-15",
    skNumber: "SK-PKBM/014/I/2016",
    responsibilities: "Mengembangkan kurikulum merdeka kesetaraan, supervisi pembelajaran tutor, dan pelaksanaan asesmen/e-Rapor.",
  },
  {
    id: "mgt-3",
    name: "Rina Marlina, S.Sos.",
    nip: "198409152010012015",
    position: "Kepala Tata Usaha & Kepegawaian",
    department: "Tata Usaha & HRD",
    email: "tu@askara.sch.id",
    phone: "0813-7777-8888",
    status: "AKTIF",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=faces&q=80",
    address: "Jl. Antapani Raya No. 45, Bandung",
    joinDate: "2017-03-01",
    skNumber: "SK-PKBM/022/III/2017",
    responsibilities: "Pengelolaan surat menyurat, persuratan dinas, arsip ijazah, dan administrasi kepegawaian staf & pendidik.",
  },
  {
    id: "mgt-4",
    name: "Maya Indriani, S.E.",
    nip: "198811202014022008",
    position: "Bendahara & Pengelola Keuangan",
    department: "Keuangan & Perbendaharaan",
    email: "keuangan@askara.sch.id",
    phone: "0857-8888-9999",
    status: "AKTIF",
    photoUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=faces&q=80",
    address: "Jl. Buah Batu No. 89, Bandung",
    joinDate: "2018-07-01",
    skNumber: "SK-PKBM/035/VII/2018",
    responsibilities: "Pencatatan SPP, realisasi BOP, verifikasi pengajuan biaya operasional, dan penyusunan laporan keuangan lembaga.",
  },
  {
    id: "mgt-5",
    name: "Bayu Pratama, S.Kom.",
    nip: "199204182019021004",
    position: "Operator Dapodik & IT Administrator",
    department: "IT & Operator Data",
    email: "it@askara.sch.id",
    phone: "0819-5555-6666",
    status: "AKTIF",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&q=80",
    address: "Jl. Setiabudi No. 45, Bandung",
    joinDate: "2019-02-01",
    skNumber: "SK-PKBM/041/II/2019",
    responsibilities: "Sinkronisasi Dapodik Kemdikbud, pengelolaan server web app, infrastruktur CBT online, dan jaringan sekolah.",
  },
  {
    id: "mgt-6",
    name: "Ahmad Fauzan, S.Pd.",
    nip: "198702142012011009",
    position: "Koordinator Kesiswaan & Club Belajar",
    department: "Kesiswaan & Ekstrakurikuler",
    email: "kesiswaan@askara.sch.id",
    phone: "0822-4444-1111",
    status: "AKTIF",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80",
    address: "Jl. Soekarno Hatta No. 201, Bandung",
    joinDate: "2019-08-01",
    skNumber: "SK-PKBM/048/VIII/2019",
    responsibilities: "Pembinaan karakter warga belajar, koordinasi kegiatan Club Belajar, PPDB, dan penanganan aspirasi siswa.",
  },
  {
    id: "mgt-7",
    name: "Dewi Anggraini, S.Kom.",
    nip: "199001052015012005",
    position: "Koordinator Sarpras & Lab Vokasi",
    department: "Sarana & Prasarana",
    email: "sarpras@askara.sch.id",
    phone: "0877-4444-5555",
    status: "AKTIF",
    photoUrl: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=400&h=400&fit=crop&crop=faces&q=80",
    address: "Jl. Sukajadi No. 77, Bandung",
    joinDate: "2020-01-10",
    skNumber: "SK-PKBM/052/I/2020",
    responsibilities: "Inventarisasi aset PKBM, pemeliharaan lab vokasi/komputer, logistik perlengkapan belajar, dan ruang kelas.",
  },
  {
    id: "mgt-8",
    name: "Nurul Aini, S.Pd.",
    nip: "198206202008012010",
    position: "Staff Penjaminan Mutu Pendidikan",
    department: "Penjaminan Mutu",
    email: "nurul@askara.sch.id",
    phone: "0813-2222-3333",
    status: "AKTIF",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces&q=80",
    address: "Jl. Riau No. 8, Bandung",
    joinDate: "2020-07-01",
    skNumber: "SK-PKBM/059/VII/2020",
    responsibilities: "Monitoring kepatuhan standar SPM pendidikan kesetaraan, evaluasi kepuasan peserta didik, dan akreditasi BAN-PDM.",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    let result = [...managementData];

    if (department && department !== "SEMUA") {
      result = result.filter((m) => m.department.toLowerCase() === department.toLowerCase());
    }

    if (status && status !== "SEMUA") {
      result = result.filter((m) => m.status.toUpperCase() === status.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.position.toLowerCase().includes(q) ||
          m.department.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.nip ?? "").includes(q) ||
          (m.skNumber ?? "").toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
      stats: {
        total: managementData.length,
        active: managementData.filter((m) => m.status === "AKTIF").length,
        pimpinan: managementData.filter((m) => m.department.includes("Pimpinan") || m.department.includes("Akademik")).length,
        operasional: managementData.filter((m) => !m.department.includes("Pimpinan")).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data manajemen" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { name, nip, position, department, email, phone, address, joinDate, skNumber, photoUrl, responsibilities } = body;

    if (!name || !position || !department) {
      return NextResponse.json(
        { success: false, error: "Nama, Jabatan, dan Departemen wajib diisi" },
        { status: 400 }
      );
    }

    const newPersonnel: ManagementPersonnel = {
      id: `mgt-${Date.now()}`,
      name: name.trim(),
      nip: nip?.trim() || undefined,
      position: position.trim(),
      department: department.trim(),
      email: email?.trim().toLowerCase() || `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@askara.sch.id`,
      phone: phone?.trim() || "-",
      status: "AKTIF",
      photoUrl: photoUrl?.trim() || undefined,
      address: address?.trim() || undefined,
      joinDate: joinDate || new Date().toISOString().split("T")[0],
      skNumber: skNumber?.trim() || undefined,
      responsibilities: responsibilities?.trim() || undefined,
    };

    managementData.unshift(newPersonnel);

    return NextResponse.json({
      success: true,
      message: `Personel manajemen ${newPersonnel.name} berhasil ditambahkan`,
      data: newPersonnel,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan data manajemen" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, nip, position, department, email, phone, address, joinDate, skNumber, photoUrl, responsibilities, status } = body;

    const index = managementData.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Data personel tidak ditemukan" }, { status: 404 });
    }

    managementData[index] = {
      ...managementData[index],
      name: name ? name.trim() : managementData[index].name,
      nip: nip !== undefined ? nip?.trim() || undefined : managementData[index].nip,
      position: position ? position.trim() : managementData[index].position,
      department: department ? department.trim() : managementData[index].department,
      email: email ? email.trim().toLowerCase() : managementData[index].email,
      phone: phone !== undefined ? phone : managementData[index].phone,
      address: address !== undefined ? address : managementData[index].address,
      joinDate: joinDate !== undefined ? joinDate : managementData[index].joinDate,
      skNumber: skNumber !== undefined ? skNumber : managementData[index].skNumber,
      photoUrl: photoUrl !== undefined ? photoUrl : managementData[index].photoUrl,
      responsibilities: responsibilities !== undefined ? responsibilities : managementData[index].responsibilities,
      status: status || managementData[index].status,
    };

    return NextResponse.json({
      success: true,
      message: "Data personel manajemen berhasil diperbarui",
      data: managementData[index],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui data personel" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Parameter ID wajib disertakan" }, { status: 400 });
    }

    const index = managementData.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Data personel tidak ditemukan" }, { status: 404 });
    }

    const removed = managementData.splice(index, 1)[0];
    return NextResponse.json({
      success: true,
      message: `Personel manajemen ${removed.name} berhasil dihapus`,
      data: removed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus data personel" },
      { status: 500 }
    );
  }
}
