const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

/**
 * RBAC: exige que o usuario autenticado seja administrador.
 * Consulta o banco (e nao apenas o token) para que revogacoes de acesso
 * tenham efeito imediato.
 */
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    req.userRole = user.role;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
