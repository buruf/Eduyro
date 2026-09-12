# Video sync audit — 168 units, 675 scenes

Hard failures: **42** · scenes without word alignment: **50** (those cannot be synced to speech until re-narrated with timestamps)

## Hard failures

- sub-2d-borrow: mp4 is 32.8s, timeline says 31.4s — stale render
- sub-3d: mp4 is 34.3s, timeline says 35.3s — stale render
- add-fact-family: mp4 is 39.8s, timeline says 43.3s — stale render
- sub-fact-family: mp4 is 39.6s, timeline says 40.3s — stale render
- div-fact-family: mp4 is 40.1s, timeline says 40.9s — stale render
- cur-number-bonds: mp4 is 38.3s, timeline says 37.4s — stale render
- cur-identify-fractions: mp4 is 40.8s, timeline says 37.5s — stale render
- cur-graphing-lines: mp4 is 76.9s, timeline says 76.2s — stale render
- cur-end-behavior: mp4 is 55.4s, timeline says 51.3s — stale render
- cur-logarithms: mp4 is 41.4s, timeline says 42.0s — stale render
- cur-derivatives: mp4 is 42.8s, timeline says 45.0s — stale render
- cur-integrals: mp4 is 41.5s, timeline says 39.9s — stale render
- cur-evaluate-linear: mp4 is 48.3s, timeline says 51.2s — stale render
- cur-composition: mp4 is 53.5s, timeline says 55.3s — stale render
- cur-domain-range: mp4 is 64.8s, timeline says 64.2s — stale render
- cur-triangle-sides: mp4 is 54.1s, timeline says 55.7s — stale render
- cur-right-triangle-trig: mp4 is 59.7s, timeline says 62.1s — stale render
- cur-unit-circle-values: mp4 is 51.8s, timeline says 50.8s — stale render
- cur-add-poly: mp4 is 58.5s, timeline says 61.3s — stale render
- cur-multiply-poly: mp4 is 53.5s, timeline says 58.7s — stale render
- cur-factoring: mp4 is 54.1s, timeline says 50.8s — stale render
- cur-factor-trinomial-a: mp4 is 74.5s, timeline says 83.9s — stale render
- cur-difference-squares: mp4 is 64.8s, timeline says 63.7s — stale render
- cur-cubes: mp4 is 83.2s, timeline says 84.4s — stale render
- cur-discriminant: mp4 is 73.2s, timeline says 68.1s — stale render
- cur-two-step-minus: mp4 is 72.0s, timeline says 66.7s — stale render
- cur-fraction-equation: mp4 is 58.1s, timeline says 59.8s — stale render
- cur-transformations: mp4 is 77.2s, timeline says 76.3s — stale render
- cur-integer-add-sub: mp4 is 57.6s, timeline says 58.3s — stale render
- cur-poly-anatomy: mp4 is 70.1s, timeline says 66.8s — stale render
- cur-subtract-poly: mp4 is 60.9s, timeline says 62.5s — stale render
- cur-distribute-monomial: mp4 is 64.5s, timeline says 71.4s — stale render
- cur-long-division: mp4 is 67.8s, timeline says 64.0s — stale render
- cur-order-fractions: mp4 is 42.6s, timeline says 44.4s — stale render
- cur-divide-by-whole: mp4 is 42.5s, timeline says 44.6s — stale render
- cur-order-ops: mp4 is 54.7s, timeline says 54.2s — stale render
- cur-complex: mp4 is 49.6s, timeline says 52.1s — stale render
- cur-vectors: mp4 is 50.0s, timeline says 49.3s — stale render
- cur-diff-monomials: mp4 is 44.4s, timeline says 42.6s — stale render
- cur-rational-root: mp4 is 59.5s, timeline says 61.5s — stale render
- cur-exponential-equations: mp4 is 47.3s, timeline says 48.8s — stale render
- cur-integrate-powers: mp4 is 60.2s, timeline says 61.5s — stale render

## Rendered MP4 vs audio timeline

| unit | mp4 s | timeline s | |
|---|---|---|---|
| mul-skip | 33.9 | 33.9 | ok |
| mul-3-4 | 34.4 | 34.4 | ok |
| mul-tens | 30.6 | 30.6 | ok |
| mul-identity | 35.0 | 35.1 | ok |
| mul-squares | 34.4 | 34.4 | ok |
| mul-6-9 | 33.1 | 33.1 | ok |
| mul-10-12 | 30.9 | 30.9 | ok |
| add-2d-noregroup | 26.9 | 27.0 | ok |
| add-2d-regroup | 39.3 | 39.4 | ok |
| sub-2d-noborrow | 27.5 | 27.6 | ok |
| sub-2d-borrow | 32.8 | 31.4 | STALE |
| add-3d-three | 39.2 | 39.3 | ok |
| sub-3d | 34.3 | 35.3 | STALE |
| add-count-on | 25.0 | 25.0 | ok |
| add-doubles | 25.7 | 25.7 | ok |
| add-zero-comm | 27.2 | 27.2 | ok |
| add-near-doubles | 25.6 | 25.6 | ok |
| add-make-ten | 25.9 | 26.0 | ok |
| sub-count-back | 25.0 | 25.0 | ok |
| sub-count-up | 30.5 | 30.6 | ok |
| sub-zero | 25.0 | 25.0 | ok |
| sub-halves | 25.7 | 25.7 | ok |
| sub-bridge | 25.0 | 25.0 | ok |
| cur-add-within-5 | 25.0 | 25.0 | ok |
| cur-add-within-10 | 25.0 | 25.0 | ok |
| div-skip | 37.4 | 37.5 | ok |
| div-identity | 35.1 | 35.2 | ok |
| div-squares | 37.4 | 37.5 | ok |
| div-3-4 | 37.5 | 37.7 | ok |
| div-6-9 | 38.0 | 38.1 | ok |
| div-10-12 | 36.4 | 36.5 | ok |
| div-remainder | 44.4 | 44.5 | ok |
| div-larger | 33.6 | 33.6 | ok |
| add-fact-family | 39.8 | 43.3 | STALE |
| sub-fact-family | 39.6 | 40.3 | STALE |
| mul-fact-family | 38.8 | 38.9 | ok |
| div-fact-family | 40.1 | 40.9 | STALE |
| cur-number-bonds | 38.3 | 37.4 | STALE |
| mul-break-apart | 32.1 | 32.1 | ok |
| mul-carry | 32.3 | 32.4 | ok |
| mul-2d1d | 32.0 | 32.1 | ok |
| mul-2d2d | 41.2 | 41.3 | ok |
| cur-identify-fractions | 40.8 | 37.5 | STALE |
| cur-compare-fractions | 30.6 | 30.6 | ok |
| cur-add-fractions | 36.1 | 36.2 | ok |
| cur-simplify-fractions | 36.7 | 36.7 | ok |
| cur-decimal-place-value | 36.5 | 36.7 | ok |
| cur-decimal-operations | 33.7 | 33.7 | ok |
| cur-decimal-subtract | 33.2 | 33.3 | ok |
| cur-decimal-multiply | 30.9 | 30.9 | ok |
| cur-percentages | 33.8 | 33.8 | ok |
| cur-ratios | 30.4 | 30.5 | ok |
| cur-proportions | 31.6 | 31.7 | ok |
| cur-unit-rates | 30.4 | 30.5 | ok |
| cur-one-step | 33.7 | 33.8 | ok |
| cur-two-step | 36.2 | 36.3 | ok |
| cur-inequalities | 38.0 | 38.1 | ok |
| cur-graphing-lines | 76.9 | 76.2 | STALE |
| cur-slope-intercept | 74.9 | 75.2 | ok |
| cur-systems | 78.6 | 78.9 | ok |
| cur-graphing-parabolas | 52.2 | 52.4 | ok |
| cur-quadratic-range | 47.4 | 47.5 | ok |
| cur-end-behavior | 55.4 | 51.3 | STALE |
| cur-quadratic-equations | 42.0 | 42.1 | ok |
| cur-quadratic-formula | 38.8 | 39.0 | ok |
| cur-exponential | 44.6 | 44.5 | ok |
| cur-logarithms | 41.4 | 42.0 | STALE |
| cur-limits | 49.0 | 49.1 | ok |
| cur-derivatives | 42.8 | 45.0 | STALE |
| cur-integrals | 41.5 | 39.9 | STALE |
| cur-function-notation | 61.2 | 61.4 | ok |
| cur-evaluate-linear | 48.3 | 51.2 | STALE |
| cur-composition | 53.5 | 55.3 | STALE |
| cur-inverse-functions | 56.2 | 56.7 | ok |
| cur-domain-range | 64.8 | 64.2 | STALE |
| cur-domain-rational | 54.4 | 54.5 | ok |
| cur-pythagorean | 47.3 | 47.4 | ok |
| cur-triangle-sides | 54.1 | 55.7 | STALE |
| cur-right-triangle-trig | 59.7 | 62.1 | STALE |
| cur-pyth-identity | 56.8 | 57.0 | ok |
| cur-unit-circle | 55.9 | 55.7 | ok |
| cur-unit-circle-values | 51.8 | 50.8 | STALE |
| cur-deg-radians | 55.4 | 55.7 | ok |
| cur-trig-identities | 54.3 | 54.5 | ok |
| cur-classify-poly | 58.5 | 58.7 | ok |
| cur-add-poly | 58.5 | 61.3 | STALE |
| cur-multiply-poly | 53.5 | 58.7 | STALE |
| cur-factoring | 54.1 | 50.8 | STALE |
| cur-factor-trinomial-a | 74.5 | 83.9 | STALE |
| cur-difference-squares | 64.8 | 63.7 | STALE |
| cur-perfect-square-trinomial | 65.2 | 65.4 | ok |
| cur-factor-grouping | 72.5 | 72.4 | ok |
| cur-cubes | 83.2 | 84.4 | STALE |
| cur-perfect-squares | 54.8 | 55.0 | ok |
| cur-solve-x2-k | 55.9 | 56.0 | ok |
| cur-simplify-roots | 55.1 | 55.3 | ok |
| cur-zero-product | 62.7 | 62.9 | ok |
| cur-solve-factoring | 58.9 | 59.1 | ok |
| cur-discriminant | 73.2 | 68.1 | STALE |
| cur-two-step-minus | 72.0 | 66.7 | STALE |
| cur-distribute-equation | 69.6 | 69.3 | ok |
| cur-both-sides | 65.3 | 65.5 | ok |
| cur-fraction-equation | 58.1 | 59.8 | STALE |
| cur-transformations | 77.2 | 76.3 | STALE |
| cur-evaluate-expr | 59.2 | 59.4 | ok |
| cur-evaluate-product | 47.7 | 47.9 | ok |
| cur-like-terms | 57.7 | 57.8 | ok |
| cur-distribute | 62.4 | 62.6 | ok |
| cur-one-step-times | 50.5 | 50.6 | ok |
| cur-integer-add-sub | 57.6 | 58.3 | STALE |
| cur-poly-anatomy | 70.1 | 66.8 | STALE |
| cur-evaluate-poly | 55.2 | 55.4 | ok |
| cur-subtract-poly | 60.9 | 62.5 | STALE |
| cur-monomial-multiply | 58.5 | 58.7 | ok |
| cur-divide-monomial | 55.7 | 55.9 | ok |
| cur-factor-gcf | 60.0 | 60.5 | ok |
| cur-distribute-monomial | 64.5 | 71.4 | STALE |
| cur-long-division | 67.8 | 64.0 | STALE |
| cur-subtract-fractions | 38.2 | 38.3 | ok |
| cur-multiply-fractions | 43.3 | 43.5 | ok |
| cur-divide-fractions | 39.8 | 40.0 | ok |
| cur-mixed-numbers | 40.1 | 40.3 | ok |
| cur-improper-fractions | 36.3 | 36.4 | ok |
| cur-order-fractions | 42.6 | 44.4 | STALE |
| cur-compare-decimals | 38.9 | 39.1 | ok |
| cur-round-decimals | 40.2 | 40.3 | ok |
| cur-multiply-decimals | 39.4 | 39.5 | ok |
| cur-divide-decimals | 38.1 | 38.6 | ok |
| cur-add-subtract-decimals | 63.9 | 64.1 | ok |
| cur-divide-by-whole | 42.5 | 44.6 | STALE |
| cur-percent-of | 37.2 | 37.3 | ok |
| cur-percent-change | 37.0 | 37.1 | ok |
| cur-place-value-tens | 33.6 | 33.7 | ok |
| cur-place-value-ones | 32.1 | 32.2 | ok |
| cur-compare-2digit | 36.5 | 36.6 | ok |
| cur-skip-2 | 34.8 | 34.9 | ok |
| cur-skip-10 | 32.7 | 32.8 | ok |
| cur-numbers-before | 27.3 | 27.3 | ok |
| cur-order-integers | 46.7 | 46.9 | ok |
| cur-order-ops | 54.7 | 54.2 | STALE |
| cur-complex | 49.6 | 52.1 | STALE |
| cur-sequences | 47.7 | 47.3 | ok |
| cur-vectors | 50.0 | 49.3 | STALE |
| cur-power-rule | 48.7 | 49.1 | ok |
| cur-diff-monomials | 44.4 | 42.6 | STALE |
| cur-calc-applications | 47.1 | 47.1 | ok |
| cur-y-intercept | 54.8 | 55.0 | ok |
| cur-multiplicity | 57.0 | 56.9 | ok |
| cur-turning-points | 49.3 | 49.5 | ok |
| cur-fta | 54.3 | 54.5 | ok |
| cur-synthetic | 56.1 | 56.3 | ok |
| cur-rational-root | 59.5 | 61.5 | STALE |
| cur-exponential-equations | 47.3 | 48.8 | STALE |
| cur-powers-of-i | 57.5 | 57.7 | ok |
| cur-geometric | 52.9 | 53.1 | ok |
| cur-limit-poly | 54.8 | 55.0 | ok |
| cur-integrate-powers | 60.2 | 61.5 | STALE |
| cur-counting-1-10 | 28.7 | 28.7 | ok |
| cur-counting-1-50 | 34.2 | 34.3 | ok |
| cur-counting-100 | 34.6 | 34.7 | ok |
| cur-number-recognition | 26.0 | 26.0 | ok |
| cur-which-greater | 26.4 | 26.5 | ok |
| cur-which-less | 25.0 | 25.0 | ok |
| cur-more-less | 28.0 | 28.1 | ok |
| cur-counting-on-next | 27.2 | 27.2 | ok |
| cur-numbers-after-100 | 29.5 | 29.6 | ok |
| cur-missing-number | 26.9 | 26.9 | ok |
| cur-number-patterns | 28.6 | 28.7 | ok |

## Every scene — when each number is spoken (seconds into the scene)

Reveals inside a scene fire at hand-picked frames; compare them to these moments. "tail" is silence after the clip ends.


### mul-skip (EqualGroups)
- **ask** · scene 4.00s, clip 3.161s, tail 0.84s · 5@1.22s  6@1.79s
  - "So… what does 5 × 6 actually mean?"
- **groups** · scene 8.00s, clip 5.564s, tail 2.44s · 6@0.70s  5@1.47s  5@3.51s
  - "It means 6 groups of 5. Let's put them out… one group of 5. And another. Keep going."
- **count** · scene 12.90s, clip 12.095s, tail 0.80s · 5@1.44s  10@1.81s  15@2.10s  20@2.58s  25@2.89s  30@3.44s  5@4.41s  5@5.08s  5@5.63s  5@6.08s  5@6.58s  5@7.07s  30@8.29s  5@9.25s  6@9.87s
  - "Now count them up… 5, 10, 15, 20, 25, 30. So that's 5 + 5 + 5 + 5 + 5 + 5, which is 30. And 5 × 6 means exactly the same thing."
- **trick** · scene 9.00s, clip 7.758s, tail 1.24s · 5@3.62s  6@5.04s
  - "So you don't have to count every one. Just skip count by 5s, and the 6th number you land on is the answer."

### mul-3-4 (EqualGroups)
- **ask** · scene 4.00s, clip 3.056s, tail 0.94s · 4@1.30s  7@1.76s
  - "So… what does 4 × 7 actually mean?"
- **groups** · scene 8.00s, clip 5.851s, tail 2.15s · 7@0.87s  4@1.83s  4@3.79s
  - "It means 7 groups of 4. Let's put them out… one group of 4. And another. Keep going."
- **count** · scene 13.43s, clip 12.643s, tail 0.79s · 4@1.46s  8@2.09s  12@2.42s  16@2.82s  20@3.59s  24@4.17s  28@4.97s  4@6.12s  7@7.29s  28@8.42s  4@9.69s  7@10.32s
  - "Now count them up… 4, 8, 12, 16, 20, 24, 28. So that's 4, added 7 times, which is 28. And 4 × 7 means exactly the same thing."
- **trick** · scene 9.00s, clip 6.687s, tail 2.31s · 7@3.20s  14@3.98s  14@4.76s  28@5.77s
  - "Here's a shortcut. Double it, then double again. 7 doubled is 14, and 14 doubled is 28."

### mul-tens (EqualGroups)
- **ask** · scene 4.00s, clip 3.056s, tail 0.94s · 20@1.25s  3@1.87s
  - "So… what does 20 × 3 actually mean?"
- **groups** · scene 8.00s, clip 5.695s, tail 2.30s · 3@0.69s  20@1.41s  20@3.46s
  - "It means 3 groups of 20. Let's put them out… one group of 20. And another. Keep going."
- **count** · scene 9.00s, clip 7.706s, tail 1.29s · 20@1.20s  40@1.52s  60@1.86s  20@2.75s  20@3.26s  20@3.71s  60@4.39s  20@5.16s  3@5.76s
  - "Now count them up… 20, 40, 60. So that's 20 + 20 + 20, which is 60. And 20 × 3 means exactly the same thing."
- **trick** · scene 9.60s, clip 8.803s, tail 0.80s · 2@2.95s  3@3.53s  6@3.90s  60@6.00s
  - "But here's a faster way. Cover up the zero… 2 × 3 is 6. Now put the zero back on… 60. Same answer, much quicker."

### mul-identity (EqualGroups)
- **ask** · scene 4.00s, clip 3.004s, tail 1.00s · 1@1.13s  7@1.63s
  - "So… what does 1 × 7 actually mean?"
- **groups** · scene 8.00s, clip 5.747s, tail 2.25s · 7@0.84s  1@1.71s  1@3.85s
  - "It means 7 groups of 1. Let's put them out… one group of 1. And another. Keep going."
- **count** · scene 10.17s, clip 9.378s, tail 0.79s · 1@1.30s  2@1.64s  3@1.95s  4@2.29s  5@2.59s  6@2.90s  7@3.23s  1@4.38s  7@5.00s  7@6.00s  1@6.70s  7@7.23s
  - "Now count them up… 1, 2, 3, 4, 5, 6, 7. So that's 1, added 7 times, which is 7. And 1 × 7 means exactly the same thing."
- **trick** · scene 12.90s, clip 12.095s, tail 0.80s · 1@1.65s  1@6.72s  0@11.21s
  - "Every group has just 1 in it, so you end up with exactly what you started with. That's why anything times 1 is itself. And if there were no "

### mul-squares (EqualGroups)
- **ask** · scene 4.00s, clip 3.004s, tail 1.00s · 6@1.13s  6@1.67s
  - "So… what does 6 × 6 actually mean?"
- **groups** · scene 8.00s, clip 6.087s, tail 1.91s · 6@0.78s  6@1.52s  6@3.91s
  - "It means 6 groups of 6. Let's put them out… one group of 6. And another. Keep going."
- **count** · scene 13.43s, clip 12.643s, tail 0.79s · 6@1.30s  12@1.65s  18@2.04s  24@2.66s  30@3.32s  36@3.77s  6@4.88s  6@5.48s  6@6.06s  6@6.57s  6@7.07s  6@7.51s  36@8.09s  6@9.61s  6@10.29s
  - "Now count them up… 6, 12, 18, 24, 30, 36. So that's 6 + 6 + 6 + 6 + 6 + 6, which is 36. And 6 × 6 means exactly the same thing."
- **trick** · scene 9.00s, clip 6.504s, tail 2.50s · 6@3.89s  6@4.46s  6@5.27s
  - "When the two numbers match, the groups make a perfect square. That's why 6 × 6 is called 6 squared."

### mul-6-9 (EqualGroups)
- **ask** · scene 4.00s, clip 2.952s, tail 1.05s · 6@1.20s  7@1.66s
  - "So… what does 6 × 7 actually mean?"
- **groups** · scene 8.00s, clip 5.799s, tail 2.20s · 7@0.73s  6@1.47s  6@3.70s
  - "It means 7 groups of 6. Let's put them out… one group of 6. And another. Keep going."
- **count** · scene 11.23s, clip 10.449s, tail 0.78s · 6@1.42s  12@1.79s  18@2.13s  24@2.71s  30@3.25s  36@3.63s  42@4.14s  6@5.19s  7@5.99s  42@7.04s  6@7.89s  7@8.35s
  - "Now count them up… 6, 12, 18, 24, 30, 36, 42. So that's 6, added 7 times, which is 42. And 6 × 7 means exactly the same thing."
- **trick** · scene 9.90s, clip 9.091s, tail 0.81s · 7@2.11s  5@2.87s  35@3.40s  7@4.26s  42@5.19s
  - "Here's the trick for the hard ones. 7 × 5 is 35, and 7 more makes 42. Break it into a five you know, plus the rest."

### mul-10-12 (EqualGroups)
- **ask** · scene 4.00s, clip 2.952s, tail 1.05s · 12@1.15s  4@1.71s
  - "So… what does 12 × 4 actually mean?"
- **groups** · scene 8.00s, clip 5.851s, tail 2.15s · 4@0.72s  12@1.38s  12@3.50s
  - "It means 4 groups of 12. Let's put them out… one group of 12. And another. Keep going."
- **count** · scene 9.93s, clip 9.143s, tail 0.79s · 12@1.29s  24@1.67s  36@2.14s  48@2.65s  12@3.58s  12@4.14s  12@4.74s  12@5.25s  48@5.84s  12@6.47s  4@7.07s
  - "Now count them up… 12, 24, 36, 48. So that's 12 + 12 + 12 + 12, which is 48. And 12 × 4 means exactly the same thing."
- **trick** · scene 9.00s, clip 6.087s, tail 2.91s · 12@0.58s  4@1.15s  10@1.68s  40@2.11s  4@2.82s  2@3.35s  8@3.66s  48@5.12s
  - "Split the 12. 4 × 10 is 40, and 4 × 2 is 8. Put them together… 48."

### add-2d-noregroup (Column)
- **ask** · scene 4.00s, clip 3.056s, tail 0.94s · 34@0.00s  25@0.88s
  - "34 plus 25. Let's build it out of blocks."
- **build** · scene 6.00s, clip 4.545s, tail 1.46s · 34@0.00s  3@0.86s  4@1.57s  25@2.31s  2@2.94s  5@3.56s
  - "34 is 3 tens and 4 ones. And 25 is 2 tens and 5 ones."
- **regroup** · scene 10.00s, clip 8.908s, tail 1.09s · 4@1.97s  5@2.44s  9@2.96s  3@6.94s  2@7.35s  5@7.93s
  - "Now put all the ones together… 4 and 5 is 9. That's under ten, so nothing has to move. And the tens… 3 and 2 is 5."
- **written** · scene 6.97s, clip 6.165s, tail 0.80s · 34@3.40s  25@4.21s  59@5.03s
  - "So when you write it down, the columns just add straight down. 34 plus 25 is 59."

### add-2d-regroup (Column)
- **ask** · scene 4.00s, clip 3.187s, tail 0.81s · 37@0.00s  45@1.02s
  - "37 plus 45. Let's build it out of blocks."
- **build** · scene 6.00s, clip 4.963s, tail 1.04s · 37@0.00s  3@1.08s  7@1.73s  45@2.63s  4@3.29s  5@3.87s
  - "37 is 3 tens and 7 ones. And 45 is 4 tens and 5 ones."
- **regroup** · scene 21.03s, clip 20.219s, tail 0.81s · 7@2.30s  5@2.80s  12@3.32s  12@5.07s  1@13.16s  2@18.45s
  - "Now put all the ones together… 7 and 5 is 12. But you can't leave 12 ones in the ones column. So take ten of them… and snap them into one te"
- **written** · scene 8.33s, clip 7.523s, tail 0.81s · 1@1.94s  37@4.57s  45@5.71s  82@6.55s
  - "So when you write it down, that little 1 above the tens is the ten you just made. 37 plus 45 is 82."

