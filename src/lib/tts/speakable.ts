// src/lib/tts/speakable.ts
// Turn worksheet/markup text into what a human teacher would SAY: drop LaTeX
// wrappers, viz markers and blanks, and read notation as words — "d/dx x²"
// becomes "the derivative of x squared", "∫₀^4 x dx" becomes "the integral
// from 0 to 4 of x". The voice is the owner's clone, so it must never read
// symbols like an AI ("d slash d x x caret 2").
const SUPS: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "ⁿ": "n" };
function spokenPower(base: string, supRun: string): string {
  const exp = [...supRun].map((c) => SUPS[c] ?? "").join("");
  if (exp === "2") return `${base} squared`;
  if (exp === "3") return `${base} cubed`;
  return `${base} to the power of ${exp}`;
}
export function speakable(raw: string): string {
  let s = raw
    .replace(/\[\[viz[^\]]*\]\]/g, "")
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1 over $2")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/_{2,}|___/g, " blank ");
  // Calculus notation first (before generic symbol passes).
  s = s
    .replace(/d\/dx\s*/g, "the derivative of ")
    .replace(/dy\/dx/g, "the derivative of y")
    .replace(/∫([₀₁₂₃₄₅₆₇₈₉]+)\^?(\d+)\s*(.*?)\s*dx/g, (_m, lo: string, hi: string, body: string) => {
      const lower = [...lo].map((c) => "₀₁₂₃₄₅₆₇₈₉".indexOf(c)).join("");
      return `the integral from ${lower} to ${hi} of ${body}`;
    })
    .replace(/∫\s*(.*?)\s*dx/g, "the integral of $1")
    .replace(/([a-zA-Z])[′']\(/g, "$1 prime of (")
    .replace(/\+\s*C\b/g, "plus a constant C");
  // Powers: 3x² → "3 x squared", x¹⁰ → "x to the power of 10", 4² → "4 squared".
  s = s.replace(/([a-zA-Z0-9)])([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]+)/g, (_m, base: string, sup: string) => spokenPower(base, sup));
  // Arrows and list glyphs are VISUAL flow markers — a human teacher pauses,
  // she doesn't say "right arrow" (field report from the fraction lesson).
  s = s
    // An arrow INTO a number list is a skip-count ("3 × 4 → 3, 6, 9, 12").
    // Replacing the arrow with a bare comma made it number soup — "three times
    // four, three, six, nine, twelve" (field report: Ridwan's tutorial). Frame
    // it the way a teacher would.
    .replace(/\s*(?:→|⇒|⟶)\s*(?=\d+(?:\s*,\s*\d+){2,})/g, " — count: ")
    .replace(/\s*(?:→|⇒|⟶)\s*/g, ", ")
    .replace(/\s*↔\s*/g, " to ")
    .replace(/[✓✗•▪◦↓↑]/g, " ");
  // Split coefficient from variable so "3x" reads "3 x" and equals/operators.
  s = s
    // Split a coefficient from its variable so "3x" reads "3 x" — but NOT a
    // plural "s", or "count by 5s" becomes "count by 5 ess".
    .replace(/(\d)([a-rt-zA-Z]\b)/g, "$1 $2")
    .replace(/√\s*\(?([^)\s,]+)\)?/g, "the square root of $1")
    .replace(/π/g, "pi").replace(/θ/g, "theta").replace(/°/g, " degrees")
    .replace(/≥/g, " is greater than or equal to ").replace(/≤/g, " is less than or equal to ")
    .replace(/≠/g, " is not equal to ")
    .replace(/\s*=\s*/g, " equals ")
    .replace(/×/g, " times ").replace(/÷/g, " divided by ")
    .replace(/\s\/\s/g, " divided by ") // spaced slash: "1 / (x − 2)"
    .replace(/−/g, " minus ")
    .replace(/([0-9a-zA-Z])\s*-\s*([0-9])/g, "$1 minus $2")
    .replace(/\s*\+\s*/g, " plus ")
    .replace(/½/g, "one half").replace(/⅓/g, "one third").replace(/¼/g, "one quarter").replace(/¾/g, "three quarters")
    .replace(/[{}$\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Respell isolated variable letters as their letter-name homophones — a bare
  // "y" token at 0.8 speed collapses toward "E" in ElevenLabs. Spoken text
  // only; captions and screens never pass through here. Lowercase classes so
  // "plus a constant C" survives, and never touch "a" (it's the article).
  s = s
    // Function notation reads as words: "f(x)" → "f of x", "g(f(2))" unwraps
    // one level per pass (two passes covers composition depth).
    .replace(/\b([fgh])\s*\(\s*([^()]+)\)/g, "$1 of $2")
    .replace(/\b([fgh])\s*\(\s*([^()]+)\)/g, "$1 of $2")
    .replace(/\bf\b/g, "eff")
    .replace(/\bg\b/g, "jee")
    .replace(/\bmx\b/g, "m x") // the y = mx + b product, so both letters respell
    .replace(/\bx\b/g, "ex")
    .replace(/\by\b/g, "why")
    .replace(/\bm\b/g, "em")
    .replace(/\bb\b/g, "bee")
    .replace(/\bc\b/g, "cee");
  return s;
}
