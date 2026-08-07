# Tutorial Redesign Pilot — "Multiplying tens (20 × 3)" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pre-practice tutorial for exactly ONE unit — `mul-tens` ("Multiplying tens (20 × 3)") — with a ≤45-second, 5-beat, tap-gated, marble-animation tutorial, with `TutorialEvent` logging built FIRST so old-vs-new can be measured.

**Architecture:** A new `TutorialEvent` Prisma model + one upsert API route + a client logger hook, instrumenting BOTH the existing `ConceptTutorialModal` (variant `"old"`, giving the baseline skip rate) and a new self-contained `MulTensPilotTutorial` component (variant `"pilot"`). The student page routes to the pilot component only when the sheet's skill is the mul-tens unit. The pilot is a beat-index state machine; every advance is a child TAP; narration audio comes from the existing `/api/tts` route. The first-3-practice-problems scaffolding (P1 worked, P2 one blank, P3 two blanks) is done inside the existing `PracticeModal` behind the same skill check.

**Tech Stack:** Next.js 14 App Router, Prisma (`npm run db:push` — this repo does NOT use migration files), Tailwind CSS transitions (no new animation library), existing `/api/tts` ElevenLabs route, existing `withRateLimit`/`ok`/`err` helpers in `src/lib/api/helpers.ts` (NOTE: `withRateLimit` is async — always `await`).

## Global Constraints

- ONE number triple everywhere in the pilot: **20 / 3 / 60** (isomorphic closer uses 30 × 3 = 90). Any other number appearing in a teaching beat is a bug.
- Every beat transition is triggered by child TAP, never a timer. One object group moves at a time, ≤800 ms per motion.
- Voice narrates the MOTION, never reads on-screen text (redundancy principle). Total narration ≤45 s.
- No decorative motion during teaching beats; celebration only at the Beat-3 payoff and tutorial completion.
- Skip button: small, appears at ~4 s, labeled exactly **"I already know this"**, leads to a 3-problem check (pass = skip honored, miss = "Let me show you a quick way." → Beat 2).
- DO NOT build: leaderboards, timers-as-default, rewards for watching, unskippable tutorial, per-answer character lines, LLM lesson copy.
- Build must pass `npx prisma generate && npx next build` before any deploy. Deploy only from `C:\Users\buruf\Downloads\brightsteps-phase5\eduyro`; after `vercel --prod` run `node scripts/verify-live-deploy.mjs <dpl_id>`.
- Commit+push `main` after each task lands (git and prod must stay in sync — Jul 21 incident).

## File Structure

- `prisma/schema.prisma` — add `TutorialEvent` model (Modify)
- `src/app/api/tutorial-events/route.ts` — POST upsert endpoint (Create)
- `src/hooks/useTutorialLog.ts` — client logger hook (Create)
- `src/components/tutorial/ConceptTutorialModal.tsx` — instrument with variant `"old"` (Modify)
- `src/components/tutorial/pilot/MulTensPilotTutorial.tsx` — beat state machine + shell (Create)
- `src/components/tutorial/pilot/MarbleStage.tsx` — bags/marbles/rods SVG stage, all beats draw on it (Create)
- `src/components/tutorial/pilot/SkipCheck.tsx` — 3-problem "I already know this" check (Create)
- `src/components/tutorial/pilot/pilot-script.ts` — narration lines + beat copy, single source of the 20/3/60 triple (Create)
- `src/app/(dashboard)/student/page.tsx` — route mul-tens to pilot; scaffold P1–P3 in `PracticeModal` (Modify)
- `scripts/test-tutorial-events.mjs` — API round-trip test (Create)

---

### Task 1: TutorialEvent model + API route + round-trip test

**Files:**
- Modify: `prisma/schema.prisma` (append after the last model)
- Create: `src/app/api/tutorial-events/route.ts`
- Create: `scripts/test-tutorial-events.mjs`

**Interfaces:**
- Produces: `POST /api/tutorial-events` body `{ studentId, skillId, variant, runId, startedAt?, endedAt?, beatIndex?, tapCount?, skipTapped?, skipAtMs?, audioPlayedMs?, predictionAnswer?, predictionCorrect? }` → `{ success: true, data: { id } }`. Upserts on `runId` so the client can fire progressive updates for one tutorial run.

