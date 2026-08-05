// src/lib/math/poly-steps.ts
// Fully-worked steps for polynomial (M12) problem forms — shared by the PDF
// renderer (lesson pages) and the tutor scaffold (on-screen hints + the
// pre-practice tutorial worked examples), so both teach identically.
// Extracted verbatim from pdf/renderer.tsx.

// real algebra steps here — crucially SHOWING how the minus sign distributes in
// subtraction (−(2x + 1) → −2x − 1), which is where students lose marks.
export function polyGcd(a: number, b: number): number { return b === 0 ? Math.abs(a) : polyGcd(b, a % b); }
// Parse a polynomial string ("2x³ + 6x² + 2x", "x² - 3x + 5") into terms sorted
// by descending power, plus a formatter and a sign-aware joiner — used by the
// M12 foundation/operations/division worked-step builders below.
export const R_SUP: Record<string, number> = { "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6 };
export const R_POW = ["", "", "²", "³", "⁴", "⁵", "⁶"];
export function rPoly(s: string): { c: number; p: number }[] {
  const norm = s.trim().replace(/\s*-\s*/g, " + -").replace(/\s*\+\s*/g, " + ");
  const terms: { c: number; p: number }[] = [];
  for (let tk of norm.split(" + ")) {
    tk = tk.trim(); if (!tk) continue;
    const xi = tk.indexOf("x");
    if (xi === -1) { terms.push({ c: parseInt(tk, 10), p: 0 }); continue; }
    const cs = tk.slice(0, xi).replace(/\s/g, "");
    const c = cs === "" || cs === "+" ? 1 : cs === "-" ? -1 : parseInt(cs, 10);
    const sup = tk.slice(xi + 1).trim();
    terms.push({ c, p: sup === "" ? 1 : (R_SUP[sup] ?? 1) });
  }
  return terms.sort((a, b) => b.p - a.p);
}
export const rMono = (c: number, p: number): string =>
  p === 0 ? `${c}` : `${c === 1 ? "" : c === -1 ? "-" : c}x${R_POW[p] ?? ""}`;
export const rJoin = (parts: string[]): string =>
  parts.map((s, i) => (i === 0 ? s : s.startsWith("-") ? ` - ${s.slice(1)}` : ` + ${s}`)).join("");
export function polyWorkedSteps(qRaw: string, ans: string): string[] | null {
  const q = qRaw.replace(/^(Simplify|Expand|Multiply|Factor)\s+/i, "").replace(/\s*=\s*$/, "").replace(/\.\s*$/, "").trim();
  const co = (s: string) => (s === "" ? 1 : s === "-" ? -1 : parseInt(s, 10));
  const t = (c: number, v = "x") => (c === 1 ? v : c === -1 ? `-${v}` : `${c}${v}`);
  let m: RegExpMatchArray | null;

  // (Ax + B) ± (Cx + D)  — add / subtract two binomials
  m = q.match(/^\((-?\d*)x\s*\+\s*(\d+)\)\s*([+-])\s*\((-?\d*)x\s*\+\s*(\d+)\)$/);
  if (m) {
    const A = co(m[1]), B = +m[2], C = co(m[4]), D = +m[5];
    if (m[3] === "-") return [
      `Distribute the minus sign — multiply every term in the 2nd bracket by -1:`,
      `-1 · ${t(C)} = ${t(-C)}   and   -1 · ${D} = -${D}`,
      `Rewrite without brackets:  ${t(A)} + ${B} - ${t(C)} - ${D}`,
      `Group like terms:  ${A}x - ${C}x  and  ${B} - ${D}`,
      `Combine:  ${A}x - ${C}x = ${A - C}x,   ${B} - ${D} = ${B - D}`,
    ];
    return [
      `Drop the brackets (all signs are +):  ${t(A)} + ${B} + ${t(C)} + ${D}`,
      `Group like terms:  ${A}x + ${C}x  and  ${B} + ${D}`,
      `Combine:  ${A}x + ${C}x = ${A + C}x,   ${B} + ${D} = ${B + D}`,
    ];
  }
  // Mx² ± Nx²  — combine like terms
  m = q.match(/^(-?\d*)x²\s*([+-])\s*(-?\d*)x²$/);
  if (m) {
    const M = co(m[1]), N = co(m[3]), sub = m[2] === "-", r = sub ? M - N : M + N;
    return [`Both terms are x² — they are like terms.`, `${sub ? "Subtract" : "Add"} the coefficients:  ${M} ${sub ? "-" : "+"} ${N} = ${r}`, `Keep the x²:  ${t(r, "x²")}`];
  }
  // Mx · Nx  — multiply monomials
  m = q.match(/^(\d+)x\s*·\s*(\d+)x$/);
  if (m) { const M = +m[1], N = +m[2]; return [`Multiply the coefficients:  ${M} × ${N} = ${M * N}`, `Multiply the variables:  x · x = x²`, `Answer:  ${M * N}x²`]; }
  // Mx(x ± B)  — distribute a monomial
  m = q.match(/^(\d+)x\(x\s*([+-])\s*(\d+)\)$/);
  if (m) { const M = +m[1], B = +m[3], sub = m[2] === "-"; return [`Multiply ${M}x by each term inside the bracket:`, `${M}x · x = ${M}x²`, `${M}x · ${sub ? "-" : ""}${B} = ${sub ? "-" : ""}${M * B}x`, `Answer:  ${M}x² ${sub ? "-" : "+"} ${M * B}x`]; }
  // (x + A)(x + B) — box method: answer is the four partial products "x²,Ax,Bx,AB".
  m = q.match(/^\(x\s*\+\s*(\d+)\)\(x\s*\+\s*(\d+)\)$/);
  if (m && /^x²\s*,/.test(ans)) {
    const A = +m[1], B = +m[2];
    return [`Fill the 2×2 box — multiply each row by each column:`, `x · x = x²`, `x · ${B} = ${B}x`, `${A} · x = ${A}x`, `${A} · ${B} = ${A * B}`, `Four partial products:  x², ${A}x, ${B}x, ${A * B}`];
  }
  // (x + A)(x + B)  — FOIL
  m = q.match(/^\(x\s*\+\s*(\d+)\)\(x\s*\+\s*(\d+)\)$/);
  if (m) { const A = +m[1], B = +m[2]; return [`First:  x · x = x²`, `Outer + Inner:  ${A}x + ${B}x = ${A + B}x`, `Last:  ${A} × ${B} = ${A * B}`, `Answer:  x² + ${A + B}x + ${A * B}`]; }
  // Gx + H  →  factor out the GCF (answer looks like "g(x + b)")
  m = q.match(/^(\d+)x\s*\+\s*(\d+)$/);
  if (m && /^\d+\(/.test(ans)) {
    const G = +m[1], H = +m[2], g = polyGcd(G, H);
    return [`Find the largest number that divides both ${G} and ${H}:  ${g}`, `Divide each term by ${g}:  ${G}x ÷ ${g} = ${t(G / g)},  ${H} ÷ ${g} = ${H / g}`, `Write it as ${g} × (what's left):  ${g}(${t(G / g)} + ${H / g})`];
  }
  // x² + Sx + P  →  factor the quadratic into (x + p)(x + q). Matches anywhere
  // in the prompt (the reworded item reads "Factor the quadratic expression:
  // x² + 7x + 10."). Find the factor pair of P that adds to S.
  // ── Tier-2 advanced factoring (detected by ANSWER shape, before the a=1 case) ──
  // Perfect-square trinomial → (x ± b)².
  let mm = ans.match(/^\(x ([+-]) (\d+)\)²$/);
  if (mm) {
    const sg = mm[1] === "+" ? "+" : "−", b = +mm[2];
    return [`The last term ${b * b} = ${b}² and the middle term is 2·${b}·x — a perfect square.`, `a² ${sg} 2ab + b² = (a ${sg} b)²`, `Answer:  (x ${sg} ${b})²`];
  }
  // Difference of squares → (a + b)(a − b).
  mm = ans.match(/^\((\d*)x \+ (\d+)\)\((\d*)x - (\d+)\)$/);
  if (mm) {
    const A = mm[1], b = mm[2];
    return [`Recognize a difference of squares:  ${q}.`, `a² − b² = (a + b)(a − b)`, `Answer:  (${A}x + ${b})(${A}x − ${b})`];
  }
  // Sum / difference of cubes → (x ± k)(x² ∓ kx + k²).
  mm = ans.match(/^\(x ([+-]) (\d+)\)\(x²/);
  if (mm) {
    const sg = mm[1], k = +mm[2], opp = sg === "+" ? "−" : "+";
    return [`Recognize a ${sg === "+" ? "sum" : "difference"} of cubes:  ${q} = x³ ${sg} ${k}³.`, `a³ ${sg} b³ = (a ${sg} b)(a² ${opp} ab + b²)`, `Answer:  ${ans}`];
  }
  // Factor by grouping (four terms) → (x² + a)(x + b).
  mm = ans.match(/^\(x² \+ (\d+)\)\(x \+ (\d+)\)$/);
  if (mm) {
    const a = +mm[1], b = +mm[2];
    return [`Group into pairs:  (x³ + ${b}x²) + (${a}x + ${a * b})`, `Factor each pair:  x²(x + ${b}) + ${a}(x + ${b})`, `Common factor (x + ${b}):  (x² + ${a})(x + ${b})`];
  }
  // Trinomial with a ≠ 1 (ax² + bx + c) → use the AC method.
  mm = q.match(/^(\d+)x² \+ (\d+)x \+ (\d+)$/);
  if (mm && +mm[1] > 1 && /^\(\d/.test(ans)) {
    const a = +mm[1], b = +mm[2], c = +mm[3], ac = a * c;
    let r = 0, s2 = 0;
    for (let i = 1; i < b; i++) if (i * (b - i) === ac) { r = i; s2 = b - i; break; }
    return [
      `Multiply a·c = ${a}·${c} = ${ac}.`,
      r ? `Two numbers multiply to ${ac} and add to ${b}:  ${r} and ${s2}.` : `Find two numbers that multiply to ${ac} and add to ${b}.`,
      r ? `Split the middle term:  ${a}x² + ${r}x + ${s2}x + ${c}, then group.` : `Split the middle term and group.`,
      `Answer:  ${ans}`,
    ];
  }
  m = q.match(/x²\s*\+\s*(\d+)x\s*\+\s*(\d+)/);
  if (m && /^\(x/.test(ans)) {
    const S = +m[1], P = +m[2];
    let p = 0, qq = 0;
    for (let i = 1; i < S; i++) if (i * (S - i) === P) { p = i; qq = S - i; break; }
    if (p) return [
      `To factor x² + ${S}x + ${P}, find two numbers that MULTIPLY to ${P} and ADD to ${S}.`,
      `List factor pairs of ${P} and test their sums — ${p} × ${qq} = ${P} and ${p} + ${qq} = ${S}. ✓`,
      `Those numbers go into the brackets:  (x + ${p})(x + ${qq})`,
      `Check by FOIL:  x² + ${qq}x + ${p}x + ${P} = x² + ${S}x + ${P}. ✓`,
    ];
  }
  // ── M12 Tier-1 forms (foundations, extra operations, division) ──
  // Evaluate a polynomial at x = k.
  m = qRaw.match(/^Evaluate (.+?) at x = (-?\d+)/);
  if (m) {
    const terms = rPoly(m[1]), k = +m[2];
    const shown = terms.map((tt) => (tt.p === 0 ? `${tt.c}` : `${tt.c}·(${k})${R_POW[tt.p] ?? ""}`));
    const vals = terms.map((tt) => tt.c * Math.pow(k, tt.p));
    return [`Substitute x = ${k} into every term:`, rJoin(shown), `= ${rJoin(vals.map(String))} = ${ans}`];
  }
  // Degree of a polynomial.
  m = qRaw.match(/^Find the degree of (.+?)\.?$/);
  if (m) {
    const lead = rPoly(m[1])[0];
    return [`The degree is the highest power of x that appears.`, `Highest-power term: ${rMono(lead.c, lead.p)} → power ${ans}.`];
  }
  // Standard form (descending powers).
  m = qRaw.match(/^Write in standard form: (.+?)\.?$/);
  if (m) return [`Standard form lists terms from the HIGHEST power of x down to the constant.`, `Reorder the terms:  ${ans}`];
  // Leading coefficient / constant term.
  m = qRaw.match(/leading coefficient of (.+?)\?/);
  if (m) { const lead = rPoly(m[1])[0]; return [`The leading term is the one with the highest power:  ${rMono(lead.c, lead.p)}.`, `Its coefficient (the number in front) is ${ans}.`]; }
  m = qRaw.match(/constant term of/);
  if (m) return [`The constant term is the number with no x attached.`, `Here that is ${ans}.`];
  // Classify by number of terms.
  m = qRaw.match(/Classify by the number of terms:\s*(.+)$/);
  if (m) { const nt = rPoly(m[1]).filter((tt) => tt.c !== 0).length; return [`Count the terms separated by + or −:  ${nt}.`, `${nt === 1 ? "One term → monomial" : nt === 2 ? "Two terms → binomial" : "Three terms → trinomial"}.`]; }
  // Is this a polynomial?
  if (/^Is this a polynomial\?/.test(qRaw)) return ans === "Yes"
    ? [`Every term has x raised to a whole-number power (0, 1, 2, …) and no x in a denominator or under a root.`, `So YES, it is a polynomial.`]
    : [`A polynomial cannot have x in a denominator, under a root sign, or with a negative/fractional exponent.`, `This expression breaks that rule → NOT a polynomial.`];
  // Divide by a monomial:  (…) ÷ Dx — FACTOR-AND-CANCEL method (factor the
  // divisor out of the top, then cancel it) rather than term-by-term splitting;
  // it reinforces GCF factoring and shows WHY the division works.
  m = q.match(/^Divide \((.+?)\) ÷ (\d+)x$/);
  if (m) {
    const D = +m[2];
    const terms = rPoly(m[1]);
    const inside = rJoin(terms.map((tt) => rMono(tt.c / D, tt.p - 1)));
    return [
      `Factor ${D}x out of the top:  ${m[1]} = ${D}x(${inside}).`,
      `Now divide: ${D}x(${inside}) ÷ ${D}x — the ${D}x on top and bottom cancel.`,
      `Answer:  ${ans}`,
    ];
  }
  // Divide by a binomial:  (x² + Sx + C) ÷ (x + a) — FACTOR-AND-CANCEL: these
  // quadratics all factor exactly as (x + a)(x + b), so factor the top and
  // cancel the common bracket (long division is the backup for messy cases).
  m = q.match(/^Divide \((.+?)\) ÷ \(x \+ (\d+)\)$/);
  if (m) {
    const terms = rPoly(m[1]); const a = +m[2];
    const S = terms.find((tt) => tt.p === 1)?.c ?? 0, b = S - a;
    return [
      `Factor the top: ${m[1]} = (x + ${a})(x + ${b})  (${a} × ${b} = ${a * b}, ${a} + ${b} = ${S}).`,
      `Cancel the common (x + ${a}) top and bottom.`,
      `Answer:  ${ans}`,
    ];
  }
  // Monomial × trinomial (or any parenthesised sum):  Nx(…)   [verb already stripped]
  m = q.match(/^(\d+)x\((.+)\)$/);
  if (m) {
    const N = +m[1];
    const lines = rPoly(m[2]).map((tt) => `${N}x · ${rMono(tt.c, tt.p)} = ${rMono(N * tt.c, tt.p + 1)}`);
    return [`Multiply ${N}x by each term inside the bracket:`, ...lines, `Answer:  ${ans}`];
  }
  // Binomial × trinomial:  (x + a)(…)
  m = q.match(/^\(x \+ (\d+)\)\((.+)\)$/);
  if (m) {
    const a = +m[1], inner = rPoly(m[2]);
    const l1 = inner.map((tt) => `x · ${rMono(tt.c, tt.p)} = ${rMono(tt.c, tt.p + 1)}`);
    const l2 = inner.map((tt) => `${a} · ${rMono(tt.c, tt.p)} = ${rMono(a * tt.c, tt.p)}`);
    return [`Multiply x by each term of the trinomial:`, ...l1, `Then multiply ${a} by each term:`, ...l2, `Add and combine like terms →  ${ans}`];
  }
  return null;
}
