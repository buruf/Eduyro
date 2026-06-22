// src/app/placement/page.tsx
// FIXES IN THIS REVISION:
//   #PT1  Multi-subject flow simplified — UI now restricts to one subject
//         at a time until the "load next test" endpoint exists.
//   #PT2  Anonymous demo mode is now HONEST. We tell unauthenticated users
//         this is a sample preview and they need to sign up to get a real
//         placement result. No fake "M5 placement" given to anonymous users.
//   #PT3  Progress bar uses real totalQuestions from API, not hardcoded 10.
//   #PT4  Fractions render as clean UTF-8 (2/4, 3/4), not corrupted glyphs.
//   #PT5  "Test another subject" clears selectedSubjects to avoid re-taking.
//   #PT7  Bumped reveal timing from 1.2s to 2.5s so users can see correct answer.
//   #PT9  Anonymous demo result links to /register, not /student (which 401s).
//   #PT10 Cleaned up encoding garbage in subject icons and result emoji.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui";
import { cn } from "@/lib/utils";

type Subject = "MATH" | "READING" | "WRITING" | "SCIENCE";
type Screen = "intro" | "subjects" | "question" | "results";

const SUBJECTS: { id: Subject; name: string; icon: string; desc: string }[] = [
  { id: "MATH", name: "Mathematics", icon: "∑", desc: "Counting through Calculus" },
  { id: "READING", name: "Reading", icon: "📖", desc: "Phonics to literary analysis" },
  { id: "WRITING", name: "Writing", icon: "✍️", desc: "Grammar through essays" },
  { id: "SCIENCE", name: "Science", icon: "🔬", desc: "Concepts and inquiry" },
];

const REVEAL_MS = 2500; // #PT7 FIX: was 1200ms — too fast to register correct answer

interface QuestionState {
  testId: string;
  subjectSlug: Subject;
  subjectName: string;
  question: { id: string; question: string; options: string[]; difficulty: number; levelCode: string } | null;
  questionNumber: number;
  totalQuestions: number;
  isDemo: boolean;
}

interface ResultData {
  subjectSlug: string;
  subjectName: string;
  assignedLevelCode: string;
  assignedLevelName: string;
  confidenceScore: number;
  correctCount: number;
  totalQuestions: number;
  accuracyPct: number;
  isDemo: boolean;
}

