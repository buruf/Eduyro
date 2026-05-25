// src/lib/worksheet/generator.ts
// Core worksheet generation engine — produces Problem[] for any subject/skill

import { nanoid } from "nanoid";
import type { Problem, GeneratedWorksheet, AnswerKeyEntry } from "@/types";

// ─────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────

export interface GeneratorConfig {
  subjectSlug: string;
  levelCode: string;
  skillName: string;
  problemCount: number;
  timeLimitMinutes: number;
  difficulty?: number; // 0.5 easy | 1.0 standard | 1.5 hard
  sheetNumber?: number;
  totalSheets?: number;
}

export function generateProblems(config: GeneratorConfig): {
  problems: Problem[];
  answerKey: AnswerKeyEntry[];
} {
  const { subjectSlug, skillName, problemCount, difficulty = 1.0 } = config;

  let problems: Problem[] = [];

  switch (subjectSlug) {
    case "MATH":
      problems = generateMathProblems(skillName, problemCount, difficulty);
      break;
    case "READING":
      problems = generateReadingProblems(skillName, problemCount);
      break;
    case "WRITING":
      problems = generateWritingProblems(skillName, problemCount);
      break;
    case "SCIENCE":
      problems = generateScienceProblems(skillName, problemCount);
      break;
    default:
      problems = generateMathProblems(skillName, problemCount, difficulty);
  }

  // Shuffle so each sheet feels different
  const shuffled = shuffleArray(problems).slice(0, problemCount);

  const answerKey: AnswerKeyEntry[] = shuffled.map((p) => ({
    id: p.id,
    answer: p.answer,
    explanation: p.explanation,
  }));

  // Strip answers from problems before returning
  const sanitized = shuffled.map(({ answer, explanation, ...rest }) => ({
    ...rest,
    answer: "" as any, // will be filled by student
  }));

  return { problems: shuffled, answerKey };
}

// ─────────────────────────────────────────────
// MATH GENERATOR
// ─────────────────────────────────────────────

function generateMathProblems(
  skillName: string,
  count: number,
  difficulty: number
): Problem[] {
  const skill = skillName.toLowerCase();

  // Counting
  if (skill.includes("counting") || skill.includes("number recognition")) {
    return generateCounting(count);
  }
  // Addition
  if (skill.includes("addition within 5")) return generateAddition(count, 5);
  if (skill.includes("addition within 10")) return generateAddition(count, 10);
  if (skill.includes("addition within 20")) return generateAddition(count, 20);
  if (skill.includes("2-digit addition") || skill.includes("addition")) {
    return generateAddition(count, difficulty >= 1.5 ? 99 : 50);
  }
  // Subtraction
  if (skill.includes("subtraction within 20")) return generateSubtraction(count, 20);
  if (skill.includes("subtraction")) {
    return generateSubtraction(count, difficulty >= 1.5 ? 99 : 50);
  }
  // Multiplication
  if (skill.includes("×2") && skill.includes("×5")) return generateMultiplication(count, [2, 3, 4, 5]);
  if (skill.includes("×6") && skill.includes("×7") && skill.includes("×8")) return generateMultiplication(count, [6, 7, 8]);
  if (skill.includes("×9")) return generateMultiplication(count, [9]);
  if (skill.includes("×10") || skill.includes("×11") || skill.includes("×12")) return generateMultiplication(count, [10, 11, 12]);
  if (skill.includes("mixed") && skill.includes("×")) return generateMultiplication(count, [6, 7, 8, 9]);
  if (skill.includes("multiplication")) return generateMultiplication(count, [2, 3, 4, 5, 6, 7, 8, 9]);
  // Division
  if (skill.includes("division by 6") || skill.includes("division by 7") || skill.includes("division by 8")) {
    return generateDivision(count, [6, 7, 8]);
  }
  if (skill.includes("division by 9")) return generateDivision(count, [9]);
  if (skill.includes("mixed division")) return generateDivision(count, [6, 7, 8, 9]);
  if (skill.includes("division with remainders")) return generateDivisionWithRemainders(count);
  if (skill.includes("division")) return generateDivision(count, [2, 3, 4, 5, 6, 7, 8, 9]);
  // Fractions
  if (skill.includes("identifying fractions")) return generateFractionIdentification(count);
  if (skill.includes("simplifying fractions")) return generateFractionSimplification(count);
  if (skill.includes("adding fractions")) return generateFractionAddition(count);
  if (skill.includes("comparing fractions")) return generateFractionComparison(count);
  // Percentages
  if (skill.includes("percentage") || skill.includes("percent")) return generatePercentages(count);
  // Algebra
  if (skill.includes("one-step")) return generateOneStepEquations(count);
  if (skill.includes("two-step")) return generateTwoStepEquations(count);

  // Default to mixed multiplication
  return generateMultiplication(count, [2, 3, 4, 5, 6, 7, 8, 9]);
}

