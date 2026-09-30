import api from './api';

/** Envia as respostas e recebe a pontuacao recalculada pelo servidor. */
export async function salvarPontuacao(respostas, modo = 'solo') {
  const { data } = await api.post('/pontuacoes', { respostas, modo });
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
