// src/lib/worksheet/generator.ts
// Core worksheet generation engine — produces Problem[] for any subject/skill
// Covers all 50+ skills across Math M1-M18, Reading R1-R9, Writing W1-W8, Science S1-S7

import { nanoid } from "nanoid";
import type { Problem, ProblemType, GeneratedWorksheet, AnswerKeyEntry } from "@/types";
import { generateProgressiveSheet, type ShopSkill } from "@/lib/shop/progressive-generator";
import { generateEarlyMathSheet, isEarlyMathLevel } from "@/lib/shop/early-math-engine";
import { generateHigherMathSheet, isHigherMathLevel } from "@/lib/shop/higher-math-engine";
import { adaptiveCount } from "@/lib/math/layout-capacity";

// ── Shared clean-engine bridge ────────────────────────────────────────────────
// The student learning platform (daily packets) and the shop now share ONE
// progression-first engine. MATH levels M1–M12 run on the clean engine and
// inherit its guarantees (no duplicates, monotonic difficulty, ascending sheets):
//   • M1–M2  → early-math engine (counting / number sense), keyed by level code
//   • M3–M12 → skill curriculum engine, via the LEVEL_TO_SKILL map below
// Levels with no clean engine yet (M13–M18) fall back to the legacy generator
// below, as do Reading/Writing/Science.
const LEVEL_TO_SKILL: Record<string, ShopSkill> = {
  M3: "ADDITION", M4: "SUBTRACTION", M5: "MULTIPLICATION", M6: "DIVISION",
  M7: "FRACTIONS", M8: "DECIMALS", M9: "RATIOS", M10: "PRE_ALGEBRA",
  M11: "LINEAR_EQUATIONS", M12: "POLYNOMIALS",
};

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratorConfig {
  subjectSlug: string;
  levelCode: string;
  skillName: string;
  problemCount: number;
  timeLimitMinutes: number;
  difficulty?: number;
  sheetNumber?: number;
  totalSheets?: number;
}

export function generateProblems(config: GeneratorConfig): {
  problems: Problem[];
  answerKey: AnswerKeyEntry[];
} {
  const { subjectSlug, skillName, problemCount, difficulty = 1.0 } = config;

  // ── Clean-engine fast path (MATH M1–M12) ──
  // Returns problems that are already unique and in ascending difficulty order,
  // so we DO NOT shuffle — shuffling would destroy the within-sheet progression.
  if (subjectSlug === "MATH") {
    const sheetN = config.sheetNumber ?? 1;
    const totalN = config.totalSheets ?? 100;

    // M1–M2: early-math engine (keyed by level code)
    if (isEarlyMathLevel(config.levelCode)) {
      // Fill the page by visual weight rather than a fixed count.
      const sample = generateEarlyMathSheet(config.levelCode, sheetN, totalN, 8).problems.map((p) => p.question);
      const ws = generateEarlyMathSheet(config.levelCode, sheetN, totalN, adaptiveCount(sample));
      const problems: Problem[] = ws.problems.map((p) => ({
        id: p.id, type: p.type as ProblemType, question: p.question, answer: p.answer, points: p.points,
      }));
      const answerKey: AnswerKeyEntry[] = ws.answerKey.map((a) => ({ id: a.id, answer: a.answer }));
      return { problems, answerKey };
    }

    // M13–M18: dedicated higher-math engine (Quadratics → Calculus).
    if (isHigherMathLevel(config.levelCode)) {
      const sample = generateHigherMathSheet(config.levelCode, sheetN, totalN, 8).problems.map((p) => p.question);
      const ws = generateHigherMathSheet(config.levelCode, sheetN, totalN, adaptiveCount(sample));
      const problems: Problem[] = ws.problems.map((p) => ({
        id: p.id, type: p.type as ProblemType, question: p.question, answer: p.answer, points: p.points,
      }));
      const answerKey: AnswerKeyEntry[] = ws.answerKey.map((a) => ({ id: a.id, answer: a.answer }));
      return { problems, answerKey };
    }

    // M3–M12 by skill. (M13–M18 handled just above.)
    const skill = LEVEL_TO_SKILL[config.levelCode] ?? "POLYNOMIALS";
    const ws = generateProgressiveSheet(
      skill,
      config.sheetNumber ?? 1,
      config.totalSheets ?? 100,
      problemCount,
    );
    const problems: Problem[] = ws.problems.map((p) => ({
      id: p.id, type: p.type as ProblemType, question: p.question,
      answer: p.answer, points: p.points,
    }));
    const answerKey: AnswerKeyEntry[] = ws.answerKey.map((a) => ({ id: a.id, answer: a.answer }));
    return { problems, answerKey };
  }

  // The WHOLE bank for this (subject, skill), already converted to multiple
  // choice. Memoized — building it is pure but was previously repeated many times
  // per request (here + the mastery helpers). We slice a DISTINCT window per sheet
  // below so consecutive daily sheets differ instead of reshuffling one pool.
  const converted = nonMathBank(subjectSlug, skillName);

  // Reading keeps passages adjacent to their questions, so window by PASSAGE block.
  const hasPassage = converted.some((p) => (p.points ?? 0) === 0 || p.question.startsWith("READ THIS PASSAGE"));
  const sn = Math.max(1, config.sheetNumber ?? 1);
  let final: Problem[];
  if (hasPassage) {
    // Group each passage block (the READ-THIS-PASSAGE header + its questions) and
    // rotate by sheet number, so consecutive comprehension sheets show DIFFERENT
    // passages instead of always the first one. (Uniqueness guard for passages.)
    const blocks: Problem[][] = [];
    for (const p of converted) {
      const isHead = (p.points ?? 0) === 0 || p.question.startsWith("READ THIS PASSAGE");
      if (isHead || blocks.length === 0) blocks.push([p]);
      else blocks[blocks.length - 1].push(p);
    }
    const block = blocks.length ? blocks[(sn - 1) % blocks.length] : converted;
    final = block.slice(0, problemCount);
  } else {
    // UNIQUENESS GUARD: tile the bank into `distinct` NON-OVERLAPPING sheets so a
    // mastery run (sheets 1..distinct) shows entirely different questions instead
    // of the same small pool reshuffled. Sheets beyond `distinct` cycle as review.
    const ordered = [...converted].sort((a, b) => (a.question < b.question ? -1 : 1));
    const { per, distinct } = planNonMathWindow(ordered.length, problemCount);
    if (per === 0) {
      final = [];
    } else {
      const tile = (sn - 1) % distinct;
      const off = tile * per;
      final = ordered.slice(off, off + per); // no wrap → tiles never overlap
    }
  }

  // Fresh ids per call: the cache holds shared template objects, so clone before
  // returning. This keeps stored worksheet problem ids unique (as before) and
  // prevents any caller from mutating the cached bank.
  final = final.map((p) => ({ ...p, id: nanoid(8) }));

  const answerKey: AnswerKeyEntry[] = final.map((p) => ({
    id: p.id,
    answer: p.answer,
    explanation: p.explanation,
  }));

  return { problems: final, answerKey };
}

// Memoized full non-math bank (post multiple-choice conversion) per (subject,
// skill). Pure and deterministic in content, so caching is safe; callers that
// emit sheets clone with fresh ids. Keyed case-insensitively on skill name.
const _nonMathBankCache = new Map<string, Problem[]>();
function nonMathBank(subjectSlug: string, skillName: string): Problem[] {
  const key = `${subjectSlug}::${skillName.toLowerCase()}`;
  const hit = _nonMathBankCache.get(key);
  if (hit) return hit;
  let problems: Problem[] = [];
  switch (subjectSlug) {
    case "READING": problems = generateReadingProblems(skillName, 999); break;
    case "WRITING": problems = generateWritingProblems(skillName, 999); break;
    case "SCIENCE": problems = generateScienceProblems(skillName, 999); break;
    default: problems = []; // MATH handled by the engines; unknown → none
  }
  const converted = ensureMultipleChoice(problems);
  _nonMathBankCache.set(key, converted);
  return converted;
}

// ─────────────────────────────────────────────────────────────────────────────
// Non-math windowing plan (shared by the generator + mastery calc).
// We size each sheet so a skill's bank carves into a small number of DISTINCT,
// non-overlapping sheets (≈NONMATH_TARGET_SHEETS). `distinct` is how many unique
// sheets the bank supports before content must repeat — this is what mastery is
// measured against, so "mastered" means the student worked through the distinct
// content, not the same questions reshuffled.
// ─────────────────────────────────────────────────────────────────────────────
const NONMATH_TARGET_SHEETS = 3;

function planNonMathWindow(len: number, problemCount: number): { per: number; distinct: number } {
  if (len <= 0) return { per: 0, distinct: 0 };
  // Aim for up to NONMATH_TARGET_SHEETS sheets, but never so many that a sheet
  // would be tiny (require ≥5 items per sheet to bother splitting).
  const distinct = Math.max(1, Math.min(NONMATH_TARGET_SHEETS, Math.floor(len / 5)));
  const per = Math.min(problemCount, Math.ceil(len / distinct));
  return { per, distinct };
}

// How many DISTINCT sheets a skill supports — the mastery target for non-math.
// Passage skills: one distinct sheet per passage block. Others: the tiling plan.
export function nonMathDistinctSheets(
  subjectSlug: string,
  _levelCode: string,
  skillName: string,
  problemCount = 20,
): number {
  if (subjectSlug === "MATH") return 8;
  if (subjectSlug !== "READING" && subjectSlug !== "WRITING" && subjectSlug !== "SCIENCE") return 1;
  const converted = nonMathBank(subjectSlug, skillName);
  const passages = converted.filter(
    (p) => (p.points ?? 0) === 0 || p.question.startsWith("READ THIS PASSAGE"),
  ).length;
  if (passages > 0) return Math.max(1, passages);
  return planNonMathWindow(converted.length, problemCount).distinct;
}

// The set of distinct gradable QUESTION TEXTS a non-math skill's bank holds.
// Used for item-level mastery (coverage). Passage headers are excluded — only
// answerable questions count as items. Empty for MATH (engine = unbounded items).
export function nonMathBankQuestions(
  subjectSlug: string,
  _levelCode: string,
  skillName: string,
): string[] {
  if (subjectSlug !== "READING" && subjectSlug !== "WRITING" && subjectSlug !== "SCIENCE") return [];
  const converted = nonMathBank(subjectSlug, skillName);
  const seen = new Set<string>();
  for (const p of converted) {
    if ((p.points ?? 0) === 0 || p.question.startsWith("READ THIS PASSAGE")) continue;
    seen.add(p.question);
  }
  return Array.from(seen);
}

// ─────────────────────────────────────────────────────────────────────────────
// Math sheet meta — the REAL unit label for a given level + sheet number.
// The clean engines teach a multi-unit progression inside one level (e.g. M17
// Pre-Calculus runs Sequences → Series → Limits → Vectors), so a sheet's honest
// title is its current unit, NOT the parent skill name stored on the worksheet.
// Used by the PDF generator so headers say "Arithmetic sequences", not "Limits".
// ─────────────────────────────────────────────────────────────────────────────
export function getMathSheetMeta(
  levelCode: string,
  sheetNumber = 1
): { subSkillLabel: string; learningObjective: string; gradeLevel: string } | null {
  const n = Math.max(1, sheetNumber || 1);
  try {
    const pick = (m: { subSkillLabel: string; learningObjective: string; gradeLevel: string }) =>
      ({ subSkillLabel: m.subSkillLabel, learningObjective: m.learningObjective, gradeLevel: m.gradeLevel });
    // Use a normal problem count: the selector divides by (count − 1), so 1 would
    // throw. We only read .meta, but the engine generates problems regardless.
    if (isEarlyMathLevel(levelCode)) return pick(generateEarlyMathSheet(levelCode, n, 100, 30).meta);
    if (isHigherMathLevel(levelCode)) return pick(generateHigherMathSheet(levelCode, n, 100, 30).meta);
    const skill = LEVEL_TO_SKILL[levelCode];
    if (!skill) return null;
    return pick(generateProgressiveSheet(skill, n, 100, 30, false).meta);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTIPLE-CHOICE CONVERTER (non-math subjects)
// ─────────────────────────────────────────────────────────────────────────────
// Turns free-text questions into 4-option multiple choice. Distractors are
// drawn from sibling answers in the same set, so they stay on-topic. Passage
// blocks pass through untouched; open-ended prompts (write/describe/list, very
// long answers, placeholder answers) are dropped because they can't be fair MC.
// Pulls choices the question already encodes, so we don't invent contradictory
// options. Returns the cleaned question (inline list stripped) + options that
// always include the correct answer.
function parseInlineChoices(question: string, ans: string): { question: string; options: string[] } | null {
  const eq = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

  // (a) Parenthesised slash list:  "(city / London / table / river)"
  const paren = question.match(/\(([^()]*\/[^()]*)\)/);
  if (paren) {
    const opts = paren[1].split("/").map((s) => s.trim()).filter(Boolean);
    if (opts.length >= 2 && opts.length <= 6 && opts.some((o) => eq(o, ans))) {
      const cleaned = question.replace(paren[0], "").replace(/\s{2,}/g, " ").trim();
      return { question: cleaned, options: opts };
    }
  }

  // (b) Trailing slash list after a colon:  "Circle the noun: run / dog / quickly / blue"
  const trail = question.match(/:\s*([^:]*\/[^:]*)$/);
  if (trail) {
    const opts = trail[1].split("/").map((s) => s.trim()).filter(Boolean);
    if (opts.length >= 2 && opts.length <= 6 && opts.some((o) => eq(o, ans))) {
      const cleaned = question.slice(0, question.length - trail[1].length).trim();
      return { question: cleaned, options: opts };
    }
  }

  // (c) Binary "A or B" where the answer is exactly A or B:  "concrete or abstract"
  const binary = question.match(/\b([A-Za-z]+)\s+or\s+([A-Za-z]+)\b/);
  if (binary) {
    const pair = [binary[1], binary[2]];
    if (pair.some((o) => eq(o, ans))) {
      // Preserve the answer's exact casing for grading.
      const options = pair.map((o) => (eq(o, ans) ? ans : o));
      return { question, options };
    }
  }

  return null;
}

function ensureMultipleChoice(problems: Problem[]): Problem[] {
  const pool = Array.from(new Set(
    problems
      .filter((p) => (p.points ?? 0) > 0 && p.answer)
      .map((p) => String(p.answer).trim())
      .filter((a) => a && !a.startsWith("(") && a.length <= 120)
  ));

  const out: Problem[] = [];
  for (const p of problems) {
    // Passage / context blocks → display-only, keep verbatim.
    if ((p.points ?? 0) === 0 || p.question.startsWith("READ THIS PASSAGE")) {
      out.push(p);
      continue;
    }
    // Already multiple choice → keep, but strip a redundant inline choice list
    // that just duplicates the option buttons (e.g. "(cap / cape / cat / can)").
    if (p.options && p.options.length >= 2) {
      const q = p.question.replace(/\s*\([^()]*\/[^()]*\)\s*/, " ").replace(/\s{2,}/g, " ").trim();
      out.push({ ...p, question: q });
      continue;
    }
    const ans = String(p.answer ?? "").trim();

    // 1) Best case — the question already lists its choices (grammar drills):
    //    "(city / London / table / river)" or "Circle the noun: run / dog / …"
    //    or a binary "concrete or abstract". Use those; they're the intended set.
    const inline = parseInlineChoices(p.question, ans);
    if (inline) {
      out.push({ ...p, type: "multiple_choice", question: inline.question, options: inline.options });
      continue;
    }

    const openEnded =
      !ans || ans.startsWith("(") || ans.length > 120 ||
      p.type === "written_response" ||
      /^(write|rewrite|give|list|identify all|name |describe|explain|spell|combine|fix|add an|change to)\b/i.test(p.question);

    // 2) Fallback — synthesise distractors of comparable shape from sibling
    //    answers (short answers get short distractors, sentences get sentences).
    const isShort = ans.length <= 18;
    const candidates = pool.filter((a) =>
      a !== ans && (isShort ? a.length <= 24 : a.length > 12 && a.length <= 120)
    );
    const distractors = shuffleArray(candidates).slice(0, 3);

    if (openEnded || distractors.length < 3) continue; // can't make a fair MC → drop
    out.push({ ...p, type: "multiple_choice", options: shuffleArray([ans, ...distractors]) });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// READING GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

// ─── R2: Phonics generators (Silent E, Long Vowels) ───────────────────────────

// ─── R6: Inference & Prediction (mini-scenario MC) ─────────────────────────────

function generateDrawingConclusionsProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Maya grabbed her umbrella and rain boots before school. What can you conclude?", a: "It looks like it will rain", opts: ["It looks like it will rain", "It is sunny", "She is sick", "She is late"], type: "multiple_choice" },
    { q: "The floor was covered in flour and a cake sat cooling on the counter. What happened?", a: "Someone was baking", opts: ["Someone was baking", "There was a flood", "A window broke", "Nobody was home"], type: "multiple_choice" },
    { q: "Tom yawned, rubbed his eyes, and put his head on the desk. What can you conclude?", a: "He is tired", opts: ["He is tired", "He is hungry", "He is angry", "He is excited"], type: "multiple_choice" },
    { q: "The dog ran to the door wagging its tail when keys jingled. What can you conclude?", a: "The dog expects to go for a walk", opts: ["The dog expects to go for a walk", "The dog is afraid", "The dog is asleep", "The dog is sick"], type: "multiple_choice" },
    { q: "Sara's eyes filled with tears as she read the letter. What can you conclude?", a: "The letter brought strong emotions", opts: ["The letter brought strong emotions", "The letter was blank", "She couldn't read", "It was a bill"], type: "multiple_choice" },
    { q: "The streets were empty, shops were closed, and lights were off. What can you conclude?", a: "It was very late at night (or a holiday)", opts: ["It was very late at night (or a holiday)", "It was noon", "There was a parade", "School had just ended"], type: "multiple_choice" },
    { q: "What is 'drawing a conclusion'?", a: "Using clues plus what you know to decide what is true", opts: ["Using clues plus what you know to decide what is true", "Copying the text exactly", "Guessing with no clues", "Drawing a picture"], type: "multiple_choice" },
    { q: "Ben put on a helmet and knee pads and grabbed his skateboard. What can you conclude?", a: "He is going skateboarding", opts: ["He is going skateboarding", "He is going swimming", "He is going to bed", "He is cooking"], type: "multiple_choice" },
    { q: "The plants were drooping and the soil was dry and cracked. What can you conclude?", a: "The plants need water", opts: ["The plants need water", "The plants were overwatered", "It just rained", "The plants are plastic"], type: "multiple_choice" },
    { q: "Everyone wore coats and scarves and their breath made little clouds. What can you conclude?", a: "It was cold outside", opts: ["It was cold outside", "It was hot", "It was raining", "It was indoors"], type: "multiple_choice" },
    { q: "The classroom was decorated and a banner said 'Congratulations!' What can you conclude?", a: "There was a celebration", opts: ["There was a celebration", "It was a fire drill", "School was cancelled", "Someone was in trouble"], type: "multiple_choice" },
    { q: "A good conclusion is based on:", a: "Evidence from the text", opts: ["Evidence from the text", "A wild guess", "What you wish happened", "The title only"], type: "multiple_choice" },
    { q: "The baby was rubbing its eyes and crying loudly. What can you conclude?", a: "The baby is sleepy or upset", opts: ["The baby is sleepy or upset", "The baby is reading", "The baby is laughing", "The baby is full"], type: "multiple_choice" },
    { q: "His shoes were muddy and his bike was dripping wet. What can you conclude?", a: "He rode through rain or puddles", opts: ["He rode through rain or puddles", "He stayed inside", "It was dry out", "He walked carefully"], type: "multiple_choice" },
    { q: "The cookies were gone and crumbs led to the dog's bed. What can you conclude?", a: "The dog likely ate the cookies", opts: ["The dog likely ate the cookies", "Nobody touched them", "They were never made", "A bird took them"], type: "multiple_choice" },
    { q: "Which sentence is a conclusion, not a fact stated in the text?", a: "The character must have been frightened", opts: ["The character must have been frightened", "The character ran", "It was dark", "She opened the door"], type: "multiple_choice" },
  ], count);
}

function generatePredictingProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Dark clouds rolled in and the wind picked up. What will probably happen next?", a: "It will rain", opts: ["It will rain", "The sun will shine", "It will snow indoors", "Nothing will change"], type: "multiple_choice" },
    { q: "Predicting means:", a: "Using clues to guess what will happen next", opts: ["Using clues to guess what will happen next", "Remembering the start", "Reading the last page first", "Copying the text"], type: "multiple_choice" },
    { q: "Liam wound up and threw the ball toward the batter. What will probably happen next?", a: "The batter will try to hit it", opts: ["The batter will try to hit it", "The game will end", "It will start raining", "Everyone goes home"], type: "multiple_choice" },
    { q: "The pot of water was boiling and Mom added the pasta. What will happen next?", a: "The pasta will cook", opts: ["The pasta will cook", "The water will freeze", "The pot will fly", "The stove turns off"], type: "multiple_choice" },
    { q: "Ana studied hard all week for her spelling test. What will probably happen?", a: "She will likely do well", opts: ["She will likely do well", "She will forget everything", "The test is cancelled", "She will be late"], type: "multiple_choice" },
    { q: "The seeds were planted, watered, and placed in the sun. What will happen over time?", a: "They will sprout and grow", opts: ["They will sprout and grow", "They will disappear", "They will freeze", "Nothing"], type: "multiple_choice" },
    { q: "What clues help you make a prediction?", a: "Details in the text and what usually happens", opts: ["Details in the text and what usually happens", "The page number", "The book's price", "The cover color only"], type: "multiple_choice" },
    { q: "The ice cream sat in the hot sun for an hour. What will happen to it?", a: "It will melt", opts: ["It will melt", "It will freeze harder", "It will grow", "It will turn to stone"], type: "multiple_choice" },
    { q: "Max forgot to set his alarm before a big day. What might happen?", a: "He might oversleep and be late", opts: ["He might oversleep and be late", "He will wake up early", "Time will stop", "He will not need school"], type: "multiple_choice" },
    { q: "The hero stepped toward the dark, creaking door. What will probably happen next?", a: "He will open or enter the door", opts: ["He will open or enter the door", "He will fall asleep", "The story will end happily here", "He will start cooking"], type: "multiple_choice" },
    { q: "A good prediction can change as you:", a: "Read more and get new clues", opts: ["Read more and get new clues", "Close the book", "Skip pages", "Ignore the text"], type: "multiple_choice" },
    { q: "The balloon was filled with more and more air. What will likely happen?", a: "It may pop", opts: ["It may pop", "It will shrink", "It will sink", "It will freeze"], type: "multiple_choice" },
    { q: "The team was down by one point with seconds left. What might happen next?", a: "They will try a final play to win", opts: ["They will try a final play to win", "They will go to sleep", "The game already ended", "They will start over"], type: "multiple_choice" },
    { q: "Clouds cleared and the sun came out after the storm. What will probably happen?", a: "It will get brighter and warmer", opts: ["It will get brighter and warmer", "It will start storming again immediately", "It will snow", "The sun will set instantly"], type: "multiple_choice" },
    { q: "She mixed the batter and poured it into a pan, then opened the oven. What is next?", a: "She will bake it", opts: ["She will bake it", "She will freeze it", "She will throw it away", "She will eat the raw batter pan"], type: "multiple_choice" },
    { q: "Which is the BEST way to check a prediction?", a: "Keep reading to see if it comes true", opts: ["Keep reading to see if it comes true", "Stop reading", "Ask a friend", "Guess again randomly"], type: "multiple_choice" },
  ], count);
}

// ─── R7: Author's Purpose ──────────────────────────────────────────────────────

function generateAuthorsPurposeProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "An author writes a funny story about a talking dog. The purpose is mainly to:", a: "Entertain", opts: ["Entertain", "Inform", "Persuade", "Instruct"], type: "multiple_choice" },
    { q: "A text explains how volcanoes form, with facts and diagrams. The purpose is to:", a: "Inform", opts: ["Entertain", "Inform", "Persuade", "Frighten"], type: "multiple_choice" },
    { q: "An ad says 'Buy our shoes — they're the best you'll ever own!' The purpose is to:", a: "Persuade", opts: ["Entertain", "Inform", "Persuade", "Instruct"], type: "multiple_choice" },
    { q: "A recipe lists steps to bake bread. The author's purpose is to:", a: "Instruct (explain how to do something)", opts: ["Instruct (explain how to do something)", "Entertain", "Persuade", "Scare"], type: "multiple_choice" },
    { q: "The three main purposes for writing are often called:", a: "Persuade, Inform, Entertain (PIE)", opts: ["Persuade, Inform, Entertain (PIE)", "Read, Write, Spell", "Begin, Middle, End", "Who, What, When"], type: "multiple_choice" },
    { q: "A newspaper article reports the facts of a city election. The purpose is to:", a: "Inform", opts: ["Inform", "Entertain", "Persuade", "Instruct"], type: "multiple_choice" },
    { q: "A letter urging people to recycle more is meant to:", a: "Persuade", opts: ["Persuade", "Entertain", "Inform only", "Confuse"], type: "multiple_choice" },
    { q: "A comic strip about a clumsy superhero is written to:", a: "Entertain", opts: ["Entertain", "Inform", "Persuade", "Instruct"], type: "multiple_choice" },
    { q: "Instructions for building a model airplane are meant to:", a: "Instruct", opts: ["Instruct", "Entertain", "Persuade", "Inform about history"], type: "multiple_choice" },
    { q: "Which word signals an author is trying to PERSUADE you?", a: "should", opts: ["should", "then", "first", "once"], type: "multiple_choice" },
    { q: "A travel brochure makes a beach sound amazing so you'll visit. The purpose is to:", a: "Persuade", opts: ["Persuade", "Inform", "Entertain", "Instruct"], type: "multiple_choice" },
    { q: "An encyclopedia entry about tigers is written mainly to:", a: "Inform", opts: ["Inform", "Entertain", "Persuade", "Instruct"], type: "multiple_choice" },
    { q: "A poem written to make readers laugh is meant to:", a: "Entertain", opts: ["Entertain", "Inform", "Persuade", "Instruct"], type: "multiple_choice" },
    { q: "How can you figure out an author's purpose?", a: "Look at what the text is trying to make you think, feel, or do", opts: ["Look at what the text is trying to make you think, feel, or do", "Count the pages", "Look at the price", "Read only the title"], type: "multiple_choice" },
    { q: "A flyer that says 'Vote for cleaner parks!' is written to:", a: "Persuade", opts: ["Persuade", "Entertain", "Inform only", "Instruct"], type: "multiple_choice" },
    { q: "A science textbook chapter on gravity is mainly written to:", a: "Inform", opts: ["Inform", "Entertain", "Persuade", "Amuse"], type: "multiple_choice" },
  ], count);
}

function generateToneMoodProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "'Tone' in writing is:", a: "The author's attitude toward the subject", opts: ["The author's attitude toward the subject", "The feeling the reader gets", "The number of words", "The font size"], type: "multiple_choice" },
    { q: "'Mood' in writing is:", a: "The feeling the text creates in the reader", opts: ["The feeling the text creates in the reader", "The author's opinion", "The main idea", "The setting only"], type: "multiple_choice" },
    { q: "'The gloomy house creaked in the cold, silent night.' The mood is:", a: "Spooky / eerie", opts: ["Spooky / eerie", "Cheerful", "Funny", "Peaceful"], type: "multiple_choice" },
    { q: "'Sunlight danced on the waves as children laughed on the warm sand.' The mood is:", a: "Happy / joyful", opts: ["Happy / joyful", "Scary", "Sad", "Angry"], type: "multiple_choice" },
    { q: "Which word describes a SAD tone?", a: "Mournful", opts: ["Mournful", "Joyful", "Excited", "Playful"], type: "multiple_choice" },
    { q: "An author who uses words like 'wonderful', 'bright', and 'hopeful' creates a tone that is:", a: "Optimistic / positive", opts: ["Optimistic / positive", "Angry", "Frightening", "Bored"], type: "multiple_choice" },
    { q: "'Rain hammered the window as she stared at the empty chair.' The mood is:", a: "Lonely / sad", opts: ["Lonely / sad", "Excited", "Silly", "Hopeful"], type: "multiple_choice" },
    { q: "Authors create mood mainly through:", a: "Word choice and details", opts: ["Word choice and details", "Page numbers", "The author's name", "Chapter count"], type: "multiple_choice" },
    { q: "A tone can be described as 'humorous' when the author is trying to be:", a: "Funny", opts: ["Funny", "Serious", "Angry", "Sad"], type: "multiple_choice" },
    { q: "'Finally! After years of work, she held the trophy high.' The tone is:", a: "Triumphant / proud", opts: ["Triumphant / proud", "Gloomy", "Bored", "Fearful"], type: "multiple_choice" },
    { q: "Which set of words would create a TENSE, suspenseful mood?", a: "Shadows, silence, sudden, creeping", opts: ["Shadows, silence, sudden, creeping", "Sunny, giggle, balloon, picnic", "Calm, gentle, soft, warm", "Plain, normal, ordinary, fine"], type: "multiple_choice" },
    { q: "The difference between tone and mood is:", a: "Tone is the author's feeling; mood is the reader's feeling", opts: ["Tone is the author's feeling; mood is the reader's feeling", "They are exactly the same", "Tone is for poems only", "Mood is the page count"], type: "multiple_choice" },
    { q: "'Ugh, another boring Monday with nothing to do.' The tone is:", a: "Bored / unenthusiastic", opts: ["Bored / unenthusiastic", "Excited", "Grateful", "Hopeful"], type: "multiple_choice" },
    { q: "A peaceful mood might be created by words like:", a: "Calm, gentle, quiet, soft", opts: ["Calm, gentle, quiet, soft", "Crash, scream, panic", "Sprint, shove, slam", "Burn, blast, roar"], type: "multiple_choice" },
    { q: "'How dare you break your promise!' The tone is:", a: "Angry", opts: ["Angry", "Joyful", "Calm", "Sleepy"], type: "multiple_choice" },
    { q: "To identify tone, ask:", a: "How does the author feel about the topic?", opts: ["How does the author feel about the topic?", "How many sentences are there?", "What is the title?", "Who published it?"], type: "multiple_choice" },
  ], count);
}

function generateFactOpinionProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which statement is an OPINION?", a: "Dogs are the best pets in the world.", opts: ["Dogs are the best pets in the world.", "Dogs have four legs.", "Dogs are mammals.", "Dogs can bark."], type: "multiple_choice" },
    { q: "Which statement is a FACT?", a: "Water freezes at 0°C.", opts: ["Water freezes at 0°C.", "Winter is the best season.", "Soup tastes better than salad.", "Math is too hard."], type: "multiple_choice" },
    { q: "A fact is something that:", a: "Can be proven true", opts: ["Can be proven true", "Is what someone believes", "Is always exciting", "Cannot be checked"], type: "multiple_choice" },
    { q: "An opinion is:", a: "A personal feeling or belief", opts: ["A personal feeling or belief", "Something proven true", "A measurement", "A date"], type: "multiple_choice" },
    { q: "Which is an OPINION?", a: "Pizza is the tastiest food.", opts: ["Pizza is the tastiest food.", "Pizza is often round.", "Pizza can have cheese.", "Pizza is baked in an oven."], type: "multiple_choice" },
    { q: "Which is a FACT?", a: "The Earth orbits the Sun.", opts: ["The Earth orbits the Sun.", "Space is the most interesting topic.", "Stars are prettier than planets.", "Everyone loves astronomy."], type: "multiple_choice" },
    { q: "Which word often signals an OPINION?", a: "best", opts: ["best", "measured", "born", "equals"], type: "multiple_choice" },
    { q: "Which is an OPINION?", a: "Summer is more fun than winter.", opts: ["Summer is more fun than winter.", "Summer comes after spring.", "Summer has long days.", "Summer is a season."], type: "multiple_choice" },
    { q: "Which is a FACT?", a: "A triangle has three sides.", opts: ["A triangle has three sides.", "Triangles are the coolest shape.", "Circles are boring.", "Squares are better than rectangles."], type: "multiple_choice" },
    { q: "How can you check if something is a fact?", a: "Look it up in a reliable source", opts: ["Look it up in a reliable source", "Ask if it sounds nice", "See if you agree", "Guess"], type: "multiple_choice" },
    { q: "Which statement contains BOTH a fact and an opinion?", a: "The library has 10,000 books, and it's the best place in town.", opts: ["The library has 10,000 books, and it's the best place in town.", "The library is open on Monday.", "The library is the best.", "The library closes at five."], type: "multiple_choice" },
    { q: "Which is an OPINION?", a: "Recess should be longer.", opts: ["Recess should be longer.", "Recess is at noon.", "Recess lasts 20 minutes.", "Recess is outside."], type: "multiple_choice" },
    { q: "Which is a FACT?", a: "The Pacific is the largest ocean.", opts: ["The Pacific is the largest ocean.", "The ocean is scary.", "Beaches are the best.", "Swimming is boring."], type: "multiple_choice" },
    { q: "Opinions often include words like:", a: "should, best, worst, favorite", opts: ["should, best, worst, favorite", "measured, counted, dated", "equals, contains, weighs", "north, south, east"], type: "multiple_choice" },
    { q: "Which is an OPINION?", a: "Science is the most important subject.", opts: ["Science is the most important subject.", "Science class meets daily.", "We have a science lab.", "Science studies nature."], type: "multiple_choice" },
    { q: "Why is it important to tell fact from opinion?", a: "So you can judge information carefully", opts: ["So you can judge information carefully", "So reading is faster", "So you can skip facts", "So you can ignore the author"], type: "multiple_choice" },
  ], count);
}

function generatePointOfViewProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "'I ran as fast as I could to catch the bus.' This is told in:", a: "First person", opts: ["First person", "Second person", "Third person", "No point of view"], type: "multiple_choice" },
    { q: "'She ran as fast as she could to catch the bus.' This is told in:", a: "Third person", opts: ["First person", "Second person", "Third person", "First person plural"], type: "multiple_choice" },
    { q: "First-person point of view uses the words:", a: "I, me, my, we", opts: ["I, me, my, we", "he, she, they", "you, your", "it, its"], type: "multiple_choice" },
    { q: "Third-person point of view uses the words:", a: "he, she, they, it", opts: ["he, she, they, it", "I, me, my", "you, your", "we, us"], type: "multiple_choice" },
    { q: "'You should always look both ways before crossing.' This is:", a: "Second person", opts: ["Second person", "First person", "Third person", "No narrator"], type: "multiple_choice" },
    { q: "A narrator who is a character IN the story and says 'I' is using:", a: "First person", opts: ["First person", "Third person", "Second person", "Omniscient only"], type: "multiple_choice" },
    { q: "'Third-person omniscient' means the narrator:", a: "Knows the thoughts of all characters", opts: ["Knows the thoughts of all characters", "Knows only one character's thoughts", "Is a character in the story", "Talks to the reader as 'you'"], type: "multiple_choice" },
    { q: "'Third-person limited' means the narrator:", a: "Knows the thoughts of only one character", opts: ["Knows the thoughts of only one character", "Knows everyone's thoughts", "Uses 'I'", "Uses 'you'"], type: "multiple_choice" },
    { q: "Which sentence is in first person?", a: "We built a fort in the backyard.", opts: ["We built a fort in the backyard.", "They built a fort.", "You build a fort.", "She built a fort."], type: "multiple_choice" },
    { q: "Which sentence is in third person?", a: "He felt nervous before the test.", opts: ["He felt nervous before the test.", "I felt nervous.", "We felt nervous.", "You felt nervous."], type: "multiple_choice" },
    { q: "Point of view is:", a: "The perspective from which a story is told", opts: ["The perspective from which a story is told", "The author's age", "The book's length", "The setting"], type: "multiple_choice" },
    { q: "An autobiography is usually written in:", a: "First person", opts: ["First person", "Second person", "Third person", "No point of view"], type: "multiple_choice" },
    { q: "Which words tell you a story is in SECOND person?", a: "you, your", opts: ["you, your", "I, me", "he, she", "they, them"], type: "multiple_choice" },
    { q: "'The soldiers marched while their general watched, knowing each man's fear.' This is:", a: "Third-person omniscient", opts: ["Third-person omniscient", "First person", "Second person", "Third-person limited"], type: "multiple_choice" },
    { q: "Why does point of view matter?", a: "It shapes what the reader knows and feels", opts: ["It shapes what the reader knows and feels", "It sets the page count", "It picks the title", "It has no effect"], type: "multiple_choice" },
    { q: "A story that uses 'I' throughout, sharing only that character's thoughts, is:", a: "First person", opts: ["First person", "Third-person omniscient", "Second person", "Third-person limited"], type: "multiple_choice" },
  ], count);
}

// ─── R8: Figurative Language (device identification) ────────────────────────────

function generateSimileMetaphorProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "'She was as brave as a lion' is a:", a: "Simile", opts: ["Simile", "Metaphor", "Idiom", "Hyperbole"], type: "multiple_choice" },
    { q: "'The classroom was a zoo' is a:", a: "Metaphor", opts: ["Simile", "Metaphor", "Idiom", "Personification"], type: "multiple_choice" },
    { q: "A simile compares two things using:", a: "'like' or 'as'", opts: ["'like' or 'as'", "'is' or 'was' only", "numbers", "rhyme"], type: "multiple_choice" },
    { q: "A metaphor compares two things by:", a: "Saying one thing IS another", opts: ["Saying one thing IS another", "Using 'like' or 'as'", "Asking a question", "Repeating words"], type: "multiple_choice" },
    { q: "'His feet were as cold as ice' is a:", a: "Simile", opts: ["Simile", "Metaphor", "Hyperbole", "Idiom"], type: "multiple_choice" },
    { q: "'Time is a thief' is a:", a: "Metaphor", opts: ["Metaphor", "Simile", "Idiom", "Personification"], type: "multiple_choice" },
    { q: "Which sentence is a simile?", a: "The snow was like a soft white blanket.", opts: ["The snow was like a soft white blanket.", "The snow blanketed the town.", "Snow fell all night.", "It was very cold."], type: "multiple_choice" },
    { q: "Which sentence is a metaphor?", a: "Her eyes were two shining stars.", opts: ["Her eyes were two shining stars.", "Her eyes shone like stars.", "She had bright eyes.", "She looked up at the stars."], type: "multiple_choice" },
    { q: "'He ran like the wind' is a:", a: "Simile", opts: ["Simile", "Metaphor", "Idiom", "Hyperbole"], type: "multiple_choice" },
    { q: "'The world is a stage' is a:", a: "Metaphor", opts: ["Metaphor", "Simile", "Idiom", "Personification"], type: "multiple_choice" },
    { q: "What is being compared in 'Her smile was sunshine'?", a: "Her smile and sunshine", opts: ["Her smile and sunshine", "The sun and the sky", "A smile and a frown", "Day and night"], type: "multiple_choice" },
    { q: "'As busy as a bee' is a:", a: "Simile", opts: ["Simile", "Metaphor", "Idiom", "Hyperbole"], type: "multiple_choice" },
    { q: "Which is a metaphor?", a: "The night was a black velvet sky.", opts: ["The night was a black velvet sky.", "The night was as dark as velvet.", "It got dark at night.", "The sky turned dark."], type: "multiple_choice" },
    { q: "'The baby's skin was as soft as silk' is a:", a: "Simile", opts: ["Simile", "Metaphor", "Personification", "Idiom"], type: "multiple_choice" },
    { q: "The main difference between a simile and a metaphor is:", a: "A simile uses 'like'/'as'; a metaphor does not", opts: ["A simile uses 'like'/'as'; a metaphor does not", "A metaphor uses 'like'/'as'", "They are the same", "A simile must rhyme"], type: "multiple_choice" },
    { q: "'Life is a journey' is a:", a: "Metaphor", opts: ["Metaphor", "Simile", "Idiom", "Hyperbole"], type: "multiple_choice" },
  ], count);
}

function generatePersonificationProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Personification gives human qualities to:", a: "Animals, objects, or ideas", opts: ["Animals, objects, or ideas", "Only people", "Numbers", "Other humans"], type: "multiple_choice" },
    { q: "Which sentence uses personification?", a: "The wind whispered through the trees.", opts: ["The wind whispered through the trees.", "The wind was strong.", "The wind blew the leaves.", "It was a windy day."], type: "multiple_choice" },
    { q: "'The sun smiled down on us' is an example of:", a: "Personification", opts: ["Personification", "Simile", "Hyperbole", "Idiom"], type: "multiple_choice" },
    { q: "Which sentence personifies the alarm clock?", a: "The alarm clock screamed at me to wake up.", opts: ["The alarm clock screamed at me to wake up.", "The alarm clock was loud.", "The alarm rang at six.", "I have an alarm clock."], type: "multiple_choice" },
    { q: "'The flowers danced in the breeze' works because flowers cannot really:", a: "Dance", opts: ["Dance", "Grow", "Bloom", "Smell nice"], type: "multiple_choice" },
    { q: "Which is personification?", a: "The thunder grumbled in the distance.", opts: ["The thunder grumbled in the distance.", "The thunder was loud.", "Thunder followed the lightning.", "There was a storm."], type: "multiple_choice" },
    { q: "'The old car coughed and groaned before it started.' This gives the car:", a: "Human actions", opts: ["Human actions", "A color", "A price", "A size"], type: "multiple_choice" },
    { q: "Which sentence uses personification?", a: "Opportunity knocked on her door.", opts: ["Opportunity knocked on her door.", "She opened the door.", "The door was open.", "There was a knock."], type: "multiple_choice" },
    { q: "'The leaves waved goodbye as autumn arrived.' What is personified?", a: "The leaves", opts: ["The leaves", "Autumn's color", "The wind speed", "The ground"], type: "multiple_choice" },
    { q: "Personification is a type of:", a: "Figurative language", opts: ["Figurative language", "Punctuation", "Spelling rule", "Rhyme scheme"], type: "multiple_choice" },
    { q: "Which sentence is personification?", a: "The waves reached for the shore.", opts: ["The waves reached for the shore.", "The waves were big.", "Waves hit the rocks.", "The sea was rough."], type: "multiple_choice" },
    { q: "'Lightning stitched across the sky' gives lightning the human-like ability to:", a: "Sew / stitch", opts: ["Sew / stitch", "Shine", "Flash", "Strike"], type: "multiple_choice" },
    { q: "Which sentence uses personification?", a: "Hunger gnawed at his stomach.", opts: ["Hunger gnawed at his stomach.", "He was very hungry.", "He had not eaten.", "His stomach was empty."], type: "multiple_choice" },
    { q: "'The camera loves her' is personification because a camera cannot really:", a: "Feel love", opts: ["Feel love", "Take photos", "Be held", "Turn on"], type: "multiple_choice" },
    { q: "Why do writers use personification?", a: "To make descriptions vivid and relatable", opts: ["To make descriptions vivid and relatable", "To add more facts", "To fill space", "To confuse readers"], type: "multiple_choice" },
    { q: "Which is NOT personification?", a: "She ran like the wind.", opts: ["She ran like the wind.", "The fire danced.", "The clock stared at me.", "The trees whispered."], type: "multiple_choice" },
  ], count);
}

function generateHyperboleProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Hyperbole is:", a: "An extreme exaggeration not meant literally", opts: ["An extreme exaggeration not meant literally", "A comparison using 'like'", "An exact fact", "A sound word"], type: "multiple_choice" },
    { q: "'I've told you a million times' is an example of:", a: "Hyperbole", opts: ["Hyperbole", "Simile", "Personification", "Idiom"], type: "multiple_choice" },
    { q: "Which sentence is a hyperbole?", a: "This bag weighs a ton!", opts: ["This bag weighs a ton!", "This bag is heavy.", "The bag is full.", "I carried the bag."], type: "multiple_choice" },
    { q: "'I'm so hungry I could eat a horse' means the speaker is:", a: "Very hungry (exaggeration)", opts: ["Very hungry (exaggeration)", "Going to eat a horse", "Not hungry", "Eating now"], type: "multiple_choice" },
    { q: "Which is a hyperbole?", a: "My backpack weighs a thousand pounds.", opts: ["My backpack weighs a thousand pounds.", "My backpack is full.", "My backpack is blue.", "I packed my backpack."], type: "multiple_choice" },
    { q: "Writers use hyperbole to:", a: "Add emphasis or humor", opts: ["Add emphasis or humor", "State exact facts", "Give directions", "Ask questions"], type: "multiple_choice" },
    { q: "'It took forever to load the page' is hyperbole because:", a: "It exaggerates the wait time", opts: ["It exaggerates the wait time", "It is literally true", "It compares with 'like'", "It rhymes"], type: "multiple_choice" },
    { q: "Which sentence is a hyperbole?", a: "I laughed so hard I almost died.", opts: ["I laughed so hard I almost died.", "I laughed at the joke.", "The joke was funny.", "I smiled a little."], type: "multiple_choice" },
    { q: "'Her smile was a mile wide' is:", a: "Hyperbole", opts: ["Hyperbole", "A fact", "An idiom", "Onomatopoeia"], type: "multiple_choice" },
    { q: "Which is NOT a hyperbole?", a: "The walk took twenty minutes.", opts: ["The walk took twenty minutes.", "The walk took an eternity.", "I walked a million miles.", "My feet are killing me."], type: "multiple_choice" },
    { q: "'I'm dying of thirst' is hyperbole that really means:", a: "I am very thirsty", opts: ["I am very thirsty", "I am actually dying", "I am not thirsty", "I drank water"], type: "multiple_choice" },
    { q: "Which sentence uses hyperbole?", a: "He's older than the hills.", opts: ["He's older than the hills.", "He is quite old.", "He is sixty years old.", "He has grey hair."], type: "multiple_choice" },
    { q: "'This homework is taking a lifetime' exaggerates to show:", a: "It feels very long", opts: ["It feels very long", "It is short", "It is easy", "It is fun"], type: "multiple_choice" },
    { q: "Which is a hyperbole?", a: "I have a ton of homework tonight.", opts: ["I have a ton of homework tonight.", "I have three assignments.", "Homework is due Friday.", "I finished my homework."], type: "multiple_choice" },
    { q: "Hyperbole should be understood as:", a: "Not literally true", opts: ["Not literally true", "Always true", "A measurement", "A warning"], type: "multiple_choice" },
    { q: "'My dad will kill me if I'm late' uses hyperbole to mean:", a: "He will be very upset", opts: ["He will be very upset", "He will actually harm him", "He won't mind", "He is happy"], type: "multiple_choice" },
  ], count);
}

function generateIdiomProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "'It's raining cats and dogs' means:", a: "It is raining very hard", opts: ["It is raining very hard", "Animals are falling", "It is sunny", "It is cold"], type: "multiple_choice" },
    { q: "An idiom is a phrase whose meaning is:", a: "Different from the literal words", opts: ["Different from the literal words", "Exactly the words", "Always a question", "A comparison with 'like'"], type: "multiple_choice" },
    { q: "'Break a leg' means:", a: "Good luck", opts: ["Good luck", "Get hurt", "Run fast", "Sit down"], type: "multiple_choice" },
    { q: "'Piece of cake' means something is:", a: "Very easy", opts: ["Very easy", "Delicious", "Very hard", "Round"], type: "multiple_choice" },
    { q: "'Hit the books' means to:", a: "Study", opts: ["Study", "Throw books", "Take a nap", "Go outside"], type: "multiple_choice" },
    { q: "'Let the cat out of the bag' means to:", a: "Reveal a secret", opts: ["Reveal a secret", "Free a pet", "Tell a joke", "Pack a bag"], type: "multiple_choice" },
    { q: "'Under the weather' means:", a: "Feeling sick", opts: ["Feeling sick", "Standing in rain", "Being cold", "Looking up"], type: "multiple_choice" },
    { q: "'Once in a blue moon' means:", a: "Very rarely", opts: ["Very rarely", "Every night", "At noon", "Often"], type: "multiple_choice" },
    { q: "'Bite the bullet' means to:", a: "Face something difficult bravely", opts: ["Face something difficult bravely", "Eat metal", "Run away", "Stay quiet"], type: "multiple_choice" },
    { q: "'Hold your horses' means:", a: "Wait / be patient", opts: ["Wait / be patient", "Ride faster", "Let go", "Feed animals"], type: "multiple_choice" },
    { q: "'A blessing in disguise' means:", a: "A good thing that seemed bad at first", opts: ["A good thing that seemed bad at first", "A costume", "Bad luck", "A secret gift"], type: "multiple_choice" },
    { q: "'Spill the beans' means to:", a: "Tell a secret", opts: ["Tell a secret", "Make a mess", "Cook dinner", "Drop food"], type: "multiple_choice" },
    { q: "'Cost an arm and a leg' means something is:", a: "Very expensive", opts: ["Very expensive", "Painful", "Cheap", "Heavy"], type: "multiple_choice" },
    { q: "'On the same page' means people:", a: "Agree or understand each other", opts: ["Agree or understand each other", "Read the same book", "Sit together", "Write together"], type: "multiple_choice" },
    { q: "'When pigs fly' means:", a: "Something will never happen", opts: ["Something will never happen", "Very soon", "At the farm", "In the sky"], type: "multiple_choice" },
    { q: "Why can idioms be confusing?", a: "Their meaning is not the literal words", opts: ["Their meaning is not the literal words", "They are too short", "They have no meaning", "They are always questions"], type: "multiple_choice" },
  ], count);
}

// ─── R1: Letter Recognition (Pre-K / K) ───────────────────────────────────────

function generateUppercaseProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which one is the uppercase B?", a: "B", opts: ["b", "B", "d", "p"], type: "multiple_choice" },
    { q: "Which one is a CAPITAL (uppercase) letter?", a: "R", opts: ["r", "n", "R", "m"], type: "multiple_choice" },
    { q: "Which is the uppercase letter for 'a'?", a: "A", opts: ["A", "e", "a", "o"], type: "multiple_choice" },
    { q: "Which one is the uppercase M?", a: "M", opts: ["m", "w", "M", "n"], type: "multiple_choice" },
    { q: "Pick the CAPITAL letter:", a: "G", opts: ["g", "q", "G", "a"], type: "multiple_choice" },
    { q: "Which is the uppercase letter for 't'?", a: "T", opts: ["T", "t", "f", "l"], type: "multiple_choice" },
    { q: "Which one is the uppercase E?", a: "E", opts: ["e", "E", "c", "o"], type: "multiple_choice" },
    { q: "Pick the CAPITAL letter:", a: "S", opts: ["s", "S", "z", "c"], type: "multiple_choice" },
    { q: "Which is the uppercase letter for 'h'?", a: "H", opts: ["n", "h", "H", "b"], type: "multiple_choice" },
    { q: "Which one is the uppercase D?", a: "D", opts: ["b", "d", "D", "p"], type: "multiple_choice" },
    { q: "Pick the CAPITAL letter:", a: "K", opts: ["k", "x", "K", "h"], type: "multiple_choice" },
    { q: "Which is the uppercase letter for 'n'?", a: "N", opts: ["N", "m", "n", "h"], type: "multiple_choice" },
    { q: "Which one is the uppercase F?", a: "F", opts: ["f", "t", "F", "e"], type: "multiple_choice" },
    { q: "Pick the CAPITAL letter:", a: "W", opts: ["w", "v", "W", "m"], type: "multiple_choice" },
    { q: "Which is the uppercase letter for 'r'?", a: "R", opts: ["n", "R", "r", "k"], type: "multiple_choice" },
    { q: "Which one is the uppercase P?", a: "P", opts: ["p", "q", "P", "b"], type: "multiple_choice" },
    { q: "Pick the CAPITAL letter:", a: "L", opts: ["l", "i", "L", "t"], type: "multiple_choice" },
    { q: "Which is the uppercase letter for 'c'?", a: "C", opts: ["c", "C", "o", "e"], type: "multiple_choice" },
  ], count);
}

function generateLowercaseProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which one is the lowercase letter?", a: "r", opts: ["R", "r", "A", "G"], type: "multiple_choice" },
    { q: "Which is the lowercase letter for 'B'?", a: "b", opts: ["d", "b", "p", "q"], type: "multiple_choice" },
    { q: "Pick the small (lowercase) letter:", a: "m", opts: ["M", "m", "W", "N"], type: "multiple_choice" },
    { q: "Which is the lowercase letter for 'A'?", a: "a", opts: ["a", "e", "o", "A"], type: "multiple_choice" },
    { q: "Which one is the lowercase t?", a: "t", opts: ["T", "t", "f", "l"], type: "multiple_choice" },
    { q: "Pick the small (lowercase) letter:", a: "g", opts: ["G", "Q", "g", "O"], type: "multiple_choice" },
    { q: "Which is the lowercase letter for 'E'?", a: "e", opts: ["e", "c", "o", "E"], type: "multiple_choice" },
    { q: "Which one is the lowercase h?", a: "h", opts: ["H", "h", "b", "k"], type: "multiple_choice" },
    { q: "Pick the small (lowercase) letter:", a: "n", opts: ["N", "M", "n", "H"], type: "multiple_choice" },
    { q: "Which is the lowercase letter for 'D'?", a: "d", opts: ["b", "d", "p", "D"], type: "multiple_choice" },
    { q: "Which one is the lowercase s?", a: "s", opts: ["S", "s", "z", "c"], type: "multiple_choice" },
    { q: "Pick the small (lowercase) letter:", a: "f", opts: ["F", "T", "f", "E"], type: "multiple_choice" },
    { q: "Which is the lowercase letter for 'R'?", a: "r", opts: ["n", "r", "R", "k"], type: "multiple_choice" },
    { q: "Which one is the lowercase w?", a: "w", opts: ["W", "V", "w", "m"], type: "multiple_choice" },
    { q: "Pick the small (lowercase) letter:", a: "k", opts: ["K", "X", "k", "H"], type: "multiple_choice" },
    { q: "Which is the lowercase letter for 'P'?", a: "p", opts: ["q", "p", "b", "P"], type: "multiple_choice" },
    { q: "Which one is the lowercase e?", a: "e", opts: ["E", "e", "c", "a"], type: "multiple_choice" },
    { q: "Pick the small (lowercase) letter:", a: "a", opts: ["A", "a", "O", "E"], type: "multiple_choice" },
  ], count);
}

function generateLetterSoundProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which letter makes the /m/ sound at the start of 'moon'?", a: "m", opts: ["n", "m", "w", "h"], type: "multiple_choice" },
    { q: "Which word begins with the /s/ sound?", a: "sun", opts: ["sun", "fun", "run", "bun"], type: "multiple_choice" },
    { q: "What letter does 'ball' begin with?", a: "b", opts: ["b", "d", "p", "g"], type: "multiple_choice" },
    { q: "Which letter makes the /t/ sound?", a: "t", opts: ["t", "f", "l", "k"], type: "multiple_choice" },
    { q: "Which word begins with the /k/ sound?", a: "cat", opts: ["cat", "hat", "mat", "bat"], type: "multiple_choice" },
    { q: "What sound does the letter 'd' make in 'dog'?", a: "/d/", opts: ["/b/", "/d/", "/p/", "/t/"], type: "multiple_choice" },
    { q: "Which word starts with the /f/ sound?", a: "fish", opts: ["dish", "fish", "wish", "wash"], type: "multiple_choice" },
    { q: "Which letter makes the /p/ sound at the start of 'pig'?", a: "p", opts: ["b", "p", "d", "q"], type: "multiple_choice" },
    { q: "What letter does 'lion' begin with?", a: "l", opts: ["i", "l", "t", "j"], type: "multiple_choice" },
    { q: "Which word begins with the /h/ sound?", a: "hat", opts: ["hat", "cat", "bat", "rat"], type: "multiple_choice" },
    { q: "Which letter makes the /r/ sound?", a: "r", opts: ["n", "r", "m", "w"], type: "multiple_choice" },
    { q: "Which word begins with the /g/ sound?", a: "goat", opts: ["goat", "coat", "boat", "moat"], type: "multiple_choice" },
    { q: "What sound does 'n' make in 'net'?", a: "/n/", opts: ["/m/", "/n/", "/h/", "/r/"], type: "multiple_choice" },
    { q: "Which word starts with the /j/ sound?", a: "jam", opts: ["jam", "ham", "ram", "yam"], type: "multiple_choice" },
    { q: "Which letter makes the /v/ sound at the start of 'van'?", a: "v", opts: ["v", "w", "u", "f"], type: "multiple_choice" },
    { q: "Which word begins with the /w/ sound?", a: "web", opts: ["web", "bed", "red", "led"], type: "multiple_choice" },
    { q: "What letter makes the sound at the start of 'zip'?", a: "z", opts: ["s", "z", "c", "x"], type: "multiple_choice" },
    { q: "Which word begins with the /b/ sound?", a: "bird", opts: ["bird", "dirt", "girl", "third"], type: "multiple_choice" },
  ], count);
}

// ─── R3: Sight Words (recognition) ─────────────────────────────────────────────

function generateSightWordProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which word is 'the'?", a: "the", opts: ["teh", "the", "hte", "het"], type: "multiple_choice" },
    { q: "Which word is 'said'?", a: "said", opts: ["sed", "said", "sayd", "siad"], type: "multiple_choice" },
    { q: "Finish the sentence: 'I ___ to play.'", a: "want", opts: ["want", "wnat", "watn", "wamt"], type: "multiple_choice" },
    { q: "Which word is 'you'?", a: "you", opts: ["yuo", "you", "yoo", "uoy"], type: "multiple_choice" },
    { q: "Which word is 'they'?", a: "they", opts: ["thay", "they", "tehy", "theh"], type: "multiple_choice" },
    { q: "Finish: 'We ___ happy.'", a: "are", opts: ["are", "rae", "aer", " are."], type: "multiple_choice" },
    { q: "Which word is 'have'?", a: "have", opts: ["hav", "have", "haev", "hve"], type: "multiple_choice" },
    { q: "Which word is 'where'?", a: "where", opts: ["whaer", "where", "were", "wehre"], type: "multiple_choice" },
    { q: "Finish: '___ is my dog.'", a: "This", opts: ["This", "Thsi", "Tihs", "Hist"], type: "multiple_choice" },
    { q: "Which word is 'because'?", a: "because", opts: ["becuase", "because", "becase", "becouse"], type: "multiple_choice" },
    { q: "Which word is 'friend'?", a: "friend", opts: ["freind", "friend", "frend", "frind"], type: "multiple_choice" },
    { q: "Finish: 'Look ___ me!'", a: "at", opts: ["at", "ta", "att", "et"], type: "multiple_choice" },
    { q: "Which word is 'little'?", a: "little", opts: ["littel", "little", "litle", "liddle"], type: "multiple_choice" },
    { q: "Which word is 'come'?", a: "come", opts: ["cme", "come", "coem", "comm"], type: "multiple_choice" },
    { q: "Finish: 'She ___ run fast.'", a: "can", opts: ["can", "cna", "acn", "kan"], type: "multiple_choice" },
    { q: "Which word is 'what'?", a: "what", opts: ["waht", "what", "whta", "hwat"], type: "multiple_choice" },
    { q: "Which word is 'people'?", a: "people", opts: ["peeple", "people", "poeple", "peopel"], type: "multiple_choice" },
    { q: "Finish: 'I see ___ cat.'", a: "the", opts: ["the", "teh", "tha", "hte"], type: "multiple_choice" },
  ], count);
}

// ─── R4: Synonyms & Antonyms ───────────────────────────────────────────────────

function generateSynonymProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which word means the SAME as 'happy'?", a: "glad", opts: ["sad", "glad", "mad", "tired"], type: "multiple_choice" },
    { q: "Which word means the SAME as 'big'?", a: "large", opts: ["tiny", "large", "thin", "short"], type: "multiple_choice" },
    { q: "Which word means the SAME as 'fast'?", a: "quick", opts: ["slow", "quick", "heavy", "loud"], type: "multiple_choice" },
    { q: "A synonym for 'begin' is:", a: "start", opts: ["stop", "start", "end", "close"], type: "multiple_choice" },
    { q: "A synonym for 'cold' is:", a: "chilly", opts: ["warm", "chilly", "hot", "dry"], type: "multiple_choice" },
    { q: "Which word means the SAME as 'small'?", a: "little", opts: ["huge", "little", "tall", "wide"], type: "multiple_choice" },
    { q: "A synonym for 'angry' is:", a: "mad", opts: ["calm", "mad", "happy", "sleepy"], type: "multiple_choice" },
    { q: "Which word means the SAME as 'jump'?", a: "leap", opts: ["sit", "leap", "crawl", "fall"], type: "multiple_choice" },
    { q: "A synonym for 'smart' is:", a: "clever", opts: ["silly", "clever", "slow", "lazy"], type: "multiple_choice" },
    { q: "Which word means the SAME as 'pretty'?", a: "beautiful", opts: ["ugly", "beautiful", "plain", "messy"], type: "multiple_choice" },
    { q: "A synonym for 'shout' is:", a: "yell", opts: ["whisper", "yell", "mumble", "sing"], type: "multiple_choice" },
    { q: "Which word means the SAME as 'tired'?", a: "sleepy", opts: ["awake", "sleepy", "happy", "hungry"], type: "multiple_choice" },
    { q: "A synonym for 'rich' is:", a: "wealthy", opts: ["poor", "wealthy", "broke", "empty"], type: "multiple_choice" },
    { q: "Which word means the SAME as 'easy'?", a: "simple", opts: ["hard", "simple", "tricky", "tough"], type: "multiple_choice" },
    { q: "A synonym for 'nice' is:", a: "kind", opts: ["mean", "kind", "rude", "cruel"], type: "multiple_choice" },
    { q: "Which word means the SAME as 'sad'?", a: "unhappy", opts: ["joyful", "unhappy", "excited", "proud"], type: "multiple_choice" },
  ], count);
}

function generateAntonymProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which word means the OPPOSITE of 'begin'?", a: "end", opts: ["start", "end", "open", "go"], type: "multiple_choice" },
    { q: "Which word means the OPPOSITE of 'hot'?", a: "cold", opts: ["warm", "cold", "boiling", "sunny"], type: "multiple_choice" },
    { q: "The opposite of 'big' is:", a: "small", opts: ["large", "small", "huge", "wide"], type: "multiple_choice" },
    { q: "The opposite of 'happy' is:", a: "sad", opts: ["glad", "sad", "joyful", "merry"], type: "multiple_choice" },
    { q: "Which word means the OPPOSITE of 'fast'?", a: "slow", opts: ["quick", "slow", "speedy", "rapid"], type: "multiple_choice" },
    { q: "The opposite of 'up' is:", a: "down", opts: ["high", "down", "over", "top"], type: "multiple_choice" },
    { q: "The opposite of 'day' is:", a: "night", opts: ["morning", "night", "noon", "light"], type: "multiple_choice" },
    { q: "Which word means the OPPOSITE of 'full'?", a: "empty", opts: ["packed", "empty", "loaded", "stuffed"], type: "multiple_choice" },
    { q: "The opposite of 'open' is:", a: "closed", opts: ["wide", "closed", "ajar", "unlocked"], type: "multiple_choice" },
    { q: "The opposite of 'old' is:", a: "young", opts: ["ancient", "young", "aged", "elderly"], type: "multiple_choice" },
    { q: "Which word means the OPPOSITE of 'high'?", a: "low", opts: ["tall", "low", "up", "above"], type: "multiple_choice" },
    { q: "The opposite of 'wet' is:", a: "dry", opts: ["damp", "dry", "soggy", "moist"], type: "multiple_choice" },
    { q: "The opposite of 'loud' is:", a: "quiet", opts: ["noisy", "quiet", "booming", "blaring"], type: "multiple_choice" },
    { q: "Which word means the OPPOSITE of 'first'?", a: "last", opts: ["next", "last", "early", "front"], type: "multiple_choice" },
    { q: "The opposite of 'light' (weight) is:", a: "heavy", opts: ["soft", "heavy", "thin", "small"], type: "multiple_choice" },
    { q: "The opposite of 'win' is:", a: "lose", opts: ["score", "lose", "tie", "play"], type: "multiple_choice" },
  ], count);
}

