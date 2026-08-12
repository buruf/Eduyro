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

export const GRAPH_LINE_IDS = ["ask", "plot", "action", "record"] as const;

/** Human-readable equation for a declared curve. */
export function curveText(c: Curve): string {
  switch (c.kind) {
    case "linear": {
      const m = c.m ?? 1;
      const k = c.c ?? 0;
      const mPart = m === 1 ? "x" : m === -1 ? "minus x" : `${m}x`;
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
      const m = u.curve.m ?? 1;
      const c = u.curve.c ?? 0;
      const pts = [0, 1, 2].map((x) => `${x} gives ${m * x + c}`).join("… ");
      return [
        { id: "ask", text: `${eq}. What does that actually look like?` },
        {
          id: "plot",
          text: `Pick a few x values and work out y. ${pts}. Each pair is a point — so plot them.`,
        },
        {
          id: "action",
          text: `Now join them up… and they fall in a perfectly straight line. Every one of them. That's why it's called linear.`,
        },
        {
          id: "record",
          text: `And here's the real point. Every single spot ON that line is a pair that makes the equation true. The line isn't a picture of the answer — it IS the answers, all of them at once. ${u.tip}.`,
        },
      ];
    }

    case "slope": {
      const m = u.curve.m ?? 1;
      const c = u.curve.c ?? 0;
      return [
        { id: "ask", text: `${eq}. What do the ${m} and the ${c} actually do?` },
        {
          id: "plot",
          text: `Here's the line. Look where it cuts the y axis… at ${c}. That's your ${c}. It's the starting height.`,
        },
        {
          id: "action",
          text: `Now the ${m}. Step 1 across… and count how far up you had to go. ${m}. Step across again — up ${m} again. Every time, the same. That's the slope: ${m} up for every 1 across.`,
        },
        {
          id: "record",
          text: `So in y = m x plus c, the m is the climb, and the c is where it starts. ${u.tip}.`,
        },
      ];
    }

    case "system": {
      const p = lineIntersection(u.curve, u.curve2 ?? u.curve);
      const x = p ? p.x : 0;
      const y = p ? p.y : 0;
      return [
        {
          id: "ask",
          text: `Two equations at once. ${eq}… and ${curveText(u.curve2 ?? u.curve)}. Can one pair of numbers satisfy both?`,
        },
        {
          id: "plot",
          text: `Draw the first one. Every point on this line works for the first equation.`,
        },
        {
          id: "action",
          text: `Now the second, on the same axes. Every point on THAT line works for the second equation. And look… they cross. Once. Right there.`,
        },
        {
          id: "record",
          text: `That crossing sits on both lines at the same time, so it's the one pair that solves both. x is ${x}, y is ${y}. ${u.tip}.`,
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
          text: `Plot them, and watch what happens. It barely moves at first… and then it takes off. Every step across doubles it — so the bigger it gets, the faster it grows.`,
        },
        {
          id: "record",
          text: `That's exponential growth. A straight line ADDS the same amount each step. This one multiplies. Which is why it always wins in the end. ${u.tip}.`,
        },
      ];
    }

    case "log": {
      const base = u.curve.base ?? 2;
      return [
        { id: "ask", text: `${base} to the WHAT makes 8? That question is a logarithm.` },
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
          text: `So log base ${base} of 8 is 3… because ${base} cubed is 8. Same relationship — just asked the other way round. ${u.tip}.`,
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
        { id: "ask", text: `y = x². How steep is it at x = ${at}?` },
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
