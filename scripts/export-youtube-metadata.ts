// scripts/export-youtube-metadata.ts
// Emits a ready-to-paste YouTube metadata sheet (title, description, tags,
// and the bulk-edit field settings) for every lesson video, derived from the
// registry and the curriculum's OWN grade levels so nothing drifts from what
// a video actually teaches.
//
// Three rules learned the hard way:
//  - Tags are COMMA-SEPARATED on YouTube, so a label containing a comma
//    ("×2, ×5, ×10") silently becomes three junk tags. Commas are stripped.
//  - Grade comes from getMathSheetMeta().gradeLevel, not from a formula over
//    the level number, which had labelled a Grade 2-3 fractions video both
//    "middle school math" and "grade 4 math".
//  - Titles are what people TYPE. "×2" is unsearchable; "times tables" is.
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { ALL_LESSON_UNITS } from "../src/remotion/lesson/registry";
import { getMathLevelSkills, getMathSheetMeta } from "../src/lib/worksheet/generator";
import { ALL_LABEL_ALIASES, videoForSkillLabel } from "../src/remotion/lesson/units";

// SERVED label -> the curriculum's own grade string.
const labelGrade = new Map<string, string>();
for (let n = 1; n <= 18; n++) {
  const code = `M${n}`;
  for (const s of getMathLevelSkills(code)) {
    if (labelGrade.has(s.label)) continue;
    try {
      const g = getMathSheetMeta(code, s.range[0])?.gradeLevel;
      if (g) labelGrade.set(s.label, g);
    } catch { /* not generatable */ }
  }
}

// A video's OWN label is often not a served label ("Slope and intercept" is
// served as "Coordinate Plane - Patterns & intro to slope"). Resolve grade
// through the same alias map the player uses, so a Grade 8 algebra video is
// never advertised to elementary parents.
const videoGrade = new Map<string, string>();
for (const [servedLabel, grade] of labelGrade) {
  const v = videoForSkillLabel(servedLabel);
  if (v && !videoGrade.has(v.id)) videoGrade.set(v.id, grade);
}
for (const [servedLabel, videoId] of Object.entries(ALL_LABEL_ALIASES)) {
  const g = labelGrade.get(servedLabel);
  if (g && !videoGrade.has(videoId)) videoGrade.set(videoId, g);
}

