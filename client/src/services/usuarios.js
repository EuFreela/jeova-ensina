import api from './api';

/** Lista os usuarios cadastrados (requer perfil admin). */
export async function listarUsuarios() {
  const { data } = await api.get('/admin/usuarios');
  return data.usuarios || [];
}

/**
 * Cria um usuario com um codigo de 4 digitos gerado no servidor.
 * Retorna { usuario, codigoInicial, validadeMinutos }. O codigo e a senha
 * inicial: vale por 5 minutos e so aparece nesta resposta.
 */
export async function criarUsuario({ username, role }) {
  const { data } = await api.post('/admin/usuarios', { username, role });
  return data;
}

/**
 * Exclui um usuario e o historico de pontuacoes (requer perfil admin).
 * O servidor impede a exclusao da propria conta e do ultimo admin.
 */
/** Gera um novo código de 4 dígitos e reinicia a validade de 5 minutos. */
export async function atualizarCodigo(id) {
  const { data } = await api.post(`/admin/usuarios/${id}/codigo`);
  return data;
}

export async function excluirUsuario(id) {
  const { data } = await api.delete(`/admin/usuarios/${id}`);
  return data;
}

/** Zera toda a pontuação do usuário (rankings Solo e Campeonato). */
export async function zerarPontuacao(id) {
  const { data } = await api.delete(`/admin/usuarios/${id}/pontuacoes`);
  return data;
}