function generateAddition(count: number, max: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count * 3; i++) {
    const a = rand(1, max);
    const b = rand(1, Math.min(max - a + 1, max));
    const answer = a + b;
    problems.push({
      id: nanoid(8),
      type: "arithmetic",
      question: `${a} + ${b} =`,
      answer,
      points: 1,
    });
  }
  return deduplicateProblems(problems).slice(0, count);
}

function generateSubtraction(count: number, max: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count * 3; i++) {
    const b = rand(1, max - 1);
    const a = rand(b, max);
    const answer = a - b;
    problems.push({
      id: nanoid(8),
      type: "arithmetic",
      question: `${a} − ${b} =`,
      answer,
      points: 1,
    });
  }
  return deduplicateProblems(problems).slice(0, count);
}

function generateMultiplication(count: number, multipliers: number[]): Problem[] {
  const problems: Problem[] = [];
  const maxFactor = 12;

  for (const m of multipliers) {
    for (let n = 2; n <= maxFactor; n++) {
      problems.push({
        id: nanoid(8),
        type: "arithmetic",
        question: `${m} × ${n} =`,
        answer: m * n,
        points: 1,
        explanation: `${m} groups of ${n} = ${m * n}`,
      });
      // Also add reversed
      problems.push({
        id: nanoid(8),
        type: "arithmetic",
        question: `${n} × ${m} =`,
        answer: n * m,
        points: 1,
      });
      // Fill-in-blank variant
      if (problems.length % 5 === 0) {
        problems.push({
          id: nanoid(8),
          type: "fill_blank",
          question: `${m} × ___ = ${m * n}`,
          answer: n,
          points: 1,
        });
      }
    }
  }

  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

function generateDivision(count: number, divisors: number[]): Problem[] {
  const problems: Problem[] = [];

  for (const d of divisors) {
    for (let q = 2; q <= 12; q++) {
      const dividend = d * q;
      problems.push({
        id: nanoid(8),
        type: "arithmetic",
        question: `${dividend} ÷ ${d} =`,
        answer: q,
        points: 1,
        explanation: `${dividend} ÷ ${d} = ${q} because ${d} × ${q} = ${dividend}`,
      });
    }
  }

  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

function generateDivisionWithRemainders(count: number): Problem[] {
  const problems: Problem[] = [];
  const divisors = [3, 4, 5, 6, 7];

  for (let i = 0; i < count * 4; i++) {
    const d = divisors[rand(0, divisors.length - 1)];
    const q = rand(2, 12);
    const r = rand(1, d - 1);
    const dividend = d * q + r;
    problems.push({
      id: nanoid(8),
      type: "arithmetic",
      question: `${dividend} ÷ ${d} = ___ R ___`,
      answer: `${q} R ${r}`,
      points: 1,
    });
  }

  return deduplicateProblems(problems).slice(0, count);
}

function generateFractionIdentification(count: number): Problem[] {
  const scenarios = [
    { q: "A pizza has 8 slices. Maria eats 3. What fraction did she eat?", a: "3/8" },
    { q: "A ribbon is 10 cm. Tom cuts 4 cm. What fraction remains?", a: "6/10 = 3/5" },
    { q: "There are 12 students. 5 are girls. What fraction are boys?", a: "7/12" },
    { q: "A bag has 6 red and 4 blue marbles. What fraction are red?", a: "6/10 = 3/5" },
    { q: "A jug holds 1 litre. 250 ml is poured out. What fraction remains?", a: "3/4" },
    { q: "Shade 2/5 of a shape with 10 equal parts. How many parts are shaded?", a: "4" },
    { q: "A day has 24 hours. What fraction of the day is 6 hours?", a: "1/4" },
    { q: "Write 4/8 in its simplest form.", a: "1/2" },
    { q: "Which fraction is larger: 2/3 or 3/5?", a: "2/3" },
    { q: "1/4 + 2/4 = ?", a: "3/4" },
  ];

  return shuffleArray(scenarios).slice(0, count).map((s) => ({
    id: nanoid(8),
    type: "short_answer" as const,
    question: s.q,
    answer: s.a,
    points: 1,
  }));
}

function generateFractionSimplification(count: number): Problem[] {
  const fractions: [number, number][] = [
    [2, 4], [3, 6], [4, 8], [6, 9], [4, 6], [6, 10], [8, 12], [9, 12],
    [10, 15], [6, 8], [15, 20], [12, 16], [4, 10], [6, 14], [10, 12],
  ];

  return shuffleArray(fractions).slice(0, count).map(([n, d]) => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const g = gcd(n, d);
    return {
      id: nanoid(8),
      type: "arithmetic" as const,
      question: `Simplify ${n}/${d}`,
      answer: `${n / g}/${d / g}`,
      points: 1,
    };
  });
}

function generateFractionAddition(count: number): Problem[] {
  const pairs: [string, string, string][] = [
    ["1/4", "2/4", "3/4"],
    ["1/3", "1/3", "2/3"],
    ["2/5", "1/5", "3/5"],
    ["1/6", "3/6", "4/6 = 2/3"],
    ["3/8", "1/8", "4/8 = 1/2"],
    ["1/2", "1/4", "3/4"],
    ["1/3", "1/6", "1/2"],
    ["2/3", "1/6", "5/6"],
    ["3/4", "1/8", "7/8"],
    ["1/2", "1/3", "5/6"],
  ];

  return shuffleArray(pairs).slice(0, count).map(([a, b, ans]) => ({
    id: nanoid(8),
    type: "arithmetic" as const,
    question: `${a} + ${b} =`,
    answer: ans,
    points: 1,
  }));
}

function generateFractionComparison(count: number): Problem[] {
  const pairs: [string, string, string][] = [
    ["1/2", "1/3", "1/2"],
    ["2/3", "3/5", "2/3"],
    ["3/4", "5/8", "3/4"],
    ["4/5", "7/10", "4/5"],
    ["2/3", "3/4", "3/4"],
    ["1/4", "1/3", "1/3"],
    ["5/6", "7/8", "7/8"],
    ["3/8", "2/5", "2/5"],
  ];

  return shuffleArray(pairs).slice(0, count).map(([a, b, larger]) => ({
    id: nanoid(8),
    type: "multiple_choice" as const,
    question: `Which fraction is larger: ${a} or ${b}?`,
    options: [a, b, "They are equal", "Cannot tell"],
    answer: larger === a ? a : b,
    points: 1,
  }));
}

function generatePercentages(count: number): Problem[] {
  const problems: Problem[] = [];
  const bases = [10, 20, 25, 50, 100, 200, 500];
  const pcts = [10, 15, 20, 25, 50, 75];

  for (const base of bases) {
    for (const pct of pcts) {
      const answer = (base * pct) / 100;
      problems.push({
        id: nanoid(8),
        type: "arithmetic",
        question: `What is ${pct}% of ${base}?`,
        answer,
        points: 1,
      });
    }
  }

  return shuffleArray(problems).slice(0, count);
}

function generateOneStepEquations(count: number): Problem[] {
  const problems: Problem[] = [];

  for (let x = 2; x <= 15; x++) {
    for (let a = 2; a <= 10; a++) {
      problems.push({
        id: nanoid(8),
        type: "arithmetic",
        question: `Solve: x + ${a} = ${x + a}`,
        answer: x,
        points: 1,
        explanation: `x = ${x + a} − ${a} = ${x}`,
      });
      problems.push({
        id: nanoid(8),
        type: "arithmetic",
        question: `Solve: ${a}x = ${a * x}`,
        answer: x,
        points: 1,
        explanation: `x = ${a * x} ÷ ${a} = ${x}`,
      });
    }
  }

  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

function generateTwoStepEquations(count: number): Problem[] {
  const problems: Problem[] = [];

  for (let x = 2; x <= 12; x++) {
    for (const [a, b] of [[2, 3], [3, 4], [4, 5], [2, 7], [5, 3]]) {
      problems.push({
        id: nanoid(8),
        type: "arithmetic",
        question: `Solve: ${a}x + ${b} = ${a * x + b}`,
        answer: x,
        points: 1,
        explanation: `${a}x = ${a * x + b} − ${b} = ${a * x}, so x = ${x}`,
      });
      problems.push({
        id: nanoid(8),
        type: "arithmetic",
        question: `Solve: ${a}x − ${b} = ${a * x - b}`,
        answer: x,
        points: 1,
      });
    }
  }

  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

function generateCounting(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let n = 1; n <= 50; n++) {
    problems.push({
      id: nanoid(8),
      type: "fill_blank",
      question: `What number comes after ${n}?`,
      answer: n + 1,
      points: 1,
    });
    if (n > 1) {
      problems.push({
        id: nanoid(8),
        type: "fill_blank",
        question: `What number comes before ${n}?`,
        answer: n - 1,
        points: 1,
      });
    }
  }
  return shuffleArray(problems).slice(0, count);
}

// ─────────────────────────────────────────────
// READING GENERATOR
// ─────────────────────────────────────────────

const readingPassages: Record<string, { passage: string; questions: Problem[] }> = {
  "main idea": {
    passage: `Honey bees are one of the most important insects on Earth. A single hive can contain up to 60,000 bees, all working together. The queen bee lays up to 2,000 eggs per day. Worker bees gather nectar from flowers and turn it into honey. A single bee produces only one twelfth of a teaspoon of honey in its entire lifetime. Bees communicate using a dance called the "waggle dance," which tells other bees the direction and distance of food.`,
    questions: [
      {
        id: nanoid(8), type: "multiple_choice",
        question: "What is the main idea of this passage?",
        options: ["Bees are dangerous", "Honey bees are important insects that work together", "All bees make honey", "Bees only live in hives"],
        answer: "Honey bees are important insects that work together", points: 1,
      },
      {
        id: nanoid(8), type: "multiple_choice",
        question: "How much honey does one bee make in its lifetime?",
        options: ["One jar", "One teaspoon", "One twelfth of a teaspoon", "One cup"],
        answer: "One twelfth of a teaspoon", points: 1,
      },
      {
        id: nanoid(8), type: "short_answer",
        question: "What is the waggle dance used for?",
        answer: "To tell other bees the direction and distance of food", points: 1,
      },
    ],
  },
  "cause and effect": {
    passage: `Every autumn, millions of monarch butterflies migrate up to 5,000 kilometres from Canada and the United States to Mexico. They navigate using the sun and Earth's magnetic field. The migration is threatened by climate change and loss of milkweed — the only plant monarch caterpillars can eat. Conservation efforts include planting milkweed gardens across North America.`,
    questions: [
      {
        id: nanoid(8), type: "short_answer",
        question: "What causes the monarch butterfly migration to be threatened? Give two reasons.",
        answer: "Climate change and loss of milkweed habitat", points: 2,
      },
      {
        id: nanoid(8), type: "multiple_choice",
        question: "Why is milkweed important to monarch butterflies?",
        options: ["It helps them navigate", "It is the only plant their caterpillars can eat", "It provides shelter", "It attracts other insects"],
        answer: "It is the only plant their caterpillars can eat", points: 1,
      },
    ],
  },
};

function generateReadingProblems(skillName: string, count: number): Problem[] {
  const skill = skillName.toLowerCase();
  const key = Object.keys(readingPassages).find((k) => skill.includes(k)) ?? "main idea";
  const content = readingPassages[key];

  // Return passage as a "context" problem, then follow-up questions
  const problems: Problem[] = [
    {
      id: nanoid(8),
      type: "short_answer",
      question: `READ THIS PASSAGE:\n\n${content.passage}\n\nNow answer the questions below.`,
      answer: "(passage — no answer required)",
      points: 0,
    },
    ...content.questions,
  ];

  return problems.slice(0, count);
}

// ─────────────────────────────────────────────
// WRITING GENERATOR
// ─────────────────────────────────────────────

function generateWritingProblems(skillName: string, count: number): Problem[] {
  const skill = skillName.toLowerCase();

  if (skill.includes("noun") || skill.includes("verb") || skill.includes("adjective")) {
    return generateGrammarProblems(count);
  }
  if (skill.includes("punctuation") || skill.includes("capitalization")) {
    return generatePunctuationProblems(count);
  }
  if (skill.includes("sentence")) {
    return generateSentenceProblems(count);
  }
  if (skill.includes("paragraph") || skill.includes("topic")) {
    return generateParagraphProblems(count);
  }

  return generateGrammarProblems(count);
}

function generateGrammarProblems(count: number): Problem[] {
  const items = [
    { q: "Circle the noun: run / dog / quickly / blue", a: "dog", type: "short_answer" as const },
    { q: "Circle the verb: happy / table / jump / city", a: "jump", type: "short_answer" as const },
    { q: "Circle the adjective: school / eat / tall / swim", a: "tall", type: "short_answer" as const },
    { q: "Is 'beautiful' a noun, verb, or adjective?", a: "adjective", type: "multiple_choice" as const, opts: ["noun", "verb", "adjective", "adverb"] },
    { q: "Is 'run' a noun, verb, or adjective?", a: "verb", type: "multiple_choice" as const, opts: ["noun", "verb", "adjective", "adverb"] },
    { q: "Add an adjective: The _______ cat sat on the mat.", a: "(any adjective, e.g. fluffy)", type: "short_answer" as const },
    { q: "Write one noun that names a place.", a: "(any place noun)", type: "short_answer" as const },
    { q: "Write one action verb.", a: "(any action verb)", type: "short_answer" as const },
    { q: "Which word is a proper noun? (london / city / building / road)", a: "london", type: "short_answer" as const },
    { q: "Label each word: fast ___ / teacher ___ / laugh ___ (N, V, or Adj)", a: "Adj / N / V", type: "short_answer" as const },
  ];

  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8),
    type: item.type,
    question: item.q,
    options: item.opts,
    answer: item.a,
    points: 1,
  }));
}

