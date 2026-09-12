// tests/unit/geometry-engine.test.ts
// Locks in the printed GEOMETRY pack fixes from the Sep 2026 unit-boundary audit:
// units 2 and 4 are different cases, vertical angles gain a computation after
// sheet 14, no sliver triangles, trig-side covers all five cases, answer
// columns are not printed in sorted order, and every answer is recomputed.
import { generateGeometrySheet, validateGeometryPack } from "@/lib/shop/geometry-engine";

const sheet = (n: number, count: number) => generateGeometrySheet(n, 100, count).problems;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

describe("Geometry engine — printed pack", () => {
  it("validateGeometryPack is green", () => {
    const v = validateGeometryPack();
    expect(v.issues).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it("no duplicate questions on any sheet", () => {
    for (let s = 1; s <= 100; s++) {
      const qs = sheet(s, 24).map((p) => p.question);
      expect(new Set(qs).size).toBe(qs.length);
    }
  });

  it("unit 4 (sheets 19–24) is three angles on a line, not the unit-2 one-angle diagram", () => {
    for (let s = 19; s <= 24; s++) {
      for (const p of sheet(s, 24)) {
        const m = p.question.match(/^(\d+)° \+ (\d+)° \+ x = 180°$/);
        expect(m).not.toBeNull();
        const a = +m![1], b = +m![2];
        expect(+p.answer).toBe(180 - a - b);
        expect(+p.answer).toBeGreaterThanOrEqual(25);
      }
    }
    for (let s = 7; s <= 12; s++) for (const p of sheet(s, 6)) expect(p.question).toMatch(/^\[\[viz angline \d+\]\]$/);
  });

  it("vertical angles: sheets 13–14 pure copy-the-measure, later sheets add the adjacent angle", () => {
    for (const s of [13, 14]) for (const p of sheet(s, 6)) {
      const m = p.question.match(/^\[\[viz angcross (\d+)\]\]$/);
      expect(m).not.toBeNull();
      expect(p.answer).toBe(m![1]);
    }
    let adjacent = 0;
    for (let s = 15; s <= 18; s++) for (const p of sheet(s, 6)) {
      const m = p.question.match(/^Two lines cross at (\d+)°\. Find the angle beside it on the line\.$/);
      if (m) { adjacent++; expect(+p.answer).toBe(180 - +m[1]); }
      else { const v = p.question.match(/^\[\[viz angcross (\d+)\]\]$/); expect(v).not.toBeNull(); expect(p.answer).toBe(v![1]); }
    }
    expect(adjacent).toBeGreaterThanOrEqual(4);
    expect(sheet(18, 6).some((p) => /^Two lines cross/.test(p.question))).toBe(true);
  });

  it("angles around a point: the answer column is not printed in sorted order", () => {
    const answers = sheet(25, 24).map((p) => +p.answer);
    const desc = [...answers].sort((a, b) => b - a);
    const asc = [...answers].sort((a, b) => a - b);
    expect(answers).not.toEqual(desc);
    expect(answers).not.toEqual(asc);
    // but the ramp still holds zone-to-zone: the first zone is easier than the last
    const first = answers.slice(0, 5), last = answers.slice(-5);
    expect(Math.min(...first)).toBeGreaterThan(Math.max(...last));
  });

  it("area of triangles: no sliver triangles (height:base within 1:3 … 3:1)", () => {
    for (let s = 51; s <= 56; s++) for (const p of sheet(s, 6)) {
      const m = p.question.match(/^\[\[viz geomtri (\d+) (\d+)\]\]$/);
      expect(m).not.toBeNull();
      const b = +m![1], h = +m![2];
      expect(h).toBeLessThanOrEqual(3 * b);
      expect(b).toBeLessThanOrEqual(3 * h);
      expect(+p.answer).toBe((b * h) / 2);
    }
  });

  it("Pythagorean hypotenuse: first sheet is small triples, answers are exact", () => {
    const first = sheet(63, 6);
    for (const p of first) {
      const m = p.question.match(/^\[\[viz geomright (\d+) (\d+) 0\]\]$/);
      expect(m).not.toBeNull();
      const a = +m![1], b = +m![2];
      expect((+p.answer) ** 2).toBe(a * a + b * b);
    }
    expect(Math.max(...first.map((p) => +p.answer))).toBeLessThanOrEqual(41);
    const ex = generateGeometrySheet(63, 100, 6);
    expect(ex.meta.directive).toMatch(/calculator/);
    expect(ex.workedExample!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("trig ratios: directive states lowest terms and θ; keys are reduced fractions", () => {
    const ws = generateGeometrySheet(83, 100, 6);
    expect(ws.meta.directive).toMatch(/lowest terms/);
    expect(ws.meta.directive).toMatch(/θ is the marked angle/);
    expect(ws.workedExample!.steps.join(" ")).toMatch(/8\/10 = 4\/5/);
    for (let s = 83; s <= 91; s++) for (const p of sheet(s, 6)) {
      const m = p.question.match(/^\[\[viz geomright (\d+) (\d+) (\d+) 1\]\] (sin|cos|tan) θ$/);
      expect(m).not.toBeNull();
      const [h, v, hyp] = [+m![1], +m![2], +m![3]];
      const [n, d] = m![4] === "sin" ? [v, hyp] : m![4] === "cos" ? [h, hyp] : [v, h];
      const g = gcd(n, d);
      expect(p.answer).toBe(`${n / g}/${d / g}`);
    }
  });

  it("find a side from a ratio: all five cases appear across the unit and every answer is right", () => {
    const cases = new Set<string>();
    for (let s = 92; s <= 100; s++) {
      for (const p of sheet(s, 24)) {
        const m = p.question.match(/^(sin|cos|tan) θ = (\d+)\/(\d+)\. The (hypotenuse|side opposite θ|side adjacent to θ) is (\d+)\. Find the (side opposite θ|side adjacent to θ|hypotenuse)\.$/);
        expect(m).not.toBeNull();
        const [, fn, n, d, known, val, unknown] = m!;
        cases.add(`${fn}:${unknown}`);
        const ratio = +n / +d, k = +val, ans = +p.answer;
        if (unknown === "hypotenuse") expect(ans * ratio).toBeCloseTo(k, 9);        // known = numerator side
        else if (fn === "tan") expect(k * ratio).toBeCloseTo(ans, 9);                // adjacent → opposite
        else expect(k * ratio).toBeCloseTo(ans, 9);                                  // hypotenuse → opp/adj
        expect(known === "hypotenuse" ? fn !== "tan" : true).toBe(true);
      }
    }
    expect([...cases].sort()).toEqual([
      "cos:hypotenuse", "cos:side adjacent to θ", "sin:hypotenuse", "sin:side opposite θ", "tan:side opposite θ",
    ]);
    // the first sheet is mostly forward scaling; the last sheet carries the inverse case
    const forward92 = sheet(92, 24).filter((p) => !/Find the hypotenuse/.test(p.question)).length;
    expect(forward92).toBeGreaterThanOrEqual(16);
    expect(sheet(100, 24).some((p) => /Find the hypotenuse/.test(p.question))).toBe(true);
  });

  it("curated examples all carry a real method (≥ 2 steps) and correct answers", () => {
    for (const s of [1, 7, 13, 19, 25, 31, 37, 44, 51, 57, 63, 73, 83, 92]) {
      const ws = generateGeometrySheet(s, 100, 6);
      expect(ws.workedExample).toBeDefined();
      expect(ws.workedExample!.steps.length).toBeGreaterThanOrEqual(2);
    }
    expect(generateGeometrySheet(19, 100, 6).workedExample!.answer).toBe("65");  // 180 − 50 − 65
    expect(generateGeometrySheet(63, 100, 6).workedExample!.answer).toBe("10");  // √(36 + 64)
  });
});
