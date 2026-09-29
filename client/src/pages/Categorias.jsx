import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Layers, Play, Target } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { buscarCategorias, verificarCategoria } from '../services/perguntas';
import { metadadosDeCategoria } from '../services/categorias';
import CategoryCard from '../components/ui/CategoryCard';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import IlustraCategoria from '../components/illustrations/IlustraCategoria';

const QUANTIDADES = [5, 10, 15, 20];
const DIFICULDADES = [
  { chave: 'todas', rotulo: 'Misto' },
  { chave: 'facil', rotulo: 'Fácil' },
  { chave: 'medio', rotulo: 'Médio' },
  { chave: 'dificil', rotulo: 'Difícil' },
];
const TEMPOS = [
  { valor: 0, rotulo: 'Sem limite' },
  { valor: 30, rotulo: '30 segundos' },
];

function GrupoOpcoes({ titulo, Icone, children }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
        <Icone size={16} className="text-primary" aria-hidden="true" />
        {titulo}
      </p>
      {children}
    </div>
  );
}

export default function Categorias() {
  const navigate = useNavigate();
  const { iniciarPartida } = useGame();

  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [selecionada, setSelecionada] = useState('todas');
  const [disponibilidade, setDisponibilidade] = useState(true);
  const [verificando, setVerificando] = useState(false);

  const [total, setTotal] = useState(10);
  const [dificuldade, setDificuldade] = useState('todas');
  const [tempoPorQuestao, setTempoPorQuestao] = useState(30);

  const opcoes = useMemo(() => ['todas', ...categorias], [categorias]);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const lista = await buscarCategorias();
      setCategorias(lista);
    } catch {
      setErro('Não foi possível carregar as categorias.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // Confirma a disponibilidade sempre que a selecao muda.
  useEffect(() => {
    let cancelado = false;
    setVerificando(true);

    verificarCategoria(selecionada)
      .then((resultado) => {
        if (!cancelado) setDisponibilidade(resultado);
      })
      .finally(() => {
        if (!cancelado) setVerificando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [selecionada]);

  function comecar() {
    iniciarPartida({
      total,
      categoria: selecionada,
      dificuldade,
      tempoPorQuestao,
    });
    navigate('/quiz');
  }

  const bloqueado = verificando || disponibilidade === false;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-dark sm:text-3xl">
          Escolher Categoria
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Selecione o tema das perguntas antes de começar.
        </p>
      </div>

      {erro && (
        <div className="flex flex-col gap-3">
          <ErrorMessage>{erro}</ErrorMessage>
          <SecondaryButton onClick={carregar} className="self-start">
            Tentar novamente
          </SecondaryButton>
        </div>
      )}

      {carregando ? (
        <LoadingState mensagem="Carregando categorias..." />
      ) : (
        <div className="flex flex-col gap-2.5" role="listbox" aria-label="Categorias">
          {opcoes.map((chave) => {
            const { rotulo, descricao } = metadadosDeCategoria(chave);
            const ehSelecionada = selecionada === chave;
            const vazia = ehSelecionada && disponibilidade === false;

            return (
              <CategoryCard
                key={chave}
                titulo={chave === 'todas' ? 'Todas as categorias' : rotulo}
                descricao={chave === 'todas' ? 'Perguntas mistas de todos os temas' : descricao}
                miniatura={<IlustraCategoria categoria={chave} />}
                selecionada={ehSelecionada}
                vazia={vazia}
                onSelecionar={() => setSelecionada(chave)}
              />
            );
          })}

          {!opcoes.length && (
            <EmptyState
              icone={<BookOpen size={22} />}
              titulo="Nenhuma categoria disponível"
              descricao="Assim que houver perguntas cadastradas, elas aparecerão aqui."
            />
          )}
        </div>
      )}

      {/* Configuracao da partida */}
      <div className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 shadow-panel">
        <GrupoOpcoes titulo="Quantidade de perguntas" Icone={Layers}>
          <div className="grid grid-cols-4 gap-2">
            {QUANTIDADES.map((qtd) => (
              <button
                key={qtd}
                type="button"
                aria-pressed={total === qtd}
                onClick={() => setTotal(qtd)}
                className={[
                  'min-h-11 rounded-field border text-sm font-semibold transition-colors',
                  total === qtd
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-line bg-surface text-secondary hover:border-primary/40',
                ].join(' ')}
              >
                {qtd}
              </button>
            ))}
          </div>
        </GrupoOpcoes>

        <GrupoOpcoes titulo="Dificuldade" Icone={Target}>
          <div className="grid grid-cols-4 gap-2">
            {DIFICULDADES.map(({ chave, rotulo }) => (
              <button
                key={chave}
                type="button"
                aria-pressed={dificuldade === chave}
                onClick={() => setDificuldade(chave)}
                className={[
                  'min-h-11 rounded-field border px-1 text-xs font-semibold transition-colors sm:text-sm',
                  dificuldade === chave
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-line bg-surface text-secondary hover:border-primary/40',
                ].join(' ')}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </GrupoOpcoes>

        <GrupoOpcoes titulo="Tempo por pergunta" Icone={Clock}>
          <div className="grid grid-cols-2 gap-2">
            {TEMPOS.map(({ valor, rotulo }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={tempoPorQuestao === valor}
                onClick={() => setTempoPorQuestao(valor)}
                className={[
                  'min-h-11 rounded-field border text-sm font-semibold transition-colors',
                  tempoPorQuestao === valor
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-line bg-surface text-secondary hover:border-primary/40',
                ].join(' ')}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </GrupoOpcoes>

        {disponibilidade === false && (
          <ErrorMessage>
            Esta categoria ainda não tem perguntas disponíveis. Escolha outra para começar.
          </ErrorMessage>
        )}

        <PrimaryButton
          tamanho="lg"
          larguraTotal
          onClick={comecar}
          carregando={verificando}
          desabilitado={bloqueado}
          icone={<Play size={18} aria-hidden="true" />}
        >
          Começar
        </PrimaryButton>
      </div>
    </div>
  );
}