function generateSilentEProblems(count: number): Problem[] {
  const items = [
    { q: "Which word has a silent E? (cap / cape / cat / can)", a: "cape", opts: ["cap","cape","cat","can"] },
    { q: "Add a silent E to make a new word: 'pin' → ___", a: "pine" },
    { q: "Which word has a long vowel sound? (hop / hope / hot / hop)", a: "hope", opts: ["hop","hope","hot","cot"] },
    { q: "Does 'cake' have a silent E?", a: "Yes", opts: ["Yes","No"] },
    { q: "Which word follows the silent E rule? (bit / bite / sit / fit)", a: "bite", opts: ["bit","bite","sit","fit"] },
    { q: "Add a silent E: 'rob' → ___", a: "robe" },
    { q: "Which is a silent E word? (cut / cute / cup / cub)", a: "cute", opts: ["cut","cute","cup","cub"] },
    { q: "What sound does the vowel 'a' make in 'game'?", a: "Long A (like the letter name)", opts: ["Short A","Long A (like the letter name)","Silent","Schwa"] },
    { q: "Add a silent E: 'slid' → ___", a: "slide" },
    { q: "Which word rhymes with 'bone'? (Don / done / tone / ton)", a: "tone", opts: ["don","done","tone","ton"] },
    { q: "Circle the silent E word: ride / rid / rip / rich", a: "ride" },
    { q: "Does 'have' follow the regular silent E rule?", a: "No — 'have' is an exception; the 'a' is still short", opts: ["Yes","No — 'have' is an exception; the 'a' is still short"] },
    { q: "What does a silent E at the end of a word usually do?", a: "Makes the vowel before it say its long sound (letter name)" },
    { q: "Make a silent E word from these letters: t, i, m, e", a: "time" },
    { q: "Which pair shows the silent E rule? (hop→hope / cat→cate / fit→fite / run→rune)", a: "hop→hope", opts: ["hop→hope","cat→cate","fit→fite","run→rune"] },
    { q: "Spell the silent E word for a small rodent that rhymes with 'mice'.", a: "mice" },
    { q: "What is the vowel sound in 'tube'?", a: "Long U", opts: ["Short U","Long U","Silent","Schwa"] },
    { q: "Which word has a short vowel sound? (kite / kit / bike / time)", a: "kit", opts: ["kite","kit","bike","time"] },
    { q: "Add a silent E: 'not' → ___", a: "note" },
    { q: "Does the word 'blue' follow the silent E rule?", a: "Yes — the 'e' is silent and the 'u' says its long sound" },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8),
    type: (item.opts ? "multiple_choice" : "short_answer") as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

function generateLongVowelProblems(vowel: "a" | "i" | "o", count: number): Problem[] {
  const banks = {
    a: [
      { q: "Which word has a long A sound? (hat / hate / have / hand)", a: "hate", opts: ["hat","hate","have","hand"] },
      { q: "Does 'rain' have a long A sound?", a: "Yes", opts: ["Yes","No"] },
      { q: "Which spelling pattern makes a long A sound? (ai / au / oi / ou)", a: "ai", opts: ["ai","au","oi","ou"] },
      { q: "Give an example of a long A word spelled with 'ay'.", a: "(e.g., play, day, say, way)" },
      { q: "Sort: long A or short A — 'cake'?", a: "Long A" },
      { q: "Sort: long A or short A — 'cap'?", a: "Short A" },
      { q: "Which word rhymes with 'train'? (tan / rain / ran / tin)", a: "rain", opts: ["tan","rain","ran","tin"] },
      { q: "What are three ways to spell the long A sound?", a: "a_e (cake), ai (rain), ay (play)" },
      { q: "Spell a long A word that means the opposite of night.", a: "day" },
      { q: "Does 'snake' have a long or short A?", a: "Long A" },
      { q: "Which word has a long A? (bad / braid / back / ban)", a: "braid", opts: ["bad","braid","back","ban"] },
      { q: "Change the short A to a long A: 'mad' → ___", a: "made" },
    ],
    i: [
      { q: "Which word has a long I sound? (bit / bite / big / bin)", a: "bite", opts: ["bit","bite","big","bin"] },
      { q: "Does 'night' have a long I sound?", a: "Yes", opts: ["Yes","No"] },
      { q: "Which spelling makes a long I? (ie / oe / ue / ae)", a: "ie", opts: ["ie","oe","ue","ae"] },
      { q: "Give a long I word spelled with 'igh'.", a: "(e.g., night, light, right, fight)" },
      { q: "Sort: long I or short I — 'pine'?", a: "Long I" },
      { q: "Sort: long I or short I — 'pin'?", a: "Short I" },
      { q: "Spell a long I word that means not dark.", a: "light" },
      { q: "What are two ways to spell the long I sound?", a: "i_e (kite), igh (night), ie (pie), y (fly)" },
      { q: "Which rhymes with 'kite'? (kit / sit / white / hit)", a: "white", opts: ["kit","sit","white","hit"] },
      { q: "Change the short I to a long I: 'rip' → ___", a: "ripe" },
      { q: "Does 'fly' have a long I sound?", a: "Yes — the 'y' acts as a long I vowel" },
      { q: "Which word has a long I? (hill / mild / fill / mill)", a: "mild", opts: ["hill","mild","fill","mill"] },
    ],
    o: [
      { q: "Which word has a long O sound? (hop / hope / hot / hog)", a: "hope", opts: ["hop","hope","hot","hog"] },
      { q: "Does 'boat' have a long O sound?", a: "Yes", opts: ["Yes","No"] },
      { q: "Which spelling makes a long O? (oa / ou / oi / au)", a: "oa", opts: ["oa","ou","oi","au"] },
      { q: "Give a long O word spelled with 'ow'.", a: "(e.g., snow, blow, grow, show)" },
      { q: "Sort: long O or short O — 'code'?", a: "Long O" },
      { q: "Sort: long O or short O — 'cot'?", a: "Short O" },
      { q: "Spell a long O word that means a path or road.", a: "road" },
      { q: "What are two ways to spell the long O sound?", a: "o_e (home), oa (boat), ow (snow)" },
      { q: "Which rhymes with 'coat'? (cot / goat / got / cob)", a: "goat", opts: ["cot","goat","got","cob"] },
      { q: "Change the short O to a long O: 'not' → ___", a: "note" },
      { q: "Does 'toe' have a long O sound?", a: "Yes", opts: ["Yes","No"] },
      { q: "Which word has a long O? (fog / fond / fold / frog)", a: "fold", opts: ["fog","fond","fold","frog"] },
    ],
  };
  const items = banks[vowel];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8),
    type: (item.opts ? "multiple_choice" : "short_answer") as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

// ─── R5/R9: Passage banks — each has enough questions to fill up to 30 problems ──

const readingPassages: Record<string, { passage: string; questions: Problem[] }[]> = {
  "main idea": [{
    passage: `Honey bees are one of the most important insects on Earth. A single hive can contain up to 60,000 bees, all working together. The queen bee lays up to 2,000 eggs per day. Worker bees gather nectar from flowers and turn it into honey. A single bee produces only one twelfth of a teaspoon of honey in its entire lifetime. Bees communicate using a dance called the "waggle dance," which tells other bees the direction and distance of food.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "What is the main idea of this passage?", options: ["Bees are dangerous", "Honey bees are important insects that work together", "All bees make honey", "Bees only live in hives"], answer: "Honey bees are important insects that work together", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How much honey does one bee make in its lifetime?", options: ["One jar", "One teaspoon", "One twelfth of a teaspoon", "One cup"], answer: "One twelfth of a teaspoon", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the waggle dance used for?", answer: "To tell other bees the direction and distance of food", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the role of the queen bee?", answer: "She lays up to 2,000 eggs per day", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What do worker bees collect from flowers?", options: ["Water", "Nectar", "Pollen only", "Wax"], answer: "Nectar", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Why are honey bees described as 'important'?", answer: "They work together, produce honey, and communicate complex information", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How many bees can a single hive contain?", options: ["Up to 600", "Up to 6,000", "Up to 60,000", "Up to 600,000"], answer: "Up to 60,000", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "In your own words, describe how bees communicate.", answer: "They do a 'waggle dance' to show other bees where food is", points: 1 },
    ],
  }, {
    passage: `The Great Barrier Reef is the world's largest coral reef system, stretching over 2,300 kilometres off the coast of Queensland, Australia. It is home to thousands of species of fish, corals, and other sea creatures. Scientists warn that rising ocean temperatures caused by climate change are bleaching the corals — stripping them of the algae they depend on for survival. Without urgent action, large sections of the reef could be permanently lost.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What is the main idea of this passage?", answer: "The Great Barrier Reef is the world's largest coral reef but is threatened by climate change", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Where is the Great Barrier Reef located?", options: ["New Zealand", "Brazil", "Queensland, Australia", "South Africa"], answer: "Queensland, Australia", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is coral bleaching?", answer: "When rising temperatures strip corals of the algae they need to survive", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How long is the Great Barrier Reef?", options: ["230 km", "2,300 km", "23,000 km", "230,000 km"], answer: "2,300 km", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does the passage suggest could happen without urgent action?", answer: "Large sections of the reef could be permanently lost", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What causes coral bleaching according to the passage?", answer: "Rising ocean temperatures caused by climate change", points: 1 },
    ],
  }],
  "cause and effect": [{
    passage: `Every autumn, millions of monarch butterflies migrate up to 5,000 kilometres from Canada and the United States to Mexico. They navigate using the sun and Earth's magnetic field. The migration is threatened by climate change and loss of milkweed — the only plant monarch caterpillars can eat. Conservation efforts include planting milkweed gardens across North America.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What causes the monarch butterfly migration to be threatened? Give two reasons.", answer: "Climate change and loss of milkweed habitat", points: 2 },
      { id: nanoid(8), type: "multiple_choice", question: "Why is milkweed important to monarch butterflies?", options: ["It helps them navigate", "It is the only plant their caterpillars can eat", "It provides shelter", "It attracts other insects"], answer: "It is the only plant their caterpillars can eat", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What conservation effort is mentioned in the passage?", answer: "Planting milkweed gardens across North America", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How do monarch butterflies navigate?", options: ["By smell", "Using the sun and Earth's magnetic field", "By following rivers", "By echolocation"], answer: "Using the sun and Earth's magnetic field", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the cause of milkweed loss? What is the effect on butterflies?", answer: "Habitat destruction causes milkweed loss; butterflies cannot feed their caterpillars", points: 2 },
      { id: nanoid(8), type: "short_answer", question: "How far do monarchs migrate each autumn?", answer: "Up to 5,000 kilometres", points: 1 },
    ],
  }, {
    passage: `In 1883, the volcanic island of Krakatau in Indonesia erupted with enormous force. The explosion was heard 5,000 kilometres away. The eruption sent massive amounts of ash into the atmosphere, blocking sunlight around the world. As a result, global temperatures dropped by about 1.2°C for several years — a phenomenon scientists now call a 'volcanic winter.' Crops failed in many regions, causing widespread food shortages.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What was the direct cause of the volcanic winter described in the passage?", answer: "Ash from the Krakatau eruption blocked sunlight, causing temperatures to drop", points: 2 },
      { id: nanoid(8), type: "multiple_choice", question: "How far away was the eruption heard?", options: ["500 km", "1,000 km", "5,000 km", "50,000 km"], answer: "5,000 km", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What was the effect of the temperature drop on people?", answer: "Crops failed in many regions, causing widespread food shortages", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "By how much did global temperatures drop?", options: ["0.12°C", "1.2°C", "12°C", "0.012°C"], answer: "1.2°C", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Identify one cause and one effect from the passage.", answer: "Cause: eruption sent ash into atmosphere; Effect: sunlight blocked, temperatures dropped", points: 2 },
    ],
  }],
  "context clues": [{
    passage: `The ancient city of Pompeii was buried under volcanic ash when Mount Vesuvius erupted in 79 CE. The eruption was so sudden that residents had no time to escape. Archaeologists excavating the site have uncovered remarkably preserved buildings, artwork, and even food. The city gives us a unique snapshot of Roman life at the height of the empire.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "Using context clues, what does 'excavating' most likely mean?", options: ["Burning", "Digging up", "Rebuilding", "Flooding"], answer: "Digging up", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does 'remarkably preserved' tell you about the buildings?", answer: "They were unusually well kept or undamaged despite being buried for centuries", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What does 'snapshot' mean in this context?", options: ["A photograph", "A quick look or picture of a moment in time", "A type of building", "A volcanic eruption"], answer: "A quick look or picture of a moment in time", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What clues in the passage helped you understand what 'excavating' means?", answer: "'Uncovered' and 'site' suggest digging at a location to find buried things", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What does 'residents' most likely mean?", options: ["Soldiers", "People who lived in the city", "Tourists", "Government officials"], answer: "People who lived in the city", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does 'at the height of the empire' suggest about Rome?", answer: "Rome was at its most powerful or successful period", points: 1 },
    ],
  }],
  "inference": [{
    passage: `Maya arrived at the library with muddy boots and a drenched jacket. She pulled a stack of travel books off the shelf and spread a map across the table. She circled several locations in South America and scribbled notes in the margins. A smile crossed her face as she looked at the circled spots.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "What can you infer about the weather outside?", options: ["It was hot and sunny", "It was raining", "It was snowing", "It was windy only"], answer: "It was raining", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What can you infer about Maya's plans based on her actions?", answer: "She is planning a trip to South America", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Why do you think Maya was smiling?", options: ["She found a funny book", "She was excited about her travel plans", "She saw a friend", "She finished her homework"], answer: "She was excited about her travel plans", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What evidence from the text supports your inference about the weather?", answer: "'Muddy boots' and 'drenched jacket' both suggest she walked through rain", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does the detail about 'scribbled notes in the margins' tell us about Maya?", answer: "She is engaged, organized, and serious about planning", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Which word best describes Maya's mood in this passage?", options: ["Sad", "Bored", "Excited", "Frightened"], answer: "Excited", points: 1 },
    ],
  }],
  "sequence of events": [{
    passage: `Making bread from scratch takes patience. First, you mix flour, yeast, salt, and water into a dough. Next, you knead the dough for about ten minutes until it is smooth and elastic. After that, you leave the dough in a warm place to rise for an hour. Once the dough has doubled in size, you shape it into a loaf and place it in a pan. Finally, you bake it in a hot oven for thirty minutes until the crust is golden brown.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "What is the FIRST step in making bread?", options: ["Knead the dough", "Mix flour, yeast, salt, and water", "Bake in the oven", "Let the dough rise"], answer: "Mix flour, yeast, salt, and water", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What happens AFTER kneading the dough?", options: ["You mix the ingredients", "You bake it", "You leave it to rise", "You shape it into a loaf"], answer: "You leave it to rise", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "List the five steps in the correct order.", answer: "1. Mix ingredients 2. Knead 3. Let rise 4. Shape into loaf 5. Bake", points: 2 },
      { id: nanoid(8), type: "multiple_choice", question: "How long should the dough rise?", options: ["10 minutes", "30 minutes", "1 hour", "2 hours"], answer: "1 hour", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What signal word tells you the LAST step?", answer: "'Finally'", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What is the LAST step?", options: ["Knead the dough", "Mix ingredients", "Let it rise", "Bake until golden brown"], answer: "Bake until golden brown", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What sequence signal words are used in this passage?", answer: "First, Next, After that, Once, Finally", points: 1 },
    ],
  }, {
    passage: `The life cycle of a frog has four stages. It begins when a female frog lays hundreds of eggs in a pond. The eggs hatch into tadpoles, which breathe through gills and swim using their tails. Over several weeks, the tadpoles grow back legs, then front legs, and their tails shrink. By the end of the process, the tadpole has become a fully formed froglet that can breathe air and hop onto land.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "What is the FIRST stage of the frog's life cycle?", options: ["Tadpole", "Froglet", "Egg", "Adult frog"], answer: "Egg", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What comes AFTER the egg stage?", options: ["Froglet", "Tadpole", "Adult frog", "Larva"], answer: "Tadpole", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "In what order do legs grow on the tadpole?", answer: "Back legs grow first, then front legs", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "How does the froglet differ from the tadpole?", answer: "The froglet breathes air and can hop on land; the tadpole breathes through gills and swims", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How many stages does the frog life cycle have?", options: ["2", "3", "4", "5"], answer: "4", points: 1 },
    ],
  }],
  "character analysis": [{
    passage: `In the story of 'The Tortoise and the Hare,' the hare is quick to brag about his speed and challenges the tortoise to a race, certain of an easy win. The tortoise, calm and determined, accepts without complaint. During the race, the hare takes a nap, confident he has plenty of time. The tortoise, never stopping, crosses the finish line first. The hare wakes to find he has lost — not because of speed, but because of arrogance and laziness.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What character trait causes the hare to lose the race?", answer: "Arrogance and laziness — he was overconfident and stopped to nap", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Which word best describes the tortoise?", options: ["Arrogant", "Determined", "Lazy", "Frightened"], answer: "Determined", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "How does the author reveal the hare's personality? Give two examples from the text.", answer: "He brags about his speed and takes a nap during the race, showing arrogance", points: 2 },
      { id: nanoid(8), type: "short_answer", question: "What lesson does the tortoise's behaviour teach?", answer: "Steady, persistent effort beats natural talent combined with laziness", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How does the tortoise respond to the hare's challenge?", options: ["He refuses", "He is afraid", "He accepts calmly", "He brags back"], answer: "He accepts calmly", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Would you describe the hare as a static or dynamic character? Explain.", answer: "Static — the hare does not change or learn from his experience by the story's end", points: 1 },
    ],
  }],
  "theme identification": [{
    passage: `At the end of a long journey, a weary traveller came to a well. He found a young boy drawing water to give to a thirsty dog. 'I have been walking for hours,' said the traveller, 'yet you give water to an animal before me.' The boy replied, 'All living things are thirsty, and kindness costs nothing.' The traveller was ashamed of his selfishness. He helped the boy carry the water and they shared it together, traveller, boy, and dog alike.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What is the theme of this passage?", answer: "Kindness and compassion for all living things; generosity benefits everyone", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Which statement best expresses the theme?", options: ["Animals are more important than people", "Kindness and sharing benefit everyone", "Travellers should always be served first", "Water is more valuable than gold"], answer: "Kindness and sharing benefit everyone", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does the boy's action of giving water to the dog tell us about his character?", answer: "He is compassionate and treats all living things with equal care", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "How does the traveller change by the end of the story?", answer: "He feels ashamed of his selfishness and chooses to help and share", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "The phrase 'kindness costs nothing' is an example of:", options: ["Metaphor", "Simile", "Aphorism (a wise saying)", "Alliteration"], answer: "Aphorism (a wise saying)", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What evidence from the text supports the theme of generosity?", answer: "The boy shares water with the dog; the traveller eventually helps and shares with both", points: 1 },
    ],
  }],
  "figurative language": [{
    passage: `The storm arrived like an army marching to war. Thunder drummed across the sky, and lightning stitched silver threads through the clouds. The wind was a wolf howling in the darkness, shaking the windows until they rattled their protests. By morning, the street was a mirror reflecting the pale sun — perfectly still, as if the storm had never come to call.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "Identify the simile in the first sentence.", answer: "'The storm arrived like an army marching to war'", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What figure of speech is 'The wind was a wolf'?", options: ["Simile", "Metaphor", "Personification", "Hyperbole"], answer: "Metaphor", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Find an example of personification in the passage.", answer: "'The windows rattled their protests' — windows cannot actually protest; they are given human behaviour", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the effect of calling the street 'a mirror' after the storm?", answer: "It creates an image of stillness and calm, contrasting with the violent storm", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What does 'Thunder drummed across the sky' use?", options: ["Simile", "Personification", "Metaphor", "Alliteration"], answer: "Personification", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What mood does the figurative language create in this passage?", answer: "A dramatic, powerful mood — the storm feels alive and threatening", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Explain the metaphor 'lightning stitched silver threads through the clouds.'", answer: "Lightning is compared to a needle stitching fabric — vivid image of lightning's jagged lines", points: 1 },
    ],
  }],
  "narrative structure": [{
    passage: `Lena had always been afraid of the deep end of the pool. Every summer, her friends dived in fearlessly while she stayed in the shallows. One afternoon, her coach quietly challenged her: 'You don't have to jump. Just walk to the edge and look.' Lena took a breath and walked to the edge. She looked down. Her heart hammered. But she didn't walk away. The next day, she jumped. It was terrifying — and then it was wonderful.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What is the conflict (problem) in this story?", answer: "Lena is afraid of the deep end of the pool", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What is the climax (turning point) of this story?", options: ["Lena watching her friends dive", "The coach giving advice", "Lena walking to the edge", "Lena jumping the next day"], answer: "Lena jumping the next day", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "How does the coach help Lena overcome her fear?", answer: "He gives her a small manageable challenge — just walk to the edge and look — not a big demand", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the resolution of the story?", answer: "Lena overcomes her fear and jumps — and it is wonderful", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What narrative technique is used in 'Her heart hammered'?", options: ["Flashback", "Foreshadowing", "Personification", "Simile"], answer: "Personification", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the theme of this story?", answer: "Courage grows by facing fear one small step at a time", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Describe the rising action in this story.", answer: "Lena's history of fear, watching her friends, the coach's challenge, walking to the edge", points: 1 },
    ],
  }],
};

function generateReadingProblems(skillName: string, count: number): Problem[] {
  const skill = skillName.toLowerCase();

  // R1 — Letter Recognition (Pre-K/K). These are NOT comprehension passages;
  // serving a reading passage to a child learning letters was the worst gap.
  if (skill.includes("uppercase")) return generateUppercaseProblems(count);
  if (skill.includes("lowercase")) return generateLowercaseProblems(count);
  if (skill.includes("letter sound")) return generateLetterSoundProblems(count);

  // R3 — Sight Words (recognition, no passage)
  if (skill.includes("dolch") || skill.includes("fry") || skill.includes("sight word")) return generateSightWordProblems(count);

  // R4 — Vocabulary: synonyms / antonyms are standalone (context clues stays a passage)
  if (skill.includes("synonym")) return generateSynonymProblems(count);
  if (skill.includes("antonym")) return generateAntonymProblems(count);

  // R6 — Inference & Prediction (mini-scenario MC; "Making inferences" still uses
  // the passage bank below)
  if (skill.includes("drawing conclusion") || skill.includes("conclusion")) return generateDrawingConclusionsProblems(count);
  if (skill.includes("predict")) return generatePredictingProblems(count);

  // R7 — Author's Purpose
  if (skill.includes("author")) return generateAuthorsPurposeProblems(count);
  if (skill.includes("tone") || skill.includes("mood")) return generateToneMoodProblems(count);
  if (skill.includes("fact") || skill.includes("opinion")) return generateFactOpinionProblems(count);
  if (skill.includes("point of view")) return generatePointOfViewProblems(count);

  // R8 — Figurative Language (device-identification MC). Specific devices match
  // here; R9's generic "Figurative language" still routes to the passage bank.
  if (skill.includes("simile") || skill.includes("metaphor")) return generateSimileMetaphorProblems(count);
  if (skill.includes("personification")) return generatePersonificationProblems(count);
  if (skill.includes("hyperbole")) return generateHyperboleProblems(count);
  if (skill.includes("idiom")) return generateIdiomProblems(count);

  // R2 — Phonics (no passage, direct question banks)
  if (skill.includes("silent e")) return generateSilentEProblems(count);
  if (skill.includes("long a")) return generateLongVowelProblems("a", count);
  if (skill.includes("long i")) return generateLongVowelProblems("i", count);
  if (skill.includes("long o")) return generateLongVowelProblems("o", count);

  // R5/R9 — Passage-based comprehension
  let key = "main idea";
  if (skill.includes("cause") || skill.includes("effect"))        key = "cause and effect";
  else if (skill.includes("context") || skill.includes("vocabulary")) key = "context clues";
  else if (skill.includes("inference") || skill.includes("infer"))    key = "inference";
  else if (skill.includes("sequence"))                               key = "sequence of events";
  else if (skill.includes("character"))                              key = "character analysis";
  else if (skill.includes("theme"))                                  key = "theme identification";
  else if (skill.includes("figurative"))                             key = "figurative language";
  else if (skill.includes("narrative structure"))                    key = "narrative structure";
  else if (skill.includes("main idea") || skill.includes("topic") || skill.includes("detail")) key = "main idea";

  const bank = readingPassages[key] ?? readingPassages["main idea"];

  // Build a pool by cycling through all passages in the bank
  const allProblems: Problem[] = [];
  for (const entry of bank) {
    allProblems.push({
      id: nanoid(8), type: "short_answer",
      question: `READ THIS PASSAGE:\n\n${entry.passage}\n\nNow answer the questions below.`,
      answer: "(passage — no answer required)", points: 0,
    });
    allProblems.push(...entry.questions);
  }

  // If we have enough, shuffle just the questions (keep passage headers in place)
  // Build sheet: passage block + questions from first entry; if more needed, add second entry
  const result: Problem[] = [];
  for (const entry of bank) {
    if (result.length >= count) break;
    result.push({
      id: nanoid(8), type: "short_answer",
      question: `READ THIS PASSAGE:\n\n${entry.passage}\n\nNow answer the questions below.`,
      answer: "(passage — no answer required)", points: 0,
    });
    for (const q of entry.questions) {
      if (result.length >= count) break;
      result.push({ ...q, id: nanoid(8) });
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITING GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

function generateWritingProblems(skillName: string, count: number): Problem[] {
  const skill = skillName.toLowerCase();
  // W1 — Sentence Completion (Grade 1–2). Grade-appropriate; these used to fall
  // through to clause-type / parts-of-speech questions far above grade level.
  if (skill.includes("completing sentence") || skill.includes("sentence completion")) return generateCompletingSentenceProblems(count);
  if (skill.includes("capital")) return generateCapitalLettersProblems(count);
  if (skill.includes("period")) return generatePeriodsProblems(count);
  // W4 — Punctuation (Grade 4–6). Each used to fall through to the generic pool.
  if (skill.includes("comma")) return generateCommaProblems(count);
  if (skill.includes("apostrophe")) return generateApostropheProblems(count);
  if (skill.includes("quotation")) return generateQuotationProblems(count);
  if (skill.includes("semicolon")) return generateSemicolonProblems(count);

  // W2 — Parts of Speech (auto-gradable MC versions). The combined "Nouns and
  // verbs" / "Adjectives and adverbs" skills get dedicated MC banks.
  if (skill.includes("noun") && skill.includes("verb")) return generateNounsVerbsProblems(count);
  if (skill.includes("adjective") || skill.includes("adverb")) return generateAdjAdverbProblems(count);

  // W3 — Sentence Structure (MC label format) + Subjects & Predicates
  if (skill.includes("subject") || skill.includes("predicate")) return generateSubjectPredicateProblems(count);
  if (skill.includes("run-on") || skill.includes("run on") || skill.includes("fragment")) return generateRunOnFragmentProblems(count);
  if (skill.includes("simple sentence") || skill.includes("compound sentence") || skill.includes("complex sentence")) return generateSentenceTypeProblems(count);

  // W5 — Paragraph Structure (analytic MC: composition can't be auto-graded, so
  // we test the reader's grasp of good structure)
  if (skill.includes("topic sentence")) return generateTopicSentenceProblems(count);
  if (skill.includes("supporting")) return generateSupportingSentenceProblems(count);
  if (skill.includes("concluding")) return generateConcludingSentenceProblems(count);
  if (skill.includes("paragraph unity") || skill.includes("unity")) return generateParagraphUnityProblems(count);
  // W6 — Essay Structure
  if (skill.includes("introduction")) return generateIntroductionProblems(count);
  if (skill.includes("body paragraph")) return generateBodyParagraphProblems(count);
  if (skill.includes("conclusion")) return generateConclusionProblems(count);
  if (skill.includes("transition")) return generateTransitionMcProblems(count);
  // W7 — Narrative Writing
  if (skill.includes("plot")) return generatePlotProblems(count);
  if (skill.includes("character")) return generateCharacterDevProblems(count);
  if (skill.includes("setting") || skill.includes("mood")) return generateSettingMoodProblems(count);
  if (skill.includes("dialogue")) return generateDialogueProblems(count);
  // W8 — Persuasive Writing
  if (skill.includes("claim") || skill.includes("evidence")) return generateClaimsEvidenceProblems(count);
  if (skill.includes("counterargument") || skill.includes("counter")) return generateCounterargumentProblems(count);
  if (skill.includes("persuasive")) return generatePersuasiveTechniqueProblems(count);
  if (skill.includes("essay")) return generateEssayStructureProblems(count);

  if (skill.includes("uppercase") || skill.includes("lowercase") || skill.includes("letter")) return generateLetterProblems(count);
  if (skill.includes("noun")) return generateNounProblems(count);
  if (skill.includes("verb")) return generateVerbProblems(count);
  if (skill.includes("adjective")) return generateAdjectiveProblems(count);
  if (skill.includes("pronoun")) return generatePronounProblems(count);
  if (skill.includes("preposition")) return generatePrepositionProblems(count);
  if (skill.includes("parts of speech") || skill.includes("part of speech")) return generatePartsOfSpeech(count);
  if (skill.includes("punctuation") || skill.includes("capitalization")) return generatePunctuationProblems(count);
  if (skill.includes("sentence")) return generateSentenceProblems(count);
  if (skill.includes("paragraph") || skill.includes("topic")) return generateParagraphProblems(count);
  if (skill.includes("essay")) return generateEssayProblems(count);
  if (skill.includes("transition")) return generateTransitionProblems(count);
  if (skill.includes("narrative")) return generateNarrativeProblems(count);
  if (skill.includes("persuasive")) return generatePersuasiveProblems(count);
  if (skill.includes("rhetoric") || skill.includes("diction") || skill.includes("syntax")) return generateAdvancedWritingProblems(count);
  return generatePartsOfSpeech(count);
}

// ─── W5: Paragraph Structure (analytic MC) ─────────────────────────────────────

function generateTopicSentenceProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which is the BEST topic sentence for a paragraph about dogs?", a: "Dogs make excellent pets for many reasons.", opts: ["Dogs make excellent pets for many reasons.", "Dogs are good.", "I have a dog.", "Dogs bark."], type: "multiple_choice" },
    { q: "A topic sentence usually appears:", a: "At the beginning of the paragraph", opts: ["At the beginning of the paragraph", "Only at the end", "In the middle only", "In a different paragraph"], type: "multiple_choice" },
    { q: "What is the job of a topic sentence?", a: "To state the main idea of the paragraph", opts: ["To state the main idea of the paragraph", "To give one small detail", "To end the paragraph", "To ask a question"], type: "multiple_choice" },
    { q: "Which is the strongest topic sentence?", a: "Recycling helps the planet in three important ways.", opts: ["Recycling helps the planet in three important ways.", "Recycling is a thing.", "I recycle cans.", "The bin is blue."], type: "multiple_choice" },
    { q: "Which sentence is TOO narrow to be a good topic sentence?", a: "My bike has a red bell.", opts: ["My bike has a red bell.", "Bikes are a great way to get around.", "Cycling has many benefits.", "Riding a bike is good exercise."], type: "multiple_choice" },
    { q: "Which sentence is TOO broad to be a good topic sentence?", a: "Everything in the world is interesting.", opts: ["Everything in the world is interesting.", "Volcanoes form in three main ways.", "Our school garden teaches teamwork.", "Penguins are well adapted to cold."], type: "multiple_choice" },
    { q: "A good topic sentence should be:", a: "Clear and focused on one main idea", opts: ["Clear and focused on one main idea", "As long as possible", "A list of every detail", "A question with no answer"], type: "multiple_choice" },
    { q: "Which is the best topic sentence for a paragraph about exercise?", a: "Regular exercise improves both body and mind.", opts: ["Regular exercise improves both body and mind.", "Exercise.", "I ran today.", "Gyms are open."], type: "multiple_choice" },
    { q: "The topic sentence and the rest of the paragraph should:", a: "Be about the same main idea", opts: ["Be about the same main idea", "Be about different topics", "Never connect", "Repeat the same words"], type: "multiple_choice" },
    { q: "Which topic sentence best introduces a paragraph of reasons to visit a beach?", a: "A trip to the beach offers fun, relaxation, and adventure.", opts: ["A trip to the beach offers fun, relaxation, and adventure.", "The beach is sandy.", "I lost my hat at the beach.", "Water is wet."], type: "multiple_choice" },
    { q: "If a paragraph is about how to plant a seed, the best topic sentence is:", a: "Planting a seed takes a few simple steps.", opts: ["Planting a seed takes a few simple steps.", "Seeds are small.", "I like gardens.", "The soil was brown."], type: "multiple_choice" },
    { q: "A topic sentence is like a:", a: "Headline that tells what the paragraph is about", opts: ["Headline that tells what the paragraph is about", "Random fact", "Final goodbye", "Title of the book"], type: "multiple_choice" },
    { q: "Which is the best topic sentence about a favorite season?", a: "Autumn is the most beautiful season for several reasons.", opts: ["Autumn is the most beautiful season for several reasons.", "It gets cold.", "Leaves.", "I own a jacket."], type: "multiple_choice" },
    { q: "Which would NOT make a good topic sentence?", a: "Then we ate lunch and went home.", opts: ["Then we ate lunch and went home.", "Our class trip was a great success.", "Healthy eating has many benefits.", "Dogs are loyal companions."], type: "multiple_choice" },
  ], count);
}

function generateSupportingSentenceProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What do supporting sentences do in a paragraph?", a: "Give details, facts, or examples about the main idea", opts: ["Give details, facts, or examples about the main idea", "State the main idea", "End the paragraph", "Start a new topic"], type: "multiple_choice" },
    { q: "Topic sentence: 'Dogs are helpful animals.' Which is a good supporting sentence?", a: "Guide dogs help people who cannot see.", opts: ["Guide dogs help people who cannot see.", "Cats are independent.", "I like pizza.", "The sky is blue."], type: "multiple_choice" },
    { q: "Topic sentence: 'Exercise is good for you.' Which sentence supports it?", a: "It strengthens your heart and muscles.", opts: ["It strengthens your heart and muscles.", "My shoes are new.", "TV is fun.", "Cars are fast."], type: "multiple_choice" },
    { q: "A supporting detail should:", a: "Relate directly to the topic sentence", opts: ["Relate directly to the topic sentence", "Change the subject", "Be unrelated", "Repeat the title"], type: "multiple_choice" },
    { q: "Topic sentence: 'Recycling protects the environment.' Which supports it?", a: "It reduces the amount of trash in landfills.", opts: ["It reduces the amount of trash in landfills.", "I have a red bike.", "Math is hard.", "The store was busy."], type: "multiple_choice" },
    { q: "Which type of detail makes the STRONGEST support?", a: "A specific fact or example", opts: ["A specific fact or example", "A vague opinion", "An unrelated story", "A repeated sentence"], type: "multiple_choice" },
    { q: "Topic sentence: 'Our school garden teaches teamwork.' Best supporting sentence:", a: "Students work together to water and weed the plants.", opts: ["Students work together to water and weed the plants.", "Gardens are outside.", "I forgot my lunch.", "It rained yesterday."], type: "multiple_choice" },
    { q: "How many supporting sentences does a strong paragraph usually have?", a: "Several (two or more)", opts: ["Several (two or more)", "Exactly zero", "Only one ever", "Twenty or more"], type: "multiple_choice" },
    { q: "Topic sentence: 'Reading has many benefits.' Which sentence supports it?", a: "It builds vocabulary and imagination.", opts: ["It builds vocabulary and imagination.", "Books are heavy.", "I watched a movie.", "Lunch was tasty."], type: "multiple_choice" },
    { q: "A supporting sentence that gives a 'for example' is providing:", a: "An example detail", opts: ["An example detail", "A topic sentence", "A conclusion", "A title"], type: "multiple_choice" },
    { q: "Topic sentence: 'Bees are important.' Which does NOT support it?", a: "My cousin is afraid of bees.", opts: ["My cousin is afraid of bees.", "Bees pollinate many crops.", "Bees make honey we eat.", "Bees help flowers grow."], type: "multiple_choice" },
    { q: "Good supporting sentences help the reader:", a: "Understand and believe the main idea", opts: ["Understand and believe the main idea", "Get confused", "Forget the topic", "Skip the paragraph"], type: "multiple_choice" },
    { q: "Topic sentence: 'Water is essential for life.' Best support:", a: "All living things need water to survive.", opts: ["All living things need water to survive.", "Pools are fun.", "I like ice cream.", "The faucet is silver."], type: "multiple_choice" },
    { q: "Which is the best order in a paragraph?", a: "Topic sentence, then supporting details, then conclusion", opts: ["Topic sentence, then supporting details, then conclusion", "Conclusion, then topic sentence", "Only details, no topic", "Random order"], type: "multiple_choice" },
  ], count);
}

function generateConcludingSentenceProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What does a concluding sentence do?", a: "Wraps up or restates the main idea", opts: ["Wraps up or restates the main idea", "Introduces a new topic", "Gives the first detail", "Asks an unrelated question"], type: "multiple_choice" },
    { q: "A concluding sentence usually appears:", a: "At the end of the paragraph", opts: ["At the end of the paragraph", "At the beginning", "In the middle", "In another paragraph"], type: "multiple_choice" },
    { q: "Paragraph about exercise. Which is the best concluding sentence?", a: "Clearly, exercise benefits both the body and mind.", opts: ["Clearly, exercise benefits both the body and mind.", "First, exercise builds muscle.", "My gym is far away.", "Also, swimming is fun."], type: "multiple_choice" },
    { q: "A good conclusion should NOT:", a: "Introduce a brand-new idea", opts: ["Introduce a brand-new idea", "Restate the main idea", "Sum up the details", "Give a final thought"], type: "multiple_choice" },
    { q: "Which word often signals a concluding sentence?", a: "Finally", opts: ["Finally", "First", "Next", "Because"], type: "multiple_choice" },
    { q: "Paragraph about recycling. Best concluding sentence:", a: "In short, recycling is a simple way to protect our planet.", opts: ["In short, recycling is a simple way to protect our planet.", "Recycling is the first step.", "I also like to compost.", "Bins come in many colors."], type: "multiple_choice" },
    { q: "A concluding sentence helps the reader by:", a: "Signaling the paragraph is ending and reminding them of the point", opts: ["Signaling the paragraph is ending and reminding them of the point", "Starting a new argument", "Adding new evidence", "Changing the topic"], type: "multiple_choice" },
    { q: "Which is a weak conclusion?", a: "By the way, my dog is named Max.", opts: ["By the way, my dog is named Max.", "Overall, dogs make wonderful pets.", "In conclusion, dogs are loyal friends.", "Clearly, dogs deserve good care."], type: "multiple_choice" },
    { q: "Concluding phrases include:", a: "'In conclusion', 'overall', 'in short'", opts: ["'In conclusion', 'overall', 'in short'", "'first', 'next', 'then'", "'because', 'since', 'as'", "'for example', 'such as'"], type: "multiple_choice" },
    { q: "Paragraph about a great class trip. Best conclusion:", a: "All in all, the field trip was a memorable success.", opts: ["All in all, the field trip was a memorable success.", "We left at nine o'clock.", "The bus was yellow.", "First we saw the museum."], type: "multiple_choice" },
    { q: "A concluding sentence often:", a: "Restates the topic sentence in new words", opts: ["Restates the topic sentence in new words", "Copies the topic sentence exactly", "Lists new facts", "Is left out always"], type: "multiple_choice" },
    { q: "Which best concludes a paragraph on healthy eating?", a: "In the end, healthy eating leads to a stronger, happier life.", opts: ["In the end, healthy eating leads to a stronger, happier life.", "Vegetables are green.", "First, eat breakfast.", "I dislike broccoli."], type: "multiple_choice" },
    { q: "The conclusion and topic sentence should:", a: "Share the same main idea", opts: ["Share the same main idea", "Disagree with each other", "Be about different topics", "Be identical word-for-word"], type: "multiple_choice" },
  ], count);
}

function generateParagraphUnityProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "A paragraph has 'unity' when:", a: "All sentences focus on one main idea", opts: ["All sentences focus on one main idea", "It is very long", "It uses big words", "It has many topics"], type: "multiple_choice" },
    { q: "Topic: 'Healthy breakfasts give energy.' Which sentence breaks unity?", a: "My favorite video game came out yesterday.", opts: ["My favorite video game came out yesterday.", "Eggs provide protein for the morning.", "Oatmeal keeps you full longer.", "Fruit adds vitamins to start the day."], type: "multiple_choice" },
    { q: "To fix a paragraph that lacks unity, you should:", a: "Remove the sentence that is off-topic", opts: ["Remove the sentence that is off-topic", "Add more off-topic sentences", "Delete the topic sentence", "Make it longer"], type: "multiple_choice" },
    { q: "Topic: 'Libraries are valuable.' Which sentence does NOT belong?", a: "I broke my arm last summer.", opts: ["I broke my arm last summer.", "Libraries offer free books.", "Libraries have quiet study spaces.", "Librarians help with research."], type: "multiple_choice" },
    { q: "Every sentence in a unified paragraph should:", a: "Support the topic sentence", opts: ["Support the topic sentence", "Start a new idea", "Contradict the topic", "Be unrelated"], type: "multiple_choice" },
    { q: "Topic: 'Recycling is easy.' Which breaks unity?", a: "The new movie was three hours long.", opts: ["The new movie was three hours long.", "Sort paper, plastic, and glass.", "Rinse containers before recycling.", "Use the right bins."], type: "multiple_choice" },
    { q: "Paragraph unity makes writing:", a: "Clear and focused", opts: ["Clear and focused", "Confusing", "Longer for no reason", "Off-topic"], type: "multiple_choice" },
    { q: "Topic: 'Dogs need daily care.' Which sentence belongs?", a: "They must be walked and fed every day.", opts: ["They must be walked and fed every day.", "Cats sleep a lot.", "I want a new phone.", "Pizza is delicious."], type: "multiple_choice" },
    { q: "A sentence that wanders to a new subject hurts a paragraph's:", a: "Unity", opts: ["Unity", "Spelling", "Capitalization", "Length"], type: "multiple_choice" },
    { q: "Topic: 'Soccer builds teamwork.' Which sentence does NOT belong?", a: "My grandmother bakes great cookies.", opts: ["My grandmother bakes great cookies.", "Players must pass to teammates.", "Teams plan plays together.", "Everyone has a role on the field."], type: "multiple_choice" },
    { q: "Which question helps you check paragraph unity?", a: "Does every sentence relate to the main idea?", opts: ["Does every sentence relate to the main idea?", "Is it very long?", "Are there big words?", "Did I use commas?"], type: "multiple_choice" },
    { q: "Topic: 'Plants need sunlight.' Which sentence keeps unity?", a: "Sunlight lets plants make their food.", opts: ["Sunlight lets plants make their food.", "My bike is blue.", "We watched a game.", "The store closed early."], type: "multiple_choice" },
    { q: "The best paragraphs stick to:", a: "One clear main idea", opts: ["One clear main idea", "As many ideas as possible", "No main idea", "Only questions"], type: "multiple_choice" },
  ], count);
}

// ─── W6: Essay Structure (analytic MC) ─────────────────────────────────────────

function generateIntroductionProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What should an essay introduction do?", a: "Hook the reader, give background, and state the thesis", opts: ["Hook the reader, give background, and state the thesis", "List every detail", "Only say goodbye", "Repeat the conclusion"], type: "multiple_choice" },
    { q: "A 'hook' in an introduction is:", a: "An opening that grabs the reader's attention", opts: ["An opening that grabs the reader's attention", "The last sentence", "A list of sources", "The title"], type: "multiple_choice" },
    { q: "Where does the thesis statement usually go?", a: "At the end of the introduction", opts: ["At the end of the introduction", "In the middle of a body paragraph", "In the conclusion only", "It is not needed"], type: "multiple_choice" },
    { q: "Which is the best hook for an essay about space?", a: "Imagine floating weightless among a million stars.", opts: ["Imagine floating weightless among a million stars.", "This essay is about space.", "Space is a topic.", "I will tell you things."], type: "multiple_choice" },
    { q: "A thesis statement is:", a: "The main argument or claim of the essay", opts: ["The main argument or claim of the essay", "A small detail", "A question with no answer", "The bibliography"], type: "multiple_choice" },
    { q: "Which is the strongest thesis statement?", a: "Schools should start later because it improves health, focus, and grades.", opts: ["Schools should start later because it improves health, focus, and grades.", "Schools are buildings.", "I think about school.", "This is about school times."], type: "multiple_choice" },
    { q: "A good introduction moves from:", a: "General idea to a specific thesis", opts: ["General idea to a specific thesis", "Specific to nothing", "Conclusion to hook", "Detail to detail only"], type: "multiple_choice" },
    { q: "Which sentence does NOT belong in an introduction?", a: "In conclusion, we have proven our point.", opts: ["In conclusion, we have proven our point.", "Have you ever wondered why the sky is blue?", "This essay will explain how light scatters.", "Sunlight is made of many colors."], type: "multiple_choice" },
    { q: "The introduction's background information should:", a: "Help the reader understand the topic", opts: ["Help the reader understand the topic", "Confuse the reader", "Be unrelated", "Give away nothing"], type: "multiple_choice" },
    { q: "A weak introduction often:", a: "Just announces 'This essay is about…'", opts: ["Just announces 'This essay is about…'", "Uses an interesting hook", "States a clear thesis", "Gives helpful background"], type: "multiple_choice" },
    { q: "Which is the best opening hook for a persuasive essay on recycling?", a: "Every year, we throw away enough trash to circle the Earth.", opts: ["Every year, we throw away enough trash to circle the Earth.", "Recycling is my topic.", "I am writing about recycling.", "Trash exists."], type: "multiple_choice" },
    { q: "The thesis controls the rest of the essay because it:", a: "States the main point each paragraph will support", opts: ["States the main point each paragraph will support", "Is a random fact", "Ends the essay", "Lists the sources"], type: "multiple_choice" },
    { q: "A good introduction is usually:", a: "One well-organized paragraph", opts: ["One well-organized paragraph", "The whole essay", "A single word", "Only the title"], type: "multiple_choice" },
  ], count);
}

function generateBodyParagraphProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Each body paragraph should focus on:", a: "One main point that supports the thesis", opts: ["One main point that supports the thesis", "Every idea at once", "The conclusion", "An unrelated topic"], type: "multiple_choice" },
    { q: "A body paragraph usually begins with a:", a: "Topic sentence", opts: ["Topic sentence", "Thesis statement", "Conclusion", "Hook"], type: "multiple_choice" },
    { q: "How many body paragraphs does a basic five-paragraph essay have?", a: "Three", opts: ["Three", "One", "Five", "Ten"], type: "multiple_choice" },
    { q: "Body paragraphs should include:", a: "Evidence and examples that support the point", opts: ["Evidence and examples that support the point", "Only opinions with no support", "Unrelated stories", "The title again"], type: "multiple_choice" },
    { q: "What connects body paragraphs smoothly?", a: "Transition words and phrases", opts: ["Transition words and phrases", "Random facts", "Blank lines", "New thesis statements"], type: "multiple_choice" },
    { q: "Which sentence belongs in a body paragraph about exercise benefits?", a: "Studies show that daily activity lowers stress levels.", opts: ["Studies show that daily activity lowers stress levels.", "In conclusion, exercise is great.", "This essay is about exercise.", "My shoes are blue."], type: "multiple_choice" },
    { q: "A body paragraph that includes two different main points should be:", a: "Split into two paragraphs", opts: ["Split into two paragraphs", "Left as is", "Deleted", "Moved to the intro"], type: "multiple_choice" },
    { q: "Evidence in a body paragraph is strongest when it is:", a: "Specific and from a reliable source", opts: ["Specific and from a reliable source", "Vague and made up", "Off-topic", "Just repeated"], type: "multiple_choice" },
    { q: "After giving evidence, a good writer should:", a: "Explain how it supports the point", opts: ["Explain how it supports the point", "Start a new topic", "Stop writing", "Repeat the evidence"], type: "multiple_choice" },
    { q: "The body of an essay comes:", a: "Between the introduction and conclusion", opts: ["Between the introduction and conclusion", "Before the introduction", "After the conclusion", "In the title"], type: "multiple_choice" },
    { q: "Each body paragraph should connect back to the:", a: "Thesis statement", opts: ["Thesis statement", "Reader's name", "Page number", "Bibliography"], type: "multiple_choice" },
    { q: "Which is a sign of a well-organized body paragraph?", a: "Topic sentence, evidence, explanation, and a link to the next idea", opts: ["Topic sentence, evidence, explanation, and a link to the next idea", "Only one short sentence", "A list of unrelated facts", "Just a question"], type: "multiple_choice" },
  ], count);
}

function generateConclusionProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is the purpose of an essay's conclusion?", a: "To summarize the main points and restate the thesis", opts: ["To summarize the main points and restate the thesis", "To introduce new evidence", "To start a new argument", "To give the hook"], type: "multiple_choice" },
    { q: "A conclusion should NOT:", a: "Add brand-new information", opts: ["Add brand-new information", "Restate the thesis", "Summarize key points", "Leave a final thought"], type: "multiple_choice" },
    { q: "Which is the best closing sentence for a persuasive essay?", a: "For these reasons, our community should plant more trees.", opts: ["For these reasons, our community should plant more trees.", "Also, I forgot to mention squirrels.", "First, trees give shade.", "Trees are tall."], type: "multiple_choice" },
    { q: "A strong conclusion often ends with:", a: "A memorable final thought or call to action", opts: ["A memorable final thought or call to action", "A brand-new topic", "A random fact", "An unfinished sentence"], type: "multiple_choice" },
    { q: "The conclusion should connect back to the:", a: "Introduction and thesis", opts: ["Introduction and thesis", "Bibliography", "Title page", "Reader's address"], type: "multiple_choice" },
    { q: "Which phrase signals a conclusion?", a: "In conclusion,", opts: ["In conclusion,", "First of all,", "For example,", "On the other hand,"], type: "multiple_choice" },
    { q: "Restating the thesis in the conclusion means:", a: "Saying the main idea again in fresh words", opts: ["Saying the main idea again in fresh words", "Copying it exactly", "Ignoring it", "Arguing against it"], type: "multiple_choice" },
    { q: "Which sentence does NOT belong in a conclusion?", a: "A new study released today found three more reasons.", opts: ["A new study released today found three more reasons.", "Overall, recycling helps everyone.", "In short, the benefits are clear.", "We should all do our part."], type: "multiple_choice" },
    { q: "A good conclusion leaves the reader:", a: "With a clear sense of the essay's point", opts: ["With a clear sense of the essay's point", "Confused", "Wanting the introduction", "With new questions only"], type: "multiple_choice" },
    { q: "A 'call to action' in a conclusion:", a: "Asks the reader to do something", opts: ["Asks the reader to do something", "Introduces evidence", "States the hook", "Lists sources"], type: "multiple_choice" },
    { q: "The conclusion is usually:", a: "The final paragraph of the essay", opts: ["The final paragraph of the essay", "The first paragraph", "A body paragraph", "The title"], type: "multiple_choice" },
    { q: "Which is the strongest concluding thought?", a: "If we act now, we can protect our oceans for the future.", opts: ["If we act now, we can protect our oceans for the future.", "Oceans are wet.", "I like the beach.", "There are many fish."], type: "multiple_choice" },
  ], count);
}

function generateTransitionMcProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Choose the best transition: 'I was tired. ___, I finished my work.'", a: "Nevertheless", opts: ["Nevertheless", "For example", "First", "Because"], type: "multiple_choice" },
    { q: "Which transition shows ADDITION?", a: "Furthermore", opts: ["Furthermore", "However", "Therefore", "Meanwhile"], type: "multiple_choice" },
    { q: "Which transition shows CONTRAST?", a: "However", opts: ["However", "Also", "Finally", "Similarly"], type: "multiple_choice" },
    { q: "Which transition shows CAUSE AND EFFECT?", a: "Therefore", opts: ["Therefore", "In addition", "For instance", "Meanwhile"], type: "multiple_choice" },
    { q: "Choose the best transition: 'She practiced daily. ___, she won the contest.'", a: "As a result", opts: ["As a result", "However", "For example", "In contrast"], type: "multiple_choice" },
    { q: "Which transition introduces an EXAMPLE?", a: "For instance", opts: ["For instance", "However", "Therefore", "Finally"], type: "multiple_choice" },
    { q: "Which transition shows TIME ORDER?", a: "Next", opts: ["Next", "However", "Therefore", "Similarly"], type: "multiple_choice" },
    { q: "Choose the best transition: 'The plan was risky. ___, we decided to try it.'", a: "Still", opts: ["Still", "For example", "First", "Likewise"], type: "multiple_choice" },
    { q: "Which transition shows COMPARISON (similarity)?", a: "Similarly", opts: ["Similarly", "In contrast", "However", "Although"], type: "multiple_choice" },
    { q: "Transitions help writing by:", a: "Connecting ideas smoothly", opts: ["Connecting ideas smoothly", "Adding confusion", "Ending the essay", "Repeating words"], type: "multiple_choice" },
    { q: "Choose the best transition: 'First, gather your tools. ___, read the directions.'", a: "Next", opts: ["Next", "However", "Therefore", "In conclusion"], type: "multiple_choice" },
    { q: "Which transition best concludes a paragraph?", a: "In conclusion", opts: ["In conclusion", "First", "For example", "Meanwhile"], type: "multiple_choice" },
    { q: "'On the other hand' is a transition that shows:", a: "Contrast", opts: ["Contrast", "Addition", "Time", "Example"], type: "multiple_choice" },
    { q: "Choose the best transition: 'It rained all day. ___, the game was canceled.'", a: "Consequently", opts: ["Consequently", "For example", "Similarly", "First"], type: "multiple_choice" },
  ], count);
}

// ─── W7: Narrative Writing (analytic MC) ───────────────────────────────────────

function generatePlotProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is the 'exposition' of a story?", a: "The beginning that introduces characters and setting", opts: ["The beginning that introduces characters and setting", "The most exciting moment", "The ending", "The problem being solved"], type: "multiple_choice" },
    { q: "The 'climax' of a story is:", a: "The turning point or most intense moment", opts: ["The turning point or most intense moment", "The introduction", "The first event", "The list of characters"], type: "multiple_choice" },
    { q: "What is 'rising action'?", a: "Events that build tension leading to the climax", opts: ["Events that build tension leading to the climax", "The calm ending", "The setting only", "The title"], type: "multiple_choice" },
    { q: "What is the 'resolution'?", a: "The ending where the problem is solved", opts: ["The ending where the problem is solved", "The turning point", "The opening scene", "The conflict starting"], type: "multiple_choice" },
    { q: "Put these plot parts in order:", a: "Exposition, rising action, climax, falling action, resolution", opts: ["Exposition, rising action, climax, falling action, resolution", "Climax, exposition, resolution", "Resolution, climax, exposition", "Rising action, exposition, climax"], type: "multiple_choice" },
    { q: "The 'conflict' in a story is:", a: "The main problem the characters face", opts: ["The main problem the characters face", "The setting", "The narrator", "The title"], type: "multiple_choice" },
    { q: "'Falling action' happens:", a: "After the climax, leading to the resolution", opts: ["After the climax, leading to the resolution", "Before the exposition", "During the introduction", "Instead of the climax"], type: "multiple_choice" },
    { q: "In 'a hero finally defeats the villain after a long struggle', the defeat is the:", a: "Climax", opts: ["Climax", "Exposition", "Resolution", "Setting"], type: "multiple_choice" },
    { q: "A 'character vs. character' struggle is a type of:", a: "Conflict", opts: ["Conflict", "Setting", "Theme", "Resolution"], type: "multiple_choice" },
    { q: "Which part of the plot usually comes first?", a: "Exposition", opts: ["Exposition", "Climax", "Resolution", "Falling action"], type: "multiple_choice" },
    { q: "A struggle inside a character's own mind is called:", a: "Internal conflict", opts: ["Internal conflict", "External conflict", "Resolution", "Exposition"], type: "multiple_choice" },
    { q: "The events after the climax that wrap things up are the:", a: "Falling action and resolution", opts: ["Falling action and resolution", "Rising action", "Exposition", "Hook"], type: "multiple_choice" },
    { q: "The plot is best described as:", a: "The sequence of events in a story", opts: ["The sequence of events in a story", "Where the story happens", "Who tells the story", "The lesson learned"], type: "multiple_choice" },
  ], count);
}

function generateCharacterDevProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is characterization?", a: "How an author reveals a character's personality", opts: ["How an author reveals a character's personality", "Where the story takes place", "The order of events", "The lesson of the story"], type: "multiple_choice" },
    { q: "A character who changes over the story is called:", a: "Dynamic", opts: ["Dynamic", "Static", "Flat", "Minor"], type: "multiple_choice" },
    { q: "A character who stays the same is called:", a: "Static", opts: ["Static", "Dynamic", "Round", "Main"], type: "multiple_choice" },
    { q: "'Indirect characterization' shows personality through:", a: "A character's actions, words, and thoughts", opts: ["A character's actions, words, and thoughts", "Direct statements only", "The setting", "The page count"], type: "multiple_choice" },
    { q: "Which sentence reveals character through ACTION?", a: "Maya quietly gave her lunch to the new student.", opts: ["Maya quietly gave her lunch to the new student.", "Maya was kind.", "Maya is a girl.", "Maya is twelve."], type: "multiple_choice" },
    { q: "The main character of a story is the:", a: "Protagonist", opts: ["Protagonist", "Antagonist", "Narrator only", "Setting"], type: "multiple_choice" },
    { q: "The character who opposes the main character is the:", a: "Antagonist", opts: ["Antagonist", "Protagonist", "Author", "Narrator"], type: "multiple_choice" },
    { q: "'Direct characterization' is when the author:", a: "Tells the reader exactly what a character is like", opts: ["Tells the reader exactly what a character is like", "Hides all traits", "Only describes setting", "Shows it through actions"], type: "multiple_choice" },
    { q: "A character's 'motivation' is:", a: "The reason behind their actions", opts: ["The reason behind their actions", "Their physical look", "The story's setting", "The title"], type: "multiple_choice" },
    { q: "Which detail best DEVELOPS a brave character?", a: "He stepped forward to help even though his hands shook.", opts: ["He stepped forward to help even though his hands shook.", "He had brown hair.", "He owned a backpack.", "He was tall."], type: "multiple_choice" },
    { q: "A 'round' character is:", a: "Complex, with many traits", opts: ["Complex, with many traits", "Simple, with one trait", "Never described", "The setting"], type: "multiple_choice" },
    { q: "We learn the most about a character from:", a: "What they say and do", opts: ["What they say and do", "The book's cover", "The page numbers", "The font"], type: "multiple_choice" },
    { q: "If a shy character speaks up at the end, this shows the character is:", a: "Dynamic (has changed)", opts: ["Dynamic (has changed)", "Static", "Flat", "Minor"], type: "multiple_choice" },
  ], count);
}

function generateSettingMoodProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is the 'setting' of a story?", a: "The time and place where it happens", opts: ["The time and place where it happens", "The main character", "The problem", "The lesson"], type: "multiple_choice" },
    { q: "'Mood' in a story is:", a: "The feeling the story creates in the reader", opts: ["The feeling the story creates in the reader", "The plot order", "The narrator's name", "The page count"], type: "multiple_choice" },
    { q: "'The fog crept over the silent, abandoned town.' The mood is:", a: "Eerie / mysterious", opts: ["Eerie / mysterious", "Cheerful", "Funny", "Excited"], type: "multiple_choice" },
    { q: "Authors create setting with details about:", a: "Time, place, and surroundings", opts: ["Time, place, and surroundings", "Only dialogue", "Only the title", "Page numbers"], type: "multiple_choice" },
    { q: "'Golden sunlight warmed the laughing children at the fair.' The mood is:", a: "Happy / cheerful", opts: ["Happy / cheerful", "Scary", "Gloomy", "Tense"], type: "multiple_choice" },
    { q: "Which detail best sets a SPOOKY mood?", a: "A cold wind rattled the broken shutters.", opts: ["A cold wind rattled the broken shutters.", "Bright balloons filled the room.", "The puppy wagged its tail.", "Warm cookies cooled on the rack."], type: "multiple_choice" },
    { q: "Setting can affect a story by:", a: "Shaping the mood and the events", opts: ["Shaping the mood and the events", "Doing nothing", "Replacing the plot", "Naming the author"], type: "multiple_choice" },
    { q: "'A storm raged as she waited alone in the dark.' This mostly creates:", a: "Tension / suspense", opts: ["Tension / suspense", "Joy", "Boredom", "Humor"], type: "multiple_choice" },
    { q: "Which words help build a peaceful setting?", a: "Calm, gentle, quiet, soft", opts: ["Calm, gentle, quiet, soft", "Crash, scream, panic", "Slam, shove, sprint", "Roar, blast, burn"], type: "multiple_choice" },
    { q: "A story set 'in a busy city in the future' tells us the:", a: "Setting (time and place)", opts: ["Setting (time and place)", "Theme", "Conflict", "Narrator"], type: "multiple_choice" },
    { q: "Changing the setting from a sunny park to a dark cave would mostly change the:", a: "Mood", opts: ["Mood", "Number of pages", "Author", "Title"], type: "multiple_choice" },
    { q: "Mood is created mainly through:", a: "Word choice and descriptive details", opts: ["Word choice and descriptive details", "The page count", "The cover price", "Chapter numbers"], type: "multiple_choice" },
  ], count);
}

function generateDialogueProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which sentence punctuates dialogue correctly?", a: "\"Let's go,\" said Mia.", opts: ["\"Let's go,\" said Mia.", "\"Let's go\" said Mia.", "Let's go, said Mia.", "\"Let's go,\" said Mia"], type: "multiple_choice" },
    { q: "What is dialogue?", a: "The words characters speak to each other", opts: ["The words characters speak to each other", "The setting description", "The narrator's summary", "The list of events"], type: "multiple_choice" },
    { q: "In dialogue, you start a new paragraph when:", a: "A new person speaks", opts: ["A new person speaks", "Every sentence", "The setting changes only", "Never"], type: "multiple_choice" },
    { q: "Which is correct?", a: "\"Where are you going?\" she asked.", opts: ["\"Where are you going?\" she asked.", "\"Where are you going\"? she asked.", "Where are you going? she asked.", "\"Where are you going? she asked.\""], type: "multiple_choice" },
    { q: "Good dialogue can reveal a character's:", a: "Personality and feelings", opts: ["Personality and feelings", "Page number", "Font", "Word count"], type: "multiple_choice" },
    { q: "Quotation marks go around:", a: "The exact words a character says", opts: ["The exact words a character says", "The whole paragraph", "The character's name", "The setting"], type: "multiple_choice" },
    { q: "Which is correct?", a: "Dad said, \"Dinner is ready.\"", opts: ["Dad said, \"Dinner is ready.\"", "Dad said \"Dinner is ready\".", "Dad said, Dinner is ready.", "\"Dad said Dinner is ready.\""], type: "multiple_choice" },
    { q: "A 'dialogue tag' is a phrase like:", a: "'she said' or 'he asked'", opts: ["'she said' or 'he asked'", "'the end'", "'chapter one'", "'in conclusion'"], type: "multiple_choice" },
    { q: "Realistic dialogue should sound:", a: "Like how people actually talk", opts: ["Like how people actually talk", "Very formal always", "Like a list of facts", "Like the title"], type: "multiple_choice" },
    { q: "Which is correct?", a: "\"I won!\" shouted Leo.", opts: ["\"I won!\" shouted Leo.", "\"I won\"! shouted Leo.", "I won! shouted Leo.", "\"I won! shouted Leo.\""], type: "multiple_choice" },
    { q: "End punctuation in a quote usually goes:", a: "Inside the quotation marks", opts: ["Inside the quotation marks", "Outside the quotation marks", "It is left out", "Before the quote"], type: "multiple_choice" },
    { q: "Instead of always writing 'said', a writer might use:", a: "whispered, shouted, replied", opts: ["whispered, shouted, replied", "the, and, but", "first, next, last", "noun, verb, adjective"], type: "multiple_choice" },
  ], count);
}

// ─── W8: Persuasive Writing (analytic MC) ──────────────────────────────────────

function generateClaimsEvidenceProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is a 'claim' in persuasive writing?", a: "The main position the writer is arguing for", opts: ["The main position the writer is arguing for", "A small unrelated detail", "The setting", "A question with no answer"], type: "multiple_choice" },
    { q: "Claim: 'Schools should recycle.' Which is the STRONGEST evidence?", a: "A study found schools that recycle cut waste by 40%.", opts: ["A study found schools that recycle cut waste by 40%.", "Recycling is nice.", "I like recycling.", "My friend agrees."], type: "multiple_choice" },
    { q: "Good evidence is:", a: "Specific, relevant, and from a reliable source", opts: ["Specific, relevant, and from a reliable source", "Vague and made up", "Off-topic", "Just an opinion"], type: "multiple_choice" },
    { q: "Which is a CLAIM (not evidence)?", a: "Students should have longer recess.", opts: ["Students should have longer recess.", "Research shows breaks improve focus.", "A 2020 study measured attention spans.", "Doctors recommend 60 minutes of play."], type: "multiple_choice" },
    { q: "Claim: 'Reading daily helps students.' Best evidence:", a: "Readers scored higher on vocabulary tests.", opts: ["Readers scored higher on vocabulary tests.", "Books are everywhere.", "I think reading is good.", "Libraries are quiet."], type: "multiple_choice" },
    { q: "Evidence that is just 'a lot of people say so' is:", a: "Weak support", opts: ["Weak support", "The strongest support", "A statistic", "A claim"], type: "multiple_choice" },
    { q: "After giving evidence, a writer should:", a: "Explain how it supports the claim", opts: ["Explain how it supports the claim", "Change the subject", "Stop writing", "Repeat the claim only"], type: "multiple_choice" },
    { q: "Which is an example of statistical evidence?", a: "Sales rose by 25% after the change.", opts: ["Sales rose by 25% after the change.", "It felt better.", "People liked it.", "It was good."], type: "multiple_choice" },
    { q: "A persuasive paragraph usually states the claim and then gives:", a: "Reasons and evidence", opts: ["Reasons and evidence", "Only questions", "Unrelated stories", "The title"], type: "multiple_choice" },
    { q: "Which evidence best supports 'Exercise improves grades'?", a: "Students who exercised daily had higher test averages.", opts: ["Students who exercised daily had higher test averages.", "Gyms are big.", "I like to run.", "Sports are popular."], type: "multiple_choice" },
    { q: "Credible evidence often comes from:", a: "Experts, studies, and reliable data", opts: ["Experts, studies, and reliable data", "A random guess", "A single friend", "Made-up numbers"], type: "multiple_choice" },
    { q: "A claim without any evidence is:", a: "Unconvincing", opts: ["Unconvincing", "Very strong", "A statistic", "A counterargument"], type: "multiple_choice" },
  ], count);
}

function generateCounterargumentProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is a counterargument?", a: "The opposing view that you address and respond to", opts: ["The opposing view that you address and respond to", "Your own main claim", "A supporting detail", "The conclusion"], type: "multiple_choice" },
    { q: "Why address a counterargument?", a: "It shows you understand both sides and strengthens your case", opts: ["It shows you understand both sides and strengthens your case", "It weakens your essay", "It confuses readers", "It is never useful"], type: "multiple_choice" },
    { q: "To 'refute' a counterargument means to:", a: "Argue against it with reasons", opts: ["Argue against it with reasons", "Agree with it fully", "Ignore it", "Repeat it"], type: "multiple_choice" },
    { q: "Claim: 'Students should have phones at school.' A counterargument is:", a: "Phones can distract students from learning.", opts: ["Phones can distract students from learning.", "Phones help students call home.", "Phones are useful tools.", "Phones can be educational."], type: "multiple_choice" },
    { q: "Which phrase introduces a counterargument?", a: "Some people argue that…", opts: ["Some people argue that…", "For example,", "In conclusion,", "First of all,"], type: "multiple_choice" },
    { q: "A strong essay both states the claim and:", a: "Answers the other side's best objection", opts: ["Answers the other side's best objection", "Ignores all opposition", "Repeats the claim ten times", "Avoids evidence"], type: "multiple_choice" },
    { q: "After presenting a counterargument, you should:", a: "Respond with a rebuttal", opts: ["Respond with a rebuttal", "End the essay", "Switch sides", "Say nothing"], type: "multiple_choice" },
    { q: "Claim: 'We should ban plastic bags.' A counterargument is:", a: "Plastic bags are cheap and convenient for stores.", opts: ["Plastic bags are cheap and convenient for stores.", "Plastic harms sea animals.", "Reusable bags last longer.", "Bans reduce litter."], type: "multiple_choice" },
    { q: "Acknowledging the other side makes a writer seem:", a: "Fair and credible", opts: ["Fair and credible", "Weak and unsure", "Confused", "Biased"], type: "multiple_choice" },
    { q: "A 'rebuttal' is:", a: "Your response that disproves the counterargument", opts: ["Your response that disproves the counterargument", "The opposing claim", "A piece of evidence for the other side", "The introduction"], type: "multiple_choice" },
    { q: "Which sentence is a rebuttal to 'Phones distract students'?", a: "However, schools can set rules so phones are only used for learning.", opts: ["However, schools can set rules so phones are only used for learning.", "Phones are distracting.", "Many students own phones.", "Phones are expensive."], type: "multiple_choice" },
    { q: "Ignoring counterarguments makes an argument:", a: "Weaker and one-sided", opts: ["Weaker and one-sided", "More balanced", "More convincing", "Complete"], type: "multiple_choice" },
  ], count);
}

function generatePersuasiveTechniqueProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "An appeal to the reader's EMOTIONS is called:", a: "Pathos", opts: ["Pathos", "Logos", "Ethos", "Thesis"], type: "multiple_choice" },
    { q: "An appeal to LOGIC and facts is called:", a: "Logos", opts: ["Logos", "Pathos", "Ethos", "Bias"], type: "multiple_choice" },
    { q: "An appeal to the writer's CREDIBILITY is called:", a: "Ethos", opts: ["Ethos", "Pathos", "Logos", "Claim"], type: "multiple_choice" },
    { q: "'Nine out of ten dentists recommend this toothpaste' mainly uses:", a: "Logos (statistics) and ethos (experts)", opts: ["Logos (statistics) and ethos (experts)", "Pathos only", "No appeal", "A counterargument"], type: "multiple_choice" },
    { q: "'Imagine the heartbreak of a child with no toys this winter.' This uses:", a: "Pathos", opts: ["Pathos", "Logos", "Ethos", "A statistic"], type: "multiple_choice" },
    { q: "'As a doctor with 20 years of experience, I advise…' uses:", a: "Ethos", opts: ["Ethos", "Pathos", "Logos", "Bias"], type: "multiple_choice" },
    { q: "A 'rhetorical question' is used to:", a: "Make the reader think, without expecting an answer", opts: ["Make the reader think, without expecting an answer", "Get a spoken reply", "List facts", "End the essay"], type: "multiple_choice" },
    { q: "Repeating a key phrase for effect is a technique called:", a: "Repetition", opts: ["Repetition", "Statistics", "Counterargument", "Citation"], type: "multiple_choice" },
    { q: "'Everyone is buying this, so you should too' is which technique?", a: "Bandwagon appeal", opts: ["Bandwagon appeal", "Logos", "Ethos", "Rebuttal"], type: "multiple_choice" },
    { q: "Which appeal relies on data and reasoning?", a: "Logos", opts: ["Logos", "Pathos", "Ethos", "Bandwagon"], type: "multiple_choice" },
    { q: "'Protect our children's future — act now!' mainly appeals to:", a: "Emotion (pathos)", opts: ["Emotion (pathos)", "Logic (logos)", "Credibility (ethos)", "Nothing"], type: "multiple_choice" },
    { q: "Using trustworthy sources and a fair tone builds:", a: "Ethos (credibility)", opts: ["Ethos (credibility)", "Pathos", "Bandwagon", "Bias"], type: "multiple_choice" },
    { q: "The three classic persuasive appeals are:", a: "Ethos, pathos, logos", opts: ["Ethos, pathos, logos", "Plot, setting, theme", "Noun, verb, adjective", "First, next, last"], type: "multiple_choice" },
  ], count);
}

function generateEssayStructureProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What are the three main parts of an essay?", a: "Introduction, body, conclusion", opts: ["Introduction, body, conclusion", "Title, author, date", "Hook, hook, hook", "Claim, claim, claim"], type: "multiple_choice" },
    { q: "A persuasive essay's introduction should end with a:", a: "Clear thesis (the claim)", opts: ["Clear thesis (the claim)", "Random fact", "Counterargument", "Goodbye"], type: "multiple_choice" },
    { q: "In a five-paragraph persuasive essay, the body has:", a: "Three paragraphs of reasons and evidence", opts: ["Three paragraphs of reasons and evidence", "No paragraphs", "Only the thesis", "Ten paragraphs"], type: "multiple_choice" },
    { q: "Where is the best place to address the counterargument?", a: "In a body paragraph, then refute it", opts: ["In a body paragraph, then refute it", "In the title", "Never", "Only in the hook"], type: "multiple_choice" },
    { q: "The conclusion of a persuasive essay should:", a: "Restate the thesis and end with a call to action", opts: ["Restate the thesis and end with a call to action", "Add new evidence", "Introduce the topic", "List sources only"], type: "multiple_choice" },
    { q: "Each body paragraph should focus on:", a: "One reason that supports the thesis", opts: ["One reason that supports the thesis", "Every reason at once", "The conclusion", "An unrelated idea"], type: "multiple_choice" },
    { q: "What connects the paragraphs of an essay smoothly?", a: "Transitions", opts: ["Transitions", "Blank pages", "New theses", "Random facts"], type: "multiple_choice" },
    { q: "The strongest reason in a persuasive essay is often placed:", a: "Last, for emphasis", opts: ["Last, for emphasis", "Never included", "In the title", "Only in the intro"], type: "multiple_choice" },
    { q: "A well-structured essay keeps every paragraph tied to the:", a: "Thesis", opts: ["Thesis", "Page number", "Author's name", "Font"], type: "multiple_choice" },
    { q: "Which order is correct for a persuasive essay?", a: "Intro with thesis → reasons with evidence → conclusion", opts: ["Intro with thesis → reasons with evidence → conclusion", "Conclusion → intro → body", "Body → conclusion → intro", "Thesis only"], type: "multiple_choice" },
    { q: "A thesis statement should be:", a: "A clear, arguable claim", opts: ["A clear, arguable claim", "A simple fact no one disputes", "A question", "A list of topics"], type: "multiple_choice" },
    { q: "The purpose of a persuasive essay is to:", a: "Convince the reader to agree or act", opts: ["Convince the reader to agree or act", "Tell a funny story", "List directions", "Describe a place only"], type: "multiple_choice" },
  ], count);
}