### sub-2d-noborrow (Column)
- **ask** · scene 4.37s, clip 3.579s, tail 0.79s · 58@0.00s  23@1.21s
  - "58 take away 23. Let's build it out of blocks."
- **build** · scene 6.00s, clip 4.023s, tail 1.98s · 58@0.00s  5@1.02s  8@1.82s
  - "58 is 5 tens and 8 ones. That's what we're taking from."
- **regroup** · scene 10.00s, clip 7.288s, tail 2.71s · 3@0.94s  8@2.15s  5@4.53s
  - "Now take away 3 ones. There are 8 up there, so that one's easy… 5 left. Nothing has to be broken apart."
- **written** · scene 7.20s, clip 6.4s, tail 0.80s · 58@3.61s  23@4.67s  35@5.35s
  - "So when you write it down, each column just subtracts straight down. 58 take away 23 is 35."

### sub-2d-borrow (Column)
- **ask** · scene 4.33s, clip 3.527s, tail 0.81s · 52@0.00s  27@1.22s
  - "52 take away 27. Let's build it out of blocks."
- **build** · scene 6.00s, clip 3.892s, tail 2.11s · 52@0.00s  5@0.88s  2@1.65s
  - "52 is 5 tens and 2 ones. That's what we're taking from."
- **regroup** · scene 13.77s, clip 12.983s, tail 0.78s · 7@1.09s  2@3.31s  12@9.94s  7@11.24s  5@11.83s
  - "Now take away 7 ones. But look… there are only 2 up there. Not enough. So go next door and borrow a ten… and break it apart into ten ones. N"
- **written** · scene 7.30s, clip 6.504s, tail 0.80s · 52@3.60s  27@4.66s  25@5.43s
  - "So when you write it down, that crossed-out ten is the one you broke apart. 52 take away 27 is 25."

### add-3d-three (Column)
- **ask** · scene 4.27s, clip 3.474s, tail 0.79s · 248@0.00s  167@1.00s
  - "248 plus 167. Let's build it out of blocks."
- **build** · scene 6.00s, clip 5.094s, tail 0.91s · 248@0.00s  24@0.85s  8@1.68s  167@2.45s  16@3.34s  7@4.20s
  - "248 is 24 tens and 8 ones. And 167 is 16 tens and 7 ones."
- **regroup** · scene 19.83s, clip 19.017s, tail 0.82s · 8@2.40s  7@2.94s  15@3.53s  15@5.56s  1@12.31s  5@17.37s
  - "Now put all the ones together… 8 and 7 is 15. But you can't leave 15 ones in the ones column. So take ten of them… and snap them into one te"
- **written** · scene 9.23s, clip 8.438s, tail 0.80s · 1@1.85s  248@4.71s  167@5.94s  415@7.17s
  - "So when you write it down, that little 1 above the tens is the ten you just made. 248 plus 167 is 415."

### sub-3d (Column)
- **ask** · scene 4.57s, clip 3.762s, tail 0.80s · 342@0.00s  158@1.35s
  - "342 take away 158. Let's build it out of blocks."
- **build** · scene 6.00s, clip 4.258s, tail 1.74s · 342@0.00s  34@1.15s  2@2.11s
  - "342 is 34 tens and 2 ones. That's what we're taking from."
- **regroup** · scene 16.37s, clip 15.569s, tail 0.80s · 8@1.08s  2@3.95s  12@12.05s  8@13.34s  4@13.79s
  - "Now take away 8 ones. But look… there are only 2 up there. Not enough. So go next door and borrow a ten… and break it apart into ten ones. N"
- **written** · scene 8.33s, clip 7.523s, tail 0.81s · 342@3.87s  158@5.13s  184@6.26s
  - "So when you write it down, that crossed-out ten is the one you broke apart. 342 take away 158 is 184."

### add-count-on (TenFrame)
- **ask** · scene 4.00s, clip 2.351s, tail 1.65s · 7@0.00s  2@0.84s
  - "7 plus 2. Let's use a ten-frame."
- **build** · scene 6.00s, clip 4.206s, tail 1.79s · 7@0.51s  2@2.57s
  - "Here's 7 in the frame. And here are the other 2, waiting underneath."
- **strategy** · scene 9.00s, clip 3.109s, tail 5.89s · 7@0.65s  8@1.88s  9@2.39s
  - "Start at 7… and just count on. 8… 9."
- **record** · scene 6.00s, clip 4.023s, tail 1.98s · 7@0.40s  2@0.96s  9@1.33s
  - "So 7 plus 2 is 9. Start at the big number and count on."

### add-doubles (TenFrame)
- **ask** · scene 4.00s, clip 2.456s, tail 1.54s · 6@0.00s  6@0.72s
  - "6 plus 6. Let's use a ten-frame."
- **build** · scene 6.00s, clip 3.892s, tail 2.11s · 6@0.51s  6@2.24s
  - "Here's 6 in the frame. And here are the other 6, waiting underneath."
- **strategy** · scene 9.67s, clip 8.856s, tail 0.81s · 4@0.88s  4@2.98s  2@6.26s  10@7.29s  2@7.71s  12@8.03s
  - "The frame has 4 empty spaces. So slide 4 across… and the ten is full. That leaves 2. 10 and 2 is 12."
- **record** · scene 6.00s, clip 3.788s, tail 2.21s · 6@0.45s  6@1.04s  12@1.53s
  - "So 6 plus 6 is 12. Doubles are worth just knowing."

### add-zero-comm (TenFrame)
- **ask** · scene 4.00s, clip 2.586s, tail 1.41s · 3@0.00s  8@0.89s
  - "3 plus 8. Let's use a ten-frame."
- **build** · scene 6.00s, clip 4.493s, tail 1.51s · 3@0.52s  8@2.59s
  - "Here's 3 in the frame. And here are the other 8, waiting underneath."
- **strategy** · scene 10.43s, clip 9.639s, tail 0.79s · 3@0.00s  8@0.73s  8@3.26s  3@3.63s  11@6.90s
  - "3 and 8. Now watch — swap them round. 8 and 3. Same dots, just the other way about… still 11. So if you know one, you know the other."
- **record** · scene 6.77s, clip 5.982s, tail 0.78s · 3@0.43s  8@0.92s  11@1.31s  3@3.35s  8@3.84s  8@4.81s  3@5.31s
  - "So 3 plus 8 is 11. Swap them round — 3 + 8 is the same as 8 + 3."

### add-near-doubles (TenFrame)
- **ask** · scene 4.00s, clip 2.638s, tail 1.36s · 6@0.00s  7@0.84s
  - "6 plus 7. Let's use a ten-frame."
- **build** · scene 6.00s, clip 4.075s, tail 1.92s · 6@0.53s  7@2.38s
  - "Here's 6 in the frame. And here are the other 7, waiting underneath."
- **strategy** · scene 9.57s, clip 8.777s, tail 0.79s · 4@0.82s  4@2.52s  3@6.18s  10@6.97s  3@7.44s  13@7.85s
  - "The frame has 4 empty spaces. So slide 4 across… and the ten is full. That leaves 3. 10 and 3 is 13."
- **record** · scene 6.00s, clip 4.415s, tail 1.58s · 6@0.43s  7@0.82s  13@1.18s  6@1.73s  6@2.13s  12@2.48s  13@3.59s
  - "So 6 plus 7 is 13. 6 + 6 is 12, so one more is 13."

### add-make-ten (TenFrame)
- **ask** · scene 4.00s, clip 2.638s, tail 1.36s · 8@0.00s  5@0.71s
  - "8 plus 5. Let's use a ten-frame."
- **build** · scene 6.00s, clip 4.075s, tail 1.92s · 8@0.52s  5@2.32s
  - "Here's 8 in the frame. And here are the other 5, waiting underneath."
- **strategy** · scene 10.00s, clip 9.195s, tail 0.80s · 2@0.87s  2@2.63s  3@6.34s  10@7.12s  3@7.64s  13@8.12s
  - "The frame has 2 empty spaces. So slide 2 across… and the ten is full. That leaves 3. 10 and 3 is 13."
- **record** · scene 6.00s, clip 3.762s, tail 2.24s · 8@0.36s  5@0.72s  13@1.10s
  - "So 8 plus 5 is 13. Fill the ten, then add what's left."

### sub-count-back (TenFrame)
- **ask** · scene 4.00s, clip 2.534s, tail 1.47s · 9@0.00s  2@0.91s
  - "9 take away 2. Let's use a ten-frame."
- **build** · scene 6.00s, clip 2.351s, tail 3.65s · 9@0.45s
  - "Here's 9… filling up the frame."
- **strategy** · scene 9.00s, clip 2.821s, tail 6.18s · 9@0.58s  8@1.79s  7@2.17s
  - "Start at 9… and count back. 8… 7."
- **record** · scene 6.00s, clip 3.997s, tail 2.00s · 9@0.48s  2@1.33s  7@1.67s
  - "So 9 take away 2 is 7. Small numbers off? Just count back."

### sub-count-up (TenFrame)
- **ask** · scene 4.00s, clip 2.821s, tail 1.18s · 13@0.00s  8@1.20s
  - "13 take away 8. Let's use a ten-frame."
- **build** · scene 6.00s, clip 3.709s, tail 2.29s · 8@2.61s
  - "This time, start with the smaller number. Here's 8 in the frame."
- **strategy** · scene 14.57s, clip 13.767s, tail 0.80s · 8@1.01s  8@3.85s  13@4.46s  9@6.48s  10@7.55s  11@8.42s  12@8.96s  13@9.52s  5@11.30s
  - "Instead of taking 8 away one by one, ask how far it is from 8 up to 13. Add one… 9… 10… 11… 12… 13. Count what you added — 5. That's the gap"
- **record** · scene 6.00s, clip 4.963s, tail 1.04s · 13@0.42s  8@1.51s  5@1.94s
  - "So 13 take away 8 is 5. When the numbers are close, count up instead."

### sub-zero (TenFrame)
- **ask** · scene 4.00s, clip 2.821s, tail 1.18s · 7@0.00s  7@0.93s
  - "7 take away 7. Let's use a ten-frame."
- **build** · scene 6.00s, clip 2.351s, tail 3.65s · 7@0.51s
  - "Here's 7… filling up the frame."
- **strategy** · scene 9.00s, clip 3.997s, tail 5.00s · 7@0.66s
  - "Take all 7 of them off… and there's nothing left. Zero."
- **record** · scene 6.00s, clip 4.31s, tail 1.69s · 7@0.36s  7@1.16s  0@1.59s
  - "So 7 take away 7 is 0. Take away everything and nothing is left."

### sub-halves (TenFrame)
- **ask** · scene 4.00s, clip 2.691s, tail 1.31s · 12@0.00s  6@0.96s
  - "12 take away 6. Let's use a ten-frame."
- **build** · scene 6.00s, clip 2.821s, tail 3.18s · 12@0.57s  2@1.99s
  - "Here's 12… a full ten, and 2 more."
- **strategy** · scene 9.00s, clip 7.131s, tail 1.87s · 12@0.00s  2@1.23s  2@2.35s  10@4.37s  4@5.11s  6@6.26s
  - "12 is a ten and 2 more. Take those 2 off first… and we're down to 10. Now 4 more to go… 6."
- **record** · scene 6.67s, clip 5.878s, tail 0.79s · 12@0.37s  6@1.23s  6@1.68s  6@2.42s  6@2.97s  12@3.37s  12@3.92s  6@4.64s  6@5.05s
  - "So 12 take away 6 is 6. 6 + 6 is 12, so 12 take away 6 is 6."

### sub-bridge (TenFrame)
- **ask** · scene 4.00s, clip 2.952s, tail 1.05s · 15@0.00s  7@1.13s
  - "15 take away 7. Let's use a ten-frame."
- **build** · scene 6.00s, clip 2.769s, tail 3.23s · 15@0.48s  5@1.90s
  - "Here's 15… a full ten, and 5 more."
- **strategy** · scene 9.00s, clip 7.549s, tail 1.45s · 15@0.00s  5@1.51s  5@2.74s  10@4.88s  2@5.75s  8@6.88s
  - "15 is a ten and 5 more. Take those 5 off first… and we're down to 10. Now 2 more to go… 8."
- **record** · scene 6.00s, clip 4.676s, tail 1.32s · 15@0.44s  7@1.49s  8@2.00s  10@2.81s
  - "So 15 take away 7 is 8. Go down to 10 first, then take the rest."

### cur-add-within-5 (TenFrame)
- **ask** · scene 4.00s, clip 2.403s, tail 1.60s · 3@0.00s  2@0.70s
  - "3 plus 2. Let's use a ten-frame."
- **build** · scene 6.00s, clip 4.18s, tail 1.82s · 3@0.50s  2@2.63s
  - "Here's 3 in the frame. And here are the other 2, waiting underneath."
- **strategy** · scene 9.00s, clip 2.926s, tail 6.07s · 3@0.72s  4@1.85s  5@2.21s
  - "Start at 3… and just count on. 4… 5."
- **record** · scene 6.00s, clip 3.892s, tail 2.11s · 3@0.40s  2@0.87s  5@1.25s
  - "So 3 plus 2 is 5. Start at the bigger number and count on."

### cur-add-within-10 (TenFrame)
- **ask** · scene 4.00s, clip 2.325s, tail 1.67s · 6@0.00s  3@0.76s
  - "6 plus 3. Let's use a ten-frame."
- **build** · scene 6.00s, clip 3.997s, tail 2.00s · 6@0.49s  3@2.35s
  - "Here's 6 in the frame. And here are the other 3, waiting underneath."
- **strategy** · scene 9.00s, clip 3.187s, tail 5.81s · 6@0.63s  7@1.72s  8@2.13s  9@2.58s
  - "Start at 6… and just count on. 7… 8… 9."
- **record** · scene 6.00s, clip 4.023s, tail 1.98s · 6@0.42s  3@0.99s  9@1.41s
  - "So 6 plus 3 is 9. Start at the bigger number and count on."

### div-skip (Dealing)
- **ask** · scene 6.67s, clip 5.878s, tail 0.79s · 30@0.00s  5@1.30s
  - "30 divided by 5. There are two ways to picture this, and they both give the same answer."
- **deal** · scene 10.00s, clip 9.038s, tail 0.96s · 5@5.07s  6@8.22s
  - "First way — sharing. Deal them out, one at a time, like cards… onto 5 plates. Keep going… and everyone ends up with 6."
- **group** · scene 13.43s, clip 12.643s, tail 0.79s · 5@3.29s  30@5.25s  5@6.93s  6@10.81s
  - "Now the other way. Instead of sharing, ask how many 5s actually fit inside 30. Make a group of 5… and another… and count the groups. 6. Same"
- **record** · scene 7.37s, clip 6.583s, tail 0.78s · 30@0.45s  5@1.43s  6@1.85s  5@2.32s  6@2.97s  30@3.65s  30@4.23s  5@5.08s  6@5.77s
  - "So 30 divided by 5 is 6. 5 × 6 = 30, so 30 ÷ 5 = 6."

### div-identity (Dealing)
- **ask** · scene 6.37s, clip 5.564s, tail 0.80s · 7@0.00s  1@1.11s
  - "7 divided by 1. There are two ways to picture this, and they both give the same answer."
- **deal** · scene 10.13s, clip 9.326s, tail 0.81s · 7@8.58s
  - "First way — sharing. Deal them out, one at a time, like cards… onto one plate. Keep going… and everyone ends up with 7."
- **group** · scene 12.70s, clip 11.912s, tail 0.79s · 1@3.32s  7@5.07s  1@6.77s  7@10.04s
  - "Now the other way. Instead of sharing, ask how many 1s actually fit inside 7. Make a group of 1… and another… and count the groups. 7. Same "
- **record** · scene 6.00s, clip 4.31s, tail 1.69s · 7@0.53s  1@1.39s  7@1.75s  1@2.81s
  - "So 7 divided by 1 is 7. ÷1 changes nothing."

### div-squares (Dealing)
- **ask** · scene 6.53s, clip 5.747s, tail 0.79s · 36@0.00s  6@1.50s
  - "36 divided by 6. There are two ways to picture this, and they both give the same answer."
- **deal** · scene 10.00s, clip 8.542s, tail 1.46s · 6@5.04s  6@7.65s
  - "First way — sharing. Deal them out, one at a time, like cards… onto 6 plates. Keep going… and everyone ends up with 6."
- **group** · scene 13.03s, clip 12.225s, tail 0.81s · 6@3.34s  36@4.79s  6@6.93s  6@10.43s
  - "Now the other way. Instead of sharing, ask how many 6s actually fit inside 36. Make a group of 6… and another… and count the groups. 6. Same"
- **record** · scene 7.90s, clip 7.105s, tail 0.79s · 36@0.40s  6@1.47s  6@2.01s  6@2.75s  6@3.29s  36@3.85s  36@4.62s  6@5.65s  6@6.29s
  - "So 36 divided by 6 is 6. 6 × 6 = 36, so 36 ÷ 6 = 6."

### div-3-4 (Dealing)
- **ask** · scene 6.77s, clip 5.982s, tail 0.78s · 24@0.00s  4@1.49s
  - "24 divided by 4. There are two ways to picture this, and they both give the same answer."
- **deal** · scene 10.00s, clip 8.176s, tail 1.82s · 4@4.45s  6@7.28s
  - "First way — sharing. Deal them out, one at a time, like cards… onto 4 plates. Keep going… and everyone ends up with 6."
- **group** · scene 12.47s, clip 11.677s, tail 0.79s · 4@3.04s  24@4.66s  4@6.28s  6@9.57s
  - "Now the other way. Instead of sharing, ask how many 4s actually fit inside 24. Make a group of 4… and another… and count the groups. 6. Same"
- **record** · scene 8.47s, clip 7.654s, tail 0.81s · 24@0.37s  4@1.57s  6@2.09s  4@3.19s  6@3.79s  24@4.47s  24@5.43s  4@6.36s  6@6.87s
  - "So 24 divided by 4 is 6. 4 × 6 = 24, so 24 ÷ 4 = 6."

### div-6-9 (Dealing)
- **ask** · scene 6.83s, clip 6.034s, tail 0.80s · 42@0.00s  7@1.61s
  - "42 divided by 7. There are two ways to picture this, and they both give the same answer."
- **deal** · scene 10.00s, clip 9.143s, tail 0.86s · 7@5.17s  6@8.37s
  - "First way — sharing. Deal them out, one at a time, like cards… onto 7 plates. Keep going… and everyone ends up with 6."
- **group** · scene 12.97s, clip 12.173s, tail 0.79s · 7@3.12s  42@4.83s  7@6.77s  6@10.39s
  - "Now the other way. Instead of sharing, ask how many 7s actually fit inside 42. Make a group of 7… and another… and count the groups. 6. Same"
- **record** · scene 8.27s, clip 7.471s, tail 0.80s · 42@0.46s  7@1.49s  6@2.01s  7@2.60s  6@3.27s  42@3.99s  42@4.98s  7@6.00s  6@6.70s
  - "So 42 divided by 7 is 6. 7 × 6 = 42, so 42 ÷ 7 = 6."

### div-10-12 (Dealing)
- **ask** · scene 6.30s, clip 5.512s, tail 0.79s · 48@0.00s  12@1.32s
  - "48 divided by 12. There are two ways to picture this, and they both give the same answer."
- **deal** · scene 10.00s, clip 8.96s, tail 1.04s · 12@5.19s  4@8.29s
  - "First way — sharing. Deal them out, one at a time, like cards… onto 12 plates. Keep going… and everyone ends up with 4."
- **group** · scene 12.37s, clip 11.572s, tail 0.79s · 12@2.73s  48@4.57s  12@6.22s  4@9.64s
  - "Now the other way. Instead of sharing, ask how many 12s actually fit inside 48. Make a group of 12… and another… and count the groups. 4. Sa"
- **record** · scene 7.87s, clip 7.053s, tail 0.81s · 48@0.41s  12@1.31s  4@1.88s  12@2.52s  4@3.13s  48@3.76s  48@4.50s  12@5.42s  4@6.35s
  - "So 48 divided by 12 is 4. 12 × 4 = 48, so 48 ÷ 12 = 4."

### div-remainder (Dealing)
- **ask** · scene 6.30s, clip 5.512s, tail 0.79s · 29@0.00s  4@1.71s
  - "29 divided by 4. There are two ways to picture this, and they both give the same answer."
- **deal** · scene 14.87s, clip 14.08s, tail 0.79s · 4@4.78s  7@8.54s  1@9.35s
  - "First way — sharing. Deal them out, one at a time, like cards… onto 4 plates. Keep going… and everyone ends up with 7. And 1 won't go — ther"
- **group** · scene 16.23s, clip 15.438s, tail 0.80s · 4@3.30s  29@4.95s  4@6.63s  7@10.70s  1@11.95s
  - "Now the other way. Instead of sharing, ask how many 4s actually fit inside 29. Make a group of 4… and another… and count the groups. 7. And "
- **record** · scene 7.10s, clip 6.296s, tail 0.80s · 29@0.37s  4@1.45s  7@1.89s  1@2.79s  4@3.13s  7@3.68s  28@4.31s  1@5.02s
  - "So 29 divided by 4 is 7, remainder 1. 4 × 7 = 28, and 1 is left over."

### div-larger (Dealing)
- **ask** · scene 7.27s, clip 6.452s, tail 0.81s · 84@0.00s  4@1.51s
  - "84 divided by 4. That's a lot of things to share… so don't count them one at a time. Use blocks."
- **deal** · scene 10.00s, clip 9.038s, tail 0.96s · 84@0.00s  8@1.01s  4@1.68s  8@3.38s  4@4.24s  2@4.99s  4@6.97s  4@7.67s  1@8.10s
  - "84 is 8 tens and 4 ones. Share the tens first — 8 tens between 4… that's 2 tens each. Now the ones. 4 between 4… 1 each."
- **group** · scene 10.37s, clip 9.561s, tail 0.81s · 8@2.29s  4@3.60s  2@4.08s  4@5.24s  4@6.41s  1@6.86s  21@8.67s
  - "Written down it's just those two steps. 8 tens divided by 4 is 2 tens. 4 ones divided by 4 is 1. Put them together… 21."
- **record** · scene 6.00s, clip 4.362s, tail 1.64s · 84@0.42s  4@1.43s  21@1.85s
  - "So 84 divided by 4 is 21. Share the tens first, then the ones."

### add-fact-family (FactFamily)
- **ask** · scene 9.83s, clip 9.038s, tail 0.80s · 5@0.00s  8@0.81s  13@1.36s
  - "5, 8 and 13. These three belong together — and once you know how, they give you four facts for the price of one."
- **build** · scene 6.00s, clip 4.545s, tail 1.46s · 13@1.29s  5@3.32s  8@3.95s
  - "Here's the whole thing… 13. And it's made of two parts. 5… and 8."
- **facts** · scene 21.50s, clip 20.689s, tail 0.81s · 5@4.76s  8@5.45s  13@6.00s  8@9.02s  5@9.76s  13@10.37s  13@15.27s  8@16.30s  5@16.63s  13@17.22s  5@18.09s  8@18.55s
  - "Now ask the picture four different questions. Put the parts together — 5 plus 8 is 13. Swap them round — 8 plus 5 is 13. Or start from the w"
- **record** · scene 6.00s, clip 3.474s, tail 2.53s · (no alignment)
  - "That's the family. Know one, and you know all four."

### sub-fact-family (FactFamily)
- **ask** · scene 8.23s, clip 7.419s, tail 0.81s · 6@0.00s  9@0.55s  15@0.94s
  - "6, 9 and 15. These three belong together — and once you know how, they give you four facts for the price of one."
- **build** · scene 6.00s, clip 4.78s, tail 1.22s · 15@1.23s  6@3.25s  9@3.99s
  - "Here's the whole thing… 15. And it's made of two parts. 6… and 9."
- **facts** · scene 20.07s, clip 19.252s, tail 0.81s · 6@5.13s  9@5.80s  15@6.19s  9@8.84s  6@9.42s  15@9.93s  15@13.82s  9@14.87s  6@15.28s  15@15.91s  6@16.72s  9@17.16s
  - "Now ask the picture four different questions. Put the parts together — 6 plus 9 is 15. Swap them round — 9 plus 6 is 15. Or start from the w"
- **record** · scene 6.00s, clip 3.892s, tail 2.11s · (no alignment)
  - "That's the family. Subtraction asks which part is missing."

