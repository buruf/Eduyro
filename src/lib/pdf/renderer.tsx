// src/lib/pdf/renderer.tsx
// Adaptive PDF renderer using @react-pdf/renderer.
// Uses layout-engine.ts to fit ALL problems on exactly ONE page always.
// Answer lines are right-aligned at fixed position regardless of question length.

import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet, Line, Svg } from "@react-pdf/renderer";
import React from "react";
import { PdfMathText } from "@/lib/math/pdf-math";
import { computeLayout } from "./layout-engine";

// Word starters that indicate a word/identification problem — no trailing =
const WORD_STARTERS = [
  "which","what","convert","factor","expand","simplify","add","subtract",
  "in ","a ","two ","sam","maria","someone","there","find","how","when",
  "why","the ","if ","solve","write","evaluate","compute"
];

function formatQuestion(q: string): string {
  const lower = q.toLowerCase();
  const isWordProblem = q.includes("=") || q.includes("?") ||
    WORD_STARTERS.some(w => lower.startsWith(w));
  return isWordProblem ? q : q + " =";
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
  const layout = computeLayout(sheet.problems.length);
  const { columns, rowHeightPt, fontSizePt, answerLineWidthPt, questionPaddingPt, rowPaddingPt } = layout;

  // Column width
  const colGap = 8;
  const colWidth = (612 - 72 - (columns - 1) * colGap) / columns;

  // Split problems into columns
  const rowsPerCol = Math.ceil(sheet.problems.length / columns);
  const problemColumns: typeof sheet.problems[] = [];
  for (let c = 0; c < columns; c++) {
    problemColumns.push(sheet.problems.slice(c * rowsPerCol, (c + 1) * rowsPerCol));
  }

  const numWidth = 14;
  const questionWidth = colWidth - numWidth - answerLineWidthPt - 8;

  return (
    <Page size="LETTER" style={{
      fontFamily: "Helvetica",
      paddingTop: 36,
      paddingBottom: 36,
      paddingLeft: 36,
      paddingRight: 36,
      backgroundColor: "#FFFFFF",
    }}>

      {/* ── Header ── */}
      <View style={{
        marginBottom: 8,
        paddingBottom: 6,
        borderBottomWidth: 2,
        borderBottomColor: "#1A1612",
      }}>
        {/* Top bar */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, color: "#7A6E5F", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
              Eduyro Education · eduyro.com
            </Text>
            <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1A1612", marginBottom: 2 }}>
              {sheet.skillLabel}{sheet.isAnswerKey ? " — ANSWER KEY" : ""}
            </Text>
            <Text style={{ fontSize: 8, color: "#7A6E5F" }}>
              {sheet.levelCode} · {sheet.skillBand} · {sheet.isAnswerKey
                ? `Answer Key — Sheet ${sheet.sheetNumber}`
                : `Sheet ${sheet.sheetNumber} of ${sheet.totalSheets}`
              } · {sheet.problems.length} problems · {sheet.timeLimitMinutes ?? 10} min
            </Text>
          </View>
          {/* Level badge */}
          <View style={{
            backgroundColor: "#DEE9F4",
            borderRadius: 4,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginLeft: 8,
          }}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1B4F8A" }}>
              Level {sheet.levelCode}
            </Text>
          </View>
        </View>

        {/* Student info — worksheets only */}
        {!sheet.isAnswerKey && (
          <View style={{ flexDirection: "row", gap: 16, marginTop: 6 }}>
            {[
              { label: "Student Name", value: "" },
              { label: "Date", value: date },
              { label: `Score / ${sheet.problems.length}`, value: "" },
            ].map((field, i) => (
              <View key={i} style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                  {field.label}
                </Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: "#D0C8B8", height: 14 }}>
                  {field.value ? (
                    <Text style={{ fontSize: 9, color: "#1A1612" }}>{field.value}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── Problems grid ── */}
      <View style={{ flexDirection: "row", gap: colGap }}>
        {problemColumns.map((colProblems, colIdx) => (
          <View key={colIdx} style={{ width: colWidth }}>
            {colProblems.map((p, i) => {
              const globalIdx = colIdx * rowsPerCol + i;
              const isEven = globalIdx % 2 === 0;

              return (
                <View
                  key={p.id}
                  style={{
                    height: rowHeightPt,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isEven ? "#FAFAF8" : "#FFFFFF",
                    borderBottomWidth: 0.5,
                    borderBottomColor: "#E8E0D0",
                    paddingVertical: rowPaddingPt,
                  }}
                >
                  {/* Problem number */}
                  <Text style={{
                    width: numWidth,
                    fontSize: Math.max(6, fontSizePt - 2),
                    color: "#C0B8A8",
                    fontFamily: "Helvetica",
                  }}>
                    {globalIdx + 1}.
                  </Text>

                  {/* Question — takes all available space, wraps if needed */}
                  <View style={{ width: questionWidth, paddingRight: 4 }}>
                    <PdfMathText
                      text={formatQuestion(p.question)}
                      fontSize={fontSizePt}
                    />
                  </View>

                  {/* Answer — RIGHT aligned, fixed width */}
                  {sheet.isAnswerKey ? (
                    <View style={{
                      width: answerLineWidthPt,
                      height: rowHeightPt - rowPaddingPt * 2 - 2,
                      backgroundColor: "#E3F2E8",
                      borderWidth: 0.5,
                      borderColor: "#2D6A3F",
                      borderRadius: 2,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 2,
                    }}>
                      <PdfMathText text={String(p.answer)} fontSize={Math.max(6, fontSizePt - 1)} />
                    </View>
                  ) : (
                    <View style={{
                      width: answerLineWidthPt,
                      borderBottomWidth: 1,
                      borderBottomColor: "#1A1612",
                      height: rowHeightPt - rowPaddingPt * 2 - 2,
                    }} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* ── Footer ── */}
      <View style={{
        position: "absolute",
        bottom: 20,
        left: 36,
        right: 36,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 0.5,
        borderTopColor: "#E8E0D0",
        paddingTop: 3,
      }} fixed>
        <Text style={{ fontSize: 7, color: "#aaa" }}>
          {sheet.levelCode} · Eduyro · {date}
        </Text>
        <Text style={{ fontSize: 6, color: "#bbb", fontStyle: "italic" }}>
          For personal and household use only. © {new Date().getFullYear()} Eduyro Education Inc.
        </Text>
        <Text style={{ fontSize: 7, color: "#aaa" }}>
          {sheet.isAnswerKey ? `Answer Key — Sheet ${sheet.sheetNumber}` : `Sheet ${sheet.sheetNumber} of ${sheet.totalSheets}`}
        </Text>
      </View>

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
