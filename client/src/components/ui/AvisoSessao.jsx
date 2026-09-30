import { useEffect } from 'react';
import { Info, X } from 'lucide-react';

/** Quanto tempo o aviso fica na tela antes de sumir sozinho. */
const DURACAO_MS = 6000;

/**
 * Faixa de avisos do servidor de jogo.
 *
 * O contexto ja recebia `sessao:aviso`, `convite:resultado` e
 * `convite:expirado` e guardava o texto em `aviso` — mas nenhuma tela
 * desenhava esse valor. O servidor contava coisas que o jogador precisava
 * saber ("fulano ficou offline, o resultado não contará", "fulano recusou o
 * convite") para um lugar que ninguém lia. Aqui ele aparece.
 *
 * Fica no `AppLayout` de proposito: o aviso e global (a sessao continua
 * valendo mesmo com o jogador em outra aba do app), e uma unica montagem
 * cobre todas as telas, em vez de um bloco repetido em cada `return` do
 * `Partida.jsx`.
 *
 * some sozinho para nao virar uma tarja permanente: quem precisar reler
 * recebe o texto no placar ou no historico.
 */
export default function AvisoSessao({ aviso, aoFechar }) {
  useEffect(() => {
    if (!aviso) return undefined;

    const temporizador = setTimeout(aoFechar, DURACAO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso, aoFechar]);

  if (!aviso) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto mb-3 flex w-full max-w-3xl items-start gap-2.5 rounded-card border border-primary/25 bg-primary-light px-4 py-3"
    >
      <Info size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <p className="flex-1 text-sm text-primary-dark">{aviso}</p>
      <button
        type="button"
        onClick={aoFechar}
        aria-label="Fechar aviso"
        className="-mr-1 -mt-0.5 shrink-0 rounded-field p-1 text-primary-dark transition-colors hover:bg-surface"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
