// src/remotion/lesson/contracts.ts
// TEACHING CONTRACTS — the single source of truth for what every lesson video
// must say and show.
//
// A contract is derived ONLY from the unit's declared data (the same data the
// visuals and narration are generated from), never from the narration text it
// will be checked against. That independence is the point: if a generator
// drops an element the screen teaches — the "screen shows 6, 7, 8 but the
// voice says 6, 7" class of bug — the contract still demands it, and the
// validator fails the video before it can ship.
//
// requiredSpoken   numbers the narration MUST contain (the teaching elements)
// allowedNumbers   every number the narration MAY say; anything outside this
//                  set is "extra narration" and fails validation
// perScene         optional scene-level requirements: this element must be
//                  spoken IN that scene (not just somewhere in the video)
import { unitById, unitNumbers, columnUnitById, columnNumbers, tenFrameUnitById, dealingUnitById, factFamilyUnitById, areaUnitById, fractionBarUnitById, hundredGridUnitById, ratioUnitById, balanceUnitById, graphUnitById } from "./units";
import { countUnitById, compareUnitById, compareNumbers, numberLineUnitById, numberLineValues } from "./units-early";
import { functionUnitById, applyRule } from "./units-functions";
import { trigUnitById, triNumbers } from "./units-trig";
import { polyUnitById } from "./units-poly";
import { advancedUnitById, ADV } from "./units-advanced";
import { fracOpsUnitById, fracOpsNumbers } from "./units-fracops";
import { decimalOpsUnitById, decimalOpsNumbers } from "./units-decimalops";
import { lineIntersection, quadraticRoots } from "./units";

export interface TeachingContract {
  /** Numbers the narration must say, or the video fails. */
  requiredSpoken: number[];
  /** Every number the narration is allowed to say. Superset of requiredSpoken. */
  allowedNumbers: number[];
  /** Scene-scoped requirements: sceneId → numbers that must be spoken there. */
  perScene?: Record<string, number[]>;
}

/** Small scaffolding numbers every lesson may speak without declaring them:
 *  counting to ten, "step 1", "two numbers", ordinal talk. Deliberately does
 *  NOT extend past 12 — real teaching quantities must be declared. */
const SCAFFOLD = Array.from({ length: 13 }, (_, i) => i);

const uniq = (xs: number[]) => [...new Set(xs.filter((x) => Number.isFinite(x)))];

/** Decompose a value the way narrations legitimately talk about it. */
const digitsOf = (n: number) => String(Math.abs(Math.trunc(n))).split("").map(Number);
const placeParts = (n: number) => {
  const t = Math.trunc(Math.abs(n));
  return [t, Math.floor(t / 100) * 100, Math.floor((t % 100) / 10) * 10, t % 10, Math.floor(t / 10)];
};

