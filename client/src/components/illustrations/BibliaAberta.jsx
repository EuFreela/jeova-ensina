/**
 * Biblia aberta - icone da marca.
 * Detalhes em azul e dourado, sem cruzes (layout.md secao 2.4).
 */
export default function BibliaAberta({ className = '' }) {
  const linhas = [38, 44.5, 51, 57.5, 64];

  return (
    <svg
      viewBox="0 0 120 94"
      className={className}
      role="img"
      aria-label="Bíblia aberta"
    >
      <defs>
        <linearGradient id="je-capa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E5CA8" />
          <stop offset="100%" stopColor="#12366A" />
        </linearGradient>
        <linearGradient id="je-pagina" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E7EEF8" />
        </linearGradient>
      </defs>

      {/* capas */}
      <path d="M60 26 Q 30 22 7 28 L 7 76 Q 30 70 60 78 Z" fill="url(#je-capa)" />
      <path d="M60 26 Q 90 22 113 28 L 113 76 Q 90 70 60 78 Z" fill="url(#je-capa)" />

      {/* paginas */}
      <path d="M60 30 Q 32 26 12 31 L 12 71 Q 32 66 60 74 Z" fill="url(#je-pagina)" />
      <path d="M60 30 Q 88 26 108 31 L 108 71 Q 88 66 60 74 Z" fill="url(#je-pagina)" />

      {/* linhas de texto */}
      <g fill="none" stroke="#9FB3CC" strokeWidth="1.5" strokeLinecap="round">
        {linhas.map((y, i) => {
          const fim = i === linhas.length - 1 ? 44 : 55;
          return (
            <g key={y}>
              <path d={`M17 ${y} Q 35 ${y - 2.6} ${fim} ${y + 0.6}`} />
              <path d={`M103 ${y} Q 85 ${y - 2.6} ${120 - fim} ${y + 0.6}`} />
            </g>
          );
        })}
      </g>

      {/* lombada */}
      <path
        d="M60 30 L 60 74"
        stroke="#12366A"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* fita dourada */}
      <path d="M56.5 71 L 63.5 71 L 63.5 90 L 60 85 L 56.5 90 Z" fill="#E9B95A" />
    </svg>
  );
}
