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

    // 3. Map students into standard response format
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