export function contractFor(comp: string, unitId: string): TeachingContract {
  switch (comp) {
    case "EqualGroups": {
      const u = unitById(unitId);
      const n = unitNumbers(u);
      return {
        requiredSpoken: uniq([u.a, u.b, n.product]),
        allowedNumbers: uniq([
          ...SCAFFOLD, u.a, u.b, n.product, ...n.running,
          n.aNoZero, n.productNoZero, n.double1, n.half5, n.times10, n.times2,
        ]),
      };
    }

    case "Column": {
      const u = columnUnitById(unitId);
      const n = columnNumbers(u);
      return {
        requiredSpoken: uniq([u.x, u.y, n.answer]),
        allowedNumbers: uniq([
          ...SCAFFOLD, u.x, u.y, n.answer,
          ...placeParts(u.x), ...placeParts(u.y), ...placeParts(n.answer),
          ...digitsOf(u.x), ...digitsOf(u.y), ...digitsOf(n.answer),
          n.onesSum, n.leftover, n.tensSum, n.onesSum % 10, n.xOnes + 10,
          n.xTens - 1, n.xOnes, n.yOnes, n.xTens, n.yTens, n.xHundreds, n.yHundreds,
          n.xTens * 10, n.yTens * 10, n.xHundreds * 100, n.yHundreds * 100,
          n.xOnes - n.yOnes, n.xOnes + 10 - n.yOnes, 10,
        ]),
      };
    }

    case "TenFrame": {
      const u = tenFrameUnitById(unitId);
      const ans = u.op === "+" ? u.x + u.y : u.x - u.y;
      return {
        requiredSpoken: uniq([u.x, u.y, ans]),
        allowedNumbers: uniq([
          ...SCAFFOLD, u.x, u.y, ans, 10, 20,
          10 - u.x, 10 - u.y, u.x + u.x, u.y + u.y, u.x - u.y, u.y - u.x,
          u.x + 1, u.y + 1, ans - 10, 10 + (ans - 10), u.x - (10 - u.y), u.y - (10 - u.x),
          18, // "facts to 18" family talk
        ]),
      };
    }

    case "Dealing": {
      const u = dealingUnitById(unitId);
      const q = Math.floor(u.total / u.divisor);
      const r = u.total % u.divisor;
      return {
        requiredSpoken: uniq([u.total, u.divisor, q]),
        allowedNumbers: uniq([
          ...SCAFFOLD, u.total, u.divisor, q, r,
          q * u.divisor, u.total - r,
          ...Array.from({ length: q }, (_, i) => u.divisor * (i + 1)),
          Math.floor(u.total / 10), u.total % 10,
        ]),
      };
    }

    case "FactFamily": {
      const u = factFamilyUnitById(unitId);
      const whole = u.kind === "additive" ? u.a + u.b : u.a * u.b;
      return {
        requiredSpoken: uniq([u.a, u.b, whole]),
        allowedNumbers: uniq([...SCAFFOLD, u.a, u.b, whole, 18]),
      };
    }

    case "Area": {
      const u = areaUnitById(unitId);
      const tens = Math.floor(u.x / 10) * 10;
      const ones = u.x % 10;
      const yTens = Math.floor(u.y / 10) * 10;
      const yOnes = u.y % 10;
      const bothWays = u.y >= 10
        ? [yTens, yOnes, tens * yTens, ones * yTens, tens * yOnes, ones * yOnes]
        : [];
      return {
        requiredSpoken: uniq([u.x, u.y, u.x * u.y]),
        allowedNumbers: uniq([
          ...SCAFFOLD, u.x, u.y, u.x * u.y, tens, ones, tens * u.y, ones * u.y,
          Math.floor(u.x / 10), (ones * u.y) % 10, Math.floor((ones * u.y) / 10),
          tens * u.y + ones * u.y, ...bothWays,
        ]),
      };
    }

    case "FractionBar": {
      const u = fractionBarUnitById(unitId);
      const nums = [u.n, u.d, u.n2 ?? NaN, u.d2 ?? NaN];
      return {
        requiredSpoken: uniq(nums.filter((x) => Number.isFinite(x))),
        allowedNumbers: uniq([
          ...SCAFFOLD, ...nums, u.n + (u.n2 ?? 0), (u.d2 ?? u.d) / u.d, u.d / (u.d2 ?? u.d),
          u.n * 2, u.d * 2, u.n / 2, u.d / 2,
        ]),
      };
    }

    case "HundredGrid": {
      const u = hundredGridUnitById(unitId);
      const vals = [u.tenths, u.aCells, u.bCells, u.times, u.pct].filter(
        (x): x is number => Number.isFinite(x as number),
      );
      const derived = vals.flatMap((v) => [v, v * 10, v / 10, v / 100]);
      const sumCells = (u.aCells ?? 0) + (u.bCells ?? 0);
      const product = (u.tenths ?? 0) * (u.times ?? 0);
      const running = Array.from({ length: u.times ?? 0 }, (_, i) => ((u.tenths ?? 0) * (i + 1)) / 10);
      const diff = (u.aCells ?? 0) - (u.bCells ?? 0);
      return {
        requiredSpoken: uniq(vals),
        allowedNumbers: uniq([...SCAFFOLD, ...vals, ...derived, 100, 10, sumCells, sumCells / 100, product, product / 10, product / 100, ...running, diff, diff / 100, diff / 10]),
      };
    }

    case "RatioTable": {
      const u = ratioUnitById(unitId);
      const cols = [1, 2, 3, u.scale ?? 4];
      return {
        requiredSpoken: uniq([u.a, u.b]),
        allowedNumbers: uniq([
          ...SCAFFOLD, u.a, u.b,
          ...cols.flatMap((k) => [k, u.a * k, u.b * k]),
          u.b / u.a, u.a / u.b, 100,
        ]),
      };
    }

    case "Balance": {
      const u = balanceUnitById(unitId);
      const solution = (u.constR - u.constL) / u.coef;
      return {
        requiredSpoken: uniq([u.constL, u.constR, solution]),
        allowedNumbers: uniq([
          ...SCAFFOLD, u.coef, u.constL, u.constR, solution,
          u.constR - u.constL, u.coef * solution,
        ]),
      };
    }

    case "Count": {
      const u = countUnitById(unitId);
      const milestones = u.upTo <= 10 ? Array.from({ length: u.upTo }, (_, i) => i + 1) : [10, 20, 30, 40, 50, 100].filter((m) => m <= u.upTo);
      return {
        requiredSpoken: uniq([u.upTo, ...(u.mode === "recognise" ? [u.upTo] : milestones)]),
        allowedNumbers: uniq([...SCAFFOLD, ...milestones, u.upTo, ...Array.from({ length: Math.min(u.upTo, 12) }, (_, i) => i + 1), 60, 70, 80, 90]),
      };
    }

    case "Compare": {
      const u = compareUnitById(unitId);
      const n = compareNumbers(u);
      return {
        requiredSpoken: uniq([u.a, u.b]),
        allowedNumbers: uniq([...SCAFFOLD, u.a, u.b, n.extra]),
      };
    }

    case "NumberLine": {
      const u = numberLineUnitById(unitId);
      const n = numberLineValues(u);
      // THE golden case: every value the line displays — including the gap's
      // answer — must be spoken. "6, 7 but never 8" fails right here.
      return {
        requiredSpoken: uniq([...n.values]),
        allowedNumbers: uniq([...SCAFFOLD, ...n.values, u.start, u.step, n.gapValue]),
        perScene: { record: uniq([...n.values]) },
      };
    }

    case "Graph": {
      const u = graphUnitById(unitId);
      return graphContract(u);
    }

    case "FunctionMachine": {
      const u = functionUnitById(unitId);
      const outs = u.inputs.map((x) => applyRule(u.rule, x));
      const composed = u.rule2 ? outs.map((y) => applyRule(u.rule2!, y)) : [];
      const coefs = [u.rule.a, u.rule.b, u.rule.k, u.rule2?.a, u.rule2?.b, u.rule2?.k]
        .filter((x): x is number => Number.isFinite(x as number))
        .map(Math.abs);
      const finite = (xs: number[]) => xs.filter((v) => Number.isFinite(v) && Number.isInteger(v));
      return {
        requiredSpoken: uniq([...u.inputs.map(Math.abs), ...finite(u.rule2 ? composed : outs).map(Math.abs)]),
        allowedNumbers: uniq([
          ...SCAFFOLD,
          ...u.inputs.map(Math.abs),
          ...outs.filter(Number.isFinite).map((v) => Math.abs(Math.round(v * 100) / 100)),
          ...finite(composed).map(Math.abs),
          ...coefs,
        ]),
      };
    }

    case "Trig": {
      const u = trigUnitById(unitId);
      const n = triNumbers(u);
      const round2 = (v: number) => Math.round(v * 100) / 100;
      const base: number[] = [...SCAFFOLD, u.a, u.b, n.c, n.a2, n.b2, n.c2, round2(n.sin), round2(n.cos), round2(n.tan), round2(n.sin * n.sin), round2(n.cos * n.cos), u.a * 10, n.c * 10, 90, 180, 270, 360];
      switch (u.mode) {
        case "pythagorean":
          return { requiredSpoken: uniq([u.a, u.b, n.c, n.a2, n.b2, n.c2]), allowedNumbers: uniq(base) };
        case "side-names":
          return { requiredSpoken: uniq([u.a, u.b, n.c]), allowedNumbers: uniq(base) };
        case "ratios":
          return { requiredSpoken: uniq([u.a, u.b, n.c, round2(n.sin), round2(n.cos), round2(n.tan)]), allowedNumbers: uniq(base) };
        case "pyth-identity":
          return { requiredSpoken: uniq([round2(n.sin), round2(n.cos), round2(n.sin * n.sin), round2(n.cos * n.cos), 1]), allowedNumbers: uniq(base) };
        case "unit-circle":
          return { requiredSpoken: [1, 90, 180], allowedNumbers: uniq(base) };
        case "circle-values":
          return { requiredSpoken: [0, 90, 180, 270, 1], allowedNumbers: uniq(base) };
        case "radians":
          return { requiredSpoken: [180, 90, 360], allowedNumbers: uniq([...base, 60, 3]) };
        case "identities":
          return { requiredSpoken: [1], allowedNumbers: uniq(base) };
      }
      break;
    }

    case "Poly": {
      const u = polyUnitById(unitId);
      if (u.mode === "classify" || u.mode === "add") {
        const a = u.a;
        const b = u.b ?? [0, 0, 0];
        const s = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
        return {
          requiredSpoken: uniq(u.mode === "add" ? [...a, ...b, ...s].map(Math.abs) : a.map(Math.abs)),
          allowedNumbers: uniq([...SCAFFOLD, ...a.map(Math.abs), ...b.map(Math.abs), ...s.map(Math.abs)]),
        };
      }
      const p = u.p ?? 2, q = u.q ?? 3;
      return {
        requiredSpoken: uniq([p, q, p + q, p * q]),
        allowedNumbers: uniq([...SCAFFOLD, p, q, p + q, p * q, 1 + p * q, 1, p * q]),
      };
    }

    case "Advanced": {
      const u = advancedUnitById(unitId);
      return advancedContract(u.mode);
    }

    case "DecimalOps": {
      const u = decimalOpsUnitById(unitId);
      const x = decimalOpsNumbers(u);
      const base = [...SCAFFOLD, u.a, x.b, x.pct, 100, x.aCells, x.bCells];
      switch (u.mode) {
        case "compare":
          return {
            requiredSpoken: uniq([u.a, x.b, x.aCells, x.bCells]),
            allowedNumbers: uniq(base),
          };
        case "round":
          return {
            requiredSpoken: uniq([u.a, x.lower, x.upper, x.rounded]),
            allowedNumbers: uniq([...base, x.lower, x.upper, x.rounded]),
          };
        case "multiply2":
          return {
            requiredSpoken: uniq([u.a, x.b, x.product, Math.round(x.product * 100)]),
            allowedNumbers: uniq([...base, x.product, Math.round(x.product * 100), x.aTenths, x.bTenths, 10]),
          };
        case "divide":
          return {
            requiredSpoken: uniq([u.a, x.b, x.quotient]),
            allowedNumbers: uniq([...base, x.quotient]),
          };
        case "percent-of":
          return {
            requiredSpoken: uniq([u.a, x.pct, x.part]),
            allowedNumbers: uniq([...base, x.part, x.pct / 100, Math.round((u.a / 100) * 100) / 100]),
          };
        case "percent-change":
          return {
            requiredSpoken: uniq([u.a, x.pct, x.part, x.increased, x.decreased]),
            allowedNumbers: uniq([...base, x.part, x.increased, x.decreased]),
          };
      }
      break;
    }

    case "FractionOps": {
      const u = fracOpsUnitById(unitId);
      const x = fracOpsNumbers(u);
      switch (u.mode) {
        case "subtract":
          return {
            requiredSpoken: uniq([u.n, u.d, x.n2, x.diff]),
            allowedNumbers: uniq([...SCAFFOLD, u.n, u.d, x.n2, x.diff]),
          };
        case "multiply":
          return {
            requiredSpoken: uniq([u.n, u.d, x.n2, x.d2, x.prodN, x.prodD]),
            allowedNumbers: uniq([...SCAFFOLD, u.n, u.d, x.n2, x.d2, x.prodN, x.prodD]),
          };
        case "divide":
          return {
            requiredSpoken: uniq([u.n, u.d, x.n2, x.d2, x.quot]),
            allowedNumbers: uniq([...SCAFFOLD, u.n, u.d, x.n2, x.d2, x.quot]),
          };
        case "mixed":
          return {
            requiredSpoken: uniq([1, u.n, u.d, x.improperN]),
            allowedNumbers: uniq([...SCAFFOLD, u.n, u.d, x.improperN]),
          };
        case "improper":
          return {
            requiredSpoken: uniq([u.n, u.d, x.wholes, x.rem]),
            allowedNumbers: uniq([...SCAFFOLD, u.n, u.d, x.wholes, x.rem]),
          };
        case "order":
          return {
            requiredSpoken: uniq([u.n, u.d, x.n2, x.d2, x.n3, x.d3]),
            allowedNumbers: uniq([...SCAFFOLD, u.n, u.d, x.n2, x.d2, x.n3, x.d3]),
          };
      }
      break;
    }
  }
  throw new Error(`No contract for composition "${comp}" (unit ${unitId})`);
}

