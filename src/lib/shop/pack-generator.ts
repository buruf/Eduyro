// src/lib/shop/pack-generator.ts
// Generates structured 100-sheet packs for the public shop.
// Each skill has a defined progression of difficulty ranges so the
// pack matches the customer's expectation (no random shuffling between bands).

import { nanoid } from "nanoid";
import type { Problem, AnswerKeyEntry } from "@/types";

// ─────────────────────────────────────────────
// Skill definitions
// ─────────────────────────────────────────────

export type ShopSkill = "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION";

export const SHOP_SKILLS: Record<ShopSkill, {
  label: string;
  description: string;
  iconEmoji: string;
  totalSheets: number;
  problemsPerSheet: number;
  bands: ShopBand[];
}> = {
  ADDITION: {
    label: "Addition",
    description: "From single digits to 100. Builds confidence and speed.",
    iconEmoji: "➕",
    totalSheets: 100,
    problemsPerSheet: 50, // baseline for catalog display
    bands: [
      { id: "add-1-10",    label: "Adding 1–10",     sheetCount: 20, difficulty: "easy",        problemCount: 50 },
      { id: "add-10-20",   label: "Adding 10–20",    sheetCount: 20, difficulty: "easy",        problemCount: 50 },
      { id: "add-mix-1-20", label: "Mixed 1–20",     sheetCount: 20, difficulty: "standard",    problemCount: 40 },
      { id: "add-20-100",  label: "Adding 20–100",   sheetCount: 40, difficulty: "challenging", problemCount: 25 },
    ],
  },
  SUBTRACTION: {
    label: "Subtraction",
    description: "From basics to 3-digit subtraction with regrouping.",
    iconEmoji: "➖",
    totalSheets: 100,
    problemsPerSheet: 50,
    bands: [
      { id: "sub-1-10",     label: "Subtracting 1–10",   sheetCount: 20, difficulty: "easy",        problemCount: 50 },
      { id: "sub-10-20",    label: "Subtracting 10–20",  sheetCount: 20, difficulty: "easy",        problemCount: 50 },
      { id: "sub-mix-1-20", label: "Mixed 1–20",         sheetCount: 20, difficulty: "standard",    problemCount: 40 },
      { id: "sub-20-100",   label: "Subtracting to 100", sheetCount: 40, difficulty: "challenging", problemCount: 25 },
    ],
  },
  MULTIPLICATION: {
    label: "Multiplication",
    description: "Times tables 1–12, then mixed practice for fluency.",
    iconEmoji: "✖️",
    totalSheets: 100,
    problemsPerSheet: 50,
    bands: [
      { id: "mul-2-5",      label: "×2 through ×5",     sheetCount: 20, difficulty: "easy",        problemCount: 50 },
      { id: "mul-6-9",      label: "×6 through ×9",     sheetCount: 20, difficulty: "easy",        problemCount: 50 },
      { id: "mul-mix-2-9",  label: "Mixed ×2 to ×9",    sheetCount: 20, difficulty: "standard",    problemCount: 40 },
      { id: "mul-10-12",    label: "×10, ×11, ×12",     sheetCount: 20, difficulty: "challenging", problemCount: 25 },
      { id: "mul-all",      label: "All tables mixed",  sheetCount: 20, difficulty: "challenging", problemCount: 25 },
    ],
  },
  DIVISION: {
    label: "Division",
    description: "Basic facts through division with remainders.",
    iconEmoji: "➗",
    totalSheets: 100,
    problemsPerSheet: 50,
    bands: [
      { id: "div-2-5",       label: "÷2 through ÷5",        sheetCount: 20, difficulty: "easy",        problemCount: 50 },
      { id: "div-6-9",       label: "÷6 through ÷9",        sheetCount: 20, difficulty: "easy",        problemCount: 50 },
      { id: "div-mix-2-9",   label: "Mixed ÷2 to ÷9",       sheetCount: 20, difficulty: "standard",    problemCount: 40 },
      { id: "div-10-12",     label: "÷10, ÷11, ÷12",        sheetCount: 20, difficulty: "challenging", problemCount: 25 },
      { id: "div-remainders", label: "Division with remainders", sheetCount: 20, difficulty: "challenging", problemCount: 25 },
    ],
  },
};

