// src/app/pdf-generator/page.tsx
"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui";
import { cn } from "@/lib/utils";

type Subject = "math" | "reading" | "writing" | "science";

// ─── Curriculum map ───────────────────────────────────────────────────────────

const CURRICULUM: Record<Subject, Record<string, { skills: string[] }>> = {
  math: {
    "M1 – Early Counting":       { skills: ["Counting 1–10", "Counting 1–50", "Number recognition"] },
    "M3 – Addition Within Ten":  { skills: ["Addition within 5", "Addition within 10", "Number bonds"] },
    "M4 – Adding & Subtracting": { skills: ["2-digit addition", "Subtraction within 20", "Missing numbers"] },
    "M5 – Multiplication Fluency":{ skills: ["×2–×5 tables", "×6, ×7, ×8 tables", "×9 tables", "Mixed ×6–×9"] },
    "M6 – Division Foundations": { skills: ["Division by 6, 7, 8", "Division by 9", "Mixed division", "Division with remainders"] },
    "M7 – Fractions":            { skills: ["Identifying fractions", "Simplifying fractions", "Adding fractions", "Comparing fractions"] },
    "M10 – Pre-Algebra":         { skills: ["Solving one-step equations", "Solving two-step equations", "Inequalities", "Word problems"] },
  },
  reading: {
    "R2 – Long Vowels":     { skills: ["Silent E words", "Long A sound", "Long I sound", "Long O sound"] },
    "R5 – Comprehension":   { skills: ["Main idea & details", "Cause and effect", "Sequence of events", "Making inferences"] },
    "R9 – Literary Analysis":{ skills: ["Character analysis", "Theme identification", "Figurative language", "Narrative structure"] },
  },
  writing: {
    "W2 – Parts of Speech": { skills: ["Nouns and verbs", "Adjectives and adverbs", "Pronouns", "Prepositions"] },
    "W5 – Paragraphs":      { skills: ["Topic sentences", "Supporting sentences", "Concluding sentences", "Paragraph unity"] },
  },
  science: {
    "S2 – Ecosystems":     { skills: ["Food chains", "Food webs", "Producers and consumers", "Adaptation"] },
    "S4 – States of Matter":{ skills: ["Solids, liquids, gases", "State changes", "Melting and freezing", "Evaporation"] },
    "S5 – Biology":         { skills: ["Cell structure", "Cell functions", "Photosynthesis", "Respiration"] },
  },
};

const SUBJECT_NAMES: Record<Subject, string> = {
  math: "Mathematics", reading: "Reading", writing: "Writing", science: "Science",
};

// A sheet's fetched problems: array of { q, a, type?, options? }
type SheetProblem = { q: string; a: string; type?: string; options?: string[] };
type AllSheetProblems = Record<number, SheetProblem[]>; // keyed by sheetNumber (1-based)

// ─── Page root ────────────────────────────────────────────────────────────────

export default function PdfGeneratorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>}>
      <PdfGeneratorInner />
    </Suspense>
  );
}

