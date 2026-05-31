// src/lib/worksheet/tutorials.ts
// Generates 5 worked examples with step-by-step solutions for every skill
// Shown once per skill before the child starts practice

export interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

export interface TutorialContent {
  skillName: string;
  intro: string;
  examples: WorkedExample[];
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
  if (skill.includes("addition within 5")) return additionTutorial(5);
  if (skill.includes("addition within 10")) return additionTutorial(10);
  if (skill.includes("addition within 20") || skill.includes("2-digit addition")) return additionTutorial(20);
  if (skill.includes("addition")) return additionTutorial(99);
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
    examples: [
      { problem: "2, 4, 6, 8, ___", steps: ["Each number increases by 2.", "8 + 2 = 10"], answer: "10" },
      { problem: "5, 10, 15, 20, ___", steps: ["Each number increases by 5.", "20 + 5 = 25"], answer: "25" },
      { problem: "100, 90, 80, 70, ___", steps: ["Each number decreases by 10.", "70 − 10 = 60"], answer: "60" },
      { problem: "1, 3, 9, 27, ___", steps: ["Each number is multiplied by 3.", "27 × 3 = 81"], answer: "81" },
      { problem: "What is the rule? 3, 6, 12, 24", steps: ["3 × 2 = 6", "6 × 2 = 12", "12 × 2 = 24", "The rule is: multiply by 2."], answer: "×2 (double each time)" },
    ],
  };
}

function numberBondsTutorial(): TutorialContent {
  return {
    skillName: "Number Bonds",
    intro: "Number bonds show how a number can be split into two parts.",
    examples: [
      { problem: "3 + ___ = 7", steps: ["We need the missing part.", "7 − 3 = 4", "So 3 + 4 = 7"], answer: "4" },
      { problem: "___ + 6 = 10", steps: ["10 − 6 = 4", "So 4 + 6 = 10"], answer: "4" },
      { problem: "8 + ___ = 15", steps: ["15 − 8 = 7", "Check: 8 + 7 = 15 ✓"], answer: "7" },
      { problem: "Split 12 into two parts. One part is 5. What is the other?", steps: ["12 = 5 + ?", "12 − 5 = 7"], answer: "7" },
      { problem: "___ + 9 = 18", steps: ["18 − 9 = 9", "So 9 + 9 = 18"], answer: "9" },
    ],
  };
}

function additionTutorial(max: number): TutorialContent {
  return {
    skillName: "Addition",
    intro: "Addition means combining two numbers to find the total.",
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
    examples: [
      { problem: "___ + 8 = 13", steps: ["To find the missing number, subtract: 13 − 8 = 5", "Check: 5 + 8 = 13 ✓"], answer: "5" },
      { problem: "25 − ___ = 11", steps: ["To find the missing number: 25 − 11 = 14", "Check: 25 − 14 = 11 ✓"], answer: "14" },
      { problem: "___ × 6 = 42", steps: ["To find the missing number, divide: 42 ÷ 6 = 7", "Check: 7 × 6 = 42 ✓"], answer: "7" },
      { problem: "48 ÷ ___ = 8", steps: ["To find the missing number: 48 ÷ 8 = 6", "Check: 48 ÷ 6 = 8 ✓"], answer: "6" },
      { problem: "___ − 17 = 25", steps: ["To find the missing number, add: 25 + 17 = 42", "Check: 42 − 17 = 25 ✓"], answer: "42" },
    ],
  };
}

function subtractionTutorial(): TutorialContent {
  return {
    skillName: "Subtraction",
    intro: "Subtraction means taking away one number from another.",
    examples: [
      { problem: "57 − 23 = ?", steps: ["Subtract ones: 7 − 3 = 4", "Subtract tens: 50 − 20 = 30", "Answer: 34"], answer: "34" },
      { problem: "82 − 45 = ?", steps: ["Ones: 2 − 5 is too small, so borrow from tens.", "12 − 5 = 7 (ones digit: 7)", "Tens: 7 − 4 = 3 (after borrowing)", "Answer: 37"], answer: "37" },
      { problem: "200 − 56 = ?", steps: ["Borrow from hundreds: 200 becomes 1 hundred, 9 tens, 10 ones.", "Ones: 10 − 6 = 4", "Tens: 9 − 5 = 4", "Hundreds: 1 − 0 = 1", "Answer: 144"], answer: "144" },
      { problem: "500 − 273 = ?", steps: ["500 − 273", "Ones: borrow → 10 − 3 = 7", "Tens: borrow → 9 − 7 = 2", "Hundreds: 4 − 2 = 2", "Answer: 227"], answer: "227" },
      { problem: "1000 − 364 = ?", steps: ["1000 − 364", "Work through borrowing carefully:", "Ones: 10 − 4 = 6", "Tens: 9 − 6 = 3", "Hundreds: 9 − 3 = 6", "Thousands: 0", "Answer: 636"], answer: "636" },
    ],
  };
}

