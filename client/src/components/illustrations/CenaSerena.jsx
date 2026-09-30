const ONDAS = [
  { y: 646, x: 40, largura: 300 },
  { y: 646, x: 820, largura: 260 },
  { y: 676, x: 300, largura: 380 },
  { y: 676, x: 860, largura: 220 },
  { y: 712, x: 60, largura: 240 },
  { y: 712, x: 700, largura: 400 },
  { y: 752, x: 260, largura: 300 },
  { y: 752, x: 940, largura: 200 },
];

const AVE1 = 'M392 176 q 13 -11 26 0 q 13 -11 26 0';
const AVE2 = 'M470 132 q 10 -8 20 0 q 10 -8 20 0';
const AVE3 = 'M300 118 q 8 -7 16 0 q 8 -7 16 0';

/**
 * Paisagem serena ao amanhecer: montanhas, agua, vegetacao e aves.
 * Decorativa: sem texto alternativo obrigatorio (docs/layout.md secao 14).
 */
export default function CenaSerena({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="je-ceu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFE1F6" />
          <stop offset="36%" stopColor="#E7EEF9" />
          <stop offset="64%" stopColor="#F6E3C2" />
          <stop offset="100%" stopColor="#F7CE94" />
        </linearGradient>
        <radialGradient id="je-brilho" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFD98A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFD98A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="je-agua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E7C58C" />
          <stop offset="24%" stopColor="#A9C8E6" />
          <stop offset="100%" stopColor="#3F79BB" />
        </linearGradient>
        <linearGradient id="je-mont-leve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8FB2D9" />
          <stop offset="100%" stopColor="#7BA0CD" />
        </linearGradient>
        <linearGradient id="je-mont-forte" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3F6FA8" />
          <stop offset="100%" stopColor="#2C568A" />
        </linearGradient>
        <linearGradient id="je-folha" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F5C3A" />
          <stop offset="100%" stopColor="#123324" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#je-ceu)" />

      <circle cx="640" cy="392" r="215" fill="url(#je-brilho)" />
      <circle cx="640" cy="392" r="62" fill="#F2C46B" />

      <g
        fill="none"
        stroke="#12366A"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      >
        <path d={AVE1} />
        <path d={AVE2} />
        <path d={AVE3} />
      </g>

      <path
        d="M0 500 L170 372 L296 452 L430 344 L566 456 L706 384 L846 468 L988 358 L1200 486 L1200 620 L0 620 Z"
        fill="url(#je-mont-leve)"
      />
      <path
        d="M0 560 L146 452 L282 522 L424 428 L566 540 L708 466 L862 548 L1014 444 L1200 534 L1200 660 L0 660 Z"
        fill="url(#je-mont-forte)"
      />

      <rect y="620" width="1200" height="180" fill="url(#je-agua)" />
      <path d="M598 620 L682 620 L742 800 L538 800 Z" fill="#F5D79A" opacity="0.32" />

      <g
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.4"
      >
        {ONDAS.map(({ y, x, largura }) => (
          <path key={`${y}-${x}`} d={`M${x} ${y} h ${largura}`} />
        ))}
      </g>

      <g fill="url(#je-folha)">
        <g>
          <path d="M0 800 C 60 716, 152 686, 246 698 C 202 760, 100 792, 0 800 Z" />
          <path d="M0 800 C 38 748, 110 700, 192 672 C 172 732, 90 782, 0 800 Z" />
          <path d="M0 800 C 96 762, 196 758, 288 782 C 198 800, 96 802, 0 800 Z" />
        </g>
        <g transform="translate(1200 0) scale(-1 1)">
          <path d="M0 800 C 60 716, 152 686, 246 698 C 202 760, 100 792, 0 800 Z" />
          <path d="M0 800 C 38 748, 110 700, 192 672 C 172 732, 90 782, 0 800 Z" />
          <path d="M0 800 C 96 762, 196 758, 288 782 C 198 800, 96 802, 0 800 Z" />
        </g>
      </g>
    </svg>
  );
}