function PdfGeneratorInner() {
  const searchParams = useSearchParams();

  const urlSubject = (searchParams.get("subject") ?? "").toLowerCase();
  const initialSubject: Subject = ["math","reading","writing","science"].includes(urlSubject)
    ? (urlSubject as Subject)
    : urlSubject === "mathematics" ? "math"
    : "math";
  const urlLevel    = searchParams.get("level");
  const urlSkill    = searchParams.get("skill");
  const urlSheets   = parseInt(searchParams.get("sheets")   ?? "", 10);
  const urlProblems = parseInt(searchParams.get("problems") ?? "", 10);
  const urlName     = searchParams.get("name") ?? "";

  const [subject,    setSubject]    = useState<Subject>(initialSubject);
  const [level,      setLevel]      = useState<string>(() => {
    const all = Object.keys(CURRICULUM[initialSubject]);
    if (urlLevel) {
      const code  = urlLevel.split(/\s|–|-/)[0];
      const match = all.find((l) => l.startsWith(code + " ") || l.startsWith(code + "–"));
      if (match) return match;
    }
    return all[0];
  });
  const [skill,      setSkill]      = useState<string>(() => {
    const sk = CURRICULUM[initialSubject][level]?.skills ?? [];
    if (urlSkill && sk.includes(urlSkill)) return urlSkill;
    return sk[0] ?? "";
  });
  const [sheets,     setSheets]     = useState(Number.isFinite(urlSheets) && urlSheets > 0 ? urlSheets : 3);
  const [problems,   setProblems]   = useState(Number.isFinite(urlProblems) && urlProblems > 0 ? urlProblems : 20);
  const [timeLimit,  setTimeLimit]  = useState("10 minutes");
  const [studentName,setStudentName]= useState(urlName);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeSig,       setIncludeSig]       = useState(true);
  const [includeInstr,     setIncludeInstr]     = useState(true);
  const [columnCount,      setColumnCount]      = useState(3);
  const [previewTab,       setPreviewTab]        = useState(0); // 0-based index into tabs

  // ── Server problems ──────────────────────────────────────────────────────
  const [allProblems,  setAllProblems]  = useState<AllSheetProblems>({});
  const [fetchStatus,  setFetchStatus]  = useState<"idle"|"loading"|"done"|"error">("idle");
  const [fetchError,   setFetchError]   = useState<string | null>(null);

  const subjectSlug = subject.toUpperCase() as "MATH"|"READING"|"WRITING"|"SCIENCE";
  const levelCode   = level.split(/\s|–|-/)[0]; // e.g. "M5"

  // Fetch ALL sheets in parallel whenever config changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setFetchStatus("loading");
      setFetchError(null);
      try {
        const fetches = Array.from({ length: sheets }, (_, i) =>
          fetch("/api/worksheet/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectSlug,
              levelCode,
              skillName:        skill,
              problemCount:     problems,
              timeLimitMinutes: parseInt(timeLimit) || 10,
              sheetNumber:      i + 1,
              totalSheets:      sheets,
            }),
          }).then((r) => r.json())
        );
        const results = await Promise.all(fetches);
        if (cancelled) return;

        const next: AllSheetProblems = {};
        for (let i = 0; i < results.length; i++) {
          const data = results[i];
          if (!data.success) { setFetchError(data.error ?? "API error"); setFetchStatus("error"); return; }
          const probs: any[]   = data.data.problems;
          const keys:  any[]   = data.data.answerKey;
          next[i + 1] = probs.map((p: any, idx: number) => ({
            q:       p.question ?? p.prompt ?? "",
            a:       String(keys[idx]?.answer ?? p.answer ?? ""),
            type:    p.type ?? "short_answer",
            options: Array.isArray(p.options) ? p.options : undefined,
          }));
        }
        setAllProblems(next);
        setFetchStatus("done");
      } catch (e: any) {
        if (!cancelled) { setFetchError(e?.message ?? "Network error"); setFetchStatus("error"); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [subjectSlug, levelCode, skill, problems, sheets, timeLimit]);

  // ── Navigation helpers ───────────────────────────────────────────────────
  const levels = Object.keys(CURRICULUM[subject]);
  const skills  = CURRICULUM[subject][level]?.skills ?? [];

  function changeSubject(s: Subject) {
    setSubject(s);
    const fl = Object.keys(CURRICULUM[s])[0];
    setLevel(fl);
    setSkill(CURRICULUM[s][fl].skills[0]);
  }
  function changeLevel(l: string) {
    setLevel(l);
    setSkill(CURRICULUM[subject][l].skills[0]);
  }

  // tabs: Sheet 1..N, then one "Answer Key" tab (if enabled)
  const tabs = useMemo(() => {
    const t: { label: string; isKey: boolean; sheet: number }[] = [];
    for (let i = 1; i <= sheets; i++) t.push({ label: `Sheet ${i}`, isKey: false, sheet: i });
    if (includeAnswerKey) t.push({ label: "Answer Key", isKey: true, sheet: 0 });
    return t;
  }, [sheets, includeAnswerKey]);

  const isLoading = fetchStatus === "loading";
  const sharedProps = {
    subjectName: SUBJECT_NAMES[subject],
    level, skill, totalSheets: sheets,
    problemCount: problems,
    timeLimit, studentName,
    includeInstructions: includeInstr,
    includeSignature:    includeSig,
    columnCount,
  };

  return (
    <div className="min-h-screen bg-cream-dark">
      {/* Nav */}
      <nav className="bg-cream border-b border-border print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-muted hover:text-ink">← Admin panel</Link>
            <Link href="/"      className="text-xs text-muted hover:text-ink">← Home</Link>
          </div>
        </div>
      </nav>

      <div className="grid lg:grid-cols-[320px_1fr] min-h-[calc(100vh-3.5rem)]">
        {/* ── CONTROLS ─────────────────────────────────────────────────── */}
        <aside className="bg-white border-r border-border p-6 overflow-y-auto space-y-5 print:hidden">
          <div>
            <h1 className="font-serif text-xl font-bold">Worksheet Generator</h1>
            <p className="text-xs text-muted mt-1 leading-relaxed">Configure your worksheet below. Print directly or save as PDF.</p>
          </div>

          <Section title="Subject">
            <Select value={subject} onChange={(e) => changeSubject(e.target.value as Subject)}>
              <option value="math">Mathematics</option>
              <option value="reading">Reading</option>
              <option value="writing">Writing</option>
              <option value="science">Science</option>
            </Select>
          </Section>

          <Section title="Level">
            <Select value={level} onChange={(e) => changeLevel(e.target.value)}>
              {levels.map((l) => <option key={l}>{l}</option>)}
            </Select>
          </Section>

          <Section title="Skill focus">
            <Select value={skill} onChange={(e) => setSkill(e.target.value)}>
              {skills.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Section>

          <Section title="Sheet count">
            <Select value={sheets} onChange={(e) => setSheets(parseInt(e.target.value))}>
              <option value={1}>1 sheet</option>
              <option value={3}>3 sheets (daily packet)</option>
              <option value={5}>5 sheets</option>
              <option value={10}>10 sheets (weekly)</option>
            </Select>
          </Section>

          <Section title="Problems per sheet">
            <Select value={problems} onChange={(e) => setProblems(parseInt(e.target.value))}>
              <option value={10}>10 problems</option>
              <option value={20}>20 problems</option>
              <option value={30}>30 problems (recommended)</option>
              <option value={40}>40 problems</option>
              <option value={50}>50 problems</option>
            </Select>
          </Section>

          <Section title="Page layout">
            <Select value={columnCount} onChange={(e) => setColumnCount(parseInt(e.target.value))}>
              <option value={2}>2 columns (more space per problem)</option>
              <option value={3}>3 columns (denser)</option>
              <option value={4}>4 columns (max density)</option>
            </Select>
          </Section>

          <Section title="Time limit">
            <Select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}>
              <option>5 minutes</option>
              <option>8 minutes</option>
              <option>10 minutes</option>
              <option>12 minutes</option>
              <option>15 minutes</option>
              <option>No limit</option>
            </Select>
          </Section>

          <Section title="Student name">
            <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Leave blank for class set" />
          </Section>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink mb-2">Options</div>
            <div className="space-y-2">
              <ToggleRow label="Include answer key"    checked={includeAnswerKey} onChange={setIncludeAnswerKey} />
              <ToggleRow label="Parent signature line" checked={includeSig}       onChange={setIncludeSig} />
              <ToggleRow label="Instructions"          checked={includeInstr}     onChange={setIncludeInstr} />
            </div>
          </div>

          <div className="bg-brand-blue-light text-brand-blue text-xs rounded-md p-3">
            {sheets} sheet{sheets !== 1 ? "s" : ""} · {sheets * problems} problems · Est. {sheets * (parseInt(timeLimit) || 10)} min
          </div>

          <Button variant="primary" fullWidth onClick={() => { setAllProblems({}); setFetchStatus("idle"); }}>↻ Refresh preview</Button>
          <Button variant="green"   fullWidth onClick={() => window.print()}>🖨 Print / Save as PDF</Button>

          <div className="text-[10px] text-muted bg-cream-dark rounded-md p-2.5 leading-relaxed">
            <strong>To save as PDF:</strong> Click Print → change destination to "Save as PDF" → Save. All sheets print in one file.
          </div>
        </aside>

        {/* ── PREVIEW ──────────────────────────────────────────────────── */}
        <div className="overflow-y-auto bg-cream-dark p-6">

          {/* Status bar */}
          {isLoading && (
            <div className="max-w-3xl mx-auto mb-3 px-3 py-2 bg-brand-blue-light/40 border border-brand-blue/30 rounded-md text-xs text-brand-blue print:hidden">
              Generating {sheets} sheet{sheets !== 1 ? "s" : ""}…
            </div>
          )}
          {fetchStatus === "error" && (
            <div className="max-w-3xl mx-auto mb-3 px-3 py-2 bg-brand-red-light border border-brand-red/30 rounded-md text-xs text-brand-red print:hidden">
              Error loading problems: {fetchError}. Using cached problems.
            </div>
          )}

          {/* Tab bar — screen only */}
          <div className="flex gap-2 mb-5 flex-wrap print:hidden">
            {tabs.map((t, i) => (
              <button
                key={i}
                onClick={() => setPreviewTab(i)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border-[1.5px] transition-all",
                  previewTab === i
                    ? "bg-ink text-cream border-ink"
                    : "bg-white text-muted border-border hover:border-ink hover:text-ink"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/*
            KEY FIX: All sheets are rendered in the DOM simultaneously.
            - On screen:  only the active tab is visible (others are hidden via CSS).
            - On print:   ALL sheets are visible with page breaks between them,
                          so window.print() produces a single multi-page PDF.
          */}
          {tabs.map((tab, i) => {
            const isActive = i === previewTab;

            // Answer key tab: render one answer-key page per sheet
            if (tab.isKey) {
              return (
                <div
                  key="answer-key"
                  className={cn(!isActive && "hidden print:block")}
                >
                  {Array.from({ length: sheets }, (_, si) => (
                    <div key={si} className={si > 0 ? "print:break-before-page mt-8 print:mt-0" : ""}>
                      <WorksheetSheet
                        {...sharedProps}
                        sheetNumber={si + 1}
                        isAnswerKey
                        problems={allProblems[si + 1]}
                        isLoading={isLoading}
                      />
                    </div>
                  ))}
                </div>
              );
            }

            // Regular sheet tab
            return (
              <div
                key={tab.sheet}
                className={cn(!isActive && "hidden print:block", isActive && "block",
                  // On print, add page break before every sheet except the first
                  i > 0 && "print:break-before-page print:mt-0")}
              >
                <WorksheetSheet
                  {...sharedProps}
                  sheetNumber={tab.sheet}
                  isAnswerKey={false}
                  problems={allProblems[tab.sheet]}
                  isLoading={isLoading}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink">{title}</div>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <Toggle checked={checked} onChange={onChange} size="sm" />
    </div>
  );
}

// ─── Worksheet sheet ──────────────────────────────────────────────────────────

interface SheetProps {
  subjectName: string;
  level:       string;
  skill:       string;
  sheetNumber: number;
  totalSheets: number;
  problemCount:number;
  timeLimit:   string;
  studentName: string;
  isAnswerKey: boolean;
  includeInstructions: boolean;
  includeSignature:    boolean;
  columnCount: number;
  problems?:   SheetProblem[];
  isLoading?:  boolean;
}

function WorksheetSheet(props: SheetProps) {
  const {
    subjectName, level, skill, sheetNumber, totalSheets,
    problemCount, timeLimit, studentName, isAnswerKey,
    includeInstructions, includeSignature, columnCount,
    problems, isLoading,
  } = props;

  const cols      = columnCount ?? 3;
  const gridCols  = cols === 4 ? "grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2";
  const hasProbls = Array.isArray(problems) && problems.length > 0;
  const display   = hasProbls ? problems! : [];

  // Determine layout: reading/writing/science use prose layout; math uses grid
  const isMath    = subjectName === "Mathematics";

  return (
    <div
      className={cn(
        "bg-white rounded-md shadow-elev mx-auto p-10 print:shadow-none print:rounded-none print:p-8 print:max-w-none print:w-full max-w-3xl",
        isAnswerKey && "border-2 border-brand-green"
      )}
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* Header */}
      <div className={cn("border-b-[2.5px] pb-3 mb-5 flex justify-between items-end", isAnswerKey ? "border-brand-green" : "border-ink")}>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted font-sans">Eduyro Education · eduyro.com</div>
          <div className={cn("font-bold text-lg mt-1", isAnswerKey && "text-brand-green")}>
            {skill}
            {isAnswerKey && <span className="ml-2 text-brand-green">— ANSWER KEY</span>}
          </div>
          <div className="text-xs text-muted mt-1 font-sans">
            {level} · {subjectName} · {isAnswerKey ? `All ${totalSheets} sheets` : `Sheet ${sheetNumber} of ${totalSheets}`} · Target: {timeLimit} · {problemCount} problems
          </div>
        </div>
        <div className="text-xs text-muted/60 text-right font-serif">Eduyro<br />Education</div>
      </div>

      {/* Fields row */}
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-5 mb-4 text-xs text-muted font-sans">
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-muted/60 mb-1">Student Name</label>
          <div className="border-b border-border-mid min-h-[20px] py-1 text-ink">{studentName || ""}</div>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-muted/60 mb-1">Date</label>
          <div className="border-b border-border-mid min-h-[20px]" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-muted/60 mb-1">Score</label>
          {/* FIX: was rendering "&nbsp;/ N" as literal text — use JSX instead */}
          <div className="border-b border-border-mid min-h-[20px] text-ink">
            {isAnswerKey ? `${problemCount} / ${problemCount}` : <span>&nbsp;/ {problemCount}</span>}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {includeInstructions && !isAnswerKey && (
        <div className="bg-cream-dark border-l-[3px] border-gold rounded-r-md text-[11px] text-muted italic px-3 py-2 mb-4 font-sans leading-relaxed">
          Write only the answer in each box. Try to finish in under {timeLimit}. If you get stuck, skip and come back.
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !hasProbls && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-6 bg-cream-dark rounded" />
          ))}
        </div>
      )}

      {/* Problems */}
      {hasProbls && isMath && (
        <div className={cn("grid gap-x-6 gap-y-1", gridCols)}>
          {display.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-cream-dark/70">
              <span className="text-[10px] text-border font-sans w-5">{i + 1}.</span>
              <span className="font-bold flex-1 text-base">
                {/* Append = only if not already present */}
                {p.q.trim().endsWith("=") ? p.q : `${p.q} =`}
              </span>
              <div className={cn(
                "w-11 h-5 border rounded text-xs font-bold flex items-center justify-center",
                isAnswerKey
                  ? "bg-brand-green-light border-brand-green text-brand-green"
                  : "border-border-mid bg-cream-dark/40"
              )}>
                {isAnswerKey ? p.a : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasProbls && !isMath && (
        <ProseProblems problems={display} isAnswerKey={isAnswerKey} />
      )}

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-dashed border-border flex justify-between text-[10px] text-muted/60 font-sans">
        <span>{level} · Eduyro</span>
        <span>{isAnswerKey ? `Answer Key — ${totalSheets} sheets` : `Page ${sheetNumber} of ${totalSheets}`}</span>
      </div>

      {includeSignature && !isAnswerKey && (
        <div className="mt-3 pt-2 border-t border-cream-dark text-[11px] text-muted/70 font-sans">
          Parent/Guardian Signature: ___________________________________&nbsp;&nbsp;Date checked: _______________
        </div>
      )}
    </div>
  );
}

// ─── Prose problems (Reading, Writing, Science) ───────────────────────────────
// Renders questions from the real generator — handles multiple_choice, short_answer, passage.

function ProseProblems({ problems, isAnswerKey }: { problems: SheetProblem[]; isAnswerKey: boolean }) {
  let qNum = 0;
  return (
    <div className="space-y-4 text-sm font-sans">
      {problems.map((p, i) => {
        // The generator marks passage/reading header with type "short_answer" and answer "(passage — no answer required)"
        const isPassage = p.a === "(passage — no answer required)" || p.q.startsWith("READ THIS PASSAGE");
        if (isPassage) {
          // Extract just the passage text (strip the preamble label)
          const passageText = p.q
            .replace(/^READ THIS PASSAGE:\s*/i, "")
            .replace(/\n\nNow answer the questions below\.?/i, "")
            .trim();
          return (
            <div key={i} className="bg-brand-blue-light/40 border-l-[3px] border-brand-blue rounded-r-md px-4 py-3 text-sm leading-relaxed">
              <strong>Read carefully:</strong> {passageText}
            </div>
          );
        }

        qNum++;
        const isMultipleChoice = p.type === "multiple_choice" && Array.isArray(p.options) && p.options.length > 0;

        return (
          <div key={i} className="py-1">
            <div className="font-semibold mb-1">{qNum}. {p.q}</div>
            {isMultipleChoice ? (
              <div className="pl-4 space-y-1 text-xs text-muted">
                {p.options!.map((opt, oi) => {
                  const isCorrect = isAnswerKey && opt === p.a;
                  return (
                    <div key={oi} className={isCorrect ? "text-brand-green font-semibold" : ""}>
                      {isCorrect ? "●" : "○"} {opt}
                    </div>
                  );
                })}
              </div>
            ) : (
              isAnswerKey ? (
                <div className="pl-4 text-brand-green font-semibold text-xs">{p.a}</div>
              ) : (
                <div className="space-y-1 pl-4">
                  <div className="border-b border-border-mid min-h-[18px]" />
                  <div className="border-b border-border-mid min-h-[18px]" />
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
