// src/lib/shop/sample-problems.ts
// Generates sample problems for the in-browser preview.
// Uses warmup problems for each skill — view-only, no answer keys.

import { SheetProblem } from "@/lib/worksheet/render-sheet";

export type Skill = "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION" | "FRACTIONS" | "DECIMALS" | "RATIOS" | "PRE_ALGEBRA" | "LINEAR_EQUATIONS" | "POLYNOMIALS";

export function generateShopSampleProblems(skill: Skill, sheetNumber: number): SheetProblem[] {
  const seed = sheetNumber * 13 + skill.length;
  switch (skill) {
    case "ADDITION":        return additionProblems(seed);
    case "SUBTRACTION":     return subtractionProblems(seed);
    case "MULTIPLICATION":  return multiplicationProblems(seed);
    case "DIVISION":        return divisionProblems(seed);
    case "FRACTIONS":       return fractionProblems(seed);
    case "DECIMALS":        return decimalProblems(seed);
    case "RATIOS":          return ratioProblems(seed);
    case "PRE_ALGEBRA":     return preAlgebraProblems(seed);
    case "LINEAR_EQUATIONS":return linearProblems(seed);
    case "POLYNOMIALS":     return polynomialProblems(seed);
  }
}

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function additionProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  out.push(...[{question:"1 + 1 =",answer:"2"},{question:"1 + 2 =",answer:"3"},{question:"2 + 2 =",answer:"4"},{question:"2 + 3 =",answer:"5"}].map((p,i)=>({...p,id:`samp-add-warm-${i}`})));
  for (let i = 0; i < 26; i++) { const a=Math.floor(r()*9)+1,b=Math.floor(r()*9)+1; out.push({id:`samp-add-${i}`,question:`${a} + ${b} =`,answer:String(a+b)}); }
  return out;
}

function subtractionProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  out.push(...[{question:"2 − 1 =",answer:"1"},{question:"3 − 1 =",answer:"2"},{question:"3 − 2 =",answer:"1"},{question:"4 − 2 =",answer:"2"}].map((p,i)=>({...p,id:`samp-sub-warm-${i}`})));
  for (let i = 0; i < 26; i++) { const a=Math.floor(r()*9)+1,b=Math.floor(r()*a); out.push({id:`samp-sub-${i}`,question:`${a} − ${b} =`,answer:String(a-b)}); }
  return out;
}

function multiplicationProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  out.push(...[{question:"2 × 1 =",answer:"2"},{question:"2 × 2 =",answer:"4"},{question:"3 × 1 =",answer:"3"},{question:"3 × 2 =",answer:"6"}].map((p,i)=>({...p,id:`samp-mul-warm-${i}`})));
  for (let i = 0; i < 26; i++) { const a=Math.floor(r()*8)+2,b=Math.floor(r()*8)+2; out.push({id:`samp-mul-${i}`,question:`${a} × ${b} =`,answer:String(a*b)}); }
  return out;
}

function divisionProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  out.push(...[{question:"2 ÷ 2 =",answer:"1"},{question:"4 ÷ 2 =",answer:"2"},{question:"6 ÷ 2 =",answer:"3"},{question:"6 ÷ 3 =",answer:"2"}].map((p,i)=>({...p,id:`samp-div-warm-${i}`})));
  for (let i = 0; i < 26; i++) { const b=Math.floor(r()*8)+2,q=Math.floor(r()*8)+2; out.push({id:`samp-div-${i}`,question:`${b*q} ÷ ${b} =`,answer:String(q)}); }
  return out;
}

function fractionProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  const gcd = (a:number,b:number):number => b===0?a:gcd(b,a%b);
  const warmups = [
    {question:"Which is larger: 1/2 or 1/3?",answer:"1/2"},
    {question:"Write 4/8 in simplest form.",answer:"1/2"},
    {question:"1/4 + 1/4 =",answer:"2/4 = 1/2"},
    {question:"1/2 + 1/4 = (find common denominator first)",answer:"3/4"},
    {question:"2/3 × 3/4 =",answer:"1/2"},
    {question:"1/2 ÷ 1/4 =",answer:"2"},
  ];
  out.push(...warmups.map((p,i)=>({...p,id:`samp-frac-warm-${i}`})));
  // Mix of all fraction operations
  const ops: [string,string][] = [
    ["Simplify 6/9","2/3"],["Simplify 8/12","2/3"],["Simplify 10/15","2/3"],
    ["1/3 + 1/6 =","1/2"],["1/2 + 1/3 =","5/6"],["3/4 − 1/4 =","1/2"],
    ["2/3 − 1/6 =","1/2"],["1/2 × 2/3 =","1/3"],["3/4 × 4/5 =","3/5"],
    ["1/2 ÷ 1/3 =","3/2"],["2/3 ÷ 4/6 =","1"],["3/4 ÷ 3/8 =","2"],
    ["Convert 7/4 to a mixed number","1 3/4"],["Convert 2 1/3 to an improper fraction","7/3"],
    ["Which is larger: 2/3 or 3/5?","2/3"],
  ];
  for (let i = 0; i < 24; i++) {
    const op = ops[Math.floor(r()*ops.length)];
    out.push({id:`samp-frac-${i}`,question:op[0],answer:op[1]});
  }
  return out;
}

function decimalProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  const warmups = [
    {question:"0.5 + 0.3 =",answer:"0.8"},
    {question:"1.2 + 2.3 =",answer:"3.5"},
    {question:"What is 10% of 50?",answer:"5"},
    {question:"What is 25% of 100?",answer:"25"},
  ];
  out.push(...warmups.map((p,i)=>({...p,id:`samp-dec-warm-${i}`})));
  for (let i = 0; i < 26; i++) {
    const t = Math.floor(r()*2);
    if (t === 0) {
      const a = parseFloat((Math.floor(r()*99)/10).toFixed(1));
      const b = parseFloat((Math.floor(r()*99)/10).toFixed(1));
      out.push({id:`samp-dec-${i}`,question:`${a} + ${b} =`,answer:String(parseFloat((a+b).toFixed(2)))});
    } else {
      const base = [10,20,25,50,100][Math.floor(r()*5)];
      const pct = [10,20,25,50][Math.floor(r()*4)];
      out.push({id:`samp-dec-${i}`,question:`What is ${pct}% of ${base}?`,answer:String((base*pct)/100)});
    }
  }
  return out;
}

function ratioProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  const warmups = [
    {question:"2:4 = 1:___",answer:"2"},
    {question:"3:6 = 1:___",answer:"2"},
    {question:"A car travels 60 km/h. Distance in 2 hours?",answer:"120 km"},
    {question:"4 apples cost $2. Cost per apple?",answer:"$0.50"},
  ];
  out.push(...warmups.map((p,i)=>({...p,id:`samp-rat-warm-${i}`})));
  for (let i = 0; i < 26; i++) {
    const a=Math.floor(r()*8)+1, b=Math.floor(r()*8)+1, m=Math.floor(r()*4)+2;
    out.push({id:`samp-rat-${i}`,question:`${a}:${b} = ${a*m}:___`,answer:String(b*m)});
  }
  return out;
}

function preAlgebraProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  const warmups = [
    {question:"Solve: x + 3 = 7",answer:"4"},
    {question:"Solve: x − 5 = 2",answer:"7"},
    {question:"Solve: 2x = 10",answer:"5"},
    {question:"Solve: x + 8 = 15",answer:"7"},
  ];
  out.push(...warmups.map((p,i)=>({...p,id:`samp-alg-warm-${i}`})));
  for (let i = 0; i < 26; i++) {
    const x=Math.floor(r()*15)+2, a=Math.floor(r()*10)+2;
    const t=Math.floor(r()*3);
    if (t===0) out.push({id:`samp-alg-${i}`,question:`Solve: x + ${a} = ${x+a}`,answer:String(x)});
    else if (t===1) out.push({id:`samp-alg-${i}`,question:`Solve: x − ${a} = ${Math.max(1,x-a)}`,answer:String(x)});
    else out.push({id:`samp-alg-${i}`,question:`Solve: ${a}x = ${a*x}`,answer:String(x)});
  }
  return out;
}

function linearProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  const warmups = [
    {question:"What is the slope of y = 2x + 3?",answer:"2"},
    {question:"What is the y-intercept of y = 3x + 5?",answer:"5"},
    {question:"For y = 2x + 1, find y when x = 3.",answer:"7"},
    {question:"What is the slope of y = −4x + 2?",answer:"−4"},
  ];
  out.push(...warmups.map((p,i)=>({...p,id:`samp-lin-warm-${i}`})));
  for (let i = 0; i < 26; i++) {
    const m=(Math.floor(r()*10)-5)||1, b=(Math.floor(r()*10)-5), x=Math.floor(r()*5)+1;
    const t=Math.floor(r()*3);
    if (t===0) out.push({id:`samp-lin-${i}`,question:`What is the slope of y = ${m}x + ${b}?`,answer:String(m)});
    else if (t===1) out.push({id:`samp-lin-${i}`,question:`What is the y-intercept of y = ${m}x + ${b}?`,answer:String(b)});
    else out.push({id:`samp-lin-${i}`,question:`For y = ${m}x + ${b}, find y when x = ${x}.`,answer:String(m*x+b)});
  }
  return out;
}

function polynomialProblems(seed: number): SheetProblem[] {
  const r = rng(seed); const out: SheetProblem[] = [];
  const warmups = [
    {question:"Add: (2x + 3) + (4x + 1)",answer:"6x + 4"},
    {question:"Add: (3x + 2) + (x + 5)",answer:"4x + 7"},
    {question:"Factor out GCF: 4x + 8",answer:"4(x + 2)"},
    {question:"Factor out GCF: 6x + 9",answer:"3(2x + 3)"},
  ];
  out.push(...warmups.map((p,i)=>({...p,id:`samp-poly-warm-${i}`})));
  for (let i = 0; i < 26; i++) {
    const a=Math.floor(r()*5)+1,b=Math.floor(r()*8)+1,c=Math.floor(r()*5)+1,d=Math.floor(r()*8)+1;
    const sc=a+c,sd=b+d;
    const sdStr = sd>=0?`+ ${sd}`:` − ${Math.abs(sd)}`;
    out.push({id:`samp-poly-${i}`,question:`Add: (${a}x + ${b}) + (${c}x + ${d})`,answer:`${sc}x ${sdStr}`});
  }
  return out;
}
