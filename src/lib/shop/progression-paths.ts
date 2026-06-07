// src/lib/shop/progression-paths.ts
// Curriculum State Machine.
// Progression is defined here. The generator only fills in examples.
// Each stage has: concept, allowedForms, questionCount.
// ONE new cognitive demand per stage. Never two.

export type QuestionForm =
  | "a+b"           // standard addition
  | "a-b"           // standard subtraction
  | "a+1"           // add 1 specifically
  | "a+2"           // add 2 specifically
  | "a+3"           // add 3 specifically
  | "box+b=c"       // missing addend: □ + b = c
  | "a+box=c"       // missing addend: a + □ = c
  | "a+b+1"         // three addends with 1
  | "identify-frac" // identify fraction from context
  | "simplify-frac" // simplify fraction
  | "add-same-frac" // add same denominator
  | "add-unlike-frac" // add unlike denominators
  | "mul-frac"      // multiply fractions
  | "div-frac";     // divide fractions

export interface Stage {
  concept: string;        // what the student is learning
  forms: QuestionForm[];  // which question forms are allowed
  count: number;          // number of questions in this stage
  // Numeric constraints for this stage
  minA?: number;
  maxA?: number;
  minB?: number;
  maxB?: number;
  carry?: boolean;
  borrow?: boolean;
  denominator?: number;       // fixed denominator
  maxDenominator?: number;    // max denominator for mixed
  denominators?: number[];    // explicit list of allowed denominators
}

export interface SheetSpec {
  title: string;           // e.g. "Adding within 5 — Add 1 facts"
  microSkill: string;      // e.g. "add-1-facts"
  stages: Stage[];
}

// ── ADDITION ──────────────────────────────────────────────────────────────────

