import { ALL_LESSON_UNITS } from "../src/remotion/lesson/registry";
for (const id of ["mul-2d2d", "cur-decimal-subtract", "cur-decimal-multiply", "cur-quadratic-range", "cur-domain-rational", "cur-sequences", "cur-power-rule"]) {
  const u = ALL_LESSON_UNITS.find((x) => x.id === id)!;
  console.log(`\n=== ${id} (${u.comp}) ===`);
  for (const l of u.lines()) console.log(`  [${l.id}] ${l.text}`);
}
