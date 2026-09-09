// tests/unit/transition-majors-m2-m6.test.ts
// Locks in the M2–M6 lesson-boundary fixes from the transition audit (Sep 2026):
// what a child meets on the OPENING sheet of a lesson must be the shape the
// micro-lesson taught, using only numbers and operations met on earlier days.
import { generateEarlyMathSheet, getEarlyMathMicroLesson } from "@/lib/shop/early-math-engine";
import { generateArithmeticSheet, getArithmeticMicroLesson } from "@/lib/shop/arithmetic-engine";

const early = (level: string, sheet: number) => generateEarlyMathSheet(level, sheet, 100, 36).problems.map((p) => String(p.question));
const arith = (skill: string, sheet: number) => generateArithmeticSheet(skill as any, sheet, 100, 30).problems.map((p) => String(p.question));
const numbersIn = (q: string) => (q.match(/\d+/g) ?? []).map(Number);

describe("M2 skip counting opens with the taught shape", () => {
  it("skip-2 sheet 57 is forward, blank last, mostly even runs", () => {
    const qs = early("M2", 57);
    expect(qs.length).toBe(36);
    for (const q of qs) expect(q).toMatch(/^\d+, \d+, \d+, ___$/);
    const even = qs.filter((q) => numbersIn(q)[0] % 2 === 0).length;
    expect(even).toBeGreaterThanOrEqual(qs.length / 2);
    for (const q of qs) { const [a, b, c] = numbersIn(q); expect(b - a).toBe(2); expect(c - b).toBe(2); }
  });

  it("the other skip-2 shapes still arrive later in the unit", () => {
    const later = [...early("M2", 62), ...early("M2", 68)];
    expect(later.some((q) => /^\d+, ___, \d+, \d+$/.test(q))).toBe(true);
    expect(later.some((q) => /^___, \d+, \d+, \d+$/.test(q))).toBe(true);
    const down = later.filter((q) => /^\d+, \d+, \d+, ___$/.test(q)).filter((q) => { const [a, b] = numbersIn(q); return b < a; });
    expect(down.length).toBeGreaterThan(0);
  });

  it("skip-5 sheet 69 stays at or below 100; skip-10 sheet 81 at or below 150", () => {
    for (const q of early("M2", 69)) for (const n of numbersIn(q)) expect(n).toBeLessThanOrEqual(100);
    const ans69 = generateEarlyMathSheet("M2", 69, 100, 36).problems.map((p) => Number(p.answer));
    for (const a of ans69) expect(a).toBeLessThanOrEqual(100);
    for (const q of early("M2", 81)) for (const n of numbersIn(q)) expect(n).toBeLessThanOrEqual(150);
    // …and the past-100 runs do come, on the late sheets.
    expect(early("M2", 80).some((q) => numbersIn(q).some((n) => n > 100))).toBe(true);
  });

  it("skip-2 and skip-5 lessons model counting down, without addition", () => {
    for (const label of ["Skip counting by 2", "Skip counting by 5"]) {
      const ex = getEarlyMathMicroLesson(label)!.example;
      expect(ex.steps.join(" ")).toMatch(/count back/i);
      expect(ex.steps.join(" ")).not.toMatch(/\d \+ \d/);
    }
  });
});

describe("M3 lessons teach what the opening sheet asks", () => {
  it("Adding zero & turnarounds teaches +0 and shows no missing-number shape", () => {
    const ex = getArithmeticMicroLesson("Adding zero & turnarounds", "M3")!.example;
    expect(ex.problem).toMatch(/\+ 0/);
    expect(ex.problem).not.toMatch(/___/);
    expect(arith("ADDITION", 9).some((q) => /\+ 0$|^0 \+/.test(q))).toBe(true);
    expect(arith("ADDITION", 9).some((q) => /___/.test(q))).toBe(false);
  });

  it("3-digit addition opens under 1000, with three addends and the thousands carry in the lesson", () => {
    const ws = generateArithmeticSheet("ADDITION" as any, 65, 100, 30);
    for (const p of ws.problems) expect(Number(p.answer)).toBeLessThan(1000);
    const steps = getArithmeticMicroLesson("3-digit addition & three addends", "M3")!.example.steps.join(" ");
    expect(steps).toMatch(/Three numbers/);
    expect(steps).toMatch(/thousands/);
  });
});

