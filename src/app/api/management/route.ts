import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function parseSafeDate(d: any): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

export interface ManagementPersonnel {
  id: string;
  name: string;
  nip?: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  status: "AKTIF" | "CUTI" | "NON-AKTIF";
  isDualRole?: boolean;
  teachingSubject?: string;
  isParentRole?: boolean;
  parentRelationship?: string;
  parentJob?: string;
  childrenCount?: number;
  children?: Array<{ id: string; name: string; nisn: string; packetType: string; className: string }>;
  address?: string;
  joinDate?: string;
  skNumber?: string;
  photoUrl?: string;
  responsibilities?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  lastEducation?: string;
  majorStudy?: string;
  universityName?: string;
  graduationYear?: string;
  experienceYears?: number;
  religion?: string;
  motherName?: string;
  maritalStatus?: string;
  socialMedia?: string;
  hobbies?: string;
  lifeMotto?: string;
  bankAccountNumber?: string;
  bankName?: string;
  educationStatus?: string;
  linkedinUrl?: string;
  skills?: string;
  cvResumeUrl?: string;
  ktpUrl?: string;
  kkUrl?: string;
  diplomaUrl?: string;
  transcriptUrl?: string;
  npwpUrl?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    let whereClause: any = {
      OR: [
        { role: { contains: "admin", mode: "insensitive" } },
        { role: { contains: "super_admin", mode: "insensitive" } },
        { role: { contains: "bendahara", mode: "insensitive" } },
        { role: { contains: "staff", mode: "insensitive" } },
        { role: { contains: "management", mode: "insensitive" } },
      ],
    };

    if (status && status !== "SEMUA") {
      whereClause.isActive = status === "AKTIF";
    }

