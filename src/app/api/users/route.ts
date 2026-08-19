import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/users - Fetch list of users with multi-role filters & summary statistics
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["super_admin", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role") || "all";
    const statusParam = searchParams.get("status") || "all";
    const query = searchParams.get("q")?.toLowerCase()?.trim() || "";

    // Fetch all users to compute live tab counts and filter
    const allUsers = await db.user.findMany({
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                class: true,
              },
            },
          },
        },
        parentProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute stats
    let totalSiswa = 0;
    let totalTutor = 0;
    let totalOrangTua = 0;
    let totalManajemen = 0;
    let totalActive = 0;
    let totalInactive = 0;

    const manajemenRoles = ["admin", "super_admin", "bendahara", "staff", "kepala_sekolah"];

    allUsers.forEach((u) => {
      const r = u.role.toLowerCase();
      if (r === "siswa") totalSiswa++;
      if (r.includes("pendidik") || r.includes("guru") || r.includes("tutor")) totalTutor++;
      if (r === "orang_tua" || r === "orangtua") totalOrangTua++;
      if (manajemenRoles.some((m) => r.includes(m))) totalManajemen++;

      if (u.isActive) totalActive++;
      else totalInactive++;
    });

    // Apply filtering
    const filteredUsers = allUsers.filter((u) => {
      const r = u.role.toLowerCase();

      // Role filter
      if (roleParam !== "all") {
        if (roleParam === "siswa" && r !== "siswa") return false;
        if (
          (roleParam === "tutor" || roleParam === "pendidik") &&
          !r.includes("pendidik") &&
          !r.includes("guru") &&
          !r.includes("tutor")
        )
          return false;
        if (roleParam === "orang_tua" && !["orang_tua", "orangtua"].includes(r)) return false;
        if (roleParam === "manajemen" && !manajemenRoles.some((m) => r.includes(m))) return false;
      }

      // Status filter
      if (statusParam === "active" && !u.isActive) return false;
      if (statusParam === "inactive" && u.isActive) return false;

      // Search query
      if (query) {
        const matchName = u.name?.toLowerCase().includes(query);
        const matchEmail = u.email?.toLowerCase().includes(query);
        const matchPhone = u.phone?.toLowerCase().includes(query);
        const matchNik = u.nik?.toLowerCase().includes(query);
        const matchNisn = u.studentProfile?.nisn?.toLowerCase().includes(query);
        const matchPacket = u.studentProfile?.packetType?.toLowerCase().includes(query);
        const matchClass = u.studentProfile?.enrollments?.some((e) =>
          e.class?.name?.toLowerCase().includes(query)
        );

        if (!matchName && !matchEmail && !matchPhone && !matchNik && !matchNisn && !matchPacket && !matchClass) {
          return false;
        }
      }

      return true;
    });

    const formattedUsers = filteredUsers.map((u) => {
      const r = u.role.toLowerCase();
      const currentClass = u.studentProfile?.enrollments?.[0]?.class?.name || "-";
      const roles = r.split(",").map((s) => s.trim()).filter(Boolean);
      const isDualRole = roles.length > 1;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        roles,
        isDualRole,
        roleCategory:
          roles.length > 1
            ? "dual_role"
            : r === "siswa"
            ? "siswa"
            : r.includes("pendidik") || r.includes("guru") || r.includes("tutor")
            ? "tutor"
            : ["orang_tua", "orangtua", "wali"].includes(r)
            ? "orang_tua"
            : "manajemen",
        phone: u.phone || "-",
        nik: u.nik || "-",
        gender: u.gender || "-",
        address: u.address || "-",
        avatarUrl: u.avatarUrl || null,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        studentInfo: u.studentProfile
          ? {
              id: u.studentProfile.id,
              nisn: u.studentProfile.nisn || "-",
              packetType: u.studentProfile.packetType,
              studyModel: u.studentProfile.studyModel || "Reguler",
              status: u.studentProfile.status,
              currentClass,
            }
          : null,
        parentInfo: u.parentProfile
          ? {
              id: u.parentProfile.id,
              relationship: u.parentProfile.relationship || "Wali",
              job: u.parentProfile.job || "-",
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      stats: {
        totalUsers: allUsers.length,
        totalSiswa,
        totalTutor,
        totalOrangTua,
        totalManajemen,
        totalActive,
        totalInactive,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/users] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memuat data pengguna" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user manually
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["super_admin", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "siswa",
      phone,
      nik,
      gender = "L",
      birthPlace,
      birthDate,
      address,
      isActive = true,
      // Siswa fields
      packetType = "Paket C",
      studyModel = "Reguler",
      nisn,
      // Orang Tua fields
      relationship = "ORANG_TUA",
      job,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama lengkap pengguna wajib diisi" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Alamat email wajib diisi" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Kata sandi minimal harus 6 karakter" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Alamat email ini sudah terdaftar. Gunakan email lain." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const cleanRole = role.toLowerCase().trim();

    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: cleanRole,
          phone: phone?.trim() || null,
          nik: nik?.trim() || null,
          gender: gender || null,
          birthPlace: birthPlace?.trim() || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          address: address?.trim() || null,
          isActive: Boolean(isActive),
          emailVerified: true,
        },
      });

      if (cleanRole.includes("siswa")) {
        await tx.student.create({
          data: {
            userId: user.id,
            nisn: nisn?.trim() || `00${Date.now().toString().slice(-8)}`,
            nik: nik?.trim() || null,
            gender: gender || "L",
            birthPlace: birthPlace?.trim() || "Bandung",
            birthDate: birthDate ? new Date(birthDate) : new Date("2008-01-01"),
            address: address?.trim() || "Kota Bandung",
            packetType: packetType || "Paket C",
            studyModel: studyModel || "Reguler",
            status: "ACTIVE",
          },
        });
      }

      if (cleanRole.includes("orang_tua") || cleanRole.includes("orangtua") || cleanRole.includes("wali")) {
        await tx.parent.create({
          data: {
            userId: user.id,
            relationship: relationship || "ORANG_TUA",
            job: job?.trim() || null,
            address: address?.trim() || null,
          },
        });
      }

      return user;
    });

    return NextResponse.json(
      {
        success: true,
        message: `Pengguna ${newUser.name} berhasil ditambahkan dengan peran ${newUser.role.toUpperCase()}`,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/users] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menambahkan akun pengguna" },
      { status: 500 }
    );
  }
}

