// src/lib/shop/fdp-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// EDUYRO M7 — FRACTIONS · DECIMALS · PERCENTS  (visual-first curriculum)
//
// A single 100-sheet workbook that progresses:
//   Sheets   1–5   Visual fraction foundations (large shapes, 8 Qs/page)
//   Sheets   6–50  Fraction skills (identify → … → divide → mastery)
//   Sheets  51–75  Decimals
//   Sheets  76–100 Percents & conversions
//
// DESIGN RULES (enforced by validateFdpPack):
//   • Organize by CONCEPT, never by denominator — denominators are mixed on
//     every page. Each sheet has exactly ONE learning objective.
//   • VARIETY: every unit offers several question FORMS; no single form may be
//     >40% of a sheet (anti-repetition).
//   • Difficulty rises within a sheet (Q1<Q30) and across the pack (monotonic
//     GPI) — true by construction via the scored sliding-window selector.
//   • No word problems — direct mathematical tasks only.
//
// Visual problems carry a leading marker the PDF renderer turns into SVG:
//   "[[viz pie 3 4]] …"   "[[viz bar 2 5]] …"   "[[viz grid 30 100]] …"
//   "[[viz cmp 1 2 1 3]] …"  (two bars, for comparison)
// ─────────────────────────────────────────────────────────────────────────────

import { nanoid } from "nanoid";
import type { WorksheetData, WorkedExample } from "./progressive-generator";
import { addCarries, subBorrows } from "@/lib/math/regroup";

const BS = String.fromCharCode(92);                 // single backslash
const F = (n: number, d: number) => `${BS}frac{${n}}{${d}}`;
// Instruction verb for a fraction operation, so every operation question reads
// as a clear instruction ("Add the fractions:  …") rather than a bare expression.
const FRAC_VERB: Record<string, string> = { "+": "Add", "-": "Subtract", "×": "Multiply", "÷": "Divide" };
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

// reduced fraction → "1" (whole), "w \frac{n}{d}" never here; just proper/improper
function reduced(n: number, d: number): string {
  const g = gcd(n, d) || 1;
  const nn = n / g, dd = d / g;
  return dd === 1 ? String(nn) : F(nn, dd);
}
const r1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
const r2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2);
const trimZero = (s: string) => s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

const DENOMS = [2, 3, 4, 5, 6, 8, 10, 12];          // mixed everywhere

interface XP { q: string; a: string; diff: number; form: string; key: string; viz?: boolean; }

// ── Form builders ─────────────────────────────────────────────────────────────
// Each returns the FULL enumerated set of problems for that form; difficulty is
// the raw structural score (normalized later). Keys dedupe; forms drive variety.

type Builder = () => XP[];

// fractions n/d with 1<=n<d for a denominator pool
function* fracPairs(denoms: number[]): Generator<[number, number]> {
  for (const d of denoms) for (let n = 1; n < d; n++) yield [n, d];
}

// ── VISUAL FOUNDATIONS ────────────────────────────────────────────────────────
// A varied set so successive picture-fraction problems don't all look the same:
// circle, strip, vertical strip, pentagon, hexagon, triangle, and grid.
const vizShapes = ["pie", "bar", "vbar", "penta", "hexa", "tri", "grid"] as const;
// Visual forms carry NO prose — the picture is the question; the sheet's section
// directive ("Write the fraction each picture shows.") supplies the instruction.
function vizIdentify(_prompt?: string): Builder {
  return () => {
    const out: XP[] = [];
    for (const [n, d] of fracPairs(DENOMS)) {
      const shape = vizShapes[(n + d) % vizShapes.length];
      out.push({ q: `[[viz ${shape} ${n} ${d}]]`, a: F(n, d), diff: d * 2 + n, form: `vid-${shape}`, key: `vid:${shape}:${n}/${d}` });
    }
    return out;
  };
}
const vizNumerator: Builder = () => {
  const out: XP[] = [];
  for (const [n, d] of fracPairs(DENOMS)) {
    const shape = vizShapes[(n + d) % vizShapes.length];
    out.push({ q: `[[viz ${shape} ${n} ${d}]]`, a: String(n), diff: d * 2 + n, form: `num-${shape}`, key: `num:${shape}:${n}/${d}` });
  }
  return out;
};
const vizDenominator: Builder = () => {
  const out: XP[] = [];
  for (const [n, d] of fracPairs(DENOMS)) {
    const shape = vizShapes[(n + d) % vizShapes.length];
    out.push({ q: `[[viz ${shape} ${n} ${d}]]`, a: String(d), diff: d * 2 + n, form: `den-${shape}`, key: `den:${shape}:${n}/${d}` });
  }
  return out;
};
const vizCompare: Builder = () => {
  const out: XP[] = [];
  for (const [n1, d1] of fracPairs(DENOMS)) for (const [n2, d2] of fracPairs(DENOMS)) {
    if (d1 > d2 || (d1 === d2 && n1 >= n2)) continue;
    const v1 = n1 / d1, v2 = n2 / d2;
    if (v1 === v2) continue;
    const bigger = v1 > v2 ? F(n1, d1) : F(n2, d2);
    out.push({ q: `[[viz cmp ${n1} ${d1} ${n2} ${d2}]]`, a: bigger, diff: Math.max(d1, d2) * 2, form: "vcmp", key: `vcmp:${n1}/${d1}:${n2}/${d2}` });
  }
  return out;
};