function generatePunctuationProblems(count: number): Problem[] {
  const items = [
    { q: "Which sentence is correct? (a) i like dogs. (b) I like dogs.", a: "I like dogs." },
    { q: "Add the correct punctuation: Where are you going___", a: "Where are you going?" },
    { q: "Add the correct punctuation: Stop right there___", a: "Stop right there!" },
    { q: "Which uses a comma correctly? (a) I like cats and, dogs. (b) I like cats, and I like dogs.", a: "I like cats, and I like dogs." },
    { q: "Does this sentence need a capital letter? (my name is kai.)", a: "My name is Kai." },
    { q: "Add apostrophes where needed: Its the dogs bone.", a: "It's the dog's bone." },
    { q: "True or False: Every sentence must end with a period.", a: "False (can also end with ? or !)" },
    { q: "Write a question using correct punctuation.", a: "(any correctly punctuated question)" },
  ];

  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8),
    type: "short_answer" as const,
    question: item.q,
    answer: item.a,
    points: 1,
  }));
}

function generateSentenceProblems(count: number): Problem[] {
  const items = [
    {
      q: "Which is a complete sentence? (a) Running fast. (b) She ran to school.",
      a: "She ran to school.", type: "multiple_choice" as const,
      opts: ["Running fast.", "Because it rained.", "She ran to school.", "The big red."],
    },
    { q: "Fix this run-on: I like apples I eat them every day.", a: "I like apples. I eat them every day.", type: "short_answer" as const },
    { q: "Combine into one sentence: The dog ran. The dog barked.", a: "The dog ran and barked.", type: "short_answer" as const },
    { q: "What is a compound sentence? Give an example.", a: "Two simple sentences joined by a conjunction", type: "short_answer" as const },
    { q: "Add a conjunction: I wanted to play, ___ it was raining.", a: "but", type: "short_answer" as const },
    { q: "Is this a simple or compound sentence? 'She sang and danced.'", a: "simple", type: "short_answer" as const },
  ];

  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8),
    type: item.type ?? "short_answer",
    question: item.q,
    options: (item as any).opts,
    answer: item.a,
    points: 1,
  }));
}

