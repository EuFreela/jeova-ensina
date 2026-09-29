const crypto = require('crypto');

/** Codigo curto de 4 digitos, facil de anotar e falar em voz alta. */
const TAMANHO_CODIGO = 4;

/** A senha inicial (o codigo) vale por 5 minutos apos ser gerada. */
const VALIDADE_CODIGO_MINUTOS = 5;

/**
 * Gera um codigo numerico aleatorio usando crypto.randomInt, que evita o
 * vies de modulo que apareceria com `randomBytes() % 10000`.
 */
function gerarCodigo() {
  const min = 10 ** (TAMANHO_CODIGO - 1);
  const max = 10 ** TAMANHO_CODIGO;
  return String(crypto.randomInt(min, max));
}

/** Somente 4 digitos, sem espaco nem sinal. */
function codigoValido(codigo) {
  return typeof codigo === 'string' && new RegExp(`^\\d{${TAMANHO_CODIGO}}$`).test(codigo);
}

/** Data de expiracao do codigo inicial, contada a partir de agora. */
function expirarCodigo() {
  return new Date(Date.now() + VALIDADE_CODIGO_MINUTOS * 60 * 1000);
}

function codigoExpirou(user) {
  if (!user.senha_expira_em) return false;
  return new Date(user.senha_expira_em).getTime() <= Date.now();
}

module.exports = {
  TAMANHO_CODIGO,
  VALIDADE_CODIGO_MINUTOS,
  gerarCodigo,
  codigoValido,
  expirarCodigo,
  codigoExpirou,
};
