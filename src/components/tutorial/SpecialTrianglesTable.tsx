"use client";
// The classic trig memory card: the 30-60-90 and 45-45-90 triangles with their
// exact side lengths, plus the sin/cos/tan table for 30°/45°/60°. This is THE
// thing students must remember (user-provided reference) — every special-angle
// value is read straight off one of these two triangles.
import { MathText } from "@/components/MathText";

const INK = "#1A1612", GOLD = "#C8902A";

function Cell({ tex }: { tex: string }) {
  return <td className="border border-border px-3 py-1.5 text-center"><MathText>{`$${tex}$`}</MathText></td>;
}

export function SpecialTrianglesTable() {
  return (
    <div className="mt-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gold-dark mb-1 text-center">
        🧠 Remember these two triangles — every value comes from them
      </div>
      <div className="flex justify-center gap-2">
        {/* 30-60-90: sides 1, √3, 2 */}
        <svg viewBox="0 0 150 150" className="w-[150px]">
          <polygon points="30,130 120,130 120,20" fill="#fff" stroke={INK} strokeWidth="2" />
          <rect x="108" y="118" width="10" height="10" fill="none" stroke={INK} strokeWidth="1.2" />
          <path d="M 50 130 A 20 20 0 0 0 46 118" fill="none" stroke={GOLD} strokeWidth="1.5" />
          <text x="56" y="124" fontSize="11" fill={GOLD} fontWeight="700">60°</text>
          <path d="M 120 44 A 24 24 0 0 0 103 51" fill="none" stroke={GOLD} strokeWidth="1.5" />
          <text x="98" y="44" fontSize="11" fill={GOLD} fontWeight="700">30°</text>
          <text x="75" y="145" fontSize="11" fill={INK} textAnchor="middle">1 unit</text>
          <text x="128" y="80" fontSize="11" fill={INK}>√3</text>
          <text x="52" y="70" fontSize="11" fill={INK} transform="rotate(-51 52 70)">2 units</text>
        </svg>
        {/* 45-45-90: sides 1, 1, √2 */}
        <svg viewBox="0 0 150 150" className="w-[150px]">
          <polygon points="30,130 130,130 30,30" fill="#fff" stroke={INK} strokeWidth="2" />
          <rect x="32" y="118" width="10" height="10" fill="none" stroke={INK} strokeWidth="1.2" />
          <path d="M 30 54 A 24 24 0 0 1 47 47" fill="none" stroke={GOLD} strokeWidth="1.5" />
          <text x="38" y="62" fontSize="11" fill={GOLD} fontWeight="700">45°</text>
          <path d="M 106 130 A 24 24 0 0 0 113 113" fill="none" stroke={GOLD} strokeWidth="1.5" />
          <text x="92" y="122" fontSize="11" fill={GOLD} fontWeight="700">45°</text>
          <text x="80" y="145" fontSize="11" fill={INK} textAnchor="middle">1 unit</text>
          <text x="14" y="84" fontSize="11" fill={INK}>1</text>
          <text x="88" y="72" fontSize="11" fill={INK} transform="rotate(45 88 72)">√2 units</text>
        </svg>
      </div>
      <table className="mx-auto mt-1 text-sm border-collapse">
        <thead>
          <tr>
            <th className="border border-border px-3 py-1.5 bg-cream-dark" />
            <th className="border border-border px-4 py-1.5 bg-cream-dark font-bold">30°</th>
            <th className="border border-border px-4 py-1.5 bg-cream-dark font-bold">45°</th>
            <th className="border border-border px-4 py-1.5 bg-cream-dark font-bold">60°</th>
          </tr>
        </thead>
        <tbody>
          <tr><th className="border border-border px-3 bg-cream-dark font-bold">sin</th><Cell tex="\frac{1}{2}" /><Cell tex="\frac{1}{\sqrt{2}}" /><Cell tex="\frac{\sqrt{3}}{2}" /></tr>
          <tr><th className="border border-border px-3 bg-cream-dark font-bold">cos</th><Cell tex="\frac{\sqrt{3}}{2}" /><Cell tex="\frac{1}{\sqrt{2}}" /><Cell tex="\frac{1}{2}" /></tr>
          <tr><th className="border border-border px-3 bg-cream-dark font-bold">tan</th><Cell tex="\frac{1}{\sqrt{3}}" /><Cell tex="1" /><Cell tex="\sqrt{3}" /></tr>
        </tbody>
      </table>
    </div>
  );
}
