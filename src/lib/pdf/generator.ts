// src/lib/pdf/generator.ts
// Server-side PDF generation with Puppeteer
// Renders worksheets as print-ready PDFs

import puppeteer, { Browser } from "puppeteer";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import JSZip from "jszip";
import { db } from "@/lib/db";
import { format } from "date-fns";
import type { PdfGenerationOptions } from "@/types";

// ─────────────────────────────────────────────
// S3 client
// ─────────────────────────────────────────────

const s3 = process.env.AWS_REGION
  ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const BUCKET = process.env.AWS_S3_BUCKET ?? "brightsteps-pdfs";

// ─────────────────────────────────────────────
// Browser singleton (re-used across requests)
// ─────────────────────────────────────────────

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

// ─────────────────────────────────────────────
// Render single worksheet HTML
// ─────────────────────────────────────────────

export function renderWorksheetHtml(params: {
  title: string;
  subjectName: string;
  levelCode: string;
  levelName: string;
  skillName: string;
  sheetNumber: number;
  totalSheets: number;
  problems: any[];
  studentName?: string;
  date?: string;
  timeLimitMinutes: number;
  problemCount: number;
  schoolName?: string;
  schoolLogoUrl?: string;
  schoolHeaderText?: string;
  schoolFooterText?: string;
  includeAnswerKey: boolean;
  isAnswerKey: boolean;
  includeSignatureLine: boolean;
  includeInstructions: boolean;
}): string {
  const layoutClass = params.problems.length > 12 ? "two-col" : "one-col";

  const problemsHtml = params.problems
    .map((p, i) => {
      const num = i + 1;
      if (p.type === "multiple_choice" && p.options) {
        const opts = p.options
          .map((o: string, j: number) => {
            const letter = ["A", "B", "C", "D"][j];
            const isCorrect = params.isAnswerKey && p.answer === o;
            return `<div class="opt${isCorrect ? " correct-opt" : ""}"><span class="opt-letter">${letter}</span>${o}</div>`;
          })
          .join("");
        return `<div class="prob mc">
          <div class="prob-q"><span class="prob-num">${num}.</span> ${p.question}</div>
          <div class="opts-grid">${opts}</div>
        </div>`;
      }

      if (p.type === "written_response" || p.type === "short_answer") {
        const ans = params.isAnswerKey
          ? `<div class="ans-key-text">${p.answer}</div>`
          : `<div class="write-lines"><div class="line"></div><div class="line"></div></div>`;
        return `<div class="prob written">
          <div class="prob-q"><span class="prob-num">${num}.</span> ${p.question}</div>
          ${ans}
        </div>`;
      }

      // Default: arithmetic / fill_blank with answer box
      const ans = params.isAnswerKey
        ? `<div class="ans-box revealed">${p.answer}</div>`
        : `<div class="ans-box"></div>`;
      return `<div class="prob inline">
        <span class="prob-num">${num}.</span>
        <span class="prob-q">${p.question}</span>
        ${ans}
      </div>`;
    })
    .join("");

  const schoolBrand = params.schoolName
    ? `<div class="school-brand">${params.schoolName}${params.schoolHeaderText ? ` · ${params.schoolHeaderText}` : ""}</div>`
    : `<div class="school-brand">Eduyro Education · eduyro.com</div>`;

  const instructions = params.includeInstructions
    ? `<div class="instr">Write only the answer in each box. Try to finish in under ${params.timeLimitMinutes} minutes. If you get stuck, skip and come back.</div>`
    : "";

  const signature = params.includeSignatureLine
    ? `<div class="signature">Parent/Guardian Signature: ____________________________________ &nbsp;&nbsp; Date checked: _______________</div>`
    : "";

  const headerTitle = params.isAnswerKey ? `${params.title} — ANSWER KEY` : params.title;
  const headerClass = params.isAnswerKey ? "answer-key-doc" : "";

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${headerTitle}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; color: #1A1612; font-size: 13px; line-height: 1.5; }
  .doc { padding: 0; }
  .answer-key-doc { border: 3px solid #2D6A3F; padding: 12px; border-radius: 6px; }
  .header { border-bottom: 3px solid ${params.isAnswerKey ? "#2D6A3F" : "#111"}; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
  .school-brand { font-family: Arial, sans-serif; font-size: 10px; color: #999; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 4px; }
  .title { font-size: 17px; font-weight: 700; ${params.isAnswerKey ? "color: #2D6A3F;" : ""} }
  .subtitle { font-family: Arial, sans-serif; font-size: 11px; color: #666; margin-top: 4px; }
  .brand { font-family: Georgia, serif; font-size: 11px; color: #aaa; text-align: right; line-height: 1.4; }
  .fields { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; margin-bottom: 12px; font-family: Arial, sans-serif; font-size: 11px; color: #666; }
  .field label { font-size: 9px; display: block; margin-bottom: 2px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; }
  .field-line { border-bottom: 1px solid #bbb; min-height: 20px; display: block; padding: 2px 0; color: #1A1612; }
  .instr { font-family: Arial, sans-serif; font-size: 11px; color: #555; font-style: italic; border-left: 3px solid #C8902A; padding: 6px 10px; margin-bottom: 14px; line-height: 1.55; background: #faf7f2; border-radius: 0 5px 5px 0; }
  .problems.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem 2.5rem; }
  .problems.one-col { display: flex; flex-direction: column; gap: 6px; }
  .prob { padding: 4px 0; border-bottom: 1px solid #f0ebe0; }
  .prob.inline { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
  .prob-num { font-family: Arial, sans-serif; font-size: 10px; color: #bbb; min-width: 22px; }
  .prob-q { font-size: 14px; font-weight: 700; flex: 1; }
  .prob.mc .prob-q, .prob.written .prob-q { font-weight: 600; font-size: 13px; margin-bottom: 5px; }
  .opts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 12px; padding-left: 22px; }
  .opt { font-family: Arial, sans-serif; font-size: 11.5px; color: #555; display: flex; align-items: center; gap: 6px; padding: 2px 0; }
  .opt::before { content: '○'; font-size: 14px; color: #ccc; }
  .opt.correct-opt::before { content: '●'; color: #2D6A3F; }
  .opt.correct-opt { color: #2D6A3F; font-weight: 600; }
  .write-lines { padding-left: 22px; }
  .line { border-bottom: 1px solid #ccc; min-height: 20px; margin: 4px 0; }
  .ans-box { width: 46px; height: 24px; border: 1px solid #b0a090; border-radius: 3px; background: #faf7f2; flex-shrink: 0; }
  .ans-box.revealed { background: #E3F2E8; border-color: #2D6A3F; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #2D6A3F; }
  .ans-key-text { padding-left: 22px; margin-top: 4px; font-size: 12px; color: #2D6A3F; font-weight: 700; font-style: italic; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px dashed #ddd; display: flex; justify-content: space-between; font-family: Arial, sans-serif; font-size: 10px; color: #bbb; }
  .signature { margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee; font-family: Arial, sans-serif; font-size: 11px; color: #888; }
</style></head>
<body>
<div class="doc ${headerClass}">
  <div class="header">
    <div>
      <div class="school-brand">${schoolBrand}</div>
      <div class="title">${headerTitle}</div>
      <div class="subtitle">Level ${params.levelCode} &nbsp;·&nbsp; ${params.subjectName} &nbsp;·&nbsp; Sheet ${params.sheetNumber} of ${params.totalSheets} &nbsp;·&nbsp; Target: ${params.timeLimitMinutes} min &nbsp;·&nbsp; ${params.problemCount} problems</div>
    </div>
    <div class="brand">${params.schoolName ?? "Eduyro"}<br>${params.schoolLogoUrl ? `<img src="${params.schoolLogoUrl}" style="max-height:30px"/>` : "Education"}</div>
  </div>
  <div class="fields">
    <div class="field"><label>Student Name</label><div class="field-line">${params.studentName ?? ""}</div></div>
    <div class="field"><label>Date</label><div class="field-line">${params.date ?? ""}</div></div>
    <div class="field"><label>Score</label><div class="field-line">${params.isAnswerKey ? `${params.problemCount} / ${params.problemCount}` : `&nbsp;/ ${params.problemCount}`}</div></div>
  </div>
  ${instructions}
  <div class="problems ${layoutClass}">${problemsHtml}</div>
  <div class="footer">
    <span>Level ${params.levelCode} &nbsp;·&nbsp; ${params.schoolName ?? "Eduyro Education"}</span>
    <span>Page ${params.sheetNumber} of ${params.totalSheets}${params.schoolFooterText ? ` · ${params.schoolFooterText}` : ""}</span>
  </div>
  ${!params.isAnswerKey ? signature : ""}
</div>
</body></html>`;
}

// ─────────────────────────────────────────────
// Generate single PDF
// ─────────────────────────────────────────────

export async function generateWorksheetPdf(params: {
  studentId?: string;
  worksheetIds: string[];
  options: PdfGenerationOptions;
}): Promise<{ buffer: Buffer; fileName: string }> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  // Load student and worksheets
  const student = params.studentId
    ? await db.student.findUnique({
        where: { id: params.studentId },
        include: { user: true, school: true },
      })
    : null;

  const worksheets = await db.worksheet.findMany({
    where: { id: { in: params.worksheetIds } },
    include: {
      level: { include: { subject: true } },
      skill: true,
    },
  });

  const totalSheets = worksheets.length + (params.options.includeAnswerKey ? 1 : 0);

  // Build combined HTML (one page per worksheet, page-break between)
  const pages: string[] = [];

  worksheets.forEach((ws, i) => {
    pages.push(
      renderWorksheetHtml({
        title: ws.title,
        subjectName: ws.level.subject.name,
        levelCode: ws.level.code,
        levelName: ws.level.name,
        skillName: ws.skill.name,
        sheetNumber: i + 1,
        totalSheets,
        problems: ws.problems as any[],
        studentName: params.options.studentName ?? student?.user.name ?? "",
        date: params.options.date ?? format(new Date(), "MMMM d, yyyy"),
        timeLimitMinutes: ws.level.timeLimitMinutes,
        problemCount: ws.problemCount,
        schoolName: params.options.schoolBranding?.schoolName ?? student?.school?.name,
        schoolLogoUrl: params.options.schoolBranding?.logoUrl ?? student?.school?.worksheetLogoUrl ?? undefined,
        schoolHeaderText: params.options.schoolBranding?.headerText ?? student?.school?.worksheetHeaderText ?? undefined,
        schoolFooterText: params.options.schoolBranding?.footerText ?? student?.school?.worksheetFooterText ?? undefined,
        includeAnswerKey: false,
        isAnswerKey: false,
        includeSignatureLine: params.options.includeSignatureLine ?? true,
        includeInstructions: params.options.includeInstructions ?? true,
      })
    );
  });

  // Append answer key page
  if (params.options.includeAnswerKey) {
    worksheets.forEach((ws, i) => {
      pages.push(
        renderWorksheetHtml({
          title: ws.title,
          subjectName: ws.level.subject.name,
          levelCode: ws.level.code,
          levelName: ws.level.name,
          skillName: ws.skill.name,
          sheetNumber: i + 1,
          totalSheets,
          problems: ws.problems as any[],
          studentName: params.options.studentName ?? student?.user.name ?? "",
          date: format(new Date(), "MMMM d, yyyy"),
          timeLimitMinutes: ws.level.timeLimitMinutes,
          problemCount: ws.problemCount,
          schoolName: params.options.schoolBranding?.schoolName,
          includeAnswerKey: true,
          isAnswerKey: true,
          includeSignatureLine: false,
          includeInstructions: false,
        })
      );
    });
  }

  // Concatenate with page breaks
  const combined = `<html><head></head><body>${pages
    .map((p, i) => `<div style="${i > 0 ? "page-break-before: always;" : ""}">${p.replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*$/, "")}</div>`)
    .join("")}</body></html>`;

  await page.setContent(combined, { waitUntil: "domcontentloaded" });

  const pdfBuffer = await page.pdf({
    format: "letter",
    printBackground: true,
    margin: { top: "0.6in", bottom: "0.6in", left: "0.6in", right: "0.6in" },
  });

  await page.close();

  const safeName = (student?.user.name ?? "student").replace(/\s+/g, "");
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const fileName = `${safeName}_${worksheets[0]?.level.code ?? "Packet"}_${dateStr}.pdf`;

  return { buffer: Buffer.from(pdfBuffer), fileName };
}

// ─────────────────────────────────────────────
// Bulk PDF generation (school export)
// ─────────────────────────────────────────────

export async function generateBulkPdfs(params: {
  studentWorksheets: { studentId: string; worksheetIds: string[] }[];
  options: PdfGenerationOptions;
}): Promise<{ zipBuffer: Buffer; fileName: string; pdfCount: number }> {
  const zip = new JSZip();
  let totalPdfs = 0;

  // Generate in parallel batches of 5
  const batchSize = 5;
  for (let i = 0; i < params.studentWorksheets.length; i += batchSize) {
    const batch = params.studentWorksheets.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((sw) =>
        generateWorksheetPdf({
          studentId: sw.studentId,
          worksheetIds: sw.worksheetIds,
          options: params.options,
        })
      )
    );
    results.forEach((r) => {
      zip.file(r.fileName, r.buffer);
      totalPdfs++;
    });
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const fileName = `brightsteps_bulk_${format(new Date(), "yyyy-MM-dd_HHmm")}.zip`;

  return { zipBuffer, fileName, pdfCount: totalPdfs };
}

// ─────────────────────────────────────────────
// Upload to S3 + signed URL
// ─────────────────────────────────────────────

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!s3) {
    // Local dev fallback: save to disk so files can actually be downloaded
    const fs = await import("fs/promises");
    const path = await import("path");
    const localDir = path.join(process.cwd(), ".local-storage");
    const fullPath = path.join(localDir, key);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    // Return a URL pointing to our local-file API route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${baseUrl}/api/local-storage/${encodeURIComponent(key)}`;
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "private, max-age=604800",
    })
  );

  return getSignedDownloadUrl(key);
}

export async function getSignedDownloadUrl(key: string, expiresInSeconds = 7 * 24 * 60 * 60): Promise<string> {
  if (!s3) {
    // Local dev: return URL to our local-storage route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${baseUrl}/api/local-storage/${encodeURIComponent(key)}`;
  }
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}
