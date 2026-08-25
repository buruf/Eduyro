// src/lib/lessons/catalog.ts
// The public lesson catalog: one entry per lesson video, with the grade the
// curriculum assigns it and real practice problems from the same generator
// students use.
//
// Everything derives from existing sources — the video registry, the
// curriculum's skill maps and grade levels, the alias layer the player uses,
// and generateProblems. Nothing here is hand-authored, so a public page can
// never advertise a lesson that differs from the one the platform teaches.
import { ALL_LESSON_UNITS } from "@/remotion/lesson/registry";
import { ALL_LABEL_ALIASES, videoForSkillLabel } from "@/remotion/lesson/units";
import {
  getMathLevelSkills,
  getMathSheetMeta,
  generateProblems,
} from "@/lib/worksheet/generator";

export interface LessonEntry {
  /** URL slug, e.g. "multiply-fractions". */
  slug: string;
  /** Video unit id, e.g. "cur-multiply-fractions". */
  id: string;
  /** Human label, e.g. "Multiply fractions". */
  label: string;
  /** Curriculum grade string ("Grade 5-6"), or null when unmapped. */
  grade: string | null;
  /** Lowest numeric grade, for sorting and grouping. 0 = kindergarten. */
  gradeNum: number | null;
  /** Level code that serves it, e.g. "M7". */
  levelCode: string | null;
  /** The served skill label (may differ from the video's own label). */
  servedLabel: string | null;
  /** First narration line — the lesson's hook, used as the page summary. */
  hook: string;
  /** The video file on the CDN. */
  videoFile: string;
}

const VOICE = "ramlah";

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/÷/g, " divide ")
    .replace(/[—·↔²]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function gradeNumber(grade: string | null): number | null {
  if (!grade) return null;
  if (/kindergarten|pre-?k/i.test(grade)) return 0;
  const m = grade.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

/** Built once per process: served label → { grade, levelCode }. */
function servedLabelIndex(): Map<string, { grade: string; levelCode: string }> {
  const out = new Map<string, { grade: string; levelCode: string }>();
  for (let n = 1; n <= 18; n++) {
    const levelCode = `M${n}`;
    let skills: { label: string; range: [number, number] }[] = [];
    try {
      skills = getMathLevelSkills(levelCode) as typeof skills;
    } catch {
      continue;
    }
    for (const s of skills) {
      if (out.has(s.label)) continue;
      try {
        const grade = getMathSheetMeta(levelCode, s.range[0])?.gradeLevel;
        if (grade) out.set(s.label, { grade, levelCode });
      } catch {
        /* not generatable */
      }
    }
  }
  return out;
}

let _catalog: LessonEntry[] | null = null;

export function lessonCatalog(): LessonEntry[] {
  if (_catalog) return _catalog;
  const served = servedLabelIndex();

  // video id → the served label that reaches it (direct match or alias), so a
  // page can show the grade and practice problems of the unit it really is.
  const byVideo = new Map<string, string>();
  for (const label of served.keys()) {
    const v = videoForSkillLabel(label);
    if (v && !byVideo.has(v.id)) byVideo.set(v.id, label);
  }
  for (const [label, videoId] of Object.entries(ALL_LABEL_ALIASES)) {
    if (served.has(label) && !byVideo.has(videoId)) byVideo.set(videoId, label);
  }

  const seen = new Set<string>();
  _catalog = ALL_LESSON_UNITS.map((u) => {
    const servedLabel = byVideo.get(u.id) ?? null;
    const info = servedLabel ? (served.get(servedLabel) ?? null) : null;
    let slug = slugify(u.label);
    while (seen.has(slug)) slug = `${slug}-2`;
    seen.add(slug);
    return {
      slug,
      id: u.id,
      label: u.label,
      grade: info?.grade ?? null,
      gradeNum: gradeNumber(info?.grade ?? null),
      levelCode: info?.levelCode ?? null,
      servedLabel,
      hook: u.lines()[0]?.text.replace(/\s+/g, " ").trim() ?? "",
      videoFile: `lesson-video/${u.id}.${VOICE}.mp4`,
    };
  });
  return _catalog;
}

export function lessonBySlug(slug: string): LessonEntry | null {
  return lessonCatalog().find((l) => l.slug === slug) ?? null;
}

/** Worksheet text carries LaTeX and viz directives meant for the PDF/practice
 *  renderers. A public page shows plain readable maths instead — a visitor
 *  must never see "\frac{1}{3}". */
export function readableMath(text: string): string {
  return text
    .replace(/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1/$2")
    .replace(/\[\[viz[^\]]*\]\]/g, "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}$]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SampleProblem {
  question: string;
  answer: string;
}

/**
 * A few real practice problems for a lesson, from the same generator that
 * builds student worksheets. Returns [] when the lesson has no served skill
 * (a video with no mapped unit) rather than inventing filler.
 */
export function sampleProblems(entry: LessonEntry, count = 4): SampleProblem[] {
  if (!entry.levelCode || !entry.servedLabel) return [];
  let skills: { label: string; range: [number, number] }[] = [];
  try {
    skills = getMathLevelSkills(entry.levelCode) as typeof skills;
  } catch {
    return [];
  }
  const skill = skills.find((s) => s.label === entry.servedLabel);
  if (!skill) return [];
  try {
    const { problems } = generateProblems({
      subjectSlug: "MATH",
      levelCode: entry.levelCode,
      skillName: entry.servedLabel,
      problemCount: 12,
      timeLimitMinutes: 10,
      sheetNumber: skill.range[0],
      totalSheets: 100,
    });
    return (problems as { question?: string; answer?: string; points?: number }[])
      .filter((p) => (p.points ?? 1) > 0 && p.question && p.answer)
      .filter((p) => !String(p.question).includes("READ THIS PASSAGE"))
      .slice(0, count)
      .map((p) => ({ question: readableMath(String(p.question)), answer: readableMath(String(p.answer)) }));
  } catch {
    return [];
  }
}

/** Grade buckets for the index page. */
export function groupedByGrade(): { heading: string; lessons: LessonEntry[] }[] {
  const buckets: { heading: string; test: (g: number | null) => boolean }[] = [
    { heading: "Kindergarten & Grade 1", test: (g) => g !== null && g <= 1 },
    { heading: "Grades 2–3", test: (g) => g !== null && g >= 2 && g <= 3 },
    { heading: "Grades 4–5", test: (g) => g !== null && g >= 4 && g <= 5 },
    { heading: "Grades 6–8", test: (g) => g !== null && g >= 6 && g <= 8 },
    { heading: "High school", test: (g) => g !== null && g >= 9 },
    { heading: "More lessons", test: (g) => g === null },
  ];
  const all = lessonCatalog();
  return buckets
    .map((b) => ({
      heading: b.heading,
      lessons: all
        .filter((l) => b.test(l.gradeNum))
        .sort((a, z) => (a.gradeNum ?? 99) - (z.gradeNum ?? 99) || a.label.localeCompare(z.label)),
    }))
    .filter((b) => b.lessons.length > 0);
}
