// src/lib/content/reading-passages.ts
// Curated reading passages for Reading levels R1-R9.
// Each passage has comprehension questions, vocabulary, and an answer key.
// All original content — written for BrightSteps, no third-party rights issues.

export interface ReadingPassage {
  id: string;
  levelCode: string;
  title: string;
  wordCount: number;
  readabilityGradeLevel: number; // Flesch-Kincaid approximate
  text: string;
  questions: ReadingQuestion[];
  vocabulary?: { word: string; definition: string }[];
}

export interface ReadingQuestion {
  id: string;
  type: "multiple_choice" | "short_answer" | "true_false";
  prompt: string;
  options?: string[];
  correctAnswer: string;
  correctIndex?: number;
  explanation?: string;
  skill: "main_idea" | "detail" | "inference" | "vocabulary" | "sequence" | "cause_effect" | "purpose" | "tone" | "figurative" | "theme";
}

// ─────────────────────────────────────────────
// R5 — Reading Comprehension (Grade 3-5)
// ─────────────────────────────────────────────

export const PASSAGES_R5: ReadingPassage[] = [
  {
    id: "r5-bees",
    levelCode: "R5",
    title: "The Busy Honey Bee",
    wordCount: 168,
    readabilityGradeLevel: 4,
    text: `Honey bees are some of the most important insects on our planet. A single hive can hold up to 60,000 bees, all working together as a team. Inside the hive lives one queen bee, who lays as many as 2,000 eggs every day.

The worker bees have many jobs. Some fly from flower to flower, collecting sweet nectar in tiny stomachs. Others guard the hive from intruders. When a worker bee returns home with nectar, she shares it with other bees by passing it from mouth to mouth. The bees then dry the nectar by fanning it with their wings until it becomes thick, golden honey.

A single bee makes only about one-twelfth of a teaspoon of honey in her whole life. That doesn't sound like much, but when thousands of bees work together, a healthy hive can make 60 pounds of honey in a year.

Without bees, many of the foods we love — apples, almonds, blueberries — would not exist.`,
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        prompt: "What is the main idea of this passage?",
        options: [
          "Honey bees sting people",
          "Bees are important insects that work together to make honey",
          "All bees live in trees",
          "Worker bees fight each other",
        ],
        correctIndex: 1,
        correctAnswer: "Bees are important insects that work together to make honey",
        skill: "main_idea",
      },
      {
        id: "q2",
        type: "multiple_choice",
        prompt: "How many eggs can the queen bee lay each day?",
        options: ["200", "2,000", "20,000", "60"],
        correctIndex: 1,
        correctAnswer: "2,000",
        skill: "detail",
      },
      {
        id: "q3",
        type: "short_answer",
        prompt: "How much honey can a healthy hive make in a year?",
        correctAnswer: "60 pounds",
        skill: "detail",
      },
      {
        id: "q4",
        type: "multiple_choice",
        prompt: "Why does the writer mention apples, almonds, and blueberries at the end?",
        options: [
          "To show what bees eat",
          "To show what bees grow",
          "To show how bees help us by pollinating food crops",
          "To compare different fruits",
        ],
        correctIndex: 2,
        correctAnswer: "To show how bees help us by pollinating food crops",
        skill: "inference",
      },
      {
        id: "q5",
        type: "multiple_choice",
        prompt: "What does the word 'intruders' mean in this passage?",
        options: ["Friends", "Unwanted visitors", "Other queens", "Baby bees"],
        correctIndex: 1,
        correctAnswer: "Unwanted visitors",
        skill: "vocabulary",
      },
      {
        id: "q6",
        type: "short_answer",
        prompt: "List two jobs that worker bees do.",
        correctAnswer: "Collecting nectar and guarding the hive (also acceptable: drying nectar into honey)",
        skill: "detail",
      },
    ],
    vocabulary: [
      { word: "hive", definition: "the home where bees live together" },
      { word: "nectar", definition: "the sweet liquid bees collect from flowers" },
      { word: "intruders", definition: "people or animals who go somewhere they don't belong" },
    ],
  },

  {
    id: "r5-rainforest",
    levelCode: "R5",
    title: "Life in the Rainforest",
    wordCount: 175,
    readabilityGradeLevel: 4,
    text: `Deep in the warm, wet rainforests of South America, life buzzes from the ground all the way to the treetops. Scientists call the different layers of the rainforest "levels," and each level is home to different plants and animals.

The forest floor is dark and quiet. Very little sunlight reaches the ground because of all the leaves above. Ants, beetles, and snakes live here, hiding under fallen leaves.

Above the forest floor is the understory. Here, jaguars hunt and tree frogs croak. The plants in this layer grow large leaves to catch what little sunlight makes it through.

Higher still is the canopy, where most of the rainforest's animals live. Monkeys swing from branch to branch, and brightly colored birds like toucans build their nests in the leafy treetops.

At the very top is the emergent layer. The tallest trees poke above the canopy here, reaching toward the sun. Eagles and bats fly through this open sky.

Each layer needs the others. Together, they form one of the busiest places on Earth.`,
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        prompt: "How are the layers of the rainforest organized in this passage?",
        options: [
          "From oldest to newest",
          "From bottom to top",
          "From biggest animals to smallest",
          "From wettest to driest",
        ],
        correctIndex: 1,
        correctAnswer: "From bottom to top",
        skill: "sequence",
      },
      {
        id: "q2",
        type: "multiple_choice",
        prompt: "Why is the forest floor so dark?",
        options: [
          "It's underground",
          "It rains all the time",
          "The leaves above block the sunlight",
          "Animals eat the light",
        ],
        correctIndex: 2,
        correctAnswer: "The leaves above block the sunlight",
        skill: "cause_effect",
      },
      {
        id: "q3",
        type: "short_answer",
        prompt: "Which layer is home to the most animals?",
        correctAnswer: "The canopy",
        skill: "detail",
      },
      {
        id: "q4",
        type: "multiple_choice",
        prompt: "What is the emergent layer?",
        options: [
          "The bottom of the rainforest",
          "Where eagles live underground",
          "Where the tallest trees grow above the canopy",
          "A type of tree",
        ],
        correctIndex: 2,
        correctAnswer: "Where the tallest trees grow above the canopy",
        skill: "detail",
      },
      {
        id: "q5",
        type: "multiple_choice",
        prompt: "What does the author want you to understand at the end of the passage?",
        options: [
          "Rainforests are dangerous",
          "All the layers depend on each other to make a healthy rainforest",
          "Monkeys are the smartest animals",
          "Rainforests are mostly empty",
        ],
        correctIndex: 1,
        correctAnswer: "All the layers depend on each other to make a healthy rainforest",
        skill: "main_idea",
      },
    ],
    vocabulary: [
      { word: "canopy", definition: "the leafy ceiling of the rainforest, formed by tall trees" },
      { word: "understory", definition: "the layer of small trees and bushes below the canopy" },
      { word: "emergent", definition: "rising above the surrounding area" },
    ],
  },

  {
    id: "r5-amelia",
    levelCode: "R5",
    title: "Amelia Earhart's Big Dream",
    wordCount: 162,
    readabilityGradeLevel: 5,
    text: `Amelia Earhart loved planes from the very first time she saw one. As a young woman in 1920, she paid ten dollars for a ten-minute ride in the sky. After that flight, she said, "As soon as we left the ground, I knew I had to fly."

In 1928, Amelia became the first woman to fly across the Atlantic Ocean as a passenger. But she wasn't satisfied. She wanted to fly that long, dangerous trip herself.

Four years later, in 1932, Amelia took off from Newfoundland, Canada, all alone. Her plane fought through icy storms, broken instruments, and a fire in the engine. After almost 15 hours, she landed in a farmer's field in Ireland. She had done it — the first woman to fly solo across the Atlantic.

In 1937, Amelia tried to fly all the way around the world. Somewhere over the Pacific Ocean, her plane disappeared. Her body was never found.

Today, Amelia is remembered as a hero who proved that dreams are worth chasing — even the scary ones.`,
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        prompt: "What was different about Amelia's 1928 and 1932 Atlantic flights?",
        options: [
          "1928 was longer than 1932",
          "In 1928 she was a passenger; in 1932 she flew the plane herself",
          "In 1928 she crashed; in 1932 she didn't",
          "1928 was at night and 1932 was during the day",
        ],
        correctIndex: 1,
        correctAnswer: "In 1928 she was a passenger; in 1932 she flew the plane herself",
        skill: "detail",
      },
      {
        id: "q2",
        type: "multiple_choice",
        prompt: "What problems did Amelia face during her 1932 solo flight?",
        options: [
          "She got lost and ran out of food",
          "Icy storms, broken instruments, and engine fire",
          "Birds and bad weather",
          "She fell asleep at the controls",
        ],
        correctIndex: 1,
        correctAnswer: "Icy storms, broken instruments, and engine fire",
        skill: "detail",
      },
      {
        id: "q3",
        type: "short_answer",
        prompt: "What was Amelia trying to do in 1937 when she disappeared?",
        correctAnswer: "Fly around the world",
        skill: "detail",
      },
      {
        id: "q4",
        type: "multiple_choice",
        prompt: "What is the author's tone in this passage?",
        options: ["Sad and angry", "Admiring and respectful", "Funny and silly", "Confused and unsure"],
        correctIndex: 1,
        correctAnswer: "Admiring and respectful",
        skill: "tone",
      },
      {
        id: "q5",
        type: "multiple_choice",
        prompt: "What does the author mean at the end when she says Amelia 'proved that dreams are worth chasing — even the scary ones'?",
        options: [
          "Scary dreams come true while you sleep",
          "It's better not to dream at all",
          "Brave people pursue their goals even when those goals are dangerous",
          "Only dangerous dreams matter",
        ],
        correctIndex: 2,
        correctAnswer: "Brave people pursue their goals even when those goals are dangerous",
        skill: "inference",
      },
    ],
    vocabulary: [
      { word: "satisfied", definition: "happy with what you have, not wanting more" },
      { word: "solo", definition: "alone, by yourself" },
      { word: "remembered", definition: "thought about; kept in memory" },
    ],
  },
];

