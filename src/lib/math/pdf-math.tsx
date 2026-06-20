// src/lib/math/pdf-math.tsx
// Math rendering for @react-pdf/renderer.
// Renders fractions, limits, integrals, derivatives, exponents, roots
// using react-pdf primitives since react-pdf cannot render HTML/KaTeX.

import React from "react";
import { Text, View } from "@react-pdf/renderer";

// ── Primitive math renderers ──────────────────────────────────────────────────

// Stacked fraction: numerator over denominator with a line
function PdfFraction({ num, den, fs = 9 }: { num: string; den: string; fs?: number }) {
  const small = Math.max(6, fs - 2);
  return (
    <View style={{ flexDirection: "column", alignItems: "center", marginHorizontal: 2 }}>
      <Text style={{ fontSize: small, fontFamily: "BodySans-Bold", borderBottomWidth: 0.5, borderBottomColor: "#000", paddingHorizontal: 2, lineHeight: 1.1 }}>{num}</Text>
      <Text style={{ fontSize: small, fontFamily: "BodySans-Bold", paddingHorizontal: 2, lineHeight: 1.1 }}>{den}</Text>
    </View>
  );
}

// Limit: lim with subscript
function PdfLimit({ sub, fs = 9 }: { sub: string; fs?: number }) {
  const small = Math.max(6, fs - 3);
  return (
    <View style={{ flexDirection: "column", marginHorizontal: 1 }}>
      <Text style={{ fontSize: fs, fontFamily: "BodySans-Bold", lineHeight: 1 }}>lim</Text>
      <Text style={{ fontSize: small, fontFamily: "BodySans", lineHeight: 1, color: "#333" }}>{sub}</Text>
    </View>
  );
}

// Integral sign with optional bounds
function PdfIntegral({ lower, upper, fs = 9 }: { lower?: string; upper?: string; fs?: number }) {
  const small = Math.max(5, fs - 3);
  return (
    <View style={{ flexDirection: "column", alignItems: "center", marginHorizontal: 1 }}>
      {upper && <Text style={{ fontSize: small, fontFamily: "BodySans", lineHeight: 1 }}>{upper}</Text>}
      <Text style={{ fontSize: fs + 4, fontFamily: "BodySans", lineHeight: 0.8 }}>∫</Text>
      {lower && <Text style={{ fontSize: small, fontFamily: "BodySans", lineHeight: 1 }}>{lower}</Text>}
    </View>
  );
}

// Superscript exponent
function PdfSuperscript({ base, exp, fs = 9 }: { base: string; exp: string; fs?: number }) {
  const small = Math.max(5, fs - 3);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginHorizontal: 1 }}>
      <Text style={{ fontSize: fs, fontFamily: "BodySans-Bold" }}>{base}</Text>
      <Text style={{ fontSize: small, fontFamily: "BodySans-Bold", marginTop: 1 }}>{exp}</Text>
    </View>
  );
}

// Square root
function PdfSqrt({ radicand, fs = 9 }: { radicand: string; fs?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 1 }}>
      <Text style={{ fontSize: fs, fontFamily: "BodySans" }}>√</Text>
      <View style={{ borderTopWidth: 0.5, borderTopColor: "#000", paddingHorizontal: 1 }}>
        <Text style={{ fontSize: fs, fontFamily: "BodySans-Bold" }}>{radicand}</Text>
      </View>
    </View>
  );
}

// ── Token parser ──────────────────────────────────────────────────────────────