export interface ShopBand {
  id: string;
  label: string;
  sheetCount: number;
  difficulty: "easy" | "standard" | "challenging";
  problemCount: number; // problems per sheet for this band
}

// ─────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────

export const SHOP_PRICING: Record<number, { amountCents: number; label: string }> = {
  1: { amountCents: 399, label: "$3.99" },
  2: { amountCents: 599, label: "$5.99" },
  3: { amountCents: 799, label: "$7.99" },
  4: { amountCents: 999, label: "$9.99" },
};

export function calculatePrice(skills: ShopSkill[]): number {
  const count = skills.length;
  if (count < 1 || count > 4) throw new Error(`Invalid skill count: ${count}`);
  return SHOP_PRICING[count].amountCents;
}

// ─────────────────────────────────────────────
// Pack generation
// ─────────────────────────────────────────────

export interface PackSheet {
  sheetNumber: number;
  title: string;
  bandLabel: string;
  difficulty: "easy" | "standard" | "challenging";
  problems: Problem[];
  answerKey: AnswerKeyEntry[];
}

export interface GeneratedPack {
  skill: ShopSkill;
  label: string;
  sheets: PackSheet[];
}

/**
 * Generate the full 100-sheet pack for a single skill.
 * Sheets are produced in order: bands appear sequentially (no shuffling
 * across bands), so a customer working through page 1, 2, 3... progresses
 * naturally from easy → challenging within the pack.
 *
 * Within each band, problems also ramp: sheet 1 of a band uses the easier
 * end of the band's number range, and the last sheet of the band uses the
 * hardest end. This makes the pack feel like a gradual progression rather
 * than identical-difficulty problems throughout.
 */
export function generatePackForSkill(skill: ShopSkill): GeneratedPack {
  const config = SHOP_SKILLS[skill];
  const sheets: PackSheet[] = [];
  let sheetNum = 1;

  for (const band of config.bands) {
    for (let i = 1; i <= band.sheetCount; i++) {
      // Progress within this band: 0.0 for first sheet, 1.0 for last sheet
      const progress = band.sheetCount === 1
        ? 0.5
        : (i - 1) / (band.sheetCount - 1);

      const { problems, answerKey } = generateProblemsForBand({
        skill,
        bandId: band.id,
        problemCount: band.problemCount,
        seed: `${skill}-${band.id}-${i}`,
        progress,
      });
      sheets.push({
        sheetNumber: sheetNum,
        title: `${band.label} — Sheet ${i}`,
        bandLabel: band.label,
        difficulty: band.difficulty,
        problems,
        answerKey,
      });
      sheetNum++;
    }
  }

  return {
    skill,
    label: config.label,
    sheets,
  };
}

// ─────────────────────────────────────────────
// Problem generators per band
// ─────────────────────────────────────────────

interface BandGenParams {
  skill: ShopSkill;
  bandId: string;
  problemCount: number;
  seed: string;
  progress: number; // 0.0 = first sheet (easiest), 1.0 = last sheet (hardest)
}

function generateProblemsForBand(params: BandGenParams): {
  problems: Problem[];
  answerKey: AnswerKeyEntry[];
} {
  const rng = seedRng(params.seed);
  const items: Array<[string, string]> = [];

  // For the very first sheet of beginner bands, lead with a few "warmup"
  // problems that begin at 1+1, 1+2 etc. so the customer's child has an
  // immediate gentle start. After the warmups, fall through to the RNG.
  const warmup = params.progress === 0 ? getWarmupProblems(params.bandId) : [];
  for (const w of warmup) {
    if (items.length >= params.problemCount) break;
    items.push(w);
  }

  while (items.length < params.problemCount) {
    items.push(generateOneProblem(params.bandId, rng, params.progress));
  }

  const problems: Problem[] = items.map(([q]) => ({
    id: nanoid(8),
    type: "arithmetic",
    question: q,
  } as Problem));

  const answerKey: AnswerKeyEntry[] = items.map(([, a], idx) => ({
    id: problems[idx].id,
    answer: a,
  }));

  return { problems, answerKey };
}

