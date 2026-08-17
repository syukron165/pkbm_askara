import { db } from "./db";

/**
 * Creates a notification for a specific user.
 */
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: string = "INFO",
  actionUrl?: string
) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        actionUrl,
      },
    });
    return notification;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return null;
  }
}

/**
 * Broadcasts a notification to all users of a specific role.
 */
export async function broadcastNotificationToRole(
  role: string,
  title: string,
  message: string,
  type: string = "ANNOUNCEMENT",
  actionUrl?: string
) {
  try {
    const users = await db.user.findMany({
      where: { role, isActive: true },
      select: { id: true },
    });

    if (users.length === 0) return 0;

    const notificationsData = users.map((user) => ({
      userId: user.id,
      title,
      message,
      type,
      actionUrl,
    }));

    const result = await db.notification.createMany({
      data: notificationsData,
    });

    return result.count;
  } catch (error) {
    console.error("Failed to broadcast notification:", error);
    return 0;
  }
}
