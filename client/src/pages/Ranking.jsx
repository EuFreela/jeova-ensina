import { useCallback, useEffect, useState } from 'react';
import { Eye, Trophy, UserRound, Users } from 'lucide-react';
import { buscarMinhasPontuacoes, buscarRanking } from '../services/perguntas';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';
import LeaderboardRow from '../components/ui/LeaderboardRow';
import LoadingState from '../components/ui/LoadingState';
import SecondaryButton from '../components/ui/SecondaryButton';

/**
 * Ranking separado: Solo e Campeonato nao sao comparaveis entre si.
 * No solo a pontuacao mede o proprio desempenho; no campeonato ela vale
 * na disputa com quem entrou na mesma partida.
 */
const ABAS = [
  {
    chave: 'solo',
    rotulo: 'Solo',
    descricao: 'Jogos sozinhos: pontuação contra si mesmo.',
    Icone: UserRound,
  },
  {
    chave: 'campeonato',
    rotulo: 'Campeonato',
    descricao: 'Jogos com outras pessoas: pontuação na disputa do grupo.',
    Icone: Users,
  },
];

/**
 * Interruptor de privacidade do ranking solo. Fica em Card simples, sem
 * confirmacao: desfazer e um clique, e a troca e instantanea.
 */
function CartaoVisibilidadeSolo() {
  const { user, definirRankingPublico } = useAuth();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const publico = user?.ranking_publico !== false;

  async function alternar() {
    setSalvando(true);
    setErro('');
    try {
      await definirRankingPublico(!publico);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      {/* items-center alinha o toggle com o bloco de texto; o min-w da coluna
          textual faz o texto quebrar antes de o botao sair do card. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-56">
          <p className="flex items-center gap-2 font-display text-sm font-semibold text-primary-dark">
            <Eye size={16} aria-hidden="true" />
            Meu ranking solo
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {publico
              ? 'Você aparece na classificação solo para os outros jogadores.'
              : 'Sua classificação solo está oculta para os outros. Você continua vendo a sua.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={publico}
          aria-label="Ranking solo público"
          disabled={salvando}
          onClick={alternar}
          className={[
            // relative + shrink-0: o trilho nunca encolhe nem vaza do card.
            // ml-auto mantem o toggle encostado a direita mesmo quando o
            // flex-wrap empilha ele abaixo do texto em telas muito estreitas.
            'relative ml-auto h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60',
            publico ? 'bg-primary' : 'bg-line',
          ].join(' ')}
        >
          {/* left-1 ancora o knob dentro do trilho (folga de 4px); o translate
              de 20px leva o outro lado mantendo o mesmo tamanho original. */}
          <span
            aria-hidden="true"
            className={[
              'absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform',
              publico ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </div>
      {erro && <p className="mt-2 text-xs text-error">{erro}</p>}
    </Card>
  );
}

function percentualDeAcertos(pontuacoes = []) {
  const acertos = pontuacoes.reduce((soma, p) => soma + (p.acertos || 0), 0);
  const total = pontuacoes.reduce((soma, p) => soma + (p.total_perguntas || 0), 0);
  if (!total) return null;
  return Math.round((acertos / total) * 100);
}

export default function Ranking() {
  const [aba, setAba] = useState('solo');
  const [ranking, setRanking] = useState([]);
  const [minhaPosicao, setMinhaPosicao] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [taxa, setTaxa] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async (modo) => {
    setCarregando(true);
    setErro('');
    try {
      const [dadosRanking, meus] = await Promise.all([
        buscarRanking(modo),
        buscarMinhasPontuacoes(modo).catch(() => null),
      ]);

      setRanking(dadosRanking.ranking || []);
      setMinhaPosicao(dadosRanking.minhaPosicao ?? null);

      if (meus) {
        setResumo(meus.resumo);
        setTaxa(percentualDeAcertos(meus.pontuacoes));
      }
    } catch {
      setErro('Não foi possível carregar o ranking.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(aba);
  }, [carregar, aba]);

  const abaAtiva = ABAS.find((a) => a.chave === aba) || ABAS[0];
  const temMeusDados = Boolean(resumo && resumo.jogos > 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-dark sm:text-3xl">
          Ranking Global
        </h1>
        <p className="mt-1 text-sm text-text-muted">Veja os melhores jogadores.</p>
      </div>

      {/* Ranking separado por modo: Solo e Campeonato */}
      <div role="tablist" aria-label="Modo de jogo do ranking" className="flex gap-1.5 overflow-x-auto">
        {ABAS.map((item) => {
          const ativa = aba === item.chave;
          return (
            <button
              key={item.chave}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => setAba(item.chave)}
              className={[
                'min-h-11 shrink-0 rounded-field border px-4 text-sm font-semibold transition-colors',
                ativa
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-line bg-surface text-secondary hover:border-primary/40',
              ].join(' ')}
            >
              {item.rotulo}
            </button>
          );
        })}
      </div>

      <p className="-mt-2 text-xs text-text-muted">
        Os filtros por período chegam em breve. Por enquanto, exibimos a classificação geral.
      </p>

      {/* O ranking solo e a unica lista visivel a todos, entao e nele que o
          jogador escolhe se aparece. No campeonato os participantes ja se
          conheceram na partida, entao a opcao nao se aplica. */}
      {aba === 'solo' && <CartaoVisibilidadeSolo />}

      {/* Sua posição */}
      {temMeusDados && (
        <Card variante="destaque">
          <p className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
            <Trophy size={16} aria-hidden="true" />
            Sua posição
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="font-display text-xl font-bold text-primary-dark tabular-nums">
                {minhaPosicao ? `${minhaPosicao}º` : '—'}
              </p>
              <p className="text-xs text-text-muted">
                {minhaPosicao ? 'Colocação' : 'Fora do top 10'}
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-primary-dark tabular-nums">
                {resumo.pontosTotais}
              </p>
              <p className="text-xs text-text-muted">Pontos totais</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-primary-dark tabular-nums">
                {taxa !== null ? `${taxa}%` : '—'}
              </p>
              <p className="text-xs text-text-muted">Taxa de acertos</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-primary-dark tabular-nums">
                {resumo.jogos}
              </p>
              <p className="text-xs text-text-muted">
                {resumo.jogos === 1 ? 'Partida' : 'Partidas'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {carregando ? (
        <LoadingState mensagem="Carregando ranking..." />
      ) : erro ? (
        <div className="flex flex-col gap-3">
          <ErrorMessage>{erro}</ErrorMessage>
          <SecondaryButton onClick={() => carregar(aba)} className="self-start">
            Tentar novamente
          </SecondaryButton>
        </div>
      ) : ranking.length === 0 ? (
        <EmptyState
          icone={<Trophy size={22} />}
          titulo={
            aba === 'solo' ? 'Ninguém jogou solo ainda' : 'Nenhum campeonato ainda'
          }
          descricao={
            aba === 'solo'
              ? 'Seja o primeiro a jogar sozinho e apareça neste ranking.'
              : 'Crie uma sessão, convide amigos e o primeiro campeonato aparece aqui.'
          }
        />
      ) : (
        <>
          {/* Mobile: cartoes compactos */}
          <ol className="flex flex-col gap-2 md:hidden">
            {ranking.map((item) => (
              <LeaderboardRow
                key={item.user_id}
                posicao={item.posicao}
                username={item.username}
                recorde={item.recorde}
                jogos={item.jogos}
                acertos={item.acertos}
                totalPerguntas={item.total_perguntas}
                souEu={item.souEu}
              />
            ))}
          </ol>

          {/* Desktop: tabela */}
          <div className="hidden overflow-hidden rounded-card border border-line bg-surface md:block">
            <table className="w-full text-left">
              <caption className="sr-only">
                Classificação do ranking {abaAtiva.rotulo}
              </caption>
              <thead>
                <tr className="border-b border-line bg-background text-xs font-semibold tracking-wide text-text-muted uppercase">
                  <th scope="col" className="px-4 py-3 text-center">
                    Pos.
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Jogador
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Jogos
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Acertos
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Pontos
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item) => {
                  const media = item.total_perguntas
                    ? Math.round((item.acertos / item.total_perguntas) * 100)
                    : null;
                  return (
                    <tr
                      key={item.user_id}
                      className={[
                        'border-b border-line last:border-0',
                        item.souEu ? 'bg-primary-light' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 text-center font-semibold text-secondary tabular-nums">
                        {item.posicao}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-3">
                          <Avatar nome={item.username} tamanho="sm" />
                          <span className="font-semibold text-primary-dark">
                            {item.username}
                            {item.souEu && (
                              <span className="ml-1.5 text-xs font-medium text-primary">
                                (você)
                              </span>
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-secondary tabular-nums">
                        {item.jogos}
                      </td>
                      <td className="px-4 py-3 text-right text-secondary tabular-nums">
                        {media !== null ? `${media}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-display font-bold text-primary tabular-nums">
                        {item.recorde}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
