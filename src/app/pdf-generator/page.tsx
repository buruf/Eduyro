// src/app/pdf-generator/page.tsx
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui";
import { cn } from "@/lib/utils";

type Subject = "math" | "reading" | "writing" | "science";

const CURRICULUM: Record<Subject, Record<string, { skills: string[] }>> = {
  math: {
    "M1 – Early Counting": { skills: ["Counting 1–10", "Counting 1–50", "Number recognition"] },
    "M3 – Addition Within Ten": { skills: ["Addition within 5", "Addition within 10", "Number bonds"] },
    "M4 – Adding & Subtracting": { skills: ["2-digit addition", "Subtraction within 20", "Missing numbers"] },
    "M5 – Multiplication Fluency": { skills: ["×2–×5 tables", "×6, ×7, ×8 tables", "×9 tables", "Mixed ×6–×9"] },
    "M6 – Division Foundations": { skills: ["Division by 6, 7, 8", "Division by 9", "Mixed division", "Division with remainders"] },
    "M7 – Fractions": { skills: ["Identifying fractions", "Simplifying fractions", "Adding fractions", "Comparing fractions"] },
    "M10 – Pre-Algebra": { skills: ["Solving one-step equations", "Solving two-step equations", "Inequalities", "Word problems"] },
  },
  reading: {
    "R2 – Long Vowels": { skills: ["Silent E words", "Long A sound", "Long I sound", "Long O sound"] },
    "R5 – Comprehension": { skills: ["Main idea & details", "Cause and effect", "Sequence of events", "Making inferences"] },
    "R9 – Literary Analysis": { skills: ["Character analysis", "Theme identification", "Figurative language", "Narrative structure"] },
  },
  writing: {
    "W2 – Parts of Speech": { skills: ["Nouns and verbs", "Adjectives and adverbs", "Pronouns", "Prepositions"] },
    "W5 – Paragraphs": { skills: ["Topic sentences", "Supporting sentences", "Concluding sentences", "Paragraph unity"] },
  },
  science: {
    "S2 – Ecosystems": { skills: ["Food chains", "Food webs", "Producers and consumers", "Adaptation"] },
    "S4 – States of Matter": { skills: ["Solids, liquids, gases", "State changes", "Melting and freezing", "Evaporation"] },
    "S5 – Biology": { skills: ["Cell structure", "Cell functions", "Photosynthesis", "Respiration"] },
  },
};

const SUBJECT_NAMES: Record<Subject, string> = {
  math: "Mathematics", reading: "Reading", writing: "Writing", science: "Science",
};

export default function PdfGeneratorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>}>
      <PdfGeneratorInner />
    </Suspense>
  );
}

