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
import { EQUAL_GROUP_UNITS, COLUMN_UNITS, TEN_FRAME_UNITS, DEALING_UNITS, FACT_FAMILY_UNITS, AREA_UNITS, CURRICULUM_TEN_FRAME_UNITS, CURRICULUM_FACT_FAMILY_UNITS, FRACTION_BAR_UNITS, HUNDRED_GRID_UNITS, RATIO_UNITS, BALANCE_UNITS, GRAPH_UNITS, COUNT_UNITS, COMPARE_UNITS, NUMBER_LINE_UNITS } from "../src/remotion/lesson/units";
import { lessonLines, columnLines, tenFrameLines, dealingLines, factFamilyLines, areaLines, fractionBarLines, hundredGridLines, ratioLines, balanceLines, countLines, compareLines, numberLineLines } from "../src/remotion/lesson/script";
import { graphLines } from "../src/remotion/lesson/script-graph";
import { ALL_LESSON_UNITS, selectUnits, type RegisteredUnit } from "../src/remotion/lesson/registry";
import { LESSON_VOICES, voiceIdEnvVar } from "../src/remotion/lesson/voices";
import { speakable } from "../src/lib/tts/speakable";

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
  // 0.7 (the API floor) time-stretches the audio rather than making the voice
  // speak slowly — it flattens prosody and is what made the narration sound
  // robotic. Pacing now comes from short sentences and "…" pauses in the
  // script, which cost nothing and sound natural.
  speed: 0.8,
};

interface VoiceClip {
  id: string;
  file: string;
  durationInSeconds: number;
  /** When each NUMBER in the line is spoken — the sync points a scene can
   *  animate against. Storing only numbers keeps the manifest small; they are
   *  the only words a visual ever ticks with. */
  numberTimes?: { n: number; s: number }[];
}

/** Fold ElevenLabs' per-character alignment into per-word start times, then
 *  keep just the numeric words. "1… 2… 3" arrives as characters with times;
 *  a word's start is its first character's start. */
function numberTimesFrom(
  chars: string[],
  starts: number[],
): { n: number; s: number }[] {
  const out: { n: number; s: number }[] = [];
  let word = "";
  let wordStart = 0;
  const flush = () => {
    // Strip punctuation but keep an INNER dot (decimals). A sentence-ending
    // "10." must still count — trailing/leading dots go.
    const digits = word.replace(/[^\d.]/g, "").replace(/^\.+|\.+$/g, "");
    if (digits && /^\d+(\.\d+)?$/.test(digits)) out.push({ n: Number(digits), s: Number(wordStart.toFixed(3)) });
    word = "";
  };
  chars.forEach((c, i) => {
    if (/\s/.test(c)) return flush();
    if (!word) wordStart = starts[i] ?? 0;
    word += c;
  });
  flush();
  return out;
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
  const align = j.alignment ?? j.normalized_alignment ?? {};
  const chars: string[] = align.characters ?? [];
  const starts: number[] = align.character_start_times_seconds ?? [];
  const ends: number[] = align.character_end_times_seconds ?? [];
  if (!mp3.length) throw new Error("empty audio returned");
  return {
    mp3,
    duration: ends.length ? ends[ends.length - 1] : 0,
    numberTimes: numberTimesFrom(chars, starts),
  };
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
const ALL = ALL_LESSON_UNITS;
let units: RegisteredUnit[];
try {
  units = selectUnits(only);
} catch (e) {
  console.error(String((e as Error).message));
  process.exit(1);
}

async function main() {
  let totalSeconds = 0;
  for (const unit of units) {
    for (const voice of LESSON_VOICES) {
      // NO fallback to ELEVENLABS_VOICE_ID: that silent fallback once rebuilt
      // the entire corpus in the wrong voice (Jessica instead of Ramlah, Aug
      // 2026). A named voice resolves to its own env var or the build refuses.
      const voiceId = process.env[voiceIdEnvVar(voice.key)];
      if (!voiceId) {
        console.error(
          `Missing ${voiceIdEnvVar(voice.key)} for voice "${voice.key}" — refusing to guess a voice id. Add it to .env.local.`,
        );
        process.exit(1);
      }
      const outDir = join(ROOT, "public", "lesson-voice", unit.id, voice.key);
      mkdirSync(outDir, { recursive: true });
      console.log(`\n${unit.id} · ${voice.key} (voice id ${voiceId})`);
      const clips: VoiceClip[] = [];
      for (const line of unit.lines()) {
        process.stdout.write(`  ${line.id}… `);
        // Normalise notation to what a teacher would SAY before synthesis — the
        // app's TTS route does this, and skipping it here made the video voice
        // read "4 × 7" as "4 ex 7".
        const { mp3, duration, numberTimes } = await synthesize(speakable(line.text), voiceId);
        writeFileSync(join(outDir, `${line.id}.mp3`), mp3);
        clips.push({
          id: line.id,
          file: `lesson-voice/${unit.id}/${voice.key}/${line.id}.mp3`,
          durationInSeconds: Number(duration.toFixed(3)),
          ...(numberTimes.length ? { numberTimes } : {}),
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
    "  /** Start time of each number the narrator says — sync points for scenes. */",
    "  numberTimes?: { n: number; s: number }[];",
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