// ─── W2: Parts of Speech (MC) ──────────────────────────────────────────────────

function generateNounsVerbsProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which word is a noun?", a: "car", opts: ["car", "eat", "fast", "loudly"], type: "multiple_choice" },
    { q: "Which word is a verb?", a: "jump", opts: ["jump", "table", "happy", "city"], type: "multiple_choice" },
    { q: "A noun is a word that names a:", a: "Person, place, or thing", opts: ["Person, place, or thing", "Action", "Describing word", "Joining word"], type: "multiple_choice" },
    { q: "A verb is a word that shows:", a: "An action or state of being", opts: ["An action or state of being", "A name", "A description", "A place only"], type: "multiple_choice" },
    { q: "Identify the verb: 'She ran to school.'", a: "ran", opts: ["ran", "She", "school", "to"], type: "multiple_choice" },
    { q: "Identify the noun: 'The dog barked.'", a: "dog", opts: ["dog", "barked", "the", "loudly"], type: "multiple_choice" },
    { q: "Which is a proper noun (names a specific thing)?", a: "London", opts: ["London", "city", "river", "table"], type: "multiple_choice" },
    { q: "Which word is a noun?", a: "school", opts: ["school", "run", "blue", "quickly"], type: "multiple_choice" },
    { q: "Which word is the action verb in 'The bird flies high'?", a: "flies", opts: ["flies", "bird", "high", "the"], type: "multiple_choice" },
    { q: "Change to past tense: 'I walk to the store.' The verb becomes:", a: "walked", opts: ["walked", "walking", "walks", "will walk"], type: "multiple_choice" },
    { q: "Which sentence has the verb underlined correctly? (verb in CAPS)", a: "The cat SLEEPS on the bed.", opts: ["The cat SLEEPS on the bed.", "The CAT sleeps on the bed.", "The cat sleeps on the BED.", "THE cat sleeps."], type: "multiple_choice" },
    { q: "Which word is a noun in 'My brother plays soccer'?", a: "brother", opts: ["brother", "plays", "my", "fast"], type: "multiple_choice" },
    { q: "Which is a 'being' verb?", a: "is", opts: ["is", "run", "jump", "sing"], type: "multiple_choice" },
    { q: "How many nouns are in 'The boy kicked the ball'?", a: "Two (boy, ball)", opts: ["Two (boy, ball)", "One", "Three", "Zero"], type: "multiple_choice" },
    { q: "Which word is a verb?", a: "sing", opts: ["sing", "song", "loud", "stage"], type: "multiple_choice" },
    { q: "Which word names a thing (noun)?", a: "apple", opts: ["apple", "eat", "sweet", "quickly"], type: "multiple_choice" },
  ], count);
}

function generateAdjAdverbProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which word is an adjective?", a: "tall", opts: ["tall", "run", "school", "swim"], type: "multiple_choice" },
    { q: "Which word is an adverb?", a: "quickly", opts: ["quickly", "happy", "table", "dog"], type: "multiple_choice" },
    { q: "An adjective describes a:", a: "Noun", opts: ["Noun", "Verb", "Adverb", "Conjunction"], type: "multiple_choice" },
    { q: "An adverb usually describes a:", a: "Verb", opts: ["Verb", "Noun", "Pronoun", "Article"], type: "multiple_choice" },
    { q: "Identify the adjective: 'She wore a beautiful dress.'", a: "beautiful", opts: ["beautiful", "wore", "dress", "she"], type: "multiple_choice" },
    { q: "Identify the adverb: 'He ran quickly.'", a: "quickly", opts: ["quickly", "ran", "he", "fast race"], type: "multiple_choice" },
    { q: "Many adverbs end in:", a: "-ly", opts: ["-ly", "-ed", "-ing", "-s"], type: "multiple_choice" },
    { q: "Which word describes the noun in 'the red car'?", a: "red", opts: ["red", "car", "the", "drive"], type: "multiple_choice" },
    { q: "Comparative of 'big' is:", a: "bigger", opts: ["bigger", "biggest", "big", "more big"], type: "multiple_choice" },
    { q: "Superlative of 'happy' is:", a: "happiest", opts: ["happiest", "happier", "happy", "more happy"], type: "multiple_choice" },
    { q: "In 'The very tall man', what does 'very' describe?", a: "The adjective 'tall'", opts: ["The adjective 'tall'", "The noun 'man'", "The verb", "Nothing"], type: "multiple_choice" },
    { q: "Which sentence has an adverb?", a: "She sang loudly.", opts: ["She sang loudly.", "She sang a song.", "She is a singer.", "The song was nice."], type: "multiple_choice" },
    { q: "Which word is an adjective in 'a cold, windy day'?", a: "cold", opts: ["cold", "day", "a", "blew"], type: "multiple_choice" },
    { q: "Adverbs can tell:", a: "How, when, or where", opts: ["How, when, or where", "Who or what", "Which one only", "How many only"], type: "multiple_choice" },
    { q: "Which is the adverb in 'The turtle moved slowly'?", a: "slowly", opts: ["slowly", "turtle", "moved", "the"], type: "multiple_choice" },
    { q: "Which word is an adjective?", a: "shiny", opts: ["shiny", "shine", "shines", "shining quickly"], type: "multiple_choice" },
  ], count);
}

// ─── W3: Sentence Structure (MC) ───────────────────────────────────────────────

function generateSentenceTypeProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What kind of sentence is 'I ran and she walked'?", a: "Compound", opts: ["Compound", "Simple", "Complex", "Fragment"], type: "multiple_choice" },
    { q: "What kind of sentence is 'The dog barked'?", a: "Simple", opts: ["Simple", "Compound", "Complex", "Run-on"], type: "multiple_choice" },
    { q: "What kind of sentence is 'Because it rained, we stayed inside'?", a: "Complex", opts: ["Complex", "Simple", "Compound", "Fragment"], type: "multiple_choice" },
    { q: "A simple sentence has:", a: "One independent clause", opts: ["One independent clause", "Two independent clauses", "A dependent clause only", "No verb"], type: "multiple_choice" },
    { q: "A compound sentence joins two complete sentences with:", a: "A conjunction like 'and' or 'but'", opts: ["A conjunction like 'and' or 'but'", "A comma only", "A noun", "Nothing"], type: "multiple_choice" },
    { q: "A complex sentence has an independent clause and at least one:", a: "Dependent clause", opts: ["Dependent clause", "Second subject", "List", "Question"], type: "multiple_choice" },
    { q: "Which is a compound sentence?", a: "I like tea, but she likes coffee.", opts: ["I like tea, but she likes coffee.", "I like tea.", "Because I like tea.", "Liking tea a lot."], type: "multiple_choice" },
    { q: "Which is a simple sentence?", a: "The sun set behind the hills.", opts: ["The sun set behind the hills.", "The sun set, and the stars rose.", "When the sun set, we left.", "After the long day."], type: "multiple_choice" },
    { q: "Which is a complex sentence?", a: "When the bell rang, the students left.", opts: ["When the bell rang, the students left.", "The bell rang.", "The bell rang and they left.", "Loud ringing bell."], type: "multiple_choice" },
    { q: "Words like 'because', 'although', and 'when' often begin a:", a: "Dependent clause", opts: ["Dependent clause", "Independent clause", "Compound sentence", "Noun phrase"], type: "multiple_choice" },
    { q: "'She sang and danced' is which type?", a: "Simple (one subject, two verbs)", opts: ["Simple (one subject, two verbs)", "Compound", "Complex", "Run-on"], type: "multiple_choice" },
    { q: "Which coordinating conjunction joins a compound sentence?", a: "but", opts: ["but", "because", "although", "while"], type: "multiple_choice" },
    { q: "What kind of sentence is 'We won the game, and the crowd cheered'?", a: "Compound", opts: ["Compound", "Simple", "Complex", "Fragment"], type: "multiple_choice" },
    { q: "What kind of sentence is 'Although she was tired, she finished'?", a: "Complex", opts: ["Complex", "Simple", "Compound", "Run-on"], type: "multiple_choice" },
    { q: "An independent clause can:", a: "Stand alone as a sentence", opts: ["Stand alone as a sentence", "Never stand alone", "Only ask questions", "Have no subject"], type: "multiple_choice" },
    { q: "Which is a simple sentence?", a: "Birds fly south in winter.", opts: ["Birds fly south in winter.", "Birds fly south, and bears sleep.", "When winter comes, birds fly.", "Flying south quickly."], type: "multiple_choice" },
  ], count);
}

function generateRunOnFragmentProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which is a sentence FRAGMENT (not complete)?", a: "Running down the street.", opts: ["Running down the street.", "She ran down the street.", "The dog barked.", "We left early."], type: "multiple_choice" },
    { q: "Which is a RUN-ON sentence?", a: "I like apples I eat them daily.", opts: ["I like apples I eat them daily.", "I like apples. I eat them daily.", "I like apples, and I eat them daily.", "I like apples."], type: "multiple_choice" },
    { q: "A fragment is missing a:", a: "Subject or a verb (a complete thought)", opts: ["Subject or a verb (a complete thought)", "Capital letter", "Comma", "Period only"], type: "multiple_choice" },
    { q: "A run-on happens when:", a: "Two sentences are joined with no proper punctuation", opts: ["Two sentences are joined with no proper punctuation", "A sentence is too short", "There are too many commas", "A word is misspelled"], type: "multiple_choice" },
    { q: "How can you fix the run-on 'It rained we stayed home'?", a: "It rained, so we stayed home.", opts: ["It rained, so we stayed home.", "It rained we stayed home.", "It rained, we stayed home.", "It rained; we; stayed home."], type: "multiple_choice" },
    { q: "Which is a complete sentence?", a: "The team won the championship.", opts: ["The team won the championship.", "Won the championship.", "The winning team.", "After the big game."], type: "multiple_choice" },
    { q: "Which is a fragment?", a: "Because she was late.", opts: ["Because she was late.", "She was late.", "She arrived late.", "The bus was late."], type: "multiple_choice" },
    { q: "Which sentence is correct (not a run-on)?", a: "We were hungry, so we ordered pizza.", opts: ["We were hungry, so we ordered pizza.", "We were hungry we ordered pizza.", "We were hungry, we ordered pizza.", "We were hungry order pizza."], type: "multiple_choice" },
    { q: "The best way to fix a fragment is to:", a: "Add the missing subject or verb", opts: ["Add the missing subject or verb", "Add more commas", "Make it longer randomly", "Remove the period"], type: "multiple_choice" },
    { q: "Which is a run-on?", a: "The bell rang everyone rushed out.", opts: ["The bell rang everyone rushed out.", "The bell rang, and everyone rushed out.", "The bell rang. Everyone rushed out.", "The bell rang."], type: "multiple_choice" },
    { q: "'In the morning before school' is a:", a: "Fragment", opts: ["Fragment", "Complete sentence", "Run-on", "Compound sentence"], type: "multiple_choice" },
    { q: "Two ways to fix a run-on are using a period or:", a: "A comma plus a conjunction", opts: ["A comma plus a conjunction", "More words", "All capitals", "A question mark"], type: "multiple_choice" },
    { q: "Which is a complete sentence?", a: "The garden bloomed in spring.", opts: ["The garden bloomed in spring.", "Bloomed in spring.", "The blooming garden.", "When spring came."], type: "multiple_choice" },
    { q: "A 'comma splice' is a run-on that joins two sentences with only a:", a: "Comma", opts: ["Comma", "Period", "Semicolon", "Conjunction"], type: "multiple_choice" },
    { q: "Fix the fragment 'Sang a song.' by adding a:", a: "Subject (e.g., 'She sang a song.')", opts: ["Subject (e.g., 'She sang a song.')", "Comma", "Second verb", "Period"], type: "multiple_choice" },
    { q: "Which is correctly written?", a: "I finished my homework. Then I watched TV.", opts: ["I finished my homework. Then I watched TV.", "I finished my homework then I watched TV.", "I finished my homework, then I watched TV then slept.", "Finishing homework watching TV."], type: "multiple_choice" },
  ], count);
}

function generateSubjectPredicateProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "In 'The big dog barked loudly', what is the simple subject?", a: "dog", opts: ["dog", "barked", "big", "loudly"], type: "multiple_choice" },
    { q: "The subject of a sentence tells:", a: "Who or what the sentence is about", opts: ["Who or what the sentence is about", "What the subject does", "When it happened", "Where it happened"], type: "multiple_choice" },
    { q: "The predicate of a sentence tells:", a: "What the subject does or is", opts: ["What the subject does or is", "Who the sentence is about", "The time", "The place name"], type: "multiple_choice" },
    { q: "In 'My sister plays the piano', what is the predicate?", a: "plays the piano", opts: ["plays the piano", "My sister", "sister", "piano"], type: "multiple_choice" },
    { q: "In 'Birds fly', what is the subject?", a: "Birds", opts: ["Birds", "fly", "both", "neither"], type: "multiple_choice" },
    { q: "In 'The students finished their test', what is the complete subject?", a: "The students", opts: ["The students", "finished their test", "students", "test"], type: "multiple_choice" },
    { q: "Every complete sentence must have a subject and a:", a: "Predicate", opts: ["Predicate", "Comma", "Adjective", "Question mark"], type: "multiple_choice" },
    { q: "In 'The tall boy ran fast', the simple predicate (verb) is:", a: "ran", opts: ["ran", "boy", "tall", "fast"], type: "multiple_choice" },
    { q: "Which part is the subject in 'A loud bell rang'?", a: "A loud bell", opts: ["A loud bell", "rang", "loud", "bell rang"], type: "multiple_choice" },
    { q: "In 'The cat slept all day', what is the predicate?", a: "slept all day", opts: ["slept all day", "The cat", "cat", "day"], type: "multiple_choice" },
    { q: "A 'simple subject' is:", a: "The main noun or pronoun, without describing words", opts: ["The main noun or pronoun, without describing words", "The whole sentence", "The verb", "The first word always"], type: "multiple_choice" },
    { q: "Which sentence has 'The happy children' as its complete subject?", a: "The happy children played outside.", opts: ["The happy children played outside.", "Played outside happily.", "Outside the children played.", "Happy and playing."], type: "multiple_choice" },
    { q: "In 'We will visit the museum tomorrow', the subject is:", a: "We", opts: ["We", "visit", "museum", "tomorrow"], type: "multiple_choice" },
    { q: "The complete predicate includes the verb and:", a: "All the words that tell about the verb", opts: ["All the words that tell about the verb", "Only the subject", "Just one word", "The title"], type: "multiple_choice" },
    { q: "In 'Rain fell all night', what is the simple subject?", a: "Rain", opts: ["Rain", "fell", "night", "all"], type: "multiple_choice" },
    { q: "Which group of words has BOTH a subject and a predicate?", a: "The dog ran.", opts: ["The dog ran.", "The big brown dog.", "Running quickly.", "After the game."], type: "multiple_choice" },
  ], count);
}

// ─── W1: Sentence Completion (Grade 1–2) ───────────────────────────────────────

function generateCompletingSentenceProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Finish the sentence: 'The dog likes to ___.'", a: "run", opts: ["run", "table", "blue", "the"], type: "multiple_choice" },
    { q: "Which word completes the sentence? 'I see a ___ in the sky.'", a: "bird", opts: ["bird", "ran", "happy", "under"], type: "multiple_choice" },
    { q: "Finish: 'We eat ___ for breakfast.'", a: "eggs", opts: ["eggs", "jump", "fast", "green"], type: "multiple_choice" },
    { q: "Which word best completes: 'The sun is very ___.'", a: "hot", opts: ["hot", "run", "sit", "blue chair"], type: "multiple_choice" },
    { q: "Finish: 'She ___ to school every day.'", a: "walks", opts: ["walks", "apple", "tall", "and"], type: "multiple_choice" },
    { q: "Which word completes the sentence? 'A fish can ___.'", a: "swim", opts: ["swim", "read", "fly", "drive"], type: "multiple_choice" },
    { q: "Finish: 'The baby began to ___.'", a: "cry", opts: ["cry", "house", "fast", "green"], type: "multiple_choice" },
    { q: "Which word completes: 'I want to ___ a book.'", a: "read", opts: ["read", "milk", "happy", "under"], type: "multiple_choice" },
    { q: "Finish: 'My favourite colour is ___.'", a: "blue", opts: ["blue", "jump", "run", "loud"], type: "multiple_choice" },
    { q: "Which word completes: 'The car is very ___.'", a: "fast", opts: ["fast", "eat", "apple", "sing"], type: "multiple_choice" },
    { q: "Finish: 'Birds can ___ in the sky.'", a: "fly", opts: ["fly", "swim", "read", "sleep deep"], type: "multiple_choice" },
    { q: "Which word completes the sentence? 'We ___ a movie last night.'", a: "watched", opts: ["watched", "table", "green", "quickly under"], type: "multiple_choice" },
    { q: "Finish: 'Please ___ the door.'", a: "close", opts: ["close", "apple", "happy", "rain"], type: "multiple_choice" },
    { q: "Which word completes: 'The ice cream is ___.'", a: "cold", opts: ["cold", "run", "jump", "read"], type: "multiple_choice" },
    { q: "Finish: 'I brush my ___ every morning.'", a: "teeth", opts: ["teeth", "run", "blue", "fast"], type: "multiple_choice" },
    { q: "Which word completes: 'The flowers ___ in spring.'", a: "grow", opts: ["grow", "eat", "drive", "sleep"], type: "multiple_choice" },
  ], count);
}

function generateCapitalLettersProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which sentence is written correctly?", a: "My dog runs.", opts: ["my dog runs.", "My dog runs.", "my Dog runs.", "MY dog runs."], type: "multiple_choice" },
    { q: "Which sentence is written correctly?", a: "We went to the park.", opts: ["we went to the park.", "We went to the park.", "we Went to the park.", "WE went to the park."], type: "multiple_choice" },
    { q: "Which word should always start with a capital letter?", a: "London", opts: ["dog", "London", "happy", "table"], type: "multiple_choice" },
    { q: "Every sentence must begin with a:", a: "capital letter", opts: ["capital letter", "lowercase letter", "number", "comma"], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "Sam likes apples.", opts: ["sam likes apples.", "Sam likes apples.", "sam Likes apples.", "Sam Likes Apples."], type: "multiple_choice" },
    { q: "Which name is written correctly?", a: "Maria", opts: ["maria", "Maria", "mARIA", "MARia"], type: "multiple_choice" },
    { q: "The word 'i' (meaning myself) should be written as:", a: "I", opts: ["i", "I", "ai", "eye"], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "Today is Monday.", opts: ["today is monday.", "Today is Monday.", "today is Monday.", "Today is monday."], type: "multiple_choice" },
    { q: "Which word needs a capital letter?", a: "canada", opts: ["river", "canada", "table", "happy"], type: "multiple_choice" },
    { q: "Which is the correct way to start a sentence?", a: "The cat sat down.", opts: ["the cat sat down.", "The cat sat down.", "tHe cat sat down.", "THE cat sat down."], type: "multiple_choice" },
    { q: "Days of the week (like Friday) should start with a:", a: "capital letter", opts: ["capital letter", "lowercase letter", "number", "space"], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "I love my family.", opts: ["i love my family.", "I love my family.", "I Love My Family.", "i Love my family."], type: "multiple_choice" },
    { q: "Which is correct?", a: "We visited Paris.", opts: ["we visited paris.", "We visited Paris.", "we visited Paris.", "We Visited paris."], type: "multiple_choice" },
    { q: "A person's name should begin with a:", a: "capital letter", opts: ["capital letter", "lowercase letter", "small letter", "number"], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "The bus is here.", opts: ["the bus is here.", "The bus is here.", "the Bus is here.", "THE BUS is here."], type: "multiple_choice" },
    { q: "Which month is written correctly?", a: "July", opts: ["july", "July", "jULY", "JUly"], type: "multiple_choice" },
  ], count);
}

function generatePeriodsProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which sentence ends correctly?", a: "I like cats.", opts: ["I like cats", "I like cats.", "I like cats?", "I like cats,"], type: "multiple_choice" },
    { q: "What punctuation mark ends a telling sentence (statement)?", a: "a period (.)", opts: ["a period (.)", "a question mark (?)", "a comma (,)", "an exclamation mark (!)"], type: "multiple_choice" },
    { q: "Which sentence is punctuated correctly?", a: "We play outside.", opts: ["We play outside", "We play outside.", "We play outside?", "We, play outside"], type: "multiple_choice" },
    { q: "Which sentence needs a period at the end?", a: "The sky is blue", opts: ["Are you okay", "The sky is blue", "Wow", "Stop"], type: "multiple_choice" },
    { q: "A statement (telling sentence) should end with a:", a: "period", opts: ["period", "question mark", "comma", "colon"], type: "multiple_choice" },
    { q: "Which is correct?", a: "My name is Ben.", opts: ["My name is Ben", "My name is Ben.", "My name is Ben?", "My name is Ben!"], type: "multiple_choice" },
    { q: "Which sentence has the period in the right place?", a: "We ate lunch.", opts: ["We ate. lunch", "We ate lunch.", "We. ate lunch", ".We ate lunch"], type: "multiple_choice" },
    { q: "Choose the correct ending: 'The dog is brown___'", a: ".", opts: [".", "?", ",", ":"], type: "multiple_choice" },
    { q: "Which sentence is written correctly?", a: "I have two pets.", opts: ["I have two pets", "I have two pets.", "i have two pets", "I have two pets,"], type: "multiple_choice" },
    { q: "Where does the period go? 'She likes to sing'", a: "After 'sing'", opts: ["After 'She'", "After 'likes'", "After 'sing'", "It does not need one"], type: "multiple_choice" },
    { q: "Which telling sentence is correct?", a: "It is raining today.", opts: ["It is raining today", "It is raining today.", "It is raining today?", "It is, raining today"], type: "multiple_choice" },
    { q: "True or False: Every telling sentence needs a period at the end.", a: "True", opts: ["True", "False"], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "We won the game.", opts: ["We won the game", "We won the game.", "We won. the game", "We won the game,"], type: "multiple_choice" },
    { q: "A period tells the reader to:", a: "stop at the end of a sentence", opts: ["stop at the end of a sentence", "ask a question", "shout", "take a breath in the middle"], type: "multiple_choice" },
    { q: "Which is punctuated correctly?", a: "The bird can fly.", opts: ["The bird can fly", "The bird can fly.", "The bird can fly?", "The. bird can fly"], type: "multiple_choice" },
    { q: "Choose the correct sentence:", a: "I read a book.", opts: ["I read a book", "I read a book.", "I read a book ?", "I read a, book"], type: "multiple_choice" },
  ], count);
}

// ─── W4: Punctuation (Grade 4–6) ───────────────────────────────────────────────

function generateCommaProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which sentence uses commas correctly?", a: "I bought apples, oranges, and pears.", opts: ["I bought apples oranges and pears.", "I bought apples, oranges, and pears.", "I bought, apples oranges and pears.", "I bought apples, oranges and, pears."], type: "multiple_choice" },
    { q: "Which sentence uses a comma correctly?", a: "After dinner, we watched a movie.", opts: ["After dinner we watched a movie.", "After dinner, we watched a movie.", "After, dinner we watched a movie.", "After dinner we, watched a movie."], type: "multiple_choice" },
    { q: "Where does the comma go? 'Yes I would love to come.'", a: "Yes, I would love to come.", opts: ["Yes I, would love to come.", "Yes, I would love to come.", "Yes I would, love to come.", "Yes I would love, to come."], type: "multiple_choice" },
    { q: "Which sentence correctly punctuates the date?", a: "She was born on May 5, 2010.", opts: ["She was born on May 5 2010.", "She was born on May 5, 2010.", "She was born on May, 5 2010.", "She was born, on May 5 2010."], type: "multiple_choice" },
    { q: "Which uses a comma correctly when joining two sentences?", a: "I was tired, so I went to bed.", opts: ["I was tired so I went to bed.", "I was tired, so I went to bed.", "I was, tired so I went to bed.", "I was tired so, I went to bed."], type: "multiple_choice" },
    { q: "Which sentence correctly uses commas to address someone?", a: "Thanks for your help, Maria.", opts: ["Thanks for your help Maria.", "Thanks for your help, Maria.", "Thanks, for your help Maria.", "Thanks for, your help Maria."], type: "multiple_choice" },
    { q: "Which list is punctuated correctly?", a: "We need eggs, milk, and bread.", opts: ["We need eggs milk and bread.", "We need eggs, milk, and bread.", "We need, eggs milk and bread.", "We need eggs, milk and, bread."], type: "multiple_choice" },
    { q: "Where should a comma go? 'Before we leave let's eat.'", a: "Before we leave, let's eat.", opts: ["Before, we leave let's eat.", "Before we leave, let's eat.", "Before we, leave let's eat.", "Before we leave let's, eat."], type: "multiple_choice" },
    { q: "Which uses commas correctly?", a: "My friend, who is tall, plays basketball.", opts: ["My friend who is tall plays basketball.", "My friend, who is tall, plays basketball.", "My friend who is tall, plays basketball.", "My, friend who is tall plays basketball."], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "Well, I am not sure about that.", opts: ["Well I am not sure about that.", "Well, I am not sure about that.", "Well I am, not sure about that.", "Well I am not sure, about that."], type: "multiple_choice" },
    { q: "Which address is punctuated correctly?", a: "He lives in Toronto, Ontario.", opts: ["He lives in Toronto Ontario.", "He lives in Toronto, Ontario.", "He lives, in Toronto Ontario.", "He lives in, Toronto Ontario."], type: "multiple_choice" },
    { q: "A comma is needed after an introductory word or phrase. Which is correct?", a: "Finally, the rain stopped.", opts: ["Finally the rain stopped.", "Finally, the rain stopped.", "Finally the rain, stopped.", "Finally the, rain stopped."], type: "multiple_choice" },
    { q: "Which sentence correctly separates two adjectives?", a: "It was a long, boring movie.", opts: ["It was a long boring movie.", "It was a long, boring movie.", "It was a, long boring movie.", "It was a long boring, movie."], type: "multiple_choice" },
    { q: "Which is correct?", a: "No, I haven't finished yet.", opts: ["No I haven't finished yet.", "No, I haven't finished yet.", "No I haven't, finished yet.", "No I, haven't finished yet."], type: "multiple_choice" },
    { q: "Which sentence uses commas correctly in a series?", a: "She is kind, smart, and funny.", opts: ["She is kind smart and funny.", "She is kind, smart, and funny.", "She is, kind smart and funny.", "She is kind, smart and, funny."], type: "multiple_choice" },
    { q: "Where does the comma belong? 'When the bell rang the students left.'", a: "When the bell rang, the students left.", opts: ["When, the bell rang the students left.", "When the bell rang, the students left.", "When the bell, rang the students left.", "When the bell rang the students, left."], type: "multiple_choice" },
  ], count);
}

function generateApostropheProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which is correct?", a: "the dog's bone", opts: ["the dogs bone", "the dog's bone", "the dogs' bone", "the do'gs bone"], type: "multiple_choice" },
    { q: "Which contraction is correct for 'do not'?", a: "don't", opts: ["dont", "do'nt", "don't", "don't'"], type: "multiple_choice" },
    { q: "Which is correct?", a: "It's raining outside.", opts: ["Its raining outside.", "It's raining outside.", "Its' raining outside.", "I'ts raining outside."], type: "multiple_choice" },
    { q: "Which shows the toy belonging to the baby?", a: "the baby's toy", opts: ["the babys toy", "the baby's toy", "the babys' toy", "the bab'ys toy"], type: "multiple_choice" },
    { q: "Which contraction means 'they are'?", a: "they're", opts: ["their", "there", "they're", "theyre"], type: "multiple_choice" },
    { q: "Which is correct for more than one dog owning the bones?", a: "the dogs' bones", opts: ["the dogs bones", "the dog's bones", "the dogs' bones", "the dogs's bones"], type: "multiple_choice" },
    { q: "Which is correct?", a: "We can't go today.", opts: ["We cant go today.", "We can't go today.", "We ca'nt go today.", "We can't' go today."], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "That is Sarah's book.", opts: ["That is Sarahs book.", "That is Sarah's book.", "That is Sarahs' book.", "That is Sara'hs book."], type: "multiple_choice" },
    { q: "Which contraction means 'I have'?", a: "I've", opts: ["Ive", "I've", "I'have", "Iv'e"], type: "multiple_choice" },
    { q: "Choose the correct word: 'The cat licked ___ paw.'", a: "its", opts: ["its", "it's", "its'", "it is'"], type: "multiple_choice" },
    { q: "Which is correct?", a: "the children's playground", opts: ["the childrens playground", "the children's playground", "the childrens' playground", "the childre'ns playground"], type: "multiple_choice" },
    { q: "Which contraction means 'will not'?", a: "won't", opts: ["wont", "wo'nt", "won't", "willn't"], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "You're my best friend.", opts: ["Your my best friend.", "You're my best friend.", "Youre my best friend.", "Yo'ure my best friend."], type: "multiple_choice" },
    { q: "Which shows the car belonging to James?", a: "James's car", opts: ["James car", "James's car", "Jame's car", "Jamess car"], type: "multiple_choice" },
    { q: "Which contraction means 'is not'?", a: "isn't", opts: ["isnt", "is'nt", "isn't", "i'snt"], type: "multiple_choice" },
    { q: "Choose the correct sentence:", a: "The students' desks were clean.", opts: ["The students desks were clean.", "The students' desks were clean.", "The student's desks were clean (for many students).", "The studen'ts desks were clean."], type: "multiple_choice" },
  ], count);
}

function generateQuotationProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which sentence punctuates the quotation correctly?", a: "\"Let's go,\" said Mia.", opts: ["Let's go, said Mia.", "\"Let's go,\" said Mia.", "\"Let's go\" said Mia.", "\"Let's go,\" said Mia"], type: "multiple_choice" },
    { q: "Where do quotation marks go?", a: "Around the exact words someone says", opts: ["Around the exact words someone says", "Around every sentence", "Around names", "At the end of a paragraph"], type: "multiple_choice" },
    { q: "Which is correct?", a: "Dad said, \"Dinner is ready.\"", opts: ["Dad said, Dinner is ready.", "Dad said, \"Dinner is ready.\"", "Dad said \"Dinner is ready\".", "\"Dad said, Dinner is ready.\""], type: "multiple_choice" },
    { q: "Which sentence is punctuated correctly?", a: "\"Where are you going?\" she asked.", opts: ["\"Where are you going\"? she asked.", "\"Where are you going?\" she asked.", "Where are you going? she asked.", "\"Where are you going? she asked.\""], type: "multiple_choice" },
    { q: "In dialogue, a new speaker means you should:", a: "Start a new paragraph", opts: ["Start a new paragraph", "Use a comma", "Use all capitals", "Skip the quotation marks"], type: "multiple_choice" },
    { q: "Which is correct?", a: "\"I won!\" shouted Leo.", opts: ["I won! shouted Leo.", "\"I won!\" shouted Leo.", "\"I won\"! shouted Leo.", "\"I won! shouted Leo.\""], type: "multiple_choice" },
    { q: "Which sentence places the comma correctly?", a: "\"Thank you,\" he whispered.", opts: ["\"Thank you\", he whispered.", "\"Thank you,\" he whispered.", "\"Thank you\" he whispered.", "Thank you, he whispered."], type: "multiple_choice" },
    { q: "Which is correct?", a: "The teacher said, \"Open your books.\"", opts: ["The teacher said \"Open your books.\"", "The teacher said, \"Open your books.\"", "The teacher said, Open your books.", "\"The teacher said, Open your books.\""], type: "multiple_choice" },
    { q: "Quotation marks come in:", a: "Pairs — one set before and one after the words", opts: ["Pairs — one set before and one after the words", "Only at the start", "Only at the end", "Threes"], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "\"Be careful,\" Mom warned.", opts: ["Be careful, Mom warned.", "\"Be careful,\" Mom warned.", "\"Be careful\" Mom warned.", "\"Be careful, Mom warned.\""], type: "multiple_choice" },
    { q: "Where does the end punctuation usually go in a quotation?", a: "Inside the quotation marks", opts: ["Inside the quotation marks", "Outside the quotation marks", "It is not needed", "Before the quotation marks"], type: "multiple_choice" },
    { q: "Which is correct?", a: "\"Can we play now?\" asked Tom.", opts: ["Can we play now? asked Tom.", "\"Can we play now?\" asked Tom.", "\"Can we play now\"? asked Tom.", "\"Can we play now? asked Tom.\""], type: "multiple_choice" },
    { q: "Which sentence correctly shows what Ana said?", a: "Ana said, \"I'm hungry.\"", opts: ["Ana said I'm hungry.", "Ana said, \"I'm hungry.\"", "Ana said \"I'm hungry\".", "\"Ana said I'm hungry.\""], type: "multiple_choice" },
    { q: "Which is punctuated correctly?", a: "\"Look out!\" he yelled.", opts: ["Look out! he yelled.", "\"Look out!\" he yelled.", "\"Look out\"! he yelled.", "\"Look out! he yelled.\""], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "\"We're almost there,\" said the driver.", opts: ["We're almost there, said the driver.", "\"We're almost there,\" said the driver.", "\"We're almost there\" said the driver.", "\"We're almost there, said the driver.\""], type: "multiple_choice" },
    { q: "What do quotation marks tell the reader?", a: "These are the exact words a person spoke", opts: ["These are the exact words a person spoke", "This is a question", "This is important", "This is the title only"], type: "multiple_choice" },
  ], count);
}

function generateSemicolonProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which sentence uses a semicolon correctly?", a: "I was tired; I went to bed early.", opts: ["I was tired, I went to bed early.", "I was tired; I went to bed early.", "I was tired; and I went to bed early.", "I was; tired I went to bed early."], type: "multiple_choice" },
    { q: "A semicolon is used to:", a: "Join two closely related complete sentences", opts: ["Join two closely related complete sentences", "End a question", "Show possession", "Start a list of one item"], type: "multiple_choice" },
    { q: "Which is correct?", a: "She loves to read; he prefers to write.", opts: ["She loves to read, he prefers to write.", "She loves to read; he prefers to write.", "She loves to read; and he prefers to write.", "She loves; to read he prefers to write."], type: "multiple_choice" },
    { q: "Which sentence correctly uses a semicolon before a transition?", a: "It was late; however, we kept working.", opts: ["It was late, however, we kept working.", "It was late; however, we kept working.", "It was late however; we kept working.", "It was; late however we kept working."], type: "multiple_choice" },
    { q: "A semicolon can separate items in a list when the items:", a: "Already contain commas", opts: ["Already contain commas", "Are very short", "Are numbers", "Are names only"], type: "multiple_choice" },
    { q: "Which uses a semicolon correctly?", a: "We visited Rome, Italy; Paris, France; and Bern, Switzerland.", opts: ["We visited Rome, Italy, Paris, France, and Bern, Switzerland.", "We visited Rome, Italy; Paris, France; and Bern, Switzerland.", "We visited Rome; Italy, Paris; France.", "We visited Rome, Italy; Paris France and Bern."], type: "multiple_choice" },
    { q: "Which is correct?", a: "The test was hard; everyone passed anyway.", opts: ["The test was hard everyone passed anyway.", "The test was hard; everyone passed anyway.", "The test was hard, everyone; passed anyway.", "The test; was hard everyone passed anyway."], type: "multiple_choice" },
    { q: "What kind of clauses does a semicolon connect?", a: "Two independent clauses (complete thoughts)", opts: ["Two independent clauses (complete thoughts)", "A phrase and a word", "Two fragments", "A list of adjectives"], type: "multiple_choice" },
    { q: "Which sentence is correct?", a: "I have a big test tomorrow; I can't go out tonight.", opts: ["I have a big test tomorrow, I can't go out tonight.", "I have a big test tomorrow; I can't go out tonight.", "I have a big test tomorrow; because I can't go out.", "I have; a big test tomorrow I can't go out."], type: "multiple_choice" },
    { q: "Which is the correct use of a semicolon?", a: "The sky darkened; a storm was coming.", opts: ["The sky darkened a storm was coming.", "The sky darkened; a storm was coming.", "The sky darkened; and a storm was coming.", "The sky; darkened a storm was coming."], type: "multiple_choice" },
    { q: "True or False: A semicolon joins two complete sentences without a connecting word like 'and'.", a: "True", opts: ["True", "False"], type: "multiple_choice" },
    { q: "Which sentence is punctuated correctly?", a: "He didn't study; therefore, he failed.", opts: ["He didn't study, therefore, he failed.", "He didn't study; therefore, he failed.", "He didn't study therefore; he failed.", "He didn't; study therefore he failed."], type: "multiple_choice" },
    { q: "Which could correctly replace the period? 'I like tea. She likes coffee.'", a: "I like tea; she likes coffee.", opts: ["I like tea, she likes coffee.", "I like tea; she likes coffee.", "I like tea; and she likes coffee.", "I like; tea she likes coffee."], type: "multiple_choice" },
    { q: "A semicolon is stronger than a comma but weaker than a:", a: "period", opts: ["period", "letter", "space", "question mark"], type: "multiple_choice" },
    { q: "Which is correct?", a: "My brother is a doctor; my sister is a nurse.", opts: ["My brother is a doctor, my sister is a nurse.", "My brother is a doctor; my sister is a nurse.", "My brother is a doctor; and my sister is a nurse.", "My brother; is a doctor my sister is a nurse."], type: "multiple_choice" },
    { q: "When should you NOT use a semicolon?", a: "Between a complete sentence and a single phrase", opts: ["Between a complete sentence and a single phrase", "Between two complete sentences", "Between list items with commas", "Before 'however' joining two sentences"], type: "multiple_choice" },
  ], count);
}

function generateLetterProblems(count: number): Problem[] {
  const items = [
    { q: "Which is a capital letter?", a: "A", opts: ["a","b","A","c"] },
    { q: "Write the capital letter for 'm'.", a: "M" },
    { q: "Which sentence is capitalized correctly?", a: "My name is Sam.", opts: ["my name is sam.", "My name is Sam.", "MY name is Sam.", "my Name is Sam."] },
    { q: "Every sentence must begin with a:", a: "Capital letter", opts: ["lowercase letter","Capital letter","number","comma"] },
    { q: "Proper nouns must be:", a: "Capitalized", opts: ["lowercase","Capitalized","plural","italicized"] },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: item.opts ? "multiple_choice" : "short_answer" as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

function generateNounProblems(count: number): Problem[] {
  const items = [
    { q: "Circle the noun: run / dog / quickly / blue", a: "dog" },
    { q: "Which word is a noun? (car / eat / fast / loudly)", a: "car" },
    { q: "Which is a proper noun? (city / London / table / river)", a: "London" },
    { q: "Is 'happiness' a concrete or abstract noun?", a: "abstract" },
    { q: "Is 'apple' a concrete or abstract noun?", a: "concrete" },
    { q: "Give a noun that names a place.", a: "(any place noun, e.g., school, park, Canada)" },
    { q: "Give a noun that names a person.", a: "(any person noun, e.g., teacher, doctor, Maria)" },
    { q: "Identify all nouns: 'The dog chased the cat around the garden.'", a: "dog, cat, garden" },
    { q: "What is a collective noun? Give an example.", a: "A noun that refers to a group (e.g., team, flock, crowd)" },
    { q: "Change to plural: 'child'", a: "children" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateVerbProblems(count: number): Problem[] {
  const items = [
    { q: "Circle the verb: happy / table / jump / city", a: "jump" },
    { q: "Is 'quickly' a verb or adverb?", a: "adverb" },
    { q: "Identify the verb: 'She ran to school.'", a: "ran" },
    { q: "Change to past tense: 'I run every day.'", a: "I ran every day." },
    { q: "Change to future tense: 'He eats breakfast.'", a: "He will eat breakfast." },
    { q: "Identify the verb tense: 'They have finished the race.'", a: "present perfect" },
    { q: "What is an irregular verb? Give an example.", a: "A verb that doesn't form past tense with -ed (e.g., go → went)" },
    { q: "Fill in the blank: Yesterday, she ___ (eat) her lunch.", a: "ate" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateAdjectiveProblems(count: number): Problem[] {
  const items = [
    { q: "Circle the adjective: school / eat / tall / swim", a: "tall" },
    { q: "Add an adjective: The ___ cat sat on the mat.", a: "(any adjective, e.g., fluffy, black, sleepy)" },
    { q: "Identify the adjective: 'She wore a beautiful dress.'", a: "beautiful" },
    { q: "Compare: 'big' → bigger → ___", a: "biggest" },
    { q: "Compare: 'happy' → happier → ___", a: "happiest" },
    { q: "What is the difference between a comparative and superlative adjective?", a: "Comparative compares two things (bigger); superlative compares three or more (biggest)" },
    { q: "Is 'quickly' an adjective or adverb?", a: "adverb" },
    { q: "Identify the adjectives: 'The tall, dark stranger wore an old coat.'", a: "tall, dark, old" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generatePronounProblems(count: number): Problem[] {
  const items = [
    { q: "Replace the noun with a pronoun: 'Maria went to school.' → ___ went to school.", a: "She" },
    { q: "Which is a subject pronoun? (him / her / she / them)", a: "she", opts: ["him","her","she","them"] },
    { q: "Which is an object pronoun? (I / he / she / him)", a: "him", opts: ["I","he","she","him"] },
    { q: "Fill in: Give the book to ___. (he / him)", a: "him", opts: ["he","him"] },
    { q: "Fill in: ___ and I went to the park. (Me / Him / She / He)", a: "He", opts: ["Me","Him","She","He"] },
    { q: "What is a reflexive pronoun? Give an example.", a: "A pronoun that refers back to the subject (e.g., himself, herself, themselves)" },
    { q: "Choose the correct pronoun: Each student must bring ___ own pencil. (their / they / them)", a: "their", opts: ["their","they","them"] },
    { q: "What type of pronoun is 'who'?", a: "Relative pronoun", opts: ["Personal","Reflexive","Relative","Indefinite"] },
    { q: "Replace: 'The dog wagged the dog's tail.'", a: "The dog wagged its tail." },
    { q: "What is an indefinite pronoun? Give an example.", a: "A pronoun that does not refer to a specific person or thing (e.g., everyone, nobody, someone)" },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: (item.opts ? "multiple_choice" : "short_answer") as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

function generatePrepositionProblems(count: number): Problem[] {
  const items = [
    { q: "Which word is a preposition? (run / under / happy / eat)", a: "under", opts: ["run","under","happy","eat"] },
    { q: "Fill in: The cat sat ___ the mat. (on / run / blue / sing)", a: "on", opts: ["on","run","blue","sing"] },
    { q: "Identify the preposition: 'She walked through the park.'", a: "through" },
    { q: "What is a prepositional phrase? Give an example.", a: "A phrase beginning with a preposition (e.g., 'in the morning', 'under the table')" },
    { q: "Choose the correct preposition: She arrived ___ Monday. (on / in / at / by)", a: "on", opts: ["on","in","at","by"] },
    { q: "Choose the correct preposition: He lives ___ Canada. (on / in / at / by)", a: "in", opts: ["on","in","at","by"] },
    { q: "Choose the correct preposition: The meeting is ___ noon. (on / in / at / by)", a: "at", opts: ["on","in","at","by"] },
    { q: "Identify all prepositions: 'The dog ran under the fence and through the garden.'", a: "under, through" },
    { q: "True or False: A preposition always comes before a noun or pronoun.", a: "True" },
    { q: "What does a preposition show?", a: "The relationship between a noun/pronoun and another word (position, direction, time, etc.)" },
    { q: "Give three examples of prepositions of place.", a: "(e.g., on, under, above, beside, between, near, behind, in front of)" },
    { q: "Give three examples of prepositions of time.", a: "(e.g., at, on, in, before, after, during, since, until)" },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: (item.opts ? "multiple_choice" : "short_answer") as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}


function generatePartsOfSpeech(count: number): Problem[] {
  const items = [
    { q: "What part of speech is 'beautiful'?", a: "adjective", opts: ["noun","verb","adjective","adverb"] },
    { q: "What part of speech is 'run'?", a: "verb", opts: ["noun","verb","adjective","adverb"] },
    { q: "What part of speech is 'quickly'?", a: "adverb", opts: ["noun","verb","adjective","adverb"] },
    { q: "What part of speech is 'school'?", a: "noun", opts: ["noun","verb","adjective","adverb"] },
    { q: "Label each word: fast ___ / teacher ___ / laugh ___ (Adj/N/V)", a: "Adj / N / V" },
    { q: "What word class connects two clauses? (e.g., 'and', 'but', 'because')", a: "conjunction", opts: ["noun","conjunction","adjective","pronoun"] },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: item.opts ? "multiple_choice" as const : "short_answer" as const,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

function generatePunctuationProblems(count: number): Problem[] {
  const items = [
    { q: "Which sentence is correct? (a) i like dogs. (b) I like dogs.", a: "I like dogs." },
    { q: "Add the correct punctuation: Where are you going___", a: "Where are you going?" },
    { q: "Add the correct punctuation: Stop right there___", a: "Stop right there!" },
    { q: "Which uses a comma correctly? (a) I like cats and, dogs. (b) I like cats, and I like dogs.", a: "I like cats, and I like dogs." },
    { q: "Does this sentence need a capital letter? (my name is kai.)", a: "My name is Kai." },
    { q: "Add apostrophes where needed: Its the dogs bone.", a: "It's the dog's bone." },
    { q: "True or False: Every sentence must end with a period.", a: "False (can also end with ? or !)" },
    { q: "Where does a comma go in this sentence: 'After we ate dinner we watched a movie.'", a: "After we ate dinner, we watched a movie." },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: "short_answer" as const, question: item.q, answer: item.a, points: 1 }));
}

function generateSentenceProblems(count: number): Problem[] {
  const items = [
    { q: "Which is a complete sentence? (a) Running fast. (b) She ran to school.", a: "She ran to school.", opts: ["Running fast.", "Because it rained.", "She ran to school.", "The big red."], type: "multiple_choice" as const },
    { q: "Fix this run-on: I like apples I eat them every day.", a: "I like apples. I eat them every day.", type: "short_answer" as const },
    { q: "Combine: The dog ran. The dog barked.", a: "The dog ran and barked.", type: "short_answer" as const },
    { q: "What is a compound sentence? Give an example.", a: "Two simple sentences joined by a conjunction (e.g., She sang and I danced.)", type: "short_answer" as const },
    { q: "Add a conjunction: I wanted to play, ___ it was raining.", a: "but", type: "short_answer" as const },
    { q: "Is this simple or compound? 'She sang and danced.'", a: "simple (one subject, compound predicate)", type: "short_answer" as const },
    { q: "What is a complex sentence?", a: "A sentence with an independent clause and at least one dependent clause", type: "short_answer" as const },
    { q: "Identify the clause type: 'Although it was raining, she went outside.'", a: "'Although it was raining' is a dependent clause", type: "short_answer" as const },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: item.type, question: item.q, options: (item as any).opts, answer: item.a, points: 1 }));
}

function generateParagraphProblems(count: number): Problem[] {
  const items = [
    { q: "Which is the best topic sentence? (a) Dogs are good. (b) Dogs make excellent pets for many reasons. (c) I have a dog.", a: "Dogs make excellent pets for many reasons.", opts: ["Dogs are good.", "Dogs make excellent pets for many reasons.", "I have a dog.", "Dogs bark."], type: "multiple_choice" as const },
    { q: "What does a topic sentence do?", a: "States the main idea of the paragraph", type: "short_answer" as const },
    { q: "What does a concluding sentence do?", a: "Wraps up or restates the main idea", type: "short_answer" as const },
    { q: "Write a topic sentence about your favourite season.", a: "(any complete topic sentence)", type: "written_response" as const },
    { q: "True or False: A paragraph should focus on one main idea.", a: "True", type: "short_answer" as const },
    { q: "What are supporting details in a paragraph?", a: "Evidence, examples, or facts that support the topic sentence", type: "short_answer" as const },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: item.type, question: item.q, options: (item as any).opts, answer: item.a, points: 1 }));
}

function generateEssayProblems(count: number): Problem[] {
  const items = [
    { q: "What are the three main parts of an essay?", a: "Introduction, body, conclusion" },
    { q: "What is a thesis statement?", a: "The main argument or claim of the essay, usually in the introduction" },
    { q: "How many body paragraphs does a basic 5-paragraph essay have?", a: "3" },
    { q: "What is the purpose of a conclusion?", a: "To summarize the main points and restate the thesis" },
    { q: "What should a good introduction do?", a: "Hook the reader, provide background, and state the thesis" },
    { q: "What is a 'hook' in essay writing?", a: "An opening sentence that grabs the reader's attention" },
    { q: "What is the difference between a topic sentence and a thesis statement?", a: "Topic sentence is for a paragraph; thesis statement is for the whole essay" },
    { q: "True or False: Every body paragraph needs a topic sentence.", a: "True" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateTransitionProblems(count: number): Problem[] {
  const items = [
    { q: "Choose the correct transition: I was tired. ___, I went to bed. (However / Therefore)", a: "Therefore" },
    { q: "Choose the correct transition: She studied hard. ___, she failed the test. (Nevertheless / In addition)", a: "Nevertheless" },
    { q: "What type of transition is 'furthermore'?", a: "Addition (adds more information)" },
    { q: "What type of transition is 'however'?", a: "Contrast/concession" },
    { q: "What type of transition is 'therefore'?", a: "Cause and effect" },
    { q: "Give an example of a time-order transition word.", a: "(e.g., first, then, next, finally, meanwhile)" },
    { q: "Fill in the blank: ___ finishing dinner, we went for a walk. (After / However / Therefore)", a: "After" },
    { q: "Which transition best shows comparison? (In contrast / First / Therefore / Similarly)", a: "Similarly" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateNarrativeProblems(count: number): Problem[] {
  const items = [
    { q: "What does 'show, don't tell' mean in narrative writing?", a: "Use descriptive details and actions instead of stating emotions directly" },
    { q: "What is a narrative hook?", a: "An opening that grabs the reader's attention" },
    { q: "What is 'first-person point of view'?", a: "The narrator uses 'I' and tells the story from their own perspective" },
    { q: "What is 'third-person limited' point of view?", a: "The narrator knows the thoughts of one character and uses 'he/she/they'" },
    { q: "What is the 'climax' of a story?", a: "The turning point or most intense moment" },
    { q: "What is 'rising action'?", a: "Events that build tension leading to the climax" },
    { q: "What is 'falling action'?", a: "Events after the climax that lead to the resolution" },
    { q: "What is 'setting' in a story?", a: "The time and place where the story occurs" },
    { q: "What is 'characterization'?", a: "The methods an author uses to develop a character's personality" },
    { q: "Rewrite in 'show, don't tell': 'She was nervous.'", a: "Her hands trembled and her heart pounded as she stepped onto the stage." },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generatePersuasiveProblems(count: number): Problem[] {
  const items = [
    { q: "What is a 'claim' in persuasive writing?", a: "The main argument or position the writer is trying to prove" },
    { q: "What is a 'counterargument'?", a: "The opposing view that you address and refute in your essay" },
    { q: "What does 'ethos' mean as a persuasive appeal?", a: "An appeal to the writer's credibility or character" },
    { q: "What does 'pathos' mean as a persuasive appeal?", a: "An appeal to the reader's emotions" },
    { q: "What does 'logos' mean as a persuasive appeal?", a: "An appeal to logic and reason (facts, statistics)" },
    { q: "Why is it important to address counterarguments?", a: "It shows you understand both sides and strengthens your argument" },
    { q: "What makes evidence 'credible'?", a: "It comes from reliable, authoritative sources" },
    { q: "What is the difference between a fact and an opinion?", a: "Facts can be proven; opinions are personal views" },
    { q: "What is 'bias' in writing?", a: "An unfair preference for one side that may distort the truth" },
    { q: "Identify the appeal: 'Nine out of ten doctors recommend this product.'", a: "Ethos (credibility) and logos (statistics)" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateAdvancedWritingProblems(count: number): Problem[] {
  const items = [
    { q: "What is a 'rhetorical question'?", a: "A question asked for effect, not expecting an answer" },
    { q: "What is 'syntax' in writing?", a: "The arrangement of words and sentences" },
    { q: "What is 'diction' in writing?", a: "The writer's choice of words" },
    { q: "What is 'tone' in writing?", a: "The writer's attitude toward the subject or audience" },
    { q: "What is 'voice' in writing?", a: "The writer's unique style, personality, and perspective" },
    { q: "What is an 'anaphora'?", a: "Repetition of a word or phrase at the beginning of successive clauses" },
    { q: "What is 'parallelism' in writing?", a: "Using the same grammatical structure in a series of phrases or clauses" },
    { q: "What is 'juxtaposition'?", a: "Placing two contrasting ideas or images side by side for effect" },
    { q: "Identify the device: 'It was the best of times, it was the worst of times.'", a: "Antithesis (juxtaposition of opposites)" },
    { q: "What is an 'allusion' in writing?", a: "A brief reference to a well-known person, place, event, or text" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SCIENCE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

function generateScienceProblems(skillName: string, count: number): Problem[] {
  const skill = skillName.toLowerCase();
  // S1 — Life Science Basics (each skill its own bank, not the generic fallback)
  if (skill.includes("living") || skill.includes("nonliving") || skill.includes("non-living")) return generateLivingNonlivingProblems(count);
  if (skill.includes("plant life")) return generatePlantLifeCycleProblems(count);
  if (skill.includes("animal life")) return generateAnimalLifeCycleProblems(count);
  if (skill.includes("animal group") || skill.includes("vertebrate")) return generateAnimalGroupsProblems(count);
  if (skill.includes("habitat")) return generateHabitatProblems(count);
  // S3 — Earth Science
  if (skill.includes("water cycle")) return generateWaterCycleProblems(count);
  // S4 — States of Matter (each skill its own bank; these used to fall through
  // to life-science because none of the names contain the word "matter")
  if (skill.includes("solid") || skill.includes("liquid") || skill.includes("gas")) return generateSolidsLiquidsGasesProblems(count);
  if (skill.includes("state change")) return generateStateChangesProblems(count);
  if (skill.includes("melting") || skill.includes("freezing")) return generateMeltingFreezingProblems(count);
  if (skill.includes("evaporation")) return generateEvaporationProblems(count);
  if (skill.includes("states of matter") || skill.includes("matter")) return generateStatesOfMatterProblems(count);
  // S2 — Ecosystems
  if (skill.includes("food web")) return generateFoodWebProblems(count);
  if (skill.includes("producer") || skill.includes("consumer")) return generateProducerConsumerProblems(count);
  if (skill.includes("adaptation")) return generateAdaptationProblems(count);
  if (skill.includes("food chain") || skill.includes("ecosystem")) return generateFoodChainProblems(count);
  // S3 — Earth Science (dedicated banks; were generic before)
  if (skill.includes("weather")) return generateWeatherProblems(count);
  if (skill.includes("rock") || skill.includes("mineral")) return generateRocksMineralsProblems(count);
  // S3 — Astronomy (Space / Solar System)
  if (skill.includes("solar system") || skill.includes("planet")) return generateSolarSystemProblems(count);
  if (skill.includes("sun and moon") || skill.includes("earth, sun") || skill.includes("moon")) return generateEarthSunMoonProblems(count);
  // S5 — Biology
  if (skill.includes("photosynthesis")) return generatePhotosynthesisProblems(count);
  if (skill.includes("respiration")) return generateRespirationProblems(count);
  if (skill.includes("digestive")) return generateDigestiveProblems(count);
  if (skill.includes("human body") || skill.includes("body system")) return generateHumanBodyProblems(count);
  if (skill.includes("cell") || skill.includes("biology") || skill.includes("mitosis") || skill.includes("dna")) return generateBiologyProblems(count);
  // S6 — Chemistry (acids/bases and periodic table fell through to life-science)
  if (skill.includes("acid") || skill.includes("base")) return generateAcidsBasesProblems(count);
  if (skill.includes("periodic")) return generatePeriodicTableProblems(count);
  if (skill.includes("chemistry") || skill.includes("atom") || skill.includes("element") || skill.includes("compound") || skill.includes("bond") || skill.includes("reaction")) return generateChemistryProblems(count);
  // S7 — Physics (waves/sound fell through to life-science)
  if (skill.includes("simple machine") || skill.includes("machine")) return generateSimpleMachinesProblems(count);
  if (skill.includes("electricity") || skill.includes("circuit")) return generateElectricityProblems(count);
  if (skill.includes("wave") || skill.includes("sound")) return generateWavesSoundProblems(count);
  if (skill.includes("energy")) return generateEnergyProblems(count);
  if (skill.includes("force") || skill.includes("motion") || skill.includes("newton") || skill.includes("physics")) return generatePhysicsProblems(count);
  if (skill.includes("earth science") || skill.includes("plate")) return generateEarthScienceProblems(count);
  if (skill.includes("life science")) return generateLifeScienceProblems(count);
  return generateLifeScienceProblems(count);
}

function generateWaterCycleProblems(count: number): Problem[] {
  const items = [
    { q: "What process turns liquid water into water vapor?", a: "Evaporation" },
    { q: "What is it called when water vapor turns into liquid droplets?", a: "Condensation" },
    { q: "What do we call rain, snow, or hail falling from clouds?", a: "Precipitation" },
    { q: "What energy source drives the water cycle?", a: "The Sun" },
    { q: "Where does most evaporation on Earth come from?", a: "Oceans and large bodies of water" },
    { q: "True or False: Water vapour is invisible.", a: "True" },
    { q: "What is runoff?", a: "Water that flows over land into rivers and streams" },
    { q: "What is transpiration?", a: "Water released from plants into the atmosphere" },
    { q: "What is groundwater?", a: "Water that seeps into the ground and is stored underground" },
    { q: "How do clouds form?", a: "Water vapor cools and condenses around tiny particles in the atmosphere" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateStatesOfMatterProblems(count: number): Problem[] {
  const items = [
    { q: "Which state has a definite shape and volume?", a: "Solid", opts: ["Gas","Liquid","Plasma","Solid"], type: "multiple_choice" as const },
    { q: "What is evaporation?", a: "A liquid changing to a gas", type: "short_answer" as const },
    { q: "What is condensation?", a: "A gas changing to a liquid", type: "short_answer" as const },
    { q: "What is sublimation?", a: "A solid changing directly to a gas (e.g., dry ice)", type: "short_answer" as const },
    { q: "In which state are particles farthest apart?", a: "Gas", type: "short_answer" as const },
    { q: "Water freezes at ___ °C.", a: "0", type: "fill_blank" as const },
    { q: "Water boils at ___ °C.", a: "100", type: "fill_blank" as const },
    { q: "True or False: A gas has a definite volume.", a: "False", type: "short_answer" as const },
    { q: "What state change occurs when water vapour hits a cold window?", a: "Condensation", type: "short_answer" as const },
    { q: "What is deposition?", a: "A gas changing directly to a solid (e.g., frost forming)", type: "short_answer" as const },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: item.type, question: item.q, options: (item as any).opts, answer: item.a, points: 1 }));
}

// ─── S3: Earth Science (Weather, Rocks) ────────────────────────────────────────

function generateWeatherProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which tool measures temperature?", a: "Thermometer", opts: ["Anemometer", "Thermometer", "Barometer", "Rain gauge"], type: "multiple_choice" },
    { q: "Which tool measures wind speed?", a: "Anemometer", opts: ["Thermometer", "Anemometer", "Rain gauge", "Compass"], type: "multiple_choice" },
    { q: "Fluffy, white fair-weather clouds are called:", a: "Cumulus", opts: ["Cumulus", "Cirrus", "Stratus", "Nimbus"], type: "multiple_choice" },
    { q: "Thin, wispy clouds high in the sky are called:", a: "Cirrus", opts: ["Cirrus", "Cumulus", "Stratus", "Fog"], type: "multiple_choice" },
    { q: "Rain, snow, sleet, and hail are all forms of:", a: "Precipitation", opts: ["Precipitation", "Evaporation", "Condensation", "Erosion"], type: "multiple_choice" },
    { q: "What instrument measures air pressure?", a: "Barometer", opts: ["Barometer", "Thermometer", "Anemometer", "Hygrometer"], type: "multiple_choice" },
    { q: "What is the difference between weather and climate?", a: "Weather is day-to-day; climate is the long-term pattern", opts: ["Weather is day-to-day; climate is the long-term pattern", "They are the same", "Climate is today's rain", "Weather lasts for years"], type: "multiple_choice" },
    { q: "Which type of cloud usually brings rain?", a: "Nimbus (nimbostratus)", opts: ["Nimbus (nimbostratus)", "Cirrus", "High thin clouds", "No clouds"], type: "multiple_choice" },
    { q: "A long period with little or no rain is called a:", a: "Drought", opts: ["Drought", "Flood", "Blizzard", "Hurricane"], type: "multiple_choice" },
    { q: "What causes wind?", a: "Differences in air pressure (air moving from high to low)", opts: ["Differences in air pressure (air moving from high to low)", "The Moon", "Trees moving", "Ocean tides"], type: "multiple_choice" },
    { q: "A spinning storm with very high winds over the ocean is a:", a: "Hurricane", opts: ["Hurricane", "Drought", "Heat wave", "Fog bank"], type: "multiple_choice" },
    { q: "What does a rain gauge measure?", a: "How much rain has fallen", opts: ["How much rain has fallen", "Wind speed", "Temperature", "Air pressure"], type: "multiple_choice" },
    { q: "Humidity is the amount of ___ in the air.", a: "Water vapour", opts: ["Water vapour", "Dust", "Oxygen", "Heat"], type: "multiple_choice" },
    { q: "A weather front is:", a: "A boundary where two air masses meet", opts: ["A boundary where two air masses meet", "The front of a cloud", "A type of rain", "A wind tool"], type: "multiple_choice" },
    { q: "Snow forms when water vapour freezes into:", a: "Ice crystals", opts: ["Ice crystals", "Rain drops", "Hail stones only", "Steam"], type: "multiple_choice" },
    { q: "Meteorologists are scientists who study:", a: "The weather", opts: ["The weather", "Rocks", "Animals", "Stars only"], type: "multiple_choice" },
  ], count);
}

function generateRocksMineralsProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Rock that forms from cooled lava or magma is:", a: "Igneous", opts: ["Igneous", "Sedimentary", "Metamorphic", "Mineral"], type: "multiple_choice" },
    { q: "Rock that forms from pressed and cemented layers is:", a: "Sedimentary", opts: ["Sedimentary", "Igneous", "Metamorphic", "Lava"], type: "multiple_choice" },
    { q: "Rock changed by heat and pressure is:", a: "Metamorphic", opts: ["Metamorphic", "Igneous", "Sedimentary", "Fossil"], type: "multiple_choice" },
    { q: "The three main types of rock are:", a: "Igneous, sedimentary, metamorphic", opts: ["Igneous, sedimentary, metamorphic", "Hard, soft, medium", "Big, small, round", "Hot, cold, warm"], type: "multiple_choice" },
    { q: "What is a mineral?", a: "A naturally formed solid with a specific composition", opts: ["A naturally formed solid with a specific composition", "Any wet rock", "A type of plant", "A man-made stone"], type: "multiple_choice" },
    { q: "Sandstone is an example of which rock type?", a: "Sedimentary", opts: ["Sedimentary", "Igneous", "Metamorphic", "Liquid"], type: "multiple_choice" },
    { q: "Which property describes how a mineral resists scratching?", a: "Hardness", opts: ["Hardness", "Color", "Smell", "Weight"], type: "multiple_choice" },
    { q: "The rock cycle shows that rocks can:", a: "Change from one type to another over time", opts: ["Change from one type to another over time", "Never change", "Only get bigger", "Turn into water"], type: "multiple_choice" },
    { q: "Granite, formed from cooled magma, is an example of:", a: "Igneous rock", opts: ["Igneous rock", "Sedimentary rock", "Metamorphic rock", "A mineral only"], type: "multiple_choice" },
    { q: "Fossils are most often found in which rock type?", a: "Sedimentary", opts: ["Sedimentary", "Igneous", "Metamorphic", "None"], type: "multiple_choice" },
    { q: "Marble forms when limestone is changed by heat and pressure, making it:", a: "Metamorphic", opts: ["Metamorphic", "Igneous", "Sedimentary", "A liquid"], type: "multiple_choice" },
    { q: "The shine of a mineral's surface is called its:", a: "Luster", opts: ["Luster", "Streak", "Cleavage", "Mass"], type: "multiple_choice" },
    { q: "What is weathering?", a: "The breaking down of rock into smaller pieces", opts: ["The breaking down of rock into smaller pieces", "Rocks melting", "Rocks growing", "Rain only"], type: "multiple_choice" },
    { q: "Lava that cools quickly forms rock with:", a: "Small crystals", opts: ["Small crystals", "No minerals", "Large fossils", "Layers"], type: "multiple_choice" },
    { q: "Which is NOT one of the three rock types?", a: "Plastic", opts: ["Plastic", "Igneous", "Sedimentary", "Metamorphic"], type: "multiple_choice" },
    { q: "The color of the powder a mineral leaves when scraped is its:", a: "Streak", opts: ["Streak", "Luster", "Hardness", "Shape"], type: "multiple_choice" },
  ], count);
}

// ─── S5: Biology (Photosynthesis, Respiration) ─────────────────────────────────

function generatePhotosynthesisProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Plants make their food using:", a: "Sunlight, carbon dioxide, and water", opts: ["Sunlight, carbon dioxide, and water", "Soil only", "Oxygen and sugar", "Just water"], type: "multiple_choice" },
    { q: "Photosynthesis releases which gas?", a: "Oxygen", opts: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], type: "multiple_choice" },
    { q: "Which gas do plants take IN for photosynthesis?", a: "Carbon dioxide", opts: ["Carbon dioxide", "Oxygen", "Helium", "Nitrogen"], type: "multiple_choice" },
    { q: "What green pigment captures light for photosynthesis?", a: "Chlorophyll", opts: ["Chlorophyll", "Hemoglobin", "Melanin", "Keratin"], type: "multiple_choice" },
    { q: "In which part of the plant cell does photosynthesis happen?", a: "Chloroplast", opts: ["Chloroplast", "Nucleus", "Mitochondria", "Cell wall"], type: "multiple_choice" },
    { q: "What food (sugar) does photosynthesis produce?", a: "Glucose", opts: ["Glucose", "Salt", "Protein", "Starch only"], type: "multiple_choice" },
    { q: "Photosynthesis mainly happens in the plant's:", a: "Leaves", opts: ["Leaves", "Roots", "Stem only", "Flowers only"], type: "multiple_choice" },
    { q: "What is the main energy source for photosynthesis?", a: "The Sun", opts: ["The Sun", "Soil", "Wind", "Water alone"], type: "multiple_choice" },
    { q: "The word equation for photosynthesis is:", a: "Carbon dioxide + water → glucose + oxygen", opts: ["Carbon dioxide + water → glucose + oxygen", "Glucose + oxygen → CO₂ + water", "Oxygen → carbon dioxide", "Water → oxygen only"], type: "multiple_choice" },
    { q: "Why is photosynthesis important for animals?", a: "It produces the oxygen they breathe and food they eat", opts: ["It produces the oxygen they breathe and food they eat", "It makes soil", "It causes rain", "It has no effect"], type: "multiple_choice" },
    { q: "Tiny pores on leaves that let gases in and out are called:", a: "Stomata", opts: ["Stomata", "Veins", "Roots", "Petals"], type: "multiple_choice" },
    { q: "Plants get the water for photosynthesis through their:", a: "Roots", opts: ["Roots", "Flowers", "Leaves only", "Bark"], type: "multiple_choice" },
    { q: "Without sunlight, a plant cannot:", a: "Make its own food", opts: ["Make its own food", "Have roots", "Have a color", "Take up space"], type: "multiple_choice" },
    { q: "Photosynthesis converts light energy into:", a: "Chemical energy (stored in glucose)", opts: ["Chemical energy (stored in glucose)", "Sound energy", "Heat only", "Electricity"], type: "multiple_choice" },
    { q: "Organisms that make their own food, like plants, are called:", a: "Producers", opts: ["Producers", "Consumers", "Decomposers", "Predators"], type: "multiple_choice" },
    { q: "What color light do plants reflect (which is why they look green)?", a: "Green light", opts: ["Green light", "Red light", "Blue light", "All light"], type: "multiple_choice" },
  ], count);
}

function generateRespirationProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Cellular respiration uses oxygen to release:", a: "Energy (ATP)", opts: ["Energy (ATP)", "Light", "Water only", "Sugar"], type: "multiple_choice" },
    { q: "Respiration produces which waste gas?", a: "Carbon dioxide", opts: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], type: "multiple_choice" },
    { q: "Which gas does respiration use up?", a: "Oxygen", opts: ["Oxygen", "Carbon dioxide", "Helium", "Nitrogen"], type: "multiple_choice" },
    { q: "The word equation for respiration is:", a: "Glucose + oxygen → carbon dioxide + water + energy", opts: ["Glucose + oxygen → carbon dioxide + water + energy", "CO₂ + water → glucose + oxygen", "Oxygen → glucose", "Water → energy"], type: "multiple_choice" },
    { q: "In which cell part does most respiration occur?", a: "Mitochondria", opts: ["Mitochondria", "Chloroplast", "Nucleus", "Cell wall"], type: "multiple_choice" },
    { q: "Respiration happens in:", a: "All living cells (plants and animals)", opts: ["All living cells (plants and animals)", "Only animal cells", "Only plant cells", "Only the lungs"], type: "multiple_choice" },
    { q: "How is respiration different from breathing?", a: "Respiration releases energy in cells; breathing moves air in and out", opts: ["Respiration releases energy in cells; breathing moves air in and out", "They are exactly the same", "Breathing makes food", "Respiration is only in plants"], type: "multiple_choice" },
    { q: "What is the main fuel (sugar) used in respiration?", a: "Glucose", opts: ["Glucose", "Salt", "Water", "Protein"], type: "multiple_choice" },
    { q: "Respiration and photosynthesis are roughly:", a: "Opposite processes", opts: ["Opposite processes", "Exactly the same", "Unrelated", "Both make oxygen"], type: "multiple_choice" },
    { q: "Anaerobic respiration is respiration:", a: "Without oxygen", opts: ["Without oxygen", "With extra oxygen", "Only in sunlight", "Only in plants"], type: "multiple_choice" },
    { q: "Why do your muscles need respiration during exercise?", a: "To release energy to move", opts: ["To release energy to move", "To make oxygen", "To cool down only", "To make food"], type: "multiple_choice" },
    { q: "Energy released by respiration is stored in a molecule called:", a: "ATP", opts: ["ATP", "DNA", "CO₂", "H₂O"], type: "multiple_choice" },
    { q: "When you exercise hard and run out of oxygen, muscles may produce:", a: "Lactic acid", opts: ["Lactic acid", "Oxygen", "Glucose", "Chlorophyll"], type: "multiple_choice" },
    { q: "Do plants respire?", a: "Yes — all the time, day and night", opts: ["Yes — all the time, day and night", "No, never", "Only at night they photosynthesize", "Only when cut"], type: "multiple_choice" },
    { q: "Which two products does aerobic respiration release besides energy?", a: "Carbon dioxide and water", opts: ["Carbon dioxide and water", "Oxygen and glucose", "Light and heat only", "Nitrogen and water"], type: "multiple_choice" },
    { q: "Respiration is important because it provides cells with:", a: "Usable energy", opts: ["Usable energy", "Sunlight", "Water only", "Color"], type: "multiple_choice" },
  ], count);
}

// ─── S6: Chemistry (Acids & Bases, Periodic Table) ─────────────────────────────

function generateAcidsBasesProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "A substance with a pH of 3 is:", a: "Acidic", opts: ["Acidic", "Neutral", "Basic", "Pure water"], type: "multiple_choice" },
    { q: "A substance with a pH of 11 is:", a: "Basic (alkaline)", opts: ["Basic (alkaline)", "Acidic", "Neutral", "Salt"], type: "multiple_choice" },
    { q: "On the pH scale, 7 means:", a: "Neutral", opts: ["Neutral", "Strong acid", "Strong base", "No reading"], type: "multiple_choice" },
    { q: "Litmus paper turns which color in an acid?", a: "Red", opts: ["Red", "Blue", "Green", "Yellow"], type: "multiple_choice" },
    { q: "Litmus paper turns which color in a base?", a: "Blue", opts: ["Blue", "Red", "Orange", "Black"], type: "multiple_choice" },
    { q: "The pH scale runs from:", a: "0 to 14", opts: ["0 to 14", "1 to 10", "0 to 100", "-7 to 7"], type: "multiple_choice" },
    { q: "Which of these is an acid?", a: "Lemon juice", opts: ["Lemon juice", "Soap", "Baking soda", "Pure water"], type: "multiple_choice" },
    { q: "Which of these is a base?", a: "Baking soda", opts: ["Baking soda", "Vinegar", "Lemon juice", "Orange juice"], type: "multiple_choice" },
    { q: "When an acid and a base react, they:", a: "Neutralize each other (form salt and water)", opts: ["Neutralize each other (form salt and water)", "Explode always", "Make more acid", "Do nothing"], type: "multiple_choice" },
    { q: "A lower pH number means:", a: "A stronger acid", opts: ["A stronger acid", "A stronger base", "More neutral", "More water"], type: "multiple_choice" },
    { q: "What is a universal indicator used for?", a: "Showing pH by changing color", opts: ["Showing pH by changing color", "Measuring temperature", "Weighing acids", "Heating bases"], type: "multiple_choice" },
    { q: "Vinegar is an example of a weak:", a: "Acid", opts: ["Acid", "Base", "Salt", "Metal"], type: "multiple_choice" },
    { q: "Stomach acid helps you:", a: "Digest food", opts: ["Digest food", "Breathe", "See", "Hear"], type: "multiple_choice" },
    { q: "Bases often feel ___ and taste bitter.", a: "Slippery", opts: ["Slippery", "Sticky", "Sharp", "Dry"], type: "multiple_choice" },
    { q: "Pure water has a pH of:", a: "7 (neutral)", opts: ["7 (neutral)", "0", "14", "1"], type: "multiple_choice" },
    { q: "The product of an acid + base reaction (besides water) is:", a: "A salt", opts: ["A salt", "More acid", "Oxygen", "Sugar"], type: "multiple_choice" },
  ], count);
}

function generatePeriodicTableProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Elements in the same column (group) have:", a: "Similar properties", opts: ["Similar properties", "The same mass", "The same color", "No connection"], type: "multiple_choice" },
    { q: "The chemical symbol for sodium is:", a: "Na", opts: ["Na", "So", "S", "Sd"], type: "multiple_choice" },
    { q: "The chemical symbol for oxygen is:", a: "O", opts: ["O", "Ox", "Og", "On"], type: "multiple_choice" },
    { q: "The periodic table arranges elements by their:", a: "Atomic number", opts: ["Atomic number", "Color", "Size of the sample", "Price"], type: "multiple_choice" },
    { q: "A horizontal row in the periodic table is called a:", a: "Period", opts: ["Period", "Group", "Family", "Column"], type: "multiple_choice" },
    { q: "A vertical column in the periodic table is called a:", a: "Group", opts: ["Group", "Period", "Row", "Shell"], type: "multiple_choice" },
    { q: "The atomic number of an element equals its number of:", a: "Protons", opts: ["Protons", "Neutrons", "Molecules", "Atoms in a gram"], type: "multiple_choice" },
    { q: "The chemical symbol for hydrogen is:", a: "H", opts: ["H", "Hy", "Hg", "Hn"], type: "multiple_choice" },
    { q: "Most elements on the left and center of the table are:", a: "Metals", opts: ["Metals", "Nonmetals", "Gases", "Liquids"], type: "multiple_choice" },
    { q: "The chemical symbol for carbon is:", a: "C", opts: ["C", "Ca", "Cn", "Co"], type: "multiple_choice" },
    { q: "Who is credited with creating the first widely used periodic table?", a: "Dmitri Mendeleev", opts: ["Dmitri Mendeleev", "Isaac Newton", "Albert Einstein", "Marie Curie"], type: "multiple_choice" },
    { q: "Elements in Group 18 (noble gases) are known for being:", a: "Very unreactive", opts: ["Very unreactive", "Explosive", "Liquid", "Magnetic"], type: "multiple_choice" },
    { q: "The chemical symbol for gold is:", a: "Au", opts: ["Au", "Go", "Gd", "Ag"], type: "multiple_choice" },
    { q: "A pure substance made of only one kind of atom is an:", a: "Element", opts: ["Element", "Compound", "Mixture", "Solution"], type: "multiple_choice" },
    { q: "About how many elements are on the modern periodic table?", a: "Around 118", opts: ["Around 118", "Around 26", "Around 50", "Around 1,000"], type: "multiple_choice" },
    { q: "The symbol for iron is:", a: "Fe", opts: ["Fe", "Ir", "In", "Fr"], type: "multiple_choice" },
  ], count);
}

// ─── S7: Physics (Energy, Waves & Sound) ───────────────────────────────────────

function generateEnergyProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "A ball held at the top of a hill has mainly:", a: "Potential energy", opts: ["Potential energy", "Kinetic energy", "No energy", "Sound energy"], type: "multiple_choice" },
    { q: "A moving car has mainly:", a: "Kinetic energy", opts: ["Kinetic energy", "Potential energy", "Chemical energy only", "No energy"], type: "multiple_choice" },
    { q: "The law of conservation of energy says energy cannot be:", a: "Created or destroyed", opts: ["Created or destroyed", "Transferred", "Transformed", "Stored"], type: "multiple_choice" },
    { q: "Kinetic energy is the energy of:", a: "Motion", opts: ["Motion", "Position", "Color", "Sound only"], type: "multiple_choice" },
    { q: "Potential energy is energy that is:", a: "Stored due to position or condition", opts: ["Stored due to position or condition", "Moving fast", "Lost forever", "Made of light"], type: "multiple_choice" },
    { q: "Energy stored in food and fuel is:", a: "Chemical energy", opts: ["Chemical energy", "Sound energy", "Light energy", "Nuclear energy"], type: "multiple_choice" },
    { q: "A stretched rubber band stores:", a: "Elastic potential energy", opts: ["Elastic potential energy", "Kinetic energy", "Light energy", "Sound energy"], type: "multiple_choice" },
    { q: "When you turn on a lamp, electrical energy changes into light and:", a: "Heat (thermal energy)", opts: ["Heat (thermal energy)", "Sound", "Chemical energy", "Nuclear energy"], type: "multiple_choice" },
    { q: "The Sun's energy reaches Earth mainly as:", a: "Light and heat", opts: ["Light and heat", "Sound", "Electricity", "Wind"], type: "multiple_choice" },
    { q: "A roller coaster at the top of a drop converts potential energy into ___ as it falls.", a: "Kinetic energy", opts: ["Kinetic energy", "More potential energy", "Chemical energy", "Sound only"], type: "multiple_choice" },
    { q: "Which is a renewable energy source?", a: "Solar (sunlight)", opts: ["Solar (sunlight)", "Coal", "Oil", "Natural gas"], type: "multiple_choice" },
    { q: "Energy from moving water turning a turbine is:", a: "Hydroelectric energy", opts: ["Hydroelectric energy", "Solar energy", "Chemical energy", "Sound energy"], type: "multiple_choice" },
    { q: "The energy of vibrating objects that we can hear is:", a: "Sound energy", opts: ["Sound energy", "Light energy", "Chemical energy", "Elastic energy"], type: "multiple_choice" },
    { q: "When energy changes form, some is usually 'lost' as:", a: "Heat", opts: ["Heat", "New matter", "Light always", "Nothing"], type: "multiple_choice" },
    { q: "A battery stores energy as ___ energy.", a: "Chemical", opts: ["Chemical", "Kinetic", "Sound", "Light"], type: "multiple_choice" },
    { q: "What is the SI unit of energy?", a: "Joule (J)", opts: ["Joule (J)", "Newton (N)", "Watt only", "Meter (m)"], type: "multiple_choice" },
  ], count);
}

function generateWavesSoundProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Sound cannot travel through:", a: "A vacuum (empty space)", opts: ["A vacuum (empty space)", "Air", "Water", "Metal"], type: "multiple_choice" },
    { q: "The distance between two wave crests is the:", a: "Wavelength", opts: ["Wavelength", "Amplitude", "Frequency", "Speed"], type: "multiple_choice" },
    { q: "The height of a wave from the middle to a crest is the:", a: "Amplitude", opts: ["Amplitude", "Wavelength", "Frequency", "Period"], type: "multiple_choice" },
    { q: "Frequency is measured in:", a: "Hertz (Hz)", opts: ["Hertz (Hz)", "Meters", "Joules", "Newtons"], type: "multiple_choice" },
    { q: "Sound is caused by:", a: "Vibrations", opts: ["Vibrations", "Light", "Heat", "Magnets"], type: "multiple_choice" },
    { q: "A higher frequency sound has a higher:", a: "Pitch", opts: ["Pitch", "Volume", "Speed only", "Color"], type: "multiple_choice" },
    { q: "A bigger amplitude means a sound is:", a: "Louder", opts: ["Louder", "Quieter", "Higher pitched", "Faster"], type: "multiple_choice" },
    { q: "Sound travels fastest through:", a: "Solids", opts: ["Solids", "Liquids", "Gases", "A vacuum"], type: "multiple_choice" },
    { q: "Light is an example of which kind of wave?", a: "Electromagnetic wave", opts: ["Electromagnetic wave", "Sound wave", "Water wave only", "Shock wave"], type: "multiple_choice" },
    { q: "An echo is caused by sound waves that:", a: "Reflect (bounce back)", opts: ["Reflect (bounce back)", "Disappear", "Speed up", "Turn to light"], type: "multiple_choice" },
    { q: "The number of waves passing a point each second is the:", a: "Frequency", opts: ["Frequency", "Amplitude", "Wavelength", "Crest"], type: "multiple_choice" },
    { q: "In a transverse wave, the particles move:", a: "At right angles to the wave's direction", opts: ["At right angles to the wave's direction", "Along the wave's direction", "In circles only", "Not at all"], type: "multiple_choice" },
    { q: "The top of a wave is called the:", a: "Crest", opts: ["Crest", "Trough", "Amplitude", "Node"], type: "multiple_choice" },
    { q: "The bottom (lowest point) of a wave is called the:", a: "Trough", opts: ["Trough", "Crest", "Peak", "Ridge"], type: "multiple_choice" },
    { q: "We see lightning before we hear thunder because:", a: "Light travels faster than sound", opts: ["Light travels faster than sound", "Sound travels faster than light", "Thunder comes first", "They are unrelated"], type: "multiple_choice" },
    { q: "Waves transfer ___ from one place to another.", a: "Energy", opts: ["Energy", "Matter", "Mass", "Water always"], type: "multiple_choice" },
  ], count);
}

// ─── S1: Life Science Basics ──────────────────────────────────────────────────

// ─── S1: Animal (Vertebrate) Groups ────────────────────────────────────────────

function generateAnimalGroupsProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "The five main groups of vertebrates are:", a: "Mammals, birds, fish, reptiles, amphibians", opts: ["Mammals, birds, fish, reptiles, amphibians", "Cats, dogs, fish, bugs, worms", "Plants, animals, fungi", "Herbivores, carnivores, omnivores"], type: "multiple_choice" },
    { q: "A vertebrate is an animal that has a:", a: "Backbone (spine)", opts: ["Backbone (spine)", "Shell", "Exoskeleton", "Soft body only"], type: "multiple_choice" },
    { q: "Which group has feathers and lays eggs?", a: "Birds", opts: ["Birds", "Mammals", "Reptiles", "Fish"], type: "multiple_choice" },
    { q: "Which group has fur or hair and feeds milk to its young?", a: "Mammals", opts: ["Mammals", "Birds", "Amphibians", "Fish"], type: "multiple_choice" },
    { q: "Fish breathe underwater using:", a: "Gills", opts: ["Gills", "Lungs", "Skin only", "Feathers"], type: "multiple_choice" },
    { q: "A frog, which lives in water as a baby and on land as an adult, is a(n):", a: "Amphibian", opts: ["Amphibian", "Reptile", "Mammal", "Fish"], type: "multiple_choice" },
    { q: "Snakes, lizards, and turtles are:", a: "Reptiles", opts: ["Reptiles", "Amphibians", "Mammals", "Birds"], type: "multiple_choice" },
    { q: "Which group has dry, scaly skin?", a: "Reptiles", opts: ["Reptiles", "Amphibians", "Mammals", "Birds"], type: "multiple_choice" },
    { q: "A whale lives in the ocean but is a mammal because it:", a: "Breathes air and feeds its young milk", opts: ["Breathes air and feeds its young milk", "Has gills", "Lays eggs in water", "Has scales"], type: "multiple_choice" },
    { q: "Animals without a backbone are called:", a: "Invertebrates", opts: ["Invertebrates", "Vertebrates", "Mammals", "Reptiles"], type: "multiple_choice" },
    { q: "Most amphibians have skin that is:", a: "Moist and smooth", opts: ["Moist and smooth", "Dry and scaly", "Covered in fur", "Covered in feathers"], type: "multiple_choice" },
    { q: "Which animal is a mammal?", a: "Dolphin", opts: ["Dolphin", "Shark", "Crocodile", "Penguin"], type: "multiple_choice" },
    { q: "Birds are the only animals with:", a: "Feathers", opts: ["Feathers", "Fur", "Scales", "Gills"], type: "multiple_choice" },
    { q: "Animals that make their own body heat (warm-blooded) include:", a: "Mammals and birds", opts: ["Mammals and birds", "Fish and reptiles", "Amphibians and fish", "Reptiles and amphibians"], type: "multiple_choice" },
    { q: "Cold-blooded animals rely on ___ to control their body temperature.", a: "Their surroundings", opts: ["Their surroundings", "Fur", "Sweat", "Feathers"], type: "multiple_choice" },
    { q: "Which is an invertebrate?", a: "Octopus", opts: ["Octopus", "Eagle", "Salmon", "Lizard"], type: "multiple_choice" },
    { q: "Most reptiles and birds reproduce by:", a: "Laying eggs", opts: ["Laying eggs", "Live birth", "Splitting in two", "Budding"], type: "multiple_choice" },
    { q: "A bat that flies but has fur and feeds milk is a:", a: "Mammal", opts: ["Mammal", "Bird", "Reptile", "Amphibian"], type: "multiple_choice" },
  ], count);
}

// ─── S3: Space / Solar System ──────────────────────────────────────────────────

function generateSolarSystemProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "How many planets are in our solar system?", a: "Eight", opts: ["Eight", "Seven", "Nine", "Ten"], type: "multiple_choice" },
    { q: "Which planet is closest to the Sun?", a: "Mercury", opts: ["Mercury", "Venus", "Earth", "Mars"], type: "multiple_choice" },
    { q: "Which is the largest planet?", a: "Jupiter", opts: ["Jupiter", "Saturn", "Earth", "Neptune"], type: "multiple_choice" },
    { q: "The Sun is a:", a: "Star", opts: ["Star", "Planet", "Moon", "Comet"], type: "multiple_choice" },
    { q: "Which planet is known as the 'Red Planet'?", a: "Mars", opts: ["Mars", "Venus", "Jupiter", "Mercury"], type: "multiple_choice" },
    { q: "Which planet is famous for its bright rings?", a: "Saturn", opts: ["Saturn", "Mars", "Earth", "Mercury"], type: "multiple_choice" },
    { q: "What holds the planets in orbit around the Sun?", a: "Gravity", opts: ["Gravity", "Magnetism", "Wind", "Light"], type: "multiple_choice" },
    { q: "The path a planet takes around the Sun is called its:", a: "Orbit", opts: ["Orbit", "Axis", "Rotation", "Phase"], type: "multiple_choice" },
    { q: "Which planet do we live on?", a: "Earth", opts: ["Earth", "Mars", "Venus", "Jupiter"], type: "multiple_choice" },
    { q: "The rocky objects between Mars and Jupiter form the:", a: "Asteroid belt", opts: ["Asteroid belt", "Milky Way", "Moon", "Sun"], type: "multiple_choice" },
    { q: "Which planet is the hottest, due to its thick atmosphere?", a: "Venus", opts: ["Venus", "Mercury", "Mars", "Saturn"], type: "multiple_choice" },
    { q: "Pluto is now classified as a:", a: "Dwarf planet", opts: ["Dwarf planet", "Star", "Moon", "Comet"], type: "multiple_choice" },
    { q: "The planets in order from the Sun begin with:", a: "Mercury, Venus, Earth, Mars", opts: ["Mercury, Venus, Earth, Mars", "Earth, Mars, Venus, Mercury", "Mars, Earth, Venus, Mercury", "Venus, Mercury, Mars, Earth"], type: "multiple_choice" },
    { q: "A ball of ice and dust with a glowing tail is a:", a: "Comet", opts: ["Comet", "Planet", "Star", "Galaxy"], type: "multiple_choice" },
    { q: "Which two planets are the 'gas giants' closest to us?", a: "Jupiter and Saturn", opts: ["Jupiter and Saturn", "Earth and Mars", "Mercury and Venus", "Uranus and Pluto"], type: "multiple_choice" },
    { q: "Our solar system is part of a galaxy called the:", a: "Milky Way", opts: ["Milky Way", "Andromeda", "Big Dipper", "Orion"], type: "multiple_choice" },
  ], count);
}

function generateEarthSunMoonProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What causes day and night?", a: "Earth rotating on its axis", opts: ["Earth rotating on its axis", "The Sun moving around Earth", "The Moon blocking the Sun", "Clouds covering the Sun"], type: "multiple_choice" },
    { q: "How long does Earth take to make one full rotation (one day)?", a: "About 24 hours", opts: ["About 24 hours", "About 7 days", "About 1 month", "About 1 year"], type: "multiple_choice" },
    { q: "How long does Earth take to orbit the Sun once?", a: "About 365 days (one year)", opts: ["About 365 days (one year)", "About 24 hours", "About 1 month", "About 10 years"], type: "multiple_choice" },
    { q: "What causes the seasons?", a: "Earth's tilted axis as it orbits the Sun", opts: ["Earth's tilted axis as it orbits the Sun", "Earth getting closer to the Sun", "The Moon's phases", "Changes in the Sun's size"], type: "multiple_choice" },
    { q: "The Moon appears to change shape over a month. These shapes are called:", a: "Phases", opts: ["Phases", "Orbits", "Eclipses", "Seasons"], type: "multiple_choice" },
    { q: "Why does the Moon shine?", a: "It reflects sunlight", opts: ["It reflects sunlight", "It makes its own light", "It is on fire", "It glows from heat"], type: "multiple_choice" },
    { q: "A solar eclipse happens when:", a: "The Moon passes between the Sun and Earth", opts: ["The Moon passes between the Sun and Earth", "Earth passes between the Sun and Moon", "The Sun goes out", "Clouds cover the Sun"], type: "multiple_choice" },
    { q: "A lunar eclipse happens when:", a: "Earth passes between the Sun and the Moon", opts: ["Earth passes between the Sun and the Moon", "The Moon hits Earth", "The Sun disappears", "The Moon stops orbiting"], type: "multiple_choice" },
    { q: "The Moon takes about how long to orbit Earth?", a: "About one month", opts: ["About one month", "About one day", "About one year", "About one week"], type: "multiple_choice" },
    { q: "When we can't see the lit side of the Moon at all, it is a:", a: "New moon", opts: ["New moon", "Full moon", "Half moon", "Crescent moon"], type: "multiple_choice" },
    { q: "When the whole lit face of the Moon is visible, it is a:", a: "Full moon", opts: ["Full moon", "New moon", "Quarter moon", "Eclipse"], type: "multiple_choice" },
    { q: "The Sun rises in the ___ and sets in the ___.", a: "East; west", opts: ["East; west", "West; east", "North; south", "South; north"], type: "multiple_choice" },
    { q: "The pull of the Moon's gravity on Earth's oceans causes:", a: "Tides", opts: ["Tides", "Wind", "Rain", "Earthquakes"], type: "multiple_choice" },
    { q: "It is summer in a place when that part of Earth is:", a: "Tilted toward the Sun", opts: ["Tilted toward the Sun", "Tilted away from the Sun", "Closest to the Moon", "In shadow"], type: "multiple_choice" },
    { q: "The imaginary line Earth spins around is its:", a: "Axis", opts: ["Axis", "Orbit", "Equator border", "Horizon"], type: "multiple_choice" },
    { q: "As the Moon grows from new to full, we say it is:", a: "Waxing", opts: ["Waxing", "Waning", "Setting", "Eclipsing"], type: "multiple_choice" },
  ], count);
}

// ─── S5: Human Body ────────────────────────────────────────────────────────────

function generateHumanBodyProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which body system pumps blood around the body?", a: "Circulatory system", opts: ["Circulatory system", "Digestive system", "Respiratory system", "Skeletal system"], type: "multiple_choice" },
    { q: "Which organ pumps blood?", a: "The heart", opts: ["The heart", "The lungs", "The liver", "The brain"], type: "multiple_choice" },
    { q: "Which body system takes in oxygen and removes carbon dioxide?", a: "Respiratory system", opts: ["Respiratory system", "Circulatory system", "Nervous system", "Muscular system"], type: "multiple_choice" },
    { q: "Which organs let you breathe?", a: "The lungs", opts: ["The lungs", "The kidneys", "The stomach", "The heart"], type: "multiple_choice" },
    { q: "Which system controls the body and sends messages?", a: "Nervous system", opts: ["Nervous system", "Digestive system", "Skeletal system", "Circulatory system"], type: "multiple_choice" },
    { q: "The control center of the nervous system is the:", a: "Brain", opts: ["Brain", "Heart", "Stomach", "Lungs"], type: "multiple_choice" },
    { q: "Which system gives the body its shape and protects organs?", a: "Skeletal system", opts: ["Skeletal system", "Digestive system", "Respiratory system", "Circulatory system"], type: "multiple_choice" },
    { q: "Muscles help the body to:", a: "Move", opts: ["Move", "Digest food only", "Think", "Breathe only"], type: "multiple_choice" },
    { q: "Which system breaks down food for energy?", a: "Digestive system", opts: ["Digestive system", "Nervous system", "Skeletal system", "Respiratory system"], type: "multiple_choice" },
    { q: "Blood carries ___ and nutrients to every cell.", a: "Oxygen", opts: ["Oxygen", "Carbon dioxide only", "Water only", "Light"], type: "multiple_choice" },
    { q: "The skeleton is made of about 206:", a: "Bones", opts: ["Bones", "Muscles", "Organs", "Nerves"], type: "multiple_choice" },
    { q: "Which organ filters waste from the blood to make urine?", a: "The kidneys", opts: ["The kidneys", "The heart", "The lungs", "The brain"], type: "multiple_choice" },
    { q: "Muscles are attached to bones by:", a: "Tendons", opts: ["Tendons", "Veins", "Nerves", "Skin"], type: "multiple_choice" },
    { q: "The largest organ of the human body is the:", a: "Skin", opts: ["Skin", "Heart", "Brain", "Liver"], type: "multiple_choice" },
    { q: "Body systems are made of organs, which are made of:", a: "Tissues and cells", opts: ["Tissues and cells", "Bones only", "Blood only", "Water only"], type: "multiple_choice" },
    { q: "Which system works with muscles to allow movement?", a: "Skeletal system", opts: ["Skeletal system", "Digestive system", "Respiratory system", "Urinary system"], type: "multiple_choice" },
  ], count);
}

function generateDigestiveProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Where does digestion begin?", a: "In the mouth", opts: ["In the mouth", "In the stomach", "In the intestines", "In the liver"], type: "multiple_choice" },
    { q: "What do teeth do in digestion?", a: "Break food into smaller pieces", opts: ["Break food into smaller pieces", "Absorb nutrients", "Make blood", "Store food"], type: "multiple_choice" },
    { q: "The tube that carries food from the mouth to the stomach is the:", a: "Esophagus", opts: ["Esophagus", "Windpipe", "Vein", "Artery"], type: "multiple_choice" },
    { q: "Which organ mixes food with acid to break it down?", a: "The stomach", opts: ["The stomach", "The heart", "The lungs", "The brain"], type: "multiple_choice" },
    { q: "Most nutrients are absorbed into the blood in the:", a: "Small intestine", opts: ["Small intestine", "Large intestine", "Stomach", "Mouth"], type: "multiple_choice" },
    { q: "The main job of the large intestine is to absorb:", a: "Water", opts: ["Water", "Oxygen", "Sugar only", "Protein only"], type: "multiple_choice" },
    { q: "Saliva in the mouth helps to:", a: "Begin breaking down food", opts: ["Begin breaking down food", "Pump blood", "Filter air", "Store waste"], type: "multiple_choice" },
    { q: "Why does the body digest food?", a: "To get nutrients and energy", opts: ["To get nutrients and energy", "To make bones longer", "To cool down", "To breathe"], type: "multiple_choice" },
    { q: "The correct order food travels is:", a: "Mouth → esophagus → stomach → intestines", opts: ["Mouth → esophagus → stomach → intestines", "Stomach → mouth → intestines", "Mouth → stomach → esophagus", "Intestines → stomach → mouth"], type: "multiple_choice" },
    { q: "Which organ produces bile to help digest fats?", a: "The liver", opts: ["The liver", "The lungs", "The heart", "The kidneys"], type: "multiple_choice" },
    { q: "Solid waste leaves the body from the:", a: "Large intestine (then out of the body)", opts: ["Large intestine (then out of the body)", "Stomach", "Lungs", "Mouth"], type: "multiple_choice" },
    { q: "Fiber is important for digestion because it:", a: "Helps move food through the gut", opts: ["Helps move food through the gut", "Adds oxygen", "Makes blood", "Builds bone"], type: "multiple_choice" },
    { q: "Muscles squeeze food along the digestive tract in a process called:", a: "Peristalsis", opts: ["Peristalsis", "Respiration", "Circulation", "Digestion of bone"], type: "multiple_choice" },
    { q: "Which is part of the digestive system?", a: "Stomach", opts: ["Stomach", "Lungs", "Heart", "Brain"], type: "multiple_choice" },
    { q: "Nutrients absorbed by the intestine are carried to cells by the:", a: "Blood", opts: ["Blood", "Air", "Nerves", "Bones"], type: "multiple_choice" },
    { q: "Chewing food well makes digestion:", a: "Easier", opts: ["Easier", "Harder", "Impossible", "Slower in a bad way"], type: "multiple_choice" },
  ], count);
}

// ─── S7: Simple Machines & Electricity ─────────────────────────────────────────

function generateSimpleMachinesProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "The six simple machines include the lever, pulley, wheel and axle, inclined plane, wedge, and:", a: "Screw", opts: ["Screw", "Motor", "Battery", "Gear box"], type: "multiple_choice" },
    { q: "A seesaw is an example of a:", a: "Lever", opts: ["Lever", "Pulley", "Wedge", "Screw"], type: "multiple_choice" },
    { q: "A ramp that makes it easier to move things up is a(n):", a: "Inclined plane", opts: ["Inclined plane", "Lever", "Pulley", "Wheel and axle"], type: "multiple_choice" },
    { q: "A flagpole uses which simple machine to raise the flag?", a: "Pulley", opts: ["Pulley", "Wedge", "Screw", "Lever"], type: "multiple_choice" },
    { q: "An axe blade that splits wood is a:", a: "Wedge", opts: ["Wedge", "Pulley", "Screw", "Wheel and axle"], type: "multiple_choice" },
    { q: "Simple machines make work easier by changing the size or direction of a:", a: "Force", opts: ["Force", "Color", "Sound", "Temperature"], type: "multiple_choice" },
    { q: "A doorknob is an example of a:", a: "Wheel and axle", opts: ["Wheel and axle", "Lever", "Wedge", "Pulley"], type: "multiple_choice" },
    { q: "A jar lid that twists on is an example of a:", a: "Screw", opts: ["Screw", "Wedge", "Lever", "Pulley"], type: "multiple_choice" },
    { q: "Two or more simple machines working together make a:", a: "Compound machine", opts: ["Compound machine", "Super machine", "Force field", "Engine only"], type: "multiple_choice" },
    { q: "Using a longer ramp to lift a load means you use:", a: "Less force over a longer distance", opts: ["Less force over a longer distance", "More force over a short distance", "No force at all", "Only gravity"], type: "multiple_choice" },
    { q: "A wheelbarrow is mainly an example of a:", a: "Lever", opts: ["Lever", "Pulley", "Screw", "Wedge"], type: "multiple_choice" },
    { q: "Scissors are a compound machine made of two levers and two:", a: "Wedges (blades)", opts: ["Wedges (blades)", "Pulleys", "Screws", "Wheels"], type: "multiple_choice" },
    { q: "The 'mechanical advantage' of a machine means it:", a: "Multiplies the force you put in", opts: ["Multiplies the force you put in", "Removes all effort", "Adds energy from nothing", "Makes things heavier"], type: "multiple_choice" },
    { q: "A staircase is a real-life example of which simple machine?", a: "Inclined plane", opts: ["Inclined plane", "Pulley", "Wheel and axle", "Lever"], type: "multiple_choice" },
    { q: "Which simple machine is a knife?", a: "Wedge", opts: ["Wedge", "Pulley", "Screw", "Wheel and axle"], type: "multiple_choice" },
    { q: "Work is done when a force moves an object a:", a: "Distance", opts: ["Distance", "Color", "Sound", "Temperature"], type: "multiple_choice" },
  ], count);
}

function generateElectricityProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "For electricity to flow, a circuit must be:", a: "Complete (closed)", opts: ["Complete (closed)", "Broken (open)", "Made of wood", "Wet"], type: "multiple_choice" },
    { q: "A material that lets electricity flow through it is a:", a: "Conductor", opts: ["Conductor", "Insulator", "Magnet", "Resistor only"], type: "multiple_choice" },
    { q: "A material that stops electricity from flowing is an:", a: "Insulator", opts: ["Insulator", "Conductor", "Battery", "Switch"], type: "multiple_choice" },
    { q: "Which is a good conductor of electricity?", a: "Copper metal", opts: ["Copper metal", "Rubber", "Plastic", "Wood"], type: "multiple_choice" },
    { q: "Which is a good insulator?", a: "Rubber", opts: ["Rubber", "Copper", "Iron", "Silver"], type: "multiple_choice" },
    { q: "What does a switch do in a circuit?", a: "Opens or closes the circuit", opts: ["Opens or closes the circuit", "Stores energy", "Makes light only", "Adds water"], type: "multiple_choice" },
    { q: "What provides the energy in a simple circuit?", a: "The battery (cell)", opts: ["The battery (cell)", "The wire", "The switch", "The bulb"], type: "multiple_choice" },
    { q: "In a series circuit, if one bulb breaks, the others:", a: "Go out too", opts: ["Go out too", "Stay on", "Get brighter", "Are unaffected"], type: "multiple_choice" },
    { q: "In a parallel circuit, if one bulb breaks, the others:", a: "Stay lit", opts: ["Stay lit", "Go out", "Explode", "Reverse"], type: "multiple_choice" },
    { q: "Electric current is a flow of:", a: "Charge (electrons)", opts: ["Charge (electrons)", "Water", "Air", "Light"], type: "multiple_choice" },
    { q: "The rubbing of a balloon on hair creates:", a: "Static electricity", opts: ["Static electricity", "Current electricity", "Heat only", "Magnetism only"], type: "multiple_choice" },
    { q: "Why are electrical wires coated in plastic?", a: "Plastic is an insulator and keeps us safe", opts: ["Plastic is an insulator and keeps us safe", "Plastic conducts better", "To add weight", "For decoration only"], type: "multiple_choice" },
    { q: "Which would complete a circuit and light the bulb?", a: "A closed loop of wire from battery to bulb and back", opts: ["A closed loop of wire from battery to bulb and back", "A single wire to the bulb only", "A broken wire", "A wooden stick"], type: "multiple_choice" },
    { q: "Electrical energy in a bulb is changed into light and:", a: "Heat", opts: ["Heat", "Sound", "Sugar", "Water"], type: "multiple_choice" },
    { q: "A device that measures electric current is an:", a: "Ammeter", opts: ["Ammeter", "Thermometer", "Ruler", "Barometer"], type: "multiple_choice" },
    { q: "Lightning is a giant natural spark of:", a: "Static electricity", opts: ["Static electricity", "Sound", "Wind", "Heat only"], type: "multiple_choice" },
  ], count);
}

function generateLivingNonlivingProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which of these is a living thing?", a: "A cactus", opts: ["A rock", "A cactus", "A toy car", "A cloud"], type: "multiple_choice" },
    { q: "Which of these is NOT living?", a: "A bicycle", opts: ["A dog", "A tree", "A bicycle", "A fish"], type: "multiple_choice" },
    { q: "All living things can do this that a rock cannot:", a: "Grow and reproduce", opts: ["Be heavy", "Grow and reproduce", "Get wet", "Break apart"], type: "multiple_choice" },
    { q: "Name one thing all living things need to survive.", a: "Food, water, or air (any one)" },
    { q: "Is a seed living or nonliving?", a: "Living", opts: ["Living", "Nonliving"], type: "multiple_choice" },
    { q: "Living things respond to their surroundings. This means they can:", a: "React to changes (like light or touch)", opts: ["Stay frozen forever", "React to changes (like light or touch)", "Never move", "Turn into rocks"], type: "multiple_choice" },
    { q: "Which is a sign that something is alive?", a: "It grows", opts: ["It is shiny", "It grows", "It is cold", "It is round"], type: "multiple_choice" },
    { q: "True or False: A river is a living thing because it moves.", a: "False — moving does not make something alive" },
    { q: "Which group lists only living things?", a: "Cat, fern, beetle", opts: ["Cat, fern, beetle", "Cat, rock, beetle", "Chair, fern, cloud", "Sun, water, sand"], type: "multiple_choice" },
    { q: "What do we call the young that living things make?", a: "Offspring" },
    { q: "Plants are living things because they:", a: "Grow, need water, and make seeds", opts: ["Are green", "Grow, need water, and make seeds", "Stay still", "Are outside"], type: "multiple_choice" },
    { q: "Which of these was once living?", a: "A wooden chair", opts: ["A metal spoon", "A wooden chair", "A glass cup", "A plastic toy"], type: "multiple_choice" },
    { q: "Name the seven life processes? Give any two.", a: "Move, breathe, grow, eat, sense, reproduce, get rid of waste (any two)" },
    { q: "Is fire a living thing? Why or why not?", a: "No — it grows and moves but cannot reproduce or sense like living things" },
    { q: "A nonliving thing does NOT:", a: "Need food or water", opts: ["Have a colour", "Need food or water", "Have a shape", "Take up space"], type: "multiple_choice" },
    { q: "Which is living: a sponge animal in the ocean, or a kitchen sponge?", a: "The sponge animal in the ocean" },
  ], count);
}

function generatePlantLifeCycleProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What does a seed need to start growing?", a: "Water, warmth, and air", opts: ["Sugar", "Water, warmth, and air", "Plastic", "Salt"], type: "multiple_choice" },
    { q: "Put in order: seed → ___ → adult plant", a: "Sprout (seedling)" },
    { q: "What is it called when a seed begins to grow?", a: "Germination" },
    { q: "What part of the plant grows down into the soil first?", a: "The root", opts: ["The flower", "The root", "The fruit", "The leaf"], type: "multiple_choice" },
    { q: "What do flowers help a plant to make?", a: "Seeds (and fruit)", opts: ["Soil", "Seeds (and fruit)", "Water", "Sunlight"], type: "multiple_choice" },
    { q: "What carries pollen from flower to flower?", a: "Insects like bees (and wind)" },
    { q: "Which comes first in a plant's life cycle?", a: "Seed", opts: ["Flower", "Seed", "Fruit", "Adult plant"], type: "multiple_choice" },
    { q: "What do leaves use to make food for the plant?", a: "Sunlight" },
    { q: "True or False: A plant's life cycle repeats when new seeds grow.", a: "True" },
    { q: "What is a young plant just after it sprouts called?", a: "A seedling" },
    { q: "Which two things does a seedling need to keep growing?", a: "Sunlight and water", opts: ["Sunlight and water", "Darkness and salt", "Wind and sand", "Cold and snow"], type: "multiple_choice" },
    { q: "Where are new seeds usually found on a plant?", a: "Inside the fruit or flower" },
    { q: "What is pollination?", a: "Moving pollen so a flower can make seeds" },
    { q: "Why do some seeds have fluff or wings?", a: "So the wind can carry them to new places" },
    { q: "What happens to many seeds before they can grow?", a: "They are scattered (dispersed) away from the parent plant" },
    { q: "The correct order is:", a: "Seed → seedling → adult → flower → seed", opts: ["Flower → seed → seedling", "Seed → seedling → adult → flower → seed", "Fruit → root → seed", "Adult → seed → root"], type: "multiple_choice" },
  ], count);
}

function generateAnimalLifeCycleProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "A tadpole grows into a:", a: "Frog", opts: ["Fish", "Frog", "Snake", "Lizard"], type: "multiple_choice" },
    { q: "Which animal hatches from an egg?", a: "Chicken", opts: ["Dog", "Cow", "Chicken", "Cat"], type: "multiple_choice" },
    { q: "What is the caterpillar stage of a butterfly called?", a: "Larva" },
    { q: "Order the butterfly life cycle:", a: "Egg → caterpillar → chrysalis → butterfly", opts: ["Egg → caterpillar → chrysalis → butterfly", "Butterfly → egg → frog", "Caterpillar → egg → butterfly", "Egg → tadpole → butterfly"], type: "multiple_choice" },
    { q: "What is the big change in a caterpillar becoming a butterfly called?", a: "Metamorphosis" },
    { q: "Which animal gives birth to live young instead of laying eggs?", a: "A dog", opts: ["A frog", "A dog", "A chicken", "A turtle"], type: "multiple_choice" },
    { q: "What is the hard case a caterpillar makes around itself called?", a: "A chrysalis (or cocoon)" },
    { q: "A baby frog that lives in water and has a tail is a:", a: "Tadpole", opts: ["Chick", "Tadpole", "Cub", "Joey"], type: "multiple_choice" },
    { q: "True or False: All animals begin their life as a baby that looks like the adult.", a: "False — some change form (metamorphosis), like frogs and butterflies" },
    { q: "What do we call a baby cat?", a: "A kitten" },
    { q: "Which animal does NOT lay eggs?", a: "A horse", opts: ["A bird", "A fish", "A horse", "A frog"], type: "multiple_choice" },
    { q: "In a frog's life cycle, legs appear during the:", a: "Tadpole stage", opts: ["Egg stage", "Tadpole stage", "Adult stage", "Never"], type: "multiple_choice" },
    { q: "What is the first stage of almost every animal's life cycle?", a: "Egg (or being born)" },
    { q: "Why do many animals lay many eggs at once?", a: "Because not all of them will survive to become adults" },
    { q: "A life cycle that goes egg → larva → pupa → adult belongs to a:", a: "Butterfly (insect)", opts: ["Frog", "Butterfly (insect)", "Dog", "Bird"], type: "multiple_choice" },
    { q: "What does it mean that a life cycle is a 'cycle'?", a: "It repeats — adults make young that grow into new adults" },
  ], count);
}

function generateHabitatProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "A camel is best suited to live in the:", a: "Desert", opts: ["Ocean", "Desert", "Arctic", "Pond"], type: "multiple_choice" },
    { q: "A habitat gives an animal everything it needs EXCEPT:", a: "Homework", opts: ["Food", "Shelter", "Homework", "Water"], type: "multiple_choice" },
    { q: "What is a habitat?", a: "The place where a plant or animal naturally lives" },
    { q: "Which animal would you find in an ocean habitat?", a: "A dolphin", opts: ["A lion", "A dolphin", "A camel", "A polar bear"], type: "multiple_choice" },
    { q: "A polar bear lives in a cold habitat called the:", a: "Arctic", opts: ["Desert", "Rainforest", "Arctic", "Grassland"], type: "multiple_choice" },
    { q: "Name two things a habitat provides for an animal.", a: "Any two of: food, water, shelter, space" },
    { q: "Which habitat is hot and gets very little rain?", a: "Desert", opts: ["Desert", "Rainforest", "Ocean", "Tundra"], type: "multiple_choice" },
    { q: "A frog lives near a pond because it needs:", a: "Water to live and lay eggs", opts: ["Sand", "Water to live and lay eggs", "Snow", "Tall trees only"], type: "multiple_choice" },
    { q: "What might happen to an animal if its habitat is destroyed?", a: "It may lose its food and shelter and have to move or could die" },
    { q: "A rainforest habitat is best described as:", a: "Warm and very wet", opts: ["Cold and dry", "Warm and very wet", "Hot and sandy", "Icy and windy"], type: "multiple_choice" },
    { q: "Which animals live in a grassland habitat?", a: "Zebras and lions", opts: ["Whales and crabs", "Zebras and lions", "Penguins and seals", "Camels and scorpions"], type: "multiple_choice" },
    { q: "True or False: A fish could survive in a desert habitat.", a: "False — a fish needs water to breathe" },
    { q: "What is a 'shelter' in a habitat?", a: "A safe place to rest and hide from danger (like a den or nest)" },
    { q: "Why do different animals live in different habitats?", a: "Each animal is suited to the food and conditions of its own habitat" },
    { q: "A habitat that is covered in trees is a:", a: "Forest", opts: ["Forest", "Desert", "Ocean", "Tundra"], type: "multiple_choice" },
    { q: "What do we call all the living and nonliving things in a habitat together?", a: "An ecosystem" },
  ], count);
}

// ─── S4: States of Matter ─────────────────────────────────────────────────────

function generateSolidsLiquidsGasesProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Which state of matter has a definite shape and a definite volume?", a: "Solid", opts: ["Gas", "Liquid", "Plasma", "Solid"], type: "multiple_choice" },
    { q: "A gas:", a: "Fills its whole container", opts: ["Keeps its own shape", "Fills its whole container", "Has a fixed shape", "Cannot be squashed"], type: "multiple_choice" },
    { q: "Which state takes the shape of its container but keeps the same volume?", a: "Liquid", opts: ["Solid", "Liquid", "Gas", "None"], type: "multiple_choice" },
    { q: "In which state are the particles packed tightly in a fixed pattern?", a: "Solid", opts: ["Solid", "Liquid", "Gas", "All of them"], type: "multiple_choice" },
    { q: "In which state are particles farthest apart and moving fastest?", a: "Gas", opts: ["Solid", "Liquid", "Gas", "They are equal"], type: "multiple_choice" },
    { q: "Which of these is a liquid at room temperature?", a: "Water", opts: ["Ice", "Water", "Steam", "Wood"], type: "multiple_choice" },
    { q: "Which of these is a gas?", a: "Air", opts: ["Milk", "Air", "Sand", "Juice"], type: "multiple_choice" },
    { q: "Why can you pour a liquid but not a solid block?", a: "Liquid particles can slide past each other; solid particles cannot" },
    { q: "True or False: A gas can be squashed into a smaller space.", a: "True" },
    { q: "What are the three common states of matter?", a: "Solid, liquid, and gas" },
    { q: "Sand can be poured. Is sand a liquid?", a: "No — it is made of tiny solid grains" },
    { q: "Which state is the easiest to compress (squash)?", a: "Gas", opts: ["Solid", "Liquid", "Gas", "They are the same"], type: "multiple_choice" },
    { q: "Milk in a glass takes the shape of the glass. This shows milk is a:", a: "Liquid", opts: ["Solid", "Liquid", "Gas", "Plasma"], type: "multiple_choice" },
    { q: "How are the particles in a solid arranged?", a: "Close together in a regular, fixed pattern" },
    { q: "Which has a fixed volume but no fixed shape?", a: "Liquid", opts: ["Solid", "Liquid", "Gas", "None"], type: "multiple_choice" },
    { q: "Steam, water, and ice are all made of the same substance in different:", a: "States of matter", opts: ["Colours", "States of matter", "Sizes only", "Materials"], type: "multiple_choice" },
  ], count);
}

function generateStateChangesProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Changing from a liquid to a gas is called:", a: "Evaporation (boiling)", opts: ["Melting", "Freezing", "Evaporation (boiling)", "Condensation"], type: "multiple_choice" },
    { q: "Changing from a gas to a liquid is called:", a: "Condensation", opts: ["Melting", "Condensation", "Freezing", "Evaporation"], type: "multiple_choice" },
    { q: "Changing from a solid to a liquid is called:", a: "Melting", opts: ["Melting", "Freezing", "Boiling", "Condensing"], type: "multiple_choice" },
    { q: "Changing from a liquid to a solid is called:", a: "Freezing", opts: ["Melting", "Freezing", "Evaporation", "Condensation"], type: "multiple_choice" },
    { q: "What state change happens when water vapour touches a cold window?", a: "Condensation" },
    { q: "When a solid changes straight into a gas, it is called:", a: "Sublimation", opts: ["Melting", "Sublimation", "Freezing", "Condensation"], type: "multiple_choice" },
    { q: "What causes most state changes?", a: "Adding or removing heat (energy)" },
    { q: "Ice cream left in the sun changes from solid to liquid. This is:", a: "Melting" },
    { q: "True or False: State changes are physical changes, not new substances.", a: "True — it is the same substance in a different state" },
    { q: "Dew forming on grass in the morning is an example of:", a: "Condensation", opts: ["Melting", "Condensation", "Freezing", "Sublimation"], type: "multiple_choice" },
    { q: "When you heat a substance, its particles:", a: "Move faster and spread apart", opts: ["Stop moving", "Move faster and spread apart", "Get smaller", "Disappear"], type: "multiple_choice" },
    { q: "Frost forming directly from water vapour is called:", a: "Deposition", opts: ["Melting", "Deposition", "Boiling", "Freezing"], type: "multiple_choice" },
    { q: "Which two state changes need heat to be ADDED?", a: "Melting and evaporation" },
    { q: "Which two state changes happen when heat is REMOVED?", a: "Freezing and condensation" },
    { q: "Boiling water turns into steam. This change is:", a: "Liquid to gas (evaporation/boiling)" },
    { q: "If you cool water vapour enough, it will:", a: "Condense into liquid water", opts: ["Melt", "Condense into liquid water", "Freeze into a gas", "Disappear"], type: "multiple_choice" },
  ], count);
}

function generateMeltingFreezingProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Water freezes at:", a: "0 °C", opts: ["0 °C", "50 °C", "100 °C", "-100 °C"], type: "multiple_choice" },
    { q: "The temperature at which a solid turns to liquid is its:", a: "Melting point", opts: ["Boiling point", "Melting point", "Freezing fog", "Dew point"], type: "multiple_choice" },
    { q: "Melting is a solid changing into a:", a: "Liquid", opts: ["Gas", "Liquid", "Solid", "Vapour"], type: "multiple_choice" },
    { q: "Freezing is a liquid changing into a:", a: "Solid", opts: ["Gas", "Liquid", "Solid", "Plasma"], type: "multiple_choice" },
    { q: "To MELT ice, you must:", a: "Add heat", opts: ["Add heat", "Remove heat", "Add salt only", "Do nothing"], type: "multiple_choice" },
    { q: "To FREEZE water, you must:", a: "Remove heat (cool it)", opts: ["Add heat", "Remove heat (cool it)", "Stir it", "Add sugar"], type: "multiple_choice" },
    { q: "The melting point and freezing point of water are:", a: "The same temperature (0 °C)", opts: ["Very different", "The same temperature (0 °C)", "100 °C apart", "Unknown"], type: "multiple_choice" },
    { q: "True or False: A chocolate bar melts when it gets warm.", a: "True" },
    { q: "Why do roads get salted in winter?", a: "Salt lowers water's freezing point so ice melts" },
    { q: "What happens to the particles when a solid melts?", a: "They gain energy and start to move and slide past each other" },
    { q: "Butter turning to liquid in a hot pan is:", a: "Melting" },
    { q: "A puddle turning to ice overnight is:", a: "Freezing" },
    { q: "Which needs a colder temperature: melting ice or freezing water?", a: "They happen at the same temperature, 0 °C" },
    { q: "Different solids melt at different temperatures. True or False?", a: "True — each substance has its own melting point" },
    { q: "When water freezes, it actually:", a: "Expands (takes up more space)", opts: ["Shrinks", "Expands (takes up more space)", "Disappears", "Gets heavier"], type: "multiple_choice" },
    { q: "Metal needs a very high temperature to melt because:", a: "Its particles are held together very strongly" },
  ], count);
}

function generateEvaporationProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "Evaporation is when a liquid changes into a:", a: "Gas", opts: ["Solid", "Gas", "Liquid", "Crystal"], type: "multiple_choice" },
    { q: "A puddle dries up fastest when it is:", a: "Hot and windy", opts: ["Cold and still", "Hot and windy", "Dark and cool", "Rainy"], type: "multiple_choice" },
    { q: "What makes water evaporate faster?", a: "Heat (a higher temperature)", opts: ["Cold", "Heat (a higher temperature)", "Shade", "A lid"], type: "multiple_choice" },
    { q: "Wet clothes dry on a washing line because the water:", a: "Evaporates into the air", opts: ["Freezes", "Evaporates into the air", "Melts", "Sinks"], type: "multiple_choice" },
    { q: "The gas form of water is called:", a: "Water vapour", opts: ["Ice", "Water vapour", "Steam mud", "Frost"], type: "multiple_choice" },
    { q: "True or False: Evaporation happens only when water boils.", a: "False — it can happen slowly at normal temperatures too" },
    { q: "Why does a glass of water slowly empty if left out for days?", a: "The water evaporates into the air" },
    { q: "Which would dry faster in the sun: a thin spill or a deep puddle?", a: "The thin spill (more surface, less water)" },
    { q: "Evaporation is part of which natural cycle?", a: "The water cycle" },
    { q: "Spreading wet clothes out wide helps them dry faster because:", a: "More surface is exposed to the air", opts: ["It makes them colder", "More surface is exposed to the air", "It adds water", "It blocks the wind"], type: "multiple_choice" },
    { q: "When sea water evaporates, what is left behind?", a: "Salt" },
    { q: "Which speeds up evaporation: more wind or less wind?", a: "More wind" },
    { q: "Sweat helps cool your body because it:", a: "Evaporates and carries heat away", opts: ["Freezes on your skin", "Evaporates and carries heat away", "Turns to ice", "Soaks back in"], type: "multiple_choice" },
    { q: "What three things speed up evaporation?", a: "Heat, wind, and a larger surface area" },
    { q: "Is evaporation a physical change or a chemical change?", a: "A physical change (it's still water, just a gas)" },
    { q: "After it rains, the road becomes dry again because the water:", a: "Evaporated", opts: ["Melted", "Evaporated", "Froze", "Was absorbed by the sun"], type: "multiple_choice" },
  ], count);
}

function bankToProblems(items: { q: string; a: string; opts?: string[]; type?: ProblemType }[], count: number): Problem[] {
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: item.type ?? "short_answer", question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

function generateFoodChainProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is a producer in a food chain?", a: "An organism that makes its own food (plants)" },
    { q: "What is a consumer?", a: "An organism that eats other organisms" },
    { q: "In the chain grass → rabbit → fox, what is the rabbit?", a: "Primary consumer (herbivore)" },
    { q: "In the chain grass → rabbit → fox, what is the fox?", a: "Secondary consumer (carnivore)" },
    { q: "What is the ultimate source of energy for most food chains?", a: "The Sun" },
    { q: "What is a decomposer? Give one example.", a: "Breaks down dead matter — e.g. fungi, bacteria, worms" },
    { q: "True or False: Energy increases as you move up a food chain.", a: "False — energy decreases (about 10% passes to each level)" },
    { q: "A herbivore eats:", a: "Only plants", opts: ["Only plants", "Only animals", "Both plants and animals", "Neither"], type: "multiple_choice" },
    { q: "What is a predator?", a: "An animal that hunts and eats other animals" },
    { q: "What is prey?", a: "An animal that is hunted and eaten by predators" },
    { q: "What would happen if all the plants in an ecosystem disappeared?", a: "Herbivores die, then carnivores die (the ecosystem collapses)" },
    { q: "Which arrow direction shows energy flow in a food chain?", a: "From the food to the eater", opts: ["From the eater to the food", "From the food to the eater", "Both directions", "No direction"], type: "multiple_choice" },
    { q: "An animal that eats both plants and animals is a:", a: "Omnivore", opts: ["Herbivore", "Carnivore", "Omnivore", "Producer"], type: "multiple_choice" },
    { q: "Which organism in a food chain makes its own food?", a: "The producer", opts: ["The producer", "The herbivore", "The predator", "The decomposer"], type: "multiple_choice" },
    { q: "In grass → grasshopper → frog → snake, which is the top predator?", a: "The snake" },
    { q: "Where does a food chain almost always start?", a: "With a producer (a plant)" },
    { q: "What do we call an animal that only eats meat?", a: "Carnivore", opts: ["Herbivore", "Carnivore", "Omnivore", "Decomposer"], type: "multiple_choice" },
    { q: "Why are decomposers important to a food chain?", a: "They recycle nutrients from dead things back into the soil" },
  ], count);
}

function generateFoodWebProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is a food web?", a: "Many food chains linked together in an ecosystem" },
    { q: "How is a food web different from a food chain?", a: "A web shows many connected chains; a chain shows one path" },
    { q: "Why is a food web more realistic than a single food chain?", a: "Most animals eat more than one kind of food" },
    { q: "In a food web, an animal can be part of:", a: "More than one food chain", opts: ["Only one food chain", "More than one food chain", "No food chains", "Only the first level"], type: "multiple_choice" },
    { q: "If one species is removed from a food web, what can happen?", a: "Other species that depended on it are affected too" },
    { q: "What is a keystone species?", a: "A species many others depend on; removing it changes the whole web" },
    { q: "In a web, an organism eaten by several predators shows the web is:", a: "Interconnected", opts: ["Simple", "Interconnected", "Broken", "Empty"], type: "multiple_choice" },
    { q: "Producers in a food web are usually found at the:", a: "Base (bottom)", opts: ["Top", "Base (bottom)", "Middle only", "They aren't shown"], type: "multiple_choice" },
    { q: "If rabbits disappear, what happens to foxes that eat them?", a: "Foxes have less food and their numbers may drop" },
    { q: "If rabbits disappear, what happens to the grass they ate?", a: "The grass may grow more (fewer animals eating it)" },
    { q: "True or False: A food web can have several predators eating the same prey.", a: "True" },
    { q: "Energy in a food web ultimately comes from:", a: "The Sun", opts: ["The soil", "The Sun", "Predators", "Decomposers"], type: "multiple_choice" },
    { q: "What is an apex predator in a food web?", a: "A top predator with no natural predators of its own" },
    { q: "Why do food webs usually have many producers?", a: "Energy is lost at each level, so the base must be large" },
    { q: "Adding a new predator to a web can:", a: "Reduce the prey it hunts", opts: ["Increase its prey", "Reduce the prey it hunts", "Have no effect", "Remove producers"], type: "multiple_choice" },
    { q: "What connects the organisms in a food web?", a: "Feeding (energy) relationships" },
  ], count);
}

function generateProducerConsumerProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is a producer?", a: "An organism that makes its own food, usually using sunlight" },
    { q: "What is a consumer?", a: "An organism that gets energy by eating other organisms" },
    { q: "Which of these is a producer?", a: "Grass", opts: ["Grass", "Rabbit", "Fox", "Mushroom"], type: "multiple_choice" },
    { q: "Plants make their food by the process of:", a: "Photosynthesis", opts: ["Digestion", "Photosynthesis", "Respiration", "Decomposition"], type: "multiple_choice" },
    { q: "A primary consumer eats:", a: "Producers (plants)", opts: ["Producers (plants)", "Other consumers", "Decomposers", "Nothing"], type: "multiple_choice" },
    { q: "A secondary consumer eats:", a: "Primary consumers", opts: ["Producers", "Primary consumers", "The Sun", "Soil"], type: "multiple_choice" },
    { q: "Which is a consumer?", a: "Deer", opts: ["Oak tree", "Deer", "Algae", "Grass"], type: "multiple_choice" },
    { q: "Why are producers the foundation of an ecosystem?", a: "They capture the Sun's energy that everything else depends on" },
    { q: "Are humans producers or consumers?", a: "Consumers — we eat other organisms" },
    { q: "What do producers need to make food?", a: "Sunlight, water, and carbon dioxide" },
    { q: "An organism that eats only producers is called a:", a: "Herbivore", opts: ["Herbivore", "Carnivore", "Producer", "Decomposer"], type: "multiple_choice" },
    { q: "True or False: All consumers can make their own food.", a: "False — consumers must eat to get energy" },
    { q: "Algae in a pond act as:", a: "Producers", opts: ["Producers", "Consumers", "Decomposers", "Predators"], type: "multiple_choice" },
    { q: "Which gives the producer its green colour and helps make food?", a: "Chlorophyll" },
    { q: "A consumer that eats dead animals it did not hunt is a:", a: "Scavenger", opts: ["Scavenger", "Producer", "Herbivore", "Plant"], type: "multiple_choice" },
    { q: "Where do producers get their energy?", a: "From the Sun" },
  ], count);
}

function generateAdaptationProblems(count: number): Problem[] {
  return bankToProblems([
    { q: "What is an adaptation?", a: "A feature or behaviour that helps an organism survive in its habitat" },
    { q: "Why do polar bears have thick fur?", a: "To stay warm in their cold habitat" },
    { q: "How does a cactus survive in the desert?", a: "It stores water and has spines instead of leaves to reduce water loss" },
    { q: "A camel's hump helps it by storing:", a: "Fat for energy", opts: ["Water", "Fat for energy", "Air", "Food it ate"], type: "multiple_choice" },
    { q: "Camouflage helps an animal by:", a: "Blending in to hide", opts: ["Making it faster", "Blending in to hide", "Keeping it warm", "Helping it fly"], type: "multiple_choice" },
    { q: "Why do many desert animals come out at night?", a: "To avoid the daytime heat" },
    { q: "A duck's webbed feet are an adaptation for:", a: "Swimming", opts: ["Running", "Swimming", "Climbing", "Digging"], type: "multiple_choice" },
    { q: "What is a behavioural adaptation? Give an example.", a: "An action that aids survival — e.g. birds migrating or animals hibernating" },
    { q: "What is a physical (structural) adaptation?", a: "A body feature — e.g. sharp claws, thick fur, or a long beak" },
    { q: "Why do some animals hibernate in winter?", a: "To survive cold months when food is scarce" },
    { q: "Sharp talons and a hooked beak are adaptations of a:", a: "Bird of prey", opts: ["Duck", "Bird of prey", "Penguin", "Chicken"], type: "multiple_choice" },
    { q: "A chameleon changing colour is an example of:", a: "Camouflage", opts: ["Migration", "Camouflage", "Hibernation", "Photosynthesis"], type: "multiple_choice" },
    { q: "What happens to organisms that are NOT well adapted to their habitat?", a: "They are less likely to survive and reproduce" },
    { q: "Why do fish have gills?", a: "To take oxygen from water so they can breathe underwater" },
    { q: "Migration is when animals:", a: "Move to a new area seasonally", opts: ["Sleep all winter", "Move to a new area seasonally", "Change colour", "Make their own food"], type: "multiple_choice" },
    { q: "A giraffe's long neck helps it:", a: "Reach leaves high in trees" },
  ], count);
}

function generateLifeScienceProblems(count: number): Problem[] {
  const items = [
    { q: "What do plants need to make food?", a: "Sunlight, water, and carbon dioxide" },
    { q: "What process do plants use to make food?", a: "Photosynthesis" },
    { q: "What gas do plants release during photosynthesis?", a: "Oxygen" },
    { q: "What gas do plants take in during photosynthesis?", a: "Carbon dioxide" },
    { q: "What is the powerhouse of the cell?", a: "Mitochondria" },
    { q: "What does the nucleus do?", a: "Controls cell activities and contains DNA" },
    { q: "True or False: All living things are made of cells.", a: "True" },
    { q: "What is the difference between plant and animal cells?", a: "Plant cells have a cell wall and chloroplasts; animal cells do not" },
    { q: "What is DNA?", a: "A molecule that contains genetic information for all living organisms" },
    { q: "What is the function of chlorophyll?", a: "Absorbs sunlight for photosynthesis; gives plants their green colour" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateEarthScienceProblems(count: number): Problem[] {
  const items = [
    { q: "What causes day and night?", a: "Earth rotating on its axis" },
    { q: "What causes the seasons?", a: "Earth's tilted axis as it orbits the Sun" },
    { q: "What type of rock forms from cooled lava?", a: "Igneous rock" },
    { q: "What type of rock forms from layers of compressed sediment?", a: "Sedimentary rock" },
    { q: "What type of rock forms under extreme heat and pressure?", a: "Metamorphic rock" },
    { q: "What is the rock cycle?", a: "The continuous process by which rocks are formed, broken down, and reformed" },
    { q: "What is plate tectonics?", a: "The theory that Earth's crust is made of moving plates" },
    { q: "What causes earthquakes?", a: "Movement of tectonic plates creating stress and sudden release of energy" },
    { q: "What is the difference between weather and climate?", a: "Weather is short-term atmospheric conditions; climate is long-term patterns" },
    { q: "What is erosion?", a: "The wearing away of rock and soil by wind, water, or ice" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateBiologyProblems(count: number): Problem[] {
  const items = [
    { q: "What is mitosis?", a: "Cell division that produces two genetically identical daughter cells" },
    { q: "What is meiosis?", a: "Cell division that produces four genetically unique sex cells (gametes)" },
    { q: "What is the function of DNA?", a: "To carry genetic information and instructions for building proteins" },
    { q: "What is RNA?", a: "A molecule that carries genetic instructions from DNA to make proteins" },
    { q: "What is a gene?", a: "A segment of DNA that codes for a specific trait or protein" },
    { q: "What is a chromosome?", a: "A thread-like structure of DNA and protein in the nucleus" },
    { q: "How many chromosomes do humans have?", a: "46 (23 pairs)" },
    { q: "What is natural selection?", a: "The process where organisms better adapted to their environment survive and reproduce" },
    { q: "What is a mutation?", a: "A change in the DNA sequence" },
    { q: "What is homeostasis?", a: "The ability of an organism to maintain a stable internal environment" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generatePhysicsProblems(count: number): Problem[] {
  const items = [
    { q: "What is Newton's First Law of Motion?", a: "An object at rest stays at rest; an object in motion stays in motion unless acted upon by an unbalanced force" },
    { q: "What is Newton's Second Law of Motion?", a: "F = ma (Force equals mass times acceleration)" },
    { q: "What is Newton's Third Law of Motion?", a: "For every action there is an equal and opposite reaction" },
    { q: "What is the formula for speed?", a: "Speed = Distance ÷ Time" },
    { q: "What is kinetic energy?", a: "Energy of motion (KE = ½mv²)" },
    { q: "What is potential energy?", a: "Stored energy due to position (PE = mgh)" },
    { q: "What is the law of conservation of energy?", a: "Energy cannot be created or destroyed, only transformed from one form to another" },
    { q: "What is gravity?", a: "The force of attraction between masses" },
    { q: "What is friction?", a: "A force that opposes motion between surfaces in contact" },
    { q: "What is the unit of force?", a: "Newton (N)" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateChemistryProblems(count: number): Problem[] {
  const items = [
    { q: "What is an atom?", a: "The smallest unit of an element that retains its chemical properties" },
    { q: "What are the three subatomic particles?", a: "Protons, neutrons, and electrons" },
    { q: "What is the atomic number?", a: "The number of protons in an atom" },
    { q: "What is an ionic bond?", a: "A bond formed by the transfer of electrons between atoms" },
    { q: "What is a covalent bond?", a: "A bond formed by the sharing of electrons between atoms" },
    { q: "What is the pH scale?", a: "A scale from 0-14 measuring acidity (0-6 acidic, 7 neutral, 8-14 alkaline/basic)" },
    { q: "What is an exothermic reaction?", a: "A chemical reaction that releases energy (heat)" },
    { q: "What is an endothermic reaction?", a: "A chemical reaction that absorbs energy (heat)" },
    { q: "What is the periodic table?", a: "A table organizing all known elements by atomic number and properties" },
    { q: "What is a catalyst?", a: "A substance that speeds up a chemical reaction without being consumed" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deduplicateProblems(problems: Problem[]): Problem[] {
  const seen = new Set<string>();
  return problems.filter((p) => {
    if (seen.has(p.question)) return false;
    seen.add(p.question);
    return true;
  });
}
