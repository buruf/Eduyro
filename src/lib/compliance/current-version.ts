// src/lib/compliance/current-version.ts
// The date shown on a legal page must be the date of the document users are
// actually accepting. Hardcoding it let the pages drift: they read
// "Last updated: May 27, 2026" while every signup was binding people to the
// 2026-06-28 version.
import { db } from "@/lib/db";

/** Effective date of the CURRENT published document, formatted for display.
 *  Returns null when nothing is published yet, so the page can omit the line
 *  rather than print a date it cannot stand behind. */
export async function currentLegalDate(
  type: "PRIVACY" | "TERMS" | "COPPA_CONSENT",
): Promise<string | null> {
  try {
    const doc = await db.legalDocument.findFirst({
      where: { type: type as never, isCurrent: true },
      select: { effectiveAt: true },
    });
    if (!doc) return null;
    return doc.effectiveAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return null; // a legal page must render even if the database is unreachable
  }
}
