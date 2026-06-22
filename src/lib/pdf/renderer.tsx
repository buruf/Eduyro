// src/lib/pdf/renderer.tsx
// Workbook-quality PDF renderer — v35
// Layout: Header → Student Info → Objective → [Worked Example] → Problems (full-page fill) → Mastery Check
// Answer keys: consolidated, multiple worksheets per page, number+answer only.

import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { Svg, Path, Rect, Circle, Line, Polygon, Text as SvgText } from "@react-pdf/renderer";
import React from "react";
import { join } from "path";
import { PdfMathText } from "@/lib/math/pdf-math";
import { parseColumnar, parseLongDivision, type Columnar, type LongDivision } from "@/lib/math/columnar";
import { polygonSlicePaths, POLY_SIDES } from "@/lib/math/fraction-shapes";
import { figureDiagram, isFigureKind } from "@/lib/math/angle-shapes";
import { workedArithmeticSteps, workedDivisionSteps } from "@/lib/math/worked-steps";
import { buildScaffold } from "@/lib/tutor/scaffold";
import { computeLayout } from "./layout-engine";
import { getTutorial } from "@/lib/worksheet/tutorials";
import type { WorksheetData, WorksheetProblem, WorkedExample } from "@/lib/shop/progressive-generator";

// ── Body font ─────────────────────────────────────────────────────────────────
// Helvetica (react-pdf's built-in) cannot render the symbols the higher-math
// curriculum uses — √ π ∫ →, subscripts and superscripts beyond ²³. DejaVu Sans
// covers the full set, so we use it for ALL body/math text. Registered once at
// module load from the bundled .ttf files (see next.config outputFileTracingIncludes).
const FONT_DIR = join(process.cwd(), "src/lib/pdf/fonts");
try {
  Font.register({
    family: "BodySans",
    fonts: [
      { src: join(FONT_DIR, "DejaVuSans.ttf") },
      { src: join(FONT_DIR, "DejaVuSans-Oblique.ttf"), fontStyle: "italic" },
    ],
  });
  Font.register({ family: "BodySans-Bold", src: join(FONT_DIR, "DejaVuSans-Bold.ttf") });
} catch {
  // Font already registered (hot reload) or unavailable — falls back to Helvetica.
}

