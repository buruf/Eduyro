# Printed worksheet pack audit — 11 packs, 128 unit boundaries

*Sep 10–12 2026. Five reviewers (one per pack group) read every unit boundary a buyer's child works through inside the printed PDF packs: the last sheet of the unit just finished, the printed lesson page exactly as the PDF builds it, the whole first sheet of the new unit as printed, and a ramp through the unit. Dumps by `scripts/dump-pack-transitions.ts`. Rubric: untaught shape, prerequisite gap, cliff, lesson-page quality, print fitness, ramp, broken.*

| | |
|---|---|
| boundaries reviewed | 128 |
| judged clean | 32 |
| findings | 153 |
| blockers | 7 |
| majors | 69 |
| minors | 77 |

By category: ramp 50 · lesson-page 53 · print-fitness 18 · untaught-shape 15 · broken 6 · prereq-gap 10 · cliff 1.

## What was wrong at the root (fixed once, for every pack)

1. **The printed lesson page overrode the curated example.** `buildExamples` replaced hand-written steps with a template whenever the problem matched a column, long-division or polynomial pattern — so the Polynomial-division page printed factor-and-cancel eight sheets before factoring is taught, even though the engine's example was right. Curated steps with two or more real steps now win; templates fill in only for terse examples.
2. **Auto-example templates fired on basic facts.** A column-borrow walk for 15 − 7, long division with "bring down" for 10 ÷ 10, the 1-digit column algorithm for 2-digit × 2-digit with 14 as a digit. Templates now apply only to genuine multi-digit work; facts get fact strategies (think multiplication; doubles / bridging); two-digit multipliers get partial products.
3. **Within-class size was the ones digit.** `magnitude(n)` ranked every number ending in 0 easiest, so the opening borrowing sheet was 22 of 24 "x0 − y". Replaced with a real within-class position; opening sheets now vary.
4. **Stored answers leaked into prose.** A line's "m,b" answer was read as a point ("Mark the point (1, 0)"); ratio scale-up items got "divide both by 1". Decoders fixed per answer shape.
5. **Screen wording reached paper.** "Select all the factors", "type", "click", "Rule out any choices" — the print path now rewrites or drops these, on items and in directives.
6. **Review sheets did not review.** Mixed reviews omitted the unit just finished or repeated one shape; they now draw from every unit of the pack, and adjacent review sheets share no item.
7. **The storefront promised 100 sheets per skill** while the Fractions pack is 50 by design. Every claim now reads "up to 100", the preview modal shows the real count, and the checkout description counts the sheets actually in the box.

Two reviewer suggestions were NOT taken because they need units reordered or re-ranged (unit order feeds saved progress and lesson videos): moving Polynomial long division after factoring, and lengthening the 2–3-sheet Fractions operation units. Both are mitigated in place: the division page now teaches divide-and-check with FOIL, which the student owns; the short units open with the taught case only.

## Findings


### Blockers (7)

#### SUBTRACTION: Find the difference (count up) (sheet 18) → Halving & near-halves (using doubles) (sheet 19)
- **lesson-page** · **addressed** (SUBTRACTION)
- Evidence: objective: 'Student subtracts using known doubles (12−6, 13−6)'. example 1: '12 - 6 = → 6 / Ones: 2 borrow 10 → 12 − 6 = 6. / Tens: 1 (borrowed: 1 − 1 = 0) − 0 = 0. / Answer: 6.' — examples 1–3 (12−6, 15−7, 17−8) all use this column-borrow text; example 4 is '3 - 1 = → 2'. No example mentions a double.
- Why: A Grade 2 child who has never seen borrowing (unit 8) reads 'Tens: 1 (borrowed: 1 − 1 = 0) − 0 = 0' for a basic fact and has no strategy at all for 15 − 7, 13 − 6, 17 − 8, 11 − 5 on the sheet; the page teaches nothing the objective promises.
- Fix applied: Never apply the column-borrow template to a two-digit minuend under 20 in a facts unit; curate 'You know 6 + 6 = 12, so 12 − 6 = 6' and 'Near-half: 13 − 6: 12 − 6 = 6, one more to take away, so 7' (or 6 + 7 = 13).

#### SUBTRACTION: Halving & near-halves (using doubles) (sheet 24) → Bridging down through 10 (sheet 25)
- **lesson-page** · **addressed** (SUBTRACTION)
- Evidence: objective: 'Student subtracts by going down to 10 first (15−7 = 15−5−2)'. example 1: '15 - 7 = → 8 / Ones: 5 borrow 10 → 15 − 7 = 8. / Tens: 1 (borrowed: 1 − 1 = 0) − 0 = 0.' — identical text to the previous unit's example 2; examples 2–4 (11−2, 11−5, 12−3) use the same borrow template. No example shows 'down to 10 first'.
- Why: Sheet 25 is 21 bridging items (13 − 9, 14 − 5, 11 − 3, 12 − 8 …) and the only printed method is an untaught column-borrow ritual whose 'ones' line already assumes the answer; the child has no way to do 13 − 9 except counting back 9 on fingers.
- Fix applied: Curate example 1 as '15 − 7: 15 − 5 = 10, then 10 − 2 = 8' and make the auto template for this unit the two-step bridge; also ensure a curated example is never the same problem as the previous unit's.

#### MULTIPLICATION: 2-digit × 1-digit (sheet 84) → 2-digit × 2-digit (sheet 85)
- **lesson-page** · **addressed** (MULTIPLICATION)
- Evidence: example 2: 83 × 14 = → 1162 — 'Ones: 3 × 14 = 42. Write 2, carry 4. Tens: 8 × 14 + 4 carried = 116. Write 6, carry 11. Nothing left to multiply — bring down the carried 11.' example 4: 86 × 17 — 'Ones: 6 × 17 = 102. Write 2, carry 10 … Write 6, carry 14.'
- Why: The page applies the 1-digit column algorithm with a 2-digit number as the 'digit': the child must compute 8 × 17 = 136 and 6 × 17 = 102 in their head and 'carry 11' or 'carry 14', which is not a method any child can execute on paper. No partial-products or two-row long multiplication is ever shown, so the first sheet (83 × 14, 86 × 17, 17 × 38) cannot be done from the lesson page.
- Fix applied: Write a real 2-digit × 2-digit template: either partial products (23 × 14 = 23 × 10 + 23 × 4 = 230 + 92 = 322) or the two-row column layout (×4 row, ×10 row with a placeholder 0, add). Block the 1-digit column template whenever both factors exceed 9.

#### POLYNOMIALS: Divide by a monomial (sheet 66) → Polynomial long division (sheet 67)
- **prereq-gap** · **addressed** (POLYNOMIALS)
- Evidence: Unit title 'Polynomial long division'; lesson example 1: 'Factor the top: x² + 5x + 6 = (x + 2)(x + 3) (2 × 3 = 6, 2 + 3 = 5). Cancel the common (x + 2) top and bottom.' Sheet 67 items: 'Divide (x² + 11x + 30) ÷ (x + 5). → x + 6'. Factor quadratic trinomials is unit 19 (sheets 75-78).
- Why: No long-division algorithm is shown at all, and the substitute method (factor the trinomial) is a skill taught eight sheets later; a student with only the printed page has to invent trinomial factoring from a parenthetical hint to do any of the 30 items.
- Fix applied: Either move this unit after Factor quadratic trinomials (sheets 75-78), or actually teach long division on the lesson page (divide x² by x, multiply back, subtract, bring down) and keep the factor-and-cancel note as a check.

#### POLYNOMIALS: Factor quadratic trinomials (sheet 78) → Factor trinomials (a ≠ 1) (sheet 79)
- **prereq-gap** · **addressed** (POLYNOMIALS)
- Evidence: example 1: 'Multiply a·c = 2·3 = 6. Two numbers multiply to 6 and add to 7: 1 and 6. Split the middle term: 2x² + 1x + 6x + 3, then group. Answer: (2x + 1)(x + 3)'. Factor by grouping is unit 23 (sheets 93-96).
- Why: The one method shown jumps from the split to the answer with 'then group' — a step never demonstrated and taught fourteen sheets later; no trial-factor-pairs alternative is shown either, so the student has no way to produce (2x + 1)(x + 3) from 2x² + 1x + 6x + 3.
- Fix applied: Show the grouping step in full on the page ('x(2x + 1) + 3(2x + 1) = (2x + 1)(x + 3)'), or move this unit after Factor by grouping, or teach the guess-and-check (2x + ?)(x + ?) method which only needs FOIL.

#### LINEAR_EQUATIONS: Plot points on the coordinate plane (sheet 4) → Graph a line (sheet 5)
- **lesson-page** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Lesson page example 2: 'Plot the line y = x. → 1,0 — Start at the origin (0, 0). Go right 1, then up 0. Mark the point (1, 0).' The point (1, 0) is NOT on y = x. The curated example on the same page says 'y = x … points (0, 0) and (1, 1)'. Examples 3–4 print answers as '1,-5' and '2,4' (slope,intercept pairs) with no label.
- Why: The auto-example builder treated the stored answer '1,0' (slope 1, intercept 0) as a point and generated a wrong worked example that directly contradicts example 1. A child following example 2 will plot (1, 0) for 'y = x' and then (1, −1) for 'y = x − 1', etc. — the first eleven items of sheet 5 are exactly this shape.
- Fix applied: In the plot-line auto-example template, decode the answer as (m, b): 'y-intercept 0 → point (0, 0); slope 1 → up 1, right 1 → (1, 1); draw the line'. Never emit the raw 'm,b' string as the example answer; print 'slope 1, intercept 0'.

#### LINEAR_EQUATIONS: Plot points on the coordinate plane (sheet 4) → Graph a line (sheet 5)
- **print-fitness** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Sheet 5 item 30 (and sheet 8 item 5): 'What is the equation of the line shown? Build it with the slope and intercept. → 1,-3 ⟨interactive:equation-builder — prints as a grid/diagram; long prompt⟩'.
- Why: On screen this shows a drawn line and slope/intercept pickers. If the print build emits only an empty grid (as the flag suggests), there is no 'line shown' and the item is unanswerable on paper; 'Build it' is an on-screen verb. Even if the line is drawn, the answer key '1,-3' does not say what to write (y = x − 3).
- Fix applied: Either drop equation-builder items from the print build, or verify the printed grid actually draws y = x − 3 and reword to 'Write the equation of the line shown: y = ___x + ___'; answer key 'y = x − 3'.

### Majors (69)

#### ADDITION: Doubles (1+1 … 9+9) (sheet 8) → Adding zero & turnarounds (sheet 9)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: example 2: '0 + 2 = → 2 / Start at 2 and count up 0 more — use the dots. / 2, then . / 0 + 2 = 2.'
- Why: The printed line '2, then .' is a broken template (empty count list) — a paying parent sees a typo on page 1 of the unit; the child reads a sentence that stops mid-way.
- Fix applied: Guard the count-on template for n=0 (emit 'Count up 0 more: the number stays 2') and never auto-build a count-on example from a +0 item.

#### ADDITION: Adding zero & turnarounds (sheet 11) → Near-doubles (use the double you know) (sheet 12)
- **ramp** · **addressed** (ADDITION)
- Evidence: Sheet 11 (last sheet of 'Adding zero & turnarounds'): '2 + 9 → 11', '7 + 4 → 11', '7 + 5 = ? → 12', '6 + 3 → 9'.
- Why: These cross ten; bridging through 10 is unit 5 and near-doubles unit 4 — the child has only +1/+2/+3, doubles and +0, so sheet 11 asks for untaught facts before the boundary is even reached.
- Fix applied: Restrict unit-3 filler to sums ≤ 10 built from taught facts (counting on 1–3, doubles, +0, turnarounds of those).

#### ADDITION: Near-doubles (use the double you know) (sheet 15) → Make ten & bridging through 10 (sheet 16)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: Only example 1 ('8 + 5: 8 + 2 = 10, 10 + 3 = 13') shows make-ten. example 2: '6 + 5 Near-double', example 3: '1 + 1 = → 2 This is a double: 1 + 1. Count the dots', example 4: '5 + 6 Near-double' (same fact as ex 2). The sheet has nine make-ten items: 5 + 7, 5 + 8, 7 + 4, 9 + 3, 8 + 3, 9 + 2, 7 + 5, 8 + 5, 8 + 4.
- Why: A Grade 2 child gets one two-line demonstration of a new strategy, then three examples of old strategies (one of them 1+1 — absurd on a 'bridging through 10' page), and must apply make-ten to 9 items.
- Fix applied: Auto-examples must be selected from items where the unit strategy applies (sum > 10, neither addend equal/adjacent): e.g. 7 + 5, 9 + 3, 8 + 4 with the 'to 10, then the rest' lines.

#### ADDITION: Fact families to 18 (sheet 28) → 2-digit addition (no regrouping) (sheet 29)
- **ramp** · **addressed** (ADDITION)
- Evidence: Sheets 30–42 (13 sheets): '41 + 23', '23 + 62', '32 + 41', '41 + 53', '62 + 17', '32 + 65', '41 + 56', '56 + 32', '65 + 23' … the same problems recur — 65 + 23 on sheets 38, 41, 42; 41 + 56 on 38, 40; 56 + 32 on 38, 40; 53 + 26 on 35, 41, 44.
- Why: 16 sheets of one flat difficulty with repeated problems; a child (and parent) sees identical work for two weeks with no progression.
- Fix applied: Shorten the unit to ~8 sheets or ramp it (2-digit + 1-digit → x0 + yz → ab + cd → three-column layout → sums near 99) and dedupe problems across sheets within a unit.

#### ADDITION: Fact families to 18 (sheet 28) → 2-digit addition (no regrouping) (sheet 29)
- **untaught-shape** · **addressed** (ADDITION)
- Evidence: Sheet 43: '___ + 22 = 62 → 40'; sheet 44: '___ + 15 = 57 → 42', '___ + 17 = 49 → 32', '___ + 14 = 47 → 33'.
- Why: A 2-digit missing addend appears mid-unit with no lesson page; the child knows missing addends only to 18 by counting on, and counting up 42 jumps from 15 on paper is not a taught method.
- Fix applied: Either drop missing-addend items from unit 7 or add a printed mini-lesson ('count up in tens then ones: 15 → 25, 35, 45, 55 is 40, then 2 more = 42') on sheet 43.

#### ADDITION: 2-digit addition (no regrouping) (sheet 44) → 2-digit addition (regrouping) (sheet 45)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: All four examples carry from ones sums 12, 15, 11, 13. Sheet 45: '31 + 19 → 50', '37 + 43 → 80', '46 + 34 → 80', '16 + 34 → 50' — four of ten items have ones summing to exactly 10.
- Why: The 'write 0, carry 1' case (ones = 10) is never shown; 40% of the first sheet is that case, and a child following 'write 2, carry 1' may write '10' in the ones column.
- Fix applied: Force the auto-example picker to include one ones-sum-equals-10 item (e.g. 31 + 19: 'Ones: 1 + 9 = 10. Write 0, carry 1').

