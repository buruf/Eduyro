const { generatePackForSkill } = require("@/lib/shop/pack-generator");
const { renderPackToPdf } = require("@/lib/pdf/renderer");
const fs = require("fs");
(async () => {
  for (const skill of ["ADDITION","SUBTRACTION","MULTIPLICATION","DIVISION","FRACTIONS","DECIMALS"]) {
    const pack = generatePackForSkill(skill);
    const sheets = pack.sheets.map((s) => { const am=new Map((s.answerKey??[]).map(e=>[e.id,String(e.answer)])); return { problems: s.problems.map(p=>({...p,answer:am.get(p.id)??String(p.answer??"")})), skillBand:s.bandLabel, meta:s.metaData, workedExample:s.workedExampleData }; });
    const buf = await renderPackToPdf({ skillLabel: pack.label, skillCode: pack.skill, levelCode: pack.skill, sheets });
    const name = `inspect/eduyro-${skill.toLowerCase()}.pdf`;
    fs.writeFileSync("./"+name, Buffer.from(buf));
    console.log("wrote", name, (buf.length/1024|0)+"KB", pack.sheets.length+" sheets");
  }
})().catch(e=>{console.error("ERR", e.message);process.exit(1);});