function PdfGeneratorInner() {
  const searchParams = useSearchParams();

  // Read URL params for prefill (from admin Worksheet Creator)
  const urlSubject = (searchParams.get("subject") ?? "").toLowerCase();
  const initialSubject: Subject = ["math", "reading", "writing", "science"].includes(urlSubject)
    ? (urlSubject as Subject)
    : urlSubject === "mathematics" ? "math"
    : "math";
  const urlLevel = searchParams.get("level");
  const urlSkill = searchParams.get("skill");
  const urlSheets = parseInt(searchParams.get("sheets") ?? "", 10);
  const urlProblems = parseInt(searchParams.get("problems") ?? "", 10);
  const urlName = searchParams.get("name") ?? "";

  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [level, setLevel] = useState<string>(() => {
    // Find a level key matching urlLevel substring
    const all = Object.keys(CURRICULUM[initialSubject]);
    if (urlLevel) {
      const code = urlLevel.split(/\s|–|-/)[0]; // e.g. "M5" from "M5 – Multiplication Fluency"
      const match = all.find((l) => l.startsWith(code + " ") || l.startsWith(code + " –"));
      if (match) return match;
    }
    return all[0] ?? "M5 – Multiplication Fluency";
  });
  const [skill, setSkill] = useState<string>(() => {
    const skills = CURRICULUM[initialSubject][level] ? CURRICULUM[initialSubject][level].skills : [];
    if (urlSkill && skills.includes(urlSkill)) return urlSkill;
    return skills[0] ?? "×6, ×7, ×8 tables";
  });
  const [sheets, setSheets] = useState(Number.isFinite(urlSheets) && urlSheets > 0 ? urlSheets : 3);
  const [problems, setProblems] = useState(Number.isFinite(urlProblems) && urlProblems > 0 ? urlProblems : 20);
  const [timeLimit, setTimeLimit] = useState("10 minutes");
  const [studentName, setStudentName] = useState(urlName);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeSig, setIncludeSig] = useState(true);
  const [includeInstr, setIncludeInstr] = useState(true);
  const [columnCount, setColumnCount] = useState(3); // 2 or 3 columns on the printed page
  const [previewTab, setPreviewTab] = useState(0);

  const levels = Object.keys(CURRICULUM[subject]);
  const skills = CURRICULUM[subject][level]?.skills ?? [];

  // Backend problem bank — fetched per-sheet from /api/worksheet/preview
  // Falls back to hardcoded local bank if the API fails (offline / dev mode).
  const [serverProblems, setServerProblems] = useState<Record<number, Array<{ q: string; a: string }>>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchingSheets, setFetchingSheets] = useState(false);

  // Derive subjectSlug + levelCode (uppercase + extracted code) for the API
  const subjectSlug = subject.toUpperCase() as "MATH" | "READING" | "WRITING" | "SCIENCE";
  const levelCode = level.split(/\s|–|-/)[0]; // e.g. "M5" from "M5 – Multiplication Fluency"

  useEffect(() => {
    let cancelled = false;
    async function loadAllSheets() {
      setFetchingSheets(true);
      setFetchError(null);
      const next: Record<number, Array<{ q: string; a: string }>> = {};
      try {
        for (let i = 1; i <= sheets; i++) {
          const res = await fetch("/api/worksheet/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectSlug,
              levelCode,
              skillName: skill,
              problemCount: problems,
              timeLimitMinutes: parseInt(timeLimit) || 10,
              sheetNumber: i,
              totalSheets: sheets,
            }),
          });
          const data = await res.json();
          if (!data.success) {
            if (!cancelled) setFetchError(data.error ?? "API error");
            return;
          }
          // Map backend Problem[] + AnswerKeyEntry[] into the simpler [q, a] shape
          // used by the preview component
          const probs: any[] = data.data.problems;
          const keys: any[] = data.data.answerKey;
          next[i] = probs.map((p, idx) => ({
            q: p.question ?? p.prompt ?? "",
            a: String(keys[idx]?.answer ?? p.answer ?? ""),
          }));
        }
        if (!cancelled) setServerProblems(next);
      } catch (e: any) {
        if (!cancelled) setFetchError(e?.message ?? "Network error");
      } finally {
        if (!cancelled) setFetchingSheets(false);
      }
    }
    loadAllSheets();
    return () => { cancelled = true; };
  }, [subjectSlug, levelCode, skill, problems, sheets, timeLimit]);

  // Auto-update when subject changes
  function changeSubject(s: Subject) {
    setSubject(s);
    const firstLevel = Object.keys(CURRICULUM[s])[0];
    setLevel(firstLevel);
    setSkill(CURRICULUM[s][firstLevel].skills[0]);
  }

  function changeLevel(l: string) {
    setLevel(l);
    setSkill(CURRICULUM[subject][l].skills[0]);
  }

  const tabs = useMemo(() => {
    const t: { label: string; key: boolean; sheet: number }[] = [];
    for (let i = 1; i <= sheets; i++) t.push({ label: `Sheet ${i}`, key: false, sheet: i });
    if (includeAnswerKey) t.push({ label: "Answer Key", key: true, sheet: 1 });
    return t;
  }, [sheets, includeAnswerKey]);

  return (
    <div className="min-h-screen bg-cream-dark">
      <nav className="bg-cream border-b border-border print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-muted hover:text-ink">← Admin panel</Link>
            <Link href="/" className="text-xs text-muted hover:text-ink">← Home</Link>
          </div>
        </div>
      </nav>

      <div className="grid lg:grid-cols-[320px_1fr] min-h-[calc(100vh-3.5rem)]">
        {/* CONTROLS */}
        <aside className="bg-white border-r border-border p-6 overflow-y-auto space-y-5 print:hidden">
          <div>
            <h1 className="font-serif text-xl font-bold">Worksheet Generator</h1>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Configure your worksheet below. Print directly or save as PDF.
            </p>
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
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Leave blank for class set"
            />
          </Section>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink mb-2">Options</div>
            <div className="space-y-2">
              <ToggleRow label="Include answer key" checked={includeAnswerKey} onChange={setIncludeAnswerKey} />
              <ToggleRow label="Parent signature line" checked={includeSig} onChange={setIncludeSig} />
              <ToggleRow label="Instructions" checked={includeInstr} onChange={setIncludeInstr} />
            </div>
          </div>

          <div className="bg-brand-blue-light text-brand-blue text-xs rounded-md p-3">
            {sheets} sheet{sheets !== 1 ? "s" : ""} · {sheets * problems} problems · Est. {sheets * (parseInt(timeLimit) || 10)} min
          </div>

          <Button variant="primary" fullWidth onClick={() => { setPreviewTab(0); setSkill(skill); }}>↻ Refresh preview</Button>
          <Button variant="green" fullWidth onClick={() => window.print()}>🖨 Print / Save as PDF</Button>

          <div className="text-[10px] text-muted bg-cream-dark rounded-md p-2.5 leading-relaxed">
            <strong>To save as PDF:</strong> Click Print → change destination to "Save as PDF" → Save. Worksheet prints in clean black & white at letter size.
          </div>
        </aside>

        {/* PREVIEW */}
        <div className="overflow-y-auto bg-cream-dark p-6">
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

          <WorksheetPreview
            subject={subject}
            subjectName={SUBJECT_NAMES[subject]}
            level={level}
            skill={skill}
            sheetNumber={tabs[previewTab]?.sheet ?? 1}
            totalSheets={sheets}
            problemCount={problems}
            timeLimit={timeLimit}
            studentName={studentName}
            isAnswerKey={tabs[previewTab]?.key ?? false}
            includeInstructions={includeInstr}
            includeSignature={includeSig}
            columnCount={columnCount}
            serverProblems={serverProblems[tabs[previewTab]?.sheet ?? 1]}
            fetchError={fetchError}
            isFetching={fetchingSheets}
          />
        </div>
      </div>
    </div>
  );
}

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