- [ ] **Step 1: Add the model**

```prisma
// One row per tutorial RUN (upserted by runId as the run progresses).
model TutorialEvent {
  id                String    @id @default(cuid())
  runId             String    @unique // client-generated uuid per open
  studentId         String
  student           Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  skillId           String    // engine unit id, e.g. "mul-tens"
  variant           String    // "old" | "pilot"
  startedAt         DateTime  @default(now())
  endedAt           DateTime?
  beatIndex         Int       @default(0) // furthest beat reached (0-4); old variant: 0=opened 1=narration-started 4=start-clicked
  tapCount          Int       @default(0)
  skipTapped        Boolean   @default(false)
  skipAtMs          Int?
  audioPlayedMs     Int       @default(0)
  predictionAnswer  String?
  predictionCorrect Boolean?

  @@index([studentId, skillId])
  @@index([skillId, variant])
}
```

Also add to `model Student`: `tutorialEvents TutorialEvent[]`

- [ ] **Step 2: Push schema** — Run: `npm run db:push` (targets the DATABASE_URL in `.env` — this is the prod DB, additive change only). Expected: "Your database is now in sync".

- [ ] **Step 3: API route**

```ts
// src/app/api/tutorial-events/route.ts
// Upserts one row per tutorial run; the client fires progressive updates
// (open → beat advances → end) keyed by a client-generated runId.
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, handleRouteError, parseRequest, withRateLimit } from "@/lib/api/helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const EventSchema = z.object({
  runId: z.string().min(8).max(64),
  studentId: z.string().min(1),
  skillId: z.string().min(1).max(64),
  variant: z.enum(["old", "pilot"]),
  endedAt: z.string().datetime().optional(),
  beatIndex: z.number().int().min(0).max(10).optional(),
  tapCount: z.number().int().min(0).max(500).optional(),
  skipTapped: z.boolean().optional(),
  skipAtMs: z.number().int().min(0).optional(),
  audioPlayedMs: z.number().int().min(0).optional(),
  predictionAnswer: z.string().max(16).optional(),
  predictionCorrect: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const limited = await withRateLimit(req, 60, 60_000); // beats arrive in bursts
    if (limited) return limited;
    const session = await getServerSession(authOptions);
    if (!session?.user) return err("Authentication required", 401, "UNAUTHORIZED");

    const parsed = await parseRequest(req, EventSchema);
    if ("status" in parsed) return parsed;
    const { runId, studentId, skillId, variant, endedAt, ...rest } = parsed.data;

    // The student must belong to the signed-in account (parent) or BE the account.
    const student = await prisma.student.findFirst({
      where: { id: studentId, OR: [{ userId: session.user.id }, { parent: { id: session.user.id } }] },
      select: { id: true },
    });
    // ^ ADJUST the where-clause to this repo's actual Student-ownership shape —
    //   copy it from src/app/api/students/[id]/submit-sheet/route.ts, which
    //   already solves "may this session write for this student".
    if (!student) return err("Student not found", 404, "NOT_FOUND");

    const row = await prisma.tutorialEvent.upsert({
      where: { runId },
      create: { runId, studentId, skillId, variant, ...rest, endedAt: endedAt ? new Date(endedAt) : undefined },
      update: {
        ...rest,
        endedAt: endedAt ? new Date(endedAt) : undefined,
        // beatIndex/tapCount only move forward
        ...(rest.beatIndex !== undefined ? {} : { beatIndex: undefined }),
      },
    });
    return ok({ id: row.id });
  } catch (e) { return handleRouteError(e); }
}
```

- [ ] **Step 4: Round-trip test script**

```js
// scripts/test-tutorial-events.mjs — direct-prisma check of the model + upsert
// semantics (route auth is exercised manually in the browser).
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const student = await prisma.student.findFirst({ select: { id: true } });
const runId = `test-${Date.now()}`;
await prisma.tutorialEvent.upsert({ where: { runId }, create: { runId, studentId: student.id, skillId: "mul-tens", variant: "pilot" }, update: {} });
await prisma.tutorialEvent.upsert({ where: { runId }, create: { runId, studentId: student.id, skillId: "mul-tens", variant: "pilot" }, update: { beatIndex: 3, tapCount: 7, predictionAnswer: "60", predictionCorrect: true } });
const row = await prisma.tutorialEvent.findUnique({ where: { runId } });
console.log(row.beatIndex === 3 && row.predictionCorrect === true ? "PASS" : `FAIL ${JSON.stringify(row)}`);
await prisma.tutorialEvent.delete({ where: { runId } });
await prisma.$disconnect();
```

