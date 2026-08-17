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

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak valid atau akun dinonaktifkan" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah" },
        { status: 401 }
      );
    }

    const authPayload: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      studentId: user.studentProfile?.id,
      parentId: user.parentProfile?.id,
    };

    const token = await signJWT(authPayload);
    const redirectUrl = ROLE_CONFIGS[user.role as Role]?.defaultRedirect || "/";

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
