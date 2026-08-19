import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, signJWT, AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth";
import { ROLE_CONFIGS, Role } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, selectedRole } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        studentProfile: true,
        parentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak ditemukan dalam sistem resmi" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          error:
            "Akun Anda masih dalam proses verifikasi pendaftaran oleh pihak sekolah atau berstatus non-aktif. Silakan tunggu persetujuan Admin / Kepala Sekolah.",
        },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah" },
        { status: 401 }
      );
    }

    // Collect all valid roles for this user
    const userRolesSet = new Set<Role>();
    const rawRole = (user.role || "").toLowerCase();

    let parentRecordId: string | null = user.parentProfile?.id || null;

    if (rawRole.includes("super_admin")) {
      userRolesSet.add("super_admin");
      userRolesSet.add("admin");
      userRolesSet.add("bendahara");
      userRolesSet.add("pendidik");
      userRolesSet.add("siswa");
      userRolesSet.add("orang_tua");
    } else {
      // Parse comma-separated roles in DB
      rawRole.split(",").forEach((r) => {
        const trimmed = r.trim();
        if (ROLE_CONFIGS[trimmed as Role]) userRolesSet.add(trimmed as Role);
        if (trimmed === "guru" || trimmed === "tutor") userRolesSet.add("pendidik");
        if (trimmed === "orangtua" || trimmed === "wali") userRolesSet.add("orang_tua");
        if (trimmed === "staff" || trimmed === "management") userRolesSet.add("admin");
        if (trimmed === "keuangan") userRolesSet.add("bendahara");
      });

      // Check linked profiles
      if (user.parentProfile) userRolesSet.add("orang_tua");
      if (user.studentProfile) userRolesSet.add("siswa");

      // Check if parent record exists
      const parentRecord = await db.parent.findFirst({
        where: { OR: [{ userId: user.id }, { user: { email: user.email } }] },
      });
      if (parentRecord) {
        userRolesSet.add("orang_tua");
        if (!parentRecordId) parentRecordId = parentRecord.id;
      }

      if (userRolesSet.size === 0) {
        userRolesSet.add("siswa");
      }
    }

    const userRoles: Role[] = Array.from(userRolesSet);
    const isDualRole = userRoles.length > 1;

    let targetRole: Role = userRoles[0];

    if (selectedRole) {
      const normalizedSelected = selectedRole.toLowerCase() as Role;
      if (userRoles.includes(normalizedSelected) || userRoles.includes("super_admin")) {
        targetRole = normalizedSelected;
      } else {
        const allowedRoleLabels = userRoles
          .map((r) => ROLE_CONFIGS[r]?.name || r)
          .join(" atau ");
        return NextResponse.json(
          {
            error: `Akun ini terdaftar dengan hak akses [${allowedRoleLabels}]. Anda tidak memiliki hak akses sebagai [${
              ROLE_CONFIGS[normalizedSelected]?.name || normalizedSelected
            }]. Silakan pilih tab peran yang sesuai.`,
          },
          { status: 403 }
        );
      }
    }

    const authPayload: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: targetRole,
      activeRole: targetRole,
      roles: userRoles,
      isDualRole,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      studentId: user.studentProfile?.id || null,
      parentId: parentRecordId,
    };

    const token = await signJWT(authPayload);
    const redirectUrl = ROLE_CONFIGS[targetRole]?.defaultRedirect || "/";

    const response = NextResponse.json({
      success: true,
      user: authPayload,
      redirectUrl,
    });

    // Set secure httpOnly cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server: " + (error.message || String(error)) },
      { status: 500 }
    );
  }
}
