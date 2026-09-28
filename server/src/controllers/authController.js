const jwt = require('jsonwebtoken');
const User = require('../models/User');

function gerarToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function validarCredenciais(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return 'Informe usuário e senha';
  }
  if (username.trim().length < 3 || username.trim().length > 50) {
    return 'Nome de usuário deve ter entre 3 e 50 caracteres';
  }
  if (password.length < 6) {
    return 'Senha deve ter no mínimo 6 caracteres';
  }
  return null;
}

async function register(req, res) {
  const { username, password, confirmPassword } = req.body || {};

  const erro = validarCredenciais(username, password);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ error: 'As senhas não conferem' });
  }

  const existente = await User.findOne({ where: { username: username.trim() } });
  if (existente) {
    return res.status(409).json({ error: 'Nome de usuário já está em uso' });
  }

  try {
    const user = await User.create({ username: username.trim(), password });
    return res.status(201).json({
      token: gerarToken(user),
      user: { id: user.id, username: user.username, created_at: user.created_at },
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Nome de usuário já está em uso' });
    }
    throw err;
  }
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

  const senhaCorreta = await user.checkPassword(password);
  if (!senhaCorreta) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  return res.json({
    token: gerarToken(user),
    user: { id: user.id, username: user.username, created_at: user.created_at },
  });
}

async function me(req, res) {
  const user = await User.findByPk(req.userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  const totalPontos = await user.getPontuacoes({ attributes: ['pontuacao'] });
  const soma = totalPontos.reduce((acc, p) => acc + p.pontuacao, 0);
  const recorde = totalPontos.reduce((acc, p) => Math.max(acc, p.pontuacao), 0);

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      created_at: user.created_at,
      recorde,
      pontosTotais: soma,
    },
  });
}

module.exports = { register, login, me, gerarToken };