type Token =
  | { type: "text"; content: string }
  | { type: "frac"; num: string; den: string }
  | { type: "limit"; sub: string }
  | { type: "integral"; lower?: string; upper?: string }
  | { type: "superscript"; base: string; exp: string }
  | { type: "sqrt"; radicand: string };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];

  // Normalise common plain-text math patterns to LaTeX-like markers
  // First strip $...$ delimiters — they're for browser KaTeX, not needed here
  let t = text.replace(/\$([^$]+?)\$/g, '$1');
  t = t.replace(/\$\$([^$]+?)\$\$/g, '$1');

  // lim(x→0), lim(x→∞), lim_{x→0} → «LIM:x→0»
  t = t.replace(/lim\s*[\(_]\s*(x\s*(?:→|->)\s*[^)\s,]+)\s*[)\s]/gi, (_, sub) => ` «LIM:${sub.trim()}» `);

  // \lim_{...} → «LIM:...»
  t = t.replace(/\\lim_\{([^}]+)\}/g, (_, sub) => ` «LIM:${sub}» `);

  // ∫ with bounds [a to b] → «INT:a:b»
  t = t.replace(/∫\s*\[([^\]]*)\s*to\s*([^\]]*)\]/gi, (_, lo, hi) => ` «INT:${lo.trim()}:${hi.trim()}» `);
  // ∫ alone → «INT»
  t = t.replace(/∫/g, ' «INT» ');

  // \frac{n}{d} → «FRAC:n|d»
  t = t.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_, n, d) => ` «FRAC:${n}|${d}» `);

  // Simple n/d (digits only) → «FRAC:n|d»
  t = t.replace(/\b(\d+)\/(\d+)\b/g, (_, n, d) => ` «FRAC:${n}|${d}» `);

  // \sqrt{x} or √{x} → «SQRT:x»
  t = t.replace(/\\?√\{([^}]+)\}/g, (_, r) => ` «SQRT:${r}» `);
  // √n (number) → «SQRT:n»
  t = t.replace(/√(\d+)/g, (_, n) => ` «SQRT:${n}» `);

  // Exponents: x^{2} or x^2 where base is a letter/digit → «SUP:x|2»
  t = t.replace(/([a-zA-Z0-9])\^\{([^}]+)\}/g, (_, base, exp) => ` «SUP:${base}|${exp}» `);
  t = t.replace(/([a-zA-Z0-9])\^(\d+)/g, (_, base, exp) => ` «SUP:${base}|${exp}» `);

  // Split on markers
  const parts = t.split(/(«[^»]+»)/);

  parts.forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('«FRAC:')) {
      const [num, den] = trimmed.slice(6, -1).split('|');
      tokens.push({ type: 'frac', num: num.trim(), den: den.trim() });
    } else if (trimmed.startsWith('«LIM:')) {
      tokens.push({ type: 'limit', sub: trimmed.slice(5, -1) });
    } else if (trimmed.startsWith('«INT:')) {
      const bounds = trimmed.slice(5, -1).split(':');
      tokens.push({ type: 'integral', lower: bounds[0], upper: bounds[1] });
    } else if (trimmed === '«INT»') {
      tokens.push({ type: 'integral' });
    } else if (trimmed.startsWith('«SQRT:')) {
      tokens.push({ type: 'sqrt', radicand: trimmed.slice(6, -1) });
    } else if (trimmed.startsWith('«SUP:')) {
      const [base, exp] = trimmed.slice(5, -1).split('|');
      tokens.push({ type: 'superscript', base, exp });
    } else {
      tokens.push({ type: 'text', content: part }); // preserve original spacing
    }
  });

  return tokens;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PdfMathText({ text, fontSize = 10 }: { text: string; fontSize?: number }) {
  const tokens = tokenize(text);

  // If only one text token — simple render
  if (tokens.length === 1 && tokens[0].type === 'text') {
    return <Text style={{ fontSize, fontFamily: "BodySans-Bold" }}>{(tokens[0] as any).content}</Text>;
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
      {tokens.map((tok, i) => {
        switch (tok.type) {
          case 'text': {
            // react-pdf drops a Text's leading/trailing whitespace inside a flex
            // row, so a word sandwiched between math elements (e.g. "1/3 or 2/8")
            // would lose its spacing and hug the left operand. We restore spacing
            // EXPLICITLY: operators get a symmetric margin, and any other word
            // gets a margin on whichever side the source had a space — so "or"
            // sits evenly centered between the two fractions.
            const trimmed = tok.content.trim();
            if (!trimmed) return null;
            if (/^[+\-×÷=]$/.test(trimmed)) {
              return (
                <Text key={i} style={{ fontSize, fontFamily: "BodySans-Bold", marginHorizontal: 4 }}>
                  {trimmed}
                </Text>
              );
            }
            const ml = /^\s/.test(tok.content) ? fontSize * 0.28 : 0;
            const mr = /\s$/.test(tok.content) ? fontSize * 0.28 : 0;
            return (
              <Text key={i} style={{ fontSize, fontFamily: "BodySans-Bold", marginLeft: ml, marginRight: mr }}>
                {trimmed}
              </Text>
            );
          }
          case 'frac':
            return <PdfFraction key={i} num={tok.num} den={tok.den} fs={fontSize} />;
          case 'limit':
            return <PdfLimit key={i} sub={tok.sub} fs={fontSize} />;
          case 'integral':
            return <PdfIntegral key={i} lower={tok.lower} upper={tok.upper} fs={fontSize} />;
          case 'superscript':
            return <PdfSuperscript key={i} base={tok.base} exp={tok.exp} fs={fontSize} />;
          case 'sqrt':
            return <PdfSqrt key={i} radicand={tok.radicand} fs={fontSize} />;
          default:
            return null;
        }
      })}
    </View>
  );
}
