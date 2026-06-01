// src/app/(dashboard)/admin/page.tsx
"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";
import { DashboardTopbar } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card, StatCard, Badge, Input, Select } from "@/components/ui";
import { IntegrationsPanel } from "@/components/dashboard/IntegrationsPanel";
import { ScheduledJobsPanel } from "@/components/dashboard/ScheduledJobsPanel";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "curriculum", label: "Curriculum builder" },
  { id: "worksheets", label: "Worksheet creator" },
  { id: "export", label: "Bulk PDF export" },
  { id: "roster", label: "Student roster" },
  { id: "analytics", label: "Analytics" },
  { id: "review", label: "Content review", href: "/admin/content-review" },
  { id: "integrations", label: "Integrations" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("curriculum");

  return (
    // CHANGED: removed the grid-cols-[210px_1fr] layout and the DashboardSidebar.
    // The top tabs already do the same navigation, so the sidebar was just
    // duplicated and (worse) the sidebar links were dead (#-anchors that never
    // triggered the activeTab state). Layout is now full-width.
    <div className="flex flex-col min-h-screen">
      <DashboardTopbar
        title="Eduyro Admin"
        subtitle="Curriculum · Worksheets · Student Reports"
        action={
  <div className="flex gap-2">
    <Button variant="secondary" size="sm" disabled title="PDF export coming soon">Export report</Button>
    <Button variant="primary" size="sm" disabled title="Students self-register at /register">+ Add student</Button>
    
  </div>
}
      />

      {/* Tabs */}
      <div className="bg-white border-b border-border px-5 flex gap-1 flex-shrink-0 overflow-x-auto">
        {TABS.map((tab) => {
          const href = (tab as any).href;
          if (href) {
            return (
              <Link
                key={tab.id}
                href={href}
                className="px-3 py-2.5 text-xs whitespace-nowrap border-b-2 border-transparent text-muted hover:text-ink transition-colors -mb-px"
              >
                {tab.label} →
              </Link>
            );
          }
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors -mb-px",
                activeTab === tab.id
                  ? "border-brand-blue text-brand-blue font-medium"
                  : "border-transparent text-muted hover:text-ink"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === "curriculum" && <CurriculumTab />}
        {activeTab === "worksheets" && <WorksheetCreatorTab />}
        {activeTab === "export" && <BulkExportTab />}
        {activeTab === "roster" && <RosterTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "integrations" && <Suspense fallback={<div className="p-8 text-sm text-muted">Loading integrations…</div>}><IntegrationsTab /></Suspense>}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Curriculum Builder
// ─────────────────────────────────────────────────────────────────────

function CurriculumTab() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active levels" value="23" color="blue" />
        <StatCard label="Total worksheets" value="735" color="green" />
        <StatCard label="Subjects" value="4" color="gold" />
        <StatCard label="Pending review" value="—" color="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Curriculum hierarchy</h3>
            <Button variant="blue" size="sm" disabled title="Custom level creation coming in Phase 6">+ Add level</Button>
          </div>
          <CurriculumTree />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3">Level detail — M5 Multiplication Fluency</h3>
          <div className="space-y-2">
            {[
              ["Level code", "M5"],
              ["Subject", "Mathematics"],
              ["Grade range", "Grade 3–5"],
              ["Total worksheets", "240"],
              ["Problems per sheet", "20"],
              ["Time limit", "10 min"],
              ["Mastery threshold", "95% × 5 consecutive days"],
              ["Sheets per day", "—"],
              ["Status", "Active ✓"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-1.5 border-b border-border last:border-none">
                <span className="text-muted">{k}</span>
                <span className={cn("font-medium", v.includes("Active") && "text-brand-green")}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="secondary" size="sm" fullWidth disabled title="Coming in Phase 6">Edit level</Button>
            <Button variant="blue" size="sm" fullWidth onClick={() => window.open("/pdf-generator", "_blank")}>Preview worksheets</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function CurriculumTree() {
  const [openSubject, setOpenSubject] = useState<string | null>("Mathematics");
  const subjects = [
    { name: "Mathematics", color: "#1B4F8A", levels: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14", "M15", "M16", "M17", "M18"], bg: "bg-brand-blue-light", text: "text-brand-blue" },
    { name: "Reading", color: "#C8902A", levels: ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"], bg: "bg-gold-light", text: "text-gold-dark" },
    { name: "Writing", color: "#2D6A3F", levels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"], bg: "bg-brand-green-light", text: "text-brand-green" },
    { name: "Science", color: "#C23B22", levels: ["A", "B", "C", "D", "E", "F", "G"], bg: "bg-brand-red-light", text: "text-brand-red" },
  ];

  return (
    <div className="space-y-1.5">
      {subjects.map((s) => {
        const isOpen = openSubject === s.name;
        return (
          <div key={s.name} className="border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setOpenSubject(isOpen ? null : s.name)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-cream-dark transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-sm font-semibold">{s.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted">{s.levels.length} levels</span>
                <span className={cn("text-xs text-muted transition-transform", isOpen && "rotate-180")}>▾</span>
              </div>
            </button>
            {isOpen && (
              <div className="bg-cream-dark border-t border-border p-2 flex flex-wrap gap-1">
                {s.levels.map((l) => (
                  <button
                    key={l}
                    className={cn("text-[10px] font-bold px-2 py-1 rounded border border-transparent hover:border-brand-blue transition-colors", s.bg, s.text)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Worksheet Creator — CASCADING DROPDOWNS + DYNAMIC PREVIEW
// ─────────────────────────────────────────────────────────────────────

// Same curriculum map structure as /pdf-generator. Subject -> Level -> Skills.
// Picking a Subject resets Level. Picking a Level resets Skill.
type SubjectKey = "Mathematics" | "Reading" | "Writing" | "Science";

const CURRICULUM: Record<SubjectKey, Record<string, { skills: string[]; defaultProblemBank?: [string, string][] }>> = {
  Mathematics: {
    "M1 – Counting": { skills: ["Counting 1–10", "Counting 1–50", "Number recognition"] },
    "M3 – Addition": { skills: ["Addition within 5", "Addition within 10", "Number bonds"] },
    "M4 – Subtraction": { skills: ["Subtraction within 10", "Subtraction within 20", "Missing numbers"] },
    "M5 – Multiplication": {
      skills: ["×2–×5 tables", "×6, ×7, ×8 tables", "×9 tables", "Mixed ×6–×9"],
    },
    "M6 – Division": { skills: ["Division basics", "Division by 6, 7, 8", "Division by 9", "Division with remainders"] },
    "M7 – Fractions": { skills: ["Identifying fractions", "Simplifying fractions", "Adding fractions", "Comparing fractions"] },
  },
  Reading: {
    "R2 – Long Vowels": { skills: ["Silent E words", "Long A sound", "Long I sound", "Long O sound"] },
    "R5 – Comprehension": { skills: ["Main idea & details", "Cause and effect", "Sequence of events", "Making inferences"] },
    "R9 – Literary Analysis": { skills: ["Character analysis", "Theme identification", "Figurative language", "Narrative structure"] },
  },
  Writing: {
    "W2 – Parts of Speech": { skills: ["Nouns and verbs", "Adjectives and adverbs", "Pronouns", "Prepositions"] },
    "W5 – Paragraphs": { skills: ["Topic sentences", "Supporting sentences", "Concluding sentences", "Paragraph unity"] },
  },
  Science: {
    "S2 – Ecosystems": { skills: ["Food chains", "Food webs", "Producers and consumers", "Adaptation"] },
    "S4 – States of Matter": { skills: ["Solids, liquids, gases", "State changes", "Melting and freezing", "Evaporation"] },
    "S5 – Biology": { skills: ["Cell structure", "Cell functions", "Photosynthesis", "Respiration"] },
  },
};

// Sample preview problems per math skill. Used for the inline preview only —
// the real PDF generator pulls problems from the server.
const MATH_PREVIEW_BANK: Record<string, [string, string][]> = {
  "×2–×5 tables": [["2×3", "6"], ["2×4", "8"], ["3×4", "12"], ["3×5", "15"], ["4×5", "20"], ["5×5", "25"], ["2×6", "12"], ["3×6", "18"]],
  "×6, ×7, ×8 tables": [["6×7", "42"], ["8×3", "24"], ["7×9", "63"], ["6×8", "48"], ["8×7", "56"], ["7×4", "28"], ["6×9", "54"], ["8×6", "48"]],
  "×9 tables": [["9×7", "63"], ["9×8", "72"], ["9×9", "81"], ["9×4", "36"], ["9×12", "108"], ["9×11", "99"], ["9×3", "27"], ["9×6", "54"]],
  "Mixed ×6–×9": [["6×7", "42"], ["9×8", "72"], ["7×6", "42"], ["8×9", "72"], ["9×7", "63"], ["6×9", "54"], ["8×7", "56"], ["7×8", "56"]],
  "Division basics": [["42÷6", "7"], ["63÷7", "9"], ["72÷8", "9"], ["54÷6", "9"], ["56÷7", "8"], ["48÷6", "8"], ["81÷9", "9"], ["64÷8", "8"]],
  "Addition within 5": [["1+1", "2"], ["1+2", "—"], ["2+2", "4"], ["2+3", "5"], ["1+3", "4"], ["1+4", "5"], ["3+2", "5"], ["2+1", "—"]],
  "Addition within 10": [["3+4", "7"], ["5+2", "7"], ["6+3", "9"], ["4+5", "9"], ["7+2", "9"], ["3+7", "10"], ["5+5", "10"], ["6+4", "10"]],
  "Counting 1–10": [["1, 2, _", "—"], ["3, _, 5", "4"], ["7, 8, _", "9"], ["_, 6, 7", "5"], ["2, _, 4", "—"], ["8, 9, _", "10"], ["1, _, 3", "2"], ["6, _, 8", "7"]],
};

const SUBJECT_LEVEL_PREFIX: Record<SubjectKey, string> = {
  Mathematics: "M5",
  Reading: "R5",
  Writing: "W2",
  Science: "S4",
};

function WorksheetCreatorTab() {
  // FIX: cascading state. Subject picks first Level of that subject, Level picks
  // first Skill of that level. No more impossible combinations like
  // "Reading + ×6, ×7, ×8 tables".
  const initialSubject: SubjectKey = "Mathematics";
  const initialLevel = Object.keys(CURRICULUM[initialSubject])[0];
  const initialSkill = CURRICULUM[initialSubject][initialLevel].skills[0];

  const [subject, setSubject] = useState<SubjectKey>(initialSubject);
  const [level, setLevel] = useState<string>(initialLevel);
  const [skill, setSkill] = useState<string>(initialSkill);
  const [difficulty, setDifficulty] = useState<"Standard" | "Challenge" | "Review">("Standard");
  const [sheets, setSheets] = useState(3);
  const [problems, setProblems] = useState(20);
  const [studentName, setStudentName] = useState("");

  // Derived: what levels and skills are valid for the current subject/level
  const availableLevels = Object.keys(CURRICULUM[subject]);
  const availableSkills = CURRICULUM[subject][level]?.skills ?? [];

  // CASCADE: when subject changes, reset level + skill
  function changeSubject(s: SubjectKey) {
    setSubject(s);
    const firstLevel = Object.keys(CURRICULUM[s])[0];
    setLevel(firstLevel);
    setSkill(CURRICULUM[s][firstLevel].skills[0]);
  }

  // CASCADE: when level changes, reset skill
  function changeLevel(l: string) {
    setLevel(l);
    const skills = CURRICULUM[subject][l]?.skills ?? [];
    if (skills.length > 0) setSkill(skills[0]);
  }

  // Level code = "M5" extracted from "M5 – Multiplication"
  const levelCode = level.split(/\s|–|-/)[0];

  // Estimated minutes per sheet — defaults to 10 (no UI for this in admin yet)
  const minutesPerSheet = 10;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <h3 className="text-sm font-semibold mb-3">Worksheet generator</h3>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <Select
            label="Subject"
            value={subject}
            onChange={(e) => changeSubject(e.target.value as SubjectKey)}
          >
            {Object.keys(CURRICULUM).map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select
            label="Level"
            value={level}
            onChange={(e) => changeLevel(e.target.value)}
          >
            {availableLevels.map((l) => <option key={l}>{l}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <Select
            label="Skill focus"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          >
            {availableSkills.map((sk) => <option key={sk}>{sk}</option>)}
          </Select>
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
          >
            <option>Standard</option>
            <option>Challenge</option>
            <option>Review</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input
            label="Problems per sheet"
            type="number"
            min={1}
            max={120}
            value={problems}
            onChange={(e) => setProblems(Math.min(120, Math.max(1, parseInt(e.target.value) || 20)))}
          />
          <Input
            label="Number of sheets"
            type="number"
            min={1}
            max={10}
            value={sheets}
            onChange={(e) => setSheets(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
          />
        </div>

        <Input
          label="Student name (optional)"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="e.g. Kai Liu"
        />

        <div className="flex gap-2 mt-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              // Open the public PDF generator pre-configured with these settings.
              // The generator handles preview + download (with auto-scaling layout
              // and single answer key at the end) from Batch 1.
              const url =
                `/pdf-generator` +
                `?subject=${encodeURIComponent(subject.toLowerCase())}` +
                `&level=${encodeURIComponent(level)}` +
                `&skill=${encodeURIComponent(skill)}` +
                `&sheets=${sheets}` +
                `&problems=${problems}` +
                `&name=${encodeURIComponent(studentName)}`;
              window.open(url, "_blank");
            }}
          >
            ↗ Open in PDF generator (new tab)
          </Button>
        </div>

        <div className="bg-brand-blue-light text-brand-blue text-xs rounded-md p-2.5 mt-3">
          {sheets} sheet{sheets !== 1 ? "s" : ""} · {sheets * problems} problems · Est. {sheets * minutesPerSheet} min
        </div>

        {/* Helpful note — explains the live preview is a sample, the real PDF
            generator does the full thing */}
        <div className="text-[10px] text-muted mt-2 leading-relaxed">
          The live preview on the right shows {subject === "Mathematics" ? "sample problems" : "sample content"} only.
          Click "Open in PDF generator" to preview every sheet and download a
          printable PDF with auto-scaling layout.
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold">Live preview</h3>
          <span className="text-[10px] text-muted">Sheet 1 of {sheets}</span>
        </div>
        <PreviewSheet
          subject={subject}
          level={level}
          levelCode={levelCode}
          skill={skill}
          name={studentName}
          sheetNumber={1}
          totalSheets={sheets}
          problemCount={problems}
        />
      </Card>
    </div>
  );
}

// CHANGED: preview now reads subject/level/skill from props and adapts.
// Math shows problems from the preview bank for the actual skill.
// Reading/Writing/Science show subject-appropriate placeholder content.
function PreviewSheet({
  subject,
  level,
  levelCode,
  skill,
  name,
  sheetNumber,
  totalSheets,
  problemCount,
}: {
  subject: SubjectKey;
  level: string;
  levelCode: string;
  skill: string;
  name: string;
  sheetNumber: number;
  totalSheets: number;
  problemCount: number;
}) {
  const headerTitle = `${subject} — ${skill}`;

  return (
    <div className="border-2 border-ink rounded-lg p-4 bg-cream-dark font-serif">
      <div className="border-b-2 border-ink pb-2 mb-3 flex justify-between items-end">
        <div>
          <div className="font-sans text-[10px] font-bold">{headerTitle}</div>
          <div className="text-[10px] text-muted">
            Level {levelCode} · Sheet {sheetNumber} of {totalSheets} · Target: 10 min
          </div>
        </div>
        <div className="text-right text-[10px] text-muted">Eduyro<br />Education</div>
      </div>

      <div className="flex gap-3 mb-3 text-[10px] text-muted font-sans">
        <span>Name: <span className="border-b border-border-mid inline-block w-20">{name}</span></span>
        <span>Date: <span className="border-b border-border-mid inline-block w-16"></span></span>
        <span>Score: <span className="border-b border-border-mid inline-block w-12">/{problemCount}</span></span>
      </div>

      {subject === "Mathematics" && <MathPreviewBody skill={skill} />}
      {subject === "Reading" && <ReadingPreviewBody skill={skill} />}
      {subject === "Writing" && <WritingPreviewBody skill={skill} />}
      {subject === "Science" && <SciencePreviewBody skill={skill} />}

      <div className="mt-3 pt-2 border-t border-dashed border-border flex justify-between text-[9px] text-muted">
        <span>Level {levelCode} · Eduyro</span>
        <span>Page {sheetNumber} of {totalSheets}</span>
      </div>
    </div>
  );
}

function MathPreviewBody({ skill }: { skill: string }) {
  // Find a sample problem set that matches the selected skill. If we don't
  // have one for this exact skill, fall back to a similar one.
  const samples = MATH_PREVIEW_BANK[skill] ?? Object.values(MATH_PREVIEW_BANK)[0];
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
      {samples.map(([q], i) => (
        <div key={i} className="flex items-center justify-between py-1 border-b border-cream-dark/60 text-sm">
          <span className="text-[10px] text-border font-sans mr-1">{i + 1}.</span>
          <span className="font-bold flex-1">{q}{q.trim().endsWith("=") ? "" : " ="}</span>
          <div className="w-8 h-4 border border-border-mid rounded bg-white" />
        </div>
      ))}
    </div>
  );
}

function ReadingPreviewBody({ skill }: { skill: string }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="text-[11px] text-muted italic mb-2">Skill: {skill}</div>
      <div className="bg-brand-blue-light/30 border-l-2 border-brand-blue rounded-r px-3 py-2 text-xs leading-relaxed">
        <strong>Passage:</strong> The sun rose slowly over the mountain. The valley below glowed with golden light. A small bird perched on a branch and began to sing…
      </div>
      <div className="text-xs space-y-2 mt-3">
        <div>
          <div className="font-semibold mb-1">1. What time of day is described?</div>
          <div className="border-b border-border-mid mx-3 h-4" />
        </div>
        <div>
          <div className="font-semibold mb-1">2. Where was the bird sitting?</div>
          <div className="border-b border-border-mid mx-3 h-4" />
        </div>
      </div>
    </div>
  );
}

function WritingPreviewBody({ skill }: { skill: string }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="text-[11px] text-muted italic mb-2">Skill: {skill}</div>
      <div className="text-xs space-y-2 mt-2">
        <div>
          <div className="font-semibold mb-1">1. Circle the noun:</div>
          <div className="pl-3">run · dog · quickly · blue</div>
        </div>
        <div>
          <div className="font-semibold mb-1">2. Circle the verb:</div>
          <div className="pl-3">happy · table · jump · city</div>
        </div>
        <div>
          <div className="font-semibold mb-1">3. Write one noun that names a place:</div>
          <div className="border-b border-border-mid mx-3 h-4" />
        </div>
      </div>
    </div>
  );
}

function SciencePreviewBody({ skill }: { skill: string }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="text-[11px] text-muted italic mb-2">Skill: {skill}</div>
      <div className="text-xs space-y-2 mt-2">
        <div>
          <div className="font-semibold mb-1">1. Which state of matter has a definite shape and definite volume?</div>
          <div className="border-b border-border-mid mx-3 h-4" />
        </div>
        <div>
          <div className="font-semibold mb-1">2. What is it called when a liquid changes to a gas?</div>
          <div className="border-b border-border-mid mx-3 h-4" />
        </div>
        <div>
          <div className="font-semibold mb-1">3. In which state are the particles farthest apart?</div>
          <div className="border-b border-border-mid mx-3 h-4" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Bulk Export
// ─────────────────────────────────────────────────────────────────────

function BulkExportTab() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Form state
  const [exportType, setExportType] = useState<"TODAY" | "THIS_WEEK" | "MASTERY_TEST" | "CUSTOM">("TODAY");
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [outputFormat, setOutputFormat] = useState<"ONE_PER_STUDENT" | "ONE_PER_CLASS" | "MERGED">("ONE_PER_STUDENT");

  useEffect(() => {
    fetch("/api/integrations/status").then((r) => r.json()).then((d) => {
      if (d.success) setSchoolId(d.data.school?.id ?? null);
    }).catch(() => {});
  }, []);

  const classes = [
    { name: "Grade 3 – Ms. Patel", students: 24 },
    { name: "Grade 4 – Mr. Kim", students: 22 },
    { name: "Grade 5 – Ms. Torres", students: 38 },
  ];

  async function runBulk() {
    setRunning(true);
    setDone(false);
    setError(null);
    setResultUrl(null);
    setProgress({});

    if (!schoolId) {
      classes.forEach((cls, idx) => {
        let p = 0;
        const interval = setInterval(() => {
          p += 8 + Math.random() * 7;
          if (p >= 100) { p = 100; clearInterval(interval); }
          setProgress((prev) => ({ ...prev, [cls.name]: p }));
        }, 200 + idx * 80);
      });
      setTimeout(() => {
        setRunning(false);
        setError(
          "Demo mode: your account isn't linked to a school yet. To run real bulk exports, contact support to set up your school. Single-student PDFs work via the Worksheet creator tab."
        );
      }, 3000);
      return;
    }

    try {
      const res = await fetch("/api/pdf/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          exportType,
          includeAnswerKey,
          outputFormat,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResultUrl(data.data.zipUrl ?? null);
        setDone(true);
      } else {
        setError(data.error || "Bulk export failed");
      }
    } catch (e: any) {
      setError(e.message ?? "Network error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      {!schoolId && (
        <div className="bg-gold-light border border-gold/40 text-gold-dark rounded-md p-3 text-xs mb-3">
          <strong>Demo mode:</strong> Your account isn't linked to a school yet, so bulk export will run in demo mode. For real bulk exports, your account needs to be associated with a school in the database.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-3">Bulk PDF export — all students</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted min-w-[100px]">Export type</span>
              <select
                className="flex-1 text-xs px-2 py-1.5 border border-border rounded-md"
                value={exportType}
                onChange={(e) => setExportType(e.target.value as any)}
              >
                <option value="TODAY">Today's daily packets</option>
                <option value="THIS_WEEK">This week's packets</option>
                <option value="MASTERY_TEST">Level mastery tests</option>
                <option value="CUSTOM">Custom date range</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted min-w-[100px]">Answer keys</span>
              <select
                className="flex-1 text-xs px-2 py-1.5 border border-border rounded-md"
                value={includeAnswerKey ? "yes" : "no"}
                onChange={(e) => setIncludeAnswerKey(e.target.value === "yes")}
              >
                <option value="yes">Yes — included</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted min-w-[100px]">Output format</span>
              <select
                className="flex-1 text-xs px-2 py-1.5 border border-border rounded-md"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
              >
                <option value="ONE_PER_STUDENT">One PDF per student</option>
                <option value="ONE_PER_CLASS">One PDF per class</option>
                <option value="MERGED">Single merged PDF</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="primary" fullWidth onClick={runBulk} loading={running} disabled={running}>
              🖨 {schoolId ? "Generate packets" : "Run demo"}
            </Button>
            <Button variant="secondary" disabled>📅 Schedule daily</Button>
          </div>

          {error && (
            <div className="bg-brand-red-light border border-brand-red/30 rounded-md p-3 mt-3 text-xs text-brand-red">
              {error}
            </div>
          )}

          {done && (
            <div className="bg-brand-green-light border border-brand-green/30 rounded-md p-3 mt-3 text-xs text-brand-green">
              ✅ Generated successfully!
              {resultUrl ? (
                <a href={resultUrl} target="_blank" rel="noopener">
                  <Button variant="green" fullWidth size="sm" className="mt-2">↓ Download .zip</Button>
                </a>
              ) : (
                <div className="mt-2 text-[11px]">Files saved to server. Check Recent exports below.</div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3">Generation progress</h3>
          {Object.keys(progress).length === 0 && !running ? (
            <div className="text-center text-xs text-muted py-6">
              Click "{schoolId ? "Generate packets" : "Run demo"}" to begin
            </div>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => {
                const pct = progress[cls.name] ?? 0;
                return (
                  <div key={cls.name} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted min-w-[160px]">{cls.name} ({cls.students})</span>
                    <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted min-w-[26px] text-right">{Math.round(pct)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold mb-3">Recent exports</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] text-muted uppercase tracking-wider">
              <th className="py-2">File</th>
              <th className="py-2">Type</th>
              <th className="py-2">Students</th>
              <th className="py-2">Pages</th>
              <th className="py-2">Generated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[
              ["may_9_daily_packets.zip", "Daily", "84", "252", "May 9, 6:00 am"],
              ["week_19_grade4_packets.zip", "Weekly", "22", "330", "May 5, 6:00 am"],
              ["level_3a_mastery_tests.zip", "Test", "14", "42", "Apr 28, 3:00 pm"],
              ["all_students_week18.zip", "Weekly", "84", "1,260", "Apr 28, 6:00 am"],
            ].map((row, i) => (
              <tr key={i} className="border-t border-border">
                {row.map((cell, j) => <td key={j} className="py-2.5">{cell}</td>)}
                <td><Button variant="secondary" size="sm" disabled title="Demo data — real exports become available once bulk export is run">↓</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Roster
// ─────────────────────────────────────────────────────────────────────

function RosterTab() {
  const students: any[] = [];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total students" value="—" color="blue" />
        <StatCard label="Level advances this month" value="—" color="green" />
        <StatCard label="Avg accuracy" value="—" color="gold" />
        <StatCard label="Need attention" value="—" color="red" />
      </div>

      <Card>
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold">Student roster</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search students…"
              className="px-3 py-1.5 text-xs border border-border rounded-md w-40"
            />
            <select className="px-2 py-1.5 text-xs border border-border rounded-md">
              <option>All levels</option><option>Level M5</option><option>Level M4</option><option>Level M3</option>
            </select>
            <Button variant="primary" size="sm" onClick={() => alert("Add Student form coming soon. For now, students self-register at /register, or you can import via CSV in the Roster tab.")}>+ Add student</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] text-muted uppercase tracking-wider">
                <th className="py-2 pl-1">Student</th>
                <th className="py-2">Gr.</th>
                <th className="py-2">Level</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Accuracy</th>
                <th className="py-2">Streak</th>
                <th className="py-2">Sheets</th>
                <th className="py-2">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((row, i) => {
                const [name, grade, level, subj, acc, accC, streak, sheets, status] = row as any;
                return (
                  <tr key={i} className="border-t border-border hover:bg-cream-dark/40 transition-colors">
                    <td className="py-2.5 pl-1 font-medium">{name}</td>
                    <td>{grade}</td>
                    <td>
                      <span className="inline-block bg-brand-blue-light text-brand-blue text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {level}
                      </span>
                    </td>
                    <td>{subj}</td>
                    <td className={cn("font-semibold",
                      accC === "hi" ? "text-brand-green"
                        : accC === "mid" ? "text-gold"
                        : "text-brand-red"
                    )}>
                      {acc}%
                    </td>
                    <td>{streak}</td>
                    <td>{sheets}</td>
                    <td>
                      <Badge variant={
                        status === "Excellent" ? "blue"
                          : status === "On track" ? "green"
                          : status === "Needs review" ? "gold"
                          : "red"
                      }>
                        {status}
                      </Badge>
                    </td>
                    <td><Button variant="secondary" size="sm" onClick={() => alert("Student profile pages are coming in the next release. For now, you can see individual progress in the Analytics tab.")}>View</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const months: string[] = [];
  const vals: number[] = [];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="School avg accuracy" value="—" color="green" />
        <StatCard label="Sheets / week" value="—" color="blue" />
        <StatCard label="Level advances / mo" value="—" color="gold" />
        <StatCard label="Need support" value="—" color="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-3">School accuracy trend (this year)</h3>
          <div className="flex items-end gap-1.5 h-24">
            {months.map((m, i) => {
              const v = vals[i];
              const h = Math.round(v * 0.7);
              const color = v >= 90 ? "bg-brand-green" : v >= 80 ? "bg-brand-blue" : "bg-brand-blue/40";
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] text-muted">{v}%</div>
                  <div className={cn("w-full rounded-t-sm transition-all", color)} style={{ height: `${h}px` }} />
                  <div className="text-[9px] text-muted">{m}</div>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-muted mt-2">
            Average accuracy across all students and subjects. Green = 90%+ school target reached.
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3">Subject breakdown</h3>
          {([] as any[]).map(([subj, pct, color]: any) => (


            <div key={subj} className="flex items-center gap-2 mb-2 text-xs">
              <span className="min-w-[90px]">{subj}</span>
              <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="font-semibold min-w-[30px] text-right" style={{ color }}>{pct}%</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-3">Top performing students</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] text-muted uppercase tracking-wider border-b border-border">
                <th className="py-2">Student</th><th>Level</th><th>Acc.</th><th>Streak</th>
              </tr>
            </thead>
            <tbody>
              {[
                []
              ].map(([n, l, a, s], i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2 font-medium">{n}</td>
                  <td>{l}</td>
                  <td className="text-brand-green font-semibold">{a}</td>
                  <td>{s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3">Students needing support</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] text-muted uppercase tracking-wider border-b border-border">
                <th className="py-2">Student</th><th>Level</th><th>Acc.</th><th>Issue</th>
              </tr>
            </thead>
            <tbody>












            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Integrations
// ─────────────────────────────────────────────────────────────────────

function IntegrationsTab() {
  const [gcStatus, setGcStatus] = useState<{ connected: boolean; googleEmail?: string }>({ connected: false });
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/integrations/status").then((r) => r.json()).then((d) => {
      if (d.success) {
        setGcStatus(d.data.googleClassroom);
        setSchoolId(d.data.school?.id ?? null);
      }
    }).catch(() => {});

    if (searchParams.get("gc_connected") === "1") {
      toast.success("Google Classroom connected!");
    } else if (searchParams.get("gc_error")) {
      toast.error(`Google Classroom: ${searchParams.get("gc_error")}`);
    }
  }, [searchParams]);

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4">
        {schoolId ? (
          <IntegrationsPanel
            schoolId={schoolId}
            connected={gcStatus.connected}
            googleEmail={gcStatus.googleEmail}
          />
        ) : (
          <Card>
            <h3 className="text-sm font-semibold mb-2">Google Classroom</h3>
            <p className="text-xs text-muted">You need to be associated with a school before connecting integrations. Contact support if this is unexpected.</p>
          </Card>
        )}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Coming soon</h3>
          <div className="space-y-2 text-xs text-muted">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>📊 Microsoft Teams for Education</span>
              <Badge variant="neutral">Q3 2026</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>📚 Schoology</span>
              <Badge variant="neutral">Q3 2026</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>🎓 Canvas LMS</span>
              <Badge variant="neutral">Q4 2026</Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>🔗 Custom REST API (district plan)</span>
              <Badge variant="gold">Available</Badge>
            </div>
          </div>
        </Card>
      </div>

      <ScheduledJobsPanel />
    </>
  );
}
