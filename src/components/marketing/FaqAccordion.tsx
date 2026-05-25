// src/components/marketing/FaqAccordion.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className={cn(
                "w-full text-left py-5 flex items-center justify-between gap-4",
                "transition-colors hover:text-brand-blue",
                isOpen && "text-brand-blue"
              )}
              aria-expanded={isOpen}
            >
              <span className="text-base font-medium">{item.q}</span>
              <span
                className={cn(
                  "text-xl text-muted transition-transform flex-shrink-0",
                  isOpen && "rotate-45"
                )}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="pb-5 text-sm text-muted leading-relaxed">{item.a}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
