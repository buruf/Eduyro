// src/lib/reading/phonics.ts
// THE PHONICS SCOPE & SEQUENCE — the spine of Track A (R1–R10, Grades 1–2).
//
// Why this file exists: early reading is NOT a shorter version of comprehension.
// A child who cannot yet decode "ship" learns nothing from a passage about bees;
// worse, giving them text they cannot decode teaches guessing from context and
// pictures (the discredited three-cueing habit). So R1–R10 practice must be
// controlled by an explicit, cumulative phonics sequence, and every text a child
// reads at this stage must be DECODABLE given what they have been taught so far.
//
// This file is the single source of truth for:
//   • the ORDER graphemes are taught in (STAGES, below)
//   • the CUMULATIVE grapheme inventory available at each stage
//   • the irregular high-frequency "heart words" allowed at each stage
//     (words that must be partly memorised because they break the code —
//      "said", "was", "the". They're allowed in decodable text but capped.)
//
// The decodability checker (./decodability.ts) reads this file to score text.
// Nothing here should be duplicated elsewhere — edit here only.

export type StageId =
  | "cvc-a" | "cvc-iou" | "cvc-e-review"
  | "digraphs" | "blends-initial" | "blends-final"
  | "vce" | "vowel-teams-long" | "r-controlled"
  | "diphthongs" | "suffixes";

export interface PhonicsStage {
  id: StageId;
  order: number;          // 1-based teaching order
  label: string;          // child/parent-facing name
  grade: 1 | 2;
  /** Graphemes INTRODUCED at this stage (not cumulative). */
  newGraphemes: string[];
  /** Example words that become decodable at this stage. */
  sampleWords: string[];
  /** Irregular high-frequency words introduced here ("heart words"). */
  newHeartWords: string[];
  /** One-line teaching focus, used by lesson copy. */
  focus: string;
}

// Consonants assumed from letter-sound work (R1) — available from stage 1.
const BASE_CONSONANTS = [
  "b", "c", "d", "f", "g", "h", "j", "k", "l", "m",
  "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z",
];

export const STAGES: PhonicsStage[] = [
  {
    id: "cvc-a", order: 1, label: "Short a words", grade: 1,
    newGraphemes: [...BASE_CONSONANTS, "a"],
    sampleWords: ["cat", "man", "sad", "bag", "tap", "ran", "hat", "map"],
    newHeartWords: ["the", "a", "I", "is"],
    focus: "Blend three sounds: consonant – short a – consonant.",
  },
  {
    id: "cvc-iou", order: 2, label: "Short i, o, u words", grade: 1,
    newGraphemes: ["i", "o", "u"],
    sampleWords: ["pig", "sit", "hot", "dog", "sun", "bug", "mud", "top"],
    newHeartWords: ["to", "of", "was", "you"],
    focus: "The same blending, with three more short vowels.",
  },
  {
    id: "cvc-e-review", order: 3, label: "Short e and mixed review", grade: 1,
    newGraphemes: ["e"],
    sampleWords: ["bed", "pen", "net", "leg", "wet", "hen"],
    newHeartWords: ["said", "are", "he", "she", "we", "be", "me"],
    focus: "All five short vowels, mixed — the child must hear the difference.",
  },
  {
    id: "digraphs", order: 4, label: "Two letters, one sound (sh, ch, th, ck)", grade: 1,
    newGraphemes: ["sh", "ch", "th", "ck", "wh", "ng"],
    sampleWords: ["ship", "chin", "that", "duck", "when", "sing", "shop", "rich"],
    newHeartWords: ["they", "there", "what"],
    focus: "Two letters can team up to make ONE sound.",
  },
  {
    id: "blends-initial", order: 5, label: "Beginning blends (st, bl, gr)", grade: 1,
    newGraphemes: [], // combinations of known single graphemes
    sampleWords: ["stop", "black", "grab", "flag", "swim", "trip", "clap", "frog"],
    newHeartWords: ["from", "have", "come", "some"],
    focus: "Two consonants, two sounds — you still hear both.",
  },
  {
    id: "blends-final", order: 6, label: "Ending blends (-nd, -mp, -st)", grade: 1,
    newGraphemes: [],
    sampleWords: ["hand", "jump", "fast", "milk", "help", "sink", "belt", "nest"],
    newHeartWords: ["do", "does", "were", "one"],
    focus: "Blends at the END of a word.",
  },
  {
    id: "vce", order: 7, label: "Magic e (a_e, i_e, o_e, u_e)", grade: 1,
    // Split digraphs are handled as a PATTERN by the checker, not a plain grapheme.
    newGraphemes: ["a_e", "i_e", "o_e", "u_e", "e_e"],
    sampleWords: ["cake", "bike", "home", "cute", "make", "ride", "note", "these"],
    newHeartWords: ["there", "where", "who"],
    focus: "A silent e at the end makes the vowel say its NAME.",
  },
  {
    id: "vowel-teams-long", order: 8, label: "Vowel teams (ai, ay, ee, ea, oa, ow)", grade: 2,
    newGraphemes: ["ai", "ay", "ee", "ea", "oa", "ow", "oo", "ie", "igh", "ue", "ew"],
    sampleWords: ["rain", "play", "feet", "beach", "boat", "snow", "moon", "night"],
    newHeartWords: ["again", "friend", "because"],
    focus: "Two vowels together often make one long sound.",
  },
  {
    id: "r-controlled", order: 9, label: "Bossy r (ar, or, er, ir, ur)", grade: 2,
    newGraphemes: ["ar", "or", "er", "ir", "ur"],
    sampleWords: ["car", "corn", "her", "bird", "turn", "farm", "storm", "girl"],
    newHeartWords: ["their", "your", "were"],
    focus: "An r after a vowel changes the vowel's sound.",
  },
  {
    id: "diphthongs", order: 10, label: "Sliding sounds (oi, oy, ou, aw)", grade: 2,
    newGraphemes: ["oi", "oy", "ou", "aw", "au", "oul"],
    sampleWords: ["coin", "boy", "cloud", "saw", "join", "town", "paw"],
    newHeartWords: ["could", "would", "should"],
    focus: "Vowel sounds that glide from one sound into another.",
  },
  {
    id: "suffixes", order: 11, label: "Endings (-s, -ing, -ed)", grade: 2,
    newGraphemes: ["s", "ing", "ed", "es", "er", "est", "ly"],
    sampleWords: ["jumps", "running", "played", "boxes", "faster", "quickly"],
    newHeartWords: ["many", "any", "other"],
    focus: "Endings you can add to a word you already know.",
  },
];

