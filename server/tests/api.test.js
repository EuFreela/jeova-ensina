const test = require('node:test');
const assert = require('node:assert/strict');

const {
  request,
  app,
  prepararBanco,
  fecharBanco,
  criarUsuario,
  criarPergunta,
  tokenDe,
  rodadaDe,
  reqRes,
  User,
  Pontuacao,
} = require('./helpers/banco');

const pontuacaoController = require('../src/controllers/pontuacaoController');

test.before(prepararBanco);
test.after(fecharBanco);

test.beforeEach(prepararBanco);

// ================= POST /api/pontuacoes — dedup por pergunta =================

test('repetir a MESMA pergunta nao infla a pontuacao', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const p = await criarPergunta({ dificuldade: 'dificil' }); // 30 pontos
  const { rodada } = await rodadaDe(token);

  // A mesma pergunta repetida 3 vezes no MESMO payload. Antes da correcao
  // cada ocorrencia entrava em `respostas` e o calculo somava 3 x 30 = 90
  // numa unica pergunta de 30 — o caminho mais curto para o topo do ranking.
  const res = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      rodada,
      respostas: [
        { perguntaId: p.id, resposta: 'Moisés' },
        { perguntaId: p.id, resposta: 'Moisés' },
        { perguntaId: p.id, resposta: 'Moisés' },
      ],
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.pontuacao.pontuacao, 30, 'a pergunta vale uma vez so');
  assert.equal(res.body.pontuacao.total_perguntas, 1);
});

test('50 repeticoes da resposta certa rendem o valor de UMA pergunta', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const p = await criarPergunta({ dificuldade: 'dificil' }); // 30 pontos
  const { rodada } = await rodadaDe(token);

  // 50 e exatamente o teto aceito por requisicao: o pior caso do ataque.
  const res = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      rodada,
      respostas: Array.from({ length: 50 }, () => ({ perguntaId: p.id, resposta: 'Moisés' })),
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.pontuacao.pontuacao, 30, 'nao 1500');
  assert.equal(res.body.pontuacao.total_perguntas, 1);
});

test('a dedup vale no payload inteiro, nao so em repeticoes exatas', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const p = await criarPergunta({ dificuldade: 'facil' }); // 10 pontos
  const { rodada } = await rodadaDe(token);

  const res = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      rodada,
      respostas: [
        { perguntaId: p.id, resposta: 'Moisés' },
        { perguntaId: String(p.id), resposta: 'Moisés' }, // mesmo id, outra forma
        { perguntaId: p.id, resposta: 'Davi' }, // mesma pergunta, resposta errada
      ],
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.pontuacao.pontuacao, 10, 'so a primeira ocorrencia conta');
  assert.equal(res.body.pontuacao.acertos, 1);
});

test('perguntas diferentes nao sao dedupadas entre si', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');
  const a = await criarPergunta({ dificuldade: 'facil' });
  const b = await criarPergunta({ dificuldade: 'medio' });
  const { rodada } = await rodadaDe(token);

  const res = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      rodada,
      respostas: [
        { perguntaId: a.id, resposta: 'Moisés' },
        { perguntaId: b.id, resposta: 'Moisés' },
      ],
    });

  assert.equal(res.body.pontuacao.pontuacao, 30, '10 + 20');
  assert.equal(res.body.pontuacao.total_perguntas, 2);
});

test('payload sem pergunta valida e recusado', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');

  const res = await request(app)
    .post('/api/pontuacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({ respostas: [{ perguntaId: 999999, resposta: 'Moisés' }] });

  assert.equal(res.status, 400);
});

test('salvar pontuacao exige autenticacao', async () => {
  const res = await request(app).post('/api/pontuacoes').send({ respostas: [] });
  assert.equal(res.status, 401);
});

// ================= GET /api/pontuacoes/eu — totais de vida toda =================

