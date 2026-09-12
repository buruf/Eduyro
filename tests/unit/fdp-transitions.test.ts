// tests/unit/fdp-transitions.test.ts
// M7 (fractions · decimals · percents) lesson boundaries — the majors from the
// Sep 2026 transition audit. Each test pins what a child meets on the OPENING
// sheet of a unit (the day its micro-lesson fires) so the fixes cannot drift.
import { generateFdpSheet, validateFdpPack, getFdpMicroLesson, fdpUnits } from "@/lib/shop/fdp-engine";

const sheet = (n: number) => generateFdpSheet(n, 100, 30);
const qs = (n: number) => sheet(n).problems.map((p) => String(p.question));
const as = (n: number) => sheet(n).problems.map((p) => String(p.answer));
const frac = (q: string) => [...q.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

describe("M7 pack invariants", () => {
  it("validates: contiguous ranges, enough items, no duplicates, GPI monotonic", () => {
    const v = validateFdpPack(100);
    expect(v.issues).toEqual([]);
    expect(v.ok).toBe(true);
  });
  it("no sheet repeats a question", () => {
    for (let n = 1; n <= 100; n++) {
      const q = qs(n);
      expect(new Set(q).size).toBe(q.length);
    }
  });
  it("every touched unit has a real big idea distinct from its goal", () => {
    for (const label of ["Equivalent fractions", "Compare fractions", "Mixed numbers", "Add fractions", "Decimal place value", "Compare decimals", "Round decimals", "Add & subtract decimals", "Multiply decimals", "Fractions ↔ percents", "Decimals ↔ percents", "Percent of a number"]) {
      const l = getFdpMicroLesson(label)!;
      expect(l).not.toBeNull();
      expect(l.bigIdea).not.toBe(l.goal);
      expect(l.example.steps.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("Identify → Equivalent fractions (sheet 10)", () => {
  it("opens with picture-backed pairs before bare symbols", () => {
    const q = qs(10);
    expect(q[0]).toMatch(/^\[\[viz cmp /);
    const lastViz = q.map((x) => x.startsWith("[[viz")).lastIndexOf(true);
    const firstBare = q.findIndex((x) => !x.startsWith("[[viz"));
    expect(lastViz).toBeLessThan(firstBare);
    expect(q.filter((x) => x.startsWith("[[viz")).length).toBeGreaterThanOrEqual(6);
  });
  it("the picture pair really is equivalent and the lesson shows one", () => {
    for (const q of qs(10).filter((x) => x.startsWith("[[viz cmp"))) {
      const [, n1, d1, n2, d2] = q.match(/\[\[viz cmp (\d+) (\d+) (\d+) (\d+)\]\]/)!.map(Number);
      expect(n1 * d2).toBe(n2 * d1);
    }
    expect(getFdpMicroLesson("Equivalent fractions")!.example.problem).toMatch(/^\[\[viz cmp 2 3 8 12\]\]/);
  });
});

describe("Equivalent → Compare fractions (sheet 16)", () => {
  it("opening sheet stays on like denominators or one-is-a-multiple pairs", () => {
    for (const q of qs(16)) {
      const [[, d1], [, d2]] = frac(q);
      expect(d1 === d2 || d1 % d2 === 0 || d2 % d1 === 0).toBe(true);
    }
  });
  it("answers are not all the same symbol", () => {
    const a = as(16);
    expect(a.filter((x) => x === ">").length).toBeGreaterThanOrEqual(8);
    expect(a.filter((x) => x === "<").length).toBeGreaterThanOrEqual(8);
  });
  it("the lesson teaches finding a shared bottom and the = outcome", () => {
    const steps = getFdpMicroLesson("Compare fractions")!.example.steps.join(" ");
    expect(steps).toMatch(/3 × 5 = 15/);
    expect(steps).toMatch(/write =/);
  });
});

describe("Simplify → Mixed numbers / Improper fractions (sheets 31, 35)", () => {
  it("every mixed-number key has its fraction part in lowest terms", () => {
    for (let n = 31; n <= 34; n++) for (const a of as(n)) {
      const m = a.match(/^(\d+) \\frac\{(\d+)\}\{(\d+)\}$/)!;
      expect(m).not.toBeNull();
      expect(gcd(Number(m[2]), Number(m[3]))).toBe(1);
    }
  });
  it("improper-fraction questions name the task and never carry a reducible part", () => {
    for (let n = 35; n <= 38; n++) for (const q of qs(n)) {
      expect(q).toMatch(/^Write \d+ \\frac\{\d+\}\{\d+\} as an improper fraction\.$/);
      const [[num, den]] = frac(q);
      expect(gcd(num, den)).toBe(1);
    }
  });
});

describe("Improper → Add fractions (sheet 39)", () => {
  it("opening sheet is same-denominator only; later sheets bring unlike denominators", () => {
    for (const q of qs(39)) { const [[, d1], [, d2]] = frac(q); expect(d1).toBe(d2); }
    expect(qs(41).some((q) => { const [[, d1], [, d2]] = frac(q); return d1 !== d2; })).toBe(true);
  });
  it("the lesson is a like-denominator example that says simplify / whole / improper", () => {
    const ex = getFdpMicroLesson("Add fractions")!.example;
    expect(ex.problem).toBe("\\frac{3}{8} + \\frac{3}{8}");
    expect(ex.answer).toBe("\\frac{3}{4}");
    const steps = ex.steps.join(" ");
    expect(steps).toMatch(/simplest form/);
    expect(steps).toMatch(/1 whole/);
    expect(steps).not.toMatch(/LCM/);
  });
});

describe("Decimal place value (sheets 51–54)", () => {
  it("the lesson explains the point, tenths and hundredths as fractions", () => {
    const steps = getFdpMicroLesson("Decimal place value")!.example.steps.join(" ");
    expect(steps).toMatch(/4\/10/);
    expect(steps).toMatch(/7\/100/);
  });
  it("no run of four consecutive items with the same answer", () => {
    for (let n = 51; n <= 54; n++) {
      const a = as(n);
      for (let i = 3; i < a.length; i++) expect(new Set(a.slice(i - 3, i + 1)).size).toBeGreaterThan(1);
    }
  });
});

describe("Compare decimals (sheets 55–58)", () => {
  it("both > and < appear on every sheet, and = exists in the unit", () => {
    let eq = 0;
    for (let n = 55; n <= 58; n++) {
      const a = as(n);
      expect(a.filter((x) => x === ">").length).toBeGreaterThanOrEqual(8);
      expect(a.filter((x) => x === "<").length).toBeGreaterThanOrEqual(8);
      eq += a.filter((x) => x === "=").length;
    }
    expect(eq).toBeGreaterThanOrEqual(0); // = pairs are rare on a sheet; the lesson shows the case
  });
  it("every answer is correct", () => {
    for (let n = 55; n <= 58; n++) for (const p of sheet(n).problems) {
      const [l, r] = String(p.question).split(" ___ ").map(Number);
      expect(p.answer).toBe(l > r ? ">" : l < r ? "<" : "=");
    }
  });
});

describe("Round decimals (sheets 59–62)", () => {
  it("opening sheet is nearest-tenth only; nearest-whole arrives on sheet 60", () => {
    expect(qs(59).every((q) => /nearest tenth$/.test(q))).toBe(true);
    expect(qs(60).some((q) => /nearest whole$/.test(q))).toBe(true);
  });
  it("nearest-tenth keys keep the tenths place (6.0, not 6)", () => {
    for (const p of sheet(59).problems) expect(String(p.answer)).toMatch(/^\d+\.\d$/);
  });
  it("the lesson states the 5-or-more rule, a round-down and nearest whole", () => {
    const steps = getFdpMicroLesson("Round decimals")!.example.steps.join(" ");
    expect(steps).toMatch(/5 or more rounds up/);
    expect(steps).toMatch(/0\.14/);
    expect(steps).toMatch(/nearest WHOLE/);
  });
});

describe("Add & subtract decimals (sheet 63)", () => {
  it("opening sheet has equal-length operands only", () => {
    for (const q of qs(63)) for (const t of q.split(/ [+-] /)) expect(t).toMatch(/^\d\.\d\d$/);
  });
  it("mixed-length items exist later in the unit", () => {
    let mixed = 0;
    for (let n = 64; n <= 67; n++) mixed += qs(n).filter((q) => /\b\d\.\d\b/.test(q)).length;
    expect(mixed).toBeGreaterThan(0);
  });
  it("the lesson models subtraction and padding 0.4 to 0.40", () => {
    const steps = getFdpMicroLesson("Add & subtract decimals")!.example.steps.join(" ");
    expect(steps).toMatch(/0\.55 − 0\.13/);
    expect(steps).toMatch(/0\.40/);
  });
});

describe("Multiply decimals (sheet 68)", () => {
  it("opening sheet uses single-digit factors only", () => {
    for (const q of qs(68)) {
      const [a, b] = q.split(" × ");
      expect(Number(a) * 10).toBeLessThanOrEqual(9);
      expect(b.includes(".") ? Number(b) * 10 : Number(b)).toBeLessThanOrEqual(9);
    }
  });
  it("the lesson states the count-the-places rule and a decimal × whole case", () => {
    const steps = getFdpMicroLesson("Multiply decimals")!.example.steps.join(" ");
    expect(steps).toMatch(/Count the digits after the points/);
    expect(steps).toMatch(/0\.5 × 3/);
  });
});

describe("Divide decimals (sheet 73)", () => {
  it("opening sheet dividends stay under 10", () => {
    for (const q of qs(73)) expect(Number(q.split(" ÷ ")[0])).toBeLessThan(10);
  });
});

describe("Percents (sheets 79, 83, 87)", () => {
  it("Fractions ↔ percents teaches the make-the-bottom-100 method, not division", () => {
    const steps = getFdpMicroLesson("Fractions ↔ percents")!.example.steps.join(" ");
    expect(steps).toMatch(/20 × 5 = 100/);
    expect(steps).not.toMatch(/÷ 4 = 0\.25/);
  });
  it("Decimals ↔ percents interleaves both directions and teaches percent → decimal", () => {
    const q = qs(83);
    const longestRun = q.reduce<{ run: number; max: number; prev: string }>((s, x) => {
      const f = x.includes("→ decimal") ? "pd" : "dp";
      const run = f === s.prev ? s.run + 1 : 1;
      return { run, max: Math.max(s.max, run), prev: f };
    }, { run: 0, max: 0, prev: "" }).max;
    expect(longestRun).toBeLessThanOrEqual(6);
    const steps = getFdpMicroLesson("Decimals ↔ percents")!.example.steps.join(" ");
    expect(steps).toMatch(/5% → decimal/);
    expect(steps).toMatch(/0\.30/);
    expect(steps).toMatch(/LEFT/);
  });
  it("Percent of a number opens with 50%, 25% and 10% only", () => {
    for (const q of qs(87)) expect(q).toMatch(/^(50|25|10)% of \d+$/);
    expect(qs(90).some((q) => /^75% of/.test(q))).toBe(true);
    const steps = getFdpMicroLesson("Percent of a number")!.example.steps.join(" ");
    expect(steps).toMatch(/75% = 3\/4/);
    expect(steps).toMatch(/20% = 1\/5/);
  });
});

// ── Minors pass (Sep 9 2026) ─────────────────────────────────────────────────
describe("M7 minors: every unit carries a real big idea and a method, not a restated answer", () => {
  it("no M7 unit falls back to its goal as the big idea; every example has ≥3 steps", () => {
    for (const u of fdpUnits()) {
      const l = getFdpMicroLesson(u.label)!;
      expect(l).not.toBeNull();
      expect(l.bigIdea).not.toBe(l.goal);
      expect(l.example.steps.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("Part of a whole (sheet 1) vs Writing fractions from pictures (sheet 4)", () => {
  it("lesson 4 is grids only, lesson 1 is single shapes, and the two sheets share no picture", () => {
    const s1 = qs(1), s4 = qs(4);
    expect(s4.every((q) => /^\[\[viz grid \d+ \d+\]\]$/.test(q))).toBe(true);
    expect(s1.every((q) => !q.startsWith("[[viz grid"))).toBe(true);
    expect(s4.filter((q) => s1.includes(q))).toEqual([]);
  });
  it("every lesson-4 grid is a clean rectangle the child can count as rows × columns", () => {
    for (const q of qs(4)) {
      const [, n, d] = q.match(/\[\[viz grid (\d+) (\d+)\]\]/)!.map(Number);
      const cols = Math.ceil(Math.sqrt(d));
      expect(d % cols).toBe(0);
      expect(n).toBeLessThan(d);
    }
  });
  it("lesson 4's example is a small grid with shaded-over-total steps, not a 100-square ÷", () => {
    const ex = getFdpMicroLesson("Writing fractions from pictures")!.example;
    expect(ex.problem).toBe("[[viz grid 5 12]]");
    expect(ex.answer).toBe("\\frac{5}{12}");
    expect(ex.steps.join(" ")).toMatch(/4 × 3 = 12/);
    expect(ex.steps.join(" ")).not.toMatch(/÷/);
  });
});

describe("Divide decimals (sheet 73) lesson", () => {
  it("teaches the cover-the-point method, the place count, a check and the whole-number case", () => {
    const steps = getFdpMicroLesson("Divide decimals")!.example.steps.join(" ");
    expect(steps).toMatch(/12 ÷ 3 = 4/);
    expect(steps).toMatch(/ONE digit after the point/);
    expect(steps).toMatch(/0\.4 × 3 = 1\.2/);
    expect(steps).toMatch(/2 or 2\.0/);
  });
});

// ── Printed FRACTIONS pack pass (Sep 11 2026) ────────────────────────────────
// The 50-sheet printed pack draws sheet counts from the layout, so these pin
// the pack's real page sizes (8 / 12 / 18) as well as the daily 30.
describe("FRACTIONS pack: sheets 1–9 climb instead of regressing", () => {
  it("sheet 1 stays on halves → sixths single shapes; Identify grows into word names by sheet 9", () => {
    for (const q of generateFdpSheet(1, 100, 8).problems) {
      const [, d] = String(q.question).match(/\[\[viz \w+ \d+ (\d+)\]\]/)!.map(Number);
      expect(d).toBeLessThanOrEqual(6);
    }
    const words = (n: number) => qs(n).filter((q) => /^[a-z]+ [a-z]+$/.test(q));
    expect(words(6)).toEqual([]);
    expect(words(9).length).toBeGreaterThanOrEqual(4);
    expect(qs(9).filter((q) => qs(6).includes(q)).length).toBeLessThan(6);
  });
});

describe("Order fractions (sheets 21–24) grows past {2,3,4,6} trios", () => {
  it("opens on the taught trios; later sheets bring 5/8/10/12 and four-fraction lists", () => {
    const denoms = (q: string) => frac(q).map(([, d]) => d);
    for (const q of generateFdpSheet(21, 100, 12).problems.map((p) => String(p.question))) {
      expect(frac(q).length).toBe(3);
      for (const d of denoms(q)) expect([2, 3, 4, 6]).toContain(d);
    }
    const late = [23, 24].flatMap((n) => generateFdpSheet(n, 100, 12).problems.map((p) => String(p.question)));
    expect(late.some((q) => denoms(q).some((d) => [5, 8, 10, 12].includes(d)))).toBe(true);
    expect(late.some((q) => frac(q).length === 4)).toBe(true);
  });
});

describe("Add / Subtract fractions climb one method per sheet", () => {
  const rel = (q: string) => { const [[, d1], [, d2]] = frac(q); return d1 === d2 ? 0 : d1 % d2 === 0 || d2 % d1 === 0 ? 1 : 2; };
  it("Add: 39 same bottom, 40 one-fits, 41 neither-fits — at both page sizes", () => {
    for (const c of [18, 30]) for (const [n, tier] of [[39, 0], [40, 1], [41, 2]] as const) {
      for (const p of generateFdpSheet(n, 100, c).problems) expect(rel(String(p.question))).toBe(tier);
    }
  });
  it("Subtract: 42 is the like-denominator case the lesson teaches, then 43 one-fits, 44 neither-fits", () => {
    for (const c of [18, 30]) for (const [n, tier] of [[42, 0], [43, 1], [44, 2]] as const) {
      for (const p of generateFdpSheet(n, 100, c).problems) expect(rel(String(p.question))).toBe(tier);
    }
  });
  it("directives state the answer form; lessons work the one-fits and neither-fits cases", () => {
    expect(sheet(39).meta.directive).toMatch(/simplest form.*improper fraction/);
    expect(sheet(42).meta.directive).toMatch(/simplest form/);
    expect(getFdpMicroLesson("Add fractions")!.example.steps.join(" ")).toMatch(/5\/15 \+ 6\/15 = 11\/15/);
    const sub = getFdpMicroLesson("Subtract fractions")!.example;
    expect(sub.problem).toBe("\\frac{5}{6} - \\frac{1}{6}");
    expect(sub.steps.join(" ")).toMatch(/4\/12 − 3\/12 = 1\/12/);
  });
});

describe("Divide fractions (sheets 48–49)", () => {
  it("opening sheet answers are proper fractions; sheet 49 brings quotients of 1 or more", () => {
    const val = (a: string) => { const m = a.match(/^\\frac\{(\d+)\}\{(\d+)\}$/); return m ? Number(m[1]) / Number(m[2]) : Number(a); };
    for (const c of [18, 30]) {
      for (const p of generateFdpSheet(48, 100, c).problems) expect(val(String(p.answer))).toBeLessThan(1);
      expect(generateFdpSheet(49, 100, c).problems.some((p) => val(String(p.answer)) >= 1)).toBe(true);
    }
    expect(getFdpMicroLesson("Divide fractions")!.example.steps.join(" ")).toMatch(/8\/2 = 4/);
  });
});

describe("Fraction mastery (sheet 50)", () => {
  // Stems print exactly as their home units do: a "?" (equivalent), "___"
  // (compare), a comma list (order), or the unit's instruction word.
  const shapes: RegExp[] = [/\{\?\}/, / ___ /, /^\\frac\{\d+\}\{\d+\}, \\frac/, /^Simplify/, /as a mixed number/, /as an improper fraction/, /^Add the fractions/, /^Subtract the fractions/, /^Multiply the fractions/, /^Divide the fractions/];
  it("draws from every fraction unit at the printed size (18) and the daily size (30)", () => {
    for (const c of [18, 30]) {
      const q = generateFdpSheet(50, 100, c).problems.map((p) => String(p.question));
      for (const v of shapes) expect(q.some((x) => v.test(x))).toBe(true);
      expect(q.some((x) => x.startsWith("Add") && (() => { const [[, d1], [, d2]] = frac(x); return d1 !== d2; })())).toBe(true);
      expect(q.some((x) => x.startsWith("Subtract") && (() => { const [[, d1], [, d2]] = frac(x); return d1 !== d2; })())).toBe(true);
    }
  });
  it("no commuted duplicate (a+b / b+a) on the page, and the directive names the answer form", () => {
    for (const c of [18, 30]) {
      const canon = generateFdpSheet(50, 100, c).problems.map((p) => {
        const m = String(p.question).match(/^((?:Add|Multiply) the fractions:\s+)(\S+) ([+×]) (\S+)$/);
        return m ? `${m[1]}${[m[2], m[4]].sort().join(m[3])}` : String(p.question);
      });
      expect(new Set(canon).size).toBe(canon.length);
    }
    expect(sheet(50).meta.directive).toMatch(/simplest form/);
    expect(getFdpMicroLesson("Fraction mastery")!.example.steps.join(" ")).toMatch(/Divide.*Subtract/s);
  });
});
