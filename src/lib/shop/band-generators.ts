// src/lib/shop/band-generators.ts
// Extended problem generators for M7-M12 shop skill bands.
// Called from pack-generator.ts generateOneProblem() switch statement.

export function generateM7Band(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "frac-identify": {
      const items: [string, string][] = [
        ["A pizza has 8 slices. 3 are eaten. What fraction remains?","5/8"],
        ["What fraction of 12 is 4?","1/3"],
        ["Write 6/8 in simplest form.","3/4"],
        ["Which is larger: 2/3 or 3/4?","3/4"],
        ["What fraction of 20 is 5?","1/4"],
        ["1/4 + 2/4 = ?","3/4"],
        ["A bag has 4 red and 6 blue marbles. What fraction are red?","2/5"],
        ["Write 4/6 in simplest form.","2/3"],
        ["Which is larger: 1/2 or 2/5?","1/2"],
        ["Shade 3/5 of 10 equal parts. How many parts are shaded?","6"],
      ];
      return items[Math.floor(rng() * items.length)];
    }
    case "frac-simplify": {
      const pairs: [number,number][] = [[2,4],[3,6],[4,8],[6,9],[4,6],[6,10],[8,12],[9,12],[10,15],[6,8],[15,20],[12,16],[4,10],[6,14],[10,12],[8,20],[9,15],[12,18],[15,25],[18,24]];
      const [n,d] = pairs[Math.floor(rng() * pairs.length)];
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const g = gcd(n, d);
      return [`Simplify ${n}/${d}`, `${n/g}/${d/g}`];
    }
    case "frac-add": {
      const pairs: [string,string,string][] = [
        ["1/4","2/4","3/4"],["1/3","1/3","2/3"],["2/5","1/5","3/5"],
        ["1/6","2/6","1/2"],["3/8","1/8","1/2"],["1/2","1/4","3/4"],
        ["2/3","1/6","5/6"],["3/10","4/10","7/10"],["1/3","2/6","2/3"],
        ["1/8","3/8","1/2"],
      ];
      const [a,b,ans] = pairs[Math.floor(rng() * pairs.length)];
      return [`${a} + ${b} =`, ans];
    }
    case "frac-compare": {
      const pairs: [string,string,string][] = [
        ["1/2","1/3","1/2"],["2/3","3/5","2/3"],["3/4","5/8","3/4"],
        ["4/5","7/10","4/5"],["1/4","1/3","1/3"],["5/6","7/8","7/8"],
        ["3/8","2/5","2/5"],["2/7","1/3","1/3"],["5/9","4/7","5/9"],
        ["3/5","5/8","5/8"],
      ];
      const [a,b,larger] = pairs[Math.floor(rng() * pairs.length)];
      return [`Which is larger: ${a} or ${b}?`, larger];
    }
    default: return ["1/2 + 1/4 = ?", "3/4"];
  }
}

export function generateM8Band(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "dec-place": {
      const nums = [3.5, 12.4, 0.75, 1.25, 4.08, 10.3, 0.6, 7.15, 25.9, 3.14, 0.08, 5.6];
      const n = nums[Math.floor(rng() * nums.length)];
      const parts = n.toString().split('.');
      const tenths = parts[1]?.[0] ?? '0';
      return [`In ${n}, what digit is in the tenths place?`, tenths];
    }
    case "dec-ops": {
      const a = parseFloat((r(1,99)/10).toFixed(1));
      const b = parseFloat((r(1,99)/10).toFixed(1));
      const op = Math.floor(rng() * 2);
      if (op === 0) return [`${a} + ${b} =`, String(parseFloat((a+b).toFixed(2)))];
      const big = Math.max(a,b), small = Math.min(a,b);
      return [`${big} - ${small} =`, String(parseFloat((big-small).toFixed(2)))];
    }
    case "dec-pct": {
      const bases = [10, 20, 25, 50, 80, 100, 200];
      const pcts  = [10, 15, 20, 25, 50, 75];
      const base = bases[Math.floor(rng() * bases.length)];
      const pct  = pcts[Math.floor(rng() * pcts.length)];
      return [`What is ${pct}% of ${base}?`, String((base * pct) / 100)];
    }
    case "dec-mixed": {
      const base = [10,20,25,50,100][Math.floor(rng()*5)];
      const pct  = [10,20,25,50][Math.floor(rng()*4)];
      return [`What is ${pct}% of ${base}?`, String((base*pct)/100)];
    }
    default: return ["What is 25% of 80?", "20"];
  }
}

