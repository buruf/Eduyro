const { generateProblems } = require("@/lib/worksheet/generator");
const levels = Array.from({length:18},(_,i)=>`M${i+1}`);
const sheets = [1, 25, 55, 100];
for (const lvl of levels) {
  for (const s of sheets) {
    try {
      const { problems } = generateProblems({ subjectSlug:"MATH", levelCode:lvl, skillName:"", problemCount:20, timeLimitMinutes:20, sheetNumber:s, totalSheets:100 });
      console.log(`== ${lvl} sheet ${s} (${problems.length}) ==`);
      for (const p of problems.slice(0,6)) console.log(`  [${p.type}] ${JSON.stringify(p.question).slice(0,140)} => ${JSON.stringify(p.answer).slice(0,80)}`);
    } catch(e){ console.log(`== ${lvl} sheet ${s} ERROR: ${e.message}`); }
  }
}