### mul-fact-family (FactFamily)
- **ask** · scene 6.90s, clip 6.113s, tail 0.79s · 3@0.00s  4@0.74s  12@1.36s
  - "3, 4 and 12. These three belong together — and they give you four facts for the price of one."
- **build** · scene 6.07s, clip 5.277s, tail 0.79s · 3@1.64s  4@2.84s  12@4.02s
  - "Here it is as an array. 3 rows… with 4 in each row. That's 12 altogether."
- **facts** · scene 19.93s, clip 19.148s, tail 0.79s · 3@3.66s  4@4.46s  12@5.14s  4@7.85s  3@8.59s  12@9.03s  12@10.43s  12@13.27s  3@14.35s  4@14.85s  12@15.34s  4@16.42s  3@16.92s
  - "Now ask it four questions. Count it as rows — 3 times 4 is 12. Turn it and count columns — 4 times 3 is 12. Or start from 12 and ask how man"
- **record** · scene 6.00s, clip 4.023s, tail 1.98s · (no alignment)
  - "That's the family. Division asks how big one row is."

### div-fact-family (FactFamily)
- **ask** · scene 7.30s, clip 6.504s, tail 0.80s · 4@0.00s  6@0.49s  24@0.89s
  - "4, 6 and 24. These three belong together — and they give you four facts for the price of one."
- **build** · scene 6.40s, clip 5.616s, tail 0.78s · 4@1.60s  6@2.88s  24@4.14s
  - "Here it is as an array. 4 rows… with 6 in each row. That's 24 altogether."
- **facts** · scene 21.20s, clip 20.402s, tail 0.80s · 4@3.62s  6@4.31s  24@5.02s  6@7.94s  4@8.62s  24@9.06s  24@10.84s  24@13.98s  4@15.63s  6@16.08s  24@16.80s  6@17.81s  4@18.26s
  - "Now ask it four questions. Count it as rows — 4 times 6 is 24. Turn it and count columns — 6 times 4 is 24. Or start from 24 and ask how man"
- **record** · scene 6.00s, clip 3.892s, tail 2.11s · (no alignment)
  - "That's the family. Every division has a multiplication twin."

### cur-number-bonds (FactFamily)
- **ask** · scene 8.77s, clip 7.967s, tail 0.80s · 6@0.00s  4@0.82s  10@1.36s
  - "6, 4 and 10. These three belong together — and once you know how, they give you four facts for the price of one."
- **build** · scene 6.27s, clip 5.46s, tail 0.81s · 10@1.39s  6@3.94s  4@4.71s
  - "Here's the whole thing… 10. And it's made of two parts. 6… and 4."
- **facts** · scene 16.37s, clip 15.569s, tail 0.80s · 6@3.87s  4@4.46s  10@4.89s  4@6.64s  6@7.16s  10@7.64s  10@10.69s  4@11.52s  6@11.95s  10@12.56s  6@13.26s  4@13.73s
  - "Now ask the picture four different questions. Put the parts together — 6 plus 4 is 10. Swap them round — 4 plus 6 is 10. Or start from the w"
- **record** · scene 6.00s, clip 4.859s, tail 1.14s · (no alignment)
  - "That's the family. Two parts that make ten — know one, know the other."

### mul-break-apart (Area)
- **ask** · scene 5.33s, clip 4.545s, tail 0.79s · 23@0.00s  4@0.89s
  - "23 times 4. That's too big to just know… so let's draw it instead."
- **build** · scene 7.73s, clip 6.949s, tail 0.78s · 23@1.25s  4@3.17s
  - "Here's a rectangle. 23 across… and 4 down. The answer is how many little squares are inside it."
- **split** · scene 12.00s, clip 9.326s, tail 2.67s · 23@1.94s  20@2.59s  3@3.02s  20@6.08s  4@6.73s  80@7.12s  3@7.57s  4@8.17s  12@8.54s
  - "Now cut it at the tens. 23 is 20 and 3. And look — both pieces are easy. 20 times 4 is 80. 3 times 4 is 12."
- **record** · scene 7.00s, clip 6.087s, tail 0.91s · 80@1.08s  12@1.61s  92@2.38s
  - "Add the pieces up. 80 plus 12… 92. Split the big number, do the easy bits, add them."

### mul-carry (Area)
- **ask** · scene 5.67s, clip 4.859s, tail 0.81s · 27@0.00s  4@1.10s
  - "27 times 4. That's too big to just know… so let's draw it instead."
- **build** · scene 7.00s, clip 6.113s, tail 0.89s · 27@1.21s  4@2.59s
  - "Here's a rectangle. 27 across… and 4 down. The answer is how many little squares are inside it."
- **split** · scene 12.00s, clip 9.691s, tail 2.31s · 27@1.53s  20@2.52s  7@3.13s  20@6.00s  4@6.68s  80@7.15s  7@7.65s  4@8.34s  28@8.74s
  - "Now cut it at the tens. 27 is 20 and 7. And look — both pieces are easy. 20 times 4 is 80. 7 times 4 is 28."
- **record** · scene 7.73s, clip 6.922s, tail 0.81s · 80@1.58s  28@2.24s  108@3.09s
  - "Add the pieces up. 80 plus 28… 108. The carried digit is just the ones piece spilling over."

### mul-2d1d (Area)
- **ask** · scene 5.57s, clip 4.78s, tail 0.79s · 34@0.00s  6@1.00s
  - "34 times 6. That's too big to just know… so let's draw it instead."
- **build** · scene 7.50s, clip 6.687s, tail 0.81s · 34@1.35s  6@3.04s
  - "Here's a rectangle. 34 across… and 6 down. The answer is how many little squares are inside it."
- **split** · scene 12.00s, clip 9.848s, tail 2.15s · 34@1.89s  30@2.62s  4@3.17s  30@5.64s  6@6.33s  180@6.83s  4@7.86s  6@8.49s  24@8.95s
  - "Now cut it at the tens. 34 is 30 and 4. And look — both pieces are easy. 30 times 6 is 180. 4 times 6 is 24."
- **record** · scene 7.00s, clip 5.616s, tail 1.38s · 180@1.23s  24@2.11s  204@2.87s
  - "Add the pieces up. 180 plus 24… 204. Tens piece, ones piece, add."

### mul-2d2d (Area)
- **ask** · scene 5.30s, clip 4.493s, tail 0.81s · 23@0.00s  14@0.89s
  - "23 times 14. That's too big to just know… so let's draw it instead."
- **build** · scene 7.20s, clip 6.4s, tail 0.80s · 23@1.47s  14@2.77s
  - "Here's a rectangle. 23 across… and 14 down. The answer is how many little squares are inside it."
- **split** · scene 18.33s, clip 17.528s, tail 0.81s · 20@10.26s  10@11.01s  200@11.44s  3@12.36s  10@12.93s  30@13.39s  20@14.06s  4@14.81s  80@15.29s  3@15.80s  4@16.46s  12@16.89s
  - "Now cut it. Across, at the tens… and down, at the tens as well. That gives four pieces, and every one of them is a fact you already know. 20"
- **record** · scene 10.50s, clip 9.691s, tail 0.81s · 200@1.41s  30@2.33s  80@2.98s  12@3.73s  322@4.53s
  - "Add the pieces up. 200 plus 30 plus 80 plus 12… 322. Cut both ways — that's why there are four partial products."

### cur-identify-fractions (FractionBar)
- **ask** · scene 4.00s, clip 2.351s, tail 1.65s · 3@0.57s  4@1.07s
  - "What does 3/4 actually mean?"
- **parts** · scene 11.37s, clip 10.58s, tail 0.79s · 4@2.57s
  - "Start with one whole bar. Cut it into 4 parts — and they have to be EQUAL. Same size, every one. If the parts aren't equal… it's not quarter"
- **action** · scene 10.00s, clip 4.258s, tail 5.74s · 3@0.76s  3@3.16s  4@3.66s
  - "Now shade 3 of them. One… two… three. 3 out of 4."
- **record** · scene 12.10s, clip 11.285s, tail 0.81s · (no alignment)
  - "And that's exactly what the fraction says. The bottom number is how many equal parts. The top is how many you took. Bottom = equal parts, to"

### cur-compare-fractions (FractionBar)
- **ask** · scene 4.00s, clip 2.952s, tail 1.05s · 3@0.97s  4@1.46s  2@1.88s  3@2.31s
  - "Which is bigger… 3/4, or 2/3?"
- **parts** · scene 9.53s, clip 8.725s, tail 0.81s · 4@3.63s  3@5.07s  3@6.75s  2@7.95s
  - "Two bars, exactly the same length. Cut the first into 4… and shade 3. Cut the second into 3… and shade 2."
- **action** · scene 10.00s, clip 7.288s, tail 2.71s · 3@5.41s  4@6.04s
  - "Now line them up… and look at where the shading ends. The top bar reaches further. 3/4 is bigger."
- **record** · scene 7.07s, clip 6.269s, tail 0.80s · 3@0.49s  4@1.06s  2@2.00s  3@2.52s
  - "So 3/4 is greater than 2/3. Same-length bars — the longer shading wins."

### cur-add-fractions (FractionBar)
- **ask** · scene 4.27s, clip 3.474s, tail 0.79s · 3@0.00s  8@0.80s  2@1.29s  8@1.79s
  - "3/8 plus 2/8 — how do you add fractions?"
- **parts** · scene 8.00s, clip 3.657s, tail 4.34s · 8@1.24s  3@2.55s
  - "Here's a bar cut into 8 equal parts, with 3 shaded."
- **action** · scene 10.00s, clip 5.512s, tail 4.49s · 2@0.71s  5@4.38s
  - "Now add 2 more parts… watch them slide in. Count the shading: 5 parts."
- **record** · scene 13.90s, clip 13.113s, tail 0.79s · 3@0.00s  8@0.88s  2@1.51s  8@2.00s  5@2.50s  8@3.19s
  - "3/8 plus 2/8 is 5/8. The bottom number didn't change — the pieces are the same size, there are just more of them. Same-size pieces just coun"

### cur-simplify-fractions (FractionBar)
- **ask** · scene 4.00s, clip 2.926s, tail 1.07s · 4@0.00s  8@0.79s
  - "4/8… can we say that more simply?"
- **parts** · scene 8.00s, clip 3.709s, tail 4.29s · 4@0.57s  8@1.23s  8@2.16s  4@2.74s
  - "Here's 4/8 — a bar in 8 parts, 4 shaded."
- **action** · scene 14.70s, clip 13.897s, tail 0.80s · 2@7.38s  4@7.91s  1@9.94s  2@10.51s
  - "Now watch the shading. Don't take your eyes off it. Erase every second cut… the parts get bigger, and now it's 2 out of 4. Erase again… 1 ou"
- **record** · scene 10.03s, clip 9.221s, tail 0.81s · 4@0.00s  8@0.77s  2@1.33s  4@1.89s  1@2.31s  2@2.79s
  - "4/8, 2/4 and 1/2 are the SAME amount — just cut differently. Fewer, bigger pieces — the shading never changed."

### cur-decimal-place-value (HundredGrid)
- **ask** · scene 4.00s, clip 3.109s, tail 0.89s · 0@0.00s  3@0.66s  0@1.03s  3@1.42s
  - "0.3 and 0.03. Same thing… or not?"
- **grid** · scene 8.93s, clip 8.124s, tail 0.81s · 100@1.75s
  - "Here's a square cut into 100 little cells. One whole column is a tenth — ten cells. One little cell on its own is a hundredth."
- **action** · scene 12.30s, clip 11.494s, tail 0.81s · 0@0.00s  3@0.86s  3@1.26s  30@2.57s  0@4.23s  3@4.97s  3@5.86s
  - "0.3 is 3 whole columns… 30 cells. But 0.03 is just 3 little cells. Look at the difference. Not the same at all — one is ten times the other."
- **record** · scene 11.50s, clip 10.684s, tail 0.82s · 0@4.42s  3@5.13s  3@5.90s  0@7.29s  3@8.00s  3@9.04s
  - "First place after the dot counts columns. Second place counts cells. 0.3 is 3 whole columns — 0.03 is just 3 little cells."

### cur-decimal-operations (HundredGrid)
- **ask** · scene 6.00s, clip 5.198s, tail 0.80s · 0@0.00s  4@0.80s  0@1.43s  25@1.93s
  - "0.4 plus 0.25. Decimals… but the grid makes it easy."
- **grid** · scene 7.00s, clip 3.997s, tail 3.00s · 0@0.00s  4@0.82s  40@1.24s  100@2.16s
  - "0.4 is 40 cells out of 100 — shade them gold."
- **action** · scene 10.00s, clip 7.523s, tail 2.48s · 0@0.34s  25@0.86s  25@1.59s  65@6.15s
  - "And 0.25 is 25 cells — shade them blue, right after. Now count everything shaded… 65 cells."
- **record** · scene 10.73s, clip 9.927s, tail 0.81s · 65@0.00s  100@1.43s  0@2.09s  65@2.52s  0@3.24s  4@3.76s  0@4.25s  25@4.70s  0@5.40s  65@5.80s
  - "65 cells out of 100 is 0.65. So 0.4 plus 0.25 is 0.65. Line up the decimal points and add like always."

### cur-decimal-subtract (HundredGrid)
- **ask** · scene 5.43s, clip 4.624s, tail 0.81s · 0@0.00s  65@0.73s  0@1.63s  25@2.10s
  - "0.65 take away 0.25. Same grid… different direction."
- **grid** · scene 7.00s, clip 4.441s, tail 2.56s · 0@0.00s  65@0.85s  65@1.45s  100@2.61s
  - "0.65 is 65 cells out of 100 — there they are, shaded."
- **action** · scene 10.00s, clip 6.635s, tail 3.37s · 0@0.73s  25@1.25s  25@2.38s  40@5.14s
  - "Now take 0.25 away — that's 25 cells, coming off… watch the count fall. 40 cells left."
- **record** · scene 10.83s, clip 10.031s, tail 0.80s · 40@0.00s  0@0.87s  4@1.45s  0@2.22s  65@2.69s  0@3.71s  25@4.30s  0@5.06s  4@5.55s
  - "40 cells is 0.4. So 0.65 take away 0.25 is 0.4. Same grid — shading comes OFF instead of going on."

### cur-decimal-multiply (HundredGrid)
- **ask** · scene 5.10s, clip 4.31s, tail 0.79s · 0@0.00s  3@0.85s  3@1.38s
  - "0.3 × 3. Multiplying a decimal… by a whole number."
- **grid** · scene 7.00s, clip 2.769s, tail 4.23s · 0@0.00s  3@0.80s  3@1.14s
  - "0.3 is 3 columns. That's one group."
- **action** · scene 10.00s, clip 6.087s, tail 3.91s · 3@0.72s  0@1.83s  3@2.31s  0@2.73s  6@3.22s  0@3.73s  9@4.25s  9@4.56s
  - "Now take 3 groups of it… 0.3… 0.6… 0.9. 9 tenths altogether."
- **record** · scene 8.83s, clip 8.02s, tail 0.81s · 9@0.00s  0@1.14s  9@1.79s  0@2.73s  3@3.40s  3@4.06s  0@4.48s  9@5.12s
  - "9 tenths is 0.9. So 0.3 × 3 is 0.9. Groups of tenths, just like groups of anything."

### cur-percentages (HundredGrid)
- **ask** · scene 4.00s, clip 2.821s, tail 1.18s · 37@0.00s
  - "37 percent. What IS a percent, really?"
- **grid** · scene 7.00s, clip 5.251s, tail 1.75s · 100@4.08s
  - "Per cent means per hundred. So here's a hundred — a square cut into 100 cells."
- **action** · scene 10.00s, clip 3.997s, tail 6.00s · 37@0.52s  37@1.75s
  - "Shade 37 of them… that's 37 percent. Nothing more to it."
- **record** · scene 12.80s, clip 11.99s, tail 0.81s · 37@2.53s  100@3.42s  0@4.62s  37@5.22s  37@6.54s
  - "And the same shading has three names: 37 out of 100… 0.37… and 37%. Per cent means per hundred — same number, three coats."

### cur-ratios (RatioTable)
- **ask** · scene 4.00s, clip 2.691s, tail 1.31s · 3@0.00s  2@0.76s
  - "3 red to 2 blue. What IS a ratio?"
- **build** · scene 7.00s, clip 3.944s, tail 3.06s · 3@1.13s  2@2.42s
  - "Here's the pair. 3 red on the top row, 2 blue on the bottom."
- **scale** · scene 12.67s, clip 11.86s, tail 0.81s · 2@3.70s  6@4.52s  4@5.07s  3@6.32s  9@6.79s  6@7.34s
  - "Now multiply BOTH rows by the same number. Times 2… 6 and 4. Times 3… 9 and 6. The numbers get bigger, but the shape of the pair never chang"
- **record** · scene 6.83s, clip 6.034s, tail 0.80s · 3@0.00s  2@0.53s  9@1.93s  6@2.28s
  - "3 to 2 is the same ratio as 9 to 6. Scale both sides the same, and the ratio holds."

### cur-proportions (RatioTable)
- **ask** · scene 4.00s, clip 2.586s, tail 1.41s · 3@0.00s  4@0.73s  12@1.96s
  - "3 over 4… equals what over 12?"
- **build** · scene 7.00s, clip 4.127s, tail 2.87s · 3@0.43s  4@0.85s  3@2.33s  4@3.48s
  - "Here's 3 over 4, as a table. Top row 3… bottom row 4."
- **scale** · scene 13.40s, clip 12.591s, tail 0.81s · 2@3.88s  6@4.63s  8@5.20s  3@6.26s  9@6.82s  12@7.45s
  - "Now multiply BOTH rows by the same number. Times 2… 6 and 8. Times 3… 9 and 12. The numbers get bigger, but the shape of the pair never chan"
- **record** · scene 7.30s, clip 6.504s, tail 0.80s · 3@0.38s  4@0.89s  9@1.63s  12@2.15s
  - "So 3 over 4 equals 9 over 12. Same multiplier top and bottom — that's what equal means here."

### cur-unit-rates (RatioTable)
- **ask** · scene 4.00s, clip 2.821s, tail 1.18s · 12@0.00s  3@1.07s
  - "12 apples for 3 pounds. What's that each?"
- **build** · scene 7.00s, clip 5.669s, tail 1.33s · 12@1.42s  3@2.89s
  - "Put it in a table. 12 apples on the top… 3 pounds underneath. That's the pair we're given."
- **scale** · scene 11.00s, clip 9.221s, tail 1.78s · 1@2.75s  3@4.37s  12@4.99s  3@5.97s  4@6.46s  3@7.27s  3@8.12s  1@8.56s
  - "Now scale it DOWN, until the bottom says just 1. Divide both by 3… 12 divided by 3 is 4. And 3 divided by 3 is 1."
- **record** · scene 8.47s, clip 7.654s, tail 0.81s · 4@0.76s
  - "So that's 4 apples per pound. That's the unit rate. Divide down to one — then you can compare anything."

### cur-one-step (Balance)
- **ask** · scene 4.00s, clip 2.586s, tail 1.41s · 3@0.57s  8@1.18s
  - "x + 3 equals 8. What is x?"
- **build** · scene 8.23s, clip 7.419s, tail 0.81s · 3@4.47s  8@6.20s
  - "Picture a scale, sitting level. On the left: a box holding x, and 3 weights. On the right: 8 weights."
- **solve** · scene 12.23s, clip 11.442s, tail 0.79s · 3@0.48s  3@4.87s  5@10.53s
  - "Take 3 off the left… but if you only do that, it tips. So take 3 off the RIGHT as well. Still level. Now the left is just the box, and the r"
- **record** · scene 9.30s, clip 8.49s, tail 0.81s · 5@0.78s  5@2.97s
  - "So x is 5. And you can check it — put 5 back in the box and the scale is level again. Take the same off both sides and it stays level."

### cur-two-step (Balance)
- **ask** · scene 4.00s, clip 2.743s, tail 1.26s · 2@0.00s  3@0.77s  11@1.29s
  - "2x + 3 equals 11. What is x?"
- **build** · scene 10.23s, clip 9.43s, tail 0.80s · 2@3.09s  3@6.14s  11@8.06s
  - "Picture a scale, sitting level. On the left: 2 boxes, each holding the same x… and 3 weights. On the right: 11 weights."
- **solve** · scene 12.00s, clip 10.344s, tail 1.66s · 3@0.71s  2@4.04s  8@5.38s  2@7.52s  4@9.42s
  - "First take 3 off BOTH sides… still level. Left is 2 boxes, right is 8. Now split both sides into 2… one box on the left, 4 on the right."
- **record** · scene 10.03s, clip 9.221s, tail 0.81s · 4@1.09s  4@3.63s
  - "So x is 4. And you can check it — put 4 back in the boxes and the scale is level again. Undo the adding first, then the grouping."

### cur-inequalities (Balance)
- **ask** · scene 4.00s, clip 3.161s, tail 0.84s · 2@0.72s  5@1.44s
  - "x + 2 is more than 5. What can x be?"
- **build** · scene 10.77s, clip 9.979s, tail 0.79s · 2@7.04s  5@9.02s
  - "Picture a scale — but this one isn't level. The left side is HEAVIER. On the left: a box holding x, and 2 weights. On the right: 5."
- **solve** · scene 13.97s, clip 13.166s, tail 0.80s · 2@0.48s  3@12.25s
  - "Take 2 off both sides… and it's still tipped the same way. That's the thing about a tipped scale — take the same off each side and it stays "
- **record** · scene 9.40s, clip 8.594s, tail 0.81s · 3@1.41s
  - "So x is more than 3. Not one answer — a whole range of them. A tipped scale stays tipped — same move, both sides."

### cur-graphing-lines (Graph)
- **simple** · scene 17.87s, clip 17.058s, tail 0.81s · 2@1.88s  1@3.40s
  - "Let's build y = 2x + 1 one piece at a time. Start with the simplest line there is: y equals x. Whatever number you pick… you get the same on"
- **stretch** · scene 13.87s, clip 13.061s, tail 0.81s · 2@1.45s  2@2.68s  2@4.57s  2@6.84s  4@8.13s
  - "Now multiply the x by 2. That's y equals 2 x. Every height gets 2 times bigger. One becomes 2… two becomes 4. Watch the line swing up — same"
- **lift** · scene 13.90s, clip 13.113s, tail 0.79s · 1@1.33s  1@2.75s  1@6.57s  0@7.61s  2@8.22s  4@8.64s  1@9.38s  3@9.89s  5@10.36s
  - "Last piece: plus 1. Careful — adding 1 doesn't push the line sideways. It lifts every point UP, by 1. So 0, 2 and 4 become 1, 3 and 5. Same "
- **table** · scene 12.57s, clip 11.755s, tail 0.81s · 0@3.69s  1@4.43s  1@5.54s  3@6.30s  2@7.30s  5@8.17s
  - "Here's how you'd plot it from scratch. Make a table. When x is 0, y is 1. When x is 1, y is 3. When x is 2, y is 5. Each row of the table is"
- **record** · scene 18.00s, clip 17.189s, tail 0.81s · (no alignment)
  - "Join the dots — perfectly straight. And here's the big idea. Every point sitting on that line is a pair that makes the equation true. The li"

### cur-slope-intercept (Graph)
- **name** · scene 18.10s, clip 17.293s, tail 0.81s · 2@12.64s  1@13.55s  2@14.83s  1@16.57s
  - "This shape of equation has a name: y equals m x plus b. The m is called the slope. The b is called the y-intercept. In ours — y = 2x + 1 — t"
- **intercept** · scene 13.53s, clip 12.748s, tail 0.79s · 1@10.82s
  - "The y-intercept is the easy one. It's where the line cuts through the y axis — where x is zero. Look… right there, at a height of 1. That's "
- **points** · scene 10.37s, clip 9.561s, tail 0.81s · 1@4.62s  3@4.90s  3@5.93s  7@6.22s
  - "Now the slope. Pick any two points on the line, and label them. Here's one at 1, 3… and another at 3, 7. The slope measures the climb betwee"
- **formula** · scene 18.50s, clip 17.711s, tail 0.79s · 7@8.47s  3@9.29s  4@9.68s  3@11.15s  1@11.80s  2@12.13s  4@12.64s  2@13.27s  2@14.57s  2@15.43s  1@16.42s
  - "Here's the slope formula: m equals y two minus y one… over x two minus x one. Plug in. Top: 7 minus 3 is 4. Bottom: 3 minus 1 is 2. 4 over 2"
