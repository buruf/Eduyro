// src/lib/reading/decodability.ts
// MACHINE QA for Track A text.
//
// Track A content is LLM-drafted. Drafted text that CLAIMS to be decodable is
// worthless — the whole point of a decodable text is that a child can sound out
// (almost) every word using only the letter-sound patterns they have actually
// been taught. So every drafted text is scored here before it is allowed into
// the product, and the audit gate fails the build if it isn't.
//
// How a word is judged decodable at a stage:
//   1. It's an allowed irregular "heart word" for that stage  → decodable
//      (capped separately — see decodabilityReport.heartWordPct)
//   2. It can be fully segmented into graphemes from the cumulative inventory
//      AND contains a vowel sound                             → decodable
//   3. Otherwise                                              → NOT decodable
//
// Segmentation is greedy longest-match, which is how a beginning reader is
// taught to chunk ("look for the team first"). Split digraphs (magic e) are
// handled as a pattern because the vowel and the e are not adjacent.

import {
  cumulativeGraphemes, cumulativeHeartWords, getStage, type StageId,
} from "./phonics";

export interface WordVerdict {
  word: string;
  decodable: boolean;
  reason: "heart-word" | "segmented" | "no-vowel" | "unknown-grapheme";
  /** Grapheme split when segmentation succeeded, e.g. ["sh","i","p"]. */
  graphemes?: string[];
}

export interface DecodabilityReport {
  stage: StageId;
  totalWords: number;
  decodableWords: number;
  /** % of running words a child could sound out. The headline number. */
  decodablePct: number;
  /** % of running words that are memorised heart words (should stay low). */
  heartWordPct: number;
  /** Distinct words that failed, for the author to fix. */
  offenders: string[];
  verdicts: WordVerdict[];
}

const VOWEL_LETTERS = new Set(["a", "e", "i", "o", "u"]);

// Letter pairs that are ALWAYS one sound in English. If a word contains one,
// the child must have been taught it as a unit — splitting "sh" into s+h gives
// the wrong pronunciation, so a segmentation that does that is not a real
// decoding. (This is what makes single-letter fallback segmentation unsafe:
// without this rule, "thought" "decodes" as t-h-o-u-g-h-t.)
const FORCED_UNITS = ["sh", "ch", "th", "ck", "ng", "ph", "gh", "wh", "qu"];

/** Maximal runs of adjacent vowel letters (a trailing y counts, as in "boy"). */
function vowelClusters(word: string): string[] {
  const out: string[] = [];
  let run = "";
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const isVowel = VOWEL_LETTERS.has(ch) || (ch === "y" && run.length > 0);
    if (isVowel) run += ch;
    else { if (run.length >= 2) out.push(run); run = ""; }
  }
  if (run.length >= 2) out.push(run);
  return out;
}

/**
 * A segmentation is only a REAL decoding if every multi-letter sound in the
 * word was decoded as a unit. Three checks, each a genuine failure mode:
 *   • vowel teams  — "rain" must use "ai", not a+i
 *   • r-controlled — "car" must use "ar", not a+r
 *   • fixed digraphs — "ship" must use "sh", not s+h
 */
function segmentationIsHonest(word: string, graphemes: string[]): boolean {
  // A multi-letter sound counts as decoded as a unit if it IS one of the
  // segmented graphemes, or sits INSIDE one — "gh" inside the taught "igh" is a
  // correct decoding of "bright", not a split.
  const coveredBy = (part: string) => graphemes.some((g) => g.includes(part));

  for (const cluster of vowelClusters(word)) {
    // The whole cluster must be one taught grapheme (e.g. "ai"; "eau" never is).
    if (!coveredBy(cluster)) return false;
  }
  for (let i = 0; i < word.length - 1; i++) {
    const pair = word.slice(i, i + 2);
    if (VOWEL_LETTERS.has(word[i]) && word[i + 1] === "r" && !coveredBy(pair)) {
      return false;                           // r-controlled not taught yet
    }
    if (FORCED_UNITS.includes(pair) && !coveredBy(pair)) return false;
  }
  return true;
}

/** Words are compared lowercase, apostrophes kept, other punctuation stripped. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z' \n\t-]/g, " ")
    .split(/[\s-]+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

/**
 * Try to split a word into graphemes from `inventory`, longest match first.
 * Returns null when some part of the word isn't a taught grapheme.
 */
function segment(word: string, inventory: Set<string>, maxLen: number): string[] | null {
  const out: string[] = [];
  let i = 0;
  while (i < word.length) {
    let matched = "";
    for (let len = Math.min(maxLen, word.length - i); len >= 1; len--) {
      const chunk = word.slice(i, i + len);
      if (inventory.has(chunk)) { matched = chunk; break; }
    }
    if (!matched) return null;
    out.push(matched);
    i += matched.length;
  }
  return out;
}

/**
 * Magic-e (split digraph): a silent final e making the previous vowel long,
 * e.g. c-a-k-e. We rewrite "cake" → "c" + "a_e" + "k" so the pattern can be
 * checked against the inventory like any other grapheme.
 */
