// src/components/practice/MathInputs.tsx
// Typed math-answer input library. Every practice question declares an
// answerType; the renderer picks one of these components so the control always
// matches the expected answer — minimal typing, big tap targets, no paragraph
// boxes. Each component is controlled by a single composed string `value` +
// `onChange`, so grading/submission stay unchanged.
"use client";

import { cn } from "@/lib/utils";

const FIELD =
  "h-12 border-[1.5px] rounded-lg text-2xl text-center font-bold font-serif tabular-nums " +
  "outline-none border-border-mid bg-cream-dark/30 focus:border-brand-blue " +
  "focus-visible:ring-2 focus-visible:ring-brand-blue/40";

function digits(v: string, allowDot: boolean, allowNeg: boolean): string {
  let s = v.replace(allowDot ? /[^0-9.]/g : /[^0-9]/g, "");
  if (allowDot) s = s.replace(/(\..*)\./g, "$1"); // single dot
  if (allowNeg && v.trimStart().startsWith("-")) s = "-" + s;
  return s;
}

// ── Single numeric field: integer / decimal / percent ─────────────────────────
export function NumberInput({
  value, onChange, mode = "integer", autoFocus, ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  mode?: "integer" | "decimal" | "percent";
  autoFocus?: boolean;
  ariaLabel?: string;
}) {
  const allowDot = mode !== "integer";
  const width = mode === "percent" ? "w-[90px]" : mode === "decimal" ? "w-[120px]" : "w-[110px]";
  return (
    <div className="flex items-center justify-center gap-2">
      <input
        type="text"
        inputMode={allowDot ? "decimal" : "numeric"}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(digits(e.target.value, allowDot, mode !== "percent"))}
        placeholder={mode === "decimal" ? "0.0" : "0"}
        aria-label={ariaLabel ?? "Answer"}
        className={cn(FIELD, width, "px-2 placeholder:text-muted/40")}
      />
      {mode === "percent" && <span className="text-2xl font-bold font-serif text-ink">%</span>}
    </div>
  );
}

// ── Stacked fraction: numerator over denominator ──────────────────────────────
export function FractionInput({
  value, onChange, autoFocus,
}: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const [num = "", den = ""] = value.split("/");
  const compose = (n: string, d: string) => (!n && !d ? "" : `${n}/${d}`);
  const cell =
    "w-[64px] h-11 border-[1.5px] rounded-lg text-xl text-center font-bold font-serif tabular-nums " +
    "outline-none border-border-mid bg-cream-dark/30 focus:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/40";
  return (
    <div className="inline-flex flex-col items-center">
      <input type="text" inputMode="numeric" value={num} autoFocus={autoFocus} aria-label="Numerator"
        onChange={(e) => onChange(compose(digits(e.target.value, false, true), den))} className={cell} />
      <div className="w-[72px] h-[2.5px] bg-ink/80 my-1.5 rounded-full" />
      <input type="text" inputMode="numeric" value={den} aria-label="Denominator"
        onChange={(e) => onChange(compose(num, digits(e.target.value, false, true)))} className={cell} />
    </div>
  );
}

// ── Whole number + fraction ───────────────────────────────────────────────────
export function MixedFractionInput({
  value, onChange, autoFocus,
}: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const m = value.match(/^\s*(-?\d*)\s*(\d*)\/(\d*)\s*$/);
  const whole = m?.[1] ?? "";
  const num = m?.[2] ?? "";
  const den = m?.[3] ?? "";
  const compose = (w: string, n: string, d: string) => {
    const frac = !n && !d ? "" : `${n}/${d}`;
    return [w, frac].filter(Boolean).join(" ");
  };
  const cell =
    "w-[56px] h-11 border-[1.5px] rounded-lg text-xl text-center font-bold font-serif tabular-nums " +
    "outline-none border-border-mid bg-cream-dark/30 focus:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/40";
  return (
    <div className="inline-flex items-center gap-3">
      <input type="text" inputMode="numeric" value={whole} autoFocus={autoFocus} aria-label="Whole number"
        onChange={(e) => onChange(compose(digits(e.target.value, false, true), num, den))}
        className={cn(cell, "h-12 text-2xl")} />
      <span className="flex flex-col items-center">
        <input type="text" inputMode="numeric" value={num} aria-label="Numerator"
          onChange={(e) => onChange(compose(whole, digits(e.target.value, false, true), den))} className={cell} />
        <span className="w-[60px] h-[2.5px] bg-ink/80 my-1.5 rounded-full" />
        <input type="text" inputMode="numeric" value={den} aria-label="Denominator"
          onChange={(e) => onChange(compose(whole, num, digits(e.target.value, false, true)))} className={cell} />
      </span>
    </div>
  );
}

// ── Comparison: pick <, =, or > ───────────────────────────────────────────────
const COMPARES = ["<", "=", ">"] as const;
export function ComparisonSelector({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Comparison" className="flex items-center justify-center gap-3">
      {COMPARES.map((c) => {
        const on = value === c;
        return (
          <button key={c} type="button" role="radio" aria-checked={on} aria-label={c}
            onClick={() => onChange(c)}
            className={cn(
              "w-16 h-16 rounded-xl border-2 text-3xl font-bold font-serif transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50",
              on ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                 : "border-border-mid bg-white hover:border-brand-blue/50 text-ink")}>
            {c}
          </button>
        );
      })}
    </div>
  );
}

// ── True / False ──────────────────────────────────────────────────────────────
export function TrueFalse({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="True or false" className="flex items-center justify-center gap-3">
      {["True", "False"].map((opt) => {
        const on = value.toLowerCase() === opt.toLowerCase();
        return (
          <button key={opt} type="button" role="radio" aria-checked={on}
            onClick={() => onChange(opt)}
            className={cn(
              "min-w-[120px] h-12 px-5 rounded-xl border-2 text-base font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50",
              on ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                 : "border-border-mid bg-white hover:border-brand-blue/50 text-ink")}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Multiple choice ───────────────────────────────────────────────────────────
export function MultipleChoice({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Choices" className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
      {options.map((opt) => {
        const on = value === opt;
        return (
          <button key={opt} type="button" role="radio" aria-checked={on}
            onClick={() => onChange(opt)}
            className={cn(
              "min-h-[44px] text-sm rounded-lg border-[1.5px] px-4 py-3 font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50",
              on ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                 : "border-border-mid bg-cream-dark/20 hover:border-brand-blue/50")}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Short sized text (expression / fallback) — never a paragraph box ───────────
export function ShortTextInput({
  value, onChange, mode = "text", autoFocus,
}: { value: string; onChange: (v: string) => void; mode?: "text" | "expression"; autoFocus?: boolean }) {
  return (
    <input
      type="text"
      inputMode="text"
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={mode === "expression" ? "e.g. 5x" : "Answer"}
      aria-label="Answer"
      className={cn(FIELD, "w-48 px-3 text-xl placeholder:text-muted/40")}
    />
  );
}