function generateParagraphProblems(count: number): Problem[] {
  const items = [
    {
      q: "Which is the best topic sentence? (a) Dogs are good. (b) Dogs make excellent pets for many reasons. (c) I have a dog.",
      a: "Dogs make excellent pets for many reasons.",
      type: "multiple_choice" as const, opts: ["Dogs are good.", "Dogs make excellent pets for many reasons.", "I have a dog.", "Dogs bark."],
    },
    { q: "What does a topic sentence do?", a: "States the main idea of the paragraph", type: "short_answer" as const },
    { q: "What does a concluding sentence do?", a: "Wraps up or restates the main idea", type: "short_answer" as const },
    { q: "Write a topic sentence about your favourite sport.", a: "(any complete topic sentence)", type: "written_response" as const },
    { q: "Write a topic sentence about an animal you find interesting.", a: "(any complete topic sentence)", type: "written_response" as const },
    { q: "True or False: A paragraph should have only one idea.", a: "True", type: "short_answer" as const },
  ];

  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8),
    type: item.type,
    question: item.q,
    options: (item as any).opts,
    answer: item.a,
    points: 1,
  }));
}

// ─────────────────────────────────────────────
// SCIENCE GENERATOR
// ─────────────────────────────────────────────

function generateScienceProblems(skillName: string, count: number): Problem[] {
  const skill = skillName.toLowerCase();

  if (skill.includes("water cycle") || skill.includes("earth science")) {
    return generateWaterCycleProblems(count);
  }
  if (skill.includes("states of matter") || skill.includes("matter")) {
    return generateStatesOfMatterProblems(count);
  }
  if (skill.includes("food chain") || skill.includes("ecosystem")) {
    return generateFoodChainProblems(count);
  }
  if (skill.includes("cell") || skill.includes("biology")) {
    return generateBiologyProblems(count);
  }

  return generateStatesOfMatterProblems(count);
}

