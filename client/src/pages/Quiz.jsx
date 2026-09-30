import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, CircleCheck, CircleX, Clock, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../contexts/GameContext';
import { useConfirmacao } from '../contexts/ConfirmacaoContext';
import { buscarPerguntas } from '../services/perguntas';
import { salvarPontuacao } from '../services/pontuacoes';
import { calcularPontuacao, PONTOS_POR_DIFICULDADE } from '../services/scoring';
import AnswerOption from '../components/ui/AnswerOption';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';

const ESPERA_LEITURA = 2000;

function Vidas({ atuais, total }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${atuais} de ${total} vidas`}>
      {Array.from({ length: total }, (_, i) => (
        <Heart
          key={i}
          size={15}
          aria-hidden="true"
          className={i < atuais ? 'text-error' : 'text-line'}
          fill={i < atuais ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

export default function Quiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { config, registrarResultado, definirSalvamento, reiniciar } = useGame();
  const confirmar = useConfirmacao();

  const [perguntas, setPerguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [vidas, setVidas] = useState(config.vidas);
  const [tempo, setTempo] = useState(config.tempoPorQuestao);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [origem, setOrigem] = useState(null);

  const travadoRef = useRef(false);
  const timerRef = useRef(null);
  const responderRef = useRef(null);
  const encerrandoRef = useRef(false);

  const atual = perguntas[indice];
  const ultimo = indice === perguntas.length - 1;
  const relogioAtivo = config.tempoPorQuestao > 0;
  const respondida = selecionada !== null;
  const acabouVidas = vidas <= 0;

  const parcial = calcularPontuacao(respostas);
  const progresso = perguntas.length
    ? ((indice + (respondida ? 1 : 0)) / perguntas.length) * 100
    : 0;

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
        setPerguntas(lista);
        if (!lista.length) setErro('Nenhuma pergunta encontrada para esse filtro.');
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
      if (encerrandoRef.current) return;
      encerrandoRef.current = true;

      const resultado = calcularPontuacao(todasAsRespostas);
      const motivo = vidas <= 0 ? 'vidas' : 'completa';
      // Guarda as respostas para permitir reenviar a pontuacao sem perder o resultado.
      const base = {
        ...resultado,
        origem: fonte,
        salvo: false,
        motivo,
        respostas: todasAsRespostas,
      };
      registrarResultado(base);
      navigate('/resultado', { replace: true });

      if (fonte !== 'api') {
        definirSalvamento({
          carregando: false,
          erro: 'Partida offline: pontuação não salva no ranking.',
        });
        return;
      }

      definirSalvamento({ carregando: true, erro: null });
      try {
        // Perguntas sem resposta (tempo esgotado) vao como texto vazio e contam
        // como erro no servidor, preservando o total de perguntas da partida.
        const payload = todasAsRespostas
          .filter((r) => r.perguntaId != null)
          .map((r) => ({ perguntaId: r.perguntaId, resposta: r.opcaoEscolhida ?? '' }));

        const { resumo } = await salvarPontuacao(payload);
        registrarResultado({
          ...base,
          pontos: resumo.pontuacao,
          acertos: resumo.acertos,
          total: resumo.total_perguntas,
          bonusTotal: resumo.bonusTotal,
          comboMaximo: resumo.comboMaximo,
          salvo: true,
        });
        definirSalvamento({ carregando: false, erro: null });
      } catch (e) {
        definirSalvamento({
          carregando: false,
          erro: e?.response?.data?.error || 'Não foi possível salvar a pontuação.',
        });
      }
    },
    [definirSalvamento, navigate, registrarResultado, vidas]
  );

  const responder = useCallback(
    (escolha) => {
      if (travadoRef.current || !atual) return;
      travadoRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);

      const correta = escolha === atual.resposta_correta;
      const novasRespostas = [
        ...respostas,
        {
          perguntaId: atual.id,
          escolha,
          opcaoEscolhida: escolha >= 0 ? atual.opcoes[escolha] : '',
          correta,
          dificuldade: atual.dificuldade,
        },
      ];

      setSelecionada(escolha);
      setRespostas(novasRespostas);
      if (!correta) setVidas(vidas - 1);
    },
    [atual, respostas, vidas]
  );

  responderRef.current = responder;

  // Cronometro opcional: so roda quando a partida habilita tempo por pergunta.
  useEffect(() => {
    if (!relogioAtivo || respondida || !atual) return undefined;

    setTempo(config.tempoPorQuestao);

    const id = window.setInterval(() => {
      setTempo((restante) => {
        if (restante <= 1) {
          window.clearInterval(id);
          window.setTimeout(() => responderRef.current?.(-1), 0);
          return 0;
        }
        return restante - 1;
      });
    }, 1000);

    timerRef.current = id;
    return () => window.clearInterval(id);
  }, [indice, respondida, atual, relogioAtivo, config.tempoPorQuestao]);

  function proxima() {
    if (ultimo || acabouVidas) {
      encerrarPartida(respostas, origem);
      return;
    }
    travadoRef.current = false;
    setIndice((i) => i + 1);
    setSelecionada(null);
    setTempo(config.tempoPorQuestao);
  }

  async function abandonar() {
    const sair = await confirmar({
      titulo: 'Abandonar a partida?',
      descricao: 'Seu progresso nesta partida será perdido e a pontuação não será salva.',
      textoConfirmar: 'Abandonar',
      perigo: true,
    });
    if (!sair) return;
    reiniciar();
    navigate('/inicio', { replace: true });
  }

  if (carregando) {
    return <LoadingState mensagem="Carregando perguntas..." />;
  }

  if (erro || !atual) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          icone={<BookOpen size={22} />}
          titulo="Sem perguntas"
          descricao={erro || 'Não foi possível iniciar a partida.'}
        />
        <PrimaryButton onClick={() => navigate('/inicio')}>Voltar ao Início</PrimaryButton>
      </div>
    );
  }

  const acertou = respondida && selecionada === atual.resposta_correta;
  const esgotouTempo = respondida && selecionada === -1;
  const valorDificuldade = PONTOS_POR_DIFICULDADE[atual.dificuldade] ?? 10;

  function estadoOpcao(i) {
    if (!respondida) return 'padrao';
    if (i === atual.resposta_correta) return 'correta';
    if (i === selecionada) return 'incorreta';
    return 'esmaecida';
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Painel da partida */}
      <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 shadow-panel">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate font-medium text-secondary">{user?.username}</span>
          <span className="flex shrink-0 items-center gap-3">
            <Vidas atuais={vidas} total={config.vidas} />
            <span className="font-display font-bold text-primary tabular-nums">
              {parcial.pontos} pts
            </span>
          </span>
        </div>

        <ProgressBar valor={progresso} rotulo="Progresso da partida" />

        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-text-muted">
            Pergunta {indice + 1} de {perguntas.length}
          </span>
          {relogioAtivo && (
            <span
              className={[
                'flex items-center gap-1 font-display font-semibold tabular-nums',
                tempo <= 10 ? 'animate-pulse-suave text-error' : 'text-secondary',
              ].join(' ')}
            >
              <Clock size={13} aria-hidden="true" />
              {tempo}s
            </span>
          )}
        </div>
      </div>

      {parcial.combo >= 2 && !respondida && (
        <p className="animate-pop self-center rounded-full bg-accent/20 px-4 py-1 text-sm font-semibold text-primary-dark">
          Combo de {parcial.combo} acertos!
          {parcial.combo >= 5 ? ' +15 bônus' : parcial.combo >= 3 ? ' +5 bônus' : ''}
        </p>
      )}

      {/* Pergunta */}
      <Card className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
            {atual.categoria}
            {atual.referencia ? ` · ${atual.referencia}` : ''}
          </p>
          <h2 className="mt-2 font-display text-xl leading-snug font-semibold text-primary-dark sm:text-2xl">
            {atual.pergunta}
          </h2>
        </div>

        <div className="flex flex-col gap-2.5">
          {atual.opcoes.map((opcao, i) => (
            <AnswerOption
              key={`${atual.id}-${i}`}
              indice={i}
              texto={opcao}
              estado={estadoOpcao(i)}
              desabilitada={respondida}
              onSelecionar={() => responder(i)}
            />
          ))}
        </div>
      </Card>

      {/* Feedback */}
      {respondida && (
        <div
          className={[
            'animate-pop flex items-start gap-3 rounded-field border px-4 py-3 text-sm',
            esgotouTempo
              ? 'border-line bg-background text-secondary'
              : acertou
                ? 'border-success/40 bg-success-light text-success'
                : 'border-error/40 bg-error-light text-error',
          ].join(' ')}
        >
          <span className="mt-0.5 shrink-0" aria-hidden="true">
            {esgotouTempo ? (
              <Clock size={18} />
            ) : acertou ? (
              <CircleCheck size={18} />
            ) : (
              <CircleX size={18} />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              {esgotouTempo
                ? 'Tempo esgotado!'
                : acertou
                  ? `Resposta correta! +${valorDificuldade} pts`
                  : 'Resposta incorreta.'}
            </p>
            {!acertou && (
              <p className="mt-1">
                Resposta correta:{' '}
                <strong className="font-semibold">{atual.opcoes[atual.resposta_correta]}</strong>
              </p>
            )}
            {atual.referencia && (
              <p className="mt-1 text-xs opacity-80">Referência: {atual.referencia}</p>
            )}
          </div>
        </div>
      )}

      {/* Fim de jogo por vidas */}
      {acabouVidas && (
        <p className="rounded-field border border-error/30 bg-error-light px-4 py-3 text-center text-sm font-medium text-error">
          Suas vidas acabaram. Veja o resultado da partida.
        </p>
      )}

      {/* Avanco manual: liberado somente depois de responder */}
      <div className="flex flex-col gap-2.5">
        <PrimaryButton
          tamanho="lg"
          larguraTotal
          onClick={proxima}
          desabilitado={!respondida}
          iconeFim={
            ultimo || acabouVidas ? undefined : <ChevronRight size={18} aria-hidden="true" />
          }
        >
          {ultimo || acabouVidas ? 'Ver Resultado' : 'Próxima Pergunta'}
        </PrimaryButton>

        <SecondaryButton variante="fantasma" onClick={abandonar} className="self-center text-sm">
          Abandonar partida
        </SecondaryButton>
      </div>
    </div>
  );
}
