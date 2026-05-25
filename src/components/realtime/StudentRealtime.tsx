// src/components/realtime/StudentRealtime.tsx
"use client";

import { useRealtime } from "@/hooks/useRealtime";
import { studentChannel } from "@/lib/realtime/server";
import { toast } from "react-hot-toast";

/**
 * Mount inside the student dashboard. Listens for events on the student's
 * private channel and dispatches them as window events so the page can refetch.
 */
export function StudentRealtime({ studentId }: { studentId: string }) {
  useRealtime(studentId ? studentChannel(studentId) : null, {
    sheet_completed: (data: any) => {
      toast.success(`Sheet graded: ${data.score}/${data.totalProblems} (${Math.round(data.accuracyPct)}%)`);
      window.dispatchEvent(new CustomEvent("bs:sheet_completed", { detail: data }));
    },
    level_advanced: (data: any) => {
      toast.success(`🎉 Level up! You advanced from ${data.oldLevelCode} to the next level.`, { duration: 8000 });
      window.dispatchEvent(new CustomEvent("bs:sheet_completed", { detail: data }));
    },
    badge_earned: (data: any) => {
      const first = data.badges?.[0];
      if (first) toast(`🏅 Badge earned: ${first.badgeName ?? "New badge"}`, { duration: 5000 });
      window.dispatchEvent(new CustomEvent("bs:sheet_completed"));
    },
  });

  return null;
}
