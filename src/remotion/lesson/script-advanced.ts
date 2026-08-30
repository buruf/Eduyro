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

    case "y-intercept": {
      const { a, b, c } = ADV.yInt;
      return [
        {
          id: "ask",
          text: `Where does ${a} x squared, plus ${b} x, minus ${Math.abs(c)} cross the y axis? It sounds like it needs a graph. It needs one number.`,
        },
        {
          id: "work",
          text: `Every point on the y axis has the same across-value: zero. So the y-intercept is simply what the polynomial is worth when x is zero. Put zero in. ${a} times zero squared is zero. ${b} times zero is zero. Both terms vanish.`,
        },
        {
          id: "twist",
          text: `All that survives is the constant: minus ${Math.abs(c)}. So the curve crosses at zero, minus ${Math.abs(c)}. And that is true for every polynomial ever written — the constant term IS the y-intercept, sitting in plain sight at the end of the expression.`,
        },
        {
          id: "record",
          text: `Set x to zero and read off the constant. Here the y-intercept is minus ${Math.abs(c)}. ${u.tip}.`,
        },
      ];
    }

    case "multiplicity": {
      const { r1, m1, r2 } = ADV.mult;
      return [
        {
          id: "ask",
          text: `Take f of x equals, bracket, x minus ${r1}, squared, times, bracket, x plus ${Math.abs(r2)}. Its roots are ${r1} and minus ${Math.abs(r2)}. But the graph does something different at each one.`,
        },
        {
          id: "work",
          text: `Count how many times each root appears. The x minus ${r1} factor is SQUARED, so ${r1} appears twice — multiplicity ${m1}. The other factor appears once, so minus ${Math.abs(r2)} has multiplicity 1.`,
        },
        {
          id: "twist",
          text: `That count decides the shape. An EVEN multiplicity means the curve touches the axis and turns back — it bounces. So at ${r1}, it bounces. An ODD multiplicity means it passes straight through. So at minus ${Math.abs(r2)}, it crosses. Even bounces, odd crosses.`,
        },
        {
          id: "record",
          text: `Count the repeats of each factor. Even, and it bounces; odd, and it crosses. ${u.tip}.`,
        },
      ];
    }

    case "turning-points": {
      const d = ADV.turns.degree;
      return [
        {
          id: "ask",
          text: `A polynomial of degree ${d}. How many times can its graph change direction — go from climbing to falling, or falling to climbing?`,
        },
        {
          id: "work",
          text: `Those changes are called turning points. Think about the shapes you already know. A straight line, degree 1, never turns. A parabola, degree 2, turns exactly once, at its vertex. Degree 3 can turn twice — up, down, up.`,
        },
        {
          id: "twist",
          text: `The pattern is one less than the degree, every time. So degree ${d} can turn at most ${d - 1} times. At MOST — it might turn fewer times, but it can never turn more. The degree sets a ceiling on how wiggly the curve is allowed to be.`,
        },
        {
          id: "record",
          text: `Degree ${d} means at most ${d - 1} turning points. Take one off the degree. ${u.tip}.`,
        },
      ];
    }

    case "fta": {
      const d = ADV.fta.degree;
      return [
        {
          id: "ask",
          text: `A polynomial of degree ${d}. How many roots does it have? Not "how many can you find" — how many ARE there?`,
        },
        {
          id: "work",
          text: `The Fundamental Theorem of Algebra answers it exactly: a polynomial of degree ${d} has exactly ${d} roots. Not at most. Exactly. But that promise comes with two pieces of small print.`,
        },
        {
          id: "twist",
          text: `First, you must count repeats. If a factor appears twice, that root counts twice. Second, you must allow COMPLEX roots — the ones with i in them. Once you count that way, the number is always exactly the degree. A degree ${d} polynomial has exactly ${d} roots, however hidden some of them are.`,
        },
        {
          id: "record",
          text: `Degree ${d}, exactly ${d} roots — counting multiplicity, and counting complex ones. ${u.tip}.`,
        },
      ];
    }

    case "synthetic": {
      const { a, b, c, r } = ADV.synth;
      const s1 = a * r + b;
      const rem = s1 * r + c;
      return [
        {
          id: "ask",
          text: `Divide ${a} x squared, plus ${b} x, minus ${Math.abs(c)}, by x minus ${r}. Long division works. Synthetic division does the same job with nothing but the numbers.`,
        },
        {
          id: "work",
          text: `Write the coefficients in a row: ${a}, then ${b}, then minus ${Math.abs(c)}. Put ${r} outside — that is the root that makes x minus ${r} zero. Now: bring down the ${a}. Multiply by ${r}: ${a * r}. Add it to the ${b}: ${s1}.`,
        },
        {
          id: "twist",
          text: `Repeat, exactly the same. Multiply ${s1} by ${r}: ${s1 * r}. Add it to minus ${Math.abs(c)}: ${rem}. And you are done. The numbers along the bottom, ${a} and ${s1}, are the quotient — ${a} x plus ${s1}. The last one, ${rem}, is the remainder.`,
        },
        {
          id: "record",
          text: `Bring down, multiply, add — then repeat. The final number is the remainder: ${rem}. ${u.tip}.`,
        },
      ];
    }

    case "rational-root": {
      const { constant, leading, root } = ADV.rational;
      return [
        {
          id: "ask",
          text: `You need a root of a polynomial and there is no formula to hand. Guessing at random could take all day. The Rational Root Theorem tells you the only guesses worth making.`,
        },
        {
          id: "work",
          text: `It says: any rational root must be a factor of the CONSTANT term, divided by a factor of the LEADING coefficient. Here the constant is ${constant} and the leading coefficient is ${leading}. Factors of ${constant}: 1, then ${root}, then 5, then ${constant}.`,
        },
        {
          id: "twist",
          text: `The leading coefficient is ${leading}, and its only factor is ${leading} — so the bottom of the fraction never changes anything. That leaves plus or minus 1, ${root}, 5, and ${constant}. Eight candidates instead of infinity. Now test them, and ${root} is one that works.`,
        },
        {
          id: "record",
          text: `Factors of the constant over factors of the leading coefficient — that is your entire list of suspects. ${u.tip}.`,
        },
      ];
    }

    case "exponential": {
      const { base, power } = ADV.expo;
      const value = base ** power;
      return [
        {
          id: "ask",
          text: `Solve ${base} to the power x equals ${value}. The x is stuck up in the exponent, where none of your usual moves reach it.`,
        },
        {
          id: "work",
          text: `So bring the two sides into the same language. ${value} is not just a number here — it is a power of ${base}. ${base} times ${base} is ${base * base}, times ${base} again is ${value}. So ${value} is ${base} cubed.`,
        },
        {
          id: "twist",
          text: `Rewrite it: ${base} to the power x equals ${base} to the power ${power}. Now both sides are the same base, raised to something. If the bases match, the exponents have no choice but to match too. x equals ${power}.`,
        },
        {
          id: "record",
          text: `Write both sides as powers of the same base, then set the exponents equal. ${u.tip}.`,
        },
      ];
    }

    case "powers-of-i":
      return [
        {
          id: "ask",
          text: `i is the number whose square is minus 1. Raise it to higher and higher powers and something surprising happens — it starts going round in circles.`,
        },
        {
          id: "work",
          text: `Work up from the bottom. i to the power 1 is just i. i squared is minus 1, by definition. i cubed is i squared times i, which is minus 1 times i… minus i. And i to the power 4 is i squared times i squared: minus 1 times minus 1… 1.`,
        },
        {
          id: "twist",
          text: `Back to 1 — exactly where you started. So the next one, i to the power 5, is i again, and the whole thing repeats every 4 steps. That is the shortcut: to find any power of i, divide the exponent by 4 and keep only the remainder.`,
        },
        {
          id: "record",
          text: `i, then minus 1, then minus i, then 1 — and round again. Divide the power by 4 and use what is left over. ${u.tip}.`,
        },
      ];

    case "geometric": {
      const { first, ratio, term } = ADV.geo;
      const terms = Array.from({ length: term }, (_, i) => first * ratio ** i);
      return [
        {
          id: "ask",
          text: `A geometric sequence starts at ${first}, with a ratio of ${ratio}. Find term ${term}. The word "ratio" is the clue to what makes this different.`,
        },
        {
          id: "work",
          text: `In the sequences you met first, you ADD the same amount each step. Here you MULTIPLY by the same amount each step. Start at ${first}. Times ${ratio} gives ${terms[1]}. Times ${ratio} again gives ${terms[2]}. So the sequence runs ${withThen(terms)}.`,
        },
        {
          id: "twist",
          text: `Term ${term} is ${terms[term - 1]}. But notice how you got there: you multiplied by ${ratio} twice, not ${term} times. To reach term ${term} you take ${term} minus 1 steps. So the rule is: the first term, times the ratio, raised to one less than the term number.`,
        },
        {
          id: "record",
          text: `Multiply, do not add. Term ${term} of this sequence is ${terms[term - 1]}. ${u.tip}.`,
        },
      ];
    }

    case "limit-poly": {
      const { at, c } = ADV.limit;
      const value = at * at + at + c;
      return [
        {
          id: "ask",
          text: `The limit, as x approaches ${at}, of x squared plus x plus ${c}. Limits sound like they need something clever. For a polynomial, they do not.`,
        },
        {
          id: "work",
          text: `A limit asks where the function is HEADING as x closes in on ${at}. Come from below: at 3 point 9, at 3 point 99, the values creep towards something. Come from above: 4 point 1, 4 point 01, they creep towards the same thing.`,
        },
        {
          id: "twist",
          text: `They agree because a polynomial has no gaps and no jumps anywhere — the graph is one unbroken curve. So where it is HEADING is simply where it IS. Substitute: ${at} squared is ${at * at}, plus ${at}, plus ${c}… ${value}.`,
        },
        {
          id: "record",
          text: `For a polynomial, a limit is just a substitution. The answer is ${value}. ${u.tip}.`,
        },
      ];
    }

    case "integrate-power": {
      const { n } = ADV.integral;
      return [
        {
          id: "ask",
          text: `The integral of x to the power ${n}. Integrating is differentiating run backwards, so the question is really: what would I have to differentiate to GET x to the power ${n}?`,
        },
        {
          id: "work",
          text: `The power rule brings the exponent down and takes one off it. Run it backwards: put one ON to the exponent first. ${n} plus 1 is ${n + 1}, so try x to the power ${n + 1}. Differentiate that to check — it gives ${n + 1} x to the power ${n}. Close, but ${n + 1} times too big.`,
        },
        {
          id: "twist",
          text: `So divide by ${n + 1}. The answer is x to the power ${n + 1}, over ${n + 1}. And one last thing: add C. Any constant differentiates to zero, so a constant could have been sitting there and left no trace. C stands for all of them at once.`,
        },
        {
          id: "record",
          text: `Add one to the power, divide by the new power, and never forget the plus C. ${u.tip}.`,
        },
      ];
    }
  }
}

export function advancedLineIds(u: AdvancedUnit): string[] {
  return advancedLines(u).map((l) => l.id);
}
