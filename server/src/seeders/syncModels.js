const sequelize = require('../config/database');
const { migrarColunas } = require('./migracoes');

/**
 * Sincroniza o schema com os modelos.
 *
 * `sequelize.sync()` cria tabelas novas, mas em uma tabela que ja existe ele
 * nao adiciona coluna nenhuma — todo campo novo precisa de um ALTER explicito.
 * Quem faz esses ALTERs e `migracoes.js`, o mesmo que o `criarAdmin.js` usa:
 * assim nao importa qual dos dois scripts o deploy rodar, as colunas ficam
 * todas no lugar.
 *
 * Idempotente: rodar varias vezes nao quebra nem duplica nada.
 */
async function main() {
  try {
    await sequelize.authenticate();
    // Colunas antes do sync: o modelo Pontuacao declara um indice sobre
    // `pontuacoes.modo`, e o sync tenta criar esse indice em um banco antigo
    // onde a coluna ainda nao existe.
    await migrarColunas();
    await sequelize.sync();
    await migrarColunas();
    console.log('Tabelas sincronizadas com sucesso.');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao sincronizar as tabelas:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = sequelize;
