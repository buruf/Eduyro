// src/lib/shop/arithmetic-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// EDUYRO ARITHMETIC CURRICULUM ENGINE  (+, -, ×, ÷)
//
// Same progression-first design as fraction-engine.ts:
//   • Each concept ENUMERATES its valid problem space (bounded by striding for
//     very large spaces, so pools stay big but finite).
//   • Each problem is scored by ONE deterministic difficulty function.
//   • Each sheet selects a UNIQUE, strictly-ASCENDING slice via a window that
//     slides upward sheet-to-sheet.
//   ⇒ No duplicates, rising within-sheet difficulty, and a monotonic Global
//     Progression Index — true by construction.
// ─────────────────────────────────────────────────────────────────────────────

import { nanoid } from "nanoid";
import type { WorksheetData, WorkedExample, ShopSkill } from "./progressive-generator";

// `late`: keep this item off the OPENING sheet of its unit. Difficulty bands
// cannot do that for a small fact unit — a sheet is as long as the distinct
// pool, so the window is the whole pool and every fact lands on day one. The
// square facts are the case: 6 × 6 … 9 × 9 and 11 × 11 arrived on the first
// squares sheet, before ×6–×9 exist, as eight facts to memorise cold.
interface AProblem { q: string; a: string; diff: number; key: string; type?: "arithmetic" | "multiple_choice" | "true_false"; options?: string[]; strat?: string; late?: boolean; }

// ── Difficulty helpers ────────────────────────────────────────────────────────
const digits = (n: number) => String(Math.abs(n)).length;
// Size WITHIN the digit class, scaled 0–25 (a single digit is itself). It used
// to be `n % 10^(digits−1)`, which for a 2-digit number is just its ONES digit:
// every minuend or addend ending in 0 ranked easiest, so the opening borrowing
// sheet was 22/24 "x0 − y" (10 − 7, 80 − 5, 70 − 55) and the opening no-
// regrouping sheet was "50 + 44, 50 + 29, 50 + 11 …". The 30-per-digit-class
// step in every enumerator stays larger than this, so classes keep their order.
const magnitude = (n: number) => {
  const v = Math.abs(n), d = digits(v);
  if (d === 1) return v;
  const lo = Math.pow(10, d - 1), hi = Math.pow(10, d) - 1;
  return ((v - lo) / (hi - lo)) * 25;
};
const addCarry = (a: number, b: number) => (a % 10) + (b % 10) >= 10 ? 1 : 0;
const subBorrow = (a: number, b: number) => (a % 10) < (b % 10) ? 1 : 0;

// Cheap deterministic integer hash of a pair — used to THIN big spaces. Pure
// integer math (no strings) so an 810,000-pair space costs a few milliseconds.
const mix = (a: number, b: number) => {
  let h = (Math.imul(a, 0x9e3779b1) ^ Math.imul(b + 0x7f4a7c15, 0x85ebca77)) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16;
  return h >>> 0;
};

// ── Bounded space iterator ────────────────────────────────────────────────────
// Iterate a×b space; if it's huge, keep a hashed sample (a few hundred
// problems) rather than enumerating millions. This used to STRIDE both axes,
// which for a stride of 3 left only numbers ≡ 11 (mod 3) in a 2-digit pool —
// 11, 14, 17, 20, 23, 26, 29, 32 … — so sixteen sheets of "2-digit addition"
// were 41 + 23, 23 + 62, 32 + 41, 41 + 53 over and over, and every 3-digit
// sheet was 712, 916, 814, 644 and 542. A hashed sample keeps every operand
// value in play while the pool stays the same size.
function eachPair(
  aLo: number, aHi: number, bLo: number, bHi: number,
  fn: (a: number, b: number) => void,
  cap = 700,
) {
  const total = (aHi - aLo + 1) * (bHi - bLo + 1);
  if (total <= cap) {
    for (let a = aLo; a <= aHi; a++) for (let b = bLo; b <= bHi; b++) fn(a, b);
    return;
  }
  const keep = Math.round((cap / total) * 4096);
  for (let a = aLo; a <= aHi; a++)
    for (let b = bLo; b <= bHi; b++) if ((mix(a, b) & 4095) < keep) fn(a, b);
}

// ── ADDITION enumerators ──────────────────────────────────────────────────────
function enumAdd(aLo: number, aHi: number, bLo: number, bHi: number, carry?: boolean): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if (carry !== undefined && addCarry(a, b) !== (carry ? 1 : 0)) return;
    const m = Math.max(a, b);
    out.push({ q: `${a} + ${b}`, a: String(a + b), diff: (digits(m) - 1) * 30 + magnitude(m) + addCarry(a, b) * 20 + (a + b >= 1000 ? 150 : 0), key: `${a}+${b}` });
  });
  return out;
}
// True "no regrouping": 2-digit + 2-digit with NO carry in EITHER column (the
// plain enumAdd `carry:false` only checks the ones column, so it lets tens-carry
// problems like 70+79=149 leak onto "no regrouping" sheets).
// `cap` is raised for the unit's main pool: sixteen sheets drew from ~250
// pairs and repeated 65 + 23 three times. A single-digit addend (23 + 4) ranks
// a little ahead of a 2-digit one of the same size, so the unit ramps
// 2-digit + 1-digit → 2-digit + 2-digit rather than opening flat.
function enumAddClean(aLo: number, aHi: number, bLo: number, bHi: number, cap = 700): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if ((a % 10) + (b % 10) >= 10) return;                       // ones carry
    if (Math.floor(a / 10) + Math.floor(b / 10) >= 10) return;   // tens carry
    const m = Math.max(a, b), n = Math.min(a, b);
    out.push({ q: `${a} + ${b}`, a: String(a + b), diff: (digits(m) - 1) * 30 + magnitude(m) + (digits(n) - 1) * 6, key: `${a}+${b}` });
  }, cap);
  return out;
}
// ── "2-digit addition (regrouping)" — the ramp this unit never had ───────────
//
// The unit used to be plain enumAdd(10,99,10,99,true): every problem carries,
// ordered only by operand size. That put answers OVER 100 on the very first
// regrouping sheet — and an answer over 100 needs a carry out of the TENS
// column, which the curriculum does not teach until "3-digit addition", two
// lessons later. A child meeting regrouping for the first time was being asked
// 94 + 97. The multiplication unit was given a staged ramp for exactly this
// reason; addition was left with none.
//
// The unit now holds ONLY the case its lesson teaches: a ones carry with the
// answer under 100 (37 + 45 = 82). Sums over 100 used to sit in a late band
// here, but a carry out of the tens column ("write 13") is a new move that
// the printed page never showed — 58 + 49 = 107 arrived on sheet 58 cold. Those
// sums now OPEN the 3-digit unit (enumAddOver100), whose lesson page models
// them, right before 248 + 167.
function enumAddRegroup(): AProblem[] {
  const out: AProblem[] = [];
  eachPair(10, 99, 10, 99, (a, b) => {
    if (addCarry(a, b) !== 1) return;
    const sum = a + b;
    if (sum >= 100) return;
    const m = Math.max(a, b);
    out.push({ q: `${a} + ${b}`, a: String(sum), diff: magnitude(m) + (m >= 50 ? 40 : 0), key: `ar1-${a}+${b}` });
  });
  return out;
}
// 2-digit + 2-digit crossing 100 (64 + 67 = 131): the bridge from the
// regrouping unit into 3-digit addition. Thinned to a bounded minority and
// ranked below every 3-digit sum, so they open the 3-digit unit.
function enumAddOver100(cap = 70): AProblem[] {
  const out: AProblem[] = [];
  eachPair(10, 99, 10, 99, (a, b) => {
    const sum = a + b;
    if (sum < 100) return;
    out.push({ q: `${a} + ${b}`, a: String(sum), diff: magnitude(Math.max(a, b)) + (addCarry(a, b) ? 5 : 0), key: `ao-${a}+${b}` });
  }, cap);
  return out;
}

// Same defect as enumMissingSub, mirrored. To solve "___ + b = s" the child
// computes s - b, so a missing-ADDEND problem is really a subtraction — and on
// a no-regrouping unit that subtraction was borrowing (___ + 25 = 61 needs
// 61 - 25). Filtering on addCarry is sufficient: when a + b has no carry,
// s's ones digit is a%10 + b%10, which is >= b%10, so s - b cannot borrow.
// `maxSum` keeps a 2-digit unit's blanks under 100: "___ + 32 = 122" is a
// subtraction across the hundreds, which no addition lesson teaches.
function enumMissingAdd(aLo: number, aHi: number, bLo: number, bHi: number, carry?: boolean, maxSum = Infinity): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if (carry !== undefined && addCarry(a, b) !== (carry ? 1 : 0)) return;
    if (a + b > maxSum) return;
    // A total that crosses 100 makes this a subtraction across the hundreds
    // (___ + 66 = 130 means 130 − 66), which is a harder skill than the
    // 2-digit units teach. The old `digits × 30` term ranked it only ~30
    // higher, so those landed among the easiest problems in the pool. Band it
    // the same way the regrouping enumerator does, so it sorts to late sheets
    // in the units that mix both, and stays neutral in units where every
    // total crosses 100 anyway.
    const sum = a + b;
    const band = sum >= 100 ? 900 : 0;
    out.push({ q: `___ + ${b} = ${sum}`, a: String(a), diff: band + (digits(sum) - 1) * 30 + magnitude(sum) + addCarry(a, b) * 20 + 18, key: `m+${a}_${b}` });
  });
  return out;
}
// The only 3-digit missing addend the addition packs can teach: the known
// part is a whole number of hundreds ("___ + 200 = 438"), so the child counts
// up in hundreds — no 3-digit subtraction, which is a later pack. The general
// case (___ + 314 = 582) was 3-digit subtraction with regrouping and is gone.
function enumMissingAddHundreds(): AProblem[] {
  const out: AProblem[] = [];
  for (let h = 100; h <= 500; h += 100)
    for (let a = 100; a + h <= 999; a += 7)
      out.push({ q: `___ + ${h} = ${a + h}`, a: String(a), diff: 60 + magnitude(a + h) + 18, key: `mh+${a}_${h}` });
  return out;
}
function enumThreeAdd(lo: number, hi: number, cap = 90): AProblem[] {
  // Cap the count (strided) — an uncapped triple loop generates 100k+ items that
  // would swamp the two-addend pools (which eachPair caps at ~700) and dominate a
  // mixed unit. Keep three-addends a bounded minority.
  const out: AProblem[] = [];
  const range = hi - lo + 1;
  const stride = range ** 3 <= cap ? 1 : Math.max(1, Math.round(Math.cbrt((range ** 3) / cap)));
  for (let a = lo; a <= hi; a += stride)
    for (let b = lo; b <= hi; b += stride)
      for (let c = lo; c <= hi; c += stride)
        out.push({ q: `${a} + ${b} + ${c}`, a: String(a + b + c), diff: (a + b + c) + 15, key: `${a}+${b}+${c}` });
  return out;
}

