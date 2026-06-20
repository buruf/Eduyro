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
    steps.push(i === 0 ? `Start with ${working}: ${into}` : `Bring down ${ds[i]} to make ${working}: ${into}`);
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
