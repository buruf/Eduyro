// scripts/audit-video-reveals.ts — no reveal may be timed by guessing.
//
// The sync audit (docs/VIDEO-SYNC-AUDIT.md) found every template timing its
// reveals by a fraction of the scene ("secondAt = Math.round(dur * 0.52)")
// or a fixed frame, while the narrator reaches the number wherever the
// recording put it. Reveals that show a NUMBER must be timed with the scene's
// `said(n, fallback)` (timeline.ts `saidFor`). This gate fails on:
//
//   1. a fraction-of-scene reveal (`dur * 0.` / `dur / 2` …) anywhere in a
//      template, unless that line carries `// not-speech-bound` — a title,
//      a transition, a pause that genuinely has no number to follow;
//   2. a template that never calls `said(` at all, unless the file carries
//      `// no-number-reveals` near the top — a template whose scenes reveal
//      nothing a narrator counts.
//
// It is deliberately a text check: it cannot judge WHICH number a reveal
// belongs to (the stills review does that), but it guarantees the guessing
// pattern cannot come back.
//   npx tsx scripts/audit-video-reveals.ts
import * as fs from "fs";
import * as path from "path";

const dir = path.join("src", "remotion", "lesson");
const files = fs.readdirSync(dir).filter((f) => /Video\.tsx$/.test(f)).sort();
const FRACTION = /\bdur\s*\*\s*0?\.\d+|\bdur\s*\/\s*\d|Math\.round\(\s*dur\s*\*|\bdur\s*-\s*\d+\s*\)\s*\*\s*0?\./;
const issues: string[] = [];
let converted = 0;

for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), "utf8");
  const lines = src.split("\n");
  const exempt = /\/\/\s*no-number-reveals/.test(src.slice(0, 2000));
  const usesSaid = /\bsaid\(/.test(src);
  if (usesSaid) converted++;
  if (!usesSaid && !exempt) issues.push(`${f}: never calls said(n, fallback) — reveals are not timed to speech (add // no-number-reveals if truly none)`);
  lines.forEach((line, i) => {
    if (FRACTION.test(line) && !/not-speech-bound/.test(line) && !/^\s*\/\//.test(line)) {
      issues.push(`${f}:${i + 1}: reveal timed by a fraction of the scene — use said(n, fallback) or mark // not-speech-bound\n      ${line.trim().slice(0, 110)}`);
    }
  });
}

for (const i of issues) console.log(`  ⚠ ${i}`);
console.log(`\n${issues.length ? "❌" : "✅"} reveals: ${files.length} templates, ${converted} use said(), ${issues.length} issue(s)`);
if (issues.length) process.exit(1);
