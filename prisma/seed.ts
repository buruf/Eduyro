// prisma/seed.ts
// Database seed — subjects, levels, skills, badges, sample worksheets
// Run with: npx tsx prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { generateProblems } from "../src/lib/worksheet/generator";
import { READING_CURRICULUM } from "../src/lib/reading/curriculum";

const db = new PrismaClient();

// ─────────────────────────────────────────────
// Curriculum data
// ─────────────────────────────────────────────

const SUBJECTS = [
  {
    name: "Mathematics",
    slug: "MATH" as const,
    description: "Counting through Calculus",
    iconEmoji: "∑",
    colorHex: "#1B4F8A",
    sortOrder: 1,
    levels: [
      { code: "M1", name: "Early Counting", gradeMin: "Pre-K", gradeMax: "K", skills: ["Counting 1–10", "Counting 1–50", "Number recognition"] },
      { code: "M2", name: "Number Sense", gradeMin: "Pre-K", gradeMax: "K", skills: ["Counting to 100", "More/Less", "Number patterns"] },
      { code: "M3", name: "Addition Within Ten", gradeMin: "K", gradeMax: "Grade 1", skills: ["Addition within 5", "Addition within 10", "Number bonds"] },
      { code: "M4", name: "Adding & Subtracting", gradeMin: "Grade 1", gradeMax: "Grade 2", skills: ["2-digit addition", "Subtraction within 20", "Missing numbers"] },
      { code: "M5", name: "Multiplication Fluency", gradeMin: "Grade 2", gradeMax: "Grade 4", skills: ["×2–×5 tables", "×6, ×7, ×8 tables", "×9 tables", "Mixed ×6–×9"] },
      { code: "M6", name: "Division Foundations", gradeMin: "Grade 3", gradeMax: "Grade 5", skills: ["Division by 6, 7, 8", "Division by 9", "Mixed division", "Division with remainders"] },
      { code: "M7", name: "Fractions", gradeMin: "Grade 4", gradeMax: "Grade 6", skills: ["Identifying fractions", "Simplifying fractions", "Adding fractions", "Comparing fractions"] },
      { code: "M8", name: "Decimals & Percentages", gradeMin: "Grade 5", gradeMax: "Grade 6", skills: ["Decimal place value", "Decimal operations", "Percentages"] },
      { code: "M9", name: "Ratios & Proportions", gradeMin: "Grade 6", gradeMax: "Grade 7", skills: ["Ratios", "Proportions", "Unit rates"] },
      { code: "M10", name: "Pre-Algebra", gradeMin: "Grade 7", gradeMax: "Grade 8", skills: ["Solving one-step equations", "Solving two-step equations", "Inequalities", "Word problems"] },
      { code: "M11", name: "Linear Equations", gradeMin: "Grade 8", gradeMax: "Grade 9", skills: ["Slope and intercept", "Graphing lines", "Systems of equations"] },
      { code: "M12", name: "Polynomials", gradeMin: "Grade 9", gradeMax: "Grade 10", skills: ["Adding polynomials", "Multiplying polynomials", "Factoring"] },
      { code: "M13", name: "Quadratics", gradeMin: "Grade 9", gradeMax: "Grade 10", skills: ["Quadratic equations", "Quadratic formula", "Graphing parabolas"] },
      { code: "M14", name: "Functions", gradeMin: "Grade 10", gradeMax: "Grade 11", skills: ["Function notation", "Domain and range", "Inverse functions"] },
      { code: "M15", name: "Trigonometry", gradeMin: "Grade 11", gradeMax: "Grade 12", skills: ["Right triangle trig", "Unit circle", "Trig identities"] },
      { code: "M16", name: "Algebra II", gradeMin: "Grade 11", gradeMax: "Grade 12", skills: ["Logarithms", "Exponential functions", "Complex numbers"] },
      { code: "M17", name: "Pre-Calculus", gradeMin: "Grade 12", gradeMax: "Grade 12", skills: ["Limits", "Sequences and series", "Vectors"] },
      { code: "M18", name: "Calculus", gradeMin: "Grade 12", gradeMax: "Grade 12", skills: ["Derivatives", "Integrals", "Applications"] },
    ],
  },
  {
    name: "Reading",
    slug: "READING" as const,
    description: "Phonics to literary analysis",
    iconEmoji: "📖",
    colorHex: "#C8902A",
    sortOrder: 2,
    // R1–R60 (Grades 1–10) — generated from the single source of truth in
    // src/lib/reading/curriculum.ts so seed and prod can never drift.
    levels: READING_CURRICULUM.map((m) => ({
      code: m.code,
      name: m.topic,
      gradeMin: `Grade ${m.grade}`,
      gradeMax: `Grade ${m.grade}`,
      skills: [...m.units],
    })),
  },
  {
    name: "Writing",
    slug: "WRITING" as const,
    description: "Grammar through essays",
    iconEmoji: "✍️",
    colorHex: "#2D6A3F",
    sortOrder: 3,
    levels: [
      { code: "W0", name: "Handwriting & Mechanics", gradeMin: "Pre-K", gradeMax: "K", skills: ["Letter Formation", "Spatial Awareness", "Basic Copying"] },
      { code: "W1", name: "Sentence Completion & Building", gradeMin: "Grade 1", gradeMax: "Grade 2", skills: ["Complete vs. Incomplete Sentences", "Expanding Sentences", "Combining Sentences"] },
      { code: "W2", name: "Parts of Speech & Word Choice", gradeMin: "Grade 2", gradeMax: "Grade 4", skills: ["Core Grammar", "Advanced Parts of Speech", "Precision Vocabulary"] },
      { code: "W3", name: "Sentence Structure & Variety", gradeMin: "Grade 3", gradeMax: "Grade 5", skills: ["Simple, Compound & Complex Sentences", "Subject-Verb Agreement & Tense", "Sentence Editing"] },
      { code: "W4", name: "Punctuation & Mechanics", gradeMin: "Grade 4", gradeMax: "Grade 6", skills: ["Terminal Punctuation", "Internal Punctuation", "Advanced Mechanics"] },
      { code: "W5", name: "Paragraph Structure", gradeMin: "Grade 5", gradeMax: "Grade 7", skills: ["Structural Components", "Paragraph Organization", "Editing & Revising"] },
      { code: "W6", name: "Essay Structure & Research", gradeMin: "Grade 6", gradeMax: "Grade 8", skills: ["Five-Paragraph Framework", "Thesis Statements", "Research & Citing"] },
      { code: "W7", name: "Narrative Writing", gradeMin: "Grade 7", gradeMax: "Grade 9", skills: ["Character & Setting Development", "Plot Arc Architecture"] },
      { code: "W8", name: "Informational & Expository Writing", gradeMin: "Grade 8", gradeMax: "Grade 9", skills: ["Informational Formatting", "Process & Comparison Writing"] },
      { code: "W9", name: "Persuasive & Argumentative Writing", gradeMin: "Grade 8", gradeMax: "Grade 10", skills: ["Fact-Based Claims", "Structural Persuasion"] },
    ],
  },
  {
    name: "Science",
    slug: "SCIENCE" as const,
    description: "Concepts and inquiry",
    iconEmoji: "🔬",
    colorHex: "#C23B22",
    sortOrder: 4,
    levels: [
      { code: "S1", name: "Life Science Basics", gradeMin: "Grade 2", gradeMax: "Grade 4", skills: ["Living vs nonliving", "Plant life cycle", "Animal life cycles", "Habitats", "Animal groups"] },
      { code: "S2", name: "Ecosystems", gradeMin: "Grade 3", gradeMax: "Grade 5", skills: ["Food chains", "Food webs", "Producers and consumers", "Adaptation"] },
      { code: "S3", name: "Earth Science", gradeMin: "Grade 4", gradeMax: "Grade 6", skills: ["Water cycle", "Weather patterns", "Rocks and minerals", "The solar system", "Earth, Sun and Moon"] },
      { code: "S4", name: "States of Matter", gradeMin: "Grade 5", gradeMax: "Grade 7", skills: ["Solids, liquids, gases", "State changes", "Melting and freezing", "Evaporation"] },
      { code: "S5", name: "Biology", gradeMin: "Grade 6", gradeMax: "Grade 8", skills: ["Cell structure", "Cell functions", "Photosynthesis", "Respiration", "Human body systems", "The digestive system"] },
      { code: "S6", name: "Chemistry", gradeMin: "Grade 7", gradeMax: "Grade 9", skills: ["Elements and compounds", "Chemical reactions", "Acids and bases", "Periodic table basics"] },
      { code: "S7", name: "Physics", gradeMin: "Grade 8", gradeMax: "Grade 10", skills: ["Forces and motion", "Energy", "Waves and sound", "Simple machines", "Electricity"] },
    ],
  },
];