// ─────────────────────────────────────────────
// R8 — Figurative Language (Grade 6-8)
// ─────────────────────────────────────────────

export const PASSAGES_R8: ReadingPassage[] = [
  {
    id: "r8-storm",
    levelCode: "R8",
    title: "The Storm That Wouldn't Leave",
    wordCount: 188,
    readabilityGradeLevel: 7,
    text: `The storm settled over our town like an uninvited guest who refused to leave. For three days the wind howled through the streets, shouting its rage at every closed window. Rain fell in sheets so thick that Mr. Henderson's prize roses bent in surrender, their proud red heads dipping toward the soaked earth.

By the second morning, even the bravest of us — the postman, the dog-walkers, the dedicated joggers — stayed inside. The town held its breath behind drawn curtains. My grandfather, who had seen forty winters in this valley, said it was the angriest sky he could remember.

The river, normally a quiet companion winding through the valley, became a monster. It swallowed roads, devoured fences, and licked hungrily at the edges of houses too close to its banks. Children pressed their noses against fogged windows, watching the water rise like a slow tide of chocolate milk.

When the sun finally returned on the fourth day, the town blinked in the unfamiliar brightness. The storm had finally taken its leave, but it had left behind a different town than the one it had found.`,
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        prompt: "The phrase 'an uninvited guest who refused to leave' is an example of:",
        options: ["Simile", "Personification", "Hyperbole", "Alliteration"],
        correctIndex: 1,
        correctAnswer: "Personification",
        explanation: "The storm is given human qualities (being a guest, refusing to leave).",
        skill: "figurative",
      },
      {
        id: "q2",
        type: "multiple_choice",
        prompt: "What does the author mean by 'their proud red heads dipping toward the soaked earth'?",
        options: [
          "The roses are tired and want to sleep",
          "The flowers are bending under heavy rain, looking defeated",
          "The roses have changed color",
          "The roses are tipping over because they are heavy",
        ],
        correctIndex: 1,
        correctAnswer: "The flowers are bending under heavy rain, looking defeated",
        skill: "figurative",
      },
      {
        id: "q3",
        type: "multiple_choice",
        prompt: "'The river... became a monster. It swallowed roads, devoured fences...' This describes the river using:",
        options: ["Simile", "Personification", "Onomatopoeia", "Idiom"],
        correctIndex: 1,
        correctAnswer: "Personification",
        skill: "figurative",
      },
      {
        id: "q4",
        type: "multiple_choice",
        prompt: "What does the simile 'like a slow tide of chocolate milk' tell you?",
        options: [
          "The water tasted sweet",
          "The water was brown and muddy",
          "The water was thick and creamy",
          "The water moved very fast",
        ],
        correctIndex: 1,
        correctAnswer: "The water was brown and muddy",
        skill: "figurative",
      },
      {
        id: "q5",
        type: "short_answer",
        prompt: "Explain the meaning of the last sentence: 'The storm had finally taken its leave, but it had left behind a different town than the one it had found.'",
        correctAnswer: "The storm caused so much damage that the town was permanently changed by the time the storm ended.",
        skill: "inference",
      },
      {
        id: "q6",
        type: "multiple_choice",
        prompt: "What is the overall mood of this passage?",
        options: ["Cheerful and excited", "Tense and ominous", "Funny and lighthearted", "Confused and lost"],
        correctIndex: 1,
        correctAnswer: "Tense and ominous",
        skill: "tone",
      },
    ],
    vocabulary: [
      { word: "rage", definition: "intense anger" },
      { word: "devoured", definition: "ate up quickly and completely" },
      { word: "unfamiliar", definition: "not known; strange" },
    ],
  },
];

// ─────────────────────────────────────────────
// Index — all passages by level
// ─────────────────────────────────────────────

export const ALL_PASSAGES: Record<string, ReadingPassage[]> = {
  R5: PASSAGES_R5,
  R8: PASSAGES_R8,
};

export function getPassagesByLevel(levelCode: string): ReadingPassage[] {
  return ALL_PASSAGES[levelCode] ?? [];
}

export function getRandomPassage(levelCode: string): ReadingPassage | null {
  const passages = ALL_PASSAGES[levelCode];
  if (!passages || passages.length === 0) return null;
  return passages[Math.floor(Math.random() * passages.length)];
}
