// scripts/validate-videos.ts
// VIDEO VALIDATION ENGINE. A video is not "done" because it rendered — it is
// done when it passes this. Two levels:
//
//   LEVEL 1 — STRUCTURAL (before/without rendering)
//     For every unit: the narration must contain every number its teaching
//     contract requires (visual/narration coverage), must contain NO number
//     outside the contract's allowed set (extra narration), and scene-scoped
//     requirements must be spoken in their scene.
//
//   LEVEL 2 — RENDERED (the artifact that ships)
//     For every rendered (unit × voice): every scene's voice clip exists and
//     is non-empty, the MP4 exists and its container duration matches the
//     audio-derived timeline within tolerance, and each scene's required
//     numbers appear in that clip's word-alignment (so the number is SPOKEN
//     while its scene is on screen — the timing guarantee).
//
//   npx tsx scripts/validate-videos.ts            all units
//   npx tsx scripts/validate-videos.ts <id...>    just those units
//   --level1-only                                 skip MP4 checks (CI-fast)
import { execFileSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { ALL_LESSON_UNITS } from "../src/remotion/lesson/registry";
import { contractFor } from "../src/remotion/lesson/contracts";
import { CLIPS_BY_UNIT } from "../src/remotion/lesson/voice-manifest";
import { FPS } from "../src/remotion/lesson/timeline";
import { timingsFor } from "./render-lessons-timings";

const VOICE = "ramlah";
const FFPROBE = join(
  process.cwd(),
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
  "ffprobe.exe",
);

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const level1Only = process.argv.includes("--level1-only");

/** Numeric tokens in narration text, as numbers — digits ("0.6", "25"),
 *  spelled numbers ("six"), and exponent words ("squared" narrates a 2). */
const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, squared: 2, cubed: 3,
  // NOT "half"/"quarter": those appear in prose ("the left half lands on the
  // right") far more often than as taught quantities.
};
function spokenNumbers(text: string): number[] {
  const digits = (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const words = (text.toLowerCase().match(/[a-z]+/g) ?? [])
    .map((w) => WORD_NUMBERS[w])
    .filter((v): v is number => v !== undefined);
  return [...digits, ...words];
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.005;
const hasNum = (xs: number[], v: number) => xs.some((x) => near(x, Math.abs(v)));

interface Result {
  unit: string;
  label: string;
  failures: string[];
  warnings: string[];
}

function mp4Duration(file: string): number | null {
  try {
    const out = execFileSync(FFPROBE, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      file,
    ]).toString().trim();
    const d = Number(out);
    return Number.isFinite(d) ? d : null;
  } catch {
    return null;
  }
}

function validateUnit(u: (typeof ALL_LESSON_UNITS)[number]): Result {
  const failures: string[] = [];
  const warnings: string[] = [];
  const lines = u.lines();
  const contract = contractFor(u.comp, u.id);
  const allText = lines.map((l) => l.text).join(" ");
  const allSpoken = spokenNumbers(allText);

  // ---- LEVEL 1: coverage ---------------------------------------------------
  for (const req of contract.requiredSpoken) {
    if (!hasNum(allSpoken, req)) {
      failures.push(`NARRATION MISSING required element ${req} — the screen teaches it, the voice never says it`);
    }
  }
  // ---- LEVEL 1: extra narration -------------------------------------------
  for (const tok of new Set(allSpoken)) {
    if (!contract.allowedNumbers.some((a) => near(tok, Math.abs(a)))) {
      failures.push(`EXTRA NARRATION: voice says ${tok}, which no visual teaches (not in the contract's allowed set)`);
    }
  }
  // ---- LEVEL 1: scene-scoped requirements ---------------------------------
  for (const [sceneId, nums] of Object.entries(contract.perScene ?? {})) {
    const line = lines.find((l) => l.id === sceneId);
    if (!line) {
      failures.push(`CONTRACT scene "${sceneId}" does not exist in narration`);
      continue;
    }
    const sceneNums = spokenNumbers(line.text);
    for (const n of nums) {
      if (!hasNum(sceneNums, n)) {
        failures.push(`SCENE "${sceneId}" must speak ${n} while it is on screen — it doesn't`);
      }
    }
  }

  if (level1Only) return { unit: u.id, label: u.label, failures, warnings };

  // ---- LEVEL 2: the rendered artifact -------------------------------------
  const clips = CLIPS_BY_UNIT[u.id]?.[VOICE] ?? [];
  for (const line of lines) {
    const clip = clips.find((c) => c.id === line.id);
    if (!clip) {
      failures.push(`RENDERED: no voice clip for scene "${line.id}"`);
      continue;
    }
    const f = join(process.cwd(), "public", clip.file);
    if (!existsSync(f) || statSync(f).size < 1000) {
      failures.push(`RENDERED: voice clip file missing/empty for scene "${line.id}"`);
    }
    // Timing: every required number this scene speaks must appear in the
    // clip's word alignment — proof it is SAID during the scene's window.
    // Alignment only tracks digit tokens, so only digits can be asserted
    // against it — numbers spoken as words ("One becomes 2") are covered by
    // the Level-1 check instead.
    const digitTokens = (line.text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
    const sceneRequired = contract.requiredSpoken.filter((r) => hasNum(digitTokens, r));
    if (sceneRequired.length && !clip.numberTimes) {
      warnings.push(`scene "${line.id}": clip predates word-alignment capture — timing unverifiable (re-synthesize to fix)`);
    } else if (clip.numberTimes) {
      for (const r of sceneRequired) {
        const heard = (v: number) => clip.numberTimes!.some((t) => near(t.n, Math.abs(v)) || near(t.n, v));
        // Decimals are voiced as "0 point 6", so alignment hears the parts.
        const parts = String(Math.abs(r)).split(".");
        const asParts = parts.length === 2 && heard(Number(parts[0])) && heard(Number(parts[1]));
        if (!heard(r) && !asParts) {
          failures.push(`RENDERED TIMING: scene "${line.id}" should speak ${r} but the audio alignment never hears it`);
        }
      }
    }
  }

  const mp4 = join(process.cwd(), "public", "lesson-video", `${u.id}.${VOICE}.mp4`);
  if (!existsSync(mp4)) {
    failures.push(`RENDERED: MP4 missing (${u.id}.${VOICE}.mp4)`);
  } else {
    const expected = timingsFor(u.id, VOICE) / FPS;
    const actual = mp4Duration(mp4);
    if (actual === null) {
      failures.push("RENDERED: could not read MP4 duration");
    } else if (Math.abs(actual - expected) > 1.5) {
      failures.push(
        `RENDERED: MP4 is ${actual.toFixed(1)}s but the audio timeline says ${expected.toFixed(1)}s — stale render, re-render required`,
      );
    }
  }

  return { unit: u.id, label: u.label, failures, warnings };
}

const units = args.length
  ? ALL_LESSON_UNITS.filter((u) => args.includes(u.id))
  : ALL_LESSON_UNITS;
if (args.length && units.length !== args.length) {
  const known = new Set(ALL_LESSON_UNITS.map((u) => u.id));
  console.error(`Unknown unit id(s): ${args.filter((a) => !known.has(a)).join(", ")}`);
  process.exit(1);
}

let failCount = 0;
let warnCount = 0;
for (const u of units) {
  const r = validateUnit(u);
  const status = r.failures.length ? "FAIL" : "PASS";
  if (r.failures.length) failCount++;
  warnCount += r.warnings.length;
  if (r.failures.length || r.warnings.length) {
    console.log(`\n${status}  ${r.unit}  (${r.label})`);
    for (const f of r.failures) console.log(`      ✗ ${f}`);
    for (const w of r.warnings) console.log(`      ⚠ ${w}`);
  } else {
    console.log(`PASS  ${r.unit}`);
  }
}

console.log(
  `\n${units.length} videos validated: ${units.length - failCount} PASS, ${failCount} FAIL, ${warnCount} warnings`,
);
if (failCount) {
  console.log("A FAILING VIDEO MUST NOT BE UPLOADED OR PUBLISHED.");
  process.exit(1);
}
