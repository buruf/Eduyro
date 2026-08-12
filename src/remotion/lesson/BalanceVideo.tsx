// src/remotion/lesson/BalanceVideo.tsx
// The BALANCE SCALE template (M10): an equation is a scale that is level.
//
// Solving is taught almost everywhere as "move it to the other side and flip
// the sign", which is a rule with no reason attached. Here the reason is the
// picture: the beam is level, so whatever you take off one pan you must take
// off the other, or it tips. The weights physically leave BOTH pans at the
// same moment — that simultaneity IS the rule.
//
// An inequality is the same scale, tipped, and every legal move keeps the tilt.
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
import { balanceSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { balanceUnitById, balanceSolution, type BalanceUnit } from "./units";

export { FPS } from "./timeline";

export type BalanceProps = {
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
const BEAM = "#8A5E10";

const STAGE_W = 1500;
const STAGE_H = 600;

const PIVOT_X = STAGE_W / 2;
const PIVOT_Y = 300;
const BEAM_HALF = 480;
const PAN_DROP = 130;
const W = 54; // weight size

interface SceneProps {
  dur: number;
  unit: BalanceUnit;
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

/** A single unit weight. */
function Weight({ x, y, opacity = 1 }: { x: number; y: number; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: W,
        height: W,
        borderRadius: 8,
        backgroundColor: GOLD,
        opacity,
      }}
    />
  );
}

/** A box holding the unknown. */
function XBox({ x, y, size = 92, opened = 0, value }: { x: number; y: number; size?: number; opened?: number; value?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: opened > 0.5 ? GREEN : BLUE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size * 0.5,
        fontWeight: 800,
      }}
    >
      {opened > 0.5 && value !== undefined ? value : "x"}
    </div>
  );
}

/**
 * The scale. `tilt` is degrees (negative = left side down). Pans hang from the
 * beam ends, so a tilt visibly raises one pan and drops the other.
 */
function Scale({
  tilt,
  left,
  right,
}: {
  tilt: number;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  const rad = (tilt * Math.PI) / 180;
  const dy = Math.sin(rad) * BEAM_HALF;
  const leftPanY = PIVOT_Y - dy;
  const rightPanY = PIVOT_Y + dy;
  return (
    <>
      {/* stand */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 8,
          top: PIVOT_Y,
          width: 16,
          height: 230,
          backgroundColor: BEAM,
          borderRadius: 6,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 110,
          top: PIVOT_Y + 224,
          width: 220,
          height: 18,
          backgroundColor: BEAM,
          borderRadius: 8,
        }}
      />
      {/* beam */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - BEAM_HALF,
          top: PIVOT_Y - 7,
          width: BEAM_HALF * 2,
          height: 14,
          backgroundColor: BEAM,
          borderRadius: 7,
          rotate: `${tilt}deg`,
        }}
      />
      {/* pans */}
      {[
        { x: PIVOT_X - BEAM_HALF, y: leftPanY, node: left },
        { x: PIVOT_X + BEAM_HALF, y: rightPanY, node: right },
      ].map((p, i) => (
        <div key={i}>
          <div
            style={{
              position: "absolute",
              left: p.x - 2,
              top: p.y,
              width: 4,
              height: PAN_DROP,
              backgroundColor: BEAM,
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: p.x - 210,
              top: p.y + PAN_DROP,
              width: 420,
              height: 14,
              backgroundColor: BEAM,
              borderRadius: 7,
            }}
          />
          {/* pan contents sit ON the tray */}
          <div style={{ position: "absolute", left: p.x - 210, top: p.y + PAN_DROP - 170, width: 420, height: 170 }}>
            {p.node}
          </div>
        </div>
      ))}
    </>
  );
}

/** Lay weights out in the pan, bottom-aligned, wrapping at 6 per row. */
function pileLayout(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: 210 - Math.min(count, 6) * (W + 8) / 2 + (i % 6) * (W + 8),
    y: 170 - W - 6 - Math.floor(i / 6) * (W + 8),
  }));
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

function Title({ text, enter }: { text: string; enter: { opacity: number; translateY: number } }) {
  return (
    <div
      style={{
        fontSize: 82,
        fontWeight: 700,
        color: INK,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
      }}
    >
      {text}
    </div>
  );
}