function multiplicationTutorial(): TutorialContent {
  return {
    skillName: "Multiplication",
    intro: "Multiplication is repeated addition. 3 × 4 means 3 groups of 4.",
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
    examples: [
      { problem: "42 ÷ 6 = ?", steps: ["Ask: how many 6s fit into 42?", "6 × 7 = 42", "So 42 ÷ 6 = 7"], answer: "7" },
      { problem: "63 ÷ 9 = ?", steps: ["Ask: 9 × ? = 63", "9 × 7 = 63", "So 63 ÷ 9 = 7"], answer: "7" },
      { problem: "72 ÷ 8 = ?", steps: ["8 × 9 = 72", "So 72 ÷ 8 = 9"], answer: "9" },
      { problem: "132 ÷ 11 = ?", steps: ["11 × 10 = 110", "11 × 12 = 132", "So 132 ÷ 11 = 12"], answer: "12" },
      { problem: "156 ÷ 12 = ?", steps: ["12 × 10 = 120", "156 − 120 = 36", "12 × 3 = 36", "So 12 × 13 = 156", "156 ÷ 12 = 13"], answer: "13" },
    ],
  };
}

function divisionRemaindersTutorial(): TutorialContent {
  return {
    skillName: "Division with Remainders",
    intro: "Sometimes numbers don't divide evenly. The leftover is called the remainder.",
    examples: [
      { problem: "17 ÷ 5 = ?", steps: ["5 × 3 = 15 (closest without going over)", "17 − 15 = 2 left over", "Answer: 3 remainder 2, or 3 R 2"], answer: "3 R 2" },
      { problem: "23 ÷ 4 = ?", steps: ["4 × 5 = 20 (closest without going over)", "23 − 20 = 3 left over", "Answer: 5 R 3"], answer: "5 R 3" },
      { problem: "37 ÷ 6 = ?", steps: ["6 × 6 = 36", "37 − 36 = 1 left over", "Answer: 6 R 1"], answer: "6 R 1" },
      { problem: "50 ÷ 7 = ?", steps: ["7 × 7 = 49", "50 − 49 = 1 left over", "Answer: 7 R 1"], answer: "7 R 1" },
      { problem: "100 ÷ 9 = ?", steps: ["9 × 11 = 99", "100 − 99 = 1 left over", "Answer: 11 R 1"], answer: "11 R 1" },
    ],
  };
}

function fractionIdentificationTutorial(): TutorialContent {
  return {
    skillName: "Fractions",
    intro: "A fraction shows part of a whole. The top number (numerator) is the part; the bottom (denominator) is the total.",
    examples: [
      { problem: "A pizza has 8 slices. You eat 3. What fraction did you eat?", steps: ["Parts eaten = 3 (numerator)", "Total parts = 8 (denominator)", "Fraction eaten = 3/8"], answer: "3/8" },
      { problem: "What fraction of 10 is 4?", steps: ["4 out of 10 total parts", "Fraction = 4/10", "Simplified: 4/10 = 2/5"], answer: "2/5" },
      { problem: "There are 12 students. 5 are boys. What fraction are girls?", steps: ["Girls = 12 − 5 = 7", "Total = 12", "Fraction of girls = 7/12"], answer: "7/12" },
      { problem: "Which is larger: 1/2 or 1/4?", steps: ["Both fractions have 1 on top (numerator).", "Larger denominator = smaller pieces.", "1/2 > 1/4"], answer: "1/2" },
      { problem: "Write 0.5 as a fraction.", steps: ["0.5 = 5 tenths = 5/10", "Simplify: 5/10 = 1/2"], answer: "1/2" },
    ],
  };
}

