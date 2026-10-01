import api from './api';

/**
 * Envia as respostas e recebe a pontuacao recalculada pelo servidor.
 *
 * `rodada` e o token que veio de `buscarPerguntas`. Sem ele o servidor recusa a
 * partida: e ele que amarra as respostas a perguntas que ele mesmo entregou.
 */
export async function salvarPontuacao(respostas, modo = 'solo', rodada = null) {
  const { data } = await api.post('/pontuacoes', { respostas, modo, rodada });
  return data;
}

/**
 * Historico do proprio jogador, usado no perfil e no resumo de posicao.
 *
 * A lista vem paginada pelo servidor; o `resumo` que vem junto e sempre do
 * historico inteiro (ou do periodo pedido), nunca da pagina exibida — por
 * isso nao da para calcular o total somando `pontuacoes` no cliente.
 */
export async function buscarMinhasPontuacoes(modo, opcoes = {}) {
  const { periodo = 'tudo', pagina = 1, porPagina } = opcoes;
  const { data } = await api.get('/pontuacoes/eu', {
    params: { modo, periodo, pagina, porPagina },
  });
  return data;
}
