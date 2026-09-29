import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

export default function ConfirmDialog({
  aberto,
  titulo = 'Confirmar ação',
  descricao,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  perigo = false,
  onConfirmar,
  onCancelar,
}) {
  const botaoConfirmarRef = useRef(null);
  const botaoAnteriorRef = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;

    botaoAnteriorRef.current = document.activeElement;
    botaoConfirmarRef.current?.focus();

    function aoTeclar(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancelar?.();
      }
    }

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      botaoAnteriorRef.current?.focus?.();
    };
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        aria-hidden="true"
        onClick={onCancelar}
        className="absolute inset-0 animate-fade-in bg-primary-dark/45 backdrop-blur-[2px]"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-titulo"
        aria-describedby="confirm-dialog-descricao"
        className="relative w-full max-w-sm animate-slide-up rounded-card bg-surface p-6 shadow-raised"
      >
        <span
          aria-hidden="true"
          className={`grid size-11 place-items-center rounded-full ${perigo ? 'bg-error-light text-error' : 'bg-primary-light text-primary'}`}
        >
          <AlertTriangle size={22} />
        </span>

        <h2 id="confirm-dialog-titulo" className="mt-4 text-lg font-semibold">
          {titulo}
        </h2>
        {descricao && (
          <p id="confirm-dialog-descricao" className="mt-2 text-sm leading-relaxed text-secondary">
            {descricao}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <SecondaryButton variante="neutro" onClick={onCancelar} larguraTotal className="sm:w-auto">
            {textoCancelar}
          </SecondaryButton>
          <PrimaryButton
            ref={botaoConfirmarRef}
            variante={perigo ? 'perigo' : 'primaria'}
            onClick={onConfirmar}
            larguraTotal
            className="sm:w-auto"
          >
            {textoConfirmar}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
