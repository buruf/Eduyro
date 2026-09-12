// tests/unit/transition-minors-m8-m12.test.ts
// The M8–M12 lesson-boundary MINORS (docs/TRANSITION-AUDIT.md): every mixed
// review draws from every lesson its level taught; the M12 opening sheets hold
// only the sign/shape their worked example teaches (negative leading
// coefficient, subtraction of like terms, a minus inside the bracket arrive from
// the second sheet); the factoring lessons state the input form the grader's
// exact-string match needs; and each example's steps are a method.
import { generateAdvancedSheet, getAdvancedMicroLesson, validateAdvancedPack } from "@/lib/shop/advanced-engine";

const sheet = (skill: string, n: number, count = 30) => generateAdvancedSheet(skill as any, n, 100, count).problems;
const lesson = (label: string) => getAdvancedMicroLesson(label)!;
const steps = (label: string) => lesson(label).example.steps.join(" ");
const directive = (skill: string, n: number) => generateAdvancedSheet(skill as any, n, 100, 30).meta.directive ?? "";
const count = (ps: { question: string }[], re: RegExp) => ps.filter((p) => re.test(p.question)).length;

describe("M8–M12 transition minors", () => {
  test("every advanced pack still validates (no dupes, ascending, monotonic GPI)", () => {
    for (const skill of ["DECIMALS", "RATIOS", "PRE_ALGEBRA", "LINEAR_EQUATIONS", "POLYNOMIALS"]) {
      expect({ skill, issues: validateAdvancedPack(skill).issues }).toEqual({ skill, issues: [] });
    }
  });

  test("M8 mixed review: at least 3 items from each of the 9 decimal lessons on every sheet", () => {
    const kinds: [string, RegExp][] = [
      ["add tenths", /^\d\.\d \+ /], ["add hundredths", /^\d\.\d\d \+ /],
      ["subtract tenths", /^\d\.\d - /], ["subtract hundredths", /^\d\.\d\d - /],
      ["multiply by whole", /^\d\.\d × \d$/], ["multiply decimals", /^\d\.\d × \d\.\d$/],
      ["divide by whole", /÷/], ["percent of", /% of /], ["convert", /^Write /],
    ];
    for (let n = 95; n <= 100; n++) {
      const ps = sheet("DECIMALS", n);
      expect(ps.length).toBe(30);
      for (const [name, re] of kinds) expect({ sheet: n, kind: name, items: count(ps, re) }).toEqual({ sheet: n, kind: name, items: expect.any(Number) });
      for (const [, re] of kinds) expect(count(ps, re)).toBeGreaterThanOrEqual(3);
    }
    expect(steps("Decimals — mixed review")).toMatch(/every lesson of the level/);
  });

  // Each lesson now has several shapes (equivalent: blank on the right, three
  // parts, blank on the LEFT; proportion: a : b = ___ : kb, the fraction form,
  // a non-whole visible scale; scale-up: "scale a : b by k", three parts, "so
  // the first part becomes"), so a lesson is counted by the union of its shapes.
  test("M9 mixed review: simplify, equivalent, proportion and scale-up all on every sheet", () => {
    for (const n of [83, 88, 94, 100]) {
      const ps = sheet("RATIOS", n);
      expect(count(ps, /^Simplify the ratio/)).toBeGreaterThanOrEqual(6);
      expect(count(ps, /= \d+ : ___( : \d+)?$|^Find the missing number:  ___ : \d+ = \d+ : \d+$/)).toBeGreaterThanOrEqual(6);
      expect(count(ps, /^Find the missing number:  \d+ : \d+ = ___ : \d+$|frac\{___\}/)).toBeGreaterThanOrEqual(6);
      expect(count(ps, /^Write an equivalent ratio: scale|^Scale \d+ : \d+ so/)).toBeGreaterThanOrEqual(6);
    }
    expect(directive("RATIOS", 83)).not.toMatch(/missing term/); // the sheet is no longer only that
  });

  test("M9 equivalent ratios: the example carries scaling BOTH parts before the scale-up lesson needs it", () => {
    expect(steps("Ratios — equivalent ratios")).toMatch(/multiply BOTH parts by one number/);
    expect(steps("Ratios — equivalent ratios")).toMatch(/2 : 3 scaled by 4 is 8 : 12/);
  });

  // The distribution and fraction lessons each have three shapes now —
  // k(x + b) = c, k(x − b) = c, k(x + b) + d = c; x/d = q, x/d + b = c,
  // (x + b)/d = c — so a lesson is counted by the union of its shapes.
  test("M11 mixed review: 6 of each equation type on every sheet", () => {
    for (let n = 87; n <= 100; n++) {
      const ps = sheet("LINEAR_EQUATIONS", n);
      expect(count(ps, /^Solve for x:  \d+x \+ \d+ = \d+$/)).toBe(6);        // two-step (+)
      expect(count(ps, /^Solve for x:  \d+x - \d+ = \d+$/)).toBe(6);         // two-step (−)
      expect(count(ps, /\(x [+-] \d+\)( \+ \d+)? = /)).toBe(6);              // distribution
      expect(count(ps, /= \d*x( \+ \d+)?$/)).toBe(6);                        // variables on both sides
      expect(count(ps, /frac\{x( \+ \d+)?\}/)).toBe(6);                      // fraction
    }
  });

  test("review sheets are fresh sets: adjacent sheets share no item", () => {
    for (const [skill, a] of [["DECIMALS", 95], ["RATIOS", 83], ["LINEAR_EQUATIONS", 87]] as [string, number][]) {
      const first = new Set(sheet(skill, a).map((p) => p.question));
      expect(sheet(skill, a + 1).filter((p) => first.has(p.question)).length).toBe(0);
    }
  });

  test("M8 multiply by a whole number: x.0 × n items no longer open the unit", () => {
    const day1 = sheet("DECIMALS", 41);
    expect(day1.slice(0, 10).every((p) => !/\.0 ×/.test(p.question))).toBe(true);
  });

  test("M12 Leading coefficient: opening sheet positive only; negatives taught and arrive on sheet 15", () => {
    for (const p of sheet("POLYNOMIALS", 14, 24)) expect(String(p.answer)).not.toMatch(/^-/);
    expect(sheet("POLYNOMIALS", 16, 24).some((p) => /^-/.test(String(p.answer)))).toBe(true);
    expect(steps("Leading coefficient")).toMatch(/-3x² \+ x \+ 7.*leading coefficient is -3 \(not 3\)/);
    expect(lesson("Leading coefficient").bigIdea).toMatch(/sign included/);
  });

  test("M12 Combine like terms: sums open the unit; 1x² explained; subtraction shown and arrives later", () => {
    for (const p of sheet("POLYNOMIALS", 24)) expect(p.question).toMatch(/\+/);
    const last = sheet("POLYNOMIALS", 28);
    expect(last.some((p) => / - /.test(p.question))).toBe(true);
    for (const p of last) expect(String(p.answer)).not.toMatch(/\b1x²/);
    const s = steps("Combine like terms (x²)");
    expect(s).toMatch(/A bare x² means 1x²/);
    expect(s).toMatch(/3x² − 2x² = 1x², which is written x²/);
    expect(directive("POLYNOMIALS", 24)).toMatch(/not 1x²/);
  });

  test("M12 Distribute a monomial: plus inside opens the unit; the minus case is in the example and arrives on sheet 44", () => {
    for (const p of sheet("POLYNOMIALS", 43)) expect(p.question).toMatch(/\(x \+ \d+\)/);
    expect(sheet("POLYNOMIALS", 44).some((p) => /\(x - \d+\)/.test(p.question))).toBe(true);
    expect(steps("Distribute a monomial")).toMatch(/2x\(x − 1\) = 2x² − 2x/);
  });

  test("M12 FOIL: the example shows Outer and Inner separately and adds them", () => {
    const s = steps("Multiply binomials (FOIL)");
    expect(s).toMatch(/Outer: x · 3 = 3x/);
    expect(s).toMatch(/Inner: 2 · x = 2x/);
    expect(s).toMatch(/3x \+ 2x = 5x/);
  });

  test("M12 Box method: the example lays out the 2 × 2 box in the key's cell order", () => {
    const u = lesson("Partial products (box method)");
    const s = u.example.steps.join(" ");
    expect(s).toMatch(/2 × 2 box/);
    expect(s).toMatch(/column for x and a column for 2/);
    expect(s).toMatch(/row for x and a row for 3/);
    expect(s).toMatch(/x², 2x, 3x, 6/);
    expect(u.example.answer).toBe("x²,2x,3x,6");
    // the interactive grid's fixed cell order is x², a·x, b·x, a·b for (x + a)(x + b)
    for (const p of sheet("POLYNOMIALS", 53, 24)) {
      const m = /\(x \+ (\d+)\)\(x \+ (\d+)\)/.exec(p.question)!;
      expect(p.answer).toBe(`x²,${m[1]}x,${m[2]}x,${Number(m[1]) * Number(m[2])}`);
    }
  });

  test("M12 Factor quadratic trinomials: select items open the unit, typed factorization is practised by the last sheets", () => {
    const typed = (n: number) => sheet("POLYNOMIALS", n).filter((p) => /^Factor x²/.test(p.question));
    const select = (n: number) => sheet("POLYNOMIALS", n).filter((p) => /^Select all/.test(p.question));
    expect(select(75).length).toBeGreaterThanOrEqual(24);
    expect(typed(78).length).toBeGreaterThanOrEqual(24);
    for (const n of [76, 77, 78]) for (const p of typed(n)) {
      const m = /^Factor x² \+ (\d+)x \+ (\d+)\.$/.exec(p.question)!;
      const f = /^\(x \+ (\d+)\)\(x \+ (\d+)\)$/.exec(String(p.answer))!;
      const [a, b] = [Number(f[1]), Number(f[2])];
      expect(a).toBeLessThan(b);                    // smaller number first, as the directive says
      expect(a + b).toBe(Number(m[1])); expect(a * b).toBe(Number(m[2]));
    }
    expect(directive("POLYNOMIALS", 75)).toMatch(/select exactly the two factors/);
    expect(directive("POLYNOMIALS", 75)).toMatch(/smaller number first/);
    expect(steps("Factor quadratic trinomials")).toMatch(/pick exactly the two/);
  });

  test("M12 Perfect-square trinomials: minus case and input form taught; (ax ± b)² keys fully factored and arrive later", () => {
    const s = steps("Perfect-square trinomials");
    expect(s).toMatch(/x² − 2x \+ 1 .* \(x − 1\)²/);
    expect(s).toMatch(/not \(x \+ 3\)\(x \+ 3\)/);
    expect(directive("POLYNOMIALS", 89)).toMatch(/one squared bracket/);
    const day1 = sheet("POLYNOMIALS", 89);
    for (const p of day1) expect(p.question).toMatch(/^Factor x² /);
    expect(day1.some((p) => / - \d+x /.test(p.question))).toBe(true);
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    for (const n of [90, 91, 92]) for (const p of sheet("POLYNOMIALS", n)) {
      const m = /^Factor (\d*)x² ([+-]) (\d+)x \+ (\d+)\.$/.exec(p.question)!;
      const a = Math.sqrt(Number(m[1] || 1)), b = Math.sqrt(Number(m[4]));
      expect(Number.isInteger(a) && Number.isInteger(b)).toBe(true);
      expect(Number(m[3])).toBe(2 * a * b);
      expect(gcd(a, b)).toBe(1);
      expect(p.answer).toBe(`(${a === 1 ? "" : a}x ${m[2]} ${b})²`);
    }
    expect(sheet("POLYNOMIALS", 92).some((p) => /^Factor \dx²/.test(p.question))).toBe(true);
  });

  test("M12 polynomials never render a signed constant as '+ (-k)'", () => {
    for (let n = 1; n <= 100; n++) for (const p of sheet("POLYNOMIALS", n)) {
      expect(p.question).not.toMatch(/\+ \(-|\+ -|- -/);
      expect(String(p.answer)).not.toMatch(/\+ \(-|\+ -|- -/);
    }
  });
});
