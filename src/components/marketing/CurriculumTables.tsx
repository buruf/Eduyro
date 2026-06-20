// src/components/marketing/CurriculumTables.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type SubjectKey = "math" | "reading" | "writing" | "science";

const CURRICULUM: Record<SubjectKey, {
  name: string;
  icon: string;
  description: string;
  levels: { code: string; name: string; grade: string; skills: number; sheetsPerSkill: string }[];
}> = {
  math: {
    name: "Mathematics",
    icon: "Σ",
    description: "From counting to calculus — every arithmetic and algebraic concept sequenced for mastery.",
    levels: [
      { code: "M1",  name: "Early Counting",        grade: "Pre-K",          skills: 5, sheetsPerSkill: "30+" },
      { code: "M2",  name: "Number Sense",           grade: "Pre-K – K",      skills: 3, sheetsPerSkill: "30+" },
      { code: "M3",  name: "Addition",               grade: "K – Grade 1",    skills: 3, sheetsPerSkill: "30+" },
      { code: "M4",  name: "Subtraction",            grade: "Grade 1 – 2",    skills: 3, sheetsPerSkill: "30+" },
      { code: "M5",  name: "Multiplication Fluency", grade: "Grade 2 – 4",    skills: 5, sheetsPerSkill: "30+" },
      { code: "M6",  name: "Division Foundations",   grade: "Grade 3 – 5",    skills: 5, sheetsPerSkill: "30+" },
      { code: "M7",  name: "Fractions",              grade: "Grade 4 – 6",    skills: 4, sheetsPerSkill: "30+" },
      { code: "M8",  name: "Decimals & Percentages", grade: "Grade 5 – 6",    skills: 3, sheetsPerSkill: "30+" },
      { code: "M9",  name: "Ratios & Proportions",   grade: "Grade 6 – 7",    skills: 3, sheetsPerSkill: "30+" },
      { code: "M10", name: "Pre-Algebra",            grade: "Grade 7 – 8",    skills: 4, sheetsPerSkill: "30+" },
      { code: "M11", name: "Linear Equations",       grade: "Grade 8 – 9",    skills: 3, sheetsPerSkill: "30+" },
      { code: "M12", name: "Polynomials",            grade: "Grade 9 – 10",   skills: 3, sheetsPerSkill: "30+" },
      { code: "M13", name: "Quadratics",             grade: "Grade 9 – 10",   skills: 3, sheetsPerSkill: "30+" },
      { code: "M14", name: "Functions",              grade: "Grade 10 – 11",  skills: 3, sheetsPerSkill: "30+" },
      { code: "M15", name: "Trigonometry",           grade: "Grade 11 – 12",  skills: 3, sheetsPerSkill: "30+" },
      { code: "M16", name: "Algebra II",             grade: "Grade 11 – 12",  skills: 3, sheetsPerSkill: "30+" },
      { code: "M17", name: "Pre-Calculus",           grade: "Grade 12",       skills: 3, sheetsPerSkill: "30+" },
      { code: "M18", name: "Calculus",               grade: "Grade 12",       skills: 3, sheetsPerSkill: "30+" },
    ],
  },
  reading: {
    name: "Reading",
    icon: "📖",
    description: "Letter recognition through literary analysis — building fluent, confident readers.",
    levels: [
      { code: "R1", name: "Letter Recognition",      grade: "Pre-K",         skills: 1, sheetsPerSkill: "30+" },
      { code: "R2", name: "Long Vowels & Phonics",   grade: "Grade 1 – 2",   skills: 4, sheetsPerSkill: "20+" },
      { code: "R3", name: "Sight Words",             grade: "Grade 1 – 2",   skills: 1, sheetsPerSkill: "30+" },
      { code: "R4", name: "Vocabulary in Context",   grade: "Grade 2 – 4",   skills: 2, sheetsPerSkill: "30+" },
      { code: "R5", name: "Reading Comprehension",   grade: "Grade 3 – 5",   skills: 3, sheetsPerSkill: "30+" },
      { code: "R6", name: "Inference & Prediction",  grade: "Grade 4 – 6",   skills: 2, sheetsPerSkill: "30+" },
      { code: "R7", name: "Author's Purpose",        grade: "Grade 5 – 7",   skills: 1, sheetsPerSkill: "30+" },
      { code: "R8", name: "Figurative Language",     grade: "Grade 6 – 8",   skills: 1, sheetsPerSkill: "30+" },
      { code: "R9", name: "Literary Analysis",       grade: "Grade 7 – 9",   skills: 3, sheetsPerSkill: "30+" },
    ],
  },
  writing: {
    name: "Writing",
    icon: "✏️",
    description: "Parts of speech through persuasive essays — structured writing skills for every grade.",
    levels: [
      { code: "W1", name: "Sentence Completion",   grade: "Grade 1 – 2",  skills: 2, sheetsPerSkill: "30+" },
      { code: "W2", name: "Parts of Speech",       grade: "Grade 2 – 4",  skills: 6, sheetsPerSkill: "30+" },
      { code: "W3", name: "Sentence Structure",    grade: "Grade 3 – 5",  skills: 2, sheetsPerSkill: "30+" },
      { code: "W4", name: "Punctuation",           grade: "Grade 4 – 6",  skills: 2, sheetsPerSkill: "30+" },
      { code: "W5", name: "Paragraph Structure",   grade: "Grade 5 – 7",  skills: 2, sheetsPerSkill: "30+" },
      { code: "W6", name: "Essay Structure",       grade: "Grade 6 – 8",  skills: 2, sheetsPerSkill: "30+" },
      { code: "W7", name: "Narrative Writing",     grade: "Grade 7 – 9",  skills: 1, sheetsPerSkill: "30+" },
      { code: "W8", name: "Persuasive Writing",    grade: "Grade 8 – 10", skills: 2, sheetsPerSkill: "30+" },
    ],
  },
  science: {
    name: "Science",
    icon: "🔬",
    description: "Life science through physics — key concepts with practice questions at every level.",
    levels: [
      { code: "S1", name: "Life Science Basics", grade: "Grade 2 – 4",  skills: 2, sheetsPerSkill: "30+" },
      { code: "S2", name: "Ecosystems",          grade: "Grade 3 – 5",  skills: 2, sheetsPerSkill: "30+" },
      { code: "S3", name: "Earth Science",       grade: "Grade 4 – 6",  skills: 4, sheetsPerSkill: "30+" },
      { code: "S4", name: "States of Matter",    grade: "Grade 5 – 7",  skills: 2, sheetsPerSkill: "30+" },
      { code: "S5", name: "Biology",             grade: "Grade 6 – 8",  skills: 3, sheetsPerSkill: "30+" },
      { code: "S6", name: "Chemistry",           grade: "Grade 7 – 9",  skills: 3, sheetsPerSkill: "30+" },
      { code: "S7", name: "Physics",             grade: "Grade 8 – 10", skills: 5, sheetsPerSkill: "30+" },
    ],
  },
};