function advancedContract(mode: ReturnType<typeof advancedUnitById>["mode"]): TeachingContract {
  switch (mode) {
    case "order-integers": {
      const vals = ADV.integers.map(Math.abs);
      return { requiredSpoken: uniq(vals), allowedNumbers: uniq([...SCAFFOLD, ...vals]) };
    }
    case "order-ops": {
      const { a, b, c } = ADV.orderOps;
      return {
        requiredSpoken: uniq([a, b, c, a + b * c]),
        allowedNumbers: uniq([...SCAFFOLD, a, b, c, b * c, a + b * c, (a + b) * c, a + b]),
      };
    }
    case "complex": {
      const { a, b, c, d } = ADV.complex;
      return {
        requiredSpoken: uniq([a, b, c, d, a + c, b + d]),
        allowedNumbers: uniq([...SCAFFOLD, a, b, c, d, a + c, b + d]),
      };
    }
    case "sequence": {
      const { start, step, terms } = ADV.seq;
      const seq = Array.from({ length: terms }, (_, i) => start + step * i);
      const sums = seq.map((_, i) => seq.slice(0, i + 1).reduce((s, v) => s + v, 0));
      const next = start + step * terms; // displayed as the '+4 -> 19' reveal
      return {
        requiredSpoken: uniq([...seq, step, next]),
        allowedNumbers: uniq([...SCAFFOLD, ...seq, ...sums, step, next]),
      };
    }
    case "vectors": {
      const { v1, v2 } = ADV.vec;
      const sum = [v1[0] + v2[0], v1[1] + v2[1]];
      return {
        requiredSpoken: uniq([...v1, ...v2, ...sum]),
        allowedNumbers: uniq([...SCAFFOLD, ...v1, ...v2, ...sum]),
      };
    }
    case "power-rule": {
      const { n1, n2 } = ADV.power;
      return {
        requiredSpoken: uniq([n1, n1 - 1, n2, n2 - 1]),
        allowedNumbers: uniq([...SCAFFOLD, n1, n2, n1 - 1, n2 - 1]),
      };
    }
    case "monomials": {
      const { k, n } = ADV.mono;
      return {
        requiredSpoken: uniq([k, n, k * n, n - 1]),
        allowedNumbers: uniq([...SCAFFOLD, k, n, k * n, n - 1]),
      };
    }
    case "applications": {
      const { t } = ADV.app;
      return {
        requiredSpoken: uniq([t, 2 * t]),
        allowedNumbers: uniq([...SCAFFOLD, t, 2 * t, t * t]),
      };
    }
  }
}

