// src/remotion/lesson/script.ts
// The spoken script for the 20 × 3 explainer, one line per scene.
//
// Kept short and conversational on purpose: the earlier pilot narration grew
// into paragraphs and started sounding recited. "…" is where the voice should
// breathe — it is the main tool for pacing, more than raw speed.
export const LESSON_LINES = [
  {
    id: "ask",
    text: "So… what does 20 × 3 actually mean?",
  },
  {
    id: "groups",
    text: "It means 3 groups of 20. Here's one group… 10 yellow, and 10 blue. That's 20. Now another one. And one more.",
  },
  {
    id: "count",
    text: "Let's count them up. 20… 40… 60. So that's 20 + 20 + 20, which is 60. And 20 × 3 means exactly the same thing.",
  },
  {
    id: "trick",
    text: "But here's a faster way. Cover up the zero… 2 × 3 is 6. Now put the zero back on… 60. Same answer, much quicker.",
  },
] as const;

export type LessonLineId = (typeof LESSON_LINES)[number]["id"];