function generateWaterCycleProblems(count: number): Problem[] {
  const items = [
    { q: "What process turns liquid water into water vapor?", a: "Evaporation", type: "short_answer" as const },
    { q: "What is it called when water vapor turns into liquid droplets in the air?", a: "Condensation", type: "short_answer" as const },
    { q: "What do we call rain, snow, or hail falling from clouds?", a: "Precipitation", type: "short_answer" as const },
    { q: "What energy source drives the water cycle?", a: "The Sun", type: "short_answer" as const },
    { q: "Where does most evaporation on Earth come from?", a: "Oceans and large bodies of water", type: "short_answer" as const },
    { q: "True or False: Water vapour is invisible.", a: "True", type: "short_answer" as const },
    { q: "What is runoff?", a: "Water that flows over the land surface into rivers and streams", type: "short_answer" as const },
    {
      q: "Which process forms clouds?", a: "Condensation", type: "multiple_choice" as const,
      opts: ["Evaporation", "Condensation", "Precipitation", "Runoff"],
    },
  ];

  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: item.type, question: item.q,
    options: (item as any).opts, answer: item.a, points: 1,
  }));
}

function generateStatesOfMatterProblems(count: number): Problem[] {
  const items = [
    {
      q: "Which state of matter has a definite shape and volume?", a: "Solid",
      type: "multiple_choice" as const, opts: ["Gas", "Liquid", "Plasma", "Solid"],
    },
    { q: "What is it called when a liquid changes to a gas?", a: "Evaporation / vaporization", type: "short_answer" as const },
    { q: "What is it called when a gas changes directly to a solid?", a: "Deposition (e.g., frost)", type: "short_answer" as const },
    { q: "In which state are particles farthest apart?", a: "Gas", type: "short_answer" as const },
    { q: "Water freezes at ___ °C.", a: "0", type: "fill_blank" as const },
    { q: "Water boils at ___ °C.", a: "100", type: "fill_blank" as const },
    {
      q: "What happens when a solid is heated enough?", a: "It melts into a liquid",
      type: "multiple_choice" as const, opts: ["It evaporates", "It melts into a liquid", "It becomes a gas immediately", "Nothing happens"],
    },
    { q: "Name one real-world example of sublimation.", a: "Dry ice evaporating / frost on windows", type: "short_answer" as const },
    { q: "True or False: A gas has a definite volume.", a: "False", type: "short_answer" as const },
    { q: "What state change occurs when water vapour hits a cold window?", a: "Condensation", type: "short_answer" as const },
  ];

  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: item.type, question: item.q,
    options: (item as any).opts, answer: item.a, points: 1,
  }));
}

