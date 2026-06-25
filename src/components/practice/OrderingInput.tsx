// src/components/practice/OrderingInput.tsx
// Drag-and-drop ORDERING input. The student arranges a set of items into the
// correct sequence (e.g. least → greatest). Items are received in a scrambled
// order; the composed answer is the current order joined by commas, graded
// server-side by plain value match against the stored correct order (the client
// never receives the answer). Reorder via ↑/↓ (deterministic + accessible) or
// native drag.
"use client";

import { useEffect, useRef, useState } from "react";

export function OrderingInput({ items, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  const [order, setOrder] = useState<string[]>(items);
  // Re-seed when a new question supplies different items.
  const sig = items.join("§");
  const prev = useRef(sig);
  useEffect(() => { if (prev.current !== sig) { prev.current = sig; setOrder(items); } }, [sig, items]);
  // Publish the current arrangement as the answer.
  useEffect(() => { onChange(order.join(",")); }, [order]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const dragFrom = useRef<number | null>(null);
  const onDrop = (to: number) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null || from === to) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
  };

  return (
    <div className="max-w-xs mx-auto space-y-2">
      {order.map((it, i) => (
        <div
          key={`${it}-${i}`}
          draggable
          onDragStart={() => (dragFrom.current = i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(i)}
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 cursor-grab active:cursor-grabbing"
        >
          <span className="w-5 text-xs text-muted tabular-nums">{i + 1}.</span>
          <span className="flex-1 text-center font-serif font-semibold text-ink">{it}</span>
          <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${it} up`}
            className="w-7 h-7 rounded-md border border-border hover:bg-cream-dark disabled:opacity-30">↑</button>
          <button onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${it} down`}
            className="w-7 h-7 rounded-md border border-border hover:bg-cream-dark disabled:opacity-30">↓</button>
        </div>
      ))}
      <p className="text-center text-[11px] text-muted">Drag the cards, or use ↑ / ↓, to put them in order.</p>
    </div>
  );
}
