import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/rapor/editor?studentId=xxx&classId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId diperlukan" }, { status: 400 });
    }

    // 1. Fetch student info
    let student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        enrollments: {
          include: { class: { include: { homeroomTeacher: true } } },
        },
      },
    });

    if (!student) {
      student = await db.student.findFirst({
        include: {
          user: { select: { id: true, name: true, email: true } },
          enrollments: {
            include: { class: { include: { homeroomTeacher: true } } },
          },
        },
      });
    }

    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    // Find class
    let activeEnrollment = classId
      ? student.enrollments.find((e) => e.classId === classId)
      : student.enrollments[0];

    let currentClass: any = activeEnrollment?.class;
    if (!currentClass) {
      currentClass = await db.class.findFirst({
        include: { homeroomTeacher: true },
      });
      if (!currentClass) {
        currentClass = await db.class.create({
          data: {
            id: "class-paket-c-10",
            name: "Paket C - Kelas X Merdeka",
            level: "Paket C",
            academicYear: "2025/2026",
            semester: "GANJIL",
          },
          include: { homeroomTeacher: true },
        });
      }
    }

    const academicYear = currentClass?.academicYear || "2025/2026";
    const semester = currentClass?.semester || "GANJIL";

    // 2. Ensure default subjects exist in database
    let subjects = await db.subject.findMany({
      orderBy: { code: "asc" },
    });

    if (subjects.length < 5) {
      const defaultSubjects = [
        { code: "AGM-01", name: "Pendidikan Agama & Budi Pekerti", packetType: "UMUM" },
        { code: "PKN-01", name: "Pendidikan Pancasila & Kewarganegaraan", packetType: "UMUM" },
        { code: "IND-01", name: "Bahasa Indonesia", packetType: "UMUM" },
        { code: "MAT-01", name: "Matematika", packetType: "UMUM" },
        { code: "SOS-01", name: "Sosiologi & Pemberdayaan", packetType: "Paket C" },
        { code: "VOK-01", name: "Keterampilan Vokasi (Digital Marketing)", packetType: "UMUM" },
      ];

      for (const s of defaultSubjects) {
        await db.subject.upsert({
          where: { code: s.code },
          update: {},
          create: {
            code: s.code,
            name: s.name,
            packetType: s.packetType,
          },
        });
      }

      subjects = await db.subject.findMany({ orderBy: { code: "asc" } });
    }

    // 3. Fetch existing ReportCard
    const reportCard = await db.reportCard.findFirst({
      where: {
        studentId: student.id,
        ...(currentClass?.id && { classId: currentClass.id }),
        academicYear,
        semester,
      },
      include: {
        grades: { include: { subject: true } },
      },
    });

    // 4. Fetch actual attendance stats if not saved in report card
    const attendanceStats = await db.attendance.groupBy({
      by: ["status"],
      where: {
        userId: student.userId,
      },
      _count: { id: true },
    });

    const presentCount = attendanceStats.find((a) => a.status === "HADIR")?._count?.id || 0;
    const sickCount = attendanceStats.find((a) => a.status === "SAKIT")?._count?.id || 0;
    const permitCount = attendanceStats.find((a) => a.status === "IZIN")?._count?.id || 0;
    const absentCount = attendanceStats.find((a) => a.status === "ALPA")?._count?.id || 0;

    // 5. Build combined grade list
    const gradesList = subjects.map((sub) => {
      const existingGrade = reportCard?.grades.find((g) => g.subjectId === sub.id);
      return {
        subjectId: sub.id,
        subjectCode: sub.code,
        subjectName: sub.name,
        packetType: sub.packetType,
        dailyScore: existingGrade?.dailyScore ?? 85,
        examScore: existingGrade?.examScore ?? 88,
        finalScore: existingGrade?.finalScore ?? 86.5,
        letterGrade: existingGrade?.letterGrade ?? "A",
        competencyDesc:
          existingGrade?.competencyDesc ??
          `Menunjukkan penguasaan capaian pembelajaran yang sangat baik pada mata pelajaran ${sub.name}.`,
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user?.name || "Budi Santoso",
        nisn: student.nisn || "0081294812",
        nik: student.nik || "-",
        gender: student.gender || "L",
        birthPlace: student.birthPlace || "Jakarta",
        birthDate: student.birthDate,
        packetType: student.packetType || "Paket C",
        address: student.address || "Jl. Pendidikan No. 12",
      },
      class: {
        id: currentClass.id,
        name: currentClass.name,
        level: currentClass.level,
        academicYear: currentClass.academicYear,
        semester: currentClass.semester,
        homeroomTeacher: currentClass.homeroomTeacher?.name || "Drs. Hendra Gunawan",
      },
      reportCard: {
        id: reportCard?.id || null,
        academicYear,
        semester,
        totalAttendancePresent: reportCard?.totalAttendancePresent ?? (presentCount || 22),
        totalSick: reportCard?.totalSick ?? (sickCount || 1),
        totalPermit: reportCard?.totalPermit ?? permitCount,
        totalAbsent: reportCard?.totalAbsent ?? absentCount,
        spiritualScore: reportCard?.spiritualScore || "Sangat Baik",
        socialScore: reportCard?.socialScore || "Sangat Baik",
        homeroomNotes:
          reportCard?.homeroomNotes ||
          "Peserta didik menunjukkan motivasi belajar tinggi, kedisiplinan yang konsisten, dan aktif dalam kegiatan belajar mandiri.",
        homeroomTeacherName:
          reportCard?.homeroomTeacherName ||
          currentClass?.homeroomTeacher?.name ||
          "Drs. Hendra Gunawan",
        homeroomTeacherNip:
          reportCard?.homeroomTeacherNip || "19800412 200501 1 003",
        status: reportCard?.status || "DRAFT",
        publishedAt: reportCard?.publishedAt,
        grades: gradesList,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/rapor/editor:", error);
    return NextResponse.json({ error: "Gagal memuat detail e-Rapor" }, { status: 500 });
  }
}

// POST /api/rapor/editor
// Menyimpan / memperbarui nilai dan catatan e-Rapor
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki wewenang untuk mengubah data e-Rapor" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      studentId,
      classId,
      academicYear,
      semester,
      totalAttendancePresent,
      totalSick,
      totalPermit,
      totalAbsent,
      spiritualScore,
      socialScore,
      homeroomNotes,
      homeroomTeacherName,
      homeroomTeacherNip,
      status,
      grades,
    } = body;

    let targetClassId = classId;
    if (!targetClassId) {
      const defaultCls = await db.class.findFirst();
      targetClassId = defaultCls?.id;
    }

    if (!studentId || !targetClassId) {
      return NextResponse.json({ error: "studentId dan classId diperlukan" }, { status: 400 });
    }

    // 1. Upsert ReportCard
    const reportCard = await db.reportCard.upsert({
      where: {
        studentId_classId_academicYear_semester: {
          studentId,
          classId: targetClassId,
          academicYear: academicYear || "2025/2026",
          semester: semester || "GANJIL",
        },
      },
      update: {
        totalAttendancePresent: Number(totalAttendancePresent) || 0,
        totalSick: Number(totalSick) || 0,
        totalPermit: Number(totalPermit) || 0,
        totalAbsent: Number(totalAbsent) || 0,
        spiritualScore: spiritualScore || "Baik",
        socialScore: socialScore || "Baik",
        homeroomNotes: homeroomNotes || "",
        homeroomTeacherName: homeroomTeacherName || "Drs. Hendra Gunawan",
        homeroomTeacherNip: homeroomTeacherNip || "19800412 200501 1 003",
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      create: {
        studentId,
        classId: targetClassId,
        academicYear: academicYear || "2025/2026",
        semester: semester || "GANJIL",
        totalAttendancePresent: Number(totalAttendancePresent) || 0,
        totalSick: Number(totalSick) || 0,
        totalPermit: Number(totalPermit) || 0,
        totalAbsent: Number(totalAbsent) || 0,
        spiritualScore: spiritualScore || "Baik",
        socialScore: socialScore || "Baik",
        homeroomNotes: homeroomNotes || "",
        homeroomTeacherName: homeroomTeacherName || "Drs. Hendra Gunawan",
        homeroomTeacherNip: homeroomTeacherNip || "19800412 200501 1 003",
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    // 2. Delete and recreate grades
    if (grades && Array.isArray(grades)) {
      await db.reportCardGrade.deleteMany({
        where: { reportCardId: reportCard.id },
      });

      for (const gr of grades) {
        if (gr.subjectId) {
          const daily = parseFloat(gr.dailyScore) || 0;
          const exam = parseFloat(gr.examScore) || 0;
          const finalScore = parseFloat(gr.finalScore) || Math.round(((daily + exam) / 2) * 10) / 10;

          let letter = gr.letterGrade;
          if (!letter) {
            if (finalScore >= 85) letter = "A";
            else if (finalScore >= 75) letter = "B";
            else if (finalScore >= 60) letter = "C";
            else letter = "D";
          }

          await db.reportCardGrade.create({
            data: {
              reportCardId: reportCard.id,
              subjectId: gr.subjectId,
              dailyScore: daily,
              examScore: exam,
              finalScore,
              letterGrade: letter,
              competencyDesc: gr.competencyDesc || null,
            },
          });
        }
      }
    }

    return NextResponse.json({
      reportCardId: reportCard.id,
      status: reportCard.status,
      message: "Data e-Rapor berhasil disimpan!",
    });
  } catch (error) {
    console.error("Error in POST /api/rapor/editor:", error);
    return NextResponse.json({ error: "Gagal menyimpan data e-Rapor" }, { status: 500 });
  }
}
