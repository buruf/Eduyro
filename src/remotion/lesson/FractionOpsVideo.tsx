// src/remotion/lesson/FractionOpsVideo.tsx
// The FRACTION OPERATIONS template (M7): subtract, divide, mixed, improper
// and order on the same equal-parts BAR the earlier fraction videos taught,
// plus the one picture a bar cannot draw — multiplication as a fraction OF a
// fraction, on a square cut both ways.
//
// Same design rules as every template: numbers derive from the unit, visuals
// animate on the frame clock, and each scene carries its own narration clip
// so voice and picture share one clock.
import React from "react";
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
import { fracOpsSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { fracOpsUnitById, fracOpsNumbers, type FracOpsUnit } from "./units-fracops";

export type FracOpsProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const GREEN = "#2F7D4F";
const RED = "#B23B2E";
const EDGE = "#8A5E10";

const STAGE_W = 1500;
const BAR_W = 1200;
const BAR_H = 120;
const BAR_X = (STAGE_W - BAR_W) / 2;

interface SceneProps {
  dur: number;
  unit: FracOpsUnit;
  sceneId: string;
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
        fontSize: 78,
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

/** Stacked fraction — a child should see the bar in it. */
function Frac({ n, d, size = 120, color = INK }: { n: number; d: number; size?: number; color?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: size * 0.62,
        fontWeight: 800,
        color,
        lineHeight: 1.05,
        verticalAlign: "middle",
      }}
    >
      <span>{n}</span>
      <span style={{ width: size * 0.5, height: Math.max(6, size * 0.045), backgroundColor: color, borderRadius: 4 }} />
      <span>{d}</span>
    </span>
  );
}

