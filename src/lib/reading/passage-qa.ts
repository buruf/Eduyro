// src/lib/reading/passage-qa.ts
// THE TRACK B GATE. Track A was only safe to draft with an LLM because
// decodability.ts could mechanically reject bad text — and it did, catching
// errors in drafts and two bugs in itself. This is the equivalent for passages.
//
// Build order matters: this exists BEFORE any Track B content is written.
// Drafting 197 units against a gate that doesn't exist is how the current
// situation (one 79-word bee passage serving Grades 3 through 10) arose.
//
// What it CANNOT check is documented at the bottom — the gate makes drafting
// safe, not good.

import {
  BANDS, CORE_SKILLS, contentWords, fleschKincaidGrade, hardWordPct, words,
  type Passage,
} from "./passages";

export interface QaFailure { check: string; detail: string; }

/** 1–2: the passage sits in the band it claims. */
function checkBandFit(p: Passage): QaFailure[] {
  const spec = BANDS[p.band];
  const out: QaFailure[] = [];
  if (!spec) return [{ check: "band", detail: `unknown band "${p.band}"` }];

  const n = words(p.text).length;
  if (n < spec.words[0] || n > spec.words[1]) {
    out.push({ check: "length-band", detail: `${n} words, band ${p.band} wants ${spec.words[0]}–${spec.words[1]}` });
  }
  const fk = fleschKincaidGrade(p.text);
  if (fk < spec.fkGrade[0] || fk > spec.fkGrade[1]) {
    out.push({ check: "readability-band", detail: `FK grade ${fk}, band ${p.band} wants ${spec.fkGrade[0]}–${spec.fkGrade[1]}` });
  }
  const hard = hardWordPct(p.text);
  if (hard > spec.maxHardWordPct) {
    out.push({ check: "vocab-load", detail: `${hard}% 3+-syllable words, max ${spec.maxHardWordPct}%` });
  }
  const [lo, hi] = spec.items;
  if (p.items.length < lo || p.items.length > hi) {
    out.push({ check: "item-count", detail: `${p.items.length} items, band wants ${lo}–${hi} (never 24)` });
  }
  return out;
}

/** Normalised for verbatim comparison — quotes/dashes/whitespace only. */
const norm = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
   .replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();

/** 3–5: every item is actually grounded in the text. THE load-bearing checks. */
function checkGrounding(p: Passage): QaFailure[] {
  const out: QaFailure[] = [];
  const hay = norm(p.text);
  const passageWords = new Set(contentWords(p.text));

  p.items.forEach((it, i) => {
    const where = `item ${i + 1} ("${it.prompt.slice(0, 44)}…")`;

    // 3. Evidence must be quoted verbatim. This is the practical test for
    //    passage-independence: an author who must quote the proving sentence
    //    cannot write a general-knowledge question.
    if (!it.evidence?.trim()) {
      out.push({ check: "evidence-missing", detail: `${where} has no evidence span` });
    } else if (!hay.includes(norm(it.evidence))) {
      out.push({ check: "evidence-not-verbatim", detail: `${where} evidence not found in passage: "${it.evidence.slice(0, 50)}…"` });
    }

    const answer = it.options[it.correctIndex];
    if (answer === undefined) {
      out.push({ check: "answer-index", detail: `${where} correctIndex ${it.correctIndex} out of range` });
      return;
    }

    // 4. The answer must be supported by the evidence span, not just plausible.
    //    (Vocab items are exempt: the answer is a definition, by design not in
    //    the text — that IS the question.)
    if (it.skill !== "vocab" && it.evidence) {
      const ev = new Set(contentWords(it.evidence));
      const ans = contentWords(answer);
      if (ans.length && !ans.some((w) => ev.has(w))) {
        out.push({ check: "answer-not-grounded", detail: `${where} answer "${answer}" shares no content word with its evidence` });
      }
    }

    // 5. Distractors must be near-misses drawn from the passage. Random
    //    distractors are eliminable without reading a word.
    it.options.forEach((o, oi) => {
      if (oi === it.correctIndex) return;
      // Vocabulary items are exempt: the options are MEANINGS, which legitimately
      // come from outside the text — requiring them to reuse passage words would
      // force nonsense definitions.
      if (it.skill === "vocab") return;
      const cw = contentWords(o);
      if (cw.length && !cw.some((w) => passageWords.has(w))) {
        out.push({ check: "distractor-ungrounded", detail: `${where} distractor "${o}" uses no word from the passage` });
      }
    });
  });
  return out;
}

