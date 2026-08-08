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
    // Written to be SPOKEN, not read. Short beats, contractions, direct
    // address, and "…" where a teacher would actually pause — read-aloud prose
    // ("Here's your challenge. Look for the pattern.") is what made the old
    // tutorial sound recited. Numerals, not number-words, so the caption
    // matches the digits on the stage.
    hook1: "Hey! Come here a second, I need your help.",
    spill: "Oh no… the bag fell! Marbles everywhere!",
    countGold: "Okay, what have we got? Yellow ones… 10 of those.",
    countBlue: "And 10 blue. So this one bag, that's 20.",
    otherBags:
      "But hang on… look over there. 2 more bags, still closed. What do you think is in them? 20 each?",
    challenge:
      "Okay… here's the tricky part. All 3 bags… how many is that? Don't count them. Just take a guess.",
    checkGuess: "Alright… let's find out.",
    reveal: ["20…", "40…", "60!"],
    addUp: "See? One bag's 20. So 3 bags is 20, and 20, and 20. That's 60.",
    // Said WHILE the six rods are on screen — the line has to land on the
    // picture that makes the point, not one tap after it.
    rods: "Now watch this. Same marbles, just lined up in tens. Count with me… 10, 20, 30, 40, 50, 60. 6 tens. That's 60.",
    compress: "So 20, three times over, gives you 6 tens. And 6 tens is 60.",
    // Two beats, because the child taps between them to put the zero back —
    // they do the trick, they don't watch it happen on a timer.
    payoffCover: "Okay, here's the shortcut. Cover up the zero… now it's just 2 × 3. And that's 6.",
    payoffRestore: "Now put the zero back on… 60. Same answer. Way faster.",
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
