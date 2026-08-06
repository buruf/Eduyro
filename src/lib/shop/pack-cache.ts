// src/lib/shop/pack-cache.ts
// Generates shop pack PDFs on demand and stores them.
// Storage: R2/S3 if configured, otherwise /tmp (ephemeral on Vercel).
// Cache key format: shop-packs/v2/{SKILL}.pdf

import { generatePackForSkill, SHOP_SKILLS, type ShopSkill } from "./pack-generator";
import { renderPackToPdf } from "@/lib/pdf/renderer";
import { uploadToS3, getSignedDownloadUrl } from "@/lib/pdf/generator";
import { writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join } from "path";

const CACHE_VERSION = "v113"; // M5 full bridge: Multiplying-tens (53-58) + Break-apart (59-68) + Carrying (69-78, scaffolded ones-first); 2d1d 79-84, 2d2d 85-96, review 97-100; learning-day flag. v112: M5 bridge: new unit 7 Break-apart-to-multiply (sheets 53-62), x10/11/12 demoted to 4 sheets, 2d-x-1d now 63-76. v111: Sight-word questions now generated FROM the chunk just taught (never asks for an unshown word); self-containment sweep over all 1,068 sheets in the gate. v110: R2 sight-word units now SHOW the word list before testing it; Grade 1 no longer receives Grade 2-3 passages; passage questions no longer leak into worked examples. v109: Track B B1: Grades 2-3 reading units now serve band-scoped 200w+ passages instead of the shared 79-word bee text. v108: Track A: R1-R10 phonics units now serve word-level decoding practice + a stage-appropriate DECODABLE text instead of adult passages. v107: W0 handwriting (Letter Formation / Spatial Awareness / Basic Copying) now has real handwriting lessons instead of the Letter-Recognition vowels/sounds tutorial; R38 Letters-as-Sources + W7 Plot Arc + W8 Process/Comparison routed correctly; audit now checks the tutorial header + intro. v106: "Expressions · Order integers" no longer inherits the equation-solving family (number-line lesson instead); new order-of-operations and evaluate/substitute families; non-math (R/W/S) coherence gate. v105: Simplify lesson aligned to ONE example (4/8 → 1/2, matching the animation); GCF jargon removed. v104: // Fraction tutorial rebuild (user spec): per-skill lesson families (identify/equivalent/compare/simplify/mixed/add-sub/multiply/divide — "Identify fractions" no longer shows operations rules); scaffold fraction-op steps now full decision procedures with computed numbers (check denominators FIRST → convert → compute → explicit simplify check; Keep-Change-Flip spelled out) — lesson-page worked examples on FRACTIONS/DECIMALS packs regenerate with them. v103: Lesson-depth audit (scripts/audit-shop-lesson-depth.ts, now in `npm run audit:lessons`): every tutorial page's examples must have ≥2 real steps and every page ≥2 usable examples — was 32 thin/7 weak across 136 pages, now 0/0. Fixes: missing-subtrahend/minuend now 3 real steps (was one dense line); trivial ×0/×1 no longer get column-method one-liners; basic ÷ facts (8÷8, 9÷1) no longer get long-division digit-walk (scaffold identity/backwards-multiplication steps instead); "Angles AROUND a point" no longer hijacked by the /round/ing directive matcher (word-bounded) — was printing "If it's 5 or more, round up" on geometry pages; vertical-angles examples explain the X-shape rule; area-model (box) examples show all four partial products; renderer stepsFor now passes subjectSlug MATH so math-gated scaffold handlers fire in PDFs. v102: COMBINED PACK: "Decimals, Percents & Ratios" — one 100-sheet product (sheets 1–50 sample the decimals curriculum every-other-sheet, 51–100 the ratios curriculum; all 15 units + difficulty ramps preserved at half volume). RATIOS hidden from catalog (kept for old purchases); bundles deduped. v101: // Equation-solving worked examples now show REAL both-sides working ("Subtract 3 on BOTH sides — that eliminates the +3: 2x = 8; divide BOTH sides by 2 to isolate x" + a check step) across scaffold (ax+b=c, ax=c, x/d=q, k(x±b)=c, vars-both-sides) and all 8 authored engine examples — replaces bare-arithmetic recipes and "Do the inverse operation" filler. New durable detector scripts/audit-lesson-steps.sh (filler phrases + digitless recipe steps + equation pages must say "both sides") — all 11 packs clean. v100: // Lesson-page quality sweep (user): example cards never split across pages (wrap=false + plot grids auto-shrink when 3+ examples carry grids — the M11 Transformations bleed); conversion examples now show REAL computed steps for all six fraction↔decimal↔percent directions + a dedicated Conversions Key-Ideas tutorial (was showing fraction-anatomy); transformation examples STATE THE RULE first ((x,y)→(−y,x) etc.); any curated example with <2 steps is auto-replaced by the full generated walkthrough; step-less examples never render. Swept all 11 packs: 0 filler/generic steps. v99: // Contents page: every shop pack now opens with a "What this pack covers" page listing all topics with grade + sheet ranges and a how-to-use note (packs ≥10 sheets only, so daily parent packets stay lean). v98: // Polynomial division now taught FACTOR-AND-CANCEL (user): monomial division factors the divisor out of the top and cancels (2x(3x+2)÷2x), binomial division factors the quadratic and cancels the common bracket — across renderer worked steps, both authored unit examples, the Dividing-Polynomials tutorial (Key Ideas + 5 examples), and on-screen scaffold hints. v97: Full shop audit: scaffold worked-steps for ALL remaining forms (decimal ×÷, unlike-denominator + multiply/divide fractions, distribute k(x+b), integers w/ negatives, order-of-ops, inequalities, ratio simplify/proportion/scale, patterns) — 0 filler examples in any pack; general one-instruction-per-sheet strip (Solve for x/Simplify the ratio/Find the missing/Evaluate…when/Write…as-a/Order/Expand) — 0 repeated verbs; fixed NaN decimal column steps. v96: // Cache bump (user-requested) so every shop pack regenerates with the current engines/renderer: mastery copy 95→90, geometry trig pack, plot-drawing worked examples, M12 Tier-1/2 curriculum, print polish. v95: // Authored Plot-points + Transformations concept cards (M11) so those lesson pages stop falling back to the slope-intercept Key Ideas. v94: Comprehensive plot coverage: ALL plot-requiring worked examples now draw their figure — lines, points, y-intercepts, transformation image points, triangles (polygon), parabolas w/ vertex (vertex-drag + "which graph" transforms), unit-circle angles (deg + radian). Audited all levels: 0 gaps / 2151 problems. v93: Plotting worked examples (M10/M11 "Plot the line/point …") now DRAW the solved coordinate grid on the lesson page (PdfCoordGrid renders the line + a plotted point) + real graphing steps instead of "The correct answer is X". Authored Key-Ideas concept cards for all 10 GEOMETRY angle/area units (complementary/supplementary/vertical/line/point/triangle-sum, perimeter, area rect/tri, circles) — lesson pages now show real teaching, not just worked examples. v91: GEOMETRY pack rebalanced ("Angles, Area & Trigonometry"): angle topics cut from ~80 sheets to ~36 (≈6 each), area expanded, NEW trigonometry section (Pythagorean hypotenuse/leg, sin/cos/tan ratios, find-a-side) with a new labelled right-triangle figure (geomright). 2256 geometry answers independently verified. Fixed angle-label overwriting the ray on small angles (<45°) — labels now pushed outward on thin wedges. Trig/Pythagorean lessons route to Right-Triangle-Trig tutorial. v90: Widened Tier-2 factoring pools (perfect-square, grouping, cubes, a=1 quadratics) → 0 duplicate-heavy sheets; early-math "Which is greater/less?" now randomizes display order (correct number was always 2nd). v89: Tier 2 advanced factoring: M12 now 24 units. Added 5 single-task factoring units — Factor trinomials (a≠1) via AC method, Difference of squares, Perfect-square trinomials, Factor by grouping, Sum & difference of cubes. Factoring regrouped as a finale (GCF→a=1→a≠1→diff-sq→perfect-sq→grouping→cubes). Each has its own tutorial + real worked-step branches (polyWorkedSteps detects by answer shape). 780 factoring answers verified by independent expansion. Also fixed a pre-existing wrong authored example (x²+5x+6 → (x+2)(x+3), was (x+2)(x+5)). v88: one-instruction-per-sheet // RULE: one instruction per sheet. M12 mixed-instruction units split into single-task units — classify | identify | degree | standard-form | leading-coef | constant (front), and FOIL | factor-quadratics | box-method (were one mixed unit). Each sheet states its instruction ONCE in the directive; every line is a bare expression (stripped at display time so worked examples keep task context). No spurious "=" on M12 prompts. Widened classify/identify pools. Visually verified via poppler. v87: M12 print polish // M12 print polish: dropped the per-line instruction verb on every new unit (Evaluate/Divide stripped; "Find the degree of"→"Degree of", "Write in standard form:"→"Standard form:", "What is the leading coefficient of"→"Leading coefficient of", "Classify by the number of terms:"→"Classify:") so the directive states it once; long instruction prompts now right-align their answer line so it never strikes through the last term; no stray "=" appended to sentence/÷/period prompts. Visually verified via poppler render. v86: M12 Tier-1 units // M12 POLYNOMIALS expanded from 7→14 units (Tier-1): foundations (identify/classify, degree & standard form, leading coeff/constant, evaluate), multiply-by-a-trinomial, divide-by-monomial, polynomial long division. New lesson tutorials + full worked-example steps for every new form; foundation sheets scatter-mixed so no single-answer sheets. v85: M12 factor-quadratic example steps // M12 FOIL "Factor the quadratic expression: x²+Sx+P" examples now show real factoring steps (find-two-numbers + FOIL check) instead of "The correct answer is X"; verb-strip no longer eats "Factor" from that sentence prompt. v84: M12 worked-example algebra steps + per-line verb strip // M12 worked examples now show full algebra steps (esp. distributing the minus in subtraction: -(2x+1) → -2x-1) instead of "The correct answer is X"; + M12 problems no longer repeat the operation verb on every line (directive states it once). v83: M1/M2 lesson routing + M15 unit-circle print M1/M2 lesson pages fixed (counting/place-value/comparison units were printing the Addition lesson — new placeValueTutorial + counting/compare routing) + M15 unit-circle "angle-drag" items now print a real labelled unit circle to mark by hand (was orphaned "Drag the point…" text). v82: M12 poly lessons + print-normalized poly items + 0×___=0 M12 polynomial lesson pages fixed (were printing grade-1 addition boilerplate; GCF lesson now GCF-specific) + print-normalized interactive poly items (area-model → "list partial products", select-all → "factor the expression") + fixed ambiguous "0 × ___ = 0" (v81: early-math seeded/de-patterned + advanced pool widening + M10 4-phase)
const CACHE_PREFIX  = `shop-packs/${CACHE_VERSION}`;
const SAMPLE_PREFIX = `shop-samples/${CACHE_VERSION}`;

