// scripts/export-lesson-videos.ts
// Copies every rendered lesson video into a browsable folder for review,
// grouped by module and named so the file itself says what it teaches.
//
//   npx tsx scripts/export-lesson-videos.ts [destination]
//
// Default destination: Desktop\eduyro-lesson-videos
//
// Also writes CHECKLIST.md — one line per video with a tick box, so a review
// pass can be recorded while watching rather than remembered afterwards.
import { copyFileSync, existsSync, mkdirSync, writeFileSync, statSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { PrismaClient } from "@prisma/client";
import { ALL_VIDEO_UNITS, videoForSkillLabel } from "../src/remotion/lesson/units";
import { getMathSheetMeta } from "../src/lib/worksheet/generator";
import { DEFAULT_VOICE_KEY } from "../src/remotion/lesson/voices";

const ROOT = process.cwd();
const SRC = join(ROOT, "public", "lesson-video");

const desktop = existsSync(join(homedir(), "OneDrive", "Desktop"))
  ? join(homedir(), "OneDrive", "Desktop")
  : join(homedir(), "Desktop");
const DEST = process.argv[2] ?? join(desktop, "eduyro-lesson-videos");

/** Windows-safe filename: strip the characters Explorer refuses. */
function safe(name: string): string {
  return name
    .replace(/×/g, "x")
    .replace(/÷/g, "div")
    .replace(/−/g, "-")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const db = new PrismaClient();

  // Which module does each unit belong to?
  //
  // FIRST from the curriculum ITSELF (getMathSheetMeta), because that is what
  // actually decides which module serves a lesson. The stored Worksheet rows
  // are a partial cache — every lesson built since the engine moved to
  // code-generated sheets has no row — so trusting them alone dumped 35
  // correctly-wired videos into "_not-linked-to-any-sheet", where they were
  // impossible to find by module.
  const levels = await db.level.findMany({
    where: { code: { startsWith: "M" } },
    select: { code: true, name: true },
  });
  const levelName = new Map(levels.map((l) => [l.code, l.name]));

  const levelOfUnitFromCurriculum = new Map<string, { code: string; name: string }>();
  for (let n = 1; n <= 18; n++) {
    const code = `M${n}`;
    const name = levelName.get(code);
    if (!name) continue;
    for (let s = 1; s <= 100; s++) {
      let label: string | null = null;
      try {
        label = getMathSheetMeta(code, s)?.subSkillLabel ?? null;
      } catch { /* not generatable */ }
      if (!label) continue;
      const v = videoForSkillLabel(label);
      if (v && !levelOfUnitFromCurriculum.has(v.id)) levelOfUnitFromCurriculum.set(v.id, { code, name });
    }
  }

  // The stored sheets still give an honest "how many sheets use this" count.
  const sheets = await db.worksheet.findMany({
    where: { level: { code: { startsWith: "M" } } },
    select: { title: true, skill: { select: { name: true } }, level: { select: { code: true, name: true } } },
  });
  await db.$disconnect();

  const levelOfUnit = new Map<string, { code: string; name: string }>();
  const sheetsOfUnit = new Map<string, number>();
  for (const s of sheets) {
    // Same derivation the coverage check uses: a sheet reports the title
    // prefix before " — Sheet N". Reading skill.name instead gives the COARSE
    // skill ("Multiplication Fluency"), which matches almost no unit — that
    // mistake made 39 videos look unlinked when they are wired correctly.
    const label = s.title.split(" — Sheet")[0].trim() || s.skill?.name || s.title;
    const v = videoForSkillLabel(label);
    if (!v) continue;
    if (!levelOfUnit.has(v.id)) levelOfUnit.set(v.id, { code: s.level.code, name: s.level.name });
    sheetsOfUnit.set(v.id, (sheetsOfUnit.get(v.id) ?? 0) + 1);
  }

  mkdirSync(DEST, { recursive: true });

  const rows: { level: string; folder: string; file: string; unit: string; label: string; sheets: number; mb: number }[] = [];
  const written = new Set<string>();
  let missing = 0;

  for (const u of ALL_VIDEO_UNITS) {
    const src = join(SRC, `${u.id}.${DEFAULT_VOICE_KEY}.mp4`);
    if (!existsSync(src)) {
      console.error(`MISSING ${u.id}`);
      missing++;
      continue;
    }
    const lvl = levelOfUnitFromCurriculum.get(u.id) ?? levelOfUnit.get(u.id);
    // Units with no sheet pointing at them still get exported, under _unused —
    // silently dropping them would hide a wiring mistake.
    const folder = lvl
      ? `M${String(Number(lvl.code.replace("M", ""))).padStart(2, "0")} ${lvl.name}`
      : "_not-linked-to-any-sheet";
    const dir = join(DEST, folder);
    mkdirSync(dir, { recursive: true });

    const file = `${safe(u.label)} [${u.id}].mp4`;
    copyFileSync(src, join(dir, file));
    written.add(join(dir, file));
    rows.push({
      level: lvl?.code ?? "—",
      folder,
      file,
      unit: u.id,
      label: u.label,
      sheets: sheetsOfUnit.get(u.id) ?? 0,
      mb: Number((statSync(src).size / 1048576).toFixed(1)),
    });
  }

  // Sweep up videos left behind by an EARLIER export — a lesson that has since
  // been refiled into its real module would otherwise sit in both places, and
  // a stale copy of a re-rendered video is worse than no copy. Only .mp4 files
  // this script itself writes are touched; anything else in the folder stays.
  let pruned = 0;
  for (const entry of readdirSync(DEST, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(DEST, entry.name);
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".mp4")) continue;
      const p = join(dir, f);
      if (written.has(p)) continue;
      rmSync(p);
      pruned++;
    }
    if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
  }

  // Sort by module number, then label.
  rows.sort(
    (a, b) =>
      (Number(a.level.replace("M", "")) || 999) - (Number(b.level.replace("M", "")) || 999) ||
      a.label.localeCompare(b.label),
  );

  const lines: string[] = [
    "# Eduyro lesson videos — review checklist",
    "",
    `${rows.length} videos, voice: ${DEFAULT_VOICE_KEY}.`,
    "",
    "Tick a box once you've watched it. Anything wrong, note it on the line —",
    "the file name's `[unit-id]` is what I need to fix or re-render it.",
    "",
    "What to look for: does the picture match what the voice says, do the numbers",
    "on screen agree with the narration, and does anything move that shouldn't",
    "(or stay still when it should move)?",
    "",
  ];

  let current = "";
  for (const r of rows) {
    if (r.folder !== current) {
      current = r.folder;
      lines.push(`\n## ${current}\n`);
    }
    lines.push(`- [ ] **${r.label}** — \`${r.unit}\` · ${r.sheets} sheet${r.sheets === 1 ? "" : "s"} · ${r.mb}MB`);
  }

  lines.push("", "---", "", "Notes:", "");
  writeFileSync(join(DEST, "CHECKLIST.md"), lines.join("\n"), "utf8");

  const totalMb = rows.reduce((n, r) => n + r.mb, 0);
  console.log(`\nExported ${rows.length} videos (${totalMb.toFixed(0)}MB) to:`);
  console.log(`  ${DEST}`);
  if (pruned) console.log(`Removed ${pruned} stale file(s) left by earlier exports.`);
  if (missing) console.log(`\n${missing} unit(s) had no rendered file.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