export function generateM9Band(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "rat-basic": {
      const a = r(1,10), b = r(1,10), mult = r(2,5);
      return [`${a}:${b} = ${a*mult}:___`, String(b*mult)];
    }
    case "rat-prop": {
      const items: [string,string][] = [
        ["If 4 apples cost $2, how much do 12 apples cost?","$6"],
        ["A car travels 60 km in 1 hour. How far in 3 hours?","180 km"],
        ["A recipe needs 2 cups for 12 cookies. How much for 36?","6 cups"],
        ["Solve: x/4 = 3/12","1"],["Solve: 5/8 = x/40","25"],
        ["If 3 workers take 12 days, how long for 6 workers?","6 days"],
        ["Solve: 7/x = 14/6","3"],["Solve: 3/5 = 12/x","20"],
      ];
      return items[Math.floor(rng() * items.length)];
    }
    case "rat-rate": {
      const items: [string,string][] = [
        ["A car travels 240 km in 4 hours. Speed in km/h?","60 km/h"],
        ["12 apples cost $3. Cost per apple?","$0.25"],
        ["A factory makes 500 items in 5 hours. Items per hour?","100"],
        ["A printer prints 60 pages in 5 minutes. Pages per minute?","12"],
        ["5 kg of rice costs $8. Price per kg?","$1.60"],
        ["A student reads 120 pages in 4 days. Pages per day?","30"],
        ["A cyclist rides 90 km in 3 hours. Unit rate?","30 km/h"],
        ["A tap fills 24 litres in 8 minutes. Litres per minute?","3"],
      ];
      return items[Math.floor(rng() * items.length)];
    }
    case "rat-word": {
      const t = Math.floor(rng() * 6);
      if (t === 0) {
        const price = r(10,80), pct = [10,15,20,25][Math.floor(rng()*4)];
        const sale = price - (price*pct/100);
        return [`A ${price} item is ${pct}% off. Sale price?`, `${sale}`];
      }
      if (t === 1) {
        const rate = r(10,25), hours = r(3,10);
        return [`Someone earns ${rate}/hour and works ${hours} hours. Total?`, `${rate*hours}`];
      }
      if (t === 2) {
        const total = r(100,500), num = r(2,4), den = r(3,5);
        const filled = Math.round(total * num/den);
        return [`A tank holds ${total} L and is ${num}/${den} full. Litres inside?`, String(filled)];
      }
      if (t === 3) {
        const speed = r(40,120), time = r(2,5);
        return [`A vehicle travels ${speed} km/h for ${time} hours. Distance?`, `${speed*time} km`];
      }
      if (t === 4) {
        const total = r(20,60), num = r(1,3), den = r(4,8);
        const part = Math.round(total * num/den);
        return [`There are ${total} students. ${num}/${den} are boys. How many boys?`, String(part)];
      }
      const pagesPerDay = r(15,40), totalPages = pagesPerDay * r(5,15);
      return [`Someone reads ${pagesPerDay} pages/day. Days to finish ${totalPages} pages?`, String(totalPages/pagesPerDay)];
    }
    default: return ["3:5 = 9:___", "15"];
  }
}

export function generateM10Band(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "alg-one": {
      const x = r(2,20), a = r(2,15);
      const t = Math.floor(rng() * 3);
      if (t === 0) return [`Solve: x + ${a} = ${x+a}`, String(x)];
      if (t === 1) return [`Solve: x - ${a} = ${Math.max(1, x-a)}`, String(x)];
      return [`Solve: ${a}x = ${a*x}`, String(x)];
    }
    case "alg-two": {
      const x = r(2,15), a = r(2,6), b = r(1,8);
      const t = Math.floor(rng() * 2);
      if (t === 0) return [`Solve: ${a}x + ${b} = ${a*x+b}`, String(x)];
      return [`Solve: ${a}x - ${b} = ${a*x-b}`, String(x)];
    }
    case "alg-ineq": {
      const a = r(2,10), b = r(5,30);
      const x = Math.ceil(b/a);
      const t = Math.floor(rng() * 4);
      if (t === 0) return [`Solve: ${a}x < ${a*x + r(1,5)}. Largest integer x?`, String(x)];
      if (t === 1) return [`Solve: x + ${a} > ${b}. Smallest integer x?`, String(b - a + 1)];
      if (t === 2) {
        const a2 = r(2,8), x2 = r(3,15);
        return [`Solve: ${a2}x >= ${a2*x2}. Smallest integer x?`, String(x2)];
      }
      const a3 = r(2,8), x3 = r(2,12);
      return [`Solve: x - ${a3} <= ${x3}. Largest integer x?`, String(x3 + a3)];
    }
    case "alg-word": {
      const items: [string,string][] = [
        ["Sam has 3 times as many cards as Tom. Together they have 48. How many does Sam have?","36"],
        ["A number doubled plus 5 equals 23. What is the number?","9"],
        ["Two consecutive integers sum to 87. What are they?","43 and 44"],
        ["4 less than 3 times a number is 20. The number?","8"],
        ["Maria is 3 years older than twice her sister's age. Sister is 7. Maria's age?","17"],
        ["A number minus 14 is 29. What is the number?","43"],
        ["The sum of two numbers is 50. One is 4 more than the other. The larger?","27"],
      ];
      return items[Math.floor(rng() * items.length)];
    }
    default: return ["Solve: 3x + 2 = 11", "3"];
  }
}

