const test = require('node:test');
const assert = require('node:assert/strict');

const { gerarSenha } = require('../src/utils/senha');
const {
  TAMANHO_CODIGO,
  VALIDADE_CODIGO_MINUTOS,
  gerarCodigo,
  codigoValido,
  expirarCodigo,
  codigoExpirou,
} = require('../src/utils/codigo');

test('a senha gerada respeita o tamanho pedido', () => {
  assert.equal(gerarSenha(14).length, 14);
  assert.equal(gerarSenha(20).length, 20);
  assert.equal(gerarSenha(8).length, 8);
});

test('a senha evita caracteres ambiguos', () => {
  // I, l, O, 0 e 1 confundem na digitacao e por isso ficam de fora.
  for (let i = 0; i < 50; i += 1) {
    assert.doesNotMatch(gerarSenha(24), /[IlO01]/);
  }
});

test('senhas seguidas sao diferentes', () => {
  const senhas = new Set(Array.from({ length: 100 }, () => gerarSenha(16)));
  assert.ok(senhas.size > 95, 'esperava quase todas distintas');
});

test('o codigo inicial tem 4 digitos e nunca comeca com zero', () => {
  assert.equal(TAMANHO_CODIGO, 4);
  for (let i = 0; i < 200; i += 1) {
    const codigo = gerarCodigo();
    assert.match(codigo, /^\d{4}$/);
    assert.notEqual(codigo[0], '0', 'um codigo comecando em zero seria ambíguo');
  }
});

test('a validacao do codigo aceita so 4 digitos', () => {
  assert.equal(codigoValido('4821'), true);
  assert.equal(codigoValido('123'), false);
  assert.equal(codigoValido('12345'), false);
  assert.equal(codigoValido('48a1'), false);
  assert.equal(codigoValido(' 481'), false);
  assert.equal(codigoValido(4821), false, 'numero puro nao e o formato guardado');
  assert.equal(codigoValido(null), false);
  assert.equal(codigoValido(undefined), false);
});

test('a expiracao do codigo usa a validade de 5 minutos', () => {
  assert.equal(VALIDADE_CODIGO_MINUTOS, 5);
  const agora = Date.now();
  const limite = expirarCodigo().getTime();
  const esperado = agora + 5 * 60 * 1000;
  assert.ok(Math.abs(limite - esperado) < 1000);
});

test('usuario sem prazo nao e considerado expirado', () => {
  assert.equal(codigoExpirou({ senha_expira_em: null }), false);
  assert.equal(codigoExpirou({}), false);
});

test('codigo com prazo no passado esta expirado, no futuro nao', () => {
  const passado = new Date(Date.now() - 1000);
  const futuro = new Date(Date.now() + 60 * 60 * 1000);
  assert.equal(codigoExpirou({ senha_expira_em: passado }), true);
  assert.equal(codigoExpirou({ senha_expira_em: futuro }), false);
});
