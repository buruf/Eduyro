const { generateProblems } = require("@/lib/worksheet/generator");

// superscript map
const SUP: Record<string,string> = {"⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9","⁻":"-"};
function normExpr(s: string): string {
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, m => "^(" + m.split("").map(c=>SUP[c]).join("") + ")");
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "(($1)/($2))");
  s = s.replace(/×|·/g, "*").replace(/÷/g, "/").replace(/−|–/g, "-");
  s = s.replace(/(\d)\s*\(/g, "$1*(").replace(/\)\s*\(/g, ")*(").replace(/\)\s*(\d|x)/g, ")*$1");
  s = s.replace(/(\d)(x)/g, "$1*$2").replace(/(x)\s*\(/g, "$1*(");
  s = s.replace(/\^/g, "**");
  return s;
}
function evalAt(expr: string, x: number): number {
  const e = normExpr(expr);
  if (!/^[0-9x+\-*/(). *]*$/.test(e)) return NaN;
  try { return Function("x", `"use strict"; return (${e});`)(x); } catch { return NaN; }
}
function close(a: number, b: number) { return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b) < 1e-6; }
function gcd(a:number,b:number):number{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a;}
function parseFrac(s: string): number {
  s = String(s).trim();
  let m = s.match(/^\\frac\{(-?\d+)\}\{(-?\d+)\}$/); if (m) return +m[1]/+m[2];
  m = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/); if (m) return +m[1]/+m[2];
  m = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/); if (m) return +m[1] + Math.sign(+m[1]||1)*(+m[2]/+m[3]);
  const n = parseFloat(s); return n;
}

