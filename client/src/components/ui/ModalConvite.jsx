import { useEffect, useRef } from 'react';
import { Gamepad2 } from 'lucide-react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

/**
 * Convite de um anfitriao para entrar na sessao.
 * Aparece em qualquer tela: o jogador pode estar no inicio quando recebe.
 * So depois do "Aceitar" ele entra no elenco e vai para a partida.
 */
export default function ModalConvite({ convite, carregando, onAceitar, onRecusar }) {
  const botaoAceitarRef = useRef(null);
  const botaoAnteriorRef = useRef(null);

  useEffect(() => {
    if (!convite) return undefined;

    botaoAnteriorRef.current = document.activeElement;
    botaoAceitarRef.current?.focus();

    function aoTeclar(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onRecusar?.();
      }
    }

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      botaoAnteriorRef.current?.focus?.();
    };
  }, [convite, onRecusar]);

  if (!convite) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-primary-dark/45 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="convite-titulo"
        aria-describedby="convite-descricao"
        className="relative w-full max-w-sm animate-slide-up rounded-card bg-surface p-6 shadow-raised"
      >
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-full bg-primary-light text-primary"
        >
          <Gamepad2 size={22} />
        </span>

        <h2 id="convite-titulo" className="mt-4 text-lg font-semibold">
          {convite.deQuem} convidou você
        </h2>
        <p id="convite-descricao" className="mt-2 text-sm leading-relaxed text-secondary">
          Você entra agora na partida de {convite.deQuem}
          {convite.total ? `, com ${convite.total} perguntas.` : '.'} Ao aceitar, o jogo
          começa com o time montado.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <SecondaryButton
            variante="neutro"
            onClick={onRecusar}
            desabilitado={carregando}
            larguraTotal
            className="sm:w-auto"
          >
            Recusar
          </SecondaryButton>
          <PrimaryButton
            ref={botaoAceitarRef}
            onClick={onAceitar}
            carregando={carregando}
            larguraTotal
            className="sm:w-auto"
          >
            Aceitar e entrar
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
