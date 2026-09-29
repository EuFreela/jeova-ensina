require('dotenv').config();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

require('../models/User');
require('../models/Pergunta');
require('../models/Pontuacao');

const User = require('../models/User');
const { gerarSenha } = require('../utils/senha');
const { gerarCodigo } = require('../utils/codigo');

/**
 * Garante as colunas novas em bancos ja existentes (SQLite/Postgres),
 * sem recriar tabelas nem perder dados.
 *
 * Precisa rodar ANTES do sequelize.sync(): o modelo Pontuacao declara um
 * indice sobre pontuacoes.modo, e o sync tenta criar esse indice em um banco
 * antigo onde a coluna ainda nao existe.
 */
async function migrarColunas() {
  const qi = sequelize.getQueryInterface();
  const tabelas = (await qi.showAllTables()).map(String);

  if (tabelas.includes('users')) {
    const descricao = await qi.describeTable('users');

    if (!descricao.role) {
      await qi.addColumn('users', 'role', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'player',
      });
      console.log('Coluna users.role adicionada.');
    }

    if (!descricao.must_change_password) {
      await qi.addColumn('users', 'must_change_password', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
      console.log('Coluna users.must_change_password adicionada.');
    }

    if (!descricao.senha_expira_em) {
      await qi.addColumn('users', 'senha_expira_em', {
        type: DataTypes.DATE,
        allowNull: true,
      });
      console.log('Coluna users.senha_expira_em adicionada.');
    }

    // Codigo curto de 4 digitos por usuario (identificador, nao login).
    if (!descricao.codigo) {
      // O SQLite nao aceita UNIQUE em ADD COLUMN: a coluna entra simples e a
      // unicidade vem como indice, criada logo abaixo.
      await qi.addColumn('users', 'codigo', {
        type: DataTypes.STRING(4),
        allowNull: true,
      });
      await qi.addIndex('users', ['codigo'], {
        name: 'users_codigo_unique',
        unique: true,
      });
      console.log('Coluna users.codigo adicionada (com indice unico).');
    }

    // Garante que nenhuma conta fique sem codigo (contas criadas antes da
    // coluna existirem). Com 10.000 combinacoes, sorts enquanto colide.
    const semCodigo = await User.findAll({ where: { codigo: null } });
    for (const usuario of semCodigo) {
      let sorteado = null;
      for (let tentativa = 0; tentativa < 200 && !sorteado; tentativa += 1) {
        const candidato = gerarCodigo();
        // eslint-disable-next-line no-await-in-loop
        const emUso = await User.findOne({ where: { codigo: candidato } });
        if (!emUso) sorteado = candidato;
      }
      if (sorteado) {
        usuario.codigo = sorteado;
        // eslint-disable-next-line no-await-in-loop
        await usuario.save();
      }
    }
    if (semCodigo.length) {
      console.log(`Codigo de 4 digitos gerado para ${semCodigo.length} usuario(s).`);
    }
  }

  // Rankings separados: 'solo' e 'campeonato'.
  if (tabelas.includes('pontuacoes')) {
    const descricao = await qi.describeTable('pontuacoes');

    if (!descricao.modo) {
      await qi.addColumn('pontuacoes', 'modo', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'solo',
      });
      console.log('Coluna pontuacoes.modo adicionada (partidas antigas contam como solo).');
    }
  }
}

async function main() {
  await sequelize.authenticate();
  // Colunas primeiro, sync depois (o sync cria o indice de pontuacoes.modo).
  await migrarColunas();
  await sequelize.sync();
  await migrarColunas();

  const username = (process.env.ADMIN_USERNAME || 'admin').trim();
  const resetar = process.argv.includes('--reset');

  const existente = await User.findOne({ where: { role: 'admin' } });

  if (existente && !resetar) {
    console.log(`\nJa existe um administrador: "${existente.username}".`);
    console.log('Para gerar uma nova senha, rode: npm run criar:admin -- --reset\n');
    await sequelize.close();
    process.exit(0);
  }

  const senha = gerarSenha();
  let admin;

  if (existente) {
    existente.password = senha;
    existente.must_change_password = true;
    await existente.save();
    admin = existente;
  } else {
    admin = await User.create({
      username,
      password: senha,
      role: 'admin',
      must_change_password: true,
    });
  }

  const linha = '='.repeat(60);
  console.log(`\n${linha}`);
  console.log('  SENHA DO ADMINISTRADOR - exibida apenas uma vez');
  console.log(linha);
  console.log(`  Usuario: ${admin.username}`);
  console.log(`  Senha:   ${senha}`);
  console.log(linha);
  console.log('  Guarde agora: ela nao sera mostrada novamente.');
  console.log('  No primeiro acesso o sistema pedira a troca da senha.');
  console.log(`${linha}\n`);

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro ao criar o administrador:', err);
  process.exit(1);
});
