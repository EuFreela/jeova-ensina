import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  LogOut,
  Play,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../contexts/GameContext';
import { usePartida } from '../contexts/PartidaContext';
import { buscarMinhasPontuacoes } from '../services/perguntas';
import ErrorMessage from '../components/ui/ErrorMessage';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';

function primeiroNome(username = '') {
  return username.split(/[._-]/)[0];
}

const DESTINOS = [
  {
    para: '/partidas',
    titulo: 'Jogar com amigos',
    descricao: 'Crie uma sessão e convide quem está online',
    Icone: Users,
  },
  {
    para: '/categorias',
    titulo: 'Escolher Categoria',
    descricao: 'Escolha um tema para as perguntas',
    Icone: BookOpen,
  },
  {
    para: '/ranking',
    titulo: 'Ranking',
    descricao: 'Veja os melhores jogadores',
    Icone: Trophy,
  },
  {
    para: '/perfil',
    titulo: 'Meu Perfil',
    descricao: 'Seus pontos, histórico e estatísticas',
    Icone: UserRound,
  },
];

export default function Inicio() {
  const navigate = useNavigate();
  const { user, atualizarPerfil } = useAuth();
  const { iniciarPartida } = useGame();
  const { sessao, sairSessao } = usePartida();

  const [resumo, setResumo] = useState(null);
  const [saindo, setSaindo] = useState(false);
  const [erroSessao, setErroSessao] = useState('');

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const dados = await buscarMinhasPontuacoes();
        if (cancelado) return;
        setResumo(dados.resumo);
        atualizarPerfil().catch(() => {});
      } catch {
        // Sem resumo: a tela segue funcionando, so sem os numeros de desempenho.
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function novoJogo() {
    iniciarPartida({ total: 10, categoria: 'todas', dificuldade: 'todas' });
    navigate('/quiz');
  }

  async function sairDaSessao() {
    if (!sessao) return;
    setSaindo(true);
    setErroSessao('');
    try {
      await sairSessao({ codigo: sessao.codigo });
    } catch (e) {
      // O card so some quando a saida foi confirmada pelo servidor.
      setErroSessao(e.message || 'Não foi possível sair da sessão.');
    } finally {
      setSaindo(false);
    }
  }

  const temHistorico = (resumo?.jogos || 0) > 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-dark sm:text-3xl">
          Olá, {primeiroNome(user?.username)}!
        </h1>
        <p className="mt-1 text-text-muted">Que bom ver você por aqui!</p>
      </div>

      {/* Sessao em aberto: o jogador so participa de uma por vez, entao a
          saida fica aqui, sempre a vista, ate sair ou a partida terminar. */}
      {sessao && (
        <div className="rounded-card border border-primary/40 bg-primary-light/50 p-4 shadow-panel">
          <p className="flex items-center gap-2 font-display text-sm font-semibold text-primary-dark">
            <Users size={16} aria-hidden="true" />
            Você está em uma sessão aberta
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Código <span className="font-mono font-bold tracking-wider">{sessao.codigo}</span>
            {sessao.status === 'jogando'
              ? ' — partida em andamento.'
              : sessao.status === 'encerrada'
                ? ' — partida encerrada, você pode sair.'
                : ` — aguardando ${sessao.anfitriao === user?.id ? 'jogadores' : 'o anfitrião iniciar'}.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton
              onClick={() => navigate(`/partida/${sessao.codigo}`)}
              icone={<Play size={16} aria-hidden="true" />}
            >
              Voltar para a sessão
            </PrimaryButton>
            <SecondaryButton
              variante="neutro"
              onClick={sairDaSessao}
              carregando={saindo}
              icone={<LogOut size={16} aria-hidden="true" />}
            >
              Sair da sessão
            </SecondaryButton>
          </div>
          {erroSessao && <ErrorMessage className="mt-3">{erroSessao}</ErrorMessage>}
        </div>
      )}

      {/* Resumo de desempenho, quando houver dados */}
      {temHistorico && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card border border-line bg-surface p-4 text-center shadow-panel">
            <p className="font-display text-2xl font-bold text-primary tabular-nums">
              {resumo.recorde}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">Melhor pontuação</p>
          </div>
          <div className="rounded-card border border-line bg-surface p-4 text-center shadow-panel">
            <p className="font-display text-2xl font-bold text-primary tabular-nums">
              {resumo.jogos}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {resumo.jogos === 1 ? 'Partida jogada' : 'Partidas jogadas'}
            </p>
          </div>
        </div>
      )}

      {/* Cartao principal: jogar solo */}
      <button
        type="button"
        onClick={novoJogo}
        className="flex w-full items-center gap-4 rounded-card bg-primary p-5 text-left text-white shadow-brand transition-all duration-200 hover:bg-primary-dark active:scale-[0.99]"
      >
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-field bg-white/15"
        >
          <Play size={24} className="ml-0.5" fill="currentColor" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-bold">Jogar Solo</span>
          <span className="mt-0.5 block text-sm text-white/85">
            Responda perguntas no seu ritmo e suba no ranking solo
          </span>
        </span>
        <ChevronRight size={22} className="shrink-0" aria-hidden="true" />
      </button>

      {/* Demais acessos */}
      {DESTINOS.map(({ para, titulo, descricao, Icone }) => (
        <Link
          key={para}
          to={para}
          className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-panel transition-all duration-200 hover:border-primary/40 hover:shadow-raised active:scale-[0.99]"
        >
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-field bg-primary-light text-primary"
          >
            <Icone size={24} strokeWidth={1.9} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-semibold text-primary-dark">
              {titulo}
            </span>
            <span className="mt-0.5 block text-sm text-text-muted">{descricao}</span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-text-muted" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
