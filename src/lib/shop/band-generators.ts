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
      return [`${big} − ${small} =`, String(parseFloat((big-small).toFixed(2)))];
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
      const items: [string,string][] = [
        ["A shirt costs $35, 20% off. Sale price?","$28"],
        ["Maria earns $15/hour and works 8 hours. Total?","$120"],
        ["A tank holds 200 L and is 3/4 full. Litres inside?","150"],
        ["A rectangle has perimeter 36 cm and width 7 cm. Length?","11 cm"],
        ["There are 24 students, 3/8 are boys. How many boys?","9"],
        ["A train travels 80 km/h for 2.5 hours. Distance?","200 km"],
        ["Sam has 45 stickers and gives 12 away. How many left?","33"],
        ["John reads 25 pages/day. Days to finish 300 pages?","12"],
      ];
      return items[Math.floor(rng() * items.length)];
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
      if (t === 1) return [`Solve: x − ${a} = ${Math.max(1, x-a)}`, String(x)];
      return [`Solve: ${a}x = ${a*x}`, String(x)];
    }
    case "alg-two": {
      const x = r(2,15), a = r(2,6), b = r(1,8);
      const t = Math.floor(rng() * 2);
      if (t === 0) return [`Solve: ${a}x + ${b} = ${a*x+b}`, String(x)];
      return [`Solve: ${a}x − ${b} = ${a*x-b}`, String(x)];
    }
    case "alg-ineq": {
      const a = r(2,10), b = r(5,30);
      const x = Math.ceil(b/a);
      const t = Math.floor(rng() * 2);
      if (t === 0) return [`Solve: ${a}x < ${a*x + r(1,5)}. Largest integer x?`, String(x)];
      return [`Solve: x + ${a} > ${b}. Smallest integer x?`, String(b - a + 1)];
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
        ["Find the x-intercept of y = 2x − 6.","3"],
        ["Perpendicular slopes are ___?","Negative reciprocals"],
        ["What does the y-intercept represent?","Where the line crosses the y-axis"],
        ["What is the slope of y = −3x + 7?","−3"],
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
      const bStr = b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`;
      const dStr = d >= 0 ? `+ ${d}` : `− ${Math.abs(d)}`;
      const ansStr = sd >= 0 ? `${sc}x + ${sd}` : `${sc}x − ${Math.abs(sd)}`;
      return [`Add: (${a}x ${bStr}) + (${c}x ${dStr})`, ansStr];
    }
    case "poly-factor": {
      const av = r(1,8);
      return [`Factor: x² − ${av*av}`, `(x + ${av})(x − ${av})`];
    }
    case "poly-mul": {
      const a = r(1,3), b = r(1,5), c = r(1,3), d = r(1,5);
      const c2 = a*c, c1 = a*d+b*c, c0 = b*d;
      const c1Str = c1 >= 0 ? `+ ${c1}` : `− ${Math.abs(c1)}`;
      const c0Str = c0 >= 0 ? `+ ${c0}` : `− ${Math.abs(c0)}`;
      return [`Expand: (${a}x + ${b})(${c}x + ${d})`, `${c2}x² ${c1Str}x ${c0Str}`];
    }
    case "poly-mixed": {
      const gcf = r(2,5), av = r(2,8), bv = r(1,8);
      return [`Factor out the GCF: ${gcf*av}x + ${gcf*bv}`, `${gcf}(${av}x + ${bv})`];
    }
    default: return ["Add: (2x + 3) + (4x + 1)", "6x + 4"];
  }
}
