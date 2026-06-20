// src/lib/shop/curriculum-graph.ts
// Complete curriculum graph for all 18 math levels.
// This is the single source of truth.
// Progression is defined here. Questions are generated from this plan.
// 
// Structure:
//   Level → MicroSkill → 5 Stages → Question constraints
//
// Rules enforced by this file:
//   1. Each stage introduces exactly ONE new cognitive demand
//   2. Stage 5 (Mastery) uses same skill, different representations only
//   3. Difficulty dimensions are explicit — generator never invents progression

export type StageType = "introduction" | "guided" | "fluency" | "independent" | "mastery";

export interface DifficultyDimension {
  name: string;
  value: number | string | boolean;
}

export interface Stage {
  type: StageType;
  label: string;
  problemCount: number;             // problems in this stage (total 30 per sheet)
  cognitiveChange: string;          // what NEW demand is introduced
  keepsSame: string;                // what stays constant
  dimensions: DifficultyDimension[];
  questionForms: string[];          // allowed question forms
  constraints: {
    minA?: number; maxA?: number;
    minB?: number; maxB?: number;
    fixedB?: number;                // b is always this value
    carry?: boolean;
    borrow?: boolean;
    denominator?: number;
    denominators?: number[];
    maxDenominator?: number;
    operation?: string;
    representation?: string[];      // "equation" | "word" | "missing-addend" | "visual"
  };
}

export interface MicroSkill {
  id: string;
  levelCode: string;               // M1-M18
  skill: string;                   // e.g. "ADDITION"
  name: string;                    // e.g. "Add 1 facts"
  learningObjective: string;       // "Student understands that..."
  gradeLevel: string;
  difficultyStars: number;         // 1-5
  sheetRange: [number, number];    // which sheets use this micro-skill
  isReview: boolean;
  reviewOf?: string[];             // which micro-skill IDs this reviews
  stages: Stage[];                 // exactly 5 stages
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — build 5-stage scaffold
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_DEFS: Array<{ type: Stage["type"]; label: string }> = [
  { type:"introduction", label:"Foundation" },
  { type:"guided",       label:"Building Fluency" },
  { type:"fluency",      label:"Guided Fluency" },
  { type:"independent",  label:"Independent Practice" },
  { type:"mastery",      label:"Mastery Challenge" },
  { type:"mastery",      label:"Mastery — Extended" },
];

function stages(...args: Array<Omit<Stage, "type"|"label">>): Stage[] {
  return args.map((s, i) => ({
    ...STAGE_DEFS[Math.min(i, STAGE_DEFS.length - 1)],
    ...s,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// M3 — ADDITION
// ─────────────────────────────────────────────────────────────────────────────

const additionMicroSkills: MicroSkill[] = [

  {
    id: "add-1",
    levelCode: "M3", skill: "ADDITION",
    name: "Add 1 facts",
    learningObjective: "Student understands that adding 1 produces the next counting number.",
    gradeLevel: "Grade K", difficultyStars: 1, sheetRange: [1,2], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Add 1 to very small numbers 1-3. Pattern: each answer is the next number.", keepsSame:"b=1 always. a starts small.", dimensions:[{name:"a_range",value:"1-3"},{name:"b",value:1}], questionForms:["a+b"], constraints:{minA:1,maxA:3,fixedB:1} },
      { problemCount:6, cognitiveChange:"Range expands to 1-6. Students apply pattern to slightly larger numbers.", keepsSame:"b=1 always. Same +1 pattern.", dimensions:[{name:"a_range",value:"1-6"},{name:"b",value:1}], questionForms:["a+b"], constraints:{minA:4,maxA:6,fixedB:1} },
      { problemCount:6, cognitiveChange:"Full range 1-9 in random order. Fluency — student retrieves without counting.", keepsSame:"b=1 always. Random order now.", dimensions:[{name:"a_range",value:"1-9"},{name:"order",value:"random"}], questionForms:["a+b"], constraints:{minA:1,maxA:9,fixedB:1} },
      { problemCount:6, cognitiveChange:"Missing addend: ___+1=c. New cognitive demand — reverse thinking.", keepsSame:"b=1 always. Same sums.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a"], constraints:{minA:1,maxA:9,fixedB:1} },
      { problemCount:6, cognitiveChange:"Mixed: standard equation AND missing addend. Student chooses strategy.", keepsSame:"b=1 always. All within 1-9+1.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a+b","missing-addend-a"], constraints:{minA:1,maxA:9,fixedB:1} }
    )
  },

  {
    id: "add-2",
    levelCode: "M3", skill: "ADDITION",
    name: "Add 2 facts",
    learningObjective: "Student understands that adding 2 skips one counting number.",
    gradeLevel: "Grade K-1", difficultyStars: 1, sheetRange: [3,4], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Adding 2 to numbers 1-4. New skip concept introduced.", keepsSame:"b is always 2.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:2}], questionForms:["a+b"], constraints:{minA:1,maxA:4,fixedB:2} },
      { problemCount:6, cognitiveChange:"Range extends to 1-7.", keepsSame:"b is always 2.", dimensions:[{name:"a_range",value:"1-7"},{name:"b",value:2}], questionForms:["a+b"], constraints:{minA:1,maxA:7,fixedB:2} },
      { problemCount:6, cognitiveChange:"Mix +1 and +2. Student must distinguish which skip applies.", keepsSame:"Both b values are 1 or 2 only.", dimensions:[{name:"b_range",value:"1 or 2"}], questionForms:["a+b"], constraints:{minA:1,maxA:8,minB:1,maxB:2} },
      { problemCount:6, cognitiveChange:"Missing addend for +2: ___+2=c and a+___=c.", keepsSame:"b is always 2.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a","missing-addend-b"], constraints:{minA:1,maxA:8,fixedB:2} },
      { problemCount:6, cognitiveChange:"Mixed +1/+2 with missing addend forms.", keepsSame:"b is 1 or 2.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a+b","missing-addend-a","missing-addend-b"], constraints:{minA:1,maxA:8,minB:1,maxB:2} }
    )
  },

  {
    id: "add-3",
    levelCode: "M3", skill: "ADDITION",
    name: "Add 3 facts",
    learningObjective: "Student can add 3 using count-on strategy.",
    gradeLevel: "Grade K-1", difficultyStars: 1, sheetRange: [5,6], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Adding 3, a starts at 1-4.", keepsSame:"b is always 3.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:3}], questionForms:["a+b"], constraints:{minA:1,maxA:4,fixedB:3} },
      { problemCount:6, cognitiveChange:"a extends to 1-6.", keepsSame:"b is always 3.", dimensions:[{name:"a_range",value:"1-6"},{name:"b",value:3}], questionForms:["a+b"], constraints:{minA:1,maxA:6,fixedB:3} },
      { problemCount:6, cognitiveChange:"Mix +1, +2, +3. Must recall all three.", keepsSame:"b is 1, 2, or 3.", dimensions:[{name:"b_range",value:"1-3"}], questionForms:["a+b"], constraints:{minA:1,maxA:7,minB:1,maxB:3} },
      { problemCount:6, cognitiveChange:"Missing addend for +3.", keepsSame:"b is always 3.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a"], constraints:{minA:1,maxA:7,fixedB:3} },
      { problemCount:6, cognitiveChange:"Mixed forms +1/+2/+3.", keepsSame:"b ≤ 3.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a+b","missing-addend-a"], constraints:{minA:1,maxA:7,minB:1,maxB:3} }
    )
  },

  {
    id: "add-4",
    levelCode: "M3", skill: "ADDITION",
    name: "Add 4 facts",
    learningObjective: "Student can add 4, building toward full single-digit fluency.",
    gradeLevel: "Grade 1", difficultyStars: 1, sheetRange: [7,8], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Adding 4, a starts 1-4.", keepsSame:"b is always 4.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:4}], questionForms:["a+b"], constraints:{minA:1,maxA:4,fixedB:4} },
      { problemCount:6, cognitiveChange:"a extends to 1-5.", keepsSame:"b is always 4.", dimensions:[{name:"a_range",value:"1-5"},{name:"b",value:4}], questionForms:["a+b"], constraints:{minA:1,maxA:5,fixedB:4} },
      { problemCount:6, cognitiveChange:"Mix +3 and +4. One new fact group added.", keepsSame:"b is 3 or 4.", dimensions:[{name:"b_range",value:"3-4"}], questionForms:["a+b"], constraints:{minA:1,maxA:6,minB:3,maxB:4} },
      { problemCount:6, cognitiveChange:"Missing addend for +4.", keepsSame:"b is always 4.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a"], constraints:{minA:1,maxA:5,fixedB:4} },
      { problemCount:6, cognitiveChange:"Mixed forms +1 through +4.", keepsSame:"b ≤ 4.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a+b","missing-addend-a"], constraints:{minA:1,maxA:6,minB:1,maxB:4} }
    )
  },

  {
    id: "add-5",
    levelCode: "M3", skill: "ADDITION",
    name: "Add 5 facts",
    learningObjective: "Student recognizes +5 as the halfway point to 10.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [9,10], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Adding 5, a starts 1-4.", keepsSame:"b is always 5.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:5}], questionForms:["a+b"], constraints:{minA:1,maxA:4,fixedB:5} },
      { problemCount:6, cognitiveChange:"a extends to 1-5 (5+5=10, the landmark sum).", keepsSame:"b is always 5.", dimensions:[{name:"a_range",value:"1-5"},{name:"b",value:5}], questionForms:["a+b"], constraints:{minA:1,maxA:5,fixedB:5} },
      { problemCount:6, cognitiveChange:"Mix +4 and +5.", keepsSame:"b is 4 or 5.", dimensions:[{name:"b_range",value:"4-5"}], questionForms:["a+b"], constraints:{minA:1,maxA:5,minB:4,maxB:5} },
      { problemCount:6, cognitiveChange:"Missing addend for +5.", keepsSame:"b is always 5.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a"], constraints:{minA:1,maxA:5,fixedB:5} },
      { problemCount:6, cognitiveChange:"Mixed +1 through +5, all forms.", keepsSame:"b ≤ 5, sums ≤ 10.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a+b","missing-addend-a"], constraints:{minA:1,maxA:5,minB:1,maxB:5} }
    )
  },

  {
    id: "add-6",
    levelCode: "M3", skill: "ADDITION",
    name: "Add 6 facts",
    learningObjective: "Student uses the flip strategy: 6+3 = 3+6.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [11,12], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Adding 6 to small numbers 1-3.", keepsSame:"b is always 6.", dimensions:[{name:"a_range",value:"1-3"},{name:"b",value:6}], questionForms:["a+b"], constraints:{minA:1,maxA:3,fixedB:6} },
      { problemCount:6, cognitiveChange:"a extends to 1-4 (6+4=10).", keepsSame:"b is always 6.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:6}], questionForms:["a+b"], constraints:{minA:1,maxA:4,fixedB:6} },
      { problemCount:6, cognitiveChange:"Flip strategy: also show 3+6, 4+6 as 6+3, 6+4.", keepsSame:"Both b values sum within 10.", dimensions:[{name:"commutative",value:true}], questionForms:["a+b"], constraints:{minA:1,maxA:4,minB:5,maxB:6} },
      { problemCount:6, cognitiveChange:"Missing addend for +6.", keepsSame:"b is always 6.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a"], constraints:{minA:1,maxA:4,fixedB:6} },
      { problemCount:6, cognitiveChange:"Mixed +5/+6 all forms.", keepsSame:"Sums within 10.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a+b","missing-addend-a"], constraints:{minA:1,maxA:4,minB:5,maxB:6} }
    )
  },

  {
    id: "add-7",
    levelCode: "M3", skill: "ADDITION",
    name: "Add 7 facts",
    learningObjective: "Student applies near-ten strategy: 7+3=10, 7+4=11.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [13,14], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Adding 7 to 1-2. Sums 8-9.", keepsSame:"b is always 7.", dimensions:[{name:"a_range",value:"1-2"},{name:"b",value:7}], questionForms:["a+b"], constraints:{minA:1,maxA:2,fixedB:7} },
      { problemCount:6, cognitiveChange:"a extends to 1-3 (7+3=10, landmark).", keepsSame:"b is always 7.", dimensions:[{name:"a_range",value:"1-3"},{name:"b",value:7}], questionForms:["a+b"], constraints:{minA:1,maxA:3,fixedB:7} },
      { problemCount:6, cognitiveChange:"Mix +6/+7. One new fact added.", keepsSame:"Sums within 10.", dimensions:[{name:"b_range",value:"6-7"}], questionForms:["a+b"], constraints:{minA:1,maxA:3,minB:6,maxB:7} },
      { problemCount:6, cognitiveChange:"Missing addend for +7.", keepsSame:"b is always 7.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a"], constraints:{minA:1,maxA:3,fixedB:7} },
      { problemCount:6, cognitiveChange:"Mixed +5/+6/+7 all forms.", keepsSame:"Sums ≤ 12.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a+b","missing-addend-a"], constraints:{minA:1,maxA:3,minB:5,maxB:7} }
    )
  },

  {
    id: "add-8",
    levelCode: "M3", skill: "ADDITION",
    name: "Add 8 facts",
    learningObjective: "Student uses near-ten strategy: 8+2=10, 8+4=12.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [15,16], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Adding 8 to 1-2.", keepsSame:"b is always 8.", dimensions:[{name:"a_range",value:"1-2"},{name:"b",value:8}], questionForms:["a+b"], constraints:{minA:1,maxA:2,fixedB:8} },
      { problemCount:6, cognitiveChange:"a extends to 1-4.", keepsSame:"b is always 8.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:8}], questionForms:["a+b"], constraints:{minA:1,maxA:4,fixedB:8} },
      { problemCount:6, cognitiveChange:"Mix +7/+8.", keepsSame:"b is 7 or 8.", dimensions:[{name:"b_range",value:"7-8"}], questionForms:["a+b"], constraints:{minA:1,maxA:4,minB:7,maxB:8} },
      { problemCount:6, cognitiveChange:"Missing addend for +8.", keepsSame:"b is always 8.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a"], constraints:{minA:1,maxA:4,fixedB:8} },
      { problemCount:6, cognitiveChange:"Mixed +6/+7/+8 all forms.", keepsSame:"b is 6-8.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a+b","missing-addend-a"], constraints:{minA:1,maxA:4,minB:6,maxB:8} }
    )
  },

  {
    id: "add-9",
    levelCode: "M3", skill: "ADDITION",
    name: "Add 9 facts",
    learningObjective: "Student applies +10-1 strategy: 9+4 = 10+4-1 = 13.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [17,18], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Adding 9 to 1-2.", keepsSame:"b is always 9.", dimensions:[{name:"a_range",value:"1-2"},{name:"b",value:9}], questionForms:["a+b"], constraints:{minA:1,maxA:2,fixedB:9} },
      { problemCount:6, cognitiveChange:"a extends to 1-9 (all +9 facts).", keepsSame:"b is always 9.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:9}], questionForms:["a+b"], constraints:{minA:1,maxA:9,fixedB:9} },
      { problemCount:6, cognitiveChange:"Mix +8/+9. Near-ten patterns compared.", keepsSame:"b is 8 or 9.", dimensions:[{name:"b_range",value:"8-9"}], questionForms:["a+b"], constraints:{minA:1,maxA:9,minB:8,maxB:9} },
      { problemCount:6, cognitiveChange:"Missing addend for +9.", keepsSame:"b is always 9.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a"], constraints:{minA:1,maxA:9,fixedB:9} },
      { problemCount:6, cognitiveChange:"Mixed +7/+8/+9 all forms.", keepsSame:"b is 7-9.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a+b","missing-addend-a"], constraints:{minA:1,maxA:9,minB:7,maxB:9} }
    )
  },

  {
    id: "add-review-1",
    levelCode: "M3", skill: "ADDITION",
    name: "Review — Add 1 through 9",
    learningObjective: "Student recalls all single-digit addition facts fluently.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [19,20], isReview: true,
    reviewOf: ["add-1","add-2","add-3","add-4","add-5","add-6","add-7","add-8","add-9"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review +1 through +5 facts.", keepsSame:"Single digit only.", dimensions:[{name:"b_range",value:"1-5"}], questionForms:["a+b"], constraints:{minA:1,maxA:9,minB:1,maxB:5} },
      { problemCount:6, cognitiveChange:"Review +6 through +9 facts.", keepsSame:"Single digit only.", dimensions:[{name:"b_range",value:"6-9"}], questionForms:["a+b"], constraints:{minA:1,maxA:9,minB:6,maxB:9} },
      { problemCount:6, cognitiveChange:"Mixed all facts random order.", keepsSame:"Single digit only.", dimensions:[{name:"b_range",value:"1-9"}], questionForms:["a+b"], constraints:{minA:1,maxA:9,minB:1,maxB:9} },
      { problemCount:6, cognitiveChange:"Missing addend — all facts.", keepsSame:"Single digit only.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a","missing-addend-b"], constraints:{minA:1,maxA:9,minB:1,maxB:9} },
      { problemCount:6, cognitiveChange:"Mixed forms — standard and missing addend.", keepsSame:"Single digit only.", dimensions:[{name:"form",value:"all"}], questionForms:["a+b","missing-addend-a","missing-addend-b"], constraints:{minA:1,maxA:9,minB:1,maxB:9} }
    )
  },

  {
    id: "add-2d-1d-no-carry",
    levelCode: "M3", skill: "ADDITION",
    name: "2-digit + 1-digit (no regrouping)",
    learningObjective: "Student adds a single digit to a 2-digit number without regrouping, understanding that tens stay the same.",
    gradeLevel: "Grade 1-2", difficultyStars: 3, sheetRange: [21,25], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Tens digit is 1, ones digit of a is 0. b is 1-4.", keepsSame:"No carry. Tens always 1.", dimensions:[{name:"tens",value:1},{name:"ones_a",value:"0"},{name:"b",value:"1-4"}], questionForms:["a+b"], constraints:{minA:10,maxA:10,minB:1,maxB:4,carry:false} },
      { problemCount:6, cognitiveChange:"Ones digit of a increases 1-4.", keepsSame:"Tens=1. No carry.", dimensions:[{name:"tens",value:1},{name:"ones_a",value:"1-4"},{name:"b",value:"1-4"}], questionForms:["a+b"], constraints:{minA:11,maxA:14,minB:1,maxB:4,carry:false} },
      { problemCount:6, cognitiveChange:"Tens digit increases to 2-3.", keepsSame:"No carry. b is small.", dimensions:[{name:"tens",value:"2-3"},{name:"b",value:"1-5"}], questionForms:["a+b"], constraints:{minA:20,maxA:35,minB:1,maxB:5,carry:false} },
      { problemCount:6, cognitiveChange:"b grows to 1-8. Ones still don't carry.", keepsSame:"No carry.", dimensions:[{name:"tens",value:"1-4"},{name:"b",value:"1-8"}], questionForms:["a+b"], constraints:{minA:11,maxA:41,minB:1,maxB:8,carry:false} },
      { problemCount:6, cognitiveChange:"Full range — tens 1-8, b 1-9.", keepsSame:"No carry.", dimensions:[{name:"tens",value:"1-8"},{name:"b",value:"1-9"}], questionForms:["a+b"], constraints:{minA:10,maxA:80,minB:1,maxB:9,carry:false} }
    )
  },

  {
    id: "add-2d-2d-no-carry",
    levelCode: "M3", skill: "ADDITION",
    name: "2-digit + 2-digit (no regrouping)",
    learningObjective: "Student adds two 2-digit numbers without regrouping by adding ones then tens separately.",
    gradeLevel: "Grade 2", difficultyStars: 3, sheetRange: [26,35], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Both numbers are multiples of 10. Only tens column active.", keepsSame:"Ones digits are 0. No carry.", dimensions:[{name:"ones",value:0},{name:"tens",value:"1-4"}], questionForms:["a+b"], constraints:{minA:10,maxA:40,minB:10,maxB:40,carry:false} },
      { problemCount:6, cognitiveChange:"Ones digits introduced — both ≤ 4.", keepsSame:"Tens small 1-2. No carry.", dimensions:[{name:"ones",value:"1-4"},{name:"tens",value:"1-2"}], questionForms:["a+b"], constraints:{minA:11,maxA:24,minB:11,maxB:24,carry:false} },
      { problemCount:6, cognitiveChange:"Tens grow to 3-4.", keepsSame:"Ones ≤ 4. No carry.", dimensions:[{name:"ones",value:"1-4"},{name:"tens",value:"1-4"}], questionForms:["a+b"], constraints:{minA:11,maxA:44,minB:11,maxB:44,carry:false} },
      { problemCount:6, cognitiveChange:"Ones grow to 1-9 (but no carry).", keepsSame:"No carry.", dimensions:[{name:"ones",value:"1-9 no carry"},{name:"tens",value:"1-4"}], questionForms:["a+b"], constraints:{minA:10,maxA:49,minB:10,maxB:49,carry:false} },
      { problemCount:6, cognitiveChange:"Full range — tens 1-5, any ones that don't carry.", keepsSame:"No carry.", dimensions:[{name:"tens",value:"1-5"},{name:"ones",value:"no carry"}], questionForms:["a+b"], constraints:{minA:10,maxA:59,minB:10,maxB:59,carry:false} }
    )
  },

  {
    id: "add-review-2",
    levelCode: "M3", skill: "ADDITION",
    name: "Review — 2-digit no regrouping",
    learningObjective: "Student consolidates 2-digit addition without regrouping.",
    gradeLevel: "Grade 2", difficultyStars: 3, sheetRange: [36,37], isReview: true,
    reviewOf: ["add-2d-1d-no-carry","add-2d-2d-no-carry"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review 2-digit + 1-digit.", keepsSame:"No carry.", dimensions:[{name:"type",value:"2d+1d"}], questionForms:["a+b"], constraints:{minA:11,maxA:59,minB:1,maxB:9,carry:false} },
      { problemCount:6, cognitiveChange:"Review 2-digit + 2-digit.", keepsSame:"No carry.", dimensions:[{name:"type",value:"2d+2d"}], questionForms:["a+b"], constraints:{minA:11,maxA:59,minB:11,maxB:59,carry:false} },
      { problemCount:6, cognitiveChange:"Mixed 2-digit — 1d and 2d second addend.", keepsSame:"No carry.", dimensions:[{name:"type",value:"mixed"}], questionForms:["a+b"], constraints:{minA:11,maxA:59,minB:1,maxB:59,carry:false} },
      { problemCount:6, cognitiveChange:"Word problem context introduced.", keepsSame:"No carry. 2-digit sums.", dimensions:[{name:"form",value:"word"}], questionForms:["word-add"], constraints:{minA:11,maxA:49,minB:11,maxB:49,carry:false} },
      { problemCount:6, cognitiveChange:"Mixed — equations and word problems.", keepsSame:"No carry.", dimensions:[{name:"form",value:"all"}], questionForms:["a+b","word-add"], constraints:{minA:11,maxA:59,minB:1,maxB:59,carry:false} }
    )
  },

  {
    id: "add-2d-2d-carry",
    levelCode: "M3", skill: "ADDITION",
    name: "2-digit + 2-digit (with regrouping)",
    learningObjective: "Student adds two 2-digit numbers with regrouping, carrying 1 ten from the ones column.",
    gradeLevel: "Grade 2", difficultyStars: 4, sheetRange: [38,50], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Ones always sum to exactly 10. Carry concept introduced.", keepsSame:"Ones sum = 10 exactly. Tens are small.", dimensions:[{name:"ones_sum",value:10},{name:"tens",value:"1-2"}], questionForms:["a+b"], constraints:{minA:11,maxA:29,minB:11,maxB:29,carry:true} },
      { problemCount:6, cognitiveChange:"Ones sum to 11-13. Carry produces 1-3.", keepsSame:"Tens still small 1-2.", dimensions:[{name:"ones_sum",value:"11-13"},{name:"tens",value:"1-2"}], questionForms:["a+b"], constraints:{minA:14,maxA:29,minB:17,maxB:29,carry:true} },
      { problemCount:6, cognitiveChange:"Ones sum to 14-18. Tens grow to 3-4.", keepsSame:"Carry always happens.", dimensions:[{name:"ones_sum",value:"14-18"},{name:"tens",value:"2-4"}], questionForms:["a+b"], constraints:{minA:25,maxA:49,minB:19,maxB:49,carry:true} },
      { problemCount:6, cognitiveChange:"Full range — tens 1-5. Mixed ones sums.", keepsSame:"Carry always happens.", dimensions:[{name:"tens",value:"1-5"},{name:"ones_sum",value:"10-18"}], questionForms:["a+b"], constraints:{minA:11,maxA:59,minB:11,maxB:59,carry:true} },
      { problemCount:6, cognitiveChange:"Word problems with carrying.", keepsSame:"Carry always happens.", dimensions:[{name:"form",value:"word"}], questionForms:["a+b","word-add"], constraints:{minA:11,maxA:59,minB:11,maxB:59,carry:true} }
    )
  },

  {
    id: "add-review-3",
    levelCode: "M3", skill: "ADDITION",
    name: "Review — carry and no carry mixed",
    learningObjective: "Student determines when regrouping is needed and applies the correct algorithm.",
    gradeLevel: "Grade 2", difficultyStars: 4, sheetRange: [51,52], isReview: true,
    reviewOf: ["add-2d-2d-no-carry","add-2d-2d-carry"],
    stages: stages(
      { problemCount:6, cognitiveChange:"No carry problems.", keepsSame:"2-digit.", dimensions:[{name:"carry",value:false}], questionForms:["a+b"], constraints:{minA:11,maxA:59,minB:11,maxB:59,carry:false} },
      { problemCount:6, cognitiveChange:"Carry problems.", keepsSame:"2-digit.", dimensions:[{name:"carry",value:true}], questionForms:["a+b"], constraints:{minA:11,maxA:59,minB:11,maxB:59,carry:true} },
      { problemCount:6, cognitiveChange:"Mixed — student decides if carry needed.", keepsSame:"2-digit.", dimensions:[{name:"carry",value:"mixed"}], questionForms:["a+b"], constraints:{minA:11,maxA:59,minB:11,maxB:59} },
      { problemCount:6, cognitiveChange:"Word problems — mixed carry.", keepsSame:"2-digit contexts.", dimensions:[{name:"form",value:"word"}], questionForms:["word-add"], constraints:{minA:11,maxA:59,minB:11,maxB:59} },
      { problemCount:6, cognitiveChange:"All forms mixed.", keepsSame:"2-digit.", dimensions:[{name:"form",value:"all"}], questionForms:["a+b","word-add","missing-addend-a"], constraints:{minA:11,maxA:59,minB:11,maxB:59} }
    )
  },

  {
    id: "add-3digit",
    levelCode: "M3", skill: "ADDITION",
    name: "3-digit addition (no regrouping)",
    learningObjective: "Student extends the addition algorithm to three-digit numbers without regrouping.",
    gradeLevel: "Grade 3", difficultyStars: 4, sheetRange: [53,60], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Hundreds + hundreds, no ones or tens.", keepsSame:"No carry. Ones and tens = 0.", dimensions:[{name:"hundreds",value:"1-4"},{name:"ones_tens",value:0}], questionForms:["a+b"], constraints:{minA:100,maxA:400,minB:100,maxB:400,carry:false} },
      { problemCount:6, cognitiveChange:"Tens digit introduced.", keepsSame:"No carry. Ones = 0.", dimensions:[{name:"hundreds",value:"1-4"},{name:"tens",value:"1-4"}], questionForms:["a+b"], constraints:{minA:110,maxA:440,minB:110,maxB:440,carry:false} },
      { problemCount:6, cognitiveChange:"Ones digit introduced.", keepsSame:"No carry.", dimensions:[{name:"hundreds",value:"1-3"},{name:"tens",value:"1-4"},{name:"ones",value:"1-4"}], questionForms:["a+b"], constraints:{minA:111,maxA:344,minB:111,maxB:344,carry:false} },
      { problemCount:6, cognitiveChange:"Full 3-digit no carry.", keepsSame:"No carry.", dimensions:[{name:"range",value:"100-499"}], questionForms:["a+b"], constraints:{minA:100,maxA:499,minB:100,maxB:499,carry:false} },
      { problemCount:6, cognitiveChange:"Word problems — 3-digit no carry.", keepsSame:"No carry.", dimensions:[{name:"form",value:"word"}], questionForms:["a+b","word-add"], constraints:{minA:100,maxA:499,minB:100,maxB:499,carry:false} }
    )
  },

  {
    id: "add-3digit-carry",
    levelCode: "M3", skill: "ADDITION",
    name: "3-digit addition (with regrouping)",
    learningObjective: "Student applies multi-column regrouping including carrying into the hundreds.",
    gradeLevel: "Grade 3", difficultyStars: 5, sheetRange: [61,72], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Carry from ones only. Tens and hundreds stay.", keepsSame:"Ones carry, rest don't.", dimensions:[{name:"carry_ones",value:true},{name:"carry_tens",value:false}], questionForms:["a+b"], constraints:{minA:115,maxA:299,minB:115,maxB:299,carry:true} },
      { problemCount:6, cognitiveChange:"Carry from tens only.", keepsSame:"Ones don't carry.", dimensions:[{name:"carry_ones",value:false},{name:"carry_tens",value:true}], questionForms:["a+b"], constraints:{minA:150,maxA:399,minB:150,maxB:399,carry:true} },
      { problemCount:6, cognitiveChange:"Double carry — ones and tens both carry.", keepsSame:"Both carry.", dimensions:[{name:"carry_ones",value:true},{name:"carry_tens",value:true}], questionForms:["a+b"], constraints:{minA:175,maxA:499,minB:175,maxB:499,carry:true} },
      { problemCount:6, cognitiveChange:"Full range 3-digit with any carry.", keepsSame:"3-digit.", dimensions:[{name:"range",value:"100-699"}], questionForms:["a+b"], constraints:{minA:100,maxA:699,minB:100,maxB:699,carry:true} },
      { problemCount:6, cognitiveChange:"Word problems — 3-digit with carry.", keepsSame:"3-digit.", dimensions:[{name:"form",value:"word"}], questionForms:["a+b","word-add"], constraints:{minA:100,maxA:699,minB:100,maxB:699,carry:true} }
    )
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// M4 — SUBTRACTION
// ─────────────────────────────────────────────────────────────────────────────

