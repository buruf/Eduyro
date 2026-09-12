// src/lib/math/worked-steps.ts
// Concrete, digit-by-digit working for multi-digit +, −, × — the exact column
// method a student writes, with real digits and carries/borrows shown. Used by
// the lesson page so worked examples demonstrate HOW, not just generic advice.

const PLACES = ["Ones", "Tens", "Hundreds", "Thousands", "Ten-thousands"];

// least-significant digit first
const digits = (n: number): number[] => String(n).split("").reverse().map(Number);

export function workedArithmeticSteps(a: number, op: "+" | "−" | "×", b: number): string[] {
  if (op === "+") return addSteps(a, b);
  if (op === "−") return subSteps(a, b);
  return mulSteps(a, b);
}

// Long division, digit by digit from the left (the bracket method).
export function workedDivisionSteps(dividend: number, divisor: number): string[] {
  const ds = String(dividend).split("").map(Number);
  const steps: string[] = [];
  let remainder = 0;
  const quotientDigits: number[] = [];
  for (let i = 0; i < ds.length; i++) {
    const working = remainder * 10 + ds[i];
    const qd = Math.floor(working / divisor);
    const sub = qd * divisor;
    remainder = working - sub;
    quotientDigits.push(qd);
    const into = `${divisor} goes into ${working} ${qd} time${qd === 1 ? "" : "s"} (${divisor} × ${qd} = ${sub}), remainder ${remainder}.`;
    if (i === 0) {
      // A leading digit smaller than the divisor is not a step a child writes
      // ("4 goes into 2 0 times") — start from the first group that works.
      if (qd === 0 && ds.length > 1) { quotientDigits.pop(); continue; }
      steps.push(`Start with ${working}: ${into}`);
    } else if (working === 0) {
      steps.push(`Bring down the 0: ${divisor} goes into 0 zero times, write 0.`);
    } else if (steps.length === 0) {
      steps.push(`Start with the first two digits, ${working}: ${into}`);
    } else {
      steps.push(`Bring down ${ds[i]} to make ${working}: ${into}`);
    }
  }
  const quotient = Math.floor(dividend / divisor);
  const r = dividend % divisor;
  steps.push(r === 0 ? `Answer: ${quotient}.` : `Answer: ${quotient} remainder ${r}.`);
  return steps;
}

function addSteps(a: number, b: number): string[] {
  const A = digits(a), B = digits(b);
  const len = Math.max(A.length, B.length);
  let carry = 0;
  const steps: string[] = [];
  for (let i = 0; i < len; i++) {
    const da = A[i] ?? 0, db = B[i] ?? 0;
    const sum = da + db + carry;
    const write = sum % 10, nc = Math.floor(sum / 10);
    const carryIn = carry ? ` + ${carry} carried` : "";
    steps.push(
      `${PLACES[i]}: ${da} + ${db}${carryIn} = ${sum}.` +
      (nc ? ` Write ${write}, carry ${nc}.` : ` Write ${write}.`)
    );
    carry = nc;
  }
  if (carry) steps.push(`Nothing left to add — bring down the carried ${carry}.`);
  steps.push(`Answer: ${a + b}.`);
  return steps;
}

function subSteps(a: number, b: number): string[] {
  const A = digits(a), B = digits(b);
  let borrow = 0;
  const steps: string[] = [];
  for (let i = 0; i < A.length; i++) {
    const orig = A[i];
    let top = orig - borrow;
    const bot = B[i] ?? 0;
    const afterBorrow = borrow ? ` (borrowed: ${orig} − 1 = ${top})` : "";
    let nextBorrow = 0;
    let makeNote = "";
    if (top < bot) { top += 10; nextBorrow = 1; makeNote = ` borrow 10 → ${top}`; }
    steps.push(`${PLACES[i]}: ${orig}${afterBorrow}${makeNote} − ${bot} = ${top - bot}.`);
    borrow = nextBorrow;
  }
  steps.push(`Answer: ${a - b}.`);
  return steps;
}

