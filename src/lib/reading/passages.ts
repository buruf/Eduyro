// src/lib/reading/passages.ts
// TRACK B (R11–R60, Grades 2–10) — the passage model and grade-band contract.
//
// The defect this replaces: 197 units spanning Grades 2–10 were served from ~12
// passages of 54–81 words. R14 (G3), R31 (G6), R45 (G8) and R58 (G10) all got
// the same 79-word passage about bees. A Grade 10 rhetoric unit was reading
// Grade 3 text.
//
// Two rules make that impossible from here on:
//   1. Every passage declares a BAND, and a passage may only be served to units
//      in that band (enforced by scripts/audit-passages.ts + the serve path).
//   2. Every question carries an `evidence` span that must appear VERBATIM in
//      its passage. An author forced to quote the proving sentence cannot write
//      a question answerable from general knowledge — which is the practical
//      test for passage-independence, the main quality failure of generated
//      comprehension items.
//
// Content itself lands in phases B1–B4. This module is the contract.

export type BandId = "g2-3" | "g4-5" | "g6-8" | "g9-10";

export type PassageSkill =
  | "literal" | "mainidea" | "inference" | "vocab" | "sequence"
  | "cause-effect" | "purpose" | "tone" | "structure" | "figurative"
  | "evidence" | "compare" | "synthesis";

/** Skills every sheet must include at least one of — see BAND.requiredSkills. */
export const CORE_SKILLS: PassageSkill[] = ["inference", "vocab", "evidence"];

export interface PassageItem {
  prompt: string;
  options: string[];
  correctIndex: number;
  skill: PassageSkill;
  /**
   * The sentence (or clause) in the passage that PROVES the answer, quoted
   * character-for-character. Required — the audit rejects any item whose
   * evidence is not found verbatim in the passage text.
   */
  evidence: string;
}

export interface Passage {
  id: string;
  band: BandId;
  title: string;
  /** "informational" must be >=50% of the bank by G6-8 (see BANDS). */
  genre: "literary" | "informational";
  text: string;
  items: PassageItem[];
  /** Optional partner passage id — paired texts begin at G8. */
  pairedWith?: string;
}

export interface BandSpec {
  id: BandId;
  label: string;
  grades: [number, number];
  /** Inclusive word-count range for a passage in this band. */
  words: [number, number];
  /** Acceptable Flesch–Kincaid grade range. */
  fkGrade: [number, number];
  /** Max share of words with 3+ syllables (a Dale–Chall-style load proxy). */
  maxHardWordPct: number;
  /** Questions per sheet — deliberately 6–12, never 24. */
  items: [number, number];
}

export const BANDS: Record<BandId, BandSpec> = {
  "g2-3":  { id: "g2-3",  label: "Grades 2–3",  grades: [2, 3],   words: [200, 350],   fkGrade: [1.5, 4],   maxHardWordPct: 8,  items: [6, 8] },
  "g4-5":  { id: "g4-5",  label: "Grades 4–5",  grades: [4, 5],   words: [350, 500],   fkGrade: [3.5, 6],   maxHardWordPct: 12, items: [8, 10] },
  "g6-8":  { id: "g6-8",  label: "Grades 6–8",  grades: [6, 8],   words: [600, 900],   fkGrade: [5.5, 9],   maxHardWordPct: 18, items: [8, 12] },
  "g9-10": { id: "g9-10", label: "Grades 9–10", grades: [9, 10],  words: [900, 1400],  fkGrade: [8.5, 12.5], maxHardWordPct: 24, items: [8, 12] },
};

/**
 * Track B starts at Grade 2. Grade 1 belongs to TRACK A (decodable text and
 * word work) — a Grade 1 child cannot read a 220-word passage, and serving one
 * teaches guessing. Returns null for Grade 1 so the caller falls back.
 */
export function bandForGrade(grade: number): BandId | null {
  if (grade < 2) return null;
  if (grade <= 3) return "g2-3";
  if (grade <= 5) return "g4-5";
  if (grade <= 8) return "g6-8";
  return "g9-10";
}

// ─────────────────────────────────────────────────────────────────────────────
// The registry. Track B content (phases B1–B4) lands here, one file per band.
// Empty is a valid state: with no passages registered, Track B units keep their
// current content and the audit trivially passes.
// ─────────────────────────────────────────────────────────────────────────────
import { PASSAGES_G2_3 } from "./passages-g2-3";

export const PASSAGES: Passage[] = [...PASSAGES_G2_3];

export function passagesForBand(band: BandId): Passage[] {
  return PASSAGES.filter((p) => p.band === band);
}

/**
 * Passages a unit may be served, keyed by the unit's skill. A unit only ever
 * sees passages from its OWN band — this is the rule that makes the
 * "Grade 10 gets the Grade 3 bee passage" bug structurally impossible.
 */
export function passagesForUnit(grade: number, skill?: PassageSkill): Passage[] {
  const band = bandForGrade(grade);
  if (!band) return [];               // Grade 1 → Track A owns it
  const inBand = passagesForBand(band);
  if (!skill) return inBand;
  const matching = inBand.filter((p) => p.items.some((i) => i.skill === skill));
  return matching.length ? matching : inBand;
}

// ─────────────────────────────────────────────────────────────────────────────
// Readability — Flesch–Kincaid grade level.
// Syllable counting in English is approximate by nature; this is the standard
// vowel-group heuristic and is accurate enough to catch a passage sitting in
// the wrong BAND, which is all the audit needs it for.
// ─────────────────────────────────────────────────────────────────────────────
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function sentences(text: string): string[] {
  return text.split(/[.!?]+(?:\s|$)/).map((s) => s.trim()).filter(Boolean);
}

export function words(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z'\s-]/g, " ").split(/[\s-]+/).filter(Boolean);
}

/** Flesch–Kincaid grade level: 0.39·(w/s) + 11.8·(syl/w) − 15.59 */
export function fleschKincaidGrade(text: string): number {
  const ws = words(text), ss = sentences(text);
  if (!ws.length || !ss.length) return 0;
  const syl = ws.reduce((a, w) => a + countSyllables(w), 0);
  return Math.round((0.39 * (ws.length / ss.length) + 11.8 * (syl / ws.length) - 15.59) * 10) / 10;
}

/** Share of words with 3+ syllables — a proxy for vocabulary load. */
export function hardWordPct(text: string): number {
  const ws = words(text);
  if (!ws.length) return 0;
  const hard = ws.filter((w) => countSyllables(w) >= 3).length;
  return Math.round((hard / ws.length) * 1000) / 10;
}

// Function words carry no topic content — excluded when checking that an answer
// or distractor is actually grounded in the passage.
const FUNCTION_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "of", "to", "in", "on", "at", "by",
  "for", "with", "from", "as", "is", "are", "was", "were", "be", "been", "being",
  "it", "its", "he", "she", "they", "them", "his", "her", "their", "this", "that",
  "these", "those", "there", "here", "what", "which", "who", "whom", "when",
  "where", "why", "how", "not", "no", "do", "does", "did", "has", "have", "had",
  "will", "would", "can", "could", "should", "may", "might", "must", "than",
  "then", "so", "up", "out", "about", "into", "over", "after", "before", "all",
  "some", "any", "more", "most", "one", "two", "you", "your", "we", "our", "i",
]);

export function contentWords(text: string): string[] {
  return words(text).filter((w) => w.length >= 3 && !FUNCTION_WORDS.has(w));
}
