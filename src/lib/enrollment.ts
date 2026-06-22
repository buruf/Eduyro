// src/lib/enrollment.ts
// Subject enrollment is parent-controlled: the paying parent decides which
// subjects a child can see; the child can never self-enrol. A child only ever
// sees subjects that are enrolled AND enabled.
//
// Default model (per product council): when a child is added, ALL subjects are
// enrolled and enabled (the parent paid for the whole child). The parent may
// mute any subject to create Kumon-style focus — an optional off-switch they're
// never forced to use.
//
// Legacy fallback: children created before this table exists have NO rows. We
// treat "no rows at all" as "all subjects enabled" so existing kids are never
// locked out, and lazily backfill default rows when convenient.

import { db } from "@/lib/db";
import type { SubjectSlug } from "@prisma/client";

export const ALL_SUBJECT_SLUGS: SubjectSlug[] = ["MATH", "READING", "WRITING", "SCIENCE"];

type Tx = Pick<typeof db, "subject" | "studentSubject">;

// True when the error is Prisma's "table/relation does not exist" (P2021) — i.e.
// the StudentSubject table hasn't been created yet (deploy ran before db push).
// We treat that exactly like "no enrollment rows": every subject is enabled, so
// the app keeps working until the migration is applied.
function isMissingTableError(e: unknown): boolean {
  return !!e && typeof e === "object" && (e as any).code === "P2021";
}

/**
 * Create the default enrollment rows (all subjects, enabled) for a student.
 * Idempotent: skips subjects that already have a row. Safe to call inside a
 * transaction by passing `tx`.
 */
export async function ensureDefaultEnrollments(studentId: string, tx: Tx = db): Promise<void> {
  try {
    const subjects = await tx.subject.findMany({ select: { id: true } });
    if (subjects.length === 0) return;
    await tx.studentSubject.createMany({
      data: subjects.map((s) => ({ studentId, subjectId: s.id, enabled: true })),
      skipDuplicates: true,
    });
  } catch (e) {
    if (isMissingTableError(e)) return; // table not migrated yet — no-op
    throw e;
  }
}

/**
 * The set of subject slugs a child may currently access. Returns enabled
 * subjects only. If the student has NO enrollment rows at all (legacy), every
 * subject is considered enabled.
 */
export async function enabledSubjectSlugs(studentId: string): Promise<Set<SubjectSlug>> {
  try {
    const rows = await db.studentSubject.findMany({
      where: { studentId },
      select: { enabled: true, subject: { select: { slug: true } } },
    });
    if (rows.length === 0) return new Set(ALL_SUBJECT_SLUGS); // legacy: all enabled
    return new Set(rows.filter((r) => r.enabled).map((r) => r.subject.slug));
  } catch (e) {
    if (isMissingTableError(e)) return new Set(ALL_SUBJECT_SLUGS); // not migrated yet
    throw e;
  }
}

/** Whether a specific subject is accessible to a child right now. */
export async function isSubjectEnabled(studentId: string, slug: SubjectSlug): Promise<boolean> {
  const enabled = await enabledSubjectSlugs(studentId);
  return enabled.has(slug);
}
