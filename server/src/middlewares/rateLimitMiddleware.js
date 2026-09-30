const rateLimit = require('express-rate-limit');

/**
 * Todos os limiters contam por `req.ip`. Atras de um proxy reverso (Render,
 * Railway, Vercel) o `app.set('trust proxy')` em app.js e obrigatorio:
 * sem ele todo mundo cai no mesmo contador e um atacante bloqueia o
 * acesso de todos. Ver `TRUST_PROXY` no .env.example.
 *
 * Cada teto pode ser ajustado por ambiente (LIMITE_LOGIN, LIMITE_SENHA,
 * LIMITE_ADMIN, LIMITE_PONTUACAO, LIMITE_GERAL) sem mexer no codigo.
 */

/** Le um teto do ambiente, caindo no padrao quando ausente ou invalido. */
function teto(nome, padrao) {
  const bruto = Number(process.env[nome]);
  return Number.isFinite(bruto) && bruto > 0 ? bruto : padrao;
}

const JANELA_15MIN = 15 * 60 * 1000;
const JANELA_1MIN = 60 * 1000;

const authLimiter = rateLimit({
  windowMs: JANELA_15MIN,
  max: teto('LIMITE_LOGIN', 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

/**
 * Troca de senha valida a senha atual a cada chamada, entao precisa de
 * limite proprio: o geral (300/min) deixaria brute-force de senha viavel.
 */
const senhaLimiter = rateLimit({
  windowMs: JANELA_15MIN,
  max: teto('LIMITE_SENHA', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de troca de senha. Aguarde alguns minutos.' },
});

/**
 * Rotas de admin criam e apagam contas. O alvo e um ambiente pequeno e
 * familiar, entao o teto e bem mais apertado que o do jogador comum.
 */
const adminLimiter = rateLimit({
  windowMs: JANELA_15MIN,
  max: teto('LIMITE_ADMIN', 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas operações administrativas. Aguarde alguns minutos.' },
});

/**
 * Salvar pontuacao e a unica escrita que mexe no ranking. O jogador joga
 * varias partidas seguidas, entao o teto e por partida e nao por tempo.
 */
const pontuacaoLimiter = rateLimit({
  windowMs: JANELA_1MIN,
  max: teto('LIMITE_PONTUACAO', 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas pontuações enviadas. Aguarde um instante.' },
});

const geralLimiter = rateLimit({
  windowMs: JANELA_1MIN,
  max: teto('LIMITE_GERAL', 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde um instante.' },
});

module.exports = { authLimiter, senhaLimiter, adminLimiter, pontuacaoLimiter, geralLimiter };