export function generateM11Band(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "lin-slope": {
      const m = r(-5,5) || 1, b = r(-5,5);
      const t = Math.floor(rng() * 3);
      if (t === 0) return [`What is the slope of y = ${m}x + ${b}?`, String(m)];
      if (t === 1) return [`What is the y-intercept of y = ${m}x + ${b}?`, String(b)];
      const x = r(0,5);
      return [`For y = ${m}x + ${b}, find y when x = ${x}.`, String(m*x+b)];
    }
    case "lin-graph": {
      const items: [string,string][] = [
        ["Which equation is a horizontal line: y=5, x=5, y=x, y=2x?","y = 5"],
        ["Which equation is a vertical line: y=3, x=3, y=x+3, y=3x?","x = 3"],
        ["What is the slope of a horizontal line?","0"],
        ["Two parallel lines have the same ___?","slope"],
        ["Find the x-intercept of y = 2x - 6.","3"],
        ["Perpendicular slopes are ___?","Negative reciprocals"],
        ["What does the y-intercept represent?","Where the line crosses the y-axis"],
        ["What is the slope of y = -3x + 7?","-3"],
      ];
      return items[Math.floor(rng() * items.length)];
    }
    case "lin-system": {
      const x = r(1,8), y = r(1,8);
      const a1 = r(1,3), b1 = r(1,3);
      const a2 = r(1,3), b2 = r(1,3);
      return [`Solve: ${a1}x + ${b1}y = ${a1*x+b1*y} and ${a2}x + ${b2}y = ${a2*x+b2*y}. Find x.`, String(x)];
    }
    case "lin-mixed": {
      const m = r(-5,5) || 1, b = r(-5,5), x = r(-3,5);
      return [`If f(x) = ${m}x + ${b}, find f(${x}).`, String(m*x+b)];
    }
    default: return ["What is the slope of y = 2x + 3?", "2"];
  }
}

export function generateM12Band(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "poly-add": {
      const a = r(1,6), b = r(-5,5), c = r(1,6), d = r(-5,5);
      const sc = a+c, sd = b+d;
      const bStr = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
      const dStr = d >= 0 ? `+ ${d}` : `- ${Math.abs(d)}`;
      const ansStr = sd >= 0 ? `${sc}x + ${sd}` : `${sc}x - ${Math.abs(sd)}`;
      return [`Add: (${a}x ${bStr}) + (${c}x ${dStr})`, ansStr];
    }
    case "poly-factor": {
      const av = r(1,8);
      return [`Factor: x² - ${av*av}`, `(x + ${av})(x - ${av})`];
    }
    case "poly-mul": {
      const a = r(1,3), b = r(1,5), c = r(1,3), d = r(1,5);
      const c2 = a*c, c1 = a*d+b*c, c0 = b*d;
      const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
      const c0Str = c0 >= 0 ? `+ ${c0}` : `- ${Math.abs(c0)}`;
      return [`Expand: (${a}x + ${b})(${c}x + ${d})`, `${c2}x² ${c1Str}x ${c0Str}`];
    }
    case "poly-mixed": {
      const gcf = r(2,5), av = r(2,8), bv = r(1,8);
      return [`Factor out the GCF: ${gcf*av}x + ${gcf*bv}`, `${gcf}(${av}x + ${bv})`];
    }
    default: return ["Add: (2x + 3) + (4x + 1)", "6x + 4"];
  }
}

