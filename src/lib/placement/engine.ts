// src/lib/placement/engine.ts
// Adaptive placement test engine

import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import type { PlacementQuestion, PlacementResult } from "@/types";

// ─────────────────────────────────────────────
// Question banks per subject — calibrated by difficulty (0.1 easiest – 3.0 hardest)
// ─────────────────────────────────────────────

export const placementBanks: Record<string, PlacementQuestion[]> = {
  MATH: [
    // M1 — Counting (0.1-0.3)
    { id: "m-m1-1", subjectSlug: "MATH", levelCode: "M1", difficulty: 0.2, question: "What is 2 + 3?", options: ["4", "5", "6", "7"], correctIndex: 1, skillTag: "early-addition" },
    { id: "m-m1-2", subjectSlug: "MATH", levelCode: "M1", difficulty: 0.3, question: "Which number comes after 17?", options: ["16", "18", "19", "20"], correctIndex: 1, skillTag: "counting" },
    // M3 — Addition (0.4-0.6)
    { id: "m-m3-1", subjectSlug: "MATH", levelCode: "M3", difficulty: 0.5, question: "What is 7 + 8?", options: ["13", "14", "15", "16"], correctIndex: 2, skillTag: "addition-10" },
    { id: "m-m3-2", subjectSlug: "MATH", levelCode: "M3", difficulty: 0.6, question: "What is 14 + 7?", options: ["19", "20", "21", "22"], correctIndex: 2, skillTag: "addition-20" },
    // M4 — Add/subtract (0.7-0.9)
    { id: "m-m4-1", subjectSlug: "MATH", levelCode: "M4", difficulty: 0.8, question: "What is 25 + 38?", options: ["53", "63", "73", "62"], correctIndex: 1, skillTag: "2-digit-add" },
    { id: "m-m4-2", subjectSlug: "MATH", levelCode: "M4", difficulty: 0.9, question: "What is 42 − 17?", options: ["25", "26", "35", "29"], correctIndex: 0, skillTag: "subtraction" },
    // M5 — Multiplication (1.0-1.3)
    { id: "m-m5-1", subjectSlug: "MATH", levelCode: "M5", difficulty: 1.0, question: "What is 6 × 7?", options: ["36", "42", "48", "54"], correctIndex: 1, skillTag: "multiplication" },
    { id: "m-m5-2", subjectSlug: "MATH", levelCode: "M5", difficulty: 1.1, question: "What is 9 × 8?", options: ["63", "64", "72", "81"], correctIndex: 2, skillTag: "multiplication" },
    { id: "m-m5-3", subjectSlug: "MATH", levelCode: "M5", difficulty: 1.2, question: "What is 12 × 9?", options: ["98", "108", "99", "118"], correctIndex: 1, skillTag: "multiplication" },
    // M6 — Division (1.3-1.5)
    { id: "m-m6-1", subjectSlug: "MATH", levelCode: "M6", difficulty: 1.4, question: "What is 63 ÷ 7?", options: ["7", "8", "9", "10"], correctIndex: 2, skillTag: "division" },
    { id: "m-m6-2", subjectSlug: "MATH", levelCode: "M6", difficulty: 1.5, question: "What is 96 ÷ 8?", options: ["10", "11", "12", "13"], correctIndex: 2, skillTag: "division" },
    // M7 — Fractions (1.6-1.8)
    { id: "m-m7-1", subjectSlug: "MATH", levelCode: "M7", difficulty: 1.6, question: "What is ½ + ¼?", options: ["²⁄₄", "³⁄₄", "⁴⁄₆", "²⁄₃"], correctIndex: 1, skillTag: "fractions" },
    { id: "m-m7-2", subjectSlug: "MATH", levelCode: "M7", difficulty: 1.7, question: "Simplify ⁶⁄₈.", options: ["²⁄₄", "³⁄₄", "¹⁄₂", "⁴⁄₆"], correctIndex: 1, skillTag: "fractions" },
    // M9 — Percentages (1.9-2.1)
    { id: "m-m9-1", subjectSlug: "MATH", levelCode: "M9", difficulty: 2.0, question: "What is 15% of 200?", options: ["20", "25", "30", "35"], correctIndex: 2, skillTag: "percentages" },
    // M10 — Pre-algebra (2.2-2.4)
    { id: "m-m10-1", subjectSlug: "MATH", levelCode: "M10", difficulty: 2.3, question: "Solve: 3x − 5 = 16", options: ["x=5", "x=6", "x=7", "x=8"], correctIndex: 2, skillTag: "algebra" },
    // M16 — Algebra II (2.5-2.7)
    { id: "m-m16-1", subjectSlug: "MATH", levelCode: "M16", difficulty: 2.6, question: "Expand: (x + 3)(x − 2)", options: ["x²+x−6", "x²−x−6", "x²+5x−6", "x²+x+6"], correctIndex: 0, skillTag: "algebra-II" },
    // M15 — Trig (2.7-2.9)
    { id: "m-m15-1", subjectSlug: "MATH", levelCode: "M15", difficulty: 2.8, question: "What is sin(90°)?", options: ["0", "0.5", "1", "undefined"], correctIndex: 2, skillTag: "trig" },
  ],
  READING: [
    { id: "r-r2-1", subjectSlug: "READING", levelCode: "R2", difficulty: 0.4, question: "Which word rhymes with 'cake'?", options: ["car", "bake", "cup", "ball"], correctIndex: 1, skillTag: "phonics" },
    { id: "r-r3-1", subjectSlug: "READING", levelCode: "R3", difficulty: 0.7, question: "Which is a sight word?", options: ["xylo", "the", "qaz", "wrx"], correctIndex: 1, skillTag: "sight-words" },
    { id: "r-r4-1", subjectSlug: "READING", levelCode: "R4", difficulty: 1.1, question: "What does 'enormous' mean?", options: ["Very small", "Very large", "Very fast", "Very old"], correctIndex: 1, skillTag: "vocab" },
    { id: "r-r5-1", subjectSlug: "READING", levelCode: "R5", difficulty: 1.3, question: "What is the purpose of a topic sentence?", options: ["End paragraph", "Introduce main idea", "Give example", "Ask question"], correctIndex: 1, skillTag: "comprehension" },
    { id: "r-r6-1", subjectSlug: "READING", levelCode: "R6", difficulty: 1.7, question: "Synonym for 'swift'?", options: ["Slow", "Loud", "Fast", "Heavy"], correctIndex: 2, skillTag: "synonyms" },
    { id: "r-r8-1", subjectSlug: "READING", levelCode: "R8", difficulty: 2.1, question: "'The sun smiled down on us.' This is:", options: ["Simile", "Metaphor", "Personification", "Alliteration"], correctIndex: 2, skillTag: "figurative" },
    { id: "r-r9-1", subjectSlug: "READING", levelCode: "R9", difficulty: 2.5, question: "What is the author's tone?", options: ["Loudness", "Writer's attitude/feeling", "Story length", "Number of characters"], correctIndex: 1, skillTag: "analysis" },
  ],
  WRITING: [
    { id: "w-w2-1", subjectSlug: "WRITING", levelCode: "W2", difficulty: 0.8, question: "Which word is a noun?", options: ["Run", "Happy", "Dog", "Quickly"], correctIndex: 2, skillTag: "parts-of-speech" },
    { id: "w-w3-1", subjectSlug: "WRITING", levelCode: "W3", difficulty: 1.1, question: "Which sentence uses a comma correctly?", options: ["I like cats and, dogs.", "I like cats, and I like dogs.", "I, like cats.", "I like, cats."], correctIndex: 1, skillTag: "punctuation" },
    { id: "w-w3-2", subjectSlug: "WRITING", levelCode: "W3", difficulty: 1.2, question: "Which is a complete sentence?", options: ["Running fast.", "Because it rained.", "She ran to school.", "The big red."], correctIndex: 2, skillTag: "sentences" },
    { id: "w-w5-1", subjectSlug: "WRITING", levelCode: "W5", difficulty: 1.7, question: "What does a concluding sentence do?", options: ["Starts new idea", "Gives examples", "Wraps up paragraph", "Introduces topic"], correctIndex: 2, skillTag: "paragraphs" },
    { id: "w-w8-1", subjectSlug: "WRITING", levelCode: "W8", difficulty: 2.3, question: "In persuasive writing, what is a counterargument?", options: ["Your main claim", "Evidence", "Opposing view you address", "Your conclusion"], correctIndex: 2, skillTag: "persuasive" },
  ],
  SCIENCE: [
    { id: "s-s1-1", subjectSlug: "SCIENCE", levelCode: "S1", difficulty: 0.6, question: "What do plants need to make food?", options: ["Soil only", "Sunlight, water, CO₂", "Oxygen only", "Water only"], correctIndex: 1, skillTag: "life-sci" },
    { id: "s-s1-2", subjectSlug: "SCIENCE", levelCode: "S1", difficulty: 0.9, question: "What process turns liquid water to vapor?", options: ["Condensation", "Precipitation", "Evaporation", "Runoff"], correctIndex: 2, skillTag: "earth-sci" },
    { id: "s-s4-1", subjectSlug: "SCIENCE", levelCode: "S4", difficulty: 1.4, question: "Which state has definite shape and volume?", options: ["Gas", "Liquid", "Plasma", "Solid"], correctIndex: 3, skillTag: "matter" },
    { id: "s-s4-2", subjectSlug: "SCIENCE", levelCode: "S4", difficulty: 1.5, question: "What force pulls objects to Earth?", options: ["Friction", "Magnetism", "Gravity", "Tension"], correctIndex: 2, skillTag: "physics" },
    { id: "s-s5-1", subjectSlug: "SCIENCE", levelCode: "S5", difficulty: 1.9, question: "What is the powerhouse of the cell?", options: ["Nucleus", "Cell wall", "Mitochondria", "Ribosome"], correctIndex: 2, skillTag: "biology" },
    { id: "s-s6-1", subjectSlug: "SCIENCE", levelCode: "S6", difficulty: 2.4, question: "What bond shares electrons?", options: ["Ionic", "Covalent", "Hydrogen", "Metallic"], correctIndex: 1, skillTag: "chemistry" },
  ],
};