// ── SUBTRACTION enumerators ───────────────────────────────────────────────────
// A 2-digit subtrahend ranks a little after a 1-digit one of the same
// minuend (57 − 6 before 57 − 26), so a unit ramps x − a → ab − cd instead of
// serving five sheets of "x − a single digit". n − n is skipped past the
// facts: "43 − 43", "644 − 644" are the subtract-all fact, not a 2-digit skill.
function enumSub(aLo: number, aHi: number, bLo: number, bHi: number, borrow?: boolean): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if (b > a || (b === a && a >= 10)) return;
    if (borrow !== undefined && subBorrow(a, b) !== (borrow ? 1 : 0)) return;
    out.push({ q: `${a} - ${b}`, a: String(a - b), diff: (digits(a) - 1) * 30 + magnitude(a) + (digits(b) - 1) * 8 + subBorrow(a, b) * 25 + (digits(a) >= 3 && /0/.test(String(a).slice(1)) ? 150 : 0), key: `${a}-${b}` });
  });
  return out;
}
// `borrow` filters on the subtraction the CHILD actually performs. To solve
// "a - ___ = r" they compute a - r, and that is where a borrow hides: 36 - ___
// = 29 looks gentle but needs 36 - 29. Filtering on subBorrow(a, b) covers it,
// because when a - b needs no borrow, neither does a - r.
//
// Without this filter a "no borrowing" unit served borrowing problems — 64 of
// them in one child's last five sheets, 26 across a zero — for a skill taught
// two units later. She sat at 67-90% for three days and could not clear the
// 95% gate. Any unit that PROMISES an easier case must have a filter here.
function enumMissingSub(aLo: number, aHi: number, bLo: number, bHi: number, borrow?: boolean): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if (b > a || (b === a && a >= 10)) return;
    if (borrow !== undefined && subBorrow(a, b) !== (borrow ? 1 : 0)) return;
    out.push({ q: `${a} - ___ = ${a - b}`, a: String(b), diff: (digits(a) - 1) * 30 + magnitude(a) + (digits(b) - 1) * 8 + subBorrow(a, b) * 25 + 18, key: `${a}-m${b}` });
  });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// STRATEGY-STAGED FOUNDATIONAL FACTS (curriculum-expert design)
// Each early unit teaches ONE derivation that reuses the prior one:
//   count-on → doubles → +0/commutativity → near-doubles → make-ten/bridging →
//   fact families. Facts are TAGGED by strategy so a reviewer can certify a sheet
//   teaches its target strategy, and so spiral review can interleave prior stages.
// ═════════════════════════════════════════════════════════════════════════════
type Fact = { a: number; b: number; diff: number; strat: string; late?: boolean };

// Wrap a strategy's base facts into a varied pool: direct + missing-addend +
// occasional MC / true-false. (Same format mix as the small-unit enrichment.)
function addFormats(items: Fact[]): AProblem[] {
  const out: AProblem[] = [];
  for (const { a, b, diff, strat, late } of items) {
    const s = a + b;
    out.push({ q: `${a} + ${b}`, a: String(s), diff, key: `d:${strat}:${a}+${b}`, strat, late });
    out.push({ q: `${a} + ___ = ${s}`, a: String(b), diff: diff + 0.3, key: `ma:${strat}:${a}_${s}_${b}`, strat, late });
    if ((a + b) % 3 === 0) {
      const opts = shuffle([String(s), String(s + 1), String(Math.max(0, s - 1)), String(s + 2)], mulberry32(hashStr(`mc+${strat}${a}_${b}`)));
      if (new Set(opts).size === 4) out.push({ q: `${a} + ${b} = ?`, a: String(s), diff: diff + 0.2, key: `mc:${strat}:${a}+${b}`, type: "multiple_choice", options: opts, strat, late });
    }
    // (True/False removed — it was print-stripped everywhere and unused in
    // interactive practice, and it made the printed problem count non-uniform.)
  }
  return out;
}
// `withAddend` adds the family's addition form ("5 + ___ = 13" for 13 − 5 = 8):
// the subtract/add inverse is what the fact-family lesson teaches, and without
// it that unit's sheets were thirty subtractions the child had already done.
function subFormats(items: Fact[], withAddend = false): AProblem[] {
  const out: AProblem[] = [];
  for (const { a, b, diff, strat, late } of items) {
    const r = a - b;
    out.push({ q: `${a} - ${b}`, a: String(r), diff, key: `d:${strat}:${a}-${b}`, strat, late });
    out.push({ q: `${a} - ___ = ${r}`, a: String(b), diff: diff + 0.3, key: `ms:${strat}:${a}_${r}_${b}`, strat, late });
    if (withAddend) out.push({ q: `${b} + ___ = ${a}`, a: String(r), diff: diff + 0.4, key: `fa:${strat}:${b}_${a}`, strat, late });
    if ((a + b) % 3 === 0) {
      const opts = shuffle([String(r), String(r + 1), String(Math.max(0, r - 1)), String(r + 2)], mulberry32(hashStr(`mc-${strat}${a}_${b}`)));
      if (new Set(opts).size === 4) out.push({ q: `${a} - ${b} = ?`, a: String(r), diff: diff + 0.2, key: `mc:${strat}:${a}-${b}`, type: "multiple_choice", options: opts, strat, late });
    }
    // (True/False removed — see addFormats.)
  }
  return out;
}

// Spiral: ~70% current strategy, ~25% prior stage(s), ~5% two-stages-back —
// approximated by including those counts in the pool (the seeded sampler then
// draws across them). Review facts keep their own keys so they're de-duped.
function det<T>(arr: T[], k: number, seed: string): T[] { return shuffle(arr, mulberry32(hashStr(seed))).slice(0, Math.max(0, k)); }
// `priorShare` is the review percentage (default ~25%). A unit with very few
// facts of its own — the ten square facts — raises it so the page is not a
// dozen items: the review there is the ×2/×5/×10 facts the squares are built
// from ("6 × 5 = 30, one more six"), so a fuller page is also a coherent one.
function spiral(current: AProblem[], prior: AProblem[], twoBack: AProblem[], tag: string, priorShare = 25): AProblem[] {
  const n = current.length;
  let lo = Infinity, hi = -Infinity; for (const p of current) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = (hi - lo) || 1;
  // Spread review facts ACROSS the current stage's difficulty band so the
  // per-sheet difficulty window mixes review throughout (not clustered on early
  // sheets). Review keeps its own keys/strat tag for the acceptance checker.
  const remap = (arr: AProblem[], k: number, seed: string) => det(arr, k, seed).map((p, i) => ({ ...p, diff: lo + ((i + 0.5) / Math.max(1, k)) * span }));
  return [...current, ...remap(prior, Math.round((n * priorShare) / 70), tag + ":p"), ...remap(twoBack, Math.round((n * 5) / 70), tag + ":tb")];
}

// A REVIEW unit mixes several shapes, each with its own difficulty scale. Left
// as they are, the scale with the smallest numbers fills the opening window
// alone: the subtraction review's first sheet was thirty "40 − ___ = 23"
// items and nothing else. Rescale each list onto one 0–100 band so every
// sheet's window cuts through all of them, easiest of each first.
//
// The band is assigned by RANK inside the list, not by value: a list whose
// scores bunch at the bottom (3-digit subtraction, where a zero in the middle
// adds +150 to a handful of items) used to squeeze all its ordinary items into
// the first fifth of the band, while a list spread evenly (2-digit borrowing)
// had only a fifth of its items there — so the opening review sheet held one
// 2-digit subtraction next to twenty 3-digit ones. Ranked, every list puts the
// same share of itself into every slice of the band.
function mixBands(lists: AProblem[][]): AProblem[] {
  const out: AProblem[] = [];
  for (const list of lists) {
    const sorted = [...list].sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
    const n = Math.max(1, sorted.length - 1);
    sorted.forEach((p, i) => out.push({ ...p, diff: (i / n) * 100 }));
  }
  return out;
}

// ── Addition strategy fact sets ──
function fCountOn(): Fact[] { const o: Fact[] = []; for (let a = 1; a <= 9; a++) for (const b of [1, 2, 3]) if (a + b <= 10) { o.push({ a, b, diff: a + b, strat: "count-on" }); o.push({ a: b, b: a, diff: a + b + 0.1, strat: "count-on" }); } return o; }
// The lesson is titled 1+1 … 9+9. 10 + 10 = 20 stays in the unit but off its
// opening sheet; 11 + 11 and 12 + 12 are gone — a Grade 1 child who has
// counted to 18 met 22 with no lesson. `minN` lets a later unit review only
// the bigger doubles (1 + 1 on a make-ten sheet is padding).
function fDoubles(maxN = 10, minN = 1): Fact[] { const o: Fact[] = []; for (let n = minN; n <= maxN; n++) o.push({ a: n, b: n, diff: 2 * n, strat: "doubles", late: n >= 10 }); return o; }
// Turnaround pairs stay within 10: the child has +1/+2/+3, doubles and +0,
// and bridging through ten is two lessons away (7 + 4, 2 + 9 were here).
function fZeroComm(): Fact[] { const o: Fact[] = []; for (let a = 0; a <= 9; a++) { o.push({ a, b: 0, diff: a + 1, strat: "zero-comm" }); o.push({ a: 0, b: a, diff: a + 1.1, strat: "zero-comm" }); } for (let a = 2; a <= 8; a++) for (let b = a + 1; b <= 9 && a + b <= 10; b++) { o.push({ a, b, diff: a + b, strat: "zero-comm" }); o.push({ a: b, b: a, diff: a + b + 0.1, strat: "zero-comm" }); } return o; }
// From 2 + 3 up: 1 + 2 is a counting-on fact, not a near-double anyone uses.
function fNearDoubles(minN = 2): Fact[] { const o: Fact[] = []; for (let n = minN; n <= 8; n++) { o.push({ a: n, b: n + 1, diff: 2 * n + 1, strat: "near-doubles" }); o.push({ a: n + 1, b: n, diff: 2 * n + 1.1, strat: "near-doubles" }); } return o; }
function fMakeTen(): Fact[] { const o: Fact[] = []; for (let a = 1; a <= 9; a++) o.push({ a, b: 10 - a, diff: 10, strat: "make-ten" }); for (let a = 5; a <= 9; a++) for (let b = 11 - a; b <= 9 && a + b >= 11 && a + b <= 18; b++) o.push({ a, b, diff: a + b + 2, strat: "make-ten" }); return o; }
// `sumLo`/`sumHi` split the families: the unit's OWN facts are the sums 10–18
// its title promises (the opening sheet used to be 1 + 6 and 2 + 2, a step
// down from the make-ten day before), and the small-sum families ride along
// as spread review — the only place the missing-addend shape meets them.
function fFactFamily(sumLo = 2, sumHi = 18): Fact[] { const o: Fact[] = []; for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9 && a + b <= 18; b++) if (a + b >= sumLo && a + b <= sumHi) o.push({ a, b, diff: a + b + 3, strat: "fact-family" }); return o; }

