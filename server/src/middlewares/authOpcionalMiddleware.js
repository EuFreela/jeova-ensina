const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ALGORITMO } = require('../controllers/authController');

/**
 * Igual ao authMiddleware, mas nao bloqueia a requisicao:
 * se houver um token valido, preenche req.userId para permitir
 * destacações (ex: "sou eu" no ranking). Ausente ou invalido, segue sem usuario.
 *
 * O token de uma conta apagada tambem e descartado aqui, pelo mesmo motivo do
 * authMiddleware: um token so vale enquanto a conta existe.
 */
async function authOpcional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const [esquema, token] = authHeader.split(' ');
  if (esquema !== 'Bearer' || !token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [ALGORITMO] });
    const existe = await User.findByPk(decoded.id, { attributes: ['id'], raw: true });
    if (existe) {
      req.userId = decoded.id;
      req.username = decoded.username;
    }
  } catch {
    /* token ignorado */
  }
  return next();
}

module.exports = authOpcional;
