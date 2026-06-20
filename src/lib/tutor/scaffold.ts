// src/lib/tutor/scaffold.ts
// ─────────────────────────────────────────────────────────────────────────────
// Engine/rule-driven reactive scaffolding.
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
}

// Strip a leading visual marker ("[[viz pie 3 4]] …") and normalise whitespace.
function clean(q: string): string {
  return q.replace(/^\[\[viz[^\]]*\]\]\s*/, "").replace(/\s+/g, " ").trim();
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
  const q = clean(question);
  const A = String(correct);

  // ── Visual fraction pictures ("[[viz hexa 5 6]]") — count shaded over total ─
  const vizM = question.match(/\[\[viz \w+ (\d+) (\d+)/);
  if (vizM) {
    const n = +vizM[1], d = +vizM[2];
    return {
      explanation: `Count the shaded parts over the total parts.`,
      hints: [`Shaded parts: ${n}`, `Total equal parts: ${d}`, `Answer: ${A}.`],
      answer: A,
    };
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
      return { explanation: `Divide top and bottom by their greatest common factor.`,
        hints: [`GCF of ${n} and ${d} is ${g}.`, `${n}÷${g}=${n / g}, ${d}÷${g}=${d / g}.`, `Answer: ${A}.`], answer: A };
    }
    if (/compare|>, <, or =|greater|larger/.test(dir) && fr.length === 2) {
      const [[n1, d1], [n2, d2]] = fr; const L = (d1 * d2) / gcd(d1, d2);
      return { explanation: `Rewrite with a common denominator, then compare the numerators.`,
        hints: [`Common denominator ${L}: ${n1 * (L / d1)}/${L} and ${n2 * (L / d2)}/${L}.`, `Compare the numerators.`, `Answer: ${A}.`], answer: A };
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
      return { explanation: `Multiply (or divide) top and bottom by the same number.`,
        hints: [`Find what the known part was multiplied by.`, `Apply the same factor to the other part.`, `Answer: ${A}.`], answer: A };
    }
    // Ratios "a : b" — simplify or scale.
    const ratio = q.match(/(\d+)\s*:\s*(\d+)(?:\s*×\s*(\d+))?/);
    if (/ratio|simplest form/.test(dir) && ratio && !ratio[3]) {
      const a = +ratio[1], b = +ratio[2], g = gcd(a, b);
      return { explanation: `Divide both terms by their greatest common factor.`,
        hints: [`GCF of ${a} and ${b} is ${g}.`, `${a}÷${g} : ${b}÷${g}.`, `Answer: ${A}.`], answer: A };
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
    // Solve for x — any equation.
    if (/solve/.test(dir) && q.includes("=")) {
      return { explanation: `Undo the operations on x, one at a time, to isolate it.`,
        hints: [`Do the inverse operation to both sides.`, `Keep going until x is alone.`, `x = ${A}.`], answer: A };
    }
    // Round "3.47 → nearest tenth"
    if (/round/.test(dir)) {
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
    // Conversions "1/4 → percent", "0.25 → percent", "25% → fraction/decimal"
    if (/convert/.test(dir)) {
      return { explanation: `Move between forms: ÷ for fraction→decimal, ×100 for →percent, /100 for percent→.`,
        hints: [`Decide the direction of the conversion.`, `Apply the matching step.`, `Answer: ${A}.`], answer: A };
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
    // Multi-digit by a single digit → teach the column method; otherwise it's a
    // times-table fact, so skip-counting is the better mental model.
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
      explanation: `${a} × ${b} means ${a} added together ${b} times.`,
      hints: [
        `Picture ${b} equal groups of ${a}.`,
        `Skip-count by ${a}: ${skipCount(a, b)}.`,
        `${a} × ${b} = ${A}.`,
      ],
      answer: A,
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
        `How many groups of ${a} fit into ${c}?`,
        `The missing number is ${A}.`,
      ],
      answer: A,
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
        : {
            explanation: `Add ${a} and ${b} together.`,
            hints: [`Start at ${a} and count up ${b} more.`, `Break it up if it helps: ${a} + ${b}.`, `${a} + ${b} = ${A}.`],
            answer: A,
          };
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
    };
  }

  // ── Add/subtract fractions with the SAME denominator ─────────────────────
  m = q.match(/\}\{(\d+)\}\s*([+\-])\s*.*?\}\{(\d+)\}/);
  if (m && m[1] === m[3]) {
    const d = m[1], op = m[2];
    return {
      explanation: `The denominators are the same (${d}), so just ${op === "+" ? "add" : "subtract"} the top numbers and keep the bottom.`,
      hints: [
        `Keep the denominator ${d} the same.`,
        `${op === "+" ? "Add" : "Subtract"} the numerators.`,
        `Then simplify if you can. Answer: ${A}.`,
      ],
      answer: A,
    };
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

  // ── Generic fallback (concise, no coaching filler) ───────────────────────
  return {
    explanation: student
      ? `You answered ${student}. The correct answer is ${A}.`
      : `The correct answer is ${A}.`,
    hints: [
      `The correct answer is ${A}.`,
    ],
    answer: A,
  };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