test('os totais do perfil cobrem a vida inteira, nao so a pagina exibida', async () => {
  const user = await criarUsuario();

  // 25 partidas de 10 pontos. Antes, a tela mostrava as 20 mais recentes e o
  // resumo era calculado sobre essas 20 — "200 pontos, 20 jogos" para quem
  // tinha 250 e 25, discordando do /api/auth/me.
  await Pontuacao.bulkCreate(
    Array.from({ length: 25 }, () => ({
      user_id: user.id,
      pontuacao: 10,
      acertos: 1,
      total_perguntas: 1,
      modo: 'solo',
    }))
  );

  const { req, res } = reqRes({ userId: user.id, query: {} });
  await pontuacaoController.minhas(req, res);

  assert.equal(res.corpo.pontuacoes.length, 10, 'a pagina traz so o tamanho pedido');
  assert.equal(res.corpo.resumo.jogos, 25, 'o total e da vida inteira');
  assert.equal(res.corpo.resumo.pontosTotais, 250);
  assert.equal(res.corpo.paginacao.total, 25);
  assert.equal(res.corpo.paginacao.temMais, true);
});

test('paginar percorre o historico inteiro sem buraco nem repeticao', async () => {
  const user = await criarUsuario();
  await Pontuacao.bulkCreate(
    Array.from({ length: 12 }, (_, i) => ({
      user_id: user.id,
      pontuacao: i + 1, // valor unico por partida
      acertos: 1,
      total_perguntas: 1,
      modo: 'solo',
    }))
  );

  const coletar = async (pagina) => {
    const { req, res } = reqRes({ userId: user.id, query: { pagina: String(pagina), porPagina: '5' } });
    await pontuacaoController.minhas(req, res);
    return res.corpo;
  };

  const primeira = await coletar(1);
  const segunda = await coletar(2);
  const terceira = await coletar(3);

  const ids = [...primeira.pontuacoes, ...segunda.pontuacoes, ...terceira.pontuacoes].map((p) => p.id);
  assert.equal(ids.length, 12, 'as tres paginas cobrem tudo');
  assert.equal(new Set(ids).size, 12, 'nenhuma partida repetida entre paginas');

  // Mais recentes primeiro: a ultima pagina e a mais antiga, com 1 e 2.
  assert.deepEqual(
    terceira.pontuacoes.map((p) => p.pontuacao),
    [2, 1]
  );
  assert.equal(terceira.paginacao.temMais, false);
});

test('o resumo por modo separa solo de campeonato', async () => {
  const user = await criarUsuario();
  await Pontuacao.bulkCreate([
    { user_id: user.id, pontuacao: 30, acertos: 3, total_perguntas: 3, modo: 'solo' },
    { user_id: user.id, pontuacao: 50, acertos: 5, total_perguntas: 5, modo: 'campeonato' },
    { user_id: user.id, pontuacao: 20, acertos: 2, total_perguntas: 2, modo: 'campeonato' },
  ]);

  const { req, res } = reqRes({ userId: user.id, query: {} });
  await pontuacaoController.minhas(req, res);

  assert.deepEqual(res.corpo.resumoPorModo.solo, { recorde: 30, pontosTotais: 30, jogos: 1 });
  assert.deepEqual(res.corpo.resumoPorModo.campeonato, { recorde: 50, pontosTotais: 70, jogos: 2 });
});

test('jogador sem partida nenhuma ve zero, nao erro', async () => {
  const user = await criarUsuario();
  const { req, res } = reqRes({ userId: user.id, query: {} });
  await pontuacaoController.minhas(req, res);

  assert.deepEqual(res.corpo.resumo, {
    recorde: 0,
    pontosTotais: 0,
    jogos: 0,
    acertosTotais: 0,
    perguntasTotais: 0,
  });
  assert.deepEqual(res.corpo.pontuacoes, []);
});

// ================= GET /api/pontuacoes/ranking — detalhe do recorde =================