// =============================================================================
// TIER 1 NEW GENERATORS — Fractions complete, Addition regrouping, Subtraction borrowing
// =============================================================================

export function generateFractionsComplete(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);

  switch (bandId) {
    case "frac-identify": {
      const t = Math.floor(rng() * 4);
      if (t === 0) {
        // Dynamic comparison — convert to same denominator
        const d1 = r(2,8), n1 = r(1,d1-1);
        const d2 = r(2,8), n2 = r(1,d2-1);
        const v1 = n1/d1, v2 = n2/d2;
        if (Math.abs(v1-v2) < 0.01) return [`Which is larger: ${n1+1}/${d1} or ${n2}/${d2}?`, `${n1+1}/${d1}`];
        return [`Which is larger: ${n1}/${d1} or ${n2}/${d2}?`, v1 > v2 ? `${n1}/${d1}` : `${n2}/${d2}`];
      }
      if (t === 1) {
        const d = r(2,10), n = r(1,d-1);
        return [`A pizza has ${d} slices. ${n} are eaten. What fraction is left?`, `${d-n}/${d}`];
      }
      if (t === 2) {
        const total = r(6,24), part = r(1,total-1);
        const gcd = (a:number,b:number):number => b===0?a:gcd(b,a%b);
        const g = gcd(part,total);
        return [`Write ${part} out of ${total} as a fraction in simplest form.`, `${part/g}/${total/g}`];
      }
      // Shade/identify
      const d = r(2,8), n = r(1,d-1);
      return [`A shape has ${d} equal parts. ${n} are shaded. Write the fraction.`, `${n}/${d}`];
    }

    case "frac-simplify": {
      const pairs: [number,number][] = [
        [2,4],[3,6],[4,8],[6,9],[4,6],[6,10],[8,12],[9,12],[10,15],[6,8],
        [15,20],[12,16],[4,10],[6,14],[10,12],[8,20],[9,15],[12,18],[15,25],[18,24],
        [20,25],[14,21],[16,24],[25,30],[6,15],[10,25],[12,20],[8,24],[9,27],[6,18],
      ];
      const [n,d] = pairs[Math.floor(rng() * pairs.length)];
      const g = gcd(n, d);
      return [`Simplify ${n}/${d}`, `${n/g}/${d/g}`];
    }

    case "frac-add-same": {
      const d = r(2,12);
      const a = r(1,d-1), b = r(1,d);
      const sum = a + b;
      if (sum >= d) {
        // Improper — show as mixed or improper
        const whole = Math.floor(sum/d), rem = sum % d;
        const ans = rem === 0 ? String(whole) : `${whole} ${rem}/${d}`;
        return [`${a}/${d} + ${b}/${d} =`, ans];
      }
      return [`${a}/${d} + ${b}/${d} =`, `${sum}/${d}`];
    }

    case "frac-add-unlike": {
      // Add/subtract fractions with unlike denominators
      const denoms: [number,number][] = [[2,3],[2,4],[2,5],[3,4],[3,6],[4,5],[4,6],[3,8],[2,6],[5,10],[3,5],[4,8],[2,7],[3,7],[5,6]];
      const [d1,d2] = denoms[Math.floor(rng() * denoms.length)];
      const n1 = r(1,d1-1), n2 = r(1,d2-1);
      const op = rng() > 0.5 ? "+" : "-";
      const l = lcm(d1,d2);
      const newN1 = n1 * (l/d1), newN2 = n2 * (l/d2);
      let resN = op === "+" ? newN1 + newN2 : newN1 - newN2;
      if (resN <= 0) { // avoid negatives for subtraction
        const ansN = newN1 + newN2;
        const g = gcd(ansN, l);
        const simplified = `${ansN/g}/${l/g}`;
        return [`${n1}/${d1} + ${n2}/${d2} =`, simplified];
      }
      const g = gcd(Math.abs(resN), l);
      const simplified = g === l ? String(resN/l) : `${Math.abs(resN)/g}/${l/g}`;
      return [`${n1}/${d1} ${op} ${n2}/${d2} =`, simplified];
    }

    case "frac-multiply": {
      const pairs: [number,number,number,number][] = [
        [1,2,1,3],[1,2,2,3],[2,3,3,4],[1,4,2,3],[3,4,2,5],
        [1,3,3,5],[2,5,1,2],[3,8,4,9],[1,2,4,5],[2,7,7,8],
        [3,4,4,6],[1,5,5,6],[2,3,6,7],[3,5,5,9],[1,6,3,4],
      ];
      const [n1,d1,n2,d2] = pairs[Math.floor(rng() * pairs.length)];
      const resN = n1*n2, resD = d1*d2;
      const g = gcd(resN, resD);
      const ans = g === resD ? String(resN/g) : `${resN/g}/${resD/g}`;
      return [`${n1}/${d1} × ${n2}/${d2} =`, ans];
    }

    case "frac-divide": {
      // Dividing fractions — multiply by reciprocal
      const pairs: [number,number,number,number][] = [
        [1,2,1,4],[2,3,1,3],[3,4,3,8],[1,2,2,3],[3,5,6,10],
        [4,5,2,5],[1,3,1,6],[2,7,4,7],[5,6,5,12],[3,4,9,16],
      ];
      const [n1,d1,n2,d2] = pairs[Math.floor(rng() * pairs.length)];
      // n1/d1 ÷ n2/d2 = n1*d2 / d1*n2
      const resN = n1*d2, resD = d1*n2;
      const g = gcd(resN, resD);
      const ans = g === resD ? String(resN/g) : `${resN/g}/${resD/g}`;
      return [`${n1}/${d1} ÷ ${n2}/${d2} =`, ans];
    }

    case "frac-mixed": {
      const t = Math.floor(rng() * 3);
      if (t === 0) {
        // Convert improper to mixed
        const d = r(2,8), whole = r(1,4), rem = r(1,d-1);
        const n = whole*d + rem;
        return [`Convert to mixed number: ${n}/${d}`, `${whole} ${rem}/${d}`];
      }
      if (t === 1) {
        // Convert mixed to improper
        const d = r(2,8), whole = r(1,4), rem = r(1,d-1);
        const n = whole*d + rem;
        return [`Convert to improper fraction: ${whole} ${rem}/${d}`, `${n}/${d}`];
      }
      // Add mixed numbers
      const d = r(2,6), w1 = r(1,3), n1 = r(1,d-1), w2 = r(1,3), n2 = r(1,d-1);
      const totalN = n1 + n2;
      const extraW = Math.floor(totalN/d);
      const remN = totalN % d;
      const totalW = w1 + w2 + extraW;
      const ans = remN === 0 ? String(totalW) : `${totalW} ${remN}/${d}`;
      return [`${w1} ${n1}/${d} + ${w2} ${n2}/${d} =`, ans];
    }

    default: return ["1/2 + 1/4 =", "3/4"];
  }
}

