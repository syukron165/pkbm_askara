import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Fetch teacher
    const teacher = await db.user.findUnique({
      where: { id: teacherId, role: "pendidik" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Map to TeacherData structure
    const teacherData = {
      id: teacher.id,
      name: teacher.name,
      nip: "-", // Could be fetched from a TeacherProfile table if it existed, but using User for now
      role: "Tutor / Tenaga Pendidik",
      email: teacher.email,
      phone: teacher.phone || "-",
      classes: "Paket A, B, C", // Mock or derive from schedules
      status: teacher.isActive ? "AKTIF" : "NON-AKTIF",
      photoUrl: teacher.avatarUrl,
      address: "-",
      joinDate: teacher.createdAt.toISOString(),
    };

    // Fetch InstitutionProfile
    const institution = await db.institutionProfile.findFirst();

    if (!institution) {
      return NextResponse.json({ error: "Institution Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        teacher: teacherData,
        institution,
      }
    });
  } catch (error: any) {
    console.error("SK Tutor API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
