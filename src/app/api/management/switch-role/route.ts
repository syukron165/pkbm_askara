import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Super Admin & Admin yang berwenang." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, targetRole, department, position, teachingSubject, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ID personel (userId) wajib diisi." },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Data personel tidak ditemukan di database." },
        { status: 404 }
      );
    }

    let newRole = targetUser.role;
    let shouldBeActive = targetUser.isActive;

    switch (targetRole) {
      case "MANAJEMEN_ONLY":
        // Only in management (admin / staff TU)
        newRole = "admin";
        shouldBeActive = true;
        break;

      case "TUTOR_ONLY":
        // Transferred exclusively to teaching / tutor corps
        newRole = "pendidik";
        shouldBeActive = true;
        break;

      case "DUAL_ROLE":
        // Involved in both management and teaching
        newRole = "admin,pendidik";
        shouldBeActive = true;
        break;

      case "BENDAHARA":
        newRole = "bendahara";
        shouldBeActive = true;
        break;

      case "SUPER_ADMIN":
        newRole = "super_admin";
        shouldBeActive = true;
        break;

      case "NONAKTIF":
        shouldBeActive = false;
        break;

      case "AKTIF":
        shouldBeActive = true;
        break;

      default:
        if (targetRole) newRole = targetRole;
        break;
    }

    if (isActive !== undefined) {
      shouldBeActive = Boolean(isActive);
    }

    // Update user in DB
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        isActive: shouldBeActive,
      },
    });

    // Update linked public registration if exists
    const pubReg = await db.publicRegistration.findFirst({
      where: {
        OR: [
          { createdUserId: userId },
          { email: targetUser.email },
        ],
      },
    });

    if (pubReg) {
      let regType = pubReg.type;
      if (newRole.includes("pendidik") && !newRole.includes("admin")) {
        regType = "TUTOR";
      } else if (newRole.includes("admin") || newRole.includes("bendahara") || newRole.includes("super_admin")) {
        regType = "MANAJEMEN";
      }

      await db.publicRegistration.update({
        where: { id: pubReg.id },
        data: {
          type: regType,
          positionApplied: position || pubReg.positionApplied,
          majorStudy: teachingSubject || pubReg.majorStudy,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Peran untuk ${targetUser.name} berhasil diubah menjadi: ${newRole} (Status: ${shouldBeActive ? "Aktif" : "Non-Aktif"})`,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isActive: updated.isActive,
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/management/switch-role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengubah peran personel" },
      { status: 500 }
    );
  }
}
