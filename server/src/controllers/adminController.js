const User = require('../models/User');
const Pontuacao = require('../models/Pontuacao');
const { gerarCodigo, codigoValido, expirarCodigo, VALIDADE_CODIGO_MINUTOS } = require('../utils/codigo');
const { publico, validarUsername } = require('./authController');

const PAPEIS = ['player', 'admin'];

async function listarUsuarios(req, res) {
  const usuarios = await User.findAll({
    order: [['created_at', 'DESC']],
  });

  return res.json({ usuarios: usuarios.map(publico) });
}

/**
 * Codigo de 4 digitos unico entre os usuarios. Com apenas 10.000 combinações
 * possibles, sorteia novamente enquanto o numero ja estiver em uso.
 */
async function codigoInicialUnico(forcar = null) {
  if (codigoValido(forcar)) {
    const emUso = await User.findOne({ where: { codigo: forcar } });
    if (!emUso) return forcar;
  }
  for (let tentativa = 0; tentativa < 200; tentativa += 1) {
    const candidato = gerarCodigo();
     
    const emUso = await User.findOne({ where: { codigo: candidato } });
    if (!emUso) return candidato;
  }
  throw new Error('Não foi possível gerar um código de 4 dígitos único');
}

/**
 * Cria um usuario cujo acesso inicial e um CODIGO de 4 digitos (no lugar da
 * senha antiga), valido por 5 minutos. O texto puro volta UMA UNICA VEZ nesta
 * resposta: no banco fica apenas o hash.
 *
 * O admin pode enviar um codigo proprio; se nao vier, o sistema sorteia um.
 */
async function criarUsuario(req, res) {
  const { username, role, codigo } = req.body || {};

  const erro = validarUsername(username);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  if (codigo != null && codigo !== '' && !codigoValido(String(codigo).trim())) {
    return res.status(400).json({ error: 'Código deve ter exatamente 4 dígitos' });
  }

  const papel = PAPEIS.includes(role) ? role : 'player';
  const nome = username.trim();

  const existente = await User.findOne({ where: { username: nome } });
  if (existente) {
    return res.status(409).json({ error: 'Nome de usuário já está em uso' });
  }

  const codigoGerado = await codigoInicialUnico(
    codigo != null && codigo !== '' ? String(codigo).trim() : null
  );

  try {
    const user = await User.create({
      username: nome,
      // O codigo de 4 digitos E a senha inicial.
      password: codigoGerado,
      codigo: codigoGerado,
      senha_expira_em: expirarCodigo(),
      role: papel,
      must_change_password: true,
    });

    return res.status(201).json({
      usuario: publico(user),
      // Atencao: exibido apenas uma vez. Nao e armazenado em texto puro.
      codigoInicial: codigoGerado,
      validadeMinutos: VALIDADE_CODIGO_MINUTOS,
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Nome de usuário já está em uso' });
    }
    throw err;
  }
}

/**
 * Exclui um usuario e o historico de pontuacoes dele.
 *
 * Protecoes:
 * - nao permite excluir a propria conta;
 * - nao permite remover o ultimo administrador do sistema;
 * - o historico e apagado junto para nao deixar pontuacoes de um id
 *   que nao existe mais (o FK de pontuacoes impede a exclusao do usuario).
 */
async function excluirUsuario(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador inválido' });
  }
  if (id === req.userId) {
    return res.status(400).json({ error: 'Você não pode excluir a própria conta' });
  }

  const usuario = await User.findByPk(id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  if (usuario.role === 'admin') {
    const outrosAdmins = await User.count({ where: { role: 'admin' } });
    if (outrosAdmins <= 1) {
      return res.status(400).json({ error: 'Não é possível excluir o único administrador' });
    }
  }

  await Pontuacao.destroy({ where: { user_id: id } });
  await usuario.destroy();

  return res.json({ sucesso: true, usuario: publico(usuario) });
}

/**
 * Zera toda a pontuacao de um usuario (ranking Solo e Campeonato),
 * sem mexer na conta nem na senha.
 */
async function zerarPontuacao(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador inválido' });
  }

  const usuario = await User.findByPk(id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const removidas = await Pontuacao.destroy({ where: { user_id: id } });

  return res.json({
    sucesso: true,
    usuario: publico(usuario),
    pontuacoesRemovidas: removidas,
  });
}

/**
 * Gera um novo codigo de 4 digitos para um usuario existente, reiniciando a
 * validade de 5 minutos. Usado pelo botao de atualizar da tela de criacao.
 */
async function atualizarCodigo(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador inválido' });
  }

  const usuario = await User.findByPk(id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Regerar o codigo sobrescreve a senha. So e permitido enquanto o
  // usuario ainda usa a credencial inicial (nunca depois da troca).
  if (!usuario.must_change_password) {
    return res.status(409).json({
      error: 'Este usuário já trocou a senha inicial e não pode receber um novo código.',
    });
  }

  const codigoGerado = await codigoInicialUnico();
  usuario.password = codigoGerado;
  usuario.codigo = codigoGerado;
  usuario.senha_expira_em = expirarCodigo();
  usuario.must_change_password = true;
  await usuario.save();

  return res.json({
    usuario: publico(usuario),
    codigoInicial: codigoGerado,
    validadeMinutos: VALIDADE_CODIGO_MINUTOS,
  });
}

module.exports = {
  listarUsuarios,
  criarUsuario,
  excluirUsuario,
  zerarPontuacao,
  atualizarCodigo,
};
