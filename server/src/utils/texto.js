/**
 * Normaliza texto para comparar respostas sem diferenca de espacos ou
 * maiusculas. Nao remove acentos: as opcoes sao escolhidas em botoes, entao
 * nao ha divergencia de acentuacao entre o que o jogador envia e o que esta
 * gravado. Se algum dia a resposta vier digitada, e aqui que a regra de
 * acento precisa ser decidida.
 */
function normalizar(texto) {
  return String(texto ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR');
}

module.exports = { normalizar };
