require('dotenv').config();
const sequelize = require('../config/database');
const { migrarColunas } = require('./migracoes');

const User = require('../models/User');
const { gerarSenha } = require('../utils/senha');

/**
 * Cria (ou reseta) a conta de administrador e imprime a senha uma unica vez.
 *
 * As migracoes de esquema estao em `migracoes.js`, compartilhadas com
 * `syncModels.js`: aqui rodam porque este script tambem e usado em banco
 * antigo, onde o `sync()` sozinho deixaria colunas faltando.
 */
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
