// tests/unit/worksheet-generator.test.ts
// Smoke tests for the main worksheet generator.
// Each subject + level + skill should produce a valid problem set.

import { generateProblems } from "@/lib/worksheet/generator";

describe("Worksheet generator", () => {
  describe("MATH subject", () => {
    const mathScenarios = [
      { levelCode: "M1", skillName: "Counting 1–10" },
      { levelCode: "M3", skillName: "Addition within 10" },
      { levelCode: "M4", skillName: "2-digit addition" },
      { levelCode: "M5", skillName: "×6, ×7, ×8 tables" },
      { levelCode: "M5", skillName: "×9 tables" },
      { levelCode: "M5", skillName: "Mixed ×6–×9" },
      { levelCode: "M6", skillName: "Division by 6, 7, 8" },
      { levelCode: "M7", skillName: "Simplifying fractions" },
      { levelCode: "M10", skillName: "Solving one-step equations" },
    ];

    it.each(mathScenarios)("generates problems for $skillName ($levelCode)", ({ levelCode, skillName }) => {
      const { problems, answerKey } = generateProblems({
        subjectSlug: "MATH",
        levelCode,
        skillName,
        problemCount: 20,
        timeLimitMinutes: 10,
      });

      // Some skill banks have fewer than 20 unique problems — that's expected.
      // We just require a meaningful number and that the answer key matches.
      expect(problems.length).toBeGreaterThanOrEqual(5);
      expect(problems.length).toBeLessThanOrEqual(20);
      expect(answerKey.length).toBe(problems.length);
      for (const p of problems) {
        expect(p.id).toBeTruthy();
        expect(p.question).toBeTruthy();
        expect(typeof p.question).toBe("string");
      }
    });

    it("answer key IDs match problem IDs", () => {
      const { problems, answerKey } = generateProblems({
        subjectSlug: "MATH",
        levelCode: "M5",
        skillName: "×6, ×7, ×8 tables",
        problemCount: 10,
        timeLimitMinutes: 10,
      });
      // Order may differ — verify it's a set-equal
      const probIds = new Set(problems.map((p) => p.id));
      const keyIds = new Set(answerKey.map((k) => k.id));
      expect(probIds).toEqual(keyIds);
    });

    it("respects problemCount param even when bank is large", () => {
      const { problems } = generateProblems({
        subjectSlug: "MATH",
        levelCode: "M5",
        skillName: "×6, ×7, ×8 tables",
        problemCount: 5,
        timeLimitMinutes: 5,
      });
      expect(problems).toHaveLength(5);
    });

    it("supports larger problem counts (50)", () => {
      const { problems } = generateProblems({
        subjectSlug: "MATH",
        levelCode: "M5",
        skillName: "×6, ×7, ×8 tables",
        problemCount: 50,
        timeLimitMinutes: 15,
      });
      // Some generators bank-cap; this just ensures it tries to fulfill
      expect(problems.length).toBeGreaterThan(0);
      expect(problems.length).toBeLessThanOrEqual(50);
    });
  });

  describe("READING subject", () => {
    it("generates reading problems", () => {
      const { problems, answerKey } = generateProblems({
        subjectSlug: "READING",
        levelCode: "R5",
        skillName: "Main idea & details",
        problemCount: 5,
        timeLimitMinutes: 15,
      });
      expect(problems.length).toBeGreaterThan(0);
      expect(answerKey.length).toBe(problems.length);
    });
  });

  describe("WRITING subject", () => {
    it("generates writing problems", () => {
      const { problems, answerKey } = generateProblems({
        subjectSlug: "WRITING",
        levelCode: "W2",
        skillName: "Nouns and verbs",
        problemCount: 5,
        timeLimitMinutes: 10,
      });
      expect(problems.length).toBeGreaterThan(0);
      expect(answerKey.length).toBe(problems.length);
    });
  });

  describe("SCIENCE subject", () => {
    it("generates science problems", () => {
      const { problems, answerKey } = generateProblems({
        subjectSlug: "SCIENCE",
        levelCode: "S4",
        skillName: "Solids, liquids, gases",
        problemCount: 5,
        timeLimitMinutes: 10,
      });
      expect(problems.length).toBeGreaterThan(0);
      expect(answerKey.length).toBe(problems.length);
    });
  });

  describe("Edge cases", () => {
    it("handles unknown subject by falling through to math", () => {
      const { problems } = generateProblems({
        subjectSlug: "UNKNOWN",
        levelCode: "X1",
        skillName: "anything",
        problemCount: 5,
        timeLimitMinutes: 10,
      });
      expect(problems.length).toBeGreaterThan(0);
    });

    it("handles problemCount of 1", () => {
      const { problems } = generateProblems({
        subjectSlug: "MATH",
        levelCode: "M3",
        skillName: "Addition within 10",
        problemCount: 1,
        timeLimitMinutes: 1,
      });
      expect(problems).toHaveLength(1);
    });

    it("each problem has a unique id within a sheet", () => {
      const { problems } = generateProblems({
        subjectSlug: "MATH",
        levelCode: "M5",
        skillName: "×6, ×7, ×8 tables",
        problemCount: 20,
        timeLimitMinutes: 10,
      });
      const ids = problems.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("respects difficulty parameter (does not crash)", () => {
      for (const d of [0.5, 1.0, 1.5, 2.0]) {
        const { problems } = generateProblems({
          subjectSlug: "MATH",
          levelCode: "M5",
          skillName: "×6, ×7, ×8 tables",
          problemCount: 10,
          timeLimitMinutes: 10,
          difficulty: d,
        });
        expect(problems.length).toBeGreaterThan(0);
      }
    });
  });
});
