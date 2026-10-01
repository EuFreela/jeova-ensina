import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Copy,
  Hash,
  Link2,
  LogOut,
  Play,
  TriangleAlert,
  UserPlus,
  UserMinus,
  Users,
} from 'lucide-react';
import { usePartida } from '../contexts/PartidaContext';
import { buscarCategorias } from '../services/perguntas';
import { copiarTexto } from '../utils/clipboard';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';
import LoadingState from '../components/ui/LoadingState';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';

const QUANTIDADES = [5, 10, 15, 20];
const DIFICULDADES = [
  { chave: 'todas', rotulo: 'Misto' },
  { chave: 'facil', rotulo: 'Fácil' },
  { chave: 'medio', rotulo: 'Médio' },
  { chave: 'dificil', rotulo: 'Difícil' },
];
const TEMPOS = [
  { valor: 10, rotulo: '10 segundos' },
  { valor: 20, rotulo: '20 segundos' },
  { valor: 30, rotulo: '30 segundos' },
  { valor: 45, rotulo: '45 segundos' },
  { valor: 60, rotulo: '60 segundos' },
];

const ROTULO_STATUS = {
  aguardando: 'Aguardando jogadores',
  jogando: 'Em andamento',
  encerrada: 'Encerrada',
};

function linkDaSessao(codigo) {
  return `${window.location.origin}/partida/${codigo}`;
}

