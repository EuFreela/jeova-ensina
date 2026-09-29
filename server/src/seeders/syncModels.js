const sequelize = require('../config/database');

require('../models/User');
require('../models/Pergunta');
require('../models/Pontuacao');

/**
 * sync() sozinho nao cria coluna nova em tabela que ja existe, entao as
 * opcoes adicionadas depois do primeiro deploy precisam de um ALTER.
 * Cada item e aditivo e idempotente: rodar varias vezes nao quebra.
 */
const COLUNAS_NOVAS = [
  { tabela: 'users', coluna: 'ranking_publico', tipo: 'BOOLEAN NOT NULL DEFAULT 1' },
];

async function aplicarColunasNovas() {
  const existentes = new Set(
    sequelize.options.dialect === 'sqlite'
      ? (await sequelize.query('PRAGMA table_info(users)'))[0].map((c) => c.name)
      : (
          await sequelize.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'",
            { type: sequelize.QueryTypes.SELECT }
          )
        ).map((c) => c.column_name)
  );

  for (const { tabela, coluna, tipo } of COLUNAS_NOVAS) {
    if (existentes.has(coluna)) continue;
    await sequelize.query(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${tipo}`);
    console.log(`Coluna ${tabela}.${coluna} adicionada.`);
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await aplicarColunasNovas();
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