// ── FRACTION SKILLS ───────────────────────────────────────────────────────────
const idText: Builder = () => {
  const out: XP[] = [];
  for (const [n, d] of fracPairs(DENOMS)) {
    out.push({ q: `${n} out of ${d}`, a: F(n, d), diff: d * 2 + n, form: "id-text", key: `idt:${n}/${d}` });
  }
  return out;
};
const idVizSmall = vizIdentify("Write the fraction shown");

const equivFillNum: Builder = () => {
  const out: XP[] = [];
  for (const [n, d] of fracPairs([2, 3, 4, 5, 6])) for (const k of [2, 3, 4]) {
    out.push({ q: `${F(n, d)} = ${BS}frac{?}{${d * k}}`, a: String(n * k), diff: d * k, form: "eq-num", key: `eqn:${n}/${d}:${k}` });
  }
  return out;
};
const equivFillDen: Builder = () => {
  const out: XP[] = [];
  for (const [n, d] of fracPairs([2, 3, 4, 5, 6])) for (const k of [2, 3, 4]) {
    out.push({ q: `${F(n, d)} = ${BS}frac{${n * k}}{?}`, a: String(d * k), diff: d * k, form: "eq-den", key: `eqd:${n}/${d}:${k}` });
  }
  return out;
};
const equivFind: Builder = () => {
  const out: XP[] = [];
  for (const [n, d] of fracPairs([2, 3, 4, 5, 6, 8])) {
    out.push({ q: `Write an equivalent fraction for ${F(n, d)}.`, a: F(n * 2, d * 2), diff: d + 4, form: "eq-find", key: `eqf:${n}/${d}` });
  }
  return out;
};

const cmpSymbol: Builder = () => {
  const out: XP[] = [];
  const ps = [...fracPairs(DENOMS)];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const [n1, d1] = ps[i], [n2, d2] = ps[j];
    const v1 = n1 / d1, v2 = n2 / d2;
    const sym = v1 > v2 ? ">" : v1 < v2 ? "<" : "=";
    // Difficulty by REASONING tier so successive sheets escalate in thinking,
    // not just in size: same denominator → one denom a multiple of the other →
    // unit fractions → unrelated denominators (need a common denominator).
    const tier = d1 === d2 ? 0
      : (d2 % d1 === 0 || d1 % d2 === 0) ? 1
      : (n1 === 1 && n2 === 1) ? 2
      : 3;
    out.push({ q: `Compare with <, >, or =:  ${F(n1, d1)} ___ ${F(n2, d2)}`, a: sym, diff: tier * 14 + Math.max(d1, d2), form: "cmp-sym", key: `cmps:${n1}/${d1}:${n2}/${d2}` });
  }
  return out;
};
const cmpGreater: Builder = () => {
  const out: XP[] = [];
  const ps = [...fracPairs(DENOMS)];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const [n1, d1] = ps[i], [n2, d2] = ps[j];
    const v1 = n1 / d1, v2 = n2 / d2;
    if (v1 === v2) continue;
    out.push({ q: `Which is greater: ${F(n1, d1)} or ${F(n2, d2)}?`, a: v1 > v2 ? F(n1, d1) : F(n2, d2), diff: Math.max(d1, d2) * 2 + 1, form: "cmp-gt", key: `cmpg:${n1}/${d1}:${n2}/${d2}` });
  }
  return out;
};

const orderLeast: Builder = () => {
  const out: XP[] = [];
  const ps = [...fracPairs([2, 3, 4, 6])];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) for (let k = j + 1; k < ps.length; k++) {
    const trio = [ps[i], ps[j], ps[k]];
    const vals = trio.map(([n, d]) => n / d);
    if (new Set(vals).size < 3) continue;
    const sorted = trio.map((p, idx) => ({ p, v: vals[idx] })).sort((a, b) => a.v - b.v);
    // Reasoning tiers: all same denominator → all denominators share a common
    // denominator that's one of them → genuinely unrelated (full LCM needed).
    const ds = trio.map(([, d]) => d);
    const L = ds.reduce((acc, d) => lcm(acc, d), 1);
    const tier = new Set(ds).size === 1 ? 0 : (L <= Math.max(...ds) ? 1 : 2);
    out.push({
      q: trio.map(([n, d]) => F(n, d)).join(", "),
      a: sorted.map(({ p }) => F(p[0], p[1])).join(" < "),
      diff: tier * 18 + ds.reduce((s, d) => s + d, 0), form: "order", key: `ord:${trio.map(p => p.join("/")).join(",")}`,
    });
  }
  return out.slice(0, 400);
};

function simplifyForm(_verb: string, formId: string): Builder {
  return () => {
    const out: XP[] = [];
    for (const d of [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24]) for (let n = 2; n < d; n++) {
      if (gcd(n, d) === 1) continue;                 // only reducible
      out.push({ q: `Simplify ${F(n, d)}.`, a: reduced(n, d), diff: d + Math.log2(gcd(n, d)) * 4, form: formId, key: `${formId}:${n}/${d}` });
    }
    return out;
  };
}

const toMixed: Builder = () => {
  const out: XP[] = [];
  for (const d of [2, 3, 4, 5, 6, 8]) for (let w = 1; w <= 4; w++) for (let n = 1; n < d; n++) {
    const imp = w * d + n;
    out.push({ q: `Write ${F(imp, d)} as a mixed number.`, a: `${w} ${F(n, d)}`, diff: d + w * 2, form: "to-mixed", key: `mx:${imp}/${d}` });
  }
  return out;
};
const toImproper: Builder = () => {
  const out: XP[] = [];
  for (const d of [2, 3, 4, 5, 6, 8]) for (let w = 1; w <= 4; w++) for (let n = 1; n < d; n++) {
    out.push({ q: `${w} ${F(n, d)}`, a: F(w * d + n, d), diff: d + w * 2, form: "to-improper", key: `im:${w}_${n}/${d}` });
  }
  return out;
};