// ─────────────────────────────────────────────
// Adaptive engine
// ─────────────────────────────────────────────

const MAX_QUESTIONS_PER_SUBJECT = 12;
const MIN_QUESTIONS_PER_SUBJECT = 8;
const CONFIDENCE_THRESHOLD = 0.85;

export function pickNextQuestion(
  subjectSlug: string,
  currentDifficulty: number,
  alreadyAskedIds: string[]
): PlacementQuestion | null {
  const pool = (placementBanks[subjectSlug] ?? []).filter(
    (q) => !alreadyAskedIds.includes(q.id)
  );
  if (!pool.length) return null;

  // Find question closest to current difficulty
  const sorted = [...pool].sort(
    (a, b) =>
      Math.abs(a.difficulty - currentDifficulty) -
      Math.abs(b.difficulty - currentDifficulty)
  );
  return sorted[0];
}

export function adjustDifficulty(
  currentDifficulty: number,
  wasCorrect: boolean,
  question: PlacementQuestion
): number {
  // CAT-style: if correct, push up; if wrong, push down
  // Bigger swing on early questions, smaller on later
  const swing = wasCorrect ? 0.4 : -0.5;
  const newDifficulty = Math.max(0.1, Math.min(3.0, currentDifficulty + swing));
  return newDifficulty;
}