function generateFoodChainProblems(count: number): Problem[] {
  const items = [
    { q: "What is a producer in a food chain?", a: "An organism that makes its own food (plants)", type: "short_answer" as const },
    { q: "What is a consumer?", a: "An organism that eats other organisms", type: "short_answer" as const },
    { q: "In the chain: grass → rabbit → fox, what role does the rabbit play?", a: "Primary consumer / herbivore", type: "short_answer" as const },
    { q: "What is the ultimate source of energy for most food chains?", a: "The Sun", type: "short_answer" as const },
    { q: "What is a decomposer? Give one example.", a: "Breaks down dead matter — e.g. fungi, bacteria", type: "short_answer" as const },
    { q: "True or False: Energy increases as you move up a food chain.", a: "False (energy decreases)", type: "short_answer" as const },
    {
      q: "What would happen if all plants in an ecosystem disappeared?",
      a: "Herbivores would have no food and die, then carnivores would also die",
      type: "written_response" as const,
    },
    {
      q: "A herbivore eats:", a: "Only plants", type: "multiple_choice" as const,
      opts: ["Only plants", "Only animals", "Both plants and animals", "Neither"],
    },
  ];

  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: item.type, question: item.q,
    options: (item as any).opts, answer: item.a, points: 1,
  }));
}

