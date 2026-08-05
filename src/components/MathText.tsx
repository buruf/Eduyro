// src/components/MathText.tsx
// Renders math notation using KaTeX.
// Handles mixed text with math delimiters: "Solve: \frac{1}{2} + x = 2"
// Math is wrapped in $...$ or $$...$$
// Also auto-converts legacy notation: 1/2 → \frac{1}{2}, x^2 → x^{2}

"use client";

import { useEffect, useRef } from "react";
// Without this stylesheet KaTeX's markup renders LINEARIZED — "1 over x−4"
// came out as "x−41". Importing once here covers every MathText user.
import "katex/dist/katex.min.css";

interface MathTextProps {
  children: string;
  className?: string;
  block?: boolean; // true = display mode (centered), false = inline
}

// Convert legacy plain-text math to LaTeX where possible
function upgradeLegacyNotation(text: string): string {
  // Already explicitly delimited — trust the author.
  if (text.includes("$")) return text;

  // The curriculum engine emits BARE LaTeX (e.g. "\frac{1}{3} + \frac{5}{6}")
  // with no $ delimiters, so KaTeX never sees it. Wrap each LaTeX atom in $…$ so
  // it renders as a real fraction/root instead of literal "\frac{…}" text.
  // Underscores (fill-in blanks like \frac{___}{4}) are escaped so KaTeX doesn't
  // treat them as subscripts.
  if (text.includes("\\frac") || text.includes("\\sqrt")) {
    return text
      .replace(/\\frac\{[^{}]*\}\{[^{}]*\}/g, (m) => `$${m.replace(/_/g, "\\_")}$`)
      .replace(/\\sqrt\{[^{}]*\}/g, (m) => `$${m.replace(/_/g, "\\_")}$`);
  }

  // Rational expressions: 1/(x − 4), 3/(x + 2) → stacked \frac{1}{x − 4}
  // (user feedback: "why f(x) = 1/(x - 4) instead of 1 over x − 4").
  text = text.replace(/(\d+|[a-zA-Z])\/\(([^()]+)\)/g, (_, n, d) => `$\\frac{${n}}{${String(d).trim()}}$`);

  // Simple fraction pattern: number/number → \frac{num}{den}
  // Only convert standalone fractions like "1/2", "3/4" not "x/y" variables or "km/h"
  text = text.replace(/\b(\d+)\/(\d+)\b/g, (_, n, d) => `$\\frac{${n}}{${d}}$`);

  // Exponents: x^2 → x^{2}, x^{n} stays as is
  text = text.replace(/([a-zA-Z0-9])\^(\d+)/g, (_, base, exp) => `$${base}^{${exp}}$`);

  // Square root: √9 or √(x+1)
  text = text.replace(/√(\d+)/g, (_, n) => `$\\sqrt{${n}}$`);

  return text;
}

// Split text into segments: plain text and math
function parseSegments(text: string): { type: "text" | "math"; content: string; display: boolean }[] {
  const segments: { type: "text" | "math"; content: string; display: boolean }[] = [];
  // Match $$...$$ (display) or $...$ (inline)
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", content: text.slice(last, match.index), display: false });
    }
    const isDisplay = match[0].startsWith("$$");
    const inner = isDisplay ? match[0].slice(2, -2) : match[0].slice(1, -1);
    segments.push({ type: "math", content: inner, display: isDisplay });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ type: "text", content: text.slice(last), display: false });
  }

  return segments;
}

export function MathText({ children, className = "", block = false }: MathTextProps) {
  const containerRef = useRef<HTMLSpanElement | HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import KaTeX to avoid SSR issues
    import("katex").then((katex) => {
      const upgraded = upgradeLegacyNotation(children);
      const segments = parseSegments(upgraded);

      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";

      segments.forEach((seg) => {
        if (seg.type === "text") {
          containerRef.current!.appendChild(document.createTextNode(seg.content));
        } else {
          const span = document.createElement("span");
          try {
            katex.default.render(seg.content, span, {
              displayMode: seg.display,
              throwOnError: false,
              output: "html",
            });
          } catch {
            span.textContent = seg.content;
          }
          containerRef.current!.appendChild(span);
        }
      });
    });
  }, [children]);

  // SSR fallback — show plain text until KaTeX loads
  if (block) {
    return (
      <div ref={containerRef as React.RefObject<HTMLDivElement>} className={className}>
        {children}
      </div>
    );
  }

  return (
    <span ref={containerRef as React.RefObject<HTMLSpanElement>} className={className}>
      {children}
    </span>
  );
}

// Server-safe version for use in non-client components
export function MathTextStatic({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`font-mono ${className}`}>{children}</span>;
}
