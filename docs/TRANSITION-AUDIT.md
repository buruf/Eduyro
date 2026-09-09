# Lesson-transition audit — math M1–M18

*Sep 8 2026. Six reviewers (one per level band) read every lesson boundary a child can cross: the last sheet of the lesson just cleared, the micro-lesson that fires next morning, and the whole first sheet of the new lesson. Dumps were produced by `scripts/dump-transitions.ts`; the rubric was: untaught question shape, prerequisite gap, difficulty cliff, lesson-to-sheet mismatch, broken item.*

| | |
|---|---|
| transitions reviewed | 193 |
| judged clean | 62 |
| findings | 148 |
| blockers (child cannot do the first sheet from the lesson alone) | 13 |
| majors | 62 — all addressed in the second pass (Sep 9 2026): 57 fixed, 5 already resolved by 93dfc72 |
| minors | 73 — all addressed in the third pass (Sep 9 2026); two need a unit reorder and are mitigated instead |

## Root causes found in the engine (fixed, now gated by `scripts/audit-transitions.ts`)

1. **Missing-number forms ranked easier than the computation they hide.** `52 − ___ = 47` is `52 − 47`, a borrow, but carried no borrow penalty, so the opening sheet of "2-digit subtraction (borrowing)" was 30 of 30 missing-subtrahend items while the lesson taught direct borrowing. Penalties added; the missing form is now off every opening sheet, and off every sheet before the Fact-families lesson that teaches it.
2. **The opening difficulty window was too wide (35% of the pool).** Where the taught case is a minority of the pool (teen multipliers are 19% of 2-digit × 2-digit pairs), ordering alone cannot keep day one inside it. Window now opens at 20% and widens to 70%.
3. **Lesson lookup by label collided across operations.** "Mixed review" exists on M5 and M6; the M6 division review fired the M5 multiplication lesson. Lookup is now scoped to the level.
4. **Worked examples that depended on a later lesson** (factor before factoring exists, subtract before subtraction exists, group before grouping exists) — rewritten to use only what the child has.

## Systemic notes

*Second pass, Sep 9 2026: the three notes below were fixed — every M7–M18 unit now carries a real big idea; distractors are drawn only from the item's own template; the one-case examples were rewritten to cover the case the sheet asks. Remaining notes are kept for the record.*

- Every micro-lesson's *big idea* is its *goal* repeated verbatim (M3–M18). Harmless but useless; needs a per-unit idea or should be dropped from the modal.
- Multiple-choice distractor leakage across templates in M14–M18 (numbers from other question types, "True" inside numeric options).
- Grade 9–10 lessons often teach one case where the sheet asks the inverse (find a leg vs the hypotenuse; radians → degrees; root → factor). These are the majors below and are a content-authoring job per unit.

## Findings


### Blockers (13)

#### M2:Compare two-digit numbers → M3:Adding by counting on (+1, +2, +3)
- **untaught-shape** · **fixed** — engine: missing-number form removed from every lesson before Fact families; opening sheet of every unit is the direct form
- Evidence: Lesson: '7 + 2 = → 9 — Start at 7, count on 2: 8, 9'. The very first question on sheet 1 is '3 + ___ = 6 → 3', and 10 of 30 items are missing addends: '1 + ___ = 4', '2 + ___ = 4', '1 + ___ = 3', '2 + ___ = 5', '4 + ___ = 6', '2 + ___ = 3', '3 + ___ = 5', '1 + ___ = 5', '3 + ___ = 4'.
- Why the child is lost: This is the child's first ever encounter with '+', '=' and a sum, and a third of the sheet (including question 1) is the inverse problem, which the curriculum itself schedules as lesson 6 ('Fact families … missing addends') and lesson 10. Nothing in M1/M2 or this micro-lesson shows how to read '3 + ___ = 6' or how to count up to find the blank.
- Suggested fix: First sheet of counting-on: plain sums only (a + 1/2/3). Move missing addends out of lessons 1–5 into 'Fact families' where they are taught, or add a second worked example '3 + ___ = 6 — start at 3 and count up to 6: 4, 5, 6 — that is 3 jumps'.

#### M3:3-digit addition & three addends → M3:Missing addend & mixed review
- **prereq-gap** · **fixed** — lesson now teaches adding up (25 → 55 → 61, so 36) instead of the untaught subtraction
- Evidence: Lesson: '___ + 25 = 61 → 36 — 61 - 25 = 36'. Subtraction has not been taught anywhere in M1–M3, let alone 2-digit subtraction with regrouping. 20 of 29 items are this shape: '___ + 43 = 77', '___ + 28 = 71 → 43', '___ + 58 = 74 → 16', '___ + 55 = 83 → 28', '___ + 49 = 95 → 46', '___ + 19 = 44 → 25', '___ + 22 = 89 → 67'. Lesson video: NONE.
- Why the child is lost: The only method offered ('61 − 25') is an operation the child has never been shown, and most items need regrouping subtraction (71 − 28, 74 − 58, 83 − 55, 95 − 49). Counting up from 28 to 71 by ones is the only tool they own and it is not viable 20 times. The same untaught shape already leaked into the last sheets of lessons 7–9 ('___ + 14 = 25', '___ + 66 = 130', '___ + 410 = 966') without ever being taught.
- Suggested fix: Either move 2-digit missing addends until after M4 subtraction, or teach an addition-based method here: 'Count up by tens then ones: 25 → 35, 45, 55 (30), then 56…61 (6): 36', with a video. Keep first-sheet missing addends to no-regroup cases ('___ + 43 = 77', '___ + 22 = 47') and remove them from lessons 7–9 sheets.

#### M4:2-digit subtraction (no borrowing) → M4:2-digit subtraction (borrowing)
- **untaught-shape** · **fixed** — engine: missing forms rank above the direct borrow and are off the opening sheet — sheet 55 is now direct borrowing
- Evidence: Lesson: '52 - 27 = 25 — Ones: 2 - 7 borrow → 12 - 7 = 5; Tens: 4 - 2 = 2'. Sheet 55: ALL 30 questions are missing-subtrahend: '52 - ___ = 47 → 5', '80 - ___ = 43 → 37', '30 - ___ = 5 → 25', '54 - ___ = 5 → 49', '32 - ___ = 1 → 31'. Not one direct 'a - b' with borrowing.
- Why the child is lost: The child has never performed a single 2-digit borrow directly, and is immediately asked to find the missing number, which requires (a) realising the blank equals 52 − 47 (inverse reasoning only shown for facts to 18) and then (b) borrowing across a ten, including from a zero ('80 - ___ = 43', '30 - ___ = 5'), which the worked example does not cover. The lesson's own task type is absent from the sheet.
- Suggested fix: Sheet 55 should be 25-30 direct borrowing problems ('52 - 27', '61 - 8', '70 - 28') starting without zeros in the tens; move 'a - ___ = c' to the last sheets of this lesson (or to 'Missing number & mixed review'), and add a zero-tens example ('40 - 17') to the lesson before such items appear.

#### M4:2-digit subtraction (borrowing) → M4:3-digit subtraction (regrouping)
- **cliff** · **fixed** — engine: missing forms rank above the direct borrow and are off the opening sheet — sheet 55 is now direct borrowing
- Evidence: A last sheet: '70 - 28 → 42', '61 - 25 → 36', '88 - ___ = 67'. B first sheet (only 10 questions): 8 of 10 are 3-digit missing subtrahend: '914 - ___ = 618 → 296', '408 - ___ = 46 → 362', '320 - ___ = 156 → 164', '606 - ___ = 442 → 164'.
- Why the child is lost: One day the child does 2-digit; the next they must compute 914 − 618 and 408 − 46 (a 3-digit minus 2-digit with a zero in the tens, i.e. borrowing across zero) while also reversing a missing-subtrahend equation. Neither the direct 3-digit regroup nor the across-zero borrow has ever been practised.
- Suggested fix: Sheet 73 should be 10 direct 3-digit problems, no zeros, one regroup each ('542 - 372', '712 - 258'); introduce across-zero ('408 - 158') on a later sheet after the lesson shows it; leave missing-subtrahend for the review lesson.

#### M5:2-digit × 1-digit → M5:2-digit × 2-digit
- **prereq-gap** · **fixed** — opening window narrowed to 20% and multipliers of 20+ banded later — day one is teen multipliers like the example
- Evidence: Lesson: '23 × 14 = 322 — 23 × 4 = 92; 23 × 10 = 230; 92 + 230 = 322' (tens digit is 1, so the tens partial is just 'add a zero'). Sheet 85: '41 × 59 → 2419', '59 × 53 → 3127', '32 × 53 → 1696', '29 × 53 → 1537', '35 × 17 → 595', '20 × 62 → 1240'.
- Why the child is lost: To do 41 × 59 the child must compute 41 × 50 = 2050, i.e. a 2-digit number times a multiple of ten. 'Multiplying tens' only covered 1-digit × tens (20 × 3, 600 × 7); the lesson's only example dodges this by using ×14. Seven of ten items need a partial product the child has no method for, plus a 4-digit sum. The one child-friendly item is '11 × 4 = ?' multiple choice.
- Suggested fix: Sheet 85 should use multipliers 11–19 only ('23 × 14', '35 × 17', '14 × 11'), matching the example; add a lesson step for the general case ('23 × 40 = 23 × 4 tens = 92 tens = 920') and only then admit ×53 / ×59 on later sheets.

#### M6:÷10, ÷11, ÷12 → M6:Division with remainders
- **cliff** · **fixed** — quotients past 12 banded to later sheets
- Evidence: A last sheet: '84 ÷ 12 → 7', '77 ÷ 11 → 7', '48 ÷ 6 → 8' (all facts). Lesson: '29 ÷ 4 = 7 r 1 — 4 × 7 = 28; 29 - 28 = 1'. Sheet 59 (10 items): '73 ÷ 3 → 24 r 1', '70 ÷ 3 → 23 r 1', '66 ÷ 4 → 16 r 2', '62 ÷ 3 → 20 r 2', '86 ÷ 4 → 21 r 2', '44 ÷ 3 → 14 r 2'. Only '19 ÷ 5 → 3 r 4' and '28 ÷ 3 → 9 r 1' match the lesson.
- Why the child is lost: Six of ten items have TWO-DIGIT quotients. The child has only ever divided within the times tables (quotient ≤ 12); dividing 73 by 3 needs the larger-number method that is the NEXT lesson ('2-digit & 3-digit ÷ 1-digit'). The lesson's 'find the nearest fact, subtract' only works when a fact exists (4 × 7 = 28); there is no fact 3 × 24.
- Suggested fix: Restrict sheet 59 (and ideally the whole remainders lesson) to dividends within the fact range: '29 ÷ 4', '19 ÷ 5', '38 ÷ 6', '50 ÷ 7'. Introduce two-digit quotients only after the larger-number lesson, then combine remainders with them in Mixed review.

#### M6:Division with remainders → M6:2-digit & 3-digit ÷ 1-digit
- **lesson-mismatch** · **fixed** — quotients past 12 banded to later sheets
- Evidence: Worked example: '96 ÷ 6 = 16 — 6 × 16 = 96, so 96 ÷ 6 = 16'. Sheet 77: '105 ÷ 3 → 35', '168 ÷ 4 → 42', '268 ÷ 4 → 67', '380 ÷ 4 → 95', '213 ÷ 3 → 71', '368 ÷ 4 → 92'.
- Why the child is lost: The step is circular: it 'finds' 16 by already knowing 6 × 16 = 96. No procedure is given for a child who does not know 4 × 67 — no long division, no chunking ('268 = 240 + 28; 240 ÷ 4 = 60, 28 ÷ 4 = 7'), no place-value split. Then nine of ten items are 3-digit dividends, while the lesson example is 2-digit. A child cannot get from this lesson to '268 ÷ 4'.
- Suggested fix: Teach one explicit method in the steps, e.g. break the dividend into a friendly tens/hundreds chunk plus the rest ('96 ÷ 6: 60 ÷ 6 = 10, 36 ÷ 6 = 6, so 16'), and make sheet 77 2-digit dividends only ('96 ÷ 6', '84 ÷ 7', '95 ÷ 5'); move 3-digit to sheets 83+ with a 3-digit example.

#### M7:Identify fractions → M7:Equivalent fractions
- **untaught-shape** · **fixed** — example changed to 2/3 = ?/12 and a step for the ?-on-the-bottom form added
- Evidence: Lesson shows only the missing-NUMERATOR form: '1/2 = ?/4 → 2; 4 ÷ 2 = 2; 1 × 2 = 2'. The very first sheet question is the missing-DENOMINATOR form: '1/2 = 2/? → 4', followed by '1/3 = 2/? → 6', '1/4 = 2/? → 8', '3/5 = 6/? → 10', '3/6 = 6/? → 12', '1/3 = 4/? → 12', '2/3 = 8/? → 12', '3/4 = 9/? → 12', '4/5 = 12/? → 15' (9 of 18).
- Why the child is lost: The child's only method is 'divide the denominators, multiply the numerator'. Applied to '1/2 = 2/?' there is no second denominator to divide by, so half the sheet is unreachable and the 90% gate cannot be cleared from the lesson alone. Worse, the example's numbers coincide (4÷2=2 and 1×2=2 both give 2) so the child cannot tell which '2' is the answer.
- Suggested fix: Make sheet 10 missing-numerator only (move '?' in the denominator to sheet 12+), or add a second worked example '1/2 = 2/? : 2 ÷ 1 = 2, 2 × 2 = 4'. Change the example to one whose intermediate numbers differ (e.g. 2/3 = ?/12: 12 ÷ 3 = 4, 2 × 4 = 8). The video tag is cur-simplify-fractions — point it at an equivalent-fractions video.

#### M7:Understand percent → M7:Fractions ↔ percents
- **untaught-shape** · **fixed** — example is now 45% → 45/100 → 9/20, with the fraction → percent direction as a further step
- Evidence: Yesterday's last sheet taught '45% → fraction of 100 → 45/100', '55% → fraction of 100 → 55/100'. Today's sheet asks '45% → fraction → 9/20', '55% → fraction → 11/20', '35% → fraction → 7/20', '5% → fraction → 1/20', '15% → fraction → 3/20' (12 of 26 questions are percent → simplified fraction). The lesson shows only fraction → percent: '1/4 → percent → 25%; 1 ÷ 4 = 0.25 = 25%'.
- Why the child is lost: Half the sheet is a direction the lesson never shows, and its expected answer directly contradicts what the child was rewarded for 24 hours earlier (45/100 is now wrong, 9/20 is right, with no instruction to simplify). A child following both lessons faithfully fails the sheet.
- Suggested fix: Add a second worked example '45% → 45/100 → divide both by 5 → 9/20' and word the question 'Write 45% as a fraction in simplest form.' Grade 45/100 as correct or at least give the coaching hint 'simplify'. Consider splitting: sheet 79 fraction → percent only, sheet 80 percent → fraction.

#### M10:Expressions · Order integers → M10:Expressions · Evaluate (+/−)
- **prereq-gap** · **fixed** — negative results removed from the evaluate pool (integer subtraction is lesson 9)
- Evidence: Micro-lesson: 'x + 5, x = 3 → 8: Replace x with 3; 3 + 5 = 8'. Sheet 5: 'Evaluate x - 2 when x = 1 → -1', 'Evaluate x - 4 when x = 1 → -3', 'Evaluate x - 10 when x = 1 → -9', 'Evaluate x - 9 when x = 3 → -6', 'Evaluate x - 8 when x = 4 → -4' — 13 of 30 items have a negative result.
- Why the child is lost: Subtracting a larger number from a smaller one (1 − 10) is integer subtraction, which this level teaches in lesson 9 'Equations · Integer add & subtract' — seven lessons LATER. The child has only ever done whole-number subtraction where the answer is ≥ 0 and yesterday's lesson only ordered integers. 13 wrong out of 30 is 57%; the day cannot clear.
- Suggested fix: Either restrict sheets 5–7 to x ≥ b (non-negative results) and introduce negative results after the integer lesson, or move 'Integer add & subtract' to lesson 2 (right after 'Order integers') and add a subtraction example ('x − 4, x = 1 → 1 − 4 = −3: go 4 to the left of 1 on the number line').

#### M11:Graph a line → M11:Transformations on the plane
- **untaught-shape** · **fixed** — example lists all four rules: x-axis, y-axis, translate by (a, b), rotate 90° CCW
- Evidence: Worked example (only one): 'Reflect the point (3, 2) across the x-axis → (3, −2): Reflecting across the x-axis negates the y-coordinate'. Sheet 9 contains: 'Reflect the point (3, 2) across the y-axis → -3,2' (7 items), 'Translate the point (3, 2) by (2, −1) → 5,1' (5 items), 'Rotate the point (3, 2) 90° counterclockwise about the origin → -2,3' (2 items), 'Plot a triangle with vertices (1, 1), (4, 1), (1, 5) → 1,1;1,5;4,1' (3 items).
- Why the child is lost: 17 of 24 items are task types the lesson never mentions. Reflection across the y-axis is guessable; translation by a vector '(2, −1)' is new notation; a 90° rotation about the origin is a genuinely hard rule ((x, y) → (−y, x)) that no child derives on the spot; the triangle item is a new three-point interactive form. A child following the lesson alone can score at most 7/24 with certainty. The rotation and translation lines come with no method at all.
- Suggested fix: Split into 3 lessons (reflections both axes / translations / rotations + polygons), each with its own example, or at minimum give a four-line example (x-axis reflection, y-axis reflection, translation by (a, b) means add a to x and b to y, 90° CCW means (x, y) → (−y, x)). Also check the grid range: 'Translate (1, −4) by (2, −1) → 3,-5' may fall outside a ±4 grid.

