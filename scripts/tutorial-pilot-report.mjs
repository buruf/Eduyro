// scripts/tutorial-pilot-report.mjs — pilot measurement report for the
// tutorial redesign (see .superpowers/sdd/task-8-brief.md, Task 8 Step 1).
//
// Reads TutorialEvent rows directly via Prisma (pattern copied from
// scripts/test-tutorial-events.mjs) and joins to CompletedSheet for the
// primary metric. DATABASE_URL comes from .env automatically via prisma.
//
// Sections:
//   1. Variant metrics for skillId "mul-tens" only (the pilot's one skill)
//   2. Variant metrics across ALL skills (the "old" baseline spans every
//      skill — pilot rows only exist for mul-tens today, but this section
//      stays generic so it keeps working as more pilot skills are added)
//   3. Primary metric: first-try accuracy on problems 4-24 of each
//      student's FIRST CompletedSheet for the matching skill, grouped into
//      completers / skippers / baseline.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TutorialEvent.skillId holds the engine unit id ("mul-tens") for the pilot
// variant, but the skill NAME label (e.g. "Multiplying tens (20 × 3)") for
// the old variant, which is what it's passed at call sites. CompletedSheet
// has no skillId column — its worksheet.title is "<label> — Sheet N" — so to
// join a pilot row to sheets we need the id -> label mapping. Kept as a small
// literal map (rather than importing the TS engine file into this .mjs
// script) since the pilot currently covers exactly one skill; extend as more
// skills go through the redesigned tutorial.
const SKILL_ID_TO_LABEL = {
  "mul-tens": "Multiplying tens (20 × 3)",
};

function labelForEvent(ev) {
  if (ev.variant === "pilot") {
    const label = SKILL_ID_TO_LABEL[ev.skillId];
    if (label === undefined) {
      throw new Error(
        `tutorial-pilot-report: pilot row (runId=${ev.runId}) has skillId "${ev.skillId}" not in SKILL_ID_TO_LABEL — ` +
          `add it to the map before running the report, or this row will silently mis-join to the wrong CompletedSheet.`
      );
    }
    return label;
  }
  return ev.skillId; // old variant: skillId IS the label
}

