// tests/unit/child-journey.test.ts
//
// THE CHILD-JOURNEY TEST.
//
// Every other test in this repo checks a function. This one walks a simulated
// child through the curriculum the way a real one experiences it — day after
// day, lesson after lesson — and asserts the things that must be true of that
// EXPERIENCE rather than of any single function's output.
//
// It exists because four real bugs shipped past a green suite and were only
// found by opening one real child's data by hand:
//
//   · she was handed content sheet 62 of a 45-64 range on her first day of a
//     lesson, because the sheet counter never reset when the skill map advanced
//   · that lesson's first sheet demanded a carry out of the TENS column, a
//     skill the curriculum does not teach for another two lessons
//   · the difficulty window was a flat 70% of the pool at every point in a
//     unit, so even a correctly positioned first sheet drew from near the top
//   · a reading passage shipped as an item worth 0 points was still counted in
//     the denominator and marked wrong, capping the sheet below 100% before
//     the child answered anything
//
// The invariants below would have failed on all four. When this test goes red,
// a child's day got worse — that is the whole contract.
import { getMathLevelSkills, generateProblems, type LevelSkill } from "@/lib/worksheet/generator";
import { contentSheetFor } from "@/lib/worksheet/today-packet";
import { scoreSubmission, isGradable } from "@/lib/grading";
import { buildScaffold } from "@/lib/tutor/scaffold";

const MATH_LEVELS = Array.from({ length: 18 }, (_, i) => `M${i + 1}`);

interface Sheet {
  level: string;
  lesson: string;
  contentSheet: number;
  questions: string[];
  answers: string[];
}

/** Generate the sheet a child on `lesson` would actually be served on the
 *  `doneInLesson`-th day of it — the same call the daily packet makes. */
function serve(level: string, lesson: LevelSkill, doneInLesson: number): Sheet {
  const contentSheet = contentSheetFor(lesson.range, doneInLesson);
  const out: any = generateProblems({
    subjectSlug: "MATH",
    levelCode: level,
    skillName: lesson.label,
    problemCount: 30,
    timeLimitMinutes: 10,
    sheetNumber: contentSheet,
    totalSheets: 100,
  });
  const problems = (out?.problems ?? []) as any[];
  return {
    level,
    lesson: lesson.label,
    contentSheet,
    questions: problems.map((p) => String(p.question ?? "").replace(/\s+/g, " ").trim()),
    answers: problems.map((p) => String(p.answer ?? "")),
  };
}

/** Does this addition problem's answer cross 100 — i.e. does it need a carry
 *  out of the TENS column? That is the prerequisite the 2-digit regrouping
 *  lesson does not teach; "3-digit addition" does, two lessons later. */
function crossesHundred(q: string): boolean {
  const plain = q.match(/^(\d+)\s*\+\s*(\d+)$/);
  if (plain) return Number(plain[1]) + Number(plain[2]) > 99;
  const missing = q.match(/^_+\s*\+\s*\d+\s*=\s*(\d+)$/);
  return missing ? Number(missing[1]) > 99 : false;
}

