const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ALGORITMO } = require('../controllers/authController');

/**
 * Autentica por `Authorization: Bearer <jwt>`.
 *
 * Alem de conferir a assinatura, o middleware consulta o banco e exige que a
 * conta ainda exista. Sem essa consulta, excluir um jogador nao tirava o
 * acesso dele: o tokencontinuava assinado e valido por ate 7 dias, e o
 * jogador excluido ainda conseguia ler as perguntas e escrever em
 * `POST /api/pontuacoes`. Consultar o banco e o mesmo trabalho que
 * `requireAdmin` ja fazia, entao nao ha custo novo de desenho.
 *
 * O efeito colateral desejado: uma conta apagada pelo admin perde o acesso
 * no proximo request, sem esperar o token expirar.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [esquema, token] = authHeader.split(' ');
  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [ALGORITMO] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }

  const user = await User.findByPk(decoded.id, { attributes: ['id'] });
  if (!user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  req.userId = decoded.id;
  req.username = decoded.username;
  return next();
}

/**
 * RBAC: exige que o usuario autenticado seja administrador.
 * Consulta o banco (e nao apenas o token) para que revogacoes de acesso
 * tenham efeito imediato.
 */
async function requireAdmin(req, res, next) {
  const user = await User.findByPk(req.userId, { attributes: ['id', 'role'] });
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  return next();
}

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
