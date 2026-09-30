const test = require('node:test');
const assert = require('node:assert/strict');

const GerenciadorSessoes = require('../src/realtime/sessoes');

/** Io falso: os testes nao ligam socket, so registram os eventos emitidos. */
function ioFalso() {
  const emitidos = [];
  return {
    emissions: emitidos,
    to() {
      return {
        emit(evento, dados) {
          emitidos.push({ evento, dados });
        },
      };
    },
  };
}

function gerenciador() {
  const io = ioFalso();
  return { io, g: new GerenciadorSessoes(io) };
}

const usuario = (id) => ({ id, username: `p${id}` });

/** Coloca uma sessao em andamento com `total` perguntas de dificuldade facil. */
function sessaoEmJogo(g, anfitriao, total = 2) {
  const sessao = g.criar(anfitriao, { total });
  sessao.perguntas = Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    pergunta: `Pergunta ${i + 1}?`,
    opcoes: ['a', 'b', 'c', 'd'],
    resposta_correta: 0,
    dificuldade: 'facil',
    categoria: 'teste',
  }));
  sessao.status = 'jogando';
  sessao.modo = 'solo';
  sessao.indice = 0;
  return sessao;
}

// ---------- convite: a porta que qualquer autenticado atravessava ----------

test('recusa responder um convite que nao existe', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.entrar(sessao, usuario(2));

  // O codigo da sessao aparece em presenca:atualizada. So conhecer ele nao
  // pode ser suficiente para entrar: o convite precisa ter sido enviado.
  assert.throws(
    () => g.responderConvite(sessao, usuario(9), true),
    /convite não está mais disponível/i
  );
  assert.deepEqual(
    sessao.jogadores.map((j) => j.userId),
    [1, 2]
  );
});

test('convite aceito coloca o convidado no elenco uma unica vez', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.entrar(sessao, usuario(2));
  g.convidar(sessao, 1, usuario(3));

  assert.equal(g.responderConvite(sessao, usuario(3), true).entrou, true);
  assert.deepEqual(
    sessao.jogadores.map((j) => j.userId),
    [1, 2, 3]
  );
});

test('convite consumido nao pode ser reaproveitado', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.convidar(sessao, 1, usuario(3));

  g.responderConvite(sessao, usuario(3), true);
  g.sair(sessao, 3);

  assert.throws(() => g.responderConvite(sessao, usuario(3), true), /não está mais disponível/i);
});

test('convite aceito durante a partida nao entra no elenco travado', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.entrar(sessao, usuario(2));
  g.convidar(sessao, 1, usuario(3));
  sessao.status = 'jogando';

  assert.throws(() => g.responderConvite(sessao, usuario(3), true), /elenco está travado/i);
  assert.deepEqual(
    sessao.jogadores.map((j) => j.userId),
    [1, 2]
  );
});

test('recusar o convite nao adiciona ninguem', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.convidar(sessao, 1, usuario(3));

  assert.equal(g.responderConvite(sessao, usuario(3), false).entrou, false);
  assert.deepEqual(
    sessao.jogadores.map((j) => j.userId),
    [1]
  );
  // Recusar consome o convite.
  assert.throws(() => g.responderConvite(sessao, usuario(3), true), /não está mais disponível/i);
});

test('modo nao muda ao aceitar convite: ele nasce no inicio', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.convidar(sessao, 1, usuario(2));
  g.responderConvite(sessao, usuario(2), true);

  assert.equal(sessao.modo, null, 'antes de iniciar o modo ainda nao foi decidido');
  assert.equal(sessao.jogadores.length, 2);
});

// ---------- resposta duplicada durante a revelacao ----------

test('a janela de revelacao nao aceita nova resposta da mesma pergunta', () => {
  const { g } = gerenciador();
  const sessao = sessaoEmJogo(g, usuario(1), 1);

  g.responder(sessao, 1, 'a');
  const jogador = sessao.jogadores[0];
  assert.equal(jogador.pontos, 10);

  // `revelar` zera `respondeu` de proposito (o placar volta a ficar neutro),
  // mas a pergunta ja foi respondida e nao pode pontuar de novo.
  g.revelar(sessao);
  g.responder(sessao, 1, 'a');
  g.responder(sessao, 1, 'a');
  g.responder(sessao, 1, 'a');

  assert.equal(jogador.respostas.length, 1, 'a pergunta foi pontuada mais de uma vez');
  assert.equal(jogador.pontos, 10, 'a pontuacao foi inflada');
  g.pararTimers(sessao);
});

test('responder duas vezes seguidas nao soma a mesma pergunta', () => {
  const { g } = gerenciador();
  const sessao = sessaoEmJogo(g, usuario(1), 1);

  g.responder(sessao, 1, 'a');
  g.responder(sessao, 1, 'b');

  assert.equal(sessao.jogadores[0].respostas.length, 1);
  g.pararTimers(sessao);
});

test('avancar libera a resposta da proxima pergunta', () => {
  const { g } = gerenciador();
  const sessao = sessaoEmJogo(g, usuario(1), 2);

  g.responder(sessao, 1, 'a');
  g.revelar(sessao);
  g.avancar(sessao); // indice 0 -> 1
  assert.equal(sessao.indice, 1);

  g.responder(sessao, 1, 'a');
  assert.equal(sessao.jogadores[0].respostas.length, 2, 'a segunda pergunta nao foi aceita');
  g.pararTimers(sessao);
});