- [ ] **Step 5: Run it** — `node scripts/test-tutorial-events.mjs` → Expected: `PASS`
- [ ] **Step 6: Build check** — `npx prisma generate && npx next build` → passes
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(tutorial-pilot): TutorialEvent model + upsert API"`

---

### Task 2: Client logger hook + instrument the OLD tutorial (baseline)

**Files:**
- Create: `src/hooks/useTutorialLog.ts`
- Modify: `src/components/tutorial/ConceptTutorialModal.tsx`

**Interfaces:**
- Produces: `useTutorialLog({ studentId, skillId, variant })` → `{ log: (patch: Partial<TutorialPatch>) => void, bumpTap: () => void, end: () => void }` where `TutorialPatch = { beatIndex?: number; skipTapped?: boolean; skipAtMs?: number; audioPlayedMs?: number; predictionAnswer?: string; predictionCorrect?: boolean }`. Fire-and-forget; batches via a 1 s debounce; flushes with `navigator.sendBeacon` on `pagehide`.

- [ ] **Step 1: Write the hook**

```ts
// src/hooks/useTutorialLog.ts
"use client";
import { useEffect, useMemo, useRef } from "react";

type TutorialPatch = {
  beatIndex?: number; skipTapped?: boolean; skipAtMs?: number;
  audioPlayedMs?: number; predictionAnswer?: string; predictionCorrect?: boolean;
};

export function useTutorialLog(opts: { studentId: string; skillId: string; variant: "old" | "pilot"; enabled: boolean }) {
  const runId = useMemo(() => crypto.randomUUID(), []);
  const pending = useRef<TutorialPatch & { tapCount?: number }>({});
  const taps = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = (final = false) => {
    if (!opts.enabled) return;
    const body = JSON.stringify({
      runId, studentId: opts.studentId, skillId: opts.skillId, variant: opts.variant,
      tapCount: taps.current, ...pending.current, ...(final ? { endedAt: new Date().toISOString() } : {}),
    });
    pending.current = {};
    if (final && navigator.sendBeacon) {
      navigator.sendBeacon("/api/tutorial-events", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/tutorial-events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  };

  const log = (patch: TutorialPatch) => {
    Object.assign(pending.current, patch);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => send(false), 1000);
  };
  const bumpTap = () => { taps.current += 1; };
  const end = () => { if (timer.current) clearTimeout(timer.current); send(true); };

  useEffect(() => {
    if (!opts.enabled) return;
    send(false); // creates the row on open
    const onHide = () => send(true);
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("pagehide", onHide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled]);

  return { log, bumpTap, end };
}
```

- [ ] **Step 2: Instrument `ConceptTutorialModal`** — add props `studentId: string` (thread it from `data.student.id` at the call site in `src/app/(dashboard)/student/page.tsx:603`) and inside the component:
  - `const tlog = useTutorialLog({ studentId, skillId: skillName, variant: "old", enabled: open && mode === "first" });`
  - When narration starts playing (the existing `NarrationConductor` onPlay / first audio ready): `tlog.log({ beatIndex: 1 })`; accumulate played ms into `audioPlayedMs` on pause/end.
  - On the "I get it — Start practising" click: `tlog.log({ beatIndex: 4 }); tlog.end();` then the existing `onStart()`.
  - On close/X without starting: `tlog.log({ skipTapped: true, skipAtMs: Date.now() - openedAtRef.current }); tlog.end();`
- [ ] **Step 3: Manual verify** — `preview_start` the dev server, open a student with a fresh skill, watch the tutorial, then `node -e "…prisma.tutorialEvent.findMany({ orderBy:{startedAt:'desc'}, take:1 }).then(console.log)"` → row with variant `"old"`, beatIndex 4, endedAt set. Repeat closing early → skipTapped true. This baseline data IS the pilot's control group — do not skip this task.
- [ ] **Step 4: Build + commit** — `npx next build` passes; `git commit -m "feat(tutorial-pilot): log old-tutorial funnel (baseline skip rate)"`