#### ADDITION: 2-digit addition (no regrouping) (sheet 44) → 2-digit addition (regrouping) (sheet 45)
- **untaught-shape** · **addressed** (ADDITION)
- Evidence: Sheet 58: '58 + 49 → 107', '28 + 88 → 116'; sheet 60: '64 + 67 → 131'; sheet 63: '85 + 88 → 173'; sheet 54: '___ + 60 = 108 → 48'; sheet 55: '___ + 32 = 122 → 90'.
- Why: Sums over 100 (a carry with nothing to add it to — 'bring down the carried 1') first appear on sheet 58 with no lesson; that line is only printed on the unit-10 page. Missing addends with 3-digit totals require subtraction with regrouping, which this pack never teaches.
- Fix applied: Show one sum-over-100 example on the regrouping lesson page, or keep unit-8 sums ≤ 99 and move over-100 sums to unit 9. Drop '___ + 32 = 122'-type items from unit 8 (or restrict to totals ≤ 99 with a count-up mini-lesson).

#### ADDITION: 2-digit addition (regrouping) (sheet 64) → 3-digit addition & three addends (sheet 65)
- **untaught-shape** · **addressed** (ADDITION)
- Evidence: Lesson page has four two-number examples only. Sheet 67: '15 + 91 + 15 → 121'; sheet 68: '34 + 53 + 15 → 102'; sheet 70: '91 + 34 + 72 → 197'; sheet 71: '53 + 53 + 34 → 140'.
- Why: The unit is titled 'three addends' but the printed lesson never shows adding three numbers (column with three rows, ones sum can exceed 19); the child meets it two sheets in with no model.
- Fix applied: Add a curated three-addend example (e.g. 34 + 53 + 15 in column form: 'Ones: 4 + 3 + 5 = 12, write 2 carry 1') to the sheet-65 lesson page.

#### ADDITION: 2-digit addition (regrouping) (sheet 64) → 3-digit addition & three addends (sheet 65)
- **prereq-gap** · **addressed** (ADDITION)
- Evidence: Sheet 72: '___ + 290 = 414 → 124'; sheet 79: '___ + 170 = 678 → 508', '___ + 314 = 582 → 268'; sheet 81: '___ + 386 = 1134 → 748'; sheets 79, 80, 82 are essentially all missing-addend.
- Why: Finding a 3-digit missing addend is 3-digit subtraction with regrouping — Subtraction is a later pack, and no count-up-in-hundreds method is printed anywhere in this unit.
- Fix applied: Remove 3-digit missing addends from unit 9 (keep them for after the Subtraction pack), or limit to friendly cases (___ + 200 = 438) with a printed count-up model.

#### ADDITION: 3-digit addition & three addends (sheet 84) → Missing addend & mixed review (sheet 85)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: example 3: '___ + 31 = 83 → 52 / Start at 31 and count up to 83, using the dots. / Count how many empty circles you fill in — that's the missing number, 52.'
- Why: Filling in 52 circles is an absurd method for a Grade 4 item; the single-digit dot template was applied to a 2-digit problem and contradicts example 1's count-up-in-tens method.
- Fix applied: Restrict the dot-strip template to totals ≤ 20; for 2-digit missing addends reuse example 1's template ('31 + 50 = 81, then 2 more: 52').

#### SUBTRACTION: Subtract 0 and subtract all (sheet 10) → Find the difference (count up) (sheet 11)
- **lesson-page** · **addressed** (SUBTRACTION)
- Evidence: objective: 'Student counts up from the smaller to the larger number'. example 1: '9 - 6 = → 3 / Start at 9 and count back 6. / Ask: 6 plus what equals 9? / 9 − 6 = 3.' — all four examples say 'count back'; none shows a count-up ('6 → 7, 8, 9: 3 jumps').
- Why: The page never demonstrates the unit's own strategy, and the sheet needs it ('9 - 3', '10 - 6', '8 - 5', '9 - 5' are beyond the taught −1/−2/−3 count-back).
- Fix applied: Curate example 1 as an explicit count-up with the jump list, and make the auto template for this unit 'Start at 6, count up to 9: 7, 8, 9 — 3 jumps'.

#### SUBTRACTION: Bridging down through 10 (sheet 32) → Fact families to 18 (sheet 33)
- **ramp** · **addressed** (SUBTRACTION)
- Evidence: Sheet 33 ('Fact families to 18', Grade 2-3, stars 3): '3 - 2', '3 - 1', '2 - 1 = ?', '3 - ___ = 1', '4 - ___ = 3', '4 - ___ = 1', '2 - ___ = 1', '3 - ___ = 2', '4 - 3', '4 - 1', '4 - ___ = 2', '5 - 1', '1 + ___ = 3', '2 + ___ = 3', '3 + ___ = 4', '1 + ___ = 4' — 17 of 30 items are within 5. Sheets 34–38 samples: '5 - 4', '6 - 1', '7 - 3', '9 - 1', '9 - 4'.
- Why: Right after bridging 17 − 8 the child gets '2 − 1' and '3 − ___ = 2'; the unit regresses below Grade 1 and a parent sees kindergarten items labelled stars 3.
- Fix applied: Set the missing-number generator floor for this unit to minuends 10–18 (its title), with review drawn from bridging facts.

#### SUBTRACTION: 2-digit subtraction (no borrowing) (sheet 54) → 2-digit subtraction (borrowing) (sheet 55)
- **lesson-page** · **addressed** (SUBTRACTION)
- Evidence: example 2: '10 - 7 = → 3 / Ones: 0 borrow 10 → 10 − 7 = 3. / Tens: 1 (borrowed: 1 − 1 = 0) − 0 = 0. / Answer: 3.' examples 3–4: '70 - 31', '70 - 22'. Sheet 55: 22 of 24 items have a minuend ending in 0 (10 - 7, 80 - 5, 70 - 55, 60 - 6, 40 - 8, 30 - 6, 70 - 31, 70 - 61, 70 - 5, 60 - 4, 80 - 6, 50 - 8, 50 - 2, 30 - 9 …).
- Why: A full column-borrow walkthrough for the fact 10 − 7 is absurd, and the whole first sheet is the single 'ones digit is 0' case, so the child never practises the ordinary borrow (52 − 27) the curated example shows until sheet 56.
- Fix applied: Exclude minuends < 20 from the borrow template; force the sheet-55 generator to mix ones digits (≈ 1/3 ending in 0) and pick auto-examples with distinct ones digits.

#### FRACTIONS: Writing fractions from pictures (sheet 4) → Comparing fractions with pictures (sheet 5)
- **lesson-page** · **addressed** (FRACTIONS)
- Evidence: example 4: [[viz cmp 1 3 10 12]] → 10/12 with steps 'Shaded parts: 1 / Total equal parts: 3 / Answer: 10/12'. examples 2–3 same template: 'Shaded parts: 1, Total equal parts: 2, Answer: 1/2'.
- Why: The auto-built explanations describe only the first picture and never compare anything; example 4 lists 1 and 3 and then answers 10/12, which reads as nonsense to a child and parent.
- Fix applied: Use a comparison template for cmp items: 'Top: a of b shaded, bottom: c of d shaded; more of the strip is shaded on the (top/bottom), so X is larger', or drop auto-examples for this unit and keep only the curated one.

#### FRACTIONS: Improper fractions (sheet 38) → Add fractions (sheet 39)
- **ramp** · **addressed** (FRACTIONS)
- Evidence: Sheet 39: all 18 items like denominators (1/3+1/3, 2/6+5/6 …). Sheet 40: '1/3 + 4/6 → 1', '1/4 + 4/12 → 7/12', '2/5 + 4/6 → 16/15'. Sheet 41: '2/4 + 3/5 → 11/10', '2/3 + 2/10 → 13/15'. Lesson page only says 'Later sheets — different bottoms (1/4 + 3/8): 8 is 4 × 2'.
- Why: One sheet after the lesson page the child hits neither-denominator-fits items (2/5 + 4/6 needs 30ths) with no new lesson page; the one-line hint covers only the one-fits-into-the-other case. Three sheets is too few for addition anyway.
- Fix applied: Give Add fractions 5 sheets: 39–40 like denominators, 41 one-fits, 42–43 unlike; and add a worked neither-fits example (1/3 + 2/5 = 5/15 + 6/15 = 11/15) to the lesson page.

#### FRACTIONS: Add fractions (sheet 41) → Subtract fractions (sheet 42)
- **lesson-page** · **addressed** (FRACTIONS)
- Evidence: example 1: 5/6 − 1/6 (same bottom) with 'Later sheets — different bottoms (3/4 − 1/2)…'. But sheet 42 has NO like-denominator item: '1/2 − 2/6', '2/4 − 2/8' … '1/3 − 1/4 → 1/12', '1/2 − 2/5 → 1/10', '1/4 − 1/5 → 1/20'.
- Why: The curated example teaches the one case that is not on the sheet and defers the case that is the whole sheet to 'later sheets'; the neither-fits items (1/3 − 1/4) are never worked on the page. The child copes only because Add sheets 40–41 did the same trick — the page itself misleads.
- Fix applied: Curated example: 3/4 − 1/12 (one fits) plus a 1/3 − 1/4 = 4/12 − 3/12 = 1/12 line; put 4–6 like-denominator items at the top of sheet 42.

#### FRACTIONS: Divide fractions (sheet 49) → Fraction mastery (sheet 50)
- **ramp** · **addressed** (FRACTIONS)
- Evidence: objective: 'Student works fluently across all fraction operations'; sheet 50's 18 items are 11 Add (10 like-denominator), 4 Multiply, 4 Simplify — no subtract, divide, compare, order, mixed/improper. Lesson page has no directive line.
- Why: A parent who bought a 'Fraction mastery' finale gets a sheet easier than sheets 40–49; the units just practised (subtract, divide) are absent.
- Fix applied: Build sheet 50 with 2–3 items from every unit 7–16, including unlike-denominator add/subtract and one division; add a directive ('Solve. Simplest form.').

#### DECIMALS: Decimals — divide by a whole number (sheet 36) → Percentages of a number (sheet 37)
- **ramp** · **addressed** (DECIMALS)
- Evidence: Ramp: sheet 39 '100% of 4 → 4', '100% of 62 → 62'; sheet 40 '100% of 14'; sheet 41 '100% of 18'; sheet 42 (last sheet) first 12 items include 100% of 27, 31, 32, 33, 38, 40 — six of twelve.
- Why: The unit gets easier as it goes: by the last sheet a third of the items are 'copy the number'. A parent will see this as padding.
- Fix applied: Cap 100% items at one per sheet; let later sheets use 5%, 15%, 35%, 12.5% and numbers above 100.

#### DECIMALS: Percentages of a number (sheet 42) → Convert fractions, decimals, percents (sheet 43)
- **untaught-shape** · **addressed** (DECIMALS)
- Evidence: Directive 'Convert each.' Sheet 43: 'Write 0.2 as a fraction → 1/5', 'Write 0.6 as a fraction → 3/5', 'Write 0.8 as a fraction → 4/5'; ramp: '0.65 → 13/20', '0.625 → 5/8'. Only the curated example mentions simplifying ('75/100; divide top and bottom by 25 → 3/4').
- Why: Nothing on the sheet says the fraction must be in simplest form, and this pack never teaches simplifying fractions (it lives in the FRACTIONS pack), so 2/10 and 6/10 will be written and marked wrong against 1/5 and 3/5; 0.625 → 5/8 needs dividing 625/1000 by 125.
- Fix applied: Directive: 'Convert each. Fractions in simplest form.' Add a one-line simplify reminder on the lesson page (0.6 = 6/10 = 3/5) and a decimal→fraction auto-example; keep sheet 43–44 to tenths/quarters/fifths.

#### DECIMALS: Ratios — solve a proportion (sheet 80) → Ratios — scale up (sheet 81)
- **lesson-page** · **addressed** (DECIMALS)
- Evidence: example 2: 'scale 3 : 4 by 2 → 6 : 8 — Find the biggest number that divides evenly into BOTH 3 and 4 — it's 1. Divide both parts by it: 3 ÷ 1 : 4 ÷ 1. Answer: 6 : 8.' Examples 3 and 4 identical template. Curated example 1 is written '2 : 3 × 4 → 8 : 12', a notation the sheet never uses.
- Why: Three of four worked examples explain the wrong operation (simplifying) and then state an answer that does not follow from their steps; the only correct example uses different notation from the sheet's 'scale 3 : 4 by 2' wording. Children will still multiply because the task is easy, but the page is visibly wrong.
- Fix applied: Route 'scale a : b by k' items to a multiply template ('a × k : b × k'); write the curated example as 'Scale 2 : 3 by 4 → 2 × 4 : 3 × 4 = 8 : 12'.

#### DECIMALS: Ratios — scale up (sheet 91) → Ratios — mixed review (sheet 92)
- **lesson-page** · **addressed** (DECIMALS)
- Evidence: example 4: 'Find the missing number: 1 : 5 = 4 : ___ → 20 — Find the biggest number that divides evenly into BOTH 1 and 5 — it's 1. Divide both parts by it: 1 ÷ 1 : 5 ÷ 1. Answer: 20.' Examples 2–3 ('scale 4 : 5 by 2', 'scale 12 : 13 by 2') use the same simplify template.
- Why: Three of four examples on the finale lesson page give steps that do not produce the printed answer; the one type that needs the most care (missing term) is explained with a dividing-by-1 non-step.
- Fix applied: Pick the template by item type (simplify / missing second / missing first / scale), as the curated example text already lists them.

#### RATIOS: Ratios — simplify (sheet 16) → Ratios — equivalent ratios (sheet 17)
- **ramp** · **addressed** (RATIOS)
- Evidence: Unit 2 = 20 sheets × 24 items, every item 'a : b = ka : ___'. Sheets 19 and 20 both open with '5 : 2 = 10 : ___ → 4'; sheets 22 and 23 both '1 : 1 = 4 : ___ → 4'; sheet 36's scale factors (3, 4, 5) are the same as sheet 24's.
- Why: Twenty near-identical sheets with no new shape (no missing first term, no word problems, no three-term ratios) — a child is fluent by sheet 20 and a parent sees 16 sheets of padding.
- Fix applied: Cut to 8 sheets, or vary: missing term on the left side, ratios written with 'to', simple rate contexts (3 pencils cost $2 → 9 pencils cost ?), and a sheet mixing simplify with equivalent.

#### RATIOS: Ratios — equivalent ratios (sheet 36) → Ratios — solve a proportion (sheet 37)
- **ramp** · **addressed** (RATIOS)
- Evidence: Unit 3 = 24 sheets (37–60), every item 'a : b = ___ : kb' with k ≤ 6, e.g. sheet 37 '1 : 1 = ___ : 2 → 2' and sheet 60 '5 : 3 = ___ : 12 → 20'. Sheets 46 and 47 both sample '1 : 5 = ___ : 30 → 6'.
- Why: The only difference from unit 2 is which slot is blank; 24 sheets of it is a quarter of the pack with no growth (no cross-multiplying, no non-integer scale, no proportion given as fractions a/b = c/d).
- Fix applied: Cut to 8–10 sheets and add a genuine proportion shape by sheet 45: fraction form (3/4 = x/20), a scale that is not a whole number for the visible pair, and one-line word problems.

#### RATIOS: Ratios — solve a proportion (sheet 60) → Ratios — scale up (sheet 61)
- **lesson-page** · **addressed** (RATIOS)
- Evidence: example 2: 'scale 3 : 4 by 2 → 6 : 8 — Find the biggest number that divides evenly into BOTH 3 and 4 — it's 1. Divide both parts by it: 3 ÷ 1 : 4 ÷ 1. Answer: 6 : 8.' Examples 3–4 same; curated example written '2 : 3 × 4 → 8 : 12'.
- Why: Same wrong-template page as the DECIMALS pack: the worked steps are for simplifying, the answers are for scaling, and the correct example uses notation the sheet never shows.
- Fix applied: Multiply template for 'scale a : b by k'; reword the curated example to match the sheet wording.

