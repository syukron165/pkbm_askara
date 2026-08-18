import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export type CustomFieldType =
  | "text" // short text
  | "long_text" // long text
  | "number" // numbering
  | "date" // date
  | "dropdown" // dropdown
  | "email" // email
  | "phone" // phone number
  | "checkbox" // checkbox
  | "link"; // link / URL

export interface CustomFieldItem {
  id: string;
  label: string;
  value: string;
  type?: CustomFieldType;
  options?: string[];
}

export interface CustomDocItem {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface StudentItem {
  id: string;
  nisn: string;
  nik?: string;
  name: string;
  gender: "L" | "P";
  packet: "Paket A" | "Paket B" | "Paket C";
  studyModel?: "Reguler" | "Home Schooling" | "Kursus" | "Privat";
  class: string;
  parent: string;
  phone: string;
  status: "AKTIF" | "NONAKTIF" | "LULUS" | "MUTASI" | "KELUAR" | "MENGUNDURKAN_DIRI";
  statusNote?: string;
  registeredAt?: string; // Formatted DD-MM-YYYY
  mapsUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
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
  parentEmail?: string;
  motherName?: string;
  guardianName?: string;
  parentPhone?: string;
  parentJob?: string;
  motherJob?: string;
  guardianJob?: string;
  fatherIncome?: string;
  motherIncome?: string;
  parentKtpUrl?: string;
  ktpUrl?: string;
  kkUrl?: string;
  birthCertUrl?: string;
  diplomaUrl?: string;
  customFields?: CustomFieldItem[];
  customDocs?: CustomDocItem[];
}

function safeJsonParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  try {
    const parsed = typeof val === "string" ? JSON.parse(val) : val;
    return parsed || fallback;
  } catch {
    return fallback;
  }
}