function mulSteps(a: number, b: number): string[] {
  const A = digits(a);
  let carry = 0;
  const steps: string[] = [];
  for (let i = 0; i < A.length; i++) {
    const da = A[i];
    const prod = da * b + carry;
    const write = prod % 10, nc = Math.floor(prod / 10);
    const carryIn = carry ? ` + ${carry} carried` : "";
    steps.push(
      `${PLACES[i]}: ${da} × ${b}${carryIn} = ${prod}.` +
      (nc ? ` Write ${write}, carry ${nc}.` : ` Write ${write}.`)
    );
    carry = nc;
  }
  if (carry) steps.push(`Nothing left to multiply — bring down the carried ${carry}.`);
  steps.push(`Answer: ${a * b}.`);
  return steps;
}

// ── 2-digit × 2-digit: partial products (two rows) ────────────────────────────
// The 1-digit column algorithm must never be fed a 2-digit multiplier ("Ones:
// 3 × 14 = 42, carry 4 … carry 11" is not a method a child can run on paper).
export function partialProductSteps(a: number, b: number): string[] {
  const tens = Math.floor(b / 10) * 10, ones = b % 10;
  const r1 = a * ones, r2 = a * tens;
  const steps = [`Split ${b} into ${tens} + ${ones}.`];
  if (ones) steps.push(`Ones row: ${a} × ${ones} = ${r1}.`);
  steps.push(`Tens row: ${a} × ${tens} = ${r2} (that is ${a} × ${tens / 10} with a 0 on the end).`);
  steps.push(ones ? `Add the rows: ${r1} + ${r2} = ${a * b}.` : `Answer: ${a * b}.`);
  return steps;
}

// ── Basic-fact strategies (the method a child at that unit actually owns) ─────
// Column carry/borrow/bring-down rituals are for genuine multi-digit work only;
// a fact gets the fact strategy its unit teaches. `label` is the unit's
// subSkillLabel; it chooses the strategy where several would apply.

export interface FactUnit { label?: string; directive?: string; objective?: string; }

const list = (xs: number[]) => xs.join(", ");
const upTo = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => f(i));
// factors named in a unit label, e.g. "×6, ×7, ×8, ×9 (the hard facts)" → [6,7,8,9]
export function unitFactors(label: string | undefined, op: "×" | "÷"): number[] {
  if (!label) return [];
  const head = label.split("(")[0];
  const re = op === "×" ? /×\s*(\d+)/g : /÷\s*(\d+)/g;
  const out: number[] = []; let m: RegExpExecArray | null;
  while ((m = re.exec(head))) out.push(+m[1]);
  return out;
}

export function additionFactSteps(a: number, b: number, unit: FactUnit = {}): string[] | null {
  if (a > 20 || b > 20 || a + b > 20) return null;
  const L = (unit.label ?? "").toLowerCase();
  const sum = a + b, big = Math.max(a, b), small = Math.min(a, b);
  const zero = () => [`Adding 0 is adding nothing, so the number stays the same.`, `${a} + ${b} = ${sum}.`];
  const countOn = () => [
    `Start at the bigger number, ${big}, and count on ${small} more.`,
    `${big}, then ${list(upTo(small, (i) => big + i + 1))}.`,
    `${a} + ${b} = ${sum}.`,
  ];
  const dbl = () => [`This is a double: ${a} + ${a}.`, `Two rows of ${a} make ${sum}.`, `${a} + ${b} = ${sum}.`];
  const near = () => [`Near-double: you know ${small} + ${small} = ${2 * small}.`, `This is just 1 more: ${2 * small} + 1 = ${sum}.`, `${a} + ${b} = ${sum}.`];
  const makeTen = () => { const need = 10 - big, rest = small - need; return [
    `Make ten first: ${big} needs ${need} to reach 10.`,
    `Split ${small} into ${need} + ${rest}: ${big} + ${need} = 10.`,
    `Then add the rest: 10 + ${rest} = ${sum}.`,
  ]; };
  const turn = () => [`Turnaround: ${a} + ${b} and ${b} + ${a} give the same answer.`, `Start at the bigger number, ${big}, and count on ${small}: ${list(upTo(small, (i) => big + i + 1))}.`, `${a} + ${b} = ${sum}.`];
  const canTen = sum > 10 && small >= 2 && big < 10;
  if (small === 0) return zero();
  if (/zero|turnaround/.test(L)) return a < b ? turn() : countOn();
  if (/near/.test(L) && Math.abs(a - b) === 1) return near();
  if (/double/.test(L) && !/near/.test(L) && a === b) return dbl();
  if (/make ten|bridg/.test(L) && canTen) return makeTen();
  if (/counting on|count on/.test(L) && small <= 3) return countOn();
  // No unit match — pick the strategy the numbers suggest.
  if (a === b) return dbl();
  if (Math.abs(a - b) === 1) return near();
  if (small <= 3) return countOn();
  if (canTen) return makeTen();
  return countOn();
}