function additionSpec(sheet: number): SheetSpec {

  // Sheets 1-3: Add 1 facts only
  if (sheet <= 3) return {
    title: "Adding within 5 — Add 1",
    microSkill: "add-1",
    stages: [
      { concept: "Add 1 to small numbers", forms: ["a+1"], count: 10, minA: 1, maxA: 4 },
      { concept: "Add 1 — slightly larger", forms: ["a+1"], count: 10, minA: 2, maxA: 5 },
      { concept: "Add 1 — mixed", forms: ["a+1"], count: 6, minA: 1, maxA: 5 },
      { concept: "Add 1 — fluency", forms: ["a+1"], count: 4, minA: 1, maxA: 5 },
    ],
  };

  // Sheets 4-6: Add 2 facts
  if (sheet <= 6) return {
    title: "Adding within 5 — Add 2",
    microSkill: "add-2",
    stages: [
      { concept: "Add 2 to small numbers", forms: ["a+2"], count: 8, minA: 1, maxA: 3 },
      { concept: "Add 2 — slightly larger", forms: ["a+2"], count: 8, minA: 2, maxA: 5 },
      { concept: "Mix add 1 and add 2", forms: ["a+1","a+2"], count: 8, minA: 1, maxA: 4 },
      { concept: "Fluency check", forms: ["a+1","a+2"], count: 6, minA: 1, maxA: 5 },
    ],
  };

  // Sheets 7-9: All facts within 10 — single addend groups
  if (sheet <= 9) return {
    title: "Addition within 10 — Adding 1 through 5",
    microSkill: "add-within-10-part1",
    stages: [
      { concept: "Add 1", forms: ["a+b"], count: 5, minA: 1, maxA: 9, minB: 1, maxB: 1 },
      { concept: "Add 2", forms: ["a+b"], count: 5, minA: 1, maxA: 8, minB: 2, maxB: 2 },
      { concept: "Add 3", forms: ["a+b"], count: 5, minA: 1, maxA: 7, minB: 3, maxB: 3 },
      { concept: "Add 4", forms: ["a+b"], count: 5, minA: 1, maxA: 6, minB: 4, maxB: 4 },
      { concept: "Add 5", forms: ["a+b"], count: 5, minA: 1, maxA: 5, minB: 5, maxB: 5 },
      { concept: "Mixed add 1-5", forms: ["a+b"], count: 5, minA: 1, maxA: 9, minB: 1, maxB: 5 },
    ],
  };

  // Sheets 10-12: All facts within 10 — larger addends
  if (sheet <= 12) return {
    title: "Addition within 10 — Adding 6 through 9",
    microSkill: "add-within-10-part2",
    stages: [
      { concept: "Add 1", forms: ["a+b"], count: 5, minA: 1, maxA: 9, minB: 1, maxB: 1 },
      { concept: "Add 2 and 3", forms: ["a+b"], count: 5, minA: 1, maxA: 8, minB: 2, maxB: 3 },
      { concept: "Add 4 and 5", forms: ["a+b"], count: 5, minA: 1, maxA: 6, minB: 4, maxB: 5 },
      { concept: "Add 6 and 7", forms: ["a+b"], count: 5, minA: 1, maxA: 4, minB: 6, maxB: 7 },
      { concept: "All single digit facts", forms: ["a+b"], count: 5, minA: 1, maxA: 9, minB: 1, maxB: 9 },
      { concept: "Fluency — all facts within 18", forms: ["a+b"], count: 5, minA: 1, maxA: 9, minB: 1, maxB: 9 },
    ],
  };

  // Sheets 13-15: Teen + single digit
  if (sheet <= 15) return {
    title: "Adding with teen numbers",
    microSkill: "teen-plus-single",
    stages: [
      { concept: "10 + single digit", forms: ["a+b"], count: 6, minA: 10, maxA: 10, minB: 1, maxB: 9 },
      { concept: "11-12 + small number", forms: ["a+b"], count: 5, minA: 11, maxA: 12, minB: 1, maxB: 6 },
      { concept: "13-15 + small number", forms: ["a+b"], count: 5, minA: 13, maxA: 15, minB: 1, maxB: 6 },
      { concept: "16-19 + small number", forms: ["a+b"], count: 5, minA: 16, maxA: 19, minB: 1, maxB: 9 },
      { concept: "Mixed teen + single", forms: ["a+b"], count: 9, minA: 10, maxA: 19, minB: 1, maxB: 9 },
    ],
  };

  // Sheets 16-20: Doubles and near-doubles
  if (sheet <= 20) return {
    title: "Doubles and near-doubles",
    microSkill: "doubles",
    stages: [
      { concept: "Doubles 1-5", forms: ["a+b"], count: 5, minA: 1, maxA: 5, minB: 1, maxB: 5 },
      { concept: "Doubles 6-10", forms: ["a+b"], count: 5, minA: 6, maxA: 10, minB: 6, maxB: 10 },
      { concept: "Near doubles (+1)", forms: ["a+b"], count: 5, minA: 1, maxA: 9, minB: 2, maxB: 2 },
      { concept: "Near doubles (mixed)", forms: ["a+b"], count: 5, minA: 3, maxA: 12, minB: 1, maxB: 3 },
      { concept: "Mixed doubles practice", forms: ["a+b"], count: 10, minA: 1, maxA: 9, minB: 1, maxB: 9 },
    ],
  };

  // Sheets 21-30: 2-digit + 1-digit, ones add to <10 (no carry)
  if (sheet <= 30) {
    const t = (sheet-21)/9;
    const maxTens = Math.round(1 + t*4); // tens digit 1→5
    return {
      title: `2-digit + 1-digit (no regrouping)`,
      microSkill: "2d-1d-no-carry",
      stages: [
        { concept: "Tens + ones: ones digit is 0", forms: ["a+b"], count: 5, minA: 10, maxA: maxTens*10, minB: 1, maxB: 1, carry: false },
        { concept: "Add 1 to 2-digit", forms: ["a+b"], count: 5, minA: 10, maxA: maxTens*10+9, minB: 1, maxB: 1, carry: false },
        { concept: "Add 2-3 to 2-digit", forms: ["a+b"], count: 5, minA: 10, maxA: maxTens*10+6, minB: 2, maxB: 3, carry: false },
        { concept: "Add 4-6 to 2-digit", forms: ["a+b"], count: 5, minA: 10, maxA: maxTens*10+3, minB: 4, maxB: 6, carry: false },
        { concept: "Mixed no carry", forms: ["a+b"], count: 10, minA: 10, maxA: (maxTens+1)*10, minB: 1, maxB: 9, carry: false },
      ],
    };
  }

  // Sheets 31-45: 2-digit + 2-digit no carry — ONE tens dimension changes at a time
  if (sheet <= 45) {
    const t = (sheet-31)/14;
    const maxVal = Math.round(19 + t*30); // 19→49
    return {
      title: `2-digit addition — no regrouping`,
      microSkill: "2d-2d-no-carry",
      stages: [
        { concept: "Tens 1: 10-14 + 10-14", forms: ["a+b"], count: 5, minA: 10, maxA: 14, minB: 10, maxB: 14, carry: false },
        { concept: "Tens 1-2: include 15-19", forms: ["a+b"], count: 5, minA: 10, maxA: 19, minB: 10, maxB: 14, carry: false },
        { concept: "Tens 2: 20s + 10s", forms: ["a+b"], count: 5, minA: 20, maxA: Math.min(29,maxVal), minB: 10, maxB: 19, carry: false },
        { concept: "Tens 2-3: 20-30s range", forms: ["a+b"], count: 5, minA: 20, maxA: Math.min(34,maxVal), minB: 10, maxB: maxVal, carry: false },
        { concept: "Mixed no carry 2-digit", forms: ["a+b"], count: 10, minA: 10, maxA: maxVal, minB: 10, maxB: maxVal, carry: false },
      ],
    };
  }

  // Sheets 46-65: 2-digit + 2-digit WITH carry
  if (sheet <= 65) {
    const t = (sheet-46)/19;
    const maxVal = Math.round(29 + t*20);
    return {
      title: `2-digit addition — with regrouping`,
      microSkill: "2d-2d-carry",
      stages: [
        { concept: "Ones sum to 10 exactly", forms: ["a+b"], count: 5, minA: 11, maxA: 19, minB: 11, maxB: 19, carry: true },
        { concept: "Ones sum 11-13", forms: ["a+b"], count: 5, minA: 14, maxA: 24, minB: 17, maxB: 19, carry: true },
        { concept: "Ones sum 14-16", forms: ["a+b"], count: 5, minA: 16, maxA: maxVal, minB: 18, maxB: maxVal, carry: true },
        { concept: "Mixed carry — medium", forms: ["a+b"], count: 5, minA: 15, maxA: maxVal, minB: 15, maxB: maxVal, carry: true },
        { concept: "Mixed carry — full range", forms: ["a+b"], count: 10, minA: 11, maxA: maxVal+10, minB: 11, maxB: maxVal, carry: true },
      ],
    };
  }

  // Sheets 66-80: 3-digit, no carry
  if (sheet <= 80) {
    const t = (sheet-66)/14;
    const maxVal = Math.round(199 + t*100);
    return {
      title: `3-digit addition — no regrouping`,
      microSkill: "3d-no-carry",
      stages: [
        { concept: "100s + 100s (no carry)", forms: ["a+b"], count: 6, minA: 100, maxA: 199, minB: 100, maxB: 199, carry: false },
        { concept: "100s + 200s", forms: ["a+b"], count: 5, minA: 100, maxA: 249, minB: 100, maxB: 249, carry: false },
        { concept: "Introduce 300s", forms: ["a+b"], count: 5, minA: 100, maxA: 299, minB: 100, maxB: maxVal, carry: false },
        { concept: "Mixed 3-digit no carry", forms: ["a+b"], count: 7, minA: 100, maxA: maxVal, minB: 100, maxB: maxVal, carry: false },
        { concept: "Fluency 3-digit", forms: ["a+b"], count: 7, minA: 150, maxA: maxVal, minB: 100, maxB: maxVal, carry: false },
      ],
    };
  }

  // Sheets 81-100: 3-digit WITH carry
  const t = (sheet-81)/19;
  const maxVal = Math.round(299 + t*200);
  return {
    title: `3-digit addition — with regrouping`,
    microSkill: "3d-carry",
    stages: [
      { concept: "Carry ones only", forms: ["a+b"], count: 6, minA: 115, maxA: 199, minB: 115, maxB: 199, carry: true },
      { concept: "Carry tens only", forms: ["a+b"], count: 5, minA: 150, maxA: 249, minB: 150, maxB: 249, carry: true },
      { concept: "Carry ones and tens", forms: ["a+b"], count: 5, minA: 175, maxA: maxVal, minB: 175, maxB: maxVal, carry: true },
      { concept: "Mixed 3-digit carry", forms: ["a+b"], count: 7, minA: 150, maxA: maxVal, minB: 150, maxB: maxVal, carry: true },
      { concept: "Mastery 3-digit", forms: ["a+b"], count: 7, minA: 200, maxA: maxVal, minB: 200, maxB: maxVal, carry: true },
    ],
  };
}

