// src/lib/worksheet/tutorials.ts
// Generates 5 worked examples with step-by-step solutions for every skill
// Shown once per skill before the child starts practice

export interface ConceptCard {
  title: string;
  formula?: string;
  explanation: string;
  tip?: string;
}

export interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

export interface TutorialContent {
  skillName: string;
  intro: string;
  concepts?: ConceptCard[];
  examples: WorkedExample[];
}

import { getHigherMathMicroLesson, type MicroLesson } from "@/lib/shop/higher-math-engine";

export type { MicroLesson };

/**
 * The lesson for the EXACT micro-skill a student is about to practice. The
 * worked example here must match the upcoming questions (council rule), so we
 * key off the micro-skill label (the practiced unit), NOT the broad level skill.
 *   • Higher math (M13–M18): pull the unit's objective + matching worked example.
 *   • Everything else: getTutorial keyed by the micro-skill label (now stage-
 *     aware, e.g. "Addition — sums to 10" → single-digit examples).
 * Returns null only if no example can be resolved (caller falls back to concept).
 */
export function getMicroSkillLesson(
  subjectSlug: string,
  levelCode: string,
  microSkillLabel: string,
): MicroLesson | null {
  const hm = getHigherMathMicroLesson(levelCode, microSkillLabel);
  if (hm) return hm;
  const t = getTutorial(subjectSlug, microSkillLabel);
  const example = t.examples?.[0];
  if (!example) return null;
  return {
    goal: t.intro,
    bigIdea: t.concepts?.[0]?.explanation ?? t.intro,
    example,
    umbrella: t.skillName,
  };
}

