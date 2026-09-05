// Ilustratie SVG: bebelus + bol cu mancare (stil flat, paleta emerald/crem)
export default function HeroArt() {
  return (
    <svg viewBox="0 0 320 240" role="img" aria-label="Bebeluș" style={{ width: '100%', maxWidth: 340, height: 'auto' }}>
      <ellipse cx="160" cy="216" rx="110" ry="14" fill="#ffffff" opacity="0.25" />
      {/* bol */}
      <path d="M70 150 h120 l-14 44 a14 14 0 0 1 -13 10 H97 a14 14 0 0 1 -13 -10 z" fill="#ffffff" opacity="0.95" />
      <ellipse cx="130" cy="150" rx="60" ry="14" fill="#d1fae5" />
      <ellipse cx="130" cy="150" rx="46" ry="10" fill="#6ea28b" />
      <circle cx="112" cy="149" r="5" fill="#f59e0b" />
      <circle cx="130" cy="151" r="5" fill="#ef4444" />
      <circle cx="148" cy="149" r="5" fill="#fbbf24" />
      {/* lingura */}
      <rect x="205" y="96" width="10" height="52" rx="5" fill="#ffffff" opacity="0.9" transform="rotate(24 210 122)" />
      <ellipse cx="222" cy="94" rx="12" ry="9" fill="#ffffff" opacity="0.9" transform="rotate(24 222 94)" />
      {/* cap bebelus */}
      <circle cx="228" cy="150" r="44" fill="#ffe3c2" />
      <path d="M188 138 a44 44 0 0 1 80 0 l0 -14 a44 30 0 0 0 -80 0 z" fill="#5b3a24" />
      <circle cx="213" cy="152" r="5" fill="#1e2f2b" />
      <circle cx="243" cy="152" r="5" fill="#1e2f2b" />
      <circle cx="205" cy="164" r="6" fill="#f5a3a3" opacity="0.8" />
      <circle cx="251" cy="164" r="6" fill="#f5a3a3" opacity="0.8" />
      <path d="M220 172 q8 8 16 0" stroke="#a16207" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* biberon */}
      <rect x="52" y="96" width="26" height="48" rx="8" fill="#ffffff" opacity="0.9" />
      <rect x="52" y="112" width="26" height="14" fill="#6ea28b" opacity="0.7" />
      <rect x="58" y="84" width="14" height="14" rx="4" fill="#ffffff" opacity="0.9" />
      {/* morcov */}
      <path d="M262 96 l26 -22 4 8 -26 22 z" fill="#f59e0b" />
      <path d="M288 74 l10 -10 2 6 -8 8 z" fill="#3f7e6b" />
      <path d="M284 76 l12 -6 1 6 -10 5 z" fill="#3f7e6b" />
      {/* stele decorative */}
      <circle cx="40" cy="60" r="4" fill="#ffffff" opacity="0.7" />
      <circle cx="292" cy="180" r="5" fill="#ffffff" opacity="0.6" />
      <circle cx="270" cy="52" r="3" fill="#fbbf24" opacity="0.9" />
    </svg>
  );
}