/**
 * Hardcoded gentle warmup sequences for the first sheet of beginner bands.
 * After these run out, the RNG-driven generator takes over.
 */
function getWarmupProblems(bandId: string): Array<[string, string]> {
  switch (bandId) {
    case "add-1-10":
      return [
        ["1 + 1", "2"], ["1 + 2", "3"], ["1 + 3", "4"], ["1 + 4", "5"], ["1 + 5", "6"],
        ["2 + 1", "3"], ["2 + 2", "4"], ["2 + 3", "5"], ["2 + 4", "6"], ["2 + 5", "7"],
        ["3 + 1", "4"], ["3 + 2", "5"], ["3 + 3", "6"], ["4 + 1", "5"], ["4 + 2", "6"],
      ];
    case "sub-1-10":
      return [
        ["2 − 1", "1"], ["3 − 1", "2"], ["3 − 2", "1"], ["4 − 1", "3"], ["4 − 2", "2"],
        ["4 − 3", "1"], ["5 − 1", "4"], ["5 − 2", "3"], ["5 − 3", "2"], ["5 − 4", "1"],
        ["6 − 1", "5"], ["6 − 2", "4"], ["6 − 3", "3"], ["7 − 1", "6"], ["7 − 2", "5"],
      ];
    case "mul-2-5":
      return [
        ["2 × 1", "2"], ["2 × 2", "4"], ["2 × 3", "6"], ["2 × 4", "8"], ["2 × 5", "10"],
        ["3 × 1", "3"], ["3 × 2", "6"], ["3 × 3", "9"], ["3 × 4", "12"], ["3 × 5", "15"],
        ["4 × 1", "4"], ["4 × 2", "8"], ["4 × 3", "12"], ["5 × 1", "5"], ["5 × 2", "10"],
      ];
    case "div-2-5":
      return [
        ["2 ÷ 2", "1"], ["4 ÷ 2", "2"], ["6 ÷ 2", "3"], ["8 ÷ 2", "4"], ["10 ÷ 2", "5"],
        ["3 ÷ 3", "1"], ["6 ÷ 3", "2"], ["9 ÷ 3", "3"], ["12 ÷ 3", "4"], ["15 ÷ 3", "5"],
        ["4 ÷ 4", "1"], ["8 ÷ 4", "2"], ["12 ÷ 4", "3"], ["5 ÷ 5", "1"], ["10 ÷ 5", "2"],
      ];
  }
  return [];
}

/**
 * Lerp helper — used to scale the upper end of a range based on progress.
 * lerpRange(0.0, 1, 10) = 1 (easiest end)
 * lerpRange(0.5, 1, 10) = 5 (mid)
 * lerpRange(1.0, 1, 10) = 10 (hardest end)
 */
function lerpUpper(progress: number, lo: number, hi: number): number {
  // Start at lo + a small floor (so even sheet 1 has some variety) then ramp to hi
  const minRange = Math.max(lo + 2, Math.ceil(lo + (hi - lo) * 0.15));
  return Math.round(minRange + (hi - minRange) * progress);
}

