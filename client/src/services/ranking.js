import api from './api';

/**
 * Ranking separado por modo: 'solo' (jogo individual) e 'campeonato'
 * (disputa com outras pessoas). Sao listas distintas porque a pontuacao
 * de um campeonato so vale na comparacao com quem jogou junto.
 *
 * `periodo` e uma janela deslizante em dias ('tudo' | '7' | '30' | '365').
 * O servidor normaliza valor desconhecido para 'tudo', entao nao ha risco
 * de a tela pedir uma janela que o banco nao entende.
 */
export async function buscarRanking(modo = 'solo', periodo = 'tudo') {
  const { data } = await api.get('/pontuacoes/ranking', { params: { modo, periodo } });
  return data;
}
