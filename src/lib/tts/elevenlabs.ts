// src/lib/tts/elevenlabs.ts
// Text-to-speech via ElevenLabs, using the owner's CLONED voice. Feature is
// fully env-gated: with no key/voice configured, isTtsEnabled() is false and the
// narration UI stays silent — nothing breaks.
//
// Required env (set in Vercel + .env):
//   ELEVENLABS_API_KEY   — your ElevenLabs API key
//   ELEVENLABS_VOICE_ID  — the voice ID of your Instant Voice Clone
//   ELEVENLABS_MODEL_ID  — optional (default "eleven_turbo_v2_5", cheap + fast)

const API_KEY = process.env.ELEVENLABS_API_KEY;
export const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "";
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5";

export function isTtsEnabled(): boolean {
  return Boolean(API_KEY && VOICE_ID);
}

// Delivery presets. `lesson` is the original warm, deliberately-slow read for
// explanatory narration. `lively` is for short story beats ("Oh no! The bag
// fell!") — at 0.88 speed with almost no style those drawl and sound robotic,
// which is the opposite of excited; near-natural pace plus more style variance
// makes them land as speech rather than recitation.
export const VOICE_PRESETS = {
  lesson: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true, speed: 0.88 },
  // `speed` is the dial to turn if narration feels rushed or draggy. 1.0 was
  // too fast for a child following an explanation; the expressiveness that
  // stops it sounding recited comes from `style`, not from pace.
  lively: { stability: 0.45, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true, speed: 0.7 },
} as const;

export type VoicePreset = keyof typeof VOICE_PRESETS;

/**
 * Cache-key fragment for a preset. Clips are cached forever, so changing a
 * preset's settings has to change the key or every already-synthesized line
 * keeps playing at the OLD delivery and the edit looks like it did nothing.
 * `lesson` returns "" to preserve the keys its existing clips are stored under.
 */
export function presetCacheKey(preset: VoicePreset): string {
  if (preset === "lesson") return "";
  const s = VOICE_PRESETS[preset];
  return `${preset}:${s.stability}:${s.style}:${s.speed}|`;
}

// Word-level timing for read-along highlighting. `words[i]` is spoken from
// startsSec[i] to endsSec[i] (seconds into the audio).
export interface Alignment { words: string[]; startsSec: number[]; endsSec: number[] }

// Synthesize `text` to mp3 bytes in the configured voice. Throws on API error.
export async function synthesizeSpeech(text: string, preset: VoicePreset = "lesson"): Promise<Buffer> {
  if (!isTtsEnabled()) throw new Error("TTS not configured");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_PRESETS[preset] }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// Synthesize AND get character-level timestamps, folded into WORD timings for
// read-along highlighting. Uses the /with-timestamps endpoint (returns base64
// audio + per-character start/end times). Falls back to no alignment on shape
// changes so narration never breaks.
export async function synthesizeSpeechWithTimestamps(text: string, preset: VoicePreset = "lesson"): Promise<{ mp3: Buffer; alignment: Alignment | null }> {
  if (!isTtsEnabled()) throw new Error("TTS not configured");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_PRESETS[preset] }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 200)}`);
  }
  const j: any = await res.json();
  const mp3 = Buffer.from(j.audio_base64 ?? j.audio ?? "", "base64");
  const al = j.alignment ?? j.normalized_alignment;
  return { mp3, alignment: al ? foldCharsToWords(al) : null };
}

// Collapse ElevenLabs' per-character alignment into per-WORD timings (split on
// whitespace; a word spans from its first char's start to its last char's end).
function foldCharsToWords(al: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }): Alignment | null {
  const chars = al.characters, starts = al.character_start_times_seconds, ends = al.character_end_times_seconds;
  if (!Array.isArray(chars) || !Array.isArray(starts) || !Array.isArray(ends)) return null;
  const words: string[] = [], startsSec: number[] = [], endsSec: number[] = [];
  let cur = "", curStart = -1, curEnd = 0;
  const flush = () => { if (cur) { words.push(cur); startsSec.push(curStart); endsSec.push(curEnd); cur = ""; curStart = -1; } };
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (/\s/.test(c)) { flush(); continue; }
    if (curStart < 0) curStart = starts[i] ?? curEnd;
    cur += c;
    curEnd = ends[i] ?? curEnd;
  }
  flush();
  return words.length ? { words, startsSec, endsSec } : null;
}
