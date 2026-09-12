// scripts/audit-video-sync.ts — is the narration where the picture is?
//
// A parent reported narration and picture drifting apart. Scene-level sync is
// right by construction (each clip starts with its scene, and the scene is at
// least clip + 0.8 s long), so drift lives in (a) stale data — a manifest
// duration that no longer matches the mp3, a script line that changed after
// narration, a render older than its timeline — and (b) INSIDE a scene, where
// every reveal fires at a hand-picked frame while the narrator reaches the
// number at whatever second the recording landed on.
//
// This script proves (a) by machine and MEASURES (b): for every scene it
// lists when each number is spoken, so a reviewer (or the stills renderer,
// scripts/render-sync-stills.ts) can check the picture against those moments.
//
//   npx tsx scripts/audit-video-sync.ts <outDir> [unit-id …]
import * as fs from "fs";
import * as path from "path";
import { ALL_LESSON_UNITS, selectUnits } from "../src/remotion/lesson/registry";
import { CLIPS_BY_UNIT } from "../src/remotion/lesson/voice-manifest";
import { speakable } from "../src/lib/tts/speakable";
import * as T from "../src/remotion/lesson/timeline";

const FPS = T.FPS;
const VOICE = "ramlah";
const DUR_TOL = 0.15; // s — manifest vs real mp3
const MP4_TOL = 0.5;  // s — rendered vs timeline

const BY_COMP: Record<string, (u: string, v: string) => T.SceneTiming[]> = {
  EqualGroups: T.sceneTimings, Column: T.columnSceneTimings, TenFrame: T.tenFrameSceneTimings,
  Dealing: T.dealingSceneTimings, FactFamily: T.factFamilySceneTimings, Area: T.areaSceneTimings,
  Count: T.countSceneTimings, Compare: T.compareSceneTimings, NumberLine: T.numberLineSceneTimings,
  FractionBar: T.fractionBarSceneTimings, HundredGrid: T.hundredGridSceneTimings, RatioTable: T.ratioSceneTimings,
  Balance: T.balanceSceneTimings, Graph: T.graphSceneTimings, FunctionMachine: T.functionSceneTimings,
  Trig: T.trigSceneTimings, Poly: T.polySceneTimings, Advanced: T.advancedSceneTimings,
  FractionOps: T.fracOpsSceneTimings, DecimalOps: T.decimalOpsSceneTimings, PlaceValue: T.placeValueSceneTimings,
  PolyOps: T.polyOpsSceneTimings, PreAlg: T.preAlgSceneTimings, LinEq: T.linEqSceneTimings,
  Quad: T.quadSceneTimings, Factor: T.factorSceneTimings,
};

