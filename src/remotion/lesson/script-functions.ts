// src/remotion/lesson/script-functions.ts
// Narration for the FUNCTION MACHINE template. Every number is computed from
// the unit's rule; the machine metaphor is spoken exactly as it is drawn.
// TTS letter-safety: speakable() respells bare letters (f → "eff", x → "ex"),
// and these scripts anchor each letter on first mention regardless.
import { type FunctionUnit, applyRule, ruleText } from "./units-functions";
import type { LessonLine } from "./script";

export function functionLines(u: FunctionUnit): LessonLine[] {
  const f = (x: number) => applyRule(u.rule, x);
  const eq = ruleText(u.rule);

  switch (u.mode) {
    case "notation": {
      const x0 = u.inputs[0];
      const a = u.rule.a ?? 1, b = u.rule.b ?? 0;
      return [
        {
          id: "ask",
          text: `Here's a machine. Drop a number in the top… a rule works on it… and a new number slides out the bottom. Mathematicians write this machine as ${eq}. Strange-looking — until you know how to read it.`,
        },
        {
          id: "work",
          text: `The letter f is just the machine's NAME. The x in the brackets is the slot where the input goes. So f of ${x0} means: feed ${x0} into machine f. Watch. ${x0} goes in… the rule says ${a} times ${x0}, plus ${b}… and out comes ${f(x0)}.`,
        },
        {
          id: "twist",
          text: `So when you read f of ${x0} equals ${f(x0)}, that's not algebra to solve. It's a fact: THIS machine turns ${x0} into ${f(x0)}. The brackets don't mean multiply — they mean "here's the input".`,
        },
        {
          id: "record",
          text: `That's all function notation is. Name of the machine… input in the brackets… output on the other side of the equals sign. ${u.tip}.`,
        },
      ];
    }

    case "evaluate": {
      const [x1, x2, x3] = u.inputs;
      return [
        {
          id: "ask",
          text: `${eq}. Evaluate it at ${x1}, at ${x2}, and at ${x3}. One machine… three inputs. Same moves every time.`,
        },
        {
          id: "work",
          text: `The trick: wherever you see the x, swap in the input. Feed it ${x1}… ${u.rule.a} times ${x1} is ${(u.rule.a ?? 1) * x1}, plus ${u.rule.b} makes ${f(x1)}. Feed it ${x2}… that's ${f(x2)}. And ${x3}… ${f(x3)}.`,
        },
        {
          id: "twist",
          text: `Line the answers up in a table. In: ${x1}, ${x2}, ${x3}. Out: ${f(x1)}, ${f(x2)}, ${f(x3)}. Look at the outputs — they climb by ${u.rule.a} every time. That's the m in m x plus b doing its job. This machine IS a line.`,
        },
        {
          id: "record",
          text: `So evaluating a function is substitution, nothing more. Swap the x for the input… do the arithmetic… write the output. ${u.tip}.`,
        },
      ];
    }

    case "composition": {
      const x0 = u.inputs[0];
      const g = (x: number) => applyRule(u.rule2 ?? u.rule, x);
      const mid = f(x0);
      const out = g(mid);
      const midSwap = g(x0);
      const outSwap = f(midSwap);
      return [
        {
          id: "ask",
          text: `Two machines this time. Machine f adds 2. Machine g multiplies by 3. Now chain them: the output pipe of f feeds straight into g. What happens to a ${x0}?`,
        },
        {
          id: "work",
          text: `Follow it through. ${x0} drops into f… out comes ${mid}. That ${mid} falls straight into g… times 3… ${out}. Written down, that's g of f of ${x0} — read it inside out, because the INSIDE machine runs first.`,
        },
        {
          id: "twist",
          text: `Now swap the machines. ${x0} into g first… ${midSwap}. Then into f… ${outSwap}. Different answer! ${out} one way, ${outSwap} the other. Order matters when you chain machines.`,
        },
        {
          id: "record",
          text: `That's composition: one machine's output becomes the next machine's input. Read the brackets from the inside out. ${u.tip}.`,
        },
      ];
    }

    case "inverse": {
      const x0 = u.inputs[0];
      const y0 = f(x0);
      const a = u.rule.a ?? 1, b = u.rule.b ?? 0;
      return [
        {
          id: "ask",
          text: `${eq}. Feed it ${x0}: times ${a} is ${a * x0}, plus ${b}… ${y0}. Now the real question: if all you know is the OUTPUT, ${y0}… can you get back to the ${x0}?`,
        },
        {
          id: "work",
          text: `Run the machine backwards. Going forward it multiplied by ${a}, THEN added ${b}. So going back, undo the LAST step first: subtract ${b}… ${y0 - b}. Then divide by ${a}… ${x0}. There's your input again.`,
        },
        {
          id: "twist",
          text: `That backwards machine has a name: f inverse. Notice the double reversal — opposite operations, in the opposite order. Like taking off shoes and socks: socks went on first, but they come off last.`,
        },
        {
          id: "record",
          text: `Forward: times ${a}, plus ${b}. Inverse: minus ${b}, divide ${a}. Every step undone, in reverse. ${u.tip}.`,
        },
      ];
    }

    case "domain-range": {
      const [x1, x2, x3] = u.inputs;
      return [
        {
          id: "ask",
          text: `${eq} — the squaring machine. Two questions ABOUT a machine, not about any one number. What's allowed to go IN? And what can possibly come OUT?`,
        },
        {
          id: "work",
          text: `Try some inputs. ${x1}… squared… ${f(x1)}. ${x2}… gives ${f(x2)}. ${x3}… also ${f(x3)}. Anything can go in — positive, negative, zero. The set of allowed inputs is called the DOMAIN, and here it's every number there is.`,
        },
        {
          id: "twist",
          text: `But look at what comes out: ${f(x1)}, ${f(x2)}, ${f(x3)}… Can this machine EVER produce a negative? Try to imagine it — a number times itself, coming out negative. It can't. The outputs are called the RANGE, and here the range is zero and up. Never below.`,
        },
        {
          id: "record",
          text: `Domain: every input the machine accepts. Range: every output it can actually make. Two different questions — always ask both. ${u.tip}.`,
        },
      ];
    }

    case "domain-rational": {
      const [x1, x2, xBad] = u.inputs;
      const k = u.rule.k ?? 0;
      const show = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));
      return [
        {
          id: "ask",
          text: `${eq}. A fraction machine: 1 divided by, x minus ${k}. Most inputs are fine… but one of them breaks this machine. Can you spot it before it happens?`,
        },
        {
          id: "work",
          text: `Feed it ${x1}: bottom is ${x1} minus ${k}, which is ${x1 - k}… output ${show(f(x1))}. Feed it ${x2}: bottom is ${x2 - k}… output ${show(f(x2))}. Smooth so far.`,
        },
        {
          id: "twist",
          text: `Now feed it ${xBad}. Bottom: ${xBad} minus ${k}… zero. And 1 divided by zero — the machine jams. There is no answer. Division by zero isn't big, isn't infinity… it's undefined.`,
        },
        {
          id: "record",
          text: `So the domain is every number EXCEPT ${k}. For any fraction machine, find what makes the bottom zero — and fence it off. ${u.tip}.`,
        },
      ];
    }
  }
}

export function functionLineIds(u: FunctionUnit): string[] {
  return functionLines(u).map((l) => l.id);
}
