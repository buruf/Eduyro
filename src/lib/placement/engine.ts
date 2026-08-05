// src/lib/placement/engine.ts
// Adaptive placement test engine — fully expanded
// 25 questions per subject, covering all levels M1-M18, R1-R9, W1-W8, S1-S7

import { db } from "@/lib/db";
import type { PlacementQuestion, PlacementResult } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// PLACEMENT CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MAX_QUESTIONS_PER_SUBJECT = 25;
const MIN_QUESTIONS_PER_SUBJECT = 15;
const CONFIDENCE_THRESHOLD = 0.85;

export const PLACEMENT_CONSTANTS = {
  MAX_QUESTIONS_PER_SUBJECT,
  MIN_QUESTIONS_PER_SUBJECT,
  CONFIDENCE_THRESHOLD,
};

// ─────────────────────────────────────────────────────────────────────────────
// MATH QUESTION BANK — M1 through M18
// Difficulty 0.1 (easiest) → 3.0 (hardest)
// Each level gets ~2-3 questions at the right difficulty band
// ─────────────────────────────────────────────────────────────────────────────

export const placementBanks: Record<string, PlacementQuestion[]> = {
  MATH: [
    // ── M1: Early Counting (0.1–0.3) ──
    { id: "m-m1-1", subjectSlug: "MATH", levelCode: "M1", difficulty: 0.1, question: "How many fingers do you have on one hand?", options: ["3", "4", "5", "6"], correctIndex: 2, skillTag: "counting" },
    { id: "m-m1-2", subjectSlug: "MATH", levelCode: "M1", difficulty: 0.2, question: "What number comes after 7?", options: ["6", "8", "9", "10"], correctIndex: 1, skillTag: "counting" },
    { id: "m-m1-3", subjectSlug: "MATH", levelCode: "M1", difficulty: 0.3, question: "Which number is bigger: 4 or 7?", options: ["4", "7", "They are equal", "Cannot tell"], correctIndex: 1, skillTag: "counting" },

    // ── M2: Number Sense (0.35–0.5) ──
    { id: "m-m2-1", subjectSlug: "MATH", levelCode: "M2", difficulty: 0.35, question: "What number comes after 19?", options: ["18", "20", "21", "22"], correctIndex: 1, skillTag: "number-sense" },
    { id: "m-m2-2", subjectSlug: "MATH", levelCode: "M2", difficulty: 0.4, question: "Which is greater: 35 or 53?", options: ["35", "53", "Equal", "Cannot tell"], correctIndex: 1, skillTag: "number-sense" },
    { id: "m-m2-3", subjectSlug: "MATH", levelCode: "M2", difficulty: 0.5, question: "What pattern comes next: 2, 4, 6, ___?", options: ["7", "8", "9", "10"], correctIndex: 1, skillTag: "number-patterns" },

    // ── M3: Addition Within Ten (0.55–0.7) ──
    { id: "m-m3-1", subjectSlug: "MATH", levelCode: "M3", difficulty: 0.55, question: "What is 3 + 4?", options: ["6", "7", "8", "9"], correctIndex: 1, skillTag: "addition-5" },
    { id: "m-m3-2", subjectSlug: "MATH", levelCode: "M3", difficulty: 0.6, question: "What is 6 + 7?", options: ["11", "12", "13", "14"], correctIndex: 2, skillTag: "addition-10" },
    { id: "m-m3-3", subjectSlug: "MATH", levelCode: "M3", difficulty: 0.7, question: "What is 8 + 5?", options: ["12", "13", "14", "15"], correctIndex: 1, skillTag: "addition-10" },

    // ── M4: Adding & Subtracting (0.75–0.9) ──
    { id: "m-m4-1", subjectSlug: "MATH", levelCode: "M4", difficulty: 0.75, question: "What is 24 + 13?", options: ["35", "36", "37", "38"], correctIndex: 2, skillTag: "2-digit-add" },
    { id: "m-m4-2", subjectSlug: "MATH", levelCode: "M4", difficulty: 0.8, question: "What is 47 − 19?", options: ["26", "27", "28", "29"], correctIndex: 2, skillTag: "subtraction" },
    { id: "m-m4-3", subjectSlug: "MATH", levelCode: "M4", difficulty: 0.9, question: "What is 63 + 28?", options: ["89", "90", "91", "92"], correctIndex: 2, skillTag: "2-digit-add" },

    // ── M5: Multiplication Fluency (0.95–1.2) ──
    { id: "m-m5-1", subjectSlug: "MATH", levelCode: "M5", difficulty: 0.95, question: "What is 3 × 5?", options: ["12", "14", "15", "16"], correctIndex: 2, skillTag: "multiplication" },
    { id: "m-m5-2", subjectSlug: "MATH", levelCode: "M5", difficulty: 1.0, question: "What is 7 × 8?", options: ["54", "56", "58", "64"], correctIndex: 1, skillTag: "multiplication" },
    { id: "m-m5-3", subjectSlug: "MATH", levelCode: "M5", difficulty: 1.1, question: "What is 9 × 9?", options: ["72", "81", "82", "89"], correctIndex: 1, skillTag: "multiplication" },
    { id: "m-m5-4", subjectSlug: "MATH", levelCode: "M5", difficulty: 1.2, question: "What is 12 × 7?", options: ["74", "82", "84", "86"], correctIndex: 2, skillTag: "multiplication" },

    // ── M6: Division Foundations (1.25–1.45) ──
    { id: "m-m6-1", subjectSlug: "MATH", levelCode: "M6", difficulty: 1.25, question: "What is 36 ÷ 6?", options: ["5", "6", "7", "8"], correctIndex: 1, skillTag: "division" },
    { id: "m-m6-2", subjectSlug: "MATH", levelCode: "M6", difficulty: 1.35, question: "What is 63 ÷ 7?", options: ["7", "8", "9", "10"], correctIndex: 2, skillTag: "division" },
    { id: "m-m6-3", subjectSlug: "MATH", levelCode: "M6", difficulty: 1.45, question: "What is 72 ÷ 8?", options: ["7", "8", "9", "10"], correctIndex: 2, skillTag: "division" },

    // ── M7: Fractions (1.5–1.7) ──
    { id: "m-m7-1", subjectSlug: "MATH", levelCode: "M7", difficulty: 1.5, question: "Which fraction is bigger: 1/2 or 1/4?", options: ["1/4", "1/2", "Equal", "Cannot tell"], correctIndex: 1, skillTag: "fractions" },
    { id: "m-m7-2", subjectSlug: "MATH", levelCode: "M7", difficulty: 1.6, question: "What is 1/2 + 1/4?", options: ["2/6", "3/4", "2/4", "1/6"], correctIndex: 1, skillTag: "fractions" },
    { id: "m-m7-3", subjectSlug: "MATH", levelCode: "M7", difficulty: 1.7, question: "Simplify 6/8.", options: ["3/4", "2/3", "4/6", "1/2"], correctIndex: 0, skillTag: "fractions" },

    // ── M8: Decimals & Percentages (1.75–1.9) ──
    { id: "m-m8-1", subjectSlug: "MATH", levelCode: "M8", difficulty: 1.75, question: "What is 0.5 + 0.3?", options: ["0.7", "0.8", "0.9", "1.0"], correctIndex: 1, skillTag: "decimals" },
    { id: "m-m8-2", subjectSlug: "MATH", levelCode: "M8", difficulty: 1.8, question: "What is 25% of 80?", options: ["15", "20", "25", "30"], correctIndex: 1, skillTag: "percentages" },
    { id: "m-m8-3", subjectSlug: "MATH", levelCode: "M8", difficulty: 1.9, question: "What is 1.25 × 4?", options: ["4.5", "5.0", "5.5", "6.0"], correctIndex: 1, skillTag: "decimals" },

    // ── M9: Ratios & Proportions (1.95–2.1) ──
    { id: "m-m9-1", subjectSlug: "MATH", levelCode: "M9", difficulty: 1.95, question: "A ratio is 3:4. What is the equivalent ratio with 12 on the left?", options: ["12:13", "12:15", "12:16", "12:18"], correctIndex: 2, skillTag: "ratios" },
    { id: "m-m9-2", subjectSlug: "MATH", levelCode: "M9", difficulty: 2.0, question: "If 5 apples cost $2, how much do 15 apples cost?", options: ["$4", "$5", "$6", "$8"], correctIndex: 2, skillTag: "proportions" },
    { id: "m-m9-3", subjectSlug: "MATH", levelCode: "M9", difficulty: 2.1, question: "A car travels 60 km in 1 hour. How far does it travel in 2.5 hours?", options: ["120km", "140km", "150km", "160km"], correctIndex: 2, skillTag: "unit-rates" },

    // ── M10: Pre-Algebra (2.15–2.3) ──
    { id: "m-m10-1", subjectSlug: "MATH", levelCode: "M10", difficulty: 2.15, question: "Solve: x + 9 = 14", options: ["x=3", "x=4", "x=5", "x=6"], correctIndex: 2, skillTag: "one-step-eq" },
    { id: "m-m10-2", subjectSlug: "MATH", levelCode: "M10", difficulty: 2.2, question: "Solve: 2x − 3 = 11", options: ["x=5", "x=6", "x=7", "x=8"], correctIndex: 2, skillTag: "two-step-eq" },
    { id: "m-m10-3", subjectSlug: "MATH", levelCode: "M10", difficulty: 2.3, question: "Solve: 3x + 5 = 20", options: ["x=4", "x=5", "x=6", "x=7"], correctIndex: 1, skillTag: "two-step-eq" },

    // ── M11: Linear Equations (2.35–2.5) ──
    { id: "m-m11-1", subjectSlug: "MATH", levelCode: "M11", difficulty: 2.35, question: "What is the slope of y = 3x + 2?", options: ["2", "3", "5", "1/3"], correctIndex: 1, skillTag: "slope" },
    { id: "m-m11-2", subjectSlug: "MATH", levelCode: "M11", difficulty: 2.4, question: "What is the y-intercept of y = 2x − 5?", options: ["2", "5", "-5", "-2"], correctIndex: 2, skillTag: "intercept" },
    { id: "m-m11-3", subjectSlug: "MATH", levelCode: "M11", difficulty: 2.5, question: "Solve the system: x + y = 10 and x − y = 2. What is x?", options: ["4", "5", "6", "7"], correctIndex: 2, skillTag: "systems" },

    // ── M12: Polynomials (2.55–2.65) ──
    { id: "m-m12-1", subjectSlug: "MATH", levelCode: "M12", difficulty: 2.55, question: "Add: (3x² + 2x) + (x² − 5x)", options: ["4x²−3x", "2x²−3x", "4x²+7x", "4x²−7x"], correctIndex: 0, skillTag: "polynomials" },
    { id: "m-m12-2", subjectSlug: "MATH", levelCode: "M12", difficulty: 2.6, question: "Factor: x² − 9", options: ["(x−3)²", "(x+3)(x−3)", "(x+9)(x−1)", "(x−9)(x+1)"], correctIndex: 1, skillTag: "factoring" },
    { id: "m-m12-3", subjectSlug: "MATH", levelCode: "M12", difficulty: 2.65, question: "Multiply: (x + 2)(x + 3)", options: ["x²+5x+5", "x²+5x+6", "x²+6x+6", "x²+6x+5"], correctIndex: 1, skillTag: "polynomials" },

    // ── M13: Quadratics (2.7–2.8) ──
    { id: "m-m13-1", subjectSlug: "MATH", levelCode: "M13", difficulty: 2.7, question: "Solve: x² − 5x + 6 = 0. What are the roots?", options: ["x=1,6", "x=2,3", "x=−2,−3", "x=−1,6"], correctIndex: 1, skillTag: "quadratics" },
    { id: "m-m13-2", subjectSlug: "MATH", levelCode: "M13", difficulty: 2.75, question: "Using the quadratic formula, solve x² + 4x + 4 = 0.", options: ["x=0", "x=−2", "x=2", "x=±2"], correctIndex: 1, skillTag: "quadratic-formula" },
    { id: "m-m13-3", subjectSlug: "MATH", levelCode: "M13", difficulty: 2.8, question: "What is the vertex of y = x² − 4x + 3?", options: ["(2,−1)", "(−2,1)", "(2,1)", "(4,3)"], correctIndex: 0, skillTag: "parabolas" },

    // ── M14: Functions (2.82–2.88) ──
    { id: "m-m14-1", subjectSlug: "MATH", levelCode: "M14", difficulty: 2.82, question: "If f(x) = 2x + 1, what is f(3)?", options: ["5", "6", "7", "8"], correctIndex: 2, skillTag: "functions" },
    { id: "m-m14-2", subjectSlug: "MATH", levelCode: "M14", difficulty: 2.85, question: "What is the domain of f(x) = 1/x?", options: ["All real numbers", "All real numbers except 0", "x > 0", "x < 0"], correctIndex: 1, skillTag: "domain-range" },
    { id: "m-m14-3", subjectSlug: "MATH", levelCode: "M14", difficulty: 2.88, question: "If f(x) = 3x, what is the inverse function f⁻¹(x)?", options: ["x/3", "3/x", "x+3", "x−3"], correctIndex: 0, skillTag: "inverse-functions" },

    // ── M15: Trigonometry (2.9–2.95) ──
    { id: "m-m15-1", subjectSlug: "MATH", levelCode: "M15", difficulty: 2.9, question: "In a right triangle with opposite=3 and hypotenuse=5, what is sin(θ)?", options: ["3/4", "4/5", "3/5", "5/3"], correctIndex: 2, skillTag: "trig" },
    { id: "m-m15-2", subjectSlug: "MATH", levelCode: "M15", difficulty: 2.92, question: "What is cos(0°)?", options: ["0", "0.5", "1", "−1"], correctIndex: 2, skillTag: "trig" },
    { id: "m-m15-3", subjectSlug: "MATH", levelCode: "M15", difficulty: 2.95, question: "Which identity is correct?", options: ["sin²θ + cos²θ = 0", "sin²θ + cos²θ = 1", "sin²θ − cos²θ = 1", "sinθ × cosθ = 1"], correctIndex: 1, skillTag: "trig-identities" },

    // ── M16: Algebra II (2.96–2.97) ──
    { id: "m-m16-1", subjectSlug: "MATH", levelCode: "M16", difficulty: 2.96, question: "What is log₂(8)?", options: ["2", "3", "4", "6"], correctIndex: 1, skillTag: "logarithms" },
    { id: "m-m16-2", subjectSlug: "MATH", levelCode: "M16", difficulty: 2.97, question: "Simplify: e^(ln 5)", options: ["1", "5", "e", "ln5"], correctIndex: 1, skillTag: "exponential" },

    // ── M17: Pre-Calculus (2.98) ──
    { id: "m-m17-1", subjectSlug: "MATH", levelCode: "M17", difficulty: 2.98, question: "What is lim(x→0) of sin(x)/x?", options: ["0", "∞", "1", "undefined"], correctIndex: 2, skillTag: "limits" },
    { id: "m-m17-2", subjectSlug: "MATH", levelCode: "M17", difficulty: 2.99, question: "What is the sum of an infinite geometric series with a=1 and r=1/2?", options: ["1", "1.5", "2", "3"], correctIndex: 2, skillTag: "sequences" },

    // ── M18: Calculus (3.0) ──
    { id: "m-m18-1", subjectSlug: "MATH", levelCode: "M18", difficulty: 3.0, question: "What is the derivative of f(x) = x³?", options: ["x²", "2x²", "3x²", "3x³"], correctIndex: 2, skillTag: "derivatives" },
    { id: "m-m18-2", subjectSlug: "MATH", levelCode: "M18", difficulty: 3.0, question: "What is ∫2x dx?", options: ["x²", "x² + C", "2x² + C", "x + C"], correctIndex: 1, skillTag: "integrals" },
  ],

  READING: [
    // R1 — Letters & Sounds (0.1–0.3)
    { id: "r-r1-1", subjectSlug: "READING", levelCode: "R1", difficulty: 0.1, question: "Which letter makes the 'sss' sound?", options: ["B", "S", "T", "D"], correctIndex: 1, skillTag: "letter-sounds" },
    { id: "r-r1-2", subjectSlug: "READING", levelCode: "R1", difficulty: 0.2, question: "Which word starts with the letter 'M'?", options: ["Cat", "Dog", "Moon", "Sun"], correctIndex: 2, skillTag: "letter-sounds" },
    { id: "r-r1-3", subjectSlug: "READING", levelCode: "R1", difficulty: 0.3, question: "What sound does 'ch' make in 'chair'?", options: ["k", "sh", "ch", "s"], correctIndex: 2, skillTag: "letter-sounds" },

    // R2 — Phonics (0.4–0.6)
    { id: "r-r2-1", subjectSlug: "READING", levelCode: "R1", difficulty: 0.4, question: "Which word rhymes with 'cake'?", options: ["car", "bake", "cup", "ball"], correctIndex: 1, skillTag: "phonics" },
    { id: "r-r2-2", subjectSlug: "READING", levelCode: "R1", difficulty: 0.5, question: "Which word has a silent 'e' that makes the vowel say its name?", options: ["hat", "bit", "hope", "hot"], correctIndex: 2, skillTag: "phonics" },
    { id: "r-r2-3", subjectSlug: "READING", levelCode: "R1", difficulty: 0.6, question: "Which word contains a long vowel sound?", options: ["bit", "hot", "bike", "cup"], correctIndex: 2, skillTag: "phonics" },

    // R3 — Sight Words (0.65–0.8)
    { id: "r-r3-1", subjectSlug: "READING", levelCode: "R2", difficulty: 0.65, question: "Which is a common sight word?", options: ["xylo", "the", "qaz", "wrx"], correctIndex: 1, skillTag: "sight-words" },
    { id: "r-r3-2", subjectSlug: "READING", levelCode: "R2", difficulty: 0.75, question: "Which word is spelled correctly?", options: ["becaus", "because", "becauze", "becuse"], correctIndex: 1, skillTag: "sight-words" },
    { id: "r-r3-3", subjectSlug: "READING", levelCode: "R2", difficulty: 0.8, question: "Choose the correct word: 'She ___ going to the store.' (is/are/am)", options: ["are", "am", "is", "be"], correctIndex: 2, skillTag: "sight-words" },

    // R4 — Vocabulary (0.85–1.1)
    { id: "r-r4-1", subjectSlug: "READING", levelCode: "R8", difficulty: 0.85, question: "What does 'enormous' mean?", options: ["Very small", "Very large", "Very fast", "Very old"], correctIndex: 1, skillTag: "vocabulary" },
    { id: "r-r4-2", subjectSlug: "READING", levelCode: "R8", difficulty: 0.95, question: "What does the prefix 'un-' mean in 'unhappy'?", options: ["very", "not", "again", "before"], correctIndex: 1, skillTag: "vocabulary" },
    { id: "r-r4-3", subjectSlug: "READING", levelCode: "R8", difficulty: 1.1, question: "What does 'context clues' mean?", options: ["Dictionary words", "Hints in the text that help figure out word meaning", "The title of a book", "The author's name"], correctIndex: 1, skillTag: "context-clues" },

    // R5 — Comprehension (1.15–1.4)
    { id: "r-r5-1", subjectSlug: "READING", levelCode: "R13", difficulty: 1.15, question: "What is the purpose of a topic sentence?", options: ["End paragraph", "Introduce main idea", "Give example", "Ask question"], correctIndex: 1, skillTag: "comprehension" },
    { id: "r-r5-2", subjectSlug: "READING", levelCode: "R13", difficulty: 1.3, question: "Read: 'The dog barked all night. The neighbors could not sleep.' What is the effect?", options: ["Dog was hungry", "Neighbors lost sleep", "Dog was happy", "Neighbors barked"], correctIndex: 1, skillTag: "cause-effect" },
    { id: "r-r5-3", subjectSlug: "READING", levelCode: "R13", difficulty: 1.4, question: "What does 'main idea' mean in a passage?", options: ["The first sentence", "The most important point", "The last sentence", "A supporting detail"], correctIndex: 1, skillTag: "main-idea" },

    // R6 — Literary Devices (1.5–1.8)
    { id: "r-r6-1", subjectSlug: "READING", levelCode: "R19", difficulty: 1.5, question: "What is a synonym for 'swift'?", options: ["Slow", "Loud", "Fast", "Heavy"], correctIndex: 2, skillTag: "synonyms" },
    { id: "r-r6-2", subjectSlug: "READING", levelCode: "R19", difficulty: 1.65, question: "'Her smile was a ray of sunshine.' This is an example of:", options: ["Simile", "Metaphor", "Alliteration", "Onomatopoeia"], correctIndex: 1, skillTag: "figurative" },
    { id: "r-r6-3", subjectSlug: "READING", levelCode: "R19", difficulty: 1.8, question: "'The wind whispered through the trees.' This is an example of:", options: ["Simile", "Metaphor", "Personification", "Hyperbole"], correctIndex: 2, skillTag: "figurative" },

    // R7 — Text Analysis (1.85–2.2)
    { id: "r-r7-1", subjectSlug: "READING", levelCode: "R20", difficulty: 1.85, question: "The sun smiled down on us — this uses which device?", options: ["Simile", "Metaphor", "Personification", "Alliteration"], correctIndex: 2, skillTag: "analysis" },
    { id: "r-r7-2", subjectSlug: "READING", levelCode: "R20", difficulty: 2.0, question: "What is the difference between 'theme' and 'topic'?", options: ["They are the same", "Theme is the subject; topic is the message", "Topic is the subject; theme is the deeper message", "Neither exists in fiction"], correctIndex: 2, skillTag: "analysis" },
    { id: "r-r7-3", subjectSlug: "READING", levelCode: "R20", difficulty: 2.2, question: "What does 'point of view' mean in a story?", options: ["The ending of the story", "The narrator's perspective", "The setting", "The conflict"], correctIndex: 1, skillTag: "analysis" },

    // R8 — Critical Reading (2.3–2.6)
    { id: "r-r8-1", subjectSlug: "READING", levelCode: "R25", difficulty: 2.3, question: "What is the author's tone?", options: ["Loudness of the text", "The writer's attitude or feeling", "Story length", "Number of characters"], correctIndex: 1, skillTag: "tone" },
    { id: "r-r8-2", subjectSlug: "READING", levelCode: "R25", difficulty: 2.5, question: "What is an 'inference'?", options: ["A direct quote", "A conclusion drawn from evidence", "A summary", "A definition"], correctIndex: 1, skillTag: "inference" },
    { id: "r-r8-3", subjectSlug: "READING", levelCode: "R25", difficulty: 2.6, question: "What is the difference between a primary and secondary source?", options: ["No difference", "Primary is firsthand; secondary interprets primary sources", "Secondary is more reliable", "Primary sources are always books"], correctIndex: 1, skillTag: "sources" },

    // R9 — Advanced Analysis (2.7–3.0)
    { id: "r-r9-1", subjectSlug: "READING", levelCode: "R31", difficulty: 2.7, question: "What is an 'argument's claim'?", options: ["Evidence", "The main point the author is trying to prove", "A counterargument", "A conclusion"], correctIndex: 1, skillTag: "argument" },
    { id: "r-r9-2", subjectSlug: "READING", levelCode: "R31", difficulty: 2.85, question: "What makes an argument 'credible'?", options: ["It is long", "It uses reliable evidence and logical reasoning", "It uses emotional language", "It has many examples"], correctIndex: 1, skillTag: "argument" },
    { id: "r-r9-3", subjectSlug: "READING", levelCode: "R31", difficulty: 3.0, question: "What is a 'rhetorical device'?", options: ["A grammar mistake", "A technique used to persuade or engage the reader", "A type of poem", "A story structure"], correctIndex: 1, skillTag: "rhetoric" },
  ],

  WRITING: [
    // W1 — Letters & Basic Words (0.1–0.3)
    { id: "w-w1-1", subjectSlug: "WRITING", levelCode: "W1", difficulty: 0.1, question: "Which is a capital letter?", options: ["a", "b", "A", "c"], correctIndex: 2, skillTag: "letters" },
    { id: "w-w1-2", subjectSlug: "WRITING", levelCode: "W1", difficulty: 0.2, question: "Which word is spelled correctly?", options: ["katt", "kat", "cat", "catt"], correctIndex: 2, skillTag: "spelling" },
    { id: "w-w1-3", subjectSlug: "WRITING", levelCode: "W1", difficulty: 0.3, question: "Which sentence starts correctly?", options: ["the cat sat.", "The cat sat.", "the Cat sat.", "tHE cat sat."], correctIndex: 1, skillTag: "capitalization" },

    // W2 — Parts of Speech (0.4–0.7)
    { id: "w-w2-1", subjectSlug: "WRITING", levelCode: "W2", difficulty: 0.4, question: "Which word is a noun?", options: ["Run", "Happy", "Dog", "Quickly"], correctIndex: 2, skillTag: "nouns" },
    { id: "w-w2-2", subjectSlug: "WRITING", levelCode: "W2", difficulty: 0.55, question: "Which word is a verb?", options: ["Blue", "Jump", "Tall", "Table"], correctIndex: 1, skillTag: "verbs" },
    { id: "w-w2-3", subjectSlug: "WRITING", levelCode: "W2", difficulty: 0.7, question: "Which word is an adjective?", options: ["Run", "Quickly", "Beautiful", "Eat"], correctIndex: 2, skillTag: "adjectives" },

    // W3 — Sentences & Punctuation (0.8–1.1)
    { id: "w-w3-1", subjectSlug: "WRITING", levelCode: "W3", difficulty: 0.8, question: "Which sentence uses correct end punctuation?", options: ["Where are you going.", "Where are you going!", "Where are you going?", "where are you going"], correctIndex: 2, skillTag: "punctuation" },
    { id: "w-w3-2", subjectSlug: "WRITING", levelCode: "W3", difficulty: 0.95, question: "Which sentence uses a comma correctly?", options: ["I like cats and, dogs.", "I like cats, and I like dogs.", "I, like cats.", "I like, cats."], correctIndex: 1, skillTag: "punctuation" },
    { id: "w-w3-3", subjectSlug: "WRITING", levelCode: "W3", difficulty: 1.1, question: "Which is a complete sentence?", options: ["Running fast.", "Because it rained.", "She ran to school.", "The big red."], correctIndex: 2, skillTag: "sentences" },

    // W4 — Paragraph Writing (1.2–1.5)
    { id: "w-w4-1", subjectSlug: "WRITING", levelCode: "W4", difficulty: 1.2, question: "What does a topic sentence do?", options: ["End a paragraph", "Start a new story", "Introduce the main idea", "Give an example"], correctIndex: 2, skillTag: "paragraphs" },
    { id: "w-w4-2", subjectSlug: "WRITING", levelCode: "W4", difficulty: 1.35, question: "What does a concluding sentence do?", options: ["Starts a new idea", "Wraps up the paragraph", "Gives evidence", "Introduces the topic"], correctIndex: 1, skillTag: "paragraphs" },
    { id: "w-w4-3", subjectSlug: "WRITING", levelCode: "W4", difficulty: 1.5, question: "Which is the best topic sentence?", options: ["Dogs are good.", "Dogs make excellent pets for many reasons.", "I have a dog.", "Dogs bark."], correctIndex: 1, skillTag: "paragraphs" },

    // W5 — Essay Structure (1.6–1.9)
    { id: "w-w5-1", subjectSlug: "WRITING", levelCode: "W5", difficulty: 1.6, question: "What are the three main parts of an essay?", options: ["Beginning, conflict, resolution", "Introduction, body, conclusion", "Topic, evidence, summary", "Hook, thesis, body"], correctIndex: 1, skillTag: "essay" },
    { id: "w-w5-2", subjectSlug: "WRITING", levelCode: "W5", difficulty: 1.75, question: "What is a thesis statement?", options: ["A question", "The main argument of the essay", "A supporting detail", "The conclusion"], correctIndex: 1, skillTag: "essay" },
    { id: "w-w5-3", subjectSlug: "WRITING", levelCode: "W5", difficulty: 1.9, question: "What does a transition word do in writing?", options: ["Ends the essay", "Connects ideas smoothly", "Introduces a new topic", "Summarizes everything"], correctIndex: 1, skillTag: "transitions" },

    // W6 — Narrative Writing (2.0–2.3)
    { id: "w-w6-1", subjectSlug: "WRITING", levelCode: "W6", difficulty: 2.0, question: "What is 'show, don't tell' in writing?", options: ["Use pictures", "Use descriptive details instead of stating emotions directly", "Write longer sentences", "Tell the reader what happened"], correctIndex: 1, skillTag: "narrative" },
    { id: "w-w6-2", subjectSlug: "WRITING", levelCode: "W6", difficulty: 2.15, question: "What is the purpose of a narrative hook?", options: ["End the story", "Grab the reader's attention at the beginning", "Summarize the plot", "Introduce the theme"], correctIndex: 1, skillTag: "narrative" },
    { id: "w-w6-3", subjectSlug: "WRITING", levelCode: "W6", difficulty: 2.3, question: "What is 'point of view' in writing?", options: ["The setting", "The narrator's perspective (first/third person)", "The plot", "The conflict"], correctIndex: 1, skillTag: "narrative" },

    // W7 — Persuasive Writing (2.4–2.7)
    { id: "w-w7-1", subjectSlug: "WRITING", levelCode: "W7", difficulty: 2.4, question: "What is a counterargument?", options: ["Your main claim", "Evidence for your side", "The opposing view that you address", "Your conclusion"], correctIndex: 2, skillTag: "persuasive" },
    { id: "w-w7-2", subjectSlug: "WRITING", levelCode: "W7", difficulty: 2.55, question: "What does 'ethos' mean in persuasive writing?", options: ["Emotional appeal", "Logical appeal", "Credibility/character appeal", "Statistical evidence"], correctIndex: 2, skillTag: "persuasive" },
    { id: "w-w7-3", subjectSlug: "WRITING", levelCode: "W7", difficulty: 2.7, question: "What is the difference between 'logos' and 'pathos'?", options: ["No difference", "Logos uses logic; pathos uses emotion", "Logos uses emotion; pathos uses logic", "Both use statistics"], correctIndex: 1, skillTag: "persuasive" },

    // W8 — Advanced Writing (2.8–3.0)
    { id: "w-w8-1", subjectSlug: "WRITING", levelCode: "W8", difficulty: 2.8, question: "What is a 'rhetorical question'?", options: ["A question with no answer", "A question asked for effect, not expecting an answer", "A scientific question", "A question in dialogue"], correctIndex: 1, skillTag: "rhetoric" },
    { id: "w-w8-2", subjectSlug: "WRITING", levelCode: "W8", difficulty: 2.9, question: "What is 'syntax' in writing?", options: ["Word choice", "The arrangement of words and sentences", "Grammar mistakes", "Punctuation rules"], correctIndex: 1, skillTag: "style" },
    { id: "w-w8-3", subjectSlug: "WRITING", levelCode: "W8", difficulty: 3.0, question: "What is 'diction' in writing?", options: ["Sentence structure", "The writer's choice of words", "Paragraph organization", "Essay length"], correctIndex: 1, skillTag: "style" },
  ],

  SCIENCE: [
    // S1 — Basic Science (0.2–0.6)
    { id: "s-s1-1", subjectSlug: "SCIENCE", levelCode: "S1", difficulty: 0.2, question: "What do plants need to grow?", options: ["Only soil", "Sunlight, water, and air", "Only water", "Only sunlight"], correctIndex: 1, skillTag: "life-science" },
    { id: "s-s1-2", subjectSlug: "SCIENCE", levelCode: "S1", difficulty: 0.4, question: "What is the largest planet in our solar system?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correctIndex: 2, skillTag: "earth-science" },
    { id: "s-s1-3", subjectSlug: "SCIENCE", levelCode: "S1", difficulty: 0.6, question: "What process turns liquid water into water vapor?", options: ["Condensation", "Precipitation", "Evaporation", "Freezing"], correctIndex: 2, skillTag: "water-cycle" },

    // S2 — Life Science (0.7–1.0)
    { id: "s-s2-1", subjectSlug: "SCIENCE", levelCode: "S2", difficulty: 0.7, question: "What is the process by which plants make food?", options: ["Respiration", "Photosynthesis", "Digestion", "Evaporation"], correctIndex: 1, skillTag: "life-science" },
    { id: "s-s2-2", subjectSlug: "SCIENCE", levelCode: "S2", difficulty: 0.85, question: "What is a food chain?", options: ["A grocery list", "How energy flows from one organism to another", "A recipe", "A type of plant"], correctIndex: 1, skillTag: "ecosystems" },
    { id: "s-s2-3", subjectSlug: "SCIENCE", levelCode: "S2", difficulty: 1.0, question: "What is a producer in a food chain?", options: ["An animal that eats other animals", "An organism that makes its own food", "A decomposer", "A carnivore"], correctIndex: 1, skillTag: "ecosystems" },

    // S3 — Earth Science (1.1–1.5)
    { id: "s-s3-1", subjectSlug: "SCIENCE", levelCode: "S3", difficulty: 1.1, question: "What causes day and night?", options: ["Earth orbiting the Sun", "The Moon blocking the Sun", "Earth rotating on its axis", "Clouds covering the Sun"], correctIndex: 2, skillTag: "earth-science" },
    { id: "s-s3-2", subjectSlug: "SCIENCE", levelCode: "S3", difficulty: 1.3, question: "What type of rock is formed from cooled lava?", options: ["Sedimentary", "Metamorphic", "Igneous", "Limestone"], correctIndex: 2, skillTag: "earth-science" },
    { id: "s-s3-3", subjectSlug: "SCIENCE", levelCode: "S3", difficulty: 1.5, question: "What causes tides on Earth?", options: ["The Sun's heat", "The Moon's gravitational pull", "Earth's rotation", "Wind patterns"], correctIndex: 1, skillTag: "earth-science" },

    // S4 — Physical Science (1.6–2.0)
    { id: "s-s4-1", subjectSlug: "SCIENCE", levelCode: "S4", difficulty: 1.6, question: "Which state of matter has a definite shape and volume?", options: ["Gas", "Liquid", "Plasma", "Solid"], correctIndex: 3, skillTag: "matter" },
    { id: "s-s4-2", subjectSlug: "SCIENCE", levelCode: "S4", difficulty: 1.75, question: "What force pulls objects toward Earth?", options: ["Friction", "Magnetism", "Gravity", "Tension"], correctIndex: 2, skillTag: "physics" },
    { id: "s-s4-3", subjectSlug: "SCIENCE", levelCode: "S4", difficulty: 2.0, question: "What is Newton's First Law of Motion?", options: ["F = ma", "An object in motion stays in motion unless acted upon by an unbalanced force", "For every action there is an equal and opposite reaction", "Energy cannot be created or destroyed"], correctIndex: 1, skillTag: "physics" },

    // S5 — Biology (2.1–2.5)
    { id: "s-s5-1", subjectSlug: "SCIENCE", levelCode: "S5", difficulty: 2.1, question: "What is the powerhouse of the cell?", options: ["Nucleus", "Cell wall", "Mitochondria", "Ribosome"], correctIndex: 2, skillTag: "biology" },
    { id: "s-s5-2", subjectSlug: "SCIENCE", levelCode: "S5", difficulty: 2.3, question: "What is the function of DNA?", options: ["Produce energy", "Carry genetic information", "Transport oxygen", "Digest food"], correctIndex: 1, skillTag: "biology" },
    { id: "s-s5-3", subjectSlug: "SCIENCE", levelCode: "S5", difficulty: 2.5, question: "What is mitosis?", options: ["Sexual reproduction", "Cell division that produces two identical cells", "Death of a cell", "Protein synthesis"], correctIndex: 1, skillTag: "biology" },

    // S6 — Chemistry (2.6–2.8)
    { id: "s-s6-1", subjectSlug: "SCIENCE", levelCode: "S6", difficulty: 2.6, question: "What type of bond involves sharing electrons?", options: ["Ionic", "Covalent", "Hydrogen", "Metallic"], correctIndex: 1, skillTag: "chemistry" },
    { id: "s-s6-2", subjectSlug: "SCIENCE", levelCode: "S6", difficulty: 2.7, question: "What is the pH of a neutral solution?", options: ["0", "5", "7", "14"], correctIndex: 2, skillTag: "chemistry" },
    { id: "s-s6-3", subjectSlug: "SCIENCE", levelCode: "S6", difficulty: 2.8, question: "What happens in an exothermic reaction?", options: ["Energy is absorbed", "Energy is released", "Temperature decreases", "No energy change"], correctIndex: 1, skillTag: "chemistry" },

    // S7 — Advanced Science (2.9–3.0)
    { id: "s-s7-1", subjectSlug: "SCIENCE", levelCode: "S7", difficulty: 2.9, question: "What is the relationship between wavelength and frequency of light?", options: ["Direct — longer wavelength means higher frequency", "Inverse — longer wavelength means lower frequency", "No relationship", "They are always equal"], correctIndex: 1, skillTag: "physics" },
    { id: "s-s7-2", subjectSlug: "SCIENCE", levelCode: "S7", difficulty: 2.95, question: "What is the law of conservation of energy?", options: ["Energy can be created but not destroyed", "Energy cannot be created or destroyed, only transformed", "Energy is always lost as heat", "Energy doubles with each transformation"], correctIndex: 1, skillTag: "physics" },
    { id: "s-s7-3", subjectSlug: "SCIENCE", levelCode: "S7", difficulty: 3.0, question: "What is the Hardy-Weinberg equilibrium?", options: ["A chemistry equation", "A principle stating allele frequencies stay constant in a stable population", "A physics law", "A geological timescale"], correctIndex: 1, skillTag: "biology" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Adaptive engine functions
// ─────────────────────────────────────────────────────────────────────────────

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
  // CAT-style adaptive: correct pushes up, wrong pushes down
  // Larger swing early, smaller later — stabilises around the child's true level
  const swing = wasCorrect ? 0.3 : -0.4;
  const newDifficulty = Math.max(0.1, Math.min(3.0, currentDifficulty + swing));
  return newDifficulty;
}

export function calculateConfidence(
  questionsAnswered: number,
  correctCount: number,
  abilityEstimate: number
): number {
  if (questionsAnswered === 0) return 0;
  const questionFactor = Math.min(questionsAnswered / MAX_QUESTIONS_PER_SUBJECT, 1);
  const hitRate = correctCount / questionsAnswered;
  // Confidence is high when we have many questions AND results are consistent (not 50/50)
  const consistencyFactor = Math.abs(hitRate - 0.5) * 2;
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

  const accuracyPct = (correctCount / totalQuestions) * 100;

  // ── Map ability → level using the ACTUAL per-level difficulty bands ──
  // The adaptive test's `finalDifficulty` is on the SAME 0.1–3.0 scale as each
  // placement question's difficulty (M1 ≈ 0.2, M5 ≈ 1.05, M8 ≈ 1.8 …). Placing
  // by that band — instead of linearly rescaling [0.1,3] onto [1,maxOrder] and
  // adding an accuracy term that only pushes UP — stops the old over-placement
  // (a multiplication-capable child was landing on M8 Decimals).
  const bank = placementBanks[subjectSlug] ?? [];
  const repDiff = (code: string): number | null => {
    const ds = bank.filter((q) => q.levelCode === code).map((q) => q.difficulty);
    return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null;
  };
  const candidates = subject.levels
    .map((l) => ({ l, d: repDiff(l.code) }))
    .filter((x): x is { l: typeof x.l; d: number } => x.d != null)
    .sort((a, b) => a.l.sortOrder - b.l.sortOrder);

  // Highest level the child can COMFORTABLY handle: rep difficulty ≤ ability.
  let closest = candidates.length ? candidates[0].l : subject.levels[0];
  for (const c of candidates) {
    if (c.d <= finalDifficulty + 0.05) closest = c.l;
    else break;
  }
  // Conservative (Kumon) start: if accuracy was weak, begin one level lower so
  // the child starts on solid ground and builds confidence rather than frustration.
  if (accuracyPct < 60) {
    const idx = subject.levels.findIndex((l) => l.id === closest.id);
    if (idx > 0) closest = subject.levels[idx - 1];
  }

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

export function getQuestionById(
  subjectSlug: string,
  questionId: string
): PlacementQuestion | null {
  return (
    (placementBanks[subjectSlug] ?? []).find((q) => q.id === questionId) ?? null
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LADDER placement (v2) — Kumon-style intake.
//
//   • ASCENT: start at the very EASIEST level ("1+1"-easy) and, while the child
//     is perfect, ask ONE question per level climbing upward — early questions
//     build confidence, and a strong student ascends quickly.
//   • FIRST MISTAKE → VERIFICATION: drop to the PREVIOUS level and serve ALL of
//     its questions. Answering every question at a level correctly certifies it
//     as the child's "comfortable" level → PLACE AT THE NEXT LEVEL. Any miss
//     during verification steps down another level and verifies there.
//   • A miss on the lowest level (or stepping below it) places at level 1.
//   • Hard cap MAX_QUESTIONS_PER_SUBJECT — on cap, the highest clean level wins.
//
// The whole ladder is recomputed statelessly from the answer log, so the state
// machine can't drift from what was actually asked and answered.
// ─────────────────────────────────────────────────────────────────────────────

export interface LadderLogEntry { questionId: string; correct: boolean }

interface LadderLevel { code: string; questions: PlacementQuestion[] }

function ladderLevels(subjectSlug: string): LadderLevel[] {
  const bank = placementBanks[subjectSlug] ?? [];
  const byCode = new Map<string, PlacementQuestion[]>();
  for (const q of bank) {
    if (!byCode.has(q.levelCode)) byCode.set(q.levelCode, []);
    byCode.get(q.levelCode)!.push(q);
  }
  return [...byCode.entries()]
    .map(([code, questions]) => ({ code, questions: questions.sort((a, b) => a.difficulty - b.difficulty) }))
    .sort((a, b) => a.questions[0].difficulty - b.questions[0].difficulty);
}

export type LadderStep =
  | { done: false; question: PlacementQuestion }
  | { done: true; comfortableLevelCode: string | null };

export function ladderNext(subjectSlug: string, log: LadderLogEntry[]): LadderStep {
  const levels = ladderLevels(subjectSlug);
  if (!levels.length) return { done: true, comfortableLevelCode: null };

  // Resolve each log entry to its level index.
  const levelIdxOf = (qid: string): number =>
    levels.findIndex((l) => l.questions.some((q) => q.id === qid));
  const askedIds = new Set(log.map((e) => e.questionId));
  const stats = levels.map((l) => {
    const entries = log.filter((e) => l.questions.some((q) => q.id === e.questionId));
    return {
      asked: entries.length,
      wrong: entries.filter((e) => !e.correct).length,
      total: l.questions.length,
    };
  });

  // Highest level with at least one answer and ZERO wrong — the cap fallback.
  const highestCleanIdx = (): number => {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (stats[i].asked > 0 && stats[i].wrong === 0) return i;
    }
    return -1;
  };

  // Hard cap.
  if (log.length >= MAX_QUESTIONS_PER_SUBJECT) {
    const hi = highestCleanIdx();
    return { done: true, comfortableLevelCode: hi >= 0 ? levels[hi].code : null };
  }

  const wrongs = log.filter((e) => !e.correct);

  // ── ASCENT: no mistakes yet → one question per level, climbing. ──
  const ascend = (fromIdx: number): LadderStep => {
    for (let i = fromIdx; i < levels.length; i++) {
      if (stats[i].asked === 0) {
        return { done: false, question: levels[i].questions[0] };
      }
    }
    // Clean run to the top → comfortable at the highest clean level.
    const hi = highestCleanIdx();
    return { done: true, comfortableLevelCode: hi >= 0 ? levels[hi].code : levels[levels.length - 1].code };
  };
  if (wrongs.length === 0) return ascend(0);

  // ── A mistake happened. ONE miss might just be a slip/typo — RE-TEST the
  // same level with its remaining questions before concluding anything. ──
  const lastWrongIdx = levelIdxOf(wrongs[wrongs.length - 1].questionId);
  const L = stats[lastWrongIdx];
  if (L.wrong === 1) {
    // Retry phase: keep testing THIS level.
    const nextQ = levels[lastWrongIdx].questions.find((q) => !askedIds.has(q.id));
    if (nextQ) return { done: false, question: nextQ };
    // Answered every other question at this level correctly → the single miss
    // was a slip. Forgive it and RESUME the ascent above this level.
    return ascend(lastWrongIdx + 1);
  }

  // ── CONFIRMED struggle (2+ wrong at the level) → verification: walk down
  // from the level below, certifying the first level the student clears. A
  // single slip is forgiven at certification too (when the level has ≥3
  // questions and every other answer was correct) — one typo must never
  // out-vote an otherwise perfect level. 2+ wrong = genuine struggle → down.
  const clearable = (s: { wrong: number; total: number }) =>
    s.wrong === 0 || (s.wrong === 1 && s.total >= 3);
  for (let t = lastWrongIdx - 1; t >= 0; t--) {
    if (!clearable(stats[t])) continue;               // genuinely struggled here → keep stepping down
    if (stats[t].asked === stats[t].total) {
      return { done: true, comfortableLevelCode: levels[t].code }; // level cleared → certified
    }
    const nextQ = levels[t].questions.find((q) => !askedIds.has(q.id));
    if (nextQ) return { done: false, question: nextQ };
    return { done: true, comfortableLevelCode: levels[t].code };
  }

  // Confirmed struggle on the lowest level (or no clean level below) → no
  // certified level; the student starts at the very first level.
  return { done: true, comfortableLevelCode: null };
}

// Map the certified "comfortable" level → the ASSIGNED level (the next one up).
export async function calculateLadderPlacement(
  subjectSlug: string,
  comfortableLevelCode: string | null,
  correctCount: number,
  totalQuestions: number
): Promise<PlacementResult> {
  const subject = await db.subject.findUnique({
    where: { slug: subjectSlug as any },
    include: { levels: { orderBy: { sortOrder: "asc" } } },
  });
  if (!subject) throw new Error("Subject not found");

  let assigned = subject.levels[0];
  if (comfortableLevelCode) {
    const idx = subject.levels.findIndex((l) => l.code === comfortableLevelCode);
    // Place at the NEXT level after the fully-cleared one (clamped at the top).
    assigned = subject.levels[Math.min(idx + 1, subject.levels.length - 1)] ?? subject.levels[0];
  }

  const accuracyPct = totalQuestions ? (correctCount / totalQuestions) * 100 : 0;
  return {
    subjectSlug,
    subjectName: subject.name,
    assignedLevelCode: assigned.code,
    assignedLevelName: assigned.name,
    confidenceScore: calculateConfidence(totalQuestions, correctCount, 0),
    correctCount,
    totalQuestions,
    accuracyPct,
  };
}
