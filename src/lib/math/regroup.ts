// src/lib/math/regroup.ts
// Whether a column addition carries / a column subtraction borrows — the key
// reasoning jump in written decimal (and whole-number) arithmetic. Used to tier
// worksheets so a concept progresses from no-regrouping to regrouping.
// Operates on the INTEGER representations (e.g. hundredths as whole numbers).

export function addCarries(a: number, b: number): boolean {
  while (a > 0 || b > 0) {
    if ((a % 10) + (b % 10) >= 10) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

export function subBorrows(a: number, b: number): boolean {
  // assumes a >= b
  while (b > 0) {
    if ((a % 10) < (b % 10)) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}
