// tests/unit/transition-majors-m12.test.ts
// The six M12 (Polynomials) lesson boundaries a reviewer flagged as MAJOR: every
// factoring key is the FULLY factored form (a child who pulls the GCF first is
// never marked wrong against a half-factored key), and each opening sheet holds
// only what its micro-lesson worked through.
import { generateAdvancedSheet, getAdvancedMicroLesson, validateAdvancedPack } from "@/lib/shop/advanced-engine";

const sheet = (n: number, count = 30) => generateAdvancedSheet("POLYNOMIALS" as any, n, 100, count).problems;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lesson = (label: string) => getAdvancedMicroLesson(label)!;
const steps = (label: string) => lesson(label).example.steps.join(" ");

describe("M12 transition majors", () => {
  test("POLYNOMIALS pack still validates", () => {
    expect(validateAdvancedPack("POLYNOMIALS").issues).toEqual([]);
  });

  test("1. Factor trinomials (a ≠ 1): gcd-free triples, canonical factor order, a = 2 opening sheet", () => {
    for (const n of [79, 80, 81, 82, 83]) {
      for (const p of sheet(n)) {
        const m = /^Factor (\d*)x² \+ (\d+)x \+ (\d+)\.$/.exec(p.question)!;
        const a = Number(m[1] || 1), b = Number(m[2]), c = Number(m[3]);
        expect(a).toBeGreaterThan(1);
        expect(gcd(gcd(a, b), c)).toBe(1);
        // key = (px + q)(rx + s), larger x-coefficient first, ties → smaller constant first
        const f = /^\((\d*)x \+ (\d+)\)\((\d*)x \+ (\d+)\)$/.exec(String(p.answer))!;
        const [pp, q, r, s] = [Number(f[1] || 1), Number(f[2]), Number(f[3] || 1), Number(f[4])];
        expect(pp * r).toBe(a); expect(pp * s + q * r).toBe(b); expect(q * s).toBe(c);
        expect(pp > r || (pp === r && q <= s)).toBe(true);
      }
    }
    const day1 = sheet(79);
    for (const p of day1) expect(p.question).toMatch(/^Factor 2x² /);
    // the example's shape (c prime, one way to split it) leads the sheet
    expect(day1.slice(0, 6).every((p) => /\+ (1|2|3|5|7)\.$/.test(p.question))).toBe(true);
    expect(sheet(83).some((p) => !/^Factor 2x² /.test(p.question))).toBe(true);
    const u = lesson("Factor trinomials (a ≠ 1)");
    expect(u.example.steps.join(" ")).toMatch(/larger x-coefficient first/);
  });

  test("2. Identify polynomials: rule stated with Yes + two No cases; roots/negative/variable exponents wait", () => {
    const u = lesson("Identify polynomials");
    expect(u.bigIdea).toMatch(/whole-number powers/);
    expect(u.bigIdea).toMatch(/no roots/);
    expect(u.bigIdea).toMatch(/denominator/);
    expect(u.bigIdea).toMatch(/negative or fraction powers/);
    expect(u.bigIdea).toMatch(/x as an exponent/);
    expect(u.example.steps.filter((s) => /^Yes:/.test(s)).length).toBe(1);
    expect(u.example.steps.filter((s) => /^No:/.test(s)).length).toBe(2);
    const day1 = sheet(5);
    for (const p of day1) expect(p.question).not.toMatch(/√|∛|⁻|ˣ|\^\(1\/2\)/);
    expect(day1.filter((p) => p.answer === "No").length).toBeGreaterThanOrEqual(6);
    expect(sheet(7).some((p) => /√|⁻|ˣ/.test(p.question))).toBe(true);
  });

  test("3. Evaluate polynomials: opening sheet positive x only; negative-x step in the example", () => {
    for (const p of sheet(20)) expect(p.question).not.toMatch(/x = -/);
    expect(sheet(23).some((p) => /x = -1/.test(p.question))).toBe(true);
    expect(steps("Evaluate polynomials")).toMatch(/\(−1\)² = \+1/);
    expect(steps("Evaluate polynomials")).toMatch(/3·\(−1\) = −3/);
  });

  test("4. Divide by a monomial: term-by-term example, no GCF factoring", () => {
    const s = steps("Divide by a monomial");
    expect(s).toMatch(/6x² ÷ 2x = 3x/);
    expect(s).toMatch(/4x ÷ 2x = 2/);
    expect(s).toMatch(/2x\(3x \+ 2\) = 6x² \+ 4x/);
    expect(s).not.toMatch(/Factor|GCF/i);
  });

  test("5. Difference of squares: gcd-free pairs only; (2x)² step in the example", () => {
    for (const n of [84, 86, 88]) {
      for (const p of sheet(n)) {
        const m = /^Factor (\d*)x² - (\d+)\.$/.exec(p.question)!;
        const a = Number(m[1] || 1), k2 = Number(m[2]);
        const root = Math.sqrt(a), k = Math.sqrt(k2);
        expect(Number.isInteger(root) && Number.isInteger(k)).toBe(true);
        expect(gcd(root, k)).toBe(1);
        expect(p.answer).toBe(`(${root === 1 ? "" : root}x + ${k})(${root === 1 ? "" : root}x - ${k})`);
      }
    }
    expect(steps("Difference of squares")).toMatch(/4x² = \(2x\)²/);
  });

  test("6. Sum & difference of cubes: both formulas + SOAP + x³ − 27 case; keys fully factored", () => {
    const s = steps("Sum & difference of cubes");
    expect(s).toMatch(/a³ \+ b³ = \(a \+ b\)\(a² − ab \+ b²\)/);
    expect(s).toMatch(/a³ − b³ = \(a − b\)\(a² \+ ab \+ b²\)/);
    expect(s).toMatch(/SOAP/);
    expect(s).toMatch(/x³ − 27/);
    for (const n of [97, 98, 99, 100]) {
      for (const p of sheet(n)) {
        const m = /^Factor (\d*)x³ ([+-]) (\d+)\.$/.exec(p.question)!;
        const a3 = Number(m[1] || 1), k3 = Number(m[3]);
        const a = Math.round(Math.cbrt(a3)), k = Math.round(Math.cbrt(k3));
        expect(a ** 3).toBe(a3); expect(k ** 3).toBe(k3);
        expect(gcd(a, k)).toBe(1);
      }
    }
  });
});