test('o ranking traz os dados da melhor partida de cada jogador', async () => {
  const a = await criarUsuario({ username: 'ana' });
  const b = await criarUsuario({ username: 'bruno' });
  await Pontuacao.bulkCreate([
    { user_id: a.id, pontuacao: 20, acertos: 2, total_perguntas: 5, modo: 'solo' },
    { user_id: a.id, pontuacao: 80, acertos: 8, total_perguntas: 10, modo: 'solo' },
    { user_id: b.id, pontuacao: 50, acertos: 5, total_perguntas: 10, modo: 'solo' },
  ]);

  const res = await request(app).get('/api/pontuacoes/ranking?modo=solo');

  assert.equal(res.status, 200);
  // 3 partidas, mas 2 jogadores: o ranking agrupa por pessoa.
  assert.equal(res.body.ranking.length, 2);
  assert.equal(res.body.ranking[0].username, 'ana');
  assert.equal(res.body.ranking[0].recorde, 80);
  // O detalhe vem da partida de 80 pontos, nao da de 20 nem da ultima.
  assert.equal(res.body.ranking[0].acertos, 8);
  assert.equal(res.body.ranking[0].total_perguntas, 10);
  assert.equal(res.body.ranking[0].jogos, 2);
  assert.equal(res.body.ranking[1].username, 'bruno');
});

test('quem marcou o ranking solo como privado some da lista alheia', async () => {
  const a = await criarUsuario({ username: 'ana' });
  const b = await criarUsuario({ username: 'bruno', ranking_publico: false });
  await Pontuacao.bulkCreate([
    { user_id: a.id, pontuacao: 10, acertos: 1, total_perguntas: 1, modo: 'solo' },
    { user_id: b.id, pontuacao: 99, acertos: 9, total_perguntas: 10, modo: 'solo' },
  ]);

  const anonimo = await request(app).get('/api/pontuacoes/ranking?modo=solo');
  assert.deepEqual(
    anonimo.body.ranking.map((r) => r.username),
    ['ana'],
    'o privado nao aparece para quem nao e ele'
  );

  const token = await tokenDe('bruno');
  const eleMesmo = await request(app)
    .get('/api/pontuacoes/ranking?modo=solo')
    .set('Authorization', `Bearer ${token}`);
  assert.deepEqual(
    eleMesmo.body.ranking.map((r) => r.username),
    ['bruno', 'ana'],
    'mas continua vendo a propria posicao'
  );
});

test('modo invalido no ranking e recusado', async () => {
  const res = await request(app).get('/api/pontuacoes/ranking?modo=xadrez');
  assert.equal(res.status, 400);
});

test('ranking vazio responde com lista vazia, nao erro', async () => {
  await criarUsuario();
  const res = await request(app).get('/api/pontuacoes/ranking');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.ranking, []);
});

// ================= login e o codigo de 4 digitos =================

test('o codigo de 4 digitos e a senha inicial e vale por 5 minutos', async () => {
  await User.create({
    username: 'novato',
    password: '4321',
    codigo: '4321',
    role: 'player',
    senha_expira_em: new Date(Date.now() + 5 * 60 * 1000),
    must_change_password: true,
  });

  const res = await request(app).post('/api/auth/login').send({ username: 'novato', password: '4321' });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.must_change_password, true);
});

test('codigo expirado nao entra nem com a senha certa', async () => {
  await User.create({
    username: 'novato',
    password: '4321',
    codigo: '4321',
    role: 'player',
    senha_expira_em: new Date(Date.now() - 1000), // venceu
    must_change_password: true,
  });

  const res = await request(app).post('/api/auth/login').send({ username: 'novato', password: '4321' });
  assert.equal(res.status, 401);
});

test('a resposta de login nao devolve nem a senha nem o codigo', async () => {
  await criarUsuario();
  const res = await request(app).post('/api/auth/login').send({ username: 'jogador', password: 'senha1234' });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.password, undefined, 'a senha nao pode sair daqui');
  // O codigo de 4 digitos e metade da senha: quem o tem entra na conta.
  assert.equal(res.body.user.codigo, undefined);
});

