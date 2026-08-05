// src/lib/reading/curriculum.ts
// THE READING CURRICULUM — user's R1–R60 map (Grades 1–10, ~250 units).
// Single source of truth: the DB migration, seed and (later) the reading
// engines all derive from this file — edit here, never in three places.
//
// Unit names are deliberately KEYWORD-RICH so the existing generator routing
// picks the right bank (e.g. "Beginning Letter Sounds" → letter-sounds bank);
// units without a dedicated bank yet fall back to the passage-comprehension
// bank until their Phase-1+ engine lands.
//
// Council amendments (approved): fluency modules (R3, R12) are parent-guided
// PRINTABLES (timed read-alouds) with a readiness-MC layer in-app; overlapping
// topics across grades are spiral-by-design — unit names state the step up.

export interface ReadingModule {
  code: string;        // R1..R60
  topic: string;
  grade: number;       // 1..10
  units: string[];     // ordered micro-skills (30+ lessons each at maturity)
}

export const READING_CURRICULUM: ReadingModule[] = [
  // ── Grade 1 ────────────────────────────────────────────────────────────────
  { code: "R1", topic: "Print Concepts & Phonics Review", grade: 1, units: [
    "Letter Recognition Review", "Beginning Letter Sounds", "Short Vowels & Blending Review", "Consonant Blends & Digraphs", "Word Families & Rhyme" ] },
  { code: "R2", topic: "High-Frequency Words", grade: 1, units: [
    "First 50 Sight Words", "Next 50 Sight Words", "Sight Words in Sentences", "Tricky Sight Words" ] },
  { code: "R3", topic: "Reading Fluency", grade: 1, units: [
    "Smooth Word Reading", "Phrase Reading", "Sentence Fluency Practice", "Reading with Expression" ] },
  { code: "R4", topic: "Vocabulary Foundations", grade: 1, units: [
    "Everyday Naming Words", "Opposites (Antonyms)", "Words That Mean the Same (Synonyms)", "Sorting Words into Categories" ] },
  { code: "R5", topic: "Sentence Comprehension", grade: 1, units: [
    "Who & What Questions", "Where & When Questions", "What a Sentence Means", "Following Written Directions" ] },
  { code: "R6", topic: "Story Comprehension", grade: 1, units: [
    "Story Elements: Characters", "Story Elements: Setting", "Beginning, Middle & End", "Problem & Solution in Stories", "Retelling a Story" ] },

  // ── Grade 2 ────────────────────────────────────────────────────────────────
  { code: "R7", topic: "Paragraph Reading", grade: 2, units: [
    "Reading a Whole Paragraph", "Topic of a Paragraph", "Details in a Paragraph", "Paragraph Mechanics & Order" ] },
  { code: "R8", topic: "Vocabulary Expansion", grade: 2, units: [
    "Prefixes & Suffixes", "Compound Words", "Words with Multiple Meanings", "Word Relationships & Shades of Meaning" ] },
  { code: "R9", topic: "Main Idea & Details", grade: 2, units: [
    "Finding the Main Idea", "Supporting Details", "Main Idea in Nonfiction", "Titles, Headings & Main Idea" ] },
  { code: "R10", topic: "Sequencing Events", grade: 2, units: [
    "First, Next, Last", "Sequencing a Story", "Sequencing Steps in Nonfiction" ] },
  { code: "R11", topic: "Compare & Contrast", grade: 2, units: [
    "Alike & Different", "Comparing Two Characters", "Comparing Two Texts" ] },
  { code: "R12", topic: "Reading Fluency II", grade: 2, units: [
    "Longer Sentence Fluency", "Paragraph Fluency Practice", "Expression & Punctuation Cues" ] },

  // ── Grade 3 ────────────────────────────────────────────────────────────────
  { code: "R13", topic: "Fiction Reading Skills", grade: 3, units: [
    "Story Elements in Depth", "Character Feelings & Motives", "Plot: Problem to Solution", "Lessons a Story Teaches", "Fiction Retelling & Summary" ] },
  { code: "R14", topic: "Nonfiction Reading Skills", grade: 3, units: [
    "Nonfiction Main Idea", "Key Details & Facts", "Text Features: Headings & Captions", "Diagrams, Charts & Maps", "Nonfiction Summary" ] },
  { code: "R15", topic: "Context Clues", grade: 3, units: [
    "Context Clues: Definition Clues", "Context Clues: Example Clues", "Context Clues: Contrast Clues" ] },
  { code: "R16", topic: "Cause & Effect", grade: 3, units: [
    "Cause & Effect in Stories", "Cause & Effect in Nonfiction", "Signal Words: Because, So, Since" ] },
  { code: "R17", topic: "Fact vs Opinion", grade: 3, units: [
    "Spotting Facts", "Spotting Opinions", "Fact & Opinion Together" ] },
  { code: "R18", topic: "Summarizing", grade: 3, units: [
    "Somebody-Wanted-But-So-Then", "Summarizing Fiction", "Summarizing Nonfiction", "Shrinking a Paragraph" ] },

  // ── Grade 4 ────────────────────────────────────────────────────────────────
  { code: "R19", topic: "Inference", grade: 4, units: [
    "Inference from Clues", "Inference: Feelings & Traits", "Inference in Nonfiction", "Making Predictions from Evidence", "Inference & Evidence Together" ] },
  { code: "R20", topic: "Author's Purpose", grade: 4, units: [
    "Purpose: Persuade, Inform, Entertain", "Perspective & Purpose in Texts", "Purpose & Word Choice" ] },
  { code: "R21", topic: "Theme", grade: 4, units: [
    "Theme & Moral of a Story", "Theme vs Topic", "Theme Across Fables", "Evidence for a Theme" ] },
  { code: "R22", topic: "Character Analysis", grade: 4, units: [
    "Character Traits & Evidence", "Character Change Over a Story", "Character Relationships", "Judging a Character's Choices" ] },
  { code: "R23", topic: "Text Features", grade: 4, units: [
    "Text Features: Print & Layout", "Graphs, Timelines & Sidebars", "Using Features to Find Information" ] },
  { code: "R24", topic: "Reference Skills", grade: 4, units: [
    "Dictionary & Glossary Skills", "Encyclopedia & Atlas Skills", "Choosing the Right Reference" ] },

  // ── Grade 5 ────────────────────────────────────────────────────────────────
  { code: "R25", topic: "Figurative Language", grade: 5, units: [
    "Similes & Metaphors", "Idioms & Proverbs", "Personification & Hyperbole", "Literary Devices in Poems" ] },
  { code: "R26", topic: "Point of View", grade: 5, units: [
    "First & Third Person Point of View", "Narrator vs Character Point of View", "How Point of View Shapes a Story" ] },
  { code: "R27", topic: "Making Inferences", grade: 5, units: [
    "Inference in Longer Fiction", "Inference in Informational Text", "Inference from Dialogue", "Multi-Clue Inference" ] },
  { code: "R28", topic: "Drawing Conclusions", grade: 5, units: [
    "Conclusions from Evidence", "Conclusions Across Paragraphs", "Checking a Conclusion Against the Text" ] },
  { code: "R29", topic: "Analyzing Arguments", grade: 5, units: [
    "Claims & Reasons", "Evidence That Supports a Claim", "Weak vs Strong Arguments" ] },
  { code: "R30", topic: "Reading Across Sources", grade: 5, units: [
    "Comparing Two Accounts", "Combining Facts from Two Texts", "When Sources Disagree" ] },

  // ── Grade 6 ────────────────────────────────────────────────────────────────
  { code: "R31", topic: "Literary Analysis", grade: 6, units: [
    "Analyzing Plot Structure", "Analyzing Character & Conflict", "Theme & Moral in Depth", "Tone & Mood", "Author's Craft in Fiction" ] },
  { code: "R32", topic: "Informational Analysis", grade: 6, units: [
    "Text Structure: Cause, Compare, Sequence", "Central Idea & Development", "Analyzing an Explanation", "Graphics & Data in Text", "Summarizing Complex Information" ] },
  { code: "R33", topic: "Evaluating Evidence", grade: 6, units: [
    "Relevant vs Irrelevant Evidence", "Sufficient vs Insufficient Evidence", "Tracing an Argument's Evidence", "Evaluating Sources of Evidence" ] },
  { code: "R34", topic: "Bias & Perspective", grade: 6, units: [
    "Detecting Bias in a Text", "Loaded Language", "Perspective & What's Left Out", "Balanced vs One-Sided Accounts" ] },
  { code: "R35", topic: "Academic Vocabulary", grade: 6, units: [
    "Greek & Latin Roots", "Academic Word Families", "Context Clues in Academic Text" ] },
  { code: "R36", topic: "Reading for Research", grade: 6, units: [
    "Skimming & Scanning", "Taking Notes from a Text", "Citing Where You Found It" ] },

  // ── Grade 7 ────────────────────────────────────────────────────────────────
  { code: "R37", topic: "Analyzing Complex Text", grade: 7, units: [
    "Dense Paragraph Analysis", "Multi-Step Reasoning in Text", "Implicit Main Ideas", "Structure of Complex Arguments", "Rereading Strategies" ] },
  { code: "R38", topic: "Historical Documents", grade: 7, units: [
    "Reading Historical Speeches", "Letters & Diaries as Sources", "Founding Documents", "Historical Context & Meaning" ] },
  { code: "R39", topic: "Scientific Reading", grade: 7, units: [
    "Reading Scientific Explanations", "Data, Tables & Results", "Hypotheses & Conclusions in Text", "Science Vocabulary in Context" ] },
  { code: "R40", topic: "Technical Reading", grade: 7, units: [
    "Manuals & Instructions", "Technical Diagrams & Specifications", "Precise Language in Technical Text" ] },
  { code: "R41", topic: "Evaluating Claims", grade: 7, units: [
    "Claim, Evidence & Reasoning", "Spotting Unsupported Claims", "Correlation vs Causation Claims", "Evaluating Statistics in Text" ] },
  { code: "R42", topic: "Synthesizing Information", grade: 7, units: [
    "Synthesis from Two Sources", "Synthesis from Three+ Sources", "Resolving Conflicting Information", "Building One Answer from Many Texts" ] },

  // ── Grade 8 ────────────────────────────────────────────────────────────────
  { code: "R43", topic: "Classic Literature", grade: 8, units: [
    "Reading Classic Prose", "Older Language & Vocabulary", "Classic Short Stories", "Poetry Classics", "Classic Themes Across Eras" ] },
  { code: "R44", topic: "Modern Literature", grade: 8, units: [
    "Contemporary Short Fiction", "Modern Narrative Voices", "Modern Poetry", "Global Voices", "Comparing Modern & Classic" ] },
  { code: "R45", topic: "Rhetorical Devices", grade: 8, units: [
    "Ethos, Pathos, Logos", "Repetition, Parallelism & Rhetorical Questions", "Irony & Understatement", "Analyzing a Persuasive Speech" ] },
  { code: "R46", topic: "Symbolism & Motifs", grade: 8, units: [
    "Symbols in Stories", "Recurring Motifs", "Allegory Basics", "Interpreting Symbolic Endings" ] },
  { code: "R47", topic: "Critical Reading", grade: 8, units: [
    "Questioning the Text", "Author's Assumptions", "What the Text Doesn't Say", "Evaluating the Author's Logic", "Reader vs Author Meaning" ] },
  { code: "R48", topic: "Comparative Text Analysis", grade: 8, units: [
    "Comparing Themes Across Texts", "Comparing Structure & Craft", "Same Event, Two Genres", "Comparative Essay Reading" ] },

  // ── Grade 9 ────────────────────────────────────────────────────────────────
  { code: "R49", topic: "Advanced Literary Analysis", grade: 9, units: [
    "Characterization Techniques", "Narrative Structure & Time", "Diction & Syntax Analysis", "Imagery & Extended Metaphor", "Analyzing a Full Scene" ] },
  { code: "R50", topic: "Persuasive Text Analysis", grade: 9, units: [
    "Anatomy of an Op-Ed", "Persuasive Structure & Strategy", "Audience & Appeal", "Evaluating Persuasive Success" ] },
  { code: "R51", topic: "Argument Evaluation", grade: 9, units: [
    "Premises & Conclusions", "Logical Fallacies", "Counterarguments & Rebuttals", "Judging Argument Strength" ] },
  { code: "R52", topic: "Research Reading", grade: 9, units: [
    "Reading Abstracts & Summaries", "Evaluating Source Credibility", "Primary vs Secondary Sources", "Synthesizing Research Findings" ] },
  { code: "R53", topic: "Reading Primary Sources", grade: 9, units: [
    "Speeches as Primary Sources", "Legal & Government Documents", "First-Person Historical Accounts", "Interpreting Period Language" ] },
  { code: "R54", topic: "SAT & Academic Reading Skills", grade: 9, units: [
    "Evidence-Based Question Strategy", "Paired Passages Strategy", "Vocabulary in Context Under Time" ] },

  // ── Grade 10 ───────────────────────────────────────────────────────────────
  { code: "R55", topic: "College-Level Reading", grade: 10, units: [
    "Academic Journal Style", "Long-Form Essays", "Lecture-Companion Reading", "Dense Argument Chains", "Annotating for Mastery" ] },
  { code: "R56", topic: "Literary Criticism", grade: 10, units: [
    "What Critics Do", "Lenses: Historical & Biographical", "Lenses: Social & Cultural", "Reading a Critical Essay", "Writing About Literature (Reading Side)" ] },
  { code: "R57", topic: "Philosophical Texts", grade: 10, units: [
    "Reading Philosophical Arguments", "Thought Experiments in Text", "Classic Philosophy Excerpts", "Evaluating Philosophical Claims" ] },
  { code: "R58", topic: "Scientific & Technical Texts", grade: 10, units: [
    "Research Papers: Methods & Results", "Technical Standards & Documentation", "Science Journalism vs the Source", "Reading Data-Heavy Texts" ] },
  { code: "R59", topic: "Media Literacy", grade: 10, units: [
    "News vs Opinion vs Sponsored", "Headlines, Framing & Clickbait", "Verifying Claims Online", "Algorithmic Feeds & Source Diversity" ] },
  { code: "R60", topic: "Independent Reading & Analysis", grade: 10, units: [
    "Choosing & Previewing Texts", "Sustained Reading Stamina", "Independent Analysis Essays (Reading Side)", "Discussion & Defense of a Reading", "Capstone: Full-Work Analysis" ] },
];

// Sanity: counts must match the user's map (5,4,4,4,4,5 | 4,4,4,3,3,3 | …).
export function validateReadingCurriculum(): string[] {
  const issues: string[] = [];
  const expected = [5,4,4,4,4,5, 4,4,4,3,3,3, 5,5,3,3,3,4, 5,3,4,4,3,3, 4,3,4,3,3,3, 5,5,4,4,3,3, 5,4,4,3,4,4, 5,5,4,4,5,4, 5,4,4,4,4,3, 5,5,4,4,4,5];
  if (READING_CURRICULUM.length !== 60) issues.push(`expected 60 modules, got ${READING_CURRICULUM.length}`);
  READING_CURRICULUM.forEach((m, i) => {
    if (m.code !== `R${i + 1}`) issues.push(`${m.code} out of order at index ${i}`);
    if (m.units.length !== expected[i]) issues.push(`${m.code} has ${m.units.length} units, map says ${expected[i]}`);
    if (m.grade !== Math.floor(i / 6) + 1) issues.push(`${m.code} grade ${m.grade} ≠ ${Math.floor(i / 6) + 1}`);
  });
  const names = READING_CURRICULUM.flatMap((m) => m.units);
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) issues.push("duplicate unit names across modules");
  return issues;
}