export function subtractionFactSteps(a: number, b: number, unit: FactUnit = {}): string[] | null {
  if (a > 20 || b > a) return null;
  const L = (unit.label ?? "").toLowerCase();
  const d = a - b;
  const zero = () => [`Taking away nothing leaves the number as it is.`, `${a} − 0 = ${a}.`];
  const all = () => [`Take all ${a} away — nothing is left.`, `${a} − ${a} = 0.`];
  const back = () => [`Start at ${a} and count back ${b}: ${list(upTo(b, (i) => a - i - 1))}.`, `You land on ${d}.`, `${a} − ${b} = ${d}.`];
  const up = () => [`Start at ${b} and count up to ${a}: ${list(upTo(d, (i) => b + i + 1))} — that is ${d} jumps.`, `So ${b} + ${d} = ${a}.`, `${a} − ${b} = ${d}.`];
  const half = () => [`You know the double ${d} + ${d} = ${a}.`, `So half of ${a} is ${d}.`, `${a} − ${b} = ${d}.`];
  const nearHalf = () => { const h = Math.floor(a / 2); return b > h
    ? [`Start from the double you know: ${h} + ${h} = ${2 * h}, so ${2 * h} − ${h} = ${h}.`, `${a} − ${h} = ${a - h}, and ${b} is one more to take away: ${a - h} − 1 = ${d}.`, `${a} − ${b} = ${d}.`]
    : [`Start from the double you know: ${b} + ${b} = ${2 * b}.`, `${a} is ${a - 2 * b} more than ${2 * b}, so the answer is ${b} + ${a - 2 * b} = ${d}.`, `${a} − ${b} = ${d}.`]; };
  const bridge = () => { const toTen = a - 10, rest = b - toTen; return [
    `Go down to 10 first: ${a} − ${toTen} = 10.`,
    `That used ${toTen} of the ${b}; ${b} − ${toTen} = ${rest} still to take away.`,
    `10 − ${rest} = ${d}, so ${a} − ${b} = ${d}.`,
  ]; };
  const canBridge = a > 10 && a < 20 && b > a - 10 && b < 10;
  if (b === 0) return zero();
  if (a === b) return all();
  if (/subtract 0|subtract all/.test(L)) return b <= 3 ? back() : up();
  if (/count up|difference/.test(L)) return up();
  if (/halv|double/.test(L)) { if (a === 2 * b) return half(); if (Math.abs(a - 2 * b) <= 2 && b >= 2) return nearHalf(); }
  if (/bridg/.test(L) && canBridge) return bridge();
  if (/counting back|count back/.test(L) && b <= 3) return back();
  if (a === 2 * b && b >= 2) return half();
  if (canBridge) return bridge();
  if (b <= 3) return back();
  return up();
}

