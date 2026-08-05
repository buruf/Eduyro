// scripts/audit-word-items.ts
// Machine QA for Track A word-level items. These are generated, so every
// invariant that matters has to be checked mechanically across every stage and
// many seeds — a bad distractor here teaches a child the wrong sound.
import { generateWordItems } from "../src/lib/reading/word-items";
import { STAGES, cumulativeSampleWords } from "../src/lib/reading/phonics";
import { judgeWord } from "../src/lib/reading/decodability";

let fails = 0;
const bad = (msg: string) => { fails++; console.log(`  ✗ ${msg}`); };

// Anything resembling profanity must never reach a six-year-old's worksheet.
// Checked as substrings against every option, real or nonsense.
const BLOCKED = [
  "fuck", "shit", "piss", "cunt", "cock", "dick", "tits", "arse", "ass", "damn",
  "hell", "crap", "bitch", "bastard", "wank", "twat", "slut", "whore", "rape",
  "kill", "die", "dead", "gun", "sex", "nazi", "poo", "wee", "fart", "butt",
];

let totalItems = 0;
for (const st of STAGES) {
  const realWords = new Set(cumulativeSampleWords(st.id));
  let stageItems = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const items = generateWordItems(st.id, 8, seed);
    stageItems += items.length;
    totalItems += items.length;
    for (const it of items) {
      // 1. The answer must be one of the options.
      if (!it.options.includes(it.answer)) bad(`${st.id}: answer "${it.answer}" not in options [${it.options}] — "${it.question}"`);
      // 2. Options must be distinct (a duplicate makes two "right" answers).
      if (new Set(it.options).size !== it.options.length) bad(`${st.id}: duplicate options [${it.options}] — "${it.question}"`);
      // 3. Exactly 4 options.
      if (it.options.length !== 4) bad(`${st.id}: ${it.options.length} options — "${it.question}"`);
      // 4. Every word offered must be decodable at this stage — a child must be
      //    able to read the distractors too, or the item tests luck.
      for (const o of it.options) {
        if (/^\d+$/.test(o)) continue; // sound-counting options are numbers
        if (!judgeWord(o, st.id).decodable) bad(`${st.id}: option "${o}" is NOT decodable at this stage — "${it.question}"`);
      }
      // 5. Nothing profane, in any option or the prompt.
      const hay = `${it.question} ${it.options.join(" ")}`.toLowerCase();
      for (const w of BLOCKED) {
        if (new RegExp(`\\b${w}`).test(hay)) bad(`${st.id}: BLOCKED word "${w}" in "${it.question}" [${it.options}]`);
      }
      // 6. "Which one is a REAL word?" — exactly one option may be a real word.
      if (it.question.includes("REAL word")) {
        const reals = it.options.filter((o) => realWords.has(o));
        if (reals.length !== 1) bad(`${st.id}: "${it.question}" has ${reals.length} real words [${it.options}] (want exactly 1)`);
        if (reals[0] !== it.answer) bad(`${st.id}: real-word answer mismatch [${it.options}] answer=${it.answer}`);
      }
      // 7. Rhyme items: no distractor may also rhyme with the target.
      const rh = it.question.match(/rhymes with "([a-z]+)"/);
      if (rh) {
        const target = rh[1];
        const rime = (w: string) => { const i = w.search(/[aeiou]/); return i < 0 ? w : w.slice(i); };
        const alsoRhyme = it.options.filter((o) => o !== it.answer && rime(o) === rime(target));
        if (alsoRhyme.length) bad(`${st.id}: "${it.question}" — distractor(s) also rhyme: ${alsoRhyme}`);
      }
      // 8. Same-beginning-sound items: no distractor may share the onset.
      const on = it.question.match(/same sound as "([a-z]+)"/);
      if (on) {
        const target = on[1];
        const onset = (w: string) => { const i = w.search(/[aeiou]/); return i <= 0 ? "" : w.slice(0, i); };
        const alsoSame = it.options.filter((o) => o !== it.answer && onset(o) === onset(target));
        if (alsoSame.length) bad(`${st.id}: "${it.question}" — distractor(s) share the onset: ${alsoSame}`);
      }
    }
  }
  if (stageItems === 0) bad(`${st.id}: generated NO items`);
  console.log(`${fails === 0 ? "✓" : " "} ${st.id.padEnd(18)} ${String(stageItems).padStart(3)} items over 12 seeds`);
}

console.log(`\ntotal generated items checked: ${totalItems}`);
console.log(`${fails === 0 ? "✅" : "❌"} word-item failures: ${fails}`);
process.exit(fails ? 1 : 0);
