// src/lib/content/writing-prompts.ts
// Curated writing prompts for Writing levels W1–W8.
// These power the COMPANION PRINTABLE writing worksheets: real composition
// practice (paragraphs, narratives, essays) that cannot be auto-graded, so it
// lives outside the interactive mastery flow. Each prompt has scaffolding for
// younger writers and rubric criteria for older ones.

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
// W1 — Sentence Completion (Grade 1–2)
// ─────────────────────────────────────────────

export const PROMPTS_W1: WritingPrompt[] = [
  {
    id: "w1-my-family",
    levelCode: "W1",
    title: "All About My Family",
    type: "sentence",
    prompt: "Write 3 complete sentences about your family. Begin each sentence with a capital letter and end it with a period.",
    scaffolding: ["My family has ___.", "I like to ___ with them.", "My favorite person is ___."],
    wordCountTarget: { min: 10, max: 40 },
    exemplarStudentResponse: "My family has four people. I like to play games with them. My favorite person is my sister.",
  },
  {
    id: "w1-favorite-food",
    levelCode: "W1",
    title: "My Favorite Food",
    type: "sentence",
    prompt: "Write 3 sentences about a food you love. Remember to use a capital letter at the start and a period at the end of each sentence.",
    scaffolding: ["My favorite food is ___.", "It tastes ___.", "I eat it when ___."],
    wordCountTarget: { min: 10, max: 40 },
  },
  {
    id: "w1-my-day",
    levelCode: "W1",
    title: "My Perfect Day",
    type: "sentence",
    prompt: "Write 4 sentences about your perfect day. Make sure every sentence starts with a capital letter and ends with the right mark (. or ! or ?).",
    scaffolding: ["First, I would ___.", "Then I would ___.", "Next, I would ___.", "Best of all, I would ___."],
    wordCountTarget: { min: 15, max: 50 },
  },
];

// ─────────────────────────────────────────────
// W2 — Parts of Speech (Grade 2–4) — focused on grammar
// ─────────────────────────────────────────────

export const PROMPTS_W2: WritingPrompt[] = [
  {
    id: "w2-favourite-animal",
    levelCode: "W2",
    title: "Describe Your Favourite Animal",
    type: "sentence",
    prompt: "Write 3 sentences about your favourite animal. Underline one noun, circle one verb, and put a box around one adjective in your sentences.",
    scaffolding: ["My favourite animal is ___.", "It is ___ and ___.", "It likes to ___."],
    wordCountTarget: { min: 15, max: 50 },
    exemplarStudentResponse: "My favourite animal is a dolphin. It is grey and very smart. Dolphins like to jump in the water.",
  },
  {
    id: "w2-weekend",
    levelCode: "W2",
    title: "Last Weekend",
    type: "sentence",
    prompt: "Write 3 sentences about what you did last weekend. Make sure to use action verbs (like 'ran', 'ate', 'played').",
    scaffolding: ["On Saturday, I ___.", "Then I ___.", "My favourite part was ___."],
    wordCountTarget: { min: 15, max: 60 },
  },
  {
    id: "w2-dream-room",
    levelCode: "W2",
    title: "My Dream Bedroom",
    type: "sentence",
    prompt: "Describe your dream bedroom in 4 sentences. Use at least three adjectives and underline each one.",
    scaffolding: ["My dream bedroom would be ___.", "It would have ___.", "The walls would be ___.", "I would feel ___ there."],
    wordCountTarget: { min: 20, max: 60 },
  },
];

// ─────────────────────────────────────────────
// W3 — Sentence Structure (Grade 3–5)
// ─────────────────────────────────────────────

export const PROMPTS_W3: WritingPrompt[] = [
  {
    id: "w3-combine",
    levelCode: "W3",
    title: "Build Bigger Sentences",
    type: "sentence",
    prompt: "Write about a hobby you enjoy. Include at least one SIMPLE sentence, one COMPOUND sentence (joined with and/but/so), and one COMPLEX sentence (using because/when/although). Label each sentence type.",
    scaffolding: ["Simple: I enjoy ___.", "Compound: ___, and ___.", "Complex: When ___, I ___."],
    wordCountTarget: { min: 30, max: 80 },
    rubricCriteria: [
      { name: "Simple sentence", description: "One complete independent clause" },
      { name: "Compound sentence", description: "Two clauses joined with a conjunction" },
      { name: "Complex sentence", description: "Independent + dependent clause" },
    ],
  },
  {
    id: "w3-subjects-predicates",
    levelCode: "W3",
    title: "Subjects & Predicates",
    type: "sentence",
    prompt: "Write 4 sentences about your school day. In each sentence, underline the complete subject once and the complete predicate twice.",
    scaffolding: ["The school bell ___.", "My teacher ___.", "My friends and I ___.", "After lunch, our class ___."],
    wordCountTarget: { min: 25, max: 70 },
  },
];

// ─────────────────────────────────────────────
// W4 — Punctuation (Grade 4–6)
// ─────────────────────────────────────────────

