// scripts/remeasure-voice-durations.ts — make every manifest duration the
// length of the file on disk.
//
// build-lesson-voice used to record a clip's duration as the end of its last
// spoken character (what ElevenLabs alignment reports), not the length of the
// mp3. Every clip carries trailing silence beyond that, so the timeline
// thought clips were shorter than they are and the scene tail was partly
// eaten by audio (sync audit, Sep 2026). The builder now measures the file;
// this rewrites the existing manifest the same way, keeping numberTimes
// (which are alignment offsets from the clip start and stay valid).
//
//   npx tsx scripts/remeasure-voice-durations.ts          # rewrite
//   npx tsx scripts/remeasure-voice-durations.ts --check  # report only
import * as fs from "fs";
import * as path from "path";
import { CLIPS_BY_UNIT, type VoiceClip } from "../src/remotion/lesson/voice-manifest";

const CHECK = process.argv.includes("--check");
const MANIFEST = path.join("src", "remotion", "lesson", "voice-manifest.ts");

async function measured(file: string): Promise<number | null> {
  const { parseMedia } = await import("@remotion/media-parser");
  const { nodeReader } = await import("@remotion/media-parser/node");
  try {
    const r = await parseMedia({ src: file, reader: nodeReader, fields: { durationInSeconds: true }, acknowledgeRemotionLicense: true });
    return r.durationInSeconds ?? null;
  } catch { return null; }
}

async function main() {
  let changed = 0, total = 0, maxDelta = 0;
  const out: Record<string, Record<string, VoiceClip[]>> = {};
  for (const [unit, voices] of Object.entries(CLIPS_BY_UNIT)) {
    out[unit] = {};
    for (const [voice, clips] of Object.entries(voices)) {
      out[unit][voice] = [];
      for (const c of clips) {
        total++;
        const real = await measured(path.join("public", c.file));
        const next = real !== null ? Math.max(c.durationInSeconds, Number(real.toFixed(3))) : c.durationInSeconds;
        if (next !== c.durationInSeconds) { changed++; maxDelta = Math.max(maxDelta, next - c.durationInSeconds); }
        out[unit][voice].push({ ...c, durationInSeconds: next });
      }
    }
  }
  console.log(`${total} clips, ${changed} durations ${CHECK ? "would change" : "updated"} (max +${maxDelta.toFixed(2)}s)`);
  if (CHECK || !changed) return;
  const src = fs.readFileSync(MANIFEST, "utf8");
  const header = src.slice(0, src.indexOf("export const CLIPS_BY_UNIT"));
  fs.writeFileSync(MANIFEST, `${header}export const CLIPS_BY_UNIT: Record<string, Record<string, VoiceClip[]>> = ${JSON.stringify(out, null, 2)};\n`);
  console.log(`rewrote ${MANIFEST}`);
}
main();
