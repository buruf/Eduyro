// src/lib/reading/decodable-texts.ts
// TRACK A CONTENT — short texts a Grade 1–2 child can actually SOUND OUT.
//
// Every text here is written using ONLY the letter-sound patterns taught up to
// its stage (see ./phonics.ts), plus that stage's irregular "heart words".
// Nothing in this file is trusted on the author's word: `npm run audit:reading`
// re-scores every text with ./decodability.ts and FAILS if any text drops below
// the decodable threshold. If you add a text, run the audit — a text that isn't
// decodable teaches guessing, which is worse than no text at all.
//
// Lengths follow Grade 1–2 norms: 40–120 words at G1, up to ~150 at G2.

import type { StageId } from "./phonics";

export interface DecodableQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Which comprehension skill the item exercises. */
  skill: "literal" | "sequence" | "inference" | "vocabulary" | "main-idea";
}

export interface DecodableText {
  id: string;
  stage: StageId;
  title: string;
  /** The text the child reads. Sentences kept short — one idea each. */
  text: string;
  questions: DecodableQuestion[];
}

export const DECODABLE_TEXTS: DecodableText[] = [
  // ── Stage 1: short a only ──────────────────────────────────────────────────
  {
    id: "d-cvca-cat", stage: "cvc-a", title: "The Cat and the Mat",
    text: `The cat sat. The cat sat at the mat.
A rat ran. The rat ran at the cat.
The cat ran. The rat ran fast.
The cat is sad. The rat is glad.
Dad had a hat. Dad sat at the mat.
The cat ran at Dad. Dad had a nap.
The cat sat at Dad. The cat is glad.`,
    questions: [
      { prompt: "Who sat at the mat?", options: ["The cat", "The rat", "The man", "The bat"], correctIndex: 0, skill: "literal" },
      { prompt: "Who ran at the cat?", options: ["The rat", "The cat", "A man", "A bag"], correctIndex: 0, skill: "literal" },
      { prompt: "How is the cat at the end?", options: ["Sad", "Glad", "Mad", "Bad"], correctIndex: 0, skill: "literal" },
      { prompt: "What happened FIRST?", options: ["The cat sat", "The rat ran", "The cat ran", "The rat is glad"], correctIndex: 0, skill: "sequence" },
    ],
  },
  {
    id: "d-cvca-sam", stage: "cvc-a", title: "Sam and the Bag",
    text: `Sam had a bag. The bag is tan.
The bag has a cap. The bag has a map.
Sam sat. Sam had a nap.
The cat sat at the bag. The cat is bad!
The cat had the cap. The cat ran fast.
Sam ran at the cat. Sam had the cap.
Sam has the bag and the cap. Sam is glad.`,
    questions: [
      { prompt: "What did Sam have?", options: ["A bag", "A cat", "A mat", "A van"], correctIndex: 0, skill: "literal" },
      { prompt: "What does the bag have?", options: ["A cap and a map", "A cat and a rat", "A man", "A hat"], correctIndex: 0, skill: "literal" },
      { prompt: "What did Sam do after he sat?", options: ["Had a nap", "Ran", "Sat at the mat", "Had a cap"], correctIndex: 0, skill: "sequence" },
      { prompt: "Why is the cat bad?", options: ["It sat at Sam's bag", "It ran", "It had a nap", "It is tan"], correctIndex: 0, skill: "inference" },
    ],
  },

  // ── Stage 2: short i, o, u ─────────────────────────────────────────────────
  {
    id: "d-cvciou-pig", stage: "cvc-iou", title: "The Pig in the Mud",
    text: `A pig is in the mud. The pig is big.
The pig can dig. The pig digs a pit.
A bug is in the pit. The bug is not big.
The pig can not sit in the pit. The pig digs and digs.
The sun is hot. The pig naps in the mud.`,
      questions: [
      { prompt: "Where is the pig?", options: ["In the mud", "In a bag", "On a mat", "In the sun"], correctIndex: 0, skill: "literal" },
      { prompt: "What did the pig dig?", options: ["A pit", "A map", "A bag", "A cap"], correctIndex: 0, skill: "literal" },
      { prompt: "What is in the pit?", options: ["A bug", "A pig", "A rat", "A cat"], correctIndex: 0, skill: "literal" },
      { prompt: "Why does the pig nap?", options: ["The sun is hot", "The pit is big", "The bug ran", "The mud is wet"], correctIndex: 0, skill: "inference" },
    ],
  },
  {
    id: "d-cvciou-dog", stage: "cvc-iou", title: "A Dog and a Log",
    text: `Tom has a dog. The dog is big.
The dog sits on a log. The log is not big.
The log tips! The dog is on the mud.
Tom runs to the dog. The dog is not sad.
The dog and Tom run and run.`,
    questions: [
      { prompt: "What does the dog sit on?", options: ["A log", "A mat", "A bag", "A pit"], correctIndex: 0, skill: "literal" },
      { prompt: "What happens to the log?", options: ["It tips", "It runs", "It naps", "It digs"], correctIndex: 0, skill: "literal" },
      { prompt: "What did Tom do when the dog fell?", options: ["Ran to the dog", "Sat on the log", "Had a nap", "Dug a pit"], correctIndex: 0, skill: "sequence" },
      { prompt: "Is the dog upset at the end?", options: ["No, it runs with Tom", "Yes, it is sad", "Yes, it naps", "No, it digs"], correctIndex: 0, skill: "inference" },
    ],
  },

  // ── Stage 3: all five short vowels ─────────────────────────────────────────
  {
    id: "d-cvce-hen", stage: "cvc-e-review", title: "The Hen and the Pen",
    text: `Ben has a hen. The hen is red.
The hen is in a pen. The pen is big.
The hen gets wet. Ben gets a net.
Ben sets the net in the sun. The net gets dry.
The hen naps in the pen. Ben is glad.`,
    questions: [
      { prompt: "What color is the hen?", options: ["Red", "Tan", "Wet", "Big"], correctIndex: 0, skill: "literal" },
      { prompt: "Where is the hen?", options: ["In a pen", "In a net", "In the mud", "On a log"], correctIndex: 0, skill: "literal" },
      { prompt: "What did Ben get?", options: ["A net", "A hen", "A pen", "A bag"], correctIndex: 0, skill: "literal" },
      { prompt: "Why did Ben set the net in the sun?", options: ["To get it dry", "To get it wet", "To nap", "To run"], correctIndex: 0, skill: "inference" },
    ],
  },

  {
    id: "d-cvce-pup", stage: "cvc-e-review", title: "Meg and the Pup",
    text: `Meg has a pup. The pup is red and tan.
The pup runs in the sun. It digs in the mud.
The pup is a mess! Meg gets a rag.
She rubs the pup. She rubs and rubs.
Then Meg is wet as well. The pup is not sad.
Meg and the pup sit in the sun. Meg is glad.`,
    questions: [
      { prompt: "What does Meg have?", options: ["A pup", "A hen", "A rag", "A pen"], correctIndex: 0, skill: "literal" },
      { prompt: "Where does the pup dig?", options: ["In the mud", "In the sun", "In a pen", "In a bag"], correctIndex: 0, skill: "literal" },
      { prompt: "Why does Meg get a rag?", options: ["The pup is a mess", "The pup is sad", "The sun is hot", "The pup runs"], correctIndex: 0, skill: "inference" },
      { prompt: "What happens to Meg at the end?", options: ["She gets wet too", "She gets a pup", "She digs", "She is sad"], correctIndex: 0, skill: "sequence" },
    ],
  },

  // ── Stage 4: digraphs sh, ch, th, ck, wh, ng ───────────────────────────────
  {
    id: "d-digraph-shed", stage: "digraphs", title: "Chad and the Shed",
    text: `Chad has a shed. The shed is next to the path.
A duck is in the shed. The duck is sick.
Chad gets a dish. He fills the dish with fish.
The duck gets the fish. The duck is glad.
Then Chad checks on the duck. It is not sick!
The duck runs to the pond. Chad is glad.`,
    questions: [
      { prompt: "Where is the duck?", options: ["In the shed", "On the path", "In the pond", "In a dish"], correctIndex: 0, skill: "literal" },
      { prompt: "What does Chad put in the dish?", options: ["Fish", "A duck", "A path", "A shed"], correctIndex: 0, skill: "literal" },
      { prompt: "Why did Chad bring the duck fish?", options: ["The duck was sick", "The duck ran", "The shed was big", "The pond was far"], correctIndex: 0, skill: "inference" },
      { prompt: "What happened LAST?", options: ["The duck ran to the pond", "Chad got a dish", "The duck was sick", "Chad checked the duck"], correctIndex: 0, skill: "sequence" },
    ],
  },
  {
    id: "d-digraph-ship", stage: "digraphs", title: "The Ship and the Fish",
    text: `A ship is on the big pond. The ship is red.
A man is on the ship. He has a net.
He can not get a fish. He sits and sits.
Then a big fish gets in the net! The man is glad.
He gets the fish. He can not lift it up. The fish is such a big fish!
The man lets the fish go. The fish is back in the pond.
It can swim. The man is glad.`,
    questions: [
      { prompt: "What is the man doing on the ship?", options: ["Fishing", "Napping", "Swimming", "Digging"], correctIndex: 0, skill: "literal" },
      { prompt: "What got in the net?", options: ["A big fish", "A ship", "A shell", "A bug"], correctIndex: 0, skill: "literal" },
      { prompt: "Why could the man not lift the fish up?", options: ["It was very big", "It was wet", "He was sad", "The net was thin"], correctIndex: 0, skill: "inference" },
      { prompt: "What happened LAST?", options: ["The fish went back in the pond", "The man sat", "The fish got in the net", "The man got on the ship"], correctIndex: 0, skill: "sequence" },
    ],
  },

  // ── Stage 5–6: blends ──────────────────────────────────────────────────────
  {
    id: "d-blends-frog", stage: "blends-initial", title: "The Frog and the Pond",
    text: `A frog sits on a rock. The rock is flat.
The frog can jump. It can jump from the rock.
Splash! The frog is in the pond.
A crab is in the pond. The crab is small.
The frog and the crab swim. Then they rest.
The sun drops. The frog jumps back on the rock.`,
    questions: [
      { prompt: "Where does the frog sit at the start?", options: ["On a rock", "In the pond", "On a log", "In the mud"], correctIndex: 0, skill: "literal" },
      { prompt: "Who does the frog meet?", options: ["A crab", "A fish", "A dog", "A bug"], correctIndex: 0, skill: "literal" },
      { prompt: "What does 'splash' tell you?", options: ["The frog hit the water", "The frog is sad", "The rock broke", "The crab ran"], correctIndex: 0, skill: "vocabulary" },
      { prompt: "What is this text mostly about?", options: ["A frog's day at the pond", "How to swim", "A crab's home", "A big rock"], correctIndex: 0, skill: "main-idea" },
    ],
  },

  {
    id: "d-blends-crab", stage: "blends-initial", title: "The Crab and the Trap",
    text: `A crab sits on the sand. The sand is flat and black.
A man drops a trap in the pond. Then he steps back.
The crab gets in the trap. The crab is stuck!
It pulls and pulls. It can not get back to the sand.
Then the man lifts the trap up. He lets the crab go.
The crab runs back to the sand. It is glad.`,
    questions: [
      { prompt: "Where does the crab sit at the start?", options: ["On the sand", "In the trap", "In the pond", "On a rock"], correctIndex: 0, skill: "literal" },
      { prompt: "What gets the crab stuck?", options: ["The trap", "The sand", "The man", "The pond"], correctIndex: 0, skill: "literal" },
      { prompt: "What does the man do at the end?", options: ["Lets the crab go", "Drops the trap", "Steps back", "Gets the sand"], correctIndex: 0, skill: "sequence" },
      { prompt: "How does the crab feel at the end?", options: ["Glad", "Stuck", "Sad", "Mad"], correctIndex: 0, skill: "inference" },
    ],
  },

  // ── Stage 7: magic e ───────────────────────────────────────────────────────
  {
    id: "d-vce-cake", stage: "vce", title: "Jane Makes a Cake",
    text: `Jane can make a cake. She takes a big dish.
She adds five things. She mixes them well.
The cake bakes. Jane can smell it. It smells fine!
Dave comes home. He can smell the cake as well.
They take the cake and cut it. Jane gives Dave a slice.
Dave smiles. "This cake is the best!" he tells Jane.`,
    questions: [
      { prompt: "What does Jane make?", options: ["A cake", "A dish", "A slice of bread", "A meal"], correctIndex: 0, skill: "literal" },
      { prompt: "How does Dave know about the cake?", options: ["He can smell it", "Jane tells him", "He bakes it", "He sees the dish"], correctIndex: 0, skill: "inference" },
      { prompt: "What does Jane give Dave?", options: ["A slice", "The dish", "Five things", "The best"], correctIndex: 0, skill: "literal" },
      { prompt: "How does Dave feel about the cake?", options: ["He likes it a lot", "He does not like it", "He is sad", "He is upset"], correctIndex: 0, skill: "inference" },
    ],
  },

  // ── Stage 8: vowel teams ───────────────────────────────────────────────────
  {
    id: "d-teams-rain", stage: "vowel-teams-long", title: "Rain on the Beach",
    text: `The day was hot and the sun was bright in the sky.
Jean and Sam went down to the beach to play.
They dug deep holes in the sand. They ran in the sea.
Then the sky went dark. Rain fell on the beach.
The rain was cold. Jean and Sam ran to a green tent.
They sat and ate. Soon the rain went away.
The sun came back. They went back to play.`,
    questions: [
      { prompt: "Where did Jean and Sam go?", options: ["The beach", "The park", "A green tent at home", "The sea cave"], correctIndex: 0, skill: "literal" },
      { prompt: "What did they do first at the beach?", options: ["Dug holes in the sand", "Sat in the tent", "Ate", "Went home"], correctIndex: 0, skill: "sequence" },
      { prompt: "Why did they run to the tent?", options: ["It began to rain", "They were tired", "They were hungry", "The sun was too hot"], correctIndex: 0, skill: "inference" },
      { prompt: "What does 'the sky went grey' tell you?", options: ["Clouds came and rain was near", "It was night", "The sun was bright", "They went home"], correctIndex: 0, skill: "vocabulary" },
    ],
  },

  // ── Stage 9: r-controlled ──────────────────────────────────────────────────
  {
    id: "d-rcon-farm", stage: "r-controlled", title: "The Farm in the Storm",
    text: `Bert lives on a farm. He feeds the birds and the pigs each day.
One day a dark storm came. The wind was hard.
The barn door burst open. The colt ran off in the rain.
Bert ran after her. His arm hurt but he did not stop.
He got the colt and led her back to the barn.
Then he shut the barn up tight. The colt was safe.
Bert was wet and cold, but he did not mind.`,
    questions: [
      { prompt: "Where does Bert live?", options: ["On a farm", "In a barn", "In a storm", "Near a park"], correctIndex: 0, skill: "literal" },
      { prompt: "What ran out of the barn?", options: ["The colt", "The birds", "The pigs", "Bert"], correctIndex: 0, skill: "literal" },
      { prompt: "What does 'he did not mind' tell you about Bert?", options: ["The colt mattered more than being cold", "He was not kind", "He did not like the colt", "He was not cold"], correctIndex: 0, skill: "inference" },
      { prompt: "What is this text mostly about?", options: ["Bert saving his colt in a storm", "How to feed birds", "A barn in the rain", "A rainy day"], correctIndex: 0, skill: "main-idea" },
    ],
  },
];

export function textsForStage(stage: StageId): DecodableText[] {
  return DECODABLE_TEXTS.filter((t) => t.stage === stage);
}
