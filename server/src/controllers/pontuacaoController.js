const { Op, fn, col, literal } = require('sequelize');
const Pontuacao = require('../models/Pontuacao');
const User = require('../models/User');
const Pergunta = require('../models/Pergunta');
const { calcularPontuacao } = require('../utils/scoring');
const { normalizar } = require('../utils/texto');

const LIMITE_RANKING = 10;
const MODOS = ['solo', 'campeonato'];

/** Garante que o modo recebido seja valido; partidas sem modo contam como solo. */
function normalizarModo(modo) {
  return MODOS.includes(modo) ? modo : 'solo';
}

/**
 * As opcoes são embaralhadas a cada GET /api/perguntas, entao o indice exibido
 * ao jogador nao corresponde ao indice guardado no banco. Por isso o cliente
 * envia o TEXTO da opcao escolhida e o servidor confere contra o texto da
 * opcao correta original. Assim o servidor continua sendo a fonte da verdade
 * sem depender da ordem aleatoria de cada partida.
 */

async function salvar(req, res) {
  const { respostas } = req.body || {};

  if (!Array.isArray(respostas) || respostas.length === 0) {
    return res.status(400).json({ error: 'Envie ao menos uma resposta' });
  }
  if (respostas.length > 50) {
    return res.status(400).json({ error: 'Máximo de 50 respostas por partida' });
  }

  const ids = respostas.map((r) => Number(r.perguntaId)).filter((id) => Number.isInteger(id));
  const perguntas = await Pergunta.findAll({ where: { id: { [Op.in]: ids } } });
  const porId = new Map(perguntas.map((p) => [p.id, p]));

  if (porId.size === 0) {
    return res.status(400).json({ error: 'Nenhuma pergunta válida enviada' });
  }

  const invalidas = respostas.filter((r) => typeof r.resposta !== 'string');
  if (invalidas.length > 0) {
    return res.status(400).json({ error: 'Cada resposta deve conter o texto da opção escolhida' });
  }

  const normalizadas = respostas
    .filter((r) => porId.has(Number(r.perguntaId)))
    .map((r) => {
      const p = porId.get(Number(r.perguntaId));
      const opcoes = Array.isArray(p.opcoes) ? p.opcoes : [];
      const correta = normalizar(r.resposta) === normalizar(opcoes[p.resposta_correta]);
      return { perguntaId: p.id, correta, dificuldade: p.dificuldade };
    });

  const resultado = calcularPontuacao(normalizadas);

  const pontuacao = await Pontuacao.create({
    user_id: req.userId,
    pontuacao: resultado.pontuacao,
    acertos: resultado.acertos,
    total_perguntas: resultado.total_perguntas,
    modo: normalizarModo(req.body?.modo),
  });

  return res.status(201).json({
    pontuacao,
    resumo: {
      pontuacao: resultado.pontuacao,
      acertos: resultado.acertos,
      total_perguntas: resultado.total_perguntas,
      bonusTotal: resultado.bonusTotal,
      comboMaximo: resultado.comboMaximo,
    },
  });
}

async function ranking(req, res) {
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || LIMITE_RANKING, 1), 50);

  // Solo e Campeonato sao rankings SEPARADOS: no campeonato a pontuacao
  // vale na disputa entre os jogadores da mesma partida, entao juntar os dois
  // em uma lista traria numeros sem comparacao. "todos" continua disponivel
  // para consultas administrativas.
  const modo = req.query.modo;
  if (modo && !MODOS.includes(modo) && modo !== 'todos') {
    return res.status(400).json({ error: 'Modo de ranking inválido' });
  }
  const filtroModo = modo && modo !== 'todos' ? { modo } : {};

  // Quem marcou o ranking solo como privado some da lista alheia, mas continua
  // aparecendo para si mesmo. O filtro e por user_id porque a agregacao roda
  // sobre pontuacoes, que nao tem a preferencia do usuario.
  let filtroPrivacidade = {};
  if (modo === 'solo') {
    const privados = await User.findAll({
      where: { ranking_publico: false, ...(req.userId ? { id: { [Op.ne]: req.userId } } : {}) },
      attributes: ['id'],
      raw: true,
    });
    if (privados.length > 0) {
      filtroPrivacidade = { user_id: { [Op.notIn]: privados.map((u) => u.id) } };
    }
  }

  // Agregacao sem JOIN: o SQLite exige que toda coluna nao agregada do SELECT
  // apareca no GROUP BY, e o Postgres se comporta igual.
  const records = await Pontuacao.findAll({
    attributes: [
      'user_id',
      [fn('MAX', col('pontuacao')), 'recorde'],
      [fn('COUNT', col('id')), 'jogos'],
    ],
    where: { ...filtroModo, ...filtroPrivacidade },
    group: ['user_id'],
    order: [[literal('recorde'), 'DESC']],
    limit: limite,
    raw: true,
  });

  if (records.length === 0) {
    return res.json({ ranking: [], limite, minhaPosicao: null, modo: modo || 'todos' });
  }

  const userIds = records.map((r) => r.user_id);
  const usuarios = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ['id', 'username'],
    raw: true,
  });
  const nomePorId = new Map(usuarios.map((u) => [u.id, u.username]));

  // Detalhes da melhor partida de cada usuario (no maximo 10 consultas).
  const melhoresJogos = await Promise.all(
    records.map((r) =>
      Pontuacao.findOne({
        where: { user_id: r.user_id, ...filtroModo },
        order: [['pontuacao', 'DESC']],
        attributes: ['acertos', 'total_perguntas'],
        raw: true,
      })
    )
  );

  return res.json({
    ranking: records.map((r, i) => ({
      posicao: i + 1,
      user_id: r.user_id,
      username: nomePorId.get(r.user_id) || 'Jogador removido',
      recorde: Number(r.recorde),
      acertos: Number(melhoresJogos[i]?.acertos || 0),
      total_perguntas: Number(melhoresJogos[i]?.total_perguntas || 0),
      jogos: Number(r.jogos),
      souEu: r.user_id === req.userId,
    })),
    limite,
    modo: modo || 'todos',
    minhaPosicao: records.findIndex((r) => r.user_id === req.userId) + 1 || null,
  });
}

async function minhas(req, res) {
  const modo = req.query.modo;
  if (modo && !MODOS.includes(modo)) {
    return res.status(400).json({ error: 'Modo inválido' });
  }
  const filtroModo = modo ? { modo } : {};

  const registros = await Pontuacao.findAll({
    where: { user_id: req.userId, ...filtroModo },
    order: [['created_at', 'DESC']],
    limit: 20,
  });

  const recorde = registros.reduce((acc, p) => Math.max(acc, p.pontuacao), 0);
  const pontosTotais = registros.reduce((acc, p) => acc + p.pontuacao, 0);

  // Resumo separado por modo: o perfil mostra os dois lado a lado.
  const resumoPorModo = {};
  for (const m of MODOS) {
    const doModo = registros.filter((p) => p.modo === m);
    resumoPorModo[m] = {
      recorde: doModo.reduce((acc, p) => Math.max(acc, p.pontuacao), 0),
      pontosTotais: doModo.reduce((acc, p) => acc + p.pontuacao, 0),
      jogos: doModo.length,
    };
  }

  return res.json({
    pontuacoes: registros,
    modo: modo || 'todos',
    resumo: {
      recorde,
      pontosTotais,
      jogos: registros.length,
    },
    resumoPorModo,
  });
}

module.exports = { salvar, ranking, minhas };