const subtractionMicroSkills: MicroSkill[] = [

  {
    id: "sub-1",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Subtract 1 facts",
    learningObjective: "Student understands that subtracting 1 produces the previous counting number.",
    gradeLevel: "Grade K", difficultyStars: 1, sheetRange: [1,2], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Subtract 1 from small numbers 2-4. Pattern: each answer is the number before.", keepsSame:"b=1 always. a starts small.", dimensions:[{name:"a_range",value:"2-4"},{name:"b",value:1}], questionForms:["a-b"], constraints:{minA:2,maxA:4,fixedB:1} },
      { problemCount:6, cognitiveChange:"Range expands to 5-7.", keepsSame:"b=1 always. Same -1 pattern.", dimensions:[{name:"a_range",value:"5-7"},{name:"b",value:1}], questionForms:["a-b"], constraints:{minA:5,maxA:7,fixedB:1} },
      { problemCount:6, cognitiveChange:"Full range 2-10 in random order. Fluency — student retrieves without counting back.", keepsSame:"b=1 always. Random order now.", dimensions:[{name:"a_range",value:"2-10"},{name:"order",value:"random"}], questionForms:["a-b"], constraints:{minA:2,maxA:10,fixedB:1} },
      { problemCount:6, cognitiveChange:"Missing subtrahend: a-___=c. New cognitive demand — reverse thinking.", keepsSame:"b=1 always. Same differences.", dimensions:[{name:"form",value:"missing-subtrahend"}], questionForms:["missing-subtrahend"], constraints:{minA:2,maxA:10,fixedB:1} },
      { problemCount:6, cognitiveChange:"Mixed: standard equation AND missing subtrahend. Student chooses strategy.", keepsSame:"b=1 always. All within 2-10.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a-b","missing-subtrahend"], constraints:{minA:2,maxA:10,fixedB:1} }
    )
  },

  {
    id: "sub-2",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Subtract 2 facts",
    learningObjective: "Student understands that subtracting 2 skips one counting number backward.",
    gradeLevel: "Grade K-1", difficultyStars: 1, sheetRange: [3,4], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Subtracting 2 from numbers 3-6. New backward-skip concept introduced.", keepsSame:"b is always 2.", dimensions:[{name:"a_range",value:"3-6"},{name:"b",value:2}], questionForms:["a-b"], constraints:{minA:3,maxA:6,fixedB:2} },
      { problemCount:6, cognitiveChange:"Range extends to 3-9.", keepsSame:"b is always 2.", dimensions:[{name:"a_range",value:"3-9"},{name:"b",value:2}], questionForms:["a-b"], constraints:{minA:3,maxA:9,fixedB:2} },
      { problemCount:6, cognitiveChange:"Mix -1 and -2. Student must distinguish which backward skip applies.", keepsSame:"Both b values are 1 or 2 only.", dimensions:[{name:"b_range",value:"1 or 2"}], questionForms:["a-b"], constraints:{minA:3,maxA:10,minB:1,maxB:2} },
      { problemCount:6, cognitiveChange:"Missing subtrahend for -2: a-___=c.", keepsSame:"b is always 2.", dimensions:[{name:"form",value:"missing-subtrahend"}], questionForms:["missing-subtrahend"], constraints:{minA:3,maxA:10,fixedB:2} },
      { problemCount:6, cognitiveChange:"Mixed -1/-2 with missing subtrahend forms.", keepsSame:"b is 1 or 2.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a-b","missing-subtrahend"], constraints:{minA:3,maxA:10,minB:1,maxB:2} }
    )
  },

  {
    id: "sub-3",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Subtract 3 facts",
    learningObjective: "Student can subtract 3 using count-back strategy.",
    gradeLevel: "Grade K-1", difficultyStars: 1, sheetRange: [5,6], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Subtracting 3, a starts at 4-7.", keepsSame:"b is always 3.", dimensions:[{name:"a_range",value:"4-7"},{name:"b",value:3}], questionForms:["a-b"], constraints:{minA:4,maxA:7,fixedB:3} },
      { problemCount:6, cognitiveChange:"a extends to 4-9.", keepsSame:"b is always 3.", dimensions:[{name:"a_range",value:"4-9"},{name:"b",value:3}], questionForms:["a-b"], constraints:{minA:4,maxA:9,fixedB:3} },
      { problemCount:6, cognitiveChange:"Mix -1, -2, -3. Must recall all three.", keepsSame:"b is 1, 2, or 3.", dimensions:[{name:"b_range",value:"1-3"}], questionForms:["a-b"], constraints:{minA:4,maxA:10,minB:1,maxB:3} },
      { problemCount:6, cognitiveChange:"Missing subtrahend for -3.", keepsSame:"b is always 3.", dimensions:[{name:"form",value:"missing-subtrahend"}], questionForms:["missing-subtrahend"], constraints:{minA:4,maxA:10,fixedB:3} },
      { problemCount:6, cognitiveChange:"Mixed forms -1/-2/-3.", keepsSame:"b ≤ 3.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a-b","missing-subtrahend"], constraints:{minA:4,maxA:10,minB:1,maxB:3} }
    )
  },

  {
    id: "sub-4",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Subtract 4 facts",
    learningObjective: "Student can subtract 4, building toward full single-digit fluency.",
    gradeLevel: "Grade 1", difficultyStars: 1, sheetRange: [7,8], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Subtracting 4, a starts 5-8.", keepsSame:"b is always 4.", dimensions:[{name:"a_range",value:"5-8"},{name:"b",value:4}], questionForms:["a-b"], constraints:{minA:5,maxA:8,fixedB:4} },
      { problemCount:6, cognitiveChange:"a extends to 5-9.", keepsSame:"b is always 4.", dimensions:[{name:"a_range",value:"5-9"},{name:"b",value:4}], questionForms:["a-b"], constraints:{minA:5,maxA:9,fixedB:4} },
      { problemCount:6, cognitiveChange:"Mix -3 and -4. One new fact group added.", keepsSame:"b is 3 or 4.", dimensions:[{name:"b_range",value:"3-4"}], questionForms:["a-b"], constraints:{minA:5,maxA:10,minB:3,maxB:4} },
      { problemCount:6, cognitiveChange:"Missing subtrahend for -4.", keepsSame:"b is always 4.", dimensions:[{name:"form",value:"missing-subtrahend"}], questionForms:["missing-subtrahend"], constraints:{minA:5,maxA:10,fixedB:4} },
      { problemCount:6, cognitiveChange:"Mixed forms -1 through -4.", keepsSame:"b ≤ 4.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a-b","missing-subtrahend"], constraints:{minA:5,maxA:10,minB:1,maxB:4} }
    )
  },

  {
    id: "sub-5",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Subtract 5 facts",
    learningObjective: "Student recognizes -5 as the inverse of the halfway point to 10.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [9,10], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Subtracting 5, a starts 6-9.", keepsSame:"b is always 5.", dimensions:[{name:"a_range",value:"6-9"},{name:"b",value:5}], questionForms:["a-b"], constraints:{minA:6,maxA:9,fixedB:5} },
      { problemCount:6, cognitiveChange:"a extends to 5-10 (10-5=5, the landmark difference).", keepsSame:"b is always 5.", dimensions:[{name:"a_range",value:"5-10"},{name:"b",value:5}], questionForms:["a-b"], constraints:{minA:5,maxA:10,fixedB:5} },
      { problemCount:6, cognitiveChange:"Mix -4 and -5.", keepsSame:"b is 4 or 5.", dimensions:[{name:"b_range",value:"4-5"}], questionForms:["a-b"], constraints:{minA:5,maxA:10,minB:4,maxB:5} },
      { problemCount:6, cognitiveChange:"Missing subtrahend for -5.", keepsSame:"b is always 5.", dimensions:[{name:"form",value:"missing-subtrahend"}], questionForms:["missing-subtrahend"], constraints:{minA:5,maxA:10,fixedB:5} },
      { problemCount:6, cognitiveChange:"Mixed -1 through -5, all forms.", keepsSame:"b ≤ 5, results ≥ 0.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a-b","missing-subtrahend"], constraints:{minA:5,maxA:10,minB:1,maxB:5} }
    )
  },

  {
    id: "sub-6",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Subtract 6 facts",
    learningObjective: "Student uses the think-addition strategy: 11-6 = ? because 6+5=11.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [11,12], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Subtracting 6 from numbers 7-9.", keepsSame:"b is always 6.", dimensions:[{name:"a_range",value:"7-9"},{name:"b",value:6}], questionForms:["a-b"], constraints:{minA:7,maxA:9,fixedB:6} },
      { problemCount:6, cognitiveChange:"a extends to 6-10 (think-addition: 10-6=4 because 6+4=10).", keepsSame:"b is always 6.", dimensions:[{name:"a_range",value:"6-10"},{name:"b",value:6}], questionForms:["a-b"], constraints:{minA:6,maxA:10,fixedB:6} },
      { problemCount:6, cognitiveChange:"Think-addition strategy explicitly compared with -5.", keepsSame:"Both differences land within 0-5.", dimensions:[{name:"strategy",value:"think-addition"}], questionForms:["a-b"], constraints:{minA:9,maxA:10,minB:5,maxB:6} },
      { problemCount:6, cognitiveChange:"Missing subtrahend for -6.", keepsSame:"b is always 6.", dimensions:[{name:"form",value:"missing-subtrahend"}], questionForms:["missing-subtrahend"], constraints:{minA:6,maxA:10,fixedB:6} },
      { problemCount:6, cognitiveChange:"Mixed -5/-6 all forms.", keepsSame:"Differences within 0-5.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a-b","missing-subtrahend"], constraints:{minA:9,maxA:10,minB:5,maxB:6} }
    )
  },

  {
    id: "sub-7",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Subtract 7 facts",
    learningObjective: "Student applies near-ten strategy: 12-7 = 12-10+3 = 5.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [13,14], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Subtracting 7 from 8-9. Differences 1-2.", keepsSame:"b is always 7.", dimensions:[{name:"a_range",value:"8-9"},{name:"b",value:7}], questionForms:["a-b"], constraints:{minA:8,maxA:9,fixedB:7} },
      { problemCount:6, cognitiveChange:"a extends to 7-10 (10-7=3, landmark).", keepsSame:"b is always 7.", dimensions:[{name:"a_range",value:"7-10"},{name:"b",value:7}], questionForms:["a-b"], constraints:{minA:7,maxA:10,fixedB:7} },
      { problemCount:6, cognitiveChange:"Mix -6/-7. One new fact added.", keepsSame:"Differences within 0-4.", dimensions:[{name:"b_range",value:"6-7"}], questionForms:["a-b"], constraints:{minA:9,maxA:10,minB:6,maxB:7} },
      { problemCount:6, cognitiveChange:"Missing subtrahend for -7.", keepsSame:"b is always 7.", dimensions:[{name:"form",value:"missing-subtrahend"}], questionForms:["missing-subtrahend"], constraints:{minA:7,maxA:10,fixedB:7} },
      { problemCount:6, cognitiveChange:"Mixed -5/-6/-7 all forms.", keepsSame:"Minuends ≤ 12.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a-b","missing-subtrahend"], constraints:{minA:9,maxA:12,minB:5,maxB:7} }
    )
  },

  {
    id: "sub-8",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Subtract 8 facts",
    learningObjective: "Student applies near-ten strategy for -8: 13-8 = 13-10+2 = 5.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [15,16], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Subtracting 8 from 9-10. Differences 1-2.", keepsSame:"b is always 8.", dimensions:[{name:"a_range",value:"9-10"},{name:"b",value:8}], questionForms:["a-b"], constraints:{minA:9,maxA:10,fixedB:8} },
      { problemCount:6, cognitiveChange:"a extends to 8-12 (10-8=2, landmark).", keepsSame:"b is always 8.", dimensions:[{name:"a_range",value:"8-12"},{name:"b",value:8}], questionForms:["a-b"], constraints:{minA:8,maxA:12,fixedB:8} },
      { problemCount:6, cognitiveChange:"Mix -7/-8.", keepsSame:"b is 7 or 8.", dimensions:[{name:"b_range",value:"7-8"}], questionForms:["a-b"], constraints:{minA:10,maxA:13,minB:7,maxB:8} },
      { problemCount:6, cognitiveChange:"Missing subtrahend for -8.", keepsSame:"b is always 8.", dimensions:[{name:"form",value:"missing-subtrahend"}], questionForms:["missing-subtrahend"], constraints:{minA:8,maxA:12,fixedB:8} },
      { problemCount:6, cognitiveChange:"Mixed -6/-7/-8 all forms.", keepsSame:"Minuends ≤ 13.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a-b","missing-subtrahend"], constraints:{minA:9,maxA:13,minB:6,maxB:8} }
    )
  },

  {
    id: "sub-9",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Subtract 9 facts",
    learningObjective: "Student applies -10+1 strategy: 13-9 = 13-10+1 = 4.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [17,18], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Subtracting 9 from 10-11.", keepsSame:"b is always 9.", dimensions:[{name:"a_range",value:"10-11"},{name:"b",value:9}], questionForms:["a-b"], constraints:{minA:10,maxA:11,fixedB:9} },
      { problemCount:6, cognitiveChange:"a extends to 9-18 (all -9 facts).", keepsSame:"b is always 9.", dimensions:[{name:"a_range",value:"9-18"},{name:"b",value:9}], questionForms:["a-b"], constraints:{minA:9,maxA:18,fixedB:9} },
      { problemCount:6, cognitiveChange:"Mix -8/-9. Near-ten patterns compared.", keepsSame:"b is 8 or 9.", dimensions:[{name:"b_range",value:"8-9"}], questionForms:["a-b"], constraints:{minA:9,maxA:18,minB:8,maxB:9} },
      { problemCount:6, cognitiveChange:"Missing subtrahend for -9.", keepsSame:"b is always 9.", dimensions:[{name:"form",value:"missing-subtrahend"}], questionForms:["missing-subtrahend"], constraints:{minA:9,maxA:18,fixedB:9} },
      { problemCount:6, cognitiveChange:"Mixed -7/-8/-9 all forms.", keepsSame:"b is 7-9.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a-b","missing-subtrahend"], constraints:{minA:9,maxA:18,minB:7,maxB:9} }
    )
  },

  {
    id: "sub-review-1",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Review — Subtract 1 through 9",
    learningObjective: "Student recalls all single-digit subtraction facts fluently.",
    gradeLevel: "Grade 1", difficultyStars: 2, sheetRange: [19,20], isReview: true,
    reviewOf: ["sub-1","sub-2","sub-3","sub-4","sub-5","sub-6","sub-7","sub-8","sub-9"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review -1 through -5 facts.", keepsSame:"Single digit minuends.", dimensions:[{name:"b_range",value:"1-5"}], questionForms:["a-b"], constraints:{minA:5,maxA:18,minB:1,maxB:5} },
      { problemCount:6, cognitiveChange:"Review -6 through -9 facts.", keepsSame:"Single digit minuends.", dimensions:[{name:"b_range",value:"6-9"}], questionForms:["a-b"], constraints:{minA:9,maxA:18,minB:6,maxB:9} },
      { problemCount:6, cognitiveChange:"Mixed all facts random order.", keepsSame:"Minuends ≤ 18.", dimensions:[{name:"b_range",value:"1-9"}], questionForms:["a-b"], constraints:{minA:5,maxA:18,minB:1,maxB:9} },
      { problemCount:6, cognitiveChange:"Missing subtrahend/minuend — all facts.", keepsSame:"Minuends ≤ 18.", dimensions:[{name:"form",value:"missing"}], questionForms:["missing-subtrahend","missing-minuend"], constraints:{minA:5,maxA:18,minB:1,maxB:9} },
      { problemCount:6, cognitiveChange:"Mixed forms — standard and missing operand.", keepsSame:"Minuends ≤ 18.", dimensions:[{name:"form",value:"all"}], questionForms:["a-b","missing-subtrahend","missing-minuend"], constraints:{minA:5,maxA:18,minB:1,maxB:9} }
    )
  },

  {
    id: "sub-2d-1d-no-borrow",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "2-digit - 1-digit (no regrouping)",
    learningObjective: "Student subtracts a single digit from a 2-digit number without regrouping, understanding that tens stay the same.",
    gradeLevel: "Grade 1-2", difficultyStars: 3, sheetRange: [21,25], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Tens digit is 1, ones digit ≥ b. b is 1-4.", keepsSame:"No borrow. Tens always 1.", dimensions:[{name:"tens",value:1},{name:"b",value:"1-4"}], questionForms:["a-b"], constraints:{minA:15,maxA:19,minB:1,maxB:4,borrow:false} },
      { problemCount:6, cognitiveChange:"Ones digit of a varies 5-9.", keepsSame:"Tens=1. No borrow.", dimensions:[{name:"tens",value:1},{name:"ones_a",value:"5-9"},{name:"b",value:"1-4"}], questionForms:["a-b"], constraints:{minA:15,maxA:19,minB:1,maxB:5,borrow:false} },
      { problemCount:6, cognitiveChange:"Tens digit increases to 2-3.", keepsSame:"No borrow. b is small.", dimensions:[{name:"tens",value:"2-3"},{name:"b",value:"1-5"}], questionForms:["a-b"], constraints:{minA:25,maxA:39,minB:1,maxB:5,borrow:false} },
      { problemCount:6, cognitiveChange:"b grows to 1-8. Ones still don't borrow.", keepsSame:"No borrow.", dimensions:[{name:"tens",value:"1-4"},{name:"b",value:"1-8"}], questionForms:["a-b"], constraints:{minA:18,maxA:49,minB:1,maxB:8,borrow:false} },
      { problemCount:6, cognitiveChange:"Full range — tens 1-8, b 1-9.", keepsSame:"No borrow.", dimensions:[{name:"tens",value:"1-8"},{name:"b",value:"1-9"}], questionForms:["a-b"], constraints:{minA:19,maxA:89,minB:1,maxB:9,borrow:false} }
    )
  },

  {
    id: "sub-2d-2d-no-borrow",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "2-digit - 2-digit (no regrouping)",
    learningObjective: "Student subtracts two 2-digit numbers without regrouping by subtracting ones then tens separately.",
    gradeLevel: "Grade 2", difficultyStars: 3, sheetRange: [26,35], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Both numbers are multiples of 10. Only tens column active.", keepsSame:"Ones digits are 0. No borrow.", dimensions:[{name:"ones",value:0},{name:"tens",value:"2-5"}], questionForms:["a-b"], constraints:{minA:30,maxA:50,minB:10,maxB:30,borrow:false} },
      { problemCount:6, cognitiveChange:"Ones digits introduced — minuend ones ≥ subtrahend ones.", keepsSame:"Tens small 2-3. No borrow.", dimensions:[{name:"ones",value:"≥ subtrahend"},{name:"tens",value:"2-3"}], questionForms:["a-b"], constraints:{minA:25,maxA:38,minB:11,maxB:24,borrow:false} },
      { problemCount:6, cognitiveChange:"Tens grow to 4-5.", keepsSame:"Ones don't borrow.", dimensions:[{name:"ones",value:"no borrow"},{name:"tens",value:"4-5"}], questionForms:["a-b"], constraints:{minA:45,maxA:59,minB:21,maxB:43,borrow:false} },
      { problemCount:6, cognitiveChange:"Ones grow to full single digits (but no borrow).", keepsSame:"No borrow.", dimensions:[{name:"ones",value:"1-9 no borrow"},{name:"tens",value:"3-6"}], questionForms:["a-b"], constraints:{minA:30,maxA:69,minB:10,maxB:59,borrow:false} },
      { problemCount:6, cognitiveChange:"Full range — tens 2-9, any ones that don't require borrowing.", keepsSame:"No borrow.", dimensions:[{name:"tens",value:"2-9"},{name:"ones",value:"no borrow"}], questionForms:["a-b"], constraints:{minA:20,maxA:99,minB:10,maxB:89,borrow:false} }
    )
  },

  {
    id: "sub-review-2",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Review — 2-digit no regrouping",
    learningObjective: "Student consolidates 2-digit subtraction without regrouping.",
    gradeLevel: "Grade 2", difficultyStars: 3, sheetRange: [36,37], isReview: true,
    reviewOf: ["sub-2d-1d-no-borrow","sub-2d-2d-no-borrow"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review 2-digit - 1-digit.", keepsSame:"No borrow.", dimensions:[{name:"type",value:"2d-1d"}], questionForms:["a-b"], constraints:{minA:19,maxA:89,minB:1,maxB:9,borrow:false} },
      { problemCount:6, cognitiveChange:"Review 2-digit - 2-digit.", keepsSame:"No borrow.", dimensions:[{name:"type",value:"2d-2d"}], questionForms:["a-b"], constraints:{minA:30,maxA:99,minB:10,maxB:80,borrow:false} },
      { problemCount:6, cognitiveChange:"Mixed 2-digit — 1d and 2d subtrahend.", keepsSame:"No borrow.", dimensions:[{name:"type",value:"mixed"}], questionForms:["a-b"], constraints:{minA:20,maxA:99,minB:1,maxB:80,borrow:false} },
      { problemCount:6, cognitiveChange:"Word problem context introduced.", keepsSame:"No borrow. 2-digit results.", dimensions:[{name:"form",value:"word"}], questionForms:["word-sub"], constraints:{minA:30,maxA:79,minB:10,maxB:49,borrow:false} },
      { problemCount:6, cognitiveChange:"Mixed — equations and word problems.", keepsSame:"No borrow.", dimensions:[{name:"form",value:"all"}], questionForms:["a-b","word-sub"], constraints:{minA:20,maxA:99,minB:1,maxB:80,borrow:false} }
    )
  },

  {
    id: "sub-2d-2d-borrow",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "2-digit - 2-digit (with regrouping)",
    learningObjective: "Student subtracts two 2-digit numbers with regrouping, borrowing 1 ten to the ones column.",
    gradeLevel: "Grade 2", difficultyStars: 4, sheetRange: [38,50], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Ones digit of subtrahend always exceeds minuend's by exactly 1. Borrow concept introduced.", keepsSame:"Borrow always needed by 1. Tens are small.", dimensions:[{name:"borrow_amount",value:1},{name:"tens",value:"2-3"}], questionForms:["a-b"], constraints:{minA:21,maxA:39,minB:13,maxB:28,borrow:true} },
      { problemCount:6, cognitiveChange:"Borrow amount varies 1-3.", keepsSame:"Tens still small 2-4.", dimensions:[{name:"borrow_amount",value:"1-3"},{name:"tens",value:"2-4"}], questionForms:["a-b"], constraints:{minA:31,maxA:49,minB:13,maxB:38,borrow:true} },
      { problemCount:6, cognitiveChange:"Borrow amount 4-8. Tens grow to 5-7.", keepsSame:"Borrow always happens.", dimensions:[{name:"borrow_amount",value:"4-8"},{name:"tens",value:"5-7"}], questionForms:["a-b"], constraints:{minA:51,maxA:79,minB:13,maxB:69,borrow:true} },
      { problemCount:6, cognitiveChange:"Full range — tens 2-9. Mixed borrow amounts.", keepsSame:"Borrow always happens.", dimensions:[{name:"tens",value:"2-9"},{name:"borrow_amount",value:"1-9"}], questionForms:["a-b"], constraints:{minA:21,maxA:94,minB:12,maxB:79,borrow:true} },
      { problemCount:6, cognitiveChange:"Word problems with borrowing.", keepsSame:"Borrow always happens.", dimensions:[{name:"form",value:"word"}], questionForms:["a-b","word-sub"], constraints:{minA:21,maxA:94,minB:12,maxB:79,borrow:true} }
    )
  },

  {
    id: "sub-review-3",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "Review — borrow and no borrow mixed",
    learningObjective: "Student determines when regrouping is needed and applies the correct algorithm.",
    gradeLevel: "Grade 2", difficultyStars: 4, sheetRange: [51,52], isReview: true,
    reviewOf: ["sub-2d-2d-no-borrow","sub-2d-2d-borrow"],
    stages: stages(
      { problemCount:6, cognitiveChange:"No borrow problems.", keepsSame:"2-digit.", dimensions:[{name:"borrow",value:false}], questionForms:["a-b"], constraints:{minA:30,maxA:89,minB:10,maxB:69,borrow:false} },
      { problemCount:6, cognitiveChange:"Borrow problems.", keepsSame:"2-digit.", dimensions:[{name:"borrow",value:true}], questionForms:["a-b"], constraints:{minA:31,maxA:94,minB:13,maxB:79,borrow:true} },
      { problemCount:6, cognitiveChange:"Mixed — student decides if borrow needed.", keepsSame:"2-digit.", dimensions:[{name:"borrow",value:"mixed"}], questionForms:["a-b"], constraints:{minA:21,maxA:94,minB:10,maxB:79} },
      { problemCount:6, cognitiveChange:"Word problems — mixed borrow.", keepsSame:"2-digit contexts.", dimensions:[{name:"form",value:"word"}], questionForms:["word-sub"], constraints:{minA:21,maxA:94,minB:10,maxB:79} },
      { problemCount:6, cognitiveChange:"All forms mixed.", keepsSame:"2-digit.", dimensions:[{name:"form",value:"all"}], questionForms:["a-b","word-sub","missing-subtrahend"], constraints:{minA:21,maxA:94,minB:10,maxB:79} }
    )
  },

  {
    id: "sub-3digit",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "3-digit subtraction (no regrouping)",
    learningObjective: "Student extends the subtraction algorithm to three-digit numbers without regrouping.",
    gradeLevel: "Grade 3", difficultyStars: 4, sheetRange: [53,60], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Hundreds - hundreds, no ones or tens.", keepsSame:"No borrow. Ones and tens = 0.", dimensions:[{name:"hundreds",value:"3-9"},{name:"ones_tens",value:0}], questionForms:["a-b"], constraints:{minA:300,maxA:900,minB:100,maxB:300,borrow:false} },
      { problemCount:6, cognitiveChange:"Tens digit introduced.", keepsSame:"No borrow. Ones = 0.", dimensions:[{name:"hundreds",value:"3-9"},{name:"tens",value:"1-4"}], questionForms:["a-b"], constraints:{minA:340,maxA:990,minB:110,maxB:340,borrow:false} },
      { problemCount:6, cognitiveChange:"Ones digit introduced.", keepsSame:"No borrow.", dimensions:[{name:"hundreds",value:"4-9"},{name:"tens",value:"1-4"},{name:"ones",value:"1-4"}], questionForms:["a-b"], constraints:{minA:444,maxA:988,minB:111,maxB:444,borrow:false} },
      { problemCount:6, cognitiveChange:"Full 3-digit no borrow.", keepsSame:"No borrow.", dimensions:[{name:"range",value:"500-999"}], questionForms:["a-b"], constraints:{minA:500,maxA:999,minB:100,maxB:499,borrow:false} },
      { problemCount:6, cognitiveChange:"Word problems — 3-digit no borrow.", keepsSame:"No borrow.", dimensions:[{name:"form",value:"word"}], questionForms:["a-b","word-sub"], constraints:{minA:500,maxA:999,minB:100,maxB:499,borrow:false} }
    )
  },

  {
    id: "sub-3digit-borrow",
    levelCode: "M4", skill: "SUBTRACTION",
    name: "3-digit subtraction (with regrouping)",
    learningObjective: "Student applies multi-column regrouping including borrowing across zeros.",
    gradeLevel: "Grade 3", difficultyStars: 5, sheetRange: [61,72], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Borrow from tens only. Hundreds stay.", keepsSame:"Ones borrow, hundreds don't.", dimensions:[{name:"borrow_ones",value:true},{name:"borrow_tens",value:false}], questionForms:["a-b"], constraints:{minA:230,maxA:599,minB:115,maxB:299,borrow:true} },
      { problemCount:6, cognitiveChange:"Borrow from hundreds only.", keepsSame:"Ones don't borrow.", dimensions:[{name:"borrow_ones",value:false},{name:"borrow_hundreds",value:true}], questionForms:["a-b"], constraints:{minA:300,maxA:799,minB:150,maxB:399,borrow:true} },
      { problemCount:6, cognitiveChange:"Double borrow — ones and tens both borrow.", keepsSame:"Both borrow.", dimensions:[{name:"borrow_ones",value:true},{name:"borrow_tens",value:true}], questionForms:["a-b"], constraints:{minA:400,maxA:899,minB:175,maxB:399,borrow:true} },
      { problemCount:6, cognitiveChange:"Borrow across zeros (e.g. 500-247). Hardest regrouping case.", keepsSame:"3-digit.", dimensions:[{name:"borrow_across_zero",value:true}], questionForms:["a-b"], constraints:{minA:400,maxA:900,minB:150,maxB:399,borrow:true} },
      { problemCount:6, cognitiveChange:"Word problems — 3-digit with borrowing.", keepsSame:"3-digit.", dimensions:[{name:"form",value:"word"}], questionForms:["a-b","word-sub"], constraints:{minA:300,maxA:900,minB:100,maxB:299,borrow:true} }
    )
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// M5 — MULTIPLICATION
// ─────────────────────────────────────────────────────────────────────────────

