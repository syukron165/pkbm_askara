import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signJWT, AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth";
import { ROLE_CONFIGS, Role } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      role = "siswa",
      phone,
      // Siswa fields
      packetType,
      nisn,
      nik,
      gender,
      birthPlace,
      birthDate,
      address,
      // Orang Tua fields
      relationship,
      job,
      parentAddress,
      childNisn,
      // Pendidik / Guru fields
      nip,
      specialization,
      // Admin / Staff fields
      department,
      position,
    } = body;

    // 1. Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama lengkap, email, dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal harus 6 karakter" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda." },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Validate valid role
    const validRoles: Role[] = ["super_admin", "admin", "bendahara", "pendidik", "siswa", "orang_tua"];
    const targetRole: Role = validRoles.includes(role as Role) ? (role as Role) : "siswa";

    // 5. Create user and related profiles in transaction
    const newUser = await db.$transaction(async (tx) => {
      // Create Base User
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: targetRole,
          phone: phone ? phone.trim() : null,
          isActive: true,
        },
      });

      // If role is Siswa, create Student profile
      if (targetRole === "siswa") {
        let parentId: string | null = null;
        if (childNisn) {
          // If linked parent exists
        }

        await tx.student.create({
          data: {
            userId: user.id,
            nisn: nisn ? nisn.trim() : null,
            nik: nik ? nik.trim() : null,
            gender: gender || "L",
            birthPlace: birthPlace || null,
            birthDate: birthDate ? new Date(birthDate) : null,
            address: address || null,
            packetType: packetType || "Paket C",
            status: "ACTIVE",
            parentId,
          },
        });
      }

      // If role is Orang Tua, create Parent profile
      if (targetRole === "orang_tua") {
        const parent = await tx.parent.create({
          data: {
            userId: user.id,
            relationship: relationship || "ORANG_TUA",
            job: job || null,
            address: parentAddress || address || null,
          },
        });

        // If child NISN provided, link student if found
        if (childNisn) {
          const student = await tx.student.findFirst({
            where: { nisn: childNisn.trim() },
          });
          if (student) {
            await tx.student.update({
              where: { id: student.id },
              data: { parentId: parent.id },
            });
          }
        }
      }

      return user;
    });

    // 6. Fetch complete created user data
    const completeUser = await db.user.findUnique({
      where: { id: newUser.id },
      include: {
        studentProfile: true,
        parentProfile: true,
      },
    });

    if (!completeUser) {
      throw new Error("Gagal mengambil data akun yang baru dibuat");
    }

    // 7. Generate JWT Payload & Cookie
    const authPayload: AuthUser = {
      id: completeUser.id,
      email: completeUser.email,
      name: completeUser.name,
      role: completeUser.role as Role,
      phone: completeUser.phone,
      avatarUrl: completeUser.avatarUrl,
      studentId: completeUser.studentProfile?.id,
      parentId: completeUser.parentProfile?.id,
    };

    const token = await signJWT(authPayload);
    const redirectUrl = ROLE_CONFIGS[completeUser.role as Role]?.defaultRedirect || "/";

    const response = NextResponse.json({
      success: true,
      message: `Akun ${completeUser.name} sebagai ${ROLE_CONFIGS[completeUser.role as Role]?.name || completeUser.role} berhasil didaftarkan!`,
      user: authPayload,
      redirectUrl,
    });

    // Set secure httpOnly cookie for automatic sign in
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
    console.error("Registration API Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat memproses pendaftaran akun" },
      { status: 500 }
    );
  }
}
