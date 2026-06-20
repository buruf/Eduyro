// src/lib/math/angle-shapes.ts
// Pure geometry for angle DIAGRAMS, shared by the PDF and web renderers so they
// draw identically. Returns simple primitives (lines, a polygon, a small square,
// text labels) in a `size`×`size` coordinate box; each renderer maps them to its
// own SVG elements.
//
// Kinds (carried in the [[viz …]] marker):
//   angline  a   — straight line split by a ray → a° and ?      (supplement / line)
//   angright a   — right angle split by a ray → a° and ?        (complement)
//   angcross a   — two crossed lines → a° and its vertical ?    (vertical angles)
//   angtri   a b — triangle with two labelled angles and ?      (triangle sum)

export type AnglePrim =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; dash?: boolean }
  | { t: "poly"; pts: [number, number][] }
  | { t: "rect"; x: number; y: number; w: number; h: number }
  | { t: "circle"; cx: number; cy: number; r: number }
  | { t: "text"; x: number; y: number; s: string };

export function isAngleKind(kind: string): boolean {
  return kind === "angline" || kind === "angright" || kind === "angcross" || kind === "angtri";
}

export function isGeomKind(kind: string): boolean {
  return kind === "geomrect" || kind === "geomsquare" || kind === "geomtri" || kind === "geomcircle";
}

export function isFigureKind(kind: string): boolean {
  return isAngleKind(kind) || isGeomKind(kind);
}

/** Dispatch to the right diagram builder for any geometry figure marker. */
export function figureDiagram(kind: string, nums: number[], S: number): AnglePrim[] {
  return isGeomKind(kind) ? geomDiagram(kind, nums, S) : angleDiagram(kind, nums, S);
}

// Labeled perimeter/area figures (not drawn to scale — schematic, with the real
// measures as labels): rectangle, square, triangle (base + dashed height), circle.
export function geomDiagram(kind: string, nums: number[], S: number): AnglePrim[] {
  const out: AnglePrim[] = [];
  const [a, b] = nums;

  if (kind === "geomrect" || kind === "geomsquare") {
    const square = kind === "geomsquare";
    const bw = S - 26;
    const bh = square ? S - 26 : (S - 26) * 0.62;
    const x = 13, y = (S - bh) / 2;
    out.push({ t: "rect", x, y, w: bw, h: bh });
    out.push({ t: "text", x: x + bw / 2, y: y - 5, s: `${a}` });               // length / side (top)
    if (!square) out.push({ t: "text", x: x + 11, y: y + bh / 2 + 3, s: `${b}` }); // width (just inside left edge)
  } else if (kind === "geomtri") {
    const A: [number, number] = [12, S - 14], B: [number, number] = [S - 12, S - 14];
    const apexX = (A[0] + B[0]) / 2, apexY = 12;
    out.push({ t: "poly", pts: [A, B, [apexX, apexY]] });
    out.push({ t: "line", x1: apexX, y1: apexY, x2: apexX, y2: A[1], dash: true }); // height
    out.push({ t: "text", x: apexX, y: A[1] + 12, s: `b=${a}` });          // base
    out.push({ t: "text", x: apexX + 12, y: (apexY + A[1]) / 2, s: `h=${b}` }); // height
  } else if (kind === "geomcircle") {
    const cx = S / 2, cy = S / 2, r = S * 0.4;
    out.push({ t: "circle", cx, cy, r });
    out.push({ t: "line", x1: cx, y1: cy, x2: cx + r, y2: cy });
    out.push({ t: "text", x: cx + r / 2, y: cy - 4, s: `r=${a}` });
  }
  return out;
}

export function angleDiagram(kind: string, nums: number[], S: number): AnglePrim[] {
  const rad = (d: number) => (d * Math.PI) / 180;
  const out: AnglePrim[] = [];
  const a = nums[0] ?? 60, b = nums[1] ?? 60;

  if (kind === "angline") {
    const cx = S / 2, cy = S * 0.58, L = S * 0.44;
    const P = (deg: number, r = L): [number, number] => [cx + r * Math.cos(rad(deg)), cy - r * Math.sin(rad(deg))];
    out.push({ t: "line", x1: 6, y1: cy, x2: S - 6, y2: cy });
    const e = P(a); out.push({ t: "line", x1: cx, y1: cy, x2: e[0], y2: e[1] });
    const la = P(a / 2, L * 0.66); out.push({ t: "text", x: la[0], y: la[1], s: `${a}°` });
    const lb = P((a + 180) / 2, L * 0.66); out.push({ t: "text", x: lb[0], y: lb[1], s: "?" });
  } else if (kind === "angright") {
    const vx = S * 0.18, vy = S * 0.82, L = S * 0.62;
    const P = (deg: number, r = L): [number, number] => [vx + r * Math.cos(rad(deg)), vy - r * Math.sin(rad(deg))];
    out.push({ t: "line", x1: vx, y1: vy, x2: vx + L, y2: vy });
    out.push({ t: "line", x1: vx, y1: vy, x2: vx, y2: vy - L });
    const e = P(a); out.push({ t: "line", x1: vx, y1: vy, x2: e[0], y2: e[1] });
    out.push({ t: "rect", x: vx, y: vy - 9, w: 9, h: 9 });
    const la = P(a / 2, L * 0.55); out.push({ t: "text", x: la[0], y: la[1], s: `${a}°` });
    const lb = P((a + 90) / 2, L * 0.55); out.push({ t: "text", x: lb[0], y: lb[1], s: "?" });
  } else if (kind === "angcross") {
    const cx = S / 2, cy = S / 2, L = S * 0.46, base = 18;
    const P = (deg: number, r = L): [number, number] => [cx + r * Math.cos(rad(deg)), cy - r * Math.sin(rad(deg))];
    const l1a = P(base), l1b = P(base + 180), l2a = P(base + a), l2b = P(base + a + 180);
    out.push({ t: "line", x1: l1a[0], y1: l1a[1], x2: l1b[0], y2: l1b[1] });
    out.push({ t: "line", x1: l2a[0], y1: l2a[1], x2: l2b[0], y2: l2b[1] });
    const la = P(base + a / 2, L * 0.5); out.push({ t: "text", x: la[0], y: la[1], s: `${a}°` });
    const lb = P(base + a / 2 + 180, L * 0.5); out.push({ t: "text", x: lb[0], y: lb[1], s: "?" });
  } else if (kind === "angtri") {
    const A: [number, number] = [8, S - 8], B: [number, number] = [S - 8, S - 8], C: [number, number] = [S * 0.42, 8];
    const G: [number, number] = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    // Place each label part-way from its vertex toward the centroid so the three
    // labels sit clearly inside their own corners and never overlap.
    const lab = (V: [number, number], t: number): [number, number] => [V[0] + (G[0] - V[0]) * t, V[1] + (G[1] - V[1]) * t + 3];
    out.push({ t: "poly", pts: [A, B, C] });
    const pa = lab(A, 0.4), pb = lab(B, 0.4), pc = lab(C, 0.45);
    out.push({ t: "text", x: pa[0], y: pa[1], s: `${a}°` });
    out.push({ t: "text", x: pb[0], y: pb[1], s: `${b}°` });
    out.push({ t: "text", x: pc[0], y: pc[1], s: "?" });
  }
  return out;
}