test('/api/auth/me tambem nao devolve o codigo', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');

  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.password, undefined);
  assert.equal(res.body.user.codigo, undefined);
});

test('login inexistente e senha errada dao a mesma mensagem', async () => {
  await criarUsuario();
  const semConta = await request(app).post('/api/auth/login').send({ username: 'ninguem', password: 'x' });
  const senhaErrada = await request(app).post('/api/auth/login').send({ username: 'jogador', password: 'errada' });

  assert.equal(semConta.status, 401);
  assert.equal(senhaErrada.status, 401);
  // Mensagens diferentes confirmariam usernames validos, abaixo de 10^4.
  assert.equal(semConta.body.error, senhaErrada.body.error);
});

// ================= autenticacao e autorizacao =================

test('rota protegida recusa sem token, com token invalido e com token adulterado', async () => {
  const semToken = await request(app).get('/api/auth/me');
  assert.equal(semToken.status, 401);

  const invalido = await request(app).get('/api/auth/me').set('Authorization', 'Bearer nao.e.um.jwt');
  assert.equal(invalido.status, 401);

  await criarUsuario();
  const token = await tokenDe('jogador');
  const adulterado = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token.slice(0, -3)}aaa`);
  assert.equal(adulterado.status, 401);
});

test('jogador comum nao acessa as rotas de admin', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');

  const res = await request(app).get('/api/admin/usuarios').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test('admin acessa as rotas de admin', async () => {
  await criarUsuario({ username: 'chefe', role: 'admin' });
  const token = await tokenDe('chefe');

  const res = await request(app).get('/api/admin/usuarios').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.usuarios));
  assert.deepEqual(
    res.body.usuarios.map((u) => u.username),
    ['chefe']
  );
  // O codigo de 4 digitos e metade da senha: nao pode sair na listagem.
  assert.equal(res.body.usuarios[0].codigo, undefined);
  assert.equal(res.body.usuarios[0].password, undefined);
});


// ================= filtros de periodo =================

test('o periodo recorta o ranking e o historico do mesmo jeito', async () => {
  const user = await criarUsuario();
  const antigo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

  await Pontuacao.create({
    user_id: user.id,
    pontuacao: 10,
    acertos: 1,
    total_perguntas: 1,
    modo: 'solo',
    createdAt: antigo,
    updatedAt: antigo,
  });
  await Pontuacao.create({
    user_id: user.id,
    pontuacao: 90,
    acertos: 9,
    total_perguntas: 10,
    modo: 'solo',
  });

  const token = await tokenDe('jogador');
  const hoje = await request(app)
    .get('/api/pontuacoes/eu?modo=solo&periodo=30')
    .set('Authorization', `Bearer ${token}`);
  const geral = await request(app)
    .get('/api/pontuacoes/eu?modo=solo&periodo=tudo')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(hoje.body.resumo.jogos, 1, 'so a partida de hoje entra em 30 dias');
  assert.equal(hoje.body.resumo.pontosTotais, 90);
  assert.equal(geral.body.resumo.jogos, 2, 'o geral continua com as duas');
  assert.equal(geral.body.resumo.pontosTotais, 100);
});

test('a posicao do ranking segue o mesmo periodo do historico', async () => {
  const user = await criarUsuario();
  const antigo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
  await Pontuacao.create({
    user_id: user.id,
    pontuacao: 500,
    acertos: 50,
    total_perguntas: 50,
    modo: 'solo',
    createdAt: antigo,
    updatedAt: antigo,
  });
  await Pontuacao.create({
    user_id: user.id,
    pontuacao: 30,
    acertos: 3,
    total_perguntas: 10,
    modo: 'solo',
  });

  const geral = await request(app).get('/api/pontuacoes/ranking?modo=solo&periodo=tudo');
  assert.equal(geral.body.ranking[0].recorde, 500, 'no geral o recorde antigo manda');

  const recente = await request(app).get('/api/pontuacoes/ranking?modo=solo&periodo=30');
  assert.equal(recente.body.ranking[0].recorde, 30, 'em 30 dias o antigo nao conta');
});

test('periodo invalido no query cai no geral em vez de quebrar', async () => {
  await criarUsuario();
  const res = await request(app).get('/api/pontuacoes/ranking?modo=solo&periodo=xadrez');
  assert.equal(res.status, 200);
  assert.equal(res.body.periodo, 'tudo');
});

test('a taxa de acertos e do historico inteiro, nao da pagina', async () => {
  const user = await criarUsuario();

  // 9 partidas ruins e 1 boa: a taxa da vida toda e 50%.
  await Pontuacao.bulkCreate([
    ...Array.from({ length: 9 }, () => ({
      user_id: user.id,
      pontuacao: 0,
      acertos: 0,
      total_perguntas: 10,
      modo: 'solo',
    })),
    { user_id: user.id, pontuacao: 100, acertos: 10, total_perguntas: 10, modo: 'solo' },
  ]);

  const token = await tokenDe('jogador');
  const res = await request(app)
    .get('/api/pontuacoes/eu?modo=solo&porPagina=10')
    .set('Authorization', `Bearer ${token}`);

  // Somando as 10 linhas da pagina daria 100%; o total real e 50%.
  assert.equal(res.body.resumo.acertosTotais, 10);
  assert.equal(res.body.resumo.perguntasTotais, 100);
});

// ================= edicao do nome de usuario =================

test('o jogador renomeia a si mesmo e recebe token novo', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');

  const res = await request(app)
    .put('/api/auth/usuario')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'joao.da_silva-2' });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.username, 'joao.da_silva-2');
  assert.ok(res.body.token, 'o token precisa ser reemitido: ele carrega o nome');
  assert.notEqual(res.body.token, token);

  // O token novo precisa valer: e ele que sera usado na proxima chamada.
  const depois = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${res.body.token}`);
  assert.equal(depois.body.user.username, 'joao.da_silva-2');
});

