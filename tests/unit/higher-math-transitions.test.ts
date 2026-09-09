// tests/unit/higher-math-transitions.test.ts
// Lesson-boundary guards for M13–M18 (the six-reviewer transition audit,
// Sep 2026). Each test pins a boundary a child could not cross from the
// micro-lesson alone, so the fix cannot silently regress.
import { generateHigherMathSheet, getHigherMathMicroLesson, higherMathUnits } from "@/lib/shop/higher-math-engine";

function opening(code: string, label: string, count = 30) {
  const u = higherMathUnits(code).find((x) => x.label === label);
  if (!u) throw new Error(`no unit ${code} ${label}`);
  return generateHigherMathSheet(code, u.range[0], 100, count).problems;
}
function allSheets(code: string, count = 30) {
  const out: ReturnType<typeof opening> = [];
  for (let s = 1; s <= 100; s++) out.push(...generateHigherMathSheet(code, s, 100, count).problems);
  return out;
}
const isNumeric = (s: string) => /^-?\d+(\.\d+)?$/.test(s.trim());

describe("Higher-math lesson transitions (M13–M18)", () => {
  describe("distractors come only from the item's own template", () => {
    it.each(["M14", "M15", "M16", "M17", "M18"])("%s: no 'True'/'False' or sentence options inside a numeric item, and true/false stems offer exactly True | False", (code) => {
      for (const p of allSheets(code)) {
        if (!p.options) continue;
        if (/^True or false/i.test(p.question)) {
          expect([...p.options].sort()).toEqual(["False", "True"]);
          continue;
        }
        const words = (s: string) => s.trim().split(/\s+/).length;
        if (isNumeric(String(p.answer))) {
          // A numeric item may offer fractions or expressions from its own
          // template, but never a truth value or a sentence.
          for (const o of p.options) { expect(o).not.toMatch(/^(True|False)$/); expect(words(o)).toBeLessThan(4); }
        } else if (/went wrong|forget|What's wrong/.test(p.question)) {
          // A find-the-mistake item offers sentences, never a bare number.
          for (const o of p.options) expect(isNumeric(o)).toBe(false);
        }
        // A find-the-mistake item names ONE student; every option that names a
        // student must name the same one.
        const who = p.question.match(/^([A-Z][a-z]+) (computes|says|writes)/)?.[1];
        if (who) for (const o of p.options) {
          const other = o.match(/^([A-Z][a-z]+) (added|should|used|says|forgot)/)?.[1];
          if (other) expect(other).toBe(who);
        }
      }
    });
  });

  it("M13 Solve by factoring opens with direct solves only (no k-items), distinct roots before repeated", () => {
    const qs = opening("M13", "Solve by factoring");
    expect(qs.every((p) => /^Solve x²/.test(p.question))).toBe(true);
    const firstRepeat = qs.findIndex((p) => !String(p.answer).includes(","));
    const lastDistinct = qs.map((p) => String(p.answer).includes(",")).lastIndexOf(true);
    if (firstRepeat !== -1) expect(firstRepeat).toBeGreaterThan(5);
    expect(lastDistinct).toBeGreaterThan(0);
  });

  it("M13 Evaluate & axis of symmetry: the axis skill the lesson teaches is on the opening sheet", () => {
    const qs = opening("M13", "Evaluate & axis of symmetry");
    expect(qs.filter((p) => /axis of symmetry/.test(p.question)).length).toBeGreaterThanOrEqual(6);
    expect(qs.filter((p) => /Drag the vertex/.test(p.question)).length).toBeLessThanOrEqual(2);
  });

  it("M14 Evaluate f(x) = mx + b opens at least half plain evaluations", () => {
    const qs = opening("M14", "Evaluate f(x) = mx + b");
    const plain = qs.filter((p) => /^f\(x\) = \d+x \+ \d+\. Find f\(\d\)$/.test(p.question));
    expect(plain.length * 2).toBeGreaterThanOrEqual(qs.length);
  });

  it("M14 Evaluate a quadratic function opens ≥60% on f(x) = x² + c. Find f(k), vertex drags capped", () => {
    const qs = opening("M14", "Evaluate a quadratic function");
    const taught = qs.filter((p) => /^f\(x\) = x² \+ \d+\. Find f\(\d\)$/.test(p.question));
    expect(taught.length / qs.length).toBeGreaterThanOrEqual(0.6);
    expect(qs.filter((p) => /Drag the vertex/.test(p.question)).length).toBeLessThanOrEqual(2);
  });

  it("M14 Range of a quadratic renders x² − 15, never x² + (-15), and opens on positive c", () => {
    for (const p of allSheets("M14")) expect(p.question).not.toMatch(/\+ \(-/);
    const first = opening("M14", "Range of a quadratic").find((p) => /^Range of/.test(p.question));
    expect(first?.question).toMatch(/x² \+ \d/);
  });

  it("M15 Pythagorean theorem opens on hypotenuse items only; the lesson shows the leg case", () => {
    const qs = opening("M15", "Pythagorean theorem");
    expect(qs.some((p) => /Find the other leg/.test(p.question))).toBe(false);
    const lesson = getHigherMathMicroLesson("M15", "Pythagorean theorem");
    expect(lesson?.example.steps.join(" ")).toMatch(/LEG.*25 − 9/);
  });

  it("M15 Right-triangle ratios has no unit-circle drags, and the lesson gives SOH-CAH-TOA", () => {
    for (let s = 17; s <= 34; s++) for (const p of generateHigherMathSheet("M15", s, 100, 30).problems)
      expect(p.question).not.toMatch(/Drag the point around the circle/);
    const lesson = getHigherMathMicroLesson("M15", "Right-triangle ratios");
    expect(lesson?.example.steps.join(" ")).toMatch(/cos θ = 4\/5.*tan θ = 3\/4/);
  });

  it("M15 Unit-circle values: every surd-valued answer is multiple choice (typed 1/√2 would be marked wrong)", () => {
    for (const p of allSheets("M15")) if (String(p.answer).includes("√") && /^(Evaluate|On the unit circle)/.test(p.question)) expect(p.type).toBe("multiple_choice");
  });

  it("M15 lessons teach the inverse cases the sheets ask (radians → degrees; tan from sin and cos)", () => {
    expect(getHigherMathMicroLesson("M15", "Degrees to radians")?.example.steps.join(" ")).toMatch(/180\/π/);
    expect(getHigherMathMicroLesson("M15", "Pythagorean identity")?.example.steps.join(" ")).toMatch(/tan θ = sin θ ÷ cos θ/);
  });

  it("M16 Turning points: a degree-2 polynomial has EXACTLY one turning point (keyed True)", () => {
    const tf = allSheets("M16").find((p) => /every polynomial of degree 2 has exactly 1 turning point/.test(p.question));
    expect(tf?.answer).toBe("True");
    const tf3 = allSheets("M16").find((p) => /every polynomial of degree 3 has exactly 2 turning points/.test(p.question));
    expect(tf3?.answer).toBe("False");
  });

  it("M16 Fundamental Theorem of Algebra never says 'complex' before complex numbers exist", () => {
    for (const p of allSheets("M16")) expect(p.question).not.toMatch(/complex/i);
  });

  it("M16 Synthetic division names the method taught and holds (x + 1) off the opening sheet", () => {
    const qs = opening("M16", "Synthetic division");
    for (const p of qs) if (/remainder/.test(p.question)) {
      expect(p.question).toMatch(/Remainder Theorem/);
      expect(p.question).not.toMatch(/\(x \+ \d\)/);
    }
  });

  it("M16 Powers of i opens with exponents ≤ 9 and the lesson gives the divide-by-4 step", () => {
    for (const p of opening("M16", "Powers of i")) {
      const m = p.question.match(/^Simplify i([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);
      if (m) expect(m[1].length).toBe(1);
    }
    expect(getHigherMathMicroLesson("M16", "Powers of i")?.example.steps.join(" ")).toMatch(/10 ÷ 4 = 2 remainder 2/);
  });

  it("M16 x-intercepts opens on direct reads; the lesson states root r → factor (x − r)", () => {
    const qs = opening("M16", "x-intercepts (roots)");
    expect(qs.some((p) => /^Which function crosses/.test(p.question))).toBe(false);
    expect(getHigherMathMicroLesson("M16", "x-intercepts (roots)")?.example.steps.join(" ")).toMatch(/root at x = r means a factor \(x − r\)/);
  });

  it("M17 Parabolas & conics opens by reading the vertex from vertex form (the lesson's example)", () => {
    const qs = opening("M17", "Parabolas & conics");
    expect(qs[0].question).toMatch(/^What is the vertex/);
    expect(getHigherMathMicroLesson("M17", "Parabolas & conics")?.example.problem).toMatch(/vertex of y = \(x \+ 1\)² \+ 3/);
  });

  it("M17 Limits by factoring opens with squares ≤ 12² and the lesson shows factor → cancel → substitute", () => {
    for (const p of opening("M17", "Limits by factoring")) {
      const m = p.question.match(/^lim\(x→(\d+)\)/);
      if (m) expect(Number(m[1])).toBeLessThanOrEqual(12);
    }
    const steps = getHigherMathMicroLesson("M17", "Limits by factoring")?.example.steps.join(" ") ?? "";
    expect(steps).toMatch(/0\/0/);
    expect(steps).toMatch(/\(x − 3\)\(x \+ 3\)/);
  });

  it("M17/M18 worked examples teach the sheet's other cases (vector addition, d/dx of a constant, term-by-term, + C, F(b) − F(a))", () => {
    expect(getHigherMathMicroLesson("M17", "Vectors")?.example.steps.join(" ")).toMatch(/\(1 \+ 3, 2 \+ 1\) = \(4, 3\)/);
    expect(getHigherMathMicroLesson("M18", "Power rule")?.example.steps.join(" ")).toMatch(/d\/dx 7 = 0/);
    expect(getHigherMathMicroLesson("M18", "Evaluate a derivative")?.example.steps.join(" ")).toMatch(/term by term/);
    expect(getHigherMathMicroLesson("M18", "Integrate powers")?.example.steps.join(" ")).toMatch(/Add \+ C/);
    expect(getHigherMathMicroLesson("M18", "Definite integrals")?.example.steps.join(" ")).toMatch(/F\(4\) − F\(0\)/);
  });

  it("every M14–M18 unit has a big idea that is not its goal repeated", () => {
    for (const code of ["M14", "M15", "M16", "M17", "M18"]) for (const u of higherMathUnits(code)) {
      const l = getHigherMathMicroLesson(code, u.label);
      expect(l?.bigIdea).toBeTruthy();
      expect(l?.bigIdea).not.toBe(u.objective);
    }
  });
});
