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

let teachersData: TeacherItem[] = [];

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