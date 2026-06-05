// src/lib/math/katex-to-svg.ts
// Server-side KaTeX rendering for PDF math notation.

import katex from "katex";

export function mathToHtml(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: "html",
    });
  } catch {
    return latex;
  }
}

// Convert legacy plain-text math to LaTeX
export function upgradeToLatex(text: string): string {
  if (text.includes("\\frac") || text.includes("\\sqrt") || text.includes("$")) return text;
  text = text.replace(/\b(\d+)\/(\d+)\b/g, (_, n, d) => `\\frac{${n}}{${d}}`);
  text = text.replace(/([a-zA-Z])\^(\d+)/g, (_, base, exp) => `${base}^{${exp}}`);
  text = text.replace(/√(\d+)/g, (_, n) => `\\sqrt{${n}}`);
  return text;
}

export interface MathSegment {
  type: "text" | "math";
  content: string;
  display: boolean;
}

export function parseMathSegments(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: "text", content: text.slice(last, match.index), display: false });
    const isDisplay = match[0].startsWith("$$");
    segments.push({ type: "math", content: isDisplay ? match[0].slice(2,-2) : match[0].slice(1,-1), display: isDisplay });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ type: "text", content: text.slice(last), display: false });
  return segments;
}
