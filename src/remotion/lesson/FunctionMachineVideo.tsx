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
//
// SYNC (Sep 2026): every reveal that shows a number the narrator says is timed
// with `said(n, fallback, occurrence)` from the scene's clip alignment
// (timeline `saidFor`). Each scene declares the numbers its line says IN
// NARRATION ORDER (mirroring script-functions.ts), so a repeated number
// resolves to the right occurrence. The chip lands on its value, the rule on
// its numbers, the output on the result, and a composition's inner result
// lands before the outer one. Hand-picked frames survive only as fallbacks
// for clips without alignment, and reveals that follow no spoken number are
// marked `// not-speech-bound`.
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
import { functionSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import {
  functionUnitById,
  applyRule,
  ruleText,
  type FunctionUnit,
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
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** Frames at which a line's numbers are said, in the order the line says them.
 *  NaN where the clip has no alignment, so each caller supplies a fallback. */
const spokenAt = (said: SaidFn, order: number[]) =>
  order.map((n, k) => said(n, Number.NaN, before(n, order.slice(0, k))));

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

/** Anything that should appear exactly when its number is said. */
function Reveal({
  at,
  style,
  children,
}: {
  at: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const enter = useEnter(at);
  return (
    <div style={{ ...style, opacity: enter.opacity, translate: `0 ${enter.translateY}px` }}>
      {children}
    </div>
  );
}

function Title({ text, at = 4 }: { text: string; at?: number }) {
  return (
    <Reveal
      at={at}
      style={{
        fontSize: 72,
        fontWeight: 700,
        color: INK,
        textAlign: "center",
      }}
    >
      {text}
    </Reveal>
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

/** In/out table. Each row appears on the frame its OUTPUT is spoken (`rowAt`),
 *  so an answer is never on screen before the narrator says it. */
function IOTable({
  rows,
  rowAt,
  colour = BLUE,
  outLabel = "out",
}: {
  rows: { x: string; y: string }[];
  rowAt: number[];
  colour?: string;
  outLabel?: string;
}) {
  const frame = useCurrentFrame();
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
            opacity: frame >= (rowAt[i] ?? 0) ? 1 : 0.12,
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

function SceneBody({ dur, unit, sceneId, said }: SceneProps & { sceneId: string }) {
  const frame = useCurrentFrame();
  const f = (x: number) => applyRule(unit.rule, x);
  const eq = ruleText(unit.rule);
  // Hand-picked reveal points as a fraction of the scene: ONLY the fallback
  // for clips without alignment, and for reveals that follow no number.
  const step = (k: number) => Math.round(dur * k); // not-speech-bound: fallback only
  const CARRIED = 0; // not-speech-bound: already on screen from the previous scene

  // -- ask: machine introduced, first chip poised ---------------------------
  if (sceneId === "ask") {
    const a = unit.rule.a ?? 1;
    const b = unit.rule.b ?? 0;
    const x0 = unit.inputs[0];
    // Narration order per ask line (script-functions.ts):
    //   notation:   "…written as f(x) = 2x + 3"                     → [a, b]
    //   evaluate:   "f(x) = 3x + 2. Evaluate it at 0, at 1, at 2"   → [a, b, …inputs]
    //   composition:"f adds 2. g multiplies by 3. …a 2?"            → [b, g.a, x0]
    //   inverse:    "f(x)=2x+1. Feed it 3: times 2 is 6, plus 1… 7.
    //                …the OUTPUT, 7… back to the 3"                 → below
    //   domain-*:   squaring machine / "1 divided by, x minus 2"
    const order =
      unit.mode === "notation"
        ? [a, b]
        : unit.mode === "evaluate"
          ? [a, b, ...unit.inputs]
          : unit.mode === "composition"
            ? [b, unit.rule2?.a ?? 1, x0]
            : unit.mode === "inverse"
              ? [a, b, x0, a, a * x0, b, f(x0), f(x0), x0]
              : unit.mode === "domain-rational"
                ? [1, unit.rule.k ?? 0, 1, unit.rule.k ?? 0]
                : [];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    const chipFb = step(0.25); // not-speech-bound: fallback spacing
    // The chip lands when she names the input. Notation and the rational
    // domain never say it in the ask, so those keep the fallback.
    const chipAt =
      unit.mode === "evaluate" || unit.mode === "inverse"
        ? fb(2, chipFb)
        : unit.mode === "composition"
          ? fb(2, chipFb)
          : chipFb; // not-speech-bound: the ask line never says this input
    // Composition names each machine in turn ("f adds 2", "g multiplies by 3").
    const mfAt = unit.mode === "composition" ? fb(0, 0) : 0; // not-speech-bound elsewhere: the machine IS the subject of the line
    const mgAt = unit.mode === "composition" ? fb(1, 0) : 0;
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
        />
        <div style={{ display: "flex", gap: 90, alignItems: "flex-start" }}>
          <Reveal at={mfAt}>
            <Machine name="f" rule={eq} />
          </Reveal>
          {unit.mode === "composition" && unit.rule2 && (
            <Reveal at={mgAt}>
              <Machine name="g" rule={ruleText(unit.rule2, "g")} colour={GOLD} />
            </Reveal>
          )}
        </div>
        <Chip value={String(x0)} x={MACH_X} fromY={IN_Y - 90} toY={IN_Y - 60} at={chipAt} travel={16} />
      </AbsoluteFill>
    );
  }

  if (unit.mode === "notation" || unit.mode === "evaluate") {
    // Chips fall through the machine one at a time; the table fills.
    const inputs = unit.inputs;
    const a = unit.rule.a ?? 1;
    const b = unit.rule.b ?? 0;
    const rows = inputs.map((x) => ({ x: String(x), y: String(f(x)) }));
    const per = Math.floor((dur * 0.7) / inputs.length); // not-speech-bound: fallback spacing
    const fbIn = (i: number) => step(0.15) + i * per;
    const fbOut = (i: number) => step(0.15) + i * per + 30;
    // Narration order (script-functions.ts):
    //  notation work:  "f of 4 … feed 4 … 4 goes in… 2 times 4, plus 3… out comes 11"
    //  notation twist: "f of 4 equals 11 … turns 4 into 11"
    //  notation record:"f(4) means: feed 4 into machine f"
    //  evaluate work:  "Feed it 0… 3 times 0 is 0, plus 2 makes 2. Feed it 1… 5. And 2… 8"
    //  evaluate twist: "In: 0, 1, 2. Out: 2, 5, 8 … climb by 3"
    //  evaluate record: no numbers aligned
    const x0 = inputs[0];
    const y0 = f(x0);
    let order: number[] = [];
    if (unit.mode === "notation") {
      order =
        sceneId === "work"
          ? [x0, x0, x0, a, x0, b, y0]
          : sceneId === "twist"
            ? [x0, y0, x0, y0]
            : [x0, x0];
    } else {
      order =
        sceneId === "work"
          ? [x0, a, x0, a * x0, b, y0, ...inputs.slice(1).flatMap((x) => [x, f(x)])]
          : sceneId === "twist"
            ? [...inputs, ...inputs.map(f), a]
            : [];
    }
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    // work: chip i drops on its input word, the output chip lands on its value.
    const inAt = inputs.map((_, i) =>
      unit.mode === "notation" ? fb(2, fbIn(0)) : fb(i === 0 ? 0 : 6 + 2 * (i - 1), fbIn(i)),
    );
    const outAt = inputs.map((_, i) =>
      unit.mode === "notation" ? fb(6, fbOut(0)) : fb(i === 0 ? 5 : 7 + 2 * (i - 1), fbOut(i)),
    );
    // The table fills as each OUTPUT is spoken; in twist/record it is carried
    // over from work, already complete.
    const rowAt = inputs.map((_, i) => (sceneId === "work" ? outAt[i] : CARRIED));
    const titleAt =
      unit.mode === "notation"
        ? sceneId === "work"
          ? fb(0, 4) // "f of 4 — feed 4 to machine f"
          : sceneId === "twist"
            ? fb(0, 4) // "f(4) = 11 is a fact"
            : 4 // not-speech-bound: "Name · input · output"
        : sceneId === "twist"
          ? fb(inputs.length * 2, 4) // "The outputs climb by 3"
          : 4; // not-speech-bound: "Swap the x for the input" / "Name · input · output"
    const tipAt = unit.mode === "notation" ? fb(0, 4) : 4; // notation record says the tip's input; evaluate's has no alignment
    const headline =
      sceneId === "work"
        ? unit.mode === "notation"
          ? `f(${x0}) — feed ${x0} to machine f`
          : "Swap the x for the input"
        : sceneId === "twist"
          ? unit.mode === "notation"
            ? `f(${x0}) = ${y0} is a fact`
            : `The outputs climb by ${a} — it's a line`
          : "Name · input · output";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 26 }}>
        <Title text={headline} at={titleAt} />
        <div style={{ display: "flex", gap: 110, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Machine name="f" rule={eq} />
            {sceneId === "work" &&
              inputs.map((x, i) => (
                <Chip key={x} value={String(x)} x={215} fromY={-80} toY={40} at={inAt[i]} hold={false} />
              ))}
            {sceneId === "work" &&
              inputs.map((x, i) => (
                <Chip
                  key={`o${x}`}
                  value={String(f(x))}
                  x={215}
                  fromY={330}
                  toY={430}
                  at={outAt[i]}
                  colour={GREEN}
                  hold={i === inputs.length - 1}
                />
              ))}
          </div>
          <IOTable rows={rows} rowAt={rowAt} outLabel={unit.mode === "notation" ? "f(x)" : "out"} />
        </div>
        {sceneId === "record" && (
          <Reveal at={tipAt} style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>
            {unit.tip}
          </Reveal>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "composition" && unit.rule2) {
    const x0 = unit.inputs[0];
    const fFirst = sceneId !== "twist"; // twist swaps the order
    const m1 = fFirst ? unit.rule : unit.rule2;
    const m2 = fFirst ? unit.rule2 : unit.rule;
    const n1 = fFirst ? "f" : "g";
    const n2 = fFirst ? "g" : "f";
    const mid = applyRule(m1, x0);
    const out = applyRule(m2, mid);
    // Narration order:
    //  work:  "2 drops into f… out comes 4. That 4 falls into g… times 3… 12.
    //          …g of f of 2"                      → [x0, mid, mid, g.a, out, x0]
    //  twist: "2 into g first… 6. Then into f… 8. Different answer! 12 one way,
    //          8 the other"                       → [x0, mid, out, otherWay, out]
    //  record: no numbers aligned
    const otherWay = applyRule(unit.rule2, applyRule(unit.rule, x0));
    const order =
      sceneId === "work"
        ? [x0, mid, mid, unit.rule2.a ?? 1, out, x0]
        : sceneId === "twist"
          ? [x0, mid, out, otherWay, out]
          : [];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    const inAt = fb(0, step(0.12));
    const midOutAt = fb(1, step(0.12) + 30);
    // work re-says the middle number as it enters machine 2; twist doesn't, so
    // that chip sits midway between the two numbers around it.
    const midInAt =
      sceneId === "work"
        ? fb(2, step(0.5))
        : Math.round((midOutAt + fb(2, step(0.5))) / 2); // not-speech-bound: "Then into f" names no number
    const outAt = sceneId === "work" ? fb(4, step(0.5) + 30) : fb(2, step(0.5) + 30);
    const headline =
      sceneId === "work"
        ? `g(f(${x0})) — inside first`
        : sceneId === "twist"
          ? `Swap them: f(g(${x0}))`
          : `Output of one → input of the next`;
    const chain = [
      { text: String(x0), at: inAt },
      { text: String(mid), at: midOutAt },
      { text: String(out), at: outAt },
    ];
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title text={headline} at={sceneId === "record" ? 4 : fb(0, 4)} />
        <div style={{ display: "flex", gap: 130, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Machine name={n1} rule={ruleText(m1, n1)} colour={n1 === "f" ? BLUE : GOLD} width={400} />
            {sceneId !== "record" && (
              <>
                <Chip value={String(x0)} x={200} fromY={-80} toY={30} at={inAt} hold={false} />
                <Chip value={String(mid)} x={200} fromY={310} toY={400} at={midOutAt} colour={GREEN} hold={false} />
              </>
            )}
          </div>
          <div style={{ fontSize: 70, color: MUTED, fontWeight: 800 }}>→</div>
          <div style={{ position: "relative" }}>
            <Machine name={n2} rule={ruleText(m2, n2)} colour={n2 === "f" ? BLUE : GOLD} width={400} />
            {sceneId !== "record" && (
              <>
                <Chip value={String(mid)} x={200} fromY={-80} toY={30} at={midInAt} hold={false} />
                <Chip value={String(out)} x={200} fromY={310} toY={400} at={outAt} colour={GREEN} />
              </>
            )}
          </div>
        </div>
        {sceneId === "record" ? (
          <div style={{ fontSize: 52, fontWeight: 800, color: INK }}>{unit.tip}</div>
        ) : (
          <div style={{ display: "flex", gap: 16, fontSize: 52, fontWeight: 800, color: INK }}>
            {chain.map((c, i) => (
              <Reveal key={i} at={c.at} style={{ display: "flex", gap: 16 }}>
                {i > 0 ? "→" : ""} {c.text}
              </Reveal>
            ))}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "inverse") {
    const x0 = unit.inputs[0];
    const y0 = f(x0);
    const a = unit.rule.a ?? 1;
    const b = unit.rule.b ?? 0;
    const backward = sceneId === "work" || sceneId === "twist";
    // Narration order:
    //  work:   "multiplied by 2, THEN added 1 … subtract 1… 6. Then divide by
    //           2… 3"                              → [a, b, b, y0-b, a, x0]
    //  twist:  no numbers aligned
    //  record: "Forward: times 2, plus 1. Inverse: minus 1, divide 2"
    //                                              → [a, b, b, a]
    const order = sceneId === "work" ? [a, b, b, y0 - b, a, x0] : sceneId === "record" ? [a, b, b, a] : [];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    // The output chip re-enters the inverse machine on "subtract 1"; the two
    // results land on their own numbers.
    const backInAt = sceneId === "work" ? fb(2, step(0.2)) : step(0.2); // not-speech-bound in twist: y0 is not re-said
    const minusAt = sceneId === "work" ? fb(3, step(0.2) + 26) : step(0.2) + 26;
    const divAt = sceneId === "work" ? fb(5, step(0.2) + 52) : step(0.2) + 52;
    const headline =
      sceneId === "work"
        ? "Undo the LAST step first"
        : sceneId === "twist"
          ? "That machine is f inverse"
          : `Forward: ×${a}, +${b}.  Inverse: −${b}, ÷${a}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        {/* work/twist titles name no number; the record title is the forward
            half, which she reads as "times 2, plus 1". */}
        <Title text={headline} at={sceneId === "record" ? fb(0, 4) : 4} />
        <div style={{ display: "flex", gap: 120, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Machine name="f" rule={eq} width={400} />
            {/* not-speech-bound: the forward fact is carried from the ask */}
            <div style={{ textAlign: "center", fontSize: 40, fontWeight: 800, color: BLUE, marginTop: 14 }}>
              {x0} → {y0}
            </div>
          </div>
          {backward && (
            <div style={{ position: "relative" }}>
              <Machine name="f⁻¹" rule={`−${b}, then ÷${a}`} colour={GREEN} width={400} />
              <Chip value={String(y0)} x={200} fromY={-80} toY={30} at={backInAt} hold={false} colour={GREEN} />
              <Chip value={String(y0 - b)} x={200} fromY={140} toY={200} at={minusAt} hold={false} colour={GREEN} />
              <Chip value={String(x0)} x={200} fromY={310} toY={400} at={divAt} colour={GOLD} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 14,
                  fontSize: 40,
                  fontWeight: 800,
                  color: GREEN,
                  marginTop: 14,
                }}
              >
                <Reveal at={backInAt}>{y0}</Reveal>
                <Reveal at={minusAt}>→ {y0 - b}</Reveal>
                <Reveal at={divAt}>→ {x0}</Reveal>
              </div>
            </div>
          )}
        </div>
        {sceneId === "record" && (
          // not-speech-bound: the tip carries no number
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "domain-range") {
    const rows = unit.inputs.map((x) => ({ x: String(x), y: String(f(x)) }));
    const per = Math.floor((dur * 0.6) / rows.length); // not-speech-bound: fallback spacing
    // Narration order (work): "-3… squared… 9. 0… gives 0. 3… also 9" — the
    // minus is not a spoken number, so each input aligns on its magnitude.
    const order =
      sceneId === "work" ? unit.inputs.flatMap((x) => [Math.abs(x), f(x)]) : [];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    // Each row lands on its OUTPUT; twist/record carry the finished table.
    const rowAt = rows.map((_, i) => (sceneId === "work" ? fb(i * 2 + 1, step(0.15) + i * per) : CARRIED));
    const headline =
      sceneId === "work" ? "Anything can go in — the DOMAIN" : sceneId === "twist" ? "But what can come OUT? The RANGE" : "Domain in. Range out.";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 28 }}>
        {/* not-speech-bound: no headline in this mode names a number */}
        <Title text={headline} />
        <div style={{ display: "flex", gap: 110, alignItems: "center" }}>
          <Machine name="f" rule={eq} />
          <IOTable rows={rows} rowAt={rowAt} />
        </div>
        {sceneId === "twist" && (
          // not-speech-bound: "the range is zero and up" — "zero" is a word,
          // not an aligned number, so this lands on the fallback.
          <Reveal at={step(0.6)} style={{ fontSize: 48, fontWeight: 800, color: RED }}>
            outputs never go below 0
          </Reveal>
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
    /** The numbers a shown value is read as ("0.5" → 0 then 5). */
    const spokenParts = (v: number) => show(v).split(/[^0-9]+/).filter(Boolean).map(Number);
    // Narration order:
    //  work:  "Feed it 3: bottom is 3 minus 2, which is 1… output 1. Feed it 4:
    //          bottom is 2… output 0.5"
    //  twist: "Now feed it 2. Bottom: 2 minus 2… zero. And 1 divided by zero"
    //  record:"the domain is every number EXCEPT 2"
    const order =
      sceneId === "work"
        ? [x1, x1, k, x1 - k, ...spokenParts(f(x1)), x2, x2 - k, ...spokenParts(f(x2))]
        : sceneId === "twist"
          ? [xBad, xBad, k, 1]
          : [k];
    const at = spokenAt(said, order);
    const fb = (kk: number, fallback: number) => (Number.isNaN(at[kk] ?? Number.NaN) ? fallback : at[kk]);
    const row1Out = 4; // index of the first digit of output 1
    const row2Out = 4 + spokenParts(f(x1)).length + 2;
    const perFb = Math.floor(dur * 0.3); // not-speech-bound: fallback spacing
    // The machine jams on "1 divided by zero — the machine jams".
    const jamAt = sceneId === "twist" ? fb(3, step(0.15)) : 0;
    const jam = sceneId === "twist" && frame >= jamAt;
    const rows = [
      { x: String(x1), y: show(f(x1)) },
      { x: String(x2), y: show(f(x2)) },
      { x: String(xBad), y: jam || sceneId === "record" ? "⚠" : "?" },
    ];
    const rowAt =
      sceneId === "work"
        ? [fb(row1Out, step(0.2)), fb(row2Out, step(0.2) + perFb), Number.MAX_SAFE_INTEGER]
        : sceneId === "twist"
          ? [CARRIED, CARRIED, jamAt]
          : [CARRIED, CARRIED, CARRIED];
    const chipAt = sceneId === "twist" ? fb(0, step(0.15)) : step(0.15);
    const headline =
      sceneId === "work" ? "Feed it numbers…" : sceneId === "twist" ? `${xBad} makes the bottom ZERO` : `Domain: every x except ${k}`;
    const titleAt = sceneId === "work" ? 4 : fb(0, 4); // work's headline names no number
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 28 }}>
        <Title text={headline} at={titleAt} />
        <div style={{ display: "flex", gap: 110, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Machine name="f" rule={eq} jammed={jam} />
            {sceneId === "twist" && (
              <Chip value={String(xBad)} x={215} fromY={-80} toY={40} at={chipAt} hold colour={RED} />
            )}
          </div>
          <IOTable rows={rows} rowAt={rowAt} colour={jam ? RED : BLUE} />
        </div>
        {sceneId === "record" && (
          // not-speech-bound: the tip carries no number
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
          <SceneBody
            dur={scene.dur}
            unit={unit}
            sceneId={scene.id}
            said={saidFor(unitId, voice, scene.id)}
          />
        </Sequence>
      ))}
      <Brand />
    </AbsoluteFill>
  );
};
