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
import { parseColumnar, parseLongDivision, parseStack, type Columnar, type LongDivision, type Stack } from "@/lib/math/columnar";
import { polygonSlicePaths, POLY_SIDES } from "@/lib/math/fraction-shapes";
import { figureDiagram, isFigureKind } from "@/lib/math/angle-shapes";
import { workedArithmeticSteps, workedDivisionSteps, partialProductSteps, additionFactSteps, subtractionFactSteps, multiplicationFactSteps, divisionFactSteps, remainderFactSteps, missingAddendSteps, missingFactorSteps, tensMultiplySteps, unitFactors, type FactUnit } from "@/lib/math/worked-steps";
import { polyWorkedSteps } from "@/lib/math/poly-steps";
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

// Small concrete-model dot diagram for a worked example, drawn INLINE beside the
// problem so it adds no vertical rows: multiplication → array, addition → two
// groups (filled + hollow), subtraction → take-away (crossed), division → equal
// groups. Returns null whenever the numbers are too big to draw cleanly, so it
// can never overflow a lesson card (only the small single-digit facts get one).
function ExampleViz({ problem }: { problem: string }) {
  const m = problem.replace(/\s+/g, " ").match(/^(\d+)\s*([+\-−x×*÷\/])\s*(\d+)/);
  if (!m) return null;
  const a = +m[1], b = +m[3], raw = m[2];
  const op = raw === "+" ? "+" : (raw === "-" || raw === "−") ? "-" : (raw === "÷" || raw === "/") ? "÷" : "×";
  const P = 4.2, R = 1.5, K = VZ.ink; const el: any[] = [];
  const put = (cx: number, cy: number, filled: boolean, cross: boolean, k: string) => {
    el.push(<Circle key={"c" + k} cx={cx} cy={cy} r={R} fill={filled ? VZ.gold : "#fff"} stroke={K} strokeWidth={0.5} />);
    if (cross) el.push(<Line key={"x" + k} x1={cx - R} y1={cy - R} x2={cx + R} y2={cy + R} stroke={K} strokeWidth={0.6} />);
  };
  const svg = (w: number, h: number) => <Svg width={w} height={h}>{el}</Svg>;
  if (op === "×") {
    const rows = Math.min(a, b), cols = Math.max(a, b);
    if (rows < 1 || rows > 6 || cols > 12) return null;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) put(c * P + R + 1, r * P + R + 1, true, false, `${r}_${c}`);
    return svg(cols * P + 2, rows * P + 2);
  }
  if (op === "+") {
    if (a + b > 20 || a < 1 || b < 1) return null;
    const per = 10, tot = a + b;
    for (let i = 0; i < tot; i++) put((i % per) * P + R + 1, Math.floor(i / per) * P + R + 1, i < a, false, "p" + i);
    return svg(Math.min(per, tot) * P + 2, Math.ceil(tot / per) * P + 2);
  }
  if (op === "-") {
    if (a > 20 || a < 1 || b > a) return null;
    const per = 10;
    for (let i = 0; i < a; i++) put((i % per) * P + R + 1, Math.floor(i / per) * P + R + 1, true, i >= a - b, "s" + i);
    return svg(Math.min(per, a) * P + 2, Math.ceil(a / per) * P + 2);
  }
  if (op === "÷") {
    if (b < 1 || b > 6 || a < 1 || a % b !== 0) return null;
    const per = a / b; if (per > 8) return null;
    for (let g = 0; g < b; g++) for (let i = 0; i < per; i++) put(i * P + R + 1, g * P + R + 1, true, false, `${g}_${i}`);
    return svg(per * P + 2, b * P + 2);
  }
  return null;
}

// ── Coordinate grid for graphing items on the PRINTED sheet ───────────────────
// The web practice drags points/lines; on paper we draw a proper labelled grid
// so the child can plot by hand. For equation-builder the line IS drawn (they
// read it and write the equation); for plot-* / transform it's blank to plot on.
const COORD_KINDS = ["plot-point", "plot-line", "equation-builder", "triangle-drag", "vertex-drag"];
function isCoordInteractive(p: any): boolean {
  return !!p?.interactive && COORD_KINDS.includes(p.interactive.kind);
}
function PdfCoordGrid({ spec, size }: { spec: any; size: number }) {
  const [x0, x1] = spec.xRange ?? [-6, 6];
  const [y0, y1] = spec.yRange ?? [-6, 6];
  const w = size, h = size;
  const sx = (x: number) => ((x - x0) / (x1 - x0)) * w;
  const sy = (y: number) => h - ((y - y0) / (y1 - y0)) * h;
  const els: any[] = [];
  for (let x = Math.ceil(x0); x <= x1; x++) els.push(<Line key={`gx${x}`} x1={sx(x)} y1={0} x2={sx(x)} y2={h} stroke="#E8E0D0" strokeWidth={0.35} />);
  for (let y = Math.ceil(y0); y <= y1; y++) els.push(<Line key={`gy${y}`} x1={0} y1={sy(y)} x2={w} y2={sy(y)} stroke="#E8E0D0" strokeWidth={0.35} />);
  els.push(<Line key="ax" x1={0} y1={sy(0)} x2={w} y2={sy(0)} stroke={C.ink} strokeWidth={0.8} />);
  els.push(<Line key="ay" x1={sx(0)} y1={0} x2={sx(0)} y2={h} stroke={C.ink} strokeWidth={0.8} />);
  // axis end labels (compact — just the extremes)
  els.push(<SvgText key="lx" x={w - 3} y={sy(0) - 2} textAnchor="end" style={{ fontSize: 4.5, fontFamily: "BodySans" }} fill="#999">x</SvgText>);
  els.push(<SvgText key="ly" x={sx(0) + 3} y={5} style={{ fontSize: 4.5, fontFamily: "BodySans" }} fill="#999">y</SvgText>);
  // Equation-builder: draw the line y = mx + b, clipped to the box.
  if (spec.line && typeof spec.line.m === "number") {
    const { m, b } = spec.line;
    const pts: [number, number][] = [];
    for (const x of [x0, x1]) { const y = m * x + b; if (y >= y0 - 1e-6 && y <= y1 + 1e-6) pts.push([x, y]); }
    if (m !== 0) for (const y of [y0, y1]) { const x = (y - b) / m; if (x >= x0 - 1e-6 && x <= x1 + 1e-6) pts.push([x, y]); }
    const uniq = pts.filter((p, i) => pts.findIndex((q) => Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6) === i).slice(0, 2);
    if (uniq.length === 2) els.push(<Line key="fn" x1={sx(uniq[0][0])} y1={sy(uniq[0][1])} x2={sx(uniq[1][0])} y2={sy(uniq[1][1])} stroke={VZ.gold} strokeWidth={1.4} />);
  }
  // A plotted point (for a SOLVED worked example — the practice grid leaves this off).
  if (spec.point && Array.isArray(spec.point)) {
    const [px, py] = spec.point;
    els.push(<Circle key="pt" cx={sx(px)} cy={sy(py)} r={2.4} fill={VZ.gold} stroke={C.ink} strokeWidth={0.5} />);
    els.push(<SvgText key="ptl" x={sx(px) + 4} y={sy(py) - 3} style={{ fontSize: 5, fontFamily: "BodySans" }} fill={C.ink}>{`(${px}, ${py})`}</SvgText>);
  }
  // A plotted parabola y = a(x − h)² + k — drawn as a polyline through the box.
  if (spec.parab) {
    const { a, h, k } = spec.parab;
    const pts: [number, number][] = [];
    for (let px = x0; px <= x1 + 1e-6; px += 0.2) { const py = a * (px - h) * (px - h) + k; if (py >= y0 - 1 && py <= y1 + 1) pts.push([px, py]); }
    for (let idx = 0; idx < pts.length - 1; idx++) els.push(<Line key={`pb${idx}`} x1={sx(pts[idx][0])} y1={sy(pts[idx][1])} x2={sx(pts[idx + 1][0])} y2={sy(pts[idx + 1][1])} stroke={VZ.gold} strokeWidth={1.3} />);
    els.push(<Circle key="pbv" cx={sx(h)} cy={sy(k)} r={2} fill={VZ.gold} stroke={C.ink} strokeWidth={0.4} />);
  }
  // A plotted polygon (triangle) — edges + vertex dots.
  if (spec.points && Array.isArray(spec.points) && spec.points.length >= 2) {
    const pts: [number, number][] = spec.points;
    for (let k = 0; k < pts.length; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length];
      els.push(<Line key={`pe${k}`} x1={sx(ax)} y1={sy(ay)} x2={sx(bx)} y2={sy(by)} stroke={VZ.gold} strokeWidth={1.2} />);
    }
    pts.forEach(([px, py], k) => els.push(<Circle key={`pv${k}`} cx={sx(px)} cy={sy(py)} r={1.8} fill={VZ.gold} stroke={C.ink} strokeWidth={0.4} />));
  }
  return <Svg width={w} height={h}>{els}</Svg>;
}
// Parse a plotting worked-example problem+answer into the SOLUTION to draw so
// every "plot / graph / drag …" example shows the actual plotted figure. Covers
// lines (plot-line + equation-builder), single points (plot-point, y-intercept,
// transforms, parabola vertex-drag), triangles, and unit-circle angles.
interface PlotSolution { line?: { m: number; b: number }; point?: [number, number]; points?: [number, number][]; angleDeg?: number; parab?: { a: number; h: number; k: number }; }
function parsePlotSolution(problem: string, answer?: string): PlotSolution | null {
  const q = problem.replace(/−/g, "-");
  const ans = (answer ?? "").replace(/−/g, "-").trim();
  const slopeOf = (s: string) => (s === "" || s === "+" ? 1 : s === "-" ? -1 : +s);
  // Answers may be stored raw ("3,2", "1,-3") or already print-formatted by
  // printNormalize / displayPlotAnswer ("(3, 2)", "y = x − 3", "slope 1, …").
  const pair = ans.match(/^\(?(-?\d+),\s*(-?\d+)\)?$/) ?? ans.match(/^vertex \((-?\d+),\s*(-?\d+)\)$/);
  // Line — "Plot the line y = mx + b" (the stored prompt ends with a period)
  let m = q.match(/Plot the line\s+y\s*=\s*(-?\d*)x\s*([+-])\s*(\d+)/i);
  if (m) return { line: { m: slopeOf(m[1]), b: (m[2] === "-" ? -1 : 1) * +m[3] } };
  m = q.match(/Plot the line\s+y\s*=\s*(-?\d*)x\s*\.?\s*$/i);
  if (m) return { line: { m: slopeOf(m[1]), b: 0 } };
  // Line given by the answer — equation-builder / "build its equation": the
  // stored "m,b", the print form "y = mx + b", or the lesson form "slope m, y-intercept b".
  if (/equation of the line|build (its|the) equation|linear function[^]*shown/i.test(q)) {
    if (pair) return { line: { m: +pair[1], b: +pair[2] } };
    const eq = ans.match(/^y = (-?\d*)x(?:\s*([+-])\s*(\d+))?$/);
    if (eq) return { line: { m: slopeOf(eq[1]), b: eq[2] ? (eq[2] === "-" ? -1 : 1) * +eq[3] : 0 } };
    const sl = ans.match(/^slope (-?\d+), y-intercept (-?\d+)/);
    if (sl) return { line: { m: +sl[1], b: +sl[2] } };
  }
  // Parabola result of a transform (MC "which graph …") — answer "parab:a,h,k".
  const pm = ans.match(/^parab:(-?\d+),(-?\d+),(-?\d+)$/);
  if (pm) return { parab: { a: +pm[1], h: +pm[2], k: +pm[3] } };
  // Parabola vertex-drag → draw the parabola (a = 1) at the target vertex (h,k).
  if (/parabola|vertex/i.test(q)) { if (pair) return { parab: { a: 1, h: +pair[1], k: +pair[2] } }; }
  // Triangle — answer is 3+ "x,y" pairs joined by ";" (or "(x, y), (x, y), …" once formatted)
  if (/triangle/i.test(q)) {
    const pts = [...ans.matchAll(/\(?(-?\d+),\s*(-?\d+)\)?/g)].map((mm) => [+mm[1], +mm[2]] as [number, number]);
    if (pts.length >= 3) return { points: pts };
  }
  // Unit circle — "…θ = 30°" OR "…to the angle π/6 radians" (answer = degrees).
  m = q.match(/circle[^]*?(?:θ\s*=\s*|angle\s+)(-?\d+)\s*°/i);
  if (m) return { angleDeg: +m[1] };
  if (/around the circle/i.test(q)) { const a = ans.match(/^(-?\d+)$/); if (a) return { angleDeg: +a[1] }; }
  // y-intercept point
  m = q.match(/y-intercept of the line\s+y\s*=\s*-?\d*x\s*([+-])\s*(\d+)/i);
  if (m) return { point: [0, (m[1] === "-" ? -1 : 1) * +m[2]] };
  // Explicit point in the prompt
  m = q.match(/Plot the point\s*\((-?\d+),\s*(-?\d+)\)/i);
  if (m) return { point: [+m[1], +m[2]] };
  // Any other plot / drag / transform task → plot the ANSWER point.
  if (/plot|drag|image|reflect|translat|rotat/i.test(q)) {
    const a = ans.match(/^(-?\d+),\s*(-?\d+)$/); if (a) return { point: [+a[1], +a[2]] };
  }
  return null;
}

