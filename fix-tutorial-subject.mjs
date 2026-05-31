import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/(dashboard)/student/page.tsx', 'utf8');

// Fix: pass subjectSlug to TutorialModal
c = c.replace(
  `        <TutorialModal
          open={tutorialOpen}
          onClose={() => { setTutorialOpen(false); setTutorialSheet(null); setTutorialContent(null); }}
          sheet={tutorialSheet}
          content={tutorialContent}
          onComplete={() => onTutorialComplete(tutorialSheet)}
        />`,
  `        <TutorialModal
          open={tutorialOpen}
          onClose={() => { setTutorialOpen(false); setTutorialSheet(null); setTutorialContent(null); }}
          sheet={tutorialSheet}
          content={tutorialContent}
          subjectSlug={data.levelProgress?.subjectName === "Mathematics" ? "MATH" : data.levelProgress?.subjectName?.toUpperCase() ?? "MATH"}
          onComplete={() => onTutorialComplete(tutorialSheet)}
        />`
);

writeFileSync('src/app/(dashboard)/student/page.tsx', c, 'utf8');
console.log('Done');
