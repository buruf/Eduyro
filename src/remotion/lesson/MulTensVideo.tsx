// src/remotion/lesson/MulTensVideo.tsx
// A short, plain explainer for 20 × 3. Four scenes, one idea each:
//   1. what 20 × 3 asks        2. three groups of 20
//   3. count them: 20, 40, 60   4. the shortcut: 2×3=6, put the zero back
// Scene lengths come from ./timeline (derived from the narration clips), so
// picture and voice share one clock and cannot drift apart.
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

/** Which narration voice this render bakes in. The index signature is what
 *  lets Remotion's <Composition> accept these as input props. */
export type MulTensProps = {
  voice: string;
  [key: string]: unknown;
};

export { FPS } from "./timeline";

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const MUTED = "#8A7A5E";

// Scene timing lives in ./timeline, derived from the narration clip lengths —
// so a scene can never end before its line has finished being spoken.

/** Scenes are told how long they are so their beats can scale to the voice. */
interface SceneProps {
  dur: number;
}

/** Fade + slight rise, the only entrance used anywhere in the video. */
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

/** One group of 20 dots: two rows of ten, gold over blue. */
function GroupOf20({ appearAt }: { appearAt: number }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[GOLD, BLUE].map((colour, row) => (
        <div key={row} style={{ display: "flex", gap: 10 }}>
          {Array.from({ length: 10 }, (_, i) => {
            // Dots land one after another, so each group is visibly counted
            // out rather than appearing as a block.
            const at = appearAt + (row * 10 + i) * 2;
            return (
              <div
                key={i}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: colour,
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
function SceneAsk() {
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
        20 × 3
      </div>
      <div
        style={{
          fontSize: 78,
          color: MUTED,
          opacity: b.opacity,
          translate: `0 ${b.translateY}px`,
        }}
      >
        What does this mean?
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: three groups of twenty -------------------------------------
function SceneGroups({ dur }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  // Beats are FRACTIONS of the scene, not fixed frames: the scene stretches to
  // fit its narration, so fixed beats would finish early and leave the picture
  // sitting still while the voice keeps talking. Groups land near "here's one
  // group" / "now another one" / "and one more".
  const groupAt = (g: number) => Math.round(dur * (0.14 + g * 0.27));
  const labelOpacity = (g: number) =>
    interpolate(frame, [groupAt(g) + 42, groupAt(g) + 54], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
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
        3 groups of 20
      </div>
      <div style={{ display: "flex", gap: 100 }}>
        {[0, 1, 2].map((g) => (
          <div key={g} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <GroupOf20 appearAt={groupAt(g)} />
            <div
              style={{
                fontSize: 86,
                fontWeight: 800,
                color: GOLD,
                opacity: labelOpacity(g),
              }}
            >
              20
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 3: count the groups: 20, 40, 60 -------------------------------
function SceneCount({ dur }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  // Each group stays labelled 20, because that is what each group actually holds —
  // and it matches how the previous scene labelled them. The running total
  // (20 → 40 → 60) lives in the EQUATION instead, where 40 is a genuine result
  // rather than a number sitting under a group that contains 20.
  const countAt = (g: number) => Math.round(dur * (0.16 + g * 0.13));
  const multiplyAt = Math.round(dur * 0.82);
  // How much of the addition has been written: 0 none, 1 "20", 2 "20 + 20 =
  // 40", 3 the whole thing. Each step lands with the group being counted.
  const stage = [0, 1, 2].reduce((n, g) => (frame >= countAt(g) ? g + 1 : n), 0);
  const equation =
    stage >= 3 ? "20 + 20 + 20 = 60" : stage === 2 ? "20 + 20 = 40" : stage === 1 ? "20" : "";
  const stageStart = stage > 0 ? countAt(stage - 1) : 0;
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
        Count them up
      </div>
      <div style={{ display: "flex", gap: 100 }}>
        {[0, 1, 2].map((g) => {
          const at = countAt(g);
          const lit = interpolate(frame, [at, at + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={g} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <div style={{ opacity: 0.35 + 0.65 * lit }}>
                <GroupOf20 appearAt={-100} />
              </div>
              <div
                style={{
                  fontSize: 86,
                  fontWeight: 800,
                  color: GOLD,
                  // Dim until this group is the one being counted, so the eye
                  // follows the count without the number ever changing.
                  opacity: 0.4 + 0.6 * lit,
                }}
              >
                20
              </div>
            </div>
          );
        })}
      </div>
      {/* The count, written down as it happens — this is where the running
          total belongs, because here 40 is a result rather than a label on a
          group that holds 20. Fixed height so nothing shifts as it grows. */}
      <div
        style={{
          fontSize: 88,
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
      {/* …and the shorthand for it. */}
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
        20 × 3 = 60
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the shortcut ------------------------------------------------
function SceneTrick({ dur }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  // The zeros collapse on "cover up the zero" and return on "put the zero back
  // on" — as fractions of the scene, so they track the narration's length.
  const coverAt = Math.round(dur * 0.2);
  const restoreAt = Math.round(dur * 0.55);
  const zeroAnim = interpolate(
    frame,
    [coverAt - 12, coverAt, restoreAt, restoreAt + 14],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) },
  );
  const caption =
    frame < coverAt ? "There's a faster way" : frame < restoreAt ? "Cover the zero — that's just 2 × 3 = 6" : "Put the zero back — 60";
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
        The shortcut
      </div>
      <div style={{ fontSize: 170, fontWeight: 800, color: INK, display: "flex", alignItems: "center" }}>
        <span>2</span>
        <Zero anim={zeroAnim} />
        <span style={{ margin: "0 36px" }}>×</span>
        <span>3</span>
        <span style={{ margin: "0 36px" }}>=</span>
        <span>6</span>
        <Zero anim={zeroAnim} accent />
      </div>
      <div style={{ fontSize: 76, color: MUTED, height: 96 }}>{caption}</div>
    </AbsoluteFill>
  );
}

/** A zero that collapses to nothing, so the digits close up into 2 × 3 = 6. */
function Zero({ anim, accent = false }: { anim: number; accent?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        color: accent ? BLUE : INK,
        opacity: anim,
        maxWidth: `${anim * 110}px`,
        scale: String(0.6 + 0.4 * anim),
      }}
    >
      0
    </span>
  );
}

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  groups: SceneGroups,
  count: SceneCount,
  trick: SceneTrick,
};

export const MulTensVideo: React.FC<MulTensProps> = ({ voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  // Per-voice, because the same script runs to very different lengths in
  // different voices — each scene sizes itself to the line it has to cover.
  const SCENES = sceneTimings(voice);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
        // Everything above is authored for a 1920-wide frame.
        scale: String(width / 1920),
      }}
    >
      {SCENES.map((scene) => {
        const Body = SCENE_BODIES[scene.id];
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {/* Voice and picture share this Sequence's clock, so the line
                always starts exactly when its scene does. Absent until
                scripts/build-lesson-voice.mjs has produced the mp3s. */}
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
