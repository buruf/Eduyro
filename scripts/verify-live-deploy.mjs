// scripts/verify-live-deploy.mjs
// GUARDRAIL against the Jul-21 incident: eduyro.com is aliased to Vercel's
// git-integration build of GitHub `main`, but `main` is stale and all real work
// is uncommitted — so a git rebuild silently reverts prod to old code.
//
// Run this AFTER every `vercel --prod`. It confirms the deployment you just
// shipped is the one actually serving eduyro.com, and warns loudly if the git
// branch is behind the working tree (the condition that caused the incident).
//
//   node scripts/verify-live-deploy.mjs <expected_dpl_id>
//   node scripts/verify-live-deploy.mjs            (just report the live dpl)
import { execSync } from "node:child_process";

const DOMAIN = "https://eduyro.com";
// Accept the id with or without the dpl_ prefix (CLI output omits it).
const raw = process.argv[2] || null;
const expected = raw ? (raw.startsWith("dpl_") ? raw : `dpl_${raw}`) : null;

function sh(cmd) { try { return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; } }

async function liveDpl() {
  // Vercel stamps every static asset URL with ?dpl=<deployment id>. Read one.
  const html = await (await fetch(`${DOMAIN}/?_cb=${Date.now()}`, { cache: "no-store" })).text();
  const m = html.match(/[?&]dpl=(dpl_[A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

async function main() {
  console.log("── Post-deploy verification ─────────────────────────────");

  // 1) Git-staleness guard — the root cause of the incident.
  const head = sh("git rev-parse --short HEAD");
  const originMain = sh("git rev-parse --short origin/main");
  const dirty = sh("git status --porcelain").split("\n").filter(Boolean).length;
  const lastCommitDate = sh('git log -1 --format=%ci');
  console.log(`git HEAD=${head}  origin/main=${originMain}  uncommitted=${dirty}  lastCommit=${lastCommitDate}`);
  let danger = false;
  if (dirty > 0) {
    danger = true;
    console.log(`⚠️  ${dirty} UNCOMMITTED files. eduyro.com follows GitHub main; a git rebuild will serve the`);
    console.log(`    committed code (${originMain}, ${lastCommitDate}) — NOT your working tree. Commit+push`);
    console.log(`    to main so git and CLI deploys agree, or the site can silently revert.`);
  }

  // 2) Live deployment id.
  const live = await liveDpl();
  console.log(`live eduyro.com deployment: ${live ?? "UNKNOWN (could not read ?dpl=)"}`);

  if (expected) {
    if (live === expected) {
      console.log(`✅ eduyro.com is serving the expected deployment (${expected}).`);
    } else {
      console.log(`❌ MISMATCH: expected ${expected} but eduyro.com serves ${live}.`);
      console.log(`   The alias did not stick — a git-integration build likely re-took the domain.`);
      console.log(`   Re-run: npx vercel promote <your-deployment-url> --yes  then re-verify.`);
      process.exitCode = 1; return;
    }
  }

  if (danger) {
    console.log("\nRESULT: deployment is live, but the git branch is behind the working tree —");
    console.log("this is the exact condition that caused the Jul-21 revert. Not safe long-term.");
    process.exitCode = 2; return;
  }
  console.log("RESULT: OK — git is in sync and the live deployment matches.");
}

main().catch((e) => { console.error("verify failed:", e.message); process.exitCode = 3; });
