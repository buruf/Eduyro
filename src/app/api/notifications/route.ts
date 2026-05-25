// src/app/api/notifications/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withAuth, parseRequest } from "@/lib/api/helpers";
import { MarkNotificationReadSchema } from "@/lib/validation/schemas";

// List notifications
export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const url = new URL(req.url);
      const unreadOnly = url.searchParams.get("unread") === "true";
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

      const notifications = await db.notification.findMany({
        where: {
          userId: ctx.userId,
          ...(unreadOnly && { isRead: false }),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      const unreadCount = await db.notification.count({
        where: { userId: ctx.userId, isRead: false },
      });

      return ok({ notifications, unreadCount });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, MarkNotificationReadSchema);
    if ("status" in parsed) return parsed;

    try {
      await db.notification.updateMany({
        where: {
          id: { in: parsed.data.notificationIds },
          userId: ctx.userId,
        },
        data: { isRead: true },
      });

      return ok({ marked: parsed.data.notificationIds.length });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
