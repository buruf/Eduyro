// src/lib/reading/sight-words.ts
// The high-frequency ("sight") word lists for R2, in Fry order.
//
// Why this file exists: R2 asked children to identify sight words without ever
// SHOWING them the words. Sight words are not decoded — they are recognised on
// sight, which means the child must first see them, read them, and meet them in
// a sentence. Testing recognition before teaching is a guessing exercise.
//
// These 100 words are roughly half of all text a child will ever read, which is
// why they earn dedicated study time.

export const FRY_1_50 = [
  "the", "of", "and", "a", "to", "in", "is", "you", "that", "it",
  "he", "was", "for", "on", "are", "as", "with", "his", "they", "I",
  "at", "be", "this", "have", "from", "or", "one", "had", "by", "word",
  "but", "not", "what", "all", "were", "we", "when", "your", "can", "said",
  "there", "use", "an", "each", "which", "she", "do", "how", "their", "if",
];

export const FRY_51_100 = [
  "will", "up", "other", "about", "out", "many", "then", "them", "these", "so",
  "some", "her", "would", "make", "like", "him", "into", "time", "has", "look",
  "two", "more", "write", "go", "see", "number", "no", "way", "could", "people",
  "my", "than", "first", "water", "been", "call", "who", "now", "find", "long",
  "down", "day", "did", "get", "come", "made", "may", "part", "over", "new",
];

/** Words that genuinely break the code and must be learned by heart. */
export const TRICKY_WORDS = [
  "said", "was", "one", "two", "who", "there", "their", "where", "come", "some",
  "friend", "because", "people", "water", "many", "any", "again", "once", "eye", "busy",
];

/** The word list a given R2 unit is teaching, or null if it isn't a list unit. */
export function sightWordsForUnit(unitLabel: string): { title: string; words: string[] } | null {
  const u = unitLabel.toLowerCase();
  if (/first 50|first fifty/.test(u)) return { title: "Your first 50 words", words: FRY_1_50 };
  if (/next 50|next fifty/.test(u)) return { title: "Your next 50 words", words: FRY_51_100 };
  if (/tricky/.test(u)) return { title: "Tricky words to learn by heart", words: TRICKY_WORDS };
  // "Sight Words in Sentences" practises the first 100 in context.
  if (/sight word/.test(u)) return { title: "Words to know on sight", words: [...FRY_1_50, ...FRY_51_100] };
  return null;
}

/** A study card is capped so a child sees a learnable chunk, not a wall. */
export const STUDY_CHUNK = 25;

/**
 * Near-miss misspellings of a sight word — letter-order and letter-count errors
 * are exactly the confusions a beginning reader makes, so they are honest
 * distractors rather than random noise.
 */
function nearMisses(word: string): string[] {
  const out = new Set<string>();
  if (word.length >= 3) {
    // swap the middle two letters ("the" → "teh")
    const i = Math.floor((word.length - 1) / 2);
    out.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
    // drop a middle letter ("said" → "sad")
    out.add(word.slice(0, i) + word.slice(i + 1));
    // double a letter ("all" → "alll")
    out.add(word.slice(0, i + 1) + word[i] + word.slice(i + 1));
    // reverse the first two ("you" → "oyu")
    out.add(word[1] + word[0] + word.slice(2));
  }
  return [...out].filter((w) => w !== word && w.length > 1);
}

/**
 * Practice items generated FROM the chunk just taught. The sweep
 * (audit-sheet-self-containment) found the old fixed bank asking for words the
 * sheet had never shown — e.g. a sheet teaching words 1–25 asking for "friend".
 * Generating from the chunk makes that structurally impossible.
 */
export function sightWordItems(chunk: string[]): { q: string; a: string; opts: string[] }[] {
  const items: { q: string; a: string; opts: string[] }[] = [];
  for (const w of chunk) {
    const misses = nearMisses(w);
    if (misses.length < 3) continue;      // 2-letter words can't make 3 fair distractors
    const display = w === "I" ? "I" : w;
    items.push({
      q: `Which word is "${display}"?`,
      a: display,
      opts: [display, ...misses.slice(0, 3)],
    });
  }
  return items;
}
