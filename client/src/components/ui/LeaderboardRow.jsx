import Avatar from './Avatar';

const MEDALHAS = {
  1: { medalha: '🥇', classe: 'bg-accent/25 text-primary-dark' },
  2: { medalha: '🥈', classe: 'bg-background text-secondary' },
  3: { medalha: '🥉', classe: 'bg-accent/25 text-primary' },
};

function percentualDe(acertos, total) {
  if (!total) return null;
  return Math.round((acertos / total) * 100);
}

/**
 * Linha de ranking responsiva: cartao compacto no mobile, sem rolagem
 * horizontal. A pagina tambem usa os mesmos dados numa tabela em desktop.
 */
export default function LeaderboardRow({
  posicao,
  username,
  recorde,
  jogos,
  acertos = 0,
  totalPerguntas = 0,
  souEu = false,
}) {
  const premio = MEDALHAS[posicao];
  const percentual = percentualDe(acertos, totalPerguntas);

  return (
    <li
      className={[
        'flex items-center gap-2.5 rounded-field border px-3 py-3 sm:gap-3 sm:px-4',
        souEu ? 'border-primary/40 bg-primary-light' : 'border-line bg-surface',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold',
          souEu ? 'bg-primary text-white' : premio ? premio.classe : 'bg-background text-secondary',
        ].join(' ')}
      >
        {premio ? premio.medalha : posicao}
      </span>

      <Avatar nome={username} tamanho="sm" />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-primary-dark">
          {username}
          {souEu && <span className="ml-1.5 text-xs font-medium text-primary">(você)</span>}
        </span>
        <span className="block text-xs text-text-muted">
          {jogos > 0 && `${jogos} ${jogos === 1 ? 'jogo' : 'jogos'}`}
          {jogos > 0 && percentual !== null && ' · '}
          {percentual !== null && `${percentual}% de acertos`}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block font-display text-base font-bold text-primary tabular-nums">
          {recorde}
        </span>
        <span className="block text-xs text-text-muted">pontos</span>
      </span>
    </li>
  );
}