function median(nums) {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function pct(n, d) {
  return d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "n/a";
}

function summarizeVariant(rows) {
  const runs = rows.length;
  if (runs === 0) return { runs: 0 };
  const completions = rows.filter((r) => r.beatIndex >= 4 && r.endedAt != null).length;
  const skips = rows.filter((r) => r.skipTapped).length;
  const audioMs = rows.map((r) => r.audioPlayedMs).filter((n) => Number.isFinite(n));
  const predicted = rows.filter((r) => r.predictionCorrect !== null);
  const predictedCorrect = predicted.filter((r) => r.predictionCorrect === true).length;
  return {
    runs,
    completionRate: pct(completions, runs),
    skipRate: pct(skips, runs),
    medianAudioPlayedMs: median(audioMs),
    predictionAccuracy: predicted.length > 0 ? pct(predictedCorrect, predicted.length) : "n/a (0 predictions)",
  };
}

function printVariantTable(title, byVariant) {
  console.log(`\n=== ${title} ===`);
  const variants = Object.keys(byVariant);
  if (variants.length === 0 || variants.every((v) => byVariant[v].runs === 0)) {
    console.log("  no runs yet");
    return;
  }
  for (const variant of variants) {
    const s = byVariant[variant];
    if (s.runs === 0) {
      console.log(`  [${variant}] no runs yet`);
      continue;
    }
    console.log(
      `  [${variant}] runs=${s.runs}  completion=${s.completionRate}  skip=${s.skipRate}  medianAudioPlayedMs=${
        s.medianAudioPlayedMs ?? "n/a"
      }  predictionAccuracy=${s.predictionAccuracy}`
    );
  }
}

async function main() {
  const allEvents = await prisma.tutorialEvent.findMany();

  if (allEvents.length === 0) {
    console.log("Tutorial pilot report");
    console.log("======================");
    console.log("\nno runs yet — TutorialEvent is empty.");
    await prisma.$disconnect();
    return;
  }

  console.log("Tutorial pilot report");
  console.log("======================");

  // ── Section 1: mul-tens only ──
  const mulTensLabel = SKILL_ID_TO_LABEL["mul-tens"];
  const mulTensEvents = allEvents.filter(
    (ev) => (ev.variant === "pilot" && ev.skillId === "mul-tens") || (ev.variant === "old" && ev.skillId === mulTensLabel)
  );
  const mulTensByVariant = {
    old: summarizeVariant(mulTensEvents.filter((e) => e.variant === "old")),
    pilot: summarizeVariant(mulTensEvents.filter((e) => e.variant === "pilot")),
  };
  printVariantTable('Section 1: "mul-tens" skill only', mulTensByVariant);

  // ── Section 2: all skills ──
  const variantsSeen = [...new Set(allEvents.map((e) => e.variant))];
  const allByVariant = {};
  for (const v of variantsSeen) {
    allByVariant[v] = summarizeVariant(allEvents.filter((e) => e.variant === v));
  }
  printVariantTable("Section 2: ALL skills (old baseline spans every skill)", allByVariant);

  // ── Section 3: primary metric — first-try accuracy on problems 4-24 of
  // the student's FIRST CompletedSheet for the matching skill. ──
  console.log("\n=== Section 3: primary metric (first-try accuracy, problems 4-24) ===");

  const groups = { completers: [], skippers: [], baseline: [] };
  for (const ev of allEvents) {
    if (ev.variant === "old") groups.baseline.push(ev);
    else if (ev.skipTapped) groups.skippers.push(ev);
    else if (ev.beatIndex >= 4 && ev.endedAt != null) groups.completers.push(ev);
    // events that are neither old, nor skipped, nor completed (abandoned
    // mid-tutorial) are excluded from all three groups — they don't fit any
    // bucket cleanly and would just add noise to the primary metric.
  }

  let anyGroupHadData = false;
  for (const [groupName, events] of Object.entries(groups)) {
    if (events.length === 0) {
      console.log(`  [${groupName}] no runs yet`);
      continue;
    }

    const accuracies = [];
    for (const ev of events) {
      const label = labelForEvent(ev);
      const firstSheet = await prisma.completedSheet.findFirst({
        where: { studentId: ev.studentId, worksheet: { title: { startsWith: label } } },
        orderBy: { completedAt: "asc" },
        select: { answers: true, accuracyPct: true },
      });
      if (!firstSheet) continue;
      const answers = Array.isArray(firstSheet.answers) ? firstSheet.answers : [];
      // "problems 4-24" = 1-indexed positions 4 through 24 -> 0-indexed
      // slice [3, 24). Prefer answers[].firstTry (per-problem, client-honest
      // first-try correctness) when the submission included it. Older rows
      // (submitted before this field existed) have answers[].isCorrect ==
      // FINAL correctness only (retry-till-right ⇒ ~always true), which is
      // NOT a valid first-try proxy per problem — for those, fall back to the
      // sheet-level accuracyPct (which IS the client's honest
      // firstTryAccuracyPct when the client sent one, clamped to the final
      // score — see submit-sheet route) and flag it as a fallback.
      const windowAnswers = answers.slice(3, 24);
      if (windowAnswers.length === 0) continue;
      const withFirstTry = windowAnswers.filter((a) => a && typeof a.firstTry === "boolean");
      if (withFirstTry.length > 0) {
        const correct = withFirstTry.filter((a) => a.firstTry === true).length;
        accuracies.push({ pct: (correct / withFirstTry.length) * 100, fallback: false });
      } else {
        accuracies.push({ pct: firstSheet.accuracyPct, fallback: true });
      }
    }

    if (accuracies.length === 0) {
      console.log(`  [${groupName}] ${events.length} run(s), but no matching first sheet found yet — no runs yet`);
      continue;
    }

    anyGroupHadData = true;
    const pcts = accuracies.map((a) => a.pct);
    const fallbackCount = accuracies.filter((a) => a.fallback).length;
    const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    const fallbackNote = fallbackCount > 0 ? ` (${fallbackCount}/${accuracies.length} sheet-level fallback)` : "";
    console.log(
      `  [${groupName}] students-with-sheet=${accuracies.length}/${events.length}  avgFirstTryAccuracy=${avg.toFixed(
        1
      )}%  medianFirstTryAccuracy=${median(pcts).toFixed(1)}%${fallbackNote}`
    );
  }
  if (!anyGroupHadData) {
    console.log("  (no group has a matching first sheet yet — no runs yet)");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("tutorial-pilot-report failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
