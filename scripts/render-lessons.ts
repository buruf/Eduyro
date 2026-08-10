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
import { EQUAL_GROUP_UNITS, COLUMN_UNITS, TEN_FRAME_UNITS, DEALING_UNITS, FACT_FAMILY_UNITS, AREA_UNITS, CURRICULUM_TEN_FRAME_UNITS, CURRICULUM_FACT_FAMILY_UNITS, COUNT_UNITS, COMPARE_UNITS, NUMBER_LINE_UNITS } from "../src/remotion/lesson/units";
import { LESSON_VOICES } from "../src/remotion/lesson/voices";
import { CLIPS_BY_UNIT } from "../src/remotion/lesson/voice-manifest";

const ROOT = process.cwd();
const OUT = join(ROOT, "public", "lesson-video");
mkdirSync(OUT, { recursive: true });

const only = process.argv.slice(2);
const ALL = [
  ...EQUAL_GROUP_UNITS.map((u) => ({ id: u.id, comp: "EqualGroups" })),
  ...COLUMN_UNITS.map((u) => ({ id: u.id, comp: "Column" })),
  ...[...TEN_FRAME_UNITS, ...CURRICULUM_TEN_FRAME_UNITS].map((u) => ({ id: u.id, comp: "TenFrame" })),
  ...DEALING_UNITS.map((u) => ({ id: u.id, comp: "Dealing" })),
  ...[...FACT_FAMILY_UNITS, ...CURRICULUM_FACT_FAMILY_UNITS].map((u) => ({ id: u.id, comp: "FactFamily" })),
  ...AREA_UNITS.map((u) => ({ id: u.id, comp: "Area" })),
  ...COUNT_UNITS.map((u) => ({ id: u.id, comp: "Count" })),
  ...COMPARE_UNITS.map((u) => ({ id: u.id, comp: "Compare" })),
  ...NUMBER_LINE_UNITS.map((u) => ({ id: u.id, comp: "NumberLine" })),
];
const units = only.length ? ALL.filter((u) => only.includes(u.id)) : ALL;

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
