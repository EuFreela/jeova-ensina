import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, Medal, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { salvarPontuacao } from '../services/perguntas';
import Card from '../components/ui/Card';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import ScoreSummary from '../components/ui/ScoreSummary';
import ErrorMessage from '../components/ui/ErrorMessage';

function faixa(percentual) {
  if (percentual >= 90) {
    return {
      Icone: Trophy,
      cor: 'text-accent',
      fundo: 'bg-accent/15',
      titulo: 'Excelente!',
      mensagem: 'Você conhece muito bem as Escrituras. Continue assim!',
    };
  }
  if (percentual >= 70) {
    return {
      Icone: Medal,
      cor: 'text-primary',
      fundo: 'bg-primary-light',
      titulo: 'Muito bem!',
      mensagem: 'Ótimo desempenho. Você está no caminho certo.',
    };
  }
  if (percentual >= 50) {
    return {
      Icone: Sparkles,
      cor: 'text-primary',
      fundo: 'bg-primary-light',
      titulo: 'Bom resultado.',
      mensagem: 'Cada partida ensina algo novo. Vamos melhorar juntos.',
    };
  }
  return {
    Icone: BookOpen,
    cor: 'text-secondary',
    fundo: 'bg-background',
    titulo: 'Continue estudando.',
    mensagem: 'O aprendizado vem com a prática. Tente novamente!',
  };
}

function AnelProgresso({ percentual }) {
  const raio = 52;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = Math.max(0, Math.min(100, percentual));

  return (
    <svg
      viewBox="0 0 120 120"
      className="size-32 shrink-0"
      role="img"
      aria-label={`${percentual}% de acertos`}
    >
      <circle
        cx="60"
        cy="60"
        r={raio}
        fill="none"
        strokeWidth="10"
        className="stroke-primary-light"
      />
      <circle
        cx="60"
        cy="60"
        r={raio}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        className="stroke-primary"
        strokeDasharray={`${(preenchido / 100) * circunferencia} ${circunferencia}`}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-primary-dark font-display text-2xl font-bold"
      >
        {percentual}%
      </text>
    </svg>
  );
}

export default function Resultado() {
  const navigate = useNavigate();
  const {
    config,
    ultimoResultado,
    salvando,
    erroSalvar,
    registrarResultado,
    definirSalvamento,
    iniciarPartida,
  } = useGame();

  const resultado = ultimoResultado;
  const pontos = resultado?.pontos ?? 0;

  useEffect(() => {
    if (!resultado) return undefined;
    const anterior = document.title;
    document.title = `Resultado — ${pontos} pts | Jeová Ensina`;
    return () => {
      document.title = anterior;
    };
  }, [resultado, pontos]);

  if (!resultado) return <Navigate to="/inicio" replace />;

  const total = resultado.total || 0;
  const acertos = resultado.acertos || 0;
  const erros = Math.max(0, total - acertos);
  const percentual = total ? Math.round((acertos / total) * 100) : 0;
  const { Icone, cor, fundo, titulo, mensagem } = faixa(percentual);

  async function tentarSalvarNovamente() {
    const respostas = resultado.respostas || [];
    const payload = respostas
      .filter((r) => r.perguntaId != null)
      .map((r) => ({ perguntaId: r.perguntaId, resposta: r.opcaoEscolhida ?? '' }));

    definirSalvamento({ carregando: true, erro: null });
    try {
      const { resumo } = await salvarPontuacao(payload);
      registrarResultado({
        ...resultado,
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
  }

  function jogarNovamente() {
    definirSalvamento({ carregando: false, erro: null });
    iniciarPartida({
      total: config.total,
      categoria: config.categoria,
      dificuldade: config.dificuldade,
      tempoPorQuestao: config.tempoPorQuestao,
      vidas: config.vidas,
    });
    navigate('/quiz');
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Celebracao */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          aria-hidden="true"
          className={`grid size-16 place-items-center rounded-full ${fundo} ${cor}`}
        >
          <Icone size={32} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-dark">
            {resultado.motivo === 'vidas' ? 'Fim de Jogo' : 'Parabéns!'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {resultado.motivo === 'vidas'
              ? 'Suas vidas acabaram, mas cada rodada ensina algo.'
              : 'Você concluiu o jogo!'}
          </p>
        </div>
      </div>

      {/* Desempenho */}
      <Card className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <AnelProgresso percentual={percentual} />
        <div className="w-full sm:max-w-xs">
          <ScoreSummary
            pontuacao={pontos}
            acertos={acertos}
            erros={erros}
            percentual={percentual}
          />
        </div>
      </Card>

      {/* Incentivo */}
      <div className={`rounded-card border border-line p-5 ${fundo}`}>
        <p className={`font-display text-base font-semibold ${cor}`}>{titulo}</p>
        <p className="mt-1 text-sm text-secondary">{mensagem}</p>
      </div>

      {/* Combos */}
      {(resultado.comboMaximo > 1 || resultado.bonusTotal > 0) && (
        <div className="flex flex-wrap gap-2">
          {resultado.comboMaximo > 1 && (
            <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
              Melhor combo: {resultado.comboMaximo}
            </span>
          )}
          {resultado.bonusTotal > 0 && (
            <span className="rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">
              Bônus de combo: +{resultado.bonusTotal}
            </span>
          )}
        </div>
      )}

      {/* Estado de salvamento */}
      {salvando && <p className="text-center text-sm text-text-muted">Salvando pontuação...</p>}

      {erroSalvar && (
        <div className="flex flex-col gap-3">
          <ErrorMessage>{erroSalvar}</ErrorMessage>
          {resultado.origem === 'api' && !resultado.salvo && (
            <SecondaryButton onClick={tentarSalvarNovamente} className="self-center">
              Tentar novamente
            </SecondaryButton>
          )}
        </div>
      )}

      {resultado.salvo && (
        <p className="text-center text-sm font-medium text-success">
          Pontuação salva no ranking!
        </p>
      )}

      {/* Acoes */}
      <div className="flex flex-col gap-2.5">
        <PrimaryButton
          tamanho="lg"
          larguraTotal
          onClick={jogarNovamente}
          icone={<RotateCcw size={18} aria-hidden="true" />}
        >
          Jogar Novamente
        </PrimaryButton>
        <div className="grid grid-cols-2 gap-2.5">
          <SecondaryButton onClick={() => navigate('/ranking')} larguraTotal>
            Ver Ranking
          </SecondaryButton>
          <SecondaryButton onClick={() => navigate('/inicio')} larguraTotal>
            Voltar ao Início
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
