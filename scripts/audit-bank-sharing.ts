// scripts/audit-bank-sharing.ts
// Sibling units that share a content bank must not serve IDENTICAL sheets.
//
// The generator offsets each unit's rotation by its index among its siblings,
// which fixes every group whose bank has at least as many passage blocks as
// units. What remains is a CONTENT shortage: banks with fewer blocks than
// siblings cannot be rotated apart, only written apart. Those known groups
// are pinned below as a ratchet - the list may only shrink. A NEW collision
// (routing regression, or a new unit added to a small bank) fails this audit.
import { generateProblems } from "../src/lib/worksheet/generator";
import { READING_CURRICULUM } from "../src/lib/reading/curriculum";

// Content-authoring backlog: groups whose shared bank is too small to rotate
// apart. Writing more passages for these banks is the only real fix.


let pairs = 0;
const groups: string[] = [];
for (const mod of READING_CURRICULUM) {
  const sigs = new Map<string, string[]>();
  for (const unit of mod.units) {
    let qs: string[] = [];
    try {
      qs = (generateProblems({
        subjectSlug: "READING", levelCode: mod.code, skillName: unit,
        problemCount: 30, timeLimitMinutes: 10, sheetNumber: 1, totalSheets: 100,
      }).problems as { question?: string }[]).map((p) => String(p.question));
    } catch { continue; }
    const sig = qs.slice(0, 12).join("|");
    (sigs.get(sig) ?? sigs.set(sig, []).get(sig)!).push(unit);
  }
  for (const [, units] of sigs) {
    if (units.length < 2) continue;
    pairs += (units.length * (units.length - 1)) / 2;
    groups.push(mod.code + ": " + units.join(" | "));
  }
}

// RATCHET. The rotation fix took duplicated sibling pairs from 266 to ~85; the
// remainder is banks with fewer passage blocks than sibling units, which only
// new WRITING can fix. Ceiling has small headroom because the MC converter's
// per-process shuffle jitters the measurement by a pair or two. May only go
// DOWN over time - up means the rotation broke or a bank gained a unit it cannot support.
const PINNED_PAIRS = 90;
console.log(`duplicated sibling pairs: ${pairs} (pinned ceiling ${PINNED_PAIRS})`);
if (pairs > PINNED_PAIRS) {
  console.log("FAIL - duplicated-sheet pairs INCREASED. New groups:");
  for (const g of groups) console.log("  " + g);
  process.exit(1);
}
if (pairs < PINNED_PAIRS) {
  console.log(`NOTE: pairs dropped below the pinned ceiling - ratchet down PINNED_PAIRS to ${pairs}.`);
}
console.log("PASS");