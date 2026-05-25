// src/components/marketing/PracticeWidgets.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function PracticeWidgets() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <MathPractice />
      <VocabPractice />
    </div>
  );
}

// ─────────────────────────────────────────────
// Math practice — ×9 tables
// ─────────────────────────────────────────────

function MathPractice() {
  const problems = [
    { q: "9 × 7", a: 63 },
    { q: "9 × 8", a: 72 },
    { q: "9 × 4", a: 36 },
    { q: "9 × 12", a: 108 },
    { q: "9 × 11", a: 99 },
    { q: "9 × 6", a: 54 },
    { q: "9 × 3", a: 27 },
    { q: "9 × 5", a: 45 },
  ];
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState<string | null>(null);

  function check() {
    const filled = Object.keys(answers).length;
    if (filled === 0) {
      setScore("Type your answers first!");
      return;
    }
    const newResults: Record<number, boolean> = {};
    let correct = 0;
    problems.forEach((p, i) => {
      const val = parseInt(answers[i]);
      if (!isNaN(val)) {
        newResults[i] = val === p.a;
        if (val === p.a) correct++;
      }
    });
    setResults(newResults);
    const pct = Math.round((correct / problems.length) * 100);
    setScore(
      `${correct}/${problems.length} correct (${pct}%) — ${
        pct === 100 ? "🎉 Perfect!"
          : pct >= 80 ? "👍 Great work!"
          : pct >= 60 ? "Keep practicing"
          : "Review ×9 tables and try again"
      }`
    );
  }

  function reset() {
    setAnswers({});
    setResults({});
    setScore(null);
  }

  const scoreColor = score?.includes("Perfect") || score?.includes("Great")
    ? "text-brand-green"
    : score?.includes("Keep") ? "text-gold"
    : score?.includes("Review") ? "text-brand-red"
    : "text-muted";

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-blue mb-1">
            Math · Level M5
          </div>
          <div className="font-serif text-lg font-bold">×9 Multiplication Drill</div>
          <div className="text-xs text-muted">Type all 8 answers, then click Check.</div>
        </div>
        <span className="text-2xl">∑</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-5 font-serif">
        {problems.map((p, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-cream-dark">
            <span className="text-[10px] text-muted/50 font-sans w-5">{i + 1}.</span>
            <span className="font-bold flex-1 text-sm">{p.q} =</span>
            <input
              type="number"
              value={answers[i] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
              className={cn(
                "w-14 h-7 text-center text-sm font-bold border rounded font-serif outline-none transition-colors",
                results[i] === true && "bg-brand-green-light border-brand-green text-brand-green",
                results[i] === false && "bg-brand-red-light border-brand-red text-brand-red",
                results[i] === undefined && "border-border-mid bg-cream-dark/30 focus:border-brand-blue"
              )}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={check}
          className="flex-1 bg-brand-blue text-white text-sm font-medium py-2 rounded-lg hover:bg-brand-blue/90 transition-colors"
        >
          Check answers
        </button>
        <button
          onClick={reset}
          className="bg-cream-dark text-ink text-sm font-medium py-2 px-4 rounded-lg hover:bg-border-mid/40 transition-colors"
        >
          Reset
        </button>
      </div>

      {score && (
        <div className={cn("mt-3 text-center text-sm font-semibold", scoreColor)}>{score}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Vocabulary synonyms
// ─────────────────────────────────────────────

function VocabPractice() {
  const problems = [
    { word: "swift", correct: "fast", options: ["slow", "fast", "loud", "heavy"] },
    { word: "enormous", correct: "huge", options: ["tiny", "huge", "quick", "blue"] },
    { word: "ancient", correct: "old", options: ["new", "broken", "old", "tall"] },
    { word: "joyful", correct: "happy", options: ["sad", "happy", "tired", "quiet"] },
  ];
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<string | null>(null);

  function check() {
    if (Object.keys(picks).length < problems.length) {
      setScore("Pick an answer for every word first!");
      return;
    }
    let correct = 0;
    problems.forEach((p, i) => {
      if (picks[i] === p.correct) correct++;
    });
    setShowResults(true);
    const pct = Math.round((correct / problems.length) * 100);
    setScore(
      `${correct}/${problems.length} correct (${pct}%) — ${
        pct === 100 ? "🎉 Vocabulary star!"
          : pct >= 75 ? "👍 Solid grasp"
          : "Review and try again"
      }`
    );
  }

  function reset() {
    setPicks({});
    setShowResults(false);
    setScore(null);
  }

  const scoreColor = score?.includes("star") || score?.includes("Solid")
    ? "text-brand-green"
    : score?.includes("Review") ? "text-brand-red"
    : "text-muted";

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gold-dark mb-1">
            Reading · Level R4
          </div>
          <div className="font-serif text-lg font-bold">Synonyms — Choose the closest match</div>
          <div className="text-xs text-muted">Pick the word with the same meaning.</div>
        </div>
        <span className="text-2xl">📖</span>
      </div>

      <div className="space-y-4 mt-5">
        {problems.map((p, i) => (
          <div key={i}>
            <div className="text-sm mb-2">
              <span className="text-[10px] text-muted/50 font-sans mr-2">{i + 1}.</span>
              Closest meaning to <strong className="font-serif italic">"{p.word}"</strong>:
            </div>
            <div className="flex flex-wrap gap-2 pl-5">
              {p.options.map((o) => {
                const isPicked = picks[i] === o;
                const isCorrect = showResults && o === p.correct;
                const isWrong = showResults && isPicked && o !== p.correct;
                return (
                  <button
                    key={o}
                    onClick={() => !showResults && setPicks({ ...picks, [i]: o })}
                    disabled={showResults}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border-[1.5px] transition-all font-medium",
                      isCorrect && "bg-brand-green-light border-brand-green text-brand-green",
                      isWrong && "bg-brand-red-light border-brand-red text-brand-red",
                      isPicked && !showResults && "bg-brand-blue-light border-brand-blue text-brand-blue",
                      !isPicked && !showResults && "bg-white border-border hover:border-ink"
                    )}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-5">
        <button
          onClick={check}
          className="flex-1 bg-brand-blue text-white text-sm font-medium py-2 rounded-lg hover:bg-brand-blue/90 transition-colors"
        >
          Check answers
        </button>
        <button
          onClick={reset}
          className="bg-cream-dark text-ink text-sm font-medium py-2 px-4 rounded-lg hover:bg-border-mid/40 transition-colors"
        >
          Reset
        </button>
      </div>

      {score && (
        <div className={cn("mt-3 text-center text-sm font-semibold", scoreColor)}>{score}</div>
      )}
    </div>
  );
}
