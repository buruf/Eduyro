// src/app/api/contact/route.ts
// POST /api/contact — school demo / sales lead capture.
// Emails the lead to the team inbox so requests are never silently dropped.

import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err, handleRouteError, parseRequest, withRateLimit } from "@/lib/api/helpers";
import { sendContactNotification } from "@/lib/email";

const ContactSchema = z.object({
  type: z.string().max(40).default("school_demo"),
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).default(""),
  school: z.string().max(160).default(""),
  email: z.string().email(),
  phone: z.string().max(40).default(""),
  students: z.string().max(80).default(""),
  city: z.string().max(120).default(""),
  message: z.string().max(2000).default(""),
});

const esc = (s: string) =>
  String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, 5, 60_000); // 5/min per IP
  if (limited) return limited;

  const parsed = await parseRequest(req, ContactSchema);
  if ("status" in parsed) return parsed;
  const d = parsed.data;

  try {
    const rows: [string, string][] = [
      ["Type", d.type ?? "school_demo"],
      ["Name", `${d.firstName} ${d.lastName ?? ""}`.trim()],
      ["School", d.school ?? ""],
      ["Email", d.email],
      ["Phone", d.phone ?? ""],
      ["Students", d.students ?? ""],
      ["City", d.city ?? ""],
      ["Message", d.message ?? ""],
    ];
    const html = `
      <h2 style="font-family:Georgia,serif;margin:0 0 12px">New ${esc(d.type ?? "school_demo").replace(/_/g, " ")} request</h2>
      <table style="font-size:14px;color:#1A1612;border-collapse:collapse">
        ${rows
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 12px 4px 0;color:#7A6E5F;vertical-align:top"><strong>${k}</strong></td><td style="padding:4px 0">${esc(v)}</td></tr>`
          )
          .join("")}
      </table>`;

    const { delivered } = await sendContactNotification({
      subject: `New school demo request — ${d.school || d.firstName}`,
      html,
      replyTo: d.email,
    });

    // Always succeed for the user (lead is logged even if email isn't configured),
    // but surface delivery status for observability.
    return ok({ received: true, delivered });
  } catch (error) {
    return handleRouteError(error);
  }
}
