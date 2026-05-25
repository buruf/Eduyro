# BrightSteps

> Mastery-based education for Pre-K to Grade 12. Print-first. AI-powered. Built to scale from one student to entire school districts.

**Status: Phases 1-3 & 5 complete.** Backend, frontend, cron jobs, realtime, Google Classroom, COPPA compliance, and content review tooling all built. Testing phase pending.

---

## What's in the box

### Phase 1 — Backend
- Auth (NextAuth + email/password + Google OAuth)
- 27-model Prisma schema covering students, parents, teachers, schools, curriculum, worksheets, progress, placement tests, PDFs, subscriptions, badges, notifications, integrations, COPPA, content review
- Worksheet engine across 42 levels (M1–M18, R1–R9, W1–W8, S1–S7)
- Adaptive CAT-style placement test
- Mastery tracking with auto-advancement at 95% × 5 days
- PDF generation (Puppeteer + S3 + school branding + bulk ZIP)
- Stripe payments (checkout, portal, webhooks, lifecycle)
- Resend email integration

### Phase 2 — Frontend
- 16 pages: homepage, auth flow, placement test, student/parent/admin dashboards, schools landing, PDF generator, error pages
- Component library (Button, Card, Input, Modal, Toggle, Progress, Avatar, Badge, StatCard, EmptyState)
- Marketing components (FAQ, sample worksheets, level ladder, curriculum tables, practice widgets)

### Phase 3 — Operations
- Cron jobs: daily packets (6am), streak maintenance (11:59pm), dunning (9am)
- Realtime via Pusher Channels (sheet completion, level advancement, badges, payments)
- Google Classroom integration (OAuth, roster sync, assignment posting, grade push)
- Admin tooling: manual cron triggers, audit log viewer, integration status

### Phase 5 — Content QA & Compliance
- **COPPA parental consent** — automatic age detection, parent verification via Stripe $0.50 micro-charge, locked accounts until verified, audit trail
- **Content review system** — admin queue with bulk approve/reject, per-problem flagging, rejection auto-deactivates worksheets
- **Scale content generator** — builds the full 12,400-worksheet library from level definitions, idempotent re-runnable
- **Real reading passages** — original passages at R5 (Grade 3–5) and R8 (Grade 6–8) with comprehension questions, vocabulary, answer keys
- **Real writing prompts** — W2, W5, W7, W8 with scaffolding for younger writers and rubrics for older

---

## Quick start

```bash
git clone <repo-url> brightsteps
cd brightsteps
npm install
cp .env.example .env.local
# Fill in DATABASE_URL and NEXTAUTH_SECRET at minimum

npm run db:migrate
npm run db:seed              # ~600 sample worksheets
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Building the full content library (optional)

```bash
npm run content:generate-sample      # 50 sheets per level (~2,100 total) — fast dev set
# OR
npm run content:generate-library     # full ~12,400 sheets — production library

