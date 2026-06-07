// src/lib/shop/progression-paths.ts
// Pre-defined progression paths for each skill.
// Each path is an ordered array of 30 DifficultyVector nodes.
// Only ONE dimension changes between consecutive nodes.
// The generator follows this path exactly — no random progression.

export interface DifficultyVector {
  // Arithmetic dimensions
  maxA?: number;       // max value of first operand
  maxB?: number;       // max value of second operand  
  minA?: number;       // min value of first operand
  minB?: number;       // min value of second operand
  carry?: boolean;     // addition must carry
  borrow?: boolean;    // subtraction must borrow
  
  // Fraction dimensions
  denominator?: number;       // exact denominator to use
  maxDenominator?: number;    // max denominator
  operation?: "identify" | "simplify" | "add-same" | "add-unlike" | "multiply" | "divide";
  
  // Algebra dimensions
  terms?: number;      // number of terms
  negatives?: boolean; // include negative coefficients
  degree?: number;     // polynomial degree
  steps?: number;      // number of solution steps
  
  // Label for this node
  hint?: string;       // brief description e.g. "sums within 5"
}

// ── Sheet-level path: 30 nodes for one worksheet ──────────────────────────────
// A "sheet path" maps sheet number → array of 30 DifficultyVectors

// ── ADDITION paths ────────────────────────────────────────────────────────────