#### RATIOS: Ratios — solve a proportion (sheet 60) → Ratios — scale up (sheet 61)
- **ramp** · **addressed** (RATIOS)
- Evidence: Unit 4 = 22 sheets (61–82) of 'scale a : b by k' with a,b ≤ 13, k ≤ 8; sheets 61 and 62 both open 'scale 3 : 4 by 2 → 6 : 8'; sheet 82 ends '12 : 13 by 8 → 96 : 104'. It follows 24 sheets of proportions, which needed more thinking.
- Why: A Grade-7 child does 22 sheets of two one-digit multiplications after already solving proportions — regression plus 20 sheets of flat filler.
- Fix applied: Move Scale up to 4 sheets before Equivalent ratios; spend the freed sheets on part-to-whole ratios, unit rates and ratio word problems (none exist in the pack).

#### RATIOS: Ratios — scale up (sheet 82) → Ratios — mixed review (sheet 83)
- **lesson-page** · **addressed** (RATIOS)
- Evidence: example 4: 'Find the missing number: 1 : 5 = 4 : ___ → 20 — Find the biggest number that divides evenly into BOTH 1 and 5 — it's 1 … Answer: 20.'; examples 2–3 ('scale 4 : 5 by 2 → 8 : 10', 'scale 12 : 13 by 2 → 24 : 26') carry the same simplify steps.
- Why: Three of four worked examples on the finale page have steps that do not lead to the printed answer.
- Fix applied: Select the auto-example template by item type; also ensure the mixed-review sheet's 'Find the missing number' items are drawn from both blank positions (they are, so only the page needs fixing).

#### MULTIPLICATION: ×2, ×5, ×10 (skip counting) (sheet 6) → ×1 and ×0 (sheet 7)
- **lesson-page** · **addressed** (MULTIPLICATION)
- Evidence: example 2: 0 × 12 = → 0 — 'Multiply the ones: 2 × 0 = 0. Write the ones digit, carry the rest. Multiply the tens: 1 × 0 = 0 (then add any carry).' example 3: 1 × 11 — same column walk. example 4: 0 × 6 — 'Skip-count by 0: 0, 0, 0, 0, 0, 0.'
- Why: A Grade-3 child who has only skip-counted is shown a column algorithm with 'carry the rest' for 0 × 12 — a rule that needs no computing at all. Three of four examples bury the two one-line rules (×1 = itself, ×0 = 0) under procedures the child has never seen.
- Fix applied: Auto-example builder must route ×0/×1 to the identity/zero rule template ('12 groups of 0 is 0'); never emit the column-method or skip-count-by-0 template when a factor is 0 or 1.

#### MULTIPLICATION: ×1 and ×0 (sheet 9) → Square facts (n × n) (sheet 10)
- **lesson-page** · **addressed** (MULTIPLICATION)
- Evidence: example 4: 10 × 10 = → 100 — 'Ones: 0 × 10 = 0. Write 0. Tens: 1 × 10 = 10. Write 0, carry 1. Nothing left to multiply — bring down the carried 1.' example 3: 1 × 1 — 'Picture 1 equal groups of 1 — the rows in the picture.'
- Why: 10 × 10 is treated as a column multiplication with 10 as a 'digit', which is not how anyone computes it and reads as broken to a parent; 1 × 1 wastes an example slot on a trivial fact while 7 × 7, 8 × 8, 9 × 9 go unshown.
- Fix applied: Force square-fact examples to the curated 'use the five you know' template (e.g. 7 × 7 = 35 + 14, 9 × 9 = 45 + 36) and skip trivial (1, 2, 10) squares; never pick the column template for a factor of 10 or less.

#### MULTIPLICATION: ×1 and ×0 (sheet 9) → Square facts (n × n) (sheet 10)
- **prereq-gap** · **addressed** (MULTIPLICATION)
- Evidence: sheet 10 (9 items): 2 × 2, 3 × 3, 1 × 1, 4 × 4, 5 × 5 (+ review 10 × 4, 2 × 12, 5 × 4). sheet 11: 12 × 12 → 144. sheet 12: 6 × 6, 7 × 7, 11 × 11, 12 × 12.
- Why: By sheet 11 the child has only ×2, ×5, ×10, ×1, ×0 and is asked for 11 × 11 and 12 × 12 with no strategy; the 'use the five' hint only reaches 6 × 6–9 × 9 (and needs 7 × 5, 8 × 5 which the child knows). Sheet 10 is also only 9 items — a nearly blank printed page.
- Fix applied: Restrict this unit to 1²–10² (move 11 × 11, 12 × 12 to the ×10, ×11, ×12 unit) and pad sheet 10 to the normal item count; show 7 × 7 and 9 × 9 worked on the lesson page.

#### MULTIPLICATION: Square facts (n × n) (sheet 12) → ×3 and ×4 (build from ×2) (sheet 13)
- **lesson-page** · **addressed** (MULTIPLICATION)
- Evidence: example 3: 4 × 10 = → 40 — 'Ones: 4 × 10 = 40. Write 0, carry 4. Nothing left to multiply — bring down the carried 4.' example 4: 3 × 12 = ? → 36 — 'Multiply the ones: 2 × 3 = 6. Write the ones digit, carry the rest. Multiply the tens: 1 × 3 = 3'.
- Why: Two of four examples show column arithmetic with 'carry' for basic facts (and 4 × 10 is a ×10 fact the child already knows). The unit's own strategy — double, then double again / double plus one more — is shown only once (4 × 7, 3 × 6); 3 × 9 falls back to skip counting with a truncated list '3, 6, 9, 12, 15, 18, ….'
- Fix applied: For fact units (both factors ≤ 12) forbid the column template; use the unit's doubling template for every auto example (e.g. 3 × 12 = 24 + 12, 4 × 8 = 16 → 32) and never truncate skip-count lists with an ellipsis.

