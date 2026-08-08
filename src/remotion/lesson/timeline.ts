// src/remotion/lesson/timeline.ts
// Scene timing for the 20 × 3 explainer.
//
// The AUDIO drives the timing, not the other way round: each scene runs for at
// least its minimum, but stretches to fit its narration plus a short tail. That
// is what makes voice and picture impossible to desync — there is one clock,
// and a line can never be cut off by a scene ending early.
import { LESSON_LINES } from "./script";
import { VOICE_CLIPS } from "./voice-manifest";

export const FPS = 30;

/** Minimum on-screen time per scene, in seconds, used when there is no voice. */
// Floors for the silent case only. Keep them BELOW the spoken lengths, or a
// minimum longer than its clip pads the scene with dead air.
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

export const SCENES: SceneTiming[] = (() => {
  let cursor = 0;
  return LESSON_LINES.map((line) => {
    const clip = VOICE_CLIPS.find((c) => c.id === line.id);
    const seconds = clip
      ? Math.max(MIN_SECONDS[line.id] ?? 6, clip.durationInSeconds + TAIL_SECONDS)
      : MIN_SECONDS[line.id] ?? 6;
    const dur = Math.round(seconds * FPS);
    const timing: SceneTiming = { id: line.id, from: cursor, dur, voiceFile: clip?.file ?? null };
    cursor += dur;
    return timing;
  });
})();

export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + s.dur, 0);

export function sceneById(id: string): SceneTiming {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`No scene timing for "${id}"`);
  return s;
}
