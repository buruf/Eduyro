// src/remotion/lesson/FunctionMachineVideo.tsx
// The FUNCTION MACHINE template (M14). One metaphor for the whole level: a
// function is a machine — a named box with an input funnel and an output
// chute. A number chip drops in, the rule card flashes, the result slides
// out. Notation, evaluation, composition, inverses and domain are staged as
// different things you do WITH that one machine, so nothing has to be
// re-taught per unit.
//
// Numbers are computed from the unit's declared rule (units-functions.ts);
// the machine can never show an answer the narration didn't derive.
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
import { functionSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import {
  functionUnitById,
  applyRule,
  ruleText,
  type FunctionUnit,
  type FnRule,
} from "./units-functions";

export type FunctionProps = {
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

interface SceneProps {
  dur: number;
  unit: FunctionUnit;
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
        fontSize: 72,
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

/** The machine: named box, funnel on top, chute below, rule on the front. */
function Machine({
  name,
  rule,
  colour = BLUE,
  jammed = false,
  width = 430,
}: {
  name: string;
  rule: string;
  colour?: string;
  jammed?: boolean;
  width?: number;
}) {
  return (
    <div style={{ position: "relative", width, textAlign: "center" }}>
      {/* funnel */}
      <div
        style={{
          margin: "0 auto",
          width: 0,
          height: 0,
          borderLeft: "70px solid transparent",
          borderRight: "70px solid transparent",
          borderTop: `44px solid ${jammed ? RED : colour}`,
          opacity: 0.35,
          rotate: "180deg",
        }}
      />
      {/* body */}
      <div
        style={{
          borderRadius: 26,
          border: `6px solid ${jammed ? RED : colour}`,
          backgroundColor: "#FFFFFF",
          padding: "26px 30px 30px",
          boxShadow: "0 10px 30px rgba(46,32,22,0.10)",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, color: jammed ? RED : colour }}>
          machine {name}
        </div>
        <div
          style={{
            // Long rules (the rational one) shrink instead of wrapping — a
            // fraction split across lines mid-parenthesis reads as nonsense.
            fontSize: rule.length > 14 ? 40 : 52,
            whiteSpace: "nowrap",
            fontWeight: 800,
            color: INK,
            marginTop: 8,
          }}
        >
          {rule}
        </div>
        {jammed && (
          <div style={{ fontSize: 38, fontWeight: 800, color: RED, marginTop: 8 }}>⚠ JAMMED</div>
        )}
      </div>
      {/* chute */}
      <div
        style={{
          margin: "0 auto",
          width: 120,
          height: 34,
          borderLeft: `6px solid ${jammed ? RED : colour}`,
          borderRight: `6px solid ${jammed ? RED : colour}`,
          borderBottom: `6px solid ${jammed ? RED : colour}`,
          borderRadius: "0 0 20px 20px",
          opacity: 0.55,
        }}
      />
    </div>
  );
}

/** A number chip travelling vertically through a machine between two heights. */
function Chip({
  value,
  x,
  fromY,
  toY,
  at,
  travel = 26,
  colour = GOLD,
  hold = true,
}: {
  value: string;
  x: number;
  fromY: number;
  toY: number;
  at: number;
  travel?: number;
  colour?: string;
  hold?: boolean;
}) {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = interpolate(frame, [at, at + travel], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  if (!hold && t >= 1) return null;
  const y = fromY + (toY - fromY) * t;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 44,
        top: y,
        width: 88,
        height: 88,
        borderRadius: "50%",
        backgroundColor: colour,
        color: "#FFF",
        fontSize: 44,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 16px rgba(46,32,22,0.25)",
      }}
    >
      {value}
    </div>
  );
}

/** In/out table that reveals one row at a time. */
function IOTable({
  rows,
  shown,
  colour = BLUE,
  outLabel = "out",
}: {
  rows: { x: string; y: string }[];
  shown: number;
  colour?: string;
  outLabel?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: `5px solid ${colour}`,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        width: 300,
      }}
    >
      <div style={{ display: "flex", backgroundColor: colour, color: "#FFF", fontWeight: 800, fontSize: 36 }}>
        <div style={{ flex: 1, padding: "10px 0", textAlign: "center" }}>in</div>
        <div style={{ flex: 1, padding: "10px 0", textAlign: "center" }}>{outLabel}</div>
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 800,
            color: INK,
            opacity: i < shown ? 1 : 0.12,
            borderTop: `2px solid ${colour}22`,
          }}
        >
          <div style={{ flex: 1, padding: "10px 0", textAlign: "center" }}>{r.x}</div>
          <div style={{ flex: 1, padding: "10px 0", textAlign: "center" }}>{r.y}</div>
        </div>
      ))}
    </div>
  );
}