export function generateAdditionRegrouping(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "add-regroup": {
      // 2-digit + 2-digit WITH regrouping (ones digit sums to 10+)
      let a: number, b: number;
      do {
        a = r(11, 89);
        b = r(11, 89);
      } while ((a % 10) + (b % 10) < 10 || a + b > 99); // ensure carry, no overflow
      return [`${a} + ${b} =`, String(a + b)];
    }
    case "add-3digit": {
      const a = r(100, 899);
      const b = r(100, 999 - a);
      return [`${a} + ${b} =`, String(a + b)];
    }
    default: return ["15 + 17 =", "32"];
  }
}

export function generateSubtractionBorrowing(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "sub-borrow": {
      // 2-digit - 2-digit WITH borrowing (ones of minuend < ones of subtrahend)
      let a: number, b: number;
      do {
        a = r(21, 99);
        b = r(11, a - 1);
      } while ((a % 10) >= (b % 10)); // ensure borrowing needed
      return [`${a} - ${b} =`, String(a - b)];
    }
    case "sub-3digit": {
      const a = r(200, 999);
      const b = r(100, a - 1);
      return [`${a} - ${b} =`, String(a - b)];
    }
    default: return ["42 - 18 =", "24"];
  }
}

// =============================================================================
// TIER 2 NEW GENERATORS — Polynomial trinomial factoring, Decimal mul/div
// =============================================================================

