// scripts/build-lesson-voice.ts
// Synthesizes lesson narration into public/lesson-voice/<unit>/<voice>/*.mp3
// and regenerates src/remotion/lesson/voice-manifest.ts with the real clip
// durations, so each video's scenes stretch to fit its own narration.
//
//   npx tsx scripts/build-lesson-voice.ts                 # every unit
//   npx tsx scripts/build-lesson-voice.ts mul-skip mul-3-4  # named units
//
// Needs ELEVENLABS_API_KEY in .env.local (sensitive in Vercel, so it cannot be
// pulled) and ELEVENLABS_VOICE_ID_<VOICE> per voice — or ELEVENLABS_VOICE_ID
// as a fallback when only one voice is configured.
//
// Narration comes from src/remotion/lesson/script.ts, the same module the
// video renders from, so the spoken lines and the on-screen numbers can never
// drift out of agreement.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EQUAL_GROUP_UNITS, COLUMN_UNITS } from "../src/remotion/lesson/units";
import { lessonLines, columnLines } from "../src/remotion/lesson/script";
import { LESSON_VOICES, voiceIdEnvVar } from "../src/remotion/lesson/voices";

const ROOT = process.cwd();
const MANIFEST = join(ROOT, "src", "remotion", "lesson", "voice-manifest.ts");

for (const file of [".env.local", ".env"]) {
  const p = join(ROOT, file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5";
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env.local.");
  process.exit(1);
}

/** Matches VOICE_PRESETS.lively in src/lib/tts/elevenlabs.ts. */
const VOICE_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.85,
  style: 0.45,
  use_speaker_boost: true,
  speed: 0.7,
};

interface VoiceClip {
  id: string;
  file: string;
  durationInSeconds: number;
}

async function synthesize(text: string, voiceId: string) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY as string,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as Record<string, any>;
  const mp3 = Buffer.from(j.audio_base64 ?? j.audio ?? "", "base64");
  const ends: number[] =
    j.alignment?.character_end_times_seconds ??
    j.normalized_alignment?.character_end_times_seconds ??
    [];
  if (!mp3.length) throw new Error("empty audio returned");
  return { mp3, duration: ends.length ? ends[ends.length - 1] : 0 };
}

// Merge into whatever already exists — building one unit must never drop
// another unit's clips.
let byUnit: Record<string, Record<string, VoiceClip[]>> = {};
if (existsSync(MANIFEST)) {
  const prev = readFileSync(MANIFEST, "utf8");
  const start = prev.indexOf("= {", prev.indexOf("CLIPS_BY_UNIT"));
  const end = prev.lastIndexOf("};");
  if (start !== -1 && end > start) {
    try {
      byUnit = JSON.parse(prev.slice(start + 2, end + 1));
    } catch {
      console.warn("(could not parse existing manifest — rewriting)");
    }
  }
}

const only = process.argv.slice(2);
const ALL = [
  ...EQUAL_GROUP_UNITS.map((u) => ({ id: u.id, lines: () => lessonLines(u) })),
  ...COLUMN_UNITS.map((u) => ({ id: u.id, lines: () => columnLines(u) })),
];
const units = only.length ? ALL.filter((u) => only.includes(u.id)) : ALL;
if (!units.length) {
  console.error(`No matching units. Known: ${ALL.map((u) => u.id).join(", ")}`);
  process.exit(1);
}

async function main() {
  let totalSeconds = 0;
  for (const unit of units) {
    for (const voice of LESSON_VOICES) {
      const voiceId = process.env[voiceIdEnvVar(voice.key)] ?? process.env.ELEVENLABS_VOICE_ID;
      if (!voiceId) {
        console.error(`Missing ${voiceIdEnvVar(voice.key)} for voice "${voice.key}".`);
        process.exit(1);
      }
      const outDir = join(ROOT, "public", "lesson-voice", unit.id, voice.key);
      mkdirSync(outDir, { recursive: true });
      console.log(`\n${unit.id} · ${voice.key}`);
      const clips: VoiceClip[] = [];
      for (const line of unit.lines()) {
        process.stdout.write(`  ${line.id}… `);
        const { mp3, duration } = await synthesize(line.text, voiceId);
        writeFileSync(join(outDir, `${line.id}.mp3`), mp3);
        clips.push({
          id: line.id,
          file: `lesson-voice/${unit.id}/${voice.key}/${line.id}.mp3`,
          durationInSeconds: Number(duration.toFixed(3)),
        });
        totalSeconds += duration;
        console.log(`${duration.toFixed(1)}s`);
      }
      byUnit[unit.id] = { ...(byUnit[unit.id] ?? {}), [voice.key]: clips };
    }
  }

  const header = [
    "// src/remotion/lesson/voice-manifest.ts",
    "// GENERATED by scripts/build-lesson-voice.ts — do not hand-edit.",
    "export interface VoiceClip {",
    "  id: string;",
    "  file: string; // relative to public/",
    "  durationInSeconds: number;",
    "}",
    "",
    "/** unit id → voice key → that voice's clips for the unit. */",
    "export const CLIPS_BY_UNIT: Record<string, Record<string, VoiceClip[]>> =",
  ].join("\n");

  writeFileSync(MANIFEST, `${header} ${JSON.stringify(byUnit, null, 2)};\n`);

  console.log(`\nGenerated ${units.length} unit(s), ${totalSeconds.toFixed(0)}s of speech.`);
  console.log(`Units in manifest: ${Object.keys(byUnit).join(", ")}`);
  console.log(`Render:  npx tsx scripts/render-lessons.ts ${units.map((u) => u.id).join(" ")}`);

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