// a + ___ = c  /  ___ + b = c  — count up to the total.
export function missingAddendSteps(known: number, total: number): string[] | null {
  if (total < known) return null;
  const miss = total - known;
  if (total <= 20) return [
    `Start at ${known} and count up to ${total}: ${list(upTo(miss, (i) => known + i + 1))} — that is ${miss} jumps.`,
    `Check: ${known} + ${miss} = ${total}.`,
    `The missing number is ${miss}.`,
  ];
  const tens = Math.floor(miss / 10) * 10, ones = miss % 10;
  const mid = known + tens;
  return [
    `Count up from ${known} to ${total} in tens, then ones.`,
    ones ? `${known} + ${tens} = ${mid}, then ${mid} + ${ones} = ${total}.` : `${known} + ${tens} = ${total}.`,
    ones ? `You added ${tens} + ${ones} = ${miss}.` : `You added ${miss}.`,
    `Check: ${known} + ${miss} = ${total}.`,
  ];
}

export function multiplicationFactSteps(a: number, b: number, unit: FactUnit = {}): string[] | null {
  if (a > 12 || b > 12) return null;
  const L = (unit.label ?? "").toLowerCase();
  const p = a * b;
  const done = `${a} × ${b} = ${p}.`;
  if (a === 0 || b === 0) return [`${a === 0 ? b : a} groups of 0 is nothing at all — any number times 0 is 0.`, done];
  if (a === 1 || b === 1) return [`1 group of ${a === 1 ? b : a} is just ${a === 1 ? b : a} — any number times 1 is itself.`, done];
  const skip = (f: number, n: number) => [`Skip-count by ${f}, ${n} times: ${list(upTo(n, (i) => f * (i + 1)))}.`, `The last number you say is ${p}.`, done];
  const five = (f: number, n: number) => n <= 5 ? skip(f, n) : [
    `Use the five you know: ${f} × 5 = ${f * 5}.`,
    `That leaves ${n - 5} more ${n - 5 === 1 ? "group" : "groups"} of ${f}: ${f} × ${n - 5} = ${f * (n - 5)}.`,
    `Put them together: ${f * 5} + ${f * (n - 5)} = ${p}.`,
  ];
  const dbl3 = (n: number) => [`×3 is double, then one more: double ${n} is ${2 * n}.`, `One more ${n}: ${2 * n} + ${n} = ${p}.`, done];
  const dbl4 = (n: number) => [`×4 is double, then double again: double ${n} is ${2 * n}.`, `Double ${2 * n}: ${4 * n}.`, done];
  const ten = (n: number) => [`×10 puts a 0 on the end: ${n} becomes ${n * 10}.`, done];
  const eleven = (n: number) => n <= 9
    ? [`×11 repeats the digit: ${n} becomes ${n}${n}.`, done]
    : [`Split 11 into 10 + 1: ${n} × 10 = ${n * 10} and ${n} × 1 = ${n}.`, `${n * 10} + ${n} = ${p}.`, done];
  const twelve = (n: number) => [`Split 12 into 10 + 2: ${n} × 10 = ${n * 10} and ${n} × 2 = ${n * 2}.`, `${n * 10} + ${n * 2} = ${p}.`, done];
  const square = (n: number) => n >= 6 ? [`Use the five you know: ${n} × 5 = ${n * 5}.`, `${n - 5} more ${n - 5 === 1 ? "group" : "groups"} of ${n}: ${n * (n - 5)}. ${n * 5} + ${n * (n - 5)} = ${p}.`, done]
    : n === 5 ? skip(5, 5) : [`Use the five you know: ${n} × 5 = ${n * 5}.`, `Take ${5 - n} ${5 - n === 1 ? "group" : "groups"} of ${n} away: ${n * 5} − ${n * (5 - n)} = ${p}.`, done];
  const unitF = unitFactors(unit.label, "×");
  const has = (f: number) => a === f || b === f;
  const other = (f: number) => (a === f ? b : a);
  if (/square/.test(L) && a === b) return square(a);
  if (unitF.length) {
    const f = unitF.find(has);
    if (f !== undefined) {
      const n = other(f);
      if (f === 10) return ten(n);
      if (f === 11) return eleven(n);
      if (f === 12) return twelve(n);
      if (f === 3 && /build|double/.test(L)) return dbl3(n);
      if (f === 4 && /build|double/.test(L)) return dbl4(n);
      if (f === 2 || f === 5 || /skip/.test(L)) return skip(f, n);
      return five(f, n);
    }
  }
  // No unit match — pick by the numbers.
  if (has(10)) return ten(other(10));
  if (has(11)) return eleven(other(11));
  if (has(12)) return twelve(other(12));
  if (a === b) return square(a);
  if (has(2)) return skip(2, other(2));
  if (has(5)) return skip(5, other(5));
  if (has(3)) return dbl3(other(3));
  if (has(4)) return dbl4(other(4));
  return five(Math.max(a, b), Math.min(a, b));
}

