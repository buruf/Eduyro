// src/remotion/lesson/script-trig.ts
// Narration for the TRIG template. Trig words are written out ("sine",
// "cosine", "tangent", "theta") so TTS never guesses at an abbreviation; the
// screen shows sin/cos/tan while the voice says the full word. Numbers come
// from triNumbers(), so voice and triangle cannot disagree.
import { type TrigUnit, triNumbers } from "./units-trig";
import type { LessonLine } from "./script";

const dec = (v: number) => String(Math.round(v * 100) / 100);

export function trigLines(u: TrigUnit): LessonLine[] {
  const n = triNumbers(u);

  switch (u.mode) {
    case "pythagorean":
      return [
        {
          id: "ask",
          text: `A right triangle. One leg is ${n.a}, the other is ${n.b}. How long is the slanted side… without measuring it?`,
        },
        {
          id: "work",
          text: `Build a square on each leg. The ${n.a} side carries a square of ${n.a2}. The ${n.b} side… ${n.b2}. Add the two squares together: ${n.a2} plus ${n.b2} is ${n.c2}.`,
        },
        {
          id: "twist",
          text: `Now the slanted side — the hypotenuse. ITS square holds exactly ${n.c2}. So the side itself is the square root of ${n.c2}… which is ${n.c}. That's the Pythagorean theorem: a squared plus b squared equals c squared.`,
        },
        {
          id: "record",
          text: `${n.a}, ${n.b}, ${n.c} — the most famous right triangle there is. Legs squared, added… equals the hypotenuse squared. ${u.tip}.`,
        },
      ];

    case "side-names":
      return [
        {
          id: "ask",
          text: `Same triangle — ${n.a}, ${n.b}, ${n.c}. But now stand at this corner: the angle called theta. From where theta sits, every side of the triangle gets a name.`,
        },
        {
          id: "work",
          text: `The side facing theta, across the triangle, is the OPPOSITE — here, ${n.a}. The side touching theta that isn't the slant is the ADJACENT… ${n.b}. And the slanted side is always the HYPOTENUSE… ${n.c}.`,
        },
        {
          id: "twist",
          text: `Now move theta to the other corner… and watch. Opposite and adjacent SWAP. The ${n.b} faces the angle now. The names belong to the ANGLE, not to the triangle.`,
        },
        {
          id: "record",
          text: `Opposite, adjacent, hypotenuse — always named from the angle you stand at. Get the names right, and the ratios later name themselves. ${u.tip}.`,
        },
      ];

    case "ratios":
      return [
        {
          id: "ask",
          text: `${n.a}, ${n.b}, ${n.c} — sides named from theta. Trigonometry is nothing but RATIOS of these sides. Three of them… each with its own name.`,
        },
        {
          id: "work",
          text: `Sine of theta is opposite over hypotenuse: ${n.a} over ${n.c}, which is ${dec(n.sin)}. Cosine is adjacent over hypotenuse: ${n.b} over ${n.c}… ${dec(n.cos)}. Tangent is opposite over adjacent: ${n.a} over ${n.b}… ${dec(n.tan)}.`,
        },
        {
          id: "twist",
          text: `Why care? Because the ratios depend only on the ANGLE. Blow the triangle up ten times: ${n.a * 10} over ${n.c * 10}… still ${dec(n.sin)}. Know the angle, and you know every right triangle that carries it.`,
        },
        {
          id: "record",
          text: `Remember it as SOH CAH TOA. Sine: Opposite over Hypotenuse. Cosine: Adjacent over Hypotenuse. Tangent: Opposite over Adjacent. ${u.tip}.`,
        },
      ];

    case "pyth-identity":
      return [
        {
          id: "ask",
          text: `From our triangle, sine of theta is ${dec(n.sin)} and cosine is ${dec(n.cos)}. Square them both… and watch what they add up to.`,
        },
        {
          id: "work",
          text: `${dec(n.sin)} squared is ${dec(n.sin * n.sin)}. ${dec(n.cos)} squared is ${dec(n.cos * n.cos)}. Add them: ${dec(n.sin * n.sin)} plus ${dec(n.cos * n.cos)}… exactly 1. And that's no accident of this triangle — ANY angle lands on 1.`,
        },
        {
          id: "twist",
          text: `Here's why. Sine is ${n.a} over ${n.c}, cosine is ${n.b} over ${n.c}. Square and add: ${n.a2} plus ${n.b2}, all over ${n.c2}. But ${n.a2} plus ${n.b2} IS ${n.c2} — that's Pythagoras! So the fraction is ${n.c2} over ${n.c2}. One.`,
        },
        {
          id: "record",
          text: `Sine squared plus cosine squared equals 1 — for every angle, always. It's the Pythagorean theorem, wearing trig clothes. ${u.tip}.`,
        },
      ];

    case "unit-circle":
      return [
        {
          id: "ask",
          text: `A circle with radius exactly 1, centred at zero. Walk an angle theta around from the right-hand side… and you land on a point. That point's coordinates hide all of trigonometry.`,
        },
        {
          id: "work",
          text: `From the point, drop straight down to the x axis. That horizontal distance from the centre is the COSINE of theta. The height you dropped is the SINE. The point IS the pair: cosine, then sine.`,
        },
        {
          id: "twist",
          text: `Slide theta around and watch the pair change. Straight up, at 90 degrees: cosine 0, sine 1. Far left, at 180: cosine minus 1, sine 0. The circle turns every angle into two numbers.`,
        },
        {
          id: "record",
          text: `Radius 1 is what makes it work: the hypotenuse is 1, so the ratios ARE the coordinates. ${u.tip}.`,
        },
      ];

    case "circle-values":
      return [
        {
          id: "ask",
          text: `Four compass points on the unit circle: 0, 90, 180 and 270 degrees. Their sine and cosine you shouldn't have to compute — you should SEE them.`,
        },
        {
          id: "work",
          text: `At 0 degrees the point is at 1, 0 — so cosine is 1, sine is 0. At 90, the point is 0, 1. At 180… minus 1, 0. And at 270… 0, minus 1.`,
        },
        {
          id: "twist",
          text: `See the pattern. Cosine is just the x coordinate: 1, 0, minus 1, 0. Sine is the y: 0, 1, 0, minus 1. The values trace the circle itself.`,
        },
        {
          id: "record",
          text: `Don't memorise blind — read the point. Its coordinates ARE cosine and sine. ${u.tip}.`,
        },
      ];

    case "radians":
      return [
        {
          id: "ask",
          text: `Degrees aren't the only way to measure an angle. Take the radius itself… bend it… and lay it along the rim of the circle. The angle that arc spans is called 1 RADIAN.`,
        },
        {
          id: "work",
          text: `Keep laying radius-lengths along the circle. Halfway round takes a little more than 3 of them — exactly pi of them. So 180 degrees equals pi radians. That single fact is the whole conversion.`,
        },
        {
          id: "twist",
          text: `Everything else is a fraction of it. 90 degrees is half of 180… pi over 2. 60 degrees is a third… pi over 3. And all the way round, 360… 2 pi.`,
        },
        {
          id: "record",
          text: `To convert any angle, multiply by pi over 180. Degrees to radians is one fact wearing different fractions: 180 degrees is pi. ${u.tip}.`,
        },
      ];

    case "identities":
      return [
        {
          id: "ask",
          text: `The point on the unit circle sits at cosine, sine. And EVERY point on a radius-1 circle obeys one equation: x squared plus y squared equals 1. Put those two facts together…`,
        },
        {
          id: "work",
          text: `Swap the names in: cosine squared plus sine squared equals 1. That's the Pythagorean identity — not a rule to memorise, but the circle's own equation wearing trig names.`,
        },
        {
          id: "twist",
          text: `And it breeds more. Divide everything by cosine squared… and out falls: 1 plus tangent squared equals 1 over cosine squared. One circle, a whole family of identities.`,
        },
        {
          id: "record",
          text: `When you forget an identity, don't guess — go back to the circle. The point at cosine, sine… radius 1. Everything grows from there. ${u.tip}.`,
        },
      ];
  }
}

export function trigLineIds(u: TrigUnit): string[] {
  return trigLines(u).map((l) => l.id);
}
