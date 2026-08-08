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
    // Numerals, not number-words: the caption shows this text verbatim and it
    // has to match the digits on the stage (rod totals, the worked example).
    // `speakable()` converts +, =, × for the voice one token for one token, so
    // the word-by-word highlighting stays aligned with what is read.
    hook1: "Hey! I need your help with something.",
    spill: "Oh no! The bag fell! Whoosh! Marbles everywhere!",
    countGold: "Let's see what we've got. 10 yellow!",
    countBlue: "And 10 blue. That's 20 marbles in this bag!",
    otherBags:
      "But look over there. 2 bags are still closed. I wonder what's inside them. Do you think they have 20 marbles too?",
    challenge:
      "Here's your challenge. How many marbles are in all 3 bags? Don't count! Look for the pattern. Make your best guess!",
    checkGuess: "Let's see if your guess was right!",
    reveal: ["20…", "40…", "60!"],
    addUp: "1 bag has 20. There are 3 bags. So 20 + 20 + 20 = 60. That's 60 marbles!",
    // Said WHILE the six rods are on screen — the line has to land on the
    // picture that makes the point, not one tap after it.
    rods: "Now look at them another way. Count by tens: 10, 20, 30, 40, 50, 60. 6 tens make 60!",
    compress: "So 20, 3 times, is 6 tens. And 6 tens is 60.",
    payoff: "Here's the quick way. 2 × 3 = 6, then put the zero back. 60!",
    handoff: "Your turn. Same idea.",
  },
  // The caption shows the spoken sentence verbatim, word-highlighted in time
  // with the voice — so a child reads exactly what they hear. These emoji are
  // appended after the sentence as a mood cue; they are never spoken.
  emoji: {
    spill: "😮",
    otherBags: "👀",
    challenge: "🎯",
    addUp: "🎉",
  } as Record<string, string>,
  skipLabel: "I already know this",
  skipFailLine: "Let me show you a quick way.",
} as const;
