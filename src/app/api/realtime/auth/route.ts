// src/app/api/realtime/auth/route.ts
// Pusher Channels auth endpoint — verifies the current user has permission
// to subscribe to the requested private/presence channel.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { authorizeChannel } from "@/lib/realtime/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");
  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  const auth = await authorizeChannel({
    socketId,
    channelName,
    userId: session.user.id,
    userRole: (session.user as any).role ?? "STUDENT",
    userInfo: { name: session.user.name, image: session.user.image },
  });

  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(auth);
}