/** A bar of `parts` equal cells with per-cell fill control. */
function Bar({
  y,
  parts,
  fill,
  width = BAR_W,
  x = BAR_X,
  label,
}: {
  y: number;
  parts: number;
  /** For each cell index: color to fill, or null for empty. */
  fill: (i: number) => string | null;
  width?: number;
  x?: number;
  label?: React.ReactNode;
}) {
  const cellW = width / parts;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          height: BAR_H,
          border: `4px solid ${EDGE}`,
          borderRadius: 12,
        }}
      />
      {Array.from({ length: parts }, (_, i) => {
        const c = fill(i);
        return c ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + i * cellW + 4,
              top: y + 4,
              width: cellW - 8,
              height: BAR_H - 8,
              borderRadius: 8,
              backgroundColor: c,
            }}
          />
        ) : null;
      })}
      {Array.from({ length: parts - 1 }, (_, i) => (
        <div
          key={`c${i}`}
          style={{
            position: "absolute",
            left: x + (i + 1) * cellW - 2,
            top: y,
            width: 4,
            height: BAR_H,
            backgroundColor: EDGE,
          }}
        />
      ))}
      {label !== undefined && (
        <div
          style={{
            position: "absolute",
            left: x - 150,
            top: y + BAR_H / 2 - 55,
            width: 130,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

function fadeOut(frame: number, at: number, dur = 16): number {
  return interpolate(frame, [at, at + dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}
function fadeIn(frame: number, at: number, dur = 12): number {
  return interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

function SceneBody({ dur, unit, sceneId }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const x = fracOpsNumbers(unit);
  const step = (k: number) => Math.round(dur * k);

  // ---- subtract: shaded pieces leave the bar --------------------------------
  if (unit.mode === "subtract") {
    const removing = sceneId === "action";
    const headline =
      sceneId === "ask"
        ? `${unit.n}/${unit.d} − ${x.n2}/${unit.d} = ?`
        : sceneId === "parts"
          ? `Here's ${unit.n}/${unit.d}`
          : sceneId === "action"
            ? `Take ${x.n2} pieces away`
            : `${unit.n}/${unit.d} − ${x.n2}/${unit.d} = ${x.diff}/${unit.d}`;
    const shownShaded = sceneId === "ask" ? 0 : unit.n;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 240 }}>
          <Bar
            y={40}
            parts={unit.d}
            fill={(i) => {
              if (i >= shownShaded) return null;
              const isLeaving = i >= unit.n - x.n2;
              if (!removing) return sceneId === "record" && isLeaving ? null : GOLD;
              if (!isLeaving) return GOLD;
              // Leaving pieces flash red then fade, staggered right-to-left.
              const at = step(0.25) + (unit.n - 1 - i) * Math.round(dur * 0.12);
              const gone = fadeOut(frame, at);
              if (gone <= 0.02) return null;
              return frame >= at - 10 ? RED : GOLD;
            }}
          />
        </div>
        {sceneId === "record" && <div style={{ fontSize: 46, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  // ---- multiply: the two-way grid ------------------------------------------
  if (unit.mode === "multiply") {
    const cols = x.d2;
    const rows = unit.d;
    const G = 560;
    const gx = (STAGE_W - G) / 2;
    const showRows = sceneId === "action" || sceneId === "record";
    const rowCutAt = step(0.2);
    const keepAt = step(0.45);
    const headline =
      sceneId === "ask"
        ? `${unit.n}/${unit.d} × ${x.n2}/${x.d2} — times means OF`
        : sceneId === "parts"
          ? `Shade ${x.n2}/${x.d2}`
          : sceneId === "action"
            ? `Take ${unit.n}/${unit.d} of the shading`
            : `${unit.n}/${unit.d} × ${x.n2}/${x.d2} = ${x.prodN}/${x.prodD}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: G + 40 }}>
          <div
            style={{
              position: "absolute",
              left: gx,
              top: 20,
              width: G,
              height: G,
              border: `5px solid ${EDGE}`,
              borderRadius: 14,
            }}
          />
          {Array.from({ length: cols }, (_, c) =>
            c < x.n2 ? (
              <div
                key={c}
                style={{
                  position: "absolute",
                  left: gx + (c * G) / cols + 4,
                  top: 24,
                  width: G / cols - 8,
                  height: G - 8,
                  borderRadius: 8,
                  backgroundColor: GOLD,
                  opacity: sceneId === "ask" ? 0.35 : 0.8,
                }}
              />
            ) : null,
          )}
          {Array.from({ length: cols - 1 }, (_, c) => (
            <div
              key={`cc${c}`}
              style={{
                position: "absolute",
                left: gx + ((c + 1) * G) / cols - 2,
                top: 20,
                width: 4,
                height: G,
                backgroundColor: EDGE,
              }}
            />
          ))}
          {showRows &&
            Array.from({ length: rows - 1 }, (_, r) => (
              <div
                key={`rc${r}`}
                style={{
                  position: "absolute",
                  left: gx,
                  top: 20 + ((r + 1) * G) / rows - 2,
                  width: G,
                  height: 4,
                  backgroundColor: EDGE,
                  opacity: sceneId === "record" ? 1 : fadeIn(frame, rowCutAt),
                }}
              />
            ))}
          {showRows &&
            Array.from({ length: x.n2 }, (_, c) => (
              <div
                key={`k${c}`}
                style={{
                  position: "absolute",
                  left: gx + (c * G) / cols + 4,
                  top: 20 + ((rows - unit.n) * G) / rows + 4,
                  width: G / cols - 8,
                  height: (G * unit.n) / rows - 8,
                  borderRadius: 8,
                  backgroundColor: BLUE,
                  opacity: sceneId === "record" ? 0.85 : fadeIn(frame, keepAt + c * 10) * 0.85,
                }}
              />
            ))}
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>
            {unit.n} × {x.n2} = {x.prodN} on top · {unit.d} × {x.d2} = {x.prodD} underneath
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- divide: a measuring piece hops across the shading --------------------
  if (unit.mode === "divide") {
    const cellW = BAR_W / unit.d;
    const hops = x.quot;
    const hopEvery = Math.round((dur * 0.55) / Math.max(1, hops));
    const hopStart = step(0.2);
    const fitsShown =
      sceneId === "action"
        ? Math.min(hops, Math.max(0, Math.floor((frame - hopStart) / hopEvery) + 1))
        : sceneId === "record"
          ? hops
          : 0;
    const headline =
      sceneId === "ask"
        ? `${unit.n}/${unit.d} ÷ ${x.n2}/${x.d2} — how many fit?`
        : sceneId === "parts"
          ? `${unit.n}/${unit.d}, and a ${x.n2}/${x.d2} to measure with`
          : sceneId === "action"
            ? "Count the fits"
            : `${unit.n}/${unit.d} ÷ ${x.n2}/${x.d2} = ${x.quot}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 330 }}>
          <Bar y={20} parts={unit.d} fill={(i) => (sceneId === "ask" ? null : i < unit.n ? GOLD : null)} />
          {sceneId !== "ask" && (
            <div
              style={{
                position: "absolute",
                left: BAR_X,
                top: 200,
                width: cellW - 8,
                height: BAR_H - 30,
                border: `4px solid ${BLUE}`,
                borderRadius: 10,
                backgroundColor: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Frac n={x.n2} d={x.d2} size={70} color={BLUE} />
            </div>
          )}
          {Array.from({ length: fitsShown }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: BAR_X + i * cellW + 8,
                top: 28,
                width: cellW - 16,
                height: BAR_H - 16,
                borderRadius: 10,
                border: `6px solid ${BLUE}`,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ fontSize: 44, fontWeight: 800, color: BLUE, marginRight: 8 }}>{i + 1}</span>
            </div>
          ))}
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>
            same as {unit.n}/{unit.d} × {x.d2}/{x.n2} — flip, then multiply
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- mixed & improper: whole bars plus parts ------------------------------
  if (unit.mode === "mixed" || unit.mode === "improper") {
    const isMixed = unit.mode === "mixed";
    const d = unit.d;
    const topN = isMixed ? d : Math.min(unit.n, d);
    const botN = isMixed ? unit.n : x.rem;
    const fillAt = step(0.2);
    const per = Math.round((dur * 0.55) / (topN + botN || 1));
    const filled =
      sceneId === "action"
        ? Math.max(0, Math.floor((frame - fillAt) / per) + 1)
        : sceneId === "ask"
          ? 0
          : sceneId === "parts"
            ? isMixed
              ? topN + botN
              : 0
            : topN + botN;
    const headline = isMixed
      ? sceneId === "ask"
        ? `1 ${unit.n}/${d} — a mixed number`
        : sceneId === "parts"
          ? `A whole bar, and ${unit.n}/${d} more`
          : sceneId === "action"
            ? `Count everything in ${d}ths`
            : `1 ${unit.n}/${d} = ${x.improperN}/${d}`
      : sceneId === "ask"
        ? `${unit.n}/${d} — top BIGGER than bottom?`
        : sceneId === "parts"
          ? `${unit.n} loose ${d}th pieces`
          : sceneId === "action"
            ? "Fill whole bars first"
            : `${unit.n}/${d} = ${x.wholes} whole + ${x.rem}/${d}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 340 }}>
          <Bar
            y={10}
            parts={d}
            fill={(i) => (i < Math.min(filled, topN) ? GOLD : null)}
            label={<span style={{ fontSize: 50, fontWeight: 800, color: GOLD }}>1</span>}
          />
          <Bar
            y={190}
            parts={d}
            fill={(i) => (i < filled - topN ? BLUE : null)}
            label={<Frac n={isMixed ? unit.n : x.rem} d={d} size={80} color={BLUE} />}
          />
          {!isMixed && sceneId === "parts" && (
            <div style={{ position: "absolute", left: BAR_X, top: 70, display: "flex", gap: 14 }}>
              {Array.from({ length: unit.n }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 10,
                    backgroundColor: i < d ? GOLD : BLUE,
                    border: `4px solid ${EDGE}`,
                    opacity: fadeIn(frame, step(0.2) + i * 8),
                  }}
                />
              ))}
            </div>
          )}
        </div>
        {sceneId === "record" && <div style={{ fontSize: 46, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  // ---- order: three same-length bars ---------------------------------------
  const rows = [
    { n: unit.n, d: unit.d, c: GOLD },
    { n: x.n2, d: x.d2, c: BLUE },
    { n: x.n3, d: x.d3, c: GREEN },
  ];
  const per = Math.round((dur * 0.5) / 3);
  const highlight =
    sceneId === "action" ? Math.max(0, Math.floor((frame - step(0.2)) / per) + 1) : sceneId === "record" ? 3 : 0;
  const headline =
    sceneId === "ask"
      ? `${unit.n}/${unit.d} · ${x.n2}/${x.d2} · ${x.n3}/${x.d3} — which is biggest?`
      : sceneId === "parts"
        ? "Same-length bars for all three"
        : sceneId === "action"
          ? "Read how far the shading reaches"
          : `${unit.n}/${unit.d} < ${x.n2}/${x.d2} < ${x.n3}/${x.d3}`;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
      <Title text={headline} enter={title} />
      <div style={{ position: "relative", width: STAGE_W, height: 470 }}>
        {rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <Bar
              y={10 + ri * 160}
              parts={r.d}
              fill={(i) => (sceneId === "ask" ? null : i < r.n ? r.c : null)}
              label={<Frac n={r.n} d={r.d} size={84} color={r.c} />}
            />
            {highlight > ri && (
              <div
                style={{
                  position: "absolute",
                  left: BAR_X + (BAR_W * r.n) / r.d + 12,
                  top: 10 + ri * 160 + BAR_H / 2 - 28,
                  fontSize: 44,
                  fontWeight: 800,
                  color: r.c,
                }}
              >
                → {ri === 0 ? "shortest" : ri === 1 ? "further" : "furthest"}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
}

export const FractionOpsVideo: React.FC<FracOpsProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = fracOpsUnitById(unitId);
  const scenes = fracOpsSceneTimings(unitId, voice);
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
