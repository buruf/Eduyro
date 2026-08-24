// src/lib/email/client.ts
// One mail client, and one rule for what a MISSING API key means.
//
// The exported `resend` keeps its historical name and call shape
// (`resend.emails.send({ from, to, subject, html, reply_to })`) but is now
// provider-agnostic: BREVO_API_KEY selects Brevo's REST API (preferred — one
// Brevo account covers every domain), RESEND_API_KEY selects Resend, and
// with neither key it is null.
//
// Locally, no key is normal — mail prints to the console so a developer can
// read the link. In PRODUCTION it means a parent never receives their COPPA
// consent request, purchase download link or verification mail, and nothing
// anywhere says so. That must be loud, not a console line nobody reads.
import { Resend } from "resend";

export interface SendMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  reply_to?: string;
}

export interface Mailer {
  emails: { send(options: SendMailOptions): Promise<void> };
}

/** Splits `Name <addr@example.com>`; a bare address gets no display name. */
function parseFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^\s*(.*?)\s*<\s*(.+?)\s*>\s*$/);
  if (match && match[2]) {
    return match[1] ? { name: match[1], email: match[2] } : { email: match[2] };
  }
  return { email: from.trim() };
}

function makeBrevoMailer(apiKey: string): Mailer {
  return {
    emails: {
      async send(options: SendMailOptions): Promise<void> {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: parseFrom(options.from),
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.html,
            ...(options.reply_to ? { replyTo: { email: options.reply_to } } : {}),
          }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`Brevo responded ${res.status}: ${detail.slice(0, 200)}`);
        }
      },
    },
  };
}

function makeResendMailer(apiKey: string): Mailer {
  const client = new Resend(apiKey);
  return {
    emails: {
      async send(options: SendMailOptions): Promise<void> {
        await client.emails.send(options);
      },
    },
  };
}

function makeMailer(): Mailer | null {
  if (process.env.BREVO_API_KEY) return makeBrevoMailer(process.env.BREVO_API_KEY);
  if (process.env.RESEND_API_KEY) return makeResendMailer(process.env.RESEND_API_KEY);
  return null;
}

export const resend: Mailer | null = makeMailer();

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Eduyro <noreply@eduyro.com>";

export class EmailNotConfiguredError extends Error {
  constructor(subject: string) {
    super(
      `No mail provider key is set — refusing to silently drop the email "${subject}". ` +
        `Set BREVO_API_KEY or RESEND_API_KEY (and EMAIL_FROM) in the deployment environment.`,
    );
    this.name = "EmailNotConfiguredError";
  }
}

/**
 * Call when there is no mail client. Returns false in development (caller
 * logs and carries on); throws in production so the failure surfaces instead
 * of a parent waiting forever for mail that was never sent.
 */
export function handleMissingMailer(to: string, subject: string): false {
  if (process.env.NODE_ENV === "production") {
    console.error(`[EMAIL FAILED] no mail provider key — "${subject}" was NOT sent to ${to}`);
    throw new EmailNotConfiguredError(subject);
  }
  console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
  return false;
}
