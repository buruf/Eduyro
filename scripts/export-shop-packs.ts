// scripts/export-shop-packs.ts — write every shop pack PDF to a local folder.
//
// Renders each pack through EXACTLY the path a buyer's download takes
// (generatePackForSkill → renderPackToPdf, the same input shape pack-cache
// builds), so the file on disk is the file a customer gets. For testing the
// printed product by hand: open, print, work the sheets.
//
//   npx tsx scripts/export-shop-packs.ts            → worksheet-packs/<SKILL>.pdf
//   npx tsx scripts/export-shop-packs.ts <outDir>
//   npx tsx scripts/export-shop-packs.ts <outDir> ADDITION FRACTIONS   (subset)
import * as fs from "fs";
import * as path from "path";
import { generatePackForSkill, SHOP_SKILLS, type ShopSkill } from "../src/lib/shop/pack-generator";
import { renderPackToPdf } from "../src/lib/pdf/renderer";

const argv = process.argv.slice(2);
const outDir = path.resolve(argv[0] ?? "worksheet-packs");
const only = argv.slice(1) as ShopSkill[];
const skills = (Object.keys(SHOP_SKILLS) as ShopSkill[]).filter((s) => !only.length || only.includes(s));
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const rows: string[] = [];
  for (const skill of skills) {
    const start = Date.now();
    const pack = generatePackForSkill(skill);
    const sheets = pack.sheets.map((s) => {
      const answerMap = new Map((s.answerKey ?? []).map((e: any) => [e.id, String(e.answer)]));
      return {
        problems: s.problems.map((p: any) => ({ ...p, answer: answerMap.get(p.id) ?? String(p.answer ?? "") })),
        skillBand: s.bandLabel,
        meta: s.metaData,
        workedExample: s.workedExampleData,
      };
    });
    const bytes = await renderPackToPdf({ skillLabel: pack.label, skillCode: pack.skill, levelCode: pack.skill, sheets });
    const file = path.join(outDir, `${skill}.pdf`);
    fs.writeFileSync(file, Buffer.from(bytes));
    const units = new Set(pack.sheets.map((s) => s.bandLabel)).size;
    rows.push(`| ${skill} | ${pack.label} | ${pack.sheets.length} | ${units} | ${(bytes.length / 1024 / 1024).toFixed(1)} MB |`);
    console.log(`✓ ${skill}.pdf — ${pack.sheets.length} sheets, ${units} units, ${(bytes.length / 1024 / 1024).toFixed(1)} MB, ${Date.now() - start} ms`);
  }
  const readme = [
    `# Shop worksheet packs — exported ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `These are the exact PDFs a buyer downloads, rendered locally by scripts/export-shop-packs.ts.`,
    `Each pack: sheets in order, a printed lesson page on the first sheet of every unit, then a consolidated answer key at the end.`,
    ``,
    `| Pack | Label | Sheets | Units | Size |`,
    `|---|---|---|---|---|`,
    ...rows,
    ``,
    `Regenerate after any engine or renderer change: npx tsx scripts/export-shop-packs.ts`,
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "README.md"), readme, "utf8");
  console.log(`\n${skills.length} pack(s) → ${outDir}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
