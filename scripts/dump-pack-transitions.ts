// scripts/dump-pack-transitions.ts — what a child meets at every unit boundary
// inside a SHOP WORKSHEET PACK (the printed 100-sheet PDF products).
//
// The packs are built from the same engines as the daily practice, but they
// are a different experience: paper, no coach, no retry, no video. A unit's
// first sheet carries a printed LESSON PAGE (the curated example plus several
// worked from the sheet's own problems — buildExamples), and then the child
// works sheets in order. This dumps, for every unit boundary in every pack:
//
//   A.last   — a sample of the last sheet of the unit just finished
//   B.lesson — the printed lesson page exactly as the PDF builds it
//   B.first  — the whole first sheet of the new unit, as printed (no options,
//              true/false stripped), with print-fitness flags
//   B.ramp   — three sample items from every sheet of the unit, so the
//              reviewer can see the within-unit progression
//
// Output: one markdown file per pack in the given directory, plus index.json.
//   npx tsx scripts/dump-pack-transitions.ts <outDir>
import * as fs from "fs";
import * as path from "path";
import { generatePackForSkill, SHOP_SKILLS, type ShopSkill } from "../src/lib/shop/pack-generator";
import { buildExamples, printDirective } from "../src/lib/pdf/renderer";
import type { WorksheetData } from "../src/lib/shop/progressive-generator";

const outDir = process.argv[2];
if (!outDir) { console.error("usage: tsx scripts/dump-pack-transitions.ts <outDir>"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const SKILLS = Object.keys(SHOP_SKILLS) as ShopSkill[];

function flagsFor(p: any): string[] {
  const f: string[] = [];
  if (p.options?.length) f.push("MC on screen — prints WITHOUT options");
  if (p.interactive) f.push(`interactive:${p.interactive.kind ?? "?"} — prints as a grid/diagram`);
  if (/\[\[viz /.test(String(p.question))) f.push("picture item");
  if (String(p.question).length > 70) f.push("long prompt");
  return f;
}
function fmt(p: any): string {
  const q = String(p.question ?? "").replace(/\s+/g, " ").trim();
  const fl = flagsFor(p);
  return `- ${q}  → **${p.answer}**${fl.length ? `  ⟨${fl.join("; ")}⟩` : ""}`;
}
function asWorksheet(s: any): WorksheetData {
  return { problems: s.problems, answerKey: s.answerKey, workedExample: s.workedExampleData, meta: s.metaData } as WorksheetData;
}

const index: any[] = [];
for (const skill of SKILLS) {
  let pack;
  try { pack = generatePackForSkill(skill); } catch (e: any) { console.log(`${skill}: PACK GENERATION FAILED: ${e?.message ?? e}`); index.push({ skill, failed: true }); continue; }
  const sheets = pack.sheets;
  // unit = run of consecutive sheets with the same subSkillLabel / bandLabel
  const units: { label: string; from: number; to: number }[] = [];
  for (const s of sheets) {
    const label = s.bandLabel;
    const last = units[units.length - 1];
    if (last && last.label === label) last.to = s.sheetNumber; else units.push({ label, from: s.sheetNumber, to: s.sheetNumber });
  }
  const lines: string[] = [`# ${skill} pack — "${pack.label}" — ${sheets.length} sheets, ${units.length} units, ${units.length - 1} boundaries\n`];
  lines.push(`Unit order (a child works the printed sheets 1 → ${sheets.length} in order; the first sheet of a unit carries the lesson page):`);
  units.forEach((u, i) => lines.push(`${i + 1}. **${u.label}** — sheets ${u.from}–${u.to}`));
  lines.push("");
  for (let i = 1; i < units.length; i++) {
    const A = units[i - 1], B = units[i];
    const aLast = sheets[A.to - 1], bFirst = sheets[B.from - 1];
    const id = `${skill}: ${A.label} (sheet ${A.to}) → ${B.label} (sheet ${B.from})`;
    lines.push(`\n---\n## BOUNDARY: ${id}\n`);
    lines.push(`### A. Last sheet of the unit just finished — "${A.label}", sheet ${A.to} (${aLast.problems.length} items; first 12 shown)`);
    lines.push(...aLast.problems.slice(0, 12).map(fmt));
    lines.push(`\n### B. Printed lesson page for "${B.label}" (sheet ${B.from}${bFirst.metaData?.mode === "tutorial" ? ", tutorial mode" : ", NOT tutorial mode — NO LESSON PAGE PRINTS"})`);
    if (bFirst.metaData) {
      lines.push(`- objective: ${bFirst.metaData.learningObjective}`);
      if ((bFirst.metaData as any).directive) lines.push(`- directive (as printed): ${printDirective((bFirst.metaData as any).directive)}`);
      lines.push(`- grade: ${bFirst.metaData.gradeLevel}; stars: ${bFirst.metaData.difficultyStars}`);
    }
    let examples: any[] = [];
    try { examples = buildExamples(asWorksheet(bFirst)); } catch (e: any) { lines.push(`!! buildExamples failed: ${e?.message ?? e}`); }
    if (!examples.length) lines.push(`!! NO WORKED EXAMPLES ON THE LESSON PAGE`);
    examples.forEach((ex, k) => {
      lines.push(`- example ${k + 1}: ${String(ex.problem).replace(/\s+/g, " ")}  → ${ex.answer}`);
      for (const st of ex.steps ?? []) lines.push(`    - ${st}`);
    });
    lines.push(`\n### B. First sheet of the new unit — "${B.label}", sheet ${B.from} (all ${bFirst.problems.length} items, as printed)`);
    lines.push(...bFirst.problems.map(fmt));
    lines.push(`\n### B. Ramp through "${B.label}" — 3 items from every sheet ${B.from}–${B.to}`);
    for (let n = B.from; n <= B.to; n++) {
      const s = sheets[n - 1];
      const pick = [0, Math.floor(s.problems.length / 2), s.problems.length - 1].map((j) => s.problems[j]).filter(Boolean);
      lines.push(`- sheet ${n} (${s.problems.length}): ${pick.map((p) => `${String(p.question).replace(/\s+/g, " ").slice(0, 44)} → ${p.answer}`).join("  ‖  ")}`);
    }
    index.push({ id, skill, A: A.label, B: B.label, firstSheet: B.from, lessonPage: bFirst.metaData?.mode === "tutorial", examples: examples.length, items: bFirst.problems.length, mc: bFirst.problems.filter((p: any) => p.options?.length).length, interactive: bFirst.problems.filter((p: any) => p.interactive).length });
  }
  fs.writeFileSync(path.join(outDir, `${skill}.md`), lines.join("\n"), "utf8");
  console.log(`${skill}: ${sheets.length} sheets, ${units.length} units, ${units.length - 1} boundaries → ${skill}.md`);
}
fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index, null, 2), "utf8");
const ok = index.filter((t) => !t.failed);
console.log(`\n${ok.length} boundaries dumped; no lesson page: ${ok.filter((t) => !t.lessonPage).length}; no examples: ${ok.filter((t) => t.examples === 0).length}; first sheets with MC items: ${ok.filter((t) => t.mc > 0).length}; with interactive items: ${ok.filter((t) => t.interactive > 0).length}`);