export function getTutorial(subjectSlug: string, skillName: string): TutorialContent {
  const skill = skillName.toLowerCase();

  switch (subjectSlug) {
    case "MATH": return getMathTutorial(skill, skillName);
    case "READING": return getReadingTutorial(skill, skillName);
    case "WRITING": return getWritingTutorial(skill, skillName);
    case "SCIENCE": return getScienceTutorial(skill, skillName);
    default: return getMathTutorial(skill, skillName);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MATH TUTORIALS
// ─────────────────────────────────────────────────────────────────────────────

function getMathTutorial(skill: string, skillName: string): TutorialContent {
  if (skill.includes("counting")) return countingTutorial();
  if (skill.includes("more") || skill.includes("less")) return moreLessTutorial();
  if (skill.includes("number pattern")) return numberPatternsTutorial();
  if (skill.includes("number bond")) return numberBondsTutorial();
  if (skill.includes("addition") || skill.includes("sums") || skill.includes("adding")) return additionTutorial(additionMaxFor(skill));
  if (skill.includes("missing number")) return missingNumbersTutorial();
  if (skill.includes("subtraction")) return subtractionTutorial();
  if (skill.includes("×2") || skill.includes("×3") || skill.includes("×4") || skill.includes("×5") || skill.includes("x2") || skill.includes("x5") || (skill.includes("multiplication") && !skill.includes("polynomial"))) return multiplicationTutorial();
  if (skill.includes("division with remainder")) return divisionRemaindersTutorial();
  if (skill.includes("division")) return divisionTutorial();
  if (skill.includes("identifying fraction")) return fractionIdentificationTutorial();
  if (skill.includes("simplifying fraction")) return fractionSimplificationTutorial();
  if (skill.includes("adding fraction")) return fractionAdditionTutorial();
  if (skill.includes("comparing fraction")) return fractionComparisonTutorial();
  if (skill.includes("fraction")) return fractionIdentificationTutorial();
  if (skill.includes("decimal place value")) return decimalPlaceValueTutorial();
  if (skill.includes("decimal")) return decimalOperationsTutorial();
  if (skill.includes("percentage") || skill.includes("percent")) return percentagesTutorial();
  if (skill.includes("ratio")) return ratiosTutorial();
  if (skill.includes("proportion")) return proportionsTutorial();
  if (skill.includes("unit rate")) return unitRatesTutorial();
  if (skill.includes("one-step") || skill.includes("one step")) return oneStepEquationsTutorial();
  if (skill.includes("two-step") || skill.includes("two step")) return twoStepEquationsTutorial();
  if (skill.includes("inequalit")) return inequalitiesTutorial();
  if (skill.includes("word problem")) return wordProblemsTutorial();
  if (skill.includes("slope") || skill.includes("intercept")) return slopeInterceptTutorial();
  if (skill.includes("graphing line")) return graphingLinesTutorial();
  if (skill.includes("system")) return systemsOfEquationsTutorial();
  if (skill.includes("adding polynomial")) return addingPolynomialsTutorial();
  if (skill.includes("multiplying polynomial")) return multiplyingPolynomialsTutorial();
  if (skill.includes("factor")) return factoringTutorial();
  if (skill.includes("quadratic equation")) return quadraticEquationsTutorial();
  if (skill.includes("quadratic formula")) return quadraticFormulaTutorial();
  if (skill.includes("parabola")) return parabolasTutorial();
  if (skill.includes("function notation")) return functionNotationTutorial();
  if (skill.includes("domain") || skill.includes("range")) return domainRangeTutorial();
  if (skill.includes("inverse function")) return inverseFunctionsTutorial();
  if (skill.includes("right triangle trig")) return rightTriangleTrigTutorial();
  if (skill.includes("unit circle")) return unitCircleTutorial();
  if (skill.includes("trig identit")) return trigIdentitiesTutorial();
  if (skill.includes("logarithm")) return logarithmsTutorial();
  if (skill.includes("exponential")) return exponentialFunctionsTutorial();
  if (skill.includes("complex number")) return complexNumbersTutorial();
  if (skill.includes("limit")) return limitsTutorial();
  if (skill.includes("sequence") || skill.includes("series")) return sequencesTutorial();
  if (skill.includes("vector")) return vectorsTutorial();
  if (skill.includes("derivative")) return derivativesTutorial();
  if (skill.includes("integral")) return integralsTutorial();
  if (skill.includes("application")) return calculusApplicationsTutorial();

  return genericMathTutorial(skillName);
}

function countingTutorial(): TutorialContent {
  return {
    skillName: "Counting",
    intro: "Counting means saying numbers in order. Let's practise!",
    concepts: [
      { title: "Number Order", formula: "1, 2, 3, 4, 5 … 100", explanation: "Numbers always go in the same order. Each number is exactly 1 more than the one before it.", tip: "Count objects by touching each one — never skip!" },
      { title: "Before & After", formula: "before ← n → after", explanation: "The number BEFORE is one less. The number AFTER is one more.", tip: "Before 9 is 8. After 9 is 10." },
      { title: "Tens Boundary", formula: "19 → 20, 29 → 30, 99 → 100", explanation: "When you reach a 9, the next number starts a new ten.", tip: "This is called crossing the tens boundary." },
    ],
    examples: [
      { problem: "What number comes after 5?", steps: ["Count up from 5: 1, 2, 3, 4, 5, 6...", "The next number after 5 is 6."], answer: "6" },
      { problem: "What number comes before 9?", steps: ["Count backwards from 9: 9, 8...", "The number before 9 is 8."], answer: "8" },
      { problem: "What comes after 19?", steps: ["19 is followed by 20.", "When we reach 9, the tens digit goes up by 1."], answer: "20" },
      { problem: "Count from 5 to 10. What is the 3rd number?", steps: ["5, 6, 7, 8, 9, 10", "Position 1=5, Position 2=6, Position 3=7"], answer: "7" },
      { problem: "What comes after 99?", steps: ["99 is the last two-digit number.", "After 99 comes 100."], answer: "100" },
    ],
  };
}

function moreLessTutorial(): TutorialContent {
  return {
    skillName: "More / Less",
    intro: "We compare numbers to see which is bigger or smaller.",
    concepts: [
      { title: "Comparison Symbols", formula: "< less than   > greater than   = equal", explanation: "The < symbol points to the smaller number. Think of it as a hungry mouth eating the bigger number.", tip: "3 < 7 means 3 is less than 7" },
      { title: "Place Value Trick", formula: "Compare LEFT-most digit first", explanation: "To compare two numbers, look at the biggest (leftmost) digit first.", tip: "53 > 35 because 5 tens > 3 tens" },
    ],
    examples: [
      { problem: "Which is greater: 7 or 4?", steps: ["7 is farther right on the number line than 4.", "7 > 4"], answer: "7" },
      { problem: "Which is less: 12 or 19?", steps: ["12 comes before 19 when counting.", "12 < 19"], answer: "12" },
      { problem: "Is 45 > 54?", steps: ["Both have the same digits but in different order.", "45 = 4 tens + 5 ones = 45", "54 = 5 tens + 4 ones = 54", "54 > 45, so 45 is NOT greater than 54."], answer: "No, 45 < 54" },
      { problem: "Order from least to greatest: 8, 3, 11, 5", steps: ["Find the smallest: 3", "Next: 5", "Next: 8", "Largest: 11"], answer: "3, 5, 8, 11" },
      { problem: "Which number is between 20 and 30?", steps: ["Numbers between 20 and 30: 21, 22, 23, 24, 25, 26, 27, 28, 29", "Example answer: 25"], answer: "Any number 21–29 (e.g., 25)" },
    ],
  };
}

function numberPatternsTutorial(): TutorialContent {
  return {
    skillName: "Number Patterns",
    intro: "A pattern follows a rule. Find the rule to find the next number.",
    concepts: [
      { title: "Arithmetic Pattern", formula: "Add or subtract the same number each time", explanation: "If you add the same number each step, it is an arithmetic pattern.", tip: "2, 5, 8, 11 → rule is +3" },
      { title: "Geometric Pattern", formula: "Multiply or divide by the same number each time", explanation: "If you multiply by the same number each step, it is a geometric pattern.", tip: "3, 6, 12, 24 → rule is ×2" },
      { title: "Find the Rule", formula: "next - current = common difference", explanation: "Subtract any term from the next one. If the answer is always the same, you have found the rule.", tip: "10, 7, 4, 1 → rule is -3" },
    ],
    examples: [
      { problem: "2, 4, 6, 8, ___", steps: ["Each number increases by 2.", "8 + 2 = 10"], answer: "10" },
      { problem: "5, 10, 15, 20, ___", steps: ["Each number increases by 5.", "20 + 5 = 25"], answer: "25" },
      { problem: "100, 90, 80, 70, ___", steps: ["Each number decreases by 10.", "70 - 10 = 60"], answer: "60" },
      { problem: "1, 3, 9, 27, ___", steps: ["Each number is multiplied by 3.", "27 × 3 = 81"], answer: "81" },
      { problem: "What is the rule? 3, 6, 12, 24", steps: ["3 × 2 = 6", "6 × 2 = 12", "12 × 2 = 24", "The rule is: multiply by 2."], answer: "×2 (double each time)" },
    ],
  };
}

function numberBondsTutorial(): TutorialContent {
  return {
    skillName: "Number Bonds",
    intro: "Number bonds show how a number can be split into two parts.",
    concepts: [
      { title: "Part + Part = Whole", formula: "Part₁ + Part₂ = Whole", explanation: "Every whole number can be split into two smaller parts.", tip: "8 = 3+5 = 2+6 = 4+4" },
      { title: "Find the Missing Part", formula: "Whole - Known Part = Missing Part", explanation: "If you know the whole and one part, subtract to find the other.", tip: "? + 6 = 10 → 10 - 6 = 4" },
      { title: "Key Bonds to 10", formula: "1+9, 2+8, 3+7, 4+6, 5+5", explanation: "Bonds to 10 are the most useful. Memorise them!", tip: "Also learn bonds to 20 next!" },
    ],
    examples: [
      { problem: "3 + ___ = 7", steps: ["We need the missing part.", "7 - 3 = 4", "So 3 + 4 = 7"], answer: "4" },
      { problem: "___ + 6 = 10", steps: ["10 - 6 = 4", "So 4 + 6 = 10"], answer: "4" },
      { problem: "8 + ___ = 15", steps: ["15 - 8 = 7", "Check: 8 + 7 = 15 ✓"], answer: "7" },
      { problem: "Split 12 into two parts. One part is 5. What is the other?", steps: ["12 = 5 + ?", "12 - 5 = 7"], answer: "7" },
      { problem: "___ + 9 = 18", steps: ["18 - 9 = 9", "So 9 + 9 = 18"], answer: "9" },
    ],
  };
}

// Infer the addition bound from the skill/unit label so the lesson matches the
// stage. Labels vary ("Addition — sums to 10", "Addition within 5", "2-digit
// addition with regrouping", …), so we look for the number/keywords rather than
// an exact phrase. Defaults to single-digit (10) — the safe early-grades choice —
// not 3-digit carrying, which used to show "14 + 23" to a child learning 1–10.
function additionMaxFor(skill: string): number {
  if (/\b(within|to|sums? to|up to)\s*5\b/.test(skill) || /\bto 5\b/.test(skill)) return 5;
  if (/\b(within|to|sums? to|up to)\s*10\b/.test(skill) || /single.?digit/.test(skill)) return 10;
  if (/\b(within|to|sums? to|up to)\s*20\b/.test(skill) || /\bteen|2-digit|two-digit\b/.test(skill)) return 20;
  if (/3-?digit|three-?digit|hundred|regroup|carry|column/.test(skill)) return 999;
  return 10;
}

function additionTutorial(max: number): TutorialContent {
  // Single-digit stage (sums to 5 or 10): NO carrying — count on, bonds, order.
  if (max <= 10) {
    const big = max <= 5
      ? [
          { problem: "2 + 1 = ?", steps: ["Start at 2.", "Count on 1 more: 3.", "2 + 1 = 3"], answer: "3" },
          { problem: "2 + 2 = ?", steps: ["Start at 2.", "Count on 2 more: 3, 4.", "2 + 2 = 4"], answer: "4" },
          { problem: "3 + 1 = ?", steps: ["Start at 3.", "Count on 1 more: 4.", "3 + 1 = 4"], answer: "4" },
          { problem: "3 + 2 = ?", steps: ["Start at 3.", "Count on 2 more: 4, 5.", "3 + 2 = 5"], answer: "5" },
          { problem: "1 + 4 = ?", steps: ["The bigger number is 4 — start there.", "Count on 1 more: 5.", "1 + 4 = 5"], answer: "5" },
        ]
      : [
          { problem: "3 + 2 = ?", steps: ["Start at 3.", "Count on 2 more: 4, 5.", "3 + 2 = 5"], answer: "5" },
          { problem: "4 + 4 = ?", steps: ["Start at 4.", "Count on 4 more: 5, 6, 7, 8.", "4 + 4 = 8"], answer: "8" },
          { problem: "6 + 3 = ?", steps: ["Start at the bigger number, 6.", "Count on 3 more: 7, 8, 9.", "6 + 3 = 9"], answer: "9" },
          { problem: "5 + 5 = ?", steps: ["Double 5.", "5 + 5 = 10 — a bond to 10!"], answer: "10" },
          { problem: "2 + 7 = ?", steps: ["Start at the bigger number, 7.", "Count on 2 more: 8, 9.", "2 + 7 = 9"], answer: "9" },
        ];
    return {
      skillName: "Addition",
      intro: "Addition means putting two groups together and counting how many there are in all.",
      concepts: [
        { title: "Count On", formula: "start at the bigger number, then count up", explanation: "To add, start at the bigger number and count on the smaller one — much faster than counting both groups from 1.", tip: "6 + 3 → say 6, then 7, 8, 9" },
        { title: "Order Doesn't Matter", formula: "a + b = b + a", explanation: "You can add in any order and get the same total.", tip: "2 + 7 is the same as 7 + 2" },
        { title: "Bonds to 10", formula: "1+9, 2+8, 3+7, 4+6, 5+5", explanation: "Pairs that make 10 are worth memorising — they make bigger sums easy later.", tip: "5 + 5 = 10" },
      ],
      examples: big,
    };
  }
  // Within 20: introduce "make ten" to cross the tens boundary (still no columns).
  if (max <= 20) {
    return {
      skillName: "Addition",
      intro: "When a sum passes 10, make a ten first, then add what's left.",
      concepts: [
        { title: "Make Ten", formula: "split the smaller number to reach 10 first", explanation: "Fill up to 10, then add the rest — it keeps the numbers easy.", tip: "8 + 5 → 8 + 2 = 10, then + 3 = 13" },
        { title: "Doubles", formula: "near-doubles use a double you know", explanation: "If you know 7 + 7 = 14, then 7 + 8 is just one more.", tip: "7 + 8 = 14 + 1 = 15" },
        { title: "Order Doesn't Matter", formula: "a + b = b + a", explanation: "Start with the bigger number to count on less.", tip: "4 + 9 → start at 9" },
      ],
      examples: [
        { problem: "8 + 5 = ?", steps: ["8 + 2 makes 10.", "5 is 2 + 3, so 3 left.", "10 + 3 = 13"], answer: "13" },
        { problem: "9 + 4 = ?", steps: ["9 + 1 makes 10.", "4 is 1 + 3, so 3 left.", "10 + 3 = 13"], answer: "13" },
        { problem: "7 + 6 = ?", steps: ["7 + 3 makes 10.", "6 is 3 + 3, so 3 left.", "10 + 3 = 13"], answer: "13" },
        { problem: "7 + 8 = ?", steps: ["Double 7 = 14.", "8 is one more than 7.", "14 + 1 = 15"], answer: "15" },
        { problem: "9 + 9 = ?", steps: ["9 + 1 makes 10.", "Second 9 is 1 + 8.", "10 + 8 = 18"], answer: "18" },
      ],
    };
  }
  // Multi-digit (regrouping): the column method with carrying.
  return {
    skillName: "Addition",
    intro: "Addition means combining two numbers to find the total.",
    concepts: [
      { title: "Column Addition", formula: "Line up by place value. Add ones first, then tens, then hundreds.", explanation: "Always start from the RIGHT (ones column) and work left. This ensures carrying works correctly.", tip: "  47\n+ 35\n──\n= 82" },
      { title: "Carrying (Regrouping)", formula: "Sum ≥ 10 in a column → write the ones digit, carry 1 to the next column", explanation: "When two digits add to 10 or more, write only the ones digit and pass (carry) a 1 to the next column.", tip: "7+5=12 → write 2, carry 1 to the tens column" },
      { title: "Check by Swapping", formula: "a + b = b + a  (commutative law)", explanation: "The order doesn't matter in addition. Swap the numbers and re-add to verify your answer.", tip: "46 + 27 = 27 + 46 = 73 ✓" },
    ],
    examples: [
      { problem: "14 + 23 = ?", steps: ["Add the ones: 4 + 3 = 7", "Add the tens: 10 + 20 = 30", "Total: 30 + 7 = 37"], answer: "37" },
      { problem: "46 + 38 = ?", steps: ["Add ones: 6 + 8 = 14 (write 4, carry 1)", "Add tens: 4 + 3 + 1(carry) = 8", "Answer: 84"], answer: "84" },
      { problem: "125 + 247 = ?", steps: ["Ones: 5 + 7 = 12 (write 2, carry 1)", "Tens: 2 + 4 + 1 = 7", "Hundreds: 1 + 2 = 3", "Answer: 372"], answer: "372" },
      { problem: "357 + 465 = ?", steps: ["Ones: 7 + 5 = 12 (write 2, carry 1)", "Tens: 5 + 6 + 1 = 12 (write 2, carry 1)", "Hundreds: 3 + 4 + 1 = 8", "Answer: 822"], answer: "822" },
      { problem: "999 + 1 = ?", steps: ["Ones: 9 + 1 = 10 (write 0, carry 1)", "Tens: 9 + 0 + 1 = 10 (write 0, carry 1)", "Hundreds: 9 + 0 + 1 = 10", "Answer: 1000"], answer: "1000" },
    ],
  };
}

function missingNumbersTutorial(): TutorialContent {
  return {
    skillName: "Missing Numbers",
    intro: "To find a missing number, use the inverse (opposite) operation.",
    concepts: [
      { title: "Use the Inverse Operation", formula: "Addition ↔ Subtraction    Multiplication ↔ Division", explanation: "Every operation has an opposite. To find a missing number, use the opposite of what's in the problem.", tip: "? + 8 = 13  →  13 - 8 = ?" },
      { title: "Balance Rule", formula: "What you do to one side, do to the other", explanation: "An equation is like a balance scale. To isolate the unknown, perform the same operation on both sides.", tip: "Always CHECK your answer by substituting it back!" },
    ],
    examples: [
      { problem: "___ + 8 = 13", steps: ["To find the missing number, subtract: 13 - 8 = 5", "Check: 5 + 8 = 13 ✓"], answer: "5" },
      { problem: "25 - ___ = 11", steps: ["To find the missing number: 25 - 11 = 14", "Check: 25 - 14 = 11 ✓"], answer: "14" },
      { problem: "___ × 6 = 42", steps: ["To find the missing number, divide: 42 ÷ 6 = 7", "Check: 7 × 6 = 42 ✓"], answer: "7" },
      { problem: "48 ÷ ___ = 8", steps: ["To find the missing number: 48 ÷ 8 = 6", "Check: 48 ÷ 6 = 8 ✓"], answer: "6" },
      { problem: "___ - 17 = 25", steps: ["To find the missing number, add: 25 + 17 = 42", "Check: 42 - 17 = 25 ✓"], answer: "42" },
    ],
  };
}

function subtractionTutorial(): TutorialContent {
  return {
    skillName: "Subtraction",
    intro: "Subtraction means taking away one number from another.",
    concepts: [
      { title: "Column Subtraction", formula: "Start from the ONES column, work RIGHT to LEFT", explanation: "Always subtract the bottom from the top. Start with ones, then tens, then hundreds.", tip: "  75\n- 32\n= 43" },
      { title: "Borrowing (Regrouping)", formula: "If top digit < bottom digit: borrow 1 ten from the next column", explanation: "When you cannot subtract (top too small), borrow 10 from the column to the left.", tip: "82-45: ones 2<5, borrow → 12-5=7, tens 7-4=3, answer 37" },
      { title: "Check with Addition", formula: "answer + bottom = top", explanation: "Add your answer back to the number you subtracted. You should get the original top number.", tip: "82-45=37 → check: 37+45=82 ✓" },
    ],
    examples: [
      { problem: "57 - 23 = ?", steps: ["Subtract ones: 7 - 3 = 4", "Subtract tens: 50 - 20 = 30", "Answer: 34"], answer: "34" },
      { problem: "82 - 45 = ?", steps: ["Ones: 2 - 5 is too small, so borrow from tens.", "12 - 5 = 7 (ones digit: 7)", "Tens: 7 - 4 = 3 (after borrowing)", "Answer: 37"], answer: "37" },
      { problem: "200 - 56 = ?", steps: ["Borrow from hundreds: 200 becomes 1 hundred, 9 tens, 10 ones.", "Ones: 10 - 6 = 4", "Tens: 9 - 5 = 4", "Hundreds: 1 - 0 = 1", "Answer: 144"], answer: "144" },
      { problem: "500 - 273 = ?", steps: ["500 - 273", "Ones: borrow → 10 - 3 = 7", "Tens: borrow → 9 - 7 = 2", "Hundreds: 4 - 2 = 2", "Answer: 227"], answer: "227" },
      { problem: "1000 - 364 = ?", steps: ["1000 - 364", "Work through borrowing carefully:", "Ones: 10 - 4 = 6", "Tens: 9 - 6 = 3", "Hundreds: 9 - 3 = 6", "Thousands: 0", "Answer: 636"], answer: "636" },
    ],
  };
}

function multiplicationTutorial(): TutorialContent {
  return {
    skillName: "Multiplication",
    intro: "Multiplication is repeated addition. 3 × 4 means 3 groups of 4.",
    concepts: [
      { title: "What Multiplication Means", formula: "a × b = a groups of b added together", explanation: "3 × 4 means three groups of four: 4+4+4=12. The × symbol means groups of.", tip: "6 × 7 = 6 groups of 7 = 42" },
      { title: "Commutative Law", formula: "a × b = b × a", explanation: "The order does not change the answer. 6×7 = 7×6 = 42. This halves the facts you need to memorise!", tip: "If you know 8×3, you know 3×8!" },
      { title: "×9 Finger Trick", formula: "Hold up 10 fingers. Fold down the nth finger. Left = tens, Right = ones.", explanation: "For 9×6: fold down 6th finger. 5 fingers left = 5 tens, 4 right = 4 ones → 54.", tip: "Try 9×7: fold 7th finger → 6 left, 3 right = 63" },
    ],
    examples: [
      { problem: "6 × 7 = ?", steps: ["Think: 6 groups of 7", "6 × 7 = 42", "Memory trick: 6 sevens = 42"], answer: "42" },
      { problem: "8 × 9 = ?", steps: ["8 × 9 = 72", "Memory trick: 9 × 8 = 72 (9s trick: 7+2=9)"], answer: "72" },
      { problem: "12 × 6 = ?", steps: ["Split 12 into 10 + 2", "10 × 6 = 60", "2 × 6 = 12", "60 + 12 = 72"], answer: "72" },
      { problem: "7 × ___ = 56", steps: ["We need: how many 7s make 56?", "56 ÷ 7 = 8", "Check: 7 × 8 = 56 ✓"], answer: "8" },
      { problem: "25 × 4 = ?", steps: ["25 × 4 = 25 + 25 + 25 + 25", "Or: 25 × 4 = 100 (quarter × 4 = whole)"], answer: "100" },
    ],
  };
}

function divisionTutorial(): TutorialContent {
  return {
    skillName: "Division",
    intro: "Division means splitting into equal groups. 24 ÷ 6 = how many groups of 6 in 24?",
    concepts: [
      { title: "Division Means Equal Sharing", formula: "dividend ÷ divisor = quotient", explanation: "24 ÷ 6 asks: how many groups of 6 fit into 24? Use your times tables to solve.", tip: "Think of it as sharing: 24 sweets shared among 6 friends = 4 each" },
      { title: "Division ↔ Multiplication", formula: "If a × b = c, then c ÷ a = b", explanation: "Division and multiplication are inverses. Use your times tables to solve division problems.", tip: "63 ÷ 7: ask 7 × ? = 63 → answer is 9" },
    ],
    examples: [
      { problem: "42 ÷ 6 = ?", steps: ["Ask: how many 6s fit into 42?", "6 × 7 = 42", "So 42 ÷ 6 = 7"], answer: "7" },
      { problem: "63 ÷ 9 = ?", steps: ["Ask: 9 × ? = 63", "9 × 7 = 63", "So 63 ÷ 9 = 7"], answer: "7" },
      { problem: "72 ÷ 8 = ?", steps: ["8 × 9 = 72", "So 72 ÷ 8 = 9"], answer: "9" },
      { problem: "132 ÷ 11 = ?", steps: ["11 × 10 = 110", "11 × 12 = 132", "So 132 ÷ 11 = 12"], answer: "12" },
      { problem: "156 ÷ 12 = ?", steps: ["12 × 10 = 120", "156 - 120 = 36", "12 × 3 = 36", "So 12 × 13 = 156", "156 ÷ 12 = 13"], answer: "13" },
    ],
  };
}

function divisionRemaindersTutorial(): TutorialContent {
  return {
    skillName: "Division with Remainders",
    intro: "Sometimes numbers don't divide evenly. The leftover is called the remainder.",
    concepts: [
      { title: "What is a Remainder?", formula: "dividend = (divisor × quotient) + remainder", explanation: "When a number does not divide evenly, what is left over is the remainder. It is always LESS than the divisor.", tip: "17 ÷ 5 = 3 R 2 → 5×3=15 and 17-15=2" },
      { title: "Find the Largest Multiple", formula: "Find biggest multiple of divisor that fits inside dividend", explanation: "Step 1: Find the largest multiple of the divisor that does not exceed the dividend. Step 2: Subtract to get the remainder.", tip: "23 ÷ 4: 4×5=20 fits, 23-20=3. Answer: 5 R 3" },
    ],
    examples: [
      { problem: "17 ÷ 5 = ?", steps: ["5 × 3 = 15 (closest without going over)", "17 - 15 = 2 left over", "Answer: 3 remainder 2, or 3 R 2"], answer: "3 R 2" },
      { problem: "23 ÷ 4 = ?", steps: ["4 × 5 = 20 (closest without going over)", "23 - 20 = 3 left over", "Answer: 5 R 3"], answer: "5 R 3" },
      { problem: "37 ÷ 6 = ?", steps: ["6 × 6 = 36", "37 - 36 = 1 left over", "Answer: 6 R 1"], answer: "6 R 1" },
      { problem: "50 ÷ 7 = ?", steps: ["7 × 7 = 49", "50 - 49 = 1 left over", "Answer: 7 R 1"], answer: "7 R 1" },
      { problem: "100 ÷ 9 = ?", steps: ["9 × 11 = 99", "100 - 99 = 1 left over", "Answer: 11 R 1"], answer: "11 R 1" },
    ],
  };
}

function fractionIdentificationTutorial(): TutorialContent {
  return {
    skillName: "Fractions",
    intro: "A fraction shows part of a whole. The top number (numerator) is the part; the bottom (denominator) is the total.",
    concepts: [
      { title: "Anatomy of a Fraction", formula: "numerator / denominator", explanation: "The NUMERATOR (top) tells you how many parts you have. The DENOMINATOR (bottom) tells you how many equal parts the whole is split into.", tip: "3/8 = 3 parts out of 8 equal parts" },
      { title: "Bigger Denominator = Smaller Piece", formula: "1/2 > 1/4 > 1/8 > 1/16", explanation: "When the numerator is the same, a bigger denominator means smaller pieces — more cuts = smaller slices.", tip: "Would you rather 1/2 or 1/8 of a pizza?" },
      { title: "Equivalent Fractions", formula: "1/2 = 2/4 = 3/6 = 4/8", explanation: "Multiply or divide BOTH top and bottom by the same number to get an equivalent fraction.", tip: "1/2 × 2/2 = 2/4  — same amount, different form" },
    ],
    examples: [
      { problem: "A pizza has 8 slices. You eat 3. What fraction did you eat?", steps: ["Parts eaten = 3 (numerator)", "Total parts = 8 (denominator)", "Fraction eaten = 3/8"], answer: "3/8" },
      { problem: "What fraction of 10 is 4?", steps: ["4 out of 10 total parts", "Fraction = 4/10", "Simplified: 4/10 = 2/5"], answer: "2/5" },
      { problem: "There are 12 students. 5 are boys. What fraction are girls?", steps: ["Girls = 12 - 5 = 7", "Total = 12", "Fraction of girls = 7/12"], answer: "7/12" },
      { problem: "Which is larger: 1/2 or 1/4?", steps: ["Both fractions have 1 on top (numerator).", "Larger denominator = smaller pieces.", "1/2 > 1/4"], answer: "1/2" },
      { problem: "Write 0.5 as a fraction.", steps: ["0.5 = 5 tenths = 5/10", "Simplify: 5/10 = 1/2"], answer: "1/2" },
    ],
  };
}

function fractionSimplificationTutorial(): TutorialContent {
  return {
    skillName: "Simplifying Fractions",
    intro: "To simplify a fraction, divide both numerator and denominator by their Greatest Common Factor (GCF).",
    concepts: [
      { title: "Greatest Common Factor (GCF)", formula: "GCF = largest number that divides evenly into both numerator and denominator", explanation: "Dividing both parts by the GCF gives the simplest form.", tip: "GCF of 8 and 12 = 4" },
      { title: "Simplifying Rule", formula: "n/d = (n÷GCF) / (d÷GCF)", explanation: "Divide both numerator AND denominator by the GCF. The fraction's value doesn't change.", tip: "6/8 ÷ 2/2 = 3/4" },
      { title: "Fully Simplified Test", formula: "GCF = 1 → simplest form", explanation: "A fraction is fully simplified when the only common factor of top and bottom is 1.", tip: "3/4 is fully simplified — GCF of 3 and 4 is 1" },
    ],
    examples: [
      { problem: "Simplify 6/8", steps: ["Factors of 6: 1, 2, 3, 6", "Factors of 8: 1, 2, 4, 8", "GCF = 2", "6 ÷ 2 = 3, 8 ÷ 2 = 4", "Simplified: 3/4"], answer: "3/4" },
      { problem: "Simplify 10/15", steps: ["Factors of 10: 1, 2, 5, 10", "Factors of 15: 1, 3, 5, 15", "GCF = 5", "10 ÷ 5 = 2, 15 ÷ 5 = 3", "Simplified: 2/3"], answer: "2/3" },
      { problem: "Simplify 12/16", steps: ["GCF of 12 and 16 = 4", "12 ÷ 4 = 3, 16 ÷ 4 = 4", "Simplified: 3/4"], answer: "3/4" },
      { problem: "Simplify 9/12", steps: ["GCF of 9 and 12 = 3", "9 ÷ 3 = 3, 12 ÷ 3 = 4", "Simplified: 3/4"], answer: "3/4" },
      { problem: "Is 7/11 already in simplest form?", steps: ["Factors of 7: 1, 7 (prime number)", "Factors of 11: 1, 11 (prime number)", "GCF = 1 only", "Yes, 7/11 is already simplified."], answer: "Yes, 7/11" },
    ],
  };
}

function fractionAdditionTutorial(): TutorialContent {
  return {
    skillName: "Adding Fractions",
    intro: "To add fractions, the denominators must be the same. If not, find a common denominator first.",
    concepts: [
      { title: "Same Denominator: Just Add Tops", formula: "a/c + b/c = (a+b)/c", explanation: "If denominators are identical, simply add the numerators. The denominator stays the same.", tip: "3/8 + 2/8 = 5/8" },
      { title: "Different Denominators: Find LCD", formula: "LCD = Least Common Denominator", explanation: "Find the smallest number both denominators divide into. Convert each fraction, then add.", tip: "1/3 + 1/6: LCD=6 → 2/6 + 1/6 = 3/6 = 1/2" },
      { title: "Always Simplify the Answer", formula: "Check if GCF > 1 after adding", explanation: "After adding, reduce the result to simplest form.", tip: "4/6 simplifies to 2/3" },
    ],
    examples: [
      { problem: "1/4 + 2/4 = ?", steps: ["Denominators are the same (4).", "Add numerators: 1 + 2 = 3", "Answer: 3/4"], answer: "3/4" },
      { problem: "1/3 + 1/6 = ?", steps: ["Denominators are different (3 and 6).", "Find LCD: LCM of 3 and 6 = 6", "Convert 1/3 to 2/6", "2/6 + 1/6 = 3/6 = 1/2"], answer: "1/2" },
      { problem: "1/2 + 1/4 = ?", steps: ["LCD of 2 and 4 = 4", "Convert 1/2 to 2/4", "2/4 + 1/4 = 3/4"], answer: "3/4" },
      { problem: "2/3 + 1/6 = ?", steps: ["LCD = 6", "2/3 = 4/6", "4/6 + 1/6 = 5/6"], answer: "5/6" },
      { problem: "3/4 + 1/8 = ?", steps: ["LCD = 8", "3/4 = 6/8", "6/8 + 1/8 = 7/8"], answer: "7/8" },
    ],
  };
}

function fractionComparisonTutorial(): TutorialContent {
  return {
    skillName: "Comparing Fractions",
    intro: "To compare fractions, convert them to the same denominator, then compare numerators.",
    concepts: [
      { title: "Common Denominator Method", formula: "Convert to LCD, then compare numerators", explanation: "Give both fractions the same denominator, then the bigger numerator wins.", tip: "2/3 vs 3/5: LCD=15 → 10/15 vs 9/15 → 2/3 wins" },
      { title: "Same Numerator Shortcut", formula: "Same numerator → bigger denominator = SMALLER fraction", explanation: "When numerators match, more cuts = smaller slices.", tip: "1/5 < 1/3 because 5 > 3" },
      { title: "Cross Multiplication", formula: "a/b vs c/d: compare a×d with c×b", explanation: "Multiply diagonally. The fraction with the bigger cross-product is greater.", tip: "2/3 vs 3/5: 2×5=10 vs 3×3=9 → 2/3 wins" },
    ],
    examples: [
      { problem: "Which is larger: 2/3 or 3/5?", steps: ["LCD of 3 and 5 = 15", "2/3 = 10/15", "3/5 = 9/15", "10/15 > 9/15, so 2/3 > 3/5"], answer: "2/3" },
      { problem: "Which is larger: 3/4 or 5/8?", steps: ["LCD = 8", "3/4 = 6/8", "6/8 > 5/8, so 3/4 > 5/8"], answer: "3/4" },
      { problem: "Which is smaller: 1/3 or 1/4?", steps: ["Larger denominator = smaller piece", "1/4 < 1/3"], answer: "1/4" },
      { problem: "Are 2/4 and 1/2 equal?", steps: ["2/4 = 1/2 (simplify 2/4 by dividing by 2)", "Yes, they are equal."], answer: "Yes, equal" },
      { problem: "Order: 1/2, 1/3, 1/4 from greatest to least", steps: ["All have numerator 1; larger denominator = smaller fraction", "1/2 > 1/3 > 1/4"], answer: "1/2, 1/3, 1/4" },
    ],
  };
}

function decimalPlaceValueTutorial(): TutorialContent {
  return {
    skillName: "Decimal Place Value",
    intro: "Decimals use a point to show values less than 1. Each position has a name.",
    concepts: [
      { title: "Place Value Chart", formula: "Hundreds | Tens | Ones . Tenths | Hundredths | Thousandths", explanation: "The decimal point separates whole numbers from fractions. Each place is 10× smaller than the one to its left.", tip: "In 3.47 → 3=ones, 4=tenths, 7=hundredths" },
      { title: "Reading Decimals", formula: "0.3 = three tenths    0.07 = seven hundredths", explanation: "Read the decimal part as a fraction: the last digit's place value is the denominator.", tip: "0.45 = forty-five hundredths = 45/100" },
      { title: "Comparing Decimals", formula: "Compare digit by digit, LEFT to RIGHT", explanation: "Line up decimal points, then compare column by column.", tip: "Add zeros: 0.70 vs 0.07 makes the comparison clearer" },
    ],
    examples: [
      { problem: "In 3.47, what digit is in the tenths place?", steps: ["3.47 → 3 is ones, 4 is tenths, 7 is hundredths", "The tenths digit is 4."], answer: "4" },
      { problem: "Write 0.6 in words.", steps: ["0.6 = 6 tenths"], answer: "Six tenths" },
      { problem: "Which is greater: 0.7 or 0.07?", steps: ["0.7 = 7 tenths", "0.07 = 7 hundredths", "Tenths are bigger than hundredths", "0.7 > 0.07"], answer: "0.7" },
      { problem: "Write 2 and 5 hundredths as a decimal.", steps: ["2 = whole number", "5 hundredths = 0.05", "Answer: 2.05"], answer: "2.05" },
      { problem: "In 15.382, what digit is in the hundredths place?", steps: ["15.382 → 1 tens, 5 ones . 3 tenths, 8 hundredths, 2 thousandths", "The hundredths digit is 8."], answer: "8" },
    ],
  };
}

function decimalOperationsTutorial(): TutorialContent {
  return {
    skillName: "Decimal Operations",
    intro: "When adding or subtracting decimals, line up the decimal points first.",
    concepts: [
      { title: "Line Up the Decimal Points", formula: "Always align the decimal point before calculating", explanation: "The golden rule: decimal points must be directly above each other. Add zeros to fill empty spaces.", tip: "3.4 + 1.25: write 3.40 + 1.25 to equalise columns" },
      { title: "Multiply by 10: Shift Right", formula: "n × 10 → move decimal RIGHT by 1 place", explanation: "Multiplying by 10, 100, 1000 shifts the decimal point right by 1, 2, 3 places.", tip: "0.46 × 10 = 4.6    0.46 × 100 = 46" },
      { title: "Divide by 10: Shift Left", formula: "n ÷ 10 → move decimal LEFT by 1 place", explanation: "Dividing by 10, 100, 1000 shifts the decimal point left by 1, 2, 3 places.", tip: "4.6 ÷ 10 = 0.46    46 ÷ 100 = 0.46" },
    ],
    examples: [
      { problem: "3.4 + 2.5 = ?", steps: ["Line up decimal points:", "  3.4", "+ 2.5", "= 5.9"], answer: "5.9" },
      { problem: "7.8 - 3.2 = ?", steps: ["Line up decimal points:", "  7.8", "- 3.2", "= 4.6"], answer: "4.6" },
      { problem: "1.25 + 0.75 = ?", steps: ["  1.25", "+ 0.75", "Hundredths: 5+5=10 (write 0, carry 1)", "Tenths: 2+7+1=10 (write 0, carry 1)", "Ones: 1+0+1=2", "= 2.00"], answer: "2.00" },
      { problem: "0.5 × 10 = ?", steps: ["When multiplying by 10, move decimal right 1 place.", "0.5 × 10 = 5.0 = 5"], answer: "5" },
      { problem: "4.5 ÷ 10 = ?", steps: ["When dividing by 10, move decimal left 1 place.", "4.5 ÷ 10 = 0.45"], answer: "0.45" },
    ],
  };
}

function percentagesTutorial(): TutorialContent {
  return {
    skillName: "Percentages",
    intro: "Percent means 'out of 100'. To find a percentage of a number, multiply by the decimal form.",
    concepts: [
      { title: "Percent = Per Hundred", formula: "n% = n/100 = n ÷ 100", explanation: "The % symbol means divided by 100. 25% = 25/100 = 0.25.", tip: "50% = 0.50 = 1/2    25% = 0.25 = 1/4" },
      { title: "Finding a Percentage", formula: "% of number = (% ÷ 100) × number", explanation: "Convert the percentage to a decimal then multiply.", tip: "15% of 60 = 0.15 × 60 = 9" },
      { title: "Quick Mental Tricks", formula: "10% = ÷10    5% = half of 10%    1% = ÷100", explanation: "Build up percentages from 10% and 1%.", tip: "20% of 80: 10%=8, double it → 16" },
    ],
    examples: [
      { problem: "What is 10% of 80?", steps: ["10% = 10/100 = 0.1", "0.1 × 80 = 8", "Or: 80 ÷ 10 = 8"], answer: "8" },
      { problem: "What is 25% of 200?", steps: ["25% = 1/4", "200 ÷ 4 = 50"], answer: "50" },
      { problem: "What is 15% of 60?", steps: ["15% = 10% + 5%", "10% of 60 = 6", "5% of 60 = 3", "15% = 6 + 3 = 9"], answer: "9" },
      { problem: "What is 50% of 340?", steps: ["50% = 1/2", "340 ÷ 2 = 170"], answer: "170" },
      { problem: "What percentage is 30 out of 120?", steps: ["Percentage = (part ÷ whole) × 100", "30 ÷ 120 = 0.25", "0.25 × 100 = 25%"], answer: "25%" },
    ],
  };
}

function ratiosTutorial(): TutorialContent {
  return {
    skillName: "Ratios",
    intro: "A ratio compares two quantities. Written as a:b or a/b.",
    concepts: [
      { title: "Ratio Notation", formula: "a:b  or  a/b  or  'a to b'", explanation: "A ratio compares two quantities. 3:4 means for every 3 of A, there are 4 of B.", tip: "2 red to 3 blue = 2:3 = 2/3" },
      { title: "Simplifying Ratios", formula: "a:b = (a÷GCF) : (b÷GCF)", explanation: "Divide both parts by their GCF to get simplest form.", tip: "12:8 ÷ 4 = 3:2" },
      { title: "Equivalent Ratios", formula: "a:b = (a×n):(b×n)", explanation: "Multiply both parts by the same number to get an equivalent ratio.", tip: "2:3 = 4:6 = 6:9" },
    ],
    examples: [
      { problem: "In a class of 30, there are 12 boys. Write the ratio of boys to girls.", steps: ["Boys = 12, Girls = 30 - 12 = 18", "Ratio of boys to girls = 12:18", "Simplified (÷6): 2:3"], answer: "2:3" },
      { problem: "Simplify the ratio 15:25", steps: ["GCF of 15 and 25 = 5", "15 ÷ 5 = 3, 25 ÷ 5 = 5", "Simplified ratio: 3:5"], answer: "3:5" },
      { problem: "The ratio 2:3. If the first quantity is 8, what is the second?", steps: ["2:3 = 8:?", "Multiply both by 4: 2×4=8, 3×4=12", "Answer: 12"], answer: "12" },
      { problem: "Are the ratios 4:6 and 6:9 equivalent?", steps: ["4:6 simplified = 2:3 (÷2)", "6:9 simplified = 2:3 (÷3)", "Yes, both equal 2:3"], answer: "Yes, both equal 2:3" },
      { problem: "A recipe uses 3 cups flour to 2 cups sugar. For 9 cups flour, how much sugar?", steps: ["Ratio flour:sugar = 3:2", "9 cups flour = 3 × 3", "Sugar = 2 × 3 = 6 cups"], answer: "6 cups" },
    ],
  };
}

function proportionsTutorial(): TutorialContent {
  return {
    skillName: "Proportions",
    intro: "A proportion says two ratios are equal. Cross-multiply to solve for the unknown.",
    concepts: [
      { title: "What is a Proportion?", formula: "a/b = c/d  (two equal ratios)", explanation: "A proportion states two ratios are equal. Use cross-multiplication to solve for an unknown.", tip: "1/2 = 2/4 = 3/6 are all proportions" },
      { title: "Cross Multiplication", formula: "a/b = c/d  →  a×d = b×c", explanation: "Multiply diagonally. The products must be equal. Use this to solve for an unknown variable.", tip: "3/x = 9/15: 3×15=9×x → 45=9x → x=5" },
      { title: "Unit Rate Method", formula: "Find the rate per 1 unit, then multiply", explanation: "Alternative: find the value per single unit first, then scale up.", tip: "5 apples/$2.50 = $0.50/apple → 8 apples = $4.00" },
    ],
    examples: [
      { problem: "Solve: x/4 = 3/12", steps: ["Cross multiply: 12x = 4 × 3 = 12", "x = 12 ÷ 12 = 1"], answer: "x = 1" },
      { problem: "If 5 apples cost $2.50, how much do 15 apples cost?", steps: ["Set up proportion: 5/2.50 = 15/x", "Cross multiply: 5x = 2.50 × 15 = 37.50", "x = 37.50 ÷ 5 = 7.50"], answer: "$7.50" },
      { problem: "Solve: 3/8 = 9/x", steps: ["Cross multiply: 3x = 8 × 9 = 72", "x = 72 ÷ 3 = 24"], answer: "x = 24" },
      { problem: "A car travels 150 km in 2 hours. How far in 5 hours?", steps: ["150/2 = x/5", "Cross multiply: 2x = 150 × 5 = 750", "x = 375 km"], answer: "375 km" },
      { problem: "Solve: 2/5 = x/20", steps: ["Cross multiply: 5x = 2 × 20 = 40", "x = 40 ÷ 5 = 8"], answer: "x = 8" },
    ],
  };
}

function unitRatesTutorial(): TutorialContent {
  return {
    skillName: "Unit Rates",
    intro: "A unit rate compares a quantity to ONE unit. Divide to find the rate per one.",
    concepts: [
      { title: "Unit Rate = Per One", formula: "unit rate = total ÷ number of units", explanation: "A unit rate compares to exactly 1 unit: km per hour, price per item, pages per day.", tip: "240km in 4 hours → 240÷4 = 60 km/hour" },
      { title: "The 'Per' Word", formula: "'per' always means ÷", explanation: "When you see 'per', divide. To find total: multiply unit rate × quantity.", tip: "$1.50/kg × 4kg = $6 total" },
      { title: "Comparing Unit Rates", formula: "Convert both to per-1 before comparing", explanation: "The smaller unit price is always the better deal.", tip: "3 for $2.40 = $0.80 each    5 for $4.25 = $0.85 each → 3-pack wins!" },
    ],
    examples: [
      { problem: "A car travels 240 km in 4 hours. What is the speed per hour?", steps: ["Unit rate = total ÷ number of units", "240 ÷ 4 = 60", "Speed = 60 km/h"], answer: "60 km/h" },
      { problem: "12 apples cost $3. What is the cost per apple?", steps: ["Cost per apple = $3 ÷ 12 = $0.25"], answer: "$0.25 per apple" },
      { problem: "A factory makes 500 items in 5 hours. How many per hour?", steps: ["Items per hour = 500 ÷ 5 = 100"], answer: "100 items/hour" },
      { problem: "5 kg of flour costs $8. What is the price per kg?", steps: ["Price per kg = $8 ÷ 5 = $1.60"], answer: "$1.60 per kg" },
      { problem: "A runner covers 10 km in 50 minutes. How many km per minute?", steps: ["km per minute = 10 ÷ 50 = 0.2"], answer: "0.2 km/min" },
    ],
  };
}

function oneStepEquationsTutorial(): TutorialContent {
  return {
    skillName: "One-Step Equations",
    intro: "To solve an equation, do the opposite operation to both sides to isolate x.",
    concepts: [
      { title: "The Balance Rule", formula: "Same operation on BOTH sides keeps it balanced", explanation: "An equation is a balance scale. Whatever you do to one side, do to the other.", tip: "x + 5 = 12: subtract 5 from BOTH sides → x = 7" },
      { title: "Inverse Operations", formula: "+↔-    ×↔÷", explanation: "To cancel an operation, use its inverse. To remove +7, subtract 7.", tip: "You are trying to get x ALONE on one side" },
      { title: "Always Check!", formula: "Substitute answer back into original equation", explanation: "After solving, replace x with your answer. Both sides should be equal.", tip: "x=7 in x+5=12: 7+5=12 ✓" },
    ],
    examples: [
      { problem: "Solve: x + 7 = 12", steps: ["Subtract 7 from both sides:", "x + 7 - 7 = 12 - 7", "x = 5", "Check: 5 + 7 = 12 ✓"], answer: "x = 5" },
      { problem: "Solve: x - 4 = 9", steps: ["Add 4 to both sides:", "x - 4 + 4 = 9 + 4", "x = 13"], answer: "x = 13" },
      { problem: "Solve: 3x = 21", steps: ["Divide both sides by 3:", "3x ÷ 3 = 21 ÷ 3", "x = 7", "Check: 3 × 7 = 21 ✓"], answer: "x = 7" },
      { problem: "Solve: x/5 = 6", steps: ["Multiply both sides by 5:", "x/5 × 5 = 6 × 5", "x = 30"], answer: "x = 30" },
      { problem: "Solve: x + 15 = 40", steps: ["Subtract 15 from both sides:", "x = 40 - 15 = 25"], answer: "x = 25" },
    ],
  };
}

function twoStepEquationsTutorial(): TutorialContent {
  return {
    skillName: "Two-Step Equations",
    intro: "Two-step equations need two operations to solve. Work in reverse order of operations.",
    concepts: [
      { title: "Reverse PEMDAS", formula: "Undo + and - FIRST, then × and ÷", explanation: "When solving, reverse the order of operations: undo addition/subtraction first, then multiplication/division.", tip: "2x+3=11: undo +3 first → 2x=8, then ÷2 → x=4" },
      { title: "Two-Step Strategy", formula: "Step 1: ±   Step 2: ×÷", explanation: "Move constants to the other side first. Then divide by the coefficient of x.", tip: "3x-5=16 → +5 → 3x=21 → ÷3 → x=7" },
    ],
    examples: [
      { problem: "Solve: 2x + 3 = 11", steps: ["Step 1: Subtract 3 from both sides: 2x = 8", "Step 2: Divide both sides by 2: x = 4", "Check: 2(4) + 3 = 11 ✓"], answer: "x = 4" },
      { problem: "Solve: 3x - 5 = 16", steps: ["Step 1: Add 5 to both sides: 3x = 21", "Step 2: Divide by 3: x = 7", "Check: 3(7) - 5 = 16 ✓"], answer: "x = 7" },
      { problem: "Solve: 4x + 8 = 28", steps: ["Step 1: 4x = 28 - 8 = 20", "Step 2: x = 20 ÷ 4 = 5"], answer: "x = 5" },
      { problem: "Solve: x/3 + 4 = 9", steps: ["Step 1: x/3 = 9 - 4 = 5", "Step 2: x = 5 × 3 = 15"], answer: "x = 15" },
      { problem: "Solve: 5x - 10 = 20", steps: ["Step 1: 5x = 20 + 10 = 30", "Step 2: x = 30 ÷ 5 = 6"], answer: "x = 6" },
    ],
  };
}

function inequalitiesTutorial(): TutorialContent {
  return {
    skillName: "Inequalities",
    intro: "Inequalities use <, >, ≤, ≥ instead of =. Solve like equations, but flip the sign when multiplying/dividing by a negative.",
    concepts: [
      { title: "Inequality Symbols", formula: "< less than   > greater than   ≤ at most   ≥ at least", explanation: "Inequalities describe a RANGE of values, not just one answer.", tip: "≤ and ≥ INCLUDE the boundary value" },
      { title: "FLIP THE SIGN", formula: "When ×÷ by a NEGATIVE number: flip the inequality!", explanation: "This is the critical exception when solving inequalities.", tip: "-2x > 6: divide by -2 and FLIP → x < -3" },
    ],
    examples: [
      { problem: "Solve: x + 3 > 8", steps: ["Subtract 3 from both sides:", "x > 8 - 3", "x > 5", "Solution: all numbers greater than 5"], answer: "x > 5" },
      { problem: "Solve: 2x ≤ 12", steps: ["Divide both sides by 2:", "x ≤ 6", "Solution: all numbers ≤ 6"], answer: "x ≤ 6" },
      { problem: "Solve: x - 4 ≥ 7", steps: ["Add 4 to both sides:", "x ≥ 11"], answer: "x ≥ 11" },
      { problem: "Solve: -3x > 9", steps: ["Divide by -3 (flip the sign!):", "x < -3"], answer: "x < -3" },
      { problem: "Solve: 3x + 1 < 16", steps: ["Step 1: 3x < 15", "Step 2: x < 5"], answer: "x < 5" },
    ],
  };
}

function wordProblemsTutorial(): TutorialContent {
  return {
    skillName: "Word Problems",
    intro: "Read carefully. Identify what you know and what you need to find. Choose the right operation.",
    concepts: [
      { title: "RUCSAC Method", formula: "Read → Underline → Choose → Solve → Answer → Check", explanation: "Never rush — re-read the question at least twice.", tip: "Most common mistake: not reading the whole question!" },
      { title: "Key Words → Operations", formula: "total/altogether → +    left/fewer → -    groups of → ×    each/share → ÷", explanation: "Certain words signal which operation to use.", tip: "'How many MORE' → subtraction!" },
      { title: "Always Include Units", formula: "Never write just a bare number — include the unit", explanation: "Re-read the question to find what unit the answer needs.", tip: "45 means nothing. 45 km is a complete answer." },
    ],
    examples: [
      { problem: "A store has 150 apples. They sell 47. How many remain?", steps: ["Known: 150 total, 47 sold", "Operation: subtraction (taking away)", "150 - 47 = 103"], answer: "103 apples" },
      { problem: "A book has 320 pages. Maria reads 40 pages per day. How many days to finish?", steps: ["Known: 320 pages, 40 pages/day", "Operation: division (sharing equally)", "320 ÷ 40 = 8 days"], answer: "8 days" },
      { problem: "A shirt costs $35. There is a 20% discount. What is the sale price?", steps: ["Discount = 20% of $35 = 0.2 × 35 = $7", "Sale price = $35 - $7 = $28"], answer: "$28" },
      { problem: "A rectangle is 12 cm long and 7 cm wide. What is its area?", steps: ["Area = length × width", "Area = 12 × 7 = 84 cm²"], answer: "84 cm²" },
      { problem: "3 friends share 45 stickers equally. How many each?", steps: ["Known: 45 stickers, 3 friends", "Operation: division", "45 ÷ 3 = 15"], answer: "15 stickers each" },
    ],
  };
}

function slopeInterceptTutorial(): TutorialContent {
  return {
    skillName: "Slope and Intercept",
    intro: "In y = mx + b, m is the slope (steepness) and b is the y-intercept (where the line crosses the y-axis).",
    concepts: [
      { title: "y = mx + b", formula: "m = slope    b = y-intercept", explanation: "The slope-intercept form. m is the steepness. b is where the line crosses the y-axis.", tip: "y = 3x + 2: slope=3, y-intercept=2" },
      { title: "What is Slope?", formula: "m = rise ÷ run = (y₂-y₁)/(x₂-x₁)", explanation: "Slope measures steepness: units up per unit right. Positive = upward. Negative = downward.", tip: "Slope 3 means: right 1, up 3" },
      { title: "Slope Signs", formula: "m > 0: up    m < 0: down    m = 0: horizontal    undefined: vertical", explanation: "The sign of slope tells you the direction.", tip: "y = -2x + 5 has negative slope (goes down)" },
    ],
    examples: [
      { problem: "Find the slope and y-intercept of y = 3x + 2", steps: ["Compare to y = mx + b", "m (slope) = 3", "b (y-intercept) = 2"], answer: "Slope = 3, y-intercept = 2" },
      { problem: "What is the slope of y = -2x + 5?", steps: ["m = -2 (negative means line goes down left to right)"], answer: "-2" },
      { problem: "Find y when x = 4 in y = 2x - 1", steps: ["Substitute x = 4:", "y = 2(4) - 1 = 8 - 1 = 7"], answer: "y = 7" },
      { problem: "Write the equation of a line with slope 3 and y-intercept -4.", steps: ["y = mx + b", "y = 3x + (-4)", "y = 3x - 4"], answer: "y = 3x - 4" },
      { problem: "What is the slope of a horizontal line?", steps: ["A horizontal line has no rise — it's flat.", "Slope = rise/run = 0/run = 0"], answer: "0" },
    ],
  };
}

function graphingLinesTutorial(): TutorialContent {
  return {
    skillName: "Graphing Lines",
    intro: "To graph a line: find the y-intercept (start point), then use the slope to find more points.",
    concepts: [
      { title: "Two Points Make a Line", formula: "Set x=0 (y-intercept) and y=0 (x-intercept) to get two easy points", explanation: "Any two points fully define a line. The intercepts are the easiest to calculate.", tip: "y=2x+4: x=0→y=4; y=0→x=-2. Two points done!" },
      { title: "Rise Over Run", formula: "Start at y-intercept, step right 'run', step up 'rise'", explanation: "Plot (0,b), then apply slope repeatedly to find more points.", tip: "Slope=2/1 from (0,1): right 1, up 2 → (1,3)" },
      { title: "Parallel and Perpendicular", formula: "Parallel: same slope    Perpendicular: slopes multiply to -1", explanation: "Parallel lines never meet (same m). Perpendicular lines cross at 90° (m₁×m₂=-1).", tip: "Perpendicular to slope 3: slope = -1/3" },
    ],
    examples: [
      { problem: "Graph y = 2x + 1. What are two points on the line?", steps: ["y-intercept: when x=0, y=1 → point (0,1)", "Slope = 2 = 2/1: go right 1, up 2 → point (1,3)", "Two points: (0,1) and (1,3)"], answer: "(0,1) and (1,3)" },
      { problem: "What is the x-intercept of y = 3x - 6?", steps: ["Set y = 0: 0 = 3x - 6", "3x = 6", "x = 2", "x-intercept = (2, 0)"], answer: "(2, 0)" },
      { problem: "Are y = 2x + 1 and y = 2x - 3 parallel?", steps: ["Both have slope m = 2", "Parallel lines have equal slopes.", "Yes, they are parallel."], answer: "Yes, parallel (same slope)" },
      { problem: "What is the slope of y = 4?", steps: ["y = 4 is a horizontal line", "Horizontal lines have slope = 0"], answer: "0" },
      { problem: "What is the slope of x = 3?", steps: ["x = 3 is a vertical line", "Vertical lines have undefined slope"], answer: "Undefined" },
    ],
  };
}

function systemsOfEquationsTutorial(): TutorialContent {
  return {
    skillName: "Systems of Equations",
    intro: "A system of equations has two equations with two unknowns. Find the values that satisfy both.",
    concepts: [
      { title: "What is a System?", formula: "Two equations, two unknowns → find x and y that satisfy BOTH", explanation: "Graphically, the solution is where both lines intersect.", tip: "Substitution or elimination — choose the method that looks easier" },
      { title: "Elimination Method", formula: "Add or subtract equations to eliminate one variable", explanation: "If coefficients of one variable match (or are opposite), add/subtract to remove that variable.", tip: "x+y=10 and x-y=2: ADD → 2x=12 → x=6" },
      { title: "Substitution Method", formula: "Solve one equation for a variable, sub into the other", explanation: "Isolate one variable in equation 1, then substitute that expression into equation 2.", tip: "y=2x in x+y=9: x+2x=9 → 3x=9 → x=3" },
    ],
    examples: [
      { problem: "Solve: x + y = 10 and x - y = 2", steps: ["Add both equations:", "2x = 12 → x = 6", "Substitute: 6 + y = 10 → y = 4", "Solution: x=6, y=4"], answer: "x=6, y=4" },
      { problem: "Solve: 2x + y = 7 and x + y = 4", steps: ["Subtract second from first:", "x = 3", "Substitute: 3 + y = 4 → y = 1"], answer: "x=3, y=1" },
      { problem: "Solve: x + y = 5 and 2x - y = 4", steps: ["Add: 3x = 9 → x = 3", "y = 5 - 3 = 2"], answer: "x=3, y=2" },
      { problem: "Solve by substitution: y = 2x and x + y = 9", steps: ["Substitute y = 2x into second equation:", "x + 2x = 9 → 3x = 9 → x = 3", "y = 2(3) = 6"], answer: "x=3, y=6" },
      { problem: "How many solutions does x + y = 5 and x + y = 7 have?", steps: ["Both equations are parallel (same slope, different intercept)", "They never intersect → no solution"], answer: "No solution" },
    ],
  };
}

function addingPolynomialsTutorial(): TutorialContent {
  return {
    skillName: "Adding Polynomials",
    intro: "To add polynomials, combine like terms (same variable and exponent).",
    concepts: [
      { title: "Like Terms", formula: "Same variable AND same exponent = like terms", explanation: "You can ONLY combine terms that have exactly the same variable raised to the same power.", tip: "3x and 7x are like    3x and 3x² are NOT like" },
      { title: "Combining Like Terms", formula: "Add/subtract the COEFFICIENTS, keep the variable", explanation: "Only the number in front (coefficient) changes. The variable and exponent stay exactly the same.", tip: "3x² + 5x² = 8x² (only the 3+5 changes)" },
      { title: "Standard Form", formula: "Arrange terms: x³ → x² → x → constant (highest to lowest power)", explanation: "After combining, put terms in decreasing order of exponent.", tip: "(2x²+x)+(x+3) = 2x²+2x+3" },
    ],
    examples: [
      { problem: "(3x + 5) + (2x + 4) = ?", steps: ["Group like terms: (3x + 2x) + (5 + 4)", "= 5x + 9"], answer: "5x + 9" },
      { problem: "(x² + 3x) + (2x² + x) = ?", steps: ["x² terms: x² + 2x² = 3x²", "x terms: 3x + x = 4x", "Answer: 3x² + 4x"], answer: "3x² + 4x" },
      { problem: "(4x² - 2x + 1) + (x² + 5x - 3) = ?", steps: ["x² terms: 4x² + x² = 5x²", "x terms: -2x + 5x = 3x", "Constant: 1 + (-3) = -2", "Answer: 5x² + 3x - 2"], answer: "5x² + 3x - 2" },
      { problem: "(7x - 3) + (-4x + 8) = ?", steps: ["x terms: 7x + (-4x) = 3x", "Constants: -3 + 8 = 5", "Answer: 3x + 5"], answer: "3x + 5" },
      { problem: "(2x³ + x) + (x³ - 3x + 4) = ?", steps: ["x³ terms: 2x³ + x³ = 3x³", "x terms: x + (-3x) = -2x", "Constants: 0 + 4 = 4", "Answer: 3x³ - 2x + 4"], answer: "3x³ - 2x + 4" },
    ],
  };
}

function multiplyingPolynomialsTutorial(): TutorialContent {
  return {
    skillName: "Multiplying Polynomials",
    intro: "Use FOIL (First, Outer, Inner, Last) to multiply two binomials.",
    concepts: [
      { title: "FOIL Method", formula: "(a+b)(c+d) = First + Outer + Inner + Last", explanation: "Multiply each term in the first bracket by each term in the second. FOIL is the memory order.", tip: "(x+2)(x+3): F=x², O=3x, I=2x, L=6 → x²+5x+6" },
      { title: "Difference of Squares", formula: "(a+b)(a-b) = a² - b²", explanation: "When you multiply a sum and difference with the same terms, the middle terms cancel out perfectly.", tip: "(x+5)(x-5) = x²-25 (no middle term!)" },
      { title: "Perfect Square", formula: "(a+b)² = a² + 2ab + b²", explanation: "Squaring a binomial: square the first, double the product, square the last.", tip: "(x+3)² = x²+6x+9  (middle = 2×x×3)" },
    ],
    examples: [
      { problem: "(x + 2)(x + 3) = ?", steps: ["FOIL:", "First: x × x = x²", "Outer: x × 3 = 3x", "Inner: 2 × x = 2x", "Last: 2 × 3 = 6", "Combine: x² + 3x + 2x + 6 = x² + 5x + 6"], answer: "x² + 5x + 6" },
      { problem: "(x + 4)(x - 1) = ?", steps: ["First: x²", "Outer: -x", "Inner: 4x", "Last: -4", "Combine: x² + 3x - 4"], answer: "x² + 3x - 4" },
      { problem: "(x - 3)(x - 2) = ?", steps: ["First: x²", "Outer: -2x", "Inner: -3x", "Last: +6", "Combine: x² - 5x + 6"], answer: "x² - 5x + 6" },
      { problem: "(2x + 1)(x + 3) = ?", steps: ["First: 2x²", "Outer: 6x", "Inner: x", "Last: 3", "Combine: 2x² + 7x + 3"], answer: "2x² + 7x + 3" },
      { problem: "(x + 5)(x - 5) = ?", steps: ["This is difference of squares: (a+b)(a-b) = a² - b²", "= x² - 25"], answer: "x² - 25" },
    ],
  };
}

function factoringTutorial(): TutorialContent {
  return {
    skillName: "Factoring",
    intro: "Factoring is the reverse of expanding. Find two numbers that multiply to the constant and add to the middle coefficient.",
    concepts: [
      { title: "Factor Out the GCF First", formula: "Always check for a common factor before anything else", explanation: "If all terms share a common factor, factor it out first — it simplifies everything that follows.", tip: "6x + 9 = 3(2x + 3)" },
      { title: "Factoring x² + bx + c", formula: "Find two numbers: multiply to c AND add to b", explanation: "Search for a factor pair of c whose sum equals b. These become the constants in your two brackets.", tip: "x²+5x+6: 2×3=6 and 2+3=5 → (x+2)(x+3)" },
      { title: "Difference of Squares", formula: "a² - b² = (a+b)(a-b)", explanation: "Two perfect squares with a minus between them factor instantly with this pattern.", tip: "x²-16 = (x+4)(x-4)    4x²-9 = (2x+3)(2x-3)" },
    ],
    examples: [
      { problem: "Factor: x² + 5x + 6", steps: ["Find two numbers that multiply to 6 and add to 5.", "2 × 3 = 6 and 2 + 3 = 5 ✓", "Answer: (x + 2)(x + 3)"], answer: "(x + 2)(x + 3)" },
      { problem: "Factor: x² - 9 (difference of squares)", steps: ["x² - 9 = x² - 3²", "a² - b² = (a+b)(a-b)", "= (x + 3)(x - 3)"], answer: "(x + 3)(x - 3)" },
      { problem: "Factor: x² + 7x + 12", steps: ["Find two numbers: multiply to 12, add to 7", "3 × 4 = 12, 3 + 4 = 7 ✓", "Answer: (x + 3)(x + 4)"], answer: "(x + 3)(x + 4)" },
      { problem: "Factor out the GCF: 6x + 9", steps: ["GCF of 6 and 9 = 3", "3(2x + 3)"], answer: "3(2x + 3)" },
      { problem: "Factor: x² - x - 6", steps: ["Find two numbers: multiply to -6, add to -1", "-3 × 2 = -6, -3 + 2 = -1 ✓", "Answer: (x - 3)(x + 2)"], answer: "(x - 3)(x + 2)" },
    ],
  };
}

function quadraticEquationsTutorial(): TutorialContent {
  return {
    skillName: "Quadratic Equations",
    intro: "Quadratic equations have x². Solve by factoring: set each factor equal to zero.",
    concepts: [
      { title: "Standard Form", formula: "ax² + bx + c = 0  (everything on one side = 0)", explanation: "Always rearrange first. The equation must equal zero before you can use factoring or the formula.", tip: "x²+3x=4 → x²+3x-4=0 (standard form)" },
      { title: "Zero Product Property", formula: "If A × B = 0, then A=0 OR B=0", explanation: "If two things multiply to zero, at least one must be zero. This is how factoring leads to solutions.", tip: "(x-3)(x+2)=0 → x=3 or x=-2" },
      { title: "Methods", formula: "1. Factoring   2. Quadratic formula   3. Square root (when b=0)", explanation: "Choose the fastest method. Factoring works when numbers are nice. Formula always works.", tip: "x²=16 → x=±4 (square root method)" },
    ],
    examples: [
      { problem: "Solve: x² + 5x + 6 = 0", steps: ["Factor: (x + 2)(x + 3) = 0", "Set each factor to zero:", "x + 2 = 0 → x = -2", "x + 3 = 0 → x = -3", "Solutions: x = -2 or x = -3"], answer: "x = -2 or x = -3" },
      { problem: "Solve: x² - 7x + 12 = 0", steps: ["Factor: (x - 3)(x - 4) = 0", "x = 3 or x = 4"], answer: "x = 3 or x = 4" },
      { problem: "Solve: x² - 9 = 0", steps: ["x² = 9", "x = ±√9 = ±3", "x = 3 or x = -3"], answer: "x = 3 or x = -3" },
      { problem: "Solve: x² + 4x = 0", steps: ["Factor out x: x(x + 4) = 0", "x = 0 or x + 4 = 0", "x = 0 or x = -4"], answer: "x = 0 or x = -4" },
      { problem: "Solve: 2x² - 8 = 0", steps: ["2x² = 8", "x² = 4", "x = ±2"], answer: "x = 2 or x = -2" },
    ],
  };
}

function quadraticFormulaTutorial(): TutorialContent {
  return {
    skillName: "Quadratic Formula",
    intro: "For ax² + bx + c = 0, use x = (-b ± √(b²-4ac)) / 2a. The discriminant b²-4ac tells you how many solutions.",
    concepts: [
      { title: "The Quadratic Formula", formula: "x = (-b ± √(b²-4ac)) / 2a", explanation: "This formula gives exact solutions for any quadratic equation — it always works. Memorise it!", tip: "Negative b, plus or minus root, b squared minus 4ac, all over 2a" },
      { title: "The Discriminant", formula: "Δ = b²-4ac    Δ>0: two solutions    Δ=0: one    Δ<0: none", explanation: "Check the discriminant FIRST — it tells you how many real solutions exist before you do any work.", tip: "Δ=0 means a perfect square (repeated root)" },
      { title: "Identify a, b, c First", formula: "ax²+bx+c=0  →  write down a, b, c before substituting", explanation: "Clearly identify all three coefficients before substituting into the formula.", tip: "2x²-3x+1=0: a=2, b=-3, c=1" },
    ],
    examples: [
      { problem: "Solve x² + 4x + 4 = 0 using the quadratic formula", steps: ["a=1, b=4, c=4", "Discriminant: 4² - 4(1)(4) = 16 - 16 = 0", "x = -4 / 2 = -2 (one solution)"], answer: "x = -2" },
      { problem: "Solve x² - 5x + 6 = 0", steps: ["a=1, b=-5, c=6", "Discriminant: 25 - 24 = 1", "x = (5 ± 1) / 2", "x = 3 or x = 2"], answer: "x = 3 or x = 2" },
      { problem: "How many solutions does x² + x + 1 = 0 have?", steps: ["Discriminant: 1² - 4(1)(1) = 1 - 4 = -3", "Discriminant < 0 → no real solutions"], answer: "No real solutions" },
      { problem: "What is the discriminant of 2x² + 3x - 2 = 0?", steps: ["a=2, b=3, c=-2", "b² - 4ac = 9 - 4(2)(-2) = 9 + 16 = 25"], answer: "25 (two real solutions)" },
      { problem: "Solve x² - 4 = 0 using the quadratic formula", steps: ["a=1, b=0, c=-4", "x = (0 ± √16) / 2 = ±4/2 = ±2"], answer: "x = 2 or x = -2" },
    ],
  };
}

function parabolasTutorial(): TutorialContent {
  return {
    skillName: "Graphing Parabolas",
    intro: "The parabola y = a(x-h)² + k has vertex (h,k). If a>0 it opens up; if a<0 it opens down.",
    concepts: [
      { title: "Vertex Form", formula: "y = a(x-h)² + k   →   vertex = (h, k)", explanation: "Vertex form shows the vertex directly. h is x of the turning point, k is y.", tip: "y=(x-3)²+2: vertex=(3,2)" },
      { title: "Opens Up or Down?", formula: "a > 0: opens UP (smiley ∪)    a < 0: opens DOWN (frowny ∩)", explanation: "The sign of 'a' determines which way the parabola opens.", tip: "y=-2x² opens downward (a=-2 < 0)" },
      { title: "Axis of Symmetry", formula: "x = h  (vertical line through the vertex)", explanation: "Every parabola is perfectly symmetric about the vertical line x=h.", tip: "y=(x-4)²+1: axis of symmetry is x=4" },
    ],
    examples: [
      { problem: "Find the vertex of y = (x - 3)² + 2", steps: ["In y = a(x-h)² + k, h=3, k=2", "Vertex = (3, 2)"], answer: "Vertex: (3, 2)" },
      { problem: "Does y = -2(x+1)² + 5 open up or down?", steps: ["a = -2 (negative)", "Negative a → opens downward"], answer: "Downward" },
      { problem: "Find the vertex of y = x² - 6x + 8", steps: ["Complete the square or use h = -b/2a", "h = 6/2 = 3", "k = 3² - 6(3) + 8 = 9 - 18 + 8 = -1", "Vertex = (3, -1)"], answer: "Vertex: (3, -1)" },
      { problem: "What is the axis of symmetry of y = (x - 4)² + 1?", steps: ["Axis of symmetry passes through vertex x-coordinate.", "x = 4"], answer: "x = 4" },
      { problem: "Find the y-intercept of y = x² - 4x + 3", steps: ["Set x = 0: y = 0 - 0 + 3 = 3", "y-intercept = (0, 3)"], answer: "(0, 3)" },
    ],
  };
}

function functionNotationTutorial(): TutorialContent {
  return {
    skillName: "Function Notation",
    intro: "f(x) means 'the function f evaluated at x'. Simply substitute the value for x.",
    concepts: [
      { title: "Function Notation", formula: "f(x) = [expression]    f(a) = substitute x = a", explanation: "f(x) is just a name for an expression. To evaluate, replace every x with the given value.", tip: "f(x)=2x+1: f(3)=2(3)+1=7" },
      { title: "Input → Output", formula: "x (input) → function machine → f(x) (output)", explanation: "Same input always gives same output. Think of it as a machine.", tip: "f(x)=x²: f(4)=16 and f(-4)=16 — same output for different inputs!" },
      { title: "Multiple Functions", formula: "f(x), g(x), h(x) are different machines", explanation: "Different letter = different function = different rule.", tip: "f(x)=x+1, g(x)=2x: f(3)=4 but g(3)=6" },
    ],
    examples: [
      { problem: "If f(x) = 2x + 3, find f(4)", steps: ["Substitute x = 4:", "f(4) = 2(4) + 3 = 8 + 3 = 11"], answer: "11" },
      { problem: "If g(x) = x² - 1, find g(3)", steps: ["g(3) = 3² - 1 = 9 - 1 = 8"], answer: "8" },
      { problem: "If h(x) = 3x - 7, find h(0)", steps: ["h(0) = 3(0) - 7 = -7"], answer: "-7" },
      { problem: "If f(x) = x² + 2x, find f(-2)", steps: ["f(-2) = (-2)² + 2(-2) = 4 - 4 = 0"], answer: "0" },
      { problem: "If f(x) = 5 (constant function), find f(100)", steps: ["A constant function always returns the same value.", "f(100) = 5"], answer: "5" },
    ],
  };
}

function domainRangeTutorial(): TutorialContent {
  return {
    skillName: "Domain and Range",
    intro: "Domain = all valid x-values (inputs). Range = all possible y-values (outputs).",
    concepts: [
      { title: "Domain = Valid Inputs", formula: "domain = all x where f(x) is defined", explanation: "Some inputs are forbidden: dividing by zero, taking a root of a negative, or log of non-positive.", tip: "f(x)=1/x: x=0 is banned → domain: all x≠0" },
      { title: "Range = Possible Outputs", formula: "range = all y-values f(x) can actually produce", explanation: "The range is every y-value the function can output. Some functions can never produce certain values.", tip: "f(x)=x²: output always ≥0 → range: y≥0" },
      { title: "Common Restrictions", formula: "No ÷ by 0    No √(negative)    log(positive only)", explanation: "Three main domain restrictions to check for.", tip: "f(x)=√(x-4): need x-4≥0 → domain: x≥4" },
    ],
    examples: [
      { problem: "What is the domain of f(x) = 1/x?", steps: ["x cannot be 0 (division by zero is undefined)", "Domain: all real numbers except x = 0"], answer: "All real numbers except x = 0" },
      { problem: "What is the domain of f(x) = √x?", steps: ["Square root of a negative number is not real.", "x must be ≥ 0", "Domain: x ≥ 0"], answer: "x ≥ 0" },
      { problem: "What is the range of f(x) = x²?", steps: ["x² is always ≥ 0 for any real x", "Range: y ≥ 0"], answer: "y ≥ 0" },
      { problem: "What is the domain of f(x) = √(x - 4)?", steps: ["x - 4 ≥ 0", "x ≥ 4"], answer: "x ≥ 4" },
      { problem: "What is the range of f(x) = |x| + 2?", steps: ["|x| ≥ 0 always", "So |x| + 2 ≥ 2 always", "Range: y ≥ 2"], answer: "y ≥ 2" },
    ],
  };
}

function inverseFunctionsTutorial(): TutorialContent {
  return {
    skillName: "Inverse Functions",
    intro: "The inverse function f⁻¹ reverses what f does. To find it: swap x and y, then solve for y.",
    concepts: [
      { title: "What is an Inverse?", formula: "f⁻¹(f(x)) = x    and    f(f⁻¹(x)) = x", explanation: "The inverse completely undoes the original. If f adds 3, f⁻¹ subtracts 3.", tip: "f(x)=x+5: f⁻¹(x)=x-5" },
      { title: "How to Find the Inverse", formula: "Step 1: replace f(x) with y    Step 2: swap x and y    Step 3: solve for y", explanation: "This three-step method finds the inverse of any function.", tip: "y=2x+4 → swap → x=2y+4 → y=(x-4)/2" },
      { title: "Graphical Meaning", formula: "f and f⁻¹ are mirror images across y = x", explanation: "Every point (a,b) on f becomes (b,a) on f⁻¹.", tip: "If (2,7) is on f, then (7,2) is on f⁻¹" },
    ],
    examples: [
      { problem: "Find the inverse of f(x) = 2x + 4", steps: ["Write y = 2x + 4", "Swap x and y: x = 2y + 4", "Solve for y: 2y = x - 4, y = (x-4)/2", "f⁻¹(x) = (x-4)/2"], answer: "f⁻¹(x) = (x-4)/2" },
      { problem: "Find the inverse of f(x) = 3x", steps: ["y = 3x → swap → x = 3y", "y = x/3", "f⁻¹(x) = x/3"], answer: "f⁻¹(x) = x/3" },
      { problem: "Verify: if f(x) = 5x - 2, does f⁻¹(f(3)) = 3?", steps: ["f(3) = 5(3) - 2 = 13", "f⁻¹(13) = (13+2)/5 = 3 ✓"], answer: "Yes, f⁻¹(f(3)) = 3" },
      { problem: "Find the inverse of f(x) = x + 7", steps: ["y = x + 7 → x = y + 7", "y = x - 7", "f⁻¹(x) = x - 7"], answer: "f⁻¹(x) = x - 7" },
      { problem: "What is the relationship between a function and its inverse graphically?", steps: ["They are reflections of each other across the line y = x."], answer: "Reflections across y = x" },
    ],
  };
}

function rightTriangleTrigTutorial(): TutorialContent {
  return {
    skillName: "Right Triangle Trigonometry",
    intro: "SOH-CAH-TOA: sin = Opposite/Hypotenuse, cos = Adjacent/Hypotenuse, tan = Opposite/Adjacent.",
    concepts: [
      { title: "SOH-CAH-TOA", formula: "sin=Opp/Hyp    cos=Adj/Hyp    tan=Opp/Adj", explanation: "The three main trig ratios. SOH-CAH-TOA is the memory trick. Opp=opposite side, Adj=adjacent, Hyp=hypotenuse (longest side).", tip: "Some Old Hippie / Caught Another Hippie / Tripping On Acid" },
      { title: "Pythagorean Theorem", formula: "a² + b² = c²  (c = hypotenuse, the longest side)", explanation: "Find any missing side using the Pythagorean theorem.", tip: "Classic triples: 3-4-5, 5-12-13, 8-15-17" },
      { title: "Finding Angles", formula: "θ = sin⁻¹(opp/hyp)    θ = cos⁻¹(adj/hyp)    θ = tan⁻¹(opp/adj)", explanation: "Use inverse trig functions when you have two sides and need an angle.", tip: "sin(30°)=0.5    cos(60°)=0.5    tan(45°)=1" },
    ],
    examples: [
      { problem: "A right triangle has opposite=3, hypotenuse=5. Find sin(θ).", steps: ["SOH: sin = Opposite/Hypotenuse", "sin(θ) = 3/5"], answer: "3/5" },
      { problem: "A right triangle has adjacent=4, hypotenuse=5. Find cos(θ).", steps: ["CAH: cos = Adjacent/Hypotenuse", "cos(θ) = 4/5"], answer: "4/5" },
      { problem: "A right triangle has opposite=3, adjacent=4. Find tan(θ).", steps: ["TOA: tan = Opposite/Adjacent", "tan(θ) = 3/4"], answer: "3/4" },
      { problem: "Find the hypotenuse of a right triangle with legs 5 and 12.", steps: ["Pythagorean theorem: c² = a² + b²", "c² = 25 + 144 = 169", "c = √169 = 13"], answer: "13" },
      { problem: "A ladder 10m long leans against a wall at 30° to the ground. How high does it reach?", steps: ["sin(30°) = opposite/hypotenuse", "sin(30°) = 0.5", "Height = 10 × sin(30°) = 10 × 0.5 = 5m"], answer: "5 m" },
    ],
  };
}

function unitCircleTutorial(): TutorialContent {
  return {
    skillName: "Unit Circle",
    intro: "The unit circle has radius 1. At angle θ, the point is (cos θ, sin θ). Key angles: 0°, 30°, 45°, 60°, 90°.",
    concepts: [
      { title: "Unit Circle Definition", formula: "Point at angle θ = (cos θ, sin θ) on a circle of radius 1", explanation: "cos gives the x-coordinate, sin gives the y-coordinate. The circle ties geometry and algebra together.", tip: "At θ=0°: (1,0) meaning cos0=1 and sin0=0" },
      { title: "Key Angles to Memorise", formula: "0°=(1,0)  30°=(√3/2,½)  45°=(√2/2,√2/2)  60°=(½,√3/2)  90°=(0,1)", explanation: "These five angles appear on every exam. Memorise their coordinates.", tip: "sin pattern for 0→90°: 0, ½, √2/2, √3/2, 1" },
      { title: "ASTC — Sign Rule", formula: "All Students Take Calculus: Q1 all+  Q2 sin+  Q3 tan+  Q4 cos+", explanation: "In each quadrant, only certain trig functions are positive.", tip: "Q1: all +    Q2: only sin +    Q3: only tan +    Q4: only cos +" },
    ],
    examples: [
      { problem: "What is sin(0°) and cos(0°)?", steps: ["At 0°, the point is (1, 0)", "cos(0°) = 1, sin(0°) = 0"], answer: "sin(0°)=0, cos(0°)=1" },
      { problem: "What is sin(90°) and cos(90°)?", steps: ["At 90°, the point is (0, 1)", "cos(90°) = 0, sin(90°) = 1"], answer: "sin(90°)=1, cos(90°)=0" },
      { problem: "What is sin(45°)?", steps: ["At 45°, the point is (√2/2, √2/2)", "sin(45°) = √2/2 ≈ 0.707"], answer: "√2/2" },
      { problem: "What is cos(60°)?", steps: ["At 60°, the point is (1/2, √3/2)", "cos(60°) = 1/2"], answer: "1/2" },
      { problem: "In which quadrant is sin(θ) negative and cos(θ) positive?", steps: ["Quadrant I: both positive", "Quadrant II: sin+, cos-", "Quadrant III: both negative", "Quadrant IV: sin-, cos+"], answer: "Quadrant IV" },
    ],
  };
}

function trigIdentitiesTutorial(): TutorialContent {
  return {
    skillName: "Trig Identities",
    intro: "Trig identities are equations that are true for all angles. The most important: sin²θ + cos²θ = 1.",
    concepts: [
      { title: "Pythagorean Identity", formula: "sin²θ + cos²θ = 1", explanation: "The fundamental identity. Comes from the Pythagorean theorem applied to the unit circle.", tip: "Rearrange: sin²θ=1-cos²θ   or   cos²θ=1-sin²θ" },
      { title: "Derived Pythagorean Identities", formula: "1+tan²θ=sec²θ    1+cot²θ=csc²θ", explanation: "Divide the main identity by cos²θ or sin²θ to get these two variations.", tip: "Appear constantly in calculus and integration" },
      { title: "Double Angle Formulas", formula: "sin(2θ)=2sinθcosθ    cos(2θ)=cos²θ-sin²θ", explanation: "Double angle formulas reduce functions of 2θ to functions of θ.", tip: "cos(2θ) has three equivalent forms — choose the most useful" },
    ],
    examples: [
      { problem: "Complete: sin²θ + ___ = 1", steps: ["This is the Pythagorean identity.", "sin²θ + cos²θ = 1"], answer: "cos²θ" },
      { problem: "Simplify: 1 - cos²θ", steps: ["From sin²θ + cos²θ = 1", "Rearrange: sin²θ = 1 - cos²θ"], answer: "sin²θ" },
      { problem: "What is tan θ in terms of sin and cos?", steps: ["tan θ = sin θ / cos θ"], answer: "sin θ / cos θ" },
      { problem: "Simplify: sin²θ / cos²θ", steps: ["= (sin θ / cos θ)²", "= tan²θ"], answer: "tan²θ" },
      { problem: "What is sin(2θ)?", steps: ["Double angle formula:", "sin(2θ) = 2 sin θ cos θ"], answer: "2 sin θ cos θ" },
    ],
  };
}

function logarithmsTutorial(): TutorialContent {
  return {
    skillName: "Logarithms",
    intro: "log_b(x) = y means bʸ = x. The logarithm asks: 'What power do I raise b to, to get x?'",
    concepts: [
      { title: "Definition", formula: "log_b(x) = y  ⟺  bʸ = x", explanation: "A logarithm asks: what power do I raise the base to, to get this number? It is the inverse of exponentiation.", tip: "log₂(8)=3 because 2³=8" },
      { title: "Product Rule", formula: "log_b(MN) = log_b(M) + log_b(N)", explanation: "The log of a product equals the sum of the logs.", tip: "log(6×5) = log6 + log5" },
      { title: "Quotient Rule", formula: "log_b(M/N) = log_b(M) - log_b(N)", explanation: "The log of a quotient equals the difference of the logs.", tip: "log(8/2) = log8 - log2" },
      { title: "Power Rule", formula: "log_b(Mⁿ) = n · log_b(M)", explanation: "The log of a power brings the exponent down as a multiplier.", tip: "log(x³) = 3·log(x)" },
      { title: "Special Values", formula: "log_b(1)=0    log_b(b)=1    log_b(bⁿ)=n", explanation: "Four key values every student must know. The log of 1 is always 0. The log of the base is always 1.", tip: "log₃(3)=1   log₅(5⁴)=4   10^(log 7)=7" },
    ],
    examples: [
      { problem: "Evaluate: log₂(8)", steps: ["Ask: 2 to what power = 8?", "2¹ = 2, 2² = 4, 2³ = 8", "log₂(8) = 3"], answer: "3" },
      { problem: "Evaluate: log₁₀(1000)", steps: ["Ask: 10 to what power = 1000?", "10¹ = 10, 10² = 100, 10³ = 1000", "log(1000) = 3"], answer: "3" },
      { problem: "Solve: log₃(x) = 4", steps: ["log₃(x) = 4 means 3⁴ = x", "3⁴ = 3 × 3 × 3 × 3 = 81", "x = 81"], answer: "x = 81" },
      { problem: "Expand: log(AB)", steps: ["Product rule: log(AB) = log A + log B"], answer: "log A + log B" },
      { problem: "Simplify: log₅(5³)", steps: ["Power rule: log_b(bⁿ) = n", "log₅(5³) = 3"], answer: "3" },
    ],
  };
}

function exponentialFunctionsTutorial(): TutorialContent {
  return {
    skillName: "Exponential Functions",
    intro: "Exponential functions have the form f(x) = aˣ. They grow (or decay) at a constant percentage rate.",
    concepts: [
      { title: "Laws of Exponents", formula: "aᵐ·aⁿ=aᵐ⁺ⁿ    aᵐ/aⁿ=aᵐ⁻ⁿ    (aᵐ)ⁿ=aᵐⁿ    a⁰=1    a⁻ⁿ=1/aⁿ", explanation: "These five laws govern all exponential expressions. Memorise them.", tip: "2³×2⁴=2⁷=128    (3²)³=3⁶=729" },
      { title: "Growth vs Decay", formula: "base>1 → growth    0<base<1 → decay", explanation: "If the base is greater than 1, the function grows. If the base is between 0 and 1, it decays.", tip: "2ˣ grows    (0.5)ˣ decays" },
      { title: "The Number e", formula: "e ≈ 2.718    ln(x) = log_e(x)", explanation: "e is the base of natural growth. It appears in finance, science, and calculus.", tip: "e^(ln x)=x    ln(e^x)=x" },
    ],
    examples: [
      { problem: "Evaluate: 2⁴", steps: ["2⁴ = 2 × 2 × 2 × 2 = 16"], answer: "16" },
      { problem: "Evaluate: 3⁻²", steps: ["Negative exponent: a⁻ⁿ = 1/aⁿ", "3⁻² = 1/3² = 1/9"], answer: "1/9" },
      { problem: "Solve: 2ˣ = 32", steps: ["Write 32 as a power of 2:", "32 = 2⁵", "So 2ˣ = 2⁵ → x = 5"], answer: "x = 5" },
      { problem: "Is f(x) = (0.5)ˣ growth or decay?", steps: ["Base 0.5 < 1 → as x increases, f decreases", "This is exponential DECAY"], answer: "Exponential decay" },
      { problem: "What is the y-intercept of f(x) = 4ˣ + 2?", steps: ["Set x = 0: f(0) = 4⁰ + 2 = 1 + 2 = 3", "y-intercept = (0, 3)"], answer: "(0, 3)" },
    ],
  };
}

function complexNumbersTutorial(): TutorialContent {
  return {
    skillName: "Complex Numbers",
    intro: "Complex numbers have the form a + bi, where i = √(-1) and i² = -1. 'a' is the real part; 'b' is the imaginary part.",
    concepts: [
      { title: "The Imaginary Unit i", formula: "i = √(-1)    i² = -1    i³ = -i    i⁴ = 1", explanation: "We define i as the square root of -1. Powers of i cycle through 4 values.", tip: "Cycle: i, -1, -i, 1, i, -1, -i, 1..." },
      { title: "Complex Number Form", formula: "z = a + bi    a=real part    b=imaginary part", explanation: "Every complex number has a real part and an imaginary part. They cannot be combined.", tip: "3+4i: real=3, imaginary=4" },
      { title: "Conjugate and Modulus", formula: "conjugate of a+bi = a-bi    |a+bi| = √(a²+b²)", explanation: "The conjugate flips the sign of the imaginary part. The modulus is the distance from origin.", tip: "Conjugate of 3+4i = 3-4i    |3+4i|=5" },
    ],
    examples: [
      { problem: "What is i²?", steps: ["By definition: i = √(-1)", "i² = (√(-1))² = -1"], answer: "-1" },
      { problem: "Add: (3 + 2i) + (4 + 5i)", steps: ["Add real parts: 3 + 4 = 7", "Add imaginary parts: 2i + 5i = 7i", "Answer: 7 + 7i"], answer: "7 + 7i" },
      { problem: "Simplify: √(-9)", steps: ["√(-9) = √(9 × -1) = √9 × √(-1) = 3i"], answer: "3i" },
      { problem: "What is the conjugate of (5 + 3i)?", steps: ["The conjugate flips the sign of the imaginary part.", "Conjugate of (5 + 3i) = (5 - 3i)"], answer: "5 - 3i" },
      { problem: "Multiply: (2 + 3i)(2 - 3i)", steps: ["Use difference of squares: (a+b)(a-b) = a² - b²", "= 4 - (3i)² = 4 - 9i² = 4 - 9(-1) = 4 + 9 = 13"], answer: "13" },
    ],
  };
}

function limitsTutorial(): TutorialContent {
  return {
    skillName: "Limits",
    intro: "A limit describes what value a function approaches as x gets close to a specific value. Written as lim(x→a) f(x).",
    concepts: [
      { title: "Limit Definition", formula: "lim(x→a) f(x) = L", explanation: "The limit is about the journey, not the destination. What value does the function APPROACH as x gets close to a?", tip: "A limit can exist even if f(a) is undefined!" },
      { title: "Direct Substitution", formula: "If f is continuous at a: lim(x→a) f(x) = f(a)", explanation: "For well-behaved functions, just substitute x=a. Use more advanced methods only when you get 0/0 or ∞/∞.", tip: "lim(x→3) x²+1 = 10 (direct substitution)" },
      { title: "0/0 Form: Factor and Cancel", formula: "If 0/0: factor, cancel the problematic term", explanation: "When direct substitution gives 0/0, factor and cancel the term causing the zero.", tip: "lim(x→2)(x²-4)/(x-2) = lim(x+2) = 4" },
    ],
    examples: [
      { problem: "Find lim(x→3) of x + 2", steps: ["Simply substitute x = 3:", "3 + 2 = 5"], answer: "5" },
      { problem: "Find lim(x→0) of x²", steps: ["As x → 0: x² → 0² = 0"], answer: "0" },
      { problem: "Find lim(x→2) of (x² - 4)/(x - 2)", steps: ["Direct substitution gives 0/0 (indeterminate form)", "Factor numerator: (x+2)(x-2)/(x-2)", "Cancel (x-2): lim = x + 2 as x→2 = 4"], answer: "4" },
      { problem: "Find lim(x→∞) of 1/x", steps: ["As x gets very large, 1/x gets very small", "lim(x→∞) of 1/x = 0"], answer: "0" },
      { problem: "Find lim(x→0) of sin(x)/x", steps: ["This is a famous limit.", "lim(x→0) sin(x)/x = 1"], answer: "1" },
    ],
  };
}

function sequencesTutorial(): TutorialContent {
  return {
    skillName: "Sequences and Series",
    intro: "A sequence is an ordered list of numbers. An arithmetic sequence adds a constant; a geometric sequence multiplies by a constant.",
    concepts: [
      { title: "Arithmetic Sequence", formula: "aₙ = a₁ + (n-1)d    d = common difference", explanation: "Add the same number (d) each step. The nth term formula jumps directly to any term.", tip: "3,7,11,15: d=4    a₁₀ = 3+9×4 = 39" },
      { title: "Geometric Sequence", formula: "aₙ = a₁ × rⁿ⁻¹    r = common ratio", explanation: "Multiply by the same number (r) each step.", tip: "2,6,18,54: r=3    a₅=2×3⁴=162" },
      { title: "Identify the Type", formula: "Constant difference → arithmetic    Constant ratio → geometric", explanation: "Subtract consecutive terms: constant → arithmetic. Divide consecutive terms: constant → geometric.", tip: "1,4,7,10: diff=3 (arithmetic)    2,6,18: ratio=3 (geometric)" },
    ],
    examples: [
      { problem: "Find the next term: 3, 7, 11, 15, ___", steps: ["Common difference: 7-3 = 4", "Next term: 15 + 4 = 19"], answer: "19" },
      { problem: "Find the 10th term of: 2, 5, 8, 11, ...", steps: ["First term a = 2, common difference d = 3", "aₙ = a + (n-1)d", "a₁₀ = 2 + (10-1)×3 = 2 + 27 = 29"], answer: "29" },
      { problem: "Find the next term: 3, 6, 12, 24, ___", steps: ["Common ratio: 6/3 = 2", "Next term: 24 × 2 = 48"], answer: "48" },
      { problem: "Find the sum of an infinite geometric series: a=2, r=1/2", steps: ["Formula: S = a/(1-r)", "S = 2/(1-0.5) = 2/0.5 = 4"], answer: "4" },
      { problem: "Find the sum of first 5 terms: 1, 3, 5, 7, 9", steps: ["Arithmetic series sum: S = n/2 × (first + last)", "S = 5/2 × (1 + 9) = 5/2 × 10 = 25"], answer: "25" },
    ],
  };
}

function vectorsTutorial(): TutorialContent {
  return {
    skillName: "Vectors",
    intro: "A vector has magnitude (size) and direction. Written as (x, y). Add by adding components; magnitude = √(x² + y²).",
    concepts: [
      { title: "Vector Notation", formula: "v = (x, y) — an arrow with magnitude AND direction", explanation: "A 2D vector points from the origin to (x, y). It represents movement in two dimensions simultaneously.", tip: "Vector (3,4): go 3 right and 4 up" },
      { title: "Magnitude", formula: "|v| = √(x² + y²)  (Pythagorean theorem)", explanation: "The magnitude is the length of the vector arrow.", tip: "|(3,4)| = √(9+16) = √25 = 5" },
      { title: "Dot Product", formula: "u⃗·v⃗ = u₁v₁ + u₂v₂    result = 0 → perpendicular vectors", explanation: "Multiply matching components and add. A zero dot product means the vectors are at 90° to each other.", tip: "(2,3)·(4,5) = 8+15 = 23" },
    ],
    examples: [
      { problem: "Add vectors: (3, 4) + (1, 2)", steps: ["Add x components: 3 + 1 = 4", "Add y components: 4 + 2 = 6", "Result: (4, 6)"], answer: "(4, 6)" },
      { problem: "Find the magnitude of (3, 4)", steps: ["magnitude = √(x² + y²)", "= √(9 + 16) = √25 = 5"], answer: "5" },
      { problem: "Find the dot product of (2, 3) and (4, 5)", steps: ["Dot product = x₁x₂ + y₁y₂", "= 2×4 + 3×5 = 8 + 15 = 23"], answer: "23" },
      { problem: "Subtract: (5, 3) - (2, 1)", steps: ["Subtract components:", "(5-2, 3-1) = (3, 2)"], answer: "(3, 2)" },
      { problem: "If two vectors have dot product 0, what does that mean?", steps: ["Dot product = 0 means the vectors are perpendicular (90° angle)"], answer: "They are perpendicular" },
    ],
  };
}

function derivativesTutorial(): TutorialContent {
  return {
    skillName: "Derivatives",
    intro: "The derivative f'(x) measures the instantaneous rate of change. Power rule: d/dx[xⁿ] = nxⁿ⁻¹.",
    concepts: [
      { title: "Power Rule", formula: "d/dx[xⁿ] = nxⁿ⁻¹", explanation: "Bring the exponent down as a multiplier, then reduce the exponent by 1.", tip: "d/dx[x⁵]=5x⁴    d/dx[x²]=2x    d/dx[x]=1" },
      { title: "Sum Rule", formula: "d/dx[f±g] = f'±g'", explanation: "Differentiate each term separately. The derivative distributes over addition.", tip: "d/dx[x³+2x]=3x²+2" },
      { title: "Key Derivatives", formula: "d/dx[eˣ]=eˣ    d/dx[ln x]=1/x    d/dx[sin x]=cos x    d/dx[cos x]=-sin x", explanation: "These fundamental derivatives must be memorised.", tip: "eˣ is its own derivative!" },
    ],
    examples: [
      { problem: "Find d/dx[x³]", steps: ["Power rule: bring down exponent, reduce by 1", "d/dx[x³] = 3x²"], answer: "3x²" },
      { problem: "Find d/dx[5x²]", steps: ["Constant multiple rule: multiply constant by derivative", "d/dx[5x²] = 5 × 2x = 10x"], answer: "10x" },
      { problem: "Find d/dx[x⁴ + 3x]", steps: ["Differentiate term by term:", "d/dx[x⁴] = 4x³", "d/dx[3x] = 3", "Answer: 4x³ + 3"], answer: "4x³ + 3" },
      { problem: "Find d/dx[sin x]", steps: ["This is a standard derivative to memorise:", "d/dx[sin x] = cos x"], answer: "cos x" },
      { problem: "Find d/dx[e^x]", steps: ["The exponential function is its own derivative:", "d/dx[e^x] = e^x"], answer: "e^x" },
    ],
  };
}

function integralsTutorial(): TutorialContent {
  return {
    skillName: "Integrals",
    intro: "Integration is the reverse of differentiation. Power rule: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C.",
    concepts: [
      { title: "Power Rule for Integration", formula: "∫xⁿ dx = xⁿ⁺¹/(n+1) + C    (n ≠ -1)", explanation: "Increase the exponent by 1, then divide by the new exponent. Always add +C.", tip: "∫x² dx = x³/3 + C" },
      { title: "The +C", formula: "∫f(x)dx = F(x) + C", explanation: "The indefinite integral always has +C because there are infinitely many antiderivatives.", tip: "Both x²+5 and x²-3 differentiate to 2x" },
      { title: "Fundamental Theorem", formula: "∫[a to b] f(x)dx = F(b) - F(a)", explanation: "To evaluate a definite integral: find the antiderivative, then substitute and subtract.", tip: "∫[0 to 3] x dx = [x²/2] from 0 to 3 = 4.5" },
    ],
    examples: [
      { problem: "Find ∫x² dx", steps: ["Power rule: increase exponent by 1, divide by new exponent", "∫x² dx = x³/3 + C"], answer: "x³/3 + C" },
      { problem: "Find ∫4x dx", steps: ["∫4x dx = 4 × x²/2 + C = 2x² + C"], answer: "2x² + C" },
      { problem: "Evaluate ∫[0 to 2] x dx", steps: ["∫x dx = x²/2 + C", "Evaluate from 0 to 2:", "[x²/2] from 0 to 2 = 4/2 - 0/2 = 2"], answer: "2" },
      { problem: "Find ∫cos x dx", steps: ["Standard integral: ∫cos x dx = sin x + C"], answer: "sin x + C" },
      { problem: "Find ∫e^x dx", steps: ["The exponential integral: ∫e^x dx = e^x + C"], answer: "e^x + C" },
    ],
  };
}

function calculusApplicationsTutorial(): TutorialContent {
  return {
    skillName: "Calculus Applications",
    intro: "Derivatives find rates of change and extrema. Integrals find areas. Set f'(x) = 0 to find max/min points.",
    concepts: [
      { title: "Critical Points", formula: "Set f'(x)=0 and solve for x", explanation: "Critical points are where the slope is zero — possible local maxima or minima. Always check the second derivative to classify them.", tip: "f(x)=x²-4x: f'(x)=2x-4=0 → x=2 is a critical point" },
      { title: "Second Derivative Test", formula: "f''(x)>0: local min    f''(x)<0: local max", explanation: "Positive second derivative = concave up = bowl = minimum. Negative = concave down = hill = maximum.", tip: "Think: bowl (min) vs hill (max)" },
      { title: "Area Under a Curve", formula: "Area = ∫[a to b] f(x) dx = F(b) - F(a)", explanation: "The definite integral gives the area between the curve and x-axis from a to b.", tip: "Area under y=x from 0 to 4: [x²/2] = 8" },
    ],

    examples: [
      { problem: "If f(x) = x², at what x is the slope of the tangent = 4?", steps: ["f'(x) = 2x", "Set 2x = 4: x = 2"], answer: "x = 2" },
      { problem: "Find the critical points of f(x) = x³ - 3x", steps: ["f'(x) = 3x² - 3", "Set f'(x) = 0: 3x² - 3 = 0", "x² = 1 → x = ±1"], answer: "x = 1 and x = -1" },
      { problem: "If f''(x) > 0 at a critical point, is it a max or min?", steps: ["f''(x) > 0 means the function is concave up at that point.", "It is a local MINIMUM."], answer: "Local minimum" },
      { problem: "Find the area under y = 2x from x=0 to x=3.", steps: ["∫[0 to 3] 2x dx = [x²] from 0 to 3 = 9 - 0 = 9"], answer: "9 square units" },
      { problem: "A ball has position s(t) = -5t² + 20t. When is velocity = 0?", steps: ["Velocity = s'(t) = -10t + 20", "Set to 0: -10t + 20 = 0 → t = 2 seconds"], answer: "t = 2 seconds" },
    ],
  };
}

function genericMathTutorial(skillName: string): TutorialContent {
  return {
    skillName,
    intro: `Let's learn ${skillName} step by step with worked examples.`,
    examples: [
      { problem: "Example 1: Start with the basics", steps: ["Read the problem carefully.", "Identify what you know and what you need to find.", "Choose the right method."], answer: "Follow the steps" },
      { problem: "Example 2: Apply the method", steps: ["Write down the formula or method.", "Substitute your values.", "Simplify step by step."], answer: "Check your work" },
      { problem: "Example 3: Check your answer", steps: ["After solving, verify your answer makes sense.", "Substitute back to check."], answer: "Verified" },
      { problem: "Example 4: Common mistakes to avoid", steps: ["Always show your working.", "Don't skip steps.", "Check signs (+ and -) carefully."], answer: "Take care with signs" },
      { problem: "Example 5: Practice tip", steps: ["The more you practise, the faster you'll get.", "Focus on accuracy first, then speed."], answer: "Practice makes perfect" },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// READING TUTORIALS
// ─────────────────────────────────────────────────────────────────────────────

function getReadingTutorial(skill: string, skillName: string): TutorialContent {
  if (skill.includes("letter") || skill.includes("alphabet") || skill.includes("recognition")) return letterRecognitionTutorial();
  if (skill.includes("phonic") || skill.includes("vowel") || skill.includes("blend") || skill.includes("sound")) return phonicsTutorial();
  if (skill.includes("sight") || skill.includes("dolch") || skill.includes("high frequency")) return sightWordsTutorial();
  if (skill.includes("main idea") || skill.includes("topic")) return mainIdeaTutorial();
  if (skill.includes("cause") || skill.includes("effect")) return causeEffectTutorial();
  if (skill.includes("context") || skill.includes("vocabulary")) return contextCluesTutorial();
  if (skill.includes("inference") || skill.includes("infer")) return inferenceTutorial();
  if (skill.includes("figurative") || skill.includes("metaphor") || skill.includes("simile")) return figurativeLanguageTutorial();
  if (skill.includes("compare") || skill.includes("contrast")) return compareContrastTutorial();
  if (skill.includes("point of view") || skill.includes("narrator") || skill.includes("perspective")) return pointOfViewTutorial();
  if (skill.includes("text structure") || skill.includes("structure")) return textStructureTutorial();
  if (skill.includes("comprehension")) return comprehensionTutorial();
  return comprehensionTutorial();
}

function mainIdeaTutorial(): TutorialContent {
  return {
    skillName: "Main Idea",
    intro: "The main idea is the most important point in a passage. Supporting details give more information about it.",
    concepts: [
      { title: "Main Idea vs Supporting Details", formula: "Main idea = what the WHOLE passage is about", explanation: "The main idea is the umbrella covering every sentence. Supporting details are specific facts that explain or prove it.", tip: "If an idea only appears in one sentence, it is probably a detail" },
      { title: "The Topic Sentence", formula: "Usually the FIRST sentence of a paragraph", explanation: "The topic sentence states the main idea directly. Ask: what is every sentence in this passage about?", tip: "Main idea is broad enough for ALL details to support it" },
      { title: "Eliminate the Details", formula: "Too specific → detail    Covers whole passage → main idea", explanation: "Test each option: can every other sentence relate to it? If yes, that is the main idea.", tip: "'Bees dance' = detail.   'Bees are remarkable' = main idea." },
    ],
    examples: [
      { problem: "How do you find the main idea?", steps: ["Ask: 'What is this MOSTLY about?'", "The main idea covers the whole passage, not just one part.", "Supporting details are smaller facts that back it up."], answer: "What the whole passage is about" },
      { problem: "Read: 'Dogs make great pets. They are loyal, friendly, and love to play.' What is the main idea?", steps: ["The whole passage talks about dogs as pets.", "Main idea: Dogs make great pets."], answer: "Dogs make great pets" },
      { problem: "Which is a main idea vs supporting detail?", steps: ["'Exercise is important for health.' (main idea)", "'Running burns 300 calories per hour.' (supporting detail)", "The supporting detail explains the main idea."], answer: "Supporting detail gives evidence for the main idea" },
      { problem: "Where is the main idea usually found?", steps: ["Often in the first sentence (topic sentence).", "Sometimes in the last sentence.", "Always ask: what is the whole passage about?"], answer: "Often in the first sentence" },
      { problem: "Practice: 'Bees pollinate flowers, produce honey, and help ecosystems survive.' What is the main idea?", steps: ["The sentence lists three things bees do.", "Main idea: Bees are important and have many roles."], answer: "Bees are important to nature" },
    ],
  };
}

function causeEffectTutorial(): TutorialContent {
  return {
    skillName: "Cause and Effect",
    intro: "Cause = why something happened. Effect = what happened as a result. Look for signal words: because, so, therefore, as a result.",
    concepts: [
      { title: "Cause → Effect", formula: "Cause = WHY    Effect = WHAT HAPPENED", explanation: "A cause comes BEFORE an effect. The cause is the reason. The effect is the result.", tip: "Heavy rain (cause) → flooded streets (effect)" },
      { title: "Signal Words for Cause", formula: "because · since · due to · as a result of · caused by", explanation: "These words introduce the REASON behind something.", tip: "'Because' almost always introduces a cause" },
      { title: "Signal Words for Effect", formula: "so · therefore · thus · consequently · as a result · which led to", explanation: "These words introduce WHAT HAPPENED as a result.", tip: "'Therefore' and 'so' introduce effects" },
    ],
    examples: [
      { problem: "Identify cause and effect: 'It rained heavily, so the streets flooded.'", steps: ["Signal word: 'so' shows cause → effect", "Cause: It rained heavily", "Effect: The streets flooded"], answer: "Cause: heavy rain; Effect: flooded streets" },
      { problem: "Identify cause and effect: 'Because she studied hard, she passed the exam.'", steps: ["Signal word: 'because' shows cause", "Cause: She studied hard", "Effect: She passed the exam"], answer: "Cause: studied hard; Effect: passed exam" },
      { problem: "What are signal words for cause?", steps: ["'because', 'since', 'due to', 'as a result of'", "These words introduce the REASON something happened."], answer: "because, since, due to" },
      { problem: "What are signal words for effect?", steps: ["'so', 'therefore', 'as a result', 'consequently', 'thus'", "These words introduce WHAT HAPPENED."], answer: "so, therefore, as a result" },
      { problem: "Read: 'The volcano erupted. As a result, thousands of people evacuated.' Identify cause and effect.", steps: ["Cause: The volcano erupted", "Signal: 'As a result'", "Effect: Thousands of people evacuated"], answer: "Cause: eruption; Effect: evacuation" },
    ],
  };
}

function contextCluesTutorial(): TutorialContent {
  return {
    skillName: "Context Clues",
    intro: "Context clues are hints in the surrounding text that help you figure out the meaning of an unfamiliar word.",
    concepts: [
      { title: "4 Types of Context Clues", formula: "Definition · Synonym · Antonym · Inference", explanation: "Definition clues define the word in the text. Synonym clues give a similar word. Antonym clues give an opposite. Inference clues require reasoning.", tip: "Look for signal words: 'means', 'or', 'unlike', 'but', 'however'" },
      { title: "Antonym Clues", formula: "Unlike / However / But + opposite nearby", explanation: "When contrast words appear, the meanings on each side are often opposites.", tip: "'Unlike the serene lake, the river was wild' → serene = calm (opposite of wild)" },
      { title: "Test Your Guess", formula: "Substitute your definition back into the sentence", explanation: "Replace the unknown word with your definition. Does it still make sense?", tip: "If it makes sense → you found the meaning!" },
    ],
    examples: [
      { problem: "What are the types of context clues?", steps: ["Definition clues: the word is defined in the sentence", "Synonym clues: a similar word nearby", "Antonym clues: an opposite word nearby", "Inference clues: you have to reason it out"], answer: "Definition, synonym, antonym, inference" },
      { problem: "'The tenacious dog refused to let go of the bone, no matter what.' What does 'tenacious' mean?", steps: ["The context shows the dog would NOT let go.", "This suggests 'tenacious' means holding on firmly or persistent."], answer: "Persistent, holding firm" },
      { problem: "'Unlike the serene lake, the river was wild and churning.' What does 'serene' mean?", steps: ["'Unlike' signals a contrast (antonym clue).", "The river is wild and churning — the opposite of serene.", "Serene = calm and peaceful."], answer: "Calm, peaceful" },
      { problem: "'She was famished — she hadn't eaten in 12 hours.' What does 'famished' mean?", steps: ["The dash introduces an explanation.", "Not eating for 12 hours explains why she's famished.", "Famished = very hungry."], answer: "Very hungry" },
      { problem: "Strategy: What should you do when you find an unknown word?", steps: ["1. Read the whole sentence for clues.", "2. Look for signal words (unlike, or, which means, etc.)", "3. Try replacing the unknown word with your guess.", "4. Does the sentence still make sense?"], answer: "Use context clues to infer meaning" },
    ],
  };
}

function inferenceTutorial(): TutorialContent {
  return {
    skillName: "Making Inferences",
    intro: "An inference is a conclusion you draw using evidence from the text + your own knowledge. It's reading between the lines.",
    concepts: [
      { title: "Inference Formula", formula: "Text evidence + Prior knowledge = Inference", explanation: "An inference is never a wild guess. It combines a specific clue from the text with something you already know.", tip: "Always be able to point to the text clue behind your inference" },
      { title: "Inference vs Assumption", formula: "Inference = backed by text    Assumption = no evidence", explanation: "Strong inferences are anchored to the text. Always ask: what in the text made me think that?", tip: "Exams reward inferences WITH text evidence" },
      { title: "Common Inference Types", formula: "Character feelings · Setting · Author purpose · Implied meaning", explanation: "You can infer emotions not stated, setting details not described, and information only implied.", tip: "'He slammed the door' → infer: he is angry (not stated, but implied)" },
    ],
    examples: [
      { problem: "What is an inference?", steps: ["An inference uses CLUES in the text + what you ALREADY KNOW", "The author doesn't say it directly — you figure it out.", "Formula: Text clue + Prior knowledge = Inference"], answer: "A logical conclusion based on evidence" },
      { problem: "'Sam grabbed an umbrella before leaving.' What can you infer?", steps: ["Text clue: Sam took an umbrella.", "Prior knowledge: Umbrellas are used in rain.", "Inference: It is raining or might rain."], answer: "It is raining (or expected to rain)" },
      { problem: "'Maria's hands shook as she stepped onto the stage.' What can you infer about Maria?", steps: ["Text clue: hands shook", "Prior knowledge: shaking = nervousness", "Inference: Maria is nervous."], answer: "Maria is nervous" },
      { problem: "What makes a STRONG inference vs a WEAK inference?", steps: ["Strong: supported by specific evidence in the text", "Weak: a guess with no evidence", "Always cite the text clue that supports your inference."], answer: "Strong inference has specific text evidence" },
      { problem: "'The class was silent. Every student stared at their test paper.' Infer what is happening.", steps: ["Clues: silent class, students staring at test papers", "Inference: The class is taking a test/exam."], answer: "Students are taking a test" },
    ],
  };
}

function figurativeLanguageTutorial(): TutorialContent {
  return {
    skillName: "Figurative Language",
    intro: "Figurative language uses words non-literally to create vivid images. Key devices: simile, metaphor, personification, hyperbole.",
    concepts: [
      { title: "Simile", formula: "Comparison using 'like' or 'as'", explanation: "A simile compares two unlike things using 'like' or 'as', creating a vivid mental image.", tip: "'She ran LIKE the wind.'   'He was AS strong AS an ox.'" },
      { title: "Metaphor", formula: "Says one thing IS another — no 'like' or 'as'", explanation: "A metaphor makes a direct comparison. Stronger and more immediate than a simile.", tip: "'Life IS a journey.'   'Time IS money.'" },
      { title: "Personification & Hyperbole", formula: "Personification = human traits to non-humans    Hyperbole = extreme exaggeration", explanation: "Personification gives human qualities to objects. Hyperbole exaggerates wildly for effect.", tip: "'Stars danced.' (personification)   'I told you a million times!' (hyperbole)" },
    ],
    examples: [
      { problem: "What is a simile?", steps: ["A simile compares two things using 'like' or 'as'.", "Example: 'She ran like the wind.'", "Example: 'He was as strong as an ox.'"], answer: "Comparison using 'like' or 'as'" },
      { problem: "What is a metaphor?", steps: ["A metaphor says one thing IS another (without like/as).", "Example: 'Life is a journey.'", "Example: 'Time is money.'"], answer: "Direct comparison (says one thing IS another)" },
      { problem: "What is personification?", steps: ["Personification gives human qualities to non-human things.", "Example: 'The wind whispered through the trees.'", "Example: 'The stars danced in the sky.'"], answer: "Giving human traits to non-human things" },
      { problem: "'Her smile was a ray of sunshine.' Is this a simile or metaphor?", steps: ["There is no 'like' or 'as'.", "Her smile IS CALLED a ray of sunshine (direct comparison).", "This is a METAPHOR."], answer: "Metaphor" },
      { problem: "What is hyperbole?", steps: ["Hyperbole is extreme exaggeration for effect.", "Example: 'I've told you a million times!'", "Example: 'I'm so hungry I could eat a horse.'"], answer: "Extreme exaggeration for effect" },
    ],
  };
}

function comprehensionTutorial(): TutorialContent {
  return {
    skillName: "Reading Comprehension",
    intro: "Reading comprehension means understanding what you read — the meaning, not just the words.",
    concepts: [
      { title: "Active Reading", formula: "Preview → Question → Read → Reflect → Summarise", explanation: "The best readers constantly ask: What is happening? Why? What comes next?", tip: "Re-read difficult sentences. Never rush past confusion." },
      { title: "Literal vs Inferential", formula: "Literal = answer IN the text    Inferential = read between lines", explanation: "Literal questions you can point to. Inferential questions require reasoning from clues.", tip: "Literal: 'What did she eat?'   Inferential: 'Why was she sad?'" },
      { title: "Author's Purpose", formula: "PIE: Persuade · Inform · Entertain", explanation: "Every text is written for a reason. Ask: why did the author write this?", tip: "Opinion + 'you should' = Persuade    Facts/data = Inform    Story = Entertain" },
    ],
    examples: [
      { problem: "What are the key reading comprehension strategies?", steps: ["1. Preview: read the title and headings first", "2. Read actively: ask questions as you read", "3. Visualise: picture what is happening", "4. Summarise: put the main points in your own words", "5. Re-read confusing parts"], answer: "Preview, question, visualise, summarise, re-read" },
      { problem: "How do you answer a comprehension question?", steps: ["1. Read the question carefully", "2. Find the relevant part of the passage", "3. Write your answer in your own words", "4. Use evidence from the text to support it"], answer: "Find evidence in the text" },
      { problem: "What is the difference between 'literal' and 'inferential' questions?", steps: ["Literal: the answer is directly stated in the text", "Inferential: you have to read between the lines", "Example literal: 'What did she eat?'", "Example inferential: 'Why was she happy?'"], answer: "Literal = in the text; Inferential = read between lines" },
      { problem: "How do you find the author's purpose?", steps: ["Ask: Why did the author write this?", "To inform (give facts)", "To persuade (convince you)", "To entertain (tell a story)"], answer: "To inform, persuade, or entertain" },
      { problem: "What is a summary?", steps: ["A summary is a short retelling of the MAIN POINTS only.", "Leave out minor details.", "Use your own words.", "Should be much shorter than the original."], answer: "A brief retelling of the main points in your own words" },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITING TUTORIALS
// ─────────────────────────────────────────────────────────────────────────────

function getWritingTutorial(skill: string, skillName: string): TutorialContent {
  if (skill.includes("letter recognition") || skill.includes("uppercase") || skill.includes("lowercase") || skill.includes("sentence completion")) return letterRecognitionTutorial();
  if (skill.includes("noun")) return nounsTutorial();
  if (skill.includes("verb")) return verbsTutorial();
  if (skill.includes("adjective")) return adjectivesTutorial();
  if (skill.includes("punctuation") || skill.includes("capitalization")) return punctuationTutorial();
  if (skill.includes("sentence")) return sentencesTutorial();
  if (skill.includes("spell")) return spellingTutorial();
  if (skill.includes("edit") || skill.includes("proofread") || skill.includes("revise")) return editingProofreadingTutorial();
  if (skill.includes("paragraph") || skill.includes("topic")) return paragraphsTutorial();
  if (skill.includes("essay")) return essayTutorial();
  if (skill.includes("persuasive")) return persuasiveTutorial();
  if (skill.includes("narrative")) return narrativeTutorial();
  return paragraphsTutorial();
}

function nounsTutorial(): TutorialContent {
  return {
    skillName: "Nouns",
    intro: "A noun names a person, place, thing, or idea. Proper nouns name specific things and are always capitalised.",
    concepts: [
      { title: "Types of Nouns", formula: "Common = general    Proper = specific (capitalised!)", explanation: "Common nouns name general things (city, teacher). Proper nouns name specific things — always capitalised.", tip: "city = common    London = proper" },
      { title: "Concrete vs Abstract", formula: "Concrete = physical (can touch/see)    Abstract = ideas/emotions", explanation: "Concrete nouns are physical. Abstract nouns are ideas or feelings you cannot touch.", tip: "apple = concrete    happiness = abstract" },
      { title: "Singular vs Plural", formula: "Regular: add -s or -es    Irregular: change the whole word", explanation: "Most plurals just add -s. Irregular plurals must be memorised.", tip: "child→children    man→men    tooth→teeth    mouse→mice" },
    ],
    examples: [
      { problem: "What is a noun?", steps: ["A noun names: a person (teacher, Maria), a place (school, Canada), a thing (book, car), an idea (happiness, freedom)"], answer: "Person, place, thing, or idea" },
      { problem: "Find the nouns: 'The dog chased the cat into the garden.'", steps: ["dog = thing ✓", "cat = thing ✓", "garden = place ✓"], answer: "dog, cat, garden" },
      { problem: "What is a proper noun? Give an example.", steps: ["A proper noun names a specific person, place, or thing.", "It is always capitalised.", "Examples: London, Maria, Monday, Eduyro"], answer: "A specific name, always capitalised (e.g., London)" },
      { problem: "What is an abstract noun?", steps: ["Abstract nouns name things you cannot touch or see.", "Examples: love, freedom, courage, happiness"], answer: "A noun for ideas/feelings (e.g., love, freedom)" },
      { problem: "Change to plural: child, man, woman, mouse", steps: ["child → children", "man → men", "woman → women", "mouse → mice", "These are irregular plurals — memorise them!"], answer: "children, men, women, mice" },
    ],
  };
}

function verbsTutorial(): TutorialContent {
  return {
    skillName: "Verbs",
    intro: "A verb expresses an action (run, eat) or a state of being (is, are, was). Every sentence needs a verb.",
    concepts: [
      { title: "Action vs Linking Verbs", formula: "Action = something happening    Linking = connects subject to description", explanation: "Action verbs describe what the subject does. Linking verbs (is, are, was, seem) connect the subject to an adjective or noun.", tip: "'She runs' = action    'She is tall' = linking" },
      { title: "Verb Tenses", formula: "Past: -ed    Present: base form    Future: will + verb", explanation: "Tense tells you WHEN the action happens. Most verbs add -ed for past tense. Irregular verbs change completely.", tip: "walk→walked (regular)    go→went (irregular)" },
      { title: "Subject-Verb Agreement", formula: "Singular subject → verb +s    Plural subject → no +s", explanation: "The verb must match its subject in number.", tip: "'She run' is WRONG    'She runs' is CORRECT" },
    ],
    examples: [
      { problem: "What is a verb?", steps: ["Action verbs show action: run, jump, eat, write", "Linking verbs show state: is, are, was, were, seem, feel"], answer: "Action or state of being word" },
      { problem: "Find the verb: 'She quickly ran to school.'", steps: ["Ask: what did she DO?", "She ran → 'ran' is the verb"], answer: "ran" },
      { problem: "Change to past tense: 'She runs every day.'", steps: ["Regular past tense adds -ed: run → ran (irregular)", "'She ran every day.'"], answer: "She ran every day." },
      { problem: "Change to future tense: 'He eats breakfast.'", steps: ["Add 'will': 'He will eat breakfast.'"], answer: "He will eat breakfast." },
      { problem: "What is subject-verb agreement?", steps: ["Singular subject → singular verb: 'She runs.'", "Plural subject → plural verb: 'They run.'", "Common error: 'She run' ✗ → 'She runs' ✓"], answer: "Subject and verb must match in number" },
    ],
  };
}

function adjectivesTutorial(): TutorialContent {
  return {
    skillName: "Adjectives",
    intro: "An adjective describes or modifies a noun. It answers: What kind? How many? Which one?",
    concepts: [
      { title: "What Adjectives Do", formula: "Adjective answers: what kind? which one? how many?", explanation: "Adjectives modify nouns, making them more specific.", tip: "The BIG RED ball → big and red are both adjectives" },
      { title: "Comparative and Superlative", formula: "Two things: +er (bigger)    Three+ things: +est (biggest)", explanation: "Use comparative for two things, superlative for three or more.", tip: "Short words: +er/+est    Long words: more.../most..." },
      { title: "Adjective vs Adverb", formula: "Adjective modifies NOUN    Adverb modifies VERB/adjective", explanation: "Adjectives describe nouns. Adverbs (often ending in -ly) describe verbs.", tip: "'quick' is adjective    'quickly' is adverb" },
    ],
    examples: [
      { problem: "What is an adjective?", steps: ["An adjective describes a noun.", "Examples: big dog, red apple, five students, this book"], answer: "A word that describes a noun" },
      { problem: "Find the adjective: 'She wore a beautiful blue dress.'", steps: ["What kind of dress? Beautiful and blue.", "Adjectives: beautiful, blue"], answer: "beautiful, blue" },
      { problem: "Form the comparative: big → bigger → ___", steps: ["Comparative: add -er (for short words)", "Superlative: add -est", "big → bigger → biggest"], answer: "biggest" },
      { problem: "Form the comparative: beautiful → more beautiful → ___", steps: ["For longer words, use 'more' and 'most'", "beautiful → more beautiful → most beautiful"], answer: "most beautiful" },
      { problem: "Is 'quickly' an adjective or adverb?", steps: ["Adjectives modify nouns.", "'Quickly' modifies a VERB (ran quickly).", "Words ending in -ly that modify verbs are ADVERBS."], answer: "Adverb (modifies a verb)" },
    ],
  };
}

function punctuationTutorial(): TutorialContent {
  return {
    skillName: "Punctuation",
    intro: "Punctuation helps readers understand your writing. Every sentence must end with a period, question mark, or exclamation mark.",
    concepts: [
      { title: "End Punctuation", formula: ". statement    ? question    ! strong emotion or command", explanation: "Every sentence ends with one of three marks. Choose based on the type of sentence.", tip: "'The cat sat.' ✓    'Where is it.' ✗ → 'Where is it?' ✓" },
      { title: "The Comma", formula: "Lists · Compound sentences (before FANBOYS) · After introductory clauses", explanation: "Commas separate list items, join clauses before and/but/or, and follow introductory phrases.", tip: "'After dinner, we watched TV.' ← comma after introductory phrase" },
      { title: "Apostrophes", formula: "Contraction: it's = it is    Possession: the dog's bone", explanation: "Apostrophes replace missing letters in contractions and show ownership.", tip: "it's (it is) vs its (belonging to it) — most common confusion!" },
    ],
    examples: [
      { problem: "When do you use a period (.)?", steps: ["At the end of a statement.", "Example: 'The cat sat on the mat.'"], answer: "End of a statement" },
      { problem: "When do you use a question mark (?)?", steps: ["At the end of a question.", "Example: 'Where are you going?'"], answer: "End of a question" },
      { problem: "When do you use a comma (,)?", steps: ["To separate items in a list: 'apples, oranges, and grapes'", "Before conjunctions in compound sentences: 'I studied, but I was tired.'", "After introductory clauses: 'After dinner, we went for a walk.'"], answer: "Lists, compound sentences, introductory clauses" },
      { problem: "Fix the sentence: 'my name is kai and i live in toronto'", steps: ["Capitalise first word: 'My'", "Capitalise proper nouns: 'Kai', 'Toronto'", "Add comma before 'and': 'My name is Kai, and I live in Toronto.'"], answer: "My name is Kai, and I live in Toronto." },
      { problem: "When do you use an apostrophe (')?", steps: ["In contractions: it's (it is), don't (do not)", "To show possession: the dog's bone, Maria's book"], answer: "Contractions and possession" },
    ],
  };
}

function sentencesTutorial(): TutorialContent {
  return {
    skillName: "Sentences",
    intro: "A complete sentence has a subject (who/what) and a predicate (what they do/are). It expresses a complete thought.",
    concepts: [
      { title: "Complete Sentence Requirements", formula: "Subject + Predicate = Complete sentence", explanation: "Missing either the subject or predicate makes a fragment — not a sentence.", tip: "'The dog' = fragment (no predicate)    'Runs fast.' = fragment (no subject)" },
      { title: "Three Sentence Errors", formula: "Fragment = incomplete    Run-on = two sentences fused    Comma splice = only comma joining them", explanation: "Avoid all three errors in writing.", tip: "'I like dogs, they are loyal.' is a COMMA SPLICE — add 'and' or use a period" },
      { title: "Sentence Types", formula: "Simple · Compound · Complex", explanation: "Vary sentence types for better writing. Simple (1 clause). Compound (2+ independent). Complex (independent + dependent).", tip: "Compound: 'She sang AND I danced.'   Complex: 'ALTHOUGH it rained, she played.'" },
    ],
    examples: [
      { problem: "What makes a complete sentence?", steps: ["Subject: who or what the sentence is about", "Predicate: what the subject does or is", "Example: 'The dog (subject) runs fast (predicate).'"], answer: "Subject + predicate = complete thought" },
      { problem: "Is 'Running fast.' a complete sentence?", steps: ["Subject: who is running? Not stated.", "This is a sentence fragment (missing subject).", "Fix: 'She was running fast.'"], answer: "No — it's a fragment (missing subject)" },
      { problem: "Fix this run-on: 'I like dogs I have two of them.'", steps: ["Two sentences joined without punctuation.", "Fix 1: 'I like dogs. I have two of them.'", "Fix 2: 'I like dogs, and I have two of them.'"], answer: "I like dogs. I have two of them." },
      { problem: "What is a compound sentence?", steps: ["Two independent clauses joined by a conjunction (and, but, or, so)", "Example: 'She studied hard, and she passed the test.'"], answer: "Two independent clauses joined by a conjunction" },
      { problem: "What is a complex sentence?", steps: ["An independent clause + a dependent clause.", "Dependent clauses start with: although, because, when, if", "Example: 'Although it rained, we went outside.'"], answer: "Independent + dependent clause" },
    ],
  };
}

function paragraphsTutorial(): TutorialContent {
  return {
    skillName: "Paragraph Writing",
    intro: "A paragraph develops ONE main idea. It has a topic sentence, supporting details, and a concluding sentence.",
    concepts: [
      { title: "Paragraph Structure", formula: "Topic sentence → Supporting details (3+) → Concluding sentence", explanation: "Every paragraph develops ONE idea. Topic announces it. Details prove it. Conclusion wraps it up.", tip: "Think of it as a burger: top bun (topic) + filling (details) + bottom bun (conclusion)" },
      { title: "Strong Topic Sentences", formula: "Topic + angle or reason = strong topic sentence", explanation: "A topic sentence states the topic AND gives an angle. Vague is weak; specific is strong.", tip: "Weak: 'Dogs are good.'   Strong: 'Dogs make excellent pets because they are loyal.'" },
      { title: "Transition Words", formula: "Addition: furthermore · also    Contrast: however · although    Sequence: first · then · finally", explanation: "Transitions connect sentences smoothly and signal how ideas relate.", tip: "'First, dogs are loyal. Furthermore, they are protective.'" },
    ],
    examples: [
      { problem: "What is a topic sentence?", steps: ["The first sentence of a paragraph.", "States the MAIN IDEA of the paragraph.", "Example: 'Dogs make excellent pets for many reasons.'"], answer: "States the main idea of the paragraph" },
      { problem: "What are supporting details?", steps: ["Facts, examples, or evidence that support the topic sentence.", "Example topic: 'Dogs make great pets.'", "Supporting detail: 'Dogs are loyal and protective.'"], answer: "Facts/examples that support the topic sentence" },
      { problem: "What is a concluding sentence?", steps: ["The last sentence of a paragraph.", "Wraps up the main idea or restates it differently.", "Example: 'For these reasons, dogs are truly wonderful companions.'"], answer: "Wraps up the main idea" },
      { problem: "What is the structure of a paragraph?", steps: ["1. Topic sentence (main idea)", "2. Supporting detail 1", "3. Supporting detail 2", "4. Supporting detail 3", "5. Concluding sentence"], answer: "Topic → Details → Conclusion" },
      { problem: "Write a topic sentence about your favourite food.", steps: ["Think about your favourite food.", "Say WHY it's your favourite — that's your main idea.", "Example: 'Pizza is my favourite food because of its delicious variety.'"], answer: "(Any clear topic sentence with a reason)" },
    ],
  };
}

function essayTutorial(): TutorialContent {
  return {
    skillName: "Essay Writing",
    intro: "An essay has three main parts: Introduction, Body (usually 3 paragraphs), and Conclusion.",
    concepts: [
      { title: "5-Paragraph Essay Structure", formula: "Introduction + Body (×3) + Conclusion", explanation: "The classic structure. Intro with thesis, three body paragraphs, conclusion.", tip: "Intro = set up    Body = prove it    Conclusion = wrap up" },
      { title: "The Thesis Statement", formula: "Your main argument + 3 supporting reasons in ONE sentence", explanation: "The thesis is the heart of your essay. It states your position AND previews your three main points.", tip: "'Schools should ban phones because they distract, enable cheating, and harm social skills.'" },
      { title: "Introduction Structure", formula: "Hook → Background/Context → Thesis", explanation: "Hook grabs attention. Context gives background. Thesis is your argument.", tip: "Hook types: surprising fact, question, quote, bold statement, short story" },
    ],
    examples: [
      { problem: "What is the structure of a 5-paragraph essay?", steps: ["Paragraph 1: Introduction (with thesis statement)", "Paragraph 2: Body — first main point", "Paragraph 3: Body — second main point", "Paragraph 4: Body — third main point", "Paragraph 5: Conclusion"], answer: "Intro + 3 body paragraphs + Conclusion" },
      { problem: "What is a thesis statement?", steps: ["The main argument of your essay.", "Found at the end of the introduction.", "Example: 'School uniforms should be required because they reduce bullying, build focus, and save money.'"], answer: "The main argument of the essay" },
      { problem: "What makes a good introduction?", steps: ["Hook: grabs the reader's attention", "Background: give context", "Thesis: state your main argument"], answer: "Hook + background + thesis" },
      { problem: "What makes a good conclusion?", steps: ["Restate the thesis (in different words)", "Summarise main points briefly", "Closing thought or call to action"], answer: "Restate thesis, summarise, closing thought" },
      { problem: "What is a 'hook' in essay writing?", steps: ["An opening line that grabs attention.", "Types: startling fact, question, quote, anecdote", "Example: 'Every 40 seconds, someone in the world dies from a preventable disease.'"], answer: "An attention-grabbing opening sentence" },
    ],
  };
}

function persuasiveTutorial(): TutorialContent {
  return {
    skillName: "Persuasive Writing",
    intro: "Persuasive writing tries to convince the reader to agree with your position. Use evidence, logic, and address the opposing view.",
    concepts: [
      { title: "Three Rhetorical Appeals", formula: "Ethos = credibility    Pathos = emotion    Logos = logic/evidence", explanation: "Ethos builds trust. Pathos appeals to feelings. Logos uses facts and reason.", tip: "Ethos: 'As a doctor...'   Pathos: 'Think of the children!'   Logos: '70% of studies show...'" },
      { title: "The Counterargument", formula: "State opposing view → acknowledge → refute with evidence", explanation: "Addressing the other side shows intellectual honesty and strengthens your argument.", tip: "'Some argue X. While this seems reasonable, evidence shows Y.'" },
      { title: "Evidence Quality", formula: "Strongest: statistics/research    Strong: expert opinion    Weaker: anecdote", explanation: "Numbers and research are hardest to argue with. Always cite your strongest evidence first.", tip: "'9 out of 10 dentists recommend...' = ethos + logos combo" },
    ],
    examples: [
      { problem: "What are the three persuasive appeals (Aristotle)?", steps: ["Ethos = appeal to credibility (trust me, I'm an expert)", "Pathos = appeal to emotion (think of the children!)", "Logos = appeal to logic (statistics, facts, evidence)"], answer: "Ethos (credibility), Pathos (emotion), Logos (logic)" },
      { problem: "What is a counterargument and why is it important?", steps: ["A counterargument presents the opposing view.", "Addressing it shows you understand both sides.", "Then refute it to strengthen YOUR argument."], answer: "The opposing view — address and refute it" },
      { problem: "What makes evidence 'credible'?", steps: ["Comes from reputable sources (scientists, experts)", "Backed by research or statistics", "Not outdated", "Not biased"], answer: "From reliable, expert sources" },
      { problem: "Write a thesis for: 'Should schools ban smartphones?'", steps: ["Pick a position: Yes or No", "Give 2-3 reasons", "Example: 'Schools should ban smartphones because they distract students, enable cheating, and harm social skills.'"], answer: "Schools should ban smartphones because [3 reasons]" },
      { problem: "What is the difference between a fact and an opinion?", steps: ["Fact: can be proven true or false", "'The Earth orbits the Sun.' (fact)", "Opinion: a personal view or belief", "'School is boring.' (opinion)"], answer: "Facts can be proven; opinions are personal views" },
    ],
  };
}

function narrativeTutorial(): TutorialContent {
  return {
    skillName: "Narrative Writing",
    intro: "Narrative writing tells a story. Use descriptive language, show characters' feelings through actions, and build tension.",
    concepts: [
      { title: "Show, Don't Tell", formula: "TELL: 'She was scared.'    SHOW: 'Her hands trembled, heart hammering.'", explanation: "Show emotions through physical actions and sensory details instead of stating feelings directly.", tip: "TELL: 'He was angry.'   SHOW: 'His jaw tightened. He slammed the book down.'" },
      { title: "Story Arc", formula: "Exposition → Rising Action → Climax → Falling Action → Resolution", explanation: "Every complete story follows this arc. The climax is the peak tension — the turning point.", tip: "No climax = no real story. Everything builds to it." },
      { title: "Point of View", formula: "1st person: I/we (inside story)    3rd person: he/she/they (outside)", explanation: "First person is intimate. Third person allows broader perspective.", tip: "'I ran.' (1st person)   'She ran.' (3rd person)" },
    ],
    examples: [
      { problem: "What is 'show, don't tell'?", steps: ["Don't just say 'She was scared.'", "Instead, SHOW the emotion through action and detail:", "'Her hands trembled, and she pressed herself against the cold wall, heart hammering.'"], answer: "Describe emotions through actions and sensory details" },
      { problem: "What is the narrative structure?", steps: ["Exposition: introduce characters, setting, situation", "Rising action: events that build tension", "Climax: the turning point or peak tension", "Falling action: events after the climax", "Resolution: how things end"], answer: "Exposition → Rising action → Climax → Falling action → Resolution" },
      { problem: "What is the difference between 1st and 3rd person point of view?", steps: ["1st person: narrator is IN the story — uses 'I'", "Example: 'I ran through the door.'", "3rd person: narrator is OUTSIDE the story — uses 'he/she/they'", "Example: 'She ran through the door.'"], answer: "1st person uses 'I'; 3rd person uses 'he/she/they'" },
      { problem: "How do you write a strong narrative hook?", steps: ["Start with action: 'The door burst open.'", "Start with dialogue: '\"Run!\" she screamed.'", "Start with mystery: 'The letter arrived on the day everything changed.'"], answer: "Action, dialogue, or mystery opening" },
      { problem: "What makes dialogue effective in a story?", steps: ["It reveals character personality.", "It advances the plot.", "Use speech marks: 'I'm not going,' she said firmly.", "Start a new paragraph for each new speaker."], answer: "Reveals character, advances plot, use proper punctuation" },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCIENCE TUTORIALS
// ─────────────────────────────────────────────────────────────────────────────

function getScienceTutorial(skill: string, skillName: string): TutorialContent {
  if (skill.includes("scientific method") || skill.includes("hypothesis") || skill.includes("variable") || skill.includes("experiment")) return scientificMethodTutorial();
  if (skill.includes("water cycle")) return waterCycleTutorial();
  if (skill.includes("states of matter") || skill.includes("matter")) return statesOfMatterTutorial();
  if (skill.includes("food chain") || skill.includes("ecosystem")) return foodChainTutorial();
  if (skill.includes("cell") || skill.includes("biology") || skill.includes("dna") || skill.includes("mitosis")) return biologyTutorial();
  if (skill.includes("photosynthesis") || skill.includes("life science")) return lifeScienceTutorial();
  if (skill.includes("earth science") || skill.includes("rock") || skill.includes("tectonic")) return earthScienceTutorial();
  if (skill.includes("force") || skill.includes("newton") || skill.includes("motion") || skill.includes("physics")) return physicsTutorial();
  if (skill.includes("chemistry") || skill.includes("atom") || skill.includes("element") || skill.includes("bond")) return chemistryTutorial();
  return lifeScienceTutorial();
}

function waterCycleTutorial(): TutorialContent {
  return {
    skillName: "The Water Cycle",
    intro: "The water cycle describes how water moves through Earth's systems: evaporation, condensation, and precipitation.",
    concepts: [
      { title: "The 4 Stages", formula: "Evaporation → Condensation → Precipitation → Collection", explanation: "Water evaporates from oceans, rises and condenses into clouds, falls as precipitation, and collects — then repeats.", tip: "Every Creature Pays for Carbon = Evaporation, Condensation, Precipitation, Collection" },
      { title: "Energy Sources", formula: "Sun powers evaporation    Gravity drives precipitation", explanation: "Solar energy heats water causing it to rise. Gravity pulls water droplets back down.", tip: "Sun heats → water rises.   Gravity → water falls." },
      { title: "Other Processes", formula: "Transpiration (plants) · Runoff (over land) · Infiltration (into ground)", explanation: "Plants release water through transpiration. Runoff flows to rivers. Infiltration soaks into the ground.", tip: "Transpiration + Evaporation = Evapotranspiration" },
    ],
    examples: [
      { problem: "What is evaporation?", steps: ["Water is heated by the Sun.", "Liquid water turns into water vapour (gas).", "It rises into the atmosphere."], answer: "Liquid water turning to water vapour due to heat" },
      { problem: "What is condensation?", steps: ["As water vapour rises, it cools.", "It turns back into tiny liquid droplets.", "These droplets form clouds."], answer: "Water vapour cooling and turning to liquid droplets (clouds)" },
      { problem: "What is precipitation?", steps: ["When water droplets in clouds become heavy enough,", "they fall back to Earth as rain, snow, sleet, or hail.", "This is called precipitation."], answer: "Water falling from clouds (rain, snow, etc.)" },
      { problem: "What is the order of the water cycle?", steps: ["1. Evaporation (water rises as vapour)", "2. Condensation (vapour forms clouds)", "3. Precipitation (water falls as rain/snow)", "4. Collection (in rivers, lakes, oceans)", "5. Then it starts again!"], answer: "Evaporation → Condensation → Precipitation → Collection" },
      { problem: "What energy source powers the water cycle?", steps: ["The SUN provides the heat energy for evaporation.", "Without the Sun, the water cycle would stop."], answer: "The Sun" },
    ],
  };
}

function statesOfMatterTutorial(): TutorialContent {
  return {
    skillName: "States of Matter",
    intro: "Matter exists in three main states: solid, liquid, and gas. They differ in how their particles are arranged and move.",
    concepts: [
      { title: "Three States of Matter", formula: "Solid = fixed shape+volume    Liquid = fixed volume, flows    Gas = no fixed shape or volume", explanation: "Particles in solids are tightly packed. Liquids flow and take container shape. Gas particles move freely.", tip: "ICE (solid) → WATER (liquid) → STEAM (gas)" },
      { title: "State Changes", formula: "Melting: solid→liquid    Boiling: liquid→gas    Condensation: gas→liquid    Freezing: liquid→solid", explanation: "Adding heat makes particles move faster and spread apart, changing state.", tip: "Water freezes at 0°C and boils at 100°C" },
      { title: "Sublimation", formula: "Solid → gas directly (no liquid stage)", explanation: "Some substances go straight from solid to gas. Example: dry ice (solid CO₂).", tip: "More heat = faster particles = more spacing = higher energy state" },
    ],
    examples: [
      { problem: "What are the three states of matter?", steps: ["Solid: fixed shape, fixed volume (e.g., ice)", "Liquid: no fixed shape, fixed volume (e.g., water)", "Gas: no fixed shape, no fixed volume (e.g., steam)"], answer: "Solid, liquid, gas" },
      { problem: "What happens when a solid is heated?", steps: ["The particles gain energy and move faster.", "The solid melts and becomes a liquid.", "Example: ice → water when heated."], answer: "It melts and becomes a liquid" },
      { problem: "What is the difference between evaporation and boiling?", steps: ["Evaporation happens at the surface, at any temperature.", "Boiling happens throughout the liquid, at boiling point (100°C for water).", "Both change liquid to gas."], answer: "Evaporation is surface/slow; boiling is throughout/fast at 100°C" },
      { problem: "What is sublimation?", steps: ["Sublimation is when a solid changes DIRECTLY to a gas.", "No liquid stage in between.", "Example: dry ice (solid CO₂) disappears at room temperature."], answer: "Solid changing directly to gas (e.g., dry ice)" },
      { problem: "True or False: Gas has a definite volume.", steps: ["Gas particles are far apart and move freely.", "Gas fills whatever container it's in.", "Gas has NO definite shape and NO definite volume.", "Answer: FALSE."], answer: "False — gas expands to fill any container" },
    ],
  };
}

function foodChainTutorial(): TutorialContent {
  return {
    skillName: "Food Chains and Ecosystems",
    intro: "A food chain shows how energy flows from one organism to the next. Energy starts with the Sun and flows through producers, then consumers.",
    concepts: [
      { title: "Food Chain Roles", formula: "Producer → Primary Consumer → Secondary Consumer → Tertiary Consumer", explanation: "Producers make their own food (plants). Consumers eat to get energy. Each level is a trophic level.", tip: "Grass → Rabbit → Fox → Eagle (arrows mean 'is eaten by')" },
      { title: "10% Energy Rule", formula: "Only ~10% of energy passes to the next trophic level", explanation: "At each step, ~90% of energy is lost as heat, movement, and waste. This limits food chain length.", tip: "1000J grass → 100J rabbit → 10J fox → 1J eagle" },
      { title: "Decomposers", formula: "Dead matter → decomposers → nutrients → back to soil → producers", explanation: "Decomposers (fungi, bacteria) are essential recyclers. They return nutrients to the soil.", tip: "Without decomposers, dead matter would pile up and nutrients would be locked away forever!" },
    ],
    examples: [
      { problem: "What is a producer?", steps: ["Producers make their own food using sunlight.", "They are usually plants.", "Example: grass, trees, algae"], answer: "Organisms that make their own food (plants)" },
      { problem: "What is a consumer?", steps: ["Consumers eat other organisms to get energy.", "Primary consumer: eats plants (herbivore)", "Secondary consumer: eats plant-eaters (carnivore)", "Tertiary consumer: eats secondary consumers"], answer: "Organisms that eat other organisms" },
      { problem: "In the chain: grass → rabbit → fox → eagle, what is the rabbit?", steps: ["Grass is the producer.", "Rabbit eats grass → primary consumer / herbivore", "Fox eats rabbit → secondary consumer", "Eagle eats fox → tertiary consumer"], answer: "Primary consumer (herbivore)" },
      { problem: "What is a decomposer and why are they important?", steps: ["Decomposers break down dead organisms.", "Examples: bacteria, fungi, worms", "They return nutrients to the soil.", "Without them, dead matter would pile up everywhere."], answer: "Break down dead matter and return nutrients to the soil" },
      { problem: "What happens if the rabbit population disappears from: grass → rabbit → fox?", steps: ["Rabbits are gone → foxes have no food.", "Fox population decreases.", "With fewer foxes, grass may grow unchecked.", "Removing one organism affects the WHOLE ecosystem."], answer: "Foxes decrease; grass overgrows — ecosystem is disrupted" },
    ],
  };
}

function biologyTutorial(): TutorialContent {
  return {
    skillName: "Cell Biology",
    intro: "All living things are made of cells. Cells contain structures (organelles) that perform specific functions.",
    concepts: [
      { title: "Key Organelles", formula: "Nucleus = control    Mitochondria = energy    Ribosome = proteins    Cell membrane = boundary", explanation: "Each organelle has a specific job. Nucleus controls everything and holds DNA. Mitochondria produce ATP (energy).", tip: "Mitochondria = powerhouse    Nucleus = brain of the cell" },
      { title: "Plant vs Animal Cells", formula: "Plant cells ONLY: cell wall · chloroplasts · large central vacuole", explanation: "Both share nucleus, mitochondria, and cell membrane. Only plant cells have the three extra structures.", tip: "Plant cells photosynthesise. Animal cells cannot." },
      { title: "DNA and Genetics", formula: "DNA → genes → chromosomes    Humans: 46 chromosomes (23 pairs)", explanation: "DNA carries genetic information. Genes are sections of DNA for specific traits.", tip: "Uncoiled, human DNA would stretch about 2 metres!" },
    ],
    examples: [
      { problem: "What is the function of the nucleus?", steps: ["The nucleus is the 'control centre' of the cell.", "It contains DNA (genetic information).", "It controls cell activities and reproduction."], answer: "Controls cell activities; contains DNA" },
      { problem: "What is the mitochondria and what does it do?", steps: ["The mitochondria is the 'powerhouse of the cell'.", "It converts glucose and oxygen into energy (ATP).", "More active cells have more mitochondria."], answer: "Produces energy (ATP) for the cell" },
      { problem: "What is the difference between plant and animal cells?", steps: ["Plant cells have: cell wall, chloroplasts, large vacuole", "Animal cells do NOT have these.", "Both have: nucleus, mitochondria, cell membrane, cytoplasm"], answer: "Plants have cell wall + chloroplasts; animals do not" },
      { problem: "What is mitosis?", steps: ["Mitosis is cell division for growth and repair.", "One cell divides into TWO identical daughter cells.", "Result: same DNA, same number of chromosomes (46 in humans)"], answer: "Cell division producing 2 identical cells" },
      { problem: "What is DNA and why is it important?", steps: ["DNA = deoxyribonucleic acid", "It is the genetic code of all living things.", "DNA is organised into chromosomes inside the nucleus.", "It determines all traits: eye colour, height, etc."], answer: "Genetic material that codes for all traits" },
    ],
  };
}

function lifeScienceTutorial(): TutorialContent {
  return {
    skillName: "Life Science",
    intro: "Life science studies living things — plants, animals, cells, and ecosystems.",
    concepts: [
      { title: "Photosynthesis", formula: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂", explanation: "Plants use sunlight, water, and carbon dioxide to make glucose and release oxygen. Happens in chloroplasts.", tip: "Inputs: CO₂ + water + sunlight    Outputs: glucose + oxygen" },
      { title: "Characteristics of Life", formula: "MRS GREN: Movement · Respiration · Sensitivity · Growth · Reproduction · Excretion · Nutrition", explanation: "All living things share these seven characteristics.", tip: "MRS GREN is your checklist for life!" },
      { title: "Natural Selection", formula: "Variation → Selection → Inheritance → Evolution", explanation: "Organisms with beneficial traits survive and reproduce more. Those traits pass to offspring. Species gradually adapts.", tip: "Survival of the FITTEST = survival of the best ADAPTED" },
    ],
    examples: [
      { problem: "What do plants need for photosynthesis?", steps: ["Sunlight (energy)", "Water (from soil through roots)", "Carbon dioxide (from air through stomata)", "Equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂"], answer: "Sunlight, water, carbon dioxide" },
      { problem: "What gas do plants release during photosynthesis?", steps: ["During photosynthesis, glucose and OXYGEN are produced.", "Oxygen is released into the air.", "This is why forests are called the 'lungs of the Earth'."], answer: "Oxygen" },
      { problem: "What is the function of chlorophyll?", steps: ["Chlorophyll is the green pigment in plant cells.", "Found in chloroplasts.", "It absorbs sunlight to power photosynthesis.", "This is why plants are green!"], answer: "Absorbs sunlight for photosynthesis; makes plants green" },
      { problem: "What is the difference between a herbivore, carnivore, and omnivore?", steps: ["Herbivore: eats only plants (rabbit, cow)", "Carnivore: eats only animals (lion, wolf)", "Omnivore: eats both plants and animals (humans, bears)"], answer: "Herbivore=plants, Carnivore=animals, Omnivore=both" },
      { problem: "What is natural selection?", steps: ["Natural selection is how species adapt over time.", "Organisms with traits that help them survive → reproduce more.", "Those traits are passed to offspring.", "Over many generations, the species changes."], answer: "Survival of the best-adapted organisms" },
    ],
  };
}

function earthScienceTutorial(): TutorialContent {
  return {
    skillName: "Earth Science",
    intro: "Earth science studies our planet — its structure, rocks, weather, and movements.",
    concepts: [
      { title: "Rock Cycle", formula: "Igneous (cooled magma) → Sedimentary (layers+pressure) → Metamorphic (heat+pressure) → back to Igneous", explanation: "Rocks constantly transform over millions of years. No rock type is permanent.", tip: "Igneous=cooled magma    Sedimentary=layered    Metamorphic=changed by heat/pressure" },
      { title: "Plate Tectonics", formula: "Converging → mountains    Diverging → new ocean floor    Transform → earthquakes", explanation: "Earth's crust is ~20 moving plates. Their interactions cause earthquakes, volcanoes, and mountain ranges.", tip: "Plates move a few cm per year — same speed as your fingernails grow!" },
      { title: "Weather vs Climate", formula: "Weather = short-term daily conditions    Climate = 30+ year patterns", explanation: "Weather is what you experience today. Climate is the long-term average for a region.", tip: "Climate is what you expect. Weather is what you get." },
    ],
    examples: [
      { problem: "What are the three types of rock?", steps: ["Igneous: formed from cooled lava (e.g., granite, basalt)", "Sedimentary: formed from compressed layers of sediment (e.g., sandstone, limestone)", "Metamorphic: formed under extreme heat and pressure (e.g., marble, slate)"], answer: "Igneous, sedimentary, metamorphic" },
      { problem: "What causes day and night?", steps: ["Earth rotates on its axis once every 24 hours.", "The side facing the Sun = day.", "The side facing away = night."], answer: "Earth rotating on its axis" },
      { problem: "What causes the seasons?", steps: ["Earth's axis is tilted at 23.5°.", "As Earth orbits the Sun, different hemispheres tilt towards the Sun.", "Tilted towards Sun = summer (more direct sunlight).", "Tilted away = winter."], answer: "Earth's tilted axis as it orbits the Sun" },
      { problem: "What is plate tectonics?", steps: ["Earth's outer shell (crust) is divided into large pieces called tectonic plates.", "These plates move slowly (a few cm per year).", "Where plates meet: earthquakes, volcanoes, mountains form."], answer: "Earth's crust is made of moving plates" },
      { problem: "What is the difference between weather and climate?", steps: ["Weather: short-term atmospheric conditions (today's rain)", "Climate: long-term patterns of weather over 30+ years", "Example: 'It's raining' = weather; 'Canada is cold in winter' = climate"], answer: "Weather is short-term; climate is long-term" },
    ],
  };
}

function physicsTutorial(): TutorialContent {
  return {
    skillName: "Physics — Forces and Motion",
    intro: "Forces cause objects to move, stop, or change direction. Newton's three laws explain how forces and motion are related.",
    concepts: [
      { title: "Newton's Three Laws", formula: "1st: inertia    2nd: F=ma    3rd: action=reaction", explanation: "Law 1: objects keep their motion unless a force acts. Law 2: force = mass × acceleration. Law 3: every action has equal and opposite reaction.", tip: "Seatbelt (1st)    Push heavier box = more force (2nd)    Rocket exhaust (3rd)" },
      { title: "Balanced vs Unbalanced Forces", formula: "Net force = 0 → no acceleration    Net force ≠ 0 → acceleration", explanation: "When all forces cancel out, there is no change in motion. Unbalanced forces cause acceleration.", tip: "Book on table: gravity (down) balanced by normal force (up) → no movement" },
      { title: "Energy Types", formula: "Kinetic: KE=½mv²    Potential: PE=mgh    Conservation: total energy stays constant", explanation: "Energy cannot be created or destroyed, only converted. KE and PE constantly trade off.", tip: "Ball at top: max PE, zero KE    At bottom: max KE, zero PE" },
    ],
    examples: [
      { problem: "What is Newton's First Law?", steps: ["An object at rest stays at rest.", "An object in motion stays in motion.", "...UNLESS acted upon by an unbalanced force.", "Example: a ball keeps rolling until friction stops it."], answer: "Objects keep their state of motion unless a force acts on them" },
      { problem: "What is Newton's Second Law (F = ma)?", steps: ["Force = mass × acceleration", "A bigger force → greater acceleration", "A heavier object needs more force to accelerate the same amount.", "Example: pushing a car vs pushing a bicycle"], answer: "F = ma (force = mass × acceleration)" },
      { problem: "What is Newton's Third Law?", steps: ["For every action, there is an equal and opposite reaction.", "Example: rocket pushes gas downward → gas pushes rocket upward.", "Example: you push down on the floor → floor pushes you up."], answer: "Every action has an equal and opposite reaction" },
      { problem: "What is the difference between mass and weight?", steps: ["Mass: amount of matter in an object (kg) — never changes", "Weight: force of gravity on an object (N) — changes with gravity", "On the Moon, your mass is the same but your weight is less."], answer: "Mass is amount of matter; weight is gravitational force" },
      { problem: "What is kinetic vs potential energy?", steps: ["Kinetic energy: energy of MOTION (moving object)", "Potential energy: stored energy due to POSITION", "Example: ball at top of hill = potential; rolling down = kinetic"], answer: "Kinetic = motion energy; Potential = stored energy" },
    ],
  };
}

function chemistryTutorial(): TutorialContent {
  return {
    skillName: "Chemistry",
    intro: "Chemistry studies matter and how it changes. Atoms are the building blocks of all matter.",
    concepts: [
      { title: "Atomic Structure", formula: "Atom = protons (+) + neutrons (0) in nucleus + electrons (-) in shells", explanation: "All matter is made of atoms. Atomic number = number of protons = number of electrons (neutral atom).", tip: "Mass number = protons + neutrons    Atomic number = protons" },
      { title: "Chemical Bonds", formula: "Ionic = transfer electrons (metal+non-metal)    Covalent = share electrons (non-metal+non-metal)", explanation: "Ionic bonds form when atoms transfer electrons. Covalent bonds form when atoms share electrons.", tip: "NaCl (salt) = ionic    H₂O (water) = covalent" },
      { title: "Acids, Bases, pH Scale", formula: "pH 0–6: acid    pH 7: neutral    pH 8–14: base", explanation: "The pH scale measures acidity. Below 7 = acid. Above 7 = base. 7 = neutral.", tip: "Lemon ≈ pH2 (acid)    Water = pH7 (neutral)    Bleach ≈ pH13 (base)" },
    ],
    examples: [
      { problem: "What are the three subatomic particles?", steps: ["Protons: positive charge, in nucleus", "Neutrons: no charge, in nucleus", "Electrons: negative charge, orbit around nucleus"], answer: "Protons (+), neutrons (neutral), electrons (-)" },
      { problem: "What is the difference between an ionic and covalent bond?", steps: ["Ionic bond: electrons are TRANSFERRED from one atom to another", "Example: NaCl (table salt) — Na gives electron to Cl", "Covalent bond: electrons are SHARED between atoms", "Example: H₂O — oxygen and hydrogen share electrons"], answer: "Ionic = transfer electrons; Covalent = share electrons" },
      { problem: "What does pH measure?", steps: ["pH measures how acidic or alkaline (basic) a solution is.", "Scale: 0–14", "0–6: acidic (lemon juice = 2)", "7: neutral (pure water)", "8–14: alkaline/basic (bleach = 13)"], answer: "0–6 acidic, 7 neutral, 8–14 alkaline" },
      { problem: "What is the difference between an exothermic and endothermic reaction?", steps: ["Exothermic: releases ENERGY (usually as heat)", "Example: burning wood, explosions", "Endothermic: absorbs ENERGY", "Example: photosynthesis, melting ice"], answer: "Exothermic = releases heat; Endothermic = absorbs heat" },
      { problem: "What is a catalyst?", steps: ["A catalyst speeds up a chemical reaction.", "It is NOT consumed in the reaction.", "Example: enzymes in your body speed up digestion.", "Catalysts lower the energy needed to start a reaction."], answer: "Speeds up reactions without being consumed" },
    ],
  };
}

// =============================================================================
// TIER 1 — Missing tutorials for R1, R2, R3, Writing W1, Science Method
// =============================================================================

export function letterRecognitionTutorial(): TutorialContent {
  return {
    skillName: "Letter Recognition",
    intro: "Learning to recognise letters is the first step to reading. Every word is made of letters — upper case and lower case.",
    concepts: [
      { title: "Upper Case & Lower Case", formula: "Every letter has TWO forms: A/a  B/b  C/c  D/d", explanation: "Upper case letters (capitals) are used at the start of sentences and for names. Lower case letters are used everywhere else.", tip: "Upper case: A B C D E F G  — Lower case: a b c d e f g" },
      { title: "Vowels vs Consonants", formula: "Vowels: A E I O U  —  All other letters are consonants", explanation: "Every word needs at least one vowel. Vowels make the open sounds. Consonants make the closed sounds.", tip: "Remember vowels with: A E I O U — and sometimes Y!" },
      { title: "Letter Sounds", formula: "Each letter makes a sound: A = 'ah'  B = 'buh'  C = 'kuh'", explanation: "Knowing letter sounds helps you read new words by sounding them out letter by letter.", tip: "Point to each letter and say its sound out loud — practice makes it automatic!" },
    ],
    examples: [
      { problem: "Which letters are vowels?", steps: ["Vowels are: A, E, I, O, U", "Every other letter is a consonant.", "Vowels make the open sounds in words."], answer: "A E I O U" },
      { problem: "Write the lower case of: A B C D E", steps: ["A → a", "B → b", "C → c", "D → d", "E → e"], answer: "a b c d e" },
      { problem: "How many vowels are in the word 'apple'?", steps: ["a-p-p-l-e", "Vowels are: a, e", "Count them: 2"], answer: "2 vowels (a and e)" },
      { problem: "Which letter comes after M in the alphabet?", steps: ["...K L M N O...", "M is followed by N."], answer: "N" },
      { problem: "Is the letter T a vowel or consonant?", steps: ["Vowels: A E I O U", "T is not in that list.", "T is a consonant."], answer: "Consonant" },
    ],
  };
}

export function phonicsTutorial(): TutorialContent {
  return {
    skillName: "Long Vowels & Phonics",
    intro: "Phonics is understanding how letters and sounds connect. Long vowels say their name — like the A in cake or the E in tree.",
    concepts: [
      { title: "Short vs Long Vowels", formula: "Short A: cat, hat  |  Long A: cake, rain, day", explanation: "Short vowels make a quick clipped sound. Long vowels say the letter name. The silent e rule makes vowels long.", tip: "Silent E rule: kit → kite, hop → hope" },
      { title: "Vowel Teams", formula: "ai = rain  |  ee = tree  |  oa = boat  |  ue = blue", explanation: "When two vowels appear together, usually the first one says its name and the second is silent.", tip: "When two vowels go walking, the first one does the talking!" },
      { title: "Consonant Blends", formula: "bl = black  |  st = stop  |  tr = tree  |  sh = ship", explanation: "Consonant blends are two or three consonants together. Digraphs (sh, ch, th) make one new sound.", tip: "sh = one sound  |  st = two sounds" },
    ],
    examples: [
      { problem: "Is the A in cake long or short?", steps: ["cake ends in silent E", "Silent E makes the A long", "The A says its name: ayy"], answer: "Long A" },
      { problem: "Is the I in sit long or short?", steps: ["sit has no silent E", "The I makes a short sound: ih", "Short I"], answer: "Short I" },
      { problem: "What sound do the letters sh make?", steps: ["sh is a digraph — two letters, one sound", "sh = shhhh (like shhh, be quiet)", "Examples: ship, shop, fish"], answer: "One sound: sh as in ship" },
      { problem: "Apply the silent E rule: hop → ___e", steps: ["hop has a short O", "Add silent E: h-o-p-e", "The O becomes long: hope"], answer: "hope (long O sound)" },
      { problem: "What vowel team is in rain?", steps: ["r-a-i-n", "a and i are together = vowel team ai", "ai makes the long A sound"], answer: "ai — makes long A sound" },
    ],
  };
}

export function sightWordsTutorial(): TutorialContent {
  return {
    skillName: "Sight Words",
    intro: "Sight words are very common words you should know instantly — without sounding them out. They appear in almost every sentence you will ever read.",
    concepts: [
      { title: "What Are Sight Words?", formula: "the · and · is · it · in · of · to · a · he · she · was · for", explanation: "Sight words are the most frequently used words in English. Learning them by heart makes reading faster and smoother.", tip: "The word the alone makes up about 7% of all words written in English!" },
      { title: "Dolch Word List — Level 1", formula: "I · a · and · the · to · is · in · it · of · can · see · we", explanation: "The Dolch list is the classic set of sight words every reader should master.", tip: "Make flashcards and practice 5 new words a day!" },
      { title: "Reading Sight Words in Context", formula: "Use the SENTENCE to help confirm the sight word", explanation: "Even if you know a word by sight, reading the whole sentence helps you understand meaning.", tip: "Don't guess — if unsure, look at the word carefully then use the sentence for meaning." },
    ],
    examples: [
      { problem: "Which of these is a sight word: elephant or the?", steps: ["Sight words are very common short words.", "the appears in nearly every sentence.", "elephant is a longer, less common word."], answer: "the" },
      { problem: "Fill in the blank: ___ cat sat on the mat.", steps: ["The sentence needs a word before cat.", "Common sight words that fit: The or A", "Most natural: The cat sat on the mat."], answer: "The" },
      { problem: "How many sight words are in: He is in the car?", steps: ["He = sight word", "is = sight word", "in = sight word", "the = sight word", "car = not a sight word"], answer: "4 sight words" },
      { problem: "Read and identify the sight words: She can see the big dog", steps: ["She, can, see, the are sight words", "big and dog are not Dolch sight words"], answer: "She, can, see, the" },
      { problem: "Why are sight words important?", steps: ["They are the most common words in English.", "Recognising them instantly makes reading faster.", "You spend less effort on individual words and more on meaning."], answer: "They appear constantly — instant recognition speeds up reading" },
    ],
  };
}

export function scientificMethodTutorial(): TutorialContent {
  return {
    skillName: "The Scientific Method",
    intro: "The scientific method is how scientists investigate questions about the world. Every science experiment follows these steps.",
    concepts: [
      { title: "The 6 Steps", formula: "Question → Hypothesis → Method → Results → Conclusion → Communicate", explanation: "Scientists always start with a question. They make a prediction, design an experiment, record results, draw a conclusion, and share findings.", tip: "Remember: Queen Hyenas Must Run Crazy Circles = Question, Hypothesis, Method, Results, Conclusion, Communicate" },
      { title: "Variables", formula: "Independent = what you CHANGE\nDependent = what you MEASURE\nControlled = what you KEEP THE SAME", explanation: "A fair test only changes ONE variable at a time.", tip: "Only change ONE thing — otherwise you don't know what caused the result!" },
      { title: "Hypothesis vs Conclusion", formula: "Hypothesis = prediction BEFORE\nConclusion = what results TELL YOU after", explanation: "A hypothesis uses If... then... format. A conclusion states whether results supported or disproved the hypothesis.", tip: "A wrong hypothesis is NOT a failure — it is a discovery!" },
    ],
    examples: [
      { problem: "What is a hypothesis?", steps: ["A hypothesis is a testable prediction made BEFORE the experiment.", "It uses If... then... format.", "Example: If I water plants daily, then they will grow taller."], answer: "A testable prediction before the experiment (If...then...)" },
      { problem: "In an experiment testing whether sunlight affects plant growth: what is the independent variable?", steps: ["The independent variable is what you CHANGE.", "You are changing the amount of sunlight.", "Independent variable = amount of sunlight"], answer: "Amount of sunlight" },
      { problem: "What is the dependent variable in that experiment?", steps: ["The dependent variable is what you MEASURE.", "You measure plant growth.", "Dependent variable = plant growth (height)"], answer: "Plant growth (height)" },
      { problem: "What makes a test fair?", steps: ["Only ONE variable is changed.", "Everything else stays the same.", "This ensures the result is caused by the one change."], answer: "Only one variable changes — everything else stays the same" },
      { problem: "A student concludes: My hypothesis was wrong. Is this a problem?", steps: ["No — a wrong hypothesis is a valid scientific finding.", "It tells us what does NOT work.", "Science advances by disproving ideas as much as proving them."], answer: "No — disproving a hypothesis is a valid scientific result" },
    ],
  };
}

// =============================================================================
// TIER 2 — Compare & Contrast, Point of View, Text Structure, Spelling, Editing
// =============================================================================

export function compareContrastTutorial(): TutorialContent {
  return {
    skillName: "Compare & Contrast",
    intro: "Comparing means finding similarities. Contrasting means finding differences. Good readers do both at the same time.",
    concepts: [
      { title: "Signal Words for Compare", formula: "both · similarly · alike · also · in the same way · just like", explanation: "These words signal that two things are being shown as similar.", tip: "Both dogs and cats are popular pets — both signals comparison." },
      { title: "Signal Words for Contrast", formula: "however · but · on the other hand · unlike · while · whereas", explanation: "These words signal that two things are being shown as different.", tip: "Dogs bark, however cats meow — however signals contrast." },
      { title: "Venn Diagram Thinking", formula: "Left = unique to A  |  Middle = both  |  Right = unique to B", explanation: "A Venn diagram organises similarities and differences visually.", tip: "Ask: What do they SHARE? What is DIFFERENT about each?" },
    ],
    examples: [
      { problem: "What does compare mean?", steps: ["To compare = to find SIMILARITIES.", "You look at what two things have IN COMMON.", "Example: Compare a dog and a cat — both are mammals, both are kept as pets."], answer: "Finding similarities between two or more things" },
      { problem: "What does contrast mean?", steps: ["To contrast = to find DIFFERENCES.", "You look at how two things are DIFFERENT.", "Example: Dogs bark, cats meow; dogs are pack animals, cats are solitary."], answer: "Finding differences between two or more things" },
      { problem: "Identify: Both summer and winter are seasons, but summer is warm while winter is cold.", steps: ["Signal words: Both (compare) and but...while (contrast)", "Similarity: both are seasons", "Difference: temperature"], answer: "Compare: both are seasons | Contrast: temperature differs" },
      { problem: "What signal word shows contrast: Dogs are loyal. ___, cats are independent.", steps: ["We need a contrast signal word.", "Options: However, But, On the other hand", "Best fit: However, cats are independent."], answer: "However" },
      { problem: "Frogs live in water AND on land. Fish only live in water. Organise this.", steps: ["Frogs only: can live on land, breathe air", "Both: live in or near water, are cold-blooded", "Fish only: always in water, breathe through gills"], answer: "Both: live near water | Frogs: also on land | Fish: only in water" },
    ],
  };
}

export function pointOfViewTutorial(): TutorialContent {
  return {
    skillName: "Point of View",
    intro: "Point of view is the perspective from which a story is told. Who is narrating? How does that affect what we know?",
    concepts: [
      { title: "First Person Point of View", formula: "Narrator uses: I · me · my · we · our", explanation: "The narrator IS a character in the story. You only know what they see, think, and feel.", tip: "I walked into the room — I tells you it is first person." },
      { title: "Third Person Limited", formula: "Narrator uses: he · she · they — follows ONE character's thoughts", explanation: "The narrator is outside the story but only reveals the thoughts of one character.", tip: "She wondered what he was thinking — narrator knows HER thoughts but not his." },
      { title: "Third Person Omniscient", formula: "Narrator knows ALL characters' thoughts and feelings", explanation: "The all-knowing narrator can reveal any character's inner thoughts.", tip: "He was nervous. She, however, felt confident. — omniscient narrator knows BOTH." },
    ],
    examples: [
      { problem: "What is first person point of view?", steps: ["The narrator IS a character using I, me, my.", "Only that character's thoughts are revealed.", "Example: I ran as fast as I could, my heart pounding."], answer: "Narrator is a character — uses I/me/my" },
      { problem: "Identify: She walked into the dark room, wondering what was inside.", steps: ["Pronoun: She — not first person.", "Only she is wondering — limited to her perspective.", "This is THIRD PERSON LIMITED."], answer: "Third person limited" },
      { problem: "Identify: John felt afraid. Maria, across the room, sensed his fear.", steps: ["Uses he/she — third person.", "Both characters' feelings are revealed.", "This is THIRD PERSON OMNISCIENT."], answer: "Third person omniscient" },
      { problem: "What is a limitation of first person narration?", steps: ["The narrator can only tell you what THEY experience.", "They cannot know other characters' true thoughts.", "They may be biased or unreliable."], answer: "Limited to narrator's knowledge — may be biased" },
      { problem: "Why does point of view matter in a story?", steps: ["It controls what information the reader receives.", "First person = personal but limited.", "Third person omniscient = complete picture.", "The author chooses POV deliberately for effect."], answer: "It controls what readers know and feel" },
    ],
  };
}

export function textStructureTutorial(): TutorialContent {
  return {
    skillName: "Text Structure",
    intro: "Text structure is how an author organises information. Recognising the structure helps you understand and remember what you read.",
    concepts: [
      { title: "5 Common Text Structures", formula: "Description · Sequence · Compare/Contrast · Cause/Effect · Problem/Solution", explanation: "Each structure organises information differently. Good readers identify the structure to predict and comprehend better.", tip: "The signal words in a text tell you which structure is being used." },
      { title: "Structure Signal Words", formula: "Sequence: first/then/next/finally\nCause/Effect: because/so/therefore\nProblem/Solution: problem/solution/as a result", explanation: "Every text structure has its own set of signal words.", tip: "When you see first... then... finally, think SEQUENCE." },
    ],
    examples: [
      { problem: "Identify: First, water evaporates. Then it forms clouds. Finally, it rains.", steps: ["Signal words: first, then, finally", "Events in ORDER", "This is a SEQUENCE structure."], answer: "Sequence" },
      { problem: "Identify: Pollution in rivers harms fish. Because of this, many species are endangered.", steps: ["Signal words: Because of this", "One thing leads to another.", "This is CAUSE AND EFFECT structure."], answer: "Cause and Effect" },
      { problem: "Identify: Dogs are loyal. Cats, on the other hand, are independent.", steps: ["Signal words: on the other hand", "Showing differences between two subjects.", "This is COMPARE AND CONTRAST structure."], answer: "Compare and Contrast" },
      { problem: "Identify: Many students fail exams because of poor sleep. Schools should start later to solve this.", steps: ["A problem is identified: poor sleep.", "A solution is offered: later start times.", "This is PROBLEM AND SOLUTION structure."], answer: "Problem and Solution" },
      { problem: "Identify: The cheetah is the fastest land animal. It can reach 70 mph and has a flexible spine.", steps: ["No sequence, no cause/effect, no comparison.", "The text describes one subject's features.", "This is DESCRIPTION structure."], answer: "Description" },
    ],
  };
}

export function spellingTutorial(): TutorialContent {
  return {
    skillName: "Spelling",
    intro: "Good spelling makes your writing clear and credible. Many spelling patterns follow consistent rules.",
    concepts: [
      { title: "i before e, except after c", formula: "i before e: believe, field, piece\nexcept after c: receive, ceiling, deceive", explanation: "When i and e appear together, the i usually comes first — UNLESS the letters come after c.", tip: "Exceptions: weird, seize, neither — memorise these separately!" },
      { title: "Dropping the Silent E", formula: "Before vowel suffix: drop the e → hope + ing = hoping\nBefore consonant suffix: keep the e → hope + ful = hopeful", explanation: "When adding a suffix that starts with a vowel, drop the silent e. Keep it before consonant suffixes.", tip: "love + ing = loving  |  love + ly = lovely" },
      { title: "Doubling the Final Consonant", formula: "1 syllable + 1 vowel + 1 consonant → double before vowel suffix\nrun → running | stop → stopped", explanation: "Short vowel sounds need the consonant doubled to keep them short.", tip: "run + ing: only 1 vowel before final consonant → double it → running" },
    ],
    examples: [
      { problem: "Spell: believe + able =", steps: ["believe ends in silent e.", "Suffix -able starts with a vowel.", "Drop the e: believ + able = believable."], answer: "believable" },
      { problem: "Spell: run + ing =", steps: ["run = 1 syllable, 1 vowel (u), ends in consonant (n).", "Suffix starts with vowel (-ing).", "Double the n: running."], answer: "running" },
      { problem: "Which is correct: recieve or receive?", steps: ["The letters i and e follow c.", "Rule: except after c → e before i.", "Correct: receive."], answer: "receive" },
      { problem: "Spell: hope + ful =", steps: ["hope ends in silent e.", "-ful starts with a CONSONANT.", "Keep the e: hopeful."], answer: "hopeful" },
      { problem: "Spell: big + est =", steps: ["big = 1 syllable, 1 vowel (i), ends in consonant (g).", "Suffix starts with vowel (-est).", "Double the g: biggest."], answer: "biggest" },
    ],
  };
}

export function editingProofreadingTutorial(): TutorialContent {
  return {
    skillName: "Editing & Proofreading",
    intro: "Editing improves content — structure, clarity, vocabulary. Proofreading catches errors — spelling, punctuation, grammar. Every good writer does both.",
    concepts: [
      { title: "CUPS Proofreading Checklist", formula: "C = Capitalisation  U = Usage  P = Punctuation  S = Spelling", explanation: "CUPS is a systematic checklist. Check each category separately to avoid missing errors.", tip: "Read your work BACKWARDS to catch spelling errors — it forces you to look at each word individually." },
      { title: "Common Grammar Errors", formula: "Subject-verb agreement: The dogs runs → The dogs run\nTense consistency: She walked in and sits → She walked in and sat", explanation: "The verb must agree with its subject in number. Tense must stay consistent throughout a passage.", tip: "Cross out everything between subject and verb to check agreement." },
    ],
    examples: [
      { problem: "Find the error: The children plays in the park every day.", steps: ["Subject: The children (plural)", "Verb: plays (singular form)", "Should be: The children play in the park."], answer: "plays → play (subject-verb agreement)" },
      { problem: "Find the error: She walked to school and eats her lunch.", steps: ["walked = past tense", "eats = present tense", "Correction: She walked to school and ate her lunch."], answer: "eats → ate (tense consistency)" },
      { problem: "Find the error: my favourite colour is blue", steps: ["Capitalisation check: my should be My", "Punctuation: needs a full stop at the end.", "Correction: My favourite colour is blue."], answer: "Capitalise My, add full stop" },
      { problem: "Which is more specific? A: It was a nice day. B: The sky was clear and the temperature reached 24 degrees.", steps: ["A is vague: nice could mean anything.", "B is specific: gives observable, precise details.", "B is stronger writing."], answer: "B — specific details make stronger writing" },
      { problem: "Fix: The team of players are ready for the game.", steps: ["Subject: The team — team is SINGULAR.", "are is plural — incorrect.", "Correction: The team of players is ready for the game."], answer: "are → is (team is singular)" },
    ],
  };
}