export default function Partidas() {
  const navigate = useNavigate();
  const {
    conexao,
    sessao,
    online,
    erro,
    ocupado,
    ehAnfitriao,
    meuId,
    setErro,
    conectar,
    criarSessao,
    entrarSessao,
    convidarJogador,
    convitesPendente,
    removerJogador,
    sairSessao,
  } = usePartida();

  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState('todas');
  const [dificuldade, setDificuldade] = useState('todas');
  const [total, setTotal] = useState(10);
  const [tempoPorQuestao, setTempoPorQuestao] = useState(30);
  const [codigoEntrada, setCodigoEntrada] = useState('');
  const [confirmandoCom, setConfirmandoCom] = useState(null);
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    conectar();
    buscarCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [conectar]);

  const opcoesCategorias = useMemo(() => ['todas', ...categorias], [categorias]);

  const configuracao = useMemo(
    () => ({ categoria, dificuldade, total, tempoPorQuestao }),
    [categoria, dificuldade, total, tempoPorQuestao]
  );

  const idsDaSessao = useMemo(
    () => new Set((sessao?.jogadores || []).map((j) => j.userId)),
    [sessao]
  );

  function codigoDoObjeto(resultado) {
    return resultado?.estado?.sessao?.codigo;
  }

  async function aoCriar() {
    setErro('');
    const resultado = await criarSessao(configuracao);
    const codigo = codigoDoObjeto(resultado);
    if (codigo) navigate(`/partida/${codigo}`);
  }

  async function aoJogarSolo() {
    setErro('');
    const resultado = await criarSessao({ ...configuracao, total: 10 });
    const codigo = codigoDoObjeto(resultado);
    if (!codigo) return;
    navigate(`/partida/${codigo}`);
  }

  async function aoEntrar() {
    setErro('');
    const codigo = codigoEntrada.trim().toUpperCase();
    if (!codigo) return;
    const resultado = await entrarSessao({ codigo });
    if (resultado) navigate(`/partida/${codigo}`);
  }

  async function aoConvidar(alvo) {
    setConfirmandoCom(null);
    try {
      // Nao entra direto no elenco: a pessoa recebe o convite e decide.
      await convidarJogador({
        codigo: sessao.codigo,
        userId: alvo.userId,
        // Elenco travado durante a partida: a sessao e reiniciada para incluir.
        reiniciar: sessao.status === 'jogando',
      });
    } catch {
      /* o erro ja aparece no aviso global */
    }
  }

  async function aoCopiar(valor, marca) {
    if (await copiarTexto(valor)) {
      setCopiado(marca);
      setTimeout(() => setCopiado(''), 2000);
    }
  }

  if (conexao === 'conectando' || conexao === 'desconectado') {
    return <LoadingState mensagem="Conectando ao servidor de jogo..." />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-dark sm:text-3xl">
          Jogar com amigos
        </h1>
        <p className="mt-1 text-text-muted">
          Crie uma sessão, convide pelo link ou chame quem está online.
        </p>
      </div>

      {erro && <ErrorMessage>{erro}</ErrorMessage>}

      {/* Sessao atual do usuario */}
      {sessao ? (
        <section className="rounded-card border border-primary/30 bg-primary-light p-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-field bg-primary text-white"
            >
              <Users size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold text-primary-dark">
                Sua sessão {ehAnfitriao ? '(você é o anfitrião)' : ''}
              </p>
              <p className="mt-0.5 text-sm text-text-muted">
                {ROTULO_STATUS[sessao.status] || sessao.status} ·{' '}
                {sessao.jogadores.length}{' '}
                {sessao.jogadores.length === 1 ? 'jogador' : 'jogadores'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="rounded-field border border-line bg-surface px-3 py-2 font-display text-lg font-bold tracking-widest text-primary-dark">
              {sessao.codigo}
            </code>
            <SecondaryButton
              tamanho="sm"
              variante="contorno"
              icone={<Copy size={15} aria-hidden="true" />}
              onClick={() => aoCopiar(sessao.codigo, 'codigo')}
            >
              {copiado === 'codigo' ? 'Copiado!' : 'Código'}
            </SecondaryButton>
            <SecondaryButton
              tamanho="sm"
              variante="contorno"
              icone={<Link2 size={15} aria-hidden="true" />}
              onClick={() => aoCopiar(linkDaSessao(sessao.codigo), 'link')}
            >
              {copiado === 'link' ? 'Copiado!' : 'Link'}
            </SecondaryButton>
          </div>

          <ul className="mt-4 divide-y divide-line">
            {sessao.jogadores.map((j) => {
              const souEu = j.userId === meuId;
              return (
                <li key={j.userId} className="flex items-center gap-3 py-2.5">
                  <Avatar nome={j.username} tamanho="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary-dark">
                      {j.username}
                      {souEu && <span className="ml-1 text-xs font-medium text-primary">(você)</span>}
                    </p>
                    {j.userId === sessao.anfitriao && (
                      <p className="text-xs text-accent">Anfitrião</p>
                    )}
                  </div>
                  {/* Apenas o anfitrião remove, e nunca a si mesmo */}
                  {ehAnfitriao && !souEu &&
                    (confirmandoCom === j.userId ? (
                      <span className="flex gap-1">
                        <SecondaryButton tamanho="sm" onClick={() => setConfirmandoCom(null)}>
                          Não
                        </SecondaryButton>
                        <PrimaryButton
                          tamanho="sm"
                          variante="perigo"
                          onClick={async () => {
                            setConfirmandoCom(null);
                            await removerJogador({ codigo: sessao.codigo, userId: j.userId });
                          }}
                        >
                          Remover
                        </PrimaryButton>
                      </span>
                    ) : (
                      <SecondaryButton
                        tamanho="sm"
                        variante="perigo"
                        icone={<UserMinus size={14} aria-hidden="true" />}
                        onClick={() => setConfirmandoCom(j.userId)}
                      >
                        Remover
                      </SecondaryButton>
                    ))}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <PrimaryButton
              className="sm:flex-1"
              icone={<Play size={17} aria-hidden="true" />}
              onClick={() => navigate(`/partida/${sessao.codigo}`)}
            >
              Abrir sessão
            </PrimaryButton>
            <SecondaryButton
              variante="perigo"
              icone={<LogOut size={16} aria-hidden="true" />}
          onClick={async () => {
                    await sairSessao({ codigo: sessao.codigo });
                    navigate('/inicio');
                  }}
            >
              Sair da sessão
            </SecondaryButton>
          </div>
        </section>
      ) : (
        <section className="rounded-card border border-line bg-surface p-5 shadow-panel">
          <h2 className="font-display text-lg font-bold text-primary-dark">Criar uma sessão</h2>
          <p className="mt-1 text-sm text-text-muted">
            Escolha o formato do jogo. Você pode jogar solo ou convidar amigos.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-primary-dark">
                Categoria
              </span>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="min-h-11 w-full rounded-field border border-line bg-surface px-3 text-[15px] text-text"
              >
                {opcoesCategorias.map((chave) => (
                  <option key={chave} value={chave}>
                    {chave === 'todas' ? 'Todas' : chave}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-primary-dark">
                Dificuldade
              </span>
              <select
                value={dificuldade}
                onChange={(e) => setDificuldade(e.target.value)}
                className="min-h-11 w-full rounded-field border border-line bg-surface px-3 text-[15px] text-text"
              >
                {DIFICULDADES.map(({ chave: c, rotulo }) => (
                  <option key={c} value={c}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-semibold text-primary-dark">
                Quantidade
              </span>
              <div className="flex flex-wrap gap-2">
                {QUANTIDADES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setTotal(q)}
                    aria-pressed={total === q}
                    className={[
                      'min-h-9 rounded-field border-2 px-3 text-sm font-semibold transition-colors',
                      total === q
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-line bg-surface text-secondary hover:border-primary/40',
                    ].join(' ')}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-primary-dark">
                <Clock size={15} className="text-primary" aria-hidden="true" />
                Tempo por pergunta
              </span>
              <div className="flex flex-wrap gap-2">
                {TEMPOS.map(({ valor: v, rotulo }) => (
                  <button
                    key={v}
                    type="button"
                    title={rotulo}
                    onClick={() => setTempoPorQuestao(v)}
                    aria-pressed={tempoPorQuestao === v}
                    className={[
                      'min-h-9 rounded-field border-2 px-3 text-sm font-semibold transition-colors',
                      tempoPorQuestao === v
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-line bg-surface text-secondary hover:border-primary/40',
                    ].join(' ')}
                  >
                    {v}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <PrimaryButton
              className="sm:flex-1"
              carregando={ocupado}
              icone={<Users size={17} aria-hidden="true" />}
              onClick={aoCriar}
            >
              Criar sessão
            </PrimaryButton>
            <SecondaryButton
              variante="neutro"
              onClick={aoJogarSolo}
              disabled={ocupado}
              icone={<Play size={16} aria-hidden="true" />}
            >
              Jogar solo agora
            </SecondaryButton>
          </div>
        </section>
      )}

      {/* Entrar por codigo */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-panel">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-primary-dark">
          <Hash size={17} className="text-primary" aria-hidden="true" />
          Entrar com código
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {sessao && sessao.status !== 'encerrada'
            ? 'Você já está numa sessão. Saia dela para entrar em outra.'
            : 'Peça o código de 6 letras a quem te convidou.'}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={codigoEntrada}
            onChange={(e) => setCodigoEntrada(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') aoEntrar();
            }}
            placeholder="Ex.: K7M2QP"
            aria-label="Código da sessão"
            maxLength={6}
            autoComplete="off"
            className="min-h-11 flex-1 rounded-field border border-line bg-surface px-3 text-center font-display text-lg font-bold tracking-widest text-primary-dark uppercase placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-text-muted"
          />
          <PrimaryButton
            carregando={ocupado}
            desabilitado={!codigoEntrada.trim() || Boolean(sessao) || sessao?.status === 'jogando'}
            onClick={aoEntrar}
          >
            Entrar
          </PrimaryButton>
        </div>
      </section>

      {/* Jogadores online */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-panel">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-primary-dark">
          <Users size={17} className="text-primary" aria-hidden="true" />
          Online agora
        </h2>

        {online.length <= 1 ? (
          <EmptyState
            className="mt-3"
            icone={<Users size={22} aria-hidden="true" />}
            titulo="Ninguém online por enquanto"
            descricao="Quando outra pessoa entrar, ela aparece aqui para você convidar."
          />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {online
              .filter((p) => p.userId !== meuId)
              .map((p) => {
                const naMinha = idsDaSessao.has(p.userId);
                const pendente = convitesPendente.some((c) => c.userId === p.userId);
                return (
                  <li key={p.userId} className="flex items-center gap-3 py-2.5">
                    <Avatar nome={p.username} tamanho="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-text">{p.username}</p>
                      <p className="text-xs text-text-muted">
                        {naMinha
                          ? 'Na sua sessão'
                          : pendente
                            ? 'Convite enviado, aguardando resposta'
                            : p.emSessao
                              ? 'Em outra sessão'
                              : 'Livre'}
                      </p>
                    </div>
                    {pendente ? (
                      <span className="text-xs font-medium text-accent">Convidado</span>
                    ) : (
                      ehAnfitriao && !naMinha && !p.emSessao && (
                      <>
                        {confirmandoCom === p.userId ? (
                          <span className="flex flex-col items-end gap-1">
                            <span className="flex items-center gap-1 text-xs text-error">
                              <TriangleAlert size={13} aria-hidden="true" />
                              Reinicia a sessão
                            </span>
                            <span className="flex gap-1">
                              <SecondaryButton
                                tamanho="sm"
                                onClick={() => setConfirmandoCom(null)}
                              >
                                Cancelar
                              </SecondaryButton>
                              <PrimaryButton
                                tamanho="sm"
                                onClick={() => aoConvidar(p)}
                              >
                                Confirmar
                              </PrimaryButton>
                            </span>
                          </span>
                        ) : (
                          <SecondaryButton
                            tamanho="sm"
                            icone={<UserPlus size={15} aria-hidden="true" />}
                            onClick={() => setConfirmandoCom(p.userId)}
                          >
                            Convidar
                          </SecondaryButton>
                        )}
                      </>
                      )
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </div>
  );
}
