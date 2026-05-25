// src/components/marketing/CurriculumTables.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type SubjectKey = "math" | "reading" | "writing" | "science";

const CURRICULUM: Record<SubjectKey, {
  name: string;
  totalWorksheets: number;
  levels: { code: string; name: string; grade: string; sheets: number }[];
}> = {
  math: {
    name: "Mathematics",
    totalWorksheets: 5060,
    levels: [
      { code: "M1", name: "Early Counting", grade: "Pre-K", sheets: 220 },
      { code: "M2", name: "Number Sense", grade: "Pre-K – K", sheets: 220 },
      { code: "M3", name: "Addition Within Ten", grade: "K – Grade 1", sheets: 220 },
      { code: "M4", name: "Adding & Subtracting", grade: "Grade 1 – 2", sheets: 220 },
      { code: "M5", name: "Multiplication Fluency", grade: "Grade 2 – 4", sheets: 240 },
      { code: "M6", name: "Division Foundations", grade: "Grade 3 – 5", sheets: 240 },
      { code: "M7", name: "Fractions", grade: "Grade 4 – 6", sheets: 240 },
      { code: "M8", name: "Decimals & Percentages", grade: "Grade 5 – 6", sheets: 240 },
      { code: "M9", name: "Ratios & Proportions", grade: "Grade 6 – 7", sheets: 220 },
      { code: "M10", name: "Pre-Algebra", grade: "Grade 7 – 8", sheets: 240 },
      { code: "M11", name: "Linear Equations", grade: "Grade 8 – 9", sheets: 220 },
      { code: "M12", name: "Polynomials", grade: "Grade 9 – 10", sheets: 220 },
      { code: "M13", name: "Quadratics", grade: "Grade 9 – 10", sheets: 220 },
      { code: "M14", name: "Functions", grade: "Grade 10 – 11", sheets: 220 },
      { code: "M15", name: "Trigonometry", grade: "Grade 11 – 12", sheets: 240 },
      { code: "M16", name: "Algebra II", grade: "Grade 11 – 12", sheets: 220 },
      { code: "M17", name: "Pre-Calculus", grade: "Grade 12", sheets: 220 },
      { code: "M18", name: "Calculus", grade: "Grade 12", sheets: 240 },
    ],
  },
  reading: {
    name: "Reading",
    totalWorksheets: 3260,
    levels: [
      { code: "R1", name: "Letter Recognition", grade: "Pre-K", sheets: 200 },
      { code: "R2", name: "Long Vowels", grade: "Grade 1 – 2", sheets: 200 },
      { code: "R3", name: "Sight Words", grade: "Grade 1 – 2", sheets: 200 },
      { code: "R4", name: "Vocabulary in Context", grade: "Grade 2 – 4", sheets: 200 },
      { code: "R5", name: "Reading Comprehension", grade: "Grade 3 – 5", sheets: 220 },
      { code: "R6", name: "Inference & Prediction", grade: "Grade 4 – 6", sheets: 220 },
      { code: "R7", name: "Author's Purpose", grade: "Grade 5 – 7", sheets: 220 },
      { code: "R8", name: "Figurative Language", grade: "Grade 6 – 8", sheets: 220 },
      { code: "R9", name: "Literary Analysis", grade: "Grade 7 – 9", sheets: 240 },
    ],
  },
  writing: {
    name: "Writing",
    totalWorksheets: 2400,
    levels: [
      { code: "W1", name: "Sentence Completion", grade: "Grade 1 – 2", sheets: 200 },
      { code: "W2", name: "Parts of Speech", grade: "Grade 2 – 4", sheets: 220 },
      { code: "W3", name: "Sentence Structure", grade: "Grade 3 – 5", sheets: 220 },
      { code: "W4", name: "Punctuation", grade: "Grade 4 – 6", sheets: 220 },
      { code: "W5", name: "Paragraph Structure", grade: "Grade 5 – 7", sheets: 220 },
      { code: "W6", name: "Essay Structure", grade: "Grade 6 – 8", sheets: 240 },
      { code: "W7", name: "Narrative Writing", grade: "Grade 7 – 9", sheets: 220 },
      { code: "W8", name: "Persuasive Writing", grade: "Grade 8 – 10", sheets: 240 },
    ],
  },
  science: {
    name: "Science",
    totalWorksheets: 1900,
    levels: [
      { code: "S1", name: "Life Science Basics", grade: "Grade 2 – 4", sheets: 200 },
      { code: "S2", name: "Ecosystems", grade: "Grade 3 – 5", sheets: 220 },
      { code: "S3", name: "Earth Science", grade: "Grade 4 – 6", sheets: 220 },
      { code: "S4", name: "States of Matter", grade: "Grade 5 – 7", sheets: 220 },
      { code: "S5", name: "Biology", grade: "Grade 6 – 8", sheets: 220 },
      { code: "S6", name: "Chemistry", grade: "Grade 7 – 9", sheets: 220 },
      { code: "S7", name: "Physics", grade: "Grade 8 – 10", sheets: 240 },
    ],
  },
};

export function CurriculumTables() {
  const [active, setActive] = useState<SubjectKey>("math");
  const data = CURRICULUM[active];
  const total = Object.values(CURRICULUM).reduce((sum, s) => sum + s.totalWorksheets, 0);

  return (
    <div>
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
            {CURRICULUM[key].name} <span className="text-xs opacity-60">·{CURRICULUM[key].levels.length}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Level</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Topic</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Grade range</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Worksheets</th>
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
                <td className="px-5 py-3 text-right font-semibold">{level.sheets}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-border bg-cream-dark">
              <td colSpan={3} className="px-5 py-3 font-semibold text-right">Total worksheets in {data.name}</td>
              <td className="px-5 py-3 text-right font-serif font-bold text-base">
                {data.totalWorksheets.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center text-sm text-muted">
        Total across all 4 subjects: <strong className="font-serif text-ink text-base">{total.toLocaleString()}+ worksheets</strong>
      </div>
    </div>
  );
}