#### M12:Divide by a monomial → M12:Polynomial long division
- **prereq-gap** · **fixed** — example now divides directly, checked with FOIL, instead of factoring (taught two lessons later)
- Evidence: Micro-lesson: 'Divide (x² + 5x + 6) ÷ (x + 2) → x + 3 — Factor the top: x² + 5x + 6 = (x + 2)(x + 3); Cancel the common (x + 2)'. First sheet: 'Divide (x² + 3x + 2) ÷ (x + 1) → x + 2', 'Divide (x² + 11x + 30) ÷ (x + 5) → x + 6' (30 questions, all of this form).
- Why the child is lost: The only method shown is 'factor the top', but factoring a trinomial is lesson 19 (Factor quadratic trinomials), two lessons later; the student has never factored anything yet. No long division is taught despite the title, so the student has no procedure at all for the first question.
- Suggested fix: Either move this lesson after 'Factor quadratic trinomials' (lesson 19), or teach the sheet's actual method: 'What times (x + 1) gives x² + 3x + 2? Start with x (x·x = x²), then find the constant: 2 ÷ 1 = 2 → x + 2; check by FOIL'. Show one worked example with that reverse-FOIL check since FOIL is the last skill they own.

#### M12:Factor quadratic trinomials → M12:Factor trinomials (a ≠ 1)
- **prereq-gap** · **fixed** — example uses guess-and-check with FOIL instead of grouping (taught three lessons later)
- Evidence: Micro-lesson: 'Factor 2x² + 7x + 3 — a·c = 6; two numbers multiply to 6 and add to 7: 6 and 1; Split & group: 2x² + 6x + x + 3 = 2x(x + 3) + 1(x + 3); (2x + 1)(x + 3)'. Prior lesson's last sheet was only 'Select all the factors of x² + 8x + 12 [options: (x + 2) | (x + 1) | (x + 6) | (x + 7)]' (multiple choice). First sheet: typed 'Factor 2x² + 3x + 1 → (2x + 1)(x + 1)', 'Factor 6x² + 5x + 1 → (2x + 1)(3x + 1)', 'Factor 9x² + 9x + 2 → (3x + 1)(3x + 2)'.
- Why the child is lost: The method relies on factoring by grouping, which is lesson 23 (three lessons later) — the student has never grouped. On top of that the student has never TYPED a factorization (the previous lesson was select-from-options only), so this is a jump from recognising factors to producing a two-binomial answer with a leading coefficient, in one day.
- Suggested fix: Move 'Factor by grouping' before this lesson (or at least teach 'split the middle term and group' inside this micro-lesson with two examples), and make the a = 1 lesson end with typed factorizations so the input form is already familiar. Start the first sheet with a = 2 only and c prime (2x² + 3x + 1, 2x² + 5x + 2) before mixing a = 3, 4, 6, 9.


### Majors (62)

#### M2:Place value — ones → M2:Skip counting by 2
- **untaught-shape** · **fixed** — skip-by-2 opens forward/even, shapes banded; example counts on and models counting back
- Evidence: Lesson shows only '2, 4, 6, ___ → 8' (forward, even, last blank; step 'Add 2 each time: 6 + 2 = 8'). Sheet 57 contains NO even-number sequence at all. It opens with '___, 37, 39, 41 → 35' (blank first, so the child must go backwards), has 8 backward sequences ('29, 27, 25, ___ → 23', '35, 33, 31, ___ → 29'), 13 middle/first-blank items ('21, ___, 25, 27', '___, 11, 13, 15 → 9'), and all forward items are odd ('3, 5, 7, ___', '23, 25, 27, ___').
- Why the child is lost: The child was shown one shape (forward from 2) and meets three others on question 1. Backward skip counting and a leading blank need 'take away 2', which is never modelled; and the lesson's own step uses '6 + 2 = 8' before addition has been taught (addition starts at M3). A child cannot map '2,4,6' onto '___, 37, 39, 41'.
- Suggested fix: First sheet: forward, last-blank, mostly even sequences (as in the lesson), introduce odd starts mid-sheet, and move backward/leading-blank items to later sheets. Add a second worked example for a backward sequence ('20, 18, 16, ___ — count back 2: 15, 14') and phrase the step as counting on two ('6, then 7, 8') rather than '6 + 2 = 8'.

