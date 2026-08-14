// src/remotion/lesson/AreaVideo.tsx
// The AREA template: why long multiplication has the steps it has.
//
// 27 × 4 is hard as a single fact and easy as a picture: draw a rectangle 27
// wide and 4 tall, cut it at the tens boundary, and it becomes 20 × 4 next to
// 7 × 4 — two facts a child already owns. The partial products in the written
// algorithm are literally these pieces, which is the connection almost never
// made: the "steps" are not a ritual, they are the rectangle's regions.
//
// 2-digit × 2-digit cuts BOTH ways and yields four regions, which is exactly
// why that algorithm has four partial products.
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
import { areaSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { areaUnitById, areaRegions, areaSides, type AreaUnit } from "./units";

export { FPS } from "./timeline";

export type AreaProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const MUTED = "#8A7A5E";
const GREEN = "#2F7D4F";

const STAGE_W = 1500;
const STAGE_H = 560;

// The rectangle is drawn to a fixed box rather than true scale: at true scale
// a 3-wide sliver next to a 20-wide block is unreadable, and the point is the
// SPLIT, not the proportions.
const BOX_W = 1080;
const BOX_H = 380;
const BOX_X = (STAGE_W - BOX_W) / 2;
const BOX_Y = 90;
/** Minimum share of the box a region gets, so the ones column stays legible. */
const MIN_SHARE = 0.26;

interface SceneProps {
  dur: number;
  unit: AreaUnit;
}

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

/** Column widths / row heights for the split, clamped so no strip vanishes. */
function shares(hi: number, lo: number) {
  // Either side missing means there is no cut on that axis, so the single
  // strip takes the whole box. Without this, a 1-digit side (no tens) fell
  // through to the clamp and rendered as a 26%-tall sliver.
  if (lo === 0 || hi === 0) return [1, 0];
  const raw = hi / (hi + lo);
  const clamped = Math.min(1 - MIN_SHARE, Math.max(MIN_SHARE, raw));
  return [clamped, 1 - clamped];
}

/** The rectangle, optionally cut, with each region labelled by its product. */
function Rect({
  unit,
  split,
  litIndex,
  showLabels,
}: {
  unit: AreaUnit;
  /** 0 = whole, 1 = fully cut. */
  split: number;
  litIndex: number | null;
  showLabels: boolean;
}) {
  const regions = areaRegions(unit);
  const sides = areaSides(unit);
  const [wHi, wLo] = shares(sides.xTens, sides.xOnes);
  const [hHi, hLo] = shares(sides.yTens, sides.yOnes);
  // The cut opens a gap between regions as `split` goes 0 → 1.
  const gap = 16 * split;

  return (
    <>
      {regions.map((r, i) => {
        const w = (r.col === 0 ? wHi : wLo) * BOX_W - (sides.xOnes ? gap / 2 : 0);
        const h = (r.row === 0 ? hHi : hLo) * BOX_H - (sides.yTens ? gap / 2 : 0);
        const x = BOX_X + (r.col === 0 ? 0 : wHi * BOX_W + gap / 2);
        const y = BOX_Y + (r.row === 0 ? 0 : hHi * BOX_H + gap / 2);
        const lit = litIndex === null || litIndex === i;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: Math.max(w, 10),
                height: Math.max(h, 10),
                borderRadius: 10,
                backgroundColor: r.col === 0 ? GOLD : BLUE,
                opacity: lit ? 1 : 0.28,
              }}
            />
            {showLabels && (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: y + Math.max(h, 10) / 2 - 46,
                  width: Math.max(w, 10),
                  textAlign: "center",
                  color: "#fff",
                  opacity: lit ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.9 }}>
                  {r.w} × {r.h}
                </div>
                <div style={{ fontSize: 66, fontWeight: 800 }}>{r.product}</div>
              </div>
            )}
          </div>
        );
      })}
      {/* Edge labels: the two numbers being multiplied */}
      <div
        style={{
          position: "absolute",
          left: BOX_X,
          top: BOX_Y - 62,
          width: BOX_W,
          textAlign: "center",
          fontSize: 48,
          fontWeight: 800,
          color: MUTED,
        }}
      >
        {unit.x}
      </div>
      <div
        style={{
          position: "absolute",
          left: BOX_X - 90,
          top: BOX_Y + BOX_H / 2 - 30,
          width: 70,
          textAlign: "right",
          fontSize: 48,
          fontWeight: 800,
          color: MUTED,
        }}
      >
        {unit.y}
      </div>
    </>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(40);
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
        {unit.x} × {unit.y}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        Too big to just know. So draw it.
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the whole rectangle ----------------------------------------
function SceneBuild({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const growAt = Math.round(dur * 0.25);
  const grow = interpolate(frame, [growAt, growAt + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        A rectangle, {unit.x} across and {unit.y} down
      </div>
      <Stage>
        <div
          style={{
            position: "absolute",
            left: BOX_X,
            top: BOX_Y,
            width: BOX_W * grow,
            height: BOX_H,
            borderRadius: 10,
            backgroundColor: GOLD,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: BOX_X,
            top: BOX_Y - 62,
            width: BOX_W,
            textAlign: "center",
            fontSize: 48,
            fontWeight: 800,
            color: MUTED,
            opacity: grow,
          }}
        >
          {unit.x}
        </div>
        <div
          style={{
            position: "absolute",
            left: BOX_X - 90,
            top: BOX_Y + BOX_H / 2 - 30,
            width: 70,
            textAlign: "right",
            fontSize: 48,
            fontWeight: 800,
            color: MUTED,
            opacity: grow,
          }}
        >
          {unit.y}
        </div>
      </Stage>
      <div style={{ fontSize: 52, color: MUTED, fontWeight: 700, opacity: grow }}>
        How many squares is that?
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 3: cut it into facts you know ---------------------------------
function SceneSplit({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const regions = areaRegions(unit);
  const cutAt = Math.round(dur * 0.16);
  const labelAt = Math.round(dur * 0.34);
  const split = interpolate(frame, [cutAt, cutAt + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const per = Math.max(24, Math.floor((dur - labelAt - 30) / regions.length));
  const lit = frame < labelAt ? null : Math.min(regions.length - 1, Math.floor((frame - labelAt) / per));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Cut it into facts you know
      </div>
      <Stage>
        <Rect unit={unit} split={split} litIndex={lit} showLabels={frame >= labelAt} />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: add the pieces ---------------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const regions = areaRegions(unit);
  const answer = unit.x * unit.y;
  const sumAt = Math.round(dur * 0.3);
  const answerAt = Math.round(dur * 0.62);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 92,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Add the pieces
      </div>
      <div style={{ fontSize: 92, fontWeight: 800, color: MUTED, display: "flex", gap: 26 }}>
        {regions.map((r, i) => (
          <span
            key={i}
            style={{
              opacity: interpolate(frame, [sumAt + i * 12, sumAt + i * 12 + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {r.product}
            {i < regions.length - 1 ? " +" : ""}
          </span>
        ))}
      </div>
      <div
        style={{
          fontSize: 150,
          fontWeight: 800,
          color: INK,
          opacity: interpolate(frame, [answerAt, answerAt + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {unit.x} × {unit.y} = {answer}
      </div>
      <div
        style={{
          fontSize: 54,
          color: BLUE,
          fontWeight: 700,
          opacity: interpolate(frame, [answerAt + 20, answerAt + 36], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {unit.tip}
      </div>
    </AbsoluteFill>
  );
}

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  build: SceneBuild,
  split: SceneSplit,
  record: SceneRecord,
};

export const AreaVideo: React.FC<AreaProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = areaUnitById(unitId);
  const scenes = areaSceneTimings(unitId, voice);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
        scale: String(width / 1920),
      }}
    >
      {scenes.map((scene) => {
        const Body = SCENE_BODIES[scene.id];
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} unit={unit} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