// ── Unit circle for trig "angle" items on the PRINTED sheet ───────────────────
// The web practice drags a point around the circle; on paper we draw a labelled
// unit circle with axes + spoke marks at the common angles so the child can mark
// the target angle by hand. Blank (no marked point) — that's what they plot.
function PdfUnitCircle({ size, markDeg }: { size: number; markDeg?: number }) {
  const w = size, h = size, cx = w / 2, cy = h / 2, r = size * 0.42;
  const els: any[] = [];
  els.push(<Circle key="c" cx={cx} cy={cy} r={r} fill="none" stroke={C.ink} strokeWidth={0.9} />);
  // SOLVED worked example: mark the point at the given angle (radius + dot).
  if (typeof markDeg === "number") {
    const t = (markDeg * Math.PI) / 180, mx = cx + r * Math.cos(t), my = cy - r * Math.sin(t);
    els.push(<Line key="mr" x1={cx} y1={cy} x2={mx} y2={my} stroke={VZ.gold} strokeWidth={1.2} />);
    els.push(<Circle key="mp" cx={mx} cy={my} r={2.4} fill={VZ.gold} stroke={C.ink} strokeWidth={0.5} />);
    els.push(<SvgText key="ml" x={mx + 3} y={my - 2} style={{ fontSize: 5, fontFamily: "BodySans" }} fill={C.ink}>{`${markDeg}°`}</SvgText>);
  }
  els.push(<Line key="ax" x1={cx - r - 4} y1={cy} x2={cx + r + 4} y2={cy} stroke={C.ink} strokeWidth={0.7} />);
  els.push(<Line key="ay" x1={cx} y1={cy - r - 4} x2={cx} y2={cy + r + 4} stroke={C.ink} strokeWidth={0.7} />);
  // faint spokes every 30° so the student can locate common angles
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    els.push(<Line key={`sp${a}`} x1={cx} y1={cy} x2={cx + r * Math.cos(rad)} y2={cy - r * Math.sin(rad)} stroke="#E8E0D0" strokeWidth={0.35} />);
  }
  els.push(<SvgText key="lx" x={cx + r + 3} y={cy - 2} textAnchor="end" style={{ fontSize: 4.5, fontFamily: "BodySans" }} fill="#999">x</SvgText>);
  els.push(<SvgText key="l0" x={cx + r + 1} y={cy + 7} style={{ fontSize: 4.5, fontFamily: "BodySans" }} fill="#999">0°</SvgText>);
  els.push(<SvgText key="l90" x={cx + 2} y={cy - r - 1} style={{ fontSize: 4.5, fontFamily: "BodySans" }} fill="#999">90°</SvgText>);
  return <Svg width={w} height={h}>{els}</Svg>;
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
  // For decimals, pad operands to equal decimal places so the points line up
  // under right-alignment (e.g. "0.5" / "0.25" → "0.50" / "0.25"). No-op for
  // whole numbers and for operands that already share their decimal places.
  const decPlaces = (s: string) => { const i = s.indexOf("."); return i < 0 ? 0 : s.length - i - 1; };
  const maxDp = Math.max(decPlaces(c.top), decPlaces(c.bottom), result ? decPlaces(result) : 0);
  const pad = (s: string) => {
    if (maxDp === 0) return s;
    const cur = decPlaces(s);
    return cur === maxDp ? s : (s.includes(".") ? s : s + ".") + "0".repeat(maxDp - cur);
  };
  const top = pad(c.top), bottom = pad(c.bottom);
  const resultStr = result != null ? pad(result) : undefined;
  const maxLen = Math.max(top.length, bottom.length, (resultStr ?? "").length);
  // Width = operator slot + digit columns. Right-aligning both numbers makes the
  // place values line up (units under units) without a monospace font.
  const W = fs * 1.1 + maxLen * fs * 0.62 + 3;
  const numStyle = { fontFamily: "BodySans-Bold", fontSize: fs, lineHeight: 1.1, color: C.ink };
  return (
    <View style={{ width: W }}>
      <Text style={{ ...numStyle, textAlign: "right" }}>{top}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Text style={numStyle}>{c.op}</Text>
        <Text style={{ ...numStyle, textAlign: "right" }}>{bottom}</Text>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: C.ink, marginTop: 1, width: "100%" }} />
      {resultStr ? <Text style={{ ...numStyle, textAlign: "right", color: C.green }}>{resultStr}</Text> : null}
    </View>
  );
}