describe("M4 opening sheets are the direct form", () => {
  it("counting back sheet 1 and 3-digit subtraction sheet 73 hold no missing-number items", () => {
    expect(arith("SUBTRACTION", 1).some((q) => /___/.test(q))).toBe(false);
    expect(arith("SUBTRACTION", 73).some((q) => /___/.test(q))).toBe(false);
    const ex = getArithmeticMicroLesson("3-digit subtraction (regrouping)", "M4")!.example;
    expect(ex.steps.filter((s) => /^(Ones|Tens|Hundreds):/.test(s)).length).toBe(3);
  });
});

describe("M5 facts arrive in an order a child can build", () => {
  it("×2/×5/×10 sheet 1 is plain a × b", () => {
    expect(arith("MULTIPLICATION", 1).some((q) => /___/.test(q))).toBe(false);
  });

  it("×1 and ×0 lesson shows a ×0 example", () => {
    expect(getArithmeticMicroLesson("×1 and ×0", "M5")!.example.steps.join(" ")).toMatch(/0 × 7 = 0/);
  });

  it("squares open with 1–5 and 10 only; 6×6–9×9, 11×11, 12×12 wait for sheet 11", () => {
    const sq = (qs: string[]) => qs.map((q) => /^(\d+) × (\d+)( = \?)?$/.exec(q)).filter((m): m is RegExpExecArray => !!m && m[1] === m[2]).map((m) => Number(m[1]));
    const first = sq(arith("MULTIPLICATION", 10));
    expect(first.length).toBeGreaterThan(0);
    for (const n of first) expect(n <= 5 || n === 10).toBe(true);
    expect(sq(arith("MULTIPLICATION", 11))).toEqual(expect.arrayContaining([6, 7, 8, 9, 11]));
    // Squares are also review on the ×3/×4 opener — 12 × 12 must not leak there.
    expect(arith("MULTIPLICATION", 13)).not.toContain("12 × 12");
    const steps = getArithmeticMicroLesson("Square facts (n × n)", "M5")!.example.steps.join(" ");
    expect(steps).toMatch(/6 × 5 = 30/);
  });

  it("missing-factor lesson never uses ÷ (division is M6)", () => {
    const ex = getArithmeticMicroLesson("Fact families & missing factor", "M5")!.example;
    expect(ex.steps.join(" ")).not.toMatch(/÷/);
    expect(ex.steps.join(" ")).toMatch(/8 sixes/);
  });
});

describe("M6 division", () => {
  it("÷2, ÷5, ÷10 sheet 1 is plain and actually covers all three tables", () => {
    const qs = arith("DIVISION", 1);
    expect(qs.some((q) => /___/.test(q))).toBe(false);
    for (const d of [2, 5, 10]) expect(qs.some((q) => new RegExp(`÷ ${d}( = \\?)?$`).test(q))).toBe(true);
  });

  it("÷1 lesson shows a ÷1 example", () => {
    expect(getArithmeticMicroLesson("÷1 and dividing a number by itself", "M6")!.example.steps.join(" ")).toMatch(/5 ÷ 1 = 5/);
  });

  it("fact families practise the missing dividend the lesson teaches, and explain the missing divisor", () => {
    expect(arith("DIVISION", 37).filter((q) => /^___ ÷/.test(q)).length).toBeGreaterThanOrEqual(4);
    const steps = getArithmeticMicroLesson("Fact families & missing dividend", "M6")!.example.steps.join(" ");
    expect(steps).toMatch(/Missing divisor/);
  });

  it("the division Mixed review lesson is a remainder example with the missing-dividend shape", () => {
    const ex = getArithmeticMicroLesson("Mixed review", "M6")!.example;
    expect(ex.problem).toMatch(/÷/);
    expect(ex.answer).toMatch(/ r /);
    expect(ex.steps.join(" ")).toMatch(/___ ÷ 3 = 2/);
    // And every answer on its opening sheet is well-formed.
    for (const p of generateArithmeticSheet("DIVISION" as any, 93, 100, 30).problems) expect(String(p.answer)).toMatch(/^\d+( r \d+)?$/);
  });
});