- **record** · scene 14.70s, clip 13.897s, tail 0.80s · 2@2.59s  1@3.39s  2@4.13s  1@7.04s
  - "So read it at a glance. In y = 2x + 1: the 2 is m, the slope — the climb. The 1 is b, the y-intercept — where the line starts. m is the slop"

### cur-systems (Graph)
- **ask** · scene 15.90s, clip 15.099s, tail 0.80s · 2@4.46s  1@5.51s  7@9.36s
  - "Two equations, one puzzle. The first says y = 2x + 1. The second says y = −x + 7. Could ONE pair of numbers make both of them true… at the s"
- **line1** · scene 15.37s, clip 14.55s, tail 0.82s · 0@3.68s  1@4.71s  1@5.64s  3@6.48s  2@7.46s  5@8.16s
  - "Take the first one. Quick table: when x is 0, y is 1. At 1, it's 3. At 2, it's 5. Plot them, join them — the blue line is every pair the fir"
- **line2** · scene 15.23s, clip 14.42s, tail 0.81s · 0@3.85s  7@4.67s  1@5.36s  6@6.09s  2@6.87s  5@7.45s
  - "Now the second equation, on the same grid. Its table: at 0, it's 7. At 1, it's 6. At 2… 5. Plot, join — the gold line is every pair the SECO"
- **cross** · scene 12.53s, clip 11.729s, tail 0.80s · 2@7.58s  5@8.94s
  - "The lines cross exactly once. That point sits on the blue line AND the gold line at the same time. x is 2… y is 5. The one pair that works f"
- **check** · scene 19.87s, clip 19.069s, tail 0.80s · 2@2.76s  2@3.38s  1@3.90s  5@4.59s  2@7.62s  7@8.21s  5@8.93s
  - "Always check. First equation: 2 times 2 plus 1… 5. Yes. Second: minus 2 plus 7… 5 again. That's what solving a system means — find where the"

### cur-graphing-parabolas (Graph)
- **ask** · scene 9.43s, clip 8.62s, tail 0.81s · 4@2.14s
  - "y = x² − 4. Here's the twist: squaring a number never comes out negative… so what shape will THAT make?"
- **plot** · scene 16.43s, clip 15.621s, tail 0.81s · 2@1.73s  0@2.19s  1@3.16s  3@4.21s  4@6.24s  1@9.18s  3@10.32s  1@12.09s  2@12.97s  0@13.48s  2@15.01s
  - "Work a few out. Minus 2 gives 0. Minus 1 gives -3. Zero gives -4. Now cross to the plus side… 1 gives -3 — the same as minus 1 did. And 2 gi"
- **action** · scene 17.43s, clip 16.64s, tail 0.79s · 2@11.48s  2@12.35s
  - "Join them, and it's not a line — it curves. A parabola. Fold it down the middle… the left half lands exactly on the right. That's the squari"
- **record** · scene 9.10s, clip 8.307s, tail 0.79s · 2@3.87s  2@4.66s
  - "And watch where it crosses zero — twice. At -2, and at 2. Squaring makes it curve — and symmetric."

### cur-quadratic-range (Graph)
- **ask** · scene 10.97s, clip 10.162s, tail 0.80s · 4@2.28s
  - "y = x² − 4. Here's a question about the WHOLE curve at once: which heights does it actually reach… and which does it never touch?"
- **plot** · scene 9.43s, clip 8.62s, tail 0.81s · 4@4.76s
  - "Watch the lowest point. The curve bottoms out right here, at a height of -4. That's its minimum — it can NEVER go below this line."
- **action** · scene 13.00s, clip 11.285s, tail 1.71s · 4@2.31s  4@6.79s  4@9.80s
  - "Now sweep upward. From -4, the two arms climb… and climb… forever. Every height from -4 on up gets touched. Everything below -4… never."
- **record** · scene 14.13s, clip 13.349s, tail 0.78s · 4@4.38s
  - "So the RANGE is: y is greater than or equal to -4. Find the vertex height, check which way the arms go — that's the whole method. Range: eve"

### cur-end-behavior (Graph)
- **ask** · scene 10.03s, clip 9.221s, tail 0.81s · 4@1.95s
  - "y = x² − 4. Forget the middle for a moment. What happens at the far EDGES — when x gets huge, or hugely negative?"
- **plot** · scene 10.87s, clip 10.057s, tail 0.81s · 10@1.80s  100@3.02s  100@3.82s
  - "Walk right. At x equals 10, x squared is 100. At 100… ten thousand. The squared term takes over everything else — the arm climbs without lim"
- **action** · scene 13.00s, clip 11.99s, tail 1.01s · 100@5.36s
  - "Now walk LEFT. x is negative… but squaring kills the sign. Minus 100, squared, is still ten thousand. So the left arm climbs too. Both ends…"
- **record** · scene 17.43s, clip 16.64s, tail 0.79s · (no alignment)
  - "That's end behavior: as x runs off either edge, y goes UP — because the leading term is x squared with a positive front. Even power, positiv"

### cur-quadratic-equations (Graph)
- **ask** · scene 8.00s, clip 7.184s, tail 0.82s · 5@1.25s  6@2.18s
  - "x² minus 5x plus 6 equals zero. You could guess numbers all day… or you could draw one picture."
- **plot** · scene 12.43s, clip 11.624s, tail 0.81s · 5@4.53s  6@6.00s
  - "Graph the left side: y = x² − 5x + 6. Now every point's height tells you what the expression is worth at that x."
- **action** · scene 13.30s, clip 12.513s, tail 0.79s · 2@11.08s  3@11.90s
  - "And "equals zero" means: the height is zero. Where is height zero? … Exactly on the x axis. So look where the curve touches it. There… and t"
- **record** · scene 8.40s, clip 7.602s, tail 0.80s · 2@0.94s  3@1.99s
  - "So x is 2, or x is 3. Two crossings — two answers. Solving means finding where it crosses zero."

### cur-quadratic-formula (Graph)
- **ask** · scene 7.73s, clip 6.922s, tail 0.81s · 5@1.26s  6@2.10s
  - "x² minus 5x plus 6 equals zero. You could guess numbers all day… or you could draw one picture."
- **plot** · scene 10.60s, clip 9.796s, tail 0.80s · 5@3.45s  6@4.49s
  - "Graph the left side: y = x² − 5x + 6. Now every point's height tells you what the expression is worth at that x."
- **action** · scene 13.00s, clip 12.173s, tail 0.83s · 2@10.76s  3@11.46s
  - "And "equals zero" means: the height is zero. Where is height zero? … Exactly on the x axis. So look where the curve touches it. There… and t"
- **record** · scene 7.63s, clip 6.818s, tail 0.82s · 2@0.99s  3@1.89s
  - "So x is 2, or x is 3. Two crossings — two answers. The formula finds those crossings every time."

### cur-exponential (Graph)
- **ask** · scene 10.03s, clip 9.221s, tail 0.81s · 2@0.99s  2@4.92s
  - "y = 2 to the power of x. That's not multiplying BY x — it's multiplying 2 by itself, x times over. What shape does that make?"
- **plot** · scene 10.17s, clip 9.378s, tail 0.79s · 0@1.33s  1@1.86s  1@2.54s  2@2.88s  2@3.55s  4@3.87s  3@4.48s  8@4.88s  4@5.49s  16@5.90s
  - "Work them out. At 0 it's 1. At 1, 2. At 2, 4. At 3, 8. At 4… 16. Look at the jumps between them — they're growing."
- **action** · scene 14.03s, clip 13.218s, tail 0.82s · 2@8.75s
  - "Plot them, and watch. It barely moves at first… then it takes off. Every step across multiplies by 2 — so the bigger it is, the bigger its n"
- **record** · scene 10.30s, clip 9.509s, tail 0.79s · (no alignment)
  - "That's exponential growth. A straight line ADDS the same amount each step. This one MULTIPLIES. Doubling beats any straight line, eventually"

### cur-logarithms (Graph)
- **ask** · scene 7.27s, clip 6.452s, tail 0.81s · 2@0.00s  8@1.36s
  - "2 to the WHAT makes 8? … That question — find the exponent — has a name. It's a logarithm."
- **plot** · scene 9.00s, clip 7.706s, tail 1.29s · 2@1.25s  3@5.93s  8@7.00s
  - "Here's y equals 2 to the x. Feed it an exponent, it hands you a value. Feed it 3… it hands you 8."
- **action** · scene 13.00s, clip 11.912s, tail 1.09s · (no alignment)
  - "Now flip the question. Swap x and y — mirror the whole curve in the diagonal. That new curve is the log. Feed IT a value… and it hands the e"
- **record** · scene 12.70s, clip 11.912s, tail 0.79s · 2@1.15s  8@1.64s  3@2.48s  2@3.60s  8@4.45s
  - "So log base 2 of 8 is 3… because 2 cubed is 8. Same relationship — just asked the other way round. A log just asks the exponent question bac"

### cur-limits (Graph)
- **ask** · scene 8.03s, clip 7.236s, tail 0.80s · 2@2.57s
  - "This function is undefined at x = 2. Nothing there at all. So… what happens right NEXT to it?"
- **plot** · scene 16.20s, clip 15.386s, tail 0.81s · 4@2.02s  2@3.97s  2@6.11s  2@8.29s  2@10.41s
  - "y = x² minus 4, all over x minus 2. Everywhere except 2, that cancels down to x plus 2 — a straight line. But at 2 exactly you'd be dividing"
- **action** · scene 13.00s, clip 11.546s, tail 1.45s · 1@1.89s  3@2.51s  1@3.53s  5@4.09s  3@4.76s  5@5.32s  4@7.58s  4@10.76s
  - "Walk in from the left. At 1 it's 3. At 1.5, 3.5. Closer… it's heading for 4. Now come in from the right — also heading for 4."
- **record** · scene 11.90s, clip 11.102s, tail 0.80s · 4@1.46s  4@3.04s
  - "Both sides aim at 4. So the limit is 4 — even though the function never actually gets there. The value it heads for — even where it isn't de"

### cur-derivatives (Graph)
- **ask** · scene 10.23s, clip 9.43s, tail 0.80s · 1@5.04s
  - "y = x². How steep is it… exactly at x = 1? Not on average — at that one single point."
- **plot** · scene 10.83s, clip 10.031s, tail 0.80s · (no alignment)
  - "Tricky, because a curve's steepness keeps changing. So cheat a little. Pick two points, and join them. THAT line's slope is easy to measure."
- **action** · scene 14.40s, clip 13.584s, tail 0.82s · (no alignment)
  - "Now slide the second point closer. And closer. The line swings round… and its slope settles down. When the two points are almost on top of e"
- **record** · scene 9.57s, clip 8.777s, tail 0.79s · 2@1.24s  1@4.32s
  - "And its slope is 2. That's the derivative at x = 1. Slope at a single point — the tangent's steepness."

### cur-integrals (Graph)
- **ask** · scene 10.03s, clip 9.221s, tail 0.81s · 0@2.88s  4@3.55s
  - "How much area sits under this line, between 0 and 4? The top is slanted… so no rectangle formula fits it. Yet."
- **plot** · scene 9.00s, clip 6.113s, tail 2.89s · (no alignment)
  - "Here's y = x. The piece we want is trapped between the line and the x axis."
- **action** · scene 13.17s, clip 12.382s, tail 0.78s · (no alignment)
  - "Chop it into rectangles. Four fat ones — that's a rough answer, sticking out in places. Now eight thinner ones… better. Now lots of very thi"
- **record** · scene 7.73s, clip 6.922s, tail 0.81s · 8@1.95s
  - "Add up all those strips and you get 8. That's the integral. Add up the strips — that's the area underneath."

### cur-function-notation (FunctionMachine)
- **ask** · scene 16.33s, clip 15.517s, tail 0.82s · 2@11.05s  3@11.95s
  - "Here's a machine. Drop a number in the top… a rule works on it… and a new number slides out the bottom. Mathematicians write this machine as"
- **work** · scene 18.50s, clip 17.711s, tail 0.79s · 4@7.77s  4@9.13s  4@12.09s  2@14.41s  4@14.98s  3@15.69s  11@16.80s
  - "The letter f is just the machine's NAME. The x in the brackets is the slot where the input goes. So f of 4 means: feed 4 into machine f. Wat"
- **twist** · scene 13.40s, clip 12.591s, tail 0.81s · 4@1.51s  11@2.16s  4@6.98s  11@7.52s
  - "So when you read f of 4 equals 11, that's not algebra to solve. It's a fact: THIS machine turns 4 into 11. The brackets don't mean multiply "
- **record** · scene 13.17s, clip 12.382s, tail 0.78s · 4@8.28s  4@9.71s
  - "That's all function notation is. Name of the machine… input in the brackets… output on the other side of the equals sign. f(4) means: feed 4"

### cur-evaluate-linear (FunctionMachine)
- **ask** · scene 9.80s, clip 9.012s, tail 0.79s · 3@1.29s  2@2.24s  0@3.67s  1@4.25s  2@4.93s
  - "f(x) = 3x + 2. Evaluate it at 0, at 1, and at 2. One machine… three inputs. Same moves every time."
- **work** · scene 11.97s, clip 11.18s, tail 0.79s · 0@4.08s  3@4.97s  0@5.48s  0@5.91s  2@6.73s  2@7.23s  1@8.35s  5@9.43s  2@10.04s  8@10.62s
  - "The trick: wherever you see the x, swap in the input. Feed it 0… 3 times 0 is 0, plus 2 makes 2. Feed it 1… that's 5. And 2… 8."
- **twist** · scene 16.20s, clip 15.386s, tail 0.81s · 0@2.76s  1@3.41s  2@3.91s  2@4.90s  5@5.27s  8@5.88s  3@8.57s
  - "Line the answers up in a table. In: 0, 1, 2. Out: 2, 5, 8. Look at the outputs — they climb by 3 every time. That's the m in m x plus b doin"
- **record** · scene 13.27s, clip 12.46s, tail 0.81s · (no alignment)
  - "So evaluating a function is substitution, nothing more. Swap the x for the input… do the arithmetic… write the output. Swap the x for the in"

### cur-composition (FunctionMachine)
- **ask** · scene 12.53s, clip 11.729s, tail 0.80s · 2@2.72s  3@4.87s  2@11.08s
  - "Two machines this time. Machine f adds 2. Machine g multiplies by 3. Now chain them: the output pipe of f feeds straight into g. What happen"
- **work** · scene 17.53s, clip 16.744s, tail 0.79s · 2@1.46s  4@4.24s  4@5.25s  3@7.88s  12@8.67s  2@11.90s
  - "Follow it through. 2 drops into f… out comes 4. That 4 falls straight into g… times 3… 12. Written down, that's g of f of 2 — read it inside"
- **twist** · scene 13.63s, clip 12.826s, tail 0.81s · 2@1.89s  6@3.87s  8@6.05s  12@7.70s  8@9.17s
  - "Now swap the machines. 2 into g first… 6. Then into f… 8. Different answer! 12 one way, 8 the other. Order matters when you chain machines."
- **record** · scene 11.60s, clip 10.815s, tail 0.79s · (no alignment)
  - "That's composition: one machine's output becomes the next machine's input. Read the brackets from the inside out. The inside machine runs fi"

### cur-inverse-functions (FunctionMachine)
- **ask** · scene 14.93s, clip 14.132s, tail 0.80s · 2@1.75s  1@2.89s  3@4.19s  2@5.40s  6@5.79s  1@6.43s  7@7.50s  7@11.67s  3@13.48s
  - "f(x) = 2x + 1. Feed it 3: times 2 is 6, plus 1… 7. Now the real question: if all you know is the OUTPUT, 7… can you get back to the 3?"
- **work** · scene 15.30s, clip 14.498s, tail 0.80s · 2@3.48s  1@4.98s  1@8.92s  6@9.95s  2@11.54s  3@12.47s
  - "Run the machine backwards. Going forward it multiplied by 2, THEN added 1. So going back, undo the LAST step first: subtract 1… 6. Then divi"
- **twist** · scene 16.00s, clip 15.203s, tail 0.80s · (no alignment)
  - "That backwards machine has a name: f inverse. Notice the double reversal — opposite operations, in the opposite order. Like taking off shoes"
- **record** · scene 10.43s, clip 9.639s, tail 0.79s · 2@1.22s  1@1.75s  1@3.40s  2@4.00s
  - "Forward: times 2, plus 1. Inverse: minus 1, divide 2. Every step undone, in reverse. The inverse undoes each step, in reverse order."

### cur-domain-range (FunctionMachine)
- **ask** · scene 14.03s, clip 13.244s, tail 0.79s · (no alignment)
  - "f(x) = x² — the squaring machine. Two questions ABOUT a machine, not about any one number. What's allowed to go IN? And what can possibly co"
- **work** · scene 18.97s, clip 18.181s, tail 0.79s · 3@2.30s  9@4.16s  0@5.07s  0@6.21s  3@6.94s  9@8.12s
  - "Try some inputs. -3… squared… 9. 0… gives 0. 3… also 9. Anything can go in — positive, negative, zero. The set of allowed inputs is called t"
- **twist** · scene 17.17s, clip 16.353s, tail 0.81s · 9@1.87s  0@2.63s  9@3.48s
  - "But look at what comes out: 9, 0, 9… Can this machine EVER produce a negative? Try to imagine it — a number times itself, coming out negativ"
- **record** · scene 14.03s, clip 13.244s, tail 0.79s · (no alignment)
  - "Domain: every input the machine accepts. Range: every output it can actually make. Two different questions — always ask both. Domain: what c"

### cur-domain-rational (FunctionMachine)
- **ask** · scene 17.17s, clip 16.353s, tail 0.81s · 1@1.99s  2@4.11s  1@6.42s  2@8.71s
  - "f(x) = 1 / (x − 2). A fraction machine: 1 divided by, x minus 2. Most inputs are fine… but one of them breaks this machine. Can you spot it "
- **work** · scene 10.53s, clip 9.744s, tail 0.79s · 3@0.97s  3@2.04s  2@2.66s  1@3.33s  1@4.28s  4@5.26s  2@6.24s  0@7.23s  5@7.89s
  - "Feed it 3: bottom is 3 minus 2, which is 1… output 1. Feed it 4: bottom is 2… output 0.5. Smooth so far."
- **twist** · scene 13.03s, clip 12.225s, tail 0.81s · 2@0.86s  2@2.18s  2@2.79s  1@4.06s
  - "Now feed it 2. Bottom: 2 minus 2… zero. And 1 divided by zero — the machine jams. There is no answer. Division by zero isn't big, isn't infi"
- **record** · scene 13.80s, clip 13.009s, tail 0.79s · 2@2.29s
  - "So the domain is every number EXCEPT 2. For any fraction machine, find what makes the bottom zero — and fence it off. The domain is every in"

### cur-pythagorean (Trig)
- **ask** · scene 8.03s, clip 7.236s, tail 0.80s · 3@2.31s  4@3.33s
  - "A right triangle. One leg is 3, the other is 4. How long is the slanted side… without measuring it?"
- **work** · scene 12.10s, clip 11.285s, tail 0.81s · 3@1.96s  9@3.60s  4@4.53s  16@5.57s  9@8.59s  16@9.29s  25@10.16s
  - "Build a square on each leg. The 3 side carries a square of 9. The 4 side… 16. Add the two squares together: 9 plus 16 is 25."
- **twist** · scene 16.30s, clip 15.491s, tail 0.81s · 25@4.75s  25@7.50s  5@9.25s
  - "Now the slanted side — the hypotenuse. ITS square holds exactly 25. So the side itself is the square root of 25… which is 5. That's the Pyth"
- **record** · scene 11.00s, clip 10.214s, tail 0.79s · 3@0.00s  4@0.53s  5@0.82s
  - "3, 4, 5 — the most famous right triangle there is. Legs squared, added… equals the hypotenuse squared. Legs squared, added — that's the hypo"

### cur-triangle-sides (Trig)
- **ask** · scene 12.47s, clip 11.677s, tail 0.79s · 3@1.45s  4@2.19s  5@2.58s
  - "Same triangle — 3, 4, 5. But now stand at this corner: the angle called theta. From where theta sits, every side of the triangle gets a name"
- **work** · scene 16.00s, clip 15.203s, tail 0.80s · 3@4.98s  4@10.15s  5@14.27s
  - "The side facing theta, across the triangle, is the OPPOSITE — here, 3. The side touching theta that isn't the slant is the ADJACENT… 4. And "
- **twist** · scene 11.43s, clip 10.632s, tail 0.80s · 4@5.83s
  - "Now move theta to the other corner… and watch. Opposite and adjacent SWAP. The 4 faces the angle now. The names belong to the ANGLE, not to "
- **record** · scene 15.83s, clip 15.02s, tail 0.81s · (no alignment)
  - "Opposite, adjacent, hypotenuse — always named from the angle you stand at. Get the names right, and the ratios later name themselves. Opposi"

### cur-right-triangle-trig (Trig)
- **ask** · scene 10.30s, clip 9.509s, tail 0.79s · 3@0.00s  4@0.76s  5@1.15s
  - "3, 4, 5 — sides named from theta. Trigonometry is nothing but RATIOS of these sides. Three of them… each with its own name."
- **work** · scene 18.23s, clip 17.424s, tail 0.81s · 3@3.42s  5@4.04s  0@4.98s  6@5.77s  4@9.10s  5@9.66s  0@10.47s  8@11.10s  3@14.24s  4@14.83s  0@15.69s  75@16.29s
  - "Sine of theta is opposite over hypotenuse: 3 over 5, which is 0.6. Cosine is adjacent over hypotenuse: 4 over 5… 0.8. Tangent is opposite ov"
- **twist** · scene 14.63s, clip 13.819s, tail 0.81s · 30@6.13s  50@6.83s  0@8.43s  6@9.08s
  - "Why care? Because the ratios depend only on the ANGLE. Blow the triangle up ten times: 30 over 50… still 0.6. Know the angle, and you know e"
- **record** · scene 18.97s, clip 18.181s, tail 0.79s · (no alignment)
  - "Remember it as SOH CAH TOA. Sine: Opposite over Hypotenuse. Cosine: Adjacent over Hypotenuse. Tangent: Opposite over Adjacent. SOH CAH TOA —"

### cur-pyth-identity (Trig)
- **ask** · scene 9.57s, clip 8.777s, tail 0.79s · 0@2.43s  6@3.05s  0@4.45s  8@4.96s
  - "From our triangle, sine of theta is 0.6 and cosine is 0.8. Square them both… and watch what they add up to."
- **work** · scene 16.83s, clip 16.039s, tail 0.79s · 0@0.00s  6@1.14s  0@2.01s  36@2.61s  0@3.53s  8@4.14s  0@5.11s  64@5.67s  0@6.90s  36@7.49s  0@8.47s  64@8.99s  1@10.77s  1@15.28s
  - "0.6 squared is 0.36. 0.8 squared is 0.64. Add them: 0.36 plus 0.64… exactly 1. And that's no accident of this triangle — ANY angle lands on "
- **twist** · scene 15.40s, clip 14.602s, tail 0.80s · 3@1.35s  5@1.78s  4@2.82s  5@3.29s  9@4.87s  16@5.48s  25@6.71s  9@7.70s  16@8.27s  25@9.04s  25@12.39s  25@13.18s
  - "Here's why. Sine is 3 over 5, cosine is 4 over 5. Square and add: 9 plus 16, all over 25. But 9 plus 16 IS 25 — that's Pythagoras! So the fr"
- **record** · scene 15.23s, clip 14.42s, tail 0.81s · 1@2.76s  1@11.73s
  - "Sine squared plus cosine squared equals 1 — for every angle, always. It's the Pythagorean theorem, wearing trig clothes. sin² + cos² = 1 — t"

### cur-unit-circle (Trig)
- **ask** · scene 12.83s, clip 12.042s, tail 0.79s · 1@2.32s
  - "A circle with radius exactly 1, centred at zero. Walk an angle theta around from the right-hand side… and you land on a point. That point's "
- **work** · scene 16.60s, clip 15.804s, tail 0.80s · (no alignment)
  - "From the point, drop straight down to the x axis. That horizontal distance from the centre is the COSINE of theta. The height you dropped is"
- **twist** · scene 15.63s, clip 14.838s, tail 0.80s · 90@4.24s  0@5.91s  1@6.93s  180@8.42s  1@10.25s  0@10.89s
  - "Slide theta around and watch the pair change. Straight up, at 90 degrees: cosine 0, sine 1. Far left, at 180: cosine minus 1, sine 0. The ci"
