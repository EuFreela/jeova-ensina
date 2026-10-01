import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, CircleCheck, CircleX, Clock, Heart, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../contexts/GameContext';
import { useConfirmacao } from '../contexts/ConfirmacaoContext';
import { buscarPerguntas, verificarResposta } from '../services/perguntas';
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
  // Prova, dada pelo servidor, de que as perguntas desta partida foram servidas
  // a ESTE jogador. Sem ela `salvarPontuacao` e recusado. `null` no modo local.
  const [rodada, setRodada] = useState(null);
  // Veredito da ultima pergunta, como o servidor respondiu: se acertou e qual
  // era o texto da resposta certa. O gabarito nao vem mais junto da pergunta.
  const [veredito, setVeredito] = useState(null);

  const travadoRef = useRef(false);
  const timerRef = useRef(null);
  const responderRef = useRef(null);
  const encerrandoRef = useRef(false);

  const atual = perguntas[indice];
  const ultimo = indice === perguntas.length - 1;
  const relogioAtivo = config.tempoPorQuestao > 0;
  const respondida = selecionada !== null;
  const acabouVidas = vidas <= 0;

  /**
   * Indice da opcao correta NA TELA. O servidor devolve o TEXTO (a ordem das
   * opcoes muda a cada partida, no cliente e no servidor), entao a posicao na
   * tela e localizada aqui.
   */
  const indiceCorreto = useMemo(() => {
    if (!respondida || !veredito?.respostaCorreta || !atual) return -1;
    return atual.opcoes.findIndex((o) => o === veredito.respostaCorreta);
  }, [respondida, veredito, atual]);

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
        const { perguntas: lista, origem: fonte, rodada: token } = await buscarPerguntas({
          limite: config.total,
          categoria: config.categoria,
          dificuldade: config.dificuldade,
        });
        if (cancelado) return;
        setOrigem(fonte);
        setRodada(token);
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
      // A rodada tambem viaja: e ela que autoriza o reenvio caso o primeiro
      // POST falhe por rede.
      const base = {
        ...resultado,
        origem: fonte,
        salvo: false,
        motivo,
        respostas: todasAsRespostas,
        rodada,
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

        const { resumo } = await salvarPontuacao(payload, 'solo', rodada);
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
    [definirSalvamento, navigate, registrarResultado, vidas, rodada]
  );

  /**
   * Registra a resposta de uma pergunta.
   *
   * No modo API o "acertou ou errou" NAO e decidido aqui: o cliente nao tem o
   * gabarito. Ele pergunta ao servidor, que compara o texto escolhido com a
   * resposta da pergunta no banco, e devolve o veredito. O feedback da tela
   * continua imediato — ha so uma ida ao servidor entre o clique e o "Resposta
   * correta!", e o servidor ja era consultado de qualquer forma para gravar a
   * pontuação no fim.
   *
   * No modo local (fallback offline) o gabarito esta no arquivo estatico e a
   * comparação é feita aqui. Partida offline nunca entra no ranking, então não
   * ha nada a forjar.
   */
  const responder = useCallback(
    async (escolha) => {
      if (travadoRef.current || !atual) return;
      travadoRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);

      const escolhido = escolha >= 0 ? atual.opcoes[escolha] : '';

      let vereditoLocal;
      if (escolha < 0) {
        // Tempo no fim. Nao ha escolha para conferir, e NAO se pergunta ao
        // servidor: ele responderia com o gabarito, e a resposta sairia de
        // graca para quem simplesmente deixasse o relogio zerar — 10 acertos
        // garantidos por partida sem gastar uma vida.
        vereditoLocal = { correta: false, respostaCorreta: null };
      } else if (origem === 'api' && rodada && atual.id != null) {
        // `null` aqui significa "o servidor nao respondeu", nao "errou". A
        // partida nao pode travar por causa de uma ida ao servidor que falhou
        // (rede, 401, teto de requisicoes), e a tela precisa dizer que nao sabe
        // em vez de inventar um "errado!" que custaria uma vida ao jogador.
        //
        // A resposta segue no `payload` e o servidor recalcula tudo no fim, a
        // partir do texto enviado — a pontuacao real nao depende deste veredito.
        // Vidas tambem nao: perder vida por falha de rede seria cobrar do
        // jogador algo que nao foi erro dele.
        const doServidor = await verificarResposta({
          rodada,
          perguntaId: atual.id,
          resposta: escolhido,
        });
        vereditoLocal = doServidor ?? { correta: null, respostaCorreta: null };
      } else {
        const gabarito = atual.resposta_correta;
        const acertou = gabarito != null && escolha === gabarito;
        vereditoLocal = {
          correta: acertou,
          respostaCorreta: gabarito != null ? atual.opcoes[gabarito] : null,
        };
      }

      const novasRespostas = [
        ...respostas,
        {
          perguntaId: atual.id,
          escolha,
          opcaoEscolhida: escolhido,
          correta: vereditoLocal.correta,
          dificuldade: atual.dificuldade,
        },
      ];

      setVeredito(vereditoLocal);
      setSelecionada(escolha);
      setRespostas(novasRespostas);
      if (vereditoLocal.correta === false) setVidas((v) => v - 1);
    },
    [atual, respostas, origem, rodada]
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
    setVeredito(null);
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

  const acertou = respondida && veredito?.correta === true;
  const esgotouTempo = respondida && selecionada === -1;
  // O servidor nao confirmou (falha de rede, teto de requisicoes, sessao
  // expirada). A tela diz isso em vez de tratar o silencio como erro.
  const semVeredito = respondida && !esgotouTempo && veredito?.correta == null;
  const valorDificuldade = PONTOS_POR_DIFICULDADE[atual.dificuldade] ?? 10;

  function estadoOpcao(i) {
    if (!respondida) return 'padrao';
    // Sem veredito nao existe "opcao correta" a pintar: realçar uma delas seria
    // chutar o gabarito na tela do jogador.
    if (indiceCorreto < 0) return i === selecionada ? 'selecionada' : 'esmaecida';
    if (i === indiceCorreto) return 'correta';
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
            esgotouTempo || semVeredito
              ? 'border-line bg-background text-secondary'
              : acertou
                ? 'border-success/40 bg-success-light text-success'
                : 'border-error/40 bg-error-light text-error',
          ].join(' ')}
        >
          <span className="mt-0.5 shrink-0" aria-hidden="true">
            {esgotouTempo ? (
              <Clock size={18} />
            ) : semVeredito ? (
              <Info size={18} />
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
                : semVeredito
                  ? 'Não foi possível confirmar agora.'
                  : acertou
                    ? `Resposta correta! +${valorDificuldade} pts`
                    : 'Resposta incorreta.'}
            </p>
            {semVeredito && (
              <p className="mt-1">
                Sua resposta foi guardada e entra na pontuação final — só o
                servidor não respondeu a tempo.
              </p>
            )}
            {!acertou && !semVeredito && indiceCorreto >= 0 && (
              <p className="mt-1">
                Resposta correta: <strong className="font-semibold">{atual.opcoes[indiceCorreto]}</strong>
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