function generateBiologyProblems(count: number): Problem[] {
  const items = [
    { q: "What is the 'powerhouse of the cell'?", a: "Mitochondria", type: "short_answer" as const },
    { q: "What does the nucleus do?", a: "Controls cell activities and contains DNA", type: "short_answer" as const },
    { q: "What is the difference between plant and animal cells?", a: "Plant cells have a cell wall and chloroplasts; animal cells do not", type: "short_answer" as const },
    { q: "What process do plants use to make food?", a: "Photosynthesis", type: "short_answer" as const },
    { q: "What gas do plants take in during photosynthesis?", a: "Carbon dioxide (CO₂)", type: "short_answer" as const },
    { q: "What gas do plants release during photosynthesis?", a: "Oxygen (O₂)", type: "short_answer" as const },
    { q: "True or False: All living things are made of cells.", a: "True", type: "short_answer" as const },
    {
      q: "Which organelle contains chlorophyll?", a: "Chloroplast",
      type: "multiple_choice" as const, opts: ["Nucleus", "Mitochondria", "Chloroplast", "Ribosome"],
    },
  ];

  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: item.type, question: item.q,
    options: (item as any).opts, answer: item.a, points: 1,
  }));
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deduplicateProblems(problems: Problem[]): Problem[] {
  const seen = new Set<string>();
  return problems.filter((p) => {
    if (seen.has(p.question)) return false;
    seen.add(p.question);
    return true;
  });
}
