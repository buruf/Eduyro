// src/lib/pdf/renderer.tsx
// Full Kumon-style PDF renderer.
// Layout: Header → Student Info → Skill Badge → Objective → Worked Example (tutorial) → 5 Zones → Progress Bar → Footer

import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import { PdfMathText } from "@/lib/math/pdf-math";
import { computeLayout } from "./layout-engine";
import type { WorksheetData, WorksheetProblem } from "@/lib/shop/progressive-generator";

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  black:      "#1A1612",
  brand:      "#1B4F8A",
  brandLight: "#DEE9F4",
  gold:       "#C8902A",
  goldLight:  "#FDF3E0",
  green:      "#2D6A3F",
  greenLight: "#E3F2E8",
  grey1:      "#F5F5F3",
  grey2:      "#E8E0D0",
  grey3:      "#B8AC9C",
  grey4:      "#7A6E5F",
  white:      "#FFFFFF",
  zone1:      "#EEF4FB", // foundation — blue tint
  zone2:      "#EDF7EE", // building — green tint
  zone3:      "#FDF8EE", // guided — gold tint
  zone4:      "#F5F0FB", // independent — purple tint
  zone5:      "#FEF0F0", // mastery — red tint
  zone1b:     "#1B4F8A",
  zone2b:     "#2D6A3F",
  zone3b:     "#C8902A",
  zone4b:     "#6B3FA0",
  zone5b:     "#C0392B",
};

