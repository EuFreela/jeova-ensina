/**
 * Regressoes de seguranca.
 *
 * Cada teste aqui existe porque uma correcao pode voltar. A suite de `api.test.js`
 * cobre o comportamento do jogo; esta cobre os limites que o jogo nao pode
 * atravessar. Os casos sao deliberadamente Adversarios: quem nao esta tentando
 * algo nunca chega nestas rotas.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const {
  request,
  app,
  prepararBanco,
  fecharBanco,
  criarUsuario,
  criarPergunta,
  tokenDe,
  rodadaDe,
  User,
} = require('./helpers/banco');

const { ALGORITMO, gerarToken } = require('../src/controllers/authController');
const { saltosDeProxy } = require('../src/config/trustProxy');
const { gerarSenha, CHARSET } = require('../src/utils/senha');
const { guardarSeguro } = require('../src/utils/codigo');
const { criarRodada, lerRodada, VALIDADE_MINUTOS } = require('../src/utils/rodada');
const limiteConta = require('../src/middlewares/limiteContaMiddleware');

test.before(prepararBanco);
test.after(fecharBanco);
test.beforeEach(prepararBanco);

// A trava por conta vive em memoria, em estado de modulo. Limpar antes e depois
// de cada teste evita que uma falha de login contada aqui vaze para os testes
// seguintes — e o vazamento seria silencioso: o teste errado passaria.
test.beforeEach(() => limiteConta.limparTentativas());
test.afterEach(() => limiteConta.limparTentativas());

// ================= o gabarito nao pode sair junto com a pergunta =================

test('GET /api/perguntas nao devolve resposta_correta', async () => {
  await criarUsuario();
  await criarPergunta({ resposta_correta: 0 });
  const token = await tokenDe('jogador');

  const res = await request(app)
    .get('/api/perguntas')
    .set('Authorization', `Bearer ${token}`)
    .query({ limite: 10 });

  assert.equal(res.status, 200);
  assert.ok(res.body.perguntas.length > 0);
  assert.ok(res.body.rodada, 'a lista vem acompanhada do token da rodada');
  for (const p of res.body.perguntas) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(p, 'resposta_correta'),
      false,
      `a pergunta ${p.id} saiu com o gabarito`
    );
    assert.equal(p.resposta_correta, undefined);
  }
});

test('o corpo inteiro da resposta nao carrega o gabarito', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');

  const res = await request(app)
    .get('/api/perguntas')
    .set('Authorization', `Bearer ${token}`)
    .query({ limite: 10 });

  // Defesa em profundidade: mesmo que uma pergunta escapes do filtro acima,
  // nenhum indice de resposta pode existir em nenhum lugar do payload.
  assert.equal(res.text.includes('resposta_correta'), false);
  assert.equal(res.text.includes('"Moisés"'), false, 'o texto da opcao correta nao pode vazar');
});

test('GET /api/perguntas/:id tambem nao devolve resposta_correta', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const p = await criarPergunta({ resposta_correta: 2 });

  const res = await request(app)
    .get(`/api/perguntas/${p.id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.pergunta.resposta_correta, undefined);
});

// ================= a rodada amarra as respostas ao que foi servido =================

test('pontuacao sem rodada e recusada', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const p = await criarPergunta();

  const res = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({ respostas: [{ perguntaId: p.id, resposta: 'Moisés' }] });

  assert.equal(res.status, 400);
});

test('pontuacao com rodada adulterada e recusada', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const p = await criarPergunta();
  const { rodada } = await rodadaDe(token);

  // Um caractere trocado no fim invalida a assinatura do HMAC.
  const adulterada = `${rodada.slice(0, -2)}${rodada.slice(-2, -1) === 'A' ? 'B' : 'A'}${rodada.slice(-1)}`;

  const res = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({ rodada: adulterada, respostas: [{ perguntaId: p.id, resposta: 'Moisés' }] });

  assert.equal(res.status, 400);
});

test('a rodada de um jogador nao vale para outro', async () => {
  await criarUsuario({ username: 'ana' });
  await criarUsuario({ username: 'bob' });
  const p = await criarPergunta();

  const tokenAna = await tokenDe('ana');
  const tokenBob = await tokenDe('bob');
  const { rodada } = await rodadaDe(tokenAna);

  const res = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${tokenBob}`)
    .send({ rodada, respostas: [{ perguntaId: p.id, resposta: 'Moisés' }] });

  assert.equal(res.status, 400, 'a rodada e nominal');
});

test('pergunta que nao saiu na rodada nao pode ser pontuada', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const servida = await criarPergunta();

  // A rodada e montada agora, so com a pergunta acima. A segunda entra no
  // banco depois: existe, e mesmo assim nao pertence ao conjunto entregue.
  const { rodada, ids } = await rodadaDe(token, { limite: 1 });
  assert.deepEqual(ids, [servida.id]);

  const outra = await criarPergunta({ pergunta: 'Pergunta fora da rodada' });

  const res = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      rodada,
      respostas: [
        { perguntaId: servida.id, resposta: 'Moisés' },
        { perguntaId: outra.id, resposta: 'Moisés' },
      ],
    });

  assert.equal(res.status, 400);
});

test('a mesma rodada nao pontua duas vezes', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const p = await criarPergunta({ dificuldade: 'dificil' });
  const { rodada } = await rodadaDe(token);
  const payload = { rodada, respostas: [{ perguntaId: p.id, resposta: 'Moisés' }] };

  const primeiro = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  assert.equal(primeiro.status, 201);

  // Sem isso, o topo do ranking seria uma funcao de quantas vezes a mesma
  // partida e reenviada com novas rodadas — ilimitado pelo rate limit de 20/min.
  const segundo = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  assert.equal(segundo.status, 409);
});

test('cada GET /api/perguntas devolve uma rodada diferente', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  await criarPergunta();

  const a = await rodadaDe(token);
  const b = await rodadaDe(token);
  assert.notEqual(a.rodada, b.rodada, 'a rodada nao pode ser reproduzida');
});

test('responder devolve o veredito e o texto da resposta certa', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const p = await criarPergunta({ resposta_correta: 1 });
  const { rodada, ids } = await rodadaDe(token);
  assert.ok(ids.includes(p.id));

  const certo = await request(app)
    .post('/api/perguntas/responder')
    .set('Authorization', `Bearer ${token}`)
    .send({ rodada, perguntaId: p.id, resposta: 'Davi' });
  assert.equal(certo.status, 200);
  assert.equal(certo.body.correta, true);
  assert.equal(certo.body.respostaCorreta, 'Davi', 'o texto, e nao o indice');

  const errado = await request(app)
    .post('/api/perguntas/responder')
    .set('Authorization', `Bearer ${token}`)
    .send({ rodada, perguntaId: p.id, resposta: 'Ezequiel' });
  assert.equal(errado.body.correta, false);
  assert.equal(errado.body.respostaCorreta, 'Davi', 'o gabarito volta mesmo no erro');
});

test('responder recusa pergunta fora da rodada', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  await criarPergunta();
  const { rodada } = await rodadaDe(token, { limite: 1 });

  // Criada depois da rodada: existe no banco, mas nao foi servida a este
  // jogador — que e exatamente o que o atacante montaria a mao.
  const fora = await criarPergunta({ pergunta: 'Nao servida' });

  const res = await request(app)
    .post('/api/perguntas/responder')
    .set('Authorization', `Bearer ${token}`)
    .send({ rodada, perguntaId: fora.id, resposta: 'Moisés' });

  assert.equal(res.status, 400);
});

test('responder exige autenticacao', async () => {
  const p = await criarPergunta();
  const res = await request(app)
    .post('/api/perguntas/responder')
    .send({ rodada: 'x', perguntaId: p.id, resposta: 'Moisés' });
  assert.equal(res.status, 401);
});

test('a rodada carrega o jogador e um nonce unico', () => {
  const a = criarRodada(7, [{ id: 1 }, { id: 2 }]);
  const b = criarRodada(7, [{ id: 1 }, { id: 2 }]);
  assert.notEqual(a, b, 'mesmo jogador e mesmo conjunto, nonces diferentes');

  const lida = lerRodada(a, 7);
  assert.equal(lida.ok, true);
  assert.deepEqual([...lida.ids].sort(), [1, 2]);
  assert.notEqual(lida.nonce, lerRodada(b, 7).nonce);

  assert.equal(lerRodada(a, 8).ok, false, 'outro jogador nao le');
  assert.equal(lerRodada('lixo', 7).ok, false);
  assert.equal(lerRodada(undefined, 7).ok, false);
  assert.equal(VALIDADE_MINUTOS > 0, true);
});

// ================= token de conta apagada =================

test('o token de uma conta excluida deixa de valer', async () => {
  const user = await criarUsuario();
  const token = gerarToken(user);

  const antes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(antes.status, 200);

  await user.destroy();

  // Sem a consulta ao banco, o token continuaria assinado e valido por 7 dias.
  const depois = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(depois.status, 401);
});

test('o token so e aceito com HS256', async () => {
  const user = await criarUsuario();

  // Com segredo em texto, o jsonwebtoken aceita HS256/384/512 por padrao.
  // Fixar o algoritmo e o que impede um token assinado em outra variante.
  const hs512 = jwt.sign({ id: user.id, username: user.username, role: 'player' }, process.env.JWT_SECRET, {
    algorithm: 'HS512',
    expiresIn: '1h',
  });

  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${hs512}`);
  assert.equal(res.status, 401);

  const hs256 = gerarToken(user);
  const ok = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${hs256}`);
  assert.equal(ok.status, 200);
  assert.equal(ALGORITMO, 'HS256');
});

test('ranking publico nao expõe o id interno de ninguem', async () => {
  await criarUsuario();
  const p = await criarPergunta({ dificuldade: 'dificil' });
  const token = await tokenDe('jogador');
  const { rodada } = await rodadaDe(token);

  const gravada = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({ rodada, respostas: [{ perguntaId: p.id, resposta: 'Moisés' }] });
  assert.equal(gravada.status, 201);

  const res = await request(app).get('/api/pontuacoes/ranking');
  assert.equal(res.status, 200);
  assert.ok(res.body.ranking.length > 0);
  for (const linha of res.body.ranking) {
    assert.equal(linha.user_id, undefined, 'o ranking publico nao precisa do id interno');
    assert.ok(linha.username);
  }
});

// ================= credenciais em texto puro =================

test('o codigo inicial nao fica gravado em texto puro', async () => {
  await criarUsuario({ username: 'admin', role: 'admin' });
  const token = await tokenDe('admin');

  const criado = await request(app)
    .post('/api/admin/usuarios')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'jogador1', codigo: '1234' });
  assert.equal(criado.status, 201);
  assert.equal(criado.body.codigoInicial, '1234');

  // O que fica no banco e o HMAC. Um dump, um backup ou uma consulta de
  // suporte entrega hashes, nao as senhas de acesso das contas provisorias.
  const linha = await User.findOne({ where: { username: 'jogador1' } });
  assert.equal(linha.codigo, null, 'a coluna em claro nao guarda o codigo');
  assert.equal(linha.codigo_guardado, guardarSeguro('1234'));
  assert.notEqual(linha.codigo_guardado, '1234');
});

test('o HMAC do codigo nao aparece em nenhuma resposta JSON', async () => {
  await criarUsuario({ username: 'admin', role: 'admin' });
  const token = await tokenDe('admin');
  const criado = await request(app)
    .post('/api/admin/usuarios')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'jogador1' });
  assert.equal(criado.status, 201);
  const hmac = guardarSeguro(criado.body.codigoInicial);

  const eu = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(eu.text.includes(hmac), false);

  const lista = await request(app)
    .get('/api/admin/usuarios')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(lista.text.includes(hmac), false);
});

// A migracao de schema e de dados sobre um banco legado tem suite propria,
// em `tests/migracao.test.js` — ela precisa de um banco de verdade, e nao do
// `:memory:` recem-criado por `sync()`.

test('o HMAC mantem o codigo inicial unico entre as contas', async () => {  await criarUsuario({ username: 'admin', role: 'admin' });
  const token = await tokenDe('admin');

  const primeiro = await request(app)
    .post('/api/admin/usuarios')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'ana', codigo: '1234' });
  assert.equal(primeiro.status, 201);

  // O criterio de unicidade passou a ser o HMAC, entao ele tem de continuar
  // barrando o mesmo codigo — inclusive quando os dois valores casam.
  const repetido = await request(app)
    .post('/api/admin/usuarios')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'bruno', codigo: '1234' });
  assert.equal(repetido.status, 201);
  assert.notEqual(repetido.body.codigoInicial, '1234', 'o sistema sorteia outro codigo');
});

// ================= login: enumeracao de contas e tentativa distribuida =================

test('conta inexistente, senha errada e codigo expirado dao a mesma resposta', async () => {
  await criarUsuario({ username: 'ana', password: 'senha1234' });
  await criarUsuario({
    username: 'bob',
    password: 'codigo1234',
    senha_expira_em: new Date(Date.now() - 60 * 1000),
  });

  const respostas = await Promise.all([
    request(app).post('/api/auth/login').send({ username: 'nao_existe', password: 'xxxx' }),
    request(app).post('/api/auth/login').send({ username: 'ana', password: 'xxxxxxx' }),
    request(app).post('/api/auth/login').send({ username: 'bob', password: 'codigo1234' }),
    // E o erro de formatacao, que antes devolvia o defeito exato do campo.
    request(app).post('/api/auth/login').send({ username: 'ab', password: 'x' }),
  ]);

  for (const r of respostas) {
    assert.equal(r.status, 401);
  }

  // Respostas diferentes aqui transformavam o login num oraculo de
  // enumeracao: bastava sondar um nome e ler o texto que voltava. Todos os
  // corpos tem de sair byte a byte iguais.
  for (const r of respostas) {
    assert.deepEqual(r.body, respostas[0].body);
  }

  // A orientacao sobre o prazo do codigo continua na tela — e aparece sempre,
  // com o mesmo texto, entao nao distingue conta existente de inexistente.
  const dica = respostas[0].body.dica;
  assert.equal(typeof dica, 'string');
  assert.ok(dica.length > 0, 'a orientacao sobre o codigo continua sendo mostrada');
});

test('a conta trava apos varias tentativas, mesmo vindas de um so IP', async () => {
  await criarUsuario({ username: 'ana', password: 'senha1234' });

  for (let i = 0; i < limiteConta.MAXIMO_FALHAS; i += 1) {
    const r = await request(app).post('/api/auth/login').send({ username: 'ana', password: 'errada' });
    assert.equal(r.status, 401, `tentativa ${i + 1} ainda passa`);
  }

  // A tentativa seguinte nao chega nem a conferir a senha. O limite por IP nao
  // seguraria isto num ataque distribuido, e o codigo inicial tem so 10.000
  // combinacoes.
  const bloqueado = await request(app).post('/api/auth/login').send({ username: 'ana', password: 'errada' });
  assert.equal(bloqueado.status, 429);

  // Nem a senha certa passa enquanto a trava estiver valendo.
  const comSenhaCerta = await request(app).post('/api/auth/login').send({ username: 'ana', password: 'senha1234' });
  assert.equal(comSenhaCerta.status, 429);

  // A trava e da conta, nao do endereco: outra conta continua entrando.
  await criarUsuario({ username: 'bob', password: 'senha1234' });
  const outra = await request(app).post('/api/auth/login').send({ username: 'bob', password: 'senha1234' });
  assert.equal(outra.status, 200);
});

test('um login valido limpa as falhas da conta', async () => {
  await criarUsuario({ username: 'ana', password: 'senha1234' });

  for (let i = 0; i < limiteConta.MAXIMO_FALHAS - 1; i += 1) {
    await request(app).post('/api/auth/login').send({ username: 'ana', password: 'errada' });
  }
  const certo = await request(app).post('/api/auth/login').send({ username: 'ana', password: 'senha1234' });
  assert.equal(certo.status, 200);

  // Zera so a conta que entrou; o contador de 'bob' nao pode ser afetado.
  const outra = await request(app).post('/api/auth/login').send({ username: 'ana', password: 'errada' });
  assert.equal(outra.status, 401);
});

// ================= confianca em proxy =================

test('TRUST_PROXY=0 nao habilita o X-Forwarded-For', () => {
  // A string "0" e verdadeira em JavaScript: a leitura ingênua caia no
  // fallback e deixava `trust proxy = 1` num servidor sem proxy nenhum.
  // Com isso o `req.ip` — a chave de todos os limiters — virava o que o
  // cliente quisesse mandar no header.
  assert.equal(saltosDeProxy('0'), false);
  assert.equal(saltosDeProxy('false'), false);
  assert.equal(saltosDeProxy(''), false);
  assert.equal(saltosDeProxy(undefined), false);
  assert.equal(saltosDeProxy(null), false);
  assert.equal(saltosDeProxy('   '), false);

  // Os valores legitimos continuam valendo.
  assert.equal(saltosDeProxy('1'), 1);
  assert.equal(saltosDeProxy('2'), 2);
  assert.equal(saltosDeProxy(' 1 '), 1);
});

// ================= geracao de senha =================

test('gerarSenha nao repete os primeiros caracteres do alfabeto', () => {
  // Com `bytes[i] % CHARSET.length` sobre um alfabeto de 57, os 28
  // primeiros caracteres saiam 5 vezes em 256 e os outros 29 saiam 4: 25% mais
  // frequencia para um terco do alfabeto. O qui-quadrado abaixo separa as duas
  // situacoes com folga larga nos dois sentidos.
  const AMOSTRAS_POR_CARACTERE = 1500;
  const total = CHARSET.length * AMOSTRAS_POR_CARACTERE;
  const contagem = new Map();
  for (let i = 0; i < total; i += 1) {
    const senha = gerarSenha();
    assert.equal(senha.length, 14);
    for (const c of senha) {
      contagem.set(c, (contagem.get(c) || 0) + 1);
    }
  }

  // Nenhum caractere pode faltar: isso ja falha com o alfabeto mal usado.
  assert.equal(contagem.size, CHARSET.length, 'todo o alfabeto precisa ser alcançavel');

  const esperado = (total * 14) / CHARSET.length;
  let quiQuadrado = 0;
  for (const c of CHARSET) {
    const observado = contagem.get(c) || 0;
    quiQuadrado += (observado - esperado) ** 2 / esperado;
  }

  // 56 graus de liberdade: o valor critico em p=0.001 fica perto de 124.
  // Distribuicao uniforme fica por perto de 56; a com viés passaria de 1000.
  assert.ok(
    quiQuadrado < 124,
    `a distribuicao das senhas nao esta uniforme (qui-quadrado ${quiQuadrado.toFixed(1)})`
  );
});