// ---- Scenes ----------------------------------------------------------------
// Layout constants for the single-machine scenes.
const MACH_X = 960; // centre
const IN_Y = 210;
const OUT_Y = 700;

function SceneBody({ dur, unit, sceneId }: SceneProps & { sceneId: string }) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const f = (x: number) => applyRule(unit.rule, x);
  const eq = ruleText(unit.rule);

  // -- ask: machine introduced, first chip poised ---------------------------
  if (sceneId === "ask") {
    const chipAt = Math.round(dur * 0.25);
    const showBad = unit.mode === "domain-rational";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title
          text={
            unit.mode === "notation"
              ? "A machine for numbers"
              : unit.mode === "composition"
                ? "Two machines, chained"
                : unit.mode === "inverse"
                  ? "Can you go backwards?"
                  : unit.mode === "domain-range"
                    ? "What goes in? What comes out?"
                    : showBad
                      ? "One input breaks it…"
                      : "Evaluate the function"
          }
          enter={title}
        />
        <div style={{ display: "flex", gap: 90, alignItems: "flex-start" }}>
          <Machine name="f" rule={eq} />
          {unit.mode === "composition" && unit.rule2 && (
            <Machine name="g" rule={ruleText(unit.rule2, "g")} colour={GOLD} />
          )}
        </div>
        <Chip value={String(unit.inputs[0])} x={MACH_X} fromY={IN_Y - 90} toY={IN_Y - 60} at={chipAt} travel={16} />
      </AbsoluteFill>
    );
  }

  // -- work / twist / record per mode ---------------------------------------
  const step = (k: number) => Math.round(dur * k);

  if (unit.mode === "notation" || unit.mode === "evaluate") {
    // Chips fall through the machine one at a time; the table fills.
    const inputs = unit.inputs;
    const per = Math.floor((dur * 0.7) / inputs.length);
    const rows = inputs.map((x) => ({ x: String(x), y: String(f(x)) }));
    const shown =
      sceneId === "work"
        ? Math.min(inputs.length, Math.max(0, Math.floor((frame - step(0.15)) / per) + 1))
        : inputs.length;
    const headline =
      sceneId === "work"
        ? unit.mode === "notation"
          ? `f(${inputs[0]}) — feed ${inputs[0]} to machine f`
          : "Swap the x for the input"
        : sceneId === "twist"
          ? unit.mode === "notation"
            ? `f(${inputs[0]}) = ${f(inputs[0])} is a fact`
            : `The outputs climb by ${unit.rule.a} — it's a line`
          : "Name · input · output";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 26 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 110, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Machine name="f" rule={eq} />
            {sceneId === "work" &&
              inputs.map((x, i) => (
                <Chip
                  key={x}
                  value={String(x)}
                  x={215}
                  fromY={-80}
                  toY={40}
                  at={step(0.15) + i * per}
                  hold={false}
                />
              ))}
            {sceneId === "work" &&
              inputs.map((x, i) => (
                <Chip
                  key={`o${x}`}
                  value={String(f(x))}
                  x={215}
                  fromY={330}
                  toY={430}
                  at={step(0.15) + i * per + 30}
                  colour={GREEN}
                  hold={i === inputs.length - 1}
                />
              ))}
          </div>
          <IOTable rows={rows} shown={shown} outLabel={unit.mode === "notation" ? "f(x)" : "out"} />
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "composition" && unit.rule2) {
    const g = (x: number) => applyRule(unit.rule2!, x);
    const x0 = unit.inputs[0];
    const fFirst = sceneId !== "twist"; // twist swaps the order
    const m1 = fFirst ? unit.rule : unit.rule2;
    const m2 = fFirst ? unit.rule2 : unit.rule;
    const n1 = fFirst ? "f" : "g";
    const n2 = fFirst ? "g" : "f";
    const mid = applyRule(m1, x0);
    const out = applyRule(m2, mid);
    const headline =
      sceneId === "work"
        ? `g(f(${x0})) — inside first`
        : sceneId === "twist"
          ? `Swap them: f(g(${x0}))`
          : `Output of one → input of the next`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 130, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Machine name={n1} rule={ruleText(m1, n1)} colour={n1 === "f" ? BLUE : GOLD} width={400} />
            {sceneId !== "record" && (
              <>
                <Chip value={String(x0)} x={200} fromY={-80} toY={30} at={step(0.12)} hold={false} />
                <Chip value={String(mid)} x={200} fromY={310} toY={400} at={step(0.12) + 30} colour={GREEN} hold={false} />
              </>
            )}
          </div>
          <div style={{ fontSize: 70, color: MUTED, fontWeight: 800 }}>→</div>
          <div style={{ position: "relative" }}>
            <Machine name={n2} rule={ruleText(m2, n2)} colour={n2 === "f" ? BLUE : GOLD} width={400} />
            {sceneId !== "record" && (
              <>
                <Chip value={String(mid)} x={200} fromY={-80} toY={30} at={step(0.5)} hold={false} />
                <Chip value={String(out)} x={200} fromY={310} toY={400} at={step(0.5) + 30} colour={GREEN} />
              </>
            )}
          </div>
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color: INK }}>
          {sceneId === "record"
            ? unit.tip
            : `${x0} → ${mid} → ${out}`}
        </div>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "inverse") {
    const x0 = unit.inputs[0];
    const y0 = f(x0);
    const a = unit.rule.a ?? 1;
    const b = unit.rule.b ?? 0;
    const backward = sceneId === "work" || sceneId === "twist";
    const headline =
      sceneId === "work"
        ? "Undo the LAST step first"
        : sceneId === "twist"
          ? "That machine is f inverse"
          : `Forward: ×${a}, +${b}.  Inverse: −${b}, ÷${a}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 120, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Machine name="f" rule={eq} width={400} />
            <div style={{ textAlign: "center", fontSize: 40, fontWeight: 800, color: BLUE, marginTop: 14 }}>
              {x0} → {y0}
            </div>
          </div>
          {backward && (
            <div style={{ position: "relative" }}>
              <Machine name="f⁻¹" rule={`−${b}, then ÷${a}`} colour={GREEN} width={400} />
              <Chip value={String(y0)} x={200} fromY={-80} toY={30} at={step(0.2)} hold={false} colour={GREEN} />
              <Chip value={String(y0 - b)} x={200} fromY={140} toY={200} at={step(0.2) + 26} hold={false} colour={GREEN} />
              <Chip value={String(x0)} x={200} fromY={310} toY={400} at={step(0.2) + 52} colour={GOLD} />
              <div style={{ textAlign: "center", fontSize: 40, fontWeight: 800, color: GREEN, marginTop: 14 }}>
                {y0} → {y0 - b} → {x0}
              </div>
            </div>
          )}
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "domain-range") {
    const rows = unit.inputs.map((x) => ({ x: String(x), y: String(f(x)) }));
    const per = Math.floor((dur * 0.6) / rows.length);
    const shown = sceneId === "work" ? Math.min(rows.length, Math.max(0, Math.floor((frame - step(0.15)) / per) + 1)) : rows.length;
    const headline =
      sceneId === "work" ? "Anything can go in — the DOMAIN" : sceneId === "twist" ? "But what can come OUT? The RANGE" : "Domain in. Range out.";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 28 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 110, alignItems: "center" }}>
          <Machine name="f" rule={eq} />
          <IOTable rows={rows} shown={shown} />
        </div>
        {sceneId === "twist" && (
          <div style={{ fontSize: 48, fontWeight: 800, color: RED }}>
            outputs never go below 0
          </div>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>
            domain: all numbers · range: 0 and up
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // domain-rational
  {
    const [x1, x2, xBad] = unit.inputs;
    const k = unit.rule.k ?? 0;
    const show = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));
    const jam = sceneId === "twist";
    const rows = [
      { x: String(x1), y: show(f(x1)) },
      { x: String(x2), y: show(f(x2)) },
      { x: String(xBad), y: jam || sceneId === "record" ? "⚠" : "?" },
    ];
    const shown = sceneId === "work" ? Math.min(2, Math.max(0, Math.floor((frame - step(0.2)) / Math.floor(dur * 0.3)) + 1)) : 3;
    const headline =
      sceneId === "work" ? "Feed it numbers…" : jam ? `${xBad} makes the bottom ZERO` : `Domain: every x except ${k}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 28 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 110, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Machine name="f" rule={eq} jammed={jam} />
            {jam && (
              <Chip value={String(xBad)} x={215} fromY={-80} toY={40} at={step(0.15)} hold colour={RED} />
            )}
          </div>
          <IOTable rows={rows} shown={shown} colour={jam ? RED : BLUE} />
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }
}

export const FunctionMachineVideo: React.FC<FunctionProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = functionUnitById(unitId);
  const scenes = functionSceneTimings(unitId, voice);
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