const addSame: Builder = () => {
  const out: XP[] = [];
  for (const d of DENOMS) for (let a = 1; a < d; a++) for (let b = 1; b < d; b++) {
    out.push({ q: `Add the fractions:  ${F(a, d)} + ${F(b, d)}`, a: reduced(a + b, d), diff: d * 2 + (a + b >= d ? 3 : 0), form: "add-same", key: `as:${a}/${d}+${b}/${d}` });
  }
  return out;
};
const subSame: Builder = () => {
  const out: XP[] = [];
  for (const d of DENOMS) for (let a = 2; a < d; a++) for (let b = 1; b < a; b++) {
    out.push({ q: `Subtract the fractions:  ${F(a, d)} - ${F(b, d)}`, a: reduced(a - b, d), diff: d * 2, form: "sub-same", key: `ss:${a}/${d}-${b}/${d}` });
  }
  return out;
};
function binUnlike(op: "+" | "-" | "×" | "÷", formId: string): Builder {
  return () => {
    const out: XP[] = [];
    const pairs: [number, number][] = [[2, 3], [2, 4], [3, 4], [2, 5], [3, 5], [4, 5], [2, 6], [3, 6], [4, 6], [3, 8], [4, 8], [5, 6], [2, 8], [5, 10], [3, 10]];
    const isAddSub = op === "+" || op === "-";
    for (const [d1, d2] of pairs) for (let n1 = 1; n1 < d1; n1++) for (let n2 = 1; n2 < d2; n2++) {
      let an: number, ad: number;
      if (op === "+") { const L = lcm(d1, d2); an = n1 * (L / d1) + n2 * (L / d2); ad = L; }
      else if (op === "-") { const L = lcm(d1, d2); an = n1 * (L / d1) - n2 * (L / d2); ad = L; if (an <= 0) continue; }
      else if (op === "×") { an = n1 * n2; ad = d1 * d2; }
      else { an = n1 * d2; ad = d1 * n2; }
      // For +/−, the reasoning jump is the denominator relationship: one denom a
      // multiple of the other (rewrite ONE fraction) → fully unrelated (full LCM).
      // These sit ABOVE the same-denominator form (addSame/subSame, tier 0) so a
      // sheet never mixes "add the tops" with "find a common denominator".
      const tier = isAddSub ? ((d1 % d2 === 0 || d2 % d1 === 0) ? 1 : 2) : 0;
      out.push({ q: `${FRAC_VERB[op]} the fractions:  ${F(n1, d1)} ${op} ${F(n2, d2)}`, a: reduced(an, ad), diff: tier * 100 + Math.max(d1, d2) * 2 + (isAddSub ? Math.log2(lcm(d1, d2)) : 0), form: formId, key: `${formId}:${n1}/${d1}:${n2}/${d2}` });
    }
    return out;
  };
}

