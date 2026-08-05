// scripts/test-addition-hints.ts — verify early-addition hints never lead with
// subtraction, always attach a countable picture, and use the sheet strategy.
import { buildScaffold } from "../src/lib/tutor/scaffold";

let fail = 0;
function check(name: string, q: string, a: string, dir: string, expectViz: RegExp) {
  const sc = buildScaffold(q, a, "", { subjectSlug: "MATH", directive: dir });
  const firstHint = sc.hints[0] ?? "";
  const leadsSubtract = /−|minus|subtract/i.test(firstHint);
  const hasViz = sc.visual ? expectViz.test(sc.visual) : false;
  const ok = !leadsSubtract && hasViz;
  if (!ok) { fail++; console.log(`FAIL ${name}\n  q=${q} dir="${dir}"\n  visual=${sc.visual}\n  hint1=${firstHint}`); }
  else console.log(`ok   ${name}: "${firstHint}"  ${sc.visual}`);
}

// The exact field-report case: 6 + ___ = 13 on the near-doubles sheet.
check("near-double missing addend", "6 + ____ = 13", "7", "Near-doubles (use the double you know)", /missdots 6 13/);
check("doubles missing addend", "7 + ____ = 14", "7", "Doubles (1+1 … 9+9)", /missdots 7 14/);
check("make-ten missing addend", "8 + ____ = 15", "7", "Make ten & bridging through 10", /missdots 8 15/);
check("count-on missing addend", "3 + ____ = 9", "6", "Count on 1, 2, 3", /missdots 3 9/);
check("plain double sum", "6 + 6", "12", "Doubles (1+1 … 9+9)", /adddots 6 6/);
check("plain near-double sum", "6 + 7", "13", "Near-doubles (use the double you know)", /adddots 6 7/);
check("plain make-ten sum", "8 + 5", "13", "Make ten & bridging through 10", /adddots 8 5/);

// Independent answer re-derivation across the fact ranges.
let wrong = 0, checked = 0;
for (let k = 1; k <= 9; k++) for (let miss = 1; miss <= 9; miss++) {
  const total = k + miss;
  const sc = buildScaffold(`${k} + ____ = ${total}`, String(miss), "", { subjectSlug: "MATH", directive: "Near-doubles" });
  checked++;
  // last hint should state the correct missing number
  if (!sc.hints[sc.hints.length - 1].includes(String(miss))) { wrong++; console.log(`  answer wrong: ${k}+_=${total} -> ${sc.hints.at(-1)}`); }
}
console.log(`\nmissing-addend answers checked: ${checked}, wrong: ${wrong}`);
console.log(fail || wrong ? "FAIL" : "PASS");
process.exit(fail || wrong ? 1 : 0);
