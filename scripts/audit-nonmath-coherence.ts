// scripts/audit-nonmath-coherence.ts — the non-math twin of the coherence
// audit: for EVERY reading/writing/science skill (from the DB, i.e. what
// students actually see), classify the skill label, the tutorial GOAL, and the
// teaching FAMILY into domain tags and fail on cross-topic surfaces.
import { PrismaClient } from "@prisma/client";
import { getMicroSkillLesson, getTutorial } from "../src/lib/worksheet/tutorials";
import { getLessonExtras, GENERIC } from "../src/lib/tutorials/lesson-extras";

type Tag =
  | "phonics" | "sightwords" | "fluency" | "vocab" | "comprehension" | "mainidea"
  | "inference" | "figurative" | "analysis" | "research" | "media"
  | "mechanics" | "grammar" | "sentence" | "paragraph" | "essay" | "narrative" | "persuasive" | "handwriting"
  | "scilife" | "sciearth" | "sciphys" | "scichem" | "scimethod";

const RULES: [Tag, RegExp][] = [
  // Science FIRST — science goals are full of words ("cause", "energy",
  // "structure", "observe") that reading rules would otherwise claim.
  ["scimethod", /scientific method|hypothes|experiment|variable|observ|measure|lab/i],
  ["scichem", /chemis|atoms?|element|molecule|acid|periodic|compound|reaction|state.*matter|solid|liquid|gas|melting/i],
  ["sciphys", /electric|circuit|magnet|force|motion|energy|machine|sound|light|heat|gravity|physics|wave/i],
  ["sciearth", /solar|planet|space|star|moon|earth|weather|season|water cycle|rock|volcano|fossil|climate/i],
  ["scilife", /animal|plant|\bbody\b|habitat|\bcell\b|living|life cycle|food (chain|web)|ecosystem|organ|senses|human|adapt|digest|biology/i],
  ["sightwords", /sight word|high.frequency/i],
  ["research", /research|citing|source|reference skill|dictionary|encyclopedia|library/i],
  ["phonics", /phonic|letter|vowel|consonant|blend|digraph|silent|rhym|syllab|decod|cvc|sound|print concept|alphabet/i],
  ["fluency", /fluency|expression|smooth|phrase reading|punctuation cues|stamina|pace/i],
  ["handwriting", /handwriting|letter (tracing|formation)|trac(e|ing) (letters|lines|shapes)|formation|copying (letters|words)|spatial|pencil/i],
  ["mainidea", /main idea|summariz|key detail|central|theme|moral/i],
  ["mechanics", /punctuat|capital|end mark|comma|apostrophe|quotation|spelling/i],
  ["grammar", /nouns?|verbs?|adjective|adverb|pronoun|tense|agreement|plural|conjunction|preposition|parts of speech|grammar/i],
  ["sentence", /sentence/i],
  // "conclusion" alone is an inference word ("a conclusion you draw from
  // evidence") — only essay-shaped conclusions count here.
  ["essay", /essay|\bthesis\b|five.paragraph|introduction|conclusion (paragraph|sentence)|concluding|claim|body paragraph/i],
  ["persuasive", /persuasi|argument|opinion|debate|convinc/i],
  ["narrative", /narrative|story writing|character.*setting|dialogue|personal story/i],
  ["paragraph", /paragraph|topic sentence|supporting detail|organiz/i],
  ["media", /media|advertis|website|digital/i],
  ["figurative", /figurative|simile|metaphor|idiom|personif|hyperbole|imagery|symbol|rhetoric|literary device|allusion|motif/i],
  ["vocab", /context clue/i],
  ["inference", /inference|inferring|conclusion|predict|clue|evidence|implied/i],
  ["analysis", /analy|critic|evaluat|compar|perspective|bias|point of view|author|purpose|tone|structure|genre|classic|literature|philosoph|primary source|historical|document|synthesiz/i],
  ["comprehension", /comprehension|read|passage|text|fiction|nonfiction|sequenc|cause|effect|fact.*opinion|question|retell|story|character|setting|plot|detail/i],
  ["vocab", /vocab|word|context clue|prefix|suffix|synonym|antonym|meaning|dictionary/i],
];
const tag = (t: string | null | undefined, subject?: string): Tag | null => {
  if (!t) return null;
  // Sci rules only bind for SCIENCE text — essay "Body", story "Elements",
  // "eMOTION" etc. would otherwise leak into science tags.
  for (const [g, re] of RULES) {
    if (g.startsWith("sci") && subject !== "SCIENCE") continue;
    if (re.test(t)) return g;
  }
  return null;
};

