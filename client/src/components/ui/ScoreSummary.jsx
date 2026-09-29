const ESTADOS = [
  { chave: 'acertos', rotulo: 'Acertos', cor: 'text-success' },
  { chave: 'erros', rotulo: 'Erros', cor: 'text-error' },
  { chave: 'percentual', rotulo: 'Aproveito', cor: 'text-primary' },
];

export default function ScoreSummary({
  pontuacao = 0,
  acertos = 0,
  erros = 0,
  percentual = 0,
  className = '',
}) {
  const valores = { acertos, erros, percentual: `${percentual}%` };

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-text-muted">Pontuação total</span>
        <span className="font-display text-5xl font-bold text-primary tabular-nums">
          {pontuacao}
        </span>
        <span className="text-xs font-medium text-text-muted">pontos</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-5">
        {ESTADOS.map(({ chave, rotulo, cor }) => (
          <div key={chave} className="flex flex-col items-center gap-0.5 text-center">
            <span className={`font-display text-xl font-bold tabular-nums ${cor}`}>
              {valores[chave]}
            </span>
            <span className="text-xs text-text-muted">{rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
