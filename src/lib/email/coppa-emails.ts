// src/lib/email/coppa-emails.ts
// COPPA-specific transactional emails.

import { Resend } from "resend";
import { format } from "date-fns";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "BrightSteps <noreply@eduyro.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";

type EmailParams =
  | { to: string; template: "consent_request"; data: ConsentRequestData }
  | { to: string; template: "consent_confirmed"; data: ConsentConfirmedData };

interface ConsentRequestData {
  parentName: string;
  childName: string;
  verificationUrl: string;
  expiresAt: Date;
  consentMethod: string;
}

interface ConsentConfirmedData {
  parentName: string;
  childName: string;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  let html: string;
  let subject: string;

  switch (params.template) {
    case "consent_request":
      subject = `Parental consent needed for ${params.data.childName}'s BrightSteps account`;
      html = consentRequestTemplate(params.data);
      break;
    case "consent_confirmed":
      subject = `${params.data.childName}'s BrightSteps account is now active`;
      html = consentConfirmedTemplate(params.data);
      break;
  }

  if (!resend) {
    console.log(`[EMAIL DEV] To: ${params.to} | Subject: ${subject}`);
    return;
  }
  await resend.emails.send({ from: FROM, to: params.to, subject, html });
}

// ─────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────

function wrap(content: string, preheader: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1612">
<div style="display:none;font-size:0;line-height:0;max-height:0">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
  <tr><td align="center">
    <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E8E0D0">
      <tr><td style="padding:24px 28px;background:#1A1612;text-align:center">
        <span style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#FDFAF4">Bright<span style="color:#E8C87A">Steps</span></span>
      </td></tr>
      <tr><td style="padding:32px 28px">${content}</td></tr>
      <tr><td style="padding:20px 28px;background:#F5F0E8;font-size:12px;color:#7A6E5F;text-align:center">
        © 2026 Eduyro Education Inc. · <a href="${APP_URL}" style="color:#1B4F8A">eduyro.com</a><br>
        We comply with the Children's Online Privacy Protection Act (COPPA).
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function consentRequestTemplate(d: ConsentRequestData): string {
  const methodLabel = d.consentMethod === "CREDIT_CARD_MICROCHARGE"
    ? "$0.50 credit card charge (immediately refunded)"
    : d.consentMethod === "GOVERNMENT_ID"
    ? "Government-issued ID upload"
    : "Identity verification questions";

  const content = `
    <h2 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">Action required: parental consent</h2>
    <p style="font-size:15px;line-height:1.65;margin-bottom:8px">Hi ${d.parentName},</p>
    <p style="font-size:15px;line-height:1.65">Your child <strong>${d.childName}</strong> wants to use BrightSteps. Because they're under 13, U.S. federal law (COPPA) requires us to verify that you, the parent or guardian, give permission first.</p>
    <p style="font-size:15px;line-height:1.65">Until you verify, the account stays locked — no data collection, no emails to your child, nothing.</p>
    <div style="background:#F5E8C8;border-left:3px solid #C8902A;padding:14px 16px;margin:20px 0;border-radius:0 8px 8px 0">
      <p style="margin:0;font-size:14px;color:#8A5E10"><strong>Verification method:</strong> ${methodLabel}.</p>
    </div>
    <p style="margin:24px 0"><a href="${d.verificationUrl}" style="background:#1A1612;color:#FDFAF4;padding:14px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600">Verify consent →</a></p>
    <p style="font-size:13px;color:#7A6E5F">This link expires on ${format(d.expiresAt, "PPP 'at' p")} (${format(d.expiresAt, "z")}).</p>
    <hr style="border:none;border-top:1px solid #E8E0D0;margin:24px 0">
    <p style="font-size:12px;color:#7A6E5F;line-height:1.6"><strong>What we collect from ${d.childName} after consent:</strong> First name, age, and learning progress. We don't sell, share, or use this for advertising. You can revoke consent and delete the account anytime. Full policy: <a href="${APP_URL}/privacy" style="color:#1B4F8A">${APP_URL}/privacy</a></p>
  `;
  return wrap(content, `Verify parental consent for ${d.childName}'s BrightSteps account`);
}

function consentConfirmedTemplate(d: ConsentConfirmedData): string {
  const content = `
    <h2 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">✓ Consent confirmed</h2>
    <p style="font-size:15px;line-height:1.65">Hi ${d.parentName},</p>
    <p style="font-size:15px;line-height:1.65">Thanks for verifying — <strong>${d.childName}</strong>'s BrightSteps account is now active. They can start their placement test whenever they're ready.</p>
    <p style="margin:24px 0"><a href="${APP_URL}/parent" style="background:#1A1612;color:#FDFAF4;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Open parent dashboard →</a></p>
    <p style="font-size:13px;color:#7A6E5F">You can revoke consent and delete the account at any time from Settings → Privacy.</p>
  `;
  return wrap(content, `${d.childName}'s account is ready`);
}
