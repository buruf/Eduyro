// scripts/test-grading.ts
// Grading rules, pinned. Every case here came from a real defect: a child
// marked wrong for "0.10", a capitalization question where every option
// graded correct, and a coordinate answer colliding with a plain number.
import { answersMatch, optionsDifferOnlyByCase } from "../src/lib/grading";

interface Case {
  name: string;
  submitted: string;
  correct: string;
  options?: string[];
  want: boolean;
}

const CASES: Case[] = [
  // ── Numeric tolerance (Radwa's decimal bug) ──────────────────────────────
  { name: "0.10 equals 0.1", submitted: "0.10", correct: "0.1", want: true },
  { name: "3.0 equals 3", submitted: "3.0", correct: "3", want: true },
  { name: ".5 equals 0.5", submitted: ".5", correct: "0.5", want: true },
  { name: "trailing space ignored", submitted: " 42 ", correct: "42", want: true },
  { name: "75% equals 75", submitted: "75%", correct: "75", want: true },
  { name: "1/2 spacing ignored", submitted: "1 / 2", correct: "1/2", want: true },
  { name: "wrong number still wrong", submitted: "0.2", correct: "0.1", want: false },

  // ── Thousands separators vs coordinate pairs ─────────────────────────────
  { name: "1,000 equals 1000", submitted: "1,000", correct: "1000", want: true },
  { name: "12,345 equals 12345", submitted: "12,345", correct: "12345", want: true },
  { name: "coordinate 3,7 is NOT 37", submitted: "3,7", correct: "37", want: false },
  { name: "coordinate 3,7 matches itself", submitted: "3,7", correct: "3,7", want: true },
  { name: "coordinate 2,5 is NOT 25", submitted: "2,5", correct: "25", want: false },
  { name: "malformed 1,00 is not 100", submitted: "1,00", correct: "100", want: false },

  // ── Capitalization items: case IS the question ───────────────────────────
  {
    name: "capitalization: correct option accepted",
    submitted: "July",
    correct: "July",
    options: ["july", "July", "jULY", "JUly"],
    want: true,
  },
  {
    name: "capitalization: lowercase distractor REJECTED",
    submitted: "july",
    correct: "July",
    options: ["july", "July", "jULY", "JUly"],
    want: false,
  },
  {
    name: "capitalization: mixed-case distractor REJECTED",
    submitted: "jULY",
    correct: "July",
    options: ["july", "July", "jULY", "JUly"],
    want: false,
  },
  {
    name: "sentence copying: wrong case REJECTED",
    submitted: "i can run.",
    correct: "I can run.",
    options: ["I can run.", "i can run.", "I can run"],
    want: false,
  },
  {
    name: "sentence copying: exact copy accepted",
    submitted: "I can run.",
    correct: "I can run.",
    options: ["I can run.", "i can run.", "I can run"],
    want: true,
  },

  // ── Normal MC keeps case-insensitive grading ─────────────────────────────
  {
    name: "ordinary MC still case-insensitive",
    submitted: "relative",
    correct: "Relative",
    options: ["Personal", "Reflexive", "Relative", "Indefinite"],
    want: true,
  },
  {
    name: "ordinary free-text still case-insensitive",
    submitted: "queensland, australia",
    correct: "Queensland, Australia",
    want: true,
  },
];

let failed = 0;
for (const c of CASES) {
  const got = answersMatch(c.submitted, c.correct, c.options);
  if (got !== c.want) {
    failed++;
    console.log(
      `FAIL  ${c.name}\n      answersMatch(${JSON.stringify(c.submitted)}, ${JSON.stringify(c.correct)}) = ${got}, want ${c.want}`,
    );
  }
}

// Detector itself
const detector: [string[], boolean][] = [
  [["july", "July", "jULY"], true],
  [["Personal", "Reflexive", "Relative"], false],
  [["I can run.", "i can run.", "I can run"], true],
  [["4", "5", "6"], false],
];
for (const [opts, want] of detector) {
  const got = optionsDifferOnlyByCase(opts);
  if (got !== want) {
    failed++;
    console.log(`FAIL  optionsDifferOnlyByCase(${JSON.stringify(opts)}) = ${got}, want ${want}`);
  }
}

console.log(
  `\nGrading: ${CASES.length + detector.length - failed}/${CASES.length + detector.length} cases pass`,
);
if (failed) process.exit(1);
