// scripts/audit-mc-answerability.ts
// Every multiple-choice item a student can be served must be ANSWERABLE:
// the key has to be one of the options (under the same rules that grade it),
// and exactly one option may grade as correct. A question that fails either
// test cannot be answered correctly no matter what the child knows.
//
// Born from two real defects: a pronoun item whose key ("Relative pronoun")
// wasn't among its options ("Relative"), and capitalization items whose
// four options all graded correct.
import { generateProblems, getMathLevelSkills } from "../src/lib/worksheet/generator";
import { answersMatch } from "../src/lib/grading";

interface Problem {
  question?: string;
  answer?: string;
  options?: string[];
  type?: string;
}

const SUBJECTS: { slug: string; levels: string[] }[] = [
  { slug: "MATH", levels: Array.from({ length: 18 }, (_, i) => `M${i + 1}`) },
  { slug: "READING", levels: Array.from({ length: 60 }, (_, i) => `R${i + 1}`) },
  { slug: "WRITING", levels: Array.from({ length: 12 }, (_, i) => `W${i}`) },
  { slug: "SCIENCE", levels: Array.from({ length: 12 }, (_, i) => `S${i + 1}`) },
];

/** Same test the serving route applies: an answer that is a permutation of all
 *  the options is a drag-to-order item; a proper subset is select-all. */
function isOrderingOrMultiSelect(answer: string, options: string[]): boolean {
  if (options.length < 3 || !answer.includes(",")) return false;
  const ans = answer.split(",").map((s) => s.trim()).sort();
  const opt = options.map((s) => s.trim()).sort();
  const optSet = new Set(opt);
  if (ans.length === opt.length && ans.every((v, i) => v === opt[i])) return true;
  return ans.length < opt.length && ans.every((v) => optSet.has(v));
}

const SHEETS_PER_SKILL = 3;
let checked = 0;
const noKeyInOptions: string[] = [];
const multipleCorrect: string[] = [];
const seen = new Set<string>();

for (const subject of SUBJECTS) {
  for (const levelCode of subject.levels) {
    let skills: { label: string; range: [number, number] }[] = [];
    try {
      skills = getMathLevelSkills(levelCode) as typeof skills;
    } catch {
      skills = [];
    }
    const targets = skills.length ? skills : [{ label: "", range: [1, 100] as [number, number] }];
    for (const skill of targets) {
      for (let i = 0; i < SHEETS_PER_SKILL; i++) {
        const sheetNumber = skill.range[0] + i;
        if (sheetNumber > skill.range[1]) break;
        let problems: Problem[] = [];
        try {
          problems = generateProblems({
            subjectSlug: subject.slug,
            levelCode,
            skillName: skill.label || levelCode,
            problemCount: 30,
            timeLimitMinutes: 10,
            sheetNumber,
            totalSheets: 100,
          }).problems as Problem[];
        } catch {
          continue; // level/skill combination not generatable — other audits cover that
        }

        for (const p of problems) {
          const opts = p.options;
          if (!opts || opts.length < 2) continue;
          const key = String(p.answer ?? "");
          const q = String(p.question ?? "");
          // Ordering / select-all items reuse the options field for their
          // draggable or checkable ITEMS, and are classified as such when
          // served (api/worksheet/by-id). Mirror that rule here or every
          // drag-to-order question looks like an unanswerable MC.
          if (isOrderingOrMultiSelect(key, opts)) continue;
          const fingerprint = `${q}||${opts.join("|")}`;
          if (seen.has(fingerprint)) continue;
          seen.add(fingerprint);
          checked++;

          const correctCount = opts.filter((o) => answersMatch(o, key, opts)).length;
          if (correctCount === 0) {
            noKeyInOptions.push(
              `${subject.slug} ${levelCode} — "${q}" key="${key}" options=[${opts.join(", ")}]`,
            );
          } else if (correctCount > 1) {
            multipleCorrect.push(
              `${subject.slug} ${levelCode} — "${q}" key="${key}" grades ${correctCount} of ${opts.length} options correct`,
            );
          }
        }
      }
    }
  }
}

console.log(`Checked ${checked} distinct multiple-choice items.`);
if (noKeyInOptions.length) {
  console.log(`\nUNANSWERABLE — the key is not among the options (${noKeyInOptions.length}):`);
  for (const s of noKeyInOptions.slice(0, 25)) console.log(`  ✗ ${s}`);
}
if (multipleCorrect.length) {
  console.log(`\nAMBIGUOUS — more than one option grades correct (${multipleCorrect.length}):`);
  for (const s of multipleCorrect.slice(0, 25)) console.log(`  ✗ ${s}`);
}
if (!noKeyInOptions.length && !multipleCorrect.length) {
  console.log("PASS — every multiple-choice item is answerable and unambiguous.");
} else {
  process.exit(1);
}
