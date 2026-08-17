import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/club-belajar/summary
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const totalClubs = await db.studyClub.count();
  const activeClubs = await db.studyClub.count({ where: { isActive: true } });
  const totalMembers = await db.studyClubMember.count({ where: { isActive: true } });
  const totalMeetings = await db.studyClubAttendance.count();

  // Category Distribution
  const clubs = await db.studyClub.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      scheduleDay: true,
      scheduleTime: true,
      mentorName: true,
      location: true,
      coverImage: true,
      _count: {
        select: {
          members: true,
          attendances: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const categoryStats: Record<string, number> = {};
  clubs.forEach((c) => {
    categoryStats[c.category] = (categoryStats[c.category] || 0) + 1;
  });

  // Recent 5 meetings with documentation
  const recentMeetings = await db.studyClubAttendance.findMany({
    take: 6,
    orderBy: { meetingDate: "desc" },
    include: {
      club: { select: { name: true, category: true, mentorName: true } },
      records: { select: { status: true } },
    },
  });

  return NextResponse.json({
    summary: {
      totalClubs,
      activeClubs,
      totalMembers,
      totalMeetings,
    },
    categoryStats,
    clubs,
    recentMeetings,
  });
}