export function generatePolynomialsComplete(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "poly-add": {
      const a = r(1,6), b = r(-5,5), cv = r(1,6), d = r(-5,5);
      const sc = a+cv, sd = b+d;
      const bStr = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
      const dStr = d >= 0 ? `+ ${d}` : `- ${Math.abs(d)}`;
      const sdStr = sd >= 0 ? `+ ${sd}` : `- ${Math.abs(sd)}`;
      const op = rng() > 0.5 ? "add" : "sub";
      if (op === "add") {
        return [`Add: (${a}x ${bStr}) + (${cv}x ${dStr})`, `${sc}x ${sdStr}`];
      } else {
        const sc2 = a-cv, sd2 = b-d;
        const sd2Str = sd2 >= 0 ? `+ ${sd2}` : `- ${Math.abs(sd2)}`;
        return [`Subtract: (${a}x ${bStr}) - (${cv}x ${dStr})`, `${sc2}x ${sd2Str}`];
      }
    }
    case "poly-mul": {
      const a = r(1,3), b = r(1,5), cv = r(1,3), d = r(1,5);
      const c2 = a*cv, c1 = a*d+b*cv, c0 = b*d;
      const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
      const c0Str = c0 >= 0 ? `+ ${c0}` : `- ${Math.abs(c0)}`;
      return [`Expand: (${a}x + ${b})(${cv}x + ${d})`, `${c2}x² ${c1Str}x ${c0Str}`];
    }
    case "poly-factor-dos": {
      // Difference of squares: x² - a² = (x+a)(x-a)
      const av = r(1,9);
      return [`Factor: x² - ${av*av}`, `(x + ${av})(x - ${av})`];
    }
    case "poly-factor-tri": {
      // Trinomials: (x+a)(x+b) = x² + (a+b)x + ab
      // Pick a,b such that they are simple integers
      const a = r(-6,6) || 1;
      const b = r(-6,6) || 2;
      const middle = a + b;
      const last = a * b;
      const midStr = middle > 0 ? `+ ${middle}` : `- ${Math.abs(middle)}`;
      const lastStr = last > 0 ? `+ ${last}` : `- ${Math.abs(last)}`;
      const f1 = a > 0 ? `+ ${a}` : `- ${Math.abs(a)}`;
      const f2 = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
      return [`Factor: x² ${midStr}x ${lastStr}`, `(x ${f1})(x ${f2})`];
    }
    case "poly-mixed": {
      const t = Math.floor(rng() * 3);
      if (t === 0) {
        const gcf = r(2,5), av = r(2,8), bv = r(1,8);
        return [`Factor out the GCF: ${gcf*av}x² + ${gcf*bv}x`, `${gcf}x(${av}x + ${bv})`];
      }
      if (t === 1) {
        const av = r(1,8);
        return [`Factor completely: x² - ${av*av}`, `(x + ${av})(x - ${av})`];
      }
      const a = r(1,5), b = r(1,5);
      const mid = a+b, last = a*b;
      const midStr = mid > 0 ? `+ ${mid}` : `- ${Math.abs(mid)}`;
      const lastStr = last > 0 ? `+ ${last}` : `- ${Math.abs(last)}`;
      return [`Factor: x² ${midStr}x ${lastStr}`, `(x + ${a})(x + ${b})`];
    }
    default: return ["Factor: x² - 9", "(x + 3)(x - 3)"];
  }
}

