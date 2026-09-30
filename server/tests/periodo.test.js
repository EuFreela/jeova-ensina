const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizar, filtro, rotulo } = require('../src/utils/periodo');

const DIA = 24 * 60 * 60 * 1000;

/** Extrai a data do `where` devolvido, seja `Op.gte` direto ou aninhado. */
function dataDe(condicao) {
  const { Op } = require('sequelize');
  const operador = condicao[Op.gte] || condicao[Op.gt];
  return operador instanceof Date ? operador : null;
}

test('periodo desconhecido cai no geral, sem erro', () => {
  assert.equal(normalizar(undefined), 'tudo');
  assert.equal(normalizar(null), 'tudo');
  assert.equal(normalizar(''), 'tudo');
  assert.equal(normalizar('xadrez'), 'tudo');
  assert.equal(normalizar(123), 'tudo');
});

test('os periodos conhecidos passam como estao', () => {
  assert.equal(normalizar('7'), '7');
  assert.equal(normalizar('30'), '30');
  assert.equal(normalizar('365'), '365');
  assert.equal(normalizar('tudo'), 'tudo');
});

test('o periodo geral nao vira um filtro de data', () => {
  // Um `>= 1970` seria sempre verdade, mas ainda assim entraria no WHERE e
  // derrubaria o uso do indice de created_at sem consultar nada.
  assert.deepEqual(filtro('tudo'), {});
  assert.deepEqual(filtro('xadrez'), {});
});

test('cada periodo recua exatamente a quantidade de dias prometida', () => {
  const agora = new Date('2026-03-15T12:00:00.000Z');

  for (const [chave, dias] of [['7', 7], ['30', 30], ['365', 365]]) {
    const desde = dataDe(filtro(chave, agora).created_at);
    assert.ok(desde, `o periodo ${chave} precisa filtrar por data`);
    const esperado = agora.getTime() - dias * DIA;
    // 1ms de folga: o calculo passa por Date, e nao por inteiro exato.
    assert.ok(
      Math.abs(desde.getTime() - esperado) < 1000,
      `${chave}: esperava ${new Date(esperado).toISOString()}, veio ${desde.toISOString()}`
    );
  }
});

test('a janela desliza: o mesmo periodo muda de data com o tempo', () => {
  const cedo = dataDe(filtro('30', new Date('2026-01-01T00:00:00Z')).created_at);
  const tarde = dataDe(filtro('30', new Date('2026-06-01T00:00:00Z')).created_at);
  assert.ok(tarde.getTime() > cedo.getTime(), 'o corte tem de acompanhar a data de hoje');
});

test('todo periodo tem rotulo legivel', () => {
  assert.equal(rotulo('tudo'), 'Geral');
  assert.equal(rotulo('7'), '7 dias');
  assert.equal(rotulo('30'), '30 dias');
  assert.equal(rotulo('365'), '1 ano');
  assert.equal(rotulo('lixo'), 'Geral');
});