export function calculateConfidence(
  questionsAnswered: number,
  correctCount: number,
  abilityEstimate: number
): number {
  // Edge case: no questions answered means no confidence
  if (questionsAnswered === 0) return 0;
  // Simple confidence model: more questions + consistent results = higher confidence
  const questionFactor = Math.min(questionsAnswered / MAX_QUESTIONS_PER_SUBJECT, 1);
  const consistencyFactor = Math.abs(correctCount / questionsAnswered - 0.5) * 2; // 0.5 hit-rate = max uncertainty
  return Math.min(questionFactor * 0.6 + consistencyFactor * 0.4, 1);
}

export function shouldTerminate(
  questionsAnswered: number,
  confidence: number
): boolean {
  if (questionsAnswered >= MAX_QUESTIONS_PER_SUBJECT) return true;
  if (questionsAnswered >= MIN_QUESTIONS_PER_SUBJECT && confidence >= CONFIDENCE_THRESHOLD) return true;
  return false;
}

export async function calculatePlacement(
  subjectSlug: string,
  finalDifficulty: number,
  correctCount: number,
  totalQuestions: number
): Promise<PlacementResult> {
  const subject = await db.subject.findUnique({
    where: { slug: subjectSlug as any },
    include: {
      levels: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!subject) throw new Error("Subject not found");

  // Map ability estimate → level
  // Each level has an implied difficulty range from sortOrder
  const maxOrder = Math.max(...subject.levels.map((l) => l.sortOrder));
  const accuracyPct = (correctCount / totalQuestions) * 100;

  // Blend final difficulty + accuracy into a placement score
  const placementScore = finalDifficulty * 0.7 + (accuracyPct / 100) * 2 * 0.3;
  const targetOrder = Math.round((placementScore / 3.0) * maxOrder);

  // Find closest level
  const closest = subject.levels.reduce((best, lvl) =>
    Math.abs(lvl.sortOrder - targetOrder) < Math.abs(best.sortOrder - targetOrder)
      ? lvl
      : best
  );

  const confidence = calculateConfidence(totalQuestions, correctCount, finalDifficulty);

  return {
    subjectSlug,
    subjectName: subject.name,
    assignedLevelCode: closest.code,
    assignedLevelName: closest.name,
    confidenceScore: confidence,
    correctCount,
    totalQuestions,
    accuracyPct,
  };
}

export const PLACEMENT_CONSTANTS = {
  MAX_QUESTIONS_PER_SUBJECT,
  MIN_QUESTIONS_PER_SUBJECT,
  CONFIDENCE_THRESHOLD,
};

export function getQuestionById(subjectSlug: string, questionId: string): PlacementQuestion | null {
  return (placementBanks[subjectSlug] ?? []).find((q) => q.id === questionId) ?? null;
}