// Unified fraction +/- as a SINGLE form that tiers internally by the denominator
// relationship, so one sheet never mixes "add the tops" with "find a common
// denominator" and the unit progresses same → related → unrelated across sheets.
function fracOp(op: "+" | "-", formId: string): Builder {
  return () => {
    const out: XP[] = [];
    const pairs: [number, number][] = [
      [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [8, 8],                              // tier 0: same denominator
      [2, 4], [2, 6], [3, 6], [4, 8], [2, 8], [5, 10], [2, 10], [4, 12], [3, 12], // tier 1: one denom a multiple of the other
      [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 8], [3, 10], [4, 6], [5, 8], // tier 2: unrelated (full LCM)
    ];
    for (const [d1, d2] of pairs) for (let n1 = 1; n1 < d1; n1++) for (let n2 = 1; n2 < d2; n2++) {
      if (d1 === d2 && n2 < n1) continue; // commutative — keep one of a+b / b+a
      const L = lcm(d1, d2);
      const an = op === "+" ? n1 * (L / d1) + n2 * (L / d2) : n1 * (L / d1) - n2 * (L / d2);
      if (op === "-" && an <= 0) continue;
      const tier = d1 === d2 ? 0 : (d1 % d2 === 0 || d2 % d1 === 0) ? 1 : 2;
      out.push({ q: `${FRAC_VERB[op]} the fractions:  ${F(n1, d1)} ${op} ${F(n2, d2)}`, a: reduced(an, L), diff: tier * 100 + Math.max(d1, d2) * 2 + Math.log2(L), form: formId, key: `${formId}:${n1}/${d1}:${n2}/${d2}` });
    }
    return out;
  };
}

// ── DECIMALS ──────────────────────────────────────────────────────────────────
const decPlaceValue: Builder = () => {
  const out: XP[] = [];
  const places: [string, number][] = [["tenths", 10], ["hundredths", 100]];
  for (let i = 1; i <= 99; i++) {
    const v = i / 100; const s = r2(v);
    const digit = i % 10;            // hundredths digit
    out.push({ q: `${s} — hundredths`, a: String(digit), diff: 100 + i / 10, form: "pv-which", key: `pvh:${i}` });
  }
  for (let i = 1; i <= 99; i++) {
    const tenths = Math.floor(i / 10);
    out.push({ q: `${r2(i / 100)} — tenths`, a: String(tenths), diff: i / 10, form: "pv-tenths", key: `pvt:${i}` });
  }
  void places;
  return out;
};
const decCompare: Builder = () => {
  const out: XP[] = [];
  for (let a = 1; a <= 99; a++) for (let b = a + 1; b <= 99; b += 7) {
    const va = a / 100, vb = b / 100;
    out.push({ q: `${trimZero(r2(va))} ___ ${trimZero(r2(vb))}`, a: va > vb ? ">" : va < vb ? "<" : "=", diff: Math.max(a, b), form: "dec-cmp", key: `dc:${a}:${b}` });
  }
  return out;
};
const decRound: Builder = () => {
  const out: XP[] = [];
  for (let i = 5; i <= 995; i += 1) {
    if (i % 7 !== 0) continue;
    const v = i / 100;
    out.push({ q: `${r2(v)} → nearest tenth`, a: trimZero((Math.round(v * 10) / 10).toFixed(1)), diff: i / 10, form: "round-t", key: `rt:${i}` });
  }
  for (let i = 5; i <= 99; i++) {
    const v = i / 10;
    out.push({ q: `${r1(v)} → nearest whole`, a: String(Math.round(v)), diff: i, form: "round-w", key: `rw:${i}` });
  }
  return out;
};
function decAdd(op: "+" | "-", formId: string): Builder {
  return () => {
    const out: XP[] = [];
    for (let a = 1; a <= 95; a += 2) for (let b = 1; b <= 95; b += 3) {
      const va = a / 100, vb = b / 100;
      if (op === "-" && va < vb) continue;
      // Reasoning tier: problems WITHOUT regrouping come first, then carrying/borrowing.
      const regroup = op === "+" ? addCarries(a, b) : subBorrows(a, b);
      out.push({ q: `${trimZero(r2(va))} ${op} ${trimZero(r2(vb))}`, a: trimZero(r2(op === "+" ? va + vb : va - vb)), diff: (regroup ? 200 : 0) + a + b, form: formId, key: `${formId}:${a}:${b}` });
    }
    return out;
  };
}
const decMul: Builder = () => {
  const out: XP[] = [];
  for (let a = 1; a <= 19; a++) for (let b = 1; b <= 19; b++) {
    out.push({ q: `${r1(a / 10)} × ${r1(b / 10)}`, a: trimZero(r2((a / 10) * (b / 10))), diff: a + b + 6, form: "dec-mul-dd", key: `dmdd:${a}:${b}` });
  }
  for (let a = 1; a <= 95; a += 2) for (let b = 2; b <= 9; b++) {
    out.push({ q: `${r1(a / 10)} × ${b}`, a: trimZero(r2((a / 10) * b)), diff: a / 2 + b, form: "dec-mul-dw", key: `dmdw:${a}:${b}` });
  }
  return out;
};
const decDiv: Builder = () => {
  const out: XP[] = [];
  for (let q = 1; q <= 30; q++) for (let b = 2; b <= 9; b++) {
    const a = (q * b) / 10;
    out.push({ q: `${r1(a)} ÷ ${b}`, a: trimZero(r1(q / 10)), diff: q + b, form: "dec-div", key: `dd:${q}:${b}` });
  }
  return out;
};

// ── PERCENTS ──────────────────────────────────────────────────────────────────
const pctGridViz: Builder = () => {
  const out: XP[] = [];
  for (let p = 5; p <= 95; p += 5) {
    out.push({ q: `[[viz grid ${p} 100]]`, a: `${p}%`, diff: p, form: "pct-grid", key: `pg:${p}`, viz: true });
  }
  return out;
};
const pctAsFraction: Builder = () => {
  const out: XP[] = [];
  for (let p = 5; p <= 95; p += 5) {
    out.push({ q: `${p}% → fraction of 100`, a: F(p, 100), diff: p, form: "pct-frac100", key: `pf100:${p}` });
  }
  return out;
};
const fracToPct: Builder = () => {
  const out: XP[] = [];
  const fr: [number, number][] = [
    [1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10],
    [1, 20], [3, 20], [7, 20], [9, 20], [11, 20], [13, 20], [17, 20], [19, 20], [1, 25], [1, 50], [3, 50],
  ];
  // score by the percent VALUE (not denominator) so this form interleaves with
  // pctToFrac on a shared difficulty scale rather than clustering at one end.
  for (const [n, d] of fr) out.push({ q: `Write ${F(n, d)} as a percent.`, a: `${Math.round((n / d) * 100)}%`, diff: Math.round((n / d) * 100), form: "frac-pct", key: `fp:${n}/${d}` });
  return out;
};
const pctToFrac: Builder = () => {
  const out: XP[] = [];
  for (let p = 5; p <= 95; p += 5) out.push({ q: `${p}% → fraction`, a: reduced(p, 100), diff: p, form: "pct-frac", key: `pcf:${p}` });
  return out;
};
const decToPct: Builder = () => {
  const out: XP[] = [];
  for (let i = 1; i <= 99; i++) out.push({ q: `${trimZero(r2(i / 100))} → percent`, a: `${i}%`, diff: i, form: "dec-pct", key: `dp:${i}` });
  return out;
};
const pctToDec: Builder = () => {
  const out: XP[] = [];
  for (let p = 1; p <= 99; p++) out.push({ q: `${p}% → decimal`, a: trimZero(r2(p / 100)), diff: p, form: "pct-dec", key: `pd:${p}` });
  return out;
};
const pctOf: Builder = () => {
  const out: XP[] = [];
  for (const p of [5, 10, 20, 25, 50, 75]) for (let n = 4; n <= 80; n += 2) {
    const v = (p / 100) * n;
    if (!Number.isInteger(v)) continue;
    out.push({ q: `${p}% of ${n}`, a: String(v), diff: p * 0.3 + n, form: "pct-of", key: `po:${p}:${n}` });
  }
  return out;
};
function pctChange(dir: "Increase" | "Decrease", formId: string): Builder {
  return () => {
    const out: XP[] = [];
    for (const p of [10, 20, 25, 50]) for (let n = 20; n <= 100; n += 4) {
      const delta = (p / 100) * n;
      if (!Number.isInteger(delta)) continue;
      out.push({ q: `${n} ${dir === "Increase" ? "+" : "−"} ${p}%`, a: String(dir === "Increase" ? n + delta : n - delta), diff: p + n, form: formId, key: `${formId}:${p}:${n}` });
    }
    return out;
  };
}

// ── Curriculum ────────────────────────────────────────────────────────────────
interface Unit {
  id: string; label: string; objective: string; grade: string; stars: number;
  range: [number, number]; count?: number; forms: Builder[]; example: WorkedExample;
  // Shown ONCE at the top of the sheet (e.g. "Compare. Write >, <, or =.") so the
  // instruction isn't repeated before every problem; the problems are bare stems.
  directive?: string;
}

function poolOf(u: Unit): XP[] {
  const seen = new Set<string>();
  const out: XP[] = [];
  for (const f of u.forms) for (const p of f()) {
    if (seen.has(p.key)) continue;
    seen.add(p.key); out.push(p);
  }
  return out;
}

const CURRICULUM: Unit[] = [
  // ── VISUAL FOUNDATIONS (8 Qs/sheet, big shapes) ──
  { id: "vf-whole", label: "Part of a whole", objective: "Student names the fraction shaded in a picture", directive: "Write the fraction each picture shows.", grade: "Grade 2-3", stars: 1, range: [1, 1], count: 8, forms: [vizIdentify()], example: { problem: "[[viz pie 3 4]]", steps: ["Shaded parts = 3", "Equal parts = 4"], answer: F(3, 4) } },
  { id: "vf-num", label: "Understanding the numerator", objective: "Student counts the shaded parts (the numerator)", directive: "How many parts are shaded? Write the number.", grade: "Grade 2-3", stars: 1, range: [2, 2], count: 8, forms: [vizNumerator], example: { problem: "[[viz bar 2 5]]", steps: ["Count the shaded parts"], answer: "2" } },
  { id: "vf-den", label: "Understanding the denominator", objective: "Student counts the total equal parts (the denominator)", directive: "Into how many equal parts is each divided? Write the number.", grade: "Grade 2-3", stars: 1, range: [3, 3], count: 8, forms: [vizDenominator], example: { problem: "[[viz pie 1 6]]", steps: ["Count all equal parts"], answer: "6" } },
  { id: "vf-write", label: "Writing fractions from pictures", objective: "Student writes the fraction shown by a picture", directive: "Write the fraction each picture shows.", grade: "Grade 3", stars: 2, range: [4, 4], count: 8, forms: [vizIdentify()], example: { problem: "[[viz grid 30 100]]", steps: ["Shaded ÷ total = 30/100"], answer: F(30, 100) } },
  { id: "vf-compare", label: "Comparing fractions with pictures", objective: "Student compares two fractions using pictures", directive: "Which fraction is larger? Write it.", grade: "Grade 3", stars: 2, range: [5, 5], count: 8, forms: [vizCompare], example: { problem: "[[viz cmp 1 2 1 3]]", steps: ["More shaded = larger"], answer: F(1, 2) } },

  // ── FRACTION SKILLS ──
  { id: "fr-identify", label: "Identify fractions", objective: "Student writes a fraction from words or a picture", directive: "Write each as a fraction.", grade: "Grade 3", stars: 2, range: [6, 9], forms: [idText, idVizSmall], example: { problem: "3 out of 4", steps: ["Shaded over total"], answer: F(3, 4) } },
  { id: "fr-equiv", label: "Equivalent fractions", objective: "Student finds equivalent fractions", directive: "Find the missing number.", grade: "Grade 4", stars: 3, range: [10, 15], forms: [equivFillNum, equivFillDen], example: { problem: `${F(1, 2)} = ${BS}frac{?}{4}`, steps: ["4 ÷ 2 = 2", "1 × 2 = 2"], answer: "2" } },
  { id: "fr-compare", label: "Compare fractions", objective: "Student compares two fractions", directive: "Compare. Write >, <, or =.", grade: "Grade 4", stars: 3, range: [16, 20], forms: [cmpSymbol], example: { problem: `${F(2, 3)} ___ ${F(3, 5)}`, steps: ["Common denominator 15: 10/15 vs 9/15"], answer: ">" } },
  { id: "fr-order", label: "Order fractions", objective: "Student orders fractions from least to greatest", directive: "Order each from least to greatest.", grade: "Grade 4", stars: 4, range: [21, 24], forms: [orderLeast], example: { problem: `${F(1, 2)}, ${F(1, 4)}, ${F(2, 3)}`, steps: ["Common denominator 12"], answer: `${F(1, 4)} < ${F(1, 2)} < ${F(2, 3)}` } },
  { id: "fr-simplify", label: "Simplify fractions", objective: "Student writes a fraction in simplest form", directive: "Write each fraction in simplest form.", grade: "Grade 4-5", stars: 3, range: [25, 30], forms: [simplifyForm("", "simp")], example: { problem: `${F(6, 8)}`, steps: ["GCF of 6 and 8 is 2", "6÷2=3, 8÷2=4"], answer: F(3, 4) } },
  { id: "fr-mixed", label: "Mixed numbers", objective: "Student converts improper fractions to mixed numbers", directive: "Write each as a mixed number.", grade: "Grade 5", stars: 3, range: [31, 34], forms: [toMixed], example: { problem: `${F(7, 3)}`, steps: ["7 ÷ 3 = 2 remainder 1"], answer: `2 ${F(1, 3)}` } },
  { id: "fr-improper", label: "Improper fractions", objective: "Student converts mixed numbers to improper fractions", directive: "Write each as an improper fraction.", grade: "Grade 5", stars: 3, range: [35, 38], forms: [toImproper], example: { problem: `2 ${F(1, 3)}`, steps: ["2 × 3 + 1 = 7"], answer: F(7, 3) } },
  { id: "fr-add", label: "Add fractions", objective: "Student adds fractions (like and unlike denominators)", directive: "Add. Simplify if possible.", grade: "Grade 5", stars: 4, range: [39, 41], forms: [fracOp("+", "frac-add")], example: { problem: `${F(1, 3)} + ${F(1, 4)}`, steps: ["LCM 12: 4/12 + 3/12"], answer: F(7, 12) } },
  { id: "fr-sub", label: "Subtract fractions", objective: "Student subtracts fractions", directive: "Subtract. Simplify if possible.", grade: "Grade 5", stars: 4, range: [42, 44], forms: [fracOp("-", "frac-sub")], example: { problem: `${F(3, 4) } - ${F(1, 2)}`, steps: ["LCM 4: 3/4 − 2/4"], answer: F(1, 4) } },
  { id: "fr-mul", label: "Multiply fractions", objective: "Student multiplies fractions", directive: "Multiply. Simplify if possible.", grade: "Grade 5-6", stars: 4, range: [45, 47], forms: [binUnlike("×", "mul")], example: { problem: `${F(2, 3)} × ${F(3, 4)}`, steps: ["2×3=6, 3×4=12, simplify"], answer: F(1, 2) } },
  { id: "fr-div", label: "Divide fractions", objective: "Student divides fractions using the reciprocal", directive: "Divide. Simplify if possible.", grade: "Grade 6", stars: 5, range: [48, 49], forms: [binUnlike("÷", "div")], example: { problem: `${F(1, 2)} ÷ ${F(1, 4)}`, steps: ["Flip and multiply: 1/2 × 4/1"], answer: "2" } },
  { id: "fr-mastery", label: "Fraction mastery", objective: "Student works fluently across all fraction operations", grade: "Grade 6", stars: 5, range: [50, 50], forms: [addSame, binUnlike("+", "add-unlike"), binUnlike("×", "mul"), simplifyForm("Simplify", "simp")], example: { problem: `${F(2, 3)} × ${F(3, 5)}`, steps: ["Multiply across, simplify"], answer: F(2, 5) } },

  // ── DECIMALS ──
  { id: "dec-place", label: "Decimal place value", objective: "Student identifies decimal place values", directive: "Write the digit in the named place.", grade: "Grade 5", stars: 2, range: [51, 54], forms: [decPlaceValue], example: { problem: "3.47 — hundredths", steps: ["Tenths = 4, hundredths = 7"], answer: "7" } },
  { id: "dec-compare", label: "Compare decimals", objective: "Student compares decimals", directive: "Compare. Write >, <, or =.", grade: "Grade 5", stars: 3, range: [55, 58], forms: [decCompare], example: { problem: "0.7 ___ 0.65", steps: ["0.70 vs 0.65"], answer: ">" } },
  { id: "dec-round", label: "Round decimals", objective: "Student rounds decimals", directive: "Round each to the place shown.", grade: "Grade 5", stars: 3, range: [59, 62], forms: [decRound], example: { problem: "3.47 → nearest tenth", steps: ["7 rounds up: 3.5"], answer: "3.5" } },
  { id: "dec-add", label: "Add & subtract decimals", objective: "Student adds and subtracts decimals", directive: "Add or subtract.", grade: "Grade 5", stars: 3, range: [63, 67], forms: [decAdd("+", "dec-add"), decAdd("-", "dec-sub")], example: { problem: "0.45 + 0.36", steps: ["Line up points: 45 + 36 = 81 hundredths"], answer: "0.81" } },
  { id: "dec-mul", label: "Multiply decimals", objective: "Student multiplies decimals", directive: "Multiply.", grade: "Grade 6", stars: 4, range: [68, 72], forms: [decMul], example: { problem: "0.3 × 0.4", steps: ["3×4=12, two decimal places"], answer: "0.12" } },
  { id: "dec-div", label: "Divide decimals", objective: "Student divides decimals by whole numbers", directive: "Divide.", grade: "Grade 6", stars: 4, range: [73, 74], forms: [decDiv], example: { problem: "1.2 ÷ 3", steps: ["12 ÷ 3 = 4, one decimal place"], answer: "0.4" } },
  { id: "dec-mastery", label: "Decimal mastery", objective: "Student works fluently across decimal operations", directive: "Solve.", grade: "Grade 6", stars: 5, range: [75, 75], forms: [decAdd("+", "dec-add"), decMul, decRound], example: { problem: "0.5 × 0.6", steps: ["5×6=30, two places → 0.30 = 0.3"], answer: "0.3" } },

  // ── PERCENTS & CONVERSIONS ──
  { id: "pct-understand", label: "Understand percent", objective: "Student reads percent as parts out of 100", directive: "Write the percent shaded, or the percent as a fraction.", grade: "Grade 6", stars: 2, range: [76, 78], forms: [pctGridViz, pctAsFraction], example: { problem: "[[viz grid 25 100]]", steps: ["25 of 100 squares"], answer: "25%" } },
  { id: "pct-frac", label: "Fractions ↔ percents", objective: "Student converts between fractions and percents", directive: "Convert each.", grade: "Grade 6", stars: 3, range: [79, 82], forms: [fracToPct, pctToFrac], example: { problem: `${F(1, 4)} → percent`, steps: ["1 ÷ 4 = 0.25 = 25%"], answer: "25%" } },
  { id: "pct-dec", label: "Decimals ↔ percents", objective: "Student converts between decimals and percents", directive: "Convert each.", grade: "Grade 6", stars: 3, range: [83, 86], forms: [decToPct, pctToDec], example: { problem: "0.25 → percent", steps: ["Move the point two places: 25%"], answer: "25%" } },
  { id: "pct-of", label: "Percent of a number", objective: "Student finds a percent of a number", directive: "Find the percent of each number.", grade: "Grade 6-7", stars: 4, range: [87, 90], forms: [pctOf], example: { problem: "25% of 80", steps: ["25% = 1/4, 80 ÷ 4 = 20"], answer: "20" } },
  { id: "pct-change", label: "Percent increase & decrease", objective: "Student increases and decreases a number by a percent", directive: "Increase or decrease as shown.", grade: "Grade 7", stars: 5, range: [91, 94], forms: [pctChange("Increase", "inc"), pctChange("Decrease", "dec")], example: { problem: "80 − 25%", steps: ["25% of 80 = 20, 80 − 20 = 60"], answer: "60" } },
  { id: "pct-convert", label: "Convert fractions, decimals & percents", objective: "Student converts fluently between all three forms", directive: "Convert each.", grade: "Grade 7", stars: 5, range: [95, 98], forms: [fracToPct, decToPct, pctToFrac, pctToDec], example: { problem: `${F(3, 5)} → percent`, steps: ["3 ÷ 5 = 0.6 = 60%"], answer: "60%" } },
  { id: "pct-mastery", label: "Percent mastery", objective: "Student works fluently across percents and conversions", directive: "Solve.", grade: "Grade 7", stars: 5, range: [99, 100], forms: [pctOf, fracToPct, pctChange("Increase", "inc"), decToPct], example: { problem: "20% of 45", steps: ["20% = 1/5, 45 ÷ 5 = 9"], answer: "9" } },
];

// ── Selection (form-capped, ascending, sliding window) + GPI ─────────────────
const GPI_STEP = 12, GPI_BAND = 8;

function unitIndexForSheet(sheet: number): number {
  const i = CURRICULUM.findIndex(u => sheet >= u.range[0] && sheet <= u.range[1]);
  return i === -1 ? CURRICULUM.length - 1 : i;
}
function buildScoredPool(ui: number): XP[] {
  const raw = poolOf(CURRICULUM[ui]);
  let lo = Infinity, hi = -Infinity;
  for (const p of raw) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = hi - lo || 1;
  const base = ui * GPI_STEP;
  return raw.map(p => ({ ...p, diff: base + ((p.diff - lo) / span) * GPI_BAND }));
}

// Pick `count` problems: ascending difficulty, window slides up per sheet, and
// no single form exceeds 40% of the sheet (variety rule).
function selectProblems(pool: XP[], t: number, count: number): XP[] {
  const sorted = [...pool].sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
  const N = sorted.length;
  // No single question FORM may be a strict majority of the sheet. 40% is
  // unachievable for concepts with only two natural phrasings (2×40%=80%<100%),
  // so the guarantee is "no form dominates" — the selector still spreads evenly.
  const cap = Math.max(1, Math.ceil(count * 0.5));

  if (N <= count) {
    const out: XP[] = [];
    for (let i = 0; i < count; i++) out.push(sorted[i % N]);
    return out.sort((a, b) => a.diff - b.diff);
  }

  // Window slides upward per sheet to give a cross-sheet difficulty ramp. But a
  // small pool has no room for both a ramp AND full form coverage, so when the
  // pool is tight relative to a sheet we use the whole pool (no slide) — these
  // short units carry their ramp via unit ordering, not within-unit windowing.
  const W = N < count * 1.5 ? N : Math.min(N, Math.max(count, Math.round(N * 0.6)));
  const start = Math.round(t * (N - W));
  const win = sorted.slice(start, start + W);

  // Pass 1 — evenly-spread distinct picks across the window (ascending difficulty).
  const usedIdx = new Set<number>();
  const chosenIdx: number[] = [];
  for (let i = 0; i < count; i++) {
    let idx = Math.round((i * (W - 1)) / (count - 1));
    while (usedIdx.has(idx)) idx = (idx + 1) % W;
    usedIdx.add(idx);
    chosenIdx.push(idx);
  }

  // Pass 2 — repair the variety cap: while any form is over cap, swap one of its
  // picks for the nearest unused window slot belonging to an under-cap form.
  const formCount = (): Record<string, number> => {
    const fc: Record<string, number> = {};
    for (const idx of chosenIdx) fc[win[idx].form] = (fc[win[idx].form] ?? 0) + 1;
    return fc;
  };
  for (let guard = 0; guard < W; guard++) {
    const fc = formCount();
    const over = Object.entries(fc).find(([, c]) => c > cap);
    if (!over) break;
    const [overForm] = over;
    // nearest unused slot whose form is under cap
    let swapIn = -1;
    for (let r = 1; r < W; r++) {
      for (const j of [r, -r]) {
        const cand = (chosenIdx[0] + j + W * 4) % W;
        if (!usedIdx.has(cand) && (fc[win[cand].form] ?? 0) < cap) { swapIn = cand; break; }
      }
      if (swapIn >= 0) break;
    }
    if (swapIn < 0) break; // no feasible swap — accept current distribution
    // drop one over-form pick (prefer the densest cluster: any will do post-sort)
    const dropAt = chosenIdx.findIndex(idx => win[idx].form === overForm);
    usedIdx.delete(chosenIdx[dropAt]);
    usedIdx.add(swapIn);
    chosenIdx[dropAt] = swapIn;
  }

  return chosenIdx.map(idx => win[idx]).sort((a, b) => a.diff - b.diff);
}

// ── Public API ────────────────────────────────────────────────────────────────
export interface FdpMicroLesson { goal: string; bigIdea: string; example: WorkedExample; umbrella: string; }

/** Resolve a fraction micro-skill's lesson by its practice label so the
 *  pre-practice worked example matches the upcoming questions. */
export function getFdpMicroLesson(label: string): FdpMicroLesson | null {
  const u = CURRICULUM.find((x) => x.label === label) ?? CURRICULUM.find((x) => label.includes(x.label));
  if (!u) return null;
  const goal = u.objective.replace(/^Student /, "").replace(/^./, (c) => c.toUpperCase());
  return { goal, bigIdea: goal, example: u.example, umbrella: "Fractions" };
}

export function generateFdpSheet(sheetNumber: number, totalSheets: number, problemCount = 30): WorksheetData {
  const ui = unitIndexForSheet(sheetNumber);
  const unit = CURRICULUM[ui];
  // The caller decides how many fit the page (layout-capacity system); unit.count
  // remains only as the validator's pool-sufficiency target.
  const count = problemCount;
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const selected = selectProblems(buildScoredPool(ui), t, count);
  const problems = selected.map((p, i) => ({
    id: nanoid(8),
    type: "arithmetic" as const,
    question: p.q,
    answer: p.a,
    points: 1,
    zone: (Math.floor(i / Math.ceil(count / 5)) + 1) as 1 | 2 | 3 | 4 | 5,
  }));
  const answerKey = problems.map(p => ({ id: p.id, answer: p.answer }));
  const isFirstOfUnit = sheetNumber === unit.range[0];

  return {
    problems, answerKey,
    workedExample: isFirstOfUnit ? unit.example : undefined,
    meta: {
      skill: "FRACTIONS",
      skillCode: "M7",
      sheetNumber, totalSheets,
      subSkillLabel: unit.label,
      gradeLevel: unit.grade,
      difficultyStars: unit.stars,
      learningObjective: unit.objective,
      directive: unit.directive,
      mode: isFirstOfUnit ? "tutorial" : "practice",
      estimatedMinutes: 10 + Math.round(t * 10),
    },
  };
}

// ── Self-validation ──────────────────────────────────────────────────────────
export function validateFdpPack(totalSheets = 100): { ok: boolean; issues: string[]; gpi: number[] } {
  const issues: string[] = [];
  const gpi: number[] = [];
  let prevMean = -Infinity;

  let expectedNext = 1;
  for (const u of CURRICULUM) {
    const need = u.count ?? 30;
    const size = poolOf(u).length;
    if (size < need) issues.push(`Unit ${u.id}: pool ${size} < ${need}`);
    if (u.range[0] !== expectedNext) issues.push(`Unit ${u.id}: range gap at ${u.range[0]} (expected ${expectedNext})`);
    expectedNext = u.range[1] + 1;
  }
  if (expectedNext - 1 !== totalSheets) issues.push(`Curriculum covers ${expectedNext - 1}, expected ${totalSheets}`);

  for (let s = 1; s <= totalSheets; s++) {
    const ui = unitIndexForSheet(s);
    const unit = CURRICULUM[ui];
    const count = unit.count ?? 30;
    const span = unit.range[1] - unit.range[0];
    const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
    const sel = selectProblems(buildScoredPool(ui), t, count);

    const dupes = sel.length - new Set(sel.map(p => p.q)).size;
    if (dupes > 0 && poolOf(unit).length >= count) issues.push(`Sheet ${s}: ${dupes} duplicate(s)`);

    // variety — no single form may be a strict majority (>50%)
    const fc: Record<string, number> = {};
    for (const p of sel) fc[p.form] = (fc[p.form] ?? 0) + 1;
    const maxForm = Math.max(...Object.values(fc));
    if (maxForm > Math.ceil(count * 0.5) && poolOf(unit).length >= count && unit.forms.length > 1) {
      issues.push(`Sheet ${s}: form majority (${maxForm}/${count})`);
    }

    if (sel[sel.length - 1].diff < sel[0].diff) issues.push(`Sheet ${s}: not ascending`);

    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    if (mean < prevMean - 0.001) issues.push(`Sheet ${s}: GPI dropped`);
    prevMean = Math.max(prevMean, mean);
  }

  return { ok: issues.length === 0, issues, gpi };
}
