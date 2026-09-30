const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizar } = require('../src/utils/texto');

test('ignora diferenca de maiusculas', () => {
  assert.equal(normalizar('Belem'), normalizar('belem'));
  assert.equal(normalizar('BELÉM'), normalizar('belém'));
});

test('nao remove acentos, porque as opcoes vem de botoes', () => {
  // Documenta o comportamento real: lower + espacos, e nada de acento.
  assert.equal(normalizar('Êxodo'), 'êxodo');
  assert.notEqual(normalizar('Êxodo'), normalizar('Exodo'));
});

test('colapsa espacos, mas nao remove espaco ao redor de pontuacao', () => {
  assert.equal(normalizar('  Joao   3: 16  '), 'joao 3: 16');
  assert.notEqual(normalizar('Joao 3: 16'), normalizar('Joao 3:16'));
});

test('colapsa espacos extras', () => {
  assert.equal(normalizar('  Joao   3:16  '), 'joao 3:16');
  assert.equal(normalizar('a\t\tb'), 'a b');
});

test('trata valores ausentes sem quebrar', () => {
  assert.equal(normalizar(null), '');
  assert.equal(normalizar(undefined), '');
  assert.equal(normalizar(''), '');
});

test('duas respostas iguais com formatacao diferente sao equivalentes', () => {
  assert.equal(normalizar('  First  CORNERS  '), normalizar('First Corners'));
});
