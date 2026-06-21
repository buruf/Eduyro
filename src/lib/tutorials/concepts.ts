// src/lib/tutorials/concepts.ts
// Concept-family tutorials shown before a student's FIRST practice of a skill.
// Each concept has: an animated visual (see TutorialVisual.tsx), a narration
// script written in a warm human teacher voice (read aloud by the narrator),
// and key-insight bullets. Math levels M1–M12 map onto ~14 concept families.

import { nonMathConcept } from "./concepts-nonmath";

export interface ConceptTutorial {
  id: string;
  title: string;
  /** Which animated visual TutorialVisual.tsx renders. */
  visual: string;
  /** True if the visual has interactive sliders the narration refers to. */
  interactive?: boolean;
  /** Spoken narration — written like a real teacher, not documentation. */
  narration: string;
  /** On-screen key insights. */
  bullets: string[];
  /** 🎯 One-line objective. Falls back to LESSON_FRAMING / a derived line. */
  goal?: string;
  /** 💡 The single key principle. Falls back to LESSON_FRAMING / tutorial intro. */
  bigIdea?: string;
}

export const CONCEPTS: Record<string, ConceptTutorial> = {
  counting: {
    id: "counting",
    title: "Counting — every number is one more",
    visual: "counting",
    narration:
      "Hey! Before you start, watch this. See the dots popping up, one at a time? " +
      "Every time a new dot appears, the number goes up by exactly one. That's all counting is — one more, one more, one more. " +
      "It's like climbing stairs. You never skip a step, you just take the next one. " +
      "So if you ever get stuck on what comes after a number, just picture adding one more dot. " +
      "Seven dots... add one... eight! That's it. You've got this — let's go count some numbers.",
    bullets: [
      "Counting up means adding one more each time",
      "The number right after 7 is 8 — one more dot",
      "Counting back means taking one away",
      "Never skip — every number gets its own step",
    ],
  },

  "place-value": {
    id: "place-value",
    title: "Place value — tens and ones",
    visual: "placeValue",
    narration:
      "Okay, here's a secret that makes big numbers easy: every two-digit number is just tens and ones in disguise. " +
      "Look at forty-seven up there. See those four long rods? Each rod is a ten. And those seven little cubes? Those are the ones. " +
      "Four tens is forty, plus seven ones... forty-seven! " +
      "It's like money — tens are ten-dollar bills, ones are loonies. Forty-seven dollars? Four bills, seven coins. " +
      "Once you can see the tens and ones hiding inside a number, comparing numbers and counting past 100 gets way easier. Ready? Let's practise.",
    bullets: [
      "Two-digit numbers = some tens + some ones",
      "In 47, the 4 means 4 tens (40), the 7 means 7 ones",
      "The digit on the left is always worth more",
      "Skip counting by 10 just adds one more rod",
    ],
  },

  addition: {
    id: "addition",
    title: "Addition — putting groups together",
    visual: "addition",
    narration:
      "Watch this. Three blue dots over here... two gold dots over there... and when they slide together — boom — five dots. " +
      "That's addition. You're not doing anything fancy, you're just pushing two piles into one pile and counting what you've got. " +
      "Here's a pro tip: start from the bigger number. For three plus nine, don't count from three — start at nine and hop up three times. Ten, eleven, twelve. Done. " +
      "And when numbers get big and a column adds up past nine? We carry the extra ten over to the next column. Same idea, just organized. " +
      "Alright — let's put some piles together.",
    bullets: [
      "Adding = combining two groups and counting the total",
      "Start from the BIGGER number and count up",
      "Order doesn't matter: 3 + 9 = 9 + 3",
      "When a column passes 9, carry the ten to the next column",
    ],
  },

  subtraction: {
    id: "subtraction",
    title: "Subtraction — taking away",
    visual: "subtraction",
    narration:
      "See those seven dots? Now watch — three of them fade away... and four are left. Seven take away three is four. That's subtraction. " +
      "Think of it like cookies. You've got seven cookies, somebody eats three — how many are left for you? " +
      "Here's a trick: subtraction is just addition in reverse. If you know that four plus three makes seven, then you already know seven minus three is four. Same family! " +
      "And with bigger numbers, when the ones column doesn't have enough to take away, we borrow a ten from next door. The neighbours are friendly like that. " +
      "Let's go — those problems aren't going to solve themselves.",
    bullets: [
      "Subtracting = taking away and counting what's left",
      "7 − 3 = 4 because 4 + 3 = 7 — same fact family",
      "Count UP from the small number to check your answer",
      "Not enough in a column? Borrow a ten from the next one",
    ],
  },

  multiplication: {
    id: "multiplication",
    title: "Multiplication — rows of equal groups",
    visual: "multiplication",
    narration:
      "Okay, this one's my favourite. Watch the dots build a rectangle — three rows, four dots in each row. " +
      "Three times four just means three rows of four. Count them: four, eight, twelve. " +
      "Multiplication is a shortcut for adding the same number over and over. Instead of four plus four plus four, you just say three fours — twelve. " +
      "And check this out: flip the rectangle on its side and it's four rows of three. Still twelve! That's why three times four equals four times three. " +
      "Learn your tables like song lyrics — once they're in your head, they never leave. Let's go build some rectangles.",
    bullets: [
      "3 × 4 means 3 rows of 4 — a rectangle of dots",
      "It's repeated addition: 4 + 4 + 4 = 12",
      "Order doesn't matter: 3 × 4 = 4 × 3",
      "Knowing your tables makes everything later faster",
    ],
  },

  division: {
    id: "division",
    title: "Division — sharing into equal groups",
    visual: "division",
    narration:
      "Picture this: you've got twelve candies and three friends. Watch the dots sort themselves into three equal circles... " +
      "four candies each! Twelve divided by three is four. Division is just fair sharing. " +
      "And here's the magic link: division is multiplication backwards. Three groups of four makes twelve — so twelve split into three groups gives four each. " +
      "If you know your times tables, you already know division. Stuck on fifty-six divided by seven? Just ask: seven times WHAT makes fifty-six? Eight. Done. " +
      "Sometimes the sharing isn't perfectly even and there's a bit left over — we call that the remainder. Let's go share some candy.",
    bullets: [
      "Division = splitting into equal groups",
      "12 ÷ 3 asks: 3 × what = 12?",
      "Times tables ARE your division answers",
      "Leftovers that can't be shared evenly = the remainder",
    ],
  },

  "fraction-basics": {
    id: "fraction-basics",
    title: "Fractions — parts of a whole",
    visual: "fractionBasics",
    interactive: true,
    narration:
      "Alright — fractions. Don't let them scare you, it's just pizza. " +
      "Watch the circle split into four equal slices. Shade three of them... that's three fourths. Three out of four slices. " +
      "The bottom number — the denominator — tells you how many equal slices the pizza was cut into. The top number — the numerator — tells you how many you've got. " +
      "Now it's your turn: grab that slider and drag it. See how the shading changes? More slices shaded, bigger numerator. The bottom number never moves — the pizza's already cut! " +
      "One more thing: two fourths is the same amount as one half. Different name, same pizza. When you get it, hit the button and let's practise.",
    bullets: [
      "Bottom number (denominator) = how many equal parts",
      "Top number (numerator) = how many parts you have",
      "Try the slider — watch the numerator change the shading",
      "Different fractions can name the SAME amount (2/4 = 1/2)",
    ],
  },

  "fraction-operations": {
    id: "fraction-operations",
    title: "Adding & multiplying fractions",
    visual: "fractionOps",
    narration:
      "Watch these two bars. One fourth... plus two fourths... slide them together and you've got three fourths. " +
      "See what happened? The bottoms matched, so we just added the tops. One plus two is three. The denominator stays put — the slices don't change size just because you got more of them! " +
      "But what if the bottoms DON'T match? Like a half plus a quarter? You can't add different-sized slices. So we re-cut: a half is the same as two quarters. Now they match — two quarters plus one quarter is three quarters. " +
      "Multiplying is even quicker: tops times tops, bottoms times bottoms. And dividing? Flip the second fraction and multiply. " +
      "Same denominators: add the tops. Different ones: re-cut first. Let's do it.",
    bullets: [
      "Same denominators → just add the numerators",
      "Different denominators → re-cut into matching slices first (LCM)",
      "Multiplying: top × top, bottom × bottom",
      "Dividing: flip the second fraction, then multiply",
    ],
  },

  decimals: {
    id: "decimals",
    title: "Decimals — fractions in disguise",
    visual: "decimals",
    narration:
      "Here's the big secret about decimals: they're just fractions wearing a different outfit. " +
      "See that grid? It's one whole, cut into one hundred tiny squares. Watch thirty of them light up... that's zero point three zero — thirty hundredths — which is the same as three tenths. " +
      "The decimal point is just a marker that says: everything after me is smaller than one. First spot after the point is tenths, next spot is hundredths. " +
      "Adding decimals? Line up the points and add like normal. It's like stacking coins — dimes with dimes, pennies with pennies. " +
      "Multiplying by ten? The point hops one spot right. That's it. Decimals are friendlier than they look — come see.",
    bullets: [
      "0.3 = 3 tenths = 30 squares out of 100",
      "First place after the point = tenths, second = hundredths",
      "To add or subtract: LINE UP the decimal points",
      "0.5 is the same as 1/2 — decimals are fractions in disguise",
    ],
  },

  percents: {
    id: "percents",
    title: "Percent — out of one hundred",
    visual: "percents",
    narration:
      "Percent literally means 'out of one hundred' — per cent, like a century is a hundred years. " +
      "Watch the grid: twenty-five squares out of a hundred light up. That's twenty-five percent. And look — it's exactly a quarter of the grid. So twenty-five percent, one fourth, and zero point two five are all the same amount with three different names. " +
      "Want fifty percent of something? That's just half. Ten percent? Slide the decimal point one spot left. " +
      "And twenty-five percent of forty? Easy — that's a quarter of forty, which is ten. " +
      "Once you see that percents, fractions, and decimals are the same thing in different costumes, this whole topic clicks. Let's go.",
    bullets: [
      "Percent = out of 100 (25% = 25 squares of 100)",
      "25% = 1/4 = 0.25 — three names, same amount",
      "10% of a number: move the decimal one spot left",
      "50% is half, 25% is a quarter, 75% is three quarters",
    ],
  },

  ratios: {
    id: "ratios",
    title: "Ratios — comparing two groups",
    visual: "ratios",
    narration:
      "A ratio compares two things side by side. Look up there: two gold dots for every three blue dots. We say the ratio is two to three. " +
      "Now watch what happens when we double both... four gold, six blue. Different amounts — but the SAME ratio! For every two gold, there are still three blue. " +
      "It's like a recipe. Two cups of flour to three cups of milk. Doubling the recipe doesn't change the taste — the proportions stay locked together. " +
      "That's the whole game with ratios: whatever you multiply one side by, you multiply the other side by too. Keep them locked, and you can scale any recipe up or down. " +
      "Let's go mix some ratios.",
    bullets: [
      "A ratio compares two quantities: 2 : 3",
      "Multiply BOTH sides by the same number — the ratio stays equal",
      "2 : 3 = 4 : 6 = 6 : 9 — same recipe, bigger batch",
      "Simplify ratios like fractions: divide both sides by their GCF",
    ],
  },

  "pre-algebra": {
    id: "pre-algebra",
    title: "Equations — keep the scale balanced",
    visual: "balance",
    narration:
      "Time to meet x. Don't worry — x is just a mystery number wearing a mask, and your job is to unmask it. " +
      "See the balance scale? On the left: x plus three. On the right: seven. The scale is level, which means both sides weigh the same. " +
      "Now watch — we take three away from the left... but the scale would tip! So we take three from the right too. Still balanced. And look what's left: x alone on one side, four on the other. x is four! " +
      "That's the golden rule of algebra: whatever you do to one side, do to the other. The scale must stay balanced. " +
      "That's it. That's the whole trick. Let's unmask some mystery numbers.",
    bullets: [
      "x is just a number you haven't found yet",
      "An equation is a balanced scale — both sides are equal",
      "Whatever you do to one side, do to the OTHER side too",
      "Get x alone, and the other side is your answer",
    ],
  },

  "linear-equations": {
    id: "linear-equations",
    title: "Lines — slope and intercept, live",
    visual: "linearGraph",
    interactive: true,
    narration:
      "This is where math gets genuinely cool. Every straight line has a recipe: y equals m x plus b. Just two ingredients. " +
      "Now — grab the slope slider, the one marked m, and drag it. See the line tilt? Bigger m, steeper hill. Negative m, and the line skis downhill. Slope is just steepness. " +
      "Now try the b slider. Watch the whole line float up and down without tilting. b is where the line crosses the y-axis — its home base. " +
      "Seriously, play with both for a second. Make a steep line. Make a flat one. Make one that starts up high and falls. " +
      "Every line you'll ever solve is just some m and some b. Once you can FEEL what they do, the equations are easy. When you're ready, let's practise.",
    bullets: [
      "y = mx + b — every straight line, two ingredients",
      "m (slope) = steepness; negative m goes downhill",
      "b (intercept) = where the line crosses the y-axis",
      "Try the sliders — watch m tilt and b lift the line live",
    ],
  },

  polynomials: {
    id: "polynomials",
    title: "Polynomials — combine the matching tiles",
    visual: "polynomials",
    narration:
      "Polynomials sound fancy, but watch the tiles and you'll see it's just sorting. " +
      "The long tiles are x's. The little squares are plain numbers. Up there: two x tiles plus three more x tiles. Slide them together... five x tiles. Two x plus three x is five x. " +
      "Here's the one rule that runs this whole topic: only matching tiles combine. x's with x's, x-squareds with x-squareds, numbers with numbers. You can't smush an x tile into a number tile — they're different shapes! " +
      "It's like sorting laundry. Socks with socks, shirts with shirts. Nobody folds a sock into a shirt. " +
      "Adding polynomials? Sort and combine. Multiplying? Every tile shakes hands with every tile. Let's sort some laundry.",
    bullets: [
      "Only LIKE terms combine: 2x + 3x = 5x",
      "x and x² are different shapes — they never merge",
      "Adding polynomials = sort the tiles, combine the matches",
      "Multiplying: every term multiplies every term (FOIL)",
    ],
  },

  // ── Advanced math (M13–M18): text-forward lessons, one per level ──
  quadratics: {
    id: "quadratics",
    title: "Quadratics — equations that curve",
    visual: "mathAdvanced",
    narration:
      "A quadratic has an x-squared in it, and that little square changes everything — instead of a straight line, you get a U-shaped curve called a parabola. " +
      "To solve one, you're finding where that curve crosses zero — usually two answers, since a U can cross the x-axis twice. " +
      "You've got tools: factoring when it's neat, and the quadratic formula when it isn't — that formula always works. Let's solve some curves.",
    bullets: [
      "Quadratic = has an x² term → a U-shaped parabola",
      "Solving means finding where it equals zero (the roots)",
      "Usually TWO solutions (the curve can cross twice)",
      "Factor when neat; the quadratic formula always works",
    ],
  },
  functions: {
    id: "functions",
    title: "Functions — a machine with one output",
    visual: "mathAdvanced",
    narration:
      "Think of a function as a machine: you feed in an x, it does its rule, and out comes exactly one answer. That's the golden rule — one input, one output. " +
      "f(x) is just a name tag: f(3) means 'put 3 into the machine.' The domain is every input you're allowed to use; the range is every output you can get. " +
      "An inverse function just runs the machine backwards. Let's feed the machine.",
    bullets: [
      "A function gives exactly ONE output per input",
      "f(x) notation: f(3) means 'plug in 3'",
      "Domain = allowed inputs; Range = possible outputs",
      "An inverse undoes the function (runs it backwards)",
    ],
  },
  trigonometry: {
    id: "trigonometry",
    title: "Trigonometry — triangles and the circle",
    visual: "mathAdvanced",
    narration:
      "Trig connects a triangle's angles to its sides. Three ratios do the work: sine, cosine, and tangent — remember SOH-CAH-TOA. " +
      "Sine is opposite over hypotenuse, cosine is adjacent over hypotenuse, tangent is opposite over adjacent. " +
      "The unit circle takes those same ratios and spins them all the way around, so trig works for any angle, not just inside a triangle. Let's measure some angles.",
    bullets: [
      "SOH-CAH-TOA: sin, cos, tan as side ratios",
      "sin = opp/hyp, cos = adj/hyp, tan = opp/adj",
      "The unit circle extends trig to ANY angle",
      "Identities are equations true for every angle",
    ],
  },
  "algebra-2": {
    id: "algebra-2",
    title: "Algebra II — exponents, logs & beyond",
    visual: "mathAdvanced",
    narration:
      "Algebra II is about growth and its mirror image. Exponential functions grow by multiplying — they explode upward. " +
      "A logarithm is the undo button for an exponent: it asks 'what power do I raise the base to?' Logs and exponents are inverses, so they cancel each other. " +
      "You'll also meet complex numbers, where i stands for the square root of negative one. Let's build on your algebra.",
    bullets: [
      "Exponential functions grow by repeated multiplying",
      "A logarithm undoes an exponent (they're inverses)",
      "log_b(x) asks: 'b to what power gives x?'",
      "Complex numbers use i = √(−1)",
    ],
  },
  "pre-calculus": {
    id: "pre-calculus",
    title: "Pre-Calculus — the bridge to calculus",
    visual: "mathAdvanced",
    narration:
      "Pre-calculus gathers the tools you'll need for calculus. A limit asks what value a function is heading toward as x approaches some point — even if it never quite arrives. " +
      "Sequences and series are ordered lists of numbers and their sums, with patterns you can predict. Vectors carry both size and direction. " +
      "Get comfortable here and calculus feels natural. Let's bridge the gap.",
    bullets: [
      "A limit = the value a function approaches",
      "Sequences are ordered lists; series are their sums",
      "Vectors have both magnitude and direction",
      "These are the building blocks of calculus",
    ],
  },
  calculus: {
    id: "calculus",
    title: "Calculus — change and accumulation",
    visual: "mathAdvanced",
    narration:
      "Calculus has two big ideas. The derivative measures how fast something is changing right now — the slope of the curve at a single instant, like a speedometer. " +
      "The integral does the opposite: it adds up tiny pieces to find a total — like the area under a curve, or distance from speed. " +
      "Derivatives and integrals are inverses of each other. It sounds huge, but it all comes from one idea: zooming in until change becomes simple. Let's begin.",
    bullets: [
      "Derivative = instantaneous rate of change (the slope)",
      "Integral = adding tiny pieces (area under the curve)",
      "Derivatives and integrals are inverse operations",
      "Both come from zooming in on change",
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Lesson framing — every lesson follows the same shape:
//   🎯 Goal   💡 Big Idea   📝 Worked Example (steps)   ✓ Check
// The Example + Check are pulled from the per-skill worked examples in
// tutorials.ts; the Goal + Big Idea live here, keyed by concept id. (R/W/S fall
// back to their tutorial intro — see the modal.)
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_FRAMING: Record<string, { goal: string; bigIdea: string }> = {
  counting:          { goal: "Count objects and say how many.",                         bigIdea: "Each number is exactly one more than the number before it." },
  "place-value":     { goal: "Read and compare numbers up to 100.",                      bigIdea: "A digit's place tells its value — tens are worth ten times the ones." },
  addition:          { goal: "Add two numbers to find the total.",                       bigIdea: "Adding combines groups; start from the ones and carry when needed." },
  subtraction:       { goal: "Subtract to find how many are left or the difference.",    bigIdea: "Subtraction takes away; borrow from the next place when you can't subtract." },
  multiplication:    { goal: "Multiply using the times tables.",                         bigIdea: "Multiplication is repeated addition — 3 × 4 is four groups of three." },
  division:          { goal: "Divide a number into equal groups.",                       bigIdea: "Division is sharing equally — it undoes multiplication." },
  "fraction-basics": { goal: "Identify, compare, and simplify fractions.",               bigIdea: "A fraction is parts of a whole: the bottom counts the pieces, the top counts how many you have." },
  "fraction-operations": { goal: "Add, subtract, multiply, and divide fractions.",       bigIdea: "Add and subtract only with a common denominator; multiply straight across." },
  decimals:          { goal: "Work with decimal place value and operations.",           bigIdea: "Decimals are fractions of ten — line up the decimal points before you add or subtract." },
  percents:          { goal: "Convert between percents, fractions, and decimals.",       bigIdea: "Percent means 'out of 100', so 25% is 25/100 is 0.25." },
  ratios:            { goal: "Use ratios, rates, and proportions.",                      bigIdea: "A ratio compares two quantities; equal ratios form a proportion you can cross-multiply." },
  "pre-algebra":     { goal: "Solve equations for an unknown.",                          bigIdea: "Whatever you do to one side of an equation, do to the other to keep it balanced." },
  "linear-equations":{ goal: "Graph and solve linear equations.",                        bigIdea: "y = mx + b — m is the slope (steepness), b is where the line crosses the y-axis." },
  polynomials:       { goal: "Add, subtract, and multiply polynomials.",                 bigIdea: "Only like terms combine — x's with x's, numbers with numbers." },
  quadratics:        { goal: "Solve quadratic equations.",                               bigIdea: "If two factors multiply to zero, at least one of them must be zero." },
  functions:         { goal: "Use function notation, domain, and range.",               bigIdea: "A function is a machine: one input gives exactly one output." },
  trigonometry:      { goal: "Relate angles and sides with sine, cosine, and tangent.",  bigIdea: "SOH-CAH-TOA: each ratio links an angle to two sides of a right triangle." },
  "algebra-2":       { goal: "Work with exponents, logarithms, and growth.",             bigIdea: "A logarithm is the inverse of an exponent — it asks 'what power gives this number?'" },
  "pre-calculus":    { goal: "Build the tools calculus needs.",                          bigIdea: "A limit is the value a function approaches, even if it never quite arrives." },
  calculus:          { goal: "Measure change and accumulation.",                         bigIdea: "The derivative is the slope at an instant; the integral adds up tiny pieces." },
};

/** Map a sheet's level + skill label to its concept-family tutorial. */
export function conceptForSkill(levelCode: string | undefined, skillName: string): ConceptTutorial | null {
  const name = (skillName ?? "").toLowerCase();
  const level = (levelCode ?? "").toUpperCase();

  // Reading / Writing / Science have a per-skill lesson (text-forward) so a
  // student always learns before they practice — the norm across every subject.
  if (/^[RWS]/.test(level)) {
    return nonMathConcept(levelCode, skillName);
  }

  switch (level) {
    case "M1": return CONCEPTS["counting"];
    case "M2": return CONCEPTS["place-value"];
    case "M3": return CONCEPTS["addition"];
    case "M4": return CONCEPTS["subtraction"];
    case "M5": return CONCEPTS["multiplication"];
    case "M6": return CONCEPTS["division"];
    case "M7":
      return /add|subtract|multiply|divide|×|÷/.test(name)
        ? CONCEPTS["fraction-operations"]
        : CONCEPTS["fraction-basics"];
    case "M8":
      return /percent|convert/.test(name) ? CONCEPTS["percents"] : CONCEPTS["decimals"];
    case "M9": return CONCEPTS["ratios"];
    case "M10": return CONCEPTS["pre-algebra"];
    case "M11": return CONCEPTS["linear-equations"];
    case "M12": return CONCEPTS["polynomials"];
    case "M13": return CONCEPTS["quadratics"];
    case "M14": return CONCEPTS["functions"];
    case "M15": return CONCEPTS["trigonometry"];
    case "M16": return CONCEPTS["algebra-2"];
    case "M17": return CONCEPTS["pre-calculus"];
    case "M18": return CONCEPTS["calculus"];
    default: {
      // Fallback by keywords when level is unknown (e.g. older data)
      if (/fraction/.test(name)) return CONCEPTS["fraction-basics"];
      if (/decimal/.test(name)) return CONCEPTS["decimals"];
      if (/percent/.test(name)) return CONCEPTS["percents"];
      if (/ratio|proportion/.test(name)) return CONCEPTS["ratios"];
      if (/equation|algebra/.test(name)) return CONCEPTS["pre-algebra"];
      if (/multipl|times/.test(name)) return CONCEPTS["multiplication"];
      if (/divi/.test(name)) return CONCEPTS["division"];
      if (/subtract/.test(name)) return CONCEPTS["subtraction"];
      if (/add|sum/.test(name)) return CONCEPTS["addition"];
      if (/count/.test(name)) return CONCEPTS["counting"];
      return null; // non-math or unmapped → no concept tutorial
    }
  }
}
