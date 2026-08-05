# Eduyro — Launch Checklist

Work top-to-bottom on **launch day**. Items are grouped by severity. Everything
here is configuration/verification — the product code is built and deployed.

> Reminder: **Preview** and **Production** have separate env vars in Vercel.
> Keep Preview on Stripe **test** keys forever so you can keep testing safely;
> only **Production** flips to live keys at launch.

---

## 🔴 Blockers — must be done before taking real customers

- [ ] **Stripe → live mode (Production only).** In Vercel Production env, set the
      **live** values for:
  - [ ] `STRIPE_SECRET_KEY` → `sk_live_…`
  - [ ] `STRIPE_PUBLISHABLE_KEY` → `pk_live_…`
  - [ ] `STRIPE_PRICE_PREMIUM` and `STRIPE_PRICE_ADDITIONAL_CHILD` → **live** price IDs
        (live price IDs differ from test ones — recreate the products/prices in live mode)
  - [ ] `STRIPE_WEBHOOK_SECRET` → from a **live** webhook endpoint
  - [ ] Register the live webhook: Stripe Dashboard → Developers → Webhooks →
        endpoint `https://eduyro.com/api/webhooks/stripe`, events:
        `checkout.session.completed`, `customer.subscription.*`,
        `invoice.payment_succeeded`, `invoice.payment_failed`,
        `customer.subscription.trial_will_end`.
  - [ ] Redeploy Production. Confirm the cold-start log no longer shows the
        "PRODUCTION is using Stripe TEST keys" warning (guard in `src/lib/stripe/index.ts`).
  - [ ] Do one real end-to-end purchase (small pack), confirm webhook fires
        (Admin → Platform → Webhooks tab) and PDF is delivered, then refund.

- [ ] **Publish real legal documents.** Admin → Platform → **Legal** tab → publish
      current **Terms**, **Privacy**, and **COPPA/parental-consent** versions with
      counsel-reviewed wording. (Baseline placeholders were seeded so consent
      capture already works; replace them with the real documents.)

---

## 🟠 Should-fix before or shortly after launch

- [ ] **Google OAuth** — the sign-in page shows "Continue with Google" but
      `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are **not set in Production**.
      Either add live OAuth credentials (Google Cloud console → OAuth consent +
      credentials, redirect `https://eduyro.com/api/auth/callback/google`) **or**
      hide the Google button until configured.

- [ ] **Legacy shop packs (pre-S3, ~May).** Packs generated before S3 was added
      may 404 on download. Bump the pack cache version in
      `src/lib/shop/pack-cache.ts` (or regenerate) so all packs re-render to S3.

- [ ] **Confirm S3 / email are live** (already configured in Vercel: `AWS_*`,
      `RESEND_API_KEY`, `EMAIL_FROM`). Send a real verification + a real shop
      delivery email and confirm receipt.

---

## 🟡 Compliance / nice-to-have (worldwide product)

- [ ] **Cookie / tracking consent banner** — required (EU/UK ePrivacy) *before*
      adding analytics (e.g. PostHog). Not built yet.
- [ ] **Data-subject rights self-serve** — user-facing export + delete
      (GDPR/CCPA/LGPD). Admin already has delete; user-facing side not built.
- [ ] **Counsel review** of the per-country digital-consent age table
      (`src/lib/compliance/consent-age.ts`) and retention periods.
- [ ] **Self-registration DOB** — non-parent self-signup doesn't collect date of
      birth, so a minor self-signing-up isn't age-gated. Decide whether to add it
      (the parent add-child path *is* gated).

---

## ✅ Already done & deployed

- Worldwide consent capture at signup/add-child (jurisdiction + IP + version).
- Admin platform console areas 1–10 (incl. Stripe webhook deliverability monitor).
- Shop dispute tooling, vacation pack (real PDF), parent skip-sessions.
- Homepage aligned to the real worksheets + interactive practice.
- True/false stripped from printouts; lesson-page empty-example fixed.

---

## Ops notes

- Local `.env` `DATABASE_URL` points at **production Neon** — never run
  migrations/seeds/destructive writes locally. Schema changes go via `npm run db:push`.
- Vercel GitHub auto-deploy is flaky; deploy with `vercel --prod --yes`.
- Build gate: `prisma generate && next build` (ESLint can fail the build on unused
  vars / missing `key` props — fix, don't suppress).
