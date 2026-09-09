// tests/unit/advanced-engine-transitions.test.ts
// The M8–M11 lesson boundaries a child walks across: the opening sheet of a
// unit holds only what its micro-lesson taught, and the drag-to-order items
// stay a permutation of their options (that is how the serving layer decides to
// render OrderingInput instead of radio buttons).
import { generateAdvancedSheet, validateAdvancedPack, getAdvancedMicroLesson } from "@/lib/shop/advanced-engine";

const first = (skill: any, n: number, count = 30) => generateAdvancedSheet(skill, n, 100, count).problems;

describe("advanced-engine transitions (M8–M11)", () => {
  test("packs still validate: no dupes, ascending, monotonic GPI", () => {
    for (const skill of ["DECIMALS", "RATIOS", "PRE_ALGEBRA", "LINEAR_EQUATIONS", "POLYNOMIALS"]) {
      const v = validateAdvancedPack(skill);
      expect({ skill, issues: v.issues }).toEqual({ skill, issues: [] });
    }
  });

  test("M8 Convert opens with halves, quarters, fifths and tenths only — eighths wait", () => {
    const ps = first("DECIMALS", 85);
    expect(ps.length).toBe(30);
    for (const p of ps) {
      const d = /frac\{\d+\}\{(\d+)\}/.exec(p.question + " " + p.answer)?.[1];
      if (d) expect([2, 4, 5, 10]).toContain(Number(d));
      expect(p.question).not.toMatch(/0\.\d{3}|\d\.5%/); // no thousandths, no 12.5%
    }
    // eighths do arrive later in the unit
    const later = [88, 90, 92, 94].flatMap((n) => first("DECIMALS", n));
    expect(later.some((p) => /frac\{\d\}\{8\}|0\.125|0\.875/.test(p.question + p.answer))).toBe(true);
  });

  test("M8 add generators do not serve both orders of one pair", () => {
    for (const n of [1, 5, 11, 15]) {
      const seen = new Set<string>();
      for (const p of first("DECIMALS", n)) {
        const [a, b] = p.question.split(" + ").map((s) => s.trim());
        const key = [a, b].sort().join("+");
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  test("M10 Order integers: every item is a permutation of its options (drag-to-order), day one has one negative", () => {
    for (const n of [1, 2, 3, 4]) {
      for (const p of first("PRE_ALGEBRA", n, 24)) {
        expect(p.type).toBe("multiple_choice");
        const ans = String(p.answer).split(",").map((s) => s.trim()).sort();
        const opts = [...(p.options ?? [])].sort();
        expect(ans).toEqual(opts);
        expect(opts.length).toBe(4);
      }
    }
    const day1 = first("PRE_ALGEBRA", 1, 24);
    for (const p of day1) expect(String(p.answer).split(",").filter((s) => s.startsWith("-")).length).toBe(1);
    const last = first("PRE_ALGEBRA", 4, 24);
    expect(last.some((p) => String(p.answer).split(",").filter((s) => s.startsWith("-")).length >= 2)).toBe(true);
  });

  test("M10 Integer add & subtract: no whole-number filler; bands follow the example", () => {
    const ps = first("PRE_ALGEBRA", 71);
    for (const p of ps) {
      const m = /^(\(?-?\d+\)?) ([+-]) (\d+)$/.exec(p.question)!;
      const a = Number(m[1].replace(/[()]/g, "")), op = m[2], b = Number(m[3]);
      const ans = op === "+" ? a + b : a - b;
      expect(Number(p.answer)).toBe(ans);
      // positive + positive, or positive − smaller positive, is not integer work
      expect(a > 0 && (op === "+" || ans >= 0)).toBe(false);
    }
  });

  test("M10 Plot points: no y-intercept items; day one is first-quadrant led with negatives explained", () => {
    for (const n of [81, 86, 92]) for (const p of first("PRE_ALGEBRA", n, 24)) expect(p.question).not.toMatch(/intercept/);
    const day1 = first("PRE_ALGEBRA", 81, 24);
    expect(day1.filter((p) => !/-/.test(String(p.answer))).length).toBeGreaterThanOrEqual(16);
    expect(day1.slice(0, 6).every((p) => !/-/.test(String(p.answer)))).toBe(true);
    expect(day1.some((p) => /-\d+,-\d+/.test(String(p.answer)))).toBe(false); // third quadrant waits
    const lesson = getAdvancedMicroLesson("Coordinate Plane · Plot points")!;
    expect(lesson.example.steps.join(" ")).toMatch(/LEFT/);
    expect(lesson.example.steps.join(" ")).toMatch(/DOWN/);
  });

  test("M11 Plot points keeps the y-intercept items and its lesson explains them", () => {
    const all = [1, 2, 3, 4].flatMap((n) => first("LINEAR_EQUATIONS", n, 24));
    expect(all.some((p) => /intercept/.test(p.question))).toBe(true);
    const lesson = getAdvancedMicroLesson("Plot points on the coordinate plane")!;
    // The example says WHERE a line crosses the y-axis (x = 0) in plain words — the
    // lesson-coherence audit reads the term "y-intercept" as a polynomial lesson, so
    // the term itself is introduced in the big idea, which the modal shows alongside.
    expect(lesson.example.steps.join(" ")).toMatch(/crosses the y-axis where x = 0/);
    expect(lesson.bigIdea).toMatch(/y-intercept/);
  });

  test("M11 Graph a line: opening sheet is positive slopes only; negative slopes are taught and arrive later", () => {
    const day1 = first("LINEAR_EQUATIONS", 5);
    expect(day1.length).toBe(30);
    for (const p of day1) expect(Number(String(p.answer).split(",")[0])).toBeGreaterThan(0);
    const last = first("LINEAR_EQUATIONS", 8);
    expect(last.some((p) => Number(String(p.answer).split(",")[0]) < 0)).toBe(true);
    const steps = getAdvancedMicroLesson("Graph a line")!.example.steps.join(" ");
    expect(steps).toMatch(/NEGATIVE slope goes DOWN/);
    expect(steps).toMatch(/y = x means 1x \+ 0/);
  });

  test("M11 Variables on both sides: general-case example, mx = x + c leads, no '1x'", () => {
    const lesson = getAdvancedMicroLesson("Variables on both sides")!;
    expect(lesson.example.problem).toBe("4x + 2 = 2x + 6");
    expect(lesson.example.answer).toBe("2");
    const day1 = first("LINEAR_EQUATIONS", 55);
    expect(day1.slice(0, 10).every((p) => /^Solve for x:  \d+x = x \+ \d+$/.test(p.question))).toBe(true);
    for (const n of [55, 60, 66, 72]) for (const p of first("LINEAR_EQUATIONS", n)) expect(p.question).not.toMatch(/\b1x\b/);
    // answers stay right
    for (const p of day1) {
      const m = /(\d+)x(?: \+ (\d+))? = (?:(\d+))?x(?: \+ (\d+))?/.exec(p.question)!;
      const lhsM = Number(m[1]), lhsB = Number(m[2] ?? 0), rhsM = Number(m[3] ?? 1), rhsB = Number(m[4] ?? 0);
      expect(lhsM * Number(p.answer) + lhsB).toBe(rhsM * Number(p.answer) + rhsB);
    }
  });

  test("M11 mixed review draws from every equation type", () => {
    const all = [87, 90, 94, 97, 100].flatMap((n) => first("LINEAR_EQUATIONS", n));
    expect(all.some((p) => /\(x \+ /.test(p.question))).toBe(true);
    expect(all.some((p) => /= \d*x/.test(p.question))).toBe(true);
    expect(all.some((p) => /frac\{x\}/.test(p.question))).toBe(true);
  });

  test("micro-lessons carry a big idea that is not the objective restated", () => {
    for (const label of ["Decimals — add (tenths)", "Ratios — simplify", "Expressions · Order integers", "Graph a line"]) {
      const l = getAdvancedMicroLesson(label)!;
      expect(l.bigIdea).not.toBe(l.goal);
      expect(l.bigIdea.length).toBeGreaterThan(30);
    }
  });
});
