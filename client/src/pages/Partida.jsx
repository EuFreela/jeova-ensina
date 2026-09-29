import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  Clock,
  Copy,
  Crown,
  Link2,
  LogOut,
  Play,
  RefreshCw,
  TriangleAlert,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { usePartida } from '../contexts/PartidaContext';
import { copiarTexto } from '../utils/clipboard';
import AnswerOption from '../components/ui/AnswerOption';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';
import LoadingState from '../components/ui/LoadingState';
import PrimaryButton from '../components/ui/PrimaryButton';
import ProgressBar from '../components/ui/ProgressBar';
import SecondaryButton from '../components/ui/SecondaryButton';

const ROTULO_STATUS = {
  aguardando: 'Aguardando jogadores',
  jogando: 'Em andamento',
  encerrada: 'Encerrada',
};

const ROTULO_MODO = {
  solo: 'Solo',
  campeonato: 'Campeonato',
};

const MEDALHAS = ['1º', '2º', '3º'];

function normalizar(texto) {
  return String(texto ?? '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

/** Cronometro local a partir do deadline enviado pelo servidor. */
function useCronometro(deadline) {
  const [restante, setRestante] = useState(0);

  useEffect(() => {
    if (!deadline) {
      setRestante(0);
      return undefined;
    }
    const atualizar = () => setRestante(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    atualizar();
    const id = setInterval(atualizar, 250);
    return () => clearInterval(id);
  }, [deadline]);

  return restante;
}

function Placar({ placar, meuId, compacto = false }) {
  if (!placar.length) return null;

  return (
    <ol className="flex flex-col gap-1.5">
      {placar.map((j) => {
        const souEu = j.userId === meuId;
        return (
          <li
            key={j.userId}
            className={[
              'flex items-center gap-2.5 rounded-field border px-3 py-2 transition-colors',
              souEu ? 'border-primary/40 bg-primary-light' : 'border-line bg-surface',
            ].join(' ')}
          >
            <span className="w-7 shrink-0 text-center font-display text-sm font-bold text-secondary tabular-nums">
              {MEDALHAS[j.posicao - 1] || j.posicao}
            </span>
            <Avatar nome={j.username} tamanho="sm" />
            {/* Quem ja respondeu. Sem isso nao da para ver quem ainda falta. */}
            <span
              title={j.respondeu ? 'Já respondeu' : 'Ainda não respondeu'}
              aria-label={j.respondeu ? 'Já respondeu' : 'Ainda não respondeu'}
              className={[
                'grid size-5 shrink-0 place-items-center rounded-full',
                j.respondeu ? 'bg-success/15 text-success' : 'bg-background text-text-muted',
              ].join(' ')}
            >
              {j.respondeu ? (
                <Check size={12} strokeWidth={3} aria-hidden="true" />
              ) : (
                <Clock size={12} aria-hidden="true" className="animate-pulse" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-primary-dark">
                {j.username}
                {souEu && <span className="ml-1 text-xs font-medium text-primary">(você)</span>}
              </span>
              {!compacto && (
                <span className="block text-xs text-text-muted">
                  {j.acertos} {j.acertos === 1 ? 'acerto' : 'acertos'}
                  {j.comboMaximo > 1 ? ` · combo ${j.comboMaximo}` : ''}
                </span>
              )}
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-sm font-bold text-primary tabular-nums">
                {j.pontos}
              </span>
              {!compacto && (
                <span className="block text-[10px] text-text-muted">
                  {j.respondeu ? 'respondeu' : 'pensando'}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Partida() {
  const { codigo = '' } = useParams();
  const navigate = useNavigate();
  const {
    conexao,
    sessao,
    pergunta,
    deadline,
    progresso,
    placar,
    revelacao,
    fim,
    online,
    erro,
    ocupado,
    removidoDe,
    limparRemovido,
    ehAnfitriao,
    meuId,
    setErro,
    conectar,
    entrarSessao,
    consultarSessao,
    convidarJogador,
    removerJogador,
    reiniciarSessao,
    iniciarPartida,
    sairSessao,
    responder,
  } = usePartida();

  const [minhaEscolha, setMinhaEscolha] = useState(null);
  const [copiado, setCopiado] = useState('');
  const [confirmando, setConfirmando] = useState(null);
  const [removendo, setRemovendo] = useState(null);

  const restante = useCronometro(deadline);

  useEffect(() => {
    conectar();
  }, [conectar]);

  // Consulta a sessao assim que o socket estiver pronto.
  useEffect(() => {
    if (conexao !== 'conectado' || !codigo) return;
    consultarSessao({ codigo: codigo.toUpperCase() });
  }, [conexao, codigo, consultarSessao]);

  // Nova pergunta: limpa a escolha anterior.
  useEffect(() => {
    setMinhaEscolha(null);
  }, [pergunta?.id]);

  const idsDaSessao = useMemo(
    () => new Set((sessao?.jogadores || []).map((j) => j.userId)),
    [sessao]
  );

  const disponiveis = useMemo(
    () => online.filter((p) => p.userId !== meuId && !idsDaSessao.has(p.userId)),
    [online, meuId, idsDaSessao]
  );

  const souJogador = Boolean(sessao && meuId && idsDaSessao.has(meuId));
  const status = sessao?.status;
  const noPlacar = useMemo(
    () => placar.find((j) => j.userId === meuId),
    [placar, meuId]
  );
  const jaRespondi = minhaEscolha !== null || Boolean(noPlacar?.respondeu);
  const revelouAgora = Boolean(
    revelacao && pergunta && revelacao.perguntaId === pergunta.id
  );
  const aguardandoResultado = status === 'jogando' && jaRespondi && !revelouAgora;

  const progressoPercentual = progresso.total
    ? Math.round(((progresso.indice + (jaRespondi ? 1 : 0)) / progresso.total) * 100)
    : 0;

  function estadoDaOpcao(indice, texto) {
    if (revelouAgora) {
      if (normalizar(texto) === normalizar(revelacao.correta)) return 'correta';
      if (indice === minhaEscolha) return 'incorreta';
      return 'esmaecida';
    }
    return minhaEscolha === indice ? 'selecionada' : 'padrao';
  }

  async function aoCopiar(valor, marca) {
    if (await copiarTexto(valor)) {
      setCopiado(marca);
      setTimeout(() => setCopiado(''), 2000);
    }
  }

  async function aoSair() {
    if (sessao) await sairSessao({ codigo: sessao.codigo });
    navigate('/partidas');
  }

  async function aoJogarNovamente() {
    setErro('');
    await reiniciarSessao({ codigo: sessao.codigo });
    await iniciarPartida({ codigo: sessao.codigo });
  }

  const linkDaSessao = `${window.location.origin}/partida/${sessao?.codigo || codigo}`;

  // ---------- estados iniciais ----------

  if (conexao === 'erro') {
    return (
      <div className="flex flex-col gap-4">
        <ErrorMessage>
          Não foi possível conectar ao servidor de jogo. Verifique sua conexão e tente novamente.
        </ErrorMessage>
        <SecondaryButton onClick={() => window.location.reload()}>Recarregar</SecondaryButton>
      </div>
    );
  }

  if (conexao !== 'conectado') {
    return <LoadingState mensagem="Conectando ao servidor de jogo..." />;
  }

  if (removidoDe) {
    return (
      <EmptyState
        icone={<UserMinus size={22} aria-hidden="true" />}
        titulo="Você foi removido da sessão"
        descricao={`${removidoDe.porQuem} removeu você da partida ${removidoDe.codigo}.`}
      >
        <PrimaryButton
          className="mt-2"
          onClick={() => {
            limparRemovido(null);
            navigate('/partidas');
          }}
        >
          Criar minha própria sessão
        </PrimaryButton>
      </EmptyState>
    );
  }

  if (!sessao) {
    return (
      <EmptyState
        icone={<Users size={22} aria-hidden="true" />}
        titulo="Sessão não encontrada"
        descricao="O código pode estar errado ou a sessão já foi encerrada."
      >
        <PrimaryButton className="mt-2" onClick={() => navigate('/partidas')}>
          Ir para as sessões
        </PrimaryButton>
      </EmptyState>
    );
  }

  // ---------- participacao bloqueada: sessao ja comecou ----------

  if (!souJogador && status !== 'aguardando') {
    return (
      <EmptyState
        icone={<TriangleAlert size={22} aria-hidden="true" />}
        titulo="Esta partida já começou"
        descricao="O elenco foi travado no início, então não dá para entrar agora. Crie a sua própria sessão para jogar no mesmo horário."
      >
        <PrimaryButton className="mt-2" onClick={() => navigate('/partidas')}>
          Criar minha própria sessão
        </PrimaryButton>
      </EmptyState>
    );
  }

  // ---------- convite: ainda da para entrar ----------

  if (!souJogador) {
    return (
      <div className="flex flex-col gap-4">
        {erro && <ErrorMessage>{erro}</ErrorMessage>}
        <EmptyState
          icone={<Users size={22} aria-hidden="true" />}
          titulo={`Você foi convidado para a sessão ${sessao.codigo}`}
          descricao={`${sessao.jogadores.length} ${
            sessao.jogadores.length === 1 ? 'pessoa participa' : 'pessoas participam'
          } deste jogo. Entre antes de o anfitrião iniciar a partida.`}
        >
          <PrimaryButton
            className="mt-2"
            carregando={ocupado}
            icone={<Play size={16} aria-hidden="true" />}
            onClick={async () => {
              const ok = await entrarSessao({ codigo: sessao.codigo });
              if (ok) setConfirmando(null);
            }}
          >
            Participar da sessão
          </PrimaryButton>
        </EmptyState>
        <SecondaryButton
          variante="fantasma"
          icone={<Link2 size={16} aria-hidden="true" />}
          onClick={() => aoCopiar(linkDaSessao, 'link')}
        >
          {copiado === 'link' ? 'Link copiado!' : 'Copiar link da sessão'}
        </SecondaryButton>
      </div>
    );
  }

  // ---------- placar final ----------

  if (status === 'encerrada' || fim) {
    const resultado = fim?.placar?.length ? fim.placar : placar;
    const modo = sessao.modo || fim?.modo;

    return (
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            {ROTULO_MODO[modo] || 'Partida'} · {resultado.length}{' '}
            {resultado.length === 1 ? 'jogador' : 'jogadores'}
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold text-primary-dark">
            {resultado.length > 1 ? 'Fim da partida!' : 'Resultado'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {fim?.total || resultado[0]?.total || sessao.total} perguntas respondidas.
          </p>
        </div>

        {resultado.length > 1 && (
          <div className="rounded-card bg-primary-dark p-5 text-center text-white">
            <p className="text-xs tracking-wide text-white/70 uppercase">Campeão</p>
            <p className="mt-1 font-display text-2xl font-bold">
              {resultado[0]?.username}
            </p>
            <p className="mt-1 font-display text-lg text-accent tabular-nums">
              {resultado[0]?.pontos} pontos
            </p>
          </div>
        )}

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-primary-dark">
            Classificação final
          </h2>
          <Placar placar={resultado} meuId={meuId} />
        </section>

        <p className="rounded-field bg-primary-light px-4 py-3 text-sm text-primary-dark">
          Este resultado foi salvo no ranking de <strong>{ROTULO_MODO[modo] || 'Partida'}</strong>.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          {ehAnfitriao && (
            <PrimaryButton
              className="sm:flex-1"
              icone={<RefreshCw size={16} aria-hidden="true" />}
              carregando={ocupado}
              onClick={aoJogarNovamente}
            >
              Jogar novamente
            </PrimaryButton>
          )}
          <SecondaryButton
            variante="neutro"
            onClick={() => navigate('/partidas')}
            disabled={!ehAnfitriao}
          >
            Voltar às sessões
          </SecondaryButton>
        </div>
        {!ehAnfitriao && (
          <SecondaryButton
            variante="perigo"
            icone={<LogOut size={16} aria-hidden="true" />}
            onClick={aoSair}
          >
            Sair da sessão
          </SecondaryButton>
        )}
      </div>
    );
  }

  // ---------- sala de espera ----------

  if (status === 'aguardando') {
    return (
      <div className="flex flex-col gap-5">
        {erro && <ErrorMessage>{erro}</ErrorMessage>}

        <div className="rounded-card bg-primary-dark p-5 text-center text-white">
          <p className="text-xs tracking-wide text-white/70 uppercase">Código da sessão</p>
          <p className="mt-1 font-display text-3xl font-bold tracking-widest">
            {sessao.codigo}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {sessao.jogadores.length === 1
              ? 'Jogando solo por enquanto'
              : `${sessao.jogadores.length} jogadores na sessão`}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <SecondaryButton
              tamanho="sm"
              variante="contorno"
              larguraTotal
              icone={<Copy size={15} aria-hidden="true" />}
              onClick={() => aoCopiar(sessao.codigo, 'codigo')}
            >
              {copiado === 'codigo' ? 'Copiado!' : 'Copiar código'}
            </SecondaryButton>
            <SecondaryButton
              tamanho="sm"
              variante="contorno"
              larguraTotal
              icone={<Link2 size={15} aria-hidden="true" />}
              onClick={() => aoCopiar(linkDaSessao, 'link')}
            >
              {copiado === 'link' ? 'Copiado!' : 'Copiar convite'}
            </SecondaryButton>
          </div>
        </div>

        {/* Elenco */}
        <section className="rounded-card border border-line bg-surface p-5 shadow-panel">
          <h2 className="font-display text-base font-semibold text-primary-dark">
            Jogadores na sessão
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {sessao.jogadores.map((j) => {
              const souEu = j.userId === meuId;
              return (
                <li key={j.userId} className="flex items-center gap-3 py-2.5">
                  <Avatar nome={j.username} tamanho="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-text">
                      {j.username}
                      {souEu && <span className="ml-1 text-xs text-primary">(você)</span>}
                    </p>
                    {j.userId === sessao.anfitriao && (
                      <p className="flex items-center gap-1 text-xs text-accent">
                        <Crown size={12} aria-hidden="true" />
                        Anfitrião
                      </p>
                    )}
                  </div>

                  {/* Somente o anfitriao remove, e nunca a si mesmo */}
                  {ehAnfitriao && !souEu && (
                    <>
                      {confirmando === j.userId ? (
                        <span className="flex gap-1">
                          <SecondaryButton tamanho="sm" onClick={() => setConfirmando(null)}>
                            Não
                          </SecondaryButton>
                          <PrimaryButton
                            tamanho="sm"
                            variante="perigo"
                            carregando={ocupado}
                            onClick={async () => {
                              setConfirmando(null);
                              setRemovendo(j.userId);
                              await removerJogador({ codigo: sessao.codigo, userId: j.userId });
                              setRemovendo(null);
                            }}
                          >
                            Remover
                          </PrimaryButton>
                        </span>
                      ) : (
                        <SecondaryButton
                          tamanho="sm"
                          variante="perigo"
                          carregando={removendo === j.userId}
                          icone={<UserMinus size={14} aria-hidden="true" />}
                          onClick={() => setConfirmando(j.userId)}
                        >
                          Remover
                        </SecondaryButton>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>

          {ehAnfitriao && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-text-muted">
              <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              Ao iniciar, o elenco é travado. Quem chegar depois participa de uma nova sessão.
            </p>
          )}
        </section>

        {/* Convidar quem esta online */}
        {ehAnfitriao && (
          <section className="rounded-card border border-line bg-surface p-5 shadow-panel">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-primary-dark">
              <UserPlus size={17} className="text-primary" aria-hidden="true" />
              Convidar quem está online
            </h2>
            {disponiveis.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">
                Ninguém livre no momento. Compartilhe o código ou o convite.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {disponiveis.map((p) => (
                  <li key={p.userId} className="flex items-center gap-3 py-2.5">
                    <Avatar nome={p.username} tamanho="sm" />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-text">
                      {p.username}
                    </span>
                    <SecondaryButton
                      tamanho="sm"
                      icone={<UserPlus size={14} aria-hidden="true" />}
                      carregando={ocupado}
                      title="Envia um convite: a pessoa aceita ou recusa"
                      onClick={async () => {
                        try {
                          await convidarJogador({
                            codigo: sessao.codigo,
                            userId: p.userId,
                          });
                        } catch {
                          /* o aviso global ja mostra o motivo */
                        }
                      }}
                    >
                      Convidar
                    </SecondaryButton>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {ehAnfitriao ? (
            <PrimaryButton
              className="sm:flex-1"
              tamanho="lg"
              carregando={ocupado}
              icone={<Play size={18} aria-hidden="true" />}
              onClick={() => iniciarPartida({ codigo: sessao.codigo })}
            >
              Iniciar partida
            </PrimaryButton>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-card border border-dashed border-line bg-surface px-4 py-4 text-sm text-text-muted">
              <Clock size={16} aria-hidden="true" />
              Aguardando o anfitrião iniciar
            </div>
          )}
          <SecondaryButton
            variante="perigo"
            icone={<LogOut size={16} aria-hidden="true" />}
            onClick={aoSair}
          >
            Sair
          </SecondaryButton>
        </div>
      </div>
    );
  }

  // ---------- partida em andamento ----------

  const acertou =
    revelouAgora && minhaEscolha !== null
      ? normalizar(pergunta?.opcoes?.[minhaEscolha] || '') === normalizar(revelacao.correta)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Progresso e tempo */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-text-muted">
            Pergunta {Math.min(progresso.indice + 1, progresso.total || 1)} de {progresso.total || '—'}
            {sessao.modo && (
              <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-primary">
                {ROTULO_MODO[sessao.modo]}
              </span>
            )}
          </p>
          <ProgressBar
            valor={progressoPercentual}
            rotulo="Progresso da partida"
            className="mt-1.5"
          />
        </div>
        <span
          className={[
            'grid size-12 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-bold tabular-nums',
            restante <= 5
              ? 'border-error bg-error-light text-error'
              : 'border-primary bg-primary-light text-primary',
          ].join(' ')}
        >
          {restante}s
        </span>
      </div>

      {erro && <ErrorMessage>{erro}</ErrorMessage>}

      {/* Pergunta */}
      {pergunta ? (
        <div className="rounded-card border border-line bg-surface p-5 shadow-panel">
          <h1 className="font-display text-lg leading-snug font-semibold text-primary-dark">
            {pergunta.pergunta}
          </h1>
          <div className="mt-4 flex flex-col gap-2">
            {pergunta.opcoes.map((texto, i) => (
              <AnswerOption
                key={texto}
                indice={i}
                texto={texto}
                estado={estadoDaOpcao(i, texto)}
                desabilitada={jaRespondi || status !== 'jogando'}
                onSelecionar={async () => {
                  setMinhaEscolha(i);
                  await responder(sessao.codigo, texto);
                }}
              />
            ))}
          </div>

          {aguardandoResultado && (
            <p className="mt-4 flex items-center gap-2 text-sm text-text-muted">
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-primary-light border-t-primary"
              />
              Resposta enviada. Aguardando os outros jogadores...
            </p>
          )}

          {revelouAgora && (
            <p
              className={[
                'mt-4 flex items-center gap-2 rounded-field px-4 py-3 text-sm font-semibold',
                acertou ? 'bg-success-light text-success' : 'bg-error-light text-error',
              ].join(' ')}
            >
              <Check size={16} aria-hidden="true" />
              {acertou ? 'Isso! Você acertou.' : `Resposta correta: ${revelacao.correta}`}
            </p>
          )}
        </div>
      ) : (
        <LoadingState mensagem="Preparando a pergunta..." />
      )}

      {/* Placar ao vivo */}
      <section className="rounded-card border border-line bg-surface p-4 shadow-panel">
        <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-primary-dark">
          <TrophyIcon />
          Placar ao vivo
        </h2>
        <Placar placar={placar} meuId={meuId} compacto />
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <Check
              size={11}
              strokeWidth={3}
              aria-hidden="true"
              className="text-success"
            />
            já respondeu
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} aria-hidden="true" />
            ainda falta
          </span>
        </p>
      </section>
    </div>
  );
}

function TrophyIcon() {
  return (
    <span
      aria-hidden="true"
      className="grid size-7 place-items-center rounded-full bg-primary-light text-primary"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 3h12v3a6 6 0 0 1-5 5.91V15h3v3H8v-3h3v-5.09A6 6 0 0 1 6 6V3Zm-3 1h2v2a3 3 0 0 1-2-3Zm14 0a3 3 0 0 1-2 3V4h2Z" />
      </svg>
    </span>
  );
}
