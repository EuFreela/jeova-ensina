const crypto = require('crypto');

// Sem caracteres ambiguos (I, l, O, 0, 1) para facilitar a digitacao.
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/**
 * Gera uma senha aleatoria criptograficamente segura.
 * Usada para a senha inicial do admin e para usuarios criados pelo admin.
 *
 * A escolha aqui e por rejection sampling, nao por `bytes[i] % CHARSET.length`.
 * O alfabeto tem 57 caracteres e um byte tem 256 valores: `256 % 57 === 28`,
 * entao os 28 primeiros caracteres saiam 5 vezes em 256 e os outros 29 saiam
 * 4 — os primeiros saiam 25% mais vezes do que deveriam. Nao e um crash
 * imediato, mas e uma senha com menos entropia do que o numero de caracteres
 * anuncia, num segredo que existe justamente para ser imprevisivel.
 * `crypto.randomInt` ja faz o descarte dos valores que sobrariam.
 */
function gerarSenha(tamanho = 14) {
  let senha = '';
  for (let i = 0; i < tamanho; i += 1) {
    senha += CHARSET[crypto.randomInt(CHARSET.length)];
  }
  return senha;
}

module.exports = { gerarSenha, CHARSET };
