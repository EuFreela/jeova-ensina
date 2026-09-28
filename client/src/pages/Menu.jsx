import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../components/Botao';
import Card from '../components/Card';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../contexts/GameContext';
import { buscarMinhasPontuacoes, buscarCategorias } from '../services/perguntas';

const QUANTIDADES = [5, 10, 15, 20];
const DIFICULDADES = [
  { valor: 'todas', label: 'Misto' },
  { valor: 'facil', label: 'Fácil' },
  { valor: 'medio', label: 'Médio' },
  { valor: 'dificil', label: 'Difícil' },
];

const ROTULO_CATEGORIA = {
  todas: 'Todas as categorias',
  livros: 'Livros',
  historia: 'História',
  personagens: 'Personagens',
  evangelhos: 'Evangelhos',
  milagres: 'Milagres',
  parabolas: 'Parábolas',
  profetas: 'Profetas',
  mandamentos: 'Mandamentos',
  sabedoria: 'Sabedoria',
  teologia: 'Teologia',
  geografia: 'Geografia',
};

export default function Menu() {
  const navigate = useNavigate();
  const { user, atualizarPerfil } = useAuth();
  const { iniciarPartida, reiniciar } = useGame();

  const [total, setTotal] = useState(10);
  const [dificuldade, setDificuldade] = useState('todas');
  const [categoria, setCategoria] = useState('todas');
  const [categorias, setCategorias] = useState([]);
  const [historico, setHistorico] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const [pontuacoes, listaCategorias] = await Promise.all([
          buscarMinhasPontuacoes(),
          buscarCategorias(),
        ]);
        if (cancelado) return;
        setHistorico(pontuacoes.resumo);
        if (listaCategorias.length) setCategorias(listaCategorias);
        const perfil = await atualizarPerfil();
        if (!cancelado && perfil?.recorde !== undefined) {
          setHistorico((atual) => ({ ...atual, recorde: perfil.recorde, pontosTotais: perfil.pontosTotais }));
        }
      } catch {
        /* falhas de rede não bloqueiam o menu */
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function jogar() {
    reiniciar();
    iniciarPartida({ total, dificuldade, categoria });
    navigate('/quiz');
  }

  const recorde = historico?.recorde ?? 0;
  const primeiroNome = user?.username?.split('_')[0] || user?.username || 'jogador';

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-slide-up">
        <h1 className="font-display text-2xl font-bold text-texto sm:text-3xl">
          Olá, {primeiroNome}!
        </h1>
        <p className="mt-1 text-texto-suave">Pronto para testar seus conhecimentos?</p>
      </div>

      <Card destaque className="animate-fade-in">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-texto-suave">Seu recorde</p>
            <p className="font-display text-4xl font-bold text-primaria">
              {carregando ? '—' : recorde}
              <span className="ml-1 text-lg font-medium text-texto-suave">pts</span>
            </p>
          </div>
          {historico?.jogos > 0 && (
            <div className="text-right text-sm text-texto-suave">
              <p>
                <span className="font-semibold text-texto">{historico.jogos}</span> jogos
              </p>
              <p>{historico.pontosTotais} pts acumulados</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="animate-fade-in flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="font-display text-sm font-medium text-texto-suave">
            Quantidade de perguntas
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {QUANTIDADES.map((qtd) => (
              <button
                key={qtd}
                type="button"
                onClick={() => setTotal(qtd)}
                aria-pressed={total === qtd}
                className={[
                  'rounded-xl py-2.5 font-display font-semibold transition-all duration-200',
                  total === qtd
                    ? 'bg-primaria text-fundo shadow-lg shadow-primaria/20'
                    : 'bg-white/5 text-texto-suave hover:bg-white/10',
                ].join(' ')}
              >
                {qtd}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-display text-sm font-medium text-texto-suave">Dificuldade</legend>
          <div className="grid grid-cols-4 gap-2">
            {DIFICULDADES.map((nivel) => (
              <button
                key={nivel.valor}
                type="button"
                onClick={() => setDificuldade(nivel.valor)}
                aria-pressed={dificuldade === nivel.valor}
                className={[
                  'rounded-xl py-2.5 font-display text-sm font-semibold transition-all duration-200',
                  dificuldade === nivel.valor
                    ? 'bg-primaria text-fundo shadow-lg shadow-primaria/20'
                    : 'bg-white/5 text-texto-suave hover:bg-white/10',
                ].join(' ')}
              >
                {nivel.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="categoria" className="font-display text-sm font-medium text-texto-suave">
            Categoria
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-fundo/70 px-4 py-3 text-texto transition-colors focus:border-primaria focus:outline-none"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {ROTULO_CATEGORIA[cat] || cat}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="flex animate-fade-in flex-col gap-3">
        <Botao tamanho="lg" onClick={jogar} className="w-full">
          Novo Jogo
        </Botao>
        <Botao variante="contorno" tamanho="lg" onClick={() => navigate('/ranking')} className="w-full">
          Ver Ranking
        </Botao>
      </div>
    </div>
  );
}