function generateOneProblem(bandId: string, rng: () => number, progress: number = 0.5): [string, string] {
  const r = (lo: number, hi: number) => Math.floor(rng() * (hi - lo + 1)) + lo;

  switch (bandId) {
    // ── Addition — ramp the upper end of the range with progress ──
    case "add-1-10": {
      const max = lerpUpper(progress, 1, 10);
      const a = r(1, max), b = r(1, max);
      return [`${a} + ${b}`, String(a + b)];
    }
    case "add-10-20": {
      const max = lerpUpper(progress, 10, 20);
      const a = r(10, max), b = r(1, Math.min(10, max - 5));
      return [`${a} + ${b}`, String(a + b)];
    }
    case "add-mix-1-20": {
      const max = lerpUpper(progress, 5, 20);
      const a = r(1, max), b = r(1, max);
      return [`${a} + ${b}`, String(a + b)];
    }
    case "add-20-100": {
      const max = lerpUpper(progress, 30, 100);
      const a = r(20, max), b = r(10, Math.max(15, Math.floor(max / 2)));
      return [`${a} + ${b}`, String(a + b)];
    }

    // ── Subtraction ──
    case "sub-1-10": {
      const max = lerpUpper(progress, 2, 10);
      const a = r(2, max), b = r(1, a);
      return [`${a} − ${b}`, String(a - b)];
    }
    case "sub-10-20": {
      const max = lerpUpper(progress, 10, 20);
      const a = r(10, max), b = r(1, Math.min(10, a - 1));
      return [`${a} − ${b}`, String(a - b)];
    }
    case "sub-mix-1-20": {
      const max = lerpUpper(progress, 5, 20);
      const a = r(5, max), b = r(1, a - 1);
      return [`${a} − ${b}`, String(a - b)];
    }
    case "sub-20-100": {
      const max = lerpUpper(progress, 30, 100);
      const a = r(20, max), b = r(5, a - 1);
      return [`${a} − ${b}`, String(a - b)];
    }

    // ── Multiplication ──
    case "mul-2-5": {
      const maxA = lerpUpper(progress, 2, 5);
      const maxB = lerpUpper(progress, 3, 12);
      const a = r(2, maxA), b = r(2, maxB);
      return [`${a} × ${b}`, String(a * b)];
    }
    case "mul-6-9": {
      const maxA = lerpUpper(progress, 6, 9);
      const maxB = lerpUpper(progress, 3, 12);
      const a = r(6, maxA), b = r(2, maxB);
      return [`${a} × ${b}`, String(a * b)];
    }
    case "mul-mix-2-9": {
      const max = lerpUpper(progress, 3, 9);
      const a = r(2, max), b = r(2, max);
      return [`${a} × ${b}`, String(a * b)];
    }
    case "mul-10-12": {
      const max = lerpUpper(progress, 10, 12);
      const a = r(10, max), b = r(2, 12);
      return [`${a} × ${b}`, String(a * b)];
    }
    case "mul-all": {
      const max = lerpUpper(progress, 4, 12);
      const a = r(2, max), b = r(2, max);
      return [`${a} × ${b}`, String(a * b)];
    }

    // ── Division (whole-number quotients except the remainders band) ──
    case "div-2-5": {
      const maxD = lerpUpper(progress, 2, 5);
      const maxQ = lerpUpper(progress, 2, 12);
      const d = r(2, maxD), q = r(1, maxQ);
      return [`${d * q} ÷ ${d}`, String(q)];
    }
    case "div-6-9": {
      const maxD = lerpUpper(progress, 6, 9);
      const maxQ = lerpUpper(progress, 2, 12);
      const d = r(6, maxD), q = r(2, maxQ);
      return [`${d * q} ÷ ${d}`, String(q)];
    }
    case "div-mix-2-9": {
      const max = lerpUpper(progress, 3, 9);
      const d = r(2, max), q = r(2, max);
      return [`${d * q} ÷ ${d}`, String(q)];
    }
    case "div-10-12": {
      const maxD = lerpUpper(progress, 10, 12);
      const d = r(10, maxD), q = r(2, 12);
      return [`${d * q} ÷ ${d}`, String(q)];
    }
    case "div-remainders": {
      const max = lerpUpper(progress, 3, 9);
      const d = r(2, max), q = r(2, 12), rem = r(1, d - 1);
      const dividend = d * q + rem;
      return [`${dividend} ÷ ${d}`, `${q} R ${rem}`];
    }
  }

  // Fallback (should never hit)
  return ["1 + 1", "2"];
}

// ─────────────────────────────────────────────
// Seeded PRNG — Mulberry32 — so the same seed always produces
// the same problem sequence (idempotent regeneration).
// ─────────────────────────────────────────────

function seedRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