/** 6: format tells that let a test-wise child skip the passage. */
function checkFormat(p: Passage): QaFailure[] {
  const out: QaFailure[] = [];
  const positions: number[] = [];

  p.items.forEach((it, i) => {
    const where = `item ${i + 1}`;
    if (new Set(it.options).size !== it.options.length) {
      out.push({ check: "duplicate-options", detail: `${where} has duplicate options` });
    }
    if (it.options.some((o) => /\b(all|none) of the above\b/i.test(o))) {
      out.push({ check: "all-none-of-above", detail: `${where} uses all/none of the above` });
    }
    const lens = it.options.map((o) => o.length);
    const answerLen = it.options[it.correctIndex]?.length ?? 0;
    if (it.options.length > 1 && answerLen === Math.max(...lens) && answerLen > Math.min(...lens) * 1.6) {
      out.push({ check: "longest-answer-tell", detail: `${where} correct answer is the longest option by >60%` });
    }
    if (Math.max(...lens) > Math.min(...lens) * 2.5) {
      out.push({ check: "option-length-spread", detail: `${where} option lengths vary by >2.5x` });
    }
    positions.push(it.correctIndex);
  });

  // Auto-generated sets drift to one position; a child who notices stops reading.
  if (p.items.length >= 6) {
    const counts = positions.reduce<Record<number, number>>((a, i) => ({ ...a, [i]: (a[i] ?? 0) + 1 }), {});
    const worst = Math.max(...Object.values(counts));
    if (worst > Math.ceil(p.items.length * 0.5)) {
      out.push({ check: "answer-position-bias", detail: `${worst}/${p.items.length} answers share one position` });
    }
  }
  return out;
}

/** 7: a sheet of pure literal recall is not comprehension practice. */
function checkSkillMix(p: Passage): QaFailure[] {
  const present = new Set(p.items.map((i) => i.skill));
  const missing = CORE_SKILLS.filter((s) => !present.has(s));
  return missing.length
    ? [{ check: "skill-mix", detail: `no ${missing.join("/")} item — every sheet needs at least one of each` }]
    : [];
}

export function checkPassage(p: Passage): QaFailure[] {
  return [...checkBandFit(p), ...checkGrounding(p), ...checkFormat(p), ...checkSkillMix(p)];
}

/** 8: bank-wide integrity — the rule that kills the bee-passage bug for good. */
export function checkBank(bank: Passage[]): QaFailure[] {
  const out: QaFailure[] = [];
  const byId = new Map<string, number>();
  const byText = new Map<string, string[]>();

  for (const p of bank) {
    byId.set(p.id, (byId.get(p.id) ?? 0) + 1);
    const key = norm(p.text).slice(0, 120);
    byText.set(key, [...(byText.get(key) ?? []), `${p.id}(${p.band})`]);
  }
  for (const [id, n] of byId) {
    if (n > 1) out.push({ check: "duplicate-id", detail: `passage id "${id}" used ${n} times` });
  }
  for (const [, ids] of byText) {
    if (ids.length > 1) {
      out.push({
        check: "passage-reused-across-bands",
        detail: `same text served as ${ids.join(", ")} — a passage belongs to exactly ONE band ` +
                `(this is the check that would have caught one 79-word passage serving Grades 3–10)`,
      });
    }
  }
  // Informational balance matters from G6 up (knowledge-building > strategy drill).
  for (const band of ["g6-8", "g9-10"] as const) {
    const inBand = bank.filter((p) => p.band === band);
    if (inBand.length >= 4) {
      const info = inBand.filter((p) => p.genre === "informational").length;
      if (info / inBand.length < 0.5) {
        out.push({ check: "informational-balance", detail: `${band}: ${Math.round((info / inBand.length) * 100)}% informational, want >=50%` });
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// WHAT THIS GATE CANNOT SEE — needs a ~10% human sample per band:
//   • whether an item tagged "inference" truly requires inference, or is recall
//     wearing the label;
//   • whether the keyed answer is genuinely better than a defensible second
//     choice (the single most common flaw in generated comprehension items);
//   • whether the passage is worth fifteen minutes of a child's attention.
// Do not read a green audit as "the content is good". It means the content is
// the right size, the right difficulty, and honestly grounded in its text.
// ─────────────────────────────────────────────────────────────────────────────
