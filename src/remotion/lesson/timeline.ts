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
import { LINE_IDS, COLUMN_LINE_IDS, TEN_FRAME_LINE_IDS, DEALING_LINE_IDS, FACT_FAMILY_LINE_IDS, AREA_LINE_IDS, COUNT_LINE_IDS, COMPARE_LINE_IDS, NUMBER_LINE_LINE_IDS, FRACTION_BAR_LINE_IDS, HUNDRED_GRID_LINE_IDS, RATIO_LINE_IDS, BALANCE_LINE_IDS } from "./script";
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

/** Scene timing for the ten-frame template. */
const TEN_FRAME_MIN_SECONDS: Record<string, number> = {
  ask: 4,
  build: 6,
  strategy: 9,
  record: 6,
};

export function tenFrameSceneTimings(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): SceneTiming[] {
  const clips = CLIPS_BY_UNIT[unitId]?.[voiceKey] ?? [];
  let cursor = 0;
  return TEN_FRAME_LINE_IDS.map((id) => {
    const clip = clips.find((c) => c.id === id);
    const seconds = clip
      ? Math.max(TEN_FRAME_MIN_SECONDS[id] ?? 6, clip.durationInSeconds + TAIL_SECONDS)
      : (TEN_FRAME_MIN_SECONDS[id] ?? 6);
    const dur = Math.round(seconds * FPS);
    const timing: SceneTiming = { id, from: cursor, dur, voiceFile: clip?.file ?? null };
    cursor += dur;
    return timing;
  });
}

