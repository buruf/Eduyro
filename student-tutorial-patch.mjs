import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/(dashboard)/student/page.tsx', 'utf8');

// 1. Add tutorial import at top
c = c.replace(
  'import { cn, formatTime } from "@/lib/utils";',
  'import { cn, formatTime } from "@/lib/utils";\nimport { getTutorial, type TutorialContent } from "@/lib/worksheet/tutorials";'
);

// 2. Add tutorial state after practiceSheet state
c = c.replace(
  '  const [practiceSheet, setPracticeSheet] = useState<TodaySheet | null>(null);',
  `  const [practiceSheet, setPracticeSheet] = useState<TodaySheet | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialSheet, setTutorialSheet] = useState<TodaySheet | null>(null);
  const [tutorialContent, setTutorialContent] = useState<TutorialContent | null>(null);`
);

// 3. Replace openPractice function
c = c.replace(
  `  function openPractice(sheet: TodaySheet) {
    if (sheet.status !== "IN_PROGRESS") return;
    setPracticeSheet(sheet);
    setPracticeOpen(true);
    if (!timerRunning) setTimerRunning(true);
  }`,
  `  function openPractice(sheet: TodaySheet) {
    if (sheet.status !== "IN_PROGRESS") return;
    // Check if tutorial has been seen for this skill
    const tutorialKey = \`eduyro:tutorial:\${sheet.skillName.toLowerCase().replace(/\\s+/g, '-')}\`;
    const seen = typeof window !== 'undefined' && localStorage.getItem(tutorialKey) === '1';
    if (!seen) {
      const subjectSlug = data?.levelProgress?.subjectName?.toUpperCase() as string ?? "MATH";
      const content = getTutorial(subjectSlug, sheet.skillName);
      setTutorialContent(content);
      setTutorialSheet(sheet);
      setTutorialOpen(true);
    } else {
      setPracticeSheet(sheet);
      setPracticeOpen(true);
      if (!timerRunning) setTimerRunning(true);
    }
  }

  function onTutorialComplete(sheet: TodaySheet) {
    const tutorialKey = \`eduyro:tutorial:\${sheet.skillName.toLowerCase().replace(/\\s+/g, '-')}\`;
    if (typeof window !== 'undefined') localStorage.setItem(tutorialKey, '1');
    setTutorialOpen(false);
    setTutorialSheet(null);
    setTutorialContent(null);
    setPracticeSheet(sheet);
    setPracticeOpen(true);
    if (!timerRunning) setTimerRunning(true);
  }`
);

// 4. Add tutorial modal before practice modal at the end of the return
c = c.replace(
  `      {/* Practice modal — wired to real APIs */}
      {practiceOpen && practiceSheet && (`,
  `      {/* Tutorial modal — shown once per skill */}
      {tutorialOpen && tutorialSheet && tutorialContent && (
        <TutorialModal
          open={tutorialOpen}
          onClose={() => { setTutorialOpen(false); setTutorialSheet(null); setTutorialContent(null); }}
          sheet={tutorialSheet}
          content={tutorialContent}
          onComplete={() => onTutorialComplete(tutorialSheet)}
        />
      )}

      {/* Practice modal — wired to real APIs */}
      {practiceOpen && practiceSheet && (`
);

writeFileSync('src/app/(dashboard)/student/page.tsx', c, 'utf8');
console.log('Patch applied');