const ZONE_COLORS = [C.zone1b, C.zone2b, C.zone3b, C.zone4b, C.zone5b];
const ZONE_BG     = [C.zone1,  C.zone2,  C.zone3,  C.zone4,  C.zone5];
const ZONE_LABELS = ["Foundation", "Building Fluency", "Guided Fluency", "Independent Practice", "Mastery Challenge"];

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:       { fontFamily:"Helvetica", fontSize:9, paddingTop:30, paddingBottom:36, paddingHorizontal:36, backgroundColor:C.white },

  // Header
  headerBar:  { backgroundColor:C.brand, paddingHorizontal:12, paddingVertical:8, marginBottom:6, flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  headerOrg:  { fontSize:7, color:"rgba(255,255,255,0.7)", letterSpacing:1, textTransform:"uppercase" },
  headerTitle:{ fontSize:18, fontFamily:"Helvetica-Bold", color:C.white, marginTop:1 },
  headerSub:  { fontSize:7.5, color:"rgba(255,255,255,0.8)", marginTop:2 },
  headerBadge:{ backgroundColor:"rgba(255,255,255,0.2)", borderRadius:4, paddingHorizontal:8, paddingVertical:4, alignItems:"center" },
  badgeCode:  { fontSize:11, fontFamily:"Helvetica-Bold", color:C.white },
  badgeGrade: { fontSize:7, color:"rgba(255,255,255,0.8)", marginTop:1 },

  // Student info
  studentRow: { flexDirection:"row", gap:12, marginBottom:6 },
  studentField:{ flex:1 },
  fieldLabel: { fontSize:6.5, color:C.grey3, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 },
  fieldLine:  { borderBottomWidth:1, borderBottomColor:C.grey2, height:14 },
  fieldValue: { fontSize:8.5, color:C.black },

  // Skill badge
  skillBadge: { flexDirection:"row", alignItems:"center", backgroundColor:C.goldLight, borderLeftWidth:3, borderLeftColor:C.gold, paddingHorizontal:10, paddingVertical:6, marginBottom:6, gap:16 },
  badgeSection:{ flex:1 },
  badgeLabel: { fontSize:6.5, color:C.gold, textTransform:"uppercase", letterSpacing:0.5, fontFamily:"Helvetica-Bold", marginBottom:1 },
  badgeValue: { fontSize:8.5, fontFamily:"Helvetica-Bold", color:C.black },

  // Objective
  objectiveBox:{ backgroundColor:C.brandLight, paddingHorizontal:10, paddingVertical:6, marginBottom:8, flexDirection:"row", alignItems:"center", gap:8 },
  objectiveLabel:{ fontSize:7, fontFamily:"Helvetica-Bold", color:C.brand, textTransform:"uppercase", letterSpacing:0.5 },
  objectiveText: { fontSize:8.5, color:C.black, flex:1 },

  // Worked example
  exampleBox: { backgroundColor:C.grey1, borderWidth:0.5, borderColor:C.grey2, borderRadius:3, padding:10, marginBottom:8 },
  exampleHeader:{ fontSize:7.5, fontFamily:"Helvetica-Bold", color:C.brand, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 },
  exampleProblem:{ fontSize:11, fontFamily:"Helvetica-Bold", color:C.black, marginBottom:6 },
  exampleStep:{ flexDirection:"row", gap:6, marginBottom:3 },
  stepNum:    { fontSize:8, fontFamily:"Helvetica-Bold", color:C.gold, width:14 },
  stepText:   { fontSize:8, color:C.black, flex:1 },
  exampleAns: { marginTop:6, paddingTop:6, borderTopWidth:0.5, borderTopColor:C.grey2, flexDirection:"row", gap:8, alignItems:"center" },
  ansLabel:   { fontSize:7.5, fontFamily:"Helvetica-Bold", color:C.green },
  ansValue:   { fontSize:10, fontFamily:"Helvetica-Bold", color:C.green },

  // Zone header
  zoneHeader: { flexDirection:"row", alignItems:"center", paddingVertical:3, paddingHorizontal:8, marginTop:4, marginBottom:2, borderRadius:2 },
  zoneDot:    { width:6, height:6, borderRadius:3, marginRight:6 },
  zoneLabel:  { fontSize:7, fontFamily:"Helvetica-Bold", letterSpacing:0.5, textTransform:"uppercase" },
  zoneNum:    { fontSize:6.5, marginLeft:4 },

  // Problem row
  problemRow: { flexDirection:"row", alignItems:"center", paddingVertical:3, paddingHorizontal:6, borderBottomWidth:0.5, borderBottomColor:C.grey2 },
  probNum:    { fontSize:7, color:C.grey3, width:14 },
  probQ:      { flex:1, fontSize:9, fontFamily:"Helvetica-Bold" },
  answerLine: { borderBottomWidth:1, borderBottomColor:C.black, width:70 },
  answerBox:  { width:70, height:18, borderWidth:0.5, borderColor:C.grey2, backgroundColor:C.grey1 },
  answerBoxBig:{ width:70, height:24, borderWidth:0.5, borderColor:C.grey2, backgroundColor:C.grey1 },
  answerFilled:{ width:70, height:16, backgroundColor:C.greenLight, borderWidth:0.5, borderColor:C.green, borderRadius:2, alignItems:"center", justifyContent:"center", paddingHorizontal:2 },

  // Progress bar
  progressBar:{ flexDirection:"row", marginTop:8, marginBottom:6, gap:3 },
  progressSeg:{ flex:1, height:6, borderRadius:3 },
  progressLabel:{ fontSize:6, color:C.grey4, textAlign:"center", marginTop:2 },

  // Footer
  footer:     { position:"absolute", bottom:16, left:36, right:36, borderTopWidth:0.5, borderTopColor:C.grey2, paddingTop:3, flexDirection:"row", justifyContent:"space-between" },
  footerText: { fontSize:6.5, color:C.grey3 },

  // Reflection
  reflectionBox:{ marginTop:6, paddingTop:5, borderTopWidth:0.5, borderTopColor:C.grey2 },
  reflectionRow:{ flexDirection:"row", gap:16, marginTop:3 },
  checkItem:  { flexDirection:"row", alignItems:"center", gap:4 },
  checkBox:   { width:8, height:8, borderWidth:0.5, borderColor:C.grey3 },
  checkLabel: { fontSize:7, color:C.grey4 },
  masteryRow: { flexDirection:"row", gap:6, marginTop:4, alignItems:"center" },
  masteryLabel:{ fontSize:7, color:C.grey4, fontFamily:"Helvetica-Bold" },
  masteryItem:{ paddingHorizontal:6, paddingVertical:2, borderRadius:2, borderWidth:0.5 },
  masteryText:{ fontSize:6.5 },
});

