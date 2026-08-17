import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/club-belajar/my-clubs
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. If role is SISWA
  if (user.role === "siswa") {
    const student = await db.student.findUnique({
      where: { userId: user.id },
      include: {
        clubMemberships: {
          include: {
            club: {
              include: {
                attendances: {
                  orderBy: { meetingDate: "desc" },
                  include: {
                    records: {
                      where: { studentId: { not: undefined } },
                    },
                  },
                },
                members: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ myClubs: [], availableClubs: [] });
    }

    // Process attendance statistics for each club the student is in
    const myClubs = student.clubMemberships.map((membership) => {
      const club = membership.club;
      const totalClubMeetings = club.attendances.length;

      // Find this student's records in the meetings
      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alfa = 0;

      const meetingHistory = club.attendances.map((att) => {
        const myRecord = att.records.find((r) => r.studentId === student.id);
        const status = myRecord ? myRecord.status : "BELUM_DIISI";
        if (status === "HADIR") hadir++;
        else if (status === "IZIN") izin++;
        else if (status === "SAKIT") sakit++;
        else if (status === "ALFA") alfa++;

        return {
          attendanceId: att.id,
          meetingDate: att.meetingDate,
          activityTitle: att.activityTitle,
          notes: att.notes,
          documentationUrl: att.documentationUrl,
          mediaType: att.mediaType,
          myStatus: status,
          remarks: myRecord?.remarks || null,
        };
      });

      const totalRecorded = hadir + izin + sakit + alfa;
      const attendancePercent =
        totalRecorded > 0 ? Math.round((hadir / totalRecorded) * 100) : 100;

      return {
        membershipId: membership.id,
        role: membership.role,
        joinedAt: membership.joinedAt,
        club: {
          id: club.id,
          name: club.name,
          category: club.category,
          description: club.description,
          visionGoals: club.visionGoals,
          mentorName: club.mentorName,
          scheduleDay: club.scheduleDay,
          scheduleTime: club.scheduleTime,
          location: club.location,
          coverImage: club.coverImage,
          maxMembers: club.maxMembers,
          memberCount: club.members.length,
        },
        stats: {
          totalMeetings: totalClubMeetings,
          hadir,
          izin,
          sakit,
          alfa,
          attendancePercent,
        },
        meetings: meetingHistory,
      };
    });

    // Also get all available clubs for joining
    const joinedClubIds = myClubs.map((m) => m.club.id);
    const availableClubs = await db.studyClub.findMany({
      where: {
        isActive: true,
        id: { notIn: joinedClubIds },
      },
      include: {
        _count: { select: { members: true, attendances: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      studentInfo: { id: student.id, name: user.name },
      myClubs,
      availableClubs,
    });
  }

  // 2. If role is ORANG_TUA
  if (user.role === "orang_tua") {
    const parent = await db.parent.findUnique({
      where: { userId: user.id },
      include: {
        students: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            clubMemberships: {
              include: {
                club: {
                  include: {
                    attendances: {
                      orderBy: { meetingDate: "desc" },
                      include: {
                        records: true,
                      },
                    },
                    members: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ childrenClubs: [] });
    }

    const childrenClubs = parent.students.map((child) => {
      const clubs = child.clubMemberships.map((membership) => {
        const club = membership.club;
        const totalMeetings = club.attendances.length;

        let hadir = 0;
        let izin = 0;
        let sakit = 0;
        let alfa = 0;

        const meetingHistory = club.attendances.map((att) => {
          const record = att.records.find((r) => r.studentId === child.id);
          const status = record ? record.status : "BELUM_DIISI";
          if (status === "HADIR") hadir++;
          else if (status === "IZIN") izin++;
          else if (status === "SAKIT") sakit++;
          else if (status === "ALFA") alfa++;

          return {
            attendanceId: att.id,
            meetingDate: att.meetingDate,
            activityTitle: att.activityTitle,
            notes: att.notes,
            documentationUrl: att.documentationUrl,
            mediaType: att.mediaType,
            status,
            remarks: record?.remarks || null,
          };
        });

        const totalRecorded = hadir + izin + sakit + alfa;
        const attendancePercent =
          totalRecorded > 0 ? Math.round((hadir / totalRecorded) * 100) : 100;

        return {
          membershipId: membership.id,
          role: membership.role,
          joinedAt: membership.joinedAt,
          club: {
            id: club.id,
            name: club.name,
            category: club.category,
            description: club.description,
            visionGoals: club.visionGoals,
            mentorName: club.mentorName,
            scheduleDay: club.scheduleDay,
            scheduleTime: club.scheduleTime,
            location: club.location,
            coverImage: club.coverImage,
          },
          stats: {
            totalMeetings,
            hadir,
            izin,
            sakit,
            alfa,
            attendancePercent,
          },
          meetings: meetingHistory,
        };
      });

      return {
        childId: child.id,
        childName: child.user?.name || "Nama Anak",
        nisn: child.nisn,
        packetType: child.packetType,
        clubs,
      };
    });

    return NextResponse.json({ childrenClubs });
  }

  return NextResponse.json({ error: "Role not supported" }, { status: 400 });
}

// POST /api/club-belajar/my-clubs
// Body: { clubId } - Siswa mendaftar ke club belajar
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "siswa") {
    return NextResponse.json({ error: "Hanya siswa yang dapat mendaftar" }, { status: 403 });
  }

  const student = await db.student.findUnique({
    where: { userId: user.id },
  });

  if (!student) {
    return NextResponse.json({ error: "Profil siswa tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json();
  const { clubId } = body;

  if (!clubId) {
    return NextResponse.json({ error: "clubId diperlukan" }, { status: 400 });
  }

  const club = await db.studyClub.findUnique({
    where: { id: clubId },
    include: { _count: { select: { members: true } } },
  });

  if (!club) {
    return NextResponse.json({ error: "Club Belajar tidak ditemukan" }, { status: 404 });
  }

  if (club._count.members >= club.maxMembers) {
    return NextResponse.json({ error: "Maaf, kuota anggota club ini sudah penuh" }, { status: 400 });
  }

  const existing = await db.studyClubMember.findUnique({
    where: { clubId_studentId: { clubId, studentId: student.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "Anda sudah terdaftar di club ini" }, { status: 400 });
  }

  const membership = await db.studyClubMember.create({
    data: {
      clubId,
      studentId: student.id,
      role: "ANGGOTA",
    },
  });

  return NextResponse.json({ membership }, { status: 201 });
}

// DELETE /api/club-belajar/my-clubs?membershipId=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "siswa") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const student = await db.student.findUnique({
    where: { userId: user.id },
  });

  if (!student) {
    return NextResponse.json({ error: "Profil siswa tidak ditemukan" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const membershipId = searchParams.get("membershipId");

  if (!membershipId) {
    return NextResponse.json({ error: "membershipId diperlukan" }, { status: 400 });
  }

  const membership = await db.studyClubMember.findUnique({
    where: { id: membershipId },
  });

  if (!membership || membership.studentId !== student.id) {
    return NextResponse.json({ error: "Keanggotaan tidak ditemukan" }, { status: 404 });
  }

  await db.studyClubMember.delete({
    where: { id: membershipId },
  });

  return NextResponse.json({ message: "Berhasil keluar dari club belajar" });
}