// ── Subtraction strategy fact sets ──
function sCountBack(): Fact[] { const o: Fact[] = []; for (let a = 2; a <= 10; a++) for (const b of [1, 2, 3]) if (b <= a) o.push({ a, b, diff: a, strat: "count-back" }); return o; }
function sZero(): Fact[] { const o: Fact[] = []; for (let a = 0; a <= 10; a++) { o.push({ a, b: 0, diff: a + 1, strat: "sub-zero" }); o.push({ a, b: a, diff: a + 1.1, strat: "sub-zero" }); } return o; }
function sCountUp(): Fact[] { const o: Fact[] = []; for (let a = 4; a <= 10; a++) for (let b = 1; b < a; b++) if (a - b <= 4) o.push({ a, b, diff: a + 2, strat: "count-up" }); return o; }
// Halves from 6 − 3 up: 2 − 1 and 4 − 2 are count-back facts, and with them
// in the pool two-thirds of the opening halves sheet was within-5 review.
function sNearDoubles(minN = 3): Fact[] { const o: Fact[] = []; for (let n = minN; n <= 9; n++) { o.push({ a: 2 * n, b: n, diff: 2 * n + 3, strat: "halves" }); if (2 * n + 1 <= 18) o.push({ a: 2 * n + 1, b: n, diff: 2 * n + 3.1, strat: "halves" }); } return o; }
function sBridge(): Fact[] { const o: Fact[] = []; for (let a = 11; a <= 18; a++) for (let b = 2; b <= 9; b++) if (a - b >= 1 && (a % 10) < b) o.push({ a, b, diff: a + 4, strat: "bridge-down" }); return o; }
// `aLo`/`aHi` bound the minuend: the unit titled "to 18" opens on the 10–18
// families (it used to open with 2 − 1 and 3 − ___ = 2, right after 17 − 8).
// (The subtrahend starts at a − 9, not 1: with "a − b ≤ 9" as a loop CONDITION
// the loop stopped at b = 1 for every minuend over 10, so "to 18" had only the
// 10 − b facts.)
function sFactFamily(aLo = 2, aHi = 18): Fact[] { const o: Fact[] = []; for (let a = aLo; a <= aHi; a++) for (let b = Math.max(1, a - 9); b < a && b <= 9; b++) o.push({ a, b, diff: a + 5, strat: "fact-family" }); return o; }

// ── Multiplication strategy fact sets + format wrapper ──
type MFact = { a: number; b: number; diff: number; strat: string; late?: boolean };
// `maxB` caps the second factor when a table is REVIEW in a unit that comes
// before ×11/×12 are taught (4 × 11 was on the first ×6–×9 sheet).
function mTables(tables: number[], strat: string, maxB = 12): MFact[] { const o: MFact[] = []; for (const t of tables) for (let b = 1; b <= maxB; b++) o.push({ a: t, b, diff: t * b * 0.4 + Math.max(t, b), strat }); return o; }
// Squares come third in the level, after ×2/×5/×10 and ×1/×0 only, so the
// unit is 1² … 10²: every one of those is "the five you know plus more of the
// number" (7 × 7 = 35 + 14), which the lesson works through. 11 × 11 and
// 12 × 12 have no strategy at this point and wait for the ×10/×11/×12 unit.
function mSquares(maxN = 10): MFact[] { const o: MFact[] = []; for (let n = 1; n <= maxN; n++) o.push({ a: n, b: n, diff: n * n * 0.4, strat: "squares" }); return o; }
// `maxN` caps the tables when fact families are practised BEFORE ×11/×12 are
// taught (the fact-family unit precedes the big-tables unit).
function mAll(maxN = 12): MFact[] { const o: MFact[] = []; for (let a = 2; a <= maxN; a++) for (let b = 2; b <= maxN; b++) o.push({ a, b, diff: a * b * 0.4, strat: "fact-family" }); return o; }
function mulFormats(items: MFact[]): AProblem[] {
  const out: AProblem[] = [];
  for (const { a, b, diff, strat, late } of items) {
    const p = a * b;
    out.push({ q: `${a} × ${b}`, a: String(p), diff, key: `d:${strat}:${a}x${b}`, strat, late });
    // Missing-factor is only well-posed when the KNOWN factor is non-zero:
    // "0 × ___ = 0" has infinitely many solutions, so never emit it (a!==0),
    // and "a × ___ = 0" would force the blank to 0 ambiguously (b!==0).
    if (b !== 0 && a !== 0) out.push({ q: `${a} × ___ = ${p}`, a: String(b), diff: diff + 0.3, key: `mf:${strat}:${a}_${p}_${b}`, strat, late });
    if ((a + b) % 3 === 0) {
      const opts = shuffle([String(p), String(p + a), String(Math.max(0, p - a)), String(p + Math.max(1, b))], mulberry32(hashStr(`mc*${strat}${a}_${b}`)));
      if (new Set(opts).size === 4) out.push({ q: `${a} × ${b} = ?`, a: String(p), diff: diff + 0.2, key: `mc:${strat}:${a}x${b}`, type: "multiple_choice", options: opts, strat, late });
    }
    // (True/False removed — see addFormats.)
  }
  return out;
}
// ── Division strategy fact sets + format wrapper (inverse of multiplication) ──
type DFact = { dividend: number; divisor: number; q: number; diff: number; strat: string };
// Ordered by QUOTIENT first, divisor second, so a unit that teaches several
// tables opens with the small facts of EVERY table (10 ÷ 5, 20 ÷ 10, 6 ÷ 2).
// Ordered by dividend, the "÷2, ÷5, ÷10" opening sheet was ÷2 with three ÷5
// and no ÷10 at all — the ÷10 facts all have big dividends.
// Quotients start at 2: n ÷ n = 1 is the identity unit's fact, and as a table
// entry it put "10 ÷ 10" at the head of the ÷10/÷11/÷12 lesson page.
function dTables(divisors: number[], strat: string): DFact[] { const o: DFact[] = []; for (const d of divisors) for (let q = 2; q <= 12; q++) o.push({ dividend: d * q, divisor: d, q, diff: q * 2 + d * 0.5, strat }); return o; }
function dIdentity(): DFact[] { const o: DFact[] = []; for (let n = 1; n <= 12; n++) { o.push({ dividend: n, divisor: 1, q: n, diff: n + 1, strat: "identity" }); o.push({ dividend: n, divisor: n, q: 1, diff: n + 1.1, strat: "identity" }); } return o; }
// 1² … 10² only, mirroring the multiplication squares unit: 121 ÷ 11 and
// 144 ÷ 12 belong to the ÷10/÷11/÷12 unit.
function dSquares(maxN = 10): DFact[] { const o: DFact[] = []; for (let n = 1; n <= maxN; n++) o.push({ dividend: n * n, divisor: n, q: n, diff: n * n * 0.35, strat: "squares" }); return o; }
function dAll(): DFact[] { const o: DFact[] = []; for (let d = 2; d <= 12; d++) for (let q = 2; q <= 12; q++) o.push({ dividend: d * q, divisor: d, q, diff: d * q * 0.35, strat: "fact-family" }); return o; }
// `withDividend` adds the missing-DIVIDEND form ("___ ÷ 6 = 7"), the shape the
// fact-family lesson teaches; without it that lesson's sheets held only the
// missing divisor and the dividend form appeared cold on the level's review.
function divFormats(items: DFact[], withDividend = false): AProblem[] {
  const out: AProblem[] = [];
  for (const { dividend, divisor, q, diff, strat } of items) {
    out.push({ q: `${dividend} ÷ ${divisor}`, a: String(q), diff, key: `d:${strat}:${dividend}/${divisor}`, strat });
    out.push({ q: `${dividend} ÷ ___ = ${q}`, a: String(divisor), diff: diff + 0.3, key: `md:${strat}:${dividend}_${q}_${divisor}`, strat });
    if (withDividend) out.push({ q: `___ ÷ ${divisor} = ${q}`, a: String(dividend), diff: diff + 0.4, key: `mdd:${strat}:${divisor}_${q}`, strat });
    if ((divisor + q) % 3 === 0) {
      const opts = shuffle([String(q), String(q + 1), String(Math.max(0, q - 1)), String(q + 2)], mulberry32(hashStr(`mc/${strat}${dividend}_${divisor}`)));
      if (new Set(opts).size === 4) out.push({ q: `${dividend} ÷ ${divisor} = ?`, a: String(q), diff: diff + 0.2, key: `mc:${strat}:${dividend}/${divisor}`, type: "multiple_choice", options: opts, strat });
    }
    // (True/False removed — see addFormats.)
  }
  return out;
}

// ── MULTIPLICATION enumerators ────────────────────────────────────────────────
// ── "Break apart to multiply" (the M5 bridge unit) ───────────────────────────
// Expert-designed bridge between fact recall (×10/11/12) and the written
// 2-digit × 1-digit algorithm: 27 × 4 was the first non-lookup question in the
// whole level and nothing taught the split. Three item stages, sequenced by
// `diff` so the unit's sheet ramp walks them in order:
//   1. SCAFFOLDED STEPS  — "23 × 3  Step 1: 20 × 3 =" / "Step 2: 3 × 3 =" /
//      combine. Each step is its own graded item, which is also the diagnostic:
//      step-1 misses = place value, step-2 = facts, combine = the addition load.
//   2. SPLIT PRACTICE    — "34 × 2 = (30 × 2) + (___ × 2)" and one-line splits.
//   3. BARE VERTICAL     — plain "23 × 3" (stacked in the UI), still NO
//      regrouping anywhere: every partial product stays ≤ 9 by construction.
// Regrouping is deliberately absent — it is the NEXT unit's job. Teaching the
// split on carry-free numbers first is the whole point of the bridge.
function enumBreakApart(): AProblem[] {
  const out: AProblem[] = [];
  for (let a = 12; a <= 99; a++) {
    const tens = Math.floor(a / 10), ones = a % 10;
    if (ones === 0) continue; // 30 × 2 has no split to practise
    for (let b = 2; b <= 9; b++) {
      // BOTH partial products single-digit → no regrouping anywhere.
      if (tens * b > 9 || ones * b > 9) continue;
      const pT = tens * 10 * b, pO = ones * b, prod = a * b;
      const base = a * b; // bigger numbers later within each stage
      // Stage 1 — scaffolded steps (three separate graded items).
      out.push({ q: `${a} × ${b}   Step 1: ${tens * 10} × ${b} =`, a: String(pT), diff: base, key: `ba1-${a}x${b}`, strat: "break-apart" });
      out.push({ q: `${a} × ${b}   Step 2: ${ones} × ${b} =`, a: String(pO), diff: base + 1, key: `ba2-${a}x${b}`, strat: "break-apart" });
      out.push({ q: `${tens * 10} × ${b} = ${pT} and ${ones} × ${b} = ${pO}. So ${a} × ${b} =`, a: String(prod), diff: base + 2, key: `ba3-${a}x${b}`, strat: "break-apart" });
      // Stage 2 — the split itself, then a one-line split.
      out.push({ q: `${a} × ${b} = (${tens * 10} × ${b}) + (___ × ${b})`, a: String(ones), diff: 400 + base, key: `ba4-${a}x${b}`, strat: "break-apart" });
      out.push({ q: `Break apart: ${a} × ${b} = (${tens * 10} × ${b}) + (${ones} × ${b}) =`, a: String(prod), diff: 500 + base, key: `ba5-${a}x${b}`, strat: "break-apart" });
      // Stage 3 — bare (renders stacked; carry boxes appear but stay empty).
      out.push({ q: `${a} × ${b}`, a: String(prod), diff: 900 + base, key: `ba6-${a}x${b}`, strat: "break-apart" });
    }
  }
  return out;
}

