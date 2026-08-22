import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_BRANCHES } from "@/lib/branch";

export const dynamic = "force-dynamic";

// GET: Ambil daftar seluruh Cabang / Rumah Belajar beserta metrik agregasi
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true" || !user;
    const code = searchParams.get("code");

    // Pastikan default cabang sudah ada di DB jika tabel masih kosong
    const count = await db.branch.count();
    if (count === 0) {
      for (const b of DEFAULT_BRANCHES) {
        await db.branch.upsert({
          where: { code: b.code },
          update: {},
          create: {
            code: b.code,
            name: b.name,
            address: b.address,
            city: b.city,
            province: b.province,
            phone: b.phone,
            managerName: b.managerName,
            latitude: b.latitude,
            longitude: b.longitude,
            radiusMeters: b.radiusMeters,
            isActive: b.isActive,
            notes: b.notes,
          },
        });
      }
    }

    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (code) where.code = code;

    const branches = await (db as any).branch.findMany({
      where,
      ...(user
        ? {
            include: {
              _count: {
                select: {
                  users: true,
                  students: true,
                  classes: true,
                  assets: true,
                  expenseRequests: true,
                },
              },
            },
          }
        : {}),
      orderBy: { createdAt: "asc" },
    });

    // Metrik agregasi keseluruhan
    const totalBranches = branches.length;
    const activeBranches = branches.filter((b: any) => b.isActive).length;
    const totalStudents = branches.reduce((acc: number, b: any) => acc + (b._count?.students || 0), 0);
    const totalUsers = branches.reduce((acc: number, b: any) => acc + (b._count?.users || 0), 0);
    const totalAssets = branches.reduce((acc: number, b: any) => acc + (b._count?.assets || 0), 0);

    return NextResponse.json({
      success: true,
      branches,
      stats: {
        totalBranches,
        activeBranches,
        totalStudents,
        totalUsers,
        totalAssets,
      },
    });
  } catch (error: any) {
    console.error("GET /api/cabang error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data cabang" },
      { status: 500 }
    );
  }
}

// POST: Daftarkan Cabang / Rumah Belajar Baru
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Akses ditolak. Hanya Super Admin & Admin yang dapat menambah cabang." }, { status: 403 });
    }

    const body = await req.json();
    const {
      code,
      name,
      address,
      city = "Bandung",
      province = "Jawa Barat",
      phone,
      managerName,
      latitude,
      longitude,
      radiusMeters = 100,
      isActive = true,
      notes,
    } = body;

    if (!code || !name || !address) {
      return NextResponse.json(
        { error: "Kode Cabang, Nama Rumah Belajar, dan Alamat wajib diisi!" },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim().replace(/\s+/g, "-");

    // Cek duplikasi kode
    const existing = await db.branch.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Kode Cabang '${cleanCode}' sudah digunakan oleh cabang lain!` },
        { status: 409 }
      );
    }

    const branch = await db.branch.create({
      data: {
        code: cleanCode,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        phone: phone ? phone.trim() : null,
        managerName: managerName ? managerName.trim() : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        radiusMeters: radiusMeters ? parseInt(radiusMeters, 10) : 100,
        isActive: Boolean(isActive),
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Rumah Belajar / Cabang ${branch.name} (${branch.code}) berhasil didaftarkan!`,
        branch,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/cabang error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mendaftarkan cabang baru" },
      { status: 500 }
    );
  }
}

// PUT / PATCH: Update Informasi Cabang / Geofencing
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      code,
      name,
      address,
      city,
      province,
      phone,
      managerName,
      latitude,
      longitude,
      radiusMeters,
      isActive,
      notes,
    } = body;

    if (!id && !code) {
      return NextResponse.json({ error: "ID atau Kode Cabang diperlukan" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (province !== undefined) updateData.province = province.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (managerName !== undefined) updateData.managerName = managerName ? managerName.trim() : null;
    if (latitude !== undefined) updateData.latitude = latitude !== null && latitude !== "" ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude !== null && longitude !== "" ? parseFloat(longitude) : null;
    if (radiusMeters !== undefined) updateData.radiusMeters = parseInt(radiusMeters, 10);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    const branch = id
      ? await db.branch.update({ where: { id }, data: updateData })
      : await db.branch.update({ where: { code }, data: updateData });

    return NextResponse.json({
      success: true,
      message: `Data Rumah Belajar ${branch.name} berhasil diperbarui!`,
      branch,
    });
  } catch (error: any) {
    console.error("PATCH /api/cabang error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui data cabang" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus atau nonaktifkan cabang
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Hanya Super Admin yang dapat menghapus cabang" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const code = searchParams.get("code");

    if (!id && !code) {
      return NextResponse.json({ error: "ID atau Kode Cabang diperlukan" }, { status: 400 });
    }

    const branchDb = (db as any).branch;
    const targetBranch = id
      ? await branchDb.findUnique({ where: { id }, include: { _count: { select: { students: true, users: true, assets: true } } } })
      : await branchDb.findUnique({ where: { code: code ?? undefined }, include: { _count: { select: { students: true, users: true, assets: true } } } });

    if (!targetBranch) {
      return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
    }

    if (targetBranch.code === "ASKARA-PUSAT") {
      return NextResponse.json({ error: "Cabang Utama (ASKARA-PUSAT) tidak dapat dihapus!" }, { status: 400 });
    }

    const hasRelations = (targetBranch._count.students || 0) > 0 || (targetBranch._count.users || 0) > 0 || (targetBranch._count.assets || 0) > 0;

    if (hasRelations) {
      // Soft delete / nonaktifkan jika ada relasi
      await db.branch.update({
        where: { id: targetBranch.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: `Cabang ${targetBranch.name} memiliki data terkait aktif, status berhasil diubah menjadi NON-AKTIF.`,
      });
    }

    // Hard delete jika bersih dari relasi
    await db.branch.delete({
      where: { id: targetBranch.id },
    });

    return NextResponse.json({
      success: true,
      message: `Cabang ${targetBranch.name} (${targetBranch.code}) berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/cabang error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus cabang" },
      { status: 500 }
    );
  }
}