// ── Colours ───────────────────────────────────────────────────────────────────
// Aligned to the Eduyro brand: ink (#1A1612) + cream + gold (#C8902A).
// Banners use INK (the brand's signature dark — same as the site nav/footer),
// not the secondary blue accent, so the sheet "belongs" to the brand.
const C = {
  ink:        "#1A1612",   // primary dark — banners, body text
  black:      "#1A1612",
  gold:       "#C8902A",   // accent — labels, skill code
  goldMid:    "#E8C87A",   // skill code on the dark banner
  goldSoft:   "#FBF4E4",   // warm tint for the objective box
  green:      "#2D6A3F",
  greenLight: "#E3F2E8",
  grey1:      "#F5F5F3",
  grey2:      "#E8E0D0",   // hairlines / answer lines
  grey3:      "#B8AC9C",   // faint (footer only)
  grey4:      "#7A6E5F",   // brand muted — labels
  numInk:     "#544B3E",   // problem numbering — clearly visible
  white:      "#FFFFFF",
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:         { fontFamily:"BodySans", fontSize:9, paddingTop:30, paddingBottom:36, paddingHorizontal:36, backgroundColor:C.white },

  // Header bar — INK (brand signature dark), gold skill code
  headerBar:    { backgroundColor:C.ink, paddingHorizontal:12, paddingVertical:8, marginBottom:6, flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  headerOrg:    { fontSize:7, color:"rgba(255,255,255,0.6)", letterSpacing:1, textTransform:"uppercase" },
  headerTitle:  { fontSize:18, fontFamily:"BodySans-Bold", color:C.white, marginTop:1 },
  headerSub:    { fontSize:7.5, color:"rgba(255,255,255,0.7)", marginTop:2 },
  headerBadge:  { backgroundColor:"rgba(232,200,122,0.16)", borderWidth:0.5, borderColor:"rgba(232,200,122,0.5)", borderRadius:4, paddingHorizontal:8, paddingVertical:4, alignItems:"center" },
  badgeCode:    { fontSize:11, fontFamily:"BodySans-Bold", color:C.goldMid },
  badgeGrade:   { fontSize:7, color:"rgba(255,255,255,0.75)", marginTop:1 },

  // Student info — readable muted labels
  studentRow:   { flexDirection:"row", gap:12, marginBottom:6 },
  studentField: { flex:1 },
  fieldLabel:   { fontSize:6.5, color:C.grey4, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 },
  fieldLine:    { borderBottomWidth:1, borderBottomColor:C.grey4, height:14 },
  fieldValue:   { fontSize:8.5, color:C.black },

  // Objective — warm gold tint, gold label
  objectiveBox: { backgroundColor:C.goldSoft, borderLeftWidth:2, borderLeftColor:C.gold, paddingHorizontal:10, paddingVertical:6, marginBottom:8, flexDirection:"row", alignItems:"center", gap:8 },
  objectiveLabel:{ fontSize:7, fontFamily:"BodySans-Bold", color:C.gold, textTransform:"uppercase", letterSpacing:0.5 },
  objectiveText: { fontSize:8.5, color:C.black, flex:1 },

  // Worked example (tutorial mode)
  exampleBox:   { backgroundColor:C.grey1, borderWidth:0.5, borderColor:C.grey2, borderRadius:3, padding:6, marginBottom:5 },
  exampleHeader:{ fontSize:7.5, fontFamily:"BodySans-Bold", color:C.gold, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 },
  exampleStep:  { flexDirection:"row", gap:6, marginBottom:1.5 },
  stepNum:      { fontSize:8, fontFamily:"BodySans-Bold", color:C.gold, width:14 },
  exampleAns:   { marginTop:3, paddingTop:3, borderTopWidth:0.5, borderTopColor:C.grey2, flexDirection:"row", gap:8, alignItems:"center" },
  ansLabel:     { fontSize:7.5, fontFamily:"BodySans-Bold", color:C.green },

  // Problem rows — flex:1 makes each row claim equal space to fill the page
  problemRow:   { flex:1, flexDirection:"row", alignItems:"center", paddingHorizontal:6, borderBottomWidth:0.5, borderBottomColor:C.grey2 },
  probNum:      { fontSize:7.5, fontFamily:"BodySans-Bold", color:C.numInk, width:22, textAlign:"right", marginRight:4, flexShrink:0 },
  answerLine:   { borderBottomWidth:1, borderBottomColor:C.black, width:26, marginBottom:1, flexShrink:0 },

  // Mastery check
  masteryStrip: { borderTopWidth:0.5, borderTopColor:C.grey2, paddingTop:4, marginTop:4, flexDirection:"row", gap:16, alignItems:"center" },
  masteryLabel: { fontSize:7, color:C.grey4, fontFamily:"BodySans-Bold" },
  checkItem:    { flexDirection:"row", alignItems:"center", gap:4 },
  checkBox:     { width:8, height:8, borderWidth:0.5, borderColor:C.grey4 },
  checkLabel:   { fontSize:7, color:C.grey4 },

  // Fixed footer
  footer:       { position:"absolute", bottom:16, left:36, right:36, borderTopWidth:0.5, borderTopColor:C.grey2, paddingTop:3, flexDirection:"row", justifyContent:"space-between" },
  footerText:   { fontSize:6.5, color:C.grey3 },

  // ── Consolidated answer key ───────────────────────────────────────────────
  akHeaderBar:  { backgroundColor:C.ink, paddingHorizontal:12, paddingVertical:8, marginBottom:10, flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  akHeaderTitle:{ fontSize:14, fontFamily:"BodySans-Bold", color:C.white },
  akHeaderSub:  { fontSize:7.5, color:"rgba(255,255,255,0.7)", marginTop:2 },
  akSheetBlock: { marginBottom:6 },
  akSheetLabel: { fontSize:8, fontFamily:"BodySans-Bold", color:C.ink, marginBottom:3, paddingBottom:2, borderBottomWidth:0.5, borderBottomColor:C.gold },
  akGrid:       { flexDirection:"row", gap:8 },
  akCol:        { flex:1 },
  akRow:        { flexDirection:"row", alignItems:"baseline", paddingVertical:1.2, gap:3 },
  akNum:        { fontSize:7, color:C.grey4, width:16, textAlign:"right", flexShrink:0 },
  akAnswerText: { fontSize:8, fontFamily:"BodySans-Bold", color:C.black },

  // ── Lesson page (first sheet of a new skill: worked examples) ──────────────
  lessonTitle:   { fontSize:9, fontFamily:"BodySans-Bold", color:C.gold, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 },
  lessonCard:    { width:"48%", marginRight:"2%", marginBottom:9, backgroundColor:C.grey1, borderWidth:0.5, borderColor:C.grey2, borderRadius:4, padding:9 },
  lessonCardNum: { fontSize:7, fontFamily:"BodySans-Bold", color:C.gold, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 },

  // Big Idea + Key Ideas (lesson page, mirrors the on-screen lesson)
  bigIdeaBox:   { backgroundColor:C.grey1, borderLeftWidth:2, borderLeftColor:C.green, paddingHorizontal:10, paddingVertical:6, marginBottom:8 },
  bigIdeaLabel: { fontSize:7, fontFamily:"BodySans-Bold", color:C.green, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 },
  bigIdeaText:  { fontSize:8.5, color:C.black, lineHeight:1.35 },
  keyIdeasWrap: { flexDirection:"row", flexWrap:"wrap", marginBottom:8 },
  keyIdeaCard:  { width:"48%", marginRight:"2%", marginBottom:6, backgroundColor:C.white, borderWidth:0.5, borderColor:C.grey2, borderRadius:3, padding:7 },
  keyIdeaTitle: { fontSize:8, fontFamily:"BodySans-Bold", color:C.ink, marginBottom:2 },
  keyIdeaFormula:{ fontSize:7.5, fontFamily:"BodySans-Bold", color:C.gold, marginBottom:2 },
  keyIdeaText:  { fontSize:7.5, color:C.numInk, lineHeight:1.3 },
});

// ── Answer line ───────────────────────────────────────────────────────────────
function AnswerLine() {
  return <View style={s.answerLine} />;
}

// ── Watermark (free sample previews) ─────────────────────────────────────────
// Large translucent diagonal stamp so preview sheets can't pass as purchased.
function Watermark({ text }: { text: string }) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        top: 330,
        left: 0,
        right: 0,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 42,
          fontFamily: "BodySans-Bold",
          color: "#C8902A",
          opacity: 0.16,
          transform: "rotate(-25deg)",
          letterSpacing: 2,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// Answer-key fractions render INLINE ("1/2") rather than stacked — far more
// compact for a dense reference grid, so many more sheets fit per page.
function inlineFraction(answer: string): string {
  return String(answer).replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_m, n, d) => `${n}/${d}`);
}

// ── Fraction visuals (M7 — Fractions·Decimals·Percents) ──────────────────────
// The FDP engine prefixes visual questions with a marker; we draw it as SVG and
// render the remaining instruction text after the shape:
//   [[viz pie n d]]  [[viz bar n d]]  [[viz grid n d]]  [[viz cmp n1 d1 n2 d2]]
interface Viz { kind: string; nums: number[]; }
function parseViz(q: string): { viz: Viz; text: string } | null {
  const m = q.match(/^\[\[viz (\w+)((?: \d+)+)\]\]\s*(.*)$/);
  if (!m) return null;
  return { viz: { kind: m[1] as Viz["kind"], nums: m[2].trim().split(/\s+/).map(Number) }, text: m[3] };
}

