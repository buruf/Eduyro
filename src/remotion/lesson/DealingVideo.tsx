// src/remotion/lesson/DealingVideo.tsx
// The DEALING template: division, shown as both of the things it means.
//
// Division is taught almost everywhere as sharing ("30 split between 5") and
// almost nowhere as grouping ("how many 5s fit inside 30") — yet the second is
// what makes division feel like multiplication running backwards, and it is
// the one that makes remainders obvious. So this template performs BOTH on the
// same number and lands on the same answer:
//
//   deal   — dots are dealt round-robin onto plates, like cards
//   group  — the same dots re-form into rings of the divisor, and we count rings
//
// Dots move; nothing teleports. A live count sits under each plate as it fills,
// the same rule as the other templates.
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
import { dealingSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { dealingUnitById, dealingNumbers, type DealingUnit } from "./units";

export { FPS } from "./timeline";

export type DealingProps = {
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
const PLATE = "#EFE4CC";

const STAGE_W = 1640;
const STAGE_H = 760;

interface SceneProps {
  dur: number;
  unit: DealingUnit;
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

/** Dot size shrinks as the dividend grows, so 48 fits as comfortably as 12. */
function dotSize(total: number) {
  if (total <= 12) return 44;
  if (total <= 24) return 36;
  if (total <= 36) return 30;
  return 26;
}

/** The pile the dots start in, laid out in rows of ten. */
function pilePos(i: number, size: number) {
  const perRow = 10;
  const gap = size * 0.35;
  const w = perRow * (size + gap) - gap;
  const x0 = (STAGE_W - w) / 2;
  return {
    x: x0 + (i % perRow) * (size + gap),
    y: 90 + Math.floor(i / perRow) * (size + gap),
  };
}

interface PlateGeom {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Plate rectangles, spread across the stage. */
function plateGeom(plateCount: number, perPlate: number, size: number): PlateGeom[] {
  const cols = Math.min(plateCount, 6);
  const rows = Math.ceil(plateCount / cols);
  const gap = 34;
  const inner = Math.ceil(Math.sqrt(Math.max(perPlate, 1)));
  const w = Math.max(150, inner * (size + 8) + 30);
  const h = Math.max(130, Math.ceil(perPlate / inner) * (size + 8) + 30);
  const totalW = cols * w + (cols - 1) * gap;
  const x0 = (STAGE_W - totalW) / 2;
  const y0 = 330;
  return Array.from({ length: plateCount }, (_, i) => ({
    x: x0 + (i % cols) * (w + gap),
    y: y0 + Math.floor(i / cols) * (h + 90),
    w,
    h,
  }));
}

/** Seat `k` inside a plate. */
function seatPos(plate: PlateGeom, k: number, perPlate: number, size: number) {
  const inner = Math.ceil(Math.sqrt(Math.max(perPlate, 1)));
  return {
    x: plate.x + 15 + (k % inner) * (size + 8),
    y: plate.y + 15 + Math.floor(k / inner) * (size + 8),
  };
}

function Dot({
  from,
  to,
  at,
  travel = 16,
  size,
  color = GOLD,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  at: number;
  travel?: number;
  size: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + travel], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: from.x + (to.x - from.x) * t,
        top: from.y + (to.y - from.y) * t,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
      }}
    />
  );
}

function Plate({ g, label, count }: { g: PlateGeom; label?: string; count?: number }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: g.x,
          top: g.y,
          width: g.w,
          height: g.h,
          borderRadius: 16,
          backgroundColor: PLATE,
        }}
      />
      {count !== undefined && (
        <div
          style={{
            position: "absolute",
            left: g.x,
            top: g.y + g.h + 8,
            width: g.w,
            textAlign: "center",
            fontSize: 52,
            fontWeight: 800,
            color: INK,
          }}
        >
          {count}
        </div>
      )}
      {label && (
        <div
          style={{
            position: "absolute",
            left: g.x,
            top: g.y - 46,
            width: g.w,
            textAlign: "center",
            fontSize: 32,
            color: MUTED,
            fontWeight: 700,
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the question -----------------------------------------------
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
        {unit.total} ÷ {unit.divisor}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        Two ways to see this.
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: share them out ---------------------------------------------
function SceneDeal({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = dealingNumbers(unit);
  const title = useEnter(4);
  const size = dotSize(unit.total);
  const plates = plateGeom(unit.divisor, n.each, size);

  const dealAt = Math.round(dur * 0.18);
  const stagger = Math.max(2, Math.round(90 / unit.total));
  const travel = 14;

  // Round-robin: dot i goes to plate (i % divisor), seat floor(i / divisor).
  const dealtBy = (i: number) => dealAt + i * stagger;
  const seated = Array.from({ length: unit.total }, (_, i) => dealtBy(i) + travel * 0.8).filter(
    (t) => frame >= t,
  ).length;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Share {unit.total} between {unit.divisor}
      </div>
      <Stage>
        {plates.map((g, p) => (
          <Plate
            key={p}
            g={g}
            count={Math.max(
              0,
              Math.min(n.each + (p < n.remainder ? 1 : 0), Math.floor((seated - p - 1) / unit.divisor) + 1),
            )}
          />
        ))}
        {Array.from({ length: unit.total }, (_, i) => {
          const p = i % unit.divisor;
          const k = Math.floor(i / unit.divisor);
          const isLeftover = n.remainder > 0 && i >= unit.total - n.remainder;
          return (
            <Dot
              key={i}
              size={size}
              from={pilePos(i, size)}
              to={
                isLeftover
                  ? pilePos(i - (unit.total - n.remainder), size)
                  : seatPos(plates[p], k, n.each, size)
              }
              at={dealtBy(i)}
              travel={travel}
              color={isLeftover ? GREEN : GOLD}
            />
          );
        })}
      </Stage>
      <div style={{ fontSize: 52, color: MUTED, fontWeight: 700 }}>
        {n.remainder > 0
          ? `${n.each} each — and ${n.remainder} that won't go`
          : `${n.each} each`}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 3: the other meaning — how many groups fit? -------------------
function SceneGroup({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = dealingNumbers(unit);
  const title = useEnter(4);
  const size = dotSize(unit.total);
  // Now the PLATES are groups of `divisor`, and the answer is how many plates.
  const rings = plateGeom(n.each, unit.divisor, size);

  const formAt = Math.round(dur * 0.2);
  const stagger = Math.max(2, Math.round(90 / unit.total));
  const travel = 14;
  const arrived = Array.from({ length: n.each * unit.divisor }, (_, i) => formAt + i * stagger + travel * 0.8)
    .filter((t) => frame >= t).length;
  const ringsFull = Math.floor(arrived / unit.divisor);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        How many {unit.divisor}s fit in {unit.total}?
      </div>
      <Stage>
        {rings.map((g, p) => (
          <Plate key={p} g={g} label={p < ringsFull ? `${p + 1}` : undefined} />
        ))}
        {Array.from({ length: n.each * unit.divisor }, (_, i) => {
          const ring = Math.floor(i / unit.divisor);
          const k = i % unit.divisor;
          return (
            <Dot
              key={i}
              size={size}
              from={pilePos(i, size)}
              to={seatPos(rings[ring], k, unit.divisor, size)}
              at={formAt + i * stagger}
              travel={travel}
              color={GOLD}
            />
          );
        })}
        {n.remainder > 0 &&
          Array.from({ length: n.remainder }, (_, i) => (
            <Dot
              key={`r${i}`}
              size={size}
              from={pilePos(n.each * unit.divisor + i, size)}
              to={pilePos(i, size)}
              at={formAt}
              travel={travel}
              color={GREEN}
            />
          ))}
      </Stage>
      <div style={{ fontSize: 56, color: GREEN, fontWeight: 800 }}>
        {ringsFull} {ringsFull === 1 ? "group" : "groups"}
        {n.remainder > 0 && ringsFull >= n.each ? `, ${n.remainder} left over` : ""}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the fact ---------------------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = dealingNumbers(unit);
  const title = useEnter(4);
  const answerAt = Math.round(dur * 0.28);
  const tipAt = Math.round(dur * 0.6);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Both ways agree
      </div>
      <div style={{ fontSize: 160, fontWeight: 800, color: INK }}>
        {unit.total} ÷ {unit.divisor} ={" "}
        <span
          style={{
            opacity: interpolate(frame, [answerAt, answerAt + 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {n.each}
          {n.remainder > 0 ? ` r ${n.remainder}` : ""}
        </span>
      </div>
      <div
        style={{
          fontSize: 58,
          color: BLUE,
          fontWeight: 700,
          opacity: interpolate(frame, [tipAt, tipAt + 16], [0, 1], {
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
  deal: SceneDeal,
  group: SceneGroup,
  record: SceneRecord,
};

export const DealingVideo: React.FC<DealingProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = dealingUnitById(unitId);
  const scenes = dealingSceneTimings(unitId, voice);
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
    </AbsoluteFill>
  );
};
