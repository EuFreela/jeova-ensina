const Pergunta = require('../models/Pergunta');
const { prepararPerguntas } = require('../utils/shuffle');

const LIMITE_MAX = 50;

async function listar(req, res) {
  const { categoria, dificuldade, limite } = req.query;

  const where = {};
  if (categoria && categoria !== 'todas') where.categoria = categoria;
  if (dificuldade && dificuldade !== 'todas') where.dificuldade = dificuldade;

  const limiteNum = Math.min(Math.max(parseInt(limite, 10) || 10, 1), LIMITE_MAX);

  const registros = await Pergunta.findAll({ where, limit: limiteNum });

  if (registros.length === 0) {
    return res.json({ perguntas: [], total: 0, limite: limiteNum });
  }

  return res.json({
    perguntas: prepararPerguntas(registros, { comResposta: true }),
    total: registros.length,
    limite: limiteNum,
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
  const [preparada] = prepararPerguntas([pergunta], { comResposta: true });
  return res.json({ pergunta: preparada });
}

module.exports = { listar, detalhe, categorias };