const outDir = process.argv[2];
if (!outDir) { console.error("usage: tsx scripts/audit-video-sync.ts <outDir> [unit …]"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const units = selectUnits(process.argv.slice(3));

async function realDuration(file: string): Promise<number | null> {
  try {
    const { parseMedia } = await import("@remotion/media-parser");
    const { nodeReader } = await import("@remotion/media-parser/node");
    const r = await parseMedia({ src: file, reader: nodeReader, fields: { durationInSeconds: true }, acknowledgeRemotionLicense: true });
    return r.durationInSeconds ?? null;
  } catch { return null; }
}
const textNumbers = (t: string) => (speakable(t).match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

interface SceneRow { unit: string; comp: string; scene: string; text: string; sceneSec: number; clipSec: number | null; realSec: number | null; spoken: { n: number; s: number }[] | null; issues: string[]; }
const rows: SceneRow[] = [];
const hard: string[] = [];
const mp4Rows: string[] = [];

async function main() {
  for (const u of units) {
    const timings = BY_COMP[u.comp]?.(u.id, VOICE);
    if (!timings) { hard.push(`${u.id}: no scene-timing function for comp ${u.comp}`); continue; }
    const clips = CLIPS_BY_UNIT[u.id]?.[VOICE] ?? [];
    const lines = u.lines();
    for (const t of timings) {
      const clip = clips.find((c) => c.id === t.id);
      const line = lines.find((l: any) => l.id === t.id);
      const issues: string[] = [];
      const sceneSec = t.dur / FPS;
      let realSec: number | null = null;
      if (!clip) issues.push("NO CLIP in manifest — scene plays silent");
      else {
        const file = path.join("public", clip.file);
        if (!fs.existsSync(file)) issues.push("mp3 MISSING on disk");
        else {
          realSec = await realDuration(file);
          if (realSec !== null && Math.abs(realSec - clip.durationInSeconds) > DUR_TOL)
            issues.push(`manifest says ${clip.durationInSeconds}s but mp3 is ${realSec.toFixed(2)}s — stale manifest`);
          if (realSec !== null && realSec > sceneSec + 0.05)
            issues.push(`clip ${realSec.toFixed(2)}s longer than its scene ${sceneSec.toFixed(2)}s — narration cut off`);
        }
        // The builder omits numberTimes when the line says no number at all —
        // nothing to align, nothing to sync. Only a line WITH numbers and no
        // alignment is a problem.
        const saysNumbers = line ? textNumbers(line.text).length > 0 : false;
        if (!clip.numberTimes && saysNumbers) issues.push("no word alignment — picture cannot be synced to speech");
        else if (clip.numberTimes && line) {
          const expected = textNumbers(line.text);
          const pool = clip.numberTimes.map((x) => x.n);
          const missing: number[] = [];
          for (const n of expected) { const i = pool.indexOf(n); if (i === -1) missing.push(n); else pool.splice(i, 1); }
          if (missing.length) issues.push(`script says ${missing.join(", ")} but the recording has no such number — line changed after narration?`);
        }
      }
      if (!line) issues.push("scene has no script line");
      rows.push({ unit: u.id, comp: u.comp, scene: t.id, text: line?.text ?? "", sceneSec, clipSec: clip?.durationInSeconds ?? null, realSec, spoken: clip?.numberTimes ?? null, issues });
      for (const i of issues) if (!/no word alignment/.test(i)) hard.push(`${u.id}/${t.id}: ${i}`);
    }
    // rendered artifact vs timeline
    const mp4 = path.join("public", "lesson-video", `${u.id}.${VOICE}.mp4`);
    const expected = timings.reduce((n, s) => n + s.dur, 0) / FPS;
    if (!fs.existsSync(mp4)) { hard.push(`${u.id}: mp4 missing`); mp4Rows.push(`| ${u.id} | — | ${expected.toFixed(1)} | MISSING |`); }
    else {
      const real = await realDuration(mp4);
      const ok = real !== null && Math.abs(real - expected) <= MP4_TOL;
      if (!ok) hard.push(`${u.id}: mp4 is ${real?.toFixed(1)}s, timeline says ${expected.toFixed(1)}s — stale render`);
      mp4Rows.push(`| ${u.id} | ${real?.toFixed(1) ?? "?"} | ${expected.toFixed(1)} | ${ok ? "ok" : "STALE"} |`);
    }
  }

  // ---- report
  const md: string[] = [`# Video sync audit — ${units.length} units, ${rows.length} scenes\n`];
  const unaligned = rows.filter((r) => r.spoken === null && r.clipSec !== null).length;
  md.push(`Hard failures: **${hard.length}** · scenes without word alignment: **${unaligned}** (those cannot be synced to speech until re-narrated with timestamps)\n`);
  if (hard.length) { md.push(`## Hard failures\n`); for (const h of hard) md.push(`- ${h}`); md.push(""); }
  md.push(`## Rendered MP4 vs audio timeline\n\n| unit | mp4 s | timeline s | |\n|---|---|---|---|`, ...mp4Rows, "");
  md.push(`## Every scene — when each number is spoken (seconds into the scene)\n`);
  md.push(`Reveals inside a scene fire at hand-picked frames; compare them to these moments. "tail" is silence after the clip ends.\n`);
  let cur = "";
  for (const r of rows) {
    if (r.unit !== cur) { cur = r.unit; md.push(`\n### ${r.unit} (${r.comp})`); }
    const spoken = r.spoken ? r.spoken.map((x) => `${x.n}@${x.s.toFixed(2)}s`).join("  ") : "(no alignment)";
    const tail = r.clipSec !== null ? (r.sceneSec - r.clipSec).toFixed(2) : "?";
    md.push(`- **${r.scene}** · scene ${r.sceneSec.toFixed(2)}s, clip ${r.clipSec ?? "?"}s, tail ${tail}s · ${spoken}${r.issues.length ? `\n  - ⚠ ${r.issues.join("; ")}` : ""}\n  - "${r.text.replace(/\s+/g, " ").slice(0, 140)}"`);
  }
  fs.writeFileSync(path.join(outDir, "sync-audit.md"), md.join("\n"), "utf8");
  fs.writeFileSync(path.join(outDir, "sync-audit.json"), JSON.stringify({ hard, rows }, null, 1), "utf8");
  console.log(`\n${units.length} units, ${rows.length} scenes → ${outDir}/sync-audit.md`);
  console.log(`hard failures: ${hard.length}; scenes without word alignment: ${unaligned}`);
  for (const h of hard.slice(0, 20)) console.log("  ✗ " + h);
  if (hard.length) process.exit(1);
}
main();