    if (search) {
      const q = search.toLowerCase();
      whereClause.AND = [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { nik: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const adminUsers = await db.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        parentProfile: {
          include: {
            students: {
              include: {
                user: true,
                enrollments: {
                  include: {
                    class: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const adminIds = adminUsers.map((u) => u.id);
    const adminRegs = await db.publicRegistration.findMany({
      where: { createdUserId: { in: adminIds } },
    });

    let result: ManagementPersonnel[] = adminUsers.map((u) => {
      const reg = adminRegs.find((r) => r.createdUserId === u.id);
      const isDualRole = u.role.includes("admin") && u.role.includes("pendidik");
      const isParentRole = Boolean(u.role.includes("orang_tua") || u.parentProfile);

      const children = (u.parentProfile?.students || []).map((s) => ({
        id: s.id,
        name: s.user.name,
        nisn: s.nisn || "-",
        packetType: s.packetType,
        className: s.enrollments[0]?.class?.name || "-",
      }));

      return {
        id: u.id,
        name: u.name,
        nip: reg?.nik || u.nik || undefined,
        position: reg?.positionApplied || (u.role === "super_admin" ? "Super Admin" : isDualRole ? "Staf & Pendidik" : "Staf Administrasi"),
        department: u.role === "super_admin" ? "Pimpinan & Struktural" : "Tata Usaha & HRD",
        email: u.email,
        phone: u.phone || "-",
        status: u.isActive ? "AKTIF" : "NON-AKTIF",
        isDualRole,
        teachingSubject: reg?.majorStudy || undefined,
        isParentRole,
        parentRelationship: u.parentProfile?.relationship || "ORANG_TUA",
        parentJob: u.parentProfile?.job || undefined,
        childrenCount: children.length,
        children,
        address: u.address || reg?.address || undefined,
        joinDate: u.createdAt.toISOString().split("T")[0],
        skNumber: undefined,
        photoUrl: u.avatarUrl || undefined,
        responsibilities: reg?.skills || undefined,
        gender: u.gender || reg?.gender || undefined,
        birthPlace: u.birthPlace || reg?.birthPlace || undefined,
        birthDate: u.birthDate ? u.birthDate.toISOString().split("T")[0] : reg?.birthDate?.toISOString().split("T")[0] || undefined,
        lastEducation: reg?.lastEducation || undefined,
        majorStudy: reg?.majorStudy || undefined,
        universityName: reg?.universityName || undefined,
        graduationYear: reg?.graduationYear || undefined,
        experienceYears: reg?.experienceYears || undefined,
        religion: reg?.religion || undefined,
        motherName: reg?.motherName || undefined,
        maritalStatus: reg?.maritalStatus || undefined,
        socialMedia: reg?.socialMedia || undefined,
        hobbies: reg?.hobbies || undefined,
        lifeMotto: reg?.lifeMotto || undefined,
        bankAccountNumber: reg?.bankAccountNumber || undefined,
        bankName: reg?.bankName || undefined,
        educationStatus: reg?.educationStatus || undefined,
        linkedinUrl: reg?.linkedinUrl || undefined,
        skills: reg?.skills || undefined,
        cvResumeUrl: reg?.cvResumeUrl || undefined,
        ktpUrl: reg?.ktpUrl || undefined,
        kkUrl: reg?.kkUrl || undefined,
        diplomaUrl: reg?.diplomaUrl || undefined,
        transcriptUrl: reg?.transcriptUrl || undefined,
        npwpUrl: reg?.npwpUrl || undefined,
      };
    });

    if (department && department !== "SEMUA") {
      result = result.filter((m) => m.department.toLowerCase() === department.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
      stats: {
        total: result.length,
        active: result.filter((m) => m.status === "AKTIF").length,
        pimpinan: result.filter((m) => m.department.includes("Pimpinan") || m.department.includes("Akademik")).length,
        operasional: result.filter((m) => !m.department.includes("Pimpinan")).length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/management Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data manajemen" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const {
      isDualRole,
      teachingSubject,
      isParentRole,
      parentRelationship,
      parentJob,
      childrenStudentIds,
      name,
      nip,
      position,
      department,
      email,
      phone,
      address,
      city,
      province,
      photoUrl,
      responsibilities,
      gender,
      birthPlace,
      birthDate,
      lastEducation,
      educationStatus,
      majorStudy,
      universityName,
      graduationYear,
      experienceYears,
      skills,
      religion,
      motherName,
      maritalStatus,
      linkedinUrl,
      socialMedia,
      hobbies,
      lifeMotto,
      bankName,
      bankAccountNumber,
    } = body;

    if (!name || !position || !department) {
      return NextResponse.json(
        { success: false, error: "Nama, Jabatan, dan Departemen wajib diisi" },
        { status: 400 }
      );
    }

    const emailToUse = email?.trim().toLowerCase() || `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@askara.sch.id`;
    let existingUser = await db.user.findUnique({ where: { email: emailToUse } });

    const assignedRolesSet = new Set<string>();
    if (department.includes("Pimpinan")) {
      assignedRolesSet.add("super_admin");
    } else {
      assignedRolesSet.add("admin");
      if (isDualRole) assignedRolesSet.add("pendidik");
      if (isParentRole) assignedRolesSet.add("orang_tua");
    }

    if (existingUser) {
      const existingRoles = existingUser.role.split(",").map((r) => r.trim());
      if (existingRoles.includes("admin") || existingRoles.includes("super_admin")) {
        return NextResponse.json({ success: false, error: `Email ${emailToUse} sudah terdaftar sebagai manajemen!` }, { status: 400 });
      }
      existingRoles.forEach((r) => assignedRolesSet.add(r));
    }

    const passwordHash = await bcrypt.hash("askara123", 10);
    const assignedRoleStr = Array.from(assignedRolesSet).join(",");
    const safeBirthDate = parseSafeDate(birthDate);

    let targetUserId = existingUser?.id;

    if (existingUser) {
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          role: assignedRoleStr,
          phone: phone?.trim() || existingUser.phone,
          nik: nip?.trim() || existingUser.nik,
          gender: gender || existingUser.gender,
          birthPlace: birthPlace?.trim() || existingUser.birthPlace,
          birthDate: safeBirthDate || existingUser.birthDate,
          address: address?.trim() || existingUser.address,
          avatarUrl: photoUrl?.trim() || existingUser.avatarUrl,
        },
      });
    } else {
      const newUser = await db.user.create({
        data: {
          name: name.trim(),
          email: emailToUse,
          passwordHash,
          role: assignedRoleStr,
          phone: phone?.trim() || null,
          nik: nip?.trim() || null,
          gender: gender || null,
          birthPlace: birthPlace?.trim() || null,
          birthDate: safeBirthDate,
          address: address?.trim() || null,
          avatarUrl: photoUrl?.trim() || null,
          isActive: true,
          emailVerified: true,
        },
      });
      targetUserId = newUser.id;
    }

    if (!targetUserId) {
      throw new Error("Gagal mengidentifikasi ID pengguna.");
    }

    // Handle Parent Profile & Linked Children
    if (isParentRole) {
      const parentRecord = await db.parent.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          relationship: parentRelationship || "ORANG_TUA",
          job: parentJob || "Staf Manajemen PKBM",
          address: address?.trim() || null,
        },
        update: {
          relationship: parentRelationship || undefined,
          job: parentJob || undefined,
          address: address?.trim() || undefined,
        },
      });

      if (Array.isArray(childrenStudentIds) && childrenStudentIds.length > 0) {
        await db.student.updateMany({
          where: { id: { in: childrenStudentIds } },
          data: { parentId: parentRecord.id },
        });
      }
    }

    await db.publicRegistration.create({
      data: {
        registrationNumber: `REG-MANAJEMEN-${Date.now()}`,
        type: "MANAJEMEN",
        fullName: name.trim(),
        email: emailToUse,
        phone: phone?.trim() || null,
        nik: nip?.trim() || null,
        gender: gender || null,
        birthPlace: birthPlace?.trim() || null,
        birthDate: safeBirthDate,
        positionApplied: position.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        province: province?.trim() || null,
        lastEducation: lastEducation?.trim() || null,
        educationStatus: educationStatus?.trim() || null,
        majorStudy: teachingSubject?.trim() || majorStudy?.trim() || null,
        universityName: universityName?.trim() || null,
        graduationYear: graduationYear?.trim() || null,
        experienceYears: experienceYears ? Number(experienceYears) : null,
        skills: skills?.trim() || responsibilities?.trim() || null,
        religion: religion?.trim() || null,
        motherName: motherName?.trim() || null,
        maritalStatus: maritalStatus?.trim() || null,
        linkedinUrl: linkedinUrl?.trim() || null,
        socialMedia: socialMedia ? (typeof socialMedia === "string" ? socialMedia : JSON.stringify(socialMedia)) : null,
        hobbies: hobbies?.trim() || null,
        lifeMotto: lifeMotto?.trim() || null,
        bankName: bankName?.trim() || null,
        bankAccountNumber: bankAccountNumber?.trim() || null,
        avatarUrl: photoUrl?.trim() || null,
        cvResumeUrl: body.cvResumeUrl?.trim() || null,
        ktpUrl: body.ktpUrl?.trim() || null,
        kkUrl: body.kkUrl?.trim() || null,
        diplomaUrl: body.diplomaUrl?.trim() || null,
        transcriptUrl: body.transcriptUrl?.trim() || null,
        npwpUrl: body.npwpUrl?.trim() || null,
        status: "APPROVED",
        createdUserId: targetUserId,
        verifiedById: user.id,
        verifiedAt: new Date(),
      }
    });

    const roleBadgesText = [
      "Manajemen",
      isDualRole ? "Pendidik" : null,
      isParentRole ? "Orang Tua" : null,
    ].filter(Boolean).join(" & ");

    return NextResponse.json({
      success: true,
      message: `Personel manajemen ${name.trim()} berhasil ditambahkan (Peran: ${roleBadgesText})`,
    });
  } catch (error: any) {
    console.error("POST /api/management Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan data manajemen" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      isDualRole,
      teachingSubject,
      isParentRole,
      parentRelationship,
      parentJob,
      childrenStudentIds,
      name,
      nip,
      position,
      department,
      email,
      phone,
      status,
      address,
      city,
      province,
      photoUrl,
      responsibilities,
      gender,
      birthPlace,
      birthDate,
      lastEducation,
      educationStatus,
      majorStudy,
      universityName,
      graduationYear,
      experienceYears,
      skills,
      religion,
      motherName,
      maritalStatus,
      linkedinUrl,
      socialMedia,
      hobbies,
      lifeMotto,
      bankName,
      bankAccountNumber,
      cvResumeUrl,
      ktpUrl,
      kkUrl,
      diplomaUrl,
      transcriptUrl,
      npwpUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID personel wajib diisi" }, { status: 400 });
    }

    const existing = await db.user.findUnique({
      where: { id },
      include: { parentProfile: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data personel tidak ditemukan" }, { status: 404 });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    if (cleanEmail && cleanEmail !== existing.email.toLowerCase()) {
      const emailTaken = await db.user.findFirst({
        where: { email: cleanEmail, id: { not: id } },
      });
      if (emailTaken) {
        return NextResponse.json({ success: false, error: `Email ${cleanEmail} sudah digunakan oleh pengguna lain.` }, { status: 400 });
      }
    }

    const rolesSet = new Set<string>();
    if (existing.role.includes("super_admin") || department?.includes("Pimpinan")) {
      rolesSet.add("super_admin");
    } else {
      rolesSet.add("admin");
    }
    if (isDualRole ?? existing.role.includes("pendidik")) rolesSet.add("pendidik");
    if (isParentRole ?? (existing.role.includes("orang_tua") || Boolean(existing.parentProfile))) {
      rolesSet.add("orang_tua");
    }
    if (existing.role.includes("bendahara")) rolesSet.add("bendahara");

    const updatedRole = Array.from(rolesSet).join(",");
    const safeBirthDate = birthDate !== undefined ? parseSafeDate(birthDate) : undefined;

    await db.user.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        email: cleanEmail,
        phone: phone !== undefined ? (phone.trim() === "" ? null : phone.trim()) : undefined,
        nik: nip !== undefined ? (nip.trim() === "" ? null : nip.trim()) : undefined,
        gender: gender !== undefined ? gender : undefined,
        birthPlace: birthPlace !== undefined ? birthPlace.trim() : undefined,
        birthDate: safeBirthDate,
        address: address !== undefined ? address.trim() : undefined,
        avatarUrl: photoUrl !== undefined ? photoUrl.trim() : undefined,
        isActive: status === "AKTIF",
        role: updatedRole,
      }
    });

    // Handle Parent Profile & Linked Children
    if (isParentRole) {
      const parentRecord = await db.parent.upsert({
        where: { userId: id },
        create: {
          userId: id,
          relationship: parentRelationship || "ORANG_TUA",
          job: parentJob || "Staf Manajemen PKBM",
          address: address !== undefined ? address.trim() : existing.address,
        },
        update: {
          relationship: parentRelationship || undefined,
          job: parentJob || undefined,
          address: address !== undefined ? address.trim() : undefined,
        },
      });

      if (Array.isArray(childrenStudentIds)) {
        await db.student.updateMany({
          where: { parentId: parentRecord.id, id: { notIn: childrenStudentIds } },
          data: { parentId: null },
        });

        if (childrenStudentIds.length > 0) {
          await db.student.updateMany({
            where: { id: { in: childrenStudentIds } },
            data: { parentId: parentRecord.id },
          });
        }
      }
    } else if (isParentRole === false && existing.parentProfile) {
      if (Array.isArray(childrenStudentIds) && childrenStudentIds.length === 0) {
        await db.student.updateMany({
          where: { parentId: existing.parentProfile.id },
          data: { parentId: null },
        });
      }
    }

    const existingReg = await db.publicRegistration.findFirst({ where: { createdUserId: id } });
    if (existingReg) {
      await db.publicRegistration.update({
        where: { id: existingReg.id },
        data: {
          fullName: name ? name.trim() : undefined,
          email: cleanEmail,
          phone: phone !== undefined ? phone : undefined,
          nik: nip !== undefined ? nip : undefined,
          gender: gender !== undefined ? gender : undefined,
          birthPlace: birthPlace !== undefined ? birthPlace : undefined,
          birthDate: safeBirthDate,
          positionApplied: position !== undefined ? position : undefined,
          address: address !== undefined ? address : undefined,
          city: city !== undefined ? city : undefined,
          province: province !== undefined ? province : undefined,
          lastEducation: lastEducation !== undefined ? lastEducation : undefined,
          educationStatus: educationStatus !== undefined ? educationStatus : undefined,
          majorStudy: teachingSubject !== undefined ? teachingSubject : majorStudy !== undefined ? majorStudy : undefined,
          universityName: universityName !== undefined ? universityName : undefined,
          graduationYear: graduationYear !== undefined ? graduationYear : undefined,
          experienceYears: experienceYears !== undefined ? Number(experienceYears) : undefined,
          skills: skills !== undefined ? skills : responsibilities !== undefined ? responsibilities : undefined,
          religion: religion !== undefined ? religion : undefined,
          motherName: motherName !== undefined ? motherName : undefined,
          maritalStatus: maritalStatus !== undefined ? maritalStatus : undefined,
          linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
          socialMedia: socialMedia !== undefined ? (typeof socialMedia === "string" ? socialMedia : JSON.stringify(socialMedia)) : undefined,
          hobbies: hobbies !== undefined ? hobbies : undefined,
          lifeMotto: lifeMotto !== undefined ? lifeMotto : undefined,
          bankName: bankName !== undefined ? bankName : undefined,
          bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : undefined,
          avatarUrl: photoUrl !== undefined ? photoUrl : undefined,
          cvResumeUrl: cvResumeUrl !== undefined ? cvResumeUrl : undefined,
          ktpUrl: ktpUrl !== undefined ? ktpUrl : undefined,
          kkUrl: kkUrl !== undefined ? kkUrl : undefined,
          diplomaUrl: diplomaUrl !== undefined ? diplomaUrl : undefined,
          transcriptUrl: transcriptUrl !== undefined ? transcriptUrl : undefined,
          npwpUrl: npwpUrl !== undefined ? npwpUrl : undefined,
        }
      });
    }

    return NextResponse.json({ success: true, message: "Data personel berhasil diperbarui" });
  } catch (error: any) {
    console.error("PUT /api/management Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Hanya Super Admin yang dapat menonaktifkan." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID tidak ditemukan" }, { status: 400 });
    }

    await db.user.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: "Personel berhasil dinonaktifkan." });
  } catch (error: any) {
    console.error("DELETE /api/management Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menonaktifkan data" }, { status: 500 });
  }
}