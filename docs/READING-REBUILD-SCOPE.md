# Reading rebuild — scope

Status: **scope only, nothing built.** Written Aug 3 2026 after a four-expert
review (reading/literacy, writing instruction, assessment/psychometrics,
consumer EdTech product).

---

## 1. Measured baseline (facts, not estimates)

Run against the live DB + generator on Aug 3 2026:

| Measure | Value |
|---|---|
| READING units in DB | 238 (60 modules R1–R60) |
| Units that serve a passage | 197 |
| Units with no passage | 41 (mostly R1–R2 phonics / sight words — correct) |
| **Distinct passages in the whole product** | **12** |
| Passage length | min 54 / median 79 / max 81 words — **identical at every grade** |
| Questions generated per sheet | 24 |
| `src/lib/content/reading-passages.ts` | 4 curated passages (R5, R8), **imported by nothing — dead** |

### What this means

1. **Length is the primary defect.** Research/assessment norms: G1 40–120 words,
   G2 120–250, G3–5 300–600, G6–8 600–900, G9–10 900–1,400. The product serves
   ~79 words at *every* level. At R50 that is roughly a tenth of the required
   volume of connected text.
2. **Repetition is the secondary defect.** 12 texts across 197 units means a
   child meets the same passages repeatedly over years.
3. **24 items on a 79-word passage cannot be 24 real questions.** The generator
   is necessarily producing filler, which teaches children that questions don't
   matter.
4. **Two dead assets duplicate one job**: the inline `readingPassages` bank
   inside `generator.ts` (12 passages, live) and `content/reading-passages.ts`
   (4 passages, better structured — readability levels, vocabulary — but unused).

---

## 2. Design decisions taken from the expert review

- **Two structurally different tracks.** Word-reading (decoding/fluency) and
  language comprehension are not the same activity. The model changes at ~R11.
- **Passages are shared per grade band; QUESTIONS are per unit-skill.** This is
  the only way the content volume is achievable, and it matches the previously
  approved "shared passage bank" amendment.
- **Item count drops from 24 to 6–10** for reading.
- **The advancement gate is NOT touched before public launch** (product risk),
  but the 90%/single-day rule is known to be wrong for comprehension and is
  scheduled for change immediately after (assessment risk). Accepted trade-off:
  for a period, the content is better than the decision rule.
- **No ASR-scored oral reading, ever, as a gate.** Child-speech recognition
  error rates are 2–3× adult and degrade further on accented speech — it would
  fail children for pronunciation, not reading.

---

## 3. Track A — Decodable / word-level (R1–R10, Grades 1–2)

Early reading is not a shorter version of comprehension. A passage a child
cannot decode teaches guessing from context (the discredited three-cueing
habit).

### A1. Phonics scope-and-sequence spine
Make the R1–R10 unit map follow an explicit sequence rather than generic
"Grade 1 reading": VC/CVC short vowels → digraphs (sh, ch, th, ck) → blends →
VCe (silent e) → vowel teams → r-controlled → syllable types → common suffixes.
Plus a controlled set of irregular high-frequency "heart words".

### A2. Decodable text
Sentences/short texts that are **≥80% decodable** given the phonics taught so
far. Needs a decodability checker (grapheme inventory per unit → % of words
decodable) so this is enforced, not asserted.

### A3. Word-level item types (new)
Reuse the existing math interactive value-graded pipeline:
- letter–sound matching
- "click the word that says /ship/" with orthographically near distractors
  (shop, chip, sip)
- word building with letter tiles (drag)
- word chains (sat → sit → sip → ship)
- real-vs-nonsense word sort (proves decoding, not memorisation)
- sentence–picture match

### A4. Session shape (G1–2, 12–15 min)
1. Phonics warm-up 2–3 min (8–10 items, incl. 2 nonsense words)
2. Word work 3 min (build/chain 5 words)
3. Decodable text 5 min (60–150 words; TTS models it, child reads, re-reads)
4. Comprehension 3–4 min — **4–6 items, not 24**

### Constraint
Phonemic awareness is inherently oral. On screen, approximate with
audio-in/visual-out (hear /sh-i-p/ → click "ship"). Production tasks belong on
the printable. Accept the ceiling.

---

## 4. Track B — Passage-first (R11–R60, Grades 3–10)

### B1. Passage library (THE dominant cost — see §6)
Grade-banded, correctly-lengthed, original content.

