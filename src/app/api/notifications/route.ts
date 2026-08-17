import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/notifications
// Fetch all notifications for the current user (limit 50)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (error) {
    console.error("[GET_NOTIFICATIONS]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// PATCH /api/notifications
// Mark a specific notification as read
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    const notification = await db.notification.updateMany({
      where: {
        id,
        userId: user.id, // ensure user owns the notification
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true, count: notification.count }, { status: 200 });
  } catch (error) {
    console.error("[PATCH_NOTIFICATION]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