// ── "Multiplying tens" (bridge prerequisite) ─────────────────────────────────
// 20 × 4 is NOT in the times table — it's the first conceptual (non-lookup)
// multiplication and the first blank of every break-apart split. Taught as
// "2 tens × 4 = 8 tens", never "just add a zero" (that shortcut resurfaces as
// 3.4 × 10 = 3.40 two levels later in decimals).
function enumMulTens(): AProblem[] {
  const out: AProblem[] = [];
  for (let t = 2; t <= 9; t++) for (let b = 2; b <= 9; b++) {
    const tens = t * 10, prod = tens * b;
    // Stage 1 — the fact PAIRED with its ×10 partner (the key item type).
    out.push({ q: `${t} × ${b} = ${t * b}, so ${tens} × ${b} =`, a: String(prod), diff: t * b, key: `mt1-${t}x${b}`, strat: "mul-tens" });
    // Stage 2 — bare, both operand orders. Ranked only a little behind the
    // paired form so bare "30 × 4 =" items reach the opening sheet after the
    // first paired ones: a sheet of thirty "7 × 2 = 14, so 70 × 2 =" gives the
    // fact away on every line and leaves nothing to think about.
    out.push({ q: `${tens} × ${b} =`, a: String(prod), diff: 30 + t * b, key: `mt2-${t}x${b}`, strat: "mul-tens" });
    out.push({ q: `${b} × ${tens} =`, a: String(prod), diff: 34 + t * b, key: `mt3-${t}x${b}`, strat: "mul-tens" });
    // Stage 3 — reverse (missing factor) + hundreds (the lesson page models
    // "3 hundreds × 7 = 21 hundreds").
    out.push({ q: `___ × ${b} = ${prod}`, a: String(tens), diff: 200 + t * b, key: `mt4-${t}x${b}`, strat: "mul-tens" });
    out.push({ q: `${t * 100} × ${b} =`, a: String(t * 100 * b), diff: 400 + t * b, key: `mt5-${t}x${b}`, strat: "mul-tens" });
  }
  return out;
}

// ── "Carrying in multiplication" (the regrouping unit) ───────────────────────
// Sequenced AFTER the split is solid so the carried digit has meaning. Stages:
// ones-column regroup only (2-digit answers) → mixed regroup/no-regroup (the
// child must DECIDE) → 3-digit products. The worked example spells the order
// "multiply, THEN add the carry" — the #1 misconception is adding the carry to
// the tens digit before multiplying (27 × 4 → 168 instead of 108).
function enumMulCarry(): AProblem[] {
  const out: AProblem[] = [];
  for (let a = 13; a <= 99; a++) {
    const tens = Math.floor(a / 10), ones = a % 10;
    if (ones === 0) continue;
    for (let b = 2; b <= 9; b++) {
      const carry = Math.floor((ones * b) / 10);
      const prod = a * b;
      if (carry === 0) {
        // No-regroup problems appear only in the mixed stage — the decision set.
        if (tens * b <= 9) out.push({ q: `${a} × ${b}`, a: String(prod), diff: 450 + a, key: `mc0-${a}x${b}`, strat: "mul-carry" });
        continue;
      }
      if (tens * b + carry <= 9) {
        const pO = ones * b, pT = tens * 10 * b;
        // Stage 1 — scaffolded, same structure as the break-apart unit but with
        // the regroup inside. Ones FIRST (the algorithm's order), then tens,
        // then combine. Three graded items per pair floods the gentle band so
        // the first sheets stay gentle under the wide selection window.
        out.push({ q: `${a} × ${b}   Ones first: ${ones} × ${b} =`, a: String(pO), diff: a, key: `mc1a-${a}x${b}`, strat: "mul-carry" });
        // The lesson's own move — write the ones digit, carry the tens — was
        // never an item: the scaffold asked for partial products only, so the
        // carry procedure went unpractised on the day it was taught.
        out.push({ q: `${a} × ${b}   Ones: ${ones} × ${b} = ${pO} → write ${pO % 10}, carry`, a: String(carry), diff: a + 0.5, key: `mc1x-${a}x${b}`, strat: "mul-carry" });
        // The tens partial ("10 × 4 =") is asked on every other pair only: it
        // was the whole of the multiplying-tens lesson two units back and is
        // restated inside the combine item, and five items per pair crowded
        // the bare column items off the opening sheet.
        if (a % 2 === 0) out.push({ q: `${a} × ${b}   Tens: ${tens * 10} × ${b} =`, a: String(pT), diff: a + 1, key: `mc1b-${a}x${b}`, strat: "mul-carry" });
        out.push({ q: `${ones} × ${b} = ${pO} and ${tens * 10} × ${b} = ${pT}. So ${a} × ${b} =`, a: String(prod), diff: a + 2, key: `mc1c-${a}x${b}`, strat: "mul-carry" });
        // The same pair bare (regroup in the ones, 2-digit answer) sits right
        // behind its scaffold, so the opening sheet holds a few genuine column
        // items next to the steps that solve them — not only after sheet five.
        out.push({ q: `${a} × ${b}`, a: String(prod), diff: a + 3, key: `mc2-${a}x${b}`, strat: "mul-carry" });
      } else if (prod >= 100 && prod < 200 && mix(a, b) % 3 === 0) {
        // Stage 3: the tens column reaches 10–19, so a hundred is written in
        // front (27 × 4 = 108) — exactly the lesson's own example, and CAPPED
        // at products under 200. The unit used to run to 93 × 8 = 744 (two
        // carries) on its last sheets, harder than anything in the "2-digit ×
        // 1-digit" unit that follows, which then dropped back to 13 × 4. That
        // unit owns the big products now. Thinned to ~1/3, because unthinned
        // this set dwarfs the gentle stages and the selector's wide window
        // makes even the FIRST carrying sheet hard-dominant (caught by
        // test-break-apart's carry-mix check).
        out.push({ q: `${a} × ${b}`, a: String(prod), diff: 900 + a, key: `mc3-${a}x${b}`, strat: "mul-carry" });
      }
    }
  }
  return out;
}

function enumMul(aLo: number, aHi: number, bLo: number, bHi: number, carry?: boolean): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    const c = (a % 10) * (b % 10) >= 10 ? 1 : 0;
    if (carry !== undefined && c !== (carry ? 1 : 0)) return;
    const m = Math.max(a, b);
    out.push({ q: `${a} × ${b}`, a: String(a * b), diff: m * 3 + (digits(a) + digits(b) - 2) * 30 + (Math.min(a, b) >= 20 ? 300 : 0), key: `${a}x${b}` });
  });
  return out;
}
// ── "2-digit × 2-digit" ──────────────────────────────────────────────────────
// Banded so the opening sheet is the friendly cases and four-digit products
// wait: the plain enumerator ranked by the bigger factor alone, so sheet one
// opened with 83 × 14 = 1162 and 86 × 17 = 1462 while 11 × 80 sat at the
// bottom. Bands, in order: a factor that is a whole ten (20 × 34) → ×11 →
// teens × teens → a teen times a bigger number → everything else; any product
// of 1000 or more goes behind all of them. Each band is thinned by hash to a
// bounded share so the opening window cuts through the first three.
function enumMul2d2d(): AProblem[] {
  const out: AProblem[] = [];
  const KEEP = [12, 2, 1, 4, 8]; // per band: keep 1 in N pairs
  for (let a = 11; a <= 99; a++) for (let b = 11; b <= a; b++) {
    const mn = b, mx = a, prod = a * b;
    const tens = a % 10 === 0 || b % 10 === 0;
    const band = tens ? 0 : mn === 11 ? 1 : mx < 20 ? 2 : mn < 20 ? 3 : 4;
    const h = mix(a, b);
    if (h % KEEP[band] !== 0) continue;
    const [x, y] = (h >>> 8) % 2 ? [a, b] : [b, a];
    out.push({ q: `${x} × ${y}`, a: String(prod), diff: (prod >= 1000 ? 500 : 0) + band * 100 + mx * 0.5, key: `${x}x${y}` });
  }
  return out;
}
function enumMissingFactor(aLo: number, aHi: number, bLo: number, bHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    out.push({ q: `${a} × ___ = ${a * b}`, a: String(b), diff: Math.max(a, b) * 3 + 18, key: `${a}xm${b}` });
  });
  return out;
}

// ── DIVISION enumerators ──────────────────────────────────────────────────────
function enumDivExact(divLo: number, divHi: number, qLo: number, qHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(divLo, divHi, qLo, qHi, (d, q) => {
    const dividend = d * q;
    out.push({ q: `${dividend} ÷ ${d}`, a: String(q), diff: d * 5 + (digits(dividend) - 1) * 100, key: `${dividend}/${d}` });
  });
  return out;
}
// `maxQ` keeps the remainders unit to quotients a child can find from a
// times-table fact ("the biggest multiple of 4 that fits in 29"). Without it
// the unit drifted to 83 ÷ 2 = 41 r 1 — genuine 2-digit-quotient long division
// AND a remainder, before either piece was taught.
function enumDivRemainder(divLo: number, divHi: number, dividendLo: number, dividendHi: number, maxQ = Infinity): AProblem[] {
  const out: AProblem[] = [];
  eachPair(divLo, divHi, dividendLo, dividendHi, (d, dividend) => {
    if (d < 2 || dividend < d) return;
    const q = Math.floor(dividend / d), r = dividend % d;
    if (r === 0 || q > maxQ) return; // remainder problems only
    // `q * 3`: within a divisor the small quotients come first (29 ÷ 4 = 7 r 1
    // before 50 ÷ 4 = 12 r 2), so the opening sheet is the lesson's own case.
    out.push({ q: `${dividend} ÷ ${d}`, a: `${q} r ${r}`, diff: d * 5 + q * 3 + (digits(dividend) - 1) * 100 + (q > 12 ? 300 : 0) + 20, key: `${dividend}/${d}r` });
  });
  return out;
}
function enumMissingDividend(divLo: number, divHi: number, qLo: number, qHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(divLo, divHi, qLo, qHi, (d, q) => {
    out.push({ q: `___ ÷ ${d} = ${q}`, a: String(d * q), diff: d * 5 + (digits(d * q) - 1) * 25 + 18, key: `m/${d}=${q}` });
  });
  return out;
}

// ── Curriculum units ──────────────────────────────────────────────────────────
interface Unit {
  id: string; label: string; objective: string; grade: string; stars: number;
  range: [number, number]; pool: () => AProblem[]; example: WorkedExample;
}