---

### Task 3: Pilot script constants + MarbleStage

**Files:**
- Create: `src/components/tutorial/pilot/pilot-script.ts`
- Create: `src/components/tutorial/pilot/MarbleStage.tsx`

**Interfaces:**
- Produces: `PILOT` const (all copy/numbers) and `<MarbleStage phase={...} onWave={...} />` where `phase` ∈ `"empty" | "bag1" | "grid20" | "bags3" | "wave1" | "wave2" | "wave3" | "rods" | "symbol"`. The stage is a single 640×360 SVG; phases are rendered declaratively so a tap simply sets the next phase and CSS transitions (≤800 ms) do the motion.

- [ ] **Step 1: Script file**

```ts
// src/components/tutorial/pilot/pilot-script.ts
// SINGLE source of the pilot's numbers and lines. 20 / 3 / 60 everywhere.
export const PILOT = {
  skillId: "mul-tens",
  skillLabel: "Multiplying tens (20 × 3)",
  a: 20, b: 3, answer: 60, iso: { a: 30, b: 3, answer: 90 },
  narration: {
    hook1: "Hey — I need your help with something.",
    hook2: "Twenty marbles.",
    hook3: "Guess how many marbles in all three bags. No counting!",
    reveal: ["Twenty…", "forty…", "sixty!"],
    compress: "Six tens. Six tens is sixty.",
    payoff: "Two times three is six — then put the zero back. Sixty.",
    handoff: "Your turn. Same idea.",
  },
  skipLabel: "I already know this",
  skipFailLine: "Let me show you a quick way.",
} as const;
```

- [ ] **Step 2: MarbleStage** — one SVG, marbles are `<circle>` elements with `style={{ transition: "cx .7s, cy .7s, opacity .5s" }}`; positions are computed per phase (bag cluster → 2×10 grid → 2×30 array columns 1-10/11-20/21-30 revealed by wave → six 1×10 vertical rods → fade under the symbol). Bags are emoji `🎒`-free — draw simple pouch paths. `onWave(n)` callback fires when wave n's marbles finish (use `onTransitionEnd` on the wave's last marble) so narration words can land ON the motion. No confetti here; the payoff sparkle lives in the beat component.
- [ ] **Step 3: Storybook-less visual check** — temporarily render `<MarbleStage>` on a scratch route or by hard-opening the (not yet written) pilot component in Task 4; real verification happens in Task 4's browser pass. Type-check now: `npx tsc --noEmit` passes.
- [ ] **Step 4: Commit** — `git commit -m "feat(tutorial-pilot): pilot script constants + marble SVG stage"`

---

### Task 4: MulTensPilotTutorial — beats 1–3 (hook / reveal / compress+payoff)

**Files:**
- Create: `src/components/tutorial/pilot/MulTensPilotTutorial.tsx`

**Interfaces:**
- Consumes: `useTutorialLog`, `MarbleStage`, `PILOT`, `/api/tts` (same fetch shape as `NarrationConductor`: `POST { text }` → audio blob).
- Produces: `<MulTensPilotTutorial open studentId onStart onClose />` — same call-site contract as `ConceptTutorialModal` minus concept/microLesson (the pilot is self-contained).

- [ ] **Step 1: State machine skeleton**

```tsx
type Beat = 0 | 1 | 2 | 3 | 4; // 0 hook, 1 reveal, 2 compress+payoff, 3 faded example, 4 isomorphic
const [beat, setBeat] = useState<Beat>(0);
const [phase, setPhase] = useState<Phase>("empty");
const tlog = useTutorialLog({ studentId, skillId: PILOT.skillId, variant: "pilot", enabled: open });
const advance = (b: Beat) => { tlog.bumpTap(); tlog.log({ beatIndex: b }); setBeat(b); };
```

Full-screen modal matching `ConceptTutorialModal`'s container classes (near-empty cream background, no cards). All "Tap to continue" affordances are one large pulsing button-region, never auto-advance.