function trySplitDigraph(
  word: string, inventory: Set<string>, maxLen: number,
): string[] | null {
  if (word.length < 3 || !word.endsWith("e")) return null;
  const body = word.slice(0, -1);
  // Find the LAST single vowel letter in the body — that's the one e affects.
  let vIdx = -1;
  for (let i = body.length - 1; i >= 0; i--) {
    if (VOWEL_LETTERS.has(body[i])) { vIdx = i; break; }
  }
  if (vIdx < 0) return null;
  const pattern = `${body[vIdx]}_e`;
  if (!inventory.has(pattern)) return null;
  // Everything before the vowel, and everything after it, must still segment.
  const head = body.slice(0, vIdx);
  const tail = body.slice(vIdx + 1);
  if (!tail) return null; // needs a consonant between vowel and e ("ae" isn't VCe)
  const headSeg = head ? segment(head, inventory, maxLen) : [];
  const tailSeg = segment(tail, inventory, maxLen);
  if (!headSeg || !tailSeg) return null;
  return [...headSeg, pattern, ...tailSeg];
}

function hasVowelSound(graphemes: string[]): boolean {
  return graphemes.some(
    (g) => g.includes("_e") || [...g].some((ch) => VOWEL_LETTERS.has(ch)) || g === "y",
  );
}

export function judgeWord(word: string, stage: StageId): WordVerdict {
  const hearts = new Set(cumulativeHeartWords(stage));
  if (hearts.has(word)) return { word, decodable: true, reason: "heart-word" };

  const inventory = new Set(cumulativeGraphemes(stage));
  const maxLen = Math.max(1, ...[...inventory].map((g) => g.length));

  const vce = trySplitDigraph(word, inventory, maxLen);
  if (vce && hasVowelSound(vce)) {
    // For VCe the silent e is consumed by the pattern, so honesty-check the body.
    const body = word.slice(0, -1);
    if (segmentationIsHonest(body, vce)) {
      return { word, decodable: true, reason: "segmented", graphemes: vce };
    }
  }

  // A word ending in a silent e that ISN'T a taught magic-e pattern cannot be
  // sounded out yet ("cake" before magic e is taught).
  if (word.length >= 3 && word.endsWith("e") && !VOWEL_LETTERS.has(word[word.length - 2])) {
    return { word, decodable: false, reason: "unknown-grapheme" };
  }

  const seg = segment(word, inventory, maxLen);
  if (!seg) return { word, decodable: false, reason: "unknown-grapheme" };
  if (!hasVowelSound(seg)) return { word, decodable: false, reason: "no-vowel", graphemes: seg };
  if (!segmentationIsHonest(word, seg)) return { word, decodable: false, reason: "unknown-grapheme", graphemes: seg };
  return { word, decodable: true, reason: "segmented", graphemes: seg };
}

export function decodabilityReport(text: string, stage: StageId): DecodabilityReport {
  const words = tokenize(text);
  const verdicts = words.map((w) => judgeWord(w, stage));
  const decodableWords = verdicts.filter((v) => v.decodable).length;
  const heartCount = verdicts.filter((v) => v.reason === "heart-word").length;
  const offenders = [...new Set(verdicts.filter((v) => !v.decodable).map((v) => v.word))];
  return {
    stage,
    totalWords: words.length,
    decodableWords,
    decodablePct: words.length ? Math.round((decodableWords / words.length) * 1000) / 10 : 0,
    heartWordPct: words.length ? Math.round((heartCount / words.length) * 1000) / 10 : 0,
    offenders,
    verdicts,
  };
}

/** The gate Track A content must pass. */
export const DECODABLE_MIN_PCT = 80;
// Memorised words shouldn't CARRY the text — but at the earliest stages the
// unavoidable function words ("the", "a", "is") are themselves irregular, so a
// perfectly good stage-1 text like "The cat sat on a mat" already runs ~35%.
// Set above that: this cap exists to catch text propped up on memorised words,
// not to make stage-1 text impossible. Tune down as stages advance if needed.
export const HEART_WORD_MAX_PCT = 40;

export function passesDecodabilityGate(text: string, stage: StageId): {
  ok: boolean; report: DecodabilityReport; failures: string[];
} {
  const report = decodabilityReport(text, stage);
  const failures: string[] = [];
  if (report.decodablePct < DECODABLE_MIN_PCT) {
    failures.push(
      `only ${report.decodablePct}% decodable at stage "${getStage(stage)?.label ?? stage}" ` +
      `(need ${DECODABLE_MIN_PCT}%) — fix: ${report.offenders.slice(0, 8).join(", ")}`,
    );
  }
  if (report.heartWordPct > HEART_WORD_MAX_PCT) {
    failures.push(`${report.heartWordPct}% heart words (max ${HEART_WORD_MAX_PCT}%)`);
  }
  return { ok: failures.length === 0, report, failures };
}
