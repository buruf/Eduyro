// src/lib/tutor/scaffold.ts
// ─────────────────────────────────────────────────────────────────────────────
// Engine/rule-driven reactive scaffolding.
import { polyWorkedSteps } from "@/lib/math/poly-steps";
//
// When a student gets a problem wrong, we rebuild understanding step-by-step:
//   • a plain-language read of what the problem is asking,
//   • progressive hints, revealed one at a time (never the answer up front),
//   • the answer, revealed last, then the student RE-TRIES the problem.
//
// This is fully DETERMINISTIC — derived from the problem's own structure, not an
// LLM guess — so it is free, instant, and always correct. (If an LLM key is ever
// added, it can wrap these hints in friendlier prose; the structure stays.)
// ─────────────────────────────────────────────────────────────────────────────

export interface Scaffold {
  /** One-sentence read of what the problem is asking / the idea to apply. */
  explanation: string;
  /** Progressive hints — revealed one at a time. Last hint states the answer. */
  hints: string[];
  /** The correct answer (shown after the hints). */
  answer: string;
  /** OPTIONAL viz marker ("[[viz missdots 6 13]]") rendered ONLY in the
   *  interactive practice modal — a see-and-count picture for young learners.
   *  PDF worked examples and the tutorial step-list ignore it, so it never
   *  leaks as literal text. */
  visual?: string;
}

// ── Early-addition teaching strategy ─────────────────────────────────────────
// A struggling adder must NEVER be told to "subtract" — that's a harder skill.
// We hint with the sheet's own mental-math strategy (doubles, near-doubles,
// make-ten, count-on), inferred from the skill name when given, else the number
// shape. Returns count-up-style steps + a ten-frame picture to count.
function additionStrategySteps(a: number, b: number, dir: string): string[] {
  const lo = Math.min(a, b), hi = Math.max(a, b), sum = a + b;
  const d = dir.toLowerCase();
  if (a === b || /\bdoubles?\b/.test(d) && !/near/.test(d)) return [`This is a double: ${a} + ${a}. Count the dots in both rows.`, `Double ${a} is ${sum}.`];
  if (Math.abs(a - b) === 1 || /near.?double/.test(d)) return [`Near-double: you know ${lo} + ${lo} = ${2 * lo}. This is just 1 more.`, `${2 * lo} + 1 = ${sum}.`];
  if (/make.?ten|bridg/.test(d) || (sum > 10 && hi >= 6 && sum <= 18)) return [`Make ten first: ${hi} needs ${10 - hi} to reach 10.`, `Then add the ${lo - (10 - hi)} left over: 10 + ${sum - 10} = ${sum}.`];
  return [`Start at ${hi} and count up ${lo} more — use the dots.`, `${hi}, then ${Array.from({ length: lo }, (_, i) => hi + i + 1).join(", ")}.`];
}

// Strip a leading visual marker ("[[viz pie 3 4]] …") and normalise whitespace.
function clean(q: string): string {
  return q
    .replace(/^\[\[viz[^\]]*\]\]\s*/, "")
    .replace(/\s+/g, " ")
    // Drop a TERMINAL "=" / "= ?" / "=?" so compact stems ("6+6=", "8÷2=?")
    // match the operation handlers. A mid-equation "=" ("2 + ___ = 4") has
    // content after it, so it is untouched.
    .replace(/\s*=\s*\?\s*$/, "")
    .replace(/\s*=\s*$/, "")
    .trim();
}

const skipCount = (a: number, b: number): string => {
  const n = Math.min(b, 6);
  const seq = Array.from({ length: n }, (_, i) => a * (i + 1)).join(", ");
  return b > 6 ? `${seq}, …` : seq;
};

