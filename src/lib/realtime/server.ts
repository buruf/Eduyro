// src/lib/realtime/server.ts
// Pusher Channels server-side helper.
// Used to broadcast events (sheet completed, level advanced, badge earned, etc.)
// from API routes to subscribed clients in real time.

import Pusher from "pusher";

const pusher = process.env.PUSHER_APP_ID
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2",
      useTLS: true,
    })
  : null;

// ─────────────────────────────────────────────
// Event types — must match what the client subscribes to
// ─────────────────────────────────────────────

export type RealtimeEvent =
  | { type: "sheet_completed"; studentId: string; data: { worksheetId: string; accuracyPct: number; score: number } }
  | { type: "level_advanced"; studentId: string; data: { oldLevelCode: string; newLevelCode: string; subjectName: string } }
  | { type: "badge_earned"; studentId: string; data: { badgeName: string; iconEmoji: string } }
  | { type: "streak_updated"; studentId: string; data: { streak: number } }
  | { type: "notification"; userId: string; data: { title: string; message: string; type: string } }
  | { type: "pdf_ready"; userId: string; data: { fileUrl: string; fileName: string } }
  | { type: "student_active"; schoolId: string; data: { studentId: string; studentName: string } };

// ─────────────────────────────────────────────
// Channel naming conventions
// ─────────────────────────────────────────────

export function userChannel(userId: string) {
  return `private-user-${userId}`;
}

export function studentChannel(studentId: string) {
  return `private-student-${studentId}`;
}

export function parentChannel(parentId: string) {
  return `private-parent-${parentId}`;
}

export function schoolChannel(schoolId: string) {
  return `presence-school-${schoolId}`;
}

// ─────────────────────────────────────────────
// Broadcast
// ─────────────────────────────────────────────

export async function broadcast(channels: string[], event: string, payload: any): Promise<void> {
  if (!pusher) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[REALTIME DEV] ${channels.join(",")} → ${event}`, payload);
    }
    return;
  }
  try {
    await pusher.trigger(channels, event, payload);
  } catch (err) {
    console.error("[REALTIME] broadcast failed:", err);
  }
}

// ─────────────────────────────────────────────
// Auth callback handler — verifies user can subscribe to a private channel
// ─────────────────────────────────────────────

export async function authorizeChannel(params: {
  socketId: string;
  channelName: string;
  userId: string;
  userRole: string;
  userInfo?: any;
}): Promise<{ auth: string; channel_data?: string } | null> {
  if (!pusher) return null;

  // Allow user-specific private channels
  if (params.channelName === `private-user-${params.userId}`) {
    return pusher.authorizeChannel(params.socketId, params.channelName);
  }

  // Student channels — allow self, parent, or teacher
  if (params.channelName.startsWith("private-student-")) {
    const studentId = params.channelName.replace("private-student-", "");
    const allowed = await canAccessStudentRealtime(params.userId, studentId);
    if (allowed) {
      return pusher.authorizeChannel(params.socketId, params.channelName);
    }
  }

  // School presence channels — allow teachers/admins of that school
  if (params.channelName.startsWith("presence-school-")) {
    const schoolId = params.channelName.replace("presence-school-", "");
    const allowed = await canAccessSchoolRealtime(params.userId, schoolId);
    if (allowed) {
      return pusher.authorizeChannel(params.socketId, params.channelName, {
        user_id: params.userId,
        user_info: params.userInfo ?? {},
      });
    }
  }

  return null;
}

// ─────────────────────────────────────────────
// Authorization helpers
// ─────────────────────────────────────────────

async function canAccessStudentRealtime(userId: string, studentId: string): Promise<boolean> {
  const { db } = await import("@/lib/db");
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { parentLinks: { include: { parent: true } } },
  });
  if (!student) return false;
  if (student.userId === userId) return true; // self
  if (student.parentLinks.some((l) => l.parent.userId === userId)) return true; // parent
  return false;
}

async function canAccessSchoolRealtime(userId: string, schoolId: string): Promise<boolean> {
  const { db } = await import("@/lib/db");
  const teacher = await db.teacher.findFirst({ where: { userId, schoolId } });
  return Boolean(teacher);
}
