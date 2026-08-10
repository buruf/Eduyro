// scripts/verify-lesson-videos.mts
// End-to-end check that every lesson video a student could be served actually
// exists on production AND is attached to the right unit.
//
//   npx tsx scripts/verify-lesson-videos.mts [--base https://eduyro.com]
//
// Three failures this catches, all of which are silent in the product:
//   1. a video indexed for the dashboard that isn't deployed  -> broken player
//   2. a label that drifted from the engine                   -> no video shown
//   3. a unit id the engine doesn't have                      -> never reachable
import { readFileSync } from "node:fs";
import { ALL_VIDEO_UNITS } from "../src/remotion/lesson/units";
import { DEFAULT_VOICE_KEY } from "../src/remotion/lesson/voices";

const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "https://eduyro.com";

// The engine is the authority on which practice level a unit belongs to.
const engine = readFileSync("src/lib/shop/arithmetic-engine.ts", "utf8");
const meta = new Map<string, { label: string; from: number; to: number }>();
for (const m of engine.matchAll(
  /id:"([a-z0-9-]+)", label:"([^"]+)"[\s\S]{0,400}?range:\[(\d+),(\d+)\]/g,
)) {
  if (!meta.has(m[1])) {
    meta.set(m[1], { label: m[2], from: Number(m[3]), to: Number(m[4]) });
  }
}

interface Row {
  id: string;
  level: string;
  composition: string;
  live: boolean;
  labelOk: boolean;
  inEngine: boolean;
  bytes: number;
}

async function main() {
const rows: Row[] = [];
for (const u of ALL_VIDEO_UNITS) {
  const e = meta.get(u.id);
  const url = `${base}/lesson-video/${u.id}.${DEFAULT_VOICE_KEY}.mp4`;
  let live = false;
  let bytes = 0;
  try {
    const r = await fetch(url, { headers: { Range: "bytes=0-100" } });
    live = r.status === 200 || r.status === 206;
    const cr = r.headers.get("content-range");
    bytes = cr ? Number(cr.split("/")[1]) : Number(r.headers.get("content-length") ?? 0);
  } catch {
    live = false;
  }
  rows.push({
    id: u.id,
    level: e ? `${e.from}-${e.to}` : "??",
    composition: u.composition,
    live,
    labelOk: e?.label === u.label,
    inEngine: Boolean(e),
    bytes,
  });
}

rows.sort((a, b) => a.composition.localeCompare(b.composition) || a.id.localeCompare(b.id));
for (const r of rows) {
  const flags = [
    r.live ? "live" : "DEAD",
    r.inEngine ? (r.labelOk ? "label-ok" : "LABEL-DRIFT") : "NOT-IN-ENGINE",
  ].join(" ");
  const mb = r.bytes ? (r.bytes / 1048576).toFixed(1) + "MB" : "-";
  console.log(
    `${flags.padEnd(20)} lvl ${r.level.padStart(6)}  ${r.id.padEnd(18)} ${r.composition.padEnd(12)} ${mb}`,
  );
}

const problems = rows.filter((r) => !r.live || !r.labelOk || !r.inEngine);
console.log(
  `\n${rows.length} units checked against ${base} — ${problems.length} problem(s)`,
);
if (problems.length) process.exit(1);
}

main();
