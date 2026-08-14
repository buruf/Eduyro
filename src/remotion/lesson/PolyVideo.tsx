// src/remotion/lesson/PolyVideo.tsx
// The POLYNOMIAL template (M12). Algebra tiles for classify/add — a big
// square IS x², a bar IS x, a dot IS 1, so "like terms" are literally tiles
// of the same shape — and the area rectangle for multiply/factor, the same
// puzzle run in opposite directions.
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
import { polySceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { polyUnitById, polyText, type PolyUnit } from "./units-poly";

export type PolyProps = {
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

interface SceneProps {
  dur: number;
  unit: PolyUnit;
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

/** One algebra tile. */
function Tile({ kind, colour }: { kind: "sq" | "bar" | "dot"; colour: string }) {
  const size = kind === "sq" ? { w: 84, h: 84 } : kind === "bar" ? { w: 84, h: 30 } : { w: 30, h: 30 };
  return (
    <div
      style={{
        width: size.w,
        height: size.h,
        borderRadius: 8,
        backgroundColor: colour,
        opacity: 0.85,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFF",
        fontSize: kind === "sq" ? 30 : 18,
        fontWeight: 800,
      }}
    >
      {kind === "sq" ? "x²" : kind === "bar" ? "x" : ""}
    </div>
  );
}

/** A group of n tiles of one kind, revealed up to `shown`. */
function TileGroup({
  kind,
  n,
  colour,
  shown = n,
  label,
}: {
  kind: "sq" | "bar" | "dot";
  n: number;
  colour: string;
  shown?: number;
  label?: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 300, alignItems: "flex-end", minHeight: 90 }}>
        {Array.from({ length: n }, (_, i) => (
          <div key={i} style={{ opacity: i < shown ? 1 : 0.12 }}>
            <Tile kind={kind} colour={colour} />
          </div>
        ))}
      </div>
      {label && <div style={{ fontSize: 38, fontWeight: 800, color: colour, marginTop: 10 }}>{label}</div>}
    </div>
  );
}

/** The (x + p)(x + q) area rectangle, rooms revealed one at a time. */
function AreaBox({ p, q, shown }: { p: number; q: number; shown: number }) {
  const X = 300; // px for the x-length
  const unit = 62; // px per 1
  const rooms = [
    { w: X, h: X, label: "x²", c: BLUE },
    { w: unit * q, h: X, label: `${q}x`, c: GREEN },
    { w: X, h: unit * p, label: `${p}x`, c: GOLD },
    { w: unit * q, h: unit * p, label: String(p * q), c: MUTED },
  ];
  return (
    <div style={{ position: "relative", padding: "70px 0 0 70px" }}>
      {/* side labels */}
      <div style={{ position: "absolute", left: 70 + X / 2 - 16, top: 8, fontSize: 44, fontWeight: 800, color: INK }}>x</div>
      <div style={{ position: "absolute", left: 70 + X + (unit * q) / 2 - 12, top: 8, fontSize: 44, fontWeight: 800, color: INK }}>{q}</div>
      <div style={{ position: "absolute", left: 16, top: 70 + X / 2 - 26, fontSize: 44, fontWeight: 800, color: INK }}>x</div>
      <div style={{ position: "absolute", left: 16, top: 70 + X + (unit * p) / 2 - 26, fontSize: 44, fontWeight: 800, color: INK }}>{p}</div>
      <div style={{ display: "grid", gridTemplateColumns: `${X}px ${unit * q}px`, gridTemplateRows: `${X}px ${unit * p}px`, gap: 6 }}>
        {rooms.map((r, i) => (
          <div
            key={i}
            style={{
              backgroundColor: r.c,
              opacity: i < shown ? 0.82 : 0.1,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              fontSize: 46,
              fontWeight: 800,
            }}
          >
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps & { sceneId: string }) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const step = (k: number) => Math.round(dur * k);

  if (unit.mode === "classify") {
    const [c2, c1, c0] = unit.a;
    const terms = [
      { text: c2 === 1 ? "x²" : `${c2}x²`, deg: "degree 2", c: BLUE },
      { text: `${Math.abs(c1) === 1 ? "" : Math.abs(c1)}x`, deg: "degree 1", c: GREEN },
      { text: String(Math.abs(c0)), deg: "degree 0", c: GOLD },
    ];
    const per = Math.floor((dur * 0.55) / 3);
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? Math.min(3, Math.max(0, Math.floor((frame - step(0.15)) / per) + 1)) : 3;
    const headline =
      sceneId === "ask" ? polyText(unit.a) : sceneId === "work" ? "Count the terms → TRINOMIAL" : sceneId === "twist" ? "Biggest exponent → degree 2" : "Trinomial, degree 2";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 40 }}>
          {terms.map((t, i) => (
            <div
              key={i}
              style={{
                borderRadius: 20,
                border: `5px solid ${t.c}`,
                padding: "30px 46px",
                backgroundColor: "#FFF",
                opacity: sceneId === "ask" || i < shown ? 1 : 0.15,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 76, fontWeight: 800, color: t.c }}>{t.text}</div>
              {(sceneId === "twist" || sceneId === "record") && (
                <div style={{ fontSize: 34, fontWeight: 800, color: MUTED, marginTop: 8 }}>{t.deg}</div>
              )}
            </div>
          ))}
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "add") {
    const a = unit.a;
    const b = unit.b ?? unit.a;
    const s = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const merged = sceneId !== "ask";
    const per = Math.floor((dur * 0.5) / 3);
    const kindShown = (i: number) =>
      sceneId === "work" ? (Math.floor((frame - step(0.2)) / per) >= i ? 99 : 0) : 99;
    const headline =
      sceneId === "ask" ? `${polyText(a)}   +   ${polyText(b)}` : sceneId === "work" ? "Sort tiles by SHAPE" : sceneId === "twist" ? "Only like terms combine" : polyText(s as [number, number, number]);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title text={headline} enter={title} />
        {!merged ? (
          <div style={{ display: "flex", gap: 130 }}>
            {[a, b].map((c, gi) => (
              <div key={gi} style={{ display: "flex", gap: 26, alignItems: "flex-end" }}>
                <TileGroup kind="sq" n={c[0]} colour={BLUE} />
                <TileGroup kind="bar" n={c[1]} colour={GREEN} />
                <TileGroup kind="dot" n={c[2]} colour={GOLD} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 80, alignItems: "flex-end" }}>
            <TileGroup kind="sq" n={s[0]} colour={BLUE} shown={kindShown(0)} label={`${a[0]} + ${b[0]} = ${s[0]}`} />
            <TileGroup kind="bar" n={s[1]} colour={GREEN} shown={kindShown(1)} label={`${a[1]} + ${b[1]} = ${s[1]}`} />
            <TileGroup kind="dot" n={s[2]} colour={GOLD} shown={kindShown(2)} label={`${a[2]} + ${b[2]} = ${s[2]}`} />
          </div>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // multiply / factor share the rectangle.
  {
    const p = unit.p ?? 2, q = unit.q ?? 3;
    const m = p + q, k = p * q;
    const isFactor = unit.mode === "factor";
    const per = Math.floor((dur * 0.55) / 4);
    const shown =
      sceneId === "ask" ? (isFactor ? 0 : 0) : sceneId === "work" ? (isFactor ? 0 : Math.min(4, Math.max(0, Math.floor((frame - step(0.15)) / per) + 1))) : 4;
    const headline = isFactor
      ? sceneId === "ask" ? `x² + ${m}x + ${k} = ( ? )( ? )` : sceneId === "work" ? `× to ${k} · + to ${m} → ${p} and ${q}` : sceneId === "twist" ? `(x + ${p})(x + ${q}) — rebuild it` : "The brackets write themselves"
      : sceneId === "ask" ? `(x + ${p})(x + ${q})` : sceneId === "work" ? "Four rooms" : sceneId === "twist" ? `x² + ${q}x + ${p}x + ${k} → x² + ${m}x + ${k}` : `x² + ${m}x + ${k}`;
    const showBox = !(isFactor && (sceneId === "ask" || sceneId === "work"));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title text={headline} enter={title} />
        {showBox ? (
          <AreaBox p={p} q={q} shown={shown} />
        ) : (
          <div style={{ display: "flex", gap: 50 }}>
            {[
              [1, k],
              [p, q],
            ].map(([f1, f2], i) => {
              const good = f1 + f2 === m;
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 20,
                    border: `5px solid ${good ? GREEN : MUTED}`,
                    padding: "26px 42px",
                    backgroundColor: "#FFF",
                    opacity: sceneId === "ask" ? 0.15 : 1,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 60, fontWeight: 800, color: good ? GREEN : MUTED }}>
                    {f1} · {f2} = {f1 * f2}
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 800, color: good ? GREEN : MUTED }}>
                    {f1} + {f2} = {f1 + f2} {good ? "✓" : "✗"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }
}

export const PolyVideo: React.FC<PolyProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = polyUnitById(unitId);
  const scenes = polySceneTimings(unitId, voice);
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