describe("child journey — 30 days through the math curriculum", () => {
  // ── The bug that started this: position within a lesson ───────────────────
  describe("a lesson starts at the start", () => {
    it("hands a child the FIRST sheet of a lesson on their first day of it", () => {
      for (const level of MATH_LEVELS) {
        for (const lesson of getMathLevelSkills(level)) {
          expect(contentSheetFor(lesson.range, 0)).toBe(lesson.range[0]);
        }
      }
    });

    it("advances one content sheet per completed sheet, and never past the end", () => {
      for (const level of MATH_LEVELS) {
        for (const lesson of getMathLevelSkills(level)) {
          const [lo, hi] = lesson.range;
          let prev = -1;
          for (let done = 0; done < hi - lo + 40; done++) {
            const at = contentSheetFor(lesson.range, done);
            expect(at).toBeGreaterThanOrEqual(lo);
            expect(at).toBeLessThanOrEqual(hi);
            expect(at).toBeGreaterThanOrEqual(prev); // never goes backwards
            prev = at;
          }
        }
      }
    });

    it("does not carry a child's position from one lesson into the next", () => {
      // The shipped bug in one line: a child 37 sheets into a level landed at
      // range[0] + (37 % size) when they advanced, not at range[0].
      const lessons = getMathLevelSkills("M3");
      const regroup = lessons.find((l) => l.label === "2-digit addition (regrouping)")!;
      expect(regroup).toBeDefined();
      expect(contentSheetFor(regroup.range, 0)).toBe(45);
      expect(contentSheetFor(regroup.range, 0)).not.toBe(62);
    });
  });

  // ── The prerequisite invariant ────────────────────────────────────────────
  describe("a lesson never demands a skill a later lesson teaches", () => {
    it("keeps answers under 100 on the early sheets of 2-digit regrouping", () => {
      const lesson = getMathLevelSkills("M3").find(
        (l) => l.label === "2-digit addition (regrouping)",
      )!;
      // The first third of the unit is the taught case: a carry out of the ONES
      // column only. Crossing 100 needs a tens carry, taught two lessons later.
      const span = lesson.range[1] - lesson.range[0];
      for (let day = 0; day <= Math.floor(span / 3); day++) {
        const sheet = serve("M3", lesson, day);
        const over = sheet.questions.filter(crossesHundred);
        expect({ day, contentSheet: sheet.contentSheet, over }).toEqual({
          day,
          contentSheet: sheet.contentSheet,
          over: [],
        });
      }
    });

    it("does introduce the harder case later in the unit", () => {
      // The ramp has to actually go somewhere — a unit that never gets harder
      // is its own failure.
      const lesson = getMathLevelSkills("M3").find(
        (l) => l.label === "2-digit addition (regrouping)",
      )!;
      const last = serve("M3", lesson, lesson.range[1] - lesson.range[0]);
      expect(last.questions.filter(crossesHundred).length).toBeGreaterThan(0);
    });
  });

  // ── Sheet sanity, walked across every lesson of every level ───────────────
  describe("every sheet a child can be served is well formed", () => {
    // Walk EVERY servable sheet of every lesson — the whole map, as a child
    // would meet it over months, not a sample.
    const all: { where: string; distinct: number; of: number; blank: number }[] = [];
    beforeAll(() => {
      for (const level of MATH_LEVELS) {
        for (const lesson of getMathLevelSkills(level)) {
          for (let day = 0; day <= lesson.range[1] - lesson.range[0]; day++) {
            const sheet = serve(level, lesson, day);
            if (!sheet.questions.length) continue;
            all.push({
              where: `${level} "${lesson.label}" sheet ${sheet.contentSheet}`,
              distinct: new Set(sheet.questions).size,
              of: sheet.questions.length,
              blank: sheet.answers.filter((a) => a.trim() === "").length,
            });
          }
        }
      }
    });

    it("gives every question an answer", () => {
      expect(all.filter((s) => s.blank > 0).map((s) => s.where)).toEqual([]);
    });

    // Was a ratchet pinned at 103 while the thin banks were being filled. All
    // eleven units have been widened, so this is now an outright rule: no
    // child should ever answer the same question twice on one sheet, and a new
    // lesson may not ship without enough material to fill its sheets.
    it("never repeats a question on a sheet", () => {
      const repeating = all.filter((s) => s.distinct < s.of);
      if (repeating.length) {
        const worst = [...repeating]
          .sort((a, b) => a.distinct / a.of - b.distinct / b.of)
          .slice(0, 10)
          .map((s) => `${s.distinct}/${s.of} distinct — ${s.where}`);
        throw new Error(
          `${repeating.length} of ${all.length} servable sheets repeat a question — that lesson's ` +
            `content bank is too thin to fill a sheet.\nWorst:\n  ${worst.join("\n  ")}`,
        );
      }
      expect(repeating).toEqual([]);
    });

    it("never leaves a sheet less than half distinct", () => {
      // Round-robin on a small fact set is fine; a child answering the same
      // question twelve times on one sheet is not.
      const tooThin = all
        .filter((s) => s.distinct * 2 < s.of)
        .map((s) => `${s.distinct}/${s.of} — ${s.where}`);
      expect(tooThin).toEqual([]);
    });
  });

  // ── Scoring, as the child's day actually records it ───────────────────────
  describe("what the child gets credit for", () => {
    it("never counts an item worth zero points as a question", () => {
      // A reading passage ships as points: 0 with the answer "(passage — no
      // answer required)". Counting it made every passage sheet unwinnable.
      const graded = [
        { isCorrect: false, points: 0 }, // the passage, left blank
        { isCorrect: true, points: 1 },
        { isCorrect: true, points: 1 },
        { isCorrect: false, points: 0 }, // a wrong answer scores 0 points too…
      ];
      // …so gradability must come from the PROBLEM, not from whether the child
      // got it right. Here the caller passes the problem's own points.
      const items = [
        { isCorrect: false, points: 0 },
        { isCorrect: true, points: 1 },
        { isCorrect: true, points: 1 },
      ];
      const r = scoreSubmission(items, null);
      expect(r.totalProblems).toBe(2);
      expect(r.score).toBe(2);
      expect(r.accuracyPct).toBe(100);
      expect(graded.filter(isGradable).length).toBe(2);
    });

    it("records first-try accuracy, clamped to what was actually answered", () => {
      const items = Array.from({ length: 10 }, () => ({ isCorrect: true, points: 1 }));
      // Retried until right, but only 6 were right first time.
      expect(scoreSubmission(items, 60)).toEqual({ score: 6, totalProblems: 10, accuracyPct: 60 });
      // A client claiming more than the final answers support is clamped down.
      const half = Array.from({ length: 10 }, (_, i) => ({ isCorrect: i < 5, points: 1 }));
      expect(scoreSubmission(half, 100)).toEqual({ score: 5, totalProblems: 10, accuracyPct: 50 });
      // Paper submissions omit first-try: final IS first try.
      expect(scoreSubmission(half, null)).toEqual({ score: 5, totalProblems: 10, accuracyPct: 50 });
    });

    it("is internally consistent: score always matches the recorded accuracy", () => {
      for (let n = 1; n <= 30; n++) {
        for (let correct = 0; correct <= n; correct++) {
          const items = Array.from({ length: n }, (_, i) => ({ isCorrect: i < correct, points: 1 }));
          for (const ft of [null, 0, 25, 50, 75, 100]) {
            const r = scoreSubmission(items, ft);
            expect(r.totalProblems).toBe(n);
            expect(r.score).toBe(Math.round((r.accuracyPct / 100) * r.totalProblems));
            expect(r.score).toBeLessThanOrEqual(correct);
          }
        }
      }
    });
  });

  // ── what happens when a child gets it WRONG ────────────────────────────
  // A wrong answer is the moment teaching matters most. The page swaps in the
  // unit's worked example whenever the scaffold did not recognise a question —
  // but it used to decide that by matching the fallback's exact wording, which
  // had changed. The check silently stopped firing, and every reading, writing
  // and science question answered a mistake with the answer rather than a
  // method. The flag below is what that decision now rests on, so it is worth
  // pinning.
  describe("a wrong answer is met with teaching, not the answer", () => {
    const opts = (subjectSlug: string) => ({ subjectSlug, directive: "" });

    it("admits when it does not recognise a question", () => {
      const sc = buildScaffold("Which word rhymes with 'tap'?", "map", "cat", opts("READING"));
      expect(sc.generic).toBe(true);
    });

    it("does NOT claim to be generic when it genuinely taught something", () => {
      const sc = buildScaffold("27 + 45", "72", "62", opts("MATH"));
      expect(sc.generic).toBeFalsy();
      expect(sc.hints.filter((h) => !/^The correct answer is/.test(h)).length).toBeGreaterThanOrEqual(2);
    });

    it("stops being generic once the item carries its own explanation", () => {
      const sc = buildScaffold("Which word rhymes with 'tap'?", "map", "cat", {
        subjectSlug: "READING",
        directive: "",
        explanation: "Rhyming words share their ending sound: -ap.",
      });
      expect(sc.generic).toBeFalsy();
    });
  });
});
