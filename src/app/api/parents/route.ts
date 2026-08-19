import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export interface ParentItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  job?: string;
  address?: string;
  studentsCount: number;
  isActive: boolean;
  roles: string[];
  isTeacherRole: boolean;
  isManagementRole: boolean;
  isDualRole: boolean;
  children: Array<{ id: string; name: string; nisn: string; packetType: string; className: string }>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let whereClause: any = {};

    if (search) {
      const q = search.toLowerCase();
      whereClause.user = {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const parentsDb = await db.parent.findMany({
      where: whereClause,
      include: {
        user: true,
        students: {
          include: {
            user: true,
            enrollments: {
              include: {
                class: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result: ParentItem[] = parentsDb.map((p) => {
      const userRoles = (p.user.role || "")
        .split(",")
        .map((r) => r.trim().toLowerCase())
        .filter(Boolean);

      const isTeacherRole = userRoles.some((r) => ["pendidik", "guru", "tutor"].includes(r));
      const isManagementRole = userRoles.some((r) => ["admin", "super_admin", "bendahara", "staff", "management"].includes(r));
      const isDualRole = userRoles.length > 1;

      const children = (p.students || []).map((s) => ({
        id: s.id,
        name: s.user.name,
        nisn: s.nisn || "-",
        packetType: s.packetType,
        className: s.enrollments[0]?.class?.name || "-",
      }));

      return {
        id: p.id,
        userId: p.userId,
        name: p.user.name,
        email: p.user.email,
        phone: p.user.phone || "-",
        relationship: p.relationship,
        job: p.job || undefined,
        address: p.address || p.user.address || undefined,
        studentsCount: children.length,
        isActive: p.user.isActive,
        roles: userRoles,
        isTeacherRole,
        isManagementRole,
        isDualRole,
        children,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("GET /api/parents Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data orang tua" },
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
    const { name, email, phone, relationship, job, address, childrenStudentIds, studentIds } = body;

    // Mendukung kedua penamaan properti dari UI (childrenStudentIds atau studentIds)
    const targetStudentIds = childrenStudentIds || studentIds || [];

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Nama dan email wajib diisi" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
      include: { parentProfile: true },
    });

    let parentRecordId: string | null = null;

    if (existingUser) {
      // Menggabungkan role jika user sudah terdaftar di sistem
      const existingRolesSet = new Set(
        existingUser.role.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean)
      );
      existingRolesSet.add("orang_tua");
      const updatedRolesStr = Array.from(existingRolesSet).join(",");

      await db.user.update({
        where: { id: existingUser.id },
        data: {
          role: updatedRolesStr,
          phone: phone?.trim() || existingUser.phone,
          address: address?.trim() || existingUser.address,
        },
      });

      const parentRecord = await db.parent.upsert({
        where: { userId: existingUser.id },
        create: {
          userId: existingUser.id,
          relationship: relationship || "Ayah",
          job: job?.trim() || null,
          address: address?.trim() || null,
        },
        update: {
          relationship: relationship || undefined,
          job: job !== undefined ? job.trim() : undefined,
          address: address !== undefined ? address.trim() : undefined,
        },
      });
      parentRecordId = parentRecord.id;
    } else {
      const passwordHash = await bcrypt.hash("askara123", 10);

      const newParentUser = await db.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role: "orang_tua",
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          isActive: true,
          emailVerified: true,
          parentProfile: {
            create: {
              relationship: relationship || "Ayah",
              job: job?.trim() || null,
              address: address?.trim() || null,
            },
          },
        },
        include: {
          parentProfile: true,
        },
      });
      parentRecordId = newParentUser.parentProfile?.id || null;
    }

    // Menghubungkan siswa (anak) ke profil orang tua
    if (parentRecordId && Array.isArray(targetStudentIds) && targetStudentIds.length > 0) {
      await db.student.updateMany({
        where: { id: { in: targetStudentIds } },
        data: { parentId: parentRecordId },
      });
    }

    return NextResponse.json({
      success: true,
      message: existingUser
        ? `Akun ${existingUser.name} (${cleanEmail}) berhasil diintegrasikan dengan peran ganda sebagai Orang Tua / Wali!`
        : `Akun Orang Tua ${name.trim()} berhasil dibuat!`,
    });
  } catch (error: any) {
    console.error("POST /api/parents Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambah orang tua" },
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
    const { id, userId, name, email, phone, relationship, job, address, isActive, childrenStudentIds, studentIds } = body;

    const targetStudentIds = childrenStudentIds || studentIds;

    if (!id || !userId) {
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: {
          name: name ? name.trim() : undefined,
          email: email ? email.trim().toLowerCase() : undefined,
          phone: phone !== undefined ? phone.trim() : undefined,
          address: address !== undefined ? address.trim() : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
        },
      }),
      db.parent.update({
        where: { id },
        data: {
          relationship: relationship || undefined,
          job: job !== undefined ? job.trim() : undefined,
          address: address !== undefined ? address.trim() : undefined,
        },
      }),
    ]);

    if (Array.isArray(targetStudentIds)) {
      await db.student.updateMany({
        where: { parentId: id, id: { notIn: targetStudentIds } },
        data: { parentId: null },
      });

      if (targetStudentIds.length > 0) {
        await db.student.updateMany({
          where: { id: { in: targetStudentIds } },
          data: { parentId: id },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Data orang tua berhasil diperbarui" });
  } catch (error: any) {
    console.error("PUT /api/parents Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengubah orang tua" },
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
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    const parent = await db.parent.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!parent) {
      return NextResponse.json({ success: false, error: "Orang tua tidak ditemukan" }, { status: 404 });
    }

    // Jika user punya peran lain (misal pendidik/admin), hanya hapus profile parent dan cabut role orang_tua
    const userRoles = (parent.user.role || "").split(",").map((r) => r.trim()).filter((r) => r !== "orang_tua" && r !== "orangtua");

    if (userRoles.length > 0) {
      await db.student.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      });
      await db.parent.delete({ where: { id } });
      await db.user.update({
        where: { id: parent.userId },
        data: { role: userRoles.join(",") },
      });
      return NextResponse.json({
        success: true,
        message: `Hak akses Orang Tua untuk akun ${parent.user.name} berhasil dinonaktifkan (Akun utama tetap aktif sebagai ${userRoles.join(', ')})`,
      });
    } else {
      await db.student.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      });
      await db.parent.delete({ where: { id } });
      await db.user.delete({ where: { id: parent.userId } });
      return NextResponse.json({ success: true, message: "Data orang tua berhasil dihapus" });
    }
  } catch (error: any) {
    console.error("DELETE /api/parents Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus orang tua" },
      { status: 500 }
    );
  }
}