import { Check, X } from 'lucide-react';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Alternativa de resposta com os estados descritos no docs/layout.md secao 7:
 * padrao, selecionada, correta e incorreta. Acorre e erro nunca sao
 * comunicados apenas por cor: sempre ha icone e texto.
 */
export default function AnswerOption({
  indice,
  texto,
  estado = 'padrao', // padrao | selecionada | correta | incorreta | esmaecida
  onSelecionar,
  desabilitada = false,
}) {
  const rotuloEstado = {
    correta: 'Resposta correta',
    incorreta: 'Sua resposta, incorreta',
  }[estado];

  const estilos = {
    padrao: 'border-line bg-surface hover:border-primary hover:bg-primary-light',
    selecionada: 'border-primary bg-primary-light',
    correta: 'border-success bg-success-light',
    incorreta: 'border-error bg-error-light',
    esmaecida: 'border-line bg-surface opacity-60',
  }[estado];

  const estilosMarcador = {
    correta: 'bg-success text-white',
    incorreta: 'bg-error text-white',
    selecionada: 'bg-primary text-white',
  }[estado];

  return (
    <button
      type="button"
      onClick={onSelecionar}
      disabled={desabilitada}
      aria-pressed={estado === 'selecionada'}
      className={[
        'flex w-full items-center gap-3 rounded-field border-2 px-4 py-3.5 text-left',
        'transition-all duration-200',
        'disabled:cursor-default',
        estilos,
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'grid size-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold',
          estilosMarcador || 'bg-background text-secondary',
        ].join(' ')}
      >
        {estado === 'correta' ? (
          <Check size={18} strokeWidth={3} />
        ) : estado === 'incorreta' ? (
          <X size={18} strokeWidth={3} />
        ) : (
          LETRAS[indice] || '?'
        )}
      </span>

      <span className="flex-1 text-[15px] leading-snug text-text">{texto}</span>

      {rotuloEstado && <span className="sr-only"> - {rotuloEstado}</span>}
    </button>
  );
}
