const { Op, fn, col, literal } = require('sequelize');
const Pontuacao = require('../models/Pontuacao');
const User = require('../models/User');
const Pergunta = require('../models/Pergunta');
const { calcularPontuacao } = require('../utils/scoring');
const { normalizar } = require('../utils/texto');
const {
  normalizar: normalizarPeriodo,
  filtro: filtroDePeriodo,
  rotulo: rotuloPeriodo,
} = require('../utils/periodo');

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

  // Cada pergunta vale UMA vez. Sem esta deduplicacao, o mesmo `perguntaId`
  // repetido N vezes entrava N vezes em `respostas` e o calculo de pontos
  // multiplicava a pontuacao: era so repetir a resposta certa 50 vezes para
  // aparecer no topo do ranking. A ordem da primeira ocorrencia e preservada
  // para o calculo de combo continuar fazendo sentido.
  const vistas = new Set();
  const normalizadas = respostas
    .filter((r) => {
      const id = Number(r.perguntaId);
      if (!porId.has(id) || vistas.has(id)) return false;
      vistas.add(id);
      return true;
    })
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

  // Periodo deslizante (7/30/365 dias ou geral). Aplica-se ao ranking E ao
  // detalhe da melhor partida, para os dois virem do mesmo recorte.
  const periodo = normalizarPeriodo(req.query.periodo);
  const filtroPeriodo = filtroDePeriodo(req.query.periodo);

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
    where: { ...filtroModo, ...filtroPrivacidade, ...filtroPeriodo },
    group: ['user_id'],
    order: [[literal('recorde'), 'DESC']],
    limit: limite,
    raw: true,
  });

  if (records.length === 0) {
    return res.json({
      ranking: [],
      limite,
      minhaPosicao: null,
      modo: modo || 'todos',
      periodo,
    });
  }

  const userIds = records.map((r) => r.user_id);
  const usuarios = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ['id', 'username'],
    raw: true,
  });
  const nomePorId = new Map(usuarios.map((u) => [u.id, u.username]));

  // Detalhes da melhor partida de cada usuario, em UMA consulta.
  // Antes eram `limite` queries (uma por linha do agrupamento). Aqui
  // buscamos as partidas de todo o recorte ja ordenadas por pontuacao e
  // o primeiro registro de cada usuario e o recorde dele. Custo: le as
  // partidas dos `limite` jogadores, nao so as melhores — aceitavel para
  // os 10 primeiros de um ranking, e o ganho e de 1 query em vez de 10.
  const partidas = await Pontuacao.findAll({
    where: { user_id: { [Op.in]: userIds }, ...filtroModo, ...filtroPeriodo },
    order: [['pontuacao', 'DESC'], ['id', 'ASC']],
    attributes: ['user_id', 'acertos', 'total_perguntas'],
    raw: true,
  });
  const melhorPorUsuario = new Map();
  for (const p of partidas) {
    if (!melhorPorUsuario.has(p.user_id)) melhorPorUsuario.set(p.user_id, p);
  }

  return res.json({
    ranking: records.map((r, i) => ({
      posicao: i + 1,
      user_id: r.user_id,
      username: nomePorId.get(r.user_id) || 'Jogador removido',
      recorde: Number(r.recorde),
      acertos: Number(melhorPorUsuario.get(r.user_id)?.acertos || 0),
      total_perguntas: Number(melhorPorUsuario.get(r.user_id)?.total_perguntas || 0),
      jogos: Number(r.jogos),
      souEu: r.user_id === req.userId,
    })),
    limite,
    modo: modo || 'todos',
    periodo,
    minhaPosicao: records.findIndex((r) => r.user_id === req.userId) + 1 || null,
  });
}

async function minhas(req, res) {
  const modo = req.query.modo;
  if (modo && !MODOS.includes(modo)) {
    return res.status(400).json({ error: 'Modo inválido' });
  }
  const filtroModo = modo ? { modo } : {};

  const periodo = normalizarPeriodo(req.query.periodo);
  const filtroPeriodo = filtroDePeriodo(req.query.periodo);

  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
  const porPagina = Math.min(Math.max(parseInt(req.query.porPagina, 10) || 10, 1), 50);
  const deslocamento = (pagina - 1) * porPagina;

  const registros = await Pontuacao.findAll({
    where: { user_id: req.userId, ...filtroModo, ...filtroPeriodo },
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    limit: porPagina,
    offset: deslocamento,
  });

  /**
   * Os totais sao agregados NO BANCO, nao sobre as linhas da pagina.
   * Antes eles vinham de `registros.reduce(...)` com `limit: 20`, entao
   * um jogador com 300 jogos via "3500 pontos, 20 jogos" — e o numero
   * ainda ENCAIXAVA com o `/api/auth/me`, que somava a vida toda. Resumo
   * que muda conforme a quantidade de partidas nao e resumo.
   */
  const totais = await Pontuacao.findOne({
    attributes: [
      [fn('COALESCE', fn('SUM', col('pontuacao')), literal('0')), 'pontosTotais'],
      [fn('COALESCE', fn('MAX', col('pontuacao')), literal('0')), 'recorde'],
      [fn('COUNT', col('id')), 'jogos'],
      // A taxa de acertos tambem e um total do historico inteiro. Somando
      // `acertos`/`total_perguntas` das linhas da pagina, o jogador com 300
      // jogos veria a taxa dos 10 mais recentes — e a taxa "cai sozinha"
      // conforme as paginas carregam, sem nenhum dado novo.
      [fn('COALESCE', fn('SUM', col('acertos')), literal('0')), 'acertosTotais'],
      [fn('COALESCE', fn('SUM', col('total_perguntas')), literal('0')), 'perguntasTotais'],
    ],
    where: { user_id: req.userId, ...filtroModo, ...filtroPeriodo },
    raw: true,
  });

  const porModo = await Pontuacao.findAll({
    attributes: [
      'modo',
      [fn('COALESCE', fn('SUM', col('pontuacao')), literal('0')), 'pontosTotais'],
      [fn('COALESCE', fn('MAX', col('pontuacao')), literal('0')), 'recorde'],
      [fn('COUNT', col('id')), 'jogos'],
    ],
    // Mesmo periodo dos totais: o quadro "solo x campeonato" precisa contar
    // as mesmas partidas que a lista acima dele, senao os numeros nao batem.
    where: { user_id: req.userId, ...filtroPeriodo },
    group: ['modo'],
    raw: true,
  });

  // Resumo separado por modo: o perfil mostra os dois lado a lado.
  const resumoPorModo = {};
  for (const m of MODOS) {
    const linha = porModo.find((p) => p.modo === m);
    resumoPorModo[m] = {
      recorde: Number(linha?.recorde || 0),
      pontosTotais: Number(linha?.pontosTotais || 0),
      jogos: Number(linha?.jogos || 0),
    };
  }

  return res.json({
    pontuacoes: registros,
    modo: modo || 'todos',
    periodo,
    periodoRotulo: rotuloPeriodo(periodo),
    paginacao: {
      pagina,
      porPagina,
      total: Number(totais?.jogos || 0),
      temMais: deslocamento + registros.length < Number(totais?.jogos || 0),
    },
    resumo: {
      recorde: Number(totais?.recorde || 0),
      pontosTotais: Number(totais?.pontosTotais || 0),
      jogos: Number(totais?.jogos || 0),
      acertosTotais: Number(totais?.acertosTotais || 0),
      perguntasTotais: Number(totais?.perguntasTotais || 0),
    },
    resumoPorModo,
  });
}

module.exports = { salvar, ranking, minhas };
