// src/lib/realtime/client.ts
"use client";

// Pusher Channels client wrapper.
// Lazily creates a single Pusher instance, exposes typed subscribe/unsubscribe.

import PusherClient from "pusher-js";

let client: PusherClient | null = null;

function getClient(): PusherClient | null {
  if (typeof window === "undefined") return null;
  if (client) return client;
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
    console.log("[REALTIME] Pusher not configured — running in disconnected mode");
    return null;
  }
  client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2",
    authEndpoint: "/api/realtime/auth",
    // Reconnect aggressively
    activityTimeout: 20000,
    pongTimeout: 5000,
  });
  return client;
}

// ─────────────────────────────────────────────
// Subscribe helper
// ─────────────────────────────────────────────

export function subscribe(
  channelName: string,
  events: Record<string, (data: any) => void>
): () => void {
  const pusher = getClient();
  if (!pusher) return () => {};

  const channel = pusher.subscribe(channelName);
  Object.entries(events).forEach(([event, handler]) => {
    channel.bind(event, handler);
  });

  return () => {
    Object.keys(events).forEach((event) => channel.unbind(event));
    pusher.unsubscribe(channelName);
  };
}

// ─────────────────────────────────────────────
// Convenience: disconnect on logout
// ─────────────────────────────────────────────

export function disconnect() {
  if (client) {
    client.disconnect();
    client = null;
  }
}
