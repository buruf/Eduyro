// src/components/marketing/Emma.tsx
// "Emma" — Eduyro's friendly illustrated learner. Flat-vector, ~4 palette colors,
// lineless with a single soft shadow tone. Drawn once, reused in 3 spots (hero,
// how-it-works, final CTA). NOT a photo of a real child — an original SVG mascot.
// Palette: skin #F6C9A6 / hair-gold #C8902A / top brand-green #2D6A3F /
// skirt brand-blue #1B4F8A / accents cream + brand-red.

export function Emma({ size = 260, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 220 300" width={size} height={size * (300 / 220)} className={className}
      role="img" aria-label="Emma, a young Eduyro learner holding a worksheet and pencil">
      {/* back leg + shoes */}
      <rect x="92" y="222" width="16" height="48" rx="8" fill="#E7B892" />
      <rect x="112" y="222" width="16" height="48" rx="8" fill="#F6C9A6" />
      <rect x="86" y="262" width="26" height="16" rx="7" fill="#C23B22" />
      <rect x="108" y="262" width="26" height="16" rx="7" fill="#C23B22" />
      {/* skirt */}
      <path d="M78 176 h64 l16 56 q-48 16 -96 0 Z" fill="#1B4F8A" />
      {/* body / top */}
      <path d="M84 128 q26 -12 52 0 l8 54 q-34 12 -68 0 Z" fill="#2D6A3F" />
      {/* left arm holding worksheet */}
      <rect x="70" y="140" width="15" height="46" rx="7.5" fill="#F6C9A6" transform="rotate(18 77 163)" />
      {/* worksheet in hand (tilted) */}
      <g transform="rotate(-8 58 150)">
        <rect x="30" y="120" width="52" height="66" rx="5" fill="#FFFFFF" stroke="#E8E0D0" strokeWidth="2" />
        <rect x="38" y="132" width="36" height="4" rx="2" fill="#C8902A" />
        <rect x="38" y="144" width="30" height="3" rx="1.5" fill="#D9CFBB" />
        <rect x="38" y="153" width="34" height="3" rx="1.5" fill="#D9CFBB" />
        <rect x="38" y="162" width="26" height="3" rx="1.5" fill="#D9CFBB" />
        <path d="M40 173 l5 5 l9 -11" fill="none" stroke="#2D6A3F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* right arm raised with pencil */}
      <rect x="136" y="132" width="15" height="44" rx="7.5" fill="#F6C9A6" transform="rotate(-22 143 154)" />
      <g transform="rotate(28 162 118)">
        <rect x="156" y="86" width="9" height="40" rx="2" fill="#C8902A" />
        <rect x="156" y="86" width="9" height="8" fill="#F0D9A0" />
        <path d="M156 126 h9 l-4.5 9 Z" fill="#E7B892" />
        <path d="M158 132 h5 l-2.5 5 Z" fill="#1A1612" />
      </g>
      {/* neck */}
      <rect x="102" y="112" width="16" height="20" rx="7" fill="#E7B892" />
      {/* head */}
      <circle cx="110" cy="88" r="38" fill="#F6C9A6" />
      {/* hair back + top */}
      <path d="M72 92 q-4 -52 38 -54 q42 2 38 54 q-10 -20 -38 -20 q-28 0 -38 20 Z" fill="#C8902A" />
      {/* pigtails */}
      <circle cx="70" cy="86" r="13" fill="#B57F1F" />
      <circle cx="150" cy="86" r="13" fill="#B57F1F" />
      {/* bow */}
      <path d="M150 70 l12 -7 v14 Z" fill="#C23B22" />
      <path d="M150 70 l-12 -7 v14 Z" fill="#C23B22" />
      <circle cx="150" cy="70" r="4" fill="#9E2E1A" />
      {/* face */}
      <circle cx="98" cy="88" r="3.4" fill="#1A1612" />
      <circle cx="122" cy="88" r="3.4" fill="#1A1612" />
      <circle cx="92" cy="98" r="5" fill="#F3A98C" opacity="0.55" />
      <circle cx="128" cy="98" r="5" fill="#F3A98C" opacity="0.55" />
      <path d="M100 104 q10 9 20 0" fill="none" stroke="#1A1612" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Hero composition: Emma on a soft halo with a few floating school motifs.
export function HeroEmma() {
  return (
    <div className="relative flex items-end justify-center w-full">
      {/* soft halo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] rounded-full bg-gold/10" />
      </div>
      {/* floating motifs */}
      <span className="absolute top-6 left-6 text-2xl font-serif font-bold text-brand-blue/70 -rotate-12 select-none">7</span>
      <span className="absolute top-16 right-8 text-3xl text-gold/80 rotate-12 select-none">★</span>
      <span className="absolute bottom-24 right-2 text-2xl font-serif font-bold text-brand-green/70 rotate-6 select-none">×</span>
      <span className="absolute bottom-10 left-2 text-xl font-serif font-bold text-brand-red/60 -rotate-6 select-none">+</span>
      <Emma size={280} className="relative z-10 drop-shadow-sm" />
    </div>
  );
}

// Small waist-up Emma for secondary placements (how-it-works / final CTA).
export function EmmaMini({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <div className={className} style={{ overflow: "hidden", width: size, height: size }}>
      <Emma size={size * 2.1} />
    </div>
  );
}
