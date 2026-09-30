const test = require('node:test');
const assert = require('node:assert/strict');

const { origemLiberada, origensPermitidas, ehRedePrivada } = require('../src/config/origens');

/** Executa o teste com um ambiente controlado e devolve o estado anterior. */
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

test('reconhece faixas de rede domestica', () => {
  assert.equal(ehRedePrivada('localhost'), true);
  assert.equal(ehRedePrivada('127.0.0.1'), true);
  assert.equal(ehRedePrivada('192.168.0.14'), true);
  assert.equal(ehRedePrivada('10.1.2.3'), true);
  assert.equal(ehRedePrivada('172.16.0.1'), true);
  assert.equal(ehRedePrivada('172.31.255.1'), true);
  assert.equal(ehRedePrivada('meu-notebook.local'), true);
});

test('rejeita faixa publica e faixa que nao e privada', () => {
  assert.equal(ehRedePrivada('172.15.0.1'), false, '172.15 fica fora de 172.16-31');
  assert.equal(ehRedePrivada('172.32.0.1'), false);
  assert.equal(ehRedePrivada('8.8.8.8'), false);
  assert.equal(ehRedePrivada('jeovaensina.com.br'), false);
});

test('em producao so vale a lista de CLIENT_URL', () => {
  comEnv(
    { NODE_ENV: 'production', CLIENT_URL: 'https://app.exemplo.com' },
    () => {
      assert.equal(origemLiberada('https://app.exemplo.com'), true);
      assert.equal(origemLiberada('http://192.168.0.14:5173'), false, 'rede local nao entra em producao');
      assert.equal(origemLiberada('http://localhost:5173'), false);
      assert.equal(origemLiberada('https://outro.com'), false);
    }
  );
});

test('em desenvolvimento a rede local e liberada automaticamente', () => {
  comEnv({ NODE_ENV: 'development', CLIENT_URL: 'http://localhost:5173' }, () => {
    assert.equal(origemLiberada('http://192.168.0.14:5173'), true);
    assert.equal(origemLiberada('http://10.0.0.5:5173'), true);
    assert.equal(origemLiberada('http://qualquer.local:5173'), true);
    assert.equal(origemLiberada('https://site-publico.com'), false, 'origem publica continua bloqueada');
  });
});

test('CORS_LAN=true libera a rede local mesmo em producao', () => {
  comEnv({ NODE_ENV: 'production', CORS_LAN: 'true', CLIENT_URL: 'https://app.exemplo.com' }, () => {
    assert.equal(origemLiberada('http://192.168.0.14:5173'), true);
    assert.equal(origemLiberada('https://site-publico.com'), false);
  });
});

test('CORS_LAN=false bloqueia a rede local mesmo em desenvolvimento', () => {
  comEnv({ NODE_ENV: 'development', CORS_LAN: 'false', CLIENT_URL: 'http://localhost:5173' }, () => {
    assert.equal(origemLiberada('http://192.168.0.14:5173'), false);
    assert.equal(origemLiberada('http://localhost:5173'), true, 'continua valendo o que esta na lista');
  });
});

test('CLIENT_URL aceita varias origens separadas por virgula', () => {
  comEnv({ NODE_ENV: 'production', CLIENT_URL: 'https://a.com, https://b.com ,https://c.com' }, () => {
    assert.deepEqual(origensPermitidas(), ['https://a.com', 'https://b.com', 'https://c.com']);
    assert.equal(origemLiberada('https://b.com'), true);
    assert.equal(origemLiberada('https://d.com'), false);
  });
});

test('o curinga * casa com o host inteiro, nao com o texto', () => {
  comEnv({ NODE_ENV: 'production', CLIENT_URL: 'https://*.exemplo.com' }, () => {
    assert.equal(origemLiberada('https://app.exemplo.com'), true);
    assert.equal(origemLiberada('https://api.exemplo.com'), true);
    assert.equal(origemLiberada('https://exemplo.com'), false);
    assert.equal(origemLiberada('https://app.exemplo.com.br'), false);
    assert.equal(origemLiberada('https://mexemplo.com'), false, 'o curinga nao deve casar no meio');
  });
});

test('chamada sem Origin nao e bloqueio de CORS', () => {
  // curl, apps nativos e chamadas do mesmo host chegam sem Origin.
  comEnv({ NODE_ENV: 'production', CLIENT_URL: 'https://app.exemplo.com' }, () => {
    assert.equal(origemLiberada(undefined), true);
    assert.equal(origemLiberada(''), true);
  });
});

test('sem CLIENT_URL a lista cai no padrao de desenvolvimento', () => {
  comEnv({ NODE_ENV: 'production', CLIENT_URL: '' }, () => {
    // Padrao intencional do config/origens.js: sem configuracao, so o
    // localhost de desenvolvimento responde.
    assert.deepEqual(origensPermitidas(), ['http://localhost:5173']);
    assert.equal(origemLiberada('http://localhost:5173'), true);
    assert.equal(origemLiberada('http://192.168.0.14:5173'), false, 'rede local nao entra por consequencia');
    assert.equal(origemLiberada('https://app.exemplo.com'), false);
  });
});