function equationText(u: BalanceUnit) {
  const c = u.coef === 1 ? "" : String(u.coef);
  return `${c}x + ${u.constL} ${u.rel} ${u.constR}`;
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(40);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div style={{ fontSize: 170, fontWeight: 800, color: INK, opacity: a.opacity, translate: `0 ${a.translateY}px` }}>
        {equationText(unit)}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {unit.rel === "=" ? "Think of it as a scale." : "A scale that's tipped."}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: build the scale --------------------------------------------
function SceneBuild({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const at = Math.round(dur * 0.2);
  const tilt = unit.rel === ">" ? 7 : 0;
  const leftPile = pileLayout(unit.constL);
  const rightPile = pileLayout(unit.constR);
  const boxSize = 92;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text={unit.rel === "=" ? "Level — both sides weigh the same" : "Tipped — the left is heavier"} enter={title} />
      <Stage>
        <Scale
          tilt={tilt}
          left={
            <>
              {Array.from({ length: unit.coef }, (_, i) => (
                <XBox
                  key={i}
                  x={40 + i * (boxSize + 12)}
                  y={170 - boxSize - 6}
                  size={boxSize}
                />
              ))}
              {leftPile.map((p, i) => (
                <Weight
                  key={i}
                  x={p.x + 90}
                  y={p.y}
                  opacity={interpolate(frame, [at + i * 4, at + i * 4 + 8], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })}
                />
              ))}
            </>
          }
          right={
            <>
              {rightPile.map((p, i) => (
                <Weight
                  key={i}
                  x={p.x}
                  y={p.y}
                  opacity={interpolate(frame, [at + i * 4, at + i * 4 + 8], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })}
                />
              ))}
            </>
          }
        />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: take the same off both sides -------------------------------
function SceneSolve({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const n = balanceSolution(unit);

  // Beat 1: the constants leave BOTH pans together.
  const removeAt = Math.round(dur * 0.22);
  const removeSpan = 22;
  const removed = interpolate(frame, [removeAt, removeAt + removeSpan], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const constGone = removed > 0.9;
  // Beat 2 (two-step only): split both sides by the coefficient.
  const splitAt = Math.round(dur * 0.66);
  const split = unit.coef > 1 && frame >= splitAt;

  const leftConst = unit.constL;
  const rightRemaining = split ? n.x : constGone ? n.afterConst : unit.constR;
  const boxes = split ? 1 : unit.coef;
  const boxSize = 92;
  const tilt = unit.rel === ">" ? 7 : 0;

  const leftPile = pileLayout(leftConst);
  const rightPile = pileLayout(rightRemaining);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title
        text={
          split
            ? `Split both sides into ${unit.coef}`
            : `Take ${unit.constL} off BOTH sides`
        }
        enter={title}
      />
      <Stage>
        <Scale
          tilt={tilt}
          left={
            <>
              {Array.from({ length: boxes }, (_, i) => (
                <XBox key={i} x={40 + i * (boxSize + 12)} y={170 - boxSize - 6} size={boxSize} />
              ))}
              {/* the constants fade AND slide off together with the right's */}
              {leftPile.map((p, i) => (
                <Weight key={i} x={p.x + 90} y={p.y - removed * 220} opacity={1 - removed} />
              ))}
            </>
          }
          right={
            <>
              {rightPile.map((p, i) => (
                <Weight key={i} x={p.x} y={p.y} />
              ))}
              {/* the matching weights leaving the right pan, in lockstep */}
              {!constGone &&
                pileLayout(unit.constR)
                  .slice(unit.constR - unit.constL)
                  .map((p, i) => (
                    <Weight key={`g${i}`} x={p.x} y={p.y - removed * 220} opacity={1 - removed} />
                  ))}
            </>
          }
        />
        {constGone && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: STAGE_H - 40,
              width: STAGE_W,
              textAlign: "center",
              fontSize: 54,
              fontWeight: 700,
              color: GREEN,
            }}
          >
            {unit.rel === "=" ? "still level" : "still tipped the same way"}
          </div>
        )}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the answer --------------------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const n = balanceSolution(unit);
  const openAt = Math.round(dur * 0.3);
  const tipAt = Math.round(dur * 0.62);
  const opened = frame >= openAt ? 1 : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <Title text={unit.rel === "=" ? "So x is…" : "So x can be…"} enter={title} />
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <XBox x={0} y={0} size={140} opened={opened} value={n.x} />
        <span style={{ fontSize: 120, fontWeight: 800, color: MUTED }}>{unit.rel}</span>
        <span style={{ fontSize: 150, fontWeight: 800, color: GREEN }}>{n.x}</span>
      </div>
      <div style={{ fontSize: 56, fontWeight: 700, color: INK }}>
        {unit.rel === "=" ? `x = ${n.x}` : `x > ${n.afterConst}`}
      </div>
      <div
        style={{
          fontSize: 52,
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
  solve: SceneSolve,
  record: SceneRecord,
};

export const BalanceVideo: React.FC<BalanceProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = balanceUnitById(unitId);
  const scenes = balanceSceneTimings(unitId, voice);
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
