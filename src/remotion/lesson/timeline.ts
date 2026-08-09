// src/remotion/lesson/timeline.ts
// Scene timing for the equal-groups lesson template.
//
// The AUDIO drives the timing, not the other way round: each scene runs for at
// least its minimum, but stretches to fit its narration plus a short tail. That
// is what makes voice and picture impossible to desync — there is one clock,
// and a line can never be cut off by a scene ending early.
//
// Timing is per UNIT and per VOICE: different units have different-length
// lines, and two voices read the same script at very different speeds. Each
// combination therefore gets its own render and its own total duration.
import { LINE_IDS, COLUMN_LINE_IDS } from "./script";
import { CLIPS_BY_UNIT } from "./voice-manifest";
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

export function sceneTimings(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): SceneTiming[] {
  const clips = CLIPS_BY_UNIT[unitId]?.[voiceKey] ?? [];
  let cursor = 0;
  return LINE_IDS.map((id) => {
    const clip = clips.find((c) => c.id === id);
    const seconds = clip
      ? Math.max(MIN_SECONDS[id] ?? 6, clip.durationInSeconds + TAIL_SECONDS)
      : (MIN_SECONDS[id] ?? 6);
    const dur = Math.round(seconds * FPS);
    const timing: SceneTiming = { id, from: cursor, dur, voiceFile: clip?.file ?? null };
    cursor += dur;
    return timing;
  });
}

export function totalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return sceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

/** Scene timing for the base-ten blocks template. Same rule: the audio drives
 *  the length, so a scene can never end mid-sentence. */
const COLUMN_MIN_SECONDS: Record<string, number> = {
  ask: 4,
  build: 6,
  regroup: 10,
  written: 6,
};

export function columnSceneTimings(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): SceneTiming[] {
  const clips = CLIPS_BY_UNIT[unitId]?.[voiceKey] ?? [];
  let cursor = 0;
  return COLUMN_LINE_IDS.map((id) => {
    const clip = clips.find((c) => c.id === id);
    const seconds = clip
      ? Math.max(COLUMN_MIN_SECONDS[id] ?? 6, clip.durationInSeconds + TAIL_SECONDS)
      : (COLUMN_MIN_SECONDS[id] ?? 6);
    const dur = Math.round(seconds * FPS);
    const timing: SceneTiming = { id, from: cursor, dur, voiceFile: clip?.file ?? null };
    cursor += dur;
    return timing;
  });
}

export function columnTotalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return columnSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}
