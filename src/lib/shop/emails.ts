// src/lib/shop/emails.ts
// Shop purchase email — sent after payment when emailDelivery=true.

import { resend, EMAIL_FROM, handleMissingMailer } from "@/lib/email/client";
import { format } from "date-fns";

const FROM = EMAIL_FROM;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";

interface ShopPurchaseEmailParams {
  to: string;
  skills: string[];
  files: Array<{
    skill: string;
    label: string;
    sheetCount: number;
    downloadUrl: string;
  }>;
  accessPageUrl: string;
  amountCents: number;
  expiresAt: Date;
}

export async function sendShopPurchaseEmail(params: ShopPurchaseEmailParams): Promise<void> {
  const subject = params.skills.length === 1
    ? `Your ${params.files[0].label} Practice Pack is ready`
    : `Your ${params.skills.length}-skill Math Bundle is ready`;

  const html = buildHtml(params);

  if (!resend) {
    // Throws in production — a purchase whose download link never arrives is
    // a support ticket, not a log line.
    handleMissingMailer(params.to, subject);
    console.log(`  Download page: ${params.accessPageUrl}`);
    return;
  }
  await resend.emails.send({ from: FROM, to: params.to, subject, html });
}

function buildHtml(p: ShopPurchaseEmailParams): string {
  const totalSheets = p.files.reduce((s, f) => s + f.sheetCount, 0);
  const totalProblems = totalSheets * 25;
  const amountDollars = (p.amountCents / 100).toFixed(2);

  const filesHtml = p.files.map((f) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E8E0D0">
        <div style="font-weight: 600; font-size: 14px; color: #1A1612">${f.label} Practice Pack</div>
        <div style="font-size: 12px; color: #7A6E5F; margin-top: 2px">${f.sheetCount} worksheets · ~${f.sheetCount * 25} problems · Answer keys included</div>
      </td>
      <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #E8E0D0">
        <a href="${f.downloadUrl}" style="background: #1B4F8A; color: #FDFAF4; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600">↓ Download PDF</a>
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1612">
<div style="display:none;font-size:0;line-height:0;max-height:0">Your worksheet pack is ready to download</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E8E0D0">
      <tr><td style="padding:24px 28px;background:#1A1612;text-align:center">
        <span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#FDFAF4">Bright<span style="color:#E8C87A">Steps</span></span>
      </td></tr>
      <tr><td style="padding:32px 28px">
        <h2 style="font-family:Georgia,serif;font-size:24px;margin:0 0 8px">✓ Your worksheet pack is ready</h2>
        <p style="font-size:15px;line-height:1.6;color:#7A6E5F;margin:0 0 24px">
          Thanks for your purchase! Your PDFs are ready below — click each one to download. All files include answer keys at the back.
        </p>

        <div style="background:#F5F0E8;border-radius:10px;padding:16px;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#7A6E5F;margin-bottom:4px">
            <span>${p.skills.length} ${p.skills.length === 1 ? "pack" : "packs"} · ${totalSheets} sheets · ${totalProblems.toLocaleString()} problems</span>
            <span style="font-weight:600;color:#1A1612">$${amountDollars}</span>
          </div>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
          ${filesHtml}
        </table>

        <div style="background:#F5E8C8;border-left:3px solid #C8902A;padding:14px 16px;border-radius:0 8px 8px 0;font-size:13px;line-height:1.6;color:#8A5E10;margin-bottom:20px">
          <strong>Tip:</strong> Save these PDFs to your computer or Google Drive — your download links work until <strong>${format(p.expiresAt, "PPP")}</strong> (30 days from purchase).
        </div>

        <p style="font-size:13px;color:#7A6E5F;line-height:1.6">
          Lost the email? Visit your <a href="${p.accessPageUrl}" style="color:#1B4F8A">download page</a> any time before ${format(p.expiresAt, "MMM d, yyyy")} to grab them again.
        </p>
      </td></tr>
      <tr><td style="padding:20px 28px;background:#F5F0E8;font-size:12px;color:#7A6E5F;text-align:center;line-height:1.6">
        Questions or issues? Reply to this email — a human reads every message.<br>
        © 2026 Eduyro Education Inc. · <a href="${APP_URL}" style="color:#1B4F8A">eduyro.com</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
