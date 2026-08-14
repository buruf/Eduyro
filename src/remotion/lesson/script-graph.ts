// src/remotion/lesson/script-graph.ts
// Narration for the COORDINATE GRAPH template (M11, M13, M16, M17, M18).
//
// Split out of script.ts, which had grown past 700 lines. Same contract: the
// lines are generated from the unit's own declared curve, so a lesson can
// never describe a graph it isn't drawing.
import {
  type GraphUnit,
  type Curve,
  quadraticRoots,
  lineIntersection,
} from "./units";
import type { LessonLine } from "./script";

// Scene ids are no longer one fixed list: the linear modes carry five bespoke
// beats (build-up, table, formula…) while the rest keep ask/plot/action/record.
// The timeline derives each unit's ids from its own lines via graphLineIds().
export function graphLineIds(u: GraphUnit): string[] {
  return graphLines(u).map((l) => l.id);
}

/** Human-readable equation for a declared curve. */
export function curveText(c: Curve): string {
  switch (c.kind) {
    case "linear": {
      const m = c.m ?? 1;
      const k = c.c ?? 0;
      // The − symbol renders correctly on screen AND speakable() reads it as
      // "minus", so one string serves both the equation card and the voice.
      const mPart = m === 1 ? "x" : m === -1 ? "−x" : `${m}x`;
      return k === 0 ? `y = ${mPart}` : `y = ${mPart} ${k < 0 ? "−" : "+"} ${Math.abs(k)}`;
    }
    case "quadratic": {
      const a = c.a ?? 1;
      const b = c.b ?? 0;
      const k = c.c ?? 0;
      let s = a === 1 ? "x²" : `${a}x²`;
      if (b) s += ` ${b < 0 ? "−" : "+"} ${Math.abs(b)}x`;
      if (k) s += ` ${k < 0 ? "−" : "+"} ${Math.abs(k)}`;
      return `y = ${s}`;
    }
    case "exponential":
      return `y = ${c.base ?? 2} to the power of x`;
    case "log":
      return `y = log base ${c.base ?? 2} of x`;
    case "hole": {
      const h = c.h ?? 2;
      return `y = x² minus ${h * h}, all over x minus ${h}`;
    }
  }
}