const byOrder = [...STAGES].sort((a, b) => a.order - b.order);

export function getStage(id: StageId): PhonicsStage | undefined {
  return STAGES.find((s) => s.id === id);
}

/** Every grapheme available to a child who has been taught THROUGH this stage. */
export function cumulativeGraphemes(id: StageId): string[] {
  const target = getStage(id);
  if (!target) return [];
  const set = new Set<string>();
  for (const s of byOrder) {
    if (s.order > target.order) break;
    for (const g of s.newGraphemes) set.add(g);
  }
  return [...set];
}

/** Every irregular high-frequency word allowed THROUGH this stage. */
export function cumulativeHeartWords(id: StageId): string[] {
  const target = getStage(id);
  if (!target) return [];
  const set = new Set<string>();
  for (const s of byOrder) {
    if (s.order > target.order) break;
    for (const w of s.newHeartWords) set.add(w.toLowerCase());
  }
  return [...set];
}

/** Sample words available through this stage — useful for item generation. */
export function cumulativeSampleWords(id: StageId): string[] {
  const target = getStage(id);
  if (!target) return [];
  const out: string[] = [];
  for (const s of byOrder) {
    if (s.order > target.order) break;
    out.push(...s.sampleWords);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit → stage mapping.
// The curriculum unit names (READING_CURRICULUM) are keyword-rich, so the stage
// a unit practises can be resolved from the label. Anything unmatched returns
// null → the unit is not a Track A phonics unit and keeps its current content.
// ─────────────────────────────────────────────────────────────────────────────
const UNIT_STAGE_RULES: [RegExp, StageId][] = [
  // "Blending" (sounding out) must be matched BEFORE "blends" (consonant
  // clusters) — "Short Vowels & Blending Review" is a short-vowel unit.
  [/short vowel|blending|\bcvc\b/i, "cvc-e-review"],
  [/consonant blend|\bblends\b/i, "blends-initial"],
  [/digraph/i, "digraphs"],
  [/word famil|rhym/i, "cvc-iou"],
  [/silent e|magic e|\bvce\b/i, "vce"],
  [/vowel team|long vowel/i, "vowel-teams-long"],
  [/r.controlled|bossy r/i, "r-controlled"],
  [/diphthong/i, "diphthongs"],
  [/prefix|suffix|word ending/i, "suffixes"],
  [/letter sound|letter recognition|alphabet|print concept/i, "cvc-a"],
];

export function stageForUnit(unitLabel: string): StageId | null {
  for (const [re, id] of UNIT_STAGE_RULES) if (re.test(unitLabel)) return id;
  return null;
}
