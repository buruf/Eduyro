// src/components/tutorial/pilot/pilot-script.ts
// SINGLE source of the pilot's numbers and lines. 20 / 3 / 60 everywhere.
export const PILOT = {
  skillId: "mul-tens",
  skillLabel: "Multiplying tens (20 × 3)",
  a: 20, b: 3, answer: 60, iso: { a: 30, b: 3, answer: 90 },
  narration: {
    hook1: "Hey — I need your help with something.",
    hook2: "Twenty marbles.",
    hook3: "Guess how many marbles in all three bags. No counting!",
    reveal: ["Twenty…", "forty…", "sixty!"],
    compress: "Six tens. Six tens is sixty.",
    payoff: "Two times three is six — then put the zero back. Sixty.",
    handoff: "Your turn. Same idea.",
  },
  skipLabel: "I already know this",
  skipFailLine: "Let me show you a quick way.",
} as const;
