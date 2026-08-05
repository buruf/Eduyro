// scripts/test-decodability.ts
// Tests for the Track A machine-QA checker. The checker GATES all decodable
// content, so if it is wrong, every text it approves is wrong too.
import { judgeWord, decodabilityReport, tokenize } from "../src/lib/reading/decodability";
import type { StageId } from "../src/lib/reading/phonics";

let pass = 0, fail = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log(`  ✗ ${name}\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`); }
};
const word = (w: string, stage: StageId) => judgeWord(w, stage).decodable;

console.log("\n── CVC words at the stage they're taught ──");
check("cat @ cvc-a", word("cat", "cvc-a"), true);
check("map @ cvc-a", word("map", "cvc-a"), true);
// short i is NOT taught at stage 1 — this is the core promise of the checker
check("pig @ cvc-a (i not taught yet)", word("pig", "cvc-a"), false);
check("pig @ cvc-iou", word("pig", "cvc-iou"), true);
check("bed @ cvc-iou (e not taught yet)", word("bed", "cvc-iou"), false);
check("bed @ cvc-e-review", word("bed", "cvc-e-review"), true);

console.log("\n── digraphs ──");
check("ship @ cvc-e-review (sh not taught)", word("ship", "cvc-e-review"), false);
check("ship @ digraphs", word("ship", "digraphs"), true);
check("chin @ digraphs", word("chin", "digraphs"), true);
check("duck @ digraphs", word("duck", "digraphs"), true);
check("sing @ digraphs", word("sing", "digraphs"), true);

console.log("\n── blends (made of already-known single graphemes) ──");
check("stop @ digraphs", word("stop", "digraphs"), true);
check("hand @ digraphs", word("hand", "digraphs"), true);

console.log("\n── magic e (split digraph) ──");
check("cake @ digraphs (vce not taught)", word("cake", "digraphs"), false);
check("cake @ vce", word("cake", "vce"), true);
check("bike @ vce", word("bike", "vce"), true);
check("home @ vce", word("home", "vce"), true);
check("cute @ vce", word("cute", "vce"), true);
check("cake segmentation", judgeWord("cake", "vce").graphemes, ["c", "a_e", "k"]);
// "cat" must NOT be mis-parsed as VCe just because vce is available
check("cat still plain CVC @ vce", judgeWord("cat", "vce").graphemes, ["c", "a", "t"]);

console.log("\n── vowel teams / r-controlled / diphthongs ──");
check("rain @ vce (ai not taught)", word("rain", "vce"), false);
check("rain @ vowel-teams-long", word("rain", "vowel-teams-long"), true);
check("boat @ vowel-teams-long", word("boat", "vowel-teams-long"), true);
check("car @ vowel-teams-long (ar not taught)", word("car", "vowel-teams-long"), false);
check("car @ r-controlled", word("car", "r-controlled"), true);
check("bird @ r-controlled", word("bird", "r-controlled"), true);
check("coin @ r-controlled (oi not taught)", word("coin", "r-controlled"), false);
check("coin @ diphthongs", word("coin", "diphthongs"), true);

console.log("\n── heart words (irregular, allowed once introduced) ──");
check("the @ cvc-a", word("the", "cvc-a"), true);
check("the is flagged as heart-word", judgeWord("the", "cvc-a").reason, "heart-word");
check("said @ cvc-iou (not yet introduced)", word("said", "cvc-iou"), false);
check("said @ cvc-e-review", word("said", "cvc-e-review"), true);

console.log("\n── words a beginner genuinely cannot decode ──");
check("elephant @ cvc-a", word("elephant", "cvc-a"), false);
check("thought @ digraphs", word("thought", "digraphs"), false);
check("beautiful @ vowel-teams-long", word("beautiful", "vowel-teams-long"), false);

console.log("\n── edge cases the honesty-check could break ──");
// e as the VOWEL, not a silent e — the silent-e rejection must not eat these
check("she @ digraphs", word("she", "digraphs"), true);
check("these @ vce", word("these", "vce"), true);
check("these segmentation", judgeWord("these", "vce").graphemes, ["th", "e_e", "s"]);
// blends must still work — they're known letters, no forced units
check("stop @ cvc-iou", word("stop", "cvc-iou"), true);
check("milk @ cvc-iou", word("milk", "cvc-iou"), true);
check("frog @ cvc-iou", word("frog", "cvc-iou"), true);
// ck is a forced unit — not decodable before it's taught
check("duck @ cvc-iou (ck not taught)", word("duck", "cvc-iou"), false);
// vowel+r must not sneak through as two letters
check("her @ cvc-e-review (er not taught)", word("her", "cvc-e-review"), false);
check("her @ r-controlled", word("her", "r-controlled"), true);
// three adjacent vowels are never a taught team
check("beau @ diphthongs", word("beau", "diphthongs"), false);

console.log("\n── a forced digraph INSIDE a longer taught grapheme ──");
// "gh" is a forced unit, but inside the taught "igh" it IS correctly decoded
check("bright @ vowel-teams-long", word("bright", "vowel-teams-long"), true);
check("night @ vowel-teams-long", word("night", "vowel-teams-long"), true);
check("bright segmentation", judgeWord("bright", "vowel-teams-long").graphemes, ["b", "r", "igh", "t"]);
// ...and the loophole must not let genuinely hard words through
check("thought still undecodable @ diphthongs", word("thought", "diphthongs"), false);

console.log("\n── tokenizer ──");
check("punctuation stripped", tokenize("The cat sat. The dog ran!"), ["the", "cat", "sat", "the", "dog", "ran"]);
check("hyphens split", tokenize("a sun-hat"), ["a", "sun", "hat"]);

console.log("\n── whole-text scoring ──");
const good = "The cat sat on a mat. A rat ran at the cat. The cat had a nap.";
const r1 = decodabilityReport(good, "cvc-a");
check("decodable CVC text passes 80%", r1.decodablePct >= 80, true);
console.log(`      "${good}" → ${r1.decodablePct}% decodable, ${r1.heartWordPct}% heart words`);

const bad = "The beautiful elephant thought about the enormous mountain.";
const r2 = decodabilityReport(bad, "cvc-a");
check("undecodable text fails 80%", r2.decodablePct >= 80, false);
console.log(`      "${bad}" → ${r2.decodablePct}% decodable, offenders: ${r2.offenders.join(", ")}`);

console.log(`\n${fail === 0 ? "✅" : "❌"} decodability: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