export const PROMPTS_W4: WritingPrompt[] = [
  {
    id: "w4-dialogue-scene",
    levelCode: "W4",
    title: "A Short Conversation",
    type: "paragraph",
    prompt: "Write a short conversation between two people (at least 4 lines of dialogue). Punctuate every line correctly with quotation marks, commas, and the right end marks. Start a new line each time the speaker changes.",
    scaffolding: ['"___," said ___.', '"___?" asked ___.', '"___!" she shouted.'],
    wordCountTarget: { min: 40, max: 120 },
    rubricCriteria: [
      { name: "Quotation marks", description: "Around the exact spoken words" },
      { name: "Commas", description: "Correctly placed before/after dialogue tags" },
      { name: "End punctuation", description: "Correct marks inside the quotes" },
      { name: "New speaker, new line", description: "A new paragraph each time the speaker changes" },
    ],
  },
  {
    id: "w4-list-and-commas",
    levelCode: "W4",
    title: "Packing for a Trip",
    type: "paragraph",
    prompt: "Write a paragraph about packing for a trip. Use commas in a list, at least one apostrophe (for a contraction or possessive), and one sentence joined with a semicolon.",
    wordCountTarget: { min: 50, max: 120 },
  },
];

// ─────────────────────────────────────────────
// W5 — Paragraph Structure (Grade 5–7)
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
      "First, ___.", "Next, ___.", "Then, ___.", "Finally, ___.",
      "Concluding sentence: With practice, you'll be able to ___.",
    ],
    wordCountTarget: { min: 80, max: 150 },
  },
  {
    id: "w5-opinion-paragraph",
    levelCode: "W5",
    title: "The Best Season",
    type: "paragraph",
    prompt: "Write one well-organized paragraph arguing which season is the best. Begin with a clear topic sentence, give at least three reasons, and finish with a concluding sentence that does not just repeat the topic sentence.",
    scaffolding: ["Topic sentence: The best season is ___ because ___.", "One reason is ___.", "Another reason is ___.", "Concluding sentence: For these reasons, ___."],
    wordCountTarget: { min: 80, max: 150 },
  },
  {
    id: "w5-unity-fix",
    levelCode: "W5",
    title: "A Paragraph That Sticks Together",
    type: "paragraph",
    prompt: "Choose a hobby and write a paragraph about why you enjoy it. Every single sentence must connect to that one main idea — do not wander off topic. When you finish, reread and cross out any sentence that breaks the unity.",
    wordCountTarget: { min: 70, max: 140 },
  },
];

// ─────────────────────────────────────────────
// W6 — Essay Structure (Grade 6–8)
// ─────────────────────────────────────────────

export const PROMPTS_W6: WritingPrompt[] = [
  {
    id: "w6-five-paragraph",
    levelCode: "W6",
    title: "A Person I Admire",
    type: "essay",
    prompt: "Write a 5-paragraph essay about a person you admire. Include:\n• An introduction with a hook and a clear thesis stating who and why\n• Three body paragraphs, each with one reason and supporting details\n• Smooth transitions between paragraphs\n• A conclusion that restates your thesis in new words",
    scaffolding: [
      "Hook: ___",
      "Thesis: I admire ___ because ___, ___, and ___.",
      "Body 1 topic sentence: First, ___.",
      "Body 2 topic sentence: In addition, ___.",
      "Body 3 topic sentence: Most importantly, ___.",
      "Conclusion: ___",
    ],
    wordCountTarget: { min: 300, max: 550 },
    rubricCriteria: [
      { name: "Introduction", description: "Hook plus a clear, focused thesis" },
      { name: "Body paragraphs", description: "Three paragraphs, each with one main point and details" },
      { name: "Transitions", description: "Ideas flow smoothly between paragraphs" },
      { name: "Conclusion", description: "Restates the thesis without simply repeating it" },
      { name: "Conventions", description: "Grammar, spelling, paragraphing" },
    ],
  },
  {
    id: "w6-how-to-essay",
    levelCode: "W6",
    title: "How to Make the World Better",
    type: "essay",
    prompt: "Write a 5-paragraph essay explaining three things students your age could do to make their school or community better. Use a clear thesis, one idea per body paragraph, and transitions to connect them.",
    wordCountTarget: { min: 300, max: 550 },
  },
  {
    id: "w6-compare",
    levelCode: "W6",
    title: "Then and Now",
    type: "essay",
    prompt: "Write a multi-paragraph essay comparing life today with life 100 years ago. Introduce your thesis, devote each body paragraph to one area of comparison (school, communication, travel), and conclude with a thoughtful final idea.",
    wordCountTarget: { min: 350, max: 550 },
  },
];

// ─────────────────────────────────────────────
// W7 — Narrative Writing (Grade 7–9)
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
  {
    id: "w7-found-object",
    levelCode: "W7",
    title: "The Mysterious Object",
    type: "narrative",
    prompt: "Your character finds a strange object that no one can explain. Write a narrative with a clear plot (exposition, rising action, climax, resolution). Build suspense and reveal the mystery — or leave it unsolved — at the climax.",
    wordCountTarget: { min: 350, max: 600 },
  },
  {
    id: "w7-show-dont-tell",
    levelCode: "W7",
    title: "Show, Don't Tell",
    type: "narrative",
    prompt: "Write a short scene in which your character feels a strong emotion (fear, joy, anger) — but never name the emotion. Instead, SHOW it through actions, body language, dialogue, and setting so the reader feels it.",
    wordCountTarget: { min: 200, max: 450 },
  },
];