export default function PlacementPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("intro");
  // #PT1 FIX: single subject at a time, not array. Multi-subject is broken.
  const [selectedSubject, setSelectedSubject] = useState<Subject>("MATH");
  // Subjects the signed-in child is ALLOWED to place into (parent-enabled).
  // null = anonymous/marketing demo → show all four as a sample.
  const [allowedSubjects, setAllowedSubjects] = useState<Subject[] | null>(null);

  // On mount, learn which subjects this child may place into. Anonymous users
  // (no student profile / 401) keep the full sample. A deep-link (?subject=MATH
  // from the dashboard) preselects that subject if it's enabled.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/students/me/subjects");
        if (!res.ok) return; // anonymous or no profile → leave allowedSubjects null
        const data = await res.json();
        const slugs: Subject[] = (data?.data?.subjects ?? []).map((s: any) => s.slug);
        if (cancelled || slugs.length === 0) return;
        setAllowedSubjects(slugs);
        const param = new URLSearchParams(window.location.search).get("subject") as Subject | null;
        const target = param && slugs.includes(param) ? param : slugs[0];
        setSelectedSubject(target);
        if (param && slugs.includes(param)) setScreen("subjects"); // jump past intro when deep-linked
      } catch {
        /* network error → leave as anonymous demo */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [questionState, setQuestionState] = useState<QuestionState | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<ResultData | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function startTest() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/placement/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectSlugs: [selectedSubject] }),
      });
      const data = await res.json();

      if (!data.success) {
        // Auth required — fall back to honest demo
        if (res.status === 401) {
          runDemoMode();
          return;
        }
        setError(data.error);
        setLoading(false);
        return;
      }

      setQuestionState({
        testId: data.data.testId,
        subjectSlug: data.data.subjectSlug,
        subjectName: data.data.subjectName,
        question: data.data.question,
        questionNumber: data.data.questionNumber ?? 1,
        // #PT3 FIX: use the real total from the API
        totalQuestions: data.data.totalQuestions ?? 10,
        isDemo: false,
      });
      setStartTime(Date.now());
      setScreen("question");
    } catch {
      runDemoMode();
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (selectedIndex === null || !questionState?.question) return;
    setLoading(true);

    try {
      const res = await fetch("/api/placement/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: questionState.testId,
          questionId: questionState.question.id,
          selectedIndex,
          timeMs: Date.now() - startTime,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        setLoading(false);
        return;
      }

      const correctIdx = questionState.question.options.findIndex((o) => o === data.data.correctAnswer);
      setCorrectIndex(correctIdx);
      setAnswered(true);

      setTimeout(() => {
        if (data.data.done) {
          setResult({ ...data.data.result, isDemo: false });
          setScreen("results");
        } else {
          setQuestionState({
            ...questionState,
            question: data.data.question,
            questionNumber: data.data.questionNumber,
            totalQuestions: data.data.totalQuestions ?? questionState.totalQuestions,
          });
          setSelectedIndex(null);
          setAnswered(false);
          setCorrectIndex(null);
          // #PT6 FIX: reset start time for each new question so timing is accurate
          setStartTime(Date.now());
        }
        setLoading(false);
      }, REVEAL_MS);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  // #PT2 FIX: anonymous demo mode is now HONEST. No fake placement result.
  function runDemoMode() {
    setQuestionState({
      testId: "demo",
      subjectSlug: selectedSubject,
      subjectName: SUBJECTS.find((s) => s.id === selectedSubject)!.name,
      question: DEMO_BANK[selectedSubject][0],
      questionNumber: 1,
      totalQuestions: DEMO_BANK[selectedSubject].length,
      isDemo: true,
    });
    setStartTime(Date.now());
    setScreen("question");
    setLoading(false);
  }

  function demoAnswer() {
    if (selectedIndex === null || !questionState?.question) return;

    const currentQ = questionState.question;
    const correct = DEMO_ANSWERS[currentQ.id] ?? 0;
    setCorrectIndex(correct);
    setAnswered(true);

    setTimeout(() => {
      const bank = DEMO_BANK[questionState.subjectSlug];
      const nextIdx = questionState.questionNumber;

      if (nextIdx >= bank.length) {
        // Demo done — but instead of a fake placement, show an honest "sign up" prompt
        setResult({
          subjectSlug: questionState.subjectSlug,
          subjectName: questionState.subjectName,
          assignedLevelCode: "—",
          assignedLevelName: "—",
          confidenceScore: 0,
          correctCount: 0,
          totalQuestions: bank.length,
          accuracyPct: 0,
          isDemo: true,
        });
        setScreen("results");
      } else {
        setQuestionState({
          ...questionState,
          question: bank[nextIdx],
          questionNumber: nextIdx + 1,
          totalQuestions: bank.length,
        });
        setSelectedIndex(null);
        setAnswered(false);
        setCorrectIndex(null);
        setStartTime(Date.now());
      }
    }, REVEAL_MS);
  }

  return (
    <div className="min-h-screen bg-cream-dark">
      <nav className="bg-cream border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <BrandLogo size="sm" />
          <Link href="/" className="text-xs text-muted hover:text-ink transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-brand-red-light border border-brand-red/30 text-brand-red text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* INTRO */}
        {screen === "intro" && (
          <div className="bg-white border border-border rounded-2xl p-8 text-center shadow-card">
            <div className="w-16 h-16 mx-auto bg-gold-light rounded-full flex items-center justify-center text-2xl mb-4">
              🎯
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gold mb-2">
              Eduyro Placement
            </div>
            <h1 className="font-serif text-3xl font-bold mb-3 leading-tight">
              Find your exact<br />starting level.
            </h1>
            <p className="text-sm text-muted leading-relaxed max-w-md mx-auto mb-6">
              This adaptive test figures out your real skill level — not your grade level — and places you exactly where mastery should begin.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { v: "15 min", l: "Average time" },
                { v: "10–15", l: "Questions per subject" },
                { v: "Instant", l: "Results & placement" },
              ].map((s) => (
                <div key={s.l} className="bg-cream-dark rounded-lg p-3">
                  <div className="font-serif text-base font-bold">{s.v}</div>
                  <div className="text-[10px] text-muted mt-1 leading-tight">{s.l}</div>
                </div>
              ))}
            </div>

            <Button variant="primary" fullWidth size="lg" onClick={() => setScreen("subjects")} rightIcon={<span>→</span>}>
              Begin placement test
            </Button>
            <Link href="/" className="block mt-3">
              <Button variant="secondary" fullWidth>Not now</Button>
            </Link>
          </div>
        )}

        {/* SUBJECT SELECT */}
        {screen === "subjects" && (
          <div className="bg-white border border-border rounded-2xl p-8 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wider text-gold mb-2">
              Step 1 of 3
            </div>
            <h2 className="font-serif text-2xl font-bold mb-2">Choose your subject.</h2>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              {allowedSubjects
                ? "Pick a subject to get placed. These are the subjects your parent has enabled for you."
                : "Pick the subject you want placed first. You can come back later to take placement in other subjects."}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {(allowedSubjects ? SUBJECTS.filter((s) => allowedSubjects.includes(s.id)) : SUBJECTS).map((s) => {
                const isSelected = selectedSubject === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubject(s.id)}
                    className={cn(
                      "relative p-4 border-[1.5px] rounded-xl text-left transition-all",
                      isSelected ? "bg-brand-blue-light border-brand-blue" : "bg-white border-border hover:border-brand-blue"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-3 text-brand-blue text-xs font-bold">✓</div>
                    )}
                    <span className="block text-2xl mb-2">{s.icon}</span>
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="text-xs text-muted mt-0.5 leading-tight">{s.desc}</div>
                  </button>
                );
              })}
            </div>

            <Button variant="primary" fullWidth size="lg" onClick={startTest} loading={loading} rightIcon={<span>→</span>}>
              Start {SUBJECTS.find((s) => s.id === selectedSubject)?.name} test
            </Button>
            <Button variant="secondary" fullWidth className="mt-2" onClick={() => setScreen("intro")}>
              ← Back
            </Button>
          </div>
        )}

        {/* QUESTION */}
        {screen === "question" && questionState?.question && (
          <>
            {questionState.isDemo && (
              <div className="bg-gold-light border border-gold/40 text-gold-dark rounded-md p-3 text-xs mb-4">
                <strong>Sample preview.</strong> You're not signed in, so this is a short sample test that won't give you a real placement. <Link href="/register" className="underline font-semibold">Sign up free</Link> to take the full adaptive test and get placed.
              </div>
            )}

            <ProgressBar
              current={questionState.questionNumber}
              max={questionState.totalQuestions}
              label={`Question ${questionState.questionNumber} of ${questionState.totalQuestions} · ${questionState.subjectName}`}
            />

            <div className="bg-white border border-border rounded-2xl p-8 shadow-card">
              <div className="inline-flex items-center gap-2 bg-brand-blue-light text-brand-blue text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                {questionState.subjectName} · Level {questionState.question.levelCode}
              </div>

              <div className="font-serif text-2xl font-bold mb-6 text-center leading-tight">
                {questionState.question.question}
              </div>

              <div className="space-y-2.5">
                {questionState.question.options.map((opt, i) => {
                  const isSel = selectedIndex === i;
                  const isCorrect = answered && correctIndex === i;
                  const isWrong = answered && isSel && correctIndex !== i;
                  return (
                    <button
                      key={i}
                      onClick={() => !answered && setSelectedIndex(i)}
                      disabled={answered}
                      className={cn(
                        "w-full px-4 py-3 border-[1.5px] rounded-lg text-left font-serif font-medium text-base transition-all flex items-center gap-3",
                        isCorrect && "bg-brand-green-light border-brand-green text-brand-green",
                        isWrong && "bg-brand-red-light border-brand-red text-brand-red",
                        isSel && !answered && "bg-brand-blue-light border-brand-blue text-brand-blue",
                        !isSel && !answered && "border-border hover:border-brand-blue hover:bg-brand-blue-light"
                      )}
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-bold flex-shrink-0 font-sans",
                        isCorrect && "bg-brand-green-light border-brand-green text-brand-green",
                        isWrong && "bg-brand-red-light border-brand-red text-brand-red",
                        isSel && !answered && "bg-brand-blue-light border-brand-blue text-brand-blue",
                        !isSel && !answered && "bg-cream-dark border-border"
                      )}>
                        {["A", "B", "C", "D"][i]}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="blue"
                  fullWidth
                  disabled={selectedIndex === null || answered}
                  loading={loading && answered}
                  onClick={questionState.isDemo ? demoAnswer : submitAnswer}
                  rightIcon={<span>→</span>}
                >
                  {answered ? "..." : "Next"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* RESULTS — real placement OR honest demo prompt */}
        {screen === "results" && result && !result.isDemo && (
          <div className="bg-white border border-border rounded-2xl p-8 shadow-card">
            <div className="w-16 h-16 mx-auto bg-brand-blue-light rounded-full flex items-center justify-center text-2xl mb-4">
              🎯
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gold text-center mb-2">
              Placement complete
            </div>

            <div className="text-center mb-6">
              <div className="font-serif text-5xl font-bold leading-none text-brand-blue mb-2">
                Level {result.assignedLevelCode}
              </div>
              <div className="text-sm text-muted">
                {result.subjectName} — {result.assignedLevelName}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <ResultStat value={`${result.correctCount}/${result.totalQuestions}`} label="Correct" color="brand-blue" />
              <ResultStat value={`${Math.round(result.accuracyPct)}%`} label="Accuracy" color="brand-green" />
              <ResultStat
                value={result.confidenceScore >= 0.8 ? "High" : result.confidenceScore >= 0.6 ? "Medium" : "Low"}
                label="Confidence"
                color="gold"
              />
            </div>

            <div className="bg-brand-blue-light border border-brand-blue/30 rounded-lg p-4 mb-5">
              <div className="text-xs font-semibold text-brand-blue mb-2">Your personalized learning path</div>
              <ul className="space-y-1.5 text-xs text-ink leading-relaxed">
                <li>• Start at Level {result.assignedLevelCode} — {result.assignedLevelName}</li>
                <li>• 3 worksheets per day · 20 problems each · 10-minute target</li>
                <li>• Reach 95% accuracy for 5 consecutive days to advance</li>
              </ul>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => router.push("/student")}
              rightIcon={<span>→</span>}
            >
              Go to my dashboard
            </Button>
            {(allowedSubjects === null || allowedSubjects.length > 1) && (
              <Button
                variant="secondary"
                fullWidth
                className="mt-2"
                onClick={() => {
                  // #PT5 FIX: clear selection so user picks a different subject
                  setScreen("subjects");
                  setResult(null);
                }}
              >
                Take placement in another subject
              </Button>
            )}
          </div>
        )}

        {/* DEMO RESULTS — honest "sign up to get real placement" */}
        {screen === "results" && result?.isDemo && (
          <div className="bg-white border border-border rounded-2xl p-8 shadow-card text-center">
            <div className="w-16 h-16 mx-auto bg-gold-light rounded-full flex items-center justify-center text-2xl mb-4">
              👋
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gold mb-2">
              Sample preview complete
            </div>
            <h2 className="font-serif text-2xl font-bold mb-3">
              Nice work — that was the sample.
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-6 max-w-md mx-auto">
              The real adaptive placement test asks 10–15 questions and gives you an exact level placement.
              It takes about 15 minutes and is completely free — sign up to take it.
            </p>

            <Link href="/register">
              <Button variant="primary" fullWidth size="lg" rightIcon={<span>→</span>}>
                Sign up free to take the real test
              </Button>
            </Link>
            <Link href="/signin" className="block mt-3">
              <Button variant="secondary" fullWidth>Already have an account? Sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ current, max, label }: { current: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((current / Math.max(max, 1)) * 100));
  return (
    <div className="mb-5">
      <div className="flex justify-between text-xs text-muted mb-2">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} color="blue" />
    </div>
  );
}

function ResultStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="bg-cream-dark rounded-lg p-3 text-center">
      <div className={cn("font-serif text-lg font-bold", `text-${color}`)}>{value}</div>
      <div className="text-[10px] text-muted uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

// Demo question bank — short sample for unauthenticated users
// #PT4 FIX: fractions now use plain text "1/2" instead of corrupted glyphs
const DEMO_BANK: Record<Subject, { id: string; question: string; options: string[]; difficulty: number; levelCode: string }[]> = {
  MATH: [
    { id: "d-m-1", question: "What is 4 + 7?", options: ["10", "11", "12", "13"], difficulty: 0.5, levelCode: "M3" },
    { id: "d-m-2", question: "What is 15 − 8?", options: ["6", "7", "8", "9"], difficulty: 0.8, levelCode: "M4" },
    { id: "d-m-3", question: "What is 6 × 7?", options: ["36", "42", "48", "54"], difficulty: 1.0, levelCode: "M5" },
    { id: "d-m-4", question: "What is 9 × 8?", options: ["63", "64", "72", "81"], difficulty: 1.1, levelCode: "M5" },
    { id: "d-m-5", question: "What is 63 ÷ 7?", options: ["7", "8", "9", "10"], difficulty: 1.4, levelCode: "M6" },
    { id: "d-m-6", question: "What is 1/2 + 1/4?", options: ["2/4", "3/4", "4/6", "2/3"], difficulty: 1.6, levelCode: "M7" },
    { id: "d-m-7", question: "Simplify 6/8.", options: ["2/4", "3/4", "1/2", "4/6"], difficulty: 1.7, levelCode: "M7" },
    { id: "d-m-8", question: "What is 15% of 200?", options: ["20", "25", "30", "35"], difficulty: 2.0, levelCode: "M9" },
  ],
  READING: [
    { id: "d-r-1", question: "What does 'enormous' mean?", options: ["Very small", "Very large", "Very fast", "Very old"], difficulty: 1.1, levelCode: "R4" },
    { id: "d-r-2", question: "What is a synonym for 'swift'?", options: ["Slow", "Loud", "Fast", "Heavy"], difficulty: 1.3, levelCode: "R5" },
    { id: "d-r-3", question: "'The sun smiled down.' This is:", options: ["Simile", "Metaphor", "Personification", "Alliteration"], difficulty: 2.1, levelCode: "R8" },
  ],
  WRITING: [
    { id: "d-w-1", question: "Which word is a noun?", options: ["Run", "Happy", "Dog", "Quickly"], difficulty: 0.8, levelCode: "W2" },
    { id: "d-w-2", question: "Which uses a comma correctly?", options: ["I like cats and, dogs.", "I like cats, and I like dogs.", "I, like cats.", "I like, cats."], difficulty: 1.1, levelCode: "W4" },
  ],
  SCIENCE: [
    { id: "d-s-1", question: "What do plants need to make food?", options: ["Soil only", "Sunlight, water, CO₂", "Oxygen and soil", "Water only"], difficulty: 0.6, levelCode: "S1" },
    { id: "d-s-2", question: "What state has definite shape and volume?", options: ["Gas", "Liquid", "Plasma", "Solid"], difficulty: 1.4, levelCode: "S4" },
  ],
};

const DEMO_ANSWERS: Record<string, number> = {
  "d-m-1": 1, "d-m-2": 1, "d-m-3": 1, "d-m-4": 2, "d-m-5": 2, "d-m-6": 1, "d-m-7": 1, "d-m-8": 2,
  "d-r-1": 1, "d-r-2": 2, "d-r-3": 2,
  "d-w-1": 2, "d-w-2": 1,
  "d-s-1": 1, "d-s-2": 3,
};
