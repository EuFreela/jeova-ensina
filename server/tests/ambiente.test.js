const test = require('node:test');
const assert = require('node:assert/strict');

const { validarAmbiente, ehSegredoDeExemplo } = require('../src/config/ambiente');

const EXEMPLO = 'troque-este-segredo-por-um-valor-longo-e-aleatorio';
const BOM = 'a'.repeat(48);

/** Roda a validacao com um ambiente controlado e devolve o estado anterior. */
function comEnv(mudancas, fn) {
  const antes = {};
  for (const chave of Object.keys(mudancas)) {
    antes[chave] = process.env[chave];
    if (mudancas[chave] === undefined) delete process.env[chave];
    else process.env[chave] = mudancas[chave];
  }
  try {
    return fn();
  } finally {
    for (const chave of Object.keys(antes)) {
      if (antes[chave] === undefined) delete process.env[chave];
      else process.env[chave] = antes[chave];
    }
  }
}

// ---------- o que o servidor precisa para subir de pe ----------

test('sem JWT_SECRET o servidor recisa subir', () => {
  assert.throws(() => validarAmbiente({}), /JWT_SECRET nao definido/);
});

test('JWT_SECRET ausente tambem trava em producao, com mensagem propria', () => {
  assert.throws(
    () => validarAmbiente({ NODE_ENV: 'production' }),
    /JWT_SECRET e obrigatorio/
  );
});

// ---------- o segredo de exemplo e recusado em producao ----------

test('o segredo do .env.example nao passa em producao', () => {
  // Este era o furo real: o .env.example distribuia uma chave publica e o
  // servidor assinava token de administrador com ela, sem reclamar.
  assert.throws(
    () => validarAmbiente({ NODE_ENV: 'production', JWT_SECRET: EXEMPLO }),
    /valor de exemplo/
  );
});

test('o segredo de exemplo so vira aviso em desenvolvimento', () => {
  // Nao quebrar o `npm run iniciar` de quem ainda esta com o exemplo local.
  const { avisos } = validarAmbiente({ JWT_SECRET: EXEMPLO });
  assert.equal(avisos.length, 1);
  assert.match(avisos[0], /valor de exemplo/);
});

test('segredos de exemplo sao reconhecidos sem diferenciar caixa', () => {
  assert.equal(ehSegredoDeExemplo(EXEMPLO.toUpperCase()), true);
  assert.equal(ehSegredoDeExemplo('  ' + EXEMPLO + '  '), true);
  assert.equal(ehSegredoDeExemplo('changeme'), true);
  assert.equal(ehSegredoDeExemplo(''), true);
  assert.equal(ehSegredoDeExemplo(undefined), true);
  assert.equal(ehSegredoDeExemplo(BOM), false);
});

test('segredo curto demais e recusado em producao', () => {
  assert.throws(
    () => validarAmbiente({ NODE_ENV: 'production', JWT_SECRET: 'senha123' }),
    /ao menos 32 caracteres/
  );
});

test('segredo longo e proprio passa em producao sem aviso', () => {
  const resultado = validarAmbiente({ NODE_ENV: 'production', JWT_SECRET: BOM });
  assert.equal(resultado.producao, true);
  assert.deepEqual(resultado.avisos, []);
});

// ---------- avisos que nao derrubam o processo ----------

test('sqlite em producao gera aviso sem travar', () => {
  const { avisos } = validarAmbiente({
    NODE_ENV: 'production',
    JWT_SECRET: BOM,
    DATABASE_DIALECT: 'sqlite',
  });
  assert.equal(avisos.length, 1);
  assert.match(avisos[0], /sqlite/i);
});

test('EXIGIR_SEGREDO traz a exigencia de producao para desenvolvimento', () => {
  // CI e homologacao rodam com NODE_ENV=development mas nao podem aceitar
  // chave fraca; essa flag sobe o nivel sem precisar fingir producao.
  assert.throws(
    () => validarAmbiente({ JWT_SECRET: 'curta', EXIGIR_SEGREDO: 'true' }),
    /32 caracteres/
  );
});

// ---------- integracao com o processo real ----------

test('validarAmbiente le process.env por padrao', () => {
  comEnv({ JWT_SECRET: undefined }, () => {
    assert.throws(() => validarAmbiente(), /JWT_SECRET nao definido/);
  });
  comEnv({ JWT_SECRET: BOM }, () => {
    assert.deepEqual(validarAmbiente().avisos, []);
  });
});