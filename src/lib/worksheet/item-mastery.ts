// src/lib/worksheet/item-mastery.ts
// Item-level (per-distinct-question) mastery for non-math skills.
//
// Problem ids are regenerated every time a sheet is built, so distinct-item
// identity is keyed by the QUESTION TEXT (normalized), never by problemId. The
// id→question mapping is only valid WITHIN a single stored sheet, so we resolve
// each answer against its own worksheet's problems, then dedupe across sheets by
// question. For each distinct item we use the student's MOST RECENT attempt to
// decide correctness ("current mastery", so a later correct retry counts and a
// later miss is not hidden by an earlier success).

export interface CompletedSheetLite {
  completedAt: Date | string;
  answers: unknown;  // [{ problemId, answer, isCorrect }]
  problems: unknown; // [{ id, question, points? }]
}

export interface ItemMastery {
  bankSize: number;        // distinct gradable items the skill's bank holds
  distinctSeen: number;    // distinct items the student has attempted
  distinctCorrect: number; // distinct items CONFIRMED: last two attempts correct, >=24h apart
  itemAccuracyPct: number; // distinctCorrect / distinctSeen * 100 (0 if none seen)
  coveragePct: number;     // distinctSeen / bankSize * 100 (0 if bank unknown)
}

const norm = (q: string) => q.replace(/\s+/g, " ").trim().toLowerCase();
const isPassageHeader = (q: string) =>
  q.startsWith("READ THIS PASSAGE") || /\(passage — no answer required\)/i.test(q);

export function emptyItemMastery(bankSize = 0): ItemMastery {
  return { bankSize, distinctSeen: 0, distinctCorrect: 0, itemAccuracyPct: 0, coveragePct: 0 };
}

export function computeItemMastery(
  sheets: CompletedSheetLite[],
  bankQuestions: string[],
): ItemMastery {
  const bankSize = new Set(bankQuestions.map(norm)).size;

  // Oldest → newest so the last write wins (latest attempt per distinct item).
  const ordered = [...sheets].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );

  // Full attempt history per distinct item (time + correctness), oldest first.
  const history = new Map<string, { at: number; correct: boolean }[]>();
  for (const cs of ordered) {
    const problems = Array.isArray(cs.problems) ? (cs.problems as any[]) : [];
    const idToQ = new Map<string, string>();
    for (const p of problems) {
      if (p && typeof p.id === "string" && typeof p.question === "string") idToQ.set(p.id, p.question);
    }
    const at = new Date(cs.completedAt).getTime();
    const answers = Array.isArray(cs.answers) ? (cs.answers as any[]) : [];
    for (const a of answers) {
      const q = a && typeof a.problemId === "string" ? idToQ.get(a.problemId) : undefined;
      if (!q || isPassageHeader(q)) continue;
      const k = norm(q);
      history.set(k, [...(history.get(k) ?? []), { at, correct: !!a.isCorrect }]);
    }
  }

  // CONFIRMED mastery, not latest-attempt-wins. With 4-option MC, "latest wins"
  // gave a guessing child a 68% chance of a permanent "mastered" mark within 4
  // exposures (expert-quantified) — repetition guaranteed eventual mastery of
  // every item. An item now counts only when its two most recent attempts are
  // BOTH correct and at least 24h apart: guessing right twice in a row across
  // separate days is ~6%, and the gap adds the retention requirement that is
  // the actual point of mastery. A later miss still downgrades immediately.
  const CONFIRM_GAP_MS = 24 * 60 * 60 * 1000;
  let distinctSeen = 0;
  let distinctCorrect = 0;
  for (const attempts of history.values()) {
    distinctSeen++;
    const last = attempts[attempts.length - 1];
    const prev = attempts[attempts.length - 2];
    if (last.correct && prev?.correct && last.at - prev.at >= CONFIRM_GAP_MS) distinctCorrect++;
  }
  return {
    bankSize,
    distinctSeen,
    distinctCorrect,
    itemAccuracyPct: distinctSeen > 0 ? (distinctCorrect / distinctSeen) * 100 : 0,
    coveragePct: bankSize > 0 ? Math.min(100, (distinctSeen / bankSize) * 100) : 0,
  };
}
