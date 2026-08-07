// src/components/tutorial/pilot/SkipCheck.tsx
// "I already know this" gate: three quick problems, all correct → legit
// skip (onPass); any miss → fall back into the tutorial at the reveal beat
// (onFail). No timer, no penalty copy — every advance is a tap.
"use client";

import { useState } from "react";
import { PILOT } from "./pilot-script";

// Deliberately NOT 20 × 3 (the tutorial's own taught example) — the check
// must not reuse the numbers the child is being tested on, so this is the
// one allowed exception to "no numbers outside PILOT." Same family
// (multiplying tens) so it still measures the same skill.
const SKIP_PROBLEMS = [
  { a: 40, b: 2, answer: 80 },
  { a: 60, b: 3, answer: 180 },
  { a: 20, b: 5, answer: 100 },
];

interface Props {
  onPass: () => void;
  onFail: () => void;
  onTap?: () => void;
}

export default function SkipCheck({ onPass, onFail, onTap }: Props) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [failed, setFailed] = useState(false);

  const problem = SKIP_PROBLEMS[index];

  function submit() {
    if (!value) return;
    if (Number(value) === problem.answer) {
      if (index === SKIP_PROBLEMS.length - 1) {
        onPass();
      } else {
        setIndex(index + 1);
        setValue("");
      }
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="min-h-[2.5rem] text-lg font-medium text-ink">{PILOT.skipFailLine}</div>
        <button
          type="button"
          onClick={() => {
            onTap?.();
            onFail();
          }}
          className="px-6 py-3 rounded-full bg-brand-blue text-white font-semibold animate-pulse"
        >
          Tap to continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="min-h-[2.5rem] text-4xl font-bold text-ink font-serif">
        {problem.a} × {problem.b} =
      </div>
      <SkipKeypad
        value={value}
        onChange={setValue}
        onSubmit={submit}
        onTap={() => onTap?.()}
      />
    </div>
  );
}

// Small local keypad, consistent with GuessKeypad in MulTensPilotTutorial
// (not imported — that one is a module-private function in that file).
function SkipKeypad({
  value,
  onChange,
  onSubmit,
  onTap,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onTap: () => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];
  return (
    <div className="grid grid-cols-3 gap-2 w-48">
      <div className="col-span-3 text-2xl font-bold text-ink mb-1 min-h-[2rem]">{value || "?"}</div>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            onTap();
            if (k === "⌫") onChange(value.slice(0, -1));
            else if (k === "✓") onSubmit();
            else if (value.length < 3) onChange(value + k);
          }}
          className={
            k === "✓"
              ? "rounded-lg bg-brand-blue text-white font-bold py-2"
              : "rounded-lg bg-white border border-ink/15 text-ink font-semibold py-2 hover:bg-ink/5"
          }
        >
          {k}
        </button>
      ))}
    </div>
  );
}
