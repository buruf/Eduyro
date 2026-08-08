// src/remotion/lesson/MulTensVideo.tsx
// A short, plain explainer for 20 × 3. Four scenes, one idea each:
//   1. what 20 × 3 asks           (0.0-6.0s)
//   2. three bags of 20           (6.0-16.0s)
//   3. count them: 20, 40, 60     (16.0-27.0s)
//   4. the shortcut: 2×3=6, +0    (27.0-40.0s)
// Everything is frame-driven, so picture and (later) voice share one clock.
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
import { SCENES } from "./timeline";

export { FPS, TOTAL_FRAMES as DURATION } from "./timeline";

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const MUTED = "#8A7A5E";

// Scene timing lives in ./timeline, derived from the narration clip lengths —
// so a scene can never end before its line has finished being spoken.

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

/** One bag of 20 marbles: two rows of ten, gold over blue. */
function BagOf20({ appearAt }: { appearAt: number }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[GOLD, BLUE].map((colour, row) => (
        <div key={row} style={{ display: "flex", gap: 10 }}>
          {Array.from({ length: 10 }, (_, i) => {
            // Marbles land one after another, so each bag is visibly counted
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

// ---- Scene 2: three bags of twenty ---------------------------------------
function SceneBags() {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  // Each bag's "20" label appears once that bag has finished filling.
  const labelOpacity = (g: number) =>
    interpolate(frame, [30 + g * 66 + 42, 30 + g * 66 + 54], [0, 1], {
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
            <BagOf20 appearAt={30 + g * 66} />
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
function SceneCount() {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const running = [20, 40, 60];
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
          const at = 40 + g * 60;
          const lit = interpolate(frame, [at, at + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={g} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <div style={{ opacity: 0.35 + 0.65 * lit }}>
                <BagOf20 appearAt={-100} />
              </div>
              <div
                style={{
                  fontSize: 104,
                  fontWeight: 800,
                  // The last total is the answer, so it lands in the accent
                  // colour the final scene repeats.
                  color: g === 2 ? BLUE : MUTED,
                  opacity: lit,
                  scale: String(interpolate(frame, [at, at + 10], [0.6, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                  })),
                }}
              >
                {running[g]}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: INK,
          opacity: interpolate(frame, [210, 226], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        20 × 3 = 60
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the shortcut ------------------------------------------------
function SceneTrick() {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  // Beat A (~f60): the zeros collapse → 2 × 3 = 6. Beat B (~f170): back on.
  const zeroAnim = interpolate(
    frame,
    [50, 62, 168, 182],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) },
  );
  const caption =
    frame < 62 ? "There's a faster way" : frame < 170 ? "Cover the zero — that's just 2 × 3 = 6" : "Put the zero back — 60";
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

const SCENE_BODIES: Record<string, React.FC> = {
  ask: SceneAsk,
  bags: SceneBags,
  count: SceneCount,
  trick: SceneTrick,
};

export const MulTensVideo: React.FC = () => {
  const { width } = useVideoConfig();
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
            <Body />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