const CURRICULA: Record<string, Unit[]> = {
  // Strategy-staged (curriculum-expert design): each early unit teaches ONE new
  // derivation that reuses the prior, with ~70/25/5 spiral review interleaved.
  ADDITION: [
    { id:"add-count-on", label:"Adding by counting on (+1, +2, +3)", objective:"Student adds by counting on from the larger number", grade:"Grade 1", stars:1, range:[1,5], pool:()=>addFormats(fCountOn()), example:{ problem:"7 + 2 =", steps:["Start at 7, count on 2: 8, 9"], answer:"9" } },
    { id:"add-doubles", label:"Doubles (1+1 … 9+9)", objective:"Student recalls the doubles facts", grade:"Grade 1", stars:1, range:[6,8], pool:()=>spiral(addFormats(fDoubles()), addFormats(fCountOn()), [], "ad2"), example:{ problem:"6 + 6 =", steps:["Think 5 + 5 = 10, then 2 more: 11, 12","Or count on from 6 with the other hand: 7, 8, 9, 10, 11, 12","Every double lands on an even number — say them in order: 2, 4, 6, 8, 10, 12"], answer:"12" } },
    // The sheet is +0 facts and turnaround pairs (4 + 2 / 2 + 4); the missing-
    // number shape is off every sheet until Fact families, so the example
    // teaches the two things the sheet asks for and nothing the sheet lacks.
    { id:"add-zero-comm", label:"Adding zero & turnarounds", objective:"Student uses +0 and that order doesn't change the sum", grade:"Grade 1", stars:1, range:[9,11], pool:()=>spiral(addFormats(fZeroComm()), addFormats(fDoubles()), addFormats(fCountOn()), "ad3"), example:{ problem:"4 + 0 =", steps:["Adding 0 is adding nothing, so the number stays the same: 4","0 + 4 is the same: still 4","Turnaround: 2 + 4 and 4 + 2 give the same answer — start at the bigger number and count on: 4, then 5, 6"], answer:"4" } },
    { id:"add-near-doubles", label:"Near-doubles (use the double you know)", objective:"Student adds near-doubles using a known double", grade:"Grade 1-2", stars:2, range:[12,15], pool:()=>spiral(addFormats(fNearDoubles()), addFormats(fDoubles()), addFormats(fZeroComm()), "ad4"), example:{ problem:"6 + 7 =", steps:["6 + 6 = 12","12 + 1 = 13"], answer:"13" } },
    { id:"add-make-ten", label:"Make ten & bridging through 10", objective:"Student makes ten first, then adding the rest (8+5 = 8+2+3)", grade:"Grade 2", stars:2, range:[16,20], pool:()=>spiral(addFormats(fMakeTen()), addFormats(fNearDoubles()), addFormats(fDoubles(10, 4)), "ad5"), example:{ problem:"8 + 5 =", steps:["8 + 2 = 10","10 + 3 = 13"], answer:"13" } },
    // Subtraction is not taught until M4, so the missing addend is found by
    // COUNTING UP (M1's skill), never by "12 − 7". The unit's own facts are
    // the sums 10–18 of its title; the small-sum families come as review.
    { id:"add-fact-family", label:"Fact families to 18", objective:"Student uses the add/subtract inverse and missing addends", grade:"Grade 2", stars:3, range:[21,28], pool:()=>spiral(addFormats(fFactFamily(10,18)), [...addFormats(fMakeTen()), ...addFormats(fFactFamily(2,9))], addFormats(fNearDoubles()), "ad6"), example:{ problem:"7 + ___ = 12", steps:["Start at 7 and count up to 12: 8, 9, 10, 11, 12 — that is 5 jumps","Check: 7 + 5 = 12","The same three numbers make a family: 7 + 5 = 12 and 5 + 7 = 12, so 5 + ___ = 12 is 7"], answer:"5" } },
    { id:"add-2d-noregroup", label:"2-digit addition (no regrouping)", objective:"Student adds tens and ones separately", grade:"Grade 2-3", stars:3, range:[29,44], pool:()=>[...enumAddClean(11,88,11,88), ...det(enumMissingAdd(11,77,11,22,false), 60, "ad7m"), ...det(addFormats(fFactFamily()), 20, "ad7p")], example:{ problem:"34 + 25 =", steps:["Ones: 4 + 5 = 9","Tens: 3 + 2 = 5","Answer: 59","Missing number (___ + 14 = 25): ones need 4 + ? = 5, so 1; tens need 1 + ? = 2, so 1 — the blank is 11"], answer:"59" } },
    { id:"add-2d-regroup", label:"2-digit addition (regrouping)", objective:"Student carries the ten when ones reach 10", grade:"Grade 3", stars:4, range:[45,64], pool:()=>[...enumAddRegroup(), ...det(enumMissingAdd(30,99,20,70,undefined,99), 60, "ad8m"), ...det(enumAddClean(11,88,11,88), 20, "ad8p")], example:{ problem:"37 + 45 =", steps:["Ones: 7 + 5 = 12 → write 2, carry 1","Tens: 3 + 4 + 1 = 8","Answer: 82","When the ones make exactly 10 (25 + 25): 5 + 5 = 10 → write 0, carry 1; tens 2 + 2 + 1 = 5, so 50"], answer:"82" } },
    { id:"add-3d-three", label:"3-digit addition & three addends", objective:"Student adds across columns, chaining three numbers", grade:"Grade 3-4", stars:4, range:[65,84], pool:()=>[...enumAddOver100(), ...enumAdd(100,999,100,999), ...det(enumMissingAddHundreds(), 70, "ad9m"), ...enumThreeAdd(15,99)], example:{ problem:"248 + 167 =", steps:["Ones: 8+7=15 → 5 carry 1","Tens: 4+6+1=11 → 1 carry 1","Hundreds: 2+1+1=4","Answer: 415","The first sheets start with 2-digit sums that pass 100 (64 + 67): ones 4 + 7 = 11 → 1 carry 1; tens 6 + 6 + 1 = 13 — there is no column left, so write the whole 13: 131","Three numbers (15 + 34 + 15): add the first two, then add the third: 49 + 15 = 64","Missing number (___ + 200 = 438): count up in hundreds from 200 to 438 — that is 238","Later sheets pass 1000 (746 + 304): Hundreds: 7 + 3 = 10 → write 0, carry 1 into a new thousands place: 1050"], answer:"415" } },
    { id:"add-missing-review", label:"Missing addend & mixed review", objective:"Student solves for the unknown, reviewing every addition type", grade:"Grade 4", stars:5, range:[85,100], pool:()=>[...enumMissingAdd(10,99,10,99), ...enumAdd(100,999,100,999), ...enumAdd(10,99,10,99,true)], example:{ problem:"___ + 25 = 61", steps:["Count up from 25 to 61","25 + 30 = 55, then 55 + 6 = 61","You added 30 + 6 = 36"], answer:"36" } },
  ],

  SUBTRACTION: [
    { id:"sub-count-back", label:"Subtracting by counting back (−1, −2, −3)", objective:"Student subtracts by counting back", grade:"Grade 1", stars:1, range:[1,6], pool:()=>subFormats(sCountBack()), example:{ problem:"9 - 2 =", steps:["Count back 2 from 9: 8, 7"], answer:"7" } },
    { id:"sub-zero", label:"Subtract 0 and subtract all", objective:"Student subtracts 0 and a number from itself", grade:"Grade 1", stars:1, range:[7,10], pool:()=>spiral(subFormats(sZero()), subFormats(sCountBack()), [], "sb2"), example:{ problem:"8 - 8 =", steps:["Taking all away leaves 0"], answer:"0" } },
    { id:"sub-count-up", label:"Find the difference (count up)", objective:"Student counts up from the smaller to the larger number", grade:"Grade 1-2", stars:2, range:[11,18], pool:()=>spiral(subFormats(sCountUp()), subFormats(sCountBack()), subFormats(sZero()), "sb3"), example:{ problem:"9 - 6 =", steps:["Count up from 6 to 9: 7, 8, 9 = 3 steps"], answer:"3" } },
    { id:"sub-halves", label:"Halving & near-halves (using doubles)", objective:"Student subtracts using known doubles (12−6, 13−6)", grade:"Grade 2", stars:2, range:[19,24], pool:()=>spiral(subFormats(sNearDoubles()), subFormats(sCountUp()), subFormats(sCountBack()), "sb4"), example:{ problem:"12 - 6 =", steps:["6 + 6 = 12, so 12 - 6 = 6","Near-half (13 - 6): 12 - 6 = 6, and 13 is one more, so 7","Near-half (11 - 5): 10 - 5 = 5, and 11 is one more, so 6"], answer:"6" } },
    { id:"sub-bridge", label:"Bridging down through 10", objective:"Student subtracts by going down to 10 first (15−7 = 15−5−2)", grade:"Grade 2", stars:3, range:[25,32], pool:()=>spiral(subFormats(sBridge()), subFormats(sNearDoubles()), [], "sb5"), example:{ problem:"15 - 7 =", steps:["15 - 5 = 10","10 - 2 = 8"], answer:"8" } },
    { id:"sub-fact-family", label:"Fact families to 18", objective:"Student uses the subtract/add inverse", grade:"Grade 2-3", stars:3, range:[33,40], pool:()=>spiral(subFormats(sFactFamily(10,18), true), subFormats(sBridge()), subFormats(sNearDoubles()), "sb6"), example:{ problem:"13 - ___ = 5", steps:["Think of the family: 5 + ___ = 13. Count up from 5 to 13: 6, 7, 8, 9, 10, 11, 12, 13 — 8 jumps","So 5 + 8 = 13, and 13 - 8 = 5: the blank is 8","The same family answers 8 + ___ = 13: the blank is 5"], answer:"8" } },
    { id:"sub-2d-noborrow", label:"2-digit subtraction (no borrowing)", objective:"Student subtracts tens and ones separately", grade:"Grade 2-3", stars:3, range:[41,54], pool:()=>[...enumSub(10,99,1,9,false), ...enumSub(10,99,10,99,false), ...enumMissingSub(10,99,1,9,false), ...enumMissingSub(10,99,1,40,false), ...det(subFormats(sFactFamily()), 20, "sb7p")], example:{ problem:"58 - 23 =", steps:["Ones: 8 - 3 = 5","Tens: 5 - 2 = 3","Answer: 35"], answer:"35" } },
    { id:"sub-2d-borrow", label:"2-digit subtraction (borrowing)", objective:"Student borrows a ten when needed", grade:"Grade 3", stars:4, range:[55,72], pool:()=>[...enumSub(20,99,1,9,true), ...enumSub(20,99,10,99,true), ...enumMissingSub(20,99,1,50), ...det(enumSub(10,99,10,99,false), 20, "sb8p")], example:{ problem:"52 - 27 =", steps:["Ones: 2 - 7 borrow → 12 - 7 = 5","Tens: 4 - 2 = 2","Answer: 25"], answer:"25" } },
    { id:"sub-3d", label:"3-digit subtraction (regrouping)", objective:"Student regroups across columns", grade:"Grade 3-4", stars:4, range:[73,88], pool:()=>[...enumSub(100,999,100,999), ...enumMissingSub(100,999,10,400), ...det(enumSub(10,99,10,99,true), 18, "sb9p")], example:{ problem:"542 - 372 =", steps:["Ones: 2 - 2 = 0","Tens: 4 - 7 can't → borrow a hundred: 14 - 7 = 7","Hundreds: 4 - 3 = 1","Answer: 170"], answer:"170" } },
    { id:"sub-missing-review", label:"Missing number & mixed review", objective:"Student solves for the unknown, reviewing every subtraction type", grade:"Grade 4", stars:5, range:[89,100], pool:()=>mixBands([det(subFormats(sFactFamily(10,18)), 40, "sb10f"), det(enumMissingSub(20,99,1,40), 200, "sb10m"), det(enumSub(100,999,100,999), 250, "sb10t"), enumSub(10,99,10,99,true)]), example:{ problem:"45 - ___ = 18", steps:["The missing number is what was taken away: 45 with 18 left means 45 - 18 was taken","45 - 18: ones 5 - 8 can't → borrow: 15 - 8 = 7; tens 3 - 1 = 2, so 27","Check: 45 - 27 = 18"], answer:"27" } },
  ],

  // Strategy-staged: skip-counting anchors → identity → squares → build-up tables
  // → hard facts → fact families → big tables → multi-digit, with spiral review.
  MULTIPLICATION: [
    { id:"mul-skip", label:"×2, ×5, ×10 (skip counting)", objective:"Student multiplies by 2, 5 and 10 using skip counting", grade:"Grade 3", stars:2, range:[1,6], pool:()=>mulFormats(mTables([2,5,10],"skip-count")), example:{ problem:"5 × 6 =", steps:["Skip-count by 5: 5,10,15,20,25,30"], answer:"30" } },
    { id:"mul-identity", label:"×1 and ×0", objective:"Student multiplies by 1 (identity) and 0", grade:"Grade 3", stars:1, range:[7,9], pool:()=>mulFormats(mTables([0,1],"identity")), example:{ problem:"7 × 1 =", steps:["1 group of 7 is just 7 — any number times 1 is itself","0 × 7 = 0: zero groups of 7 is nothing at all, so 0 (not 7)"], answer:"7" } },
    // ×3/×4 and ×6–×9 come later, so a square is built from a five the child
    // knows (×5 was lesson 1) plus one more of the number — not recalled cold.
    { id:"mul-squares", label:"Square facts (n × n)", objective:"Student recalls the square facts", grade:"Grade 3", stars:2, range:[10,12], pool:()=>spiral(mulFormats(mSquares()), mulFormats(mTables([2,5,10],"skip-count",10)), mulFormats(mTables([0,1],"identity",10)), "m3", 90), example:{ problem:"6 × 6 =", steps:["Use the five you know: 6 × 5 = 30","One more six: 30 + 6 = 36","Same for 4 × 4: 4 × 5 = 20, take one four away: 16","The big ones work the same way: 7 × 7 = 7 × 5 + 7 × 2 = 35 + 14 = 49, and 9 × 9 = 45 + 36 = 81"], answer:"36" } },
    { id:"mul-3-4", label:"×3 and ×4 (build from ×2)", objective:"Student multiplies by 3 and 4 building on doubles", grade:"Grade 3-4", stars:3, range:[13,22], pool:()=>spiral(mulFormats(mTables([3,4],"build-up")), mulFormats(mSquares()), mulFormats(mTables([2,5,10],"skip-count")), "m4"), example:{ problem:"4 × 7 =", steps:["×4 is double, then double again: double 7 is 14","Double 14: 28","×3 is double, then one more: 3 × 6 — double 6 is 12, one more 6 is 18"], answer:"28" } },
    // Review here is capped at ×10: ×11 and ×12 are taught two lessons later.
    { id:"mul-6-9", label:"×6, ×7, ×8, ×9 (the hard facts)", objective:"Student recalls the 6–9 times tables", grade:"Grade 4", stars:4, range:[23,36], pool:()=>spiral(mulFormats(mTables([6,7,8,9],"hard-facts")), mulFormats(mTables([3,4],"build-up",10)), mulFormats(mSquares(10)), "m5"), example:{ problem:"7 × 8 =", steps:["Use a five you already know: 8 × 5 = 40.","That leaves 3 more eights: 8 × 3 = 24.","Put them together: 40 + 24 = 56."], answer:"56" } },
    { id:"mul-fact-family", label:"Fact families & missing factor", objective:"Student uses the ×/÷ inverse to find missing factors", grade:"Grade 4", stars:4, range:[37,48], pool:()=>spiral(mulFormats(mAll()), mulFormats(mTables([6,7,8,9],"hard-facts")), mulFormats(mTables([3,4],"build-up")), "m6"), example:{ problem:"6 × ___ = 48", steps:["Ask: which number times 6 makes 48?","Count sixes until you reach 48: 6, 12, 18, 24, 30, 36, 42, 48","That took 8 sixes, so 6 × 8 = 48 and the blank is 8"], answer:"8" } },
    // ×11/×12 demoted 10→4 sheets (expert: ~4 sheets of value, and 3 days of
    // low-value drill sat right before the level's hardest transition).
    { id:"mul-10-12", label:"×10, ×11, ×12", objective:"Student recalls the 10, 11 and 12 times tables", grade:"Grade 4", stars:3, range:[49,52], pool:()=>spiral(mulFormats(mTables([10,11,12],"big-tables")), mulFormats(mAll()), [], "m7"), example:{ problem:"12 × 7 =", steps:["Split the 12 into 10 + 2.","7 × 10 = 70, and 7 × 2 = 14.","Add the two parts: 70 + 14 = 84.","×10 is the number with a 0 on the end: 8 × 10 = 80.  ×11 is the digit written twice: 6 × 11 = 66 (6 tens and 6 ones)"], answer:"84" } },
    // THE BRIDGE SEQUENCE (expert-designed): multiplying tens → break apart →
    // carrying. "27 × 4" was the first question in the level that wasn't a fact
    // lookup; these three units teach the concept before the algorithm.
    { id:"mul-tens", label:"Multiplying tens (20 × 3)", objective:"Student multiplies tens by a single digit using the matching fact (2 tens × 3 = 6 tens, so 20 × 3 = 60)", grade:"Grade 4", stars:3, range:[53,58], pool:()=>enumMulTens(), example:{ problem:"20 × 3 =", steps:["20 is 2 tens","2 tens × 3 = 6 tens","6 tens = 60"], answer:"60" } },
    { id:"mul-break-apart", label:"Break apart to multiply (no carrying)", objective:"Student splits a 2-digit number into tens and ones, multiplies each piece, and adds the two answers together", grade:"Grade 4", stars:4, range:[59,68], pool:()=>enumBreakApart(), example:{ problem:"23 × 3 =", steps:["Break 23 into 20 + 3","20 × 3 = 60","3 × 3 = 9","60 + 9 = 69"], answer:"69" } },
    { id:"mul-carry", label:"Carrying in multiplication", objective:"Student multiplies the ones, writes the ones digit and carries, then multiplies the tens and adds the carry AFTER multiplying", grade:"Grade 4-5", stars:5, range:[69,78], pool:()=>enumMulCarry(), example:{ problem:"27 × 4 =", steps:["Ones: 7 × 4 = 28 → write 8, carry 2","Tens: 2 × 4 = 8 — multiply FIRST","THEN add the carry: 8 + 2 = 10","Answer: 108"], answer:"108" } },
    { id:"mul-2d1d", label:"2-digit × 1-digit", objective:"Student multiplies a 2-digit number by 1 digit (with carrying)", grade:"Grade 4-5", stars:5, range:[79,84], pool:()=>[...enumMul(11,41,2,4,false), ...enumMul(12,99,2,9,true), ...enumMissingFactor(2,12,2,12)], example:{ problem:"47 × 6 =", steps:["6 × 7 = 42 → write 2 carry 4","6 × 4 = 24 + 4 = 28","Answer: 282"], answer:"282" } },
    { id:"mul-2d2d", label:"2-digit × 2-digit", objective:"Student multiplies two 2-digit numbers", grade:"Grade 5", stars:5, range:[85,96], pool:()=>[...enumMul2d2d(), ...det(mulFormats(mAll()), 20, "m9p")], example:{ problem:"23 × 14 =", steps:["23 × 4 = 92","23 × 10 = 230","92 + 230 = 322"], answer:"322" } },
    { id:"mul-review", label:"Mixed review", objective:"Student multiplies fluently across all types", grade:"Grade 5", stars:5, range:[97,100], // The review draws from EVERY unit of the level — facts, missing factors,
    // tens × a digit, 2-digit × 1-digit and the 2-digit × 2-digit the child has
    // just finished (it used to be facts and teen × digit only, a step back).
    pool:()=>mixBands([enumMul(2,12,2,12), enumMissingFactor(2,12,2,12), enumMulTens().filter((p) => /^mt[23]-/.test(p.key)), det(enumMul(12,99,2,9), 150, "m10c"), det(enumMul2d2d(), 90, "m10p")]), example:{ problem:"38 × 7 =", steps:["7 × 8 = 56 → 6 carry 5","7 × 3 = 21 + 5 = 26","Answer: 266","This sheet mixes every lesson of the level: facts and missing factors, tens (40 × 6 = 240), 2-digit × 1-digit, and 2-digit × 2-digit (23 × 14: 23 × 4 = 92, 23 × 10 = 230, 92 + 230 = 322)"], answer:"266" } },
  ],

  // Strategy-staged (inverse of multiplication): ÷2/5/10 → identity → squares →
  // ÷3/4 → ÷6-9 → fact families → ÷10-12 → remainders → larger, with spiral.
  DIVISION: [
    { id:"div-skip", label:"÷2, ÷5, ÷10", objective:"Student divides by 2, 5 and 10 using known facts", grade:"Grade 3", stars:2, range:[1,6], pool:()=>divFormats(dTables([2,5,10],"skip-count")), example:{ problem:"30 ÷ 5 =", steps:["5 × 6 = 30","So 30 ÷ 5 = 6"], answer:"6" } },
    { id:"div-identity", label:"÷1 and dividing a number by itself", objective:"Student divides by 1 and a number by itself", grade:"Grade 3", stars:1, range:[7,9], pool:()=>divFormats(dIdentity()), example:{ problem:"8 ÷ 8 =", steps:["8 shared into groups of 8 makes 1 group — a number divided by itself is 1","5 ÷ 1 = 5: groups of 1 give 5 groups — any number divided by 1 is itself"], answer:"1" } },
    { id:"div-squares", label:"Square-root facts (n² ÷ n)", objective:"Student divides square numbers", grade:"Grade 3", stars:2, range:[10,12], pool:()=>spiral(divFormats(dSquares()), divFormats(dTables([2,5,10],"skip-count")), [], "d3"), example:{ problem:"36 ÷ 6 =", steps:["6 × 6 = 36","So 36 ÷ 6 = 6"], answer:"6" } },
    { id:"div-3-4", label:"÷3 and ÷4", objective:"Student divides by 3 and 4", grade:"Grade 3-4", stars:3, range:[13,22], pool:()=>spiral(divFormats(dTables([3,4],"build-up")), divFormats(dSquares()), divFormats(dTables([2,5,10],"skip-count")), "d4"), example:{ problem:"28 ÷ 4 =", steps:["4 × 7 = 28","So 28 ÷ 4 = 7"], answer:"7" } },
    { id:"div-6-9", label:"÷6, ÷7, ÷8, ÷9", objective:"Student divides by 6–9", grade:"Grade 4", stars:4, range:[23,36], pool:()=>spiral(divFormats(dTables([6,7,8,9],"hard-facts")), divFormats(dTables([3,4],"build-up")), divFormats(dSquares()), "d5"), example:{ problem:"56 ÷ 7 =", steps:["7 × 8 = 56","So 56 ÷ 7 = 8"], answer:"8" } },
    { id:"div-fact-family", label:"Fact families & missing dividend", objective:"Student uses the ÷/× inverse to find the missing number", grade:"Grade 4", stars:4, range:[37,48], pool:()=>spiral(divFormats(dAll(), true), divFormats(dTables([6,7,8,9],"hard-facts")), divFormats(dTables([3,4],"build-up")), "d6"), example:{ problem:"___ ÷ 6 = 7", steps:["Some number split into 6 groups gives 7 in each — so it is 6 groups of 7","6 × 7 = 42, so the blank is 42","Missing divisor (12 ÷ ___ = 4): what times 4 makes 12? 3 × 4 = 12, so 3"], answer:"42" } },
    { id:"div-10-12", label:"÷10, ÷11, ÷12", objective:"Student divides by 10, 11 and 12", grade:"Grade 4", stars:3, range:[49,58], pool:()=>spiral(divFormats(dTables([10,11,12],"big-tables")), divFormats(dAll()), [], "d7"), example:{ problem:"84 ÷ 12 =", steps:["Ask: 12 times what makes 84? 12 × 7 = 84","So 84 ÷ 12 = 7","÷10 takes the 0 off the end: 70 ÷ 10 = 7.  ÷11 of a doubled digit is that digit: 77 ÷ 11 = 7"], answer:"7" } },
    { id:"div-remainder", label:"Division with remainders", objective:"Student divides with remainders", grade:"Grade 4-5", stars:5, range:[59,76], pool:()=>[...enumDivRemainder(2,9,10,99,12), ...det(divFormats(dAll()), 20, "d8p")], example:{ problem:"29 ÷ 4 =", steps:["Make groups of 4 from 29: the biggest multiple of 4 that fits is 4 × 7 = 28","29 - 28 = 1 is left over — that is the remainder","Write the answer as 7 r 1 (7 groups, remainder 1)"], answer:"7 r 1" } },
    { id:"div-larger", label:"2-digit & 3-digit ÷ 1-digit", objective:"Student divides larger numbers by 1 digit", grade:"Grade 5", stars:5, range:[77,92], pool:()=>[...enumDivExact(3,9,5,15), ...enumDivExact(3,9,15,33), ...det(enumDivExact(3,9,34,99), 160, "d9p")], example:{ problem:"96 ÷ 6 =", steps:["Split 96 into pieces that divide by 6: 60 + 36","60 ÷ 6 = 10 and 36 ÷ 6 = 6","10 + 6 = 16","3-digit (252 ÷ 3): split into hundreds-friendly pieces: 240 + 12 → 240 ÷ 3 = 80 and 12 ÷ 3 = 4, so 84","When a piece is 0 (204 ÷ 4): 200 ÷ 4 = 50 and 4 ÷ 4 = 1, so 51 — the tens digit is 0"], answer:"16" } },
    { id:"div-review", label:"Mixed review", objective:"Student divides fluently across all types", grade:"Grade 5", stars:5, range:[93,100], // The review draws from every unit of the level: facts (÷2 … ÷12), missing
    // dividends, remainders — now including the 2-digit-quotient ones the
    // remainders unit keeps out — and the 2-/3-digit ÷ 1-digit just finished
    // (it used to be facts and remainders only, a second remainders unit).
    pool:()=>mixBands([enumDivExact(2,12,2,12), enumMissingDividend(2,12,2,12), det(enumDivRemainder(2,9,10,99), 150, "d10r"), det(enumDivExact(3,9,15,99), 120, "d10p")]), example:{ problem:"73 ÷ 4 =", steps:["Split 73 into 40 + 33: 40 ÷ 4 = 10","33 ÷ 4: 4 × 8 = 32, and 33 - 32 = 1 left over → 8 r 1","10 + 8 = 18, remainder 1 — check: 4 × 18 = 72, 73 - 72 = 1","Missing dividend (___ ÷ 3 = 2): 3 × 2 = 6, so the blank is 6"], answer:"18 r 1" } },
  ],
};

