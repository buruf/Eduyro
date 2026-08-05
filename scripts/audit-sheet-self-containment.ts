// scripts/audit-sheet-self-containment.ts
//
// THE "TESTED BUT NEVER TAUGHT" GATE.
//
// Born from two field reports on the same day: R2 asked "Which word is 'said'?"
// without ever showing the 50 sight words, and a Grade 1 unit was served a
// Grade 2–3 passage. Both are the same defect — A SHEET THAT ASKS ABOUT
// MATERIAL IT DOES NOT GIVE THE CHILD. Spot-fixing instances is pointless; this
// checks every unit, every subject, on every sheet of the day.
//
// A sheet is SELF-CONTAINED when every question can be answered from what is on
// that sheet plus what the child has been taught by that point.
import { PrismaClient } from "@prisma/client";
import { generateProblems } from "../src/lib/worksheet/generator";
import { READING_CURRICULUM } from "../src/lib/reading/curriculum";
import { bandForGrade } from "../src/lib/reading/passages";
import { stageForUnit } from "../src/lib/reading/phonics";

const SHEETS_PER_DAY = 3;
type Row = { subject: string; code: string; skill: string; sheet: number; check: string; detail: string };
const problems: Row[] = [];

const isHeader = (q: string) => q.startsWith("READ THIS PASSAGE") || q.startsWith("LEARN THESE WORDS");

// Phrases that point at a SPECIFIC text. Deliberately narrow: definitional
// questions ("The main character is usually:") are self-contained and must not
// be flagged, or the gate becomes noise and gets ignored.
const NEEDS_TEXT = /\b(according to the (passage|text|story|article)|in the (passage|text above)|the (passage|text|article) (says|states|tells|describes)|the author of this (passage|text)|based on the (passage|text))\b/i;
// Story-shaped questions that presuppose a narrative the child just read.
const NEEDS_NARRATIVE = /\b(what happened (first|next|last) in the story|at the (start|end) of this story)\b/i;

const db = new PrismaClient();
(async () => {
  const levels = await db.level.findMany({
    where: { isActive: true },
    select: { code: true, subject: { select: { slug: true } }, skills: { select: { name: true } } },
    orderBy: { sortOrder: "asc" },
  });

  let checked = 0;
  for (const lvl of levels) {
    const subject = lvl.subject.slug;
    for (const sk of lvl.skills) {
      for (let sheet = 1; sheet <= SHEETS_PER_DAY; sheet++) {
        let ps: any[] = [];
        try {
          ps = generateProblems({
            subjectSlug: subject, levelCode: lvl.code, skillName: sk.name,
            problemCount: 24, sheetNumber: sheet,
          } as any).problems as any[];
        } catch (e) {
          problems.push({ subject, code: lvl.code, skill: sk.name, sheet, check: "generate-threw", detail: String(e).slice(0, 90) });
          continue;
        }
        checked++;
        const add = (check: string, detail: string) =>
          problems.push({ subject, code: lvl.code, skill: sk.name, sheet, check, detail });

        const scored = ps.filter((p) => (p.points ?? 0) > 0);
        const headers = ps.filter((p) => isHeader(String(p.question ?? "")));
        const sheetText = ps.map((p) => String(p.question ?? "")).join("\n").toLowerCase();

        // 1. A sheet with no scored question is not a sheet.
        if (!scored.length) add("empty-sheet", `${ps.length} items, none scored`);

        // 2. Questions that reference a text when no text is present.
        for (const p of scored) {
          const q = String(p.question ?? "");
          if (!headers.length && (NEEDS_TEXT.test(q) || NEEDS_NARRATIVE.test(q))) {
            add("orphan-text-question", `no passage on sheet, but asks: "${q.slice(0, 62)}"`);
            break; // one report per sheet is enough to act on
          }
        }

        // 3. "Which word is 'X'?" — X must actually appear on the sheet, or the
        //    child is being asked to recognise a word they were never shown.
        for (const p of scored) {
          const m = String(p.question ?? "").match(/which word is ['"]([a-z]+)['"]/i);
          if (!m) continue;
          const target = m[1].toLowerCase();
          const shownInStudyCard = ps.some(
            (h) => String(h.question ?? "").startsWith("LEARN THESE WORDS") &&
                   new RegExp(`(^|\\s)${target}(\\s|$)`, "i").test(String(h.question)),
          );
          if (!shownInStudyCard) {
            add("word-never-shown", `asks for "${target}" but it is not in this sheet's word list`);
            break;
          }
        }

        // 4. READING content must match the unit's grade band. This is the
        //    generalised form of the Grade-1-got-a-Grade-3-passage bug.
        // Track A decodable texts use the SAME header but are 45–80 words; only
        // a long Track B passage on a Grade 1 unit is the bug.
        const longPassage = headers.some((h) => String(h.question).startsWith("READ THIS PASSAGE") && String(h.question).split(/\s+/).length > 120);
        if (subject === "READING" && longPassage && !stageForUnit(sk.name)) {
          const mod = READING_CURRICULUM.find((m) => m.units.includes(sk.name));
          if (mod && mod.grade < 2) {
            add("passage-below-grade-2", `Grade ${mod.grade} unit served a Track B passage (Track A owns Grade 1)`);
          }
          if (mod && mod.grade >= 2 && !bandForGrade(mod.grade)) {
            add("no-band", `Grade ${mod.grade} has no band`);
          }
        }
      }
    }
  }

  // Group by check so the output is a work list, not a wall.
  const byCheck = new Map<string, Row[]>();
  for (const r of problems) byCheck.set(r.check, [...(byCheck.get(r.check) ?? []), r]);
  for (const [check, rows] of [...byCheck.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n✗ ${check} — ${rows.length} sheet(s)`);
    for (const r of rows.slice(0, 8)) console.log(`    ${r.subject} ${r.code} [${r.skill}] sheet ${r.sheet}: ${r.detail}`);
    if (rows.length > 8) console.log(`    …and ${rows.length - 8} more`);
  }

  console.log(`\nsheets checked: ${checked}`);
  console.log(`${problems.length === 0 ? "✅" : "❌"} self-containment failures: ${problems.length}`);
  await db.$disconnect();
  process.exit(problems.length ? 1 : 0);
})();
