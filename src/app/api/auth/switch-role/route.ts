import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, signJWT, AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth";
import { Role, ROLE_CONFIGS } from "@/lib/rbac";

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

    // Determine available roles for the user
    let userRoles: Role[] = user.roles || [user.role];

    // Super Admin retains universal role switching
    if (user.role === "super_admin") {
      userRoles = ["super_admin", "admin", "pendidik", "siswa", "orang_tua"];
    }

    const hasDualRole = userRoles.includes("admin") && userRoles.includes("pendidik");

    // If user is not super_admin and does not have dual-role capability, reject
    if (user.role !== "super_admin" && !hasDualRole) {
      return NextResponse.json(
        {
          error:
            "Fitur alih peran (Switch Role) hanya tersedia untuk personel yang terdata merangkap dua role (Guru & Manajemen) atau akun Super Admin.",
        },
        { status: 403 }
      );
    }

    if (!userRoles.includes(targetRole) && user.role !== "super_admin") {
      return NextResponse.json(
        { error: `Anda tidak memiliki hak akses untuk beralih ke peran ${targetRole}` },
        { status: 403 }
      );
    }

    const updatedUser: AuthUser = {
      ...user,
      activeRole: targetRole,
      role: targetRole,
      roles: userRoles,
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
