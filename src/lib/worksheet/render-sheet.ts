// src/lib/worksheet/render-sheet.ts
// Renders one worksheet sheet to HTML for printing.
// Uses auto-scaling layout that fits any problem count on one letter page.

import katex from "katex";
import { getLayoutForCount } from "./layout";

export interface SheetProblem {
  id: string;
  question: string;
  answer?: string;
  type?: string;
}

export interface SheetMeta {
  subjectLabel: string;
  levelCode: string;
  skillName: string;
  sheetNumber?: number;
  totalSheets?: number;
  timeLimitMinutes?: number;
  watermark?: string;
  showDisclaimer?: boolean;
}

// HTML escape
function escape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Render math notation using KaTeX server-side
// Auto-upgrades legacy notation: 1/2 → \frac{1}{2}, x^2 → x^{2}, √9 → \sqrt{9}
function renderMath(text: string): string {
  // Step 1: auto-upgrade legacy notation to $...$ delimited LaTeX
  let t = text;

  // Only upgrade standalone fractions (digits only, not already in $)
  if (!t.includes("$")) {
    t = t.replace(/\b(\d+)\/(\d+)\b/g, (_, n, d) => `$\\frac{${n}}{${d}}$`);
    t = t.replace(/([a-zA-Z])\^(\d+)/g, (_, b, e) => `$${b}^{${e}}$`);
    t = t.replace(/\u221a(\d+)/g, (_, n) => `$\\sqrt{${n}}$`);
  }

  // Step 2: render $...$ blocks with KaTeX
  return t.replace(/\$([^$]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false, output: "html" });
    } catch {
      return math;
    }
  });
}

