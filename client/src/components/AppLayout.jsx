import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from './ui/AppHeader';
import BottomNavigation from './ui/BottomNavigation';
import { ConfirmacaoProvider, useConfirmacao } from '../contexts/ConfirmacaoContext';
import { useGame } from '../contexts/GameContext';

/** Botao de voltar do cabecalho: confirma antes de abandonar uma partida. */
function VoltarInteligente() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { config, reiniciar } = useGame();
  const confirmar = useConfirmacao();

  const aoVoltar = useCallback(async () => {
    const emPartida = pathname === '/quiz' && config.partidaId > 0;

    if (emPartida) {
      const sair = await confirmar({
        titulo: 'Abandonar a partida?',
        descricao: 'Seu progresso nesta partida será perdido e a pontuação não será salva.',
        textoConfirmar: 'Abandonar',
        perigo: true,
      });
      if (!sair) return;
      reiniciar();
      navigate('/inicio', { replace: true });
      return;
    }

    navigate(-1);
  }, [confirmar, config.partidaId, navigate, pathname, reiniciar]);

  return <AppHeader aoVoltar={aoVoltar} />;
}

/**
 * Estrutura das telas autenticadas (layout.md secao 3.1):
 * cabecalho, conteudo em cartoes e navegacao inferior fixa no mobile.
 */
export default function AppLayout({ children }) {
  return (
    <ConfirmacaoProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <VoltarInteligente />

        {/* pb extra reserva o espaco da navegacao inferior no mobile */}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-28 md:pb-10">
          {children}
        </main>

        <BottomNavigation />
      </div>
    </ConfirmacaoProvider>
  );
}
