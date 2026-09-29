import { ChevronRight } from 'lucide-react';

export default function CategoryCard({
  titulo,
  descricao,
  miniatura,
  selecionada = false,
  desabilitada = false,
  vazia = false,
  onSelecionar,
}) {
  return (
    <button
      type="button"
      onClick={onSelecionar}
      disabled={desabilitada}
      aria-pressed={selecionada}
      className={[
        'flex w-full items-center gap-4 rounded-card border-2 p-4 text-left',
        'transition-all duration-200 disabled:cursor-not-allowed',
        selecionada
          ? 'border-primary bg-primary-light shadow-raised'
          : 'border-line bg-surface hover:border-primary/40 hover:shadow-raised',
        desabilitada ? 'opacity-60' : '',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-field bg-primary-light"
      >
        {miniatura}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-semibold text-primary-dark">
          {titulo}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-text-muted">
          {descricao}
        </span>
        {vazia && (
          <span className="mt-1.5 inline-block rounded-full bg-background px-2 py-0.5 text-xs font-medium text-text-muted">
            Sem perguntas disponíveis
          </span>
        )}
      </span>

      <ChevronRight
        aria-hidden="true"
        size={20}
        className={selecionada ? 'shrink-0 text-primary' : 'shrink-0 text-text-muted'}
      />
    </button>
  );
}