function formatDateDMY(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function normalizeStudentStatus(status: string | null | undefined): StudentItem["status"] {
  if (!status) return "AKTIF";
  const upper = status.toUpperCase();
  if (upper === "ACTIVE" || upper === "AKTIF") return "AKTIF";
  if (upper === "GRADUATED" || upper === "LULUS") return "LULUS";
  if (upper === "MUTASI" || upper === "MUTATED") return "MUTASI";
  if (upper === "DROPOUT" || upper === "KELUAR") return "KELUAR";
  if (upper === "MENGUNDURKAN_DIRI" || upper === "RESIGNED") return "MENGUNDURKAN_DIRI";
  if (upper === "NONAKTIF" || upper === "INACTIVE") return "NONAKTIF";
  return "AKTIF";
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
        studyModel: (s.studyModel || reg?.studyModel || "Reguler") as any,
        class: s.enrollments && s.enrollments.length > 0 ? s.enrollments[0].class.name : "Belum Ada Kelas",
        parent: s.parent?.user?.name || reg?.parentName || "-",
        phone: s.user.phone || reg?.phone || "-",
        status: normalizeStudentStatus(s.status),
        statusNote: s.statusNote || reg?.statusNote || undefined,
        registeredAt: formatDateDMY(s.registeredAt || reg?.createdAt || s.createdAt),
        mapsUrl: s.mapsUrl || reg?.mapsUrl || undefined,
        latitude: s.latitude ?? reg?.latitude ?? null,
        longitude: s.longitude ?? reg?.longitude ?? null,
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
        parentEmail: s.parent?.user?.email || reg?.parentEmail || undefined,
        motherName: reg?.motherName || undefined,
        guardianName: reg?.guardianName || undefined,
        parentPhone: reg?.parentPhone || undefined,
        parentJob: s.parent?.job || reg?.parentJob || undefined,
        motherJob: reg?.motherJob || undefined,
        guardianJob: reg?.guardianJob || undefined,
        fatherIncome: reg?.fatherIncome || undefined,
        motherIncome: reg?.motherIncome || undefined,
        parentKtpUrl: reg?.parentKtpUrl || undefined,
        ktpUrl: reg?.ktpUrl || undefined,
        kkUrl: reg?.kkUrl || undefined,
        birthCertUrl: reg?.birthCertUrl || undefined,
        diplomaUrl: reg?.diplomaUrl || undefined,
        customFields: safeJsonParse(reg?.skills, []),
        customDocs: safeJsonParse(reg?.socialMedia, []),
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
      studyModel,
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
      parentEmail,
      motherName,
      guardianName,
      parentPhone,
      parentJob,
      motherJob,
      guardianJob,
      fatherIncome,
      motherIncome,
      status,
      statusNote,
      registeredAt,
      mapsUrl,
      latitude,
      longitude,
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
    const regDate = registeredAt ? new Date(registeredAt) : new Date();

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
        const effectiveParentEmail = parentEmail?.trim()?.toLowerCase() || `wali.${nisn}@askara.sch.id`;
        
        let parentUser = await tx.user.findUnique({
          where: { email: effectiveParentEmail }
        });

        if (!parentUser) {
          parentUser = await tx.user.create({
            data: {
              name: effectiveParentName,
              email: effectiveParentEmail,
              phone: parentPhone?.trim() || phone?.trim() || null,
              role: "orang_tua",
              passwordHash,
              isActive: true,
              emailVerified: true,
            }
          });
        }

        let parentRecord = await tx.parent.findUnique({
          where: { userId: parentUser.id }
        });

        if (!parentRecord) {
          parentRecord = await tx.parent.create({
            data: {
              userId: parentUser.id,
              relationship: "ORANG_TUA",
              job: parentJob?.trim() || null,
              address: address?.trim() || null,
            }
          });
        }
        parentId = parentRecord.id;
      }

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          nisn: nisn.trim(),
          nik: nik?.trim() || null,
          gender: gender === "P" ? "P" : "L",
          packetType: packet || "Paket C",
          studyModel: studyModel || "Reguler",
          status: status || "AKTIF",
          statusNote: statusNote?.trim() || null,
          registeredAt: isNaN(regDate.getTime()) ? new Date() : regDate,
          mapsUrl: mapsUrl?.trim() || null,
          latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
          longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
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

      // Handle class enrollment if classField is specified
      if (classField && classField !== "Belum Ada Kelas" && classField !== "-") {
        const targetClass = await tx.class.findFirst({
          where: {
            OR: [
              { id: classField },
              { name: classField.trim() }
            ]
          }
        });
        if (targetClass) {
          await tx.classEnrollment.create({
            data: {
              classId: targetClass.id,
              studentId: newStudent.id,
            }
          });
        }
      }

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
          studyModel: studyModel || "Reguler",
          registrationTrack: registrationTrack || "REGULER",
          statusNote: statusNote?.trim() || null,
          mapsUrl: mapsUrl?.trim() || null,
          latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
          longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
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
          parentKtpUrl: body.parentKtpUrl?.trim() || null,
          ktpUrl: body.ktpUrl?.trim() || null,
          kkUrl: body.kkUrl?.trim() || null,
          birthCertUrl: body.birthCertUrl?.trim() || null,
          diplomaUrl: body.diplomaUrl?.trim() || null,
          skills: body.customFields ? (typeof body.customFields === "string" ? body.customFields : JSON.stringify(body.customFields)) : null,
          socialMedia: body.customDocs ? (typeof body.customDocs === "string" ? body.customDocs : JSON.stringify(body.customDocs)) : null,
          status: "APPROVED",
          createdUserId: newUser.id,
          verifiedById: adminUser.id,
          verifiedAt: new Date(),
        }
      });
      
      return newStudent;
    });

    // Re-fetch to get class name if enrolled
    const finalEnrollment = await prisma.classEnrollment.findFirst({
      where: { studentId: newStudentData.id },
      include: { class: true }
    });

    const responseItem: StudentItem = {
      id: newStudentData.id,
      nisn: newStudentData.nisn || "-",
      name: newStudentData.user.name,
      gender: (newStudentData.gender as "L" | "P") || "L",
      packet: (newStudentData.packetType as any) || "Paket C",
      studyModel: (newStudentData.studyModel as any) || "Reguler",
      class: finalEnrollment ? finalEnrollment.class.name : "Belum Ada Kelas",
      parent: newStudentData.parent?.user?.name || "-",
      phone: newStudentData.user.phone || "-",
      status: normalizeStudentStatus(newStudentData.status),
      statusNote: newStudentData.statusNote || undefined,
      registeredAt: formatDateDMY(newStudentData.registeredAt),
      mapsUrl: newStudentData.mapsUrl || undefined,
      latitude: newStudentData.latitude,
      longitude: newStudentData.longitude,
      address: newStudentData.address || "",
      birthDate: newStudentData.birthDate ? newStudentData.birthDate.toISOString().split('T')[0] : "",
      email: newStudentData.user.email,
      customFields: body.customFields || [],
      customDocs: body.customDocs || [],
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
      studyModel,
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
      parentEmail,
      motherName,
      guardianName,
      parentPhone,
      parentJob,
      motherJob,
      guardianJob,
      fatherIncome,
      motherIncome,
      status,
      statusNote,
      registeredAt,
      mapsUrl,
      latitude,
      longitude,
      parentKtpUrl,
      ktpUrl,
      kkUrl,
      birthCertUrl,
      diplomaUrl,
      customFields,
      customDocs,
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
      if (existingStudent.parent) {
        await tx.user.update({
          where: { id: existingStudent.parent.userId },
          data: {
            name: effectiveParentName || undefined,
            email: parentEmail ? parentEmail.trim().toLowerCase() : undefined,
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

      let parsedRegDate: Date | undefined = undefined;
      if (registeredAt) {
        const d = new Date(registeredAt);
        if (!isNaN(d.getTime())) parsedRegDate = d;
      }

      const updated = await tx.student.update({
        where: { id },
        data: {
          nisn: nisn ? nisn.trim() : undefined,
          nik: nik !== undefined ? nik : undefined,
          gender: gender || undefined,
          packetType: packet || undefined,
          studyModel: studyModel || undefined,
          status: status || undefined,
          statusNote: statusNote !== undefined ? statusNote : undefined,
          registeredAt: parsedRegDate !== undefined ? parsedRegDate : undefined,
          mapsUrl: mapsUrl !== undefined ? mapsUrl : undefined,
          latitude: latitude !== undefined ? (latitude !== null ? Number(latitude) : null) : undefined,
          longitude: longitude !== undefined ? (longitude !== null ? Number(longitude) : null) : undefined,
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

      // Handle class enrollment sync
      if (classField !== undefined) {
        if (!classField || classField === "Belum Ada Kelas" || classField === "-") {
          await tx.classEnrollment.deleteMany({
            where: { studentId: existingStudent.id }
          });
        } else {
          const targetClass = await tx.class.findFirst({
            where: {
              OR: [
                { id: classField },
                { name: classField.trim() }
              ]
            }
          });
          if (targetClass) {
            await tx.classEnrollment.deleteMany({
              where: { studentId: existingStudent.id }
            });
            await tx.classEnrollment.create({
              data: {
                classId: targetClass.id,
                studentId: existingStudent.id
              }
            });
          }
        }
      }

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
            studyModel: studyModel || undefined,
            registrationTrack: registrationTrack !== undefined ? registrationTrack : undefined,
            statusNote: statusNote !== undefined ? statusNote : undefined,
            mapsUrl: mapsUrl !== undefined ? mapsUrl : undefined,
            latitude: latitude !== undefined ? (latitude !== null ? Number(latitude) : null) : undefined,
            longitude: longitude !== undefined ? (longitude !== null ? Number(longitude) : null) : undefined,
            previousSchool: previousSchool !== undefined ? previousSchool : undefined,
            previousSchoolAddress: previousSchoolAddress !== undefined ? previousSchoolAddress : undefined,
            mutationFrom: mutationFrom !== undefined ? mutationFrom : undefined,
            parentName: effectiveParentName !== undefined ? effectiveParentName : undefined,
            parentEmail: parentEmail !== undefined ? (parentEmail ? parentEmail.trim().toLowerCase() : null) : undefined,
            motherName: motherName !== undefined ? motherName : undefined,
            guardianName: guardianName !== undefined ? guardianName : undefined,
            parentPhone: parentPhone !== undefined ? parentPhone : undefined,
            parentJob: parentJob !== undefined ? parentJob : undefined,
            motherJob: motherJob !== undefined ? motherJob : undefined,
            guardianJob: guardianJob !== undefined ? guardianJob : undefined,
            fatherIncome: fatherIncome !== undefined ? fatherIncome : undefined,
            motherIncome: motherIncome !== undefined ? motherIncome : undefined,
            avatarUrl: photoUrl !== undefined ? photoUrl : undefined,
            parentKtpUrl: parentKtpUrl !== undefined ? parentKtpUrl : undefined,
            ktpUrl: ktpUrl !== undefined ? ktpUrl : undefined,
            kkUrl: kkUrl !== undefined ? kkUrl : undefined,
            birthCertUrl: birthCertUrl !== undefined ? birthCertUrl : undefined,
            diplomaUrl: diplomaUrl !== undefined ? diplomaUrl : undefined,
            skills: customFields !== undefined ? (typeof customFields === "string" ? customFields : JSON.stringify(customFields)) : undefined,
            socialMedia: customDocs !== undefined ? (typeof customDocs === "string" ? customDocs : JSON.stringify(customDocs)) : undefined,
          }
        });
      } else {
        await tx.publicRegistration.create({
          data: {
            registrationNumber: `REG-SISWA-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`,
            type: "SISWA",
            fullName: name ? name.trim() : existingStudent.user.name,
            email: email ? email.trim() : existingStudent.user.email,
            phone: phone || existingStudent.user.phone,
            nik: nik || existingStudent.nik,
            nisn: nisn || existingStudent.nisn,
            gender: gender || existingStudent.gender,
            packetType: packet || existingStudent.packetType,
            studyModel: studyModel || existingStudent.studyModel || "Reguler",
            address: address || existingStudent.address,
            statusNote: statusNote || existingStudent.statusNote,
            mapsUrl: mapsUrl || existingStudent.mapsUrl,
            latitude: latitude !== undefined && latitude !== null ? Number(latitude) : existingStudent.latitude,
            longitude: longitude !== undefined && longitude !== null ? Number(longitude) : existingStudent.longitude,
            skills: customFields ? (typeof customFields === "string" ? customFields : JSON.stringify(customFields)) : null,
            socialMedia: customDocs ? (typeof customDocs === "string" ? customDocs : JSON.stringify(customDocs)) : null,
            status: "APPROVED",
            createdUserId: existingStudent.userId,
            verifiedById: adminUser.id,
            verifiedAt: new Date(),
          }
        });
      }

      return updated;
    });

    const finalEnrollment = await prisma.classEnrollment.findFirst({
      where: { studentId: updatedStudentData.id },
      include: { class: true }
    });

    const responseItem: StudentItem = {
      id: updatedStudentData.id,
      nisn: updatedStudentData.nisn || "-",
      name: updatedStudentData.user.name,
      gender: (updatedStudentData.gender as "L" | "P") || "L",
      packet: (updatedStudentData.packetType as any) || "Paket C",
      studyModel: (updatedStudentData.studyModel as any) || "Reguler",
      class: finalEnrollment ? finalEnrollment.class.name : "Belum Ada Kelas",
      parent: updatedStudentData.parent?.user?.name || "-",
      phone: updatedStudentData.user.phone || "-",
      status: normalizeStudentStatus(updatedStudentData.status),
      statusNote: updatedStudentData.statusNote || undefined,
      registeredAt: formatDateDMY(updatedStudentData.registeredAt),
      mapsUrl: updatedStudentData.mapsUrl || undefined,
      latitude: updatedStudentData.latitude,
      longitude: updatedStudentData.longitude,
      address: updatedStudentData.address || "",
      birthDate: updatedStudentData.birthDate ? updatedStudentData.birthDate.toISOString().split('T')[0] : "",
      email: updatedStudentData.user.email,
      customFields: customFields ? safeJsonParse(customFields, []) : undefined,
      customDocs: customDocs ? safeJsonParse(customDocs, []) : undefined,
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