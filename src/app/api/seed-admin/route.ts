import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const email = "syukron.aqiqah@gmail.com";
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "Admin already exists", user: existing });
    }

    const passwordHash = await bcrypt.hash("admin123", 10);
    const user = await db.user.create({
      data: {
        name: "Syukron (Super Admin)",
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        emailVerified: true,
      }
    });
    return NextResponse.json({ message: "Admin created", user });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
