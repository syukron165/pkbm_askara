import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export interface StudentItem {
  id: string;
  nisn: string;
  name: string;
  gender: "L" | "P";
  packet: "Paket A" | "Paket B" | "Paket C";
  class: string;
  parent: string;
  phone: string;
  status: "AKTIF" | "LULUS" | "MUTASI";
  address?: string;
  birthDate?: string;
  email?: string;
}

let studentsData: StudentItem[] = [
  {
    id: "s-1",
    nisn: "0081294812",
    name: "Budi Santoso",
    gender: "L",
    packet: "Paket C",
    class: "Kelas X Merdeka",
    status: "AKTIF",
    phone: "0812-3456-7890",
    parent: "Joko Santoso",
    address: "Jl. Melati No. 12, Bandung",
    birthDate: "2005-03-14",
    email: "budi.s@mail.com",
  },
  {
    id: "s-2",
    nisn: "0078912344",
    name: "Siti Rahmawati",
    gender: "P",
    packet: "Paket B",
    class: "Kelas VIII",
    status: "AKTIF",
    phone: "0813-9876-5432",
    parent: "Aminah",
    address: "Jl. Kenanga No. 7, Bandung",
    birthDate: "2007-07-22",
  },
  {
    id: "s-3",
    nisn: "0091234567",
    name: "Ahmad Fauzi",
    gender: "L",
    packet: "Paket C",
    class: "Kelas XI",
    status: "AKTIF",
    phone: "0856-1122-3344",
    parent: "Rahmat",
    address: "Jl. Mawar No. 3, Cimahi",
    birthDate: "2004-11-08",
  },
  {
    id: "s-4",
    nisn: "0065432198",
    name: "Dewi Lestari",
    gender: "P",
    packet: "Paket A",
    class: "Kelas V",
    status: "AKTIF",
    phone: "0877-5544-3322",
    parent: "Sri Wahyuni",
    address: "Jl. Anggrek Blok B2, Bandung",
    birthDate: "2010-01-30",
  },
  {
    id: "s-5",
    nisn: "0088776655",
    name: "Rian Hidayat",
    gender: "L",
    packet: "Paket C",
    class: "Kelas XII",
    status: "AKTIF",
    phone: "0819-0011-2233",
    parent: "Hidayatullah",
    address: "Jl. Cempaka No. 5, Cimahi",
    birthDate: "2003-05-19",
  },
  {
    id: "s-6",
    nisn: "0072345678",
    name: "Fitri Handayani",
    gender: "P",
    packet: "Paket C",
    class: "Kelas XI",
    status: "AKTIF",
    phone: "0813-4455-6677",
    parent: "Handoyo",
    address: "Jl. Ciumbuleuit No. 10, Bandung",
    birthDate: "2004-09-12",
  },
  {
    id: "s-7",
    nisn: "0079012355",
    name: "Fajar Nugraha",
    gender: "L",
    packet: "Paket B",
    class: "Kelas VIII",
    status: "AKTIF",
    phone: "0812-6677-8899",
    parent: "Supriyanto",
    address: "Jl. Setiabudhi No. 42, Bandung",
    birthDate: "2008-02-20",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const packet = searchParams.get("packet");
    const status = searchParams.get("status");
    let result = [...studentsData];
    if (packet && packet !== "SEMUA") {
      result = result.filter((s) => s.packet === packet);
    }
    if (status && status !== "SEMUA") {
      result = result.filter((s) => s.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nisn.includes(q) ||
          s.class.toLowerCase().includes(q) ||
          s.parent.toLowerCase().includes(q)
      );
    }
    return NextResponse.json({ success: true, total: result.length, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat data siswa" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }
    const body = await request.json();
    const { nisn, name, gender, packet, class: classField, parent, phone, address, birthDate, email } = body;
    if (!name || !nisn) {
      return NextResponse.json({ success: false, error: "Nama siswa dan NISN wajib diisi" }, { status: 400 });
    }
    const nisnExists = studentsData.some((s) => s.nisn === nisn);
    if (nisnExists) {
      return NextResponse.json({ success: false, error: `NISN ${nisn} sudah terdaftar!` }, { status: 400 });
    }
    const newStudent: StudentItem = {
      id: `s-${Date.now()}`,
      nisn: nisn.trim(),
      name: name.trim(),
      gender: gender === "P" ? "P" : "L",
      packet: packet || "Paket C",
      class: classField?.trim() || "Kelas X Merdeka",
      parent: parent?.trim() || "-",
      phone: phone?.trim() || "-",
      status: "AKTIF",
      address: address?.trim() || undefined,
      birthDate: birthDate || undefined,
      email: email?.trim() || undefined,
    };
    studentsData.unshift(newStudent);
    return NextResponse.json({ success: true, message: `Data siswa ${newStudent.name} berhasil ditambahkan`, data: newStudent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan data siswa" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }
    const body = await request.json();
    const { id, nisn, name, gender, packet, class: classField, parent, phone, address, birthDate, email, status } = body;
    const index = studentsData.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Data siswa tidak ditemukan" }, { status: 404 });
    }
    studentsData[index] = {
      ...studentsData[index],
      nisn: nisn ? nisn.trim() : studentsData[index].nisn,
      name: name ? name.trim() : studentsData[index].name,
      gender: gender || studentsData[index].gender,
      packet: packet || studentsData[index].packet,
      class: classField !== undefined ? classField : studentsData[index].class,
      parent: parent !== undefined ? parent : studentsData[index].parent,
      phone: phone !== undefined ? phone : studentsData[index].phone,
      address: address !== undefined ? address : studentsData[index].address,
      birthDate: birthDate !== undefined ? birthDate : studentsData[index].birthDate,
      email: email !== undefined ? email : studentsData[index].email,
      status: status || studentsData[index].status,
    };
    return NextResponse.json({ success: true, message: "Data siswa berhasil diperbarui", data: studentsData[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui data siswa" }, { status: 500 });
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
    const index = studentsData.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Data siswa tidak ditemukan" }, { status: 404 });
    }
    const removed = studentsData.splice(index, 1)[0];
    return NextResponse.json({ success: true, message: `Data siswa ${removed.name} berhasil dihapus`, data: removed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus data siswa" }, { status: 500 });
  }
}