- **record** · scene 10.67s, clip 9.874s, tail 0.79s · 1@0.73s  1@3.00s  1@6.34s
  - "Radius 1 is what makes it work: the hypotenuse is 1, so the ratios ARE the coordinates. Radius 1: the point's coordinates ARE (cos, sin)."

### cur-unit-circle-values (Trig)
- **ask** · scene 11.37s, clip 10.58s, tail 0.79s · 0@2.35s  90@3.11s  180@3.89s  270@4.82s
  - "Four compass points on the unit circle: 0, 90, 180 and 270 degrees. Their sine and cosine you shouldn't have to compute — you should SEE the"
- **work** · scene 15.77s, clip 14.968s, tail 0.80s · 0@0.44s  1@2.16s  0@2.47s  1@4.26s  0@5.08s  90@6.30s  0@7.37s  1@7.99s  180@9.10s  1@10.72s  0@11.08s  270@12.20s  0@13.35s  1@14.19s
  - "At 0 degrees the point is at 1, 0 — so cosine is 1, sine is 0. At 90, the point is 0, 1. At 180… minus 1, 0. And at 270… 0, minus 1."
- **twist** · scene 13.97s, clip 13.166s, tail 0.80s · 1@3.71s  0@4.14s  1@5.26s  0@5.72s  0@7.79s  1@8.31s  0@8.80s  1@9.85s
  - "See the pattern. Cosine is just the x coordinate: 1, 0, minus 1, 0. Sine is the y: 0, 1, 0, minus 1. The values trace the circle itself."
- **record** · scene 9.67s, clip 8.856s, tail 0.81s · (no alignment)
  - "Don't memorise blind — read the point. Its coordinates ARE cosine and sine. Read the values off the axes, not from memory."

### cur-deg-radians (Trig)
- **ask** · scene 13.50s, clip 12.696s, tail 0.80s · 1@11.49s
  - "Degrees aren't the only way to measure an angle. Take the radius itself… bend it… and lay it along the rim of the circle. The angle that arc"
- **work** · scene 14.43s, clip 13.636s, tail 0.80s · 3@4.91s  180@7.98s
  - "Keep laying radius-lengths along the circle. Halfway round takes a little more than 3 of them — exactly pi of them. So 180 degrees equals pi"
- **twist** · scene 13.53s, clip 12.748s, tail 0.79s · 90@2.60s  180@4.12s  2@5.84s  60@6.37s  3@9.06s  360@10.59s  2@11.59s
  - "Everything else is a fraction of it. 90 degrees is half of 180… pi over 2. 60 degrees is a third… pi over 3. And all the way round, 360… 2 p"
- **record** · scene 14.20s, clip 13.401s, tail 0.80s · 180@3.30s  180@7.78s  180@10.90s
  - "To convert any angle, multiply by pi over 180. Degrees to radians is one fact wearing different fractions: 180 degrees is pi. One fact does "

### cur-trig-identities (Trig)
- **ask** · scene 14.93s, clip 14.132s, tail 0.80s · 1@5.34s  1@11.19s
  - "The point on the unit circle sits at cosine, sine. And EVERY point on a radius-1 circle obeys one equation: x squared plus y squared equals "
- **work** · scene 13.40s, clip 12.591s, tail 0.81s · 1@4.50s
  - "Swap the names in: cosine squared plus sine squared equals 1. That's the Pythagorean identity — not a rule to memorise, but the circle's own"
- **twist** · scene 12.53s, clip 11.729s, tail 0.80s · 1@5.33s  1@7.14s
  - "And it breeds more. Divide everything by cosine squared… and out falls: 1 plus tangent squared equals 1 over cosine squared. One circle, a w"
- **record** · scene 13.67s, clip 12.878s, tail 0.79s · 1@7.84s
  - "When you forget an identity, don't guess — go back to the circle. The point at cosine, sine… radius 1. Everything grows from there. Forget o"

### cur-classify-poly (Poly)
- **ask** · scene 10.73s, clip 9.927s, tail 0.81s · 3@0.00s  2@1.42s  5@2.21s
  - "3 x squared, plus 2 x, minus 5. This is a polynomial — a sum of building blocks called TERMS. Classifying it takes two moves: count… and ran"
- **work** · scene 15.77s, clip 14.968s, tail 0.80s · 3@4.63s  2@6.49s  5@8.10s
  - "First, count. Split it at the plus and minus signs. Term one: 3 x squared. Term two: 2 x. Term three: 5. Three terms — that makes it a TRINO"
- **twist** · scene 16.47s, clip 15.673s, tail 0.79s · 2@3.99s  1@4.82s  0@5.70s  2@9.64s
  - "Now rank. Look at each term's exponent on x: 2… then 1… then 0. The BIGGEST exponent is the DEGREE. Here, degree 2 — a quadratic. The degree"
- **record** · scene 15.70s, clip 14.916s, tail 0.78s · 3@4.62s  2@6.34s  5@7.51s  2@9.65s
  - "Count the terms for its name. Take the biggest exponent for its degree. 3 x squared, plus 2 x, minus 5: a trinomial of degree 2. Count the t"

### cur-add-poly (Poly)
- **ask** · scene 11.90s, clip 11.102s, tail 0.80s · 3@2.25s  2@3.60s  1@4.50s  4@7.27s  2@8.06s
  - "Add two polynomials: 3 x squared, plus 2 x, plus 1… and x squared, plus 4 x, plus 2. Looks heavy. It's actually just sorting."
- **work** · scene 20.07s, clip 19.252s, tail 0.81s · 3@13.54s  1@13.98s  4@14.55s  2@15.51s  4@15.93s  6@16.42s  1@17.47s  2@17.93s  3@18.51s
  - "Picture every term as a tile. Big squares for x squared… bars for x… dots for plain numbers. Pour both polynomials onto the table, and sort "
- **twist** · scene 15.87s, clip 15.073s, tail 0.79s · 4@10.44s  6@11.66s
  - "And that's the one rule of the whole topic: only LIKE terms combine. A square can never merge with a bar — x squared and x are different sha"
- **record** · scene 13.43s, clip 12.643s, tail 0.79s · 4@1.01s  6@2.84s  3@4.05s
  - "The sum: 4 x squared, plus 6 x, plus 3. Sort by shape, add what matches, leave the rest alone. Only like terms combine — sort by shape, add "

### cur-multiply-poly (Poly)
- **ask** · scene 10.97s, clip 10.162s, tail 0.80s · 2@1.86s  3@3.67s
  - "Multiply x plus 2… by x plus 3. Here's the picture that keeps it honest: a rectangle whose sides are exactly those lengths."
- **work** · scene 24.20s, clip 23.406s, tail 0.79s · 2@3.85s  3@6.63s  3@15.20s  3@16.39s  2@17.96s  2@19.67s  2@20.80s  3@21.51s  6@22.50s
  - "Split the sides. Along the top: x, then 2. Down the side: x, then 3. That cuts the rectangle into four rooms. x times x… x squared. x times "
- **twist** · scene 14.80s, clip 14.002s, tail 0.80s · 3@2.39s  2@3.10s  5@5.05s  6@6.25s  5@8.50s  6@9.40s
  - "Collect the rooms. The x squared. Then 3 x and 2 x — like terms — together 5 x. And the 6. The product: x squared, plus 5 x, plus 6. Every t"
- **record** · scene 8.73s, clip 7.941s, tail 0.79s · (no alignment)
  - "Multiply every term by every term… then combine the like ones. Every term multiplies every term — the rectangle can't miss one."

### cur-factoring (Poly)
- **ask** · scene 11.07s, clip 10.266s, tail 0.80s · 5@1.66s  6@2.75s
  - "x squared, plus 5 x, plus 6. Factoring asks: which two brackets MULTIPLY to make this? It's the rectangle puzzle… run backwards."
- **work** · scene 13.90s, clip 13.113s, tail 0.79s · 6@2.44s  5@3.85s  6@6.06s  1@6.79s  6@7.25s  7@8.50s  2@10.05s  3@10.40s  5@11.52s
  - "You're hunting two numbers that MULTIPLY to 6, and ADD to 5. Walk the factor pairs of 6. 1 and 6: they add to 7… no. 2 and 3: they add to 5."
- **twist** · scene 15.07s, clip 14.263s, tail 0.80s · 2@1.66s  3@3.35s  3@7.79s  2@8.59s  6@9.37s  5@11.55s  6@12.33s
  - "So the brackets are x plus 2… and x plus 3. Don't trust it — CHECK it. Rebuild the rectangle: x squared… 3 x… 2 x… 6. Collect: x squared plu"
- **record** · scene 10.73s, clip 9.927s, tail 0.81s · (no alignment)
  - "Multiply to the last number… add to the middle one. Find that pair, and the brackets write themselves. Multiply to the last number, add to t"

### cur-factor-trinomial-a (Factor)
- **ask** · scene 16.80s, clip 15.987s, tail 0.81s · 2@0.70s  7@2.68s  6@4.13s  2@14.61s
  - "Factor 2 x squared, plus 7 x, plus 6. The old method was: find two numbers that multiply to the last one and add to the middle one. Try it h"
- **work** · scene 20.07s, clip 19.278s, tail 0.79s · 2@3.92s  6@4.62s  12@5.24s  12@8.70s  7@9.67s  12@11.52s  1@12.05s  12@12.45s  13@13.32s  2@15.09s  6@15.70s  8@16.54s  3@17.26s  4@17.64s  7@18.25s
  - "One extra step fixes it. Multiply a by c: 2 times 6 is 12. NOW hunt two numbers that multiply to 12 and add to 7. Walk the pairs of 12: 1 an"
- **twist** · scene 32.57s, clip 31.765s, tail 0.80s · 7@2.79s  3@4.08s  4@5.07s  2@7.81s  3@9.29s  4@10.39s  6@11.27s  2@18.75s  3@19.85s  2@22.74s  2@24.24s  2@25.08s  3@26.06s
  - "Use them to SPLIT the middle term. 7 x becomes 3 x plus 4 x, so you have four terms: 2 x squared, plus 3 x, plus 4 x, plus 6. Now group in p"
- **record** · scene 14.50s, clip 13.714s, tail 0.79s · 2@2.31s  3@3.39s  2@5.24s
  - "So it factors to, bracket, 2 x plus 3, bracket, x plus 2. Multiply a by c, split the middle, then group. Multiply a by c first - then the ol"

### cur-difference-squares (Factor)
- **ask** · scene 7.67s, clip 6.87s, tail 0.80s · 16@1.61s
  - "Factor x squared minus 16. Something is missing — there is no x term at all. That absence is the clue."
- **work** · scene 18.20s, clip 17.398s, tail 0.80s · 16@3.27s  4@5.65s  4@6.44s  16@6.97s  4@15.44s  4@16.71s
  - "Check what you have: x squared is a square, and 16 is a square, because 4 times 4 is 16. Two squares, with a MINUS between them. That patter"
- **twist** · scene 21.33s, clip 20.532s, tail 0.80s · 4@6.24s  4@6.78s  4@8.23s  4@10.02s  4@11.54s  4@12.20s  16@13.13s
  - "Multiply it back and watch why the x term is missing. x times x is x squared. x times 4 is 4 x. Minus 4 times x is minus 4 x. And minus 4 ti"
- **record** · scene 16.53s, clip 15.726s, tail 0.81s · 16@6.72s  4@8.64s  4@10.25s
  - "A square, minus a square, factors into the two roots subtracted and added. x squared minus 16 is x minus 4, times x plus 4. Two squares with"

### cur-perfect-square-trinomial (Factor)
- **ask** · scene 11.67s, clip 10.867s, tail 0.80s · 6@1.75s  9@2.74s
  - "Factor x squared, plus 6 x, plus 9. You could hunt for two numbers as usual — but this one has a shape worth spotting, because it saves you "
- **work** · scene 14.33s, clip 13.531s, tail 0.80s · 9@7.80s  3@9.69s  3@12.04s
  - "Two checks. Is the first term a square? x squared — yes, its root is x. Is the last term a square? 9 — yes, its root is 3. So the candidate "
- **twist** · scene 26.17s, clip 25.365s, tail 0.80s · 3@8.26s  2@10.15s  3@10.76s  6@12.12s  6@14.70s  3@18.79s
  - "Now the check that actually decides it. In a perfect square the middle term must be TWICE the two roots multiplied. The roots are x and 3. T"
- **record** · scene 13.27s, clip 12.46s, tail 0.81s · 3@6.50s
  - "Both ends square, and the middle twice the roots multiplied. Then it is a perfect square: x plus 3, squared. Middle term is TWICE the roots "

### cur-factor-grouping (Factor)
- **ask** · scene 12.83s, clip 12.042s, tail 0.79s · 3@2.03s  2@3.45s  6@4.43s
  - "Factor x cubed, plus 3 x squared, plus 2 x, plus 6. Four terms this time. And nothing divides into all four, so there is no common factor to"
- **work** · scene 25.53s, clip 24.738s, tail 0.80s · 3@8.07s  2@10.44s  6@11.04s  3@19.16s  2@21.19s  2@22.29s  3@23.94s
  - "So stop trying to factor all four at once, and split them into two pairs. First pair: x cubed plus 3 x squared. Second pair: 2 x plus 6. Fac"
- **twist** · scene 21.90s, clip 21.107s, tail 0.79s · 3@4.35s  3@13.06s  2@16.00s
  - "Look at what appeared. Both pairs left behind the SAME bracket: x plus 3. That is not luck — it is the signal that grouping has worked. So t"
- **record** · scene 12.10s, clip 11.311s, tail 0.79s · (no alignment)
  - "Four terms, no common factor: pair them, factor each pair, and the matching bracket comes out. Four terms, no common factor - so pair them a"

### cur-cubes (Factor)
- **ask** · scene 12.33s, clip 11.546s, tail 0.79s · 8@1.66s  8@5.63s  2@6.41s  2@7.09s  2@7.67s  8@8.09s
  - "Factor x cubed plus 8. Both parts are cubes: x cubed obviously, and 8 because 2 times 2 times 2 is 8. A sum of cubes has its own formula."
- **work** · scene 20.50s, clip 19.696s, tail 0.80s · 2@2.50s  2@6.84s  2@18.11s  4@18.97s
  - "Take the cube roots: x, and 2. The first bracket is simply those two added: x plus 2. The second bracket is built from the same two numbers,"
- **twist** · scene 34.80s, clip 33.985s, tail 0.81s · 2@23.32s  2@26.96s  4@28.19s
  - "Now the signs, and there is a word for them: SOAP. Same, Opposite, Always Positive. The first bracket takes the SAME sign as the question — "
- **record** · scene 16.80s, clip 15.987s, tail 0.81s · (no alignment)
  - "Cube roots first, then Same, Opposite, Always Positive. And notice the middle term is never doubled — that is what separates this from a per"

### cur-perfect-squares (Quad)
- **ask** · scene 6.07s, clip 5.277s, tail 0.79s · 36@0.45s
  - "Is 36 a perfect square? The name gives the answer away, if you take it literally."
- **work** · scene 18.27s, clip 17.476s, tail 0.79s · 36@7.96s  6@9.24s  6@10.11s  36@15.43s
  - "A perfect square is a number of things you can arrange into an actual square — same number of rows as columns. Try it with 36. 6 rows of 6.."
- **twist** · scene 17.87s, clip 17.058s, tail 0.81s · 36@7.98s  6@8.90s  6@9.89s  6@10.68s  36@11.31s
  - "And that is what a square ROOT asks: not "what is the area", but "how long is the side". The square root of 36 is 6, because 6 times 6 is 36"
- **record** · scene 12.80s, clip 11.99s, tail 0.81s · 6@0.00s  36@1.11s  36@3.06s  6@3.84s
  - "6 squared is 36, so the square root of 36 is 6. Squaring gives the area; rooting gives the side. A perfect square really is a square you can"

### cur-solve-x2-k (Quad)
- **ask** · scene 8.87s, clip 8.072s, tail 0.79s · 9@1.93s  3@3.51s
  - "Solve x squared equals 9. Most people say 3 straight away — and they are right, but they are only half right."
- **work** · scene 13.50s, clip 12.696s, tail 0.80s · 3@0.48s  3@0.91s  9@1.74s  3@4.32s  3@5.45s  3@6.48s  9@10.43s
  - "Check 3: 3 squared is 9. That works. Now check negative 3. negative 3 times negative 3... a negative times a negative is a positive, so that"
- **twist** · scene 20.23s, clip 19.435s, tail 0.80s · 3@2.43s  3@3.71s  9@5.40s  3@13.92s
  - "Squaring throws the sign away. 3 and negative 3 both land on 9, so when you undo it there is no way to tell which one you started from — and"
- **record** · scene 13.43s, clip 12.643s, tail 0.79s · 9@1.33s  3@3.89s
  - "x squared equals 9 gives x equals plus or minus 3. Take the square root of both sides, and write BOTH answers. Squaring hides the sign, so t"

### cur-simplify-roots (Quad)
- **ask** · scene 9.23s, clip 8.438s, tail 0.80s · 8@1.81s  8@2.44s
  - "Simplify the square root of 8. 8 is not a perfect square, so this will not come out as a whole number — but it can still be tidied."
- **work** · scene 13.77s, clip 12.983s, tail 0.78s · 8@2.51s  1@4.42s  8@4.88s  2@5.51s  4@5.97s  4@6.94s  8@9.80s  4@10.90s  2@12.27s
  - "Look for a perfect square hiding inside 8. Its factor pairs: 1 and 8, then 2 and 4. And 4 IS a perfect square. So write the root of 8 as the"
- **twist** · scene 21.13s, clip 20.323s, tail 0.81s · 4@1.14s  2@2.55s  2@6.56s  2@10.80s  2@11.38s  8@14.68s  2@15.67s  8@16.31s  2@17.26s  2@17.86s
  - "Now the root of 4 is exactly 2, so it walks out from under the root sign. The root of 2 has no square factors left, so it stays. The answer "
- **record** · scene 11.20s, clip 10.397s, tail 0.80s · 8@5.62s  2@6.11s  2@6.76s
  - "Split off the biggest perfect square, take its root outside, leave the rest under. Root 8 is 2 root 2. Split off the biggest perfect square,"

### cur-zero-product (Quad)
- **ask** · scene 10.50s, clip 9.691s, tail 0.81s · 3@2.29s  5@3.98s
  - "Solve, bracket, x minus 3, bracket, x minus 5, equals zero. Two things multiplied together give zero. What does that force?"
- **work** · scene 19.47s, clip 18.678s, tail 0.79s · 12@4.78s  3@7.54s  4@7.99s  2@8.46s  6@8.78s
  - "Think about ordinary numbers. If two numbers multiply to make 12, you know almost nothing — it could be 3 and 4, or 2 and 6. But if two numb"
- **twist** · scene 20.23s, clip 19.435s, tail 0.80s · 3@3.26s  3@5.53s  5@7.42s  5@9.22s  3@11.74s  5@12.18s  12@16.78s
  - "So one of the brackets is zero. Either x minus 3 is zero, which means x is 3. Or x minus 5 is zero, which means x is 5. Two brackets, two an"
- **record** · scene 12.67s, clip 11.86s, tail 0.81s · 3@6.76s  5@7.40s
  - "A product is zero only if a factor is zero. Set each bracket to zero in turn. x equals 3, or 5. Zero is the only number that forces a factor"

### cur-solve-factoring (Quad)
- **ask** · scene 8.27s, clip 7.471s, tail 0.80s · 9@1.80s  18@2.61s
  - "Solve x squared minus 9 x plus 18 equals zero. It is already set to zero, which is exactly the shape you need."
- **work** · scene 17.97s, clip 17.162s, tail 0.80s · 18@3.47s  9@5.11s  3@11.81s  6@12.20s  3@12.64s  6@13.23s  18@13.71s  3@14.44s  6@15.09s  9@15.58s
  - "Factor the left side. Hunt two numbers that MULTIPLY to 18 and ADD to 9. Both signs come out negative, since they multiply to a positive and"
- **twist** · scene 20.30s, clip 19.487s, tail 0.81s · 3@2.90s  6@4.53s  3@10.18s  6@11.41s  3@13.80s  9@14.66s  9@15.54s  3@16.02s  27@16.65s  18@17.53s
  - "So it factors to, bracket, x minus 3, bracket, x minus 6, equals zero. Now the zero-product property finishes it: x is 3, or x is 6. Check t"
- **record** · scene 12.60s, clip 11.807s, tail 0.79s · 3@6.05s  6@6.68s
  - "Zero on one side, factor the other, then set each bracket to zero. x equals 3 or 6. Get zero on one side, factor, then read off the roots."

### cur-discriminant (Quad)
- **ask** · scene 9.83s, clip 9.038s, tail 0.80s · 4@1.33s  6@2.39s
  - "x squared plus 4 x plus 6 equals zero. Before you spend any time solving it, you can find out whether it HAS a solution at all."
- **work** · scene 18.93s, clip 18.129s, tail 0.80s · 4@6.63s  1@8.49s  4@9.63s  6@10.61s  16@12.60s  4@13.73s  24@14.40s  16@15.55s  24@16.38s  8@17.41s
  - "The discriminant is the part of the quadratic formula that lives under the square root: b squared minus 4 a c. Here a is 1, b is 4, c is 6. "
- **twist** · scene 24.70s, clip 23.902s, tail 0.80s · (no alignment)
  - "Negative. And that number sits under a square root — you cannot take the square root of a negative and get a real number. So there are NO re"
- **record** · scene 14.63s, clip 13.845s, tail 0.79s · 4@1.38s  8@8.21s
  - "b squared minus 4 a c: positive gives two solutions, zero gives one, negative gives none. Here it is negative 8, so there are no real soluti"

### cur-two-step-minus (LinEq)
- **ask** · scene 13.17s, clip 12.382s, tail 0.78s · 3@0.00s  4@1.24s  11@2.01s  3@5.55s  4@6.58s
  - "3 x minus 4 equals 11. Two things have happened to x: it was multiplied by 3, and then 4 was taken off. To get x back on its own, you undo b"
- **work** · scene 22.47s, clip 21.656s, tail 0.81s · 4@11.92s  4@14.51s  11@17.25s  4@17.89s  15@18.23s  3@19.42s  15@20.52s
  - "Think about getting dressed. Socks first, then shoes. To undo it you take the shoes off first — the LAST thing done is the FIRST thing undon"
- **twist** · scene 17.90s, clip 17.11s, tail 0.79s · 3@2.77s  3@4.12s  15@5.94s  3@7.40s  5@7.96s  5@9.46s  3@11.12s  5@11.84s  15@12.37s  4@13.78s  11@14.43s
  - "One step left. x is multiplied by 3, so divide by 3 — both sides again. 15 divided by 3 is 5. x equals 5. And check it, always: 3 times 5 is"
- **record** · scene 13.13s, clip 12.33s, tail 0.80s · (no alignment)
  - "Undo the adding and subtracting first, then the multiplying and dividing. Reverse order, both sides, every time. Undo in reverse order - the"

### cur-distribute-equation (LinEq)
- **ask** · scene 12.53s, clip 11.729s, tail 0.80s · 3@0.00s  4@2.24s  21@3.32s
  - "3, bracket, x plus 4, equals 21. Most people reach straight for the distributive property here. You can — but there is something quicker sit"
- **work** · scene 20.70s, clip 19.905s, tail 0.79s · 3@5.04s  3@7.56s  21@10.36s  3@11.73s  7@12.32s  4@15.08s  7@15.87s  4@16.97s  3@19.12s
  - "Look at what the bracket IS: one lump, and it has been multiplied by 3. So divide both sides by 3 and the bracket is free. 21 divided by 3 i"
- **twist** · scene 21.07s, clip 20.271s, tail 0.80s · 3@3.88s  3@5.17s  3@6.22s  4@6.87s  12@7.30s  3@8.39s  12@9.33s  21@10.26s  12@11.63s  3@13.51s  9@14.64s  3@16.00s  3@17.20s
  - "Now do it the other way, to prove they agree. Expand: 3 times x is 3 x, and 3 times 4 is 12. So 3 x plus 12 equals 21. Take 12 off both side"
- **record** · scene 15.00s, clip 14.184s, tail 0.82s · (no alignment)
  - "If the number outside divides the number on the right neatly, divide FIRST — it is fewer steps and fewer mistakes. If it does not, expand in"

### cur-both-sides (LinEq)
- **ask** · scene 11.73s, clip 10.945s, tail 0.79s · 5@0.00s  2@1.14s  2@1.95s  11@2.68s
  - "5 x plus 2 equals 2 x plus 11. There are x's on both sides now, and that feels like a new kind of problem. It is not. It is the same balance"