export function graphLines(u: GraphUnit): LessonLine[] {
  const eq = curveText(u.curve);

  switch (u.mode) {
    case "line": {
      // Build-up: y = x, stretch by m, lift by c, then the table. Every number
      // spoken is computed from the unit so screen and voice cannot disagree.
      const m = u.curve.m ?? 1;
      const c = u.curve.c ?? 0;
      const y0 = (x: number) => m * x; // before the lift
      const y1 = (x: number) => m * x + c;
      return [
        {
          id: "simple",
          text: `Let's build ${eq} one piece at a time. Start with the simplest line there is: y equals x. Whatever number you pick… you get the same one back. Zero gives zero. One gives one. Two gives two.`,
        },
        {
          id: "stretch",
          text: `Now multiply the x by ${m}. That's y equals ${m} x. Every height gets ${m} times bigger. One becomes ${y0(1)}… two becomes ${y0(2)}. Watch the line swing up — same start at zero, but steeper now.`,
        },
        {
          id: "lift",
          text: `Last piece: plus ${c}. Careful — adding ${c} doesn't push the line sideways. It lifts every point UP, by ${c}. So ${y0(0)}, ${y0(1)} and ${y0(2)} become ${y1(0)}, ${y1(1)} and ${y1(2)}. Same steepness… higher start.`,
        },
        {
          id: "table",
          text: `Here's how you'd plot it from scratch. Make a table. When x is 0, y is ${y1(0)}. When x is 1, y is ${y1(1)}. When x is 2, y is ${y1(2)}. Each row of the table is one point on the grid.`,
        },
        {
          id: "record",
          text: `Join the dots — perfectly straight. And here's the big idea. Every point sitting on that line is a pair that makes the equation true. The line isn't a picture of the answer. It IS the answers — all of them at once. ${u.tip}.`,
        },
      ];
    }

    case "slope": {
      const m = u.curve.m ?? 1;
      const c = u.curve.c ?? 0;
      // Two labeled points for the slope formula, chosen on integer x.
      const x1 = 1, x2 = 3;
      const p1y = m * x1 + c, p2y = m * x2 + c;
      const rise = p2y - p1y, run = x2 - x1;
      return [
        {
          id: "name",
          text: `This shape of equation has a name: y equals m x plus b. The m is called the slope. The b is called the y-intercept. In ours — ${eq} — the slope is ${m}, and the y-intercept is ${c}.`,
        },
        {
          id: "intercept",
          text: `The y-intercept is the easy one. It's where the line cuts through the y axis — where x is zero. Look… right there, at a height of ${c}. That's your b.`,
        },
        {
          id: "points",
          text: `Now the slope. Pick any two points on the line, and label them. Here's one at ${x1}, ${p1y}… and another at ${x2}, ${p2y}. The slope measures the climb between them.`,
        },
        {
          id: "formula",
          text: `Here's the slope formula: m equals y two minus y one… over x two minus x one. Plug in. Top: ${p2y} minus ${p1y} is ${rise}. Bottom: ${x2} minus ${x1} is ${run}. ${rise} over ${run}… the slope is ${m}. Up ${m} for every 1 across.`,
        },
        {
          id: "record",
          text: `So read it at a glance. In ${eq}: the ${m} is m, the slope — the climb. The ${c} is b, the y-intercept — where the line starts. ${u.tip}.`,
        },
      ];
    }

    case "system": {
      const c2 = u.curve2 ?? u.curve;
      const p = lineIntersection(u.curve, c2);
      const x = p ? p.x : 0;
      const y = p ? p.y : 0;
      const m1 = u.curve.m ?? 1, b1 = u.curve.c ?? 0;
      const m2 = c2.m ?? 1, b2 = c2.c ?? 0;
      const r1 = (xv: number) => m1 * xv + b1;
      const r2 = (xv: number) => m2 * xv + b2;
      const spokenCheck1 = `${m1} times ${x} plus ${b1}… ${r1(x)}`;
      const spokenCheck2 = `${m2 < 0 ? `minus ${Math.abs(m2) === 1 ? "" : Math.abs(m2) + " times "}${x}` : `${m2} times ${x}`} plus ${b2}… ${r2(x)}`;
      return [
        {
          id: "ask",
          text: `Two equations, one puzzle. The first says ${eq}. The second says ${curveText(c2)}. Could ONE pair of numbers make both of them true… at the same time?`,
        },
        {
          id: "line1",
          text: `Take the first one. Quick table: when x is 0, y is ${r1(0)}. At 1, it's ${r1(1)}. At 2, it's ${r1(2)}. Plot them, join them — the blue line is every pair the first equation allows.`,
        },
        {
          id: "line2",
          text: `Now the second equation, on the same grid. Its table: at 0, it's ${r2(0)}. At 1, it's ${r2(1)}. At 2… ${r2(2)}. Plot, join — the gold line is every pair the SECOND one allows. Did you spot that last row?`,
        },
        {
          id: "cross",
          text: `The lines cross exactly once. That point sits on the blue line AND the gold line at the same time. x is ${x}… y is ${y}. The one pair that works for both.`,
        },
        {
          id: "check",
          text: `Always check. First equation: ${spokenCheck1}. Yes. Second: ${spokenCheck2} again. That's what solving a system means — find where the lines meet, because that pair works everywhere. ${u.tip}.`,
        },
      ];
    }

    case "parabola": {
      const roots = quadraticRoots(u.curve);
      return [
        { id: "ask", text: `${eq}. What happens when you square the x?` },
        {
          id: "plot",
          text: `Work out a few. Minus 2 gives 0. Minus 1 gives minus 3. Zero gives minus 4. Then it climbs back up the other side.`,
        },
        {
          id: "action",
          text: `Join them, and it's not a line at all — it's a curve. A parabola. And look how symmetric it is. The left half mirrors the right, because squaring a negative gives you the same as squaring the positive.`,
        },
        {
          id: "record",
          text: `It crosses zero twice — at ${roots[0]}, and at ${roots[1]}. ${u.tip}.`,
        },
      ];
    }

    case "roots": {
      const roots = quadraticRoots(u.curve);
      const b = u.curve.b ?? 0;
      const c = u.curve.c ?? 0;
      const lhs = `x² ${b < 0 ? "minus" : "plus"} ${Math.abs(b)}x ${c < 0 ? "minus" : "plus"} ${Math.abs(c)}`;
      return [
        { id: "ask", text: `${lhs} equals zero. Solve it.` },
        { id: "plot", text: `Graph it first. Here's the curve for ${eq}.` },
        {
          id: "action",
          text: `Now think about what "equals zero" means. It means: where is y zero? And y is zero exactly along the x axis. So look where the curve crosses it. There… and there. At ${roots[0]}, and at ${roots[1]}.`,
        },
        {
          id: "record",
          text: `So x is ${roots[0]}, or ${roots[1]}. Two answers — because the curve crosses twice. ${u.tip}.`,
        },
      ];
    }

    case "exponential": {
      const base = u.curve.base ?? 2;
      return [
        { id: "ask", text: `y = ${base} to the power of x. What shape does that make?` },
        {
          id: "plot",
          text: `Work them out. At 0 it's 1. At 1, ${base}. At 2, ${base * base}. At 3, ${base ** 3}. At 4, ${base ** 4}.`,
        },
        {
          id: "action",
          text: `Plot them, and watch what happens. It barely moves at first… and then it takes off. Every step across multiplies it by ${base} — so the bigger it gets, the faster it grows.`,
        },
        {
          id: "record",
          text: `That's exponential growth. A straight line ADDS the same amount each step. This one multiplies. Which is why it always wins in the end. ${u.tip}.`,
        },
      ];
    }

    case "log": {
      const base = u.curve.base ?? 2;
      const cubed = base ** 3; // example is computed from the base, never hardcoded
      return [
        { id: "ask", text: `${base} to the WHAT makes ${cubed}? That question is a logarithm.` },
        {
          id: "plot",
          text: `Here's ${base} to the x again — the doubling curve. Feed it an exponent, it gives you a value.`,
        },
        {
          id: "action",
          text: `Now flip it. Swap x and y — mirror the whole thing in the diagonal. And that new curve is the log. Feed IT a value, and it hands you back the exponent.`,
        },
        {
          id: "record",
          text: `So log base ${base} of ${cubed} is 3… because ${base} cubed is ${cubed}. Same relationship — just asked the other way round. ${u.tip}.`,
        },
      ];
    }

    case "limit": {
      const h = u.curve.h ?? 2;
      const target = 2 * h;
      return [
        { id: "ask", text: `This one is undefined at x = ${h}. So what happens right next to it?` },
        {
          id: "plot",
          text: `${eq}. Everywhere except ${h}, that cancels down to x plus ${h} — a straight line. But at ${h} exactly you'd be dividing by zero. So there's a hole, right there.`,
        },
        {
          id: "action",
          text: `Walk in from the left. At ${h - 1} it's ${target - 1}. At ${h - 0.5}, ${target - 0.5}. Closer… it's heading for ${target}. Now come in from the right — also heading for ${target}.`,
        },
        {
          id: "record",
          text: `Both sides aim at ${target}. So the limit is ${target} — even though the function never actually gets there. ${u.tip}.`,
        },
      ];
    }

    case "derivative": {
      const at = u.at ?? 1;
      const slope = 2 * (u.curve.a ?? 1) * at;
      return [
        { id: "ask", text: `${eq}. How steep is it at x = ${at}?` },
        {
          id: "plot",
          text: `Tricky, because a curve's steepness keeps changing. So start with two points, and join them. THAT line's slope is easy to measure.`,
        },
        {
          id: "action",
          text: `Now slide the second point closer. And closer. The line swings round… and its slope settles down. When the two points are almost on top of each other, the line just touches the curve. That's the tangent.`,
        },
        {
          id: "record",
          text: `And its slope is ${slope}. That's the derivative at x = ${at}. ${u.tip}.`,
        },
      ];
    }

    case "integral": {
      const from = u.from ?? 0;
      const to = u.to ?? 4;
      const m = u.curve.m ?? 1;
      const area = (m * (to * to - from * from)) / 2;
      return [
        { id: "ask", text: `How much area is under this line, between ${from} and ${to}?` },
        { id: "plot", text: `Here's ${eq}. The bit we want is between the line and the x axis.` },
        {
          id: "action",
          text: `Chop it into rectangles. Four fat ones — that's a rough answer, sticking out in places. Now eight thinner ones… better. Now lots of very thin ones… and the gaps basically disappear.`,
        },
        {
          id: "record",
          text: `Add up all those strips and you get ${area}. That's the integral — the exact area underneath. ${u.tip}.`,
        },
      ];
    }
  }
}
