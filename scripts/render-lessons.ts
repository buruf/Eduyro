// scripts/render-lessons.ts
// Renders one MP4 per (unit × voice) into public/lesson-video/.
//
//   npx tsx scripts/render-lessons.ts              # every unit with narration
//   npx tsx scripts/render-lessons.ts mul-skip     # named units
//
// Each render takes a couple of minutes and produces a few MB. At catalogue
// scale these belong in S3 rather than the repo — see the note in units.ts.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EQUAL_GROUP_UNITS, COLUMN_UNITS, TEN_FRAME_UNITS, DEALING_UNITS, FACT_FAMILY_UNITS, AREA_UNITS, CURRICULUM_TEN_FRAME_UNITS, CURRICULUM_FACT_FAMILY_UNITS, FRACTION_BAR_UNITS, HUNDRED_GRID_UNITS, RATIO_UNITS, BALANCE_UNITS, GRAPH_UNITS, COUNT_UNITS, COMPARE_UNITS, NUMBER_LINE_UNITS } from "../src/remotion/lesson/units";
import { graphLines } from "../src/remotion/lesson/script-graph";
import { ALL_LESSON_UNITS, selectUnits, type RegisteredUnit } from "../src/remotion/lesson/registry";
import { LESSON_VOICES } from "../src/remotion/lesson/voices";
import { CLIPS_BY_UNIT } from "../src/remotion/lesson/voice-manifest";

const ROOT = process.cwd();
const OUT = join(ROOT, "public", "lesson-video");
mkdirSync(OUT, { recursive: true });

const only = process.argv.slice(2);
const ALL = ALL_LESSON_UNITS;
const units = only.length ? ALL.filter((u) => only.includes(u.id)) : ALL;

// A typo'd or unregistered unit id must fail loudly. This script once exited
// silently when asked for units whose template group wasn't imported yet —
// which read as "rendered fine" until the validator found no files.
const known = new Set(ALL.map((u) => u.id));
const unknown = only.filter((id) => !known.has(id));
if (unknown.length) {
  console.error(`Unknown unit id(s): ${unknown.join(", ")}`);
  process.exit(1);
}
if (!units.length) {
  console.error("Nothing to render.");
  process.exit(1);
}

for (const unit of units) {
  for (const voice of LESSON_VOICES) {
    if (!CLIPS_BY_UNIT[unit.id]?.[voice.key]) {
      console.log(`skip ${unit.id}·${voice.key} — no narration yet`);
      continue;
    }
    const out = join(OUT, `${unit.id}.${voice.key}.mp4`);
    process.stdout.write(`rendering ${unit.id}·${voice.key}… `);
    // Props go via a FILE, not inline JSON: quoting a JSON object through the
    // shell mangles it, and the resulting error message is unrelated to the
    // real cause, which costs more time than the temp file does.
    const propsFile = join(tmpdir(), `lesson-props-${unit.id}-${voice.key}.json`);
    writeFileSync(propsFile, JSON.stringify({ unit: unit.id, voice: voice.key }));
    try {
      execFileSync("npx", ["remotion", "render", unit.comp, out, `--props=${propsFile}`], {
        stdio: ["ignore", "ignore", "pipe"],
        shell: true,
      });
      console.log(existsSync(out) ? "ok" : "FAILED");
    } catch (e) {
      console.log("FAILED");
      console.error(String((e as { stderr?: Buffer }).stderr ?? e).slice(-400));
    }
  }
}
