// src/lib/tutorials/lesson-extras.ts
// Turns a spec-sheet micro-lesson ("Differentiates axⁿ") into a lesson that
// TEACHES: student-friendly goal, why it matters, the rule as a step chain,
// common mistakes, a memory trick and a 3-point recap. Everything is matched
// by topic family from the skill/umbrella label, with safe generic fallbacks —
// so it works for every skill in the curriculum without hand-authoring each.

export interface LessonExtras {
  why: string;                 // one short "why do we even learn this" paragraph
  rule: string[];              // the core rule as a chain of short steps (rendered ↓ between)
  mistakes: { wrong: string; right: string }[];
  trick?: string;              // one-line memory trick
  recap: string[];             // exactly the 2–3 things to remember
  /** Tiny prediction interaction shown before the worked examples — "what
   *  happens first?" Options shuffled at render; correct = index here. */
  predict?: { q: string; options: string[]; correct: number };
}

interface Family extends LessonExtras { match: RegExp }

// Ordered — first match wins, so more specific families come before broad ones.
const FAMILIES: Family[] = [
  // ── Single-digit FACT strategies (M3–M6). These come FIRST so a fact lesson
  // gets its MENTAL-MATH strategy, not the multi-digit column method. ──
  {
    // NOT halving units — "Halving & near-halves (using doubles)" is DIVISION
    // content and must not get the 6+6=12 addition-doubles lesson.
    match: /^(?!.*halv)(?=.*(?:\bdoubles?\b|near.?double)).*$/i,
    why: "Doubles are the anchor facts — once 6+6=12 is automatic, you can reach the facts around it (6+7, 6+5) in a heartbeat instead of counting.",
    rule: ["Know your doubles: 6 + 6 = 12", "A near-double is just 1 more (or 1 less)", "6 + 7 = 12 + 1 = 13", "No counting — build from the double"],
    mistakes: [
      { wrong: "Counting 6 + 7 on fingers every time", right: "Start from 6 + 6 = 12, then add 1 → 13" },
      { wrong: "6 + 7 = 12 (used the double, forgot the +1)", right: "A near-double is the double PLUS one more" },
    ],
    trick: "Double it, then nudge — the double you know, plus or minus one.",
    recap: ["Memorize the doubles first", "Near-double = double ± 1", "Answer fast, don't count"],
  },
  {
    match: /make.?ten|bridg|number bond|friends of ten/i,
    why: "Ten is the friendliest number to add. Break a hard fact into 'get to ten, then the rest' and big sums become easy.",
    rule: ["Fill up to 10 first", "8 + 5 → 8 needs 2 to make 10", "Then add what's left: 10 + 3", "8 + 5 = 13"],
    mistakes: [
      { wrong: "Counting 8 + 5 one by one", right: "8 + 2 = 10, then 3 more → 13" },
      { wrong: "Splitting the wrong number", right: "Take from the smaller addend to fill the bigger one up to 10" },
    ],
    trick: "Make ten, then add the rest.",
    recap: ["Fill up to 10 first", "Add the leftover", "Ten makes every fact easier"],
  },
  {
    match: /count on|counting on/i,
    why: "For a small add-on (1, 2 or 3), you don't count them all — you start from the bigger number and count on. It's the first fluency shortcut.",
    rule: ["Start from the BIGGER number", "Count on the smaller one", "8 + 3 → 8… 9, 10, 11", "Say it, don't draw it"],
    mistakes: [
      { wrong: "Starting at 1 and counting everything", right: "Start at the bigger number (8), then count on 3" },
      { wrong: "Counting the start number itself", right: "8 + 3 → the next number is 9, not 8" },
    ],
    trick: "Big number in your head, count on the little one.",
    recap: ["Start from the bigger number", "Count on the smaller", "Only for +1, +2, +3"],
  },
  {
    // MULTIPLICATION fact families ("Fact families & missing factor", M5/M6) —
    // BEFORE the additive family; a ×/÷ unit was showing 6+7=13 content.
    match: /fact famil.*(missing factor|missing dividend|missing divisor|×|÷)|missing factor|missing dividend|missing divisor/i,
    why: "Multiplication and division are the same family: 4 × 8, 8 × 4, 32 ÷ 8 and 32 ÷ 4 all share the numbers 4, 8, 32. Learn one and you know all four — and a missing factor is just a division in disguise.",
    rule: [
      "Three numbers make a family: 4, 8, 32",
      "4 × 8 = 32 and 8 × 4 = 32",
      "32 ÷ 4 = 8 and 32 ÷ 8 = 4",
      "Missing factor? 4 × ___ = 32 asks 32 ÷ 4 → 8",
    ],
    mistakes: [
      { wrong: "Treating 32 ÷ 8 as a brand-new fact to memorize", right: "It's the 4 × 8 = 32 family — the answer is 4" },
      { wrong: "4 × ___ = 32 → guessing randomly", right: "Turn it around: the missing factor is 32 ÷ 4 = 8" },
    ],
    predict: { q: "6 × ___ = 48 — how do you find the missing factor?", options: ["Divide: 48 ÷ 6", "Add: 48 + 6", "Subtract: 48 − 6", "Guess and check"], correct: 0 },
    trick: "One family, four facts — and missing factor means divide.",
    recap: ["Three numbers, one ×/÷ family", "Division undoes multiplication", "Missing factor = divide the product"],
  },
  {
    match: /fact famil|number bond/i,
    why: "Every fact comes in a family: 6 + 7, 7 + 6, 13 − 6 and 13 − 7 all live together. Learn one and you know all four.",
    rule: ["Three numbers make a family: 6, 7, 13", "6 + 7 = 13 and 7 + 6 = 13", "13 − 6 = 7 and 13 − 7 = 6", "Know one → know all four"],
    mistakes: [
      { wrong: "Treating 13 − 6 as a brand-new fact", right: "It's the 6 + 7 = 13 family — the answer is 7" },
      { wrong: "6 + 7 ≠ 7 + 6", right: "Order doesn't change a sum — both are 13" },
    ],
    trick: "One family, four facts.",
    recap: ["Three numbers, one family", "Addition and subtraction are linked", "Learn one, get four"],
  },
  {
    match: /skip count|times table|×\s*\d|\bx\d|multiplication fact/i,
    why: "Times tables are the backbone of all later math — fractions, division, algebra. Skip-counting builds them: 3, 6, 9, 12 IS the 3 times table.",
    rule: ["a × b = b groups of a", "Skip-count to get there: 3 × 4 → 3, 6, 9, 12", "Order doesn't matter: 3 × 8 = 8 × 3", "Aim to just KNOW them"],
    mistakes: [
      { wrong: "7 × 0 = 7", right: "Zero groups of anything is 0" },
      { wrong: "Re-counting 6 × 8 every time", right: "Practise until it's instant — that's the goal" },
    ],
    trick: "Flip to the easier one — 3 × 8 is the same as 8 × 3.",
    recap: ["Multiplying = equal groups", "You can flip the order", "Speed is the goal — memorize them"],
  },
  // ── Specific advanced-unit families — placed BEFORE the broad/arithmetic
  // families so substrings can't hijack them ("Add complex numbers" was
  // getting the carrying lesson; "Multiplicity" got times tables). ──
  {
    match: /powers of i|imaginary|complex number/i,
    why: "Imaginary numbers let us solve equations that used to be 'impossible' — and they're behind real technology: electrical circuits, signal processing and quantum physics.",
    rule: ["i² = −1 — that's the whole definition", "Powers of i repeat every 4: i, −1, −i, 1", "Add complex numbers by parts: real + real, imaginary + imaginary", "(3 + 2i) + (1 + 4i) = 4 + 6i"],
    mistakes: [
      { wrong: "i² = 1", right: "i² = −1 by definition — that's what makes i special" },
      { wrong: "Mixing parts: (3 + 2i) + (1 + 4i) = 10i", right: "Keep parts separate: reals 3+1 = 4, imaginaries 2i+4i = 6i → 4 + 6i" },
    ],
    predict: { q: "What is i²?", options: ["−1", "1", "i", "0"], correct: 0 },
    trick: "Treat i like a letter when adding — combine like with like.",
    recap: ["i² = −1", "Powers of i cycle every 4", "Add real parts and imaginary parts separately"],
  },
  {
    match: /zero.?product/i,
    why: "The zero-product property is the reason factoring solves equations: the only way a multiplication can equal ZERO is if one of the things being multiplied is zero.",
    rule: ["If a × b = 0, then a = 0 or b = 0", "Nothing else multiplies to zero — only zero does", "So: factor first, get (…)(…) = 0", "Set EACH factor to 0 and solve"],
    mistakes: [
      { wrong: "(x − 2)(x − 5) = 0 → x = −2, −5", right: "Each factor equals ZERO: x − 2 = 0 → x = 2, and x − 5 = 0 → x = 5" },
      { wrong: "Using it when the product equals 6: (x)(x+1) = 6 → x = 6", right: "It ONLY works for = 0 — make the equation equal zero first" },
    ],
    predict: { q: "(x − 3)(x + 1) = 0. What are the solutions?", options: ["x = 3 or x = −1", "x = −3 or x = 1", "x = 3 only", "x = 0"], correct: 0 },
    trick: "A product is zero only when a factor is zero.",
    recap: ["a × b = 0 → a = 0 or b = 0", "Only works when the product IS zero", "Set each factor to zero"],
  },
  {
    match: /y-intercept|y intercept/i,
    why: "The y-intercept is where a graph crosses the y-axis — the starting value: money at day zero, height at launch. It's the single easiest point to find.",
    rule: ["On the y-axis, x = 0", "So plug x = 0 into the function", "Every term with an x vanishes", "What's left — the constant term — IS the y-intercept"],
    mistakes: [
      { wrong: "Setting y = 0 to find the y-intercept", right: "y = 0 gives the X-intercepts — for the y-intercept set x = 0" },
      { wrong: "Doing long arithmetic on every term", right: "Terms with x all become 0 — only the constant survives" },
    ],
    predict: { q: "f(x) = x³ − 2x + 7. What is the y-intercept?", options: ["7", "0", "−2", "1"], correct: 0 },
    trick: "y-intercept: x is zero, read the constant.",
    recap: ["Set x = 0", "x-terms vanish", "The constant term is the y-intercept"],
  },
  {
    match: /x-intercept|x intercept/i,
    why: "X-intercepts are where a graph crosses the x-axis — where profit hits zero, where the ball lands. Finding them IS solving the equation.",
    rule: ["On the x-axis, y = 0", "So set the function equal to 0", "Solve — usually by factoring", "Each solution is one crossing point"],
    mistakes: [
      { wrong: "Setting x = 0 to find x-intercepts", right: "x = 0 gives the Y-intercept — for x-intercepts set y = 0" },
      { wrong: "Stopping after factoring", right: "Use the zero-product property: set each factor to 0 and solve" },
    ],
    predict: { q: "f(x) = (x − 2)(x + 5). Where does it cross the x-axis?", options: ["x = 2 and x = −5", "x = −2 and x = 5", "x = 0", "x = 2 only"], correct: 0 },
    trick: "Crossing the x-axis means the height y is zero.",
    recap: ["Set the function = 0", "Factor and solve", "Each root is a crossing"],
  },
  {
    match: /multiplicity/i,
    why: "Multiplicity tells you HOW a graph meets the x-axis at each root — whether it slices through or just touches and turns back. One number predicts the whole shape.",
    rule: ["Multiplicity = how many times a factor repeats", "(x − 2)³ → the root 2 has multiplicity 3", "ODD multiplicity → the graph CROSSES the axis", "EVEN multiplicity → it BOUNCES off the axis"],
    mistakes: [
      { wrong: "Treating (x − 2)² as two different roots", right: "It's ONE root (x = 2) counted twice — multiplicity 2, so the graph bounces there" },
      { wrong: "Crossing vs bouncing guessed from the sign", right: "It's the EXPONENT that decides: odd crosses, even bounces" },
    ],
    predict: { q: "At x = 1, the graph of (x − 1)² does what?", options: ["Bounces off the axis", "Crosses the axis", "Has an asymptote", "Stops"], correct: 0 },
    trick: "Odd crosses over, even bounces even.",
    recap: ["Multiplicity = repeat count of a root", "Odd → cross", "Even → bounce"],
  },
  {
    match: /synthetic/i,
    why: "Synthetic division is polynomial division with all the clutter stripped away — just the coefficients. It's the fast way to test roots and factor big polynomials.",
    rule: ["Write ONLY the coefficients in a row", "Bring the first one straight down", "Multiply by the test root, write it under the next coefficient, add", "Repeat across — the last number is the REMAINDER (0 means the root works)"],
    mistakes: [
      { wrong: "Forgetting a 0 for a missing term (x³ + 2 → 1, 2)", right: "Every power needs a slot: x³ + 2 → 1, 0, 0, 2" },
      { wrong: "Using the root's opposite sign (dividing by x − 3 with −3)", right: "Dividing by x − 3 → use +3 in the corner" },
    ],
    predict: { q: "Synthetic division ends in 0. What does that tell you?", options: ["The test value is a root", "You made an error", "The polynomial is prime", "Nothing"], correct: 0 },
    trick: "Drop, multiply, add — repeat to the end.",
    recap: ["Coefficients only, zeros for gaps", "Multiply then add, column by column", "Remainder 0 → it's a root"],
  },
  {
    match: /limit/i,
    why: "A limit asks the most useful question in calculus: what value is the function HEADING toward? Derivatives and integrals are both built out of limits.",
    rule: ["Limits ask where f(x) is heading, not where it is", "Polynomials are friendly: just plug the value in", "Got 0/0? Factor, cancel the common piece, plug in again", "The limit can exist even where the function has a hole"],
    mistakes: [
      { wrong: "Giving up at 0/0", right: "0/0 means 'factor me' — cancel the shared factor and try again" },
      { wrong: "Saying the limit doesn't exist because f(a) is undefined", right: "The limit cares where values are HEADING — a hole in the graph can still have a limit" },
    ],
    predict: { q: "lim (x→3) of x² is…", options: ["9", "3", "6", "undefined"], correct: 0 },
    trick: "Plug in first — factor only when you hit 0/0.",
    recap: ["Polynomials: plug straight in", "0/0 → factor and cancel", "Limits describe the approach, not the arrival"],
  },
  {
    match: /perfect square|square root|simplify roots|estimate.*roots/i,
    why: "Perfect squares and square roots are inverse dance partners — 7² = 49 and √49 = 7. Knowing the squares to 15² makes roots, quadratics and the Pythagorean theorem feel easy.",
    rule: ["A perfect square is n × n: 1, 4, 9, 16, 25…", "√ UNDOES squaring: √49 = 7 because 7² = 49", "Not a perfect square? Trap it: √50 is between √49 and √64", "So √50 ≈ 7.1 — just past 7"],
    mistakes: [
      { wrong: "√49 = 24.5 (dividing by 2)", right: "The root asks 'what times ITSELF gives 49?' → 7" },
      { wrong: "√(a + b) = √a + √b", right: "Roots don't split over + : √(9+16) = √25 = 5, not 3 + 4" },
    ],
    predict: { q: "√81 = ?", options: ["9", "40.5", "8", "18"], correct: 0 },
    trick: "Squares build the wall; roots find the brick.",
    recap: ["Perfect square = n × n", "√ undoes squaring", "Estimate between neighbouring perfect squares"],
  },
  {
    match: /derivat|differenti|power rule|d\/dx/i,
    why: "Derivatives tell you how fast something is changing — how steep a graph is at any point, when a rocket is speeding up, where a curve reaches its highest point. Engineers, doctors and AI models all use them every day.",
    rule: ["d/dx (axⁿ)", "Multiply the coefficient by the exponent n", "Subtract 1 from the exponent", "Done — that's the derivative"],
    mistakes: [
      { wrong: "d/dx 3x² = 3x  (forgot to multiply by the exponent)", right: "Multiply first: 3 × 2 = 6, so the answer is 6x" },
      { wrong: "d/dx 7 = 7  (a constant stays the same)", right: "A constant never changes, so its derivative is 0" },
    ],
    predict: { q: "d/dx 5x³ — what happens FIRST?", options: ["Multiply 5 by the exponent 3", "Subtract 1 from the 5", "Add the exponents", "Divide by 3"], correct: 0 },
    trick: "Bring it down, knock it down — bring the exponent down in front, then knock the exponent down by 1.",
    recap: ["Multiply by the exponent", "Lower the exponent by 1", "Constants become 0"],
  },
  {
    match: /integral|integrat|antideriv|∫/i,
    why: "Integrals add up tiny pieces to find totals — the area under a curve, the distance travelled from a speed graph, the water filling a tank. They're the reverse of derivatives.",
    rule: ["∫ axⁿ dx", "Raise the exponent by 1", "Divide by the NEW exponent", "Add + C"],
    mistakes: [
      { wrong: "∫ x² dx = x³  (forgot to divide)", right: "Divide by the new exponent: x³/3 + C" },
      { wrong: "Leaving off + C", right: "Every indefinite integral needs + C at the end" },
    ],
    predict: { q: "∫ x⁴ dx — what happens to the exponent?", options: ["It goes UP by 1", "It goes down by 1", "It stays the same", "It doubles"], correct: 0 },
    trick: "Up one, over it — exponent goes UP one, then divide by it.",
    recap: ["Exponent up by 1", "Divide by the new exponent", "Never forget + C"],
  },
  {
    match: /factor(?! famil)|trinomial|difference of squares|difference of cubes|sum & difference/i,
    why: "Factoring is un-multiplying — it breaks an expression into the pieces that made it. It's how you solve quadratic equations and find where graphs cross the x-axis.",
    rule: ["x² + bx + c", "Find two numbers that MULTIPLY to c", "…and ADD to b", "Write (x + __)(x + __)"],
    mistakes: [
      { wrong: "Only checking that the numbers multiply to c", right: "They must multiply to c AND add to b — check both" },
      { wrong: "Forgetting to pull out a common factor first", right: "Always look for a GCF before anything else" },
    ],
    predict: { q: "Factoring x² + 7x + 10 — the two numbers must…", options: ["Multiply to 10 AND add to 7", "Add to 10 and multiply to 7", "Both equal 5", "Subtract to 3"], correct: 0 },
    trick: "Multiply to the end, add to the middle.",
    recap: ["Pull out any common factor first", "Two numbers: multiply to c, add to b", "Check by multiplying back out"],
  },
  {
    match: /polynomial|monomial|binomial|like terms|foil|distribut|standard form|leading coefficient|constant term|degree of|box method|partial products/i,
    why: "Polynomials describe curves — the arc of a basketball, profit over time, the shape of a bridge. Adding, multiplying and simplifying them is the grammar of algebra.",
    rule: ["Only LIKE terms combine (same letter, same exponent)", "Add or subtract their coefficients", "The exponent never changes when you add"],
    mistakes: [
      { wrong: "3x² + 2x = 5x³  (added unlike terms)", right: "x² and x are different terms — they can't combine" },
      { wrong: "Losing a minus sign when subtracting: (…) − (2x + 3) → −2x + 3", right: "The minus flips EVERY sign inside: −2x − 3" },
    ],
    predict: { q: "3x² + 2x — can these combine?", options: ["No — different exponents", "Yes — 5x³", "Yes — 5x²", "Yes — 6x²"], correct: 0 },
    trick: "Same letter, same power — only then can they be friends.",
    recap: ["Combine only like terms", "A minus in front flips every sign inside", "Exponents don't change when adding"],
  },
  {
    match: /quadratic|parabol|vertex|complet.*square|discriminant|x² =|axis of symmetry/i,
    why: "Quadratics describe anything that goes up and comes back down — a thrown ball, profit that peaks, a satellite dish. Solving them tells you where things land and where the peak is.",
    rule: ["Get everything on one side = 0", "Factor (or use the quadratic formula)", "Set each factor to 0", "Solve each little equation"],
    mistakes: [
      { wrong: "x² = 9 → x = 3 only", right: "Square roots give TWO answers: x = 3 and x = −3" },
      { wrong: "Solving before moving everything to one side", right: "Always make it = 0 first" },
    ],
    recap: ["Make one side 0", "Factor, then set each factor to 0", "Expect up to two answers"],
  },
  {
    // The Pythagorean THEOREM is its own lesson (a² + b² = c²), NOT a trig-ratio
    // lesson — a "Pythagorean theorem" unit was getting SOH-CAH-TOA content.
    match: /pythagorean theorem|pythagoras/i,
    why: "Right angles are everywhere — walls and floors, ladders on houses, TV screen sizes, shortcuts across a field. The Pythagorean theorem finds the missing side of any right triangle without measuring it.",
    rule: ["a² + b² = c²", "a and b are the LEGS — they make the right angle", "c is the HYPOTENUSE — the longest side, across from the right angle", "Plug in what you know, then square-root at the end"],
    mistakes: [
      { wrong: "Using the hypotenuse as a leg: 5² + 13² = c²", right: "c is ALWAYS the longest side, across from the right angle — the legs are the two shorter sides" },
      { wrong: "Stopping at c² = 25, so c = 25", right: "25 is c SQUARED — take the square root: c = 5" },
    ],
    predict: { q: "The legs are 3 and 4. How long is the hypotenuse?", options: ["5", "7", "12", "25"], correct: 0 },
    trick: "Legs squared, added together, give the hypotenuse squared.",
    recap: ["a² + b² = c²", "c = the hypotenuse (longest side)", "Square-root at the end"],
  },
  {
    match: /domain|excluded x/i,
    why: "Some inputs BREAK a function — dividing by zero, square-rooting a negative. The domain is the list of inputs that are actually allowed, and finding it means spotting the troublemakers.",
    rule: ["Ask: what could break this function?", "A denominator can NEVER be 0", "Set the denominator ≠ 0 and solve it like an equation", "Every other x is allowed — that's the domain"],
    mistakes: [
      { wrong: "Saying x = 4 IS the domain of 1/(x − 4)", right: "x = 4 is the EXCLUDED value — the domain is every x except 4" },
      { wrong: "Stopping at x − 4 ≠ 0", right: "Solve it: x ≠ 4 — name the actual forbidden number" },
    ],
    predict: { q: "f(x) = 1/(x − 7). Which x is NOT allowed?", options: ["7", "0", "−7", "1"], correct: 0 },
    trick: "Ask: what number would make the bottom zero? Ban that number.",
    recap: ["Domain = the allowed inputs", "Denominators can't be 0", "Ban the values that break the function"],
  },
  {
    // Unit-circle lessons are about COORDINATES and standard angles, not
    // triangle labelling — they were getting the SOH-CAH-TOA rule chain.
    match: /unit.circle|standard angle|pythagorean identity/i,
    why: "One circle stores every sin and cos value that exists. Its radius is 1, so the coordinates of any point ON the circle literally ARE cosine and sine — no triangle needed.",
    rule: ["The unit circle has radius 1, centred at (0, 0)", "The point at angle θ is (cos θ, sin θ)", "x-coordinate = cos θ · y-coordinate = sin θ", "Memorise the special angles: 0°, 30°, 45°, 60°, 90°"],
    mistakes: [
      { wrong: "Reading the point as (sin θ, cos θ)", right: "cos comes FIRST — the point is (cos θ, sin θ), x then y" },
      { wrong: "sin 30° = 0.87", right: "sin 30° = 1/2 — 0.87 (√3/2) is cos 30°" },
    ],
    predict: { q: "On the unit circle, where is the point at θ = 90°?", options: ["(0, 1)", "(1, 0)", "(1, 1)", "(0, 0)"], correct: 0 },
    trick: "(cos, sin) — alphabetical order: c before s, x before y.",
    recap: ["Radius 1 → coordinates are (cos θ, sin θ)", "x is cos, y is sin", "Know the five special angles cold"],
  },
  {
    match: /radian/i,
    why: "Degrees are for protractors; radians are how mathematics itself measures angles — every formula in calculus expects them. Converting between the two is one multiplication.",
    rule: ["Half a turn: 180° = π radians", "Degrees → radians: multiply by π/180", "Radians → degrees: multiply by 180/π", "Know the family: 30° = π/6 · 45° = π/4 · 60° = π/3 · 90° = π/2"],
    mistakes: [
      { wrong: "Multiplying by 180/π to go degrees → radians", right: "Degrees → radians is × π/180 (the π ends up on top)" },
      { wrong: "Thinking π radians = 360°", right: "π is HALF a turn (180°); the full circle is 2π" },
    ],
    predict: { q: "What is 90° in radians?", options: ["π/2", "π", "π/4", "2π"], correct: 0 },
    trick: "π = 180° — write it at the top of your page and every conversion is one step away.",
    recap: ["180° = π", "Degrees → radians: × π/180", "Full circle = 2π"],
  },
  {
    match: /trig|sine|cosine|tangent|sohcahtoa|pythagor|hypotenuse|right.triangle/i,
    why: "Trigonometry connects angles to distances. It's how surveyors measure mountains, how GPS finds you, and how games rotate anything on screen.",
    rule: ["Label the triangle from the angle: Opposite, Adjacent, Hypotenuse", "SOH-CAH-TOA picks the ratio", "Set up the equation", "Solve for the missing side or angle"],
    mistakes: [
      { wrong: "Mixing up opposite and adjacent", right: "Opposite is across FROM the angle; adjacent touches it" },
      { wrong: "Using the hypotenuse as a leg in a² + b² = c²", right: "c is ALWAYS the hypotenuse — the longest side, across from the right angle" },
    ],
    predict: { q: "You know the Opposite and want the Hypotenuse. Which ratio?", options: ["Sine", "Cosine", "Tangent", "Area"], correct: 0 },
    trick: "SOH-CAH-TOA — Sine = Opp/Hyp, Cosine = Adj/Hyp, Tangent = Opp/Adj.",
    recap: ["Label sides from the angle first", "Pick the ratio with SOH-CAH-TOA", "Hypotenuse is always the longest side"],
  },
  {
    // Word-bounded: "triangle"/"rectangle" must not land in the angles family.
    match: /\bangles?\b|complementary|supplementary|vertical|transversal/i,
    why: "Angles are everywhere something turns or meets — ramps, roofs, mirrors, billiard shots. Angle rules let you find a missing angle without ever measuring it.",
    rule: ["Spot the relationship (straight line? corner? X-cross?)", "Straight line = 180°, right angle = 90°, full turn = 360°", "Subtract what you know", "What's left is the missing angle"],
    mistakes: [
      { wrong: "Using 180° when the angles make a right angle", right: "A corner (right angle) is 90° — a straight line is 180°" },
      { wrong: "Measuring the drawing with your eyes", right: "Trust the numbers, not how big the drawing looks" },
    ],
    recap: ["Straight line = 180°", "Right angle = 90°", "Subtract the known angle from the total"],
  },
  {
    match: /area|perimeter|volume|surface|circumference/i,
    why: "Area, perimeter and volume answer real questions: how much paint for the wall, how much fence for the yard, how much water fits the tank.",
    rule: ["Name the shape", "Pick its formula", "Plug in the measurements", "Compute — and include the units"],
    mistakes: [
      { wrong: "Mixing up area and perimeter", right: "Perimeter goes AROUND (add sides); area COVERS (multiply)" },
      { wrong: "Forgetting to halve for triangles", right: "Triangle area = base × height ÷ 2" },
    ],
    recap: ["Perimeter = around, area = covering", "Pick the right formula first", "Always write the units"],
  },
  // ── Fraction families — ONE per skill (user rebuild: "Identify fractions"
  // was showing the operations rules; a student identifying fractions must not
  // be confused with adding rules). Each teaches the DECISION PROCEDURE step by
  // step: what to look at first, what that tells you, what to do next, and how
  // to finish (check + simplify). Order: specific operations BEFORE the basics
  // catch-all. ──
  {
    match: /add.*fraction|subtract.*fraction|fraction.*(addition|subtraction)/i,
    why: "Adding and subtracting fractions is how you combine parts — half a cup plus a third of a cup, what's left of a pizza. The whole game is making the pieces the SAME SIZE first.",
    rule: [
      "STEP 1 — Look at the DENOMINATORS before anything else",
      "SAME denominators? Keep the bottom, just add or subtract the TOPS",
      "DIFFERENT? Stop — find a common denominator and convert BOTH fractions first",
      "Then add or subtract the tops, keep the common bottom",
      "FINISH — always ask: can the answer be simplified?",
    ],
    mistakes: [
      { wrong: "1/2 + 1/3 = 2/5 (added tops AND bottoms)", right: "Bottoms never get added. Convert first: 1/2 = 3/6 and 1/3 = 2/6, then 3/6 + 2/6 = 5/6" },
      { wrong: "Adding the numerators while the denominators are still different", right: "Different-size pieces can't be counted together — make them the same size first" },
      { wrong: "Leaving 3/6 as the final answer", right: "Check for simplifying every time: 3/6 = 1/2" },
    ],
    predict: { q: "1/2 + 1/3 — what do you check FIRST?", options: ["The denominators — are they the same?", "Add the tops", "Add the bottoms", "Flip the second fraction"], correct: 0 },
    trick: "Denominators first — always. Same? Go. Different? Convert, THEN go.",
    recap: ["Check the denominators first", "Same → add/subtract tops; different → common denominator, convert, then go", "Always try to simplify at the end"],
  },
  {
    match: /multiply.*fraction|fraction.*multiply/i,
    why: "Multiplying fractions answers 'a part OF a part' — half of a third of the cake. It's the one fraction operation where you never need a common denominator.",
    rule: [
      "STEP 1 — No common denominator needed for multiplying",
      "Multiply the two NUMERATORS: top × top",
      "Multiply the two DENOMINATORS: bottom × bottom",
      "Write the new fraction: 2/3 × 4/5 → 2×4 = 8 over 3×5 = 15 → 8/15",
      "FINISH — simplify if any number divides both top and bottom",
    ],
    mistakes: [
      { wrong: "Finding a common denominator before multiplying", right: "That's only for + and −. Multiplying goes straight across" },
      { wrong: "2/3 × 4/5 = 6/8 (cross-mixed the numbers)", right: "Tops together, bottoms together: 2×4 = 8, 3×5 = 15 → 8/15" },
    ],
    predict: { q: "2/3 × 4/5 — what's the FIRST step?", options: ["Multiply the numerators: 2 × 4", "Find a common denominator", "Flip the second fraction", "Add the tops"], correct: 0 },
    trick: "Multiplying is the easy one: straight across the top, straight across the bottom.",
    recap: ["No common denominator needed", "Top × top, bottom × bottom", "Simplify the result"],
  },
  {
    match: /divide.*fraction|fraction.*divide/i,
    why: "Dividing by a fraction asks 'how many of these pieces fit?' — how many quarter-cups in 2/3 of a cup. The trick: dividing by a number is the SAME as multiplying by its flip.",
    rule: [
      "STEP 1 — KEEP the first fraction exactly as it is: 2/3",
      "STEP 2 — CHANGE the ÷ into ×",
      "STEP 3 — FLIP the second fraction (its reciprocal): 4/5 → 5/4",
      "STEP 4 — Now multiply: 2/3 × 5/4 = 2×5 over 3×4 = 10/12",
      "FINISH — simplify: 10/12 = 5/6",
    ],
    mistakes: [
      { wrong: "Flipping the FIRST fraction instead of the second", right: "Keep–Change–Flip: the first stays, only the fraction you're dividing BY gets flipped" },
      { wrong: "Flipping and then still dividing", right: "The flip only works together with changing ÷ to × — do both" },
    ],
    predict: { q: "2/3 ÷ 4/5 — which fraction gets flipped?", options: ["The second one: 4/5 becomes 5/4", "The first one: 2/3 becomes 3/2", "Both of them", "Neither"], correct: 0 },
    trick: "Keep–Change–Flip: KEEP the first, CHANGE ÷ to ×, FLIP the second.",
    recap: ["Keep the first fraction", "Change ÷ to × and flip the second", "Multiply straight across, then simplify"],
  },
  {
    match: /simplify.*fraction|reduce.*fraction|lowest terms/i,
    // ONE example everywhere — 4/8 → 1/2 — matching the animation (user: mixed
    // examples across rule/picture/worked-example confuse students).
    why: "Simplifying doesn't change a fraction's value — it just uses bigger pieces. 4/8 of a pizza IS 1/2 of the pizza; 1/2 is simply the clearest way to say it.",
    rule: [
      "STEP 1 — Find a number that divides EVENLY into both the top and the bottom",
      "STEP 2 — Divide both by that same number: 4/8 → both divide by 4",
      "4 ÷ 4 = 1 and 8 ÷ 4 = 2 → 1/2",
      "STEP 3 — Repeat until no number bigger than 1 divides both — 1/2 is done",
    ],
    mistakes: [
      { wrong: "Dividing only the top: 4/8 → 1/8", right: "Whatever you do to the top you MUST do to the bottom: 4/8 → 1/2" },
      { wrong: "Stopping too early: 4/8 → 2/4 and done", right: "2 and 4 still share a 2 — keep going to 1/2" },
    ],
    predict: { q: "Simplify 4/8 — what is the BIGGEST number that divides BOTH 4 and 8?", options: ["4", "2", "8", "3"], correct: 0 },
    trick: "Same number, top AND bottom — and keep going until nothing fits.",
    recap: ["Divide top and bottom by the same number", "Repeat until only 1 divides both", "The value never changes — only the piece size"],
  },
  {
    match: /equivalent fraction/i,
    why: "Equivalent fractions are the same amount cut into different pieces — 1/2, 2/4 and 4/8 are the same half. This is the skill that makes adding unlike fractions possible.",
    rule: [
      "Multiply (or divide) the top AND bottom by the SAME number",
      "1/2 × (3 over 3) = 3/6 — same value, smaller pieces",
      "To check two fractions: cross-multiply — equal products means equivalent",
      "Never add the same number to top and bottom — that CHANGES the value",
    ],
    mistakes: [
      { wrong: "1/2 = 2/3 by adding 1 to top and bottom", right: "Adding changes the value — only MULTIPLYING both keeps it equal: 1/2 = 2/4" },
      { wrong: "Multiplying only the numerator", right: "Both or neither: 1/2 → (1×3)/(2×3) = 3/6" },
    ],
    predict: { q: "Which fraction is equivalent to 1/2?", options: ["3/6", "2/3", "1/3", "3/5"], correct: 0 },
    trick: "Whatever multiplies the top multiplies the bottom.",
    recap: ["Same multiplier top and bottom", "The value stays identical", "Cross-multiply to check"],
  },
  {
    match: /compar.*fraction|order.*fraction|fractions with pictures/i,
    why: "Comparing fractions tells you which deal, share or measurement is bigger. The catch: a bigger bottom number means SMALLER pieces.",
    rule: [
      "STEP 1 — Check the denominators first",
      "Same bottoms? The bigger TOP wins: 3/7 > 2/7",
      "Same tops? The SMALLER bottom wins: 1/3 > 1/5 (thirds are bigger pieces)",
      "Otherwise: convert to a common denominator, then compare tops",
    ],
    mistakes: [
      { wrong: "1/8 > 1/4 because 8 > 4", right: "More slices = smaller slices. 1/4 of a pizza beats 1/8" },
      { wrong: "Comparing tops while the bottoms differ", right: "Make the pieces the same size first (common denominator), then compare" },
    ],
    predict: { q: "Which is bigger: 1/3 or 1/5?", options: ["1/3 — thirds are bigger pieces", "1/5 — 5 is bigger", "They're equal", "Can't tell"], correct: 0 },
    trick: "Big bottom, small piece.",
    recap: ["Denominators first", "Same-size pieces → compare the counts", "Bigger denominator = smaller piece"],
  },
  {
    match: /mixed number|improper fraction/i,
    why: "Mixed numbers (2½) are how people talk; improper fractions (5/2) are how math calculates. You need to switch between them in both directions without thinking.",
    rule: [
      "Mixed → improper: multiply the whole by the bottom, add the top, keep the bottom",
      "2½ → 2×2 + 1 = 5 → 5/2",
      "Improper → mixed: divide top by bottom; quotient = whole, remainder = new top",
      "7/3 → 7 ÷ 3 = 2 remainder 1 → 2⅓",
      "To add/subtract/multiply/divide mixed numbers: convert to improper FIRST, compute, convert back",
    ],
    mistakes: [
      { wrong: "2½ = 3/2 (added the whole to the top)", right: "Multiply first: 2×2 = 4, THEN add 1 → 5/2" },
      { wrong: "Computing with mixed numbers directly (2½ × 1⅓ = 2⅙)", right: "Convert to improper first: 5/2 × 4/3 = 20/6 = 3⅓" },
    ],
    predict: { q: "Turn 2½ into an improper fraction — first move?", options: ["Multiply 2 × 2 (whole × bottom)", "Add 2 + 1", "Flip it", "Divide 2 by 2"], correct: 0 },
    trick: "Mixed to improper: around the loop — multiply up, add across, bottom stays.",
    recap: ["Whole × bottom + top → improper", "Divide with remainder → mixed", "Convert BEFORE calculating with mixed numbers"],
  },
  {
    // Basics catch-all — but NOT for conversion or equation lessons, which have
    // their own families further down (percents / equations).
    match: /^(?!.*(?:percent|equation|decimal))(?=.*(?:fraction|numerator|denominator|part of a whole)).*$/i,
    why: "A fraction is just a count of equal parts — the bottom says how many parts make the whole, the top says how many you have. Pizza slices, half-time, quarter tanks: all fractions.",
    rule: [
      "The BOTTOM number (denominator) = how many EQUAL parts the whole is cut into",
      "The TOP number (numerator) = how many of those parts you're counting",
      "Read the picture: count ALL the parts first → that's the bottom",
      "Then count the shaded parts → that's the top: 3 shaded of 4 parts = 3/4",
    ],
    mistakes: [
      { wrong: "Writing 4/3 for 3 shaded out of 4 parts", right: "Shaded goes ON TOP: 3/4. Top = what you have, bottom = the whole" },
      { wrong: "Counting unequal parts as a fraction", right: "Fractions only work when every part is the SAME size" },
    ],
    predict: { q: "A pizza is cut into 8 equal slices and 5 are left. What fraction is left?", options: ["5/8", "8/5", "5/13", "3/8"], correct: 0 },
    trick: "Top = have, bottom = whole.",
    recap: ["Bottom = total equal parts", "Top = parts you're counting", "Equal parts or it isn't a fraction"],
  },
  {
    match: /decimal/i,
    why: "Decimals are the money-and-measurement version of fractions — prices, race times, weights. Getting the decimal point right is what keeps $2.50 from becoming $25.",
    rule: ["Line up the decimal points", "Fill empty places with zeros", "Add, subtract or multiply like whole numbers", "Place the decimal point in the answer"],
    mistakes: [
      { wrong: "Adding 3.5 + 1.25 with the ends lined up", right: "Line up the decimal POINTS, not the last digits" },
      { wrong: "0.3 × 0.2 = 0.6", right: "Count decimal places: 1 + 1 = 2 places → 0.06" },
    ],
    recap: ["Line up the decimal points", "Zeros can fill empty places", "Count decimal places when multiplying"],
  },
  {
    match: /percent/i,
    why: "Percents run the real world — discounts, tips, taxes, interest, test scores. 'Percent' just means 'out of 100'.",
    rule: ["Percent means ÷ 100", "Turn the percent into a decimal", "OF means multiply", "Compute"],
    mistakes: [
      { wrong: "25% of 80 = 25 × 80", right: "Convert first: 0.25 × 80 = 20" },
      { wrong: "A 10% rise then 10% drop = back to start", right: "The 10% drop is of a BIGGER number — you end up lower" },
    ],
    predict: { q: "25% of 80 — what happens FIRST?", options: ["Turn 25% into 0.25", "Multiply 25 × 80", "Divide 80 by 25", "Add 25 + 80"], correct: 0 },
    trick: "Per-cent = per hundred.",
    recap: ["Percent = out of 100", "'Of' means multiply", "Convert to a decimal before computing"],
  },
  {
    // "plot the/a point" is graphing; "Plot: Problem to Solution" is a STORY —
    // reading units must never get the y = mx + b lesson.
    match: /plot (the|a|each|points?)\b(?! arc)|plotting|coordinate|graph.*line|slope|intercept|linear (equation|function)|y\s*=/i,
    why: "Graphs turn equations into pictures. One glance at a line tells you a story — how fast something grows, where it starts, when two things meet.",
    rule: ["y = mx + b", "b is where the line crosses the y-axis — start there", "m is the slope: rise over run", "From the start point, move run right and rise up, then connect"],
    mistakes: [
      { wrong: "Plotting (3, 2) by going UP 3 then RIGHT 2", right: "x comes first: RIGHT 3, then UP 2" },
      { wrong: "Reading slope as run/rise", right: "Slope is RISE over RUN — vertical change first" },
    ],
    predict: { q: "Graphing y = 2x + 3 — where do you START?", options: ["At 3 on the y-axis", "At 2 on the x-axis", "At the origin", "At (2, 3)"], correct: 0 },
    trick: "b for Begin (start at b), m for Move (the slope).",
    recap: ["Start at the y-intercept b", "Slope m = rise over run", "x first, then y when plotting points"],
  },
  {
    match: /exponent|power of(?! i)|scientific notation|square.root|radical|cube|simplify roots|estimate.*roots/i,
    why: "Exponents are shorthand for repeated multiplying — how populations grow, how interest compounds, how computers measure memory.",
    rule: ["xᵃ · xᵇ = xᵃ⁺ᵇ (same base: add exponents)", "xᵃ ÷ xᵇ = xᵃ⁻ᵇ", "(xᵃ)ᵇ = xᵃᵇ", "x⁰ = 1"],
    mistakes: [
      { wrong: "x² · x³ = x⁶  (multiplied the exponents)", right: "Same base, MULTIPLYING terms → ADD exponents: x⁵" },
      { wrong: "3² = 6", right: "3² = 3 × 3 = 9 — a power is repeated multiplication, not multiplication by 2" },
    ],
    recap: ["Multiplying same bases → add exponents", "A power is repeated multiplication", "Anything to the 0 power is 1"],
  },
  {
    // "Expressions · Order integers" must NOT fall into the equations family
    // below — its "Expressions" prefix is just the M10 topic name.
    match: /order of operations|\bbedmas\b|\bpemdas\b/i,
    why: "When one expression has +, × and brackets all at once, everyone has to agree on what to do first — otherwise the same problem gives different answers.",
    rule: ["Brackets first", "Then exponents", "Then × and ÷, left to right", "Then + and −, left to right"],
    mistakes: [
      { wrong: "2 + 3 × 4 = 20 (added first)", right: "× before +: 3 × 4 = 12, then 2 + 12 = 14" },
      { wrong: "Doing ÷ after × always", right: "× and ÷ share a step — work left to right" },
    ],
    predict: { q: "2 + 3 × 4 = ?", options: ["14", "20", "24", "9"], correct: 0 },
    trick: "Brackets, Exponents, Divide/Multiply, Add/Subtract — left to right within each step.",
    recap: ["Brackets → exponents → ×÷ → +−", "×÷ tie: go left to right", "+− tie: go left to right"],
  },
  {
    match: /evaluate \(|evaluate the expression|substitut/i,
    why: "Evaluating is how a formula becomes a number — plug in what you know, and the expression tells you the answer.",
    rule: ["Write the expression out", "Replace each letter with its given value", "Put the number in brackets so signs stay right", "Now just do the arithmetic (order of operations)"],
    mistakes: [
      { wrong: "3x with x = 4 → 34", right: "3x means 3 × 4 = 12 — the letter is multiplied, not stuck on" },
      { wrong: "x² with x = −3 → −9", right: "Bracket it: (−3)² = 9" },
    ],
    predict: { q: "Evaluate 3x + 5 when x = 4", options: ["17", "35", "12", "9"], correct: 0 },
    trick: "Swap the letter for its value — in brackets — then compute.",
    recap: ["Substitute, don't solve", "Use brackets around the value", "Finish with order of operations"],
  },
  {
    match: /order integers|order.*(least to greatest|greatest to least)|compare integers/i,
    why: "Negative numbers show up everywhere — temperatures, bank balances, elevations. Knowing which is bigger keeps you from thinking −10° is warmer than −2°.",
    rule: ["Picture the number line: left is smaller, right is bigger", "Every negative is smaller than every positive", "For two negatives, the one further from zero is SMALLER", "Zero sits between all negatives and all positives"],
    mistakes: [
      { wrong: "Saying −8 > −3 because 8 > 3", right: "−8 is further LEFT on the number line, so −8 < −3" },
      { wrong: "Forgetting zero beats every negative", right: "0 > any negative number" },
    ],
    predict: { q: "Which is SMALLEST: 2, −3, or 1?", options: ["−3", "1", "2", "They're equal"], correct: 0 },
    trick: "More negative = further left = smaller.",
    recap: ["Left on the number line = smaller", "Negatives < 0 < positives", "Between negatives, bigger digits mean smaller value"],
  },
  {
    match: /equation|solve for|inequal|variable|unknown|order of operations|expressions|evaluate \(|missing number(?! in a sequence)/i,
    why: "Solving equations is detective work: some number is hiding, and you undo operations one at a time until it's caught. It's the core skill of all algebra.",
    rule: ["Get the variable terms on one side", "Undo + and − first", "Then undo × and ÷", "Whatever you do to one side, do to the other"],
    mistakes: [
      { wrong: "Doing an operation to only one side", right: "An equation is a balance — both sides, always" },
      { wrong: "Flipping the inequality only sometimes", right: "Multiply or divide by a NEGATIVE → flip the inequality sign" },
    ],
    predict: { q: "Solving 3x + 5 = 20 — what do you undo FIRST?", options: ["The + 5", "The × 3", "The 20", "The x"], correct: 0 },
    trick: "Undo in reverse — peel the onion from the outside in.",
    recap: ["Same move on both sides", "Undo +/− before ×/÷", "Check by plugging your answer back in"],
  },
  {
    match: /place value|rounds?|rounding|expanded form|tens|hundreds|thousand/i,
    why: "Place value is what makes 21 different from 12. Every big number you'll ever read, round or estimate depends on knowing what each digit is worth.",
    rule: ["Each place is 10× the place to its right", "Find the digit in the place you need", "Look one place to the RIGHT to round", "5 or more rounds up; 4 or less stays"],
    mistakes: [
      { wrong: "Rounding 47 to 40 'because 4 is small'", right: "Look at the ones digit: 7 rounds UP → 50" },
      { wrong: "Reading 305 as 'thirty-five'", right: "The 0 holds the tens place: three hundred five" },
    ],
    recap: ["Each place is worth 10× the one to its right", "Round by looking one digit right", "Zeros hold places"],
  },
  {
    match: /divi|quotient|remainder|÷|halving|near-halv/i,
    why: "Division is fair sharing — splitting a bill, sharing candies, working out how many teams you can make. It's multiplication run backwards.",
    rule: ["How many groups of the divisor fit?", "Multiply and subtract to see what's left", "Bring down the next digit and repeat", "Leftover at the end = remainder"],
    mistakes: [
      { wrong: "12 ÷ 4 = 4 because 'they go together'", right: "Ask: 4 × ? = 12 → the answer is 3" },
      { wrong: "Dropping the remainder", right: "Say what's left over: 13 ÷ 4 = 3 R1" },
    ],
    predict: { q: "56 ÷ 8 — which question finds the answer?", options: ["8 × ? = 56", "8 + ? = 56", "56 × 8 = ?", "? − 8 = 56"], correct: 0 },
    trick: "Division is just multiplication in reverse — think '? × divisor = the number'.",
    recap: ["Think multiplication backwards", "Divide, multiply, subtract, bring down", "Name the remainder"],
  },
  {
    match: /multipl|times table|product|array|×|square facts/i,
    why: "Multiplication is fast adding — 6 boxes of 8 crayons without counting every crayon. Master it and half of all later math gets easier.",
    rule: ["a × b means a groups of b", "Break hard ones apart: 7 × 6 = 7 × 5 + 7", "Order doesn't matter: 3 × 8 = 8 × 3"],
    mistakes: [
      { wrong: "7 × 0 = 7", right: "7 groups of NOTHING is 0 — anything × 0 = 0" },
      { wrong: "Adding instead of multiplying: 4 × 3 = 7", right: "4 × 3 means 4 groups of 3 → 12" },
    ],
    predict: { q: "6 × 4 means…", options: ["6 groups of 4", "6 plus 4", "6 minus 4", "64"], correct: 0 },
    trick: "Flip it if it's easier — 3 × 8 is the same as 8 × 3.",
    recap: ["Multiplying = repeated adding", "You can flip the order", "Anything times 0 is 0"],
  },
  {
    match: /subtract|difference|take away|borrow|regroup|bridging down/i,
    why: "Subtraction answers 'how many are left?' and 'how far apart?' — change at the store, days until your birthday, how much taller you've grown.",
    rule: ["Line up the place values", "Subtract the ones first", "Not enough? Regroup — borrow 10 from the next place", "Move left, place by place"],
    mistakes: [
      { wrong: "Flipping to the easier order: 3 − 7 → 7 − 3", right: "Order matters in subtraction — regroup instead" },
      { wrong: "Forgetting the borrow reduced the next digit", right: "After borrowing, the neighbour digit is 1 smaller" },
    ],
    recap: ["Start from the ones place", "Borrow when the top digit is too small", "Check by adding back up"],
  },
  {
    match: /add|sum|plus|counting on|doubles|make ten|bridging|fact famil/i,
    why: "Adding is putting together — points in a game, money in a piggy bank. It's the first tool in every math toolbox.",
    rule: ["Line up the place values", "Add the ones first", "10 or more? Carry the 1 to the next place", "Move left, place by place"],
    mistakes: [
      { wrong: "Writing 13 in the ones column", right: "Write 3, carry the 1 to the tens" },
      { wrong: "Forgetting the carried 1", right: "The little 1 on top must be added too" },
    ],
    predict: { q: "Adding 38 + 25 — which digits combine FIRST?", options: ["8 and 5 (the ones)", "3 and 2 (the tens)", "3 and 5", "38 and 2"], correct: 0 },
    trick: "Start big, count on — 3 + 9? Start at 9 and count up 3.",
    recap: ["Line up the places", "Carry when a column hits 10", "You can add in any order"],
  },
  {
    match: /\bvectors?\b|magnitude/i,
    why: "A vector is an arrow — it has a direction AND a length. Flight paths, forces, video-game movement: anything that goes somewhere is a vector.",
    rule: [
      "A vector (x, y) means: go x across, y up",
      "ADD vectors part by part: x with x, y with y — (3, 1) + (2, 4) = (5, 5)",
      "MAGNITUDE = the arrow's length: √(x² + y²)",
      "(3, 4) has magnitude √(9 + 16) = √25 = 5 — a right triangle in disguise",
    ],
    mistakes: [
      { wrong: "(3, 1) + (2, 4) = (7, 3) — mixing the parts", right: "Match the parts: x + x and y + y → (5, 5)" },
      { wrong: "Magnitude of (3, 4) = 3 + 4 = 7", right: "It's the diagonal, not the sum: √(3² + 4²) = 5" },
    ],
    predict: { q: "What is (2, 3) + (4, 1)?", options: ["(6, 4)", "(6, 3)", "(2, 4)", "(10, 0)"], correct: 0 },
    trick: "x stays with x, y stays with y — and length is Pythagoras.",
    recap: ["A vector = direction + length", "Add matching parts", "Magnitude = √(x² + y²)"],
  },
  {
    match: /matri|determinant/i,
    why: "Matrices move and transform things — every 3-D game, robot arm and photo filter multiplies matrices under the hood.",
    rule: ["Match positions to add: row by row, column by column", "To multiply: row × column, then sum", "Sizes must be compatible"],
    mistakes: [
      { wrong: "Multiplying matrices entry-by-entry", right: "Multiply ROW by COLUMN and add the products" },
      { wrong: "Assuming AB = BA", right: "Matrix multiplication order matters" },
    ],
    recap: ["Add position by position", "Multiply row × column", "Order matters when multiplying"],
  },
  {
    // No bare /data/ — "Reading Data-Heavy Texts" (R58) was getting the MATH
    // statistics family ("Mean: add them all…").
    match: /probabilit|statistic|\bmean\b(?!s| the same|ing)|median|\bmode\b|data set|survey/i,
    why: "Statistics turn piles of numbers into decisions — which player to draft, whether a game is fair, what the 'typical' result really is.",
    rule: ["Mean: add them all, divide by how many", "Median: sort, take the middle", "Mode: the most frequent", "Probability = favourable ÷ total outcomes"],
    mistakes: [
      { wrong: "Taking the median without sorting", right: "Sort the list FIRST, then find the middle" },
      { wrong: "Probability of 3 out of 4 = 3", right: "It's a fraction of the total: 3/4" },
    ],
    recap: ["Mean = share out equally", "Median = middle of the SORTED list", "Probability is favourable over total"],
  },
  {
    match: /sequence|series|arithmetic.*geometric|pattern/i,
    why: "Sequences are patterns with rules — savings that grow monthly, bacteria that double. Find the rule and you can predict any term without listing them all.",
    rule: ["Find what changes between terms", "Same amount added each time → arithmetic", "Same amount multiplied → geometric", "Write the rule, then jump to any term"],
    mistakes: [
      { wrong: "Assuming the pattern from just two terms", right: "Check the rule works for at least three terms" },
      { wrong: "Mixing up 'add 3 each time' with 'times 3'", right: "Subtract neighbours to test adding; divide to test multiplying" },
    ],
    recap: ["Compare neighbouring terms", "Add-pattern = arithmetic, multiply-pattern = geometric", "Test your rule on the next term"],
  },
  {
    // Word-bounded: "rational function" must NOT land in ratios (real bug —
    // M14 "Domain of a rational function" got the ratios lesson).
    match: /\bratios?\b|proportion|scale up|unit rate/i,
    why: "Ratios compare two amounts — 2 cups of flour to 1 of sugar, 3 goals in 5 games. Recipes, maps, prices and speed all run on ratios.",
    rule: ["Write the comparison as a : b (or a/b)", "Simplify like a fraction — divide both by the same number", "Missing value? Set two ratios equal", "Cross-multiply and solve"],
    mistakes: [
      { wrong: "Writing the ratio in the wrong order", right: "3 cats to 5 dogs is 3:5 — order follows the words" },
      { wrong: "Adding to scale a ratio: 2:3 → 4:5", right: "SCALE by multiplying both parts: 2:3 → 4:6" },
    ],
    predict: { q: "Scaling the ratio 2 : 3 up — what do you do?", options: ["Multiply BOTH parts by the same number", "Add the same number to both", "Multiply only the bigger part", "Swap the parts"], correct: 0 },
    trick: "A ratio is a fraction in disguise — whatever you do to one part, do to the other.",
    recap: ["Order follows the words", "Simplify like a fraction", "Scale by multiplying both parts"],
  },
  {
    // "Cell functions" (science) must not get the f(x) machine lesson.
    match: /(?<!cell )functions?\b(?! of (a )?cell)|f\(x\)|domain|range|composition|inverse/i,
    why: "A function is a machine: numbers go in, one number comes out. Apps, formulas and games are all built from functions feeding into each other.",
    rule: ["f(x) is the machine's rule", "Evaluate: replace every x with the input", "Compose: the inner function's OUTPUT is the outer one's INPUT", "Inverse: swap x and y, then solve for y"],
    mistakes: [
      { wrong: "f(3) means f × 3", right: "f(3) means 'run the machine with input 3' — substitute, don't multiply" },
      { wrong: "Working outside-in when composing f(g(x))", right: "Do g first (inside), feed its result into f" },
    ],
    predict: { q: "f(x) = 2x + 1. What is f(4)?", options: ["9", "6", "8", "241"], correct: 0 },
    trick: "A function is a vending machine — one input, exactly one output.",
    recap: ["Substitute the input for every x", "Compose inside-out", "Inverse = swap x and y, re-solve"],
  },
  {
    match: /end behavior|turning point|multiplicity|fundamental theorem|rational root|synthetic/i,
    why: "A polynomial's equation secretly describes its whole picture — where the graph starts, wiggles and ends. Read the equation and you can sketch the curve without plotting a single point.",
    rule: ["Degree n → at most n x-intercepts and n−1 turning points", "Even degree: ends match; odd: ends point opposite ways", "Positive lead: right end rises; negative: it falls", "Each root is where the graph touches or crosses zero"],
    mistakes: [
      { wrong: "Judging end behavior from the constant term", right: "Only the LEADING term (highest power) controls the ends" },
      { wrong: "Expecting exactly n−1 turning points", right: "n−1 is the MAXIMUM — there can be fewer" },
    ],
    predict: { q: "Degree 4, positive leading coefficient — the two ends of the graph…", options: ["Both go UP", "Both go down", "Left up, right down", "Left down, right up"], correct: 0 },
    recap: ["The leading term rules the ends", "Degree caps the roots and turns", "Even ends match, odd ends differ"],
  },
  {
    match: /logarithm|\blogs?\b|natural log|ln\b/i,
    why: "Logarithms answer 'what exponent gets me there?' — how many doublings to a million, how loud an earthquake is, how long till savings double. They're exponents in reverse.",
    rule: ["log_b(x) asks: b to WHAT power gives x?", "log_2(8) → 2^? = 8 → 3", "log of 1 is always 0", "You can't take the log of 0 or a negative"],
    mistakes: [
      { wrong: "log_2(8) = 4 (dividing 8 by 2)", right: "Ask 2^? = 8. Since 2³ = 8, the answer is 3" },
      { wrong: "log(a + b) = log a + log b", right: "Logs turn MULTIPLICATION into addition: log(ab) = log a + log b" },
    ],
    predict: { q: "log₃(9) asks…", options: ["3 to what power gives 9?", "9 ÷ 3", "3 × 9", "9 to what power gives 3?"], correct: 0 },
    trick: "A log is just a question: 'what's the exponent?'",
    recap: ["Rewrite as base^? = number", "log 1 = 0 always", "Logs undo exponents"],
  },
  {
    match: /transformation|translat|reflect|rotat|dilat/i,
    why: "Transformations move shapes without breaking them — every game sprite, map app and animation slides, flips, turns and zooms shapes all day long.",
    rule: ["Translate = slide: add to x and y", "Reflect = flip over a line: one coordinate changes sign", "Rotate = turn around a point", "Dilate = zoom: multiply both coordinates"],
    mistakes: [
      { wrong: "Reflecting over the x-axis by changing x", right: "Over the x-axis the point moves up/down → the Y changes sign" },
      { wrong: "Adding when dilating", right: "Dilation MULTIPLIES both coordinates by the scale factor" },
    ],
    predict: { q: "Reflect (3, 2) over the x-axis…", options: ["(3, −2)", "(−3, 2)", "(2, 3)", "(−3, −2)"], correct: 0 },
    recap: ["Slide = add", "Flip = one sign changes", "Zoom = multiply both"],
  },
  {
    match: /count|which is|numbers? (after|before)|compare|greater|less|order integers|ordinal|missing number in a sequence/i,
    why: "Counting and comparing are the bedrock of every bit of math you'll ever do — knowing which number comes next and which is bigger is how you make sense of scores, prices and ages.",
    rule: ["The number line goes small → big, left → right", "AFTER means one step right; BEFORE means one step left", "Further right = greater", "Skip counting jumps the same amount each time"],
    mistakes: [
      { wrong: "Thinking 19 is bigger than 21 because 9 > 1", right: "Compare the TENS first: 2 tens beats 1 ten, so 21 > 19" },
      { wrong: "Restarting the count after a jump", right: "Keep the rhythm going: 5, 10, 15, 20 …" },
    ],
    predict: { q: "Which is greater: 34 or 43?", options: ["43", "34", "They're equal", "Can't tell"], correct: 0 },
    trick: "Picture the number line — bigger numbers live to the right.",
    recap: ["Number line: left = small, right = big", "Compare the biggest place first", "After = +1, before = −1"],
  },
  // ── Reading families (R1–R60) — specific families FIRST, broad catch-all last ──
  {
    match: /fluency|smooth word|phrase reading|reading with expression|punctuation cues|reading stamina/i,
    why: "Fluency is reading like you talk — smooth, at the right speed, with feeling. When reading sounds like talking, your brain is free to think about what the words MEAN.",
    rule: ["Read the phrase, not letter by letter", "Let punctuation tell you when to pause and when your voice goes up", "Reread a sentence until it sounds like talking", "Speed comes from practice, never from rushing"],
    mistakes: [
      { wrong: "Reading word... by... word... like a robot", right: "Group words into phrases: 'The big dog / ran fast.'" },
      { wrong: "Ignoring the marks: racing past periods and question marks", right: "Period = stop. Question mark = voice goes up." },
    ],
    predict: { q: "What does a question mark tell your voice to do?", options: ["Go up at the end", "Get louder", "Stop completely", "Nothing"], correct: 0 },
    trick: "Read it like you'd say it to a friend.",
    recap: ["Read in phrases, not single words", "Punctuation is your conductor", "Smooth first, fast later"],
  },
  {
    match: /naming words|opposites|antonym|synonym|categor|prefix|suffix|compound word|shades of meaning|multiple meanings|greek & latin|word famil|academic word/i,
    why: "Words are LEGO bricks: parts snap together (un + happy), some mean the same, some mean the opposite. Knowing how words work lets you figure out words you've never seen.",
    rule: ["Break the word into parts: prefix + root + suffix", "The root carries the main meaning", "The prefix changes it (un- = not, re- = again)", "Check the new meaning back in the sentence"],
    mistakes: [
      { wrong: "Thinking synonyms are opposites", right: "SYNonyms = SAME-ish (big/large); ANTonyms = opposites (big/small)" },
      { wrong: "Guessing a word's meaning without checking the sentence", right: "Try your guess IN the sentence — it must make sense there" },
    ],
    predict: { q: "What does 'unhappy' mean?", options: ["Not happy", "Very happy", "Happy again", "Happy before"], correct: 0 },
    trick: "un- flips it, re- repeats it, -er compares it.",
    recap: ["Words break into meaningful parts", "Synonym = same, antonym = opposite", "Always test meaning in the sentence"],
  },
  {
    match: /who & what|where & when|written directions|what a sentence means/i,
    why: "Every sentence answers little questions — who did it, what happened, where and when. Catch those answers and you've understood the sentence.",
    rule: ["Read the whole sentence first", "WHO/WHAT = a person, animal or thing", "WHERE = a place · WHEN = a time", "Point to the exact word in the sentence that answers"],
    mistakes: [
      { wrong: "Answering from memory or imagination", right: "The answer must be IN the sentence — point to it" },
      { wrong: "Mixing up where and when", right: "WHERE is a place (park); WHEN is a time (morning)" },
    ],
    predict: { q: "'Sam ran to the park.' Where did Sam run?", options: ["To the park", "Sam", "Ran", "Yesterday"], correct: 0 },
    recap: ["The answer is in the sentence", "Who/what = person or thing", "Where = place, when = time"],
  },
  {
    match: /beginning, middle|problem & solution|retelling|plot structure|plot:|story elements/i,
    why: "Every story is a journey: it starts somewhere, a problem shows up, and by the end it gets solved. See the shape and you'll never get lost in a story again.",
    rule: ["Beginning: meet the characters and setting", "Middle: a PROBLEM appears and grows", "End: the problem gets solved", "Retell it in order: first, then, finally"],
    mistakes: [
      { wrong: "Retelling every tiny detail", right: "Retell the SHAPE: who, the problem, how it ended" },
      { wrong: "Skipping the problem — 'stuff happened'", right: "The problem IS the story — name it" },
    ],
    predict: { q: "Where does the problem usually get solved?", options: ["The end", "The beginning", "The title", "It doesn't"], correct: 0 },
    trick: "Somebody wanted… but… so… then…",
    recap: ["Beginning-middle-end is the story's shape", "Find the problem", "Retell in order"],
  },
  {
    match: /first, next|sequenc/i,
    why: "Order matters — in stories, recipes and instructions. Mix up the steps and the cake doesn't bake. Sequencing is putting events in the order they truly happened.",
    rule: ["Hunt for time words: first, next, then, after, finally", "Picture the events like a comic strip", "Ask: could this happen BEFORE that?", "Check your order against the text"],
    mistakes: [
      { wrong: "Using the order things are MENTIONED", right: "A text can mention things out of order — follow the time words" },
      { wrong: "Ignoring 'before' and 'after'", right: "'Before dinner, Sam washed up' — the washing came FIRST" },
    ],
    predict: { q: "Which word signals the LAST step?", options: ["Finally", "First", "Suddenly", "Because"], correct: 0 },
    recap: ["Time words are the trail markers", "Picture events as a comic strip", "Test: could B happen before A?"],
  },
  {
    match: /alike & different|compar(e|ing|ative)|contrast/i,
    why: "Comparing sharpens thinking: how are two characters, animals or articles alike, and how do they differ? Every subject you'll ever study asks this question.",
    rule: ["Pick the two things being compared", "List what's the SAME", "List what's DIFFERENT", "Watch for signal words: both, alike, but, however, instead"],
    mistakes: [
      { wrong: "Only finding differences", right: "'Compare' asks for BOTH: same AND different" },
      { wrong: "Comparing unfair categories (a lion's speed vs a whale's size)", right: "Compare the SAME feature: speed vs speed, size vs size" },
    ],
    predict: { q: "Which word signals a DIFFERENCE?", options: ["However", "Both", "Also", "And"], correct: 0 },
    trick: "Both = same · But = different.",
    recap: ["Same list + different list", "Compare matching features", "Signal words mark the turns"],
  },
  {
    match: /cause & effect|cause and effect|signal words: because/i,
    why: "Cause and effect is the WHY-machine of reading: one thing makes another happen. It rained (cause), so the game was cancelled (effect).",
    rule: ["The CAUSE happens first — it's the reason", "The EFFECT is what happens because of it", "Signal words: because, so, since, as a result", "Test it: 'X happened BECAUSE of Y' — does it make sense?"],
    mistakes: [
      { wrong: "Swapping them: 'the ground is wet, so it rained'", right: "The cause comes first in TIME: rain → wet ground" },
      { wrong: "Thinking two events touching = cause", right: "Ask: did one really MAKE the other happen?" },
    ],
    predict: { q: "'The power went out because of the storm.' What's the cause?", options: ["The storm", "The power", "The house", "The night"], correct: 0 },
    recap: ["Cause = the reason, effect = the result", "Because/so/since are the flags", "Test with 'X because Y'"],
  },
  {
    match: /fact vs opinion|spotting facts|spotting opinions|fact & opinion/i,
    why: "A fact can be CHECKED; an opinion is what someone feels. Readers who can tell them apart can't be fooled — by ads, posts or anyone.",
    rule: ["Fact: can you look it up or measure it?", "Opinion: feeling words — best, should, beautiful, boring", "One sentence can hide both", "Ask: could two people disagree and both be 'right'? Then it's opinion"],
    mistakes: [
      { wrong: "'Pizza is the best food' is a fact because I agree", right: "Agreeing doesn't make it checkable — 'best' is a feeling word" },
      { wrong: "Thinking facts are always TRUE", right: "A fact is CHECKABLE — checking can also prove it false" },
    ],
    predict: { q: "Which is a FACT?", options: ["Spiders have eight legs", "Spiders are scary", "Spiders are the worst", "Spiders are cool"], correct: 0 },
    trick: "Fact = check it. Opinion = feel it.",
    recap: ["Facts can be verified", "Feeling words flag opinions", "Sentences can mix both"],
  },
  {
    match: /supporting detail|key detail|shrinking a paragraph|somebody-wanted|central idea|analyzing an explanation|text structure/i,
    why: "The main idea is the tent; details are the poles holding it up. Finding which sentences SUPPORT the big one is how you take notes, study and summarize everything.",
    rule: ["Find the main idea first (often the first or last sentence)", "A supporting detail answers: how do you know?", "Cut anything that doesn't hold up the tent", "Retell the paragraph in one sentence"],
    mistakes: [
      { wrong: "Picking the most INTERESTING sentence as the main idea", right: "The main idea is what everything else points to — not the flashiest fact" },
      { wrong: "Summaries that copy whole sentences", right: "Summarize in YOUR words, shorter than the original" },
    ],
    predict: { q: "A supporting detail's job is to…", options: ["Prove the main idea", "Start the story", "Rhyme", "Ask a question"], correct: 0 },
    recap: ["Main idea first, details prove it", "Cut what doesn't support", "Summarize in your own words"],
  },
  {
    match: /text features|headings & captions|diagrams, charts|graphs, timelines|sidebars|print & layout|using features/i,
    why: "Nonfiction gives you a map: headings, captions, bold words, charts. Readers who use the map find answers in seconds instead of rereading everything.",
    rule: ["Headings tell you what a section is about", "Captions explain pictures; bold marks key words", "Charts and timelines pack facts into pictures", "Preview the features BEFORE reading the text"],
    mistakes: [
      { wrong: "Skipping charts and captions", right: "Features often hold answers the paragraphs never state" },
      { wrong: "Reading page 1 to page end to find one fact", right: "Scan the headings first — jump straight to the right section" },
    ],
    predict: { q: "Where would you look for what a photo shows?", options: ["The caption", "The title page", "The index", "The cover"], correct: 0 },
    recap: ["Features are the text's map", "Preview before reading", "Charts hold facts too"],
  },
  {
    match: /dictionary|glossary|encyclopedia|atlas|choosing the right reference|reference/i,
    why: "Nobody knows everything — great readers know WHERE to look. Each reference tool answers a different kind of question.",
    rule: ["Dictionary: what a word means and how to say it", "Glossary: this book's special words (back of the book)", "Encyclopedia: facts about a topic · Atlas: maps", "Guide words at the page top show what's on that page"],
    mistakes: [
      { wrong: "Using a dictionary to learn about volcanoes", right: "Word meanings → dictionary; topic facts → encyclopedia" },
      { wrong: "Flipping page by page for a word", right: "Use alphabetical order and the guide words" },
    ],
    predict: { q: "Where do you find what 'igneous' means in THIS book?", options: ["The glossary", "The atlas", "The cover", "A magazine"], correct: 0 },
    recap: ["Match the question to the tool", "Glossary = this book's words", "Guide words speed the search"],
  },
  {
    match: /claims & reasons|claim, evidence|unsupported claims|weak vs strong|argument|fallac|premise|rebuttal|counter|evaluating statistics|persuasive|\bevidence\b/i,
    why: "An argument is a claim standing on evidence. Learn to check the legs it stands on and no ad, post or speech can push you around.",
    rule: ["Find the CLAIM: what does the author want you to believe?", "Find the EVIDENCE: facts, examples, numbers", "Ask: is the evidence relevant, sufficient and true?", "Strong argument = claim + solid evidence + answers to objections"],
    mistakes: [
      { wrong: "Believing a claim because it's said loudly or often", right: "Repetition isn't evidence — look for the facts underneath" },
      { wrong: "'Everyone knows…' accepted as proof", right: "That's a fallacy (bandwagon) — demand real support" },
    ],
    predict: { q: "A claim with no evidence is…", options: ["Unsupported", "Proven", "A fact", "A summary"], correct: 0 },
    recap: ["Claim → evidence → judgment", "Evidence must be relevant AND sufficient", "Name the fallacies when you see them"],
  },
  {
    match: /bias|loaded language|one-sided|balanced vs|what's left out/i,
    why: "Every author stands somewhere. Bias isn't always lying — it's leaning. Spot the lean (word choice, what's left out) and you can weigh the text fairly.",
    rule: ["Notice LOADED words: 'freedom fighter' vs 'rebel'", "Ask: whose voice is missing?", "Compare with a second source", "Separate what happened from how it's framed"],
    mistakes: [
      { wrong: "Thinking bias means everything is false", right: "Biased texts can contain true facts — the LEAN is in selection and wording" },
      { wrong: "Trusting a text because it agrees with you", right: "Your own lean counts too — check sources you disagree with" },
    ],
    predict: { q: "Which phrasing shows bias?", options: ["'The reckless new policy'", "'The policy passed 52–48'", "'The vote was Tuesday'", "'The bill is 12 pages'"], correct: 0 },
    recap: ["Loaded words reveal the lean", "Ask what's missing", "Cross-check with another source"],
  },
  {
    match: /synthes|combining facts|sources disagree|two accounts|across sources|skimming|taking notes|citing where|abstracts|credibility|primary vs secondary|primary sources|research reading|research findings|historical|founding documents|diaries|legal & government|period language/i,
    why: "Real questions rarely fit in one text. Synthesis is combining several sources into one answer — the core skill of every report, project and real decision.",
    rule: ["Read each source and note its key points", "Sort: where do sources AGREE?", "Where they disagree, check dates, evidence and credibility", "Build ONE answer that uses the best of all sources — and say where each fact came from"],
    mistakes: [
      { wrong: "Quoting one source and calling it research", right: "One source is a viewpoint; several sources are research" },
      { wrong: "Treating all sources as equal", right: "A scientist's study and a random post don't weigh the same — check the source" },
    ],
    predict: { q: "Two sources disagree on a date. What first?", options: ["Check which source is more reliable", "Pick the earlier text", "Pick the longer text", "Skip the fact"], correct: 0 },
    recap: ["Note each source's key points", "Agreements build the backbone", "Weigh sources by credibility"],
  },
  {
    match: /ethos|rhetorical|repetition, parallelism|irony|understatement|persuasive speech/i,
    why: "Rhetoric is the toolbox of persuasion — how speeches move crowds and ads move wallets. Know the tools and you see the trick while it's happening.",
    rule: ["Ethos: trust me (character) · Pathos: feel this (emotion) · Logos: follow the logic (facts)", "Repetition and parallelism drive a point home", "Irony says one thing, means another", "Ask: which tool is working on me right now?"],
    mistakes: [
      { wrong: "Confusing pathos with weak arguing", right: "Emotion is a legitimate tool — just notice when it substitutes for evidence" },
      { wrong: "Reading irony literally", right: "'Nice weather' in a storm means the opposite — check tone against context" },
    ],
    predict: { q: "'As a doctor of 30 years…' is an appeal to…", options: ["Ethos (credibility)", "Pathos (emotion)", "Logos (logic)", "Rhyme"], correct: 0 },
    trick: "Ethos = trust, Pathos = tears, Logos = thinking.",
    recap: ["Three appeals: ethos, pathos, logos", "Repetition is a hammer", "Name the device to defuse it"],
  },
  {
    match: /simile|metaphor|personification|hyperbole|idiom|proverb|figurative/i,
    why: "Figurative language says more by not being literal: 'her smile was sunshine' tells you warmth in four words. Writers paint with these tools; readers who know them see the picture.",
    rule: ["Simile compares WITH like/as: brave as a lion", "Metaphor compares by BEING: he is a lion", "Personification gives human traits to non-humans", "Hyperbole exaggerates on purpose — read the feeling, not the math"],
    mistakes: [
      { wrong: "Reading 'I've told you a million times' as a count", right: "Hyperbole exaggerates for effect — the meaning is 'many times'" },
      { wrong: "Calling every comparison a simile", right: "No 'like' or 'as'? It's a metaphor" },
    ],
    predict: { q: "'The wind whispered.' Which device?", options: ["Personification", "Simile", "Hyperbole", "Fact"], correct: 0 },
    trick: "Simile has 'like' — the word LIKE is right there in simiLE... almost!",
    recap: ["Simile = like/as, metaphor = is", "Personification humanizes", "Hyperbole exaggerates the feeling"],
  },
  {
    match: /scientific (explanations|reading)|data, tables|hypotheses|science vocabulary|manuals|technical|specifications|precise language|standards & documentation|research papers|science journalism|data-heavy/i,
    why: "Science and technical texts are precision instruments: every word is chosen, every number matters. Read them the way they're built — slowly, exactly, checking the data.",
    rule: ["Read the question/purpose first: what was tested or explained?", "Numbers and tables ARE content — read them, don't skip them", "Technical words have exact meanings — check the definition given", "Conclusion must match the data: verify it yourself"],
    mistakes: [
      { wrong: "Skipping tables and reading only prose", right: "In technical text the table often IS the answer" },
      { wrong: "Assuming a familiar word means its everyday sense", right: "'Work', 'stress', 'significant' have precise technical meanings" },
    ],
    predict: { q: "A conclusion says 'plants grew faster' — where do you verify it?", options: ["The data table", "The title", "The cover photo", "The author bio"], correct: 0 },
    recap: ["Purpose first, then data, then conclusion", "Tables are content", "Technical words are exact"],
  },
  {
    match: /symbol|motif|allegor/i,
    why: "In great stories, things mean more than themselves: a storm can be anger, a road can be a life. Symbols are the story under the story.",
    rule: ["Notice objects or images the author keeps returning to", "Ask: what feeling or idea rides along with it?", "A repeated symbol is a MOTIF", "Test your reading: does it fit the whole story, not just one scene?"],
    mistakes: [
      { wrong: "Making everything a symbol", right: "Sometimes a door is just a door — repetition and emphasis mark real symbols" },
      { wrong: "One-scene interpretations", right: "A symbol's meaning must hold across the story" },
    ],
    predict: { q: "An author mentions the caged bird in every chapter. It's likely a…", options: ["Motif", "Typo", "Caption", "Footnote"], correct: 0 },
    recap: ["Repeated images carry meaning", "Motif = a repeating symbol", "Interpretations must fit the whole text"],
  },
  {
    match: /classic|literature|older language|literary criticism|critics|lenses|critical essay|philosoph|thought experiment|college-level|academic journal|long-form|lecture-companion|annotat|dense argument|media|news vs|headline|clickbait|verifying claims|algorithmic|independent reading|previewing texts|discussion & defense|capstone|full-work|rereading|multi-step reasoning|dense paragraph|complex text|tone & mood/i,
    why: "Advanced reading is a conversation across time — with authors, critics and ideas. Your job isn't to absorb; it's to question, weigh and answer back.",
    rule: ["Preview: what kind of text is this, and what's it trying to do?", "Annotate: mark claims, questions and key turns as you read", "Interrogate: what's assumed? what would change your mind?", "Respond: state your own reading, backed by lines from the text"],
    mistakes: [
      { wrong: "Reading difficult texts once, fast", right: "Hard texts are built for rereading — first pass for shape, second for depth" },
      { wrong: "Treating the critic (or the algorithm) as the final word", right: "Critics and feeds have angles too — check them against the text itself" },
    ],
    predict: { q: "The best support for YOUR interpretation is…", options: ["Lines from the text itself", "A friend's opinion", "The book's cover", "Its popularity"], correct: 0 },
    recap: ["Preview, annotate, interrogate, respond", "Reread on purpose", "Evidence comes from the text"],
  },
  {
    // Sight words are the OPPOSITE of phonics — recognized whole, never sounded
    // out — so they get their own family FIRST.
    match: /sight word|high.frequency/i,
    why: "Sight words are the words you meet on almost every page — the, said, was. Many break the phonics rules, so the goal is to know them INSTANTLY, by sight, without sounding out.",
    rule: [
      "Look at the WHOLE word, not letter by letter",
      "Say it, spell it, say it again: said — s-a-i-d — said",
      "Practise until it's instant — under one second",
      "If a sight word trips you mid-sentence, finish the sentence, then drill that word",
    ],
    mistakes: [
      { wrong: "Sounding out 'said' as s-ay-d", right: "Many sight words break the rules — memorize the whole shape: 'sed'" },
      { wrong: "Practising a word once and moving on", right: "Sight words need repetition — see it, say it, write it, until it's automatic" },
    ],
    predict: { q: "What makes a word a 'sight word'?", options: ["You know it instantly without sounding out", "It's very long", "It rhymes", "It starts with a capital"], correct: 0 },
    trick: "Whole word, one look, no sounding out.",
    recap: ["Recognize the whole word", "Many break phonics rules", "Repeat until instant"],
  },
  {
    // Handwriting basics get their own family — "Letter Formation" / "Tracing"
    // must not be told to "say your main idea first".
    match: /handwriting|letter formation|\btracing\b(?! an)|copying|spatial awareness|pencil grip/i,
    why: "Neat letters are the fastest way to make your ideas easy to read — teachers, friends and future-you will all thank your hand.",
    rule: ["Start each letter at the top", "Trace slowly — smooth beats fast", "Keep letters sitting on the line", "Leave a finger space between words"],
    mistakes: [
      { wrong: "Rushing and floating letters above the line", right: "Slow down — every letter sits on the line" },
      { wrong: "Starting letters from the bottom", right: "Start at the top and pull down" },
    ],
    trick: "Top to bottom, left to right.",
    recap: ["Start at the top", "Stay on the line", "Slow and smooth", "Space between words"],
  },
  {
    // NOT "Capital Letters & End Marks" — that's a punctuation/mechanics lesson.
    match: /^(?!.*capital)(?=.*(?:letter|phonic|vowel|consonant|blend|digraph|silent|rhym|syllab|sound|decod|cvc)).*$/i,
    why: "Letters and their sounds are the secret code of reading. Crack the code and every book, sign and game menu opens up to you.",
    rule: ["Every letter makes a sound (some make two!)", "Say each sound in order", "Blend the sounds together smoothly", "Say the whole word"],
    mistakes: [
      { wrong: "Guessing the word from the first letter", right: "Sound out EVERY letter, then blend" },
      { wrong: "Forgetting silent-e changes the vowel", right: "The e is quiet but it makes the vowel say its NAME: cap → cape" },
    ],
    predict: { q: "To read a new word, what do you do FIRST?", options: ["Say each letter's sound", "Guess from the picture", "Skip it", "Spell it backwards"], correct: 0 },
    trick: "Sound it out, then smoosh it together.",
    recap: ["Every letter has a sound", "Blend sounds left to right", "Silent-e makes the vowel say its name"],
  },
  {
    match: /comprehension|main idea|infer|story|character|setting|sequence|context|vocabulary|fluency|retell|summar|fiction|nonfiction|poem|author|word relationship|wh-? ?question|predicti|perspective|purpose|literary|theme|moral|point of view|text analysis/i,
    why: "Reading isn't just saying the words — it's catching what the writer means. Strong readers understand jokes, follow instructions and spot when something doesn't add up.",
    rule: ["Read carefully — every word matters", "Ask: who? what? where? why?", "Look back in the text for proof", "Answer in your own words"],
    mistakes: [
      { wrong: "Answering from memory without checking", right: "The proof is IN the text — look back before you answer" },
      { wrong: "Picking an answer because it sounds nice", right: "The right answer matches what the passage actually says" },
    ],
    predict: { q: "You're asked WHY a character did something. Where's the best evidence?", options: ["In the text itself", "In your imagination", "In the title only", "In the pictures only"], correct: 0 },
    trick: "Prove it from the page.",
    recap: ["Read every word", "Look back for evidence", "Answer in your own words"],
  },
  // ── Writing families ──
  {
    match: /sentence|grammar|noun|verb|adjective|adverb|pronoun|punctuat|capital|tense|agreement|spelling|apostrophe|comma|plural|conjunction|preposition|parts of speech|mechanic/i,
    why: "Grammar and punctuation are traffic signals for your ideas — they tell the reader where to pause, who did what, and when it happened. Clear writing gets taken seriously.",
    rule: ["Every sentence needs a WHO and a DID", "Start with a capital, end with . ? or !", "Subject and verb must agree (he runs, they run)", "Read it aloud — your ear catches mistakes"],
    mistakes: [
      { wrong: "she like pizza", right: "One subject needs the -s verb: she likeS pizza" },
      { wrong: "Joining two sentences with just a comma", right: "Use a period, a semicolon, or a joining word: and, but, so" },
    ],
    predict: { q: "Which is a complete sentence?", options: ["The dog barked.", "Running fast.", "Because it rained.", "My best friend."], correct: 0 },
    trick: "Who + did what = a sentence.",
    recap: ["Capital to punctuation = one sentence", "Subject and verb must agree", "Read it aloud to check"],
  },
  {
    match: /paragraph|essay|\bthesis\b|persuasi|narrative|informational|research|editing|composition|topic sentence|conclusion|draft|opinion|letter format|(?<!cell )structur|process|comparison writing|claim/i,
    why: "Good writing is how your ideas travel — a strong paragraph can convince a teacher, win a contest or make someone laugh from across the world.",
    rule: ["Say your main idea first (topic sentence)", "Back it up with 2–3 details or reasons", "Keep every sentence on topic", "Wrap up with a closing sentence"],
    mistakes: [
      { wrong: "Starting to write with no plan", right: "Jot your idea + 3 supports BEFORE writing" },
      { wrong: "Details that wander off topic", right: "Every sentence must serve the main idea — cut the rest" },
    ],
    predict: { q: "A paragraph starts with…", options: ["The main idea", "A random detail", "The conclusion", "A new topic"], correct: 0 },
    trick: "Tell them, prove it, wrap it up.",
    recap: ["Main idea first", "2–3 supporting details", "Close it off"],
  },
  // ── Science families ──
  {
    match: /animal|plant|body|habitat|living|life cycle|food (chain|web)|ecosystem|organ|cell|senses|human|adaptation|digest/i,
    why: "Life science explains YOU and everything alive around you — why you shiver, how a caterpillar becomes a butterfly, why bees matter to your lunch.",
    rule: ["Observe first — what do you notice?", "Group living things by their features", "Every part has a job (structure → function)", "Ask: what does it need to survive?"],
    mistakes: [
      { wrong: "Grouping animals by where they live only", right: "Group by FEATURES: fur, feathers, scales, backbone" },
      { wrong: "Thinking plants get food from the soil", right: "Plants MAKE food from sunlight — soil gives water and minerals" },
    ],
    predict: { q: "A scientist meets a new animal. What comes first?", options: ["Observe its features", "Name it", "Guess what it eats", "Take it home"], correct: 0 },
    recap: ["Observe before deciding", "Group by features", "Every body part has a job"],
  },
  {
    match: /solar|space|planet|star|weather|water cycle|machine|electric|energy|matter|force|magnet|rock|season|sound|light|heat|gravity|circuit|earth|moon|solid|liquid|gas|state change|melting|freezing|element|compound|chemical|acid|periodic/i,
    why: "Physical and earth science explain the everyday magic around you — why the moon changes shape, what makes a light turn on, why a ramp makes lifting easier.",
    rule: ["Observe what happens", "Ask what CAUSED it (force? energy? heat?)", "Predict what happens if you change one thing", "Test it and compare"],
    mistakes: [
      { wrong: "Heavier objects fall faster", right: "Gravity pulls everything the same — air resistance makes the difference" },
      { wrong: "A circuit works with one wire", right: "Electricity needs a complete LOOP back to the battery" },
    ],
    predict: { q: "Your circuit's bulb won't light. Check FIRST that…", options: ["The loop is complete", "The bulb is pretty", "The wire is long", "The battery is new-looking"], correct: 0 },
    recap: ["Look for the cause", "Change one thing at a time", "Test your prediction"],
  },
];

export const GENERIC: LessonExtras = {
  why: "Every skill in math builds on the one before it. Master this one now and the next lessons will feel easy instead of confusing.",
  rule: [],
  mistakes: [{ wrong: "Rushing and skipping steps", right: "Write every step — speed comes AFTER accuracy" }],
  recap: ["Read the question twice", "Work one step at a time", "Check your answer before moving on"],
};

export function getLessonExtras(skillName: string, umbrella?: string | null): LessonExtras {
  const key = `${skillName} ${umbrella ?? ""}`;
  const fam = FAMILIES.find((f) => f.match.test(key));
  return fam ?? GENERIC;
}

/** Rewrite a spec-sheet goal ("Differentiates axⁿ", "Student differentiates
 *  axⁿ") into student-facing language: "After this lesson you'll be able to
 *  differentiate axⁿ." Leaves already-friendly goals ("Understand …", "You
 *  will …") alone. */
export function friendlyGoal(raw: string, skillName: string): string {
  let g = raw.trim().replace(/^students?\s+/i, "");
  if (/^(you|after|by the end|learn|understand|practise|practice|master|today)/i.test(g)) return raw;
  // Only verb-phrase goals fit the "you'll be able to <verb> …" template.
  // Sentence-style goals ("Factoring is the reverse of expanding. Find two
  // numbers…") glued on produced garbage — leave those as written.
  const firstWord = g.split(/\s+/)[0] ?? "";
  const looksLikeSentence =
    /ing$/i.test(firstWord) ||                       // gerund subject: "Factoring is…"
    /^\w+\s+(is|are|means|tells|comes|shows)\b/i.test(g) || // definitional
    /[.!?]\s+\S/.test(g);                            // multiple sentences
  if (looksLikeSentence) return g;
  // Third-person verb → base form ("Differentiates" → "differentiate",
  // "Applies" → "apply", "Solves" → "solve"). Only touch the FIRST word.
  g = g.replace(/^([A-Za-z]+?)(ies|es|s)\b/, (_m, stem: string, suf: string) => {
    if (suf === "ies") return `${stem}y`;
    if (suf === "es" && /(sh|ch|ss|x|zz)$/.test(stem)) return stem;     // matches, pushes, fizzes
    if (suf === "es" && /z$/.test(stem)) return `${stem}e`;             // recognizes→recognize
    return stem + (suf === "es" ? "e" : "");                            // solves→solve, adds→add
  });
  g = g.charAt(0).toLowerCase() + g.slice(1);
  if (!/[.!?]$/.test(g)) g += ".";
  return `After this lesson, you'll be able to ${g}`;
}