// ─────────────────────────────────────────────
// Worksheet preview rendering
// ─────────────────────────────────────────────

const MATH_PROBLEMS: Record<string, [string, string][]> = {
  "×2–×5 tables": [["2×3", "6"], ["2×4", "8"], ["3×4", "12"], ["3×5", "15"], ["4×5", "20"], ["5×5", "25"], ["2×6", "12"], ["3×6", "18"], ["4×6", "24"], ["5×6", "30"], ["2×7", "14"], ["3×7", "21"], ["4×7", "28"], ["5×7", "35"], ["2×8", "16"], ["3×8", "24"], ["4×8", "32"], ["5×8", "40"], ["2×9", "18"], ["5×9", "45"]],
  "×6, ×7, ×8 tables": [["6×7", "42"], ["6×8", "48"], ["6×9", "54"], ["7×8", "56"], ["7×9", "63"], ["8×9", "72"], ["6×6", "36"], ["7×7", "49"], ["8×8", "64"], ["6×10", "60"], ["7×10", "70"], ["8×10", "80"], ["6×11", "66"], ["7×11", "77"], ["8×11", "88"], ["6×12", "72"], ["7×12", "84"], ["8×12", "96"], ["6×4", "24"], ["7×4", "28"]],
  "×9 tables": [["9×2", "18"], ["9×3", "27"], ["9×4", "36"], ["9×5", "45"], ["9×6", "54"], ["9×7", "63"], ["9×8", "72"], ["9×9", "81"], ["9×10", "90"], ["9×11", "99"], ["9×12", "108"], ["9×3", "27"], ["9×4", "36"], ["9×6", "54"], ["9×7", "63"], ["9×8", "72"], ["9×9", "81"], ["9×11", "99"], ["9×12", "108"], ["9×5", "45"]],
  "Mixed ×6–×9": [["6×7", "42"], ["9×8", "72"], ["7×6", "42"], ["8×9", "72"], ["9×7", "63"], ["6×9", "54"], ["8×7", "56"], ["7×8", "56"], ["9×6", "54"], ["6×8", "48"], ["7×9", "63"], ["8×6", "48"], ["9×9", "81"], ["6×6", "36"], ["7×7", "49"], ["8×8", "64"], ["6×12", "72"], ["9×11", "99"], ["7×11", "77"], ["8×12", "96"]],
};