export function generateDecimalsComplete(bandId: string, rng: () => number, r: (lo: number, hi: number) => number): [string, string] {
  switch (bandId) {
    case "dec-place": {
      const nums = [3.5, 12.4, 0.75, 1.25, 4.08, 10.3, 0.6, 7.15, 25.9, 3.14, 0.08, 5.6, 0.125, 8.04, 100.5];
      const n = nums[Math.floor(rng() * nums.length)];
      const parts = n.toString().split('.');
      const tenths = parts[1]?.[0] ?? '0';
      const hundredths = parts[1]?.[1] ?? '0';
      const t = Math.floor(rng() * 2);
      if (t === 0) return [`In ${n}, what digit is in the tenths place?`, tenths];
      return [`In ${n}, what digit is in the hundredths place?`, hundredths];
    }
    case "dec-add-sub": {
      const a = parseFloat((r(1,99)/10).toFixed(1));
      const b = parseFloat((r(1,99)/10).toFixed(1));
      const op = rng() > 0.5 ? "+" : "-";
      if (op === "+") return [`${a} + ${b} =`, String(parseFloat((a+b).toFixed(2)))];
      const big = Math.max(a,b), small = Math.min(a,b);
      return [`${big} - ${small} =`, String(parseFloat((big-small).toFixed(2)))];
    }
    case "dec-multiply": {
      const t = Math.floor(rng() * 3);
      if (t === 0) {
        const a = parseFloat((r(1,9)/10).toFixed(1));
        const b = r(2,9);
        return [`${a} × ${b} =`, String(parseFloat((a*b).toFixed(2)))];
      }
      if (t === 1) {
        const a = parseFloat((r(1,9)/10).toFixed(1));
        const b = parseFloat((r(1,9)/10).toFixed(1));
        return [`${a} × ${b} =`, String(parseFloat((a*b).toFixed(2)))];
      }
      const a = parseFloat((r(10,99)/100).toFixed(2));
      const b = r(2,9);
      return [`${a} × ${b} =`, String(parseFloat((a*b).toFixed(3)))];  
    }
    case "dec-divide": {
      const t = Math.floor(rng() * 3);
      if (t === 0) {
        // Easy: decimal ÷ whole number with clean answer
        const divisor = r(2,5);
        const answer = parseFloat((r(1,9)/10).toFixed(1));
        const dividend = parseFloat((answer * divisor).toFixed(1));
        return [`${dividend} ÷ ${divisor} =`, String(answer)];
      }
      if (t === 1) {
        const a = parseFloat((r(10,99)/10).toFixed(1));
        const b = r(2,4);
        return [`${a} ÷ ${b} =`, String(parseFloat((a/b).toFixed(2)))];
      }
      // Divide by decimal — multiply both by 10
      const divisor = parseFloat((r(1,9)/10).toFixed(1));
      const answer = r(2,9);
      const dividend = parseFloat((divisor * answer).toFixed(2));
      return [`${dividend} ÷ ${divisor} =`, String(answer)];
    }
    case "dec-pct": {
      const t = Math.floor(rng() * 4);
      if (t === 0) {
        const base = [10,20,25,50,80,100,200][Math.floor(rng()*7)];
        const pct = [10,15,20,25,50,75][Math.floor(rng()*6)];
        return [`What is ${pct}% of ${base}?`, String((base*pct)/100)];
      }
      if (t === 1) {
        // Convert fraction to decimal
        const pairs: [string,string][] = [["1/2","0.5"],["1/4","0.25"],["3/4","0.75"],["1/5","0.2"],["2/5","0.4"],["1/10","0.1"],["3/10","0.3"],["1/8","0.125"],["3/8","0.375"],["5/8","0.625"],["7/8","0.875"],["1/20","0.05"],["3/20","0.15"],["1/25","0.04"],["4/5","0.8"],["3/5","0.6"],["1/100","0.01"],["1/50","0.02"],["9/10","0.9"],["7/10","0.7"],["1/3","0.333"],["2/3","0.667"],["1/6","0.167"],["5/6","0.833"],["1/9","0.111"],["2/9","0.222"],["1/16","0.0625"],["3/16","0.1875"],["5/16","0.3125"],["7/16","0.4375"]];
        const [frac,dec] = pairs[Math.floor(rng()*pairs.length)];
        return [`Convert ${frac} to a decimal`, dec];
      }
      if (t === 2) {
        // Convert decimal to percentage
        const pairs: [string,string][] = [["0.5","50%"],["0.25","25%"],["0.75","75%"],["0.1","10%"],["0.2","20%"],["0.4","40%"],["0.8","80%"],["0.35","35%"],["0.6","60%"],["0.15","15%"],["0.05","5%"],["0.9","90%"],["0.45","45%"],["0.125","12.5%"],["0.3","30%"],["0.7","70%"],["0.55","55%"],["0.65","65%"],["0.95","95%"],["0.02","2%"],["0.04","4%"],["0.12","12%"],["0.16","16%"],["0.32","32%"],["0.48","48%"],["0.64","64%"],["0.85","85%"],["0.99","99%"],["0.01","1%"],["0.22","22%"]];
        const [dec,pct] = pairs[Math.floor(rng()*pairs.length)];
        return [`Convert ${dec} to a percentage`, pct];
      }
      // Percentage increase/decrease
      const base = [50,100,200,80,40][Math.floor(rng()*5)];
      const pct = [10,20,25,50][Math.floor(rng()*4)];
      const inc = rng() > 0.5;
      const result = inc ? base + (base*pct)/100 : base - (base*pct)/100;
      return [`A ${base} item ${inc?"increases":"decreases"} by ${pct}%. New value?`, String(result)];
    }
    default: return ["0.5 + 0.3 =", "0.8"];
  }
}
