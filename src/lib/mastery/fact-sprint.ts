// src/lib/mastery/fact-sprint.ts
// The DAILY FACT SPRINT — a short, rapid-fire retrieval drill on the four
// arithmetic-fact levels (M3 +, M4 −, M5 ×, M6 ÷). Retrieval practice (recalling
// a fact fast, repeatedly, spaced over days) is the single most effective way to
// move a fact from "count it out" to "just know it" — far more than seeing it 3
// times on one worksheet. The sprint complements the graded packet: it is NOT
// graded for advancement; it builds automaticity.
//
// This module only BUILDS THE FACT POOL (pure, no DB, no migration). The client
// runs the drill and does the adaptive re-queueing (slow/wrong facts come back
// sooner, mastered facts fade) using localStorage per child.

export interface Fact { q: string; a: string; key: string }

// Which single-fact operation each fact level drills.
export const FACT_LEVEL_OP: Record<string, "+" | "-" | "×" | "÷"> = {
  M3: "+", M4: "-", M5: "×", M6: "÷",
};

export function isFactLevel(levelCode: string): boolean {
  return levelCode in FACT_LEVEL_OP;
}

/**
 * The fact family for a level's operation. `reach` (0..1) is how far through the
 * level the student is (currentSkillIndex / totalSkills) — early on we keep the
 * operands small (the facts they've met), widening as they progress, so the
 * sprint always covers "facts you've already learned", spaced.
 */
export function buildFactPool(levelCode: string, reach = 1): Fact[] {
  const op = FACT_LEVEL_OP[levelCode];
  if (!op) return [];
  const r = Math.max(0.35, Math.min(1, reach)); // never trivially tiny
  const out: Fact[] = [];

  if (op === "+") {
    const hi = Math.round(9 * r);
    for (let a = 0; a <= hi; a++) for (let b = 0; b <= hi; b++)
      out.push({ q: `${a} + ${b}`, a: String(a + b), key: `a:${a}:${b}` });
  } else if (op === "-") {
    const hi = Math.round(18 * r);
    for (let a = 0; a <= hi; a++) for (let b = 0; b <= Math.min(a, 9); b++)
      out.push({ q: `${a} − ${b}`, a: String(a - b), key: `s:${a}:${b}` });
  } else if (op === "×") {
    const hi = Math.round(12 * r);
    for (let a = 0; a <= hi; a++) for (let b = 0; b <= hi; b++)
      out.push({ q: `${a} × ${b}`, a: String(a * b), key: `m:${a}:${b}` });
  } else { // ÷
    const hi = Math.round(12 * r);
    for (let b = 1; b <= hi; b++) for (let q = 0; q <= hi; q++)
      out.push({ q: `${b * q} ÷ ${b}`, a: String(q), key: `d:${b}:${q}` });
  }
  return out;
}

/** How long the sprint runs, in seconds. Short by design — a warm-up, not a slog. */
export const SPRINT_SECONDS = 90;