- **work** · scene 20.23s, clip 19.435s, tail 0.80s · 2@8.75s  5@11.54s  2@12.89s  3@14.08s  2@16.06s  11@18.19s
  - "You have been moving numbers across for ages: take the same amount off both sides, and the balance holds. x's are no different. Take 2 x off"
- **twist** · scene 15.10s, clip 14.315s, tail 0.79s · 3@0.42s  2@1.22s  11@1.83s  2@5.68s  11@7.33s  2@8.12s  9@8.54s  3@9.57s  9@10.67s  3@12.07s  3@13.56s
  - "So 3 x plus 2 equals 11. Now it is an ordinary two-step equation. Take 2 off both sides: 11 minus 2 is 9, so 3 x equals 9. Divide by 3: x eq"
- **record** · scene 18.40s, clip 17.607s, tail 0.79s · 5@6.57s  3@7.41s  2@8.12s  2@8.94s  3@9.65s  11@10.29s  17@12.18s
  - "Collect the x's on one side and the plain numbers on the other, then finish as normal. Check it: 5 times 3 plus 2, and 2 times 3 plus 11 — b"

### cur-fraction-equation (LinEq)
- **ask** · scene 13.27s, clip 12.46s, tail 0.81s · 4@0.78s  6@1.50s  4@8.86s  6@11.57s
  - "x over 4 equals 6. A fraction in an equation looks like trouble, but read what it actually says: some number, cut into 4 equal parts, and on"
- **work** · scene 15.07s, clip 14.263s, tail 0.80s · 4@3.80s  6@4.26s  4@5.62s  6@6.36s  4@11.09s  4@13.60s
  - "Said that way you can almost answer it out loud. If one part out of 4 is 6, then the whole thing is 4 lots of 6. And that is exactly what th"
- **twist** · scene 19.03s, clip 18.233s, tail 0.80s · 4@1.82s  4@3.60s  4@5.14s  6@9.67s  4@10.45s  24@11.08s  24@13.28s  24@15.20s  4@16.48s  6@16.88s
  - "Multiply both sides by 4. On the left, the 4 on the bottom and the 4 you multiplied by cancel — leaving just x. On the right, 6 times 4 is 2"
- **record** · scene 12.43s, clip 11.624s, tail 0.81s · 4@4.61s  6@5.33s  24@6.79s  4@8.86s  4@10.89s
  - "Dividing is undone by multiplying, on BOTH sides. x over 4 equals 6 means x equals 24. Divided by 4 is undone by multiplying by 4."

### cur-transformations (LinEq)
- **ask** · scene 12.23s, clip 11.442s, tail 0.79s · 3@0.66s  2@1.26s
  - "The point 3, 2. A transformation moves it somewhere new — but never randomly. Each one is a rule you can apply to the two coordinates, and t"
- **work** · scene 26.53s, clip 25.731s, tail 0.80s · 3@10.66s  2@14.29s  2@15.93s  3@17.58s  2@18.55s  3@24.24s  2@24.94s
  - "First, reflect across the x axis. The x axis is a mirror lying flat. Across is a straight drop, so the across-value does not change — still "
- **twist** · scene 25.63s, clip 24.842s, tail 0.79s · 2@5.40s  1@6.99s  3@9.17s  2@9.72s  5@10.03s  2@10.94s  1@11.81s  1@12.13s  5@13.29s  1@13.96s  3@22.32s  2@22.65s  2@23.72s  3@24.02s
  - "Second, translate — a slide, with no turning and no flipping. Slide by 2 across and negative 1 up: just add them on. 3 plus 2 is 5, and 2 pl"
- **record** · scene 11.93s, clip 11.128s, tail 0.81s · (no alignment)
  - "Reflect flips one coordinate. Translate adds to both. A quarter turn swaps them and changes a sign. Every transformation is one rule applied"

### cur-evaluate-expr (PreAlg)
- **ask** · scene 14.20s, clip 13.401s, tail 0.80s · 7@0.94s  7@7.95s
  - "x plus 7. That is not a puzzle with one answer — it is a RULE. It says: take a number, and add 7 to it. Until someone tells you what x is, t"
- **work** · scene 13.90s, clip 13.113s, tail 0.79s · 4@1.79s  4@7.40s  7@9.40s  4@10.36s  7@11.09s  11@12.20s
  - "So here it comes: x is 4. Now the letter has a value, and you can swap it in. Wherever you see x, write 4 instead. x plus 7 becomes 4 plus 7"
- **twist** · scene 17.17s, clip 16.353s, tail 0.81s · 10@5.26s  7@8.68s  10@10.72s  7@11.40s  17@11.87s
  - "Now watch what makes this different from ordinary sums. Change x. Say x is 10. The rule has not changed at all — still add 7 — but the answe"
- **record** · scene 14.10s, clip 13.296s, tail 0.80s · 7@6.00s  4@7.30s  3@8.56s
  - "Substitute, then work it out. A minus behaves exactly the same way: x minus 7, when x is 4, is negative 3. An expression is a rule - feed it"

### cur-evaluate-product (PreAlg)
- **ask** · scene 9.20s, clip 8.385s, tail 0.81s · 3@0.00s
  - "3 x. Two symbols squashed together with no sign between them — and that is exactly what makes people read it wrong."
- **work** · scene 16.13s, clip 15.334s, tail 0.80s · 3@1.20s  3@3.33s  3@9.75s  3@11.02s
  - "It does not mean 3 next to x, and it does not mean 3 PLUS x. When a number sits against a letter, the multiply sign is simply hidden. 3 x me"
- **twist** · scene 13.13s, clip 12.33s, tail 0.80s · 4@1.11s  3@2.31s  4@3.69s  4@4.92s  8@5.63s  12@6.34s  10@8.28s  3@9.47s  10@10.30s  30@11.51s
  - "So let x be 4. That gives you 3 groups, each holding 4. Count them: 4... 8... 12. And if x were 10, you would have 3 groups of 10 — that is "
- **record** · scene 9.40s, clip 8.594s, tail 0.81s · 3@2.47s  4@3.85s  12@4.25s  3@4.71s  3@5.33s
  - "A number touching a letter means multiply. 3 x, when x is 4, is 12. 3x is 3 TIMES x - the multiply sign is just hiding."

### cur-like-terms (PreAlg)
- **ask** · scene 8.33s, clip 7.549s, tail 0.78s · 3@0.87s  2@1.75s
  - "Simplify 3 x plus 2 x. It looks like algebra, but you already know how to do it — you just have to see what x really is."
- **work** · scene 20.30s, clip 19.487s, tail 0.81s · 3@3.20s  3@3.94s  2@5.28s  2@6.01s  3@9.08s  2@10.24s  5@11.46s  3@12.60s  2@13.73s  5@14.57s
  - "Treat x as a THING. A box. 3 x is 3 boxes. 2 x is 2 boxes. Push them together and you are holding 3 boxes plus 2 boxes... 5 boxes. So 3 x pl"
- **twist** · scene 17.03s, clip 16.222s, tail 0.81s · 3@2.98s  2@3.96s  2@5.18s  2@5.83s  2@7.17s  3@10.08s  2@10.97s  3@11.84s  2@12.70s
  - "Now the part that catches people out. What about 3 x plus 2? A plain 2 is not 2 boxes — it is just 2. Different things do not combine. 3 x p"
- **record** · scene 12.10s, clip 11.311s, tail 0.79s · (no alignment)
  - "Only terms with the same letter add together. Add the numbers in front, keep the x. Count the x's. Plain numbers are a different thing entir"

### cur-distribute (PreAlg)
- **ask** · scene 9.70s, clip 8.908s, tail 0.79s · 3@0.77s  4@2.21s  3@3.26s
  - "Expand 3, bracket, x plus 4. It means 3 lots of everything inside — and the way to never forget the second bit is to draw it."
- **work** · scene 18.00s, clip 17.189s, tail 0.81s · 3@1.41s  4@3.61s  4@9.16s  3@12.09s  3@13.63s  3@15.04s  4@15.67s  12@16.39s
  - "Picture a rectangle 3 tall. Its width is x plus 4, so cut the width into two pieces: a piece of length x, and a piece of length 4. Two rooms"
- **twist** · scene 21.67s, clip 20.872s, tail 0.79s · 3@1.20s  12@2.06s  5@4.68s  5@6.65s  4@7.20s  9@7.69s  3@8.29s  9@8.96s  27@9.46s  3@11.71s  5@12.25s  15@12.69s  12@13.76s  27@14.86s  27@16.21s
  - "Add the rooms: 3 x plus 12. Now check it. Let x be 5. The original: 5 plus 4 is 9, and 3 times 9 is 27. The expansion: 3 times 5 is 15, plus"
- **record** · scene 13.27s, clip 12.46s, tail 0.81s · 3@4.50s  4@6.26s  3@7.07s  12@8.16s
  - "The number outside multiplies EVERY term inside. 3, bracket, x plus 4, is 3 x plus 12. The number outside reaches every term inside."

### cur-one-step-times (PreAlg)
- **ask** · scene 10.07s, clip 9.273s, tail 0.79s · 4@0.66s  12@1.67s  4@4.32s  12@6.12s
  - "Solve 4 x equals 12. Read it as a sentence first: 4 identical boxes weigh 12 altogether. What is in one box?"
- **work** · scene 13.53s, clip 12.748s, tail 0.79s · 4@1.93s  12@4.37s
  - "Picture a balance. On the left, 4 boxes, all the same. On the right, 12. It is level, so the two sides really are equal — and they will stay"
- **twist** · scene 17.13s, clip 16.327s, tail 0.81s · 4@1.81s  12@6.47s  4@7.75s  3@8.53s  3@10.31s  3@11.97s  4@13.33s  3@14.06s  12@14.56s
  - "So share both sides into 4 equal parts. The left becomes one box. The right, 12 shared between 4, is 3. One box holds 3. x equals 3. Check i"
- **record** · scene 9.90s, clip 9.091s, tail 0.81s · 4@1.52s  4@2.97s
  - "x was multiplied by 4, so divide by 4 to undo it — on BOTH sides. Whatever you do to one side, do to the other."

### cur-integer-add-sub (PreAlg)
- **ask** · scene 11.13s, clip 10.344s, tail 0.79s · 1@0.71s  4@1.64s
  - "negative 1, minus 4. Negative numbers feel strange on paper. On a number line they stop being strange, because plus and minus turn into dire"
- **work** · scene 13.53s, clip 12.748s, tail 0.79s · 1@9.60s  1@10.31s
  - "Here is the rule, and it is the whole topic. Plus means walk RIGHT. Minus means walk LEFT. And you always start standing on the first number"
- **twist** · scene 20.83s, clip 20.036s, tail 0.80s · 4@3.66s  4@5.94s  2@8.03s  3@9.52s  4@10.67s  5@11.95s  5@13.94s
  - "Now the minus tells you which way: left. And the 4 tells you how far. Walk 4 steps left. negative 2... negative 3... negative 4... negative "
- **record** · scene 12.83s, clip 12.042s, tail 0.79s · 1@0.69s  4@1.39s  5@2.54s
  - "negative 1 minus 4 is negative 5. Stand on the first number, let the sign point the way, and walk. Plus walks right, minus walks left - star"

### cur-poly-anatomy (PolyOps)
- **ask** · scene 11.50s, clip 10.71s, tail 0.79s · 3@0.00s  5@1.60s  2@2.94s
  - "3 x squared, plus 5 x, minus 2. Before you can DO anything to a polynomial, you have to be able to read it — and reading it starts with putt"
- **work** · scene 22.33s, clip 21.525s, tail 0.81s · 3@2.43s  2@4.31s  5@5.26s  1@6.86s  2@9.30s  0@10.48s  2@18.80s  1@19.90s  0@20.83s
  - "Every term carries a power of x. 3 x squared carries exponent 2. 5 x carries exponent 1. And the last term, negative 2? Exponent 0 — it has "
- **twist** · scene 18.83s, clip 18.024s, tail 0.81s · 2@3.08s  3@7.50s  2@12.79s
  - "Now every part has a name. The biggest exponent, 2, is the DEGREE. The number sitting in front of that leading term, 3, is the LEADING COEFF"
- **record** · scene 14.13s, clip 13.349s, tail 0.78s · (no alignment)
  - "Sort by exponent, biggest first. Then the front number is the leading coefficient, the top exponent is the degree, and the lonely number on "

### cur-evaluate-poly (PolyOps)
- **ask** · scene 11.90s, clip 11.102s, tail 0.80s · 3@0.00s  5@1.51s  2@2.57s  2@8.14s
  - "3 x squared, plus 5 x, minus 2. Right now x is a question mark. Evaluating means someone finally tells you: x is 2. So what is the polynomia"
- **work** · scene 13.17s, clip 12.382s, tail 0.78s · 2@1.28s  3@2.69s  2@3.37s  5@4.63s  2@5.27s  2@6.12s  2@8.01s  4@8.77s  3@10.28s  4@10.86s  12@11.59s
  - "Swap every x for 2 — every single one. 3 times 2 squared... plus 5 times 2... minus 2. Powers go first: 2 squared is 4. So that first term i"
- **twist** · scene 14.47s, clip 13.662s, tail 0.80s · 5@0.96s  2@1.59s  10@2.04s  12@3.56s  10@4.32s  2@5.07s  20@5.76s  3@7.35s  2@7.89s  3@9.67s
  - "The middle term: 5 times 2 is 10. Now add them up. 12, plus 10, minus 2... 20. Careful here — 3 times 2 squared does NOT mean square the 3. "
- **record** · scene 15.90s, clip 15.099s, tail 0.80s · 2@7.93s  20@10.09s
  - "Substitute the number in for x, do the powers first, then the multiplying, then the adding. At x equals 2, this polynomial is worth 20. A po"

### cur-subtract-poly (PolyOps)
- **ask** · scene 11.87s, clip 11.05s, tail 0.82s · 5@0.44s  3@1.42s  7@2.18s  2@3.56s  4@4.81s  1@5.64s
  - "Take 5 x squared, plus 3 x, plus 7... and subtract 2 x squared, plus 4 x, plus 1. This is where more marks are lost than anywhere else in th"
- **work** · scene 17.30s, clip 16.509s, tail 0.79s · 2@2.19s  2@10.21s  4@11.90s  1@13.51s  4@14.58s
  - "The minus is not just in front of the 2 x squared. It is in front of the whole BRACKET, so it hits every term inside. Flip them all: minus 2"
- **twist** · scene 18.20s, clip 17.398s, tail 0.80s · 5@5.20s  2@6.21s  3@6.72s  3@8.59s  4@9.51s  1@11.36s  7@15.32s  1@16.18s  6@16.59s
  - "Now it is just adding, and adding is sorting by shape. Squared terms: 5 take away 2 is 3. The x terms: 3 take away 4... negative 1. Yes, neg"
- **record** · scene 15.10s, clip 14.315s, tail 0.79s · 3@1.35s  6@4.03s
  - "The answer: 3 x squared, minus x, plus 6. Give the minus to EVERY term in the second bracket, then combine like terms as usual. The minus ap"

### cur-monomial-multiply (PolyOps)
- **ask** · scene 11.97s, clip 11.18s, tail 0.79s · 3@0.00s  4@1.10s
  - "3 x times 4 x squared. Two single terms — monomials. They multiply, but the coefficients and the exponents behave completely differently."
- **work** · scene 13.87s, clip 13.061s, tail 0.81s · 3@3.32s  4@3.95s  12@4.88s
  - "Split the job in two. The plain numbers out front: 3 times 4, which is 12. Then the x parts. And here is the thing people get wrong — you do"
- **twist** · scene 22.03s, clip 21.238s, tail 0.80s · 3@11.33s  1@17.66s  2@18.31s  3@18.73s  12@19.73s
  - "Write out what the letters actually mean. An x on its own is a single x. x squared is x times x. Push them together and you are multiplying "
- **record** · scene 10.83s, clip 10.031s, tail 0.80s · 3@3.73s  4@4.39s  12@4.81s  1@5.40s  2@5.93s  3@6.25s
  - "Multiply the coefficients, ADD the exponents. 3 times 4 is 12; 1 plus 2 is 3. Coefficients multiply; exponents ADD."

### cur-divide-monomial (PolyOps)
- **ask** · scene 9.43s, clip 8.62s, tail 0.81s · 6@0.00s  4@2.15s  2@4.02s
  - "6 x squared, plus 4 x, all divided by 2 x. One long fraction. The trick is to stop seeing it as one."
- **work** · scene 12.33s, clip 11.546s, tail 0.79s · 6@2.67s  2@4.08s  4@5.79s  2@6.87s
  - "A sum on top can be split up. 6 x squared over 2 x... PLUS 4 x over 2 x. Two small easy divisions instead of one frightening one."
- **twist** · scene 20.50s, clip 19.696s, tail 0.80s · 6@2.02s  2@3.11s  3@3.48s  3@12.22s  4@14.05s  2@15.00s  2@15.39s  2@19.02s
  - "Take the first. Numbers: 6 divided by 2 is 3. Letters: x squared divided by x — cancel one x from the top against one on the bottom, and a s"
- **record** · scene 13.63s, clip 12.826s, tail 0.81s · 3@1.38s  2@2.45s
  - "The answer: 3 x plus 2. Split the fraction term by term, divide the numbers, and SUBTRACT the exponents. Split the fraction term by term, th"

### cur-factor-gcf (PolyOps)
- **ask** · scene 10.40s, clip 9.613s, tail 0.79s · 6@0.00s  9@1.79s
  - "6 x squared, plus 9 x. Factoring out the greatest common factor asks a simple question: what does every term here have in common?"
- **work** · scene 15.83s, clip 15.02s, tail 0.81s · 6@2.42s  9@2.84s  3@3.88s  6@5.48s  9@7.85s  3@13.92s
  - "Check the numbers first. What divides both 6 and 9? 3. Now the letters: 6 x squared has an x in it, and 9 x has an x in it, so both share at"
- **twist** · scene 20.17s, clip 19.383s, tail 0.78s · 6@4.03s  3@5.60s  2@6.77s  9@8.49s  3@9.82s  3@11.36s  2@12.76s  3@13.70s  6@16.01s  9@17.26s
  - "Pull it out to the front and ask what is left behind. From 6 x squared, taking 3 x leaves 2 x. From 9 x, it leaves 3. So the answer is 3 x, "
- **record** · scene 14.10s, clip 13.296s, tail 0.80s · (no alignment)
  - "Find what every term shares — numbers and letters — put it out front, and write what is left in the bracket. Multiply back to check. Factori"

### cur-distribute-monomial (PolyOps)
- **ask** · scene 12.30s, clip 11.494s, tail 0.81s · 5@0.00s  4@2.58s
  - "5 x, bracket, x, plus 4. One term outside, a bracket inside. The outside term has to reach EVERY term in there — and the way to make sure it"
- **work** · scene 21.07s, clip 20.271s, tail 0.80s · 5@0.60s  4@3.77s  5@6.78s  5@12.53s  5@15.21s  4@16.10s  20@16.59s  5@18.08s  20@19.20s
  - "Draw it 5 x tall, with the width split into x and 4. Two rooms. First room: 5 x times x — coefficients multiply, exponents add — that is 5 x"
- **twist** · scene 25.23s, clip 24.424s, tail 0.81s · 3@3.46s  2@4.61s  5@14.35s  15@16.21s  10@18.69s
  - "Now a trinomial: x squared, plus 3 x, plus 2. Three terms inside instead of two. Watch what changes about the method... nothing. The rectang"
- **record** · scene 12.83s, clip 12.042s, tail 0.79s · (no alignment)
  - "One room per term inside. Multiply the coefficients, add the exponents, and never leave a room empty. Every term in the bracket gets multipl"

### cur-long-division (PolyOps)
- **ask** · scene 10.97s, clip 10.162s, tail 0.80s · 5@1.49s  6@2.31s  2@4.03s
  - "x squared, plus 5 x, plus 6, divided by x plus 2. This looks like a new skill. It is the long division you learned with numbers, with x's al"
- **work** · scene 22.57s, clip 21.76s, tail 0.81s · 2@12.11s  2@13.79s  5@18.56s  2@19.76s  3@20.62s
  - "Three steps, on repeat: divide, multiply, subtract. Divide: what times x gives x squared? x. So x is the first piece of the answer. Multiply"
- **twist** · scene 18.03s, clip 17.241s, tail 0.79s · 6@0.80s  3@3.94s  3@4.61s  3@6.08s  2@7.42s  3@7.91s  6@8.81s  2@13.82s  3@16.56s
  - "Bring down the 6, and go round again. Divide: what times x gives 3 x? 3. Multiply: 3 times x plus 2 is 3 x plus 6. Subtract... nothing left."
- **record** · scene 12.43s, clip 11.624s, tail 0.81s · (no alignment)
  - "Divide, multiply, subtract, bring down — then repeat until nothing is left. Same steps as long division with numbers - divide, multiply, sub"

### cur-subtract-fractions (FractionOps)
- **ask** · scene 6.90s, clip 6.087s, tail 0.81s · 5@0.00s  8@0.77s  2@1.49s  8@2.01s
  - "5/8, take away 2/8. The pieces are the SAME size... so this is easier than it looks."
- **parts** · scene 6.00s, clip 5.198s, tail 0.80s · 5@0.50s  8@1.09s  8@2.58s  5@3.84s
  - "Here's 5/8: a bar cut into 8 equal parts, with 5 of them shaded."
- **action** · scene 13.80s, clip 13.009s, tail 0.79s · 2@0.78s  3@6.26s  8@8.51s
  - "Now take 2 of those shaded pieces away... watch them go. Count what's left: 3 pieces. And they're still 8ths - taking pieces away never chan"
- **record** · scene 11.60s, clip 10.815s, tail 0.79s · 5@0.00s  8@0.73s  2@1.35s  8@1.83s  3@2.35s  8@2.97s
  - "5/8 minus 2/8 is 3/8. Same-size pieces: subtract the tops... and the bottom stays. Same-size pieces: subtract the tops, the bottom stays."

### cur-multiply-fractions (FractionOps)
- **ask** · scene 8.93s, clip 8.124s, tail 0.81s · 1@0.00s  2@0.72s  3@1.26s  4@1.75s
  - "1/2 times 3/4. Here's the secret: times means OF. This asks for half OF three quarters."
- **parts** · scene 6.37s, clip 5.564s, tail 0.80s · 3@0.74s  4@1.38s  4@2.95s  3@4.10s
  - "Start with the 3/4: a square cut into 4 columns, with 3 of them shaded."
- **action** · scene 12.60s, clip 11.807s, tail 0.79s · 1@0.74s  2@1.36s  2@3.45s  1@5.28s  3@8.14s  8@10.15s
  - "Now take 1/2 of THAT. Cut everything into 2 rows... and keep just 1 row of the shading. Count: 3 pieces survive, out of 8 in the whole squar"
- **record** · scene 15.60s, clip 14.785s, tail 0.81s · 1@0.45s  2@0.95s  3@1.71s  4@2.23s  3@2.80s  8@3.34s  1@5.18s  3@5.82s  3@6.30s  2@8.74s  4@9.27s  8@9.78s
  - "So 1/2 times 3/4 is 3/8. Tops multiply: 1 times 3 is 3. Bottoms multiply: 2 times 4 is 8. Times means OF - tops multiply, bottoms multiply."

### cur-divide-fractions (FractionOps)
- **ask** · scene 9.83s, clip 9.038s, tail 0.80s · 3@0.00s  4@0.80s  1@1.86s  4@2.39s  1@5.65s  4@6.19s  3@7.79s  4@8.34s
  - "3/4 divided by 1/4. Division asks a fitting question: how many 1/4 pieces fit inside 3/4?"
- **parts** · scene 6.90s, clip 6.087s, tail 0.81s · 3@0.51s  4@1.07s  3@1.79s  1@4.79s  4@5.38s
  - "Here's 3/4: 3 shaded quarters. And here's the measuring piece: a single 1/4."
- **action** · scene 8.83s, clip 8.02s, tail 0.81s · 3@6.84s
  - "Lay the measuring piece onto the shading, and count the fits. One... two... three. It fits exactly 3 times."
- **record** · scene 14.40s, clip 13.584s, tail 0.82s · 3@0.00s  4@0.81s  1@1.82s  4@2.32s  3@2.79s  3@5.69s  4@6.26s  4@6.88s  1@7.48s
  - "3/4 divided by 1/4 is 3. And look: that's the same answer as 3/4 times 4/1 - flip the second fraction, then multiply. Division asks: how man"

