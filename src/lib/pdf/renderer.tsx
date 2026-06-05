// src/lib/pdf/renderer.tsx
// Vercel-compatible PDF renderer using @react-pdf/renderer.
// No Chromium, no Puppeteer — works on any Node.js serverless environment.
// Dynamic column layout: word problems = 1 col, short arithmetic = 3 col.

import { renderToBuffer } from "@react-pdf/renderer";
import { PdfMathText } from "@/lib/math/pdf-math";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: "0.5in",
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#1A1612",
  },
  headerBrand: { fontSize: 7, color: "#7A6E5F", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 },
  headerTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1A1612", marginBottom: 2 },
  headerSub: { fontSize: 8, color: "#7A6E5F" },
  metaRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  metaField: { flex: 1 },
  metaLabel: { fontSize: 7, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  metaLine: { borderBottomWidth: 1, borderBottomColor: "#D0C8B8", height: 16 },
  instructions: { backgroundColor: "#F5F0E8", borderLeftWidth: 3, borderLeftColor: "#C8902A", padding: "4 8", marginBottom: 8, fontSize: 8, color: "#7A6E5F", fontStyle: "italic" },
  problemGrid: { flexDirection: "row", flexWrap: "wrap" },
  // 1 column — word problems, long questions
  cell1: { width: "100%", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F5F0E8", paddingVertical: 6, paddingHorizontal: 4 },
  text1: { fontSize: 11, fontFamily: "Helvetica-Bold", flex: 1 },
  // 2 columns — medium length questions
  cell2: { width: "50%", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F5F0E8", paddingVertical: 5, paddingHorizontal: 3 },
  text2: { fontSize: 10, fontFamily: "Helvetica-Bold", flex: 1 },
  // 3 columns — short arithmetic
  cell3: { width: "33%", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F5F0E8", paddingVertical: 3, paddingHorizontal: 2 },
  text3: { fontSize: 10, fontFamily: "Helvetica-Bold", flex: 1 },
  problemNum: { fontSize: 7, color: "#ccc", width: 14 },
  answerBox: { width: 34, height: 14, borderWidth: 1, borderColor: "#D0C8B8", backgroundColor: "#F5F0E8" },
  answerBoxFilled: { width: 34, height: 14, borderWidth: 1, borderColor: "#2D6A3F", backgroundColor: "#E3F2E8", alignItems: "center", justifyContent: "center" },
  answerText: { fontSize: 8, color: "#2D6A3F", fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: "0.4in", left: "0.5in", right: "0.5in", flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#E8E0D0", paddingTop: 4 },
  footerText: { fontSize: 7, color: "#aaa" },
  disclaimer: { fontSize: 6, color: "#bbb", textAlign: "center", fontStyle: "italic", marginTop: 3 },
  signature: { borderTopWidth: 1, borderTopColor: "#F5F0E8", paddingTop: 3, marginTop: 4, fontSize: 8, color: "#aaa" },
});

// Words that indicate a word problem / non-arithmetic question
const WORD_STARTERS = ["which","what","convert","factor","expand","simplify","add","subtract","in ","a ","two ","sam","maria","someone","there","find","how","when","why","the ","if ","solve"];

function formatQuestion(q: string): string {
  const lower = q.toLowerCase();
  const isWordProblem = q.includes("=") || q.includes("?") || WORD_STARTERS.some(w => lower.startsWith(w));
  return isWordProblem ? q : q + " =";
}

function getColumns(problems: { question: string }[]): 1 | 2 | 3 {
  const avgLen = problems.reduce((s, p) => s + p.question.length, 0) / problems.length;
  if (avgLen > 35) return 1;
  if (avgLen > 18 || problems.length <= 16) return 2;
  return 3;
}

interface SheetData {
  sheetNumber: number;
  totalSheets: number;
  skillLabel: string;
  skillBand: string;
  levelCode: string;
  problems: { id: string; question: string; answer: string }[];
  isAnswerKey?: boolean;
  date?: string;
  timeLimitMinutes?: number;
}

function WorksheetPage({ sheet }: { sheet: SheetData }) {
  const date = sheet.date ?? new Date().toLocaleDateString("en-CA");
  const cols = getColumns(sheet.problems);
  const cellStyle = cols === 1 ? styles.cell1 : cols === 2 ? styles.cell2 : styles.cell3;
  const textStyle = cols === 1 ? styles.text1 : cols === 2 ? styles.text2 : styles.text3;

  return (
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerBrand}>Eduyro Education · eduyro.com</Text>
        <Text style={styles.headerTitle}>
          {sheet.skillLabel}{sheet.isAnswerKey ? " — ANSWER KEY" : ""}
        </Text>
        <Text style={styles.headerSub}>
          {sheet.levelCode} · {sheet.skillBand} · {sheet.isAnswerKey
            ? `Answer Key — Sheet ${sheet.sheetNumber}`
            : `Sheet ${sheet.sheetNumber} of ${sheet.totalSheets}`
          } · Target: {sheet.timeLimitMinutes ?? 10} min · {sheet.problems.length} problems
        </Text>
      </View>

      {/* Name / Date / Score — worksheets only */}
      {!sheet.isAnswerKey && (
        <View style={styles.metaRow}>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>Student Name</Text>
            <View style={styles.metaLine} />
          </View>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={{ ...styles.metaLine, fontSize: 9, color: "#1A1612" }}>{date}</Text>
          </View>
          <View style={styles.metaField}>
            <Text style={styles.metaLabel}>Score / {sheet.problems.length}</Text>
            <View style={styles.metaLine} />
          </View>
        </View>
      )}

      {/* Instructions */}
      {!sheet.isAnswerKey && (
        <View style={styles.instructions}>
          <Text>Write only the answer in each box. Aim to finish in {sheet.timeLimitMinutes ?? 10} minutes. Skip and come back if stuck.</Text>
        </View>
      )}

      {/* Problems grid */}
      <View style={styles.problemGrid}>
        {sheet.problems.map((p, i) => (
          <View key={p.id} style={cellStyle}>
            <Text style={styles.problemNum}>{i + 1}.</Text>
            <PdfMathText text={formatQuestion(p.question)} fontSize={cols === 1 ? 11 : 10} />
            {sheet.isAnswerKey ? (
              <View style={styles.answerBoxFilled}>
                <PdfMathText text={String(p.answer)} fontSize={7} />
              </View>
            ) : (
              <View style={styles.answerBox} />
            )}
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>{sheet.levelCode} · Eduyro · {date}</Text>
        <Text style={styles.footerText}>{sheet.isAnswerKey
          ? `Answer Key — Sheet ${sheet.sheetNumber}`
          : `Sheet ${sheet.sheetNumber} of ${sheet.totalSheets}`
        }</Text>
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer} fixed>
        For personal and household use only. Reproduction, redistribution, resale or commercial use is strictly prohibited. © {new Date().getFullYear()} Eduyro Education Inc.
      </Text>

      {/* Signature line — worksheets only */}
      {!sheet.isAnswerKey && (
        <Text style={styles.signature}>Parent/Guardian Signature: ___________________________________ Date checked: _______________</Text>
      )}
    </Page>
  );
}

export interface PdfPackInput {
  skillLabel: string;
  skillCode: string;
  levelCode: string;
  sheets: { problems: { id: string; question: string; answer: string }[]; skillBand: string }[];
}

export async function renderHtmlToPdf(_html: string): Promise<Uint8Array> {
  throw new Error("Use renderPackToPdf instead");
}

export async function renderPackToPdf(input: PdfPackInput): Promise<Uint8Array> {
  const date = new Date().toLocaleDateString("en-CA");

  const doc = React.createElement(Document, { title: `${input.skillLabel} — Eduyro` },
    ...input.sheets.map((sheet, i) =>
      React.createElement(WorksheetPage, {
        key: `sheet-${i}`,
        sheet: {
          sheetNumber: i + 1,
          totalSheets: input.sheets.length,
          skillLabel: input.skillLabel,
          skillBand: sheet.skillBand,
          levelCode: input.levelCode,
          problems: sheet.problems,
          isAnswerKey: false,
          date,
          timeLimitMinutes: 10,
        }
      })
    ),
    ...input.sheets.map((sheet, i) =>
      React.createElement(WorksheetPage, {
        key: `ak-${i}`,
        sheet: {
          sheetNumber: i + 1,
          totalSheets: input.sheets.length,
          skillLabel: input.skillLabel,
          skillBand: sheet.skillBand,
          levelCode: input.levelCode,
          problems: sheet.problems,
          isAnswerKey: true,
          date,
          timeLimitMinutes: 10,
        }
      })
    )
  );

  const buffer = await renderToBuffer(doc);
  return new Uint8Array(buffer);
}
