// src/remotion/lesson/EqualGroupsVideo.tsx
// The EQUAL GROUPS lesson template: "a × b means b groups of a".
//
// Four scenes, one idea each — what the question asks, the groups laid out,
// counting them into an equation, and the unit's own shortcut. Every number
// shown or spoken comes from the unit (src/remotion/lesson/units.ts), never
// from this file, so one template serves many units without leaking another
// unit's digits into a lesson.
//
// Scene lengths come from the narration clip durations, so picture and voice
// share one clock and cannot drift apart.
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { sceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { unitById, unitNumbers, type LessonUnit } from "./units";

export { FPS } from "./timeline";

export type EqualGroupsProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const MUTED = "#8A7A5E";

interface SceneProps {
  dur: number;
  voice: string;
  unit: LessonUnit;
  /** Scene-local frame at which the narrator says a number (timeline.ts
   *  `saidFor`). Every reveal that shows something she counts or names is
   *  timed with this, never with a fraction of the scene. */
  said: SaidFn;
}

/** Fade + slight rise — the only entrance used anywhere in the video. */
function useEnter(atFrame: number, durFrames = 14) {
  const frame = useCurrentFrame();
  return {
    opacity: interpolate(frame, [atFrame, atFrame + durFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    translateY: interpolate(frame, [atFrame, atFrame + durFrames], [18, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
  };
}

/**
 * Safe drawing width inside the 1920 frame. The 80px margin in the layout
 * guidance is quoted for a 1080-wide video, which is ~142px here — and players
 * crop, so edge-hugging content is the first thing lost.
 */
const SAFE_W = 1640;

/**
 * Dots sized from BOTH the group size and the NUMBER of groups, so the row
 * always fits the frame. Sizing on `a` alone overflowed as soon as a unit had
 * many groups (7 groups of 4 ran off both edges).
 */
function dotMetrics(a: number, b: number) {
  const cols = Math.min(a, 10);
  const groupGap = b > 4 ? 44 : 100;
  // width(size) = b·size·(cols + 0.38·(cols−1)) + (b−1)·groupGap
  const perGroupUnits = cols + 0.38 * (cols - 1);
  const available = SAFE_W - (b - 1) * groupGap;
  const fitted = Math.floor(available / (b * perGroupUnits));
  const size = Math.max(12, Math.min(a > 12 ? 30 : a > 6 ? 40 : 48, fitted));
  return { cols, size, gap: Math.round(size * 0.38), groupGap };
}


/**
 * The times sign, set as an OPERATOR rather than a character: smaller, lighter
 * and generously spaced. At full size and weight in a serif face, U+00D7 reads
 * as a lowercase `x` — which is the wrong lesson for a child who will later
 * meet x as a variable.
 */
function Times() {
  return (
    <span style={{ fontSize: "0.62em", color: MUTED, margin: "0 0.28em", verticalAlign: "0.06em" }}>
      ×
    </span>
  );
}

/** One group of `a` dots, laid out in rows of at most ten. */
function GroupOfN({ a, b, appearAt }: { a: number; b: number; appearAt: number }) {
  const frame = useCurrentFrame();
  const { cols, size, gap } = dotMetrics(a, b);
  const rows = Math.ceil(a / cols);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ display: "flex", gap }}>
          {Array.from({ length: Math.min(cols, a - r * cols) }, (_, i) => {
            // Dots land one after another, so a group is visibly counted out
            // rather than appearing as a block.
            const at = appearAt + (r * cols + i) * 2;
            return (
              <div
                key={i}
                style={{
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  backgroundColor: r % 2 === 0 ? GOLD : BLUE,
                  opacity: interpolate(frame, [at, at + 6], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  scale: String(
                    interpolate(frame, [at, at + 8], [0.4, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                    }),
                  ),
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---- Scene 1: what the question asks -------------------------------------
function SceneAsk({ unit, said }: SceneProps) {
  // "So… what does 5 × 6 actually mean?" — the expression lands on the first
  // number she says (a), the question once she has reached b.
  const a = useEnter(said(unit.a, 6));
  const b = useEnter(said(unit.b, 38, -1));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 190,
          fontWeight: 800,
          color: INK,
          opacity: a.opacity,
          translate: `0 ${a.translateY}px`,
        }}
      >
        {unit.a}<Times />{unit.b}
      </div>
      <div
        style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}
      >
        What does this mean?
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the groups laid out ----------------------------------------
function SceneGroups({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  // "It means 6 groups of 5." — the title names b first.
  const title = useEnter(said(unit.b, 4));
  // Even spread over the scene: the fallback for clips without alignment.
  const span = 0.78 / unit.b;
  const evenAt = (g: number) => Math.round(dur * (0.12 + g * span)); // not-speech-bound: fallback only
  // "Let's put them out… one group of 5. And another. Keep going." — only the
  // FIRST group is named (the last time she says a; the earlier a is the
  // title's "groups of 5"). The rest are not spoken, so they fill the remaining
  // scene evenly from that moment, leaving room for the last group's label.
  const firstAt = said(unit.a, evenAt(0), -1);
  const step = Math.max(12, Math.round((dur - 44 - firstAt) / unit.b));
  const groupAt = (g: number) => firstAt + g * step;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 56 }}>
      <div
        style={{
          fontSize: 112,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {unit.b} groups of {unit.a}
      </div>
      <div style={{ display: "flex", gap: dotMetrics(unit.a, unit.b).groupGap, alignItems: "flex-start" }}>
        {Array.from({ length: unit.b }, (_, g) => (
          <div key={g} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <GroupOfN a={unit.a} b={unit.b} appearAt={groupAt(g)} />
            <div
              style={{
                fontSize: unit.b > 5 ? 56 : 86,
                fontWeight: 800,
                color: GOLD,
                opacity: interpolate(frame, [groupAt(g) + 30, groupAt(g) + 42], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {unit.a}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 3: count them into an equation --------------------------------
function SceneCount({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // "Count them up" — not-speech-bound
  const { a, b, product, running } = unitNumbers(unit);
  // Each group stays labelled `a`, because that is what it holds. The running
  // total lives in the EQUATION, where it is a result rather than a label on a
  // group — under the groups it would read as "this group has 40".
  //
  // A group lights exactly when its running total is SPOKEN ("5, 10, 15…") —
  // FIRST mention: in this line the count comes first and the written sum
  // repeats the same numbers afterwards. The even spread is the fallback for
  // clips without timestamps.
  const countAt = (g: number) =>
    said(running[g], Math.round(dur * (0.14 + g * (0.5 / b))), 0); // not-speech-bound: fallback only
  // The × line flashes when the narrator reaches the product's LAST mention —
  // the "which is 30" that closes the written sum, just before "5 × 6 means
  // exactly the same thing".
  const multiplyAt = said(product, Math.round(dur * 0.82), -1); // not-speech-bound: fallback only
  const stage = Array.from({ length: b }, (_, g) => g).reduce(
    (n, g) => (frame >= countAt(g) ? g + 1 : n),
    0,
  );
  // Past six terms the written-out sum is noise rather than insight, so show
  // the running total instead — matching what the narration says.
  // Even at 7+ groups the written-out sum still fits the frame at a smaller
  // size, and it is the whole bridge from counting to multiplying — replacing
  // it with a bare running total left an unexplained number floating there.
  const compact = b > 8;
  const equation =
    stage === 0
      ? ""
      : compact
        ? `${running[stage - 1]}`
        : stage === 1
          ? `${a}`
          : `${Array(stage).fill(a).join(" + ")} = ${running[stage - 1]}`;
  const stageStart = stage > 0 ? countAt(stage - 1) : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 48 }}>
      <div
        style={{
          fontSize: 112,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Count them up
      </div>
      <div style={{ display: "flex", gap: dotMetrics(a, b).groupGap, alignItems: "flex-start" }}>
        {Array.from({ length: b }, (_, g) => {
          const lit = interpolate(frame, [countAt(g), countAt(g) + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={g} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <div style={{ opacity: 0.35 + 0.65 * lit }}>
                <GroupOfN a={a} b={b} appearAt={-200} />
              </div>
              <div
                style={{
                  fontSize: b > 5 ? 56 : 86,
                  fontWeight: 800,
                  color: GOLD,
                  opacity: 0.4 + 0.6 * lit,
                }}
              >
                {a}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          // The written sum grows with the number of groups; shrink it so
          // "4 + 4 + 4 + 4 + 4 + 4 + 4 = 28" still sits inside the safe area.
          fontSize: compact ? 104 : b >= 7 ? 68 : b >= 5 ? 78 : 88,
          fontWeight: 700,
          color: MUTED,
          height: 110,
          display: "flex",
          alignItems: "center",
          opacity: interpolate(frame, [stageStart, stageStart + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {equation}
      </div>
      <div
        style={{
          fontSize: 100,
          fontWeight: 800,
          color: INK,
          opacity: interpolate(frame, [multiplyAt, multiplyAt + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: String(
            interpolate(frame, [multiplyAt, multiplyAt + 16], [0.85, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            }),
          ),
        }}
      >
        {a}<Times />{b} = {product}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the unit's shortcut ----------------------------------------
function SceneTrick({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // "The shortcut" — not-speech-bound
  const numbers = unitNumbers(unit);
  const { a, b, product } = numbers;
  // The caption states the shortcut ("Skip count by 5s", "Double, then double
  // again", "Cover the zero…"). Each trick line opens on a different number
  // (5 / 7 / 2 / 1 / 12 …), so the caption lands on whichever of the unit's
  // numbers the narrator says FIRST in this line.
  const fallback = Math.round(dur * 0.42); // not-speech-bound: fallback only
  const candidates = Object.values(numbers).filter((n): n is number => typeof n === "number");
  const revealAt = Math.min(fallback, ...candidates.map((n) => said(n, Number.POSITIVE_INFINITY)));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 64 }}>
      <div
        style={{
          fontSize: 112,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {unit.trick ? "The shortcut" : "So remember"}
      </div>
      <div style={{ fontSize: 170, fontWeight: 800, color: INK }}>
        {a}<Times />{b} = {product}
      </div>
      {unit.trick && (
        <div
          style={{
            fontSize: 60,
            color: BLUE,
            fontWeight: 700,
            opacity: interpolate(frame, [revealAt, revealAt + 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {unit.trick.caption}
        </div>
      )}
    </AbsoluteFill>
  );
}

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  groups: SceneGroups,
  count: SceneCount,
  trick: SceneTrick,
};

export const EqualGroupsVideo: React.FC<EqualGroupsProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = unitById(unitId);
  const scenes = sceneTimings(unitId, voice);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
        // Everything above is authored for a 1920-wide frame.
        scale: String(width / 1920),
      }}
    >
      {scenes.map((scene) => {
        const Body = SCENE_BODIES[scene.id];
        const said = saidFor(unit.id, voice, scene.id);
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {/* Voice and picture share this Sequence's clock, so the line
                always starts exactly when its scene does. */}
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} unit={unit} voice={voice} said={said} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