const VZ = { gold: "#C8902A", soft: "#FBF4E4", ink: "#1A1612" };

function PieViz({ n, d, size }: { n: number; d: number; size: number }) {
  const r = size / 2, cx = r, cy = r;
  const slices = [];
  for (let i = 0; i < d; i++) {
    const a0 = (i / d) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    slices.push(
      <Path key={i}
        d={`M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`}
        fill={i < n ? VZ.gold : VZ.soft} stroke={VZ.ink} strokeWidth={0.9} />
    );
  }
  return <Svg width={size} height={size}>{slices}</Svg>;
}

function BarViz({ n, d, w, h }: { n: number; d: number; w: number; h: number }) {
  const cw = w / d;
  return (
    <Svg width={w} height={h}>
      {Array.from({ length: d }, (_, i) => (
        <Rect key={i} x={i * cw} y={0} width={cw} height={h}
          fill={i < n ? VZ.gold : VZ.soft} stroke={VZ.ink} strokeWidth={0.9} />
      ))}
    </Svg>
  );
}

function GridViz({ n, d, size }: { n: number; d: number; size: number }) {
  const cols = d === 100 ? 10 : Math.min(d, Math.max(1, Math.ceil(Math.sqrt(d))));
  const rows = Math.ceil(d / cols);
  const cell = size / Math.max(cols, rows);
  const cells = [];
  for (let i = 0; i < d; i++) {
    const cx = (i % cols) * cell, cy = Math.floor(i / cols) * cell;
    cells.push(<Rect key={i} x={cx} y={cy} width={cell} height={cell}
      fill={i < n ? VZ.gold : VZ.soft} stroke={VZ.ink} strokeWidth={0.5} />);
  }
  return <Svg width={cols * cell} height={rows * cell}>{cells}</Svg>;
}

function CmpViz({ nums, w }: { nums: number[]; w: number }) {
  const [n1, d1, n2, d2] = nums;
  const h = 13;
  const bar = (n: number, d: number, y: number) =>
    Array.from({ length: d }, (_, i) => (
      <Rect key={`${y}-${i}`} x={(w / d) * i} y={y} width={w / d} height={h}
        fill={i < n ? VZ.gold : VZ.soft} stroke={VZ.ink} strokeWidth={0.8} />
    ));
  return <Svg width={w} height={h * 2 + 8}>{[...bar(n1, d1, 0), ...bar(n2, d2, h + 8)]}</Svg>;
}

// Vertical strip — like BarViz but stacked top-to-bottom.
function VBarViz({ n, d, w, h }: { n: number; d: number; w: number; h: number }) {
  const ch = h / d;
  return (
    <Svg width={w} height={h}>
      {Array.from({ length: d }, (_, i) => (
        <Rect key={i} x={0} y={i * ch} width={w} height={ch}
          fill={i < n ? VZ.gold : VZ.soft} stroke={VZ.ink} strokeWidth={0.9} />
      ))}
    </Svg>
  );
}

// Regular polygon (triangle / pentagon / hexagon) sliced into d equal wedges.
function PolyViz({ sides, n, d, size }: { sides: number; n: number; d: number; size: number }) {
  const R = size / 2;
  const paths = polygonSlicePaths(sides, d, R);
  return (
    <Svg width={size} height={size}>
      {paths.map((dd, i) => (
        <Path key={i} d={dd} fill={i < n ? VZ.gold : VZ.soft} stroke={VZ.ink} strokeWidth={0.9} />
      ))}
    </Svg>
  );
}

// Geometry figure (angle diagram or labeled perimeter/area shape).
function AngleViz({ kind, nums, size }: { kind: string; nums: number[]; size: number }) {
  const prims = figureDiagram(kind, nums, size);
  return (
    <Svg width={size} height={size}>
      {prims.map((p, i) => {
        if (p.t === "line") return <Line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={VZ.ink} strokeWidth={1.3} strokeDasharray={p.dash ? "2 2" : undefined} />;
        if (p.t === "poly") return <Polygon key={i} points={p.pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={VZ.ink} strokeWidth={1.3} />;
        if (p.t === "rect") return <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill="none" stroke={VZ.ink} strokeWidth={1.3} />;
        if (p.t === "circle") return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="none" stroke={VZ.ink} strokeWidth={1.3} />;
        return <SvgText key={i} x={p.x} y={p.y} textAnchor="middle" style={{ fontSize: 8.5, fontFamily: "BodySans-Bold" }} fill={VZ.ink}>{p.s}</SvgText>;
      })}
    </Svg>
  );
}

function VizShape({ viz, size }: { viz: Viz; size: number }) {
  if (isFigureKind(viz.kind)) return <AngleViz kind={viz.kind} nums={viz.nums} size={size} />;
  if (viz.kind === "pie")  return <PieViz n={viz.nums[0]} d={viz.nums[1]} size={size} />;
  if (viz.kind === "bar")  return <BarViz n={viz.nums[0]} d={viz.nums[1]} w={size * 1.7} h={size * 0.5} />;
  if (viz.kind === "vbar") return <VBarViz n={viz.nums[0]} d={viz.nums[1]} w={size * 0.5} h={size} />;
  if (viz.kind === "grid") return <GridViz n={viz.nums[0]} d={viz.nums[1]} size={size} />;
  if (viz.kind === "cmp")  return <CmpViz nums={viz.nums} w={size * 1.7} />;
  if (viz.kind in POLY_SIDES) return <PolyViz sides={POLY_SIDES[viz.kind]} n={viz.nums[0]} d={viz.nums[1]} size={size} />;
  return null;
}

// ── Stacked (vertical) arithmetic — written-computation layout ─────────────────
//   74
// +  6
// ────       (blank space below the rule is where the student writes the answer)
function PdfColumnar({ c, fontSize, result }: { c: Columnar; fontSize: number; result?: string }) {
  // Match the horizontal problems' size/weight exactly (no size bump). The row's
  // flex:1 already provides the writing space below the rule, so we add NO extra
  // height here — an explicit spacer was making rows too tall and overflowing the
  // page. When `result` is given (a worked example), the answer is shown under
  // the rule; otherwise the space below is left blank for the student.
  const fs = fontSize;
  const maxLen = Math.max(c.top.length, c.bottom.length, (result ?? "").length);
  // Width = operator slot + digit columns. Right-aligning both numbers makes the
  // place values line up (units under units) without a monospace font.
  const W = fs * 1.1 + maxLen * fs * 0.62 + 3;
  const numStyle = { fontFamily: "BodySans-Bold", fontSize: fs, lineHeight: 1.1, color: C.ink };
  return (
    <View style={{ width: W }}>
      <Text style={{ ...numStyle, textAlign: "right" }}>{c.top}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Text style={numStyle}>{c.op}</Text>
        <Text style={{ ...numStyle, textAlign: "right" }}>{c.bottom}</Text>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: C.ink, marginTop: 1, width: "100%" }} />
      {result ? <Text style={{ ...numStyle, textAlign: "right", color: C.green }}>{result}</Text> : null}
    </View>
  );
}

