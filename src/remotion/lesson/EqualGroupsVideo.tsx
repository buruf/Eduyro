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
import { sceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
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
  unit: LessonUnit;
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

/** Safe drawing width inside the 1920 frame (80px margins, per video layout). */
const SAFE_W = 1760;

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
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(38);
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
function SceneGroups({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  // Beats are FRACTIONS of the scene: it stretches to fit its narration, so
  // fixed frames would finish early and leave the picture sitting still.
  const span = 0.78 / unit.b;
  const groupAt = (g: number) => Math.round(dur * (0.12 + g * span));
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
function SceneCount({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const { a, b, product, running } = unitNumbers(unit);
  // Each group stays labelled `a`, because that is what it holds. The running
  // total lives in the EQUATION, where it is a result rather than a label on a
  // group — under the groups it would read as "this group has 40".
  const countAt = (g: number) => Math.round(dur * (0.14 + g * (0.5 / b)));
  const multiplyAt = Math.round(dur * 0.82);
  const stage = Array.from({ length: b }, (_, g) => g).reduce(
    (n, g) => (frame >= countAt(g) ? g + 1 : n),
    0,
  );
  // Past six terms the written-out sum is noise rather than insight, so show
  // the running total instead — matching what the narration says.
  const compact = b > 6;
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
          fontSize: compact ? 104 : 88,
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
function SceneTrick({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const { a, b, product } = unitNumbers(unit);
  const revealAt = Math.round(dur * 0.42);
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
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {/* Voice and picture share this Sequence's clock, so the line
                always starts exactly when its scene does. */}
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} unit={unit} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