export function tenFrameTotalFrames(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): number {
  return tenFrameSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

/** Scene timing for the dealing (division) template. */
const DEALING_MIN_SECONDS: Record<string, number> = {
  ask: 5,
  deal: 10,
  group: 10,
  record: 6,
};

export function dealingSceneTimings(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): SceneTiming[] {
  const clips = CLIPS_BY_UNIT[unitId]?.[voiceKey] ?? [];
  let cursor = 0;
  return DEALING_LINE_IDS.map((id) => {
    const clip = clips.find((c) => c.id === id);
    const seconds = clip
      ? Math.max(DEALING_MIN_SECONDS[id] ?? 6, clip.durationInSeconds + TAIL_SECONDS)
      : (DEALING_MIN_SECONDS[id] ?? 6);
    const dur = Math.round(seconds * FPS);
    const timing: SceneTiming = { id, from: cursor, dur, voiceFile: clip?.file ?? null };
    cursor += dur;
    return timing;
  });
}

export function dealingTotalFrames(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): number {
  return dealingSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

/** Scene timing for the fact-family template. */
const FACT_FAMILY_MIN_SECONDS: Record<string, number> = {
  ask: 5,
  build: 6,
  facts: 14,
  record: 6,
};

export function factFamilySceneTimings(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): SceneTiming[] {
  const clips = CLIPS_BY_UNIT[unitId]?.[voiceKey] ?? [];
  let cursor = 0;
  return FACT_FAMILY_LINE_IDS.map((id) => {
    const clip = clips.find((c) => c.id === id);
    const seconds = clip
      ? Math.max(FACT_FAMILY_MIN_SECONDS[id] ?? 6, clip.durationInSeconds + TAIL_SECONDS)
      : (FACT_FAMILY_MIN_SECONDS[id] ?? 6);
    const dur = Math.round(seconds * FPS);
    const timing: SceneTiming = { id, from: cursor, dur, voiceFile: clip?.file ?? null };
    cursor += dur;
    return timing;
  });
}

export function factFamilyTotalFrames(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): number {
  return factFamilySceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

/** Scene timing for the area template. */
const AREA_MIN_SECONDS: Record<string, number> = {
  ask: 5,
  build: 7,
  split: 12,
  record: 7,
};

export function areaSceneTimings(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): SceneTiming[] {
  const clips = CLIPS_BY_UNIT[unitId]?.[voiceKey] ?? [];
  let cursor = 0;
  return AREA_LINE_IDS.map((id) => {
    const clip = clips.find((c) => c.id === id);
    const seconds = clip
      ? Math.max(AREA_MIN_SECONDS[id] ?? 6, clip.durationInSeconds + TAIL_SECONDS)
      : (AREA_MIN_SECONDS[id] ?? 6);
    const dur = Math.round(seconds * FPS);
    const timing: SceneTiming = { id, from: cursor, dur, voiceFile: clip?.file ?? null };
    cursor += dur;
    return timing;
  });
}

export function areaTotalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return areaSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

/** Scene timing for the three early-number templates. */
const COUNT_MIN_SECONDS: Record<string, number> = { ask: 4, count: 9, rows: 8, record: 5 };
const COMPARE_MIN_SECONDS: Record<string, number> = { ask: 4, build: 6, pair: 9, record: 5 };
const NUMBER_LINE_MIN_SECONDS: Record<string, number> = { ask: 4, line: 6, hop: 9, record: 5 };

function earlyTimings(
  ids: readonly string[],
  mins: Record<string, number>,
  unitId: string,
  voiceKey: string,
): SceneTiming[] {
  const clips = CLIPS_BY_UNIT[unitId]?.[voiceKey] ?? [];
  let cursor = 0;
  return ids.map((id) => {
    const clip = clips.find((c) => c.id === id);
    const seconds = clip
      ? Math.max(mins[id] ?? 6, clip.durationInSeconds + TAIL_SECONDS)
      : (mins[id] ?? 6);
    const dur = Math.round(seconds * FPS);
    const timing: SceneTiming = { id, from: cursor, dur, voiceFile: clip?.file ?? null };
    cursor += dur;
    return timing;
  });
}

export function countSceneTimings(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY) {
  return earlyTimings(COUNT_LINE_IDS, COUNT_MIN_SECONDS, unitId, voiceKey);
}
export function countTotalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return countSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

export function compareSceneTimings(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY) {
  return earlyTimings(COMPARE_LINE_IDS, COMPARE_MIN_SECONDS, unitId, voiceKey);
}
export function compareTotalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return compareSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

export function numberLineSceneTimings(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY) {
  return earlyTimings(NUMBER_LINE_LINE_IDS, NUMBER_LINE_MIN_SECONDS, unitId, voiceKey);
}
export function numberLineTotalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return numberLineSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

/** Scene timing for the M7/M8 templates. */
const FRACTION_BAR_MIN_SECONDS: Record<string, number> = { ask: 4, parts: 8, action: 10, record: 6 };
const HUNDRED_GRID_MIN_SECONDS: Record<string, number> = { ask: 4, grid: 7, action: 10, record: 6 };

export function fractionBarSceneTimings(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): SceneTiming[] {
  return earlyTimings(FRACTION_BAR_LINE_IDS, FRACTION_BAR_MIN_SECONDS, unitId, voiceKey);
}
export function fractionBarTotalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return fractionBarSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

export function hundredGridSceneTimings(
  unitId: string,
  voiceKey: string = DEFAULT_VOICE_KEY,
): SceneTiming[] {
  return earlyTimings(HUNDRED_GRID_LINE_IDS, HUNDRED_GRID_MIN_SECONDS, unitId, voiceKey);
}
export function hundredGridTotalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return hundredGridSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

/** Scene timing for the M9/M10 templates. */
const RATIO_MIN_SECONDS: Record<string, number> = { ask: 4, build: 7, scale: 11, record: 6 };
const BALANCE_MIN_SECONDS: Record<string, number> = { ask: 4, build: 8, solve: 12, record: 6 };

export function ratioSceneTimings(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): SceneTiming[] {
  return earlyTimings(RATIO_LINE_IDS, RATIO_MIN_SECONDS, unitId, voiceKey);
}
export function ratioTotalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return ratioSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}

export function balanceSceneTimings(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): SceneTiming[] {
  return earlyTimings(BALANCE_LINE_IDS, BALANCE_MIN_SECONDS, unitId, voiceKey);
}
export function balanceTotalFrames(unitId: string, voiceKey: string = DEFAULT_VOICE_KEY): number {
  return balanceSceneTimings(unitId, voiceKey).reduce((n, s) => n + s.dur, 0);
}
