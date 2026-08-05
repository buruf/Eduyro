// scripts/test-passage-qa.ts
// Proves the Track B gate WORKS — in both directions:
//   • a well-formed passage passes cleanly, and
//   • each individual check actually FIRES on a violating fixture.
// The second half matters more. An audit that can never fail is worse than no
// audit, because it manufactures confidence.
import { checkPassage, checkBank } from "../src/lib/reading/passage-qa";
import { fleschKincaidGrade, hardWordPct, words, type Passage } from "../src/lib/reading/passages";

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  if (cond) pass++; else { fail++; console.log(`  ✗ ${name}${extra ? `\n      ${extra}` : ""}`); }
};
/** Asserts that a mutated copy of the good passage trips exactly `check`. */
const fires = (name: string, mutate: (p: Passage) => Passage, check: string) => {
  const failures = checkPassage(mutate(structuredClone(GOOD)));
  ok(`fires: ${name}`, failures.some((f) => f.check === check),
    `expected "${check}", got [${failures.map((f) => f.check).join(", ") || "none"}]`);
};

// A real Grade 2–3 fixture — also proof the band spec is satisfiable.
const GOOD: Passage = {
  id: "t-ant", band: "g2-3", genre: "literary", title: "The Ant and the Crumb",
  text: `Ana sat on the grass and ate a bit of bread, and a crumb fell to the ground.

A small black ant found the crumb near her feet. The ant was tiny, but the crumb was big. It was ten times the size of the ant.

The ant tried to lift the crumb, but it could not, and the crumb did not move at all.

The ant did not give up, and it ran back to its nest under a flat grey rock. Then it told the other ants about the crumb.

Soon a long line of ants came out of the nest. There were more than twenty of them, and they marched to the crumb in one row.

Together the ants pushed. The crumb began to slide across the dirt. Bit by bit, the ants pushed it up a small hill. Then they pushed it down into the nest.

Ana watched the ants the whole time, and she was amazed. One ant could do nothing on its own. Many ants could move a crumb ten times their size.

Ana thought about her class at school. Last week her class had cleaned the whole school yard. One child could not have done that job alone, but thirty children had done it in an hour.

Ana smiled at the busy line of ants, and she thought that ants and children were not so different after all.`,
  items: [
    { prompt: "Where was the ant's nest?", skill: "literal", correctIndex: 1,
      options: ["In the grass", "Under a rock", "Up a small hill", "In the bread"],
      evidence: "its nest under a flat grey rock" },
    { prompt: "What did the ant do after it could not lift the crumb?", skill: "sequence", correctIndex: 0,
      options: ["It ran back to its nest", "It pushed the crumb up", "It moved across the dirt", "It sat on the grass"],
      evidence: "It ran back to its nest" },
    { prompt: "Why did the ant go back to the nest?", skill: "inference", correctIndex: 2,
      options: ["To hide from Ana", "To eat the bread", "To tell the other ants", "To rest under the rock"],
      evidence: "told the other ants about the crumb" },
    { prompt: "In this text, what does \"amazed\" mean?", skill: "vocab", correctIndex: 3,
      options: ["A little angry", "Very tired", "Not certain", "Very surprised"],
      evidence: "she was amazed" },
    { prompt: "What is this text mostly about?", skill: "mainidea", correctIndex: 0,
      options: ["Many ants can move a big crumb", "How ants dig a deep nest", "What Ana ate for her lunch", "Why one crumb is so heavy"],
      evidence: "Many ants could move a crumb ten times their size." },
    { prompt: "Which sentence best shows the ants working as one group?", skill: "evidence", correctIndex: 1,
      options: ["The ant was tiny, but the crumb was big.", "Together the ants pushed.", "Ana sat on the grass and ate a bit of bread.", "It ran back to its nest under a flat grey rock."],
      evidence: "Together the ants pushed." },
  ],
};

console.log("\n── the fixture itself ──");
const f = checkPassage(GOOD);
ok("well-formed passage passes", f.length === 0, f.map((x) => `${x.check}: ${x.detail}`).join("\n      "));
console.log(`      ${words(GOOD.text).length} words · FK ${fleschKincaidGrade(GOOD.text)} · ${hardWordPct(GOOD.text)}% hard words · ${GOOD.items.length} items`);

console.log("\n── each check must fire on a violation ──");
fires("passage too short for its band", (p) => ({ ...p, text: "A short text. It ends." }), "length-band");
fires("passage too hard for its band", (p) => ({ ...p, band: "g2-3", text: p.text + " " + "Subsequently the extraordinarily industrious invertebrates demonstrated remarkable collaborative determination throughout numerous consecutive expeditions.".repeat(6) }), "readability-band");
fires("24 items", (p) => ({ ...p, items: Array.from({ length: 24 }, () => p.items[0]) }), "item-count");
fires("evidence missing", (p) => { p.items[0].evidence = ""; return p; }, "evidence-missing");
fires("evidence not in passage", (p) => { p.items[0].evidence = "The ant flew to the moon."; return p; }, "evidence-not-verbatim");
fires("answer unsupported by its evidence", (p) => { p.items[0].options[1] = "Beside a river"; return p; }, "answer-not-grounded");
fires("distractor not from the passage", (p) => { p.items[0].options[0] = "Inside a volcano"; return p; }, "distractor-ungrounded");
fires("correctIndex out of range", (p) => { p.items[0].correctIndex = 9; return p; }, "answer-index");
fires("duplicate options", (p) => { p.items[0].options[0] = p.items[0].options[1]; return p; }, "duplicate-options");
fires("all of the above", (p) => { p.items[0].options[0] = "All of the above"; return p; }, "all-none-of-above");
fires("longest option is the answer", (p) => { p.items[0].options[1] = "Under a rock that sits beside the old garden wall"; return p; }, "longest-answer-tell");
fires("answer always in the same position", (p) => { p.items.forEach((i) => { i.correctIndex = 0; }); return p; }, "answer-position-bias");
fires("no inference/vocab/evidence item", (p) => { p.items.forEach((i) => { i.skill = "literal"; }); return p; }, "skill-mix");

console.log("\n── bank-wide integrity ──");
ok("clean bank passes", checkBank([GOOD]).length === 0);
const dupId = checkBank([GOOD, structuredClone(GOOD)]);
ok("duplicate id caught", dupId.some((x) => x.check === "duplicate-id"));
// THE regression test: one passage serving two grade bands.
const crossBand = checkBank([GOOD, { ...structuredClone(GOOD), id: "t-ant-g10", band: "g9-10" }]);
ok("same passage in two bands caught", crossBand.some((x) => x.check === "passage-reused-across-bands"),
  `got [${crossBand.map((x) => x.check).join(", ") || "none"}]`);

console.log(`\n${fail === 0 ? "✅" : "❌"} passage QA: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