function fractionSimplificationTutorial(): TutorialContent {
  return {
    skillName: "Simplifying Fractions",
    intro: "To simplify a fraction, divide both numerator and denominator by their Greatest Common Factor (GCF).",
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
    examples: [
      { problem: "3.4 + 2.5 = ?", steps: ["Line up decimal points:", "  3.4", "+ 2.5", "= 5.9"], answer: "5.9" },
      { problem: "7.8 − 3.2 = ?", steps: ["Line up decimal points:", "  7.8", "− 3.2", "= 4.6"], answer: "4.6" },
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
    examples: [
      { problem: "In a class of 30, there are 12 boys. Write the ratio of boys to girls.", steps: ["Boys = 12, Girls = 30 − 12 = 18", "Ratio of boys to girls = 12:18", "Simplified (÷6): 2:3"], answer: "2:3" },
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
    examples: [
      { problem: "Solve: x + 7 = 12", steps: ["Subtract 7 from both sides:", "x + 7 − 7 = 12 − 7", "x = 5", "Check: 5 + 7 = 12 ✓"], answer: "x = 5" },
      { problem: "Solve: x − 4 = 9", steps: ["Add 4 to both sides:", "x − 4 + 4 = 9 + 4", "x = 13"], answer: "x = 13" },
      { problem: "Solve: 3x = 21", steps: ["Divide both sides by 3:", "3x ÷ 3 = 21 ÷ 3", "x = 7", "Check: 3 × 7 = 21 ✓"], answer: "x = 7" },
      { problem: "Solve: x/5 = 6", steps: ["Multiply both sides by 5:", "x/5 × 5 = 6 × 5", "x = 30"], answer: "x = 30" },
      { problem: "Solve: x + 15 = 40", steps: ["Subtract 15 from both sides:", "x = 40 − 15 = 25"], answer: "x = 25" },
    ],
  };
}

function twoStepEquationsTutorial(): TutorialContent {
  return {
    skillName: "Two-Step Equations",
    intro: "Two-step equations need two operations to solve. Work in reverse order of operations.",
    examples: [
      { problem: "Solve: 2x + 3 = 11", steps: ["Step 1: Subtract 3 from both sides: 2x = 8", "Step 2: Divide both sides by 2: x = 4", "Check: 2(4) + 3 = 11 ✓"], answer: "x = 4" },
      { problem: "Solve: 3x − 5 = 16", steps: ["Step 1: Add 5 to both sides: 3x = 21", "Step 2: Divide by 3: x = 7", "Check: 3(7) − 5 = 16 ✓"], answer: "x = 7" },
      { problem: "Solve: 4x + 8 = 28", steps: ["Step 1: 4x = 28 − 8 = 20", "Step 2: x = 20 ÷ 4 = 5"], answer: "x = 5" },
      { problem: "Solve: x/3 + 4 = 9", steps: ["Step 1: x/3 = 9 − 4 = 5", "Step 2: x = 5 × 3 = 15"], answer: "x = 15" },
      { problem: "Solve: 5x − 10 = 20", steps: ["Step 1: 5x = 20 + 10 = 30", "Step 2: x = 30 ÷ 5 = 6"], answer: "x = 6" },
    ],
  };
}

function inequalitiesTutorial(): TutorialContent {
  return {
    skillName: "Inequalities",
    intro: "Inequalities use <, >, ≤, ≥ instead of =. Solve like equations, but flip the sign when multiplying/dividing by a negative.",
    examples: [
      { problem: "Solve: x + 3 > 8", steps: ["Subtract 3 from both sides:", "x > 8 − 3", "x > 5", "Solution: all numbers greater than 5"], answer: "x > 5" },
      { problem: "Solve: 2x ≤ 12", steps: ["Divide both sides by 2:", "x ≤ 6", "Solution: all numbers ≤ 6"], answer: "x ≤ 6" },
      { problem: "Solve: x − 4 ≥ 7", steps: ["Add 4 to both sides:", "x ≥ 11"], answer: "x ≥ 11" },
      { problem: "Solve: −3x > 9", steps: ["Divide by −3 (flip the sign!):", "x < −3"], answer: "x < −3" },
      { problem: "Solve: 3x + 1 < 16", steps: ["Step 1: 3x < 15", "Step 2: x < 5"], answer: "x < 5" },
    ],
  };
}

function wordProblemsTutorial(): TutorialContent {
  return {
    skillName: "Word Problems",
    intro: "Read carefully. Identify what you know and what you need to find. Choose the right operation.",
    examples: [
      { problem: "A store has 150 apples. They sell 47. How many remain?", steps: ["Known: 150 total, 47 sold", "Operation: subtraction (taking away)", "150 − 47 = 103"], answer: "103 apples" },
      { problem: "A book has 320 pages. Maria reads 40 pages per day. How many days to finish?", steps: ["Known: 320 pages, 40 pages/day", "Operation: division (sharing equally)", "320 ÷ 40 = 8 days"], answer: "8 days" },
      { problem: "A shirt costs $35. There is a 20% discount. What is the sale price?", steps: ["Discount = 20% of $35 = 0.2 × 35 = $7", "Sale price = $35 − $7 = $28"], answer: "$28" },
      { problem: "A rectangle is 12 cm long and 7 cm wide. What is its area?", steps: ["Area = length × width", "Area = 12 × 7 = 84 cm²"], answer: "84 cm²" },
      { problem: "3 friends share 45 stickers equally. How many each?", steps: ["Known: 45 stickers, 3 friends", "Operation: division", "45 ÷ 3 = 15"], answer: "15 stickers each" },
    ],
  };
}

function slopeInterceptTutorial(): TutorialContent {
  return {
    skillName: "Slope and Intercept",
    intro: "In y = mx + b, m is the slope (steepness) and b is the y-intercept (where the line crosses the y-axis).",
    examples: [
      { problem: "Find the slope and y-intercept of y = 3x + 2", steps: ["Compare to y = mx + b", "m (slope) = 3", "b (y-intercept) = 2"], answer: "Slope = 3, y-intercept = 2" },
      { problem: "What is the slope of y = −2x + 5?", steps: ["m = −2 (negative means line goes down left to right)"], answer: "−2" },
      { problem: "Find y when x = 4 in y = 2x − 1", steps: ["Substitute x = 4:", "y = 2(4) − 1 = 8 − 1 = 7"], answer: "y = 7" },
      { problem: "Write the equation of a line with slope 3 and y-intercept −4.", steps: ["y = mx + b", "y = 3x + (−4)", "y = 3x − 4"], answer: "y = 3x − 4" },
      { problem: "What is the slope of a horizontal line?", steps: ["A horizontal line has no rise — it's flat.", "Slope = rise/run = 0/run = 0"], answer: "0" },
    ],
  };
}

function graphingLinesTutorial(): TutorialContent {
  return {
    skillName: "Graphing Lines",
    intro: "To graph a line: find the y-intercept (start point), then use the slope to find more points.",
    examples: [
      { problem: "Graph y = 2x + 1. What are two points on the line?", steps: ["y-intercept: when x=0, y=1 → point (0,1)", "Slope = 2 = 2/1: go right 1, up 2 → point (1,3)", "Two points: (0,1) and (1,3)"], answer: "(0,1) and (1,3)" },
      { problem: "What is the x-intercept of y = 3x − 6?", steps: ["Set y = 0: 0 = 3x − 6", "3x = 6", "x = 2", "x-intercept = (2, 0)"], answer: "(2, 0)" },
      { problem: "Are y = 2x + 1 and y = 2x − 3 parallel?", steps: ["Both have slope m = 2", "Parallel lines have equal slopes.", "Yes, they are parallel."], answer: "Yes, parallel (same slope)" },
      { problem: "What is the slope of y = 4?", steps: ["y = 4 is a horizontal line", "Horizontal lines have slope = 0"], answer: "0" },
      { problem: "What is the slope of x = 3?", steps: ["x = 3 is a vertical line", "Vertical lines have undefined slope"], answer: "Undefined" },
    ],
  };
}

function systemsOfEquationsTutorial(): TutorialContent {
  return {
    skillName: "Systems of Equations",
    intro: "A system of equations has two equations with two unknowns. Find the values that satisfy both.",
    examples: [
      { problem: "Solve: x + y = 10 and x − y = 2", steps: ["Add both equations:", "2x = 12 → x = 6", "Substitute: 6 + y = 10 → y = 4", "Solution: x=6, y=4"], answer: "x=6, y=4" },
      { problem: "Solve: 2x + y = 7 and x + y = 4", steps: ["Subtract second from first:", "x = 3", "Substitute: 3 + y = 4 → y = 1"], answer: "x=3, y=1" },
      { problem: "Solve: x + y = 5 and 2x − y = 4", steps: ["Add: 3x = 9 → x = 3", "y = 5 − 3 = 2"], answer: "x=3, y=2" },
      { problem: "Solve by substitution: y = 2x and x + y = 9", steps: ["Substitute y = 2x into second equation:", "x + 2x = 9 → 3x = 9 → x = 3", "y = 2(3) = 6"], answer: "x=3, y=6" },
      { problem: "How many solutions does x + y = 5 and x + y = 7 have?", steps: ["Both equations are parallel (same slope, different intercept)", "They never intersect → no solution"], answer: "No solution" },
    ],
  };
}

function addingPolynomialsTutorial(): TutorialContent {
  return {
    skillName: "Adding Polynomials",
    intro: "To add polynomials, combine like terms (same variable and exponent).",
    examples: [
      { problem: "(3x + 5) + (2x + 4) = ?", steps: ["Group like terms: (3x + 2x) + (5 + 4)", "= 5x + 9"], answer: "5x + 9" },
      { problem: "(x² + 3x) + (2x² + x) = ?", steps: ["x² terms: x² + 2x² = 3x²", "x terms: 3x + x = 4x", "Answer: 3x² + 4x"], answer: "3x² + 4x" },
      { problem: "(4x² − 2x + 1) + (x² + 5x − 3) = ?", steps: ["x² terms: 4x² + x² = 5x²", "x terms: −2x + 5x = 3x", "Constant: 1 + (−3) = −2", "Answer: 5x² + 3x − 2"], answer: "5x² + 3x − 2" },
      { problem: "(7x − 3) + (−4x + 8) = ?", steps: ["x terms: 7x + (−4x) = 3x", "Constants: −3 + 8 = 5", "Answer: 3x + 5"], answer: "3x + 5" },
      { problem: "(2x³ + x) + (x³ − 3x + 4) = ?", steps: ["x³ terms: 2x³ + x³ = 3x³", "x terms: x + (−3x) = −2x", "Constants: 0 + 4 = 4", "Answer: 3x³ − 2x + 4"], answer: "3x³ − 2x + 4" },
    ],
  };
}

function multiplyingPolynomialsTutorial(): TutorialContent {
  return {
    skillName: "Multiplying Polynomials",
    intro: "Use FOIL (First, Outer, Inner, Last) to multiply two binomials.",
    examples: [
      { problem: "(x + 2)(x + 3) = ?", steps: ["FOIL:", "First: x × x = x²", "Outer: x × 3 = 3x", "Inner: 2 × x = 2x", "Last: 2 × 3 = 6", "Combine: x² + 3x + 2x + 6 = x² + 5x + 6"], answer: "x² + 5x + 6" },
      { problem: "(x + 4)(x − 1) = ?", steps: ["First: x²", "Outer: −x", "Inner: 4x", "Last: −4", "Combine: x² + 3x − 4"], answer: "x² + 3x − 4" },
      { problem: "(x − 3)(x − 2) = ?", steps: ["First: x²", "Outer: −2x", "Inner: −3x", "Last: +6", "Combine: x² − 5x + 6"], answer: "x² − 5x + 6" },
      { problem: "(2x + 1)(x + 3) = ?", steps: ["First: 2x²", "Outer: 6x", "Inner: x", "Last: 3", "Combine: 2x² + 7x + 3"], answer: "2x² + 7x + 3" },
      { problem: "(x + 5)(x − 5) = ?", steps: ["This is difference of squares: (a+b)(a−b) = a² − b²", "= x² − 25"], answer: "x² − 25" },
    ],
  };
}

function factoringTutorial(): TutorialContent {
  return {
    skillName: "Factoring",
    intro: "Factoring is the reverse of expanding. Find two numbers that multiply to the constant and add to the middle coefficient.",
    examples: [
      { problem: "Factor: x² + 5x + 6", steps: ["Find two numbers that multiply to 6 and add to 5.", "2 × 3 = 6 and 2 + 3 = 5 ✓", "Answer: (x + 2)(x + 3)"], answer: "(x + 2)(x + 3)" },
      { problem: "Factor: x² − 9 (difference of squares)", steps: ["x² − 9 = x² − 3²", "a² − b² = (a+b)(a−b)", "= (x + 3)(x − 3)"], answer: "(x + 3)(x − 3)" },
      { problem: "Factor: x² + 7x + 12", steps: ["Find two numbers: multiply to 12, add to 7", "3 × 4 = 12, 3 + 4 = 7 ✓", "Answer: (x + 3)(x + 4)"], answer: "(x + 3)(x + 4)" },
      { problem: "Factor out the GCF: 6x + 9", steps: ["GCF of 6 and 9 = 3", "3(2x + 3)"], answer: "3(2x + 3)" },
      { problem: "Factor: x² − x − 6", steps: ["Find two numbers: multiply to −6, add to −1", "−3 × 2 = −6, −3 + 2 = −1 ✓", "Answer: (x − 3)(x + 2)"], answer: "(x − 3)(x + 2)" },
    ],
  };
}

function quadraticEquationsTutorial(): TutorialContent {
  return {
    skillName: "Quadratic Equations",
    intro: "Quadratic equations have x². Solve by factoring: set each factor equal to zero.",
    examples: [
      { problem: "Solve: x² + 5x + 6 = 0", steps: ["Factor: (x + 2)(x + 3) = 0", "Set each factor to zero:", "x + 2 = 0 → x = −2", "x + 3 = 0 → x = −3", "Solutions: x = −2 or x = −3"], answer: "x = −2 or x = −3" },
      { problem: "Solve: x² − 7x + 12 = 0", steps: ["Factor: (x − 3)(x − 4) = 0", "x = 3 or x = 4"], answer: "x = 3 or x = 4" },
      { problem: "Solve: x² − 9 = 0", steps: ["x² = 9", "x = ±√9 = ±3", "x = 3 or x = −3"], answer: "x = 3 or x = −3" },
      { problem: "Solve: x² + 4x = 0", steps: ["Factor out x: x(x + 4) = 0", "x = 0 or x + 4 = 0", "x = 0 or x = −4"], answer: "x = 0 or x = −4" },
      { problem: "Solve: 2x² − 8 = 0", steps: ["2x² = 8", "x² = 4", "x = ±2"], answer: "x = 2 or x = −2" },
    ],
  };
}

function quadraticFormulaTutorial(): TutorialContent {
  return {
    skillName: "Quadratic Formula",
    intro: "For ax² + bx + c = 0, use x = (−b ± √(b²−4ac)) / 2a. The discriminant b²−4ac tells you how many solutions.",
    examples: [
      { problem: "Solve x² + 4x + 4 = 0 using the quadratic formula", steps: ["a=1, b=4, c=4", "Discriminant: 4² − 4(1)(4) = 16 − 16 = 0", "x = −4 / 2 = −2 (one solution)"], answer: "x = −2" },
      { problem: "Solve x² − 5x + 6 = 0", steps: ["a=1, b=−5, c=6", "Discriminant: 25 − 24 = 1", "x = (5 ± 1) / 2", "x = 3 or x = 2"], answer: "x = 3 or x = 2" },
      { problem: "How many solutions does x² + x + 1 = 0 have?", steps: ["Discriminant: 1² − 4(1)(1) = 1 − 4 = −3", "Discriminant < 0 → no real solutions"], answer: "No real solutions" },
      { problem: "What is the discriminant of 2x² + 3x − 2 = 0?", steps: ["a=2, b=3, c=−2", "b² − 4ac = 9 − 4(2)(−2) = 9 + 16 = 25"], answer: "25 (two real solutions)" },
      { problem: "Solve x² − 4 = 0 using the quadratic formula", steps: ["a=1, b=0, c=−4", "x = (0 ± √16) / 2 = ±4/2 = ±2"], answer: "x = 2 or x = −2" },
    ],
  };
}

function parabolasTutorial(): TutorialContent {
  return {
    skillName: "Graphing Parabolas",
    intro: "The parabola y = a(x−h)² + k has vertex (h,k). If a>0 it opens up; if a<0 it opens down.",
    examples: [
      { problem: "Find the vertex of y = (x − 3)² + 2", steps: ["In y = a(x−h)² + k, h=3, k=2", "Vertex = (3, 2)"], answer: "Vertex: (3, 2)" },
      { problem: "Does y = −2(x+1)² + 5 open up or down?", steps: ["a = −2 (negative)", "Negative a → opens downward"], answer: "Downward" },
      { problem: "Find the vertex of y = x² − 6x + 8", steps: ["Complete the square or use h = −b/2a", "h = 6/2 = 3", "k = 3² − 6(3) + 8 = 9 − 18 + 8 = −1", "Vertex = (3, −1)"], answer: "Vertex: (3, −1)" },
      { problem: "What is the axis of symmetry of y = (x − 4)² + 1?", steps: ["Axis of symmetry passes through vertex x-coordinate.", "x = 4"], answer: "x = 4" },
      { problem: "Find the y-intercept of y = x² − 4x + 3", steps: ["Set x = 0: y = 0 − 0 + 3 = 3", "y-intercept = (0, 3)"], answer: "(0, 3)" },
    ],
  };
}

function functionNotationTutorial(): TutorialContent {
  return {
    skillName: "Function Notation",
    intro: "f(x) means 'the function f evaluated at x'. Simply substitute the value for x.",
    examples: [
      { problem: "If f(x) = 2x + 3, find f(4)", steps: ["Substitute x = 4:", "f(4) = 2(4) + 3 = 8 + 3 = 11"], answer: "11" },
      { problem: "If g(x) = x² − 1, find g(3)", steps: ["g(3) = 3² − 1 = 9 − 1 = 8"], answer: "8" },
      { problem: "If h(x) = 3x − 7, find h(0)", steps: ["h(0) = 3(0) − 7 = −7"], answer: "−7" },
      { problem: "If f(x) = x² + 2x, find f(−2)", steps: ["f(−2) = (−2)² + 2(−2) = 4 − 4 = 0"], answer: "0" },
      { problem: "If f(x) = 5 (constant function), find f(100)", steps: ["A constant function always returns the same value.", "f(100) = 5"], answer: "5" },
    ],
  };
}

function domainRangeTutorial(): TutorialContent {
  return {
    skillName: "Domain and Range",
    intro: "Domain = all valid x-values (inputs). Range = all possible y-values (outputs).",
    examples: [
      { problem: "What is the domain of f(x) = 1/x?", steps: ["x cannot be 0 (division by zero is undefined)", "Domain: all real numbers except x = 0"], answer: "All real numbers except x = 0" },
      { problem: "What is the domain of f(x) = √x?", steps: ["Square root of a negative number is not real.", "x must be ≥ 0", "Domain: x ≥ 0"], answer: "x ≥ 0" },
      { problem: "What is the range of f(x) = x²?", steps: ["x² is always ≥ 0 for any real x", "Range: y ≥ 0"], answer: "y ≥ 0" },
      { problem: "What is the domain of f(x) = √(x − 4)?", steps: ["x − 4 ≥ 0", "x ≥ 4"], answer: "x ≥ 4" },
      { problem: "What is the range of f(x) = |x| + 2?", steps: ["|x| ≥ 0 always", "So |x| + 2 ≥ 2 always", "Range: y ≥ 2"], answer: "y ≥ 2" },
    ],
  };
}

function inverseFunctionsTutorial(): TutorialContent {
  return {
    skillName: "Inverse Functions",
    intro: "The inverse function f⁻¹ reverses what f does. To find it: swap x and y, then solve for y.",
    examples: [
      { problem: "Find the inverse of f(x) = 2x + 4", steps: ["Write y = 2x + 4", "Swap x and y: x = 2y + 4", "Solve for y: 2y = x − 4, y = (x−4)/2", "f⁻¹(x) = (x−4)/2"], answer: "f⁻¹(x) = (x−4)/2" },
      { problem: "Find the inverse of f(x) = 3x", steps: ["y = 3x → swap → x = 3y", "y = x/3", "f⁻¹(x) = x/3"], answer: "f⁻¹(x) = x/3" },
      { problem: "Verify: if f(x) = 5x − 2, does f⁻¹(f(3)) = 3?", steps: ["f(3) = 5(3) − 2 = 13", "f⁻¹(13) = (13+2)/5 = 3 ✓"], answer: "Yes, f⁻¹(f(3)) = 3" },
      { problem: "Find the inverse of f(x) = x + 7", steps: ["y = x + 7 → x = y + 7", "y = x − 7", "f⁻¹(x) = x − 7"], answer: "f⁻¹(x) = x − 7" },
      { problem: "What is the relationship between a function and its inverse graphically?", steps: ["They are reflections of each other across the line y = x."], answer: "Reflections across y = x" },
    ],
  };
}

function rightTriangleTrigTutorial(): TutorialContent {
  return {
    skillName: "Right Triangle Trigonometry",
    intro: "SOH-CAH-TOA: sin = Opposite/Hypotenuse, cos = Adjacent/Hypotenuse, tan = Opposite/Adjacent.",
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
    examples: [
      { problem: "What is sin(0°) and cos(0°)?", steps: ["At 0°, the point is (1, 0)", "cos(0°) = 1, sin(0°) = 0"], answer: "sin(0°)=0, cos(0°)=1" },
      { problem: "What is sin(90°) and cos(90°)?", steps: ["At 90°, the point is (0, 1)", "cos(90°) = 0, sin(90°) = 1"], answer: "sin(90°)=1, cos(90°)=0" },
      { problem: "What is sin(45°)?", steps: ["At 45°, the point is (√2/2, √2/2)", "sin(45°) = √2/2 ≈ 0.707"], answer: "√2/2" },
      { problem: "What is cos(60°)?", steps: ["At 60°, the point is (1/2, √3/2)", "cos(60°) = 1/2"], answer: "1/2" },
      { problem: "In which quadrant is sin(θ) negative and cos(θ) positive?", steps: ["Quadrant I: both positive", "Quadrant II: sin+, cos−", "Quadrant III: both negative", "Quadrant IV: sin−, cos+"], answer: "Quadrant IV" },
    ],
  };
}

function trigIdentitiesTutorial(): TutorialContent {
  return {
    skillName: "Trig Identities",
    intro: "Trig identities are equations that are true for all angles. The most important: sin²θ + cos²θ = 1.",
    examples: [
      { problem: "Complete: sin²θ + ___ = 1", steps: ["This is the Pythagorean identity.", "sin²θ + cos²θ = 1"], answer: "cos²θ" },
      { problem: "Simplify: 1 − cos²θ", steps: ["From sin²θ + cos²θ = 1", "Rearrange: sin²θ = 1 − cos²θ"], answer: "sin²θ" },
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
    intro: "Complex numbers have the form a + bi, where i = √(−1) and i² = −1. 'a' is the real part; 'b' is the imaginary part.",
    examples: [
      { problem: "What is i²?", steps: ["By definition: i = √(−1)", "i² = (√(−1))² = −1"], answer: "−1" },
      { problem: "Add: (3 + 2i) + (4 + 5i)", steps: ["Add real parts: 3 + 4 = 7", "Add imaginary parts: 2i + 5i = 7i", "Answer: 7 + 7i"], answer: "7 + 7i" },
      { problem: "Simplify: √(−9)", steps: ["√(−9) = √(9 × −1) = √9 × √(−1) = 3i"], answer: "3i" },
      { problem: "What is the conjugate of (5 + 3i)?", steps: ["The conjugate flips the sign of the imaginary part.", "Conjugate of (5 + 3i) = (5 − 3i)"], answer: "5 − 3i" },
      { problem: "Multiply: (2 + 3i)(2 − 3i)", steps: ["Use difference of squares: (a+b)(a−b) = a² − b²", "= 4 − (3i)² = 4 − 9i² = 4 − 9(−1) = 4 + 9 = 13"], answer: "13" },
    ],
  };
}

function limitsTutorial(): TutorialContent {
  return {
    skillName: "Limits",
    intro: "A limit describes what value a function approaches as x gets close to a specific value. Written as lim(x→a) f(x).",
    examples: [
      { problem: "Find lim(x→3) of x + 2", steps: ["Simply substitute x = 3:", "3 + 2 = 5"], answer: "5" },
      { problem: "Find lim(x→0) of x²", steps: ["As x → 0: x² → 0² = 0"], answer: "0" },
      { problem: "Find lim(x→2) of (x² − 4)/(x − 2)", steps: ["Direct substitution gives 0/0 (indeterminate form)", "Factor numerator: (x+2)(x−2)/(x−2)", "Cancel (x−2): lim = x + 2 as x→2 = 4"], answer: "4" },
      { problem: "Find lim(x→∞) of 1/x", steps: ["As x gets very large, 1/x gets very small", "lim(x→∞) of 1/x = 0"], answer: "0" },
      { problem: "Find lim(x→0) of sin(x)/x", steps: ["This is a famous limit.", "lim(x→0) sin(x)/x = 1"], answer: "1" },
    ],
  };
}

function sequencesTutorial(): TutorialContent {
  return {
    skillName: "Sequences and Series",
    intro: "A sequence is an ordered list of numbers. An arithmetic sequence adds a constant; a geometric sequence multiplies by a constant.",
    examples: [
      { problem: "Find the next term: 3, 7, 11, 15, ___", steps: ["Common difference: 7−3 = 4", "Next term: 15 + 4 = 19"], answer: "19" },
      { problem: "Find the 10th term of: 2, 5, 8, 11, ...", steps: ["First term a = 2, common difference d = 3", "aₙ = a + (n−1)d", "a₁₀ = 2 + (10−1)×3 = 2 + 27 = 29"], answer: "29" },
      { problem: "Find the next term: 3, 6, 12, 24, ___", steps: ["Common ratio: 6/3 = 2", "Next term: 24 × 2 = 48"], answer: "48" },
      { problem: "Find the sum of an infinite geometric series: a=2, r=1/2", steps: ["Formula: S = a/(1−r)", "S = 2/(1−0.5) = 2/0.5 = 4"], answer: "4" },
      { problem: "Find the sum of first 5 terms: 1, 3, 5, 7, 9", steps: ["Arithmetic series sum: S = n/2 × (first + last)", "S = 5/2 × (1 + 9) = 5/2 × 10 = 25"], answer: "25" },
    ],
  };
}

function vectorsTutorial(): TutorialContent {
  return {
    skillName: "Vectors",
    intro: "A vector has magnitude (size) and direction. Written as (x, y). Add by adding components; magnitude = √(x² + y²).",
    examples: [
      { problem: "Add vectors: (3, 4) + (1, 2)", steps: ["Add x components: 3 + 1 = 4", "Add y components: 4 + 2 = 6", "Result: (4, 6)"], answer: "(4, 6)" },
      { problem: "Find the magnitude of (3, 4)", steps: ["magnitude = √(x² + y²)", "= √(9 + 16) = √25 = 5"], answer: "5" },
      { problem: "Find the dot product of (2, 3) and (4, 5)", steps: ["Dot product = x₁x₂ + y₁y₂", "= 2×4 + 3×5 = 8 + 15 = 23"], answer: "23" },
      { problem: "Subtract: (5, 3) − (2, 1)", steps: ["Subtract components:", "(5−2, 3−1) = (3, 2)"], answer: "(3, 2)" },
      { problem: "If two vectors have dot product 0, what does that mean?", steps: ["Dot product = 0 means the vectors are perpendicular (90° angle)"], answer: "They are perpendicular" },
    ],
  };
}

function derivativesTutorial(): TutorialContent {
  return {
    skillName: "Derivatives",
    intro: "The derivative f'(x) measures the instantaneous rate of change. Power rule: d/dx[xⁿ] = nxⁿ⁻¹.",
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
    examples: [
      { problem: "Find ∫x² dx", steps: ["Power rule: increase exponent by 1, divide by new exponent", "∫x² dx = x³/3 + C"], answer: "x³/3 + C" },
      { problem: "Find ∫4x dx", steps: ["∫4x dx = 4 × x²/2 + C = 2x² + C"], answer: "2x² + C" },
      { problem: "Evaluate ∫[0 to 2] x dx", steps: ["∫x dx = x²/2 + C", "Evaluate from 0 to 2:", "[x²/2] from 0 to 2 = 4/2 − 0/2 = 2"], answer: "2" },
      { problem: "Find ∫cos x dx", steps: ["Standard integral: ∫cos x dx = sin x + C"], answer: "sin x + C" },
      { problem: "Find ∫e^x dx", steps: ["The exponential integral: ∫e^x dx = e^x + C"], answer: "e^x + C" },
    ],
  };
}

function calculusApplicationsTutorial(): TutorialContent {
  return {
    skillName: "Calculus Applications",
    intro: "Derivatives find rates of change and extrema. Integrals find areas. Set f'(x) = 0 to find max/min points.",
    examples: [
      { problem: "If f(x) = x², at what x is the slope of the tangent = 4?", steps: ["f'(x) = 2x", "Set 2x = 4: x = 2"], answer: "x = 2" },
      { problem: "Find the critical points of f(x) = x³ − 3x", steps: ["f'(x) = 3x² − 3", "Set f'(x) = 0: 3x² − 3 = 0", "x² = 1 → x = ±1"], answer: "x = 1 and x = −1" },
      { problem: "If f''(x) > 0 at a critical point, is it a max or min?", steps: ["f''(x) > 0 means the function is concave up at that point.", "It is a local MINIMUM."], answer: "Local minimum" },
      { problem: "Find the area under y = 2x from x=0 to x=3.", steps: ["∫[0 to 3] 2x dx = [x²] from 0 to 3 = 9 − 0 = 9"], answer: "9 square units" },
      { problem: "A ball has position s(t) = −5t² + 20t. When is velocity = 0?", steps: ["Velocity = s'(t) = −10t + 20", "Set to 0: −10t + 20 = 0 → t = 2 seconds"], answer: "t = 2 seconds" },
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
      { problem: "Example 4: Common mistakes to avoid", steps: ["Always show your working.", "Don't skip steps.", "Check signs (+ and −) carefully."], answer: "Take care with signs" },
      { problem: "Example 5: Practice tip", steps: ["The more you practise, the faster you'll get.", "Focus on accuracy first, then speed."], answer: "Practice makes perfect" },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// READING TUTORIALS
// ─────────────────────────────────────────────────────────────────────────────

function getReadingTutorial(skill: string, skillName: string): TutorialContent {
  if (skill.includes("main idea") || skill.includes("topic")) return mainIdeaTutorial();
  if (skill.includes("cause") || skill.includes("effect")) return causeEffectTutorial();
  if (skill.includes("context") || skill.includes("vocabulary")) return contextCluesTutorial();
  if (skill.includes("inference") || skill.includes("infer")) return inferenceTutorial();
  if (skill.includes("figurative") || skill.includes("metaphor") || skill.includes("simile")) return figurativeLanguageTutorial();
  if (skill.includes("comprehension")) return comprehensionTutorial();
  return comprehensionTutorial();
}

function mainIdeaTutorial(): TutorialContent {
  return {
    skillName: "Main Idea",
    intro: "The main idea is the most important point in a passage. Supporting details give more information about it.",
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
  if (skill.includes("noun")) return nounsTutorial();
  if (skill.includes("verb")) return verbsTutorial();
  if (skill.includes("adjective")) return adjectivesTutorial();
  if (skill.includes("punctuation") || skill.includes("capitalization")) return punctuationTutorial();
  if (skill.includes("sentence")) return sentencesTutorial();
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
    examples: [
      { problem: "What are the three subatomic particles?", steps: ["Protons: positive charge, in nucleus", "Neutrons: no charge, in nucleus", "Electrons: negative charge, orbit around nucleus"], answer: "Protons (+), neutrons (neutral), electrons (−)" },
      { problem: "What is the difference between an ionic and covalent bond?", steps: ["Ionic bond: electrons are TRANSFERRED from one atom to another", "Example: NaCl (table salt) — Na gives electron to Cl", "Covalent bond: electrons are SHARED between atoms", "Example: H₂O — oxygen and hydrogen share electrons"], answer: "Ionic = transfer electrons; Covalent = share electrons" },
      { problem: "What does pH measure?", steps: ["pH measures how acidic or alkaline (basic) a solution is.", "Scale: 0–14", "0–6: acidic (lemon juice = 2)", "7: neutral (pure water)", "8–14: alkaline/basic (bleach = 13)"], answer: "0–6 acidic, 7 neutral, 8–14 alkaline" },
      { problem: "What is the difference between an exothermic and endothermic reaction?", steps: ["Exothermic: releases ENERGY (usually as heat)", "Example: burning wood, explosions", "Endothermic: absorbs ENERGY", "Example: photosynthesis, melting ice"], answer: "Exothermic = releases heat; Endothermic = absorbs heat" },
      { problem: "What is a catalyst?", steps: ["A catalyst speeds up a chemical reaction.", "It is NOT consumed in the reaction.", "Example: enzymes in your body speed up digestion.", "Catalysts lower the energy needed to start a reaction."], answer: "Speeds up reactions without being consumed" },
    ],
  };
}