// a × ___ = c  /  ___ × b = c  — count the known factor up to the product.
export function missingFactorSteps(known: number, product: number): string[] | null {
  if (known <= 0 || product % known !== 0) return null;
  const k = product / known;
  if (k > 12) return null;
  return [
    `Ask: which number times ${known} makes ${product}?`,
    `Count ${known}s until you reach ${product}: ${list(upTo(k, (i) => known * (i + 1)))}.`,
    `That took ${k} of them, so ${known} × ${k} = ${product} and the blank is ${k}.`,
  ];
}

export function divisionFactSteps(dividend: number, divisor: number): string[] | null {
  if (divisor < 1 || divisor > 12 || dividend > 144 || dividend % divisor !== 0) return null;
  const q = dividend / divisor;
  if (q > 12) return null;
  const done = `${dividend} ÷ ${divisor} = ${q}.`;
  if (divisor === 1) return [`Dividing by 1 changes nothing — ${dividend} split into 1 group is still ${dividend}.`, done];
  if (dividend === divisor) return [`A number divided by itself is 1 — ${dividend} split into groups of ${dividend} makes exactly 1 group.`, done];
  if (divisor === 10) return [`Dividing by 10 takes the 0 off the end: ${dividend} becomes ${q}.`, `Check: ${q} × 10 = ${dividend}.`, done];
  if (divisor === 11 && q <= 9) return [`${dividend} is a repeated digit, and ${q} × 11 = ${dividend}.`, done];
  return [
    `Think multiplication: ${divisor} × ? = ${dividend}.`,
    `You know ${divisor} × ${q} = ${dividend}, so the answer is ${q}.`,
    done,
  ];
}

// Remainders with a 1-digit quotient: the biggest multiple that fits.
export function remainderFactSteps(dividend: number, divisor: number): string[] | null {
  if (divisor < 2 || dividend >= 100) return null;
  const q = Math.floor(dividend / divisor), r = dividend % divisor;
  if (q > 9 || r === 0) return null;
  return [
    `Find the biggest multiple of ${divisor} that fits into ${dividend}: ${divisor} × ${q} = ${divisor * q} fits, ${divisor} × ${q + 1} = ${divisor * (q + 1)} is too big.`,
    `${q} equal groups of ${divisor} use ${divisor * q}; ${dividend} − ${divisor * q} = ${r} is left over.`,
    `Write the answer as ${q} r ${r} (${q} groups, remainder ${r}).`,
  ];
}

// Multiplying tens: 20 × 3 → 2 tens × 3.
export function tensMultiplySteps(a: number, b: number): string[] | null {
  const [t, n] = a % 10 === 0 && a >= 10 && b < 10 ? [a, b] : b % 10 === 0 && b >= 10 && a < 10 ? [b, a] : [0, 0];
  if (!t || t > 90 || n < 1) return null;
  const tens = t / 10;
  return [`${t} is ${tens} tens. So this is ${tens} tens × ${n}.`, `${tens} × ${n} = ${tens * n}, so ${tens} tens × ${n} = ${tens * n} tens.`, `${tens * n} tens is ${t * n}.`];
}