### cur-mixed-numbers (FractionOps)
- **ask** · scene 8.27s, clip 7.471s, tail 0.80s · 3@0.64s  4@1.30s
  - "One and 3/4. A whole number and a fraction, written together - that's called a MIXED number. How much is it, really?"
- **parts** · scene 10.50s, clip 9.691s, tail 0.81s · 4@1.32s  1@4.23s  3@6.79s  3@8.36s  4@9.00s
  - "Two bars, cut into 4ths. The first is completely full - that's the 1, a whole bar. The second has 3 parts shaded - that's the 3/4."
- **action** · scene 8.83s, clip 8.02s, tail 0.81s · 4@1.37s  4@3.44s  3@4.95s  7@6.44s  4@6.80s
  - "Now count EVERYTHING in 4ths. The full bar holds 4 of them... plus the 3 in the second bar... 7 4ths altogether."
- **record** · scene 12.70s, clip 11.912s, tail 0.79s · 3@1.04s  4@1.71s  7@3.26s  4@3.92s
  - "So one and 3/4 is the same amount as 7/4. Mixed numbers are for reading; the fraction form is for calculating. A whole and a fraction, livin"

### cur-improper-fractions (FractionOps)
- **ask** · scene 7.90s, clip 7.105s, tail 0.79s · 7@0.00s  4@0.86s
  - "7/4. Look at the top - it's BIGGER than the bottom. Can a fraction be more than a whole? ... It can."
- **parts** · scene 6.00s, clip 3.527s, tail 2.47s · 7@0.59s  4@2.39s
  - "Here are 7 loose pieces, each one a 4th of a bar."
- **action** · scene 9.17s, clip 8.359s, tail 0.81s · 4@1.29s  3@4.87s  3@6.49s
  - "Start filling. 4 of them fill one whole bar, edge to edge... and the 3 left over fill 3 parts of the next bar."
- **record** · scene 13.37s, clip 12.565s, tail 0.80s · 7@0.48s  4@1.24s  1@1.82s  3@2.81s  4@3.53s
  - "So 7/4 is 1 whole and 3/4. A top bigger than the bottom isn't a mistake - it just means more than one whole. Top bigger than bottom just mea"

### cur-order-fractions (FractionOps)
- **ask** · scene 7.30s, clip 6.504s, tail 0.80s · 3@1.08s  8@1.65s  1@2.06s  2@2.55s  3@2.90s  4@3.35s
  - "Three fractions: 3/8, 1/2, and 3/4. Which is smallest... and which is biggest?"
- **parts** · scene 10.83s, clip 10.031s, tail 0.80s · (no alignment)
  - "Give each one a bar - all three bars exactly the same length. Cut each bar by its own bottom number, and shade its top number of parts."
- **action** · scene 11.27s, clip 10.475s, tail 0.79s · 3@2.10s  8@2.75s  1@5.28s  2@5.89s  3@7.63s  4@8.22s
  - "Now just READ the shading. 3/8 reaches the shortest distance... 1/2 reaches further... and 3/4 reaches the furthest of all."
- **record** · scene 15.03s, clip 14.237s, tail 0.80s · 3@1.58s  8@2.26s  1@3.13s  2@3.79s  3@4.59s  4@5.25s
  - "Smallest to biggest: 3/8, then 1/2, then 3/4. Never compare the numbers alone - compare how far the shading reaches. Same-length bars turn o"

### cur-compare-decimals (DecimalOps)
- **ask** · scene 10.07s, clip 9.273s, tail 0.79s · 0@1.16s  3@1.81s  0@2.35s  25@2.87s  0@4.75s  25@5.28s
  - "Which is bigger: 0.3, or 0.25? Careful - 0.25 has MORE digits. Most people guess wrong here."
- **grid** · scene 7.57s, clip 6.766s, tail 0.80s · 0@1.74s  3@2.32s  30@2.67s  100@3.67s  0@4.13s  25@4.64s  25@5.35s
  - "Put each one on a hundred square. 0.3 is 30 cells out of 100. 0.25 is 25 cells."
- **action** · scene 8.93s, clip 8.124s, tail 0.81s · 30@2.04s  25@3.79s
  - "Now look at them side by side. 30 cells... against 25. The one with FEWER digits covers more of the square."
- **record** · scene 12.53s, clip 11.729s, tail 0.80s · 0@0.46s  3@1.07s  0@1.82s  25@2.42s
  - "So 0.3 is bigger than 0.25. Extra digits mean smaller pieces, not a bigger number. More digits does not mean bigger - line them up and look."

### cur-round-decimals (DecimalOps)
- **ask** · scene 4.87s, clip 4.075s, tail 0.79s · 0@0.44s  67@0.86s
  - "Round 0.67 to the nearest tenth. Which tenth is it closest to?"
- **grid** · scene 11.00s, clip 10.214s, tail 0.79s · 0@1.56s  6@2.32s  0@2.79s  7@3.39s  0@7.15s  67@7.80s
  - "Here's a number line from 0.6 to 0.7. Those are the two tenths on either side of it. Now find 0.67 - it sits between them."
- **action** · scene 10.37s, clip 9.561s, tail 0.81s · 0@2.75s  67@3.32s  0@6.91s  7@7.51s  0@8.16s  6@8.73s
  - "Look at the midpoint, halfway between. 0.67 is PAST the middle... so it's nearer to 0.7 than to 0.6."
- **record** · scene 14.10s, clip 13.296s, tail 0.80s · 0@0.44s  67@1.22s  0@2.74s  7@3.53s
  - "So 0.67 rounds to 0.7. Forget the rules about digits - just ask which mark it's nearer to. Which mark is it nearer? That is the whole rule."

### cur-multiply-decimals (DecimalOps)
- **ask** · scene 7.10s, clip 6.296s, tail 0.80s · 0@0.00s  3@0.89s  0@1.46s  4@2.01s
  - "0.3 times 0.4. Here's the surprise: the answer is SMALLER than both of them. Watch why."
- **grid** · scene 6.00s, clip 5.094s, tail 0.91s · 0@1.67s  3@2.35s  3@3.46s  10@4.39s
  - "Take a whole square and shade 0.3 of it - that's 3 columns out of 10."
- **action** · scene 13.20s, clip 12.408s, tail 0.79s · 0@0.79s  4@1.36s  10@4.60s  4@5.90s  12@9.65s  100@11.36s
  - "Now take 0.4 OF that shading. Cut the square the other way into 10 rows, and keep 4 of them. Count where the two shadings overlap: 12 little"
- **record** · scene 13.17s, clip 12.382s, tail 0.78s · 12@0.00s  100@0.77s  0@1.23s  12@1.82s  0@2.69s  3@3.32s  0@3.98s  4@4.66s  0@5.06s  12@5.68s
  - "12 out of 100 is 0.12. So 0.3 times 0.4 is 0.12. Taking a PART of a part always leaves you less. Multiplying by less than one makes it small"

### cur-divide-decimals (DecimalOps)
- **ask** · scene 8.00s, clip 7.184s, tail 0.82s · 0@0.00s  8@0.99s  0@1.82s  2@2.47s  0.2@4.67s  0@5.94s  8@6.55s
  - "0.8 divided by 0.2. Same question as always: how many 0.2s fit inside 0.8?"
- **grid** · scene 8.13s, clip 7.34s, tail 0.79s · 0@0.00s  8@0.87s  80@1.37s  0@3.67s  2@4.25s  20@4.67s
  - "0.8 is 80 cells of the hundred square. And 0.2 is 20 cells - that's the piece we're measuring with."
- **action** · scene 8.00s, clip 6.217s, tail 1.78s · 80@0.78s  20@1.66s  4@5.13s
  - "Now cut the 80 into groups of 20. One... two... three... four. It fits exactly 4 times."
- **record** · scene 14.47s, clip 13.662s, tail 0.80s · 0@0.42s  8@1.08s  0@2.04s  2@2.75s  4@3.16s
  - "So 0.8 divided by 0.2 is 4. Notice the answer is bigger than what you started with - that happens whenever you divide by less than one. Divi"

### cur-add-subtract-decimals (DecimalOps)
- **ask** · scene 13.27s, clip 12.46s, tail 0.81s · 0@0.00s  3@1.06s  0@1.61s  25@2.16s
  - "0.3 plus 0.25. One has a single digit after the point, the other has two - and that is exactly where people go wrong, because they line up t"
- **grid** · scene 17.03s, clip 16.222s, tail 0.81s · 0@1.31s  3@1.96s  30@2.54s  30@4.92s  0@6.34s  25@7.00s  25@7.98s  30@10.36s  25@11.51s
  - "The grid settles it. 0.3 is 30 cells of the hundred square - 30 hundredths. 0.25 is 25 cells. Written as 30 hundredths and 25 hundredths, th"
- **action** · scene 15.17s, clip 14.367s, tail 0.80s · 30@0.00s  25@1.35s  55@2.51s  55@3.95s  0@5.61s  55@6.33s
  - "30 cells plus 25 cells is 55 cells. That is 55 hundredths, which is 0.55. On paper you get there by lining up the decimal POINTS, one under "
- **record** · scene 18.63s, clip 17.842s, tail 0.79s · 0@0.00s  3@0.80s  0@1.43s  25@1.94s  0@2.89s  55@3.47s  30@6.80s  25@8.10s  5@9.23s  0@10.28s  3@10.84s  0@11.56s  25@12.09s  0@12.86s  5@13.39s
  - "0.3 plus 0.25 is 0.55. Subtracting works the same way: 30 cells take away 25 cells is 5 cells, so 0.3 minus 0.25 is 0.05. Line up the decima"

### cur-divide-by-whole (DecimalOps)
- **ask** · scene 12.20s, clip 11.389s, tail 0.81s · 1@0.00s  2@0.79s  3@1.81s  1@8.77s  2@9.30s  3@10.59s
  - "1.2 divided by 3. This one is different from dividing by a decimal. Dividing by a whole number is SHARING: split 1.2 equally between 3."
- **grid** · scene 8.70s, clip 7.889s, tail 0.81s · 1@2.31s  2@2.96s  12@3.48s  12@4.98s
  - "Counting in tenths makes it easy. 1.2 is 12 tenths. And 12 is a number you already know how to share."
- **action** · scene 10.50s, clip 9.691s, tail 0.81s · 12@0.00s  3@1.74s  4@2.32s  4@3.39s  0@4.26s  4@5.05s  1@6.18s  2@6.75s  3@7.70s  0@8.21s  4@8.93s
  - "12 tenths shared between 3 gives 4 tenths each. 4 tenths is 0.4. So 1.2 divided by 3 is 0.4."
- **record** · scene 13.17s, clip 12.382s, tail 0.78s · (no alignment)
  - "Share the tenths, then write the answer in tenths again. The decimal point stays exactly where it was - it does not slide about. Share the t"

### cur-percent-of (DecimalOps)
- **ask** · scene 6.90s, clip 6.113s, tail 0.79s · 20@0.71s  60@1.63s  20@4.30s  60@5.21s
  - "What is 20 percent of 60? Percent means per hundred, so this asks for 20 hundredths of 60."
- **grid** · scene 6.00s, clip 4.676s, tail 1.32s · 60@0.57s  100@1.26s  0@3.19s  6@3.82s
  - "Split 60 into 100 equal shares. Each share is worth 0.6."
- **action** · scene 8.00s, clip 6.452s, tail 1.55s · 20@0.72s  20@2.16s  0@3.52s  6@4.20s  12@5.57s
  - "Now take 20 of those shares. 20 shares, each worth 0.6... that comes to 12."
- **record** · scene 16.37s, clip 15.569s, tail 0.80s · 20@0.37s  60@1.15s  12@1.80s  20@6.59s  0@7.58s  2@8.29s  0@8.88s  2@9.48s  60@10.09s  12@10.81s  20@13.30s  20@14.15s
  - "So 20 percent of 60 is 12. The quick way: turn the percent into a decimal and multiply. 20 percent is 0.2, and 0.2 times 60 is 12. Percent m"

### cur-percent-change (DecimalOps)
- **ask** · scene 5.53s, clip 4.728s, tail 0.81s · 40@0.95s  25@2.55s
  - "Something costs 40, and the price goes UP by 25 percent. What's the new price?"
- **grid** · scene 6.00s, clip 3.892s, tail 2.11s · 25@1.60s  40@2.51s  10@3.19s
  - "First find the change itself. 25 percent of 40... that's 10."
- **action** · scene 11.07s, clip 10.266s, tail 0.80s · 40@1.43s  10@2.10s  50@2.53s  25@4.83s  10@7.49s  40@8.29s  10@9.00s  30@9.42s
  - "Now add it on. 40 plus 10 is 50. And if the price had DROPPED by 25 percent instead, you'd take the same 10 off: 40 minus 10 is 30."
- **record** · scene 14.47s, clip 13.662s, tail 0.80s · 25@0.49s  50@1.80s  25@2.98s  30@4.26s
  - "Up 25 percent gives 50. Down 25 percent gives 30. Always find the part first, then decide whether it goes on or comes off. Find the part fir"

### cur-place-value-tens (PlaceValue)
- **ask** · scene 6.97s, clip 6.165s, tail 0.80s · 47@0.00s  4@4.66s
  - "47. Two digits... but they do not mean the same thing. What does the 4 really stand for?"
- **build** · scene 10.07s, clip 9.273s, tail 0.79s · 47@0.57s
  - "Here are 47 ones, all loose. Far too many to count safely. So bundle them: every ten ones snap together into one rod."
- **action** · scene 8.00s, clip 6.531s, tail 1.47s · 4@2.46s  4@2.87s  7@3.69s
  - "Count the rods. One... two... three... 4. 4 rods, and 7 ones left over that could not make a full ten."
- **record** · scene 8.63s, clip 7.837s, tail 0.80s · 4@0.52s  47@0.87s  4@1.88s  4@2.89s  40@4.34s
  - "So the 4 in 47 is not 4 — it is 4 TENS, which is 40. The left digit counts the BUNDLES of ten."

### cur-place-value-ones (PlaceValue)
- **ask** · scene 6.50s, clip 5.695s, tail 0.80s · 47@0.00s  7@3.39s
  - "47 again. This time look at the other digit — the 7 on the right. What is it counting?"
- **build** · scene 6.17s, clip 5.381s, tail 0.79s · 47@0.58s  4@2.06s
  - "Here is 47 in blocks: 4 rods of ten, and some loose ones beside them."
- **action** · scene 8.50s, clip 7.706s, tail 0.79s · 7@2.18s
  - "Count only the loose ones. 7. They are the leftovers — there were not enough of them to bundle into another ten."
- **record** · scene 11.07s, clip 10.266s, tail 0.80s · 47@0.35s  40@1.36s  7@2.13s
  - "So 47 is 40 plus 7. The left digit counts bundles of ten; the right digit counts singles. The right digit counts the loose ones."

### cur-compare-2digit (PlaceValue)
- **ask** · scene 4.00s, clip 2.403s, tail 1.60s · 43@0.87s  38@1.54s
  - "Which is bigger: 43, or 38?"
- **build** · scene 6.00s, clip 5.094s, tail 0.91s · 43@0.96s  4@1.66s  3@2.23s  38@2.81s  3@3.47s  8@4.09s
  - "Build them both. 43 is 4 rods and 3 ones. 38 is 3 rods and 8 ones."
- **action** · scene 14.23s, clip 13.427s, tail 0.81s · 4@3.56s  3@4.50s  10@6.27s
  - "Now look at the RODS first, not the ones. 4 rods against 3. That is already 10 more, and no pile of loose ones can catch up — you would need"
- **record** · scene 12.33s, clip 11.546s, tail 0.79s · 43@0.44s  38@1.74s
  - "So 43 is bigger than 38. Compare the tens first. Only if the tens are equal do you look at the ones. Tens decide it first - only check ones "

### cur-skip-2 (PlaceValue)
- **ask** · scene 9.33s, clip 8.542s, tail 0.79s · 2@0.92s
  - "Counting by 2. Instead of every single number, we take bigger hops — and land on the same numbers every time."
- **build** · scene 7.37s, clip 6.583s, tail 0.78s · 0@2.03s  2@3.89s
  - "Here is a number line, starting at 0. Each hop is exactly 2 long. Same size, every hop."
- **action** · scene 8.00s, clip 4.441s, tail 3.56s · 2@0.93s  4@1.66s  6@2.14s  8@2.65s  10@2.94s
  - "Off we go. 2... 4... 6... 8... 10... keep hopping."
- **record** · scene 10.23s, clip 9.43s, tail 0.80s · 2@0.00s  4@0.57s  6@0.88s  8@1.20s  10@1.45s  12@1.75s  14@2.15s  16@2.67s  2@6.40s
  - "2, 4, 6, 8, 10, 12, 14, 16. Same size hop, every time. Counting by 2 gets you there far faster than counting by one."

### cur-skip-10 (PlaceValue)
- **ask** · scene 8.63s, clip 7.837s, tail 0.80s · 10@0.80s
  - "Counting by 10. Instead of every single number, we take bigger hops — and land on the same numbers every time."
- **build** · scene 6.77s, clip 5.982s, tail 0.78s · 0@1.80s  10@3.52s
  - "Here is a number line, starting at 0. Each hop is exactly 10 long. Same size, every hop."
- **action** · scene 8.00s, clip 4.18s, tail 3.82s · 10@0.77s  20@1.35s  30@1.86s  40@2.28s  50@2.72s
  - "Off we go. 10... 20... 30... 40... 50... keep hopping."
- **record** · scene 9.43s, clip 8.62s, tail 0.81s · 10@0.00s  20@0.55s  30@0.91s  40@1.37s  50@1.81s  60@2.28s  10@5.65s
  - "10, 20, 30, 40, 50, 60. Only the tens digit changes. Counting by 10 gets you there far faster than counting by one."

### cur-numbers-before (PlaceValue)
- **ask** · scene 4.00s, clip 2.508s, tail 1.49s · 60@1.64s
  - "What number comes just BEFORE 60?"
- **build** · scene 6.40s, clip 5.616s, tail 0.78s · 60@0.53s
  - "Find 60 on the number line. Before means to the LEFT — the direction numbers get smaller."
- **action** · scene 9.83s, clip 9.038s, tail 0.80s · 59@2.44s  61@6.03s
  - "Take one step left... and you land on 59. One step the other way, to the right, would be 61 — that is the number AFTER."
- **record** · scene 7.10s, clip 6.296s, tail 0.80s · 59@0.42s  60@1.81s  61@2.52s
  - "So 59 comes before 60, and 61 comes after. One step BACK is one less."

### cur-order-integers (Advanced)
- **ask** · scene 11.07s, clip 10.266s, tail 0.80s · 3@1.94s  5@3.26s  1@4.49s  2@5.28s
  - "Put these in order: minus 3… then 5… then minus 1… then 2. Minus signs make it feel tricky… until you put them on a number line."
- **work** · scene 14.10s, clip 13.296s, tail 0.80s · 3@3.61s  1@6.79s  2@9.23s  5@9.75s
  - "Every integer has an address on the line. Minus 3 sits three steps LEFT of zero. Minus 1, just one step left. Then 2 and 5 on the right. Pla"
- **twist** · scene 12.77s, clip 11.964s, tail 0.80s · 3@5.34s  3@7.16s  1@8.34s
  - "The line has already sorted them. Further LEFT means smaller — so minus 3 is the smallest, even though 3 feels bigger than 1. It's further f"
- **record** · scene 8.97s, clip 8.176s, tail 0.79s · 3@1.15s  1@2.25s  2@2.95s  5@3.54s
  - "In order: minus 3… then minus 1… then 2… then 5. Further left on the line means smaller — minus signs and all."

### cur-order-ops (Advanced)
- **ask** · scene 9.90s, clip 9.091s, tail 0.81s · 3@0.00s  4@0.77s  2@1.46s  14@4.46s  11@5.86s
  - "3 plus 4 times 2. Two students solve it. One gets 14… the other gets 11. They can't both be right. Who is?"
- **work** · scene 13.50s, clip 12.696s, tail 0.80s · 3@1.66s  4@2.35s  7@2.91s  2@3.87s  14@4.99s  4@8.94s  2@9.55s  8@10.14s  3@11.21s  11@11.66s
  - "The first went left to right: 3 plus 4 is 7, times 2… 14. The second followed the RULE: multiplication first. 4 times 2 is 8… THEN add 3… 11"
- **twist** · scene 17.37s, clip 16.562s, tail 0.80s · 11@0.00s  3@13.11s  4@13.58s  2@14.86s  14@15.65s
  - "11 is correct. Multiplication and division always go before addition and subtraction — that's the agreement that makes maths mean one thing."
- **record** · scene 13.40s, clip 12.591s, tail 0.81s · (no alignment)
  - "Brackets first… then powers… then multiply and divide… then add and subtract. One expression, one meaning. Multiply and divide before you ad"

### cur-complex (Advanced)
- **ask** · scene 9.23s, clip 8.438s, tail 0.80s · 3@0.00s  2@0.89s
  - "3 plus 2 i. A number with an i in it — imaginary. Scary name… but here's the secret: it's just a POINT."
- **work** · scene 16.67s, clip 15.856s, tail 0.81s · 3@3.29s  2@6.66s  3@8.56s  2@9.22s  3@10.61s  2@11.40s
  - "Give numbers a second direction. The real part, 3, goes ACROSS. The imaginary part, 2, goes UP. So 3 plus 2 i lives at the point 3 across, 2"
- **twist** · scene 17.03s, clip 16.222s, tail 0.81s · 1@2.07s  1@2.61s  3@4.96s  1@5.55s  4@5.92s  2@8.00s  1@8.53s  3@8.93s  4@10.63s  3@11.29s
  - "And adding is easy. Add 1 plus 1 i: across parts together, 3 plus 1 is 4. Up parts together, 2 plus 1 is 3. The answer: 4 plus 3 i. Reals wi"
- **record** · scene 9.17s, clip 8.359s, tail 0.81s · (no alignment)
  - "A complex number is a point: real part across, imaginary part up. a + bi is a point: a across, b up."

### cur-sequences (Advanced)
- **ask** · scene 7.63s, clip 6.818s, tail 0.82s · 3@0.00s  7@1.63s  11@2.32s  15@3.23s
  - "3… then 7… then 11… then 15… What's the pattern — and what comes next?"
- **work** · scene 14.03s, clip 13.244s, tail 0.79s · 3@1.39s  7@1.86s  4@2.86s  7@3.25s  11@3.69s  4@4.50s  15@10.83s  4@11.87s  19@12.28s
  - "Check the gaps. 3 to 7: plus 4. 7 to 11: plus 4 again. The same hop every time — that's an ARITHMETIC sequence. So the next term is 15 plus "
- **twist** · scene 13.40s, clip 12.591s, tail 0.81s · 3@3.66s  10@4.69s  21@5.90s  36@6.85s
  - "Now the second idea. ADD the terms up as you go: 3… then 10… then 21… then 36. That running total is called a SERIES. Same numbers — differe"
- **record** · scene 12.23s, clip 11.442s, tail 0.79s · (no alignment)
  - "A sequence is the list. A series is the sum. Find the hop first — everything else follows. A sequence lists the terms; a series adds them up"

### cur-vectors (Advanced)
- **ask** · scene 11.23s, clip 10.449s, tail 0.78s · 3@4.32s  2@5.35s  3@6.90s  2@7.43s
  - "A vector is an arrow: it has a direction, and a length. This one goes 3 across and 2 up. Write it as 3, 2. What happens when arrows ADD?"
- **work** · scene 13.80s, clip 13.009s, tail 0.79s · 1@1.03s  3@1.85s  4@11.76s  5@12.13s
  - "Add the arrow 1, 3. The rule is tip to tail: start the second arrow where the first one ENDS. Walk the first arrow… then walk the second… an"
- **twist** · scene 14.33s, clip 13.531s, tail 0.80s · 3@2.39s  1@3.01s  4@3.39s  2@4.66s  3@5.22s  5@5.61s
  - "Now check the shortcut. Across: 3 plus 1 is 4. Up: 2 plus 3 is 5. The components just ADD. One straight arrow from start to finish — same an"
- **record** · scene 9.90s, clip 9.091s, tail 0.81s · (no alignment)
  - "An arrow with direction and length… added tip to tail… or component by component. Add tip-to-tail — the components just add."

### cur-power-rule (Advanced)
- **ask** · scene 11.80s, clip 10.998s, tail 0.80s · (no alignment)
  - "The derivative measures how fast a function climbs. For powers of x there's a rule so clean it feels like a magic trick… and it's two moves "
