import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, signJWT, AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth";
import { ROLE_CONFIGS, Role } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

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

    const rawRole = user.role.toLowerCase();
    let primaryRole: Role = "siswa";
    let userRoles: Role[] = [];
    let isDualRole = false;

    if (rawRole === "super_admin") {
      primaryRole = "super_admin";
      userRoles = ["super_admin", "admin", "pendidik", "siswa", "orang_tua"];
      isDualRole = true;
    } else if (rawRole.includes("admin") && rawRole.includes("pendidik")) {
      primaryRole = rawRole.startsWith("pendidik") ? "pendidik" : "admin";
      userRoles = ["admin", "pendidik"];
      isDualRole = true;
    } else if (rawRole === "pendidik") {
      primaryRole = "pendidik";
      userRoles = ["pendidik"];
      isDualRole = false;
    } else if (rawRole === "admin") {
      primaryRole = "admin";
      userRoles = ["admin"];
      isDualRole = false;
    } else if (rawRole === "bendahara") {
      primaryRole = "bendahara";
      userRoles = ["bendahara"];
      isDualRole = false;
    } else if (rawRole === "orang_tua" || rawRole === "orangtua") {
      primaryRole = "orang_tua";
      userRoles = ["orang_tua"];
      isDualRole = false;
    } else {
      primaryRole = "siswa";
      userRoles = ["siswa"];
      isDualRole = false;
    }

    const authPayload: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: primaryRole,
      activeRole: primaryRole,
      roles: userRoles,
      isDualRole,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      studentId: user.studentProfile?.id,
      parentId: user.parentProfile?.id,
    };

    const token = await signJWT(authPayload);
    const redirectUrl = ROLE_CONFIGS[primaryRole]?.defaultRedirect || "/";

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
