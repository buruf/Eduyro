// scripts/audit-decodable-texts.ts
// THE GATE for Track A content. Every decodable text is re-scored against the
// phonics stage it claims, and the build FAILS if any text is below threshold.
// LLM-drafted content is only safe because this runs.
import { DECODABLE_TEXTS } from "../src/lib/reading/decodable-texts";
import { passesDecodabilityGate, decodabilityReport, DECODABLE_MIN_PCT } from "../src/lib/reading/decodability";
import { getStage } from "../src/lib/reading/phonics";

let fails = 0;
const wordCounts: number[] = [];

for (const t of DECODABLE_TEXTS) {
  const { ok, report, failures } = passesDecodabilityGate(t.text, t.stage);
  wordCounts.push(report.totalWords);
  if (!ok) {
    fails++;
    console.log(`✗ ${t.id} [${t.title}] stage=${t.stage} (${getStage(t.stage)?.label})`);
    for (const f of failures) console.log(`    ${f}`);
    const bad = report.verdicts.filter((v) => !v.decodable).map((v) => `${v.word}(${v.reason})`);
    console.log(`    all offenders: ${[...new Set(bad)].join(", ")}`);
  } else {
    console.log(`✓ ${t.id.padEnd(18)} ${String(report.decodablePct).padStart(5)}% decodable · ${String(report.heartWordPct).padStart(4)}% heart · ${String(report.totalWords).padStart(3)} words`);
  }

  // Questions must be answerable, and options must be distinct.
  for (const q of t.questions) {
    const uniq = new Set(q.options.map((o) => o.trim().toLowerCase()));
    if (uniq.size !== q.options.length) { fails++; console.log(`✗ ${t.id}: duplicate options in "${q.prompt}"`); }
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) { fails++; console.log(`✗ ${t.id}: bad correctIndex in "${q.prompt}"`); }
  }
  if (t.questions.length < 4 || t.questions.length > 10) {
    fails++; console.log(`✗ ${t.id}: ${t.questions.length} questions (want 4–10 — 24 is the old math-shaped habit)`);
  }
}

// Grade 1–2 volume norms: 40–150 words of connected text.
const short = DECODABLE_TEXTS.filter((t) => decodabilityReport(t.text, t.stage).totalWords < 40);
for (const t of short) { fails++; console.log(`✗ ${t.id}: too short (<40 words) for a Grade 1–2 reading session`); }

const total = wordCounts.reduce((a, b) => a + b, 0);
console.log(`\ntexts: ${DECODABLE_TEXTS.length}, words: min ${Math.min(...wordCounts)} / avg ${Math.round(total / wordCounts.length)} / max ${Math.max(...wordCounts)}`);
console.log(`threshold: ${DECODABLE_MIN_PCT}% decodable`);
console.log(`${fails === 0 ? "✅" : "❌"} decodable-text failures: ${fails}`);
process.exit(fails ? 1 : 0);
