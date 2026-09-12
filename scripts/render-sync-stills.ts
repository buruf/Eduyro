// scripts/render-sync-stills.ts — a frame at the moment each number is spoken.
//
// The only honest test of "is the picture where the voice is" is to look at
// the picture when the voice says the number. For each chosen unit, every
// scene, every aligned number: render the frame 0.25 s after the word is
// spoken (what a viewer sees while hearing it) to <out>/<unit>/<scene>__<n>@<s>.png,
// plus one frame at the end of the clip. index.md lists what each still should
// show, so a reviewer can mark each one: visual present / early / late / absent.
//
//   npx tsx scripts/render-sync-stills.ts <outDir> [unit-id …]
//   (no units → the first 2 units of every composition)
import * as fs from "fs";
import * as path from "path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { ALL_LESSON_UNITS, selectUnits } from "../src/remotion/lesson/registry";
import { CLIPS_BY_UNIT } from "../src/remotion/lesson/voice-manifest";
import * as T from "../src/remotion/lesson/timeline";

const FPS = T.FPS;
const VOICE = "ramlah";
const LAG = 0.25; // s after the word — what the viewer sees while hearing it
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
if (!outDir) { console.error("usage: tsx scripts/render-sync-stills.ts <outDir> [unit …]"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
let units = selectUnits(process.argv.slice(3));
if (process.argv.length <= 3) {
  const seen: Record<string, number> = {};
  units = ALL_LESSON_UNITS.filter((u) => (seen[u.comp] = (seen[u.comp] ?? 0) + 1) <= 2);
}

async function main() {
  console.log(`bundling…`);
  const serveUrl = await bundle({ entryPoint: path.resolve("src/remotion/index.ts"), webpackOverride: (c) => c });
  const index: string[] = [`# Sync stills — ${units.length} units\n`, `Each still is taken ${LAG}s after the narrator says the number. Judge: is the visual for that number on screen (present), not yet (late), or long gone / never (early / absent)?\n`];
  let count = 0;
  for (const u of units) {
    const timings = BY_COMP[u.comp]?.(u.id, VOICE);
    if (!timings) { console.log(`skip ${u.id}: no timings for ${u.comp}`); continue; }
    const clips = CLIPS_BY_UNIT[u.id]?.[VOICE] ?? [];
    const lines = u.lines();
    const inputProps = { unit: u.id, voice: VOICE };
    let composition;
    try { composition = await selectComposition({ serveUrl, id: u.comp, inputProps }); }
    catch (e: any) { console.log(`skip ${u.id}: ${e?.message ?? e}`); continue; }
    const dir = path.join(outDir, u.id); fs.mkdirSync(dir, { recursive: true });
    index.push(`\n## ${u.id} (${u.comp})`);
    for (const t of timings) {
      const clip = clips.find((c) => c.id === t.id);
      const line = lines.find((l: any) => l.id === t.id);
      index.push(`\n### scene "${t.id}" — ${((t.dur) / FPS).toFixed(2)}s\n> ${(line?.text ?? "").replace(/\s+/g, " ")}\n`);
      const shots: { name: string; frame: number; label: string }[] = [];
      for (const w of clip?.numberTimes ?? []) {
        const frame = Math.min(t.from + t.dur - 1, t.from + Math.round((w.s + LAG) * FPS));
        shots.push({ name: `${t.id}__${w.n}@${w.s.toFixed(2)}.png`, frame, label: `narrator says **${w.n}** at ${w.s.toFixed(2)}s` });
      }
      const endS = clip ? clip.durationInSeconds : t.dur / FPS;
      shots.push({ name: `${t.id}__end@${endS.toFixed(2)}.png`, frame: Math.min(t.from + t.dur - 1, t.from + Math.round(endS * FPS)), label: `end of narration (${endS.toFixed(2)}s)` });
      for (const s of shots) {
        const file = path.join(dir, s.name);
        if (!fs.existsSync(file)) {
          await renderStill({ composition, serveUrl, output: file, frame: s.frame, inputProps, imageFormat: "png", scale: 0.5 });
          count++;
        }
        index.push(`- ${s.label} → \`${u.id}/${s.name}\` (frame ${s.frame})`);
      }
    }
    console.log(`${u.id}: done`);
    fs.writeFileSync(path.join(outDir, "index.md"), index.join("\n"), "utf8");
  }
  fs.writeFileSync(path.join(outDir, "index.md"), index.join("\n"), "utf8");
  console.log(`\n${count} stills rendered → ${outDir}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
