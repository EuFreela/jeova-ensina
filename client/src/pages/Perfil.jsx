import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  History,
  KeyRound,
  LogOut,
  Pencil,
  ShieldCheck,
  Target,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useConfirmacao } from '../contexts/ConfirmacaoContext';
import { buscarMinhasPontuacoes } from '../services/pontuacoes';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';
import LoadingState from '../components/ui/LoadingState';
import SecondaryButton from '../components/ui/SecondaryButton';

const POR_PAGINA = 10;

function Estatistica({ rotulo, valor, Icone }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
        <Icone size={14} aria-hidden="true" />
        {rotulo}
      </span>
      <p className="mt-1.5 font-display text-2xl font-bold text-primary-dark tabular-nums">
        {valor}
      </p>
    </div>
  );
}

/** Resumo de um dos modos: solo e campeonato sao contabilizados separados. */
function ResumoModo({ rotulo, descricao, Icone, dados }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-primary-dark">
        <Icone size={15} className="text-primary" aria-hidden="true" />
        {rotulo}
      </p>
      <p className="mt-0.5 text-xs text-text-muted">{descricao}</p>
      <div className="mt-2.5 flex gap-4">
        <div>
          <p className="font-display text-lg font-bold text-primary tabular-nums">
            {dados?.recorde ?? 0}
          </p>
          <p className="text-[11px] text-text-muted">Recorde</p>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-primary-dark tabular-nums">
            {dados?.jogos ?? 0}
          </p>
          <p className="text-[11px] text-text-muted">
            {dados?.jogos === 1 ? 'Partida' : 'Partidas'}
          </p>
        </div>
      </div>
    </div>
  );
}

/** "2026-03-15T..." -> "15 de mar". */
function dataCurta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function LinhaHistorico({ item }) {
  const percentual = item.total_perguntas
    ? Math.round((item.acertos / item.total_perguntas) * 100)
    : null;

  return (
    <li className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary-dark tabular-nums">
          {item.pontuacao} {item.pontuacao === 1 ? 'ponto' : 'pontos'}
        </p>
        <p className="text-xs text-text-muted">
          {/* `createdAt` em camelCase: e assim que o Sequelize devolve a
              linha. A coluna no banco e `created_at`, mas o `underscored` do
              modelo so alcança o SQL, nao o JSON entregue ao cliente. */}
          {dataCurta(item.createdAt)}
          {percentual !== null && ` • ${percentual}% de acerto`}
          {` • ${item.modo === 'campeonato' ? 'Campeonato' : 'Solo'}`}
        </p>
      </div>
      <p className="shrink-0 text-xs text-text-muted tabular-nums">
        {item.acertos}/{item.total_perguntas}
      </p>
    </li>
  );
}

/**
 * Edicao do nome de usuario. O botao ficava desabilitado com o rotulo
 * "Editar dados (em breve)" desde o inicio — a promessa estava na tela e
 * nao havia endpoint. Agora existe, e mostra o que vai acontecer em vez de
 * sumir em silencio.
 */
function EditorNome({ user, aoSalvar }) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(user?.username || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Ao abrir, o campo parte do nome atual: se o usuario abriu, mudou de
  // ideia e reabriu, nao fica o rascunho antigo.
  useEffect(() => {
    if (aberto) setValor(user?.username || '');
  }, [aberto, user?.username]);

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await aoSalvar(valor.trim());
      setAberto(false);
    } catch (e) {
      setErro(e.message || 'Não foi possível trocar o nome.');
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <SecondaryButton
        larguraTotal
        onClick={() => setAberto(true)}
        icone={<Pencil size={17} aria-hidden="true" />}
      >
        Editar dados
      </SecondaryButton>
    );
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-2">
      <label htmlFor="editar-nome" className="text-sm font-semibold text-primary-dark">
        Nome de usuário
      </label>
      <input
        id="editar-nome"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        autoFocus
        maxLength={50}
        autoComplete="username"
        aria-describedby="ajuda-editar-nome"
        className="w-full rounded-field border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      <p id="ajuda-editar-nome" className="text-xs text-text-muted">
        De 3 a 50 caracteres: letras, números, ponto, hífen ou underscore. As
        partidas já registradas continuam com o nome antigo, porque o placar
        guarda o nome de quem jogou na hora.
      </p>
      {erro && <ErrorMessage className="text-xs">{erro}</ErrorMessage>}
      <div className="flex gap-2">
        <SecondaryButton
          type="submit"
          larguraTotal
          carregando={salvando}
          desabilitado={salvando}
          icone={<Check size={16} aria-hidden="true" />}
        >
          Salvar
        </SecondaryButton>
        <SecondaryButton
          type="button"
          variante="neutro"
          onClick={() => {
            setAberto(false);
            setErro('');
          }}
          icone={<X size={16} aria-hidden="true" />}
        >
          Cancelar
        </SecondaryButton>
      </div>
    </form>
  );
}

