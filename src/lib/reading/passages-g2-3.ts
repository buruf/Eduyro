// src/lib/reading/passages-g2-3.ts
// TRACK B / PHASE B1 — Grades 2–3 passage bank.
//
// Band contract (BANDS["g2-3"]): 200–350 words, Flesch–Kincaid 1.5–4,
// max 8% three-syllable words, 6–8 items each including at least one
// inference, one vocabulary-in-context, and one evidence-selection item.
//
// Every item's `evidence` must appear VERBATIM in its passage — that is what
// stops a question being answerable without reading. All content original.
// Verified by `npm run audit:reading` (scripts/audit-passages.ts).

import type { Passage } from "./passages";

export const PASSAGES_G2_3: Passage[] = [
  {
    id: "g23-ant-crumb", band: "g2-3", genre: "literary", title: "The Ant and the Crumb",
    text: `Ana sat on the grass and ate a bit of bread, and a crumb fell to the ground.

A small black ant found the crumb near her feet. The ant was tiny, but the crumb was big. It was ten times the size of the ant.

The ant tried to lift the crumb, but it could not, and the crumb did not move at all.

The ant did not give up, and it ran back to its nest under a flat grey rock. Then it told the other ants about the crumb.

Soon a long line of ants came out of the nest. There were more than twenty of them, and they marched to the crumb in one row.

Together the ants pushed. The crumb began to slide across the dirt. Bit by bit, the ants pushed it up a small hill. Then they pushed it down into the nest.

Ana watched the ants the whole time, and she was amazed. One ant could do nothing on its own. Many ants could move a crumb ten times their size.

Ana thought about her class at school. Last week her class had cleaned the whole school yard. One child could not have done that job alone, but thirty children had done it in an hour.

Ana smiled at the busy line of ants, and she thought that ants and children were not so different after all.`,
    items: [
      { prompt: "Where was the ant's nest?", skill: "literal", correctIndex: 1,
        options: ["In the grass", "Under a rock", "Up a small hill", "In the bread"],
        evidence: "its nest under a flat grey rock" },
      { prompt: "What did the ant do after it could not lift the crumb?", skill: "sequence", correctIndex: 0,
        options: ["It ran back to its nest", "It pushed the crumb up", "It moved across the dirt", "It sat on the grass"],
        evidence: "It ran back to its nest" },
      { prompt: "Why did the ant go back to the nest?", skill: "inference", correctIndex: 2,
        options: ["To hide from Ana", "To eat the bread", "To tell the other ants", "To rest under the rock"],
        evidence: "told the other ants about the crumb" },
      { prompt: "In this text, what does \"amazed\" mean?", skill: "vocab", correctIndex: 3,
        options: ["A little angry", "Very tired", "Not certain", "Very surprised"],
        evidence: "she was amazed" },
      { prompt: "What is this text mostly about?", skill: "mainidea", correctIndex: 0,
        options: ["Many ants can move a big crumb", "How ants dig a deep nest", "What Ana ate for her lunch", "Why one crumb is so heavy"],
        evidence: "Many ants could move a crumb ten times their size." },
      { prompt: "Which sentence best shows the ants working as one group?", skill: "evidence", correctIndex: 1,
        options: ["The ant was tiny, but the crumb was big.", "Together the ants pushed.", "Ana sat on the grass and ate a bit of bread.", "It ran back to its nest under a flat grey rock."],
        evidence: "Together the ants pushed." },
    ],
  },

  {
    id: "g23-leaves", band: "g2-3", genre: "informational", title: "Why Leaves Change Colour",
    text: `In spring and summer, the leaves on most trees are green. That green colour comes from chlorophyll. The tree makes it inside each leaf.

Chlorophyll has a big job to do. It catches sunlight and turns it into food. The tree needs that food to grow.

But leaves are not only green inside. They also hold yellow and orange colours all year. The green is so strong that it hides them from us.

In autumn, the days get shorter and the air turns cold. The tree can feel this change. It knows that winter is close, so it starts to get ready. The tree stops making chlorophyll. Little by little, the green fades away.

Now the yellow and orange can show at last. Those colours were there the whole time, hiding under the green.

Some trees make a new colour in autumn. Maple trees can turn bright red. That red is not old. The tree makes it from sugar that is stuck inside the leaf.

After a few weeks, the leaf stops working. The tree closes off the stem, and the leaf falls to the ground. This helps the tree save water in the long cold winter.

So a tree does not lose its colours in autumn. It shows you the colours that were hiding all along.`,
    items: [
      { prompt: "What does chlorophyll do for a tree?", skill: "literal", correctIndex: 2,
        options: ["It hides the stem in winter", "It turns the leaves bright red", "It turns sunlight into food", "It saves water for the tree"],
        evidence: "It catches sunlight and turns it into food." },
      { prompt: "Why can we not see the yellow colour in summer?", skill: "inference", correctIndex: 1,
        options: ["The leaf has no yellow in summer", "The strong green hides it", "The tree makes it in autumn", "Sunlight burns it away"],
        evidence: "The green is so strong that it hides them from us." },
      { prompt: "In this text, what does \"fades\" mean?", skill: "vocab", correctIndex: 0,
        options: ["Slowly goes away", "Gets much brighter", "Falls to the ground", "Turns into sugar"],
        evidence: "the green fades away" },
      { prompt: "What happens FIRST in autumn?", skill: "sequence", correctIndex: 3,
        options: ["The leaf falls to the ground", "Maple trees turn bright red", "The tree closes off the stem", "The days get shorter and colder"],
        evidence: "the days get shorter and the air turns cold" },
      { prompt: "How is the red colour different from the yellow colour?", skill: "compare", correctIndex: 1,
        options: ["The red is older than the yellow", "The tree makes red in autumn", "The red comes from bright sunlight", "The red hides under the green"],
        evidence: "The tree makes it from sugar that is stuck inside the leaf." },
      { prompt: "What is the main idea of this text?", skill: "mainidea", correctIndex: 2,
        options: ["Maple trees are the best trees", "Leaves fall down in autumn", "Autumn colours were hiding all along", "Trees need water in winter"],
        evidence: "It shows you the colours that were hiding all along." },
      { prompt: "Which sentence best shows that the tree gets ready for winter?", skill: "evidence", correctIndex: 0,
        options: ["It knows that winter is close, so it starts to get ready.", "Maple trees can turn bright red in the autumn.", "They also hold yellow and orange colours all year.", "The tree needs that food to grow well each day."],
        evidence: "It knows that winter is close, so it starts to get ready." },
    ],
  },

  {
    id: "g23-mitten", band: "g2-3", genre: "literary", title: "The Lost Mitten",
    text: `Omar lost one red mitten on the way home from school. He looked in his bag and in both coat pockets, but the mitten was gone.

The next day was very cold. Omar had only one mitten, so he put his bare hand deep in his pocket. By the time he got to school, his fingers ached.

At lunch, Omar saw a small girl from the class below his. She was crying by the fence. Her hands were red and she had no mittens at all.

Omar thought about his one warm mitten. He thought about his cold hand in his pocket. Then he walked over and held out the red mitten.

"You can wear this one," he said. "I will keep my hand in my pocket."

The girl stopped crying and put the mitten on. It was much too big for her, and that made her laugh.

The next week, Omar found a small paper bag on his desk. Inside was a pair of mittens. They were blue, and someone had knitted them by hand. There was a note in the bag.

The note said, "Thank you for the red one. My grandma made these for you."

Omar put the blue mittens on. They fit him well, and his hands were warm all the way home.`,
    items: [
      { prompt: "Where did Omar look for his lost mitten?", skill: "literal", correctIndex: 0,
        options: ["In his bag and his coat pockets", "By the fence at school", "Inside a small paper bag", "On his desk in class"],
        evidence: "He looked in his bag and in both coat pockets" },
      { prompt: "Why was the girl crying?", skill: "inference", correctIndex: 2,
        options: ["She lost her school bag", "She could not find Omar", "Her hands were cold", "Her grandma was away"],
        evidence: "Her hands were red and she had no mittens at all." },
      { prompt: "In this text, what does \"ached\" mean?", skill: "vocab", correctIndex: 1,
        options: ["Felt warm", "Hurt with pain", "Grew larger", "Went missing"],
        evidence: "his fingers ached" },
      { prompt: "Why did the mitten make the girl laugh?", skill: "inference", correctIndex: 3,
        options: ["It was a bright red", "It had a note inside", "Her grandma had made it", "It was much too big"],
        evidence: "It was much too big for her, and that made her laugh." },
      { prompt: "What happened LAST in the story?", skill: "sequence", correctIndex: 1,
        options: ["Omar gave away his mitten", "Omar wore the blue mittens home", "Omar lost one red mitten", "Omar saw the girl by the fence"],
        evidence: "his hands were warm all the way home" },
      { prompt: "What is the lesson of this story?", skill: "mainidea", correctIndex: 0,
        options: ["Omar gave his mitten and got mittens back", "Always check your coat pockets for lost things", "Red mittens are much warmer than blue ones", "Never walk home when the day is very cold"],
        evidence: "Then he walked over and held out the red mitten." },
      { prompt: "Which sentence best shows that Omar gave up something for the girl?", skill: "evidence", correctIndex: 2,
        options: ["Omar lost one red mitten on the way home from school.", "The girl stopped crying and put the mitten on.", "I will keep my hand in my pocket.", "They were blue, and someone had knitted them by hand."],
        evidence: "I will keep my hand in my pocket." },
    ],
  },

  {
    id: "g23-owls", band: "g2-3", genre: "informational", title: "How Owls Hunt in the Dark",
    text: `Most birds sleep at night, but owls wake up. An owl hunts in the dark, and its body is built for that job.

First, an owl has very large eyes. Big eyes let in more light, so an owl can see when the sky is almost black. But the eyes cannot move in their sockets. To look to the side, an owl must turn its whole head. An owl can turn its head much farther than you can turn yours.

Second, an owl has amazing ears. One ear sits a little higher than the other. That may sound odd, but it helps a lot. A sound from a mouse hits one ear a tiny bit sooner than the other. The owl uses that small gap to find where the mouse is hiding, even under snow.

Third, an owl has soft feathers with fringed edges. Most birds make a whooshing sound when they flap, but those soft edges break up the rushing air. An owl can fly almost without a sound. The mouse never hears it coming.

Big eyes, odd ears, and quiet wings all work together. Alone, each one would not be enough. Together they make the owl one of the best night hunters in the world.`,
    items: [
      { prompt: "Why must an owl turn its whole head?", skill: "literal", correctIndex: 1,
        options: ["Its neck is very short", "Its eyes cannot move", "Its ears are too small", "Its feathers are soft"],
        evidence: "the eyes cannot move in their sockets" },
      { prompt: "How do an owl's ears help it hunt?", skill: "inference", correctIndex: 0,
        options: ["A sound reaches one ear sooner", "They let in more light at night", "They break up the rushing air", "They help the owl turn its head"],
        evidence: "A sound from a mouse hits one ear a tiny bit sooner" },
      { prompt: "In this text, what does \"fringed\" mean?", skill: "vocab", correctIndex: 2,
        options: ["Very heavy and thick", "Bright in colour", "Having soft edges", "Wet from the snow"],
        evidence: "soft feathers with fringed edges" },
      { prompt: "Why can a mouse not hear an owl coming?", skill: "cause-effect", correctIndex: 3,
        options: ["The mouse hides under snow", "The owl waits until the sky is black", "The owl turns its head slowly", "The soft edges break up the air"],
        evidence: "those soft edges break up the rushing air" },
      { prompt: "How is an owl different from most birds?", skill: "compare", correctIndex: 0,
        options: ["An owl wakes up at night", "An owl has smaller eyes", "An owl cannot fly far", "An owl eats snow"],
        evidence: "Most birds sleep at night, but owls wake up." },
      { prompt: "What is the main idea of this text?", skill: "mainidea", correctIndex: 1,
        options: ["Owls have the largest eyes of all birds", "An owl's whole body is built for hunting in the dark", "Mice are very good at hiding under snow", "Most birds make a whooshing sound"],
        evidence: "An owl hunts in the dark, and its body is built for that job." },
      { prompt: "Which sentence best shows that the owl's three tools work as a set?", skill: "evidence", correctIndex: 2,
        options: ["Big eyes let in more light", "One ear sits a little higher than the other.", "Alone, each one would not be enough.", "Most birds sleep at night, but owls wake up."],
        evidence: "Alone, each one would not be enough." },
    ],
  },
];