const BADGES = [
  { slug: "perfect-score", name: "Perfect Score", description: "Score 100% on a single worksheet", iconEmoji: "🎯", criteria: { type: "perfect_score" } },
  { slug: "speed-demon", name: "Speed Demon", description: "Complete a worksheet in under 5 minutes with 95% accuracy", iconEmoji: "⚡", criteria: { type: "speed", thresholdSeconds: 300, minAccuracy: 95 } },
  { slug: "streak-7", name: "Week Warrior", description: "7-day streak", iconEmoji: "🔥", criteria: { type: "streak", threshold: 7 } },
  { slug: "streak-14", name: "Fortnight Fighter", description: "14-day streak", iconEmoji: "🔥", criteria: { type: "streak", threshold: 14 } },
  { slug: "streak-30", name: "30-Day Champion", description: "30-day streak", iconEmoji: "🚀", criteria: { type: "streak", threshold: 30 } },
  { slug: "streak-100", name: "100-Day Legend", description: "100-day streak", iconEmoji: "💯", criteria: { type: "streak", threshold: 100 } },
  { slug: "sheets-50", name: "Half Century", description: "Complete 50 worksheets", iconEmoji: "📋", criteria: { type: "sheets_completed", threshold: 50 } },
  { slug: "sheets-200", name: "Double Century", description: "Complete 200 worksheets", iconEmoji: "📚", criteria: { type: "sheets_completed", threshold: 200 } },
  { slug: "level-climber", name: "Level Climber", description: "Advance to a new level", iconEmoji: "📈", criteria: { type: "level_advance", threshold: 1 } },
  { slug: "subject-ace", name: "Subject Ace", description: "Master a full subject", iconEmoji: "🌟", criteria: { type: "subject_master", threshold: 1 } },
];