- [ ] **Step 2: Beat 0 (Hook, 0–5 s):** on open play `hook1` audio, drop one bag (phase `bag1` → thud via a 60 ms scale bounce), tap → spill to `grid20` + `hook2`; two more bags thump in (`bags3`) + `hook3`; number pad (reuse the numeric keypad already inside `PracticeModal` — extract it to `src/components/practice/NumberPad.tsx` if it isn't standalone; if extraction is invasive, a local 0-9/⌫/✓ grid of `<button>`s is acceptable) appears immediately. On submit: `tlog.log({ predictionAnswer: v, predictionCorrect: v === "60" })`, friendly non-judgmental response either way ("Let's find out!"), tap → beat 1.
- [ ] **Step 3: Beat 1 (Reveal):** tap-gated start; phases `wave1→wave2→wave3`; play `reveal[n]` audio EXACTLY when `onWave(n)` fires (fetch all three clips during beat 0 so playback is instant). Track cumulative audio ms into `tlog.log({ audioPlayedMs })`.
- [ ] **Step 4: Beat 2 (Compress + payoff):** tap → `rods` + `compress` line; tap → `symbol` phase: "20 × 3 = 60" large, rods ghosted at 15% opacity behind; then the payoff overlay: small "2 × 3 = 6" appears, a lone "0" glyph animates (single 700 ms translate) from the 20 down to close the 60 while `payoff` audio plays. ONE small sparkle burst (~250 ms) here — the only decorative motion in the tutorial.
- [ ] **Step 5: Skip affordance:** after 4 s on beat 0, fade in a small top-right text button `PILOT.skipLabel`; clicking logs `{ skipTapped: true, skipAtMs }` and shows `<SkipCheck>` (Task 6). Wire the import now behind a `beat === "skip"` union member or a boolean flag.
- [ ] **Step 6: Browser verify (preview server):** temporarily force the student page to open the pilot (Task 7 wires it properly). Walk beats 0–2: every advance requires a tap, motions ≤800 ms, narration lands on waves. Check `TutorialEvent` row shows beatIndex 2, tapCount ≥ 5, predictionAnswer recorded.
- [ ] **Step 7: Build + commit** — `git commit -m "feat(tutorial-pilot): beats 0-2 (hook, reveal, compress+payoff)"`

---

### Task 5: Beats 3–4 (faded worked example + isomorphic 30 × 3)

**Files:**
- Modify: `src/components/tutorial/pilot/MulTensPilotTutorial.tsx`

- [ ] **Step 1: Beat 3 (completion problem):** show the SAME worked steps as `mul-tens`'s engine example (`"20 is 2 tens" / "2 tens × 3 = 6 tens" / "6 tens = ___"`) with the LAST step blank; number pad; wrong answer → gentle retry (no penalty, steps stay visible); correct → tap to beat 4.
- [ ] **Step 2: Beat 4 (isomorphic):** "30 × 3 =" alone, no steps. Correct → `tlog.log({ beatIndex: 4 }); tlog.end(); onStart();` (straight into practice, no interstitial). Wrong → reveal the same 3-step scaffold with 30/3/90 and let them finish it, then `onStart()`.
- [ ] **Step 3: Handoff audio** `PILOT.narration.handoff` plays on beat 4 entry.
- [ ] **Step 4: Browser verify** full run 0→practice; confirm the row: beatIndex 4, endedAt set, audioPlayedMs > 0. Time a real run: narration total ≤45 s.
- [ ] **Step 5: Build + commit** — `git commit -m "feat(tutorial-pilot): beats 3-4 (faded example + isomorphic handoff)"`

---

### Task 6: SkipCheck (3-problem legit-skip gate)

**Files:**
- Create: `src/components/tutorial/pilot/SkipCheck.tsx`
- Modify: `src/components/tutorial/pilot/MulTensPilotTutorial.tsx` (render it when skip tapped)

**Interfaces:**
- Produces: `<SkipCheck onPass onFail />` — three problems drawn from the mul-tens pool shape (hardcode `40 × 2`, `60 × 3`, `20 × 5` — same family, not the tutorial's own numbers), number-pad input, all-3-correct → `onPass`.

- [ ] **Step 1: Component** — three sequential problems, no timer, no penalty copy. All correct → `onPass` → parent logs nothing extra (skipTapped already logged) and calls `onStart()` (legit skip). Any miss → show `PILOT.skipFailLine` for one tap → `onFail` → parent resumes at beat 1 (reveal), NOT beat 0 (their guess already happened or was declined).
- [ ] **Step 2: Browser verify** both paths; check `TutorialEvent`: skip-pass run has skipTapped true + endedAt; skip-fail run continues and reaches beatIndex 4.
- [ ] **Step 3: Build + commit** — `git commit -m "feat(tutorial-pilot): skip check (pass=skip, miss=teach)"`

---

### Task 7: Wire routing + first-3-practice-problem scaffolding

**Files:**
- Modify: `src/app/(dashboard)/student/page.tsx` (tutorial call site ~line 602 and `PracticeModal` ~line 871)

**Interfaces:**
- Consumes: `MulTensPilotTutorial`, `PILOT.skillLabel`.

- [ ] **Step 1: Route the tutorial:** at the `conceptModal` render site, when `(conceptModal.sheet?.skillName ?? currentSheet?.skillName) === PILOT.skillLabel && conceptModal.mode === "first"`, render `<MulTensPilotTutorial>` instead of `<ConceptTutorialModal>` (review mode keeps the old modal — the pilot is a first-run experience). Every other skill: unchanged old modal (which now logs, giving within-child old-vs-new data across consecutive new skills — the spec's alternation method at n=2).
- [ ] **Step 2: Scaffold P1–P3 inside `PracticeModal`:** when `sheet.skillName === PILOT.skillLabel` and this is the student's first sheet on the skill (the same condition that made `mode === "first"` — thread a `scaffoldFirstThree: boolean` prop from the page), then for problem index 0 show the fully-worked 3 steps ABOVE the question with the answer visible and a single "Tap each step" reveal interaction (steps start dimmed, tap to light each, then type the shown answer); index 1 shows steps with the last blank; index 2 shows steps with two blanks; index ≥3 normal. Steps come from the engine example for the CURRENT problem's own numbers (recompute: `n is X tens / X tens × b = Y tens / Y tens = answer`), never hardcoded 20/3/60.
- [ ] **Step 3: Browser verify:** fresh mul-tens student → pilot tutorial → practice sheet: P1 worked, P2 one blank, P3 two blanks, P4 normal; a DIFFERENT skill still gets the old tutorial; a returning "Review tutorial" click on mul-tens gets the old modal.
- [ ] **Step 4: Build + commit** — `git commit -m "feat(tutorial-pilot): route mul-tens to pilot + scaffolded first 3 practice problems"`

---

### Task 8: Ship + measurement query

**Files:**
- Create: `scripts/tutorial-pilot-report.mjs`

- [ ] **Step 1: Report script** — prints, per variant: runs, completion rate (beatIndex ≥ 4), skip rate, median audioPlayedMs, prediction accuracy; and the primary metric scaffold: for each student × skill, first-try accuracy on problems 4–24 of the first sheet (join `CompletedSheet`/problem attempts — copy the accessor pattern from `scripts/audit-education-content.ts` or the submit-sheet route's stored shape). Completers vs skippers vs baseline (`variant = "old"`).
- [ ] **Step 2: Full build** — `npx prisma generate && npx next build` passes.
- [ ] **Step 3: Deploy** — user runs `vercel --prod` from `...\eduyro`; then `node scripts/verify-live-deploy.mjs <dpl_id>` must PASS.
- [ ] **Step 4: Commit + push main** — working tree clean, `main...origin/main` in sync.
- [ ] **Step 5: Pilot** — put it in front of the user's kids; primary metric per spec: first-try accuracy on problems 4–24, completers vs skippers vs baseline, within-child alternation across consecutive new skills.

## Self-Review notes

- Spec coverage: 5 beats ✔, logging-first ✔ (Tasks 1–2 before any UI), baseline skip rate ✔ (Task 2), skip gate ✔ (Task 6), P1–P3 scaffold ✔ (Task 7), hint-engine mistake content and the 190-unit refactor are explicitly POST-pilot (spec "AFTER the pilot") — intentionally absent.
- The one deliberate deviation: `TutorialEvent` is one upserted row per run rather than an append-only event stream — simpler, and every spec-named column is present.
- Ownership where-clause in Task 1 and the number-pad extraction in Task 4 are flagged to copy from existing code (`submit-sheet` route, `PracticeModal`) rather than guessed.
