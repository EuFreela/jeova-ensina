import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../components/Botao';
import Card from '../components/Card';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../contexts/GameContext';
import { buscarPerguntas, salvarPontuacao } from '../services/perguntas';
import { calcularPontuacao, PONTOS_POR_DIFICULDADE } from '../services/scoring';

const TEMPO_POR_QUESTAO = 30;
const ESPERA_FEEDBACK = 1500;

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function Quiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { config, registrarResultado, definirSalvamento, reiniciar } = useGame();

  const [perguntas, setPerguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [tempo, setTempo] = useState(TEMPO_POR_QUESTAO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [origem, setOrigem] = useState(null);

  const travadoRef = useRef(false);
  const timerRef = useRef(null);

  const atual = perguntas[indice];
  const ultimo = indice === perguntas.length - 1;
  const progresso = perguntas.length ? ((indice + (selecionada !== null ? 1 : 0)) / perguntas.length) * 100 : 0;
  const parcial = calcularPontuacao(respostas);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErro('');
      try {
        const { perguntas: lista, origem: fonte } = await buscarPerguntas({
          limite: config.total,
          categoria: config.categoria,
          dificuldade: config.dificuldade,
        });
        if (cancelado) return;
        setOrigem(fonte);
        if (!lista.length) {
          setErro('Nenhuma pergunta encontrada para esse filtro.');
          setPerguntas([]);
        } else {
          setPerguntas(lista);
        }
      } catch {
        if (!cancelado) setErro('Não foi possível carregar as perguntas.');
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [config.total, config.categoria, config.dificuldade, config.partidaId]);

  const encerrarPartida = useCallback(
    async (todasAsRespostas, fonte) => {
      const resultado = calcularPontuacao(todasAsRespostas);
      registrarResultado({ ...resultado, origem: fonte, salvo: false });

      navigate('/resultado', { replace: true });

      if (fonte !== 'api') {
        definirSalvamento({ carregando: false, erro: 'Partida offline: pontuação não salva no ranking.' });
        return;
      }

      definirSalvamento({ carregando: true, erro: null });
      try {
        const payload = todasAsRespostas.map((r) => ({
          perguntaId: r.perguntaId,
          resposta: r.opcaoEscolhida,
        }));
        const { resumo } = await salvarPontuacao(payload);
        registrarResultado({
          ...resultado,
          pontos: resumo.pontuacao,
          bonusTotal: resumo.bonusTotal,
          comboMaximo: resumo.comboMaximo,
          salvo: true,
        });
        definirSalvamento({ carregando: false, erro: null });
      } catch (e) {
        definirSalvamento({ carregando: false, erro: e?.response?.data?.error || 'Não foi possível salvar a pontuação.' });
      }
    },
    [navigate, registrarResultado, definirSalvamento]
  );

  const avancar = useCallback(
    (novaSelecao) => {
      const correta = novaSelecao === atual.resposta_correta;
      const novasRespostas = [
        ...respostas,
        {
          perguntaId: atual.id,
          escolha: novaSelecao,
          opcaoEscolhida: novaSelecao >= 0 ? atual.opcoes[novaSelecao] : null,
          correta,
          dificuldade: atual.dificuldade,
        },
      ];
      setRespostas(novasRespostas);

      if (ultimo) {
        window.setTimeout(() => encerrarPartida(novasRespostas, origem), ESPERA_FEEDBACK);
      } else {
        window.setTimeout(() => {
          setIndice((i) => i + 1);
          setSelecionada(null);
          setTempo(TEMPO_POR_QUESTAO);
        }, ESPERA_FEEDBACK);
      }
    },
    [atual, respostas, ultimo, encerrarPartida, origem]
  );

  useEffect(() => {
    if (selecionada !== null || !atual) return undefined;

    travadoRef.current = false;
    timerRef.current = window.setInterval(() => {
      setTempo((restante) => {
        if (restante <= 1) {
          window.clearInterval(timerRef.current);
          if (!travadoRef.current) {
            travadoRef.current = true;
            window.setTimeout(() => avancar(-1), 0);
          }
          return 0;
        }
        return restante - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, selecionada, atual]);

  function responder(i) {
    if (selecionada !== null || travadoRef.current) return;
    travadoRef.current = true;
    window.clearInterval(timerRef.current);
    setSelecionada(i);
    avancar(i);
  }

  function sairPartida() {
    reiniciar();
    navigate('/menu', { replace: true });
  }

  if (carregando) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3">
        <span className="size-8 animate-spin rounded-full border-3 border-primaria border-t-transparent" />
        <p className="text-texto-suave">Carregando perguntas...</p>
      </div>
    );
  }

  if (erro || !atual) {
    return (
      <Card className="flex flex-col items-center gap-4 text-center">
        <p className="text-texto">{erro || 'Não foi possível iniciar a partida.'}</p>
        <Botao onClick={() => navigate('/menu')}>Voltar ao Menu</Botao>
      </Card>
    );
  }

  const respondida = selecionada !== null;
  const acertou = respondida && selecionada === atual.resposta_correta;
  const esgotouTempo = respondida && selecionada === -1;
  const valorDificuldade = PONTOS_POR_DIFICULDADE[atual.dificuldade] ?? 10;

  function estiloOpcao(i) {
    if (!respondida) return 'border-white/15 bg-white/5 hover:border-primaria/60 hover:bg-white/10';
    if (i === atual.resposta_correta) return 'border-sucesso bg-sucesso/15 text-texto';
    if (i === selecionada) return 'border-erro bg-erro/15 text-texto';
    return 'border-white/10 bg-white/5 opacity-50';
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-[57px] z-10 -mx-4 bg-fundo/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <span className="truncate font-medium text-texto-suave">{user?.username}</span>
          <span className="flex items-center gap-3">
            <span className="font-display font-bold text-primaria">{parcial.pontos} pts</span>
            <span className="text-texto-suave">
              {indice + 1}/{perguntas.length}
            </span>
          </span>
        </div>

        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={Math.round(progresso)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da partida"
        >
          <div
            className="h-full rounded-full bg-primaria transition-all duration-500 ease-out"
            style={{ width: `${progresso}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-texto-suave">
            {respondida
              ? acertou
                ? `+${valorDificuldade} pts${parcial.bonusTotal ? ' (com bônus)' : ''}`
                : 'Sem pontos'
              : `${atual.dificuldade} · vale ${valorDificuldade} pts`}
          </span>
          <span
            className={[
              'font-display font-semibold tabular-nums',
              tempo <= 10 ? 'text-erro animate-pulse-suave' : 'text-texto-suave',
            ].join(' ')}
          >
            {tempo}s
          </span>
        </div>
      </div>

      {parcial.combo >= 2 && !respondida && (
        <p className="animate-pop self-center rounded-full bg-primaria/20 px-4 py-1 text-sm font-semibold text-primaria">
          Combo de {parcial.combo} acertos! {parcial.combo >= 5 ? '+15 bônus' : parcial.combo >= 3 ? '+5 bônus' : ''}
        </p>
      )}

      <Card key={atual.id} className="animate-slide-up flex flex-col gap-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-texto-suave/70">
            {atual.categoria}
            {atual.referencia ? ` · ${atual.referencia}` : ''}
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold leading-snug text-texto sm:text-2xl">
            {atual.pergunta}
          </h2>
        </div>

        <div className="flex flex-col gap-2.5">
          {atual.opcoes.map((opcao, i) => (
            <button
              key={opcao}
              type="button"
              onClick={() => responder(i)}
              disabled={respondida}
              className={[
                'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200',
                estiloOpcao(i),
              ].join(' ')}
            >
              <span
                className={[
                  'grid size-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold',
                  respondida && i === atual.resposta_correta
                    ? 'bg-sucesso text-fundo'
                    : respondida && i === selecionada
                      ? 'bg-erro text-white'
                      : 'bg-white/10 text-texto-suave',
                ].join(' ')}
              >
                {respondida && i === atual.resposta_correta ? '✓' : respondida && i === selecionada ? '✕' : LETRAS[i]}
              </span>
              <span className="text-[15px] leading-snug">{opcao}</span>
            </button>
          ))}
        </div>
      </Card>

      {respondida && (
        <div
          className={[
            'animate-pop rounded-xl border px-4 py-3 text-center text-sm font-medium',
            esgotouTempo
              ? 'border-texto-suave/30 bg-white/5 text-texto-suave'
              : acertou
                ? 'border-sucesso/40 bg-sucesso/10 text-sucesso'
                : 'border-erro/40 bg-erro/10 text-erro',
          ].join(' ')}
        >
          {esgotouTempo
            ? 'Tempo esgotado! A resposta correta é a destacada.'
            : acertou
              ? 'Correto!'
              : `Resposta correta: ${atual.opcoes[atual.resposta_correta]}`}
        </div>
      )}

      <Botao variante="fantasma" onClick={sairPartida} className="self-center text-sm">
        Abandonar partida
      </Botao>
    </div>
  );
}
