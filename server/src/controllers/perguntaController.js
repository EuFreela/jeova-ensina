const { literal } = require('sequelize');
const Pergunta = require('../models/Pergunta');
const { prepararPerguntas } = require('../utils/shuffle');
const { normalizar } = require('../utils/texto');
const { criarRodada, lerRodada, rodadaUsada } = require('../utils/rodada');
const { PONTOS_POR_DIFICULDADE } = require('../utils/scoring');

const LIMITE_MAX = 50;

/**
 * As perguntas NUNCA saem com `resposta_correta`.
 *
 * Antes cada `GET /api/perguntas` devolvia o gabarito de todas as perguntas
 * sorteadas. Com `POST /api/pontuacoes` aceitando qualquer lista de ids, isso
 * era o caminho mais curto para o topo do ranking: uma chamada para ler as
 * respostas, outra para gravar 50 acertos. O gabarito agora vem de
 * `responder()`, uma pergunta por vez, e apenas depois que o jogador escolheu.
 */
async function listar(req, res) {
  const { categoria, dificuldade, limite } = req.query;

  const where = {};
  if (categoria && categoria !== 'todas') where.categoria = categoria;
  if (dificuldade && dificuldade !== 'todas') where.dificuldade = dificuldade;

  const limiteNum = Math.min(Math.max(parseInt(limite, 10) || 10, 1), LIMITE_MAX);

  // Sorteio ANTES do limite. Sem `order` o banco devolve sempre as mesmas
  // primeiras linhas, e `prepararPerguntas` so embaralharia a ordem delas:
  // toda partida sairia com as mesmas 10 perguntas, so mudadas de lugar.
  // Sortear no banco e so entao cortar garante variedade real.
  const registros = await Pergunta.findAll({
    where,
    order: literal('RANDOM()'),
    limit: limiteNum,
  });

  if (registros.length === 0) {
    return res.json({ perguntas: [], total: 0, limite: limiteNum });
  }

  return res.json({
    perguntas: prepararPerguntas(registros, { comResposta: false }),
    total: registros.length,
    limite: limiteNum,
    // Prova de que ESTAS perguntas foram servidas para ESTE jogador. Sem ela,
    // `POST /api/pontuacoes` aceitaria qualquer conjunto de ids.
    rodada: criarRodada(req.userId, registros),
  });
}

async function categorias(req, res) {
  const lista = await Pergunta.findAll({
    attributes: ['categoria'],
    group: ['categoria'],
    order: [['categoria', 'ASC']],
  });
  return res.json({ categorias: lista.map((p) => p.categoria) });
}

async function detalhe(req, res) {
  const pergunta = await Pergunta.findByPk(req.params.id);
  if (!pergunta) {
    return res.status(404).json({ error: 'Pergunta não encontrada' });
  }
  const [preparada] = prepararPerguntas([pergunta], { comResposta: false });
  return res.json({ pergunta: preparada });
}

/**
 * Veredito do servidor para UMA pergunta.
 *
 * O cliente precisa dizer se acertou ou errou na hora (e o texto da resposta
 * correta, para exibir o feedback). E aqui que essa informacao sai — uma
 * pergunta por requisicao, sempre contra o token da rodada, e sempre depois
 * que o jogador ja escolheu. O gabarito completo nunca chega de uma vez.
 *
 * A resposta volta por TEXTO, nunca por indice: o cliente embaralha as opcoes
 * na tela, entao so o texto identifica a escolha sem depender da ordem.
 */
async function responder(req, res) {
  const { rodada, perguntaId, resposta } = req.body || {};

  if (typeof resposta !== 'string') {
    return res.status(400).json({ error: 'Envie "resposta" com o texto da opção escolhida' });
  }

  const lida = lerRodada(rodada, req.userId);
  if (!lida.ok) {
    return res.status(400).json({ error: lida.motivo });
  }
  if (rodadaUsada(lida.nonce)) {
    return res.status(409).json({ error: 'Esta rodada já foi pontuada.' });
  }

  const id = Number(perguntaId);
  if (!Number.isInteger(id) || !lida.ids.has(id)) {
    return res.status(400).json({ error: 'Esta pergunta não faz parte da sua rodada.' });
  }

  const pergunta = await Pergunta.findByPk(id);
  if (!pergunta) {
    return res.status(404).json({ error: 'Pergunta não encontrada' });
  }

  const opcoes = Array.isArray(pergunta.opcoes) ? pergunta.opcoes : [];
  const correta = normalizar(resposta) === normalizar(opcoes[pergunta.resposta_correta]);
  const pontos = PONTOS_POR_DIFICULDADE[pergunta.dificuldade] ?? PONTOS_POR_DIFICULDADE.facil;

  return res.json({
    correta,
    respostaCorreta: opcoes[pergunta.resposta_correta],
    dificuldade: pergunta.dificuldade,
    // O bonus de combo depende do que veio antes, entao quem chama decide.
    pontos: correta ? pontos : 0,
  });
}

module.exports = { listar, categorias, detalhe, responder };