// ── FRACTIONS ─────────────────────────────────────────────────────────────────

function fractionsSpec(sheet: number): SheetSpec {

  // Sheets 1-2: Halves only
  if (sheet <= 2) return {
    title: "Identifying fractions — Halves",
    microSkill: "identify-halves",
    stages: [
      { concept: "Recognize 1/2", forms: ["identify-frac"], count: 10, denominator: 2 },
      { concept: "1 out of 2 — varied contexts", forms: ["identify-frac"], count: 10, denominator: 2 },
      { concept: "Halves fluency", forms: ["identify-frac"], count: 10, denominator: 2 },
    ],
  };

  // Sheets 3-4: Thirds only
  if (sheet <= 4) return {
    title: "Identifying fractions — Thirds",
    microSkill: "identify-thirds",
    stages: [
      { concept: "Recognize 1/3", forms: ["identify-frac"], count: 6, denominator: 3 },
      { concept: "Recognize 2/3", forms: ["identify-frac"], count: 6, denominator: 3 },
      { concept: "Mix 1/3 and 2/3", forms: ["identify-frac"], count: 8, denominator: 3 },
      { concept: "Halves and thirds mixed", forms: ["identify-frac"], count: 10, denominators: [2,3] },
    ],
  };

  // Sheets 5-6: Fourths
  if (sheet <= 6) return {
    title: "Identifying fractions — Fourths",
    microSkill: "identify-fourths",
    stages: [
      { concept: "Recognize 1/4", forms: ["identify-frac"], count: 6, denominator: 4 },
      { concept: "Recognize 2/4 and 3/4", forms: ["identify-frac"], count: 6, denominator: 4 },
      { concept: "Halves and fourths", forms: ["identify-frac"], count: 8, denominators: [2,4] },
      { concept: "Halves thirds fourths", forms: ["identify-frac"], count: 10, denominators: [2,3,4] },
    ],
  };

  // Sheets 7-9: Fifths and sixths
  if (sheet <= 9) return {
    title: "Identifying fractions — Fifths and sixths",
    microSkill: "identify-fifths-sixths",
    stages: [
      { concept: "Recognize fifths", forms: ["identify-frac"], count: 6, denominator: 5 },
      { concept: "Recognize sixths", forms: ["identify-frac"], count: 6, denominator: 6 },
      { concept: "Mix 2-6", forms: ["identify-frac"], count: 9, denominators: [2,3,4,5,6] },
      { concept: "Challenge — larger denominators", forms: ["identify-frac"], count: 9, denominators: [3,4,5,6,8] },
    ],
  };

  // Sheets 10: Assessment — all identifying
  if (sheet === 10) return {
    title: "Identifying fractions — Assessment",
    microSkill: "identify-assess",
    stages: [
      { concept: "Halves and thirds", forms: ["identify-frac"], count: 6, denominators: [2,3] },
      { concept: "Fourths and fifths", forms: ["identify-frac"], count: 6, denominators: [4,5] },
      { concept: "Sixths and eighths", forms: ["identify-frac"], count: 6, denominators: [6,8] },
      { concept: "Mixed all denominators", forms: ["identify-frac"], count: 12, denominators: [2,3,4,5,6,8] },
    ],
  };

  // Sheets 11-15: Mixed identifying with larger denominators
  if (sheet <= 15) return {
    title: "Identifying fractions — Mixed denominators",
    microSkill: "identify-mixed",
    stages: [
      { concept: "2 through 5", forms: ["identify-frac"], count: 6, denominators: [2,3,4,5] },
      { concept: "4 through 8", forms: ["identify-frac"], count: 6, denominators: [4,5,6,8] },
      { concept: "Mixed 2-8", forms: ["identify-frac"], count: 9, denominators: [2,3,4,5,6,8] },
      { concept: "Fluency — all", forms: ["identify-frac"], count: 9, denominators: [2,3,4,5,6,8,10] },
    ],
  };

  // Sheets 16-18: Simplify — GCF=2 only
  if (sheet <= 18) return {
    title: "Simplifying fractions — GCF of 2",
    microSkill: "simplify-gcf2",
    stages: [
      { concept: "Simplify: divide by 2", forms: ["simplify-frac"], count: 8, denominator: 4 },
      { concept: "Larger denominators div by 2", forms: ["simplify-frac"], count: 8, denominator: 8 },
      { concept: "Mix even denominators", forms: ["simplify-frac"], count: 8, denominators: [4,6,8,10] },
      { concept: "Fluency", forms: ["simplify-frac"], count: 6, denominators: [4,6,8,10,12] },
    ],
  };

  // Sheets 19-21: Simplify — GCF=3
  if (sheet <= 21) return {
    title: "Simplifying fractions — GCF of 3",
    microSkill: "simplify-gcf3",
    stages: [
      { concept: "Simplify: divide by 3", forms: ["simplify-frac"], count: 8, denominator: 9 },
      { concept: "6 and 12 denominators", forms: ["simplify-frac"], count: 8, denominators: [6,12] },
      { concept: "Mix GCF 2 and 3", forms: ["simplify-frac"], count: 8, denominators: [4,6,8,9,12] },
      { concept: "Fluency", forms: ["simplify-frac"], count: 6, denominators: [4,6,8,9,10,12] },
    ],
  };

  // Sheets 22-30: Simplify — larger GCFs
  if (sheet <= 30) {
    const t = (sheet-22)/8;
    const maxD = Math.round(10 + t*6);
    return {
      title: "Simplifying fractions — Mixed GCF",
      microSkill: "simplify-mixed",
      stages: [
        { concept: "GCF=4", forms: ["simplify-frac"], count: 6, denominator: 8 },
        { concept: "GCF=5", forms: ["simplify-frac"], count: 6, denominator: 10 },
        { concept: "Mixed large GCF", forms: ["simplify-frac"], count: 9, denominators: [8,10,12,15] },
        { concept: "Fluency", forms: ["simplify-frac"], count: 9, denominators: [6,8,9,10,12,15] },
      ],
    };
  }

  // Sheets 31-38: Add same denominator
  if (sheet <= 38) {
    const t = (sheet-31)/7;
    const d = [3,4,5,6,7,8,9,10][sheet-31] ?? 10;
    return {
      title: `Adding fractions — denominator ${d}`,
      microSkill: `add-same-d${d}`,
      stages: [
        { concept: `Add fractions with denominator ${d}`, forms: ["add-same-frac"], count: 8, denominator: d },
        { concept: `Larger numerators`, forms: ["add-same-frac"], count: 7, denominator: d },
        { concept: `Results needing simplification`, forms: ["add-same-frac"], count: 8, denominator: d },
        { concept: `Mixed same-denominator`, forms: ["add-same-frac"], count: 7, denominators: [3,4,5,d] },
      ],
    };
  }

  // Sheets 39-45: Add same denominator — mixed
  if (sheet <= 45) return {
    title: "Adding fractions — same denominator fluency",
    microSkill: "add-same-fluency",
    stages: [
      { concept: "Small denominators 3-5", forms: ["add-same-frac"], count: 8, denominators: [3,4,5] },
      { concept: "Medium denominators 6-8", forms: ["add-same-frac"], count: 7, denominators: [6,7,8] },
      { concept: "Larger denominators 9-12", forms: ["add-same-frac"], count: 8, denominators: [9,10,12] },
      { concept: "Fluency all denominators", forms: ["add-same-frac"], count: 7, denominators: [3,4,5,6,7,8,9,10,12] },
    ],
  };

  // Sheets 46-52: Add unlike — halves + thirds/fourths
  if (sheet <= 52) return {
    title: "Adding fractions — unlike denominators (easy)",
    microSkill: "add-unlike-easy",
    stages: [
      { concept: "1/2 + 1/4 family", forms: ["add-unlike-frac"], count: 7, denominators: [2,4] },
      { concept: "1/2 + 1/3 family", forms: ["add-unlike-frac"], count: 7, denominators: [2,3] },
      { concept: "1/3 + 1/6 family", forms: ["add-unlike-frac"], count: 8, denominators: [3,6] },
      { concept: "Mixed easy unlike", forms: ["add-unlike-frac"], count: 8, denominators: [2,3,4,6] },
    ],
  };

  // Sheets 53-60: Add unlike — harder
  if (sheet <= 60) return {
    title: "Adding fractions — unlike denominators",
    microSkill: "add-unlike-mixed",
    stages: [
      { concept: "Denominators 3 and 4", forms: ["add-unlike-frac"], count: 7, denominators: [3,4] },
      { concept: "Denominators 4 and 6", forms: ["add-unlike-frac"], count: 7, denominators: [4,6] },
      { concept: "Denominators 3 and 9", forms: ["add-unlike-frac"], count: 8, denominators: [3,9] },
      { concept: "Mixed unlike denominators", forms: ["add-unlike-frac"], count: 8, denominators: [3,4,5,6,8,9] },
    ],
  };

  // Sheets 61-68: Multiply — one fraction × whole number first, then fraction × fraction
  if (sheet <= 68) return {
    title: "Multiplying fractions — introduction",
    microSkill: "multiply-intro",
    stages: [
      { concept: "Halves × halves", forms: ["mul-frac"], count: 7, denominators: [2,2] },
      { concept: "Thirds × halves", forms: ["mul-frac"], count: 7, denominators: [2,3] },
      { concept: "Quarters × thirds", forms: ["mul-frac"], count: 8, denominators: [3,4] },
      { concept: "Mixed multiply", forms: ["mul-frac"], count: 8, denominators: [2,3,4,5] },
    ],
  };

  // Sheets 69-75: Multiply — larger denominators
  if (sheet <= 75) return {
    title: "Multiplying fractions — fluency",
    microSkill: "multiply-fluency",
    stages: [
      { concept: "Multiply and simplify", forms: ["mul-frac"], count: 7, denominators: [3,4,5,6] },
      { concept: "Larger denominators", forms: ["mul-frac"], count: 7, denominators: [4,5,6,8] },
      { concept: "Mixed multiply + simplify", forms: ["mul-frac"], count: 8, denominators: [3,4,5,6,8] },
      { concept: "Fluency", forms: ["mul-frac"], count: 8, denominators: [2,3,4,5,6,8] },
    ],
  };

  // Sheets 76-82: Divide — flip and multiply
  if (sheet <= 82) return {
    title: "Dividing fractions — introduction",
    microSkill: "divide-intro",
    stages: [
      { concept: "Divide by halves", forms: ["div-frac"], count: 7, denominators: [2,3] },
      { concept: "Divide by thirds", forms: ["div-frac"], count: 7, denominators: [3,4] },
      { concept: "Divide by quarters", forms: ["div-frac"], count: 8, denominators: [3,4,5] },
      { concept: "Mixed division", forms: ["div-frac"], count: 8, denominators: [2,3,4,5,6] },
    ],
  };

  // Sheets 83-88: Divide — fluency
  if (sheet <= 88) return {
    title: "Dividing fractions — fluency",
    microSkill: "divide-fluency",
    stages: [
      { concept: "Divide and simplify", forms: ["div-frac"], count: 7, denominators: [3,4,5,6] },
      { concept: "Larger denominators", forms: ["div-frac"], count: 7, denominators: [4,5,6,8] },
      { concept: "Mixed divide", forms: ["div-frac"], count: 8, denominators: [2,3,4,5,6,8] },
      { concept: "Fluency", forms: ["div-frac"], count: 8, denominators: [2,3,4,5,6,8,10] },
    ],
  };

  // Sheets 89-100: Mixed — all operations
  return {
    title: "Fractions — Mixed operations",
    microSkill: "fractions-mixed",
    stages: [
      { concept: "Add same denominator", forms: ["add-same-frac"], count: 6, denominators: [4,5,6,8] },
      { concept: "Add unlike denominators", forms: ["add-unlike-frac"], count: 6, denominators: [3,4,5,6] },
      { concept: "Multiply fractions", forms: ["mul-frac"], count: 6, denominators: [3,4,5,6] },
      { concept: "Divide fractions", forms: ["div-frac"], count: 6, denominators: [3,4,5,6] },
      { concept: "Mixed all operations", forms: ["add-same-frac","add-unlike-frac","mul-frac","div-frac"], count: 6, denominators: [2,3,4,5,6,8] },
    ],
  };
}

// ── Master resolver ───────────────────────────────────────────────────────────

export type ShopSkill = "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION" |
  "FRACTIONS" | "DECIMALS" | "RATIOS" | "PRE_ALGEBRA" | "LINEAR_EQUATIONS" | "POLYNOMIALS";

export function getSheetSpec(skill: ShopSkill, sheetNumber: number): SheetSpec {
  switch (skill) {
    case "ADDITION":  return additionSpec(sheetNumber);
    case "FRACTIONS": return fractionsSpec(sheetNumber);
    default: return {
      title: `${skill} — Sheet ${sheetNumber}`,
      microSkill: "general",
      stages: [{ concept: "Practice", forms: ["a+b"], count: 30, minA: 1, maxA: 9, minB: 1, maxB: 9 }],
    };
  }
}

// Flatten stages to 30 problem specs
export function flattenToProblems(spec: SheetSpec): Stage[] {
  const result: Stage[] = [];
  for (const stage of spec.stages) {
    for (let i = 0; i < stage.count; i++) {
      result.push(stage);
    }
  }
  while (result.length < 30) result.push(spec.stages[spec.stages.length - 1]);
  return result.slice(0, 30);
}