/** "Grade 2-3" -> lowest numeric grade; "Kindergarten" -> 0. */
function gradeNumber(grade: string | undefined): number | null {
  if (!grade) return null;
  if (/kindergarten|pre-?k/i.test(grade)) return 0;
  const m = grade.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function gradeTags(grade: string | undefined): string[] {
  const g = gradeNumber(grade);
  // No grade data -> emit NO grade tag. A wrong grade tag is worse than none:
  // it puts an algebra lesson in front of parents of six-year-olds.
  if (g === null) return [];
  const out: string[] = [];
  if (g === 0) out.push("kindergarten math");
  else out.push(`grade ${g} math`);
  if (g <= 5) out.push("elementary math");
  else if (g <= 8) out.push("middle school math");
  else out.push("high school math");
  return out;
}

/** YouTube splits tags on commas, so a tag may never contain one. */
const asTag = (s: string) =>
  s
    .replace(/[—·↔]/g, " ")
    .replace(/\(.*?\)/g, " ")
    .replace(/×/g, "x")
    .replace(/÷/g, "divide")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function skillTags(label: string): string[] {
  const clean = asTag(label);
  const tags = new Set<string>();
  if (clean.length >= 4) tags.add(clean);
  if (/^(add|subtract|multiply|divide|solve|factor|graph|compare|order|count|simplify|evaluate|find)\b/.test(clean)) {
    tags.add(`how to ${clean}`);
  }
  tags.add(`${clean} for kids`);
  return [...tags].filter((t) => t.length >= 4 && t.length <= 60).slice(0, 4);
}

/** A title people would actually type into search. */
function title(label: string): string {
  const plain = label
    .replace(/×/g, "x")
    .replace(/÷/g, "÷")
    .replace(/\s*·\s*/g, ": ")
    .replace(/\s*—\s*/g, " — ")
    .trim();
  return `${plain} — Math Lesson for Kids | Eduyro`;
}

const BRAND = ["eduyro", "math for kids", "math lesson", "learn math", "math animation", "homeschool math"];

const rows = ALL_LESSON_UNITS.map((u) => {
  const grade = videoGrade.get(u.id) ?? labelGrade.get(u.label);
  const g = gradeNumber(grade);
  const all = [...BRAND, ...gradeTags(grade), ...skillTags(u.label)];
  // Dedupe, drop anything with a comma, respect YouTube's 500-char cap.
  const seen = new Set<string>();
  const tags: string[] = [];
  let chars = 0;
  for (const t of all) {
    const clean = t.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    if (!clean || seen.has(clean)) continue;
    if (chars + clean.length + 2 > 480) break;
    seen.add(clean);
    tags.push(clean);
    chars += clean.length + 2;
  }
  const hook = u.lines()[0]?.text.replace(/\s+/g, " ").trim() ?? "";
  const topic = g === null ? "mathhelp" : g <= 5 ? "elementarymath" : g <= 8 ? "middleschoolmath" : "algebra";
  return {
    file: `${u.id}.ramlah.mp4`,
    grade: grade ?? "—",
    title: title(u.label),
    tags: tags.join(", "),
    description: [
      hook,
      "",
      `A short animated lesson from Eduyro — mastery learning for Pre-K to Grade 12. Every skill gets a video like this one plus daily practice worksheets that adapt to how your child is doing.`,
      "",
      "Try it free: https://eduyro.com",
      "",
      `#math #${topic} #eduyro`,
    ].join("\n"),
  };
});

const desktop = existsSync(join(homedir(), "OneDrive", "Desktop"))
  ? join(homedir(), "OneDrive", "Desktop")
  : join(homedir(), "Desktop");
const out = join(desktop, "eduyro-lesson-videos", "YOUTUBE-METADATA.md");

const md = [
  "# YouTube upload metadata",
  "",
  "## Set these ONCE for all videos (Studio > Content > select all > Edit)",
  "",
  "| Bulk-edit field | Set to | Why |",
  "|---|---|---|",
  "| **Audience** | **Yes, made for kids** | Children's educational content. Legally required (COPPA) and it disables personalized ads, comments and notifications on these videos. |",
  "| **AI use** | No / not altered | The animation is rendered from code and the narration is a licensed cloned voice of a real person, not synthetic-media of someone else. Disclose only if YouTube's prompt describes your case. |",
  "| **Category** | Education | |",
  "| **Video language** | English | Enables auto-captions and search in-language. |",
  "| **Comments** | Disabled automatically | Made-for-kids videos cannot have comments; YouTube enforces this. |",
  "| **License** | Standard YouTube License | Keep the content yours. |",
  "| **Visibility** | Public (or Unlisted while testing) | |",
  "| **Embedding** | Allow | Lets you embed the same video on eduyro.com later. |",
  "| **Automatic chapters** | Off | Lessons are 30-60s; chapters add nothing and can mislabel. |",
  "| **Shorts remixing** | Allow video and audio | Free reach; the brand mark is burned into the frame. |",
  "| **User ratings** | Show likes | |",
  "| **Captions certificate** | Not broadcast on US TV | |",
  "| **Recording date** | leave blank | |",
  "",
  "Titles, tags and descriptions are per-video below.",
  "",
  "---",
  "",
  ...rows.flatMap((r) => [
    `## ${r.file}   _(${r.grade})_`,
    "",
    `**Title:** ${r.title}`,
    "",
    `**Tags:** ${r.tags}`,
    "",
    "**Description:**",
    "",
    "```",
    r.description,
    "```",
    "",
  ]),
].join("\n");

writeFileSync(out, md);
console.log(`Wrote metadata for ${rows.length} videos to:\n  ${out}`);