const multiplicationMicroSkills: MicroSkill[] = [

  {
    id: "mul-0",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 0",
    learningObjective: "Student understands the zero property: any number times 0 is 0.",
    gradeLevel: "Grade 2", difficultyStars: 1, sheetRange: [1,2], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 0. Pattern: the answer is always 0.", keepsSame:"b=0 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:0}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:0} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9. Same zero-product pattern holds for any size.", keepsSame:"b=0 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:0}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:0} },
      { problemCount:6, cognitiveChange:"Order flips: 0 × a. Commutative property introduced.", keepsSame:"Product is always 0.", dimensions:[{name:"order",value:"flipped"}], questionForms:["a*b"], constraints:{minA:0,maxA:0,minB:1,maxB:9} },
      { problemCount:6, cognitiveChange:"Missing factor: ___ × 0 = 0 — any value works, but student writes 0 by convention.", keepsSame:"Product is 0.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:0} },
      { problemCount:6, cognitiveChange:"Mixed: standard and missing factor, both orders.", keepsSame:"One factor is always 0.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:0} }
    )
  },

  {
    id: "mul-1",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 1",
    learningObjective: "Student understands the identity property: any number times 1 equals itself.",
    gradeLevel: "Grade 2", difficultyStars: 1, sheetRange: [3,4], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 1. Pattern: the answer equals the other factor.", keepsSame:"b=1 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:1}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:1} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9.", keepsSame:"b=1 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:1}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:1} },
      { problemCount:6, cognitiveChange:"Order flips: 1 × a. Commutative property compared with ×0.", keepsSame:"Product equals the other factor.", dimensions:[{name:"order",value:"flipped"}], questionForms:["a*b"], constraints:{minA:1,maxA:1,minB:1,maxB:9} },
      { problemCount:6, cognitiveChange:"Missing factor: ___ × 1 = c.", keepsSame:"One factor is 1.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:1} },
      { problemCount:6, cognitiveChange:"Mixed ×0/×1 — student distinguishes the two identity-like rules.", keepsSame:"One factor is 0 or 1.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:0,maxA:9,minB:0,maxB:1} }
    )
  },

  {
    id: "mul-2",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 2",
    learningObjective: "Student connects ×2 to doubling and to repeated addition.",
    gradeLevel: "Grade 2", difficultyStars: 1, sheetRange: [5,6], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 2 — framed as doubling.", keepsSame:"b=2 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:2}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:2} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×2 table).", keepsSame:"b=2 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:2}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:2} },
      { problemCount:6, cognitiveChange:"Mix ×1 and ×2. Student distinguishes the two scale factors.", keepsSame:"b is 1 or 2.", dimensions:[{name:"b_range",value:"1-2"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:1,maxB:2} },
      { problemCount:6, cognitiveChange:"Missing factor for ×2: ___×2=c and 2×___=c.", keepsSame:"b is always 2.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a","missing-factor-b"], constraints:{minA:1,maxA:9,fixedB:2} },
      { problemCount:6, cognitiveChange:"Mixed ×1/×2 with missing factor forms.", keepsSame:"b is 1 or 2.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a","missing-factor-b"], constraints:{minA:1,maxA:9,minB:1,maxB:2} }
    )
  },

  {
    id: "mul-5",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 5",
    learningObjective: "Student recognizes the ×5 skip-count pattern (products always end in 0 or 5).",
    gradeLevel: "Grade 2", difficultyStars: 2, sheetRange: [7,8], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 5 — skip counting by 5s.", keepsSame:"b=5 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:5}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:5} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×5 table). Pattern: ends in 0 or 5.", keepsSame:"b=5 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:5}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:5} },
      { problemCount:6, cognitiveChange:"Mix ×2 and ×5. Compare two skip-count patterns.", keepsSame:"b is 2 or 5.", dimensions:[{name:"b_range",value:"2 or 5"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:2,maxB:5} },
      { problemCount:6, cognitiveChange:"Missing factor for ×5.", keepsSame:"b is always 5.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:5} },
      { problemCount:6, cognitiveChange:"Mixed ×2/×5 all forms.", keepsSame:"b is 2 or 5.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:2,maxB:5} }
    )
  },

  {
    id: "mul-10",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 10",
    learningObjective: "Student recognizes that multiplying by 10 appends a zero (place-value shift).",
    gradeLevel: "Grade 2", difficultyStars: 2, sheetRange: [9,10], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 10 — notice the trailing zero.", keepsSame:"b=10 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:10}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:10} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×10 table). Place-value shift made explicit.", keepsSame:"b=10 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:10}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:10} },
      { problemCount:6, cognitiveChange:"Mix ×5 and ×10. Compare patterns — ×10 doubles the ×5 product.", keepsSame:"b is 5 or 10.", dimensions:[{name:"b_range",value:"5 or 10"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:5,maxB:10} },
      { problemCount:6, cognitiveChange:"Missing factor for ×10.", keepsSame:"b is always 10.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:10} },
      { problemCount:6, cognitiveChange:"Mixed ×5/×10 all forms.", keepsSame:"b is 5 or 10.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:5,maxB:10} }
    )
  },

  {
    id: "mul-3",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 3",
    learningObjective: "Student applies the ×3 table using skip-counting and the doubling+1-group strategy.",
    gradeLevel: "Grade 2-3", difficultyStars: 2, sheetRange: [11,12], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 3.", keepsSame:"b=3 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:3}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:3} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×3 table).", keepsSame:"b=3 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:3}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:3} },
      { problemCount:6, cognitiveChange:"Mix ×2 and ×3.", keepsSame:"b is 2 or 3.", dimensions:[{name:"b_range",value:"2-3"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:2,maxB:3} },
      { problemCount:6, cognitiveChange:"Missing factor for ×3.", keepsSame:"b is always 3.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:3} },
      { problemCount:6, cognitiveChange:"Mixed ×2/×3 all forms.", keepsSame:"b is 2 or 3.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:2,maxB:3} }
    )
  },

  {
    id: "mul-4",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 4",
    learningObjective: "Student applies the double-double strategy: 4×n = 2×(2×n).",
    gradeLevel: "Grade 3", difficultyStars: 2, sheetRange: [13,14], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 4 — framed as double-double.", keepsSame:"b=4 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:4}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:4} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×4 table).", keepsSame:"b=4 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:4}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:4} },
      { problemCount:6, cognitiveChange:"Mix ×3 and ×4.", keepsSame:"b is 3 or 4.", dimensions:[{name:"b_range",value:"3-4"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:3,maxB:4} },
      { problemCount:6, cognitiveChange:"Missing factor for ×4.", keepsSame:"b is always 4.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:4} },
      { problemCount:6, cognitiveChange:"Mixed ×3/×4 all forms.", keepsSame:"b is 3 or 4.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:3,maxB:4} }
    )
  },

  {
    id: "mul-6",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 6",
    learningObjective: "Student applies the ×5+1-group strategy: 6×n = (5×n) + n.",
    gradeLevel: "Grade 3", difficultyStars: 3, sheetRange: [15,16], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 6 — framed as ×5 plus one more group.", keepsSame:"b=6 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:6}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:6} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×6 table).", keepsSame:"b=6 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:6}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:6} },
      { problemCount:6, cognitiveChange:"Mix ×5 and ×6 — compares the +1-group relationship.", keepsSame:"b is 5 or 6.", dimensions:[{name:"b_range",value:"5-6"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:5,maxB:6} },
      { problemCount:6, cognitiveChange:"Missing factor for ×6.", keepsSame:"b is always 6.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:6} },
      { problemCount:6, cognitiveChange:"Mixed ×5/×6 all forms.", keepsSame:"b is 5 or 6.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:5,maxB:6} }
    )
  },

  {
    id: "mul-review-1",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Review — Multiply by 0 through 6",
    learningObjective: "Student recalls the 0-6 times tables fluently and applies the strategies learned so far.",
    gradeLevel: "Grade 3", difficultyStars: 3, sheetRange: [17,18], isReview: true,
    reviewOf: ["mul-0","mul-1","mul-2","mul-5","mul-10","mul-3","mul-4","mul-6"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review ×0 through ×3 facts.", keepsSame:"Single digit factors.", dimensions:[{name:"b_range",value:"0-3"}], questionForms:["a*b"], constraints:{minA:0,maxA:9,minB:0,maxB:3} },
      { problemCount:6, cognitiveChange:"Review ×4 through ×6 facts.", keepsSame:"Single digit factors.", dimensions:[{name:"b_range",value:"4-6"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:4,maxB:6} },
      { problemCount:6, cognitiveChange:"Mixed all facts random order, including ×10.", keepsSame:"Single digit a; b ≤ 10.", dimensions:[{name:"b_range",value:"0-10"}], questionForms:["a*b"], constraints:{minA:0,maxA:9,minB:0,maxB:10} },
      { problemCount:6, cognitiveChange:"Missing factor — all facts.", keepsSame:"Single digit factors.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a","missing-factor-b"], constraints:{minA:1,maxA:9,minB:1,maxB:9} },
      { problemCount:6, cognitiveChange:"Mixed forms — standard and missing factor.", keepsSame:"Single digit factors.", dimensions:[{name:"form",value:"all"}], questionForms:["a*b","missing-factor-a","missing-factor-b"], constraints:{minA:1,maxA:9,minB:1,maxB:9} }
    )
  },

  {
    id: "mul-7",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 7",
    learningObjective: "Student applies the ×5+×2 split strategy for the hardest single-digit table: 7×n = (5×n)+(2×n).",
    gradeLevel: "Grade 3", difficultyStars: 3, sheetRange: [19,20], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-3 by 7 — framed as ×5 + ×2.", keepsSame:"b=7 always.", dimensions:[{name:"a_range",value:"1-3"},{name:"b",value:7}], questionForms:["a*b"], constraints:{minA:1,maxA:3,fixedB:7} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×7 table — the classic hard facts).", keepsSame:"b=7 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:7}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:7} },
      { problemCount:6, cognitiveChange:"Mix ×6 and ×7.", keepsSame:"b is 6 or 7.", dimensions:[{name:"b_range",value:"6-7"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:6,maxB:7} },
      { problemCount:6, cognitiveChange:"Missing factor for ×7.", keepsSame:"b is always 7.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:7} },
      { problemCount:6, cognitiveChange:"Mixed ×6/×7 all forms.", keepsSame:"b is 6 or 7.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:6,maxB:7} }
    )
  },

  {
    id: "mul-8",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 8",
    learningObjective: "Student applies the double-double-double strategy: 8×n = 2×(2×(2×n)).",
    gradeLevel: "Grade 3", difficultyStars: 3, sheetRange: [21,22], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-3 by 8 — framed as triple-doubling.", keepsSame:"b=8 always.", dimensions:[{name:"a_range",value:"1-3"},{name:"b",value:8}], questionForms:["a*b"], constraints:{minA:1,maxA:3,fixedB:8} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×8 table).", keepsSame:"b=8 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:8}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:8} },
      { problemCount:6, cognitiveChange:"Mix ×7 and ×8.", keepsSame:"b is 7 or 8.", dimensions:[{name:"b_range",value:"7-8"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:7,maxB:8} },
      { problemCount:6, cognitiveChange:"Missing factor for ×8.", keepsSame:"b is always 8.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:8} },
      { problemCount:6, cognitiveChange:"Mixed ×7/×8 all forms.", keepsSame:"b is 7 or 8.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:7,maxB:8} }
    )
  },

  {
    id: "mul-9",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 9",
    learningObjective: "Student applies the ×10-1-group strategy: 9×n = (10×n) - n.",
    gradeLevel: "Grade 3", difficultyStars: 3, sheetRange: [23,24], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-3 by 9 — framed as ×10 minus one group.", keepsSame:"b=9 always.", dimensions:[{name:"a_range",value:"1-3"},{name:"b",value:9}], questionForms:["a*b"], constraints:{minA:1,maxA:3,fixedB:9} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×9 table). Digit-sum-equals-9 pattern noticed.", keepsSame:"b=9 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:9}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:9} },
      { problemCount:6, cognitiveChange:"Mix ×8 and ×9.", keepsSame:"b is 8 or 9.", dimensions:[{name:"b_range",value:"8-9"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:8,maxB:9} },
      { problemCount:6, cognitiveChange:"Missing factor for ×9.", keepsSame:"b is always 9.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:9} },
      { problemCount:6, cognitiveChange:"Mixed ×8/×9 all forms.", keepsSame:"b is 8 or 9.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:8,maxB:9} }
    )
  },

  {
    id: "mul-11",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 11",
    learningObjective: "Student extends times-table fluency past 10 using the ×10+1-group pattern.",
    gradeLevel: "Grade 3-4", difficultyStars: 4, sheetRange: [25,26], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 11 — framed as ×10 plus one more group.", keepsSame:"b=11 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:11}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:11} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×11 table).", keepsSame:"b=11 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:11}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:11} },
      { problemCount:6, cognitiveChange:"Mix ×10 and ×11.", keepsSame:"b is 10 or 11.", dimensions:[{name:"b_range",value:"10-11"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:10,maxB:11} },
      { problemCount:6, cognitiveChange:"Missing factor for ×11.", keepsSame:"b is always 11.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:11} },
      { problemCount:6, cognitiveChange:"Mixed ×10/×11 all forms.", keepsSame:"b is 10 or 11.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:10,maxB:11} }
    )
  },

  {
    id: "mul-12",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multiply by 12",
    learningObjective: "Student completes the full 0-12 times table using the ×10+×2 split strategy.",
    gradeLevel: "Grade 3-4", difficultyStars: 4, sheetRange: [27,28], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiply 1-4 by 12 — framed as ×10 + ×2.", keepsSame:"b=12 always.", dimensions:[{name:"a_range",value:"1-4"},{name:"b",value:12}], questionForms:["a*b"], constraints:{minA:1,maxA:4,fixedB:12} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9 (full ×12 table — completes 0-12).", keepsSame:"b=12 always.", dimensions:[{name:"a_range",value:"1-9"},{name:"b",value:12}], questionForms:["a*b"], constraints:{minA:1,maxA:9,fixedB:12} },
      { problemCount:6, cognitiveChange:"Mix ×11 and ×12.", keepsSame:"b is 11 or 12.", dimensions:[{name:"b_range",value:"11-12"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:11,maxB:12} },
      { problemCount:6, cognitiveChange:"Missing factor for ×12.", keepsSame:"b is always 12.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a"], constraints:{minA:1,maxA:9,fixedB:12} },
      { problemCount:6, cognitiveChange:"Mixed ×11/×12 all forms.", keepsSame:"b is 11 or 12.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a*b","missing-factor-a"], constraints:{minA:1,maxA:9,minB:11,maxB:12} }
    )
  },

  {
    id: "mul-review-2",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Review — Full 0-12 times tables",
    learningObjective: "Student recalls all single-digit-by-up-to-12 multiplication facts fluently.",
    gradeLevel: "Grade 4", difficultyStars: 4, sheetRange: [29,30], isReview: true,
    reviewOf: ["mul-7","mul-8","mul-9","mul-11","mul-12"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review ×7 through ×9 facts — the hardest single-digit tables.", keepsSame:"a is 1-9.", dimensions:[{name:"b_range",value:"7-9"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:7,maxB:9} },
      { problemCount:6, cognitiveChange:"Review ×10 through ×12 facts.", keepsSame:"a is 1-9.", dimensions:[{name:"b_range",value:"10-12"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:10,maxB:12} },
      { problemCount:6, cognitiveChange:"Mixed — any fact from 0-12 in random order.", keepsSame:"a is 1-9.", dimensions:[{name:"b_range",value:"0-12"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:0,maxB:12} },
      { problemCount:6, cognitiveChange:"Missing factor — full range.", keepsSame:"a is 1-9.", dimensions:[{name:"form",value:"missing-factor"}], questionForms:["missing-factor-a","missing-factor-b"], constraints:{minA:1,maxA:9,minB:1,maxB:12} },
      { problemCount:6, cognitiveChange:"All forms mixed — standard and missing factor.", keepsSame:"a is 1-9.", dimensions:[{name:"form",value:"all"}], questionForms:["a*b","missing-factor-a","missing-factor-b"], constraints:{minA:1,maxA:9,minB:1,maxB:12} }
    )
  },

  {
    id: "mul-2d-1d",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "2-digit × 1-digit",
    learningObjective: "Student multiplies a 2-digit number by a single digit using the standard algorithm with regrouping.",
    gradeLevel: "Grade 4", difficultyStars: 4, sheetRange: [31,40], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Multiples of 10 × single digit. Only the tens column is active — no regrouping.", keepsSame:"Ones digit of a is 0.", dimensions:[{name:"a",value:"multiples of 10"},{name:"regroup",value:false}], questionForms:["a*b"], constraints:{minA:10,maxA:40,minB:2,maxB:9,carry:false} },
      { problemCount:6, cognitiveChange:"2-digit × 1-digit with no regrouping (ones product < 10).", keepsSame:"No regrouping needed.", dimensions:[{name:"regroup",value:false}], questionForms:["a*b"], constraints:{minA:11,maxA:33,minB:2,maxB:3,carry:false} },
      { problemCount:6, cognitiveChange:"Regrouping introduced — ones product ≥ 10, carry into tens.", keepsSame:"2-digit × 1-digit.", dimensions:[{name:"regroup",value:true}], questionForms:["a*b"], constraints:{minA:14,maxA:48,minB:3,maxB:7,carry:true} },
      { problemCount:6, cognitiveChange:"Full range — factors up to 99 × 9, mixed regrouping.", keepsSame:"2-digit × 1-digit.", dimensions:[{name:"range",value:"up to 99×9"}], questionForms:["a*b"], constraints:{minA:11,maxA:99,minB:2,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Word problems — 2-digit × 1-digit with regrouping.", keepsSame:"2-digit × 1-digit.", dimensions:[{name:"form",value:"word"}], questionForms:["a*b","word-mul"], constraints:{minA:11,maxA:99,minB:2,maxB:9,carry:true} }
    )
  },

  {
    id: "mul-review-3",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Review — times tables and 2-digit × 1-digit",
    learningObjective: "Student consolidates times-table fluency and the 2-digit multiplication algorithm.",
    gradeLevel: "Grade 4", difficultyStars: 4, sheetRange: [41,42], isReview: true,
    reviewOf: ["mul-review-2","mul-2d-1d"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review single-digit × single-digit facts.", keepsSame:"a is 1-9.", dimensions:[{name:"type",value:"single×single"}], questionForms:["a*b"], constraints:{minA:1,maxA:9,minB:1,maxB:12} },
      { problemCount:6, cognitiveChange:"Review 2-digit × 1-digit no regrouping.", keepsSame:"No carry.", dimensions:[{name:"type",value:"2d×1d no carry"}], questionForms:["a*b"], constraints:{minA:11,maxA:43,minB:2,maxB:4,carry:false} },
      { problemCount:6, cognitiveChange:"Review 2-digit × 1-digit with regrouping.", keepsSame:"Carry happens.", dimensions:[{name:"type",value:"2d×1d carry"}], questionForms:["a*b"], constraints:{minA:14,maxA:99,minB:3,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Word problem context introduced.", keepsSame:"2-digit × 1-digit.", dimensions:[{name:"form",value:"word"}], questionForms:["word-mul"], constraints:{minA:11,maxA:79,minB:2,maxB:9} },
      { problemCount:6, cognitiveChange:"Mixed — equations and word problems, all carry types.", keepsSame:"2-digit × 1-digit.", dimensions:[{name:"form",value:"all"}], questionForms:["a*b","word-mul"], constraints:{minA:11,maxA:99,minB:2,maxB:9} }
    )
  },

  {
    id: "mul-2d-2d",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "2-digit × 2-digit",
    learningObjective: "Student multiplies two 2-digit numbers using the standard algorithm with partial products.",
    gradeLevel: "Grade 4-5", difficultyStars: 5, sheetRange: [43,60], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"2-digit × multiple of 10. Only one partial product needed — place-value shift.", keepsSame:"b is a multiple of 10.", dimensions:[{name:"b",value:"multiples of 10"},{name:"partials",value:1}], questionForms:["a*b"], constraints:{minA:11,maxA:44,minB:10,maxB:40,carry:false} },
      { problemCount:6, cognitiveChange:"2-digit × 2-digit, no regrouping in either partial product.", keepsSame:"No regrouping.", dimensions:[{name:"regroup",value:false}], questionForms:["a*b"], constraints:{minA:11,maxA:33,minB:11,maxB:23,carry:false} },
      { problemCount:6, cognitiveChange:"Regrouping in one partial product. Two partial products must be added.", keepsSame:"2-digit × 2-digit.", dimensions:[{name:"partials",value:2},{name:"regroup",value:"partial"}], questionForms:["a*b"], constraints:{minA:23,maxA:58,minB:14,maxB:37,carry:true} },
      { problemCount:6, cognitiveChange:"Full range — both partial products regroup.", keepsSame:"2-digit × 2-digit.", dimensions:[{name:"range",value:"up to 99×99"}], questionForms:["a*b"], constraints:{minA:23,maxA:99,minB:12,maxB:99,carry:true} },
      { problemCount:6, cognitiveChange:"Word problems — 2-digit × 2-digit.", keepsSame:"2-digit × 2-digit.", dimensions:[{name:"form",value:"word"}], questionForms:["a*b","word-mul"], constraints:{minA:23,maxA:99,minB:12,maxB:99,carry:true} }
    )
  },

  {
    id: "mul-word",
    levelCode: "M5", skill: "MULTIPLICATION",
    name: "Multi-step multiplication word problems",
    learningObjective: "Student applies multiplication fluently within multi-step real-world contexts, including arrays and equal groups.",
    gradeLevel: "Grade 5", difficultyStars: 5, sheetRange: [61,72], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Equation review — single-digit and 2-digit × 1-digit facts as a warm-up.", keepsSame:"Standard equation form.", dimensions:[{name:"form",value:"equation"}], questionForms:["a*b"], constraints:{minA:2,maxA:40,minB:2,maxB:9} },
      { problemCount:6, cognitiveChange:"Single-step equal-groups word problems with single-digit factors.", keepsSame:"One multiplication step.", dimensions:[{name:"steps",value:1},{name:"context",value:"equal groups"}], questionForms:["a*b","word-mul"], constraints:{minA:2,maxA:9,minB:2,maxB:9} },
      { problemCount:6, cognitiveChange:"Single-step problems with 2-digit factors.", keepsSame:"One multiplication step.", dimensions:[{name:"steps",value:1},{name:"factors",value:"2-digit"}], questionForms:["a*b","word-mul"], constraints:{minA:11,maxA:40,minB:2,maxB:9} },
      { problemCount:6, cognitiveChange:"Array and area-model contexts — connects multiplication to visual structure.", keepsSame:"One multiplication step.", dimensions:[{name:"context",value:"array/area"}], questionForms:["word-mul"], constraints:{minA:5,maxA:20,minB:5,maxB:20} },
      { problemCount:6, cognitiveChange:"Independent application — student selects the multiplication strategy without scaffolding, full-range factors.", keepsSame:"Single multiplication operation.", dimensions:[{name:"form",value:"independent"}], questionForms:["word-mul","a*b"], constraints:{minA:11,maxA:99,minB:2,maxB:99} }
    )
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// M6 — DIVISION
// ─────────────────────────────────────────────────────────────────────────────

const divisionMicroSkills: MicroSkill[] = [

  {
    id: "div-1",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 1",
    learningObjective: "Student understands that dividing by 1 leaves a number unchanged — the inverse of ×1.",
    gradeLevel: "Grade 3", difficultyStars: 1, sheetRange: [1,2], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide 1-4 by 1 — the quotient equals the dividend.", keepsSame:"Divisor is always 1.", dimensions:[{name:"q_range",value:"1-4"},{name:"divisor",value:1}], questionForms:["a/b"], constraints:{minA:1,maxA:4,fixedB:1} },
      { problemCount:6, cognitiveChange:"Range expands to 1-9.", keepsSame:"Divisor is always 1.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:1}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:1} },
      { problemCount:6, cognitiveChange:"Connects to the inverse ×1 fact — student sees division undoes multiplication.", keepsSame:"Divisor is 1.", dimensions:[{name:"connection",value:"inverse of ×1"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:1} },
      { problemCount:6, cognitiveChange:"Missing dividend: ___ ÷ 1 = q.", keepsSame:"Divisor is 1.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:1} },
      { problemCount:6, cognitiveChange:"Mixed standard and missing-dividend forms.", keepsSame:"Divisor is 1.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,fixedB:1} }
    )
  },

  {
    id: "div-2",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 2",
    learningObjective: "Student connects ÷2 to halving and to the inverse of the ×2 fact family.",
    gradeLevel: "Grade 3", difficultyStars: 1, sheetRange: [3,4], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide by 2 — framed as halving — quotients 1-4.", keepsSame:"Divisor is always 2.", dimensions:[{name:"q_range",value:"1-4"},{name:"divisor",value:2}], questionForms:["a/b"], constraints:{minA:1,maxA:4,fixedB:2} },
      { problemCount:6, cognitiveChange:"Quotient range expands to 1-9 (full ÷2 facts).", keepsSame:"Divisor is always 2.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:2}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:2} },
      { problemCount:6, cognitiveChange:"Mix ÷1 and ÷2 — compares the two inverse families.", keepsSame:"Divisor is 1 or 2.", dimensions:[{name:"divisor_range",value:"1-2"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:1,maxB:2} },
      { problemCount:6, cognitiveChange:"Missing dividend for ÷2.", keepsSame:"Divisor is 2.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:2} },
      { problemCount:6, cognitiveChange:"Mixed ÷1/÷2 all forms.", keepsSame:"Divisor is 1 or 2.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:1,maxB:2} }
    )
  },

  {
    id: "div-5",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 5",
    learningObjective: "Student applies the inverse of the ×5 skip-count pattern to divide by 5.",
    gradeLevel: "Grade 3", difficultyStars: 2, sheetRange: [5,6], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide by 5 — quotients 1-4.", keepsSame:"Divisor is always 5.", dimensions:[{name:"q_range",value:"1-4"},{name:"divisor",value:5}], questionForms:["a/b"], constraints:{minA:1,maxA:4,fixedB:5} },
      { problemCount:6, cognitiveChange:"Quotient range expands to 1-9 (full ÷5 facts).", keepsSame:"Divisor is always 5.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:5}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:5} },
      { problemCount:6, cognitiveChange:"Mix ÷2 and ÷5.", keepsSame:"Divisor is 2 or 5.", dimensions:[{name:"divisor_range",value:"2 or 5"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:2,maxB:5} },
      { problemCount:6, cognitiveChange:"Missing dividend for ÷5.", keepsSame:"Divisor is 5.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:5} },
      { problemCount:6, cognitiveChange:"Mixed ÷2/÷5 all forms.", keepsSame:"Divisor is 2 or 5.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:2,maxB:5} }
    )
  },

  {
    id: "div-10",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 10",
    learningObjective: "Student recognizes that dividing by 10 removes a trailing zero (inverse place-value shift).",
    gradeLevel: "Grade 3", difficultyStars: 2, sheetRange: [7,8], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide multiples of 10 by 10 — quotients 1-4.", keepsSame:"Divisor is always 10.", dimensions:[{name:"q_range",value:"1-4"},{name:"divisor",value:10}], questionForms:["a/b"], constraints:{minA:1,maxA:4,fixedB:10} },
      { problemCount:6, cognitiveChange:"Quotient range expands to 1-9 (full ÷10 facts).", keepsSame:"Divisor is always 10.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:10}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:10} },
      { problemCount:6, cognitiveChange:"Mix ÷5 and ÷10.", keepsSame:"Divisor is 5 or 10.", dimensions:[{name:"divisor_range",value:"5 or 10"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:5,maxB:10} },
      { problemCount:6, cognitiveChange:"Missing dividend for ÷10.", keepsSame:"Divisor is 10.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:10} },
      { problemCount:6, cognitiveChange:"Mixed ÷5/÷10 all forms.", keepsSame:"Divisor is 5 or 10.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:5,maxB:10} }
    )
  },

  {
    id: "div-3",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 3",
    learningObjective: "Student applies the inverse of the ×3 table to divide by 3.",
    gradeLevel: "Grade 3", difficultyStars: 2, sheetRange: [9,10], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide by 3 — quotients 1-4.", keepsSame:"Divisor is always 3.", dimensions:[{name:"q_range",value:"1-4"},{name:"divisor",value:3}], questionForms:["a/b"], constraints:{minA:1,maxA:4,fixedB:3} },
      { problemCount:6, cognitiveChange:"Quotient range expands to 1-9 (full ÷3 facts).", keepsSame:"Divisor is always 3.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:3}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:3} },
      { problemCount:6, cognitiveChange:"Mix ÷2 and ÷3.", keepsSame:"Divisor is 2 or 3.", dimensions:[{name:"divisor_range",value:"2-3"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:2,maxB:3} },
      { problemCount:6, cognitiveChange:"Missing dividend for ÷3.", keepsSame:"Divisor is 3.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:3} },
      { problemCount:6, cognitiveChange:"Mixed ÷2/÷3 all forms.", keepsSame:"Divisor is 2 or 3.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:2,maxB:3} }
    )
  },

  {
    id: "div-4",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 4",
    learningObjective: "Student applies the inverse of the ×4 (double-double) strategy to divide by 4.",
    gradeLevel: "Grade 3", difficultyStars: 2, sheetRange: [11,12], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide by 4 — quotients 1-4.", keepsSame:"Divisor is always 4.", dimensions:[{name:"q_range",value:"1-4"},{name:"divisor",value:4}], questionForms:["a/b"], constraints:{minA:1,maxA:4,fixedB:4} },
      { problemCount:6, cognitiveChange:"Quotient range expands to 1-9 (full ÷4 facts).", keepsSame:"Divisor is always 4.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:4}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:4} },
      { problemCount:6, cognitiveChange:"Mix ÷3 and ÷4.", keepsSame:"Divisor is 3 or 4.", dimensions:[{name:"divisor_range",value:"3-4"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:3,maxB:4} },
      { problemCount:6, cognitiveChange:"Missing dividend for ÷4.", keepsSame:"Divisor is 4.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:4} },
      { problemCount:6, cognitiveChange:"Mixed ÷3/÷4 all forms.", keepsSame:"Divisor is 3 or 4.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:3,maxB:4} }
    )
  },

  {
    id: "div-review-1",
    levelCode: "M6", skill: "DIVISION",
    name: "Review — Divide by 1, 2, 3, 4, 5, 10",
    learningObjective: "Student recalls division facts for the easiest divisor families fluently.",
    gradeLevel: "Grade 3", difficultyStars: 2, sheetRange: [13,14], isReview: true,
    reviewOf: ["div-1","div-2","div-5","div-10","div-3","div-4"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review ÷1, ÷2, ÷3 facts.", keepsSame:"Quotients are single digit.", dimensions:[{name:"divisor_range",value:"1-3"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:1,maxB:3} },
      { problemCount:6, cognitiveChange:"Review ÷4, ÷5, ÷10 facts.", keepsSame:"Quotients are single digit.", dimensions:[{name:"divisor_range",value:"4,5,10"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:4,maxB:10} },
      { problemCount:6, cognitiveChange:"Mixed all divisors learned so far, random order.", keepsSame:"Quotients are single digit.", dimensions:[{name:"divisor_range",value:"1-10"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:1,maxB:10} },
      { problemCount:6, cognitiveChange:"Missing dividend — all divisors learned so far.", keepsSame:"Quotients are single digit.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,minB:1,maxB:10} },
      { problemCount:6, cognitiveChange:"Mixed forms — standard and missing dividend.", keepsSame:"Quotients are single digit.", dimensions:[{name:"form",value:"all"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:1,maxB:10} }
    )
  },

  {
    id: "div-6",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 6",
    learningObjective: "Student applies the inverse of the ×6 (×5+1-group) strategy to divide by 6.",
    gradeLevel: "Grade 3-4", difficultyStars: 3, sheetRange: [15,16], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide by 6 — quotients 1-3.", keepsSame:"Divisor is always 6.", dimensions:[{name:"q_range",value:"1-3"},{name:"divisor",value:6}], questionForms:["a/b"], constraints:{minA:1,maxA:3,fixedB:6} },
      { problemCount:6, cognitiveChange:"Quotient range expands to 1-9 (full ÷6 facts).", keepsSame:"Divisor is always 6.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:6}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:6} },
      { problemCount:6, cognitiveChange:"Mix ÷5 and ÷6.", keepsSame:"Divisor is 5 or 6.", dimensions:[{name:"divisor_range",value:"5-6"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:5,maxB:6} },
      { problemCount:6, cognitiveChange:"Missing dividend for ÷6.", keepsSame:"Divisor is 6.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:6} },
      { problemCount:6, cognitiveChange:"Mixed ÷5/÷6 all forms.", keepsSame:"Divisor is 5 or 6.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:5,maxB:6} }
    )
  },

  {
    id: "div-7",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 7",
    learningObjective: "Student applies the inverse of the ×7 (hardest single-digit) facts to divide by 7.",
    gradeLevel: "Grade 3-4", difficultyStars: 3, sheetRange: [17,18], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide by 7 — quotients 1-3.", keepsSame:"Divisor is always 7.", dimensions:[{name:"q_range",value:"1-3"},{name:"divisor",value:7}], questionForms:["a/b"], constraints:{minA:1,maxA:3,fixedB:7} },
      { problemCount:6, cognitiveChange:"Quotient range expands to 1-9 (full ÷7 facts).", keepsSame:"Divisor is always 7.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:7}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:7} },
      { problemCount:6, cognitiveChange:"Mix ÷6 and ÷7.", keepsSame:"Divisor is 6 or 7.", dimensions:[{name:"divisor_range",value:"6-7"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:6,maxB:7} },
      { problemCount:6, cognitiveChange:"Missing dividend for ÷7.", keepsSame:"Divisor is 7.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:7} },
      { problemCount:6, cognitiveChange:"Mixed ÷6/÷7 all forms.", keepsSame:"Divisor is 6 or 7.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:6,maxB:7} }
    )
  },

  {
    id: "div-8",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 8",
    learningObjective: "Student applies the inverse of the ×8 (triple-double) strategy to divide by 8.",
    gradeLevel: "Grade 3-4", difficultyStars: 3, sheetRange: [19,20], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide by 8 — quotients 1-3.", keepsSame:"Divisor is always 8.", dimensions:[{name:"q_range",value:"1-3"},{name:"divisor",value:8}], questionForms:["a/b"], constraints:{minA:1,maxA:3,fixedB:8} },
      { problemCount:6, cognitiveChange:"Quotient range expands to 1-9 (full ÷8 facts).", keepsSame:"Divisor is always 8.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:8}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:8} },
      { problemCount:6, cognitiveChange:"Mix ÷7 and ÷8.", keepsSame:"Divisor is 7 or 8.", dimensions:[{name:"divisor_range",value:"7-8"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:7,maxB:8} },
      { problemCount:6, cognitiveChange:"Missing dividend for ÷8.", keepsSame:"Divisor is 8.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:8} },
      { problemCount:6, cognitiveChange:"Mixed ÷7/÷8 all forms.", keepsSame:"Divisor is 7 or 8.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:7,maxB:8} }
    )
  },

  {
    id: "div-9",
    levelCode: "M6", skill: "DIVISION",
    name: "Divide by 9",
    learningObjective: "Student applies the inverse of the ×9 (×10-1-group) strategy to divide by 9.",
    gradeLevel: "Grade 3-4", difficultyStars: 3, sheetRange: [21,22], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide by 9 — quotients 1-3.", keepsSame:"Divisor is always 9.", dimensions:[{name:"q_range",value:"1-3"},{name:"divisor",value:9}], questionForms:["a/b"], constraints:{minA:1,maxA:3,fixedB:9} },
      { problemCount:6, cognitiveChange:"Quotient range expands to 1-9 (full ÷9 facts).", keepsSame:"Divisor is always 9.", dimensions:[{name:"q_range",value:"1-9"},{name:"divisor",value:9}], questionForms:["a/b"], constraints:{minA:1,maxA:9,fixedB:9} },
      { problemCount:6, cognitiveChange:"Mix ÷8 and ÷9.", keepsSame:"Divisor is 8 or 9.", dimensions:[{name:"divisor_range",value:"8-9"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:8,maxB:9} },
      { problemCount:6, cognitiveChange:"Missing dividend for ÷9.", keepsSame:"Divisor is 9.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,fixedB:9} },
      { problemCount:6, cognitiveChange:"Mixed ÷8/÷9 all forms.", keepsSame:"Divisor is 8 or 9.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:8,maxB:9} }
    )
  },

  {
    id: "div-review-2",
    levelCode: "M6", skill: "DIVISION",
    name: "Review — Full ÷1 through ÷10 facts",
    learningObjective: "Student recalls all single-digit division facts fluently as inverses of the times tables.",
    gradeLevel: "Grade 4", difficultyStars: 3, sheetRange: [23,24], isReview: true,
    reviewOf: ["div-6","div-7","div-8","div-9"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review ÷6, ÷7 facts — the harder divisor families.", keepsSame:"Quotients are single digit.", dimensions:[{name:"divisor_range",value:"6-7"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:6,maxB:7} },
      { problemCount:6, cognitiveChange:"Review ÷8, ÷9 facts.", keepsSame:"Quotients are single digit.", dimensions:[{name:"divisor_range",value:"8-9"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:8,maxB:9} },
      { problemCount:6, cognitiveChange:"Mixed — any divisor 1-10 in random order.", keepsSame:"Quotients are single digit.", dimensions:[{name:"divisor_range",value:"1-10"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:1,maxB:10} },
      { problemCount:6, cognitiveChange:"Missing dividend — full divisor range.", keepsSame:"Quotients are single digit.", dimensions:[{name:"form",value:"missing-dividend"}], questionForms:["missing-dividend"], constraints:{minA:1,maxA:9,minB:1,maxB:10} },
      { problemCount:6, cognitiveChange:"All forms mixed — standard and missing dividend.", keepsSame:"Quotients are single digit.", dimensions:[{name:"form",value:"all"}], questionForms:["a/b","missing-dividend"], constraints:{minA:1,maxA:9,minB:1,maxB:10} }
    )
  },

  {
    id: "div-remainder",
    levelCode: "M6", skill: "DIVISION",
    name: "Division with remainders",
    learningObjective: "Student understands that not all divisions are exact and expresses leftover amounts as remainders.",
    gradeLevel: "Grade 4", difficultyStars: 4, sheetRange: [25,34], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Introduce remainders with small divisors (2-3) — leftover amount is always smaller than the divisor.", keepsSame:"Divisor is small.", dimensions:[{name:"divisor_range",value:"2-3"},{name:"remainder",value:true}], questionForms:["div-remainder"], constraints:{minA:1,maxA:6,minB:2,maxB:3,carry:true} },
      { problemCount:6, cognitiveChange:"Divisor range expands to 2-6.", keepsSame:"Remainder is always present.", dimensions:[{name:"divisor_range",value:"2-6"}], questionForms:["div-remainder"], constraints:{minA:1,maxA:8,minB:2,maxB:6,carry:true} },
      { problemCount:6, cognitiveChange:"Mix exact division and division with remainder — student decides which applies.", keepsSame:"Single-digit divisor.", dimensions:[{name:"form",value:"mixed exact/remainder"}], questionForms:["a/b","div-remainder"], constraints:{minA:1,maxA:9,minB:2,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Divisor range expands to 2-9, larger dividends.", keepsSame:"Single-digit divisor.", dimensions:[{name:"range",value:"wider"}], questionForms:["div-remainder"], constraints:{minA:3,maxA:12,minB:2,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Word problems involving leftover amounts (sharing with remainders).", keepsSame:"Single-digit divisor.", dimensions:[{name:"form",value:"word"}], questionForms:["div-remainder","word-div"], constraints:{minA:3,maxA:12,minB:2,maxB:9,carry:true} }
    )
  },

  {
    id: "div-2d-1d",
    levelCode: "M6", skill: "DIVISION",
    name: "2-digit ÷ 1-digit",
    learningObjective: "Student divides a 2-digit number by a single digit using place-value reasoning and the standard algorithm.",
    gradeLevel: "Grade 4", difficultyStars: 4, sheetRange: [35,52], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"2-digit ÷ 1-digit, exact, dividend is a multiple of the divisor with no regrouping needed.", keepsSame:"Quotient is exact, no remainder.", dimensions:[{name:"regroup",value:false}], questionForms:["a/b"], constraints:{minA:12,maxA:48,minB:2,maxB:4,carry:false} },
      { problemCount:6, cognitiveChange:"2-digit ÷ 1-digit, exact, larger divisors (up to 9).", keepsSame:"Quotient is exact.", dimensions:[{name:"divisor_range",value:"2-9"}], questionForms:["a/b"], constraints:{minA:12,maxA:81,minB:2,maxB:9,carry:false} },
      { problemCount:6, cognitiveChange:"2-digit ÷ 1-digit with remainders introduced.", keepsSame:"2-digit dividend.", dimensions:[{name:"remainder",value:true}], questionForms:["div-remainder"], constraints:{minA:11,maxA:79,minB:3,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Mixed exact and remainder problems, full divisor range.", keepsSame:"2-digit dividend.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","div-remainder"], constraints:{minA:11,maxA:96,minB:2,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Word problems — 2-digit ÷ 1-digit, both exact and remainder contexts.", keepsSame:"2-digit dividend.", dimensions:[{name:"form",value:"word"}], questionForms:["a/b","div-remainder","word-div"], constraints:{minA:11,maxA:96,minB:2,maxB:9,carry:true} }
    )
  },

  {
    id: "div-review-3",
    levelCode: "M6", skill: "DIVISION",
    name: "Review — division facts and 2-digit ÷ 1-digit",
    learningObjective: "Student consolidates fluency with division facts, remainders, and the 2-digit division algorithm.",
    gradeLevel: "Grade 4", difficultyStars: 4, sheetRange: [53,54], isReview: true,
    reviewOf: ["div-review-2","div-remainder","div-2d-1d"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review single-digit division facts.", keepsSame:"Quotients are single digit.", dimensions:[{name:"type",value:"single-digit facts"}], questionForms:["a/b"], constraints:{minA:1,maxA:9,minB:1,maxB:10,carry:false} },
      { problemCount:6, cognitiveChange:"Review division with remainders.", keepsSame:"Remainder present.", dimensions:[{name:"type",value:"remainder"}], questionForms:["div-remainder"], constraints:{minA:3,maxA:12,minB:2,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Review 2-digit ÷ 1-digit, exact.", keepsSame:"2-digit dividend.", dimensions:[{name:"type",value:"2d÷1d exact"}], questionForms:["a/b"], constraints:{minA:12,maxA:81,minB:2,maxB:9,carry:false} },
      { problemCount:6, cognitiveChange:"Review 2-digit ÷ 1-digit with remainder.", keepsSame:"2-digit dividend.", dimensions:[{name:"type",value:"2d÷1d remainder"}], questionForms:["div-remainder"], constraints:{minA:11,maxA:96,minB:2,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Mixed — all division types and word problems.", keepsSame:"2-digit dividend.", dimensions:[{name:"form",value:"all"}], questionForms:["a/b","div-remainder","word-div"], constraints:{minA:11,maxA:96,minB:2,maxB:9,carry:true} }
    )
  },

  {
    id: "div-word",
    levelCode: "M6", skill: "DIVISION",
    name: "Multi-step division word problems",
    learningObjective: "Student applies division fluently within real-world equal-sharing and grouping contexts, including remainders.",
    gradeLevel: "Grade 5", difficultyStars: 4, sheetRange: [55,72], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Equation review — single-digit and 2-digit ÷ 1-digit facts as a warm-up.", keepsSame:"Standard equation form.", dimensions:[{name:"form",value:"equation"}], questionForms:["a/b"], constraints:{minA:2,maxA:81,minB:2,maxB:9,carry:false} },
      { problemCount:6, cognitiveChange:"Single-step equal-sharing word problems with exact quotients.", keepsSame:"One division step.", dimensions:[{name:"steps",value:1},{name:"context",value:"equal sharing"}], questionForms:["a/b","word-div"], constraints:{minA:12,maxA:81,minB:2,maxB:9,carry:false} },
      { problemCount:6, cognitiveChange:"Word problems involving remainders — student interprets the leftover in context.", keepsSame:"One division step.", dimensions:[{name:"context",value:"remainder interpretation"}], questionForms:["div-remainder","word-div"], constraints:{minA:11,maxA:96,minB:2,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Mixed equation and word-problem forms, exact and remainder.", keepsSame:"Single division operation.", dimensions:[{name:"form",value:"mixed"}], questionForms:["a/b","div-remainder","word-div"], constraints:{minA:11,maxA:96,minB:2,maxB:9,carry:true} },
      { problemCount:6, cognitiveChange:"Independent application — student selects the strategy without scaffolding, full range.", keepsSame:"Single division operation.", dimensions:[{name:"form",value:"independent"}], questionForms:["word-div","a/b","div-remainder"], constraints:{minA:11,maxA:96,minB:2,maxB:9,carry:true} }
    )
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// M7 — FRACTIONS
// ─────────────────────────────────────────────────────────────────────────────

const fractionMicroSkills: MicroSkill[] = [

  {
    id: "frac-identify-halves",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Identify halves",
    learningObjective: "Student recognizes 1/2 as one equal part out of two equal parts.",
    gradeLevel: "Grade 3-4", difficultyStars: 1, sheetRange: [1,2], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Visual only: shape described with 2 equal parts, 1 shaded. Student reads description, writes fraction.", keepsSame:"Denominator=2. Numerator=1. Description format only.", dimensions:[{name:"denominator",value:2},{name:"numerator",value:1},{name:"representation",value:"description"}], questionForms:["identify-frac-desc"], constraints:{denominator:2} },
      { problemCount:6, cognitiveChange:"Context varies: pizza, ribbon, rectangle. Same fraction 1/2 but different real-world objects.", keepsSame:"Denominator=2. Numerator=1. Answer is always 1/2.", dimensions:[{name:"context",value:"varied"},{name:"representation",value:"context"}], questionForms:["identify-frac-context"], constraints:{denominator:2} },
      { problemCount:6, cognitiveChange:"Numerator can now be 1 or 2. Student distinguishes 1/2 from 2/2 (whole).", keepsSame:"Denominator=2. Format: description.", dimensions:[{name:"numerator",value:"1 or 2"},{name:"representation",value:"symbolic"}], questionForms:["identify-frac"], constraints:{denominator:2} },
      { problemCount:6, cognitiveChange:"Production: student writes fraction from description independently. No scaffold.", keepsSame:"Denominator=2.", dimensions:[{name:"representation",value:"production"}], questionForms:["write-frac"], constraints:{denominator:2} },
      { problemCount:6, cognitiveChange:"Mixed: description, context, and write forms. Same skill, all representations.", keepsSame:"Denominator=2 only. No new operation.", dimensions:[{name:"representation",value:"mixed"}], questionForms:["identify-frac","identify-frac-context","write-frac"], constraints:{denominator:2} }
    )
  },

  {
    id: "frac-identify-thirds",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Identify thirds",
    learningObjective: "Student recognizes 1/3 and 2/3 as equal parts of a whole divided into three equal parts.",
    gradeLevel: "Grade 3-4", difficultyStars: 1, sheetRange: [3,4], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"1/3 only. New denominator introduced. Shape context.", keepsSame:"Denominator=3. Numerator=1.", dimensions:[{name:"denominator",value:3},{name:"numerator",value:1}], questionForms:["identify-frac"], constraints:{denominator:3,representation:["shape"]} },
      { problemCount:6, cognitiveChange:"2/3 introduced. New numerator with same denominator.", keepsSame:"Denominator=3.", dimensions:[{name:"numerator",value:"1 or 2"}], questionForms:["identify-frac"], constraints:{denominator:3} },
      { problemCount:6, cognitiveChange:"Mixed 1/3 and 2/3 with varied contexts.", keepsSame:"Denominator=3.", dimensions:[{name:"context",value:"varied"}], questionForms:["identify-frac"], constraints:{denominator:3} },
      { problemCount:6, cognitiveChange:"Mix halves and thirds. Student must identify denominator.", keepsSame:"Denominator is 2 or 3.", dimensions:[{name:"denominator",value:"2 or 3"}], questionForms:["identify-frac"], constraints:{denominators:[2,3]} },
      { problemCount:6, cognitiveChange:"All forms — write and identify halves and thirds.", keepsSame:"Denominator 2 or 3.", dimensions:[{name:"form",value:"all"}], questionForms:["identify-frac","write-frac"], constraints:{denominators:[2,3]} }
    )
  },

  {
    id: "frac-identify-fourths",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Identify fourths",
    learningObjective: "Student recognizes fractions with denominator 4, noting that 2/4 = 1/2.",
    gradeLevel: "Grade 3-4", difficultyStars: 1, sheetRange: [5,6], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"1/4 only. Smallest unit of fourths.", keepsSame:"Denominator=4. Numerator=1.", dimensions:[{name:"denominator",value:4},{name:"numerator",value:1}], questionForms:["identify-frac"], constraints:{denominator:4} },
      { problemCount:6, cognitiveChange:"2/4 and 3/4 introduced. Full range of fourths.", keepsSame:"Denominator=4.", dimensions:[{name:"numerator",value:"1-3"}], questionForms:["identify-frac"], constraints:{denominator:4} },
      { problemCount:6, cognitiveChange:"2/4 = 1/2 connection made. Equivalence concept seeded.", keepsSame:"Fourths and halves only.", dimensions:[{name:"equivalence_hint",value:true}], questionForms:["identify-frac"], constraints:{denominators:[2,4]} },
      { problemCount:6, cognitiveChange:"Mix halves, thirds, fourths. Three denominators.", keepsSame:"Denominators 2, 3, or 4.", dimensions:[{name:"denominators",value:"2,3,4 (fourths-weighted)"}], questionForms:["identify-frac"], constraints:{denominators:[4,4,4,2,3]} },
      { problemCount:6, cognitiveChange:"All forms — write and identify with denominators 2-4.", keepsSame:"Denominators 2-4.", dimensions:[{name:"form",value:"all"}], questionForms:["identify-frac","write-frac"], constraints:{denominators:[4,4,4,2,3]} }
    )
  },

  {
    id: "frac-identify-fifths-sixths",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Identify fifths and sixths",
    learningObjective: "Student extends fraction identification to denominators 5 and 6.",
    gradeLevel: "Grade 4", difficultyStars: 2, sheetRange: [7,8], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Fifths introduced — denominator 5.", keepsSame:"Denominator=5.", dimensions:[{name:"denominator",value:5}], questionForms:["identify-frac"], constraints:{denominator:5} },
      { problemCount:6, cognitiveChange:"Sixths introduced — denominator 6.", keepsSame:"Denominator=6.", dimensions:[{name:"denominator",value:6}], questionForms:["identify-frac"], constraints:{denominator:6} },
      { problemCount:6, cognitiveChange:"Mix fifths and sixths.", keepsSame:"Denominators 5 or 6.", dimensions:[{name:"denominators",value:"5,6"}], questionForms:["identify-frac"], constraints:{denominators:[5,6]} },
      { problemCount:6, cognitiveChange:"Mix all denominators 2-6.", keepsSame:"Denominators 2-6.", dimensions:[{name:"denominators",value:"2-6"}], questionForms:["identify-frac"], constraints:{denominators:[2,3,4,5,6]} },
      { problemCount:6, cognitiveChange:"All forms — write and identify denominators 2-6.", keepsSame:"Denominators 2-6.", dimensions:[{name:"form",value:"all"}], questionForms:["identify-frac","write-frac"], constraints:{denominators:[2,3,4,5,6]} }
    )
  },

  {
    id: "frac-identify-review",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Review — identify fractions",
    learningObjective: "Student fluently identifies all fractions with denominators 2 through 8.",
    gradeLevel: "Grade 4", difficultyStars: 2, sheetRange: [9,10], isReview: true,
    reviewOf: ["frac-identify-halves","frac-identify-thirds","frac-identify-fourths","frac-identify-fifths-sixths"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Review denominators 2 and 3.", keepsSame:"Denominators 2-3.", dimensions:[{name:"denominators",value:"2,3"}], questionForms:["identify-frac"], constraints:{denominators:[2,3]} },
      { problemCount:6, cognitiveChange:"Review denominators 4 and 5.", keepsSame:"Denominators 4-5.", dimensions:[{name:"denominators",value:"4,5"}], questionForms:["identify-frac"], constraints:{denominators:[4,5]} },
      { problemCount:6, cognitiveChange:"Review denominators 6, 8, 10.", keepsSame:"Larger denominators.", dimensions:[{name:"denominators",value:"6,8,10"}], questionForms:["identify-frac"], constraints:{denominators:[6,8,10]} },
      { problemCount:6, cognitiveChange:"Full mixed review 2-10.", keepsSame:"All denominators.", dimensions:[{name:"denominators",value:"2-10"}], questionForms:["identify-frac"], constraints:{maxDenominator:10} },
      { problemCount:6, cognitiveChange:"Write fraction from description — all denominators.", keepsSame:"All denominators.", dimensions:[{name:"form",value:"write"}], questionForms:["write-frac"], constraints:{maxDenominator:10} }
    )
  },

  {
    id: "frac-simplify-gcf2",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Simplify fractions — GCF of 2",
    learningObjective: "Student simplifies fractions by dividing numerator and denominator by 2.",
    gradeLevel: "Grade 4-5", difficultyStars: 2, sheetRange: [11,13], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Simplify 2/4 and 2/6 — GCF=2 obvious.", keepsSame:"GCF is always 2.", dimensions:[{name:"GCF",value:2},{name:"denominator",value:"4 or 6"}], questionForms:["simplify-frac"], constraints:{denominators:[4,6]} },
      { problemCount:6, cognitiveChange:"Simplify 2/8, 4/8 — GCF=2. Denominator 8.", keepsSame:"GCF is always 2.", dimensions:[{name:"GCF",value:2},{name:"denominator",value:8}], questionForms:["simplify-frac"], constraints:{denominator:8} },
      { problemCount:6, cognitiveChange:"Simplify 2/10, 4/10, 6/10 — GCF=2. Denominator 10.", keepsSame:"GCF is always 2.", dimensions:[{name:"GCF",value:2},{name:"denominator",value:10}], questionForms:["simplify-frac"], constraints:{denominator:10} },
      { problemCount:6, cognitiveChange:"Mixed even denominators 4,6,8,10.", keepsSame:"GCF is always 2.", dimensions:[{name:"GCF",value:2},{name:"denominators",value:"4,6,8,10"}], questionForms:["simplify-frac"], constraints:{denominators:[4,6,8,10]} },
      { problemCount:6, cognitiveChange:"Check if already simplified — mixed true/false.", keepsSame:"GCF is 1 or 2.", dimensions:[{name:"form",value:"check"}], questionForms:["simplify-frac"], constraints:{denominators:[3,4,5,6,8,10]} }
    )
  },

  {
    id: "frac-simplify-gcf3",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Simplify fractions — GCF of 3",
    learningObjective: "Student simplifies fractions by dividing numerator and denominator by 3.",
    gradeLevel: "Grade 4-5", difficultyStars: 2, sheetRange: [14,16], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Simplify 3/9, 6/9 — GCF=3.", keepsSame:"GCF is always 3.", dimensions:[{name:"GCF",value:3},{name:"denominator",value:9}], questionForms:["simplify-frac"], constraints:{denominator:9} },
      { problemCount:6, cognitiveChange:"Simplify 3/6, 3/12 — GCF=3.", keepsSame:"GCF is always 3.", dimensions:[{name:"GCF",value:3},{name:"denominators",value:"6,12"}], questionForms:["simplify-frac"], constraints:{denominators:[6,12]} },
      { problemCount:6, cognitiveChange:"Mixed GCF 2 and 3 problems.", keepsSame:"GCF is 2 or 3.", dimensions:[{name:"GCF",value:"2 or 3"}], questionForms:["simplify-frac"], constraints:{denominators:[4,6,8,9,12]} },
      { problemCount:6, cognitiveChange:"Larger denominators 15, 18, 21.", keepsSame:"GCF is 3.", dimensions:[{name:"GCF",value:3},{name:"denominators",value:"15,18,21"}], questionForms:["simplify-frac"], constraints:{denominators:[15,18,21]} },
      { problemCount:6, cognitiveChange:"Mixed all GCF values learned so far.", keepsSame:"GCF is 2 or 3.", dimensions:[{name:"GCF",value:"mixed"}], questionForms:["simplify-frac"], constraints:{denominators:[4,6,8,9,10,12,15]} }
    )
  },

  {
    id: "frac-add-same",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Add fractions — same denominator",
    learningObjective: "Student adds fractions with the same denominator by adding numerators only.",
    gradeLevel: "Grade 4-5", difficultyStars: 3, sheetRange: [17,22], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Add fractions with denominator 3. Small numerators.", keepsSame:"Denominator=3. Sum < 1.", dimensions:[{name:"denominator",value:3},{name:"sum",value:"<1"}], questionForms:["add-same-frac"], constraints:{denominator:3} },
      { problemCount:6, cognitiveChange:"Denominator 4. Sum may equal 1.", keepsSame:"Same denominator.", dimensions:[{name:"denominator",value:4}], questionForms:["add-same-frac"], constraints:{denominator:4} },
      { problemCount:6, cognitiveChange:"Denominators 5 and 6.", keepsSame:"Same denominator.", dimensions:[{name:"denominators",value:"5,6"}], questionForms:["add-same-frac"], constraints:{denominators:[5,6]} },
      { problemCount:6, cognitiveChange:"Result requires simplification.", keepsSame:"Same denominator.", dimensions:[{name:"simplify_result",value:true}], questionForms:["add-same-frac"], constraints:{denominators:[4,6,8,10]} },
      { problemCount:6, cognitiveChange:"Mixed denominators 3-10. Some simplify, some don't.", keepsSame:"Same denominator.", dimensions:[{name:"denominators",value:"3-10"}], questionForms:["add-same-frac"], constraints:{maxDenominator:10} }
    )
  },

  {
    id: "frac-add-unlike",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Add fractions — unlike denominators",
    learningObjective: "Student finds the LCM of two denominators and adds unlike fractions.",
    gradeLevel: "Grade 5", difficultyStars: 3, sheetRange: [23,30], isReview: false,
    // Progression: Repetition → Fluency → Variation → Mastery
    // Each stage introduces a NEW denominator family so the student always
    // encounters novel LCM challenges, not shuffled repetition of the same pair.
    stages: stages(
      // Stage 1: Anchor — LCM=4 family. Student learns the conversion pattern.
      { problemCount:6, cognitiveChange:"1/2 + 1/4 family. Convert halves to fourths.", keepsSame:"LCM is always 4.", dimensions:[{name:"LCM",value:4},{name:"denominators",value:"2,4"}], questionForms:["add-unlike-frac"], constraints:{denominators:[2,4]} },
      // Stage 2: New family — LCM=6 via halves and thirds. New conversion to learn.
      { problemCount:6, cognitiveChange:"1/2 + 1/3 family. LCM=6 — a new calculation.", keepsSame:"Unlike denominators.", dimensions:[{name:"LCM",value:6},{name:"denominators",value:"2,3"}], questionForms:["add-unlike-frac"], constraints:{denominators:[2,3]} },
      // Stage 3: LCM=6 again but different pair (3 and 6). Recognise the pattern.
      { problemCount:6, cognitiveChange:"1/3 + 1/6 family. LCM=6 from a different angle.", keepsSame:"LCM is still 6.", dimensions:[{name:"LCM",value:6},{name:"denominators",value:"3,6"}], questionForms:["add-unlike-frac"], constraints:{denominators:[3,6]} },
      // Stage 4: Harder — LCM=12. Student must compute, not recall.
      { problemCount:6, cognitiveChange:"3 and 4 denominators. LCM=12. Harder step.", keepsSame:"Must find LCM independently.", dimensions:[{name:"LCM",value:12},{name:"denominators",value:"3,4"}], questionForms:["add-unlike-frac"], constraints:{denominators:[3,4]} },
      // Stage 5: Mixed familiar pairs — student selects the right LCM each time.
      { problemCount:6, cognitiveChange:"Mixed pairs from {2,3,4,5,6}. Student picks LCM.", keepsSame:"Unlike denominators.", dimensions:[{name:"denominators",value:"mixed 2-6"}], questionForms:["add-unlike-frac"], constraints:{denominators:[2,3,4,5,6]} },
      // Stage 6: Mastery — unfamiliar denominators up to 9. No scaffolding.
      { problemCount:6, cognitiveChange:"Unfamiliar denominator pairs (5,7,8,9). Apply the process.", keepsSame:"Find LCM, convert, add.", dimensions:[{name:"denominators",value:"5-9"}], questionForms:["add-unlike-frac"], constraints:{denominators:[5,6,7,8,9]} }
    )
  },

  {
    id: "frac-multiply",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Multiply fractions",
    learningObjective: "Student multiplies fractions by multiplying numerators and denominators separately.",
    gradeLevel: "Grade 5-6", difficultyStars: 4, sheetRange: [31,38], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Halves × halves only. 1/2 × 1/2 = 1/4.", keepsSame:"Both fractions are halves.", dimensions:[{name:"denominators",value:"2,2"}], questionForms:["mul-frac"], constraints:{denominators:[2,2]} },
      { problemCount:6, cognitiveChange:"Thirds introduced. 1/2 × 1/3.", keepsSame:"One fraction is a half.", dimensions:[{name:"denominators",value:"2,3"}], questionForms:["mul-frac"], constraints:{denominators:[2,3]} },
      { problemCount:6, cognitiveChange:"Quarters introduced. Results need simplification.", keepsSame:"Denominators 2-4.", dimensions:[{name:"denominators",value:"2-4"}], questionForms:["mul-frac"], constraints:{denominators:[2,3,4]} },
      { problemCount:6, cognitiveChange:"Denominators up to 6. Mixed pairs.", keepsSame:"Must simplify result.", dimensions:[{name:"denominators",value:"2-6"}], questionForms:["mul-frac"], constraints:{denominators:[2,3,4,5,6]} },
      { problemCount:6, cognitiveChange:"Full range denominators 2-8. Mixed with simplification.", keepsSame:"Multiply and simplify.", dimensions:[{name:"denominators",value:"2-8"}], questionForms:["mul-frac"], constraints:{maxDenominator:8} }
    )
  },

  {
    id: "frac-divide",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Divide fractions",
    learningObjective: "Student divides fractions using the reciprocal rule: a/b ÷ c/d = a/b × d/c.",
    gradeLevel: "Grade 6", difficultyStars: 4, sheetRange: [39,46], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Divide by 1/2 only. Reciprocal = 2/1 = 2.", keepsSame:"Divisor is always 1/2.", dimensions:[{name:"divisor",value:"1/2"}], questionForms:["div-frac"], constraints:{denominators:[2,3]} },
      { problemCount:6, cognitiveChange:"Divide by 1/3. New reciprocal 3/1.", keepsSame:"Divisor is always 1/3.", dimensions:[{name:"divisor",value:"1/3"}], questionForms:["div-frac"], constraints:{denominators:[3,4]} },
      { problemCount:6, cognitiveChange:"Divide by non-unit fractions like 2/3.", keepsSame:"Divisor denominator ≤ 4.", dimensions:[{name:"divisor_type",value:"non-unit"}], questionForms:["div-frac"], constraints:{denominators:[2,3,4]} },
      { problemCount:6, cognitiveChange:"Mixed divisors — denominators up to 6.", keepsSame:"All require reciprocal.", dimensions:[{name:"denominators",value:"2-6"}], questionForms:["div-frac"], constraints:{denominators:[2,3,4,5,6]} },
      { problemCount:6, cognitiveChange:"Full range denominators 2-8. Result simplification required.", keepsSame:"Divide and simplify.", dimensions:[{name:"denominators",value:"2-8"}], questionForms:["div-frac"], constraints:{maxDenominator:8} }
    )
  },

  // ── Fluency & mastery bands (sheets 47-100) ──────────────────────────────
  // These extend the introductory bands above with sustained practice at
  // progressively wider denominator ranges. Each stays a single skill so the
  // student builds speed before the next concept; novelty is enforced by the
  // generator (≤2 identical questions per sheet).
  {
    id: "frac-add-unlike-fluency",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Add fractions — unlike denominators (fluency)",
    learningObjective: "Student adds unlike fractions fluently, choosing the LCM independently.",
    gradeLevel: "Grade 5", difficultyStars: 3, sheetRange: [47,60], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Review base pairs (2,3,4).", keepsSame:"Small denominators.", dimensions:[{name:"denominators",value:"2-4"}], questionForms:["add-unlike-frac"], constraints:{denominators:[2,3,4]} },
      { problemCount:6, cognitiveChange:"Add fifths and sixths.", keepsSame:"Find LCM.", dimensions:[{name:"denominators",value:"2-6"}], questionForms:["add-unlike-frac"], constraints:{denominators:[2,3,4,5,6]} },
      { problemCount:6, cognitiveChange:"Pairs with LCM up to 24.", keepsSame:"Convert then add.", dimensions:[{name:"denominators",value:"3-8"}], questionForms:["add-unlike-frac"], constraints:{denominators:[3,4,6,8]} },
      { problemCount:6, cognitiveChange:"Unfamiliar pairs (5,7,8,9).", keepsSame:"Apply the process.", dimensions:[{name:"denominators",value:"5-9"}], questionForms:["add-unlike-frac"], constraints:{denominators:[5,6,7,8,9]} },
      { problemCount:6, cognitiveChange:"Full range — denominators up to 12.", keepsSame:"Add and simplify.", dimensions:[{name:"denominators",value:"2-12"}], questionForms:["add-unlike-frac"], constraints:{maxDenominator:12} }
    )
  },

  {
    id: "frac-multiply-fluency",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Multiply fractions (fluency)",
    learningObjective: "Student multiplies fractions fluently and simplifies the result.",
    gradeLevel: "Grade 5-6", difficultyStars: 4, sheetRange: [61,75], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Denominators 2-4.", keepsSame:"Multiply across.", dimensions:[{name:"denominators",value:"2-4"}], questionForms:["mul-frac"], constraints:{denominators:[2,3,4]} },
      { problemCount:6, cognitiveChange:"Add fifths and sixths.", keepsSame:"Simplify result.", dimensions:[{name:"denominators",value:"2-6"}], questionForms:["mul-frac"], constraints:{denominators:[2,3,4,5,6]} },
      { problemCount:6, cognitiveChange:"Denominators 4-7.", keepsSame:"Multiply and reduce.", dimensions:[{name:"denominators",value:"4-7"}], questionForms:["mul-frac"], constraints:{denominators:[4,5,6,7]} },
      { problemCount:6, cognitiveChange:"Denominators 5-8.", keepsSame:"Larger products.", dimensions:[{name:"denominators",value:"5-8"}], questionForms:["mul-frac"], constraints:{denominators:[5,6,7,8]} },
      { problemCount:6, cognitiveChange:"Full range — denominators up to 9.", keepsSame:"Multiply and simplify.", dimensions:[{name:"denominators",value:"2-9"}], questionForms:["mul-frac"], constraints:{maxDenominator:9} }
    )
  },

  {
    id: "frac-divide-fluency",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Divide fractions (fluency)",
    learningObjective: "Student divides fractions fluently using the reciprocal rule.",
    gradeLevel: "Grade 6", difficultyStars: 4, sheetRange: [76,88], isReview: false,
    stages: stages(
      { problemCount:6, cognitiveChange:"Denominators 2-4.", keepsSame:"Flip and multiply.", dimensions:[{name:"denominators",value:"2-4"}], questionForms:["div-frac"], constraints:{denominators:[2,3,4]} },
      { problemCount:6, cognitiveChange:"Add fifths and sixths.", keepsSame:"Reciprocal rule.", dimensions:[{name:"denominators",value:"2-6"}], questionForms:["div-frac"], constraints:{denominators:[2,3,4,5,6]} },
      { problemCount:6, cognitiveChange:"Denominators 4-7.", keepsSame:"Divide and reduce.", dimensions:[{name:"denominators",value:"4-7"}], questionForms:["div-frac"], constraints:{denominators:[4,5,6,7]} },
      { problemCount:6, cognitiveChange:"Denominators 5-8.", keepsSame:"Larger quotients.", dimensions:[{name:"denominators",value:"5-8"}], questionForms:["div-frac"], constraints:{denominators:[5,6,7,8]} },
      { problemCount:6, cognitiveChange:"Full range — denominators up to 9.", keepsSame:"Divide and simplify.", dimensions:[{name:"denominators",value:"2-9"}], questionForms:["div-frac"], constraints:{maxDenominator:9} }
    )
  },

  {
    id: "frac-ops-mastery",
    levelCode: "M7", skill: "FRACTIONS",
    name: "Fraction operations — mixed review",
    learningObjective: "Student selects and applies the correct operation across mixed fraction problems.",
    gradeLevel: "Grade 6", difficultyStars: 5, sheetRange: [89,100], isReview: true,
    reviewOf: ["frac-add-unlike","frac-multiply","frac-divide"],
    stages: stages(
      { problemCount:6, cognitiveChange:"Addition refresher.", keepsSame:"Unlike denominators.", dimensions:[{name:"op",value:"add"}], questionForms:["add-unlike-frac"], constraints:{denominators:[2,3,4,5,6]} },
      { problemCount:6, cognitiveChange:"Multiplication refresher.", keepsSame:"Multiply across.", dimensions:[{name:"op",value:"multiply"}], questionForms:["mul-frac"], constraints:{denominators:[2,3,4,5,6]} },
      { problemCount:6, cognitiveChange:"Division refresher.", keepsSame:"Reciprocal rule.", dimensions:[{name:"op",value:"divide"}], questionForms:["div-frac"], constraints:{denominators:[2,3,4,5,6]} },
      { problemCount:6, cognitiveChange:"Add and multiply interleaved.", keepsSame:"Choose the operation.", dimensions:[{name:"op",value:"add/mul"}], questionForms:["add-unlike-frac","mul-frac"], constraints:{denominators:[3,4,5,6,8]} },
      { problemCount:6, cognitiveChange:"All three operations mixed.", keepsSame:"Identify, apply, simplify.", dimensions:[{name:"op",value:"all"}], questionForms:["add-unlike-frac","mul-frac","div-frac"], constraints:{maxDenominator:9} }
    )
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM GRAPH — master registry
// ─────────────────────────────────────────────────────────────────────────────

export const CURRICULUM_GRAPH: Record<string, MicroSkill[]> = {
  ADDITION:    additionMicroSkills,
  SUBTRACTION: subtractionMicroSkills,
  MULTIPLICATION: multiplicationMicroSkills,
  DIVISION:    divisionMicroSkills,
  FRACTIONS:   fractionMicroSkills,
};

// Resolve which micro-skill applies to a given sheet number for a skill
export function getMicroSkillForSheet(skill: string, sheetNumber: number): MicroSkill | null {
  const microSkills = CURRICULUM_GRAPH[skill];
  if (!microSkills) return null;
  return microSkills.find(ms => sheetNumber >= ms.sheetRange[0] && sheetNumber <= ms.sheetRange[1]) ?? null;
}

// Get all micro-skills for a skill in order
export function getMicroSkills(skill: string): MicroSkill[] {
  return CURRICULUM_GRAPH[skill] ?? [];
}
