# Go-Public QA Plan — fixing the defect classes once, not the defects one at a time

Written 2026-08-16, after the "Counting on" report (narration seemed to skip
the 8). Every production issue found in the last two weeks belongs to one of
five defect classes. Each class now has (or gets) a structural guard — a
mechanism that makes the whole class impossible or machine-caught, not a
one-off patch.

## The five defect classes, and their guards

### 1. Voice and picture disagree (sync, skipped/blurred numbers)
Examples: greeter waving before the voice; "narrator forgot the 8"; "4 ex 7".

- **Structural fix (done):** scene lengths are DERIVED from narration clip
  durations (`timeline.ts`) — voice and picture share one clock, so drift is
  impossible by construction, not by tuning.
- **Gate (done):** `scripts/check-video-audio.ts` — every number a script
  says must have an aligned spoken token in the synthesized clip, and
  consecutive numbers closer than 350 ms are flagged as blur risk. Runs over
  all 107 units.
- **Craft rule (done, enforced in generators):** never emit digit-ellipsis
  chains ("7… 8…"); enumerations are generated with word anchors
  ("then 7… then 8") from ONE helper, so narration and visual iterate the
  same list.
- **Honest limit:** alignment proves a token was synthesized, not that it is
  *audible* to a child. Prosody stays a human check — see §Human gate.

### 2. TTS mispronunciation ("Y as E", letter names)
- **Structural fix (done):** `speakable.ts` is the single choke point; bare
  variable letters are respelled to homophones (why/ex/em/bee/eff/jee),
  `f(x)` reads "f of x", operators read as words. Any new template inherits
  this for free because all voice builds pass through `speakable()`.

### 3. Label promises content it doesn't deliver
Examples: "no borrowing" sheets requiring borrowing; print titled "×2, ×5,
×10" over 2-digit multiplication; tutorial-title leaks (Jul).

- **Rule:** a label must derive from the SAME source as the content it
  describes. All three print paths now follow it (daily PDF parses the
  stored sheet title; shop and vacation PDFs derive title and problems from
  one sheet number).
- **Gate (done):** `scripts/check-regrouping-promise.ts` — 900 add/sub
  problems + 2,910 mul/div problems generated through the real engine and
  checked against their unit labels' promises, all four operations.
- **Gate (done):** `scripts/check-lesson-units.ts` + `check-lesson-coverage`
  — every dashboard-indexed video exists; every label resolves.

### 4. Untaught skills served to students
Example: Radiya's "no borrowing" sheets demanding borrowing-across-zero.

- **Gate (done):** the promise checker validates "taught-so-far" for table
  units (spiral review may only reach backward).
- **Signal (live):** TutorialEvent funnel — "old"-variant events are exactly
  the skills lacking videos; the log IS the worklist.

### 5. Ops drift (prod serving stale code)
- **Guard (done):** `verify-live-deploy.mjs` after every deploy; git main and
  prod now stay in sync (the Jul-21 class is closed). Media lives in Blob so
  video updates don't even need deploys.

## The release gate

`npm run audit:release` (added with this plan) chains, in order:
1. `check-regrouping-promise` — generator promises, 4 operations
2. `check-lesson-units` — video index ↔ files ↔ compositions
3. `check-video-audio` — narration numbers spoken and unblurred
4. `audit:lessons` — the existing 15-script content coherence suite

Rule: **no go-public announcement, and no video/content deploy, without a
green `audit:release`.** It runs in minutes and needs no judgment calls.

## The human gate (what machines cannot certify)

One reviewer (you) watches with three questions only — everything else is
machine-checked before it reaches the folder:
1. Does the voice SOUND right (prosody, pace, nothing swallowed)?
2. Does the explanation TEACH (would a child who didn't know it, know it)?
3. Is anything on screen distracting or wrong to the eye?

Mechanics: Desktop `eduyro-lesson-videos` + CHECKLIST.md, refreshed on every
render batch. Flag by filename; fixes re-render and re-upload without a
deploy. Spot-check per batch, not per video: every NEW template fully, plus
2-3 random re-renders.

## Standing rules for new work (the class-prevention habits)

- Every number a video says or shows derives from the unit declaration —
  never typed twice. (Enforced by review; violations are what §1/§3 catch.)
- Enumerations use the shared word-anchored helper, never joined digits.
- New templates must pass `audit:release` before their first upload.
- A label (video, sheet, print, tutorial) derives from the same source as
  its content, or it doesn't ship.
- After every `vercel`/git deploy: `verify-live-deploy.mjs`. No exceptions.