export function buildScaffold(
  question: string,
  correct: string,
  student: string,
  opts: { subjectSlug?: string; explanation?: string; directive?: string } = {}
): Scaffold {
  // Multiple-choice stems end in "= ?" ("6 × 7 = ?") — normalize to the plain
  // form so every arithmetic handler matches. Unmatched MC math fell through to
  // the generic fallback, which REVEALED the answer on the first mistake.
  const q = clean(question).replace(/\s*=\s*\?\s*$/, " =").replace(/\s+=$/, " =");
  const A = String(correct);

  // ── "Break apart to multiply" (M5 bridge unit) ─────────────────────────────
  // These stems contain TWO multiplications, so they must be handled before the
  // ordinary a×b handlers mis-parse them. Each stage gets a computed decision
  // procedure — never the bland "rule out the choices" fallback.
  {
    // "23 × 3   Step 1: 20 × 3 =" / "Step 2: 3 × 3 ="
    // NOTE: `clean()` collapses whitespace and strips the terminal "=" — match
    // the post-clean form, not the raw stem.
    const step = q.match(/^(\d{2}) × (\d) Step ([12]): (\d+) × \d$/);
    if (step) {
      const [, whole, mult, which, part] = step;
      return which === "1"
        ? { explanation: `Multiply just the TENS part of ${whole}.`,
            hints: [`${whole} breaks into ${part} + ${Number(whole) % 10}. This step only wants the tens: ${part} × ${mult}.`,
                    `${part} is ${Number(part) / 10} tens. ${Number(part) / 10} tens × ${mult} = ${(Number(part) / 10) * Number(mult)} tens.`,
                    `${(Number(part) / 10) * Number(mult)} tens is ${A}.`], answer: A }
        : { explanation: `Multiply just the ONES part of ${whole}.`,
            hints: [`The ones digit of ${whole} is ${part}. This step only wants ${part} × ${mult}.`,
                    `That's a times-table fact you know: ${part} × ${mult} = ${A}.`], answer: A };
    }
    // Multiplying-tens paired stem: "2 × 7 = 14, so 20 × 7 =" (also hundreds).
    const paired = q.match(/^(\d) × (\d) = (\d+), so (\d+) × \d$/);
    if (paired) {
      const [, f, m, prod, big] = paired;
      const unit = big.length === 3 ? "hundreds" : "tens";
      const n = Number(big) / (big.length === 3 ? 100 : 10);
      return { explanation: `Use the fact you already know.`,
        hints: [`${big} is ${n} ${unit}. So this is ${n} ${unit} × ${m}.`,
                `${f} × ${m} = ${prod}, so ${n} ${unit} × ${m} = ${prod} ${unit}.`,
                `${prod} ${unit} is ${A}.`], answer: A };
    }
    // Carrying-unit scaffold: "27 × 3   Ones first: 7 × 3 =" / "Tens: 20 × 3 ="
    const carryStep = q.match(/^(\d{2}) × (\d) (Ones first|Tens): (\d+) × \d$/);
    if (carryStep) {
      const [, whole, mult, which, part] = carryStep;
      return which === "Ones first"
        ? { explanation: `The algorithm starts with the ones.`,
            hints: [`The ones digit of ${whole} is ${part}. Multiply it first: ${part} × ${mult}.`,
                    `${part} × ${mult} = ${A}. If it's 10 or more, the tens digit of it becomes the carry.`], answer: A }
        : { explanation: `Now the tens — multiply FIRST, then add any carry.`,
            hints: [`The tens part of ${whole} is ${part}. This step wants ${part} × ${mult} on its own.`,
                    `${part} × ${mult} = ${A}. (The carry gets added AFTER multiplying — never before.)`], answer: A };
    }
    // "20 × 3 = 60 and 3 × 3 = 9. So 23 × 3 =" (also matches the carrying
    // unit's ones-first combine — the guidance "add the two pieces" is right
    // for both)
    const comb = q.match(/^(\d+) × \d = (\d+) and \d+ × \d = (\d+)\. So (\d+) × (\d)$/);
    if (comb) {
      const [, , p1, p2, whole, mult] = comb;
      return { explanation: `Add the two parts you already found.`,
        hints: [`Both pieces of ${whole} × ${mult} are done: ${p1} and ${p2}. The answer is their SUM, not their product.`,
                `${p1} + ${p2} = ${A}.`], answer: A };
    }
    // "34 × 2 = (30 × 2) + (___ × 2)"
    const split = q.match(/^(\d{2}) × (\d) = \((\d+) × \d\) \+ \(___ × \d\)$/);
    if (split) {
      const [, whole, , tens] = split;
      return { explanation: `Find the missing part of the break-apart.`,
        hints: [`${whole} = ${tens} + something. What's left after the tens?`,
                `${whole} − ${tens} = ${A}. The ones digit of ${whole} is the missing piece.`], answer: A };
    }
    // "Break apart: 34 × 2 = (30 × 2) + (4 × 2) ="
    const oneLine = q.match(/^Break apart: (\d{2}) × (\d) = \((\d+) × (\d)\) \+ \((\d) × \d\)$/);
    if (oneLine) {
      const [, , , tens, mult, ones] = oneLine;
      const pT = Number(tens) * Number(mult), pO = Number(ones) * Number(mult);
      return { explanation: `Work each bracket, then add.`,
        hints: [`First bracket: ${tens} × ${mult} = ${pT}.`,
                `Second bracket: ${ones} × ${mult} = ${pO}.`,
                `${pT} + ${pO} = ${A}.`], answer: A };
    }
  }

  // ── Figure markers "[[viz kind n m …]]" — geometry figures get geometry
  // hints; fraction pictures (pie/bar/hexa…) get shaded-over-total. (Previously
  // EVERY marker was treated as a fraction → a right triangle got "Shaded parts".)
  const vizK = question.match(/\[\[viz (\w+)((?:\s+-?\d+)+)/);
  if (vizK) {
    const kind = vizK[1];
    const ns = vizK[2].trim().split(/\s+/).map(Number);
    const [a, b, c] = ns;
    const perim = /perimeter/i.test(opts.directive ?? "");
    if (kind === "angright") return { explanation: `Find the missing angle.`, hints: [`Complementary angles add to 90°.`, `90 − ${a} = ${A}.`, `Answer: ${A}.`], answer: A };
    if (kind === "angline") return { explanation: `Find the missing angle.`, hints: [`Angles on a straight line add to 180°.`, `180 − ${a} = ${A}.`, `Answer: ${A}.`], answer: A };
    if (kind === "angcross") return { explanation: `Find the missing angle.`, hints: [`Vertical (opposite) angles are equal.`, `So the missing angle is the same as ${a}.`, `Answer: ${A}.`], answer: A };
    if (kind === "angtri") return { explanation: `Find the third angle.`, hints: [`A triangle's angles add to 180°.`, `180 − ${a} − ${b} = ${A}.`, `Answer: ${A}.`], answer: A };
    if (kind === "geomrect") return { explanation: `Find the ${perim ? "perimeter" : "area"}.`, hints: [perim ? `Perimeter = 2 × (length + width).` : `Area = length × width.`, perim ? `2 × (${a} + ${b}) = ${A}.` : `${a} × ${b} = ${A}.`, `Answer: ${A}.`], answer: A };
    if (kind === "geomsquare") return { explanation: `Find the ${perim ? "perimeter" : "area"}.`, hints: [perim ? `Perimeter = 4 × side.` : `Area = side × side.`, perim ? `4 × ${a} = ${A}.` : `${a} × ${a} = ${A}.`, `Answer: ${A}.`], answer: A };
    if (kind === "geomtri") return { explanation: `Find the area of the triangle.`, hints: [`Area = ½ × base × height.`, `½ × ${a} × ${b} = ${A}.`, `Answer: ${A}.`], answer: A };
    if (kind === "geomcircle") { const area = /area/i.test(question); return { explanation: `Find the circle measure (use π = 3.14).`, hints: [area ? `Area = π × r².` : `Circumference = 2 × π × r.`, area ? `3.14 × ${a} × ${a} = ${A}.` : `2 × 3.14 × ${a} = ${A}.`, `Answer: ${A}.`], answer: A }; }
    if (kind === "geomright") {
      if (/sin|cos|tan/i.test(question)) {
        const isSin = /sin/i.test(question), isCos = /cos/i.test(question);
        const [num, den] = isSin ? ["opposite", "hypotenuse"] : isCos ? ["adjacent", "hypotenuse"] : ["opposite", "adjacent"];
        return { explanation: `Write the trig ratio as a fraction.`, hints: [`${isSin ? "sin" : isCos ? "cos" : "tan"} θ = ${num} / ${den}.`, `Read the two side lengths off the triangle, then simplify.`, `Answer: ${A}.`], answer: A };
      }
      if (c === 0) return { explanation: `Find the hypotenuse.`, hints: [`Pythagorean theorem: a² + b² = c².`, `${a}² + ${b}² = ${a * a + b * b}, so c = √${a * a + b * b} = ${A}.`, `Answer: ${A}.`], answer: A };
      return { explanation: `Find the missing leg.`, hints: [`Pythagorean theorem: leg² = hypotenuse² − other leg².`, `${c}² − ${b}² = ${c * c - b * b}, so the leg = √${c * c - b * b} = ${A}.`, `Answer: ${A}.`], answer: A };
    }
    // Fraction pictures → shaded parts over total parts.
    if (ns.length >= 2) return { explanation: `Count the shaded parts over the total parts.`, hints: [`Shaded parts: ${a}`, `Total equal parts: ${b}`, `Answer: ${A}.`], answer: A };
  }

  // ── Bare fraction stems ("6/8", "1/2 ___ 3/4") rely on the sheet's directive
  //    (or skill name) for the concept, since the instruction is no longer on
  //    each problem. Numbers are read from \frac{}{} or n/d. ───────────────────
  const dir = String(opts.directive ?? "").toLowerCase();
  const nums = (s: string) => {
    const f = [...s.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)].map((m) => [+m[1], +m[2]] as [number, number]);
    if (f.length) return f;
    return [...s.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => [+m[1], +m[2]] as [number, number]);
  };
  if (dir) {
    const fr = nums(q);
    if (/simplest form|simplify|reduce/.test(dir) && fr.length === 1) {
      const [n, d] = fr[0]; const g = gcd(n, d);
      return { explanation: `Simplifying: same amount, bigger pieces. Divide top AND bottom by the same number.`,
        hints: [
          `Step 1 — find a number that divides BOTH ${n} and ${d}: the biggest is ${g}.`,
          `Step 2 — divide both: ${n} ÷ ${g} = ${n / g} and ${d} ÷ ${g} = ${d / g} → ${n / g}/${d / g}.`,
          `Step 3 — check: nothing bigger than 1 divides both ${n / g} and ${d / g}, so it's done. Answer: ${A}.`,
        ], answer: A,
        visual: n <= d && d <= 24 ? `[[viz grid ${n} ${d}]]` : undefined };
    }
    if (/compare|>, <, or =|greater|larger/.test(dir) && fr.length === 2) {
      const [[n1, d1], [n2, d2]] = fr; const L = (d1 * d2) / gcd(d1, d2);
      const sameD = d1 === d2;
      return { explanation: `Step 1 — check the denominators${sameD ? `: both are ${d1}, so the pieces are the same size` : `: ${d1} and ${d2} are different — make the pieces the same size first`}.`,
        hints: sameD
          ? [
              `Same-size pieces → just compare the COUNTS: ${n1} vs ${n2}.`,
              `${Math.max(n1, n2)} pieces is more than ${Math.min(n1, n2)} pieces.`,
              `Answer: ${A}.`,
            ]
          : [
              `Common denominator ${L}: convert both — ${n1}/${d1} = ${n1 * (L / d1)}/${L} and ${n2}/${d2} = ${n2 * (L / d2)}/${L}.`,
              `Now the pieces match — compare the tops: ${n1 * (L / d1)} vs ${n2 * (L / d2)}.`,
              `Answer: ${A}.`,
            ], answer: A,
        visual: d1 <= 16 && d2 <= 16 ? `[[viz cmp ${n1} ${d1} ${n2} ${d2}]]` : undefined };
    }
    if (/order|least|greatest/.test(dir) && fr.length >= 3) {
      const L = fr.reduce((a, [, d]) => (a * d) / gcd(a, d), 1);
      return { explanation: `Give them a common denominator, then order by numerator.`,
        hints: [`Common denominator ${L}.`, `Compare the numerators, smallest first.`, `Answer: ${A}.`], answer: A };
    }
    if (/mixed number/.test(dir) && fr.length === 1) {
      const [n, d] = fr[0];
      return { explanation: `Divide the numerator by the denominator.`,
        hints: [`${n} ÷ ${d} = ${Math.floor(n / d)} remainder ${n % d}.`, `Whole part ${Math.floor(n / d)}, fraction ${n % d}/${d}.`, `Answer: ${A}.`], answer: A };
    }
    if (/improper/.test(dir)) {
      const wm = q.match(/(\d+)\s+\\frac\{(\d+)\}\{(\d+)\}/);
      if (wm) { const w = +wm[1], n = +wm[2], d = +wm[3];
        return { explanation: `Multiply the whole number by the denominator, add the numerator.`,
          hints: [`${w} × ${d} = ${w * d}.`, `${w * d} + ${n} = ${w * d + n}, over ${d}.`, `Answer: ${A}.`], answer: A }; }
    }
    if (/equivalent|missing/.test(dir) && fr.length >= 1) {
      // "1/2 = 2/?" — compute the actual scale factor from the pair of knowns.
      const em2 = q.match(/\{(\d+|\?)\}\{(\d+|\?)\}\s*=\s*\\?frac\{(\d+|\?)\}\{(\d+|\?)\}/);
      if (em2) {
        const [t1, b1, t2, b2] = [em2[1], em2[2], em2[3], em2[4]];
        // Which pair is fully known? tops (t1,t2) or bottoms (b1,b2).
        const kn = t1 !== "?" && t2 !== "?" ? [+t1, +t2, "top"] as const : b1 !== "?" && b2 !== "?" ? [+b1, +b2, "bottom"] as const : null;
        if (kn && kn[0] > 0 && Number.isInteger(kn[1] / kn[0])) {
          const f = kn[1] / kn[0];
          return { explanation: `Equivalent fractions: whatever multiplies the top must multiply the bottom.`,
            hints: [
              `Step 1 — find the known pair: the ${kn[2]} went from ${kn[0]} to ${kn[1]} — that's × ${f}.`,
              `Step 2 — do the SAME to the other part: multiply it by ${f}.`,
              `Answer: ${A}.`,
            ], answer: A,
            visual: t1 !== "?" && b1 !== "?" && +b1 <= 16 ? `[[viz bar ${t1} ${b1}]]` : undefined };
        }
      }
      return { explanation: `Multiply (or divide) top and bottom by the same number.`,
        hints: [`Find what the known part was multiplied by.`, `Apply the same factor to the other part.`, `Answer: ${A}.`], answer: A };
    }
    // Ratios "a : b" — simplify or scale.
    const ratio = q.match(/(\d+)\s*:\s*(\d+)(?:\s*×\s*(\d+))?/);
    if (/ratio|simplest form/.test(dir) && ratio && !ratio[3]) {
      const a = +ratio[1], b = +ratio[2], g = gcd(a, b);
      return { explanation: `Divide both terms by their greatest common factor.`,
        hints: [`Find the biggest number that divides evenly into BOTH ${a} and ${b} — it's ${g}.`, `Divide both parts by it: ${a} ÷ ${g} : ${b} ÷ ${g}.`, `Answer: ${A}.`], answer: A };
    }
    if (/scale/.test(dir) && ratio && ratio[3]) {
      const a = +ratio[1], b = +ratio[2], k = +ratio[3];
      return { explanation: `Multiply both terms by the factor.`,
        hints: [`${a} × ${k} = ${a * k}.`, `${b} × ${k} = ${b * k}.`, `Answer: ${A}.`], answer: A };
    }
    // Evaluate "x + 5,  x = 3"
    if (/evaluate/.test(dir)) {
      const ev = q.match(/x = (\d+)/);
      if (ev) return { explanation: `Substitute the value of x, then compute.`,
        hints: [`Replace x with ${ev[1]}.`, `Work out the arithmetic.`, `Answer: ${A}.`], answer: A };
    }
    // Solve for x — parse the equation and show the REAL both-sides working
    // ("subtract 3 from both sides — that eliminates the +3; now divide both
    // sides by 2 — x is alone"). A first-time learner needs to see WHY each
    // move isolates x, not "do the inverse operation".
    if (/solve/.test(dir) && q.includes("=")) {
      const qe = q.replace(/−/g, "-").replace(/^Solve for x:\s*/i, "").trim();
      let em: RegExpMatchArray | null;
      // ax + b = c  /  ax - b = c   (also 1x forms "x + b = c")
      em = qe.match(/^(\d*)x\s*([+-])\s*(\d+)\s*=\s*(-?\d+)$/);
      if (em) {
        const a = em[1] === "" ? 1 : +em[1], b = +em[3], c = +em[4], plus = em[2] === "+";
        const afterB = plus ? c - b : c + b;
        const steps: string[] = [
          `${plus ? "Subtract" : "Add"} ${b} on BOTH sides — that eliminates the ${plus ? "+" : "−"}${b}: ${a === 1 ? "x" : `${a}x`} = ${c} ${plus ? "−" : "+"} ${b} = ${afterB}.`,
        ];
        if (a !== 1) steps.push(`Now divide BOTH sides by ${a} to isolate x: x = ${afterB} ÷ ${a} = ${A}.`);
        else steps.push(`x is now alone: x = ${A}.`);
        return { explanation: `Isolate x by undoing each operation on BOTH sides.`, hints: [...steps, `Check: put ${A} back in — it works.`], answer: A };
      }
      // ax = c
      em = qe.match(/^(\d+)x\s*=\s*(-?\d+)$/);
      if (em) return { explanation: `x is multiplied by ${em[1]} — undo it.`, hints: [
        `Divide BOTH sides by ${em[1]} — that cancels the ×${em[1]} and leaves x alone.`,
        `x = ${em[2]} ÷ ${em[1]} = ${A}.`,
        `Check: ${em[1]} × ${A} = ${em[2]}.`,
      ], answer: A };
      // x/d = q  (plain or \frac{x}{d})
      em = qe.match(/x\s*\/\s*(\d+)\s*=\s*(-?\d+)$/) ?? qe.match(/\\frac\{x\}\{(\d+)\}\s*=\s*(-?\d+)/);
      if (em) return { explanation: `x is divided by ${em[1]} — undo it.`, hints: [
        `Multiply BOTH sides by ${em[1]} — that cancels the ÷${em[1]}.`,
        `x = ${em[2]} × ${em[1]} = ${A}.`,
        `Check: ${A} ÷ ${em[1]} = ${em[2]}.`,
      ], answer: A };
      // k(x ± b) = c
      em = qe.match(/^(\d+)\(x\s*([+-])\s*(\d+)\)\s*=\s*(-?\d+)$/);
      if (em) {
        const k = +em[1], b = +em[3], c = +em[4], plus = em[2] === "+";
        const inner = c / k;
        return { explanation: `The whole bracket is multiplied by ${k} — undo the outside first.`, hints: [
          `Divide BOTH sides by ${k}: x ${plus ? "+" : "−"} ${b} = ${c} ÷ ${k} = ${inner}.`,
          `${plus ? "Subtract" : "Add"} ${b} on BOTH sides to leave x alone: x = ${inner} ${plus ? "−" : "+"} ${b} = ${A}.`,
          `Check: ${k}(${A} ${plus ? "+" : "−"} ${b}) = ${c}.`,
        ], answer: A };
      }
      // ax = x + c  (variables on both sides)
      em = qe.match(/^(\d+)x\s*=\s*x\s*\+\s*(-?\d+)$/);
      if (em) {
        const a = +em[1], c = +em[2];
        return { explanation: `x appears on BOTH sides — gather it on one side first.`, hints: [
          `Subtract x from BOTH sides — the right side's x is eliminated: ${a}x − x = ${a - 1}x, so ${a - 1}x = ${c}.`,
          `Divide BOTH sides by ${a - 1}: x = ${c} ÷ ${a - 1} = ${A}.`,
          `Check: ${a} × ${A} = ${A} + ${c}.`,
        ], answer: A };
      }
      // Unparsed equation → still teach the both-sides principle concretely.
      return { explanation: `Isolate x by undoing each operation on BOTH sides of the equals sign.`,
        hints: [`Undo addition/subtraction first — apply the opposite to BOTH sides so the constant is eliminated.`, `Then undo multiplication/division the same way — x is left alone.`, `x = ${A}.`], answer: A };
    }
    // Round "3.47 → nearest tenth". Word-bounded: the directive "Angles AROUND
    // a point" was matching /round/ and giving geometry sheets rounding hints.
    if (/\brounds?\b|\brounding\b|\bround\b/.test(dir)) {
      const place = /whole/.test(q) ? "ones" : /tenth/.test(q) ? "tenths" : "named";
      return { explanation: `Look at the digit just right of the ${place} place.`,
        hints: [`If it's 5 or more, round up; otherwise round down.`, `Answer: ${A}.`], answer: A };
    }
    // Percent of a number "25% of 80"
    if (/percent of|find .*percent/.test(dir) && /%\s*of/.test(q)) {
      const pm = q.match(/(\d+)%\s*of\s*(\d+)/);
      if (pm) return { explanation: `Turn the percent into a fraction, then multiply.`,
        hints: [`${pm[1]}% = ${pm[1]}/100.`, `${pm[2]} × ${pm[1]}/100.`, `Answer: ${A}.`], answer: A };
    }
    // Conversions — "1/4 → percent", "Write ½ as a decimal", "0.125 → fraction",
    // "25% → decimal" … REAL computed steps for all six directions (a first-time
    // learner needs every step shown, not "apply the matching step").
    {
      const target = (q.match(/(?:→|as an?)\s*(decimal|percent|fraction)/i)?.[1] ?? "").toLowerCase();
      const fr2 = q.match(/\\frac\{(\d+)\}\{(\d+)\}/) ?? q.match(/(?<![\d.])(\d+)\s*\/\s*(\d+)/);
      const pct2 = q.match(/(\d+(?:\.\d+)?)\s*%/);
      const dec2 = !pct2 ? q.match(/(\d+\.\d+)/) : null;
      if (target === "decimal" && fr2) {
        const n = +fr2[1], d = +fr2[2];
        return { explanation: `A fraction IS a division: the top divided by the bottom.`, hints: [
          `${n}/${d} means ${n} ÷ ${d}.`,
          `Divide: ${n} ÷ ${d} = ${n / d}.`,
          `Answer: ${A}.`,
        ], answer: A };
      }
      if (target === "percent" && fr2) {
        const n = +fr2[1], d = +fr2[2];
        const clean100 = 100 % d === 0;
        return { explanation: `Percent means "out of 100" — make the bottom 100.`, hints: [
          clean100
            ? `Multiply top and bottom by ${100 / d}: ${n}/${d} = ${n * (100 / d)}/100.`
            : `First divide: ${n} ÷ ${d} = ${n / d}. Then multiply by 100.`,
          clean100 ? `${n * (100 / d)} out of 100 is ${n * (100 / d)}%.` : `${n / d} × 100 = ${(n / d) * 100}%.`,
          `Answer: ${A}.`,
        ], answer: A };
      }
      if (target === "fraction" && dec2) {
        const s0 = dec2[1].split(".")[1].length, den = Math.pow(10, s0), num = Math.round(parseFloat(dec2[1]) * den), g = gcd(num, den);
        return { explanation: `Read the decimal by its place value.`, hints: [
          `${dec2[1]} means ${num} ${den === 10 ? "tenths" : den === 100 ? "hundredths" : "thousandths"}: ${num}/${den}.`,
          `Simplify: divide top and bottom by ${g} → ${num / g}/${den / g}.`,
          `Answer: ${A}.`,
        ], answer: A };
      }
      if (target === "percent" && dec2) {
        return { explanation: `Decimal → percent: multiply by 100.`, hints: [
          `${dec2[1]} × 100 — move the decimal point TWO places right.`,
          `That gives ${parseFloat(dec2[1]) * 100}. Add the % sign.`,
          `Answer: ${A}.`,
        ], answer: A };
      }
      if (target === "decimal" && pct2) {
        return { explanation: `Percent → decimal: divide by 100.`, hints: [
          `${pct2[1]}% = ${pct2[1]} ÷ 100.`,
          `Move the decimal point TWO places left: ${parseFloat(pct2[1]) / 100}.`,
          `Answer: ${A}.`,
        ], answer: A };
      }
      if (target === "fraction" && pct2) {
        const p0 = Math.round(parseFloat(pct2[1])), g = gcd(p0, 100);
        return { explanation: `Percent means "out of 100".`, hints: [
          `${p0}% = ${p0}/100.`,
          `Simplify: divide top and bottom by ${g} → ${p0 / g}/${100 / g}.`,
          `Answer: ${A}.`,
        ], answer: A };
      }
    }
    // Increase/decrease "80 + 25%"
    if (/increase|decrease/.test(dir)) {
      const cm = q.match(/(\d+)\s*([+−-])\s*(\d+)%/);
      if (cm) return { explanation: `Find the percent of the number, then add or subtract it.`,
        hints: [`${cm[3]}% of ${cm[1]} = ${(+cm[3] / 100) * +cm[1]}.`, `${cm[2] === "+" ? "Add" : "Subtract"} it.`, `Answer: ${A}.`], answer: A };
    }
  }

  // ── Multiplication: "a × b" ──────────────────────────────────────────────
  let m = q.match(/^(\d+)\s*×\s*(\d+)\s*=?\s*$/);
  if (m) {
    const a = +m[1], b = +m[2];
    // Two multi-digit factors → partial products (the method the mul-2d2d
    // video teaches). "Count the dots" on 35 × 92 would be 3,220 dots — the
    // group-counting model stops being a model long before numbers this size.
    if (a >= 10 && b >= 10) {
      const bT = Math.floor(b / 10) * 10;
      const bO = b % 10;
      // A ROUND second factor needs no splitting - "split the 80 into 80 + 0"
      // and "add the pieces: 1840 = 1840" is nonsense dressed as a method.
      // It is the multiply-by-tens move the mul-tens video teaches: cover the
      // zero, multiply, put the zero back.
      if (bO === 0) {
        return {
          explanation: `${a} × ${b}: cover the zero, multiply, then put it back.`,
          hints: [
            `Cover the zero in ${b}. That leaves ${a} × ${bT / 10}.`,
            `${a} × ${bT / 10} = ${a * (bT / 10)}.`,
            `Now put the zero back on: ${A}.`,
          ],
          answer: A,
        };
      }
      return {
        explanation: `${a} × ${b} is too big to count - split the ${b} into ${bT} + ${bO}, multiply each piece, then add.`,
        hints: [
          `${a} × ${bT}: do ${a} × ${bT / 10} = ${a * (bT / 10)}, then put the zero back → ${a * bT}.`,
          `${a} × ${bO} = ${a * bO}.`,
          `Add the pieces: ${a * bT} + ${a * bO} = ${A}.`,
        ],
        answer: A,
      };
    }
    // Multi-digit by a single digit → teach the column method; otherwise it's a
    // times-table fact, so skip-counting is the better mental model.
    if (b >= 10 && a < 10) {
      // Commutative flip so "4 × 27" coaches the same way as "27 × 4".
      const [lo, hi] = [a, b];
      const ones = hi % 10, tens = Math.floor(hi / 10);
      return {
        explanation: `Multiply ${hi} by ${lo} one digit at a time, right to left.`,
        hints: [
          `Multiply the ones: ${ones} × ${lo} = ${ones * lo}. Write the ones digit, carry the rest.`,
          `Multiply the tens: ${tens} × ${lo} = ${tens * lo} (then add any carry).`,
          `Put the digits together. ${a} × ${b} = ${A}.`,
        ],
        answer: A,
      };
    }
    if (a >= 10 && b < 10) {
      const ones = a % 10, tens = Math.floor(a / 10);
      return {
        explanation: `Multiply ${a} by ${b} one digit at a time, right to left.`,
        hints: [
          `Multiply the ones: ${ones} × ${b} = ${ones * b}. Write the ones digit, carry the rest.`,
          `Multiply the tens: ${tens} × ${b} = ${tens * b} (then add any carry).`,
          `Put the digits together. ${a} × ${b} = ${A}.`,
        ],
        answer: A,
      };
    }
    return {
      explanation: `${a} × ${b} means ${a} added together ${b} times — count the dots if you need to.`,
      hints: [
        `Picture ${b} equal groups of ${a} — the rows in the picture.`,
        `Skip-count by ${a}: ${skipCount(a, b)}.`,
        `${a} × ${b} = ${A}.`,
      ],
      answer: A,
      // The dot ARRAY is multiplication's ten-frame (parity with addition's
      // adddots — field report: mult mistakes had no visual guide).
      visual: b <= 10 && a <= 12 ? `[[viz mularray ${b} ${a}]]` : undefined,
    };
  }

  // ── Missing factor: "a × ___ = c" ────────────────────────────────────────
  m = q.match(/^(\d+)\s*×\s*_+\s*=\s*(\d+)/);
  if (m) {
    const a = +m[1], c = +m[2];
    return {
      explanation: `Find the number that makes ${a} × ? = ${c}.`,
      hints: [
        `A missing factor is really a division: ${c} ÷ ${a}.`,
        `How many groups of ${a} fit into ${c}? Count the rows in the picture.`,
        `The missing number is ${A}.`,
      ],
      answer: A,
      visual: a <= 12 && c / a <= 10 && Number.isInteger(c / a) ? `[[viz mularray ${c / a} ${a}]]` : undefined,
    };
  }
  // ── Missing factor (other side): "___ × b = c" ───────────────────────────
  m = q.match(/^_+\s*×\s*(\d+)\s*=\s*(\d+)/);
  if (m) {
    const b = +m[1], c = +m[2];
    return {
      explanation: `Find the number that makes ? × ${b} = ${c}.`,
      hints: [`This is the division ${c} ÷ ${b}.`, `How many ${b}s make ${c}?`, `The missing number is ${A}.`],
      answer: A,
    };
  }

  // ── Missing divisor / dividend: "a ÷ ___ = q", "___ ÷ b = q" ─────────────
  m = q.match(/^(\d+)\s*÷\s*_+\s*=\s*(\d+)/);
  if (m) {
    const a = +m[1], qq = +m[2];
    return { explanation: `Find the number ${a} is divided by to get ${qq}.`, hints: [
      `Division undoes multiplication: ? × ${qq} = ${a}.`,
      `So divide: ${a} ÷ ${qq}.`,
      `The missing number is ${A}.`,
    ], answer: A };
  }
  m = q.match(/^_+\s*÷\s*(\d+)\s*=\s*(\d+)/);
  if (m) {
    const b = +m[1], qq = +m[2];
    return { explanation: `Find the number that gives ${qq} when divided by ${b}.`, hints: [
      `Multiply back: ${qq} × ${b}.`,
      `Check: your number ÷ ${b} should be ${qq}.`,
      `The missing number is ${A}.`,
    ], answer: A };
  }

  // ── Fraction identify: "n out of d" (with or without "shaded") ───────────
  m = q.match(/^(?:Write the fraction:?\s*)?(\d+)\s*(?:shaded\s*)?out of\s*(\d+)$/i);
  if (m) {
    const nn = +m[1], dd = +m[2];
    return {
      explanation: `"${nn} out of ${dd}" — count the picture: ${dd} parts in total, ${nn} of them shaded.`,
      hints: [
        `Step 1 — the WHOLE is ${dd} parts, so ${dd} goes on the BOTTOM.`,
        `Step 2 — you have ${nn} of them, so ${nn} goes on TOP: ${nn}/${dd}.`,
        `Careful: ${nn}/${nn + dd} or ${nn}/${dd * 2} would mean a different total — the bottom must be exactly how many parts make the whole (${dd}). Answer: ${A}.`,
      ],
      answer: A,
      visual: dd <= 16 ? `[[viz bar ${nn} ${dd}]]` : undefined,
    };
  }

  // ── Decimal arithmetic (flat): "0.4 + 0.3", "0.6 × 4", "1.2 ÷ 3" ─────────
  m = q.match(/^(\d+\.\d+|\d+)\s*([+\-−×÷])\s*(\d+\.\d+|\d+)$/);
  if (m && (m[1].includes(".") || m[3].includes("."))) {
    const dpa = (m[1].split(".")[1] ?? "").length, dpb = (m[3].split(".")[1] ?? "").length;
    const op = m[2];
    if (op === "×") {
      const ai = +m[1].replace(".", ""), bi = +m[3].replace(".", "");
      return { explanation: `Multiply, then place the decimal point.`, hints: [
        `Multiply as whole numbers: ${ai} × ${bi} = ${ai * bi}.`,
        `Count the decimal places in BOTH numbers: ${dpa} + ${dpb} = ${dpa + dpb}. Move the point that many places.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    if (op === "÷") {
      return { explanation: `Divide, keeping track of the decimal point.`, hints: [
        `Divide as if whole numbers: ${m[1].replace(".", "")} ÷ ${m[3].replace(".", "")}.`,
        `The answer keeps the decimal places of the number you divided.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    const dp = Math.max(dpa, dpb);
    const s = Math.pow(10, dp);
    const a = Math.round(parseFloat(m[1]) * s), b = Math.round(parseFloat(m[3]) * s);
    const add = op === "+";
    return { explanation: `Line up the decimal points, then ${add ? "add" : "subtract"}.`, hints: [
      `Think in ${dp === 1 ? "tenths" : "hundredths"}: ${a} ${add ? "+" : "−"} ${b}.`,
      `${a} ${add ? "+" : "−"} ${b} = ${add ? a + b : a - b} ${dp === 1 ? "tenths" : "hundredths"}.`,
      `Put the decimal point back: ${A}.`,
    ], answer: A };
  }

  // ── Integer arithmetic with negatives: "(-5) + 8", "2 - 5", "(-9) + 1" ───
  m = q.match(/^\(?(-?\d+)\)?\s*([+\-−])\s*\(?(-?\d+)\)?$/);
  if (m && (m[1].startsWith("-") || m[3].startsWith("-") || (m[2] !== "+" && +m[1] < +m[3]))) {
    const a = +m[1], b = m[2] === "+" ? +m[3] : -+m[3];
    return { explanation: `Use the number line for signed numbers.`, hints: [
      `Start at ${a} on the number line.`,
      `${b >= 0 ? `Move RIGHT ${b}` : `Move LEFT ${-b}`} (adding moves right, subtracting moves left).`,
      `You land on ${A}.`,
    ], answer: A };
  }

  // ── Order of operations: "3 + 4 × 2" ─────────────────────────────────────
  m = q.match(/^(\d+)\s*[+\-]\s*(\d+)\s*×\s*(\d+)$/) ?? q.match(/^(\d+)\s*×\s*(\d+)\s*[+\-]\s*(\d+)$/);
  if (m) {
    return { explanation: `Multiplication comes BEFORE addition or subtraction.`, hints: [
      `Do the multiplication part first.`,
      `Then add or subtract the remaining number.`,
      `Answer: ${A}.`,
    ], answer: A };
  }

  // ── One-step inequalities: "x + 3 < 8" (also with "Solve for x:") ─────────
  m = q.match(/x\s*([+\-])\s*(\d+)\s*([<>≤≥])\s*(-?\d+)/);
  if (m) {
    const k = +m[2], add = m[1] === "+";
    return { explanation: `Solve it like an equation — the inequality sign stays.`, hints: [
      `${add ? "Subtract" : "Add"} ${k} ${add ? "from" : "to"} BOTH sides.`,
      `The ${m[3]} sign does not flip (we didn't multiply by a negative).`,
      `${A}.`,
    ], answer: A };
  }

  // ── Ratio scale-up: "scale 3 : 4 by 2" / "3 : 4  × 2" ────────────────────
  m = q.match(/scale\s+(\d+)\s*:\s*(\d+)\s+by\s+(\d+)/i) || q.match(/^(\d+)\s*:\s*(\d+)\s*×\s*(\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2], k = +m[3];
    return { explanation: `Scale BOTH parts of the ratio by the same factor.`, hints: [
      `Multiply the first part: ${a} × ${k} = ${a * k}.`,
      `Multiply the second part: ${b} × ${k} = ${b * k}.`,
      `Answer: ${A}.`,
    ], answer: A };
  }

  // ── Multiply / divide fractions ──────────────────────────────────────────
  {
    const fm = [...q.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)];
    const opM = q.match(/\}\s*([×÷])\s*\\/);
    if (fm.length === 2 && opM) {
      const n1 = +fm[0][1], d1 = +fm[0][2], n2 = +fm[1][1], d2 = +fm[1][2];
      // Full decision procedure (user rebuild): every step computed, ending
      // with an explicit simplify check — never just "simplify".
      if (opM[1] === "×") {
        const rn = n1 * n2, rd = d1 * d2, g2 = gcd(rn, rd);
        return { explanation: `Multiplying fractions — no common denominator needed. Go straight across.`, hints: [
          `Step 1 — multiply the NUMERATORS (tops): ${n1} × ${n2} = ${rn}.`,
          `Step 2 — multiply the DENOMINATORS (bottoms): ${d1} × ${d2} = ${rd}.`,
          `Step 3 — write the new fraction: ${rn}/${rd}.`,
          g2 > 1
            ? `Step 4 — simplify: ${rn} and ${rd} both divide by ${g2} → ${rn / g2}/${rd / g2}. Answer: ${A}.`
            : `Step 4 — check for simplifying: nothing divides both ${rn} and ${rd}, so it's done. Answer: ${A}.`,
        ], answer: A,
        visual: rn <= rd && rd <= 24 ? `[[viz grid ${rn} ${rd}]]` : undefined };
      }
      {
        const rn = n1 * d2, rd = d1 * n2, g2 = gcd(rn, rd);
        return { explanation: `Dividing by a fraction: Keep–Change–Flip, then multiply.`, hints: [
          `Step 1 — KEEP the first fraction as it is: ${n1}/${d1}.`,
          `Step 2 — CHANGE the ÷ into ×.`,
          `Step 3 — FLIP the second fraction: ${n2}/${d2} becomes ${d2}/${n2}.`,
          `Step 4 — multiply across: tops ${n1} × ${d2} = ${rn}, bottoms ${d1} × ${n2} = ${rd} → ${rn}/${rd}.`,
          g2 > 1
            ? `Step 5 — simplify: both divide by ${g2} → ${rn / g2}/${rd / g2}. Answer: ${A}.`
            : `Step 5 — check for simplifying: ${rn}/${rd} is already in simplest form. Answer: ${A}.`,
        ], answer: A };
      }
    }
  }

  // ── Distribute: "3(x + 4)" or "2x(x − 3)" (with/without verb or period) ──
  m = q.replace(/^Expand\s+/i, "").match(/^(\d+)(x?)\(x\s*([+\-−])\s*(\d+)\)\s*\.?$/);
  if (m) {
    const k = +m[1], hasX = m[2] === "x", b = +m[4], neg = m[3] !== "+";
    const kTerm = hasX ? `${k}x` : `${k}`;
    return { explanation: `Multiply ${kTerm} by EACH term inside the bracket.`, hints: [
      `${kTerm} · x = ${k}${hasX ? "x²" : "x"}.`,
      `${kTerm} · ${neg ? "−" : ""}${b} = ${neg ? "−" : ""}${k * b}${hasX ? "x" : ""}.`,
      `Put them together: ${A}.`,
    ], answer: A };
  }

  // ── Pattern step: "What is the step for: 3, 7, 11, 15?" ─────────────────
  m = q.match(/What is the step for:?\s*(-?\d+)\s*,\s*(-?\d+)/i);
  if (m) {
    const step = +m[2] - +m[1];
    return { explanation: `The step is how much each number grows by.`, hints: [
      `Subtract neighbours: ${m[2]} − ${m[1]} = ${step}.`,
      `Check it holds for the next pair too.`,
      `The step is ${A}.`,
    ], answer: A };
  }

  // ── Continue the pattern: "Find the next number: 2, 5, 8, 11, ___" ───────
  m = q.match(/Find the next number:?\s*(-?\d+)\s*,\s*(-?\d+)[^_]*_+/i);
  if (m) {
    const step = +m[2] - +m[1];
    return { explanation: `Find how much the numbers change each time.`, hints: [
      `From ${m[1]} to ${m[2]} the pattern ${step >= 0 ? "adds" : "subtracts"} ${Math.abs(step)}.`,
      `${step >= 0 ? "Add" : "Subtract"} ${Math.abs(step)} to the last number in the list.`,
      `Answer: ${A}.`,
    ], answer: A };
  }

  // ── Add/subtract fractions with UNLIKE denominators ──────────────────────
  {
    const fm = [...q.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)];
    const opM = q.match(/\}\s*([+\-−])\s*\\/);
    if (fm.length === 2 && opM && fm[0][2] !== fm[1][2]) {
      const n1 = +fm[0][1], d1 = +fm[0][2], n2 = +fm[1][1], d2 = +fm[1][2];
      const l = (d1 * d2) / gcd(d1, d2);
      const add = opM[1] === "+";
      const c1 = n1 * (l / d1), c2 = n2 * (l / d2);
      const rn = add ? c1 + c2 : c1 - c2;
      const g2 = rn > 0 ? gcd(rn, l) : 1;
      return { explanation: `Step 1 — check the denominators: ${d1} and ${d2} are DIFFERENT, so don't ${add ? "add" : "subtract"} the tops yet.`, hints: [
        `Step 2 — find a common denominator: the smallest number both ${d1} and ${d2} fit into is ${l}.`,
        `Step 3 — convert BOTH fractions to ${l}ths: ${n1}/${d1} = ${c1}/${l} and ${n2}/${d2} = ${c2}/${l}.`,
        `Step 4 — now the pieces are the same size: ${add ? "add" : "subtract"} the tops: ${c1} ${add ? "+" : "−"} ${c2} = ${rn}. Keep the bottom: ${rn}/${l}.`,
        g2 > 1
          ? `Step 5 — simplify: ${rn} and ${l} both divide by ${g2} → ${rn / g2}/${l / g2}. Answer: ${A}.`
          : `Step 5 — check for simplifying: ${rn}/${l} is already in simplest form. Answer: ${A}.`,
      ], answer: A,
      visual: rn >= 0 && rn <= l && l <= 16 ? `[[viz bar ${rn} ${l}]]` : undefined };
    }
  }

  // ── Order integers: "Order (these) from least to greatest: 2, -3, 1" ─────
  m = q.match(/Order\s+(?:these\s+)?from least to greatest:?\s*(.+)$/i);
  if (m) {
    return { explanation: `Put the numbers in order, smallest first.`, hints: [
      `Negative numbers are always smaller than positive ones.`,
      `Picture the number line: the further LEFT, the smaller.`,
      `In order: ${A}.`,
    ], answer: A };
  }

  // ── Ratios: simplify / proportion / equivalent / scale ───────────────────
  m = q.match(/Simplify the ratio\s*(\d+)\s*:\s*(\d+)/i) || (/simplest form/i.test(opts.directive ?? "") ? q.match(/^(\d+)\s*:\s*(\d+)$/) : null);
  if (m) {
    const a = +m[1], b = +m[2], g = gcd(a, b);
    return { explanation: `Divide both parts by their greatest common factor.`, hints: [
      `The biggest number dividing both ${a} and ${b} is ${g}.`,
      `${a} ÷ ${g} = ${a / g} and ${b} ÷ ${g} = ${b / g}.`,
      `Simplest form: ${A}.`,
    ], answer: A };
  }
  // Form 1: a : b = c : ___  (scale = c/a, missing = b × scale)
  m = q.match(/(\d+)\s*:\s*(\d+)\s*=\s*(\d+)\s*:\s*_+/);
  if (m) {
    const a = +m[1], b = +m[2], c = +m[3], scale = c / a;
    return { explanation: `Both sides of a proportion scale by the SAME factor.`, hints: [
      Number.isInteger(scale) ? `Scale factor between matching parts: ${c} ÷ ${a} = ${scale}.` : `Find the scale factor between the two matching known parts.`,
      Number.isInteger(scale) ? `Multiply the other part by it: ${b} × ${scale}.` : `Multiply the remaining part by that factor.`,
      `The missing number is ${A}.`,
    ], answer: A };
  }
  // Form 2: a : b = ___ : c  (scale = c/b, missing = a × scale)
  m = q.match(/(\d+)\s*:\s*(\d+)\s*=\s*_+\s*:\s*(\d+)/);
  if (m) {
    const a = +m[1], b = +m[2], c = +m[3], scale = c / b;
    return { explanation: `Both sides of a proportion scale by the SAME factor.`, hints: [
      Number.isInteger(scale) ? `Scale factor between matching parts: ${c} ÷ ${b} = ${scale}.` : `Find the scale factor between the two matching known parts.`,
      Number.isInteger(scale) ? `Multiply the other part by it: ${a} × ${scale}.` : `Multiply the remaining part by that factor.`,
      `The missing number is ${A}.`,
    ], answer: A };
  }

  // ── Addition / subtraction: "a + b", "a - b" ─────────────────────────────
  m = q.match(/^(\d+)\s*([+\-])\s*(\d+)\s*=?\s*$/);
  if (m) {
    const a = +m[1], op = m[2], b = +m[3];
    const multi = a >= 10 || b >= 10; // 2+ digits → teach the column method
    if (op === "+") {
      return multi
        ? {
            explanation: `Stack the numbers and add one column at a time, right to left.`,
            hints: [
              `Line up ones under ones, tens under tens.`,
              `Add the ones column. If it's 10 or more, write the ones digit and carry 1.`,
              `Add the tens column (plus any carried 1), then the hundreds.`,
              `${a} + ${b} = ${A}.`,
            ],
            answer: A,
          }
        : (() => {
            // Strategy-aware single-digit hints (matches the curriculum stages),
            // led by a ten-frame the child can count instead of using fingers.
            const steps = additionStrategySteps(a, b, dir);
            return { explanation: `Add ${a} and ${b} — count the dots if you need to.`, hints: [...steps, `${a} + ${b} = ${A}.`], answer: A, visual: `[[viz adddots ${a} ${b}]]` };
          })();
    }
    return multi
      ? {
          explanation: `Stack the numbers and subtract one column at a time, right to left.`,
          hints: [
            `Line up ones under ones, tens under tens.`,
            `Subtract the ones column. If the top digit is smaller, borrow 1 from the next column.`,
            `Subtract the tens (and hundreds), remembering any borrow.`,
            `${a} − ${b} = ${A}.`,
          ],
          answer: A,
        }
      : {
          explanation: `Take ${b} away from ${a}.`,
          hints: [`Start at ${a} and count back ${b}.`, `Ask: ${b} plus what equals ${a}?`, `${a} − ${b} = ${A}.`],
          answer: A,
        };
  }

  // ── Missing addend / minuend: "a + ___ = c", "___ + b = c" (and −) ───────
  m = q.match(/^(\d+|_+)\s*([+\-])\s*(\d+|_+)\s*=\s*(\d+)$/);
  if (m && (m[1].includes("_") || m[3].includes("_"))) {
    const op = m[2], c = +m[4];
    const blankFirst = m[1].includes("_");
    const known = blankFirst ? +m[3] : +m[1];
    // + : missing = c − known.   − with blank first (___ − b = c): missing = c + b;
    // − with blank second (a − ___ = c): missing = a − c.
    const val = op === "+" ? c - known : (blankFirst ? c + known : known - c);
    const ans = A || String(val);
    if (op === "+") {
      // Missing ADDEND. Teach it as counting UP from the known number to the
      // total — with a ten-frame the child can literally count — NEVER as the
      // subtraction "c − known" (that's a harder skill a struggling adder
      // hasn't learned yet, and it was the bad hint in the field report).
      const miss = +ans;
      let steps: string[];
      if (c >= 2 * known && c - 2 * known <= 2 && known > 0) {
        // near-double: "you know known+known; the total is a little more"
        const extra = c - 2 * known;
        steps = [`You already know ${known} + ${known} = ${2 * known}.`, `${c} is ${extra} more than ${2 * known}, so add ${extra} more: the missing number is ${miss}.`];
      } else if (c > 10 && known >= 6 && known < 10) {
        const toTen = 10 - known;
        steps = [`First make ten: ${known} needs ${toTen} more to reach 10.`, `Then ${c - 10} more gets to ${c}. ${toTen} + ${c - 10} = ${miss}.`];
      } else {
        steps = [`Start at ${known} and count up to ${c}, using the dots.`, `Count how many empty circles you fill in — that's the missing number, ${miss}.`];
      }
      return { explanation: `${known} plus how many more makes ${c}? Count up to find out.`, hints: [...steps, `Answer: ${miss}.`], answer: ans, visual: `[[viz missdots ${known} ${c}]]` };
    }
    // Real steps, one idea each (a single dense line taught nothing on PDFs).
    const hints = blankFirst
      ? [
          `Some number lost ${known} and ended at ${c} — UNDO the subtraction by adding.`,
          `${c} + ${known} = ${ans}.`,
          `Check it: ${ans} − ${known} = ${c} ✓`,
        ]
      : [
          `Start with ${known}; after taking the mystery number away, ${c} is left.`,
          `The amount taken away is the difference: ${known} − ${c} = ${ans}.`,
          `Check it: ${known} − ${ans} = ${c} ✓`,
        ];
    return { explanation: `Find the missing number.`, hints, answer: ans };
  }

  // ── Division: "a ÷ b" ────────────────────────────────────────────────────
  m = q.match(/^(\d+)\s*÷\s*(\d+)\s*=?\s*$/);
  if (m) {
    const a = +m[1], b = +m[2];
    return {
      explanation: `Split ${a} into equal groups of ${b}.`,
      hints: [
        `Ask: ${b} times what gets close to ${a}?`,
        `Count up by ${b}: ${skipCount(b, Math.ceil(a / b))}.`,
        `${a} ÷ ${b} = ${A}.`,
      ],
      visual: b > 0 && b <= 12 && Number.isInteger(a / b) && a / b <= 10 ? `[[viz mularray ${a / b} ${b}]]` : undefined,
      answer: A,
    };
  }

  // ── Combine like terms: "ax + bx", "ax² + bx²" ───────────────────────────
  m = q.match(/^(\d*)x(²?)\s*\+\s*(\d*)x(²?)\s*=?\s*$/);
  if (m && m[2] === m[4]) {
    const a = m[1] === "" ? 1 : +m[1];
    const b = m[3] === "" ? 1 : +m[3];
    const v = "x" + m[2];
    return {
      explanation: `Both terms are "like terms" — they share ${v}. Add the numbers in front and keep ${v}.`,
      hints: [
        `The coefficients (numbers in front) are ${a} and ${b}.`,
        `${a} + ${b} = ${a + b} — the ${v} stays the same.`,
        `Answer: ${A}.`,
      ],
      answer: A,
    };
  }

  // ── One-step equation: "x + b = c" / "x - b = c" ─────────────────────────
  m = q.match(/^x\s*([+\-])\s*(\d+)\s*=\s*(\d+)/);
  if (m) {
    const op = m[1], b = +m[2], c = +m[3];
    const inverse = op === "+" ? `subtract ${b} from` : `add ${b} to`;
    return {
      explanation: `Solve for x by undoing the "${op} ${b}".`,
      hints: [
        `Do the opposite: ${inverse} both sides.`,
        op === "+" ? `${c} − ${b}` : `${c} + ${b}`,
        `x = ${A}.`,
      ],
      answer: A,
    };
  }

  // ── Two-step equation: "ax + b = c" / "ax - b = c" ───────────────────────
  m = q.match(/^(\d+)x\s*([+\-])\s*(\d+)\s*=\s*(\d+)/);
  if (m) {
    const a = +m[1], op = m[2], b = +m[3], c = +m[4];
    const afterB = op === "+" ? c - b : c + b;
    return {
      explanation: `Two steps: first undo the "${op} ${b}", then undo the "× ${a}".`,
      hints: [
        op === "+" ? `Subtract ${b}: ${c} − ${b} = ${afterB}.` : `Add ${b}: ${c} + ${b} = ${afterB}.`,
        `Now divide by ${a}: ${afterB} ÷ ${a}.`,
        `x = ${A}.`,
      ],
      answer: A,
    };
  }

  // ── Simplify a fraction: "Simplify \frac{a}{b}" / "Reduce …" ─────────────
  m = q.match(/(?:Simplify|Reduce)\s.*?(\d+).*?\}\{(\d+)\}/i) || q.match(/(?:Simplify|Reduce).*?(\d+)\/(\d+)/i);
  if (m) {
    const a = +m[1], b = +m[2];
    const g = gcd(a, b);
    return {
      explanation: `Divide the top and bottom by the same number until they share no common factor.`,
      hints: [
        `What number divides both ${a} and ${b}? The largest is ${g}.`,
        `${a} ÷ ${g} = ${a / g} and ${b} ÷ ${g} = ${b / g}.`,
        `Answer: ${A}.`,
      ],
      answer: A,
      // See the same amount shaded — fewer, bigger pieces (fraction parity with
      // addition's ten-frame: every mistake gets a picture).
      visual: a <= b && b <= 24 ? `[[viz grid ${a} ${b}]]` : undefined,
    };
  }

  // ── Add/subtract fractions with the SAME denominator ─────────────────────
  m = q.match(/\{(\d+)\}\{(\d+)\}\s*([+\-])\s*\\?frac\{(\d+)\}\{(\d+)\}/) || q.match(/\}\{(\d+)\}\s*([+\-])\s*.*?\}\{(\d+)\}/);
  if (m) {
    const full = m.length >= 6; // numerators captured too
    const d = full ? m[2] : m[1], d2 = full ? m[5] : m[3], op = full ? m[3] : m[2];
    if (d === d2) {
      const rNum = full ? (op === "+" ? +m[1] + +m[4] : +m[1] - +m[4]) : null;
      const gS = full && rNum !== null && rNum > 0 ? gcd(rNum, +d) : 1;
      return {
        explanation: `Step 1 — check the denominators: both are ${d}, so the pieces are the SAME size. Keep the bottom.`,
        hints: [
          `Step 2 — because the denominators match, only the TOPS get ${op === "+" ? "added" : "subtracted"}.`,
          `Step 3 — ${op === "+" ? "add" : "subtract"} the numerators${full ? `: ${m[1]} ${op} ${m[4]} = ${rNum}` : ""}. Keep the denominator: ${full ? `${rNum}/${d}` : `?/${d}`}.`,
          gS > 1
            ? `Step 4 — simplify: ${rNum} and ${d} both divide by ${gS} → ${rNum! / gS}/${+d / gS}. Answer: ${A}.`
            : `Step 4 — check for simplifying${full ? `: ${rNum}/${d} is already in simplest form` : ""}. Answer: ${A}.`,
        ],
        answer: A,
        // Show the RESULT shaded on one bar — count the shaded pieces.
        visual: full && rNum !== null && rNum >= 0 && rNum <= +d && +d <= 16 ? `[[viz bar ${rNum} ${d}]]` : undefined,
      };
    }
  }

  // ── Fraction OF a number: "1/4 of 12" → split into rows, take some ────────
  m = q.match(/\{(\d+)\}\{(\d+)\}\s*of\s*(\d+)/i) || q.match(/(\d+)\/(\d+)\s+of\s+(\d+)/i);
  if (m) {
    const fa = +m[1], fb = +m[2], n2 = +m[3];
    if (fb > 0 && Number.isInteger(n2 / fb)) {
      const per = n2 / fb;
      return {
        explanation: `“Of” means split ${n2} into ${fb} equal groups, then take ${fa} of them.`,
        hints: [
          `${n2} ÷ ${fb} = ${per} in each group — the rows in the picture.`,
          `Take ${fa} group${fa > 1 ? "s" : ""}: ${fa} × ${per} = ${fa * per}.`,
          `Answer: ${A}.`,
        ],
        answer: A,
        visual: fb <= 10 && per <= 12 ? `[[viz mularray ${fb} ${per}]]` : undefined,
      };
    }
  }

  // ── "What fraction is shaded?" (visual) ──────────────────────────────────
  if (/fraction is shaded|parts are shaded/i.test(q)) {
    return {
      explanation: `The fraction is shaded parts over total parts.`,
      hints: [
        `Count the TOTAL number of equal parts — that's the bottom number.`,
        `Count how many are shaded — that's the top number.`,
        `Answer: ${A}.`,
      ],
      answer: A,
    };
  }

  // ── Percent of a number: "x% of n" ───────────────────────────────────────
  m = q.match(/(\d+)%\s*of\s*(\d+)/i);
  if (m) {
    const p = +m[1], n = +m[2];
    return {
      explanation: `"${p}% of ${n}" means ${p} hundredths of ${n}.`,
      hints: [
        `Turn the percent into a fraction or decimal: ${p}% = ${p}/100.`,
        `Multiply: ${n} × ${p}/100.`,
        `Answer: ${A}.`,
      ],
      answer: A,
      // The percent as a shaded bar (simplified so the pieces stay countable):
      // 25% shows 1 of 4 shaded — "take that much of the number".
      visual: (() => { const g2 = gcd(p, 100); return p <= 100 && 100 / g2 <= 20 ? `[[viz bar ${p / g2} ${100 / g2}]]` : undefined; })(),
    };
  }

  // ── Solve x² = k ─────────────────────────────────────────────────────────
  m = q.match(/x²\s*=\s*(\d+)/);
  if (m) {
    const k = +m[1];
    return {
      explanation: `Undo the square by taking the square root of both sides.`,
      hints: [
        `What number times itself gives ${k}?`,
        `Remember a square root has TWO answers — one positive, one negative.`,
        `x = ${A}.`,
      ],
      answer: A,
    };
  }

  // ── Multiple choice (Reading / Writing / Science) ────────────────────────
  if (opts.subjectSlug && opts.subjectSlug !== "MATH") {
    const hints: string[] = [];
    hints.push(`Re-read the question and rule out the choices that clearly don't fit.`);
    if (opts.explanation) hints.push(opts.explanation);
    hints.push(`The correct choice is "${A}".`);
    return {
      explanation: student ? `You chose "${student}". Let's check it.` : `Let's find the best choice.`,
      hints,
      answer: A,
    };
  }

  // ── Early math (M1/M2): comparing, counting, sequences, place value ──────
  {
    let pm = q.match(/Which is (greater|less):\s*(\d+)\s*or\s*(\d+)/i);
    if (pm) {
      const g = pm[1].toLowerCase() === "greater";
      return { explanation: `Compare the two numbers.`, hints: [
        `When you count, numbers further along are bigger. Which of ${pm[2]} and ${pm[3]} do you reach ${g ? "later" : "first"}?`,
        `The ${g ? "greater (bigger)" : "less (smaller)"} number is the answer.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    pm = q.match(/What number comes (after|before)\s*(\d+)/i);
    if (pm) {
      const after = pm[1].toLowerCase() === "after";
      return { explanation: `Find the number ${after ? "after" : "before"} ${pm[2]}.`, hints: [
        after ? `The number AFTER is one more — count up one from ${pm[2]}.` : `The number BEFORE is one less — count back one from ${pm[2]}.`,
        `Say ${pm[2]}, then ${after ? "the next number" : "the number just before"}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Number pattern with a blank: "5, ___, 7" (middle) or "5, 6, 7, ___" (continue)
    if (/_/.test(q) && /^\s*-?\d+\s*,/.test(q)) {
      const toks = q.replace(/\.$/, "").split(",").map((t) => t.trim());
      const blankIdx = toks.findIndex((t) => /_/.test(t));
      const nums = toks.map((t) => { const n = t.match(/-?\d+/); return n ? +n[0] : null; });
      if (blankIdx >= 0) {
        if (blankIdx === toks.length - 1 && nums[0] != null && nums[1] != null) {
          const step = nums[1] - nums[0];
          return { explanation: `Continue the number pattern.`, hints: [
            `See how much the numbers jump each time — they go up by ${step}.`,
            `Add ${step} to the last number in the list.`,
            `Answer: ${A}.`,
          ], answer: A };
        }
        const lo = nums[blankIdx - 1], hi = nums[blankIdx + 1];
        if (lo != null && hi != null) return { explanation: `Find the missing number.`, hints: [
          `The missing number sits between ${lo} and ${hi}.`,
          `Count up from ${lo} toward ${hi} — the number in the middle is the answer.`,
          `Answer: ${A}.`,
        ], answer: A };
      }
    }
    pm = q.match(/How many (tens|ones) in\s*(\d+)/i);
    if (pm) return { explanation: `Look at the place value of ${pm[2]}.`, hints: [
      pm[1].toLowerCase() === "tens" ? `The TENS digit is the left digit of a two-digit number.` : `The ONES digit is the right-most digit.`,
      `In ${pm[2]}, read off that digit.`,
      `Answer: ${A}.`,
    ], answer: A };
  }

  // ── Plotting / graphing on the coordinate plane ──────────────────────────
  // These interactive items were falling through to the bland "the correct
  // answer is …" fallback, giving the child no help on HOW to plot.
  {
    const qn = q.replace(/−/g, "-");
    const num = (s: string) => (s === "" || s === "+" ? 1 : s === "-" ? -1 : parseInt(s, 10));
    // Plot the line y = mx + b
    let pm = qn.match(/Plot the line\s+y\s*=\s*(-?\d*)x\s*(?:([+-])\s*(\d+))?/i);
    if (pm) {
      const mm = num(pm[1]); const b = pm[2] ? (pm[2] === "-" ? -1 : 1) * +pm[3] : 0;
      return { explanation: `Graph the line by plotting two points on it.`, hints: [
        `Start at the y-intercept — the point (0, ${b}) on the y-axis.`,
        `Use the slope ${mm}: from (0, ${b}) go ${mm >= 0 ? "up" : "down"} ${Math.abs(mm)}, then right 1, and mark that point.`,
        `Draw a straight line through the two points.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // "What is the equation of the line shown?" — answer is "m,b"
    if (/equation of the line/i.test(qn)) {
      const am = A.match(/^(-?\d+),\s*(-?\d+)$/);
      if (am) return { explanation: `Read the slope and y-intercept off the graph.`, hints: [
        `Find where the line crosses the y-axis — that's the intercept, b = ${am[2]}.`,
        `Count the slope: for every 1 step to the right, how many up or down? That's m = ${am[1]}.`,
        `Set the slope to ${am[1]} and the intercept to ${am[2]}. Answer: ${A}.`,
      ], answer: A };
    }
    // Single point — plot / y-intercept / transform image / parabola vertex ("x,y")
    const am = A.match(/^(-?\d+),\s*(-?\d+)$/);
    if (am && /Plot the point|y-intercept|Reflect|Translate|Rotate|vertex|image|Drag the/i.test(qn)) {
      const x = +am[1], y = +am[2];
      let first = `Find the origin (0, 0) — the center of the grid.`;
      if (/across the x-axis/i.test(qn)) first = `Reflecting across the x-axis keeps x the same and flips the sign of y.`;
      else if (/across the y-axis/i.test(qn)) first = `Reflecting across the y-axis keeps y the same and flips the sign of x.`;
      else if (/Translate/i.test(qn)) first = `Translating slides the point — add the shift to each coordinate.`;
      else if (/Rotate/i.test(qn)) first = `A 90° counter-clockwise turn sends the point (x, y) to (−y, x).`;
      else if (/vertex/i.test(qn)) first = `The vertex is the turning point of the parabola — move it to the target point.`;
      return { explanation: `Plot the point on the coordinate plane.`, hints: [
        first,
        `From the origin, go ${x >= 0 ? "right" : "left"} ${Math.abs(x)}, then ${y >= 0 ? "up" : "down"} ${Math.abs(y)}.`,
        `Mark the point (${x}, ${y}). Answer: ${A}.`,
      ], answer: A };
    }
    // Triangle — answer is "x,y;x,y;x,y"
    if (/triangle/i.test(qn) && A.includes(";")) {
      return { explanation: `Plot each vertex, then connect them.`, hints: [
        `Plot each vertex one at a time: ${A.split(";").map((s) => `(${s.trim()})`).join(", ")}.`,
        `From the origin, count right/left (x) then up/down (y) for each.`,
        `Connect the three points to form the triangle.`,
      ], answer: A };
    }
    // Unit circle angle — "…so the angle θ = 30°"
    pm = qn.match(/circle[^]*?(?:θ\s*=\s*|angle\s+)(-?\d+)\s*°/i);
    if (pm) return { explanation: `Mark the point on the unit circle.`, hints: [
      `Start at the positive x-axis (0°).`,
      `Turn ${pm[1]}° counter-clockwise around the circle.`,
      `Mark the point where the radius meets the circle. Answer: ${A}.`,
    ], answer: A };
  }

  // ── Polynomials & derivatives (also fell through to the bland fallback) ───
  {
    // Add / subtract polynomials: "(ax + b) ± (cx + d)"
    let pm = q.match(/\([^)]*x[^)]*\)\s*([+-])\s*\([^)]*x[^)]*\)/);
    if (pm) {
      const sub = pm[1] === "-";
      return { explanation: `${sub ? "Subtract" : "Add"} the polynomials by combining like terms.`, hints: [
        sub ? `Distribute the minus sign to every term in the second bracket — it flips each sign.` : `Drop the brackets; all the signs stay the same.`,
        `Combine like terms: add the x-terms together, and the plain numbers together.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Combine like terms: "Mx² ± Nx²" (or Mx ± Nx)
    pm = q.match(/^(?:Simplify\s+)?-?\d*x(²?)\s*[+-]\s*-?\d*x\1\.?$/);
    if (pm) return { explanation: `Combine the like terms.`, hints: [
      `Both terms have the same variable and power, so they are like terms.`,
      `Add or subtract the numbers in front; keep the x${pm[1]} unchanged.`,
      `Answer: ${A}.`,
    ], answer: A };
    // Factor out the GCF: "Factor Gx + H"
    pm = q.match(/Factor\s+(\d+)x\s*\+\s*(\d+)/i);
    if (pm) { const g = gcd(+pm[1], +pm[2]); return { explanation: `Factor out the greatest common factor.`, hints: [
      `Find the largest number that divides both ${pm[1]} and ${pm[2]}: it is ${g}.`,
      `Divide each term by ${g}, then write it as ${g}( … ).`,
      `Answer: ${A}.`,
    ], answer: A }; }
    // Classify by number of terms: "Classify by the number of terms: x² + 3x + 2"
    pm = q.match(/Classify by the number of terms:\s*(.+)$/i);
    if (pm) {
      const parts = pm[1].replace(/−/g, "-").replace(/\s*-\s*/g, " + ").split("+").map((t) => t.trim()).filter(Boolean);
      const n = parts.length;
      return { explanation: `Count the terms — the chunks separated by + or − signs.`, hints: [
        `The terms here are: ${parts.join(",  ")} — that's ${n} term${n === 1 ? "" : "s"}.`,
        `1 term → monomial, 2 → binomial, 3 → trinomial.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Is this a polynomial?
    if (/^Is this a polynomial\?/i.test(q)) {
      return { explanation: `Check the rule: whole-number powers of x only.`, hints: [
        `A polynomial can NOT have x in a denominator (1/x), under a root (√x), or with a negative exponent (x⁻²).`,
        A.toLowerCase() === "yes"
          ? `Every term here has x to a whole-number power — the rule holds.`
          : `This expression breaks that rule — spot the offending term.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Divide by a monomial: "(6x² + 4x) ÷ 2x" — factor & cancel
    pm = q.match(/\((\d*)x²\s*([+\-])\s*(\d+)x\)\s*÷\s*(\d+)x/);
    if (pm) {
      const A2 = pm[1] === "" ? 1 : +pm[1], sgn = pm[2], B = +pm[3], D = +pm[4];
      return { explanation: `Factor the divisor out of the top, then cancel.`, hints: [
        `Factor ${D}x out of the top: ${A2}x² ${sgn} ${B}x = ${D}x(${A2 / D === 1 ? "" : A2 / D}x ${sgn} ${B / D}).`,
        `The ${D}x on top and bottom cancel out.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Divide by a binomial: "(x² + 5x + 6) ÷ (x + 2)" — factor the top & cancel
    pm = q.match(/\(x²\s*\+\s*(\d+)x\s*\+\s*(\d+)\)\s*÷\s*\(x\s*\+\s*(\d+)\)/);
    if (pm) {
      const S = +pm[1], a3 = +pm[3], b3 = S - a3;
      return { explanation: `Factor the top, then cancel the common bracket.`, hints: [
        `Factor: two numbers that multiply to ${pm[2]} and add to ${S} are ${a3} and ${b3} → (x + ${a3})(x + ${b3}).`,
        `Cancel the common (x + ${a3}) top and bottom.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Evaluate a polynomial at a value: "Evaluate <poly> at x = k"
    pm = q.match(/Evaluate\s+.+?\s+at\s+x\s*=\s*(-?\d+)/i);
    if (pm) return { explanation: `Substitute the value, then simplify.`, hints: [
      `Replace every x with ${pm[1]} (put it in brackets so the signs and powers stay right).`,
      `Work out the powers first, then the products, then add.`,
      `Answer: ${A}.`,
    ], answer: A };
    // ── Advanced-unit forms that previously fell through to generic hints
    //    (audit: 30/45 units had <2 teaching steps on some form) ──
    const qa = q.replace(/[−–]/g, "-");
    let am = qa.match(/Is (\d+) a perfect square\?/i);
    if (am) {
      const n = +am[1], r = Math.sqrt(n), ok = Number.isInteger(r);
      return { explanation: `A perfect square is a whole number times itself.`, hints: [
        `Run through the squares you know: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100…`,
        ok ? `${r} × ${r} = ${n}, so ${n} IS on that list.` : `${n} is between ${Math.floor(r)}² = ${Math.floor(r) ** 2} and ${Math.ceil(r)}² = ${Math.ceil(r) ** 2} — it's NOT on the list.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/What is the square root of (\d+)\?/i);
    if (am) {
      const n = +am[1], r = Math.round(Math.sqrt(n));
      return { explanation: `The square root asks: what number times ITSELF gives ${n}?`, hints: [
        `Try the squares: ${Math.max(1, r - 1)} × ${Math.max(1, r - 1)} = ${Math.max(1, r - 1) ** 2}, ${r} × ${r} = ${r * r}.`,
        `${r} × ${r} = ${n} — found it.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    if (/Which of these is a perfect square\?/i.test(qa)) return { explanation: `Hunt for the number that is a whole number times itself.`, hints: [
      `The perfect squares are 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144…`,
      `Test each option against that list — only one belongs to it.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/Simplify the square root of (\d+)/i);
    if (am) {
      const n = +am[1];
      let s = 1; for (let k = 2; k * k <= n; k++) if (n % (k * k) === 0) s = k;
      const rest = n / (s * s);
      return { explanation: `Pull the biggest perfect square OUT of the root.`, hints: [
        `Find the largest perfect square that divides ${n}: it's ${s * s}, because ${n} = ${s * s} × ${rest}.`,
        `√${n} = √${s * s} × √${rest} = ${s}√${rest}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/Which is larger: the square root of (\d+) or the square root of (\d+)\?/i);
    if (am) return { explanation: `Bigger number → bigger square root.`, hints: [
      `Square roots keep the ORDER of the numbers: if a > b then √a > √b.`,
      `${am[1]} vs ${am[2]} — the larger of the two wins.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/Estimate the square root of (\d+)/i);
    if (am) {
      const n = +am[1], lo = Math.floor(Math.sqrt(n)), hi = lo + 1;
      return { explanation: `Trap ${n} between two perfect squares.`, hints: [
        `${lo}² = ${lo * lo} and ${hi}² = ${hi * hi}, so √${n} is between ${lo} and ${hi}.`,
        `${n} is closer to ${Math.abs(n - lo * lo) <= Math.abs(hi * hi - n) ? `${lo * lo}, so round to ${lo}` : `${hi * hi}, so round to ${hi}`}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/discriminant of x² \+ (\d*)x \+ (\d+)/i) ?? qa.match(/How many real solutions does x² \+ (\d*)x \+ (\d+) = 0 have/i);
    if (am) {
      const b = am[1] ? +am[1] : 1, c = +am[2], D = b * b - 4 * c;
      const count = /How many/i.test(qa);
      return { explanation: `The discriminant D = b² − 4ac decides how many solutions exist.`, hints: [
        `Here a = 1, b = ${b}, c = ${c}: D = ${b}² − 4(1)(${c}) = ${b * b} − ${4 * c} = ${D}.`,
        count ? `D ${D > 0 ? "> 0 → TWO real solutions" : D === 0 ? "= 0 → exactly ONE real solution" : "< 0 → NO real solutions"}.` : `Positive D means two solutions, zero means one, negative means none.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    if (/linear function f\(x\) = mx \+ b is shown\. Build its equation/i.test(qa)) return { explanation: `Read m and b straight off the graph.`, hints: [
      `b is where the line crosses the y-axis — read that point first.`,
      `m is the slope: from any grid point, count RISE over RUN to the next grid point on the line.`,
      `Build y = mx + b from those two numbers.`,
    ], answer: A };
    am = qa.match(/Drag the point .*angle (π(?:\/\d+)?|\d+°)/i);
    if (am) return { explanation: `Turn the radian measure into a picture.`, hints: [
      `π radians = 180° (half a turn), so π/2 = 90°, π/4 = 45°, π/3 = 60°, π/6 = 30°.`,
      `Convert ${am[1]} to degrees, then drag the point to that angle (counter-clockwise from the positive x-axis).`,
    ], answer: A };
    // Loose match on purpose: the stem is generated with typographic minus and
    // occasionally reordered factors — anchor on the phrase, parse each factor.
    if (/crosses the x-axis/i.test(qa)) {
      const f1 = qa.match(/\(x - (\d+)\)/), f2 = qa.match(/\(x \+ (\d+)\)/);
      if (f1 && f2) return { explanation: `Each factor gives one crossing.`, hints: [
        `The graph crosses the x-axis where f(x) = 0 — and a product is 0 when a factor is 0.`,
        `x − ${f1[1]} = 0 gives x = ${f1[1]}; the OTHER factor x + ${f2[1]} = 0 gives x = −${f2[1]}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/Magnitude of vector \((-?\d+),\s*(-?\d+)\)/i);
    if (am) {
      const x = +am[1], y = +am[2];
      return { explanation: `Magnitude = the vector's length (Pythagorean theorem).`, hints: [
        `|v| = √(x² + y²) = √(${x}² + ${y}²) = √(${x * x} + ${y * y}) = √${x * x + y * y}.`,
        `√${x * x + y * y} = ${Math.sqrt(x * x + y * y)}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    if (/Which (function has derivative|is an antiderivative of)/i.test(qa)) return { explanation: `Work the power rule BACKWARDS.`, hints: [
      `Differentiating brings the exponent down and reduces it by 1 — so going backwards, RAISE the exponent by 1 and DIVIDE the coefficient by the new exponent.`,
      `Check your candidate by differentiating it: you should get exactly the expression in the question.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/f\(x\) = x² \+ (?:(\d+)x|x) \+ \d+\. Find f'\((\d+)\)/i);
    if (am) {
      const b = am[1] ? +am[1] : 1, k = +am[2];
      return { explanation: `Differentiate first, then plug in.`, hints: [
        `Differentiate term by term: d/dx x² = 2x, d/dx ${b === 1 ? "x" : `${b}x`} = ${b}, and the constant becomes 0 — so f'(x) = 2x + ${b}.`,
        `Now evaluate: f'(${k}) = 2(${k}) + ${b} = ${2 * k} + ${b}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/h\(t\) = (\d+)t².*h′\(t\) = (\d+)t.*t = (\d+)/i) ?? qa.match(/s\(t\) = t².*s′\(t\) = 2t.*t = (\d+)/i);
    if (am) {
      const rate = am.length > 3 ? +am[2] : 2, t = am.length > 3 ? +am[3] : +am[1];
      return { explanation: `The derivative IS the speed — just plug in the time.`, hints: [
        `The speed function is the derivative: it tells the rate of change at any moment.`,
        `Substitute t = ${t}: speed = ${rate} × ${t} = ${rate * t}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/Slope of y = x² at x = (\d+)/i);
    if (am) {
      const a2 = +am[1];
      return { explanation: `The slope of a curve is its derivative at that point.`, hints: [
        `Differentiate: dy/dx of x² is 2x — the slope changes at every point.`,
        `At x = ${a2}, slope = 2 × ${a2} = ${2 * a2}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/At which x does y = x² have slope (\d+)\?/i);
    if (am) {
      const m3 = +am[1];
      return { explanation: `Set the derivative EQUAL to the slope you want.`, hints: [
        `The slope of y = x² at any x is 2x.`,
        `Solve 2x = ${m3} → x = ${m3} ÷ 2 = ${m3 / 2}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/slope of the tangent line to y = x² \+ (\d+)x at x = (\d+)/i);
    if (am) {
      const b = +am[1], k = +am[2];
      return { explanation: `Tangent slope = derivative at the point.`, hints: [
        `Differentiate: dy/dx = 2x + ${b}.`,
        `At x = ${k}: slope = 2(${k}) + ${b} = ${2 * k + b}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/area under y = 2x from x = 0 to x = (\d+)/i);
    if (am) {
      const b = +am[1];
      return { explanation: `The area under a curve is a definite integral.`, hints: [
        `∫₀^${b} 2x dx: the antiderivative of 2x is x².`,
        `Evaluate at the ends: ${b}² − 0² = ${b * b}. (Check: it's a triangle — ½ × ${b} × ${2 * b} = ${b * b}.)`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // ── Shop-pack forms that fell through to generic (audit-shop-lesson-depth) ──
    // Missing subtrahend: "13 - ___ = 4"
    am = qa.match(/^(\d+)\s*-\s*_+\s*=\s*(\d+)$/);
    if (am) {
      const a5 = +am[1], b5 = +am[2];
      return { explanation: `Find how much was taken away.`, hints: [
        `Start with ${a5}; after taking the mystery number away, ${b5} is left.`,
        `The amount taken away is the DIFFERENCE: ${a5} − ${b5} = ${a5 - b5}.`,
        `Check it: ${a5} − ${a5 - b5} = ${b5} ✓`,
      ], answer: A };
    }
    // Missing minuend: "___ - 5 = 8"
    am = qa.match(/^_+\s*-\s*(\d+)\s*=\s*(\d+)$/);
    if (am) {
      const t = +am[1], b5 = +am[2];
      return { explanation: `Work backwards to find the starting number.`, hints: [
        `Some number lost ${t} and ended at ${b5} — undo the subtraction by ADDING.`,
        `${b5} + ${t} = ${b5 + t}.`,
        `Check it: ${b5 + t} − ${t} = ${b5} ✓`,
      ], answer: A };
    }
    // Zero & identity facts: "0 × 11", "11 × 0", "8 ÷ 8", "9 ÷ 1"
    am = qa.match(/^0\s*×\s*(\d+)\s*=?$/) ?? qa.match(/^(\d+)\s*×\s*0\s*=?$/);
    if (am) return { explanation: `Multiplying by zero.`, hints: [
      `${am[1]} groups of NOTHING — or zero groups of ${am[1]} — is still nothing.`,
      `Anything times 0 is 0.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/^(\d+)\s*÷\s*(\d+)\s*=?$/);
    if (am) {
      const a6 = +am[1], b6 = +am[2];
      if (a6 === b6) return { explanation: `A number divided by itself.`, hints: [
        `Share ${a6} things among ${a6} people — everyone gets exactly one.`,
        `Any number divided by itself is 1.`,
        `Answer: ${A}.`,
      ], answer: A };
      if (b6 === 1) return { explanation: `Dividing by 1.`, hints: [
        `Share ${a6} things with just 1 person — they get everything.`,
        `Any number divided by 1 stays itself.`,
        `Answer: ${A}.`,
      ], answer: A };
      if (b6 !== 0 && a6 % b6 === 0) return { explanation: `Think multiplication backwards.`, hints: [
        `Ask: ${b6} × what = ${a6}?`,
        `${b6} × ${a6 / b6} = ${a6} — found it.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Angles around a point: "40° + 40° + x = 360°"
    am = qa.match(/^(\d+)°\s*\+\s*(\d+)°\s*\+\s*x\s*=\s*360°$/);
    if (am) {
      const p1 = +am[1], p2 = +am[2];
      return { explanation: `Angles around a point make a FULL TURN: 360°.`, hints: [
        `Add the angles you know: ${p1}° + ${p2}° = ${p1 + p2}°.`,
        `The rest of the turn is x = 360° − ${p1 + p2}° = ${360 - p1 - p2}°.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Area model (box method): "Fill in the area model for (x + a)(x + b)."
    am = qa.match(/area model for \(x \+ (\d+)\)\(x \+ (\d+)\)/i);
    if (am) {
      const a7 = +am[1], b7 = +am[2];
      return { explanation: `The box splits the product into FOUR partial products.`, hints: [
        `Top-left: x · x = x². Top-right: x · ${b7} = ${b7}x.`,
        `Bottom-left: ${a7} · x = ${a7}x. Bottom-right: ${a7} · ${b7} = ${a7 * b7}.`,
        `The four cells are x², ${a7}x, ${b7}x and ${a7 * b7} — adding them gives x² + ${a7 + b7}x + ${a7 * b7}.`,
      ], answer: A };
    }
    // ── M14–M17 multi-angle forms (variety work) ──
    am = qa.match(/computes f\((\d+)\) for f\(x\) = (\d+)x \+ (\d+) as/i);
    if (am) {
      const v = +am[1], m5 = +am[2], b5 = +am[3];
      return { explanation: `Order of operations inside a function.`, hints: [
        `f(${v}) = ${m5}(${v}) + ${b5} — multiply FIRST, then add.`,
        `${m5} × ${v} = ${m5 * v}, then + ${b5} = ${m5 * v + b5}. Adding before multiplying gives the wrong ${m5 * (v + b5)}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/True or false: for f\(x\) = (\d+)x \+ (\d+), f\(0\) = (\d+)/i);
    if (am) return { explanation: `What happens at x = 0?`, hints: [
      `f(0) = ${am[1]}(0) + ${am[2]} — the x-term vanishes.`,
      `So f(0) = ${am[2]}. Compare that with ${am[3]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/True or false: for f\(x\) = x² \+ (\d+), f\(−?-?(\d+)\) (=|>) f\((\d+)\)/i);
    if (am) return { explanation: `Squaring kills the minus sign.`, hints: [
      `(−${am[2]})² = ${+am[2] * +am[2]} — exactly the same as ${am[2]}².`,
      `So f(−${am[2]}) and f(${am[3]}) are EQUAL, never bigger or smaller.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/True or false: f⁻¹\(f\((\d+)\)\) = (\d+) for f\(x\) = x \+ (\d+)/i);
    if (am) return { explanation: `The inverse UNDOES the function.`, hints: [
      `f(${am[1]}) = ${+am[1] + +am[3]}, then f⁻¹ subtracts ${am[3]}: back to ${am[1]}.`,
      `A round trip f⁻¹(f(x)) always returns the ORIGINAL number. Compare with ${am[2]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/Which function has range y ≥ (\d+)\?/i);
    if (am) return { explanation: `The smallest x² can be is 0.`, hints: [
      `x² ≥ 0 always, so x² + ${am[1]} is at least 0 + ${am[1]} = ${am[1]}.`,
      `That gives range y ≥ ${am[1]} — the other options shift or tilt differently.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/Which x is NOT allowed for f\(x\) = 1\/\(x - (\d+)\)\?/i);
    if (am) return { explanation: `Ban the value that makes the bottom zero.`, hints: [
      `The denominator is x − ${am[1]}; it hits 0 exactly when x = ${am[1]}.`,
      `Dividing by zero is impossible, so ${am[1]} is the one forbidden input.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/f adds (\d+) to every number\. What does f⁻¹ do\?/i);
    if (am) return { explanation: `The inverse is the UNDO button.`, hints: [
      `To undo "add ${am[1]}", you subtract ${am[1]}.`,
      `Check with a number: 10 → ${10 + +am[1]} → subtract ${am[1]} → back to 10.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/f\(x\) = (\d+)x \+ (\d+)\. For which x is f\(x\) = (\d+)\?/i);
    if (am) {
      const m5 = +am[1], b5 = +am[2], y5 = +am[3];
      return { explanation: `Undo the machine, last step first.`, hints: [
        `Undo the +${b5}: ${y5} − ${b5} = ${y5 - b5}.`,
        `Undo the ×${m5}: ${y5 - b5} ÷ ${m5} = ${(y5 - b5) / m5}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/f\(x\) = x \+ (\d+), g\(x\) = (\d+)x\. Find g\(f\((\d+)\)\)/i);
    if (am) {
      const a5 = +am[1], b5 = +am[2], v5 = +am[3];
      return { explanation: `Work INSIDE-OUT: f first, then g.`, hints: [
        `Inner first: f(${v5}) = ${v5} + ${a5} = ${v5 + a5}.`,
        `Feed it to g: g(${v5 + a5}) = ${b5} × ${v5 + a5} = ${b5 * (v5 + a5)}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/f\(x\) = x² \+ (\d+)\. What is the SMALLEST value/i);
    if (am) return { explanation: `Minimize the square first.`, hints: [
      `x² is never negative — its smallest value is 0, at x = 0.`,
      `So the smallest f(x) is 0 + ${am[1]} = ${am[1]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/f\(x\) = x² \+ (\d+)\. For which positive x is f\(x\) = (\d+)\?/i);
    if (am) {
      const c5 = +am[1], y5 = +am[2];
      return { explanation: `Peel back the +${c5}, then un-square.`, hints: [
        `x² = ${y5} − ${c5} = ${y5 - c5}.`,
        `The positive x with x² = ${y5 - c5} is ${Math.sqrt(y5 - c5)}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // M15 forms
    am = qa.match(/ladder's foot stands (\d+) m from a wall and its top reaches (\d+) m/i);
    if (am) {
      const a5 = +am[1], b5 = +am[2];
      return { explanation: `The ladder is the HYPOTENUSE of a right triangle.`, hints: [
        `Wall and ground meet at a right angle; the legs are ${a5} and ${b5}.`,
        `a² + b² = c²: ${a5}² + ${b5}² = ${a5 * a5 + b5 * b5}, so c = √${a5 * a5 + b5 * b5} = ${Math.sqrt(a5 * a5 + b5 * b5)}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/ramp rises (\d+) m over a horizontal base of (\d+) m/i);
    if (am) return { explanation: `tan θ = rise over run.`, hints: [
      `Opposite (rise) = ${am[1]}, adjacent (run) = ${am[2]}.`,
      `TOA: tan θ = opposite/adjacent = ${am[1]}/${am[2]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/Right triangle: hypotenuse (\d+), one leg (\d+)\. Find the other leg/i);
    if (am) {
      const c5 = +am[1], a5 = +am[2];
      return { explanation: `Run the theorem backwards for a LEG.`, hints: [
        `leg² = hypotenuse² − other leg²: ${c5}² − ${a5}² = ${c5 * c5 - a5 * a5}.`,
        `leg = √${c5 * c5 - a5 * a5} = ${Math.sqrt(c5 * c5 - a5 * a5)}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    if (/writes sin θ = adjacent\/hypotenuse\. What's wrong\?/i.test(qa)) return { explanation: `Check SOH-CAH-TOA.`, hints: [
      `SOH: Sine = OPPOSITE over hypotenuse — the side ACROSS from the angle.`,
      `Adjacent/hypotenuse is the COSINE (CAH).`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/For which angle is sin θ = (.+)\?/i);
    if (am) return { explanation: `Recall the special-angle table.`, hints: [
      `sin: 0°→0, 30°→1/2, 45°→√2/2, 60°→√3/2, 90°→1.`,
      `Find ${am[1]} in that list — it appears at exactly one of these angles.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/opposite (\d+), adjacent (\d+), hypotenuse (\d+), which ratio equals (\S+)\?/i);
    if (am) return { explanation: `Match the fraction to its sides.`, hints: [
      `${am[4]} = ${am[1]}/${am[3]} = opposite/hypotenuse.`,
      `Opposite over hypotenuse is SOH — the sine.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/^Convert (.+) radians to degrees$/i);
    if (am) return { explanation: `Radians → degrees: multiply by 180/π.`, hints: [
      `π radians = 180°, so replace every π with 180°.`,
      `${am[1]} → substitute π = 180° and simplify the arithmetic.`,
      `Answer: ${A}.`,
    ], answer: A };
    if (/True or false: (the hypotenuse is always|in a² \+ b² = c², c can be)/i.test(qa)) return { explanation: `Which side is c?`, hints: [
      `c is ALWAYS the hypotenuse — the side across from the right angle.`,
      `It's also always the longest side; a leg can never beat it.`,
      `Answer: ${A}.`,
    ], answer: A };
    if (/True or false: .*(radians|π)/i.test(qa) && /°/.test(qa)) return { explanation: `Anchor on 180° = π.`, hints: [
      `Half a turn: 180° = π radians; a full turn is 2π.`,
      `Scale from there: 90° = π/2, 60° = π/3, 45° = π/4, 30° = π/6.`,
      `Answer: ${A}.`,
    ], answer: A };
    // M16/M17 forms
    am = qa.match(/^(\d+) raised to what power gives (\d+)\?/i);
    if (am) {
      const b5 = +am[1]; let k5 = 0, t5 = 1;
      while (t5 < +am[2] && k5 < 12) { t5 *= b5; k5++; }
      return { explanation: `Count the multiplications.`, hints: [
        `Multiply ${b5} by itself until you hit ${am[2]}: ${Array.from({ length: k5 }, (_, j) => b5 ** (j + 1)).join(", ")}.`,
        `That took ${k5} steps, so the power is ${k5}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/rumor (doubles|triples).*reach (\d+) people\?/i) ?? qa.match(/colony starts with (\d+) cells? and (doubles|triples) every hour\. How many cells after (\d+) hours?/i);
    if (am) return { explanation: `Repeated multiplication is a POWER.`, hints: [
      `Each step multiplies by the same number — write the amounts step by step.`,
      `Track them in a row (×2 or ×3 each time) until you reach the target.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/^Solve (\d+)\^x = (\d+)$/i);
    if (am) {
      const b5 = +am[1]; let k5 = 0, t5 = 1;
      while (t5 < +am[2] && k5 < 12) { t5 *= b5; k5++; }
      return { explanation: `Make both sides the SAME base.`, hints: [
        `${am[2]} = ${b5}${"^"}${k5}, so the equation is ${b5}^x = ${b5}^${k5}.`,
        `Same base → exponents match: x = ${k5}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/True or false: (\d+)² = (\d+)$/i);
    if (am) return { explanation: `A power is repeated multiplication.`, hints: [
      `${am[1]}² means ${am[1]} × ${am[1]} = ${+am[1] * +am[1]} — not ${am[1]} × 2.`,
      `Compare ${+am[1] * +am[1]} with ${am[2]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/True or false: x = (-?\d+) is an x-intercept of f\(x\) = \(x - (\d+)\)\(x \+ (\d+)\)/i);
    if (am) return { explanation: `Intercepts come from the factors.`, hints: [
      `(x − ${am[2]})(x + ${am[3]}) = 0 at x = ${am[2]} and x = −${am[3]} — those are the ONLY crossings.`,
      `Check whether ${am[1]} is one of them.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/Which function crosses the x-axis at x = (\d+) and x = -(\d+)\?/i);
    if (am) return { explanation: `Build the factors from the roots.`, hints: [
      `A root at x = ${am[1]} needs the factor (x − ${am[1]}); a root at x = −${am[2]} needs (x + ${am[2]}).`,
      `Watch the SIGNS — the factor flips the root's sign.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/starts with \$(\d+) and saves \$(\d+) more each week\. How much does she have in week (\d+)\?/i);
    if (am) {
      const a5 = +am[1], d5 = +am[2], n5 = +am[3];
      return { explanation: `Steady saving = arithmetic sequence.`, hints: [
        `From week 1 to week ${n5} is ${n5 - 1} savings of $${d5}: ${n5 - 1} × ${d5} = ${(n5 - 1) * d5}.`,
        `Start + savings: ${a5} + ${(n5 - 1) * d5} = ${a5 + (n5 - 1) * d5}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    am = qa.match(/Arithmetic sequence: (\d+), (\d+), (\d+), … What is the common difference\?/i);
    if (am) return { explanation: `Subtract neighbours.`, hints: [
      `${am[2]} − ${am[1]} = ${+am[2] - +am[1]}, and ${am[3]} − ${am[2]} = ${+am[3] - +am[2]} — the same jump each time.`,
      `That constant jump IS the common difference.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/Geometric sequence: (\d+), (\d+), (\d+), … What is the ratio\?/i);
    if (am) return { explanation: `Divide neighbours.`, hints: [
      `${am[2]} ÷ ${am[1]} = ${+am[2] / +am[1]}, and ${am[3]} ÷ ${am[2]} = ${+am[3] / +am[2]} — the same multiplier.`,
      `That constant multiplier is the ratio.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/robot moves \((\d+), (\d+)\) then \((\d+), (\d+)\)/i);
    if (am) return { explanation: `Add the moves component by component.`, hints: [
      `x-parts: ${am[1]} + ${am[3]} = ${+am[1] + +am[3]} · y-parts: ${am[2]} + ${am[4]} = ${+am[2] + +am[4]}.`,
      `Total displacement: (${+am[1] + +am[3]}, ${+am[2] + +am[4]}).`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/For \((\d+), \d+\) \+ \((\d+), \d+\), what is the x-component/i);
    if (am) return { explanation: `Only the x-parts matter here.`, hints: [
      `Vectors add matching parts: x with x, y with y.`,
      `x-component: ${am[1]} + ${am[2]} = ${+am[1] + +am[2]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/True or false: \(2, (\d+)\) \+ \(3, 1\) = \(5, (\d+)\)/i);
    if (am) return { explanation: `Check each component.`, hints: [
      `x: 2 + 3 = 5 ✓ · y: ${am[1]} + 1 = ${+am[1] + 1}.`,
      `Compare the y-parts: is ${+am[1] + 1} the same as ${am[2]}?`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/^Magnitude of vector \((\d+), 0\)$/i);
    if (am) return { explanation: `A flat vector's length is just its x-part.`, hints: [
      `√(${am[1]}² + 0²) = √${+am[1] * +am[1]} = ${am[1]}.`,
      `A vector along an axis is as long as its only nonzero component.`,
      `Answer: ${A}.`,
    ], answer: A };
    am = qa.match(/drone flies (\d+) m east then (\d+) m north/i);
    if (am) {
      const a5 = +am[1], b5 = +am[2];
      return { explanation: `East and north are at right angles — Pythagorean theorem.`, hints: [
        `Distance² = ${a5}² + ${b5}² = ${a5 * a5 + b5 * b5}.`,
        `Distance = √${a5 * a5 + b5 * b5} = ${Math.sqrt(a5 * a5 + b5 * b5)} m.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Derivative — power rule: "d/dx xⁿ" / "d/dx a xⁿ"
    if (/d\/dx/i.test(q)) return { explanation: `Use the power rule to differentiate.`, hints: [
      `Power rule: bring the exponent down in front as a multiplier, then reduce the exponent by 1.`,
      `d/dx of xⁿ is n·xⁿ⁻¹ (multiply any coefficient already there by n).`,
      `Answer: ${A}.`,
    ], answer: A };
  }

  // ── Function notation & Algebra-II forms (M14/M16/M17) ───────────────────
  {
    const qn = q.replace(/−/g, "-");
    const co = (s: string | undefined) => (s === undefined || s === "" || s === "+" ? 1 : s === "-" ? -1 : parseInt(s, 10));
    // f(x) = mx + b. Find f(k)
    let fm = qn.match(/f\(x\)\s*=\s*(-?\d*)x\s*(?:([+-])\s*(\d+))?\s*\.?\s*Find\s+f\((-?\d+)\)/i);
    if (fm) {
      const m2 = co(fm[1]); const b = fm[2] ? (fm[2] === "-" ? -1 : 1) * +fm[3] : 0; const k = +fm[4];
      return { explanation: `f(${k}) means: replace x with ${k}.`, hints: [
        `Substitute ${k} everywhere you see x: f(${k}) = ${m2 === 1 ? "" : m2}(${k})${b ? (b > 0 ? ` + ${b}` : ` - ${-b}`) : ""}.`,
        `Multiply first: ${m2} × ${k} = ${m2 * k}${b ? `, then ${b > 0 ? "add" : "subtract"} ${Math.abs(b)}` : ""}.`,
        `f(${k}) = ${A}.`,
      ], answer: A };
    }
    // f(x) = x² + c. Find f(k)
    fm = qn.match(/f\(x\)\s*=\s*x²\s*(?:([+-])\s*(\d+))?\s*\.?\s*Find\s+f\((-?\d+)\)/i);
    if (fm) {
      const c = fm[1] ? (fm[1] === "-" ? -1 : 1) * +fm[2] : 0; const k = +fm[3];
      return { explanation: `f(${k}) means: replace x with ${k}.`, hints: [
        `Substitute: f(${k}) = (${k})²${c ? (c > 0 ? ` + ${c}` : ` - ${-c}`) : ""}.`,
        `Square first: ${k}² = ${k * k}${c ? `, then ${c > 0 ? "add" : "subtract"} ${Math.abs(c)}` : ""}.`,
        `f(${k}) = ${A}.`,
      ], answer: A };
    }
    // Inverse: f(x) = x + a. Find f⁻¹(b)
    fm = qn.match(/f\(x\)\s*=\s*x\s*([+-])\s*(\d+)\s*\.?\s*Find\s+f⁻¹\((-?\d+)\)/i);
    if (fm) {
      const a = (fm[1] === "-" ? -1 : 1) * +fm[2]; const b = +fm[3];
      return { explanation: `The inverse UNDOES the function.`, hints: [
        `f ${a > 0 ? "adds" : "subtracts"} ${Math.abs(a)}, so f⁻¹ ${a > 0 ? "subtracts" : "adds"} ${Math.abs(a)}.`,
        `f⁻¹(${b}) = ${b} ${a > 0 ? "-" : "+"} ${Math.abs(a)}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    // Composition: f(g(k)) with f and g given
    if (/f\(g\(/i.test(qn)) return { explanation: `Work from the INSIDE out.`, hints: [
      `First evaluate the inner function g at the given number.`,
      `Then feed that RESULT into f.`,
      `Answer: ${A}.`,
    ], answer: A };
    // Evaluate log_b(k)
    fm = qn.match(/log_?(\d+)\s*\(\s*(\d+)\s*\)/i);
    if (fm) return { explanation: `A log asks: "the base to WHAT POWER gives this number?"`, hints: [
      `Ask: ${fm[1]} to what power equals ${fm[2]}?`,
      `Count: ${fm[1]}, ${fm[1]}², ${fm[1]}³, … until you reach ${fm[2]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    // Solve bˣ = k
    fm = qn.match(/Solve\s+(\d+)[ˣ]\s*=\s*(\d+)/i);
    if (fm) return { explanation: `Match the powers of ${fm[1]}.`, hints: [
      `Write ${fm[2]} as a power of ${fm[1]}: ${fm[1]}, ${fm[1]}², ${fm[1]}³, …`,
      `When the bases match, the exponents must match.`,
      `x = ${A}.`,
    ], answer: A };
    // Arithmetic / geometric sequences & series
    fm = qn.match(/first term (\d+), common difference (\d+)\.?\s*Find term (\d+)/i);
    if (fm) { const a1 = +fm[1], d0 = +fm[2], n = +fm[3]; return { explanation: `Each term adds the common difference.`, hints: [
      `Term n = first term + (n − 1) × difference.`,
      `${a1} + (${n} − 1) × ${d0} = ${a1} + ${(n - 1) * d0}.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    fm = qn.match(/Sum of the first (\d+) terms: first term (\d+), common difference (\d+)/i);
    if (fm) { const n = +fm[1], a1 = +fm[2], d0 = +fm[3]; const last = a1 + (n - 1) * d0; return { explanation: `Sum = (number of terms ÷ 2) × (first + last).`, hints: [
      `Last term = ${a1} + (${n} − 1) × ${d0} = ${last}.`,
      `Sum = ${n}/2 × (${a1} + ${last}).`,
      `Answer: ${A}.`,
    ], answer: A }; }
    fm = qn.match(/first term (\d+), ratio (\d+)\.?\s*Find term (\d+)/i);
    if (fm) { const a1 = +fm[1], r = +fm[2], n = +fm[3]; return { explanation: `Each term multiplies by the ratio.`, hints: [
      `Term n = first term × ratio^(n − 1).`,
      `${a1} × ${r}^${n - 1} = ${a1} × ${Math.pow(r, n - 1)}.`,
      `Answer: ${A}.`,
    ], answer: A }; }
  }

  // ── Equations, conversions & higher-math forms (M3–M18 stragglers) ────────
  {
    const qe = q.replace(/^Solve for x:\s*/i, "").replace(/−/g, "-");
    let em = qe.match(/^(-?\d*)x\s*([+-])\s*(\d+)\s*=\s*(-?\d+)$/);
    if (em) {
      const k = em[1] === "" ? 1 : +em[1], b = +em[3], c = +em[4], add = em[2] === "+";
      const afterB = add ? c - b : c + b;
      return { explanation: `Undo one operation at a time, keeping both sides equal.`, hints: [
        `${add ? "Subtract" : "Add"} ${b} ${add ? "from" : "to"} BOTH sides: ${k === 1 ? "x" : `${k}x`} = ${afterB}.`,
        k === 1 ? `That's it — x is alone now.` : `Divide both sides by ${k}: x = ${afterB} ÷ ${k}.`,
        `x = ${A}.`,
      ], answer: A };
    }
    em = qe.match(/^(\d+)\(x\s*([+-])\s*(\d+)\)\s*=\s*(-?\d+)$/);
    if (em) {
      const k = +em[1], b = +em[3], c = +em[4], plus = em[2] === "+";
      return { explanation: `Undo the multiplication first, then the bracket.`, hints: [
        `Divide both sides by ${k}: x ${plus ? "+" : "-"} ${b} = ${c / k}.`,
        `${plus ? "Subtract" : "Add"} ${b}: x = ${c / k} ${plus ? "−" : "+"} ${b}.`,
        `x = ${A}.`,
      ], answer: A };
    }
    em = qe.match(/frac\{x\}\{(\d+)\}\s*=\s*(-?\d+)/);
    if (em) return { explanation: `x is being divided by ${em[1]} — undo it.`, hints: [
      `Multiply BOTH sides by ${em[1]}.`,
      `x = ${em[2]} × ${em[1]}.`,
      `x = ${A}.`,
    ], answer: A };
    // Three addends: "72 + 15 + 72"
    em = qe.match(/^(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)$/);
    if (em) { const s1 = +em[1] + +em[2]; return { explanation: `Add two at a time.`, hints: [
      `First: ${em[1]} + ${em[2]} = ${s1}.`,
      `Then: ${s1} + ${em[3]}.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    // Evaluate kx when x = n
    em = qe.match(/Evaluate\s+(\d+)x\s+when\s+x\s*=\s*(-?\d+)/i);
    if (em) return { explanation: `${em[1]}x means ${em[1]} × x.`, hints: [
      `Replace x with ${em[2]}: ${em[1]} × ${em[2]}.`,
      `Multiply.`,
      `Answer: ${A}.`,
    ], answer: A };
    // Rounding: "5.04 → nearest tenth"
    em = qe.match(/^([\d.]+)\s*→\s*nearest (whole|tenth|hundredth)/i);
    if (em) return { explanation: `Round to the nearest ${em[2]}.`, hints: [
      `Look at the digit just AFTER the ${em[2]} place.`,
      `5 or more rounds UP; 4 or less keeps it the same.`,
      `Answer: ${A}.`,
    ], answer: A };
    // Conversions: "0.06 → percent", "4% → decimal", "30% → fraction", "\frac{1}{50} as a percent"
    em = qe.match(/^([\d.]+)\s*→\s*percent/i);
    if (em) { const pv = Math.round(parseFloat(em[1]) * 100); const g3 = pv > 0 && pv <= 100 ? gcd(pv, 100) : 1; return { explanation: `Decimal → percent: multiply by 100.`, hints: [`${em[1]} × 100 = ${parseFloat(em[1]) * 100}.`, `Add the % sign.`, `Answer: ${A}.`], answer: A, visual: pv > 0 && pv <= 100 && 100 / g3 <= 20 ? `[[viz bar ${pv / g3} ${100 / g3}]]` : undefined }; }
    em = qe.match(/^(\d+(?:\.\d+)?)%\s*→\s*decimal/i);
    if (em) { const pv = parseFloat(em[1]); const g3 = Number.isInteger(pv) && pv > 0 && pv <= 100 ? gcd(pv, 100) : 1; return { explanation: `Percent → decimal: divide by 100.`, hints: [`${em[1]} ÷ 100 — move the decimal point two places left.`, `Answer: ${A}.`], answer: A, visual: Number.isInteger(pv) && pv > 0 && pv <= 100 && 100 / g3 <= 20 ? `[[viz bar ${pv / g3} ${100 / g3}]]` : undefined }; }
    em = qe.match(/^(\d+)%\s*→\s*fraction/i);
    if (em) { const g = gcd(+em[1], 100); return { explanation: `Percent means "out of 100".`, hints: [`Write it over 100: ${em[1]}/100.`, `Simplify by dividing top and bottom by ${g}.`, `Answer: ${A}.`], answer: A, visual: 100 / g <= 20 ? `[[viz bar ${+em[1] / g} ${100 / g}]]` : undefined }; }
    em = qe.match(/frac\{(\d+)\}\{(\d+)\}\s*(?:as a percent|→\s*percent)/i);
    if (em) return { explanation: `Fraction → percent: make the bottom 100.`, hints: [
      `${em[1]}/${em[2]} = ${+em[1] * (100 / +em[2])}/100 (multiply top and bottom by ${100 / +em[2]}).`,
      `Out of 100 means percent.`,
      `Answer: ${A}.`,
    ], answer: A, visual: +em[2] <= 24 ? `[[viz grid ${em[1]} ${em[2]}]]` : undefined };
    em = qe.match(/frac\{(\d+)\}\{(\d+)\}\s*→\s*decimal/i);
    if (em) return { explanation: `Fraction → decimal: divide top by bottom.`, hints: [`${em[1]} ÷ ${em[2]}.`, `Answer: ${A}.`], answer: A, visual: +em[2] <= 24 && +em[1] <= +em[2] ? `[[viz grid ${em[1]} ${em[2]}]]` : undefined };
    // M13 — zero product, solve by factoring, evaluate-when, factor-k
    em = qe.match(/\(x\s*([+-])\s*(\d+)\)\s*\(x\s*([+-])\s*(\d+)\)\s*=\s*0/);
    if (em) {
      const r1 = (em[1] === "-" ? 1 : -1) * +em[2], r2 = (em[3] === "-" ? 1 : -1) * +em[4];
      return { explanation: `Zero Product Property: if two things multiply to 0, one of them IS 0.`, hints: [
        `Set each bracket to zero: x ${em[1]} ${em[2]} = 0 and x ${em[3]} ${em[4]} = 0.`,
        `Solve each: x = ${r1}${r1 === r2 ? " (both brackets give the same root)" : ` or x = ${r2}`}.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    em = qe.match(/Solve\s+x²\s*([+-])\s*(\d+)x\s*([+-])\s*(\d+)\s*=\s*0/i);
    if (em) {
      const S = (em[1] === "-" ? -1 : 1) * +em[2], P = (em[3] === "-" ? -1 : 1) * +em[4];
      return { explanation: `Factor, then use the Zero Product Property.`, hints: [
        `Find two numbers that MULTIPLY to ${P} and ADD to ${S}.`,
        `Write the factors (x ± …)(x ± …) = 0, then set each bracket to zero.`,
        `Answer: ${A}.`,
      ], answer: A };
    }
    em = qe.match(/Is x = (-?\d+) a solution of (.+?)\?/i);
    if (em) return { explanation: `Test it — substitute and see if it works.`, hints: [
      `Replace x with ${em[1]} in ${em[2]}.`,
      `If both sides balance, it IS a solution; if not, it isn't.`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/Which equation has the solution x = ±(\d+)/i);
    if (em) return { explanation: `Work backwards from the roots.`, hints: [
      `x = ±${em[1]} means x² = ${+em[1] * +em[1]}.`,
      `Look for the equation equivalent to x² = ${+em[1] * +em[1]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/which value of k can x²\s*\+\s*kx\s*\+\s*(\d+) be factored as \(x\s*\+\s*(\d+)\)\(x\s*\+\s*(\d+)\)/i);
    if (em) return { explanation: `k is the SUM of the two factor numbers.`, hints: [
      `(x + ${em[2]})(x + ${em[3]}) expands to x² + (${em[2]} + ${em[3]})x + ${+em[2] * +em[3]}.`,
      `So k = ${em[2]} + ${em[3]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/Evaluate\s+(.+?)\s+when\s+x\s*=\s*(-?\d+)/i);
    if (em) return { explanation: `Substitute, then follow the order of operations.`, hints: [
      `Replace every x with ${em[2]} (in brackets): ${em[1].replace(/x/g, `(${em[2]})`)}.`,
      `Powers first, then multiply, then add.`,
      `Answer: ${A}.`,
    ], answer: A };
    // M14 — range / domain
    em = qe.match(/Range of f\(x\)\s*=\s*x²\s*\+\s*\(?(-?\d+)\)?/i);
    if (em) { const c = +em[1]; return { explanation: `x² is never negative — that pins the range.`, hints: [
      `The smallest x² can be is 0 (at x = 0).`,
      `So the smallest f(x) is 0 ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${c}.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    em = qe.match(/Domain of f\(x\)\s*=\s*1\/\(x\s*([+-])\s*(\d+)\)/i);
    if (em) { const bad2 = (em[1] === "-" ? 1 : -1) * +em[2]; return { explanation: `You can never divide by zero.`, hints: [
      `The bottom, x ${em[1]} ${em[2]}, cannot be 0.`,
      `Solve x ${em[1]} ${em[2]} = 0 → x = ${bad2}. That value is EXCLUDED.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    // M15 — text right-triangle forms
    em = qe.match(/legs (\d+) and (\d+)\.?\s*Find the hypotenuse/i);
    if (em) { const a4 = +em[1], b4 = +em[2]; return { explanation: `Pythagorean theorem: a² + b² = c².`, hints: [
      `${a4}² + ${b4}² = ${a4 * a4} + ${b4 * b4} = ${a4 * a4 + b4 * b4}.`,
      `c = √${a4 * a4 + b4 * b4}.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    em = qe.match(/opposite\s*=\s*(\d+),\s*(adjacent|hypotenuse)\s*=\s*(\d+)\.?\s*Find (sin|cos|tan)/i);
    if (em) { const which = em[4].toLowerCase(); const ratio = which === "sin" ? "opposite / hypotenuse" : which === "cos" ? "adjacent / hypotenuse" : "opposite / adjacent";
      return { explanation: `SOH-CAH-TOA tells you which sides to use.`, hints: [
        `${which} θ = ${ratio}.`,
        `Plug in the two given sides and simplify the fraction.`,
        `Answer: ${A}.`,
      ], answer: A }; }
    em = qe.match(/adjacent\s*=\s*(\d+),\s*hypotenuse\s*=\s*(\d+)\.?\s*Find (cos|sin|tan)/i);
    if (em) return { explanation: `SOH-CAH-TOA tells you which sides to use.`, hints: [
      `${em[3].toLowerCase()} θ uses the two given sides — write them as a fraction.`,
      `Simplify.`,
      `Answer: ${A}.`,
    ], answer: A };
    // M15 trig — special angles, radians, identity
    em = qe.match(/(sin|cos|tan)\s*(\d+)°/i);
    if (em) return { explanation: `${em[2]}° is a special angle — its values are worth memorising.`, hints: [
      `Recall the special-angle table for 0°, 30°, 45°, 60°, 90°.`,
      `Read off ${em[1]} ${em[2]}°.`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/Convert\s*(\d+)°\s*to radians/i);
    if (em) { const g = gcd(+em[1], 180); return { explanation: `Degrees → radians: multiply by π/180.`, hints: [
      `${em[1]} × π/180 = ${em[1]}π/180.`,
      `Simplify the fraction: divide ${em[1]} and 180 by ${g} → ${+em[1] / g}π/${180 / g}.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    em = qe.match(/(sin|cos)\s*θ\s*=\s*(\d+)\/(\d+)\.\s*Find (cos|sin)/i);
    if (em) { const o = +em[2], h = +em[3]; return { explanation: `Use sin²θ + cos²θ = 1 (or the missing side of the triangle).`, hints: [
      `The missing side = √(${h}² − ${o}²) = √${h * h - o * o} = ${Math.sqrt(h * h - o * o)}.`,
      `${em[4].toLowerCase()} θ = that side over the hypotenuse ${h}.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    // Evaluate a plain power: "Evaluate 2⁴"
    em = qe.match(/Evaluate\s+(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\s*$/i);
    if (em) { const SUPD: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
      const n = +[...em[2]].map((c) => SUPD[c]).join(""); return { explanation: `A power means repeated multiplication.`, hints: [
      `${em[1]}${em[2]} means ${Array(n).fill(em[1]).join(" × ")}.`,
      `Multiply step by step.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    // Which graph matches y = (x − h)² + k
    if (/Which graph matches y\s*=/.test(qe)) return { explanation: `Read the vertex from the equation.`, hints: [
      `y = (x − h)² + k has its vertex at (h, k) — watch the sign: (x + 2)² means h = −2.`,
      `A plain + k shifts the parabola up k; − k shifts it down.`,
      `Pick the graph whose turning point sits at that vertex. Answer: ${A}.`,
    ], answer: A };
    // M16 — graph analysis & advanced solving
    if (/end behavior/i.test(qe)) return { explanation: `Look at the LEADING term: its degree and sign.`, hints: [
      `Even degree → both ends point the same way; odd degree → opposite ways.`,
      `Positive lead → right end rises; negative lead → right end falls. For x → −∞, flip if the degree is odd.`,
      `Answer: ${A}.`,
    ], answer: A };
    if (/y-intercept of f\(x\)/i.test(qe)) return { explanation: `The y-intercept is where x = 0.`, hints: [
      `Substitute x = 0 — every x-term disappears.`,
      `Only the constant term is left.`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/crosses the x-axis at x = \d+ and x = \?/i);
    if (em) return { explanation: `x-intercepts come from setting each factor to zero.`, hints: [
      `Set the OTHER bracket equal to 0.`,
      `Solve that little equation.`,
      `Answer: ${A}.`,
    ], answer: A };
    if (/the graph ___ the x-axis|bounces|crosses/i.test(qe) && /multiplicit|\)²|\)³|\)⁴/i.test(qe + A)) return { explanation: `Check the factor's multiplicity (its exponent).`, hints: [
      `EVEN multiplicity → the graph touches and bounces back.`,
      `ODD multiplicity → the graph crosses straight through.`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/degree[- ](\d+).*turning points|polynomial of degree (\d+) has at most/i);
    if (em || /turning points/i.test(qe)) return { explanation: `Turning points are limited by the degree.`, hints: [
      `A degree-n polynomial has at most n − 1 turning points.`,
      `Subtract 1 from the degree.`,
      `Answer: ${A}.`,
    ], answer: A };
    if (/Fundamental Theorem of Algebra|roots \(counting multiplicity\)|roots \(with multiplicity\)/i.test(qe)) return { explanation: `The Fundamental Theorem of Algebra counts the roots.`, hints: [
      `A degree-n polynomial has EXACTLY n roots, counting multiplicity.`,
      `Read off the degree (the highest power).`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/remainder when (.+?) is divided by \(x ([−+-]) (\d+)\)/i);
    if (em) { const k = (em[2] === "+" ? -1 : 1) * +em[3]; return { explanation: `Remainder Theorem: the remainder is f(k).`, hints: [
      `Dividing by (x ${em[2]} ${em[3]}) → evaluate the polynomial at x = ${k}.`,
      `Substitute ${k} for x and work it out.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    if (/Rational Root Theorem/i.test(qe)) return { explanation: `Possible rational roots divide the constant term.`, hints: [
      `List the ± divisors of the constant term.`,
      `Pick the option that IS one of those divisors.`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/Simplify\s+i([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/i);
    if (em) return { explanation: `Powers of i repeat every 4: i, −1, −i, 1.`, hints: [
      `Divide the exponent by 4 and keep the remainder.`,
      `Remainder 1 → i, 2 → −1, 3 → −i, 0 → 1.`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/Add:?\s*\((\d+)\s*\+\s*(\d*)i\)\s*\+\s*\((\d+)\s*\+\s*(\d*)i\)/i);
    if (em) { const i1 = em[2] === "" ? 1 : +em[2], i2 = em[4] === "" ? 1 : +em[4];
      return { explanation: `Add real parts and imaginary parts separately.`, hints: [
      `Real: ${em[1]} + ${em[3]} = ${+em[1] + +em[3]}.`,
      `Imaginary: ${i1}i + ${i2}i = ${i1 + i2}i.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    // M17 — limits & vectors
    em = qe.match(/lim\(x→(-?\d+)\)\s*\(([^)]+)\)$/i);
    if (em && !qe.includes("/")) return { explanation: `Polynomials are continuous — just substitute.`, hints: [
      `Replace x with ${em[1]} in ${em[2]}.`,
      `Work out the arithmetic.`,
      `Answer: ${A}.`,
    ], answer: A };
    if (/lim\(x→/.test(qe) && /\//.test(qe)) return { explanation: `Direct substitution gives 0/0 — factor first.`, hints: [
      `Factor the top (difference of squares or a quadratic).`,
      `Cancel the common bracket with the bottom, THEN substitute.`,
      `Answer: ${A}.`,
    ], answer: A };
    em = qe.match(/Magnitude of \((-?\d+),\s*(-?\d+)\)/i);
    if (em) { const x = +em[1], y = +em[2]; return { explanation: `Magnitude is the Pythagorean length.`, hints: [
      `|v| = √(x² + y²) = √(${x * x} + ${y * y}).`,
      `√${x * x + y * y}.`,
      `Answer: ${A}.`,
    ], answer: A }; }
    em = qe.match(/Add the vectors:?\s*\((-?\d+),\s*(-?\d+)\)\s*\+\s*\((-?\d+),\s*(-?\d+)\)/i);
    if (em) return { explanation: `Add vectors component by component.`, hints: [
      `x-parts: ${em[1]} + ${em[3]} = ${+em[1] + +em[3]}.`,
      `y-parts: ${em[2]} + ${em[4]} = ${+em[2] + +em[4]}.`,
      `Answer: ${A}.`,
    ], answer: A };
    // M18 — integrals (power rule in reverse)
    if (/∫/.test(qe)) return { explanation: `Integrate with the power rule in reverse.`, hints: [
      `Raise the exponent by 1, then divide by the NEW exponent.`,
      `∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C — don't forget the + C.`,
      `Answer: ${A}.`,
    ], answer: A };
  }

  // ── Any remaining polynomial form: reuse the SHARED M12 step builder that
  // also powers the printed lesson pages (degree, standard form, leading
  // coefficient, FOIL, every factoring pattern, division …) — one source of
  // truth, so on-screen coaching teaches exactly like the printed lesson. ──
  {
    const ps = polyWorkedSteps(q, A);
    if (ps && ps.length) {
      const hints = /(answer|=)\s*.*$/i.test(ps[ps.length - 1]) ? ps : [...ps, `Answer: ${A}.`];
      return { explanation: `Let's work it step by step.`, hints, answer: A };
    }
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  // NEVER reveal the answer in the explanation — it shows IMMEDIATELY on a
  // wrong attempt (field report: multiple-choice mistakes gave the answer
  // away). The answer only appears if the student clicks through the hints.
  return {
    explanation: student
      ? `${student} isn't it — take another look at the question and try again.`
      : `Not quite — read the question again carefully.`,
    hints: [
      `Rule out any choices that are clearly too big, too small, or the wrong kind of thing.`,
      `The correct answer is ${A}.`,
    ],
    answer: A,
  };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