function WorksheetPreview(props: any) {
  const isReading = props.subject === "reading";
  const isScience = props.subject === "science";
  const isWriting = props.subject === "writing";

  // Prefer server-generated problems; fall back to hardcoded preview bank.
  const serverList: Array<{ q: string; a: string }> | undefined = props.serverProblems;
  const hardcoded = MATH_PROBLEMS[props.skill] ?? MATH_PROBLEMS["×6, ×7, ×8 tables"];
  const usingServer = Array.isArray(serverList) && serverList.length > 0;
  const displayProblems: [string, string][] = usingServer
    ? serverList!.map((p) => [p.q, p.a])
    : hardcoded.slice(0, props.problemCount);

  const cols = props.columnCount ?? 2;
  const gridCols = cols === 4 ? "grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <>
      {!usingServer && !props.isFetching && (
        <div className="max-w-3xl mx-auto mb-2 px-3 py-2 bg-gold-light border border-gold/40 rounded-md text-xs text-gold-dark print:hidden">
          ⓘ Showing sample problems from local cache.
          {props.fetchError ? ` (API: ${props.fetchError})` : ""}
        </div>
      )}
      {props.isFetching && (
        <div className="max-w-3xl mx-auto mb-2 px-3 py-2 bg-brand-blue-light/40 border border-brand-blue/30 rounded-md text-xs text-brand-blue print:hidden">
          Generating fresh problems from server…
        </div>
      )}
    <div
      className={cn(
        "bg-white rounded-md shadow-elev mx-auto p-10 print:shadow-none print:rounded-none print:p-0 print:max-w-none print:w-full",
        props.isAnswerKey ? "border-2 border-brand-green max-w-3xl" : "max-w-3xl"
      )}
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* Header */}
      <div className={cn("border-b-[2.5px] pb-3 mb-5 flex justify-between items-end", props.isAnswerKey ? "border-brand-green" : "border-ink")}>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted font-sans">Eduyro Education · eduyro.com</div>
          <div className={cn("font-bold text-lg mt-1", props.isAnswerKey && "text-brand-green")}>
            {props.skill}
            {props.isAnswerKey && <span className="ml-2 text-brand-green">— ANSWER KEY</span>}
          </div>
          <div className="text-xs text-muted mt-1 font-sans">
            {props.level} · {props.subjectName} · Sheet {props.sheetNumber} of {props.totalSheets} · Target: {props.timeLimit} · {props.problemCount} problems
          </div>
        </div>
        <div className="text-xs text-muted/60 text-right font-serif">
          Eduyro<br />Education
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-5 mb-4 text-xs text-muted font-sans">
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-muted/60 mb-1">Student Name</label>
          <div className="border-b border-border-mid min-h-[20px] py-1 text-ink">{props.studentName || ""}</div>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-muted/60 mb-1">Date</label>
          <div className="border-b border-border-mid min-h-[20px]"></div>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-muted/60 mb-1">Score</label>
          <div className="border-b border-border-mid min-h-[20px] text-ink">
            {props.isAnswerKey ? `${props.problemCount} / ${props.problemCount}` : `&nbsp;/ ${props.problemCount}`}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {props.includeInstructions && !props.isAnswerKey && (
        <div className="bg-cream-dark border-l-[3px] border-gold rounded-r-md text-[11px] text-muted italic px-3 py-2 mb-4 font-sans leading-relaxed">
          Write only the answer in each box. Try to finish in under {props.timeLimit}. If you get stuck, skip and come back.
        </div>
      )}

      {/* Problems */}
      {!isReading && !isScience && !isWriting && (
        <div className={cn("grid gap-x-6 gap-y-1", gridCols)}>
          {displayProblems.map(([q, a], i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-cream-dark/70">
              <span className="text-[10px] text-border font-sans w-5">{i + 1}.</span>
              <span className="font-bold flex-1 text-base">{q}{q.trim().endsWith("=") ? "" : " ="}</span>
              <div className={cn(
                "w-11 h-5 border rounded text-xs font-bold flex items-center justify-center",
                props.isAnswerKey
                  ? "bg-brand-green-light border-brand-green text-brand-green"
                  : "border-border-mid bg-cream-dark/40"
              )}>
                {props.isAnswerKey ? a : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {isReading && <ReadingContent isAnswerKey={props.isAnswerKey} />}
      {isScience && <ScienceContent isAnswerKey={props.isAnswerKey} />}
      {isWriting && <WritingContent isAnswerKey={props.isAnswerKey} />}

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-dashed border-border flex justify-between text-[10px] text-muted/60 font-sans">
        <span>{props.level} · Eduyro</span>
        <span>Page {props.sheetNumber} of {props.totalSheets}</span>
      </div>

      {props.includeSignature && !props.isAnswerKey && (
        <div className="mt-3 pt-2 border-t border-cream-dark text-[11px] text-muted/70 font-sans">
          Parent/Guardian Signature: ___________________________________ &nbsp; Date checked: _______________
        </div>
      )}
    </div>
    </>
  );
}

function ReadingContent({ isAnswerKey }: { isAnswerKey: boolean }) {
  return (
    <>
      <div className="bg-brand-blue-light/40 border-l-[3px] border-brand-blue rounded-r-md px-4 py-3 mb-4 text-sm leading-relaxed">
        <strong>Read carefully:</strong> Whales are the largest animals on Earth. The blue whale, the biggest of all, can grow up to 30 metres long and weigh as much as 200 tonnes. Despite their enormous size, blue whales eat some of the smallest creatures in the ocean — tiny shrimp-like animals called krill. A single blue whale can eat up to 4 tonnes of krill every day during feeding season…
      </div>
      <div className="space-y-3 text-sm font-sans">
        <div>
          <div className="font-semibold mb-1">1. What is the main idea of this passage?</div>
          <div className="pl-4 space-y-1 text-xs text-muted">
            <div>○ Whales are dangerous to people</div>
            <div className={isAnswerKey ? "text-brand-green font-medium" : ""}>
              {isAnswerKey ? "●" : "○"} Blue whales are large ocean animals with fascinating features
            </div>
            <div>○ All whales are the same size</div>
            <div>○ Whales breathe through their mouths</div>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">2. How much can a blue whale weigh?</div>
          <div className="pl-4 text-xs">
            {isAnswerKey ? <span className="text-brand-green font-semibold">200 tonnes</span> : <div className="border-b border-border-mid min-h-[18px]"></div>}
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">3. What do blue whales eat?</div>
          {isAnswerKey ? (
            <div className="pl-4 text-brand-green font-semibold text-xs">Krill (tiny shrimp-like animals)</div>
          ) : (
            <>
              <div className="border-b border-border-mid min-h-[18px] mx-4"></div>
              <div className="border-b border-border-mid min-h-[18px] mx-4 mt-1"></div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ScienceContent({ isAnswerKey }: { isAnswerKey: boolean }) {
  return (
    <div className="space-y-2 text-sm font-sans">
      {[
        ["1. Which state of matter has a definite shape and definite volume?", "Solid"],
        ["2. What is it called when a liquid changes to a gas?", "Evaporation / vaporization"],
        ["3. In which state are the particles farthest apart?", "Gas"],
        ["4. Water freezes at ___ °C.", "0"],
        ["5. Water boils at ___ °C.", "100"],
        ["6. Name one example of sublimation.", "Dry ice evaporating / frost on windows"],
        ["7. What state change occurs when water vapour hits a cold window?", "Condensation"],
        ["8. True or False: A gas has a definite volume.", "False"],
      ].map(([q, a], i) => (
        <div key={i} className="py-1">
          <div className="font-medium mb-1">{q}</div>
          {isAnswerKey ? (
            <div className="pl-4 text-brand-green font-semibold text-xs">{a}</div>
          ) : (
            <div className="border-b border-border-mid min-h-[18px] mx-4"></div>
          )}
        </div>
      ))}
    </div>
  );
}

function WritingContent({ isAnswerKey }: { isAnswerKey: boolean }) {
  return (
    <div className="space-y-3 text-sm font-sans">
      <div>
        <div className="font-semibold mb-1">1. Circle the noun:</div>
        <div className="pl-4 text-base">
          run · <span className={isAnswerKey ? "bg-brand-green-light text-brand-green px-1 rounded font-bold" : ""}>dog</span> · quickly · blue
        </div>
      </div>
      <div>
        <div className="font-semibold mb-1">2. Circle the verb:</div>
        <div className="pl-4 text-base">
          happy · table · <span className={isAnswerKey ? "bg-brand-green-light text-brand-green px-1 rounded font-bold" : ""}>jump</span> · city
        </div>
      </div>
      <div>
        <div className="font-semibold mb-1">3. Write one noun that names a place:</div>
        {isAnswerKey ? (
          <div className="pl-4 text-brand-green font-semibold text-xs italic">e.g. park, school, library</div>
        ) : (
          <div className="border-b border-border-mid min-h-[18px] mx-4"></div>
        )}
      </div>
      <div>
        <div className="font-semibold mb-1">4. Underline the nouns and circle the verbs:</div>
        <div className="pl-4 text-base italic">
          {isAnswerKey ? (
            <><u>The dog</u> <span className="bg-brand-green-light text-brand-green px-1 rounded font-bold">ran</span> across the green <u>field</u>.</>
          ) : (
            "The dog ran across the green field."
          )}
        </div>
      </div>
      <div>
        <div className="font-semibold mb-1">5. Write a sentence using one noun and one verb:</div>
        <div className="border-b border-border-mid min-h-[18px] mx-4"></div>
        <div className="border-b border-border-mid min-h-[18px] mx-4 mt-1"></div>
      </div>
    </div>
  );
}
