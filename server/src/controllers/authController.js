const jwt = require('jsonwebtoken');
const { fn, col, literal } = require('sequelize');
const User = require('../models/User');
const Pontuacao = require('../models/Pontuacao');
const { codigoExpirou, VALIDADE_CODIGO_MINUTOS } = require('../utils/codigo');

const MIN_SENHA = 8;

function gerarToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publico(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    must_change_password: user.must_change_password,
    ranking_publico: user.ranking_publico !== false,
    created_at: user.created_at,
  };
}

function validarCredenciais(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return 'Informe usuário e senha';
  }
  if (username.trim().length < 3 || username.trim().length > 50) {
    return 'Nome de usuário deve ter entre 3 e 50 caracteres';
  }
  // O login aceita o codigo inicial de 4 digitos ou uma senha definitiva.
  // A regra forte (minimo de 8) vale na troca de senha, nao aqui.
  if (password.length < 4) {
    return 'Senha ou código deve ter no mínimo 4 caracteres';
  }
  return null;
}

/** Valida o formato do nome de usuario usado na criacao de contas. */
function validarUsername(username) {
  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 50) {
    return 'Nome de usuário deve ter entre 3 e 50 caracteres';
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
    return 'Nome de usuário só pode conter letras, números, ponto, hífen e underscore';
  }
  return null;
}

async function login(req, res) {
  const { username, password } = req.body || {};

  const erro = validarCredenciais(username, password);
  if (erro) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const user = await User.scope('withPassword').findOne({
    where: { username: username.trim() },
  });

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // O codigo inicial de 4 digitos vale por 5 minutos. Passou disso, nem
  // a senha antiga nem um codigo novo funcionam: o admin precisa gerar outro.
  if (codigoExpirou(user)) {
    return res.status(401).json({
      error: `Código expirado. Peça ao administrador um novo código (válido por ${VALIDADE_CODIGO_MINUTOS} minutos).`,
    });
  }

  const senhaCorreta = await user.checkPassword(password);
  if (!senhaCorreta) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  return res.json({ token: gerarToken(user), user: publico(user) });
}

async function me(req, res) {
  const user = await User.findByPk(req.userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  // Agregado no banco: antes eram carregadas TODAS as partidas do jogador
  // para somar em JavaScript. Um jogador com 10 mil jogos gastava 10 mil
  // linhas de memoria e um round-trip por requisicao so para mostrar dois
  // numeros na tela.
  const [totais] = await Pontuacao.findAll({
    attributes: [
      [fn('COALESCE', fn('SUM', col('pontuacao')), literal('0')), 'pontosTotais'],
      [fn('COALESCE', fn('MAX', col('pontuacao')), literal('0')), 'recorde'],
      [fn('COUNT', col('id')), 'jogos'],
    ],
    where: { user_id: user.id },
    raw: true,
  });

  return res.json({
    user: {
      ...publico(user),
      recorde: Number(totais?.recorde || 0),
      pontosTotais: Number(totais?.pontosTotais || 0),
      jogos: Number(totais?.jogos || 0),
    },
  });
}

/**
 * Troca a senha do proprio usuario autenticado. Limpa a flag de senha
 * provisoria, permitindo que o acesso inicial seja sempre rotacionado.
 */
/**
 * Troca o nome de usuario do proprio jogador.
 *
 * O token carrega `username` dentro do payload (e a presenca em tempo real
 * mostra esse valor), entao um token emitido antes da troca continuaria
 * exibindo o nome antigo por ate 7 dias. Por isso a resposta traz um token
 * novo: o cliente precisa substitui-lo, e devolve-lo aqui deixa isso
 * explicito em vez de exigir que o cliente adivinhe.
 */
async function alterarUsuario(req, res) {
  const { username } = req.body || {};

  const erro = validarUsername(username);
  if (erro) {
    return res.status(400).json({ error: erro });
  }
  const novoNome = username.trim();

  const user = await User.findByPk(req.userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  if (novoNome === user.username) {
    return res.json({ token: gerarToken(user), user: publico(user) });
  }

  const emUso = await User.findOne({ where: { username: novoNome }, attributes: ['id'] });
  if (emUso) {
    return res.status(409).json({ error: 'Este nome de usuário já está em uso' });
  }

  user.username = novoNome;
  await user.save();

  return res.json({ token: gerarToken(user), user: publico(user) });
}

/**
 * Troca de senha do proprio usuario autenticado. Limpa a flag de senha
 * provisoria, permitindo que o acesso inicial seja sempre rotacionado.
 */
async function alterarSenha(req, res) {
  const { senhaAtual, novaSenha } = req.body || {};

  if (typeof senhaAtual !== 'string' || typeof novaSenha !== 'string') {
    return res.status(400).json({ error: 'Informe a senha atual e a nova senha' });
  }
  if (novaSenha.length < MIN_SENHA) {
    return res
      .status(400)
      .json({ error: `A nova senha deve ter no mínimo ${MIN_SENHA} caracteres` });
  }
  if (novaSenha === senhaAtual) {
    return res.status(400).json({ error: 'A nova senha deve ser diferente da atual' });
  }

  const user = await User.scope('withPassword').findByPk(req.userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  const senhaCorreta = await user.checkPassword(senhaAtual);
  if (!senhaCorreta) {
    return res.status(401).json({ error: 'Senha atual incorreta' });
  }

  user.password = novaSenha;
  user.must_change_password = false;
  // A senha real substitui o codigo inicial: a validade de 5 minutos deixa
  // de valer para sempre e o numero sorteado e descartado.
  user.senha_expira_em = null;
  user.codigo = null;
  await user.save();

  // Reemite o token para manter os dados em sincronia (novo estado de senha).
  return res.json({ token: gerarToken(user), user: publico(user) });
}

/**
 * O jogador escolhe se o proprio ranking solo aparece para os outros. A
 * preferencia e por conta: o admin nao altera isso, e o campeonato nunca e
 * afetado, porque la a pontuacao so existe dentro da partida em si.
 */
async function definirVisibilidadeRanking(req, res) {
  const { publico: novoValor } = req.body || {};
  if (typeof novoValor !== 'boolean') {
    return res.status(400).json({ error: 'Envie "publico" como verdadeiro ou falso' });
  }

  const user = await User.findByPk(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  user.ranking_publico = novoValor;
  await user.save();

  return res.json({ sucesso: true, usuario: publico(user) });
}

module.exports = {
  login,
  me,
  alterarUsuario,
  alterarSenha,
  definirVisibilidadeRanking,
  gerarToken,
  publico,
  validarUsername,
};