function additionPath(sheetNumber: number): DifficultyVector[] {
  // Sheet 1-6: sums within 5
  // Sheet 7-15: sums within 10
  // Sheet 16-25: single digit all combos
  // Sheet 26-40: teen + single
  // Sheet 41-60: 2-digit no carry
  // Sheet 61-75: 2-digit with carry
  // Sheet 76-90: 3-digit no carry
  // Sheet 91-100: 3-digit with carry

  if (sheetNumber <= 6) {
    // 30 problems: denominators 2→2→2→2→3→3→3→3→4→4→4→4→5→5→5→5→5→5→5→5→5→5→5→5→5→5→5→5→5→5
    // Actually for addition: a goes 1→1→1→1→2→2→2→2→2→2→2→2→2→2→2→2→3→3→3→3→3→3→3→3→3→3→3→3→3→3
    return buildPath([
      {count:3, vec:{minA:1,maxA:1,minB:1,maxB:1, hint:"1+1"}},
      {count:3, vec:{minA:1,maxA:2,minB:1,maxB:1, hint:"2+1"}},
      {count:3, vec:{minA:1,maxA:2,minB:1,maxB:2, hint:"2+2"}},
      {count:3, vec:{minA:2,maxA:3,minB:1,maxB:2, hint:"3+2"}},
      {count:3, vec:{minA:2,maxA:3,minB:1,maxB:3, hint:"3+3"}},
      {count:3, vec:{minA:1,maxA:4,minB:1,maxB:1, hint:"4+1"}},
      {count:3, vec:{minA:1,maxA:4,minB:1,maxB:3, hint:"4+3"}},
      {count:3, vec:{minA:2,maxA:4,minB:1,maxB:4, hint:"4+4"}},
      {count:6, vec:{minA:1,maxA:5,minB:1,maxB:5, hint:"sums≤10"}},
    ]);
  }
  if (sheetNumber <= 15) {
    return buildPath([
      {count:4, vec:{minA:1,maxA:4,minB:1,maxB:4, hint:"sums≤8"}},
      {count:4, vec:{minA:2,maxA:5,minB:1,maxB:4, hint:"sums≤9"}},
      {count:4, vec:{minA:3,maxA:6,minB:1,maxB:4, hint:"sums≤9"}},
      {count:4, vec:{minA:1,maxA:7,minB:1,maxB:3, hint:"sums≤9"}},
      {count:4, vec:{minA:4,maxA:8,minB:1,maxB:5, hint:"sums≤9"}},
      {count:5, vec:{minA:2,maxA:9,minB:1,maxB:7, hint:"sums≤9"}},
      {count:5, vec:{minA:1,maxA:9,minB:1,maxB:9, hint:"sums≤18"}},
    ]);
  }
  if (sheetNumber <= 25) {
    // All single digit combos, micro-progresssion through pairs
    const pairs: [number,number][] = [];
    for (let a=1;a<=9;a++) for(let b=1;b<=9;b++) pairs.push([a,b]);
    // Sort by sum, then by a
    pairs.sort((x,y)=>x[0]+x[1]-y[0]-y[1]||x[0]-y[0]);
    // Pick 30 evenly spaced
    const step = Math.floor(pairs.length/30);
    const t = Math.floor((sheetNumber-16)/(25-16)*10);
    return pairs.slice(t*3, t*3+30).map(([a,b])=>({minA:a,maxA:a,minB:b,maxB:b,hint:`${a}+${b}`}));
  }
  if (sheetNumber <= 40) {
    // Teen + single digit
    const t = (sheetNumber-26)/(40-26);
    const maxTeen = Math.round(10 + t*9); // 10→19
    const maxSingle = Math.round(1 + t*8); // 1→9
    return buildPath([
      {count:5, vec:{minA:10,maxA:10,minB:1,maxB:3,hint:"10+small"}},
      {count:5, vec:{minA:10,maxA:12,minB:1,maxB:5,hint:"11-12+single"}},
      {count:5, vec:{minA:11,maxA:14,minB:1,maxB:6,hint:"13-14+single"}},
      {count:5, vec:{minA:13,maxA:16,minB:1,maxB:7,hint:"15-16+single"}},
      {count:5, vec:{minA:15,maxA:18,minB:1,maxB:8,hint:"17-18+single"}},
      {count:5, vec:{minA:10,maxA:maxTeen,minB:1,maxB:maxSingle,hint:"teen+single"}},
    ]);
  }
  if (sheetNumber <= 60) {
    // 2-digit + 2-digit, no carry — ones must sum < 10
    const t = (sheetNumber-41)/(60-41);
    const maxVal = Math.round(20 + t*29); // 20→49
    return buildPath([
      {count:5, vec:{minA:10,maxA:19,minB:10,maxB:19,carry:false,hint:"10-19+10-19"}},
      {count:5, vec:{minA:10,maxA:24,minB:10,maxB:24,carry:false,hint:"20s range"}},
      {count:5, vec:{minA:10,maxA:29,minB:10,maxB:29,carry:false,hint:"expand to 30s"}},
      {count:5, vec:{minA:10,maxA:34,minB:10,maxB:34,carry:false,hint:"expand to 40s"}},
      {count:5, vec:{minA:10,maxA:maxVal,minB:10,maxB:maxVal,carry:false,hint:"full 2-digit no carry"}},
      {count:5, vec:{minA:10,maxA:maxVal,minB:10,maxB:maxVal,carry:false,hint:"consolidate"}},
    ]);
  }
  if (sheetNumber <= 75) {
    // 2-digit + 2-digit WITH carry
    const t = (sheetNumber-61)/(75-61);
    const maxVal = Math.round(29 + t*20);
    return buildPath([
      {count:5, vec:{minA:15,maxA:19,minB:15,maxB:19,carry:true,hint:"carry ones"}},
      {count:5, vec:{minA:18,maxA:24,minB:18,maxB:24,carry:true,hint:"carry from 20s"}},
      {count:5, vec:{minA:20,maxA:29,minB:18,maxB:29,carry:true,hint:"carry mid-range"}},
      {count:5, vec:{minA:25,maxA:39,minB:19,maxB:39,carry:true,hint:"carry larger"}},
      {count:5, vec:{minA:19,maxA:maxVal,minB:19,maxB:maxVal,carry:true,hint:"full carry"}},
      {count:5, vec:{minA:15,maxA:maxVal,minB:15,maxB:maxVal,carry:true,hint:"consolidate carry"}},
    ]);
  }
  if (sheetNumber <= 90) {
    // 3-digit, no carry
    const t = (sheetNumber-76)/(90-76);
    const maxVal = Math.round(200 + t*199);
    return buildPath([
      {count:5, vec:{minA:100,maxA:199,minB:100,maxB:199,carry:false,hint:"100s no carry"}},
      {count:5, vec:{minA:100,maxA:249,minB:100,maxB:249,carry:false,hint:"expand 3-digit"}},
      {count:5, vec:{minA:100,maxA:299,minB:100,maxB:299,carry:false,hint:"300 range"}},
      {count:5, vec:{minA:100,maxA:maxVal,minB:100,maxB:maxVal,carry:false,hint:"3-digit no carry"}},
      {count:5, vec:{minA:100,maxA:maxVal,minB:100,maxB:maxVal,carry:false,hint:"consolidate"}},
      {count:5, vec:{minA:150,maxA:maxVal,minB:100,maxB:maxVal,carry:false,hint:"larger 3-digit"}},
    ]);
  }
  // Sheets 91-100: 3-digit with carry
  const t = (sheetNumber-91)/(100-91);
  const maxVal = Math.round(299 + t*200);
  return buildPath([
    {count:5, vec:{minA:150,maxA:299,minB:150,maxB:299,carry:true,hint:"3-digit carry ones"}},
    {count:5, vec:{minA:200,maxA:349,minB:150,maxB:299,carry:true,hint:"carry tens too"}},
    {count:5, vec:{minA:200,maxA:maxVal,minB:150,maxB:maxVal,carry:true,hint:"full 3-digit carry"}},
    {count:5, vec:{minA:150,maxA:maxVal,minB:150,maxB:maxVal,carry:true,hint:"consolidate"}},
    {count:5, vec:{minA:200,maxA:maxVal,minB:200,maxB:maxVal,carry:true,hint:"mastery"}},
    {count:5, vec:{minA:250,maxA:maxVal,minB:200,maxB:maxVal,carry:true,hint:"mastery challenge"}},
  ]);
}