// ─────────────────────────────────────────────
// W8 — Persuasive Writing (Grade 8–10)
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
  {
    id: "w8-screen-time",
    levelCode: "W8",
    title: "Is Screen Time Harmful?",
    type: "persuasive",
    prompt: "Write a persuasive essay arguing whether young people spend too much time on screens. State a clear thesis, support it with at least three reasons backed by evidence, fairly present and refute one counterargument, and end with a call to action.",
    wordCountTarget: { min: 500, max: 800 },
  },
];

// ─────────────────────────────────────────────
// W8 — Informational & Expository (W0–W9 realignment: W8 is now informational;
// the persuasive prompts above became W9)
// ─────────────────────────────────────────────

export const PROMPTS_W8_INFO: WritingPrompt[] = [
  {
    id: "w8-how-to",
    levelCode: "W8",
    title: "How To Make It",
    type: "essay",
    prompt: "Choose something you know how to make or do (a sandwich, a paper plane, a free throw). Write a HOW-TO explanation with a materials list and numbered steps in order. Use sequence words: first, next, then, finally.",
    scaffolding: ["You will need: ___", "First, ___", "Next, ___", "Finally, ___"],
    rubricCriteria: [
      { name: "Order", description: "Steps are in an order that actually works" },
      { name: "Completeness", description: "Nothing important is missing — a stranger could follow it" },
      { name: "Sequence words", description: "First/next/then/finally guide the reader" },
    ],
    wordCountTarget: { min: 150, max: 350 },
  },
  {
    id: "w8-compare",
    levelCode: "W8",
    title: "Two Things Compared",
    type: "essay",
    prompt: "Pick two things you know well (two sports, two animals, two games). Write a comparison: one paragraph on how they are ALIKE, one on how they are DIFFERENT, and a closing sentence saying which you prefer and why.",
    scaffolding: ["___ and ___ are alike because ___", "They are different because ___"],
    rubricCriteria: [
      { name: "Both sides", description: "Real similarities AND real differences" },
      { name: "Organization", description: "Alike and different are kept in separate paragraphs" },
    ],
    wordCountTarget: { min: 200, max: 400 },
  },
  {
    id: "w8-report",
    levelCode: "W8",
    title: "Expert Report",
    type: "essay",
    prompt: "Write a short informational report about a topic you know a lot about. Include: a title, an introduction that names the topic, at least two body paragraphs each with ONE main idea and supporting facts, and a conclusion. No opinions — facts only.",
    rubricCriteria: [
      { name: "Structure", description: "Title, intro, body paragraphs, conclusion" },
      { name: "Facts not opinions", description: "Information a reader can check, not feelings" },
      { name: "Paragraph focus", description: "Each body paragraph sticks to one main idea" },
    ],
    wordCountTarget: { min: 250, max: 500 },
  },
  {
    id: "w8-explain-why",
    levelCode: "W8",
    title: "Explain Why It Happens",
    type: "essay",
    prompt: "Choose something that happens in nature (rain, seasons, shadows, why leaves change color). Explain WHY it happens, step by step, so a younger student could understand. Define any big words you use.",
    scaffolding: ["___ happens because ___", "First ___, which causes ___"],
    rubricCriteria: [
      { name: "Cause and effect", description: "Each step explains what causes the next" },
      { name: "Audience", description: "A younger student could follow it" },
    ],
    wordCountTarget: { min: 200, max: 400 },
  },
];

// ─────────────────────────────────────────────
// Index — W0–W9 realigned map. W9 carries the persuasive prompts (formerly
// filed under W8); W0 handwriting has its own dedicated printable at
// /print/handwriting (tracing can't live in a prompt card).
// ─────────────────────────────────────────────

export const ALL_PROMPTS: Record<string, WritingPrompt[]> = {
  W1: PROMPTS_W1,
  W2: PROMPTS_W2,
  W3: PROMPTS_W3,
  W4: PROMPTS_W4,
  W5: PROMPTS_W5,
  W6: PROMPTS_W6,
  W7: PROMPTS_W7,
  W8: PROMPTS_W8_INFO,
  W9: PROMPTS_W8.map((p) => ({ ...p, levelCode: "W9" })),
};

export const WRITING_LEVEL_NAMES: Record<string, string> = {
  W1: "Sentence Completion & Building",
  W2: "Parts of Speech & Word Choice",
  W3: "Sentence Structure & Variety",
  W4: "Punctuation & Mechanics",
  W5: "Paragraph Structure",
  W6: "Essay Structure & Research",
  W7: "Narrative Writing",
  W8: "Informational & Expository",
  W9: "Persuasive & Argumentative",
};

export function getPromptsByLevel(levelCode: string): WritingPrompt[] {
  return ALL_PROMPTS[levelCode] ?? [];
}
