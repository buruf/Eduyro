// src/components/realtime/NotificationListener.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useRealtime } from "@/hooks/useRealtime";
import { userChannel } from "@/lib/realtime/server";

/**
 * Mount once in the dashboard layout. Subscribes to the current user's private
 * channel and pops a toast for incoming notifications. Also fires window-level
 * custom events that page-specific components can listen to for refetching.
 */
export function NotificationListener() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useRealtime(userId ? userChannel(userId) : null, {
    notification: (data: any) => {
      const icon = data.type === "LEVEL_ADVANCED" ? "🎉"
        : data.type === "STREAK_MILESTONE" ? "🔥"
        : data.type === "BADGE_EARNED" ? "🏅"
        : data.type === "PAYMENT_FAILED" ? "⚠️"
        : "📋";
      toast(
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0">{icon}</span>
          <div>
            <div className="font-semibold text-sm">{data.title}</div>
            {data.message && <div className="text-xs text-muted">{data.message}</div>}
          </div>
        </div>,
        { duration: 6000, position: "top-right" }
      );
      // Notify pages to refetch
      window.dispatchEvent(new CustomEvent("bs:notification", { detail: data }));
    },
    pdf_ready: (data: any) => {
      toast.success(
        <div>
          <div className="font-semibold text-sm">PDF ready</div>
          <a href={data.fileUrl} target="_blank" rel="noopener" className="text-brand-blue text-xs hover:underline">
            Download {data.fileName}
          </a>
        </div>,
        { duration: 10000 }
      );
    },
  });

  useEffect(() => {
    if (!userId) return;
  }, [userId]);

  return null;
}