// ── Stars helper ─────────────────────────────────────────────────────────────
function stars(n: number): string {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ── Answer space by grade ─────────────────────────────────────────────────────
function getAnswerSpace(skillCode: string, isAnswerKey: boolean, answer: string, rowHeight: number) {
  const level = parseInt(skillCode.replace("M", "")) || 7;
  if (isAnswerKey) {
    return (
      <View style={s.answerFilled}>
        <PdfMathText text={String(answer)} fontSize={7} />
      </View>
    );
  }
  if (level <= 2) return <View style={{ ...s.answerBoxBig, height: Math.max(20, rowHeight - 4) }} />;
  if (level <= 6) return <View style={s.answerLine} />;
  return <View style={{ ...s.answerLine, width: 50 }} />;
}

// ── Problem groups by zone ────────────────────────────────────────────────────
function groupByZone(problems: WorksheetProblem[]): Map<number, WorksheetProblem[]> {
  const map = new Map<number, WorksheetProblem[]>();
  for (const p of problems) {
    if (!map.has(p.zone)) map.set(p.zone, []);
    map.get(p.zone)!.push(p);
  }
  return map;
}

// ── Worksheet Page ────────────────────────────────────────────────────────────
function WorksheetPage({ sheet, isAnswerKey }: { sheet: WorksheetData; isAnswerKey: boolean }) {
  const { meta, problems, workedExample } = sheet;
  const date = new Date().toLocaleDateString("en-CA");
  const layout = computeLayout(problems.length);
  const byZone = groupByZone(problems);

  return (
    <Page size="LETTER" style={s.page}>

      {/* ── Blue header bar ── */}
      <View style={s.headerBar}>
        <View>
          <Text style={s.headerOrg}>Eduyro Education · eduyro.com</Text>
          <Text style={s.headerTitle}>
            {meta.subSkillLabel}{isAnswerKey ? " — Answer Key" : ""}
          </Text>
          <Text style={s.headerSub}>
            {meta.gradeLevel} · Skill {meta.skillCode} · {meta.estimatedMinutes} min · Sheet {meta.sheetNumber} of {meta.totalSheets}
          </Text>
        </View>
        <View style={s.headerBadge}>
          <Text style={s.badgeCode}>{meta.skillCode}</Text>
          <Text style={s.badgeGrade}>{meta.gradeLevel}</Text>
        </View>
      </View>

      {/* ── Student info — worksheets only ── */}
      {!isAnswerKey && (
        <View style={s.studentRow}>
          {[
            { label: "Student Name", value: "" },
            { label: "Date", value: date },
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
      )}

      {/* ── Skill badge ── */}
      {!isAnswerKey && (
        <View style={s.skillBadge}>
          <View style={s.badgeSection}>
            <Text style={s.badgeLabel}>Skill Level</Text>
            <Text style={s.badgeValue}>{meta.skillCode} · {meta.subSkillLabel}</Text>
          </View>
          <View style={s.badgeSection}>
            <Text style={s.badgeLabel}>Difficulty</Text>
            <Text style={s.badgeValue}>{stars(meta.difficultyStars)}</Text>
          </View>
          <View style={s.badgeSection}>
            <Text style={s.badgeLabel}>Goal</Text>
            <Text style={s.badgeValue}>Complete {problems.length} problems in {meta.estimatedMinutes} min</Text>
          </View>
        </View>
      )}

      {/* ── Learning objective ── */}
      {!isAnswerKey && (
        <View style={s.objectiveBox}>
          <Text style={s.objectiveLabel}>Today I will:</Text>
          <Text style={s.objectiveText}>{meta.learningObjective}.</Text>
        </View>
      )}

      {/* ── Worked example — tutorial mode only ── */}
      {!isAnswerKey && meta.mode === "tutorial" && workedExample && (
        <View style={s.exampleBox}>
          <Text style={s.exampleHeader}>Worked Example — Study this before you begin</Text>
          <View style={{ marginBottom:4 }}>
            <Text style={{ fontSize:7.5, color:C.grey4, marginBottom:3 }}>Problem:</Text>
            <PdfMathText text={workedExample.problem} fontSize={11} />
          </View>
          {workedExample.steps.map((step, i) => (
            <View key={i} style={s.exampleStep}>
              <Text style={s.stepNum}>Step {i+1}</Text>
              <PdfMathText text={step} fontSize={8} />
            </View>
          ))}
          <View style={s.exampleAns}>
            <Text style={s.ansLabel}>Answer:</Text>
            <PdfMathText text={workedExample.answer} fontSize={10} />
          </View>
        </View>
      )}

      {/* ── Problems by zone ── */}
      {[1, 2, 3, 4, 5].map((zoneNum) => {
        const zoneProblems = byZone.get(zoneNum as 1|2|3|4|5) ?? [];
        if (zoneProblems.length === 0) return null;
        const color = ZONE_COLORS[zoneNum - 1];
        const bg    = ZONE_BG[zoneNum - 1];
        const label = ZONE_LABELS[zoneNum - 1];

        // Assessment mode — no zone labels
        const showZoneLabel = meta.mode !== "assessment" && !isAnswerKey;

        // Split into columns based on layout
        const cols = layout.columns;
        const perCol = Math.ceil(zoneProblems.length / cols);
        const colGroups: WorksheetProblem[][] = [];
        for (let c = 0; c < cols; c++) {
          colGroups.push(zoneProblems.slice(c * perCol, (c + 1) * perCol));
        }

        return (
          <View key={zoneNum}>
            {showZoneLabel && (
              <View style={{ ...s.zoneHeader, backgroundColor: bg }}>
                <View style={{ ...s.zoneDot, backgroundColor: color }} />
                <Text style={{ ...s.zoneLabel, color }}>{zoneNum}. {label}</Text>
                <Text style={{ ...s.zoneNum, color: C.grey3 }}>
                  (Problems {zoneProblems[0] ? problems.indexOf(zoneProblems[0]) + 1 : ""}–{zoneProblems[zoneProblems.length-1] ? problems.indexOf(zoneProblems[zoneProblems.length-1]) + 1 : ""})
                </Text>
              </View>
            )}
            <View style={{ flexDirection:"row", gap:8 }}>
              {colGroups.map((col, ci) => (
                <View key={ci} style={{ flex:1 }}>
                  {col.map((p) => {
                    const idx = problems.indexOf(p);
                    const isEven = idx % 2 === 0;
                    return (
                      <View key={p.id} style={{
                        ...s.problemRow,
                        height: layout.rowHeightPt,
                        backgroundColor: isEven ? C.grey1 : C.white,
                      }}>
                        <Text style={s.probNum}>{idx + 1}.</Text>
                        <View style={{ flex:1, paddingRight:4 }}>
                          <PdfMathText text={p.question} fontSize={layout.fontSizePt} />
                        </View>
                        {getAnswerSpace(meta.skillCode, isAnswerKey, p.answer, layout.rowHeightPt)}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* ── Progress bar — worksheets only ── */}
      {!isAnswerKey && meta.mode !== "assessment" && (
        <View>
          <View style={s.progressBar}>
            {ZONE_LABELS.map((label, i) => (
              <View key={i} style={{ flex:1, alignItems:"center" }}>
                <View style={{ ...s.progressSeg, backgroundColor: ZONE_BG[i], borderWidth:0.5, borderColor:ZONE_COLORS[i] }} />
                <Text style={{ ...s.progressLabel, color: ZONE_COLORS[i] }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Reflection footer — worksheets only ── */}
      {!isAnswerKey && (
        <View style={s.reflectionBox}>
          <View style={s.reflectionRow}>
            {["I understand this skill", "I can solve these independently", "I can explain my thinking"].map((label, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkBox} />
                <Text style={s.checkLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={s.masteryRow}>
            <Text style={s.masteryLabel}>Mastery:</Text>
            {["Beginning", "Developing", "Proficient", "Mastered"].map((level, i) => (
              <View key={i} style={{ ...s.masteryItem, borderColor: ZONE_COLORS[i], backgroundColor: ZONE_BG[i] }}>
                <Text style={{ ...s.masteryText, color: ZONE_COLORS[i] }}>{level}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Fixed footer ── */}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>{meta.skillCode} · {meta.subSkillLabel} · Eduyro</Text>
        <Text style={{ ...s.footerText, fontStyle:"italic" }}>
          For personal and household use only. © {new Date().getFullYear()} Eduyro Education Inc.
        </Text>
        <Text style={s.footerText}>
          {isAnswerKey ? `Answer Key · Sheet ${meta.sheetNumber}` : `Sheet ${meta.sheetNumber} of ${meta.totalSheets}`}
        </Text>
      </View>

    </Page>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface PdfPackInput {
  skillLabel: string;
  skillCode: string;
  levelCode: string;
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

  // Convert input sheets to WorksheetData format
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
      skill: input.levelCode as any,
      skillCode: input.levelCode,
      sheetNumber: i + 1,
      totalSheets: input.sheets.length,
      subSkillLabel: s.skillBand,
      gradeLevel: "Grade K–12",
      difficultyStars: 3,
      learningObjective: "practice this skill",
      mode: "practice" as const,
      estimatedMinutes: 10,
    },
  }));

  const doc = React.createElement(Document, { title: `${input.skillLabel} — Eduyro` },
    // Worksheets
    ...worksheets.map((ws, i) =>
      React.createElement(WorksheetPage, { key: `ws-${i}`, sheet: ws, isAnswerKey: false })
    ),
    // Answer keys
    ...worksheets.map((ws, i) =>
      React.createElement(WorksheetPage, { key: `ak-${i}`, sheet: ws, isAnswerKey: true })
    )
  );

  const buffer = await renderToBuffer(doc);
  return new Uint8Array(buffer);
}

// Direct render from WorksheetData (used by preview route)
export async function renderWorksheetToPdf(sheet: WorksheetData): Promise<Uint8Array> {
  const doc = React.createElement(Document, { title: `${sheet.meta.subSkillLabel} — Eduyro` },
    React.createElement(WorksheetPage, { sheet, isAnswerKey: false }),
    React.createElement(WorksheetPage, { sheet, isAnswerKey: true })
  );
  const buffer = await renderToBuffer(doc);
  return new Uint8Array(buffer);
}
