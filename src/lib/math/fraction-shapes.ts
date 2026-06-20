// src/lib/math/fraction-shapes.ts
// Pure geometry shared by the PDF and web fraction renderers, so a regular
// polygon (triangle, pentagon, hexagon…) can be sliced into `total` equal wedges
// identically in both. Returns SVG path "d" strings — one per wedge; the caller
// fills the first `n`.

export function polygonSlicePaths(sides: number, total: number, R: number): string[] {
  const cx = R, cy = R;
  const seg = (2 * Math.PI) / sides;
  const half = seg / 2;
  // Distance from centre to the polygon edge at angle `a` (regular polygon).
  const rAt = (a: number) => {
    const t = (((a % seg) + seg) % seg) - half;
    return (R * Math.cos(half)) / Math.cos(t);
  };
  const pt = (a: number): [number, number] => [cx + rAt(a) * Math.cos(a), cy + rAt(a) * Math.sin(a)];
  const start = -Math.PI / 2; // first wedge starts at the top
  const paths: string[] = [];
  for (let i = 0; i < total; i++) {
    const a0 = start + (i / total) * 2 * Math.PI;
    const a1 = start + ((i + 1) / total) * 2 * Math.PI;
    // Sample along the arc so each wedge follows the polygon's straight edges.
    const steps = Math.max(2, Math.ceil((a1 - a0) / (Math.PI / 90)));
    let d = `M ${cx.toFixed(2)} ${cy.toFixed(2)} `;
    for (let s = 0; s <= steps; s++) {
      const a = a0 + (a1 - a0) * (s / steps);
      const [x, y] = pt(a);
      d += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    paths.push(d + "Z");
  }
  return paths;
}

/** Marker shape name → number of polygon sides. */
export const POLY_SIDES: Record<string, number> = { tri: 3, penta: 5, hexa: 6 };
