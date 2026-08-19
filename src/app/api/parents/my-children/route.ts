import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

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
