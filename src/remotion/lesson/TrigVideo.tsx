// src/remotion/lesson/TrigVideo.tsx
// The TRIG template (M15). Two shared pictures:
//
//   triangle modes  the 3-4-5 right triangle, with unit-grid squares hung on
//                   each side so "a² + b² = c²" is literally counted, and the
//                   marked angle theta from which sides take their names
//   circle modes    the unit circle: an angle sweeps, the landing point drops
//                   dashed lines to the axes, and (cos, sin) is read off
//
// All numbers derive from the unit's declared triangle (units-trig.ts).
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
import { trigSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { trigUnitById, triNumbers, type TrigUnit } from "./units-trig";

export type TrigProps = {
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
const RED = "#B23B2E";

const dec = (v: number) => String(Math.round(v * 100) / 100);

interface SceneProps {
  dur: number;
  unit: TrigUnit;
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

function Title({ text, enter }: { text: string; enter: { opacity: number; translateY: number } }) {
  return (
    <div
      style={{
        fontSize: 68,
        fontWeight: 700,
        color: INK,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

// ---- Right triangle (SVG) --------------------------------------------------
// Legs a (vertical, right side) and b (horizontal, bottom). The right angle
// sits bottom-right; theta is bottom-left unless swapped.
function Triangle({
  unit,
  scale = 110,
  thetaAtLeft = true,
  showNames = false,
  highlight,
}: {
  unit: TrigUnit;
  scale?: number;
  thetaAtLeft?: boolean;
  showNames?: boolean;
  highlight?: "a" | "b" | "c" | null;
}) {
  const n = triNumbers(unit);
  const W = n.b * scale;
  const H = n.a * scale;
  const pad = 90;
  // Vertices: theta corner (left), right-angle corner (bottom-right), top.
  const A = { x: pad, y: pad + H }; // bottom-left (theta when thetaAtLeft)
  const B = { x: pad + W, y: pad + H }; // bottom-right (right angle)
  const C = { x: pad + W, y: pad }; // top-right
  const hi = (s: "a" | "b" | "c") => (highlight === s ? 10 : 6);
  const col = (s: "a" | "b" | "c") =>
    highlight === s ? GOLD : s === "c" ? BLUE : INK;
  // Side names relative to theta position.
  const names = thetaAtLeft
    ? { vert: "opposite", horiz: "adjacent" }
    : { vert: "adjacent", horiz: "opposite" };
  const thetaPos = thetaAtLeft ? A : C;
  return (
    <svg width={W + pad * 2} height={H + pad * 2}>
      {/* right-angle marker */}
      <path
        d={`M ${B.x - 34} ${B.y} L ${B.x - 34} ${B.y - 34} L ${B.x} ${B.y - 34}`}
        fill="none"
        stroke={MUTED}
        strokeWidth={4}
      />
      {/* sides */}
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col("b")} strokeWidth={hi("b")} />
      <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} stroke={col("a")} strokeWidth={hi("a")} />
      <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke={col("c")} strokeWidth={hi("c")} />
      {/* theta arc + label */}
      <circle cx={thetaPos.x} cy={thetaPos.y} r={42} fill={GOLD} opacity={0.18} />
      <text
        x={thetaPos.x + (thetaAtLeft ? 52 : -30)}
        y={thetaPos.y + (thetaAtLeft ? -16 : 66)}
        fontSize={44}
        fontWeight={800}
        fill={GOLD}
      >
        θ
      </text>
      {/* numeric side labels */}
      <text x={(A.x + B.x) / 2 - 10} y={A.y + 56} fontSize={44} fontWeight={800} fill={col("b")}>
        {unit.b}
      </text>
      <text x={B.x + 22} y={(B.y + C.y) / 2 + 14} fontSize={44} fontWeight={800} fill={col("a")}>
        {unit.a}
      </text>
      <text x={(A.x + C.x) / 2 - 66} y={(A.y + C.y) / 2 - 20} fontSize={44} fontWeight={800} fill={col("c")}>
        {dec(n.c)}
      </text>
      {/* relative names */}
      {showNames && (
        <>
          <text x={(A.x + B.x) / 2 - 90} y={A.y - 16} fontSize={34} fontWeight={800} fill={GREEN}>
            {names.horiz}
          </text>
          <text
            x={B.x - 30}
            y={(B.y + C.y) / 2 - 30}
            fontSize={34}
            fontWeight={800}
            fill={GREEN}
            transform={`rotate(90 ${B.x - 30} ${(B.y + C.y) / 2 - 30})`}
          >
            {names.vert}
          </text>
          <text
            x={(A.x + C.x) / 2 - 40}
            y={(A.y + C.y) / 2 - 78}
            fontSize={34}
            fontWeight={800}
            fill={GREEN}
            transform={`rotate(${-Math.atan2(H, W) * (180 / Math.PI)} ${(A.x + C.x) / 2 - 40} ${(A.y + C.y) / 2 - 78})`}
          >
            hypotenuse
          </text>
        </>
      )}
    </svg>
  );
}

/** A unit-grid square of side s, its cells countable, labelled s². */
function GridSquare({
  s,
  cell = 34,
  colour,
  label,
  shown = 1,
}: {
  s: number;
  cell?: number;
  colour: string;
  label: string;
  shown?: number;
}) {
  const cells = [];
  for (let r = 0; r < s; r++)
    for (let c = 0; c < s; c++)
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * cell}
          y={r * cell}
          width={cell - 2}
          height={cell - 2}
          fill={colour}
          opacity={(r * s + c) / (s * s) < shown ? 0.75 : 0.12}
        />,
      );
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={s * cell} height={s * cell}>{cells}</svg>
      <div style={{ fontSize: 40, fontWeight: 800, color: colour }}>{label}</div>
    </div>
  );
}

// ---- Unit circle (SVG) -----------------------------------------------------
function UnitCircle({
  angleDeg,
  R = 250,
  markSpecial = false,
  showDrop = true,
  arcRadians = 0,
}: {
  angleDeg: number;
  R?: number;
  markSpecial?: boolean;
  showDrop?: boolean;
  /** Number of radius-lengths drawn along the rim (radians mode). */
  arcRadians?: number;
}) {
  const S = R * 2 + 260; // room for the (1, 0)/(−1, 0) labels outside the rim
  const cx = S / 2;
  const cy = S / 2;
  const rad = (angleDeg * Math.PI) / 180;
  const px = cx + R * Math.cos(rad);
  const py = cy - R * Math.sin(rad);
  const special = [
    { d: 0, x: 1, y: 0 },
    { d: 90, x: 0, y: 1 },
    { d: 180, x: -1, y: 0 },
    { d: 270, x: 0, y: -1 },
  ];
  // Arc segments of one radian each along the rim.
  const radianArcs = [];
  for (let i = 0; i < Math.floor(arcRadians); i++) {
    const a0 = i;
    const a1 = i + 1;
    const large = 0;
    radianArcs.push(
      <path
        key={i}
        d={`M ${cx + R * Math.cos(a0)} ${cy - R * Math.sin(a0)} A ${R} ${R} 0 ${large} 0 ${cx + R * Math.cos(a1)} ${cy - R * Math.sin(a1)}`}
        fill="none"
        stroke={i % 2 ? GOLD : GREEN}
        strokeWidth={12}
      />,
    );
  }
  return (
    <svg width={S} height={S}>
      {/* axes */}
      <line x1={30} y1={cy} x2={S - 30} y2={cy} stroke={MUTED} strokeWidth={3} />
      <line x1={cx} y1={30} x2={cx} y2={S - 30} stroke={MUTED} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={INK} strokeWidth={5} />
      <text x={cx + R + 14} y={cy + 40} fontSize={30} fontWeight={700} fill={MUTED}>1</text>
      {radianArcs}
      {/* radius to the point */}
      <line x1={cx} y1={cy} x2={px} y2={py} stroke={BLUE} strokeWidth={6} />
      {showDrop && (
        <>
          <line x1={px} y1={py} x2={px} y2={cy} stroke={RED} strokeWidth={5} strokeDasharray="10 8" />
          <line x1={cx} y1={cy} x2={px} y2={cy} stroke={GREEN} strokeWidth={7} />
          <text x={(cx + px) / 2 - 46} y={cy + 44} fontSize={32} fontWeight={800} fill={GREEN}>
            cos θ
          </text>
          <text x={px + 12} y={(py + cy) / 2 + 10} fontSize={32} fontWeight={800} fill={RED}>
            sin θ
          </text>
        </>
      )}
      <circle cx={px} cy={py} r={14} fill={GOLD} />
      {markSpecial &&
        special.map((s) => (
          <g key={s.d}>
            <circle cx={cx + R * s.x} cy={cy - R * s.y} r={11} fill={BLUE} />
            <text
              x={cx + (R + 52) * s.x - 44}
              y={cy - (R + 46) * s.y + 12}
              fontSize={30}
              fontWeight={800}
              fill={BLUE}
            >
              ({s.x}, {s.y})
            </text>
          </g>
        ))}
    </svg>
  );
}

// ---- Scenes ----------------------------------------------------------------
function SceneBody({ dur, unit, sceneId }: SceneProps & { sceneId: string }) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const n = triNumbers(unit);
  const step = (k: number) => Math.round(dur * k);

  // ------------------------------------------------------------ triangle ---
  if (unit.mode === "pythagorean") {
    const shownA = interpolate(frame, [step(0.1), step(0.35)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const shownB = interpolate(frame, [step(0.35), step(0.6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const shownC = interpolate(frame, [step(0.2), step(0.7)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const headline =
      sceneId === "ask" ? "How long is the slant?" : sceneId === "work" ? `${n.a2} + ${n.b2} = ${n.c2}` : sceneId === "twist" ? `√${n.c2} = ${n.c}` : "a² + b² = c²";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 80, alignItems: "center" }}>
          <Triangle unit={unit} highlight={sceneId === "twist" ? "c" : null} />
          {sceneId !== "ask" && (
            <div style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
              <GridSquare s={unit.a} colour={INK} label={`${unit.a}² = ${n.a2}`} shown={sceneId === "work" ? shownA : 1} />
              <GridSquare s={unit.b} colour={GREEN} label={`${unit.b}² = ${n.b2}`} shown={sceneId === "work" ? shownB : 1} />
              <GridSquare s={5} cell={30} colour={BLUE} label={`c² = ${n.c2}`} shown={sceneId === "ask" || sceneId === "work" ? 0 : shownC} />
            </div>
          )}
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 46, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "side-names") {
    const swapped = sceneId === "twist";
    const headline =
      sceneId === "ask" ? "Stand at the angle θ" : sceneId === "work" ? "Three names, from θ" : swapped ? "Move θ — the names move too" : "Named from the angle";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Title text={headline} enter={title} />
        <Triangle unit={unit} thetaAtLeft={!swapped} showNames={sceneId !== "ask"} />
        {sceneId === "record" && (
          <div style={{ fontSize: 46, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "ratios" || unit.mode === "pyth-identity") {
    const isRatios = unit.mode === "ratios";
    const rows = isRatios
      ? [
          { k: "sin θ", v: `${unit.a}/${dec(n.c)} = ${dec(n.sin)}`, c: RED },
          { k: "cos θ", v: `${unit.b}/${dec(n.c)} = ${dec(n.cos)}`, c: GREEN },
          { k: "tan θ", v: `${unit.a}/${unit.b} = ${dec(n.tan)}`, c: BLUE },
        ]
      : [
          { k: "sin²θ", v: `${dec(n.sin)}² = ${dec(n.sin * n.sin)}`, c: RED },
          { k: "cos²θ", v: `${dec(n.cos)}² = ${dec(n.cos * n.cos)}`, c: GREEN },
          { k: "sum", v: `${dec(n.sin * n.sin)} + ${dec(n.cos * n.cos)} = 1`, c: GOLD },
        ];
    const per = Math.floor((dur * 0.55) / rows.length);
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? Math.min(rows.length, Math.max(0, Math.floor((frame - step(0.15)) / per) + 1)) : rows.length;
    const headline = isRatios
      ? sceneId === "ask" ? "Three ratios of the sides" : sceneId === "work" ? "SOH · CAH · TOA" : sceneId === "twist" ? "Ten times bigger — same ratios" : "SOH CAH TOA"
      : sceneId === "ask" ? "Square them. Add them." : sceneId === "work" ? "It lands on 1" : sceneId === "twist" ? `(${n.a2} + ${n.b2}) / ${n.c2} — Pythagoras!` : "sin²θ + cos²θ = 1";
    const bigTri = sceneId === "twist" && isRatios;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 14 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 90, alignItems: "center" }}>
          <Triangle unit={unit} showNames={isRatios} scale={bigTri ? 130 : 110} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {rows.map((r, i) => (
              <div
                key={r.k}
                style={{
                  display: "flex",
                  gap: 24,
                  alignItems: "center",
                  opacity: i < shown ? 1 : 0.12,
                  borderRadius: 16,
                  border: `4px solid ${r.c}`,
                  padding: "14px 26px",
                  backgroundColor: "#FFF",
                }}
              >
                <div style={{ fontSize: 44, fontWeight: 800, color: r.c, width: 150 }}>{r.k}</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: INK }}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------- circle ---
  if (unit.mode === "unit-circle" || unit.mode === "circle-values" || unit.mode === "identities") {
    const sweep =
      sceneId === "ask"
        ? interpolate(frame, [step(0.3), step(0.8)], [0, 50], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : sceneId === "twist" && unit.mode === "unit-circle"
          ? interpolate(frame, [step(0.1), step(0.75)], [50, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 50;
    const headline =
      unit.mode === "unit-circle"
        ? sceneId === "ask" ? "Walk θ around the circle" : sceneId === "work" ? "The point is (cos θ, sin θ)" : sceneId === "twist" ? "Slide θ — watch the pair" : "(cos θ, sin θ)"
        : unit.mode === "circle-values"
          ? sceneId === "ask" ? "Four compass points" : sceneId === "work" ? "Read each point" : sceneId === "twist" ? "cos = x · sin = y" : "The point IS the answer"
          : sceneId === "ask" ? "x² + y² = 1 … always" : sceneId === "work" ? "cos²θ + sin²θ = 1" : sceneId === "twist" ? "÷ cos²θ → 1 + tan²θ = 1/cos²θ" : "It all grows from the circle";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Title text={headline} enter={title} />
        <UnitCircle
          angleDeg={sweep}
          markSpecial={unit.mode === "circle-values" && sceneId !== "ask"}
          showDrop={unit.mode !== "circle-values"}
          R={unit.mode === "circle-values" ? 230 : 250}
        />
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // radians
  {
    const arcs =
      sceneId === "ask"
        ? interpolate(frame, [step(0.35), step(0.8)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : sceneId === "work"
          ? interpolate(frame, [step(0.1), step(0.7)], [1, Math.PI], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : Math.PI;
    const headline =
      sceneId === "ask" ? "Bend the radius onto the rim" : sceneId === "work" ? "Halfway round = π radians = 180°" : sceneId === "twist" ? "90° = π/2 · 60° = π/3 · 360° = 2π" : "180° = π";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Title text={headline} enter={title} />
        <UnitCircle angleDeg={(arcs * 180) / Math.PI} showDrop={false} arcRadians={arcs} />
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }
}

export const TrigVideo: React.FC<TrigProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = trigUnitById(unitId);
  const scenes = trigSceneTimings(unitId, voice);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
        scale: String(width / 1920),
      }}
    >
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
          {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
          <SceneBody dur={scene.dur} unit={unit} sceneId={scene.id} />
        </Sequence>
      ))}
      <Brand />
    </AbsoluteFill>
  );
};
