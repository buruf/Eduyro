// src/components/practice/AreaModelInput.tsx
// Interactive AREA MODEL for (x + a)(x + b). A 2×2 grid with row/column headers
// x, a and x, b; the student fills each region's partial product from a dropdown
// (no typing — "x²" is awkward to key). The composed answer is the four partial
// products in fixed order (x², ax, bx, ab), graded by plain value match.
"use client";

import { useEffect, useState } from "react";
import type { InteractiveSpec } from "@/types";

// deterministic shuffle by a string key so option order is stable per cell
function shuf<T>(arr: T[], key: string): T[] {
  let h = 2166136261; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { h = (Math.imul(h, 48271) >>> 0); const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function AreaModelInput({ spec, onChange }: { spec: InteractiveSpec; value: string; onChange: (v: string) => void }) {
  const a = spec.binomial?.a ?? 1, b = spec.binomial?.b ?? 1;
  // cells in fixed answer order: TL (x·x), TR (x·a), BL (b·x), BR (b·a)
  const cells = [
    { correct: "x²", opts: ["x²", "2x", "x"] },
    { correct: `${a}x`, opts: [`${a}x`, `${a}`, `${a}x²`] },
    { correct: `${b}x`, opts: [`${b}x`, `${b}`, `${b}x²`] },
    { correct: `${a * b}`, opts: [`${a * b}`, `${a + b}`, `${a * b}x`] },
  ];
  const [sel, setSel] = useState<string[]>(["", "", "", ""]);
  useEffect(() => { onChange(sel.join(",")); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (i: number, v: string) => setSel((s) => { const n = [...s]; n[i] = v; return n; });

  const Cell = ({ i }: { i: number }) => (
    <select value={sel[i]} onChange={(e) => set(i, e.target.value)}
      className="w-full h-full text-center font-serif font-bold text-lg bg-transparent outline-none cursor-pointer">
      <option value="">?</option>
      {shuf(cells[i].opts, `am${a}_${b}_${i}`).map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="max-w-xs mx-auto">
      <div className="grid grid-cols-[28px_1fr_1fr] grid-rows-[28px_64px_64px] gap-0.5">
        <div />
        <div className="flex items-end justify-center font-serif font-bold text-brand-blue">x</div>
        <div className="flex items-end justify-center font-serif font-bold text-brand-blue">+{a}</div>
        <div className="flex items-center justify-center font-serif font-bold text-brand-blue">x</div>
        <div className="border-2 border-border rounded-md bg-cream-dark/30"><Cell i={0} /></div>
        <div className="border-2 border-border rounded-md bg-cream-dark/30"><Cell i={1} /></div>
        <div className="flex items-center justify-center font-serif font-bold text-brand-blue">+{b}</div>
        <div className="border-2 border-border rounded-md bg-cream-dark/30"><Cell i={2} /></div>
        <div className="border-2 border-border rounded-md bg-cream-dark/30"><Cell i={3} /></div>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted">Fill each region with the product of its row and column.</p>
    </div>
  );
}
