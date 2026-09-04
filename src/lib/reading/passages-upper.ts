// src/lib/reading/passages-upper.ts
// TRACK B — unit-scoped passages for the upper-grade PURPOSE / PERSPECTIVE /
// CRITICAL-READING units.
//
// Why this file exists: eight units (R20 x3, R31, R34, R47 x3) all fell through
// to one shared 27-item Grade-3 bank of "PIE" and fact-vs-opinion questions.
// That bank contains four items literally titled "Which is an OPINION?", so a
// single sheet asked the same question two or three times — and a Grade 8
// critical-reading unit was being drilled on Grade 3 content.
//
// Each passage here declares `units`, so it is served ONLY to the unit it was
// written for and never leaks into the band's general pool.
//
// Band contract (BANDS in ./passages):
//   g4-5  350-500 words, FK 3.5-6.0, <=12% 3+-syllable words,  8-10 items
//   g6-8  600-900 words, FK 5.5-9.0, <=18% 3+-syllable words,  8-12 items
// Every item's `evidence` must appear VERBATIM in its passage — the child who
// answers wrong is coached with that exact line, so it must be the sentence
// that genuinely settles the question. Gated by scripts/audit-passages.ts.
// All content original.

import type { Passage } from "./passages";

export const PASSAGES_UPPER: Passage[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // R20 (Grade 4-5) — Author's Purpose
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "g45-garden-purposes", band: "g4-5", genre: "informational",
    title: "Three Ways to Write About One Garden",
    units: ["Purpose: Persuade, Inform, Entertain"],
    text: `Last spring the students at Bell Street School planted a garden behind the gym. Three different people wrote about that garden. All three wrote about the same patch of dirt. Not one of them wrote for the same reason.

The first piece was a report in the school newsletter. It began like this. "The garden covers forty square metres. Students planted beans, carrots, and sunflowers. Watering happens each morning at eight." The report gave numbers and dates. It did not say whether the garden was a good idea. The writer wanted readers to know the facts. When a writer works this way, the purpose is to inform.

The second piece was a letter to the school board. It began like this. "Every school in this city should have a garden like ours. Our garden is the best classroom we have." The letter listed reasons. It said the garden taught patience. It said the garden fed families nearby. Then it asked the board to send money for a second garden. The writer wanted readers to agree and to act. When a writer works this way, the purpose is to persuade.

The third piece was a story in the school magazine. It began like this. "The sunflower grew so tall that the gym roof had to duck." The story was not true. In it, a carrot named Otto argued with a bean about who was taller. Readers laughed. Nobody learned how to plant a seed, and nobody was asked to give money. The writer wanted readers to enjoy themselves. When a writer works this way, the purpose is to entertain.

Readers can often spot a purpose by looking at the words. A text that informs leans on numbers, dates, and plain facts. A text that persuades leans on words like should, best, and must. A text that entertains leans on surprise and on jokes.

Here is one warning. A single text can do two jobs at once. The letter to the school board told the truth about beans and carrots, so it informed a little while it persuaded. The story used real plant names, so it taught a little while it entertained. Ask which job the writer cared about most. That job is the purpose.`,
    items: [
      { prompt: "What did the report in the school newsletter give its readers?", skill: "literal", correctIndex: 1,
        options: ["A story about Otto", "Numbers and dates", "Reasons to send money", "Jokes about a carrot"],
        evidence: "The report gave numbers and dates." },
      { prompt: "Why did the writer of the letter to the school board write it?", skill: "purpose", correctIndex: 3,
        options: ["To report the size of the garden", "To list the watering times", "To make readers laugh at Otto", "To make readers agree and act"],
        evidence: "The writer wanted readers to agree and to act." },
      { prompt: "The school board reads all three pieces. Which one is most likely to change what the board DOES?", skill: "inference", correctIndex: 2,
        options: ["The report in the newsletter", "The story in the magazine", "The letter to the school board", "The list of plant names"],
        evidence: "Then it asked the board to send money for a second garden." },
      { prompt: "In this text, what does \"persuade\" mean?", skill: "vocab", correctIndex: 0,
        options: ["To try to change what readers think or do", "To give the facts and no opinion", "To make readers laugh out loud", "To grow food for the families nearby"],
        evidence: "the purpose is to persuade" },
      { prompt: "Which sentence best shows that the letter did more than give facts?", skill: "evidence", correctIndex: 1,
        options: ["Students planted beans, carrots, and sunflowers.", "Then it asked the board to send money for a second garden.", "The garden covers forty square metres.", "Watering happens each morning at eight."],
        evidence: "Then it asked the board to send money for a second garden." },
      { prompt: "What is this text mostly about?", skill: "mainidea", correctIndex: 2,
        options: ["How to plant beans and carrots", "Why the school board needs money", "How to tell what a writer's purpose is", "Which plant in the garden grew tallest"],
        evidence: "That job is the purpose." },
      { prompt: "A text that leans on words like should, best, and must is trying to do what?", skill: "purpose", correctIndex: 1,
        options: ["Inform its readers with facts", "Persuade its readers with words", "Entertain its readers with jokes", "Give its readers dates and numbers"],
        evidence: "A text that persuades leans on words like should, best, and must." },
      { prompt: "How is this text organized?", skill: "structure", correctIndex: 2,
        options: ["A story about a carrot named Otto", "A letter that asks the board for money", "One example for each purpose, then a warning", "A report on the garden's size and dates"],
        evidence: "Here is one warning." },
      { prompt: "Why does the author say a single text can do two jobs at once?", skill: "cause-effect", correctIndex: 0,
        options: ["Because the letter told the truth about beans", "Because the report covers forty square metres", "Because Otto argued with a bean", "Because the garden sits behind the gym"],
        evidence: "The letter to the school board told the truth about beans and carrots, so it informed a little while it persuaded." },
    ],
  },

  {
    id: "g45-skate-ramp", band: "g4-5", genre: "informational",
    title: "Two Accounts of One Saturday",
    units: ["Perspective & Purpose in Texts"],
    text: `On the last Saturday in June, the town removed the skate ramp in Miller Park. Two people wrote about that morning, and both of them were there. Both told the truth as they saw it, yet their pieces do not sound alike at all. Read the two writers side by side.

Dev Okonkwo is fourteen and skates every day, so he wrote about the morning in the youth club blog. "The truck came at seven," he wrote. "Nobody told us. We watched them break up the ramp we had saved for. Now there is nowhere to go." Dev wrote about loss. He named the hour and he used the word we. His purpose was to make readers feel what the skaters felt.

Rita Salas is the parks manager, and she wrote the notice on the town website. "The ramp was removed on Saturday," she wrote. "An inspection in May found cracks in the base. A new ramp is planned for the fall." Rita wrote about safety and about plans. She named the month of the inspection, and she did not use the word we. Her purpose was to explain a decision to the whole town.

Neither writer lied. Dev did not mention the cracks, but the cracks were real. Rita did not mention that nobody warned the skaters, but nobody did. Each writer chose the facts that mattered to the job in front of them.

That choosing is what readers call perspective. Perspective is the place a writer stands. Dev stands on the ramp, and Rita stands at a desk with an inspection report. Purpose is the job the writer wants the words to do. Dev wants readers to care, while Rita wants readers to understand.

Perspective and purpose work together. Because Dev stood with the skaters, he wanted readers to feel the loss, so he began with the truck at seven. Because Rita stood with the town, she wanted readers to accept the decision, so she began with the inspection.

Notice that each writer also left something out, and that the missing piece is the part the other writer needed most. The skaters needed to know about the cracks before they blamed the town. The town needed to know that a warning would have cost nothing and spared a lot of anger.

A careful reader does not pick one piece and throw the other away. A careful reader reads both. Dev tells you what the morning cost, and Rita tells you why the morning happened. Put the two together and you know more than either writer told you alone.`,
    items: [
      { prompt: "What did Rita's notice say the inspection had found?", skill: "literal", correctIndex: 2,
        options: ["A truck parked at seven", "A plan for the fall", "Cracks in the base", "A ramp in Miller Park"],
        evidence: "An inspection in May found cracks in the base." },
      { prompt: "What was Dev's purpose in writing the blog piece?", skill: "purpose", correctIndex: 1,
        options: ["To explain the town's decision", "To make readers feel the skaters' loss", "To report the date of the inspection", "To plan a new ramp for the fall"],
        evidence: "His purpose was to make readers feel what the skaters felt." },
      { prompt: "In this text, what does \"perspective\" mean?", skill: "vocab", correctIndex: 3,
        options: ["A promise made to the whole town", "A mistake a careful reader makes", "A report written after an inspection", "The place a writer is standing"],
        evidence: "Perspective is the place a writer stands." },
      { prompt: "Why does Dev use the word we and Rita does not?", skill: "inference", correctIndex: 0,
        options: ["Dev is one of the skaters and Rita is not", "Dev writes better than Rita does", "Rita was not there on Saturday morning", "Rita did not know about the ramp"],
        evidence: "Because Dev stood with the skaters, he wanted readers to feel the loss, so he began with the truck at seven." },
      { prompt: "Which sentence best shows the author's view that BOTH pieces are honest?", skill: "evidence", correctIndex: 1,
        options: ["Rita stands at a desk with an inspection report.", "Neither writer lied.", "Dev wrote about loss.", "He named the hour and he used the word we."],
        evidence: "Neither writer lied." },
      { prompt: "What is the main idea of this text?", skill: "mainidea", correctIndex: 2,
        options: ["The town should not have removed the ramp", "Blogs are less honest than town websites", "Where a writer stands shapes what the writer tells you", "The inspection report was wrong about the cracks"],
        evidence: "Each writer chose the facts that mattered to the job in front of them." },
      { prompt: "What does the author say a careful reader should do?", skill: "literal", correctIndex: 0,
        options: ["Read both pieces", "Trust the parks manager", "Believe the youth club blog", "Wait for the new ramp"],
        evidence: "A careful reader reads both." },
      { prompt: "How does the author organize the middle of this text?", skill: "structure", correctIndex: 3,
        options: ["By listing the cracks found in May", "By telling one long story about a truck", "By giving steps for building a ramp", "By placing the two writers side by side"],
        evidence: "Read the two writers side by side." },
    ],
  },

  {
    id: "g45-word-choice-bus", band: "g4-5", genre: "informational",
    title: "The Same Bus, Two Sets of Words",
    units: ["Purpose & Word Choice"],
    text: `The number 9 bus, which most riders simply call the nine, runs from the river to the hospital and stops eleven times along the way. In March, two flyers about that bus went out in the same week. The facts in them match. The words in them do not.

The first flyer came from the bus company. "Ride the friendly number 9," it said. "Eleven handy stops. A bright new bus every twenty minutes. Leave the traffic behind and relax." Look at those words: friendly, handy, bright, relax. None of them can be measured. They are there to make the ride sound pleasant, because the company wants more riders.

The second flyer came from a group that wants the route changed. "The crowded number 9 crawls to the hospital," it said. "Eleven delays. A worn-out bus every twenty minutes. Waste your morning in traffic." Look at those words too: crowded, crawls, delays, worn-out, waste. They are there to make the ride sound miserable, because the group wants the town to act.

Now put the two flyers side by side. Both say the bus stops eleven times, and both say a bus comes every twenty minutes. Those are the facts, and the facts agree. One flyer calls the stops handy and the other calls them delays. Nothing about the bus changed. Only the words changed.

This is why word choice is a clue to purpose. A writer who wants you to feel good about something reaches for warm words. A writer who wants you to feel bad about it reaches for cold ones. A writer who only wants you to know reaches for neither.

Here is the plain version, the one the town clerk wrote for the notice board at the river stop. "The number 9 runs between the river and the hospital. It makes eleven stops. Buses depart every twenty minutes." Nothing in that is warm or cold. The clerk was not selling the bus or attacking it. The clerk was informing.

You can test this for yourself with almost any flyer, advertisement, or poster that you find on a wall. Cover the numbers with your hand and read only the describing words that are left. If those words make you want something, the writer was selling. If they make you angry or worried, the writer was pushing you to act. If the page suddenly seems empty, the writer was probably only informing you.

So read the naming words. When a writer picks bright over worn-out, or handy over delay, the writer has already told you the purpose before making a single argument.`,
    items: [
      { prompt: "How many stops does the number 9 bus make?", skill: "literal", correctIndex: 1,
        options: ["Twenty stops", "Eleven stops", "Nine stops", "Two stops"],
        evidence: "It makes eleven stops." },
      { prompt: "Why did the bus company choose words like friendly and relax?", skill: "purpose", correctIndex: 2,
        options: ["To warn riders about traffic", "To count the stops on the route", "To make the ride sound pleasant", "To ask the town to change the route"],
        evidence: "They are there to make the ride sound pleasant, because the company wants more riders." },
      { prompt: "In this text, what does \"crawls\" suggest about the bus?", skill: "vocab", correctIndex: 3,
        options: ["That it is new and bright", "That it is quiet inside", "That it is easy to find", "That it moves painfully slowly"],
        evidence: "The crowded number 9 crawls to the hospital" },
      { prompt: "One flyer calls the stops handy and the other calls them delays. What does this show?", skill: "inference", correctIndex: 0,
        options: ["Only the words changed, not the facts", "One flyer is lying about the number of stops", "The bus company changed the route in March", "The hospital asked for eleven new stops"],
        evidence: "Nothing about the bus changed. Only the words changed." },
      { prompt: "Which sentence best shows that the town clerk had no side to take?", skill: "evidence", correctIndex: 1,
        options: ["Leave the traffic behind and relax.", "The clerk was not selling the bus or attacking it.", "A worn-out bus every twenty minutes.", "The facts in them match. The words in them do not."],
        evidence: "The clerk was not selling the bus or attacking it." },
      { prompt: "What is the main idea of this text?", skill: "mainidea", correctIndex: 2,
        options: ["The number 9 bus should run more often", "Flyers are never worth reading carefully", "A writer's word choice reveals the writer's purpose", "Town clerks write better than companies do"],
        evidence: "This is why word choice is a clue to purpose." },
      { prompt: "According to the text, what does a writer who only wants you to KNOW reach for?", skill: "literal", correctIndex: 0,
        options: ["Neither warm nor cold words", "Warm words like handy", "Cold words like worn-out", "Words that cannot be measured"],
        evidence: "A writer who only wants you to know reaches for neither." },
      { prompt: "Why does the author put the clerk's version last?", skill: "structure", correctIndex: 3,
        options: ["Because the clerk wrote the flyer first", "Because the clerk counted the stops wrong", "Because the clerk works for the bus company", "Because nothing in it is warm or cold"],
        evidence: "Nothing in that is warm or cold." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // R31 (Grade 6) — Literary Analysis
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "g68-lighthouse-craft", band: "g6-8", genre: "literary",
    title: "The Keeper's Last Winter",
    units: ["Author's Craft in Fiction"],
    text: `Halima had kept the light at Brannock Point for thirty-one winters, and in all that time she had never once let it go dark.

The lamp was the first thing she thought of in the morning and the last thing she checked at night. She oiled it, she trimmed the wick, and she polished the brass ring around the glass until it threw back a small, warped picture of her own face. When she could not sleep she climbed the ninety-two steps and sat beside it, the way another woman might sit beside a sleeping child.

The great lens itself was older than she was, older than her father, a tall cage of cut glass that her grandfather had helped to carry up the tower in pieces one summer long before she was born. Every ridge in that glass had a purpose, bending the flame into a single long beam that a fishing boat could see from fourteen miles out, and Halima knew each ridge the way a pianist knows the keys.

In October the letter came from the harbour authority. Halima read it twice at the kitchen table. Then she set it down under the sugar bowl, where she would not have to look at it, and she went out to sweep a path that did not need sweeping.

Her nephew Tomas came on the Sunday. He was a careful young man who liked things settled, and he had driven four hours to settle this.

"You've read it," he said.

"I've read it."

"They're fitting the automatic. All along the coast. It isn't only you."

"I know what it is."

Tomas turned his cup around on the table, the way he did when a thing was hard to say. He turned it twice more before he spoke. "The machine doesn't sleep," he said. "It doesn't get old."

"No," Halima said. "It doesn't get old."

She did not say the rest. She did not say that on the night of the great storm the power had failed and she had carried oil up the ninety-two steps eleven times in the dark, and that a machine would have carried nothing at all. She did not say that the fishing boat Marguerite had come home that night on her beam alone, with six men aboard, and that the youngest of them still sent her a card every Christmas. Tomas was thirty and he had a mortgage and he believed in machines, and she loved him, so she poured him more tea instead.

The engineers came in November. They were polite. They wore clean boots and they called her ma'am, and in four days they fitted a lamp the size of a bread tin where the great lens had stood since her grandfather's time. They took photographs of it. One of them said the word efficient six times. They packed the old lens into a crate marked for a museum in the city, and Halima watched them carry it down the ninety-two steps in pieces, the same way it had come up.

On the last evening Halima climbed the ninety-two steps one more time. The new lamp had already begun its work. It turned. It flashed. It did not need her. Thirty-one winters of work, and a machine the size of a bread tin had made all of it unnecessary in four days.

She stood in the doorway for a long while, listening to the sea do what the sea had always done. Then she took the cloth out of her pocket, the soft grey one she had used for thirty-one winters, and she polished the brass ring around the little lamp until it shone.

It threw back a small, warped picture of her face.

Downstairs, Tomas was waiting with the car running. Halima locked the door of the tower. She put the key in her coat pocket rather than in the envelope the harbour authority had sent, and she did not explain why, and Tomas, who liked things settled, did not ask.

They drove inland without speaking. Behind them the light swung out over the water, steady as a heartbeat, every eight seconds, exactly as it had for thirty-one winters, and for the first time in all that time there was nobody in the tower to see it.`,
    items: [
      { prompt: "The author repeats the image of the brass ring throwing back a warped picture of Halima's face. What does this repetition do?", skill: "figurative", correctIndex: 2,
        options: ["It proves the new lamp is brighter than the old one", "It shows that the tower is badly built", "It joins her face to the lamp she tends", "It explains why the harbour authority wrote to her"],
        evidence: "It threw back a small, warped picture of her face." },
      { prompt: "Halima never tells Tomas about carrying oil up the steps during the storm. What does the author reveal by leaving that speech unsaid?", skill: "inference", correctIndex: 0,
        options: ["She would rather protect Tomas than win the argument", "She has forgotten the details of that night", "She agrees that the machine is better than she is", "She is waiting for the engineers to arrive"],
        evidence: "Tomas was thirty and he had a mortgage and he believed in machines, and she loved him, so she poured him more tea instead." },
      { prompt: "Why does the author have Tomas turn his cup around before he speaks?", skill: "inference", correctIndex: 1,
        options: ["To show that the tea has gone cold", "To show that what he has to say is hard for him", "To show that he is angry about the letter", "To show that he has driven four hours"],
        evidence: "the way he did when a thing was hard to say" },
      { prompt: "In this text, what does \"efficient\" tell you about the engineers' view of the tower?", skill: "vocab", correctIndex: 3,
        options: ["That they found the tower beautiful", "That they thought the work was dangerous", "That they wanted Halima to stay on", "That they judged it by cost and output alone"],
        evidence: "One of them said the word efficient six times." },
      { prompt: "Which sentence best shows the author using short, plain sentences to build feeling?", skill: "evidence", correctIndex: 2,
        options: ["Her nephew Tomas came on the Sunday.", "The engineers came in November.", "It turned. It flashed. It did not need her.", "They drove inland without speaking."],
        evidence: "It turned. It flashed. It did not need her." },
      { prompt: "What is the effect of the author placing Halima's polishing of the new lamp at the end of her last climb?", skill: "purpose", correctIndex: 0,
        options: ["It shows she still cares for the lamp that replaced her", "It shows that she has damaged the new lamp", "It shows that the engineers did poor work", "It shows she plans to climb the steps again in November"],
        evidence: "she polished the brass ring around the little lamp until it shone" },
      { prompt: "Halima puts the key in her coat pocket instead of the envelope. What does this detail suggest?", skill: "inference", correctIndex: 1,
        options: ["That she intends to sell the tower", "That keeping the key means she has not let go", "That she has lost the envelope", "That the harbour authority made an error"],
        evidence: "She put the key in her coat pocket rather than in the envelope the harbour authority had sent, and she did not explain why" },
      { prompt: "The final sentence compares the light's turning to a heartbeat. Why does the author end this way?", skill: "figurative", correctIndex: 2,
        options: ["To warn sailors about the rocks at Brannock Point", "To show that the machine will soon break down", "To make the light feel alive while nobody is left to tend it", "To explain how often the lamp needs oiling"],
        evidence: "the light swung out over the water, steady as a heartbeat, every eight seconds" },
      { prompt: "Which phrase best captures the story's central tension?", skill: "mainidea", correctIndex: 3,
        options: ["A nephew's long drive to the coast", "An argument about the price of oil", "A storm that knocked out the power", "A life's work replaced by a machine"],
        evidence: "Thirty-one winters of work, and a machine the size of a bread tin had made all of it unnecessary in four days." },
      { prompt: "How does the author use Tomas as a contrast to Halima?", skill: "compare", correctIndex: 0,
        options: ["He trusts machines while she trusts her own hands", "He loves the tower while she wants to leave it", "He is older than she is and more careful", "He works for the harbour authority and she does not"],
        evidence: "he believed in machines" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // R34 (Grade 6) — Bias & Perspective
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "g68-omission-packing-plant", band: "g6-8", genre: "informational",
    title: "What the Newsletter Did Not Print",
    units: ["Perspective & What's Left Out"],
    text: `In April the Kestrel Falls town newsletter ran a short article about the new packing plant on Ridge Road. Here is most of it.

"Kestrel Falls welcomes Harrow Foods. The company's new packing plant will open in September and will create one hundred and forty jobs. Mayor Elena Ruiz called the announcement the best news the valley has had in a decade. Harrow Foods has promised to hire locally wherever possible. The company will also sponsor the summer fair."

Read that again and notice what is there. Every sentence in it is true. Nobody invented the one hundred and forty jobs, and the sponsorship of the fair is real. A reader who saw only this article would come away pleased.

Now read the county planning file for the same project, which was public the whole time.

The file records that ninety of the one hundred and forty jobs are seasonal and end in November. It records that the plant will draw about two million litres of water a day from the same aquifer that supplies the town wells. It records that eleven residents of Ridge Road filed written objections about truck traffic, and that the planning board dismissed them in one paragraph. It records that Harrow Foods asked for, and received, a five-year reduction in local taxes.

None of that appears in the newsletter. The newsletter did not lie. It selected.

Look closely at how the selecting was done, because it was not random. Every fact that made the plant look like a gift was kept. Every fact that carried a cost, whether in water, in traffic, in taxes, or in jobs that vanish with the first frost, was dropped. The article did not even hint that a planning file existed, so a reader had no reason to go and look for one.

Selection is the quietest kind of bias, and it is the hardest to catch, because there is nothing on the page to argue with. A false sentence can be checked against the world and shown to be false. A missing sentence leaves no mark. The reader does not know to look for it.

You can still catch it, though, if you read for shape rather than for errors. Ask who speaks in the article. The mayor speaks and the company speaks. The eleven residents who objected do not. Ask what kind of numbers appear. One hundred and forty appears; ninety and two million and five do not. Ask what the writer measures the project by. This writer measures it by jobs promised, and by nothing else.

Then ask the question that matters most. Whose account would look different if the missing facts were put back? A reader given the water figure and the tax reduction and the seasonal work might still support the plant. That reader would be supporting a different thing, though, and would know it.

A fuller article would not have needed to be hostile. It could have kept the mayor's quotation and the promise to hire locally, and then added three plain sentences: that most of the jobs are seasonal, that the plant will share the town's aquifer, and that the company will pay reduced taxes for five years. Readers could then have weighed the gift against the bill. That is all that fairness in reporting asks for, and it is the thing the newsletter, for whatever reason, did not give.

None of this proves the newsletter set out to deceive anyone. Small papers work fast, and a press release from a company arrives already written while a planning file has to be dug out and read. Bias by omission does not require a plot. It only requires that the easiest story to tell and the fullest story to tell are not the same story, which they very seldom are.`,
    items: [
      { prompt: "According to the planning file, how many of the one hundred and forty jobs are seasonal?", skill: "literal", correctIndex: 1,
        options: ["Eleven jobs", "Ninety jobs", "One hundred and forty", "Five jobs"],
        evidence: "ninety of the one hundred and forty jobs are seasonal and end in November" },
      { prompt: "Why does the author insist that the newsletter did not lie?", skill: "inference", correctIndex: 2,
        options: ["Because the mayor checked every sentence in it", "Because the planning file was not public in April", "Because it selected facts rather than stating false ones", "Because the summer fair sponsorship was invented"],
        evidence: "The newsletter did not lie. It selected." },
      { prompt: "In this text, what does \"omission\" mean?", skill: "vocab", correctIndex: 0,
        options: ["Leaving something out of an account", "Stating something that is untrue", "Repeating a claim many times", "Asking a reader a direct question"],
        evidence: "Bias by omission does not require a plot." },
      { prompt: "Why does the author call selection the quietest kind of bias?", skill: "cause-effect", correctIndex: 3,
        options: ["Because small papers work quickly and carelessly", "Because the mayor spoke softly to reporters", "Because the planning board wrote only one paragraph", "Because a missing sentence leaves nothing to argue with"],
        evidence: "there is nothing on the page to argue with" },
      { prompt: "Which sentence best supports the claim that the article gave only one side a voice?", skill: "evidence", correctIndex: 1,
        options: ["The company will also sponsor the summer fair.", "The mayor speaks and the company speaks. The eleven residents who objected do not.", "Nobody invented the one hundred and forty jobs, and the sponsorship of the fair is real.", "Mayor Elena Ruiz called the announcement the best news the valley has had in a decade."],
        evidence: "The mayor speaks and the company speaks. The eleven residents who objected do not." },
      { prompt: "What does the author suggest a reader should ask about the numbers in an article?", skill: "purpose", correctIndex: 2,
        options: ["Whether the numbers are spelled out or written as digits", "Whether the mayor approves of the numbers", "Which numbers appear and which are absent", "Whether the numbers come from a company"],
        evidence: "Ask what kind of numbers appear." },
      { prompt: "The author says a reader given the missing facts might still support the plant. Why include this?", skill: "inference", correctIndex: 0,
        options: ["To show the aim is an informed reader, not a fixed verdict", "To show that the objections of the residents were wrong", "To show that the water figure does not matter much", "To show that the planning file is hard to read"],
        evidence: "That reader would be supporting a different thing, though, and would know it." },
      { prompt: "What explanation does the author offer for the newsletter's incompleteness?", skill: "cause-effect", correctIndex: 1,
        options: ["The mayor ordered the paper to print only good news", "A press release arrives written while a planning file must be dug out", "The residents of Ridge Road refused to be interviewed", "Harrow Foods paid the newsletter for the article"],
        evidence: "a press release from a company arrives already written while a planning file has to be dug out and read" },
      { prompt: "What is the central idea of this text?", skill: "mainidea", correctIndex: 3,
        options: ["Packing plants harm the towns that welcome them", "Town newsletters should never quote a mayor", "Planning files are more accurate than newspapers", "Selection of what to leave out is a kind of bias"],
        evidence: "Selection is the quietest kind of bias, and it is the hardest to catch" },
      { prompt: "How is this text structured?", skill: "structure", correctIndex: 2,
        options: ["A single account told in the order events happened", "A list of errors found in the newsletter article", "One article, then the planning file, then a way to read", "A debate between the mayor and the eleven residents"],
        evidence: "Now read the county planning file for the same project, which was public the whole time." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // R47 (Grade 8) — Critical Reading
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "g68-assumptions-phones", band: "g6-8", genre: "informational",
    title: "The Sentence Underneath the Sentence",
    units: ["Author's Assumptions"],
    text: `Every argument stands on something the writer did not bother to say. Those unsaid foundations are assumptions, and finding them is most of what critical reading is.

Consider a column that ran last month in a regional paper.

"Cedar High should ban phones during the school day. Since the ban at Marlow Academy, homework completion there has risen by nine per cent. Our students deserve the same chance to focus. Any parent who wants their child to succeed will support this policy."

The column makes one stated claim: ban the phones. Under it sit at least four sentences the writer never wrote down.

The first is that Cedar High and Marlow Academy are alike enough for the comparison to hold. The writer does not tell us that Marlow is a private school of two hundred students, or that Cedar has nineteen hundred, or that Marlow changed its homework policy in the same term. If the two schools differ in ways that matter, the nine per cent proves nothing about Cedar.

There is a smaller assumption folded inside that one. The nine per cent figure came from Marlow itself, in a newsletter to parents, and nobody outside the school has checked how it was counted. The column treats the number as though it had been measured by a neutral observer. Perhaps it was. The reader is not told, and so the reader cannot know.

The second is that homework completion is the right way to measure whether a school day is going well. That is a choice, not a fact. A different writer might measure attendance, or sleep, or whether students report feeling safe. The column treats one number as though it stood for the whole of school life.

The third is that a phone in a pocket is a cause of poor focus rather than a symptom of something else. The column never argues for this. It assumes it, and then builds on it.

The fourth is the sharpest, and it hides in the last sentence. To say that any parent who wants their child to succeed will support the policy is to assume that disagreement can only come from not caring. A parent who opposes the ban because their child walks home after dark and needs a phone has now been defined out of the conversation. That is not an argument. It is a door quietly closed.

None of this means the ban is a bad idea. It may well be a good one. The point is that a reader who nods along to the column has agreed to four things while believing they agreed to one.

Assumptions are not lies, and a writer who relies on them is not usually trying to trick anyone. Most of the time the writer simply shares them so completely that they seem too obvious to state. That is exactly what makes them dangerous to a reader, because a claim nobody states is a claim nobody thinks to test. The columnist almost certainly believes that phones harm focus, and may be right. The trouble is that the belief has been treated as a floor to build on rather than a wall to be inspected.

There is a habit that helps. After each sentence in a piece of persuasion, ask what would have to be true for this sentence to work. Write that condition down. If the writer has argued for it, good. If the writer has merely relied on it, you have found an assumption, and you are now reading the argument rather than being carried by it. You will find that most persuasive writing rests on three or four such conditions, and that the writer has argued for perhaps one of them.`,
    items: [
      { prompt: "By how much did homework completion rise at Marlow Academy, according to the column?", skill: "literal", correctIndex: 0,
        options: ["Nine per cent", "Nineteen hundred", "Two hundred", "Four sentences"],
        evidence: "homework completion there has risen by nine per cent" },
      { prompt: "In this text, what is an \"assumption\"?", skill: "vocab", correctIndex: 3,
        options: ["A claim the writer proves with numbers", "A question the writer asks the reader", "A source the writer quotes directly", "Something a writer relies on without stating it"],
        evidence: "Those unsaid foundations are assumptions" },
      { prompt: "Why does the author bring up Marlow's size and Cedar's size?", skill: "inference", correctIndex: 1,
        options: ["To show that Marlow is the better school", "To test whether the two schools are alike enough to compare", "To prove that the ban raised homework completion", "To argue that private schools should be closed"],
        evidence: "If the two schools differ in ways that matter, the nine per cent proves nothing about Cedar." },
      { prompt: "What does the author say is wrong with measuring the school day by homework completion?", skill: "cause-effect", correctIndex: 2,
        options: ["The number was reported by a private school", "Homework is not assigned at Cedar High", "It is a choice of measure treated as though it were a fact", "Nine per cent is too small a rise to matter"],
        evidence: "That is a choice, not a fact." },
      { prompt: "Which sentence best shows the assumption hidden in the column's final line?", skill: "evidence", correctIndex: 0,
        options: ["To say that any parent who wants their child to succeed will support the policy is to assume that disagreement can only come from not caring.", "The writer does not tell us that Marlow is a private school of two hundred students, or that Cedar has nineteen hundred, or that Marlow changed its homework policy in the same term.", "A different writer might measure attendance, or sleep, or whether students report feeling safe.", "The column treats one number as though it stood for the whole of school life."],
        evidence: "To say that any parent who wants their child to succeed will support the policy is to assume that disagreement can only come from not caring." },
      { prompt: "Why does the author mention the parent whose child walks home after dark?", skill: "purpose", correctIndex: 1,
        options: ["To prove that phone bans raise homework completion", "To show a parent with a real reason being defined out of the conversation", "To suggest that Cedar High should end classes earlier", "To argue that parents rarely read regional papers"],
        evidence: "A parent who opposes the ban because their child walks home after dark and needs a phone has now been defined out of the conversation." },
      { prompt: "What does the author mean by calling the last sentence a door quietly closed?", skill: "figurative", correctIndex: 2,
        options: ["The column ends before its argument is finished", "The school locks its doors during the day", "It closes off disagreement rather than making an argument", "The writer hides the name of the school"],
        evidence: "That is not an argument. It is a door quietly closed." },
      { prompt: "What is the author's position on the phone ban itself?", skill: "inference", correctIndex: 3,
        options: ["The ban is clearly harmful to students", "The ban should be decided by homework data", "The ban is the only policy worth trying", "The ban may be right, but the column has not shown it"],
        evidence: "None of this means the ban is a bad idea. It may well be a good one." },
      { prompt: "What habit does the author recommend for reading persuasion?", skill: "literal", correctIndex: 0,
        options: ["Ask what would have to be true for each sentence to work", "Count how many numbers the writer uses in the piece", "Read the writer's other regional columns first", "Read the final paragraph of the piece before the rest"],
        evidence: "ask what would have to be true for this sentence to work" },
      { prompt: "What is the central idea of this text?", skill: "mainidea", correctIndex: 2,
        options: ["Regional papers publish careless columns", "Marlow Academy is a better school than Cedar High", "Every argument stands on things the writer left unsaid", "Homework completion is the best measure of a school"],
        evidence: "Every argument stands on something the writer did not bother to say." },
    ],
  },

  {
    id: "g68-logic-swim-times", band: "g6-8", genre: "informational",
    title: "Four Ways an Argument Can Fail",
    units: ["Evaluating the Author's Logic"],
    text: `An argument can be made of true sentences and still fail. Truth is a property of sentences. Validity is a property of the joints between them, and a reader has to check both.

Here is a letter that appeared in a club magazine.

"Since the Fernhill pool switched to morning practice, our swimmers have dropped an average of two seconds over fifty metres. Morning practice works. Every serious club in the county should move to mornings. The three clubs that refused to switch finished below us at the county meet, which tells you everything."

Take the joints one at a time.

The first joint is the leap from after to because. Two things happened in order: the switch, and the faster times. The letter treats the order as proof of a cause. But Fernhill also hired a new coach that season, and the swimmers were a year older and a year stronger. Any of those could produce the same two seconds. Order alone never establishes cause, and a writer who offers only order has offered nothing.

The second joint is the size of the evidence. One club, one season, one distance. A result that thin could easily be noise. The letter does not tell us how many swimmers were timed, which is the number that decides whether two seconds means anything at all.

Compare that with what a careful claim would need. It would need times for every swimmer in the club, not an average that a single fast newcomer could drag down. It would need the same swimmers timed the season before, under the same conditions, at the same point in the year. It would need at least one other club that made the same switch, so that Fernhill's result could be checked against something. None of this is exotic. It is simply what evidence looks like when it is meant to persuade a stranger rather than to please a friend.

The third joint is the jump from our club to every serious club. Even if mornings helped Fernhill, that would be a fact about Fernhill. A club whose members travel an hour to train, or whose pool is shared with a school until nine, may get a different result from the same policy. The letter generalises from a single case without arguing that the case is typical.

The fourth joint is the smuggled definition. Notice the word serious. The letter does not defend the claim that morning training is better; it builds the conclusion into the word, so that a club which disagrees is not serious by definition. A reader who accepts that word has already lost the argument without having heard one.

The last line does something similar. Three clubs finished below Fernhill, and the letter says this tells you everything. It tells you almost nothing. We are not told where those clubs finished the year before, nor how many clubs that did switch also finished below Fernhill. Evidence that only counts the cases that agree is not evidence; it is a selection.

Notice what this analysis has not done. It has not shown that morning practice is useless. It may be excellent, and a properly designed comparison might demonstrate that. What the analysis shows is narrower and more useful: this particular letter gives a reader no good reason to believe its conclusion. Rejecting a bad argument for a claim is not the same as rejecting the claim, and confusing the two is its own error.

A reader who learns to test the joints will find that most arguments in the world fail at one of them, and that noticing this is not cynicism. It is the ordinary care that any claim deserves before it is allowed to change what you believe.`,
    items: [
      { prompt: "How much time did Fernhill swimmers drop over fifty metres?", skill: "literal", correctIndex: 2,
        options: ["Three seconds", "One second", "Two seconds", "Nine seconds"],
        evidence: "our swimmers have dropped an average of two seconds over fifty metres" },
      { prompt: "What is the author's objection to the letter's first joint?", skill: "inference", correctIndex: 0,
        options: ["Order of events is treated as proof of cause", "The swimmers were timed at the wrong distance", "The new coach was not qualified to train them", "The county meet was held too early in the season"],
        evidence: "The letter treats the order as proof of a cause." },
      { prompt: "In this text, what does \"validity\" refer to?", skill: "vocab", correctIndex: 1,
        options: ["Whether each sentence is factually true", "Whether the steps of the reasoning hold together", "Whether the writer is a member of the club", "Whether the results were measured carefully"],
        evidence: "Validity is a property of the joints between them" },
      { prompt: "Why does the author say the letter's evidence could be noise?", skill: "cause-effect", correctIndex: 3,
        options: ["Because the pool is shared with a school", "Because the swimmers were a year older", "Because the coach was hired that season", "Because it rests on one club, one season, one distance"],
        evidence: "One club, one season, one distance." },
      { prompt: "Which sentence best exposes the trick hidden in the word serious?", skill: "evidence", correctIndex: 1,
        options: ["The letter generalises from a single case without arguing that the case is typical.", "it builds the conclusion into the word, so that a club which disagrees is not serious by definition", "Order alone never establishes cause, and a writer who offers only order has offered nothing.", "Three clubs finished below Fernhill, and the letter says this tells you everything."],
        evidence: "it builds the conclusion into the word, so that a club which disagrees is not serious by definition" },
      { prompt: "What is wrong with the letter's use of the three clubs that refused to switch?", skill: "inference", correctIndex: 2,
        options: ["Those clubs did not attend the county meet at all", "Those clubs trained in the morning as well", "It counts only the cases that agree with the conclusion", "It reports where those clubs finished the year before"],
        evidence: "Evidence that only counts the cases that agree is not evidence; it is a selection." },
      { prompt: "Why does the author raise the club whose pool is shared with a school until nine?", skill: "purpose", correctIndex: 0,
        options: ["To show that one club's result may not carry to every club", "To argue that schools should give up their pool time", "To prove that morning practice makes swimmers slower", "To explain why Fernhill hired a new coach"],
        evidence: "A club whose members travel an hour to train, or whose pool is shared with a school until nine, may get a different result from the same policy." },
      { prompt: "What does the author conclude about morning practice itself?", skill: "inference", correctIndex: 3,
        options: ["It clearly makes no difference to swimmers", "It works only for clubs with a new coach", "It has been proven by the county meet results", "It might be excellent, but this letter has not shown it"],
        evidence: "It has not shown that morning practice is useless. It may be excellent" },
      { prompt: "What warning does the author give about rejecting a bad argument?", skill: "purpose", correctIndex: 1,
        options: ["That readers should never trust club magazines", "That rejecting a bad argument is not rejecting the claim", "That a properly designed comparison is impossible here", "That two seconds is too small a change to measure"],
        evidence: "Rejecting a bad argument for a claim is not the same as rejecting the claim, and confusing the two is its own error." },
      { prompt: "How is this text organized?", skill: "structure", correctIndex: 2,
        options: ["As a story about one season at the Fernhill pool", "As a list of results from the county meet", "By quoting a letter and taking its joints one at a time", "By comparing three clubs that refused to switch"],
        evidence: "Take the joints one at a time." },
    ],
  },

  {
    id: "g68-reader-author-meaning", band: "g6-8", genre: "informational",
    title: "The Bench and the Plaque",
    units: ["Reader vs Author Meaning"],
    text: `On a path above the harbour at Cardno there is a wooden bench with a small brass plaque. The plaque says: For Nessa, who liked to stop here.

Six words. The woman who paid for the bench, Nessa's daughter, knew exactly what she meant by them. She meant a particular Tuesday habit, a particular coat, a particular silence that her mother kept while looking at the water. That is the author's meaning, and it is complete, and no reader will ever have it.

What readers have instead is what the words do when they arrive. A walker who has lost a parent reads the plaque and feels the whole shape of a grief that has nothing to do with Nessa. A tired hiker reads it as permission and sits down. A child reads it and asks who Nessa is. A local historian reads it and notes that brass plaques on this path began appearing in the nineteen-eighties. None of these readers is being careless. Each is doing the ordinary work of reading, which is to meet the words with a life already in progress.

Consider the walker who lost a parent. Nothing on the plaque names that walker's mother, and the daughter never thought of strangers at all when she chose the words. Yet the feeling the walker has is a real response to those exact six words, not to some other text, and it would be strange to call it a mistake. The words were placed on a public path. They were always going to be met by the public.

So we have two things, and they are not the same thing. Author's meaning is what the writer intended the words to do. Reader's meaning is what the words in fact do when they land in a particular head at a particular hour.

Here is where two opposite errors wait.

The first error is to say that only the author's meaning counts, and that a reader who feels something the daughter did not intend has simply misread. That cannot be right. If it were, no poem could outlive its poet, and no reader could be moved by anything written before their own birth. Words are released. That is what publishing them is.

The second error is more fashionable and just as wrong. It says that since readers bring themselves, the text means whatever any reader takes it to mean, and no reading can be better than any other. But the plaque does not say Nessa disliked this path, and a reader who reported that would not be offering a personal interpretation. They would be wrong, and the six words on the brass would be enough to show it. The text does not fix one meaning; it does rule out many.

The workable position sits between the two. Treat the author's meaning as the target you are aiming at, knowing you will not hit it exactly. Treat your own response as evidence about the text, not as a verdict on it, and be ready to give up any part of it the words will not support. Ask what the text permits, then ask which of the permitted readings the words most encourage.

This is harder than either error, because it asks the reader to hold two things at once: a respect for what the writer was trying to do, and an honesty about what the words actually did. It is also the only position that lets us argue about a text at all, since arguing requires that some readings be better supported than others.

Notice that the daughter chose liked rather than loved, and stop rather than rest. Those choices narrow the field. They do not close it. Between what the words rule out and what they merely allow, reading actually happens.`,
    items: [
      { prompt: "What do the six words on the plaque say?", skill: "literal", correctIndex: 1,
        options: ["For Nessa, who loved this harbour", "For Nessa, who liked to stop here", "For Nessa, who walked this path daily", "For Nessa, who rested on this bench"],
        evidence: "For Nessa, who liked to stop here." },
      { prompt: "According to the author, what is \"author's meaning\"?", skill: "vocab", correctIndex: 0,
        options: ["What the writer intended the words to do", "What most readers agree the words say", "What the words do when a reader meets them", "What a historian can prove about a text"],
        evidence: "Author's meaning is what the writer intended the words to do." },
      { prompt: "Why does the author say no reader will ever have the daughter's meaning in full?", skill: "inference", correctIndex: 2,
        options: ["Because the plaque is too small to hold it", "Because the daughter never explained the words", "Because it rests on particular memories the words do not carry", "Because brass plaques wear away over time"],
        evidence: "She meant a particular Tuesday habit, a particular coat, a particular silence that her mother kept while looking at the water." },
      { prompt: "What is the FIRST error the author describes?", skill: "literal", correctIndex: 3,
        options: ["Believing a text can mean anything at all", "Reading a plaque without knowing its date", "Treating your own response as evidence", "Holding that only the author's meaning counts"],
        evidence: "The first error is to say that only the author's meaning counts" },
      { prompt: "Which sentence best refutes the claim that a text means whatever a reader takes it to mean?", skill: "evidence", correctIndex: 1,
        options: ["If it were, no poem could outlive its poet, and no reader could be moved by anything written before their own birth.", "the plaque does not say Nessa disliked this path, and a reader who reported that would not be offering a personal interpretation", "Each is doing the ordinary work of reading, which is to meet the words with a life already in progress.", "Reader's meaning is what the words in fact do when they land in a particular head at a particular hour."],
        evidence: "the plaque does not say Nessa disliked this path, and a reader who reported that would not be offering a personal interpretation" },
      { prompt: "What does the author mean by writing that the text does not fix one meaning, but does rule out many?", skill: "inference", correctIndex: 0,
        options: ["The text allows more than one meaning yet still rules many out", "The words have one correct meaning known to the daughter", "The words mean less as more readers pass the bench", "The words should be replaced with a longer inscription"],
        evidence: "The text does not fix one meaning; it does rule out many." },
      { prompt: "Why does the author list the walker, the hiker, the child and the historian?", skill: "purpose", correctIndex: 2,
        options: ["To show that most readers misunderstand plaques", "To argue that the daughter chose the wrong words", "To show different lives producing different readings of the same words", "To explain when brass plaques first appeared on the path"],
        evidence: "Each is doing the ordinary work of reading, which is to meet the words with a life already in progress." },
      { prompt: "What does the author advise a reader to do with a personal response to a text?", skill: "purpose", correctIndex: 1,
        options: ["Trust it fully, since the author is out of reach", "Treat it as evidence and drop what the words will not support", "Set it aside and look only for the author's intention", "Compare it with what other readers have felt"],
        evidence: "Treat your own response as evidence about the text, not as a verdict on it" },
      { prompt: "Why does the author point out the choice of liked rather than loved?", skill: "figurative", correctIndex: 3,
        options: ["To show that the daughter did not know her mother well", "To prove that short words are always clearer", "To suggest the plaque should be rewritten", "To show that small choices narrow the field of readings"],
        evidence: "Those choices narrow the field. They do not close it." },
      { prompt: "What is the central idea of this text?", skill: "mainidea", correctIndex: 0,
        options: ["Good reading works between what a text rules out and what it allows", "A memorial plaque should always explain who it honours", "Readers understand a text better than its author does", "The meaning of any text is decided by the person who wrote it"],
        evidence: "Between what the words rule out and what they merely allow, reading actually happens." },
    ],
  },
];
