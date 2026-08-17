import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token dan password wajib diisi" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    // Cari user berdasarkan verificationToken ATAU resetPasswordToken
    let user = await db.user.findUnique({
      where: { verificationToken: token }
    });

    let isReset = false;

    if (!user) {
      user = await db.user.findUnique({
        where: { resetPasswordToken: token }
      });
      isReset = true;
    }

    if (!user) {
      return NextResponse.json({ error: "Token tidak valid atau sudah tidak berlaku" }, { status: 400 });
    }

    if (isReset && user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      return NextResponse.json({ error: "Token reset password sudah kedaluwarsa" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Update user
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true,
        verificationToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      }
    });

    return NextResponse.json({ success: true, message: "Kata sandi berhasil diubah" });

  } catch (error) {
    console.error("Setup password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