#### M2:Skip counting by 2 → M2:Skip counting by 5
- **prereq-gap** · **fixed** — skip-by-5 capped at 100 on early sheets; example adds 'ends in 5 or 0' and count-back
- Evidence: Every M1/M2 lesson so far is 'to 100' (the after-lesson's last sheet peaks at 'after 99 → 100'). Sheet 69 asks '100, 105, 110, ___ → 115', '___, 105, 110, 115 → 100', '120, 115, 110, ___ → 105', '115, 110, 105, ___ → 100', '110, 105, 100, ___ → 95', '100, ___, 110, 115 → 105'. The lesson example is '5, 10, 15, ___ → 20'.
- Why the child is lost: Numbers beyond 100 have never been named, read or written; place value was taught for two digits only. The child cannot tell how 105 is written or that 110 follows it, and 7 of 36 items live above 100 with a lesson that stops at 20.
- Suggested fix: Cap the first sheet at 100 (0–100 gives 21 multiples, plenty for 36 items), keep 100+ for later sheets after M2 (or an explicit 'numbers past 100' example). Also add a backward example ('30, 25, 20, ___') since 15 of 36 items count back or lead with the blank.

#### M3:Doubles (1+1 … 9+9) → M3:Adding zero & turnarounds
- **lesson-mismatch** · **fixed** — example now 4 + 0 = 4 / 0 + 4 / turnaround by counting on from the bigger
- Evidence: Worked example: '3 + 5 = 5 + ___ → 3 — Order doesn't change the sum'. Sheet 9 has zero turnaround items of that shape. Instead it asks '0 + ___ = 2 → 2', '0 + ___ = 1', '0 + ___ = 0 → 0', '0 + ___ = 4', '5 + ___ = 5 → 0', '4 + ___ = 4 → 0', '3 + ___ = 3 → 0', plus '3 + 0', '0 + 4', '5 + 0', '2 + 0', '0 + 3'. Adding zero is never mentioned in the micro-lesson.
- Why the child is lost: The one example teaches a task that never appears, and the task that fills the sheet (adding zero, and 'what do I add to 5 to still get 5?') is not shown at all. A child who has only counted on 1, 2, 3 has no model for '+0' and will guess 1 for '5 + ___ = 5' and be stuck on '0 + ___ = 0'.
- Suggested fix: Give two examples: '4 + 0 = 4 — adding nothing changes nothing' and '5 + ___ = 5 → 0 — you added nothing'. If turnarounds are meant to be on this sheet, generate some ('3 + 5 = 5 + ___'); otherwise drop the turnaround example.

#### M3:2-digit addition (regrouping) → M3:3-digit addition & three addends
- **untaught-shape** · **fixed** — sums reaching 1000 banded later; a three-addend step added to the example
- Evidence: Goal says 'chaining three numbers' but the only example is two addends ('248 + 167 → 415'). Sheet 65 opens with '15 + 34 + 15 → 64'.
- Why the child is lost: The child has only ever added two numbers; nothing shows how to add a third (add the first two, then the third; or add the ones column of three digits). It is question 1.
- Suggested fix: Add a worked example for three addends ('15 + 34 + 15: 15 + 34 = 49, 49 + 15 = 64'), or put three-addend items after several two-addend items.

#### M3:2-digit addition (regrouping) → M3:3-digit addition & three addends
- **cliff** · **fixed** — sums reaching 1000 banded later; a three-addend step added to the example
- Evidence: A: '88 + 49 → 137', '43 + 79 → 122' (largest sums ~137). B: 6 of 10 items have four-digit answers: '746 + 304 → 1050', '950 + 746 → 1696', '644 + 644 → 1288', '406 + 814 → 1220', '916 + 440 → 1356'. Lesson example stays under 1000 ('415').
- Why the child is lost: In one day the child goes from sums under 140 to writing 1000s numbers they have never seen (M2 stopped at 100; 3-digit numbers were only met incidentally). Carrying out of the hundreds into a new thousands place — and the 0 in 1050 — is never shown.
- Suggested fix: First sheet: 3-digit + 3-digit with sums under 1000 (as the example), one or two three-addend items late in the sheet; introduce sums over 1000 on later sheets with an example that carries into the thousands.

#### M3:Missing addend & mixed review → M4:Subtracting by counting back (−1, −2, −3)
- **untaught-shape** · **fixed** — lesson now teaches adding up (25 → 55 → 61, so 36) instead of the untaught subtraction
- Evidence: Lesson: '9 - 2 = 7 — Count back 2 from 9: 8, 7'. Sheet 1 has 12 of 30 as missing subtrahend: '6 - ___ = 3 → 3', '3 - ___ = 0 → 3', '4 - ___ = 1 → 3', '2 - ___ = 0 → 2'.
- Why the child is lost: This is the child's first-ever subtraction day and the very second question is a missing-subtrahend equation. The lesson only shows a plain 'a - b = ?' count-back; nothing tells the child that the blank means 'how many did I count back'. M3's '___ + 91 = 176' is a different operation and a different position.
- Suggested fix: Sheet 1 of counting back should be plain 'a - b' only (missing-subtrahend belongs in 'Fact families' or after a few sheets). Alternatively add a second worked example '5 - ___ = 3: count back from 5 to 3: 4, 3 = 2 steps, so the blank is 2'.

#### M4:2-digit subtraction (borrowing) → M4:3-digit subtraction (regrouping)
- **lesson-mismatch** · **fixed** — engine: missing forms rank above the direct borrow and are off the opening sheet — sheet 55 is now direct borrowing
- Evidence: Worked example '403 - 158 = 245' steps: 'Borrow across to subtract ones and tens' / 'Answer: 245'.
- Why the child is lost: The steps contain no method: no ones column (3 - 8 needs a ten, but the tens digit is 0 so you must go to the hundreds), no tens column, no hundreds column. The child is shown an across-zero borrow — the hardest case — with zero explanation, then must do it on the sheet.
- Suggested fix: Write column-by-column steps like the 2-digit lesson does ('Ones: 3 - 8, borrow → 13 - 8 = 5; Tens: 9 - 5 = 4 (the 0 became 9 after borrowing from the hundreds); Hundreds: 3 - 1 = 2') and use a no-zero first example ('542 - 178') before the across-zero one.

#### M4:Missing number & mixed review → M5:×2, ×5, ×10 (skip counting)
- **untaught-shape** · **already resolved by 93dfc72** — sheet 1 plain a × b since 93dfc72
- Evidence: Lesson: '5 × 6 = 30 — Skip-count by 5: 5,10,15,20,25,30'. Sheet 1 opens with '2 × ___ = 6 → 3' and has 11 of 30 missing-factor items: '2 × ___ = 10', '10 × ___ = 10', '5 × ___ = 20', '5 × ___ = 15'.
- Why the child is lost: This is the child's first day ever seeing the × symbol. The very first question asks for a missing factor, which requires knowing that the blank means 'how many skips', something the lesson never states. Many children will write 4 (6 − 2) or 8 (6 + 2).
- Suggested fix: Make sheet 1 plain 'a × b' only; introduce '2 × ___ = 6' on sheet 3+ after adding a worked example 'Skip-count by 2 until you reach 6: 2, 4, 6 — that took 3 skips, so the blank is 3'.

#### M5:×2, ×5, ×10 (skip counting) → M5:×1 and ×0
- **untaught-shape** · **fixed** — step '0 × 7 = 0: zero groups of 7' added
- Evidence: Worked example only: '7 × 1 = 7 — Any number times 1 is itself'. Sheet 7 has 12 ×0 items: '0 × 7 → 0', '0 × 9 → 0', '0 × 11 → 0', '0 × 10 → 0'.
- Why the child is lost: ×0 is a classic misconception (children answer 0 × 7 = 7 by analogy with 7 × 1 = 7 and 7 + 0 = 7). The lesson text names ×0 in the goal but shows no example, so a child who reasons from the one example given will get 12 of 30 wrong.
- Suggested fix: Add a second worked example: '0 × 7 = 0 — zero groups of 7 is nothing, so 0' (skip-count zero times).

#### M5:×1 and ×0 → M5:Square facts (n × n)
- **cliff** · **fixed** — squares ≥ 6 held off the opening sheet; example teaches ×5-plus-one
- Evidence: A last sheet: '1 × 11 → 11', '0 × 9 → 0'. B first sheet: '6 × 6 → 36', '8 × 8 → 64', '9 × 9 → 81', '7 × 7 → 49', '11 × 11 → 121', '7 × ___ = 49', '8 × ___ = 64', '9 × ___ = 81'. Lesson step: '6 sixes = 36'.
- Why the child is lost: After ×2/×5/×10 and ×1/×0 the child is handed 6×6, 7×7, 8×8, 9×9 and 11×11 as pure recall with no strategy (the step just restates the answer). None of these facts have been built yet (×3/×4 and ×6–×9 come later), so this day is memorise-eight-new-facts-cold. 11 × 11 = 121 is beyond anything in the level so far.
- Suggested fix: Either move Squares after '×6, ×7, ×8, ×9', or give the lesson a strategy (e.g. '7 × 7: 7 × 5 = 35 and 2 more sevens = 14, so 49') and keep sheet 10 to squares ≤ 5×5 plus 10×10, with 6×6–9×9 and 11×11 arriving on sheets 11–12.

#### M5:×6, ×7, ×8, ×9 (the hard facts) → M5:Fact families & missing factor
- **lesson-mismatch** · **fixed** — steps rewritten without ÷ (count sixes to 48)
- Evidence: Worked example: '6 × ___ = 48 → 8 — 48 ÷ 6 = 8'. Division (÷) is first taught on level M6; nowhere on M1–M5 has the child seen the ÷ symbol.
- Why the child is lost: The only method offered uses an operation the child has never met, so the lesson teaches nothing usable and may confuse. The sheet itself is doable (all items are missing factors of known facts, e.g. '4 × ___ = 20', '9 × ___ = 27'), so the child is not stuck, but the lesson is.
- Suggested fix: Rewrite the step without ÷: '6 × ___ = 48: count sixes until you reach 48 — 6, 12, 18, 24, 30, 36, 42, 48 is 8 sixes' or 'Which number times 6 makes 48? 6 × 8 = 48, so 8'.

#### M5:Mixed review → M6:÷2, ÷5, ÷10
- **untaught-shape** · **fixed** — tables mixed by quotient; missing-divisor taught in Fact families
- Evidence: Lesson: '30 ÷ 5 = 6 — 5 × 6 = 30, so 30 ÷ 5 = 6'. Sheet 1 (26 items) has 11 missing-divisor items, the second question being '6 ÷ ___ = 3 → 2', then '12 ÷ ___ = 6', '8 ÷ ___ = 4', '20 ÷ ___ = 10', '5 ÷ ___ = 1 → 5'.
- Why the child is lost: First day the child ever sees ÷ and question 2 asks for the divisor. The lesson never explains what the blank in 'a ÷ ___ = c' means or that you find it by asking '___ × 3 = 6'. Many will answer 3 or 9.
- Suggested fix: Sheet 1 plain 'a ÷ b' only (and actually include ÷5 and ÷10 — the sheet is almost all ÷2); add a worked example for the missing divisor before it appears ('6 ÷ ___ = 3: what times 3 makes 6? 2 × 3 = 6, so 2').

#### M6:2-digit & 3-digit ÷ 1-digit → M6:Mixed review
- **broken** · **fixed** — lesson teaches splitting (60 + 36); three-digit dividends capped so the opening sheet is two-digit
- Evidence: Micro-lesson for the DIVISION level's Mixed review: 'goal: Multiplies fluently across all types', worked example '38 × 7 = 266 — 7 × 8 = 56 → 6 carry 5; 7 × 3 = 21 + 5 = 26'. Identical to M5's Mixed review lesson. Sheet 93 is division: '21 ÷ 4 → 5 r 1', '61 ÷ 2 → 30 r 1', '___ ÷ 3 = 2 → 6'.
- Why the child is lost: The child is shown a multiplication lesson and then given a division sheet; the lesson is a copy-paste of M5's. The sheet itself is manageable (remainders + facts), though the missing-dividend shape '___ ÷ 3 = 2' has never appeared on any earlier sheet (only in the lesson-6 example).
- Suggested fix: Replace with a division example covering the two shapes on the sheet, e.g. '73 ÷ 4 = 18 r 1 — 4 × 18 = 72, 73 - 72 = 1' and '___ ÷ 3 = 2: 3 × 2 = 6'.

#### M7:Identify fractions → M7:Equivalent fractions
- **cliff** · **fixed** — example changed to 2/3 = ?/12 and a step for the ?-on-the-bottom form added
- Evidence: A: '3 out of 8 → 3/8', '[[viz tri 4 8]] → 4/8', '1 out of 12 → 1/12'. B: '5/6 = ?/12 → 10', '4/5 = 12/? → 15'.
- Why the child is lost: Yesterday the child only ever named a fraction from a picture or words; nothing so far has shown that two different fractions can be the same amount (the 'Comparing fractions with pictures' sheet has no equal pairs). Equivalence is introduced as a pure number trick with no picture bridge.
- Suggested fix: Add an '=' case to the comparing-with-pictures lesson (e.g. [[viz cmp 1 2 3 6]] → equal) and open sheet 10 with picture-backed pairs ('[[viz cmp 1 2 2 4]] 1/2 = ?/4') before bare symbols.

#### M7:Equivalent fractions → M7:Compare fractions
- **prereq-gap** · **fixed** — example changed to 2/3 = ?/12 and a step for the ?-on-the-bottom form added
- Evidence: Lesson: '2/3 ___ 3/5 → >; Common denominator 15: 10/15 vs 9/15' — 15 appears from nowhere. Sheet: '2/4 ___ 5/8 → <', '1/5 ___ 1/6 → >', '2/4 ___ 2/5 → >', '3/5 ___ 1/6 → >', '2/3 ___ 4/8 → >', '3/6 ___ 6/8 → <', '1/3 ___ 9/10 → <'. Also '1/2 ___ 3/6 → =' while the lesson shows only '>'.
- Why the child is lost: Finding a common denominator (LCM) has never been taught; the equivalent-fractions lesson always handed the child the target denominator. A child who follows the lesson literally has no way to pick '15' or '40' for 2/4 vs 5/8. The '=' outcome is also never shown.
- Suggested fix: Sheet 16 should stay on like denominators and one-is-a-multiple pairs (2/4 vs 5/8, 1/2 vs 3/6) and defer 1/5 vs 1/6, 2/4 vs 2/5, 3/6 vs 6/8 to a later sheet. Add a step to the lesson: 'Multiply the two denominators (3 × 5 = 15) to get a denominator both can reach', and include an '=' example.

#### M7:Simplify fractions → M7:Mixed numbers
- **broken** · **fixed** — mixed-number items only with gcd-1 fraction parts; example says 'simplest form'
- Evidence: Expected answers on sheet 31: 'Write 6/4 as a mixed number → 1 2/4', '10/4 → 2 2/4', '8/6 → 1 2/6', '10/8 → 1 2/8', '14/8 → 1 6/8' (5 of 20; last sheet has '18/4 → 4 2/4', '20/8 → 2 4/8', '22/6 → 3 4/6').
- Why the child is lost: The day before, the child spent a whole lesson being told 'write it in simplest form'. A child who correctly writes 1 1/2 for 6/4 is marked wrong if grading is exact-match on the stored answer, and a child who writes 1 2/4 is being trained to unlearn yesterday.
- Suggested fix: Either generate only improper fractions whose remainder is already in lowest terms (7/3, 8/5, 13/4...) or store both '1 2/4' and '1 1/2' as accepted answers and state in the lesson which form is wanted.

#### M7:Improper fractions → M7:Add fractions
- **untaught-shape** · **fixed** — same-denominator sums only on sheet 39; example teaches simplify / whole / improper
- Evidence: Lesson shows only unlike denominators with an unexplained LCM: '1/3 + 1/4 → 7/12; LCM 12: 4/12 + 3/12'. Sheet expects simplified/whole results the lesson never mentions: '1/5 + 4/5 → 1', '3/8 + 3/8 → 3/4', '6/8 + 6/8 → 3/2', '1/2 + 4/8 → 1', '3/4 + 6/8 → 3/2', '1/3 + 10/12 → 7/6', '2/3 + 11/12 → 19/12'.
- Why the child is lost: Nothing tells the child that 5/5 is 1, that 6/8 must be written 3/4, or that the answer stays an improper fraction (7/6) when yesterday's two lessons were about turning 7/6 into 1 1/6. A child who writes 6/8, 12/8 or 1 1/6 is correct in substance but likely marked wrong. 'LCM' is also an undefined term at this point.
- Suggested fix: Open sheet 39 with a like-denominator worked example ('3/8 + 3/8 = 6/8 = 3/4 — add tops, keep bottom, simplify') and add a stated rule: 'Write the answer in simplest form; improper is fine (or: as a mixed number)'. Grade by value so 6/8, 3/4 and 1 1/6/7/6 all pass. Replace 'LCM 12' with 'a bottom both 3 and 4 fit into: 12'.

#### M7:Fraction mastery → M7:Decimal place value
- **prereq-gap** · **fixed** — decimal point, tenths, hundredths explained; place-value runs removed
- Evidence: A: 'Add the fractions: 5/12 + 1/12 → 1/2'. B lesson: '3.47 — hundredths → 7; Tenths = 4, hundredths = 7'. B sheet: '0.39 — tenths → 3', '0.10 — hundredths → 0'.
- Why the child is lost: This is the first decimal the child has ever seen (M1–M6 are whole numbers, M7 so far is fractions) and the lesson never says what the point means or that 0.3 is 3/10 — the one bridge the child already has. The task is mechanically copyable from the example, but the child enters the whole decimal strand with no idea what the numbers are, which surfaces two days later in rounding and adding.
- Suggested fix: Add steps: 'The point separates wholes from parts. The first place after the point is tenths (0.4 = 4/10), the second is hundredths (0.07 = 7/100)'. Put a [[viz grid 47 100]] next to 0.47 in the example.

#### M7:Decimal place value → M7:Compare decimals
- **broken** · **fixed** — compare orientation alternates (15 >, 14 <, 1 =); example pads to equal places
- Evidence: All 30 answers on sheet 55 are '<' ('0.09 ___ 0.1 → <', '0.02 ___ 0.17 → <', ... '0.05 ___ 0.76 → <'); the last sheet shown (58) is also 30 × '<'. The larger number is always on the right and the sheet is sorted ascending by it. The preceding lesson's last sheet is likewise degenerate: '0.80, 0.81, 0.82 ... 0.89 — tenths → 8' ten times in a row.
- Why the child is lost: A child can clear the whole Compare decimals lesson by pressing '<' thirty times without reading a single number, then arrives at Round decimals having practised nothing. The mastery signal the progression depends on is fake here.
- Suggested fix: Shuffle operand order so roughly half the answers are '>' and include a few '=' pairs (0.5 vs 0.50). Shuffle sheet 54 so consecutive items do not share an answer.

#### M7:Compare decimals → M7:Round decimals
- **untaught-shape** · **fixed** — nearest-tenth only on sheet 59; nearest-whole from sheet 60; rounding rule stated
- Evidence: Lesson: '3.47 → nearest tenth → 3.5; 7 rounds up: 3.5' (round-up only, nearest tenth only). Sheet: '0.14 → nearest tenth → 0.1' (round down), '1.05 → nearest tenth → 1.1' (the 5 rule), and 16 of 30 are 'nearest whole' ('2.9 → nearest whole → 3', '4.5 → nearest whole → 5'), never shown. Last sheet: '6.02 → nearest tenth → 6' (not 6.0).
- Why the child is lost: Over half the sheet is a form the lesson does not show. Rounding a decimal to the nearest whole requires knowing the tenths digit decides, and rounding 0.14 down requires the 'less than 5' half of the rule, neither stated. '6.02 → 6' also risks an exact-match fail for a child who writes 6.0.
- Suggested fix: Give two worked examples (one nearest tenth rounding down, one nearest whole) with the explicit rule '5 or more rounds up, 4 or less stays'. Make sheet 59 nearest-tenth only and introduce nearest-whole on sheet 60. Accept 6.0 and 6.

#### M7:Round decimals → M7:Add & subtract decimals
- **untaught-shape** · **fixed** — equal-length pairs only on sheet 63; subtraction and padding steps added
- Evidence: Lesson: '0.45 + 0.36 → 0.81; Line up points: 45 + 36 = 81 hundredths' (addition only, equal lengths only). Sheet: subtraction in Q2 ('0.27 − 0.1 → 0.17') and 13 of 24 items are subtraction; unequal lengths '0.23 + 0.4 → 0.63', '0.45 − 0.1 → 0.35', '0.65 + 0.1 → 0.75'; '0.07 + 0.13 → 0.2'.
- Why the child is lost: The lesson's shortcut 'read both as hundredths' gives 23 + 4 = 27 → 0.27 for 0.23 + 0.4, the single most common decimal error, because the child was never told to pad 0.4 to 0.40. Subtraction is half the sheet and is never modelled. A child writing 0.20 for 0.07 + 0.13 may also be marked wrong.
- Suggested fix: Add a subtraction example and one unequal-length example ('0.23 + 0.4: write 0.4 as 0.40, then 23 + 40 = 63 hundredths'). Keep sheet 63 to equal-length pairs; move mixed-length items to sheet 64+. Accept 0.20 for 0.2.

#### M7:Add & subtract decimals → M7:Multiply decimals
- **untaught-shape** · **fixed** — single-digit factors only on sheet 68; decimal × whole and trailing-zero steps
- Evidence: Lesson: '0.3 × 0.4 → 0.12; 3×4=12, two decimal places'. Sheet opens with 13 decimal × whole items: '0.5 × 3 → 1.5', '1.9 × 7 → 13.3', '2.5 × 8 → 20', '3.3 × 6 → 19.8'; also '0.5 × 1.0 → 0.5' and '0.8 × 1.3 → 1.04'.
- Why the child is lost: The child is told 'two decimal places' as a fact about one example, not the rule 'count the decimal places in the question'. Applied literally, 0.5 × 3 becomes 0.15 and 2.5 × 8 becomes 0.20 — and the trailing-zero drop (20.0 → 20, 0.50 → 0.5) is never explained. Also a cliff: from 0.47 − 0.19 yesterday to 19 × 7 and 47 × 5 mental products today.
- Suggested fix: State the rule in the steps ('count how many digits are after the points in the question — here 1 + 1 = 2 — and put that many in the answer') and add a decimal × whole example ('0.5 × 3: 5 × 3 = 15, one place → 1.5'). Start sheet 68 with single-digit products (0.5 × 3, 0.9 × 5) before 1.9 × 7 / 4.7 × 5.

#### M7:Understand percent → M7:Fractions ↔ percents
- **prereq-gap** · **fixed** — example is now 45% → 45/100 → 9/20, with the fraction → percent direction as a further step
- Evidence: Lesson method: '1 ÷ 4 = 0.25 = 25%'. Sheet: 'Write 1/50 as a percent → 2%', '1/25 → 4%', '3/20 → 15%', '7/20 → 35%', '11/20 → 55%'.
- Why the child is lost: The child has never divided a whole number by a whole number to get a decimal (Divide decimals only did decimal ÷ whole), and '0.25 = 25%' is the content of TOMORROW's lesson (Decimals ↔ percents). The method that the child does own — equivalent fractions with denominator 100 (7/20 = 35/100 = 35%) — is the one the lesson does not use.
- Suggested fix: Change the worked example to 'x/20 → percent: 20 × 5 = 100, so 7/20 = 35/100 = 35%' (equivalent-fraction method, already taught), and use the division method only after Decimals ↔ percents. Alternatively swap lessons 26 and 27.

#### M7:Fractions ↔ percents → M7:Decimals ↔ percents
- **untaught-shape** · **fixed** — example is now 45% → 45/100 → 9/20, with the fraction → percent direction as a further step
- Evidence: Lesson: '0.25 → percent → 25%; Move the point two places: 25%'. Sheet's first 11 questions are the reverse: '1% → decimal → 0.01', '3% → decimal → 0.03', '5% → decimal → 0.05' ... '21% → decimal → 0.21'; 16 of 30 are percent → decimal. Also '0.3 → percent → 30%'.
- Why the child is lost: 'Move the point two places' does not say which way, and 5% has no visible point to move — the child must know to write 0.05 with a leading zero, which is exactly the place-value idea (5 hundredths) the decimal strand never connected to fractions. The first eleven items in a row are the unshown direction.
- Suggested fix: Add '5% → decimal: 5 out of 100 = 5 hundredths = 0.05' as a second worked example and say 'right for %, left for decimal'. Start sheet 83 with decimal → percent (the taught direction) and interleave. Note 0.3 → 30% needs '0.30' padding — show it.

#### M7:Decimals ↔ percents → M7:Percent of a number
- **untaught-shape** · **fixed** — 50/25/10 only on sheet 87; 75/20/5 banded; table + 'later' step
- Evidence: Lesson: '25% of 80 → 20; 25% = 1/4, 80 ÷ 4 = 20'. Sheet: '75% of 12 → 9', '75% of 20 → 15', '75% of 24 → 18', '75% of 28 → 21', '75% of 36 → 27' (5 items), '20% of 20 → 4', '20% of 50 → 10', '10% of 20 → 2', '10% of 30 → 3', '5% of 60 → 3'.
- Why the child is lost: The lesson only covers the unit-fraction case (divide by the denominator). 75% = 3/4 requires 'divide by 4 then multiply by 3' — fraction-of-a-whole-number was never taught (Multiply fractions was fraction × fraction only). 20%, 10% and 5% each need their own fraction (1/5, 1/10, 1/20) recalled from a sheet, not from any lesson.
- Suggested fix: Keep sheet 87 to 50%, 25% and 10% (unit fractions) and add a worked example for 75% ('75% = 3/4: 12 ÷ 4 = 3, 3 × 3 = 9') before it appears. State the small table 50%=1/2, 25%=1/4, 10%=1/10, 20%=1/5, 5%=1/20 in the lesson.

#### M8:Percentages of a number → M8:Convert fractions, decimals, percents
- **untaught-shape** · **fixed** — denominators 2/4/5/10 only on sheet 85; four-direction example
- Evidence: Worked example (the only one): '1/4 → decimal → 0.25: 1 ÷ 4 = 0.25'. Sheet 85 asks six different conversions: 'Write 0.75 as a fraction → 3/4', 'Write 0.875 as a fraction → 7/8', 'Write 0.45 as a fraction → 9/20', 'Write 5/8 as a percent → 62.5%', 'Write 0.125 as a percent → 12.5%', 'Write 37.5% as a decimal → 0.375'.
- Why the child is lost: Only fraction→decimal is taught. Decimal→fraction in simplest form (0.875 = 875/1000 ÷ 125 = 7/8; 0.45 = 45/100 = 9/20) and fraction→percent via long division to three places (5/8 → 0.625 → 62.5%) are never shown, and there is no explanation of how to type a fraction answer. 16 of 30 items are in an untaught direction.
- Suggested fix: Either split into three lessons (fraction→decimal, decimal→fraction, ↔percent) or give a three-part example covering each direction. Restrict sheet 85 to halves, quarters, fifths, tenths; move eighths (0.125/0.375/0.625/0.875) to sheet 88+.

#### M9:Ratios — mixed review → M10:Expressions · Order integers
- **prereq-gap** · **fixed** — one-negative ordering sets open sheet 1; number-line example
- Evidence: Nothing in M1–M9 contains a negative number (A: 'Find the missing number: 7 : 1 = ___ : 4 → 28'). Micro-lesson: 'Order from least to greatest: 2, −3, 1 → -3,1,2; Negatives are smallest; the further left on the number line, the smaller'. Sheet 1, question 1: 'Order these from least to greatest: -7, -9, 9, 6 → -9,-7,6,9'.
- Why the child is lost: This is the child's first ever meeting with negative numbers, delivered as one sentence. The example has ONE negative; every one of the 24 sheet items has two or more, so the child must decide whether -9 or -7 is smaller, which the example never demonstrates. Most children will put -7 before -9 ('7 is smaller than 9').
- Suggested fix: Make the example contain two negatives ('-3, 2, -1 → -3, -1, 2: -3 is further left than -1, so it is smaller') and add a number-line picture; start sheet 1 with items that have exactly one negative.

#### M9:Ratios — mixed review → M10:Expressions · Order integers
- **broken** · **already resolved** — not broken in the app: permutation items render as drag-to-order; pinned by test (print PDF still shows A–D)
- Evidence: Every item on sheet 1 reads 'Order these from least to greatest: -7, -9, 9, 6 [options: -7 | -9 | 9 | 6] → -9,-7,6,9 (multiple_choice)'.
- Why the child is lost: The item is typed multiple_choice but its four options are single integers while the expected answer is a 4-item sequence, so no option can ever equal the key. If the renderer really shows radio buttons, the whole first lesson of M10 is unanswerable; if it is an ordering widget mislabelled as MC, the type field is wrong and the micro-lesson never tells the child they will be dragging numbers into order.
- Suggested fix: Verify the renderer for this question type. Either mark it as an 'order' interactive type (and say so in the micro-lesson) or make the options full sequences ('-9, -7, 6, 9' / '-7, -9, 6, 9' / …).

#### M10:Equations · One-step (×) → M10:Equations · Integer add & subtract
- **lesson-mismatch** · **fixed** — number-line example with three cases; sheet 71 opens (−1) + 3
- Evidence: Worked example (entire method): '(-5) + 8 → 3: 8 - 5 = 3'. Sheet 71 opens with '(-1) - 4 → -5', then '2 - 3 → -1', '2 - 5 → -3', '(-3) - 5 → -8', '(-2) - 7 → -9', '(-9) + 1 → -8', '(-5) - 5 → -10'.
- Why the child is lost: The example covers exactly one of the four cases on the sheet (negative + positive with a positive result) and gives no rule, just the arithmetic. The very first item, negative minus positive, is never shown; neither is positive − larger positive, nor negative + positive with a negative result. About 18 of 30 items are in untaught cases. (Also the lesson is titled 'Equations · …' but contains no equations, and 8 items like '2 + 3 → 5' are M1 filler.)
- Suggested fix: Number-line example with three lines: '(-5) + 8: start at -5, move 8 right → 3', '2 − 5: start at 2, move 5 left → -3', '(-3) − 5: start at -3, move 5 left → -8'. Move this lesson to position 2 so Evaluate (+/−) can use it. Rename to 'Integers · Add & subtract'.

#### M10:Equations · One-step inequalities → M10:Coordinate Plane · Plot points
- **untaught-shape** · **fixed** — no y-intercept items on any M10 sheet
- Evidence: Micro-lesson only: 'Plot the point (3, 2) → Right 3 along the x-axis, Up 2 along the y-axis'. Sheet 81 items 23–24: 'Plot the y-intercept of the line y = x − 3 → 0,-3', 'Plot the y-intercept of the line y = x + 1 → 0,1'.
- Why the child is lost: 'y-intercept' and the equation of a line (y = x − 3) have never appeared anywhere in M1–M10; the next lesson is number patterns, not lines. The child has no way to know these mean 'plot (0, −3)'. Two items is 8% of the sheet, which alone can push a borderline child under the 90–95% gate.
- Suggested fix: Remove the y-intercept items from M10 'Plot points' (they belong to M11 'Graph a line'), or add an example line: 'The y-intercept of y = x − 3 is where x = 0: the point (0, −3)'.

#### M10:Equations · One-step inequalities → M10:Coordinate Plane · Plot points
- **lesson-mismatch** · **fixed** — first-quadrant points open sheet 81; LEFT/DOWN rule in example
- Evidence: Worked example: '(3, 2) → Right 3, Up 2'. Sheet 81 item 1: 'Plot the point (-3, -3)', item 2 '(-3, -2)', item 5 '(-2, -3)', item 11 '(1, -3)' — 20 of 24 points have at least one negative coordinate.
- Why the child is lost: The example never says a negative x means LEFT and a negative y means DOWN, and the child met negative numbers for the first time this level. The interactive plotting form (click a grid point) is new too, and the first item is in the third quadrant.
- Suggested fix: Example should be a point like (−2, 3): 'negative x → left 2, positive y → up 3', and the first six items on sheet 81 should be first-quadrant points before negatives appear.

#### M11:Plot points on the coordinate plane → M11:Graph a line
- **untaught-shape** · **fixed** — positive slopes only on sheet 5; negative-slope worked in example
- Evidence: Worked example: 'Plot the line y = 2x − 1: y-intercept (0, −1); Slope 2 → up 2, right 1 → (1, 1); Draw the line'. Sheet 5 items 23–30: 'Plot the line y = −x − 3 → -1,-3', 'Plot the line y = −x → -1,0', 'Plot the line y = -2x − 3 → -2,-3'; item 4 'Plot the line y = x → 1,0'.
- Why the child is lost: Negative slope (8 of 30 items) is never shown; 'up 2, right 1' gives the child no move for slope −1 (down 1, right 1), and 'y = −x' has neither a visible coefficient nor an intercept. The interactive form appears to want slope and intercept entered/dragged ('→ 2,-1'), which the child has done once, yesterday, only for the intercept.
- Suggested fix: Add an example line for a negative slope ('y = −x + 2: start (0, 2), slope −1 → DOWN 1, right 1 → (1, 1)') and note 'y = x means 1x + 0'. Keep sheet 5 to positive slopes; introduce negatives on sheet 6–7.

#### M11:Equations with distribution → M11:Variables on both sides
- **lesson-mismatch** · **fixed** — general case 4x + 2 = 2x + 6 taught; mx = x + c leads sheet 55; no 1x
- Evidence: Worked example: '3x = x + 8 → 4: Subtract x from BOTH sides: 2x = 8; Divide by 2'. Sheet 55: 'Solve for x: 4x + 1 = 3x + 2 → 1', '4x + 2 = 2x + 6 → 2', '7x + 5 = 2x + 30 → 5', '5x + 9 = 2x + 36 → 9' — 20 of 30 items have constants on BOTH sides.
- Why the child is lost: The example is the special case with no constant on the left; two-thirds of the sheet needs a second, unshown move (subtract the constant too, then divide). Children who know two-step equations may piece it together, but many will stall at '2x + 2 = 6' not knowing they may keep going.
- Suggested fix: Use the general case as the example: '4x + 2 = 2x + 6: subtract 2x → 2x + 2 = 6; subtract 2 → 2x = 4; divide → x = 2', and lead sheet 55 with the ax = x + c items.

#### M12:Factor quadratic trinomials → M12:Factor trinomials (a ≠ 1)
- **broken** · **fixed** — example uses guess-and-check with FOIL instead of grouping (taught three lessons later)
- Evidence: First sheet expected answers: 'Factor 2x² + 6x + 4 → (2x + 2)(x + 2)', 'Factor 3x² + 6x + 3 → (3x + 3)(x + 1)', 'Factor 4x² + 8x + 4 → (2x + 2)(2x + 2)', 'Factor 6x² + 12x + 6 → (2x + 2)(3x + 3)', 'Factor 4x² + 12x + 8 → (2x + 2)(2x + 4)' — 12 of 30 items have a common factor and the key is not fully factored.
- Why the child is lost: The lesson two days earlier was 'Factor out the GCF'. A student who does what they were just taught and writes 2(x + 1)(x + 2) or 4(x + 1)² gives the correct, complete factorization and risks being marked wrong; a student who matches the key is being trained to leave factors unfactored. Also the key fixes one factor order ((2x + 1)(x + 1)); if the grader is a string match, (x + 1)(2x + 1) fails.
- Suggested fix: Generate only trinomials with gcd(a, b, c) = 1 on this lesson (or accept the fully-factored form and every factor ordering). Confirm the grader accepts commuted factors.

#### M12:Classify polynomials by terms → M12:Identify polynomials
- **untaught-shape** · **fixed** — rule stated with Yes/No cases; √x and negative exponents banded later
- Evidence: Micro-lesson: 'Is this a polynomial? 1/x + 5 → No — 1/x has x in the denominator — not allowed'. First sheet: 'Is this a polynomial? x^(1/2) + 1 → No', '√x - 3 → No', '2ˣ - 1 → No', 'x⁻² + 1 → No', '∛x + 2 → No', 'x⁻¹ + 7 → No'.
- Why the child is lost: The lesson gives one rule (no x in a denominator) and the sheet tests five other disqualifiers — roots, fractional exponents, negative exponents, variable exponents — none of which a student who has only reached linear equations has seen. Yes/No guessing cannot reach the 90% clear bar.
- Suggested fix: State the actual rule in the big idea ('only whole-number powers of x: x, x², x³…; no roots, no x underneath, no negative or fraction powers, no x as an exponent') and show one Yes and two No examples covering √x and x⁻¹. Or drop the fractional/negative-exponent items from sheet 5 and introduce them on sheet 6–7.

#### M12:Constant term → M12:Evaluate polynomials
- **untaught-shape** · **fixed** — positive x only on the opening sheet; (−1)² step for later sheets
- Evidence: Micro-lesson: 'Evaluate x² + 3x + 2 at x = 4 → 30; Substitute 4 for x: 4² + 3·4 + 2'. First sheet questions 1–6 are all x = -1: 'Evaluate x² + x + 1 at x = -1 → 1', 'Evaluate x² + 3x + 1 at x = -1 → -1', 'Evaluate 2x² + 3x + 1 at x = -1 → 0'; 12 of 30 items use x = -1.
- Why the child is lost: The sheet opens with substituting a negative number, which requires knowing (-1)² = +1 while 3·(-1) = -3 — the single most common evaluation error — and the lesson shows only a positive substitution. Nothing before M12 in this dump shows signed multiplication with squares.
- Suggested fix: Add a second worked example at x = -1 showing (-1)² = 1 and 3(-1) = -3 explicitly, and order sheet 20 so the first ten items use positive x before negatives appear.

#### M12:Multiply by a trinomial → M12:Divide by a monomial
- **lesson-mismatch** · **fixed** — term-by-term division example with a multiply check; no GCF
- Evidence: Micro-lesson: 'Divide (6x² + 4x) ÷ 2x → 3x + 2 — Factor 2x out of the top: 6x² + 4x = 2x(3x + 2); Cancel the 2x'. First sheet: 'Divide (2x² + 2x) ÷ 2x → x + 1', 'Divide (12x² + 8x) ÷ 4x → 3x + 2'.
- Why the child is lost: The only method taught is factoring out a GCF, which is lesson 18 — two lessons later. The student has distributed a monomial but has never factored one out, so the worked example's first step is a skill they do not have; the simpler term-by-term method (6x² ÷ 2x = 3x, 4x ÷ 2x = 2) is never shown.
- Suggested fix: Rewrite the worked example as term-by-term division: '6x² ÷ 2x = 3x; 4x ÷ 2x = 2; so 3x + 2', with a FOIL-style check '2x(3x + 2) = 6x² + 4x'. Keep the factoring explanation for after lesson 18.

#### M12:Factor trinomials (a ≠ 1) → M12:Difference of squares
- **broken** · **fixed** — example uses guess-and-check with FOIL instead of grouping (taught three lessons later)
- Evidence: First sheet keys: 'Factor 4x² - 4 → (2x + 2)(2x - 2)', 'Factor 4x² - 16 → (2x + 4)(2x - 4)', 'Factor 9x² - 9 → (3x + 3)(3x - 3)', 'Factor 16x² - 4 → (4x + 2)(4x - 2)', 'Factor 4x² - 36 → (2x + 6)(2x - 6)', 'Factor 9x² - 36 → (3x + 6)(3x - 6)', 'Factor 16x² - 16 → (4x + 4)(4x - 4)' — 7 of 30 not fully factored.
- Why the child is lost: 4x² − 4 = 4(x + 1)(x − 1); a student who pulls the GCF first (as taught three lessons earlier) produces a different, correct answer and is likely marked wrong. Also the micro-lesson only shows x² − 9; the coefficient case (recognising 4x² as (2x)²) starts at item 13 with no example.
- Suggested fix: Restrict this sheet to gcd(a, b) = 1 cases (x² − k², 4x² − 9, 9x² − 25 …) or accept the fully-factored form. Add one worked step '4x² = (2x)²' before the 4x² − 1 items.

#### M12:Factor by grouping → M12:Sum & difference of cubes
- **untaught-shape** · **fixed** — both formulas (SOAP) with x³ − 27; keys fully factored
- Evidence: Micro-lesson shows only the sum: 'Factor x³ + 8 → (x + 2)(x² - 2x + 4); a³ + b³ = (a + b)(a² - ab + b²)'. First sheet item 2: 'Factor x³ - 1 → (x - 1)(x² + x + 1)', item 4: 'Factor x³ - 8 → (x - 2)(x² + 2x + 4)' — half of the 30 items are differences.
- Why the child is lost: The difference-of-cubes formula and its sign pattern are never stated; a student cannot derive (a − b)(a² + ab + b²) from the sum example and will get the middle-term sign wrong on every difference item. Also 'Factor 8x³ + 8 → (2x + 2)(4x² - 4x + 4)' and '8x³ - 8 → (2x - 2)(4x² + 4x + 4)' are not fully factored (8(x + 1)(x² − x + 1)).
- Suggested fix: Show both formulas with a sign mnemonic (SOAP: same, opposite, always positive) and a second worked example for x³ − 27. Remove 8x³ ± 8 or accept the fully-factored form.

#### M13:Zero-product property → M13:Solve by factoring
- **lesson-mismatch** · **fixed** — k-items off the opening sheet; example writes the factored form
- Evidence: Micro-lesson: 'Solve x² - 7x + 12 = 0 → 3, 4 — Find two numbers that multiply to 12, add to 7: 3 and 4; x = 3 or x = 4'. First sheet: 'Solve x² - 3x + 2 = 0 → 1, 2', 'Solve x² - 2x + 1 = 0 → 1', and a second task type 'For which value of k can x² + kx + 2 be factored as (x + 1)(x + 2)? → k = 3'.
- Why the child is lost: The step says the numbers 'add to 7' for a −7x term and never writes the factored form (x − 3)(x − 4) = 0 — so the sign logic that connects M12 factoring (positive b only) to negative-b quadratics is skipped, and the zero-product step learned yesterday is not even shown being applied. The k questions are a different task (expand and read off b) that the lesson never mentions; the repeated-root case (x² − 2x + 1 → 1) is also unshown.
- Suggested fix: Make the steps: 'x² − 7x + 12: two numbers that multiply to +12 and add to −7 → −3 and −4; so (x − 3)(x − 4) = 0; zero-product: x = 3 or x = 4'. Add a one-line second example for the k form ('(x + 1)(x + 2) = x² + 3x + 2, so k = 3') or move the k items to a later sheet.

#### M13:Discriminant & # of solutions → M13:Evaluate & axis of symmetry
- **lesson-mismatch** · **fixed** — axis items open the unit (13 axis + 14 evaluate)
- Evidence: Micro-lesson: 'Axis of symmetry of y = x² + 6x → x = -3; For y = x² + bx the axis is x = -b/2'. First sheet (30 items): 'Evaluate x² + x + 1 when x = 1 → 3', 'Drag the vertex of the parabola to the point (4, -1) → 4,-1' … zero axis-of-symmetry questions. The axis items ('Find the axis of symmetry of y = x² + 2x → x = -1') only appear on the lesson's last sheet, where no lesson fires.
- Why the child is lost: The one-time micro-lesson teaches a skill the student will not use for days, and by the time axis questions arrive (with new 'Which graph matches y = x² + 2?' items) there is no lesson. Students are not lost on day one (evaluation and dragging are old skills) but they hit the real new content cold later.
- Suggested fix: Put at least 6 axis-of-symmetry items on sheet 91 right after the lesson, or split into two lessons ('Evaluate quadratics' with the evaluation example; 'Axis of symmetry' with the -b/2 example) so the lesson fires next to the content.

#### M13:Evaluate & axis of symmetry → M14:Evaluate f(x) = mx + b
- **broken** · **fixed** — distractors now come only from the same template; error-analysis banded
- Evidence: 'Theo computes f(2) for f(x) = 7x + 4 as 7 × (2 + 4) = 42. What went wrong? [options: Theo added 4 before multiplying — multiply 7·2 first, then add 4 | True | Theo added 4 before multiplying — multiply 6·3 first, then add 4 | Mia added 4 before multiplying — multiply 7·3 first, then add 4]'; 'True or false: for f(x) = 3x + 1, f(0) = 1 [options: True | False | Theo added 4 before multiplying — multiply 7·2 first, then add 4 | Mia added 4 …]'; 'Mia computes f(2) … [options: … | 35 | …]'; 'The graph of a linear function f(x) = mx + b is shown. Build its equation. → 1,-2'.
- Why the child is lost: Distractors are polluted with options from other questions (other students' names, 'True', '35'), which makes some items trivially guessable and others confusing. 13 of 20 items are error-analysis or true/false and only 3 are plain 'Find f(2)' — the task the lesson taught. 'Build its equation' from a graph is an interactive shape never shown in the lesson.
- Suggested fix: Fix the distractor generator so options come only from the same item template (same name, same numbers). Make sheet 1 at least half plain evaluations, and move error-analysis and graph-building to sheets 3+ or give them a lesson step.

#### M14:Evaluate f(x) = mx + b → M14:Evaluate a quadratic function
- **lesson-mismatch** · **fixed** — vertex drags banded; ≥60% of the opening sheet is the taught skill
- Evidence: Micro-lesson: 'f(x) = x² + 5. Find f(3) → 14'. First sheet (26 items): 'Drag the vertex of the parabola to the point (-3, -2) → -3,-2' (10 items), 'f(x) = 5x + 4. Find f(1) → 9' and 'f(x) = 4x + 4. For which x is f(x) = 24? → 5' (linear review, 9 items), only 3 items of the taught form ('f(x) = x² + 1. Find f(2) → 5'). Also 'True or false: for f(x) = x² + 6, f(−3) > f(3) [options: 2 | 3 | True | False]'.
- Why the child is lost: Fewer than one in eight questions practise the skill the lesson taught; ten are vertex-dragging from M13 lesson 1, unrelated to evaluating x² + c. The symmetry true/false items (f(−3) vs f(3)) require negative substitution the lesson does not show and carry numeric junk distractors on a true/false item.
- Suggested fix: Make sheet 17 at least 60% 'f(x) = x² + c. Find f(k)' including one worked negative input in the lesson; drop the vertex-drag items (or cap at 2) and fix the true/false options to exactly True | False.

#### M14:Inverse functions → M15:Pythagorean theorem
- **untaught-shape** · **fixed** — find-a-leg banded; example adds the leg case
- Evidence: Micro-lesson only: 'Legs 3 and 4. Find the hypotenuse → 5 ... Square root at the end'. First sheet: 'Right triangle: hypotenuse 5, one leg 3. Find the other leg → 4', 'hypotenuse 25, one leg 7. Find the other leg → 24' (7 of 21 items).
- Why the child is lost: Finding a leg requires rearranging to b² = c² − a² (subtract, not add). The lesson never shows a subtraction case, so students add 25²+7² and get nonsense.
- Suggested fix: Add a second worked step or example 'hypotenuse 5, leg 3 → 25 − 9 = 16 → 4', or keep sheet 1 hypotenuse-only and move the find-a-leg items to sheet 2+.

#### M15:Pythagorean theorem → M15:Right-triangle ratios
- **untaught-shape** · **fixed** — circle drags removed from the ratios pool
- Evidence: 8 of 23 items are 'Drag the point around the circle so the angle θ = 30°/45°/60°/90°/120°/135°/150°/180°' (interactive). The micro-lesson mentions no circle at all: 'Label the sides FROM the angle first; SOH: Sine = Opposite over Hypotenuse; sin θ = 3/5'.
- Why the child is lost: The student has never seen an angle measured counter-clockwise from the positive x-axis on a circle, nor this widget. Angles past 90° (120°, 150°, 180°) have no meaning in a right-triangle lesson.
- Suggested fix: Remove the unit-circle drag items from the ratios lesson (they belong to 'Unit-circle values'), or add a lesson step introducing the circle and standard position.

#### M15:Pythagorean theorem → M15:Right-triangle ratios
- **untaught-shape** · **fixed** — full SOH-CAH-TOA example on 3-4-5
- Evidence: Lesson teaches only SOH. Sheet: 'adjacent = 4, hypotenuse = 5. Find cos θ → 4/5', 'opposite = 3, adjacent = 4. Find tan θ → 3/4', 'A ramp rises 5 m over a horizontal base of 12 m. Find tan θ → 5/12'.
- Why the child is lost: cos and tan are never defined in the micro-lesson; the student cannot know CAH or TOA from 'SOH' alone.
- Suggested fix: Make the worked example the full SOH-CAH-TOA triple on one 3-4-5 triangle (sin 3/5, cos 4/5, tan 3/4).

#### M15:Right-triangle ratios → M15:Unit-circle values
- **untaught-shape** · **fixed** — surd values served as multiple choice; both triangles in example
- Evidence: Lesson shows one value from the 30-60-90 triangle: 'sin 30° = 1/2'. Sheet requires typed '√2/2' (sin 45°, cos 45°), '√3/3' (tan 30°), and 'sin 0°/90°, cos 0°/90°' → 0/1/1/0.
- Why the child is lost: The 45-45-90 triangle (1,1,√2), rationalising 1/√2 → √2/2 and 1/√3 → √3/3, and the boundary angles 0°/90° (no triangle exists) are all absent from the lesson; a typed 1/√3 for tan 30° is marked wrong against √3/3.
- Suggested fix: Lesson should show both special triangles and the quadrant-boundary points (1,0),(0,1); accept 1/√3 and 1/√2 as equivalent typed answers or make the surd items multiple-choice on sheet 1.

#### M15:Unit-circle values → M15:Degrees to radians
- **untaught-shape** · **fixed** — radians → degrees step added
- Evidence: Lesson: '90 × π/180 = 90π/180 → π/2' (degrees → radians only). Sheet: 'Convert π/4 radians to degrees → 45°', 'Convert 5π/6 radians to degrees → 150°' (9 of 30 items) and 'Drag the point around the circle to the angle 2π/3 radians → 120'.
- Why the child is lost: The reverse conversion (× 180/π) is never shown; the drag items also require it silently.
- Suggested fix: Add a second worked example 'π/3 radians → 60°' (multiply by 180/π) or delay radians→degrees to sheet 2.

#### M15:Degrees to radians → M15:Pythagorean identity
- **untaught-shape** · **fixed** — cos² = 1 − sin², tan = sin/cos steps; symbolic items same-template MC
- Evidence: Lesson: sin θ = 3/5 → cos θ = 4/5. Sheet: 'sin θ = 3/5. Find tan θ (acute angle) → 3/4', 'sin θ = 5/13. Find tan θ → 5/12', 'sin θ = 8/17. Find tan θ → 8/15'; also 'Simplify: 1 − sin²θ → cos²θ'.
- Why the child is lost: tan θ = sin θ / cos θ is never stated; the student only knows tan as opposite/adjacent and has no triangle here. Rearranging the identity to 1 − sin²θ is likewise not shown.
- Suggested fix: Add a lesson step 'then tan θ = sin θ ÷ cos θ = (3/5)/(4/5) = 3/4' and a line 'so cos²θ = 1 − sin²θ'.

#### M15:Pythagorean identity → M16:End behavior
- **lesson-mismatch** · **fixed** — end-behaviour reasoning and 2×2 table
- Evidence: Lesson gives exactly one case: 'Odd degree, negative lead: the left end rises → +∞'. The sheet needs all four cases: '-3x² + 2x - 1 → −∞', 'x² + 2x - 1 → +∞', '3x⁴ → +∞', '2x³ → −∞', '-2x⁴ → −∞'.
- Why the child is lost: No rule is stated for even degree or positive lead; the student has one memorised fact and three unexplained cases. The step 'the left end rises' also gives no reasoning (e.g. (−big)^odd is negative, times −1 is positive).
- Suggested fix: Lesson should present the 2×2 table (even/odd × positive/negative lead) with a one-line reason for each, or show one even and one odd worked example.

#### M16:y-intercept of a polynomial → M16:x-intercepts (roots)
- **untaught-shape** · **fixed** — root → factor sign-flip steps; reverse items banded
- Evidence: Lesson: '(x − 2)(x + 3) ... x + 3 = 0 → x = -3'. Sheet: 'Which function crosses the x-axis at x = 1 and x = −2? [options: (x + 1)(x − 2) | (x + 1)(x + 2) | (x − 1)(x − 2) | (x − 1)(x + 2)] → (x − 1)(x + 2)' (9 of 24 items).
- Why the child is lost: Building the factor from the root (root r → factor (x − r), sign flips) is the inverse task and is exactly where students choose (x + 1)(x − 2); the lesson never states the rule.
- Suggested fix: Add a lesson step 'a root at x = r means a factor (x − r): root −3 → factor (x + 3)' and show one reverse example.

#### M16:Multiplicity — cross or bounce → M16:Turning points
- **broken** · **fixed** — degree-2 turning-point item keyed True
- Evidence: 'True or false: every polynomial of degree 2 has exactly 1 turning points. [options: True | False] → False'. A degree-2 polynomial is a parabola and always has exactly one turning point; the keyed answer is wrong. (The degree-3/4/5 versions keyed False are correct.)
- Why the child is lost: A student reasoning correctly is marked wrong; with a 95% clear gate one wrong key on a 22-item sheet can block the day.
- Suggested fix: Special-case degree 2 (answer True) in the generator, or exclude n = 2 from the 'exactly n − 1' true/false template. Also drop the 'False' distractor leaking into numeric MC items ('degree 2 has at most how many turning points? [options: 1 | 2 | False]').

#### M16:Turning points → M16:Fundamental Theorem of Algebra
- **prereq-gap** · **fixed** — 'not real' wording; no 'complex' before it is taught
- Evidence: Sheet: 'A degree-3 polynomial has 1 real roots. How many of its roots are complex? → 2', 'A degree-2 polynomial has 0 real roots. How many of its roots are complex? → 2' (4 of 20). Lesson only says 'a degree-n polynomial has exactly n roots'. Complex numbers are first introduced six lessons later ('Powers of i', sheets 85–92).
- Why the child is lost: The student has never met the word 'complex' or the idea that missing real roots are non-real; the lesson gives no 'n − real = complex' step.
- Suggested fix: Either move these items after 'Powers of i'/'Add complex numbers', or add a lesson line 'roots that are not real are complex; complex = n − real' and say 'non-real' in the stem.

#### M16:Fundamental Theorem of Algebra → M16:Synthetic division
- **lesson-mismatch** · **fixed** — Remainder-Theorem stems; (x + 1) banded; k = −1 step
- Evidence: Every sheet item says 'Use synthetic division to find the remainder ...', but the lesson never performs synthetic division: 'Remainder Theorem: remainder = f(2); 2² + 5·2 + 6 = 20'. Sheet also divides by (x + 1): 'x² + 2x - 3 divided by (x + 1) → -4', 'x² + 2x + 4 divided by (x + 1) → 3' — the lesson only shows (x − 2).
- Why the child is lost: The named method is not taught, and the sign flip (divide by x + 1 → evaluate at −1) is never shown, so students evaluate f(1) and get 0/7 instead of −4/3.
- Suggested fix: Either rename the items to 'Use the Remainder Theorem' and add a step 'x + 1 = 0 → substitute x = −1', or actually show the synthetic-division table in the lesson.

#### M16:Solve exponential equations → M16:Powers of i
- **untaught-shape** · **fixed** — exponents ≤ 9 open the unit; cycle step
- Evidence: Lesson: 'i³ = i² × i = (-1) × i = -i (the powers cycle: i, -1, -i, 1)'. Sheet: 'Simplify i²⁸ → 1', 'Simplify i²⁷ → -i', 'Simplify i²¹ → i' (exponents 5–28 on 24 of 36 items).
- Why the child is lost: The lesson never shows how to use the 4-cycle for a large exponent (divide by 4, use the remainder); a student either counts 28 steps by hand or guesses.
- Suggested fix: Add a worked step 'i¹⁰: 10 ÷ 4 = 2 remainder 2, so i¹⁰ = i² = −1', and keep sheet 1 to exponents ≤ 8 with larger ones on later sheets.

#### M16:Add complex numbers → M17:Parabolas & conics
- **lesson-mismatch** · **fixed** — vertex-form example; vertex-read items open
- Evidence: Worked example: 'Drag the vertex of the parabola to the point (2, 1) → 2,1; The vertex of y = (x − 2)² + 1 is (2, 1); Move the vertex there' — the step restates the goal. Sheet: 'What is the vertex of y = (x + 1)² + 3? → -1,3', 'What is the axis of symmetry of y = (x + 2)² − 1? → x = -2', 'Which graph matches y = x² + 2? [options: parab:1,-1,3 | parab:1,1,-3 | parab:1,0,2 | parab:1,2,0]'.
- Why the child is lost: The sign flip (x + 1)² → vertex x = −1 and the term 'axis of symmetry' are never explained; the typed answer formats '2,1' and 'x = -2' are never shown as the expected form. The 'parab:1,0,2' option strings look like unrendered graph codes and must be verified to render as pictures.
- Suggested fix: Rewrite the worked example around reading the vertex from y = (x − h)² + k with an explicit 'opposite sign for h' line and an axis of symmetry x = h line; show the required answer format; confirm the 'Which graph matches' options render as thumbnails.

#### M17:Limits of polynomials → M17:Limits by factoring
- **lesson-mismatch** · **fixed** — substitute → 0/0 → factor → cancel example; large a banded
- Evidence: Worked example: 'lim(x→3) (x² - 9)/(x - 3) → 6; Factor → (x + 3); Substitute 3'. Sheet: 'lim(x→2) (x² - 4)/(x - 2) → 4', 'lim(x→28) (x² - 784)/(x - 28) → 56'.
- Why the child is lost: The steps skip the whole method: why substitution gives 0/0, that x² − 9 = (x − 3)(x + 3), and that the (x − 3) cancels. A student sees 'Factor → (x + 3)' with no visible factoring.
- Suggested fix: Expand the steps: 'Substituting 3 gives 0/0 — not allowed. Factor: x² − 9 = (x − 3)(x + 3). Cancel (x − 3). lim (x + 3) = 6.' Also keep sheet 1 to a ≤ 12 so students can recognise the squares.

#### M17:Limits by factoring → M17:Vectors
- **untaught-shape** · **fixed** — component addition and (4, 3) format
- Evidence: Lesson: only 'Magnitude of (3, 4) → 5 ... √(3² + 4²)'. Sheet: 'Add the vectors: (1, 1) + (1, 2) → (2, 3)', 'For (1, 3) + (2, 2), what is the x-component of the sum? → 3', 'A robot moves (1, 1) then (1, 1). Where does it end up, as a vector from the start? → (2, 2)', 'True or false: (2, 1) + (3, 1) = (5, 2)' — 19 of 27 items.
- Why the child is lost: Component-wise addition, the word 'component', and the typed format '(2, 3)' are never shown; the student has only a magnitude formula.
- Suggested fix: Add a second worked example '(1, 2) + (3, 1) = (1+3, 2+1) = (4, 3); the x-component is 4' and state the answer format.

#### M17:Vectors → M18:Power rule
- **untaught-shape** · **fixed** — d/dx meaning, x⁰, constant rule
- Evidence: Lesson: 'd/dx x³ = 3x²' with no explanation of what d/dx means. Sheet: 'd/dx 7 [options: 1 | 0 | 7 | 7x] → 0', 'd/dx 12 → 0', 'd/dx 3 → 0', 'd/dx x → 1'.
- Why the child is lost: The constant rule and the n = 1 case (1·x⁰ = 1) are never taught; 'd/dx' is introduced as a symbol with no meaning (rate of change/slope) so the student has no way to reason that a constant's derivative is 0.
- Suggested fix: Add one sentence 'd/dx means: how fast the function changes (its slope)' and two extra lines: 'd/dx x = 1·x⁰ = 1; a constant never changes: d/dx 7 = 0'.

#### M18:Differentiate monomials → M18:Evaluate a derivative
- **lesson-mismatch** · **fixed** — term-by-term derivative, f'(3) = 8, tangent slope
- Evidence: Worked example: 'f(x) = x² + 2x + 1. Find f'(3) → 8; f'(x) = 2x + 2; 2(3) + 2'. Sheet: 'f(x) = x² + x + 1. Find f'(2) → 5', 'Find the slope of the tangent line to y = x² + 2x at x = 1 → 4'.
- Why the child is lost: Nothing before this differentiates a sum: the lesson states f'(x) = 2x + 2 as a fact without saying 'differentiate each term; the constant 1 → 0'. The phrase 'slope of the tangent line' has never been connected to f'.
- Suggested fix: Add steps 'Differentiate term by term: x² → 2x, 2x → 2, 1 → 0' and a line 'f'(a) is the slope of the tangent line at x = a'.

#### M18:Evaluate a derivative → M18:Integrate powers
- **lesson-mismatch** · **fixed** — antiderivative defined, check by differentiating, + C
- Evidence: Worked example: '∫ x² dx → x³/3 + C; Raise power, divide; x³/3 + C'. Sheet: 'Which is an antiderivative of 3x²? → x³', '∫ x dx → x²/2 + C' (typed), 'True or false: ∫ x⁸ dx = x⁹ + C → False'.
- Why the child is lost: The steps restate the answer: no numbers ('raise 2 to 3, divide by 3'), no explanation of + C, no definition of 'antiderivative' or of ∫. A student cannot tell why x⁹ + C is wrong or why 3x² integrates to x³.
- Suggested fix: Expand: 'Integration undoes differentiation. Raise the power 2 → 3, divide by the new power: x³/3. Check: d/dx x³/3 = x². Add + C because any constant differentiates to 0.' Show the exact typed format 'x³/3 + C'.

#### M18:Integrate powers → M18:Definite integrals
- **untaught-shape** · **fixed** — F(b) − F(a) written out; easy forms added low
- Evidence: Lesson: '∫₀^4 x dx → 8; x²/2 from 0 to 4; 16/2'. Sheet: '∫₀^2 2x dx → 4', '∫₀^3 3x² dx → 27', '∫₀^5 3x² dx → 125', 'Find the area under y = 2x from x = 0 to x = 2 → 4'.
- Why the child is lost: Integrating a coefficient (2x → x², 3x² → x³) was never taught (previous lesson integrates bare xⁿ only), the F(b) − F(a) mechanism is not written out, and the word 'area' never appears in the lesson.
- Suggested fix: Show F(4) − F(0) = 8 − 0 explicitly, add a second example '∫₀^2 2x dx = [x²]₀² = 4 — this is the area under the line', and keep sheet 1 to ∫ x dx items or add a lesson line for ∫ a·xⁿ.


### Minors (73)

#### M1:Counting back — what comes before → M1:Missing number in a sequence
- **lesson-mismatch** · **already resolved** — count-on step and check present
- Evidence: big idea: 'Fills the missing number between two numbers' (= goal). Worked example step: 'The number between 6 and 8 is 7'.
- Why the child is lost: The only step restates the answer; no method (count on one from the first number, or check it is one before the last). Most children will still cope because they just finished counting on/back.
- Suggested fix: Step should read 'Count on one from 6: 7. Check: 7 is one before 8.' Big idea: 'The middle number is one more than the first and one less than the last.'

#### M1:Continue the count → M1:Counting — mixed review
- **lesson-mismatch** · **fixed** — M1 review draws all six shapes (was 32 of 36 greater); example previews them
- Evidence: Titled 'mixed review' but sheet 93 is 32 of 36 'Which is greater: 25 or 16?', with 1 'What number comes before 6?' and 3 'What number comes after 28?'; no 'Which is less', no missing-number, no continue-the-count. Worked example is a single 'What number comes after 28?'; lesson video: NONE.
- Why the child is lost: Not a wall (all shapes were taught) but the review does not review: it is a second 'Which is greater' lesson, and the micro-lesson previews only one of the five shapes.
- Suggested fix: Balance the mixed sheet across all five M1 shapes (roughly 7 each) and show one example per shape, or at least one 'greater/less' and one 'before/after' example.

#### M2:Numbers after — to 100 → M2:Numbers before — to 100
- **lesson-mismatch** · **already resolved** — tens method + crossing-ten case
- Evidence: Worked example 'What number comes before 40? → 39' with the single step '40 → 39'. Sheet 15 includes the crossing-tens cases the lesson exists for: 'before 30 → 29', 'before 50 → 49', 'before 70 → 69', 'before 51 → 50', 'before 71 → 70'.
- Why the child is lost: The step is the answer restated; the new idea (a round ten goes back to the previous ten's 9) is never said. Children who cleared M1 counting back to 57 will mostly manage, but the 40→39 and 30→29 cases are exactly where they stall.
- Suggested fix: Step: 'One less than 4 tens is 3 tens and 9 ones: 39.' Add a second example crossing a ten (e.g. before 70 → 69).

#### M2:Skip counting by 5 → M2:Skip counting by 10
- **cliff** · **already resolved** — sheet 81 ≤ 150
- Evidence: A tops out at '140, 145, 150, ___ → 155'. B: '___, 220, 230, 240 → 210', '240, 230, 220, ___ → 210', '230, 220, 210, ___ → 200'. Lesson example: '10, 20, 30, ___ → 40'.
- Why the child is lost: Three-digit numbers above 160 and the 200s appear for the first time with no place-value support (place value taught only for tens/ones). Counting by ten is easy enough that most children ride the pattern, but the 190→200→210 boundary is untaught.
- Suggested fix: First sheet in 0–150; include one example crossing 100 ('80, 90, 100, ___ → 110').

#### M2:Skip counting by 10 → M2:Compare two-digit numbers
- **untaught-shape** · **already resolved** — same-tens step present
- Evidence: Lesson: 'Which is greater: 35 or 53? → 53 — Compare tens: 5 tens > 3 tens'. Sheet 91 includes same-tens pairs: '66 or 62', '28 or 29', '87 or 83', '71 or 72', '38 or 30'.
- Why the child is lost: The single rule taught ('compare tens') gives no answer when the tens are equal; the child needs 'then compare ones', which is never stated. Most fall back to M1 counting, so not a wall.
- Suggested fix: Add a second step/example: 'If the tens are the same, compare the ones: 66 or 62 → 6 ones > 2 ones, so 66.'

#### M2:Compare two-digit numbers → M3:Adding by counting on (+1, +2, +3)
- **broken** · **fixed** — one format per fact per sheet across M3–M6; validateArithmetic flags fact-in-two-formats
- Evidence: Sheet 1 repeats the same fact as typed and multiple-choice: '4 + 2' and '4 + 2 = ? [5|7|6|8]', '3 + 3' and '3 + 3 = ? [5|6|7|8]', '1 + 2' twice, '2 + 1' twice, '5 + 1' twice. Same pattern on the Doubles first sheet ('9 + 9', '6 + 6', '3 + 3' each twice) and the Adding-zero first sheet ('3 + 3', '6 + 6' twice).
- Why the child is lost: Not a wall, but 5 of 30 questions are duplicates so the sheet measures 25 distinct facts; the uniqueness guard does not treat arithmetic and MC variants of one fact as the same item.
- Suggested fix: Dedupe by fact (a, b) across formats when building a sheet.

#### M3:Adding by counting on (+1, +2, +3) → M3:Doubles (1+1 … 9+9)
- **lesson-mismatch** · **fixed** — 10+10..12+12 late; two doubles methods replace the restated step
- Evidence: Lesson: '6 + 6 = → 12 — Double 6 is 12' (step restates the answer). Sheet 6 asks '7 + ___ = 14', '9 + ___ = 18', '8 + ___ = 16', '10 + ___ = 20', '6 + ___ = 12' (missing-addend doubles, not shown) and '10 + 10 → 20' (outside the 1+1…9+9 title). The lesson's last sheet (seen in the next transition's A) goes to '12 + 12 → 24' and '11 + ___ = 22'.
- Why the child is lost: Doubles are a recall fact, so children largely cope, but the only step gives no way to derive a double (e.g. 6+6 as 5+5+2, or fingers/dice), and a third of the sheet is the missing-addend shape the lesson never shows.
- Suggested fix: Step: 'Think 5 + 5 = 10, then 2 more: 12', or a dot-pair picture. Keep the first sheet to plain doubles 1+1…9+9; introduce '7 + ___ = 14' on sheet 2+.

#### M3:Adding zero & turnarounds → M3:Near-doubles (use the double you know)
- **lesson-mismatch** · **already resolved** — sheet 12 is near-doubles only
- Evidence: Lesson: '6 + 7 = → 13 — 6 + 6 = 12, 12 + 1 = 13'. Sheet 12's near-doubles are all tiny: '5 + 4', '3 + 4', '4 + 3', '4 + 5', '2 + 1', '1 + 2', '3 + 2', '2 + 3'; the rest is '1 + ___ = 2', '2 + ___ = 3', '0 + ___ = 2', '12 + ___ = 24', '11 + ___ = 22', '10 + 10'. A's last sheet was harder ('8 + 4 → 12', '5 + 6 → 11', '9 + ___ = 12').
- Why the child is lost: No one is lost — the sheet is a step backwards from the previous day (sums to 9 after sums to 12), and the taught strategy is never needed because every item is countable on fingers. The strategy goes unpractised on day one.
- Suggested fix: First near-doubles sheet should contain 5+6, 6+7, 7+8, 8+9 and their turnarounds, with missing addends like '6 + ___ = 13' only after the plain facts.

#### M3:Make ten & bridging through 10 → M3:Fact families to 18
- **prereq-gap** · **fixed** — fact-family lesson counts up, no subtraction; unit facts are sums 10–18
- Evidence: Lesson: '7 + ___ = 12 → 5 — 12 - 7 = 5'. Subtraction has never been taught (no '−' anywhere in M1–M3 before this). Sheet 21 has no subtraction and no sum above 9: '1 + 8', '6 + ___ = 8', '2 + ___ = 7', '5 + 3', '1 + 7'. A's last sheet was '8 + 9 → 17', '8 + ___ = 17', '8 + ___ = 15'.
- Why the child is lost: The only method offered uses an untaught operation, so the lesson explains nothing to this child; luckily the sheet is a large step DOWN (sums to 9, which the child has been doing since lesson 1), so nobody is stuck — but 'fact families to 18' is not practised and the '−' symbol appears once with no introduction.
- Suggested fix: Either teach the count-up method here ('7, then 8 9 10 11 12 — five jumps') or move this lesson after subtraction. Make the first sheet actually use sums 10–18 as the title says.

#### M3:2-digit addition (no regrouping) → M3:2-digit addition (regrouping)
- **untaught-shape** · **fixed** — regroup example carries 25 + 25; no-regroup example teaches its missing-number shape
- Evidence: Lesson: '37 + 45 — Ones: 7 + 5 = 12 → write 2, carry 1'. Sheet 45 (only 10 items) has three where the ones make exactly ten: '22 + 28 → 50', '37 + 13 → 50', '25 + 25 → 50'.
- Why the child is lost: The 'write 0, carry 1' case is a known stumbling point (children write 10 or leave the ones blank) and is not modelled. Also, A's last sheet used '___ + 14 = 25' missing-addend items that the no-regroup lesson never taught.
- Suggested fix: Add a second example with ones summing to exactly 10 ('25 + 25: 5 + 5 = 10 → write 0, carry 1'). Keep '___ + 14 = 25' out of the no-regroup lesson or teach it there.

#### M4:Find the difference (count up) → M4:Halving & near-halves (using doubles)
- **lesson-mismatch** · **fixed** — near-half steps added
- Evidence: Goal: 'Subtracts using known doubles (12−6, 13−6)'. Worked example only shows the exact half '12 - 6 = 6 — 6 + 6 = 12'. Sheet has near-halves '11 - 5 → 6', '9 - 4 → 5', '9 - ___ = 5 → 4', '7 - 3 → 4' with no near-half step shown.
- Why the child is lost: The child can still count back or count up (both taught), so not lost, but the lesson's own advertised near-half trick (13−6 = 12−6 + 1) is never demonstrated, so the sheet does not actually build the doubles strategy.
- Suggested fix: Add a second step or example: '11 - 5: 10 - 5 = 5, and 11 is one more, so 6' (or '13 - 6: 12 - 6 = 6, one more → 7').

#### M4:Bridging down through 10 → M4:Fact families to 18
- **lesson-mismatch** · **fixed** — family add form on sheets; count-up family example
- Evidence: Goal: 'Uses the add/subtract inverse and missing addends'. Worked example: '7 + ___ = 12 → 5 — 12 - 7 = 5'. Sheet 33 contains zero '+ ___' questions; it is 30 plain subtractions/missing subtrahends already covered ('6 - 4', '13 - 7', '2 - ___ = 1', '18 - 9 = ?').
- Why the child is lost: Child is not lost (everything on the sheet was practised on earlier days), but the one thing the lesson teaches — a missing addend — never appears, so the fact-family idea is not exercised.
- Suggested fix: Put missing-addend items ('7 + ___ = 12', '9 + ___ = 16') and paired triples (13 - 7 next to 7 + 6) on sheet 33.

#### M4:3-digit subtraction (regrouping) → M4:Missing number & mixed review
- **lesson-mismatch** · **fixed** — mixed review mixes 2-digit, 3-digit and missing shapes (was 30 identical)
- Evidence: Goal: 'Solves for the unknown, reviewing every subtraction type'. Sheet 89: all 30 are the same shape, 2-digit missing subtrahend: '40 - ___ = 23', '84 - ___ = 51', '54 - ___ = 53', '50 - ___ = 11'. No 3-digit, no direct subtraction, no facts.
- Why the child is lost: Child can do it (this exact shape was already forced on them in the borrowing lesson), but a 'mixed review' that is 30 identical items reviews nothing, and the lesson step '45 - 18 = 27' never says WHY you subtract the two known numbers.
- Suggested fix: Mix facts to 18, 2-digit direct, 3-digit direct and missing numbers on sheet 89; add one sentence to the lesson: 'The missing number is what is left after taking 18 from 45, so subtract.'

#### M5:Square facts (n × n) → M5:×3 and ×4 (build from ×2)
- **prereq-gap** · **fixed** — ×3 method (double, then one more)
- Evidence: Sheet 13 contains '12 × 12 → 144'. The squares sheets seen so far stop at '11 × 11'; ×12 is taught in lesson 7 ('×10, ×11, ×12').
- Why the child is lost: A single fact the child has no way to know or derive appears in the middle of a ×3/×4 sheet; also the worked example shows only the ×4 double-double ('Double 7 is 14, double again: 28') and never a ×3 method, while 3× items are half the sheet ('3 × 6 = ?', '3 × ___ = 15').
- Suggested fix: Drop 12 × 12 from sheet 13; add a ×3 step to the lesson ('3 × 6: double 6 is 12, one more 6 is 18').

#### M5:×3 and ×4 (build from ×2) → M5:×6, ×7, ×8, ×9 (the hard facts)
- **prereq-gap** · **fixed** — review tables capped at ×10 on ×6–×9 sheets
- Evidence: Sheet 23 contains '4 × 11 → 44' and '12 × 12 → 144'; ×11 and ×12 are lesson 7. Otherwise the sheet is well graded ('9 × 2', '6 × 3', '7 × 3', '8 × 4', '6 × 5') and the lesson's 5s-plus strategy fits.
- Why the child is lost: Two stray facts from a later lesson; the child can skip-count 11 four times so it is not a wall, just out of order.
- Suggested fix: Filter review items on ×6–×9 sheets to factors ≤ 10 until lesson 7 is cleared.

#### M5:Break apart to multiply (no carrying) → M5:Carrying in multiplication
- **lesson-mismatch** · **fixed (partly)** — write/carry scaffold items in the lesson language; bare items in the opening band
- Evidence: Lesson teaches the column algorithm: '27 × 4: Ones: 7 × 4 = 28 → write 8, carry 2; Tens: 2 × 4 = 8 — multiply FIRST; THEN add the carry'. Sheet 69 is entirely break-apart: '6 × 2 = 12 and 10 × 2 = 20. So 16 × 2 = → 32', '16 × 5 Tens: 10 × 5 = → 50', '19 × 5 Ones first: 9 × 5 = → 45'. No item ever asks the child to write a digit and carry.
- Why the child is lost: Child is not lost (yesterday's break-apart method solves every item), but the whole 'carry' procedure the lesson spent its one showing on is never practised, so it will not stick and the next lesson ('2-digit × 1-digit') assumes it.
- Suggested fix: Either rename this lesson 'Break apart with regrouping' and teach break-apart, or put 3-4 genuine column items on sheet 69 ('27 × 4', '18 × 6') with the ones/tens scaffold matching the lesson.

#### M5:Carrying in multiplication → M5:2-digit × 1-digit
- **lesson-mismatch** · **already resolved** — sheet 79 genuine 2-digit × 1-digit
- Evidence: Worked example '47 × 6 = 282' with carrying. Sheet 79 (10 items): 7 are single-digit missing factor ('5 × ___ = 25', '9 × ___ = 54', '2 × ___ = 16'); only 3 match the lesson ('14 × 6 → 84', '25 × 4 → 100', '23 × 7 → 161').
- Why the child is lost: Not a wall, but 70% of the first sheet is review of a much earlier lesson, so the child gets three attempts at the new skill before the day 'clears'.
- Suggested fix: Make sheet 79 at least 7 of 10 genuine 2-digit × 1-digit with carrying.

#### M6:÷2, ÷5, ÷10 → M6:÷1 and dividing a number by itself
- **untaught-shape** · **already resolved** — ÷1 example present
- Evidence: Worked example only: '8 ÷ 8 = 1 — A number divided by itself is 1'. Sheet 7 opens '1 ÷ 1', '5 ÷ 1 → 5', '3 ÷ 1', '2 ÷ 1', '4 ÷ 1' and has '4 ÷ ___ = 1 → 4', '3 ÷ ___ = 3 → 1'.
- Why the child is lost: ÷1 is half the sheet and is only named in the goal, never shown; most children will get it by 'how many 1s in 5', but the lesson does not do its job.
- Suggested fix: Add a second example: '5 ÷ 1 = 5 — sharing into groups of 1 gives 5 groups; any number ÷ 1 is itself.'

#### M6:÷6, ÷7, ÷8, ÷9 → M6:Fact families & missing dividend
- **lesson-mismatch** · **already resolved** — sheet 37 has missing-dividend items
- Evidence: Worked example: '___ ÷ 6 = 7 → 42 — 6 × 7 = 42' (missing dividend). Sheet 37 (24 items) has zero '___ ÷' items; every question is direct ('20 ÷ 10', '24 ÷ 2', '15 ÷ 5') or missing divisor ('25 ÷ ___ = 5', '12 ÷ ___ = 4').
- Why the child is lost: Child is not lost — the sheet is all already-practised shapes — but the missing-dividend shape the lesson introduces is never practised here and then appears cold on the level's Mixed review sheet ('___ ÷ 3 = 2', '___ ÷ 2 = 6').
- Suggested fix: Put 8-10 missing-dividend items ('___ ÷ 6 = 7', '___ ÷ 4 = 5') on sheet 37.

#### M6:Mixed review → M7:Part of a whole
- **lesson-mismatch** · **fixed** — every M7 unit now carries a real big idea and a ≥3-step method
- Evidence: goal: Names the fraction shaded in a picture / big idea: Names the fraction shaded in a picture. SYSTEMIC: all 31 micro-lessons in this level have big idea identical to goal (e.g. 'Compares decimals' / 'Compares decimals', 'Finds equivalent fractions' / 'Finds equivalent fractions').
- Why the child is lost: The 'big idea' slot never carries an idea, so the only teaching a child gets is whatever the worked-example steps happen to say; where those steps are thin (see findings below) the lesson teaches nothing.
- Suggested fix: Write a real big idea per lesson (here: 'The bottom number counts equal parts; the top number counts the shaded ones') and stop auto-copying the goal into the big-idea field.

#### M7:Understanding the denominator → M7:Writing fractions from pictures
- **lesson-mismatch** · **fixed** — lesson 1 draws single shapes, lesson 4 draws rectangular grids (rows × columns) — no reorder needed
- Evidence: worked example: [[viz grid 30 100]] → 30/100, step 'Shaded ÷ total = 30/100'; sheet 4 is [[viz pie 1 6]] → 1/6, [[viz vbar 4 5]] → 4/5, [[viz penta 4 6]] → 4/6 ... — the identical pictures and answers as sheet 1 of 'Part of a whole'.
- Why the child is lost: Not a wall, but the example uses a 100-square grid the child has never seen and the '÷' symbol (fraction-as-division is not yet taught), while the sheet is a straight repeat of lesson 1. Lessons 1 and 4 are the same task.
- Suggested fix: Use a small-shape example (e.g. penta 4/6) with 'shaded over total', and either drop lesson 4 or make it genuinely new (e.g. fractions of a set / number line).

#### M7:Compare fractions → M7:Order fractions
- **lesson-mismatch** · **already resolved** — 6/12, 3/12, 8/12 written out in the steps
- Evidence: worked example: '1/2, 1/4, 2/3 → 1/4 < 1/2 < 2/3' with the single step 'Common denominator 12'.
- Why the child is lost: The step names the answer without showing it (6/12, 3/12, 8/12 never appear), so a child who did not fully own common denominators yesterday gets no second chance to see the method.
- Suggested fix: Expand steps: '12 works for 2, 4 and 3 → 6/12, 3/12, 8/12 → smallest top first: 3/12 < 6/12 < 8/12'.

#### M7:Mixed numbers → M7:Improper fractions
- **untaught-shape** · **already resolved** — improper-fraction prompts carry the instruction; no reducible parts
- Evidence: Sheet 35 questions are bare mixed numbers with no instruction: '1 1/3 → 4/3', '1 2/4 → 6/4', whereas the previous lesson's questions read 'Write 3/2 as a mixed number.'
- Why the child is lost: A question that is just '1 1/3' does not say what to do; a child could reasonably simplify, draw, or leave it. Only the micro-lesson seen once that morning tells them the target form.
- Suggested fix: Prefix every question with 'Write 1 1/3 as an improper fraction.' Also accept 3/2 for '1 2/4' as well as 6/4.

#### M7:Multiply fractions → M7:Divide fractions
- **lesson-mismatch** · **already resolved** — 1/2 ÷ 2/3 → 3/4 example names the reciprocal
- Evidence: worked example '1/2 ÷ 1/4 → 2; Flip and multiply: 1/2 × 4/1'. Sheet answers are mostly fractions, many improper: '2/4 ÷ 1/5 → 5/2', '2/5 ÷ 1/6 → 12/5', '3/4 ÷ 2/6 → 9/4', '4/5 ÷ 5/6 → 24/25'. Goal says 'using the reciprocal' but the word is never defined.
- Why the child is lost: The example's whole-number answer hides the form the sheet actually wants (a simplified fraction, left improper). A child who writes 2 1/2 for 5/2 may be marked wrong; the step also never says 'then simplify' (needed for 3/4 ÷ 2/6 → 18/8 → 9/4).
- Suggested fix: Use an example with a fractional result, e.g. '1/2 ÷ 2/3: flip 2/3 to 3/2 (its reciprocal), 1/2 × 3/2 = 3/4, simplify if needed', and grade by value.

#### M7:Multiply decimals → M7:Divide decimals
- **prereq-gap** · **fixed** — dividend cap already banded; lesson now has cover-the-point / place / check / whole-number steps
- Evidence: Sheet 73 ends with '10.4 ÷ 8 → 1.3', '12.8 ÷ 8 → 1.6' (last sheet: '10.8 ÷ 9 → 1.2', '12.6 ÷ 7 → 1.8'); also '8.0 ÷ 8 → 1' and '4.0 ÷ 2 → 2'.
- Why the child is lost: Following the lesson ('12 ÷ 3 = 4, one decimal place') means computing 104 ÷ 8 and 128 ÷ 8 — three-digit dividends, beyond the M6 two-digit-with-remainder work shown ('38 ÷ 8 → 4 r 6'). Most children can still do it, and the rest of the sheet is fine. '8.0 ÷ 8 → 1' should also accept 1.0.
- Suggested fix: Cap first-sheet dividends at two digits (max 9.9) and accept 1.0 / 2.0.

#### M7:Decimal mastery → M7:Understand percent
- **untaught-shape** · **already resolved** — 25% = 25/100 step present
- Evidence: Lesson: '[[viz grid 25 100]] → 25%; 25 of 100 squares'. Sheet: '15% → fraction of 100 → 15/100', '45% → fraction of 100 → 45/100' (7 of 14 are this reverse form).
- Why the child is lost: The reverse direction (percent → fraction over 100) is not shown, though it is a short step and the phrase 'fraction of 100' gives the form away. Polish only.
- Suggested fix: Add a second step to the example: 'so 25% = 25/100'.

#### M7:Percent of a number → M7:Percent increase & decrease
- **untaught-shape** · **already resolved** — increase example 20 + 50% present
- Evidence: Lesson shows a decrease only: '80 − 25% → 60; 25% of 80 = 20, 80 − 20 = 60'. Sheet has 17 increases: '20 + 50% → 30', '48 + 25% → 60', '60 + 20% → 72', '80 + 20% → 96'.
- Why the child is lost: The '+' direction follows by analogy and most children will get it, but with 17 of 30 items being increases the lesson should show one. The notation '20 − 20%' is also nonstandard (reads as a subtraction of a percent) — fine only because the lesson uses the same notation.
- Suggested fix: Add an increase example ('20 + 50%: 50% of 20 = 10, 20 + 10 = 30') or word items 'Increase 20 by 50%' / 'Decrease 80 by 25%'.

#### M7:Percent mastery → M8:Decimals — add (tenths)
- **lesson-mismatch** · **already resolved** — Unit.idea on all M8–M11 units; added to the seven M12 units touched
- Evidence: goal: Adds decimals to one place / big idea: Adds decimals to one place. This is true of EVERY micro-lesson in M8, M9, M10 and M11 (e.g. M10 'goal: Solves one-step inequalities / big idea: Solves one-step inequalities').
- Why the child is lost: The 'big idea' slot never carries an idea; it repeats the goal verbatim, so the child gets the method only from the single worked example. Not a wall on its own, but it removes the one place a rule could be stated.
- Suggested fix: Write a real one-sentence big idea per lesson (e.g. 'Tenths add like whole numbers as long as the decimal points are lined up'). Systemic: fix the content field, not each lesson by hand.

#### M7:Percent mastery → M8:Decimals — add (tenths)
- **broken** · **already resolved** — unordered pairs in enumDecAdd
- Evidence: Sheet 1 contains '0.3 + 2.4 → 2.7' and '2.4 + 0.3 → 2.7', and '2.0 + 2.4 → 4.4' and '2.4 + 2.0 → 4.4'.
- Why the child is lost: Not a wall; commutative near-duplicates waste 4 of 30 slots on the first day.
- Suggested fix: Dedupe by unordered operand pair in the add generators.

#### M8:Decimals — add (tenths) → M8:Decimals — add (hundredths)
- **lesson-mismatch** · **already resolved** — trailing-zero step; grader numeric-equal
- Evidence: Worked example: 0.25 + 0.36 → 0.61 ('25 + 36 = 61 hundredths'). Sheet 11: '0.03 + 0.27 → 0.3', '0.36 + 0.10 → 0.46', '0.05 + 0.11 → 0.16'.
- Why the child is lost: Following the taught rule the child writes 3 + 27 = 30 hundredths = 0.30, but the key is 0.3. If the grader is string-based the correct answer 0.30 is marked wrong; the lesson never says trailing zeros may be dropped.
- Suggested fix: Either accept 0.30 and 0.3 as equal (numeric compare) or add a step to the example ('0.30 is the same as 0.3'). Same issue on subtract (hundredths) sheet 31 ('0.18 - 0.08 → 0.1', '0.44 - 0.14 → 0.3', '0.48 - 0.38 → 0.1').

#### M8:Decimals — subtract (tenths) → M8:Decimals — subtract (hundredths)
- **lesson-mismatch** · **already resolved** — same
- Evidence: Worked example 0.72 - 0.45 → 0.27 ('72 - 45 = 27 hundredths'). Sheet 31: '0.18 - 0.08 → 0.1', '0.44 - 0.14 → 0.3', '0.34 - 0.34 → 0'.
- Why the child is lost: Same trailing-zero ambiguity as add (hundredths): the method yields 0.10 / 0.30 / 0.00 but the key shows 0.1 / 0.3 / 0.
- Suggested fix: Numeric-equality grading for decimal answers, or avoid results ending in 0 on the first sheet.

#### M8:Decimals — subtract (hundredths) → M8:Decimals — multiply by a whole number
- **lesson-mismatch** · **already resolved** — x.0 × n items banded so 1.0 × 4 no longer opens the sheet
- Evidence: Worked example: 0.6 × 4 → 2.4 ('6 × 4 = 24, one decimal place → 2.4'). Sheet 41 opens with '1.0 × 4 → 4', then '2.8 × 3 → 8.4', '4.7 × 3 → 14.1', '4.4 × 7 → 30.8'.
- Why the child is lost: The example is a single digit times a single digit; 27 of 30 sheet items are a two-digit decimal (e.g. 4.7 → 47 × 3) and the very first item's answer is a whole number (4, not 4.0) which the 'one decimal place' rule doesn't produce.
- Suggested fix: Use a two-digit example (2.8 × 3: 28 × 3 = 84 → 8.4) and note '4.0 = 4'; start the sheet with 0.6 × 6-type items before x.y × n.

#### M8:Decimals — multiply by a whole number → M8:Decimals — multiply two decimals
- **lesson-mismatch** · **already resolved** — 0.10 = 0.1 step present
- Evidence: Worked example 0.3 × 0.4 → 0.12 ('two decimal places → 0.12'). Sheet 53: '0.5 × 0.2 → 0.1', '0.5 × 0.8 → 0.4', '0.4 × 1.5 → 0.6', '0.9 × 1.0 → 0.9'.
- Why the child is lost: Applying the rule gives 0.10, 0.40, 0.60, 0.90; the key drops the zero. The '0.30 = 0.3' step exists only in the mixed-review example ten lessons later.
- Suggested fix: Add the '0.10 = 0.1' step to this example (as the mixed-review example already does) and/or grade numerically.

#### M8:Decimals — divide by a whole number → M8:Percentages of a number
- **lesson-mismatch** · **already resolved** — 40% of 35 via the 10% method
- Evidence: Worked example: 25% of 40 → 10 ('25% = 1/4, 40 ÷ 4 = 10'). Sheet 73: '40% of 35 → 14', '60% of 15 → 9', '5% of 40 → 2', '70% of 40 → 28', '90% of 50 → 45'.
- Why the child is lost: The only method shown (convert to a unit fraction) does not work for 40%, 60%, 5%, 70%, 90%. The child survives only because M7 'Percent mastery' already drilled this (A shows '75% of 28 → 21'), so M8 lesson 8 is effectively a repeat of M7.
- Suggested fix: Show the 10% method in the example ('10% of 35 = 3.5, so 40% = 4 × 3.5 = 14') or make the example 40% of 35 to match the sheet.

#### M8:Percentages of a number → M8:Convert fractions, decimals, percents
- **cliff** · **already resolved** — denominator bands + opening window
- Evidence: A (last sheet): '80% of 55 → 44', '90% of 50 → 45'. B (first sheet): 'Write 7/8 as a decimal → 0.875', 'Write 0.125 as a percent → 12.5%'.
- Why the child is lost: The child goes from whole-number percent answers to thousandths and fractional percents on day one; 7/8 requires dividing to three decimal places, which no decimal-division sheet (all one-place results, e.g. '9.6 ÷ 6 → 1.6') prepared.
- Suggested fix: Keep sheet 85 to denominators 2, 4, 5, 10, 20; introduce eighths after a sheet or two.

#### M8:Convert fractions, decimals, percents → M8:Decimals — mixed review
- **lesson-mismatch** · **fixed** — mixed review now draws 3–4 of every lesson type per sheet (reviewPool)
- Evidence: goal: Works fluently across all decimal operations. Sheet 95 (26 items): 20 are hundredths addition ('0.03 + 0.32', '0.30 + 0.06', …), 4 are two-decimal products, 2 are percents ('90% of 60', '25% of 92'). Zero subtraction, zero division, zero conversion.
- Why the child is lost: Not a wall (it is easier than what came before), but the review does not review; a child weak on subtraction/division clears it untested.
- Suggested fix: Stratify the review generator: at least 3 items from each of the 9 preceding lessons.

#### M9:Ratios — solve a proportion → M9:Ratios — scale up
- **cliff** · **not fixable without reorder — mitigated** — equivalent-ratios example now teaches scaling both parts before lessons 3–4 need it; M9 mixed review also rebalanced
- Evidence: A: 'Find the missing number: 5 : 9 = ___ : 36 → 20' (find the scale, then multiply). B: 'Write an equivalent ratio: scale 3 : 4 by 2 → 6 : 8' (the scale is given).
- Why the child is lost: Reverse cliff: 'scale up' is the prerequisite for 'equivalent ratios' and 'solve a proportion' yet comes after both. Nobody gets lost, but the sequence teaches the hard skill before the easy one.
- Suggested fix: Reorder M9 to: simplify → scale up → equivalent ratios → solve a proportion → mixed review.

#### M10:Expressions · Evaluate (×) → M10:Simplify · Combine like terms
- **lesson-mismatch** · **already resolved** — 1x in example
- Evidence: Worked example: '2x + 3x → 5x: Add coefficients: 2 + 3 = 5'. Sheet 26: 'Simplify 2x + x → 3x', 'Simplify x + 5x → 6x', 'Simplify 7x + x → 8x' (8 of 30 items).
- Why the child is lost: The example never says a bare x means 1x; a child adding 'coefficients' sees none on x and may answer 2x or 7x.
- Suggested fix: Add a second example line: 'x + 4x: x means 1x, so 1 + 4 = 5x'.

#### M10:Simplify · Combine like terms → M10:Simplify · Distributive property
- **lesson-mismatch** · **already resolved** — minus-inside in example
- Evidence: Worked example: '3(x + 4) → 3x + 12'. Sheet 38 item 4: 'Expand 2(x - 2) → 2x - 4', plus 'Expand 3(x - 5) → 3x - 15', 'Expand 6(x - 5) → 6x - 30' (12 of 30 items subtract inside the bracket).
- Why the child is lost: The minus case is not shown; children commonly write 2x + 4. Most will infer it, so minor.
- Suggested fix: Add a second line to the example: '2(x − 5) → 2x − 10 (the sign stays with the number)'.

#### M10:Simplify · Order of operations → M10:Equations · One-step (+/−)
- **lesson-mismatch** · **already resolved** — add-to-both-sides in example
- Evidence: Worked example: 'x + 5 = 12 → 7: Subtract 5 on BOTH sides'. Sheet 51 item 1: 'Solve for x: x - 3 = 2 → 5', also 'x - 14 = 2 → 16', 'x - 12 = 4 → 16' (12 of 30 are x − b = c).
- Why the child is lost: The only move taught is 'subtract'; the first question needs 'add 3 to both sides'. A literal child subtracts 3 from 2 and, per the previous transition, cannot even compute that.
- Suggested fix: Two-line example: 'x + 5 = 12 → subtract 5' and 'x − 3 = 2 → add 3 to BOTH sides → x = 5', or order sheet 51 so the first 8 items are all x + b = c.

#### M10:Equations · Integer add & subtract → M10:Equations · One-step inequalities
- **lesson-mismatch** · **already resolved** — > form in example
- Evidence: Worked example: 'x + 3 < 8 → x < 5'. Sheet 77 item 3: 'Solve for x: x - 1 > 4 → x > 5'; 17 of 30 items are x − b > c.
- Why the child is lost: Neither the '>' symbol nor the 'add to both sides' move appears in the example; the answer must be typed as an inequality ('x > 5'), a new answer shape shown only for '<'. Most children will manage from the one-step equations lesson, so minor.
- Suggested fix: Two-line example covering both 'x + 3 < 8 → x < 5' and 'x − 2 > 6 → x > 8', with a note that the symbol is copied through.

#### M10:Coordinate Plane · Plot points → M10:Coordinate Plane · Patterns & intro to slope
- **untaught-shape** · **already resolved** — step-question line and points in example
- Evidence: Worked example: 'Find the next number: 2, 5, 8, 11, ___ → 14'. Sheet 93 item 3: 'Each step grows by the same amount (the "slope"). What is the step for: 1, 3, 5, 7? → 2' (9 of 19 items).
- Why the child is lost: The 'what is the step' form is not in the example, but the question text explains itself, and the sequences are trivial. No connection is made to the coordinate plane despite the title, so the word 'slope' arrives with no graph behind it.
- Suggested fix: Add a second example line for the step question and, ideally, show the pattern as points (1,2),(2,5),(3,8) on the grid the child just learned to plot on.

#### M10:Coordinate Plane · Patterns & intro to slope → M11:Plot points on the coordinate plane
- **lesson-mismatch** · **already resolved** — example bridges to where a line crosses the y-axis
- Evidence: M11 lesson 1 micro-lesson ('Plot the point (3, 2) → From the origin, move right 3… Then move up 2') and sheet ('Plot the point (-3, -3)', 'Plot the y-intercept of the line y = x − 2 → 0,-2') are the same lesson as M10 lesson 11 'Coordinate Plane · Plot points' (sheet 81) with identical item types.
- Why the child is lost: Nobody gets lost (they cleared it 2 days ago), but the first day of M11 is a repeat, and the y-intercept items are still untaught here (the M10 example never explained them either).
- Suggested fix: Replace M11 lesson 1 with a genuine bridge: 'y-intercept and slope on the grid' (plot (0, b), then step up m right 1), which is exactly what 'Graph a line' needs the next day.

#### M11:Plot points on the coordinate plane → M11:Graph a line
- **untaught-shape** · **already resolved** — builder banded after positive lines
- Evidence: Sheet 5 item 22: 'What is the equation of the line shown? Build it with the slope and intercept. → 1,-3' (also appears on the last sheet of the lesson).
- Why the child is lost: This is the reverse task (read slope and intercept off a drawn line) and is not in the micro-lesson; it is one item so it will not fail the day, but the child meets it cold.
- Suggested fix: Either drop it from sheet 5 or add an example line 'reading a line: where it crosses the y-axis is b; count up/right for m'.

#### M11:Equations with distribution → M11:Variables on both sides
- **broken** · **already resolved** — term() renders x, never 1x
- Evidence: 'Solve for x: 5x + 1 = 1x + 5', '3x + 5 = 1x + 15', '6x + 4 = 1x + 24', '4x + 9 = 1x + 36' (and on the last sheet '7x + 7 = 1x + 49').
- Why the child is lost: '1x' is never written in mathematics and never appears in any lesson; it reads as a rendering bug and confuses a child who was told bare x means 1x.
- Suggested fix: Format coefficient 1 as 'x' in the equation renderer.

#### M11:Equations with a fraction → M11:Linear equations — mixed review
- **lesson-mismatch** · **fixed** — mixed review serves 6 of each equation type per sheet
- Evidence: goal: Solves linear equations of every type. Sheet 87 (30 items): 29 are two-step ax ± b = c, 1 is distribution ('3(x + 5) = 18'); zero variables-on-both-sides, zero x/d = q, zero graphing.
- Why the child is lost: Not a wall; the review is a two-step drill and never re-tests the harder lessons 7–8 just completed.
- Suggested fix: Stratify the review across all equation types (at least 3 items each of distribution, both-sides, fraction).

#### M12:Write in standard form → M12:Leading coefficient
- **untaught-shape** · **fixed** — negative leading coefficients banded after positive; example and directive say the sign is included
- Evidence: Micro-lesson example is '4x³ + x - 7 → 4'. First sheet item 6: 'What is the leading coefficient of -3x² + x + 7? → -3' (9 of 24 items negative).
- Why the child is lost: Negative leading coefficients are never shown; some students will answer 3.
- Suggested fix: Add a second example with a negative leading term.

#### M12:Evaluate polynomials → M12:Combine like terms (x²)
- **untaught-shape** · **fixed** — subtraction banded after sums; example teaches bare x² = 1x² and the typed form x²
- Evidence: Micro-lesson: '3x² + 2x² → 5x² — Add coefficients'. Sheet item 4: 'Simplify 3x² - 2x² → x²', item 10: 'Simplify 6x² - x² → 5x²'.
- Why the child is lost: Subtraction and the implicit coefficient 1 (x² not 1x²) are not shown; the grader may or may not accept '1x²'.
- Suggested fix: Add 'x² means 1x²' and one subtraction step; accept 1x².

#### M12:Multiply monomials → M12:Distribute a monomial
- **untaught-shape** · **fixed** — minus-inside items banded; example adds 2x(x − 1) = 2x² − 2x
- Evidence: Micro-lesson: '2x(x + 3) → 2x² + 6x'. Sheet item 1: 'Expand 2x(x - 1) → 2x² - 2x'.
- Why the child is lost: The very first item has a minus inside the bracket, which the example never shows.
- Suggested fix: Start the sheet with plus items or add a minus example.

#### M12:Distribute a monomial → M12:Multiply binomials (FOIL)
- **lesson-mismatch** · **fixed** — Outer/Inner steps and the new-step callout vs distribution
- Evidence: Worked example steps: 'First x·x = x²; Outer+Inner = 5x; Last 2·3 = 6'.
- Why the child is lost: The middle step just states the answer 5x without showing 3x + 2x, which is the whole new idea versus yesterday's distribution.
- Suggested fix: Write 'Outer x·3 = 3x, Inner 2·x = 2x, together 5x'.

#### M12:Multiply binomials (FOIL) → M12:Partial products (box method)
- **untaught-shape** · **fixed** — box example describes the 2×2 grid in AreaModelInput order and ties back to FOIL
- Evidence: Sheet: 'Fill in the area model for (x + 2)(x + 2) → x²,2x,2x,4' (interactive grid). Worked example is a bulleted list, not a box, and lists x·3 before 2·x while the key order is x²,2x,3x,6.
- Why the child is lost: The student has never seen the box layout and must infer which cell is which; the lesson also goes backwards (they already FOIL these exact products).
- Suggested fix: Show the 2×2 box in the worked example with labelled rows/columns, or fold this into the FOIL lesson.

#### M12:Factor out the GCF → M12:Factor quadratic trinomials
- **untaught-shape** · **fixed** — typed factorizations practised before the a ≠ 1 lesson; directive states both input forms
- Evidence: Sheet: 'Select all the factors of x² + 5x + 6. [options: (x + 2) | (x + 1) | (x + 3) | (x + 4)] → (x + 2),(x + 3)' — a select-two multiple choice; the worked example produces a typed product.
- Why the child is lost: Multi-select is a new interaction (pick exactly two), and because the whole lesson is select-only the student never types a factorization before the a ≠ 1 lesson demands it.
- Suggested fix: Make sheets 77–78 typed 'Factor x² + 5x + 6' so the input form is practised before lesson 20.

#### M12:Difference of squares → M12:Perfect-square trinomials
- **untaught-shape** · **fixed** — minus case and (2x + 3)² in example; gcd-free (ax ± b)² items added; input form stated
- Evidence: Micro-lesson: 'x² + 6x + 9 → (x + 3)²'. Sheet item 2: 'Factor x² - 2x + 1 → (x - 1)²' (half the sheet is the minus form). Key uses the ² notation.
- Why the child is lost: The minus pattern and how to type '(x − 1)²' are not shown; a student who types (x - 1)(x - 1) may be rejected.
- Suggested fix: Add a minus example and accept (a − b)(a − b) as equivalent.

#### M13:Perfect squares & square roots → M13:Solve x² = k (perfect squares)
- **untaught-shape** · **fixed** — scaffolded x = ±___ leads the opening sheet; example shows both roots and the ± input form
- Evidence: Sheet item 1: 'Solve x² = 1 → ±1' (typed).
- Why the child is lost: The lesson never says how to enter '±' on a keyboard/number pad; the scaffolded variants (x = ±___) exist but the typed ± form comes first.
- Suggested fix: Put the 'Fill in the missing value: x = ±___' item first, and show the accepted input ('type +-1 or 1,-1') in the lesson.

#### M13:Solve x² = k (perfect squares) → M13:Larger, estimate & simplify roots
- **cliff** · **fixed** — method (biggest perfect square that divides in), √12 = 2√3 example, input form 5√2
- Evidence: A: 'Solve x² = 144 → ±12'. B item 1: 'Simplify the square root of 8 → 2√2' (typed with √), item 4: 'Which is larger: the square root of 26 or the square root of 37?'. Lesson: one example '50 = 25 × 2; √25 × √2 = 5√2'.
- Why the child is lost: Simplifying radicals (finding the largest square factor, writing a√b) is a genuinely new concept given a single example, and how to type '2√2' is unstated.
- Suggested fix: Add a second example (√12 = √4·√3 = 2√3) with the 'find the biggest perfect square inside' hint, and state the accepted input form.

#### M13:Larger, estimate & simplify roots → M13:Zero-product property
- **untaught-shape** · **fixed** — repeated-factor items banded; example states comma format, smaller first
- Evidence: Sheet item 1: 'Solve (x - 1)(x - 1) = 0 → 1'; item 4: 'Solve (x - 1)(x - 2) = 0 → 1, 2' (typed comma list). Lesson example has two distinct roots.
- Why the child is lost: The repeated-factor case (answer is a single number) is the first item and is unshown; the comma-separated input form is unstated.
- Suggested fix: Start with distinct roots; mention 'if both factors are the same, there is one answer'.

#### M13:Evaluate & axis of symmetry → M14:Evaluate f(x) = mx + b
- **broken** · **already resolved** — parab:a,h,k options are drawn as curves by GraphChoice
- Evidence: A (last M13 sheet): 'Which graph matches y = x² + 2? [options: parab:1,0,-2 | parab:1,-1,3 | parab:1,-2,0 | parab:1,0,2] → parab:1,0,2'.
- Why the child is lost: If these option codes are not rendered as graphs client-side, the student sees raw 'parab:1,0,2' strings; verify rendering.
- Suggested fix: Confirm the multiple-choice renderer draws the parabola for 'parab:a,h,k' options; otherwise replace with drawn options.

#### M14:Evaluate a quadratic function → M14:Composition of functions
- **broken** · **fixed** — numeric distractors now nearest in value; g(f(3)) step added
- Evidence: 'True or false: f(g(x)) = g(f(x)) for every pair of functions [options: False | 54 | True | 48]'; 'f(x) = x + 3, g(x) = x. Find f(g(1)) [options: 4 | 5 | 6 | 47]'.
- Why the child is lost: Numeric junk distractors on a true/false item and a stray 47 make guessing easy and look broken; the conceptual 'usually DIFFERENT' claim is not in the lesson.
- Suggested fix: Restrict distractors to the item's own template; add one line to the lesson: 'order matters — g(f(3)) = 2·4 = 8, not 7'.

#### M14:Composition of functions → M14:Domain of a rational function
- **broken** · **already resolved** — pool clean; directive states x ≠ 4 input form
- Evidence: 'Which x is NOT allowed for f(x) = 1/(x - 14)? [options: 12 | 16 | False | 14]'; 'Which x is NOT allowed for f(x) = 1/(x - 2)? [options: 4 | 6 | 2 | x ≠ 30]'; 'True or false: x = 1 is in the domain of f(x) = 1/(x - 1) [options: 16 | 14 | False | True]'.
- Why the child is lost: Cross-template distractor leakage; content itself is fine and matches the lesson.
- Suggested fix: Fix distractor pooling per template.

#### M14:Domain of a rational function → M14:Range of a quadratic
- **broken** · **already resolved** — directive states y ≥ 2, negative case, only x² has a floor
- Evidence: 'Range of f(x) = x² + (-15) [options: y ≥ -14 | y ≥ -15 | …] → y ≥ -15' (first item; lesson example is x² + 2); 'Range of f(x) = x² + (-14) → y ≥ -14' typed; 'Which function has range y ≥ 3? [options: x + 3 | x² + 3 | 3x | x² − 3]'; 'f(x) = x² + 1. What is the SMALLEST value f(x) can be? [options: 3 | 2 | x² + 9 | 1]'.
- Why the child is lost: 'x² + (-15)' is unrendered generator output (should read x² − 15); the sheet runs from c = −15 upward so the hardest (negative) cases come first; typing '≥' is unstated; the 'which function' item needs to know linear functions have no minimum, which is untaught.
- Suggested fix: Render x² − 15; order items from positive c to negative; state the input form ('type y>=-15'); add a lesson line 'x + 3 and 3x can be any number — only x² has a floor'.

#### M14:Range of a quadratic → M14:Inverse functions
- **untaught-shape** · **already resolved** — f⁻¹(f(x)) = x step added
- Evidence: Lesson: 'f(x) = x + 5. Find f⁻¹(12) → 7 — Inverse undoes +5; 12 - 5'. Sheet: 'True or false: f⁻¹(f(5)) = 6 for f(x) = x + 2 → False'; 'True or false: f⁻¹(f(6)) = 6 for f(x) = x + 3 [options: True | 5 | False]'.
- Why the child is lost: Nested f⁻¹(f(x)) is a new form not in the lesson (student can work it out via 'undo' but the idea that f⁻¹(f(x)) = x always is never stated); stray '5' distractor on a true/false item.
- Suggested fix: Add the line 'undoing what f did always returns the start: f⁻¹(f(5)) = 5' and fix the option pool.

#### M14:Inverse functions → M15:Pythagorean theorem
- **broken** · **fixed** — authored distractors for hypotenuse/leg items (legs added, root forgotten, longer leg)
- Evidence: 'hypotenuse 5, one leg 3. Find the other leg [options: 4 | 246 | 8 | 12]'; ladder 3,4 '[options: 120 | 5 | 13 | 10]'.
- Why the child is lost: Nonsense distractors (246, 120) make the item guessable rather than diagnostic.
- Suggested fix: Generate distractors from plausible errors (sqrt(25+9)≈5.8→ round, 5+3=8, 25−9=16).

#### M15:Pythagorean theorem → M15:Right-triangle ratios
- **broken** · **already resolved** — options all ratios / all sentences
- Evidence: 'Nora writes sin θ = adjacent/hypotenuse. What's wrong? [options: sin θ | 9/40 | sin uses the OPPOSITE side...]'; 'Find sin θ [options: 3/4 | 4/5 | 3/5 | sin θ]'.
- Why the child is lost: Distractors 'sin θ' and '9/40' are not answers to the question; the item is trivially guessable.
- Suggested fix: Fix the distractor pool for the misconception items so all options are plausible sentences/ratios.

#### M15:Degrees to radians → M15:Pythagorean identity
- **broken** · **already resolved** — symbolic pool only
- Evidence: 'Complete the identity: sin²θ + ___ = 1 [options: 9/40 | 1 | cos²θ | sin²θ]'; 'Simplify: 1 − sin²θ [options: 1 | cos²θ | sin²θ | 9/40]'.
- Why the child is lost: '9/40' is a leaked distractor from another generator.
- Suggested fix: Restrict distractors for identity items to trig expressions (tan²θ, 1, sin²θ, cos²θ).

#### M16:End behavior → M16:y-intercept of a polynomial
- **broken** · **fixed** — y-intercept answers now vary (0, 6, −3, 1, −8, 5, −7); c = 0 case added
- Evidence: Every typed item on sheet 9 has answer -3 and every MC item has answer 1 ('x² + 4x - 3 → -3', 'x² - 5x - 3 → -3', ... 'x² - 3x + 1 → 1', '2x² + 4x + 1 → 1').
- Why the child is lost: The sheet is pattern-guessable after two items; it certifies nothing.
- Suggested fix: Vary the constant term across the sheet (at least 6 distinct values, some positive/negative, some zero).

#### M16:y-intercept of a polynomial → M16:x-intercepts (roots)
- **broken** · **already resolved** — T/F served as True/False
- Evidence: 'True or false: x = 1 is an x-intercept of f(x) = (x − 1)(x + 2) [options: (x − 5)(x + 6) | -6 | False | True]'; 'f(x) = (x − 1)(x + 2) crosses the x-axis at x = 1 and x = ? [options: (x − 1)(x + 3) | (x − 1)(x + 2) | -2 | -3]'.
- Why the child is lost: True/false items rendered as 4-option MC with factor-expression distractors; number items with expression distractors.
- Suggested fix: Type the T/F items as true_false; restrict distractors for 'x = ?' items to numbers (±2, ±3).

#### M16:x-intercepts (roots) → M16:Multiplicity — cross or bounce
- **untaught-shape** · **already resolved** — both halves of the multiplicity rule in lesson
- Evidence: Lesson: 'Multiplicity 2 is even → the graph is tangent → bounces'. Sheet: 'For f(x) = (x − 1)³(x + 2), at x = 1 the graph ___ → crosses', '(x − 1)⁴(x + 3) → bounces'.
- Why the child is lost: The odd → crosses half of the rule is only implied; binary MC keeps it survivable.
- Suggested fix: State both halves in the lesson: even multiplicity bounces, odd multiplicity crosses.

#### M16:Synthetic division → M16:Rational Root Theorem
- **untaught-shape** · **already resolved** — p/q line in RRT lesson
- Evidence: Lesson: 'leading coefficient 1 ... ± divisors of the constant'. Sheet: 'For 2x² + x − 3, the possible rational roots are ± (divisors of 3) over (divisors of which number?) → 2'.
- Why the child is lost: The p/q form for a non-1 leading coefficient is not in the lesson; the stem carries enough of the form that most will answer 2, but it is a new idea.
- Suggested fix: Add one lesson line: 'if the leading coefficient is not 1, candidates are ± (divisor of constant)/(divisor of leading coefficient)'.

#### M16:Evaluate logarithms → M16:Evaluate exponentials
- **broken** · **fixed (distractors); log/exp swap not fixable without reorder** — 243/3125 leaks gone; log example already carries the powers-of-2 method
- Evidence: 'True or false: 3³ = 27 [options: 3 | True | 4 | False]'; '2 raised to what power gives 4? [options: 2 | 3 | 3125 | 4]'; 'Evaluate 4¹ [options: 243 | 16 | 4 | 64]'. Also the sequencing: logarithms (log_2 8 = 3) precede the far easier 'Evaluate 2³'.
- Why the child is lost: Leaked distractors (3125, 243) and T/F rendered as 4-way MC. Ordering means the log lesson had to assume exponent fluency this lesson only certifies afterwards.
- Suggested fix: Swap lessons 9 and 10 so exponentials precede logarithms; clean the distractor pools.

#### M16:Evaluate exponentials → M16:Solve exponential equations
- **broken** · **already resolved** — T/F 2-option
- Evidence: 'True or false: if 2^x = 2^3, then x = 4 [options: False | 5 | 4 | True]'.
- Why the child is lost: Numeric distractors inside a true/false item.
- Suggested fix: Type the item as true_false.

#### M17:Parabolas & conics → M17:Arithmetic sequences
- **broken** · **fixed** — 43/44 leaks gone; common difference read off a list
- Evidence: 'Arithmetic sequence: 1, 3, 5, … What is the common difference? [options: 31 | 2 | 4 | 3]'; 'first term 2, common difference 1. Find term 3 [options: 43 | 6 | 5 | 4]'; 'first term 3, common difference 1. Find term 3 [options: 44 | 6 | 5 | 7]'.
- Why the child is lost: Leaked distractors (31, 43, 44); the 'common difference' item shape is not in the lesson but is trivial.
- Suggested fix: Clean distractor generation for sequence items.

#### M17:Arithmetic series → M17:Geometric sequences
- **broken** · **fixed** — 108/81/405 leaks gone; ratio read off a list
- Evidence: 'Geometric sequence: 1, 2, 4, … What is the ratio? [options: 108 | 3 | 4 | 2]'; 'A colony starts with 1 cell and doubles every hour. How many cells after 2 hours? [options: 4 | 9 | 405 | 8]'.
- Why the child is lost: Leaked distractors (108, 405).
- Suggested fix: Clean distractor generation.

#### M18:Power rule → M18:Differentiate monomials
- **untaught-shape** · **fixed** — reverse power-rule items taught: differentiate each candidate
- Evidence: Sheet: 'Which function has derivative 15x²? [options: 15x³ | 5x² | 15x² | 5x³] → 5x³', 'Which function has derivative 12x? → 6x²' (6 of 30). Lesson only differentiates forward ('d/dx 3x² = 6x').
- Why the child is lost: Working backwards from a derivative is antidifferentiation; multiple choice lets students test each option, so survivable, but it is not taught.
- Suggested fix: Add a line 'to go backwards, check each candidate by differentiating it'.