function verify(q: string, a: string): string {
  q = q.trim(); a = String(a).trim();
  let m: RegExpMatchArray | null;
  const ok = (exp: any) => (String(exp) === a || close(parseFrac(a), typeof exp==="number"?exp:parseFrac(String(exp)))) ? "ok" : `WRONG expected ${exp}`;

  if ((m = q.match(/^What number comes after (\d+)\?$/))) return ok(+m[1]+1);
  if ((m = q.match(/^What number comes before (\d+)\?$/))) return ok(+m[1]-1);
  if ((m = q.match(/^Which is greater:\s*(-?\d+) or (-?\d+)\?$/))) return ok(Math.max(+m[1],+m[2]));
  if ((m = q.match(/^Which is smaller:\s*(-?\d+) or (-?\d+)\?$/))) return ok(Math.min(+m[1],+m[2]));
  if ((m = q.match(/^How many (ones|tens|hundreds) in (\d+)\?$/))) {
    const n=+m[2]; const v = m[1]==="ones"?n%10 : m[1]==="tens"?Math.floor(n/10)%10 : Math.floor(n/100)%10; return ok(v);
  }
  if ((m = q.match(/^(-?[\d.]+)\s*([+\-×÷*\/−])\s*___\s*=\s*(-?[\d.]+)$/))) {
    const A=+m[1],C=+m[3],op=m[2];
    const v = op==="+"?C-A : (op==="-"||op==="−")?A-C : (op==="×"||op==="*")?C/A : A/C; return ok(Math.round(v*1e6)/1e6);
  }
  if ((m = q.match(/^___\s*([+\-×÷*\/−])\s*(-?[\d.]+)\s*=\s*(-?[\d.]+)$/))) {
    const B=+m[2],C=+m[3],op=m[1];
    const v = op==="+"?C-B : (op==="-"||op==="−")?C+B : (op==="×"||op==="*")?C/B : C*B; return ok(Math.round(v*1e6)/1e6);
  }
  if ((m = q.match(/^(-?[\d.]+)\s*([+\-×÷*·\/−])\s*(-?[\d.]+)(\s*=\s*\?)?$/))) {
    const A=+m[1],B=+m[3],op=m[2];
    let v = op==="+"?A+B : (op==="-"||op==="−")?A-B : (op==="÷"||op==="/")?A/B : A*B;
    const rm = a.match(/^(\d+)\s*r\s*(\d+)$/);
    if (rm && (op==="÷"||op==="/")) return (Math.floor(A/B)===+rm[1] && A%B===+rm[2]) ? "ok" : `WRONG expected ${Math.floor(A/B)} r ${A%B}`;
    v = Math.round(v*1e10)/1e10;
    return close(parseFrac(a), v) ? "ok" : `WRONG expected ${v}`;
  }
  if ((m = q.match(/^(-?[\d.]+)\s*___\s*(-?[\d.]+)$/))) {
    const v = +m[1] < +m[2] ? "<" : +m[1] > +m[2] ? ">" : "="; return a===v?"ok":`WRONG expected ${v}`;
  }
  if ((m = q.match(/^Simplify \\frac\{(\d+)\}\{(\d+)\}\.?$/))) {
    const g=gcd(+m[1],+m[2]); const exp=`\\frac{${+m[1]/g}}{${+m[2]/g}}`;
    const alt = (+m[2]/g===1) ? String(+m[1]/g) : exp;
    if (a===exp || a===alt) return "ok";
    if (close(parseFrac(a), +m[1]/+m[2])) {
      const am = a.match(/\{(-?\d+)\}\{(-?\d+)\}/) || a.match(/^(-?\d+)\/(-?\d+)$/);
      if (am && gcd(+am[1],+am[2])!==1) return `WRONG not fully reduced, expected ${exp}`;
      return "ok";
    }
    return `WRONG expected ${exp}`;
  }
  if ((m = q.match(/\\frac\{(\d+)\}\{(\d+)\}\s*([+\-×÷−])\s*\\frac\{(\d+)\}\{(\d+)\}/))) {
    const A=+m[1]/+m[2], B=+m[4]/+m[5], op=m[3];
    const v = op==="+"?A+B : (op==="-"||op==="−")?A-B : op==="×"?A*B : A/B;
    return close(parseFrac(a), v) ? "ok" : `WRONG expected ${v}`;
  }
  if ((m = q.match(/^(\d+(?:\.\d+)?)% of (\d+(?:\.\d+)?)$/))) return close(parseFrac(a), +m[1]/100*+m[2]) ? "ok" : `WRONG expected ${+m[1]/100*+m[2]}`;
  if ((m = q.match(/^(\d+(?:\.\d+)?)\s*([+\-−])\s*(\d+(?:\.\d+)?)%$/))) {
    const base=+m[1], p=+m[3]; const v = m[2]==="+" ? base*(1+p/100) : base*(1-p/100);
    return close(parseFrac(a), v) ? "ok" : `WRONG expected ${v}`;
  }
  if ((m = q.match(/^([\d.]+)\s*→\s*percent$/))) return (close(parseFloat(a), +m[1]*100) && /%$/.test(a)) ? "ok" : `WRONG expected ${+m[1]*100}%`;
  if ((m = q.match(/^(\d+)%\s*→\s*decimal$/))) return close(parseFloat(a), +m[1]/100) ? "ok" : `WRONG expected ${+m[1]/100}`;
  if ((m = q.match(/^Simplify the ratio (\d+)\s*:\s*(\d+)\.$/))) {
    const g=gcd(+m[1],+m[2]); const exp=`${+m[1]/g} : ${+m[2]/g}`; return a===exp?"ok":`WRONG expected ${exp}`;
  }
  if ((m = q.match(/^Find the missing number:\s*(\d+)\s*:\s*(\d+)\s*=\s*(\d+|___)\s*:\s*(\d+|___)$/))) {
    const A=+m[1],B=+m[2];
    let v: number;
    if (m[3]==="___") v = A * (+m[4]/B); else if (m[4]==="___") v = B * (+m[3]/A); else return "unverified";
    return close(parseFloat(a), v) ? "ok" : `WRONG expected ${v}`;
  }
  if ((m = q.match(/^Write an equivalent ratio: scale (\d+)\s*:\s*(\d+) by (\d+)\.$/))) {
    const exp=`${+m[1]*+m[3]} : ${+m[2]*+m[3]}`; return a===exp?"ok":`WRONG expected ${exp}`;
  }
  if ((m = q.match(/^Evaluate (.+?) when x = (-?\d+)\.?$/))) {
    const v = evalAt(m[1], +m[2]); if (!Number.isFinite(v)) return "unverified";
    return close(parseFrac(a), v) ? "ok" : `WRONG expected ${v}`;
  }
  if ((m = q.match(/^Solve for x:\s*(.+?)\s*=\s*(.+)$/))) {
    const xv = parseFrac(a); if (!Number.isFinite(xv)) return "unverified";
    const L = evalAt(m[1], xv), R = evalAt(m[2], xv);
    if (!Number.isFinite(L) || !Number.isFinite(R)) return "unverified";
    return close(L, R) ? "ok" : `WRONG x=${a} gives ${L} vs ${R}`;
  }
  if ((m = q.match(/^Solve x² = (\d+)/))) {
    const r = Math.sqrt(+m[1]);
    if (/±/.test(a)) return close(parseFloat(a.replace("±","")), r) ? "ok" : `WRONG expected ±${r}`;
    return close(parseFloat(a), r) ? "ok" : `WRONG expected ±${r}`;
  }
  if ((m = q.match(/^Solve \(x\s*([+\-−])\s*(\d+)\)\(x\s*([+\-−])\s*(\d+)\)\s*=\s*0/))) {
    const r1 = (m[1]==="-"||m[1]==="−") ? +m[2] : -+m[2];
    const r2 = (m[3]==="-"||m[3]==="−") ? +m[4] : -+m[4];
    const got = a.split(",").map(s=>parseFloat(s)).sort((x,y)=>x-y);
    const exp = r1===r2 ? [r1] : [r1,r2].sort((x,y)=>x-y);
    return JSON.stringify(got)===JSON.stringify(exp) ? "ok" : `WRONG expected ${exp.join(", ")}`;
  }
  if ((m = q.match(/^(Simplify|Multiply|Factor|Expand)\s+(.+?)\.?$/)) && /x/.test(q)) {
    const expr = m[2].replace(/^the expression\s*/,"");
    const v1 = evalAt(expr, 7), a1 = evalAt(a, 7);
    const v2 = evalAt(expr, 3), a2 = evalAt(a, 3);
    if (![v1,a1,v2,a2].every(Number.isFinite)) return "unverified";
    return (close(v1,a1)&&close(v2,a2)) ? "ok" : `WRONG: expr(7)=${v1} ans(7)=${a1}`;
  }
  if ((m = q.match(/^f\(x\)\s*=\s*(.+?)\.\s*Find f\((-?\d+)\)$/))) {
    const v = evalAt(m[1], +m[2]); if (!Number.isFinite(v)) return "unverified";
    return close(parseFrac(a), v) ? "ok" : `WRONG expected ${v}`;
  }
  if ((m = q.match(/^f\(x\)\s*=\s*(.+?)\.\s*Find f⁻¹\((-?\d+)\)$/))) {
    const y = +m[2]; const xv = parseFrac(a); if (!Number.isFinite(xv)) return "unverified";
    const v = evalAt(m[1], xv); if (!Number.isFinite(v)) return "unverified";
    return close(v, y) ? "ok" : `WRONG f(${a})=${v} != ${y}`;
  }
  if ((m = q.match(/^f\(x\)\s*=\s*(.+?)\.\s*Find f'\((-?\d+)\)$/))) {
    const h=1e-5, x0=+m[2];
    const d = (evalAt(m[1], x0+h) - evalAt(m[1], x0-h)) / (2*h);
    if (!Number.isFinite(d)) return "unverified";
    return Math.abs(parseFrac(a)-d)<1e-3 ? "ok" : `WRONG expected ${Math.round(d)}`;
  }
  if ((m = q.match(/^d\/dx\s+(.+)$/))) {
    const h=1e-5;
    const chk=(x0:number)=>{const d=(evalAt(m![1],x0+h)-evalAt(m![1],x0-h))/(2*h); const av=evalAt(a,x0); return [d,av];};
    const [d1,a1]=chk(2),[d2,a2]=chk(1.5);
    if (![d1,a1,d2,a2].every(Number.isFinite)) return "unverified";
    return (Math.abs(d1-a1)<1e-3 && Math.abs(d2-a2)<1e-3) ? "ok" : `WRONG deriv(2)=${d1} ans(2)=${a1}`;
  }
  if ((m = q.match(/^Slope of y = (.+?) at x = (-?\d+)$/))) {
    const h=1e-5,x0=+m[2]; const d=(evalAt(m[1],x0+h)-evalAt(m[1],x0-h))/(2*h);
    if (!Number.isFinite(d)) return "unverified";
    return Math.abs(parseFrac(a)-d)<1e-3?"ok":`WRONG expected ${Math.round(d)}`;
  }
  if ((m = q.match(/legs (\d+) and (\d+)\. Find the hypotenuse/))) {
    const v = Math.sqrt((+m[1])**2 + (+m[2])**2); return close(parseFrac(a),v)?"ok":`WRONG expected ${v}`;
  }
  if ((m = q.match(/^Right triangle: (\w+) = (\d+), (\w+) = (\d+)\. Find (sin|cos|tan) θ$/))) {
    const parts: any = { [m[1]]: +m[2], [m[3]]: +m[4] };
    const fn=m[5]; let v: number|undefined;
    if (fn==="tan"&&parts.opposite&&parts.adjacent) v=parts.opposite/parts.adjacent;
    if (fn==="sin"&&parts.opposite&&parts.hypotenuse) v=parts.opposite/parts.hypotenuse;
    if (fn==="cos"&&parts.adjacent&&parts.hypotenuse) v=parts.adjacent/parts.hypotenuse;
    if (v===undefined) return "unverified";
    return close(parseFrac(a),v)?"ok":`WRONG expected ${v}`;
  }
  if ((m = q.match(/^(sin|cos) θ = (\d+)\/(\d+)\. Find (sin|cos) θ/))) {
    const s=+m[2]/+m[3]; const v=Math.sqrt(1-s*s);
    return close(parseFrac(a), v)?"ok":`WRONG expected ${v}`;
  }
  if ((m = q.match(/^Evaluate (sin|cos|tan) (\d+)°\.?$/))) {
    const rad=+m[2]*Math.PI/180; const v = m[1]==="sin"?Math.sin(rad):m[1]==="cos"?Math.cos(rad):Math.tan(rad);
    const av = parseFrac(a.replace("√2/2","0.70710678").replace("√3/2","0.8660254").replace("√3/3","0.57735").replace("1/√2","0.70710678").replace("√3","1.7320508").replace("−","-"));
    if (!Number.isFinite(av)) return "unverified";
    return Math.abs(av - v) < 1e-4 ? "ok" : `WRONG expected ${v}`;
  }
  if ((m = q.match(/^Evaluate log_(\d+)\((\d+)\)\.?$/))) {
    const v = Math.log(+m[2])/Math.log(+m[1]); return Math.abs(parseFrac(a)-v)<1e-9?"ok":`WRONG expected ${v}`;
  }
  if ((m = q.match(/^Evaluate (\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/))) {
    const e = +m[2].split("").map(c=>SUP[c]).join(""); const v = (+m[1])**e;
    return close(parseFrac(a),v)?"ok":`WRONG expected ${v}`;
  }
  if ((m = q.match(/^Simplify i([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/))) {
    const e = +m[1].split("").map(c=>SUP[c]).join("") % 4;
    const exp = ["1","i","-1","-i"][e]; return a===exp?"ok":`WRONG expected ${exp}`;
  }
  if ((m = q.match(/^(Add|Subtract):\s*\((\d+)\s*([+\-−])\s*(\d+)i\)\s*([+\-−])\s*\((\d+)\s*([+\-−])\s*(\d+)i\)$/))) {
    const sgn=(s:string)=>s==="+"?1:-1;
    const r1=+m[2], i1=sgn(m[3])*+m[4], op=sgn(m[5]), r2=+m[6], i2=sgn(m[7])*+m[8];
    const R=r1+op*r2, I=i1+op*i2;
    const exp = `${R} ${I>=0?"+":"-"} ${Math.abs(I)}i`;
    return (a===exp || a===`${R}+${I}i`) ? "ok" : `WRONG expected ${exp}`;
  }
  if ((m = q.match(/^Arithmetic sequence: first term (\d+), common difference (\d+)\. Find term (\d+)$/))) {
    const v = +m[1] + (+m[3]-1)*+m[2]; return close(parseFrac(a),v)?"ok":`WRONG expected ${v}`;
  }
  if ((m = q.match(/^Geometric sequence: first term (\d+), ratio (\d+)\. Find term (\d+)$/))) {
    const v = +m[1] * (+m[2])**(+m[3]-1); return close(parseFrac(a),v)?"ok":`WRONG expected ${v}`;
  }
  if ((m = q.match(/^Add the vectors: \((-?\d+), (-?\d+)\) \+ \((-?\d+), (-?\d+)\)$/))) {
    const exp = `(${+m[1]+ +m[3]}, ${+m[2]+ +m[4]})`; return a===exp?"ok":`WRONG expected ${exp}`;
  }
  if ((m = q.match(/^Find the next number:\s*(-?\d+), (-?\d+), (-?\d+), (-?\d+), ___$/))) {
    const d1=+m[2]-+m[1], d2=+m[3]-+m[2], d3=+m[4]-+m[3];
    if (d1===d2&&d2===d3) return close(parseFrac(a), +m[4]+d1)?"ok":`WRONG expected ${+m[4]+d1}`;
    return "unverified";
  }
  if ((m = q.match(/What is the step for:\s*(-?\d+), (-?\d+), (-?\d+), (-?\d+)\?$/))) {
    const d=+m[2]-+m[1]; return close(parseFrac(a),d)?"ok":`WRONG expected ${d}`;
  }
  if ((m = q.match(/^Order these from least to greatest:\s*(.+)$/))) {
    const nums = m[1].split(",").map(s=>parseFloat(s.trim()));
    const exp = [...nums].sort((x,y)=>x-y).join(",");
    return a.replace(/\s/g,"")===exp ? "ok" : `WRONG expected ${exp}`;
  }
  if ((m = q.match(/^\[\[viz \w+ (\d+) (\d+)\]\]$/))) {
    return a===`\\frac{${m[1]}}{${m[2]}}` ? "ok" : `WRONG expected frac ${m[1]}/${m[2]}`;
  }
  if ((m = q.match(/^(Plot the point|Drag the vertex of the parabola to the point) \((-?\d+), (-?\d+)\)/))) {
    return a===`${m[2]},${m[3]}` ? "ok" : `WRONG expected ${m[2]},${m[3]}`;
  }
  if ((m = q.match(/angle θ = (\d+)°/))) return a===m[1] ? "ok" : `WRONG expected ${m[1]}`;
  if ((m = q.match(/^Domain of f\(x\) = 1\/\(x\s*-\s*(\d+)\)$/))) return a===`x ≠ ${m[1]}` ? "ok" : `WRONG expected x != ${m[1]}`;
  return "unverified";
}

const INTERACTIVE_RE = /\b(drag|click|tap|slide|plot the point|is shown|on the graph)\b/i;

const levels = Array.from({length:18},(_,i)=>`M${i+1}`);
const sheets = [1,11,21,31,41,51,61,71,81,91,100];
const adjPairs: [number,number][] = [[11,12],[51,52],[91,92]];

const summary: any = {};
const wrongs: string[] = [];
const unverifiedSamples: Record<string,string[]> = {};
const interactiveFlags: string[] = [];
const dupFlags: string[] = [];
const overlapFlags: string[] = [];
const monoReport: string[] = [];

function gen(lvl: string, s: number) {
  return generateProblems({ subjectSlug:"MATH", levelCode:lvl, skillName:"", problemCount:24, timeLimitMinutes:20, sheetNumber:s, totalSheets:100 }).problems;
}

for (const lvl of levels) {
  let total=0, okN=0, wrongN=0, unv=0;
  unverifiedSamples[lvl]=[];
  const seenInteractive = new Set<string>();
  for (const s of sheets) {
    let probs; try { probs = gen(lvl, s); } catch(e:any){ wrongs.push(`${lvl} sheet ${s}: GENERATION ERROR ${e.message}`); continue; }
    const texts = probs.map((p:any)=>p.question);
    const seen = new Set(); for (const t of texts){ if (seen.has(t)) dupFlags.push(`${lvl} s${s}: dup "${t.slice(0,70)}"`); seen.add(t); }
    for (const p of probs) {
      total++;
      const r = verify(p.question, String(p.answer));
      if (r==="ok") okN++;
      else if (r.startsWith("WRONG")) { wrongN++; wrongs.push(`${lvl} s${s}: "${p.question.slice(0,90)}" ans="${p.answer}" -- ${r}`); }
      else { unv++; if (unverifiedSamples[lvl].length<6 && !unverifiedSamples[lvl].some(x=>x.slice(4,34)===p.question.slice(0,30))) unverifiedSamples[lvl].push(`s${s} "${p.question.slice(0,110)}" => "${String(p.answer).slice(0,60)}"`); }
      if (INTERACTIVE_RE.test(p.question)) { const key=`${lvl}:${p.question.slice(0,25)}`; if(!seenInteractive.has(key)){ seenInteractive.add(key); interactiveFlags.push(`${lvl} s${s}: "${p.question.slice(0,90)}"`);} }
    }
  }
  for (const [a,b] of adjPairs) {
    try {
      const A = new Set(gen(lvl,a).map((p:any)=>p.question));
      const B = gen(lvl,b).map((p:any)=>p.question);
      const inter = B.filter(t=>A.has(t)).length;
      const pct = Math.round(100*inter/Math.max(B.length,1));
      if (pct>=60) overlapFlags.push(`${lvl} sheets ${a}/${b}: ${pct}% overlap`);
    } catch {}
  }
  const diffs: number[] = [];
  for (let s=1; s<=100; s+=9) {
    try {
      const ps = gen(lvl,s);
      const vals = ps.map((p:any)=>{ const ns=(p.question.match(/-?\d+(\.\d+)?/g)||[]).map(Number).map(Math.abs); return ns.length?Math.max(...ns):0; });
      diffs.push(vals.reduce((x:number,y:number)=>x+y,0)/Math.max(vals.length,1));
    } catch { diffs.push(NaN); }
  }
  monoReport.push(`${lvl}: ${diffs.map(d=>Math.round(d)).join(",")}`);
  summary[lvl] = { total, ok: okN, wrong: wrongN, unverified: unv };
}

console.log("=== SUMMARY (verified answer checks) ===");
for (const lvl of levels) { const s=summary[lvl]; const denom=s.ok+s.wrong; console.log(`${lvl}: total=${s.total} ok=${s.ok} wrong=${s.wrong} unverified=${s.unverified} (verified-correct ${denom?Math.round(100*s.ok/denom):0}%)`); }
console.log("\n=== WRONG ANSWERS ===");
wrongs.slice(0,100).forEach(w=>console.log(w)); if(wrongs.length>100) console.log(`...and ${wrongs.length-100} more`); if(!wrongs.length) console.log("(none)");
console.log("\n=== UNVERIFIED SAMPLES (manual review) ===");
for (const lvl of levels) if (unverifiedSamples[lvl].length) { console.log(lvl); unverifiedSamples[lvl].forEach(x=>console.log("  "+x)); }
console.log("\n=== WITHIN-SHEET DUPLICATES ===");
dupFlags.slice(0,40).forEach(x=>console.log(x)); if(!dupFlags.length) console.log("(none)"); if(dupFlags.length>40) console.log(`...and ${dupFlags.length-40} more`);
console.log("\n=== ADJACENT-SHEET OVERLAP >=60% ===");
overlapFlags.forEach(x=>console.log(x)); if(!overlapFlags.length) console.log("(none)");
console.log("\n=== INTERACTIVE-ONLY PHRASING ON PAPER ===");
interactiveFlags.slice(0,50).forEach(x=>console.log(x)); if(!interactiveFlags.length) console.log("(none)");
console.log("\n=== DIFFICULTY PROXY (mean max number per question, sheets 1,10,19,...,100) ===");
monoReport.forEach(x=>console.log(x));
