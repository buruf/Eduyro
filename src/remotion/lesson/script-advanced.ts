// src/remotion/lesson/script-advanced.ts
// Narration for the ADVANCED template. Same craft rules as everywhere:
// question → beat → answer, every number computed from ADV, enumerations
// anchored with "then" so TTS can't blur neighbours together, calculus words
// written out for the voice while the screen shows symbols.
import { type AdvancedUnit, ADV } from "./units-advanced";
import type { LessonLine } from "./script";

const withThen = (vals: (string | number)[]) =>
  vals.map((v, i) => (i === 0 ? String(v) : `then ${v}`)).join("… ");

export function advancedLines(u: AdvancedUnit): LessonLine[] {
  switch (u.mode) {
    case "order-integers": {
      const sorted = [...ADV.integers].sort((a, b) => a - b);
      return [
        {
          id: "ask",
          text: `Put these in order: ${withThen(ADV.integers.map((n) => (n < 0 ? `minus ${-n}` : n)))}. Minus signs make it feel tricky… until you put them on a number line.`,
        },
        {
          id: "work",
          text: `Every integer has an address on the line. Minus 3 sits three steps LEFT of zero. Minus 1, just one step left. Then 2 and 5 on the right. Place them all… and look.`,
        },
        {
          id: "twist",
          text: `The line has already sorted them. Further LEFT means smaller — so minus 3 is the smallest, even though 3 feels bigger than 1. It's further from zero on the cold side.`,
        },
        {
          id: "record",
          text: `In order: ${withThen(sorted.map((n) => (n < 0 ? `minus ${-n}` : n)))}. ${u.tip}.`,
        },
      ];
    }

    case "order-ops": {
      const { a, b, c } = ADV.orderOps;
      const right = a + b * c;
      const wrong = (a + b) * c;
      return [
        {
          id: "ask",
          text: `${a} plus ${b} times ${c}. Two students solve it. One gets ${wrong}… the other gets ${right}. They can't both be right. Who is?`,
        },
        {
          id: "work",
          text: `The first went left to right: ${a} plus ${b} is ${a + b}, times ${c}… ${wrong}. The second followed the RULE: multiplication first. ${b} times ${c} is ${b * c}… THEN add ${a}… ${right}.`,
        },
        {
          id: "twist",
          text: `${right} is correct. Multiplication and division always go before addition and subtraction — that's the agreement that makes maths mean one thing. Want the other answer? You need brackets: ${a} plus ${b}, in brackets, times ${c}… THAT'S ${wrong}.`,
        },
        {
          id: "record",
          text: `Brackets first… then powers… then multiply and divide… then add and subtract. One expression, one meaning. ${u.tip}.`,
        },
      ];
    }

    case "complex": {
      const { a, b, c, d } = ADV.complex;
      return [
        {
          id: "ask",
          text: `${a} plus ${b} i. A number with an i in it — imaginary. Scary name… but here's the secret: it's just a POINT.`,
        },
        {
          id: "work",
          text: `Give numbers a second direction. The real part, ${a}, goes ACROSS. The imaginary part, ${b}, goes UP. So ${a} plus ${b} i lives at the point ${a} across, ${b} up. Every complex number is an address on this plane.`,
        },
        {
          id: "twist",
          text: `And adding is easy. Add ${c} plus ${d} i: across parts together, ${a} plus ${c} is ${a + c}. Up parts together, ${b} plus ${d} is ${b + d}. The answer: ${a + c} plus ${b + d} i. Reals with reals… imaginaries with imaginaries.`,
        },
        {
          id: "record",
          text: `A complex number is a point: real part across, imaginary part up. ${u.tip}.`,
        },
      ];
    }

    case "sequence": {
      const { start, step, terms } = ADV.seq;
      const seq = Array.from({ length: terms }, (_, i) => start + i * step);
      const sums = seq.map((_, i) => seq.slice(0, i + 1).reduce((x, y) => x + y, 0));
      return [
        {
          id: "ask",
          text: `${withThen(seq)}… What's the pattern — and what comes next?`,
        },
        {
          id: "work",
          text: `Check the gaps. ${seq[0]} to ${seq[1]}: plus ${step}. ${seq[1]} to ${seq[2]}: plus ${step} again. The same hop every time — that's an ARITHMETIC sequence. So the next term is ${seq[terms - 1]} plus ${step}… ${seq[terms - 1] + step}.`,
        },
        {
          id: "twist",
          text: `Now the second idea. ADD the terms up as you go: ${seq[0]}… then ${sums[1]}… then ${sums[2]}… then ${sums[3]}. That running total is called a SERIES. Same numbers — different question.`,
        },
        {
          id: "record",
          text: `A sequence is the list. A series is the sum. Find the hop first — everything else follows. ${u.tip}.`,
        },
      ];
    }

    case "vectors": {
      const { v1, v2 } = ADV.vec;
      const s = [v1[0] + v2[0], v1[1] + v2[1]];
      return [
        {
          id: "ask",
          text: `A vector is an arrow: it has a direction, and a length. This one goes ${v1[0]} across and ${v1[1]} up. Write it as ${v1[0]}, ${v1[1]}. What happens when arrows ADD?`,
        },
        {
          id: "work",
          text: `Add the arrow ${v2[0]}, ${v2[1]}. The rule is tip to tail: start the second arrow where the first one ENDS. Walk the first arrow… then walk the second… and you land at ${s[0]}, ${s[1]}.`,
        },
        {
          id: "twist",
          text: `Now check the shortcut. Across: ${v1[0]} plus ${v2[0]} is ${s[0]}. Up: ${v1[1]} plus ${v2[1]} is ${s[1]}. The components just ADD. One straight arrow from start to finish — same answer, no drawing needed.`,
        },
        {
          id: "record",
          text: `An arrow with direction and length… added tip to tail… or component by component. ${u.tip}.`,
        },
      ];
    }

    case "power-rule": {
      const { n1, n2 } = ADV.power;
      return [
        {
          id: "ask",
          text: `The derivative measures how fast a function climbs. For powers of x there's a rule so clean it feels like a magic trick… and it's two moves long.`,
        },
        {
          id: "work",
          text: `Take x to the power ${n1}. Move one: bring the exponent DOWN in front. Move two: drop the exponent by one. So the derivative of x cubed is… ${n1} x squared. That's the whole rule.`,
        },
        {
          id: "twist",
          text: `Again, faster. x to the power ${n2}: bring down the ${n2}… drop to ${n2 - 1}… the derivative is ${n2} x to the power ${n2 - 1}. Any power, same two moves.`,
        },
        {
          id: "record",
          text: `The derivative of x to the n… is n, times x to the n minus 1. Down in front… drop by one. ${u.tip}.`,
        },
      ];
    }

    case "monomials": {
      const { k, n } = ADV.mono;
      return [
        {
          id: "ask",
          text: `${k} x cubed. A coefficient in front now. Does the power rule still work… and what happens to the ${k}?`,
        },
        {
          id: "work",
          text: `The ${k} just rides along. Power rule on the x cubed: bring down the ${n}, drop to ${n - 1}… that's ${n} x squared. Then the coefficient multiplies: ${k} times ${n} is ${k * n}.`,
        },
        {
          id: "twist",
          text: `So the derivative of ${k} x cubed is ${k * n} x squared. One clean habit: multiply coefficient by exponent… then lower the exponent by one. Try it on any monomial — it never changes.`,
        },
        {
          id: "record",
          text: `Coefficient times exponent in front… exponent drops by one. ${u.tip}.`,
        },
      ];
    }

    case "applications": {
      const { t } = ADV.app;
      return [
        {
          id: "ask",
          text: `Why learn derivatives at all? Here's the honest answer. A ball rolls, and its distance after t seconds is t squared metres. How FAST is it moving at ${t} seconds?`,
        },
        {
          id: "work",
          text: `Speed is how fast distance changes — and that's exactly what a derivative measures. Power rule on t squared: bring down the 2… drop to 1… the speed is 2 t.`,
        },
        {
          id: "twist",
          text: `Now it's arithmetic. At ${t} seconds, the speed is 2 times ${t}… ${2 * t} metres per second. Not the average speed — the speed at that exact instant. That's what the derivative bought us.`,
        },
        {
          id: "record",
          text: `Position… differentiate… speed. The derivative turns "where is it" into "how fast". ${u.tip}.`,
        },
      ];
    }
  }
}

export function advancedLineIds(u: AdvancedUnit): string[] {
  return advancedLines(u).map((l) => l.id);
}
