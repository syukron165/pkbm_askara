import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

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

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const packet = searchParams.get("packet");
    const status = searchParams.get("status");

    let whereClause: any = {};

    if (packet && packet !== "SEMUA") {
      whereClause.packetType = packet;
    }
    
    if (status && status !== "SEMUA") {
      whereClause.status = status;
    }

    if (search) {
      const q = search.toLowerCase();
      whereClause.OR = [
        { nisn: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const studentsDb = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: true,
        parent: {
          include: {
            user: true
          }
        },
        enrollments: {
          include: {
            class: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const result: StudentItem[] = studentsDb.map(s => ({
      id: s.id,
      nisn: s.nisn || "-",
      name: s.user.name,
      gender: (s.gender === "P" ? "P" : "L") as "L" | "P",
      packet: (s.packetType as any) || "Paket C",
      class: s.enrollments && s.enrollments.length > 0 ? s.enrollments[0].class.name : "Belum Ada Kelas",
      parent: s.parent?.user?.name || "-",
      phone: s.user.phone || "-",
      status: (s.status as any) || "AKTIF",
      address: s.address || "",
      birthDate: s.birthDate ? s.birthDate.toISOString().split('T')[0] : "",
      email: s.user.email,
    }));

    return NextResponse.json({ success: true, total: result.length, data: result });
  } catch (error: any) {
    console.error("GET Students Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat data siswa" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== "super_admin" && adminUser.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { nisn, name, gender, packet, class: classField, parent, phone, address, birthDate, email } = body;
    
    if (!name || !nisn) {
      return NextResponse.json({ success: false, error: "Nama siswa dan NISN wajib diisi" }, { status: 400 });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { nisn: nisn.trim() }
    });
    
    if (existingStudent) {
      return NextResponse.json({ success: false, error: `NISN ${nisn} sudah terdaftar!` }, { status: 400 });
    }

    const studentEmail = email?.trim() || `siswa.${nisn}@askara.sch.id`;
    
    const existingUser = await prisma.user.findUnique({
      where: { email: studentEmail }
    });
    
    if (existingUser) {
      return NextResponse.json({ success: false, error: `Email ${studentEmail} sudah terdaftar di sistem!` }, { status: 400 });
    }

    const defaultPassword = nisn.trim();
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newStudentData = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: studentEmail,
          phone: phone?.trim() || null,
          role: "siswa",
          passwordHash,
        }
      });

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          nisn: nisn.trim(),
          gender: gender === "P" ? "P" : "L",
          packetType: packet || "Paket C",
          status: "AKTIF",
          address: address?.trim() || null,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
        include: {
          user: true,
          parent: {
            include: { user: true }
          },
          enrollments: { include: { class: true } }
        }
      });
      
      return newStudent;
    });

    const responseItem: StudentItem = {
      id: newStudentData.id,
      nisn: newStudentData.nisn || "-",
      name: newStudentData.user.name,
      gender: (newStudentData.gender as "L" | "P") || "L",
      packet: (newStudentData.packetType as any) || "Paket C",
      class: "Belum Ada Kelas",
      parent: "-",
      phone: newStudentData.user.phone || "-",
      status: "AKTIF",
      address: newStudentData.address || "",
      birthDate: newStudentData.birthDate ? newStudentData.birthDate.toISOString().split('T')[0] : "",
      email: newStudentData.user.email,
    };

    return NextResponse.json({ 
      success: true, 
      message: `Data siswa ${responseItem.name} berhasil ditambahkan (Password: NISN)`, 
      data: responseItem 
    });

  } catch (error: any) {
    console.error("POST Student Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan data siswa" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== "super_admin" && adminUser.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { id, nisn, name, gender, packet, class: classField, parent, phone, address, birthDate, email, status } = body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingStudent) {
      return NextResponse.json({ success: false, error: "Data siswa tidak ditemukan" }, { status: 404 });
    }

    const updatedStudentData = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          name: name ? name.trim() : undefined,
          phone: phone !== undefined ? phone : undefined,
          email: email ? email.trim() : undefined,
        }
      });

      const updated = await tx.student.update({
        where: { id },
        data: {
          nisn: nisn ? nisn.trim() : undefined,
          gender: gender || undefined,
          packetType: packet || undefined,
          status: status || undefined,
          address: address !== undefined ? address : undefined,
          birthDate: birthDate !== undefined ? (birthDate ? new Date(birthDate) : null) : undefined,
        },
        include: {
          user: true,
          parent: {
            include: { user: true }
          },
          enrollments: { include: { class: true } }
        }
      });

      return updated;
    });

    const responseItem: StudentItem = {
      id: updatedStudentData.id,
      nisn: updatedStudentData.nisn || "-",
      name: updatedStudentData.user.name,
      gender: (updatedStudentData.gender as "L" | "P") || "L",
      packet: (updatedStudentData.packetType as any) || "Paket C",
      class: updatedStudentData.enrollments && updatedStudentData.enrollments.length > 0 ? updatedStudentData.enrollments[0].class.name : "Belum Ada Kelas",
      parent: updatedStudentData.parent?.user?.name || "-",
      phone: updatedStudentData.user.phone || "-",
      status: (updatedStudentData.status as any) || "AKTIF",
      address: updatedStudentData.address || "",
      birthDate: updatedStudentData.birthDate ? updatedStudentData.birthDate.toISOString().split('T')[0] : "",
      email: updatedStudentData.user.email,
    };

    return NextResponse.json({ success: true, message: "Data siswa berhasil diperbarui", data: responseItem });
  } catch (error: any) {
    console.error("PUT Student Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui data siswa" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== "super_admin" && adminUser.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Parameter ID wajib disertakan" }, { status: 400 });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingStudent) {
      return NextResponse.json({ success: false, error: "Data siswa tidak ditemukan" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: existingStudent.userId }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Data siswa ${existingStudent.user.name} berhasil dihapus`, 
      data: { id } 
    });
  } catch (error: any) {
    console.error("DELETE Student Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus data siswa" }, { status: 500 });
  }
}