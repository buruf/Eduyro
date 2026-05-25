// src/lib/content/writing-prompts.ts
// Curated writing prompts for Writing levels W1-W8.
// Each prompt has scaffolding for younger writers and rubric criteria
// for older ones.

export interface WritingPrompt {
  id: string;
  levelCode: string;
  title: string;
  type: "sentence" | "paragraph" | "essay" | "narrative" | "persuasive" | "creative";
  prompt: string;
  scaffolding?: string[]; // Sentence starters for younger writers
  rubricCriteria?: { name: string; description: string }[];
  wordCountTarget?: { min: number; max: number };
  exemplarStudentResponse?: string;
}

// ─────────────────────────────────────────────
// W2 — Parts of Speech (Grade 2-4) — focused on grammar
// ─────────────────────────────────────────────

export const PROMPTS_W2: WritingPrompt[] = [
  {
    id: "w2-favourite-animal",
    levelCode: "W2",
    title: "Describe Your Favourite Animal",
    type: "sentence",
    prompt: "Write 3 sentences about your favourite animal. Underline one noun, circle one verb, and put a box around one adjective in your sentences.",
    scaffolding: [
      "My favourite animal is ___.",
      "It is ___ and ___.",
      "It likes to ___.",
    ],
    wordCountTarget: { min: 15, max: 50 },
    exemplarStudentResponse: "My favourite animal is a dolphin. It is grey and very smart. Dolphins like to jump in the water.",
  },
  {
    id: "w2-weekend",
    levelCode: "W2",
    title: "Last Weekend",
    type: "sentence",
    prompt: "Write 3 sentences about what you did last weekend. Make sure to use action verbs (like 'ran', 'ate', 'played').",
    scaffolding: [
      "On Saturday, I ___.",
      "Then I ___.",
      "My favourite part was ___.",
    ],
    wordCountTarget: { min: 15, max: 60 },
  },
];

// ─────────────────────────────────────────────
// W5 — Paragraph Structure (Grade 5-7)
// ─────────────────────────────────────────────

export const PROMPTS_W5: WritingPrompt[] = [
  {
    id: "w5-best-place",
    levelCode: "W5",
    title: "The Best Place I've Ever Been",
    type: "paragraph",
    prompt: "Write one paragraph describing the best place you've ever visited. Your paragraph should have:\n• A topic sentence that names the place and why it was special\n• 3-4 supporting sentences with specific details (what you saw, heard, smelled, did)\n• A concluding sentence that wraps up your idea",
    scaffolding: [
      "Topic sentence: The best place I've ever been is ___ because ___.",
      "Detail: One thing I remember is ___.",
      "Detail: I also saw/heard/did ___.",
      "Concluding sentence: I hope to go back to ___ because ___.",
    ],
    wordCountTarget: { min: 75, max: 150 },
    rubricCriteria: [
      { name: "Topic sentence", description: "Introduces the place clearly and gives a reason" },
      { name: "Supporting details", description: "At least 3 specific, sensory details" },
      { name: "Concluding sentence", description: "Wraps up the paragraph without starting a new idea" },
      { name: "Grammar & spelling", description: "Few or no errors that interfere with meaning" },
    ],
  },
  {
    id: "w5-explain-skill",
    levelCode: "W5",
    title: "Teach Someone a Skill",
    type: "paragraph",
    prompt: "Pick a skill you're good at (riding a bike, baking cookies, drawing) and write one paragraph explaining how to do it. Use transition words like 'first', 'next', 'then', 'finally'.",
    scaffolding: [
      "Topic sentence: One skill I can teach you is ___.",
      "First, ___.",
      "Next, ___.",
      "Then, ___.",
      "Finally, ___.",
      "Concluding sentence: With practice, you'll be able to ___.",
    ],
    wordCountTarget: { min: 80, max: 150 },
  },
];

// ─────────────────────────────────────────────
// W7 — Narrative Writing (Grade 7-9)
// ─────────────────────────────────────────────

