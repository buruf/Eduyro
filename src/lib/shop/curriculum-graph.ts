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

function stages(
  intro: Omit<Stage, "type"|"label">,
  guided: Omit<Stage, "type"|"label">,
  fluency: Omit<Stage, "type"|"label">,
  independent: Omit<Stage, "type"|"label">,
  mastery: Omit<Stage, "type"|"label">
): Stage[] {
  return [
    { type:"introduction",  label:"Foundation",          ...intro },
    { type:"guided",        label:"Building Fluency",     ...guided },
    { type:"fluency",       label:"Guided Fluency",       ...fluency },
    { type:"independent",   label:"Independent Practice", ...independent },
    { type:"mastery",       label:"Mastery Challenge",    ...mastery },
  ];
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
      { problemCount:6, cognitiveChange:"Missing addend: □+1=c. New cognitive demand — reverse thinking.", keepsSame:"b=1 always. Same sums.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a"], constraints:{minA:1,maxA:9,fixedB:1} },
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
      { problemCount:6, cognitiveChange:"Missing addend for +2: □+2=c and a+□=c.", keepsSame:"b is always 2.", dimensions:[{name:"form",value:"missing-addend"}], questionForms:["missing-addend-a","missing-addend-b"], constraints:{minA:1,maxA:8,fixedB:2} },
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
      { problemCount:6, cognitiveChange:"Mix halves, thirds, fourths. Three denominators.", keepsSame:"Denominators 2, 3, or 4.", dimensions:[{name:"denominators",value:"2,3,4"}], questionForms:["identify-frac"], constraints:{denominators:[2,3,4]} },
      { problemCount:6, cognitiveChange:"All forms — write and identify with denominators 2-4.", keepsSame:"Denominators 2-4.", dimensions:[{name:"form",value:"all"}], questionForms:["identify-frac","write-frac"], constraints:{denominators:[2,3,4]} }
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
    stages: stages(
      { problemCount:6, cognitiveChange:"1/2 + 1/4 family. LCM=4 obvious.", keepsSame:"LCM is always 4.", dimensions:[{name:"LCM",value:4},{name:"denominators",value:"2,4"}], questionForms:["add-unlike-frac"], constraints:{denominators:[2,4]} },
      { problemCount:6, cognitiveChange:"1/2 + 1/3 family. LCM=6.", keepsSame:"LCM is always 6.", dimensions:[{name:"LCM",value:6},{name:"denominators",value:"2,3"}], questionForms:["add-unlike-frac"], constraints:{denominators:[2,3]} },
      { problemCount:6, cognitiveChange:"1/3 + 1/6 family. LCM=6 again — pattern.", keepsSame:"LCM is 6.", dimensions:[{name:"LCM",value:6},{name:"denominators",value:"3,6"}], questionForms:["add-unlike-frac"], constraints:{denominators:[3,6]} },
      { problemCount:6, cognitiveChange:"Denominators 3 and 4. LCM=12. Harder.", keepsSame:"Must find LCM.", dimensions:[{name:"LCM",value:12},{name:"denominators",value:"3,4"}], questionForms:["add-unlike-frac"], constraints:{denominators:[3,4]} },
      { problemCount:6, cognitiveChange:"Mixed unlike denominators 2-9. Student finds LCM independently.", keepsSame:"Unlike denominators.", dimensions:[{name:"denominators",value:"mixed 2-9"}], questionForms:["add-unlike-frac"], constraints:{maxDenominator:9} }
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

];

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM GRAPH — master registry
// ─────────────────────────────────────────────────────────────────────────────

export const CURRICULUM_GRAPH: Record<string, MicroSkill[]> = {
  ADDITION:  additionMicroSkills,
  FRACTIONS: fractionMicroSkills,
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