// ── General stacked form — plain, 3-addend, and missing-operand equations ─────
// Every operand is right-aligned in one column; a blank operand (or the blank
// result below the rule) is the answer slot, so answers always align vertically.
function PdfStack({ st, fontSize }: { st: Stack; fontSize: number }) {
  const fs = fontSize;
  // Decimal-point alignment: pad all numeric tokens to equal decimal places.
  const decPlaces = (s: string) => { const i = s.indexOf("."); return i < 0 ? 0 : s.length - i - 1; };
  const tokens = [...st.rows.filter((r): r is string => !!r), ...(st.belowGiven ? [st.belowGiven] : [])];
  const maxDp = Math.max(0, ...tokens.map(decPlaces));
  const pad = (s: string) => {
    if (maxDp === 0) return s;
    const cur = decPlaces(s);
    return cur === maxDp ? s : (s.includes(".") ? s : s + ".") + "0".repeat(maxDp - cur);
  };
  const rows = st.rows.map(r => (r == null ? null : pad(r)));
  const below = st.belowGiven != null ? pad(st.belowGiven) : null;
  const maxLen = Math.max(2, ...rows.map(r => (r ?? "00").length), below ? below.length : 0);
  const W = fs * 1.1 + maxLen * fs * 0.62 + 3;
  const numStyle = { fontFamily: "BodySans-Bold", fontSize: fs, lineHeight: 1.15, color: C.ink } as const;
  const blank = (
    <View style={{ minWidth: fs * maxLen * 0.5, borderBottomWidth: 1, borderBottomColor: C.numInk, height: fs * 1.0 }} />
  );
  return (
    <View style={{ width: W }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Text style={numStyle}>{i === rows.length - 1 ? st.op : ""}</Text>
          {r == null
            ? <View style={{ paddingBottom: 1 }}>{blank}</View>
            : <Text style={{ ...numStyle, textAlign: "right" }}>{r}</Text>}
        </View>
      ))}
      <View style={{ borderTopWidth: 1, borderTopColor: C.ink, marginTop: 1, width: "100%" }} />
      {below != null
        ? <Text style={{ ...numStyle, textAlign: "right" }}>{below}</Text> /* given total (part of the question) */
        : <View style={{ height: fs * 1.15 }} /> /* blank space — student writes the answer */}
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

