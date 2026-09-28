const jwt = require('jsonwebtoken');

/**
 * Igual ao authMiddleware, mas nao bloqueia a requisicao:
 * se houver um token valido, preenche req.userId para permitir
 * destacações (ex: "sou eu" no ranking). Ausente ou invalido, segue sem usuario.
 */
function authOpcional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const [, token] = authHeader.split(' ');
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.username = decoded.username;
  } catch {
    /* token ignorado */
  }
  return next();
}

module.exports = authOpcional;