// ── FRACTIONS paths ───────────────────────────────────────────────────────────

function fractionsPath(sheetNumber: number): DifficultyVector[] {
  // Sheet 1-15: Identifying — denominator grows 2→3→4→5→6→8
  if (sheetNumber <= 15) {
    const t = (sheetNumber-1)/14;
    const maxD = Math.round(2 + t*6); // 2→8
    return buildPath([
      {count:6, vec:{denominator:2, operation:"identify", hint:"halves"}},
      {count:6, vec:{denominator:3, operation:"identify", hint:"thirds"}},
      {count:6, vec:{denominator:4, operation:"identify", hint:"quarters"}},
      {count:6, vec:{maxDenominator:maxD, operation:"identify", hint:"mixed denominators"}},
      {count:6, vec:{maxDenominator:Math.min(maxD+2,8), operation:"identify", hint:"larger denominators"}},
    ]);
  }

  // Sheet 16-30: Simplifying — GCF grows in complexity
  if (sheetNumber <= 30) {
    const t = (sheetNumber-16)/14;
    return buildPath([
      {count:6, vec:{denominator:4, operation:"simplify", hint:"simplify /4"}},
      {count:6, vec:{denominator:6, operation:"simplify", hint:"simplify /6"}},
      {count:6, vec:{denominator:8, operation:"simplify", hint:"simplify /8"}},
      {count:6, vec:{denominator:10, operation:"simplify", hint:"simplify /10"}},
      {count:6, vec:{maxDenominator:Math.round(10+t*6), operation:"simplify", hint:"mixed simplify"}},
    ]);
  }

  // Sheet 31-45: Adding same denominator
  if (sheetNumber <= 45) {
    const t = (sheetNumber-31)/14;
    const maxD = Math.round(4 + t*8);
    return buildPath([
      {count:6, vec:{denominator:3, operation:"add-same", hint:"+same d=3"}},
      {count:6, vec:{denominator:4, operation:"add-same", hint:"+same d=4"}},
      {count:6, vec:{denominator:5, operation:"add-same", hint:"+same d=5"}},
      {count:6, vec:{denominator:7, operation:"add-same", hint:"+same d=7"}},
      {count:6, vec:{maxDenominator:maxD, operation:"add-same", hint:"+same mixed"}},
    ]);
  }

  // Sheet 46-60: Adding unlike denominators
  if (sheetNumber <= 60) {
    const t = (sheetNumber-46)/14;
    return buildPath([
      {count:6, vec:{denominator:2, maxDenominator:4, operation:"add-unlike", hint:"halves+quarters"}},
      {count:6, vec:{denominator:2, maxDenominator:6, operation:"add-unlike", hint:"+sixths"}},
      {count:6, vec:{denominator:3, maxDenominator:6, operation:"add-unlike", hint:"thirds+sixths"}},
      {count:6, vec:{denominator:3, maxDenominator:9, operation:"add-unlike", hint:"+ninths"}},
      {count:6, vec:{maxDenominator:Math.round(6+t*6), operation:"add-unlike", hint:"mixed unlike"}},
    ]);
  }

  // Sheet 61-75: Multiplying
  if (sheetNumber <= 75) {
    const t = (sheetNumber-61)/14;
    const maxD = Math.round(4 + t*6);
    return buildPath([
      {count:6, vec:{denominator:2, operation:"multiply", hint:"x halves"}},
      {count:6, vec:{denominator:3, operation:"multiply", hint:"x thirds"}},
      {count:6, vec:{denominator:4, operation:"multiply", hint:"x quarters"}},
      {count:6, vec:{maxDenominator:maxD, operation:"multiply", hint:"x mixed"}},
      {count:6, vec:{maxDenominator:maxD+2, operation:"multiply", hint:"x larger"}},
    ]);
  }

  // Sheet 76-88: Dividing
  if (sheetNumber <= 88) {
    const t = (sheetNumber-76)/12;
    const maxD = Math.round(4 + t*6);
    return buildPath([
      {count:6, vec:{denominator:2, operation:"divide", hint:"/ halves"}},
      {count:6, vec:{denominator:3, operation:"divide", hint:"/ thirds"}},
      {count:6, vec:{denominator:4, operation:"divide", hint:"/ quarters"}},
      {count:6, vec:{maxDenominator:maxD, operation:"divide", hint:"/ mixed"}},
      {count:6, vec:{maxDenominator:maxD+2, operation:"divide", hint:"/ larger"}},
    ]);
  }

  // Sheet 89-100: Mixed numbers
  const t = (sheetNumber-89)/11;
  return buildPath([
    {count:6, vec:{denominator:2, operation:"add-unlike", hint:"mixed number basics"}},
    {count:6, vec:{denominator:3, operation:"add-unlike", hint:"mixed +"}},
    {count:6, vec:{denominator:4, operation:"multiply", hint:"mixed x"}},
    {count:6, vec:{denominator:4, operation:"divide", hint:"mixed /"}},
    {count:6, vec:{maxDenominator:Math.round(4+t*4), operation:"divide", hint:"mixed challenge"}},
  ]);
}

// ── Helper: expand stage specs to 30 individual nodes ────────────────────────

interface Stage { count: number; vec: DifficultyVector; }

function buildPath(stages: Stage[]): DifficultyVector[] {
  const path: DifficultyVector[] = [];
  for (const stage of stages) {
    for (let i = 0; i < stage.count; i++) {
      path.push({ ...stage.vec });
    }
  }
  // Trim or pad to exactly 30
  while (path.length < 30) path.push(path[path.length-1] ?? {});
  return path.slice(0, 30);
}

// ── Master resolver ───────────────────────────────────────────────────────────

export type ShopSkill = "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION" |
  "FRACTIONS" | "DECIMALS" | "RATIOS" | "PRE_ALGEBRA" | "LINEAR_EQUATIONS" | "POLYNOMIALS";

export function getProgressionPath(skill: ShopSkill, sheetNumber: number): DifficultyVector[] {
  switch (skill) {
    case "ADDITION":   return additionPath(sheetNumber);
    case "FRACTIONS":  return fractionsPath(sheetNumber);
    // Other skills fall back to difficulty-curve based approach for now
    default:           return buildPath([{count:30, vec:{minA:1,maxA:9,minB:1,maxB:9}}]);
  }
}
