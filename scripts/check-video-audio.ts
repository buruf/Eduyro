// scripts/check-video-audio.ts
// The "missing 8" gate. For every lesson unit's narration line, every number
// the SCRIPT says must exist as an aligned spoken token in the synthesized
// clip (voice-manifest numberTimes, built from ElevenLabs word timestamps).
// A number in the text with no aligned token means the voice skipped or
// blurred it — the exact defect a child hears as "the narrator forgot the 8".
//
// Also flags blur risk: two consecutive numbers spoken < MIN_GAP seconds
// apart tend to smear together at 0.8 speed ("7… 8" → "seventy-eight").
//
//   npx tsx scripts/check-video-audio.ts            # all units
//   npx tsx scripts/check-video-audio.ts unit-id …  # subset
import { ALL_LESSON_UNITS, selectUnits } from "../src/remotion/lesson/registry";
import { CLIPS_BY_UNIT } from "../src/remotion/lesson/voice-manifest";
import { speakable } from "../src/lib/tts/speakable";

const MIN_GAP = 0.35; // seconds between consecutive spoken numbers
const VOICE = "ramlah";

/** Numbers the narration text commits to saying, in speakable form (so "x²"
 *  → "x squared" doesn't contribute a 2). */
function textNumbers(text: string): number[] {
  return (speakable(text).match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

const units = selectUnits(process.argv.slice(2));
let failures = 0;
let blurWarnings = 0;
let missingClips = 0;

for (const u of units) {
  const clips = CLIPS_BY_UNIT[u.id]?.[VOICE];
  if (!clips) {
    console.log(`SKIP  ${u.id} — no clips in manifest`);
    missingClips++;
    continue;
  }
  for (const line of u.lines()) {
    const clip = clips.find((c) => c.id === line.id);
    if (!clip) {
      console.log(`FAIL  ${u.id}/${line.id} — line has no clip`);
      failures++;
      continue;
    }
    if (!clip.numberTimes) continue; // legacy clip without alignment
    const expected = textNumbers(line.text);
    const spoken = clip.numberTimes.map((t) => t.n);
    // Multiset containment: each expected occurrence needs a spoken token.
    const pool = [...spoken];
    const missing: number[] = [];
    for (const n of expected) {
      const i = pool.indexOf(n);
      if (i === -1) missing.push(n);
      else pool.splice(i, 1);
    }
    if (missing.length) {
      console.log(`FAIL  ${u.id}/${line.id} — narration says ${missing.join(", ")} but audio has no aligned token for it`);
      console.log(`      text: ${line.text.slice(0, 110)}`);
      failures++;
    }
    // Blur risk: adjacent number tokens too close together.
    const times = [...(clip.numberTimes ?? [])].sort((a, b) => a.s - b.s);
    for (let i = 1; i < times.length; i++) {
      const gap = times[i].s - times[i - 1].s;
      if (gap < MIN_GAP) {
        console.log(`WARN  ${u.id}/${line.id} — "${times[i - 1].n}" and "${times[i].n}" only ${Math.round(gap * 1000)}ms apart (blur risk)`);
        blurWarnings++;
      }
    }
  }
}

console.log(`\n${units.length} units checked (${missingClips} without clips): ${failures} failures, ${blurWarnings} blur warnings.`);
process.exit(failures ? 1 : 0);
