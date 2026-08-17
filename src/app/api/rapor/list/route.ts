import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/rapor/list?classId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    // 1. Ensure default classes exist
    let classes = await db.class.findMany({
      include: {
        homeroomTeacher: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    if (classes.length === 0) {
      const teacher = await db.user.findFirst({ where: { role: "pendidik" } });
      const defaultClass = await db.class.create({
        data: {
          id: "class-paket-c-10",
          name: "Paket C - Kelas X Merdeka",
          level: "Paket C",
          academicYear: "2025/2026",
          semester: "GANJIL",
          homeroomTeacherId: teacher ? teacher.id : null,
        },
        include: { homeroomTeacher: { select: { id: true, name: true } } },
      });
      classes = [defaultClass];
    }

    // 2. Fetch all students from database
    let dbStudents = await db.student.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        enrollments: { include: { class: true } },
        reportCards: {
          select: {
            id: true,
            academicYear: true,
            semester: true,
            status: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    // 3. Ensure demo students exist safely if database has few students
    if (dbStudents.length < 3) {
      const demoList = [
        { name: "Budi Santoso", email: "budi.santoso@askara.sch.id", nisn: "0081294812", packet: "Paket C", gender: "L" },
        { name: "Siti Rahmawati", email: "siti.rahma@askara.sch.id", nisn: "0078912344", packet: "Paket B", gender: "P" },
        { name: "Ahmad Fauzi", email: "ahmad.fauzi@askara.sch.id", nisn: "0091234567", packet: "Paket C", gender: "L" },
        { name: "Dewi Lestari", email: "dewi.lestari@askara.sch.id", nisn: "0065432190", packet: "Paket A", gender: "P" },
        { name: "Rian Hidayat", email: "rian.hidayat@askara.sch.id", nisn: "0054321988", packet: "Paket C", gender: "L" },
      ];

      for (const d of demoList) {
        try {
          const existingByEmail = await db.user.findUnique({ where: { email: d.email } });
          const existingByNisn = await db.student.findUnique({ where: { nisn: d.nisn } });

          if (!existingByEmail && !existingByNisn) {
            const newUser = await db.user.create({
              data: {
                email: d.email,
                name: d.name,
                passwordHash: "$2a$10$demoHashPlaceholder",
                role: "siswa",
                studentProfile: {
                  create: {
                    nisn: d.nisn,
                    packetType: d.packet,
                    gender: d.gender,
                    status: "ACTIVE",
                  },
                },
              },
              include: { studentProfile: true },
            });

            if (newUser.studentProfile && classes[0]) {
              await db.classEnrollment.upsert({
                where: {
                  classId_studentId: {
                    classId: classes[0].id,
                    studentId: newUser.studentProfile.id,
                  },
                },
                update: {},
                create: {
                  classId: classes[0].id,
                  studentId: newUser.studentProfile.id,
                },
              });
            }
          }
        } catch (e) {
          // Ignore collision
        }
      }

      // Re-fetch students
      dbStudents = await db.student.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          enrollments: { include: { class: true } },
          reportCards: {
            select: {
              id: true,
              academicYear: true,
              semester: true,
              status: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { user: { name: "asc" } },
      });
    }

    // 4. Map students into standard response format
    const defaultClass = classes[0];
    const mappedStudents = dbStudents
      .map((st) => {
        const activeEnrollment = st.enrollments[0];
        const assignedClass = activeEnrollment?.class || defaultClass;

        return {
          enrollmentId: activeEnrollment?.id || `en-${st.id}`,
          studentId: st.id,
          studentName: st.user?.name || "Peserta Didik",
          nisn: st.nisn || "-",
          nik: st.nik || "-",
          gender: st.gender || "L",
          packetType: st.packetType || assignedClass?.level || "Paket C",
          classId: assignedClass?.id || "",
          className: assignedClass?.name || "Paket C - Kelas X Merdeka",
          academicYear: assignedClass?.academicYear || "2025/2026",
          semester: assignedClass?.semester || "GANJIL",
          reportCard:
            st.reportCards.find(
              (rc) =>
                rc.academicYear === (assignedClass?.academicYear || "2025/2026") &&
                rc.semester === (assignedClass?.semester || "GANJIL")
            ) || null,
        };
      })
      .filter((st) => !classId || st.classId === classId);

    return NextResponse.json({
      classes,
      students: mappedStudents,
    });
  } catch (error) {
    console.error("Error in /api/rapor/list:", error);
    return NextResponse.json({ error: "Gagal memuat daftar rapor siswa" }, { status: 500 });
  }
}