npm run content:backfill-reviews     # mark existing seeded worksheets for review
```

The full library generates inactive worksheets (`isActive: false`) and creates ContentReview entries for each. They become active only after a curriculum specialist approves them at `/admin/content-review`.

---

## Routes

### Pages
| Route | Page |
|---|---|
| `/` | Homepage |
| `/placement` | Placement test |
| `/schools` | School licensing |
| `/pdf-generator` | Worksheet generator |
| `/signin` `/register` | Auth |
| `/forgot-password` `/reset-password` | Password recovery |
| `/coppa/verify?token=…` | Parent verification (COPPA) |
| `/student` | Student dashboard *(auth)* |
| `/parent` | Parent dashboard *(auth)* |
| `/admin` | Admin panel with 7 tabs *(teacher/admin)* |
| `/admin/content-review` | Curriculum specialist review queue *(admin)* |

### API endpoints
| Group | Endpoints |
|---|---|
| Auth | `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/verify-email` |
| Students | `/api/students/me/dashboard`, `/api/students/:id/submit-sheet` |
| Placement | `/api/placement/start`, `/api/placement/answer` |
| PDF | `/api/pdf/generate`, `/api/pdf/bulk` |
| Parents | `/api/parents/me/dashboard` |
| Admin | `/api/admin/dashboard`, `/api/admin/audit-log`, `/api/admin/run-job` |
| Notifications | `/api/notifications` (GET, PATCH) |
| Billing | `/api/checkout`, `/api/billing/portal`, `/api/webhooks/stripe` |
| Realtime | `/api/realtime/auth` |
| Integrations | `/api/integrations/status`, `/api/integrations/google-classroom/{connect,callback,courses,sync}` |
| Cron | `/api/cron/{daily-packets,streak-maintenance,dunning}` |
| COPPA | `/api/coppa/{initiate,setup-intent,verify,lookup}` |
| Content review | `/api/content/reviews`, `/api/content/reviews/:id`, `/api/content/reviews/bulk` |

---

## Scheduled jobs

Configured in `vercel.json`. Triggered automatically by Vercel Cron, or by any external scheduler with the `CRON_SECRET` Bearer token.

| Job | Schedule | What it does |
|---|---|---|
| `daily-packets` | 6:00 am daily | Generates PDFs, emails parents |
| `streak-maintenance` | 11:59 pm daily | Updates streaks, awards milestones |
| `dunning` | 9:00 am daily | Payment retry reminders, downgrades |

Admin can trigger any job manually at `/admin → Integrations tab`.

---

## Levels

Original M/R/W/S naming system (no third-party IP conflicts):

| Subject | Range | Examples |
|---|---|---|
| Mathematics | M1–M18 | M1 Counting → M5 Multiplication → M10 Pre-Algebra → M18 Calculus |
| Reading | R1–R9 | R1 Letters → R5 Comprehension → R9 Literary Analysis |
| Writing | W1–W8 | W1 Sentences → W5 Paragraphs → W8 Persuasive |
| Science | S1–S7 | S1 Life Science → S4 Matter → S7 Physics |

See `LEVEL_MIGRATION.md` for the full mapping.

---

## COPPA Compliance

Required for any U.S. student under 13. The flow:

1. **Registration** — if student's date of birth is under 13, account is created with `requiresCoppaConsent = true` and `coppaConsentStatus = PENDING`
2. **Lock** — child cannot sign in until parent verifies
3. **Initiate** — parent or registration UI calls `POST /api/coppa/initiate` to send the parent a verification email
4. **Verify** — parent clicks email link → lands on `/coppa/verify?token=...` → enters a credit card → BrightSteps charges $0.50 and immediately refunds it
5. **Approved** — account unlocks, child can sign in

Audit trail in `auditLog` table includes the Stripe payment intent ID as legal evidence of verifiable parental consent.

Alternative methods supported: government ID upload, knowledge-based authentication, school-teacher authorization (for school-managed accounts).

---

## Content review workflow

1. Worksheets generated via `npm run content:generate-library` are inactive by default
2. Each gets a `ContentReview` record with status `PENDING_REVIEW`
3. Curriculum specialist visits `/admin/content-review`
4. For each worksheet, they see all problems with the answer key, can flag individual problems with notes
5. Bulk approve/reject up to 500 at a time
6. Approved worksheets become `isActive: true` and enter circulation
7. Rejected worksheets are deactivated; flag notes preserved for the content team

---

## Environment variables

Minimum for local dev:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<32+ char random>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For full functionality:
```
# Auth (optional — email/password works without these)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
RESEND_API_KEY=
EMAIL_FROM="BrightSteps <noreply@brightsteps.com>"

# Stripe (also used for COPPA verification)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PREMIUM=
STRIPE_PRICE_SCHOOL_STARTER=
STRIPE_PRICE_SCHOOL_PLAN=
STRIPE_PRICE_DISTRICT=

# S3 (or Cloudflare R2)
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Cron (Phase 3)
CRON_SECRET=

# Realtime (Phase 3)
PUSHER_APP_ID=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# COPPA (Phase 5)
COPPA_VERIFICATION_AMOUNT_CENTS=50
```

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript check |
| `npm run db:migrate` | Apply schema migrations |
| `npm run db:seed` | Seed curriculum + ~600 sample worksheets |
| `npm run db:studio` | Prisma Studio (DB browser) |
| `npm run content:backfill-reviews` | Create review entries for existing worksheets |
| `npm run content:generate-sample` | Generate 50 worksheets per level (~2,100 total) |
| `npm run content:generate-library` | Generate full library (~12,400 worksheets) |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | Playwright E2E |

---

## What's still left

- **Phase 4 — Testing** — Jest unit tests + Playwright E2E flows targeting 80% coverage. Critical paths: registration → placement → student dashboard → worksheet submission → mastery progression. Auth flows. PDF generation. Stripe webhooks. Cron jobs.
- **Phase 6 — Beta launch** — 10 partner schools, free 30-day pilots, iterate based on feedback. Production deployment to Vercel + Neon + S3/R2 + Pusher + Stripe.

---

## License

Proprietary — © 2026 BrightSteps Education Inc.
