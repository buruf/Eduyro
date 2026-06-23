// tests/unit/higher-math-engine.test.ts
// Locks in the M13 multi-format curriculum guarantees so the engine can't quietly
// regress to the old "30-question, single-format, predictable" behaviour.
import {
  generateHigherMathSheet,
  validateHigherMathPack,
  isHigherMathLevel,
} from "@/lib/shop/higher-math-engine";

describe("Higher-math engine (M13–M18)", () => {
  it("recognises all six higher-math levels", () => {
    for (const c of ["M13", "M14", "M15", "M16", "M17", "M18"]) {
      expect(isHigherMathLevel(c)).toBe(true);
    }
    expect(isHigherMathLevel("M12")).toBe(false);
  });

  it.each(["M13", "M14", "M15", "M16", "M17", "M18"])("validates pack %s", (code) => {
    const r = validateHigherMathPack(code, 100);
    expect(r.issues).toEqual([]);
    expect(r.ok).toBe(true);
  });

  describe("M13 multi-format curriculum", () => {
    // sample sheets spanning all seven micro-skills
    const SHEETS = [1, 6, 13, 20, 30, 35, 45, 55, 70, 80, 95, 100];

    it.each(SHEETS)("sheet %i has no repeated question stems", (s) => {
      const qs = generateHigherMathSheet("M13", s, 100, 36).problems.map((p) => p.question);
      expect(new Set(qs).size).toBe(qs.length);
    });

    it.each(SHEETS)("sheet %i MC options are collision-free and contain the answer", (s) => {
      for (const p of generateHigherMathSheet("M13", s, 100, 36).problems as any[]) {
        if (!p.options) continue;
        expect(new Set(p.options).size).toBe(p.options.length); // no duplicate options
        expect(p.options).toContain(p.answer);                  // answer is selectable
      }
    });

    it("is deterministic per sheet (stable regeneration / self-heal)", () => {
      const a = generateHigherMathSheet("M13", 20, 100, 36).problems.map((p) => p.question).join("|");
      const b = generateHigherMathSheet("M13", 20, 100, 36).problems.map((p) => p.question).join("|");
      expect(a).toBe(b);
    });

    it("mixes question formats within a solving sheet (not single-format)", () => {
      const types = new Set(generateHigherMathSheet("M13", 20, 100, 36).problems.map((p) => p.type));
      expect(types.size).toBeGreaterThanOrEqual(2);
    });

    it("is not a predictable ascending run (k = 1,4,9,16…)", () => {
      const qs = generateHigherMathSheet("M13", 20, 100, 36).problems.map((p) => p.question);
      const oldPattern = ["Solve x² = 1", "Solve x² = 4", "Solve x² = 9", "Solve x² = 16"];
      const startsPredictably = oldPattern.every((q, i) => qs[i] === q);
      expect(startsPredictably).toBe(false);
    });

    it("offers a deep pool per micro-skill (far more than one sheet)", () => {
      // 18 sheets share the "Solve x²=k" unit; across them, far more than 36
      // distinct questions appear → no running out / looping.
      const seen = new Set<string>();
      for (let s = 13; s <= 30; s++)
        for (const p of generateHigherMathSheet("M13", s, 100, 36).problems) seen.add(p.question);
      expect(seen.size).toBeGreaterThan(80);
    });
  });
});
