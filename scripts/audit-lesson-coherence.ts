// scripts/audit-lesson-coherence.ts
// THE cross-surface tutorial audit (born from the "Fact families & missing
// factor" bug: goal said FACTORING, family taught ADDITION, visual showed
// POLYNOMIALS). For every math unit, classify each surface a student sees —
// unit label, micro-lesson goal, worked example, teaching family, visual —
// into a topic tag, and FAIL when any surface lands on a DIFFERENT concrete
// topic than the unit itself. Neutral/unknown surfaces pass.
import { getMathLevelSkills } from "../src/lib/worksheet/generator";
import { getMicroSkillLesson } from "../src/lib/worksheet/tutorials";
import { getLessonExtras, GENERIC } from "../src/lib/tutorials/lesson-extras";
import { visualForSkill } from "../src/components/tutorial/TutorialVisual";

type Tag =
  | "derivative" | "integral" | "trig" | "quadratic" | "polynomial" | "factoring"
  | "function" | "sequence" | "vector" | "log" | "complex" | "exponent" | "root"
  | "fraction" | "decimal" | "percent" | "ratio" | "multiplication" | "division"
  | "addition" | "subtraction" | "place-value" | "counting" | "equation"
  | "geometry" | "plot" | "statistics" | "limit" | "matrix";

