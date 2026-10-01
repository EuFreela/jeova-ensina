require('dotenv').config();
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

require('../models/User');
require('../models/Pergunta');
require('../models/Pontuacao');

const User = require('../models/User');
const { guardarSeguro } = require('../utils/codigo');

/**
 * Migracoes de esquema e de dados.
 *
 * `sequelize.sync()` cria tabelas novas, mas em uma tabela que JA EXISTE ele
 * nao adiciona coluna nenhuma. Todo campo novo precisa de um ALTER explicito,
 * e por isso esta mora num lugar so.
 *
 * Este arquivo e o unico lugar que conhece o ALTER. Antes as colunas estavam
 * divididas entre `criarAdmin.js` e `syncModels.js`, e cada um conhecia um
 * subconjunto: rodar o script errado deixava o servidor quebrado em boot, com
 * `SELECT` de uma coluna que o banco nao tem. Os dois chamam `migrarColunas`.
 *
 * Idempotente de proposito: os dois scripts podem rodar em qualquer ordem,
 * quantas vezes forem, sem efeito colateral.
 */

/** Colunas de `users`, com o ALTER de cada uma. */
const COLUNAS_USERS = [
  {
    coluna: 'role',
    def: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'player' },
    aviso: 'Coluna users.role adicionada.',
  },
  {
    coluna: 'must_change_password',
    def: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    aviso: 'Coluna users.must_change_password adicionada.',
  },
  {
    coluna: 'senha_expira_em',
    def: { type: DataTypes.DATE, allowNull: true },
    aviso: 'Coluna users.senha_expira_em adicionada.',
  },
  {
    // Coluna legacy: nenhuma escrita nova usa esta, ver `utils/codigo.js`.
    coluna: 'codigo',
    def: { type: DataTypes.STRING(4), allowNull: true },
    indice: { name: 'users_codigo_unique', unique: true },
    aviso: 'Coluna users.codigo adicionada (com indice unico).',
  },
  {
    // HMAC do codigo inicial. Ver `migrarCodigosEmClaro` e o comentario em
    // `models/User.js`: a credencial em texto puro nao pode continuar na tabela.
    coluna: 'codigo_guardado',
    def: { type: DataTypes.STRING(64), allowNull: true },
    indice: { name: 'users_codigo_guardado_unique', unique: true },
    aviso: 'Coluna users.codigo_guardado adicionada (com indice unico).',
  },
  {
    coluna: 'ranking_publico',
    def: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    aviso: 'Coluna users.ranking_publico adicionada.',
  },
];

/** Colunas de `pontuacoes`. */
const COLUNAS_PONTUACOES = [
  {
    coluna: 'modo',
    def: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'solo' },
    aviso: 'Coluna pontuacoes.modo adicionada (partidas antigas contam como solo).',
  },
];

/**
 * Garante as colunas novas em bancos ja existentes (SQLite/Postgres),
 * sem recriar tabelas nem perder dados.
 *
 * Precisa rodar ANTES do `sequelize.sync()` quando a tabela ainda existe: o
 * modelo Pontuacao declara um indice sobre `pontuacoes.modo`, e o sync tenta
 * criar esse indice em um banco antigo onde a coluna ainda nao existe.
 */
async function migrarColunas() {
  const qi = sequelize.getQueryInterface();
  const tabelas = (await qi.showAllTables()).map(String);

  if (tabelas.includes('users')) {
    await aplicar(qi, 'users', COLUNAS_USERS);
    await migrarCodigosEmClaro();
  }

  if (tabelas.includes('pontuacoes')) {
    await aplicar(qi, 'pontuacoes', COLUNAS_PONTUACOES);
  }
}

/**
 * Cria as colunas de uma tabela que ainda nao existem.
 *
 * O SQLite nao aceita UNIQUE em ADD COLUMN: a coluna entra simples e a
 * unicidade vem como indice, criado logo em seguida.
 */
async function aplicar(qi, tabela, definicoes) {
  const descricao = await qi.describeTable(tabela);

  for (const { coluna, def, indice, aviso } of definicoes) {
    if (!descricao[coluna]) {
      await qi.addColumn(tabela, coluna, def);
      console.log(aviso);
      descricao[coluna] = def;
    }
    if (indice && !(await temIndice(qi, tabela, indice.name))) {
      await qi.addIndex(tabela, [coluna], indice);
      console.log(`Indice ${indice.name} criado.`);
    }
  }
}

/**
 * O indice ja existe?
 *
 * `showIndex` devolve a LISTA de indices da tabela e nao lanca quando o nome
 * procurado nao esta la — o segundo argumento e apenas um filtro. Filtrar pelo
 * nome dentro da lista e o que evita tanto recriar um indice existente (erro
 * na segunda execucao) quanto pular a criacao de um que falta.
 */
async function temIndice(qi, tabela, nome) {
  const indices = await qi.showIndex(tabela);
  return indices.some((i) => i.name === nome);
}

/**
 * Converte os codigos iniciais gravados em texto puro para HMAC.
 *
 * O codigo de 4 digitos E a senha da conta. Ate aqui ele ficava gravado em
 * claro na coluna `codigo` — e qualquer leitura do banco (dump, backup, uma
 * consulta de suporte) entregava a senha de acesso de todas as contas que
 * ainda nao tinham trocado a senha.
 *
 * O que passa a ser gravado e `codigo_guardado`: um HMAC-SHA256 do codigo.
 * Ele continua deterministico — mesmo codigo, mesmo HMAC — entao o teste de
 * unicidade de 10.000 combinacoes funciona igual, mas quem le a tabela fica
 * com hashes em vez de senhas.
 *
 * Idempotente: uma conta ja convertida tem `codigo = NULL` e nao entra na
 * busca, entao rodar a migracao de novo nao muda nada.
 */
async function migrarCodigosEmClaro() {
  const qi = sequelize.getQueryInterface();
  const descricao = await qi.describeTable('users');
  if (!descricao.codigo || !descricao.codigo_guardado) return;

  const emClaro = await User.findAll({
    where: { codigo: { [Op.ne]: null } },
    attributes: ['id', 'codigo', 'codigo_guardado'],
  });
  if (emClaro.length === 0) return;

  let convertidos = 0;
  for (const usuario of emClaro) {
    const hmac = guardarSeguro(usuario.codigo);
    if (!hmac || usuario.codigo_guardado === hmac) continue;

    await User.update(
      { codigo_guardado: hmac, codigo: null },
      { where: { id: usuario.id }, validate: false, hooks: false }
    );
    convertidos += 1;
  }

  if (convertidos > 0) {
    console.log(`${convertidos} codigo(s) inicial(is) migrado(s) de texto puro para HMAC.`);
  }
}

module.exports = { migrarColunas, migrarCodigosEmClaro };
