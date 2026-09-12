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

// `band` (default 0) marks items whose SHAPE the unit's worked example does not
// teach on day one (the reverse direction, a second method, a bigger product).
// A unit's OPENING sheet draws only band-0 items, so the first day is the
// taught form; banded items also carry a difficulty bump so they arrive on the
// later sheets in order. See selectProblems / poolForSheet.
interface XP { q: string; a: string; diff: number; form: string; key: string; viz?: boolean; band?: number; }

// ── Form builders ─────────────────────────────────────────────────────────────
// Each returns the FULL enumerated set of problems for that form; difficulty is
// the raw structural score (normalized later). Keys dedupe; forms drive variety.

type Builder = () => XP[];

// fractions n/d with 1<=n<d for a denominator pool
function* fracPairs(denoms: readonly number[]): Generator<[number, number]> {
  for (const d of denoms) for (let n = 1; n < d; n++) yield [n, d];
}

// ── VISUAL FOUNDATIONS ────────────────────────────────────────────────────────
// A varied set so successive picture-fraction problems don't all look the same:
// circle, strip, vertical strip, pentagon, hexagon, triangle, and grid.
const vizShapes = ["pie", "bar", "vbar", "penta", "hexa", "tri", "grid"] as const;
// Visual forms carry NO prose — the picture is the question; the sheet's section
// directive ("Write the fraction each picture shows.") supplies the instruction.
// `shapes` narrows the picture set: lesson 1 ("Part of a whole") uses only the
// single shapes so that grids are new when lesson 4 introduces them.
const singleShapes = vizShapes.filter((s) => s !== "grid");
// `denoms` narrows the bottom numbers: lesson 1 stays on halves → sixths so
// the pack's first four sheets climb (small shapes → count one number on
// bigger shapes → count a grid) instead of sheet 4 repeating sheet 1.
// `twoShapes` shows every fraction on TWO different shapes (a 3/4 pie and a
// 3/4 strip) — the narrowed lesson-1 set has only 15 fractions, and the daily
// 30-item sheet must not repeat a picture; seeing one fraction on two shapes
// is also the point of the lesson (the fraction is not tied to the shape).
function vizIdentify(_prompt?: string, shapes: readonly string[] = vizShapes, denoms: readonly number[] = DENOMS, twoShapes = false): Builder {
  return () => {
    const out: XP[] = [];
    for (const [n, d] of fracPairs(denoms)) {
      const shape = shapes[(n + d) % shapes.length];
      out.push({ q: `[[viz ${shape} ${n} ${d}]]`, a: F(n, d), diff: d * 2 + n, form: `vid-${shape}`, key: `vid:${shape}:${n}/${d}` });
      if (twoShapes) {
        const alt = shapes[(n + d + 3) % shapes.length];
        if (alt !== shape) out.push({ q: `[[viz ${alt} ${n} ${d}]]`, a: F(n, d), diff: d * 2 + n + 0.5, form: `vid-${alt}`, key: `vid:${alt}:${n}/${d}` });
      }
    }
    return out;
  };
}
// Lesson 4 ("Writing fractions from pictures") is the step up from lesson 1's
// single shapes: a rectangular ARRAY of squares where the child must count
// the squares to find the bottom number (rows × columns) before writing the
// fraction. Denominators are chosen so every grid is a clean rectangle
// (2×2, 3×2, 3×3, 4×3, 4×4, 5×4) and none of them repeats a lesson-1 picture.
const GRID_DENOMS = [4, 6, 9, 12, 16, 20];
const vizGridArray: Builder = () => {
  const out: XP[] = [];
  for (const [n, d] of fracPairs(GRID_DENOMS)) {
    out.push({ q: `[[viz grid ${n} ${d}]]`, a: F(n, d), diff: d * 2 + n, form: "vid-grid-array", key: `vga:${n}/${d}` });
  }
  return out;
};
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
// Fraction NAMES in words ("three quarters", "seven tenths") — the growth step
// of the Identify unit: "n out of d" and pictures open the unit (band 0), the
// word names arrive on the later sheets so four sheets are not one sheet
// printed four times.
const NUM_WORDS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
const DEN_WORDS: Record<number, [string, string]> = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"], 5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 8: ["eighth", "eighths"], 10: ["tenth", "tenths"], 12: ["twelfth", "twelfths"] };
const idWords: Builder = () => {
  const out: XP[] = [];
  for (const [n, d] of fracPairs(DENOMS)) {
    const w = DEN_WORDS[d];
    if (!w) continue;
    out.push({ q: `${NUM_WORDS[n]} ${n === 1 ? w[0] : w[1]}`, a: F(n, d), diff: d * 2 + n + 24, form: "id-words", key: `idw:${n}/${d}`, band: 1 });
  }
  return out;
};

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
    // The ?-on-the-bottom direction is the example's further step, not its
    // main case: off the opening sheet so day one is pictures + missing top.
    out.push({ q: `${F(n, d)} = ${BS}frac{${n * k}}{?}`, a: String(d * k), diff: d * k, form: "eq-den", key: `eqd:${n}/${d}:${k}`, band: 1 });
  }
  return out;
};
// Picture-backed equivalence — the bridge from "name the fraction in the
// picture" (the day before) to the bare-number rule. Two bars shade the SAME
// amount; the child reads the missing number off the second bar. Lowest
// difficulty in the unit so these open sheet 10 before the bare symbols.
const equivViz: Builder = () => {
  const out: XP[] = [];
  for (const [n, d] of fracPairs([2, 3, 4, 5, 6])) for (const k of [2, 3, 4]) {
    if (d * k > 12) continue;
    out.push({ q: `[[viz cmp ${n} ${d} ${n * k} ${d * k}]] ${F(n, d)} = ${BS}frac{?}{${d * k}}`, a: String(n * k), diff: d * k - 12, form: "eq-viz", key: `eqv:${n}/${d}:${k}`, viz: true });
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
    // Bare stem — the sheet's directive ("Compare. Write >, <, or =.") carries the
    // instruction once at the top, so the per-problem prompt is just the two
    // fractions and the blank (matches this unit's `example`). Repeating the full
    // instruction here overflowed the narrow problem cell and rendered mangled.
    // Tiers 0–1 need no common-denominator search (rewrite ONE fraction at
    // most); tiers 2–3 need a denominator both can reach, which the lesson
    // shows as a further step — so they wait for sheet 17+.
    // fracPairs enumerates same-denominator pairs with n1 < n2, so without a
    // flip every like-denominator item (the whole opening sheet) reads "<".
    // Alternate orientation deterministically so roughly half read ">".
    const flip = (n1 * 3 + n2 * 5 + d1 + d2) % 2 === 1;
    const q = flip ? `${F(n2, d2)} ___ ${F(n1, d1)}` : `${F(n1, d1)} ___ ${F(n2, d2)}`;
    const a = flip ? (sym === ">" ? "<" : sym === "<" ? ">" : "=") : sym;
    out.push({ q, a, diff: tier * 14 + Math.max(d1, d2), form: "cmp-sym", key: `cmps:${n1}/${d1}:${n2}/${d2}`, band: tier >= 2 ? 1 : 0 });
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
// Growth steps for the Order unit (band 1, so sheet 21 stays on the taught
// {2,3,4,6} trios): fifths / eighths / tenths / twelfths the Compare unit
// already used, and four-fraction lists. Each needs a common bottom no bigger
// than 40 so the method (list multiples, rewrite, line up the tops) still fits
// on paper.
const orderTrio = (trio: [number, number][]): { q: string; a: string } | null => {
  const vals = trio.map(([n, d]) => n / d);
  if (new Set(vals).size < trio.length) return null;
  const sorted = trio.map((p, idx) => ({ p, v: vals[idx] })).sort((a, b) => a.v - b.v);
  return { q: trio.map(([n, d]) => F(n, d)).join(", "), a: sorted.map(({ p }) => F(p[0], p[1])).join(" < ") };
};
const orderWide: Builder = () => {
  const out: XP[] = [];
  const ps = [...fracPairs(DENOMS)];
  let i0 = 0;
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) for (let k = j + 1; k < ps.length; k++) {
    const trio: [number, number][] = [ps[i], ps[j], ps[k]];
    const ds = trio.map(([, d]) => d);
    if (new Set(ds).size < 3 || !ds.some((d) => [5, 8, 10, 12].includes(d))) continue;
    const L = ds.reduce((acc, d) => lcm(acc, d), 1);
    if (L > 40) continue;
    if (i0++ % 5 !== 0) continue;                    // thin the enumeration, keep variety
    const t = orderTrio(trio);
    if (!t) continue;
    out.push({ ...t, diff: 60 + L / 2 + ds.reduce((s, d) => s + d, 0), form: "order-wide", key: `ordw:${trio.map((p) => p.join("/")).join(",")}`, band: 1 });
  }
  return out.slice(0, 300);
};
const orderFour: Builder = () => {
  const out: XP[] = [];
  const ps = [...fracPairs([2, 3, 4, 6, 8, 12])];
  let i0 = 0;
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) for (let k = j + 1; k < ps.length; k++) for (let m = k + 1; m < ps.length; m++) {
    const quad: [number, number][] = [ps[i], ps[j], ps[k], ps[m]];
    const ds = quad.map(([, d]) => d);
    if (new Set(ds).size < 4) continue;
    const L = ds.reduce((acc, d) => lcm(acc, d), 1);
    if (L > 24) continue;
    if (i0++ % 7 !== 0) continue;
    const t = orderTrio(quad);
    if (!t) continue;
    out.push({ ...t, diff: 120 + L + ds.reduce((s, d) => s + d, 0), form: "order-four", key: `ord4:${quad.map((p) => p.join("/")).join(",")}`, band: 1 });
  }
  return out.slice(0, 300);
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
  // The fraction part is always already in lowest terms (gcd 1): the day before
  // was "write it in simplest form", and a key of "1 2/4" would either mark a
  // child who writes 1 1/2 wrong or train them to unlearn yesterday. Grading is
  // an exact match on the stored key, so the key must be the only right answer.
  for (const d of [2, 3, 4, 5, 6, 8]) for (let w = 1; w <= 4; w++) for (let n = 1; n < d; n++) {
    if (gcd(n, d) !== 1) continue;
    const imp = w * d + n;
    out.push({ q: `Write ${F(imp, d)} as a mixed number.`, a: `${w} ${F(n, d)}`, diff: d + w * 2, form: "to-mixed", key: `mx:${imp}/${d}` });
  }
  return out;
};
const toImproper: Builder = () => {
  const out: XP[] = [];
  // Same rule as toMixed: only mixed numbers whose fraction part is in lowest
  // terms, so "1 2/4 → 6/4 (not 3/2)" never comes up. The question names the
  // task — a bare "1 1/3" did not say what to do with it.
  for (const d of [2, 3, 4, 5, 6, 8]) for (let w = 1; w <= 4; w++) for (let n = 1; n < d; n++) {
    if (gcd(n, d) !== 1) continue;
    out.push({ q: `Write ${w} ${F(n, d)} as an improper fraction.`, a: F(w * d + n, d), diff: d + w * 2, form: "to-improper", key: `im:${w}_${n}/${d}` });
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
      // For ÷ the jump is the ANSWER's shape: a proper fraction (the worked
      // example) on the opening sheet; quotients of 1 or more (5/2, 4) — which
      // the lesson only mentions — arrive on the unit's second sheet.
      const tier = isAddSub ? ((d1 % d2 === 0 || d2 % d1 === 0) ? 1 : 2) : op === "÷" ? (an >= ad ? 1 : 0) : 0;
      out.push({ q: `${FRAC_VERB[op]} the fractions:  ${F(n1, d1)} ${op} ${F(n2, d2)}`, a: reduced(an, ad), diff: tier * 100 + Math.max(d1, d2) * 2 + (isAddSub ? Math.log2(lcm(d1, d2)) : 0), form: formId, key: `${formId}:${n1}/${d1}:${n2}/${d2}`, band: tier });
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
      // Same bottom: addition keeps ONE of a+b / b+a (commutative); subtraction
      // keeps only a − b with a > b. (The old shared `n2 < n1` skip threw away
      // every like-denominator subtraction, so the Subtract unit had no items of
      // the shape its lesson page teaches.)
      if (d1 === d2 && (op === "+" ? n2 < n1 : n2 >= n1)) continue;
      const L = lcm(d1, d2);
      const an = op === "+" ? n1 * (L / d1) + n2 * (L / d2) : n1 * (L / d1) - n2 * (L / d2);
      if (op === "-" && an <= 0) continue;
      const tier = d1 === d2 ? 0 : (d1 % d2 === 0 || d2 % d1 === 0) ? 1 : 2;
      // band = tier, and the unit is `bandRamp`, so its sheets climb one case
      // per sheet: same bottom (the worked example) → one bottom fits into the
      // other (rewrite one fraction) → neither fits (find a bottom both reach).
      out.push({ q: `${FRAC_VERB[op]} the fractions:  ${F(n1, d1)} ${op} ${F(n2, d2)}`, a: reduced(an, L), diff: tier * 100 + Math.max(d1, d2) * 2 + Math.log2(L), form: formId, key: `${formId}:${n1}/${d1}:${n2}/${d2}`, band: tier });
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
    // Ordered by the hundredths digit first so a sheet sorted by difficulty does
    // not run "0.80, 0.81 … 0.89 → 8" ten times: consecutive items ask for
    // different tenths digits.
    out.push({ q: `${r2(i / 100)} — tenths`, a: String(tenths), diff: (i % 10) * 10 + tenths, form: "pv-tenths", key: `pvt:${i}` });
  }
  void places;
  return out;
};
const decCompare: Builder = () => {
  const out: XP[] = [];
  // The smaller value used to sit on the left every time, so every answer was
  // "<" and a child could clear the unit without reading a number. Orientation
  // now alternates deterministically (about half ">"), and 0.5 ___ 0.50 pairs
  // give the "=" outcome the lesson shows.
  for (let a = 1; a <= 99; a++) for (let b = a + 1; b <= 99; b += 7) {
    const va = a / 100, vb = b / 100;
    const flip = (a * 7 + b) % 2 === 1;
    const [l, r] = flip ? [vb, va] : [va, vb];
    out.push({ q: `${trimZero(r2(l))} ___ ${trimZero(r2(r))}`, a: l > r ? ">" : "<", diff: Math.max(a, b), form: "dec-cmp", key: `dc:${a}:${b}` });
  }
  for (let a = 10; a <= 90; a += 10) {
    const short = r1(a / 100), long = r2(a / 100);
    const flip = (a / 10) % 2 === 0;
    out.push({ q: flip ? `${long} ___ ${short}` : `${short} ___ ${long}`, a: "=", diff: a, form: "dec-cmp", key: `dceq:${a}` });
  }
  return out;
};
const decRound: Builder = () => {
  const out: XP[] = [];
  for (let i = 5; i <= 995; i += 1) {
    if (i % 7 !== 0) continue;
    const v = i / 100;
    // Key keeps the tenths place ("6.0", not "6") so it reads as a tenth; the
    // grader is numeric, so a child who writes 6 is also right.
    out.push({ q: `${r2(v)} → nearest tenth`, a: (Math.round(v * 10) / 10).toFixed(1), diff: i / 10, form: "round-t", key: `rt:${i}` });
  }
  // Nearest WHOLE is a second shape (the tenths digit decides): held off the
  // opening sheet and ranked above every nearest-tenth item so it arrives on
  // sheet 60+ after the example's "later sheets" step.
  for (let i = 5; i <= 99; i++) {
    const v = i / 10;
    out.push({ q: `${r1(v)} → nearest whole`, a: String(Math.round(v)), diff: 100 + i, form: "round-w", key: `rw:${i}`, band: 1 });
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
      // A whole tenth prints short (0.4, not 0.40): the child must pad it to
      // 0.40 before adding — the single most common decimal error, and a
      // second shape the example teaches as a further step. Off the opening
      // sheet; ranked between the no-regroup and regroup tiers.
      const mixedLen = a % 10 === 0 || b % 10 === 0;
      out.push({ q: `${trimZero(r2(va))} ${op} ${trimZero(r2(vb))}`, a: trimZero(r2(op === "+" ? va + vb : va - vb)), diff: (regroup ? 200 : 0) + (mixedLen ? 100 : 0) + a + b, form: formId, key: `${formId}:${a}:${b}`, band: mixedLen ? 1 : 0 });
    }
    return out;
  };
}
const decMul: Builder = () => {
  const out: XP[] = [];
  // Opening sheet: single-digit products only (0.5 × 3, 0.9 × 0.2) — the
  // rule "count the places" is the whole lesson, so the whole-number product
  // must be a known fact. Two-digit factors (1.9 × 7, 1.2 × 1.2) are band 1.
  for (let a = 1; a <= 19; a++) for (let b = 1; b <= 19; b++) {
    const big = a > 9 || b > 9;
    out.push({ q: `${r1(a / 10)} × ${r1(b / 10)}`, a: trimZero(r2((a / 10) * (b / 10))), diff: (big ? 30 : 0) + a + b + 6, form: "dec-mul-dd", key: `dmdd:${a}:${b}`, band: big ? 1 : 0 });
  }
  for (let a = 1; a <= 95; a += 2) for (let b = 2; b <= 9; b++) {
    const big = a > 9;
    out.push({ q: `${r1(a / 10)} × ${b}`, a: trimZero(r2((a / 10) * b)), diff: (big ? 30 : 0) + a / 2 + b, form: "dec-mul-dw", key: `dmdw:${a}:${b}`, band: big ? 1 : 0 });
  }
  return out;
};
const decDiv: Builder = () => {
  const out: XP[] = [];
  for (let q = 1; q <= 30; q++) for (let b = 2; b <= 9; b++) {
    const a = (q * b) / 10;
    // Dividends of 10.0 and up mean a three-digit whole-number division
    // (104 ÷ 8) — beyond the two-digit work of M6, so off the opening sheet.
    const big = a >= 10;
    out.push({ q: `${r1(a)} ÷ ${b}`, a: trimZero(r1(q / 10)), diff: (big ? 40 : 0) + q + b, form: "dec-div", key: `dd:${q}:${b}`, band: big ? 1 : 0 });
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
  // +0.5 so each percent → decimal item sorts right AFTER the decimal → percent
  // item of the same value: the two directions interleave on every sheet
  // instead of the reverse direction opening the unit eleven items in a row.
  for (let p = 1; p <= 99; p++) out.push({ q: `${p}% → decimal`, a: trimZero(r2(p / 100)), diff: p + 0.5, form: "pct-dec", key: `pd:${p}` });
  return out;
};
const pctOf: Builder = () => {
  const out: XP[] = [];
  for (const p of [5, 10, 20, 25, 50, 75]) for (let n = 4; n <= 80; n += 2) {
    const v = (p / 100) * n;
    if (!Number.isInteger(v)) continue;
    // Opening sheet: the unit-fraction percents the example teaches directly
    // (50% = 1/2, 25% = 1/4, 10% = 1/10 → divide once). 75% (divide, then × 3),
    // 20% and 5% follow on sheet 88+.
    const later = p === 75 || p === 20 || p === 5;
    out.push({ q: `${p}% of ${n}`, a: String(v), diff: (later ? 100 : 0) + p * 0.3 + n, form: "pct-of", key: `po:${p}:${n}`, band: later ? 1 : 0 });
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

// ── Mastery groups ────────────────────────────────────────────────────────────
// The Fraction mastery finale draws from EVERY fraction unit. Each group is one
// earlier unit's builder(s) re-tagged with its own form id (so the round-robin
// sampler can take a fixed share from each), a difficulty offset that sorts the
// printed sheet in curriculum order. Stems stay EXACTLY as their home unit
// prints them (a "?" to fill, a "___" to compare, a list to order): the
// lesson-page step builder recognises the bare shapes, and a prefix such as
// "Find the missing number: \frac…" made it fall back to simplify-steps. The
// mastery sheet's directive names those three tasks once, at the top.
function masteryGroup(form: string, order: number, builders: Builder[]): Builder {
  return () => {
    const out: XP[] = [];
    for (const b of builders) for (const p of b()) {
      out.push({ ...p, form, key: `${form}:${p.key}`, diff: order * 1000 + p.diff, band: 0 });
    }
    return out;
  };
}
const MASTERY_FORMS: Builder[] = [
  masteryGroup("m-equiv", 0, [equivFillNum, equivFillDen]),
  masteryGroup("m-cmp", 1, [cmpSymbol]),
  masteryGroup("m-order", 2, [orderLeast]),
  masteryGroup("m-simp", 3, [simplifyForm("", "simp")]),
  masteryGroup("m-mixed", 4, [toMixed, toImproper]),
  masteryGroup("m-add", 5, [fracOp("+", "frac-add")]),
  masteryGroup("m-sub", 6, [fracOp("-", "frac-sub")]),
  masteryGroup("m-mul", 7, [binUnlike("×", "mul")]),
  masteryGroup("m-div", 8, [binUnlike("÷", "div")]),
];

// ── Curriculum ────────────────────────────────────────────────────────────────
interface Unit {
  id: string; label: string; objective: string; grade: string; stars: number;
  range: [number, number]; count?: number; forms: Builder[]; example: WorkedExample;
  // Sheets climb one BAND per sheet (band 0 on the opening sheet, band 1 on the
  // next …) instead of a sliding window over the whole pool — for units whose
  // bands are distinct METHODS (like → related → unrelated denominators) that
  // must not share a sheet before each has had its own.
  bandRamp?: boolean;
  // Round-robin sampling: an equal share of items from every form, each share
  // spread across that form's difficulty — for the mastery finales, so every
  // earlier unit is represented on the one sheet.
  sampler?: "round-robin";
  // The one idea the lesson turns on, in a child's words. Falls back to the
  // goal when absent (the older units); every unit touched by the transition
  // audit carries a real one.
  bigIdea?: string;
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
  { id: "vf-whole", label: "Part of a whole", objective: "Student names the fraction shaded in a picture", bigIdea: "The bottom number counts the equal parts the whole is cut into; the top number counts the shaded ones", directive: "Write the fraction each picture shows.", grade: "Grade 2-3", stars: 1, range: [1, 1], count: 8, forms: [vizIdentify(undefined, singleShapes, [2, 3, 4, 5, 6], true)], example: { problem: "[[viz pie 3 4]]", steps: ["Count ALL the equal parts, shaded or not: 4 — that is the bottom number", "Count only the shaded parts: 3 — that is the top number", "Write shaded over total: 3/4 (say it 'three quarters' or 'three out of four')"], answer: F(3, 4) } },
  { id: "vf-num", label: "Understanding the numerator", objective: "Student counts the shaded parts (the numerator)", bigIdea: "The top number (the numerator) tells how many parts are shaded — count only the coloured pieces", directive: "How many parts are shaded? Write the number.", grade: "Grade 2-3", stars: 1, range: [2, 2], count: 8, forms: [vizNumerator], example: { problem: "[[viz bar 2 5]]", steps: ["The strip is cut into 5 equal parts, but this question asks only about the SHADED ones", "Count the coloured parts one by one: 1, 2", "So the numerator (top number) of this fraction is 2 — the picture shows 2/5"], answer: "2" } },
  { id: "vf-den", label: "Understanding the denominator", objective: "Student counts the total equal parts (the denominator)", bigIdea: "The bottom number (the denominator) tells how many equal parts the whole is cut into — count every piece, shaded or not", directive: "Into how many equal parts is each divided? Write the number.", grade: "Grade 2-3", stars: 1, range: [3, 3], count: 8, forms: [vizDenominator], example: { problem: "[[viz pie 1 6]]", steps: ["This question asks about ALL the parts, not just the shaded one", "Count every slice, shaded and unshaded: 1, 2, 3, 4, 5, 6", "So the denominator (bottom number) is 6 — the picture shows 1/6"], answer: "6" } },
  { id: "vf-write", label: "Writing fractions from pictures", objective: "Student writes the fraction shown by a picture", bigIdea: "In a grid of squares the bottom number is not given — count the rows and columns to find how many equal squares there are, then count the shaded ones", directive: "Write the fraction each picture shows.", grade: "Grade 3", stars: 2, range: [4, 4], count: 8, forms: [vizGridArray], example: { problem: "[[viz grid 5 12]]", steps: ["Find the bottom number first: the grid has 4 squares across and 3 down, 4 × 3 = 12 equal squares (or count them one by one)", "Now count the shaded squares for the top number: 5", "Write shaded over total: 5/12"], answer: F(5, 12) } },
  { id: "vf-compare", label: "Comparing fractions with pictures", objective: "Student compares two fractions using pictures", bigIdea: "When two strips are the same length, the one with more of it shaded shows the larger fraction — look at the shaded LENGTH, not the number of pieces", directive: "Which fraction is larger? Write it.", grade: "Grade 3", stars: 2, range: [5, 5], count: 8, forms: [vizCompare], example: { problem: "[[viz cmp 1 2 1 3]]", steps: ["Both strips are the same length, so they are the same whole", "Top strip: 1 of 2 parts shaded — half the strip. Bottom strip: 1 of 3 parts shaded — less than half", "More of the strip is shaded on top, so 1/2 is larger. Write the fraction, not the picture"], answer: F(1, 2) } },

  // ── FRACTION SKILLS ──
  { id: "fr-identify", label: "Identify fractions", objective: "Student writes a fraction from words or a picture", directive: "Write each as a fraction.", grade: "Grade 3", stars: 2, range: [6, 9], bigIdea: "Words and pictures name the same fraction: the part you have goes on top, the number of equal parts in the whole goes on the bottom", forms: [idText, idVizSmall, idWords], example: { problem: "3 out of 4", steps: ["'Out of 4' tells you the whole is cut into 4 equal parts — that is the bottom number", "'3' is how many of those parts you have — that is the top number", "Write it as part over whole: 3/4. A picture with 3 of 4 parts shaded is written the same way", "Later sheets — the fraction's NAME: 'three quarters' means 3 of the 4 equal parts, so write 3/4; 'seven tenths' is 7/10 (halves → 2, thirds → 3, quarters → 4, fifths → 5, sixths → 6, eighths → 8, tenths → 10, twelfths → 12)"], answer: F(3, 4) } },
  { id: "fr-equiv", label: "Equivalent fractions", objective: "Student finds equivalent fractions", bigIdea: "Two fractions can name the SAME amount: cut every part into smaller equal pieces and the picture does not change", directive: "Find the missing number.", grade: "Grade 4", stars: 3, range: [10, 15], forms: [equivViz, equivFillNum, equivFillDen], example: { problem: `[[viz cmp 2 3 8 12]] ${F(2, 3)} = ${BS}frac{?}{12}`, steps: ["Look at the two bars: 2 of 3 and 8 of 12 shade the SAME amount — they are equivalent", "Bottom: 3 became 12, that is × 4", "Do the same on top: 2 × 4 = 8", "If the ? is on the bottom (1/2 = 2/?): top 1 became 2, that is × 2, so bottom 2 × 2 = 4"], answer: "8" } },
  { id: "fr-compare", label: "Compare fractions", objective: "Student compares two fractions", bigIdea: "You can only compare tops when the bottoms are the same — so first make the bottoms the same", directive: "Compare. Write >, <, or =.", grade: "Grade 4", stars: 3, range: [16, 20], forms: [cmpSymbol], example: { problem: `${F(3, 4)} ___ ${F(5, 8)}`, steps: ["Same bottoms already (2/6 and 5/6)? Just compare the tops: 2 < 5, so 2/6 < 5/6", "Here the bottoms differ, but 8 is 4 × 2 — so rewrite 3/4 in eighths: 3/4 = 6/8", "Now the bottoms match: 6 > 5, so 3/4 > 5/8", "If the tops come out equal (1/2 = 3/6, and 3/6 is 3/6) write =", "Later sheets — neither bottom fits into the other (2/3 vs 3/5): multiply the bottoms, 3 × 5 = 15, then 2/3 = 10/15 and 3/5 = 9/15, so 2/3 > 3/5"], answer: ">" } },
  { id: "fr-order", label: "Order fractions", objective: "Student orders fractions from least to greatest", bigIdea: "Give every fraction the same bottom, then line up the tops from smallest to biggest", directive: "Order each from least to greatest.", grade: "Grade 4", stars: 4, range: [21, 24], forms: [orderLeast, orderWide, orderFour], example: { problem: `${F(1, 2)}, ${F(1, 4)}, ${F(2, 3)}`, steps: ["Find a bottom that 2, 4 and 3 all fit into — list multiples of 4: 4, 8, 12 … 12 works for all three", "Rewrite each: 1/2 = 6/12, 1/4 = 3/12, 2/3 = 8/12", "Smallest top first: 3/12 < 6/12 < 8/12", "Write them back in their original form: 1/4 < 1/2 < 2/3", "Later sheets — fifths, eighths, tenths and twelfths, and lists of FOUR fractions: same method, one shared bottom for all of them (2/5, 1/2, 3/10 → tenths: 4/10, 5/10, 3/10 → 3/10 < 2/5 < 1/2)"], answer: `${F(1, 4)} < ${F(1, 2)} < ${F(2, 3)}` } },
  { id: "fr-simplify", label: "Simplify fractions", objective: "Student writes a fraction in simplest form", bigIdea: "Dividing the top and bottom by the SAME number keeps the fraction's value — it is simplest when only 1 divides both", directive: "Write each fraction in simplest form.", grade: "Grade 4-5", stars: 3, range: [25, 30], forms: [simplifyForm("", "simp")], example: { problem: `${F(4, 8)}`, steps: ["Find the biggest number that divides EVENLY into both 4 and 8 — it's 4", "Divide both by it: 4 ÷ 4 = 1 and 8 ÷ 4 = 2", "Check: nothing bigger than 1 divides both 1 and 2, so 1/2 is the simplest form"], answer: F(1, 2) } },
  { id: "fr-mixed", label: "Mixed numbers", objective: "Student converts improper fractions to mixed numbers", directive: "Write each as a mixed number.", grade: "Grade 5", stars: 3, range: [31, 34], bigIdea: "A top bigger than the bottom means more than one whole: divide to find how many wholes, the remainder is the fraction left over", forms: [toMixed], example: { problem: `Write ${F(7, 3)} as a mixed number.`, steps: ["7 ÷ 3 = 2 remainder 1", "The 2 is the whole number; the remainder 1 goes back over the same bottom: 1/3", "So 7/3 = 2 1/3. The fraction part must be in simplest form — 1/3 already is"], answer: `2 ${F(1, 3)}` } },
  { id: "fr-improper", label: "Improper fractions", objective: "Student converts mixed numbers to improper fractions", directive: "Write each as an improper fraction.", grade: "Grade 5", stars: 3, range: [35, 38], bigIdea: "Each whole is worth a full set of thirds: multiply the wholes by the bottom, then add the top", forms: [toImproper], example: { problem: `Write 2 ${F(1, 3)} as an improper fraction.`, steps: ["Each whole is 3 thirds, so 2 wholes = 2 × 3 = 6 thirds", "Add the 1 third that is already there: 6 + 1 = 7 thirds", "Keep the same bottom: 7/3"], answer: F(7, 3) } },
  { id: "fr-add", label: "Add fractions", objective: "Student adds fractions (like and unlike denominators)", directive: "Add. Write the answer in simplest form; an improper fraction (5/4) is fine.", grade: "Grade 5", stars: 4, range: [39, 41], bandRamp: true, bigIdea: "Same bottom: add the tops and keep the bottom. Different bottoms: make them the same first", forms: [fracOp("+", "frac-add")], example: { problem: `${F(3, 8)} + ${F(3, 8)}`, steps: ["Same bottom, so add only the tops: 3 + 3 = 6, and keep the 8: 6/8", "Write the answer in simplest form: 6 and 8 both divide by 2 → 3/4", "If the tops add up to the bottom (1/5 + 4/5 = 5/5) that is 1 whole — write 1", "If the top ends up bigger than the bottom (6/8 + 6/8 = 12/8 = 3/2) leave it as a fraction: 3/2", "Sheet 2 — one bottom fits into the other (1/4 + 3/8): 8 is 4 × 2, so rewrite only 1/4 = 2/8, then 2/8 + 3/8 = 5/8", "Sheet 3 — neither bottom fits (1/3 + 2/5): find a bottom BOTH reach, 3 × 5 = 15; 1/3 = 5/15 and 2/5 = 6/15, so 5/15 + 6/15 = 11/15"], answer: F(3, 4) } },
  { id: "fr-sub", label: "Subtract fractions", objective: "Student subtracts fractions", directive: "Subtract. Write the answer in simplest form.", grade: "Grade 5", stars: 4, range: [42, 44], bandRamp: true, bigIdea: "Same bottom: subtract the tops and keep the bottom. Different bottoms: make them the same first", forms: [fracOp("-", "frac-sub")], example: { problem: `${F(5, 6)} - ${F(1, 6)}`, steps: ["Same bottom, so subtract only the tops: 5 − 1 = 4, and keep the 6: 4/6", "Write the answer in simplest form: 4 and 6 both divide by 2 → 2/3", "Sheet 2 — one bottom fits into the other (3/4 − 1/12): 12 is 4 × 3, so rewrite only 3/4 = 9/12, then 9/12 − 1/12 = 8/12 = 2/3", "Sheet 3 — neither bottom fits (1/3 − 1/4): find a bottom BOTH reach, 3 × 4 = 12; 1/3 = 4/12 and 1/4 = 3/12, so 4/12 − 3/12 = 1/12"], answer: F(2, 3) } },
  { id: "fr-mul", label: "Multiply fractions", objective: "Student multiplies fractions", directive: "Multiply. Write the answer in simplest form; an improper fraction is fine.", grade: "Grade 5-6", stars: 4, range: [45, 47], bigIdea: "To multiply fractions, multiply the tops together and the bottoms together — no shared bottom needed", forms: [binUnlike("×", "mul")], example: { problem: `${F(2, 3)} × ${F(3, 4)}`, steps: ["Multiply the tops: 2 × 3 = 6", "Multiply the bottoms: 3 × 4 = 12, so the product is 6/12", "Write it in simplest form: 6 and 12 both divide by 6 → 1/2", "Unlike adding, the bottoms do NOT need to match first"], answer: F(1, 2) } },
  { id: "fr-div", label: "Divide fractions", objective: "Student divides fractions using the reciprocal", directive: "Divide. Write the answer in simplest form; an improper fraction (5/2) or a whole number is fine.", grade: "Grade 6", stars: 5, range: [48, 49], bigIdea: "Dividing by a fraction is the same as multiplying by it flipped over (its reciprocal)", forms: [binUnlike("÷", "div")], example: { problem: `${F(1, 2)} ÷ ${F(2, 3)}`, steps: ["Flip the second fraction over: 2/3 becomes 3/2 (this is called its reciprocal)", "Change ÷ to × and multiply across: 1/2 × 3/2 = 3/4 (tops 1 × 3, bottoms 2 × 2)", "Simplify if you can — 3/4 already is", "Sheet 2 — the answer can be 1 or more: 1/2 ÷ 1/8 = 1/2 × 8/1 = 8/2 = 4 (a whole number); 3/4 ÷ 1/2 = 3/4 × 2/1 = 6/4 = 3/2 — leave it as an improper fraction"], answer: F(3, 4) } },
  { id: "fr-mastery", label: "Fraction mastery", objective: "Student works fluently across all fraction operations", grade: "Grade 6", stars: 5, range: [50, 50], directive: "Solve. Fill in each ?; write >, <, or = on each ___; order each list least to greatest. Every answer in simplest form; an improper fraction (5/4) is fine.", forms: MASTERY_FORMS, sampler: "round-robin", bigIdea: "Each line's shape tells you which unit's rule to use — a ? to fill, a ___ to compare, a list to order, or an instruction word — then give every answer in simplest form", example: { problem: `${F(2, 3)} ÷ ${F(3, 5)}`, steps: ["The word says Divide, so flip the second fraction and multiply: 2/3 × 5/3 = 10/9 (tops 2 × 5, bottoms 3 × 3)", "10/9 is already in simplest form — leave it as an improper fraction", "Subtract (5/6 − 1/4): neither bottom fits, so use 12 → 10/12 − 3/12 = 7/12. Add works the same way with +", "Multiply (2/3 × 3/5): tops 2 × 3 = 6, bottoms 3 × 5 = 15 → 6/15 = 2/5", "Compare or Order: give the fractions the same bottom, then compare the tops. Simplify (12/16): divide top and bottom by 4 → 3/4"], answer: F(10, 9) } },

  // ── DECIMALS ──
  { id: "dec-place", label: "Decimal place value", objective: "Student identifies decimal place values", directive: "Write the digit in the named place.", grade: "Grade 5", stars: 2, range: [51, 54], bigIdea: "The point separates wholes from parts: the first place after it is tenths (like 4/10), the second is hundredths (like 7/100)", forms: [decPlaceValue], example: { problem: "3.47 — hundredths", steps: ["The point separates wholes from parts: 3 is the wholes, .47 is the part", "First place after the point is TENTHS: the 4 means 4 tenths = 4/10", "Second place after the point is HUNDREDTHS: the 7 means 7 hundredths = 7/100", "So the digit in the hundredths place is 7 (asked for tenths, it would be 4)"], answer: "7" } },
  { id: "dec-compare", label: "Compare decimals", objective: "Student compares decimals", directive: "Compare. Write >, <, or =.", grade: "Grade 5", stars: 3, range: [55, 58], bigIdea: "Give both decimals the same number of places, then compare them like whole numbers", forms: [decCompare], example: { problem: "0.7 ___ 0.65", steps: ["Give both the same number of places: 0.7 = 0.70 (adding a zero on the end changes nothing)", "Now compare like whole numbers: 70 hundredths vs 65 hundredths — 70 > 65", "So 0.7 > 0.65. If the bigger one is on the right, write <", "If they come out the same (0.5 and 0.50 are both 50 hundredths) write ="], answer: ">" } },
  { id: "dec-round", label: "Round decimals", objective: "Student rounds decimals", directive: "Round each to the place shown.", grade: "Grade 5", stars: 3, range: [59, 62], bigIdea: "Look at the digit just AFTER the place you are rounding to: 5 or more rounds up, 4 or less stays", forms: [decRound], example: { problem: "3.47 → nearest tenth", steps: ["Rounding to tenths, so look at the digit AFTER the tenths place: the hundredths digit, 7", "Rule: 5 or more rounds up, 4 or less stays the same", "7 is 5 or more, so the 4 tenths become 5 tenths: 3.5", "Rounding down: 0.14 → the 4 is less than 5, so the 1 stays: 0.1", "Later sheets — nearest WHOLE: the tenths digit decides. 2.9 → 9 rounds up → 3; 4.3 → 3 stays → 4"], answer: "3.5" } },
  { id: "dec-add", label: "Add & subtract decimals", objective: "Student adds and subtracts decimals", directive: "Add or subtract.", grade: "Grade 5", stars: 3, range: [63, 67], bigIdea: "Line up the points so tenths sit under tenths and hundredths under hundredths — then add or subtract like whole numbers", forms: [decAdd("+", "dec-add"), decAdd("-", "dec-sub")], example: { problem: "0.45 + 0.36", steps: ["Line up the points: 0.45 over 0.36, so hundredths sit under hundredths", "Add like whole numbers: 45 + 36 = 81 hundredths, then put the point back: 0.81", "Subtracting works the same way: 0.55 − 0.13 → 55 − 13 = 42 hundredths → 0.42", "Later sheets — different lengths (0.23 + 0.4): write 0.4 as 0.40 first, then 23 + 40 = 63 hundredths → 0.63 (NOT 23 + 4)"], answer: "0.81" } },
  { id: "dec-mul", label: "Multiply decimals", objective: "Student multiplies decimals", directive: "Multiply.", grade: "Grade 6", stars: 4, range: [68, 72], bigIdea: "Multiply as whole numbers, then count the digits after the points in the question — the answer gets that many", forms: [decMul], example: { problem: "0.3 × 0.4", steps: ["Multiply as whole numbers: 3 × 4 = 12", "Count the digits after the points in the QUESTION: 0.3 has 1, 0.4 has 1 — that is 2", "Put 2 digits after the point in the answer: 0.12", "Decimal × whole number (0.5 × 3): 5 × 3 = 15, only 1 digit after a point in the question → 1.5", "A zero on the end can be dropped: 0.5 × 0.6 → 30, two places → 0.30 = 0.3"], answer: "0.12" } },
  { id: "dec-div", label: "Divide decimals", objective: "Student divides decimals by whole numbers", directive: "Divide.", grade: "Grade 6", stars: 4, range: [73, 74], bigIdea: "Divide as if there were no point, then put the point back so the answer has the same number of decimal places as the number you divided", forms: [decDiv], example: { problem: "1.2 ÷ 3", steps: ["Cover the point and divide like whole numbers: 12 ÷ 3 = 4", "1.2 has ONE digit after the point, so the answer gets one too: 0.4", "Check by multiplying back: 0.4 × 3 = 1.2 ✓", "If it comes out whole (4.0 ÷ 2 → 40 ÷ 2 = 20 → 2.0) you may write 2 or 2.0"], answer: "0.4" } },
  { id: "dec-mastery", label: "Decimal mastery", objective: "Student works fluently across decimal operations", directive: "Solve.", grade: "Grade 6", stars: 5, range: [75, 75], bigIdea: "Each decimal job has its own point rule: line up the points to add, count the places to multiply, look at the next digit to round", forms: [decAdd("+", "dec-add"), decMul, decRound], example: { problem: "0.5 × 0.6", steps: ["A × sign: multiply as whole numbers, 5 × 6 = 30", "Count the digits after the points in the question: 1 + 1 = 2, so the answer gets 2 places → 0.30 = 0.3", "A + sign (0.31 + 0.25): line up the points, 31 + 25 = 56 hundredths → 0.56", "'Nearest tenth' (6.51): look at the hundredths digit, 1 is less than 5, so it stays → 6.5"], answer: "0.3" } },

  // ── PERCENTS & CONVERSIONS ──
  { id: "pct-understand", label: "Understand percent", objective: "Student reads percent as parts out of 100", directive: "Write the percent shaded, or the percent as a fraction.", grade: "Grade 6", stars: 2, range: [76, 78], bigIdea: "Percent means 'out of 100': 25% is 25 of 100 squares, and 25/100 as a fraction", forms: [pctGridViz, pctAsFraction], example: { problem: "[[viz grid 25 100]]", steps: ["The grid has 100 squares; 25 of them are shaded", "Percent means out of 100, so 25 out of 100 = 25%", "The other way round: 25% as a fraction of 100 is 25/100"], answer: "25%" } },
  { id: "pct-frac", label: "Fractions ↔ percents", objective: "Student converts between fractions and percents", directive: "Convert each.", grade: "Grade 6", stars: 3, range: [79, 82], bigIdea: "A percent is a fraction with 100 on the bottom — so make the bottom 100 and read the top", forms: [fracToPct, pctToFrac], example: { problem: `45% → fraction`, steps: ["Percent means out of 100: 45/100", "Write it in simplest form: divide top and bottom by 5 → 9/20", "The other way (7/20 → percent): make the bottom 100 with an equivalent fraction — 20 × 5 = 100, so 7 × 5 = 35: 7/20 = 35/100 = 35%", "Same trick for 1/4 (× 25 → 25/100 = 25%), 1/50 (× 2 → 2/100 = 2%) and 1/25 (× 4 → 4/100 = 4%)"], answer: `${F(9, 20)}` } },
  { id: "pct-dec", label: "Decimals ↔ percents", objective: "Student converts between decimals and percents", directive: "Convert each.", grade: "Grade 6", stars: 3, range: [83, 86], bigIdea: "Percent is hundredths: read the decimal as hundredths and you have the percent (point moves 2 places RIGHT for %, 2 places LEFT for decimal)", forms: [decToPct, pctToDec], example: { problem: "0.25 → percent", steps: ["Read the decimal as hundredths: 0.25 = 25 hundredths = 25/100", "25 out of 100 is 25% — the point moved 2 places to the RIGHT", "One place only (0.3 → percent)? Pad it to hundredths first: 0.3 = 0.30 = 30 hundredths = 30%", "The other way (5% → decimal): 5 out of 100 = 5 hundredths = 0.05 — the point moves 2 places LEFT, so write the 0 in the tenths place"], answer: "25%" } },
  { id: "pct-of", label: "Percent of a number", objective: "Student finds a percent of a number", directive: "Find the percent of each number.", grade: "Grade 6-7", stars: 4, range: [87, 90], bigIdea: "Turn the percent into a simple fraction, then take that fraction of the number", forms: [pctOf], example: { problem: "25% of 80", steps: ["25% = 25/100 = 1/4 in simplest form", "1/4 of 80 means 80 shared into 4 equal parts: 80 ÷ 4 = 20", "The ones to know: 50% = 1/2 (÷ 2), 25% = 1/4 (÷ 4), 10% = 1/10 (÷ 10), 20% = 1/5 (÷ 5), 5% = 1/20 (÷ 20)", "Later sheets — 75% = 3/4: find 1/4 first, then × 3. 75% of 12: 12 ÷ 4 = 3, 3 × 3 = 9"], answer: "20" } },
  { id: "pct-change", label: "Percent increase & decrease", objective: "Student increases and decreases a number by a percent", directive: "Increase or decrease as shown.", grade: "Grade 7", stars: 5, range: [91, 94], bigIdea: "Find the percent of the number first, then add it on (+) or take it off (−)", forms: [pctChange("Increase", "inc"), pctChange("Decrease", "dec")], example: { problem: "80 − 25%", steps: ["First find the percent of the number: 25% = 1/4, so 25% of 80 = 80 ÷ 4 = 20", "The sign says what to do with it: − means take it off, 80 − 20 = 60", "Increase (20 + 50%): 50% of 20 = 10, then add it on: 20 + 10 = 30"], answer: "60" } },
  { id: "pct-convert", label: "Convert fractions, decimals & percents", objective: "Student converts fluently between all three forms", directive: "Convert each.", grade: "Grade 7", stars: 5, range: [95, 98], bigIdea: "Fraction, decimal and percent are the same amount in different clothes — 'out of 100' is the bridge between all three", forms: [fracToPct, decToPct, pctToFrac, pctToDec], example: { problem: `${F(3, 5)} → percent`, steps: ["Fraction → percent: make the bottom 100. 5 × 20 = 100, so 3 × 20 = 60: 3/5 = 60/100", "Out of 100 IS percent: 60/100 = 60%", "Percent → decimal (60%): 60 hundredths = 0.60 = 0.6. Decimal → percent goes back the other way (0.6 = 0.60 = 60%)", "Percent → fraction (60%): 60/100, then simplest form, divide both by 20 → 3/5"], answer: "60%" } },
  { id: "pct-mastery", label: "Percent mastery", objective: "Student works fluently across percents and conversions", directive: "Solve.", grade: "Grade 7", stars: 5, range: [99, 100], bigIdea: "Read the sign to choose the job: 'of' means take a fraction of the number, '+' means find the percent and add it on, '→' means change to the other form", forms: [pctOf, fracToPct, pctChange("Increase", "inc"), decToPct], example: { problem: "20% of 45", steps: ["'of' means find that fraction of the number: 20% = 20/100 = 1/5", "1/5 of 45 is 45 shared into 5 equal parts: 45 ÷ 5 = 9", "'+' (24 + 25%): find 25% of 24 first, 24 ÷ 4 = 6, then add it on: 24 + 6 = 30", "'→' (0.4 → percent): 0.4 = 0.40 = 40 hundredths = 40%"], answer: "9" } },
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
// The pool a given sheet draws from. On a unit's OPENING sheet (the day the
// micro-lesson fires) only band-0 items — the shape the worked example
// teaches — are offered, provided that still fills the sheet. Difficulty is
// normalised over the WHOLE unit so the opening sheet's GPI stays comparable.
function poolForSheet(ui: number, t: number, span: number, count: number): XP[] {
  const pool = buildScoredPool(ui);
  if (CURRICULUM[ui].bandRamp && span > 0) {
    // Sheet k of the unit serves band k's method (opening sheet = band 0); if a
    // band alone cannot fill the sheet, widen to the bands already taught.
    const B = pool.reduce((m, p) => Math.max(m, p.band ?? 0), 0);
    const stage = Math.min(B, Math.floor(t * (B + 1)));
    const exact = pool.filter(p => (p.band ?? 0) === stage);
    if (exact.length >= count) return exact;
    const taught = pool.filter(p => (p.band ?? 0) <= stage);
    if (taught.length >= count) return taught;
    return pool;
  }
  if (span > 0 && t === 0) {
    const open = pool.filter(p => !p.band);
    if (open.length >= count) return open;
  }
  return pool;
}

// Pick `count` problems: ascending difficulty, window slides up per sheet, and
// no single form exceeds 40% of the sheet (variety rule).
// Per-sheet seeded RNG so consecutive sheets in a unit draw different subsets.
function fdpRng(seed: number): () => number {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function fdpHash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// Canonical text for the duplicate check: a commutative operation's operands
// are sorted, so "2/10 + 8/10" and "8/10 + 2/10" count as one problem.
function canonQ(q: string): string {
  const m = q.match(/^((?:Add|Multiply) the fractions:\s+)(\S+) ([+×]) (\S+)$/);
  if (!m) return q;
  const [x, y] = [m[2], m[4]].sort();
  return `${m[1]}${x} ${m[3]} ${y}`;
}
function dedupeSort(pool: XP[]): XP[] {
  // Dedup by QUESTION TEXT so two forms yielding the same problem can't repeat.
  const seenQ = new Set<string>();
  return pool.filter(p => { const c = canonQ(p.q); return seenQ.has(c) ? false : (seenQ.add(c), true); })
    .sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
}

// Round-robin: split `count` evenly across the pool's forms (the remainder
// goes to the LAST forms — the operations, on a mastery sheet), take each
// form's share from evenly spaced slices of its difficulty range (a seeded
// pick inside each slice), then print in difficulty order.
function selectRoundRobin(pool: XP[], count: number, seed = 0): XP[] {
  const sorted = dedupeSort(pool);
  const forms = [...new Set(sorted.map(p => p.form))];
  const rng = fdpRng(seed >>> 0);
  const base = Math.floor(count / forms.length), extra = count - base * forms.length;
  const out: XP[] = [];
  forms.forEach((form, fi) => {
    const items = sorted.filter(p => p.form === form);
    const k = Math.min(items.length, base + (fi >= forms.length - extra ? 1 : 0));
    for (let i = 0; i < k; i++) {
      const lo = Math.floor((i * items.length) / k), hi = Math.floor(((i + 1) * items.length) / k) - 1;
      out.push(items[lo + Math.floor(rng() * (hi - lo + 1))]);
    }
  });
  // Top up from the whole pool if some form was too small to give its share.
  const used = new Set(out.map(p => canonQ(p.q)));
  for (const p of sorted) { if (out.length >= count) break; const c = canonQ(p.q); if (!used.has(c)) { used.add(c); out.push(p); } }
  return out.sort((a, b) => a.diff - b.diff);
}

function selectProblems(pool: XP[], t: number, count: number, seed = 0): XP[] {
  const sorted = dedupeSort(pool);
  const N = sorted.length;
  const rng = fdpRng(seed >>> 0);
  // No single question FORM may be a strict majority of the sheet. 40% is
  // unachievable for concepts with only two natural phrasings (2×40%=80%<100%),
  // so the guarantee is "no form dominates" — the selector still spreads evenly.
  const cap = Math.max(1, Math.ceil(count * 0.5));

  if (N <= count) {
    // Pool smaller than a sheet — seeded rotation so adjacent sheets differ.
    const rot = Math.floor(rng() * N);
    const out: XP[] = [];
    for (let i = 0; i < count; i++) out.push(sorted[(i + rot) % N]);
    return out.sort((a, b) => a.diff - b.diff);
  }

  // Window slides upward per sheet to give a cross-sheet difficulty ramp. But a
  // small pool has no room for both a ramp AND full form coverage, so when the
  // pool is tight relative to a sheet we use the whole pool (no slide) — these
  // short units carry their ramp via unit ordering, not within-unit windowing.
  const W = N < count * 1.5 ? N : Math.min(N, Math.max(count, Math.round(N * 0.6)));
  const start = Math.round(t * (N - W));
  const win = sorted.slice(start, start + W);

  // Pass 1 — evenly-spread distinct picks across the window, with a per-sheet
  // seeded offset so consecutive sheets pick DIFFERENT items (not near-identical).
  const off = Math.floor(rng() * W);
  const usedIdx = new Set<number>();
  const chosenIdx: number[] = [];
  // A seeded ±1 jitter on each pick: when two forms alternate in the sorted
  // pool (decimal → percent, percent → decimal), an even stride would land on
  // the same form every time and the sheet would open with one direction
  // eleven items in a row. Jitter mixes the parity, so the forms interleave.
  for (let i = 0; i < count; i++) {
    let idx = (Math.round((i * (W - 1)) / (count - 1)) + off + (rng() < 0.5 ? 0 : 1)) % W;
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
    // Swap an over-form pick for the nearest unused under-cap slot around ITS
    // OWN position, so the forms stay interleaved along the difficulty ramp.
    // (Measuring "nearest" from the first pick clumped every replacement at
    // the low end: the Decimals ↔ percents opening sheet began with eleven
    // percent → decimal items in a row.)
    let done = false;
    for (let pi = chosenIdx.length - 1; pi >= 0 && !done; pi--) {
      if (win[chosenIdx[pi]].form !== overForm) continue;
      for (let r = 1; r < W && !done; r++) {
        for (const j of [r, -r]) {
          const cand = chosenIdx[pi] + j;
          if (cand < 0 || cand >= W || usedIdx.has(cand) || (fc[win[cand].form] ?? 0) >= cap) continue;
          usedIdx.delete(chosenIdx[pi]);
          usedIdx.add(cand);
          chosenIdx[pi] = cand;
          done = true;
          break;
        }
      }
    }
    if (!done) break; // no feasible swap — accept current distribution
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
  return { goal, bigIdea: u.bigIdea ?? goal, example: u.example, umbrella: "Fractions" };
}

// Ordered skill map (real content units) for M7 (fractions → decimals → percents).
export function fdpUnits(): { index: number; id: string; label: string; objective: string; grade: string; range: [number, number] }[] {
  return CURRICULUM.map((u, i) => ({ index: i, id: u.id, label: u.label, objective: u.objective, grade: u.grade, range: u.range }));
}
export function generateFdpSheet(sheetNumber: number, totalSheets: number, problemCount = 30): WorksheetData {
  const ui = unitIndexForSheet(sheetNumber);
  const unit = CURRICULUM[ui];
  // The caller decides how many fit the page (layout-capacity system); unit.count
  // remains only as the validator's pool-sufficiency target.
  const count = problemCount;
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const seed = fdpHash(`fdp:${sheetNumber}`);
  const selected = unit.sampler === "round-robin"
    ? selectRoundRobin(poolForSheet(ui, t, span, count), count, seed)
    : selectProblems(poolForSheet(ui, t, span, count), t, count, seed);
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
    const offered = poolForSheet(ui, t, span, count);
    const sel = unit.sampler === "round-robin"
      ? selectRoundRobin(offered, count)
      : selectProblems(offered, t, count);

    const dupes = sel.length - new Set(sel.map(p => canonQ(p.q))).size;
    if (dupes > 0 && poolOf(unit).length >= count) issues.push(`Sheet ${s}: ${dupes} duplicate(s)`);

    // variety — no single form may be a strict majority (>50%). Judged on the
    // forms OFFERED to this sheet: an opening sheet (or a bandRamp stage) may
    // deliberately hold one taught form while the unit has several.
    const fc: Record<string, number> = {};
    for (const p of sel) fc[p.form] = (fc[p.form] ?? 0) + 1;
    const maxForm = Math.max(...Object.values(fc));
    const offeredForms = new Set(offered.map(p => p.form)).size;
    if (maxForm > Math.ceil(count * 0.5) && poolOf(unit).length >= count && offeredForms > 1) {
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
