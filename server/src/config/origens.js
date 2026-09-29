/**
 * Origens liberadas para CORS (HTTP e WebSocket).
 *
 * Configuracao em CLIENT_URL (separada por virgula). Cada item pode usar "*"
 * como curinga, por exemplo: http://192.168.*:5173
 *
 * Em desenvolvimento a rede local e liberada automaticamente
 * (localhost, 127.0.0.1, ::1, 10.x, 172.16-31.x, 192.168.x e *.local),
 * para que o jogo possa ser aberto pelo celular ou por outro computador
 * da mesma rede. Em producao isso fica DESLIGADO e so vale a lista
 * explicita de CLIENT_URL.
 */

const LOCAIS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);

/** Hosts de rede domestica/private, para o modo de desenvolvimento. */
function ehRedePrivada(host) {
  const h = String(host).toLowerCase();
  if (LOCAIS.has(h)) return true;
  if (h.endsWith('.local')) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

/** A rede local so entra quando NODE_ENV != production (ou CORS_LAN=true). */
function redeLocalLiberada() {
  if (String(process.env.CORS_LAN).toLowerCase() === 'true') return true;
  if (String(process.env.CORS_LAN).toLowerCase() === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

function origensPermitidas() {
  return (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Compara a origem com um item da lista, aceitando "*" como curinga. */
function casaItem(origin, item) {
  if (item === '*') return true;
  if (item === origin) return true;
  if (!item.includes('*')) return false;
  const padrao = item.split('*').map(escaparRegex).join('.*');
  return new RegExp(`^${padrao}$`).test(origin);
}

function origemLiberada(origin) {
  // Chamadas sem Origin (curl, apps nativos, mesmo host) nao sao bloqueio de CORS.
  if (!origin) return true;

  const permitidas = origensPermitidas();
  if (permitidas.some((item) => casaItem(origin, item))) return true;

  if (!redeLocalLiberada()) return false;

  try {
    const { protocol, hostname } = new URL(origin);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(protocol)) return false;
    return ehRedePrivada(hostname);
  } catch {
    return false;
  }
}

module.exports = { origensPermitidas, origemLiberada, ehRedePrivada };
