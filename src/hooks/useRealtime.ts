// src/hooks/useRealtime.ts
"use client";

import { useEffect, useRef } from "react";
import { subscribe } from "@/lib/realtime/client";

/**
 * Subscribe to a Pusher channel for the lifetime of the component.
 * Pass an object of event name -> handler.
 *
 * @example
 *   useRealtime(`private-student-${studentId}`, {
 *     sheet_completed: (data) => refetch(),
 *     level_advanced: (data) => showToast(data),
 *   });
 */
export function useRealtime(
  channelName: string | null | undefined,
  events: Record<string, (data: any) => void>
) {
  // Stable handler refs so we don't re-subscribe on every render
  const handlersRef = useRef(events);
  handlersRef.current = events;

  useEffect(() => {
    if (!channelName) return;

    // Wrap each handler so it always calls the latest version
    const wrapped: Record<string, (data: any) => void> = {};
    Object.keys(events).forEach((event) => {
      wrapped[event] = (data: any) => handlersRef.current[event]?.(data);
    });

    return subscribe(channelName, wrapped);
  }, [channelName, Object.keys(events).join(",")]);
}
