/**
 * Quantos saltos de proxy o Express deve confiar.
 *
 * O `app.set('trust proxy', ...)` decide de onde vem o `req.ip`, e o `req.ip`
 * e a chave de TODOS os limiters de requisicao. A leitura ingênua
 * (`if (process.env.TRUST_PROXY) { ... }`) tratava "0" como verdadeiro — a
 * string "0" é truthy em JavaScript — e caía no fallback `1`. O efeito era o
 * oposto do pretendido: quem escrevesse `TRUST_PROXY=0` para dizer "estou sem
 * proxy" recebia `trust proxy = 1`, passava a confiar no `X-Forwarded-For`
 * mesmo sem proxy à frente, e qualquer cliente podia escolher o próprio
 * `req.ip` mandando aquele header. Todos os limites por IP (login inclusive)
 * ficavam desarmados.
 *
 * Aqui a decisão é explícita: ausência, "0", "false" e "no" significam
 * "não confiar em ninguém", que é o padrão seguro.
 */

/** Valores que o `.env` usa para dizer "não confie em proxy nenhum". */
const NEGATIVOS = new Set(['', '0', 'false', 'no', 'off', 'n', 'nao', 'não']);

/**
 * @param {string|undefined|null} valor o valor cru de `TRUST_PROXY`
 * @returns {number|false} o número de saltos, ou `false` para não definir
 */
function saltosDeProxy(valor) {
  const bruto = String(valor ?? '').trim().toLowerCase();
  if (NEGATIVOS.has(bruto)) return false;

  const saltos = Number(bruto);
  if (!Number.isFinite(saltos) || saltos <= 0) return false;
  return saltos;
}

/**
 * Aplica a configuração no app. Separado de `app.js` para que a leitura do
 * ambiente possa ser testada sem subir o Express inteiro.
 */
function configurarTrustProxy(app, ambiente = process.env) {
  const saltos = saltosDeProxy(ambiente.TRUST_PROXY);
  if (saltos !== false) app.set('trust proxy', saltos);
  return saltos;
}

module.exports = { saltosDeProxy, configurarTrustProxy, NEGATIVOS };