- **work** · scene 14.40s, clip 13.584s, tail 0.82s · 3@1.43s  3@10.90s
  - "Take x to the power 3. Move one: bring the exponent DOWN in front. Move two: drop the exponent by one. So the derivative of x cubed is… 3 x "
- **twist** · scene 10.63s, clip 9.848s, tail 0.79s · 5@2.45s  5@3.50s  4@4.57s  5@6.06s  4@7.06s
  - "Again, faster. x to the power 5: bring down the 5… drop to 4… the derivative is 5 x to the power 4. Any power, same two moves."
- **record** · scene 12.30s, clip 11.494s, tail 0.81s · 1@5.08s
  - "The derivative of x to the n… is n, times x to the n minus 1. Down in front… drop by one. Bring the exponent down, then drop it by one."

### cur-diff-monomials (Advanced)
- **ask** · scene 7.73s, clip 6.949s, tail 0.78s · 5@0.00s  5@6.06s
  - "5 x cubed. A coefficient in front now. Does the power rule still work… and what happens to the 5?"
- **work** · scene 13.67s, clip 12.878s, tail 0.79s · 5@0.37s  3@5.06s  2@5.98s  3@7.21s  5@10.61s  3@11.29s  15@11.90s
  - "The 5 just rides along. Power rule on the x cubed: bring down the 3, drop to 2… that's 3 x squared. Then the coefficient multiplies: 5 times"
- **twist** · scene 13.63s, clip 12.826s, tail 0.81s · 5@1.35s  15@2.53s
  - "So the derivative of 5 x cubed is 15 x squared. One clean habit: multiply coefficient by exponent… then lower the exponent by one. Try it on"
- **record** · scene 7.57s, clip 6.766s, tail 0.80s · (no alignment)
  - "Coefficient times exponent in front… exponent drops by one. The coefficient rides along and multiplies."

### cur-calc-applications (Advanced)
- **ask** · scene 11.50s, clip 10.71s, tail 0.79s · 3@9.48s
  - "Why learn derivatives at all? Here's the honest answer. A ball rolls, and its distance after t seconds is t squared metres. How FAST is it m"
- **work** · scene 13.43s, clip 12.643s, tail 0.79s · 2@9.11s  1@10.36s  2@11.77s
  - "Speed is how fast distance changes — and that's exactly what a derivative measures. Power rule on t squared: bring down the 2… drop to 1… th"
- **twist** · scene 12.70s, clip 11.912s, tail 0.79s · 3@1.44s  2@2.88s  3@3.56s  6@4.40s
  - "Now it's arithmetic. At 3 seconds, the speed is 2 times 3… 6 metres per second. Not the average speed — the speed at that exact instant. Tha"
- **record** · scene 9.43s, clip 8.62s, tail 0.81s · (no alignment)
  - "Position… differentiate… speed. The derivative turns "where is it" into "how fast". The derivative of position is speed."

### cur-y-intercept (Advanced)
- **ask** · scene 9.07s, clip 8.255s, tail 0.81s · 2@0.81s  2@2.35s  3@3.44s
  - "Where does 2 x squared, plus 2 x, minus 3 cross the y axis? It sounds like it needs a graph. It needs one number."
- **work** · scene 17.77s, clip 16.98s, tail 0.79s · 2@11.27s  2@13.56s
  - "Every point on the y axis has the same across-value: zero. So the y-intercept is simply what the polynomial is worth when x is zero. Put zer"
- **twist** · scene 18.33s, clip 17.528s, tail 0.81s · 3@3.22s  3@6.76s
  - "All that survives is the constant: minus 3. So the curve crosses at zero, minus 3. And that is true for every polynomial ever written — the "
- **record** · scene 9.80s, clip 9.012s, tail 0.79s · 3@5.21s
  - "Set x to zero and read off the constant. Here the y-intercept is minus 3. The y-intercept is just f of zero."

### cur-multiplicity (Advanced)
- **ask** · scene 13.13s, clip 12.33s, tail 0.80s · 2@3.37s  3@6.06s  2@7.65s  3@8.51s
  - "Take f of x equals, bracket, x minus 2, squared, times, bracket, x plus 3. Its roots are 2 and minus 3. But the graph does something differe"
- **work** · scene 13.77s, clip 12.983s, tail 0.78s · 2@3.38s  2@5.24s  2@7.58s  3@10.97s  1@12.21s
  - "Count how many times each root appears. The x minus 2 factor is SQUARED, so 2 appears twice — multiplicity 2. The other factor appears once,"
- **twist** · scene 19.33s, clip 18.547s, tail 0.79s · 2@8.82s  3@14.11s
  - "That count decides the shape. An EVEN multiplicity means the curve touches the axis and turns back — it bounces. So at 2, it bounces. An ODD"
- **record** · scene 10.63s, clip 9.848s, tail 0.79s · (no alignment)
  - "Count the repeats of each factor. Even, and it bounces; odd, and it crosses. Even multiplicity bounces; odd multiplicity crosses."

### cur-turning-points (Advanced)
- **ask** · scene 9.07s, clip 8.255s, tail 0.81s · 4@1.74s
  - "A polynomial of degree 4. How many times can its graph change direction — go from climbing to falling, or falling to climbing?"
- **work** · scene 15.87s, clip 15.073s, tail 0.79s · 1@5.56s  2@8.82s  3@12.24s
  - "Those changes are called turning points. Think about the shapes you already know. A straight line, degree 1, never turns. A parabola, degree"
- **twist** · scene 16.07s, clip 15.256s, tail 0.81s · 4@4.05s  3@5.33s
  - "The pattern is one less than the degree, every time. So degree 4 can turn at most 3 times. At MOST — it might turn fewer times, but it can n"
- **record** · scene 8.47s, clip 7.654s, tail 0.81s · 4@0.71s  3@2.04s
  - "Degree 4 means at most 3 turning points. Take one off the degree. At most one fewer turn than the degree."

### cur-fta (Advanced)
- **ask** · scene 8.47s, clip 7.654s, tail 0.81s · 9@1.76s
  - "A polynomial of degree 9. How many roots does it have? Not "how many can you find" — how many ARE there?"
- **work** · scene 14.87s, clip 14.054s, tail 0.81s · 9@5.58s  9@6.90s
  - "The Fundamental Theorem of Algebra answers it exactly: a polynomial of degree 9 has exactly 9 roots. Not at most. Exactly. But that promise "
- **twist** · scene 19.93s, clip 19.148s, tail 0.79s · 9@14.48s  9@16.32s
  - "First, you must count repeats. If a factor appears twice, that root counts twice. Second, you must allow COMPLEX roots — the ones with i in "
- **record** · scene 11.23s, clip 10.449s, tail 0.78s · 9@0.56s  9@1.61s
  - "Degree 9, exactly 9 roots — counting multiplicity, and counting complex ones. Degree n means exactly n roots, counting multiplicity."

### cur-synthetic (Advanced)
- **ask** · scene 11.57s, clip 10.762s, tail 0.80s · 2@0.74s  2@2.00s  3@3.09s  2@4.43s
  - "Divide 2 x squared, plus 2 x, minus 3, by x minus 2. Long division works. Synthetic division does the same job with nothing but the numbers."
- **work** · scene 16.67s, clip 15.856s, tail 0.81s · 2@2.28s  2@2.93s  3@3.90s  2@4.91s  2@7.96s  2@10.70s  2@12.21s  4@12.95s  2@14.42s  6@15.00s
  - "Write the coefficients in a row: 2, then 2, then minus 3. Put 2 outside — that is the root that makes x minus 2 zero. Now: bring down the 2."
- **twist** · scene 17.30s, clip 16.509s, tail 0.79s · 6@3.02s  2@3.51s  12@4.13s  3@5.97s  9@6.63s  2@10.31s  6@10.79s  2@12.42s  6@13.49s  9@14.88s
  - "Repeat, exactly the same. Multiply 6 by 2: 12. Add it to minus 3: 9. And you are done. The numbers along the bottom, 2 and 6, are the quotie"
- **record** · scene 10.73s, clip 9.927s, tail 0.81s · 9@5.60s
  - "Bring down, multiply, add — then repeat. The final number is the remainder: 9. Bring down, multiply, add - and the last number is the remain"

### cur-rational-root (Advanced)
- **ask** · scene 12.33s, clip 11.546s, tail 0.79s · (no alignment)
  - "You need a root of a polynomial and there is no formula to hand. Guessing at random could take all day. The Rational Root Theorem tells you "
- **work** · scene 17.30s, clip 16.509s, tail 0.79s · 15@9.27s  1@11.57s  15@12.86s  1@13.58s  3@14.21s  5@14.87s  15@15.48s
  - "It says: any rational root must be a factor of the CONSTANT term, divided by a factor of the LEADING coefficient. Here the constant is 15 an"
- **twist** · scene 18.23s, clip 17.424s, tail 0.81s · 1@1.89s  1@3.94s  1@9.89s  3@10.28s  5@10.63s  15@11.34s  3@15.59s
  - "The leading coefficient is 1, and its only factor is 1 — so the bottom of the fraction never changes anything. That leaves plus or minus 1, "
- **record** · scene 13.60s, clip 12.8s, tail 0.80s · (no alignment)
  - "Factors of the constant over factors of the leading coefficient — that is your entire list of suspects. Possible roots are factors of the co"

### cur-exponential-equations (Advanced)
- **ask** · scene 8.83s, clip 8.02s, tail 0.81s · 3@0.59s  27@2.35s
  - "Solve 3 to the power x equals 27. The x is stuck up in the exponent, where none of your usual moves reach it."
- **work** · scene 14.93s, clip 14.132s, tail 0.80s · 27@3.10s  3@6.40s  3@7.35s  3@8.02s  9@8.47s  3@9.43s  27@10.70s  27@12.06s  3@12.86s
  - "So bring the two sides into the same language. 27 is not just a number here — it is a power of 3. 3 times 3 is 9, times 3 again is 27. So 27"
- **twist** · scene 15.77s, clip 14.968s, tail 0.80s · 3@1.07s  3@2.76s  3@3.73s  3@14.14s
  - "Rewrite it: 3 to the power x equals 3 to the power 3. Now both sides are the same base, raised to something. If the bases match, the exponen"
- **record** · scene 9.23s, clip 8.438s, tail 0.80s · (no alignment)
  - "Write both sides as powers of the same base, then set the exponents equal. Same base means the exponents must match."

### cur-powers-of-i (Advanced)
- **ask** · scene 10.97s, clip 10.162s, tail 0.80s · 1@2.74s
  - "i is the number whose square is minus 1. Raise it to higher and higher powers and something surprising happens — it starts going round in ci"
- **work** · scene 18.57s, clip 17.763s, tail 0.80s · 1@2.35s  1@4.99s  1@9.63s  4@13.62s  1@15.72s  1@16.72s  1@17.12s
  - "Work up from the bottom. i to the power 1 is just i. i squared is minus 1, by definition. i cubed is i squared times i, which is minus 1 tim"
- **twist** · scene 16.33s, clip 15.517s, tail 0.82s · 1@0.69s  5@4.52s  4@7.34s  4@13.47s
  - "Back to 1 — exactly where you started. So the next one, i to the power 5, is i again, and the whole thing repeats every 4 steps. That is the"
- **record** · scene 11.80s, clip 10.998s, tail 0.80s · 1@1.42s  1@3.16s  4@6.36s
  - "i, then minus 1, then minus i, then 1 — and round again. Divide the power by 4 and use what is left over. The powers of i repeat every four."

### cur-geometric (Advanced)
- **ask** · scene 10.07s, clip 9.273s, tail 0.79s · 2@2.25s  3@3.75s  3@5.08s
  - "A geometric sequence starts at 2, with a ratio of 3. Find term 3. The word "ratio" is the clue to what makes this different."
- **work** · scene 17.77s, clip 16.98s, tail 0.79s · 2@8.66s  3@9.79s  6@10.41s  3@11.60s  18@12.54s  2@14.47s  6@15.17s  18@15.99s
  - "In the sequences you met first, you ADD the same amount each step. Here you MULTIPLY by the same amount each step. Start at 2. Times 3 gives"
- **twist** · scene 17.90s, clip 17.11s, tail 0.79s · 3@0.56s  18@1.03s  3@4.68s  3@5.91s  3@8.03s  3@8.80s  1@9.54s
  - "Term 3 is 18. But notice how you got there: you multiplied by 3 twice, not 3 times. To reach term 3 you take 3 minus 1 steps. So the rule is"
- **record** · scene 7.37s, clip 6.583s, tail 0.78s · 3@2.32s  18@3.47s
  - "Multiply, do not add. Term 3 of this sequence is 18. Each term MULTIPLIES by the ratio."

### cur-limit-poly (Advanced)
- **ask** · scene 10.97s, clip 10.162s, tail 0.80s · 4@2.17s  2@4.71s
  - "The limit, as x approaches 4, of x squared plus x plus 2. Limits sound like they need something clever. For a polynomial, they do not."
- **work** · scene 17.40s, clip 16.588s, tail 0.81s · 4@3.74s  3@6.29s  9@6.87s  3@7.46s  99@8.02s  4@12.20s  1@12.83s  4@13.29s  1@13.99s
  - "A limit asks where the function is HEADING as x closes in on 4. Come from below: at 3 point 9, at 3 point 99, the values creep towards somet"
- **twist** · scene 16.93s, clip 16.144s, tail 0.79s · 4@11.47s  16@12.35s  4@13.89s  2@14.55s  22@15.12s
  - "They agree because a polynomial has no gaps and no jumps anywhere — the graph is one unbroken curve. So where it is HEADING is simply where "
- **record** · scene 9.67s, clip 8.856s, tail 0.81s · 22@4.34s
  - "For a polynomial, a limit is just a substitution. The answer is 22. Polynomials have no gaps, so you can just substitute."

### cur-integrate-powers (Advanced)
- **ask** · scene 12.43s, clip 11.624s, tail 0.81s · 4@2.29s  4@10.94s
  - "The integral of x to the power 4. Integrating is differentiating run backwards, so the question is really: what would I have to differentiat"
- **work** · scene 19.67s, clip 18.86s, tail 0.81s · 4@7.91s  1@8.39s  5@8.79s  5@10.96s  5@14.55s  4@16.02s  5@17.16s
  - "The power rule brings the exponent down and takes one off it. Run it backwards: put one ON to the exponent first. 4 plus 1 is 5, so try x to"
- **twist** · scene 19.20s, clip 18.416s, tail 0.78s · 5@0.97s  5@4.16s  5@5.45s
  - "So divide by 5. The answer is x to the power 5, over 5. And one last thing: add C. Any constant differentiates to zero, so a constant could "
- **record** · scene 10.17s, clip 9.378s, tail 0.79s · (no alignment)
  - "Add one to the power, divide by the new power, and never forget the plus C. Add one to the power, divide by the new power, add C."

### cur-counting-1-10 (Count)
- **ask** · scene 6.73s, clip 5.93s, tail 0.80s · 10@0.88s
  - "Let's count to 10. One number for each one — no skipping, no counting anything twice."
- **count** · scene 9.00s, clip 4.676s, tail 4.32s · 1@0.82s  2@1.46s  3@1.80s  4@2.16s  5@2.46s  6@2.79s  7@3.13s  8@3.45s  9@3.82s  10@4.12s
  - "Ready? 1… 2… 3… 4… 5… 6… 7… 8… 9… 10."
- **rows** · scene 8.00s, clip 5.512s, tail 2.49s · 10@0.88s
  - "And look — 10 of them fill a whole row, exactly. That's why tens matter so much."
- **record** · scene 5.00s, clip 3.422s, tail 1.58s · 10@0.82s
  - "You counted to 10. The last number you say is how many there are."

### cur-counting-1-50 (Count)
- **ask** · scene 5.83s, clip 5.042s, tail 0.79s · 50@0.71s
  - "Counting to 50 sounds like a lot. But there's a trick — you already know it."
- **count** · scene 9.00s, clip 7.602s, tail 1.40s · 10@1.54s  1@2.03s  2@2.75s  3@3.31s  4@3.81s  5@4.40s  6@4.95s  7@5.60s  8@6.08s  9@6.62s  10@6.95s
  - "The first row is just counting to 10. 1… 2… 3… 4… 5… 6… 7… 8… 9… 10."
- **rows** · scene 13.90s, clip 13.113s, tail 0.79s · 20@3.83s  30@4.34s  40@4.92s  50@5.48s  1@8.99s  2@9.59s  3@10.17s
  - "Now watch the rows. Every full row is another ten… 20… 30… 40… 50. Each new row starts the same way — 1, 2, 3 — just with a new ten in front"
- **record** · scene 5.57s, clip 4.78s, tail 0.79s · 50@0.74s  10@2.28s  20@2.62s  30@3.05s  40@3.50s  50@3.96s
  - "And that's 50. Count the rows of ten — 10, 20, 30, 40, 50."

### cur-counting-100 (Count)
- **ask** · scene 5.10s, clip 4.31s, tail 0.79s · 100@0.66s
  - "Counting to 100 sounds like a lot. But there's a trick — you already know it."
- **count** · scene 9.00s, clip 6.348s, tail 2.65s · 10@1.95s  1@2.39s  2@2.91s  3@3.22s  4@3.58s  5@3.91s  6@4.21s  7@4.56s  8@4.90s  9@5.28s  10@5.65s
  - "The first row is just counting to 10. 1… 2… 3… 4… 5… 6… 7… 8… 9… 10."
- **rows** · scene 15.60s, clip 14.785s, tail 0.81s · 20@3.68s  30@4.38s  40@5.00s  50@5.65s  60@6.22s  70@6.83s  80@7.42s  90@8.01s  100@8.53s  1@11.80s  2@12.14s  3@12.40s
  - "Now watch the rows. Every full row is another ten… 20… 30… 40… 50… 60… 70… 80… 90… 100. Each new row starts the same way — 1, 2, 3 — just wi"
- **record** · scene 5.00s, clip 2.873s, tail 2.13s · 100@0.61s  100@1.02s  10@1.65s
  - "And that's 100. 100 is just 10 rows of ten."

### cur-number-recognition (Count)
- **ask** · scene 4.00s, clip 2.743s, tail 1.26s · 7@0.61s  7@1.42s
  - "This is 7. But what does 7 actually mean?"
- **count** · scene 9.00s, clip 3.474s, tail 5.53s · 1@0.88s  2@1.28s  3@1.60s  4@1.89s  5@2.17s  6@2.48s  7@2.91s
  - "Count with me… 1… 2… 3… 4… 5… 6… 7."
- **rows** · scene 8.00s, clip 4.415s, tail 3.58s · 7@0.96s  7@1.87s
  - "The numeral 7… and 7 things. Same idea, written two ways."
- **record** · scene 5.00s, clip 3.762s, tail 1.24s · 7@0.63s
  - "So that's 7. When you see the numeral, think of that many things."

### cur-which-greater (Compare)
- **ask** · scene 4.97s, clip 4.18s, tail 0.79s · 8@0.00s  5@0.55s
  - "8 or 5 — which is greater? Don't guess — there's a way to see it."
- **build** · scene 6.00s, clip 2.168s, tail 3.83s · 8@0.55s  5@1.49s
  - "Here's 8… and here's 5."
- **pair** · scene 9.70s, clip 8.908s, tail 0.79s · 5@4.13s  8@5.49s  3@6.28s
  - "Now pair them up, one against one… Every one of the 5 has a partner. But 8 still has 3 sticking out with no partner at all."
- **record** · scene 5.80s, clip 5.016s, tail 0.78s · 8@0.58s  5@1.57s
  - "So 8 is greater than 5. The row that sticks out past the other is greater."

### cur-which-less (Compare)
- **ask** · scene 4.97s, clip 4.18s, tail 0.79s · 7@0.00s  4@0.72s
  - "7 or 4 — which is less? Don't guess — there's a way to see it."
- **build** · scene 6.00s, clip 1.985s, tail 4.01s · 7@0.50s  4@1.39s
  - "Here's 7… and here's 4."
- **pair** · scene 9.00s, clip 8.202s, tail 0.80s · 4@3.15s  7@4.82s  3@5.76s
  - "Now pair them up, one against one… Every one of the 4 has a partner. But 7 still has 3 sticking out with no partner at all."
- **record** · scene 5.00s, clip 4.127s, tail 0.87s · 4@0.40s  7@1.39s
  - "So 4 is less than 7. The row that runs out first is less."

### cur-more-less (Compare)
- **ask** · scene 6.60s, clip 5.799s, tail 0.80s · 9@0.00s  6@0.72s
  - "9 and 6. Which is more… and which is less? Don't guess — there's a way to see it."
- **build** · scene 6.00s, clip 2.351s, tail 3.65s · 9@0.57s  6@1.60s
  - "Here's 9… and here's 6."
- **pair** · scene 9.23s, clip 8.438s, tail 0.80s · 6@3.19s  9@4.98s  3@5.89s
  - "Now pair them up, one against one… Every one of the 6 has a partner. But 9 still has 3 sticking out with no partner at all."
- **record** · scene 6.23s, clip 5.433s, tail 0.80s · 9@0.50s  6@1.49s
  - "So 9 is more, and 6 is less. Pair them up — the leftovers tell you which is more."

### cur-counting-on-next (NumberLine)
- **ask** · scene 6.77s, clip 5.982s, tail 0.78s · 6@0.00s  7@1.52s  8@2.35s
  - "6… then 7… then 8… then blank. What goes in the blank? The number line knows."
- **line** · scene 6.00s, clip 3.109s, tail 2.89s · 6@2.29s
  - "Here's the line. The sequence starts at 6."
- **hop** · scene 9.00s, clip 4.415s, tail 4.58s · 7@1.00s  8@1.66s  9@2.32s
  - "Hop along… 7… then 8… then 9. Landed — right in the blank."
- **record** · scene 5.47s, clip 4.676s, tail 0.79s · 6@0.00s  7@1.18s  8@1.80s  9@2.26s
  - "6… then 7… then 8… then 9. Say the number, then hop one more."

### cur-numbers-after-100 (NumberLine)
- **ask** · scene 7.50s, clip 6.687s, tail 0.81s · 57@0.00s  58@1.54s  59@2.79s
  - "57… then 58… then 59… then blank. What goes in the blank? The number line knows."
- **line** · scene 6.00s, clip 3.109s, tail 2.89s · 57@2.03s
  - "Here's the line. The sequence starts at 57."
- **hop** · scene 9.00s, clip 4.545s, tail 4.46s · 58@1.00s  59@1.88s  60@3.70s
  - "Hop along… 58… then 59… and now the tens tick over… 60!"
- **record** · scene 7.07s, clip 6.269s, tail 0.80s · 57@0.00s  58@1.22s  59@1.99s  60@2.93s  59@3.62s  60@5.47s
  - "57… then 58… then 59… then 60. After 59, the tens tick over — 60."

### cur-missing-number (NumberLine)
- **ask** · scene 6.17s, clip 5.381s, tail 0.79s · 4@0.00s  5@1.16s  7@2.58s
  - "4… then 5… then blank… then 7. What goes in the blank? The number line knows."
- **line** · scene 6.00s, clip 2.691s, tail 3.31s · 4@2.06s
  - "Here's the line. The sequence starts at 4."
- **hop** · scene 9.00s, clip 3.997s, tail 5.00s · 5@0.77s  6@1.52s  7@2.18s
  - "Hop along… 5… then 6… then 7. Landed — right in the blank."
- **record** · scene 5.77s, clip 4.963s, tail 0.80s · 4@0.00s  5@0.87s  6@1.42s  7@1.97s
  - "4… then 5… then 6… then 7. Hop through the gap and see what you land on."

### cur-number-patterns (NumberLine)
- **ask** · scene 6.67s, clip 5.851s, tail 0.82s · 5@0.00s  10@1.14s  15@2.15s
  - "5… then 10… then 15… then blank. What goes in the blank? The number line knows."
- **line** · scene 6.00s, clip 4.075s, tail 1.92s · 5@2.01s  5@3.13s
  - "Here's the line. The sequence starts at 5, and each hop is 5."
- **hop** · scene 9.00s, clip 5.094s, tail 3.91s · 10@0.91s  15@1.74s  20@2.69s
  - "Hop along… 10… then 15… then 20. Landed — right in the blank."
- **record** · scene 7.03s, clip 6.217s, tail 0.82s · 5@0.00s  10@1.15s  15@1.73s  20@2.57s
  - "5… then 10… then 15… then 20. Same-size hops every time — that's the pattern."