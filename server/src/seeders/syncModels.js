const sequelize = require('../config/database');

require('../models/User');
require('../models/Pergunta');
require('../models/Pontuacao');

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
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
