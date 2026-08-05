// scripts/validate-m13-m18.ts — engine self-validation for every higher-math level.
import { validateHigherMathPack } from "../src/lib/shop/higher-math-engine";
let bad = 0;
for (const code of ["M13", "M14", "M15", "M16", "M17", "M18"]) {
  const v = validateHigherMathPack(code);
  console.log(code, v.ok ? "ok" : `ISSUES:\n  ${v.issues.slice(0, 6).join("\n  ")}`);
  if (!v.ok) bad++;
}
process.exit(bad ? 1 : 0);