export function CurriculumTables() {
  const [active, setActive] = useState<SubjectKey>("math");
  const data = CURRICULUM[active];

  const totalLevels = Object.values(CURRICULUM).reduce((s, c) => s + c.levels.length, 0);
  const totalSkills = Object.values(CURRICULUM).reduce(
    (s, c) => s + c.levels.reduce((ls, l) => ls + l.skills, 0), 0
  );

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg">
        {[
          { n: `${totalLevels}`, label: "levels across 4 subjects" },
          { n: `${totalSkills}+`, label: "individual skills" },
          { n: "Unlimited", label: "worksheets generated fresh" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-border rounded-xl p-4 text-center">
            <div className="font-serif text-2xl font-bold text-ink">{stat.n}</div>
            <div className="text-[11px] text-muted mt-0.5 leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(CURRICULUM) as SubjectKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all border-[1.5px]",
              active === key
                ? "bg-ink text-cream border-ink"
                : "bg-white text-ink border-border hover:border-ink"
            )}
          >
            {CURRICULUM[key].name}{" "}
            <span className="text-xs opacity-60">· {CURRICULUM[key].levels.length} levels</span>
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-muted mb-4">{data.description}</p>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Level</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Topic</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Grade range</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Skills</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Sheets/skill</th>
            </tr>
          </thead>
          <tbody>
            {data.levels.map((level) => (
              <tr key={level.code} className="border-t border-border hover:bg-cream-dark/30">
                <td className="px-5 py-3">
                  <span className="inline-block text-xs font-bold bg-brand-blue-light text-brand-blue px-2 py-1 rounded">
                    {level.code}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium">{level.name}</td>
                <td className="px-5 py-3 text-muted">{level.grade}</td>
                <td className="px-5 py-3 text-right font-semibold">{level.skills}</td>
                <td className="px-5 py-3 text-right">
                  <span className="text-brand-green font-semibold">{level.sheetsPerSkill}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-brand-green flex-shrink-0">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414z"/>
        </svg>
        Math worksheets are generated fresh every time by our problem engine. Reading, Writing &amp; Science draw from large curated question banks, so practice keeps rotating through new material.
      </div>
    </div>
  );
}
