// src/remotion/lesson/timeline.ts
// Scene timing for the 20 × 3 explainer.
//
// The AUDIO drives the timing, not the other way round: each scene runs for at
// least its minimum, but stretches to fit its narration plus a short tail. That
// is what makes voice and picture impossible to desync — there is one clock,
// and a line can never be cut off by a scene ending early.
//
// Timing is per VOICE, because two voices read the same script at very
// different lengths (Jessica ~52s, Ramlah ~32s). Each voice therefore gets its
// own render, and its own total duration.
import { LESSON_LINES } from "./script";
import { VOICE_CLIPS_BY_VOICE } from "./voice-manifest";
import { DEFAULT_VOICE_KEY } from "./voices";

export const FPS = 30;

/** Floors for the silent case only. Keep them BELOW the spoken lengths, or a
 *  minimum longer than its clip pads the scene with dead air. */
const MIN_SECONDS: Record<string, number> = {
  ask: 4,
  groups: 8,
  count: 9,
  trick: 9,
};

/** Silence after a line finishes, so scenes don't cut on the last syllable. */
const TAIL_SECONDS = 0.8;

export interface SceneTiming {
  id: string;
  from: number; // start frame
  dur: number; // frames
  voiceFile: string | null;
}

export function sceneTimings(voiceKey: string = DEFAULT_VOICE_KEY): SceneTiming[] {
  const clips = VOICE_CLIPS_BY_VOICE[voiceKey] ?? [];
  let cursor = 0;
  return LESSON_LINES.map((line) => {
    const clip = clips.find((c) => c.id === line.id);
    const seconds = clip
      ? Math.max(MIN_SECONDS[line.id] ?? 6, clip.durationInSeconds + TAIL_SECONDS)
      : (MIN_SECONDS[line.id] ?? 6);
    const dur = Math.round(seconds * FPS);
    const timing: SceneTiming = {
      id: line.id,
      from: cursor,
      dur,
      voiceFile: clip?.file ?? null,
    };
    cursor += dur;
    return timing;
  });
}

export function totalFrames(voiceKey: string = DEFAULT_VOICE_KEY): number {
  return sceneTimings(voiceKey).reduce((n, s) => n + s.dur, 0);
}
