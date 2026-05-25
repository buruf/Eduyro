// src/lib/pdf/renderer.ts
// Lightweight HTML-to-PDF renderer for worksheet preview bundles.
// Uses Puppeteer to render HTML to a PDF buffer.
// Distinct from generator.ts which handles S3 uploads and shop PDFs.

import puppeteer from "puppeteer";

/**
 * Render an HTML string to a PDF buffer.
 * Used by the worksheet preview-bundle route to generate printable PDFs.
 */
export async function renderHtmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
        right: "0.5in",
      },
    });

    return new Uint8Array(pdfBuffer);
  } finally {
    await browser.close();
  }
}