test('reiniciar zera o indice de resposta de cada jogador', () => {
  const { g } = gerenciador();
  const sessao = sessaoEmJogo(g, usuario(1), 2);

  g.responder(sessao, 1, 'a');
  g.reiniciar(sessao, 1);

  assert.equal(sessao.jogadores[0].respondeuIndice, -1);
  assert.equal(sessao.jogadores[0].respostas.length, 0);
  g.pararTimers(sessao);
});

// ---------- elenco travado e permissões do anfitrião ----------

test('entrar e recusado enquanto a partida esta em andamento', () => {
  const { g } = gerenciador();
  const sessao = sessaoEmJogo(g, usuario(1), 2);

  assert.throws(() => g.entrar(sessao, usuario(5)), /elenco está travado/i);
});

test('so o anfitriao inicia, reinicia, convida e remove', async () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.entrar(sessao, usuario(2));

  // `iniciar` e async: a recusa vem como promise rejeitada, nao como throw.
  await assert.rejects(() => g.iniciar(sessao, 2), /Somente o anfitrião pode iniciar/i);
  assert.throws(() => g.reiniciar(sessao, 2), /Somente o anfitrião pode reiniciar/i);
  assert.throws(() => g.convidar(sessao, 2, usuario(3)), /Somente o anfitrião pode convidar/i);
  assert.throws(() => g.remover(sessao, 2, 1), /Somente o anfitrião pode remover/i);
});

test('anfitriao nao pode remover a si mesmo', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.entrar(sessao, usuario(2));

  assert.throws(() => g.remover(sessao, 1, 1), /não pode remover a si mesmo/i);
});

test('quem sai e promovido a anfitriao quando o anfitriao sai', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.entrar(sessao, usuario(2));
  g.entrar(sessao, usuario(3));

  g.sair(sessao, 1);
  assert.equal(sessao.anfitriao, 2);
});

test('um jogador so participa de uma sessao por vez', () => {
  const { g } = gerenciador();
  const primeira = g.criar(usuario(1), { total: 2 });
  const segunda = g.criar(usuario(2), { total: 2 });

  assert.throws(() => g.entrar(segunda, usuario(1)), /já está na sessão/i);
  assert.equal(g.doUsuario(1).codigo, primeira.codigo);
});

test('sessao sem jogadores e destruida', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });

  assert.equal(g.sair(sessao, 1), null);
  assert.equal(g.obter(sessao.codigo), null);
});

// ---------- serializacao ----------

test('a pergunta enviada ao cliente nao carrega o gabarito', () => {
  const { g } = gerenciador();
  const sessao = sessaoEmJogo(g, usuario(1), 1);

  const publica = g.perguntaPublica(sessao.perguntas[0]);
  assert.equal(publica.resposta_correta, undefined);
  assert.equal(publica.pergunta, 'Pergunta 1?');
  g.pararTimers(sessao);
});

test('configuracao fora dos limites e normalizada', () => {
  const { g } = gerenciador();

  const alta = g.normalizarConfig({ total: 999, tempoPorQuestao: 9999 });
  assert.equal(alta.total, 30);
  assert.equal(alta.tempoPorQuestao, 120);

  const baixa = g.normalizarConfig({ total: -5, tempoPorQuestao: 0 });
  assert.equal(baixa.total, 1);
  assert.equal(baixa.tempoPorQuestao, 5);

  const vazia = g.normalizarConfig({});
  assert.equal(vazia.total, 10);
  assert.equal(vazia.tempoPorQuestao, 30);
  assert.equal(vazia.categoria, 'todas');
});

test('o placar ordena por pontos, depois acertos, depois nome', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.entrar(sessao, usuario(2));
  g.entrar(sessao, usuario(3));

  sessao.jogadores[0].pontos = 10;
  sessao.jogadores[1].pontos = 30;
  sessao.jogadores[2].pontos = 30;

  assert.deepEqual(
    g.placar(sessao).map((j) => j.username),
    ['p2', 'p3', 'p1']
  );
});

test('convites pendentes somem da lista apos o aceite', () => {
  const { g } = gerenciador();
  const sessao = g.criar(usuario(1), { total: 2 });
  g.convidar(sessao, 1, usuario(3));

  assert.equal(g.pendentes(sessao).length, 1);
  g.responderConvite(sessao, usuario(3), true);
  assert.equal(g.pendentes(sessao).length, 0);
});

test('cada sessao recebe um codigo proprio de 6 caracteres', () => {
  const { g } = gerenciador();
  const a = g.criar(usuario(1), { total: 2 });
  const b = g.criar(usuario(2), { total: 2 });

  assert.notEqual(a.codigo, b.codigo);
  assert.match(a.codigo, /^[A-Z2-9]{6}$/);
  assert.match(b.codigo, /^[A-Z2-9]{6}$/);
});

test('o codigo gerado nunca colide com uma sessao existente', () => {
  const { g } = gerenciador();
  const existente = g.criar(usuario(1), { total: 2 });

  // 200 sorteios: a chance de algum cair no codigo existente seria minuscula,
  // entao passar o laco inteiro sem colidir prova o retry de `gerarCodigoUnico`.
  for (let i = 0; i < 200; i += 1) {
    assert.notEqual(g.gerarCodigoUnico(), existente.codigo);
  }
});