function polyGcd(a: number, b: number): number { return b === 0 ? Math.abs(a) : polyGcd(b, a % b); }
// DISPLAY-time instruction stripper (ONE-INSTRUCTION-PER-SHEET rule). Every
// engine unit is single-task and the sheet's directive states the instruction
// once, so each practice line shows only the bare expression. Applied when
// rendering practice rows — the STORED question keeps its full instruction (so
// buildExamples/scaffolds still know the task and the answer key reads well).
// The audit found the same per-line verb repetition the user flagged on M12
// also on LINEAR_EQUATIONS ("Solve for x: …" ×30), RATIOS ("Simplify the ratio
// …" / "Find the missing term: …"), PRE_ALGEBRA ("Evaluate … when x = k") and
// DECIMALS ("Write X as a percent") — so the strip is now general, guarded to
// only fire when what remains is a bare expression.
function m12DisplayPrompt(meta: WorksheetData["meta"] | undefined, q: string): string {
  // General single-task shorteners (all math packs).
  let out = q
    .replace(/^Solve for x:\s*(?=[\d(x-])/i, "")
    .replace(/^Simplify the ratio\s+(?=\d)/i, "")
    .replace(/^Find the missing (?:term|number):?\s*(?=\d)/i, "")
    .replace(/^Order (?:these )?from least to greatest:?\s*(?=[\d-])/i, "")
    .replace(/^Evaluate\s+(.+?)\s+when\s+x\s*=\s*(-?\d+)\.?\s*$/i, "$1   (x = $2)")
    .replace(/^Write\s+(.+?)\s+as a (percent|fraction|decimal)\.?\s*$/i, "$1  →  $2")
    .replace(/^Write an equivalent ratio: scale\s+(\d+\s*:\s*\d+)\s+by\s+(\d+)\.?\s*$/i, "$1   ×$2")
    .replace(/^(Solve|Simplify|Expand)\s+(?=[\d(x-])/i, "");
  if (!(meta?.skill === "POLYNOMIALS" || meta?.skillCode === "M12")) return out;
  return out
    .replace(/^Classify by the number of terms:\s*/i, "")
    .replace(/^Is this a polynomial\?\s*/i, "")
    .replace(/^Find the degree of\s+/i, "")
    .replace(/^Write in standard form:\s*/i, "")
    .replace(/^What is the leading coefficient of\s+(.+?)\?\s*$/i, "$1")
    .replace(/^What is the constant term of\s+(.+?)\?\s*$/i, "$1")
    .replace(/^(Simplify|Expand|Multiply|Factor|Divide|Evaluate)\s+(?=[\d(x])/i, "");
}

// ── Print-fitness of step text ────────────────────────────────────────────────
// Every printed step must be a method in complete sentences with no screen
// verbs (type/click/select) and no reference to a picture that isn't drawn.
export function cleanStepsForPrint(steps: string[], skill?: string): string[] {
  const out: string[] = [];
  for (let s of steps) {
    s = s
      .replace(/\bClick\b/g, "Mark").replace(/\bclick\b/g, "mark")
      .replace(/\btyped as\b/g, "written as").replace(/\bType\b/g, "Write").replace(/\btype\b/g, "write")
      .replace(/\bSelect\b/g, "Choose").replace(/\bselect\b/g, "choose")
      .replace(/\s*—\s*the rows in the picture\./, ".")
      .replace(/\bPicture 1 equal groups of (\d+)/, "Picture 1 group of $1")
      .replace(/\s*Count the rows in the picture\./, "")
      .replace(/, using the dots\./, ".").replace(/\s*—\s*use the dots\./, ".");
    if (/^\d+, then \.$/.test(s)) continue; // an empty count list ("2, then .")
    if (!s.trim()) continue;
    if (skill === "PRE_ALGEBRA") s = s.replace(/ · /g, " × ");
    out.push(s);
  }
  return out;
}

// A basic fact (the child recalls or uses a fact strategy) — never a column,
// carry, borrow or bring-down ritual, on the page or in the stacked layout.
export function isBasicFact(question: string): boolean {
  const q = question.replace(/\s+/g, " ").replace(/\s*=\s*\??\s*$/, "").replace(/\.$/, "").trim();
  let m = q.match(/^(\d+) \+ (\d+)$/);
  if (m) return +m[1] + +m[2] <= 20;
  m = q.match(/^(\d+) [-−] (\d+)$/);
  if (m) return +m[1] <= 20;
  m = q.match(/^(\d+) [×x] (\d+)$/);
  if (m) return +m[1] <= 12 && +m[2] <= 12;
  m = q.match(/^(\d+) ÷ (\d+)$/);
  if (m) return +m[2] <= 12 && +m[1] <= 144 && +m[1] % +m[2] === 0 && +m[1] / +m[2] <= 12;
  return false;
}

// Fact strategies + missing-number shapes. Returns null for multi-digit work.
function factSteps(qRaw: string, unit: FactUnit): string[] | null {
  const q = qRaw.replace(/\s+/g, " ").replace(/\s*=\s*\??\s*$/, "").replace(/\.$/, "").trim();
  let m = q.match(/^(\d+) \+ (\d+)$/);
  if (m) return additionFactSteps(+m[1], +m[2], unit);
  m = q.match(/^(\d+) [-−] (\d+)$/);
  if (m) return subtractionFactSteps(+m[1], +m[2], unit);
  m = q.match(/^(\d+) [×x] (\d+)$/);
  if (m) { const a = +m[1], b = +m[2]; return (a <= 12 && b <= 12) ? multiplicationFactSteps(a, b, unit) : tensMultiplySteps(a, b); }
  m = q.match(/^(\d+) ÷ (\d+)$/);
  if (m) { const a = +m[1], b = +m[2]; return a % b === 0 ? divisionFactSteps(a, b) : remainderFactSteps(a, b); }
  m = q.match(/^(\d+) \+ ___ = (\d+)$/) ?? q.match(/^___ \+ (\d+) = (\d+)$/);
  if (m) return missingAddendSteps(+m[1], +m[2]);
  m = q.match(/^(\d+) [×x] ___ = (\d+)$/) ?? q.match(/^___ [×x] (\d+) = (\d+)$/);
  if (m) return missingFactorSteps(+m[1], +m[2]);
  return null;
}

// Item-specific templates the scaffold engine gets wrong on paper (wrong
// operation for ratio scale-ups, "03 ÷ 3", "divide both sides by 1", answers
// without working for percent / trig / comparison pictures).
function specialSteps(qRaw: string, ans: string): string[] | null {
  const q = qRaw.replace(/\s+/g, " ").trim();
  let m: RegExpMatchArray | null;
  // Ratios — scale up
  m = q.match(/scale (\d+) : (\d+) by (\d+)/i);
  if (m) { const a = +m[1], b = +m[2], k = +m[3]; return [`Scaling up multiplies BOTH parts of the ratio by ${k}.`, `${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k}.`, `Answer: ${a * k} : ${b * k}.`]; }
  // Ratios — missing second / first part
  m = q.match(/(\d+) : (\d+) = (\d+) : ___/);
  if (m) {
    const a = +m[1], b = +m[2], c = +m[3];
    if (c % a === 0) { const k = c / a; return [`The first parts show the scale: ${a} became ${c}, that is × ${k}.`, `Do the same to the second part: ${b} × ${k} = ${b * k}.`, `Answer: ${b * k}.`]; }
    if (a % c === 0) { const k = a / c; return [`The first parts show the scale: ${a} became ${c}, that is ÷ ${k}.`, `Do the same to the second part: ${b} ÷ ${k} = ${b / k}.`, `Answer: ${b / k}.`]; }
  }
  m = q.match(/(\d+) : (\d+) = ___ : (\d+)/);
  if (m) {
    const a = +m[1], b = +m[2], d = +m[3];
    if (d % b === 0) { const k = d / b; return [`The second parts show the scale: ${b} became ${d}, that is × ${k}.`, `Do the same to the first part: ${a} × ${k} = ${a * k}.`, `Answer: ${a * k}.`]; }
    if (b % d === 0) { const k = b / d; return [`The second parts show the scale: ${b} became ${d}, that is ÷ ${k}.`, `Do the same to the first part: ${a} ÷ ${k} = ${a / k}.`, `Answer: ${a / k}.`]; }
  }
  // Percent of a number — the 10% method the unit teaches
  m = q.match(/^(\d+)% of (\d+)\s*=?\s*$/);
  if (m) {
    const p = +m[1], n = +m[2];
    const fmt = (x: number) => String(Math.round(x * 100) / 100);
    const ten = n / 10;
    if (p === 50) return [`50% is one half.`, `${n} ÷ 2 = ${fmt(n / 2)}.`, `Answer: ${ans}.`];
    if (p === 25) return [`25% is one quarter.`, `${n} ÷ 4 = ${fmt(n / 4)}.`, `Answer: ${ans}.`];
    if (p === 75) return [`75% is three quarters: find one quarter first.`, `${n} ÷ 4 = ${fmt(n / 4)}, then 3 × ${fmt(n / 4)} = ${fmt(3 * n / 4)}.`, `Answer: ${ans}.`];
    if (p === 10) return [`10% is one tenth.`, `${n} ÷ 10 = ${fmt(ten)}.`, `Answer: ${ans}.`];
    if (p === 5) return [`Find 10% first: ${n} ÷ 10 = ${fmt(ten)}.`, `5% is half of 10%: ${fmt(ten)} ÷ 2 = ${fmt(ten / 2)}.`, `Answer: ${ans}.`];
    if (p % 10 === 0) return [`Find 10% first: ${n} ÷ 10 = ${fmt(ten)}.`, `${p}% is ${p / 10} lots of 10%: ${p / 10} × ${fmt(ten)} = ${fmt(p / 10 * ten)}.`, `Answer: ${ans}.`];
    if (p % 5 === 0) return [`Find 10% first: ${n} ÷ 10 = ${fmt(ten)}, so 5% is ${fmt(ten / 2)}.`, `${p}% is ${Math.floor(p / 10)} lots of 10% plus one 5%: ${Math.floor(p / 10)} × ${fmt(ten)} + ${fmt(ten / 2)} = ${fmt(p / 100 * n)}.`, `Answer: ${ans}.`];
    return [`${p}% means ${p} out of 100: ${p}/100 = ${fmt(p / 100)}.`, `${fmt(p / 100)} × ${n} = ${fmt(p / 100 * n)}.`, `Answer: ${ans}.`];
  }
  // Decimal ÷ whole number — divide as whole numbers, keep the decimal places
  m = q.match(/^(\d+\.\d+) ÷ (\d+)\s*=?\s*$/);
  if (m) {
    const dec = m[1], b = +m[2];
    const dp = dec.split(".")[1].length;
    const whole = parseInt(dec.replace(".", ""), 10);
    if (whole % b === 0) return [
      `Divide as whole numbers: ${whole} ÷ ${b} = ${whole / b}.`,
      `${dec} has ${dp} decimal place${dp === 1 ? "" : "s"}, so the answer keeps ${dp}: ${ans}.`,
      `Check: ${ans} × ${b} = ${dec}.`,
    ];
  }
  // Linear — ax = x + c (coefficient-1 artefacts suppressed)
  m = q.match(/^(?:Solve for x:\s*)?(\d*)x = x \+ (\d+)$/);
  if (m) {
    const a = m[1] === "" ? 1 : +m[1], c = +m[2], k = a - 1;
    if (k === 1) return [`x is on both sides. Subtract x from BOTH sides so x is on one side only: 2x − x = x, so x = ${c}.`, `Check: 2 × ${c} = ${2 * c} and ${c} + ${c} = ${2 * c} ✓`];
    if (k > 1 && c % k === 0) return [`x is on both sides. Subtract x from BOTH sides: ${a}x − x = ${k}x, so ${k}x = ${c}.`, `Divide BOTH sides by ${k}: x = ${c} ÷ ${k} = ${c / k}.`, `Check: ${a} × ${c / k} = ${a * (c / k)} and ${c / k} + ${c} = ${c / k + c} ✓`];
  }
  // Linear — ax + b = cx + d
  m = q.match(/^(?:Solve for x:\s*)?(\d*)x \+ (\d+) = (\d*)x \+ (\d+)$/);
  if (m) {
    const a = m[1] === "" ? 1 : +m[1], b = +m[2], c = m[3] === "" ? 1 : +m[3], d = +m[4];
    const hi = Math.max(a, c), lo = Math.min(a, c), k = hi - lo;
    const bigB = a >= c ? b : d, smallB = a >= c ? d : b; // constants on the side with the bigger / smaller x-term
    const rhs = smallB - bigB;
    if (k > 0 && rhs % k === 0) {
      const x = rhs / k;
      const lx = lo === 1 ? "x" : `${lo}x`, kx = k === 1 ? "x" : `${k}x`;
      return [
        `x is on both sides. Subtract the smaller x-term (${lx}) from BOTH sides: ${kx} + ${bigB} = ${smallB}.`,
        `Subtract ${bigB} from BOTH sides: ${kx} = ${smallB} − ${bigB} = ${rhs}.`,
        k === 1 ? `So x = ${x}.` : `Divide BOTH sides by ${k}: x = ${rhs} ÷ ${k} = ${x}.`,
        `Check: ${a} × ${x} + ${b} = ${a * x + b} and ${c} × ${x} + ${d} = ${c * x + d} ✓`,
      ];
    }
  }
  // Trig — find a side from a ratio
  m = q.match(/^(sin|cos|tan) θ = (\d+)\/(\d+)\. The (hypotenuse|adjacent side|opposite side|side adjacent to θ|side opposite θ) is (\d+)\. Find the (side opposite θ|side adjacent to θ|hypotenuse)/i);
  if (m) {
    const fn = m[1].toLowerCase(), p = +m[2], qd = +m[3], known = +m[5];
    const def = fn === "sin" ? "opposite / hypotenuse" : fn === "cos" ? "adjacent / hypotenuse" : "opposite / adjacent";
    const [topName, botName] = def.split(" / ");
    const knownIsBottom = new RegExp(botName, "i").test(m[4]);
    const want = m[6].replace(/side (opposite|adjacent)( to)? θ/i, "$1").toLowerCase();
    if (knownIsBottom && known % qd === 0) { const k = known / qd; return [`${fn} θ = ${def}, so ${topName} / ${known} = ${p}/${qd}.`, `The bottom went from ${qd} to ${known}: ${known} ÷ ${qd} = ${k}, so multiply the top by ${k} too.`, `${want} = ${p} × ${k} = ${p * k}.`]; }
    if (!knownIsBottom && known % p === 0) { const k = known / p; return [`${fn} θ = ${def}, so ${known} / ${botName} = ${p}/${qd}.`, `The top went from ${p} to ${known}: ${known} ÷ ${p} = ${k}, so multiply the bottom by ${k} too.`, `${want} = ${qd} × ${k} = ${qd * k}.`]; }
  }
  // Fraction pictures — compare two strips, or read an equivalence off them
  m = q.match(/^\[\[viz cmp (\d+) (\d+) (\d+) (\d+)\]\]\s*(.*)$/);
  if (m) {
    const a = +m[1], b = +m[2], c = +m[3], d = +m[4], rest = m[5].trim();
    if (!rest) {
      const topBigger = a / b > c / d;
      const win = topBigger ? `${a}/${b}` : `${c}/${d}`;
      return [
        `Both strips are the same length, so they are the same whole.`,
        `Top strip: ${a} of ${b} equal parts shaded. Bottom strip: ${c} of ${d} equal parts shaded.`,
        a / b === c / d ? `The same amount is shaded on both — they are equal.` : `More of the strip is shaded on the ${topBigger ? "top" : "bottom"}, so ${win} is larger.`,
      ];
    }
    let e = rest.match(/\\frac\{(\d+)\}\{(\d+)\} = \\frac\{\?\}\{(\d+)\}/);
    if (e && +e[3] % +e[2] === 0) { const k = +e[3] / +e[2]; return [`The two bars shade the SAME amount — they are equivalent fractions.`, `Bottom: ${e[2]} became ${e[3]} — that is × ${k}.`, `Do the same on top: ${e[1]} × ${k} = ${+e[1] * k}.`]; }
    e = rest.match(/\\frac\{(\d+)\}\{(\d+)\} = \\frac\{(\d+)\}\{\?\}/);
    if (e && +e[3] % +e[1] === 0) { const k = +e[3] / +e[1]; return [`The two bars shade the SAME amount — they are equivalent fractions.`, `Top: ${e[1]} became ${e[3]} — that is × ${k}.`, `Do the same on the bottom: ${e[2]} × ${k} = ${+e[2] * k}.`]; }
  }
  return null;
}

// Is this problem an example of what THIS unit teaches? Auto-examples are
// drawn from on-topic items first (a ÷3 item never headlines the ÷6–9 page).
function onTopicFor(question: string, skill: string | undefined, label: string): boolean {
  const L = label.toLowerCase();
  const q = question.replace(/\s+/g, " ").replace(/\s*=\s*\?\s*$/, "").trim();
  const blank = q.includes("___");
  const two = (re: RegExp) => { const m = q.match(re); return m ? [+m[1], +m[2]] : null; };
  if (skill === "ADDITION") {
    const ab = two(/^(\d+) \+ (\d+)\s*=?$/);
    if (/missing|mixed/.test(L)) return true;
    if (/3-digit|three addends/.test(L)) return !ab || Math.max(...ab) >= 100 || /\+.*\+/.test(q);
    if (/2-digit/.test(L)) { if (!ab) return false; const [a, b] = ab; if (a < 10 || b < 10 || a > 99 || b > 99) return false; const carry = a % 10 + b % 10 >= 10; return /regroup/.test(L) && !/no regroup/.test(L) ? carry : !carry; }
    if (/fact famil/.test(L)) return blank;
    if (!ab) return false;
    const [a, b] = ab, sum = a + b, big = Math.max(a, b), small = Math.min(a, b);
    if (/counting on/.test(L)) return small >= 1 && small <= 3;
    if (/near/.test(L)) return Math.abs(a - b) === 1;
    if (/double/.test(L)) return a === b;
    if (/zero|turnaround/.test(L)) return small === 0 || a !== b;
    if (/make ten|bridg/.test(L)) return sum > 10 && Math.abs(a - b) > 1 && small >= 2 && big < 10;
    return true;
  }
  if (skill === "SUBTRACTION") {
    const ab = two(/^(\d+) [-−] (\d+)\s*=?$/);
    if (/missing|mixed/.test(L)) return true;
    if (/3-digit/.test(L)) return !!ab && ab[0] >= 100;
    if (/2-digit/.test(L)) { if (!ab) return false; const [a, b] = ab; if (a < 10 || a > 99) return false; const borrow = a % 10 < b % 10; return /no borrow/.test(L) ? !borrow : (borrow && a >= 20); }
    if (/fact famil/.test(L)) return blank;
    if (!ab) return false;
    const [a, b] = ab;
    if (/counting back/.test(L)) return b >= 1 && b <= 3;
    if (/subtract 0|subtract all/.test(L)) return b === 0 || a === b;
    if (/count up|difference/.test(L)) return b >= 1 && a !== b && a <= 20;
    if (/halv|double/.test(L)) return b >= 2 && Math.abs(a - 2 * b) <= 2;
    if (/bridg/.test(L)) return a > 10 && a < 20 && b > a - 10 && b < 10;
    return true;
  }
  if (skill === "MULTIPLICATION") {
    const ab = two(/^(\d+) [×x] (\d+)\s*=?$/);
    const trivial = !!ab && (ab[0] <= 1 || ab[1] <= 1);
    if (/×1 and ×0|×0/.test(L)) return trivial;
    if (/fact famil|missing/.test(L)) return blank;
    if (/mixed/.test(L)) return !trivial;
    if (/square/.test(L)) return !!ab && ab[0] === ab[1] && ab[0] >= 3 && ab[0] !== 10;
    if (/tens/.test(L)) return /\d0 [×x] \d\b|\bso\b/.test(q);
    if (/2-digit × 2-digit/.test(L)) return !!ab && ab[0] >= 10 && ab[1] >= 10;
    if (/2-digit × 1-digit|carrying|break apart/.test(L)) return !ab || (Math.max(...ab) >= 10 && Math.min(...ab) < 10);
    const fs = unitFactors(label, "×");
    if (fs.length && ab) return !trivial && fs.some((f) => ab[0] === f || ab[1] === f);
    return !trivial;
  }
  if (skill === "DIVISION") {
    const ab = two(/^(\d+) ÷ (\d+)\s*=?$/);
    const trivial = !!ab && (ab[1] === 1 || ab[0] === ab[1]);
    if (/÷1|itself/.test(L)) return trivial;
    if (/fact famil|missing/.test(L)) return blank;
    if (/mixed/.test(L)) return !trivial;
    if (/square/.test(L)) return !!ab && ab[0] === ab[1] * ab[1] && ab[1] >= 3;
    if (/remainder/.test(L)) return !!ab && ab[0] % ab[1] !== 0;
    if (/2-digit|3-digit/.test(L)) return !!ab && Math.floor(ab[0] / ab[1]) >= 10;
    const fs = unitFactors(label, "÷");
    if (fs.length && ab) return !trivial && fs.includes(ab[1]);
    return !trivial;
  }
  return true;
}

// Dedupe key: the same problem however it is worded ("Divide the fractions:
// 1/2 ÷ 2/3" = "1/2 ÷ 2/3"; "3 + 4" = "4 + 3"; "Find the degree of P." = "… P").
function canonicalKey(question: string): string {
  let q = question.replace(/\s+/g, " ").replace(/\s*=\s*\??\s*$/, "").replace(/\.\s*$/, "").trim();
  q = q.replace(/^[^:]{0,60}:\s*/, "").replace(/^(Find the degree of|Is this a polynomial\?|Expand|Simplify|Factor|Solve|Divide|Multiply)\s+/i, "");
  const m = q.match(/^(\d+) ([+×x]) (\d+)$/);
  if (m) { const [a, b] = [+m[1], +m[3]].sort((x, y) => x - y); q = `${a} ${m[2] === "+" ? "+" : "×"} ${b}`; }
  return q.toLowerCase().replace(/[\s.]/g, "");
}

// Answers for plotting tasks are stored as "m,b" / "x,y" — never print those raw.
function displayPlotAnswer(problem: string, answer: string): string {
  const sol = parsePlotSolution(problem, answer);
  if (!sol) return answer;
  if (sol.line) return `slope ${sol.line.m}, y-intercept ${sol.line.b} — through (0, ${sol.line.b}) and (1, ${sol.line.m + sol.line.b})`;
  if (sol.point) {
    const pts = [...problem.replace(/−/g, "-").matchAll(/\((-?\d+),\s*(-?\d+)\)/g)].map((m) => `(${m[1]}, ${m[2]})`);
    if (/^Plot the point/i.test(problem) && pts.length > 1) return pts.join(" and ");
    return `(${sol.point[0]}, ${sol.point[1]})`;
  }
  if (sol.points) return sol.points.map(([x, y]) => `(${x}, ${y})`).join(", ");
  if (sol.parab) return `vertex (${sol.parab.h}, ${sol.parab.k})`;
  return answer;
}

// The curated unit example (best, hand-written steps) plus several more worked
// from the sheet's own problems via the fact-strategy / column / scaffold
// templates, so a new skill opens with 4 fully-explained examples.
//
// RULES (from the pack review of all 128 unit boundaries):
//  • curated steps WIN whenever they have ≥ 2 real steps; generated steps only
//    fill in for terse ones (poly-steps used to overwrite a correct long-division
//    example with a factor-and-cancel method the unit never taught);
//  • a basic fact gets a fact strategy, never a column/carry/borrow/bring-down
//    walk; a 2-digit multiplier gets partial products, never the 1-digit
//    algorithm with "14" as a digit;
//  • auto-examples are chosen ON TOPIC for the unit, one per distinct case,
//    never repeating the curated example or each other, in sheet order;
//  • every step is print-fit (no type/click/select, no "picture" that isn't
//    drawn, no broken count lists) and no raw "m,b" answer is ever printed.
/** A directive is written for the screen, where a list of choices may be
 *  shown. On paper there is never a list — the print path strips options and
 *  rewrites "Select all the factors" items to bare expressions — so the
 *  directive must not tell a child to select from one. (Pack audit, Sep 2026:
 *  Polynomials sheet 75 printed "Where a list is shown, select exactly the two
 *  factors; otherwise write them as…".) */
export function printDirective(directive: string): string {
  return directive
    .replace(/\s*Where a list is shown,\s*select exactly the two factors;\s*otherwise\s*(\w)/i, (_m, c: string) => ` ${c.toUpperCase()}`)
    .replace(/\b(select|click|tap|drag)\b[^.;]*[.;]?\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function buildExamples(sheet: WorksheetData): WorkedExample[] {
  const { workedExample, problems } = sheet;
  const out: WorkedExample[] = [];
  const seen = new Set<string>();
  const directive = sheet.meta.directive;
  const skill = sheet.meta.skill as string | undefined;
  const label = sheet.meta.subSkillLabel ?? "";
  const unit: FactUnit = { label, directive, objective: sheet.meta.learningObjective };

  const stepsFor = (qIn: string, ans: string): string[] => {
    const q = qIn.replace(/\s*→.*$/, "").trim(); // print-only "→ ___, ___" suffix
    const fact = factSteps(q, unit);
    if (fact) return fact;
    const col = parseColumnar(q);
    if (col) {
      const a = +col.top, b = +col.bottom;
      // Digit-by-digit column steps assume INTEGERS — feeding decimals produced
      // "Hundreds: NaN + NaN = NaN" on the Decimals lesson pages. Decimal
      // operands get decimal-appropriate steps instead.
      if (Number.isInteger(a) && Number.isInteger(b)) {
        if (col.op === "×") {
          const tens = tensMultiplySteps(a, b);
          if (tens) return tens;
          if (a >= 10 && b >= 10) return partialProductSteps(a, b);
          if (b >= 10 && a < 10) return workedArithmeticSteps(b, "×", a); // 1-digit × 2-digit: the column method wants the 1-digit multiplier underneath
        }
        return workedArithmeticSteps(a, col.op, b);
      }
      const dp = Math.max((col.top.split(".")[1] ?? "").length, (col.bottom.split(".")[1] ?? "").length);
      const s0 = Math.pow(10, dp);
      const ai = Math.round(a * s0), bi = Math.round(b * s0);
      const unitName = dp === 1 ? "tenths" : dp === 2 ? "hundredths" : `parts of 1/${s0}`;
      if (col.op === "×") {
        return [`Multiply as whole numbers: ${ai} × ${bi} = ${ai * bi}.`, `Count the decimal places in both numbers and place the point.`, `Answer: ${ans}.`];
      }
      const opW = col.op === "+" ? "Add" : "Subtract";
      return [
        `Line up the decimal points.`,
        `${opW} in ${unitName}: ${ai} ${col.op === "+" ? "+" : "−"} ${bi} = ${col.op === "+" ? ai + bi : ai - bi}.`,
        `Put the decimal point back: ${ans}.`,
      ];
    }
    const div = parseLongDivision(q);
    // Digit-walk long division only for real multi-digit division — facts and
    // 1-digit-quotient remainders were handled by factSteps above.
    if (div && +div.dividend >= 10 && +div.divisor >= 2) return workedDivisionSteps(+div.dividend, +div.divisor);
    const special = specialSteps(q, ans);
    if (special) return special;
    const poly = polyWorkedSteps(q, ans);
    if (poly) return poly;
    const plot = parsePlotSolution(q, ans);
    if (plot?.line) {
      const { m, b } = plot.line;
      return [`The number on its own is the y-intercept: ${b} → first point (0, ${b}).`, `The number in front of x is the slope: ${m} → from (0, ${b}) go ${m >= 0 ? "up" : "down"} ${Math.abs(m)} and right 1 → second point (1, ${m + b}).`, `Draw the straight line through the two points.`];
    }
    if (plot?.point) {
      // Transformation examples must STATE THE RULE first — "go left 4, down 2"
      // alone doesn't teach WHY the image lands there.
      let rule = "";
      if (/across the x-axis/i.test(q)) rule = `Reflecting across the x-axis keeps x and flips the sign of y.`;
      else if (/across the y-axis/i.test(q)) rule = `Reflecting across the y-axis keeps y and flips the sign of x.`;
      else if (/Translate/i.test(q)) rule = `Translating slides the point: add the shift to each coordinate.`;
      else if (/Rotate/i.test(q)) rule = `Rotating 90° counter-clockwise sends (x, y) to (−y, x).`;
      const walk = [
        `Start at the origin (0, 0).`,
        `Go ${plot.point[0] >= 0 ? "right" : "left"} ${Math.abs(plot.point[0])}, then ${plot.point[1] >= 0 ? "up" : "down"} ${Math.abs(plot.point[1])}.`,
        `Mark the point (${plot.point[0]}, ${plot.point[1]}).`,
      ];
      return rule ? [rule, `The image lands at (${plot.point[0]}, ${plot.point[1]}).`, ...walk.slice(1)] : walk;
    }
    if (plot?.points) return [`Plot each vertex: ${plot.points.map(([x, y]) => `(${x}, ${y})`).join(", ")}.`, `Connect them in order to form the triangle.`];
    if (plot?.angleDeg !== undefined) return [`Start at the positive x-axis (0°).`, `Turn ${plot.angleDeg}° counter-clockwise.`, `Mark the point where the radius meets the circle.`];
    if (plot?.parab) return [`The parabola's vertex (turning point) is at (${plot.parab.h}, ${plot.parab.k}).`, `It opens ${plot.parab.a >= 0 ? "upward" : "downward"}.`, `Draw the U-shape symmetric about x = ${plot.parab.h}.`];
    // Three angles on a straight line, written as text: "50° + 65° + x = 180°".
    // No [[viz]] marker, so no figure template matches; without this the page
    // printed one usable example (pack audit, Sep 2026).
    const line3 = q.match(/^(\d+)°\s*\+\s*(\d+)°\s*\+\s*x\s*=\s*180°$/);
    if (line3) {
      const p = +line3[1], r = +line3[2];
      return ["The angles on a straight line add to 180°.", `Add the two known angles: ${p} + ${r} = ${p + r}.`, `x = 180 − ${p + r} = ${ans}.`];
    }
    const vza = parseViz(q);
    if (vza && isFigureKind(vza.viz.kind)) {
      const k = vza.viz.kind, [m, m2] = vza.viz.nums;
      if (k === "angcross") return [
        "Two crossing lines make an X — the angles OPPOSITE each other are called vertical angles.",
        `Vertical angles are always EQUAL, so the missing angle matches the marked ${m}°.`,
        `Answer: ${ans}.`,
      ];
      if (k === "angright") return ["Complementary angles add to 90°.", `90 − ${m} = ${ans}.`];
      if (k === "angline") return ["The angles add to 180°.", `180 − ${m} = ${ans}.`];
      if (k === "angtri") return ["A triangle's angles add to 180°.", `${m} + ${m2} = ${m + m2}`, `180 − ${m + m2} = ${ans}.`];
      const perim = /perimeter/i.test(directive ?? "");
      if (k === "geomrect") return perim ? ["P = 2 × (l + w)", `2 × (${m} + ${m2}) = ${ans}.`] : ["A = l × w", `${m} × ${m2} = ${ans}.`];
      if (k === "geomsquare") return perim ? ["P = 4 × side", `4 × ${m} = ${ans}.`] : ["A = side × side", `${m} × ${m} = ${ans}.`];
      if (k === "geomtri") return ["A = ½ × base × height", `½ × ${m} × ${m2} = ${ans}.`];
      if (k === "geomcircle") return /area/i.test(q) ? ["A = π r²", `3.14 × ${m} × ${m} = ${ans}.`] : ["C = 2 π r", `2 × 3.14 × ${m} = ${ans}.`];
      if (k === "geomright") {
        const [h, v, hyp, theta] = vza.viz.nums;
        if (theta === 1) {  // trig ratio: opp = vertical leg, adj = horizontal leg
          if (/sin/.test(q)) return ["sin θ = opposite / hypotenuse", `= ${v} / ${hyp} = ${ans}.`];
          if (/cos/.test(q)) return ["cos θ = adjacent / hypotenuse", `= ${h} / ${hyp} = ${ans}.`];
          if (/tan/.test(q)) return ["tan θ = opposite / adjacent", `= ${v} / ${h} = ${ans}.`];
        }
        if (hyp === 0) return ["a² + b² = c²", `${h}² + ${v}² = ${h * h + v * v}`, `c = √${h * h + v * v} = ${ans}.`];
        return ["a² = c² − b²", `${hyp}² − ${v}² = ${hyp * hyp - v * v}`, `a = √${hyp * hyp - v * v} = ${ans}.`];
      }
    }
    // subjectSlug MATH is load-bearing: several rich math handlers are gated on
    // it — without it, ×0 / ÷ facts fell through to bland one-liners in PDFs.
    return buildScaffold(q, ans, "", { subjectSlug: "MATH", directive }).hints;
  };

  const finish = (problem: string, steps: string[], answer: string): WorkedExample => ({
    problem,
    steps: cleanStepsForPrint(steps, skill),
    answer: displayPlotAnswer(problem, answer),
  });

  if (workedExample) {
    // Curated steps win. Only a TOO-TERSE curated example (fewer than 2 real
    // steps) is replaced by the generated full walkthrough, and only when that
    // walkthrough is itself a real method.
    const curated = (workedExample.steps ?? []).filter((s) => s && s.trim());
    const generated = curated.length < 2 ? stepsFor(workedExample.problem, workedExample.answer) : null;
    const richer = !!generated && generated.length >= 2 && !/^The correct answer/.test(generated[0]);
    out.push(finish(workedExample.problem, richer ? generated! : curated, workedExample.answer));
    seen.add(canonicalKey(workedExample.problem));
  }

  // Cap at 4 examples. Cards are 48% wide (2 per row), so 4 fills a clean 2×2
  // grid. A 5th card wraps to a lone third row that collides with the fixed
  // footer and drops its content — the empty "Example 5" bug. Keep it to 4.
  const TARGET = 4;
  type Cand = { problem: string; steps: string[]; answer: string; sig: string };
  const build = (p: WorksheetProblem): Cand | null => {
    const key = canonicalKey(p.question);
    if (seen.has(key)) return null;
    const ans = String((p as any).answer ?? "");
    let steps = stepsFor(p.question, ans);
    // Never show a step-less example — a lone "the correct answer is X" teaches
    // nothing to a first-time learner. The same goes for the on-screen
    // multiple-choice fallback ("Rule out any choices…"): the printed page has
    // no choices to rule out, so that text is not a method here either.
    const teaches = steps.filter((s) => !/^The correct answer/.test(s) && !/^Rule out any choices/i.test(s));
    if (teaches.length === 0) return null;
    steps = teaches;
    const qShown = p.question.replace(/\s*=\s*\?\s*$/, "").replace(/\s*→.*$/, "").trim();
    // Append "=" only to bare expressions, not to visual or instruction prompts.
    const append = !parseViz(qShown) && !qShown.includes("=") && /^[\d(]/.test(qShown) && !/[.?]$/.test(qShown);
    // Case signature: the step template with the numbers removed, plus the
    // column-case flags a child must see separately (ones summing to exactly
    // 10; a minuend ending in 0; a 1-digit subtrahend; an addend ending in 0).
    let sig = steps.map((s) => s.replace(/-?\d+(\.\d+)?/g, "N")).join("|");
    const col = parseColumnar(qShown);
    if (col && Number.isInteger(+col.top) && Number.isInteger(+col.bottom)) {
      const a = +col.top, b = +col.bottom;
      if (col.op === "+" && a % 10 + b % 10 === 10) sig += "|ones10";
      if (col.op === "+" && (a % 10 === 0 || b % 10 === 0)) sig += "|addend0";
      if (col.op === "−" && a % 10 === 0) sig += "|top0";
      if (col.op === "−" && b < 10) sig += "|1digit";
    }
    return { problem: append ? `${qShown} =` : qShown, steps, answer: ans, sig };
  };

  const topical = problems.filter((p) => onTopicFor(p.question, skill, label));
  const pool = topical.length >= 1 ? topical : problems;
  // One example per distinct case, in sheet order (easy → hard), then a second
  // of each case if slots remain; never the same problem twice.
  const groups = new Map<string, Cand[]>();
  for (const p of pool) {
    const c = build(p);
    if (!c) continue;
    if (seen.has(canonicalKey(c.problem))) continue;
    seen.add(canonicalKey(c.problem));
    const g = groups.get(c.sig) ?? [];
    g.push(c); groups.set(c.sig, g);
  }
  const order = [...groups.values()];
  for (let round = 0; out.length < TARGET; round++) {
    let added = false;
    for (const g of order) {
      if (out.length >= TARGET) break;
      const c = g[round];
      if (!c) continue;
      out.push(finish(c.problem, c.steps, c.answer));
      added = true;
    }
    if (!added) break;
  }
  return out.slice(0, TARGET);
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
    LINEAR_EQUATIONS: "slope-intercept", POLYNOMIALS: "combine like terms",
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
        <Text style={s.objectiveLabel}>Goal:</Text>
        <Text style={s.objectiveText}>{meta.learningObjective}.</Text>
      </View>

      {bigIdea ? (
        <View style={s.bigIdeaBox}>
          <Text style={s.bigIdeaLabel}>Big Idea</Text>
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

      <Text style={s.lessonTitle}>Worked Examples — study these before you practise</Text>

      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" }}>
        {examples.map((ex, i) => {
          // Column-method skills (multi-digit + − ×) and division DEMONSTRATE
          // their stacked/bracket layout with the answer filled in; everything
          // else shows horizontally.
          const exViz = parseViz(ex.problem);
          const exStack = exViz ? null : parseColumnar(ex.problem);
          const exDiv = exViz || exStack ? null : parseLongDivision(ex.problem);
          // Plotting example → draw the SOLVED coordinate grid so a "Plot the
          // line/point …" worked example actually shows the plotted graph.
          const exPlot = !exViz && !exStack && !exDiv ? parsePlotSolution(ex.problem, ex.answer) : null;
          // Grid size shrinks when several examples carry plots, so a 2×2 card
          // grid always fits ONE page (4 × 104px grids overflowed — the second
          // row of cards bled onto the next page with orphaned steps).
          const plotCount = examples.filter((e2) => parsePlotSolution(e2.problem, e2.answer)).length;
          const gridPx = plotCount >= 3 ? 74 : plotCount === 2 ? 88 : 104;
          return (
            // wrap={false}: never split a card across pages — if space runs out
            // the WHOLE card moves to the next page instead of orphaning steps.
            <View key={i} style={s.lessonCard} wrap={false}>
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
                {!exViz && !exStack && !exDiv && !exPlot ? <ExampleViz problem={ex.problem} /> : null}
              </View>
              {exPlot ? (
                <View style={{ alignItems: "center", marginBottom: 4 }}>
                  {exPlot.angleDeg !== undefined
                    ? <PdfUnitCircle size={gridPx} markDeg={exPlot.angleDeg} />
                    : <PdfCoordGrid spec={{ xRange: [-7, 7], yRange: [-7, 7], line: exPlot.line, point: exPlot.point, points: exPlot.points, parab: exPlot.parab }} size={gridPx} />}
                </View>
              ) : null}
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
  const { meta } = sheet;
  // Strip the M12 per-line instruction NOW (not just at render) so the column
  // count and width are measured from the SHORT bare expression the student
  // actually sees — otherwise "What is the leading coefficient of …?" measures
  // long and collapses the sheet to a single wasteful column. sheet.problems
  // stays full for the worked-example builder.
  let problems = sheet.problems.map((p) => ({ ...p, question: m12DisplayPrompt(meta, p.question) }));
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
  // Graphing sheets (plot/line/equation-builder/transform) need a big labelled
  // coordinate grid per problem, so cap to a few per page and use the roomy card
  // layout (the adaptive count is width-based and doesn't know about grid height).
  const coordSheet = problems.length > 0 && problems.filter(isCoordInteractive).length >= problems.length * 0.5;
  if (coordSheet) problems = problems.slice(0, 6);

  const vizCount = problems.filter(p => parseViz(p.question) || isCoordInteractive(p)).length;
  const isVisualSheet = coordSheet || (problems.length <= 12 && vizCount >= problems.length * 0.6);

  // Per-sheet layout mode: if ANY problem is genuinely multi-digit, this is a
  // "stacked sheet" — then EVERY stackable problem stacks (threshold 1), so a
  // single-digit spiral-review item doesn't render flat and mix layouts. On a
  // pure single-digit sheet nothing qualifies, so everything stays flat.
  const stackedSheet = problems.some(p => !parseViz(p.question) && parseStack(p.question, 2) !== null);
  const stackMin = stackedSheet ? 1 : 2;

  const cols   = layout.columns;
  // Trim to a whole multiple of the column count so every column has the SAME
  // number of rows — otherwise a leftover (e.g. 31 → 11/11/9) leaves a short,
  // misaligned last column. The adaptive page-fill count can be any value and
  // T/F stripping (non-math) shifts it further, so normalise here.
  if (!isVisualSheet && problems.length >= cols) {
    problems = problems.slice(0, Math.floor(problems.length / cols) * cols);
  }
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
          <Text style={[s.objectiveText, { fontFamily: "BodySans-Bold" }]}>{printDirective(meta.directive)}</Text>
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
            // Graphing item: question on top, a labelled coordinate grid below.
            if (isCoordInteractive(p)) {
              const gridSize = rows <= 2 ? 130 : rows === 3 ? 104 : 78;
              return (
                <View key={p.id} style={{ width:"50%", paddingVertical:6, paddingHorizontal:8 }}>
                  <View style={{ flexDirection:"row", marginBottom:3 }}>
                    <Text style={s.probNum}>{idx + 1}.</Text>
                    <View style={{ flex:1, paddingLeft:2 }}><PdfMathText text={p.question} fontSize={9} /></View>
                  </View>
                  <PdfCoordGrid spec={p.interactive} size={gridSize} />
                </View>
              );
            }
            // Trig "angle" item: reword the drag prompt and draw a unit circle to
            // mark by hand (the web version drags a point around the circle).
            if ((p as any).interactive?.kind === "angle-drag") {
              const dia = rows <= 2 ? 130 : rows === 3 ? 104 : 78;
              const printQ = String(p.question).replace(/^Drag the point around the circle so /i, "Mark the point on the unit circle where ").replace(/\.$/, ".");
              return (
                <View key={p.id} style={{ width:"50%", paddingVertical:6, paddingHorizontal:8 }}>
                  <View style={{ flexDirection:"row", marginBottom:3 }}>
                    <Text style={s.probNum}>{idx + 1}.</Text>
                    <View style={{ flex:1, paddingLeft:2 }}><PdfMathText text={printQ} fontSize={9} /></View>
                  </View>
                  <PdfUnitCircle size={dia} />
                </View>
              );
            }
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
                // Multi-digit +, −, × (incl. missing-operand equations and 3-addend)
                // render as a vertical stack — every answer slot lands in the same
                // aligned column. Single-digit facts and everything else stay flat.
                const st = vz ? null : parseStack(p.question, stackMin);
                const ld = vz || st ? null : parseLongDivision(p.question);
                // Flat problems: put the answer slot INLINE right after "=" so a
                // computed answer ("3 + 4 = __") sits in the same reading position as
                // a fill-in blank ("9 + __ = 11") — no answer line floating far right.
                // Strip the M12 per-line instruction for display (the directive
                // states it once at the top); non-M12 questions pass through.
                const _q = vz ? "" : m12DisplayPrompt(meta, p.question).replace(/=\s*\?\s*$/, "=").trim();
                const hasInlineBlank = _q.includes("___");
                // Append "=" only to bare arithmetic (e.g. "3 + 4"); NOT to
                // sentence/instruction prompts, division (÷), or anything already
                // ending in a period — those get a right-aligned fill-in line.
                // M12 prompts are identify/classify/expand tasks, never "solve for
                // =", so never append "=" there (it wrongly implied evaluation on
                // e.g. "5x³ + x + 7 =" for a leading-coefficient sheet).
                const isM12row = meta.skill === "POLYNOMIALS" || meta.skillCode === "M12";
                const appendEq = !vz && !isM12row && /^[\dx(]/i.test(_q) && !_q.includes("=") && !_q.includes("÷") && !/[.?]\s*$/.test(_q);
                const shownFlat = appendEq ? `${_q} =` : _q;
                // Long instruction-style prompts (the M12 foundation/division
                // units) must push their answer line to the RIGHT edge so it can't
                // overstrike the last term of the prompt.
                // Every M12 answer line right-aligns to the column edge so they
                // form one clean vertical column regardless of prompt length
                // (bare polynomials vary in width). Non-M12 keeps its inline slot.
                const rightAlignLine = !vz && !hasInlineBlank && isM12row;
                return (
                  <View key={p.id} style={[s.problemRow, (st || ld) ? { alignItems:"flex-start", paddingTop:2 } : null] as any}>
                    <Text style={s.probNum}>{idx + 1}.</Text>
                    {st ? (
                      <View style={{ flex:1, flexDirection:"row", paddingLeft:8 }}>
                        <PdfStack st={st} fontSize={layout.fontSizePt} />
                      </View>
                    ) : ld ? (
                      <View style={{ flex:1, flexDirection:"row", paddingLeft:8 }}>
                        <PdfLongDivision d={ld} fontSize={layout.fontSizePt} />
                      </View>
                    ) : (
                      <View style={{ flex:1, flexDirection:"row", alignItems:"center" }}>
                        {vz ? (
                          <View style={{ marginRight:6 }}><VizShape viz={vz.viz} size={28} /></View>
                        ) : null}
                        <PdfMathText
                          text={vz ? vz.text : shownFlat}
                          fontSize={layout.fontSizePt}
                        />
                        {/* computed answers get an inline slot right after "="; fill-in
                            blanks already carry their slot in the text; viz gets a line. */}
                        {vz ? (
                          <View style={{ marginLeft:"auto", paddingLeft:6 }}><AnswerLine /></View>
                        ) : !hasInlineBlank ? (
                          <View style={{ marginLeft: rightAlignLine ? "auto" : undefined, paddingLeft:6 }}><AnswerLine /></View>
                        ) : null}
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

// ── Contents page (first page of multi-unit packs) ───────────────────────────
// Lists every topic the pack covers with its grade and sheet range, so the
// buyer sees the full curriculum at a glance before the lessons start.
function ContentsPage({ skillLabel, skillCode, units, totalSheets, withAnswerKey }: {
  skillLabel: string; skillCode: string;
  units: { label: string; grade: string; from: number; to: number }[];
  totalSheets: number; withAnswerKey: boolean;
}) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.headerBar}>
        <View>
          <Text style={s.headerOrg}>Eduyro Education · eduyro.com</Text>
          <Text style={s.headerTitle}>{skillLabel}</Text>
          <Text style={s.headerSub}>{totalSheets} practice sheets · every topic opens with a lesson page{withAnswerKey ? " · answer keys included" : ""}</Text>
        </View>
        <View style={s.headerBadge}>
          <Text style={s.badgeCode}>{skillCode}</Text>
          <Text style={s.badgeGrade}>Contents</Text>
        </View>
      </View>

      <Text style={[s.lessonTitle, { marginTop: 10 }]}>What this pack covers</Text>
      <View style={{ marginTop: 4 }}>
        {units.map((u, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 5.5, borderBottomWidth: 0.5, borderBottomColor: "#EDE6D8" }}>
            <Text style={{ fontSize: 9, fontFamily: "BodySans-Bold", color: C.ink, width: 22 }}>{i + 1}.</Text>
            <Text style={{ fontSize: 9.5, fontFamily: "BodySans-Bold", color: C.ink, flex: 1 }}>{u.label}</Text>
            <Text style={{ fontSize: 8, color: C.grey4, width: 84 }}>{u.grade}</Text>
            <Text style={{ fontSize: 8, color: C.grey4, width: 96, textAlign: "right" }}>
              {u.from === u.to ? `Sheet ${u.from}` : `Sheets ${u.from}–${u.to}`}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 14, backgroundColor: "#FBF4E4", borderLeftWidth: 2, borderLeftColor: C.gold, paddingHorizontal: 10, paddingVertical: 7 }}>
        <Text style={{ fontSize: 8.5, color: C.ink, lineHeight: 1.4 }}>
          How to use this pack: work in order — each topic starts with a lesson page (Goal, Big Idea, Key Ideas and worked examples) followed by its practice sheets. One sheet a day builds mastery without overwhelm.{withAnswerKey ? " The full answer key is at the back." : ""}
        </Text>
      </View>

      <View style={s.footer} fixed>
        <Text style={s.footerText}>{skillCode} · {skillLabel} · Eduyro</Text>
        <Text style={{ ...s.footerText, fontStyle: "italic" }}>For personal and household use only. © {new Date().getFullYear()} Eduyro Education Inc.</Text>
        <Text style={s.footerText}>Contents</Text>
      </View>
    </Page>
  );
}

export async function renderPackToPdf(input: PdfPackInput): Promise<Uint8Array> {
  const date = new Date().toLocaleDateString("en-CA");

  // Single choke point: strip true/false items from EVERY printed/PDF worksheet
  // (parent daily, vacation pack, and shop packs all render through here). They
  // print poorly on paper; interactive practice keeps them. Guarantees no PDF can
  // contain true/false regardless of which route or stored packet produced it.
  const isTF = (q: unknown) => /\btrue\s*(?:or|\/)\s*false\b/i.test(String(q ?? ""));

  // Some interactive polynomial items (M12) rely on on-screen scaffolding that
  // has no static-print equivalent: the area-model needs a drawn 2×2 grid, and
  // "Select all the factors" needs clickable options (the PDF prints no option
  // list). Reword them into self-contained short-answer prompts for print so the
  // sheet never asks a student to fill a grid or pick from choices that aren't
  // on the page. On-screen interactive practice keeps the original items.
  const printNormalize = <T extends { question?: unknown; answer?: unknown; options?: unknown; interactive?: unknown }>(p: T): T => {
    const q = String(p.question ?? "");
    // These two interactive types now live in dedicated single-task units whose
    // directive states the instruction once, so each line is just the bare
    // expression — no per-line instruction to wrap and collide with the answer
    // line. (Area model → box-method unit; select-all → factor-quadratics unit.)
    const area = q.match(/^Fill in the area model for (.+?)\.?$/i);
    if (area) {
      const { options: _o, interactive: _i, ...rest } = p as any;
      return { ...rest, question: `${area[1]}.` };
    }
    const sel = q.match(/^Select all the factors of (.+?)\.?$/i);
    if (sel) {
      const { options: _o, interactive: _i, ...rest } = p as any;
      // Answer was the two factors comma-joined, e.g. "(x + 2),(x + 5)" —
      // present the factored product instead: "(x + 2)(x + 5)".
      const ans = String(p.answer ?? "").replace(/\)\s*,\s*\(/g, ")(");
      return { ...rest, question: `${sel[1]}.`, answer: ans };
    }
    return p;
  };

  // Convert input sheets to WorksheetData. NOTE: the per-line instruction is
  // stripped for DISPLAY at render time (see m12DisplayPrompt in WorksheetSheet),
  // NOT here — the stored question keeps its full instruction so the worked-
  // example builder can still tell which task each problem is.
  const worksheets: WorksheetData[] = input.sheets.map((s, i) => {
    const visible = s.problems
      .filter(p => !isTF((p as any).question))
      .map(printNormalize);
    return {
    problems: visible.map((p, pi) => ({
      ...p,
      type: "arithmetic" as const,
      points: 1,
      answer: String(p.answer),
      zone: (p.zone ?? Math.floor(pi / 6) + 1) as 1|2|3|4|5,
    })),
    answerKey: visible.map(p => ({ id: p.id, answer: String(p.answer) })),
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
    };
  });

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

  // Contents page: group consecutive sheets by unit label (grade from meta).
  // Only for real packs (≥10 sheets) — a 3-sheet daily packet doesn't need one.
  const contentUnits: { label: string; grade: string; from: number; to: number }[] = [];
  for (let i = 0; i < worksheets.length; i++) {
    const mt = worksheets[i].meta;
    const label = mt.subSkillLabel ?? "Practice";
    const last = contentUnits[contentUnits.length - 1];
    if (last && last.label === label) last.to = mt.sheetNumber;
    else contentUnits.push({ label, grade: mt.gradeLevel ?? "", from: mt.sheetNumber, to: mt.sheetNumber });
  }
  const withContents = worksheets.length >= 10;

  const doc = React.createElement(
    Document,
    { title: `${input.skillLabel} — Eduyro` },
    // Contents first (multi-unit packs only)
    ...(withContents
      ? [React.createElement(ContentsPage, {
          key: "toc",
          skillLabel: input.skillLabel,
          skillCode: input.skillCode,
          units: contentUnits,
          totalSheets: worksheets.length,
          withAnswerKey,
        })]
      : []),
    // All worksheets
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