// PUT /api/users - Edit user profile, role, & update password
export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["super_admin", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      email,
      role,
      phone,
      nik,
      gender,
      address,
      isActive,
      newPassword,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID pengguna wajib disertakan" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id },
      include: { parentProfile: true, studentProfile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (nik !== undefined) updateData.nik = nik ? nik.trim() : null;
    if (gender !== undefined) updateData.gender = gender;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (newPassword && typeof newPassword === "string" && newPassword.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    const newRole = updateData.role || targetUser.role;

    // Sync Parent profile if role has orang_tua
    if ((newRole.includes("orang_tua") || newRole.includes("orangtua") || newRole.includes("wali")) && !targetUser.parentProfile) {
      await db.parent.create({
        data: {
          userId: id,
          relationship: "ORANG_TUA",
          job: null,
          address: targetUser.address || null,
        },
      });
    }

    // Sync Student profile if role has siswa
    if (newRole.includes("siswa") && !targetUser.studentProfile) {
      await db.student.create({
        data: {
          userId: id,
          nisn: `00${Date.now().toString().slice(-8)}`,
          packetType: "Paket C",
          status: "ACTIVE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Data pengguna ${updatedUser.name} berhasil diperbarui`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("[PUT /api/users] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui data pengguna" },
      { status: 500 }
    );
  }
}

// PATCH /api/users - Quick Toggle Active Status
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["super_admin", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "ID pengguna dan status boolean wajib disertakan" }, { status: 400 });
    }

    // Protect self-deactivation
    if (id === currentUser.id && !isActive) {
      return NextResponse.json(
        { error: "Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif!" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      message: `Status akun ${updatedUser.name} berhasil diubah menjadi ${isActive ? "AKTIF" : "NON-AKTIF"}`,
      isActive: updatedUser.isActive,
    });
  } catch (error: any) {
    console.error("[PATCH /api/users] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui status keaktifan pengguna" },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Delete user account safely
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["super_admin", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID pengguna wajib disertakan" }, { status: 400 });
    }

    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang login!" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id },
      include: { studentProfile: true, parentProfile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      // Unlink student profile if any
      if (targetUser.studentProfile) {
        await tx.classEnrollment.deleteMany({
          where: { studentId: targetUser.studentProfile.id },
        });
        await tx.student.delete({
          where: { id: targetUser.studentProfile.id },
        });
      }

      // Unlink parent profile if any
      if (targetUser.parentProfile) {
        await tx.parent.delete({
          where: { id: targetUser.parentProfile.id },
        });
      }

      // Delete user
      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Akun pengguna ${targetUser.name} (${targetUser.email}) berhasil dihapus permanen.`,
    });
  } catch (error: any) {
    console.error("[DELETE /api/users] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
