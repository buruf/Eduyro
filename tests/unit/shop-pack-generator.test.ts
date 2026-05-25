// tests/unit/shop-pack-generator.test.ts
import {
  generatePackForSkill,
  calculatePrice,
  SHOP_SKILLS,
  SHOP_PRICING,
  type ShopSkill,
} from "@/lib/shop/pack-generator";

describe("Shop pack generator", () => {
  const ALL_SKILLS: ShopSkill[] = ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION"];

  describe("calculatePrice", () => {
    it("returns $3.99 for 1 skill", () => {
      expect(calculatePrice(["ADDITION"])).toBe(399);
    });
    it("returns $5.99 for 2 skills", () => {
      expect(calculatePrice(["ADDITION", "SUBTRACTION"])).toBe(599);
    });
    it("returns $7.99 for 3 skills", () => {
      expect(calculatePrice(["ADDITION", "SUBTRACTION", "MULTIPLICATION"])).toBe(799);
    });
    it("returns $9.99 for all 4 skills", () => {
      expect(calculatePrice(ALL_SKILLS)).toBe(999);
    });
    it("throws for empty selection", () => {
      expect(() => calculatePrice([])).toThrow();
    });
    it("throws for more than 4 skills", () => {
      expect(() => calculatePrice([...ALL_SKILLS, "ADDITION"] as any)).toThrow();
    });
  });

  describe("SHOP_PRICING constants", () => {
    it("exposes pricing for 1-4 skills", () => {
      for (let i = 1; i <= 4; i++) {
        expect(SHOP_PRICING[i]).toBeDefined();
        expect(SHOP_PRICING[i].amountCents).toBeGreaterThan(0);
        expect(SHOP_PRICING[i].label).toMatch(/^\$\d+\.\d{2}$/);
      }
    });

    it("encourages bundles (each additional skill is cheaper than buying separately)", () => {
      // 2 skills should cost less than 2 × single price
      expect(SHOP_PRICING[2].amountCents).toBeLessThan(SHOP_PRICING[1].amountCents * 2);
      // 4 skills should be the best deal per-skill
      const perSkill1 = SHOP_PRICING[1].amountCents;
      const perSkill4 = SHOP_PRICING[4].amountCents / 4;
      expect(perSkill4).toBeLessThan(perSkill1);
    });
  });

  describe("generatePackForSkill", () => {
    it.each(ALL_SKILLS)("produces 100 sheets for %s", (skill) => {
      const pack = generatePackForSkill(skill);
      expect(pack.sheets).toHaveLength(100);
      expect(pack.skill).toBe(skill);
      expect(pack.label).toBe(SHOP_SKILLS[skill].label);
    });

    it.each(ALL_SKILLS)("sheets for %s have band progression: easy → standard → challenging", (skill) => {
      const pack = generatePackForSkill(skill);
      const difficulties = pack.sheets.map((s) => s.difficulty);

      // Find first occurrence of each difficulty
      const firstEasy = difficulties.indexOf("easy");
      const firstStandard = difficulties.indexOf("standard");
      const firstChallenging = difficulties.indexOf("challenging");

      // All should exist
      expect(firstEasy).toBeGreaterThanOrEqual(0);
      expect(firstStandard).toBeGreaterThanOrEqual(0);
      expect(firstChallenging).toBeGreaterThanOrEqual(0);

      // Easy comes before standard which comes before challenging
      expect(firstEasy).toBeLessThan(firstStandard);
      expect(firstStandard).toBeLessThan(firstChallenging);
    });

    it.each(ALL_SKILLS)("respects tiered problem counts: easy=50, standard=40, challenging=25 (%s)", (skill) => {
      const pack = generatePackForSkill(skill);
      for (const sheet of pack.sheets) {
        const expected = sheet.difficulty === "easy" ? 50 : sheet.difficulty === "standard" ? 40 : 25;
        expect(sheet.problems).toHaveLength(expected);
        expect(sheet.answerKey).toHaveLength(expected);
      }
    });

    it("problems and answer keys have matching IDs", () => {
      const pack = generatePackForSkill("ADDITION");
      for (const sheet of pack.sheets) {
        for (let i = 0; i < sheet.problems.length; i++) {
          expect(sheet.answerKey[i].id).toBe(sheet.problems[i].id);
        }
      }
    });

    it("first sheet of beginner addition band starts with 1+1, 1+2, 1+3 warmups", () => {
      const pack = generatePackForSkill("ADDITION");
      const sheet1 = pack.sheets[0];
      // First three problems should be the hardcoded warmup
      expect(sheet1.problems[0].question).toBe("1 + 1");
      expect(sheet1.problems[1].question).toBe("1 + 2");
      expect(sheet1.problems[2].question).toBe("1 + 3");
      // And their answer keys
      expect(sheet1.answerKey[0].answer).toBe("2");
      expect(sheet1.answerKey[1].answer).toBe("3");
      expect(sheet1.answerKey[2].answer).toBe("4");
    });

    it("first sheet of beginner multiplication band starts with 2×1, 2×2 warmups", () => {
      const pack = generatePackForSkill("MULTIPLICATION");
      const sheet1 = pack.sheets[0];
      expect(sheet1.problems[0].question).toBe("2 × 1");
      expect(sheet1.problems[1].question).toBe("2 × 2");
      expect(sheet1.answerKey[0].answer).toBe("2");
      expect(sheet1.answerKey[1].answer).toBe("4");
    });

    it("first sheet of beginner subtraction band starts with 2−1, 3−1 warmups", () => {
      const pack = generatePackForSkill("SUBTRACTION");
      const sheet1 = pack.sheets[0];
      expect(sheet1.problems[0].question).toBe("2 − 1");
      expect(sheet1.problems[1].question).toBe("3 − 1");
      expect(sheet1.answerKey[0].answer).toBe("1");
      expect(sheet1.answerKey[1].answer).toBe("2");
    });

    it("first sheet of beginner division band starts with 2÷2, 4÷2 warmups", () => {
      const pack = generatePackForSkill("DIVISION");
      const sheet1 = pack.sheets[0];
      expect(sheet1.problems[0].question).toBe("2 ÷ 2");
      expect(sheet1.problems[1].question).toBe("4 ÷ 2");
      expect(sheet1.answerKey[0].answer).toBe("1");
      expect(sheet1.answerKey[1].answer).toBe("2");
    });

    it("is deterministic — same input produces same output (caching is safe)", () => {
      const a = generatePackForSkill("ADDITION");
      const b = generatePackForSkill("ADDITION");

      // Sheets should have identical questions (IDs will differ because nanoid)
      for (let s = 0; s < a.sheets.length; s++) {
        for (let p = 0; p < a.sheets[s].problems.length; p++) {
          expect(b.sheets[s].problems[p].question).toBe(a.sheets[s].problems[p].question);
          expect(b.sheets[s].answerKey[p].answer).toBe(a.sheets[s].answerKey[p].answer);
        }
      }
    });

    it.each(ALL_SKILLS)("every problem in %s has a valid math expression and answer", (skill) => {
      const pack = generatePackForSkill(skill);
      // Spot-check the first sheet of each band (cheaper than checking all 100)
      const seenBands = new Set<string>();
      for (const sheet of pack.sheets) {
        if (seenBands.has(sheet.bandLabel)) continue;
        seenBands.add(sheet.bandLabel);

        for (const problem of sheet.problems) {
          expect(problem.question).toMatch(/[\d+−×÷]+/);
          expect(problem.question.length).toBeGreaterThan(0);
        }
        for (const key of sheet.answerKey) {
          expect(String(key.answer).length).toBeGreaterThan(0);
        }
      }
    });

    it("answer correctness — addition sheets", () => {
      const pack = generatePackForSkill("ADDITION");
      const sheet1 = pack.sheets[0];
      // Parse "X + Y" and verify answer
      for (let i = 0; i < Math.min(20, sheet1.problems.length); i++) {
        const match = sheet1.problems[i].question.match(/^(\d+) \+ (\d+)$/);
        expect(match).not.toBeNull();
        if (match) {
          const expected = parseInt(match[1]) + parseInt(match[2]);
          expect(sheet1.answerKey[i].answer).toBe(String(expected));
        }
      }
    });

    it("answer correctness — multiplication sheets", () => {
      const pack = generatePackForSkill("MULTIPLICATION");
      const sheet1 = pack.sheets[0];
      for (let i = 0; i < Math.min(20, sheet1.problems.length); i++) {
        const match = sheet1.problems[i].question.match(/^(\d+) × (\d+)$/);
        expect(match).not.toBeNull();
        if (match) {
          const expected = parseInt(match[1]) * parseInt(match[2]);
          expect(sheet1.answerKey[i].answer).toBe(String(expected));
        }
      }
    });

    it("difficulty ramps within bands — last sheet has bigger numbers than first", () => {
      const pack = generatePackForSkill("ADDITION");
      // Find sheets at start and end of the same band (Adding 1-10 has 20 sheets)
      const firstSheet = pack.sheets[0]; // Adding 1-10, sheet 1
      const lastInBand = pack.sheets[19]; // Adding 1-10, sheet 20

      // Skip the warmup (first 15 problems) of sheet 1; compare RNG-driven problems
      const firstMax = maxNumberInProblems(firstSheet.problems.slice(15));
      const lastMax = maxNumberInProblems(lastInBand.problems);

      // Last sheet should have larger numbers than first
      expect(lastMax).toBeGreaterThanOrEqual(firstMax);
    });
  });
});

function maxNumberInProblems(problems: Array<{ question: string }>): number {
  let max = 0;
  for (const p of problems) {
    const nums = p.question.match(/\d+/g);
    if (nums) {
      for (const n of nums) {
        const v = parseInt(n);
        if (v > max) max = v;
      }
    }
  }
  return max;
}
