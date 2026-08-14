// src/remotion/lesson/CompareVideo.tsx
// The COMPARE template: which is more? Pair them up and SEE.
//
// Comparison is taught as a rule ("8 comes after 5, so 8 is bigger") when the
// honest picture is matching: line the two groups up one against one, and the
// row that sticks out past the other is the greater one. The extras get
// highlighted — they ARE the difference. Words, not the < > symbols: this is
// M1–M2, and the alligator can wait.
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
import { compareSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { compareUnitById, compareNumbers, type CompareUnit } from "./units-early";

export { FPS } from "./timeline";

export type CompareProps = {
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

const STAGE_W = 1560;
const STAGE_H = 620;

const DOT = 76;
const GAP = 26;
const ROW_A_Y = 120; // gold, the first number
const ROW_B_Y = 330; // blue, the second
const X0 = 170;

const slot = (i: number, y: number) => ({ x: X0 + i * (DOT + GAP), y });

interface SceneProps {
  dur: number;
  unit: CompareUnit;
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

function Dot({
  x,
  y,
  color,
  appearAt = -100,
  ring = false,
}: {
  x: number;
  y: number;
  color: string;
  appearAt?: number;
  ring?: boolean;
}) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [appearAt, appearAt + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: DOT,
        height: DOT,
        borderRadius: "50%",
        backgroundColor: color,
        opacity: t,
        scale: String(0.4 + 0.6 * t),
        boxShadow: ring ? `0 0 0 7px ${GREEN}` : "none",
      }}
    />
  );
}

function RowLabel({ value, y, lit }: { value: number; y: number; lit: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 20,
        top: y + DOT / 2 - 46,
        width: 130,
        textAlign: "center",
        fontSize: 92,
        fontWeight: 800,
        color: lit ? INK : MUTED,
      }}
    >
      {value}
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the question ------------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(40);
  const q =
    unit.focus === "greater" ? "Which is greater?" : unit.focus === "less" ? "Which is less?" : "More… or less?";
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
        {unit.a} or {unit.b}
      </div>
      <div style={{ fontSize: 66, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {q} Don&apos;t guess — you can see it.
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the two groups ----------------------------------------------
function SceneBuild({ dur, unit }: SceneProps) {
  const title = useEnter(4);
  const aAt = Math.round(dur * 0.18);
  const bAt = Math.round(dur * 0.55);
  const frame = useCurrentFrame();
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
        Here they are
      </div>
      <Stage>
        {Array.from({ length: unit.a }, (_, i) => {
          const p = slot(i, ROW_A_Y);
          return <Dot key={`a${i}`} x={p.x} y={p.y} color={GOLD} appearAt={aAt + i * 4} />;
        })}
        {Array.from({ length: unit.b }, (_, i) => {
          const p = slot(i, ROW_B_Y);
          return <Dot key={`b${i}`} x={p.x} y={p.y} color={BLUE} appearAt={bAt + i * 4} />;
        })}
        <RowLabel value={unit.a} y={ROW_A_Y} lit={frame >= aAt} />
        <RowLabel value={unit.b} y={ROW_B_Y} lit={frame >= bAt} />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: pair them, one against one ----------------------------------
function ScenePair({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = compareNumbers(unit);
  const title = useEnter(4);
  const pairAt = Math.round(dur * 0.16);
  const stagger = 7;
  const extraAt = Math.round(dur * 0.66);
  // The rows are already aligned by construction (same X0), so pairing is
  // drawn as connector lines lighting up one pair at a time.
  const paired = Array.from({ length: n.smaller }, (_, i) => pairAt + i * stagger).filter(
    (t) => frame >= t,
  ).length;
  const extraLit = frame >= extraAt;
  const aIsBig = unit.a > unit.b;

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
        Pair them up
      </div>
      <Stage>
        {/* connector lines, one per completed pair */}
        {Array.from({ length: paired }, (_, i) => {
          const p = slot(i, ROW_A_Y);
          return (
            <div
              key={`l${i}`}
              style={{
                position: "absolute",
                left: p.x + DOT / 2 - 4,
                top: ROW_A_Y + DOT,
                width: 8,
                height: ROW_B_Y - ROW_A_Y - DOT,
                borderRadius: 4,
                backgroundColor: MUTED,
                opacity: 0.55,
              }}
            />
          );
        })}
        {Array.from({ length: unit.a }, (_, i) => {
          const p = slot(i, ROW_A_Y);
          const isExtra = aIsBig && i >= n.smaller;
          return (
            <Dot key={`a${i}`} x={p.x} y={p.y} color={GOLD} ring={isExtra && extraLit} />
          );
        })}
        {Array.from({ length: unit.b }, (_, i) => {
          const p = slot(i, ROW_B_Y);
          const isExtra = !aIsBig && i >= n.smaller;
          return (
            <Dot key={`b${i}`} x={p.x} y={p.y} color={BLUE} ring={isExtra && extraLit} />
          );
        })}
        <RowLabel value={unit.a} y={ROW_A_Y} lit />
        <RowLabel value={unit.b} y={ROW_B_Y} lit />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: STAGE_H - 92,
            width: STAGE_W,
            textAlign: "center",
            fontSize: 58,
            fontWeight: 800,
            color: GREEN,
            opacity: extraLit ? 1 : 0,
          }}
        >
          {n.extra} sticking out — no partner
        </div>
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the answer, in words ---------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = compareNumbers(unit);
  const title = useEnter(4);
  const tipAt = Math.round(dur * 0.5);
  const line =
    unit.focus === "greater"
      ? `${n.bigger} is greater than ${n.smaller}`
      : unit.focus === "less"
        ? `${n.smaller} is less than ${n.bigger}`
        : `${n.bigger} is more · ${n.smaller} is less`;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <div
        style={{
          fontSize: 100,
          fontWeight: 800,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
          textAlign: "center",
        }}
      >
        {line}
      </div>
      <div
        style={{
          fontSize: 54,
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
  build: SceneBuild,
  pair: ScenePair,
  record: SceneRecord,
};

export const CompareVideo: React.FC<CompareProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = compareUnitById(unitId);
  const scenes = compareSceneTimings(unitId, voice);
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
