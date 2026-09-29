/** Normaliza texto para comparar respostas sem diferenca de espacos, acentos ou maiusculas. */
function normalizar(texto) {
  return String(texto ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR');
}

module.exports = { normalizar };