test('o token antigo continua valido apos a troca de nome', async () => {
  // Documentando um limite conhecido: o JWT nao tem revogacao, entao o
  // token emitido antes da troca segue funcionando (com o perfil lido do
  // banco). O que muda e o nome dentro do payload, que so o token novo tem.
  await criarUsuario();
  const token = await tokenDe('jogador');
  await request(app)
    .put('/api/auth/usuario')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'outroNome' });

  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.username, 'outroNome', 'o /me le do banco, nao do token');
});

test('nao da para renomear para um nome ja usado', async () => {
  await criarUsuario({ username: 'ocupado' });
  await criarUsuario({ username: 'livre' });
  const token = await tokenDe('livre');

  const res = await request(app)
    .put('/api/auth/usuario')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'ocupado' });

  assert.equal(res.status, 409);
  assert.match(res.body.error, /já está em uso/i);
});

test('a troca de nome respeita o mesmo formato do cadastro', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');

  for (const username of ['ab', 'com espaco', 'acentuação', 'x'.repeat(51)]) {
    const res = await request(app)
      .put('/api/auth/usuario')
      .set('Authorization', `Bearer ${token}`)
      .send({ username });
    assert.equal(res.status, 400, `"${username}" deveria ser recusado`);
  }
});

test('renomear para o proprio nome nao e erro', async () => {
  await criarUsuario();
  const token = await tokenDe('jogador');

  const res = await request(app)
    .put('/api/auth/usuario')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'jogador' });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.username, 'jogador');
});

test('renomear exige autenticacao', async () => {
  const res = await request(app).put('/api/auth/usuario').send({ username: 'qualquer' });
  assert.equal(res.status, 401);
});
