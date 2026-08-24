# Eduyro — project notes for Claude

## Deploy
- eduyro.com builds from git `main` (Vercel, project `eduyro`, team `eduyro-s-projects`).
- After ANY production deploy, run `node scripts/verify-live-deploy.mjs <dpl_id>` (accepts the `dpl_…` deployment id) and do not claim the deploy done until it passes.

## Email (migrated to Brevo, 2026-08-23)
- Client: `src/lib/email/client.ts` — the exported `resend` keeps its historical name and `.emails.send({from,to,subject,html,reply_to})` shape but is provider-agnostic: `BREVO_API_KEY` selects Brevo REST (preferred), `RESEND_API_KEY` selects Resend, neither → null (dev logs / loud prod failure via `handleMissingMailer`).
- Vercel production has `BREVO_API_KEY` + `EMAIL_FROM = Eduyro <noreply@eduyro.com>` (plus the old `RESEND_API_KEY` as fallback). Delivery is inbox-verified.
- `EMAIL_FROM` must stay on a Brevo-verified domain (eduyro.com is verified). The Brevo account's API IP-blocking is disabled — required for Vercel; do not re-enable.

## Known issues (as of 2026-08-23)
- 10 pre-existing jest failures on `main`, unrelated to email: `tests/integration/webhook-routing.test.ts` (Prisma mock missing `webhookEvent`), `tests/unit/higher-math-engine.test.ts` (M13 MC options assertion), `tests/unit/shop-pack-generator.test.ts` (beginner warmup ordering).