function graphContract(u: ReturnType<typeof graphUnitById>): TeachingContract {
  const m = u.curve.m ?? 1;
  const c = u.curve.c ?? 0;
  switch (u.mode) {
    case "line": {
      const ys = [0, 1, 2].map((x) => m * x + c);
      const pre = [0, 1, 2].map((x) => m * x);
      return {
        requiredSpoken: uniq([m, c, ...ys]),
        allowedNumbers: uniq([...SCAFFOLD, m, c, ...ys, ...pre]),
      };
    }
    case "slope": {
      const x1 = 1, x2 = 3;
      const p1y = m * x1 + c, p2y = m * x2 + c;
      return {
        requiredSpoken: uniq([m, c, x1, p1y, x2, p2y, p2y - p1y, x2 - x1]),
        allowedNumbers: uniq([...SCAFFOLD, m, c, x1, p1y, x2, p2y, p2y - p1y, x2 - x1]),
      };
    }
    case "system": {
      const c2 = u.curve2 ?? u.curve;
      const p = lineIntersection(u.curve, c2);
      const m2 = c2.m ?? 1, b2 = c2.c ?? 0;
      const r1 = [0, 1, 2].map((x) => m * x + c);
      const r2 = [0, 1, 2].map((x) => m2 * x + b2);
      return {
        requiredSpoken: uniq([m, c, Math.abs(m2), b2, ...(p ? [p.x, p.y] : []), ...r1, ...r2]),
        allowedNumbers: uniq([...SCAFFOLD, m, c, Math.abs(m2), b2, ...r1, ...r2, ...(p ? [p.x, p.y] : [])]),
      };
    }
    case "parabola":
    case "roots": {
      const roots = quadraticRoots(u.curve);
      const a = u.curve.a ?? 1, b = u.curve.b ?? 0, k = u.curve.c ?? 0;
      const f = (x: number) => a * x * x + b * x + k;
      const evals = [-2, -1, 0, 1, 2].map(f);
      return {
        requiredSpoken: uniq(roots),
        allowedNumbers: uniq([...SCAFFOLD, ...roots, a, Math.abs(b), Math.abs(k), ...evals.map(Math.abs)]),
      };
    }
    case "exponential": {
      const base = u.curve.base ?? 2;
      const powers = [1, base, base ** 2, base ** 3, base ** 4];
      return { requiredSpoken: uniq([base, ...powers]), allowedNumbers: uniq([...SCAFFOLD, ...powers, base]) };
    }
    case "log": {
      const base = u.curve.base ?? 2;
      return { requiredSpoken: uniq([base, base ** 3, 3]), allowedNumbers: uniq([...SCAFFOLD, base, base ** 3]) };
    }
    case "limit": {
      const h = u.curve.h ?? 2;
      const target = 2 * h;
      return {
        requiredSpoken: uniq([h, target]),
        allowedNumbers: uniq([...SCAFFOLD, h, target, h - 1, target - 1, h * h, target - 0.5, h - 0.5]),
      };
    }
    case "derivative": {
      const at = u.at ?? 1;
      const slope = 2 * (u.curve.a ?? 1) * at;
      return { requiredSpoken: uniq([at, slope]), allowedNumbers: uniq([...SCAFFOLD, at, slope, u.curve.a ?? 1]) };
    }
    case "integral": {
      const from = u.from ?? 0;
      const to = u.to ?? 4;
      const area = ((u.curve.m ?? 1) * (to * to - from * from)) / 2;
      return { requiredSpoken: uniq([from, to, area]), allowedNumbers: uniq([...SCAFFOLD, from, to, area, u.curve.m ?? 1]) };
    }
    case "range": {
      const a = u.curve.a ?? 1, b = u.curve.b ?? 0, k = u.curve.c ?? 0;
      const vx = -b / (2 * a);
      const vy = a * vx * vx + b * vx + k;
      return { requiredSpoken: uniq([vy]), allowedNumbers: uniq([...SCAFFOLD, vx, vy, a, Math.abs(b), Math.abs(k)]) };
    }
    case "endbehavior": {
      return { requiredSpoken: [], allowedNumbers: uniq([...SCAFFOLD, u.curve.a ?? 1, Math.abs(u.curve.b ?? 0), Math.abs(u.curve.c ?? 0), 100]) };
    }
  }
}
