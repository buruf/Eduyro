// src/remotion/lesson/DecimalOpsVideo.tsx
// The DECIMAL OPERATIONS template (M7/M8). The hundred square carries most of
// it, inherited from the earlier decimal videos so the visual language stays
// continuous. Two exceptions the grid cannot make:
//
//   round      a NUMBER LINE — rounding is "which mark is it nearer?", which
//              is a distance question, not an area one
//   multiply2  the square cut BOTH ways, so the overlap of 0.3 across and 0.4
//              down is visibly 12 of 100 — the reason the answer is SMALLER
//              than either factor, which no rule about counting decimal
//              places ever explains
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
import { decimalOpsSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { decimalOpsUnitById, decimalOpsNumbers, type DecimalOpsUnit } from "./units-decimalops";

export type DecimalOpsProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const GREEN = "#2F7D4F";
const MUTED = "#8A7A5E";
const LINE = "#D8CDB8";

const STAGE_W = 1500;

interface SceneProps {
  dur: number;
  unit: DecimalOpsUnit;
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
        fontSize: 74,
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

/** A 10x10 hundred square with per-cell colouring. */
function Grid({
  x,
  y,
  cell,
  colourOf,
  label,
}: {
  x: number;
  y: number;
  cell: number;
  /** index 0..99 (column-major like the other decimal videos) -> colour or null */
  colourOf: (i: number) => string | null;
  label?: React.ReactNode;
}) {
  const gap = Math.max(2, Math.round(cell * 0.08));
  const step = cell + gap;
  return (
    <>
      {Array.from({ length: 100 }, (_, i) => {
        const col = Math.floor(i / 10);
        const row = i % 10;
        const c = colourOf(i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + col * step,
              top: y + row * step,
              width: cell,
              height: cell,
              borderRadius: Math.max(2, cell * 0.14),
              border: `2px solid ${LINE}`,
              backgroundColor: c ?? "transparent",
            }}
          />
        );
      })}
      {label !== undefined && (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y + 10 * step + 12,
            width: 10 * step - gap,
            textAlign: "center",
            fontSize: 44,
            fontWeight: 800,
            color: INK,
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const x = decimalOpsNumbers(unit);
  const step = (k: number) => Math.round(dur * k);
  const reveal = (at: number, d = 12) =>
    interpolate(frame, [at, at + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- compare: two hundred squares side by side ---------------------------
  if (unit.mode === "compare") {
    const cell = 40;
    const gw = 10 * (cell + 3);
    const leftX = STAGE_W / 2 - gw - 90;
    const rightX = STAGE_W / 2 + 90;
    const show = sceneId !== "ask";
    const headline =
      sceneId === "ask"
        ? `${unit.a} or ${x.b} — which is bigger?`
        : sceneId === "grid"
          ? `${x.aCells} cells vs ${x.bCells} cells`
          : sceneId === "action"
            ? "Fewer digits, more square"
            : `${x.bigger} > ${x.smaller}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 520 }}>
          <Grid
            x={leftX}
            y={20}
            cell={cell}
            colourOf={(i) => (show && i < x.aCells ? GOLD : null)}
            label={`${unit.a}  =  ${x.aCells}/100`}
          />
          <Grid
            x={rightX}
            y={20}
            cell={cell}
            colourOf={(i) => (show && i < x.bCells ? BLUE : null)}
            label={`${x.b}  =  ${x.bCells}/100`}
          />
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- round: a number line between two tenths -----------------------------
  if (unit.mode === "round") {
    const W = 1100;
    const lx = (STAGE_W - W) / 2;
    const ly = 190;
    const t = (unit.a - x.lower) / (x.upper - x.lower); // 0..1 along the line
    const markerX = lx + W * t;
    const showMid = sceneId === "action" || sceneId === "record";
    const headline =
      sceneId === "ask"
        ? `Round ${unit.a} to the nearest tenth`
        : sceneId === "grid"
          ? `Between ${x.lower} and ${x.upper}`
          : sceneId === "action"
            ? "Past the middle"
            : `${unit.a} rounds to ${x.rounded}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 380 }}>
          {/* the line */}
          <div style={{ position: "absolute", left: lx, top: ly, width: W, height: 6, backgroundColor: INK, borderRadius: 3 }} />
          {/* end ticks + labels */}
          {[0, 1].map((e) => (
            <React.Fragment key={e}>
              <div style={{ position: "absolute", left: lx + e * W - 3, top: ly - 26, width: 6, height: 58, backgroundColor: INK }} />
              <div style={{ position: "absolute", left: lx + e * W - 90, top: ly + 46, width: 180, textAlign: "center", fontSize: 46, fontWeight: 800, color: INK }}>
                {e === 0 ? x.lower : x.upper}
              </div>
            </React.Fragment>
          ))}
          {/* midpoint */}
          {showMid && (
            <>
              <div style={{ position: "absolute", left: lx + W / 2 - 2, top: ly - 16, width: 4, height: 38, backgroundColor: MUTED }} />
              <div style={{ position: "absolute", left: lx + W / 2 - 90, top: ly - 62, width: 180, textAlign: "center", fontSize: 30, fontWeight: 700, color: MUTED }}>
                halfway
              </div>
            </>
          )}
          {/* the value */}
          {sceneId !== "ask" && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: markerX - 14,
                  top: ly - 14,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: GOLD,
                  opacity: reveal(step(0.15)),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: markerX - 110,
                  top: ly - 118,
                  width: 220,
                  textAlign: "center",
                  fontSize: 46,
                  fontWeight: 800,
                  color: GOLD,
                  opacity: reveal(step(0.15)),
                }}
              >
                {unit.a}
              </div>
            </>
          )}
          {/* the landing arrow */}
          {sceneId === "record" && (
            <div
              style={{
                position: "absolute",
                left: lx + W - 150,
                top: ly + 110,
                width: 300,
                textAlign: "center",
                fontSize: 40,
                fontWeight: 800,
                color: GREEN,
              }}
            >
              ↑ nearer this one
            </div>
          )}
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- multiply2: one square cut both ways ---------------------------------
  if (unit.mode === "multiply2") {
    const cell = 46;
    const gw = 10 * (cell + 4);
    const gx = (STAGE_W - gw) / 2;
    const cols = x.aTenths; // 0.3 -> 3 columns
    const rows = x.bTenths; // 0.4 -> 4 rows
    const showRows = sceneId === "action" || sceneId === "record";
    const overlap = Math.round(x.product * 100);
    const headline =
      sceneId === "ask"
        ? `${unit.a} × ${x.b} — smaller than both?`
        : sceneId === "grid"
          ? `Shade ${unit.a} across`
          : sceneId === "action"
            ? `Now ${x.b} of it, down`
            : `${unit.a} × ${x.b} = ${x.product}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 560 }}>
          <Grid
            x={gx}
            y={10}
            cell={cell}
            colourOf={(i) => {
              const col = Math.floor(i / 10);
              const row = i % 10;
              const inCols = col < cols;
              const inRows = row < rows;
              if (sceneId === "ask") return null;
              if (showRows && inCols && inRows) return GREEN; // the overlap
              if (inCols) return GOLD;
              if (showRows && inRows) return "rgba(27,79,138,0.30)";
              return null;
            }}
            label={
              sceneId === "record" ? (
                <span style={{ color: GREEN }}>
                  {overlap} of 100 = {x.product}
                </span>
              ) : undefined
            }
          />
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 40, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- divide: group the shaded cells --------------------------------------
  // ---- addsub: both amounts on ONE grid, in different colours -------------
  // Adding decimals only looks hard because the digits line up badly. Shading
  // both amounts into the same hundred square makes them the same KIND of
  // thing (hundredths), and then it is plain counting.
  if (unit.mode === "addsub") {
    const cell = 46;
    const gw = 10 * (cell + 4);
    const gx = (STAGE_W - gw) / 2;
    const showB = sceneId !== "ask";
    const merged = sceneId === "action" || sceneId === "record";
    const headline =
      sceneId === "ask"
        ? `${unit.a} + ${x.b}`
        : sceneId === "grid"
          ? `${x.aCells} hundredths + ${x.bCells} hundredths`
          : sceneId === "action"
            ? `${x.totalCells} hundredths`
            : `${unit.a} + ${x.b} = ${x.total}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 560 }}>
          <Grid
            x={gx}
            y={10}
            cell={cell}
            colourOf={(i) => {
              if (i < x.aCells) return merged ? GREEN : GOLD;
              if (showB && i < x.totalCells) return merged ? GREEN : BLUE;
              return null;
            }}
            label={
              merged ? (
                <span style={{ color: GREEN }}>
                  {x.totalCells} cells = {x.total}
                </span>
              ) : showB ? (
                <span>
                  <span style={{ color: GOLD }}>{x.aCells}</span>
                  {" + "}
                  <span style={{ color: BLUE }}>{x.bCells}</span>
                </span>
              ) : undefined
            }
          />
        </div>
        {(sceneId === "action" || sceneId === "record") && (
          <div style={{ fontSize: 40, fontWeight: 800, color: MUTED, opacity: reveal(step(0.55)) }}>
            line up the decimal POINTS, not the ends
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- divide-whole: share the tenths into equal groups -------------------
  // Counted in TENTHS rather than hundredths, because "12 tenths shared
  // between 3" is a fact a child already owns.
  if (unit.mode === "divide-whole") {
    const groups = Math.round(x.b);
    const per = x.shareTenths;
    const cell = 62;
    const shown =
      sceneId === "ask" ? 0 : sceneId === "grid" ? 1 : Math.min(groups, Math.max(1, Math.floor((frame - step(0.15)) / Math.max(1, step(0.22))) + 1));
    const palette = [GOLD, BLUE, GREEN, "#B23B2E", "#7A5AA8"];
    const headline =
      sceneId === "ask"
        ? `${unit.a} ÷ ${x.b} — share it out`
        : sceneId === "grid"
          ? `${unit.a} is ${x.dividendTenths} tenths`
          : sceneId === "action"
            ? `${x.dividendTenths} tenths into ${groups} groups`
            : `${unit.a} ÷ ${x.b} = ${x.share}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
        <Title text={headline} enter={title} />
        {/* every tenth as a bar, then fenced into equal shares */}
        <div style={{ display: "flex", gap: sceneId === "ask" || sceneId === "grid" ? 8 : 30 }}>
          {Array.from({ length: groups }, (_, g) => (
            <div key={g} style={{ display: "flex", gap: 8 }}>
              {Array.from({ length: per }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: cell * 0.5,
                    height: cell,
                    borderRadius: 6,
                    border: `2px solid ${LINE}`,
                    backgroundColor: sceneId === "ask" ? "transparent" : g < shown ? palette[g % palette.length] : "rgba(200,144,42,0.22)",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        {(sceneId === "action" || sceneId === "record") && (
          <div style={{ fontSize: 46, fontWeight: 800, color: GREEN, opacity: reveal(step(0.5)) }}>
            {per} tenths each = {x.share}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "divide") {
    const cell = 46;
    const gw = 10 * (cell + 4);
    const gx = (STAGE_W - gw) / 2;
    const groups = Math.round(x.quotient);
    const per = Math.round((dur * 0.5) / Math.max(1, groups));
    const shown =
      sceneId === "action"
        ? Math.min(groups, Math.max(0, Math.floor((frame - step(0.2)) / per) + 1))
        : sceneId === "record"
          ? groups
          : 0;
    const palette = [GOLD, BLUE, GREEN, "#B23B2E", "#7A5AA8"];
    const headline =
      sceneId === "ask"
        ? `${unit.a} ÷ ${x.b} — how many fit?`
        : sceneId === "grid"
          ? `${x.aCells} cells, measured in ${x.bCells}s`
          : sceneId === "action"
            ? "Count the groups"
            : `${unit.a} ÷ ${x.b} = ${x.quotient}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 560 }}>
          <Grid
            x={gx}
            y={10}
            cell={cell}
            colourOf={(i) => {
              if (i >= x.aCells) return null;
              if (sceneId === "ask") return null;
              const g = Math.floor(i / Math.max(1, x.bCells));
              if (shown === 0) return GOLD;
              return g < shown ? palette[g % palette.length] : "rgba(200,144,42,0.25)";
            }}
            label={
              shown > 0 ? (
                <span style={{ color: GREEN }}>
                  {shown} group{shown === 1 ? "" : "s"} of {x.bCells}
                </span>
              ) : undefined
            }
          />
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 40, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- percent modes: a bar of the whole -----------------------------------
  {
    const isChange = unit.mode === "percent-change";
    const BAR_W = 1120;
    const bx = (STAGE_W - BAR_W) / 2;
    const partW = (BAR_W * x.pct) / 100;
    const showPart = sceneId !== "ask";
    const showResult = sceneId === "action" || sceneId === "record";
    const headline = isChange
      ? sceneId === "ask"
        ? `${unit.a}, up ${x.pct}% — what now?`
        : sceneId === "grid"
          ? `${x.pct}% of ${unit.a} = ${x.part}`
          : sceneId === "action"
            ? `Add it on, or take it off`
            : `↑ ${x.increased}   ↓ ${x.decreased}`
      : sceneId === "ask"
        ? `What is ${x.pct}% of ${unit.a}?`
        : sceneId === "grid"
          ? `Split ${unit.a} into 100 shares`
          : sceneId === "action"
            ? `Take ${x.pct} of those shares`
            : `${x.pct}% of ${unit.a} = ${x.part}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 400 }}>
          {/* whole bar */}
          <div style={{ position: "absolute", left: bx, top: 40, width: BAR_W, height: 120, border: `4px solid ${LINE}`, borderRadius: 12 }} />
          {showPart && (
            <div
              style={{
                position: "absolute",
                left: bx + 4,
                top: 44,
                width: partW - 8,
                height: 112,
                borderRadius: 8,
                backgroundColor: GOLD,
                opacity: reveal(step(0.15)),
              }}
            />
          )}
          <div style={{ position: "absolute", left: bx, top: 172, width: BAR_W, textAlign: "center", fontSize: 38, fontWeight: 700, color: MUTED }}>
            the whole: {unit.a}
          </div>
          {showPart && (
            <div
              style={{
                position: "absolute",
                left: bx,
                top: -46,
                width: partW,
                textAlign: "center",
                fontSize: 40,
                fontWeight: 800,
                color: GOLD,
                opacity: reveal(step(0.15)),
              }}
            >
              {x.pct}% = {x.part}
            </div>
          )}
          {/* result row */}
          {showResult && (
            <div style={{ position: "absolute", left: bx, top: 245, width: BAR_W, display: "flex", justifyContent: "center", gap: 60 }}>
              <div style={{ fontSize: 46, fontWeight: 800, color: GREEN }}>
                {isChange ? `${unit.a} + ${x.part} = ${x.increased}` : `${x.part}`}
              </div>
              {isChange && (
                <div style={{ fontSize: 46, fontWeight: 800, color: BLUE }}>
                  {unit.a} − {x.part} = {x.decreased}
                </div>
              )}
            </div>
          )}
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 40, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }
}

export const DecimalOpsVideo: React.FC<DecimalOpsProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = decimalOpsUnitById(unitId);
  const scenes = decimalOpsSceneTimings(unitId, voice);
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
