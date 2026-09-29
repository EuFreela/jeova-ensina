const crypto = require('crypto');

// Sem caracteres ambiguos (I, l, O, 0, 1) para facilitar a digitacao.
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/**
 * Gera uma senha aleatoria criptograficamente segura.
 * Usada para a senha inicial do admin e para usuarios criados pelo admin.
 */
function gerarSenha(tamanho = 14) {
  const bytes = crypto.randomBytes(tamanho);
  let senha = '';
  for (let i = 0; i < tamanho; i += 1) {
    senha += CHARSET[bytes[i] % CHARSET.length];
  }
  return senha;
}

module.exports = { gerarSenha };