const SKILL_CODE: Record<string, string> = {
  ADDITION: "M3", SUBTRACTION: "M4", MULTIPLICATION: "M5", DIVISION: "M6",
};

// ── Selection + GPI (identical guarantees to fraction-engine) ─────────────────
const GPI_STEP = 12, GPI_BAND = 8;

function unitIndexForSheet(skill: string, sheet: number): number {
  const units = CURRICULA[skill];
  const idx = units.findIndex(u => sheet >= u.range[0] && sheet <= u.range[1]);
  return idx === -1 ? units.length - 1 : idx;
}

function buildScoredPool(skill: string, unitIndex: number): AProblem[] {
  const raw = CURRICULA[skill][unitIndex].pool();
  let lo = Infinity, hi = -Infinity;
  for (const p of raw) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = hi - lo || 1;
  const base = unitIndex * GPI_STEP;
  return raw.map(p => ({ ...p, diff: base + ((p.diff - lo) / span) * GPI_BAND }));
}

// Seeded RNG so each sheet is deterministic (stable self-heal) yet DIFFERENT
// from its neighbours.
function mulberry32(seed: number): () => number {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffle<T>(a: T[], rng: () => number): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

// Reorder so the sheet is NOT pattern-fillable: no two adjacent items share an
// answer (breaks commutative twins like 2+3 / 3+2 and equal-answer runs), and no
// three consecutive answers move monotonically (no giveaway 4,5,6,7 run).
function arrangeNoPattern(items: AProblem[]): AProblem[] {
  const remaining = [...items];
  const out: AProblem[] = [];
  while (remaining.length) {
    let pick = -1;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i], prev = out[out.length - 1], prev2 = out[out.length - 2];
      const ca = Number(cand.a), pa = prev ? Number(prev.a) : NaN, p2a = prev2 ? Number(prev2.a) : NaN;
      if (prev && Number.isFinite(ca) && Number.isFinite(pa) && ca === pa) continue;           // no equal-answer adjacency
      if (prev2 && [ca, pa, p2a].every(Number.isFinite)) {
        if (pa - p2a > 0 && ca - pa > 0) continue;  // no 3 rising
        if (pa - p2a < 0 && ca - pa < 0) continue;  // no 3 falling
      }
      pick = i; break;
    }
    if (pick === -1) pick = 0; // constraints unsatisfiable for the remainder — accept
    out.push(remaining.splice(pick, 1)[0]);
  }
  return out;
}