| Band | Passage length | Bank target |
|---|---|---|
| G3 (R11–R18) | 200–350 | ~15 |
| G4 (R19–R24) | 300–450 | ~15 |
| G5 (R25–R30) | 350–500 | ~15 |
| G6 (R31–R36) | 500–700 | ~15 |
| G7 (R37–R42) | 600–800 | ~15 |
| G8 (R43–R48) | 700–900 | ~15 |
| G9 (R49–R54) | 800–1,100 | ~15 |
| G10 (R55–R60) | 900–1,400 | ~15 + paired texts |

Target ≈ **120–135 passages**, ≥50% informational by G8, with paired texts
(two views on one topic) from G8 up.

### B2. Question sets per unit-skill
Each unit draws its questions from passages in its band, keyed to the unit's
skill (main idea / inference / vocab-in-context / structure / author's purpose).
At 8–10 questions × ~3 distinct sheets per unit, this is the second large
content cost.

### B3. New auto-gradable item types (beyond MC)
Passage + MC alone reproduces the same shallow loop with better scenery.
- **Evidence selection** — "click the sentence that proves your answer";
  graded against a span. Highest-value single addition: forces re-reading and
  defeats guessing.
- **Sentence ordering** — drag 5 events into sequence (reuse math drag).
- **Maze/cloze** — every 7th word replaced with 3 choices. A validated CBM
  comprehension measure and inherently passage-dependent.
- **Two-part evidence-based selected response** — Part A answer + Part B which
  quote supports it; both must be correct to score. Kills guessing.
- **Typed 1–2 sentence summary**, keyword-scored, **feedback-only, never a gate.**

### B4. Machine QA — `audit-passages.ts` (the Track A checker's equivalent)

Track A was only safe to draft with an LLM because `decodability.ts` could
mechanically reject bad text, and it did — it caught real errors in drafts *and*
two bugs in itself. Track B needs the same before a single passage is written.
**Build this first; it is the gate everything else is drafted against.**

Each passage carries its band, and each item carries an `evidence` string.

**Checkable mechanically (build all of these):**
1. **Length band** — word count inside the band's range (table in B1).
2. **Readability band** — Flesch–Kincaid grade within ±1 of target. Needs a
   syllable counter; standard and ~40 lines.
3. **Evidence span is verbatim** — every item's `evidence` must appear
   *character-for-character* in its passage. This is the workable proxy for
   passage-independence: an author who must quote the proving sentence cannot
   write a general-knowledge item. **This single rule does most of the work.**
4. **Answer is grounded** — the correct answer's content words must appear in
   the evidence span.
5. **Distractors are near-misses** — each distractor must draw content words
   from the passage. Random distractors are eliminable without reading.
6. **No format tells** — correct answer must not be the longest option;
   option lengths within a 2× ratio; correct-answer position balanced across the
   sheet (auto-generated sets drift to one position); no "all/none of the above".
7. **Skill mix per sheet** — ≥1 inference, ≥1 vocab-in-context, ≥1 evidence
   selection. Prevents a sheet of pure literal recall.
8. **Passage/band integrity** — a passage may never be served outside its band,
   and the three sheets of one day may not repeat a passage. *This is the gate
   that would have caught the current bug where R14 (G3), R31 (G6), R45 (G8) and
   R58 (G10) all serve the same 79-word bee passage.*
9. **Vocabulary load** — % of words outside a grade-appropriate common-word list,
   capped per band.

**NOT checkable mechanically — needs human spot-check (~10% sample per band):**
whether an "inference" item truly requires inference rather than recall; whether
the keyed answer is genuinely better than a defensible second choice; whether
the passage is worth a child's fifteen minutes. Budget for this review — the
machine gate makes drafting *safe*, not *good*.

### B5. Reader UI
- **Pagination, not scroll.** A child needs to see the end of the task.
- Line length 45–55 chars; 20–22px (G2–3) / 18–20px (G4–5); line height 1.6–1.75.
- Read-along with the existing cloned voice, three modes: *Read to me* /
  *Read with me* / *I read alone*. This is an existing competitive asset.
- Tap-a-word → pronunciation + child-level definition.
- Progress cue ("page 2 of 5", "then 6 questions").
- **Passage stays retrievable during questions** — comprehension is not a
  memory test.
- Minimum time-on-passage before questions unlock (a child answering 8 items in
  40 seconds did not read).

---

## 5. Cross-cutting fixes

1. **Item count 24 → 6–10** for reading (both tracks).
2. **Item-mastery guess-through bug** (`item-mastery.ts`, verified): latest-
   attempt-wins + 4-option MC gives a guessing child a 68% chance of a
   "mastered" mark within 4 exposures. Fix: require 2 consecutive corrects ≥24h
   apart; decay mastery after ~21 days unseen. *(Note: a later miss does
   downgrade, so it is not a pure one-way ratchet.)*
3. **Delete or absorb** `content/reading-passages.ts` — do not leave two
   passage stores.
4. **Move passages out of `generator.ts`** (3,177 lines) into a real content
   module keyed by grade band.
5. **Never re-serve an identical passage as remediation.** Repeat the *skill* on
   new text.

---

## 5b. Track B phasing — what ships in what order

Each phase is independently shippable and leaves the product working.

| Phase | Scope | Units | Ships |
|---|---|---|---|
| **B0** | `audit-passages.ts` + passage schema + band loader + item types. **No content.** | — | Gate + plumbing, dark |
| **B1** | Grades 2–3 band | 29 | First real passage-first band; proves the pipeline end-to-end on the smallest surface |
| **B2** | Grades 4–5 | 42 | |
| **B3** | Grades 6–8 | 75 | Largest band; paired texts begin at G8 |
| **B4** | Grades 9–10 | 51 | Paired texts + synthesis |
| **B5** | Reader UI (pagination, read-along, tap-a-word, min time-on-passage) | — | Can ship after B1 and improve every later band |
| **B6** | **Gate change** — 80% over 2-of-3 sessions + inference floor, replacing 90% single-day | — | Must ship with or before B3 |

**B0 is not optional and not reorderable.** Drafting 197 units of content
against a gate that doesn't exist yet is how the current bee-passage situation
happened.

**On B6:** adding rich passages *raises* content validity but makes a 90%
single-day cut **less** defensible, not more — the construct gets messier while
the decision rule stays brittle (24 items, testlet-dependent, ~7pt sampling
error). Shipping B1–B3 without B6 means better content behind a worse gate.

---

## 6. The real cost: content, not engineering

Engineering here is moderate and well-understood — new item types reuse the
existing interactive pipeline, and the reader UI is a contained component.

**The dominant cost is authoring ~120–135 original passages and ~1,000–1,400
questions**, correctly levelled, ≥50% informational at the upper bands.

Three sourcing options:

| Option | Pros | Cons |
|---|---|---|
| Hand-author | Highest quality, full rights control | Slowest by far |
| LLM-draft + human review + automated QA | Fast, scales to the volume needed | Needs a hard review gate; readability + decodability must be machine-verified |
| Public-domain / CC texts (upper grades) | Free, authentic, culturally rich | Rights diligence; breaks the current "all original content" position |

**Recommendation:** LLM-draft + machine QA (readability band check,
decodability check for Track A, passage-independence check for items) + human
spot-review. Preserve the all-original-content position — it is a real asset and
avoids a whole class of rights risk.

---

## 7. Sequencing

**Phase 1 — highest value, lowest risk, ship before launch**
- Item count 24 → 6–10 for reading
- Reader UI (pagination, typography, read-along, tap-a-word, min time-on-passage)
- Grade-banded passage lengths for the bands the current curriculum most uses
- Evidence-selection item type
- Item-mastery guess-through fix
- Gate untouched

**Phase 2 — immediately post-launch**
- Full passage library across all bands
- Remaining item types (ordering, maze/cloze, two-part EBSR)
- Passage-independence audit as a permanent gate (alongside `audit:lessons`)
- **Then** change the advancement rule: 80% across 2-of-3 sessions with an
  inference floor, replacing 90%/single-day for comprehension

**Phase 3 — Track A**
- Phonics spine, decodable text + checker, word-level item types for R1–R10

**Phase 4 — the measuring stick** (see separate note)
- Monthly cold-passage probe, WCPM, independent reading level, retention checks

---

## 8. Open decisions (need the owner)

1. **Content sourcing** — LLM-draft + QA, hand-authored, or public domain?
2. **Launch posture** — ship reading improved-but-partial, or hold Grades 6–10
   passage work until after launch and market Grades 1–5 first?
3. **Track A timing** — R1–R10 is where the youngest (and most price-sensitive
   new) users land. Phase 3 may deserve promotion above Phase 2.
4. **Science** — the product expert recommends dropping it to 2×/week and
   deprioritising entirely. Not addressed in this scope.
