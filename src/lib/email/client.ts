// src/lib/email/client.ts
// One Resend client, and one rule for what a MISSING API key means.
//
// Locally, no key is normal — mail prints to the console so a developer can
// read the link. In PRODUCTION it means a parent never receives their COPPA
// consent request, purchase download link or verification mail, and nothing
// anywhere says so. That must be loud, not a console line nobody reads.
import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Eduyro <noreply@eduyro.com>";

export class EmailNotConfiguredError extends Error {
  constructor(subject: string) {
    super(
      `RESEND_API_KEY is not set — refusing to silently drop the email "${subject}". ` +
        `Set RESEND_API_KEY (and EMAIL_FROM) in the deployment environment.`,
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
    console.error(`[EMAIL FAILED] no RESEND_API_KEY — "${subject}" was NOT sent to ${to}`);
    throw new EmailNotConfiguredError(subject);
  }
  console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
  return false;
}
