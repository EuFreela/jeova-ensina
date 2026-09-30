const { Op } = require('sequelize');

/**
 * Filtro de periodo compartilhado pelo ranking e pelo historico do jogador.
 *
 * Antes, o cliente exibia "os filtros por periodo chegam em breve" e nao
 * existia nada no servidor para atender. Os dois lugares precisam cair
 * exatamente na mesma janela, senao a posicao mostrada no ranking e os
 * numeros do perfil contariam partidas diferentes.
 *
 * Os rotulos sao em dias porque nao ha "semana" ou "mes" universais: um mes
 * tem 28, 29, 30 ou 31 dias, e um filtro "este mes" que vira no dia 31
 * mostraria um resultado diferente do que a tela diz.
 */
const PERIODOS = {
  tudo: null,
  7: 7,
  30: 30,
  365: 365,
};

const ROTULOS = {
  tudo: 'Geral',
  7: '7 dias',
  30: '30 dias',
  365: '1 ano',
};

/** O periodo pedido existe? Devolve o padrao quando nao. */
function normalizar(valor) {
  const chave = String(valor ?? 'tudo');
  return Object.prototype.hasOwnProperty.call(PERIODOS, chave) ? chave : 'tudo';
}

/**
 * Condicao de `created_at` para o periodo, pronta para virar parte de um
 * `where`. Devolve `{}` para o periodo geral: ai o filtro some em vez de
 * virar um `>= 1970` que atrapalha o indice de `created_at`.
 */
function filtro(valor, agora = new Date()) {
  const chave = normalizar(valor);
  const dias = PERIODOS[chave];
  if (!dias) return {};

  // Janela deslizante, e nao "dia N do mes". "30 dias" precisa continuar
  // significando os ultimos 30 dias amanha tambem.
  const desde = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
  return { created_at: { [Op.gte]: desde } };
}

/** Rotulo legivel, para a tela. */
function rotulo(valor) {
  return ROTULOS[normalizar(valor)];
}

module.exports = { PERIODOS, ROTULOS, normalizar, filtro, rotulo };