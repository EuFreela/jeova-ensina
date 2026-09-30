const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PONTOS_POR_DIFICULDADE,
  BONS_COMBOS,
  calcularPontuacao,
} = require('../src/utils/scoring');

const resposta = (correta, dificuldade = 'facil') => ({ correta, dificuldade });

test('acerto vale o valor da dificuldade', () => {
  assert.equal(PONTOS_POR_DIFICULDADE.facil, 10);
  assert.equal(PONTOS_POR_DIFICULDADE.medio, 20);
  assert.equal(PONTOS_POR_DIFICULDADE.dificil, 30);

  const r = calcularPontuacao([resposta(true, 'dificil')]);
  assert.equal(r.pontuacao, 30);
  assert.equal(r.acertos, 1);
  assert.equal(r.total_perguntas, 1);
});

test('dificuldade desconhecida cai em facil', () => {
  const r = calcularPontuacao([{ correta: true, dificuldade: 'impossivel' }]);
  assert.equal(r.pontuacao, PONTOS_POR_DIFICULDADE.facil);
});

test('acerto sem dificuldade informada vale o minimo', () => {
  const r = calcularPontuacao([{ correta: true }]);
  assert.equal(r.pontuacao, 10);
});

test('erro nao pontua e zera o combo', () => {
  const r = calcularPontuacao([resposta(true), resposta(false), resposta(true)]);
  // 10 + 0 + 10: o erro interrompeu a sequencia, entao nenhum bonus.
  assert.equal(r.pontuacao, 20);
  assert.equal(r.acertos, 2);
  assert.equal(r.bonusTotal, 0);
  assert.equal(r.comboMaximo, 1);
});

test('tres acertos seguidos dao bonus de 5', () => {
  const r = calcularPontuacao([resposta(true), resposta(true), resposta(true)]);
  assert.equal(r.bonusTotal, 5);
  assert.equal(r.comboMaximo, 3);
  // 10 + 10 + 10 + bonus de 5
  assert.equal(r.pontuacao, 35);
});

test('cinco acertos seguidos dao bonus de 15, e nao o de 3', () => {
  const r = calcularPontuacao(Array.from({ length: 5 }, () => resposta(true)));
  assert.equal(r.comboMaximo, 5);
  // bonus do 3 (+5) e do 5 (+15), somando 20
  assert.equal(r.bonusTotal, 20);
  assert.equal(r.pontuacao, 50 + 20);
});

test('a regra de bonus dispara uma unica vez por sequencia', () => {
  const regras = BONS_COMBOS.map((r) => r.sequencia);
  assert.deepEqual([...regras].sort((a, b) => a - b), [3, 5]);

  // Com 4 acertos, apenas a regra de 3 se aplica.
  const quatro = calcularPontuacao(Array.from({ length: 4 }, () => resposta(true)));
  assert.equal(quatro.bonusTotal, 5);
});

test('partida vazia nao quebra e devolve zero', () => {
  const r = calcularPontuacao([]);
  assert.equal(r.pontuacao, 0);
  assert.equal(r.acertos, 0);
  assert.equal(r.total_perguntas, 0);
  assert.equal(r.comboMaximo, 0);
});

test('os detalhes por pergunta batem com o total', () => {
  const r = calcularPontuacao([resposta(true, 'medio'), resposta(false, 'facil')]);
  assert.equal(r.detalhes.length, 2);
  assert.equal(r.detalhes[0].pontos, 20);
  assert.equal(r.detalhes[1].pontos, 0);
  assert.equal(
    r.detalhes.reduce((soma, d) => soma + d.pontos + d.bonus, 0),
    r.pontuacao
  );
});

test('o mapeamento de dificuldades externas sobrepoe a do item', () => {
  const externas = new Map([[1, 'dificil']]);
  const r = calcularPontuacao([{ correta: true, perguntaId: 1 }], externas);
  assert.equal(r.pontuacao, 30);
});