function selectProblems(pool: AProblem[], t: number, count: number, seed: number): AProblem[] {
  const rng = mulberry32(seed);
  // Dedup by QUESTION TEXT (not key) so the same problem reaching the pool from
  // two strategies (e.g. "5 + 5" as a double and as review) can't appear twice on
  // one sheet.
  const seen = new Set<string>();
  const uniq = pool.filter(p => (seen.has(p.q) ? false : (seen.add(p.q), true)));
  const sorted = uniq.sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
  const N = sorted.length;
  // Difficulty window for THIS sheet (keeps cross-sheet progression). A wide
  // window + seeded sampling means consecutive sheets draw different subsets.
  //
  // The window OPENS as the unit progresses. It used to be a flat 70% of the
  // pool at every t, which meant the very first sheet of a lesson could draw
  // from all but the hardest 30% — so day one of "2-digit addition
  // (regrouping)" served answers over 100, needing a tens-column carry the
  // curriculum does not teach for another two lessons. Starting at 35% keeps
  // the first sheets inside the part of the pool the lesson has actually
  // taught, and there is still ample variety: 20% of a ~300-problem pool is
  // 60 problems for a 10-problem sheet.
  const tc = Math.min(1, Math.max(0, t));
  const W = Math.min(N, Math.max(count, Math.round(N * (0.2 + 0.5 * tc))));
  const start = N <= count ? 0 : Math.round(t * (N - W));
  // The window must hold `count` distinct FACTS, not just distinct questions:
  // "3 + 3" and "3 + 3 = ?" are one fact in two formats, and a window counted
  // by question served both on one sheet (5 of 30 items were repeats on the
  // first counting-on sheet). Widen past W until enough facts are inside.
  let end = N <= count ? N : start + W;
  if (N > count) { const facts = new Set<string>(); for (let i = start; i < end; i++) facts.add(factOf(sorted[i].q)); while (end < N && facts.size < count) facts.add(factOf(sorted[end++].q)); }
  const win = N <= count ? sorted : sorted.slice(start, end);
  // Seeded sample of `count` distinct items from the window (round-robin if the
  // window is smaller than a sheet — small fact sets must repeat).
  const bag = shuffle(win.length ? win : sorted, rng);
  if (!bag.length) return [];
  const chosen: AProblem[] = [];
  if (bag.length < count) {
    for (let i = 0; i < count; i++) chosen.push(bag[i % bag.length]);
  } else {
    // One format per fact on a sheet; the format is whichever the shuffle
    // reaches first, so a fact is typed on one sheet and multiple-choice on
    // the next. A sheet comes up short only when the pool has fewer facts.
    const facts = new Set<string>();
    for (const p of bag) { const f = factOf(p.q); if (facts.has(f)) continue; facts.add(f); chosen.push(p); if (chosen.length === count) break; }
  }
  // Interleave + de-pattern so nothing is fillable from a sequence.
  return arrangeNoPattern(shuffle(chosen, rng));
}
// The fact behind a question: the multiple-choice form is the direct form with
// " = ?" appended, so stripping it names the fact for every operation.
const factOf = (q: string) => q.replace(/ = \?$/, "");
const distinctFacts = (pool: AProblem[]) => new Set(pool.map((p) => factOf(p.q))).size;

// ── Public API ────────────────────────────────────────────────────────────────
/** Resolve an arithmetic micro-skill's lesson by its unit label (exact match
 *  across all four operation curricula; labels are unit-unique). Without this,
 *  M3–M6 lessons fell back to KEYWORD-matched tutorials — "Fact families &
 *  missing FACTOR" matched the M12 factoring tutorial (user-reported). */
