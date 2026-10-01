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

/**
 * O codigo de 4 digitos E a senha inicial: e o que o admin fala em voz alta
 * e o que o jogador digita no primeiro login. Guardar esse valor em claro na
 * coluna `codigo` significava que um dump do banco, um backup ou uma leitura
 * acidental do banco entregava a senha de acesso de todas as contas
 * provisorias de uma vez.
 *
 * O que fica guardado agora e um HMAC do codigo: determina, continua
 * servindo para o teste de unicidade (mesmo codigo, mesmo HMAC) e nao
 * devolve o codigo para quem le a tabela. Quem so tem o banco em maos fica
 * com hashes, nao com senhas.
 *
 * O segredo do HMAC e o mesmo do JWT, com um prefixo de dominio para que um
 * valor daqui nunca possa ser reapresentado como token de sessao.
 */
function guardar(codigo) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || '')
    .update(`codigo-inicial:v1:${codigo}`)
    .digest('hex');
}

/** O HMAC do codigo, ou null se o codigo nao tiver o formato esperado. */
function guardarSeguro(codigo) {
  return codigoValido(codigo) ? guardar(codigo) : null;
}

module.exports = {
  TAMANHO_CODIGO,
  VALIDADE_CODIGO_MINUTOS,
  gerarCodigo,
  codigoValido,
  expirarCodigo,
  codigoExpirou,
  guardar,
  guardarSeguro,
};
