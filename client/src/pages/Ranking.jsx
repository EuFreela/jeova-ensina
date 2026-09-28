import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../components/Botao';
import Card from '../components/Card';
import { buscarRanking } from '../services/perguntas';
import { extrairErro } from '../services/api';

const MEDALHAS = ['🥇', '🥈', '🥉'];

export default function Ranking() {
  const navigate = useNavigate();

  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await buscarRanking();
      setDados(resposta);
    } catch (e) {
      setErro(extrairErro(e, 'Não foi possível carregar o ranking.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3">
        <span className="size-8 animate-spin rounded-full border-3 border-primaria border-t-transparent" />
        <p className="text-texto-suave">Carregando ranking...</p>
      </div>
    );
  }

  const itens = dados?.ranking || [];

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-texto sm:text-3xl">Top 10</h1>
        <p className="mt-1 text-sm text-texto-suave">Melhores pontuações de todas as partidas</p>
      </div>

      {erro && (
        <div role="alert" className="rounded-xl border border-erro/40 bg-erro/10 px-4 py-3 text-sm text-erro">
          {erro}
        </div>
      )}

      {!erro && itens.length === 0 && (
        <Card className="text-center text-texto-suave">
          <p>Ninguém pontuou ainda.</p>
          <p className="mt-1 text-sm">Seja o primeiro a aparecer no ranking!</p>
        </Card>
      )}

      <ol className="flex flex-col gap-2.5">
        {itens.map((item) => (
          <li key={item.user_id}>
            <Card
              destaque={item.souEu}
              className={`animate-fade-in flex items-center gap-3 py-4 ${item.souEu ? 'ring-1 ring-primaria/40' : ''}`}
            >
              <span
                className={[
                  'grid size-10 shrink-0 place-items-center rounded-xl font-display font-bold',
                  item.souEu ? 'bg-primaria text-fundo' : 'bg-white/10 text-texto-suave',
                ].join(' ')}
                aria-label={`Posição ${item.posicao}`}
              >
                {MEDALHAS[item.posicao - 1] || item.posicao}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold text-texto">
                  {item.username}
                  {item.souEu && <span className="ml-2 text-xs text-primaria">(você)</span>}
                </p>
                <p className="text-xs text-texto-suave">
                  {item.acertos}/{item.total_perguntas} acertos · {item.jogos}{' '}
                  {item.jogos === 1 ? 'jogo' : 'jogos'}
                </p>
              </div>

              <span className="shrink-0 font-display text-lg font-bold text-primaria">
                {item.recorde}
                <span className="ml-0.5 text-xs font-medium text-texto-suave">pts</span>
              </span>
            </Card>
          </li>
        ))}
      </ol>

      {dados?.minhaPosicao && !itens.some((i) => i.souEu) && (
        <p className="text-center text-sm text-texto-suave">
          Sua posição: <span className="font-semibold text-primaria">{dados.minhaPosicao}º</span>
        </p>
      )}

      {erro && (
        <Botao variante="contorno" onClick={carregar} className="mx-auto">
          Tentar novamente
        </Botao>
      )}

      <Botao variante="contorno" onClick={() => navigate('/menu')} className="w-full">
        Voltar ao Menu
      </Botao>
    </div>
  );
}