export function renderSheetHtml(
  problems: SheetProblem[],
  meta: SheetMeta,
  isAnswerKey: boolean = false
): string {
  const layout = getLayoutForCount(problems.length);
  const safeName = escape(meta.skillName);
  const safeSubject = escape(meta.subjectLabel);

  const headerFontSize = `${1.4 * layout.headerScale}rem`;
  const subFontSize = `${0.85 * layout.headerScale}rem`;
  const labelFontSize = `${0.65 * layout.headerScale}rem`;

  const watermark = meta.watermark
    ? `<div class="watermark">${escape(meta.watermark)}</div>`
    : "";

  const sheetLabel =
    meta.sheetNumber && meta.totalSheets
      ? `Sheet ${meta.sheetNumber} of ${meta.totalSheets}`
      : "";

  const problemsHtml = problems
    .map(
      (p, i) => `
      <div class="problem">
        <span class="num">${i + 1}.</span>
        <span class="q">${renderMath(p.question)}</span>
        ${
          isAnswerKey && p.answer
            ? `<span class="ans">${renderMath(p.answer)}</span>`
            : `<span class="blank"></span>`
        }
      </div>`
    )
    .join("");

  return `
<div class="sheet" data-cols="${layout.columns}">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    .sheet {
      font-family: 'DM Sans', system-ui, sans-serif;
      color: #1A1612;
      position: relative;
      width: 100%;
      padding: 0;
    }
    .sheet .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #1A1612;
      padding-bottom: 0.5rem;
      margin-bottom: 0.8rem;
    }
    .sheet .org {
      font-size: ${labelFontSize};
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6B6055;
      font-weight: 600;
    }
    .sheet .title {
      font-family: Fraunces, Georgia, serif;
      font-size: ${headerFontSize};
      font-weight: 700;
      margin-top: 0.15rem;
    }
    .sheet .sub {
      font-size: ${subFontSize};
      color: #6B6055;
      margin-top: 0.1rem;
    }
    .sheet .meta-right {
      text-align: right;
      font-size: ${subFontSize};
    }
    .sheet .meta-right .badge {
      display: inline-block;
      font-size: ${labelFontSize};
      font-weight: 700;
      background: #DEE9F4;
      color: #1B4F8A;
      padding: 0.15rem 0.45rem;
      border-radius: 0.25rem;
    }
    .sheet .grid {
      display: grid;
      grid-template-columns: repeat(${layout.columns}, 1fr);
      column-gap: 1.5rem;
      row-gap: 0;
      font-family: Fraunces, Georgia, serif;
    }
    .sheet .problem {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: ${layout.fontSize};
      padding: ${layout.rowPadding} 0;
      ${layout.showBorders ? "border-bottom: 1px solid #F0E9DC;" : ""}
    }
    .sheet .num {
      font-family: 'DM Sans', sans-serif;
      font-size: ${labelFontSize};
      color: rgba(107, 96, 85, 0.5);
      min-width: 1.5rem;
    }
    .sheet .q { font-weight: 700; flex: 1; }
    .sheet .ans {
      font-weight: 700;
      color: #2D6A3F;
      background: #DCE9DF;
      border: 1px solid #2D6A3F;
      border-radius: 0.25rem;
      padding: 0 0.35rem;
      font-size: calc(${layout.fontSize} * 0.95);
    }
    .sheet .blank {
      min-width: 2.5rem;
      height: 1.2em;
      border: 1px solid #B8AC9C;
      border-radius: 0.2rem;
      background: rgba(245, 237, 224, 0.3);
    }
    .sheet .disclaimer {
      margin-top: 0.3rem;
      font-size: 0.55rem;
      color: rgba(107, 96, 85, 0.5);
      text-align: center;
      font-style: italic;
      line-height: 1.3;
    }
    .sheet .footer {
      margin-top: 0.6rem;
      padding-top: 0.3rem;
      border-top: 1px dashed #B8AC9C;
      display: flex;
      justify-content: space-between;
      font-size: ${labelFontSize};
      color: rgba(107, 96, 85, 0.6);
    }
    .sheet .watermark {
      position: fixed;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-family: Fraunces, Georgia, serif;
      font-size: 5rem;
      font-weight: 800;
      color: rgba(200, 144, 42, 0.18);
      letter-spacing: 0.05em;
      pointer-events: none;
      z-index: 999;
      white-space: nowrap;
    }
  </style>
  ${watermark}
  <div class="header">
    <div>
      <div class="org">Eduyro Education</div>
      <div class="title">${safeName}${isAnswerKey ? " — Answer Key" : ""}</div>
      <div class="sub">
        ${problems.length} problems
        ${meta.timeLimitMinutes ? ` · Target: ${meta.timeLimitMinutes} min` : ""}
        ${sheetLabel ? ` · ${sheetLabel}` : ""}
      </div>
    </div>
    <div class="meta-right">
      <span class="badge">Level ${escape(meta.levelCode)}</span>
      ${!isAnswerKey ? `<div style="margin-top:0.3rem">Name: _________</div>` : ""}
    </div>
  </div>
  <div class="grid">${problemsHtml}</div>
  <div class="footer">
    <span>${safeSubject} · ${escape(meta.levelCode)} · Eduyro</span>
    <span>${sheetLabel}</span>
  </div>
  ${meta.showDisclaimer ? `<div class="disclaimer">For personal and household use only. Reproduction, redistribution, resale or commercial use is strictly prohibited. © ${new Date().getFullYear()} Eduyro Education Inc.</div>` : ""}
</div>`;
}

export function wrapDocument(sheetHtmls: string[], title: string): string {
  const sheetsWithBreaks = sheetHtmls
    .map(
      (h, i) =>
        `<div class="page" ${i > 0 ? 'style="page-break-before: always;"' : ""}>${h}</div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escape(title)}</title>
  <style>
    @page { size: letter; margin: 0.4in 0.4in 0.4in 0.4in; }
    @media print {
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
    html, body { margin: 0; padding: 0; background: white; }
    body { font-family: 'DM Sans', system-ui, sans-serif; }
  </style>
</head>
<body>
  ${sheetsWithBreaks}
</body>
</html>`;
}
