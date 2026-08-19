import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, signJWT, AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth";
import { Role, ROLE_CONFIGS } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetRole } = body as { targetRole: Role };

    if (!targetRole || !ROLE_CONFIGS[targetRole]) {
      return NextResponse.json({ error: "Role target tidak valid" }, { status: 400 });
    }

    // Determine available roles for the user (with DB fallback for freshest state)
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { parentProfile: true, studentProfile: true },
    });

    const userRolesSet = new Set<Role>();

    if (user.role === "super_admin" || dbUser?.role?.includes("super_admin")) {
      userRolesSet.add("super_admin");
      userRolesSet.add("admin");
      userRolesSet.add("bendahara");
      userRolesSet.add("pendidik");
      userRolesSet.add("siswa");
      userRolesSet.add("orang_tua");
    } else {
      // From token
      if (Array.isArray(user.roles)) {
        user.roles.forEach((r) => {
          if (ROLE_CONFIGS[r]) userRolesSet.add(r);
        });
      }
      if (user.role && ROLE_CONFIGS[user.role as Role]) {
        userRolesSet.add(user.role as Role);
      }

      // From fresh DB record
      if (dbUser) {
        const rawRole = (dbUser.role || "").toLowerCase();
        rawRole.split(",").forEach((r) => {
          const trimmed = r.trim();
          if (ROLE_CONFIGS[trimmed as Role]) userRolesSet.add(trimmed as Role);
          if (trimmed === "guru" || trimmed === "tutor") userRolesSet.add("pendidik");
          if (trimmed === "orangtua" || trimmed === "wali") userRolesSet.add("orang_tua");
          if (trimmed === "staff" || trimmed === "management") userRolesSet.add("admin");
          if (trimmed === "keuangan") userRolesSet.add("bendahara");
        });

        if (dbUser.parentProfile) userRolesSet.add("orang_tua");
        if (dbUser.studentProfile) userRolesSet.add("siswa");

        const parentRecord = await db.parent.findFirst({
          where: { OR: [{ userId: dbUser.id }, { user: { email: dbUser.email } }] },
        });
        if (parentRecord) userRolesSet.add("orang_tua");
      }
    }

    const userRoles: Role[] = Array.from(userRolesSet);
    const hasMultiRole = userRoles.length > 1 || user.role === "super_admin" || Boolean(dbUser?.role?.includes("super_admin"));

    // If user is not super_admin and does not have multi-role capability, reject
    if (!hasMultiRole) {
      return NextResponse.json(
        {
          error:
            "Fitur alih peran (Switch Role) hanya tersedia untuk akun yang memiliki lebih dari satu peran (misalnya Pendidik & Orang Tua, atau Guru & Manajemen) atau akun Super Admin.",
        },
        { status: 403 }
      );
    }

    if (!userRoles.includes(targetRole) && user.role !== "super_admin" && !dbUser?.role?.includes("super_admin")) {
      return NextResponse.json(
        { error: `Anda tidak memiliki hak akses untuk beralih ke peran ${ROLE_CONFIGS[targetRole]?.name || targetRole}` },
        { status: 403 }
      );
    }

    const parentId = dbUser?.parentProfile?.id || user.parentId || null;
    const studentId = dbUser?.studentProfile?.id || user.studentId || null;

    const updatedUser: AuthUser = {
      ...user,
      activeRole: targetRole,
      role: targetRole,
      roles: userRoles,
      isDualRole: userRoles.length > 1,
      parentId,
      studentId,
    };

    const token = await signJWT(updatedUser);
    const redirectUrl = ROLE_CONFIGS[targetRole]?.defaultRedirect || "/";

    const response = NextResponse.json({
      success: true,
      message: `Berhasil beralih ke Mode ${ROLE_CONFIGS[targetRole].name}`,
      activeRole: targetRole,
      redirectUrl,
      user: updatedUser,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Switch Role Error:", error);
    return NextResponse.json({ error: error.message || "Gagal beralih peran" }, { status: 500 });
  }
}
