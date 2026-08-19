import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPublicRegistration } from "@/lib/public-registration-db";
import { broadcastNotificationToRole } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find parent record by userId or email
    const parent: any = await db.parent.findFirst({
      where: {
        OR: [{ userId: user.id }, { user: { email: user.email.toLowerCase() } }],
      },
      include: {
        user: true,
        students: {
          include: {
            user: {
              include: {
                attendances: {
                  orderBy: { date: "desc" },
                  take: 30,
                },
              },
            },
            enrollments: {
              include: {
                class: {
                  include: {
                    homeroomTeacher: true,
                  },
                },
              },
            },
            submissions: {
              where: { score: { not: null } },
              include: {
                assignment: {
                  include: {
                    subject: true,
                  },
                },
              },
              orderBy: { submittedAt: "desc" },
              take: 15,
            },
            cbtSessions: {
              where: { status: "GRADED" },
              include: {
                assessment: {
                  include: {
                    subject: true,
                  },
                },
              },
              orderBy: { startedAt: "desc" },
              take: 15,
            },
            reportCards: {
              orderBy: { createdAt: "desc" },
            },
            clubMemberships: {
              include: {
                club: true,
              },
            },
          },
        },
      },
    });

    // If no parent record yet or no students linked, fallback to searching students if super_admin or user
    let childrenList: any[] = parent?.students || [];

    if (childrenList.length === 0 && user.role === "super_admin") {
      // For preview/super_admin testing, load active students
      childrenList = await db.student.findMany({
        take: 3,
        include: {
          user: {
            include: {
              attendances: {
                orderBy: { date: "desc" },
                take: 30,
              },
            },
          },
          enrollments: {
            include: {
              class: {
                include: {
                  homeroomTeacher: true,
                },
              },
            },
          },
          submissions: {
            where: { score: { not: null } },
            include: {
              assignment: {
                include: {
                  subject: true,
                },
              },
            },
            orderBy: { submittedAt: "desc" },
            take: 15,
          },
          cbtSessions: {
            where: { status: "GRADED" },
            include: {
              assessment: {
                include: {
                  subject: true,
                },
              },
            },
            orderBy: { startedAt: "desc" },
            take: 15,
          },
          reportCards: {
            orderBy: { createdAt: "desc" },
          },
          clubMemberships: {
            include: {
              club: true,
            },
          },
        },
      });
    }

    const formattedChildren = childrenList.map((s: any) => {
      const attendances: any[] = s.user?.attendances || [];
      const presentCount = attendances.filter(
        (a: any) => a.status === "PRESENT" || a.status === "HADIR" || a.status === "LATE" || a.status === "TERLAMBAT"
      ).length;
      const izinCount = attendances.filter((a: any) => a.status === "EXCUSED" || a.status === "IZIN").length;
      const sakitCount = attendances.filter((a: any) => a.status === "SICK" || a.status === "SAKIT").length;
      const alpaCount = attendances.filter((a: any) => a.status === "ABSENT" || a.status === "ALPA").length;
      const attendanceRate =
        attendances.length > 0
          ? `${Math.round((presentCount / attendances.length) * 100)}%`
          : "100%";

      // Grades
      const taskGrades = (s.submissions || [])
        .map((sub: any) => sub.score)
        .filter((g: any): g is number => typeof g === "number");
      const cbtGrades = (s.cbtSessions || [])
        .map((cbt: any) => cbt.score)
        .filter((score: any): score is number => typeof score === "number");

      const allGrades = [...taskGrades, ...cbtGrades];
      const avgGrade =
        allGrades.length > 0
          ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(1)
          : "-";

      const currentClass = s.enrollments?.[0]?.class;
      const homeroomName = currentClass?.homeroomTeacher?.name || "Belum Ditentukan";
      const className = currentClass?.name || `${s.packetType} Reguler`;

      return {
        id: s.id,
        name: s.user?.name || "Nama Siswa",
        email: s.user?.email || "-",
        phone: s.user?.phone || "-",
        nisn: s.nisn || "-",
        nik: s.nik || "-",
        packetType: s.packetType || "Paket C",
        studyModel: s.studyModel || "Reguler",
        status: s.status || "ACTIVE",
        gender: s.gender === "L" ? "Laki-laki" : s.gender === "P" ? "Perempuan" : s.gender || "-",
        birthPlace: s.birthPlace || "-",
        birthDate: s.birthDate ? new Date(s.birthDate).toISOString().split("T")[0] : "-",
        address: s.address || s.user?.address || "Kota Bandung",
        avatarUrl: s.user?.avatarUrl || null,
        className,
        homeroomTeacher: homeroomName,
        academicYear: currentClass?.academicYear || "2025/2026",
        semester: currentClass?.semester || "Ganjil",
        stats: {
          attendanceRate,
          totalMeetings: attendances.length,
          presentCount,
          izinCount,
          sakitCount,
          alpaCount,
          averageGrade: avgGrade,
          gradedTasksCount: taskGrades.length,
          cbtCompletedCount: cbtGrades.length,
          clubCount: s.clubMemberships?.length || 0,
          reportCardAvailable: (s.reportCards?.length || 0) > 0,
        },
        recentGrades: [
          ...(s.submissions || []).map((sub: any) => ({
            id: sub.id,
            type: "TUGAS",
            subject: sub.assignment?.subject?.name || "Tugas Mandiri",
            title: sub.assignment?.title || "Tugas",
            grade: sub.score,
            date: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("id-ID") : "-",
          })),
          ...(s.cbtSessions || []).map((cbt: any) => ({
            id: cbt.id,
            type: "CBT",
            subject: cbt.assessment?.subject?.name || "Ujian CBT",
            title: cbt.assessment?.title || "Ujian",
            grade: cbt.score,
            date: cbt.startedAt ? new Date(cbt.startedAt).toLocaleDateString("id-ID") : "-",
          })),
        ].slice(0, 10),
        attendanceLogs: attendances.slice(0, 15).map((att: any) => ({
          id: att.id,
          date: att.date ? new Date(att.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-",
          time: att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" : "-",
          status: att.status,
          method: att.validationMethod || "Presensi Digital",
        })),
        clubs: (s.clubMemberships || []).map((cm: any) => ({
          id: cm.club?.id,
          name: cm.club?.name,
          category: cm.club?.category,
          schedule: cm.club?.schedule,
          mentor: cm.club?.mentor,
          role: cm.role,
        })),
        reportCards: (s.reportCards || []).map((rc: any) => ({
          id: rc.id,
          academicYear: rc.academicYear,
          semester: rc.semester,
          status: rc.status,
          ranking: rc.ranking,
          gpa: rc.gpa,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      parent: parent
        ? {
            id: parent.id,
            name: parent.user?.name || user.name,
            relationship: parent.relationship || "Orang Tua / Wali",
            email: parent.user?.email || user.email,
            phone: parent.user?.phone || user.phone || "-",
            job: parent.job || "-",
            address: parent.address || "-",
          }
        : {
            id: "temp",
            name: user.name,
            relationship: "Orang Tua / Wali",
            email: user.email,
            phone: user.phone || "-",
            job: "-",
            address: "-",
          },
      children: formattedChildren,
    });
  } catch (error: any) {
    console.error("GET /api/parents/my-children Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memuat data anak" },
      { status: 500 }
    );
  }
}

// POST /api/parents/my-children: Add child (Link existing student OR register new child)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Find or create parent profile for current user
    let parent = await db.parent.findFirst({
      where: {
        OR: [{ userId: user.id }, { user: { email: user.email.toLowerCase() } }],
      },
    });

    if (!parent) {
      parent = await db.parent.create({
        data: {
          userId: user.id,
          relationship: "ORANG_TUA",
          address: (user as any).address || null,
        },
      });
    }

    // Action 1: Link Existing Student
    if (action === "LINK_EXISTING") {
      const { studentId, nisn } = body;

      if (!studentId && !nisn) {
        return NextResponse.json(
          { error: "Pilih siswa atau masukkan NISN yang ingin ditautkan" },
          { status: 400 }
        );
      }

      const student = await db.student.findFirst({
        where: {
          OR: [
            ...(studentId ? [{ id: studentId }] : []),
            ...(nisn ? [{ nisn: nisn.trim() }] : []),
          ],
        },
        include: { user: true },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Data siswa tidak ditemukan di sistem PKBM Askara." },
          { status: 404 }
        );
      }

      // Update student's parentId
      await db.student.update({
        where: { id: student.id },
        data: { parentId: parent.id },
      });

      // Broadcast notification
      await broadcastNotificationToRole(
        "admin",
        "Penautan Data Anak",
        `Orang Tua ${user.name} telah menautkan siswa ${student.user.name} (${student.packetType}) ke akunnya.`,
        "INFO",
        "/admin/parents"
      );

      return NextResponse.json({
        success: true,
        message: `Siswa ${student.user.name} (${student.packetType}) berhasil ditautkan ke akun Anda!`,
        student: {
          id: student.id,
          name: student.user.name,
          packetType: student.packetType,
          nisn: student.nisn,
        },
      });
    }

    // Action 2: Register New Child (SPMB Pendaftaran Anak Baru)
    if (action === "REGISTER_NEW") {
      const {
        childName,
        packetType,
        nisn,
        nik,
        gender,
        birthPlace,
        birthDate,
        studyModel,
        previousSchool,
        notes,
      } = body;

      if (!childName || !childName.trim()) {
        return NextResponse.json(
          { error: "Nama lengkap anak / calon siswa wajib diisi" },
          { status: 400 }
        );
      }

      if (!packetType) {
        return NextResponse.json(
          { error: "Jenjang paket anak wajib dipilih (Paket A / B / C)" },
          { status: 400 }
        );
      }

      const registration = await createPublicRegistration({
        type: "SISWA",
        fullName: childName.trim(),
        packetType: packetType,
        studyModel: studyModel || "Reguler",
        nisn: nisn?.trim() || null,
        nik: nik?.trim() || null,
        gender: gender || "L",
        birthPlace: birthPlace?.trim() || null,
        birthDate: birthDate || null,
        previousSchool: previousSchool?.trim() || null,
        parentName: user.name,
        parentEmail: user.email,
        parentPhone: user.phone || null,
        statusNote: notes
          ? `Catatan Orang Tua (${user.name}): ${notes}`
          : `Pendaftaran anak tambahan dari akun orang tua ${user.name} (${user.email})`,
        status: "PENDING",
      });

      // Notify Admins
      await broadcastNotificationToRole(
        "admin",
        "Pendaftaran Anak Baru (Orang Tua Terdaftar)",
        `${user.name} mendaftarkan anak tambahan: ${childName} untuk program ${packetType}.`,
        "INFO",
        "/admin/verifikasi-pendaftar"
      );
      await broadcastNotificationToRole(
        "super_admin",
        "Pendaftaran Anak Baru (Orang Tua Terdaftar)",
        `${user.name} mendaftarkan anak tambahan: ${childName} untuk program ${packetType}.`,
        "INFO",
        "/admin/verifikasi-pendaftar"
      );

      return NextResponse.json({
        success: true,
        registrationNumber: registration.registrationNumber,
        message: `Pendaftaran anak baru (${childName} - ${packetType}) berhasil diajukan dengan No. Registrasi ${registration.registrationNumber}! Berkas sedang diverifikasi oleh panitia SPMB.`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/parents/my-children Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses data anak" },
      { status: 500 }
    );
  }
}
