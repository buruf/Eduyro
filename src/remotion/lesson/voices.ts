// src/remotion/lesson/voices.ts
// The narration voices a lesson video can be rendered in.
//
// Audio is baked into the MP4, so a student-selectable voice means ONE RENDER
// PER VOICE (~3MB and ~2 min of render time each). Keep this list short and
// deliberate — it multiplies against every lesson video, not just this one.
//
// Client-safe on purpose: no voice ids here, so this can be imported by the
// player UI. The generation script resolves each key to an ElevenLabs voice id
// from the environment (`main` → ELEVENLABS_VOICE_ID, any other key `foo` →
// ELEVENLABS_VOICE_ID_FOO).
//
// `key` appears in filenames and in the student's saved preference, so it must
// stay stable once shipped.
export interface LessonVoice {
  key: string;
  label: string; // what the student sees
}

export const LESSON_VOICES: LessonVoice[] = [{ key: "ramlah", label: "Ramlah" }];

export const DEFAULT_VOICE_KEY = "ramlah";

/** Env var holding the ElevenLabs voice id for a given key. */
export function voiceIdEnvVar(key: string): string {
  return `ELEVENLABS_VOICE_ID_${key.toUpperCase()}`;
}
