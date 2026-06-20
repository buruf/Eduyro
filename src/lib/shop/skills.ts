// src/lib/shop/skills.ts
// Single source of truth for shop skill identifiers.
//
// This union was previously copy-defined in four modules and drifted —
// GEOMETRY was present in pack-generator/progressive-generator but absent in
// difficulty-curve/progression-paths — which caused real bugs when adding
// skills. Define it once here.

// The full shop catalog: the math progression skills plus standalone skills
// (e.g. geometry) that have their own engine.
export type ShopSkill =
  | "ADDITION"
  | "SUBTRACTION"
  | "MULTIPLICATION"
  | "DIVISION"
  | "FRACTIONS"
  | "DECIMALS"
  | "RATIOS"
  | "PRE_ALGEBRA"
  | "LINEAR_EQUATIONS"
  | "POLYNOMIALS"
  | "GEOMETRY";

// The subset driven by the math difficulty-curve / progression-path engines.
// Geometry has its own engine and never flows through those, so exclude it —
// this keeps their exhaustive maps (e.g. SKILL_LEVEL_CODE) correct.
export type MathProgressionSkill = Exclude<ShopSkill, "GEOMETRY">;