export function getArithmeticMicroLesson(label: string, levelCode?: string): { goal: string; bigIdea: string; example: { problem: string; steps: string[]; answer: string }; umbrella: string } | null {
  const only = levelCode ? Object.keys(SKILL_CODE).find((k) => SKILL_CODE[k] === levelCode) : undefined;
  for (const [skill, units] of Object.entries(CURRICULA)) {
    if (only && skill !== only) continue;
    const u = units.find((x) => x.label === label);
    if (u) {
      const g = u.objective.replace(/^Student /, "").replace(/^./, (c) => c.toUpperCase());
      return { goal: g, bigIdea: g, example: u.example, umbrella: skill.charAt(0) + skill.slice(1).toLowerCase() };
    }
  }
  return null;
}

export function isArithmeticSkill(skill: string): boolean {
  return skill in CURRICULA;
}

/**
 * ALGORITHM units — multi-step written procedures, as opposed to fact recall.
 * Expert finding (the Ridwan incident): algorithm acquisition is a step
 * function, so grading day 1 of one of these units at >=90% evaluates the
 * child ON the acquisition day — they were "mathematically guaranteed to fail".
 * The day-clear gate uses this to grant a LEARNING DAY (advance on completion,
 * not accuracy) the first day a child meets one of these units.
 */
const ALGORITHM_UNIT_LABELS = new Set([
  "Break apart to multiply (no carrying)",
  "Carrying in multiplication",
  "2-digit × 1-digit",
  "2-digit × 2-digit",
  "2-digit addition (regrouping)",
  "2-digit subtraction (regrouping)",
  "Division with remainders",
  "2-digit & 3-digit ÷ 1-digit",
  "3-digit addition & three addends",
  "3-digit subtraction (regrouping)",
]);

/** Sheet size for algorithm units. A 2-digit × 2-digit problem is four
 *  multiplications and an addition — 30 of them × 3 sheets was 90 long
 *  computations a day. Ten per sheet keeps a day at ~30, which is practice,
 *  not a grind (field report: a capable child taking 11+ minutes per sheet). */
export const ALGORITHM_SHEET_SIZE = 10;
export function isAlgorithmUnit(label: string | null | undefined): boolean {
  return !!label && ALGORITHM_UNIT_LABELS.has(label);
}

// Ordered skill map (real content units) for an arithmetic skill.
export function arithmeticUnits(skill: string): { index: number; id: string; label: string; objective: string; grade: string; range: [number, number] }[] {
  return (CURRICULA[skill] ?? []).map((u, i) => ({ index: i, id: u.id, label: u.label, objective: u.objective, grade: u.grade, range: u.range }));
}

/** Is the missing-number form allowed on this sheet of this unit? */
export function allowsMissingForms(skill: string, unitIndex: number, sheetNumber: number): boolean {
  const units = CURRICULA[skill];
  const unit = units[unitIndex];
  if (/missing|fact famil/i.test(unit.label)) return true;
  const factFamily = units.findIndex((u) => /fact-family/.test(u.id));
  if (factFamily !== -1 && unitIndex < factFamily) return false;
  return sheetNumber !== unit.range[0];
}
function poolForSheet(skill: string, unitIndex: number, sheetNumber: number): AProblem[] {
  const unit = CURRICULA[skill][unitIndex];
  let pool = buildScoredPool(skill, unitIndex);
  if (sheetNumber === unit.range[0]) pool = pool.filter((p) => !p.late);
  return allowsMissingForms(skill, unitIndex, sheetNumber) ? pool : pool.filter((p) => !/___/.test(p.q));
}

export function generateArithmeticSheet(
  skill: ShopSkill, sheetNumber: number, totalSheets: number, problemCount = 30,
): WorksheetData {
  const ui = unitIndexForSheet(skill, sheetNumber);
  const unit = CURRICULA[skill][ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;
  // Long-computation units get short sheets — the cap lives here, not in the
  // callers, so every path (daily packet, print, vacation pack) agrees.
  if (isAlgorithmUnit(unit.label)) problemCount = Math.min(problemCount, ALGORITHM_SHEET_SIZE);

  const pool = poolForSheet(skill, ui, sheetNumber);
  // A fact unit has as many questions as it has facts. Doubles is twelve
  // facts; before the fact-family lesson the missing-number form is untaught
  // and stays off the sheet, so a 30-slot sheet would have to repeat. A child
  // never answers the same question twice on one sheet — the sheet is shorter.
  problemCount = Math.min(problemCount, distinctFacts(pool));
  const selected = selectProblems(pool, t, problemCount, hashStr(`${skill}:${sheetNumber}`));
  const problems = selected.map((p, i) => ({
    id: nanoid(8),
    type: (p.type ?? "arithmetic") as "arithmetic" | "multiple_choice" | "true_false",
    question: p.q, answer: p.a, points: 1,
    ...(p.options ? { options: p.options } : {}),
    zone: (Math.floor(i / Math.ceil(problemCount / 5)) + 1) as 1 | 2 | 3 | 4 | 5,
  }));
  const answerKey = problems.map(p => ({ id: p.id, answer: p.answer }));
  const isFirstOfUnit = sheetNumber === unit.range[0];

  return {
    problems, answerKey,
    workedExample: isFirstOfUnit ? unit.example : undefined,
    meta: {
      skill, skillCode: SKILL_CODE[skill] ?? "M3", sheetNumber, totalSheets,
      subSkillLabel: unit.label, gradeLevel: unit.grade, difficultyStars: unit.stars,
      learningObjective: unit.objective,
      mode: isFirstOfUnit ? "tutorial" : "practice",
      estimatedMinutes: 10 + Math.round(t * 8),
    },
  };
}

// ── Self-validation ───────────────────────────────────────────────────────────
export function validateArithmetic(skill: string, totalSheets = 100): {
  ok: boolean; issues: string[]; gpi: number[];
} {
  const issues: string[] = [];
  const gpi: number[] = [];
  const units = CURRICULA[skill];

  let expectedNext = 1;
  for (const u of units) {
    const sz = new Set(u.pool().map(p => p.key)).size;
    if (sz < 30) issues.push(`${skill}/${u.id}: unique pool ${sz} < 30`);
    if (u.range[0] !== expectedNext) issues.push(`${skill}/${u.id}: range gap at ${u.range[0]} (expected ${expectedNext})`);
    expectedNext = u.range[1] + 1;
  }
  if (expectedNext - 1 !== totalSheets) issues.push(`${skill}: covers ${expectedNext - 1} sheets, expected ${totalSheets}`);

  let prev = -Infinity;
  for (let s = 1; s <= totalSheets; s++) {
    const ui = unitIndexForSheet(skill, s);
    const unit = units[ui];
    const span = unit.range[1] - unit.range[0];
    const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
    const sel = selectProblems(buildScoredPool(skill, ui), t, 30, hashStr(`${skill}:${s}`));
    // NOTE: within-sheet order is intentionally interleaved now (not ascending),
    // so we no longer assert per-sheet ascending. Duplicates within a sheet are
    // only flagged when the unit pool is large enough to avoid them.
    const poolSize = new Set(buildScoredPool(skill, ui).map(p => p.key)).size;
    const dup = sel.length - new Set(sel.map(p => p.key)).size;
    if (dup > 0 && poolSize >= 30) issues.push(`${skill} sheet ${s}: ${dup} duplicate(s) (pool=${poolSize})`);
    const factDup = sel.length - new Set(sel.map(p => factOf(p.q))).size;
    if (factDup > 0 && distinctFacts(buildScoredPool(skill, ui)) >= 30) issues.push(`${skill} sheet ${s}: ${factDup} fact(s) in two formats`);
    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    prev = Math.max(prev, mean);
  }
  return { ok: issues.length === 0, issues, gpi };
}

// ── Curriculum acceptance checks (curriculum-expert certification) ─────────────
// Certifies a GENERATED sheet is pedagogically sound, not merely non-repetitive:
//   • non-predictability: no equal-adjacent answers, no 3-in-a-row monotonic,
//     answer sequence fails a constant-step (linear) fit
//   • ≥2 distinct formats present
//   • for STRATEGY-staged early units: the unit's target strategy dominates
//     (~≥55% after spiral review) so the new idea isn't crowded out
export function validateCurriculumStage(skill: string, totalSheets = 100): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const units = CURRICULA[skill];
  if (!units) return { ok: true, issues };
  for (const unit of units) {
    const pool = unit.pool();
    const stratTagged = pool.filter(p => p.strat).length > pool.length * 0.5;
    // target strategy = modal strat among the unit's own (non-review) facts
    const stratCounts: Record<string, number> = {};
    for (const p of pool) if (p.strat) stratCounts[p.strat] = (stratCounts[p.strat] || 0) + 1;
    const target = Object.entries(stratCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    for (const s of [unit.range[0], Math.round((unit.range[0] + unit.range[1]) / 2)]) {
      const span = unit.range[1] - unit.range[0];
      const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
      const sel = selectProblems(poolForSheet(skill, unitIndexForSheet(skill, s), s), t, 30, hashStr(`${skill}:${s}`));
      const ans = sel.map(p => Number(p.a));
      // non-predictability
      let eqAdj = 0; for (let i = 1; i < sel.length; i++) if (Number.isFinite(ans[i]) && ans[i] === ans[i - 1]) eqAdj++;
      if (eqAdj > 1) issues.push(`${skill}/${unit.id} sheet ${s}: ${eqAdj} equal-adjacent answers`);
      let mono = 0; for (let i = 2; i < ans.length; i++) if ([ans[i], ans[i - 1], ans[i - 2]].every(Number.isFinite)) { const d1 = ans[i - 1] - ans[i - 2], d2 = ans[i] - ans[i - 1]; if ((d1 > 0 && d2 > 0) || (d1 < 0 && d2 < 0)) mono++; }
      if (mono > 2) issues.push(`${skill}/${unit.id} sheet ${s}: ${mono} monotonic runs`);
      // constant-step (linear) fit on numeric answers — must FAIL (not a simple sequence)
      const nums = ans.filter(Number.isFinite); const steps = new Set<number>(); for (let i = 1; i < nums.length; i++) steps.add(nums[i] - nums[i - 1]);
      if (nums.length > 8 && steps.size <= 2) issues.push(`${skill}/${unit.id} sheet ${s}: answer sequence too regular (steps=${steps.size})`);
      // format variety
      const fmts = new Set(sel.map(p => p.options ? (p.type === "true_false" ? "tf" : "mc") : (/___/.test(p.q) ? "missing" : "direct")));
      if (fmts.size < 2 && allowsMissingForms(skill, unitIndexForSheet(skill, s), s)) issues.push(`${skill}/${unit.id} sheet ${s}: only ${fmts.size} format`);
      // strategy dominance (staged units only)
      if (stratTagged && target) {
        const onTarget = sel.filter(p => p.strat === target).length / sel.length;
        if (onTarget < 0.45) issues.push(`${skill}/${unit.id} sheet ${s}: target strategy '${target}' only ${(onTarget * 100).toFixed(0)}%`);
      }
    }
  }
  return { ok: issues.length === 0, issues };
}


