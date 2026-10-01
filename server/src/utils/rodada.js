/**
 * Token de rodada.
 *
 * Antes, `POST /api/pontuacoes` aceitava QUALQUER lista de `perguntaId` e o
 * gabarito vinha inteiro dentro de `GET /api/perguntas`. Juntando as duas
 * coisas, uma unica requisicao entregava todas as respostas corretas e a
 * seguinte gravava uma partida perfeita com 50 acertos — e as duas se
 * repetiam indefinidamente.
 *
 * O token de rodada fecha essa porta em tres passos:
 *
 *  1. `GET /api/perguntas` entrega as perguntas SEM o gabarito e emite um
 *     token assinado contendo o usuario e os ids realmente servidos;
 *  2. `POST /api/perguntas/responder` devolve o veredito de UMA pergunta
 *     (o jogador precisa do feedback immediate), sempre contra o token;
 *  3. `POST /api/pontuacoes` so aceita perguntas que estavam no token, e o
 *     token e de uso unico: uma rodada nao pode virar partida infinita.
 *
 * O token nao carrega segredo nenhum alem do proprio HMAC: ele prova
 * origem, nao concede acesso.
 */

const crypto = require('crypto');

/** Tempo de vida de uma rodada: uma partida dura bem menos que isso. */
const VALIDADE_MINUTOS = 30;

/** Teto de rodadas emitidas guardadas em memoria (evita crescimento sem fim). */
const MAXIMO_REGISTRO = 5000;

/** nonce -> instante de expiracao (ms). Rodadas ja usadas sao marcadas aqui. */
const usadas = new Map();

/**
 * Chave separada da do JWT: mesmo segredo, dominio diferente. Assim um token
 * de rodada nunca pode ser reapresentado como token de sessao (e vice-versa).
 */
function segredoDeRodada() {
  return crypto
    .createHash('sha256')
    .update(`rodada:v1:${process.env.JWT_SECRET || ''}`)
    .digest();
}

function assinar(conteudo) {
  return crypto.createHmac('sha256', segredoDeRodada()).update(conteudo).digest();
}

/** Compara sem vazar tempo de resposta. */
function igual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function varreExpiradas() {
  const agora = Date.now();
  for (const [nonce, expira] of usadas) {
    if (expira <= agora) usadas.delete(nonce);
  }
}

/**
 * Emite o token de uma rodada.
 *
 * @param {number} userId usuario a quem a rodada pertence
 * @param {Array<{id:number}>} perguntas perguntas realmente servidas
 * @returns {string} `payload.assinatura`, ambos em base64url
 */
function criarRodada(userId, perguntas) {
  const payload = {
    u: Number(userId),
    p: perguntas.map((p) => Number(p.id ?? p)),
    n: crypto.randomBytes(12).toString('hex'),
    e: Date.now() + VALIDADE_MINUTOS * 60 * 1000,
  };
  const corpo = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${corpo}.${assinar(corpo).toString('base64url')}`;
}

/**
 * Le e valida o token.
 *
 * @returns {{ok:true, ids:Set<number>} | {ok:false, motivo:string}}
 */
function lerRodada(token, userId) {
  if (typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, motivo: 'Rodada invalida ou ausente.' };
  }

  const [corpo, assinatura] = token.split('.');
  if (!corpo || !assinatura) {
    return { ok: false, motivo: 'Rodada invalida ou ausente.' };
  }
  if (!igual(assinatura, assinar(corpo).toString('base64url'))) {
    return { ok: false, motivo: 'Rodada invalida ou ausente.' };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, motivo: 'Rodada invalida ou ausente.' };
  }

  if (!payload || Number(payload.u) !== Number(userId)) {
    // Token de outra conta: tratado como invalido, sem dizer qual foi o motivo.
    return { ok: false, motivo: 'Rodada invalida ou ausente.' };
  }
  if (!Number.isFinite(payload.e) || payload.e <= Date.now()) {
    return { ok: false, motivo: 'A rodada expirou. Recarregue as perguntas.' };
  }
  if (!Array.isArray(payload.p) || payload.p.length === 0) {
    return { ok: false, motivo: 'Rodada invalida ou ausente.' };
  }

  return { ok: true, ids: new Set(payload.p.map(Number)), nonce: payload.n };
}

/** A rodada ja foi pontuada? */
function rodadaUsada(nonce) {
  if (typeof nonce !== 'string') return false;
  varreExpiradas();
  const expira = usadas.get(nonce);
  return Boolean(expira && expira > Date.now());
}

/**
 * Consome a rodada: a partir daqui ela nao vale mais para pontuar.
 * Rodadas esquecidas sao expuradas por `varreExpiradas`.
 */
function marcarRodadaUsada(nonce) {
  if (typeof nonce !== 'string') return;
  varreExpiradas();
  usadas.set(nonce, Date.now() + VALIDADE_MINUTOS * 60 * 1000);
  while (usadas.size > MAXIMO_REGISTRO) {
    const maisAntigo = usadas.keys().next().value;
    usadas.delete(maisAntigo);
  }
}

/** Zera o registro. Usado apenas pelos testes. */
function limparRodadas() {
  usadas.clear();
}

module.exports = {
  VALIDADE_MINUTOS,
  criarRodada,
  lerRodada,
  rodadaUsada,
  marcarRodadaUsada,
  limparRodadas,
};