// ── Long division — the bracket method:  divisor ) ‾dividend ───────────────────
function PdfLongDivision({ d, fontSize, result }: { d: LongDivision; fontSize: number; result?: string }) {
  const fs = fontSize;
  const numStyle = { fontFamily: "BodySans-Bold", fontSize: fs, lineHeight: 1.1, color: C.ink };
  const quotientGap = fs + 2; // height of the quotient line above the dividend
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <Text style={{ ...numStyle, marginTop: quotientGap }}>{d.divisor}</Text>
      <Text style={{ ...numStyle, marginTop: quotientGap, marginHorizontal: 1 }}>)</Text>
      <View>
        {/* quotient sits above the bar — shown in a worked example, blank to write on otherwise */}
        <Text style={{ ...numStyle, color: C.green, minHeight: quotientGap, textAlign: "left" }}>
          {result ?? " "}
        </Text>
        <View style={{ borderTopWidth: 1.2, borderTopColor: C.ink, paddingTop: 1, paddingHorizontal: 3 }}>
          <Text style={numStyle}>{d.dividend}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Worked examples for the lesson page ───────────────────────────────────────
// The curated unit example (best, hand-written steps) plus several more worked
// from the sheet's own problems (spanning easy→hard) via the scaffold engine, so
// a new skill opens with 4–5 fully-explained examples.
function buildExamples(sheet: WorksheetData): WorkedExample[] {
  const { workedExample, problems } = sheet;
  const out: WorkedExample[] = [];
  const seen = new Set<string>();

  // steps for ONE example: concrete column-method working for multi-digit
  // arithmetic, otherwise the scaffold engine's step-by-step hints.
  const directive = sheet.meta.directive;
  const stepsFor = (q: string, ans: string): string[] => {
    const col = parseColumnar(q);
    if (col) return workedArithmeticSteps(+col.top, col.op, +col.bottom);
    const div = parseLongDivision(q);
    if (div) return workedDivisionSteps(+div.dividend, +div.divisor);
    // Angle diagrams: the measures live in the marker (which the scaffold strips),
    // so build the geometric steps here from the marker numbers.
    const vza = parseViz(q);
    if (vza && isFigureKind(vza.viz.kind)) {
      const k = vza.viz.kind, [m, m2] = vza.viz.nums;
      if (k === "angcross") return ["Vertical angles are equal.", `Answer: ${ans}.`];
      if (k === "angright") return ["Complementary angles add to 90°.", `90 − ${m} = ${ans}.`];
      if (k === "angline") return ["The angles add to 180°.", `180 − ${m} = ${ans}.`];
      if (k === "angtri") return ["A triangle's angles add to 180°.", `${m} + ${m2} = ${m + m2}`, `180 − ${m + m2} = ${ans}.`];
      const perim = /perimeter/i.test(directive ?? "");
      if (k === "geomrect") return perim ? ["P = 2 × (l + w)", `2 × (${m} + ${m2}) = ${ans}.`] : ["A = l × w", `${m} × ${m2} = ${ans}.`];
      if (k === "geomsquare") return perim ? ["P = 4 × side", `4 × ${m} = ${ans}.`] : ["A = side × side", `${m} × ${m} = ${ans}.`];
      if (k === "geomtri") return ["A = ½ × base × height", `½ × ${m} × ${m2} = ${ans}.`];
      if (k === "geomcircle") return /area/i.test(q) ? ["A = π r²", `3.14 × ${m} × ${m} = ${ans}.`] : ["C = 2 π r", `2 × 3.14 × ${m} = ${ans}.`];
    }
    return buildScaffold(q, ans, "", { directive }).hints;
  };

  if (workedExample) {
    // Keep the curated (concise, hand-written) steps — except for column-method
    // or long-division problems, where concrete digit-by-digit working is clearer.
    const isAlgo = parseColumnar(workedExample.problem) || parseLongDivision(workedExample.problem);
    out.push(isAlgo ? { ...workedExample, steps: stepsFor(workedExample.problem, workedExample.answer) } : workedExample);
    seen.add(workedExample.problem.replace(/\s*=\s*$/, ""));
  }
  const n = problems.length;
  for (const idx of [0, Math.floor(n * 0.35), Math.floor(n * 0.6), n - 1]) {
    if (out.length >= 5) break;
    const p = problems[idx];
    if (!p) continue;
    const key = p.question.replace(/\s*=\s*$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    const ans = String((p as any).answer ?? "");
    // Append "=" only to bare expressions, not to visual or instruction prompts.
    const append = !parseViz(p.question) && !p.question.includes("=") && /^[\d(]/.test(p.question.trim());
    out.push({
      problem: append ? `${p.question} =` : p.question,
      steps: stepsFor(p.question, ans),
      answer: ans,
    });
  }
  return out.slice(0, 5);
}

// ── Lesson Page (full page of worked examples, first sheet of a new skill) ─────
function LessonPage({ sheet, examples, watermark }: { sheet: WorksheetData; examples: WorkedExample[]; watermark?: string }) {
  const { meta } = sheet;
  // Pull the same curated teaching content the on-screen lesson uses, so the
  // printout follows one standard shape: 🎯 Goal · 💡 Big Idea · Key Ideas ·
  // 📝 Worked Examples. Shop is MATH-only; the subSkillLabel keyword-matches the
  // tutorial bank (e.g. "Addition — sums to 10" → addition tutorial).
  // Try the specific unit label first (catches granular units like "Comparing
  // fractions" or "Slope-intercept"); if that yields the generic fallback (no
  // concepts), retry with a canonical name for the skill family so e.g.
  // FRACTIONS' "Part of a whole" still resolves to the fractions tutorial.
  const SKILL_TUTORIAL_KEY: Partial<Record<string, string>> = {
    ADDITION: "addition", SUBTRACTION: "subtraction", MULTIPLICATION: "multiplication",
    DIVISION: "division", FRACTIONS: "fractions", DECIMALS: "decimals", RATIOS: "ratios",
    LINEAR_EQUATIONS: "slope-intercept", POLYNOMIALS: "adding polynomials",
  };
  const tut = (name: string) => { try { return getTutorial("MATH", name); } catch { return null; } };
  let tutorial = tut(meta.subSkillLabel);
  if (!tutorial?.concepts?.length) {
    const fallbackKey = SKILL_TUTORIAL_KEY[meta.skill];
    if (fallbackKey) { const t = tut(fallbackKey); if (t?.concepts?.length) tutorial = t; }
  }
  const keyIdeas = (tutorial?.concepts ?? []).slice(0, 4);
  // Only show curated teaching text. The generic fallback has no concepts and a
  // filler intro ("Let's learn … step by step"); for those skills (e.g. some
  // geometry units) we let the sheet's own worked examples carry the lesson
  // rather than printing bland boilerplate.
  const bigIdea = keyIdeas.length > 0 ? tutorial?.intro : undefined;
  return (
    <Page size="LETTER" style={s.page}>
      {watermark ? <Watermark text={watermark} /> : null}
      <View style={s.headerBar}>
        <View>
          <Text style={s.headerOrg}>Eduyro Education · eduyro.com</Text>
          <Text style={s.headerTitle}>{meta.subSkillLabel}</Text>
          <Text style={s.headerSub}>
            {meta.levelName ? `${meta.levelName} · ` : ""}{meta.gradeLevel} · Skill {meta.skillCode} · Lesson — read before Sheet {meta.sheetNumber}
          </Text>
        </View>
        <View style={s.headerBadge}>
          <Text style={s.badgeCode}>{meta.skillCode}</Text>
          <Text style={s.badgeGrade}>Lesson</Text>
        </View>
      </View>

      <View style={s.objectiveBox}>
        <Text style={s.objectiveLabel}>🎯 Goal:</Text>
        <Text style={s.objectiveText}>{meta.learningObjective}.</Text>
      </View>

      {bigIdea ? (
        <View style={s.bigIdeaBox}>
          <Text style={s.bigIdeaLabel}>💡 Big Idea</Text>
          <Text style={s.bigIdeaText}>{bigIdea}</Text>
        </View>
      ) : null}

      {keyIdeas.length > 0 ? (
        <>
          <Text style={s.lessonTitle}>Key Ideas</Text>
          <View style={s.keyIdeasWrap}>
            {keyIdeas.map((c, i) => (
              <View key={i} style={s.keyIdeaCard}>
                <Text style={s.keyIdeaTitle}>{c.title}</Text>
                {c.formula ? <PdfMathText text={c.formula} fontSize={7.5} /> : null}
                <Text style={s.keyIdeaText}>{c.explanation}</Text>
                {c.tip ? <Text style={{ ...s.keyIdeaText, fontStyle: "italic", marginTop: 2 }}>Tip: {c.tip}</Text> : null}
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={s.lessonTitle}>📝 Worked Examples — study these before you practise</Text>

      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" }}>
        {examples.map((ex, i) => {
          // Column-method skills (multi-digit + − ×) and division DEMONSTRATE
          // their stacked/bracket layout with the answer filled in; everything
          // else shows horizontally.
          const exViz = parseViz(ex.problem);
          const exStack = exViz ? null : parseColumnar(ex.problem);
          const exDiv = exViz || exStack ? null : parseLongDivision(ex.problem);
          return (
            <View key={i} style={s.lessonCard}>
              <Text style={s.lessonCardNum}>Example {i + 1}</Text>
              <View style={{ marginBottom: 4, flexDirection: "row", alignItems: "center", gap: 8 }}>
                {exViz ? (
                  <>
                    <VizShape viz={exViz.viz} size={58} />
                    <PdfMathText text={exViz.text} fontSize={10} />
                  </>
                ) : exStack ? (
                  <PdfColumnar c={exStack} fontSize={12} result={ex.answer} />
                ) : exDiv ? (
                  <PdfLongDivision d={exDiv} fontSize={12} result={ex.answer} />
                ) : (
                  <PdfMathText text={ex.problem} fontSize={11} />
                )}
              </View>
              {ex.steps.map((step, si) => (
                <View key={si} style={s.exampleStep}>
                  <Text style={s.stepNum}>{si + 1}.</Text>
                  <View style={{ flex: 1 }}>
                    <PdfMathText text={step} fontSize={8} />
                  </View>
                </View>
              ))}
              {!exStack && !exDiv && (
                <View style={s.exampleAns}>
                  <Text style={s.ansLabel}>Answer:</Text>
                  <PdfMathText text={ex.answer} fontSize={9.5} />
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={s.footer} fixed>
        <Text style={s.footerText}>{meta.skillCode} · {meta.subSkillLabel} · Eduyro</Text>
        <Text style={{ ...s.footerText, fontStyle: "italic" }}>
          For personal and household use only. © {new Date().getFullYear()} Eduyro Education Inc.
        </Text>
      </View>
    </Page>
  );
}

// ── Worksheet Page ────────────────────────────────────────────────────────────
function WorksheetPage({ sheet, watermark }: { sheet: WorksheetData; watermark?: string }) {
  const { meta, problems } = sheet;
  const date  = new Date().toLocaleDateString("en-CA");
  // Measure RENDERED width, not raw markup: "\frac{2}{12}" prints as a compact
  // stacked fraction (~2 chars wide), not its 12-char source. A visual marker
  // ("[[viz …]]") prints as a shape and contributes no text width.
  const visualLen = (q: string) =>
    q.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_m, n, d) => "x".repeat(Math.max(String(n).length, String(d).length)))
     .replace(/\[\[viz[^\]]*\]\]/g, "")
     .trim().length;
  const avgLen = problems.reduce((acc, p) => acc + visualLen(p.question), 0) / Math.max(1, problems.length);
  const hasStacked = problems.some((p) => p.question.includes("\\frac"));
  const layout = computeLayout(problems.length, meta.mode, avgLen, hasStacked);

  // Visual-foundation sheets (M7 sheets 1–5): few problems, mostly pictures →
  // render a roomy 2-column card grid with large shapes instead of dense rows.
  const vizCount = problems.filter(p => parseViz(p.question)).length;
  const isVisualSheet = problems.length <= 12 && vizCount >= problems.length * 0.6;

  const cols   = layout.columns;
  const perCol = Math.ceil(problems.length / cols);
  const colGroups: WorksheetProblem[][] = Array.from({ length: cols }, (_, c) =>
    problems.slice(c * perCol, (c + 1) * perCol)
  );

  // First sheet of a new skill → a dedicated lesson page of worked examples
  // precedes the practice problems.
  const lessonExamples = meta.mode === "tutorial" ? buildExamples(sheet) : [];

  return (
    <>
    {lessonExamples.length > 0 && (
      <LessonPage sheet={sheet} examples={lessonExamples} watermark={watermark} />
    )}
    <Page size="LETTER" style={s.page}>
      {watermark ? <Watermark text={watermark} /> : null}

      {/* ── Blue header bar ── */}
      <View style={s.headerBar}>
        <View>
          <Text style={s.headerOrg}>Eduyro Education · eduyro.com</Text>
          <Text style={s.headerTitle}>{meta.subSkillLabel}</Text>
          <Text style={s.headerSub}>
            {meta.levelName ? `${meta.levelName} · ` : ""}{meta.gradeLevel} · Skill {meta.skillCode} · {meta.estimatedMinutes} min · Sheet {meta.sheetNumber} of {meta.totalSheets}
          </Text>
        </View>
        <View style={s.headerBadge}>
          <Text style={s.badgeCode}>{meta.skillCode}</Text>
          <Text style={s.badgeGrade}>{meta.gradeLevel}</Text>
        </View>
      </View>

      {/* ── Student info ── */}
      <View style={s.studentRow}>
        {[
          { label: "Student Name", value: "" },
          { label: "Date",         value: date },
          { label: `Score / ${problems.length}`, value: "" },
        ].map((f, i) => (
          <View key={i} style={s.studentField}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            <View style={s.fieldLine}>
              {f.value ? <Text style={s.fieldValue}>{f.value}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {/* ── Section directive (once) — falls back to the objective ── */}
      <View style={s.objectiveBox}>
        {meta.directive ? (
          <Text style={[s.objectiveText, { fontFamily: "BodySans-Bold" }]}>{meta.directive}</Text>
        ) : (
          <>
            <Text style={s.objectiveLabel}>Today I will:</Text>
            <Text style={s.objectiveText}>{meta.learningObjective}.</Text>
          </>
        )}
      </View>

      {/* Worked examples now live on the preceding lesson page (first sheet of a
          new skill), so the practice page is all problems. */}

      {/* ── Problems — flex:1 fills all remaining page space ── */}
      {isVisualSheet ? (
        // Large-visual card grid. alignContent:"space-around" spreads the wrapped
        // rows down the page WITH a margin above the first and below the last row,
        // so the bottom figures never collide with the mastery-check footer (which
        // "space-between" pinned them flush against).
        <View style={{ flex:1, flexDirection:"row", flexWrap:"wrap", alignContent:"space-around" }}>
          {/* Size figures to the ROW COUNT so the rows always fit the page (3 rows
              of large geometry figures were overflowing into the footer). 2 rows →
              big; 3 rows → medium; more → compact. */}
          {problems.map((p, idx) => {
            const vz = parseViz(p.question);
            const rows = Math.ceil(problems.length / 2);
            const vizSize = rows <= 2 ? 112 : rows === 3 ? 88 : 58;
            return (
              <View key={p.id} style={{ width:"50%", paddingVertical:6, paddingHorizontal:6, flexDirection:"row", alignItems:"center" }}>
                <Text style={[s.probNum, { marginTop:2 }]}>{idx + 1}.</Text>
                {/* Shape on the left; the answer line sits just to its right (not
                    stranded at the far page edge). */}
                {vz ? <View style={{ marginRight:8 }}><VizShape viz={vz.viz} size={vizSize} /></View> : null}
                <View style={{ flexDirection:"row", alignItems:"center" }}>
                  {vz && vz.text ? <PdfMathText text={vz.text} fontSize={9} /> : !vz ? <PdfMathText text={p.question} fontSize={9} /> : null}
                  <View style={{ paddingLeft:8 }}><AnswerLine /></View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ flex:1, flexDirection:"row", gap:8 }}>
          {colGroups.map((col, ci) => (
            <View key={ci} style={{ flex:1, flexDirection:"column" }}>
              {col.map((p, pi) => {
                const idx = ci * perCol + pi;
                const vz = parseViz(p.question);
                // Multi-digit +, −, × render stacked (written computation); single-
                // digit facts and everything else stay horizontal.
                const stack = vz ? null : parseColumnar(p.question);
                const ld = vz || stack ? null : parseLongDivision(p.question);
                // Two independent decisions:
                //  • appendEq: a bare expression ("8/14", "x² + 2x²") gets "=" so
                //    the student knows to compute — but NOT if it already has "="
                //    or an inline "___".
                //  • showLine: draw an answer line UNLESS the question already has
                //    its slot inline ("___" or "?"). Equations ("2x + 3 = 11") and
                //    evaluations ("x + 5, x = 3") still get a line.
                const _q = p.question;
                const appendEq = !vz && /^[\dx(]/i.test(_q.trim()) && !_q.includes("=") && !_q.includes("___");
                const showLine = !!vz || !(_q.includes("___") || _q.includes("?"));
                return (
                  <View key={p.id} style={[s.problemRow, (stack || ld) ? { alignItems:"flex-start", paddingTop:2 } : null] as any}>
                    <Text style={s.probNum}>{idx + 1}.</Text>
                    {stack ? (
                      <View style={{ flex:1, flexDirection:"row", paddingLeft:8 }}>
                        <PdfColumnar c={stack} fontSize={layout.fontSizePt} />
                      </View>
                    ) : ld ? (
                      <View style={{ flex:1, flexDirection:"row", paddingLeft:8 }}>
                        <PdfLongDivision d={ld} fontSize={layout.fontSizePt} />
                      </View>
                    ) : (
                      /* flex:1 lets the question take available width and pushes the
                         answer line to a consistent right margin via marginLeft:auto,
                         so every blank lines up regardless of question length. */
                      <View style={{ flex:1, flexDirection:"row", alignItems:"center" }}>
                        {vz ? (
                          <View style={{ marginRight:6 }}><VizShape viz={vz.viz} size={28} /></View>
                        ) : null}
                        <PdfMathText
                          text={vz ? vz.text : (appendEq ? `${p.question} =` : p.question)}
                          fontSize={layout.fontSizePt}
                        />
                        {showLine && (
                          <View style={{ marginLeft:"auto", paddingLeft:6 }}>
                            <AnswerLine />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* ── Mastery check ── */}
      <View style={s.masteryStrip}>
        <Text style={s.masteryLabel}>Mastery Check:</Text>
        <View style={s.checkItem}>
          <View style={s.checkBox} />
          <Text style={s.checkLabel}>I completed this independently</Text>
        </View>
        <View style={s.checkItem}>
          <View style={s.checkBox} />
          <Text style={s.checkLabel}>I checked my answers</Text>
        </View>
      </View>

      {/* ── Fixed footer ── */}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>{meta.skillCode} · {meta.subSkillLabel} · Eduyro</Text>
        <Text style={{ ...s.footerText, fontStyle:"italic" }}>
          For personal and household use only. © {new Date().getFullYear()} Eduyro Education Inc.
        </Text>
        <Text style={s.footerText}>Sheet {meta.sheetNumber} of {meta.totalSheets}</Text>
      </View>

    </Page>
    </>
  );
}

// ── Consolidated Answer Key Page ──────────────────────────────────────────────
// Multiple worksheets' answers packed onto one page.
// Shows only: "Sheet N" label → 4-column number+answer grid.
// No question text. No re-solving. Source of truth is p.answer.

interface AkEntry {
  sheetNumber: number;
  subSkillLabel: string;
  answers: { n: number; answer: string }[];
}

// Rough per-sheet height estimate for packing:
//   section label (~14pt) + ceil(count/4) rows × 11pt + bottom gap (8pt)
function estSheetHeight(answerCount: number): number {
return 14 + Math.ceil(answerCount / 6) * 15 + 6;
}

const AK_PAGE_AVAILABLE = 792 - 30 - 36 - 60; // page - margins - header bar

function ConsolidatedAnswerKeyPage({
  entries,
  pageNum,
  totalAkPages,
  skillLabel,
  skillCode,
  watermark,
}: {
  watermark?: string;
  entries: AkEntry[];
  pageNum: number;
  totalAkPages: number;
  skillLabel: string;
  skillCode: string;
}) {
  const AK_COLS = 6;

  return (
    <Page size="LETTER" style={s.page}>
      {watermark ? <Watermark text={watermark} /> : null}
      {/* Header bar */}
      <View style={s.akHeaderBar}>
        <View>
          <Text style={s.akHeaderTitle}>Answer Key</Text>
          <Text style={s.akHeaderSub}>{skillLabel} · {skillCode}</Text>
        </View>
        <Text style={{ fontSize:7, color:"rgba(255,255,255,0.7)" }}>
          Page {pageNum} of {totalAkPages} · eduyro.com
        </Text>
      </View>

      {/* One block per worksheet */}
      {entries.map((entry) => {
        const perCol = Math.ceil(entry.answers.length / AK_COLS);
        const cols: { n: number; answer: string }[][] = Array.from(
          { length: AK_COLS },
          (_, c) => entry.answers.slice(c * perCol, (c + 1) * perCol)
        );
        return (
          <View key={entry.sheetNumber} style={s.akSheetBlock}>
            <Text style={s.akSheetLabel}>Sheet {entry.sheetNumber} — {entry.subSkillLabel}</Text>
            <View style={s.akGrid}>
              {cols.map((col, ci) => (
                <View key={ci} style={s.akCol}>
                  {col.map(({ n, answer }) => (
                    <View key={n} style={s.akRow}>
                      <Text style={s.akNum}>{n}.</Text>
                      <Text style={s.akAnswerText}>{inlineFraction(answer)}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* Fixed footer */}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>{skillCode} · {skillLabel} · Eduyro Answer Key</Text>
        <Text style={{ ...s.footerText, fontStyle:"italic" }}>
          For personal and household use only. © {new Date().getFullYear()} Eduyro Education Inc.
        </Text>
        <Text style={s.footerText}>Answer Key · Page {pageNum} of {totalAkPages}</Text>
      </View>
    </Page>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface PdfPackInput {
  skillLabel: string;
  skillCode: string;
  levelCode: string;
  /** Append consolidated answer-key pages (default true). */
  includeAnswerKey?: boolean;
  sheets: {
    problems: { id: string; question: string; answer: string; zone?: number }[];
    skillBand: string;
    meta?: WorksheetData["meta"];
    workedExample?: WorksheetData["workedExample"];
  }[];
}

export async function renderHtmlToPdf(_html: string): Promise<Uint8Array> {
  throw new Error("Use renderPackToPdf instead");
}

export async function renderPackToPdf(input: PdfPackInput): Promise<Uint8Array> {
  const date = new Date().toLocaleDateString("en-CA");

  // Convert input sheets to WorksheetData
  const worksheets: WorksheetData[] = input.sheets.map((s, i) => ({
    problems: s.problems.map((p, pi) => ({
      ...p,
      type: "arithmetic" as const,
      points: 1,
      answer: String(p.answer),
      zone: (p.zone ?? Math.floor(pi / 6) + 1) as 1|2|3|4|5,
    })),
    answerKey: s.problems.map(p => ({ id: p.id, answer: String(p.answer) })),
    workedExample: s.workedExample,
    meta: s.meta ?? {
      skill:             input.levelCode as any,
      skillCode:         input.levelCode,
      sheetNumber:       i + 1,
      totalSheets:       input.sheets.length,
      subSkillLabel:     s.skillBand,
      gradeLevel:        "Grade K–12",
      difficultyStars:   3,
      learningObjective: "practice this skill",
      mode:              "practice" as const,
      estimatedMinutes:  10,
    },
  }));

  // ── Pack answer-key entries into pages greedily ──
  const withAnswerKey = input.includeAnswerKey !== false;
  const akEntries: AkEntry[] = worksheets.map((ws, i) => ({
    sheetNumber:  ws.meta.sheetNumber,
    subSkillLabel: ws.meta.subSkillLabel,
    answers: ws.problems.map((p, pi) => ({ n: pi + 1, answer: String(p.answer) })),
  }));

  const akPages: AkEntry[][] = [];
  let currentPage: AkEntry[] = [];
  let currentHeight = 0;

  for (const entry of akEntries) {
    const needed = estSheetHeight(entry.answers.length);
    if (currentPage.length > 0 && currentHeight + needed > AK_PAGE_AVAILABLE) {
      akPages.push(currentPage);
      currentPage  = [];
      currentHeight = 0;
    }
    currentPage.push(entry);
    currentHeight += needed;
  }
  if (currentPage.length > 0) akPages.push(currentPage);

  const totalAkPages = akPages.length;

  const doc = React.createElement(
    Document,
    { title: `${input.skillLabel} — Eduyro` },
    // All worksheets first
    ...worksheets.map((ws, i) =>
      React.createElement(WorksheetPage, { key: `ws-${i}`, sheet: ws })
    ),
    // Consolidated answer key pages at the end (unless suppressed)
    ...(withAnswerKey
      ? akPages.map((entries, i) =>
          React.createElement(ConsolidatedAnswerKeyPage, {
            key:          `ak-${i}`,
            entries,
            pageNum:      i + 1,
            totalAkPages,
            skillLabel:   input.skillLabel,
            skillCode:    input.skillCode,
          })
        )
      : [])
  );

  const buffer = await renderToBuffer(doc);
  return new Uint8Array(buffer);
}

// Direct render from WorksheetData (used by preview route — single sheet)
export async function renderWorksheetToPdf(
  sheet: WorksheetData,
  opts?: { watermark?: string },
): Promise<Uint8Array> {
  const entry: AkEntry = {
    sheetNumber:   sheet.meta.sheetNumber,
    subSkillLabel: sheet.meta.subSkillLabel,
    answers: sheet.problems.map((p, i) => ({ n: i + 1, answer: String(p.answer) })),
  };

  const doc = React.createElement(
    Document,
    { title: `${sheet.meta.subSkillLabel} — Eduyro` },
    React.createElement(WorksheetPage, { sheet, watermark: opts?.watermark }),
    React.createElement(ConsolidatedAnswerKeyPage, {
      watermark:   opts?.watermark,
      entries:     [entry],
      pageNum:     1,
      totalAkPages: 1,
      skillLabel:  sheet.meta.subSkillLabel,
      skillCode:   sheet.meta.skillCode,
    })
  );

  const buffer = await renderToBuffer(doc);
  return new Uint8Array(buffer);
}