export default function Perfil() {
  const navigate = useNavigate();
  const { user, logout, alterarUsuario } = useAuth();
  const confirmar = useConfirmacao();

  const [dados, setDados] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erro, setErro] = useState('');

  /**
   * O mesmo descarte por `id` usado no ranking: trocar de pagina dispara duas
   * buscas e a resposta velha, se chegasse depois, trocaria a lista exibida
   * pela de outra pagina sem trocar o numero do rodape.
   */
  const requisicao = useRef(0);

  const carregar = useCallback(
    async (numero) => {
      const id = requisicao.current + 1;
      requisicao.current = id;

      setCarregando(true);
      setErro('');
      try {
        const resposta = await buscarMinhasPontuacoes(undefined, {
          pagina: numero,
          porPagina: POR_PAGINA,
        });
        if (requisicao.current !== id) return;
        setDados(resposta);
        setPagina(numero);
      } catch {
        if (requisicao.current !== id) return;
        setErro('Não foi possível carregar suas estatísticas.');
      } finally {
        if (requisicao.current === id) setCarregando(false);
      }
    },
    []
  );

  useEffect(() => {
    carregar(1);
  }, [carregar]);

  async function trocarPagina(destino) {
    setCarregandoHistorico(true);
    try {
      await carregar(destino);
    } finally {
      setCarregandoHistorico(false);
    }
  }

  async function salvarNome(novoNome) {
    // O contexto ja substitui o token e o `user`: o cabecalho e o avatar
    // desta tela leem de la e nao precisam de nenhuma atualizacao extra.
    return alterarUsuario(novoNome);
  }

  async function sair() {
    const confirmado = await confirmar({
      titulo: 'Sair da conta?',
      descricao: 'Você precisará entrar novamente para jogar.',
      textoConfirmar: 'Sair',
      perigo: true,
    });
    if (!confirmado) return;
    logout();
    navigate('/login', { replace: true });
  }

  const resumo = dados?.resumo;
  const porModo = dados?.resumoPorModo;
  const pontuacoes = dados?.pontuacoes || [];
  const paginacao = dados?.paginacao;

  /**
   * A taxa vem pronta do banco (`acertosTotais`/`perguntasTotais` no
   * `resumo`). Somar as linhas da pagina daria a taxa dos ultimos 10 jogos,
   * e ela mudaria sozinha a cada pagina carregada.
   */
  const taxa = resumo?.perguntasTotais
    ? Math.round((resumo.acertosTotais / resumo.perguntasTotais) * 100)
    : null;

  const paginaAtual = paginacao?.pagina || pagina;
  const ultimaPagina = Math.max(1, Math.ceil((paginacao?.total || 0) / POR_PAGINA));

  return (
    <div className="flex flex-col gap-5">
      {/* Cabecalho do perfil */}
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar nome={user?.username} tamanho="xl" />
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-dark">{user?.username}</h1>
          <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-text-muted">
            {user?.role === 'admin' && <ShieldCheck size={14} aria-hidden="true" />}
            {user?.role === 'admin' ? 'Administrador' : 'Jogador do Jeová Ensina'}
          </p>
        </div>
      </div>

      {erro && <ErrorMessage>{erro}</ErrorMessage>}

      {carregando ? (
        <LoadingState mensagem="Carregando seu desempenho..." />
      ) : (
        <>
          {/* Estatisticas */}
          <div className="grid grid-cols-2 gap-3">
            <Estatistica
              rotulo="Pontuação total"
              valor={resumo?.pontosTotais ?? 0}
              Icone={Trophy}
            />
            <Estatistica rotulo="Melhor pontuação" valor={resumo?.recorde ?? 0} Icone={Trophy} />
            <Estatistica rotulo="Partidas" valor={resumo?.jogos ?? 0} Icone={History} />
            <Estatistica
              rotulo="Taxa de acertos"
              valor={taxa !== null ? `${taxa}%` : '—'}
              Icone={Target}
            />
          </div>

          {/* Desempenho por modo: o recorde solo nao se compara ao de campeonato */}
          <div className="grid gap-3 sm:grid-cols-2">
            <ResumoModo
              rotulo="Solo"
              descricao="Jogos sozinhos"
              Icone={UserRound}
              dados={porModo?.solo}
            />
            <ResumoModo
              rotulo="Campeonato"
              descricao="Jogos com outras pessoas"
              Icone={Users}
              dados={porModo?.campeonato}
            />
          </div>

          {/* Historico. Antes esta tela trazia os numeros e nada mais: o
              jogador nao conseguia ver nenhuma partida registrada. */}
          <Card>
            <p className="flex items-center gap-2 font-display text-sm font-semibold text-primary-dark">
              <History size={16} aria-hidden="true" />
              Histórico de partidas
              {paginacao?.total > 0 && (
                <span className="text-xs font-normal text-text-muted">
                  ({paginacao.total})
                </span>
              )}
            </p>

            {paginacao?.total > 0 ? (
              <>
                <ul className="mt-2">
                  {pontuacoes.map((item) => (
                    <LinhaHistorico key={item.id} item={item} />
                  ))}
                </ul>

                {ultimaPagina > 1 && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                    <SecondaryButton
                      onClick={() => trocarPagina(paginaAtual - 1)}
                      desabilitado={carregandoHistorico || paginaAtual <= 1}
                      aria-label="Página anterior"
                    >
                      Anterior
                    </SecondaryButton>
                    <span className="text-xs text-text-muted tabular-nums">
                      Página {paginaAtual} de {ultimaPagina}
                    </span>
                    <SecondaryButton
                      onClick={() => trocarPagina(paginaAtual + 1)}
                      desabilitado={carregandoHistorico || paginaAtual >= ultimaPagina}
                      aria-label="Próxima página"
                    >
                      Próxima
                    </SecondaryButton>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                className="py-6"
                icone={<History size={22} />}
                titulo="Nenhuma partida registrada"
                descricao="Jogue uma partida para começar seu histórico."
              />
            )}
          </Card>
        </>
      )}

      {/* Acoes */}
      <Card className="flex flex-col gap-2.5">
        <SecondaryButton
          larguraTotal
          onClick={() => navigate('/trocar-senha')}
          icone={<KeyRound size={17} aria-hidden="true" />}
        >
          Trocar senha
        </SecondaryButton>

        <EditorNome user={user} aoSalvar={salvarNome} />

        <SecondaryButton
          variante="perigo"
          larguraTotal
          onClick={sair}
          icone={<LogOut size={17} aria-hidden="true" />}
        >
          Sair da conta
        </SecondaryButton>
      </Card>
    </div>
  );
}