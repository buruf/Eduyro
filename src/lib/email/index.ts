// src/lib/email/index.ts
// Email service — Resend with HTML templates

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "Eduyro <noreply@eduyro.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";

// ─────────────────────────────────────────────
// Shared layout wrapper
// ─────────────────────────────────────────────

function wrapEmail(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Eduyro</title></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1612">
${preheader ? `<div style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden">${preheader}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px">
  <tr><td align="center">
    <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E8E0D0">
      <tr><td style="padding:24px 28px;background:#1A1612;text-align:center">
        <span style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#FDFAF4">Edu<span style="color:#E8C87A">yro</span></span>
      </td></tr>
      <tr><td style="padding:32px 28px">${content}</td></tr>
      <tr><td style="padding:20px 28px;background:#F5F0E8;font-size:12px;color:#7A6E5F;text-align:center">
        © 2026 Eduyro Education Inc. · <a href="${APP_URL}" style="color:#1B4F8A">eduyro.com</a><br>
        <a href="${APP_URL}/unsubscribe" style="color:#7A6E5F">Unsubscribe</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.error("[EMAIL FAIL]", e);
  }
}

// ─────────────────────────────────────────────
// Email templates
// ─────────────────────────────────────────────

export async function sendVerificationEmail(params: {
  email: string;
  firstName: string;
  token: string;
}) {
  const url = `${APP_URL}/api/auth/verify-email?token=${params.token}`;
  const html = wrapEmail(`
    <h2 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">Welcome, ${params.firstName}!</h2>
    <p style="font-size:15px;line-height:1.6;color:#1A1612">Please verify your email address by clicking the button below. This link expires in 24 hours.</p>
    <p style="margin:24px 0"><a href="${url}" style="background:#1A1612;color:#FDFAF4;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Verify my email →</a></p>
    <p style="font-size:13px;color:#7A6E5F">Or copy and paste this link: <br><a href="${url}" style="color:#1B4F8A;word-break:break-all">${url}</a></p>
  `, "Verify your BrightSteps account");
  await send(params.email, "Verify your BrightSteps account", html);
}

export async function sendWelcomeEmail(params: {
  email: string;
  firstName: string;
  role: string;
}) {
  const placementUrl = `${APP_URL}/placement`;
  const dashboardUrl = `${APP_URL}/${params.role.toLowerCase()}`;

  const nextStep = params.role === "STUDENT"
    ? `<p style="margin:16px 0"><a href="${placementUrl}" style="background:#C8902A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Take placement test →</a></p>`
    : `<p style="margin:16px 0"><a href="${dashboardUrl}" style="background:#1A1612;color:#FDFAF4;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Go to dashboard →</a></p>`;

  const html = wrapEmail(`
    <h2 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">Welcome to Eduyro, ${params.firstName} 👋</h2>
    <p style="font-size:15px;line-height:1.65">You're all set up. Self-paced mastery starts with one small step — and that step is finding the right starting level.</p>
    ${nextStep}
    <p style="font-size:13px;color:#7A6E5F;margin-top:24px">Questions? Just reply to this email — a real person reads every one.</p>
  `, `Welcome to Eduyro, ${params.firstName}`);
  await send(params.email, "Welcome to Eduyro", html);
}

export async function sendPasswordResetEmail(params: {
  email: string;
  firstName: string;
  token: string;
}) {
  const url = `${APP_URL}/reset-password?token=${params.token}`;
  const html = wrapEmail(`
    <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">Reset your password</h2>
    <p style="font-size:15px;line-height:1.6">Hi ${params.firstName}, click the button below to reset your password. This link expires in 1 hour.</p>
    <p style="margin:24px 0"><a href="${url}" style="background:#1A1612;color:#FDFAF4;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Reset password →</a></p>
    <p style="font-size:13px;color:#7A6E5F">If you didn't request this, you can safely ignore this email.</p>
  `, "Reset your Eduyro password");
  await send(params.email, "Reset your Eduyro password", html);
}

export async function sendLevelAdvanceEmail(params: {
  email: string;
  parentFirstName: string;
  childFirstName: string;
  oldLevelCode: string;
  newLevelCode: string;
  newLevelName: string;
  subjectName: string;
}) {
  const html = wrapEmail(`
    <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">🎉 ${params.childFirstName} just advanced a level!</h2>
    <p style="font-size:15px;line-height:1.65">${params.childFirstName} mastered <strong>Level ${params.oldLevelCode}</strong> in ${params.subjectName} and has been automatically advanced to <strong>Level ${params.newLevelCode} — ${params.newLevelName}</strong>.</p>
    <div style="background:#E3F2E8;border-left:3px solid #2D6A3F;padding:14px 16px;margin:20px 0;border-radius:0 8px 8px 0">
      <p style="margin:0;font-size:14px;color:#2D6A3F"><strong>What this means:</strong> Tomorrow's worksheets will use fresh material from the new level. ${params.childFirstName} is on track and showing strong mastery.</p>
    </div>
    <p style="margin:24px 0"><a href="${APP_URL}/parent" style="background:#1A1612;color:#FDFAF4;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">View progress →</a></p>
  `, `${params.childFirstName} advanced to Level ${params.newLevelCode}`);
  await send(params.email, `🎉 ${params.childFirstName} advanced to Level ${params.newLevelCode}`, html);
}

export async function sendDailyPacketEmail(params: {
  email: string;
  firstName: string;
  studentName: string;
  pdfUrl: string;
  sheetCount: number;
}) {
  const html = wrapEmail(`
    <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">📋 Today's packet is ready</h2>
    <p style="font-size:15px;line-height:1.65">${params.studentName}'s daily packet (${params.sheetCount} sheets) is ready to print and complete today.</p>
    <p style="margin:24px 0"><a href="${params.pdfUrl}" style="background:#C8902A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Download PDF →</a></p>
    <p style="font-size:13px;color:#7A6E5F">Target time: 30 minutes total. Submit answers in the dashboard or check the parent dashboard for results.</p>
  `, "Today's worksheet packet");
  await send(params.email, `Today's packet for ${params.studentName}`, html);
}

export async function sendStreakMilestoneEmail(params: {
  email: string;
  firstName: string;
  streakDays: number;
}) {
  const html = wrapEmail(`
    <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">🔥 ${params.streakDays}-day streak!</h2>
    <p style="font-size:15px;line-height:1.65">Hi ${params.firstName} — you've completed worksheets for <strong>${params.streakDays} days in a row</strong>. Consistency is the single biggest predictor of mastery, and you're showing up.</p>
    <p style="margin:24px 0"><a href="${APP_URL}/student" style="background:#C8902A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Keep the streak going →</a></p>
  `, `${params.streakDays}-day streak — keep going!`);
  await send(params.email, `🔥 ${params.streakDays}-day streak!`, html);
}

export async function sendPaymentFailedEmail(params: {
  email: string;
  firstName: string;
  amount: string;
  retryDate: string;
}) {
  const html = wrapEmail(`
    <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">Payment couldn't be processed</h2>
    <p style="font-size:15px;line-height:1.65">Hi ${params.firstName}, we weren't able to process your payment of <strong>${params.amount}</strong>. Your account is still active — we'll automatically retry on ${params.retryDate}.</p>
    <p style="margin:24px 0"><a href="${APP_URL}/parent/billing" style="background:#C23B22;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Update payment method →</a></p>
    <p style="font-size:13px;color:#7A6E5F">If we can't process payment after 3 attempts, your account will move to the free plan.</p>
  `, "Payment failed — update your card");
  await send(params.email, "BrightSteps payment failed", html);
}

export async function sendTrialEndingEmail(params: {
  email: string;
  firstName: string;
  childNames: string;
  trialEndsAt: Date;
  upgradeUrl: string;
}) {
  const dateStr = params.trialEndsAt.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
  const html = wrapEmail(`
    <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">Your free trial ends in 3 days</h2>
    <p style="font-size:15px;line-height:1.65">Hi ${params.firstName} — just a heads up that your Eduyro free trial ends on <strong>${dateStr}</strong>.</p>
    <div style="background:#FDF6E8;border-left:3px solid #C8902A;padding:14px 16px;margin:20px 0;border-radius:0 8px 8px 0">
      <p style="margin:0;font-size:14px;color:#8A5E1A">
        <strong>${params.childNames}</strong> ${params.childNames.includes(",") ? "have" : "has"} been building a daily practice habit.
        Subscribing keeps that momentum going — no interruption, no starting over.
      </p>
    </div>
    <p style="font-size:15px;line-height:1.65">Premium is <strong>$9.99/month</strong> for the first child — less than a single Kumon session.</p>
    <p style="margin:24px 0">
      <a href="${params.upgradeUrl}" style="background:#C8902A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600">Continue with Premium →</a>
    </p>
    <p style="font-size:13px;color:#7A6E5F">If you choose not to upgrade, your account will move to read-only on ${dateStr}. No data is deleted — you can always come back.</p>
  `, "Your free trial ends in 3 days");
  await send(params.email, "Your Eduyro free trial ends in 3 days", html);
}

export async function sendWeeklyProgressEmail(params: {
  email: string;
  firstName: string;
  weekOf: string;
  children: Array<{
    name: string;
    levelCode: string;
    levelName: string;
    subjectName: string;
    sheetsThisWeek: number;
    avgAccuracy: number | null;
    streak: number;
    newBadges: string[];
    daysUntilAdvance: number | null;
  }>;
}) {
  const childCards = params.children.map(child => {
    const accuracyColor = child.avgAccuracy != null
      ? child.avgAccuracy >= 95 ? "#2D6A3F" : child.avgAccuracy >= 80 ? "#C8902A" : "#C23B22"
      : "#7A6E5F";

    const badgeHtml = child.newBadges.length > 0
      ? `<p style="font-size:13px;color:#C8902A;margin:6px 0 0">🏅 New badge${child.newBadges.length > 1 ? "s" : ""} this week: ${child.newBadges.join(", ")}</p>`
      : "";

    const advanceHtml = child.daysUntilAdvance === 0
      ? `<p style="font-size:13px;color:#2D6A3F;margin:6px 0 0">🎉 Ready to advance to the next level!</p>`
      : child.daysUntilAdvance != null
      ? `<p style="font-size:13px;color:#7A6E5F;margin:6px 0 0">${child.daysUntilAdvance} day${child.daysUntilAdvance !== 1 ? "s" : ""} until level advance at 95% accuracy</p>`
      : "";

    return `
      <div style="background:#F5F0E8;border-radius:10px;padding:16px 18px;margin:12px 0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <div style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#1A1612">${child.name}</div>
            <div style="font-size:12px;color:#7A6E5F;margin-top:2px">${child.subjectName} · Level ${child.levelCode} — ${child.levelName}</div>
          </div>
          ${child.streak >= 3 ? `<div style="background:#C8902A;color:#fff;font-size:11px;font-weight:bold;padding:3px 8px;border-radius:20px">🔥 ${child.streak}-day streak</div>` : ""}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:#fff;border-radius:7px;padding:10px 12px;text-align:center">
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#1A1612">${child.sheetsThisWeek}</div>
            <div style="font-size:11px;color:#7A6E5F;margin-top:2px">sheets completed</div>
          </div>
          <div style="background:#fff;border-radius:7px;padding:10px 12px;text-align:center">
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:${accuracyColor}">${child.avgAccuracy != null ? `${child.avgAccuracy}%` : "—"}</div>
            <div style="font-size:11px;color:#7A6E5F;margin-top:2px">avg accuracy</div>
          </div>
        </div>
        ${badgeHtml}
        ${advanceHtml}
      </div>`;
  }).join("");

  const html = wrapEmail(`
    <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 4px">Weekly progress report</h2>
    <p style="font-size:13px;color:#7A6E5F;margin:0 0 20px">Week of ${params.weekOf}</p>
    <p style="font-size:15px;line-height:1.65;margin:0 0 8px">Hi ${params.firstName} — here's how your ${params.children.length > 1 ? "children" : "child"} did this week.</p>
    ${childCards}
    <p style="margin:24px 0">
      <a href="${APP_URL}/parent" style="background:#1A1612;color:#FDFAF4;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">View full dashboard →</a>
    </p>
    <p style="font-size:13px;color:#7A6E5F">Consistency is everything. See you next week.</p>
  `, `${params.children[0]?.name ?? "Your child"}'s weekly progress`);

  await send(params.email, `Weekly progress report — ${params.weekOf}`, html);
}
