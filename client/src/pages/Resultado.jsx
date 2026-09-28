import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Botao from '../components/Botao';
import Card from '../components/Card';
import { useGame } from '../contexts/GameContext';

function estrela(percentual) {
  if (percentual >= 90) return { texto: 'Excelente! Você domina o assunto.', emoji: '🏆' };
  if (percentual >= 70) return { texto: 'Muito bem! Quase lá no topo.', emoji: '⭐' };
  if (percentual >= 50) return { texto: 'Bom resultado. Dá para melhorar!', emoji: '👍' };
  return { texto: 'Continue estudando — a próxima vem melhor.', emoji: '📖' };
}

export default function Resultado() {
  const navigate = useNavigate();
  const { ultimoResultado, salvando, erroSalvar, iniciarPartida, reiniciar } = useGame();

  useEffect(() => {
    if (ultimoResultado) {
      document.title = `Fim de Jogo — ${ultimoResultado.pontos} pts | Adivinhação Bíblica`;
    }
    return () => {
      document.title = 'Adivinhação Bíblica';
    };
  }, [ultimoResultado]);

  if (!ultimoResultado) {
    return <Navigate to="/menu" replace />;
  }

  const { pontos, acertos, total, comboMaximo, bonusTotal, salvo, origem } = ultimoResultado;
  const percentual = total ? Math.round((acertos / total) * 100) : 0;
  const elogio = estrela(percentual);

  function jogarNovamente() {
    reiniciar();
    iniciarPartida();
    navigate('/quiz', { replace: true });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-slide-up text-center">
        <div aria-hidden="true" className="text-5xl">
          {elogio.emoji}
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold text-texto sm:text-4xl">Fim de Jogo</h1>
        <p className="mt-1 text-texto-suave">{elogio.texto}</p>
      </div>

      <Card destaque className="animate-fade-in text-center">
        <p className="text-sm text-texto-suave">Pontuação final</p>
        <p className="font-display text-6xl font-bold text-primaria">{pontos}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/5 py-3">
            <p className="font-display text-xl font-bold text-texto">{acertos}</p>
            <p className="text-xs text-texto-suave">Acertos</p>
          </div>
          <div className="rounded-xl bg-white/5 py-3">
            <p className="font-display text-xl font-bold text-texto">{total}</p>
            <p className="text-xs text-texto-suave">Perguntas</p>
          </div>
          <div className="rounded-xl bg-white/5 py-3">
            <p className="font-display text-xl font-bold text-texto">{percentual}%</p>
            <p className="text-xs text-texto-suave">Aproveito</p>
          </div>
        </div>

        {(comboMaximo > 1 || bonusTotal > 0) && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
            {comboMaximo > 1 && (
              <span className="rounded-full bg-primaria/15 px-3 py-1 text-primaria">
                Melhor combo: {comboMaximo}
              </span>
            )}
            {bonusTotal > 0 && (
              <span className="rounded-full bg-sucesso/15 px-3 py-1 text-sucesso">
                Bônus de combo: +{bonusTotal}
              </span>
            )}
          </div>
        )}

        <p className="mt-4 text-xs text-texto-suave/80">
          {salvando
            ? 'Salvando pontuação...'
            : erroSalvar
              ? erroSalvar
              : salvo
                ? 'Pontuação salva no ranking. 🎉'
                : origem === 'local'
                  ? 'Pontuação calculada localmente.'
                  : 'Pontuação não salva.'}
        </p>
      </Card>

      <div className="flex animate-fade-in flex-col gap-3">
        <Botao tamanho="lg" onClick={jogarNovamente} className="w-full">
          Jogar Novamente
        </Botao>
        <div className="grid grid-cols-2 gap-3">
          <Botao variante="contorno" onClick={() => navigate('/menu')}>
            Menu
          </Botao>
          <Botao variante="contorno" onClick={() => navigate('/ranking')}>
            Ver Ranking
          </Botao>
        </div>
      </div>
    </div>
  );
}