// Ordered — first match wins. Specific before generic; op symbols are LAST
// because every worked example contains + or ×.
const RULES: [Tag, RegExp][] = [
  ["limit", /\blim\b|limit/i],
  ["derivative", /derivat|differenti|d\/dx|power rule|tangent line|slope of y|slope as a der|velocity|h′|s′/i],
  ["integral", /integral|integrat|∫|area under|antideriv/i],
  ["trig", /\bsin\b|\bcos\b|\btan\b|sohcahtoa|hypotenuse|pythagor|radian|unit.circle|right.triangle|opposite|adjacent/i],
  ["sequence", /sequence|series|common difference|geometric.*term|arithmetic.*term|nth term|colony|saves \$/i],
  ["vector", /vector|magnitude|drone/i],
  ["log", /logarithm|log_/i],
  ["complex", /imaginary|powers of i|complex number|\bi²\b/i],
  ["factoring", /factor(?!ies)(?! famil)|gcf|trinomial|zero.?product|difference of squares|difference of cubes|sum & difference/i],
  ["quadratic", /quadratic|parabol|vertex|discriminant|axis of symmetry|x²\s*=|x² [+−-]/i],
  ["function", /f\(x\)|g\(x\)|composition|inverse function|domain|range of|machine/i],
  ["polynomial", /polynomial|monomial|binomial|like terms|foil|degree|leading coefficient|constant term|standard form|synthetic|end behavior|multiplicity|turning point|x-intercept|y-intercept|distribut|box method|partial products/i],
  ["root", /square.root|√|perfect square|simplify roots|estimate.*roots/i],
  ["exponent", /exponent|\d\^|ᵃ|bˣ|scientific notation|²|³|⁴|⁵/i],
  ["fraction", /fraction|numerator|denominator|frac\{|mixed number|part of a whole/i],
  ["decimal", /decimal|\d\.\d/i],
  ["percent", /percent|%/i],
  ["ratio", /\bratios?\b|proportion|unit rate|scale/i],
  ["statistics", /mean(?!s)|median|mode|probability|data|survey/i],
  ["geometry", /angle|perimeter|\barea\b|circumference|triangle|rectangle|polygon|transformation|congruent|volume/i],
  ["plot", /plot|coordinate|slope|intercept|y = mx|graph/i],
  // Ordering/comparing BEFORE equation — "Expressions · Order integers" is a
  // number-line lesson, not an equation-solving one (it was inheriting the
  // "undo + then ×" family purely from the word "Expressions").
  ["place-value", /order integers|least to greatest|greatest to least|compare integers|number line/i],
  ["equation", /equation|solve for|inequal|unknown|variable|balance|order of operations|expression/i],
  ["place-value", /place value|tens and ones|rounds? to|expanded|compare.*number|greater than|less than|which is (greater|less)/i],
  ["counting", /count|number (after|before)|pattern|skip/i],
  ["division", /÷|divide|division|quotient|remainder|fact famil|missing factor|shared|split/i],
  ["multiplication", /×|multipl|times|product|groups of|array/i],
  ["subtraction", /d ?[−-] ?d|subtract|minus|take away|difference|borrow/i],
  ["addition", /\+|add|sum|plus|altogether|in all|make ten|bridg/i],
];

function tag(text: string | null | undefined): Tag | null {
  if (!text) return null;
  text = text.replace(/by a factor|scale factor|missing factor|missing dividend|missing divisor|fact familw*|(opposite)/gi, " ");
  for (const [t, re] of RULES) if (re.test(text)) return t;
  return null;
}

// Visual name → topic tag ("null" = topic-neutral, always passes).
const VISUAL_TAG: Record<string, Tag | null> = {
  tangent: "derivative", areaUnderCurve: "integral", domainRange: "function",
  polynomials: "polynomial", balance: "equation", linearGraph: "plot",
  fractionBasics: "fraction", fractionOps: "fraction", simplifyFraction: "fraction",
  decimals: "decimal", percents: "percent", ratios: "ratio",
  counting: "counting", placeValue: "place-value",
  addition: "addition", subtraction: "subtraction",
  multiplication: "multiplication", division: "division",
  factFamilyMult: "division", factFamilyAdd: "addition",
  mathAdvanced: null, readingLesson: null, writingLesson: null, scienceLesson: null,
};

// Which tag pairs count as the SAME neighborhood (unit tag → acceptable tags).
const COMPAT: Partial<Record<Tag, Tag[]>> = {
  derivative: ["derivative", "quadratic", "plot"],
  integral: ["integral", "derivative"],
  trig: ["trig", "geometry", "root", "plot", "fraction", "exponent"],
  quadratic: ["quadratic", "factoring", "polynomial", "root", "equation", "plot", "function", "exponent"],
  factoring: ["factoring", "quadratic", "polynomial", "multiplication", "equation"],
  polynomial: ["polynomial", "factoring", "quadratic", "plot", "equation", "exponent", "division", "multiplication", "addition", "subtraction", "function"],
  function: ["function", "plot", "equation", "quadratic", "fraction", "ratio"],
  sequence: ["sequence", "counting", "multiplication", "addition", "plot", "ratio"],
  vector: ["vector", "geometry", "trig", "root", "addition"],
  log: ["log", "exponent"],
  complex: ["complex", "addition", "exponent"],
  exponent: ["exponent", "multiplication", "log", "root", "equation"],
  root: ["root", "exponent", "quadratic", "multiplication", "division"],
  fraction: ["fraction", "division", "multiplication", "percent", "decimal", "equation"],
  decimal: ["decimal", "percent", "fraction", "place-value", "addition", "subtraction", "multiplication", "division"],
  percent: ["percent", "decimal", "fraction", "multiplication", "ratio"],
  ratio: ["ratio", "fraction", "multiplication", "division"],
  // place-value added for the M5 bridge ("splits into tens and ones") — the
  // reverse direction (place-value → multiplication) was already accepted.
  multiplication: ["multiplication", "division", "addition", "counting", "exponent", "place-value"],
  division: ["division", "multiplication", "fraction"],
  addition: ["addition", "subtraction", "counting", "place-value", "equation"],
  subtraction: ["subtraction", "addition", "counting", "place-value", "equation"],
  "place-value": ["place-value", "counting", "addition", "decimal", "multiplication", "statistics"],
  counting: ["counting", "addition", "place-value", "multiplication", "sequence", "subtraction"],
  equation: ["equation", "addition", "subtraction", "multiplication", "division", "fraction", "plot", "polynomial", "exponent"],
  geometry: ["geometry", "trig", "multiplication", "equation", "addition", "plot", "subtraction"],
  plot: ["plot", "equation", "function", "geometry", "quadratic"],
  statistics: ["statistics", "fraction", "addition", "division"],
  limit: ["limit", "polynomial", "factoring", "function"],
  matrix: ["matrix", "addition", "vector"],
};

const ok = (unit: Tag, surface: Tag | null) =>
  surface === null || surface === unit || (COMPAT[unit] ?? [unit]).includes(surface);

let fails = 0, checked = 0;
for (const code of ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12","M13","M14","M15","M16","M17","M18"]) {
  for (const u of getMathLevelSkills(code)) {
    const unitTag = tag(u.label);
    if (!unitTag) continue;
    checked++;
    const ml = getMicroSkillLesson("MATH", code, u.label);
    const ex = getLessonExtras(u.label);
    const sv = visualForSkill(u.label);
    const surfaces: [string, Tag | null][] = [
      ["goal", tag(ml?.goal)],
      ["example", tag(ml?.example?.problem)],
      ["family", ex === GENERIC ? null : tag(`${ex.rule[0] ?? ""} ${ex.rule[1] ?? ""}`)],
      ["visual", !sv ? null : sv.kind === "explorer" ? (sv.which === "parabola" ? "quadratic" : "trig") : sv.kind === "factStrategy" ? "addition" : (VISUAL_TAG[sv.name] ?? null)],
    ];
    const bad = surfaces.filter(([, t]) => !ok(unitTag, t));
    if (bad.length) {
      fails++;
      console.log(`✗ ${code} [${u.label}] unit=${unitTag}`);
      for (const [name, t] of bad) console.log(`    ${name} → ${t}  ${name === "goal" ? `("${ml?.goal?.slice(0, 60)}")` : name === "example" ? `("${String(ml?.example?.problem).slice(0, 50)}")` : name === "family" ? `(rule: "${(ex.rule[0] ?? "").slice(0, 55)}")` : ""}`);
    }
  }
}
console.log(`\nunits checked: ${checked}, coherence failures: ${fails}`);
process.exit(fails ? 1 : 0);
