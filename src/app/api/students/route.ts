import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export interface StudentItem {
  id: string;
  nisn: string;
  nik?: string;
  name: string;
  gender: "L" | "P";
  packet: "Paket A" | "Paket B" | "Paket C";
  class: string;
  parent: string;
  phone: string;
  status: "AKTIF" | "LULUS" | "MUTASI";
  address?: string;
  birthDate?: string;
  birthPlace?: string;
  email?: string;
  photoUrl?: string;
  religion?: string;
  numberOfSiblings?: number;
  currentGrade?: string;
  heightCm?: number;
  weightKg?: number;
  medicalHistory?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  registrationTrack?: string;
  previousSchool?: string;
  previousSchoolAddress?: string;
  mutationFrom?: string;
  motherName?: string;
  guardianName?: string;
  parentPhone?: string;
  parentJob?: string;
  motherJob?: string;
  guardianJob?: string;
  fatherIncome?: string;
  motherIncome?: string;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const packet = searchParams.get("packet");
    const status = searchParams.get("status");

    let whereClause: any = {};

    if (packet && packet !== "SEMUA") {
      whereClause.packetType = packet;
    }
    
    if (status && status !== "SEMUA") {
      whereClause.status = status;
    }

    if (search) {
      const q = search.toLowerCase();
      whereClause.OR = [
        { nisn: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const studentsDb = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: true,
        parent: {
          include: {
            user: true
          }
        },
        enrollments: {
          include: {
            class: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const studentUserIds = studentsDb.map(s => s.userId);
    const registrations = await prisma.publicRegistration.findMany({
      where: { createdUserId: { in: studentUserIds } }
    });

    const result: StudentItem[] = studentsDb.map(s => {
      const reg = registrations.find(r => r.createdUserId === s.userId);
      return {
        id: s.id,
        nisn: s.nisn || reg?.nisn || "-",
        nik: s.nik || s.user.nik || reg?.nik || undefined,
        name: s.user.name,
        gender: (s.gender === "P" ? "P" : "L") as "L" | "P",
        packet: (s.packetType as any) || (reg?.packetType as any) || "Paket C",
        class: s.enrollments && s.enrollments.length > 0 ? s.enrollments[0].class.name : "Belum Ada Kelas",
        parent: s.parent?.user?.name || reg?.parentName || "-",
        phone: s.user.phone || reg?.phone || "-",
        status: (s.status as any) || "AKTIF",
        address: s.address || s.user.address || reg?.address || "",
        birthDate: s.birthDate ? s.birthDate.toISOString().split('T')[0] : reg?.birthDate ? reg.birthDate.toISOString().split('T')[0] : "",
        birthPlace: s.birthPlace || s.user.birthPlace || reg?.birthPlace || undefined,
        email: s.user.email,
        photoUrl: s.user.avatarUrl || reg?.avatarUrl || undefined,
        religion: reg?.religion || undefined,
        numberOfSiblings: reg?.numberOfSiblings || undefined,
        currentGrade: reg?.currentGrade || undefined,
        heightCm: reg?.heightCm || undefined,
        weightKg: reg?.weightKg || undefined,
        medicalHistory: reg?.medicalHistory || undefined,
        rtRw: reg?.rtRw || undefined,
        kelurahan: reg?.kelurahan || undefined,
        kecamatan: reg?.kecamatan || undefined,
        city: reg?.city || undefined,
        province: reg?.province || undefined,
        postalCode: reg?.postalCode || undefined,
        registrationTrack: reg?.registrationTrack || undefined,
        previousSchool: reg?.previousSchool || undefined,
        previousSchoolAddress: reg?.previousSchoolAddress || undefined,
        mutationFrom: reg?.mutationFrom || undefined,
        motherName: reg?.motherName || undefined,
        guardianName: reg?.guardianName || undefined,
        parentPhone: reg?.parentPhone || undefined,
        parentJob: s.parent?.job || reg?.parentJob || undefined,
        motherJob: reg?.motherJob || undefined,
        guardianJob: reg?.guardianJob || undefined,
        fatherIncome: reg?.fatherIncome || undefined,
        motherIncome: reg?.motherIncome || undefined,
      };
    });

    return NextResponse.json({ success: true, total: result.length, data: result });
  } catch (error: any) {
    console.error("GET Students Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat data siswa" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== "super_admin" && adminUser.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const {
      nisn,
      nik,
      name,
      gender,
      packet,
      class: classField,
      parent,
      phone,
      address,
      birthDate,
      birthPlace,
      email,
      photoUrl,
      religion,
      numberOfSiblings,
      currentGrade,
      heightCm,
      weightKg,
      medicalHistory,
      rtRw,
      kelurahan,
      kecamatan,
      city,
      province,
      postalCode,
      registrationTrack,
      previousSchool,
      previousSchoolAddress,
      mutationFrom,
      parentName,
      motherName,
      guardianName,
      parentPhone,
      parentJob,
      motherJob,
      guardianJob,
      fatherIncome,
      motherIncome,
      status,
    } = body;
    
    if (!name || !nisn) {
      return NextResponse.json({ success: false, error: "Nama siswa dan NISN wajib diisi" }, { status: 400 });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { nisn: nisn.trim() }
    });
    
    if (existingStudent) {
      return NextResponse.json({ success: false, error: `NISN ${nisn} sudah terdaftar!` }, { status: 400 });
    }

    const studentEmail = email?.trim() || `siswa.${nisn}@askara.sch.id`;
    
    const existingUser = await prisma.user.findUnique({
      where: { email: studentEmail }
    });
    
    if (existingUser) {
      return NextResponse.json({ success: false, error: `Email ${studentEmail} sudah terdaftar di sistem!` }, { status: 400 });
    }

    const defaultPassword = nisn.trim();
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newStudentData = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: studentEmail,
          phone: phone?.trim() || null,
          nik: nik?.trim() || null,
          role: "siswa",
          passwordHash,
          avatarUrl: photoUrl?.trim() || null,
          birthPlace: birthPlace?.trim() || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          address: address?.trim() || null,
          gender: gender === "P" ? "P" : "L",
        }
      });

      const effectiveParentName = parentName?.trim() || parent?.trim();
      let parentId: string | null = null;
      if (effectiveParentName && effectiveParentName !== "-") {
        const parentUser = await tx.user.create({
          data: {
            name: effectiveParentName,
            email: `wali.${nisn}@askara.sch.id`,
            phone: parentPhone?.trim() || phone?.trim() || null,
            role: "orang_tua",
            passwordHash,
          }
        });
        const parentRecord = await tx.parent.create({
          data: {
            userId: parentUser.id,
            relationship: "ORANG_TUA",
            job: parentJob?.trim() || null,
            address: address?.trim() || null,
          }
        });
        parentId = parentRecord.id;
      }

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          nisn: nisn.trim(),
          nik: nik?.trim() || null,
          gender: gender === "P" ? "P" : "L",
          packetType: packet || "Paket C",
          status: status || "AKTIF",
          address: address?.trim() || null,
          birthPlace: birthPlace?.trim() || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          parentId,
        },
        include: {
          user: true,
          parent: {
            include: { user: true }
          },
          enrollments: { include: { class: true } }
        }
      });

      await tx.publicRegistration.create({
        data: {
          registrationNumber: `REG-SISWA-${Date.now()}`,
          type: "SISWA",
          fullName: name.trim(),
          email: studentEmail,
          phone: phone?.trim() || null,
          nik: nik?.trim() || null,
          nisn: nisn?.trim() || null,
          gender: gender === "P" ? "P" : "L",
          birthPlace: birthPlace?.trim() || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          religion: religion?.trim() || null,
          numberOfSiblings: numberOfSiblings ? Number(numberOfSiblings) : null,
          currentGrade: currentGrade?.trim() || null,
          heightCm: heightCm ? Number(heightCm) : null,
          weightKg: weightKg ? Number(weightKg) : null,
          medicalHistory: medicalHistory?.trim() || null,
          address: address?.trim() || null,
          rtRw: rtRw?.trim() || null,
          kelurahan: kelurahan?.trim() || null,
          kecamatan: kecamatan?.trim() || null,
          city: city?.trim() || null,
          province: province?.trim() || null,
          postalCode: postalCode?.trim() || null,
          packetType: packet || "Paket C",
          registrationTrack: registrationTrack || "REGULER",
          previousSchool: previousSchool?.trim() || null,
          previousSchoolAddress: previousSchoolAddress?.trim() || null,
          mutationFrom: mutationFrom?.trim() || null,
          parentName: effectiveParentName || null,
          motherName: motherName?.trim() || null,
          guardianName: guardianName?.trim() || null,
          parentPhone: parentPhone?.trim() || phone?.trim() || null,
          parentJob: parentJob?.trim() || null,
          motherJob: motherJob?.trim() || null,
          guardianJob: guardianJob?.trim() || null,
          fatherIncome: fatherIncome?.trim() || null,
          motherIncome: motherIncome?.trim() || null,
          avatarUrl: photoUrl?.trim() || null,
          status: "APPROVED",
          createdUserId: newUser.id,
          verifiedById: adminUser.id,
          verifiedAt: new Date(),
        }
      });
      
      return newStudent;
    });

    const responseItem: StudentItem = {
      id: newStudentData.id,
      nisn: newStudentData.nisn || "-",
      name: newStudentData.user.name,
      gender: (newStudentData.gender as "L" | "P") || "L",
      packet: (newStudentData.packetType as any) || "Paket C",
      class: "Belum Ada Kelas",
      parent: newStudentData.parent?.user?.name || "-",
      phone: newStudentData.user.phone || "-",
      status: "AKTIF",
      address: newStudentData.address || "",
      birthDate: newStudentData.birthDate ? newStudentData.birthDate.toISOString().split('T')[0] : "",
      email: newStudentData.user.email,
    };

    return NextResponse.json({ 
      success: true, 
      message: `Data siswa ${responseItem.name} berhasil ditambahkan (Password: NISN)`, 
      data: responseItem 
    });

  } catch (error: any) {
    console.error("POST Student Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan data siswa" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== "super_admin" && adminUser.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      nisn,
      nik,
      name,
      gender,
      packet,
      class: classField,
      parent,
      phone,
      address,
      birthDate,
      birthPlace,
      email,
      photoUrl,
      religion,
      numberOfSiblings,
      currentGrade,
      heightCm,
      weightKg,
      medicalHistory,
      rtRw,
      kelurahan,
      kecamatan,
      city,
      province,
      postalCode,
      registrationTrack,
      previousSchool,
      previousSchoolAddress,
      mutationFrom,
      parentName,
      motherName,
      guardianName,
      parentPhone,
      parentJob,
      motherJob,
      guardianJob,
      fatherIncome,
      motherIncome,
      status,
    } = body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true, parent: { include: { user: true } } }
    });

    if (!existingStudent) {
      return NextResponse.json({ success: false, error: "Data siswa tidak ditemukan" }, { status: 404 });
    }

    const updatedStudentData = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          name: name ? name.trim() : undefined,
          phone: phone !== undefined ? phone : undefined,
          nik: nik !== undefined ? nik : undefined,
          email: email ? email.trim() : undefined,
          avatarUrl: photoUrl !== undefined ? photoUrl : undefined,
          birthPlace: birthPlace !== undefined ? birthPlace : undefined,
          birthDate: birthDate !== undefined ? (birthDate ? new Date(birthDate) : null) : undefined,
          address: address !== undefined ? address : undefined,
          gender: gender || undefined,
        }
      });

      const effectiveParentName = parentName?.trim() || parent?.trim();
      if (effectiveParentName && existingStudent.parent) {
        await tx.user.update({
          where: { id: existingStudent.parent.userId },
          data: {
            name: effectiveParentName,
            phone: parentPhone !== undefined ? parentPhone : undefined,
          }
        });
        if (parentJob !== undefined) {
          await tx.parent.update({
            where: { id: existingStudent.parent.id },
            data: { job: parentJob }
          });
        }
      }

      const updated = await tx.student.update({
        where: { id },
        data: {
          nisn: nisn ? nisn.trim() : undefined,
          nik: nik !== undefined ? nik : undefined,
          gender: gender || undefined,
          packetType: packet || undefined,
          status: status || undefined,
          address: address !== undefined ? address : undefined,
          birthPlace: birthPlace !== undefined ? birthPlace : undefined,
          birthDate: birthDate !== undefined ? (birthDate ? new Date(birthDate) : null) : undefined,
        },
        include: {
          user: true,
          parent: {
            include: { user: true }
          },
          enrollments: { include: { class: true } }
        }
      });

      const existingReg = await tx.publicRegistration.findFirst({
        where: { createdUserId: existingStudent.userId }
      });

      if (existingReg) {
        await tx.publicRegistration.update({
          where: { id: existingReg.id },
          data: {
            fullName: name ? name.trim() : undefined,
            email: email ? email.trim() : undefined,
            phone: phone !== undefined ? phone : undefined,
            nik: nik !== undefined ? nik : undefined,
            nisn: nisn !== undefined ? nisn : undefined,
            gender: gender || undefined,
            birthPlace: birthPlace !== undefined ? birthPlace : undefined,
            birthDate: birthDate !== undefined ? (birthDate ? new Date(birthDate) : null) : undefined,
            religion: religion !== undefined ? religion : undefined,
            numberOfSiblings: numberOfSiblings !== undefined ? Number(numberOfSiblings) : undefined,
            currentGrade: currentGrade !== undefined ? currentGrade : undefined,
            heightCm: heightCm !== undefined ? Number(heightCm) : undefined,
            weightKg: weightKg !== undefined ? Number(weightKg) : undefined,
            medicalHistory: medicalHistory !== undefined ? medicalHistory : undefined,
            address: address !== undefined ? address : undefined,
            rtRw: rtRw !== undefined ? rtRw : undefined,
            kelurahan: kelurahan !== undefined ? kelurahan : undefined,
            kecamatan: kecamatan !== undefined ? kecamatan : undefined,
            city: city !== undefined ? city : undefined,
            province: province !== undefined ? province : undefined,
            postalCode: postalCode !== undefined ? postalCode : undefined,
            packetType: packet || undefined,
            registrationTrack: registrationTrack !== undefined ? registrationTrack : undefined,
            previousSchool: previousSchool !== undefined ? previousSchool : undefined,
            previousSchoolAddress: previousSchoolAddress !== undefined ? previousSchoolAddress : undefined,
            mutationFrom: mutationFrom !== undefined ? mutationFrom : undefined,
            parentName: effectiveParentName !== undefined ? effectiveParentName : undefined,
            motherName: motherName !== undefined ? motherName : undefined,
            guardianName: guardianName !== undefined ? guardianName : undefined,
            parentPhone: parentPhone !== undefined ? parentPhone : undefined,
            parentJob: parentJob !== undefined ? parentJob : undefined,
            motherJob: motherJob !== undefined ? motherJob : undefined,
            guardianJob: guardianJob !== undefined ? guardianJob : undefined,
            fatherIncome: fatherIncome !== undefined ? fatherIncome : undefined,
            motherIncome: motherIncome !== undefined ? motherIncome : undefined,
            avatarUrl: photoUrl !== undefined ? photoUrl : undefined,
          }
        });
      }

      return updated;
    });

    const responseItem: StudentItem = {
      id: updatedStudentData.id,
      nisn: updatedStudentData.nisn || "-",
      name: updatedStudentData.user.name,
      gender: (updatedStudentData.gender as "L" | "P") || "L",
      packet: (updatedStudentData.packetType as any) || "Paket C",
      class: updatedStudentData.enrollments && updatedStudentData.enrollments.length > 0 ? updatedStudentData.enrollments[0].class.name : "Belum Ada Kelas",
      parent: updatedStudentData.parent?.user?.name || "-",
      phone: updatedStudentData.user.phone || "-",
      status: (updatedStudentData.status as any) || "AKTIF",
      address: updatedStudentData.address || "",
      birthDate: updatedStudentData.birthDate ? updatedStudentData.birthDate.toISOString().split('T')[0] : "",
      email: updatedStudentData.user.email,
    };

    return NextResponse.json({ success: true, message: "Data siswa berhasil diperbarui", data: responseItem });
  } catch (error: any) {
    console.error("PUT Student Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui data siswa" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== "super_admin" && adminUser.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Parameter ID wajib disertakan" }, { status: 400 });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingStudent) {
      return NextResponse.json({ success: false, error: "Data siswa tidak ditemukan" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: existingStudent.userId }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Data siswa ${existingStudent.user.name} berhasil dihapus`, 
      data: { id } 
    });
  } catch (error: any) {
    console.error("DELETE Student Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus data siswa" }, { status: 500 });
  }
}