const COMPAT: Partial<Record<Tag, Tag[]>> = {
  phonics: ["phonics", "vocab", "comprehension", "fluency"],
  sightwords: ["sightwords", "phonics", "vocab", "fluency"],
  fluency: ["fluency", "phonics", "comprehension", "sightwords", "vocab"],
  vocab: ["vocab", "phonics", "comprehension", "figurative", "analysis", "essay", "grammar"],
  comprehension: ["comprehension", "mainidea", "inference", "vocab", "analysis", "narrative", "essay", "fluency", "research", "persuasive", "media", "sentence"],
  mainidea: ["mainidea", "comprehension", "analysis", "paragraph", "essay"],
  inference: ["inference", "comprehension", "analysis", "mainidea", "essay", "persuasive"],
  figurative: ["figurative", "vocab", "analysis", "comprehension"],
  analysis: ["analysis", "comprehension", "inference", "mainidea", "persuasive", "research", "figurative", "media", "essay", "vocab", "narrative"],
  research: ["research", "analysis", "vocab", "comprehension", "media", "essay", "mainidea", "paragraph"],
  media: ["media", "analysis", "persuasive", "research", "comprehension"],
  mechanics: ["mechanics", "sentence", "grammar"],
  grammar: ["grammar", "sentence", "mechanics", "vocab"],
  sentence: ["sentence", "grammar", "mechanics", "paragraph", "comprehension"],
  paragraph: ["paragraph", "sentence", "essay", "mainidea", "mechanics", "comprehension"],
  essay: ["essay", "paragraph", "persuasive", "research", "analysis", "mainidea", "sentence", "comprehension", "vocab"],
  narrative: ["narrative", "paragraph", "sentence", "comprehension", "figurative", "mainidea", "analysis", "inference"],
  persuasive: ["persuasive", "essay", "paragraph", "analysis", "comprehension", "media", "inference", "vocab", "mainidea"],
  handwriting: ["handwriting", "phonics", "sentence", "mechanics"],
  scilife: ["scilife", "scimethod", "sciearth", "sciphys"],
  sciearth: ["sciearth", "scimethod", "sciphys", "scilife"],
  sciphys: ["sciphys", "scimethod", "scichem", "sciearth"],
  scichem: ["scichem", "scimethod", "sciphys"],
  scimethod: ["scimethod", "scilife", "sciearth", "sciphys", "scichem"],
};
const ok = (u: Tag, s2: Tag | null) => s2 === null || s2 === u || (COMPAT[u] ?? [u]).includes(s2);

const db = new PrismaClient();
(async () => {
  const skills = await db.skill.findMany({
    where: { level: { isActive: true, subject: { slug: { in: ["READING", "WRITING", "SCIENCE"] } } } },
    select: { name: true, level: { select: { code: true, subject: { select: { slug: true } } } } },
    orderBy: [{ level: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  let fails = 0, checked = 0;
  for (const sk of skills) {
    const subj = sk.level.subject.slug;
    const unitTag = tag(sk.name, subj);
    if (!unitTag) continue;
    checked++;
    const ml = getMicroSkillLesson(sk.level.subject.slug, sk.level.code, sk.name);
    const ex = getLessonExtras(sk.name);
    const goalNamesSkill = sk.level.subject.slug === "READING" && !!ml?.goal?.includes(sk.name);
    // The tutorial's OWN name is the header the student reads ("LETTER
    // RECOGNITION · LESSON REVIEW" on a handwriting-copying lesson), and its
    // intro is the first paragraph — both were invisible to this audit.
    const tut = getTutorial(subj, sk.name);
    const surfaces: [string, Tag | null][] = [
      ["tutorial", tag(tut?.skillName, subj)],
      ["intro", tag(tut?.intro, subj)],
      ["goal", goalNamesSkill ? null : tag(ml?.goal, subj)],
      ["family", ex === GENERIC ? null : tag(`${ex.rule[0] ?? ""} ${ex.rule[1] ?? ""}`, subj)],
    ];
    const bad = surfaces.filter(([, t]) => !ok(unitTag, t));
    if (bad.length) {
      fails++;
      console.log(`✗ ${sk.level.subject.slug} ${sk.level.code} [${sk.name}] unit=${unitTag}`);
      for (const [n, t] of bad) console.log(`    ${n} → ${t}  ("${(n === "goal" ? ml?.goal : n === "tutorial" ? tut?.skillName : n === "intro" ? tut?.intro : ex.rule[0])?.slice(0, 65)}")`);
    }
  }
  console.log(`\nnon-math skills checked: ${checked}, coherence failures: ${fails}`);
  await db.$disconnect();
  process.exit(fails ? 1 : 0);
})();
