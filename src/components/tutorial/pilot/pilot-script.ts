// src/components/tutorial/pilot/pilot-script.ts
// SINGLE source of the pilot's numbers and lines. 20 / 3 / 60 everywhere.
//
// `narration` is what the VOICE says — keep it free of emoji and symbols, since
// it is sent verbatim to /api/tts. `caption` is what appears on screen under
// the stage; it may carry emoji and is deliberately shorter than the spoken
// line (the child should not be reading a transcript while listening).
export const PILOT = {
  skillId: "mul-tens",
  skillLabel: "Multiplying tens (20 × 3)",
  a: 20, b: 3, answer: 60, iso: { a: 30, b: 3, answer: 90 },
  perBag: 20,
  bags: 3,
  narration: {
    hook1: "Hey — I need your help with something.",
    spill: "Oh no! The bag fell! Whoosh! Marbles everywhere!",
    countGold: "Let's see what we've got. Ten yellow!",
    countBlue: "And ten blue. That's twenty marbles in this bag!",
    otherBags:
      "But look over there. Two bags are still closed. I wonder what's inside them. Do you think they have twenty marbles too?",
    challenge:
      "Here's your challenge. How many marbles are in all three bags? Don't count! Look for the pattern. Make your best guess!",
    checkGuess: "Let's see if your guess was right!",
    reveal: ["Twenty…", "forty…", "sixty!"],
    addUp:
      "One bag has twenty. There are three bags. Twenty plus twenty plus twenty is sixty. That's sixty marbles!",
    compress: "Six tens. Six tens is sixty.",
    payoff: "Two times three is six — then put the zero back. Sixty.",
    handoff: "Your turn. Same idea.",
  },
  caption: {
    hook1: "Hey — I need your help with something.",
    spill: "Oh no! The bag fell! 😮",
    countGold: "🟡 10 yellow!",
    countBlue: "🔵 10 blue — that's 20 in this bag!",
    otherBags: "Two bags are still closed… 👀",
    challenge: "How many in ALL THREE bags? Don't count — guess! 🎯",
    checkGuess: "Let's see if your guess was right!",
    addUp: "20 + 20 + 20 = 60 🎉",
  },
  skipLabel: "I already know this",
  skipFailLine: "Let me show you a quick way.",
} as const;
