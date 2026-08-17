import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export interface TeacherItem {
  id: string;
  name: string;
  nip?: string;
  role: string;
  email: string;
  phone: string;
  classes: string;
  status: "AKTIF" | "NON-AKTIF";
  specialization?: string;
  address?: string;
  joinDate?: string;
  photoUrl?: string;
}

let teachersData: TeacherItem[] = [
  {
    id: "t-1",
    name: "Drs. Hendra Gunawan",
    nip: "197503152005011002",
    role: "Tutor Matematika",
    email: "hendra@askara.sch.id",
    phone: "0812-1111-2222",
    classes: "Paket C (Kelas X, XI, XII)",
    status: "AKTIF",
    specialization: "Matematika & Statistika",
    address: "Jl. Cihampelas No. 24, Bandung",
    joinDate: "2010-07-01",
  },
  {
    id: "t-2",
    name: "Nurul Aini, S.Pd.",
    nip: "198206202008012010",
    role: "Tutor Bahasa Indonesia",
    email: "nurul@askara.sch.id",
    phone: "0813-2222-3333",
    classes: "Paket B & Paket C",
    status: "AKTIF",
    specialization: "Bahasa & Sastra Indonesia",
    address: "Jl. Riau No. 8, Bandung",
    joinDate: "2013-01-15",
  },
  {
    id: "t-3",
    name: "Bambang Sutrisno, M.Si.",
    nip: "197912102006041003",
    role: "Tutor IPA & Sains",
    email: "bambang@askara.sch.id",
    phone: "0856-3333-4444",
    classes: "Paket A & Paket B",
    status: "AKTIF",
    specialization: "Ilmu Pengetahuan Alam",
    address: "Jl. Pasir Kaliki No. 3, Cimahi",
    joinDate: "2008-08-01",
  },
  {
    id: "t-4",
    name: "Dewi Anggraini, S.Kom.",
    nip: "199001052015012005",
    role: "Instruktur Vokasi & Keterampilan",
    email: "dewi@askara.sch.id",
    phone: "0877-4444-5555",
    classes: "Vokasi & Keterampilan",
    status: "AKTIF",
    specialization: "Teknologi Informasi & Komputer",
    address: "Jl. Sukajadi No. 77, Bandung",
    joinDate: "2018-03-01",
  },
  {
    id: "t-5",
    name: "Bayu Pratama, S.Kom.",
    nip: "199204182019021004",
    role: "Instruktur Desain & Multimedia",
    email: "bayu@askara.sch.id",
    phone: "0819-5555-6666",
    classes: "Vokasi & Keterampilan",
    status: "AKTIF",
    specialization: "Desain Grafis & Digital Kreatif",
    address: "Jl. Setiabudi No. 45, Bandung",
    joinDate: "2019-02-01",
  },
  {
    id: "t-6",
    name: "Siti Rahmawati, S.Pd.",
    nip: "198507222011012008",
    role: "Tutor IPS & Sosial Humaniora",
    email: "siti.rahmawati@askara.sch.id",
    phone: "0821-6666-7777",
    classes: "Paket B & Paket C",
    status: "AKTIF",
    specialization: "Ilmu Pengetahuan Sosial",
    address: "Jl. Buah Batu No. 112, Bandung",
    joinDate: "2015-08-01",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    let result = [...teachersData];
    if (status && status !== "SEMUA") {
      result = result.filter((t) => t.status.toUpperCase() === status.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.role.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          (t.specialization ?? "").toLowerCase().includes(q) ||
          (t.nip ?? "").includes(q)
      );
    }
    return NextResponse.json({ success: true, total: result.length, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat data guru" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }
    const body = await request.json();
    const { name, nip, role, email, phone, classes, specialization, address, joinDate } = body;
    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Nama dan email wajib diisi" }, { status: 400 });
    }
    const emailExists = teachersData.some((t) => t.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return NextResponse.json({ success: false, error: `Email ${email} sudah terdaftar!` }, { status: 400 });
    }
    const newTeacher: TeacherItem = {
      id: `t-${Date.now()}`,
      name: name.trim(),
      nip: nip?.trim() || undefined,
      role: role?.trim() || "Tutor",
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "-",
      classes: classes?.trim() || "-",
      status: "AKTIF",
      specialization: specialization?.trim() || undefined,
      address: address?.trim() || undefined,
      joinDate: joinDate || undefined,
    };
    teachersData.unshift(newTeacher);
    return NextResponse.json({ success: true, message: `Data pendidik ${newTeacher.name} berhasil ditambahkan`, data: newTeacher });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan data guru" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }
    const body = await request.json();
    const { id, name, nip, role, email, phone, classes, specialization, address, joinDate, status } = body;
    const index = teachersData.findIndex((t) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Data guru tidak ditemukan" }, { status: 404 });
    }
    teachersData[index] = {
      ...teachersData[index],
      name: name ? name.trim() : teachersData[index].name,
      nip: nip !== undefined ? nip?.trim() || undefined : teachersData[index].nip,
      role: role ? role.trim() : teachersData[index].role,
      email: email ? email.trim().toLowerCase() : teachersData[index].email,
      phone: phone !== undefined ? phone : teachersData[index].phone,
      classes: classes !== undefined ? classes : teachersData[index].classes,
      specialization: specialization !== undefined ? specialization : teachersData[index].specialization,
      address: address !== undefined ? address : teachersData[index].address,
      joinDate: joinDate !== undefined ? joinDate : teachersData[index].joinDate,
      status: status || teachersData[index].status,
    };
    return NextResponse.json({ success: true, message: "Data pendidik berhasil diperbarui", data: teachersData[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui data guru" }, { status: 500 });
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
    const index = teachersData.findIndex((t) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Data guru tidak ditemukan" }, { status: 404 });
    }
    const removed = teachersData.splice(index, 1)[0];
    return NextResponse.json({ success: true, message: `Data pendidik ${removed.name} berhasil dihapus`, data: removed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus data guru" }, { status: 500 });
  }
}