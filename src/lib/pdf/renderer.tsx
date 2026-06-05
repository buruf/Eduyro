// src/lib/pdf/renderer.ts
// Vercel-compatible PDF renderer using @react-pdf/renderer.
// No Chromium, no Puppeteer — works on any Node.js serverless environment.

import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
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
  problemCell: { width: "33%", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F5F0E8", paddingVertical: 3, paddingHorizontal: 2 },
  problemNum: { fontSize: 7, color: "#ccc", width: 14 },
  problemText: { fontSize: 10, fontFamily: "Helvetica-Bold", flex: 1 },
  answerBox: { width: 34, height: 14, borderWidth: 1, borderColor: "#D0C8B8", backgroundColor: "#F5F0E8" },
  answerBoxFilled: { width: 34, height: 14, borderWidth: 1, borderColor: "#2D6A3F", backgroundColor: "#E3F2E8", alignItems: "center", justifyContent: "center" },
  answerText: { fontSize: 8, color: "#2D6A3F", fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: "0.4in", left: "0.5in", right: "0.5in", flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#E8E0D0", paddingTop: 4 },
  footerText: { fontSize: 7, color: "#aaa" },
  disclaimer: { fontSize: 6, color: "#bbb", textAlign: "center", fontStyle: "italic", marginTop: 3 },
  signature: { borderTopWidth: 1, borderTopColor: "#F5F0E8", paddingTop: 3, marginTop: 4, fontSize: 8, color: "#aaa" },
});

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
  return (
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerBrand}>Eduyro Education · eduyro.com</Text>
        <Text style={styles.headerTitle}>
          {sheet.skillLabel}{sheet.isAnswerKey ? " — ANSWER KEY" : ""}
        </Text>
        <Text style={styles.headerSub}>
          {sheet.levelCode} · {sheet.skillBand} · {sheet.isAnswerKey ? `Answer Key — Sheet ${sheet.sheetNumber}` : `Sheet ${sheet.sheetNumber} of ${sheet.totalSheets}`} · Target: {sheet.timeLimitMinutes ?? 10} min · {sheet.problems.length} problems
        </Text>
      </View>

      {/* Name/Date/Score — worksheets only */}
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
          <View key={p.id} style={styles.problemCell}>
            <Text style={styles.problemNum}>{i + 1}.</Text>
            <Text style={styles.problemText}>{p.question.includes("=") ? p.question : p.question + " ="}</Text>
            {sheet.isAnswerKey ? (
              <View style={styles.answerBoxFilled}>
                <Text style={styles.answerText}>{String(p.answer)}</Text>
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
        <Text style={styles.footerText}>{sheet.isAnswerKey ? `Answer Key — Sheet ${sheet.sheetNumber}` : `Sheet ${sheet.sheetNumber} of ${sheet.totalSheets}`}</Text>
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
  throw new Error("Use renderPackToPdf instead — HTML-based PDF is no longer supported on Vercel");
}

export async function renderPackToPdf(input: PdfPackInput): Promise<Uint8Array> {
  const date = new Date().toLocaleDateString("en-CA");

  const doc = React.createElement(Document, { title: `${input.skillLabel} — Eduyro` },
    // Worksheet pages
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
    // Answer key pages
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