#### MULTIPLICATION: ×6, ×7, ×8, ×9 (the hard facts) (sheet 36) → Fact families & missing factor (sheet 37)
- **lesson-page** · **addressed** (MULTIPLICATION)
- Evidence: example 4: 10 × 2 = → 20 — 'Ones: 0 × 2 = 0. Write 0. Tens: 1 × 2 = 2. Write 2.' example 2: 8 × 1 = ? → 8 — 'Picture 1 equal groups of 8'. example 3: 'How many groups of 4 fit into 16? Count the rows in the picture.'
- Why: Only two of four examples are missing-factor problems (the unit's whole point); the other two are trivial facts, one shown with a column method. Example 3 tells the child to count rows in a picture that is not printed.
- Fix applied: Auto-example builder should sample from the sheet's missing-factor items (e.g. 2 × ___ = 18, 3 × ___ = 12) and use the count-up template; replace 'Count the rows in the picture' with 'Count fours: 4, 8, 12, 16 — four of them' on the printed page.

#### MULTIPLICATION: Fact families & missing factor (sheet 48) → ×10, ×11, ×12 (sheet 49)
- **lesson-page** · **addressed** (MULTIPLICATION)
- Evidence: example 1: 12 × 7 = → 84 — 'Ones: 2 × 7 = 14. Write 4, carry 1. Tens: 1 × 7 + 1 carried = 8.' example 3: 11 × 1 — column walk. example 4: 8 × 10 = ? → 80 — 'Multiply the ones: 0 × 8 = 0 … carry the rest.' example 2: 4 × 7 — skip-count by 4 (not a ×10/×11/×12 fact at all).
- Why: The page never states the actual strategies for this unit (×10 append 0; ×11 repeat the digit; ×12 = ×10 + ×2). Three examples show carrying — a skill not taught until sheet 69 — and the one non-column example is off-topic.
- Fix applied: Curated example for this unit is missing: add 11 × 6 = 66 (double digit), 12 × 7 = 70 + 14 (ten-plus-two), 10 × 8 = 80; auto examples must use these templates and only sample ×10/×11/×12 items.

#### MULTIPLICATION: Multiplying tens (20 × 3) (sheet 58) → Break apart to multiply (no carrying) (sheet 59)
- **untaught-shape** · **addressed** (MULTIPLICATION)
- Evidence: sheet 60: '20 × 2 = 40 and 4 × 2 = 8. So 24 × 2 = → 48'; sheet 62: '23 × 2 = (20 × 2) + (___ × 2) → 3'; sheet 66: 'Break apart: 21 × 3 = (20 × 3) + (1 × 3) = → 63'; sheet 67: '22 × 2 → 44'. Lesson page shows only 'Step 1: 20 × 2 =' / 'Step 2: 1 × 2 =' partial-product prompts plus a column-method 23 × 3.
- Why: Four different printed prompt shapes appear on later sheets (sum-of-pieces, fill-the-blank inside parentheses, 'Break apart:' full product, bare product) and none is on the lesson page; the fill-the-blank one is especially easy to misread (a child writes 46 instead of 3). The first sheet itself never asks for a full product, so the child has not yet seen the pieces combined.
- Fix applied: Lesson page must show one example of every prompt shape used in the unit (the builder should sample by prompt template, not just by problem); replace the column-method example 1 with 'Break apart: 23 × 3 = (20 × 3) + (3 × 3) = 60 + 9 = 69'; include at least two 'So 24 × 2 =' items on sheet 59.

#### MULTIPLICATION: Break apart to multiply (no carrying) (sheet 68) → Carrying in multiplication (sheet 69)
- **ramp** · **addressed** (MULTIPLICATION)
- Evidence: sheet 77: '77 × 8 → 616', '46 × 2 → 92'; sheet 78: '79 × 6 → 474', '93 × 8 → 744', '57 × 8 → 456', '39 × 8 → 312' — while the next unit '2-digit × 1-digit' opens (sheet 79) with '13 × 4 → 52', '20 × 4 → 80', '12 × 7 → 84'.
- Why: The carrying unit's last two sheets are harder than anything in the unit that follows it (which is nominally the full-algorithm unit); the child hits 93 × 8 with two carries while the lesson page only showed 27 × 4, then drops back to 13 × 4. The two units overlap almost completely.
- Fix applied: Cap the carrying unit at products < 200 with a single carry (teens and twenties × 2–5) and let '2-digit × 1-digit' own the 2-carry cases; or merge the two units.

#### MULTIPLICATION: 2-digit × 1-digit (sheet 84) → 2-digit × 2-digit (sheet 85)
- **cliff** · **addressed** (MULTIPLICATION)
- Evidence: sheet 84: '89 × 4 → 356', '88 × 9 → 792'. sheet 85 opens: '83 × 14 → 1162', '17 × 23 → 391', '17 × 38 → 646', '86 × 17 → 1462', then '11 × 80 → 880', '62 × 11 → 682'.
- Why: The very first 2-digit × 2-digit items are the hardest on the sheet (83 × 14, 86 × 17); the friendly ones (× 11, × 80, × 10-multiples) sit at the bottom. A gentler ordering would let the child succeed before the big carries.
- Fix applied: Order sheet 85 by difficulty: ×10/×20/×11 items first, then teens × teens, then 8x × 1x; keep four-digit products off the first sheet.

#### DIVISION: ÷1 and dividing a number by itself (sheet 9) → Square-root facts (n² ÷ n) (sheet 10)
- **lesson-page** · **addressed** (DIVISION)
- Evidence: example 1: 36 ÷ 6 = → 6 — 'Start with 3: 6 goes into 3 0 times (6 × 0 = 0), remainder 3. Bring down 6 to make 36 …'. example 3: 144 ÷ 12 — three-step long division '12 goes into 14 1 time, remainder 2. Bring down 4 to make 24'. example 2: 30 ÷ 10 (not a square fact). All four examples are long-division walks.
- Why: A Grade-3 child who has only used 'count up' is shown formal long division with 'remainder' and 'bring down' — vocabulary not taught until sheet 59 — for facts that should be recalled from 6 × 6 = 36. The unit's actual idea (a square fact in reverse) is never stated, and one example is off-topic.
- Fix applied: Add a curated example ('6 × 6 = 36, so 36 ÷ 6 = 6') and make the auto-builder use the inverse-fact template for any dividend ≤ 144 with divisor ≤ 12; never emit the long-division template before the remainders unit.

#### DIVISION: Square-root facts (n² ÷ n) (sheet 12) → ÷3 and ÷4 (sheet 13)
- **lesson-page** · **addressed** (DIVISION)
- Evidence: example 2: 36 ÷ 6 and example 3: 121 ÷ 11 (neither is ÷3 or ÷4) — both full long-division walks ('11 goes into 12 1 time, remainder 1. Bring down 1 to make 11'). examples 1 and 4 (28 ÷ 4, 24 ÷ 4) also long division; no ÷3 example at all.
- Why: Half the lesson page is off-topic review problems, every example uses a procedure the child has not been taught, and the unit's own strategy (think 4 × ? = 28) is never shown; ÷3 has zero examples although 9 of 19 items on sheet 13 are ÷3.
- Fix applied: Sample auto examples only from items whose divisor is in the unit (3 or 4), one of each, and use the 'think multiplication' template: '3 × ? = 21 → 7'.

#### DIVISION: ÷3 and ÷4 (sheet 22) → ÷6, ÷7, ÷8, ÷9 (sheet 23)
- **lesson-page** · **addressed** (DIVISION)
- Evidence: example 2: 6 ÷ 3 = → 2 and example 4: 9 ÷ 3 = → 3 (÷3, previous unit); example 1: 56 ÷ 7 and example 3: 27 ÷ 9 shown as long division ('Start with 5: 7 goes into 5 0 times (7 × 0 = 0), remainder 5. Bring down 6 …').
- Why: Two examples are from the unit just finished and the two on-topic ones use long division for single-digit-quotient facts; no link to the ×6–×9 tables the child memorised in the Multiplication pack.
- Fix applied: Filter auto examples to divisors 6–9 and use the inverse-fact template ('7 × 8 = 56, so 56 ÷ 7 = 8'); show one example for each of ÷6, ÷7, ÷8, ÷9.

#### DIVISION: Fact families & missing dividend (sheet 48) → ÷10, ÷11, ÷12 (sheet 49)
- **lesson-page** · **addressed** (DIVISION)
- Evidence: example 2: 10 ÷ 10 = → 1 — 'Start with 1: 10 goes into 1 0 times (10 × 0 = 0), remainder 1. Bring down 0 to make 10: 10 goes into 10 1 time'. example 1: 84 ÷ 12 and example 4: 24 ÷ 12 — long division. example 3: 11 ÷ 11 — 'Count up by 11: 11.'
- Why: Long division for 10 ÷ 10 is absurd on a printed page; two examples are trivial (÷ itself, taught in unit 2), and the useful strategies (÷10 drop the zero, ÷11 repeated digit, ÷12 think 12 × ?) never appear.
- Fix applied: Curated examples: 70 ÷ 10 = 7, 77 ÷ 11 = 7, 84 ÷ 12 → '12 × 7 = 84 so 7'; exclude n ÷ n from auto selection in later units.

#### DIVISION: ÷10, ÷11, ÷12 (sheet 58) → Division with remainders (sheet 59)
- **lesson-page** · **addressed** (DIVISION)
- Evidence: example 1: 29 ÷ 4 = → 7 r 1 — 'Start with 2: 4 goes into 2 0 times (4 × 0 = 0), remainder 2. Bring down 9 to make 29: 4 goes into 29 7 times (4 × 7 = 28), remainder 1. Answer: 7 remainder 1.' All four examples are this procedure; none says what a remainder is.
- Why: The remainder concept (make equal groups, what is left over) is introduced only as a by-product of a bring-down procedure; the printed answer '7 r 1' appears in the header while the steps say '7 remainder 1', so the required written format is never stated explicitly. 'Start with 2: 4 goes into 2 0 times' is an odd first step for every item with a 1-digit quotient.
- Fix applied: Add a curated concept example ('29 ÷ 4: 7 groups of 4 use 28, 1 is left over — write 7 r 1') and a one-line format note; for dividends < 100 with 1-digit quotients use the 'biggest multiple that fits' template instead of the bring-down walk.

#### DIVISION: ÷10, ÷11, ÷12 (sheet 58) → Division with remainders (sheet 59)
- **prereq-gap** · **addressed** (DIVISION)
- Evidence: ramp: sheet 62 '76 ÷ 6 → 12 r 4'; sheet 63 '63 ÷ 5 → 12 r 3'; sheet 68 '29 ÷ 2 → 14 r 1'; sheet 71 '47 ÷ 2 → 23 r 1'; sheet 72 '81 ÷ 4 → 20 r 1'; sheet 73 '77 ÷ 3 → 25 r 2'; sheet 74 '53 ÷ 2 → 26 r 1', '78 ÷ 4 → 19 r 2'; sheet 75 '95 ÷ 4 → 23 r 3'; sheet 76 '83 ÷ 2 → 41 r 1'.
- Why: From sheet 62 onward the quotient exceeds 12, i.e. these are genuine 2-digit ÷ 1-digit long divisions with a remainder — a skill the pack does not teach until the next unit (sheet 77), whose own lesson page then only shows exact divisions. The child meets the hardest form (long division AND remainder) before either piece is taught.
- Fix applied: Cap the remainders unit at quotients ≤ 12 (dividend < 13 × divisor); move 2-digit-quotient remainders to the end of the '2-digit & 3-digit ÷ 1-digit' unit or the review.

#### DIVISION: Division with remainders (sheet 76) → 2-digit & 3-digit ÷ 1-digit (sheet 77)
- **untaught-shape** · **addressed** (DIVISION)
- Evidence: lesson page examples: 96 ÷ 6, 90 ÷ 3, 56 ÷ 4, 45 ÷ 5 (all 2-digit). ramp: sheet 79 '108 ÷ 4 → 27'; sheet 80 '252 ÷ 3 → 84', '204 ÷ 4 → 51'; sheet 85 '483 ÷ 7 → 69'; sheet 92 '672 ÷ 7 → 96', '544 ÷ 8 → 68'.
- Why: Sheets 79–92 (14 of 16 sheets) are 3-digit dividends, but no 3-digit example is printed — the child has never seen a three-step bring-down (7 into 4 → 0, 48, 43) or a case like 204 ÷ 4 where the middle step yields 0. The unit title promises it; the page does not deliver it.
- Fix applied: Make example 3 or 4 a 3-digit item from the unit (e.g. 252 ÷ 3 and 204 ÷ 4 with the zero step); or split into two units with a lesson page at sheet 79.

#### POLYNOMIALS: Identify polynomials (sheet 7) → Degree of a polynomial (sheet 8)
- **ramp** · **addressed** (POLYNOMIALS)
- Evidence: Ramp: sheet 8, sheet 9 and sheet 10 all list exactly 'Find the degree of 2x⁵ + 2x³ + 3. → 5 ‖ 3x³ + 2x + 3. → 3 ‖ 3x⁵ + 2x² + 3. → 5'; sheet 10's first 12 items are identical to sheet 8's first 12.
- Why: Sheets 8-10 appear to be the same 30 items printed three times; every polynomial is already in standard form so the degree is always the first exponent read off — no progression at all.
- Fix applied: Generate distinct item sets per sheet with a fixed seed per sheet index; include unordered polynomials (e.g. 2x + x³ + 5) and monomials/constants by sheet 9-10.

#### POLYNOMIALS: Subtract polynomials (sheet 38) → Multiply monomials (sheet 39)
- **broken** · **addressed** (POLYNOMIALS)
- Evidence: Sheet 39 contains six commutative pairs: '5x · 3x' and '3x · 5x', '6x · 2x' and '2x · 6x', '6x · 4x' and '4x · 6x', '2x · 8x' and '8x · 2x', '5x · 6x' and '6x · 5x', '10x · 3x' and '3x · 10x'.
- Why: Twelve of thirty items are the same product written twice; looks like a generator bug to a parent and wastes 40% of the sheet.
- Fix applied: Dedupe by unordered factor pair when building a sheet.

#### POLYNOMIALS: Distribute a monomial (sheet 47) → Multiply binomials (FOIL) (sheet 48)
- **broken** · **addressed** (POLYNOMIALS)
- Evidence: Sheet 48 contains seven commutative pairs: '(x + 3)(x + 1)' & '(x + 1)(x + 3)', '(x + 5)(x + 3)' & '(x + 3)(x + 5)', '(x + 4)(x + 5)' & '(x + 5)(x + 4)', '(x + 1)(x + 8)' & '(x + 8)(x + 1)', '(x + 6)(x + 3)' & '(x + 3)(x + 6)', '(x + 2)(x + 8)' & '(x + 8)(x + 2)', '(x + 7)(x + 3)' & '(x + 3)(x + 7)'.
- Why: Seven pairs — 14 of 30 items — are the same product with the brackets swapped; identical answers side by side on one printed page.
- Fix applied: Dedupe by unordered pair {a, b}; use the freed slots for (x + a)(x - b) once the lesson shows it.

#### POLYNOMIALS: Multiply binomials (FOIL) (sheet 52) → Partial products (box method) (sheet 53)
- **lesson-page** · **addressed** (POLYNOMIALS)
- Evidence: example 3: 'Top-left: x · x = x². Top-right: x · 9 = 9x. Bottom-left: 2 · x = 2x. Bottom-right: 2 · 9 = 18.' but the key line reads '→ x²,2x,9x,18'. Sheet 53 keys are all 'x²,ax,bx,ab' e.g. '(x + 2)(x + 3) → x²,2x,3x,6'.
- Why: The page tells the student the cells in reading order (x², 9x, 2x, 18) but the answer key lists them in a different order (x², 2x, 9x, 18); nowhere on the page does it say which order the four cells are to be written, so a parent marking against the key will mark a correct box wrong.
- Fix applied: Print the answer key as a 2×2 grid (or state 'list cells top-left, top-right, bottom-left, bottom-right') and make the lesson's key line match that order.

#### POLYNOMIALS: Multiply binomials (FOIL) (sheet 52) → Partial products (box method) (sheet 53)
- **print-fitness** · **addressed** (POLYNOMIALS)
- Evidence: 'Fill in the area model for (x + 2)(x + 2). → x²,2x,2x,4 ⟨interactive:area-model — prints as a grid/diagram⟩' — the brief says these items are rewritten to bare expressions for print; directive: 'Fill the box: each cell is its row times its column'.
- Why: If the item prints as the bare expression '(x + 2)(x + 2)' there is no box to fill and the directive refers to something not on the page; the student has just done FOIL on the same products (sheet 48-52 include (x + 2)(x + 2), (x + 3)(x + 7), (x + 5)(x + 7)) and will simply write x² + 4x + 4, which the comma-list key does not accept.
- Fix applied: Print an empty labelled 2×2 box for every item (row/column headers x, a / x, b) with four blank cells, and print the key as a filled box; or drop this unit from the printed pack since it repeats FOIL on identical numbers.

#### POLYNOMIALS: Partial products (box method) (sheet 56) → Multiply by a trinomial (sheet 57)
- **untaught-shape** · **addressed** (POLYNOMIALS)
- Evidence: Objective: 'Student multiplies a monomial or binomial by a trinomial'. All four lesson examples and all 30 sheet-57 items are monomial × trinomial ('Expand 3x(x² + x + 1)'). Ramp sheet 58: 'Expand (x + 1)(x² + x + 2). → x³ + 2x² + 3x + 2'; sheet 60: '(x + 3)(x² + 2x + 2) → x³ + 5x² + 8x + 6'.
- Why: Binomial × trinomial (six partial products, then collect like terms across three powers) is the real skill of the unit and appears on sheet 58 with no worked example anywhere in the pack; FOIL only ever gave four terms.
- Fix applied: Replace examples 3-4 on the lesson page with one binomial × trinomial worked line-by-line (distribute x, distribute +1, stack and add like terms).

#### POLYNOMIALS: Multiply by a trinomial (sheet 61) → Divide by a monomial (sheet 62)
- **prereq-gap** · **addressed** (POLYNOMIALS)
- Evidence: example 1: 'Factor 2x out of the top: 6x² + 4x = 2x(3x + 2). Now divide: 2x(3x + 2) ÷ 2x — the 2x on top and bottom cancel.' Factor out the GCF is unit 18 (sheets 71-74), nine sheets later.
- Why: The only method shown depends on factoring, which the pack has not taught; the natural paper method (divide each term: 6x² ÷ 2x = 3x, 4x ÷ 2x = 2) is never shown.
- Fix applied: Rewrite the lesson to term-by-term division (split the fraction, divide coefficients, subtract exponents), or move Factor out the GCF before this unit.

#### POLYNOMIALS: Divide by a monomial (sheet 66) → Polynomial long division (sheet 67)
- **ramp** · **addressed** (POLYNOMIALS)
- Evidence: Ramp: sheets 67, 68, 69, 70 all read exactly 'Divide (x² + 2x + 1) ÷ (x + 1). → x + 1 ‖ Divide (x² + 7x + 6) ÷ (x + 1). → x + 6 ‖ Divide (x² + 11x + 30) ÷ (x + 5). → x + 6'; sheet 70's first 12 items equal sheet 67's first 12.
- Why: Four sheets appear to be the same 30 items printed four times, all exact divisions with positive terms and no remainder — nothing that justifies the word 'long division'.
- Fix applied: Seed items per sheet; introduce a minus in the divisor by sheet 69 and a remainder on sheet 70 once long division is actually taught.

#### POLYNOMIALS: Factor out the GCF (sheet 74) → Factor quadratic trinomials (sheet 75)
- **print-fitness** · **addressed** (POLYNOMIALS)
- Evidence: Directive: 'Where a list is shown, select exactly the two factors; otherwise type them as (x + 2)(x + 3), smaller number first.' Lesson examples 2-4 and all 24 sheet-75 items read 'Select all the factors of x² + 5x + 6. → (x + 2),(x + 3) ⟨MC on screen — prints WITHOUT options⟩'.
- Why: On paper there is no list and nothing to type; the printed directive and three of four worked examples describe an on-screen interaction, and the key for these items is a comma pair '(x + 2),(x + 3)' while the typed items on sheets 76-78 key as '(x + 2)(x + 3)' — two answer formats for one skill.
- Fix applied: Print all items as 'Factor x² + 5x + 6.' with the directive 'Write the answer as (x + a)(x + b), smaller number first', and normalise every key to that form.

#### POLYNOMIALS: Perfect-square trinomials (sheet 92) → Factor by grouping (sheet 93)
- **lesson-page** · **addressed** (POLYNOMIALS)
- Evidence: Directive: 'Factor each four-term polynomial by grouping.' Worked step: 'x²(x + 2) + 3(x + 2)' then 'Common factor (x + 2): (x² + 3)(x + 2)'. Every key is written '(x² + b)(x + a)'.
- Why: The natural way to read the worked step is to pull (x + 2) to the front, giving (x + 2)(x² + 3); the key insists on the opposite order and nowhere states which order is expected, so a parent marking against the key will mark correct work wrong.
- Fix applied: Add to the directive: 'Write the x² bracket first, e.g. (x² + 3)(x + 2)' (or accept either order in the key).

#### POLYNOMIALS: Factor by grouping (sheet 96) → Sum & difference of cubes (sheet 97)
- **untaught-shape** · **addressed** (POLYNOMIALS)
- Evidence: All four lesson examples are x³ ± n (x³ + 8, x³ + 1, x³ - 125, x³ - 1000). Sheet 97 items 21-30: 'Factor 8x³ + 1. → (2x + 1)(4x² - 2x + 1)', 'Factor 27x³ - 8. → (3x - 2)(9x² + 6x + 4)', 'Factor 8x³ + 125. → (2x + 5)(4x² - 10x + 25)'.
- Why: A third of the first sheet needs a = 2x or 3x, where a² = 4x² and ab = 6x; the page never shows a with a coefficient, and the ∓ formula alone does not tell the student that 8x³ = (2x)³.
- Fix applied: Replace example 4 with '8x³ - 27 = (2x)³ - 3³ → (2x - 3)(4x² + 6x + 9)' showing a = 2x, a² = 4x², ab = 6x explicitly.

#### GEOMETRY: Vertical angles (sheet 18) → Angles on a straight line (sheet 19)
- **ramp** · **addressed** (GEOMETRY)
- Evidence: Unit 4 lesson: 'Find the missing angle. Angles on a straight line add to 180°.' with examples '[[viz angline 90]] → 90', '[[viz angline 81]] → 99'. Unit 2 (Supplementary angles, sheets 7-12) used the identical viz and identical items: sheet 7 '[[viz angline 90]] → 90', '[[viz angline 81]] → 99'; ramp sheet 12 '[[viz angline 34]] → 146' vs sheet 21 '[[viz angline 37]] → 143'.
- Why: Units 2 and 4 are the same skill with the same diagram and overlapping items; the student does twelve sheets of 180 − x under two names, and the pack regresses after vertical angles instead of building.
- Fix applied: Merge the two units, or make unit 4 genuinely harder: two known angles on the line (three-angle diagrams) or an algebraic angle (2x + 30).

#### GEOMETRY: Circumference & area of circles (sheet 62) → Pythagorean theorem — hypotenuse (sheet 63)
- **prereq-gap** · **addressed** (GEOMETRY)
- Evidence: example 3: '16² + 30² = 1156, c = √1156 = 34'; example 4: '14² + 48² = 2500, c = √2500 = 50'. Ramp sheet 72: '[[viz geomright 45 60 0]] → 75' (5625).
- Why: On paper with no calculator, a Grade 8 student has no method for √1156 or √5625; the page presents the root as given, and squaring 60 and 45 then rooting 5625 by hand is beyond the pack's arithmetic assumptions.
- Fix applied: Show a bracketing method on the page (30² = 900, 40² = 1600, try 34² = 1156 ✓) or state 'you may use a calculator for the square root'; keep first-sheet triples small (3-4-5, 6-8-10, 5-12-13).

#### GEOMETRY: Pythagorean theorem — find a leg (sheet 82) → Trig ratios (sin, cos, tan) (sheet 83)
- **print-fitness** · **addressed** (GEOMETRY)
- Evidence: Directive: 'Write each ratio as a fraction.' Sheet 83: '[[viz geomright 24 32 40 1]] cos θ → 3/5', '[[viz geomright 9 12 15 1]] tan θ → 4/3'; ramp sheet 88: '[[viz geomright 10 24 26 1]] sin θ → 12/13'.
- Why: The key is always the reduced fraction but the directive never says 'in lowest terms', so 24/40 and 12/9 — correct ratios read straight off the diagram — get marked wrong by a parent using the key; the symbol θ and which vertex it marks are also never introduced on the page.
- Fix applied: Directive: 'Write each ratio as a fraction in lowest terms; θ is the marked angle.' Add a line in example 1 identifying which side is opposite θ on the diagram.

#### GEOMETRY: Trig ratios (sin, cos, tan) (sheet 91) → Find a side from a ratio (sheet 92)
- **ramp** · **addressed** (GEOMETRY)
- Evidence: All 24 items on sheet 92 and every ramp item on sheets 93-100 read 'sin θ = a/b. The hypotenuse is N. Find the side opposite θ.' (e.g. sheet 100: 'sin θ = 4/5. The hypotenuse is 65 → 52').
- Why: Nine sheets, 216 items, one case: sin, hypotenuse given, find opposite. Never cos, never tan, never solve for the hypotenuse or adjacent — the unit title promises 'a side from a ratio' but trains only scaling 4/5.
- Fix applied: Rotate sin/cos/tan and the unknown side across sheets 93-100 (cos θ = 3/5, adjacent = 12, find hypotenuse) and add matching lesson examples.

#### PRE_ALGEBRA: Expressions · Order integers (sheet 4) → Expressions · Evaluate (+/−) (sheet 5)
- **ramp** · **addressed** (PRE_ALGEBRA)
- Evidence: Sheets 5–15 (11 sheets × 30 items) are all 'Evaluate x ± k when x = n' with n ≤ 12, k ≤ 12, results 0–21; sheet 15 sample: 'x - 12 when x = 12 → 0'. The unit is named '(+/−)' but no negative value of x or negative result ever appears, although unit 1 just taught negatives.
- Why: Nobody gets lost, but 330 near-identical single-digit substitutions is 11 days of the same problem; the integers from unit 1 are never used and then vanish until sheet 71.
- Fix applied: Cut to 4–5 sheets; from sheet 8 onward introduce x = negative values and expressions like 5 − x, 2 + x + 3, or two-variable substitution.

#### PRE_ALGEBRA: Expressions · Evaluate (×) (sheet 25) → Simplify · Combine like terms (sheet 26)
- **ramp** · **addressed** (PRE_ALGEBRA)
- Evidence: Sheets 26–37 (12 sheets × 30): every item is 'Simplify ax + bx' with a,b ≤ 9; sheet 37 items are 9x, 10x, 11x repeated; lesson says 'Add or subtract the numbers in front' but subtraction never appears.
- Why: 360 items of single-digit addition with an x written after it. No subtraction (5x − 2x), no constant terms (3x + 4 + 2x), no two variables. A parent will see the child doing 3 + 5 for twelve days.
- Fix applied: Shorten to 4 sheets of ax + bx; add ax − bx from sheet 29, ax + c + bx + d from sheet 32, and x-and-y mixes by sheet 35.

#### PRE_ALGEBRA: Simplify · Combine like terms (sheet 37) → Simplify · Distributive property (sheet 38)
- **prereq-gap** · **addressed** (PRE_ALGEBRA)
- Evidence: Lesson page example 3: '3 · −3 = −9.' and example 4: '5 · −3 = −15.' Integer operations are not taught until unit 9 (sheet 71), and even there only addition/subtraction — a product with a negative is never taught in the pack.
- Why: The child has never multiplied by a negative number; the worked step shows a result they cannot verify. The curated line 'With a minus inside, the minus stays' is the usable rule, but the auto-examples contradict it with untaught notation.
- Fix applied: Change the auto-example step to '3 · 3 = 9; keep the minus: 3x − 9' (matching the curated example's wording), or move the integer unit before this one.

#### PRE_ALGEBRA: Simplify · Distributive property (sheet 44) → Simplify · Order of operations (sheet 45)
- **ramp** · **addressed** (PRE_ALGEBRA)
- Evidence: Sheets 45–50 (6 sheets × 30): every single item is 'a + b × c' with the multiplication on the right; e.g. sheet 50: '9 + 2 × 4 → 17', '3 + 5 × 9 → 48'. No subtraction, no parentheses, no 'a × b + c', no division.
- Why: A child who has learned nothing about order of operations gets 100% by always multiplying the last two numbers and adding the first. The objective 'applies the order of operations' is not tested; the pack certifies a rule the child never had to choose.
- Fix applied: Vary the shape within the unit: 'a × b + c', 'a − b × c', '(a + b) × c', 'a + b ÷ c' from sheet 46 onward; add the corresponding cases to the lesson page (the curated example only shows one case).

#### PRE_ALGEBRA: Equations · Integer add & subtract (sheet 76) → Equations · One-step inequalities (sheet 77)
- **ramp** · **addressed** (PRE_ALGEBRA)
- Evidence: Sheets 77–80: every '+' item uses '<' and every '−' item uses '>': 'x + 3 < 6 → x < 3', 'x - 1 > 4 → x > 5' … 'x - 11 > 12 → x > 23'. There is no 'x + a > b', no 'x − a < b', no ≤/≥ anywhere in the unit.
- Why: The sign is perfectly predictable from the operation, so the child copies '<' whenever they see '+' and never has to think about what the inequality means. The lesson's own curated example uses the same pairing.
- Fix applied: Mix all four combinations (+ with >, − with <) from sheet 77 item 10 onward and include one of each on the lesson page; add ≤/≥ on sheets 79–80.

#### PRE_ALGEBRA: Equations · One-step inequalities (sheet 80) → Coordinate Plane · Plot points (sheet 81)
- **print-fitness** · **addressed** (PRE_ALGEBRA)
- Evidence: Lesson page example 1: 'then move UP 2 along the y-axis. Click that grid point'; answers print as '3,2' / '1,1'. Sheet 81: 24 items each flagged ⟨interactive:plot-point — prints as a grid/diagram⟩.
- Why: 'Click' on a printed lesson page tells the parent the material was not made for paper. Twenty-four separate coordinate grids on one sheet is either a multi-page sheet or grids too small to plot on; the printed answer key '1,1' gives the parent nothing to compare a pencil mark against.
- Fix applied: Replace 'Click' with 'Mark' on the print build; verify sheet 81–92 render as one labelled grid per sheet with lettered points to plot (A–X), and print the answer key as a small solved grid; the curated example answer should list both points it plots, not just '3,2'.

#### LINEAR_EQUATIONS: Plot points on the coordinate plane (sheet 4) → Graph a line (sheet 5)
- **untaught-shape** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Sheet 4 (last sheet of the Plot points unit, BEFORE the Graph-a-line lesson) item 12: 'Plot the y-intercept of the line y = x − 1. → 0,-1'.
- Why: The term 'y-intercept' is first defined on sheet 5's lesson page; the child meets it a day earlier in a unit whose lesson only covered plotting ordered pairs.
- Fix applied: Remove y-intercept items from the Plot-points unit or move them to sheet 6+.

#### LINEAR_EQUATIONS: Plot points on the coordinate plane (sheet 4) → Graph a line (sheet 5)
- **print-fitness** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Sheet 5: 30 items, each '⟨interactive:plot-line — prints as a grid/diagram⟩'; answer key values '1,0', '2,-1', '3,3'.
- Why: Thirty full coordinate grids on one worksheet is many pages or unusably small grids; a parent marking a pencil-drawn line against the key '2,-1' has no idea what those two numbers mean.
- Fix applied: Cap plot-line sheets at 6–8 lines on shared grids; print the key as 'slope 2, y-intercept −1: through (0,−1) and (1,1)' or as a thumbnail of the correct line.

#### LINEAR_EQUATIONS: Two-step equations (-) (sheet 38) → Equations with distribution (sheet 39)
- **ramp** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Sheets 39–54 (16 sheets × 30): every item is 'k(x + b) = c' with '+' inside and c divisible by k; the taught method is 'divide both sides first' and the distributive property is never used despite the unit name. Sheet 54 sample: '5(x + 5) = 40 → 3', '6(x + 8) = 102 → 9'.
- Why: Sixteen days of one shape solved by one shortcut; 'k(x − b) = c' and non-divisible cases like 2(x + 3) = 15 never appear, so the child never needs to distribute and the unit does not deliver what its title promises.
- Fix applied: Cut to 6–8 sheets; introduce k(x − b) = c by sheet 42 (add the case to the lesson page) and 3(x + 2) = 15-type items solved by expanding, with an expand-then-solve example.

#### LINEAR_EQUATIONS: Equations with distribution (sheet 54) → Variables on both sides (sheet 55)
- **lesson-page** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Lesson page example 2: 'Solve for x: 2x = x + 2 → 2 — Subtract x from BOTH sides — the right side's x is eliminated: 2x − x = 1x, so 1x = 2. Divide BOTH sides by 1: x = 2 ÷ 1 = 2.' Example 4: 'Solve for x: 4x + 1 = x + 4 → 1 — Undo addition/subtraction first — apply the opposite to BOTH sides so the constant is eliminated. Then undo multiplication/division the same way — x is left alone. x = 1.'
- Why: Example 2 prints '1x' and 'divide both sides by 1', which reads as nonsense to a parent. Example 4 is a generic two-step template that never mentions moving the x-term; a child who follows it literally gets 4x = x + 3 and is stuck. Combining like terms (2x − x) is also not taught anywhere in this pack.
- Fix applied: Template for the 'ax = x + c' shape: '2x − x = x, so x = 2' (suppress '1x' and the divide-by-1 step when the coefficient is 1). Template for 'ax + b = cx + d': 'Subtract x from both sides: 3x + 1 = 4; subtract 1: 3x = 3; divide by 3: x = 1'. Add one line 'Reminder: 4x − x = 3x' to the lesson page.

#### LINEAR_EQUATIONS: Variables on both sides (sheet 72) → Equations with a fraction (sheet 73)
- **broken** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Lesson page and every item on sheets 73–86 carry raw LaTeX: 'Solve for x: \frac{x}{2} = 1', 'example 1: \frac{x}{3} = 4 → 12'. Sheets 87–100 (mixed review) repeat this in a quarter of their items.
- Why: If the PDF builder does not typeset \frac, 34 sheets print '\frac{x}{2} = 1' on paper and are unreadable to a child — that would be a blocker. Even when typeset, the lesson's plain-text steps say 'cancels the ÷2' with no fraction, so the visual link between x/2 and 'x ÷ 2' is only implied.
- Fix applied: Verify the print build renders \frac as a stacked fraction on sheets 73–100; if not, emit 'x/2 = 1' or a stacked fraction. Add 'x over 2 means x ÷ 2' to the lesson page.

#### LINEAR_EQUATIONS: Equations with a fraction (sheet 86) → Linear equations — mixed review (sheet 87)
- **lesson-page** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Lesson page example 2: 'Solve for x: 2x = x + 4 → 4 — … 2x − x = 1x, so 1x = 4. Divide BOTH sides by 1: x = 4 ÷ 1 = 4.' Examples 2 and 3 are both the same 'ax = x + c' shape; the fraction and two-step-minus shapes on the sheet get no auto-example (only the curated one-liner).
- Why: Same '1x / divide by 1' artefact as sheet 55, now on the capstone page of the pack; the review sheet has five shapes but the four examples cover only three of them.
- Fix applied: Fix the coefficient-1 template (see sheet 55); make the review-page example picker choose one item per distinct shape on the sheet (two-step +, two-step −, bracket, both sides, fraction).

### Minors (77)

#### ADDITION: Adding by counting on (+1, +2, +3) (sheet 5) → Doubles (1+1 … 9+9) (sheet 6)
- **ramp** · **addressed** (ADDITION)
- Evidence: Unit title 'Doubles (1+1 … 9+9)' but sheet 7: '11 + 11 → 22', sheet 8: '10 + 10 → 20', '11 + 11 → 22'.
- Why: A Grade 1 child who has only counted to 18 meets 22 with no lesson; the title promises 1+1 … 9+9.
- Fix applied: Cap the doubles generator at 9+9 for this unit (or retitle to 1+1 … 12+12 and add 10+10 to the lesson page).

#### ADDITION: Adding by counting on (+1, +2, +3) (sheet 5) → Doubles (1+1 … 9+9) (sheet 6)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: example 3: '3 + 4 = → 7 Near-double: you know 3 + 3 = 6' on the Doubles page; sheet 6 also has '3 + 5 → 8', '1 + 6 → 7'.
- Why: Near-doubles are unit 4; the auto-example previews a strategy the unit is not about, and 3+5 / 1+6 are neither doubles nor counting-on-from-the-first-number.
- Fix applied: Auto-examples for a unit should be drawn only from items whose strategy matches the unit; keep filler items to already-taught +1/+2/+3 shapes.

#### ADDITION: Doubles (1+1 … 9+9) (sheet 8) → Adding zero & turnarounds (sheet 9)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: example 3: '4 + 4 = → 8 This is a double', example 4: '6 + 6 = → 12 This is a double' — two of four examples are doubles on the +0/turnaround page; only example 1's last line mentions turnarounds.
- Why: Half the page re-teaches last unit; the turnaround idea (2+4 = 4+2), which is 1/3 of the sheet, gets one line.
- Fix applied: Auto-pick examples by unit strategy: one +0, one 0+, one turnaround pair (2 + 5 and 5 + 2 side by side).

#### ADDITION: Adding zero & turnarounds (sheet 11) → Near-doubles (use the double you know) (sheet 12)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: example 1: '6 + 7 = → 13'; example 2: '7 + 6 = → 13 Near-double: you know 6 + 6 = 12'.
- Why: Examples 1 and 2 are the same fact turned around; a second double (4+5 from 4+4, or 8+9 from 8+8) would cover more of the sheet.
- Fix applied: Dedupe auto-examples against the curated one by unordered operand pair.

#### ADDITION: Near-doubles (use the double you know) (sheet 15) → Make ten & bridging through 10 (sheet 16)
- **ramp** · **addressed** (ADDITION)
- Evidence: Sheet 16 contains '2 + 3', '2 + 1', '1 + 1', '1 + 2', '3 + 2', '4 + 3' among 30 items.
- Why: Six trivial fillers on a stars-2 Grade 2 sheet look like padding to a parent.
- Fix applied: Cap review filler at ~10% and draw it from the immediately preceding unit (near-doubles), not from +1/+2.

#### ADDITION: Make ten & bridging through 10 (sheet 20) → Fact families to 18 (sheet 21)
- **print-fitness** · **addressed** (ADDITION)
- Evidence: example 2: 'Start at 2 and count up to 11, using the dots. Count how many empty circles you fill in — that's the missing number, 9.'
- Why: The text presupposes a printed row of circles; if the PDF lesson page does not render the dot strip the instruction refers to nothing.
- Fix applied: Confirm the dot strip renders on the printed lesson page; otherwise use the count-up wording of example 1 ('8, 9, 10, 11 — that is 9 jumps').

#### ADDITION: Fact families to 18 (sheet 28) → 2-digit addition (no regrouping) (sheet 29)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: example 2: '50 + 44', example 3: '50 + 14' (both a multiple of ten plus a number); example 4: '8 + 7 = ? Near-double' on the 2-digit page. Sheet 29: 20 two-digit items, every one has an addend that is 20, 50 or 80.
- Why: Only the curated 34 + 25 shows the general tens-and-ones case; the sheet's first items are one narrow case, so the tens column is always 'x + 0' — pedagogically gentle but the auto-examples add nothing.
- Fix applied: Make the auto-example picker prefer distinct cases (one 'x0 + yz', one 'ab + cd' with both ones non-zero) and exclude single-digit review items from the page.

#### ADDITION: 2-digit addition (no regrouping) (sheet 44) → 2-digit addition (regrouping) (sheet 45)
- **broken** · **addressed** (ADDITION)
- Evidence: Sheet 45 (10 items): '22 + 19' and '19 + 22'; '34 + 19' and '19 + 34'.
- Why: Two commutative duplicates on a 10-item sheet — a fifth of the sheet is repeated work.
- Fix applied: Dedupe sheet items by unordered operand pair.

#### ADDITION: 2-digit addition (no regrouping) (sheet 44) → 2-digit addition (regrouping) (sheet 45)
- **ramp** · **addressed** (ADDITION)
- Evidence: Sheets 47–53, 63: '7 + 6 → 13', '6 + ___ = 14 → 8', '7 + ___ = 16 → 9', '6 + 6 = ? → 12', '7 + 5 = ? → 12', '8 + 4 = ? → 12' on 10-item regrouping sheets.
- Why: Single-digit fact fillers take 10–30% of tiny 10-item sheets in a stars-4 unit; progress is flat and padded.
- Fix applied: Keep review filler off 10-item sheets, or enlarge the sheets.

#### ADDITION: 2-digit addition (regrouping) (sheet 64) → 3-digit addition & three addends (sheet 65)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: Sheet 67: '304 + 814 → 1118'; sheet 76: '780 + 950 → 1730', '916 + 950 → 1866'; lesson examples top out at 982.
- Why: Four-digit answers (carry into a new thousands column) are not shown on the page; the child saw 'bring down the 1' only informally in unit 8.
- Fix applied: Include one sum ≥ 1000 among the auto-examples (e.g. 644 + 746 = 1390).

#### ADDITION: 3-digit addition & three addends (sheet 84) → Missing addend & mixed review (sheet 85)
- **lesson-page** · **addressed** (ADDITION)
- Evidence: example 2: '94 + 16 … Nothing left to add — bring down the carried 1. Answer: 110.' example 4: '46 + 76 … Nothing left to add — bring down the carried 1. Answer: 122.'
- Why: Two of four examples are the identical over-100 case while the sheet also has plain 2-digit, x0-total and missing-addend items.
- Fix applied: Dedupe auto-examples by case signature (carry pattern / shape), not just by problem.

#### SUBTRACTION: Subtracting by counting back (−1, −2, −3) (sheet 6) → Subtract 0 and subtract all (sheet 7)
- **ramp** · **addressed** (SUBTRACTION)
- Evidence: Sheets 7–10 (110 items): '1 - 1 → 0', '4 - 0 → 4', '6 - 6 → 0', '10 - 0 → 10', '7 - 7 → 0', '8 - 0 → 8' …
- Why: Four full sheets of x−0 and x−x is far more than the skill needs; it looks like padding.
- Fix applied: Cut to two sheets and blend in counting-back review.

#### SUBTRACTION: Subtracting by counting back (−1, −2, −3) (sheet 6) → Subtract 0 and subtract all (sheet 7)
- **lesson-page** · **addressed** (SUBTRACTION)
- Evidence: example 3: '1 - 0 = → 1 / Start at 1 and count back 0. / Ask: 0 plus what equals 1?'
- Why: The 'plus what' inverse is the unit-6 idea; for −0 the printed reason should be 'taking away nothing leaves 1'.
- Fix applied: Use a dedicated −0 / −all template ('take away nothing' / 'take all of them away: 0 left').

#### SUBTRACTION: Subtract 0 and subtract all (sheet 10) → Find the difference (count up) (sheet 11)
- **print-fitness** · **addressed** (SUBTRACTION)
- Evidence: example 3 heading prints as '4 - 2 = ? → 2' while the others print '9 - 6 = '.
- Why: The MC prompt text leaks its '= ?' into the lesson heading; inconsistent and unpolished.
- Fix applied: Normalise the example stem to 'a − b =' regardless of source item format.

#### SUBTRACTION: Find the difference (count up) (sheet 18) → Halving & near-halves (using doubles) (sheet 19)
- **ramp** · **addressed** (SUBTRACTION)
- Evidence: Sheet 19 (28 items): only 9 use doubles (15 - 7, 18 - 9, 12 - 6, 11 - 5, 10 - 5, 17 - 8, 14 - 7, 16 - 8, 13 - 6); the rest are '3 - 2', '2 - 1', '4 - 2', '3 - 3', '4 - 3', '4 - 1' …
- Why: Two-thirds of the first sheet is trivial review, so the new skill barely gets practised while the sheet looks babyish for stars 2.
- Fix applied: Invert the ratio: ≥ 60% unit items, review drawn from unit 3 (within-10 differences).

#### SUBTRACTION: Halving & near-halves (using doubles) (sheet 24) → Bridging down through 10 (sheet 25)
- **ramp** · **addressed** (SUBTRACTION)
- Evidence: Sheet 25 includes '7 - 5 = ?', '8 - 4 = ?', '9 - 4'; sheet 32 samples: '7 - 3 → 4', '6 - 5 → 1', '4 - 2 → 2'.
- Why: Within-10 fillers on the last sheet of a stars-3 bridging unit regress the ramp.
- Fix applied: Draw filler for this unit from doubles/near-halves (unit 4) instead of within-10 facts.

#### SUBTRACTION: Bridging down through 10 (sheet 32) → Fact families to 18 (sheet 33)
- **lesson-page** · **addressed** (SUBTRACTION)
- Evidence: example 3: '13 - 7 = → 6 / Ones: 3 borrow 10 → 13 − 7 = 6. / Tens: 1 (borrowed: 1 − 1 = 0) − 0 = 0.'
- Why: Same absurd column-borrow text for a fact, on a page whose other examples are good; and the sheet's '1 + ___ = 3' missing-addend shape appears only as a one-line aside in example 1.
- Fix applied: Suppress the borrow template for minuends < 20; add one '5 + ___ = 13' auto-example.

#### SUBTRACTION: Fact families to 18 (sheet 40) → 2-digit subtraction (no borrowing) (sheet 41)
- **ramp** · **addressed** (SUBTRACTION)
- Evidence: Sheets 42–45 samples: '36 - 3', '45 - 1', '56 - 4', '77 - 2', '68 - 7', '76 - 1', '38 - 3', '57 - 6', '57 - 5' — four sheets of 2-digit minus 1-digit; sheet 41 has only two true 2-digit − 2-digit items (34 - 22, 52 - 22) among 25.
- Why: Lesson example 1 (58 − 23) is the general case, but the child practises almost nothing but 'x − a single digit' for five sheets; flat and easier than the lesson.
- Fix applied: Ramp: sheet 41 x−a, 42 x−y0, 43+ ab − cd with both columns; dedupe.

#### SUBTRACTION: Fact families to 18 (sheet 40) → 2-digit subtraction (no borrowing) (sheet 41)
- **lesson-page** · **addressed** (SUBTRACTION)
- Evidence: examples 2–4: '34 - 3', '12 - 2', '93 - 2' — all 2-digit minus 1-digit with 'Tens: x − 0 = x'.
- Why: Three auto-examples of the same trivial case; none shows 61 − 40 or 43 − 43 which are also on the sheet.
- Fix applied: Dedupe auto-examples by case signature.

#### SUBTRACTION: 2-digit subtraction (no borrowing) (sheet 54) → 2-digit subtraction (borrowing) (sheet 55)
- **ramp** · **addressed** (SUBTRACTION)
- Evidence: Sheet 55: '12 - 6 = ? → 6'; sheet 59: '13 - 6 → 7'; sheet 66: '14 - 7', '15 - 6'; sheet 71: '13 - 6'.
- Why: Basic facts scattered through a stars-4 borrowing unit as filler.
- Fix applied: Draw filler from unit 7 (no-borrow 2-digit) instead of facts.

#### SUBTRACTION: 2-digit subtraction (borrowing) (sheet 72) → 3-digit subtraction (regrouping) (sheet 73)
- **lesson-page** · **addressed** (SUBTRACTION)
- Evidence: example 3: '22 - 19 = → 3' on the 3-digit page; sheet 73 has '61 - 49', '22 - 19', '134 - 134' and uses minuend 712 four times in 10 items.
- Why: One of four examples is a 2-digit review item and the sheet repeats one minuend; not confusing but looks generated.
- Fix applied: Exclude review items from auto-examples; vary minuends on the first sheet.

#### SUBTRACTION: 3-digit subtraction (regrouping) (sheet 88) → Missing number & mixed review (sheet 89)
- **ramp** · **addressed** (SUBTRACTION)
- Evidence: Sheet 93: '7 - 1 → 6'; sheet 90: '644 - 644 → 0'.
- Why: Trivial items on a Grade 4 review sheet.
- Fix applied: Floor review filler at 2-digit.

#### ADDITION: Doubles (1+1 … 9+9) (sheet 8) → Adding zero & turnarounds (sheet 9)
- **print-fitness** · **addressed** (ADDITION)
- Evidence: Across both packs, MC items print as '0 + 3 = ?' / '5 - 4 = ?' next to plain '0 + 2' / '5 - 2' items.
- Why: Mixed stems on one printed sheet look inconsistent; the '= ?' carries no meaning without options.
- Fix applied: Strip '= ?' from MC stems when printing and render every item as 'a + b = ____'.

#### FRACTIONS: Part of a whole (sheet 1) → Understanding the numerator (sheet 2)
- **ramp** · **addressed** (FRACTIONS)
- Evidence: Unit order: 1. Part of a whole (sheet 1) asks for the full fraction [[viz vbar 3 5]] → 3/5; then 2. numerator only (→ 2), 3. denominator only (→ 6), 4. Writing fractions from pictures (→ 5/12) again. Units 1–5 are one sheet each.
- Why: The child writes whole fractions on sheet 1, is then dropped back to counting one number for two sheets, then writes whole fractions again on sheet 4 — a regression, and five single-sheet units give no practice before the next lesson page.
- Fix applied: Reorder to numerator → denominator → part of a whole → writing from pictures, or merge units 1–4 into one 3–4 sheet 'Fractions from pictures' unit.

#### FRACTIONS: Writing fractions from pictures (sheet 4) → Comparing fractions with pictures (sheet 5)
- **ramp** · **addressed** (FRACTIONS)
- Evidence: Sheet 5 has only 7 items and is the whole unit; sheet 4 had 9 items.
- Why: Two consecutive units of one thin sheet each — a parent printing a 50-sheet pack gets near-empty pages.
- Fix applied: Fill sheets 4 and 5 to at least 12 items, or fold both into the Identify fractions unit.

#### FRACTIONS: Comparing fractions with pictures (sheet 5) → Identify fractions (sheet 6)
- **ramp** · **addressed** (FRACTIONS)
- Evidence: Ramp 6–9: sheet 9's first 12 items (1 out of 10, 5 out of 8, 6 out of 8, 3 out of 10, [[viz hexa 1 10]] …) repeat sheet 6's items; sheet 7 and 9 both sample [[viz hexa 3 8]] and [[viz pie 2 12]].
- Why: Four sheets of Grade-3 identify with no growth after the child has already written fractions from pictures for 4 sheets — flat and repetitive.
- Fix applied: Cut Identify to 2 sheets and give the freed sheets to Add/Subtract/Divide, which are short.

#### FRACTIONS: Identify fractions (sheet 9) → Equivalent fractions (sheet 10)
- **lesson-page** · **addressed** (FRACTIONS)
- Evidence: example 2: [[viz cmp 2 3 4 6]] 2/3 = ?/6 → 4 with steps 'Shaded parts: 2 / Total equal parts: 3 / Answer: 4'.
- Why: The picture-item auto-example uses the shaded/total template and never shows the ×2 step; the child gets the answer 4 with no route to it (examples 3–4 do show it, so not blocking).
- Fix applied: Route cmp-picture equivalent items through the '×k on top and bottom' template, not the shaded/total template.

#### FRACTIONS: Compare fractions (sheet 20) → Order fractions (sheet 21)
- **ramp** · **addressed** (FRACTIONS)
- Evidence: Sheets 21–24 all use three fractions with denominators from {2,3,4,6} only; sheet 24 (2/3,1/4,3/4; 1/4,2/4,2/6) is no harder than sheet 21 (1/2,2/3,1/6).
- Why: Four sheets with no progression; denominators 5, 8, 10, 12 that the Compare unit already used never appear.
- Fix applied: Sheets 23–24: add denominators 5/8/10/12 and one four-fraction item per sheet.

#### FRACTIONS: Improper fractions (sheet 38) → Add fractions (sheet 39)
- **print-fitness** · **addressed** (FRACTIONS)
- Evidence: Directive 'Add. Simplify if possible.'; answers '2/4 + 3/4 → 5/4', '4/6 + 4/6 → 4/3' printed as improper. Auto-examples 2–4 start at 'Step 2 —' with no Step 1.
- Why: The child has just spent 4 sheets converting to mixed numbers; nothing on the sheet says whether 1 1/4 or 5/4 is wanted (only a buried line on the lesson page), so a parent marking from the key will mark 1 1/4 wrong. Steps numbered 2–4 look broken.
- Fix applied: Directive: 'Add. Write the answer in simplest form; an improper fraction (5/4) is fine.' Renumber auto-example steps from 1.

#### FRACTIONS: Multiply fractions (sheet 47) → Divide fractions (sheet 48)
- **lesson-page** · **addressed** (FRACTIONS)
- Evidence: example 1: 1/2 ÷ 2/3 → 3/4; example 2: 'Divide the fractions: 1/2 ÷ 2/3 → 3/4' — the same problem twice.
- Why: One of the four example slots is wasted on a duplicate; the page looks careless.
- Fix applied: Skip auto-examples whose expression equals the curated example.

#### FRACTIONS: Multiply fractions (sheet 47) → Divide fractions (sheet 48)
- **ramp** · **addressed** (FRACTIONS)
- Evidence: Divide fractions — sheets 48–49 (2 sheets); Identify fractions got 4, Equivalent 6, Simplify 6.
- Why: The hardest skill in the pack (stars 5) gets the least practice; sheet 49 already includes whole-number answers ('1/2 ÷ 1/8 → 4', '2/3 ÷ 1/8 → 16/3').
- Fix applied: Rebalance: 3 sheets for divide, taken from Identify/Simplify.

#### FRACTIONS: Divide fractions (sheet 49) → Fraction mastery (sheet 50)
- **broken** · **addressed** (FRACTIONS)
- Evidence: Sheet 50: 'Add the fractions: 2/10 + 8/10 → 1' and 'Add the fractions: 8/10 + 2/10 → 1' on the same sheet.
- Why: Commuted duplicate on one printed page.
- Fix applied: Dedupe items by unordered operand pair for commutative operations.

#### DECIMALS: Decimals — add (hundredths) (sheet 10) → Decimals — subtract (tenths) (sheet 11)
- **ramp** · **addressed** (DECIMALS)
- Evidence: Sheet 11: '0.4 − 0.4 → 0', '1.2 − 1.2 → 0', '1.3 − 1.3 → 0', '1.7 − 1.7 → 0' (4 of 30 answer 0); example 4 text '16 − 15 = 1 tenths'.
- Why: Filler zero items and a grammar slip on the lesson page; not a comprehension problem.
- Fix applied: Cap identical-operand items at one per sheet; pluralise correctly ('1 tenth').

#### DECIMALS: Decimals — multiply two decimals (sheet 31) → Decimals — divide by a whole number (sheet 32)
- **lesson-page** · **addressed** (DECIMALS)
- Evidence: example 2: '0.3 ÷ 3 = → 0.1 — Divide as if whole numbers: 03 ÷ 3.'
- Why: '03' is a formatting leak; a child will wonder what 03 is.
- Fix applied: Strip the leading zero when the dividend is below 1 ('3 ÷ 3 = 1, one decimal place → 0.1').

#### DECIMALS: Decimals — divide by a whole number (sheet 36) → Percentages of a number (sheet 37)
- **lesson-page** · **addressed** (DECIMALS)
- Evidence: example 3: '20% of 30 = → 6 — 20% = 20/100. 30 × 20/100. Answer: 6.' (same for 10% of 10 and 50% of 46). Sheet 37 also has '5% of 40 → 2', '60% of 15 → 9', '75% of 8 → 6'.
- Why: The auto-examples write an expression and jump to the answer without computing it, and none uses the 10%-first method the curated example teaches; 5% (half of 10%) is never shown.
- Fix applied: Auto-template: '10% of 30 = 3; 20% is 2 × 3 = 6'; add a 5% line to the curated example.

#### DECIMALS: Percentages of a number (sheet 42) → Convert fractions, decimals, percents (sheet 43)
- **print-fitness** · **addressed** (DECIMALS)
- Evidence: example 1 ends 'Type a fraction answer as top/bottom, e.g. 3/4'; the example prompt 'Write 3/4 as a decimal and as a percent, then write 0.75 as a fraction' → '0.75, 75%, 3/4' runs several lines.
- Why: 'Type' is a screen instruction on a printed page; the triple-answer example is hard to read in the example box.
- Fix applied: Drop the 'Type' line from the PDF build; split the curated example into three short examples.

#### DECIMALS: Decimals — mixed review (sheet 50) → Ratios — simplify (sheet 51)
- **ramp** · **addressed** (DECIMALS)
- Evidence: Ramp: sheet 55 '7 : 7 → 1 : 1', sheet 57 '16 : 16 → 1 : 1', sheet 58 '9 : 9 → 1 : 1' and '18 : 18 → 1 : 1' (two on one sheet); curated example says 'GCF of 6 and 9 = 3' with no definition.
- Why: Trivial a:a items pile up on the later sheets; GCF is named only in the terse curated example (auto-examples do define it, so not blocking).
- Fix applied: Cap a:a items at one per unit; write 'biggest number that divides both (GCF)' in the curated example.

#### DECIMALS: Ratios — solve a proportion (sheet 80) → Ratios — scale up (sheet 81)
- **ramp** · **addressed** (DECIMALS)
- Evidence: Scale up is unit 14 (Grade 7, stars 4) but every item is two one-digit multiplications ('scale 3 : 4 by 2 → 6 : 8'); sheets 81–91 differ only in the factor (2 → 8). Solve-a-proportion (unit 13) already required finding the scale.
- Why: Difficulty regresses after proportions and stays flat for 11 sheets.
- Fix applied: Move Scale up before Equivalent ratios (it is the prerequisite idea), or shorten it to 4 sheets.

#### MULTIPLICATION: ×3 and ×4 (build from ×2) (sheet 22) → ×6, ×7, ×8, ×9 (the hard facts) (sheet 23)
- **prereq-gap** · **addressed** (MULTIPLICATION)
- Evidence: ramp: sheet 32: 7 × 11 = ? → 77; sheet 33: 6 × 11 → 66; sheet 35: 8 × 11 → 88; sheet 36: 7 × 12 → 84, 8 × 12 → 96 (last sheet).
- Why: ×11 and ×12 belong to unit 7 (sheets 49–52); they surface here on sheets 32–36 before any lesson on them. The 'use a five' strategy only works if 12 × 5 is known.
- Fix applied: Cap the second factor at 10 inside the ×6–×9 unit; leave ×11/×12 products for the ×10, ×11, ×12 unit.

#### MULTIPLICATION: ×3 and ×4 (build from ×2) (sheet 22) → ×6, ×7, ×8, ×9 (the hard facts) (sheet 23)
- **lesson-page** · **addressed** (MULTIPLICATION)
- Evidence: example 4: 9 × 1 = → 9 — 'Picture 1 equal groups of 9 — the rows in the picture. Skip-count by 9: 9.'
- Why: A ×1 fact taught in unit 2 wastes a slot on the hardest-facts lesson page; the grammar 'Picture 1 equal groups' and 'the rows in the picture' (no picture is printed) look unprofessional.
- Fix applied: Exclude factors 0/1 from auto-example selection; fix singular/plural and drop 'the rows in the picture' when no picture is rendered on the printed page.

#### MULTIPLICATION: ×10, ×11, ×12 (sheet 52) → Multiplying tens (20 × 3) (sheet 53)
- **ramp** · **addressed** (MULTIPLICATION)
- Evidence: sheet 53: all 30 items are the scaffolded form '7 × 2 = 14, so 70 × 2 = → 140'. sheet 57: '300 × 7 = → 2100', '200 × 2 = → 400'; sheet 58: '600 × 9 → 5400', '700 × 9 → 6300'.
- Why: The first sheet gives the fact away on every line (one narrow case, nothing to think about); by sheets 57–58 the unit silently switches to hundreds × digit, which neither the objective ('tens by a single digit') nor the lesson page mentions.
- Fix applied: Mix bare '30 × 4 =' items into sheet 53 after the first ~10 scaffolded ones; either add a hundreds example ('3 hundreds × 7 = 21 hundreds = 2100') to the lesson page or keep the unit to tens.

#### MULTIPLICATION: ×10, ×11, ×12 (sheet 52) → Multiplying tens (20 × 3) (sheet 53)
- **lesson-page** · **addressed** (MULTIPLICATION)
- Evidence: example 1: 20 × 3 = → 60 — 'Ones: 0 × 3 = 0. Write 0. Tens: 2 × 3 = 6. Write 6.' while the objective says '2 tens × 3 = 6 tens, so 20 × 3 = 60'.
- Why: The headline example contradicts the objective's own method; examples 2–4 then teach the 'tens' reasoning correctly, so the first example is the odd one out.
- Fix applied: Use the tens template for the curated example 1 as well.

#### MULTIPLICATION: Multiplying tens (20 × 3) (sheet 58) → Break apart to multiply (no carrying) (sheet 59)
- **ramp** · **addressed** (MULTIPLICATION)
- Evidence: sheet 58 ends with '700 × 9 = → 6300', '600 × 7 = → 4200'; sheet 59 is ten one-fact items: '21 × 2 Step 2: 1 × 2 = → 2', '23 × 2 Step 2: 3 × 2 = → 6', … and lists Step 2 items before any Step 1 item.
- Why: A child who just multiplied hundreds is handed a page whose hardest item is 20 × 2; the Step 2 prompts come before Step 1 so the sequence reads backwards.
- Fix applied: Order sheet 59 Step 1 → Step 2 → full product for each problem; raise its ceiling to a few complete 2-digit × 1-digit products.

#### MULTIPLICATION: Break apart to multiply (no carrying) (sheet 68) → Carrying in multiplication (sheet 69)
- **broken** · **addressed** (MULTIPLICATION)
- Evidence: sheet 69: '3 × 4 = 12 and 10 × 4 = 40. So 13 × 4 = → 52' and, three lines later, '13 × 4 → 52'.
- Why: Same product asked twice on one sheet, once with the answer effectively given; looks sloppy in print.
- Fix applied: Uniqueness guard should key on the underlying (a, b) pair across all prompt templates on a sheet.

#### MULTIPLICATION: Break apart to multiply (no carrying) (sheet 68) → Carrying in multiplication (sheet 69)
- **untaught-shape** · **addressed** (MULTIPLICATION)
- Evidence: sheet 69: '15 × 3 Ones: 5 × 3 = 15 → write 5, carry → 1' and '14 × 3 Tens: 10 × 3 = → 30'; lesson page shows 'Ones first: 3 × 5 =' and the sum form, but not the 'write 5, carry ___' prompt.
- Why: The 'carry →' fill-in is a new response shape (answer is the carry digit, not a product); example 4's text ('the tens digit of it becomes the carry') hints at it but no printed item of that shape is modelled, so some children will write 15.
- Fix applied: Include one 'write 5, carry ___' item as a worked example on the lesson page.

#### MULTIPLICATION: 2-digit × 2-digit (sheet 96) → Mixed review (sheet 97)
- **ramp** · **addressed** (MULTIPLICATION)
- Evidence: sheet 97 (29 items): all basic facts and teen × 1-digit (6 × 2, 7 × 7, 18 × 7, 17 × 8 …); sheets 98–100: 31 × 2, 35 × 9, 74 × 2, 81 × 6, 91 × 2. No 2-digit × 2-digit anywhere in the review.
- Why: The 'Mixed review' never revisits the unit the child just spent 12 sheets on (2-digit × 2-digit) or multiplying tens; it reads as a step back rather than a review.
- Fix applied: Sample the review from every unit in the pack, including 2-digit × 2-digit and tens × digit.

#### DIVISION: ÷2, ÷5, ÷10 (sheet 6) → ÷1 and dividing a number by itself (sheet 7)
- **lesson-page** · **addressed** (DIVISION)
- Evidence: example 1: 8 ÷ 8 — 'Ask: 8 times what gets close to 8? Count up by 8: 8.' example 4: 9 ÷ 1 — 'Count up by 1: 1, 2, 3, 4, 5, 6, ….' Three of four examples are ÷1.
- Why: The rule ('any number divided by 1 is itself; any number divided by itself is 1') is never stated in words — the child infers it from truncated count-ups, and the list for 9 ÷ 1 stops at 6 with an ellipsis, so the example never actually reaches 9.
- Fix applied: Add a curated rule example ('9 ÷ 1 = 9: one group holds everything; 9 ÷ 9 = 1: nine groups of one') and never truncate a count-up list.

#### DIVISION: ÷6, ÷7, ÷8, ÷9 (sheet 36) → Fact families & missing dividend (sheet 37)
- **lesson-page** · **addressed** (DIVISION)
- Evidence: example 3: 12 ÷ 4 = → 3 — 'Start with 1: 4 goes into 1 0 times (4 × 0 = 0), remainder 1. Bring down 2 to make 12 …'. example 4: 8 ÷ 2 (count up).
- Why: Examples 1–2 correctly model both blank positions, but the remaining two slots go to plain facts (one via long division) instead of a second missing-dividend and a second missing-divisor case; otherwise this boundary is sound.
- Fix applied: Fill slots 3–4 with another '___ ÷ 2 = 8' and '9 ÷ ___ = 3' from the sheet, using the inverse template.

#### DIVISION: Division with remainders (sheet 76) → 2-digit & 3-digit ÷ 1-digit (sheet 77)
- **lesson-page** · **addressed** (DIVISION)
- Evidence: example 4: 45 ÷ 5 = → 9 — 'Start with 4: 5 goes into 4 0 times (5 × 0 = 0), remainder 4. Bring down 5 to make 45 …'. example 2: 90 ÷ 3 — 'Bring down 0 to make 0: 3 goes into 0 0 times'.
- Why: A basic fact (45 ÷ 5) is walked through long division on the page meant to show 2-digit quotients; the wording 'make 0' for the trailing zero reads awkwardly.
- Fix applied: Exclude items with 1-digit quotients from this unit's auto examples; phrase the zero step as 'Bring down the 0: 3 goes into 0 zero times, write 0'.

#### DIVISION: 2-digit & 3-digit ÷ 1-digit (sheet 92) → Mixed review (sheet 93)
- **ramp** · **addressed** (DIVISION)
- Evidence: sheet 93–100 items: 17 ÷ 4 → 4 r 1, 70 ÷ 7, 19 ÷ 8 → 2 r 3, 80 ÷ 9 → 8 r 8, 67 ÷ 4 → 16 r 3 … No 3-digit dividend and almost no exact 2-digit-quotient division appears in the 8 review sheets.
- Why: The review skips the unit just completed (3-digit ÷ 1-digit) and the ÷10/11/12 and missing-dividend forms, so it functions as a second remainders unit rather than a mixed review.
- Fix applied: Sample review items across all nine units, including 3-digit dividends and missing-number forms.

#### POLYNOMIALS: Classify polynomials by terms (sheet 4) → Identify polynomials (sheet 5)
- **untaught-shape** · **addressed** (POLYNOMIALS)
- Evidence: Lesson rule: 'A polynomial cannot have x in a denominator, under a root sign, or with a negative/fractional exponent.' Ramp sheet 6: 'Is this a polynomial? 2ˣ - 1 → No'; sheet 7: '3ˣ + 2 → No'.
- Why: x as an exponent is never mentioned in the rule, so a student applying the printed rule literally will answer Yes to 2ˣ - 1 and be marked wrong.
- Fix applied: Add 'x in the exponent (like 2ˣ)' to the lesson rule and include one such No example on the lesson page.

#### POLYNOMIALS: Identify polynomials (sheet 7) → Degree of a polynomial (sheet 8)
- **lesson-page** · **addressed** (POLYNOMIALS)
- Evidence: example 1: Find the degree of 3x⁴ + 2x + 3 → 4 ... example 3: Find the degree of 3x⁴ + 2x + 3. → 4
- Why: Two of the four worked examples are the identical problem; a paying parent sees a page that was clearly machine-padded.
- Fix applied: Dedupe auto-built examples against the curated one; pick a degree-2 or degree-3 case instead.

#### POLYNOMIALS: Degree of a polynomial (sheet 10) → Write in standard form (sheet 11)
- **ramp** · **addressed** (POLYNOMIALS)
- Evidence: Every item on sheets 11-13 has the form 'c + ax² + bx' (e.g. '5 + 2x² + x', '1 + 2x² + 4x', '2 + 3x² + 3x').
- Why: One fixed permutation for 72 items; the student learns 'move the middle term to the front' rather than ordering by power, and never meets a cubic, a negative term, or a missing term.
- Fix applied: Vary the scramble (x first, x² last), add degree-3 items and subtraction signs on sheets 12-13.

#### POLYNOMIALS: Write in standard form (sheet 13) → Leading coefficient (sheet 14)
- **untaught-shape** · **addressed** (POLYNOMIALS)
- Evidence: Directive: 'the number on the highest-power term, with its sign'. All four examples are positive (4, 3, 2, 2). Ramp sheet 15: '-2x³ + x → -2'.
- Why: The sign case the directive warns about is never demonstrated before it appears on sheet 15.
- Fix applied: Make one lesson example a negative leading coefficient (e.g. -3x³ + x + 9 → -3).

#### POLYNOMIALS: Constant term (sheet 19) → Evaluate polynomials (sheet 20)
- **untaught-shape** · **addressed** (POLYNOMIALS)
- Evidence: All lesson examples substitute x = 2, 3 or 4. Ramp sheet 22: 'Evaluate 2x² + 2x + 5 at x = -1. → 5'; sheet 23: '3x² + 4x + 1 at x = -1 → 0'.
- Why: Squaring a negative and adding a negative linear term is the classic error point and it is never shown on the page.
- Fix applied: Add one worked example at x = -1 showing (-1)² = 1 and 4·(-1) = -4.

#### POLYNOMIALS: Add polynomials (sheet 33) → Subtract polynomials (sheet 34)
- **ramp** · **addressed** (POLYNOMIALS)
- Evidence: Sheets 34-38 are all '(ax + b) - (cx + d)' with a > c and b > d, e.g. sheet 38: '(6x + 9) - (5x + 8) → x + 1'.
- Why: Five sheets never produce a negative coefficient or constant, so the student never practises the one thing the distribute-the-minus lesson exists for; the ramp is flat.
- Fix applied: By sheet 36 include items like (2x + 3) - (5x + 7) → -3x - 4 and add a matching lesson example.

#### POLYNOMIALS: Multiply monomials (sheet 42) → Distribute a monomial (sheet 43)
- **untaught-shape** · **addressed** (POLYNOMIALS)
- Evidence: All lesson examples are a(x + b). Ramp sheet 44: 'Expand 2x(x - 5). → 2x² - 10x'; sheet 46-47 up to '9x(x - 12) → 9x² - 108x'.
- Why: The minus-inside case appears on the second sheet without a worked example; students commonly write 2x² + 10x.
- Fix applied: Make example 4 on the lesson page a minus-inside case.

#### POLYNOMIALS: Multiply binomials (FOIL) (sheet 52) → Partial products (box method) (sheet 53)
- **ramp** · **addressed** (POLYNOMIALS)
- Evidence: Sheet 56 (last) first 12 items '(x + 3)(x + 4) ... (x + 4)(x + 9)' are the same items that appear on sheet 53 (first) in the same order; all 4 sheets are (x + a)(x + b), 2 ≤ a ≤ b ≤ 9.
- Why: Four sheets of the same 24-36 products in the same order — no progression and largely a re-print.
- Fix applied: Shuffle per sheet and grow toward (2x + a)(x + b) or (x - a)(x + b) on sheets 55-56.

#### POLYNOMIALS: Polynomial long division (sheet 70) → Factor out the GCF (sheet 71)
- **ramp** · **addressed** (POLYNOMIALS)
- Evidence: Sheets 71-74 are all 'Factor ax + b' with a numeric GCF ('Factor 11x + 121. → 11(x + 11)'); objective: 'factors the GCF from a binomial'.
- Why: After dividing quadratics by binomials the student drops back to Grade-7 arithmetic for four sheets and never factors a variable GCF (3x² + 6x → 3x(x + 2)), which the divide-by-monomial lesson already assumed.
- Fix applied: Ramp to variable GCFs (2x² + 8x, 6x³ + 9x²) on sheets 73-74 and show one on the lesson page.

#### POLYNOMIALS: Difference of squares (sheet 88) → Perfect-square trinomials (sheet 89)
- **print-fitness** · **addressed** (POLYNOMIALS)
- Evidence: Directive: 'Type the answer as one squared bracket, e.g. (x + 3)² or (x − 3)².'
- Why: 'Type' on a printed worksheet; otherwise the format is well specified.
- Fix applied: Change 'Type' to 'Write'.

#### POLYNOMIALS: Difference of squares (sheet 88) → Perfect-square trinomials (sheet 89)
- **untaught-shape** · **addressed** (POLYNOMIALS)
- Evidence: All lesson examples are x² ± 2bx + b². Ramp sheet 90: 'Factor 4x² - 20x + 25. → (2x - 5)²'; sheet 92: '9x² - 42x + 49 → (3x - 7)²'.
- Why: The a = (2x)² case needs the student to check the middle term as 2·(2x)·5, which the page never shows.
- Fix applied: Make example 4 '4x² + 12x + 9 → (2x + 3)²' with the 2·2x·3 check spelled out.

#### POLYNOMIALS: Perfect-square trinomials (sheet 92) → Factor by grouping (sheet 93)
- **ramp** · **addressed** (POLYNOMIALS)
- Evidence: Sheets 93-96 are all 'x³ + ax² + bx + ab' with a, b positive, e.g. sheet 96: 'x³ + 7x² + 8x + 56 → (x² + 8)(x + 7)'.
- Why: 120 items of one template; never a negative pair (x³ - 2x² + 3x - 6) or a leading coefficient, so the grouping skill needed for a ≠ 1 trinomials is never built.
- Fix applied: Introduce a minus in the second pair by sheet 95 and 2x³ + ... on sheet 96, with a lesson example for the minus case.

#### GEOMETRY: Supplementary angles (sheet 12) → Vertical angles (sheet 13)
- **ramp** · **addressed** (GEOMETRY)
- Evidence: Sheets 13-18: '[[viz angcross 25]] → 25 ... [[viz angcross 155]] → 155' — every item is copy-the-marked-number.
- Why: Thirty-six items over six sheets with zero computation; the student learns nothing after item 1 and a parent sees six pages of filler.
- Fix applied: After sheet 14 ask for the adjacent angle too (180 − marked) or combine vertical + straight-line in one diagram with two blanks.

#### GEOMETRY: Angles on a straight line (sheet 24) → Angles around a point (sheet 25)
- **ramp** · **addressed** (GEOMETRY)
- Evidence: Sheet 25 items are printed in descending order of answer: 280, 250, 240, 230, 220, 210, 205, 200, 195, 185, 180, 175, 170, 170, ... 110.
- Why: A student can fill the column by pattern (each answer a little less than the last) without adding; the sorted key also makes the sheet look generated rather than authored.
- Fix applied: Shuffle items on the sheet; keep the ramp across sheets.

#### GEOMETRY: Area of rectangles & squares (sheet 50) → Area of triangles (sheet 51)
- **print-fitness** · **addressed** (GEOMETRY)
- Evidence: Sheet 51: '[[viz geomtri 2 14]] → 14', '[[viz geomtri 2 17]] → 17'; lesson example 4 '[[viz geomtri 2 17]] → 17'.
- Why: A base-2, height-17 triangle drawn to scale is a sliver in which the height label and right-angle mark are unreadable; if not drawn to scale the diagram misleads.
- Fix applied: Constrain generated triangles to a height:base ratio between 1:3 and 3:1 (or print base and height as text beside a generic triangle).

#### GEOMETRY: Trig ratios (sin, cos, tan) (sheet 91) → Find a side from a ratio (sheet 92)
- **lesson-page** · **addressed** (GEOMETRY)
- Evidence: examples 2-4: 'Find what the known part was multiplied by. Apply the same factor to the other part. Answer: 40.'
- Why: Three of four examples give no numbers in the working — just the answer — so the page carries only one real worked example.
- Fix applied: Auto-build the steps with the actual numbers: '50 ÷ 5 = 10, so opposite = 4 × 10 = 40'.

#### PRE_ALGEBRA: Expressions · Order integers (sheet 4) → Expressions · Evaluate (+/−) (sheet 5)
- **print-fitness** · **addressed** (PRE_ALGEBRA)
- Evidence: Sheet 4: 'Order these from least to greatest: -5, 6, 0, -1 → -5,-1,0,6 ⟨MC on screen — prints WITHOUT options⟩' (all 24 items)
- Why: On paper the item is still answerable (the child writes the four numbers in order), but nothing tells them how to write the answer and there is no answer line sized for four numbers.
- Fix applied: Print directive 'Write the numbers in order, least first, separated by commas' and give a wide answer blank; answer key '-5, -1, 0, 6'.

#### PRE_ALGEBRA: Expressions · Evaluate (+/−) (sheet 15) → Expressions · Evaluate (×) (sheet 16)
- **ramp** · **addressed** (PRE_ALGEBRA)
- Evidence: Sheets 16–25: every item is 'Evaluate ax when x = n' (a ≤ 9, n ≤ 12); sheet 25 top is '9x when x = 12 → 108'.
- Why: Ten sheets of times-tables with an x wrapper; no 'ax + b', no 'x/2', no negatives. Flat.
- Fix applied: After sheet 19 mix in 'ax + b' and 'ax − b' forms (the lesson-page directive already says 'evaluate for the given value').

#### PRE_ALGEBRA: Simplify · Combine like terms (sheet 37) → Simplify · Distributive property (sheet 38)
- **lesson-page** · **addressed** (PRE_ALGEBRA)
- Evidence: Lesson uses '3 · x = 3x' (middle dot) while every other lesson in the pack uses '×' ('4 × 2 = 8', '3 × 7 = 21').
- Why: The middle dot as a multiplication sign has not been introduced; a Grade 6–7 reader may read '3 · 4' as a decimal point or a typo.
- Fix applied: Use '3 × x = 3x' and '3 × 4 = 12' on this page, or add one line 'the dot means multiply'.

#### PRE_ALGEBRA: Simplify · Order of operations (sheet 50) → Equations · One-step (+/−) (sheet 51)
- **print-fitness** · **addressed** (PRE_ALGEBRA)
- Evidence: Lesson answers are written 'x = 12 − 5 = 7' but the printed answer key for 'Solve for x: x - 3 = 2' is '5' (bare number). Same for units 8, and Linear Equations units 4–9.
- Why: The child does not know whether to write '5' or 'x = 5'; a parent marking against the key may count 'x = 5' wrong or vice-versa.
- Fix applied: Print the directive as 'Solve for x. Write your answer as x = ___' and pre-print 'x =' on the answer line.

#### PRE_ALGEBRA: Equations · One-step (×) (sheet 70) → Equations · Integer add & subtract (sheet 71)
- **lesson-page** · **addressed** (PRE_ALGEBRA)
- Evidence: Unit title 'Equations · Integer add & subtract'; directive 'Add or subtract.'; items '(-1) + 3 → 2', '1 - 5 → -4'. Auto-examples 2–4 are all the '(−a) + b' case; the a − b and (−a) − b cases on the sheet are covered only by the curated example's lines 3–4. Example 1 line 'Number line: -9 … -5 -4 -3 -2 -1 0 1 2 3 … 9' is one long line.
- Why: No equations appear, so the heading is misleading to a parent; the number-line line will wrap awkwardly on the printed page. The sheet itself is well-ramped (positive results → negative results → subtraction) and covered by the curated example, so the child is not lost.
- Fix applied: Rename the unit 'Integers · Add & subtract'; render the number line as a drawn strip; have the auto-example builder pick one item from each shape present on the sheet (one (−a)+b, one a−b, one (−a)−b).

#### PRE_ALGEBRA: Equations · Integer add & subtract (sheet 76) → Equations · One-step inequalities (sheet 77)
- **print-fitness** · **addressed** (PRE_ALGEBRA)
- Evidence: Lesson page: 'x < 5 — the answer is typed as an inequality, x < 5'; auto-examples 2–4 all the same 'x + a < b' case; answer key 'x < 3'.
- Why: 'typed' is screen language on a printed page. The child also needs to be told to write the whole inequality (not '3'), and the three auto-examples show only one of the two shapes on the sheet.
- Fix applied: Change to 'write the answer as an inequality, e.g. x < 5'; make the auto-example picker take at least one '−' / '>' item from the sheet.

#### PRE_ALGEBRA: Coordinate Plane · Plot points (sheet 92) → Coordinate Plane · Patterns & intro to slope (sheet 93)
- **print-fitness** · **addressed** (PRE_ALGEBRA)
- Evidence: Sheet 93: 'Each step grows by the same amount (the "slope"). What is the step for: 1, 3, 5, 7?' ⟨long prompt⟩ printed verbatim 8 times on one sheet; sheets 94–97, 99 are mostly this item.
- Why: The 70-character preamble wraps on every item and is repeated up to 20 times per sheet; the sheet reads as padding. The unit is titled 'Coordinate Plane' but no item uses the plane — the link to slope exists only as one line on the lesson page.
- Fix applied: Put the sentence once in the directive ('The step is the amount added each time — we call it the slope') and print the items as 'Step for 1, 3, 5, 7: ___'; add a few items where the sequence is given as plotted points (1,2),(2,5),(3,8) so the unit earns its title.

#### PRE_ALGEBRA: Coordinate Plane · Plot points (sheet 92) → Coordinate Plane · Patterns & intro to slope (sheet 93)
- **ramp** · **addressed** (PRE_ALGEBRA)
- Evidence: Ramp sheets 93–100: only two item types ('next number' and 'step'), steps 2–9, starting values ≤ 10; sheet 100 sample 'Find the next number: 3, 12, 21, 30 → 39'.
- Why: Eight sheets of arithmetic-sequence spotting with no progression beyond a slightly bigger step; decreasing sequences (negative slope) never appear even though integers were taught in unit 9.
- Fix applied: Add decreasing sequences (step −3) from sheet 96 and 'find the 10th term' or 'which rule: y = 3x + 2?' items by sheet 98.

#### LINEAR_EQUATIONS: Graph a line (sheet 8) → Transformations on the plane (sheet 9)
- **print-fitness** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Sheet 9: 24 grid items including 'Rotate the point (3, 2) 90° counterclockwise about the origin. Plot the image.' ⟨long prompt⟩ and 'Plot a triangle with vertices (1, 1), (4, 1), (1, 5). → 1,1;1,5;4,1 ⟨interactive:triangle-drag⟩'. Every translate item in the unit uses the same vector (2, −1).
- Why: Content and worked examples are correct (checked: (−2,3)→(−3,−2), (1,−4)→(4,1), (4,−2)→(2,4)) and drawable on paper, but 24 grids per sheet is heavy, the rotate prompt wraps, and the answer key '1,1;1,5;4,1' is unreadable for a parent. Translation by one fixed vector for four sheets is flat.
- Fix applied: Share grids (4 tasks per grid, lettered); print the key as coordinates in brackets; vary the translation vector.

#### LINEAR_EQUATIONS: Transformations on the plane (sheet 12) → Two-step equations (+) (sheet 13)
- **prereq-gap** · **addressed** (LINEAR_EQUATIONS)
- Evidence: Sheet 13 first item 'Solve for x: 4x + 1 = 9'; nothing earlier in this pack (units 1–3 are all plotting/transformations) solves any equation, one-step or otherwise.
- Why: The lesson page does explain both moves ('Subtract 1 on BOTH sides … divide BOTH sides by 4') with a check, so a diligent child can follow, but a child who has never solved x + 1 = 9 is starting two-step cold after three units of geometry. The unit order is also odd (graphing before any equation solving).
- Fix applied: Either move units 1–3 to the end of the pack (after mixed review) or add a short one-step equations unit before sheet 13; at minimum add the one-step example 'x + 3 = 11 → x = 8' to the lesson page.

#### LINEAR_EQUATIONS: Variables on both sides (sheet 72) → Equations with a fraction (sheet 73)
- **ramp** · **addressed** (LINEAR_EQUATIONS)
- Evidence: After 18 sheets of '7x + 10 = 4x + 40' (5-star), sheet 73 drops to 'x/2 = 1 → 2', 'x/3 = 1', 'x/4 = 1', 'x/5 = 1'; the whole 14-sheet unit stays at 'x/d = q' with q ≤ 15, never 'x/d + b = c' or '2x/3 = 8'.
- Why: The unit regresses to one-step and then stays flat for 14 days; the child gets no bridge from this to a real fraction equation.
- Fix applied: Shorten to 4 sheets of x/d = q, then add x/d + b = c and (x + b)/d = c with lesson-page examples.