export const PROMPTS_W7: WritingPrompt[] = [
  {
    id: "w7-missed-bus",
    levelCode: "W7",
    title: "The Day I Missed the Bus",
    type: "narrative",
    prompt: "Write a 4-5 paragraph narrative story about a day everything went wrong starting from when you missed the bus. Include:\n• A clear beginning, middle, and end\n• At least two characters with dialogue\n• Specific sensory details (sights, sounds, feelings)\n• A turning point or moment of realization",
    wordCountTarget: { min: 300, max: 600 },
    rubricCriteria: [
      { name: "Plot structure", description: "Clear beginning, middle, end with a turning point" },
      { name: "Characters", description: "Two or more characters; at least one developed with traits" },
      { name: "Dialogue", description: "Realistic dialogue properly punctuated" },
      { name: "Setting & sensory detail", description: "Reader can picture and feel the scene" },
      { name: "Voice", description: "Distinct narrator perspective" },
      { name: "Conventions", description: "Grammar, spelling, paragraph breaks are correct" },
    ],
  },
  {
    id: "w7-time-travel",
    levelCode: "W7",
    title: "If I Could Travel to Any Time…",
    type: "narrative",
    prompt: "Imagine you have a one-day pass to travel to any time in history (past or future). Write a narrative describing your day. Include what you see, who you meet, and one specific thing you change or learn.",
    wordCountTarget: { min: 350, max: 600 },
  },
];

// ─────────────────────────────────────────────
// W8 — Persuasive Writing (Grade 8-10)
// ─────────────────────────────────────────────

export const PROMPTS_W8: WritingPrompt[] = [
  {
    id: "w8-school-hours",
    levelCode: "W8",
    title: "Should the School Day Start Later?",
    type: "persuasive",
    prompt: "Many schools have considered starting later in the morning to give students more sleep. Write a 5-paragraph persuasive essay arguing your position. Your essay must include:\n\n• An introduction with a clear thesis statement\n• Three body paragraphs, each with one main argument supported by evidence (sleep studies, test scores, athletic performance, etc.)\n• At least one counterargument that you address\n• A conclusion that restates your position without simply repeating yourself",
    wordCountTarget: { min: 500, max: 800 },
    rubricCriteria: [
      { name: "Thesis", description: "Clear, debatable claim stated in the intro" },
      { name: "Arguments", description: "Three distinct arguments, each with specific evidence" },
      { name: "Counterargument", description: "Acknowledges and responds to opposing view" },
      { name: "Evidence quality", description: "Specific facts, statistics, or expert sources (not just personal opinion)" },
      { name: "Organization", description: "Clear progression, smooth transitions" },
      { name: "Conclusion", description: "Doesn't merely restate intro; gives the reader something to think about" },
      { name: "Conventions", description: "Grammar, spelling, paragraph structure" },
    ],
  },
  {
    id: "w8-phone-policy",
    levelCode: "W8",
    title: "Phones in the Classroom",
    type: "persuasive",
    prompt: "Some schools ban phones entirely. Others allow them with rules. Write a 5-paragraph persuasive essay arguing what your school's phone policy should be. Use evidence from research, your own experience, and at least one counterargument.",
    wordCountTarget: { min: 500, max: 800 },
  },
  {
    id: "w8-uniforms",
    levelCode: "W8",
    title: "School Uniforms: Required or Optional?",
    type: "persuasive",
    prompt: "Write a 5-paragraph persuasive essay arguing either for or against required school uniforms. Be sure to address the strongest argument from the opposing side and explain why your position is still stronger.",
    wordCountTarget: { min: 500, max: 800 },
  },
];

// ─────────────────────────────────────────────
// Index
// ─────────────────────────────────────────────

export const ALL_PROMPTS: Record<string, WritingPrompt[]> = {
  W2: PROMPTS_W2,
  W5: PROMPTS_W5,
  W7: PROMPTS_W7,
  W8: PROMPTS_W8,
};

export function getPromptsByLevel(levelCode: string): WritingPrompt[] {
  return ALL_PROMPTS[levelCode] ?? [];
}