const STORAGE_ROOT = process.env.VERCEL
  ? "/tmp/.local-storage"
  : join(process.cwd(), ".local-storage");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";

const HAS_S3 = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);

export interface CachedPack {
  skill: ShopSkill;
  key: string;
  url: string;
  sizeBytes: number;
  sheetCount: number;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getOrCreatePackPdf(skill: ShopSkill): Promise<CachedPack> {
  const config = SHOP_SKILLS[skill];
  const key    = `${CACHE_PREFIX}/${skill}.pdf`;

  const cached = await tryLoadCached(key);
  if (cached) return { skill, key, url: cached.url, sizeBytes: cached.sizeBytes, sheetCount: config.totalSheets };

  console.log(`[shop-cache] Generating ${skill} pack (cache miss)…`);
  const pack = generatePackForSkill(skill);
  const sheets = pack.sheets.map((s) => {
    const answerMap = new Map((s.answerKey ?? []).map((e: any) => [e.id, String(e.answer)]));
    return {
      problems: s.problems.map((p: any) => ({
        ...p,
        answer: answerMap.get(p.id) ?? String(p.answer ?? ""),
      })),
      skillBand: s.bandLabel,
      meta: s.metaData,
      workedExample: s.workedExampleData,
    };
  });

  const pdfBytes = await renderPackToPdf({
    skillLabel: pack.label,
    skillCode:  pack.skill,
    levelCode:  pack.skill,
    sheets,
  });

  const pdf = Buffer.from(pdfBytes);
  const url = await savePdf(pdf, key);

  return { skill, key, url, sizeBytes: pdf.length, sheetCount: pack.sheets.length };
}

export async function getOrCreateSamplePdf(skill: ShopSkill): Promise<CachedPack> {
  const key = `${SAMPLE_PREFIX}/${skill}-sample.pdf`;

  const cached = await tryLoadCached(key);
  if (cached) return { skill, key, url: cached.url, sizeBytes: cached.sizeBytes, sheetCount: 3 };

  console.log(`[shop-cache] Generating ${skill} sample (cache miss)…`);
  const full         = generatePackForSkill(skill);
  const sampleSheets = full.sheets.slice(0, 3).map((s) => {
    const answerMap = new Map((s.answerKey ?? []).map((e: any) => [e.id, String(e.answer)]));
    return {
      problems: s.problems.map((p: any) => ({
        ...p,
        answer: answerMap.get(p.id) ?? String(p.answer ?? ""),
      })),
      skillBand: s.bandLabel,
      meta: s.metaData,
      workedExample: s.workedExampleData,
    };
  });

  const pdfBytes = await renderPackToPdf({
    skillLabel: `${full.label} — Free Sample`,
    skillCode:  full.skill,
    levelCode:  full.skill,
    sheets:     sampleSheets,
  });

  const pdf = Buffer.from(pdfBytes);
  const url = await savePdf(pdf, key);

  return { skill, key, url, sizeBytes: pdf.length, sheetCount: sampleSheets.length };
}

// ── Storage helpers ──────────────────────────────────────────────────────────

async function savePdf(pdf: Buffer, key: string): Promise<string> {
  if (HAS_S3) {
    console.log(`[shop-cache] Uploading ${key} to R2/S3…`);
    return uploadToS3(pdf, key, "application/pdf");
  }
  // Fallback: local filesystem
  const localPath = join(STORAGE_ROOT, key);
  const dir = localPath.substring(0, localPath.lastIndexOf("/"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(localPath, pdf);
  return `${BASE_URL}/api/local-storage/${encodeURIComponent(key)}`;
}

async function tryLoadCached(key: string): Promise<{ url: string; sizeBytes: number } | null> {
  if (HAS_S3) {
    // With R2/S3 — attempt to get a signed URL. If object doesn't exist,
    // the download will fail but generation will re-run next time.
    // For now, always regenerate if we can't confirm existence cheaply.
    return null;
  }

  // Local filesystem check
  const localPath = join(STORAGE_ROOT, key);
  try {
    const stats = statSync(localPath);
    if (stats.isFile() && stats.size > 0) {
      return {
        url: `${BASE_URL}/api/local-storage/${encodeURIComponent(key)}`,
        sizeBytes: stats.size,
      };
    }
  } catch {
    // not cached
  }
  return null;
}
