import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, KeyRound, LogOut, Pencil, ShieldCheck, Target, Trophy, UserRound, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useConfirmacao } from '../contexts/ConfirmacaoContext';
import { buscarMinhasPontuacoes } from '../services/perguntas';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import ErrorMessage from '../components/ui/ErrorMessage';
import LoadingState from '../components/ui/LoadingState';
import SecondaryButton from '../components/ui/SecondaryButton';

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

export default function Perfil() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const confirmar = useConfirmacao();

  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErro('');
      try {
        const resposta = await buscarMinhasPontuacoes();
        if (!cancelado) setDados(resposta);
      } catch {
        if (!cancelado) setErro('Não foi possível carregar suas estatísticas.');
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

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

  const totalAcertos = pontuacoes.reduce((soma, p) => soma + (p.acertos || 0), 0);
  const totalPerguntas = pontuacoes.reduce((soma, p) => soma + (p.total_perguntas || 0), 0);
  const taxa = totalPerguntas ? Math.round((totalAcertos / totalPerguntas) * 100) : null;

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

        <SecondaryButton
          larguraTotal
          desabilitado
          icone={<Pencil size={17} aria-hidden="true" />}
          title="Edição de dados disponível em breve"
        >
          Editar dados (em breve)
        </SecondaryButton>

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