// ─────────────────────────────────────────────
// Seed runner
// ─────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting BrightSteps database seed…");

  // ── Subjects + Levels + Skills ──
  for (const subjectData of SUBJECTS) {
    console.log(`\n📚 Seeding ${subjectData.name}…`);
    const subject = await db.subject.upsert({
      where: { slug: subjectData.slug },
      create: {
        name: subjectData.name, slug: subjectData.slug,
        description: subjectData.description, iconEmoji: subjectData.iconEmoji,
        colorHex: subjectData.colorHex, sortOrder: subjectData.sortOrder,
      },
      update: {},
    });

    for (let i = 0; i < subjectData.levels.length; i++) {
      const lvl = subjectData.levels[i];
      const level = await db.level.upsert({
        where: { subjectId_code: { subjectId: subject.id, code: lvl.code } },
        create: {
          subjectId: subject.id, code: lvl.code, name: lvl.name,
          gradeMin: lvl.gradeMin, gradeMax: lvl.gradeMax,
          sortOrder: i, masteryThresholdPct: 90, masteryConsecutiveDays: 5,
          sheetsPerDay: 3, problemsPerSheet: 20, timeLimitMinutes: 10,
        },
        update: {},
      });

      // Create skills
      for (let s = 0; s < lvl.skills.length; s++) {
        await db.skill.upsert({
          where: { id: `${level.id}-skill-${s}` },
          create: {
            id: `${level.id}-skill-${s}`,
            levelId: level.id, name: lvl.skills[s],
            sortOrder: s, totalSheets: 40,
          },
          update: {},
        });
      }
      console.log(`  ✓ Level ${lvl.code} — ${lvl.name} (${lvl.skills.length} skills)`);
    }
  }

  // ── Sample worksheets (first 5 per skill for the most popular levels) ──
  console.log(`\n📝 Generating sample worksheets for key levels…`);
const keyLevels = ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12","M13","M14","M15","M16","M17","M18","R1","R7","R13","R19","R25","R31","R37","R43","R49","R55","W1","W2","W3","W4","W5","W6","W7","W8","S1","S2","S3","S4","S5","S6","S7"];  const subjects = await db.subject.findMany({
    include: { levels: { where: { code: { in: keyLevels } }, include: { skills: true } } },
  });

  let worksheetCount = 0;
  for (const subject of subjects) {
    for (const level of subject.levels) {
      for (const skill of level.skills) {
        for (let sheetNum = 1; sheetNum <= 5; sheetNum++) {
          const { problems, answerKey } = generateProblems({
            subjectSlug: subject.slug, levelCode: level.code,
            skillName: skill.name, problemCount: 20,
            timeLimitMinutes: 10, sheetNumber: sheetNum,
          });

          await db.worksheet.create({
            data: {
              levelId: level.id, skillId: skill.id, sheetNumber: sheetNum,
              title: `${skill.name} — Sheet ${sheetNum}`,
              type: "DAILY_PRACTICE",
              problems: problems as any, answerKey: answerKey as any,
              problemCount: problems.length, estimatedMinutes: 10,
              difficultyScore: 1.0,
            },
          });
          worksheetCount++;
        }
      }
    }
  }
  console.log(`  ✓ Generated ${worksheetCount} sample worksheets`);

  // ── Badges ──
  console.log(`\n🏅 Seeding badges…`);
  for (const badge of BADGES) {
    await db.badge.upsert({
      where: { slug: badge.slug },
      create: { ...badge, criteria: badge.criteria as any },
      update: {},
    });
  }
  console.log(`  ✓ ${BADGES.length} badges seeded`);

  console.log(`\n✅ Seed complete!`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
